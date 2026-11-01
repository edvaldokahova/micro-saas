"use client";

// Boas-vindas do dono, depois de confirmar o e-mail: três perguntas de um toque (país, área, tamanho)
// e um resumo de como os dados estão protegidos. O país define o idioma e a moeda da conta.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { IconSpark } from "@/components/icons";
import { BusyLabel } from "@/components/spinner";
import { finishWelcome } from "@/app/app/conta/actions";
import { Select } from "@/components/select";
import { isTimeZone, TIMEZONES, tzLabel } from "@/lib/timezone";
import type { WelcomeTexts } from "@/lib/account-texts";

export function Welcome({ t, office }: { t: WelcomeTexts; office: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [busy, start] = useTransition();
  const total = t.q.length;
  const done = step >= total;

  // «Outro país»: o fuso horário tem de ser escolhido (os lembretes automáticos dependem dele)
  // O fuso do aparelho é detetado sozinho; se não for possível, a pessoa escolhe na lista
  const [detected] = useState<string | null>(() => {
    try {
      const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return isTimeZone(guess) ? guess : null;
    } catch {
      return null;
    }
  });
  const [tz, setTz] = useState<string>(detected ?? "Europe/Lisbon");
  const [changingTz, setChangingTz] = useState(!detected);
  const tzOptions = useMemo(() => {
    const list: string[] = TIMEZONES.includes(tz as (typeof TIMEZONES)[number]) ? [...TIMEZONES] : [tz, ...TIMEZONES];
    return list.map((z) => ({ value: z, label: tzLabel(z) }));
  }, [tz]);

  function pick(value: string) {
    const next = [...answers.slice(0, step), value];
    setAnswers(next);
    if (step === 0 && value === "other") return;
    // Pequena pausa para se ver a escolha marcada antes de avançar
    window.setTimeout(() => setStep((s) => s + 1), 180);
  }

  function enter() {
    setError(false);
    start(async () => {
      const ok = await finishWelcome(answers[0], answers[1], answers[2], answers[0] === "other" ? tz : null).catch(() => false);
      if (!ok) {
        setError(true);
        return;
      }
      window.blTrack?.("CompleteRegistration");
      window.blTrack?.("StartTrial", { value: 0, currency: answers[0] === "BR" ? "BRL" : "EUR" });
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
            {step === 0 && answers[0] === "other" && (
              <div className="mt-6 animate-rise space-y-3 [animation-duration:.3s]">
                {changingTz ? (
                  <>
                    <p className="label !mb-0">{t.tz.label}</p>
                    <Select options={tzOptions} defaultValue={tz} onPick={setTz} searchPlaceholder={t.tz.search} searchFrom={8} />
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ink-2 px-4 py-3.5">
                    <span>
                      <span className="block text-[12.5px] text-muted">{t.tz.detected}</span>
                      <span className="block text-[15px] font-medium">{tzLabel(tz)}</span>
                    </span>
                    <button type="button" onClick={() => setChangingTz(true)} className="text-[14px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory">
                      {t.tz.change}
                    </button>
                  </div>
                )}
                <p className="text-[13px] leading-5 text-muted">{t.tz.hint}</p>
                <button type="button" onClick={() => setStep(1)} className="btn btn-primary w-full">
                  {t.tz.next}
                </button>
              </div>
            )}
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
<IconSpark className="mt-[5px] h-[15px] w-[15px] shrink-0 text-ivory" />
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
