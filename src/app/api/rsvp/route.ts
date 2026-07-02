import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { createRsvpSchema } from "@/lib/schema";
import { supabaseAdmin, RSVP_TABLE } from "@/lib/supabase";
import { ratelimit } from "@/lib/upstash";
import { sendConfirmationEmail } from "@/lib/email";
import { DEFAULT_LOCALE, isLocale, translate } from "@/lib/i18n";

// The body may carry a `locale` hint (id/en/ja) for translating error messages
// and the confirmation email; it is not part of the persisted RSVP schema.
function resolveLocale(rawBody: unknown) {
  if (rawBody && typeof rawBody === "object" && "locale" in rawBody) {
    const candidate = (rawBody as { locale?: unknown }).locale;
    if (isLocale(candidate)) return candidate;
  }
  return DEFAULT_LOCALE;
}

// Allow only same-origin or the configured production URL
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function corsHeaders(origin: string | null): Record<string, string> {
  // Permit same-origin requests (no Origin header) and the configured domain
  const allowedOrigin =
    !origin || origin === ALLOWED_ORIGIN ? (origin ?? "*") : "null";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  // 1. Parse and validate body first (cheap, no external calls)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: translate(DEFAULT_LOCALE, "form.err.invalidBody") },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const locale = resolveLocale(body);
  const t = (key: string) => translate(locale, key);

  const parsed = createRsvpSchema(t).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: t("form.err.validation"), details: parsed.error.flatten().fieldErrors },
      { status: 422, headers: corsHeaders(origin) }
    );
  }

  // 2. Rate limiting by IP (after validation to avoid hitting Redis for bad requests)
  const headersList = await headers();
  // x-vercel-forwarded-for is set by Vercel's edge proxy and cannot be spoofed by clients
  const ip =
    headersList.get("x-vercel-forwarded-for") ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";

  const { success, remaining } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: t("form.err.rateLimit") },
      {
        status: 429,
        headers: {
          ...corsHeaders(origin),
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  }

  const data = parsed.data;

  // 3. Insert into Supabase
  const { error: dbError } = await supabaseAdmin.from(RSVP_TABLE).insert({
    attend_or_absent: data.attend_or_absent,
    number_of_participants: data.number_of_participants,
    name: data.name,
    email_address: data.email_address,
    age: data.age ?? null,
    postcode: data.postcode || null,
    address: data.address || null,
    phone_number: data.phone_number || null,
    dietary_restrictions: data.dietary_restrictions || null,
    message: data.message || null,
  });

  if (dbError) {
    // Send full details to Sentry; only log the error code to stdout
    Sentry.captureException(new Error(`Supabase RSVP insert failed: ${dbError.code}`), {
      extra: { code: dbError.code, message: dbError.message },
    });
    console.error("[RSVP] DB insert failed — code:", dbError.code);
    return NextResponse.json(
      { error: t("form.err.serverError") },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  // 4. Send confirmation email (non-blocking — don't fail the request if email fails)
  try {
    await sendConfirmationEmail(data, locale);
  } catch (emailError) {
    Sentry.captureException(emailError, { extra: { stage: "resend_email" } });
    console.error("[RSVP] Email send failed:", emailError);
  }

  return NextResponse.json({ success: true }, { status: 201, headers: corsHeaders(origin) });
}
