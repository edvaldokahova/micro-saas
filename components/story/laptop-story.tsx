"use client";

// "Como funciona" no escritório: ao chegar à secção, um portátil abre a tampa, o logótipo desenha-se
// no ecrã e começa a gravação do painel. O scroll é o relógio: o cursor faz cada tarefa e a câmara
// aproxima-se nos momentos que importam (como nas gravações de produto), para a frente e para trás.
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { Wordmark } from "@/components/logo";
import { Captions } from "./captions";
import { DeskScreen, deskScript, DH, DW, type DeskState, type DeskTexts } from "./desk";
import { cameraAt, chapterAt, clamp01, compile, ease, measure, PAD_OUT, pointerAt, stateAt, type Pt } from "./engine";
import { useScrub } from "./use-scrub";

export type LaptopTexts = { title: string; lead: string; note: string; chapters: { title: string; text: string }[]; desk: DeskTexts };

// Portátil em unidades lógicas: ecrã 1280 × 800 dentro da tampa, base por baixo
const BEZEL = 22;
const LID_W = DW + BEZEL * 2;
const LID_H = DH + BEZEL * 2;
const BASE_W = LID_W + 150;
const BASE_H = 24;
const LW = BASE_W;
const LH = LID_H + BASE_H + 30;

const OPEN = 2.4; // tampa a abrir
const LOGO = 2.6; // logótipo a desenhar-se
const INTRO = OPEN + LOGO;
const REST: Pt = { x: DW * 0.62, y: DH * 0.7 };
const OVERVIEW: Pt = { x: DW / 2, y: DH / 2 };

export function LaptopStory({ t }: { t: LaptopTexts }) {
  const film = useMemo(() => compile(deskScript(t.desk.member), INTRO), [t.desk.member]);
  const [s, setS] = useState<DeskState>(film.chapters[0].start);
  const [ch, setCh] = useState(0);
  const [scale, setScale] = useState(0.3);
  const pin = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const lid = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const cache = useRef(new Map<string, Pt>());
  const last = useRef({ key: "", ch: -2 });
  const logoTl = useRef<gsap.core.Timeline | null>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  // Escala do portátil ao espaço disponível
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.max(0.18, Math.min(0.92, width / LW, height / LH)));
      cache.current.clear();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animação de entrada do logótipo (a timeline fica parada; o scroll controla o progresso)
  useEffect(() => {
    const el = logo.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });
      tl.from(".lg-ring", { rotation: "-=150", svgOrigin: "300 72", opacity: 0, duration: 1, stagger: 0.12, ease: "expo.out" })
        .from(".lg-dot", { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(3)" }, "-=0.7")
        .from(".lg-letter", { opacity: 0, y: 26, duration: 0.6, stagger: 0.05, ease: "power3.out" }, "-=0.55")
        .from(".lg-tag", { opacity: 0, y: 10, duration: 0.5, ease: "power2.out" }, "-=0.3");
      logoTl.current = tl;
    }, el);
    return () => ctx.revert();
  }, []);

  function draw(time: number) {
    // 1. Tampa e corpo
    const open = ease(clamp01(time / OPEN));
    if (lid.current) lid.current.style.transform = `rotateX(${-90 + 90 * open}deg)`;
    if (body.current) body.current.style.transform = `translateY(${(1 - open) * 60}px) scale(${0.86 + 0.14 * open})`;
    // 2. Logótipo
    const lp = clamp01((time - OPEN + 0.3) / (LOGO - 0.6));
    logoTl.current?.progress(lp);
    if (logo.current) logo.current.style.opacity = String(1 - clamp01((time - (INTRO - 0.45)) / 0.45));
    // 3. Painel
    const idx = time < INTRO ? -1 : chapterAt(film, time);
    const c = film.chapters[Math.max(0, idx)];
    const next = idx < 0 ? c.start : stateAt(c, time);
    const key = JSON.stringify(next);
    if (key !== last.current.key) {
      last.current.key = key;
      flushSync(() => setS(next));
    }
    if (idx !== last.current.ch) {
      last.current.ch = idx;
      setCh(Math.max(0, idx));
    }
    film.chapters.forEach((cc, i) => {
      const p = idx < 0 ? 0 : i < idx ? 1 : i > idx ? 0 : clamp01((time - cc.t0) / (cc.t1 - cc.t0 - PAD_OUT * 0.5));
      const b = bars.current[i];
      if (b) b.style.transform = `scaleX(${p})`;
    });
    // 4. Cursor e câmara (em coordenadas do ecrã do portátil)
    const base = Math.min(2.6, Math.max(1, 0.5 / scaleRef.current));
    const root = content.current;
    const cur = cursor.current;
    const rg = ring.current;
    if (!root || !cur || !rg) return;
    if (idx < 0) {
      gsap.set(cur, { autoAlpha: 0 });
      gsap.set(rg, { autoAlpha: 0 });
      setCamera(root, base, OVERVIEW);
      return;
    }
    const ptr = pointerAt(c, idx, time, REST, cache.current, (id) => measureLogical(id));
    const cam = cameraAt(c, idx, time, base, cache.current, OVERVIEW);
    setCamera(root, cam.z, cam.f);
    gsap.set(cur, { x: ptr.p.x, y: ptr.p.y, scale: ptr.press ? 0.82 : 1, autoAlpha: time > c.t0 + 0.05 ? 1 : 0 });
    if (ptr.ring) gsap.set(rg, { x: ptr.ring.at.x, y: ptr.ring.at.y, scale: 0.3 + 1.5 * ptr.ring.q, autoAlpha: 0.55 * (1 - ptr.ring.q) });
    else gsap.set(rg, { autoAlpha: 0 });
  }

  // Mede no ecrã sem zoom: a posição lógica não depende da câmara
  function measureLogical(id: string) {
    return measure(content.current, id, DW);
  }

  function setCamera(root: HTMLElement, z: number, f: Pt) {
    const tx = Math.min(0, Math.max(DW - DW * z, DW / 2 - f.x * z));
    const ty = Math.min(0, Math.max(DH - DH * z, DH / 2 - f.y * z));
    root.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
  }

  const { reduced, seek } = useScrub({
    pin,
    total: film.total,
    draw,
    vhPerSecond: 0.32,
    onRefresh: () => cache.current.clear(),
  });

  // Sem movimento: portátil aberto e o resultado de cada capítulo ao tocar
  useEffect(() => {
    if (!reduced) return;
    if (lid.current) lid.current.style.transform = "none";
    if (body.current) body.current.style.transform = "none";
    if (logo.current) logo.current.style.opacity = "0";
    const c = film.chapters[ch];
    setS(stateAt(c, c.t1));
    bars.current.forEach((b, i) => b && (b.style.transform = `scaleX(${i <= ch ? 1 : 0})`));
  }, [reduced, ch, film]);

  const pick = (i: number) => (reduced ? setCh(i) : seek(film.chapters[i].t0 + 0.02));

  return (
    <section id="como-funciona" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-5 pt-28 text-center sm:pt-40">
        <h2 data-split="chars" className="mx-auto max-w-[18ch] font-display text-[clamp(2.3rem,5.4vw,4.4rem)] leading-[1.0]">
          {t.title}
        </h2>
        <p data-split="lines" className="mx-auto mt-5 max-w-[52ch] text-[17px] leading-[1.6] text-muted sm:text-[19px]">
          {t.lead}
        </p>
      </div>

      <div ref={pin} className={`relative flex flex-col ${reduced ? "py-10" : "h-[100svh] pb-6 pt-[84px]"}`}>
        <div ref={holder} className={`relative flex min-h-0 flex-1 items-center justify-center px-4 ${reduced ? "h-[60vw] max-h-[640px]" : ""}`}>
          <div style={{ width: LW * scale, height: LH * scale }} className="relative shrink-0">
            <div style={{ width: LW, height: LH, transform: `scale(${scale})` }} className="absolute left-0 top-0 origin-top-left">
              <div ref={body} className="absolute inset-0 will-change-transform" style={{ perspective: "2600px", perspectiveOrigin: "50% 90%" }}>
                {/* Tampa: frente (ecrã) e costas (alumínio com o logótipo) */}
                <div
                  ref={lid}
                  className="absolute top-0 will-change-transform"
                  style={{ left: (LW - LID_W) / 2, width: LID_W, height: LID_H, transformOrigin: "50% 100%", transformStyle: "preserve-3d", transform: "rotateX(-90deg)" }}
                >
                  <div className="absolute inset-0 rounded-t-[30px] rounded-b-[8px] bg-[#0b0c0e] p-[22px] shadow-[0_0_0_1.5px_#a7abb2]" style={{ backfaceVisibility: "hidden" }}>
                    <span className="absolute left-1/2 top-[8px] h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-[#1e2a3a]" />
                    <div className="relative h-full w-full overflow-hidden rounded-[8px] bg-ink">
                      <div ref={content} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: DW, height: DH }}>
                        <DeskScreen s={s} t={t.desk} />
                        {!reduced && (
                          <>
                            <div ref={ring} className="pointer-events-none invisible absolute left-0 top-0 z-50 -ml-6 -mt-6 h-12 w-12 rounded-full border-2 border-gold" />
                            <div ref={cursor} className="pointer-events-none invisible absolute left-0 top-0 z-50 will-change-transform">
                              <svg width="26" height="28" viewBox="0 0 20 22" className="-ml-[3px] -mt-[2px] drop-shadow-[0_3px_4px_rgba(0,0,0,0.3)]">
                                <path d="M3 2l13.5 11.2-6.1.6 3.6 6.8-2.7 1.4-3.6-6.9L3 19.4z" fill="#121316" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </>
                        )}
                      </div>
                      {/* Arranque: o logótipo desenha-se */}
                      <div ref={logo} className="absolute inset-0 z-[60] grid place-items-center bg-[#0b0c0e]" style={{ opacity: reduced ? 0 : 1 }}>
                        <div className="text-center text-white">
                          <Wordmark className="h-[64px] w-auto" />
                          <p className="lg-tag mt-6 text-[20px] text-white/55">{t.desk.office}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 grid place-items-center rounded-t-[30px] rounded-b-[8px] text-[#6b7079]"
                    style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)", background: "linear-gradient(180deg,#e4e6e9,#c4c8ce)" }}
                  >
                    <svg viewBox="-45 -45 90 90" className="h-[120px] w-[120px]" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden>
                      <circle r="40" strokeWidth="6" strokeDasharray="205 46.33" transform="rotate(-60)" />
                      <circle r="25" strokeWidth="5" strokeDasharray="120 37.08" transform="rotate(120)" />
                      <circle r="9" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                </div>
                {/* Base */}
                <div className="absolute left-0" style={{ top: LID_H, width: BASE_W, height: BASE_H }}>
                  <div className="h-full w-full rounded-b-[22px] rounded-t-[4px]" style={{ background: "linear-gradient(180deg,#d9dce0 0%,#c3c7cd 45%,#9da2aa 100%)" }} />
                  <span className="absolute left-1/2 top-0 h-[9px] w-[220px] -translate-x-1/2 rounded-b-[10px] bg-[#a9aeb5]" />
                  <span className="absolute inset-x-[6%] -bottom-[18px] h-[18px] rounded-[50%] bg-black/25 blur-[14px]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl shrink-0 px-5 pt-5">
          <Captions chapters={t.chapters} active={ch} onPick={pick} bars={bars} />
          <p className="mt-3 text-center text-[12.5px] text-muted">{t.note}</p>
        </div>
      </div>
    </section>
  );
}
