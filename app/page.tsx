import type { Metadata } from "next";
import Link from "next/link";
import { IconTick } from "@/components/icons";
import { HeroIntro } from "@/components/hero-intro";
import { PageMotion } from "@/components/page-motion";
import { LaptopStory, type LaptopTexts } from "@/components/story/laptop-story";
import { PhoneStory, type PhoneStoryTexts } from "@/components/story/phone-story";
import { IntervalToggle } from "@/components/interval-toggle";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fill, formatDate, formatMoney, formatPrice, formatYearlyPerMonth, getDictionary, localeMeta, periodOf, type Locale } from "@/lib/i18n";
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

// Mais dois contactos fictícios para a lista de clientes da visita guiada
const tourPhones: Record<Locale, string[]> = {
  "pt-PT": ["+351 915 702 214", "+351 936 480 772"],
  "es-ES": ["+34 615 702 214", "+34 636 480 772"],
  "pt-BR": ["+55 11 91570-2214", "+55 21 93648-0772"],
};

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
  const dl = d.common.deadline;
  const brl = localeMeta[locale].currency === "BRL";

  // "Como funciona": o painel no portátil e a página do cliente no iPhone (dados fictícios)
  const clients = [...h.mock.clients, ...h.story.extraClients];
  const period = locale === "es-ES" ? periodOf("2026-07-01", locale, 3) : periodOf("2026-09-01", locale);
  const link = "entrega.bilonai.com/p/q4hfp7k2mx9a";
  const message = (cliente: string, docs: string[]) =>
    fill(d.app.whatsappTemplate, { cliente, periodo: period, lista: docs.map((l) => `• ${l}`).join("\n"), link, escritorio: h.demo.office });
  const laptop: LaptopTexts = {
    title: h.story.title,
    lead: h.story.lead,
    note: h.mockNote,
    chapters: h.story.chapters,
    desk: {
      office: h.demo.office,
      clients,
      phones: [...demoContacts[locale].map((c) => c.phone), ...tourPhones[locale]],
      docs: h.demo.docs,
      member: h.story.member,
      ui: {
        nav: d.app.nav,
        periodEyebrow: d.app.dashboard.periodEyebrow,
        month: h.mock.month,
        collected: d.app.dashboard.collectedIn(locale === "es-ES" ? "octubre de 2026" : "outubro de 2026"),
        newRequest: d.app.request.newTitle,
        stats: { requests: d.app.dashboard.statRequests, delivered: d.app.dashboard.statComplete, pending: d.app.dashboard.statMissing, late: d.app.dashboard.statLate },
        createAll: d.app.dashboard.createAll(5),
        createHint: d.app.dashboard.createAllHint,
        create: d.app.request.create,
        remind: d.app.remind,
        reminded: d.app.dashboard.reminders(1),
        copy: d.common.copy,
        pending: dl.pending,
        late: dl.lateBy(3),
        awaiting: d.app.dashboard.awaiting(1),
        delivered: dl.delivered,
        showDocs: d.app.dashboard.showDocs,
        confirm: d.app.dashboard.confirm,
        docStatus: d.app.request.status,
        to: h.story.to,
        send: h.story.send,
        message: message(clients[0], h.demo.docs.slice(1)),
        via: d.common.via.whatsapp,
        clientsTitle: d.app.clients.title,
        clientsCount: d.app.clients.count(6, site.plans.office.clientLimit),
        addClient: d.app.clients.add,
        name: d.app.clients.name,
        phone: d.app.clients.phone,
        archive: d.app.clients.archive,
        archived: d.app.clients.archived,
        unarchive: d.app.clients.unarchive,
        settingsTitle: d.app.settings.title,
        officeTitle: d.app.settings.office,
        teamTitle: d.app.team.title,
        teamHint: d.app.team.inviteHint,
        add: d.app.team.add,
        email: d.app.team.email,
        accessLabel: d.app.team.accessLabel,
        access: d.app.team.access,
        accessHint: d.app.team.accessHint,
        status: d.app.team.status,
        invitedFlash: d.app.team.invited(h.story.member.email),
      },
    },
  };
  const phone: PhoneStoryTexts = {
    title: h.story.phone.title,
    lead: h.story.phone.lead,
    chapters: h.story.phone.chapters,
    phone: {
      office: h.demo.office,
      client: clients[1],
      preview: message(clients[1], h.demo.docs.slice(2)),
      via: d.common.via.whatsapp,
      now: h.story.phone.now,
      date: h.story.phone.date,
      link: "entrega.bilonai.com",
      hello: d.public.hello(clients[1]),
      intro: d.public.intro(h.demo.office, period),
      due: d.public.due(formatDate("2026-10-30", locale, false)),
      progress: [d.public.progress(2, 3), d.public.progress(3, 3)],
      docs: h.demo.docs,
      markSent: d.public.markSent,
      howSent: d.public.howSent,
      vias: { whatsapp: d.common.via.whatsapp, email: d.common.via.email },
      sentVia: d.common.sentVia(d.common.via.email),
      received: d.public.received,
      pending: d.public.pending,
      thanks: h.story.phone.thanks,
    },
  };

  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip">
        {/* Abertura: o título é a imagem */}
        <section>
          <HeroIntro>
            <div className="mx-auto max-w-6xl px-5 pb-6 pt-16 sm:pt-28">
              <h1 data-hero-title data-parallax="0.35" className="max-w-[12ch] font-display text-[clamp(3.1rem,9.2vw,7.4rem)] leading-[0.93] tracking-[-0.045em]">
                {h.title}
              </h1>
              <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <p data-hero-rest className="max-w-[46ch] text-[18px] leading-[1.55] text-muted sm:text-[20px]">
                  {h.lead}
                </p>
                <div data-hero-rest className="flex flex-col items-start gap-3 md:items-end">
                  <Link href="/registar" data-magnetic className="btn btn-primary min-h-[3.25rem] px-7 text-[15px]">
                    {d.common.trialFree(site.trialDays)}
                  </Link>
                  <p className="text-[13.5px] text-muted">{d.common.noCard}</p>
                </div>
              </div>
            </div>
          </HeroIntro>
        </section>

        {/* O problema, numa frase que acende à medida que se desce */}
        <section>
          <div className="mx-auto max-w-6xl px-5 py-28 sm:py-40">
            <p data-scrub className="max-w-[24ch] font-display text-[clamp(2rem,5.2vw,4.3rem)] leading-[1.06] tracking-[-0.035em]">
              {h.statement}
            </p>
          </div>
        </section>

        <LaptopStory t={laptop} />
        <PhoneStory t={phone} />

        {/* Preços */}
        <section id="precos" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
            <h2 data-split="chars" className="max-w-[16ch] font-display text-[clamp(2.2rem,5vw,3.9rem)] leading-[1.02]">{h.pricingTitle}</h2>
            <p data-split="lines" className="mt-5 max-w-[56ch] text-[17px] leading-[1.6] text-muted">{h.pricingLead(site.trialDays)}</p>
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
          </div>
        </section>

        {/* Perguntas */}
        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-28 sm:py-36 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
            <h2 data-split="chars" className="font-display text-[clamp(2.2rem,5vw,3.9rem)] leading-[1.02]">{h.faqTitle}</h2>
            <div>
              <div className="divide-y divide-line border-y border-line">
                {h.faq(site.trialDays).map((f) => (
                  <details key={f.q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition duration-300 group-open:rotate-45" aria-hidden>
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 1.5v9M1.5 6h9" /></svg>
                      </span>
                    </summary>
                    <p className="mt-3 max-w-[60ch] animate-fade leading-7 text-muted">{f.a}</p>
                  </details>
                ))}
              </div>
              <p className="mt-8 text-[15px] text-muted">
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
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-28 sm:py-40">
            <h2 data-split="chars" className="max-w-[14ch] font-display text-[clamp(2.6rem,7vw,5.6rem)] leading-[0.96] tracking-[-0.04em]">{h.finalTitle}</h2>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/registar" data-magnetic className="btn btn-primary min-h-[3.25rem] px-7 text-[15px]">
                {d.common.trialFree(site.trialDays)}
              </Link>
              <p className="text-[14px] text-muted">{h.finalText(site.trialDays)}</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <PageMotion />
    </>
  );
}
