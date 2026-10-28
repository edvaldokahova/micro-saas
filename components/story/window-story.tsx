"use client";

// "Como funciona" no escritório: uma janela de navegador 16:9 com o painel do Bilonai.
// O scroll é o relógio: o cursor (seta, mão ou barra de texto, conforme o que está por baixo)
// faz cada tarefa e a câmara aproxima-se nos momentos que importam, para a frente e para trás.
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { CursorSprites, showCursor, type CursorKind } from "./cursor";
import { DeskScreen, deskScript, DH, DW, type DeskState, type DeskTexts } from "./desk";
import { cameraAt, chapterAt, clamp01, compile, ease, measure, MOVE, PAD_OUT, pointerAt, stateAt, type Pt } from "./engine";
import { Orbit } from "./orbit";
import { useScrub } from "./use-scrub";

export type WindowTexts = { title: string; lead: string; note: string; chapters: { title: string; text: string }[]; desk: DeskTexts; art?: React.ReactNode };

const BAR = 52; // barra do navegador
const WW = DW;
const WH = DH + BAR;
const ENTER = 0.9;
const REST: Pt = { x: DW * 0.64, y: DH * 0.72 };
const OVERVIEW: Pt = { x: DW / 2, y: DH / 2 };
const PATHS: Record<DeskState["tab"], string> = { dash: "/app", clients: "/app/clientes", settings: "/app/definicoes" };

export function WindowStory({ t }: { t: WindowTexts }) {
  const film = useMemo(() => compile(deskScript(t.desk.member), ENTER), [t.desk.member]);
  const [s, setS] = useState<DeskState>(film.chapters[0].start);
  const [ch, setCh] = useState(0);
  const [scale, setScale] = useState(0.3);
  const pin = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const orbit = useRef<((p: number) => void) | null>(null);
  const cache = useRef(new Map<string, Pt>());
  const last = useRef({ key: "", ch: -1, kind: "" });
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.max(0.2, Math.min(0.95, width / WW, height / WH)));
      cache.current.clear();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function draw(time: number) {
    // Entrada discreta da janela
    const e = ease(clamp01(time / ENTER));
    if (win.current) {
      win.current.style.transform = `translateY(${(1 - e) * 48}px) scale(${0.94 + 0.06 * e})`;
      win.current.style.opacity = String(0.35 + 0.65 * e);
    }
    const idx = chapterAt(film, time);
    const c = film.chapters[idx];
    const next = time < ENTER ? c.start : stateAt(c, time);
    const key = JSON.stringify(next);
    if (key !== last.current.key) {
      last.current.key = key;
      flushSync(() => setS(next));
    }
    if (idx !== last.current.ch) {
      last.current.ch = idx;
      setCh(idx);
    }
    const local = clamp01((time - c.t0) / (c.t1 - c.t0 - PAD_OUT * 0.5));
    orbit.current?.(Math.min(film.chapters.length - 1, idx + smoothStep(local)));

    const root = content.current;
    const cur = cursor.current;
    const rg = ring.current;
    if (!root || !cur || !rg) return;
    const base = Math.min(2.4, Math.max(1, 0.48 / scaleRef.current));
    const ptr = pointerAt(c, idx, time, REST, cache.current, (id) => measure(root, id, DW));
    const cam = cameraAt(c, idx, time, base, cache.current, OVERVIEW);
    const tx = Math.min(0, Math.max(DW - DW * cam.z, DW / 2 - cam.f.x * cam.z));
    const ty = Math.min(0, Math.max(DH - DH * cam.z, DH / 2 - cam.f.y * cam.z));
    root.style.transform = `translate(${tx}px, ${ty}px) scale(${cam.z})`;
    gsap.set(cur, { x: ptr.p.x, y: ptr.p.y, scale: ptr.press ? 0.86 : 1, autoAlpha: time > ENTER ? 1 : 0 });
    if (ptr.ring) gsap.set(rg, { x: ptr.ring.at.x, y: ptr.ring.at.y, scale: 0.3 + 1.5 * ptr.ring.q, autoAlpha: 0.5 * (1 - ptr.ring.q) });
    else gsap.set(rg, { autoAlpha: 0 });

    // Que cursor mostrar: mão sobre o que se clica, barra sobre campos de texto, seta no resto
    const kind = cursorKind(c.taps, time);
    if (kind !== last.current.kind) {
      last.current.kind = kind;
      showCursor(cur, kind);
    }
  }

  const { reduced, seek } = useScrub({ pin, total: film.total, draw, vhPerSecond: 0.3, onRefresh: () => cache.current.clear() });

  useEffect(() => {
    if (!reduced) return;
    const c = film.chapters[ch];
    setS(stateAt(c, c.t1));
    orbit.current?.(ch);
  }, [reduced, ch, film]);

  const pick = (i: number) => (reduced ? setCh(i) : seek(film.chapters[i].t0 + 0.02));

  return (
    <section id="como-funciona" className="scroll-mt-16">
      <div className="mx-auto grid max-w-6xl items-end gap-10 px-5 pt-28 sm:pt-40 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h2 data-split="chars" className="max-w-[18ch] font-display text-[clamp(2.3rem,5.4vw,4.4rem)] leading-[1.0]">
            {t.title}
          </h2>
          <p data-split="lines" className="mt-5 max-w-[52ch] text-[17px] leading-[1.6] text-muted sm:text-[19px]">
            {t.lead}
          </p>
        </div>
        <div className="hidden lg:block">{t.art}</div>
      </div>

      <div ref={pin} className={`relative flex flex-col justify-center ${reduced ? "py-10" : "h-[100svh] pb-4 pt-[80px]"}`}>
        <div ref={holder} className="relative mx-4 flex aspect-[1280/772] max-h-[calc(100svh-380px)] min-h-0 items-center justify-center lg:mx-0 lg:aspect-auto lg:max-h-none lg:flex-1 lg:px-4">
          <div style={{ width: WW * scale, height: WH * scale }} className="relative shrink-0">
            <div style={{ width: WW, height: WH, transform: `scale(${scale})` }} className="absolute left-0 top-0 origin-top-left">
              <div
                ref={win}
                className="h-full w-full overflow-hidden rounded-[16px] border border-black/10 bg-ink shadow-[0_2px_4px_rgba(18,19,22,0.06),0_40px_90px_-30px_rgba(18,19,22,0.45)] will-change-transform"
              >
                <BrowserBar path={PATHS[s.tab]} />
                <div className="relative overflow-hidden" style={{ width: DW, height: DH }}>
                  <div ref={content} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: DW, height: DH }}>
                    <DeskScreen s={s} t={t.desk} />
                    {!reduced && (
                      <>
                        <div ref={ring} className="pointer-events-none invisible absolute left-0 top-0 z-50 -ml-6 -mt-6 h-12 w-12 rounded-full border-2 border-gold" />
                        <div ref={cursor} className="pointer-events-none invisible absolute left-0 top-0 z-50 will-change-transform">
                          <CursorSprites />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 px-5 pt-4">
          <Orbit steps={t.chapters} active={ch} onPick={pick} drive={orbit} />
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-5 pb-6 text-center text-[12.5px] text-muted">{t.note}</p>
    </section>
  );
}

// Passagem suave de um capítulo para o seguinte (o número só desliza no fim do capítulo)
function smoothStep(local: number) {
  const a = clamp01((local - 0.82) / 0.18);
  return a * a * (3 - 2 * a);
}

function cursorKind(taps: { target: string; at: number }[], time: number): CursorKind {
  const field = (id: string) => id.startsWith("f-");
  const near = taps.find((tp) => time >= tp.at - MOVE * 0.3 && time <= tp.at + 0.35);
  if (near) return field(near.target) ? "text" : "hand";
  // Depois de clicar num campo, enquanto escreve, fica a barra de texto
  const prev = [...taps].reverse().find((tp) => tp.at <= time);
  const next = taps.find((tp) => tp.at > time);
  if (prev && field(prev.target) && (!next || time < next.at - MOVE)) return "text";
  return "arrow";
}

// Barra do navegador: semáforo, setas, endereço com cadeado
function BrowserBar({ path }: { path: string }) {
  return (
    <div className="relative flex items-center gap-4 border-b border-line bg-ink-3 px-5" style={{ height: BAR }}>
      <span className="flex gap-2">
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} className="h-3 w-3 rounded-full" style={{ background: c, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.2)" }} />
        ))}
      </span>
      <span className="flex gap-3 text-muted" aria-hidden>
        <svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2L2 7l5 5" /></svg>
        <svg width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".45"><path d="M2 2l5 5-5 5" /></svg>
      </span>
      <span className="absolute left-1/2 top-1/2 flex h-[32px] w-[460px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-[9px] bg-ink-2 text-[13px] text-ivory/80 shadow-[inset_0_0_0_1px_var(--color-line)]">
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden><rect x="1" y="5" width="8" height="6" rx="1.5" /><path d="M2.8 5V3.6a2.2 2.2 0 0 1 4.4 0V5" /></svg>
        app.bilonai.com{path}
      </span>
      <span className="ml-auto flex gap-4 text-muted" aria-hidden>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 1v8M3.8 4.2L7 1l3.2 3.2M2 8v4h10V8" /></svg>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>
      </span>
    </div>
  );
}
