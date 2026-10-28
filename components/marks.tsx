// Marcas de documento: o sistema de ícones próprio do Bilonai.
// □ em falta · ◪ enviado pelo cliente (por confirmar) · ■✓ recebido
// Desenhadas numa grelha de 14 px, com cantos arredondados e traço redondo, como os ícones.
export type DocState = "pending" | "sent" | "received";

export function DocMark({ state, className = "h-3.5 w-3.5", animate = false }: { state: DocState; className?: string; animate?: boolean }) {
  const cls = `${className} shrink-0 ${animate ? "mark-in" : ""}`;
  if (state === "received") {
    return (
      <svg viewBox="0 0 14 14" className={cls} aria-hidden="true">
        <rect x="1" y="1" width="12" height="12" rx="3.2" fill="var(--color-ivory)" />
        <path d="M4.3 7.2l1.9 1.9 3.6-3.9" fill="none" stroke="var(--color-ink-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "sent") {
    return (
      <svg viewBox="0 0 14 14" className={cls} aria-hidden="true">
        <rect x="1.5" y="1.5" width="11" height="11" rx="2.8" fill="none" stroke="var(--color-gold)" strokeWidth="1.4" />
        <path d="M12.5 4.3v5.4a2.8 2.8 0 0 1-2.8 2.8H4.3z" fill="var(--color-gold)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 14 14" className={cls} aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="2.8" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.4" />
    </svg>
  );
}

// Fila de marcas: o estado de todos os documentos de um pedido, num relance
export function DocStrip({ states, label, className = "" }: { states: DocState[]; label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[3px] ${className}`} role="img" aria-label={label}>
      {states.map((s, i) => (
        <DocMark key={i} state={s} />
      ))}
    </span>
  );
}

// Ordem visual: recebidos, depois enviados, depois em falta (lê-se da esquerda para a direita como progresso)
export function orderStates(states: DocState[]): DocState[] {
  const rank: Record<DocState, number> = { received: 0, sent: 1, pending: 2 };
  return [...states].sort((a, b) => rank[a] - rank[b]);
}
