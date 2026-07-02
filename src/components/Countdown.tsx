"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLang } from "@/context/LangContext";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const WEDDING_DATE = new Date("2026-11-14T09:00:00+08:00");

function getRemaining() {
  const diff = WEDDING_DATE.getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const s = Math.floor(diff / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function Digit({ value, label }: { value: string; label: string }) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative overflow-hidden h-[2.5rem] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={reducedMotion ? false : { y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reducedMotion ? undefined : { y: 16, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.76, 0, 0.24, 1] }}
            className="font-display text-3xl md:text-4xl text-wedding-cream tracking-wider tabular-nums"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="font-sans text-[9px] tracking-[0.45em] uppercase text-wedding-cream/60">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span className="font-display text-xl text-wedding-gold/80 pb-6 select-none">·</span>
  );
}

export function Countdown() {
  const [time, setTime] = useState<ReturnType<typeof getRemaining> | null>(null);
  const { t } = useLang();

  useEffect(() => {
    setTime(getRemaining());
    const id = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-end gap-3 md:gap-5 justify-center mt-8">
      <Digit value={String(time.d)} label={t("cd.days")} />
      <Separator />
      <Digit value={pad(time.h)} label={t("cd.hours")} />
      <Separator />
      <Digit value={pad(time.m)} label={t("cd.mins")} />
      <Separator />
      <Digit value={pad(time.s)} label={t("cd.secs")} />
    </div>
  );
}
