import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { CalendarClock, FolderUp, Lock, Mail, MessageCircle, UserRound } from "lucide-react";
import { ProductMark, Wordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/preferences";
import { formatDate, formatPeriod, getDictionary, isLocale, periodOf, whatsappNumber, type Locale } from "@/lib/i18n";
import { deadlineLabel, deadlineState, deadlineTone, statusText } from "@/lib/deadline";
import { getLocale } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/server";
import { Checklist, type ChecklistTexts } from "./checklist";

export const dynamic = "force-dynamic";

type PublicRequest = {
  office_name: string;
  locale: string;
  client_name: string;
  office_phone: string | null;
  office_email: string | null;
  contact_name: string | null;
  upload_url: string | null;
  period: string;
  months: number | null;
  due_date: string | null;
  note: string | null;
  closed: boolean;
  items: { id: string; label: string; status: "pending" | "sent" | "received"; via: "whatsapp" | "email" | "other" | null }[];
};

// Links curtos (12) e antigos (32). Uma só consulta por visita: os metadados e a página partilham-na.
const loadRequest = cache(async (token: string): Promise<PublicRequest | null> => {
  if (!/^[A-Za-z0-9_-]{12}$|^[A-Za-z0-9_-]{32}$/.test(token)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_request", { p_token: token });
  return (data as PublicRequest | null) ?? null;
});

// Pré-visualização no WhatsApp/e-mail: nome do escritório e período, para o link não parecer suspeito.
// Não inclui o nome do cliente (a pré-visualização pode ser vista por terceiros).
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const req = await loadRequest(token);
  const robots = { index: false, follow: false };
  if (!req) return { title: "Bilonai Entrega", robots };
  const locale: Locale = isLocale(req.locale) ? req.locale : "pt-PT";
  const t = getDictionary(locale).public;
  const title = t.metaTitle(periodOf(req.period, locale, req.months ?? 1), req.office_name);
  const description = t.metaDescription(req.office_name);
  return {
    title: { absolute: title },
    description,
    robots,
    openGraph: { title, description, type: "website", siteName: req.office_name },
    twitter: { card: "summary", title, description },
  };
}

export default async function PaginaCliente({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const req = await loadRequest(token);

  // A página fala o idioma do escritório (é ele que conhece o cliente)
  const locale: Locale = req && isLocale(req.locale) ? req.locale : await getLocale();
  const d = getDictionary(locale);
  const t = d.public;

  if (!req) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <Lock className="h-8 w-8 text-gold" aria-hidden />
        <h1 className="mt-5 font-display text-2xl">{t.notFoundTitle}</h1>
        <p className="mt-2 text-muted">{t.notFoundText}</p>
      </main>
    );
  }

  const months = req.months ?? 1;
  const period = formatPeriod(req.period, locale, months);
  const ofPeriod = periodOf(req.period, locale, months);
  const wa = whatsappNumber(req.office_phone, locale);
  const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(t.waText(ofPeriod, req.client_name))}` : null;
  const canSend = !req.closed && Boolean(wa || req.office_email || (req.upload_url && /^https:\/\//.test(req.upload_url)));
  const initials = req.office_name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  const st = deadlineState(req.due_date, req.items.length > 0 && req.items.every((i) => i.status === "received"));
  const dl = deadlineLabel(st, d);
  const texts: ChecklistTexts = {
    markSent: t.markSent,
    sent: t.sent,
    received: t.received,
    pending: t.pending,
    undo: t.undo,
    allDone: t.allDone,
    error: t.error,
    progress: t.progress(-1, -2).replace("-1", "{a}").replace("-2", "{b}"),
    howSent: t.howSent,
    cancel: d.common.cancel,
    via: d.common.via,
    sentVia: d.common.sentVia("{canal}"),
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <main className="relative mx-auto max-w-xl px-5 pb-16 pt-8">
        {/* Remetente bem identificado: é a primeira coisa que o cliente procura num link que recebeu */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center border border-ivory font-display text-[15px]" aria-hidden>
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium leading-tight">{req.office_name}</p>
              <p className="mono-label mt-0.5 !text-[10px]">{t.requestFrom}</p>
            </div>
          </div>
          <ThemeToggle labels={{ light: d.common.themeLight, dark: d.common.themeDark }} />
        </div>

        <header className="mt-8 animate-rise">
          <p className="eyebrow">{period}</p>
          <h1 className="mt-3 font-display text-[2.3rem] leading-[1.08] sm:text-[2.7rem]">{t.hello(req.client_name)}</h1>
          <p className="mt-3 text-[15px] leading-7 text-muted">{t.intro(req.office_name, ofPeriod)}</p>
          {req.due_date && (
            <div className="double-rule mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line py-3">
              <span className="mono-label inline-flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {t.dueLabel}
              </span>
              <span className="text-right text-[15px] font-medium">
                {formatDate(req.due_date, locale)}
                {st.kind !== "pending" && <span className={`${statusText} block ${deadlineTone[st.kind]}`}>{dl.detail ?? dl.chip}</span>}
              </span>
            </div>
          )}
        </header>

        {req.note && <p className="card mt-6 animate-rise whitespace-pre-line p-4 text-sm leading-6 [animation-delay:80ms]">{req.note}</p>}

        {/* Passo 1: enviar os ficheiros (os botões já levam o destinatário e a identificação) */}
        {canSend && (
          <section className="mt-8 animate-rise [animation-delay:120ms]">
            <h2 className="flex items-baseline gap-2.5 font-display text-[22px]">
              <span className="font-mono text-[12px] text-gold">01</span> {t.step1}
            </h2>
            {req.contact_name && (
              <p className="mt-1 flex items-center gap-1.5 pl-[30px] text-sm text-muted">
                <UserRound className="h-4 w-4 text-gold" aria-hidden /> {t.yourContact(req.contact_name)}
              </p>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 [&_.btn]:min-h-[3.1rem]">
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <MessageCircle className="h-4 w-4" aria-hidden /> {t.sendWhatsapp}
                </a>
              )}
              {req.office_email && (
                <a
                  href={`mailto:${req.office_email}?subject=${encodeURIComponent(`${t.emailSubject(ofPeriod)} · ${req.client_name}`)}`}
                  className="btn btn-secondary"
                >
                  <Mail className="h-4 w-4" aria-hidden /> {t.sendEmail}
                </a>
              )}
              {req.upload_url && /^https:\/\//.test(req.upload_url) && (
                <a href={req.upload_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary sm:col-span-2">
                  <FolderUp className="h-4 w-4" aria-hidden /> {t.sendPortal}
                </a>
              )}
            </div>
          </section>
        )}

        {/* Passo 2: assinalar o que já foi enviado */}
        <section className={`${canSend ? "mt-10" : "mt-8"} animate-rise [animation-delay:180ms]`}>
          {canSend ? (
            <h2 className="mb-4 flex items-baseline gap-2.5 font-display text-[22px]">
              <span className="font-mono text-[12px] text-gold">02</span> {t.step2}
            </h2>
          ) : (
            <p className="mb-4 text-sm text-muted">{req.closed ? t.closed : t.instruction}</p>
          )}
          <Checklist token={token} initial={req.items} closed={req.closed} t={texts} />
        </section>

        <p className="mono-label mt-10 flex items-center justify-center gap-2 !text-[10px]">
          <Lock className="h-3 w-3" aria-hidden /> {t.privateLink}
        </p>

        <footer className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
          {t.footer(req.office_name)}
          <Link href="/" className="inline-flex items-center gap-1.5 text-ivory/80 hover:text-ivory">
            <Wordmark className="h-[10px] w-auto" /> <ProductMark className="!text-[15px]" />
          </Link>
        </footer>
      </main>
    </div>
  );
}
