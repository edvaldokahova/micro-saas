"use client";

// Prazo na página do cliente: quando o pedido chegou, até quando entregar e quanto falta,
// numa linha do tempo com o «hoje» a avançar. A contagem é real (atualiza sozinha a cada minuto).
import { useEffect, useId, useState } from "react";

type T = {
  requested: string;
  due: string;
  left: (n: number) => string;
  hours: (n: number) => string;
  today: string;
  late: (n: number) => string;
  done: string;
};

const TEXTS: Record<string, T> = {
  "pt-PT": {
    requested: "Pedido enviado",
    due: "Entregar até",
    left: (n) => (n === 1 ? "Falta 1 dia" : `Faltam ${n} dias`),
    hours: (n) => (n <= 1 ? "Falta menos de 1 hora" : `Faltam ${n} horas`),
    today: "Hoje",
    late: (n) => (n === 1 ? "Prazo terminou há 1 dia" : `Prazo terminou há ${n} dias`),
    done: "Tudo entregue a tempo",
  },
  "pt-BR": {
    requested: "Pedido enviado",
    due: "Entregar até",
    left: (n) => (n === 1 ? "Falta 1 dia" : `Faltam ${n} dias`),
    hours: (n) => (n <= 1 ? "Falta menos de 1 hora" : `Faltam ${n} horas`),
    today: "Hoje",
    late: (n) => (n === 1 ? "O prazo terminou há 1 dia" : `O prazo terminou há ${n} dias`),
    done: "Tudo entregue no prazo",
  },
  "es-ES": {
    requested: "Solicitud enviada",
    due: "Entregar antes del",
    left: (n) => (n === 1 ? "Queda 1 día" : `Quedan ${n} días`),
    hours: (n) => (n <= 1 ? "Queda menos de 1 hora" : `Quedan ${n} horas`),
    today: "Hoy",
    late: (n) => (n === 1 ? "El plazo terminó hace 1 día" : `El plazo terminó hace ${n} días`),
    done: "Todo entregado a tiempo",
  },
};

export function DeadlineCard({ locale, createdAt, dueDate, complete }: { locale: string; createdAt: string; dueDate: string; complete: boolean }) {
  const t = TEXTS[locale] ?? TEXTS["pt-PT"];
  const [now, setNow] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const gid = `dl${useId().replace(/:/g, "")}`;
  useEffect(() => {
    setNow(Date.now());
    const a = window.setTimeout(() => setShown(true), 80);
    const i = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearTimeout(a);
      window.clearInterval(i);
    };
  }, []);

  const start = new Date(createdAt).getTime();
  // O prazo vale até ao fim do dia indicado
  const end = new Date(`${dueDate}T23:59:59`).getTime();
  const fmt = (ms: number) => {
    const d = new Date(ms);
    const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(d).replace(".", "");
    return `${d.getDate()} ${month}`;
  };
  const current = now ?? start;
  const span = Math.max(1, end - start);
  const pct = Math.min(100, Math.max(0, ((current - start) / span) * 100));
  const msLeft = end - current;
  // Dias de calendário até ao dia do prazo (hoje 1, prazo 5 → faltam 4)
  const today = new Date(current);
  const daysLeft = Math.round((new Date(`${dueDate}T12:00:00`).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12).getTime()) / 86_400_000);
  const late = msLeft < 0;
  const soon = !late && daysLeft <= 2;

  const tone = complete ? "ok" : late ? "bad" : soon ? "warn" : "ivory";
  const bar = { ok: "from-[#34d399] to-[#059669]", bad: "from-[#fca5a5] to-[#dc2626]", warn: "from-[#fcd34d] to-[#d97706]", ivory: "from-[#60a5fa] to-[#2563eb]" }[tone];
  const text = { ok: "text-ok", bad: "text-bad", warn: "text-warn", ivory: "text-ivory" }[tone];
  const headline = complete ? t.done : late ? t.late(Math.max(1, Math.ceil(-msLeft / 86_400_000))) : daysLeft <= 0 ? t.hours(Math.ceil(msLeft / 3_600_000)) : t.left(daysLeft);

  return (
    <div className="card mt-5 p-4 sm:p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`text-[22px] font-semibold leading-tight tracking-[-0.01em] sm:text-[24px] ${text}`}>{now == null ? " " : headline}</p>
          <p className="mt-1 text-[13px] text-muted">
            {t.due} <strong className="font-medium text-ivory">{new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${dueDate}T12:00:00`))}</strong>
          </p>
        </div>
        {/* Anel com o tempo já passado */}
        <svg viewBox="0 0 44 44" className="h-12 w-12 shrink-0 -rotate-90" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={tone === "ok" ? "#34d399" : tone === "bad" ? "#fca5a5" : tone === "warn" ? "#fcd34d" : "#60a5fa"} />
              <stop offset="100%" stopColor={tone === "ok" ? "#059669" : tone === "bad" ? "#dc2626" : tone === "warn" ? "#d97706" : "#2563eb"} />
            </linearGradient>
          </defs>
          <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-ink-3)" strokeWidth="5" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="5"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${shown ? (complete ? 100 : pct) : 0} 100`}
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.2,0.7,0.2,1)" }}
          />
        </svg>
      </div>

      {/* Linha do tempo: pedido → hoje → prazo */}
      <div className="relative mt-4 pb-7 pt-6">
        <div className="h-2 overflow-hidden rounded-full bg-ink-3">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${bar}`}
            style={{ width: `${shown ? (complete ? 100 : pct) : 0}%`, transition: "width 1.2s cubic-bezier(0.2,0.7,0.2,1)" }}
          />
        </div>
        {!complete && now != null && !late && (
          <span
            className="absolute top-[20px] -translate-x-1/2 transition-[left] duration-[1200ms]"
            style={{ left: `${shown ? pct : 0}%` }}
            aria-hidden
          >
            <span className="block h-4 w-4 rounded-full border-[3px] border-ink-2 bg-ivory shadow-[0_0_0_1px_var(--color-line-strong)]" />
            <span style={{ bottom: "calc(100% + 4px)" }} className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-ivory">{t.today}</span>
          </span>
        )}
        <span className="absolute bottom-0 left-0 text-[11.5px] text-muted">
          {t.requested} · {fmt(start)}
        </span>
        <span className="absolute bottom-0 right-0 text-[11.5px] text-muted">{fmt(end)}</span>
      </div>
    </div>
  );
}
