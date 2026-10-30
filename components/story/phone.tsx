// O que o cliente do escritório vê, num iPhone 17 desenhado em HTML (nítido em qualquer ecrã).
// Ecrã lógico 393 × 852; a moldura, a Dynamic Island e os botões laterais ficam à volta.
import { ChannelLogo } from "@/components/channel-logo";
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
    <div className="relative h-full select-none overflow-hidden bg-ink-2 text-ivory [-webkit-touch-callout:none]" onContextMenu={(e) => e.preventDefault()}>
      {/* Barra de estado (branca no ecrã bloqueado, escura no navegador) */}
      <div className={`absolute inset-x-0 top-0 z-30 flex h-[54px] items-center justify-between px-[30px] pt-[6px] text-[16px] font-semibold ${s.stage === "lock" ? "text-white" : "text-ivory"}`}>
        <span className="w-[54px] text-center">{s.stage === "lock" ? "" : "9:41"}</span>
        <span className="flex items-center gap-[6px]">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden><path d="M8.5 2.3c2.4 0 4.6.9 6.3 2.5l1.2-1.2C14 1.6 11.4.6 8.5.6S3 1.6 1 3.6l1.2 1.2C3.9 3.2 6.1 2.3 8.5 2.3zm0 3.3c1.5 0 2.9.6 3.9 1.6l1.2-1.2c-1.4-1.4-3.2-2.1-5.1-2.1s-3.7.7-5.1 2.1l1.2 1.2c1-1 2.4-1.6 3.9-1.6zm0 3.3c.6 0 1.2.2 1.6.7L8.5 11.2 6.9 9.6c.4-.5 1-.7 1.6-.7z" /></svg>
          <span className="relative ml-[2px] grid h-[13px] w-[27px] place-items-center rounded-[4.5px] text-[10px] font-bold">
            <span className="absolute inset-0 rounded-[4.5px] bg-current opacity-35" />
            <span className="absolute inset-y-0 left-0 w-[84%] rounded-[4.5px] bg-current" />
            <span className={`relative ${s.stage === "lock" ? "text-black" : "text-ink"}`}>84</span>
          </span>
        </span>
      </div>

      {/* Ecrã bloqueado, como no iOS: fundo, data, relógio grande, notificação, lanterna e câmara */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${s.stage === "lock" ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {/* Fundo como imagem de CSS (não se pode arrastar nem guardar com toque longo) */}
        <div className="pointer-events-none absolute inset-0 select-none bg-cover bg-center" style={{ backgroundImage: "url(/story/wallpaper.webp)" }} />
        <div className="relative pt-[72px] text-center text-white">
          <p className="text-[19px] font-semibold tracking-[-0.01em] opacity-90">{t.date}</p>
          <p
            className="mt-[-6px] bg-clip-text text-[112px] font-semibold leading-[1.02] tracking-[-0.01em] text-transparent [font-variation-settings:'wdth'_75]"
            style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(235,240,255,0.62) 100%)", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }}
          >
            09:41
          </p>
        </div>
        {/* Notificação como no iOS: vidro claro, avatar com o ícone da app, nome, texto e hora */}
        <div
          data-t="banner"
          className={`absolute inset-x-[12px] bottom-[138px] rounded-[22px] bg-white/55 px-3 py-[11px] text-[#121316] shadow-[0_8px_24px_-14px_rgba(0,0,0,0.5)] ring-1 ring-white/30 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${s.banner ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"}`}
        >
          <div className="flex items-start gap-[10px]">
            <span className="relative mt-[1px] shrink-0">
              <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-gradient-to-b from-[#9aa3b2] to-[#6b7383] text-[14px] font-semibold text-white">CS</span>
              <span className="absolute -bottom-[3px] -right-[3px] grid h-[18px] w-[18px] place-items-center rounded-[5px] bg-gradient-to-b from-[#5ef08a] to-[#1fbf56]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden><path d="M12 3.2c-4.9 0-8.8 3.6-8.8 8.1 0 2.5 1.2 4.7 3.1 6.2l-.6 2.9c-.1.4.4.7.7.5l3.2-1.8c.8.2 1.6.3 2.4.3 4.9 0 8.8-3.6 8.8-8.1S16.9 3.2 12 3.2z" /></svg>
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[15px] font-semibold leading-[1.25]">{t.office}</p>
                <span className="shrink-0 text-[13px] text-[#121316]/50">{t.now}</span>
              </div>
              <p className="line-clamp-3 text-[15px] leading-[1.27] text-[#121316]/90">{t.preview}</p>
            </div>
          </div>
        </div>
        <span className="absolute bottom-[46px] left-[46px] grid h-[50px] w-[50px] place-items-center rounded-full bg-black/25 text-white backdrop-blur-xl">
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden><path d="M3 2h10v4l-2 3v12H5V9L3 6z" /><circle cx="8" cy="13" r="1.2" fill="currentColor" /></svg>
        </span>
        <span className="absolute bottom-[46px] right-[46px] grid h-[50px] w-[50px] place-items-center rounded-full bg-black/25 text-white backdrop-blur-xl">
          <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden><path d="M2 6.5c0-1.1.9-2 2-2h3l1.6-2.5h6.8L17 4.5h3c1.1 0 2 .9 2 2V16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z" /><circle cx="12" cy="11" r="3.8" /></svg>
        </span>
        <span className="absolute bottom-[9px] left-1/2 h-[5px] w-[136px] -translate-x-1/2 rounded-full bg-white" />
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
                        <span className="flex items-center justify-center gap-2 rounded-full border border-line-strong py-2 text-[14px]">
                          <ChannelLogo channel="whatsapp" className="h-[18px] w-[18px]" />
                          {t.vias.whatsapp}
                        </span>
                        <span data-t="via-email" className="flex items-center justify-center gap-2 rounded-full border border-line-strong py-2 text-[14px]">
                          <ChannelLogo channel="email" className="h-[18px] w-[18px]" />
                          {t.vias.email}
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {s.step === 2 && <p className="mt-5 animate-fade text-center text-[14px] text-ok">{t.thanks}</p>}
        </div>
        {/* Barra do Safari (em baixo, como no iOS) */}
        <div className="absolute inset-x-0 bottom-0 h-[92px] bg-gradient-to-t from-ink-2 via-ink-2/95 to-ink-2/0 px-4 pt-3">
          <div className="flex h-[48px] items-center justify-between rounded-full bg-ink-3/90 px-4 text-ivory shadow-[0_4px_18px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <span className="text-[15px] font-semibold">
              <span className="text-[11px]">a</span>A
            </span>
            <span className="flex items-center gap-1.5 text-[15px]">
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden><rect x="1" y="5" width="8" height="6" rx="1.5" /><path d="M2.8 5V3.6a2.2 2.2 0 0 1 4.4 0V5" /></svg>
              {t.link}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden><path d="M13.5 8a5.5 5.5 0 1 1-1.7-4M13.5 2v3h-3" /></svg>
          </div>
          <span className="mx-auto mt-[22px] block h-[5px] w-[136px] rounded-full bg-ivory" />
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
