/**
 * RSVP form integration tests — validation, input, submission flow
 *
 * Strategy:
 *   - Next.js dev server running
 *   - /api/rsvp mocked via page.route() (no real Supabase/Resend)
 *   - Browser interaction → validation → submit → response handling
 */

import { test, expect } from "@playwright/test";
import {
  mockRsvpSuccess,
  mockRsvpRateLimit,
  mockRsvpServerError,
  mockRsvpApi,
  gotoRsvp,
  fillRequired,
  fillRequiredAbsent,
  fillAll,
  submitForm,
} from "./helpers";

// ════════════════════════════════════════════════════════════════════════════
// 1. Attendance field (attend_or_absent)
// ════════════════════════════════════════════════════════════════════════════

test.describe("出欠フィールド", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
  });

  test("未選択で送信すると必須エラーが表示される", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByText("Harap pilih kehadiran Anda")).toBeVisible();
  });

  test("「Hadir」を選択するとラジオが checked になる", async ({ page }) => {
    const radio = page.getByTestId("attend-radio").getByRole("radio", { name: "Hadir", exact: true });
    await radio.check();
    await expect(radio).toBeChecked();
  });

  test("「Tidak Hadir」を選択するとラジオが checked になる", async ({ page }) => {
    const radio = page.getByTestId("attend-radio").getByRole("radio", { name: /Tidak Hadir/ });
    await radio.check();
    await expect(radio).toBeChecked();
  });

  test("Hadir → Tidak Hadir と切り替えられる", async ({ page }) => {
    const attend = page.getByTestId("attend-radio").getByRole("radio", { name: "Hadir", exact: true });
    const absent = page.getByTestId("attend-radio").getByRole("radio", { name: /Tidak Hadir/ });
    await attend.check();
    await expect(attend).toBeChecked();
    await absent.check();
    await expect(absent).toBeChecked();
    await expect(attend).not.toBeChecked();
  });

  test("参加人数フィールドは出欠選択に関わらず常に表示される", async ({ page }) => {
    await expect(page.getByTestId("number-of-participants")).toBeVisible();
    await page.getByTestId("attend-radio").getByRole("radio", { name: "Hadir", exact: true }).check();
    await expect(page.getByTestId("number-of-participants")).toBeVisible();
    await page.getByTestId("attend-radio").getByRole("radio", { name: /Tidak Hadir/ }).check();
    await expect(page.getByTestId("number-of-participants")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Number of participants field
// ════════════════════════════════════════════════════════════════════════════

test.describe("参加人数フィールド", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await page.getByTestId("attend-radio").getByRole("radio", { name: "Hadir", exact: true }).check();
    await page.getByTestId("name").fill("Budi Santoso");
    await page.getByTestId("email-address").fill("budi@example.com");
  });

  test("1（最小値）は有効", async ({ page }) => {
    await page.getByTestId("number-of-participants").fill("1");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("10（最大値）は有効", async ({ page }) => {
    await page.getByTestId("number-of-participants").fill("10");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("0 を入力するとエラーが表示される", async ({ page }) => {
    await page.getByTestId("number-of-participants").fill("0");
    await submitForm(page);
    await expect(page.getByText("Masukkan minimal 1 orang")).toBeVisible();
  });

  test("11 を入力するとエラーが表示される", async ({ page }) => {
    await page.getByTestId("number-of-participants").fill("11");
    await submitForm(page);
    await expect(page.getByText("Masukkan maksimal 10 orang")).toBeVisible();
  });

  test("出席時に空欄で送信すると必須エラーが表示される", async ({ page }) => {
    await page.getByTestId("number-of-participants").clear();
    await submitForm(page);
    await expect(page.getByText("Jumlah peserta harus diisi")).toBeVisible();
    await expect(page.getByTestId("rsvp-success")).not.toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Name field
// ════════════════════════════════════════════════════════════════════════════

test.describe("氏名フィールド", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await page.getByTestId("attend-radio").getByRole("radio", { name: "Hadir", exact: true }).check();
    await page.getByTestId("number-of-participants").fill("2");
    await page.getByTestId("email-address").fill("budi@example.com");
  });

  test("空のまま送信すると必須エラーが表示される", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByText("Nama harus diisi")).toBeVisible();
  });

  test("1文字の名前は有効", async ({ page }) => {
    await page.getByTestId("name").fill("A");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("ラテン文字の氏名は有効", async ({ page }) => {
    await page.getByTestId("name").fill("Budi Santoso");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("英字の氏名は有効", async ({ page }) => {
    await page.getByTestId("name").fill("Taro Yamada");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("100文字（最大）は有効", async ({ page }) => {
    await page.getByTestId("name").fill("a".repeat(100));
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("101文字はエラーが表示される", async ({ page }) => {
    await page.getByTestId("name").fill("a".repeat(101));
    await submitForm(page);
    await expect(page.getByText("Maksimal 100 karakter")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Email field
// ════════════════════════════════════════════════════════════════════════════

test.describe("メールアドレスフィールド", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await page.getByTestId("attend-radio").getByRole("radio", { name: "Hadir", exact: true }).check();
    await page.getByTestId("number-of-participants").fill("2");
    await page.getByTestId("name").fill("Budi Santoso");
  });

  test("空のまま送信すると必須エラーが表示される", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByText("Email harus diisi")).toBeVisible();
  });

  const invalidEmails = [
    { value: "plaintext", desc: "@ なし" },
    { value: "missing@", desc: "ドメイン部分なし" },
    { value: "@domain.com", desc: "ローカル部分なし" },
    { value: "user@domain", desc: "TLD なし" },
    { value: "user name@example.com", desc: "スペースあり" },
  ];

  for (const { value, desc } of invalidEmails) {
    test(`"${desc}" は無効フォーマットエラーになる`, async ({ page }) => {
      await page.getByTestId("email-address").fill(value);
      await submitForm(page);
      await expect(page.getByText("Format email tidak valid")).toBeVisible();
    });
  }

  const validEmails = [
    "user@example.com",
    "user+tag@example.com",
    "user.name@subdomain.example.co.jp",
    "123@456.org",
  ];

  for (const email of validEmails) {
    test(`"${email}" は有効と判定される`, async ({ page }) => {
      await page.getByTestId("email-address").fill(email);
      await submitForm(page);
      await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Age field (optional)
// ════════════════════════════════════════════════════════════════════════════

test.describe("年齢フィールド（任意）", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await fillRequired(page);
  });

  test("空欄のまま送信できる", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("0（最小値）は有効", async ({ page }) => {
    await page.getByTestId("age").fill("0");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("120（最大値）は有効", async ({ page }) => {
    await page.getByTestId("age").fill("120");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("121 はエラーが表示される", async ({ page }) => {
    await page.getByTestId("age").fill("121");
    await submitForm(page);
    await expect(page.getByText("Usia maksimal 120 tahun")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Postcode field (optional) — Indonesian 5-digit format
// ════════════════════════════════════════════════════════════════════════════

test.describe("郵便番号フィールド（任意）", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await fillRequired(page);
  });

  test("空欄のまま送信できる", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  const validPostcodes = [
    { value: "12345", desc: "5桁" },
    { value: "10110", desc: "実在するコード例" },
    { value: "60231", desc: "5桁の別の例" },
  ];

  for (const { value, desc } of validPostcodes) {
    test(`${desc} "${value}" は有効`, async ({ page }) => {
      await page.getByTestId("postcode").fill(value);
      await submitForm(page);
      await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
    });
  }

  const invalidPostcodes = [
    { value: "1234", desc: "4桁（短すぎ）" },
    { value: "abcde", desc: "英字" },
    { value: "123456", desc: "6桁（長すぎ）" },
    { value: "123", desc: "3桁のみ" },
  ];

  for (const { value, desc } of invalidPostcodes) {
    test(`${desc} "${value}" はエラーが表示される`, async ({ page }) => {
      await page.getByTestId("postcode").fill(value);
      await submitForm(page);
      await expect(page.getByText("Format kode pos tidak valid")).toBeVisible();
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Phone number field (optional)
// ════════════════════════════════════════════════════════════════════════════

test.describe("電話番号フィールド（任意）", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await fillRequired(page);
  });

  test("空欄のまま送信できる", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  const validPhones = [
    { value: "08123456789", desc: "携帯電話（ハイフンなし）" },
    { value: "021-1234-5678", desc: "固定電話（ハイフンあり）" },
    { value: "+628123456789", desc: "国際番号形式" },
    { value: "(021)12345678", desc: "括弧あり" },
    { value: "0812345678", desc: "10桁" },
  ];

  for (const { value, desc } of validPhones) {
    test(`${desc} "${value}" は有効`, async ({ page }) => {
      await page.getByTestId("phone-number").fill(value);
      await submitForm(page);
      await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
    });
  }

  const invalidPhones = [
    { value: "0812-345", desc: "短すぎる（7桁）" },
    { value: "abc-defg-hijk", desc: "英字含む" },
    { value: "0812 3456 789", desc: "スペース含む" },
  ];

  for (const { value, desc } of invalidPhones) {
    test(`${desc} "${value}" はエラーが表示される`, async ({ page }) => {
      await page.getByTestId("phone-number").fill(value);
      await submitForm(page);
      await expect(page.getByText("Format nomor telepon tidak valid")).toBeVisible();
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Dietary restrictions field (optional)
// ════════════════════════════════════════════════════════════════════════════

test.describe("食事制限フィールド（任意）", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await fillRequired(page);
  });

  test("空欄のまま送信できる", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("通常のテキストは有効", async ({ page }) => {
    await page.getByTestId("dietary-restrictions").fill("Alergi kacang dan susu");
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("500文字（最大）は有効", async ({ page }) => {
    await page.getByTestId("dietary-restrictions").fill("a".repeat(500));
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("501文字はエラーが表示される", async ({ page }) => {
    await page.getByTestId("dietary-restrictions").fill("a".repeat(501));
    await submitForm(page);
    await expect(page.getByText("Maksimal 500 karakter")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Message field (optional)
// ════════════════════════════════════════════════════════════════════════════

test.describe("メッセージフィールド（任意）", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await fillRequired(page);
  });

  test("空欄のまま送信できる", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("1000文字（最大）は有効", async ({ page }) => {
    await page.getByTestId("message").fill("a".repeat(1000));
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("1001文字はエラーが表示される", async ({ page }) => {
    await page.getByTestId("message").fill("a".repeat(1001));
    await submitForm(page);
    await expect(page.getByText("Maksimal 1.000 karakter")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. Submission flow
// ════════════════════════════════════════════════════════════════════════════

test.describe("送信フロー", () => {
  test("全10項目を入力して送信すると成功メッセージが表示される", async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await fillAll(page);
    await submitForm(page);

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Terima Kasih")).toBeVisible();
    await expect(page.getByTestId("rsvp-form")).not.toBeVisible();
  });

  test("欠席パターン（必須4項目のみ）で送信できる", async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await fillRequiredAbsent(page);
    await submitForm(page);

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("送信中はボタンが無効化されて「Mengirim...」と表示される", async ({ page }) => {
    await mockRsvpSuccess(page, 500);
    await gotoRsvp(page);
    await fillRequired(page);

    await submitForm(page);

    const btn = page.getByTestId("rsvp-submit");
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveText("Mengirim...");

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("API 429 → レートリミットエラーが表示される", async ({ page }) => {
    await mockRsvpRateLimit(page);
    await gotoRsvp(page);
    await fillRequired(page);
    await submitForm(page);

    await expect(page.getByTestId("rsvp-error")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Terlalu banyak permintaan")).toBeVisible();
  });

  test("API 500 → サーバーエラーが表示される", async ({ page }) => {
    await mockRsvpServerError(page);
    await gotoRsvp(page);
    await fillRequired(page);
    await submitForm(page);

    await expect(page.getByTestId("rsvp-error")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Gagal menyimpan data")).toBeVisible();
  });

  test("エラー後にフォームを修正して再送信できる", async ({ page }) => {
    await mockRsvpServerError(page);
    await gotoRsvp(page);
    await fillRequired(page);
    await submitForm(page);
    await expect(page.getByTestId("rsvp-error")).toBeVisible({ timeout: 10_000 });

    await mockRsvpSuccess(page);
    await submitForm(page);
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("送信後は成功メッセージとフォームが同時に存在しない", async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
    await fillRequired(page);
    await submitForm(page);

    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("rsvp-form")).not.toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 11. Accessibility
// ════════════════════════════════════════════════════════════════════════════

test.describe("アクセシビリティ", () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpSuccess(page);
    await gotoRsvp(page);
  });

  test("全フォームフィールドに label が対応している", async ({ page }) => {
    const inputs = ["name", "email-address", "age", "postcode", "address", "phone-number"];
    for (const testId of inputs) {
      const input = page.getByTestId(testId);
      await expect(input).toHaveAttribute("id");
    }
  });

  test("エラーメッセージは role=alert または aria-live で通知される", async ({ page }) => {
    await submitForm(page);
    await expect(page.getByText("Harap pilih kehadiran Anda")).toBeVisible();
  });

  test("送信ボタンはキーボード（Enter）で動作する", async ({ page }) => {
    await fillRequired(page);
    const btn = page.getByTestId("rsvp-submit");
    await btn.focus();
    await btn.press("Enter");
    await expect(page.getByTestId("rsvp-success")).toBeVisible({ timeout: 10_000 });
  });

  test("ラジオグループは矢印キーで切り替えられる", async ({ page }) => {
    const attendRadio = page.getByTestId("attend-radio").getByRole("radio", { name: "Hadir", exact: true });
    const absentRadio = page.getByTestId("attend-radio").getByRole("radio", { name: /Tidak Hadir/ });

    await attendRadio.focus();
    await page.keyboard.press("ArrowRight");
    await expect(absentRadio).toBeChecked();
  });
});
