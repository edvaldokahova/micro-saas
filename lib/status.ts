// Estado de um pedido face ao prazo. Calculado na hora (não fica guardado), por isso está sempre certo.
export type DeadlineState = "delivered" | "overdue" | "due_soon" | "pending";

export const DUE_SOON_DAYS = 3;

// Data de hoje em Lisboa/Madrid/São Paulo aproxima-se bem pelo dia UTC; prazos são só datas (sem hora)
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)) / 86_400_000);
}

// days: dias até ao prazo (negativo = dias de atraso); null sem prazo
export function deadlineState(
  total: number,
  received: number,
  due: string | null,
  today = todayISO(),
): { state: DeadlineState; days: number | null } {
  const days = due ? daysBetween(today, due) : null;
  if (total > 0 && received >= total) return { state: "delivered", days };
  if (days === null) return { state: "pending", days };
  if (days < 0) return { state: "overdue", days };
  if (days <= DUE_SOON_DAYS) return { state: "due_soon", days };
  return { state: "pending", days };
}

// Ordem no painel: o mais urgente primeiro
export const stateOrder: Record<DeadlineState, number> = { overdue: 0, due_soon: 1, pending: 2, delivered: 3 };

export const stateTone: Record<DeadlineState, string> = {
  delivered: "bg-ok/15 text-ok",
  overdue: "bg-bad/15 text-bad",
  due_soon: "bg-warn/15 text-warn",
  pending: "bg-ink-3 text-muted",
};

// Prazo sugerido: dia 10 do mês seguinte ao dos documentos
export function suggestedDue(periodYM: string): string {
  const [y, m] = periodYM.split("-").map(Number);
  return new Date(Date.UTC(y, m, 10)).toISOString().slice(0, 10);
}
