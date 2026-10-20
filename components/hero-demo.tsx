"use client";

import { useEffect, useRef, useState } from "react";
import { ChannelIcon, type Channel } from "@/components/channel-icon";
import { DocMark, DocStrip, type DocState } from "@/components/marks";

// Demonstração animada (dados fictícios): o cliente assinala documentos no telemóvel,
// a folha do escritório atualiza-se, sai um lembrete e o pedido fica entregue.
// Repete-se em ciclo; pára fora do ecrã e respeita "reduzir movimento".

export type DemoTexts = {
  month: string;
  officeView: string;
  clientView: string;
  live: string;
  office: string;
  clients: string[];
  contacts: { phone: string; email: string }[]; // um por cliente, na mesma ordem
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
  howSent: string;
  via: Record<Channel, string>;
  sentVia: string; // "Enviado via {canal}"
};

// Linha do tempo (um passo a cada 1,3 s):
// 1-3 toca no 1.º documento, escolhe WhatsApp · 4-6 o 2.º por e-mail · 7-8 o 3.º por WhatsApp
// 9 lembrete ao cliente atrasado · 10 o escritório confirma: entregue · 11-12 pausa
const STEPS = 13;
const STEP_MS = 1300;
const VIAS: Channel[] = ["whatsapp", "email", "whatsapp"];

type Kind = "delivered" | "pending" | "soon" | "late";
const tone: Record<Kind, string> = { delivered: "text-ok", pending: "text-muted", soon: "text-warn", late: "text-bad" };
const label = "font-mono text-[10px] uppercase tracking-[0.08em]";

function strip(got: number, sent: number, total: number): DocState[] {
  return Array.from({ length: total }, (_, i) => (i < got ? "received" : i < got + sent ? "sent" : "pending"));
}

export function HeroDemo({ t }: { t: DemoTexts }) {
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(11); // estado final, sem animação
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
  const sentCount = step >= 8 ? 3 : step >= 6 ? 2 : step >= 3 ? 1 : 0;
  const menuFor = step === 1 || step === 2 ? 0 : step === 4 || step === 5 ? 1 : step === 7 ? 2 : -1;
  const pressed: Channel | null = step === 2 || step === 7 ? "whatsapp" : step === 5 ? "email" : null;
  const reminded = step >= 9;
  const confirmed = step >= 10;

  const rows: { i: number; got: number; sent: number; total: number; kind: Kind; detail?: string; remind?: boolean }[] = [
    { i: 2, got: 2, sent: 0, total: 6, kind: "late", detail: t.lateBy3, remind: true },
    confirmed ? { i: 1, got: 6, sent: 0, total: 6, kind: "delivered" } : { i: 1, got: 3, sent: sentCount, total: 6, kind: "soon", detail: t.dueIn2 },
    { i: 3, got: 4, sent: 0, total: 6, kind: "pending" },
    { i: 0, got: 6, sent: 0, total: 6, kind: "delivered" },
  ];
  const delivered = rows.filter((r) => r.kind === "delivered").length;
  const stats = [
    { label: t.statDelivered, value: delivered, cls: "" },
    { label: t.statPending, value: rows.length - delivered - 1, cls: "" },
    { label: t.statLate, value: 1, cls: "text-bad" },
  ];
  const chip = (k: Kind) => (k === "delivered" ? t.chipDelivered : k === "late" ? t.chipLate : t.chipPending);

  return (
    <div ref={ref} className="relative">
      {/* Folha do escritório */}
      <div className="card sheet-shadow relative overflow-hidden">
        <div className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-5">
          <span className="font-display text-[26px] leading-none">{t.month}</span>
          <span className={`${label} inline-flex items-center gap-2 text-muted`}>
            <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
            {t.live}
          </span>
        </div>
        <dl className="double-rule mx-5 grid grid-cols-3 border-t border-line">
          {stats.map((s, k) => (
            <div key={s.label} className={`py-3 ${k > 0 ? "border-l border-line pl-4" : ""}`}>
              <dt className={`${label} truncate text-muted`}>{s.label}</dt>
              <dd key={s.value} className={`figure mt-1 animate-pop text-[32px] ${s.cls}`}>
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
        <ul>
          {rows.map((r) => {
            const contact = t.contacts[r.i];
            return (
              <li key={r.i} className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-b-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.clients[r.i]}</span>
                  {contact && <span className="block truncate font-mono text-[10.5px] text-muted">{contact.phone}</span>}
                </span>
                <DocStrip states={strip(r.got, r.sent, r.total)} className="hidden sm:inline-flex" />
                <span className="w-[118px] shrink-0 text-right">
                  <span key={r.kind + (r.detail ?? "")} className={`${label} block animate-fade ${tone[r.kind]}`}>
                    {r.detail ?? chip(r.kind)}
                  </span>
                  {r.remind && (
                    <span className={`${label} mt-0.5 block transition-colors duration-500 ${reminded ? "text-gold" : "text-muted"}`}>
                      {reminded ? `✓ ${t.remind}` : t.remind}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Nota de rodapé: o que acabou de acontecer */}
        <div className="flex min-h-[42px] items-center border-t border-line bg-ink-3/50 px-5 text-xs">
          {reminded && !confirmed && (
            <span key="wa" className="animate-fade text-muted">
              <span className="text-gold">●</span> {t.toast} · {t.clients[2]}
            </span>
          )}
          {confirmed && (
            <span key="ok" className="animate-fade text-muted">
              <span className="text-ok">●</span> {t.confirmed} · {t.clients[1]}
            </span>
          )}
          {!reminded && !confirmed && <span className="mono-label">{t.officeView}</span>}
        </div>
      </div>

      {/* O que o cliente vê */}
      <div className="card relative mt-5 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center border border-ivory font-display text-[13px]" aria-hidden>
            {t.office
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.office}</span>
          <span className={`${label} text-muted`}>{t.clientView}</span>
        </div>
        <div className="px-5 pb-4 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-display text-[22px] leading-tight">{t.hello}</p>
            <span key={confirmed ? "d" : "s"} className={`${label} animate-fade ${confirmed ? tone.delivered : tone.soon}`}>
              {confirmed ? t.chipDelivered : t.dueIn2}
            </span>
          </div>
          <ul className="mt-3 border-t border-ivory">
            {t.docs.map((doc, i) => {
              const state: DocState = confirmed ? "received" : i < sentCount ? "sent" : "pending";
              const open = menuFor === i;
              return (
                <li key={doc} className="border-b border-line last:border-b-0">
                  <div className="flex items-center gap-3 py-2.5 text-sm">
                    <DocMark key={state} state={state} className="h-4 w-4" animate />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{doc}</span>
                      {state !== "pending" && (
                        <span className="flex animate-fade items-center gap-1.5 font-mono text-[10.5px] text-muted">
                          <ChannelIcon via={VIAS[i]} className="h-3 w-3" /> {t.sentVia.replace("{canal}", t.via[VIAS[i]])}
                        </span>
                      )}
                    </span>
                    {state === "pending" ? (
                      <span
                        className={`shrink-0 rounded-[3px] border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                          open ? "border-ivory bg-ivory text-ink" : "border-ivory"
                        }`}
                      >
                        {t.markSent}
                      </span>
                    ) : (
                      <span className={`${label} shrink-0 ${state === "received" ? "text-ok" : "text-gold"}`}>{state === "received" ? t.received : t.sent}</span>
                    )}
                  </div>

                  {/* Mini-menu "Por onde enviou?", como na página real */}
                  <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="mb-2.5 border border-line bg-ink-3/50 px-3 py-2.5">
                        <p className={`${label} text-muted`}>{t.howSent}</p>
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                          {(["whatsapp", "email", "other"] as Channel[]).map((c) => (
                            <span
                              key={c}
                              className={`flex items-center justify-center gap-1.5 rounded-[3px] border px-1 py-1.5 text-[11px] font-medium transition-colors duration-200 ${
                                pressed === c ? "border-ivory bg-ivory text-ink" : "border-line bg-ink-2"
                              }`}
                            >
                              <ChannelIcon via={c} className="h-3.5 w-3.5" />
                              {t.via[c]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
