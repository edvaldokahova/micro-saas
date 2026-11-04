import { useId } from "react";

// Esteira de formatos aceites no envio do cliente. Só decoração + lista para leitores de ecrã.
// Cada formato tem o seu próprio símbolo (traço fino, cor herdada do tema).
const FORMATOS = ["PDF", "DOC", "XLS", "PPT", "JPG", "PNG", "CSV", "XML", "TXT"] as const;
type Formato = (typeof FORMATOS)[number];

const PAGINA = "M5 1.5h20l12 12V44a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 44V4A2.5 2.5 0 0 1 5 1.5Z";
const DOBRA = "M25 1.5v12h12";
const FOLHA = "M17 4h18a3 3 0 0 1 3 3v32a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z";
const TRACO = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

// Word, Excel e PowerPoint: folha de papel com o "selo" da aplicação à frente
function Selo({ letra }: { letra: "W" | "X" | "P" }) {
  const id = useId();
  const marca =
    letra === "W" ? "M7 21l2.8 10 3.2-7.5 3.2 7.5L19 21" : letra === "X" ? "M8 21l10 10M18 21L8 31" : "M9 31V21h5a3.5 3.5 0 0 1 0 7H9";
  return (
    <>
      <mask id={id}>
        <rect width="40" height="48" fill="#fff" />
        <rect x="0" y="12" width="28" height="28" rx="5" fill="#000" />
      </mask>
      <path d={FOLHA} {...TRACO} mask={`url(#${id})`} />
      <path d="M29 12h5M29 18h5M29 24h5M29 30h5" {...TRACO} />
      <rect x="2" y="14" width="22" height="24" rx="3.5" {...TRACO} />
      <path d={marca} {...TRACO} strokeWidth={1.8} />
    </>
  );
}

function Simbolo({ tipo }: { tipo: Formato }) {
  switch (tipo) {
    case "DOC":
      return <Selo letra="W" />;
    case "XLS":
      return <Selo letra="X" />;
    case "PPT":
      return <Selo letra="P" />;
    case "PDF":
      return (
        <>
          <path d={PAGINA} {...TRACO} />
          <path d={DOBRA} {...TRACO} />
          <path d="M8 19h10M8 24h18" {...TRACO} />
          <rect x="7" y="30" width="26" height="11" rx="2" {...TRACO} />
          <text x="20" y="38.4" textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="0.6" fill="currentColor" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
            PDF
          </text>
        </>
      );
    case "CSV":
      return (
        <>
          <path d={PAGINA} {...TRACO} />
          <path d={DOBRA} {...TRACO} />
          <rect x="8" y="20" width="24" height="20" rx="1.5" {...TRACO} />
          <path d="M8 26.7h24M8 33.3h24M16 20v20M24 20v20" {...TRACO} />
        </>
      );
    case "XML":
      return (
        <>
          <path d={PAGINA} {...TRACO} />
          <path d={DOBRA} {...TRACO} />
          <path d="M14 24l-6 6 6 6M26 24l6 6-6 6M23 22l-6 16" {...TRACO} />
        </>
      );
    case "TXT":
      return (
        <>
          <path d={PAGINA} {...TRACO} />
          <path d={DOBRA} {...TRACO} />
          <path d="M8 20h22M8 26h18M8 32h22M8 38h12" {...TRACO} />
        </>
      );
    case "JPG":
      return (
        <>
          <rect x="2" y="9" width="36" height="30" rx="3.5" {...TRACO} />
          <circle cx="13" cy="19" r="3" {...TRACO} />
          <path d="M2 33l11-9 8 7 6-5 11 9" {...TRACO} />
        </>
      );
    case "PNG":
      return (
        <>
          <rect x="2" y="9" width="36" height="30" rx="3.5" {...TRACO} />
          <g fill="currentColor" opacity="0.45">
            <rect x="7" y="13" width="5" height="5" />
            <rect x="17" y="13" width="5" height="5" />
            <rect x="27" y="13" width="5" height="5" />
            <rect x="12" y="18" width="5" height="5" />
            <rect x="22" y="18" width="5" height="5" />
          </g>
          <path d="M2 33l11-8 8 6 6-5 11 9" {...TRACO} />
        </>
      );
  }
}

function Grupo({ clone = false }: { clone?: boolean }) {
  return (
    <ul className="formatos-grupo" aria-hidden="true" data-clone={clone ? "" : undefined}>
      {FORMATOS.map((f) => (
        <li key={f}>
          <svg width="40" height="48" viewBox="0 0 40 48" fill="none" aria-hidden="true">
            <Simbolo tipo={f} />
          </svg>
        </li>
      ))}
    </ul>
  );
}

export function FormatosMarquee() {
  return (
    <div className="formatos" role="group" aria-label={FORMATOS.join(", ")}>
      <div className="formatos-pista">
        <Grupo />
        <Grupo clone />
      </div>
    </div>
  );
}
