import "server-only";
// Dados do relatório mensal (página para imprimir/PDF e ficheiro CSV para o contabilista)
import { AD_PLATFORMS, BOXES } from "@/lib/finance-catalog";
import {
  addMonths,
  costSummary,
  depositAllocation,
  getFinSettings,
  loadCosts,
  loadDeposits,
  marketRates,
  monthKey,
  monthlyAmount,
  payoutSchedule,
  ratesFrom,
  revenueByMonth,
  toUsd,
} from "@/lib/finance";

export async function monthReport(mes: string) {
  const current = monthKey(new Date());
  const [s, market, deposits] = await Promise.all([getFinSettings(), marketRates(), loadDeposits()]);
  const r = ratesFrom(s, market);
  const [rev, costs] = await Promise.all([revenueByMonth(addMonths(current, -23), r), loadCosts(mes)]);
  const sum = costSummary(costs, s, r);
  const sched = payoutSchedule(rev, s.threshold, current, deposits);
  const revenue = rev.get(mes) ?? { month: mes, gross: 0, fee: 0, net: 0, refunds: 0, count: 0 };
  const monthDeposits = deposits
    .filter((d) => d.received_on.startsWith(mes))
    .sort((a, b) => a.received_on.localeCompare(b.received_on))
    .map((d) => ({ d, a: depositAllocation(d, s), usdAoa: d.snapshot?.usdAoa ?? s.fx.usdAoa }));
  const boxes = BOXES.map((b) => ({ ...b, usd: monthDeposits.reduce((a, x) => a + x.a.boxes[b.key], 0) }));
  const transfers = {
    bfaKz: monthDeposits.reduce((a, x) => a + x.a.local.kz, 0),
    baiKz: monthDeposits.reduce((a, x) => a + x.a.founder.baiKz, 0),
    greyPersonal: monthDeposits.reduce((a, x) => a + x.a.founder.grey - x.a.founder.greyFee, 0),
    bankFees: monthDeposits.reduce((a, x) => a + x.d.bank_fee + x.a.local.sendFee + x.a.founder.baiSendFee + x.a.founder.greyFee, 0),
    bankFeesKz: monthDeposits.reduce((a, x) => a + x.a.local.bankFeeKz + x.a.founder.baiBankFeeKz, 0),
  };
  const costLines = [
    ...costs.active.map((c) => ({
      group: c.tool ? "Ferramenta" : "Outro custo",
      name: c.plan ? `${c.name} · ${c.plan}` : c.name,
      original: monthlyAmount(c),
      currency: c.currency,
      usd: toUsd(monthlyAmount(c), c.currency, r),
    })),
    { group: "IA", name: `Gemini API · ${costs.ai.calls} ficheiros`, original: sum.ai, currency: "USD" as const, usd: sum.ai },
    ...AD_PLATFORMS.map((p) => {
      const a = costs.ads.find((x) => x.platform === p.key);
      const v = a ? (a.spent ?? a.planned) : 0;
      return { group: "Anúncios", name: `${p.name}${a && a.spent == null && a.planned ? " (previsto)" : ""}`, original: v, currency: "USD" as const, usd: v, planned: a?.planned ?? 0 };
    }).filter((x) => x.usd > 0 || x.planned > 0),
  ];
  return { mes, s, r, market, revenue, sum, sched, monthDeposits, boxes, transfers, costLines, result: revenue.net - sum.total };
}
