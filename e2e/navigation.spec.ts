/**
 * ナビゲーション結合試験
 *
 * 検証項目:
 *   - 3パネル（OUR STORY / THE DETAILS / RSVP）のルーティング
 *   - RSVP パネル → #rsvp セクションへのアンカースクロール
 *   - ヘッダーナビゲーションリンク
 *   - サブページからの戻りナビゲーション
 *   - REGISTRY が完全に存在しないこと（CLAUDE.md 厳守）
 */

import { test, expect, type Page } from "@playwright/test";
import { setLocale, waitForPreloaderGone } from "./helpers";

// ページには "Our Story" が header nav と panel の両方に存在するため、
// grid section 内の href で絞り込む
const storyPanel = (page: Page) => page.locator("section.grid a[href='/story']");
const detailsPanel = (page: Page) => page.locator("section.grid a[href='/details']");
const rsvpPanel = (page: Page) => page.locator("section.grid a[href='#rsvp']");

// ════════════════════════════════════════════════════════════════════════════
// 1. トップページ パネルナビゲーション
// ════════════════════════════════════════════════════════════════════════════

test.describe("トップページ パネルナビゲーション", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("OUR STORY パネルをクリックすると /story に遷移する", async ({ page }) => {
    await page.locator("section.grid a[href='/story']").click();
    await expect(page).toHaveURL(/\/story/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("THE DETAILS パネルをクリックすると /details に遷移する", async ({ page }) => {
    await page.locator("section.grid a[href='/details']").click();
    await expect(page).toHaveURL(/\/details/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("RSVP パネルをクリックすると #rsvp セクションが表示される", async ({ page }) => {
    await waitForPreloaderGone(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator("section.grid a[href='#rsvp']").click();
    const rsvpSection = page.locator("#rsvp");
    await expect(rsvpSection).toBeInViewport({ timeout: 5_000 });
  });

  test("REGISTRY テキストがページ内に存在しない", async ({ page }) => {
    const content = await page.content();
    expect(content.toLowerCase()).not.toContain("registry");
  });

  test("3パネルリンクが表示される（OUR STORY / THE DETAILS / RSVP）", async ({ page }) => {
    await expect(page.locator("section.grid a[href='/story']")).toBeVisible();
    await expect(page.locator("section.grid a[href='/details']")).toBeVisible();
    await expect(page.locator("section.grid a[href='#rsvp']")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 1.5 トップページ パネルナビゲーション — ロケール別ラベル（TICKET-05 拡張）
// ════════════════════════════════════════════════════════════════════════════

test.describe("トップページ パネルナビゲーション — ロケール別ラベル (TICKET-05 拡張)", () => {
  test("デフォルト（インドネシア語）のパネルラベルが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("section.grid").getByText("Kisah Kami")).toBeVisible();
    await expect(page.locator("section.grid").getByText("Detail Acara")).toBeVisible();
  });

  test("英語のパネルラベルが表示される", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto("/");
    await expect(page.locator("section.grid").getByText("Our Story")).toBeVisible();
    await expect(page.locator("section.grid").getByText("The Details")).toBeVisible();
    await expect(page.locator("section.grid").getByText("The beginning")).toBeVisible();
    await expect(page.locator("section.grid").getByText("Ceremony & reception")).toBeVisible();
  });

  test("日本語のパネルラベルが表示される", async ({ page }) => {
    await setLocale(page, "ja");
    await page.goto("/");
    await expect(page.locator("section.grid").getByText("ふたりのこと")).toBeVisible();
    // nav.details と panel.details.label が共に "詳細" のため、パネル内に限定して検証する
    await expect(page.locator("section.grid a[href='/details']").getByText("詳細")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 1.6 カウントダウン（ホーム）
// ════════════════════════════════════════════════════════════════════════════

test.describe("カウントダウン（ホーム）", () => {
  test("4つの数字グループがデフォルトロケール（インドネシア語）の単位ラベル付きで表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("hari", { exact: true })).toBeVisible();
    await expect(page.getByText("jam", { exact: true })).toBeVisible();
    await expect(page.getByText("menit", { exact: true })).toBeVisible();
    await expect(page.getByText("detik", { exact: true })).toBeVisible();

    const digits = page.locator("span.tabular-nums");
    await expect(digits).toHaveCount(4);
    const values = await digits.allTextContents();
    for (const v of values) {
      expect(v).toMatch(/^\d+$/);
    }
  });

  test("英語に切り替えると単位ラベルが英語になる", async ({ page }) => {
    await setLocale(page, "en");
    await page.goto("/");
    await expect(page.getByText("days", { exact: true })).toBeVisible();
    await expect(page.getByText("hours", { exact: true })).toBeVisible();
    await expect(page.getByText("mins", { exact: true })).toBeVisible();
    await expect(page.getByText("secs", { exact: true })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. ヘッダーナビゲーション
// ════════════════════════════════════════════════════════════════════════════

test.describe("ヘッダーナビゲーション", () => {
  test("ヘッダーが常に表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
  });

  test("ヘッダーロゴが表示されてトップへ遷移できる", async ({ page }) => {
    await page.goto("/story");
    // ロゴ（J&H）は display フォントのイタリック体 — 最初の header link がロゴ
    await page.locator("header a").first().click();
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
  });

  test("ヘッダーの OUR STORY リンクが /story に遷移する", async ({ page }) => {
    await page.goto("/");
    await page.locator("header nav a[href='/story']").click();
    await expect(page).toHaveURL(/\/story/);
  });

  test("ヘッダーの DETAILS リンクが /details に遷移する", async ({ page }) => {
    await page.goto("/");
    await page.locator("header nav a[href='/details']").click();
    await expect(page).toHaveURL(/\/details/);
  });

  test("モバイル幅では Admin リンクのタップ領域が44x44px以上ある（TICKET-02）", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const box = await page.getByRole("link", { name: "Admin" }).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2.5 モバイルナビゲーション（TICKET-01）
// ════════════════════════════════════════════════════════════════════════════

test.describe("モバイルナビゲーション", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
  });

  test("Menu ボタンをタップするとナビパネルが開閉する", async ({ page }) => {
    const menuButton = page.locator("header button[aria-controls='mobile-nav-panel']");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#mobile-nav-panel")).toBeVisible();
    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  test("モバイルナビ内の OUR STORY リンクをタップすると /story に遷移する", async ({ page }) => {
    await page.locator("header button[aria-controls='mobile-nav-panel']").click();
    await page.locator("#mobile-nav-panel a[href='/story']").click();
    await expect(page).toHaveURL(/\/story/);
  });

  test("Escape キーでナビパネルが閉じる", async ({ page }) => {
    const menuButton = page.locator("header button[aria-controls='mobile-nav-panel']");
    await menuButton.click();
    await expect(page.locator("#mobile-nav-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  test("Menu ボタンのタップ領域が44x44px以上", async ({ page }) => {
    const menuButton = page.locator("header button[aria-controls='mobile-nav-panel']");
    const box = await menuButton.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. RSVP アンカースクロール
// ════════════════════════════════════════════════════════════════════════════

test.describe("RSVP アンカースクロール", () => {
  test("#rsvp セクションが DOM に存在する", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#rsvp")).toBeAttached();
  });

  test("URL /#rsvp で直接アクセスすると #rsvp が表示位置に来る", async ({ page }) => {
    await page.goto("/#rsvp");
    await expect(page.locator("#rsvp")).toBeInViewport({ timeout: 5_000 });
  });

  test("#rsvp セクション内に RSVP フォームが含まれている", async ({ page }) => {
    await page.goto("/");
    await waitForPreloaderGone(page);
    await page.locator("#rsvp").scrollIntoViewIfNeeded();
    await expect(page.locator("#rsvp [data-testid='rsvp-form']")).toBeAttached();
  });

  test("/rsvp ルートは存在しない（404 または / にリダイレクト）", async ({ page }) => {
    const res = await page.goto("/rsvp");
    const status = res?.status() ?? 0;
    const url = page.url();
    const isNotFound = status === 404;
    const isRedirectedToTop = url.match(/^http:\/\/[^/]+(\/)?$/) !== null;
    expect(isNotFound || isRedirectedToTop).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. ページ間遷移
// ════════════════════════════════════════════════════════════════════════════

test.describe("ページ間遷移", () => {
  test("/story → /details と連続遷移できる", async ({ page }) => {
    await page.goto("/story");
    await expect(page).toHaveURL(/\/story/);

    await page.goto("/details");
    await expect(page).toHaveURL(/\/details/);
    await expect(page.locator("header")).toBeVisible();
  });

  test("ブラウザの戻るボタンで前のページに戻れる", async ({ page }) => {
    await page.goto("/");
    await page.locator("section.grid a[href='/story']").click();
    await expect(page).toHaveURL(/\/story/);

    await page.goBack();
    await expect(page).toHaveURL(/^http:\/\/[^/]+(\/)?$/);
  });

  test("各ページで共通ヘッダーとフッターが表示される", async ({ page }) => {
    for (const path of ["/", "/story", "/details"]) {
      await page.goto(path);
      await expect(page.locator("header")).toBeVisible();
      // Next.js error overlay の footer を除いたアプリ用 footer を確認
      await expect(page.locator("footer:not([data-nextjs-error-overlay-footer])")).toBeVisible();
    }
  });

  test("/admin ページが存在する（認証ガードは任意）", async ({ page }) => {
    const res = await page.goto("/admin");
    const status = res?.status() ?? 0;
    expect(status).not.toBe(404);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. ページメタデータ
// ════════════════════════════════════════════════════════════════════════════

test.describe("ページメタデータ", () => {
  test("トップページに title タグが設定されている", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("/story のタイトルが設定されている", async ({ page }) => {
    await page.goto("/story");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("/details のタイトルが設定されている", async ({ page }) => {
    await page.goto("/details");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. 404 ページ
// ════════════════════════════════════════════════════════════════════════════

test.describe("404 ページ", () => {
  test("存在しないルートで 404 またはフォールバックが返る", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist-12345");
    const status = res?.status() ?? 0;
    expect(status).toBe(404);
  });
});
