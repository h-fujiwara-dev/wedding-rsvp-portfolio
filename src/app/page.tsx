"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RsvpForm from "@/components/RsvpForm";
import { HomeVideoScroller } from "@/components/HomeVideoScroller";
import { Countdown } from "@/components/Countdown";
import { NavPanels } from "@/components/NavPanels";
import { BotanicalDivider } from "@/components/ui/botanical";
import { useLang } from "@/context/LangContext";

export default function Home() {
  const { t } = useLang();

  return (
    <div className="flex flex-col min-h-screen bg-wedding-cream">
      <Header />
      <HomeVideoScroller />

      {/* Welcome banner: bridges the video's cream melt into invitation + countdown */}
      <section className="bg-wedding-charcoal py-24 px-8 text-center">
        <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-wedding-cream/60 mb-6">
          {t("hero.dateVenue")}
        </p>
        <p className="font-serif text-wedding-cream/70 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
          {t("hero.subtitle")}
        </p>
        <div className="h-px w-16 bg-wedding-gold/40 mx-auto my-8" />
        <Countdown />
      </section>

      <NavPanels />

      {/* RSVP Section */}
      <section id="rsvp" className="py-28 px-8 bg-wedding-cream">
        <div className="max-w-2xl mx-auto text-center">
          <div className="max-w-xs mx-auto mb-8">
            <BotanicalDivider centerText="✦" />
          </div>
          <h2 className="font-display text-5xl md:text-6xl tracking-widest uppercase text-wedding-charcoal mb-6">
            {t("rsvp.title")}
          </h2>
          <p className="font-serif text-wedding-taupe-dark text-lg mb-2 leading-relaxed">
            {t("rsvp.sub")}
          </p>
          <p className="font-serif text-wedding-taupe-dark text-lg mb-16 leading-relaxed">
            {t("rsvp.sub2")}
          </p>
          <RsvpForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
