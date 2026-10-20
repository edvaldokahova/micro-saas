import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, Phone, Plus, Sparkles, UserPlus } from "lucide-react";
import { ChannelIcon, isChannel, type Channel } from "@/components/channel-icon";
import { CopyButton, ReminderButton, SubmitButton } from "@/components/app-buttons";
import { Flash } from "@/components/flash";
import { formatDate, formatPeriod } from "@/lib/i18n";
import { getSession, officeAccess, resolvePeriod, shiftPeriod } from "@/lib/office";
import { deadlineLabel, deadlineOrder, deadlineState, deadlineTone, suggestedDue, type Deadline } from "@/lib/deadline";
import { publicLink, reminderUrl } from "@/lib/reminder";
import { createMonthRequests } from "./actions";

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
  total_items: number;
  received_items: number;
  sent_items: number;
};

export default async function Painel({ searchParams }: { searchParams: Promise<{ mes?: string; criados?: string; erro?: string; resp?: string }> }) {
  const sp = await searchParams;
  const { supabase, office, locale, d } = await getSession();
  const t = d.app.dashboard;
  const period = resolvePeriod(sp.mes);
  const ym = period.slice(0, 7);
  const canWrite = officeAccess(office).canWrite;

  const [{ data: reqData }, { data: clientData }] = await Promise.all([
    supabase
      .from("requests_overview")
      .select("id, client_id, client_name, client_phone, client_email, assignee_id, assignee_name, period, due_date, token, reminder_count, total_items, received_items, sent_items")
      .eq("period", period),
    supabase.from("clients").select("id").is("archived_at", null),
  ]);
  const { data: teamData } = await supabase.from("team_members").select("id, name").order("name");
  const team = (teamData ?? []) as { id: string; name: string }[];
  const resp = team.some((m) => m.id === sp.resp) ? sp.resp : undefined;
  const allRows = (reqData ?? []) as Row[];
  const rows = resp ? allRows.filter((r) => r.assignee_id === resp) : allRows;
  const activeClients = (clientData ?? []).length;
  const withRequest = new Set(allRows.map((r) => r.client_id));
  const withoutRequest = (clientData ?? []).filter((c: { id: string }) => !withRequest.has(c.id)).length;

  // Documentos ainda não recebidos de cada pedido (para a mensagem de WhatsApp)
  // e por onde o cliente enviou os que já assinalou
  const pendingByRequest = new Map<string, string[]>();
  const viasByRequest = new Map<string, Channel[]>();
  if (rows.length) {
    const { data: items } = await supabase
      .from("request_items")
      .select("request_id, label, status, sent_via, position")
      .in("request_id", rows.map((r) => r.id))
      .in("status", ["pending", "sent"])
      .order("position");
    for (const i of (items ?? []) as { request_id: string; label: string; status: string; sent_via: string | null }[]) {
      if (i.status === "pending") pendingByRequest.set(i.request_id, [...(pendingByRequest.get(i.request_id) ?? []), i.label]);
      else if (isChannel(i.sent_via)) viasByRequest.set(i.request_id, [...(viasByRequest.get(i.request_id) ?? []), i.sent_via]);
    }
  }

  const isComplete = (r: Row) => r.total_items > 0 && r.received_items === r.total_items;
  const state = new Map<string, Deadline>(rows.map((r) => [r.id, deadlineState(r.due_date, isComplete(r))]));
  const kindOf = (r: Row) => state.get(r.id)!.kind;
  rows.sort(
    (a, b) =>
      deadlineOrder[kindOf(a)] - deadlineOrder[kindOf(b)] ||
      (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
      a.client_name.localeCompare(b.client_name, locale),
  );
  const count = (k: Deadline["kind"]) => rows.filter((r) => kindOf(r) === k).length;
  const delivered = count("delivered");
  const late = count("late");

  const stats = [
    { label: t.statRequests, value: rows.length },
    { label: t.statComplete, value: delivered, tone: "text-ok" },
    { label: t.statMissing, value: rows.length - delivered - late, tone: rows.length - delivered - late ? "text-warn" : "" },
    { label: t.statLate, value: late, tone: late ? "text-bad" : "" },
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
            <p className="mt-10 text-center text-muted">{t.emptyPeriod}</p>
          ) : (
            <ul className="card mt-6 divide-y divide-line overflow-hidden">
              {rows.map((r, i) => {
                const done = isComplete(r);
                const st = state.get(r.id)!;
                const dl = deadlineLabel(st, d);
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
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${deadlineTone[st.kind]}`}>{dl.chip}</span>
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
