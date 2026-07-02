"use client";

import Header from "@/components/Header";
import { TransitionLink } from "@/components/TransitionLink";
import Footer from "@/components/Footer";
import { TimelineBeam } from "@/components/TimelineBeam";
import { VideoScroller } from "@/components/VideoScroller";
import { BlurFade } from "@/components/ui/blur-fade";
import { BotanicalDivider, BotanicalCorner } from "@/components/ui/botanical";
import { useLang } from "@/context/LangContext";

export default function StoryPage() {
  const { t } = useLang();

  return (
    <div className="flex flex-col min-h-screen bg-wedding-charcoal">
      {/* Fixed header sits above everything at z-50 */}
      <Header />

      {/*
       * ── HERO: Cinematic VideoScroller ───────────────────────────────
       * 200vh scroll container with sticky viewport-filling inner.
       * Scroll progress drives video.currentTime when a Runway video URL
       * is provided via the `src` prop. Defaults to Ken Burns fallback.
       */}
      <VideoScroller />

      {/*
       * ── INTRO: Glassmorphism text panel ─────────────────────────────
       * Transitions cleanly from the dark video via top gradient bleed.
       * The bg-wedding-cream with the top gradient creates a Fluid Glass
       * effect — feels like the video melts into the content below.
       */}
      {/* VideoScroller now handles the cream gradient at its bottom — no bridge needed */}
      <section className="relative bg-wedding-cream">
        <div className="py-28 px-8">
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <BlurFade delay={0.1}>
              <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-wedding-taupe-dark mb-8">
                {t("story.date")}
              </p>
            </BlurFade>
            <BlurFade delay={0.2}>
              <p className="font-serif text-wedding-charcoal/80 leading-relaxed mb-6 text-lg">
                {t("story.p1")}
              </p>
            </BlurFade>
            <BlurFade delay={0.3}>
              <p className="font-serif text-wedding-charcoal/80 leading-relaxed text-lg">
                {t("story.p2")}
              </p>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── BOTANICAL DIVIDER ────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-8 w-full py-2 bg-wedding-cream">
        <BotanicalDivider centerText="✦" />
      </div>

      {/*
       * ── TIMELINE ─────────────────────────────────────────────────────
       * Animated beam that draws as you scroll — unchanged from original.
       */}
      <section className="py-24 px-8 overflow-x-hidden bg-wedding-cream">
        <div className="max-w-3xl mx-auto">
          <BlurFade delay={0.05}>
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-wedding-taupe-dark text-center mb-4">
              {t("story.timelineEyebrow")}
            </p>
          </BlurFade>
          <BlurFade delay={0.15}>
            <h2 className="font-display text-4xl md:text-5xl text-wedding-charcoal tracking-wide text-center mb-4">
              {t("story.timelineH2")}
            </h2>
          </BlurFade>
          <BlurFade delay={0.25}>
            <p className="font-serif text-wedding-taupe-dark text-center mb-2 text-sm">
              {t("story.timelineSub")}
            </p>
          </BlurFade>
          <TimelineBeam />
        </div>
      </section>

      {/* ── RSVP CTA ────────────────────────────────────────────────── */}
      <section className="relative py-20 px-8 bg-wedding-ivory text-center overflow-hidden">
        <div className="absolute top-6 left-6">
          <BotanicalCorner className="text-wedding-taupe/30" />
        </div>
        <div className="absolute top-6 right-6">
          <BotanicalCorner flip className="text-wedding-taupe/30" />
        </div>
        <div className="absolute bottom-6 left-6 rotate-180">
          <BotanicalCorner className="text-wedding-taupe/30" />
        </div>
        <div className="absolute bottom-6 right-6 rotate-180">
          <BotanicalCorner flip className="text-wedding-taupe/30" />
        </div>
        <BlurFade delay={0.05}>
          <div className="max-w-xs mx-auto mb-8">
            <BotanicalDivider />
          </div>
        </BlurFade>
        <BlurFade delay={0.1}>
          <p className="font-serif text-wedding-charcoal/80 leading-relaxed text-lg mb-2">
            {t("story.ctaP1")}
          </p>
          <p className="font-serif text-wedding-charcoal/80 leading-relaxed text-lg mb-10">
            {t("story.ctaP2")}
          </p>
          <p className="font-serif text-wedding-taupe-dark mb-10">{t("story.ctaSub")}</p>
          <TransitionLink
            href="/#rsvp"
            className="group relative inline-block overflow-hidden rounded-full border border-white/[0.08] bg-wedding-charcoal font-sans text-[11px] tracking-[0.35em] uppercase text-wedding-cream px-14 py-4 hover:scale-[1.02] transition-transform duration-300"
          >
            <span
              className="absolute inset-0 -translate-x-full opacity-10 [background:linear-gradient(90deg,transparent,#C4B47E,transparent)] group-hover:[animation:shimmer-sweep_2.2s_ease-in-out_infinite]"
              aria-hidden
            />
            <span className="relative">RSVP</span>
          </TransitionLink>
        </BlurFade>
      </section>

      <Footer />
    </div>
  );
}
