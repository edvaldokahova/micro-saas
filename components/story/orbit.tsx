"use client";

// Passos em órbita: os números dos capítulos deslizam sobre um arco à medida que se desce,
// o capítulo atual fica ao centro com um ponto aceso, e o texto do passo aparece por baixo.
// A posição contínua (p = capítulo + progresso) chega por drive.current(p), sem re-render do React.
import { useEffect, useRef, useState } from "react";

export function Orbit({
  steps,
  active,
  onPick,
  drive,
  bleed = "all",
}: {
  bleed?: "all" | "mobile";
  steps: { title: string; text: string }[];
  active: number;
  onPick: (i: number) => void;
  drive: { current: ((p: number) => void) | null };
}) {
  const box = useRef<HTMLDivElement>(null);
  const arcs = useRef<SVGSVGElement>(null);
  const nums = useRef<(HTMLButtonElement | null)[]>([]);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const [w, setW] = useState(600);
  const pos = useRef(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Geometria: um círculo grande cujo topo é o arco visível
  const R = Math.max(w * 1.15, 620);
  const cx = w / 2;
  const cy = R + 34;
  const step = Math.asin(Math.min(0.9, (Math.min(w, 1400) * 0.3) / R));

  useEffect(() => {
    const place = (p: number) => {
      pos.current = p;
      steps.forEach((_, i) => {
        const d = i - p;
        const a = d * step;
        const n = nums.current[i];
        const dot = dots.current[i];
        const ad = Math.abs(d);
        if (dot) {
          const x = cx + R * Math.sin(a);
          const y = cy - R * Math.cos(a);
          dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${ad < 0.5 ? 1 : 0.7})`;
          dot.style.opacity = String(Math.max(0, 1 - ad * 0.45));
          dot.dataset.on = ad < 0.5 ? "1" : "0";
        }
        if (n) {
          const r2 = R - 104;
          const x = cx + r2 * Math.sin(a);
          const y = cy - r2 * Math.cos(a);
          n.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${(a * 180) / Math.PI}deg) scale(${1 - Math.min(1, ad) * 0.18})`;
          n.style.opacity = String(Math.max(0, 1 - ad * 0.78));
        }
      });
    };
    drive.current = place;
    place(pos.current);
    return () => {
      drive.current = null;
    };
  }, [steps, step, R, cx, cy, drive]);

  const s = steps[Math.max(0, active)];
  return (
    <div className="w-full text-center">
      <div
        ref={box}
        className={`relative ml-[calc(50%-50vw)] h-[180px] w-screen overflow-hidden sm:h-[235px] ${bleed === "mobile" ? "lg:ml-0 lg:w-full" : ""}`}
        aria-hidden
      >
        <svg ref={arcs} className="absolute inset-0 h-full w-full" fill="none">
          <defs>
            <linearGradient id="orbit-fade" x1="0" x2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="0.5" stopColor="currentColor" stopOpacity="1" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={R} stroke="url(#orbit-fade)" strokeWidth="1" className="text-gold/70" />
          <circle cx={cx} cy={cy} r={R - 215} stroke="url(#orbit-fade)" strokeWidth="1" className="text-line-strong" />
        </svg>
        {steps.map((st, i) => (
          <span
            key={`d${st.title}`}
            ref={(el) => { dots.current[i] = el; }}
            className="absolute left-0 top-0 h-3 w-3 rounded-full border border-gold bg-ink transition-[background-color,box-shadow] duration-300 data-[on='1']:bg-gold data-[on='1']:shadow-[0_0_14px_3px_color-mix(in_oklab,var(--color-gold)_55%,transparent)]"
          />
        ))}
        {steps.map((st, i) => (
          <button
            key={`n${st.title}`}
            ref={(el) => { nums.current[i] = el; }}
            type="button"
            tabIndex={-1}
            onClick={() => onPick(i)}
            className="absolute left-0 top-0 text-[64px] font-semibold leading-none tracking-[-0.04em] tabular-nums [font-variation-settings:'wdth'_84] sm:text-[88px]"
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 16 22" className="mx-auto mt-1 h-5 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
        <path d="M8 2v18M2.5 9.5L8 14l5.5-4.5" />
      </svg>
      <div key={active} className="mx-auto mt-3 min-h-[5.6rem] max-w-[34rem] animate-rise px-4 [animation-duration:.5s]" aria-live="polite">
        <p className="text-[19px] font-semibold leading-tight tracking-[-0.015em] sm:text-[22px]">{s.title}</p>
        <p className="mt-2 text-[15px] leading-[1.6] text-muted sm:text-[16.5px]">{s.text}</p>
      </div>
      {/* Acesso por teclado e leitores de ecrã */}
      <div className="sr-only">
        {steps.map((st, i) => (
          <button key={st.title} type="button" onClick={() => onPick(i)}>
            {i + 1}. {st.title}
          </button>
        ))}
      </div>
    </div>
  );
}
