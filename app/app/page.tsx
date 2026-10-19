import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Sparkles, UserPlus } from "lucide-react";
import { CopyButton, ReminderButton, SubmitButton } from "@/components/app-buttons";
import { Flash } from "@/components/flash";
import { formatDate, formatPeriod } from "@/lib/i18n";
import { getSession, officeAccess, resolvePeriod, shiftPeriod } from "@/lib/office";
import { publicLink, reminderUrl } from "@/lib/reminder";
import { createMonthRequests } from "./actions";

export const metadata: Metadata = { title: "Painel" };

type Row = {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string | null;
  period: string;
  due_date: string | null;
  token: string;
  reminder_count: number;
  total_items: number;
  received_items: number;
  sent_items: number;
};

export default async function Painel({ searchParams }: { searchParams: Promise<{ mes?: string; criados?: string; erro?: string }> }) {
  const sp = await searchParams;
  const { supabase, office, locale, d } = await getSession();
  const t = d.app.dashboard;
  const period = resolvePeriod(sp.mes);
  const ym = period.slice(0, 7);
  const canWrite = officeAccess(office).canWrite;

  const [{ data: reqData }, { data: clientData }] = await Promise.all([
    supabase
      .from("requests_overview")
      .select("id, client_id, client_name, client_phone, period, due_date, token, reminder_count, total_items, received_items, sent_items")
      .eq("period", period),
    supabase.from("clients").select("id").is("archived_at", null),
  ]);
  const rows = (reqData ?? []) as Row[];
  const activeClients = (clientData ?? []).length;
  const withRequest = new Set(rows.map((r) => r.client_id));
  const withoutRequest = (clientData ?? []).filter((c: { id: string }) => !withRequest.has(c.id)).length;

  // Documentos ainda não recebidos de cada pedido (para a mensagem de WhatsApp)
  const pendingByRequest = new Map<string, string[]>();
  if (rows.length) {
    const { data: items } = await supabase
      .from("request_items")
      .select("request_id, label, status, position")
      .in("request_id", rows.map((r) => r.id))
      .eq("status", "pending")
      .order("position");
    for (const i of (items ?? []) as { request_id: string; label: string }[]) {
      pendingByRequest.set(i.request_id, [...(pendingByRequest.get(i.request_id) ?? []), i.label]);
    }
  }

  const isComplete = (r: Row) => r.total_items > 0 && r.received_items === r.total_items;
  rows.sort((a, b) => Number(isComplete(a)) - Number(isComplete(b)) || a.client_name.localeCompare(b.client_name, locale));
  const complete = rows.filter(isComplete).length;
  const awaiting = rows.reduce((s, r) => s + r.sent_items, 0);

  const stats = [
    { label: t.statRequests, value: rows.length },
    { label: t.statComplete, value: complete, tone: "text-ok" },
    { label: t.statMissing, value: rows.length - complete, tone: rows.length - complete ? "text-warn" : "" },
    { label: t.statAwaiting, value: awaiting, tone: awaiting ? "text-gold" : "" },
  ];

  return (
    <div>
      <Flash d={d} error={sp.erro} success={sp.criados ? t.created(Number(sp.criados) || 0) : null} />

      {/* Cabeçalho com navegação entre meses */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.title}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{formatPeriod(period, locale)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/app?mes=${shiftPeriod(period, -1)}`} className="btn btn-secondary btn-sm" aria-label={t.prev} title={t.prev}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
          <Link href={`/app?mes=${shiftPeriod(period, 1)}`} className="btn btn-secondary btn-sm" aria-label={t.next} title={t.next}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
          {canWrite && activeClients > 0 && (
            <Link href={`/app/pedidos/novo?mes=${ym}`} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" aria-hidden /> {d.app.request.newTitle}
            </Link>
          )}
        </div>
      </div>

      {activeClients === 0 && rows.length === 0 ? (
        <div className="card mt-10 animate-rise p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-line bg-ink-3">
            <UserPlus className="h-6 w-6 text-gold" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold">{t.noClientsTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted">{t.noClientsText}</p>
          <Link href="/app/clientes" className="btn btn-primary mt-6">
            {t.addClients}
          </Link>
        </div>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className="card animate-rise p-5" style={{ animationDelay: `${i * 60}ms` }}>
                <dt className="text-xs leading-5 text-muted">{s.label}</dt>
                <dd className={`mt-2 font-display text-3xl font-semibold ${s.tone ?? ""}`}>{s.value}</dd>
              </div>
            ))}
          </dl>

          {canWrite && withoutRequest > 0 && (
            <form action={createMonthRequests} className="card mt-5 flex animate-rise flex-wrap items-center justify-between gap-4 border-gold/30 p-5">
              <input type="hidden" name="period" value={ym} />
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                <div>
                  <p className="font-medium">{t.createAll(withoutRequest)}</p>
                  <p className="mt-1 text-sm text-muted">{t.createAllHint}</p>
                </div>
              </div>
              <SubmitButton pendingText="…">{d.app.request.create}</SubmitButton>
            </form>
          )}

          {rows.length === 0 ? (
            <p className="mt-10 text-center text-muted">{t.emptyPeriod}</p>
          ) : (
            <ul className="card mt-6 divide-y divide-line overflow-hidden">
              {rows.map((r, i) => {
                const done = isComplete(r);
                const pct = r.total_items ? Math.round((r.received_items / r.total_items) * 100) : 0;
                const pending = pendingByRequest.get(r.id) ?? [];
                const wa = done ? null : reminderUrl(office, locale, d, r, pending);
                return (
                  <li key={r.id} className="animate-rise px-4 py-4 sm:px-5" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                      <div className="min-w-0 flex-1 basis-56">
                        <div className="flex items-center gap-2.5">
                          <Link href={`/app/pedidos/${r.id}`} className="truncate font-medium hover:text-gold">
                            {r.client_name}
                          </Link>
                          {done ? (
                            <span className="shrink-0 rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-medium text-ok">{t.complete}</span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-warn/15 px-2 py-0.5 text-[11px] font-medium text-warn">
                              {t.missing(r.total_items - r.received_items)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink-3">
                          <div className={`bar-grow h-full rounded-full ${done ? "bg-ok" : "bg-gold"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted">
                          <span>{t.docsOf(r.received_items, r.total_items)}</span>
                          {r.sent_items > 0 && <span className="text-gold">{t.awaiting(r.sent_items)}</span>}
                          {r.due_date && <span>{t.dueOn(formatDate(r.due_date, locale, false))}</span>}
                          {r.reminder_count > 0 && <span>{t.reminders(r.reminder_count)}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {wa && <ReminderButton requestId={r.id} href={wa} label={d.app.remind} compact />}
                        <CopyButton value={publicLink(r.token)} label={d.common.copy} done={d.common.copied} compact />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
