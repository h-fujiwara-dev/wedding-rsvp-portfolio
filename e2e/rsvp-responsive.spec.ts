/**
 * RSVP レスポンシブデザイン試験
 *
 * プロジェクト設定:
 *   - mobile      (375 × 667)  — モバイル
 *   - tablet      (768 × 1024) — タブレット
 *   - desktop-wide (1440 × 900) — ワイドデスクトップ
 *
 * このファイルのみこれら3プロジェクトで実行される（playwright.config.ts の testMatch）
 */

import { test, expect } from "@playwright/test";
import { mockRsvpSuccess, gotoRsvp, fillRequired, submitForm, waitForPreloaderGone } from "./helpers";

// ── 補助関数 ─────────────────────────────────────────────────────────────────

/** ビューポートが md ブレークポイント（768px）以上かどうか */
function isMdBreakpoint(viewport: { width: number; height: number } | null) {
  return (viewport?.width ?? 0) >= 768;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. ヘッダー / ナビゲーション
// ════════════════════════════════════════════════════════════════════════════

test.describe("ヘッダーナビゲーション", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("ヘッダーが常に表示される", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("モバイルではメニューボタンが表示され、md 以上ではナビが表示される", async ({
    page,
    viewport,
  }) => {
    if (isMdBreakpoint(viewport)) {
      // md 以上では nav リンクが表示、md:hidden ボタンは非表示
      await expect(page.locator("header nav")).toBeVisible();
    } else {
      // 375px では md:hidden が解除されて menu ボタンが表示される
      // header nav は hidden md:flex なので非表示
      const menuBtn = page.getByRole("button", { name: "Menu", exact: true });
      await expect(menuBtn).toBeVisible();
      await expect(page.locator("header nav")).not.toBeVisible();
    }
  });

  test("ロゴ / サイトタイトルが表示される", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();
    // ヘッダー内にテキストが存在することを確認
    const text = await header.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. ナビゲーションパネルレイアウト
// ════════════════════════════════════════════════════════════════════════════

test.describe("ナビゲーションパネルレイアウト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("3つのナビパネルがすべて表示される", async ({ page }) => {
    // section.grid 内でパネルリンクを確認（header nav と区別するため）
    await expect(page.locator("section.grid a[href='/story']")).toBeVisible();
    await expect(page.locator("section.grid a[href='/details']")).toBeVisible();
    await expect(page.locator("section.grid a[href='#rsvp']")).toBeVisible();
  });

  test("モバイルでは縦積み（flex-col）、デスクトップでは横並びになる", async ({
    page,
    viewport,
  }) => {
    // section.grid 内のみに絞る（header nav を除外）
    const panels = page.locator("section.grid a");
    const count = await panels.count();
    expect(count).toBe(3);

    if (isMdBreakpoint(viewport)) {
      // md 以上では横並びになっていることをバウンディングボックスで確認
      const boxes = await Promise.all(
        Array.from({ length: count }, (_, i) => panels.nth(i).boundingBox())
      );
      // 横並びなら Y座標がほぼ同じ
      const firstY = boxes[0]?.y ?? 0;
      const lastY = boxes[count - 1]?.y ?? 0;
      expect(Math.abs(firstY - lastY)).toBeLessThan(50);
    } else {
      // 縦積みなら各パネルの Y座標が順に増加
      const boxes = await Promise.all(
        Array.from({ length: count }, (_, i) => panels.nth(i).boundingBox())
      );
      if (boxes[0] && boxes[1]) {
        expect(boxes[1].y).toBeGreaterThan(boxes[0].y);
      }
    }
  });

  test("REGISTRY パネルが存在しない（CLAUDE.md 厳守）", async ({ page }) => {
    await expect(page.getByText("REGISTRY")).not.toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. ヒーローセクション
// ════════════════════════════════════════════════════════════════════════════

test.describe("ヒーローセクション", () => {
  test("トップページのヒーローが全幅で表示される", async ({ page, viewport }) => {
    await page.goto("/");
    const hero = page.locator("section").first();
    const box = await hero.boundingBox();
    if (box && viewport) {
      // 幅がビューポート幅とほぼ等しい（スクロールバー分 ±20px を許容）
      expect(Math.abs(box.width - viewport.width)).toBeLessThan(20);
    }
  });

  test("ストーリーページのヒーローが表示される", async ({ page }) => {
    await page.goto("/story");
    await expect(page.locator("section").first()).toBeVisible();
  });

  test("詳細ページのヒーローが表示される", async ({ page }) => {
    await page.goto("/details");
    await expect(page.locator("section").first()).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3.5 タイムライン（TICKET-06: TimelineBeam レスポンシブ対応）
// ════════════════════════════════════════════════════════════════════════════

test.describe("ストーリーページ タイムライン", () => {
  test("sm ブレークポイント未満では縦積み(column)、sm 以上では横並び(row)になる", async ({
    page,
    viewport,
  }) => {
    await page.goto("/story");
    await waitForPreloaderGone(page);
    const heading = page.locator("h3.font-display").first();
    await heading.scrollIntoViewIfNeeded();

    // h3 → テキストカード div → TimelineItem のルート flex コンテナ
    const flexDirection = await heading.evaluate((el) => {
      const root = el.parentElement?.parentElement;
      return root ? getComputedStyle(root).flexDirection : null;
    });

    if (viewport && viewport.width < 640) {
      expect(flexDirection).toBe("column");
    } else {
      expect(["row", "row-reverse"]).toContain(flexDirection);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. RSVP フォームレイアウト
// ════════════════════════════════════════════════════════════════════════════

test.describe("RSVP フォームレイアウト", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
  });

  test("フォームが画面内に収まっている（水平スクロールなし）", async ({ page, viewport }) => {
    const form = page.getByTestId("rsvp-form");
    const box = await form.boundingBox();
    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });

  test("テキスト入力フィールドがビューポート幅に適応している", async ({ page, viewport }) => {
    const nameInput = page.getByTestId("name");
    const box = await nameInput.boundingBox();
    if (box && viewport) {
      // フィールドがビューポート幅を超えていない
      expect(box.width).toBeLessThanOrEqual(viewport.width);
      // フィールドが十分な幅を持つ（最低 200px）
      expect(box.width).toBeGreaterThan(200);
    }
  });

  test("送信ボタンがビューポート内に完全に表示される", async ({ page, viewport }) => {
    const btn = page.getByTestId("rsvp-submit");
    await btn.scrollIntoViewIfNeeded();
    const box = await btn.boundingBox();
    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });

  test("すべての必須フィールドがタッチ可能なサイズを持つ（最低 44px, TICKET-02）", async ({ page }) => {
    const fieldIds = ["name", "email-address"];
    for (const id of fieldIds) {
      const el = page.getByTestId(id);
      const box = await el.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("ラジオボタンの実タップ領域が44px以上ある（可視サイズは16pxのまま, TICKET-02）", async ({ page }) => {
    await waitForPreloaderGone(page);
    const radios = page.getByTestId("attend-radio").getByRole("radio");
    const count = await radios.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await radios.first().scrollIntoViewIfNeeded();
    const box = await radios.first().boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // 可視の丸ボタン自体は16px前後のまま（デザイン維持）
      expect(box.width).toBeLessThan(20);
      // 可視領域の左外側（-inset-x-3.5 = 14px 拡張ゾーン内）をクリックしても選択できる
      await page.mouse.click(box.x - 8, box.y + box.height / 2);
      await expect(radios.first()).toBeChecked();
    }
  });

  test("フォーム送信が各ビューポートで正常に動作する", async ({ page }) => {
    await fillRequired(page);
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. テキスト可読性
// ════════════════════════════════════════════════════════════════════════════

test.describe("テキスト可読性", () => {
  test("フォームラベルがすべて表示されている", async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);

    // 必須項目のラベル確認
    await expect(page.getByText("Nama Lengkap")).toBeVisible();
    await expect(page.getByText("Alamat Email")).toBeVisible();
  });

  test("エラーメッセージがモバイルでも読める（切れていない）", async ({ page, viewport }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await submitForm(page);

    const errorMsg = page.getByText("Harap pilih kehadiran Anda");
    await expect(errorMsg).toBeVisible();

    const box = await errorMsg.boundingBox();
    if (box && viewport) {
      // エラーメッセージがビューポートから切れていない
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. フッター
// ════════════════════════════════════════════════════════════════════════════

test.describe("フッター", () => {
  test("フッターが各ページで表示される", async ({ page }) => {
    for (const path of ["/", "/story", "/details"]) {
      await page.goto(path);
      // Next.js error overlay も footer を持つため、アプリ用 footer のみを確認
      await expect(page.locator("footer:not([data-nextjs-error-overlay-footer])")).toBeVisible();
    }
  });

  test("フッターがビューポート幅内に収まる", async ({ page, viewport }) => {
    await page.goto("/");
    const footerBox = await page
      .locator("footer:not([data-nextjs-error-overlay-footer])")
      .boundingBox();
    if (footerBox && viewport) {
      expect(footerBox.x + footerBox.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. ページ全体のオーバーフロー
// ════════════════════════════════════════════════════════════════════════════

test.describe("水平オーバーフロー", () => {
  const pages = [
    { path: "/", name: "トップページ" },
    { path: "/story", name: "ストーリーページ" },
    { path: "/details", name: "詳細ページ" },
  ];

  for (const { path, name } of pages) {
    test(`${name} で水平スクロールが発生しない`, async ({ page, viewport }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      // スクロール幅がクライアント幅を超えていない（1px の誤差を許容）
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }
});
