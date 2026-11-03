import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { site } from "@/lib/site";
import { PrintButton } from "@/components/print-button";
import { monthReport } from "@/lib/finance-report";
import { dayName, isMonth, kz, money, monthKey, monthName, usd } from "@/lib/finance";

export const metadata: Metadata = { title: "Relatório mensal · Horizontal Expansão", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Relatório do mês para o contabilista: uma página A4 limpa, pronta a imprimir ou guardar em PDF
export default async function Relatorio({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const mes = isMonth(sp.mes) ? sp.mes : monthKey(new Date());
  const R = await monthReport(mes);
  const Row = ({ l, v, strong = false, muted = false }: { l: string; v: string; strong?: boolean; muted?: boolean }) => (
    <tr className={strong ? "font-semibold" : muted ? "text-muted" : ""}>
      <td className="py-1.5 pr-4">{l}</td>
      <td className="py-1.5 text-right tabular-nums">{v}</td>
    </tr>
  );

  return (
    <div className="report mx-auto max-w-[820px] bg-white px-6 py-8 text-[12.5px] leading-5 sm:px-10 print:max-w-none print:p-0">
      <style>{`@page{size:A4;margin:16mm} @media print{.no-print{display:none!important} body{background:#fff} .report h2{break-after:avoid} table{break-inside:avoid}}`}</style>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink p-3">
        <p className="text-[13px] text-muted">Para PDF: «Imprimir» e escolha «Guardar como PDF».</p>
        <span className="flex gap-2">
          <a href={`/financas/relatorio/csv?mes=${mes}`} className="btn btn-secondary btn-sm">Baixar CSV (Excel)</a>
          <PrintButton label="Imprimir / PDF" />
        </span>
      </div>

      <header className="flex items-start justify-between gap-6 border-b border-ivory pb-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/fin/horizontal.png" alt="Horizontal Expansão" width={220} height={50} className="h-9 w-auto" />
          <p className="mt-3 font-semibold">{site.legal.registeredName.toUpperCase()}</p>
          <p className="text-muted">NIF: {site.legal.taxId || "por atribuir"}</p>
          <p className="max-w-[46ch] text-muted">{site.legal.address}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">Relatório mensal</p>
          <p className="mt-1 text-[22px] font-semibold">{monthName(mes).replace(/^./, (c) => c.toUpperCase())}</p>
          <p className="text-muted">Produto: {site.name}</p>
          <p className="text-muted">Emitido a {dayName(new Date().toISOString().slice(0, 10))}</p>
        </div>
      </header>

      <h2 className="mt-6 text-[14px] font-semibold">1. Receita (Paddle, comerciante registado)</h2>
      <table className="mt-2 w-full border-t border-line">
        <tbody className="divide-y divide-line">
          <Row l={`Faturado, sem IVA (${R.revenue.count} pagamentos)`} v={usd(R.revenue.gross)} />
          <Row l="Taxa da Paddle (5 % + 0,50 $ por venda)" v={`−${usd(R.revenue.fee)}`} />
          {R.revenue.refunds > 0 && <Row l="Reembolsos e chargebacks" v={`−${usd(R.revenue.refunds)}`} />}
          <Row l="Receita líquida" v={usd(R.revenue.net)} strong />
        </tbody>
      </table>
      <p className="mt-1 text-[11px] text-muted">A Paddle vende em seu nome e entrega o IVA dos clientes ao Estado de cada país; a empresa recebe o líquido.</p>

      <h2 className="mt-6 text-[14px] font-semibold">2. Custos do mês</h2>
      <table className="mt-2 w-full border-t border-line">
        <thead className="text-[10.5px] uppercase tracking-wider text-muted">
          <tr>
            <th className="py-1.5 text-left font-medium">Tipo</th>
            <th className="py-1.5 text-left font-medium">Descrição</th>
            <th className="py-1.5 text-right font-medium">Valor</th>
            <th className="py-1.5 text-right font-medium">Em dólares</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {R.costLines.map((c, i) => (
            <tr key={i}>
              <td className="py-1.5 pr-3 text-muted">{c.group}</td>
              <td className="py-1.5 pr-3">{c.name}</td>
              <td className="py-1.5 text-right tabular-nums">{money(c.original, c.currency)}</td>
              <td className="py-1.5 text-right tabular-nums">{usd(c.usd)}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-1.5" colSpan={3}>Total de custos</td>
            <td className="py-1.5 text-right tabular-nums">{usd(R.sum.total)}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-6 text-[14px] font-semibold">3. Resultado</h2>
      <table className="mt-2 w-full border-t border-line">
        <tbody className="divide-y divide-line">
          <Row l="Receita líquida" v={usd(R.revenue.net)} />
          <Row l="Custos" v={`−${usd(R.sum.total)}`} />
          <Row l="Resultado do mês" v={usd(R.result)} strong />
        </tbody>
      </table>

      <h2 className="mt-6 text-[14px] font-semibold">4. Depósitos recebidos e divisão pelas caixas</h2>
      {R.monthDeposits.length === 0 ? (
        <p className="mt-2 text-muted">Sem depósitos da Paddle registados neste mês.</p>
      ) : (
        <>
          <table className="mt-2 w-full border-t border-line">
            <tbody className="divide-y divide-line">
              {R.monthDeposits.map(({ d, a }) => (
                <Row key={d.id} l={`${dayName(d.received_on)} · ${d.note ?? "Pagamento da Paddle"} (${usd(d.amount)} − taxa Grey ${usd(d.bank_fee)})`} v={usd(a.net)} />
              ))}
              {R.boxes.map((b, i) => (
                <Row key={b.key} l={`Caixa ${i + 1} · ${b.name} (${R.s.pct[b.key]} %)`} v={usd(b.usd)} muted={false} />
              ))}
            </tbody>
          </table>
          <h3 className="mt-4 text-[12.5px] font-semibold">Transferências do mês</h3>
          <table className="mt-1 w-full border-t border-line">
            <tbody className="divide-y divide-line">
              <Row l="BFA da empresa (kwanzas, já sem comissões)" v={kz(R.transfers.bfaKz)} />
              <Row l="BAI do fundador (kwanzas, já sem comissões)" v={kz(R.transfers.baiKz)} />
              <Row l="Grey pessoal do fundador (dólares)" v={usd(R.transfers.greyPersonal)} />
              <Row l="Taxas bancárias do mês (dólares)" v={usd(R.transfers.bankFees)} muted />
              <Row l="Comissões dos bancos angolanos (kwanzas)" v={kz(R.transfers.bankFeesKz)} muted />
            </tbody>
          </table>
        </>
      )}

      <h2 className="mt-6 text-[14px] font-semibold">5. Pagamentos da Paddle</h2>
      <table className="mt-2 w-full border-t border-line">
        <tbody className="divide-y divide-line">
          {R.sched.payouts
            .filter((p) => p.month === mes)
            .map((p) => (
              <Row key={p.month} l={`Pagamento de ${monthName(p.month)} (vendas de ${p.covers.map((c) => monthName(c, "short")).join(", ")})`} v={`${usd(p.amount)}${p.deposit ? " · recebido" : " · por receber"}`} />
            ))}
          <Row l={`Saldo na Paddle no fim do período (mínimo de pagamento ${usd(R.s.threshold, 0)})`} v={usd(R.sched.balance)} />
        </tbody>
      </table>

      <h2 className="mt-6 text-[14px] font-semibold">6. Câmbios e critérios</h2>
      <ul className="mt-2 space-y-1 text-muted">
        <li>· Câmbio da empresa: {new Intl.NumberFormat("pt-PT").format(R.s.fx.usdAoa)} Kz por dólar (depósitos usam o câmbio do dia em que foram registados).</li>
        <li>· Euro → dólar: {R.r.eurUsd.toFixed(4).replace(".", ",")} {!R.r.eurAuto ? "(manual)" : R.market.eurUsd ? "(mercado, Exchange Rate API)" : "(aproximado: sem ligação ao câmbio de mercado)"}.</li>
        <li>· Divisão: {R.s.pct.reinvest} % reinvestimento, {R.s.pct.local} % liquidez local, {R.s.pct.tax} % provisão de impostos, {R.s.pct.founder} % fundador ({R.s.baiPct} % para o BAI).</li>
        <li>· Valores em dólares, a moeda em que a Paddle paga. Os custos da IA são calculados pelos tokens usados e pelo preço público da Google.</li>
      </ul>
      <p className="mt-8 border-t border-line pt-3 text-[10.5px] text-muted">Documento interno de gestão. Não substitui a contabilidade oficial nem as obrigações declarativas junto da AGT.</p>
    </div>
  );
}
