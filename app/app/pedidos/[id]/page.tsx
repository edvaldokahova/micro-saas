import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DocMark, DocStrip, orderStates } from "@/components/marks";
import { CopyButton, ReminderButton, SubmitButton } from "@/components/app-buttons";
import { ChannelIcon, isChannel } from "@/components/channel-icon";
import { formatDate, formatPeriod } from "@/lib/i18n";
import { dashboardMonth, getSession } from "@/lib/office";
import { deadlineLabel, deadlineState, deadlineTone, statusText } from "@/lib/deadline";
import { publicLink, reminderMailto, reminderUrl } from "@/lib/reminder";
import { deleteRequest, markAllReceived, setItemStatus } from "../../actions";

export const metadata: Metadata = { title: "Pedido" };

type Req = {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  period: string;
  months: number;
  due_date: string | null;
  token: string;
  reminder_count: number;
  last_reminder_at: string | null;
  total_items: number;
  received_items: number;
};
type Item = { id: string; label: string; status: "pending" | "sent" | "received"; client_marked_at: string | null; sent_via: string | null };

export default async function Pedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, office, locale, d } = await getSession();
  const t = d.app.request;

  const [{ data: r }, { data: it }, { data: noteRow }] = await Promise.all([
    supabase
      .from("requests_overview")
      .select("id, client_id, client_name, client_phone, client_email, period, months, due_date, token, reminder_count, last_reminder_at, total_items, received_items")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("request_items").select("id, label, status, client_marked_at, sent_via").eq("request_id", id).order("position").order("created_at"),
    supabase.from("requests").select("note").eq("id", id).maybeSingle(),
  ]);
  if (!r) notFound();
  const req = r as Req;
  const items = (it ?? []) as Item[];
  const note = (noteRow as { note: string | null } | null)?.note;
  const done = req.total_items > 0 && req.received_items === req.total_items;
  const pct = req.total_items ? Math.round((req.received_items / req.total_items) * 100) : 0;
  const pendingLabels = items.filter((i) => i.status === "pending").map((i) => i.label);
  const wa = done ? null : reminderUrl(office, locale, d, req, pendingLabels);
  const mail = done ? null : reminderMailto(office, locale, d, req, pendingLabels);
  const link = publicLink(req.token);
  const st = deadlineState(req.due_date, done);
  const dl = deadlineLabel(st, d);
  const periodLabel = formatPeriod(req.period, locale, req.months);
  const backMonth = dashboardMonth(req.period, req.months);

  const chip = {
    pending: "text-muted",
    sent: "text-gold",
    received: "text-ok",
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/?mes=${backMonth}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ivory">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {formatPeriod(`${backMonth}-01`, locale)}
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{periodLabel}</p>
          <h1 className="mt-2 font-display text-[2.4rem] leading-none">
            <Link href={`/clientes/${req.client_id}`} className="underline-offset-4 hover:underline">
              {req.client_name}
            </Link>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {d.app.dashboard.docsOf(req.received_items, req.total_items)}
            {req.due_date ? ` · ${d.app.dashboard.dueOn(formatDate(req.due_date, locale))}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`${statusText} ${deadlineTone[st.kind]}`}>{dl.chip}</span>
          {dl.detail && <span className={`font-mono text-[11px] ${st.kind === "late" ? "text-bad" : "text-warn"}`}>{dl.detail}</span>}
        </div>
      </div>

      <div className="double-rule mt-6 flex items-center gap-3 border-t border-line py-3">
        <DocStrip states={orderStates(items.map((i) => i.status))} label={d.app.dashboard.docsOf(req.received_items, req.total_items)} />
        <span className="font-mono text-[11px] text-muted tabular-nums">{pct}%</span>
      </div>

      {/* Link e lembrete */}
      <section className="card mt-6 p-5">
        <p className="mono-label">{t.link}</p>
        <p className="mt-1 text-xs text-muted">{t.linkHint}</p>
        <code className="mt-3 block truncate border-y border-line py-2.5 font-mono text-[13px]">{link.replace(/^https:\/\//, "")}</code>
        <div className="mt-4 flex flex-wrap gap-2">
          {wa && <ReminderButton requestId={req.id} href={wa} label={d.app.remind} />}
          {mail && <ReminderButton requestId={req.id} href={mail} label={d.app.remindEmail} channel="email" secondary={Boolean(wa)} />}
          {!done && !wa && !mail && <p className="w-full text-sm text-muted">{d.app.remindNoPhone}</p>}
          <CopyButton value={link} label={d.common.copy} done={d.common.copied} />
          <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            {d.common.open}
          </a>
        </div>
        {req.last_reminder_at && (
          <p className="mt-3 text-xs text-muted">
            {t.lastReminder(formatDate(req.last_reminder_at, locale))} · {d.app.dashboard.reminders(req.reminder_count)}
          </p>
        )}
      </section>

      {note && (
        <section className="card mt-4 p-5 text-sm">
          <p className="text-xs text-muted">{t.noteLabel}</p>
          <p className="mt-1 whitespace-pre-line">{note}</p>
        </section>
      )}

      {/* Documentos */}
      <ul className="mt-8 border-t border-line">
        {items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-3 border-b border-line py-3.5">
            <DocMark state={i.status} className="h-4 w-4" />
            <span className="min-w-0 flex-1">
              <span className="block">{i.label}</span>
              {i.status !== "pending" && isChannel(i.sent_via) && (
                <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
                  <ChannelIcon via={i.sent_via} /> {d.common.sentVia(d.common.via[i.sent_via])}
                  {i.client_marked_at && <> · {formatDate(i.client_marked_at, locale)}</>}
                </span>
              )}
            </span>
            <span className={`${statusText} ${chip[i.status]}`}>{t.status[i.status]}</span>
            <form action={setItemStatus}>
              <input type="hidden" name="item" value={i.id} />
              <input type="hidden" name="request" value={req.id} />
              <input type="hidden" name="status" value={i.status === "received" ? "pending" : "received"} />
              <SubmitButton className={`btn btn-sm ${i.status === "received" ? "btn-secondary" : "btn-primary"}`}>
                {i.status === "received" ? t.undo : t.markReceived}
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {!done && items.length > 0 ? (
          <form action={markAllReceived}>
            <input type="hidden" name="request" value={req.id} />
            <SubmitButton className="btn btn-secondary btn-sm">{t.allReceived}</SubmitButton>
          </form>
        ) : (
          <span />
        )}
        <form action={deleteRequest}>
          <input type="hidden" name="request" value={req.id} />
          <input type="hidden" name="period" value={backMonth} />
          <SubmitButton className="btn btn-sm text-bad hover:bg-bad/10" confirm={t.removeConfirm}>
            {t.remove}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
