"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Barra fina no topo durante a navegação (como no painel da Vercel):
// arranca no clique, avança devagar enquanto o servidor responde e completa quando a página nova chega.
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timer = useRef<number | undefined>(undefined);

  // Página nova chegou: completa e desaparece
  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
    window.clearTimeout(timer.current ?? undefined);
    timer.current = window.setTimeout(() => setState("idle"), 400);
  }, [pathname, search]);

  // Cliques em links internos (e envio de formulários GET) arrancam a barra
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      window.clearTimeout(timer.current ?? undefined);
      setState("loading");
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (state === "idle") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]" aria-hidden>
      <div className={`nav-progress h-full ${state === "done" ? "nav-progress-done" : ""}`} />
    </div>
  );
}
