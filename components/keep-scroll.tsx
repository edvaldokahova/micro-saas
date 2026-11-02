"use client";

// Depois de guardar um formulário a página não salta para o topo: fica onde estava e o aviso
// (toast) aparece por cima. As ações do servidor voltam à mesma página com ?ok=…, o que faria o Next
// subir a página; aqui guardamos a posição no envio e repomo-la quando a página volta.
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

let saved: { path: string; y: number; at: number } | null = null;

export function KeepScroll() {
  const path = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const onSubmit = () => {
      saved = { path: location.pathname, y: window.scrollY, at: Date.now() };
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  useEffect(() => {
    const s = saved;
    if (!s || s.path !== path || Date.now() - s.at > 20000) return;
    saved = null;
    const back = () => window.scrollTo({ top: s.y, behavior: "instant" as ScrollBehavior });
    back();
    // O Next ainda pode ajustar o scroll depois de mostrar a página: repõe mais duas vezes
    requestAnimationFrame(back);
    const t = window.setTimeout(back, 80);
    return () => window.clearTimeout(t);
  }, [path, params]);

  return null;
}
