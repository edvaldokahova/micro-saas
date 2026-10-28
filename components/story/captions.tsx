"use client";

// Legenda do capítulo ativo, com uma barra de progresso por capítulo (tocar numa barra salta para ele).
export function Captions({
  chapters,
  active,
  onPick,
  bars,
  align = "center",
}: {
  chapters: { title: string; text: string }[];
  active: number;
  onPick: (i: number) => void;
  bars: { current: (HTMLSpanElement | null)[] };
  align?: "center" | "left";
}) {
  const c = chapters[Math.max(0, active)];
  return (
    <div className={align === "center" ? "mx-auto max-w-[620px] text-center" : "max-w-[460px]"}>
      <div className="flex gap-1.5">
        {chapters.map((ch, i) => (
          <button key={ch.title} type="button" onClick={() => onPick(i)} aria-label={ch.title} className="group flex-1 py-2">
            <span className="block h-[3px] overflow-hidden rounded-full bg-line transition-colors group-hover:bg-line-strong">
              <span ref={(el) => { bars.current[i] = el; }} className="block h-full origin-left scale-x-0 rounded-full bg-ivory" />
            </span>
          </button>
        ))}
      </div>
      <div key={active} className="mt-3 min-h-[6.4rem] animate-rise [animation-duration:.45s] sm:min-h-[5.6rem]" aria-live="polite">
        <p className="text-[19px] font-semibold leading-tight tracking-[-0.015em] sm:text-[22px]">
          <span className="mr-2 text-muted tabular-nums">{Math.max(0, active) + 1}</span>
          {c.title}
        </p>
        <p className="mt-1.5 text-[14.5px] leading-[1.55] text-muted sm:text-[16px]">{c.text}</p>
      </div>
    </div>
  );
}
