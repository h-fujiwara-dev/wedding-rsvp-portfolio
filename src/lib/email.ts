import { Resend } from "resend";
import type { RsvpFormValues } from "./schema";
import { type Locale, translate } from "./i18n";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

// Escape user-supplied strings before inserting into HTML
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

interface EmailCopy {
  docTitle: string;
  eyebrow: string;
  heading: (attending: boolean) => string;
  bodyIntro: (attending: boolean) => string;
  guestCountLabel: string;
  guestCountValue: (count: number) => string;
  dietaryLabel: string;
  contactNote: string;
  subject: (attending: boolean) => string;
}

const EMAIL_COPY: Record<Locale, EmailCopy> = {
  id: {
    docTitle: "Konfirmasi RSVP",
    eyebrow: "Konfirmasi RSVP",
    heading: (attending) =>
      attending
        ? "Terima kasih atas konfirmasi kehadiran Anda"
        : "Terima kasih atas konfirmasi Anda",
    bodyIntro: (attending) =>
      attending
        ? "RSVP Anda telah kami terima. Kami sangat menantikan kehadiran Anda di hari istimewa kami."
        : "Terima kasih telah memberi kabar. Kami sangat menyesal tidak dapat bertemu Anda, namun kami tetap mendoakan yang terbaik untuk Anda.",
    guestCountLabel: "Jumlah Tamu",
    guestCountValue: (count) => `${count} orang`,
    dietaryLabel: "Pantangan Makanan / Alergi",
    contactNote: "Jika ada pertanyaan, jangan ragu untuk menghubungi kami.",
    subject: (attending) =>
      attending
        ? "Konfirmasi Kehadiran — RSVP Anda Telah Diterima"
        : "Konfirmasi RSVP — Terima Kasih",
  },
  en: {
    docTitle: "RSVP Confirmation",
    eyebrow: "RSVP Confirmation",
    heading: (attending) =>
      attending
        ? "Thank you for confirming your attendance"
        : "Thank you for letting us know",
    bodyIntro: (attending) =>
      attending
        ? "Your RSVP has been received. We can't wait to celebrate with you on our special day."
        : "Thank you for letting us know. We're sorry we won't be able to celebrate together, but we wish you all the best.",
    guestCountLabel: "Number of Guests",
    guestCountValue: (count) => `${count} ${count === 1 ? "guest" : "guests"}`,
    dietaryLabel: "Dietary Restrictions / Allergies",
    contactNote: "If you have any questions, please don't hesitate to contact us.",
    subject: (attending) =>
      attending
        ? "Attendance Confirmed — Your RSVP Has Been Received"
        : "RSVP Confirmation — Thank You",
  },
  ja: {
    docTitle: "RSVP確認",
    eyebrow: "RSVP確認",
    heading: (attending) =>
      attending ? "ご出席のご連絡ありがとうございます" : "ご連絡ありがとうございます",
    bodyIntro: (attending) =>
      attending
        ? "RSVPを受け付けました。特別な一日にお会いできることを楽しみにしております。"
        : "ご連絡ありがとうございます。残念ながら一緒にお祝いできませんが、心よりお祈り申し上げます。",
    guestCountLabel: "ご参加人数",
    guestCountValue: (count) => `${count}名`,
    dietaryLabel: "アレルギー・食事制限",
    contactNote: "ご不明な点がございましたら、お気軽にお問い合わせください。",
    subject: (attending) =>
      attending ? "出席確認 — RSVPを受け付けました" : "RSVP確認 — ありがとうございます",
  },
};

function buildConfirmationHtml(data: RsvpFormValues, locale: Locale): string {
  const copy = EMAIL_COPY[locale];
  const attending = data.attend_or_absent === "attend";
  const safeName = escapeHtml(data.name);
  const safeDietary = data.dietary_restrictions ? escapeHtml(data.dietary_restrictions) : "";
  const dateVenue = translate(locale, "hero.dateVenue");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${copy.docTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2EDE3;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2EDE3;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #D8D2C5;">
          <!-- Header -->
          <tr>
            <td style="background-color:#2C2B1E;padding:40px;text-align:center;">
              <p style="margin:0;font-family:'Georgia',serif;font-size:32px;font-style:italic;color:#F2EDE3;letter-spacing:0.15em;">K&amp;S</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:48px 40px;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#8C8A78;">${copy.eyebrow}</p>
              <h1 style="margin:0 0 32px;font-size:28px;font-weight:400;color:#2C2B1E;letter-spacing:0.05em;">
                ${copy.heading(attending)}
              </h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.8;color:#2C2B1E;">
                ${safeName},<br/>
                ${copy.bodyIntro(attending)}
              </p>
              ${attending ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #D8D2C5;margin:32px 0;">
                <tr><td style="padding:16px 0;border-bottom:1px solid #D8D2C5;">
                  <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8C8A78;">${copy.guestCountLabel}</p>
                  <p style="margin:4px 0 0;font-size:16px;color:#2C2B1E;">${copy.guestCountValue(data.number_of_participants)}</p>
                </td></tr>
                ${safeDietary ? `
                <tr><td style="padding:16px 0;border-bottom:1px solid #D8D2C5;">
                  <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8C8A78;">${copy.dietaryLabel}</p>
                  <p style="margin:4px 0 0;font-size:16px;color:#2C2B1E;">${safeDietary}</p>
                </td></tr>` : ""}
              </table>` : ""}
              <p style="margin:32px 0 0;font-size:14px;line-height:1.8;color:#8C8A78;">
                ${copy.contactNote}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#E8E3D5;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#8C8A78;">
                ${dateVenue}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendConfirmationEmail(data: RsvpFormValues, locale: Locale) {
  const copy = EMAIL_COPY[locale];
  const attending = data.attend_or_absent === "attend";
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";
  await getResend().emails.send({
    from: `KENJI & Sarah <${from}>`,
    to: data.email_address,
    subject: copy.subject(attending),
    html: buildConfirmationHtml(data, locale),
  });
}
