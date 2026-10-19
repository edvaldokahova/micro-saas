// Logotipo oficial BILONAI (desenhado em curvas: o "O" é o olho dourado) + nome do produto.
// As letras usam currentColor, por isso acompanham o modo claro e escuro.
export function Wordmark({ className = "h-[18px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="56 26 488 92" className={className} fill="none" role="img" aria-label="Bilonai">
      <defs>
        <linearGradient id="bl-gold" gradientUnits="userSpaceOnUse" x1="-43" y1="-43" x2="43" y2="43">
          <stop offset="0" stopColor="#F3D77A" />
          <stop offset="0.5" stopColor="#D4A936" />
          <stop offset="1" stopColor="#A67C1A" />
        </linearGradient>
        <clipPath id="bl-cap">
          <rect x="0" y="40" width="600" height="64" />
        </clipPath>
      </defs>
      <g transform="translate(300 72)">
        <circle r="40" stroke="url(#bl-gold)" strokeWidth="6" strokeLinecap="round" strokeDasharray="205 46.33" transform="rotate(-60)" />
        <circle r="25" stroke="url(#bl-gold)" strokeWidth="5" strokeLinecap="round" strokeDasharray="120 37.08" transform="rotate(120)" />
        <circle r="9" fill="currentColor" />
      </g>
      <g stroke="currentColor" strokeWidth="6" strokeLinejoin="miter" strokeMiterlimit="10">
        <path d="M64.5 40V104" />
        <path d="M64.5 43H91.5A14.5 14.5 0 0 1 91.5 72H64.5" />
        <path d="M64.5 72H94.5A14.5 14.5 0 0 1 94.5 101H64.5" />
        <path d="M147 40V104" />
        <path d="M185 40V101H225" />
        <g clipPath="url(#bl-cap)">
          <path d="M378 104V40L424 104V40" />
        </g>
        <g clipPath="url(#bl-cap)">
          <path d="M454 104L481 40L508 104" />
          <path d="M461 88H501" strokeWidth="4.5" />
        </g>
        <path d="M535.5 40V104" />
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Wordmark />
      <ProductMark />
    </span>
  );
}

// Selo do produto: cápsula com contorno dourado, visto de entrega e nome em dourado
export function ProductMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 rounded-full py-[3px] pl-1.5 pr-2.5 ${className}`}
      style={{
        background:
          "linear-gradient(var(--color-ink-2), var(--color-ink-2)) padding-box, linear-gradient(135deg, #f3d77a, #d4a936 50%, #a67c1a) border-box",
        border: "1px solid transparent",
      }}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
        <defs>
          <linearGradient id="pm-gold" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F3D77A" />
            <stop offset="1" stopColor="#A67C1A" />
          </linearGradient>
        </defs>
        <circle cx="8" cy="8" r="8" fill="url(#pm-gold)" />
        <path d="M4.6 8.3 7 10.6l4.5-5" fill="none" stroke="#0a0b0d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-gold-gradient font-display text-[13px] font-semibold leading-none tracking-[0.02em]">Entrega</span>
    </span>
  );
}
