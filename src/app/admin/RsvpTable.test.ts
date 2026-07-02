import { describe, it, expect } from "vitest";
import { neutralizeFormula } from "./RsvpTable";

describe("neutralizeFormula", () => {
  it("prefixes a value starting with =", () => {
    expect(neutralizeFormula("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
  });

  it("prefixes a value starting with +", () => {
    expect(neutralizeFormula("+1234")).toBe("'+1234");
  });

  it("prefixes a value starting with -", () => {
    expect(neutralizeFormula("-1234")).toBe("'-1234");
  });

  it("prefixes a value starting with @", () => {
    expect(neutralizeFormula("@SUM(1+9)")).toBe("'@SUM(1+9)");
  });

  it("leaves a plain value unchanged", () => {
    expect(neutralizeFormula("Budi Santoso")).toBe("Budi Santoso");
  });

  it("leaves an empty string unchanged and does not throw", () => {
    expect(neutralizeFormula("")).toBe("");
  });

  it("leaves a value unchanged when the trigger char is not at position 0", () => {
    expect(neutralizeFormula("Budi=Santoso")).toBe("Budi=Santoso");
  });

  it("prefixes a bare trigger character", () => {
    expect(neutralizeFormula("=")).toBe("'=");
  });

  it("preserves a multi-byte payload after the trigger char", () => {
    expect(neutralizeFormula("=山田")).toBe("'=山田");
  });
});
