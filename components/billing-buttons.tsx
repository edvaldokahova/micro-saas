"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePlan, startCheckout, type BillingError } from "@/app/app/assinatura/actions";
import { loadPaddle } from "@/lib/paddle/client";
import type { PlanKey } from "@/lib/site";

export type BillingTexts = {
  opening: string;
  changing: string;
  changeConfirm: string;
  changeSent: string;
  openError: string;
  errors: Record<BillingError, string>;
};

export function SubscribeButton({
  plan,
  label,
  locale,
  primary = false,
  t,
}: {
  plan: PlanKey;
  label: string;
  locale: "pt" | "es";
  primary?: boolean;
  t: BillingTexts;
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
        setError(res.error ? t.errors[res.error] : t.openError);
        return;
      }
      try {
        const paddle = await loadPaddle();
        paddle.Checkout.open({
          transactionId: res.transactionId,
          settings: { successUrl: `${window.location.origin}/app/assinatura?ok=1`, locale },
        });
      } catch {
        setError(t.openError);
      }
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={onClick} disabled={pending} className={`btn w-full ${primary ? "btn-primary" : "btn-secondary"}`}>
        {pending ? t.opening : label}
      </button>
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}

export function ChangePlanButton({ plan, label, t }: { plan: PlanKey; label: string; t: BillingTexts }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  function onClick() {
    if (!window.confirm(t.changeConfirm)) return;
    setMessage("");
    start(async () => {
      const res = await changePlan(plan);
      if (res.error) {
        setMessage(t.errors[res.error]);
        return;
      }
      setMessage(t.changeSent);
      setTimeout(() => router.refresh(), 4000);
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={onClick} disabled={pending} className="btn btn-secondary w-full">
        {pending ? t.changing : label}
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
