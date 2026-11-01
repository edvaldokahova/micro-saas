import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/office";
import { createAdminClient } from "@/lib/supabase/admin";
import { perfTexts } from "@/lib/performance-texts";
import { BarsChart, OfficesRing, RevenueChart, type Segment } from "@/components/admin-charts";
import { IconSpark } from "@/components/icons";

export const metadata: Metadata = { title: "Desempenho" };

type Period = "m" | "q" | "y";
type Req = {
  id: string;
  client_id: string;
  due_date: string | null;
  created_at: string;
  reminder_count: number;
  auto_count: number;
  first_viewed_at: string | null;
  clients: { name: string } | null;
  request_items: { status: string; received_at: string | null }[];
};

const DAY = 86_400_000;

// Desempenho do escritório (dono e administradores): tudo calculado a partir do que já existe.
export default async function Desempenho({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { office, locale, isManager } = await getSession();
  if (!isManager) redirect("/");
  const t = perfTexts(locale);
  const sp = await searchParams;
  const period: Period = sp.p === "q" || sp.p === "y" ? sp.p : "m";

  // Início do período e as «fatias» do gráfico (semanas no mês; meses no trimestre e no ano)
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = period === "m" ? Date.UTC(y, m, 1) : period === "q" ? Date.UTC(y, Math.floor(m / 3) * 3, 1) : Date.UTC(y, 0, 1);
  const monthName = (mm: number) => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, mm, 15))).replace(".", "");
  const buckets: { label: string; from: number; to: number }[] =
    period === "m"
      ? Array.from({ length: Math.ceil(new Date(Date.UTC(y, m + 1, 0)).getUTCDate() / 7) }, (_, i) => {
          const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
          const a = i * 7 + 1;
          const b = Math.min(last, a + 6);
          return { label: `${a}–${b}`, from: Date.UTC(y, m, a), to: Date.UTC(y, m, b + 1) };
        })
      : Array.from({ length: period === "q" ? 3 : 12 }, (_, i) => {
          const mm = (period === "q" ? Math.floor(m / 3) * 3 : 0) + i;
          return { label: monthName(mm), from: Date.UTC(y, mm, 1), to: Date.UTC(y, mm + 1, 1) };
        });
  const bucketOf = (ms: number) => buckets.findIndex((b) => ms >= b.from && ms < b.to);
  const startIso = new Date(start).toISOString();

  const admin = createAdminClient();
  const [{ data: logData }, { data: reqData }, { data: docData }] = await Promise.all([
    admin.from("auto_email_log").select("sent_at, opened_at").eq("office_id", office.id).eq("ok", true).gte("sent_at", startIso),
    admin
      .from("requests")
      .select("id, client_id, due_date, created_at, reminder_count, auto_count, first_viewed_at, clients(name), request_items(status, received_at)")
      .eq("office_id", office.id)
      .gte("created_at", startIso),
    admin.from("documents").select("channel, added_by, created_at").eq("office_id", office.id).gte("created_at", startIso),
  ]);
  const logs = (logData ?? []) as { sent_at: string; opened_at: string | null }[];
  const reqs = (reqData ?? []) as unknown as Req[];
  const docs = (docData ?? []) as { channel: string; added_by: string; created_at: string }[];

  // Lembretes
  const autoSent = logs.length;
  const opened = logs.filter((l) => l.opened_at).length;
  const manual = reqs.reduce((a, r) => a + Math.max(0, r.reminder_count - r.auto_count), 0);
  const openRate = autoSent ? Math.round((opened / autoSent) * 100) : null;
  const viewed = reqs.filter((r) => r.first_viewed_at).length;

  // Entregas: pedido completo quando todos os documentos foram recebidos (data do último)
  const nowMs = Date.now();
  let withDue = 0;
  let onTime = 0;
  const durations: number[] = [];
  const lateBy = new Map<string, { name: string; n: number; days: number }>();
  for (const r of reqs) {
    const items = r.request_items ?? [];
    const done = items.length > 0 && items.every((i) => i.status === "received");
    const doneAt = done ? Math.max(...items.map((i) => (i.received_at ? Date.parse(i.received_at) : Date.parse(r.created_at)))) : null;
    if (doneAt) durations.push((doneAt - Date.parse(r.created_at)) / DAY);
    if (!r.due_date) continue;
    const dueEnd = Date.parse(`${r.due_date}T23:59:59Z`);
    if (!done && nowMs <= dueEnd) continue; // ainda dentro do prazo: não conta
    withDue++;
    const late = doneAt ? doneAt > dueEnd : true;
    if (!late) onTime++;
    else {
      const days = Math.max(1, Math.ceil(((doneAt ?? nowMs) - dueEnd) / DAY));
      const cur = lateBy.get(r.client_id) ?? { name: r.clients?.name ?? "—", n: 0, days: 0 };
      cur.n++;
      cur.days += days;
      lateBy.set(r.client_id, cur);
    }
  }
  const onTimeRate = withDue ? Math.round((onTime / withDue) * 100) : null;
  const avgDays = durations.length ? Math.max(0, Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10) : null;
  const late = [...lateBy.values()].sort((a, b) => b.n - a.n || b.days - a.days).slice(0, 5);
  const lateMax = Math.max(1, ...late.map((l) => l.n));

  // Séries
  const remGroups = buckets.map((b) => ({ label: b.label, values: [0, 0] }));
  for (const l of logs) {
    const i = bucketOf(Date.parse(l.sent_at));
    if (i < 0) continue;
    remGroups[i].values[0]++;
    if (l.opened_at) remGroups[i].values[1]++;
  }
  const docPoints = buckets.map((b) => ({ label: b.label, total: 0, earnings: 0, count: 0 }));
  for (const d of docs) {
    const i = bucketOf(Date.parse(d.created_at));
    if (i >= 0) docPoints[i].total++;
  }
  const ch = { page: 0, email: 0, office: 0 };
  for (const d of docs) {
    if (d.added_by === "office") ch.office++;
    else if (d.channel === "email") ch.email++;
    else ch.page++;
  }
  const channels: Segment[] = [
    { key: "page", label: t.channels.page, value: ch.page, from: "#60a5fa", to: "#2563eb" },
    { key: "email", label: t.channels.email, value: ch.email, from: "#a78bfa", to: "#7c3aed" },
    { key: "office", label: t.channels.office, value: ch.office, from: "#cbd5e1", to: "#64748b" },
  ];

  // Sugestões tiradas dos números
  const tips: string[] = [];
  if (!office.auto_remind) tips.push(t.tips.noAuto);
  if (openRate != null && autoSent >= 5 && openRate < 50) tips.push(t.tips.lowOpen);
  if (late[0] && late[0].n >= 2) tips.push(t.tips.late(late[0].name));
  if (!tips.length) tips.push(reqs.length + autoSent + docs.length < 5 ? t.tips.empty : t.tips.good);

  const kpis = [
    { label: t.sent, value: String(autoSent + manual), hint: t.sentHint(autoSent, manual) },
    { label: t.openRate, value: openRate == null ? "—" : `${openRate}%`, hint: t.openHint(opened, autoSent) },
    { label: t.viewed, value: reqs.length ? `${Math.round((viewed / reqs.length) * 100)}%` : "—", hint: t.viewedHint(viewed, reqs.length) },
    { label: t.onTime, value: onTimeRate == null ? "—" : `${onTimeRate}%`, hint: t.onTimeHint(withDue) },
    { label: t.avgDays, value: avgDays == null ? "—" : t.days(avgDays), hint: t.avgDaysHint },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.2rem] leading-none sm:text-5xl">{t.title}</h1>
          <p className="mt-2.5 max-w-[60ch] text-sm text-muted">{t.lead}</p>
        </div>
        {/* Período */}
        <nav className="flex rounded-full border border-line bg-ink-2 p-1 text-[13px]" aria-label={t.title}>
          {(["m", "q", "y"] as const).map((p) => (
            <Link
              key={p}
              href={p === "m" ? "/desempenho" : `/desempenho?p=${p}`}
              aria-current={period === p ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 transition ${period === p ? "bg-ivory font-medium text-ink" : "text-muted hover:text-ivory"}`}
            >
              {t.periods[p]}
            </Link>
          ))}
        </nav>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <div key={k.label} className={`card animate-rise p-4 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
            <dt className="mono-label">{k.label}</dt>
            <dd className="figure mt-2 text-[28px] leading-none sm:text-[32px]">{k.value}</dd>
            <p className="mt-2 text-[12px] leading-5 text-muted">{k.hint}</p>
          </div>
        ))}
      </dl>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="card p-5">
          <h2 className="text-[16px] font-semibold">{t.remindersTitle}</h2>
          <p className="mt-1 text-[12.5px] text-muted">{t.remindersHint}</p>
          <div className="mt-5">
            <BarsChart
              groups={remGroups}
              series={[
                { name: t.seriesSent, from: "#93c5fd", to: "#2563eb" },
                { name: t.seriesOpened, from: "#6ee7b7", to: "#059669" },
              ]}
            />
          </div>
          <p className="mt-4 text-[11.5px] leading-5 text-muted">{t.openNote}</p>
        </section>
        <section className="card p-5">
          <h2 className="text-[16px] font-semibold">{t.channelsTitle}</h2>
          <div className="mt-5">
            <OfficesRing segments={channels} total={docs.length} center={t.docsTotal} />
          </div>
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="card p-5">
          <h2 className="text-[16px] font-semibold">{t.docsTitle}</h2>
          <p className="mt-1 text-[12.5px] text-muted">{t.docsHint}</p>
          <div className="mt-5">
            <RevenueChart points={docPoints} unit="count" noun={t.docNoun} />
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-[16px] font-semibold">{t.lateTitle}</h2>
          <p className="mt-1 text-[12.5px] leading-5 text-muted">{t.lateHint}</p>
          {late.length === 0 ? (
            <p className="mt-6 text-sm text-ok">{t.lateNone}</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {late.map((l, i) => (
                <li key={l.name + i}>
                  <div className="flex items-baseline justify-between gap-3 text-[14px]">
                    <span className="truncate font-medium">{l.name}</span>
                    <span className="shrink-0 text-[12px] text-muted">{t.lateRow(l.n, Math.round(l.days / l.n))}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#fcd34d] to-[#dc2626] motion-reduce:!animate-none"
                      style={{ width: `${(l.n / lateMax) * 100}%`, transformOrigin: "left", animation: `chart-grow-x 0.9s cubic-bezier(0.2,0.7,0.2,1) ${0.2 + i * 0.1}s both` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-3 p-5">
        <h2 className="text-[16px] font-semibold">{t.tipsTitle}</h2>
        <ul className="mt-3 space-y-2.5">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-3 text-[14px] leading-6">
              <IconSpark className="mt-[5px] h-[14px] w-[14px] shrink-0 text-ivory" /> {tip}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
