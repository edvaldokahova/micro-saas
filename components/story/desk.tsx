// O painel do Bilonai na versão de computador (1280 × 800 lógicos), para a gravação no portátil.
// Mesmos textos, marcas e ícones do painel real; os alvos dos cliques têm data-t.
import { IconAI, IconClients, IconDocs, IconLedger, IconSettings, IconTrash } from "@/components/icons";
import { ChannelLogo } from "@/components/channel-logo";
import { Avatar } from "@/components/avatar";
import { Wordmark } from "@/components/logo";
import { ChannelIcon, type Channel } from "@/components/channel-icon";
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
    nav: { dashboard: string; clients: string; documents: string; settings: string };
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
    docsTitle: string;
    docsHint: string;
    filesCount: string[]; // índice = número de ficheiros
    zipCounts: string[]; // «Descarregar tudo (n)», índice = n
    dates: string[]; // dia e hora de chegada de cada ficheiro (cliente 1, depois cliente 2)
    sizes: string[];
    move: string;
    months: string[]; // [atual, anterior]
    zip: string;
    zipDone: string;
    filedBy: string;
    files: string[];
    docStatus: Record<DocState, string>;
    to: string;
    send: string;
    message: string;
    via: string;
    channels: Record<Channel, string>;
    auto: string;
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
  tab: "dash" | "clients" | "docs" | "settings";
  created: boolean;
  fresh: boolean;
  modal: boolean;
  reminded: boolean;
  expanded: boolean;
  confirmed: boolean;
  zipped: boolean;
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
  tab: "dash", created: true, fresh: false, modal: false, reminded: false, expanded: false, confirmed: false, zipped: false,
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
      // Página Documentos: tudo arrumado por cliente e por documento. Chega um ficheiro novo (enviado agora
      // pela página do pedido), o Bilonai arruma-o no documento certo e descarrega-se o cliente num ZIP.
      steps: [
        { tap: "tab-docs", set: { tab: "docs" } },
        { wait: 0.7 },
        { set: { confirmed: true } },
        { tap: "doc-new", zoom: 1.55 },
        { wait: 1.1 },
        { tap: "zip", set: { zipped: true }, zoom: 1.7 },
        { wait: 0.9 },
      ],
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

// Canais na demonstração (o último é o ficheiro que o cliente envia no telemóvel, pela página do pedido)
const DEMO_VIA: Channel[] = ["page", "email", "page"];

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
                ["docs", u.nav.documents, IconDocs],
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
          {s.tab === "docs" && <Docs s={s} t={t} />}
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
          : { name: t.clients[1], phone: t.phones[1], got: n - 1, sent: 0, status: u.pending, tone: "text-muted" },
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
        <div className="flex items-center gap-3">
          {/* Lembretes automáticos ligados (discreto) */}
          <span className="flex items-center gap-2 rounded-full border border-line bg-ink-2 py-1.5 pl-3 pr-1.5 text-[12.5px] text-muted">
            {u.auto}
            <span className="relative h-[18px] w-[30px] rounded-full bg-ivory">
              <span className="absolute right-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-ink-2" />
            </span>
          </span>
          <span className="btn btn-primary btn-sm">+ {u.newRequest}</span>
        </div>
      </div>

      {!s.created ? (
        <div className="mt-8 flex items-center justify-between gap-6 rounded-3xl border border-line bg-ink-2 p-6">
          <div>
            <p className="text-[16px] font-medium">{u.createAll}</p>
            <p className="mt-1 text-[13.5px] text-muted">{u.createHint}</p>
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
                        <span data-t="remind" className="btn btn-secondary btn-sm">
                          <ChannelLogo channel="whatsapp" className="h-[18px] w-[18px]" />
                          {u.remind}
                        </span>
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
                      <>
                        <ul className="mt-2.5 grid grid-cols-3 gap-2">
                          {t.docs.map((d, k) => {
                            const arrived = k < n - 1 || s.confirmed;
                            const via = DEMO_VIA[k % DEMO_VIA.length];
                            return (
                              <li key={d} className="rounded-xl bg-ink-3/70 px-3 py-2 text-[13px]">
                                <span className="flex min-w-0 items-center gap-2">
                                  <DocMark state={arrived ? "received" : "pending"} animate={k === n - 1 && s.confirmed} />
                                  <span className="truncate">{d}</span>
                                </span>
                                {/* O ficheiro chega já arrumado no documento certo, com o canal por onde veio */}
                                {arrived ? (
                                  <span key={`f${k}`} className={`mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-ink-2 px-2 py-1.5 ${k === n - 1 ? "animate-rise" : ""}`}>
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink-3 font-mono text-[8px] font-semibold text-muted">
                                      {(u.files[k] ?? "").split(".").pop()?.toUpperCase()}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate text-[11.5px] font-medium">{u.files[k]}</span>
                                      <span className="flex items-center gap-1 text-[10.5px] text-muted">
                                        <ChannelIcon via={via} className="h-2.5 w-2.5" /> {u.channels[via]}
                                      </span>
                                    </span>
                                  </span>
                                ) : (
                                  <span className="mt-1.5 block pl-6 text-[11.5px] text-muted">{u.docStatus.pending}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        <span className="mt-2.5 flex items-center gap-3">
                          <span data-t="zip" className={`btn btn-secondary btn-sm transition-opacity ${s.confirmed ? "opacity-100" : "opacity-40"}`}>{u.zip}</span>
                          {/* Como a descarga aparece no navegador: ícone do ZIP, nome do ficheiro e tamanho */}
                          {s.zipped && (
                            <span className="flex animate-rise items-center gap-2 rounded-lg border border-line bg-ink-2 py-1 pl-1.5 pr-2.5 shadow-[0_6px_16px_-10px_rgba(18,19,22,0.35)]">
                              <span className="grid h-6 w-5 place-items-center rounded-[4px] bg-[#f4c542] font-mono text-[7px] font-bold text-[#5c4300]">ZIP</span>
                              <span className="leading-tight">
                                <span className="block text-[11.5px] font-medium">{u.zipDone}</span>
                                <span className="block text-[10px] text-muted">2,4 MB</span>
                              </span>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ok" aria-hidden><path d="M2.5 6.3l2.2 2.2L9.5 3.6" /></svg>
                            </span>
                          )}
                          {s.confirmed && !s.zipped && <span className="animate-fade text-[11.5px] text-muted">{u.filedBy}</span>}
                        </span>
                      </>
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

// Página Documentos, igual à do painel real: título, meses, e cada cliente com os seus documentos
// e os ficheiros (canal, dia e hora de chegada, tamanho, quem arrumou, e as mesmas ações)
function Docs({ s, t }: { s: DeskState; t: DeskTexts }) {
  const u = t.ui;
  const n = t.docs.length;
  const groups = [
    { client: t.clients[1], via: DEMO_VIA, got: s.confirmed ? n : n - 1, main: true },
    { client: t.clients[3], via: ["email", "email", "page"] as Channel[], got: n, main: false },
  ];
  const total = groups.reduce((a, g) => a + g.got, 0);
  const icon = "grid h-8 w-8 place-items-center rounded-full text-muted";
  return (
    <div className="mx-auto max-w-[768px]">
      <p className="font-display text-[36px] leading-none">{u.docsTitle}</p>
      <p className="mt-2 max-w-[60ch] text-[14px] text-muted">{u.docsHint}</p>
      <div className="mt-8 flex gap-2">
        {u.months.map((m, i) => (
          <span key={m} className={`rounded-full border px-3.5 py-1.5 text-[13px] ${i === 0 ? "border-ivory bg-ivory text-ink" : "border-line-strong text-muted"}`}>
            {m}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-b border-line pb-4">
        <p className="text-[14px] text-muted tabular-nums">{u.filesCount[total]}</p>
        <span className="btn btn-secondary btn-sm">{u.zipCounts[total]}</span>
      </div>
      <div className="mt-6 space-y-8">
        {groups.map((g, gi) => (
          <section key={g.client}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-[22px] leading-tight">{g.client}</p>
                <p className="mt-0.5 text-[13px] text-muted tabular-nums">
                  {u.months[0]} · {u.filesCount[g.got]}
                </p>
              </div>
              <span className="relative">
                {/* A descarga aparece por baixo do botão, como no navegador, sem mexer no resto */}
                {g.main && s.zipped && (
                  <span className="absolute right-0 top-full z-10 mt-1.5 flex animate-rise items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-ink-2 py-1 pl-1.5 pr-2 shadow-[0_6px_16px_-10px_rgba(18,19,22,0.35)]">
                    <span className="grid h-5 w-4 place-items-center rounded-[3px] bg-[#f4c542] font-mono text-[6px] font-bold text-[#5c4300]">ZIP</span>
                    <span className="text-[11px] font-medium">{u.zipDone}</span>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ok" aria-hidden><path d="M2.5 6.3l2.2 2.2L9.5 3.6" /></svg>
                  </span>
                )}
                <span data-t={g.main ? "zip" : undefined} className="btn btn-secondary btn-sm">{u.zipCounts[g.got]}</span>
              </span>
            </div>
            <div className="mt-3 space-y-4">
              {t.docs.slice(0, g.got).map((d, k) => {
                const fresh = g.main && k === n - 1;
                const via = g.via[k % g.via.length];
                const file = u.files[k] ?? "";
                return (
                  <div key={d}>
                    <p className="mb-1.5 text-[13.5px] font-medium">{d}</p>
                    <div
                      data-t={fresh ? "doc-new" : undefined}
                      className={`flex items-center gap-3 rounded-xl border bg-ink-2 px-3 py-2.5 ${fresh ? "animate-rise border-ivory shadow-[0_0_0_3px_rgba(37,99,235,0.12)]" : "border-line"}`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-3 font-mono text-[9.5px] font-semibold tracking-wide text-muted">{file.split(".").pop()?.toUpperCase()}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{file}</span>
                        <span className="mt-0.5 flex items-center gap-x-1.5 whitespace-nowrap font-mono text-[10.5px] text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <ChannelIcon via={via} className="h-3 w-3" /> {u.channels[via]}
                          </span>
                          · {u.dates[gi * n + k]} · {u.sizes[k]}
                          <span className="inline-flex items-center gap-1">
                            <IconAI className="h-[13px] w-[13px] text-ivory" /> {u.filedBy}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="flex h-8 items-center gap-2 rounded-full border border-line-strong px-3.5 text-[12.5px] text-muted">
                          {u.move}
                          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden><path d="M6 8l4 4 4-4" /></svg>
                        </span>
                        <span className={icon}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 9.5V2.5M5.2 5.2L8 2.4l2.8 2.8M4.5 7.5H4a1.5 1.5 0 0 0-1.5 1.5v3.5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V9A1.5 1.5 0 0 0 12 7.5h-.5" /></svg>
                        </span>
                        <span className={icon}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 2.5v8M4.8 7.5L8 10.7l3.2-3.2M3 13.5h10" /></svg>
                        </span>
                        <span className={icon}>
                          <IconTrash />
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
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
      {/* Como no painel real: a lista primeiro e o botão "Adicionar cliente" (abre uma janela) */}
      <div className="flex items-end justify-between">
        <div>
          <p className={h1}>{u.clientsTitle}</p>
          <p className="mt-2 text-[13.5px] text-muted">{u.clientsCount}</p>
        </div>
        <span className="btn btn-primary btn-sm">+ {u.addClient}</span>
      </div>
      <div className="mt-7">
        <div>
          <ul className="divide-y divide-line rounded-3xl border border-line bg-ink-2">
            {list.map((c) => (
              <li key={c.name} data-t={`client-${c.i}`} className="flex items-center gap-3.5 px-5 py-3">
                <Avatar name={c.name} className="h-9 w-9 text-[14px]" />
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
                      <span className="flex items-center gap-3.5">
                        <Avatar name={c.name} className="h-9 w-9 text-[14px] opacity-60" />
                        {c.name}
                      </span>
                      <span data-t={`unarchive-${c.i}`} className="btn btn-secondary btn-sm">{u.unarchive}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
