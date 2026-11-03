"use client";

// Menu do telemóvel no site público, em ecrã inteiro (por baixo do cabeçalho, que continua visível
// com o logótipo e o botão). As três barras têm comprimentos diferentes e alinham-se à direita;
// ao abrir, igualam-se e transformam-se num × em dois tempos: a do meio recolhe enquanto as outras
// se juntam, e só depois rodam com um pequeno ressalto. Ao fechar, faz-se o caminho inverso.
// Fecha com o ×, com Esc ou ao escolher uma opção.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

type L = { href: string; label: string };

const EASE = "cubic-bezier(.4,0,.2,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";

export function MobileMenu({ links, signIn, tryFree, label, closeLabel }: { links: L[]; signIn: L; tryFree: L; label: string; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  // O painel fica montado um instante depois de fechar, para sair a desvanecer
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
    else if (mounted) {
      const t = setTimeout(() => setMounted(false), 260);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // Sem scroll da página por trás enquanto o menu está aberto
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    html.dataset.menuOpen = "1";
    document.addEventListener("keydown", onKey);
    const toWide = () => window.innerWidth >= 640 && setOpen(false);
    window.addEventListener("resize", toWide);
    return () => {
      html.style.overflow = prev;
      delete html.dataset.menuOpen;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", toWide);
    };
  }, [open]);

  // Barra de cima (dir 1) ou de baixo (dir -1): a camada de fora desloca, a do meio dá o comprimento,
  // a de dentro roda. Fechado, a de baixo é mais curta; ao passar o dedo/rato, todas ficam iguais.
  const outer = (dir: 1 | -1) => (
    <span
      className="absolute inset-x-0 top-1/2 -mt-[0.9px] flex h-[1.8px] justify-end"
      style={{
        transform: open ? "translateY(0)" : `translateY(${-5.5 * dir}px)`,
        transition: open ? `transform 180ms ${EASE}` : `transform 200ms ${EASE} 200ms`,
      }}
    >
      <span className={`block h-full transition-[width] duration-200 ${open || dir === 1 ? "w-full" : "w-[55%] group-hover:w-full"}`}>
        <span
          className="block h-full w-full rounded-full bg-current"
          style={{
            transform: open ? `rotate(${45 * dir}deg)` : "rotate(0deg)",
            transition: open ? `transform 320ms ${SPRING} 170ms` : `transform 200ms ${EASE}`,
          }}
        />
      </span>
    </span>
  );

  const close = () => setOpen(false);

  const panel = mounted
    ? createPortal(
        <div
          className={`fixed inset-0 z-[29] flex flex-col bg-ink px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[88px] transition-opacity duration-[250ms] sm:hidden ${open ? "opacity-100" : "opacity-0"}`}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <nav className="flex flex-col">
            {links.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="group/link flex animate-rise items-center gap-2 py-3.5 text-[26px] font-medium tracking-[-0.02em] text-ivory [animation-duration:.45s]"
                style={{ animationDelay: `${60 + i * 55}ms` }}
              >
                {l.label}
                <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 text-muted transition-transform duration-300 group-hover/link:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 3.5L10.5 8 6 12.5" />
                </svg>
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex animate-rise flex-col gap-3 [animation-duration:.45s]" style={{ animationDelay: `${80 + links.length * 55}ms` }}>
            <Link href={signIn.href} onClick={close} className="btn btn-secondary min-h-[3.25rem] w-full text-[15px]">
              {signIn.label}
            </Link>
            <Link href={tryFree.href} onClick={close} className="btn btn-primary btn-shine min-h-[3.25rem] w-full text-[15px] font-semibold">
              {tryFree.label}
            </Link>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? closeLabel : label}
        className="group grid h-10 w-10 place-items-center rounded-full text-ivory transition-colors hover:bg-ivory/[0.06]"
      >
        <span className="relative block h-5 w-5" aria-hidden>
          {outer(1)}
          {/* Meio: mais curto, recolhe para a direita e desaparece */}
          <span className="absolute inset-x-0 top-1/2 -mt-[0.9px] flex h-[1.8px] justify-end">
            <span
              className={`block h-full rounded-full bg-current transition-[width] duration-200 ${open ? "w-full" : "w-[78%] group-hover:w-full"}`}
              style={{
                transform: open ? "scaleX(0)" : "scaleX(1)",
                transformOrigin: "right center",
                opacity: open ? 0 : 1,
                transition: open ? `transform 160ms ${EASE}, opacity 160ms ${EASE}` : `transform 220ms ${EASE} 220ms, opacity 220ms ${EASE} 220ms, width 200ms ${EASE}`,
              }}
            />
          </span>
          {outer(-1)}
        </span>
      </button>
      {panel}
    </div>
  );
}
