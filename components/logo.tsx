// Logotipo oficial BILONAI, monocromático: o "O" é o olho (dois anéis abertos e a pupila).
// Tudo usa currentColor: preto no fundo claro, branco no fundo escuro.
// Os anéis e as letras têm classes próprias para a animação de entrada (lg-ring, lg-dot, lg-letter).
export function Wordmark({ className = "h-[16px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="56 26 488 92" className={className} fill="none" role="img" aria-label="Bilonai">
      <defs>
        <clipPath id="bl-cap">
          <rect x="0" y="40" width="600" height="64" />
        </clipPath>
      </defs>
      <g transform="translate(300 72)" stroke="currentColor" strokeLinecap="round">
        <circle className="lg-ring" r="40" strokeWidth="6" strokeDasharray="205 46.33" transform="rotate(-60)" />
        <circle className="lg-ring" r="25" strokeWidth="5" strokeDasharray="120 37.08" transform="rotate(120)" />
        <circle className="lg-dot" r="9" fill="currentColor" stroke="none" />
      </g>
      <g stroke="currentColor" strokeWidth="6" strokeLinejoin="miter" strokeMiterlimit="10">
        <g className="lg-letter">
          <path d="M64.5 40V104" />
          <path d="M64.5 43H91.5A14.5 14.5 0 0 1 91.5 72H64.5" />
          <path d="M64.5 72H94.5A14.5 14.5 0 0 1 94.5 101H64.5" />
        </g>
        <path className="lg-letter" d="M147 40V104" />
        <path className="lg-letter" d="M185 40V101H225" />
        <g className="lg-letter" clipPath="url(#bl-cap)">
          <path d="M378 104V40L424 104V40" />
        </g>
        <g className="lg-letter" clipPath="url(#bl-cap)">
          <path d="M454 104L481 40L508 104" />
          <path d="M461 88H501" strokeWidth="4.5" />
        </g>
        <path className="lg-letter" d="M535.5 40V104" />
      </g>
    </svg>
  );
}

// Assinatura: só a palavra BILONAI (o produto chama-se Bilonai)
export function Logo({ className = "" }: { className?: string }) {
  return <Wordmark className={`h-[17px] w-auto text-ivory ${className}`} />;
}
