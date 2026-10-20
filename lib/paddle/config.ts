import type { PlanKey } from "@/lib/site";

// Configuração pública da Paddle (pode ir para o navegador).
// Por defeito usa a sandbox; em produção definir as variáveis NEXT_PUBLIC_PADDLE_* na Vercel.
export const paddleEnv: "sandbox" | "production" =
  process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";

export type BillingInterval = "month" | "year";

const sandboxDefaults = {
  token: "test_efde35a088caeb0cbe695d8b0bd",
  starter: "pri_01m59w26jz78wrh04tchgtf60f",
  office: "pri_01m59wbxeh6q590cs7x7qtj71p",
  starterYear: "",
  officeYear: "",
};

// Em produção nunca cai nos valores da sandbox: se faltar a variável, fica vazio e o checkout recusa.
const fallback = (key: keyof typeof sandboxDefaults) => (paddleEnv === "sandbox" ? sandboxDefaults[key] : "");

export const paddleClientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || fallback("token");

// Um preço mensal e um anual por plano (na Paddle: dois preços no mesmo produto)
export const priceIds: Record<PlanKey, Record<BillingInterval, string>> = {
  starter: {
    month: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || fallback("starter"),
    year: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEAR || fallback("starterYear"),
  },
  office: {
    month: process.env.NEXT_PUBLIC_PADDLE_PRICE_OFFICE || fallback("office"),
    year: process.env.NEXT_PUBLIC_PADDLE_PRICE_OFFICE_YEAR || fallback("officeYear"),
  },
};

// O plano anual só aparece quando os dois preços anuais estiverem configurados
export const annualEnabled = !!(priceIds.starter.year && priceIds.office.year);

export function planFromPriceId(priceId: string | null | undefined): { plan: PlanKey; interval: BillingInterval } | null {
  if (!priceId) return null;
  for (const plan of ["starter", "office"] as PlanKey[]) {
    for (const interval of ["month", "year"] as BillingInterval[]) {
      if (priceIds[plan][interval] && priceIds[plan][interval] === priceId) return { plan, interval };
    }
  }
  return null;
}
