import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, UserPlus } from "lucide-react";
import { DocMark, DocStrip, orderStates } from "@/components/marks";
import { ChannelIcon, isChannel, type Channel } from "@/components/channel-icon";
import { CopyButton, ReminderButton, SubmitButton } from "@/components/app-buttons";
import { ListSearch } from "@/components/list-search";
import { Flash } from "@/components/flash";
import { formatDate, formatPeriod, periodOf } from "@/lib/i18n";
import { getSession, isQuarterEnd, officeAccess, quarterStart, resolvePeriod, shiftPeriod } from "@/lib/office";
import { deadlineLabel, deadlineOrder, deadlineState, deadlineTone, statusText, suggestedDue, type Deadline } from "@/lib/deadline";
import { publicLink, reminderMailto, reminderUrl } from "@/lib/reminder";
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
  const { supabase, office, locale, d, isManager } = await getSession();
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
  // Por lembrar: atrasado ou com o prazo a terminar, com telemóvel ou e-mail, sem lembrete nos últimos dias
  const remindCutoff = Date.now() - REMIND_GAP_DAYS * 86_400_000;
  const needsReminder = (r: Row) =>
    (kindOf(r) === "late" || kindOf(r) === "soon") &&
    Boolean(r.client_phone || r.client_email) &&
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

      {/* Cabeçalho do período, como o topo de uma folha de registo */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.periodEyebrow}</p>
          <h1 className="mt-2 font-display text-[2.4rem] leading-none sm:text-5xl">{formatPeriod(period, locale)}</h1>
          {/* Em outubro recolhem-se os documentos de setembro: dizê-lo evita a dúvida "porque não está no mês atual?" */}
          <p className="mt-2.5 text-sm text-muted">
            {t.collectedIn(formatPeriod(`${shiftPeriod(period, 1)}-01`, locale).toLowerCase())}
            {hasQuarterly && <> · {t.quarterlyIncluded(periodOf(qStart, locale, 3))}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/app?mes=${shiftPeriod(period, -1)}`} className="btn btn-secondary btn-sm w-9 px-0" aria-label={t.prev} title={t.prev}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
          <Link href={`/app?mes=${shiftPeriod(period, 1)}`} className="btn btn-secondary btn-sm w-9 px-0" aria-label={t.next} title={t.next}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
          {canWrite && activeClients > 0 && (
            <Link href={`/app/pedidos/novo?mes=${ym}`} className="btn btn-primary btn-sm ml-1">
              <Plus className="h-4 w-4" aria-hidden /> {d.app.request.newTitle}
            </Link>
          )}
        </div>
      </div>

      {activeClients === 0 && rows.length === 0 ? (
        <div className="mt-10 animate-rise border-t border-ivory py-14 text-center">
          <DocStrip states={["pending", "pending", "pending"]} className="justify-center" />
          <h2 className="mt-5 font-display text-2xl">{t.noClientsTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted">{t.noClientsText}</p>
          <Link href="/app/clientes" className="btn btn-primary mt-6">
            <UserPlus className="h-4 w-4" aria-hidden /> {t.addClients}
          </Link>
        </div>
      ) : (
        <>
          {isManager && team.length > 0 && (
            <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label={d.app.team.assignee}>
              {[{ id: "", name: d.app.team.all }, ...team].map((m) => {
                const active = (resp ?? "") === m.id;
                return (
                  <Link
                    key={m.id || "all"}
                    href={`/app?mes=${ym}${m.id ? `&resp=${m.id}` : ""}`}
                    className={`border-b pb-0.5 transition ${active ? "border-ivory text-ivory" : "border-transparent text-muted hover:text-ivory"}`}
                  >
                    {m.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Totais: régua de tinta em cima, duplo traço em baixo (os números também são filtros) */}
          <dl className="double-rule mt-8 grid grid-cols-2 border-t border-ivory lg:grid-cols-4">
            {stats.map((s, i) => {
              const active = Boolean(s.f && filter === s.f);
              return (
                <Link
                  key={s.label}
                  href={href(s.f)}
                  aria-current={active ? "true" : undefined}
                  className={`group block py-4 pr-4 transition ${i % 2 === 1 ? "border-l border-line pl-4" : ""} ${i === 2 ? "lg:border-l lg:pl-4" : ""} ${i >= 2 ? "border-t border-line lg:border-t-0" : ""} ${active ? "bg-ink-3/70" : "hover:bg-ink-3/40"}`}
                >
                  <dt className="mono-label group-hover:text-ivory">{s.label}</dt>
                  <dd className={`figure mt-2 text-[44px] ${s.tone ?? ""}`}>{s.value}</dd>
                </Link>
              );
            })}
          </dl>

          {/* Próximas ações: o que o escritório tem de fazer hoje, sem procurar */}
          {byPerson.length > 0 && (
            <div className="mt-5">
              {toRemind > 0 || toConfirm > 0 ? (
                <div className="card grid sm:grid-cols-2">
                  {toRemind > 0 && (
                    <Link
                      href={href("remind")}
                      className={`flex items-start gap-3 p-4 transition hover:bg-ink-3/40 ${filter === "remind" ? "bg-ink-3/70" : ""}`}
                    >
                      <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-bad" aria-hidden />
                      <span>
                        <span className="block font-medium">{t.nextRemind(toRemind)}</span>
                        <span className="mt-0.5 block text-[13px] leading-5 text-muted">{t.nextRemindHint}</span>
                      </span>
                    </Link>
                  )}
                  {toConfirm > 0 && (
                    <Link
                      href={href("awaiting")}
                      className={`flex items-start gap-3 p-4 transition hover:bg-ink-3/40 ${toRemind > 0 ? "border-t border-line sm:border-l sm:border-t-0" : ""} ${filter === "awaiting" ? "bg-ink-3/70" : ""}`}
                    >
                      <DocMark state="sent" className="mt-[3px] h-3.5 w-3.5" />
                      <span>
                        <span className="block font-medium">{t.nextConfirm(toConfirm)}</span>
                        <span className="mt-0.5 block text-[13px] leading-5 text-muted">{t.nextConfirmHint}</span>
                      </span>
                    </Link>
                  )}
                </div>
              ) : (
                <p className="flex items-center gap-2.5 text-sm text-muted">
                  <DocMark state="received" /> {t.allClear}
                </p>
              )}
            </div>
          )}

          {canWrite && withoutRequest > 0 && (
            <form action={createMonthRequests} className="card mt-5 flex animate-rise flex-wrap items-center justify-between gap-4 border-ivory/40 p-5">
              <input type="hidden" name="period" value={ym} />
              <div className="flex items-start gap-3">
                <DocMark state="pending" className="mt-1 h-3.5 w-3.5" />
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
            <p className="mt-12 border-t border-line pt-10 text-center text-muted">
              {filter ? (
                <>
                  {t.filterEmpty}{" "}
                  <Link href={href()} className="text-ivory underline decoration-line-strong underline-offset-4">
                    {t.filters.all}
                  </Link>
                </>
              ) : (
                t.emptyPeriod
              )}
            </p>
          ) : (
            <>
            {rows.length >= 8 && (
              <div className="mt-8 sm:max-w-xs">
                <ListSearch listId="lista-pedidos" placeholder={d.common.searchClient} emptyText={d.common.noResults} />
              </div>
            )}
            <ul id="lista-pedidos" className={`border-t border-ivory ${rows.length >= 8 ? "mt-4" : "mt-8"}`}>
              {rows.map((r, i) => {
                const done = isComplete(r);
                const st = state.get(r.id)!;
                const dl = deadlineLabel(st, d);
                const pending = pendingByRequest.get(r.id) ?? [];
                const wa = done ? null : reminderUrl(office, locale, d, r, pending);
                const mail = done || wa ? null : reminderMailto(office, locale, d, r, pending);
                const docs = docsByRequest.get(r.id) ?? [];
                const states = orderStates(docs.map((x) => x.status));
                return (
                  <li key={r.id} data-search={`${r.client_name} ${r.assignee_name ?? ""}`} className="animate-rise border-b border-line py-4" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2.5 lg:grid-cols-[minmax(0,1fr)_150px_200px_300px]">
                      {/* Cliente */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/app/pedidos/${r.id}`} className="truncate font-medium underline-offset-4 hover:underline">
                            {r.client_name}
                          </Link>
                          {r.months === 3 && <span className="mono-label hidden shrink-0 border border-line px-1.5 py-px !text-[9.5px] sm:inline">{d.common.cadence.quarterly}</span>}
                          {r.assignee_name && !resp && <span className="hidden shrink-0 text-xs text-muted sm:inline">· {r.assignee_name}</span>}
                        </div>
                        {(r.client_phone || r.client_email) && (
                          <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-3 font-mono text-[11px] text-muted">
                            {r.client_phone && (
                              <a href={`tel:${r.client_phone.replace(/\s/g, "")}`} className="hover:text-ivory">
                                {r.client_phone}
                              </a>
                            )}
                            {r.client_email && (
                              <a href={`mailto:${r.client_email}`} className="min-w-0 truncate hover:text-ivory">
                                {r.client_email}
                              </a>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Documentos: as marcas lêem-se num relance */}
                      <div className="order-3 flex items-center gap-2.5 lg:order-none">
                        <DocStrip states={states} label={t.docsOf(r.received_items, r.total_items)} />
                        <span className="font-mono text-[11px] text-muted tabular-nums">
                          {r.received_items}/{r.total_items}
                        </span>
                      </div>

                      {/* Estado */}
                      <div className="order-4 text-right lg:order-none lg:text-left">
                        <span className={`${statusText} ${deadlineTone[st.kind]}`}>{dl.detail ?? dl.chip}</span>
                        <span className="block font-mono text-[10.5px] text-muted">
                          {r.sent_items > 0 ? (
                            <span className="inline-flex items-center gap-1 text-gold">
                              {t.awaiting(r.sent_items)}
                              {(viasByRequest.get(r.id) ?? []).map((v, k) => (
                                <ChannelIcon key={k} via={v} className="h-3 w-3" />
                              ))}
                            </span>
                          ) : r.due_date && !done ? (
                            t.dueOn(formatDate(r.due_date, locale, false))
                          ) : r.reminder_count > 0 ? (
                            t.reminders(r.reminder_count)
                          ) : null}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className="order-2 flex shrink-0 items-center justify-end gap-2 lg:order-none">
                        {wa && <ReminderButton requestId={r.id} href={wa} label={d.app.remind} compact />}
                        {mail && <ReminderButton requestId={r.id} href={mail} label={d.app.remindEmail} channel="email" compact />}
                        <CopyButton value={publicLink(r.token)} label={d.common.copy} done={d.common.copied} compact />
                      </div>
                    </div>

                    {/* Documento a documento: estado, por onde chegou e quando */}
                    {docs.length > 0 && (
                      <details className="group/docs mt-2" open={filter === "awaiting" && r.sent_items > 0}>
                        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-muted transition hover:text-ivory [&::-webkit-details-marker]:hidden">
                          {t.showDocs}
                          <ChevronDown className="h-3.5 w-3.5 transition group-open/docs:rotate-180" aria-hidden />
                        </summary>
                        <ul className="mt-2 grid animate-fade border-t border-line sm:grid-cols-2 sm:gap-x-8">
                          {docs.map((doc) => (
                            <li key={doc.id} className="flex items-center gap-2.5 border-b border-line py-2 text-[13px]">
                              <DocMark state={doc.status} />
                              <span className="min-w-0 flex-1 truncate">{doc.label}</span>
                              {doc.status !== "pending" && isChannel(doc.sent_via) ? (
                                <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10.5px] text-muted" title={doc.client_marked_at ? formatDate(doc.client_marked_at, locale) : undefined}>
                                  <ChannelIcon via={doc.sent_via} className="h-3 w-3" />
                                  {d.common.via[doc.sent_via]}
                                  {doc.client_marked_at && <span className="hidden sm:inline">· {formatDate(doc.client_marked_at, locale, false)}</span>}
                                </span>
                              ) : (
                                <span className="shrink-0 font-mono text-[10.5px] text-muted">{d.app.request.status[doc.status]}</span>
                              )}
                              {/* Confirmar aqui mesmo o que o cliente diz ter enviado */}
                              {doc.status === "sent" && canWrite && (
                                <form action={setItemStatus} className="shrink-0">
                                  <input type="hidden" name="item" value={doc.id} />
                                  <input type="hidden" name="request" value={r.id} />
                                  <input type="hidden" name="status" value="received" />
                                  <SubmitButton className="btn btn-primary btn-sm min-h-0 px-2.5 py-1 text-[11px]" pendingText="…">
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
            </>
          )}
        </>
      )}
    </div>
  );
}
