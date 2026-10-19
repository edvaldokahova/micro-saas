import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Link2, ListChecks, MessageCircle, ShieldCheck } from "lucide-react";
import { Flag } from "@/components/flags";
import { HeroDemo, type DemoTexts } from "@/components/hero-demo";
import { NoCard } from "@/components/no-card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { formatPrice, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";
import { site, type PlanKey } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDictionary(await getLocale());
  return {
    title: d.home.metaTitle,
    description: d.home.metaDescription(site.trialDays),
    alternates: { canonical: "/" },
  };
}

const stepIcons = [ListChecks, Link2, MessageCircle];

export default async function Home() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const h = d.home;
  const plans = Object.keys(site.plans) as PlanKey[];

  // Textos da demonstração (só texto simples segue para o navegador)
  const dl = d.common.deadline;
  const demo: DemoTexts = {
    month: h.mock.month,
    officeView: h.demo.officeView,
    clientView: h.demo.clientView,
    live: h.demo.live,
    office: h.demo.office,
    clients: h.mock.clients,
    docs: h.demo.docs,
    statDelivered: d.app.dashboard.statComplete,
    statPending: d.app.dashboard.statMissing,
    statLate: d.app.dashboard.statLate,
    chipDelivered: dl.delivered,
    chipPending: dl.pending,
    chipLate: dl.late,
    dueIn2: dl.dueIn(2),
    lateBy3: dl.lateBy(3),
    docsOf: d.app.dashboard.docsOf(-1, -2).replace("-1", "{a}").replace("-2", "{b}"),
    awaiting: [1, 2, 3].map((n) => d.app.dashboard.awaiting(n)),
    hello: d.public.hello(h.mock.clients[1]),
    markSent: d.public.markSent,
    sent: d.public.sent,
    received: d.public.received,
    toast: h.demo.toast,
    confirmed: h.demo.confirmed,
    remind: h.mock.remind,
  };

  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip">
        {/* Herói */}
        <section className="relative">
          <div className="hero-glow" aria-hidden />
          <div className="grid-fade pointer-events-none absolute inset-0 -z-0 opacity-60" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
            <div>
              <p className="inline-flex animate-rise items-center gap-2.5 rounded-full border border-line bg-ink-2/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur">
                <Flag locale={locale} className="h-3 w-[18px]" />
                {h.badge}
              </p>
              <h1 className="mt-6 animate-rise font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight [animation-delay:80ms] sm:text-6xl">
                {h.titleA} <span className="text-gold-gradient">{h.titleHighlight}</span>
                {h.titleB}
              </h1>
              <p className="mt-6 max-w-xl animate-rise text-lg leading-8 text-muted [animation-delay:160ms]">{h.lead}</p>
              <div className="mt-9 flex animate-rise flex-wrap items-center gap-x-5 gap-y-3 [animation-delay:240ms]">
                <Link href="/registar" className="btn btn-primary px-6 py-3.5">
                  {d.common.trialFree(site.trialDays)} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <NoCard text={d.common.noCard} />
              </div>
              <dl className="mt-12 grid max-w-lg animate-rise grid-cols-3 gap-4 border-t border-line pt-6 [animation-delay:320ms]">
                {h.stats.map((s) => (
                  <div key={s.value}>
                    <dt className="font-display text-xl font-semibold sm:text-2xl">{s.value}</dt>
                    <dd className="mt-1 text-xs leading-5 text-muted">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Demonstração animada (dados fictícios) */}
            <div className="animate-rise [animation-delay:200ms]">
              <HeroDemo t={demo} />
              <p className="mt-4 text-center text-xs text-muted sm:text-right">{h.mockNote}</p>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="scroll-mt-16 border-t border-line/60 bg-ink-2/40">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <h2 className="reveal max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">{h.stepsTitle}</h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {h.steps.map((s, i) => {
                const Icon = stepIcons[i];
                return (
                  <div key={s.title} className="card reveal group p-7 transition duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-ink-3 transition group-hover:border-gold/50">
                        <Icon className="h-5 w-5 text-gold" aria-hidden />
                      </span>
                      <span className="font-display text-sm text-muted">0{i + 1}</span>
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-muted">{s.text}</p>
                  </div>
                );
              })}
            </div>
            <p className="reveal mt-10 flex items-start gap-2.5 text-sm text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              {h.safety}
            </p>
          </div>
        </section>

        {/* Preços */}
        <section id="precos" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-24">
          <h2 className="reveal font-display text-3xl font-semibold tracking-tight sm:text-4xl">{h.pricingTitle}</h2>
          <p className="reveal mt-3 max-w-2xl text-muted">{h.pricingLead(site.trialDays)}</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {plans.map((key) => {
              const p = site.plans[key];
              const featured = key === "office";
              return (
                <div
                  key={key}
                  className={`card reveal relative p-8 ${featured ? "border-gold/50 ring-1 ring-gold/25" : ""}`}
                >
                  {featured && (
                    <span className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-on-accent">
                      {h.popular}
                    </span>
                  )}
                  <h3 className="font-display text-lg font-semibold">{d.common.planNames[key]}</h3>
                  <p className="mt-5 flex items-baseline gap-1">
                    <span className="font-display text-5xl font-semibold tracking-tight">{formatPrice(locale, key)}</span>
                    <span className="text-muted">{d.common.perMonth}</span>
                  </p>
                  <p className="mt-2 text-sm text-muted">{d.common.upToClients(p.clientLimit)}</p>
                  <ul className="mt-7 space-y-3 text-[15px]">
                    {h.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-gold" aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/registar" className={`btn mt-9 w-full ${featured ? "btn-primary" : "btn-secondary"}`}>
                    {d.common.trialFree(site.trialDays)}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Perguntas */}
        <section className="border-t border-line/60">
          <div className="mx-auto max-w-3xl px-5 py-24">
            <h2 className="reveal font-display text-3xl font-semibold tracking-tight sm:text-4xl">{h.faqTitle}</h2>
            <div className="mt-10 divide-y divide-line border-y border-line">
              {h.faq(site.trialDays).map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-gold transition duration-300 group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 animate-fade leading-7 text-muted">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">
              {h.moreQuestions}{" "}
              <a className="text-gold hover:underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.
            </p>
          </div>
        </section>

        {/* Chamada final */}
        <section className="px-5 pb-24">
          <div className="card reveal relative mx-auto max-w-6xl overflow-hidden px-6 py-14 text-center sm:px-12">
            <div className="hero-glow opacity-70" aria-hidden />
            <h2 className="relative font-display text-3xl font-semibold tracking-tight sm:text-4xl">{h.finalTitle}</h2>
            <p className="relative mt-3 text-muted">{h.finalText(site.trialDays)}</p>
            <Link href="/registar" className="btn btn-primary relative mt-8 px-7 py-3.5">
              {d.common.trialFree(site.trialDays)} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
