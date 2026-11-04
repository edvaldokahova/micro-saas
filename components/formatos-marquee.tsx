// Esteira de formatos aceites no envio do cliente. Só decoração + lista para leitores de ecrã.
const FORMATOS = ["PDF", "DOC", "XLS", "PPT", "JPG", "PNG", "CSV", "XML", "TXT"];

function Ficheiro({ ext }: { ext: string }) {
  return (
    <svg width="40" height="48" viewBox="0 0 40 48" fill="none" aria-hidden="true">
      <path
        d="M5 1.5h20l12 12V44a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 44V4A2.5 2.5 0 0 1 5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M25 1.5v12h12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <text
        x="20"
        y="35"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="600"
        letterSpacing="0.5"
        fill="currentColor"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {ext}
      </text>
    </svg>
  );
}

function Grupo({ clone = false }: { clone?: boolean }) {
  return (
    <ul className="formatos-grupo" aria-hidden="true" data-clone={clone ? "" : undefined}>
      {FORMATOS.map((f) => (
        <li key={f}>
          <Ficheiro ext={f} />
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
