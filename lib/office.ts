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
};

const columns =
  "id, name, locale, plan, plan_status, trial_ends_at, current_period_end, paddle_subscription_id, paddle_customer_id, contact_phone, contact_email, upload_url, billing_interval, reminder_template";

// Sessão + escritório, uma só vez por pedido (o layout e a página partilham o resultado)
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data } = await supabase.from("offices").select(columns).maybeSingle();
  if (!data) redirect("/entrar");
  const office = data as Office;
  const locale: Locale = isLocale(office.locale) ? office.locale : "pt-PT";
  return { supabase, user, office, locale, d: getDictionary(locale) };
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

export function shiftPeriod(period: string, months: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 7);
}
