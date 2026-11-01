import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { paddleApi } from "@/lib/paddle/server";
import { paddleEnv, planFromPriceId } from "@/lib/paddle/config";
import { site } from "@/lib/site";

// Envio das vendas para a UTMify (https://docs.utmify.com.br/send-orders): cada pagamento da Paddle
// vira uma «order» com a origem do cliente (UTM guardada no registo), o valor, a taxa e o que fica para nós.
// Só funciona com UTMIFY_API_TOKEN na Vercel; sem ela, nada é enviado.
const ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";
const UTM_KEYS = ["src", "sck", "utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term"] as const;

export type UtmifyOrder = {
  orderId: string;
  platform: string;
  paymentMethod: "credit_card" | "boleto" | "pix" | "paypal" | "free_price";
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: { name: string; email: string; phone: string | null; document: string | null; country?: string };
  products: { id: string; name: string; planId: string | null; planName: string | null; quantity: number; priceInCents: number }[];
  trackingParameters: Record<(typeof UTM_KEYS)[number], string | null>;
  commission: { totalPriceInCents: number; gatewayFeeInCents: number; userCommissionInCents: number; currency?: string };
  isTest?: boolean;
};

export const utmifyEnabled = () => !!process.env.UTMIFY_API_TOKEN;

// "2026-11-01T13:05:09.123Z" -> "2026-11-01 13:05:09" (UTC, como a UTMify pede)
export function utcStamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace("T", " ");
}

// Envia uma venda. Devolve um resumo curto para o registo ("ok" ou o erro).
export async function postOrder(order: UtmifyOrder): Promise<string> {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) return "desligado";
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-token": token },
      body: JSON.stringify(order),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return order.isTest ? "ok (teste)" : "ok";
    const text = (await res.text().catch(() => "")).slice(0, 180);
    return `erro ${res.status}${text ? `: ${text}` : ""}`;
  } catch (e) {
    return `erro: ${e instanceof Error ? e.message : "rede"}`.slice(0, 200);
  }
}

function tracking(utm: unknown): UtmifyOrder["trackingParameters"] {
  const src = (utm && typeof utm === "object" ? utm : {}) as Record<string, unknown>;
  return Object.fromEntries(UTM_KEYS.map((k) => [k, typeof src[k] === "string" ? (src[k] as string).slice(0, 200) : null])) as UtmifyOrder["trackingParameters"];
}

const COUNTRY: Record<string, string> = { "pt-PT": "PT", "pt-BR": "BR", "es-ES": "ES" };

type Txn = {
  id: string;
  status?: string;
  customer_id?: string | null;
  currency_code?: string;
  created_at?: string;
  billed_at?: string | null;
  updated_at?: string;
  items?: { price?: { id?: string } }[];
  details?: { totals?: { total?: string; fee?: string | null; earnings?: string | null; currency_code?: string } };
  payments?: { method_details?: { type?: string } }[];
};

type Adjustment = { id: string; action?: string; status?: string; transaction_id?: string; created_at?: string; updated_at?: string };

async function buildFromTxn(db: SupabaseClient, txn: Txn, officeId: string | null): Promise<UtmifyOrder | null> {
  const { data: office } = officeId
    ? await db.from("offices").select("name, billing_email, locale, country, utm").eq("id", officeId).maybeSingle()
    : { data: null };
  const o = office as { name: string; billing_email: string | null; locale: string; country: string | null; utm: unknown } | null;

  let customer = { name: o?.name ?? "", email: o?.billing_email ?? "" };
  if (txn.customer_id) {
    const c = await paddleApi<{ name?: string | null; email?: string }>(`/customers/${txn.customer_id}`, { method: "GET" }).catch(() => null);
    if (c?.email) customer = { name: c.name || o?.name || c.email, email: c.email };
  }
  if (!customer.email) return null;

  const totals = txn.details?.totals ?? {};
  const total = Number(totals.total ?? 0);
  const fee = Number(totals.fee ?? 0);
  const earnings = totals.earnings != null ? Number(totals.earnings) : total - fee;
  const priceId = txn.items?.[0]?.price?.id ?? "bilonai";
  const plan = planFromPriceId(priceId);
  const method = txn.payments?.[0]?.method_details?.type;

  return {
    orderId: txn.id,
    platform: "Paddle",
    paymentMethod: method === "paypal" ? "paypal" : "credit_card",
    status: "paid",
    createdAt: utcStamp(txn.created_at) ?? utcStamp(new Date().toISOString())!,
    approvedDate: utcStamp(txn.billed_at ?? txn.updated_at),
    refundedAt: null,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: null,
      document: null,
      country: (o?.country && o.country !== "other" ? o.country : COUNTRY[o?.locale ?? ""]) ?? undefined,
    },
    products: [
      {
        id: priceId,
        name: `${site.name} ${plan ? site.plans[plan.plan].name : ""}`.trim(),
        planId: priceId,
        planName: plan ? (plan.interval === "year" ? "Anual" : "Mensal") : null,
        quantity: 1,
        priceInCents: total,
      },
    ],
    trackingParameters: tracking(o?.utm),
    commission: {
      totalPriceInCents: total,
      gatewayFeeInCents: fee,
      userCommissionInCents: earnings > 0 ? earnings : total,
      currency: (totals.currency_code ?? txn.currency_code ?? "EUR").toUpperCase(),
    },
    isTest: paddleEnv !== "production",
  };
}

// Chamado pelo webhook da Paddle depois de aplicar o evento. Devolve o resultado (ou null se não se aplica).
export async function utmifyFromPaddle(db: SupabaseClient, eventType: string, data: unknown, officeId: string | null): Promise<string | null> {
  if (!utmifyEnabled()) return null;

  // Pagamento concluído (primeira compra ou renovação)
  if (eventType === "transaction.completed") {
    const order = await buildFromTxn(db, data as Txn, officeId);
    return order ? postOrder(order) : "erro: sem e-mail do cliente";
  }

  // Reembolso ou chargeback aprovado: mesma venda, novo estado (a data de criação mantém-se)
  if (eventType === "adjustment.created" || eventType === "adjustment.updated") {
    const adj = data as Adjustment;
    if (adj.status !== "approved" || !adj.transaction_id || (adj.action !== "refund" && adj.action !== "chargeback")) return null;
    const txn = await paddleApi<Txn>(`/transactions/${adj.transaction_id}`, { method: "GET" }).catch(() => null);
    if (!txn) return "erro: transação não encontrada";
    const order = await buildFromTxn(db, txn, officeId);
    if (!order) return "erro: sem e-mail do cliente";
    order.status = adj.action === "chargeback" ? "chargedback" : "refunded";
    order.refundedAt = utcStamp(adj.updated_at ?? adj.created_at);
    return postOrder(order);
  }
  return null;
}

// Venda de teste (o botão do painel administrativo): valida a ligação sem gravar nada na UTMify
export function testOrder(): UtmifyOrder {
  const now = utcStamp(new Date().toISOString())!;
  return {
    orderId: `teste-${Date.now()}`,
    platform: "Paddle",
    paymentMethod: "credit_card",
    status: "paid",
    createdAt: now,
    approvedDate: now,
    refundedAt: null,
    customer: { name: "Teste Bilonai", email: "teste@bilonai.com", phone: null, document: null, country: "PT" },
    products: [{ id: "teste", name: `${site.name} Starter`, planId: "teste", planName: "Mensal", quantity: 1, priceInCents: site.plans.starter.priceEur * 100 }],
    trackingParameters: tracking({ utm_source: "teste" }),
    commission: { totalPriceInCents: 1500, gatewayFeeInCents: 170, userCommissionInCents: 1330, currency: "EUR" },
    isTest: true,
  };
}
