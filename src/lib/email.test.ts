import { describe, it, expect } from "vitest";
import { escapeHtml } from "./email";

describe("escapeHtml", () => {
  it("escapes &", () => {
    expect(escapeHtml("&")).toBe("&amp;");
  });

  it("escapes <", () => {
    expect(escapeHtml("<")).toBe("&lt;");
  });

  it("escapes >", () => {
    expect(escapeHtml(">")).toBe("&gt;");
  });

  it('escapes "', () => {
    expect(escapeHtml('"')).toBe("&quot;");
  });

  it("escapes '", () => {
    expect(escapeHtml("'")).toBe("&#x27;");
  });

  it("fully escapes a combined XSS payload", () => {
    const input = "<script>alert('xss')</script>";
    const output = escapeHtml(input);
    expect(output).not.toContain("<script>");
    expect(output).toBe("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;");
  });

  it("leaves a plain string unchanged", () => {
    expect(escapeHtml("Budi Santoso")).toBe("Budi Santoso");
  });

  it("escapes an already-escaped string again (single-pass, no double-escape guard)", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });
});
