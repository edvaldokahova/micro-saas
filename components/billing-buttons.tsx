"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePlan, startCheckout } from "@/app/app/assinatura/actions";
import { loadPaddle } from "@/lib/paddle/client";
import type { PlanKey } from "@/lib/site";

const base = "w-full rounded-xl px-5 py-3 text-center font-semibold transition disabled:opacity-60";
const styles = {
  primary: `${base} bg-gold text-ink hover:brightness-110`,
  secondary: `${base} border border-line hover:border-gold/60`,
};

export function SubscribeButton({
  plan,
  label,
  locale,
  primary = false,
}: {
  plan: PlanKey;
  label: string;
  locale: "pt" | "es";
  primary?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  // Pré-carrega o Paddle.js para o checkout abrir sem espera
  useEffect(() => {
    loadPaddle().catch(() => {});
  }, []);

  function onClick() {
    setError("");
    start(async () => {
      const res = await startCheckout(plan);
      if (!res.transactionId) {
        setError(res.error ?? "Erro inesperado.");
        return;
      }
      try {
        const paddle = await loadPaddle();
        paddle.Checkout.open({
          transactionId: res.transactionId,
          settings: { successUrl: `${window.location.origin}/app/assinatura?ok=1`, locale },
        });
      } catch {
        setError("Não foi possível abrir o pagamento. Verifique a ligação e tente de novo.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={onClick} disabled={pending} className={primary ? styles.primary : styles.secondary}>
        {pending ? "A abrir pagamento…" : label}
      </button>
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}

export function ChangePlanButton({ plan, label }: { plan: PlanKey; label: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  function onClick() {
    if (!window.confirm("Mudar de plano agora? A diferença de preço é cobrada ou creditada de imediato.")) return;
    setMessage("");
    start(async () => {
      const res = await changePlan(plan);
      if (res.error) {
        setMessage(res.error);
        return;
      }
      setMessage("Pedido enviado. O plano atualiza-se em alguns segundos.");
      setTimeout(() => router.refresh(), 4000);
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={onClick} disabled={pending} className={styles.secondary}>
        {pending ? "A mudar…" : label}
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
