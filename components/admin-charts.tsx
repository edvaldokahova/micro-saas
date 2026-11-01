"use client";

// Gráficos do cockpit, desenhados à mão em SVG (sem bibliotecas): linhas com gradiente,
// marcas finas e um aviso ao passar o dedo/rato. As cores seguem o azul do Bilonai.
import { useId, useState } from "react";

/* ---------- Receita por mês (área com linha em gradiente) ---------- */

export type RevenuePoint = { label: string; total: number; earnings: number; count: number };

const W = 640;
const H = 220;
const PAD = { top: 18, right: 10, bottom: 8, left: 10 };

// Curva suave que não ultrapassa os pontos (monotone cubic)
function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : "";
  const d: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  m.push(d[0]);
  for (let i = 1; i < pts.length - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[d.length - 1]);
  let path = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = (x1 - x0) / 3;
    path += ` C${x0 + h},${y0 + m[i] * h} ${x1 - h},${y1 - m[i + 1] * h} ${x1},${y1}`;
  }
  return path;
}

export function RevenueChart({ points, currency }: { points: RevenuePoint[]; currency: "EUR" | "BRL" }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const money = (cents: number) =>
    new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "pt-PT", { style: "currency", currency, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
  const max = Math.max(1, ...points.map((p) => p.total)) * 1.15;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const line = smooth(points.map((p, i) => [x(i), y(p.total)]));
  const area = points.length ? `${line} L${x(points.length - 1)},${H - PAD.bottom} L${x(0)},${H - PAD.bottom} Z` : "";
  const h = hover != null ? points[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="Receita por mês">
        <defs>
          <linearGradient id={`l${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
          <filter id={`g${id}`} x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {/* Grelha discreta */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH * (1 - f)} y2={PAD.top + innerH * (1 - f)} stroke="var(--color-line)" strokeDasharray="2 5" />
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--color-line-strong)" />
        <path d={area} fill={`url(#a${id})`} />
        {/* Brilho por baixo da linha (o toque «futurista», sem exagero) */}
        <path d={line} fill="none" stroke={`url(#l${id})`} strokeWidth="6" opacity="0.35" filter={`url(#g${id})`} />
        <path d={line} fill="none" stroke={`url(#l${id})`} strokeWidth="2.5" strokeLinecap="round" />
        {h && hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--color-line-strong)" />}
        {points.map((p, i) => (
          <circle key={p.label} cx={x(i)} cy={y(p.total)} r={hover === i ? 5.5 : 3.5} fill="var(--color-ink-2)" stroke="#2563eb" strokeWidth="2.2" />
        ))}
        {/* Zonas de toque largas, uma por mês */}
        {points.map((p, i) => (
          <rect
            key={`h${p.label}`}
            x={x(i) - innerW / Math.max(1, points.length - 1) / 2}
            y={0}
            width={innerW / Math.max(1, points.length - 1)}
            height={H}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between px-1 font-mono text-[10.5px] uppercase tracking-wider text-muted">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
      {h && hover != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-xl border border-line bg-ink-2 px-3 py-2 text-[12.5px] shadow-[0_12px_30px_-12px_rgba(18,19,22,0.35)]"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{h.label}</p>
          <p className="mt-0.5 font-semibold tabular-nums">{money(h.total)}</p>
          <p className="text-muted tabular-nums">
            Líquido {money(h.earnings)} · {h.count} {h.count === 1 ? "pagamento" : "pagamentos"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- Escritórios por estado (anel segmentado) ---------- */

export type Segment = { key: string; label: string; value: number; from: string; to: string };

export function OfficesRing({ segments, total, center }: { segments: Segment[]; total: number; center: string }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<string | null>(null);
  const R = 70;
  const C = 2 * Math.PI * R;
  const visible = segments.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? 6 : 0;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative h-[176px] w-[176px] shrink-0">
        <svg viewBox="0 0 176 176" className="h-full w-full -rotate-90" role="img" aria-label="Escritórios por estado">
          <defs>
            {segments.map((s) => (
              <linearGradient key={s.key} id={`${s.key}${id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={s.from} />
                <stop offset="100%" stopColor={s.to} />
              </linearGradient>
            ))}
          </defs>
          <circle cx="88" cy="88" r={R} fill="none" stroke="var(--color-ink-3)" strokeWidth="14" />
          {total > 0 &&
            visible.map((s) => {
              const len = (s.value / total) * C;
              const dash = Math.max(0.001, len - gap);
              const el = (
                <circle
                  key={s.key}
                  cx="88"
                  cy="88"
                  r={R}
                  fill="none"
                  stroke={`url(#${s.key}${id})`}
                  strokeWidth={hover === s.key ? 18 : 14}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-offset - gap / 2}
                  className="transition-[stroke-width] duration-200"
                  onPointerEnter={() => setHover(s.key)}
                  onPointerLeave={() => setHover(null)}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="figure text-[38px] leading-none">{hover ? segments.find((s) => s.key === hover)?.value : total}</p>
            <p className="mt-1 text-[11.5px] text-muted">{hover ? segments.find((s) => s.key === hover)?.label : center}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2.5 text-[14px]">
        {segments.map((s) => (
          <li
            key={s.key}
            onPointerEnter={() => setHover(s.key)}
            onPointerLeave={() => setHover(null)}
            className={`flex items-center justify-between gap-4 rounded-lg px-2 py-1 transition ${hover === s.key ? "bg-ink-3" : ""}`}
          >
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }} aria-hidden />
              {s.label}
            </span>
            <span className="tabular-nums">
              <strong className="font-semibold">{s.value}</strong>
              <span className="ml-2 text-[12px] text-muted">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
