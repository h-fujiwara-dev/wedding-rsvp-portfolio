import { defineConfig, devices } from "@playwright/test";

// Prefer the port where a dev server is already running.
// Override with TEST_PORT env var in CI or when running on a different port.
const PORT = process.env.TEST_PORT ?? "3000";
const BASE_URL = `http://localhost:${PORT}`;

/** Dummy env vars so Next.js boots without external service credentials.
 *  All actual HTTP calls to Supabase / Upstash / Resend are intercepted
 *  via page.route() inside each test.
 */
const TEST_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
  RESEND_API_KEY: "re_test_key",
  UPSTASH_REDIS_REST_URL: "http://localhost:8079",
  UPSTASH_REDIS_REST_TOKEN: "test-token",
  // Admin Basic Auth — test-only credentials (not used in production)
  ADMIN_USERNAME: "test-admin",
  ADMIN_PASSWORD: "test-password",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // ─── Desktop (1280 × 720) — full test suite ──────────────────────────────
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: ["**/rsvp-responsive.spec.ts"],
    },

    // ─── Mobile (375 × 667 — iPhone SE) — responsive spec only ──────────────
    {
      name: "mobile",
      use: {
        ...devices["iPhone SE"],
        // Override to use desktop Chrome engine (not mobile WebKit)
        // so that CSS breakpoints match standard Tailwind md: (768px)
        browserName: "chromium",
        viewport: { width: 375, height: 667 },
        isMobile: false,
      },
      testMatch: ["**/rsvp-responsive.spec.ts"],
    },

    // ─── Tablet (768 × 1024 — iPad Mini boundary) ────────────────────────────
    {
      name: "tablet",
      use: {
        browserName: "chromium",
        viewport: { width: 768, height: 1024 },
        isMobile: false,
      },
      testMatch: ["**/rsvp-responsive.spec.ts"],
    },

    // ─── Desktop wide (1440 × 900) — responsive spec ─────────────────────────
    {
      name: "desktop-wide",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
        isMobile: false,
      },
      testMatch: ["**/rsvp-responsive.spec.ts"],
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: TEST_ENV,
  },
});
