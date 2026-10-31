"use client";

// Boas-vindas do dono, depois de confirmar o e-mail: três perguntas de um toque (país, área, tamanho)
// e um resumo de como os dados estão protegidos. O país define o idioma e a moeda da conta.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { BusyLabel } from "@/components/spinner";
import { finishWelcome } from "@/app/app/conta/actions";
import type { WelcomeTexts } from "@/lib/account-texts";

export function Welcome({ t, office }: { t: WelcomeTexts; office: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [busy, start] = useTransition();
  const total = t.q.length;
  const done = step >= total;

  function pick(value: string) {
    const next = [...answers.slice(0, step), value];
    setAnswers(next);
    // Pequena pausa para se ver a escolha marcada antes de avançar
    window.setTimeout(() => setStep((s) => s + 1), 180);
  }

  function enter() {
    setError(false);
    start(async () => {
      const ok = await finishWelcome(answers[0], answers[1], answers[2]).catch(() => false);
      if (!ok) {
        setError(true);
        return;
      }
      router.refresh();
    });
  }

  const q = t.q[step];
  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      <header className="mx-auto flex w-full max-w-lg items-center justify-between px-5 pt-6">
        <Logo />
        {!done && (
          <span className="font-mono text-[11px] tabular-nums text-muted">
            {t.step.replace("{a}", String(step + 1)).replace("{b}", String(total))}
          </span>
        )}
      </header>
      <div className="mx-auto mt-5 flex w-full max-w-lg gap-1.5 px-5" aria-hidden>
        {t.q.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i < step || done ? "bg-ivory" : i === step ? "bg-ivory/40" : "bg-ink-3"}`} />
        ))}
      </div>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-10">
        {!done ? (
          <div key={step} className="animate-rise">
            <h1 className="font-display text-[clamp(1.8rem,6vw,2.4rem)] leading-[1.08]">{q.title}</h1>
            <p className="mt-3 text-[15px] leading-6 text-muted">{q.hint}</p>
            <div className="mt-8 space-y-2" role="radiogroup" aria-label={q.title}>
              {q.options.map((o) => {
                const on = answers[step] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pick(o.value)}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition ${
                      on ? "border-ivory bg-ink-2" : "border-line bg-ink-2/60 hover:border-line-strong"
                    }`}
                  >
                    <span>
                      <span className="block text-[16px] font-medium">{o.label}</span>
                      {o.hint && <span className="mt-0.5 block text-[13px] text-muted">{o.hint}</span>}
                    </span>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${on ? "border-ivory bg-ivory" : "border-line-strong"}`} aria-hidden>
                      {on && <span className="h-2 w-2 rounded-full bg-ink" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="mt-6 text-[14px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory">
                {t.back}
              </button>
            )}
          </div>
        ) : (
          <div className="animate-rise">
            <h1 className="font-display text-[clamp(1.8rem,6vw,2.4rem)] leading-[1.08]">{t.doneTitle.replace("{office}", office)}</h1>
            <p className="mt-3 text-[15px] leading-6 text-muted">{t.doneLead}</p>
            <ul className="mt-7 space-y-3.5">
              {t.safe.map((s, i) => (
                <li key={s} className="flex animate-rise items-start gap-3 text-[15px] leading-6" style={{ animationDelay: `${120 + i * 90}ms` }}>
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-ok" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M10 2.5l6 2.3v4.6c0 3.7-2.5 6.6-6 8.1-3.5-1.5-6-4.4-6-8.1V4.8z" />
                    <path d="M7.3 10l1.9 1.9 3.6-3.8" />
                  </svg>
                  {s}
                </li>
              ))}
            </ul>
            {error && (
              <p className="mt-5 text-sm text-bad" role="alert">
                {t.error}
              </p>
            )}
            <button type="button" onClick={enter} disabled={busy} aria-busy={busy} className="btn btn-primary mt-9 w-full py-3.5">
              <BusyLabel busy={busy} text={t.enter}>
                {t.enter}
              </BusyLabel>
            </button>
            <button type="button" onClick={() => setStep(total - 1)} className="mt-4 text-[14px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory">
              {t.back}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
