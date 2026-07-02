import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type BorderBeamProps = {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  delay?: number;
};

export function BorderBeam({
  className,
  size = 120,
  duration = 10,
  colorFrom = "#C4B47E",
  colorTo = "transparent",
  borderWidth = 1,
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--border-width": borderWidth,
          "--delay": `-${delay}s`,
        } as CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "[border:calc(var(--border-width)*1px)_solid_transparent]",
        "[background:linear-gradient(#F2EDE3,#F2EDE3)_padding-box,conic-gradient(from_var(--border-angle),var(--color-to)_60%,var(--color-from)_100%)_border-box]",
        "[animation:border-beam-rotate_calc(var(--duration)*1s)_var(--delay)_linear_infinite]",
        className
      )}
    />
  );
}
