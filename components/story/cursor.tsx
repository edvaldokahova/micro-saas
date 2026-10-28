// Cursores desenhados à mão (não são de biblioteca): seta, mão de clique (estilo Linux/X11) e barra de texto.
// O ponto ativo de cada um fica exatamente na posição (0,0) do contentor.
export type CursorKind = "arrow" | "hand" | "text";

export function CursorSprites() {
  return (
    <>
      <svg data-cursor="arrow" width="24" height="26" viewBox="0 0 24 26" className="absolute left-0 top-0 -ml-[3px] -mt-[2px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
        <path d="M3 2v18.6l4.6-4.4 3.1 6.9 3.2-1.4-3-6.8h6.5z" fill="#121316" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <svg data-cursor="hand" width="26" height="28" viewBox="0 0 26 28" className="absolute left-0 top-0 -ml-[9.5px] -mt-[2.5px] opacity-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
        <path
          d="M9.5 2.5c-1.1 0-2 .9-2 2v9.2l-1.6-1.7c-.8-.8-2-.8-2.8 0-.7.7-.8 1.8-.2 2.6l4.4 5.8c1.2 1.6 3 2.5 5 2.5h2.6c3.3 0 6-2.7 6-6v-4.6c0-1-.8-1.8-1.8-1.8-.5 0-.9.2-1.2.5v-.3c0-1-.8-1.8-1.8-1.8-.5 0-1 .2-1.3.6-.3-.8-1-1.3-1.8-1.3-.4 0-.8.1-1.1.3V4.5c0-1.1-.9-2-2-2z"
          fill="#fff"
          stroke="#121316"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M11.5 10.5v5M14.6 11v4.5M17.7 11.8v3.7" stroke="#121316" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <svg data-cursor="text" width="14" height="24" viewBox="0 0 14 24" className="absolute left-0 top-0 -ml-[7px] -mt-[12px] opacity-0">
        <path d="M3.5 2.5c1.6 0 2.7.6 3.5 1.6.8-1 1.9-1.6 3.5-1.6M3.5 21.5c1.6 0 2.7-.6 3.5-1.6.8 1 1.9 1.6 3.5 1.6M7 4v16M5 12h4" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M3.5 2.5c1.6 0 2.7.6 3.5 1.6.8-1 1.9-1.6 3.5-1.6M3.5 21.5c1.6 0 2.7-.6 3.5-1.6.8 1 1.9 1.6 3.5 1.6M7 4v16M5 12h4" fill="none" stroke="#121316" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </>
  );
}

// Mostra o cursor certo (sem re-render do React: só opacidade)
export function showCursor(root: HTMLElement | null, kind: CursorKind) {
  root?.querySelectorAll<SVGElement>("[data-cursor]").forEach((el) => {
    el.style.opacity = el.dataset.cursor === kind ? "1" : "0";
  });
}
