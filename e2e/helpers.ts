import type { Page, Route } from "@playwright/test";

// ── API mock helpers ──────────────────────────────────────────────────────────

export async function mockRsvpApi(
  page: Page,
  response: { status: number; body: object },
  delayMs = 0
) {
  await page.route("/api/rsvp", async (route: Route) => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: JSON.stringify(response.body),
    });
  });
}

export const mockRsvpSuccess = (page: Page, delayMs = 0) =>
  mockRsvpApi(page, { status: 201, body: { success: true } }, delayMs);

export const mockRsvpRateLimit = (page: Page) =>
  mockRsvpApi(page, {
    status: 429,
    body: { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
  });

export const mockRsvpServerError = (page: Page) =>
  mockRsvpApi(page, {
    status: 500,
    body: { error: "Gagal menyimpan data. Silakan coba lagi." },
  });

// ── Locale helpers ────────────────────────────────────────────────────────────

export async function setLocale(page: Page, locale: "id" | "en" | "ja") {
  await page.addInitScript((l) => localStorage.setItem("wedding-lang", l), locale);
}

// ── Form helpers ──────────────────────────────────────────────────────────────

/**
 * Preloader は z-[100] で ~2.75秒間ページ全体を覆う。ロケータの `.click()` は
 * actionability チェックで自動的に待つが、`page.mouse.click(x, y)` は座標への
 * 生イベントなので待たない — raw な座標クリックを使うテストでは先にこれを呼ぶ。
 */
export async function waitForPreloaderGone(page: Page) {
  await page.waitForFunction(() => !document.querySelector('[class*="z-[100]"]'), {
    timeout: 10_000,
  });
}

export async function gotoRsvp(page: Page) {
  await page.goto("/");
  await waitForPreloaderGone(page);
  await page.locator("#rsvp").scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-testid="rsvp-form"]');
}

export async function fillRequired(page: Page) {
  await page.getByTestId("attend-radio").getByRole("radio", { name: "Hadir", exact: true }).check();
  await page.getByTestId("number-of-participants").fill("2");
  await page.getByTestId("name").fill("Budi Santoso");
  await page.getByTestId("email-address").fill("budi@example.com");
}

export async function fillRequiredAbsent(page: Page) {
  await page.getByTestId("attend-radio").getByRole("radio", { name: /Tidak Hadir/ }).check();
  await page.getByTestId("number-of-participants").fill("2");
  await page.getByTestId("name").fill("Siti Rahayu");
  await page.getByTestId("email-address").fill("siti@example.com");
}

export async function fillAll(page: Page) {
  await page.getByTestId("attend-radio").getByRole("radio", { name: "Hadir", exact: true }).check();
  await page.getByTestId("number-of-participants").fill("3");
  await page.getByTestId("name").fill("Budi Santoso");
  await page.getByTestId("email-address").fill("budi@example.com");
  await page.getByTestId("age").fill("35");
  await page.getByTestId("postcode").fill("12345");
  await page.getByTestId("address").fill("Jl. Sudirman No. 1, Jakarta");
  await page.getByTestId("phone-number").fill("08123456789");
  await page.getByTestId("dietary-restrictions").fill("Alergi kacang");
  await page.getByTestId("message").fill("Selamat untuk kalian berdua!");
}

export async function submitForm(page: Page) {
  await page.getByTestId("rsvp-submit").click();
}

// ── API test payloads ─────────────────────────────────────────────────────────

export const VALID_ATTEND_PAYLOAD = {
  attend_or_absent: "attend" as const,
  number_of_participants: 2,
  name: "Budi Santoso",
  email_address: "budi@example.com",
  age: 35,
  postcode: "12345",
  address: "Jl. Sudirman No. 1, Jakarta",
  phone_number: "08123456789",
  dietary_restrictions: "Alergi kacang",
  message: "Selamat untuk kalian berdua!",
};

export const VALID_ABSENT_PAYLOAD = {
  attend_or_absent: "absent" as const,
  number_of_participants: 2,
  name: "Siti Rahayu",
  email_address: "siti@example.com",
};
