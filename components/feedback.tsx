"use client";

// Feedback: o formulário (usado na Ajuda) e o pedido discreto do 4.º dia de teste, em baixo no ecrã
import { useState, useTransition } from "react";
import { answerFeedbackPrompt, sendFeedback } from "@/app/app/feedback-actions";
import type { FeedbackTexts } from "@/lib/feedback-texts";

const MAX = 500;

function Form({ t, source, onDone }: { t: FeedbackTexts; source: "prompt" | "help"; onDone: () => void }) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const [pending, start] = useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setErr(false);
    start(async () => {
      const r = await sendFeedback(msg, source);
      if (r.ok) onDone();
      else setErr(true);
    });
  };
  return (
    <form onSubmit={submit}>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value.slice(0, MAX))}
        maxLength={MAX}
        rows={4}
        required
        autoFocus={source === "prompt"}
        placeholder={t.placeholder}
        className="field min-h-[7rem] resize-none py-3 leading-6"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span className={`text-[12px] tabular-nums ${MAX - msg.length < 50 ? "text-warn" : "text-muted"}`}>{t.left.replace("{n}", String(MAX - msg.length))}</span>
        <button type="submit" disabled={pending || !msg.trim()} className="btn btn-primary btn-sm disabled:opacity-50">
          {pending ? t.sending : t.send}
        </button>
      </div>
      {err && <p className="mt-2 text-[13px] text-bad">{t.error}</p>}
    </form>
  );
}

function Thanks({ t }: { t: FeedbackTexts }) {
  return (
    <div>
      <p className="font-medium">{t.thanks}</p>
      <p className="mt-1 text-[13.5px] leading-6 text-muted">{t.thanksText}</p>
    </div>
  );
}

// Formulário fixo (página de Ajuda): pode enviar quantas opiniões quiser
export function FeedbackForm({ t }: { t: FeedbackTexts }) {
  const [done, setDone] = useState(false);
  return (
    <section className="card mt-7 p-5">
      <h2 className="text-[17px] font-semibold">{t.helpTitle}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">{t.helpText}</p>
      <div className="mt-4">
        {done ? (
          <>
            <Thanks t={t} />
            <button type="button" onClick={() => setDone(false)} className="mt-3 text-[13px] text-muted underline underline-offset-4 hover:text-ivory">
              {t.helpTitle}
            </button>
          </>
        ) : (
          <Form t={t} source="help" onDone={() => setDone(true)} />
        )}
      </div>
    </section>
  );
}

// Pedido do 4.º dia: primeiro pergunta se aceita; só depois mostra o campo. Aparece uma única vez.
export function FeedbackPrompt({ t }: { t: FeedbackTexts }) {
  const [step, setStep] = useState<"ask" | "write" | "done" | "hidden">("ask");
  const [, start] = useTransition();
  if (step === "hidden") return null;
  const dismiss = (answer: "no" | "closed") => {
    setStep("hidden");
    start(() => answerFeedbackPrompt(answer));
  };
  return (
    // Fica por cima da barra inferior do telemóvel (e da zona do gesto do iPhone)
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} role="dialog" aria-label={t.askTitle}>
      <div className="px-3 pb-[4.75rem] md:pb-6">
      <div className="pointer-events-auto mx-auto max-w-md animate-fade rounded-2xl border border-line-strong bg-ink-2 p-4 shadow-[0_18px_48px_-18px_rgba(18,19,22,0.35)] sm:p-5" style={{ animationDuration: "300ms" }}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[15px] font-semibold leading-6">{step === "write" ? t.writeTitle : step === "done" ? t.thanks : t.askTitle}</p>
          <button
            type="button"
            onClick={() => (step === "done" ? setStep("hidden") : dismiss("closed"))}
            aria-label={t.close}
            className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-ink-3 hover:text-ivory"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        {step === "ask" && (
          <>
            <p className="mt-1 text-[13.5px] leading-6 text-muted">{t.askText}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setStep("write")} className="btn btn-primary btn-sm">
                {t.yes}
              </button>
              <button type="button" onClick={() => dismiss("no")} className="btn btn-secondary btn-sm">
                {t.no}
              </button>
            </div>
          </>
        )}
        {step === "write" && (
          <div className="mt-3">
            <Form t={t} source="prompt" onDone={() => setStep("done")} />
          </div>
        )}
        {step === "done" && <p className="mt-1 text-[13.5px] leading-6 text-muted">{t.thanksText}</p>}
      </div>
      </div>
    </div>
  );
}
