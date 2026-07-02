"use client";

import { useEffect, useState } from "react";
import { Particles, ParticlesProvider, type ParticlesPluginRegistrar } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// ParticlesProvider requires this reference to stay stable across the app's
// lifetime, so it must live outside the component (an inline/useCallback fn
// still creates a new identity on remount and throws).
const initEngine: ParticlesPluginRegistrar = async (engine) => {
  await loadSlim(engine);
};

const GOLD = "#C4B47E";
const CREAM = "#F2EDE3";
const WHITE = "#FFFFFF";

const options: ISourceOptions = {
  fullScreen: { enable: false },
  fpsLimit: 60,
  detectRetina: true,
  background: { color: { value: "transparent" } },
  particles: {
    number: {
      value: 50,
      density: { enable: true, width: 1920, height: 1080 },
    },
    color: { value: [GOLD, CREAM, WHITE] },
    opacity: {
      value: { min: 0.15, max: 0.5 },
      animation: { enable: true, speed: 0.8, sync: false, startValue: "random" },
    },
    size: {
      value: { min: 1, max: 2.6 },
      animation: { enable: true, speed: 2, sync: false, startValue: "random" },
    },
    shape: {
      type: ["circle", "star"],
      options: { star: { sides: 4, inset: 2 } },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 4, sync: false },
    },
    move: {
      enable: true,
      speed: { min: 0.2, max: 0.6 },
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "out" },
    },
    links: { enable: false },
  },
  interactivity: {
    detectsOn: "window",
    events: {
      onHover: { enable: true, mode: "bubble" },
      resize: { enable: true },
    },
    modes: {
      bubble: { distance: 180, duration: 1.8, opacity: 0.6, size: 3.5, mix: false },
    },
  },
};

export function ParticlesBackground() {
  // Default to "off" until mounted client-side, so a reduced-motion user never
  // sees a flash of particles before the media query is evaluated.
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => setMounted(true), []);

  if (!mounted || reducedMotion) return null;

  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        id="wedding-sparkles"
        className="pointer-events-none fixed inset-0 z-30"
        options={options}
      />
    </ParticlesProvider>
  );
}
