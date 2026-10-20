import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Inbox, Mail, Phone, Plus, Send, Sparkles, UserPlus } from "lucide-react";
import { ChannelIcon, isChannel, type Channel } from "@/components/channel-icon";
import { CopyButton, ReminderButton, SubmitButton } from "@/components/app-buttons";
import { Flash } from "@/components/flash";
import { formatDate, formatPeriod, periodOf } from "@/lib/i18n";
import { getSession, isQuarterEnd, officeAccess, quarterStart, resolvePeriod, shiftPeriod } from "@/lib/office";
import { deadlineLabel, deadlineOrder, deadlineState, deadlineTone, suggestedDue, type Deadline } from "@/lib/deadline";
import { publicLink, reminderUrl } from "@/lib/reminder";
import { createMonthRequests, setItemStatus } from "./actions";

export const metadata: Metadata = { title: "Painel" };

type Row = {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  period: string;
  due_date: string | null;
  token: string;
  reminder_count: number;
  last_reminder_at: string | null;
  months: number;
  total_items: number;
  received_items: number;
  sent_items: number;
};

// Filtros do painel: as duas tarefas diárias do escritório (lembrar e confirmar) e os estados de entrega
const filterKeys = ["remind", "awaiting", "late", "pending", "delivered"] as const;
type Filter = (typeof filterKeys)[number];
const REMIND_GAP_DAYS = 3;

export default async function Painel({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; criados?: string; erro?: string; resp?: string; f?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, office, locale, d } = await getSession();
  const t = d.app.dashboard;
  const period = resolvePeriod(sp.mes);
  const ym = period.slice(0, 7);
  const canWrite = officeAccess(office).canWrite;
  const filter = filterKeys.find((k) => k === sp.f) as Filter | undefined;
  // No último mês de cada trimestre, o painel junta os pedidos trimestrais desse trimestre
  const quarterEnd = isQuarterEnd(period);
  const qStart = quarterStart(period);
  const periodFilter = quarterEnd
    ? `and(period.eq.${period},months.eq.1),and(period.eq.${qStart},months.eq.3)`
    : `and(period.eq.${period},months.eq.1)`;

  // Quatro consultas em paralelo
  const [{ data: reqData }, { data: clientData }, { data: teamData }, { data: items }] = await Promise.all([
    supabase
      .from("requests_overview")
      .select(
        "id, client_id, client_name, client_phone, client_email, assignee_id, assignee_name, period, months, due_date, token, reminder_count, last_reminder_at, total_items, received_items, sent_items",
      )
      .or(periodFilter),
    supabase.from("clients").select("id, cadence").is("archived_at", null),
    supabase.from("team_members").select("id, name").order("name"),
    // Documentos em falta ou enviados deste mês (para a mensagem de WhatsApp e os canais)
    supabase
      .from("request_items")
      .select("id, request_id, label, status, sent_via, client_marked_at, position, requests!inner(period, months)")
      .or(periodFilter, { referencedTable: "requests" })
      .order("position"),
  ]);
  const team = (teamData ?? []) as { id: string; name: string }[];
  const resp = team.some((m) => m.id === sp.resp) ? sp.resp : undefined;
  const allRows = (reqData ?? []) as Row[];
  const byPerson = resp ? allRows.filter((r) => r.assignee_id === resp) : allRows;
  const clients = (clientData ?? []) as { id: string; cadence: string }[];
  const activeClients = clients.length;
  const withRequest = new Set(allRows.map((r) => r.client_id));
  // Clientes que deviam ter pedido neste painel: os mensais e, no fim do trimestre, os trimestrais
  const withoutRequest = clients.filter((c) => (c.cadence !== "quarterly" || quarterEnd) && !withRequest.has(c.id)).length;
  const hasQuarterly = allRows.some((r) => r.months === 3);

  const pendingByRequest = new Map<string, string[]>();
  const viasByRequest = new Map<string, Channel[]>();
  // e a lista completa de cada pedido (para ver documento a documento por onde chegou)
  type Doc = { id: string; request_id: string; label: string; status: "pending" | "sent" | "received"; sent_via: string | null; client_marked_at: string | null };
  const docsByRequest = new Map<string, Doc[]>();
  for (const i of (items ?? []) as Doc[]) {
    docsByRequest.set(i.request_id, [...(docsByRequest.get(i.request_id) ?? []), i]);
    if (i.status === "pending") pendingByRequest.set(i.request_id, [...(pendingByRequest.get(i.request_id) ?? []), i.label]);
    else if (i.status === "sent" && isChannel(i.sent_via)) viasByRequest.set(i.request_id, [...(viasByRequest.get(i.request_id) ?? []), i.sent_via]);
  }

  const isComplete = (r: Row) => r.total_items > 0 && r.received_items === r.total_items;
  const state = new Map<string, Deadline>(byPerson.map((r) => [r.id, deadlineState(r.due_date, isComplete(r))]));
  const kindOf = (r: Row) => state.get(r.id)!.kind;
  // Por lembrar: atrasado ou com o prazo a terminar, com telemóvel, sem lembrete nos últimos dias
  const remindCutoff = Date.now() - REMIND_GAP_DAYS * 86_400_000;
  const needsReminder = (r: Row) =>
    (kindOf(r) === "late" || kindOf(r) === "soon") &&
    Boolean(r.client_phone) &&
    (!r.last_reminder_at || Date.parse(r.last_reminder_at) < remindCutoff);
  const matches: Record<Filter, (r: Row) => boolean> = {
    remind: needsReminder,
    awaiting: (r) => r.sent_items > 0,
    late: (r) => kindOf(r) === "late",
    pending: (r) => kindOf(r) === "pending" || kindOf(r) === "soon",
    delivered: (r) => kindOf(r) === "delivered",
  };
  const toRemind = byPerson.filter(needsReminder).length;
  const toConfirm = byPerson.reduce((acc, r) => acc + r.sent_items, 0);
  const rows = filter ? byPerson.filter(matches[filter]) : [...byPerson];
  rows.sort(
    (a, b) =>
      deadlineOrder[kindOf(a)] - deadlineOrder[kindOf(b)] ||
      (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
      a.client_name.localeCompare(b.client_name, locale),
  );
  const count = (k: Deadline["kind"]) => byPerson.filter((r) => kindOf(r) === k).length;
  const delivered = count("delivered");
  const late = count("late");
  const open = byPerson.length - delivered - late;

  // Os números são também filtros (clicar de novo limpa)
  const base = `/app?mes=${ym}${resp ? `&resp=${resp}` : ""}`;
  const href = (f?: Filter) => (f && f !== filter ? `${base}&f=${f}` : base);
  const stats: { label: string; value: number; tone?: string; f?: Filter }[] = [
    { label: t.statRequests, value: byPerson.length },
    { label: t.statComplete, value: delivered, tone: "text-ok", f: "delivered" },
    { label: t.statMissing, value: open, tone: open ? "text-warn" : "", f: "pending" },
    { label: t.statLate, value: late, tone: late ? "text-bad" : "", f: "late" },
  ];

  return (
    <div>
      <Flash d={d} error={sp.erro} success={sp.criados ? t.created(Number(sp.criados) || 0) : null} />

      {/* Cabeçalho com navegação entre meses */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.title}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{formatPeriod(period, locale)}</h1>
          {hasQuarterly && <p className="mt-1.5 text-sm text-muted">{t.quarterlyIncluded(periodOf(qStart, locale, 3))}</p>}
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
          {team.length > 0 && (
            <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label={d.app.team.assignee}>
              {[{ id: "", name: d.app.team.all }, ...team].map((m) => {
                const active = (resp ?? "") === m.id;
                return (
                  <Link
                    key={m.id || "all"}
                    href={`/app?mes=${ym}${m.id ? `&resp=${m.id}` : ""}`}
                    className={`rounded-full border px-3.5 py-1.5 transition ${active ? "border-gold bg-gold/10 text-ivory" : "border-line text-muted hover:text-ivory"}`}
                  >
                    {m.name}
                  </Link>
                );
              })}
            </nav>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s, i) => {
              const active = s.f ? filter === s.f : !filter;
              return (
                <Link
                  key={s.label}
                  href={href(s.f)}
                  aria-current={active ? "true" : undefined}
                  className={`card animate-rise p-5 transition hover:border-gold/40 ${active && filter ? "border-gold/60 ring-1 ring-gold/20" : ""}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <dt className="text-xs leading-5 text-muted">{s.label}</dt>
                  <dd className={`mt-2 font-display text-3xl font-semibold tabular-nums ${s.tone ?? ""}`}>{s.value}</dd>
                </Link>
              );
            })}
          </dl>

          {/* Próximas ações: o que o escritório tem de fazer hoje, sem procurar */}
          {byPerson.length > 0 && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {toRemind > 0 || toConfirm > 0 ? (
                <>
                  {toRemind > 0 && (
                    <Link
                      href={href("remind")}
                      className={`card flex items-start gap-3 p-4 transition hover:border-gold/40 ${filter === "remind" ? "border-gold/60 ring-1 ring-gold/20" : ""}`}
                    >
                      <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-bad" aria-hidden />
                      <span>
                        <span className="block font-medium">{t.nextRemind(toRemind)}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted">{t.nextRemindHint}</span>
                      </span>
                    </Link>
                  )}
                  {toConfirm > 0 && (
                    <Link
                      href={href("awaiting")}
                      className={`card flex items-start gap-3 p-4 transition hover:border-gold/40 ${filter === "awaiting" ? "border-gold/60 ring-1 ring-gold/20" : ""}`}
                    >
                      <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                      <span>
                        <span className="block font-medium">{t.nextConfirm(toConfirm)}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted">{t.nextConfirmHint}</span>
                      </span>
                    </Link>
                  )}
                </>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
                  <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden /> {t.allClear}
                </p>
              )}
            </div>
          )}

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
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="label">{d.app.request.due}</span>
                  <input name="due" type="date" defaultValue={suggestedDue(period)} className="field py-2" />
                </label>
                <SubmitButton pendingText="…">{d.app.request.create}</SubmitButton>
              </div>
            </form>
          )}

          {rows.length === 0 ? (
            <p className="mt-10 text-center text-muted">
              {filter ? (
                <>
                  {t.filterEmpty}{" "}
                  <Link href={href()} className="text-gold hover:underline">
                    {t.filters.all}
                  </Link>
                </>
              ) : (
                t.emptyPeriod
              )}
            </p>
          ) : (
            <ul className="card mt-6 divide-y divide-line overflow-hidden">
              {rows.map((r, i) => {
                const done = isComplete(r);
                const st = state.get(r.id)!;
                const dl = deadlineLabel(st, d);
                const pct = r.total_items ? Math.round((r.received_items / r.total_items) * 100) : 0;
                const pending = pendingByRequest.get(r.id) ?? [];
                const wa = done ? null : reminderUrl(office, locale, d, r, pending);
                const docs = docsByRequest.get(r.id) ?? [];
                return (
                  <li key={r.id} className="animate-rise px-4 py-4 sm:px-5" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                      <div className="min-w-0 flex-1 basis-56">
                        <div className="flex items-center gap-2.5">
                          <Link href={`/app/pedidos/${r.id}`} className="truncate font-medium hover:text-gold">
                            {r.client_name}
                          </Link>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${deadlineTone[st.kind]}`}>{dl.chip}</span>
                          {r.months === 3 && (
                            <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">{d.common.cadence.quarterly}</span>
                          )}
                          {r.assignee_name && !resp && (
                            <span className="hidden shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted sm:inline">{r.assignee_name}</span>
                          )}
                        </div>
                        {(r.client_phone || r.client_email) && (
                          <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                            {r.client_phone && (
                              <a href={`tel:${r.client_phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-ivory">
                                <Phone className="h-3 w-3" aria-hidden /> {r.client_phone}
                              </a>
                            )}
                            {r.client_email && (
                              <a href={`mailto:${r.client_email}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-ivory">
                                <Mail className="h-3 w-3 shrink-0" aria-hidden /> <span className="truncate">{r.client_email}</span>
                              </a>
                            )}
                          </p>
                        )}
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink-3">
                          <div
                            className={`bar-grow h-full rounded-full ${done ? "bg-ok" : st.kind === "late" ? "bg-bad" : "bg-gold"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted">
                          <span>{t.docsOf(r.received_items, r.total_items)}</span>
                          {dl.detail && <span className={st.kind === "late" ? "text-bad" : "text-warn"}>{dl.detail}</span>}
                          {r.sent_items > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-gold">
                              {t.awaiting(r.sent_items)}
                              {(viasByRequest.get(r.id) ?? []).map((v, k) => (
                                <ChannelIcon key={k} via={v} className="h-3 w-3" />
                              ))}
                            </span>
                          )}
                          {r.due_date && !dl.detail && !done && <span>{t.dueOn(formatDate(r.due_date, locale, false))}</span>}
                          {r.reminder_count > 0 && <span>{t.reminders(r.reminder_count)}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {wa && <ReminderButton requestId={r.id} href={wa} label={d.app.remind} compact />}
                        <CopyButton value={publicLink(r.token)} label={d.common.copy} done={d.common.copied} compact />
                      </div>
                    </div>

                    {/* Documento a documento: estado, por onde chegou e quando */}
                    {docs.length > 0 && (
                      <details className="group/docs mt-2" open={filter === "awaiting" && r.sent_items > 0}>
                        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted transition hover:text-ivory [&::-webkit-details-marker]:hidden">
                          {t.showDocs}
                          <ChevronDown className="h-3.5 w-3.5 transition group-open/docs:rotate-180" aria-hidden />
                        </summary>
                        <ul className="mt-2.5 grid animate-fade gap-1.5 sm:grid-cols-2">
                          {docs.map((doc) => (
                            <li key={doc.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-ink/40 px-3 py-2 text-[13px]">
                              {doc.status === "received" ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" aria-hidden />
                              ) : doc.status === "sent" ? (
                                <Send className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                              ) : (
                                <Circle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                              )}
                              <span className="min-w-0 flex-1 truncate">{doc.label}</span>
                              {doc.status !== "pending" && isChannel(doc.sent_via) ? (
                                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted" title={doc.client_marked_at ? formatDate(doc.client_marked_at, locale) : undefined}>
                                  <ChannelIcon via={doc.sent_via} className="h-3.5 w-3.5" />
                                  {d.common.via[doc.sent_via]}
                                  {doc.client_marked_at && <span className="hidden sm:inline">· {formatDate(doc.client_marked_at, locale, false)}</span>}
                                </span>
                              ) : (
                                <span className="shrink-0 text-[11px] text-muted">{d.app.request.status[doc.status]}</span>
                              )}
                              {/* Confirmar aqui mesmo o que o cliente diz ter enviado */}
                              {doc.status === "sent" && canWrite && (
                                <form action={setItemStatus} className="shrink-0">
                                  <input type="hidden" name="item" value={doc.id} />
                                  <input type="hidden" name="request" value={r.id} />
                                  <input type="hidden" name="status" value="received" />
                                  <SubmitButton className="btn btn-primary btn-sm px-2.5 py-1 text-[11px]" pendingText="…">
                                    {t.confirm}
                                  </SubmitButton>
                                </form>
                              )}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
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
