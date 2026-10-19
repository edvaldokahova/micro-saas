import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { ChangePlanButton, SubscribeButton, type BillingTexts } from "@/components/billing-buttons";
import { formatDate, formatPrice, localeMeta } from "@/lib/i18n";
import { getSession } from "@/lib/office";
import { site, type PlanKey } from "@/lib/site";
import { openPortal } from "./actions";

export const metadata: Metadata = { title: "Assinatura" };

export default async function Assinatura({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { ok, erro } = await searchParams;
  const { office, locale, d } = await getSession();
  const t = d.app.billing;
  const plans = d.common.planNames;

  const live = !!office.paddle_subscription_id && ["active", "past_due"].includes(office.plan_status);
  const trialActive = office.plan_status === "trialing" && new Date(office.trial_ends_at) > new Date();
  const currentPlan = live && (office.plan === "starter" || office.plan === "office") ? (office.plan as PlanKey) : null;

  let status: { tone: "ok" | "warn" | "bad"; text: string };
  if (office.plan_status === "active" && currentPlan) {
    status = { tone: "ok", text: t.active(plans[currentPlan], office.current_period_end ? formatDate(office.current_period_end, locale) : null) };
  } else if (office.plan_status === "past_due") {
    status = { tone: "bad", text: d.app.banner.pastDue };
  } else if (trialActive) {
    status = { tone: "warn", text: t.trial(formatDate(office.trial_ends_at, locale)) };
  } else if (office.plan_status === "trialing") {
    status = { tone: "bad", text: d.app.banner.trialEnded };
  } else {
    status = { tone: "bad", text: d.app.banner.canceled };
  }
  const toneClass = { ok: "border-ok/40 bg-ok/10 text-ok", warn: "border-gold/40 bg-gold/10 text-gold", bad: "border-bad/40 bg-bad/10 text-bad" }[status.tone];

  // Só texto simples segue para o navegador
  const texts: BillingTexts = {
    opening: t.opening,
    changing: t.changing,
    changeConfirm: t.changeConfirm,
    changeSent: t.changeSent,
    openError: t.openError,
    errors: t.errors,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">{office.name}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>

      {ok && !live && <p className="mt-6 rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm">{t.received}</p>}
      {erro === "portal" && (
        <p className="mt-6 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">{t.portalError(site.supportEmail)}</p>
      )}

      <p className={`mt-6 rounded-xl border px-4 py-3 text-sm ${toneClass}`}>{status.text}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {(Object.keys(site.plans) as PlanKey[]).map((key) => {
          const p = site.plans[key];
          const isCurrent = currentPlan === key;
          return (
            <div key={key} className={`card p-6 ${isCurrent ? "border-gold/60 ring-1 ring-gold/25" : ""}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">{plans[key]}</h2>
                {isCurrent && <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs text-gold">{t.current}</span>}
              </div>
              <p className="mt-3">
                <span className="font-display text-3xl font-semibold">{formatPrice(locale, key)}</span>
                <span className="text-muted">{d.common.perMonth}</span>
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                <Check className="h-4 w-4 text-gold" aria-hidden /> {d.common.upToClients(p.clientLimit)}
              </p>
              <div className="mt-5">
                {isCurrent ? null : live ? (
                  <ChangePlanButton plan={key} label={t.change(plans[key])} t={texts} />
                ) : (
                  <SubscribeButton plan={key} label={t.subscribe(plans[key])} locale={localeMeta[locale].paddle} primary={key === "office"} t={texts} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {office.paddle_customer_id && (
        <form action={openPortal} className="mt-8">
          <button className="btn btn-secondary">{t.portal}</button>
        </form>
      )}

      <p className="mt-10 text-xs leading-6 text-muted">
        {t.note}{" "}
        <Link className="text-gold hover:underline" href="/reembolsos">
          {d.nav.refunds}
        </Link>
        .
      </p>
    </div>
  );
}
