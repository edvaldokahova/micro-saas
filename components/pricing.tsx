import Link from "next/link";
import { IconTick } from "@/components/icons";
import { IntervalToggle } from "@/components/interval-toggle";
import { formatMoney, formatPrice, formatYearlyPerMonth, getDictionary, localeMeta, type Locale } from "@/lib/i18n";
import { site, type PlanKey } from "@/lib/site";

// Os dois planos, com a escolha mensal/anual. Usado na página inicial e na página de preços.
export function PricingPlans({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const h = d.home;
  const plans = Object.keys(site.plans) as PlanKey[];
  const brl = localeMeta[locale].currency === "BRL";
  return (
    <IntervalToggle className="mt-10" labels={{ month: d.common.monthly, year: d.common.yearly, badge: d.common.twoMonthsFree }}>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {plans.map((key) => {
          const p = site.plans[key];
          const featured = key === "office";
          const monthly = brl ? p.priceBrl : p.priceEur;
          return (
            <div key={key} className={`flex flex-col rounded-3xl bg-ink-2 p-7 sm:p-9 ${featured ? "border-2 border-ivory" : "border border-line"}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[22px] font-semibold tracking-[-0.015em]">{d.common.planNames[key]}</h3>
                {featured && <span className="rounded-full bg-ivory px-3 py-1 text-[12px] font-medium text-ink">{h.popular}</span>}
              </div>
              <p className="mt-1.5 text-[15px] text-muted">{h.planFor[key]}</p>
              <div className="group-data-[interval=year]:hidden">
                <p className="mt-8 flex items-baseline gap-1.5">
                  <span className="figure text-[64px]">{formatPrice(locale, key)}</span>
                  <span className="text-muted">{d.common.perMonth}</span>
                </p>
                <p className="mt-1 text-[14px] text-muted">{h.perDay(formatMoney(locale, Math.round((monthly / 30) * 100) / 100))}</p>
              </div>
              <div className="hidden animate-fade group-data-[interval=year]:block">
                <p className="mt-8 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="figure text-[64px]">{formatYearlyPerMonth(locale, key)}</span>
                  <span className="text-muted">{d.common.perMonth}</span>
                </p>
                <p className="mt-1 text-[14px] text-muted">
                  <span className="line-through opacity-70">{formatMoney(locale, monthly * 12)}</span> {d.common.billedYearly(formatPrice(locale, key, "year"))}
                </p>
              </div>
              <p className="mt-7 text-[15px] leading-7">
                {d.common.upToClients(p.clientLimit)}
                <br />
                <span className="text-muted">{d.common.upToTeam(p.teamLimit)}</span>
              </p>
              <ul className="mt-6 space-y-3 border-t border-line pt-6 text-[15px]">
                {h.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <IconTick className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/registar" className={`btn mt-9 w-full min-h-[3rem] ${featured ? "btn-primary" : "btn-secondary"}`}>
                {d.common.trialFree(site.trialDays)}
              </Link>
            </div>
          );
        })}
      </div>
    </IntervalToggle>
  );
}
