// O que o cliente do escritório vê, num iPhone 17 desenhado em HTML (nítido em qualquer ecrã).
// Ecrã lógico 393 × 852; a moldura, a Dynamic Island e os botões laterais ficam à volta.
import { ChannelLogo } from "@/components/channel-logo";
import { useState } from "react";
import { DocMark, type DocState } from "@/components/marks";
import { ChannelIcon } from "@/components/channel-icon";
import { DeadlineCard } from "@/components/deadline-card";
import { Spinner } from "@/components/spinner";

export const PW = 393;
export const PH = 852;

export type PhoneTexts = {
  office: string;
  client: string;
  preview: string; // início da mensagem
  via: string; // "WhatsApp"
  now: string; // "agora"
  date: string; // "quarta-feira, 21 de outubro"
  link: string; // domínio do escritório (plano Escritório)
  locale: string;
  // Página do cliente, com os mesmos textos da página real
  requestFrom: string;
  period: string;
  hello: string;
  intro: string;
  step1: string;
  step2: string;
  uploadButton: string;
  uploadHint: string;
  progress: string[]; // índice = documentos tratados
  allDone: string;
  docs: string[];
  upload: string; // "Enviar"
  more: string; // "Adicionar"
  received: string;
  fileOne: string;
  privateLink: string;
  footer: string;
  // iOS: menu do ficheiro, Fotografias e Ficheiros
  sheet: [string, string, string]; // Fototeca, câmara, escolher ficheiro
  ios: { cancel: string; add: string; photos: string; recents: string; search: string };
  photo: string; // nome da foto do recibo
  pdf: string; // nome do PDF da fatura
  pdfOther: string;
  pdfMeta: [string, string]; // «Hoje, 09:12 · 212 KB»
};

// O cliente envia dois ficheiros: a foto do recibo (Fotografias) e o PDF da fatura (Ficheiros)
type Step = "idle" | "menuA" | "photos" | "picked" | "upA" | "doneA" | "menuB" | "files" | "upB" | "doneB";
export type PhoneState = { stage: "lock" | "page"; banner: boolean; scroll: number; step: Step };

// Quanto a página desce até à lista «O que falta enviar» (medido no ecrã lógico de 393 × 852)
const LIST = 500;

export function phoneScript(): { start: PhoneState; steps: import("./engine").Step<PhoneState>[] }[] {
  const page: PhoneState = { stage: "page", banner: false, scroll: 0, step: "idle" };
  return [
    { start: { stage: "lock", banner: false, scroll: 0, step: "idle" }, steps: [{ wait: 0.5 }, { set: { banner: true } }, { wait: 1.4 }] },
    { start: { stage: "lock", banner: true, scroll: 0, step: "idle" }, steps: [{ tap: "banner", set: { stage: "page", banner: false } }, { wait: 1.6 }] },
    {
      start: page,
      steps: [
        { wait: 0.3 },
        { set: { scroll: LIST } },
        { wait: 0.7 },
        { tap: "send-2", set: { step: "menuA" } },
        { tap: "pick-photos", set: { step: "photos" } },
        { tap: "photo", set: { step: "picked" } },
        { tap: "add", set: { step: "upA" } },
        { wait: 0.8 },
        { set: { step: "doneA" } },
        { wait: 0.9 },
        { tap: "send-1", set: { step: "menuB" } },
        { tap: "pick-files", set: { step: "files" } },
        { tap: "pdf", set: { step: "upB" } },
        { wait: 0.8 },
        { set: { step: "doneB" } },
        { wait: 1.3 },
        // Volta ao topo: o prazo fica verde, com o visto, porque chegou tudo a tempo
        { set: { scroll: 0 } },
        { wait: 2 },
      ],
    },
  ];
}

const ORDER: Step[] = ["idle", "menuA", "photos", "picked", "upA", "doneA", "menuB", "files", "upB", "doneB"];
const at = (s: Step, from: Step) => ORDER.indexOf(s) >= ORDER.indexOf(from);

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

      {/* Página do cliente (o link): a mesma estrutura, textos e componentes da página real */}
      <div className={`absolute inset-0 transition-all duration-500 ease-out ${s.stage === "page" ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-10 opacity-0"}`}>
        <div className="h-full overflow-hidden">
          <div className="px-5 pb-[120px] pt-[62px] transition-transform duration-700 ease-[cubic-bezier(.3,.7,.2,1)]" style={{ transform: `translateY(${-s.scroll}px)` }}>
            <ClientPage s={s} t={t} />
          </div>
        </div>
        {/* Por trás da barra de estado, como no Safari: o conteúdo passa por baixo sem se misturar com as horas */}
        <div className="absolute inset-x-0 top-0 z-20 h-[54px] bg-ink-2/95 backdrop-blur-md" />
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
        <PhotosSheet s={s} t={t} />
        <FilesSheet s={s} t={t} />
      </div>
    </div>
  );
}

function ClientPage({ s, t }: { s: PhoneState; t: PhoneTexts }) {
  // Prazo relativo a hoje (pedido há 5 dias, entrega daqui a 3), para a contagem estar sempre certa
  const [dates] = useState(() => {
    const day = 86_400_000;
    const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    return { created: new Date(Date.now() - 5 * day).toISOString(), due: iso(Date.now() + 3 * day) };
  });
  const initials = t.office.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  // Estado de cada documento: o 1.º já chegou; o 3.º recebe a foto; o 2.º recebe o PDF
  const item = (i: number): { state: DocState; files: number; busy: boolean } => {
    if (i === 0) return { state: "received", files: 1, busy: false };
    if (i === 2) return { state: at(s.step, "doneA") ? "received" : "pending", files: 1, busy: s.step === "upA" };
    return { state: at(s.step, "doneB") ? "received" : "pending", files: 1, busy: s.step === "upB" };
  };
  const handled = [0, 1, 2].filter((i) => item(i).state === "received").length;
  const pct = Math.round((handled / 3) * 100);
  const done = handled === 3;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ivory text-[14px] font-semibold text-ink">{initials}</span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium leading-tight">{t.office}</p>
            <p className="mono-label mt-0.5 !text-[10px]">{t.requestFrom}</p>
          </div>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
        </span>
      </div>

      <p className="eyebrow mt-8">{t.period}</p>
      <p className="mt-3 font-display text-[2.3rem] leading-[1.08]">{t.hello}</p>
      <p className="mt-3 text-[15px] leading-7 text-muted">{t.intro}</p>
      <DeadlineCard locale={t.locale} createdAt={dates.created} dueDate={dates.due} complete={done} doneAt={done ? new Date().toISOString() : null} />

      <section className="mt-8">
        <p className="flex items-baseline gap-2.5 font-display text-[22px]">
          <span className="font-mono text-[12px] text-gold">01</span> {t.step1}
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-ink-2 px-5 py-7 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ivory text-ink">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10 13.5V3.5M6 7.3l4-3.8 4 3.8M3.5 12.5v2.2a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-2.2" /></svg>
          </span>
          <span className="text-[15.5px] font-medium">{t.uploadButton}</span>
          <span className="max-w-[34ch] text-[13px] leading-5 text-muted">{t.uploadHint}</span>
        </div>
      </section>

      <section className="mt-10">
        <p className="mb-4 flex items-baseline gap-2.5 font-display text-[22px]">
          <span className="font-mono text-[12px] text-gold">02</span> {t.step2}
        </p>
        <div className="flex items-center justify-between text-[13px] text-muted">
          <span>{t.progress[handled]}</span>
          <span className="tabular-nums text-ivory">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
          <div className="h-full rounded-full bg-ivory transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
        </div>
        {done && (
          <p className="mt-4 flex animate-rise items-center gap-2.5 border-b border-line py-3 text-sm text-ok">
            <DocMark state="received" className="h-4 w-4" /> {t.allDone}
          </p>
        )}
        <ul>
          {t.docs.map((d, i) => {
            const it = item(i);
            const received = it.state === "received";
            const fresh = (i === 2 && s.step === "doneA") || (i === 1 && s.step === "doneB");
            return (
              <li key={d} className="relative border-b border-line">
                <div className="flex items-center gap-3.5 py-4">
                  <DocMark key={it.state} state={it.state} className="h-[18px] w-[18px] shrink-0" animate={fresh} />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium">{d}</span>
                    {received && (
                      <span className={`mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-muted ${fresh ? "animate-fade" : ""}`}>
                        <ChannelIcon via="page" className="h-3 w-3" /> {t.received} <span>· {t.fileOne}</span>
                      </span>
                    )}
                  </div>
                  {it.busy ? (
                    <span className="flex shrink-0 items-center gap-2 text-[13px] tabular-nums text-muted">
                      <Spinner className="h-3.5 w-3.5" /> 1/1
                    </span>
                  ) : received ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-line-strong px-3 py-1.5 text-[12.5px] font-medium text-muted">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><path d="M6 2v8M2 6h8" /></svg>
                      {t.more}
                    </span>
                  ) : (
                    <span data-t={`send-${i}`} className="shrink-0 rounded-full bg-ivory px-4 py-2 text-[13.5px] font-medium text-ink">{t.upload}</span>
                  )}
                </div>
                {/* Menu do iOS ao tocar num botão de envio de ficheiros */}
                {((i === 2 && s.step === "menuA") || (i === 1 && s.step === "menuB")) && (
                  <div className="absolute bottom-[calc(100%-10px)] right-0 z-10 w-[268px] animate-fade overflow-hidden rounded-[14px] bg-white/90 text-[#121316] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.35)] ring-1 ring-black/5 backdrop-blur-xl [animation-duration:.18s]">
                    {t.sheet.map((label, k) => (
                      <span key={label} data-t={k === 0 ? "pick-photos" : k === 2 ? "pick-files" : undefined} className={`flex items-center justify-between gap-3 px-4 py-[11px] text-[15px] ${k ? "border-t border-black/10" : ""}`}>
                        {label}
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          {k === 0 && <><rect x="2.5" y="4" width="15" height="12" rx="2.5" /><circle cx="7.5" cy="8.5" r="1.5" /><path d="M17.5 13l-4-4-6.5 7" /></>}
                          {k === 1 && <><path d="M2.5 7a2 2 0 0 1 2-2h2l1.4-2h4.2L13.5 5h2a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z" /><circle cx="10" cy="10.5" r="3" /></>}
                          {k === 2 && <path d="M2.5 6a2 2 0 0 1 2-2h3.5l2 2h5.5a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z" />}
                        </svg>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mono-label mt-10 flex items-center justify-center gap-2 !text-[10px]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        {t.privateLink}
      </p>
      <p className="mt-4 text-center text-xs text-muted">{t.footer}</p>
    </>
  );
}

// Fotografias do iOS: grelha de fotos recentes; o cliente escolhe a do recibo e toca em «Adicionar»
function PhotosSheet({ s, t }: { s: PhoneState; t: PhoneTexts }) {
  const open = s.step === "photos" || s.step === "picked";
  const picked = s.step === "picked";
  // Miniaturas desenhadas (sem fotos reais): tons de fotos comuns e, na 2.ª, o recibo
  const tones = [
    "linear-gradient(160deg,#c9d6e3,#8fa7bf)",
    "",
    "linear-gradient(160deg,#d8c3a5,#a8835b)",
    "linear-gradient(160deg,#b8d0b0,#6f8f68)",
    "linear-gradient(160deg,#f0d9c8,#c99a7d)",
    "linear-gradient(160deg,#9fb3c8,#56708c)",
    "linear-gradient(160deg,#e7e2d6,#b9ae98)",
    "linear-gradient(160deg,#cfc3dc,#8d7ba6)",
    "linear-gradient(160deg,#d9d9d9,#9a9a9a)",
    "linear-gradient(160deg,#c3dad8,#6f9c98)",
    "linear-gradient(160deg,#e9cfa8,#c08a4f)",
    "linear-gradient(160deg,#bcc7d6,#7d8ca3)",
    "linear-gradient(160deg,#f2e3c9,#c9a76f)",
    "linear-gradient(160deg,#a9c4d9,#5f84a3)",
    "linear-gradient(160deg,#d6cfc4,#8f8473)",
    "linear-gradient(160deg,#c8dcc2,#7fa475)",
    "linear-gradient(160deg,#e3c8cf,#b07f8c)",
    "linear-gradient(160deg,#cdd5e0,#8996aa)",
  ];
  return (
    <div className={`absolute inset-x-0 bottom-0 top-[48px] z-40 rounded-t-[14px] bg-white text-[#121316] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.35)] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "translate-y-0" : "translate-y-full"}`}>
      <span className="mx-auto mt-[6px] block h-[5px] w-[36px] rounded-full bg-black/15" />
      <div className="flex items-center justify-between px-4 pb-3 pt-2 text-[17px]">
        <span className="text-[#0a84ff]">{t.ios.cancel}</span>
        <span className="font-semibold">{t.ios.photos}</span>
        <span data-t="add" className={`font-semibold ${picked ? "text-[#0a84ff]" : "text-black/25"}`}>{t.ios.add}</span>
      </div>
      <div className="mx-4 mb-3 flex h-9 items-center gap-2 rounded-[10px] bg-black/[0.06] px-2.5 text-[16px] text-black/40">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" /></svg>
        {t.ios.search}
      </div>
      <div className="grid grid-cols-3 gap-[2px]">
        {tones.map((bg, k) =>
          k === 1 ? (
            // A foto do talão: papel branco sobre a mesa
            <span key={k} data-t="photo" className="relative aspect-square overflow-hidden bg-[linear-gradient(160deg,#a8835b,#7d5b3a)]">
              <span className="absolute left-1/2 top-1/2 h-[78%] w-[52%] -translate-x-1/2 -translate-y-1/2 rotate-[-6deg] rounded-[2px] bg-[#fbfaf6] px-[7px] py-[8px] shadow-[0_4px_10px_rgba(0,0,0,0.35)]">
                <span className="mx-auto block h-[4px] w-[60%] rounded bg-black/55" />
                {[70, 55, 80, 62, 74, 50].map((w, j) => (
                  <span key={j} className="mt-[5px] flex justify-between">
                    <span className="block h-[2px] rounded bg-black/30" style={{ width: `${w - 20}%` }} />
                    <span className="block h-[2px] w-[18%] rounded bg-black/30" />
                  </span>
                ))}
                <span className="mt-[7px] flex justify-between">
                  <span className="block h-[3px] w-[30%] rounded bg-black/60" />
                  <span className="block h-[3px] w-[22%] rounded bg-black/60" />
                </span>
              </span>
              {picked && (
                <>
                  <span className="absolute inset-0 bg-white/25" />
                  <span className="absolute bottom-[6px] right-[6px] grid h-[22px] w-[22px] animate-fade place-items-center rounded-full bg-[#0a84ff] ring-2 ring-white [animation-duration:.15s]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2.5 6.3l2.2 2.2L9.5 3.6" /></svg>
                  </span>
                </>
              )}
            </span>
          ) : (
            <span key={k} className="aspect-square" style={{ background: bg }} />
          ),
        )}
      </div>
    </div>
  );
}

// Ficheiros do iOS: «Recentes», com o PDF da fatura no topo
function FilesSheet({ s, t }: { s: PhoneState; t: PhoneTexts }) {
  const open = s.step === "files";
  const rows = [
    { name: t.pdf, meta: t.pdfMeta[0], target: true },
    { name: t.pdfOther, meta: t.pdfMeta[1], target: false },
  ];
  return (
    <div className={`absolute inset-x-0 bottom-0 top-[48px] z-40 rounded-t-[14px] bg-[#f2f2f7] text-[#121316] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.35)] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "translate-y-0" : "translate-y-full"}`}>
      <span className="mx-auto mt-[6px] block h-[5px] w-[36px] rounded-full bg-black/15" />
      <div className="flex items-center justify-between px-4 pt-2 text-[17px]">
        <span className="text-[#0a84ff]">{t.ios.cancel}</span>
        <span className="w-[60px]" />
      </div>
      <p className="px-4 pt-2 text-[32px] font-bold tracking-[-0.02em]">{t.ios.recents}</p>
      <div className="mx-4 mt-2 flex h-9 items-center gap-2 rounded-[10px] bg-black/[0.07] px-2.5 text-[16px] text-black/40">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" /></svg>
        {t.ios.search}
      </div>
      <div className="mx-4 mt-4 overflow-hidden rounded-[12px] bg-white">
        {rows.map((r, k) => (
          <span key={r.name} data-t={r.target ? "pdf" : undefined} className={`flex items-center gap-3 px-3 py-2.5 ${k ? "border-t border-black/10" : ""}`}>
            {/* Ícone de PDF como no iOS: folha branca com a etiqueta vermelha */}
            <span className="relative h-[46px] w-[36px] shrink-0 rounded-[4px] border border-black/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              {[0, 1, 2, 3].map((j) => (
                <span key={j} className="absolute left-[6px] right-[6px] h-[2px] rounded bg-black/15" style={{ top: 8 + j * 5 }} />
              ))}
              <span className="absolute bottom-[5px] left-1/2 -translate-x-1/2 rounded-[2px] bg-[#e5483b] px-[3px] text-[7px] font-bold leading-[11px] text-white">PDF</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px]">{r.name}</span>
              <span className="block text-[12.5px] text-black/45">{r.meta}</span>
            </span>
          </span>
        ))}
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
