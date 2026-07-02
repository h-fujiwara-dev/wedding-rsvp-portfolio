import { describe, it, expect } from "vitest";
import { createRsvpSchema } from "./schema";

const t = (key: string) => key;

const validAttend = {
  attend_or_absent: "attend" as const,
  number_of_participants: 3,
  name: "Budi Santoso",
  email_address: "budi@example.com",
  age: 35,
  postcode: "12345",
  address: "Jl. Sudirman No. 1, Jakarta",
  phone_number: "08123456789",
  dietary_restrictions: "Alergi kacang",
  message: "Selamat untuk kalian berdua!",
};

const validAbsentMinimal = {
  attend_or_absent: "absent" as const,
  number_of_participants: 2,
  name: "Siti Rahayu",
  email_address: "siti@example.com",
};

function firstError(result: ReturnType<ReturnType<typeof createRsvpSchema>["safeParse"]>) {
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

describe("createRsvpSchema — valid payloads", () => {
  it("accepts a full valid attend payload", () => {
    const result = createRsvpSchema(t).safeParse(validAttend);
    expect(result.success).toBe(true);
  });

  it("accepts a minimal valid absent payload (only required fields)", () => {
    const result = createRsvpSchema(t).safeParse(validAbsentMinimal);
    expect(result.success).toBe(true);
  });
});

describe("createRsvpSchema — attend_or_absent", () => {
  it("errors when missing", () => {
    const { attend_or_absent, ...rest } = validAttend;
    const result = createRsvpSchema(t).safeParse(rest);
    expect(firstError(result)).toBe("form.err.attendRequired");
  });

  it("errors on an invalid enum value", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, attend_or_absent: "maybe" });
    expect(result.success).toBe(false);
  });
});

describe("createRsvpSchema — number_of_participants", () => {
  it("errors when missing", () => {
    const { number_of_participants, ...rest } = validAttend;
    const result = createRsvpSchema(t).safeParse(rest);
    expect(firstError(result)).toBe("form.err.participantsRequired");
  });

  it("errors when 0 (below min)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, number_of_participants: 0 });
    expect(firstError(result)).toBe("form.err.participantsMin");
  });

  it("accepts 1 (boundary min)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, number_of_participants: 1 });
    expect(result.success).toBe(true);
  });

  it("accepts 10 (boundary max)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, number_of_participants: 10 });
    expect(result.success).toBe(true);
  });

  it("errors when 11 (above max)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, number_of_participants: 11 });
    expect(firstError(result)).toBe("form.err.participantsMax");
  });

  it("errors on a non-integer value", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, number_of_participants: 2.5 });
    expect(firstError(result)).toBe("form.err.participantsInt");
  });
});

describe("createRsvpSchema — name", () => {
  it("errors when empty", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, name: "" });
    expect(firstError(result)).toBe("form.err.nameRequired");
  });

  it("accepts length 100 (boundary)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, name: "a".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("errors at length 101 (above max)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, name: "a".repeat(101) });
    expect(firstError(result)).toBe("form.err.nameMax");
  });
});

describe("createRsvpSchema — email_address", () => {
  it("errors when empty", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, email_address: "" });
    expect(firstError(result)).toBe("form.err.emailRequired");
  });

  it("errors on an invalid format", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, email_address: "not-an-email" });
    expect(firstError(result)).toBe("form.err.emailInvalid");
  });
});

describe("createRsvpSchema — age (optional)", () => {
  it("accepts being omitted", () => {
    const { age, ...rest } = validAttend;
    const result = createRsvpSchema(t).safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts 0 (boundary min)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, age: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts 120 (boundary max)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, age: 120 });
    expect(result.success).toBe(true);
  });

  it("errors at -1 (below min)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, age: -1 });
    expect(firstError(result)).toBe("form.err.ageMin");
  });

  it("errors at 121 (above max)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, age: 121 });
    expect(firstError(result)).toBe("form.err.ageMax");
  });

  it("errors on a non-integer value", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, age: 30.5 });
    expect(firstError(result)).toBe("form.err.ageInt");
  });
});

describe("createRsvpSchema — postcode (optional)", () => {
  it("accepts being omitted", () => {
    const { postcode, ...rest } = validAttend;
    const result = createRsvpSchema(t).safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts an empty string", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, postcode: "" });
    expect(result.success).toBe(true);
  });

  it("accepts a 5-digit ID postcode", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, postcode: "12345" });
    expect(result.success).toBe(true);
  });

  it("accepts a hyphenated JP postcode", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, postcode: "150-0002" });
    expect(result.success).toBe(true);
  });

  it("accepts a 7-digit JP postcode without hyphen", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, postcode: "1500002" });
    expect(result.success).toBe(true);
  });

  it("errors on a 4-digit postcode", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, postcode: "1234" });
    expect(firstError(result)).toBe("form.err.postcodeInvalid");
  });

  it("errors on a 6-digit postcode", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, postcode: "123456" });
    expect(firstError(result)).toBe("form.err.postcodeInvalid");
  });

  it("errors on non-numeric input", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, postcode: "abcde" });
    expect(firstError(result)).toBe("form.err.postcodeInvalid");
  });
});

describe("createRsvpSchema — address (optional)", () => {
  it("accepts being omitted", () => {
    const { address, ...rest } = validAttend;
    const result = createRsvpSchema(t).safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts length 300 (boundary)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, address: "a".repeat(300) });
    expect(result.success).toBe(true);
  });

  it("errors at length 301 (above max)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, address: "a".repeat(301) });
    expect(firstError(result)).toBe("form.err.addressMax");
  });
});

describe("createRsvpSchema — phone_number (optional)", () => {
  it("accepts being omitted", () => {
    const { phone_number, ...rest } = validAttend;
    const result = createRsvpSchema(t).safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts an empty string", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, phone_number: "" });
    expect(result.success).toBe(true);
  });

  it("accepts exactly 10 chars (boundary min)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, phone_number: "0812345678" });
    expect(result.success).toBe(true);
  });

  it("accepts exactly 17 chars (boundary max)", () => {
    const phone = "12345678901234567"; // 17 digits
    expect(phone).toHaveLength(17);
    const result = createRsvpSchema(t).safeParse({ ...validAttend, phone_number: phone });
    expect(result.success).toBe(true);
  });

  it("errors at 9 chars (below min)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, phone_number: "081234567" });
    expect(firstError(result)).toBe("form.err.phoneInvalid");
  });

  it("errors at 18 chars (above max)", () => {
    const phone = "123456789012345678"; // 18 digits
    expect(phone).toHaveLength(18);
    const result = createRsvpSchema(t).safeParse({ ...validAttend, phone_number: phone });
    expect(firstError(result)).toBe("form.err.phoneInvalid");
  });

  it("errors on a value containing a space", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, phone_number: "0812 345 678" });
    expect(firstError(result)).toBe("form.err.phoneInvalid");
  });

  it("errors on a value containing letters", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, phone_number: "0812345abc" });
    expect(firstError(result)).toBe("form.err.phoneInvalid");
  });
});

describe("createRsvpSchema — dietary_restrictions (optional)", () => {
  it("accepts being omitted", () => {
    const { dietary_restrictions, ...rest } = validAttend;
    const result = createRsvpSchema(t).safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts length 500 (boundary)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, dietary_restrictions: "a".repeat(500) });
    expect(result.success).toBe(true);
  });

  it("errors at length 501 (above max)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, dietary_restrictions: "a".repeat(501) });
    expect(firstError(result)).toBe("form.err.dietaryMax");
  });
});

describe("createRsvpSchema — message (optional)", () => {
  it("accepts being omitted", () => {
    const { message, ...rest } = validAttend;
    const result = createRsvpSchema(t).safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts length 1000 (boundary)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, message: "a".repeat(1000) });
    expect(result.success).toBe(true);
  });

  it("errors at length 1001 (above max)", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, message: "a".repeat(1001) });
    expect(firstError(result)).toBe("form.err.messageMax");
  });
});

describe("createRsvpSchema — unknown fields", () => {
  it("strips unrecognized top-level keys from the parsed data", () => {
    const result = createRsvpSchema(t).safeParse({ ...validAttend, unexpected_field: "hack" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("unexpected_field");
    }
  });
});

describe("createRsvpSchema — per-locale rebuild", () => {
  it("keeps two schema instances built from different t functions independently scoped", () => {
    const tId = (key: string) => `id:${key}`;
    const tEn = (key: string) => `en:${key}`;
    const { attend_or_absent, ...rest } = validAttend;

    const resultId = createRsvpSchema(tId).safeParse(rest);
    const resultEn = createRsvpSchema(tEn).safeParse(rest);

    expect(firstError(resultId)).toBe("id:form.err.attendRequired");
    expect(firstError(resultEn)).toBe("en:form.err.attendRequired");
  });
});
