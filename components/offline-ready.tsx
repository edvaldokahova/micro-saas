"use client";

// Regista o service worker que mostra a página "Sem ligação" quando falha a internet (só em produção)
import { useEffect } from "react";

export function OfflineReady() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
