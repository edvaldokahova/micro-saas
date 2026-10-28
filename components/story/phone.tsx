// O que o cliente do escritório vê, num iPhone 17 desenhado em HTML (nítido em qualquer ecrã).
// Ecrã lógico 393 × 852; a moldura, a Dynamic Island e os botões laterais ficam à volta.
import { DocMark, type DocState } from "@/components/marks";
import type { Step } from "./engine";

export const PW = 393;
export const PH = 852;

export type PhoneTexts = {
  office: string;
  client: string;
  preview: string; // início da mensagem
  via: string; // "WhatsApp"
  now: string; // "agora"
  date: string; // "quarta-feira, 21 de outubro"
  link: string;
  hello: string;
  intro: string;
  due: string;
  progress: [string, string]; // antes e depois de assinalar
  docs: string[];
  markSent: string;
  howSent: string;
  vias: { whatsapp: string; email: string };
  sentVia: string;
  received: string;
  pending: string;
  thanks: string;
};

export type PhoneState = { stage: "lock" | "page"; banner: boolean; step: 0 | 1 | 2 };

export function phoneScript(): { start: PhoneState; steps: Step<PhoneState>[] }[] {
  return [
    { start: { stage: "lock", banner: false, step: 0 }, steps: [{ wait: 0.5 }, { set: { banner: true } }, { wait: 1.4 }] },
    { start: { stage: "lock", banner: true, step: 0 }, steps: [{ tap: "banner", set: { stage: "page", banner: false } }, { wait: 1.2 }] },
    { start: { stage: "page", banner: false, step: 0 }, steps: [{ tap: "mark", set: { step: 1 } }, { tap: "via-email", set: { step: 2 } }, { wait: 1.2 }] },
  ];
}

export function PhoneScreen({ s, t }: { s: PhoneState; t: PhoneTexts }) {
  return (
    <div className="relative h-full overflow-hidden bg-ink-2 text-ivory">
      {/* Barra de estado */}
      <div className="absolute inset-x-0 top-0 z-30 flex h-[54px] items-center justify-between px-[34px] pt-1 text-[15px] font-semibold">
        <span className={s.stage === "lock" ? "text-white" : ""}>9:41</span>
        <span className={`flex items-center gap-1.5 ${s.stage === "lock" ? "text-white" : ""}`}>
          <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor" aria-hidden><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="6" rx="1" /><rect x="10" y="2.5" width="3" height="8.5" rx="1" /><rect x="15" y="0" width="3" height="11" rx="1" /></svg>
          <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden><rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke="currentColor" opacity=".45" /><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" /><path d="M24 4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".45" /></svg>
        </span>
      </div>

      {/* Ecrã bloqueado com a notificação */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${s.stage === "lock" ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,#3a4a6b_0%,#1b2131_45%,#0d1017_100%)]" />
        <div className="relative pt-[96px] text-center text-white">
          <p className="text-[17px] font-medium opacity-80">{t.date}</p>
          <p className="mt-1 text-[88px] font-semibold leading-none tracking-[-0.04em] [font-variation-settings:'wdth'_84]">9:41</p>
        </div>
        <div
          data-t="banner"
          className={`absolute inset-x-3 top-[300px] rounded-[26px] bg-white/80 p-3.5 text-[#121316] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${s.banner ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}
        >
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-[#25d366] text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[15px] font-semibold">{t.office}</p>
                <span className="shrink-0 text-[12.5px] text-[#121316]/55">{t.now}</span>
              </div>
              <p className="mt-0.5 line-clamp-3 text-[14px] leading-[1.35] text-[#121316]/85">{t.preview}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Página do cliente (o link) */}
      <div className={`absolute inset-0 transition-all duration-500 ease-out ${s.stage === "page" ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-10 opacity-0"}`}>
        <div className="h-full overflow-hidden px-6 pt-[70px]">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ivory text-[15px] font-semibold text-ink">CS</span>
            <div>
              <p className="text-[15px] font-semibold">{t.office}</p>
              <p className="text-[13px] text-muted">{t.due}</p>
            </div>
          </div>
          <p className="mt-7 text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] [font-variation-settings:'wdth'_84]">{t.hello}</p>
          <p className="mt-2.5 text-[15px] leading-[1.45] text-muted">{t.intro}</p>
          <div className="mt-6 flex items-center justify-between text-[13px]">
            <span className="text-muted">{t.progress[s.step === 2 ? 1 : 0]}</span>
            <span className="tabular-nums">{s.step === 2 ? "100%" : "67%"}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
            <div className="h-full rounded-full bg-ivory transition-[width] duration-700 ease-out" style={{ width: s.step === 2 ? "100%" : "67%" }} />
          </div>
          <ul className="mt-6 divide-y divide-line rounded-3xl border border-line">
            {t.docs.map((d, i) => {
              const last = i === t.docs.length - 1;
              const state: DocState = !last ? "received" : s.step === 2 ? "sent" : "pending";
              return (
                <li key={d} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-3 text-[15px]">
                      <DocMark state={state} className="h-[18px] w-[18px]" animate={state === "sent"} />
                      <span className="truncate">{d}</span>
                    </span>
                    {state === "received" && <span className="shrink-0 text-[12.5px] font-medium text-ok">{t.received}</span>}
                    {state === "sent" && <span className="shrink-0 text-[12.5px] font-medium text-gold">{t.sentVia}</span>}
                    {state === "pending" && s.step === 0 && (
                      <span data-t="mark" className="btn btn-primary btn-sm shrink-0">{t.markSent}</span>
                    )}
                  </div>
                  {state === "pending" && s.step === 1 && (
                    <div className="mt-3 animate-fade [animation-duration:.25s]">
                      <p className="text-[13px] text-muted">{t.howSent}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <span className="rounded-full border border-line-strong py-2 text-center text-[14px]">{t.vias.whatsapp}</span>
                        <span data-t="via-email" className="rounded-full border border-line-strong py-2 text-center text-[14px]">{t.vias.email}</span>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {s.step === 2 && <p className="mt-5 animate-fade text-center text-[14px] text-ok">{t.thanks}</p>}
        </div>
        {/* Barra do navegador */}
        <div className="absolute inset-x-0 bottom-0 flex h-[86px] items-start justify-center border-t border-line bg-ink-2/90 pt-3 backdrop-blur">
          <span className="rounded-full bg-ink-3 px-5 py-2 text-[13.5px] text-muted">{t.link}</span>
        </div>
      </div>
    </div>
  );
}

// Moldura do iPhone 17: alumínio com reflexo, vidro preto, Dynamic Island e botões laterais
export function IPhone({ children, screenRef }: { children: React.ReactNode; screenRef?: React.Ref<HTMLDivElement> }) {
  const W = PW + 24;
  const H = PH + 24;
  return (
    <div className="relative" style={{ width: W, height: H }}>
      {/* Botões laterais */}
      <span className="absolute -left-[3px] top-[140px] h-[30px] w-[4px] rounded-l-[2px] bg-gradient-to-b from-[#c9ccd1] to-[#9a9ea6]" />
      <span className="absolute -left-[3px] top-[200px] h-[56px] w-[4px] rounded-l-[2px] bg-gradient-to-b from-[#c9ccd1] to-[#9a9ea6]" />
      <span className="absolute -left-[3px] top-[268px] h-[56px] w-[4px] rounded-l-[2px] bg-gradient-to-b from-[#c9ccd1] to-[#9a9ea6]" />
      <span className="absolute -right-[3px] top-[220px] h-[86px] w-[4px] rounded-r-[2px] bg-gradient-to-b from-[#c9ccd1] to-[#9a9ea6]" />
      <span className="absolute -right-[3px] top-[420px] h-[52px] w-[4px] rounded-r-[2px] bg-gradient-to-b from-[#b3b7be] to-[#8d929a]" />
      {/* Corpo */}
      <div
        className="absolute inset-0 rounded-[64px] p-[3px] shadow-[0_50px_100px_-40px_rgba(18,19,22,0.55),0_0_0_1px_rgba(0,0,0,0.08)]"
        style={{ background: "linear-gradient(135deg,#f1f2f4 0%,#b9bdc4 22%,#e6e8eb 48%,#9fa4ab 74%,#d8dbdf 100%)" }}
      >
        <div className="h-full w-full rounded-[61px] bg-[#0b0c0e] p-[9px]">
          <div ref={screenRef} className="relative h-full w-full overflow-hidden rounded-[52px]">
            {children}
            {/* Dynamic Island */}
            <span className="absolute left-1/2 top-[11px] z-40 h-[36px] w-[124px] -translate-x-1/2 rounded-full bg-black" />
            {/* Reflexo do vidro */}
            <span className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(115deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_32%)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
