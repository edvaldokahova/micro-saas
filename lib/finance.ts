import "server-only";
// Finanças da empresa (painel administrativo): receita líquida da Paddle, ciclo de pagamentos,
// as 4 caixas, custos do mês (ferramentas, IA, anúncios, extra) e câmbios.
// Valores internos em dólares (a moeda em que a Paddle paga). Os kwanzas só aparecem no fim.
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSetting } from "@/lib/platform";
import type { BoxKey, Currency } from "@/lib/finance-catalog";

/* ---------- Definições ---------- */

export type Fee = { fixed: number; pct: number; min: number; max: number };
export type FinSettings = {
  pct: Record<BoxKey, number>; // somam 100
  baiPct: number; // da caixa do fundador, quanto vai para o BAI (o resto fica na Grey pessoal)
  buffer: number; // folga sobre os custos técnicos (%)
  fx: { usdAoa: number; eurUsd: number | null }; // eurUsd null = automático
  threshold: number; // mínimo de pagamento da Paddle (USD)
  fees: {
    greyIn: Fee; // Paddle → Grey da empresa
    toAngola: Fee; // Grey → banco em Angola (por envio)
    bankInAo: { pct: number; fixedKz: number }; // o que o BFA/BAI desconta ao receber
    greyToGrey: Fee; // Grey da empresa → Grey pessoal
  };
  ai: { inPerM: number; outPerM: number };
};

const fee = (fixed: number, pct = 0, min = 0, max = 0): Fee => ({ fixed, pct, min, max });

export const DEFAULTS: FinSettings = {
  pct: { reinvest: 25, local: 20, tax: 15, founder: 40 },
  baiPct: 20,
  buffer: 15,
  fx: { usdAoa: 1140, eurUsd: null },
  threshold: 100,
  fees: {
    // Depósitos na Grey por ACH: 0,8 %, mín. 2 $, máx. 10 $ (por «wire» seriam 20 $)
    greyIn: fee(0, 0.8, 2, 10),
    // Um envio internacional (SWIFT) por depósito, da Grey para o BFA: 25 $ (confirmar no 1.º envio)
    toAngola: fee(25),
    // Comissão do banco angolano ao receber e converter (estimativa até ao 1.º depósito)
    bankInAo: { pct: 1, fixedKz: 0 },
    // Entre contas Grey: sem custo
    greyToGrey: fee(0),
  },
  // Preço da Google para o modelo em uso (gemini-flash-latest), por milhão de tokens
  ai: { inPerM: 0.75, outPerM: 3.75 },
};

export async function getFinSettings(): Promise<FinSettings> {
  const s = await getSetting<Partial<FinSettings>>("finance", {});
  return {
    ...DEFAULTS,
    ...s,
    pct: { ...DEFAULTS.pct, ...(s.pct ?? {}) },
    fx: { ...DEFAULTS.fx, ...(s.fx ?? {}) },
    fees: {
      greyIn: { ...DEFAULTS.fees.greyIn, ...(s.fees?.greyIn ?? {}) },
      toAngola: { ...DEFAULTS.fees.toAngola, ...(s.fees?.toAngola ?? {}) },
      bankInAo: { ...DEFAULTS.fees.bankInAo, ...(s.fees?.bankInAo ?? {}) },
      greyToGrey: { ...DEFAULTS.fees.greyToGrey, ...(s.fees?.greyToGrey ?? {}) },
    },
    ai: { ...DEFAULTS.ai, ...(s.ai ?? {}) },
  };
}

/* ---------- Câmbios ---------- */

export type Market = { eurUsd: number | null; brlUsd: number | null; usdAoa: number | null; at: string | null };

// Câmbio de mercado do dia (gratuito, sem chave, atualiza 1 vez por dia; pede atribuição no painel)
// Guardado em cache 6 horas; uma falha não fica em cache (tenta de novo no pedido seguinte)
const fetchMarket = unstable_cache(
  async (): Promise<Market> => {
    const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store", signal: AbortSignal.timeout(6000) });
    const j = (await r.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
    if (j.result !== "success" || !j.rates) throw new Error("fx");
    const inv = (c: string) => (j.rates![c] ? 1 / j.rates![c] : null);
    return { eurUsd: inv("EUR"), brlUsd: inv("BRL"), usdAoa: j.rates.AOA ?? null, at: j.time_last_update_utc ?? null };
  },
  ["fx-market"],
  { revalidate: 6 * 3600 },
);

export async function marketRates(): Promise<Market> {
  try {
    return await fetchMarket();
  } catch {
    return { eurUsd: null, brlUsd: null, usdAoa: null, at: null };
  }
}

export type Rates = { usdAoa: number; eurUsd: number; brlUsd: number; eurAuto: boolean };

export function ratesFrom(s: FinSettings, m: Market): Rates {
  return { usdAoa: s.fx.usdAoa, eurUsd: s.fx.eurUsd ?? m.eurUsd ?? 1.08, brlUsd: m.brlUsd ?? 0.18, eurAuto: s.fx.eurUsd == null };
}

export function toUsd(amount: number, cur: Currency, r: Rates): number {
  return cur === "USD" ? amount : cur === "EUR" ? amount * r.eurUsd : amount / r.usdAoa;
}

/* ---------- Taxas e caixas ---------- */

export function feeOf(f: Fee, amount: number): number {
  if (amount <= 0) return 0;
  let v = f.fixed + (amount * f.pct) / 100;
  if (f.min > 0) v = Math.max(v, f.min);
  if (f.max > 0) v = Math.min(v, f.max);
  return Math.min(v, amount);
}

export type Allocation = {
  net: number; // o que entrou na Grey da empresa, já sem a taxa de receção
  boxes: Record<BoxKey, number>;
  // Um só envio internacional (SWIFT) da Grey para o BFA da empresa: caixa 2 + a parte do fundador para o BAI
  swift: { usd: number; fee: number; bankFeeKz: number; kz: number };
  local: { usd: number; kz: number }; // fica no BFA para os custos da empresa em kwanzas
  // bai: parte do fundador (em $) que segue no SWIFT; baiKz: o que o fundador levanta do BFA para o BAI
  founder: { bai: number; baiKz: number; grey: number; greyFee: number };
};

// Divide o valor depositado pelas 4 caixas e calcula o que chega a cada conta depois das taxas.
// A taxa do SWIFT e a comissão do BFA repartem-se na proporção de cada parte.
export function allocate(net: number, s: Pick<FinSettings, "pct" | "baiPct" | "fees">, usdAoa: number): Allocation {
  const part = (k: BoxKey) => (net * (s.pct[k] ?? 0)) / 100;
  const boxes = { reinvest: part("reinvest"), local: part("local"), tax: part("tax"), founder: part("founder") };
  const bai = (boxes.founder * s.baiPct) / 100;
  const swiftUsd = boxes.local + bai;
  const fee = feeOf(s.fees.toAngola, swiftUsd);
  const gross = Math.max(0, swiftUsd - fee) * usdAoa;
  const bankFeeKz = gross > 0 ? Math.min(gross, (gross * s.fees.bankInAo.pct) / 100 + s.fees.bankInAo.fixedKz) : 0;
  const kz = gross - bankFeeKz;
  const baiKz = swiftUsd > 0 ? (kz * bai) / swiftUsd : 0;
  const grey = boxes.founder - bai;
  return {
    net,
    boxes,
    swift: { usd: swiftUsd, fee, bankFeeKz, kz },
    local: { usd: boxes.local, kz: kz - baiKz },
    founder: { bai, baiKz, grey, greyFee: feeOf(s.fees.greyToGrey, grey) },
  };
}

/* ---------- Meses ---------- */

export const monthKey = (d: Date) => d.toISOString().slice(0, 7);
export function addMonths(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return monthKey(d);
}
export const monthStart = (key: string) => `${key}-01`;
export function monthEnd(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
export const isMonth = (v: unknown): v is string => typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

// Dia útil n depois de uma data (só fins de semana; feriados variam por banco)
function addWorkdays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  while (n > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const w = d.getUTCDay();
    if (w !== 0 && w !== 6) n--;
  }
  return d.toISOString().slice(0, 10);
}

/* ---------- Receita (Paddle) ---------- */

export type MonthRevenue = { month: string; gross: number; fee: number; net: number; refunds: number; count: number };

type Totals = { total?: string; tax?: string; fee?: string; earnings?: string; currency_code?: string; chargeback_fee?: { amount?: string } } | null;
type Row = { event_type: string; received_at: string; t: Totals; pt: Totals; apt: Totals; adj: string | null; action: string | null; status: string | null };

// Receita por mês em dólares: faturado (sem IVA, que a Paddle entrega ao Estado), taxa da Paddle e líquido,
// já descontados reembolsos e chargebacks aprovados
export async function revenueByMonth(fromMonth: string, r: Rates): Promise<Map<string, MonthRevenue>> {
  const { data } = await createAdminClient()
    .from("billing_events")
    .select("event_type, received_at, t:payload->data->details->totals, pt:payload->data->details->payout_totals, apt:payload->data->payout_totals, adj:payload->data->>id, action:payload->data->>action, status:payload->data->>status")
    .in("event_type", ["transaction.completed", "adjustment.created", "adjustment.updated"])
    .gte("received_at", monthStart(fromMonth))
    .order("received_at");
  const rows = (data ?? []) as unknown as Row[];
  const out = new Map<string, MonthRevenue>();
  const bucket = (m: string) => {
    let b = out.get(m);
    if (!b) out.set(m, (b = { month: m, gross: 0, fee: 0, net: 0, refunds: 0, count: 0 }));
    return b;
  };
  const usd = (t: Totals, field: keyof NonNullable<Totals>) => {
    const raw = Number((t?.[field] as string | undefined) ?? 0) / 100;
    const cur = (t?.currency_code ?? "USD").toUpperCase();
    return cur === "USD" ? raw : cur === "EUR" ? raw * r.eurUsd : cur === "BRL" ? raw * r.brlUsd : raw;
  };
  // Ajustes: só conta o estado mais recente de cada um
  const adjustments = new Map<string, Row>();
  for (const row of rows) {
    if (row.event_type === "transaction.completed") {
      const t = row.pt?.currency_code ? row.pt : row.t;
      const b = bucket(row.received_at.slice(0, 7));
      b.gross += usd(t, "total") - usd(t, "tax");
      b.fee += usd(t, "fee");
      b.net += usd(t, "earnings");
      b.count++;
    } else if (row.adj) adjustments.set(row.adj, row);
  }
  for (const a of adjustments.values()) {
    if (a.status !== "approved" || !(a.action === "refund" || a.action === "chargeback")) continue;
    const t = a.apt;
    const b = bucket(a.received_at.slice(0, 7));
    const lost = usd(t, "earnings") + Number(t?.chargeback_fee?.amount ?? 0) / 100;
    b.gross -= usd(t, "total") - usd(t, "tax");
    b.fee -= usd(t, "fee");
    b.net -= lost;
    b.refunds += lost;
  }
  return out;
}

/* ---------- Ciclo de pagamentos da Paddle ---------- */

// A Paddle paga uma vez por mês: no dia 1 junta o saldo do mês anterior; se passar do mínimo
// (100 $ por omissão) envia até ao dia 15, e o dinheiro chega em até 3 dias úteis. Abaixo do mínimo, acumula.
export type Payout = { month: string; amount: number; sendBy: string; arriveBy: string; covers: string[]; deposit: Deposit | null };
export type Deposit = { id: string; received_on: string; amount: number; bank_fee: number; snapshot: Partial<FinSettings> & { usdAoa?: number }; done: Partial<Record<string, boolean>>; note: string | null };

export function payoutSchedule(rev: Map<string, MonthRevenue>, threshold: number, current: string, deposits: Deposit[]) {
  const months = [...rev.keys()].sort();
  const first = months[0] ?? current;
  const payouts: Payout[] = [];
  let bal = 0;
  let covers: string[] = [];
  for (let m = first; m <= current; m = addMonths(m, 1)) {
    if (bal >= threshold && bal > 0) {
      const sendBy = `${m}-15`;
      payouts.push({ month: m, amount: bal, sendBy, arriveBy: addWorkdays(sendBy, 3), covers, deposit: null });
      bal = 0;
      covers = [];
    }
    const net = rev.get(m)?.net ?? 0;
    bal += net;
    if (net) covers.push(m);
  }
  // Liga cada pagamento ao depósito registado: primeiro um depósito do próprio mês do pagamento;
  // depois, um que tenha chegado atrasado (até ao dia 10 do mês seguinte)
  const free = [...deposits].sort((a, b) => a.received_on.localeCompare(b.received_on));
  for (const p of payouts) {
    const i = free.findIndex((d) => d.received_on.startsWith(p.month));
    if (i >= 0) p.deposit = free.splice(i, 1)[0];
  }
  for (const p of payouts) {
    if (p.deposit) continue;
    const late = `${addMonths(p.month, 1)}-10`;
    const i = free.findIndex((d) => d.received_on > monthEnd(p.month) && d.received_on <= late);
    if (i >= 0) p.deposit = free.splice(i, 1)[0];
  }
  const next = addMonths(current, 1);
  const sendBy = `${next}-15`;
  return {
    payouts,
    balance: bal, // saldo que fica na Paddle neste momento (mês corrente + o que não chegou ao mínimo)
    next: { month: next, amount: bal, reaches: bal >= threshold, sendBy, arriveBy: addWorkdays(sendBy, 3), covers },
  };
}

/* ---------- Custos do mês ---------- */

export type CostRow = { id: string; tool: string | null; name: string; plan: string | null; amount: number; currency: Currency; billing: "monthly" | "yearly"; icon: string | null; active_from: string; active_until: string | null; notes: string | null };
export type AdRow = { month: string; platform: string; planned: number; spent: number | null };

export async function loadCosts(month: string) {
  const admin = createAdminClient();
  const [{ data: costs }, { data: ads }, { data: usage }] = await Promise.all([
    admin.from("fin_costs").select("id, tool, name, plan, amount, currency, billing, icon, active_from, active_until, notes").order("created_at"),
    admin.from("fin_ads").select("month, platform, planned, spent").eq("month", monthStart(month)),
    admin.from("usage_monthly").select("ai_calls, ai_tokens, ai_in_tokens, ai_out_tokens").eq("month", monthStart(month)),
  ]);
  const all = ((costs ?? []) as CostRow[]).map((c) => ({ ...c, amount: Number(c.amount) }));
  const inMonth = (c: CostRow) => c.active_from <= monthEnd(month) && (!c.active_until || c.active_until >= monthStart(month));
  const ai = { calls: 0, input: 0, output: 0, estimated: false };
  for (const u of (usage ?? []) as { ai_calls: number; ai_tokens: number; ai_in_tokens: number; ai_out_tokens: number }[]) {
    ai.calls += Number(u.ai_calls);
    const split = Number(u.ai_in_tokens) + Number(u.ai_out_tokens);
    ai.input += Number(u.ai_in_tokens);
    ai.output += Number(u.ai_out_tokens);
    // Consumo antigo (antes de separar entrada e saída): estimativa 85 % entrada, 15 % saída
    const legacy = Number(u.ai_tokens) - split;
    if (legacy > 0) {
      ai.input += legacy * 0.85;
      ai.output += legacy * 0.15;
      ai.estimated = true;
    }
  }
  return {
    all,
    active: all.filter(inMonth),
    ads: ((ads ?? []) as AdRow[]).map((a) => ({ ...a, planned: Number(a.planned), spent: a.spent == null ? null : Number(a.spent) })),
    ai,
  };
}

export const monthlyAmount = (c: Pick<CostRow, "amount" | "billing">) => (c.billing === "yearly" ? c.amount / 12 : c.amount);

export function costSummary(c: Awaited<ReturnType<typeof loadCosts>>, s: FinSettings, r: Rates) {
  const tools = c.active.filter((x) => x.tool).reduce((a, x) => a + toUsd(monthlyAmount(x), x.currency, r), 0);
  const extra = c.active.filter((x) => !x.tool).reduce((a, x) => a + toUsd(monthlyAmount(x), x.currency, r), 0);
  const aiUsd = (c.ai.input / 1e6) * s.ai.inPerM + (c.ai.output / 1e6) * s.ai.outPerM;
  const adsPlanned = c.ads.reduce((a, x) => a + x.planned, 0);
  const adsSpent = c.ads.reduce((a, x) => a + (x.spent ?? 0), 0);
  const adsUsed = c.ads.reduce((a, x) => a + (x.spent ?? x.planned), 0);
  const total = tools + extra + aiUsd + adsUsed;
  // Custos em kwanzas (internet, renda, contabilista...) saem do BFA (caixa 2); o resto, em dólares, sai da caixa 1
  const kzRows = c.active.filter((x) => x.currency === "AOA");
  const kzCosts = kzRows.reduce((a, x) => a + monthlyAmount(x), 0);
  const kzUsd = kzCosts / r.usdAoa;
  const usdTotal = total - kzUsd;
  return { tools, extra, ai: aiUsd, adsPlanned, adsSpent, adsUsed, total, kzCosts, kzUsd, usdTotal, need: usdTotal * (1 + s.buffer / 100) };
}

export async function loadDeposits(): Promise<Deposit[]> {
  const { data } = await createAdminClient().from("fin_deposits").select("id, received_on, amount, bank_fee, snapshot, done, note").order("received_on", { ascending: false });
  return ((data ?? []) as Deposit[]).map((d) => ({ ...d, amount: Number(d.amount), bank_fee: Number(d.bank_fee) }));
}

// Divisão de um depósito com as percentagens e taxas guardadas no dia (o histórico não muda se as definições mudarem)
export function depositAllocation(d: Deposit, s: FinSettings): Allocation {
  const snap = d.snapshot ?? {};
  return allocate(
    d.amount - d.bank_fee,
    { pct: snap.pct ?? s.pct, baiPct: snap.baiPct ?? s.baiPct, fees: snap.fees ?? s.fees },
    snap.usdAoa ?? s.fx.usdAoa,
  );
}

/* ---------- Formatação ---------- */

// Dólares como «$1 234,50» (o «US$» do português fica pesado nas tabelas)
export const usd = (v: number, digits = 2) => {
  const s = new Intl.NumberFormat("pt-PT", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(v));
  return `${v < 0 && Math.abs(v) >= 0.5 * 10 ** -digits ? "−" : ""}$${s}`;
};
export const kz = (v: number) => `${new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 }).format(Math.round(v))} Kz`;
export const money = (v: number, cur: Currency) => (cur === "AOA" ? kz(v) : cur === "USD" ? usd(v) : new Intl.NumberFormat("pt-PT", { style: "currency", currency: cur }).format(v));
// «novembro de 2026» ou «nov. 2026»
export const monthName = (key: string, style: "long" | "short" = "long") => {
  const d = new Date(`${key}-15T00:00:00Z`);
  if (style === "long") return new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
  return `${new Intl.DateTimeFormat("pt-PT", { month: "short", timeZone: "UTC" }).format(d)} ${d.getUTCFullYear()}`;
};
export const dayName = (iso: string) => new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
