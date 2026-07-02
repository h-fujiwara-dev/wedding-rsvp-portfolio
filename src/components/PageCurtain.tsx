"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, animate, motion, AnimatePresence } from "motion/react";
import { usePageTransition } from "@/context/TransitionContext";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

function SplitLetters({
  text,
  delayStart = 0,
  stagger = 0.04,
}: {
  text: string;
  delayStart?: number;
  stagger?: number;
}) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <span aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reducedMotion ? 0 : delayStart + i * stagger,
            duration: reducedMotion ? 0 : 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="inline-block"
          style={{ whiteSpace: char === " " ? "pre" : undefined }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  );
}

function MonogramChar({
  char,
  delay,
  isAmpersand,
}: {
  char: string;
  delay: number;
  isAmpersand: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <motion.span
      initial={reducedMotion ? false : { opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: reducedMotion ? 0 : delay,
        duration: reducedMotion ? 0 : 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`inline-block tracking-widest leading-none ${
        isAmpersand
          ? "font-display italic text-wedding-cream/45 text-5xl md:text-6xl mx-4"
          : "font-monogram text-wedding-gold text-7xl md:text-8xl lg:text-9xl"
      }`}
    >
      {char}
    </motion.span>
  );
}

export function PageCurtain() {
  const { status } = usePageTransition();
  const y = useMotionValue("100%");
  const prevStatus = useRef<string>("idle");
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;

    if (status === "covering") {
      animate(y, "0%", {
        duration: reducedMotion ? 0 : 0.9,
        ease: [0.76, 0, 0.24, 1],
      });
    } else if (status === "revealing") {
      animate(y, "-100%", {
        duration: reducedMotion ? 0 : 0.75,
        ease: [0.25, 0.46, 0.45, 0.94],
      });
    } else if (status === "idle" && prev === "revealing") {
      y.set("100%");
    }
  }, [status, y, reducedMotion]);

  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-wedding-charcoal pointer-events-none overflow-hidden"
      style={{ y }}
      aria-hidden
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-wedding-gold/[0.04] blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-wedding-cream/[0.02] blur-[80px]" />
      </div>

      {/* Corner accent lines */}
      <div className="absolute top-8 left-8 w-16 h-px bg-wedding-gold/20" />
      <div className="absolute top-8 left-8 w-px h-16 bg-wedding-gold/20" />
      <div className="absolute top-8 right-8 w-16 h-px bg-wedding-gold/20" />
      <div className="absolute top-8 right-8 w-px h-16 bg-wedding-gold/20" />
      <div className="absolute bottom-8 left-8 w-16 h-px bg-wedding-gold/20" />
      <div className="absolute bottom-8 left-8 w-px h-16 bg-wedding-gold/20" />
      <div className="absolute bottom-8 right-8 w-16 h-px bg-wedding-gold/20" />
      <div className="absolute bottom-8 right-8 w-px h-16 bg-wedding-gold/20" />

      {/* Center omotenashi content */}
      <AnimatePresence>
        {status === "covering" && (
          <motion.div
            key="curtain-content"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.2 } }}
            transition={{ duration: reducedMotion ? 0 : 0.3, delay: reducedMotion ? 0 : 0.25 }}
          >
            <motion.div
              className="w-16 h-px bg-wedding-gold/30"
              initial={reducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.3, duration: reducedMotion ? 0 : 0.7, ease: "easeOut" }}
            />

            <div className="flex items-center select-none">
              <MonogramChar char="K" delay={0.3} isAmpersand={false} />
              <MonogramChar char="&" delay={0.46} isAmpersand={true} />
              <MonogramChar char="S" delay={0.62} isAmpersand={false} />
            </div>

            <div className="font-sans text-[11px] tracking-[0.45em] uppercase text-wedding-cream/60 overflow-hidden">
              <SplitLetters text="KENJI & Sarah" delayStart={0.6} stagger={0.05} />
            </div>

            <motion.div
              className="w-16 h-px bg-wedding-gold/30"
              initial={reducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.75, duration: reducedMotion ? 0 : 0.6, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
