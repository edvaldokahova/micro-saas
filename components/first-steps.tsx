// Primeiros passos no painel (dono e administradores, até concluir ou ocultar).
// Aprende-se a fazer na própria conta: um cliente de exemplo com o e-mail de quem aprende,
// a página que o cliente recebe, o ficheiro a chegar arrumado e, por fim, os clientes reais.
import Link from "next/link";
import { SubmitButton } from "@/components/app-buttons";
import { createSample, hideGuide } from "@/app/app/conta/actions";
import { publicLink } from "@/lib/reminder";
import type { GuideTexts } from "@/lib/account-texts";

export function FirstSteps({
  t,
  sampleToken,
  hasSample,
  hasFiles,
  sawDocs,
  realClients,
}: {
  t: GuideTexts;
  sampleToken: string | null;
  hasSample: boolean;
  hasFiles: boolean;
  sawDocs: boolean;
  realClients: number;
}) {
  const done = [hasSample || realClients > 0, hasFiles, sawDocs, realClients > 0];
  const count = done.filter(Boolean).length;
  const current = done.findIndex((x) => !x);

  if (current === -1)
    return (
      <section id="primeiros-passos" className="card mt-8 flex animate-rise flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-[17px] font-semibold text-ok">{t.doneTitle}</h2>
          <p className="mt-1 max-w-[60ch] text-sm leading-6 text-muted">{t.doneText}</p>
        </div>
        <form action={hideGuide} className="shrink-0">
          <SubmitButton className="btn btn-secondary btn-sm">{t.hide}</SubmitButton>
        </form>
      </section>
    );

  const action = (i: number) => {
    const cls = `btn btn-sm ${i === current ? "btn-primary" : "btn-secondary"}`;
    if (i === 0)
      return (
        <form action={createSample}>
          <SubmitButton className={cls}>{t.steps[0].action}</SubmitButton>
        </form>
      );
    if (i === 1)
      return sampleToken ? (
        <a href={publicLink(sampleToken)} target="_blank" rel="noopener noreferrer" className={cls}>
          {t.steps[1].action} ↗
        </a>
      ) : null;
    if (i === 2)
      return (
        <Link href="/documentos?guia=1" className={cls}>
          {t.steps[2].action}
        </Link>
      );
    return (
      <Link href="/clientes" className={cls}>
        {t.steps[3].action}
      </Link>
    );
  };

  return (
    <section id="primeiros-passos" className="card mt-8 scroll-mt-24 animate-rise p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.01em]">{t.title}</h2>
          <p className="mt-1 max-w-[52ch] text-sm leading-6 text-muted">{t.lead}</p>
        </div>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">{t.progress.replace("{a}", String(count)).replace("{b}", "4")}</span>
      </div>
      <div className="mt-4 flex gap-1.5" aria-hidden>
        {done.map((d, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${d ? "bg-ok" : i === current ? "bg-ivory/40" : "bg-ink-3"}`} />
        ))}
      </div>
      <ol className="mt-5 divide-y divide-line">
        {t.steps.map((s, i) => {
          const isDone = done[i];
          const isCurrent = i === current;
          return (
            <li key={s.title} className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${!isDone && !isCurrent ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3.5">
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[12px] font-semibold ${
                    isDone ? "border-ok bg-ok text-white" : isCurrent ? "border-ivory text-ivory" : "border-line-strong text-muted"
                  }`}
                  aria-hidden
                >
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.2l2.3 2.3 4.7-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <div>
                  <p className={`text-[15px] font-medium ${isDone ? "text-muted line-through decoration-line-strong" : ""}`}>{s.title}</p>
                  {!isDone && <p className="mt-0.5 max-w-[52ch] text-[13.5px] leading-5 text-muted">{s.text}</p>}
                </div>
              </div>
              {!isDone && (isCurrent || i === 3) && <div className="shrink-0 pl-[2.375rem] sm:pl-0">{action(i)}</div>}
            </li>
          );
        })}
      </ol>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[13px]">
        {!hasSample && realClients === 0 ? (
          <Link href="/clientes" className="text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory">
            {t.orOwn}
          </Link>
        ) : (
          <span />
        )}
        <form action={hideGuide}>
          <button className="text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory">{t.hide}</button>
        </form>
      </div>
    </section>
  );
}
