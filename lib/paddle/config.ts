import type { PlanKey } from "@/lib/site";

// Configuração pública da Paddle (pode ir para o navegador).
// Por defeito usa a sandbox; em produção definir as variáveis NEXT_PUBLIC_PADDLE_* na Vercel.
export const paddleEnv: "sandbox" | "production" =
  process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";

const sandboxDefaults = {
  token: "test_efde35a088caeb0cbe695d8b0bd",
  starter: "pri_01m59w26jz78wrh04tchgtf60f",
  office: "pri_01m59wbxeh6q590cs7x7qtj71p",
};

// Em produção nunca cai nos valores da sandbox: se faltar a variável, fica vazio e o checkout recusa.
const fallback = (key: keyof typeof sandboxDefaults) => (paddleEnv === "sandbox" ? sandboxDefaults[key] : "");

export const paddleClientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || fallback("token");

export const priceIds: Record<PlanKey, string> = {
  starter: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || fallback("starter"),
  office: process.env.NEXT_PUBLIC_PADDLE_PRICE_OFFICE || fallback("office"),
};

export function planFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  if (priceId === priceIds.starter) return "starter";
  if (priceId === priceIds.office) return "office";
  return null;
}
