"use client";

// Cabeçalho do site público: transparente enquanto se está na abertura (hero) e,
// ao sair dela, fica com o fundo da página (sem sombra nem linha: não se vê onde acaba).
// Nas páginas sem abertura marcada ([data-hero]), muda logo ao primeiro scroll.
import { useEffect, useState } from "react";

export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      const limit = hero ? hero.offsetTop + hero.offsetHeight - 68 : 8;
      setSolid(window.scrollY > Math.max(8, limit));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      data-solid={solid || undefined}
      className={`sticky top-0 z-30 transition-[background-color] duration-300 ${
        solid ? "bg-ink-2 [[data-theme=dark]_&]:bg-ink" : "bg-transparent"
      }`}
    >
      {children}
    </header>
  );
}
