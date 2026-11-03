// Relatório do mês em CSV (abre no Excel em português: separador «;» e vírgula decimal)
import { requireAdmin } from "@/lib/admin";
import { site } from "@/lib/site";
import { monthReport } from "@/lib/finance-report";
import { isMonth, monthKey, monthName } from "@/lib/finance";

export const dynamic = "force-dynamic";

const n = (v: number) => (Math.round(v * 100) / 100).toFixed(2).replace(".", ",");
const cell = (v: string | number) => {
  const s = typeof v === "number" ? n(v) : v;
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: Request) {
  await requireAdmin();
  const q = new URL(request.url).searchParams.get("mes");
  const mes = isMonth(q) ? q : monthKey(new Date());
  const R = await monthReport(mes);
  const rows: (string | number)[][] = [
    [site.legal.registeredName.toUpperCase()],
    [`NIF: ${site.legal.taxId || "por atribuir"}`],
    [`Relatório mensal: ${monthName(mes)}`],
    [],
    ["Secção", "Descrição", "Moeda original", "Valor original", "Valor em USD"],
    ["Receita", `Faturado sem IVA (${R.revenue.count} pagamentos)`, "USD", R.revenue.gross, R.revenue.gross],
    ["Receita", "Taxa da Paddle", "USD", -R.revenue.fee, -R.revenue.fee],
    ["Receita", "Reembolsos e chargebacks", "USD", -R.revenue.refunds, -R.revenue.refunds],
    ["Receita", "Receita líquida", "USD", R.revenue.net, R.revenue.net],
    ...R.costLines.map((c) => ["Custo", `${c.group}: ${c.name}`, c.currency, -c.original, -c.usd]),
    ["Custo", "Total de custos", "USD", -R.sum.total, -R.sum.total],
    ["Resultado", "Resultado do mês", "USD", R.result, R.result],
    ...R.monthDeposits.map(({ d, a }) => ["Depósito", `${d.received_on} ${d.note ?? "Pagamento da Paddle"} (taxa Grey ${n(d.bank_fee)})`, "USD", d.amount, a.net]),
    ...R.boxes.map((b, i) => ["Caixa", `Caixa ${i + 1}: ${b.name} (${n(R.s.pct[b.key])} %)`, "USD", b.usd, b.usd]),
    ["Transferência", "Envio SWIFT Grey → BFA (chega já sem comissões)", "AOA", R.transfers.swiftKz, R.transfers.swiftUsd],
    ["Transferência", "Fica no BFA (custos da empresa em Kz)", "AOA", R.transfers.bfaKz, R.transfers.bfaKz / R.s.fx.usdAoa],
    ["Transferência", "Levantado do BFA para o BAI do fundador", "AOA", R.transfers.baiKz, R.transfers.baiKz / R.s.fx.usdAoa],
    ["Transferência", "Grey pessoal do fundador", "USD", R.transfers.greyPersonal, R.transfers.greyPersonal],
    ["Taxas", "Taxas bancárias (Grey e envios)", "USD", R.transfers.bankFees, R.transfers.bankFees],
    ["Taxas", "Comissões dos bancos angolanos", "AOA", R.transfers.bankFeesKz, R.transfers.bankFeesKz / R.s.fx.usdAoa],
    ["Paddle", "Saldo por pagar no fim do período", "USD", R.sched.balance, R.sched.balance],
    [],
    ["Câmbio da empresa (Kz por USD)", "", "", R.s.fx.usdAoa, ""],
    ["Euro → USD", R.r.eurAuto ? "mercado" : "manual", "", R.r.eurUsd, ""],
  ];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="horizontal-expansao-${mes}.csv"`,
      "cache-control": "no-store",
    },
  });
}
