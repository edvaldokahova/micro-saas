type Part = { label: string; text: string };
export type ValueTexts = {
  eyebrow: string;
  title: string;
  lead: string;
  dream: Part;
  likelihood: Part;
  time: Part;
  effort: Part;
  equals: string;
  perDay: string;
};

// Equação de valor escrita como uma fração tipográfica:
// (resultado × confiança) ÷ (tempo × esforço). Em cima o que aumentamos, em baixo o que reduzimos.
function Term({ part, up }: { part: Part; up: boolean }) {
  return (
    <div className="py-5">
      <p className="mono-label flex items-center gap-2">
        <span className={up ? "text-ok" : "text-bad"} aria-hidden>
          {up ? "↑" : "↓"}
        </span>
        {part.label}
      </p>
      <p className="mt-2 max-w-sm text-[15px] leading-6 text-ivory/85">{part.text}</p>
    </div>
  );
}

export function ValueEquation({ t, index = "03" }: { t: ValueTexts; index?: string }) {
  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-y-6 px-5 py-24 lg:grid-cols-[120px_1fr]">
        <span className="mono-label pt-3 !text-gold">{index}</span>
        <div>
          <p className="eyebrow reveal">{t.eyebrow}</p>
          <h2 className="reveal mt-3 max-w-2xl font-display text-4xl leading-[1.08] sm:text-[46px]">{t.title}</h2>
          <p className="reveal mt-4 max-w-2xl text-muted">{t.lead}</p>

          <div className="reveal mt-14 grid items-center gap-8 lg:grid-cols-[auto_1fr]">
            <p className="font-display text-5xl italic text-gold sm:text-6xl">
              {t.equals} <span className="not-italic text-muted">=</span>
            </p>
            <div>
              <div className="grid gap-x-10 sm:grid-cols-2">
                <Term part={t.dream} up />
                <Term part={t.likelihood} up />
              </div>
              {/* O traço da fração */}
              <div className="draw-line h-px bg-ivory" aria-hidden />
              <div className="grid gap-x-10 sm:grid-cols-2">
                <Term part={t.time} up={false} />
                <Term part={t.effort} up={false} />
              </div>
            </div>
          </div>

          <p className="reveal double-rule mt-10 inline-block pb-1 font-display text-xl">{t.perDay}</p>
        </div>
      </div>
    </section>
  );
}
