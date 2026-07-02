"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useAnimationFrame,
  useMotionValue,
  MotionValue,
} from "motion/react";
import { useLenis } from "@/context/LenisContext";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { storageUrl } from "@/lib/media";

const VIDEO_URL = storageUrl(
  "wedding-assets",
  "top/agent_generate_video%20-%20Shimmering_%20translucent%20gold%20and%20crystal%20diamonds%20floating%20e.mp4"
);
const TAGLINE = "16 · 08 · 2026";

function useBlurFilter(source: MotionValue<number>, inputRange: number[], pxRange: number[]) {
  return useTransform(source, inputRange, pxRange.map(v => `blur(${v}px)`));
}

interface HomeVideoScrollerProps {
  src?: string;
  duration?: number;
}

export function HomeVideoScroller({ src = VIDEO_URL, duration = 5 }: HomeVideoScrollerProps) {
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const unlockedRef      = useRef(false);
  const completedRef     = useRef(false);
  const holdActiveRef    = useRef(false); // true during 1 s hold at section end
  const holdTriggeredRef = useRef(false); // prevents re-triggering the hold
  const minScrollRef     = useRef(0);

  const lenis = useLenis();
  const reducedMotion = usePrefersReducedMotion();

  // ── Scroll progress ──────────────────────────────────────────────────────────
  // h-[400vh] + offset "end start": scrollYProgress = scrollY / (4×vh)
  // sticky unpins at scrollY = 3×vh → scrollYProgress = 0.75
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end start"],
  });

  // ── RAF: seek video, mark completion ─────────────────────────────────────────
  // STICKY_END = 3/4: sticky unpins at scrollY = 3vh out of 4vh total (400vh container)
  // Video is mapped to complete exactly at this point so scrubbing and page-scroll never overlap.
  useAnimationFrame(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const STICKY_END = 3 / 4;
    const raw = scrollYProgress.get();
    const v = completedRef.current ? Math.max(raw, STICKY_END) : raw;
    const START = 0.5;
    // Normalize to the sticky phase [0, STICKY_END] → [0, 1], power-2 curve for slow start
    const progress = Math.min(v / STICKY_END, 1.0);
    const t = START + Math.pow(progress, 2.0) * (duration - START);
    if (Math.abs(video.currentTime - t) > 0.004) video.currentTime = t;
    if (!completedRef.current && progress >= 0.99) completedRef.current = true;
  });

  // iOS Safari unlock
  const unlockVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || unlockedRef.current) return;
    unlockedRef.current = true;
    video.play().then(() => video.pause()).catch(() => {});
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onReady = () => { video.currentTime = 0.5; };
    // loadedmetadata (not canplay) — fires as soon as duration/dimensions are
    // known, before the browser has any frame to paint. Waiting for canplay
    // let a slow connection paint the video's real frame 0 first, then jump
    // to 0.5s once buffered — a visible flash-then-jump on first load.
    if (video.readyState >= 1) onReady();
    else video.addEventListener("loadedmetadata", onReady, { once: true });
    const opts = { once: true, passive: true } as const;
    window.addEventListener("touchstart", unlockVideo, opts);
    window.addEventListener("wheel",      unlockVideo, opts);
    return () => {
      video.removeEventListener("loadedmetadata", onReady);
      window.removeEventListener("touchstart", unlockVideo);
      window.removeEventListener("wheel",      unlockVideo);
    };
  }, [unlockVideo]);

  // minScrollRef is the scroll boundary the backward-lock/snap logic locks onto.
  // It must never go stale: window "resize" alone misses mobile browser chrome show/hide
  // (innerHeight changes without a resize event) and any post-mount layout shift
  // (webfont swap, image load, initial scroll-lock release) that moves the wrapper —
  // either of which silently desyncs the lock target from the real boundary and can
  // trap scroll indefinitely.
  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return;
      minScrollRef.current =
        wrapperRef.current.offsetTop +
        wrapperRef.current.offsetHeight -
        window.innerHeight;
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("load", update, { passive: true });
    window.visualViewport?.addEventListener("resize", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("load", update);
      window.visualViewport?.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  // Wheel lock: block forward scroll during 1s hold, then only block upward past boundary
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (holdActiveRef.current) {
        // During hold: block forward scroll once at/near section end
        if (e.deltaY > 0 && window.scrollY >= minScrollRef.current - 80) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
      if (!completedRef.current || e.deltaY >= 0) return;
      if (window.scrollY <= minScrollRef.current + 60) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", onWheel, true);
  }, []);

  // Touch lock: same hold logic
  useEffect(() => {
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchMove  = (e: TouchEvent) => {
      if (holdActiveRef.current) {
        const movingDown = startY - e.touches[0].clientY > 0;
        if (movingDown && window.scrollY >= minScrollRef.current - 80) e.preventDefault();
        return;
      }
      if (!completedRef.current) return;
      if (startY - e.touches[0].clientY < 0 && window.scrollY <= minScrollRef.current + 60) {
        e.preventDefault();
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true  });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
    };
  }, []);

  // Lenis snap: clamp forward past section end during hold, then prevent backward after complete
  useEffect(() => {
    if (!lenis) return;
    const onLenisScroll = ({ scroll }: { scroll: number }) => {
      if (holdActiveRef.current) {
        if (scroll > minScrollRef.current + 5) lenis.scrollTo(minScrollRef.current, { immediate: true });
        return;
      }
      if (!completedRef.current) return;
      if (scroll < minScrollRef.current - 1) lenis.scrollTo(minScrollRef.current, { immediate: true });
    };
    lenis.on("scroll", onLenisScroll);
    return () => lenis.off("scroll", onLenisScroll);
  }, [lenis]);

  // ── Decoration motion values (bidirectional — fade in/out with scroll) ────────
  const scrollHintOpacity    = useTransform(scrollYProgress, [0, 0.06], [1, 0]);
  const eyebrowOpacity       = useTransform(scrollYProgress, [0.02, 0.10, 0.38, 0.48], [0, 1, 1, 0]);
  const eyebrowFilter        = useBlurFilter(scrollYProgress, [0.02, 0.10], [10, 0]);
  const ruleOpacity          = useTransform(scrollYProgress, [0.12, 0.20, 0.38, 0.48], [0, 1, 1, 0]);
  const ruleScaleX           = useTransform(scrollYProgress, [0.12, 0.22], [0, 1]);
  const taglineOpacity       = useTransform(scrollYProgress, [0.08, 0.18, 0.40, 0.50], [0, 1, 1, 0]);
  const taglineFilter        = useBlurFilter(scrollYProgress, [0.08, 0.18], [8, 0]);
  const textContainerOpacity = useTransform(scrollYProgress, [0.46, 0.56], [1, 0]);
  const completionOpacity    = useTransform(scrollYProgress, [0.46, 0.54], [0, 1]);

  // ── KENJI & Sarah: one-way MotionValues ─────────────────────────────────────
  // These values ONLY move toward "fully visible". Scrolling back cannot reverse them.
  const kenjiOp   = useMotionValue(0);
  const ampOp      = useMotionValue(0);
  const sarahOp    = useMotionValue(0);
  const kenjiY    = useMotionValue(26);
  const ampY       = useMotionValue(26);
  const sarahY     = useMotionValue(26);
  const kenjiBlur = useMotionValue(14);
  const ampBlur    = useMotionValue(14);
  const sarahBlur  = useMotionValue(14);
  const kenjiFilter = useTransform(kenjiBlur, v => `blur(${v}px)`);
  const ampFilter    = useTransform(ampBlur,    v => `blur(${v}px)`);
  const sarahFilter  = useTransform(sarahBlur,  v => `blur(${v}px)`);

  // Bottom glass: one-way (once gradient appears it never shrinks back → no Lenis-lerp flicker)
  const bottomGlassOp = useMotionValue(0);

  // Reduced motion: skip the scroll-scrubbed fly-in/blur reveal entirely and jump
  // straight to the fully-revealed state. Safe to do unconditionally — the values
  // above are one-way (Math.max/min clamped), so the scroll listener below can
  // never undo this once set.
  useEffect(() => {
    if (!reducedMotion) return;
    kenjiOp.set(1);
    kenjiY.set(0);
    kenjiBlur.set(0);
    ampOp.set(1);
    ampY.set(0);
    ampBlur.set(0);
    sarahOp.set(1);
    sarahY.set(0);
    sarahBlur.set(0);
    bottomGlassOp.set(1);
  }, [reducedMotion, kenjiOp, kenjiY, kenjiBlur, ampOp, ampY, ampBlur, sarahOp, sarahY, sarahBlur, bottomGlassOp]);

  useEffect(() => {
    return scrollYProgress.on("change", (p) => {
      // "KENJI": enters [0.03 → 0.10]
      const hp = Math.max(0, Math.min(1, (p - 0.03) / 0.07));
      kenjiOp.set(Math.max(kenjiOp.get(), hp));
      kenjiY.set(Math.min(kenjiY.get(), 26 * (1 - hp)));
      kenjiBlur.set(Math.min(kenjiBlur.get(), 14 * (1 - hp)));

      // "&": enters [0.07 → 0.13]
      const ap = Math.max(0, Math.min(1, (p - 0.07) / 0.06));
      ampOp.set(Math.max(ampOp.get(), ap));
      ampY.set(Math.min(ampY.get(), 26 * (1 - ap)));
      ampBlur.set(Math.min(ampBlur.get(), 14 * (1 - ap)));

      // "Sarah": enters [0.11 → 0.18]
      const gp = Math.max(0, Math.min(1, (p - 0.11) / 0.07));
      sarahOp.set(Math.max(sarahOp.get(), gp));
      sarahY.set(Math.min(sarahY.get(), 26 * (1 - gp)));
      sarahBlur.set(Math.min(sarahBlur.get(), 14 * (1 - gp)));

      // Bottom glass: [0.54 → 0.65], one-way only
      const bg = Math.max(0, Math.min(1, (p - 0.54) / 0.11));
      bottomGlassOp.set(Math.max(bottomGlassOp.get(), bg));

      // 1 s hold just before sticky end (p ≈ 0.75): block forward scroll once
      if (p >= 0.72 && !holdTriggeredRef.current) {
        holdTriggeredRef.current = true;
        holdActiveRef.current = true;
        setTimeout(() => { holdActiveRef.current = false; }, 1000);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollYProgress]);

  return (
    <div ref={wrapperRef} className="relative h-[400vh]">
      {/* Real, screen-reader-visible page heading — the decorative <h1> below is aria-hidden */}
      <h1 className="sr-only">KENJI &amp; Sarah</h1>
      <div className="sticky top-0 h-screen overflow-hidden bg-wedding-obsidian">

        {/* ── Video ──────────────────────────────────────────────────────────── */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "translate3d(0,0,0)", backfaceVisibility: "hidden", willChange: "transform" }}
          src={src}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
        />

        {/* ── Cinematic vignette ────────────────────────────────────────────── */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: [
              "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 32%, transparent 58%, rgba(0,0,0,0.45) 100%)",
              "radial-gradient(ellipse 88% 75% at 50% 50%, transparent 28%, rgba(0,0,0,0.55) 100%)",
            ].join(", "),
          }}
        />

        {/* ── Text-legibility scrim ───────────────────────────────────────────── */}
        {/*    The shimmering gold/diamond footage is much brighter and busier than
              the other pages' video — the vignette above stays transparent at dead
              center (where the title sits), so it never darkens behind the text.
              This band-shaped scrim fixes that regardless of what the video is doing. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-[12]"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 36%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.4) 64%, transparent 100%)",
          }}
        />

        {/* ── KENJI & Sarah h1: locked layer ───────────────────────────────── */}
        {/*    One-way MotionValues: once revealed, this text can never disappear */}
        <div
          aria-hidden
          className="absolute inset-0 z-[25] flex items-center justify-center text-wedding-cream select-none pointer-events-none"
        >
          <h1
            className="font-monogram text-6xl md:text-8xl lg:text-[9rem] tracking-widest uppercase leading-none text-center"
            style={{ textShadow: "0 4px 40px rgba(0,0,0,0.95), 0 1px 10px rgba(0,0,0,0.8)" }}
          >
            <motion.span style={{ opacity: kenjiOp, y: kenjiY, filter: kenjiFilter, display: "inline-block" }}>KENJI</motion.span>
            {" "}
            <motion.span
              className="font-display italic normal-case text-wedding-gold text-[0.6em]"
              style={{ opacity: ampOp, y: ampY, filter: ampFilter, display: "inline-block" }}
            >
              &amp;
            </motion.span>
            {" "}
            <motion.span style={{ opacity: sarahOp,  y: sarahY,  filter: sarahFilter,  display: "inline-block" }}>Sarah</motion.span>
          </h1>
        </div>

        {/* ── Decorative overlay: eyebrow / rule / tagline ──────────────────── */}
        <motion.div
          aria-hidden
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-wedding-cream select-none px-8 gap-5 md:gap-7"
          style={{ opacity: textContainerOpacity }}
        >
          <motion.p
            className="font-sans text-[9px] tracking-[0.7em] uppercase text-wedding-cream/60"
            style={{ opacity: eyebrowOpacity, filter: eyebrowFilter }}
          >
            PERNIKAHAN KAMI &nbsp;·&nbsp; OUR WEDDING
          </motion.p>

          {/* Invisible spacer: keeps eyebrow/rule vertical positions relative to h1 */}
          <div
            aria-hidden
            className="font-monogram text-6xl md:text-8xl lg:text-[9rem] leading-none pointer-events-none"
            style={{ opacity: 0 }}
          >
            KENJI &amp; Sarah
          </div>

          <motion.div
            aria-hidden
            className="h-px bg-wedding-gold/55 origin-center"
            style={{ width: 80, opacity: ruleOpacity, scaleX: ruleScaleX }}
          />

          <motion.p
            className="font-serif italic text-base md:text-lg text-wedding-cream/60 tracking-wide"
            style={{ opacity: taglineOpacity, filter: taglineFilter }}
          >
            {TAGLINE}
          </motion.p>
        </motion.div>

        {/* ── Glass bottom: melts video into cream ──────────────────────────── */}
        <motion.div
          aria-hidden
          className="absolute bottom-0 inset-x-0 h-28 pointer-events-none z-30"
          style={{ opacity: bottomGlassOp }}
        >
          <div className="w-full h-full bg-gradient-to-t from-wedding-cream via-wedding-cream/50 to-transparent" />
        </motion.div>

        {/* ── KENJI & Sarah completion card (z-40) ───────────────────────────── */}
        <motion.div
          aria-hidden
          className="absolute inset-0 z-40 flex flex-col items-center justify-center select-none pointer-events-none"
          style={{ opacity: completionOpacity }}
        >
          <div className="w-16 h-px bg-wedding-gold/70 mb-8" />

          <p
            className="font-sans text-[9px] tracking-[0.7em] uppercase text-wedding-gold mb-7"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.9)" }}
          >
            PERNIKAHAN KAMI &nbsp;·&nbsp; OUR WEDDING
          </p>

          <h1
            className="font-monogram text-6xl md:text-8xl lg:text-[9rem] tracking-widest uppercase text-wedding-cream text-center leading-none"
            style={{ textShadow: "0 4px 40px rgba(0,0,0,0.95), 0 1px 10px rgba(0,0,0,0.7)" }}
          >
            KENJI{" "}
            <span className="font-display italic normal-case text-wedding-gold text-[0.6em]">
              &amp;
            </span>{" "}
            Sarah
          </h1>

          <div className="w-16 h-px bg-wedding-gold/70 mt-8 mb-12" />

          <div className="flex flex-col items-center gap-3">
            <div className="relative h-10 overflow-hidden" style={{ width: 1 }}>
              <div className={`absolute inset-0 bg-wedding-gold/50 ${reducedMotion ? "" : "vs-scroll-pulse"}`} />
            </div>
            <span
              className="font-sans text-[9px] tracking-[0.55em] uppercase text-wedding-cream/60"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
            >
              SCROLL
            </span>
          </div>
        </motion.div>

        {/* ── Opening scroll indicator ──────────────────────────────────────── */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2.5"
          style={{ opacity: scrollHintOpacity }}
          aria-hidden
        >
          <span className="font-sans text-[9px] tracking-[0.5em] uppercase text-wedding-cream/60">SCROLL</span>
          <div className="relative h-9 overflow-hidden" style={{ width: 1 }}>
            <div className={`absolute inset-0 bg-wedding-cream/40 ${reducedMotion ? "" : "vs-scroll-pulse"}`} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
