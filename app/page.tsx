import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Flag } from "@/components/flags";
import { HeroDemo, type DemoTexts } from "@/components/hero-demo";
import { MessagePreview } from "@/components/message-preview";
import { IntervalToggle } from "@/components/interval-toggle";
import { ValueEquation } from "@/components/value-equation";
import { NoCard } from "@/components/no-card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fill, formatMoney, formatPerDay, formatPrice, formatYearlyPerMonth, getDictionary, localeMeta, periodOf, type Locale } from "@/lib/i18n";
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

// Contactos fictícios para a demonstração (formato local de cada país)
const demoContacts: Record<Locale, { phone: string; email: string }[]> = {
  "pt-PT": [
    { phone: "+351 912 340 118", email: "geral@padarialobo.pt" },
    { phone: "+351 913 552 907", email: "geral@clinicasol.pt" },
    { phone: "+351 926 118 430", email: "marta.ribeiro@mail.pt" },
    { phone: "+351 934 210 665", email: "oficina@avenida.pt" },
  ],
  "es-ES": [
    { phone: "+34 612 340 118", email: "hola@panaderialobo.es" },
    { phone: "+34 613 552 907", email: "info@clinicasol.es" },
    { phone: "+34 626 118 430", email: "marta.ribera@correo.es" },
    { phone: "+34 634 210 665", email: "taller@avenida.es" },
  ],
  "pt-BR": [
    { phone: "+55 11 91234-0118", email: "contato@padarialobo.com.br" },
    { phone: "+55 21 98355-2907", email: "contato@clinicasol.com.br" },
    { phone: "+55 31 99611-8430", email: "marta.ribeiro@email.com.br" },
    { phone: "+55 41 99421-0665", email: "oficina@avenida.com.br" },
  ],
};

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
    contacts: demoContacts[locale],
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
    howSent: d.public.howSent,
    via: d.common.via,
    sentVia: d.common.sentVia("{canal}"),
  };

  // A mensagem que o cliente do escritório recebe, gerada pelo modelo real (dados fictícios).
  // Em Espanha o exemplo é trimestral, como a maioria dos pedidos de uma gestoria.
  const demoLink = "entrega.bilonai.com/p/k7m2x9qa4hfp";
  const demoPeriod = locale === "es-ES" ? periodOf("2026-07-01", locale, 3) : periodOf("2026-09-01", locale);
  const message = {
    ...h.message,
    office: h.demo.office,
    message: fill(d.app.whatsappTemplate, {
      cliente: h.mock.clients[2],
      periodo: demoPeriod,
      lista: h.demo.docs.slice(0, 2).map((l) => `• ${l}`).join("\n"),
      link: demoLink,
      escritorio: h.demo.office,
    }),
    link: demoLink,
    previewTitle: d.public.metaTitle(demoPeriod, h.demo.office),
    previewText: d.public.metaDescription(h.demo.office),
    note: h.mockNote,
  };

  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip">
        {/* Herói */}
        <section className="mx-auto grid max-w-6xl items-start gap-14 px-5 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.08fr_1fr] lg:gap-16 lg:pb-24">
          <div>
            <p className="mono-label inline-flex animate-rise items-center gap-2.5">
              <Flag locale={locale} className="h-2.5 w-4" />
              {h.badge}
            </p>
            <h1 className="mt-7 animate-rise font-display text-[2.9rem] leading-[1.02] [animation-delay:60ms] sm:text-[4.1rem]">
              {h.titleA} <em className="italic text-gold">{h.titleHighlight}</em>
              {h.titleB}
            </h1>
            <p className="mt-7 max-w-xl animate-rise text-[17.5px] leading-[1.7] text-ivory/80 [animation-delay:120ms]">{h.lead}</p>
            <div className="mt-9 flex animate-rise flex-wrap items-center gap-x-5 gap-y-3 [animation-delay:180ms]">
              <Link href="/registar" className="btn btn-primary min-h-[3.1rem] px-6">
                {d.common.trialFree(site.trialDays)} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <NoCard text={d.common.noCard} />
            </div>
            <dl className="mt-14 grid max-w-lg animate-rise grid-cols-3 border-t border-line [animation-delay:240ms]">
              {h.stats.map((s, i) => (
                <div key={s.value} className={`pt-4 ${i > 0 ? "border-l border-line pl-4" : "pr-4"}`}>
                  <dt className="figure text-[28px]">{s.value}</dt>
                  <dd className="mt-1 text-[13px] leading-5 text-muted">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Demonstração animada (dados fictícios) */}
          <div className="animate-rise [animation-delay:150ms] lg:pt-2">
            <HeroDemo t={demo} />
            <p className="mono-label mt-4 text-center sm:text-right">{h.mockNote}</p>
          </div>
        </section>

        {/* 01 · Como funciona */}
        <section id="como-funciona" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-y-6 px-5 py-24 lg:grid-cols-[120px_1fr]">
            <span className="mono-label pt-3 !text-gold">01</span>
            <div>
              <h2 className="reveal max-w-2xl font-display text-4xl leading-[1.08] sm:text-[46px]">{h.stepsTitle}</h2>
              <ol className="reveal double-rule mt-12 grid border-t border-ivory md:grid-cols-3">
                {h.steps.map((s, i) => (
                  <li key={s.title} className={`py-6 md:pr-8 ${i > 0 ? "border-t border-line md:border-l md:border-t-0 md:pl-8" : ""}`}>
                    <span className="mono-label">0{i + 1}</span>
                    <h3 className="mt-3 font-display text-[23px] leading-tight">{s.title}</h3>
                    <p className="mt-2.5 text-[15px] leading-7 text-ivory/75">{s.text}</p>
                  </li>
                ))}
              </ol>
              <p className="reveal mt-8 flex items-start gap-2.5 text-sm text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                {h.safety}
              </p>
            </div>
          </div>
        </section>

        {/* 02 · O que o cliente recebe */}
        <MessagePreview t={message} index="02" />

        {/* 03 · Equação de valor */}
        <ValueEquation
          index="03"
          t={{
            eyebrow: h.value.eyebrow,
            title: h.value.title,
            lead: h.value.lead,
            dream: h.value.dream,
            likelihood: h.value.likelihood,
            time: h.value.time,
            effort: h.value.effort,
            equals: h.value.equals,
            perDay: h.value.perDay(formatPerDay(locale)),
          }}
        />

        {/* 04 · Preços */}
        <section id="precos" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-y-6 px-5 py-24 lg:grid-cols-[120px_1fr]">
            <span className="mono-label pt-3 !text-gold">04</span>
            <div>
              <h2 className="reveal font-display text-4xl leading-[1.08] sm:text-[46px]">{h.pricingTitle}</h2>
              <p className="reveal mt-4 max-w-2xl text-muted">{h.pricingLead(site.trialDays)}</p>
              <IntervalToggle className="reveal mt-10" labels={{ month: d.common.monthly, year: d.common.yearly, badge: d.common.twoMonthsFree }}>
                <div className="mt-8 grid border-t border-ivory md:grid-cols-2">
                  {plans.map((key, idx) => {
                    const p = site.plans[key];
                    const featured = key === "office";
                    return (
                      <div key={key} className={`reveal flex flex-col py-8 md:px-8 ${idx === 0 ? "md:pl-0" : "border-t border-line md:border-l md:border-t-0"}`}>
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-display text-[28px] leading-none">{d.common.planNames[key]}</h3>
                          {featured && <span className="mono-label !text-gold">{h.popular}</span>}
                        </div>
                        <p className="mt-2 text-sm text-muted">{h.planFor[key]}</p>
                        {/* Mensal */}
                        <div className="group-data-[interval=year]:hidden">
                          <p className="mt-7 flex items-baseline gap-1.5">
                            <span className="figure text-[56px]">{formatPrice(locale, key)}</span>
                            <span className="text-muted">{d.common.perMonth}</span>
                          </p>
                          <p className="mt-1 h-5 text-sm text-muted" />
                        </div>
                        {/* Anual: equivalente mensal em destaque, total por ano por baixo */}
                        <div className="hidden animate-fade group-data-[interval=year]:block">
                          <p className="mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="figure text-[56px]">{formatYearlyPerMonth(locale, key)}</span>
                            <span className="text-muted">{d.common.perMonth}</span>
                            <span className="mono-label !text-ok">{d.common.twoMonthsFree}</span>
                          </p>
                          <p className="mt-1 h-5 text-sm text-muted">
                            <span className="line-through opacity-70">{formatMoney(locale, (localeMeta[locale].currency === "BRL" ? p.priceBrl : p.priceEur) * 12)}</span>{" "}
                            {d.common.billedYearly(formatPrice(locale, key, "year"))}
                          </p>
                        </div>
                        <dl className="double-rule mt-6 grid grid-cols-2 border-t border-line">
                          <div className="py-3">
                            <dt className="mono-label">{d.app.nav.clients}</dt>
                            <dd className="figure mt-1 text-2xl">{p.clientLimit}</dd>
                          </div>
                          <div className="border-l border-line py-3 pl-4">
                            <dt className="mono-label">{d.app.team.title}</dt>
                            <dd className="figure mt-1 text-2xl">{p.teamLimit}</dd>
                          </div>
                        </dl>
                        <ul className="mt-6 space-y-2.5 text-[15px]">
                          {h.features.map((f) => (
                            <li key={f} className="flex items-start gap-3">
                              <Check className="mt-1 h-4 w-4 shrink-0 text-gold" aria-hidden /> {f}
                            </li>
                          ))}
                        </ul>
                        <Link href="/registar" className={`btn mt-8 w-full ${featured ? "btn-primary" : "btn-secondary"}`}>
                          {d.common.trialFree(site.trialDays)}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </IntervalToggle>
            </div>
          </div>
        </section>

        {/* 05 · Perguntas */}
        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-y-6 px-5 py-24 lg:grid-cols-[120px_1fr]">
            <span className="mono-label pt-3 !text-gold">05</span>
            <div className="max-w-3xl">
              <h2 className="reveal font-display text-4xl leading-[1.08] sm:text-[46px]">{h.faqTitle}</h2>
              <div className="mt-10 divide-y divide-line border-y border-ivory">
                {h.faq(site.trialDays).map((f) => (
                  <details key={f.q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span className="font-mono text-lg text-muted transition duration-200 group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </summary>
                    <p className="mt-3 animate-fade leading-7 text-ivory/75">{f.a}</p>
                  </details>
                ))}
              </div>
              <p className="mt-8 text-sm text-muted">
                {h.moreQuestions}{" "}
                <a className="text-ivory underline decoration-line-strong underline-offset-4 hover:decoration-ivory" href={`mailto:${site.supportEmail}`}>
                  {site.supportEmail}
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Chamada final */}
        <section className="border-t border-ivory">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-20 md:flex-row md:items-end">
            <div>
              <h2 className="reveal max-w-2xl font-display text-4xl leading-[1.08] sm:text-[52px]">{h.finalTitle}</h2>
              <p className="reveal mt-4 text-muted">{h.finalText(site.trialDays)}</p>
            </div>
            <Link href="/registar" className="btn btn-primary reveal min-h-[3.1rem] shrink-0 px-7">
              {d.common.trialFree(site.trialDays)} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
