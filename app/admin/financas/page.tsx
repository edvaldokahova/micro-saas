import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  ChartLine,
  Check,
  Coins,
  Gauge,
  HandCoins,
  Landmark,
  Megaphone,
  Percent,
  PiggyBank,
  Receipt,
  Send,
  Settings2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserRound,
  Vault,
  Wallet,
  Wrench,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { site } from "@/lib/site";
import { Toast } from "@/components/toast";
import { SubmitButton } from "@/components/app-buttons";
import { RevenueChart } from "@/components/admin-charts";
import { AD_PLATFORMS, BOXES, CURRENCIES, EXTRA_ICONS, TOOLS, type BoxKey } from "@/lib/finance-catalog";
import {
  addMonths,
  allocate,
  costSummary,
  dayName,
  depositAllocation,
  feeOf,
  getFinSettings,
  isMonth,
  kz,
  loadCosts,
  loadDeposits,
  marketRates,
  money,
  monthKey,
  monthlyAmount,
  monthName,
  payoutSchedule,
  ratesFrom,
  revenueByMonth,
  toUsd,
  usd,
  type Allocation,
  type Fee,
} from "@/lib/finance";
import { addDeposit, addExtraCost, endCost, removeCost, removeDeposit, saveAds, saveFinSettings, setToolPlan, stopTool, toggleDone, useMarketRate } from "./actions";

export const metadata: Metadata = { title: "Finanças · Admin · Bilonai", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const OK: Record<string, string> = {
  definicoes: "Definições guardadas.",
  cambio: "Câmbio da empresa atualizado.",
  plano: "Plano guardado: conta a partir deste mês.",
  parado: "Guardado: este mês ainda conta, o próximo já não.",
  custo: "Custo adicionado.",
  apagado: "Apagado.",
  anuncios: "Anúncios do mês guardados.",
  deposito: "Depósito registado e dividido pelas 4 caixas.",
  marcado: "Transferência atualizada.",
};
const ERR: Record<string, string> = {
  pct: "As 4 percentagens têm de somar 100 %.",
  valor: "Falta o valor.",
  deposito: "Verifique a data e o valor (a taxa tem de ser menor do que o depósito).",
  generico: "Não foi possível guardar. Tente de novo.",
};

const BOX_LOGOS: Record<BoxKey, string[]> = {
  reinvest: ["/brand/fin/vercel.svg", "/brand/fin/supabase.png", "/brand/fin/claude.svg", "/brand/fin/gemini.png"],
  local: ["/brand/fin/building.png", "/brand/fin/bfa.png"],
  tax: ["/brand/fin/vault.png", "/brand/fin/grey.png"],
  founder: ["/brand/fin/bai.png", "/brand/fin/grey.png"],
};

function Logo({ src, size = 28, className = "" }: { src: string; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={size} height={size} className={`shrink-0 rounded-[7px] object-contain ${className}`} style={{ width: size, height: size }} />;
}

type Icon = typeof Wallet;

// Ícone num quadrado discreto (ajuda a reconhecer cada coisa de relance)
function Ico({ icon: I, tone = "" }: { icon: Icon; tone?: string }) {
  return (
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-white ${tone}`}>
      <I className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function Kpi({ label, value, hint, tone = "", icon: I }: { label: string; value: string; hint?: string; tone?: string; icon: Icon }) {
  return (
    <div className="card p-4">
      <dt className="mono-label flex items-center gap-1.5">
        <I className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className={`figure mt-2 text-[24px] leading-none tabular-nums sm:text-[28px] ${tone}`}>{value}</dd>
      {hint && <p className="mt-2 text-[12.5px] leading-5 text-muted">{hint}</p>}
    </div>
  );
}

function H2({ id, title, lead, icon }: { id: string; title: string; lead?: string; icon: Icon }) {
  return (
    <div id={id} className="mt-12 scroll-mt-20">
      <h2 className="flex items-center gap-2.5 text-[18px] font-semibold">
        <Ico icon={icon} />
        {title}
      </h2>
      {lead && <p className="mt-2 max-w-[70ch] text-[13.5px] leading-6 text-muted">{lead}</p>}
    </div>
  );
}

const feeText = (f: Fee) =>
  [f.fixed ? usd(f.fixed) : "", f.pct ? `${f.pct} %` : "", f.min ? `mín. ${usd(f.min)}` : "", f.max ? `máx. ${usd(f.max)}` : ""].filter(Boolean).join(" + ").replace("+ mín", "· mín").replace("+ máx", "· máx") || "sem custo";

// Barra «chega ou não chega» de uma caixa para os custos que ela paga
function Cover({ icon, title, sub, need, have, fmt, needText, tip }: { icon: Icon; title: string; sub: string; need: number; have: number; fmt: (v: number) => string; needText: string; tip: string }) {
  const ratio = need > 0 ? have / need : 1;
  return (
    <section className="card p-5">
      <p className="flex items-center gap-2 text-[15px] font-semibold">
        <Ico icon={icon} />
        {title}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
        <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
        {sub}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-3">
        <div className={`h-full rounded-full ${ratio >= 1 ? "bg-ok" : ratio >= 0.7 ? "bg-warn" : "bg-bad"}`} style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }} />
      </div>
      <p className="mt-3 text-[13.5px] leading-6">
        Precisa de <strong>{fmt(need)}</strong> ({needText}) e recebe <strong>{fmt(have)}</strong>.{" "}
        {have >= need ? <span className="text-ok">Sobram {fmt(have - need)}.</span> : <span className="text-bad">Faltam {fmt(need - have)}. {tip}</span>}
      </p>
    </section>
  );
}

// Aviso quando a taxa fixa de envio come uma fatia grande de uma transferência pequena
function Heavy({ fee, amount }: { fee: number; amount: number }) {
  if (amount <= 0 || fee / amount < 0.1) return null;
  return (
    <p className="mt-1 rounded-lg bg-warn/10 px-2 py-1.5 text-[11.5px] leading-4 text-warn">
      A taxa de envio leva {Math.min(100, Math.round((fee / amount) * 100))} % deste valor. Compensa juntar alguns meses e enviar de uma só vez.
    </p>
  );
}

// As 4 caixas para um valor (depósito real ou previsão)
function Boxes({ a, usdAoa, baiPct, done, depositId, mes }: { a: Allocation; usdAoa: number; baiPct: number; done?: Record<string, boolean>; depositId?: string; mes: string }) {
  const Done = ({ k, label }: { k: string; label: string }) =>
    depositId ? (
      <form action={toggleDone} className="mt-3">
        <input type="hidden" name="mes" value={mes} />
        <input type="hidden" name="id" value={depositId} />
        <input type="hidden" name="key" value={k} />
        <SubmitButton className={`btn btn-secondary btn-sm !h-auto min-h-9 w-full whitespace-normal !py-2 text-center leading-tight ${done?.[k] ? "!border-ok/40 !text-ok" : ""}`}>{done?.[k] ? (<span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" aria-hidden="true" />{label}: feito</span>) : `Marcar ${label} como feito`}</SubmitButton>
      </form>
    ) : null;
  const BOX_ICON: Record<BoxKey, Icon> = { reinvest: Wrench, local: Building2, tax: Vault, founder: UserRound };
  const Line = ({ l, v, strong = false, accent = false }: { l: string; v: string; strong?: boolean; accent?: boolean }) => (
    <p className={`flex justify-between gap-2 ${strong ? "font-semibold" : ""} ${accent ? "rounded-md bg-gold/10 px-1.5 py-0.5 -mx-1.5" : ""}`}>
      <span className={strong || accent ? "" : "text-muted"}>{l}</span>
      <span className="tabular-nums">{v}</span>
    </p>
  );
  const rate = new Intl.NumberFormat("pt-PT").format(usdAoa);
  return (
    <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {BOXES.map((b, i) => {
        const v = a.boxes[b.key];
        return (
          <section key={b.key} className="card flex flex-col p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-muted">
                <Ico icon={BOX_ICON[b.key]} />
                Caixa {i + 1}
              </span>
              <span className="flex -space-x-1.5">
                {BOX_LOGOS[b.key].map((src) => (
                  <span key={src} className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white">
                    <Logo src={src} size={18} className="rounded-[4px]" />
                  </span>
                ))}
              </span>
            </div>
            <p className="mt-3 text-[14.5px] font-semibold leading-5">{b.name}</p>
            <p className="figure mt-2 text-[26px] leading-none tabular-nums">{usd(v)}</p>
            <p className="mt-1 text-[12.5px] text-muted">{Math.round((v / Math.max(a.net, 0.0001)) * 1000) / 10 || 0} % do depósito</p>
            <div className="mt-3 flex-1 space-y-1.5 border-t border-line pt-3 text-[12.5px] leading-5">
              {b.key === "reinvest" && <p className="text-muted">{b.where}. Paga os custos em dólares: ferramentas, IA e anúncios.</p>}
              {b.key === "tax" && <p className="text-muted">{b.where}. Não se mexe até ao apuramento anual do Imposto Industrial.</p>}
              {b.key === "local" && (
                <>
                  <Line l="Segue no SWIFT para o BFA" v={usd(a.local.usd)} />
                  <Line l="Fica no BFA" v={kz(a.local.kz)} strong />
                  <p className="text-[11.5px] text-muted">Para os custos em kwanzas: internet, renda, contabilista, impostos, futuro funcionário.</p>
                </>
              )}
              {b.key === "founder" && (
                <>
                  <Line l={`Sua parte no SWIFT (${baiPct} %)`} v={usd(a.founder.bai)} accent />
                  <Line l="Levanta do BFA para o BAI" v={kz(a.founder.baiKz)} strong />
                  <Line l={`Grey pessoal (${100 - baiPct} %)`} v={usd(a.founder.grey - a.founder.greyFee)} strong />
                </>
              )}
            </div>
          </section>
        );
      })}
    </div>

      {/* O caminho do dinheiro: um só SWIFT para o BFA, depois o levantamento para o BAI */}
      <section className="card p-4 sm:p-5">
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <Ico icon={Send} />
          Transferências a fazer
        </p>
        <ol className="mt-4 grid gap-3 lg:grid-cols-3">
          <li className="flex flex-col rounded-xl border border-line p-3.5">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold">
              <span className="font-mono text-[11px] text-muted">1</span>
              <Logo src="/brand/fin/grey.png" size={20} />
              <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <Logo src="/brand/fin/bfa.png" size={20} />
              Grey → BFA (SWIFT)
            </p>
            <div className="mt-3 flex-1 space-y-1 text-[12.5px] leading-5">
              <Line l="Caixa 2 (empresa)" v={usd(a.local.usd)} />
              <Line l={`Sua parte (${baiPct} % da caixa 4)`} v={usd(a.founder.bai)} accent />
              <Line l="Enviar" v={usd(a.swift.usd)} strong />
              <Line l="Taxa SWIFT" v={`−${usd(a.swift.fee)}`} />
              <Line l="Comissão do BFA" v={`−${kz(a.swift.bankFeeKz)}`} />
              <Line l="Chega ao BFA" v={kz(a.swift.kz)} strong />
              <p className="text-[11.5px] text-muted">Câmbio {rate} Kz por dólar. As taxas repartem-se na proporção de cada parte.</p>
              <Heavy fee={a.swift.fee} amount={a.swift.usd} />
            </div>
            <Done k="swift" label="SWIFT" />
          </li>
          <li className="flex flex-col rounded-xl border border-line p-3.5">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold">
              <span className="font-mono text-[11px] text-muted">2</span>
              <Logo src="/brand/fin/bfa.png" size={20} />
              <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <Logo src="/brand/fin/bai.png" size={20} />
              BFA → BAI (sua parte)
            </p>
            <div className="mt-3 flex-1 space-y-1 text-[12.5px] leading-5">
              <Line l="Retirar do BFA" v={kz(a.founder.baiKz)} accent />
              <Line l="Fica no BFA para a empresa" v={kz(a.local.kz)} strong />
              <p className="text-[11.5px] text-muted">Transferência local em kwanzas, depois de o SWIFT chegar.</p>
            </div>
            <Done k="bai" label="levantamento para o BAI" />
          </li>
          <li className="flex flex-col rounded-xl border border-line p-3.5">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold">
              <span className="font-mono text-[11px] text-muted">3</span>
              <Logo src="/brand/fin/grey.png" size={20} />
              <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <Logo src="/brand/fin/grey.png" size={20} />
              Grey empresa → Grey pessoal
            </p>
            <div className="mt-3 flex-1 space-y-1 text-[12.5px] leading-5">
              <Line l={`Sua parte em dólares (${100 - baiPct} %)`} v={usd(a.founder.grey)} />
              {a.founder.greyFee > 0 && <Line l="Taxa" v={`−${usd(a.founder.greyFee)}`} />}
              <Line l="Chega à Grey pessoal" v={usd(a.founder.grey - a.founder.greyFee)} strong />
              <p className="text-[11.5px] text-muted">As caixas 1 e 3 ficam na Grey da empresa: {usd(a.boxes.reinvest + a.boxes.tax)}.</p>
            </div>
            <Done k="grey" label="Grey pessoal" />
          </li>
        </ol>
      </section>
    </div>
  );
}

export default async function Financas({ searchParams }: { searchParams: Promise<{ mes?: string; ok?: string; erro?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const current = monthKey(new Date());
  const mes = isMonth(sp.mes) && sp.mes <= addMonths(current, 1) ? sp.mes : current;

  const [s, market, deposits] = await Promise.all([getFinSettings(), marketRates(), loadDeposits()]);
  const r = ratesFrom(s, market);
  const [rev, costs] = await Promise.all([revenueByMonth(addMonths(current, -23), r), loadCosts(mes)]);
  const sum = costSummary(costs, s, r);
  const sched = payoutSchedule(rev, s.threshold, current, deposits);

  // Gráfico: 12 meses até ao mês escolhido (em cêntimos, como os outros gráficos)
  const chart = Array.from({ length: 12 }, (_, i) => addMonths(mes, i - 11)).map((m) => {
    const x = rev.get(m);
    return { label: new Intl.DateTimeFormat("pt-PT", { month: "short", timeZone: "UTC" }).format(new Date(`${m}-15T00:00:00Z`)).replace(".", ""), total: Math.round((x?.net ?? 0) * 100), earnings: Math.round((x?.gross ?? 0) * 100), count: x?.count ?? 0 };
  });
  const m = rev.get(mes) ?? { gross: 0, fee: 0, net: 0, refunds: 0, count: 0 };
  const result = m.net - sum.total;

  // Caixas do mês: depósitos recebidos no mês; sem depósito, a previsão do próximo pagamento
  const monthDeposits = deposits.filter((d) => d.received_on.startsWith(mes));
  const allocs = monthDeposits.map((d) => ({ d, a: depositAllocation(d, s) }));
  const nextFee = feeOf(s.fees.greyIn, sched.next.amount);
  const forecast = allocate(Math.max(0, sched.next.amount - nextFee), s, s.fx.usdAoa);
  const reinvestIn = allocs.reduce((a, x) => a + x.a.boxes.reinvest, 0) || (monthDeposits.length ? 0 : forecast.boxes.reinvest);
  const localIn = allocs.reduce((a, x) => a + x.a.local.kz, 0) || (monthDeposits.length ? 0 : forecast.local.kz);

  const prev = addMonths(mes, -1);
  const next = addMonths(mes, 1);
  const pctSum = s.pct.reinvest + s.pct.local + s.pct.tax + s.pct.founder;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/fin/horizontal.png" alt="Horizontal Expansão" width={180} height={41} className="h-7 w-auto sm:h-8" />
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/" className="btn btn-secondary btn-sm">Cockpit</Link>
            <a href={`/financas/relatorio?mes=${mes}`} target="_blank" rel="noopener" className="btn btn-primary btn-sm">Relatório do mês</a>
          </nav>
        </div>
      </header>

      {sp.ok && OK[sp.ok] && <Toast tone="ok" text={OK[sp.ok]} />}
      {sp.erro && <Toast tone="bad" text={ERR[sp.erro] ?? ERR.generico} />}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]">Finanças</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">{monthName(mes)}</h1>
            <p className="mt-2 text-[13px] text-muted">
              {site.legal.registeredName.toUpperCase()}
              {site.legal.taxId ? ` · NIF ${site.legal.taxId}` : " · NIF por atribuir"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href={`/financas?mes=${prev}`} className="btn btn-secondary btn-sm" aria-label="Mês anterior">‹ {monthName(prev, "short")}</Link>
            {mes !== current && <Link href="/financas" className="btn btn-secondary btn-sm">Este mês</Link>}
            {next <= current && <Link href={`/financas?mes=${next}`} className="btn btn-secondary btn-sm" aria-label="Mês seguinte">{monthName(next, "short")} ›</Link>}
          </div>
        </section>

        {/* Panorama */}
        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi icon={Receipt} label="Faturado" value={usd(m.gross)} hint={`${m.count} ${m.count === 1 ? "pagamento" : "pagamentos"} · sem IVA`} />
          <Kpi icon={Percent} label="Taxa da Paddle" value={`−${usd(m.fee)}`} hint={m.refunds ? `Reembolsos −${usd(m.refunds)}` : "5 % + 0,50 $ por venda"} />
          <Kpi icon={Wallet} label="Líquido" value={usd(m.net)} hint="O que a Paddle vai pagar" />
          <Kpi icon={Coins} label="Custos do mês" value={`−${usd(sum.total)}`} hint={sum.kzCosts ? `Inclui ${kz(sum.kzCosts)} em kwanzas` : "Ferramentas, IA, anúncios e extra"} />
          <Kpi icon={result < 0 ? TrendingDown : TrendingUp} label="Resultado" value={usd(result)} tone={result < 0 ? "text-bad" : "text-ok"} hint={result < 0 ? "Os custos passaram a receita" : "Líquido menos custos"} />
        </dl>

        <section className="card mt-3 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="flex items-center gap-2.5 text-[16px] font-semibold"><Ico icon={ChartLine} />Valor líquido por mês</h2>
            <p className="text-[12.5px] text-muted">Já sem a taxa da Paddle e sem reembolsos, em dólares</p>
          </div>
          <div className="mt-5">
            <RevenueChart points={chart} currency="USD" net />
          </div>
        </section>

        {/* Pagamentos da Paddle */}
        <H2
          id="pagamentos"
          icon={CalendarClock}
          title="Pagamentos da Paddle"
          lead={`A Paddle paga uma vez por mês: no dia 1 junta o saldo do mês anterior e, se passar de ${usd(s.threshold, 0)}, envia até ao dia 15. O dinheiro chega à Grey em até 3 dias úteis. Abaixo do mínimo, o saldo passa para o mês seguinte. Quando o dinheiro chegar, registe-o aqui com o valor que a Grey mostra.`}
        />
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <section className="card p-5">
            <p className="mono-label flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />Próximo pagamento</p>
            <p className="figure mt-2 text-[30px] leading-none tabular-nums">{usd(sched.next.amount)}</p>
            <p className="mt-2 text-[13.5px] leading-6">
              {sched.next.reaches ? (
                <>Previsto até <strong>{dayName(sched.next.sendBy)}</strong>, na Grey até {dayName(sched.next.arriveBy)}. O valor ainda cresce até ao fim do mês.</>
              ) : (
                <>Faltam <strong>{usd(Math.max(0, s.threshold - sched.next.amount))}</strong> para o mínimo de {usd(s.threshold, 0)}. Se não chegar, passa para o mês seguinte.</>
              )}
            </p>
            <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13px]">
              <p className="flex justify-between gap-3"><span className="text-muted">Taxa de receção na Grey por ACH (estimada)</span><span className="tabular-nums">−{usd(nextFee)}</span></p>
              <p className="flex justify-between gap-3 font-semibold"><span>Fica na Grey da empresa</span><span className="tabular-nums">{usd(Math.max(0, sched.next.amount - nextFee))}</span></p>
            </div>
            {sched.payouts.length > 0 && (
              <ul className="mt-5 divide-y divide-line border-t border-line text-[13px]">
                {[...sched.payouts].reverse().slice(0, 8).map((p) => {
                  const got = p.deposit;
                  const diff = got ? got.amount - p.amount : 0;
                  return (
                    <li key={p.month} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                      <span>
                        <span className="font-medium">{monthName(p.month)}</span>
                        <span className="block text-[12px] text-muted">Vendas de {p.covers.map((c) => monthName(c, "short")).join(", ")}</span>
                      </span>
                      <span className="text-right tabular-nums">
                        {usd(p.amount)}
                        <span className={`block text-[12px] ${got ? "text-ok" : p.month <= current ? "text-warn" : "text-muted"}`}>
                          {got ? `Recebido ${usd(got.amount)}${Math.abs(diff) >= 0.01 ? ` (${diff > 0 ? "+" : ""}${usd(diff)})` : ""}` : "Por registar"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <p className="flex items-center gap-2 text-[15px] font-semibold"><Ico icon={Banknote} />Registar depósito recebido</p>
            <p className="mt-1 text-[12.5px] leading-5 text-muted">Use o valor que entrou na Grey e a taxa que a Grey cobrou. O depósito é dividido pelas 4 caixas com as percentagens de hoje, e fica assim guardado.</p>
            <form action={addDeposit} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="mes" value={mes} />
              <label className="block">
                <span className="label">Data</span>
                <input type="date" name="received_on" required defaultValue={new Date().toISOString().slice(0, 10)} className="field" />
              </label>
              <label className="block">
                <span className="label">Valor enviado pela Paddle ($)</span>
                <input name="amount" required inputMode="decimal" placeholder="Ex.: 482,50" className="field tabular-nums" />
              </label>
              <label className="block">
                <span className="label">Taxa cobrada pela Grey ($)</span>
                <input name="bank_fee" inputMode="decimal" defaultValue={String(nextFee || "").replace(".", ",")} className="field tabular-nums" />
              </label>
              <label className="block">
                <span className="label">Nota (opcional)</span>
                <input name="note" maxLength={200} placeholder="Ex.: pagamento de novembro" className="field" />
              </label>
              <div className="sm:col-span-2">
                <SubmitButton className="btn btn-primary btn-sm">Registar e dividir</SubmitButton>
              </div>
            </form>
            {deposits.length > 0 && (
              <ul className="mt-5 divide-y divide-line border-t border-line text-[13px]">
                {deposits.slice(0, 8).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/financas?mes=${d.received_on.slice(0, 7)}#caixas`} className="min-w-0 hover:underline">
                      <span className="font-medium">{dayName(d.received_on)}</span>
                      <span className="block truncate text-[12px] text-muted">{d.note ?? "Depósito da Paddle"} · taxa {usd(d.bank_fee)}</span>
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums">{usd(d.amount)}</span>
                      <form action={removeDeposit}>
                        <input type="hidden" name="mes" value={mes} />
                        <input type="hidden" name="id" value={d.id} />
                        <SubmitButton className="btn btn-secondary btn-sm !px-2.5" confirm="Apagar este depósito? A divisão pelas caixas também sai.">Apagar</SubmitButton>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* As 4 caixas */}
        <H2
          id="caixas"
          icon={PiggyBank}
          title="As 4 caixas"
          lead={
            monthDeposits.length
              ? `Quanto vai para cada lugar com ${monthDeposits.length === 1 ? "o depósito" : "os depósitos"} de ${monthName(mes)}. Um só envio SWIFT por depósito, para o BFA da empresa; depois retira a sua parte para o BAI. Marque cada passo quando o fizer.`
              : `Ainda não há depósito em ${monthName(mes)}. Abaixo, a previsão para o próximo pagamento da Paddle (${usd(sched.next.amount)}), já sem a taxa estimada da Grey.`
          }
        />
        <div className="mt-4 space-y-6">
          {allocs.length ? (
            allocs.map(({ d, a }) => (
              <div key={d.id}>
                <p className="mb-2 text-[13px] text-muted">
                  Depósito de {dayName(d.received_on)}: {usd(d.amount)} − taxa {usd(d.bank_fee)} = <strong className="text-ivory">{usd(a.net)}</strong>
                </p>
                <Boxes a={a} usdAoa={d.snapshot?.usdAoa ?? s.fx.usdAoa} baiPct={d.snapshot?.baiPct ?? s.baiPct} done={d.done as Record<string, boolean>} depositId={d.id} mes={mes} />
              </div>
            ))
          ) : (
            <Boxes a={forecast} usdAoa={s.fx.usdAoa} baiPct={s.baiPct} mes={mes} />
          )}
        </div>

        {/* As caixas chegam para os custos? Caixa 1 paga os custos em dólares; caixa 2 (BFA) os custos em kwanzas */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Cover icon={Wrench} title="A caixa 1 chega para os custos em dólares?" sub={`Ferramentas, IA e anúncios + ${s.buffer} % de folga`} need={sum.need} have={reinvestIn} fmt={usd} needText={`${usd(sum.usdTotal)} + folga`} tip="Pode baixar custos ou, depois do depósito, subir a percentagem da caixa 1." />
          <Cover icon={Building2} title="A caixa 2 chega para os custos em kwanzas?" sub="O que fica no BFA depois da sua parte" need={sum.kzCosts} have={localIn} fmt={kz} needText="custos em kwanzas do mês" tip="Pode subir a percentagem da caixa 2 ou juntar mais meses num só SWIFT." />
        </div>

        {/* Custos */}
        <H2 id="custos" icon={Coins} title="Custos do mês" lead="Cada ferramenta só conta depois de ativar o plano. Mudar de plano conta a partir deste mês, e o histórico dos meses anteriores mantém-se." />
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {TOOLS.map((t) => {
            const row = costs.all.find((c) => c.tool === t.key && !c.active_until) ?? null;
            const inMonth = costs.active.find((c) => c.tool === t.key) ?? null;
            return (
              <section key={t.key} className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white">
                    <Logo src={t.logo} size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold">{t.name}</p>
                    <p className="text-[12.5px] text-muted">{t.what}</p>
                  </div>
                  <span className={`text-right text-[12.5px] ${inMonth ? "text-ok" : "text-muted"}`}>
                    {inMonth ? (
                      <>
                        {inMonth.plan} · <strong className="tabular-nums">{usd(monthlyAmount(inMonth))}</strong>/mês
                        {inMonth.active_until && <span className="block text-muted">até {dayName(inMonth.active_until)}</span>}
                      </>
                    ) : (
                      "Plano gratuito"
                    )}
                  </span>
                </div>
                <form action={setToolPlan} className="mt-4 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="mes" value={mes} />
                  <input type="hidden" name="tool" value={t.key} />
                  <label className="min-w-[8rem] flex-1">
                    <span className="label">Plano</span>
                    <select name="plan" defaultValue={row?.plan ?? t.plans[0].name} className="field !min-h-0 !py-2">
                      {t.plans.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} · {usd(p.usd, 0)}/mês
                        </option>
                      ))}
                      <option value="Outro">Outro plano (valor à mão)</option>
                    </select>
                  </label>
                  <label className="w-28">
                    <span className="label">Valor ($/mês)</span>
                    <input name="amount" inputMode="decimal" placeholder="Do plano" className="field !min-h-0 !py-2 tabular-nums" />
                  </label>
                  <SubmitButton className="btn btn-primary btn-sm">{row ? "Mudar plano" : "Ativei"}</SubmitButton>
                </form>
                {row && (
                  <form action={stopTool} className="mt-2">
                    <input type="hidden" name="mes" value={mes} />
                    <input type="hidden" name="id" value={row.id} />
                    <SubmitButton className="text-[12.5px] text-muted underline underline-offset-4 hover:text-ivory" confirm={`Deixar de pagar o ${t.name}? Este mês ainda conta; a partir do próximo deixa de contar.`}>
                      Deixei de pagar
                    </SubmitButton>
                  </form>
                )}
              </section>
            );
          })}

          {/* Gemini: custo pelo consumo real */}
          <section className="card p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white">
                <Logo src="/brand/fin/gemini.png" size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[15px] font-semibold">Gemini API<Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden="true" /></p>
                <p className="text-[12.5px] text-muted">Arrumação dos documentos pela IA, pago pelo consumo</p>
              </div>
              <span className="text-right text-[12.5px]">
                <strong className="tabular-nums">{usd(sum.ai, sum.ai < 1 ? 4 : 2)}</strong>
                <span className="block text-muted">este mês</span>
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-[12.5px]">
              <div className="rounded-xl bg-ink-3/60 p-2.5">
                <dt className="text-muted">Ficheiros</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{new Intl.NumberFormat("pt-PT").format(costs.ai.calls)}</dd>
              </div>
              <div className="rounded-xl bg-ink-3/60 p-2.5">
                <dt className="text-muted">Entrada</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{new Intl.NumberFormat("pt-PT").format(Math.round(costs.ai.input))}</dd>
              </div>
              <div className="rounded-xl bg-ink-3/60 p-2.5">
                <dt className="text-muted">Saída</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{new Intl.NumberFormat("pt-PT").format(Math.round(costs.ai.output))}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[12px] leading-5 text-muted">
              Tokens × preço da Google ({usd(s.ai.inPerM)} por milhão de entrada, {usd(s.ai.outPerM)} por milhão de saída).
              {costs.ai.estimated ? " Parte do consumo antigo não separava entrada e saída: essa parte é estimada." : ""} Média por ficheiro: {costs.ai.calls ? usd(sum.ai / costs.ai.calls, 5) : "—"}.
            </p>
          </section>
        </div>

        {/* Custos extra */}
        <section className="card mt-3 p-5">
          <p className="flex items-center gap-2 text-[15px] font-semibold"><Ico icon={HandCoins} />Outros custos</p>
          <p className="mt-1 text-[12.5px] text-muted">Internet, renda, domínios, o que for. Os custos em kwanzas saem do BFA (caixa 2); os em dólares ou euros, da caixa 1.</p>
          <ul className="mt-4 divide-y divide-line border-y border-line text-[13.5px]">
            {costs.all
              .filter((c) => !c.tool)
              .map((c) => {
                const live = costs.active.some((x) => x.id === c.id);
                return (
                  <li key={c.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${live ? "" : "opacity-55"}`}>
                    <span className="flex min-w-0 items-center gap-3">
                      {c.icon && EXTRA_ICONS[c.icon] ? <Logo src={EXTRA_ICONS[c.icon]} size={c.icon === "africell" ? 44 : 28} /> : <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-3 text-[12px] font-semibold">{c.name[0]}</span>}
                      <span className="min-w-0">
                        <span className="font-medium">{c.name}</span>
                        <span className="block text-[12px] text-muted">
                          {[c.plan, `desde ${monthName(c.active_from.slice(0, 7), "short")}`, c.active_until ? `até ${monthName(c.active_until.slice(0, 7), "short")}` : null].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-right tabular-nums">
                        {money(c.amount, c.currency)}
                        {c.billing === "yearly" ? "/ano" : "/mês"}
                        {c.currency !== "USD" && <span className="block text-[12px] text-muted">≈ {usd(toUsd(monthlyAmount(c), c.currency, r))}/mês</span>}
                      </span>
                      {!c.active_until && (
                        <form action={endCost}>
                          <input type="hidden" name="mes" value={mes} />
                          <input type="hidden" name="id" value={c.id} />
                          <SubmitButton className="btn btn-secondary btn-sm !px-2.5" confirm={`Terminar «${c.name}»? Este mês ainda conta.`}>Terminar</SubmitButton>
                        </form>
                      )}
                      <form action={removeCost}>
                        <input type="hidden" name="mes" value={mes} />
                        <input type="hidden" name="id" value={c.id} />
                        <SubmitButton className="btn btn-secondary btn-sm !px-2.5" confirm={`Apagar «${c.name}» de todos os meses? Use só para corrigir um engano.`}>Apagar</SubmitButton>
                      </form>
                    </span>
                  </li>
                );
              })}
          </ul>
          <form action={addExtraCost} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <input type="hidden" name="mes" value={mes} />
            <label className="lg:col-span-2">
              <span className="label">Custo</span>
              <input name="name" required maxLength={60} placeholder="Ex.: Renda do escritório" className="field !min-h-0 !py-2" />
            </label>
            <label>
              <span className="label">Valor</span>
              <input name="amount" required inputMode="decimal" placeholder="Ex.: 23 000" className="field !min-h-0 !py-2 tabular-nums" />
            </label>
            <label>
              <span className="label">Moeda</span>
              <select name="currency" defaultValue="AOA" className="field !min-h-0 !py-2">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c === "AOA" ? "Kwanzas" : c === "USD" ? "Dólares" : "Euros"}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Pago</span>
              <select name="billing" defaultValue="monthly" className="field !min-h-0 !py-2">
                <option value="monthly">Por mês</option>
                <option value="yearly">Por ano</option>
              </select>
            </label>
            <label>
              <span className="label">A partir de</span>
              <input type="month" name="from" defaultValue={mes} className="field !min-h-0 !py-2" />
            </label>
            <label className="lg:col-span-2">
              <span className="label">Detalhe (opcional)</span>
              <input name="detail" maxLength={60} placeholder="Ex.: fornecedor, contrato" className="field !min-h-0 !py-2" />
            </label>
            <label>
              <span className="label">Ícone</span>
              <select name="icon" defaultValue="" className="field !min-h-0 !py-2">
                <option value="">Inicial do nome</option>
                <option value="africell">Africell</option>
                <option value="building">Edifício</option>
              </select>
            </label>
            <div className="flex items-end lg:col-span-3">
              <SubmitButton className="btn btn-primary btn-sm">Adicionar custo</SubmitButton>
            </div>
          </form>
        </section>

        {/* Anúncios */}
        <H2 id="anuncios" icon={Megaphone} title={`Anúncios em ${monthName(mes)}`} lead="Escreva quanto pretende gastar no início do mês e quanto gastou no fim. Enquanto o gasto real estiver vazio, o painel usa o previsto." />
        <form action={saveAds} className="card mt-4 p-5">
          <input type="hidden" name="mes" value={mes} />
          <div className="divide-y divide-line">
            {AD_PLATFORMS.map((p) => {
              const a = costs.ads.find((x) => x.platform === p.key);
              const over = a && a.spent != null && a.planned > 0 && a.spent > a.planned;
              return (
                <div key={p.key} className="grid items-end gap-3 py-3 first:pt-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <span className="flex items-center gap-3 sm:pb-2.5">
                    <Logo src={p.logo} size={26} />
                    <span className="text-[14px] font-medium">{p.name}</span>
                  </span>
                  <label>
                    <span className="label">Previsto ($)</span>
                    <input name={`planned_${p.key}`} inputMode="decimal" defaultValue={a?.planned ? String(a.planned).replace(".", ",") : ""} placeholder="0" className="field !min-h-0 !py-2 tabular-nums" />
                  </label>
                  <label>
                    <span className="label">Gasto real ($){over ? <span className="text-bad"> · acima do previsto</span> : null}</span>
                    <input name={`spent_${p.key}`} inputMode="decimal" defaultValue={a?.spent != null ? String(a.spent).replace(".", ",") : ""} placeholder="—" className="field !min-h-0 !py-2 tabular-nums" />
                  </label>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[13px]">
            <span className="text-muted">
              Previsto <strong className="text-ivory tabular-nums">{usd(sum.adsPlanned)}</strong> · Gasto <strong className="text-ivory tabular-nums">{usd(sum.adsSpent)}</strong>
              {sum.adsPlanned > 0 ? ` · ${Math.round((sum.adsSpent / sum.adsPlanned) * 100)} % do orçamento` : ""}
            </span>
            <SubmitButton className="btn btn-primary btn-sm">Guardar anúncios</SubmitButton>
          </div>
        </form>

        {/* Resumo dos custos */}
        <section className="card mt-3 p-5">
          <p className="flex items-center gap-2 text-[15px] font-semibold"><Ico icon={Receipt} />Resumo dos custos de {monthName(mes)}</p>
          <dl className="mt-3 divide-y divide-line text-[13.5px]">
            {[
              ["Ferramentas (planos)", sum.tools],
              ["Gemini API (consumo)", sum.ai],
              ["Anúncios", sum.adsUsed],
              ["Outros custos", sum.extra],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between gap-3 py-2">
                <dt className="text-muted">{l}</dt>
                <dd className="tabular-nums">{usd(v as number)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 py-2 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{usd(sum.total)}</dd>
            </div>
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-muted">Em dólares, pagos pela caixa 1 (com {s.buffer} % de folga: {usd(sum.need)})</dt>
              <dd className="tabular-nums">{usd(sum.usdTotal)}</dd>
            </div>
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-muted">Em kwanzas, pagos pelo BFA (caixa 2)</dt>
              <dd className="tabular-nums">{kz(sum.kzCosts)} <span className="text-muted">≈ {usd(sum.kzUsd)}</span></dd>
            </div>
          </dl>
        </section>

        {/* Definições */}
        <H2 id="definicoes" icon={Settings2} title="Definições" lead="Percentagens, câmbios e taxas. Os depósitos já registados guardam os valores do dia em que foram registados." />
        <form action={saveFinSettings} className="card mt-4 space-y-8 p-5">
          <input type="hidden" name="mes" value={mes} />
          <fieldset>
            <legend className="flex items-center gap-2 text-[15px] font-semibold"><Ico icon={PiggyBank} />Divisão pelas 4 caixas</legend>
            <p className={`mt-1 text-[12.5px] ${pctSum === 100 ? "text-muted" : "text-bad"}`}>Somam {pctSum} % (têm de somar 100 %).</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {BOXES.map((b, i) => (
                <label key={b.key}>
                  <span className="label">Caixa {i + 1} · {b.name}</span>
                  <input name={`p_${b.key}`} inputMode="decimal" defaultValue={String(s.pct[b.key]).replace(".", ",")} className="field tabular-nums" />
                </label>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label>
                <span className="label">Da caixa 4, % que segue no SWIFT para o BAI</span>
                <input name="bai_pct" inputMode="decimal" defaultValue={String(s.baiPct).replace(".", ",")} className="field tabular-nums" />
              </label>
              <label>
                <span className="label">Folga sobre os custos em dólares (%)</span>
                <input name="buffer" inputMode="decimal" defaultValue={String(s.buffer).replace(".", ",")} className="field tabular-nums" />
              </label>
              <label>
                <span className="label">Mínimo de pagamento da Paddle ($)</span>
                <input name="threshold" inputMode="decimal" defaultValue={String(s.threshold).replace(".", ",")} className="field tabular-nums" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="flex items-center gap-2 text-[15px] font-semibold"><Ico icon={Coins} />Câmbios</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label>
                <span className="label">Câmbio da empresa (Kz por 1 $)</span>
                <input name="usd_aoa" inputMode="decimal" defaultValue={String(s.fx.usdAoa).replace(".", ",")} className="field tabular-nums" />
              </label>
              <label>
                <span className="label">Euro → dólar</span>
                <select name="eur_mode" defaultValue={s.fx.eurUsd == null ? "auto" : "manual"} className="field">
                  <option value="auto">Automático ({market.eurUsd ? market.eurUsd.toFixed(4).replace(".", ",") : "sem ligação"})</option>
                  <option value="manual">Manual (campo ao lado)</option>
                </select>
              </label>
              <label>
                <span className="label">Valor manual (1 € em $)</span>
                <input name="eur_usd" inputMode="decimal" defaultValue={String(s.fx.eurUsd ?? r.eurUsd.toFixed(4)).replace(".", ",")} className="field tabular-nums" />
              </label>
            </div>
            <p className="mt-2 text-[12.5px] leading-5 text-muted">
              Câmbio de mercado hoje: {market.usdAoa ? `${new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }).format(market.usdAoa)} Kz por dólar` : "sem ligação"}. O câmbio da empresa é o que usa nas contas; mude-o para o que o banco lhe der.
            </p>
          </fieldset>

          <fieldset>
            <legend className="flex items-center gap-2 text-[15px] font-semibold"><Ico icon={Landmark} />Taxas bancárias</legend>
            <p className="mt-1 text-[12.5px] leading-5 text-muted">Valores públicos da Grey como ponto de partida. Depois do primeiro depósito e da primeira transferência, ponha os valores reais. «0» no mínimo ou no máximo quer dizer sem limite.</p>
            <div className="mt-3 space-y-4">
              {(
                [
                  ["grey_in", "Receber da Paddle na Grey (por depósito)", s.fees.greyIn, "Por ACH: 0,8 %, mín. 2 $, máx. 10 $ (por wire seriam 20 $)."],
                  ["to_ao", "SWIFT da Grey para o BFA (por envio)", s.fees.toAngola, "Um só envio por depósito: caixa 2 + a sua parte para o BAI."],
                  ["g2g", "Grey da empresa → Grey pessoal", s.fees.greyToGrey, "Entre contas Grey."],
                ] as const
              ).map(([k, label, f, hint]) => (
                <div key={k} className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] sm:items-end">
                  <p className="text-[13.5px] sm:pb-2.5">
                    <span className="font-medium">{label}</span>
                    <span className="block text-[12px] text-muted">{hint} Hoje: {feeText(f)}.</span>
                  </p>
                  <label><span className="label">Fixo ($)</span><input name={`${k}_fixed`} inputMode="decimal" defaultValue={String(f.fixed).replace(".", ",")} className="field !min-h-0 !py-2 tabular-nums" /></label>
                  <label><span className="label">%</span><input name={`${k}_pct`} inputMode="decimal" defaultValue={String(f.pct).replace(".", ",")} className="field !min-h-0 !py-2 tabular-nums" /></label>
                  <label><span className="label">Mín. ($)</span><input name={`${k}_min`} inputMode="decimal" defaultValue={String(f.min).replace(".", ",")} className="field !min-h-0 !py-2 tabular-nums" /></label>
                  <label><span className="label">Máx. ($)</span><input name={`${k}_max`} inputMode="decimal" defaultValue={String(f.max).replace(".", ",")} className="field !min-h-0 !py-2 tabular-nums" /></label>
                </div>
              ))}
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] sm:items-end">
                <p className="text-[13.5px] sm:pb-2.5">
                  <span className="font-medium">Comissão do BFA ao receber o SWIFT</span>
                  <span className="block text-[12px] text-muted">Estimativa até ao primeiro envio.</span>
                </p>
                <label><span className="label">%</span><input name="bank_ao_pct" inputMode="decimal" defaultValue={String(s.fees.bankInAo.pct).replace(".", ",")} className="field !min-h-0 !py-2 tabular-nums" /></label>
                <label><span className="label">Fixo (Kz)</span><input name="bank_ao_fixed" inputMode="decimal" defaultValue={String(s.fees.bankInAo.fixedKz).replace(".", ",")} className="field !min-h-0 !py-2 tabular-nums" /></label>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="flex items-center gap-2 text-[15px] font-semibold"><Ico icon={Sparkles} />Preço da IA (Gemini)</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label><span className="label">Entrada ($ por milhão de tokens)</span><input name="ai_in" inputMode="decimal" defaultValue={String(s.ai.inPerM).replace(".", ",")} className="field tabular-nums" /></label>
              <label><span className="label">Saída ($ por milhão de tokens)</span><input name="ai_out" inputMode="decimal" defaultValue={String(s.ai.outPerM).replace(".", ",")} className="field tabular-nums" /></label>
            </div>
            <p className="mt-2 text-[12.5px] leading-5 text-muted">Preço do modelo em uso (gemini-flash-latest). Se a Google mudar o preço, atualize aqui.</p>
          </fieldset>

          <SubmitButton className="btn btn-primary">Guardar definições</SubmitButton>
        </form>
        {market.usdAoa && Math.abs(market.usdAoa - s.fx.usdAoa) >= 1 && (
          <form action={useMarketRate} className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
            <input type="hidden" name="mes" value={mes} />
            <input type="hidden" name="rate" value={market.usdAoa} />
            <span className="text-muted">Quer usar o câmbio de mercado de hoje ({new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }).format(market.usdAoa)} Kz) como câmbio da empresa?</span>
            <SubmitButton className="btn btn-secondary btn-sm">Usar este câmbio</SubmitButton>
          </form>
        )}

        <p className="mt-10 text-[11.5px] text-muted">
          Valores em dólares, a moeda em que a Paddle paga. Câmbios de mercado:{" "}
          <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Rates By Exchange Rate API</a>
          {market.at ? ` (${new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" }).format(new Date(market.at))})` : ""}.
        </p>
      </main>
    </div>
  );
}
