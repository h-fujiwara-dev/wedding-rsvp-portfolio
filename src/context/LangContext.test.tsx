/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LangProvider, useLang } from "./LangContext";

function Probe() {
  const { locale, t, setLocale } = useLang();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="translated">{t("nav.home")}</span>
      <button onClick={() => setLocale("ja")}>switch-to-ja</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = "";
});

describe("LangProvider", () => {
  it("defaults to id when nothing is stored", () => {
    render(
      <LangProvider>
        <Probe />
      </LangProvider>
    );
    expect(screen.getByTestId("locale").textContent).toBe("id");
    expect(screen.getByTestId("translated").textContent).toBe("BERANDA");
  });

  it("adopts a valid seeded localStorage value on mount", async () => {
    localStorage.setItem("wedding-lang", "en");
    render(
      <LangProvider>
        <Probe />
      </LangProvider>
    );
    expect(await screen.findByText("HOME")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("ignores an invalid seeded localStorage value and stays on id", () => {
    localStorage.setItem("wedding-lang", "fr");
    render(
      <LangProvider>
        <Probe />
      </LangProvider>
    );
    expect(screen.getByTestId("locale").textContent).toBe("id");
  });

  it("setLocale updates rendered translated text", () => {
    render(
      <LangProvider>
        <Probe />
      </LangProvider>
    );
    fireEvent.click(screen.getByText("switch-to-ja"));
    expect(screen.getByTestId("translated").textContent).toBe("ホーム");
  });

  it("setLocale persists to localStorage", () => {
    render(
      <LangProvider>
        <Probe />
      </LangProvider>
    );
    fireEvent.click(screen.getByText("switch-to-ja"));
    expect(localStorage.getItem("wedding-lang")).toBe("ja");
  });

  it("setLocale updates document.documentElement.lang", () => {
    render(
      <LangProvider>
        <Probe />
      </LangProvider>
    );
    fireEvent.click(screen.getByText("switch-to-ja"));
    expect(document.documentElement.lang).toBe("ja");
  });
});

describe("useLang without a LangProvider ancestor", () => {
  it("returns the raw default context", () => {
    render(<Probe />);
    expect(screen.getByTestId("locale").textContent).toBe("id");
    // Default context's t() is an identity passthrough
    expect(screen.getByTestId("translated").textContent).toBe("nav.home");
  });
});
