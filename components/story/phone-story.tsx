"use client";

// O lado do cliente, num iPhone 17: chega a mensagem, o cliente toca, abre a página do pedido
// e assinala o que já enviou. O scroll é o relógio; o toque aparece como um círculo de dedo.
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { Captions } from "./captions";
import { chapterAt, clamp01, compile, ease, measure, PAD_OUT, pointerAt, stateAt, type Pt } from "./engine";
import { IPhone, PH, PhoneScreen, phoneScript, PW, type PhoneState, type PhoneTexts } from "./phone";
import { useScrub } from "./use-scrub";

export type PhoneStoryTexts = { title: string; lead: string; chapters: { title: string; text: string }[]; phone: PhoneTexts };

const FW = PW + 24;
const FH = PH + 24;
const ENTER = 1.2;
const REST: Pt = { x: PW * 0.7, y: PH * 0.8 };

export function PhoneStory({ t }: { t: PhoneStoryTexts }) {
  const film = useMemo(() => compile(phoneScript(), ENTER), []);
  const [s, setS] = useState<PhoneState>(film.chapters[0].start);
  const [ch, setCh] = useState(0);
  const [scale, setScale] = useState(0.6);
  const pin = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const device = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const finger = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const cache = useRef(new Map<string, Pt>());
  const last = useRef({ key: "", ch: -1 });

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.max(0.3, Math.min(0.82, width / FW, height / FH)));
      cache.current.clear();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function draw(time: number) {
    // Entrada: o telemóvel sobe e endireita-se
    const e = ease(clamp01(time / ENTER));
    if (device.current) device.current.style.transform = `translateY(${(1 - e) * 120}px) rotateX(${(1 - e) * 18}deg) rotateZ(${(1 - e) * -6}deg)`;
    if (device.current) device.current.style.opacity = String(0.2 + 0.8 * e);

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
    film.chapters.forEach((cc, i) => {
      const p = i < idx ? 1 : i > idx ? 0 : clamp01((time - cc.t0) / (cc.t1 - cc.t0 - PAD_OUT * 0.5));
      const b = bars.current[i];
      if (b) b.style.transform = `scaleX(${p})`;
    });
    // Dedo: aparece só perto de cada toque
    const f = finger.current;
    if (!f) return;
    const ptr = pointerAt(c, idx, time, REST, cache.current, (id) => measure(screen.current, id, PW));
    const tap = c.taps.find((tp) => time >= tp.at - 0.45 && time <= tp.at + 0.5);
    if (tap) {
      const at = cache.current.get(`${idx}:${c.taps.indexOf(tap)}`) ?? ptr.p;
      const d = time - tap.at;
      const show = d < 0 ? clamp01((d + 0.45) / 0.3) : 1 - clamp01(d / 0.5);
      gsap.set(f, { x: at.x, y: at.y, autoAlpha: show, scale: d < 0 ? 1.15 - 0.15 * clamp01((d + 0.45) / 0.45) : 0.85 + 0.6 * clamp01(d / 0.5) });
    } else gsap.set(f, { autoAlpha: 0 });
  }

  const { reduced, seek } = useScrub({
    pin,
    total: film.total,
    draw,
    vhPerSecond: 0.34,
    onRefresh: () => cache.current.clear(),
  });

  useEffect(() => {
    if (!reduced) return;
    const c = film.chapters[ch];
    setS(stateAt(c, c.t1));
    bars.current.forEach((b, i) => b && (b.style.transform = `scaleX(${i <= ch ? 1 : 0})`));
  }, [reduced, ch, film]);

  const pick = (i: number) => (reduced ? setCh(i) : seek(film.chapters[i].t0 + 0.02));

  return (
    <section id="lado-do-cliente" className="border-t border-line">
      <div ref={pin} className={`relative ${reduced ? "py-20" : "h-[100svh] pt-[76px]"}`}>
        <div className="mx-auto grid h-full max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 px-5 pb-5 pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:grid-rows-[1fr_1fr] lg:gap-x-16 lg:gap-y-8">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <h2 data-split="chars" className="max-w-[16ch] font-display text-[clamp(1.7rem,4.4vw,3.6rem)] leading-[1.02]">{t.title}</h2>
            <p data-split="lines" className="mt-4 hidden max-w-[44ch] text-[17px] leading-[1.6] text-muted lg:block">{t.lead}</p>
          </div>
          <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-2 lg:self-start">
            <Captions chapters={t.chapters} active={ch} onPick={pick} bars={bars} align="left" />
          </div>
          <div ref={holder} className={`relative flex min-h-0 items-center justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[min(860px,86vh)] ${reduced ? "h-[620px]" : "h-full"}`} style={{ perspective: "1600px" }}>
            <div style={{ width: FW * scale, height: FH * scale }} className="relative shrink-0">
              <div style={{ width: FW, height: FH, transform: `scale(${scale})`, transformOrigin: "0 0" }} className="absolute left-0 top-0">
                <div ref={device} className="will-change-transform" style={{ transformOrigin: "50% 80%" }}>
                  <IPhone screenRef={screen}>
                    <PhoneScreen s={s} t={t.phone} />
                    {!reduced && (
                      <div ref={finger} className="pointer-events-none invisible absolute left-0 top-0 z-50 -ml-7 -mt-7 h-14 w-14 rounded-full border border-white/70 bg-ivory/25 shadow-[0_4px_14px_rgba(0,0,0,0.25)] backdrop-blur-[2px]" />
                    )}
                  </IPhone>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
