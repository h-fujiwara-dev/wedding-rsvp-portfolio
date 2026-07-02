"use client";

import { useLang } from "@/context/LangContext";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLang();

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-wedding-cream/20 text-[9px] select-none">|</span>
          )}
          <button
            onClick={() => setLocale(l)}
            aria-label={`Switch to ${LOCALE_LABELS[l]}`}
            className={`relative font-sans text-[9px] tracking-[0.2em] uppercase transition-colors duration-200 after:absolute after:-inset-y-4 after:-inset-x-2 after:content-[''] ${
              locale === l
                ? "text-wedding-gold"
                : "text-wedding-cream/60 hover:text-wedding-cream/70"
            }`}
          >
            {LOCALE_LABELS[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
