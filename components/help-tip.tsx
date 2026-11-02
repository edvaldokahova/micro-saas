"use client";

// Botão «?» com um pequeno guia. No computador abre ao passar o rato; em qualquer ecrã abre ao tocar.
// Fecha ao tocar fora ou com Esc. No telemóvel ocupa a largura do ecrã.
import { useEffect, useRef, useState } from "react";

export function HelpTip({ label, title, tabs, footer }: { label: string; title: string; tabs: { name: string; steps: string[] }[]; footer?: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const hoverOut = useRef<number | null>(null);
  // Aberto pelo rato: um clique a seguir fixa-o (não o fecha)
  const byHover = useRef(false);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Só abre ao passar o rato em ecrãs com rato (no telemóvel o toque trata disso)
  const hover = (on: boolean) => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (hoverOut.current) window.clearTimeout(hoverOut.current);
    if (on && !openRef.current) {
      byHover.current = true;
      setOpen(true);
    }
    else if (byHover.current) hoverOut.current = window.setTimeout(() => setOpen(false), 220);
  };

  return (
    <div ref={box} className="relative inline-flex" onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
      <button
        type="button"
        onClick={() => {
          if (byHover.current) {
            byHover.current = false;
            setOpen(true);
          } else setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={`grid h-7 w-7 place-items-center rounded-full border text-[13px] font-semibold transition ${open ? "border-ivory text-ivory" : "border-line-strong text-muted hover:border-ivory hover:text-ivory"}`}
      >
        ?
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={title}
          className="fixed inset-x-4 top-1/2 z-50 max-h-[80dvh] -translate-y-1/2 animate-fade overflow-y-auto rounded-2xl border border-line-strong bg-ink-2 p-4 shadow-[0_24px_60px_-20px_rgba(18,19,22,0.45)] [animation-duration:.15s] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[24rem] sm:translate-y-0"
        >
          <p className="pr-6 text-[14.5px] font-semibold leading-5">{title}</p>
          <div className="mt-3 flex gap-1.5" role="tablist">
            {tabs.map((t, i) => (
              <button
                key={t.name}
                type="button"
                role="tab"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className={`rounded-full border px-3 py-1 text-[12.5px] transition ${tab === i ? "border-ivory bg-ivory text-ink" : "border-line-strong text-muted hover:text-ivory"}`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <ol className="mt-3 space-y-2.5">
            {tabs[tab].steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-5">
                <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-3 font-mono text-[10.5px] text-ivory">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {footer && <p className="mt-3 border-t border-line pt-3 text-[12px] leading-5 text-muted">{footer}</p>}
          <button type="button" onClick={() => setOpen(false)} aria-label="×" className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-ink-3 hover:text-ivory sm:hidden">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
