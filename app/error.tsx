"use client";

// Página de erro própria (substitui o ecrã genérico do Next.js).
// Sem internet: "Sem ligação" e tenta de novo sozinha quando a rede volta.
// Outra falha: pede desculpa e oferece "Tentar de novo".
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mark, Wordmark } from "@/components/logo";

const T = {
  "pt-PT": {
    offTitle: "Sem ligação à internet",
    offLead: "Verifique o Wi-Fi ou os dados móveis. Quando a ligação voltar, continuamos onde parou.",
    errTitle: "Algo correu mal",
    errLead: "Não foi possível abrir esta página. Tente de novo; se continuar, escreva-nos.",
    retry: "Tentar de novo",
    home: "Voltar ao início",
    off: "Sem rede",
  },
  "es-ES": {
    offTitle: "Sin conexión a internet",
    offLead: "Revisa el wifi o los datos móviles. Cuando vuelva la conexión, seguimos donde lo dejaste.",
    errTitle: "Algo ha fallado",
    errLead: "No hemos podido abrir esta página. Inténtalo de nuevo; si sigue igual, escríbenos.",
    retry: "Reintentar",
    home: "Volver al inicio",
    off: "Sin red",
  },
  "pt-BR": {
    offTitle: "Sem conexão com a internet",
    offLead: "Verifique o Wi-Fi ou os dados móveis. Quando a conexão voltar, continuamos de onde você parou.",
    errTitle: "Algo deu errado",
    errLead: "Não foi possível abrir esta página. Tente de novo; se continuar, fale com a gente.",
    retry: "Tentar de novo",
    home: "Voltar ao início",
    off: "Sem rede",
  },
} as const;

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [offline, setOffline] = useState(false);
  const [lang, setLang] = useState<keyof typeof T>("pt-PT");

  useEffect(() => {
    const l = document.documentElement.lang as keyof typeof T;
    if (l in T) setLang(l);
    const isNetwork = !navigator.onLine || /fetch|network|load failed/i.test(error.message);
    setOffline(isNetwork);
    const back = () => {
      setOffline(false);
      reset();
    };
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, [error, reset]);

  const t = T[lang];
  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-5 py-16 text-center">
      <div className="max-w-[420px]">
        <Mark spin={offline} className="mx-auto h-[76px] w-[76px] text-ivory" />
        <h1 className="mt-7 font-display text-[30px] leading-[1.08]">{offline ? t.offTitle : t.errTitle}</h1>
        <p className="mt-3 text-[16px] leading-[1.55] text-muted">{offline ? t.offLead : t.errLead}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => (offline ? window.location.reload() : reset())} className="btn btn-primary">
            {t.retry}
          </button>
          {!offline && (
            <Link href="/" className="btn btn-secondary">
              {t.home}
            </Link>
          )}
        </div>
        {offline && (
          <p className="mt-5 inline-flex items-center gap-2 text-[13px] text-muted">
            <span className="h-[7px] w-[7px] rounded-full bg-bad" />
            {t.off}
          </p>
        )}
        <div className="mt-12 flex justify-center text-muted">
          <Wordmark className="h-[13px] w-auto" />
        </div>
      </div>
    </main>
  );
}

