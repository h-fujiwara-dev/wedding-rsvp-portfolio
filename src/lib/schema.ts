import { z } from "zod";

// ID postcode (12345) or JP postcode (150-0002 / 1500002)
const POSTCODE_REGEX = /^(\d{5}|\d{3}-?\d{4})$/;
// Digits/+()- only (no spaces); widened upper bound to fit hyphenated
// country-code numbers like "+81-90-1234-5678" (16 chars)
const PHONE_REGEX = /^[\d\-+()]{10,17}$/;

export function createRsvpSchema(t: (key: string) => string) {
  return z
    .object({
      attend_or_absent: z.enum(["attend", "absent"], {
        error: t("form.err.attendRequired"),
      }),

      number_of_participants: z
        .number({ error: t("form.err.participantsRequired") })
        .int(t("form.err.participantsInt"))
        .min(1, t("form.err.participantsMin"))
        .max(10, t("form.err.participantsMax")),

      name: z
        .string()
        .min(1, t("form.err.nameRequired"))
        .max(100, t("form.err.nameMax")),

      email_address: z
        .string()
        .min(1, t("form.err.emailRequired"))
        .email(t("form.err.emailInvalid")),

      age: z
        .number()
        .int(t("form.err.ageInt"))
        .min(0, t("form.err.ageMin"))
        .max(120, t("form.err.ageMax"))
        .optional(),

      postcode: z
        .string()
        .regex(POSTCODE_REGEX, t("form.err.postcodeInvalid"))
        .or(z.literal(""))
        .optional(),

      address: z.string().max(300, t("form.err.addressMax")).optional(),

      phone_number: z
        .string()
        .regex(PHONE_REGEX, t("form.err.phoneInvalid"))
        .or(z.literal(""))
        .optional(),

      dietary_restrictions: z
        .string()
        .max(500, t("form.err.dietaryMax"))
        .optional(),

      message: z.string().max(1000, t("form.err.messageMax")).optional(),
    });
}

export type RsvpFormValues = z.infer<ReturnType<typeof createRsvpSchema>>;
