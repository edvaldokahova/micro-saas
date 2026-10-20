// Logotipo oficial BILONAI (desenhado em curvas: o "O" é o olho dourado) + nome do produto.
// As letras usam currentColor, por isso acompanham o modo claro e escuro.
export function Wordmark({ className = "h-[16px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="56 26 488 92" className={className} fill="none" role="img" aria-label="Bilonai">
      <defs>
        <linearGradient id="bl-gold" gradientUnits="userSpaceOnUse" x1="-43" y1="-43" x2="43" y2="43">
          <stop offset="0" stopColor="#E2C26A" />
          <stop offset="0.5" stopColor="#B8902F" />
          <stop offset="1" stopColor="#8A6A1F" />
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

// Assinatura completa: BILONAI | Entrega
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Wordmark />
      <span className="h-[18px] w-px bg-line-strong" aria-hidden />
      <ProductMark />
    </span>
  );
}

// Nome do produto: serifa editorial, direita
export function ProductMark({ className = "" }: { className?: string }) {
  return <span className={`font-display text-[21px] leading-none tracking-[-0.01em] text-ivory ${className}`}>Entrega</span>;
}
