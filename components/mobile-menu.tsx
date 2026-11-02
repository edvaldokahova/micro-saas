"use client";

// Menu do telemóvel no site público. As três barras transformam-se num × em dois tempos:
// a barra do meio recolhe para o centro enquanto as de cima e de baixo se juntam, e só depois
// estas rodam com um pequeno ressalto. Ao fechar, o movimento faz-se ao contrário.
// Fecha ao tocar fora, com Esc ou ao escolher uma opção (como o menu dos idiomas).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type L = { href: string; label: string };

const EASE = "cubic-bezier(.4,0,.2,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";

export function MobileMenu({ links, signIn, tryFree, label }: { links: L[]; signIn: L; tryFree: L; label: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Barra de cima (dir 1) ou de baixo (dir -1): a camada de fora desloca, a de dentro roda
  const outer = (dir: 1 | -1) => (
    <span
      className="absolute left-0 top-1/2 -mt-[0.8px] block h-[1.6px] w-4"
      style={{
        transform: open ? "translateY(0)" : `translateY(${-5 * dir}px)`,
        transition: open ? `transform 180ms ${EASE}` : `transform 200ms ${EASE} 200ms`,
      }}
    >
      <span
        className="block h-full w-full rounded-full bg-current"
        style={{
          transform: open ? `rotate(${45 * dir}deg)` : "rotate(0deg)",
          transition: open ? `transform 320ms ${SPRING} 170ms` : `transform 200ms ${EASE}`,
        }}
      />
    </span>
  );

  const close = () => setOpen(false);

  return (
    <div ref={root} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={label}
        className={`grid h-9 w-9 place-items-center rounded-lg border text-ivory transition-colors ${open ? "border-ivory" : "border-line hover:border-ivory"}`}
      >
        <span className="relative block h-4 w-4" aria-hidden>
          {outer(1)}
          {/* Meio: recolhe para o centro e desaparece */}
          <span
            className="absolute left-0 top-1/2 -mt-[0.8px] block h-[1.6px] w-4 rounded-full bg-current"
            style={{
              transform: open ? "scaleX(0)" : "scaleX(1)",
              opacity: open ? 0 : 1,
              transition: open ? `transform 160ms ${EASE}, opacity 160ms ${EASE}` : `transform 220ms ${EASE} 220ms, opacity 220ms ${EASE} 220ms`,
            }}
          />
          {outer(-1)}
        </span>
      </button>
      {open && (
        <div className="card absolute right-0 z-50 mt-2 w-56 animate-rise p-2 [animation-duration:.25s]">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-ink-3">
              {l.label}
            </Link>
          ))}
          <Link href={signIn.href} onClick={close} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-ink-3">
            {signIn.label}
          </Link>
          <Link href={tryFree.href} onClick={close} className="btn btn-primary btn-sm mt-1 w-full">
            {tryFree.label}
          </Link>
        </div>
      )}
    </div>
  );
}
