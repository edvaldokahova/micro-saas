import type { Metadata } from "next";
import Link from "next/link";
import { preload } from "react-dom";
import { HeroIntro } from "@/components/hero-intro";
import { FormatosMarquee } from "@/components/formatos-marquee";
import { PageMotion } from "@/components/page-motion";
import { WindowStory, type WindowTexts } from "@/components/story/window-story";
import { DocsArt, LinkArt, MonthArt } from "@/components/art";
import { FitStory } from "@/components/story/fit-story";
import { PhoneStory, type PhoneStoryTexts } from "@/components/story/phone-story";
import { PricingPlans } from "@/components/pricing";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fill, formatDate, formatPeriod, getDictionary, periodOf, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";
import { site } from "@/lib/site";
import { integrationTexts } from "@/lib/integration-texts";
import { StickyCta } from "@/components/sticky-cta";
import { homeJsonLd, jsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDictionary(await getLocale());
  return {
    title: d.home.metaTitle,
    description: d.home.metaDescription(site.trialDays),
    alternates: { canonical: "/" },
    openGraph: { url: "/", title: `${site.name} — ${d.home.metaTitle}`, description: d.home.metaDescription(site.trialDays) },
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
  // Logótipos do WhatsApp e do e-mail usados na demonstração: descarregados logo ao abrir a página,
  // para já estarem prontos quando o visitante chega à secção (são pequenos, não atrasam o resto)
  preload("/channels/whatsapp.webp", { as: "image", fetchPriority: "low" });
  preload("/channels/email.webp", { as: "image", fetchPriority: "low" });
  const locale = await getLocale();
  const d = getDictionary(locale);
  const h = d.home;
  const dl = d.common.deadline;

  // "Como funciona": o painel no portátil e a página do cliente no iPhone (dados fictícios)
  const clients = [...h.mock.clients, ...h.story.extraClients];
  const period = locale === "es-ES" ? periodOf("2026-07-01", locale, 3) : periodOf("2026-09-01", locale);
  const link = "docs.bilonai.com/p/q4hfp7k2mx9a";
  // Plano Escritório: as páginas dos clientes saem com o domínio do escritório
  const officeDomain = { "pt-PT": "docs.contabilidadesilva.pt", "pt-BR": "docs.contabilidadesilva.com.br", "es-ES": "docs.asesoriasilva.es" }[locale];
  const it = integrationTexts(locale);
  const ios = {
    "pt-PT": { cancel: "Cancelar", add: "Adicionar", photos: "Fotografias", recents: "Recentes", search: "Pesquisar", today: "Hoje" },
    "pt-BR": { cancel: "Cancelar", add: "Adicionar", photos: "Fotos", recents: "Recentes", search: "Buscar", today: "Hoje" },
    "es-ES": { cancel: "Cancelar", add: "Añadir", photos: "Fotos", recents: "Recientes", search: "Buscar", today: "Hoy" },
  };
  const message = (cliente: string, docs: string[], url: string = link) =>
    fill(d.app.whatsappTemplate, {
      cliente,
      periodo: period,
      lista: docs.map((l) => `• ${l}`).join("\n"),
      em_falta: docs.length === 1 ? d.autoEmail.missingOne : fill(d.autoEmail.missingMany, { n: String(docs.length) }),
      link: url,
      escritorio: h.demo.office,
    });
  const laptop: WindowTexts = {
    title: h.story.title,
    lead: h.story.lead,
    note: h.mockNote,
    chapters: h.story.chapters,
    art: <MonthArt month={h.mock.month} due={10} />,
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
        auto: d.app.settings.auto.title,
        channels: d.common.via,
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
        docsTitle: d.app.docs.title,
        docsHint: d.app.docs.hint,
        // Textos já prontos (funções não podem passar para a animação, que corre no navegador)
        filesCount: Array.from({ length: 7 }, (_, n) => d.app.docs.files(n)),
        zipCounts: Array.from({ length: 7 }, (_, n) => d.app.docs.zip(n)),
        // Dia e hora de chegada, no mesmo formato do painel (fuso do escritório)
        dates: ["2026-10-02T08:14:00Z", "2026-10-03T15:47:00Z", "2026-10-06T10:02:00Z", "2026-10-01T09:31:00Z", "2026-10-01T09:33:00Z", "2026-10-02T18:20:00Z"].map((iso) => {
          const tz = { timeZone: locale === "es-ES" ? "Europe/Madrid" : locale === "pt-BR" ? "America/Sao_Paulo" : "Europe/Lisbon" };
          const at = new Date(iso);
          return `${new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", ...tz }).format(at)}, ${new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false, ...tz }).format(at)}`;
        }),
        sizes: ["212 KB", "88 KB", "1.4 MB"],
        move: d.app.docs.move,
        drive: {
          title: it.title,
          lead: it.lead,
          desc: it.drive.desc,
          connect: it.drive.connect,
          connectedAs: it.drive.connectedAs.replace("{email}", locale === "es-ES" ? "asesoria.silva@gmail.com" : "contabilidade.silva@gmail.com"),
          auto: it.drive.auto,
          autoHint: it.drive.autoHint,
          sent: it.drive.sent.replace("{n}", "6"),
          privacy: it.drive.privacy,
          myDrive: locale === "pt-PT" ? "O meu disco" : locale === "pt-BR" ? "Meu Drive" : "Mi unidad",
          folder: "Bilonai",
        },
        months: [h.mock.month, locale === "es-ES" ? "2.º trimestre de 2026" : "Agosto de 2026"],
        zip: d.app.docs.zip(h.demo.docs.length),
        zipDone: `${clients[1].replace(/\s+/g, "_")}.zip`,
        filedBy: d.app.docs.by.ai,
        files: h.demo.files,
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
    art: <LinkArt link={`${officeDomain}/p/q4hf…`} labels={h.story.phone.art} />,
    phone: {
      office: h.demo.office,
      client: clients[1],
      preview: message(clients[1], h.demo.docs.slice(1), `${officeDomain}/p/q4hfp7k2mx9a`),
      via: d.common.via.whatsapp,
      now: h.story.phone.now,
      date: h.story.phone.date,
      link: officeDomain,
      locale,
      requestFrom: d.public.requestFrom,
      period: formatPeriod(locale === "es-ES" ? "2026-07-01" : "2026-09-01", locale, locale === "es-ES" ? 3 : 1),
      hello: d.public.hello(clients[1]),
      intro: d.public.intro(h.demo.office, period),
      step1: d.public.step1,
      step2: d.public.step2,
      uploadButton: d.public.uploadButton,
      uploadHint: d.public.uploadHint(h.demo.office),
      progress: [0, 1, 2, 3].map((n) => d.public.progress(n, 3)),
      allDone: d.public.allDone,
      docs: h.demo.docs,
      upload: d.public.uploadItem,
      more: d.public.uploadMore,
      received: d.public.received,
      fileOne: d.public.files(1),
      privateLink: d.public.privateLink,
      footer: d.public.footer(h.demo.office),
      sheet: h.demo.sheet as [string, string, string],
      ios: ios[locale],
      photo: h.demo.files[2],
      pdf: h.demo.files[1].replace(/\.\w+$/, ".pdf"),
      pdfOther: h.demo.files[0],
      pdfMeta: [`${ios[locale].today}, 09:12 · 212 KB`, `${ios[locale].today}, 08:47 · 1,1 MB`],
    },
  };

  return (
    <>
      <SiteHeader />
      {/* Dados estruturados: o que é, quem vende, preços e perguntas (Google e assistentes de IA) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(homeJsonLd(locale)) }} />
      <main className="overflow-x-clip">
        {/* Abertura: o título é a imagem; o cartão dos documentos mostra o resultado */}
        <section data-hero>
          <HeroIntro>
            <div className="relative mx-auto max-w-6xl px-5 pb-6 pt-16 text-center sm:pt-24">
              <h1 data-hero-title data-parallax="0.35" className="mx-auto max-w-[12ch] font-display text-[clamp(3.1rem,8.4vw,6.4rem)] lg:max-w-[18ch] leading-[0.93] tracking-[-0.045em]">
                {h.title}
              </h1>
              <div className="mt-9 flex flex-col items-center gap-9 md:mt-12">
                <p data-hero-rest className="max-w-[46ch] text-[18px] leading-[1.55] text-muted sm:text-[20px]">
                  {h.lead}
                </p>
                <div data-hero-rest className="flex flex-col items-center gap-3">
                  <Link href="/registar" data-magnetic data-hero-cta className="group btn btn-primary min-h-[3.5rem] !gap-4 py-1.5 pl-7 pr-1.5 text-[15.5px] font-semibold">
                    {h.ctaTime}
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-ivory" aria-hidden>
                      <svg data-cta-arrow width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-0.5"><path d="M3 9h12M10.5 4.5L15 9l-4.5 4.5" /></svg>
                    </span>
                  </Link>
                  <p className="text-[13.5px] text-muted">{h.finalText(site.trialDays)}</p>
                </div>
              </div>
              <div className="mt-14 sm:mt-16" data-hero-rest>
                <FormatosMarquee />
              </div>
              <div className="mt-12 sm:mt-14 flex justify-center" data-hero-rest>
                <DocsArt docs={h.demo.docs} client={clients[1]} labels={{ sent: d.public.sent, received: d.public.received }} />
              </div>
            </div>
          </HeroIntro>
        </section>

        {/* O problema, numa frase que acende à medida que se desce */}
        <section>
          <div className="mx-auto max-w-6xl px-5 py-28 sm:py-40">
            <p data-scrub className="mx-auto max-w-[24ch] text-center font-display text-[clamp(2rem,5.2vw,4.3rem)] leading-[1.06] tracking-[-0.035em]">
              {h.statement}
            </p>
          </div>
        </section>

        <WindowStory t={laptop} />
        <PhoneStory t={phone} />

        {/* Para quem é: sem portal para o cliente, sem ferramenta pesada para o escritório */}
        <FitStory t={h.fit} />

        {/* Preços */}
        <section id="precos" data-cta-zone className="scroll-mt-16 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-28 text-center sm:py-36">
            <h2 data-split="chars" className="mx-auto max-w-[16ch] font-display text-[clamp(2.2rem,5vw,3.9rem)] leading-[1.02]">{h.pricingTitle}</h2>
            <p data-split="lines" className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-[1.6] text-muted">{h.pricingLead(site.trialDays)}</p>
            <PricingPlans locale={locale} center />
          </div>
        </section>

        {/* Perguntas */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
            <h2 data-split="chars" className="text-center font-display text-[clamp(2.2rem,5vw,3.9rem)] leading-[1.02]">{h.faqTitle}</h2>
            <div className="mx-auto mt-12 max-w-3xl">
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
              <p className="mt-8 text-center text-[15px] text-muted">
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
        <section data-cta-zone className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-28 text-center sm:py-40">
            <h2 data-split="chars" className="mx-auto max-w-[14ch] font-display text-[clamp(2.6rem,7vw,5.6rem)] leading-[0.96] tracking-[-0.04em]">{h.finalTitle}</h2>
            <div className="mt-10 flex flex-col items-center gap-3">
              <Link href="/registar" data-magnetic className="group btn btn-primary btn-shine min-h-[3.5rem] !gap-4 py-1.5 pl-7 pr-1.5 text-[15.5px] font-semibold">
                {h.ctaTime}
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-ivory" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-0.5"><path d="M3 9h12M10.5 4.5L15 9l-4.5 4.5" /></svg>
                </span>
              </Link>
              <p className="text-[14px] text-muted">{h.finalText(site.trialDays)}</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <StickyCta label={h.ctaTime} />
      <PageMotion />
    </>
  );
}
