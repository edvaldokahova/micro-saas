import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconTick } from "@/components/icons";
import { ChangePlanButton, SubscribeButton, type BillingTexts } from "@/components/billing-buttons";
import { formatDate, formatPrice, formatYearlyPerMonth, localeMeta } from "@/lib/i18n";
import { IntervalToggle } from "@/components/interval-toggle";
import { annualEnabled, type BillingInterval } from "@/lib/paddle/config";
import { getSession } from "@/lib/office";
import { site, type PlanKey } from "@/lib/site";
import { openPortal } from "./actions";

export const metadata: Metadata = { title: "Assinatura" };

export default async function Assinatura({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { ok, erro } = await searchParams;
  const { office, locale, d, role } = await getSession();
  if (role !== "owner") redirect("/app");
  const t = d.app.billing;
  const plans = d.common.planNames;

  const live = !!office.paddle_subscription_id && ["active", "past_due"].includes(office.plan_status);
  const trialActive = office.plan_status === "trialing" && new Date(office.trial_ends_at) > new Date();
  const currentPlan = live && (office.plan === "starter" || office.plan === "office") ? (office.plan as PlanKey) : null;
  const currentInterval: BillingInterval = office.billing_interval === "year" ? "year" : "month";
  const intervals: BillingInterval[] = annualEnabled ? ["month", "year"] : ["month"];

  let status: { tone: "ok" | "warn" | "bad"; text: string };
  if (office.plan_status === "active" && currentPlan) {
    status = { tone: "ok", text: t.active(`${plans[currentPlan]} ${d.common.intervalName[currentInterval]}`, office.current_period_end ? formatDate(office.current_period_end, locale) : null) };
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
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">{t.title}</h1>

      {ok && !live && <p className="mt-6 rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm">{t.received}</p>}
      {erro === "portal" && (
        <p className="mt-6 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">{t.portalError(site.supportEmail)}</p>
      )}

      <p className={`mt-6 rounded-xl border px-4 py-3 text-sm ${toneClass}`}>{status.text}</p>

      <IntervalToggle
        className="mt-8"
        initial={currentInterval}
        showControl={annualEnabled}
        labels={{ month: d.common.monthly, year: d.common.yearly, badge: d.common.twoMonthsFree }}
      >
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {(Object.keys(site.plans) as PlanKey[]).map((key) => {
            const p = site.plans[key];
            return (
              <div key={key} className="card p-6">
                <h2 className="font-display text-lg">{plans[key]}</h2>
                {intervals.map((iv) => {
                  const isCurrent = currentPlan === key && currentInterval === iv;
                  const label = iv === "year" ? `${plans[key]} ${d.common.intervalName.year}` : plans[key];
                  return (
                    <div key={iv} className={iv === "year" ? "hidden group-data-[interval=year]:block" : "group-data-[interval=year]:hidden"}>
                      <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
                        <span className="font-display text-3xl">
                          {iv === "year" ? formatYearlyPerMonth(locale, key) : formatPrice(locale, key)}
                        </span>
                        <span className="text-muted">{d.common.perMonth}</span>
                        {isCurrent && <span className="rounded-lg bg-gold/15 px-2.5 py-0.5 text-xs text-gold">{t.current}</span>}
                      </p>
                      <p className="mt-1 h-5 text-xs text-muted">{iv === "year" ? d.common.billedYearly(formatPrice(locale, key, "year")) : ""}</p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                        <IconTick className="h-4 w-4 text-gold" /> {d.common.upToClients(p.clientLimit)}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                        <IconTick className="h-4 w-4 text-gold" /> {d.common.upToTeam(p.teamLimit)}
                      </p>
                      <div className="mt-5">
                        {isCurrent ? null : live ? (
                          <ChangePlanButton plan={key} interval={iv} label={t.change(label)} t={texts} />
                        ) : (
                          <SubscribeButton
                            plan={key}
                            interval={iv}
                            label={t.subscribe(label)}
                            locale={localeMeta[locale].paddle}
                            primary={key === "office"}
                            t={texts}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </IntervalToggle>

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
