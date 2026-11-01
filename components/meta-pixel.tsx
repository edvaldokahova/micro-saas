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

const TEXTS: Record<string, { title: string; text: string; yes: string; no: string; more: string; manage: string }> = {
  pt: {
    title: "Ajude-nos a chegar a mais escritórios",
    text: "Com a sua autorização, usamos cookies de medição da Meta para saber que anúncios trazem visitas. Não vendemos dados e pode mudar de ideias quando quiser, no fundo da página.",
    yes: "Aceitar e continuar",
    no: "Recusar",
    more: "Política de privacidade",
    manage: "Cookies",
  },
  es: {
    title: "Ayúdanos a llegar a más despachos",
    text: "Con tu permiso, usamos cookies de medición de Meta para saber qué anuncios traen visitas. No vendemos datos y puedes cambiar de opinión cuando quieras, al pie de la página.",
    yes: "Aceptar y continuar",
    no: "Rechazar",
    more: "Política de privacidad",
    manage: "Cookies",
  },
  "pt-BR": {
    title: "Ajude a gente a chegar a mais escritórios",
    text: "Com a sua autorização, usamos cookies de medição da Meta para saber quais anúncios trazem visitas. Não vendemos dados e você pode mudar de ideia quando quiser, no rodapé da página.",
    yes: "Aceitar e continuar",
    no: "Recusar",
    more: "Política de privacidade",
    manage: "Cookies",
  },
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
  // Escolha obrigatória antes de continuar: o fundo fica desfocado até aceitar ou recusar.
  // As duas opções têm o mesmo peso e o mesmo tamanho (é o que a lei europeia exige).
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-ink/40 p-3 backdrop-blur-md sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="bl-consent-title">
      <div className="w-full max-w-md animate-rise rounded-2xl border border-line bg-ink-2 p-5 shadow-[0_24px_60px_-20px_rgba(18,19,22,0.45)] sm:p-6">
        <p id="bl-consent-title" className="text-[17px] font-semibold tracking-[-0.01em]">{t.title}</p>
        <p className="mt-2 text-[14px] leading-6 text-muted">{t.text}</p>
        <a href="https://www.bilonai.com/privacidade" className="mt-2 inline-block text-[13px] text-ivory underline decoration-line-strong underline-offset-4">
          {t.more}
        </a>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              saveConsent("no");
              setConsent("no");
            }}
            className="btn btn-secondary"
          >
            {t.no}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => {
              saveConsent("yes");
              setConsent("yes");
            }}
            className="btn btn-primary"
          >
            {t.yes}
          </button>
        </div>
      </div>
    </div>
  );
}

// «Cookies» no rodapé: apaga a escolha e volta a perguntar (retirar o consentimento tem de ser tão fácil como dá-lo)
export function CookieSettings({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const domain = location.hostname.endsWith("bilonai.com") ? "; domain=.bilonai.com" : "";
        document.cookie = `bl_consent=; path=/; max-age=0; samesite=lax; secure${domain}`;
        location.reload();
      }}
      className="transition hover:text-ivory"
    >
      {label}
    </button>
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
