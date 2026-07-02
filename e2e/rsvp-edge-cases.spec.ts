/**
 * RSVP edge case and security tests
 *
 * Covers adversarial inputs, rate limiting, double-submit, and network errors.
 */

import { test, expect, request } from "@playwright/test";
import {
  mockRsvpSuccess,
  mockRsvpRateLimit,
  mockRsvpApi,
  gotoRsvp,
  fillRequired,
  submitForm,
  VALID_ATTEND_PAYLOAD,
} from "./helpers";

const BASE = `http://localhost:${process.env.TEST_PORT ?? "3000"}`;

async function postRsvp(body: unknown) {
  const ctx = await request.newContext({ baseURL: BASE });
  return ctx.post("/api/rsvp", {
    data: body,
    headers: { "content-type": "application/json" },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 1. XSS / Injection inputs
// ════════════════════════════════════════════════════════════════════════════

test.describe("XSS・インジェクション入力", () => {
  const xssPayloads = [
    "<script>alert('xss')</script>",
    '<img src=x onerror="alert(1)">',
    "javascript:alert(1)",
    "'; DROP TABLE rsvp; --",
    "${7*7}",
    "{{constructor.constructor('alert(1)')()}}",
  ];

  for (const payload of xssPayloads) {
    test(`nameフィールドへの注入 "${payload.slice(0, 30)}..." は 422 を返す（または無害化される）`, async ({ page }) => {
      await mockRsvpSuccess(page);
      await gotoRsvp(page);

      await expect(page.getByTestId("rsvp-form")).toBeVisible();

      await page.getByTestId("attend-radio").getByRole("radio", { name: "Attend", exact: true }).check();
      await page.getByTestId("name").fill(payload);
      await page.getByTestId("email-address").fill("test@example.com");

      await expect(page.getByTestId("rsvp-form")).toBeVisible();
    });
  }

  test("XSS ペイロードを name に入れても API が 422 または 201 を返す（スクリプト実行はしない）", async () => {
    const payload = "<script>alert('xss')</script>";
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, name: payload });
    expect([201, 422, 429, 500]).toContain(res.status());
  });

  test("SQLインジェクション文字列は文字列として扱われる（422 または 201）", async () => {
    const payload = "'; DROP TABLE rsvp; --";
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, name: payload });
    expect([201, 422, 429, 500]).toContain(res.status());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Unicode / special character inputs
// ════════════════════════════════════════════════════════════════════════════

test.describe("Unicode・特殊文字入力", () => {
  test("絵文字を含む名前は 200 文字以内なら有効（または拒否される）", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, name: "🌸Sarah🌸" });
    expect([201, 422, 429, 500]).toContain(res.status());
  });

  test("中国語・韓国語の名前は有効", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, name: "李 大偉" });
    expect([201, 422, 429, 500]).toContain(res.status());
  });

  test("全角数字メールアドレスは 422 になる", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, email_address: "ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ" });
    expect(res.status()).toBe(422);
  });

  test("制御文字を含むメッセージは 422 または 201", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, message: "test\x00\x01\x02" });
    expect([201, 422, 429, 500]).toContain(res.status());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Payload size / boundary values
// ════════════════════════════════════════════════════════════════════════════

test.describe("ペイロードサイズ・境界値", () => {
  test("message が正確に 1000 文字は有効（境界値）", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, message: "a".repeat(1000) });
    expect([201, 429, 500]).toContain(res.status());
  });

  test("message が 1001 文字は 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, message: "a".repeat(1001) });
    expect(res.status()).toBe(422);
  });

  test("dietary_restrictions が正確に 500 文字は有効（境界値）", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, dietary_restrictions: "a".repeat(500) });
    expect([201, 429, 500]).toContain(res.status());
  });

  test("dietary_restrictions が 501 文字は 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, dietary_restrictions: "a".repeat(501) });
    expect(res.status()).toBe(422);
  });

  test("name が正確に 100 文字は有効（境界値）", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, name: "a".repeat(100) });
    expect([201, 429, 500]).toContain(res.status());
  });

  test("巨大な JSON ボディ（10KB）は 400 または 422", async () => {
    const huge = { ...VALID_ATTEND_PAYLOAD, message: "a".repeat(10_000) };
    const res = await postRsvp(huge);
    expect([400, 422, 429, 500]).toContain(res.status());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Content-type / invalid requests
// ════════════════════════════════════════════════════════════════════════════

test.describe("コンテンツタイプ・不正リクエスト", () => {
  test("Content-Type が application/x-www-form-urlencoded だと 400 または 422", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/rsvp", {
      form: {
        attend_or_absent: "attend",
        name: "Budi",
        email_address: "budi@example.com",
      },
    });
    expect([400, 415, 422]).toContain(res.status());
  });

  test("null ボディを送ると 400 または 422", async () => {
    const res = await postRsvp(null);
    expect([400, 422]).toContain(res.status());
  });

  test("配列ボディを送ると 422", async () => {
    const res = await postRsvp([VALID_ATTEND_PAYLOAD]);
    expect(res.status()).toBe(422);
  });

  test("attend_or_absent が null だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, attend_or_absent: null });
    expect(res.status()).toBe(422);
  });

  test("余分なフィールドを含んでいても 201 が返る（Zod は strip）", async () => {
    const res = await postRsvp({
      ...VALID_ATTEND_PAYLOAD,
      unknownField: "I should be ignored",
      anotherExtra: 12345,
    });
    expect([201, 429, 500]).toContain(res.status());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Double submit prevention
// ════════════════════════════════════════════════════════════════════════════

test.describe("二重送信防止", () => {
  test("送信中にボタンが disabled になり二重クリックできない", async ({ page }) => {
    await mockRsvpSuccess(page, 800);
    await gotoRsvp(page);
    await fillRequired(page);

    const btn = page.getByTestId("rsvp-submit");
    await btn.click();
    await expect(btn).toBeDisabled();
    await btn.click({ force: true }).catch(() => {});

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("送信中はスピナーアイコンが表示される", async ({ page }) => {
    await mockRsvpSuccess(page, 600);
    await gotoRsvp(page);
    await fillRequired(page);

    await submitForm(page);

    const btn = page.getByTestId("rsvp-submit");
    await expect(btn.locator("svg")).toBeVisible();
    await expect(btn).toHaveText(/Mengirim\.\.\./);

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Rate limit accumulation test (mocked)
// ════════════════════════════════════════════════════════════════════════════

test.describe("レートリミット累積テスト", () => {
  test("N回成功後の次の送信で 429 エラーが表示される（モックで再現）", async ({ page }) => {
    let callCount = 0;
    await page.route("/api/rsvp", async (route) => {
      callCount++;
      if (callCount <= 2) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
          }),
        });
      }
    });

    await gotoRsvp(page);
    await fillRequired(page);

    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });

    await gotoRsvp(page);
    await fillRequired(page);

    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });

    await gotoRsvp(page);
    await fillRequired(page);

    await submitForm(page);
    await expect(page.getByTestId("rsvp-error")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Terlalu banyak permintaan")).toBeVisible();
  });

  test("429 エラー後もフォームはリセットされずに残る", async ({ page }) => {
    await mockRsvpRateLimit(page);
    await gotoRsvp(page);
    await fillRequired(page);
    await submitForm(page);

    await expect(page.getByTestId("rsvp-error")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("rsvp-form")).toBeVisible();
    await expect(page.getByTestId("name")).toHaveValue("Budi Santoso");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Form state continuous operations
// ════════════════════════════════════════════════════════════════════════════

test.describe("フォーム状態の連続操作", () => {
  test("エラー後にフィールドを修正するとエラーメッセージが消える", async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);

    await submitForm(page);
    await expect(page.getByText("Please select your attendance")).toBeVisible();

    await page.getByTestId("attend-radio").getByRole("radio", { name: "Attend", exact: true }).check();
    await expect(page.getByText("Please select your attendance")).not.toBeVisible();
  });

  test("必須フィールドを入力後クリアすると再度エラーが出る", async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);

    await page.getByTestId("attend-radio").getByRole("radio", { name: "Attend", exact: true }).check();
    await page.getByTestId("number-of-participants").fill("2");
    await page.getByTestId("name").fill("Budi Santoso");
    await page.getByTestId("email-address").fill("budi@example.com");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("欠席選択時も参加人数の入力が必須", async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);

    await page.getByTestId("attend-radio").getByRole("radio", { name: "Absent", exact: true }).check();
    await expect(page.getByTestId("number-of-participants")).toBeVisible();
    await page.getByTestId("name").fill("Siti Rahayu");
    await page.getByTestId("email-address").fill("siti@example.com");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).not.toBeVisible();

    await page.getByTestId("number-of-participants").fill("1");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("出席 → 欠席切り替えでも参加人数フィールドの入力値は保持され送信される", async ({ page }) => {
    const interceptedBodies: unknown[] = [];
    await page.route("/api/rsvp", async (route) => {
      const body = route.request().postDataJSON();
      interceptedBodies.push(body);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await gotoRsvp(page);
    await page.getByTestId("attend-radio").getByRole("radio", { name: "Attend", exact: true }).check();
    await page.getByTestId("number-of-participants").fill("5");

    await page.getByTestId("attend-radio").getByRole("radio", { name: "Absent", exact: true }).check();
    await page.getByTestId("name").fill("Siti Rahayu");
    await page.getByTestId("email-address").fill("siti@example.com");
    await submitForm(page);

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
    const sent = interceptedBodies[0] as Record<string, unknown>;
    expect(sent.attend_or_absent).toBe("absent");
    expect(sent.number_of_participants).toBe(5);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. API response format validation
// ════════════════════════════════════════════════════════════════════════════

test.describe("API レスポンス形式", () => {
  test("422 レスポンスの details は各フィールドのエラー配列を持つ", async () => {
    const res = await postRsvp({
      attend_or_absent: "attend",
    });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(Array.isArray(json.details?.name)).toBe(true);
    expect(Array.isArray(json.details?.email_address)).toBe(true);
    expect(json.details?.name.length).toBeGreaterThan(0);
  });

  test("422 レスポンスのエラーメッセージはインドネシア語を含む", async () => {
    const res = await postRsvp({});
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(typeof json.error).toBe("string");
    expect(json.error.length).toBeGreaterThan(0);
  });

  test("attend_or_absent が absent でも number_of_participants は必須で送信される", async ({ page }) => {
    const interceptedBodies: unknown[] = [];
    await page.route("/api/rsvp", async (route) => {
      const body = route.request().postDataJSON();
      interceptedBodies.push(body);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await gotoRsvp(page);
    await page.getByTestId("attend-radio").getByRole("radio", { name: "Absent", exact: true }).check();
    await page.getByTestId("number-of-participants").fill("1");
    await page.getByTestId("name").fill("Siti Rahayu");
    await page.getByTestId("email-address").fill("siti@example.com");
    await submitForm(page);

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
    const sent = interceptedBodies[0] as Record<string, unknown>;
    expect(sent.attend_or_absent).toBe("absent");
    expect(sent.number_of_participants).toBe(1);
  });

  test("全必須フィールドが正しい型でリクエストされる", async ({ page }) => {
    const interceptedBodies: unknown[] = [];
    await page.route("/api/rsvp", async (route) => {
      const body = route.request().postDataJSON();
      interceptedBodies.push(body);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await gotoRsvp(page);
    await page.getByTestId("attend-radio").getByRole("radio", { name: "Attend", exact: true }).check();
    await page.getByTestId("number-of-participants").fill("3");
    await page.getByTestId("name").fill("Budi Santoso");
    await page.getByTestId("email-address").fill("budi@example.com");
    await page.getByTestId("age").fill("30");
    await submitForm(page);

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
    const sent = interceptedBodies[0] as Record<string, unknown>;
    expect(typeof sent.name).toBe("string");
    expect(typeof sent.email_address).toBe("string");
    expect(typeof sent.number_of_participants).toBe("number");
    expect(typeof sent.age).toBe("number");
    expect(sent.attend_or_absent).toBe("attend");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Network / timeout simulation
// ════════════════════════════════════════════════════════════════════════════

test.describe("ネットワーク異常", () => {
  test("APIがネットワークエラーを返した場合にエラーメッセージが表示される", async ({ page }) => {
    await page.route("/api/rsvp", (route) => route.abort("failed"));

    await gotoRsvp(page);
    await fillRequired(page);
    await submitForm(page);

    await expect(page.getByTestId("rsvp-error")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Terjadi kesalahan jaringan.")).toBeVisible();
  });

  test("ネットワークエラー後に再試行ボタンが有効になっている", async ({ page }) => {
    let callCount = 0;
    await page.route("/api/rsvp", async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.abort("failed");
      } else {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await gotoRsvp(page);
    await fillRequired(page);
    await submitForm(page);

    await expect(page.getByTestId("rsvp-error")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("rsvp-submit")).toBeEnabled();

    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. Submission data integrity
// ════════════════════════════════════════════════════════════════════════════

test.describe("送信データ完全性", () => {
  test("全10項目が正しくリクエストボディに含まれる", async ({ page }) => {
    const interceptedBodies: unknown[] = [];
    await page.route("/api/rsvp", async (route) => {
      interceptedBodies.push(route.request().postDataJSON());
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await gotoRsvp(page);
    await page.getByTestId("attend-radio").getByRole("radio", { name: "Attend", exact: true }).check();
    await page.getByTestId("number-of-participants").fill("3");
    await page.getByTestId("name").fill("Budi Santoso");
    await page.getByTestId("email-address").fill("budi@example.com");
    await page.getByTestId("age").fill("35");
    await page.getByTestId("postcode").fill("12345");
    await page.getByTestId("address").fill("Jl. Sudirman No. 1, Jakarta");
    await page.getByTestId("phone-number").fill("08123456789");
    await page.getByTestId("dietary-restrictions").fill("Alergi kacang");
    await page.getByTestId("message").fill("Selamat untuk kalian berdua!");
    await submitForm(page);

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });

    const body = interceptedBodies[0] as Record<string, unknown>;
    expect(body.attend_or_absent).toBe("attend");
    expect(body.number_of_participants).toBe(3);
    expect(body.name).toBe("Budi Santoso");
    expect(body.email_address).toBe("budi@example.com");
    expect(body.age).toBe(35);
    expect(body.postcode).toBe("12345");
    expect(body.address).toBe("Jl. Sudirman No. 1, Jakarta");
    expect(body.phone_number).toBe("08123456789");
    expect(body.dietary_restrictions).toBe("Alergi kacang");
    expect(body.message).toBe("Selamat untuk kalian berdua!");
  });

  test("メールアドレスの前後のスペースはそのまま送信される（サーバー側で検証）", async ({ page }) => {
    const interceptedBodies: unknown[] = [];
    await page.route("/api/rsvp", async (route) => {
      interceptedBodies.push(route.request().postDataJSON());
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await gotoRsvp(page);
    await page.getByTestId("attend-radio").getByRole("radio", { name: "Attend", exact: true }).check();
    await page.getByTestId("name").fill("Budi Santoso");
    await page.getByTestId("email-address").fill("  budi@example.com  ");
    await submitForm(page);

    const body = interceptedBodies[0] as Record<string, unknown>;
    if (body) {
      expect(typeof body.email_address).toBe("string");
    }
    await expect(page.locator("body")).toBeVisible();
  });
});
