import type { Dictionary } from "@/lib/i18n";

// Estado de entrega de um pedido, a partir do prazo:
// entregue (tudo recebido) · atrasado (prazo vencido) · a terminar (3 dias ou menos) · pendente
export type Deadline = { kind: "delivered" | "late" | "soon" | "pending"; days: number | null };

const SOON_DAYS = 3;
const DAY = 86_400_000;

export function deadlineState(dueDate: string | null, complete: boolean, now = new Date()): Deadline {
  if (complete) return { kind: "delivered", days: null };
  if (!dueDate) return { kind: "pending", days: null };
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const due = Date.parse(`${dueDate.slice(0, 10)}T00:00:00Z`);
  const days = Math.round((due - today) / DAY);
  if (days < 0) return { kind: "late", days: -days };
  if (days <= SOON_DAYS) return { kind: "soon", days };
  return { kind: "pending", days };
}

// Rótulo curto (para o chip) e frase com o prazo
export function deadlineLabel(s: Deadline, d: Dictionary): { chip: string; detail: string | null } {
  const t = d.common.deadline;
  switch (s.kind) {
    case "delivered":
      return { chip: t.delivered, detail: null };
    case "late":
      return { chip: t.late, detail: t.lateBy(s.days ?? 0) };
    case "soon":
      return { chip: t.pending, detail: s.days === 0 ? t.dueToday : t.dueIn(s.days ?? 0) };
    default:
      return { chip: t.pending, detail: null };
  }
}

// Estados escritos como anotações de livro de registo: só a cor da tinta muda, sem fundos
export const deadlineTone: Record<Deadline["kind"], string> = {
  delivered: "text-ok",
  late: "text-bad",
  soon: "text-warn",
  pending: "text-muted",
};
// Classe tipográfica comum a todas as etiquetas de estado
export const statusText = "text-[12px] font-medium";

// Ordem no painel: atrasados primeiro, depois os que estão a terminar, pendentes e, por fim, entregues
export const deadlineOrder: Record<Deadline["kind"], number> = { late: 0, soon: 1, pending: 2, delivered: 3 };

// Prazo sugerido: dia 10 do mês seguinte ao período dos documentos,
// mas nunca no passado nem em cima da hora (no mínimo daqui a 5 dias)
export function suggestedDue(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const tenth = new Date(Date.UTC(y, m, 10));
  const now = new Date();
  const soonest = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 5));
  return (tenth < soonest ? soonest : tenth).toISOString().slice(0, 10);
}
