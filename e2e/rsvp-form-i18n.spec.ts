/**
 * RSVP form — locale-aware validation & payload tests
 *
 * RsvpForm rebuilds its Zod schema per locale (`useMemo(() => createRsvpSchema(t), [locale])`)
 * and posts `locale` in the /api/rsvp request body. rsvp-form.spec.ts / rsvp-api.spec.ts /
 * rsvp-edge-cases.spec.ts only exercise the default id locale — this file covers en/ja.
 */

import { test, expect, type Page } from "@playwright/test";
import { mockRsvpSuccess, gotoRsvp, submitForm, setLocale } from "./helpers";

// fillAll()/fillRequired() in helpers.ts hardcode the Indonesian radio labels
// ("Hadir"/"Tidak Hadir"), so they can't be reused once the locale is switched.
async function fillRequiredEn(page: Page) {
  await page.getByTestId("attend-radio").getByRole("radio", { name: "Attend", exact: true }).check();
  await page.getByTestId("number-of-participants").fill("2");
  await page.getByTestId("name").fill("Jane Doe");
  await page.getByTestId("email-address").fill("jane@example.com");
}

test.describe("EN ロケール — 必須フィールドバリデーション", () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, "en");
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
  });

  test("未入力で送信すると英語の必須エラーが表示される", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByText("Please select your attendance")).toBeVisible();
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Email is required")).toBeVisible();
  });
});

test.describe("EN ロケール — 送信フロー", () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, "en");
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
  });

  test("入力して送信すると英語の完了メッセージが表示される", async ({ page }) => {
    await fillRequiredEn(page);
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible();
    await expect(page.getByText("Thank You")).toBeVisible();
    await expect(page.getByText("Your RSVP has been received.")).toBeVisible();
  });

  test("API送信ボディに locale='en' が含まれる", async ({ page }) => {
    let requestBody: Record<string, unknown> | undefined;
    await page.route("/api/rsvp", async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await fillRequiredEn(page);
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible();
    expect(requestBody?.locale).toBe("en");
  });
});

test.describe("JA ロケール — 必須フィールドバリデーション", () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, "ja");
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
  });

  test("未入力で送信すると日本語の必須エラーが表示される", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByText("出欠を選択してください")).toBeVisible();
    await expect(page.getByText("氏名を入力してください")).toBeVisible();
    await expect(page.getByText("メールアドレスを入力してください")).toBeVisible();
  });

  test("郵便番号のフォーマットエラーが日本語で表示される", async ({ page }) => {
    await page.getByTestId("attend-radio").getByRole("radio", { name: "出席", exact: true }).check();
    await page.getByTestId("number-of-participants").fill("2");
    await page.getByTestId("name").fill("山田太郎");
    await page.getByTestId("email-address").fill("taro@example.com");
    await page.getByTestId("postcode").fill("abc");
    await submitForm(page);
    await expect(page.getByText("郵便番号の形式が正しくありません（例: 150-0002）")).toBeVisible();
  });
});

test.describe("JA ロケール — API 送信ボディ", () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, "ja");
    await gotoRsvp(page);
  });

  test("locale='ja' が含まれる", async ({ page }) => {
    let requestBody: Record<string, unknown> | undefined;
    await page.route("/api/rsvp", async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await page.getByTestId("attend-radio").getByRole("radio", { name: "出席", exact: true }).check();
    await page.getByTestId("number-of-participants").fill("2");
    await page.getByTestId("name").fill("山田太郎");
    await page.getByTestId("email-address").fill("taro@example.com");
    await submitForm(page);

    await expect(page.getByTestId("rsvp-success")).toBeVisible();
    expect(requestBody?.locale).toBe("ja");
  });
});

test.describe("ロケール切り替え後にエラーメッセージ言語も追従する", () => {
  test("id → EN 切り替え後、再送信すると英語エラーに変わる", async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);

    await submitForm(page);
    await expect(page.getByText("Harap pilih kehadiran Anda")).toBeVisible();

    await page.getByRole("button", { name: /Switch to EN/i }).click();
    await submitForm(page);
    await expect(page.getByText("Please select your attendance")).toBeVisible();
  });
});
