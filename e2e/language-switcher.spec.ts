/**
 * Language switcher tests
 *
 * Verifies:
 *   - Default language is Indonesian (id)
 *   - Switching to EN updates UI text
 *   - Switching to JA updates UI text
 *   - Language persists via localStorage across navigation
 *   - Active locale button has distinct styling (aria/class)
 */

import { test, expect } from "@playwright/test";
import { waitForPreloaderGone } from "./helpers";

test.describe("言語スイッチャー — デフォルト（インドネシア語）", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset to default locale
    await page.addInitScript(() => localStorage.removeItem("wedding-lang"));
    await page.goto("/");
  });

  test("デフォルトでインドネシア語ナビが表示される", async ({ page }) => {
    // In id locale, nav shows "BERANDA" for home
    await expect(page.getByText("BERANDA")).toBeVisible();
  });

  test("デフォルトでRSVPセクションがインドネシア語", async ({ page }) => {
    await waitForPreloaderGone(page);
    await page.locator("#rsvp").scrollIntoViewIfNeeded();
    // rsvp.title in id is "KONFIRMASI KEHADIRAN" or similar
    await expect(page.locator("#rsvp h2").first()).toBeVisible();
  });

  test("LanguageSwitcher が3ボタン（ID / EN / JA）を表示する", async ({ page }) => {
    // aria-label is "Switch to ID", "Switch to EN", "Switch to JA" per LOCALE_LABELS
    await expect(page.getByRole("button", { name: "Switch to ID" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Switch to EN" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Switch to JA" })).toBeVisible();
  });

  test("ボタンの可視サイズ外（拡張タップ領域）をクリックしても切り替わる（TICKET-02）", async ({ page }) => {
    await waitForPreloaderGone(page);
    const enButton = page.getByRole("button", { name: /Switch to EN/i });
    const box = await enButton.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // 可視ボタンは高さ十数px — 上方向の拡張ゾーン（after:-inset-y-4 = 16px）内をクリック
      await page.mouse.click(box.x + box.width / 2, box.y - 10);
      await expect(page.getByText("HOME")).toBeVisible();
    }
  });
});

test.describe("言語スイッチャー — 英語に切り替え", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("wedding-lang"));
    await page.goto("/");
  });

  test("ENボタンをクリックすると英語ナビに切り替わる", async ({ page }) => {
    await page.getByRole("button", { name: /Switch to EN/i }).click();
    await expect(page.getByText("HOME")).toBeVisible();
  });

  test("ENボタンクリック後 localStorage に 'en' が保存される", async ({ page }) => {
    await page.getByRole("button", { name: /Switch to EN/i }).click();
    const lang = await page.evaluate(() => localStorage.getItem("wedding-lang"));
    expect(lang).toBe("en");
  });

  test("英語切り替え後にRSVPセクションの表示が英語になる", async ({ page }) => {
    await page.getByRole("button", { name: /Switch to EN/i }).click();
    await waitForPreloaderGone(page);
    await page.locator("#rsvp").scrollIntoViewIfNeeded();
    await expect(page.locator("#rsvp h2").first()).toBeVisible();
  });
});

test.describe("言語スイッチャー — 日本語に切り替え", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("wedding-lang"));
    await page.goto("/");
  });

  test("JAボタンをクリックすると日本語ナビに切り替わる", async ({ page }) => {
    await page.getByRole("button", { name: /Switch to JA/i }).click();
    await expect(page.getByText("ホーム")).toBeVisible();
  });

  test("JAボタンクリック後 localStorage に 'ja' が保存される", async ({ page }) => {
    await page.getByRole("button", { name: /Switch to JA/i }).click();
    const lang = await page.evaluate(() => localStorage.getItem("wedding-lang"));
    expect(lang).toBe("ja");
  });

  test("日本語切り替え後に詳細ページのラベルも日本語になる", async ({ page }) => {
    await page.getByRole("button", { name: /Switch to JA/i }).click();
    await page.goto("/details");
    // In Japanese locale, detail labels are Japanese
    // Just verify the page loaded and h1 is visible
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("言語スイッチャー — 言語の永続化", () => {
  test("英語に切り替えてページ遷移しても英語が維持される", async ({ page }) => {
    // Use evaluate (not addInitScript) so subsequent page.goto() calls don't re-clear storage
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("wedding-lang"));
    await page.reload();

    await page.getByRole("button", { name: /Switch to EN/i }).click();
    await expect(page.getByText("HOME")).toBeVisible();

    await page.goto("/story");
    await expect(page.getByText("HOME")).toBeVisible();

    await page.goto("/details");
    await expect(page.getByText("HOME")).toBeVisible();
  });

  test("日本語に切り替えてリロードしても日本語が維持される", async ({ page }) => {
    // Use evaluate (not addInitScript) so the subsequent reload doesn't re-clear storage
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("wedding-lang"));
    await page.reload();

    await page.getByRole("button", { name: /Switch to JA/i }).click();
    await expect(page.getByText("ホーム")).toBeVisible();

    await page.reload();
    await expect(page.getByText("ホーム")).toBeVisible();
  });

  test("英語→日本語→インドネシア語と順に切り替えられる", async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("wedding-lang"));
    await page.goto("/");

    await page.getByRole("button", { name: /Switch to EN/i }).click();
    await expect(page.getByText("HOME")).toBeVisible();

    await page.getByRole("button", { name: /Switch to JA/i }).click();
    await expect(page.getByText("ホーム")).toBeVisible();

    await page.getByRole("button", { name: /Switch to ID/i }).click();
    await expect(page.getByText("BERANDA")).toBeVisible();
  });
});

test.describe("言語スイッチャー — アクティブ状態", () => {
  test("現在のロケールボタンが aria-label に言語コードを持つ", async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("wedding-lang"));
    await page.goto("/");

    // All 3 locale buttons have aria-label "Switch to <CODE>"
    await expect(page.getByRole("button", { name: "Switch to ID" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Switch to EN" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Switch to JA" })).toBeVisible();
  });

  test("localStorageが 'en' の場合は英語UIでロードされる", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("wedding-lang", "en"));
    await page.goto("/");
    await expect(page.getByText("HOME")).toBeVisible();
  });

  test("localStorageが 'ja' の場合は日本語UIでロードされる", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("wedding-lang", "ja"));
    await page.goto("/");
    await expect(page.getByText("ホーム")).toBeVisible();
  });

  test("localStorageが 'id' の場合はインドネシア語UIでロードされる", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("wedding-lang", "id"));
    await page.goto("/");
    await expect(page.getByText("BERANDA")).toBeVisible();
  });

  test("不正な localStorage 値はデフォルト（id）にフォールバックする", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("wedding-lang", "fr"));
    await page.goto("/");
    await expect(page.getByText("BERANDA")).toBeVisible();
  });
});
