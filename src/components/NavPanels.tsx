"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useLang } from "@/context/LangContext";
import { TransitionLink } from "@/components/TransitionLink";

interface PanelData {
  label: string;
  sub: string;
  href: string;
  image: string;
  imgPosition: string;
  accent: string;
}

function Panel({
  label,
  sub,
  href,
  image,
  imgPosition,
  accent,
  index,
}: PanelData & { index: number }) {
  const inner = (
    <motion.div
      className="grain relative h-80 flex items-end p-8 group overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Background photo, zooms in slowly on hover */}
      <Image
        src={image}
        alt={label}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        style={{ objectPosition: imgPosition }}
        className="z-0 object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />

      {/* Permanent gradient wash for text legibility over the photo */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/25 to-black/10 pointer-events-none" />

      {/* Gold gradient accent line at panel top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-wedding-cream/20 to-transparent z-[2]" />

      {/* Hover overlay — slides up from bottom */}
      <motion.div
        className={`absolute inset-0 z-[2] ${accent}`}
        initial={{ y: "100%" }}
        whileHover={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* Decorative corner mark */}
      <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-wedding-cream/40">
          <path d="M4 4h12M16 4v12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Panel number */}
      <span className="absolute top-6 left-8 z-10 font-sans text-[9px] tracking-[0.4em] uppercase text-wedding-cream/60 group-hover:text-wedding-cream/70 transition-colors duration-300">
        0{index + 1}
      </span>

      {/* Label + sub — lift on hover */}
      <div className="relative z-10">
        <motion.p
          className="font-sans text-[9px] tracking-[0.35em] uppercase text-wedding-cream/60 mb-1.5 group-hover:text-wedding-cream/85 transition-colors duration-300"
          initial={false}
        >
          {sub}
        </motion.p>
        <p className="font-display text-3xl italic text-wedding-cream tracking-wide leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] group-hover:tracking-wider transition-all duration-500">
          {label}
        </p>
      </div>

      {/* Bottom border reveal */}
      <motion.div
        className="absolute bottom-0 left-0 z-10 h-[2px] bg-wedding-cream/30 origin-left"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
      />
    </motion.div>
  );

  return <TransitionLink href={href}>{inner}</TransitionLink>;
}

export function NavPanels() {
  const { t } = useLang();

  const PANELS: PanelData[] = [
    {
      label: t("panel.story.label"),
      sub: t("panel.story.sub"),
      href: "/story",
      image: "https://images.unsplash.com/photo-1591969852023-190295e484bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      imgPosition: "50% 45%",
      accent: "bg-wedding-obsidian/25",
    },
    {
      label: t("panel.details.label"),
      sub: t("panel.details.sub"),
      href: "/details",
      image: "https://images.unsplash.com/photo-1782686223394-af72f7de562c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      imgPosition: "50% 60%",
      accent: "bg-wedding-gold/25",
    },
    {
      label: t("panel.rsvp.label"),
      sub: t("panel.rsvp.sub"),
      href: "#rsvp",
      image: "https://images.unsplash.com/photo-1707707178778-bec9382d152c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      imgPosition: "50% 60%",
      accent: "bg-wedding-slate/25",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3">
      {PANELS.map((panel, i) => (
        <Panel key={panel.href} {...panel} index={i} />
      ))}
    </section>
  );
}
