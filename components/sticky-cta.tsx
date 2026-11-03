"use client";

// Botão flutuante da página inicial: aparece em baixo quando o botão da abertura sai do ecrã,
// e esconde-se nas secções que já têm o seu próprio botão (preços, chamada final, rodapé).
import { useEffect, useState } from "react";
import Link from "next/link";

export function StickyCta({ label, href = "/registar" }: { label: string; href?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-hero-cta]");
    const zones = Array.from(document.querySelectorAll("[data-cta-zone], footer"));
    let past = false;
    const inside = new Set<Element>();
    const update = () => setShow(past && inside.size === 0);
    // Só depois de passar o botão da abertura (não antes de ele aparecer)
    const heroIo = new IntersectionObserver(([e]) => {
      past = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    });
    const zoneIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? inside.add(e.target) : inside.delete(e.target);
        update();
      },
      { rootMargin: "-10% 0px -12% 0px" },
    );
    if (hero) heroIo.observe(hero);
    zones.forEach((z) => zoneIo.observe(z));
    return () => {
      heroIo.disconnect();
      zoneIo.disconnect();
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      aria-hidden={!show}
    >
      <Link
        href={href}
        tabIndex={show ? 0 : -1}
        className={`group btn btn-primary btn-shine min-h-[3.25rem] !gap-3.5 py-1.5 pl-6 pr-1.5 text-[15px] font-semibold shadow-[0_14px_36px_-14px_rgba(18,19,22,0.45)] transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          show ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-[140%] opacity-0"
        }`}
        style={{ ["--shine-delay" as string]: "0.6s" }}
      >
        {label}
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-ivory" aria-hidden>
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-0.5"><path d="M3 9h12M10.5 4.5L15 9l-4.5 4.5" /></svg>
        </span>
      </Link>
    </div>
  );
}
