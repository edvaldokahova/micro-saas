// Logotipo oficial BILONAI, monocromático. O "O" é o ciclo do mês: um anel quase fechado
// e, na abertura, o ponto que é o último documento a chegar.
// Tudo usa currentColor: preto no fundo claro, branco no fundo escuro.
// O símbolo, centrado em (0,0): anel de raio 29 (dos 40° aos 350°) e o ponto aos 17°
export const RING = "M18.64 -22.22A29 29 0 1 1 -5.04 -28.56";
export const DOT = { x: 8.48, y: -27.73 };

// Só o símbolo (para ícones e páginas de estado)
export function Mark({ className = "h-6 w-6", spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="-36 -36 72 72" className={className} fill="none" aria-hidden>
      <g>
        <path d={RING} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <circle cx={DOT.x} cy={DOT.y} r="5.2" fill="currentColor" />
        {/* Roda em volta do centro (0,0); o ponto dá a volta como quem procura sinal */}
        {spin && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.4s" repeatCount="indefinite" />}
      </g>
    </svg>
  );
}

export function Wordmark({ className = "h-[16px] w-auto" }: { className?: string }) {
  return (
    <svg viewBox="56 26 488 92" className={className} fill="none" role="img" aria-label="Bilonai">
      <defs>
        <clipPath id="bl-cap">
          <rect x="0" y="40" width="600" height="64" />
        </clipPath>
      </defs>
      <path d={RING} stroke="currentColor" strokeWidth="6" strokeLinecap="round" transform="translate(300 72)" />
      <circle cx={DOT.x + 300} cy={DOT.y + 72} r="5.2" fill="currentColor" />
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
