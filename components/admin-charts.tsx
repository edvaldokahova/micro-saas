"use client";

// Gráficos do cockpit, desenhados à mão em SVG (sem bibliotecas): linhas com gradiente,
// marcas finas e um aviso ao passar o dedo/rato. As cores seguem o azul do Bilonai.
import { useEffect, useId, useState } from "react";

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

// Também serve para contagens (unit="count"): ex.: documentos recebidos por mês no Desempenho
// net: a linha é o valor líquido (total) e o aviso mostra o faturado (earnings) e a taxa da Paddle
export function RevenueChart({ points, currency = "EUR", unit = "money", noun, net = false }: { points: RevenuePoint[]; currency?: "EUR" | "BRL" | "USD"; unit?: "money" | "count"; noun?: [string, string]; net?: boolean }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  // Dólares com «$» à frente (igual ao resto do painel de finanças), em vez de «US$»
  const dollar = (s: string) => (currency === "USD" ? `$${s.replace(/\s?US\$/, "").trim()}` : s);
  const money = (cents: number) =>
    unit === "count" ? new Intl.NumberFormat("pt-PT").format(cents) :
    dollar(new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "pt-PT", { style: "currency", currency, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100));
  // Escala «redonda» (ex.: 0, 50 €, 100 €, 150 €) para o eixo vertical
  const top = Math.max(unit === "count" ? 4 : 100, ...points.map((p) => p.total));
  const rough = top / 4;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(unit === "count" ? 1 : 0, [1, 2, 2.5, 5, 10].map((f) => f * mag).find((v) => v >= rough && (unit !== "count" || Number.isInteger(v))) ?? 10 * mag);
  const max = step * Math.ceil(top / step);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const axis = (cents: number) =>
    unit === "count" ? new Intl.NumberFormat("pt-PT").format(cents) :
    dollar(new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "pt-PT", { style: "currency", currency, notation: cents >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 0 }).format(cents / 100));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const line = smooth(points.map((p, i) => [x(i), y(p.total)]));
  const area = points.length ? `${line} L${x(points.length - 1)},${H - PAD.bottom} L${x(0)},${H - PAD.bottom} Z` : "";
  const h = hover != null ? points[hover] : null;

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
      {/* Eixo vertical: valores redondos, alinhados com as linhas da grelha */}
      <div className="relative w-max min-w-[2.75rem] self-stretch" aria-hidden>
        {ticks.map((v) => (
          <span
            key={v}
            className="absolute right-0 -translate-y-1/2 whitespace-nowrap font-mono text-[10.5px] tabular-nums text-muted"
            style={{ top: `${(y(v) / H) * 100}%` }}
          >
            {axis(v)}
          </span>
        ))}
        <span className="invisible block whitespace-nowrap font-mono text-[10.5px]">{axis(max)}</span>
      </div>
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
        {ticks.slice(1).map((v) => (
          <line key={v} x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray="2 5" />
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--color-line-strong)" />
        <path d={area} fill={`url(#a${id})`} className="chart-area" />
        {/* Brilho por baixo da linha (o toque «futurista», sem exagero) */}
        <path d={line} pathLength={1} className="chart-draw" fill="none" stroke={`url(#l${id})`} strokeWidth="6" opacity="0.35" filter={`url(#g${id})`} />
        <path d={line} pathLength={1} className="chart-draw" fill="none" stroke={`url(#l${id})`} strokeWidth="2.5" strokeLinecap="round" />
        {h && hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--color-line-strong)" />}
        {points.map((p, i) => (
          <circle key={p.label} cx={x(i)} cy={y(p.total)} r={hover === i ? 5.5 : 3.5} fill="var(--color-ink-2)" stroke="#2563eb" strokeWidth="2.2" className="chart-dot" style={{ animationDelay: `${0.25 + (i / Math.max(1, points.length - 1)) * 1.1}s` }} />
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
      {h && hover != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-max rounded-xl border border-line bg-ink-2 px-3 py-2 text-[12.5px] shadow-[0_12px_30px_-12px_rgba(18,19,22,0.35)]"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            // Perto das margens, o aviso abre para dentro do cartão
            transform: `translateX(${x(hover) / W > 0.62 ? "calc(-100% - 10px)" : x(hover) / W < 0.38 ? "10px" : "-50%"})`,
          }}
        >
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{h.label}</p>
          <p className="mt-0.5 font-semibold tabular-nums">{money(h.total)}</p>
          {unit === "money" ? (
            <p className="text-muted tabular-nums">
              {net ? `Faturado ${money(h.earnings)} · taxa Paddle ${money(Math.max(0, h.earnings - h.total))}` : `Líquido ${money(h.earnings)}`} · {h.count} {h.count === 1 ? "pagamento" : "pagamentos"}
            </p>
          ) : (
            noun && <p className="text-muted">{h.total === 1 ? noun[0] : noun[1]}</p>
          )}
        </div>
      )}
    </div>
      {/* Meses, só por baixo do gráfico (o eixo vertical fica na mesma altura do desenho) */}
      <div className="col-start-2 mt-2 flex justify-between px-1 font-mono text-[10.5px] uppercase tracking-wider text-muted">
        {/* Com muitos meses, no telemóvel mostra um sim, um não */}
        {points.map((p, i) => (
          <span key={p.label} className={points.length > 7 && (points.length - 1 - i) % 2 ? "invisible sm:visible" : ""}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Escritórios por estado (anel segmentado) ---------- */

export type Segment = { key: string; label: string; value: number; from: string; to: string };

export function OfficesRing({ segments, total, center }: { segments: Segment[]; total: number; center: string }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<string | null>(null);
  // Entrada: os segmentos crescem um a seguir ao outro e o número conta até ao total
  const [shown, setShown] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(true);
      setCount(total);
      return;
    }
    const t = window.setTimeout(() => setShown(true), 60);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 1100);
      setCount(Math.round(total * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [total]);
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
              const dash = shown ? Math.max(0.001, len - gap) : 0.001;
              const order = visible.indexOf(s);
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
                  style={{ transition: `stroke-dasharray 0.9s cubic-bezier(0.2,0.7,0.2,1) ${order * 0.18}s, stroke-width 0.2s` }}
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
            <p className="figure text-[38px] leading-none">{hover ? segments.find((s) => s.key === hover)?.value : count}</p>
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

/* ---------- Barras agrupadas (ex.: lembretes enviados e abertos) ---------- */

export type BarGroup = { label: string; values: number[] };

export function BarsChart({ groups, series }: { groups: BarGroup[]; series: { name: string; from: string; to: string }[] }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const top = Math.max(4, ...groups.flatMap((g) => g.values));
  const rough = top / 4;
  const mag = 10 ** Math.floor(Math.log10(Math.max(1, rough)));
  const step = Math.max(1, [1, 2, 5, 10].map((f) => f * mag).find((v) => v >= rough) ?? 10 * mag);
  const max = step * Math.ceil(top / step);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const BW = 640;
  const BH = 200;
  const slot = BW / Math.max(1, groups.length);
  const barW = Math.min(26, (slot * 0.62) / series.length);
  const yb = (v: number) => 10 + (BH - 10) * (1 - v / max);
  const h = hover != null ? groups[hover] : null;

  return (
    <div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <div className="relative w-max min-w-[1.75rem] self-stretch" aria-hidden>
          {ticks.map((v) => (
            <span key={v} className="absolute right-0 -translate-y-1/2 font-mono text-[10.5px] tabular-nums text-muted" style={{ top: `${(yb(v) / BH) * 100}%` }}>
              {v}
            </span>
          ))}
          <span className="invisible block font-mono text-[10.5px]">{max}</span>
        </div>
        <div className="relative">
          <svg viewBox={`0 0 ${BW} ${BH}`} className="h-auto w-full overflow-visible" role="img">
            <defs>
              {series.map((s, k) => (
                <linearGradient key={k} id={`b${k}${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.from} />
                  <stop offset="100%" stopColor={s.to} />
                </linearGradient>
              ))}
            </defs>
            {ticks.slice(1).map((v) => (
              <line key={v} x1={0} x2={BW} y1={yb(v)} y2={yb(v)} stroke="var(--color-line)" strokeDasharray="2 5" />
            ))}
            <line x1={0} x2={BW} y1={BH} y2={BH} stroke="var(--color-line-strong)" />
            {groups.map((g, i) => {
              const cx = slot * i + slot / 2;
              const start = cx - (barW * series.length + 4 * (series.length - 1)) / 2;
              return (
                <g key={g.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                  <rect x={slot * i} y={0} width={slot} height={BH} fill={hover === i ? "var(--color-ink-3)" : "transparent"} opacity={0.6} rx={8} />
                  {g.values.map((v, k) => {
                    const top = yb(v);
                    const height = Math.max(v > 0 ? 3 : 0, BH - top);
                    return (
                      <rect
                        key={k}
                        x={start + k * (barW + 4)}
                        y={BH - height}
                        width={barW}
                        height={height}
                        rx={Math.min(5, barW / 2)}
                        fill={`url(#b${k}${id})`}
                        className="chart-bar"
                        style={{ animationDelay: `${0.08 * i + 0.12 * k}s` }}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
          {h && hover != null && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-max rounded-xl border border-line bg-ink-2 px-3 py-2 text-[12.5px] shadow-[0_12px_30px_-12px_rgba(18,19,22,0.35)]"
              style={{ left: `${((slot * hover + slot / 2) / BW) * 100}%`, transform: `translateX(${hover / groups.length > 0.6 ? "calc(-100% - 10px)" : hover / groups.length < 0.3 ? "10px" : "-50%"})` }}
            >
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{h.label}</p>
              {series.map((s, k) => (
                <p key={s.name} className="mt-0.5 flex items-center gap-2 tabular-nums">
                  <span className="h-2 w-2 rounded-full" style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }} />
                  {s.name}: <strong className="font-semibold">{h.values[k]}</strong>
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="col-start-2 mt-2 flex">
          {groups.map((g) => (
            <span key={g.label} className="flex-1 text-center font-mono text-[10.5px] uppercase tracking-wider text-muted">
              {g.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }} aria-hidden />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
