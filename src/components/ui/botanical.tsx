import { cn } from "@/lib/utils";

interface BotanicalDividerProps {
  className?: string;
  centerText?: string;
}

export function BotanicalDivider({ className, centerText }: BotanicalDividerProps) {
  return (
    <div className={cn("flex items-center gap-3 w-full", className)}>
      <svg
        viewBox="0 0 120 24"
        fill="none"
        className="flex-1 h-6 text-wedding-gold/40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Stem */}
        <line x1="0" y1="12" x2="100" y2="12" stroke="currentColor" strokeWidth="0.6" />
        {/* Left leaf cluster */}
        <ellipse cx="30" cy="12" rx="8" ry="3.5" transform="rotate(-20 30 12)" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <ellipse cx="55" cy="12" rx="7" ry="3" transform="rotate(15 55 12)" stroke="currentColor" strokeWidth="0.6" fill="none" />
        {/* Berry dots */}
        <circle cx="90" cy="9" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="96" cy="13" r="1.2" fill="currentColor" opacity="0.5" />
        <circle cx="100" cy="8" r="1" fill="currentColor" opacity="0.4" />
        {/* Tip */}
        <path d="M100 12 L108 9 L112 12 L108 15 Z" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <line x1="112" y1="12" x2="120" y2="12" stroke="currentColor" strokeWidth="0.6" />
      </svg>

      {centerText ? (
        <span className="font-sans text-[10px] tracking-[0.3em] text-wedding-gold/50 shrink-0 select-none">
          {centerText}
        </span>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-wedding-gold/40 shrink-0" aria-hidden>
          <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        </svg>
      )}

      {/* Mirror of left side */}
      <svg
        viewBox="0 0 120 24"
        fill="none"
        className="flex-1 h-6 text-wedding-gold/40 scale-x-[-1]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <line x1="0" y1="12" x2="100" y2="12" stroke="currentColor" strokeWidth="0.6" />
        <ellipse cx="30" cy="12" rx="8" ry="3.5" transform="rotate(-20 30 12)" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <ellipse cx="55" cy="12" rx="7" ry="3" transform="rotate(15 55 12)" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <circle cx="90" cy="9" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="96" cy="13" r="1.2" fill="currentColor" opacity="0.5" />
        <circle cx="100" cy="8" r="1" fill="currentColor" opacity="0.4" />
        <path d="M100 12 L108 9 L112 12 L108 15 Z" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <line x1="112" y1="12" x2="120" y2="12" stroke="currentColor" strokeWidth="0.6" />
      </svg>
    </div>
  );
}

interface BotanicalCornerProps {
  className?: string;
  /** Flip horizontally for right-side corners */
  flip?: boolean;
}

export function BotanicalCorner({ className, flip = false }: BotanicalCornerProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "w-16 h-16 text-wedding-gold/35",
        flip && "scale-x-[-1]",
        className,
      )}
      aria-hidden
      style={{ animation: "wCornerGlow 4s ease-in-out infinite" }}
    >
      {/* Main branch from corner */}
      <path d="M4 4 Q20 20 50 24" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <path d="M4 4 Q22 22 24 50" stroke="currentColor" strokeWidth="0.7" fill="none" />
      {/* Horizontal leaves */}
      <ellipse cx="28" cy="14" rx="10" ry="4" transform="rotate(-10 28 14)" stroke="currentColor" strokeWidth="0.6" fill="none" />
      <ellipse cx="42" cy="20" rx="8" ry="3" transform="rotate(5 42 20)" stroke="currentColor" strokeWidth="0.6" fill="none" />
      {/* Vertical leaves */}
      <ellipse cx="14" cy="28" rx="4" ry="10" transform="rotate(10 14 28)" stroke="currentColor" strokeWidth="0.6" fill="none" />
      <ellipse cx="20" cy="42" rx="3" ry="8" transform="rotate(-5 20 42)" stroke="currentColor" strokeWidth="0.6" fill="none" />
      {/* Berries */}
      <circle cx="50" cy="22" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="54" cy="28" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="22" cy="50" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="28" cy="54" r="1.5" fill="currentColor" opacity="0.4" />
      {/* Corner dot */}
      <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function BotanicalSprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 text-wedding-gold/35 inline-block", className)}
      aria-hidden
    >
      <line x1="0" y1="10" x2="40" y2="10" stroke="currentColor" strokeWidth="0.5" />
      <ellipse cx="14" cy="10" rx="5" ry="2.5" transform="rotate(-15 14 10)" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <ellipse cx="26" cy="10" rx="5" ry="2.5" transform="rotate(15 26 10)" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <circle cx="36" cy="8" r="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
