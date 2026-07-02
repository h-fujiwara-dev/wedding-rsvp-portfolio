/**
 * RSVP API エンドポイント サーバーサイドバリデーション試験
 *
 * 戦略:
 *   - request.newContext() で /api/rsvp に直接 POST
 *   - Zod バリデーション（422）は外部サービス不要なのでそのまま実行可能
 *   - 201 / 429 / 500 レスポンスには実外部サービスが必要なため
 *     rsvp-form.spec.ts の page.route() モックで代替カバーしている
 */

import { test, expect, request } from "@playwright/test";
import { VALID_ATTEND_PAYLOAD, VALID_ABSENT_PAYLOAD } from "./helpers";

const BASE = `http://localhost:${process.env.TEST_PORT ?? "3000"}`;

async function postRsvp(body: unknown) {
  const ctx = await request.newContext({ baseURL: BASE });
  return ctx.post("/api/rsvp", {
    data: body,
    headers: { "content-type": "application/json" },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 1. リクエスト形式エラー（400）
// ════════════════════════════════════════════════════════════════════════════

test.describe("リクエスト形式エラー", () => {
  test("JSON でないボディを送ると 400", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/rsvp", {
      data: "not-json",
      headers: { "content-type": "text/plain" },
    });
    expect(res.status()).toBe(400);
  });

  test("空のボディを送ると 422（Zod がフィールド不足を検出）", async () => {
    const res = await postRsvp({});
    expect(res.status()).toBe(422);
  });

  test("GET リクエストは 404 または 405 が返る", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.get("/api/rsvp");
    expect([404, 405]).toContain(res.status());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. attend_or_absent バリデーション（422）
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — attend_or_absent", () => {
  test("attend_or_absent が欠落していると 422", async () => {
    const res = await postRsvp({ name: "テスト", email_address: "a@b.com" });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.attend_or_absent).toBeDefined();
  });

  test('attend_or_absent に無効な値 "maybe" を送ると 422', async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, attend_or_absent: "maybe" });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.attend_or_absent).toBeDefined();
  });

  test("attend_or_absent が数値だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, attend_or_absent: 1 });
    expect(res.status()).toBe(422);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. name バリデーション（422）
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — name", () => {
  test("name が欠落していると 422", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name: _, ...body } = VALID_ATTEND_PAYLOAD;
    const res = await postRsvp(body);
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.name).toBeDefined();
  });

  test("name が空文字だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, name: "" });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.name).toBeDefined();
  });

  test("name が 101 文字だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, name: "あ".repeat(101) });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.name).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. email_address バリデーション（422）
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — email_address", () => {
  test("email_address が欠落していると 422", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email_address: _, ...body } = VALID_ATTEND_PAYLOAD;
    const res = await postRsvp(body);
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.email_address).toBeDefined();
  });

  const invalidEmails = [
    "notanemail",
    "missing@",
    "@domain.com",
    "user@domain",
    "user name@x.com",
  ];

  for (const email of invalidEmails) {
    test(`"${email}" だと 422`, async () => {
      const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, email_address: email });
      expect(res.status()).toBe(422);
      const json = await res.json();
      expect(json.details?.email_address).toBeDefined();
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 5. number_of_participants バリデーション（422）
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — number_of_participants", () => {
  test("number_of_participants が 0 だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, number_of_participants: 0 });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.number_of_participants).toBeDefined();
  });

  test("number_of_participants が 11 だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, number_of_participants: 11 });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.number_of_participants).toBeDefined();
  });

  test("number_of_participants が小数だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, number_of_participants: 1.5 });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.number_of_participants).toBeDefined();
  });

  test("number_of_participants が文字列だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, number_of_participants: "2" });
    expect(res.status()).toBe(422);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. age バリデーション（422）
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — age", () => {
  test("age が 121 だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, age: 121 });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.age).toBeDefined();
  });

  test("age がマイナスだと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, age: -1 });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.age).toBeDefined();
  });

  test("age が文字列だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, age: "三十五" });
    expect(res.status()).toBe(422);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. postcode バリデーション（422）
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — postcode", () => {
  const invalidPostcodes = ["abc-defg", "12345678", "123-456"];

  for (const pc of invalidPostcodes) {
    test(`"${pc}" だと 422`, async () => {
      const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, postcode: pc });
      expect(res.status()).toBe(422);
      const json = await res.json();
      expect(json.details?.postcode).toBeDefined();
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 8. phone_number バリデーション（422）
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — phone_number", () => {
  const invalidPhones = ["090-123", "abc-defg-hijk", "090 1234 5678"];

  for (const ph of invalidPhones) {
    test(`"${ph}" だと 422`, async () => {
      const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, phone_number: ph });
      expect(res.status()).toBe(422);
      const json = await res.json();
      expect(json.details?.phone_number).toBeDefined();
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 9. dietary_restrictions / message バリデーション（422）
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — dietary_restrictions", () => {
  test("501 文字だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, dietary_restrictions: "あ".repeat(501) });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.dietary_restrictions).toBeDefined();
  });
});

test.describe("バリデーション — message", () => {
  test("1001 文字だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, message: "あ".repeat(1001) });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.message).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. エラーレスポンス構造
// ════════════════════════════════════════════════════════════════════════════

test.describe("エラーレスポンス構造", () => {
  test("422 レスポンスは { error, details } 構造を持つ", async () => {
    const res = await postRsvp({});
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json).toHaveProperty("error");
    expect(json).toHaveProperty("details");
    expect(typeof json.details).toBe("object");
  });

  test("複数フィールドエラー時は details に各フィールドのエラーが入る", async () => {
    const res = await postRsvp({
      // name も email_address も欠落
      attend_or_absent: "attend",
    });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.name).toBeDefined();
    expect(json.details?.email_address).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 11. address バリデーション（422）
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — address", () => {
  test("301 文字だと 422", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, address: "あ".repeat(301) });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.address).toBeDefined();
  });

  test("300 文字（上限）はスキーマ上 valid（422 を返さない）", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, address: "あ".repeat(300) });
    expect(res.status()).not.toBe(422);
  });

  test("空文字は valid（任意フィールド）", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, address: "" });
    expect(res.status()).not.toBe(422);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 12. optional フィールドの空文字・省略動作
// ════════════════════════════════════════════════════════════════════════════

test.describe("optional フィールドの空文字・省略", () => {
  test("postcode 空文字は valid（.or(z.literal('')) を使用）", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, postcode: "" });
    expect(res.status()).not.toBe(422);
  });

  test("phone_number 空文字は valid（.or(z.literal('')) を使用）", async () => {
    const res = await postRsvp({ ...VALID_ATTEND_PAYLOAD, phone_number: "" });
    expect(res.status()).not.toBe(422);
  });

  test("all optional フィールド省略でスキーマ valid（422 を返さない）", async () => {
    const res = await postRsvp({
      attend_or_absent: "attend",
      number_of_participants: 1,
      name: "テスト 太郎",
      email_address: "test@example.com",
      // age, postcode, address, phone_number, dietary_restrictions, message すべて省略
    });
    expect(res.status()).not.toBe(422);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 13. 欠席（absent）パターンのバリデーション
// ════════════════════════════════════════════════════════════════════════════

test.describe("バリデーション — absent パターン", () => {
  test("absent でも number_of_participants がないと 422（出欠に関わらず必須）", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { number_of_participants: _, ...body } = VALID_ABSENT_PAYLOAD;
    const res = await postRsvp(body);
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.number_of_participants).toBeDefined();
  });

  test("absent 時に number_of_participants を送ると valid", async () => {
    const res = await postRsvp(VALID_ABSENT_PAYLOAD);
    expect(res.status()).not.toBe(422);
  });

  test("absent でも name が欠落していると 422", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name: _, ...body } = VALID_ABSENT_PAYLOAD;
    const res = await postRsvp(body);
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.name).toBeDefined();
  });

  test("absent でも email_address が欠落していると 422", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email_address: _, ...body } = VALID_ABSENT_PAYLOAD;
    const res = await postRsvp(body);
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.details?.email_address).toBeDefined();
  });
});
