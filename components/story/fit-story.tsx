"use client";

// «Para quem é»: uma secção fixa em que o scroll é o relógio, como nas outras histórias da página.
// Os três pontos entram um a um: primeiro o círculo com três pontinhos («a vir»), depois o ícone
// desenha-se traço a traço, o texto sobe e o fio desce até ao ponto seguinte.
// Tudo é desenhado aqui (SVG próprio, sem bibliotecas de ícones). Com "reduzir movimento"
// nada fica fixo e os três pontos aparecem já completos.
import { useEffect, useRef, type ReactNode } from "react";
import { clamp01 } from "./engine";
import { useScrub } from "./use-scrub";

export type FitTexts = { title: string; points: { title: string; text: string }[] };

const STEP = 2.4; // segundos de "filme" por ponto
const FIRST = 0.5; // quando o primeiro ponto começa
const TOTAL = FIRST + STEP * 2 + 2.6;

const out = (x: number) => 1 - Math.pow(1 - x, 3);
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/* ---------- Ícones: traços que se desenham (pathLength=1) ---------- */

// Um traço que se desenha entre os instantes s e e (0..1) do ícone
function P({ d, s = 0, e = 1, className, strokeWidth }: { d: string; s?: number; e?: number; className?: string; strokeWidth?: number }) {
  return <path d={d} pathLength={1} data-s={s} data-e={e} className={className} strokeWidth={strokeWidth} strokeDasharray="1" />;
}

// Internet (o link) e e-mail: as duas formas de o cliente enviar
function IconChannels() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <P s={0} e={0.45} d="M14 5a8 8 0 1 1 0 16a8 8 0 1 1 0-16z" />
      <P s={0.25} e={0.6} d="M14 5c-2.4 2.2-3.6 4.9-3.6 8s1.2 5.8 3.6 8c2.4-2.2 3.6-4.9 3.6-8s-1.2-5.8-3.6-8z" />
      <P s={0.4} e={0.65} d="M6 13h16" />
      <P s={0.45} e={0.85} d="M21.5 21h10a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 19 29.5v-6a2.5 2.5 0 0 1 2.5-2.5z" />
      <P s={0.75} e={1} d="M19.8 23.4l6.7 4.8 6.7-4.8" />
    </svg>
  );
}

// Relógio com o ponteiro a dar a volta e uma faísca: começa no mesmo dia
function IconSameDay() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <P s={0} e={0.7} d="M20 12a11 11 0 1 1 0 22a11 11 0 1 1 0-22z" />
      <P s={0.5} e={0.8} d="M16.5 6.5h7M20 6.5V12" />
      <g data-spin={-300} style={{ transformOrigin: "20px 23px" }} data-pop={0.35}>
        <path d="M20 23v-6.5" />
      </g>
      <path d="M20 23l4 2.4" data-pop={0.45} />
      <circle cx="20" cy="23" r="1.2" fill="currentColor" stroke="none" data-pop={0.4} />
      <P s={0.7} e={1} d="M32 5.5c.4 2.6 1.9 4.1 4.5 4.5-2.6.4-4.1 1.9-4.5 4.5-.4-2.6-1.9-4.1-4.5-4.5 2.6-.4 4.1-1.9 4.5-4.5z" />
    </svg>
  );
}

// Lista curta: dois já entregues, um ainda em falta
function IconEssential() {
  const ok = "text-ok";
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <P s={0} e={0.55} d="M12 6h16a5 5 0 0 1 5 5v18a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V11a5 5 0 0 1 5-5z" />
      <P s={0.5} e={0.75} d="M13.5 25.4a2.8 2.8 0 1 1 0 5.6a2.8 2.8 0 1 1 0-5.6z" className="opacity-45" />
      <P s={0.55} e={0.8} d="M19.5 14.2h8M19.5 21.2h8M19.5 28.2h4.5" />
      <P s={0.35} e={0.62} d="M11.6 14.3l1.6 1.7 2.8-3.4" className={ok} strokeWidth={1.8} />
      <P s={0.45} e={0.72} d="M11.6 21.3l1.6 1.7 2.8-3.4" className={ok} strokeWidth={1.8} />
    </svg>
  );
}

const ICONS: ReactNode[] = [<IconChannels key="a" />, <IconSameDay key="b" />, <IconEssential key="c" />];

/* ---------- Secção ---------- */

type Nodes = { circle: HTMLElement; dots: HTMLElement; icon: SVGElement; title: HTMLElement; body: HTMLElement; line: HTMLElement | null; track: HTMLElement | null };

export function FitStory({ t }: { t: FitTexts }) {
  const pin = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const nodes = useRef<Nodes[] | null>(null);

  function get(): Nodes[] {
    if (nodes.current) return nodes.current;
    const items = Array.from(list.current?.querySelectorAll<HTMLElement>("[data-item]") ?? []);
    nodes.current = items.map((li) => ({
      circle: li.querySelector<HTMLElement>("[data-circle]")!,
      dots: li.querySelector<HTMLElement>("[data-dots]")!,
      icon: li.querySelector<SVGElement>("svg")!,
      title: li.querySelector<HTMLElement>("[data-title]")!,
      body: li.querySelector<HTMLElement>("[data-body]")!,
      line: li.querySelector<HTMLElement>("[data-line]"),
      track: li.querySelector<HTMLElement>("[data-track]"),
    }));
    return nodes.current;
  }

  function draw(time: number) {
    get().forEach((n, i) => {
      const R = FIRST + STEP * i; // quando este ponto se revela
      // O círculo chega com os pontinhos, ainda antes do texto
      const pend = i === 0 ? 1 : out(seg(time, R - 1.1, R - 0.55));
      n.circle.style.opacity = String(pend);
      n.circle.style.transform = `scale(${0.88 + 0.12 * pend})`;
      const dots = pend * (1 - seg(time, R - 0.05, R + 0.2));
      n.dots.style.opacity = String(dots);
      // Realce enquanto é a sua vez; depois descansa
      const a = out(seg(time, R, R + 0.5)) * (1 - 0.65 * seg(time, R + STEP - 0.2, R + STEP + 0.4));
      n.circle.style.borderColor = `color-mix(in oklab, var(--color-ivory) ${Math.round(a * 100)}%, var(--color-line-strong))`;
      n.circle.style.boxShadow = `0 0 0 ${(7 * a).toFixed(2)}px color-mix(in oklab, var(--color-ivory) ${(7 * a).toFixed(2)}%, transparent)`;
      // O ícone desenha-se
      drawIcon(n.icon, out(seg(time, R + 0.1, R + 1.3)));
      // Texto
      const tt = out(seg(time, R + 0.15, R + 0.85));
      const bb = out(seg(time, R + 0.3, R + 1.1));
      reveal(n.title, tt);
      reveal(n.body, bb);
      // Fio até ao ponto seguinte
      if (n.line) n.line.style.transform = `scaleY(${out(seg(time, R + 1.2, R + 2.0))})`;
      if (n.track) n.track.style.opacity = String(out(seg(time, R + STEP - 1.1, R + STEP - 0.55)));
    });
  }

  const { reduced } = useScrub({ pin, total: TOTAL, draw, vhPerSecond: 0.3 });

  // Sem movimento: tudo completo, sem fixar a secção
  useEffect(() => {
    if (reduced) draw(TOTAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <section id="para-quem-e" className="border-t border-line">
      <div ref={pin} className={`relative ${reduced ? "py-24" : "h-[100svh] pt-[76px]"}`}>
        <div className="mx-auto grid h-full max-w-6xl content-center gap-9 px-5 pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-20">
          <h2 data-split="chars" className="max-w-[17ch] font-display text-[clamp(2rem,5vw,3.9rem)] leading-[1.02]">
            {t.title}
          </h2>
          <ol ref={list}>
            {t.points.map((p, i) => (
              <li key={p.title} data-item className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-5">
                <div className="flex flex-col items-center">
                  <span
                    data-circle
                    className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border border-line-strong bg-ink sm:h-16 sm:w-16"
                  >
                    <span className="block h-[30px] w-[30px] sm:h-[34px] sm:w-[34px]">{ICONS[i]}</span>
                  </span>
                  {i < t.points.length - 1 && (
                    <span className="relative my-1 w-px flex-1 min-h-6" aria-hidden>
                      <span data-track className="absolute inset-0 bg-line-strong" />
                      <span data-line className="absolute inset-0 origin-top bg-ivory/70" />
                    </span>
                  )}
                </div>
                <div className={`relative ${i < t.points.length - 1 ? "pb-7 sm:pb-9" : ""}`}>
                  <span data-dots className="fit-dots absolute left-0 top-[1.6rem] flex gap-1.5 opacity-0 sm:top-[1.9rem]" aria-hidden>
                    <span /> <span /> <span />
                  </span>
                  <h3 data-title className="pt-3.5 text-[19px] font-semibold leading-tight tracking-[-0.015em] sm:pt-4 sm:text-[22px]">
                    {p.title}
                  </h3>
                  <p data-body className="mt-2 max-w-[44ch] text-[15px] leading-[1.6] text-muted sm:text-[16.5px]">
                    {p.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// Texto que sobe e ganha nitidez
function reveal(el: HTMLElement, k: number) {
  el.style.opacity = String(k);
  el.style.transform = `translateY(${(1 - k) * 14}px)`;
  el.style.filter = k >= 1 ? "" : `blur(${((1 - k) * 4).toFixed(2)}px)`;
}

// Traços entre s e e; elementos com data-pop surgem a partir desse instante; data-spin gira até 0
function drawIcon(svg: SVGElement, p: number) {
  svg.querySelectorAll<SVGElement>("[data-s]").forEach((el) => {
    const s = Number(el.dataset.s);
    const e = Number(el.dataset.e);
    const k = clamp01((p - s) / (e - s));
    el.style.strokeDashoffset = String(1 - k);
    el.style.opacity = k > 0 ? "" : "0";
  });
  svg.querySelectorAll<SVGElement>("[data-pop]").forEach((el) => {
    const at = Number(el.dataset.pop);
    const k = out(clamp01((p - at) / 0.2));
    const spin = el.dataset.spin ? Number(el.dataset.spin) * (1 - out(clamp01((p - at) / 0.65))) : 0;
    el.style.opacity = String(k);
    if (el.dataset.spin) el.style.transform = `rotate(${spin}deg)`;
    else {
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = "center";
      el.style.transform = `scale(${0.4 + 0.6 * k})`;
    }
  });
}
