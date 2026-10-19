"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Circle, MessageCircle, Send } from "lucide-react";

// Demonstração animada (dados fictícios): o cliente assinala documentos no telemóvel,
// o painel do escritório atualiza-se, sai um lembrete por WhatsApp e o pedido fica entregue.
// Repete-se em ciclo; pára fora do ecrã e respeita "reduzir movimento".

export type DemoTexts = {
  month: string;
  officeView: string;
  clientView: string;
  live: string;
  office: string;
  clients: string[];
  docs: string[];
  statDelivered: string;
  statPending: string;
  statLate: string;
  chipDelivered: string;
  chipPending: string;
  chipLate: string;
  dueIn2: string;
  lateBy3: string;
  docsOf: string; // "{a} de {b} recebidos"
  awaiting: string[]; // [1, 2, 3] "por confirmar"
  hello: string;
  markSent: string;
  sent: string;
  received: string;
  toast: string;
  confirmed: string;
  remind: string;
};

const STEPS = 10;
const STEP_MS = 1500;

type Kind = "delivered" | "pending" | "soon" | "late";
const tone: Record<Kind, string> = {
  delivered: "bg-ok/15 text-ok",
  pending: "bg-ink-3 text-muted",
  soon: "bg-warn/15 text-warn",
  late: "bg-bad/15 text-bad",
};
const bar: Record<Kind, string> = { delivered: "bg-ok", pending: "bg-gold", soon: "bg-gold", late: "bg-bad" };

export function HeroDemo({ t }: { t: DemoTexts }) {
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(6); // estado final, sem animação
      return;
    }
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.2 });
    if (ref.current) io.observe(ref.current);
    const id = window.setInterval(() => {
      if (visible && !document.hidden) setStep((s) => (s + 1) % STEPS);
    }, STEP_MS);
    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, []);

  // Estado derivado do passo
  const sentCount = Math.min(Math.max(step - 1, 0), 3); // passos 2, 3, 4 assinalam um documento cada
  const confirmed = step >= 6 && step <= 8;
  const reminded = step >= 5 && step <= 8;
  const tapIndex = step >= 1 && step <= 3 ? step - 1 : -1;

  const rows: { name: string; got: number; total: number; kind: Kind; detail?: string; awaiting?: number; remind?: boolean }[] = [
    { name: t.clients[2], got: 2, total: 8, kind: "late", detail: t.lateBy3, remind: true },
    confirmed
      ? { name: t.clients[1], got: 8, total: 8, kind: "delivered" }
      : { name: t.clients[1], got: 5, total: 8, kind: "soon", detail: t.dueIn2, awaiting: sentCount },
    { name: t.clients[3], got: 6, total: 8, kind: "pending" },
    { name: t.clients[0], got: 8, total: 8, kind: "delivered" },
  ];
  const delivered = rows.filter((r) => r.kind === "delivered").length;
  const stats = [
    { label: t.statDelivered, value: delivered, cls: "text-ok" },
    { label: t.statPending, value: rows.length - delivered - 1, cls: "text-warn" },
    { label: t.statLate, value: 1, cls: "text-bad" },
  ];
  const chip = (k: Kind) => (k === "delivered" ? t.chipDelivered : k === "late" ? t.chipLate : t.chipPending);

  return (
    <div ref={ref} className="relative sm:pb-44">
      {/* Painel do escritório */}
      <div className="card relative overflow-hidden pb-16 sm:pb-24">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-sm">
          <span className="font-medium">{t.month}</span>
          <span className="inline-flex items-center gap-2 text-xs text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
            </span>
            {t.officeView} · {t.live}
          </span>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-3">
              <dt className="truncate text-[11px] text-muted">{s.label}</dt>
              <dd key={s.value} className={`mt-0.5 animate-pop font-display text-xl font-semibold ${s.cls}`}>
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
        <ul className="divide-y divide-line">
          {rows.map((r) => {
            const pct = (r.got / r.total) * 100;
            const highlight = r.name === t.clients[1] && (sentCount > 0 || confirmed);
            return (
              <li key={r.name} className={`px-5 py-3.5 transition-colors duration-500 ${highlight ? "bg-gold/[0.06]" : ""}`}>
                <div className="flex items-center gap-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.name}</span>
                  {r.remind && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all duration-500 ${
                        reminded ? "bg-[#1f9d55] text-white shadow-[0_0_0_4px_rgba(31,157,85,.18)]" : "bg-[#1f9d55]/15 text-[#1f9d55]"
                      }`}
                    >
                      <MessageCircle className="h-3 w-3" aria-hidden /> {t.remind}
                    </span>
                  )}
                  <span key={r.kind} className={`animate-pop rounded-full px-2 py-0.5 text-[11px] font-medium ${tone[r.kind]}`}>
                    {r.kind === "delivered" && <Check className="-mt-px mr-0.5 inline h-3 w-3" aria-hidden />}
                    {chip(r.kind)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${bar[r.kind]}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
                  <span>{t.docsOf.replace("{a}", String(r.got)).replace("{b}", String(r.total))}</span>
                  {r.detail && <span className={r.kind === "late" ? "text-bad" : "text-warn"}>{r.detail}</span>}
                  {!!r.awaiting && (
                    <span key={r.awaiting} className="animate-fade font-medium text-gold">
                      {t.awaiting[r.awaiting - 1]}
                    </span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>

        {/* Notificações */}
        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-end">
          {reminded && !confirmed && (
            <Toast key="wa" icon={<MessageCircle className="h-4 w-4" aria-hidden />} text={`${t.toast} · ${t.clients[2]}`} color="bg-[#1f9d55]" />
          )}
          {confirmed && <Toast key="ok" icon={<CheckCircle2 className="h-4 w-4" aria-hidden />} text={`${t.confirmed} · ${t.clients[1]}`} color="bg-ok" />}
        </div>
      </div>

      {/* Telemóvel do cliente */}
      <div className="relative mx-auto mt-5 w-[248px] sm:absolute sm:bottom-0 sm:left-4 sm:mt-0 lg:-left-8">
        <p className="mb-2 text-center text-[11px] font-medium text-muted sm:hidden">{t.clientView}</p>
        <div className="rounded-[2rem] border border-line bg-ink p-2 shadow-[0_30px_60px_-25px_rgba(0,0,0,.6)]">
          <div className="overflow-hidden rounded-[1.6rem] border border-line bg-ink-2">
            <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-ink-3" />
            <div className="px-4 pb-4 pt-3">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{t.office}</p>
              <p className="mt-2 font-display text-[15px] font-semibold leading-tight">{t.hello}</p>
              <p className="mt-1 text-[11px] text-warn">{confirmed ? t.chipDelivered : t.dueIn2}</p>
              <ul className="mt-3 space-y-2">
                {t.docs.map((doc, i) => {
                  const isReceived = confirmed;
                  const isSent = !confirmed && i < sentCount;
                  const tapping = tapIndex === i;
                  return (
                    <li
                      key={doc}
                      className={`relative flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11.5px] transition-all duration-300 ${
                        isReceived ? "border-ok/40" : isSent ? "border-gold/50 bg-gold/[0.06]" : tapping ? "scale-[0.98] border-gold/40" : "border-line"
                      }`}
                    >
                      {isReceived ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 animate-pop text-ok" aria-hidden />
                      ) : isSent ? (
                        <Send className="h-4 w-4 shrink-0 animate-pop text-gold" aria-hidden />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                      )}
                      <span className="min-w-0 flex-1 truncate font-medium">{doc}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isReceived ? "bg-ok/15 text-ok" : isSent ? "bg-gold/15 text-gold" : "bg-accent text-on-accent"
                        }`}
                      >
                        {isReceived ? t.received : isSent ? t.sent : t.markSent}
                      </span>
                      {tapping && (
                        <span className="absolute right-6 top-1/2 h-6 w-6 -translate-y-1/2" aria-hidden>
                          <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />
                          <span className="absolute inset-1.5 rounded-full bg-gold/70" />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-2 hidden text-center text-[11px] font-medium text-muted sm:block">{t.clientView}</p>
      </div>
    </div>
  );
}

function Toast({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div className={`flex max-w-[85%] animate-rise items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white shadow-lg ${color}`}>
      {icon}
      <span className="truncate">{text}</span>
    </div>
  );
}
