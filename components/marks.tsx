// Marcas de documento: o sistema de ícones próprio do Bilonai.
// □ em falta · ◪ enviado pelo cliente (por confirmar) · ■✓ recebido
// Desenhadas numa grelha de 14 px, com cantos quase retos, como as caixas de um livro de registo.
export type DocState = "pending" | "sent" | "received";

export function DocMark({ state, className = "h-3.5 w-3.5", animate = false }: { state: DocState; className?: string; animate?: boolean }) {
  const cls = `${className} shrink-0 ${animate ? "mark-in" : ""}`;
  if (state === "received") {
    return (
      <svg viewBox="0 0 14 14" className={cls} aria-hidden="true">
        <rect x="1" y="1" width="12" height="12" rx="1.2" fill="var(--color-ivory)" />
        <path d="M4 7.2l2 2 4-4.4" fill="none" stroke="var(--color-ink-2)" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
    );
  }
  if (state === "sent") {
    return (
      <svg viewBox="0 0 14 14" className={cls} aria-hidden="true">
        <rect x="1.5" y="1.5" width="11" height="11" rx="1" fill="none" stroke="var(--color-gold)" strokeWidth="1.3" />
        <path d="M12.5 1.5v11h-11z" fill="var(--color-gold)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 14 14" className={cls} aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="1" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.3" />
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
