"use client";

// Aviso flutuante no canto superior direito (no telemóvel, por baixo do cabeçalho), como o da Supabase:
// sucesso desaparece sozinho; erro fica até ser fechado. Não mexe no scroll da página.
import { useEffect, useState } from "react";

export function Toast({ tone, text }: { tone: "ok" | "bad"; text: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    setOpen(true);
    if (tone !== "ok") return;
    const t = window.setTimeout(() => setOpen(false), 4200);
    return () => window.clearTimeout(t);
  }, [tone, text]);
  if (!open) return null;
  return (
    <div className="pointer-events-none fixed inset-x-3 top-[4.5rem] z-[60] flex justify-end sm:inset-x-auto sm:right-5 sm:top-20">
      <div
        role={tone === "ok" ? "status" : "alert"}
        className="pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-xl border border-line bg-ink-2 px-4 py-3 text-[14px] leading-5 shadow-[0_16px_40px_-14px_rgba(18,19,22,0.35)] [animation-duration:.25s] sm:w-auto"
      >
        {tone === "ok" ? (
          <span className="mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-ivory text-ink" aria-hidden>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.4 6.3l2.4 2.3 4.8-5" />
            </svg>
          </span>
        ) : (
          <span className="mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-bad text-white" aria-hidden>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 2.8v3.7M6 9.1v.1" />
            </svg>
          </span>
        )}
        <span className={`min-w-0 flex-1 ${tone === "bad" ? "text-bad" : ""}`}>{text}</span>
        <button type="button" onClick={() => setOpen(false)} className="-mr-1 grid h-5 w-5 shrink-0 place-items-center rounded text-muted hover:text-ivory" aria-label="OK">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
