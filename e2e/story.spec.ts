/**
 * /story page content and navigation tests
 *
 * Verifies:
 *   - Page structure (header, footer, timeline heading)
 *   - Content (intro paragraphs, timeline section, CTA section) in the default locale
 *   - RSVP CTA → homepage #rsvp section navigation
 *   - REGISTRY is completely absent (CLAUDE.md requirement)
 *   - EN/JA locale content switches
 *
 * Note: story.eyebrow / story.h1line1 / story.h1line2 / tl.e5.* are defined in
 * i18n.ts but are not rendered anywhere on this page — no assertions target them.
 */

import { test, expect } from "@playwright/test";
import { setLocale } from "./helpers";

test.describe("Story ページ — 構造", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/story");
  });

  test("ヘッダーとフッターが表示される", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer:not([data-nextjs-error-overlay-footer])")).toBeVisible();
  });

  test("REGISTRY テキストが存在しない（CLAUDE.md 厳守）", async ({ page }) => {
    const content = await page.content();
    expect(content.toLowerCase()).not.toContain("registry");
  });

  test("タイムライン h2 が表示される（デフォルトロケール）", async ({ page }) => {
    await expect(page.locator("h2", { hasText: "Kisah Perjalanan Kami" })).toBeVisible();
  });
});

test.describe("Story ページ — コンテンツ（デフォルトロケール）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/story");
  });

  test("イントロ段落が表示される", async ({ page }) => {
    await expect(
      page.getByText("Kisah kami bermula dari pertemuan tak terduga di aplikasi kencan")
    ).toBeVisible();
  });

  test("タイムラインのeyebrow・見出し・サブテキストが表示される", async ({ page }) => {
    await expect(page.getByText("Perjalanan", { exact: true })).toBeVisible();
    await expect(page.locator("h2", { hasText: "Kisah Perjalanan Kami" })).toBeVisible();
    await expect(page.getByText("Momen-momen yang membawa kami ke sini.")).toBeVisible();
  });

  test("CTAセクションのテキストが表示される", async ({ page }) => {
    await expect(
      page.getByText("Kami sangat bersyukur bisa merayakan awal yang baru ini")
    ).toBeVisible();
    await expect(page.getByText("Perjalanan kami baru saja dimulai.")).toBeVisible();
  });

  test("タイムラインカードのタイトルが表示される", async ({ page }) => {
    await expect(page.getByText("Pertemuan Pertama")).toBeVisible();
  });
});

test.describe("Story ページ — RSVP CTA", () => {
  test("RSVP CTA ボタンが表示される", async ({ page }) => {
    await page.goto("/story");
    await expect(page.locator('a[href="/#rsvp"]').first()).toBeVisible();
  });

  test("RSVP CTA をクリックするとホームの #rsvp セクションへ遷移する", async ({ page }) => {
    await page.goto("/story");
    await page.locator('a[href="/#rsvp"]').first().click();
    await expect(page).toHaveURL(/\/#rsvp/);
    await expect(page.locator("#rsvp")).toBeInViewport({ timeout: 5_000 });
  });
});

test.describe("Story ページ — 英語/日本語ロケール", () => {
  test("英語に切り替えるとイントロ・タイムライン見出しが英語になる", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto("/story");
    await expect(
      page.getByText("Our story began with a chance encounter on a dating app")
    ).toBeVisible();
    await expect(page.locator("h2", { hasText: "Our Journey" })).toBeVisible();
  });

  test("日本語に切り替えるとイントロ・タイムライン見出しが日本語になる", async ({ page }) => {
    await setLocale(page, "ja");
    await page.goto("/story");
    await expect(
      page.getByText("マッチングアプリで偶然出会い")
    ).toBeVisible();
    await expect(page.locator("h2", { hasText: "ふたりの歩み" })).toBeVisible();
  });
});
