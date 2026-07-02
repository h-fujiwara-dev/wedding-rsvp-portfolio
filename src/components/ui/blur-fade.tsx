"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

type BlurFadeProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  yOffset?: number;
  // inViewMargin kept for API compat but we use scroll-event detection instead
  inViewMargin?: string;
};

export function BlurFade({
  children,
  delay = 0,
  duration = 0.55,
  className,
  yOffset = 10,
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (visible) return;

    // Check whether the element is within 120px of the viewport.
    // Using getBoundingClientRect() + scroll events is more reliable
    // than IntersectionObserver when Lenis smooth-scroll is active,
    // because Lenis updates window.scrollY and fires native scroll events.
    const check = () => {
      const el = ref.current;
      if (!el) return;
      const { top, bottom } = el.getBoundingClientRect();
      if (top < window.innerHeight + 120 && bottom > -120) {
        setVisible(true);
      }
    };

    check(); // Check immediately on mount

    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [visible]);

  // Reduced motion: keep the opacity fade (near-instant, no stagger) but drop
  // the translate/blur motion entirely.
  const effectiveYOffset = reducedMotion ? 0 : yOffset;
  const effectiveDuration = reducedMotion ? 0.01 : duration;
  const effectiveDelay = reducedMotion ? 0 : delay;

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : `translateY(${effectiveYOffset}px)`,
        filter: reducedMotion ? undefined : visible ? "blur(0px)" : "blur(8px)",
        transition: `opacity ${effectiveDuration}s ${effectiveDelay}s ease-out, transform ${effectiveDuration}s ${effectiveDelay}s ease-out, filter ${effectiveDuration}s ${effectiveDelay}s ease-out`,
      }}
    >
      {children}
    </div>
  );
}
