"use client";

import { useLang } from "@/context/LangContext";
import { BotanicalDivider } from "@/components/ui/botanical";
import { Monogram } from "@/components/Monogram";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="grain relative bg-wedding-charcoal py-16 text-center overflow-hidden">
      <div className="max-w-xs mx-auto mb-10 px-4">
        <BotanicalDivider centerText="✦" />
      </div>

      <div className="text-5xl text-wedding-cream mb-3">
        <Monogram />
      </div>
      <p className="font-serif text-sm text-wedding-cream/60 italic mb-3">
        {t("footer.tagline")}
      </p>
      <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-gold/80">
        {t("footer.date")}
      </p>

      <div className="max-w-xs mx-auto mt-10 px-4">
        <BotanicalDivider />
      </div>
    </footer>
  );
}
