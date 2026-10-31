import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { createAdminClient } from "@/lib/supabase/admin";
import { limits, requireAdmin } from "@/lib/admin";
import { site } from "@/lib/site";
import { adminSignOut } from "./actions";

export const metadata: Metadata = { title: "Admin · Bilonai", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Office = {
  id: string;
  name: string;
  email: string | null;
  country: string | null;
  profession: string | null;
  client_range: string | null;
  locale: string;
  plan: string;
  status: string;
  interval: string | null;
  trial_ends_at: string;
  created_at: string;
  clients: number;
  requests_month: number;
  files: number;
  storage_bytes: number;
  emails_month: number;
  ai_calls: number;
  ai_tokens: number;
  team: number;
  last_seen: string | null;
};
type Stats = { db_bytes: number; storage_bytes: number; emails_today: number; emails_month: number; offices: Office[] };

const mb = (b: number) => (b < 1024 * 1024 ? `${Math.max(0, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace(".0", "")} MB`);
const num = (n: number) => new Intl.NumberFormat("pt-PT").format(n);
const day = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" }).format(new Date(iso)) : "—");
const ago = (iso: string | null) => {
  if (!iso) return "nunca";
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  return d <= 0 ? "hoje" : d === 1 ? "ontem" : `há ${d} dias`;
};

// Estado comercial de cada escritório (mesmo critério do painel dos escritórios)
function stateOf(o: Office): { key: "trial" | "trial_ended" | "paying" | "past_due" | "canceled"; label: string; tone: string } {
  if (o.status === "active") return { key: "paying", label: "Pagante", tone: "bg-ok/10 text-ok" };
  if (o.status === "past_due") return { key: "past_due", label: "Pagamento em atraso", tone: "bg-warn/10 text-warn" };
  if (o.status === "trialing")
    return Date.parse(o.trial_ends_at) > Date.now()
      ? { key: "trial", label: "Em teste", tone: "bg-ink-3 text-ivory" }
      : { key: "trial_ended", label: "Teste terminado", tone: "bg-bad/10 text-bad" };
  return { key: "canceled", label: "Cancelado", tone: "bg-bad/10 text-bad" };
}

function Meter({ label, used, max, format }: { label: string; used: number; max: number; format: (n: number) => string }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  const tone = pct >= 85 ? "bg-bad" : pct >= 60 ? "bg-warn" : "bg-ivory";
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="mono-label">{label}</p>
        <p className="font-mono text-[11px] tabular-nums text-muted">{pct}%</p>
      </div>
      <p className="mt-2 text-[15px] tabular-nums">
        <strong className="font-semibold">{format(used)}</strong> <span className="text-muted">de {format(max)}</span>
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-3">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(pct, used > 0 ? 2 : 0)}%` }} />
      </div>
    </div>
  );
}

export default async function AdminHome() {
  const { user } = await requireAdmin();
  const { data, error } = await createAdminClient().rpc("platform_stats");
  const s = (data ?? { db_bytes: 0, storage_bytes: 0, emails_today: 0, emails_month: 0, offices: [] }) as Stats;
  const offices = s.offices ?? [];

  const by = (k: ReturnType<typeof stateOf>["key"]) => offices.filter((o) => stateOf(o).key === k).length;
  const paying = offices.filter((o) => stateOf(o).key === "paying");
  // Receita mensal estimada (anuais divididos por 12), separada por moeda
  const mrr = { eur: 0, brl: 0 };
  for (const o of paying) {
    const p = site.plans[o.plan === "office" ? "office" : "starter"];
    const brl = o.locale === "pt-BR";
    const monthly = o.interval === "year" ? (brl ? p.yearBrl : p.yearEur) / 12 : brl ? p.priceBrl : p.priceEur;
    if (brl) mrr.brl += monthly;
    else mrr.eur += monthly;
  }
  const week = Date.now() - 7 * 86_400_000;
  const active7 = offices.filter((o) => o.last_seen && Date.parse(o.last_seen) >= week).length;
  const aiCalls = offices.reduce((a, o) => a + Number(o.ai_calls), 0);
  const aiTokens = offices.reduce((a, o) => a + Number(o.ai_tokens), 0);

  const kpis: { label: string; value: string; hint?: string }[] = [
    { label: "Escritórios", value: num(offices.length), hint: `${active7} ativos nos últimos 7 dias` },
    { label: "Pagantes", value: num(paying.length), hint: by("past_due") ? `${by("past_due")} com pagamento em atraso` : undefined },
    { label: "Em teste", value: num(by("trial")), hint: `${by("trial_ended")} com o teste terminado` },
    { label: "Cancelados", value: num(by("canceled")) },
    {
      label: "Receita mensal (estimada)",
      value: [mrr.eur ? `${num(Math.round(mrr.eur))} €` : "", mrr.brl ? `R$ ${num(Math.round(mrr.brl))}` : ""].filter(Boolean).join(" + ") || "0 €",
      hint: "Antes da taxa da Paddle",
    },
    { label: "IA este mês", value: `${num(aiCalls)} ficheiros`, hint: `${num(aiTokens)} tokens da Gemini` },
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">Admin</span>
          </div>
          <form action={adminSignOut} className="flex items-center gap-3">
            <span className="hidden text-[13px] text-muted sm:inline">{user.email}</span>
            <button className="btn btn-secondary btn-sm">Sair</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Cockpit</h1>
        <p className="mt-2 text-sm text-muted">Números calculados agora, a partir dos dados que já existem. Nada fica guardado só para este painel.</p>
        {error && <p className="mt-4 text-sm text-bad">Não foi possível ler os números ({error.message}).</p>}

        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="card p-4">
              <dt className="mono-label">{k.label}</dt>
              <dd className="figure mt-2 text-[30px] leading-none sm:text-[36px]">{k.value}</dd>
              {k.hint && <p className="mt-2 text-[12.5px] text-muted">{k.hint}</p>}
            </div>
          ))}
        </dl>

        <h2 className="mt-10 text-[17px] font-semibold">Infraestrutura</h2>
        <p className="mt-1 text-[13px] text-muted">Limites dos planos gratuitos atuais (Supabase e Resend). Os e-mails contam só os lembretes automáticos enviados pelo Bilonai.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Meter label="Base de dados" used={Number(s.db_bytes)} max={limits.dbBytes} format={mb} />
          <Meter label="Ficheiros" used={Number(s.storage_bytes)} max={limits.storageBytes} format={mb} />
          <Meter label="E-mails hoje" used={Number(s.emails_today)} max={limits.emailsDay} format={num} />
          <Meter label="E-mails este mês" used={Number(s.emails_month)} max={limits.emailsMonth} format={num} />
        </div>

        <h2 className="mt-10 text-[17px] font-semibold">Escritórios</h2>
        <div className="mt-4 overflow-x-auto rounded-[14px] border border-line">
          <table className="w-full min-w-[920px] text-left text-[13px]">
            <thead className="bg-ink-3/50 text-[11px] uppercase tracking-wider text-muted">
              <tr>
                {["Escritório", "Estado", "Clientes", "Pedidos (mês)", "Ficheiros", "Armazen.", "E-mails (mês)", "IA (mês)", "Equipa", "Último acesso", "Criado"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {offices.map((o) => {
                const st = stateOf(o);
                return (
                  <tr key={o.id} className="bg-ink-2">
                    <td className="px-3 py-3">
                      <p className="max-w-[16rem] truncate font-medium">{o.name}</p>
                      <p className="max-w-[16rem] truncate text-[12px] text-muted">
                        {[o.email, o.country, o.profession === "other" ? "outra área" : null].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ${st.tone}`}>{st.label}</span>
                      <p className="mt-1 text-[11.5px] text-muted">
                        {o.plan === "office" ? "Escritório" : "Starter"}
                        {st.key === "trial" ? ` · até ${day(o.trial_ends_at)}` : o.interval === "year" ? " · anual" : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{num(o.clients)}</td>
                    <td className="px-3 py-3 tabular-nums">{num(o.requests_month)}</td>
                    <td className="px-3 py-3 tabular-nums">{num(o.files)}</td>
                    <td className="px-3 py-3 tabular-nums">{mb(Number(o.storage_bytes))}</td>
                    <td className="px-3 py-3 tabular-nums">{num(o.emails_month)}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {num(o.ai_calls)}
                      <span className="block text-[11.5px] text-muted">{num(Number(o.ai_tokens))} tokens</span>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{num(o.team)}</td>
                    <td className="whitespace-nowrap px-3 py-3">{ago(o.last_seen)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{day(o.created_at)}</td>
                  </tr>
                );
              })}
              {offices.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-muted">
                    Ainda não há escritórios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
