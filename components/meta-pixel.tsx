"use client";

// Pixel da Meta, configurado no painel administrativo (ID e eventos ligados).
// Na UE só pode carregar com consentimento: aparece um pedido discreto e a escolha fica 6 meses
// num cookie de todo o bilonai.com. Sem consentimento (ou sem ID), nada da Meta é carregado.
// Os eventos disparam com window.blTrack("Lead") etc.; só os ligados no painel seguem para a Meta.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    blTrack?: (event: string, params?: Record<string, unknown>) => void;
  }
}

const TEXTS: Record<string, { text: string; yes: string; no: string; more: string }> = {
  pt: { text: "Usamos cookies de medição da Meta para perceber de onde chegam os visitantes e melhorar os anúncios.", yes: "Aceitar", no: "Recusar", more: "Privacidade" },
  es: { text: "Usamos cookies de medición de Meta para saber de dónde llegan los visitantes y mejorar los anuncios.", yes: "Aceptar", no: "Rechazar", more: "Privacidad" },
  "pt-BR": { text: "Usamos cookies de medição da Meta para entender de onde chegam os visitantes e melhorar os anúncios.", yes: "Aceitar", no: "Recusar", more: "Privacidade" },
};

function readConsent(): "yes" | "no" | null {
  const c = document.cookie.split("; ").find((x) => x.startsWith("bl_consent="));
  const v = c?.slice(11);
  return v === "yes" || v === "no" ? v : null;
}
function saveConsent(v: "yes" | "no") {
  const domain = location.hostname.endsWith("bilonai.com") ? "; domain=.bilonai.com" : "";
  document.cookie = `bl_consent=${v}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax; secure${domain}`;
}

function loadPixel(id: string) {
  if (window.fbq) return;
  const f = function (...args: unknown[]) {
    if (f.callMethod) f.callMethod(...args);
    else f.queue!.push(args);
  } as Fbq;
  f.push = f;
  f.loaded = true;
  f.version = "2.0";
  f.queue = [];
  window.fbq = f;
  window._fbq = f;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  f("init", id);
}

export function MetaPixel({ id, events }: { id: string | null; events: string[] }) {
  const path = usePathname();
  const [consent, setConsent] = useState<"yes" | "no" | null | "unknown">("unknown");
  // Páginas dos clientes dos escritórios e o painel administrativo ficam sempre de fora
  const excluded = path.startsWith("/p/") || (typeof location !== "undefined" && location.hostname.startsWith("admin."));

  useEffect(() => setConsent(readConsent()), []);

  // Função de eventos sempre disponível (não faz nada sem consentimento ou com o evento desligado)
  useEffect(() => {
    window.blTrack = (event, params) => {
      if (!id || excluded || readConsent() !== "yes" || !events.includes(event)) return;
      loadPixel(id);
      window.fbq?.("track", event, params ?? {});
    };
  }, [id, events, excluded]);

  // PageView em cada página; ViewContent em preços e no registo
  useEffect(() => {
    if (!id || excluded || consent !== "yes") return;
    loadPixel(id);
    if (events.includes("PageView")) window.fbq?.("track", "PageView");
    if (events.includes("ViewContent") && (path === "/precos" || path === "/registar")) window.fbq?.("track", "ViewContent", { content_name: path.slice(1) });
  }, [id, events, excluded, consent, path]);

  if (!id || excluded || consent !== null) return null;
  const lang = document.documentElement.lang;
  const t = TEXTS[lang] ?? TEXTS[lang.slice(0, 2)] ?? TEXTS.pt;
  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] flex justify-center sm:inset-x-auto sm:bottom-5 sm:left-5 sm:justify-start">
      <div className="flex w-full max-w-md animate-rise flex-col gap-3 rounded-2xl border border-line bg-ink-2 p-4 text-[13.5px] leading-5 shadow-[0_16px_40px_-14px_rgba(18,19,22,0.35)] sm:flex-row sm:items-center">
        <p className="flex-1 text-muted">
          {t.text}{" "}
          <a href="https://www.bilonai.com/privacidade" className="text-ivory underline decoration-line-strong underline-offset-4">
            {t.more}
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              saveConsent("no");
              setConsent("no");
            }}
            className="btn btn-secondary btn-sm flex-1"
          >
            {t.no}
          </button>
          <button
            type="button"
            onClick={() => {
              saveConsent("yes");
              setConsent("yes");
            }}
            className="btn btn-primary btn-sm flex-1"
          >
            {t.yes}
          </button>
        </div>
      </div>
    </div>
  );
}

// Dispara um evento uma única vez ao abrir a página (ex.: Purchase depois do pagamento)
export function TrackOnce({ event, params }: { event: string; params?: Record<string, unknown> }) {
  useEffect(() => {
    const key = `bl_tracked_${event}_${location.pathname}${location.search}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    // Espera que o MetaPixel registe a função
    const t = window.setTimeout(() => window.blTrack?.(event, params), 400);
    return () => window.clearTimeout(t);
  }, [event, params]);
  return null;
}
