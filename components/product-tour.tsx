"use client";

// Visita guiada ao painel, como uma gravação de ecrã: um cursor percorre o próprio painel
// (versão de telemóvel, dados fictícios) e faz as tarefas do dia a dia, capítulo a capítulo.
// Tudo é HTML desenhado com os componentes reais da marca, por isso fica nítido em qualquer ecrã
// e pesa quase nada. A animação é uma timeline GSAP por capítulo; pára fora do ecrã e,
// com "reduzir movimento", mostra o resultado de cada capítulo sem cursor.
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { IconClients, IconLedger, IconSettings } from "@/components/icons";
import { DocMark, DocStrip, type DocState } from "@/components/marks";

export type TourTexts = {
  eyebrow: string;
  title: string;
  lead: string;
  note: string;
  office: string;
  chapters: { title: string; text: string }[];
  pause: string;
  play: string;
  ui: {
    nav: { dashboard: string; clients: string; settings: string };
    periodEyebrow: string;
    month: string;
    createAll: string;
    createHint: string;
    create: string;
    remind: string;
    reminded: string;
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
    archive: string;
    archived: string;
    unarchive: string;
    back: string;
    settingsTitle: string;
    teamTitle: string;
    add: string;
    name: string;
    email: string;
    access: { none: string; member: string; admin: string };
    status: { invited: string; active: string };
    invitedFlash: string;
  };
  clients: string[]; // 6 nomes
  phones: string[]; // 6 contactos
  docs: string[]; // 4 documentos
  member: { name: string; email: string; existing: string };
};

type Access = "none" | "member" | "admin";
type S = {
  tab: "dash" | "clients" | "settings";
  created: boolean;
  fresh: boolean;
  sheet: boolean;
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

type Step =
  | { tap: string; set?: Partial<S> }
  | { type: "name" | "email"; text: string }
  | { wait: number };

const BASE: S = {
  tab: "dash", created: true, fresh: false, sheet: false, reminded: false, expanded: false, confirmed: false,
  openClient: null, archived: [], showArchived: false, focus: null, name: "", email: "", access: "none", invited: false,
};

function chapters(member: TourTexts["member"]): { start: S; steps: Step[] }[] {
  return [
    { start: { ...BASE, created: false }, steps: [{ wait: 0.5 }, { tap: "create", set: { created: true, fresh: true } }, { wait: 1.8 }] },
    {
      start: BASE,
      steps: [{ tap: "remind", set: { sheet: true } }, { wait: 1.6 }, { tap: "send", set: { sheet: false, reminded: true } }, { wait: 1.4 }],
    },
    {
      start: { ...BASE, reminded: true },
      steps: [{ tap: "docs", set: { expanded: true } }, { wait: 0.7 }, { tap: "confirm", set: { confirmed: true } }, { wait: 1.6 }],
    },
    {
      start: { ...BASE, reminded: true, confirmed: true },
      steps: [
        { tap: "tab-clients", set: { tab: "clients" } },
        { wait: 0.3 },
        { tap: "client-5", set: { openClient: 5 } },
        { wait: 0.5 },
        { tap: "archive", set: { archived: [5], openClient: null } },
        { wait: 0.8 },
        { tap: "archived-toggle", set: { showArchived: true } },
        { wait: 0.5 },
        { tap: "unarchive-5", set: { archived: [], showArchived: false } },
        { wait: 1.4 },
      ],
    },
    {
      start: { ...BASE, reminded: true, confirmed: true, tab: "clients" },
      steps: [
        { tap: "tab-settings", set: { tab: "settings" } },
        { wait: 0.3 },
        { tap: "f-name", set: { focus: "name" } },
        { type: "name", text: member.name },
        { tap: "f-email", set: { focus: "email" } },
        { type: "email", text: member.email },
        { tap: "acc-member", set: { access: "member", focus: null } },
        { tap: "add", set: { invited: true } },
        { wait: 2 },
      ],
    },
  ];
}

// Estado final de um capítulo (para "reduzir movimento")
function finalState(c: { start: S; steps: Step[] }): S {
  return c.steps.reduce<S>((s, st) => ("tap" in st ? { ...s, ...st.set } : "type" in st ? { ...s, [st.type]: st.text } : s), c.start);
}

const W = 380; // largura lógica do ecrã simulado
const H = 600;

export function ProductTour({ t }: { t: TourTexts }) {
  const [script] = useState(() => chapters(t.member));
  const [ch, setCh] = useState(0);
  const [s, setS] = useState<S>(script[0].start);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);
  const [reduced, setReduced] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const visible = useRef(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  // Escala o ecrã simulado à largura disponível (nítido: é HTML, não vídeo)
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / W)));
    ro.observe(el);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    return () => ro.disconnect();
  }, []);

  // Só anima quando está no ecrã
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (e.isIntersecting && !pausedRef.current) tl.current?.play();
      else tl.current?.pause();
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const apply = useCallback((patch: Partial<S>) => flushSync(() => setS((p) => ({ ...p, ...patch }))), []);

  // Posição do centro de um alvo, em coordenadas do ecrã simulado
  const pos = useCallback(
    (id: string) => {
      const st = stage.current?.getBoundingClientRect();
      const el = stage.current?.querySelector<HTMLElement>(`[data-t="${id}"]`)?.getBoundingClientRect();
      if (!st || !el) return { x: W / 2, y: H / 2 };
      const k = st.width / W;
      return { x: (el.left - st.left + el.width / 2) / k, y: (el.top - st.top + el.height / 2) / k };
    },
    [],
  );

  // Uma timeline por capítulo
  useEffect(() => {
    const c = script[ch];
    if (reduced) {
      setS(finalState(c));
      return;
    }
    setS(c.start);
    const ctx = gsap.context(() => {
      gsap.set(cursor.current, { x: W * 0.72, y: H * 0.62, scale: 1, opacity: 1 });
      const t1 = gsap.timeline({
        paused: !visible.current || Boolean(pausedRef.current),
        defaults: { ease: "power2.inOut" },
        onUpdate: () => {
          if (bar.current) bar.current.style.transform = `scaleX(${t1.progress()})`;
        },
        onComplete: () => setCh((x) => (x + 1) % script.length),
      });
      t1.to({}, { duration: 0.5 }); // deixa o ecrã do capítulo aparecer antes do primeiro movimento
      for (const st of c.steps) {
        if ("wait" in st) {
          t1.to({}, { duration: st.wait });
        } else if ("tap" in st) {
          const id = st.tap;
          t1.to(cursor.current, { x: () => pos(id).x, y: () => pos(id).y, duration: 0.75 })
            .to(cursor.current, { scale: 0.82, duration: 0.09, ease: "power1.in" })
            .set(ring.current, { x: () => pos(id).x, y: () => pos(id).y })
            .fromTo(ring.current, { scale: 0.3, opacity: 0.55 }, { scale: 1.7, opacity: 0, duration: 0.5, ease: "power2.out" })
            .call(() => apply({ ...st.set }), undefined, "<")
            .to(cursor.current, { scale: 1, duration: 0.16, ease: "power1.out" }, "<")
            .to({}, { duration: 0.25 });
        } else {
          const p = { n: 0 };
          const field = st.type;
          t1.to(p, {
            n: st.text.length,
            duration: st.text.length * 0.055,
            ease: "none",
            onUpdate: () => apply({ [field]: st.text.slice(0, Math.round(p.n)) } as Partial<S>),
          }).to({}, { duration: 0.25 });
        }
      }
      tl.current = t1;
    }, stage);
    return () => {
      tl.current = null;
      ctx.revert();
    };
  }, [ch, reduced, script, apply, pos]);

  function toggle() {
    const next = !paused;
    setPaused(next);
    if (next) tl.current?.pause();
    else if (visible.current) tl.current?.play();
  }

  const active = (i: number) => i === ch;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
      {/* Capítulos */}
      <div>
        <ol className="border-t border-ivory">
          {t.chapters.map((c, i) => (
            <li key={c.title} className="border-b border-line">
              <button
                type="button"
                onClick={() => setCh(i)}
                aria-current={active(i) ? "step" : undefined}
                className={`group relative block w-full py-4 text-left transition ${active(i) ? "" : "text-muted hover:text-ivory"}`}
              >
                <span className="flex items-baseline gap-4">
                  <span className={`font-mono text-[11px] tabular-nums ${active(i) ? "text-gold" : ""}`}>0{i + 1}</span>
                  <span className="font-display text-[21px] leading-tight">{c.title}</span>
                </span>
                {active(i) && <span className="mt-2 block pl-[34px] text-[15px] leading-7 text-ivory/75">{c.text}</span>}
                {active(i) && !reduced && (
                  <span className="absolute inset-x-0 -bottom-px h-px bg-line">
                    <span ref={bar} className="block h-px origin-left scale-x-0 bg-ivory" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="mono-label">{t.note}</p>
          {!reduced && (
            <button type="button" onClick={toggle} className="btn btn-secondary btn-sm">
              {paused ? t.play : t.pause}
            </button>
          )}
        </div>
      </div>

      {/* Ecrã simulado */}
      <div ref={wrap} className="order-first mx-auto w-full max-w-[380px] lg:order-none">
        <div style={{ height: H * scale }} className="relative">
          <div
            ref={stage}
            aria-hidden
            style={{ width: W, height: H, transform: `scale(${scale})` }}
            className="sheet-shadow absolute left-0 top-0 origin-top-left select-none overflow-hidden border border-ivory bg-ink text-ivory"
          >
            <Screen s={s} t={t} />
            {/* Cursor e onda do clique */}
            {!reduced && (
              <>
                <div ref={ring} className="pointer-events-none absolute left-0 top-0 z-50 -ml-5 -mt-5 h-10 w-10 rounded-full border border-gold opacity-0" />
                <div ref={cursor} className="pointer-events-none absolute left-0 top-0 z-50 opacity-0 will-change-transform">
                  <svg width="20" height="22" viewBox="0 0 20 22" className="-ml-[3px] -mt-[2px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]">
                    <path d="M3 2l13.5 11.2-6.1.6 3.6 6.8-2.7 1.4-3.6-6.9L3 19.4z" fill="var(--color-ink-2)" stroke="var(--color-ivory)" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const lbl = "font-mono text-[9.5px] uppercase tracking-[0.08em]";

function Screen({ s, t }: { s: S; t: TourTexts }) {
  const u = t.ui;
  return (
    <div className="flex h-full flex-col">
      {/* Cabeçalho */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-4">
        <span className="font-display text-[17px]">Entrega</span>
        <span className={`${lbl} truncate pl-3 text-muted`}>{t.office}</span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden px-4 pt-4">
        {s.tab === "dash" && <Dash s={s} t={t} />}
        {s.tab === "clients" && <Clients s={s} t={t} />}
        {s.tab === "settings" && <Settings s={s} t={t} />}

        {/* Mensagem pronta (folha que sobe) */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 border-t border-ivory bg-ink-2 px-4 pb-4 pt-3 transition-transform duration-300 ${s.sheet ? "translate-y-0" : "translate-y-full"}`}
        >
          <p className={`${lbl} text-muted`}>{u.via}</p>
          <p className="mt-1.5 text-[12px] text-muted">
            {u.to}: <span className="text-ivory">{t.clients[0]}</span>
          </p>
          <p className="mt-2.5 whitespace-pre-line border border-line bg-ink px-3 py-2.5 text-[11.5px] leading-[1.55] text-ivory/85">{u.message}</p>
          <div className="mt-3 flex justify-end">
            <span data-t="send" className="btn btn-whatsapp btn-sm pointer-events-none">
              {u.send}
            </span>
          </div>
        </div>
      </div>

      {/* Barra inferior, com o ícone da aba ativa preenchido */}
      <div className="grid h-14 shrink-0 grid-cols-3 border-t border-ivory/80 bg-ink">
        {(
          [
            ["dash", u.nav.dashboard, IconLedger],
            ["clients", u.nav.clients, IconClients],
            ["settings", u.nav.settings, IconSettings],
          ] as const
        ).map(([k, label, Icon]) => (
          <span key={k} data-t={`tab-${k}`} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${s.tab === k ? "font-medium text-ivory" : "text-muted"}`}>
            <Icon className="h-[19px] w-[19px]" active={s.tab === k} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Dash({ s, t }: { s: S; t: TourTexts }) {
  const u = t.ui;
  const n = t.docs.length;
  type Row = { name: string; got: number; sent: number; status: string; tone: string };
  const rows: Row[] = s.fresh
    ? t.clients.slice(0, 5).map((name) => ({ name, got: 0, sent: 0, status: u.pending, tone: "text-muted" }))
    : [
        { name: t.clients[0], got: 1, sent: 0, status: u.late, tone: "text-bad" },
        s.confirmed
          ? { name: t.clients[1], got: n, sent: 0, status: u.delivered, tone: "text-ok" }
          : { name: t.clients[1], got: n - 1, sent: 1, status: u.awaiting, tone: "text-warn" },
        { name: t.clients[2], got: 2, sent: 0, status: u.pending, tone: "text-muted" },
        { name: t.clients[3], got: n, sent: 0, status: u.delivered, tone: "text-ok" },
        { name: t.clients[4], got: 0, sent: 0, status: u.pending, tone: "text-muted" },
      ];
  const states = (r: Row): DocState[] => Array.from({ length: n }, (_, i) => (i < r.got ? "received" : i < r.got + r.sent ? "sent" : "pending"));

  return (
    <div>
      <p className={`${lbl} text-muted`}>{u.periodEyebrow}</p>
      <p className="mt-1 font-display text-[28px] leading-none">{u.month}</p>

      {!s.created ? (
        <div className="mt-6 border border-ivory/40 bg-ink-2 p-4">
          <p className="flex items-start gap-2.5 text-[13.5px] font-medium">
            <DocMark state="pending" className="mt-0.5 h-3 w-3" /> {u.createAll}
          </p>
          <p className="mt-1.5 pl-[22px] text-[11.5px] leading-[1.5] text-muted">{u.createHint}</p>
          <div className="mt-3 flex justify-end">
            <span data-t="create" className="btn btn-primary btn-sm">{u.create}</span>
          </div>
        </div>
      ) : (
        <ul className="mt-5 border-t border-ivory">
          {rows.map((r, i) => (
            <li
              key={r.name}
              className={`border-b border-line py-2.5 ${s.fresh ? "animate-rise" : ""}`}
              style={s.fresh ? { animationDelay: `${i * 70}ms` } : undefined}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[13.5px] font-medium">{r.name}</span>
                {i === 0 && !s.fresh && (
                  s.reminded ? (
                    <span className="shrink-0 font-mono text-[10px] text-muted">{u.reminded}</span>
                  ) : (
                    <span data-t="remind" className="btn btn-secondary btn-sm shrink-0 !px-2.5 !py-1 !text-[11.5px]">{u.remind}</span>
                  )
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <DocStrip states={states(r)} />
                  <span className="font-mono text-[10px] text-muted tabular-nums">{r.got}/{n}</span>
                </span>
                <span className={`${lbl} ${r.tone}`}>{r.status}</span>
              </div>
              {i === 1 && !s.fresh && (
                <>
                  <span data-t="docs" className="mt-1.5 inline-block text-[11px] text-muted underline decoration-line-strong underline-offset-2">{u.showDocs}</span>
                  {s.expanded && (
                    <ul className="mt-2 space-y-1.5 border-l border-line pl-3">
                      {t.docs.map((d, k) => {
                        const st: DocState = k < n - 1 || s.confirmed ? "received" : "sent";
                        return (
                          <li key={d} className="flex items-center justify-between gap-2 text-[11.5px]">
                            <span className="flex min-w-0 items-center gap-2">
                              <DocMark state={st} className="h-3 w-3" animate={k === n - 1 && s.confirmed} />
                              <span className="truncate">{d}</span>
                            </span>
                            {st === "sent" ? (
                              <span data-t="confirm" className="btn btn-primary btn-sm shrink-0 !px-2 !py-0.5 !text-[10.5px]">{u.confirm}</span>
                            ) : (
                              <span className={`${lbl} shrink-0 text-muted`}>{u.docStatus[st]}</span>
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
      )}
    </div>
  );
}

function Clients({ s, t }: { s: S; t: TourTexts }) {
  const u = t.ui;
  if (s.openClient !== null) {
    const i = s.openClient;
    return (
      <div>
        <p className="text-[12px] text-muted">← {u.back}</p>
        <p className="mt-3 font-display text-[26px] leading-tight">{t.clients[i]}</p>
        <div className="mt-5 space-y-3">
          {[t.clients[i], t.phones[i]].map((v) => (
            <div key={v} className="border border-line-strong bg-ink-2 px-3 py-2 text-[13px]">{v}</div>
          ))}
        </div>
        <div className="mt-6 border-t border-line pt-4">
          <span data-t="archive" className="btn btn-secondary btn-sm">{u.archive}</span>
        </div>
      </div>
    );
  }
  const list = t.clients.map((name, i) => ({ name, i })).filter((c) => !s.archived.includes(c.i));
  const arch = t.clients.map((name, i) => ({ name, i })).filter((c) => s.archived.includes(c.i));
  return (
    <div>
      <p className="font-display text-[28px] leading-none">{u.clientsTitle}</p>
      <ul className="mt-4 divide-y divide-line border border-line bg-ink-2">
        {list.map((c) => (
          <li key={c.name} data-t={`client-${c.i}`} className="flex animate-fade items-center gap-2.5 px-3 py-2 [animation-duration:.3s]">
            <span className="grid h-7 w-7 shrink-0 place-items-center border border-line-strong font-display text-[12px]">{c.name.charAt(0)}</span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium">{c.name}</span>
              <span className="block truncate font-mono text-[9.5px] text-muted">{t.phones[c.i]}</span>
            </span>
          </li>
        ))}
      </ul>
      {arch.length > 0 && (
        <div className="mt-3">
          <span data-t="archived-toggle" className={`${lbl} inline-block py-1 text-muted`}>
            {u.archived} ({arch.length}) {s.showArchived ? "▴" : "▾"}
          </span>
          {s.showArchived && (
            <ul className="mt-1 border border-line">
              {arch.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-2 px-3 py-2 text-[12.5px] text-muted">
                  <span className="truncate">{c.name}</span>
                  <span data-t={`unarchive-${c.i}`} className="btn btn-secondary btn-sm shrink-0 !px-2 !py-0.5 !text-[10.5px]">{u.unarchive}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Settings({ s, t }: { s: S; t: TourTexts }) {
  const u = t.ui;
  const caret = <span className="ml-px inline-block h-[13px] w-px translate-y-[2px] animate-pulse bg-ivory" />;
  const people = [
    { name: t.member.existing, access: u.access.admin, status: u.status.active, fresh: false },
    ...(s.invited ? [{ name: t.member.name, access: u.access.member, status: u.status.invited, fresh: true }] : []),
  ];
  return (
    <div>
      <p className="font-display text-[28px] leading-none">{u.settingsTitle}</p>
      <p className={`${lbl} mt-5 text-muted`}>{u.teamTitle}</p>
      <ul className="mt-2 border-t border-line">
        {people.map((p) => (
          <li key={p.name} className={`flex items-center justify-between gap-2 border-b border-line py-2 text-[12.5px] ${p.fresh ? "animate-rise" : ""}`}>
            <span className="min-w-0 truncate font-medium">{p.name}</span>
            <span className={`${lbl} shrink-0 ${p.fresh ? "text-warn" : "text-muted"}`}>
              {p.access} · {p.status}
            </span>
          </li>
        ))}
      </ul>
      {s.invited ? (
        <p className="mt-3 animate-fade text-[11.5px] text-ok">{u.invitedFlash}</p>
      ) : (
        <div className="mt-4 space-y-2.5 border border-line bg-ink-2 p-3">
          <p className="text-[12.5px] font-medium">{u.add}</p>
          {(["name", "email"] as const).map((f) => (
            <label key={f} className="block">
              <span className="block text-[10.5px] text-muted">{f === "name" ? u.name : u.email}</span>
              <span
                data-t={`f-${f}`}
                className={`mt-0.5 block h-8 border bg-ink px-2.5 py-1.5 text-[12.5px] ${s.focus === f ? "border-ivory" : "border-line-strong"}`}
              >
                {s[f]}
                {s.focus === f && caret}
              </span>
            </label>
          ))}
          <div className="grid grid-cols-3 gap-1.5">
            {(["none", "member", "admin"] as const).map((a) => (
              <span
                key={a}
                data-t={`acc-${a}`}
                className={`border px-1.5 py-1.5 text-center text-[10.5px] ${s.access === a ? "border-ivory bg-ink-3/60 font-medium" : "border-line text-muted"}`}
              >
                {u.access[a]}
              </span>
            ))}
          </div>
          <span data-t="add" className="btn btn-primary btn-sm w-full">{u.add}</span>
        </div>
      )}
    </div>
  );
}
