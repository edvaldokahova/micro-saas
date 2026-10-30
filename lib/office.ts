import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export type Office = {
  id: string;
  name: string;
  locale: string;
  plan: string;
  plan_status: string;
  trial_ends_at: string;
  current_period_end: string | null;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  upload_url: string | null;
  billing_interval: string | null;
  reminder_template: string | null;
  owner_id: string;
  auto_remind: boolean;
  auto_days_before: number;
  auto_repeat_days: number;
  auto_max: number;
  email_subject: string | null;
  email_message: string | null;
  inbox_key: string;
};

// Papel de quem está na sessão: dono da conta (paga a assinatura), administrador ou colaborador
export type Role = "owner" | "admin" | "member";

const columns =
  "id, name, locale, plan, plan_status, trial_ends_at, current_period_end, paddle_subscription_id, paddle_customer_id, contact_phone, contact_email, upload_url, billing_interval, reminder_template, owner_id, auto_remind, auto_days_before, auto_repeat_days, auto_max, email_subject, email_message, inbox_key";

// Sessão + escritório, uma só vez por pedido (o layout e a página partilham o resultado)
export const getSession = cache(async () => {
  const supabase = await createClient();
  // Utilizador e escritório em paralelo (a RLS já limita a consulta ao escritório da sessão)
  const [
    {
      data: { user },
    },
    { data },
  ] = await Promise.all([supabase.auth.getUser(), supabase.from("offices").select(columns).maybeSingle()]);
  if (!user) redirect("/entrar");
  if (!data) redirect("/entrar?erro=acesso");
  const office = data as Office;
  const locale: Locale = isLocale(office.locale) ? office.locale : "pt-PT";
  // Dono: sem consulta extra. Responsáveis: o acesso vem da equipa (a RLS aplica o mesmo na base de dados)
  let role: Role = "owner";
  let memberId: string | null = null;
  if (office.owner_id !== user.id) {
    const { data: m } = await supabase.from("team_members").select("id, access, joined_at").eq("user_id", user.id).maybeSingle();
    const member = m as { id: string; access: string; joined_at: string | null } | null;
    if (!member || (member.access !== "admin" && member.access !== "member")) redirect("/entrar?erro=acesso");
    role = member.access as Role;
    memberId = member.id;
    // Primeiro acesso depois do convite: o estado passa de "Convite enviado" a "Ativo"
    if (!member.joined_at) await supabase.rpc("mark_member_joined");
  }
  return { supabase, user, office, locale, role, memberId, isManager: role !== "member", d: getDictionary(locale) };
});

export type Access = { state: "trial" | "active" | "past_due" | "trial_ended" | "canceled"; daysLeft: number; canWrite: boolean };

// Mesmo critério da base de dados (private.office_is_active)
export function officeAccess(o: Office): Access {
  const msLeft = new Date(o.trial_ends_at).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));
  if (o.plan_status === "active") return { state: "active", daysLeft, canWrite: true };
  if (o.plan_status === "past_due") return { state: "past_due", daysLeft, canWrite: true };
  if (o.plan_status === "trialing") return msLeft > 0 ? { state: "trial", daysLeft, canWrite: true } : { state: "trial_ended", daysLeft: 0, canWrite: false };
  return { state: "canceled", daysLeft: 0, canWrite: false };
}

export function clientLimit(o: Office): number {
  return o.plan === "office" ? 60 : 20;
}

// "2026-09" -> "2026-09-01"; sem valor válido, o mês anterior (o que os escritórios costumam recolher)
export function resolvePeriod(value: string | undefined): string {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return `${value}-01`;
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 10);
}

// Pedidos trimestrais aparecem no painel no último mês do trimestre
export function isQuarterEnd(period: string): boolean {
  return [3, 6, 9, 12].includes(Number(period.slice(5, 7)));
}
export function quarterStart(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return `${y}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, "0")}-01`;
}
// Mês do painel onde o pedido aparece ("2026-07-01" com 3 meses -> "2026-09")
export function dashboardMonth(period: string, months: number): string {
  return months === 3 ? shiftPeriod(period, 2) : period.slice(0, 7);
}

export function shiftPeriod(period: string, months: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 7);
}
