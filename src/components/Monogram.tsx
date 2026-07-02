export function Monogram({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-baseline gap-[0.1em] transition-transform duration-300 ease-out hover:scale-105 ${className}`}
    >
      <span className="font-monogram">K</span>
      <span className="monogram-amp inline-block font-display italic text-wedding-gold text-[0.6em]">
        &amp;
      </span>
      <span className="font-monogram">S</span>
    </span>
  );
}
