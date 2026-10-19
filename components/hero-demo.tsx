"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Circle, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { ChannelIcon, type Channel } from "@/components/channel-icon";

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
// 9 lembrete por WhatsApp ao cliente atrasado · 10 o escritório confirma: entregue · 11-12 pausa
const STEPS = 13;
const STEP_MS = 1300;
const VIAS: Channel[] = ["whatsapp", "email", "whatsapp"];

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

  const rows: { i: number; got: number; total: number; kind: Kind; detail?: string; awaiting?: number; remind?: boolean }[] = [
    { i: 2, got: 2, total: 8, kind: "late", detail: t.lateBy3, remind: true },
    confirmed ? { i: 1, got: 8, total: 8, kind: "delivered" } : { i: 1, got: 5, total: 8, kind: "soon", detail: t.dueIn2, awaiting: sentCount },
    { i: 3, got: 6, total: 8, kind: "pending" },
    { i: 0, got: 8, total: 8, kind: "delivered" },
  ];
  const delivered = rows.filter((r) => r.kind === "delivered").length;
  const stats = [
    { label: t.statDelivered, value: delivered, cls: "text-ok" },
    { label: t.statPending, value: rows.length - delivered - 1, cls: "text-warn" },
    { label: t.statLate, value: 1, cls: "text-bad" },
  ];
  const chip = (k: Kind) => (k === "delivered" ? t.chipDelivered : k === "late" ? t.chipLate : t.chipPending);

  return (
    <div ref={ref} className="relative">
      {/* Painel do escritório */}
      <div className="card relative overflow-hidden pb-14">
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
            const highlight = r.i === 1 && (sentCount > 0 || confirmed);
            const contact = t.contacts[r.i];
            return (
              <li key={r.i} className={`px-5 py-3 transition-colors duration-500 ${highlight ? "bg-gold/[0.06]" : ""}`}>
                <div className="flex items-center gap-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.clients[r.i]}</span>
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
                {contact && (
                  <p className="mt-0.5 flex min-w-0 items-center gap-x-2.5 text-[10.5px] text-muted">
                    <span className="inline-flex shrink-0 items-center gap-1">
                      <Phone className="h-2.5 w-2.5" aria-hidden /> {contact.phone}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <Mail className="h-2.5 w-2.5 shrink-0" aria-hidden /> <span className="truncate">{contact.email}</span>
                    </span>
                  </p>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${bar[r.kind]}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
                  <span>{t.docsOf.replace("{a}", String(r.got)).replace("{b}", String(r.total))}</span>
                  {r.detail && <span className={r.kind === "late" ? "text-bad" : "text-warn"}>{r.detail}</span>}
                  {!!r.awaiting && (
                    <span key={r.awaiting} className="inline-flex animate-fade items-center gap-1 font-medium text-gold">
                      {t.awaiting[r.awaiting - 1]}
                      {VIAS.slice(0, r.awaiting).map((v, k) => (
                        <ChannelIcon key={k} via={v} className="h-3 w-3 animate-pop" />
                      ))}
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

      {/* O que o cliente vê: mesmo tamanho e estilo do painel */}
      <div className="card relative mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-sm">
          <span className="truncate font-medium">{t.office}</span>
          <span className="text-xs text-muted">{t.clientView}</span>
        </div>
        <div className="px-5 pb-5 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-display text-lg font-semibold leading-tight">{t.hello}</p>
            <span key={confirmed ? "d" : "s"} className={`animate-pop rounded-full px-2 py-0.5 text-[11px] font-medium ${confirmed ? tone.delivered : tone.soon}`}>
              {confirmed ? t.chipDelivered : t.dueIn2}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {t.docs.map((doc, i) => {
              const isReceived = confirmed;
              const isSent = !confirmed && i < sentCount;
              const open = menuFor === i;
              const tapping = open && pressed === null;
              return (
                <li
                  key={doc}
                  className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                    isReceived ? "border-ok/40" : isSent ? "border-gold/50 bg-gold/[0.05]" : open ? "border-gold/60" : "border-line"
                  }`}
                >
                  <div className="relative flex items-center gap-3 px-3.5 py-2.5 text-sm">
                    {isReceived ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 animate-pop text-ok" aria-hidden />
                    ) : isSent ? (
                      <Send className="h-5 w-5 shrink-0 animate-pop text-gold" aria-hidden />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{doc}</span>
                      {(isSent || isReceived) && (
                        <span className="flex animate-fade items-center gap-1.5 text-[11px] text-muted">
                          <ChannelIcon via={VIAS[i]} className="h-3 w-3" /> {t.sentVia.replace("{canal}", t.via[VIAS[i]])}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isReceived ? "bg-ok/15 text-ok" : isSent ? "bg-gold/15 text-gold" : "bg-accent text-on-accent"
                      }`}
                    >
                      {isReceived ? t.received : isSent ? t.sent : t.markSent}
                    </span>
                    {tapping && (
                      <span className="absolute right-8 top-1/2 h-7 w-7 -translate-y-1/2" aria-hidden>
                        <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />
                        <span className="absolute inset-2 rounded-full bg-gold/70" />
                      </span>
                    )}
                  </div>

                  {/* Mini-menu "Por onde enviou?", como na página real */}
                  <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="border-t border-line bg-ink-3/40 px-3.5 py-3">
                        <p className="text-xs font-semibold">{t.howSent}</p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {(["whatsapp", "email", "other"] as Channel[]).map((c) => (
                            <span
                              key={c}
                              className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium transition-all duration-200 ${
                                pressed === c ? "scale-95 border-gold bg-gold/15" : "border-line bg-ink-2"
                              }`}
                            >
                              <ChannelIcon via={c} className="h-4 w-4" />
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

function Toast({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div className={`flex max-w-[85%] animate-rise items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white shadow-lg ${color}`}>
      {icon}
      <span className="truncate">{text}</span>
    </div>
  );
}
