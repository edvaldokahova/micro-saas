// Símbolo Bilonai (anéis + pupila) + nome do produto
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="-48 -48 96 96" className="h-7 w-7" aria-hidden="true">
        <defs>
          <linearGradient id="bl-gold" x1="-43" y1="-43" x2="43" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E8C766" />
            <stop offset="1" stopColor="#B8891B" />
          </linearGradient>
        </defs>
        <circle r="40" fill="none" stroke="url(#bl-gold)" strokeWidth="7" strokeLinecap="round" strokeDasharray="205 46.33" transform="rotate(-60)" />
        <circle r="25" fill="none" stroke="url(#bl-gold)" strokeWidth="6" strokeLinecap="round" strokeDasharray="120 37.08" transform="rotate(120)" />
        <circle r="10" fill="#F2EEE6" />
      </svg>
      <span className="font-display text-[15px] font-semibold tracking-tight">
        Bilonai <span className="text-gold-gradient">Entrega</span>
      </span>
    </span>
  );
}
