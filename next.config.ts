import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Prevent clickjacking — our pages must never be embedded in iframes
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer information sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enforce HTTPS for 2 years (Vercel already enforces TLS, this hardens the browser cache)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable unused browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

// Derived from the env var (not hardcoded) so next/image also works against
// test/staging Supabase URLs, not just the production project — a hardcoded
// hostname here 500s every page that renders a Supabase-hosted image whenever
// the env var points elsewhere. Media (photos/video) is read from the production
// Supabase project even in local dev (NEXT_PUBLIC_MEDIA_BASE_URL) — only the RSVP
// database (NEXT_PUBLIC_SUPABASE_URL) is swapped for the local Docker stack.
const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = mediaBaseUrl ? new URL(mediaBaseUrl) : null;

// PostHog Cloud serves ingest (us.i.posthog.com) and its session-recording /
// exception-autocapture asset bundles (us-assets.i.posthog.com) from sibling
// subdomains — wildcard the parent domain so both are covered. Derived from
// env like supabaseUrl above, since NEXT_PUBLIC_POSTHOG_HOST can point at a
// self-hosted instance (bare domain, no subdomain split) in some envs.
const posthogAllowedOrigin = (() => {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  try {
    const { hostname } = new URL(host);
    const labels = hostname.split(".");
    return labels.length > 2 ? `https://*.${labels.slice(1).join(".")}` : `https://${hostname}`;
  } catch {
    return "https://*.i.posthog.com";
  }
})();
const mediaOrigin = supabaseUrl?.origin ?? "";

// Photo content (nav panels, timeline, venue) is hotlinked from Unsplash.
const unsplashOrigin = "https://images.unsplash.com";

// 'unsafe-inline' on script/style is a pragmatic tradeoff: Next.js hydration,
// Framer Motion, and Radix UI all inject inline styles/scripts without nonce
// support wired up. Sentry is tunneled through /monitoring (same-origin), so
// only PostHog needs an explicit allowance (script-src for its lazily-loaded
// session-recording bundle, connect-src for event capture). 'unsafe-eval' is
// only added outside production — React's dev-mode debugging (Turbopack HMR,
// stack reconstruction) calls eval(), which it never does in a production build.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${posthogAllowedOrigin}${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${mediaOrigin} ${unsplashOrigin}`,
  `media-src 'self' ${mediaOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${posthogAllowedOrigin}`,
  "frame-src https://www.google.com https://maps.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      ...(supabaseUrl
        ? [
            {
              protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseUrl.hostname,
              port: supabaseUrl.port,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      { protocol: "https" as const, hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, { key: "Content-Security-Policy", value: contentSecurityPolicy }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source map upload requires SENTRY_AUTH_TOKEN
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Tunnel Sentry requests through /monitoring to bypass ad blockers
  tunnelRoute: "/monitoring",
  disableLogger: true,
});
