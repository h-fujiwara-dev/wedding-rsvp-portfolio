import { describe, it, expect } from "vitest";
import { translate, isLocale, translations } from "./i18n";

describe("translate", () => {
  it("resolves a known key in id", () => {
    expect(translate("id", "nav.home")).toBe("BERANDA");
  });

  it("resolves a known key in en", () => {
    expect(translate("en", "nav.home")).toBe("HOME");
  });

  it("resolves a known key in ja", () => {
    expect(translate("ja", "nav.home")).toBe("ホーム");
  });

  it("falls back to the raw key when missing from both the locale and en", () => {
    expect(translate("en", "__does_not_exist__")).toBe("__does_not_exist__");
    expect(translate("ja", "__does_not_exist__")).toBe("__does_not_exist__");
  });
});

describe("isLocale", () => {
  it("returns true for valid locale codes", () => {
    expect(isLocale("id")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ja")).toBe(true);
  });

  it("returns false for an unsupported locale string", () => {
    expect(isLocale("fr")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isLocale("")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isLocale(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isLocale(null)).toBe(false);
  });

  it("returns false for a non-string value", () => {
    expect(isLocale(123)).toBe(false);
    expect(isLocale({})).toBe(false);
  });
});

describe("translations — locale key parity", () => {
  const idKeys = Object.keys(translations.id).sort();
  const enKeys = Object.keys(translations.en).sort();
  const jaKeys = Object.keys(translations.ja).sort();

  it("id has no keys missing from en", () => {
    const missing = idKeys.filter((k) => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("en has no keys missing from id", () => {
    const missing = enKeys.filter((k) => !idKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("ja has no keys missing from en", () => {
    const missing = jaKeys.filter((k) => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("en has no keys missing from ja", () => {
    const missing = enKeys.filter((k) => !jaKeys.includes(k));
    expect(missing).toEqual([]);
  });
});
