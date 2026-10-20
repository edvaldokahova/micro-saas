import { ArrowDown, ArrowUp, Feather, ShieldCheck, Timer, Trophy } from "lucide-react";

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

// Equação de valor: (resultado × confiança) ÷ (tempo × esforço) = valor.
// Em cima o que aumentamos, em baixo o que reduzimos; as setas mexem-se em contínuo.
function Term({ part, icon: Icon, up }: { part: Part; icon: typeof Trophy; up: boolean }) {
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <div className="card relative flex gap-4 p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-ink-3">
        <Icon className="h-5 w-5 text-gold" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {part.label}
          <span className={`inline-grid h-5 w-5 place-items-center rounded-full ${up ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"}`}>
            <Arrow className={`h-3.5 w-3.5 ${up ? "animate-bob-up" : "animate-bob-down"}`} aria-hidden />
          </span>
        </p>
        <p className="mt-1.5 text-[15px] leading-6">{part.text}</p>
      </div>
    </div>
  );
}

export function ValueEquation({ t }: { t: ValueTexts }) {
  return (
    <section className="border-t border-line/60">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow reveal">{t.eyebrow}</p>
        <h2 className="reveal mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h2>
        <p className="reveal mt-3 max-w-2xl text-muted">{t.lead}</p>

        <div className="reveal mt-12 grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          {/* Fração */}
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Term part={t.dream} icon={Trophy} up />
              <Term part={t.likelihood} icon={ShieldCheck} up />
            </div>
            <div className="relative my-5 flex items-center gap-3" aria-hidden>
              <span className="draw-line h-[2px] flex-1 rounded-full bg-gradient-to-r from-gold/20 via-gold to-gold/20" />
              <span className="font-display text-sm text-muted">÷</span>
              <span className="draw-line h-[2px] flex-1 rounded-full bg-gradient-to-r from-gold/20 via-gold to-gold/20" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Term part={t.time} icon={Timer} up={false} />
              <Term part={t.effort} icon={Feather} up={false} />
            </div>
          </div>

          {/* Resultado */}
          <div className="flex items-center justify-center gap-4 lg:flex-col lg:gap-2 lg:px-6">
            <span className="font-display text-4xl font-light text-muted">=</span>
            <span className="value-glow font-display text-5xl font-semibold tracking-tight text-gold-gradient sm:text-6xl">{t.equals}</span>
          </div>
        </div>

        <p className="reveal mt-10 text-center text-sm text-muted lg:text-left">
          <span className="font-medium text-ivory">{t.perDay}</span>
        </p>
      </div>
    </section>
  );
}
