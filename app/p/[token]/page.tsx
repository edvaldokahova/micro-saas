import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Lock, Mail, MessageCircle } from "lucide-react";
import { ProductMark, Wordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/preferences";
import { formatDate, formatPeriod, getDictionary, isLocale, whatsappNumber, type Locale } from "@/lib/i18n";
import { deadlineLabel, deadlineState, deadlineTone } from "@/lib/deadline";
import { getLocale } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/server";
import { Checklist, type ChecklistTexts } from "./checklist";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Documentos", robots: { index: false, follow: false } };

type PublicRequest = {
  office_name: string;
  locale: string;
  client_name: string;
  office_phone: string | null;
  office_email: string | null;
  period: string;
  due_date: string | null;
  note: string | null;
  closed: boolean;
  items: { id: string; label: string; status: "pending" | "sent" | "received" }[];
};

export default async function PaginaCliente({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = token.length === 32 ? await supabase.rpc("get_public_request", { p_token: token }) : { data: null };
  const req = data as PublicRequest | null;

  // A página fala o idioma do escritório (é ele que conhece o cliente)
  const locale: Locale = req && isLocale(req.locale) ? req.locale : await getLocale();
  const d = getDictionary(locale);
  const t = d.public;

  if (!req) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <Lock className="h-8 w-8 text-gold" aria-hidden />
        <h1 className="mt-5 font-display text-2xl font-semibold">{t.notFoundTitle}</h1>
        <p className="mt-2 text-muted">{t.notFoundText}</p>
      </main>
    );
  }

  const period = formatPeriod(req.period, locale);
  const wa = whatsappNumber(req.office_phone, locale);
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
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div className="hero-glow opacity-70" aria-hidden />
      <main className="relative mx-auto max-w-xl px-5 pb-16 pt-8">
        <div className="flex items-center justify-between">
          <span className="truncate font-display text-sm font-semibold">{req.office_name}</span>
          <ThemeToggle labels={{ light: d.common.themeLight, dark: d.common.themeDark }} />
        </div>

        <header className="mt-10 animate-rise">
          <p className="eyebrow">{period}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{t.hello(req.client_name)}</h1>
          <p className="mt-3 text-[15px] leading-7 text-muted">{t.intro(req.office_name, period)}</p>
          {req.due_date && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-2 px-3.5 py-1.5 text-sm">
                <CalendarClock className="h-4 w-4 text-gold" aria-hidden /> {t.due(formatDate(req.due_date, locale))}
              </p>
              {st.kind !== "pending" && (
                <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${deadlineTone[st.kind]}`}>{dl.detail ?? dl.chip}</span>
              )}
            </div>
          )}
        </header>

        {req.note && <p className="card mt-6 animate-rise whitespace-pre-line p-4 text-sm leading-6 [animation-delay:80ms]">{req.note}</p>}

        <section className="mt-8 animate-rise [animation-delay:120ms]">
          {req.closed ? (
            <p className="mb-4 text-sm text-muted">{t.closed}</p>
          ) : (
            <p className="mb-4 text-sm text-muted">{t.instruction}</p>
          )}
          <Checklist token={token} initial={req.items} closed={req.closed} t={texts} />
        </section>

        {(wa || req.office_email) && !req.closed && (
          <section className="card mt-8 animate-rise p-5 [animation-delay:200ms]">
            <h2 className="font-display text-base font-semibold">{t.sendTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {wa && (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <MessageCircle className="h-4 w-4" aria-hidden /> {t.sendWhatsapp}
                </a>
              )}
              {req.office_email && (
                <a
                  href={`mailto:${req.office_email}?subject=${encodeURIComponent(`${t.emailSubject(period)} · ${req.client_name}`)}`}
                  className="btn btn-secondary"
                >
                  <Mail className="h-4 w-4" aria-hidden /> {t.sendEmail}
                </a>
              )}
            </div>
          </section>
        )}

        <footer className="mt-14 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
          <Lock className="h-3.5 w-3.5" aria-hidden /> {t.footer(req.office_name)}
          <Link href="/" className="inline-flex items-center gap-1.5 text-ivory/80 hover:text-ivory">
            <Wordmark className="h-[11px] w-auto" /> <ProductMark className="scale-90" />
          </Link>
        </footer>
      </main>
    </div>
  );
}
