/**
 * VideoScroller — OUR STORY 一方向ロックテスト
 *
 * アーキテクチャ（2026-06 現在）:
 *   z-[25]  OUR STORY h2: useMotionValue による一方向ロック
 *           - scrollYProgress の change イベントを購読
 *           - opacity/y/blur は「増える方向・小さくなる方向」にしか変化しない
 *           - 一度 opacity=1 に到達したら、スクロールバックしても 0 に戻らない
 *   z-40    completion card: 通常の双方向 useTransform (装飾目的のみ)
 *
 * 根本解決の理由:
 *   従来の useTransform(scrollYProgress, [a,b], [0,1]) は双方向マッピング。
 *   スクロールバックで scrollYProgress が下がると opacity も 0 に戻っていた。
 *   useMotionValue + Math.max/min による一方向更新でこれを根絶した。
 */

import { test, expect } from "@playwright/test";

// ── アニメーション定数 ───────────────────────────────────────────────────────
const OUR_ENTER_AT   = 0.03;
const STORY_ENTER_AT = 0.09;
const WORD_DURATION  = 0.07;
const STICKY_UNPIN   = 0.75;

// 一方向ロジックをテスト側でも再現する
// Math.max (opacity) / Math.min (y, blur) → 不可逆
function simulateOneWay(progressValues: number[]) {
  let ourOp = 0, storyOp = 0;
  let ourY = 26, storyY = 26;

  for (const p of progressValues) {
    const op = Math.max(0, Math.min(1, (p - OUR_ENTER_AT)   / WORD_DURATION));
    const sp = Math.max(0, Math.min(1, (p - STORY_ENTER_AT) / WORD_DURATION));
    ourOp   = Math.max(ourOp,   op);
    storyOp = Math.max(storyOp, sp);
    ourY    = Math.min(ourY,   26 * (1 - op));
    storyY  = Math.min(storyY, 26 * (1 - sp));
  }
  return { ourOp, storyOp, ourY, storyY };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. 一方向ロックロジックの検証
// ════════════════════════════════════════════════════════════════════════════

test.describe("OUR STORY 一方向ロック（数学的検証）", () => {

  test("スクロールダウン → OUR STORY が完全表示される", () => {
    // progress 0 → 0.20 まで連続スクロール
    const values = Array.from({ length: 21 }, (_, i) => i / 100);
    const { ourOp, storyOp } = simulateOneWay(values);
    expect(ourOp).toBeCloseTo(1, 5);
    expect(storyOp).toBeCloseTo(1, 5);
  });

  test("スクロールダウン後にバックしても opacity は 1 のまま", () => {
    // ダウン: 0 → 0.50
    const down  = Array.from({ length: 51 }, (_, i) => i / 100);
    // バック: 0.50 → 0 (逆順)
    const back  = Array.from({ length: 51 }, (_, i) => (50 - i) / 100);
    const { ourOp, storyOp } = simulateOneWay([...down, ...back]);

    expect(ourOp).toBe(1);
    expect(storyOp).toBe(1);
  });

  test("スクロールバック後に y は 0 のまま（吸い付かない）", () => {
    const down = Array.from({ length: 51 }, (_, i) => i / 100);
    const back = Array.from({ length: 51 }, (_, i) => (50 - i) / 100);
    const { ourY, storyY } = simulateOneWay([...down, ...back]);

    expect(ourY).toBe(0);
    expect(storyY).toBe(0);
  });

  test("旧バグ再発防止: progress 0.48〜0.54 でも OUR STORY が見えている", () => {
    // 一方向ロックでは p=0.20 以降 opacity=1 のまま固定
    const down = Array.from({ length: 21 }, (_, i) => i / 100); // 0 → 0.20
    const { ourOp: ourOpAfterReveal, storyOp: storyOpAfterReveal } = simulateOneWay(down);

    expect(ourOpAfterReveal).toBe(1);
    expect(storyOpAfterReveal).toBe(1);

    // 以降どのスクロール値になっても Math.max で 1 を維持
    const criticalRange = [0.48, 0.49, 0.50, 0.51, 0.52, 0.53, 0.54];
    for (const p of criticalRange) {
      // 既に 1 の状態から追加スクロール
      const continued = simulateOneWay([...down, p]);
      expect(continued.ourOp).toBe(1);
      expect(continued.storyOp).toBe(1);
    }
  });

  test("OUR STORY は sticky 解除 (0.75) まで opacity 1 を保つ", () => {
    // ダウン → 最終到達点 → バック を繰り返しても
    const fullScroll = Array.from(
      { length: Math.round(STICKY_UNPIN * 1000) + 1 },
      (_, i) => i / 1000
    );
    const { ourOp, storyOp } = simulateOneWay(fullScroll);
    expect(ourOp).toBe(1);
    expect(storyOp).toBe(1);
  });

  test("ページ読み込み直後 (p=0) は opacity=0 (まだ未表示)", () => {
    const { ourOp, storyOp } = simulateOneWay([0]);
    expect(ourOp).toBe(0);
    expect(storyOp).toBe(0);
  });

  test("OUR の登場が STORY より先行する (staggered entrance)", () => {
    // p=0.05 時点: OUR は途中、STORY はまだ 0
    const atP005 = simulateOneWay([0.05]);
    expect(atP005.ourOp).toBeGreaterThan(0);
    expect(atP005.storyOp).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. DOM 構造検証
// ════════════════════════════════════════════════════════════════════════════

test.describe("VideoScroller DOM 構造", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/story");
    await page.waitForLoadState("domcontentloaded");
  });

  test("z-[25] レイヤーに OUR / STORY span が存在する", async ({ page }) => {
    const result = await page.evaluate(() => {
      const layer = [...document.querySelectorAll("[class]")].find(
        el => el.className?.includes?.("z-[25]")
      );
      const spans = layer ? [...layer.querySelectorAll("span")] : [];
      return {
        layerExists: !!layer,
        spanTexts: spans.map(s => s.textContent?.trim()).filter(Boolean),
      };
    });

    expect(result.layerExists, "z-[25] レイヤーが存在しない").toBe(true);
    expect(result.spanTexts).toContain("OUR");
    expect(result.spanTexts).toContain("STORY");
  });

  test("z-20 コンテナに h2 は含まれない (独立レイヤーに移動済み)", async ({ page }) => {
    const h2InZ20 = await page.evaluate(() => {
      const z20 = document.querySelector("[class*='z-20']");
      return !!z20?.querySelector("h2");
    });
    expect(h2InZ20, "h2 が z-20 に残っている").toBe(false);
  });

  test("z-40 completion card に OUR STORY テキストが存在する", async ({ page }) => {
    const text = await page.evaluate(() => {
      const z40 = document.querySelector("[class*='z-40']");
      return z40?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    });
    expect(text).toContain("OUR");
    expect(text).toContain("STORY");
  });

  test("z-40 は z-[25] より前面 (z-index が大きい)", async ({ page }) => {
    const zIndices = await page.evaluate(() => {
      const getZ = (el: Element | null): number => {
        if (!el) return -1;
        const m = el.className?.match?.(/z-\[(\d+)\]/) ?? el.className?.match?.(/\bz-(\d+)\b/);
        return m ? parseInt(m[1]) : 0;
      };
      const z25 = [...document.querySelectorAll("[class]")].find(
        el => el.className?.includes?.("z-[25]")
      ) ?? null;
      return { z25: getZ(z25), z40: getZ(document.querySelector("[class*='z-40']")) };
    });
    expect(zIndices.z40).toBeGreaterThan(zIndices.z25);
  });

  test("ビデオスクローラーが 400vh の高さを持つ", async ({ page }) => {
    const wrapperHeight = await page.evaluate(() =>
      document.querySelector("[class*='h-\\[400vh\\]']")?.getBoundingClientRect().height ?? 0
    );
    const vh = await page.evaluate(() => window.innerHeight) as number;
    expect(wrapperHeight).toBeCloseTo(4 * vh, -1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. アクセシブルな見出し（TICKET-06）
// ════════════════════════════════════════════════════════════════════════════

test.describe("スクリーンリーダー向け実見出し", () => {
  const cases: { path: string; expected: string }[] = [
    { path: "/", expected: "KENJI" },
    { path: "/story", expected: "Our Story" },
    { path: "/details", expected: "Details" },
  ];

  for (const { path, expected } of cases) {
    test(`${path} に aria-hidden ではない sr-only の h1 が存在する`, async ({ page }) => {
      await page.goto(path);
      const h1 = page.locator("h1.sr-only").first();
      await expect(h1).toBeAttached();
      await expect(h1).not.toHaveAttribute("aria-hidden", "true");
      const text = await h1.textContent();
      expect(text).toContain(expected);
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 4. prefers-reduced-motion への対応（TICKET-04）
// ════════════════════════════════════════════════════════════════════════════

test.describe("reduced-motion 環境でのヒーロー挙動", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("/story: スクロールしなくても OUR STORY が即座に opacity:1 になっている", async ({ page }) => {
    await page.goto("/story");
    const layer = page.locator("[class*='z-\\[25\\]']").first();
    await expect(layer.locator("span", { hasText: "OUR" })).toHaveCSS("opacity", "1");
    await expect(layer.locator("span", { hasText: "STORY" })).toHaveCSS("opacity", "1");
  });

  test("/story: スクロールインジケーターの無限パルスアニメーションが付与されない", async ({ page }) => {
    await page.goto("/story");
    // usePrefersReducedMotion の反映は mount 後の再レンダーを経るため、
    // 単発の count() ではなく自動リトライする toHaveCount() で待つ
    await expect(page.locator(".vs-scroll-pulse")).toHaveCount(0);
  });

  test("/details: BlurFade でラップされたテキストがスクロール前から opacity:1 になっている", async ({ page }) => {
    await page.goto("/details");
    // 招待文（招待バナーセクション内の最初の <p>）— video-hero の装飾レイヤーは
    // <section> の外にあるため、"section p" で実コンテンツに絞り込める
    const inviteText = page.locator("section p").first();
    await expect(inviteText).toBeVisible();
    const opacity = await inviteText.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0.9);
  });
});
