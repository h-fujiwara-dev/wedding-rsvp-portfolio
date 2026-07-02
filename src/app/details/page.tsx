"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { TransitionLink } from "@/components/TransitionLink";
import Footer from "@/components/Footer";
import { BlurFade } from "@/components/ui/blur-fade";
import { BotanicalDivider } from "@/components/ui/botanical";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DetailsVideoScroller } from "@/components/DetailsVideoScroller";
import { useLang } from "@/context/LangContext";
import {
  Calendar,
  MapPin,
  Clock,
  Music,
  Utensils,
  Train,
  Hotel,
  Shirt,
} from "lucide-react";

const VENUE_IMG =
  "https://images.unsplash.com/photo-1694967832949-09984640b143?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

// Google Maps Search API — generic area link, since Kirana Estate is a fictional venue
const MAPS_SHORT = "https://www.google.com/maps/search/?api=1&query=Ubud%2C+Bali%2C+Indonesia";

type TabId = "schedule" | "dresscode";

// ── Sub-components ────────────────────────────────────────────────────────────

function EventItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-full bg-wedding-gold/8 border border-wedding-gold/25 flex items-center justify-center text-wedding-gold/70">
        {icon}
      </div>
      <dl>
        <dt className="font-sans text-[10px] tracking-[0.35em] uppercase text-wedding-taupe-dark mb-1.5">
          {label}
        </dt>
        {href ? (
          <dd className="font-serif leading-snug">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wedding-charcoal hover:text-wedding-gold-dark transition-colors duration-300 underline underline-offset-4 decoration-wedding-taupe/30 hover:decoration-wedding-gold/60"
            >
              {value}
            </a>
          </dd>
        ) : (
          <dd className="font-serif text-wedding-charcoal leading-snug">{value}</dd>
        )}
      </dl>
    </div>
  );
}

function TimelineRow({
  time,
  label,
  desc,
  note,
  dimmed = false,
}: {
  time: string;
  label: string;
  desc?: string;
  note?: string;
  dimmed?: boolean;
}) {
  return (
    <div className="relative flex items-start gap-8 mb-12 last:mb-0">
      <div className="flex-shrink-0 w-[68px] text-right pt-0.5">
        <span
          className={`font-display text-[1.7rem] italic leading-none ${
            dimmed ? "text-wedding-charcoal/70" : "text-wedding-gold-dark"
          }`}
        >
          {time}
        </span>
      </div>
      <div className="relative flex-shrink-0" style={{ width: 0 }}>
        <div
          className={`absolute rounded-full ${
            dimmed
              ? "w-2 h-2 bg-wedding-taupe/40 border border-wedding-taupe/20"
              : "w-3 h-3 bg-wedding-gold border-2 border-wedding-ivory shadow-sm"
          }`}
          style={{ left: dimmed ? -5 : -6, top: 5 }}
        />
      </div>
      <div className="pt-0.5 pl-6">
        {note && (
          <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-wedding-taupe-dark mb-1">
            {note}
          </p>
        )}
        <h3
          className={`font-display text-2xl tracking-wide mb-1.5 ${
            dimmed ? "text-wedding-charcoal/70" : "text-wedding-charcoal"
          }`}
        >
          {label}
        </h3>
        {desc && (
          <p className="font-serif text-wedding-charcoal/70 text-sm leading-relaxed">
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DetailsPage() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<TabId>("schedule");

  const tabItems: { id: TabId; label: string }[] = [
    { id: "schedule",  label: t("det.tabsSchedule")  },
    { id: "dresscode", label: t("det.tabsDresscode") },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-wedding-cream">
      <Header />
      <DetailsVideoScroller />

      {/* ── 2. INVITE BANNER ─────────────────────────────────────────────────── */}
      <section className="relative bg-wedding-cream py-20 px-8">
        <div className="max-w-xl mx-auto text-center">
          <BlurFade delay={0.05}>
            <p className="font-serif text-wedding-charcoal/70 leading-relaxed text-lg md:text-xl mb-10">
              {t("det.inviteText")}
            </p>
          </BlurFade>
          <BlurFade delay={0.15}>
            <TransitionLink
              href="/#rsvp"
              className="inline-block font-sans text-[11px] tracking-[0.35em] uppercase text-wedding-cream bg-wedding-charcoal px-12 py-3.5 rounded-full hover:bg-wedding-gold/90 transition-colors duration-300"
            >
              {t("det.rsvpBtn")}
            </TransitionLink>
          </BlurFade>
        </div>
      </section>

      {/* ── 3. VENUE SPOTLIGHT ───────────────────────────────────────────────── */}
      <section className="bg-wedding-ivory py-24 px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Text side */}
          <div>
            <BlurFade delay={0.05}>
              <p className="font-sans text-[9px] tracking-[0.55em] uppercase text-wedding-gold-dark mb-5">
                {t("det.venueSectionEyebrow")}
              </p>
            </BlurFade>
            <BlurFade delay={0.1}>
              <h2 className="font-display text-4xl md:text-5xl italic text-wedding-charcoal mb-2 leading-tight">
                Kirana Estate
              </h2>
            </BlurFade>
            <BlurFade delay={0.14}>
              <p className="font-serif text-wedding-charcoal/70 text-sm mb-9 leading-relaxed">
                Jl. Raya Sayan, Sayan<br />
                Ubud, Gianyar, Bali 80571
              </p>
            </BlurFade>
            <BlurFade delay={0.22}>
              <div className="flex flex-wrap gap-3">
                {/* Google Maps — general area link, since Kirana Estate is a fictional venue */}
                <a
                  href={MAPS_SHORT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-sans text-[10px] tracking-[0.3em] uppercase text-wedding-cream bg-wedding-charcoal px-7 py-3 rounded-full hover:bg-wedding-gold/90 transition-colors duration-300"
                >
                  <MapPin className="w-3 h-3" />
                  {t("det.mapsBtn")}
                </a>
              </div>
            </BlurFade>
          </div>

          {/* Photo side */}
          <BlurFade delay={0.28} className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-wedding-charcoal/15 aspect-[4/3] lg:aspect-[3/4]">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-wedding-gold/35 to-transparent z-10" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={VENUE_IMG}
                alt="Kirana Estate, Ubud"
                className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wedding-charcoal/25 via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Floating date badge */}
            <div className="absolute -bottom-4 -left-4 bg-wedding-cream border border-wedding-taupe/20 rounded-xl px-5 py-3 shadow-lg">
              <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-wedding-taupe-dark">
                {t("det.dateLabel")}
              </p>
              <p className="font-display text-xl text-wedding-charcoal mt-0.5 tracking-wide">
                16 · 08 · 2026
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Google Maps embed */}
        <BlurFade delay={0.35}>
          <div className="max-w-5xl mx-auto mt-16">
            <div className="relative rounded-2xl overflow-hidden border border-wedding-taupe/15 shadow-xl shadow-wedding-charcoal/8">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-wedding-gold/25 to-transparent z-10 pointer-events-none" />
              <iframe
                title="Kirana Estate, Ubud"
                src="https://maps.google.com/maps?q=Ubud,+Gianyar,+Bali,+Indonesia&output=embed&z=13"
                width="100%"
                height="420"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale contrast-[1.05] hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </BlurFade>
      </section>

      {/* ── 3.5 TRAVEL & STAY ────────────────────────────────────────────────── */}
      <section className="py-24 px-8 bg-wedding-cream">
        <div className="max-w-2xl mx-auto">
          <BlurFade delay={0.05}>
            <h2 className="font-display text-3xl md:text-4xl italic text-wedding-charcoal text-center mb-14">
              {t("det.travelH2")}
            </h2>
          </BlurFade>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <BlurFade delay={0.1}>
              <EventItem
                icon={<Train className="w-4 h-4" />}
                label={t("det.gettingHereLabel")}
                value={t("det.gettingHereText")}
              />
            </BlurFade>
            <BlurFade delay={0.14}>
              <EventItem
                icon={<Hotel className="w-4 h-4" />}
                label={t("det.stayLabel")}
                value={t("det.stayText")}
              />
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── 4. EVENT DETAILS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-8 bg-wedding-cream">
        <div className="max-w-4xl mx-auto">
          <BlurFade delay={0.05}>
            <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-wedding-taupe-dark text-center mb-4">
              {t("det.eventEyebrow")}
            </p>
          </BlurFade>
          <BlurFade delay={0.1}>
            <div className="max-w-xs mx-auto mb-16">
              <BotanicalDivider centerText="✦" />
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <BlurFade delay={0.12}>
              <EventItem
                icon={<Calendar className="w-4 h-4" />}
                label={t("det.dateLabel")}
                value={t("det.dateValue")}
              />
            </BlurFade>
            <BlurFade delay={0.16}>
              <EventItem
                icon={<MapPin className="w-4 h-4" />}
                label={t("det.venueLabel")}
                value={t("det.venueValue")}
              />
            </BlurFade>
            <BlurFade delay={0.20}>
              <EventItem
                icon={<Clock className="w-4 h-4" />}
                label={t("det.ceremonyLabel")}
                value={t("det.ceremonyValue")}
              />
            </BlurFade>
            <BlurFade delay={0.24}>
              <EventItem
                icon={<Clock className="w-4 h-4" />}
                label={t("det.receptionLabel")}
                value={t("det.receptionValue")}
              />
            </BlurFade>
            <BlurFade delay={0.28}>
              <EventItem
                icon={<Music className="w-4 h-4" />}
                label={t("det.musicLabel")}
                value={t("det.musicValue")}
              />
            </BlurFade>
            <BlurFade delay={0.32}>
              <EventItem
                icon={<Utensils className="w-4 h-4" />}
                label={t("det.dinnerLabel")}
                value={t("det.dinnerValue")}
              />
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── 5. TABS: Schedule / Dress Code ───────────────────────────────────── */}
      <section className="py-24 px-8 bg-wedding-ivory overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <BlurFade delay={0.05}>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabId)}
              className="gap-0"
            >
              {/* Tab navigation */}
              <TabsList
                variant="line"
                className="w-full h-auto p-0 gap-0 justify-start rounded-none bg-transparent border-b border-wedding-taupe/20 mb-14"
              >
                {tabItems.map(({ id, label }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="relative flex-1 min-w-[6rem] h-auto rounded-none border-none shadow-none data-active:shadow-none bg-transparent data-active:bg-transparent dark:data-active:bg-transparent font-sans text-[10px] tracking-[0.35em] uppercase font-normal pb-4 pt-2 px-2 whitespace-nowrap transition-colors duration-200 text-wedding-taupe-dark data-active:text-wedding-charcoal hover:text-wedding-charcoal/70 after:inset-x-3 after:bottom-0 after:rounded-full after:bg-wedding-gold"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── Tab 1: Schedule ── */}
              <TabsContent value="schedule">
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[68px] top-0 bottom-0 w-px bg-wedding-taupe/20" />
                  <TimelineRow
                    time={t("det.schedule.ceremony.time")}
                    note="AM · WITA"
                    label={t("det.schedule.ceremony.label")}
                    desc={t("det.schedule.ceremony.desc")}
                  />
                  <TimelineRow
                    time={t("det.schedule.reception.time")}
                    note="AM · WITA"
                    label={t("det.schedule.reception.label")}
                    desc={t("det.schedule.reception.desc")}
                  />
                  <TimelineRow
                    time={t("det.schedule.end.time")}
                    note="PM · WITA"
                    label={t("det.schedule.end.label")}
                    dimmed
                  />
                </div>
                <p className="font-sans text-[9px] tracking-[0.35em] uppercase text-wedding-taupe-dark text-center mt-12">
                  {t("det.schedule.timezone")}
                </p>
              </TabsContent>

              {/* ── Tab 2: Dress Code ── */}
              <TabsContent value="dresscode">
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-wedding-gold/10 border border-wedding-gold/30 flex items-center justify-center text-wedding-gold/70 mb-8">
                    <Shirt className="w-6 h-6" />
                  </div>
                  <p className="font-sans text-[9px] tracking-[0.5em] uppercase text-wedding-taupe-dark mb-4">
                    {t("det.dresscodeLabel")}
                  </p>
                  <h3 className="font-display text-4xl md:text-5xl text-wedding-charcoal italic mb-6">
                    {t("det.dresscodeValue")}
                  </h3>
                  <div className="w-12 h-px bg-wedding-gold/40 mb-8" />
                  <p className="font-serif text-wedding-charcoal/70 leading-relaxed max-w-md">
                    {t("det.dresscodeNote")}
                  </p>
                  {/* Suggested color palette swatches */}
                  <div className="flex gap-3 mt-10 flex-wrap justify-center">
                    {[
                      { hex: "#B8C4BB", name: "Sage" },
                      { hex: "#8A9A5B", name: "Olive" },
                      { hex: "#4C7A5D", name: "Emerald" },
                      { hex: "#3F4A35", name: "Forest" },
                      { hex: "#A8C3A0", name: "Mint" },
                      { hex: "#6B7F5E", name: "Moss" },
                    ].map(({ hex, name }) => (
                      <div key={hex} className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-8 h-8 rounded-full border border-wedding-taupe/20 shadow-sm"
                          style={{ backgroundColor: hex }}
                          title={name}
                        />
                        <span className="font-sans text-[9px] tracking-wide uppercase text-wedding-taupe-dark">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </BlurFade>
        </div>
      </section>

      <Footer />
    </div>
  );
}
