import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars are not configured.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Server-side admin client (bypasses RLS) — lazily resolved per-call
export const supabaseAdmin = {
  from: (...args: Parameters<SupabaseClient["from"]>) => getSupabaseAdmin().from(...args),
};

// Portfolio branch: same Supabase project as production, but a dedicated table so
// demo RSVP submissions from portfolio visitors never mix with real wedding guest data.
// Schema: supabase/migrations/20260702000000_create_rsvp_portfolio_table.sql
export const RSVP_TABLE = "rsvp_portfolio";

// Schema: supabase/migrations/20260701000000_create_rsvp_table.sql
// Local dev DB (Docker): `npm run dev` runs `supabase start` first, applying migrations automatically.
// Production DB: the real Supabase project, configured via Vercel's environment variables.
