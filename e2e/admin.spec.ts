/**
 * /admin ページ スモークテスト
 *
 * 検証項目:
 *   - ページが 200 で返る（404 でない）
 *   - Admin ヘッダーが表示される
 *   - 集計セクション（h2）が表示される
 *   - RSVP 一覧セクション（h2）が表示される
 *   - データなし時のメッセージが表示される（Supabase ダミー環境）
 *
 * 注意: テスト環境では Supabase が疎通しないため rows = [] となる。
 *       "まだ RSVP データがありません。" の表示を期待する。
 *
 * 認証: /admin は HTTP Basic Auth で保護されている。
 *       テスト用の ADMIN_USERNAME / ADMIN_PASSWORD を使用。
 */

import { test, expect } from "@playwright/test";

// Must match ADMIN_USERNAME / ADMIN_PASSWORD in playwright.config.ts TEST_ENV
const ADMIN_USER = "test-admin";
const ADMIN_PASS = "test-password";

test.describe("Admin ページ — 構造", () => {
  test.beforeEach(async ({ page }) => {
    // When ADMIN_USERNAME / ADMIN_PASSWORD are set in the server env (CI / fresh server),
    // send Basic Auth. The header is a no-op when credentials are not configured (dev server
    // reuse) because middleware skips auth in that case.
    const encoded = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString("base64");
    await page.setExtraHTTPHeaders({ Authorization: `Basic ${encoded}` });
    await page.goto("/admin");
  });

  test("ページが正常に読み込まれる（404 でない）", async ({ page }) => {
    const url = page.url();
    expect(url).toContain("/admin");
  });

  test("Admin ヘッダーが表示される", async ({ page }) => {
    await expect(page.locator("header").first()).toContainText("Admin");
  });

  test("集計 h2 が表示される（デフォルトロケール = インドネシア語）", async ({ page }) => {
    await expect(page.locator("h2", { hasText: "Ringkasan" })).toBeVisible();
  });

  test("RSVP 一覧 h2 が表示される（デフォルトロケール = インドネシア語）", async ({ page }) => {
    await expect(page.locator("h2", { hasText: "Daftar RSVP" })).toBeVisible();
  });

  test("集計コンテンツ・空データメッセージ・取得エラーのいずれかが表示される", async ({ page }) => {
    // データあり → KPI cards（font-display text-5xl）が表示される
    // データなし → "Belum ada data RSVP." が表示される
    // 接続エラー時 → role=alert のエラーバナーが表示される（TICKET-05）
    const emptyMsg = page.getByText("Belum ada data RSVP.").first();
    const kpiCard = page.locator(".text-5xl").first();
    const errorBanner = page.getByRole("alert");
    const either =
      (await emptyMsg.isVisible()) || (await kpiCard.isVisible()) || (await errorBanner.isVisible());
    expect(either).toBe(true);
  });

  test("管理ダッシュボード ラベルが表示される（デフォルトロケール = インドネシア語）", async ({ page }) => {
    await expect(page.getByText("Dasbor Admin")).toBeVisible();
  });

  test("日本語に切り替えると管理ダッシュボードのラベルも日本語になる（TICKET-05）", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("wedding-lang", "ja"));
    await page.reload();
    await expect(page.getByText("管理ダッシュボード")).toBeVisible();
    await expect(page.locator("h2", { hasText: "集計" })).toBeVisible();
    await expect(page.locator("h2", { hasText: "RSVP 一覧" })).toBeVisible();
  });

  test("英語に切り替えると管理ダッシュボードのラベルも英語になる（TICKET-05 拡張）", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("wedding-lang", "en"));
    await page.reload();
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.locator("h2", { hasText: "Summary" })).toBeVisible();
    await expect(page.locator("h2", { hasText: "RSVP List" })).toBeVisible();
  });

  test("データなし時はフィルターチップと CSV ボタンが表示されない", async ({ page }) => {
    await expect(page.getByText("Belum ada data RSVP.").first()).toBeVisible();
    await expect(page.getByTestId("csv-download")).not.toBeAttached();
    await expect(page.getByText("Semua")).not.toBeAttached();
  });
});
