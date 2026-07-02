/**
 * /details page content and navigation tests
 *
 * Verifies:
 *   - Page structure (hero, event info, Travel & Stay, RSVP CTA)
 *   - RSVP CTA → homepage #rsvp section navigation
 *   - REGISTRY is completely absent (CLAUDE.md requirement)
 *   - Header and footer visibility
 */

import { test, expect } from "@playwright/test";

test.describe("Details ページ — 構造", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/details");
  });

  test("h1 が表示される", async ({ page }) => {
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("ヘッダーとフッターが表示される", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer:not([data-nextjs-error-overlay-footer])")).toBeVisible();
  });

  test("REGISTRY テキストが存在しない（CLAUDE.md 厳守）", async ({ page }) => {
    const content = await page.content();
    expect(content.toLowerCase()).not.toContain("registry");
  });
});

test.describe("Details ページ — イベント情報", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/details");
  });

  test("Tanggal セクションが表示される", async ({ page }) => {
    await expect(page.locator("dt", { hasText: "Tanggal" })).toBeVisible();
  });

  test("Lokasi セクションが表示される", async ({ page }) => {
    await expect(page.locator("dt", { hasText: "Lokasi" })).toBeVisible();
  });

  test("Mulai Upacara セクションが表示される", async ({ page }) => {
    await expect(page.locator("dt", { hasText: "Mulai Upacara" })).toBeVisible();
  });

  test("Resepsi セクションが表示される", async ({ page }) => {
    await expect(page.locator("dt", { hasText: "Resepsi" })).toBeVisible();
  });

  test("Tamu Musik セクションが表示される", async ({ page }) => {
    await expect(page.locator("dt", { hasText: "Tamu Musik" })).toBeVisible();
  });

  test("Makan Malam セクションが表示される", async ({ page }) => {
    await expect(page.locator("dt", { hasText: "Makan Malam" })).toBeVisible();
  });
});

test.describe("Details ページ — Travel & Stay", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/details");
  });

  test("Perjalanan & Menginap h2 が表示される", async ({ page }) => {
    await expect(page.locator("h2").filter({ hasText: "Perjalanan" })).toBeVisible();
  });

  test("Cara Menuju Venue テキストが表示される", async ({ page }) => {
    await expect(page.getByText("Cara Menuju Venue")).toBeVisible();
  });

  test("Tempat Menginap テキストが表示される", async ({ page }) => {
    await expect(page.getByText("Tempat Menginap")).toBeVisible();
  });
});

test.describe("Details ページ — Schedule/Dress Code タブ（TICKET-07）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/details");
  });

  test("role=tablist / role=tab で実装されている", async ({ page }) => {
    await expect(page.getByRole("tablist")).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(2);
  });

  test("Dress Code タブをクリックすると内容が切り替わる", async ({ page }) => {
    const dresscodeTab = page.getByRole("tab").nth(1);
    await dresscodeTab.click();
    await expect(dresscodeTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Sage")).toBeVisible();
  });

  test("キーボードフォーカス時に視認可能なフォーカスリングが表示される（旧: focus-visible:outline-none のみで代替リング無し）", async ({ page }) => {
    const firstTab = page.getByRole("tab").first();
    await firstTab.focus();
    await expect(firstTab).toBeFocused();
    const isFocusVisible = await firstTab.evaluate((el) => el.matches(":focus-visible"));
    expect(isFocusVisible).toBe(true);
    const ringVisible = await firstTab.evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.boxShadow !== "none" || cs.outlineStyle !== "none";
    });
    expect(ringVisible).toBe(true);
  });
});

test.describe("Details ページ — RSVP CTA", () => {
  test("RSVP CTA ボタンが表示される", async ({ page }) => {
    await page.goto("/details");
    await expect(page.locator('a[href="/#rsvp"]').first()).toBeVisible();
  });

  test("RSVP CTA をクリックするとホームの #rsvp セクションへ遷移する", async ({ page }) => {
    await page.goto("/details");
    await page.locator('a[href="/#rsvp"]').first().click();
    await expect(page).toHaveURL(/\/#rsvp/);
    await expect(page.locator("#rsvp")).toBeInViewport({ timeout: 5_000 });
  });
});
