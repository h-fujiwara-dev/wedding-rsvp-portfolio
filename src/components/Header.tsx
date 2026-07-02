"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TransitionLink } from "@/components/TransitionLink";
import { Monogram } from "@/components/Monogram";

export default function Header() {
  const { t } = useLang();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const NAV_LINKS = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.story"), href: "/story" },
    { label: t("nav.details"), href: "/details" },
    { label: t("nav.rsvp"), href: "/#rsvp" },
  ];

  // Close on Escape and lock body scroll while the drawer is open
  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-wedding-charcoal/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-8 py-4">
        <TransitionLink href="/" className="text-wedding-cream text-xl tracking-widest">
          <Monogram />
        </TransitionLink>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <TransitionLink
              key={href}
              href={href}
              className="font-sans text-[11px] tracking-[0.25em] text-wedding-cream/70 hover:text-wedding-cream transition-colors uppercase"
            >
              {label}
            </TransitionLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileNavOpen ? t("nav.closeMenu") : t("nav.menu")}
            className="md:hidden flex items-center justify-center w-11 h-11 -mr-2.5 text-wedding-cream/70 hover:text-wedding-cream transition-colors"
          >
            {mobileNavOpen ? (
              <X className="w-5 h-5" aria-hidden />
            ) : (
              <Menu className="w-5 h-5" aria-hidden />
            )}
          </button>
          {/* Intentionally unlabeled — gated by Basic Auth in middleware, not by obscurity */}
          <a
            href="/admin"
            aria-label="Admin"
            className="relative flex items-center justify-center w-11 h-11 -mr-2.5 md:mr-0 md:w-auto md:h-auto"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-wedding-cream/15 hover:bg-wedding-cream/50 transition-colors" />
          </a>
        </div>
      </div>

      {/* ── Mobile nav drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.nav
            id="mobile-nav-panel"
            aria-label={t("nav.menu")}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
            className="md:hidden overflow-hidden bg-wedding-charcoal border-t border-wedding-cream/10"
          >
            <div className="flex flex-col px-8 py-4">
              {NAV_LINKS.map(({ label, href }) => (
                <TransitionLink
                  key={href}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center min-h-[44px] font-sans text-[13px] tracking-[0.2em] text-wedding-cream/80 hover:text-wedding-cream transition-colors uppercase"
                >
                  {label}
                </TransitionLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
