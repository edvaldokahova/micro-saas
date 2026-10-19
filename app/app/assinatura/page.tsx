import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { ChangePlanButton, SubscribeButton } from "@/components/billing-buttons";
import { createClient } from "@/lib/supabase/server";
import { site, type PlanKey } from "@/lib/site";
import { openPortal } from "./actions";

export const metadata: Metadata = { title: "Assinatura", robots: { index: false } };
export const dynamic = "force-dynamic";

type Office = {
  name: string;
  locale: string;
  plan: string;
  plan_status: string;
  trial_ends_at: string;
  current_period_end: string | null;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });

export default async function Assinatura({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { ok, erro } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data } = await supabase
    .from("offices")
    .select("name, locale, plan, plan_status, trial_ends_at, current_period_end, paddle_subscription_id, paddle_customer_id")
    .maybeSingle();
  if (!data) redirect("/entrar");
  const office = data as Office;

  const live = !!office.paddle_subscription_id && ["active", "past_due"].includes(office.plan_status);
  const trialActive = office.plan_status === "trialing" && new Date(office.trial_ends_at) > new Date();
  const checkoutLocale = office.locale === "es-ES" ? "es" : "pt";
  const currentPlan = live && (office.plan === "starter" || office.plan === "office") ? (office.plan as PlanKey) : null;

  let status: { tone: "ok" | "warn" | "bad"; text: string };
  if (office.plan_status === "active" && currentPlan) {
    status = {
      tone: "ok",
      text: `Plano ${site.plans[currentPlan].name} ativo${office.current_period_end ? ` · próxima renovação a ${fmt(office.current_period_end)}` : ""}.`,
    };
  } else if (office.plan_status === "past_due") {
    status = { tone: "bad", text: "O último pagamento falhou. Atualize o método de pagamento para manter o acesso." };
  } else if (trialActive) {
    status = { tone: "warn", text: `Teste gratuito até ${fmt(office.trial_ends_at)}. Escolha um plano para continuar depois disso.` };
  } else if (office.plan_status === "trialing") {
    status = { tone: "bad", text: "O teste gratuito terminou. Escolha um plano para voltar a criar clientes e pedidos." };
  } else {
    status = { tone: "bad", text: "A assinatura terminou. Escolha um plano para reativar a conta." };
  }

  const toneClass = { ok: "border-ok/40 bg-ok/10 text-ok", warn: "border-warn/40 bg-warn/10 text-warn", bad: "border-bad/40 bg-bad/10 text-bad" }[status.tone];

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/app" aria-label="Painel">
          <Logo />
        </Link>
        <Link href="/app" className="text-sm text-muted hover:text-ivory">
          ← Painel
        </Link>
      </div>

      <h1 className="mt-10 font-display text-3xl font-semibold tracking-tight">Assinatura</h1>
      <p className="mt-1 text-muted">{office.name}</p>

      {ok && !live && (
        <p className="mt-6 rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm">
          Pagamento recebido. Estamos a confirmar com a Paddle; atualize esta página dentro de alguns segundos.
        </p>
      )}
      {erro === "portal" && (
        <p className="mt-6 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          Não foi possível abrir a gestão de pagamentos. Tente de novo ou escreva para {site.supportEmail}.
        </p>
      )}

      <p className={`mt-6 rounded-xl border px-4 py-3 text-sm ${toneClass}`}>{status.text}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {(Object.keys(site.plans) as PlanKey[]).map((key) => {
          const p = site.plans[key];
          const isCurrent = currentPlan === key;
          return (
            <div key={key} className={`rounded-2xl border p-6 ${isCurrent ? "border-gold/60 bg-ink-2" : "border-line"}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">{p.name}</h2>
                {isCurrent && <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs text-gold">Plano atual</span>}
              </div>
              <p className="mt-3">
                <span className="font-display text-3xl font-semibold">{p.priceEur} €</span>
                <span className="text-muted">/mês</span>
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                <Check className="h-4 w-4 text-gold" aria-hidden /> Até {p.clientLimit} clientes
              </p>
              <div className="mt-5">
                {isCurrent ? null : live ? (
                  <ChangePlanButton plan={key} label={`Mudar para ${p.name}`} />
                ) : (
                  <SubscribeButton plan={key} label={`Assinar ${p.name}`} locale={checkoutLocale} primary={key === "office"} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {office.paddle_customer_id && (
        <form action={openPortal} className="mt-8">
          <button className="rounded-xl border border-line px-5 py-2.5 text-sm transition hover:border-gold/60">
            Gerir pagamento, faturas ou cancelar
          </button>
        </form>
      )}

      <p className="mt-10 text-xs leading-6 text-muted">
        Os pagamentos são processados pela Paddle, Merchant of Record das nossas vendas. Os impostos são calculados no
        checkout. Pode pedir reembolso nos 14 dias seguintes a cada cobrança; veja{" "}
        <Link className="text-gold hover:underline" href="/reembolsos">
          Cancelamento e reembolsos
        </Link>
        .
      </p>
    </main>
  );
}
