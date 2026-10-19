"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { paddleApi } from "@/lib/paddle/server";
import { priceIds } from "@/lib/paddle/config";
import type { PlanKey } from "@/lib/site";

type Office = {
  id: string;
  plan: string;
  plan_status: string;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
};

const isPlan = (p: unknown): p is PlanKey => p === "starter" || p === "office";
const hasLiveSubscription = (o: Office) =>
  !!o.paddle_subscription_id && (o.plan_status === "active" || o.plan_status === "past_due");

// Escritório do utilizador com sessão iniciada (via RLS: só vê o seu)
async function currentOffice(): Promise<Office> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data } = await supabase
    .from("offices")
    .select("id, plan, plan_status, paddle_subscription_id, paddle_customer_id")
    .maybeSingle();
  if (!data) redirect("/entrar");
  return data as Office;
}

// Cria a transação no servidor, com o escritório em custom_data (o navegador não o consegue alterar)
export async function startCheckout(plan: PlanKey): Promise<{ transactionId?: string; error?: string }> {
  if (!isPlan(plan) || !priceIds[plan]) return { error: "Plano inválido." };
  const office = await currentOffice();
  if (hasLiveSubscription(office)) return { error: "Já tem uma assinatura ativa. Use “Mudar de plano”." };

  try {
    const txn = await paddleApi<{ id: string }>("/transactions", {
      method: "POST",
      body: {
        items: [{ price_id: priceIds[plan], quantity: 1 }],
        custom_data: { office_id: office.id },
      },
    });
    return { transactionId: txn.id };
  } catch {
    return { error: "Não foi possível iniciar o pagamento. Tente de novo dentro de momentos." };
  }
}

// Muda entre Starter e Escritório; a Paddle cobra ou credita a diferença de imediato
export async function changePlan(plan: PlanKey): Promise<{ ok?: true; error?: string }> {
  if (!isPlan(plan) || !priceIds[plan]) return { error: "Plano inválido." };
  const office = await currentOffice();
  if (!hasLiveSubscription(office) || !/^sub_[a-z0-9]+$/i.test(office.paddle_subscription_id ?? "")) {
    return { error: "Não encontrámos uma assinatura ativa." };
  }
  if (office.plan === plan) return { ok: true };

  try {
    await paddleApi(`/subscriptions/${office.paddle_subscription_id}`, {
      method: "PATCH",
      body: {
        items: [{ price_id: priceIds[plan], quantity: 1 }],
        proration_billing_mode: "prorated_immediately",
      },
    });
    return { ok: true };
  } catch {
    return { error: "Não foi possível mudar de plano. Tente de novo ou contacte o suporte." };
  }
}

// Abre o portal do cliente da Paddle (método de pagamento, faturas, cancelamento)
export async function openPortal() {
  const office = await currentOffice();
  if (!office.paddle_customer_id || !/^ctm_[a-z0-9]+$/i.test(office.paddle_customer_id)) {
    redirect("/app/assinatura");
  }

  let url: string;
  try {
    const session = await paddleApi<{ urls: { general: { overview: string } } }>(
      `/customers/${office.paddle_customer_id}/portal-sessions`,
      {
        method: "POST",
        body: office.paddle_subscription_id ? { subscription_ids: [office.paddle_subscription_id] } : {},
      },
    );
    url = session.urls.general.overview;
  } catch {
    redirect("/app/assinatura?erro=portal");
  }
  redirect(url);
}
