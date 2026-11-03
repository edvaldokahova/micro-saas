"use server";

// Ações do módulo de finanças (só administradores). Cada uma volta à página com um aviso.
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSetting, setSetting, type Plans } from "@/lib/platform";
import { TOOLS, AD_PLATFORMS, CURRENCIES, type Currency } from "@/lib/finance-catalog";
import { addMonths, getFinSettings, isMonth, monthEnd, monthKey, monthStart, type FinSettings } from "@/lib/finance";

const back = (mes: string, ok: string, hash = "") => redirect(`/financas?mes=${mes}&ok=${ok}${hash}`);
const fail = (mes: string, erro: string, hash = "") => redirect(`/financas?mes=${mes}&erro=${erro}${hash}`);

// Números escritos à portuguesa («1.234,56» ou «1234,5») ou à inglesa
function num(v: FormDataEntryValue | null, fallback = 0): number {
  let s = String(v ?? "").trim().replace(/\s|\$|€|kz/gi, "");
  if (!s) return fallback;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}
const pos = (v: number) => Math.max(0, Math.round(v * 100) / 100);
const mesOf = (f: FormData) => {
  const m = String(f.get("mes") ?? "");
  return isMonth(m) ? m : monthKey(new Date());
};
const thisMonth = () => monthKey(new Date());

/* ---------- Definições ---------- */

export async function saveFinSettings(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  const cur = await getFinSettings();
  const pct = { reinvest: pos(num(f.get("p_reinvest"))), local: pos(num(f.get("p_local"))), tax: pos(num(f.get("p_tax"))), founder: pos(num(f.get("p_founder"))) };
  const sum = pct.reinvest + pct.local + pct.tax + pct.founder;
  if (Math.abs(sum - 100) > 0.01) return fail(mes, "pct", "#definicoes");
  const pctOf = (k: string, d: number) => Math.min(100, pos(num(f.get(k), d)));
  const feeOf = (k: string, d: FinSettings["fees"]["greyIn"]) => ({
    fixed: pos(num(f.get(`${k}_fixed`), d.fixed)),
    pct: pctOf(`${k}_pct`, d.pct),
    min: pos(num(f.get(`${k}_min`), d.min)),
    max: pos(num(f.get(`${k}_max`), d.max)),
  });
  const eurManual = String(f.get("eur_mode")) === "manual";
  const next: FinSettings = {
    pct,
    baiPct: pctOf("bai_pct", cur.baiPct),
    buffer: pctOf("buffer", cur.buffer),
    fx: { usdAoa: Math.max(1, pos(num(f.get("usd_aoa"), cur.fx.usdAoa))), eurUsd: eurManual ? Math.max(0.01, num(f.get("eur_usd"), cur.fx.eurUsd ?? 1.08)) : null },
    threshold: Math.max(1, pos(num(f.get("threshold"), cur.threshold))),
    fees: {
      greyIn: feeOf("grey_in", cur.fees.greyIn),
      toAngola: feeOf("to_ao", cur.fees.toAngola),
      bankInAo: { pct: pctOf("bank_ao_pct", cur.fees.bankInAo.pct), fixedKz: pos(num(f.get("bank_ao_fixed"), cur.fees.bankInAo.fixedKz)) },
      greyToGrey: feeOf("g2g", cur.fees.greyToGrey),
    },
    ai: { inPerM: pos(num(f.get("ai_in"), cur.ai.inPerM)), outPerM: pos(num(f.get("ai_out"), cur.ai.outPerM)) },
  };
  await setSetting("finance", next);
  back(mes, "definicoes", "#definicoes");
}

// «Usar o câmbio de hoje»: copia o câmbio de mercado para o câmbio da empresa
export async function useMarketRate(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  const rate = num(f.get("rate"));
  if (rate > 0) {
    const s = await getFinSettings();
    await setSetting("finance", { ...s, fx: { ...s.fx, usdAoa: Math.round(rate * 100) / 100 } });
  }
  back(mes, "cambio", "#definicoes");
}

/* ---------- Ferramentas (planos) ---------- */

// Os planos da Vercel, Supabase e Resend também mudam os limites do cockpit
async function syncPlans(tool: string, paid: boolean) {
  if (tool !== "vercel" && tool !== "supabase" && tool !== "resend") return;
  const plans = await getSetting<Plans>("plans", { vercel: "hobby", supabase: "free", resend: "free" });
  if (tool === "vercel") plans.vercel = paid ? "pro" : "hobby";
  if (tool === "supabase") plans.supabase = paid ? "pro" : "free";
  if (tool === "resend") plans.resend = paid ? "pro" : "free";
  await setSetting("plans", plans);
}

// Ativar ou mudar de plano: conta a partir deste mês; o plano anterior fica no histórico até ao mês passado
export async function setToolPlan(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  const tool = TOOLS.find((t) => t.key === String(f.get("tool")));
  if (!tool) return fail(mes, "generico", "#custos");
  const planName = String(f.get("plan") ?? "");
  const plan = tool.plans.find((p) => p.name === planName);
  const custom = num(f.get("amount"), NaN);
  const amount = Number.isFinite(custom) && custom > 0 ? pos(custom) : (plan?.usd ?? 0);
  if (!amount) return fail(mes, "valor", "#custos");
  const name = plan ? plan.name : planName.trim().slice(0, 40) || "Plano";
  const billing = String(f.get("billing")) === "yearly" ? "yearly" : "monthly";
  const admin = createAdminClient();
  const start = monthStart(thisMonth());
  const { data: open } = await admin.from("fin_costs").select("id, active_from").eq("tool", tool.key).is("active_until", null).maybeSingle();
  if (open && open.active_from >= start) {
    await admin.from("fin_costs").update({ plan: name, amount, billing, currency: "USD" }).eq("id", open.id);
  } else {
    if (open) await admin.from("fin_costs").update({ active_until: monthEnd(addMonths(thisMonth(), -1)) }).eq("id", open.id);
    await admin.from("fin_costs").insert({ tool: tool.key, name: tool.name, plan: name, amount, currency: "USD", billing, active_from: start });
  }
  await syncPlans(tool.key, true);
  back(mes, "plano", "#custos");
}

// Deixar de pagar: o mês corrente ainda conta (já foi pago); a partir do próximo deixa de contar
export async function stopTool(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  const id = String(f.get("id"));
  const admin = createAdminClient();
  const { data: row } = await admin.from("fin_costs").select("tool").eq("id", id).maybeSingle();
  await admin.from("fin_costs").update({ active_until: monthEnd(thisMonth()) }).eq("id", id);
  if (row?.tool) await syncPlans(row.tool, false);
  back(mes, "parado", "#custos");
}

/* ---------- Custos extra ---------- */

export async function addExtraCost(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  const name = String(f.get("name") ?? "").trim().slice(0, 60);
  const amount = pos(num(f.get("amount")));
  const currency = (CURRENCIES as readonly string[]).includes(String(f.get("currency"))) ? (String(f.get("currency")) as Currency) : "USD";
  const from = String(f.get("from") ?? "");
  if (!name || !amount) return fail(mes, "valor", "#custos");
  await createAdminClient()
    .from("fin_costs")
    .insert({
      tool: null,
      name,
      plan: String(f.get("detail") ?? "").trim().slice(0, 60) || null,
      amount,
      currency,
      billing: String(f.get("billing")) === "yearly" ? "yearly" : "monthly",
      icon: ["africell", "building"].includes(String(f.get("icon"))) ? String(f.get("icon")) : null,
      active_from: monthStart(isMonth(from) ? from : thisMonth()),
    });
  back(mes, "custo", "#custos");
}

export async function endCost(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  await createAdminClient().from("fin_costs").update({ active_until: monthEnd(thisMonth()) }).eq("id", String(f.get("id")));
  back(mes, "parado", "#custos");
}

// Apagar uma linha registada por engano (some de todos os meses)
export async function removeCost(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  await createAdminClient().from("fin_costs").delete().eq("id", String(f.get("id")));
  back(mes, "apagado", "#custos");
}

/* ---------- Anúncios ---------- */

export async function saveAds(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  const rows = AD_PLATFORMS.map((p) => {
    const spentRaw = String(f.get(`spent_${p.key}`) ?? "").trim();
    return { month: monthStart(mes), platform: p.key, planned: pos(num(f.get(`planned_${p.key}`))), spent: spentRaw ? pos(num(spentRaw)) : null, updated_at: new Date().toISOString() };
  });
  await createAdminClient().from("fin_ads").upsert(rows);
  back(mes, "anuncios", "#anuncios");
}

/* ---------- Depósitos ---------- */

export async function addDeposit(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  const on = String(f.get("received_on") ?? "");
  const amount = pos(num(f.get("amount")));
  const bankFee = pos(num(f.get("bank_fee")));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(on) || !amount || bankFee >= amount) return fail(mes, "deposito", "#pagamentos");
  const s = await getFinSettings();
  await createAdminClient()
    .from("fin_deposits")
    .insert({ received_on: on, amount, bank_fee: bankFee, note: String(f.get("note") ?? "").trim().slice(0, 200) || null, snapshot: { pct: s.pct, baiPct: s.baiPct, fees: s.fees, usdAoa: s.fx.usdAoa } });
  back(on.slice(0, 7), "deposito", "#caixas");
}

// Marca (ou desmarca) uma transferência como feita
export async function toggleDone(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  const id = String(f.get("id"));
  const key = String(f.get("key"));
  if (!["reinvest", "local", "tax", "swift", "bai", "grey"].includes(key)) return fail(mes, "generico", "#caixas");
  const admin = createAdminClient();
  const { data } = await admin.from("fin_deposits").select("done").eq("id", id).maybeSingle();
  const done = { ...((data?.done as Record<string, boolean>) ?? {}) };
  done[key] = !done[key];
  await admin.from("fin_deposits").update({ done }).eq("id", id);
  back(mes, "marcado", "#caixas");
}

export async function removeDeposit(f: FormData): Promise<void> {
  await requireAdmin();
  const mes = mesOf(f);
  await createAdminClient().from("fin_deposits").delete().eq("id", String(f.get("id")));
  back(mes, "apagado", "#pagamentos");
}
