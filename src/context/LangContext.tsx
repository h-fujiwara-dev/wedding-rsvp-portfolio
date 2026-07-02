"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Locale, DEFAULT_LOCALE, translate } from "@/lib/i18n";

interface LangContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = localStorage.getItem("wedding-lang") as Locale | null;
    if (stored && (stored === "id" || stored === "en" || stored === "ja")) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("wedding-lang", l);
    document.documentElement.lang = l;
  }

  function t(key: string): string {
    return translate(locale, key);
  }

  return (
    <LangContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
