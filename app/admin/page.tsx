import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin";
import { getSetting, limitsFor, PIXEL_EVENTS, PLAN_INFO, type Pixel, type Plans } from "@/lib/platform";
import { OfficesRing, RevenueChart, type Segment } from "@/components/admin-charts";
import { site } from "@/lib/site";
import { adminSignOut, saveMetaPixel, sendUtmifyTest, setAdminName, setPlan } from "./actions";
import { utmifyEnabled } from "@/lib/utmify";
import { Toast } from "@/components/toast";
import { SubmitButton } from "@/components/app-buttons";

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
  source: string | null;
};
type Stats = {
  db_bytes: number;
  storage_bytes: number;
  emails_today: number;
  emails_month: number;
  offices: Office[];
  utmify_recent?: { type: string; at: string; result: string; office: string | null }[];
};

const EVENT_HINT: Record<string, string> = {
  PageView: "Cada página vista",
  ViewContent: "Abriu os preços ou o registo",
  Lead: "Pediu para criar conta",
  CompleteRegistration: "Confirmou o e-mail e entrou",
  StartTrial: "Começou o teste grátis",
  Purchase: "Pagou uma assinatura (com valor)",
};

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

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ utmify?: string; ok?: string; erro?: string }> }) {
  const { user } = await requireAdmin();
  const sp = await searchParams;
  const tested = sp.utmify;
  const utmOn = utmifyEnabled();
  const admin = createAdminClient();
  const [{ data, error }, { data: rev }, { data: rel }, plans, pixel] = await Promise.all([
    admin.rpc("platform_stats"),
    admin.rpc("platform_revenue"),
    admin.from("platform_releases").select("version, released_on, title, notes").order("released_on", { ascending: false }).order("id", { ascending: false }),
    getSetting<Plans>("plans", { vercel: "hobby", supabase: "free", resend: "free" }),
    getSetting<Pixel>("meta_pixel", { id: null, events: [] }),
  ]);
  const s = (data ?? { db_bytes: 0, storage_bytes: 0, emails_today: 0, emails_month: 0, offices: [] }) as Stats;
  const offices = s.offices ?? [];
  const limits = limitsFor(plans);
  const releases = (rel ?? []) as { version: string; released_on: string; title: string; notes: string[] }[];

  const by = (k: ReturnType<typeof stateOf>["key"]) => offices.filter((o) => stateOf(o).key === k).length;
  const paying = offices.filter((o) => stateOf(o).key === "paying");
  // Receita mensal recorrente estimada (anuais divididos por 12), separada por moeda
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
  const new7 = offices.filter((o) => Date.parse(o.created_at) >= week).length;
  const endingSoon = offices.filter((o) => stateOf(o).key === "trial" && Date.parse(o.trial_ends_at) - Date.now() < 2 * 86_400_000).length;
  const aiCalls = offices.reduce((a, o) => a + Number(o.ai_calls), 0);
  const aiTokens = offices.reduce((a, o) => a + Number(o.ai_tokens), 0);
  const costs = (Object.keys(PLAN_INFO) as (keyof Plans)[]).reduce((a, k) => a + (plans[k] === "pro" ? PLAN_INFO[k].cost : 0), 0);

  // Receita recebida nos últimos 6 meses (pagamentos reais registados pela Paddle), em euros
  const revRows = (rev ?? []) as { month: string; currency: string; total: number; earnings: number; count: number }[];
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });
  const series = (cur: string) =>
    months.map((m) => {
      const r = revRows.find((x) => x.month === m && x.currency === cur);
      return { label: new Intl.DateTimeFormat("pt-PT", { month: "short" }).format(new Date(`${m}-15`)).replace(".", ""), total: Number(r?.total ?? 0), earnings: Number(r?.earnings ?? 0), count: Number(r?.count ?? 0) };
    });
  const eurSeries = series("EUR");
  const brlSeries = series("BRL");
  const hasBrl = brlSeries.some((p) => p.total > 0);
  const monthNow = eurSeries[5];

  // Saudação: o nome guardado e duas frases tiradas dos números de hoje
  const name = (user.user_metadata?.display_name as string | undefined) || "Edvaldo";
  const hour = Number(new Intl.DateTimeFormat("pt-PT", { hour: "numeric", hour12: false, timeZone: "Africa/Luanda" }).format(new Date()));
  const hello = hour < 12 ? "Bom dia" : hour < 19 ? "Boa tarde" : "Boa noite";
  const notes: string[] = [];
  if (by("past_due")) notes.push(`${by("past_due")} ${by("past_due") === 1 ? "escritório tem" : "escritórios têm"} o pagamento em atraso.`);
  if (endingSoon) notes.push(`${endingSoon} ${endingSoon === 1 ? "teste termina" : "testes terminam"} nas próximas 48 horas: é o momento de ajudar a converter.`);
  if (new7) notes.push(`${new7} ${new7 === 1 ? "escritório novo" : "escritórios novos"} nos últimos 7 dias.`);
  if (monthNow.count) notes.push(`${monthNow.count} ${monthNow.count === 1 ? "pagamento recebido" : "pagamentos recebidos"} este mês.`);
  if (!notes.length) notes.push(paying.length ? `${paying.length} ${paying.length === 1 ? "escritório pagante" : "escritórios pagantes"} e tudo calmo hoje.` : "Tudo pronto para os primeiros clientes pagantes.");

  const ring: Segment[] = [
    { key: "paying", label: "Pagantes", value: paying.length, from: "#34d399", to: "#059669" },
    { key: "trial", label: "Em teste", value: by("trial"), from: "#60a5fa", to: "#2563eb" },
    { key: "trial_ended", label: "Teste terminado", value: by("trial_ended"), from: "#fcd34d", to: "#d97706" },
    { key: "past_due", label: "Pagamento em atraso", value: by("past_due"), from: "#fdba74", to: "#ea580c" },
    { key: "canceled", label: "Cancelados", value: by("canceled"), from: "#fca5a5", to: "#dc2626" },
  ];

  const okText: Record<string, string> = {
    nome: "Nome guardado.",
    pixel: "Pixel da Meta guardado. As páginas usam-no dentro de poucos minutos.",
    "plano-vercel": "Plano da Vercel atualizado.",
    "plano-supabase": "Plano da Supabase atualizado: limites recalculados.",
    "plano-resend": "Plano da Resend atualizado: limites recalculados.",
  };

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

      {sp.ok && okText[sp.ok] && <Toast tone="ok" text={okText[sp.ok]} />}
      {sp.erro === "pixel" && <Toast tone="bad" text="O ID do Pixel tem só números (6 a 20). Copie-o do Gestor de Eventos da Meta." />}
      {tested && <Toast tone={tested.startsWith("ok") ? "ok" : "bad"} text={tested.startsWith("ok") ? "A UTMify aceitou a venda de teste (não fica gravada)." : `A UTMify recusou: ${tested}`} />}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
        {/* Saudação */}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ivory">Cockpit</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">
              {hello}, {name}. Bem-vindo ao cockpit.
            </h1>
            <ul className="mt-3 space-y-1 text-[15px] text-muted">
              {notes.slice(0, 2).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <details className="group relative">
            <summary className="cursor-pointer list-none text-[13px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory">Mudar o meu nome</summary>
            <form action={setAdminName} className="card absolute right-0 z-20 mt-2 flex w-72 gap-2 p-3">
              <input name="name" defaultValue={name} maxLength={40} className="field !min-h-0 !py-2" aria-label="Nome" />
              <SubmitButton className="btn btn-primary btn-sm">Guardar</SubmitButton>
            </form>
          </details>
        </section>
        {error && <p className="mt-4 text-sm text-bad">Não foi possível ler os números ({error.message}).</p>}

        {/* Números principais */}
        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Receita mensal",
              value: [mrr.eur || !mrr.brl ? `${num(Math.round(mrr.eur))} €` : "", mrr.brl ? `R$ ${num(Math.round(mrr.brl))}` : ""].filter(Boolean).join(" + "),
              hint: "Recorrente, antes da taxa da Paddle",
            },
            { label: "Custos fixos", value: `$${costs}`, hint: costs ? "Planos Pro ativos, por mês" : "Tudo em planos gratuitos" },
            { label: "Ativos 7 dias", value: num(active7), hint: `de ${num(offices.length)} escritórios` },
            { label: "IA este mês", value: num(aiCalls), hint: `ficheiros · ${num(aiTokens)} tokens` },
          ].map((k) => (
            <div key={k.label} className="card p-4">
              <dt className="mono-label">{k.label}</dt>
              <dd className="figure mt-2 text-[28px] leading-none sm:text-[34px]">{k.value}</dd>
              <p className="mt-2 text-[12.5px] text-muted">{k.hint}</p>
            </div>
          ))}
        </dl>

        {/* Gráficos */}
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-semibold">Receita recebida</h2>
              <p className="text-[12.5px] text-muted">Pagamentos da Paddle, últimos 6 meses (euros)</p>
            </div>
            <div className="mt-5">
              <RevenueChart points={eurSeries} currency="EUR" />
            </div>
            {hasBrl && (
              <div className="mt-8 border-t border-line pt-5">
                <p className="mb-4 text-[12.5px] text-muted">Brasil (reais)</p>
                <RevenueChart points={brlSeries} currency="BRL" />
              </div>
            )}
          </section>
          <section className="card p-5">
            <h2 className="text-[16px] font-semibold">Escritórios</h2>
            <p className="mt-1 text-[12.5px] text-muted">{active7} ativos nos últimos 7 dias</p>
            <div className="mt-5">
              <OfficesRing segments={ring} total={offices.length} center="escritórios" />
            </div>
          </section>
        </div>

        {/* Infraestrutura e planos */}
        <h2 className="mt-10 text-[17px] font-semibold">Infraestrutura</h2>
        <p className="mt-1 text-[13px] text-muted">Os limites seguem o plano de cada ferramenta. Os e-mails contam os lembretes automáticos enviados pelo Bilonai.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Meter label="Base de dados" used={Number(s.db_bytes)} max={limits.dbBytes} format={mb} />
          <Meter label="Ficheiros" used={Number(s.storage_bytes)} max={limits.storageBytes} format={mb} />
          {limits.emailsDay ? <Meter label="E-mails hoje" used={Number(s.emails_today)} max={limits.emailsDay} format={num} /> : (
            <div className="card p-4">
              <p className="mono-label">E-mails hoje</p>
              <p className="mt-2 text-[15px] tabular-nums"><strong className="font-semibold">{num(Number(s.emails_today))}</strong> <span className="text-muted">sem limite diário</span></p>
            </div>
          )}
          <Meter label="E-mails este mês" used={Number(s.emails_month)} max={limits.emailsMonth} format={num} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(Object.keys(PLAN_INFO) as (keyof Plans)[]).map((k) => {
            const info = PLAN_INFO[k];
            const pro = plans[k] === "pro";
            return (
              <form key={k} action={setPlan} className="card flex items-center justify-between gap-3 p-4">
                <input type="hidden" name="tool" value={k} />
                <input type="hidden" name="tier" value={pro ? info.free === "Hobby" ? "hobby" : "free" : "pro"} />
                <span>
                  <span className="block text-[15px] font-medium">{info.name}</span>
                  <span className={`mt-0.5 block text-[12.5px] ${pro ? "text-ok" : "text-muted"}`}>{pro ? `Pro ativo · $${info.cost}/mês` : `Plano ${info.free}`}</span>
                </span>
                <SubmitButton className={`btn btn-sm ${pro ? "btn-secondary" : "btn-primary"}`}>{pro ? `Voltar ao ${info.free}` : "Ativei o Pro"}</SubmitButton>
              </form>
            );
          })}
        </div>

        {/* Integrações */}
        <h2 id="utmify" className="mt-10 scroll-mt-24 text-[17px] font-semibold">Integrações</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/utmify.png" alt="" width={36} height={34} className="h-9 w-9 rounded-[9px] object-contain" />
                <div>
                  <p className="text-[15px] font-semibold">UTMify</p>
                  <p className={`flex items-center gap-1.5 text-[12.5px] ${utmOn ? "text-ok" : "text-muted"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${utmOn ? "bg-ok" : "bg-line-strong"}`} aria-hidden />
                    {utmOn ? "Ligada" : "Desligada"}
                  </p>
                </div>
              </div>
              {utmOn && (
                <form action={sendUtmifyTest}>
                  <SubmitButton className="btn btn-secondary btn-sm">Enviar venda de teste</SubmitButton>
                </form>
              )}
            </div>
            <p className="mt-4 text-[13px] leading-6 text-muted">
              Cada pagamento, renovação, reembolso e chargeback da Paddle segue para a UTMify, com a origem do cliente (UTM), o valor, a taxa e o que fica para a empresa.
            </p>
            {!utmOn && (
              <p className="mt-3 text-[13px] leading-6 text-muted">
                Para ligar: na UTMify, Integrações → Webhooks → Credenciais de API → criar credencial. Na Vercel, projeto bentrega → Settings → Environment Variables, crie <code className="font-mono text-ivory">UTMIFY_API_TOKEN</code> e faça um novo deploy.
              </p>
            )}
            {(s.utmify_recent ?? []).length > 0 && (
              <ul className="mt-4 divide-y divide-line border-t border-line text-[13px]">
                {(s.utmify_recent ?? []).map((r, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                    <span>
                      <span className="font-medium">{r.office ?? "—"}</span> <span className="text-muted">· {r.type} · {day(r.at)}</span>
                    </span>
                    <span className={r.result.startsWith("ok") ? "text-ok" : "text-bad"}>{r.result}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/meta.png" alt="" width={44} height={29} className="h-9 w-11 object-contain" />
              <div>
                <p className="text-[15px] font-semibold">Pixel da Meta</p>
                <p className={`flex items-center gap-1.5 text-[12.5px] ${pixel.id ? "text-ok" : "text-muted"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${pixel.id ? "bg-ok" : "bg-line-strong"}`} aria-hidden />
                  {pixel.id ? "Ligado" : "Desligado"}
                </p>
              </div>
            </div>
            <form action={saveMetaPixel} className="mt-4 space-y-4">
              <label className="block">
                <span className="label">ID do Pixel</span>
                <input name="pixel" defaultValue={pixel.id ?? ""} inputMode="numeric" placeholder="Ex.: 123456789012345" className="field font-mono" />
              </label>
              <fieldset>
                <legend className="label">Eventos enviados</legend>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {PIXEL_EVENTS.map((e) => (
                    <label key={e} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-ink-3">
                      <input type="checkbox" name="events" value={e} defaultChecked={pixel.events.includes(e)} className="peer sr-only" />
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border border-line-strong text-transparent transition peer-checked:border-ivory peer-checked:bg-ivory peer-checked:text-ink" aria-hidden>
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.4 6.3l2.4 2.3 4.8-5" /></svg>
                      </span>
                      <span>
                        <span className="font-medium">{e}</span>
                        <span className="block text-[12px] text-muted">{EVENT_HINT[e]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className={`flex items-center gap-1.5 text-[12.5px] ${process.env.META_CAPI_TOKEN ? "text-ok" : "text-muted"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${process.env.META_CAPI_TOKEN ? "bg-ok" : "bg-line-strong"}`} aria-hidden />
                API de Conversões {process.env.META_CAPI_TOKEN ? "ligada: Lead, registo e compra seguem também pelo servidor, sem contar a dobrar" : "desligada (falta META_CAPI_TOKEN na Vercel)"}
              </p>
              <p className="text-[12px] leading-5 text-muted">Só carrega depois de o visitante aceitar os cookies de medição (obrigatório na UE). Nunca corre nas páginas dos clientes dos escritórios nem aqui.</p>
              <SubmitButton className="btn btn-primary btn-sm">Guardar</SubmitButton>
            </form>
          </section>
        </div>

        {/* Evolução do Bilonai */}
        <h2 className="mt-10 text-[17px] font-semibold">Evolução do Bilonai</h2>
        <ol className="relative mt-4 space-y-5 border-l border-line pl-6">
          {releases.map((r, i) => (
            <li key={r.version} className="relative">
              <span className={`absolute -left-[31px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-ink ${i === 0 ? "bg-ok" : "bg-line-strong"}`} aria-hidden />
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-[11px]">v{r.version}</span>
                <span className="text-[15px] font-semibold">{r.title}</span>
                <span className="font-mono text-[11px] text-muted">{new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric" }).format(new Date(r.released_on))}</span>
              </p>
              <ul className="mt-2 space-y-1 text-[13.5px] leading-6 text-muted">
                {r.notes.map((n) => (
                  <li key={n}>· {n}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <h2 className="mt-12 text-[17px] font-semibold">Todos os escritórios</h2>
        <div className="mt-4 overflow-x-auto rounded-[14px] border border-line">
          <table className="w-full min-w-[1000px] text-left text-[13px]">
            <thead className="bg-ink-3/50 text-[11px] uppercase tracking-wider text-muted">
              <tr>
                {["Escritório", "Estado", "Origem", "Clientes", "Pedidos (mês)", "Ficheiros", "Armazen.", "E-mails (mês)", "IA (mês)", "Equipa", "Último acesso", "Criado"].map((h) => (
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
                    <td className="px-3 py-3 text-muted">{o.source ?? "direto"}</td>
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
                  <td colSpan={12} className="px-3 py-8 text-center text-muted">
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
