"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useLang } from "@/context/LangContext";

// Scroll-event visibility hook (reliable with Lenis smooth scroll)
function useScrollInView(margin = 100) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (visible) return;
    const check = () => {
      const el = ref.current;
      if (!el) return;
      const { top, bottom } = el.getBoundingClientRect();
      if (top < window.innerHeight + margin && bottom > -margin) setVisible(true);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [visible, margin]);
  return { ref, visible };
}

// Photo with scroll-reveal and subtle hover lift
function TimelinePhoto({ src, alt, portrait, objectPosition = "center" }: {
  src: string; alt: string; portrait: boolean; objectPosition?: string;
}) {
  const { ref, visible } = useScrollInView(120);
  return (
    <div
      ref={ref}
      className="flex-1 flex items-start justify-center sm:justify-start"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
      }}
    >
      <div
        className={`
          w-full overflow-hidden rounded-sm shadow-lg
          ${portrait ? "max-w-[220px] aspect-[3/4]" : "max-w-[280px] aspect-[4/3]"}
        `}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
          style={{ objectPosition }}
        />
      </div>
    </div>
  );
}

type EventData = {
  date: string;
  title: string;
  desc: string;
  photo: string;
  alt: string;
  portrait: boolean;
  objectPosition?: string;
};

function TimelineItem({ event, index }: { event: EventData; index: number }) {
  const { ref, visible } = useScrollInView(80);
  // Alternate: even = text-left photo-right, odd = photo-left text-right
  const textOnLeft = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`relative flex flex-col sm:items-start gap-6 sm:gap-8 mb-16 ${textOnLeft ? "sm:flex-row" : "sm:flex-row-reverse"}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0)"
          : `translateX(${textOnLeft ? -30 : 30}px)`,
        transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
      }}
    >
      {/* Text card */}
      <div className={`flex-1 text-center ${textOnLeft ? "sm:text-right" : "sm:text-left"}`}>
        <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-wedding-taupe-dark mb-2">
          {event.date}
        </p>
        <h3 className="font-display text-2xl md:text-3xl text-wedding-charcoal mb-3 tracking-wide">
          {event.title}
        </h3>
        <p className="font-serif text-wedding-charcoal/70 leading-relaxed text-base">
          {event.desc}
        </p>
      </div>

      {/* Center node on the beam — only meaningful once the vertical beam line reappears at sm: */}
      <div className="relative hidden sm:flex flex-shrink-0 flex-col items-center" style={{ width: 32 }}>
        <div
          className="w-3 h-3 rounded-full bg-wedding-gold border-2 border-wedding-cream shadow-sm"
          style={{
            transform: visible ? "scale(1)" : "scale(0)",
            transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s",
          }}
        />
      </div>

      {/* Photo on the opposite side */}
      <TimelinePhoto src={event.photo} alt={event.alt} portrait={event.portrait} objectPosition={event.objectPosition} />
    </div>
  );
}

export function TimelineBeam() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 30%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const EVENTS: EventData[] = [
    {
      date: t("tl.e1.date"),
      title: t("tl.e1.title"),
      desc: t("tl.e1.desc"),
      photo: "https://images.unsplash.com/photo-1768711461320-bdcd460f9441?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      alt: "First meeting",
      portrait: true,
    },
    {
      date: t("tl.e2.date"),
      title: t("tl.e2.title"),
      desc: t("tl.e2.desc"),
      photo: "https://images.unsplash.com/photo-1516349935484-52a0d805fdb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      alt: "Start of relationship",
      portrait: false,
    },
    {
      date: t("tl.e3.date"),
      title: t("tl.e3.title"),
      desc: t("tl.e3.desc"),
      photo: "https://images.unsplash.com/photo-1576089073624-b5751a8f4de9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      alt: "Meeting the family",
      portrait: false,
    },
    {
      date: t("tl.e4.date"),
      title: t("tl.e4.title"),
      desc: t("tl.e4.desc"),
      photo: "https://images.unsplash.com/photo-1542303594-5f30b18008eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      alt: "Proposal in Tokyo",
      portrait: false,
    },
    {
      date: t("tl.e6.date"),
      title: t("tl.e6.title"),
      desc: t("tl.e6.desc"),
      photo: "https://images.unsplash.com/photo-1777312378095-44bb1b70f834?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      alt: "Wedding day",
      portrait: true,
    },
  ];

  return (
    <div ref={containerRef} className="relative max-w-3xl mx-auto mt-16">
      {/* Animated center beam — hidden on mobile where items stack in a single column */}
      <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-wedding-taupe/20">
        <motion.div
          className="w-full bg-gradient-to-b from-wedding-gold/60 to-wedding-gold/20 origin-top"
          style={{ height: lineHeight }}
        />
      </div>

      {EVENTS.map((event, i) => (
        <TimelineItem key={i} event={event} index={i} />
      ))}
    </div>
  );
}
