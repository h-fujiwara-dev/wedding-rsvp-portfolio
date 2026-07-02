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
  "details/Gen-4_5%20-%20A%20highly%20realistic%2C%20cinematic%20movie%20trailer_%20The%20camera%20starts%20from%20the%20low-angle%20perspect%204K.mp4"
);
const TAGLINE = "Kirana Estate, Ubud";

function useBlurFilter(source: MotionValue<number>, inputRange: number[], pxRange: number[]) {
  return useTransform(source, inputRange, pxRange.map(v => `blur(${v}px)`));
}

interface DetailsVideoScrollerProps {
  src?: string;
  duration?: number;
}

export function DetailsVideoScroller({ src = VIDEO_URL, duration = 5 }: DetailsVideoScrollerProps) {
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const unlockedRef      = useRef(false);
  const completedRef     = useRef(false);
  const minScrollRef     = useRef(0);
  // Whether we've ever scrolled at least once to/past the sticky-unpin boundary
  // (raw scrollYProgress 0.75, same point minScrollRef tracks in pixels). This is
  // deliberately separate from completedRef (video-finished, at STICKY_END=0.65):
  // the backward-lock below must only engage once the boundary has actually been
  // reached under the user's own scrolling, not merely once the video is done —
  // otherwise, for the whole 40vh dead zone between 0.65 and 0.75 (video finished
  // but boundary not yet reached), completedRef is already true and the Lenis
  // snap effect would see the current position as "below the boundary" and
  // force-teleport straight to it, skipping the dead zone entirely.
  const boundaryReachedRef = useRef(false);

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
  // STICKY_END = 0.65: video finishes well before the sticky unpins (0.75 raw
  // progress, see STICKY_UNPIN in e2e/video-scroller.spec.ts). The gap between
  // 0.65 and 0.75 (40vh of the 400vh wrapper) is deliberately dead scroll space:
  // the video sits on its completed last frame and the completion card is fully
  // visible while the user scrolls through it, with nothing blocked. That gap
  // is what creates the "lingering" beat before the next section — previously
  // this was faked with a preventDefault-based 1s scroll hold, which repeatedly
  // fought Lenis/the browser's own scroll handling in ways that trapped
  // trackpad users (see git history on this file). Achieving the same pause
  // through plain scroll distance instead means there's nothing to fight.
  useAnimationFrame(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const STICKY_END = 0.65;
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
  // (webfont swap, image load) that moves the wrapper — either of which silently
  // desyncs the lock target from the real boundary and can trap scroll indefinitely.
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

  // Wheel lock: once we've reached the sticky-unpin boundary, prevent scrolling
  // back up past it into the scrub zone. There is no forward hold anymore — the
  // 40vh gap between STICKY_END (0.65) and the sticky unpin (0.75) is plain,
  // unblocked scroll distance, so nothing here needs to intercept forward input.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!boundaryReachedRef.current || e.deltaY >= 0) return;
      if (window.scrollY <= minScrollRef.current + 60) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", onWheel, true);
  }, []);

  // Keyboard lock: same backward-only lock as wheel, for PageUp/ArrowUp/Home.
  useEffect(() => {
    const BACKWARD_KEYS = new Set(["PageUp", "ArrowUp", "Home"]);
    const onKeyDown = (e: KeyboardEvent) => {
      const backward = BACKWARD_KEYS.has(e.key) || (e.key === " " && e.shiftKey);
      if (!boundaryReachedRef.current || !backward) return;
      if (window.scrollY <= minScrollRef.current + 60) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  // Touch lock: same backward-only lock as wheel. Must mirror the wheel
  // handler's capture + stopImmediatePropagation — Lenis registers its own
  // touchmove listener on window (bubble phase), so without capture +
  // stopImmediatePropagation here, Lenis's listener still runs after this one
  // and keeps driving scroll from the "blocked" touch delta regardless of
  // preventDefault().
  useEffect(() => {
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchMove  = (e: TouchEvent) => {
      if (!boundaryReachedRef.current) return;
      if (startY - e.touches[0].clientY < 0 && window.scrollY <= minScrollRef.current + 60) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false, capture: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove",  onTouchMove, true);
    };
  }, []);

  // Lenis snap: prevent backward scroll past the boundary once reached.
  useEffect(() => {
    if (!lenis) return;
    const onLenisScroll = ({ scroll }: { scroll: number }) => {
      if (!boundaryReachedRef.current) return;
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
  const storyTitleOpacity    = useTransform(scrollYProgress, [0.46, 0.54], [0, 1]);

  // ── DETAILS: one-way MotionValues ────────────────────────────────────────────
  // These values ONLY move toward "fully visible". Scrolling back cannot reverse them.
  const detailsOp   = useMotionValue(0);
  const detailsY    = useMotionValue(26);
  const detailsBlur = useMotionValue(14);
  const detailsFilter = useTransform(detailsBlur, v => `blur(${v}px)`);

  // Bottom glass: one-way (once gradient appears it never shrinks back → no Lenis-lerp flicker)
  const bottomGlassOp = useMotionValue(0);

  // Reduced motion: skip the scroll-scrubbed fly-in/blur reveal entirely and jump
  // straight to the fully-revealed state. Safe to do unconditionally — the values
  // above are one-way (Math.max/min clamped), so the scroll listener below can
  // never undo this once set.
  useEffect(() => {
    if (!reducedMotion) return;
    detailsOp.set(1);
    detailsY.set(0);
    detailsBlur.set(0);
    bottomGlassOp.set(1);
  }, [reducedMotion, detailsOp, detailsY, detailsBlur, bottomGlassOp]);

  useEffect(() => {
    return scrollYProgress.on("change", (p) => {
      // Sticky unpins at raw progress 0.75 (matches minScrollRef in pixels, see
      // STICKY_UNPIN in e2e/video-scroller.spec.ts) — the backward-lock effects
      // above gate on this, not on video completion (STICKY_END, 0.65).
      if (p >= 0.75) boundaryReachedRef.current = true;

      // "DETAILS": enters [0.03 → 0.10]
      const op = Math.max(0, Math.min(1, (p - 0.03) / 0.07));
      detailsOp.set(Math.max(detailsOp.get(), op));
      detailsY.set(Math.min(detailsY.get(), 26 * (1 - op)));
      detailsBlur.set(Math.min(detailsBlur.get(), 14 * (1 - op)));

      // Bottom glass: [0.54 → 0.65], one-way only
      const bg = Math.max(0, Math.min(1, (p - 0.54) / 0.11));
      bottomGlassOp.set(Math.max(bottomGlassOp.get(), bg));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollYProgress]);

  return (
    <div ref={wrapperRef} className="relative h-[400vh]">
      {/* Real, screen-reader-visible page heading — the decorative <h1> below is aria-hidden */}
      <h1 className="sr-only">Details</h1>
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

        {/* ── DETAILS h1: locked layer ───────────────────────────────────────── */}
        {/*    One-way MotionValues: once revealed, this text can never disappear */}
        <div
          aria-hidden
          className="absolute inset-0 z-[25] flex items-center justify-center text-wedding-cream select-none pointer-events-none"
        >
          <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] tracking-[0.18em] uppercase leading-none text-center">
            <motion.span style={{ opacity: detailsOp, y: detailsY, filter: detailsFilter, display: "inline-block" }}>DETAILS</motion.span>
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
            DETAIL ACARA &nbsp;·&nbsp; THE DETAILS
          </motion.p>

          {/* Invisible spacer: keeps eyebrow/rule vertical positions relative to h1 */}
          <div
            aria-hidden
            className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-none pointer-events-none"
            style={{ opacity: 0 }}
          >
            DETAILS
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

        {/* ── THE DETAILS completion card (z-40) ────────────────────────────── */}
        <motion.div
          aria-hidden
          className="absolute inset-0 z-40 flex flex-col items-center justify-center select-none pointer-events-none"
          style={{ opacity: storyTitleOpacity }}
        >
          <div className="w-16 h-px bg-wedding-gold/70 mb-8" />

          <p
            className="font-sans text-[9px] tracking-[0.7em] uppercase text-wedding-gold mb-7"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.9)" }}
          >
            DETAIL ACARA &nbsp;·&nbsp; THE DETAILS
          </p>

          <h1
            className="font-display text-[4rem] md:text-[5.5rem] lg:text-[7rem] tracking-[0.22em] uppercase text-wedding-cream text-center leading-[1.1]"
            style={{ textShadow: "0 4px 40px rgba(0,0,0,0.95), 0 1px 10px rgba(0,0,0,0.7)" }}
          >
            DETAILS
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
