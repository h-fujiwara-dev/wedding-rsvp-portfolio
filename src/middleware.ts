import { NextRequest, NextResponse } from "next/server";

// Constant-time string comparison to prevent timing attacks
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function middleware(req: NextRequest) {
  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;

  // In production, require credentials to be configured
  if (process.env.NODE_ENV === "production" && (!validUser || !validPass)) {
    return new NextResponse(
      "Admin access not configured — set ADMIN_USERNAME and ADMIN_PASSWORD.",
      { status: 503 }
    );
  }

  // Skip auth in non-production when credentials are not set (local dev convenience)
  if (!validUser || !validPass) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Wedding Admin"' },
    });
  }

  const [username, ...rest] = Buffer.from(authHeader.slice(6), "base64")
    .toString("utf-8")
    .split(":");
  const password = rest.join(":");

  if (!safeEqual(username, validUser) || !safeEqual(password, validPass)) {
    return new NextResponse("Invalid credentials.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Wedding Admin"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
