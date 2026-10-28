// O painel do Bilonai na versão de computador (1280 × 800 lógicos), para a gravação no portátil.
// Mesmos textos, marcas e ícones do painel real; os alvos dos cliques têm data-t.
import { IconClients, IconLedger, IconSettings } from "@/components/icons";
import { Wordmark } from "@/components/logo";
import { DocMark, DocStrip, type DocState } from "@/components/marks";
import type { Step } from "./engine";

export const DW = 1280;
export const DH = 720;

export type DeskTexts = {
  office: string;
  clients: string[]; // 6
  phones: string[]; // 6
  docs: string[]; // 3
  member: { name: string; email: string; existing: string };
  ui: {
    nav: { dashboard: string; clients: string; settings: string };
    periodEyebrow: string;
    month: string;
    collected: string;
    newRequest: string;
    stats: { requests: string; delivered: string; pending: string; late: string };
    createAll: string;
    createHint: string;
    create: string;
    remind: string;
    reminded: string;
    copy: string;
    pending: string;
    late: string;
    awaiting: string;
    delivered: string;
    showDocs: string;
    confirm: string;
    docStatus: Record<DocState, string>;
    to: string;
    send: string;
    message: string;
    via: string;
    clientsTitle: string;
    clientsCount: string;
    addClient: string;
    name: string;
    phone: string;
    archive: string;
    archived: string;
    unarchive: string;
    settingsTitle: string;
    officeTitle: string;
    teamTitle: string;
    teamHint: string;
    add: string;
    email: string;
    accessLabel: string;
    access: { none: string; member: string; admin: string };
    accessHint: { none: string; member: string; admin: string };
    status: { invited: string; active: string };
    invitedFlash: string;
  };
};

type Access = "none" | "member" | "admin";
export type DeskState = {
  tab: "dash" | "clients" | "settings";
  created: boolean;
  fresh: boolean;
  modal: boolean;
  reminded: boolean;
  expanded: boolean;
  confirmed: boolean;
  openClient: number | null;
  archived: number[];
  showArchived: boolean;
  focus: "name" | "email" | null;
  name: string;
  email: string;
  access: Access;
  invited: boolean;
};

const BASE: DeskState = {
  tab: "dash", created: true, fresh: false, modal: false, reminded: false, expanded: false, confirmed: false,
  openClient: null, archived: [], showArchived: false, focus: null, name: "", email: "", access: "none", invited: false,
};

export function deskScript(member: DeskTexts["member"]): { start: DeskState; steps: Step<DeskState>[] }[] {
  return [
    { start: { ...BASE, created: false }, steps: [{ tap: "create", set: { created: true, fresh: true }, zoom: 1.7 }, { wait: 0.8 }] },
    {
      start: BASE,
      steps: [
        { tap: "remind", set: { modal: true }, zoom: 1.25 },
        { wait: 1.2 },
        { tap: "send", set: { modal: false, reminded: true }, zoom: 1.3 },
      ],
    },
    {
      start: { ...BASE, reminded: true },
      steps: [{ tap: "docs", set: { expanded: true }, zoom: 1.6 }, { wait: 0.2 }, { tap: "confirm", set: { confirmed: true }, zoom: 1.9 }, { wait: 0.5 }],
    },
    {
      start: { ...BASE, reminded: true, confirmed: true },
      steps: [
        { tap: "tab-clients", set: { tab: "clients" } },
        { tap: "client-5", set: { openClient: 5 }, zoom: 1.4 },
        { tap: "archive", set: { archived: [5], openClient: null }, zoom: 1.8 },
        { tap: "archived-toggle", set: { showArchived: true }, zoom: 1.6 },
        { tap: "unarchive-5", set: { archived: [], showArchived: false }, zoom: 1.8 },
      ],
    },
    {
      start: { ...BASE, reminded: true, confirmed: true, tab: "clients" },
      steps: [
        { tap: "tab-settings", set: { tab: "settings" } },
        { tap: "f-name", set: { focus: "name" }, zoom: 1.8 },
        { type: "name", text: member.name },
        { tap: "f-email", set: { focus: "email" }, zoom: 1.8 },
        { type: "email", text: member.email },
        { tap: "acc-member", set: { access: "member", focus: null }, zoom: 1.7 },
        { tap: "add", set: { invited: true }, zoom: 1.6 },
        { wait: 0.6 },
      ],
    },
  ];
}

const h1 = "text-[38px] font-semibold leading-none tracking-[-0.03em] [font-variation-settings:'wdth'_84]";
const small = "text-[12.5px] font-medium";

export function DeskScreen({ s, t }: { s: DeskState; t: DeskTexts }) {
  const u = t.ui;
  return (
    <div className="flex h-full flex-col bg-ink text-ivory">
      <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-line bg-ink-2 px-10">
        <div className="flex items-center gap-10">
          <Wordmark className="h-[15px] w-auto" />
          <nav className="flex gap-7 text-[14px]">
            {(
              [
                ["dash", u.nav.dashboard, IconLedger],
                ["clients", u.nav.clients, IconClients],
                ["settings", u.nav.settings, IconSettings],
              ] as const
            ).map(([k, label, Icon]) => (
              <span key={k} data-t={`tab-${k}`} className={`flex items-center gap-2 ${s.tab === k ? "font-medium text-ivory" : "text-muted"}`}>
                <Icon className="h-[17px] w-[17px]" active={s.tab === k} />
                {label}
              </span>
            ))}
          </nav>
        </div>
        <span className="flex items-center gap-3 text-[13px] text-muted">
          {t.office}
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-3 text-[12px] font-semibold text-ivory">CS</span>
        </span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto max-w-[1040px] px-10 pt-9">
          {s.tab === "dash" && <Dash s={s} t={t} />}
          {s.tab === "clients" && <Clients s={s} t={t} />}
          {s.tab === "settings" && <Settings s={s} t={t} />}
        </div>
        {/* Lembrete pronto */}
        <div className={`absolute inset-0 z-20 grid place-items-center bg-ivory/20 transition-opacity duration-300 ${s.modal ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <div className={`w-[520px] rounded-3xl border border-line bg-ink-2 p-6 shadow-[0_40px_80px_-30px_rgba(18,19,22,0.45)] transition-transform duration-300 ${s.modal ? "scale-100" : "scale-95"}`}>
            <p className={`${small} text-muted`}>{u.via}</p>
            <p className="mt-1 text-[15px]">
              <span className="text-muted">{u.to}:</span> {t.clients[0]}
            </p>
            <p className="mt-4 whitespace-pre-line rounded-2xl bg-ink-3 px-4 py-3.5 text-[14px] leading-[1.55]">{u.message}</p>
            <div className="mt-5 flex justify-end">
              <span data-t="send" className="btn btn-primary">{u.send}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dash({ s, t }: { s: DeskState; t: DeskTexts }) {
  const u = t.ui;
  const n = t.docs.length;
  type Row = { name: string; phone: string; got: number; sent: number; status: string; tone: string };
  const rows: Row[] = s.fresh
    ? t.clients.slice(0, 5).map((name, i) => ({ name, phone: t.phones[i], got: 0, sent: 0, status: u.pending, tone: "text-muted" }))
    : [
        { name: t.clients[0], phone: t.phones[0], got: 1, sent: 0, status: u.late, tone: "text-bad" },
        s.confirmed
          ? { name: t.clients[1], phone: t.phones[1], got: n, sent: 0, status: u.delivered, tone: "text-ok" }
          : { name: t.clients[1], phone: t.phones[1], got: n - 1, sent: 1, status: u.awaiting, tone: "text-gold" },
        { name: t.clients[2], phone: t.phones[2], got: 2, sent: 0, status: u.pending, tone: "text-muted" },
        { name: t.clients[3], phone: t.phones[3], got: n, sent: 0, status: u.delivered, tone: "text-ok" },
        { name: t.clients[4], phone: t.phones[4], got: 0, sent: 0, status: u.pending, tone: "text-muted" },
      ];
  const states = (r: Row): DocState[] => Array.from({ length: n }, (_, i) => (i < r.got ? "received" : i < r.got + r.sent ? "sent" : "pending"));
  const delivered = rows.filter((r) => r.got === n).length;
  const late = rows.filter((r) => r.tone === "text-bad").length;
  const stats = s.created
    ? [
        [u.stats.requests, rows.length, ""],
        [u.stats.delivered, delivered, "text-ok"],
        [u.stats.pending, rows.length - delivered - late, "text-gold"],
        [u.stats.late, late, "text-bad"],
      ]
    : [];

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[13px] text-muted">{u.periodEyebrow}</p>
          <p className={`mt-1.5 ${h1}`}>{u.month}</p>
          <p className="mt-2 text-[13.5px] text-muted">{u.collected}</p>
        </div>
        <span className="btn btn-primary btn-sm">+ {u.newRequest}</span>
      </div>

      {!s.created ? (
        <div className="mt-8 flex items-center justify-between gap-6 rounded-3xl border border-line bg-ink-2 p-6">
          <div className="flex items-start gap-3">
            <DocMark state="pending" className="mt-1 h-4 w-4" />
            <div>
              <p className="text-[16px] font-medium">{u.createAll}</p>
              <p className="mt-1 text-[13.5px] text-muted">{u.createHint}</p>
            </div>
          </div>
          <span data-t="create" className="btn btn-primary">{u.create}</span>
        </div>
      ) : (
        <>
          <div className="mt-7 grid grid-cols-4 gap-3">
            {stats.map(([label, v, tone]) => (
              <div key={label as string} className="rounded-2xl border border-line bg-ink-2 px-5 py-4">
                <p className="text-[12.5px] text-muted">{label}</p>
                <p className={`mt-1 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums ${tone}`}>{v}</p>
              </div>
            ))}
          </div>
          <ul className="mt-5 rounded-3xl border border-line bg-ink-2 px-6">
            {rows.map((r, i) => (
              <li key={r.name} className={`border-b border-line py-3.5 last:border-b-0 ${s.fresh ? "animate-rise" : ""}`} style={s.fresh ? { animationDelay: `${i * 80}ms` } : undefined}>
                <div className="grid grid-cols-[1fr_170px_240px_190px] items-center gap-5">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">{r.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted tabular-nums">{r.phone}</p>
                  </div>
                  <span className="flex items-center gap-2.5">
                    <DocStrip states={states(r)} />
                    <span className="text-[12px] text-muted tabular-nums">{r.got}/{n}</span>
                  </span>
                  <span className={`${small} ${r.tone}`}>{r.status}</span>
                  <span className="flex justify-end">
                    {i === 0 && !s.fresh ? (
                      s.reminded ? (
                        <span className="text-[12.5px] text-muted">{u.reminded}</span>
                      ) : (
                        <span data-t="remind" className="btn btn-secondary btn-sm">{u.remind}</span>
                      )
                    ) : (
                      <span className="btn btn-secondary btn-sm opacity-70">{u.copy}</span>
                    )}
                  </span>
                </div>
                {i === 1 && !s.fresh && (
                  <>
                    <span data-t="docs" className="mt-2 inline-block text-[12.5px] text-muted underline decoration-line-strong underline-offset-2">{u.showDocs}</span>
                    {s.expanded && (
                      <ul className="mt-2.5 grid grid-cols-3 gap-2">
                        {t.docs.map((d, k) => {
                          const st: DocState = k < n - 1 || s.confirmed ? "received" : "sent";
                          return (
                            <li key={d} className="flex items-center justify-between gap-2 rounded-xl bg-ink-3/70 px-3 py-2 text-[13px]">
                              <span className="flex min-w-0 items-center gap-2">
                                <DocMark state={st} animate={k === n - 1 && s.confirmed} />
                                <span className="truncate">{d}</span>
                              </span>
                              {st === "sent" ? (
                                <span data-t="confirm" className="btn btn-primary btn-sm !min-h-0 !px-3 !py-1 !text-[12px]">{u.confirm}</span>
                              ) : (
                                <span className="text-[11.5px] text-muted">{u.docStatus[st]}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Clients({ s, t }: { s: DeskState; t: DeskTexts }) {
  const u = t.ui;
  if (s.openClient !== null) {
    const i = s.openClient;
    return (
      <div className="max-w-[640px]">
        <p className="text-[13.5px] text-muted">‹ {u.clientsTitle}</p>
        <p className={`mt-4 ${h1}`}>{t.clients[i]}</p>
        <div className="mt-7 grid grid-cols-2 gap-4 rounded-3xl border border-line bg-ink-2 p-6">
          {[
            [u.name, t.clients[i]],
            [u.phone, t.phones[i]],
          ].map(([l, v]) => (
            <label key={l} className="block">
              <span className="text-[12.5px] font-medium">{l}</span>
              <span className="mt-1.5 block rounded-[10px] border border-line-strong px-3.5 py-2.5 text-[14px]">{v}</span>
            </label>
          ))}
        </div>
        <div className="mt-6">
          <span data-t="archive" className="btn btn-secondary">{u.archive}</span>
        </div>
      </div>
    );
  }
  const list = t.clients.map((name, i) => ({ name, i })).filter((c) => !s.archived.includes(c.i));
  const arch = t.clients.map((name, i) => ({ name, i })).filter((c) => s.archived.includes(c.i));
  return (
    <div>
      <p className={h1}>{u.clientsTitle}</p>
      <p className="mt-2 text-[13.5px] text-muted">{u.clientsCount}</p>
      <div className="mt-7 grid grid-cols-[1fr_330px] gap-6">
        <div>
          <ul className="divide-y divide-line rounded-3xl border border-line bg-ink-2">
            {list.map((c) => (
              <li key={c.name} data-t={`client-${c.i}`} className="flex items-center gap-3.5 px-5 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-3 text-[14px] font-semibold">{c.name.charAt(0)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-medium">{c.name}</span>
                  <span className="block text-[12px] text-muted tabular-nums">{t.phones[c.i]}</span>
                </span>
              </li>
            ))}
          </ul>
          {arch.length > 0 && (
            <div className="mt-4">
              <span data-t="archived-toggle" className="inline-block py-1 text-[13px] font-medium text-muted">
                {u.archived} ({arch.length}) {s.showArchived ? "▴" : "▾"}
              </span>
              {s.showArchived && (
                <ul className="mt-2 rounded-2xl border border-line">
                  {arch.map((c) => (
                    <li key={c.name} className="flex items-center justify-between px-5 py-3 text-[14px] text-muted">
                      {c.name}
                      <span data-t={`unarchive-${c.i}`} className="btn btn-secondary btn-sm">{u.unarchive}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="space-y-3 rounded-3xl border border-line bg-ink-2 p-5">
          <p className="text-[16px] font-semibold">{u.addClient}</p>
          {[u.name, u.phone].map((l) => (
            <label key={l} className="block">
              <span className="text-[12.5px] font-medium">{l}</span>
              <span className="mt-1.5 block h-10 rounded-[10px] border border-line-strong" />
            </label>
          ))}
          <span className="btn btn-primary w-full opacity-60">{u.addClient}</span>
        </div>
      </div>
    </div>
  );
}

function Settings({ s, t }: { s: DeskState; t: DeskTexts }) {
  const u = t.ui;
  const caret = <span className="ml-px inline-block h-[15px] w-px translate-y-[2px] animate-pulse bg-ivory" />;
  const people = [
    { name: t.member.existing, access: u.access.admin, status: u.status.active, fresh: false },
    ...(s.invited ? [{ name: t.member.name, access: u.access.member, status: u.status.invited, fresh: true }] : []),
  ];
  return (
    <div>
      <p className={h1}>{u.settingsTitle}</p>
      <div className="mt-7 grid grid-cols-[1fr_1.25fr] gap-6">
        <div className="rounded-3xl border border-line bg-ink-2 p-6">
          <p className="text-[16px] font-semibold">{u.teamTitle}</p>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-muted">{u.teamHint}</p>
          <ul className="mt-4 border-t border-line">
            {people.map((p) => (
              <li key={p.name} className={`flex items-center justify-between border-b border-line py-3 text-[14px] ${p.fresh ? "animate-rise" : ""}`}>
                <span className="font-medium">{p.name}</span>
                <span className={`${small} ${p.fresh ? "text-gold" : "text-muted"}`}>
                  {p.access}, {p.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
          {s.invited && <p className="mt-3 animate-fade text-[13px] text-ok">{u.invitedFlash}</p>}
        </div>
        <div className="space-y-4 rounded-3xl border border-line bg-ink-2 p-6">
          <p className="text-[16px] font-semibold">{u.add}</p>
          <div className="grid grid-cols-2 gap-3">
            {(["name", "email"] as const).map((f) => (
              <label key={f} className="block">
                <span className="text-[12.5px] font-medium">{f === "name" ? u.name : u.email}</span>
                <span data-t={`f-${f}`} className={`mt-1.5 block h-10 rounded-[10px] border px-3 py-2 text-[14px] ${s.focus === f ? "border-ivory shadow-[0_0_0_3px_rgba(18,19,22,0.08)]" : "border-line-strong"}`}>
                  {s.invited ? "" : s[f]}
                  {s.focus === f && caret}
                </span>
              </label>
            ))}
          </div>
          <p className="text-[12.5px] font-medium">{u.accessLabel}</p>
          <div className="grid grid-cols-3 gap-2">
            {(["none", "member", "admin"] as const).map((a) => (
              <span key={a} data-t={`acc-${a}`} className={`rounded-2xl border px-3 py-2.5 ${s.access === a && !s.invited ? "border-ivory bg-ink-3/70" : "border-line"}`}>
                <span className="block text-[13px] font-medium">{u.access[a]}</span>
                <span className="mt-0.5 block text-[11.5px] leading-[1.4] text-muted">{u.accessHint[a]}</span>
              </span>
            ))}
          </div>
          <span data-t="add" className="btn btn-primary w-full">{u.add}</span>
        </div>
      </div>
    </div>
  );
}
