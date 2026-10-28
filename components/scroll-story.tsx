"use client";

// "Como funciona", contado pelo próprio painel e controlado pelo scroll.
// A secção fica fixa e o scroll é a linha do tempo: um cursor faz as seis tarefas do mês
// (criar pedidos, a página do cliente, lembrar, confirmar, arquivar, convidar), para a frente e
// para trás ao ritmo de quem lê. Tudo o que se vê é derivado do tempo t, por isso andar para trás
// desfaz exatamente o que andar para a frente fez.
// GSAP ScrollTrigger fixa a secção e suaviza o scroll (scrub); "reduzir movimento" desliga a fixação
// e mostra o resultado de cada tarefa ao tocar no capítulo.
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IconClients, IconLedger, IconSettings } from "@/components/icons";
import { DocMark, DocStrip, type DocState } from "@/components/marks";

gsap.registerPlugin(ScrollTrigger);

export type StoryTexts = {
  title: string;
  lead: string;
  note: string;
  office: string;
  chapters: { title: string; text: string }[];
  clients: string[]; // 6
  phones: string[]; // 6
  docs: string[]; // 3
  member: { name: string; email: string; existing: string };
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
    settingsTitle: string;
    teamTitle: string;
    add: string;
    name: string;
    email: string;
    access: { none: string; member: string; admin: string };
    status: { invited: string; active: string };
    invitedFlash: string;
  };
  client: {
    link: string;
    hello: string;
    intro: string;
    markSent: string;
    howSent: string;
    vias: { whatsapp: string; email: string };
    sentVia: string;
    received: string;
    pending: string;
  };
};

/* ---------- Estado do ecrã ---------- */

type Access = "none" | "member" | "admin";
type S = {
  tab: "dash" | "clients" | "settings" | "client";
  created: boolean;
  fresh: boolean;
  clientStep: 0 | 1 | 2;
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

const BASE: S = {
  tab: "dash", created: true, fresh: false, clientStep: 0, sheet: false, reminded: false, expanded: false, confirmed: false,
  openClient: null, archived: [], showArchived: false, focus: null, name: "", email: "", access: "none", invited: false,
};

type Step = { tap: string; set?: Partial<S> } | { type: "name" | "email"; text: string } | { wait: number };

function script(member: StoryTexts["member"]): { start: S; steps: Step[] }[] {
  return [
    { start: { ...BASE, created: false }, steps: [{ tap: "create", set: { created: true, fresh: true } }, { wait: 0.6 }] },
    {
      start: { ...BASE, tab: "client" },
      steps: [{ tap: "cs-2", set: { clientStep: 1 } }, { tap: "via-email", set: { clientStep: 2 } }, { wait: 0.4 }],
    },
    { start: BASE, steps: [{ tap: "remind", set: { sheet: true } }, { wait: 0.9 }, { tap: "send", set: { sheet: false, reminded: true } }] },
    {
      start: { ...BASE, reminded: true },
      steps: [{ tap: "docs", set: { expanded: true } }, { wait: 0.2 }, { tap: "confirm", set: { confirmed: true } }, { wait: 0.4 }],
    },
    {
      start: { ...BASE, reminded: true, confirmed: true },
      steps: [
        { tap: "tab-clients", set: { tab: "clients" } },
        { tap: "client-5", set: { openClient: 5 } },
        { tap: "archive", set: { archived: [5], openClient: null } },
        { tap: "archived-toggle", set: { showArchived: true } },
        { tap: "unarchive-5", set: { archived: [], showArchived: false } },
      ],
    },
    {
      start: { ...BASE, reminded: true, confirmed: true, tab: "clients" },
      steps: [
        { tap: "tab-settings", set: { tab: "settings" } },
        { tap: "f-name", set: { focus: "name" } },
        { type: "name", text: member.name },
        { tap: "f-email", set: { focus: "email" } },
        { type: "email", text: member.email },
        { tap: "acc-member", set: { access: "member", focus: null } },
        { tap: "add", set: { invited: true } },
        { wait: 0.4 },
      ],
    },
  ];
}

/* ---------- Linha do tempo (segundos de "filme") ---------- */

const MOVE = 0.8; // deslocação do cursor até ao alvo
const AFTER = 0.5; // pausa depois de cada clique
const CHAR = 0.045; // por letra escrita
const PAD_IN = 0.4;
const PAD_OUT = 0.9;

type Tap = { target: string; at: number; set: Partial<S> };
type Op = { at: number; end: number; apply: (s: S, t: number) => S };
type Chapter = { start: S; t0: number; t1: number; taps: Tap[]; ops: Op[] };

function compile(chs: { start: S; steps: Step[] }[]) {
  let t = 0;
  const out: Chapter[] = chs.map((c) => {
    const t0 = t;
    t += PAD_IN;
    const taps: Tap[] = [];
    const ops: Op[] = [];
    for (const st of c.steps) {
      if ("wait" in st) t += st.wait;
      else if ("tap" in st) {
        const at = t + MOVE;
        const set = st.set ?? {};
        taps.push({ target: st.tap, at, set });
        ops.push({ at, end: at, apply: (s) => ({ ...s, ...set }) });
        t = at + AFTER;
      } else {
        const a = t;
        const b = t + st.text.length * CHAR;
        const field = st.type;
        const text = st.text;
        ops.push({ at: a, end: b, apply: (s, now) => ({ ...s, [field]: text.slice(0, Math.round(text.length * Math.min(1, (now - a) / (b - a)))) }) });
        t = b + 0.3;
      }
    }
    t += PAD_OUT;
    return { start: c.start, t0, t1: t, taps, ops };
  });
  return { chapters: out, total: t };
}

function stateAt(c: Chapter, t: number): S {
  return c.ops.reduce((s, op) => (t >= op.at ? op.apply(s, t) : s), c.start);
}
function finalState(c: Chapter): S {
  return stateAt(c, c.t1);
}

/* ---------- Componente ---------- */

const W = 380; // tamanho lógico do ecrã simulado
const H = 620;
const REST = { x: W * 0.7, y: H * 0.66 };
const ease = gsap.parseEase("power2.inOut");

export function ScrollStory({ t }: { t: StoryTexts }) {
  const [film] = useState(() => compile(script(t.member)));
  const [s, setS] = useState<S>(film.chapters[0].start);
  const [ch, setCh] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [scale, setScale] = useState(0.8);
  const pin = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]); // computador
  const dots = useRef<(HTMLSpanElement | null)[]>([]); // telemóvel
  const st = useRef<ScrollTrigger | null>(null);
  const last = useRef({ key: "", ch: -1 });
  const cache = useRef(new Map<string, { x: number; y: number }>());

  // Escala o ecrã ao espaço disponível (é HTML, por isso fica nítido em qualquer tamanho)
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.max(0.5, Math.min(1.05, width / W, height > 200 ? height / H : 1)));
      cache.current.clear();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" }, (ctx) => {
      const { still } = ctx.conditions as { motion: boolean; still: boolean };
      setReduced(still);
      if (still) {
        setS(finalState(film.chapters[0]));
        return;
      }
      ScrollTrigger.config({ ignoreMobileResize: true });
      const proxy = { t: 0 };
      const ends = [0, ...film.chapters.map((c) => (c.t1 - PAD_OUT * 0.4) / film.total), 1];
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin.current,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 0.75 * film.chapters.length)}`,
          pin: true,
          scrub: 0.6,
          snap: { snapTo: ends, duration: { min: 0.2, max: 0.7 }, delay: 0.12, ease: "power1.inOut" },
          invalidateOnRefresh: true,
          onRefresh: () => cache.current.clear(),
        },
      });
      tl.to(proxy, { t: film.total, duration: film.total, ease: "none", onUpdate: () => frame(proxy.t) });
      st.current = tl.scrollTrigger ?? null;
      frame(0);
      return () => {
        st.current = null;
      };
    });
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [film]);

  // Desenha o instante t: ecrã, cursor, clique e progresso dos capítulos
  function frame(time: number) {
    const found = film.chapters.findIndex((c) => time < c.t1);
    const idx = found === -1 ? film.chapters.length - 1 : found;
    const c = film.chapters[idx];
    const next = stateAt(c, time);
    const key = `${idx}|${JSON.stringify(next)}`;
    if (key !== last.current.key) {
      last.current.key = key;
      flushSync(() => setS(next));
    }
    if (idx !== last.current.ch) {
      last.current.ch = idx;
      setCh(idx);
    }
    film.chapters.forEach((cc, i) => {
      const p = i < idx ? 1 : i > idx ? 0 : Math.min(1, Math.max(0, (time - cc.t0) / (cc.t1 - cc.t0 - PAD_OUT * 0.4)));
      for (const b of [bars.current[i], dots.current[i]]) if (b) b.style.transform = `scaleX(${p})`;
    });
    drawCursor(c, idx, time);
  }

  function measure(id: string) {
    const root = stage.current;
    const el = root?.querySelector<HTMLElement>(`[data-t="${id}"]`);
    if (!root || !el) return null;
    const a = root.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const k = a.width / W;
    return { x: (b.left - a.left + b.width / 2) / k, y: (b.top - a.top + b.height / 2) / k };
  }

  function drawCursor(c: Chapter, idx: number, time: number) {
    const cur = cursor.current;
    const rg = ring.current;
    if (!cur || !rg) return;
    const posOf = (k: number) => {
      const key = `${idx}:${k}`;
      return cache.current.get(key) ?? null;
    };
    let x = REST.x;
    let y = REST.y;
    const k = c.taps.findIndex((tp) => time < tp.at);
    if (k === -1) {
      const p = c.taps.length ? posOf(c.taps.length - 1) : null;
      if (p) ({ x, y } = p);
    } else {
      const tp = c.taps[k];
      const from = k === 0 ? REST : posOf(k - 1) ?? REST;
      const to = measure(tp.target);
      if (to) cache.current.set(`${idx}:${k}`, to);
      const target = to ?? posOf(k) ?? from;
      const q = Math.min(1, Math.max(0, (time - (tp.at - MOVE)) / MOVE));
      const e = ease(q);
      x = from.x + (target.x - from.x) * e;
      y = from.y + (target.y - from.y) * e;
    }
    // Clique: o cursor encolhe por um instante e sai uma onda no ponto tocado
    const near = c.taps.find((tp) => time >= tp.at - 0.1 && time <= tp.at + 0.55);
    const dip = near && time <= near.at + 0.12 ? 0.84 : 1;
    gsap.set(cur, { x, y, scale: dip, autoAlpha: time > c.t0 + 0.05 ? 1 : 0 });
    if (near && time >= near.at) {
      const q = (time - near.at) / 0.55;
      const p = posOf(c.taps.indexOf(near)) ?? { x, y };
      gsap.set(rg, { x: p.x, y: p.y, scale: 0.3 + 1.4 * q, autoAlpha: 0.5 * (1 - q) });
    } else gsap.set(rg, { autoAlpha: 0 });
  }

  function go(i: number) {
    if (reduced) {
      setCh(i);
      setS(finalState(film.chapters[i]));
      return;
    }
    const tr = st.current;
    if (!tr) return;
    const c = film.chapters[i];
    const p = (c.t0 + 0.01) / film.total;
    window.scrollTo({ top: tr.start + (tr.end - tr.start) * p, behavior: "smooth" });
  }

  const active = ch;

  return (
    <section id="como-funciona" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-5 pt-28 sm:pt-36">
        <h2 className="max-w-[18ch] font-display text-[clamp(2.2rem,5vw,3.9rem)] leading-[1.02]">{t.title}</h2>
        <p className="mt-5 max-w-[52ch] text-[17px] leading-[1.6] text-muted">{t.lead}</p>
      </div>

      <div ref={pin} className={`relative ${reduced ? "" : "h-[100svh]"}`}>
        <div className="mx-auto grid h-full max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-5 px-5 pb-5 pt-[88px] lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:grid-rows-1 lg:items-center lg:gap-20 lg:pb-8 lg:pt-[92px]">
          {/* Capítulos */}
          <div>
            {/* Telemóvel: só o capítulo ativo, com uma barra por capítulo */}
            <div className="lg:hidden">
              <div className="flex gap-1.5" aria-hidden>
                {film.chapters.map((_, i) => (
                  <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
                    <span ref={(el) => { dots.current[i] = el; }} className="block h-full origin-left scale-x-0 rounded-full bg-ivory" />
                  </span>
                ))}
              </div>
              <div key={active} className="mt-4 min-h-[5.5rem] animate-fade [animation-duration:.35s]">
                <p className="text-[19px] font-semibold leading-tight tracking-[-0.01em]">
                  <span className="mr-2 text-muted tabular-nums">{active + 1}.</span>
                  {t.chapters[active].title}
                </p>
                <p className="mt-1.5 text-[14.5px] leading-[1.5] text-muted">{t.chapters[active].text}</p>
              </div>
            </div>

            {/* Computador: a lista toda; o capítulo ativo abre o texto e mostra o progresso */}
            <ol className="hidden lg:block">
              {t.chapters.map((c, i) => {
                const on = i === active;
                return (
                  <li key={c.title} className="relative border-t border-line">
                    <button type="button" onClick={() => go(i)} aria-current={on ? "step" : undefined} className="block w-full py-5 text-left">
                      <span className={`flex items-baseline gap-4 transition-colors duration-300 ${on ? "text-ivory" : "text-muted hover:text-ivory"}`}>
                        <span className="w-5 shrink-0 text-[14px] tabular-nums">{i + 1}</span>
                        <span className="text-[22px] font-semibold leading-tight tracking-[-0.015em]">{c.title}</span>
                      </span>
                      <span className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                        <span className="overflow-hidden">
                          <span className="block max-w-[44ch] pl-9 pt-2 text-[16px] leading-[1.6] text-muted">{c.text}</span>
                        </span>
                      </span>
                    </button>
                    <span className="absolute inset-x-0 top-[-1px] h-px overflow-hidden" aria-hidden>
                      <span ref={(el) => { bars.current[i] = el; }} className="block h-px origin-left scale-x-0 bg-ivory" />
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-6 hidden text-[13px] text-muted lg:block">{t.note}</p>
          </div>

          {/* Ecrã do Bilonai */}
          <div ref={holder} className={`relative flex min-h-0 items-start justify-center lg:h-[min(640px,82vh)] lg:items-center ${reduced ? "h-[520px]" : "h-full"}`}>
            <div style={{ width: W * scale, height: H * scale }} className="relative shrink-0">
              <div
                ref={stage}
                aria-hidden
                style={{ width: W, height: H, transform: `scale(${scale})` }}
                className="sheet-shadow absolute left-0 top-0 origin-top-left select-none overflow-hidden rounded-[28px] border border-line-strong bg-ink text-ivory"
              >
                <Screen s={s} t={t} />
                {!reduced && (
                  <>
                    <div ref={ring} className="pointer-events-none invisible absolute left-0 top-0 z-50 -ml-5 -mt-5 h-10 w-10 rounded-full border-2 border-gold" />
                    <div ref={cursor} className="pointer-events-none invisible absolute left-0 top-0 z-50 will-change-transform">
                      <svg width="20" height="22" viewBox="0 0 20 22" className="-ml-[3px] -mt-[2px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]">
                        <path d="M3 2l13.5 11.2-6.1.6 3.6 6.8-2.7 1.4-3.6-6.9L3 19.4z" fill="#121316" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {reduced && (
        <div className="mx-auto max-w-6xl px-5 pb-10 lg:hidden">
          <div className="flex flex-wrap gap-2">
            {t.chapters.map((c, i) => (
              <button key={c.title} type="button" onClick={() => go(i)} className={`btn btn-sm ${i === active ? "btn-primary" : "btn-secondary"}`}>
                {i + 1}. {c.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- O ecrã simulado (mesmos textos e marcas do painel real) ---------- */

const small = "text-[11px] font-medium";

function Screen({ s, t }: { s: S; t: StoryTexts }) {
  const u = t.ui;
  if (s.tab === "client") return <ClientPage s={s} t={t} />;
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
        <span className="text-[15px] font-semibold tracking-[-0.01em]">Bilonai</span>
        <span className="truncate pl-3 text-[11.5px] text-muted">{t.office}</span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden px-4 pt-4">
        {s.tab === "dash" && <Dash s={s} t={t} />}
        {s.tab === "clients" && <Clients s={s} t={t} />}
        {s.tab === "settings" && <Settings s={s} t={t} />}

        {/* Mensagem pronta: sobe do fundo */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 rounded-t-[20px] border-t border-line bg-ink-2 px-4 pb-4 pt-3 shadow-[0_-12px_30px_-18px_rgba(18,19,22,0.35)] transition-transform duration-300 ease-out ${s.sheet ? "translate-y-0" : "translate-y-[105%]"}`}
        >
          <span className="mx-auto mb-2 block h-1 w-9 rounded-full bg-line-strong" />
          <p className={`${small} text-muted`}>{u.via}</p>
          <p className="mt-1 text-[12px] text-muted">
            {u.to}: <span className="text-ivory">{t.clients[0]}</span>
          </p>
          <p className="mt-2.5 whitespace-pre-line rounded-xl bg-ink-3 px-3 py-2.5 text-[11.5px] leading-[1.55] text-ivory/90">{u.message}</p>
          <div className="mt-3 flex justify-end">
            <span data-t="send" className="btn btn-primary btn-sm">{u.send}</span>
          </div>
        </div>
      </div>

      <div className="grid h-14 shrink-0 grid-cols-3 border-t border-line bg-ink-2">
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

function ClientPage({ s, t }: { s: S; t: StoryTexts }) {
  const c = t.client;
  return (
    <div className="flex h-full flex-col bg-ink-2">
      <div className="flex h-12 shrink-0 items-center justify-center border-b border-line px-4">
        <span className="truncate rounded-full bg-ink-3 px-3 py-1 text-[11px] text-muted">{c.link}</span>
      </div>
      <div className="flex-1 px-5 pt-6">
        <p className="text-[11.5px] text-muted">{t.office}</p>
        <p className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em]">{c.hello}</p>
        <p className="mt-2 text-[12.5px] leading-[1.5] text-muted">{c.intro}</p>
        <ul className="mt-5 divide-y divide-line rounded-2xl border border-line">
          {t.docs.map((d, i) => {
            const state: DocState = i < t.docs.length - 1 ? "received" : s.clientStep === 2 ? "sent" : "pending";
            return (
              <li key={d} className="px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5 text-[13px]">
                    <DocMark state={state} className="h-3.5 w-3.5" animate={state === "sent"} />
                    <span className="truncate">{d}</span>
                  </span>
                  {state === "received" && <span className={`${small} shrink-0 text-ok`}>{c.received}</span>}
                  {state === "sent" && <span className={`${small} shrink-0 text-gold`}>{c.sentVia}</span>}
                  {state === "pending" && s.clientStep === 0 && (
                    <span data-t={`cs-${i}`} className="btn btn-primary btn-sm shrink-0 !min-h-0 !px-3 !py-1.5 !text-[11.5px]">{c.markSent}</span>
                  )}
                </div>
                {state === "pending" && s.clientStep === 1 && (
                  <div className="mt-2.5 animate-fade [animation-duration:.25s]">
                    <p className="text-[11px] text-muted">{c.howSent}</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      <span className="rounded-full border border-line-strong py-1.5 text-center text-[11.5px]">{c.vias.whatsapp}</span>
                      <span data-t="via-email" className="rounded-full border border-line-strong py-1.5 text-center text-[11.5px]">{c.vias.email}</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Dash({ s, t }: { s: S; t: StoryTexts }) {
  const u = t.ui;
  const n = t.docs.length;
  type Row = { name: string; got: number; sent: number; status: string; tone: string };
  const rows: Row[] = s.fresh
    ? t.clients.slice(0, 5).map((name) => ({ name, got: 0, sent: 0, status: u.pending, tone: "text-muted" }))
    : [
        { name: t.clients[0], got: 1, sent: 0, status: u.late, tone: "text-bad" },
        s.confirmed
          ? { name: t.clients[1], got: n, sent: 0, status: u.delivered, tone: "text-ok" }
          : { name: t.clients[1], got: n - 1, sent: 1, status: u.awaiting, tone: "text-gold" },
        { name: t.clients[2], got: 2, sent: 0, status: u.pending, tone: "text-muted" },
        { name: t.clients[3], got: n, sent: 0, status: u.delivered, tone: "text-ok" },
        { name: t.clients[4], got: 0, sent: 0, status: u.pending, tone: "text-muted" },
      ];
  const states = (r: Row): DocState[] => Array.from({ length: n }, (_, i) => (i < r.got ? "received" : i < r.got + r.sent ? "sent" : "pending"));

  return (
    <div>
      <p className="text-[11.5px] text-muted">{u.periodEyebrow}</p>
      <p className="mt-0.5 text-[27px] font-semibold leading-none tracking-[-0.025em] [font-variation-settings:'wdth'_84]">{u.month}</p>

      {!s.created ? (
        <div className="mt-6 rounded-2xl border border-line bg-ink-2 p-4">
          <p className="flex items-start gap-2.5 text-[13.5px] font-medium">
            <DocMark state="pending" className="mt-0.5 h-3.5 w-3.5" /> {u.createAll}
          </p>
          <p className="mt-1.5 pl-6 text-[11.5px] leading-[1.5] text-muted">{u.createHint}</p>
          <div className="mt-3 flex justify-end">
            <span data-t="create" className="btn btn-primary btn-sm">{u.create}</span>
          </div>
        </div>
      ) : (
        <ul className="mt-4 rounded-2xl border border-line bg-ink-2 px-3.5">
          {rows.map((r, i) => (
            <li key={r.name} className={`border-b border-line py-2.5 last:border-b-0 ${s.fresh ? "animate-rise" : ""}`} style={s.fresh ? { animationDelay: `${i * 70}ms` } : undefined}>
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[13.5px] font-medium">{r.name}</span>
                {i === 0 && !s.fresh && (s.reminded ? (
                  <span className="shrink-0 text-[11px] text-muted">{u.reminded}</span>
                ) : (
                  <span data-t="remind" className="btn btn-secondary btn-sm shrink-0 !min-h-0 !px-3 !py-1 !text-[11.5px]">{u.remind}</span>
                ))}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <DocStrip states={states(r)} />
                  <span className="text-[10.5px] text-muted tabular-nums">{r.got}/{n}</span>
                </span>
                <span className={`${small} ${r.tone}`}>{r.status}</span>
              </div>
              {i === 1 && !s.fresh && (
                <>
                  <span data-t="docs" className="mt-1.5 inline-block text-[11px] text-muted underline decoration-line-strong underline-offset-2">{u.showDocs}</span>
                  {s.expanded && (
                    <ul className="mt-2 space-y-1.5 rounded-xl bg-ink-3/70 p-2.5">
                      {t.docs.map((d, k) => {
                        const st: DocState = k < n - 1 || s.confirmed ? "received" : "sent";
                        return (
                          <li key={d} className="flex items-center justify-between gap-2 text-[11.5px]">
                            <span className="flex min-w-0 items-center gap-2">
                              <DocMark state={st} className="h-3 w-3" animate={k === n - 1 && s.confirmed} />
                              <span className="truncate">{d}</span>
                            </span>
                            {st === "sent" ? (
                              <span data-t="confirm" className="btn btn-primary btn-sm shrink-0 !min-h-0 !px-2.5 !py-0.5 !text-[10.5px]">{u.confirm}</span>
                            ) : (
                              <span className={`${small} shrink-0 text-muted`}>{u.docStatus[st]}</span>
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

function Clients({ s, t }: { s: S; t: StoryTexts }) {
  const u = t.ui;
  if (s.openClient !== null) {
    const i = s.openClient;
    return (
      <div>
        <p className="text-[12px] text-muted">‹ {u.clientsTitle}</p>
        <p className="mt-3 text-[25px] font-semibold leading-tight tracking-[-0.02em]">{t.clients[i]}</p>
        <div className="mt-5 space-y-2.5">
          {[t.clients[i], t.phones[i]].map((v) => (
            <div key={v} className="rounded-[10px] border border-line-strong bg-ink-2 px-3 py-2 text-[13px]">{v}</div>
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
      <p className="text-[27px] font-semibold leading-none tracking-[-0.025em] [font-variation-settings:'wdth'_84]">{u.clientsTitle}</p>
      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-ink-2">
        {list.map((c) => (
          <li key={c.name} data-t={`client-${c.i}`} className="flex items-center gap-2.5 px-3 py-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-3 text-[12px] font-semibold">{c.name.charAt(0)}</span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium">{c.name}</span>
              <span className="block truncate text-[10.5px] text-muted tabular-nums">{t.phones[c.i]}</span>
            </span>
          </li>
        ))}
      </ul>
      {arch.length > 0 && (
        <div className="mt-3">
          <span data-t="archived-toggle" className={`${small} inline-block py-1 text-muted`}>
            {u.archived} ({arch.length}) {s.showArchived ? "▴" : "▾"}
          </span>
          {s.showArchived && (
            <ul className="mt-1 rounded-2xl border border-line">
              {arch.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-2 px-3 py-2 text-[12.5px] text-muted">
                  <span className="truncate">{c.name}</span>
                  <span data-t={`unarchive-${c.i}`} className="btn btn-secondary btn-sm shrink-0 !min-h-0 !px-2.5 !py-0.5 !text-[10.5px]">{u.unarchive}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Settings({ s, t }: { s: S; t: StoryTexts }) {
  const u = t.ui;
  const caret = <span className="ml-px inline-block h-[13px] w-px translate-y-[2px] animate-pulse bg-ivory" />;
  const people = [
    { name: t.member.existing, access: u.access.admin, status: u.status.active, fresh: false },
    ...(s.invited ? [{ name: t.member.name, access: u.access.member, status: u.status.invited, fresh: true }] : []),
  ];
  return (
    <div>
      <p className="text-[27px] font-semibold leading-none tracking-[-0.025em] [font-variation-settings:'wdth'_84]">{u.settingsTitle}</p>
      <p className={`${small} mt-5 text-muted`}>{u.teamTitle}</p>
      <ul className="mt-2 rounded-2xl border border-line bg-ink-2 px-3">
        {people.map((p) => (
          <li key={p.name} className={`flex items-center justify-between gap-2 border-b border-line py-2 text-[12.5px] last:border-b-0 ${p.fresh ? "animate-rise" : ""}`}>
            <span className="min-w-0 truncate font-medium">{p.name}</span>
            <span className={`${small} shrink-0 ${p.fresh ? "text-gold" : "text-muted"}`}>
              {p.access}, {p.status.toLowerCase()}
            </span>
          </li>
        ))}
      </ul>
      {s.invited ? (
        <p className="mt-3 animate-fade text-[12px] text-ok">{u.invitedFlash}</p>
      ) : (
        <div className="mt-4 space-y-2.5 rounded-2xl border border-line bg-ink-2 p-3">
          <p className="text-[12.5px] font-medium">{u.add}</p>
          {(["name", "email"] as const).map((f) => (
            <label key={f} className="block">
              <span className="block text-[10.5px] text-muted">{f === "name" ? u.name : u.email}</span>
              <span data-t={`f-${f}`} className={`mt-0.5 block h-8 rounded-[10px] border bg-ink px-2.5 py-1.5 text-[12.5px] ${s.focus === f ? "border-ivory" : "border-line-strong"}`}>
                {s[f]}
                {s.focus === f && caret}
              </span>
            </label>
          ))}
          <div className="grid grid-cols-3 gap-1.5">
            {(["none", "member", "admin"] as const).map((a) => (
              <span key={a} data-t={`acc-${a}`} className={`rounded-[10px] border px-1.5 py-1.5 text-center text-[10.5px] ${s.access === a ? "border-ivory bg-ink-3 font-medium" : "border-line text-muted"}`}>
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
