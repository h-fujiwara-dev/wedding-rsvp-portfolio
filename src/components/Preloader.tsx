"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Monogram } from "@/components/Monogram";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export function Preloader({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2000);
    const goneTimer = setTimeout(() => {
      setGone(true);
      onDone();
    }, 2750);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-wedding-charcoal flex items-center justify-center"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 750ms cubic-bezier(0.76,0,0.24,1)",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div className="text-center">
        <motion.div
          className="text-[96px] md:text-[140px] text-wedding-cream tracking-widest leading-none"
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.9, delay: reducedMotion ? 0 : 0.15, ease: [0.76, 0, 0.24, 1] }}
        >
          <Monogram />
        </motion.div>

        <motion.div
          className="h-px bg-wedding-gold/50 mt-5 origin-left"
          initial={reducedMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reducedMotion ? 0 : 1, delay: reducedMotion ? 0 : 0.7, ease: [0.76, 0, 0.24, 1] }}
        />

        <motion.p
          className="font-sans text-[9px] tracking-[0.55em] uppercase text-wedding-cream/60 mt-4"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 1.3 }}
        >
          Wedding Invitation
        </motion.p>
      </div>
    </div>
  );
}
