import type { Metadata } from "next";
import Link from "next/link";
import { Check, Link2, MessageCircle, ListChecks, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Documentos em falta dos clientes, sob controlo",
  description: `Para escritórios de contabilidade: peça os documentos do mês por link, veja quem ainda não entregou e envie lembretes por WhatsApp. ${site.trialDays} dias grátis, sem cartão.`,
  alternates: { canonical: "/" },
};

const steps = [
  {
    icon: ListChecks,
    title: "Crie o pedido do mês",
    text: "Escolha o cliente, o período e os documentos que precisa: faturas, extratos, recibos. A lista fica guardada para o mês seguinte.",
  },
  {
    icon: Link2,
    title: "O cliente abre um link",
    text: "Sem conta, sem aplicação, sem palavra-passe. Vê o que falta e assinala o que já enviou.",
  },
  {
    icon: MessageCircle,
    title: "Lembre por WhatsApp num clique",
    text: "A mensagem sai pronta, com a lista do que ainda falta. Confirma e envia a partir do seu próprio WhatsApp.",
  },
];

const rows = [
  { name: "Cliente A", done: 8, total: 8 },
  { name: "Cliente B", done: 5, total: 8 },
  { name: "Cliente C", done: 2, total: 8 },
  { name: "Cliente D", done: 8, total: 8 },
];

const faq = [
  {
    q: "Preciso de cartão para experimentar?",
    a: `Não. Tem ${site.trialDays} dias de teste com tudo ativo e sem indicar qualquer meio de pagamento. Só decide pagar se quiser continuar.`,
  },
  {
    q: "Os meus clientes precisam de criar conta?",
    a: "Não. Recebem um link único e privado para o pedido deles. Abrem no telemóvel e assinalam o que já enviaram.",
  },
  {
    q: "Os documentos ficam guardados na plataforma?",
    a: "Nesta fase não. O Bilonai Entrega acompanha o estado de cada documento (em falta, enviado, recebido), mas os ficheiros continuam a chegar pelo canal que já usa. Isto reduz o risco e a quantidade de dados pessoais que guardamos.",
  },
  {
    q: "E o e-fatura? Já recebo as faturas por lá.",
    a: "O Bilonai Entrega complementa o e-fatura: serve para o que não chega por lá, como extratos bancários, recibos e outros documentos de cada cliente.",
  },
  {
    q: "Onde ficam os dados?",
    a: "Numa base de dados na União Europeia (Irlanda), com acesso restrito por escritório. Detalhes na política de privacidade.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem fidelização. Cancela a qualquer momento e mantém o acesso até ao fim do período já pago.",
  },
  {
    q: "Em que idiomas está disponível?",
    a: "Português de Portugal e espanhol, tanto para o escritório como para os clientes que recebem os links.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Herói */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Para escritórios de contabilidade · PT · ES
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Deixe de perseguir <span className="text-gold-gradient">documentos em falta</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Peça os documentos do mês por link, veja num só painel quem já entregou e quem não, e envie o lembrete
            por WhatsApp sem reescrever a lista de cada vez.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/registar"
              className="rounded-xl bg-gold px-6 py-3.5 font-semibold text-ink transition hover:brightness-110"
            >
              Testar {site.trialDays} dias grátis
            </Link>
            <span className="text-sm text-muted">Sem cartão. Cancele quando quiser.</span>
          </div>

          {/* Pré-visualização do painel */}
          <div className="mt-14 overflow-hidden rounded-2xl border border-line bg-ink-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-3 text-sm">
              <span className="font-medium">Outubro de 2026</span>
              <span className="text-muted">2 de 4 clientes completos</span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((r) => {
                const complete = r.done === r.total;
                return (
                  <li key={r.name} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[1.2fr_2fr_auto]">
                    <span className="font-medium">{r.name}</span>
                    <div className="col-span-2 order-last sm:order-none sm:col-span-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink-3">
                        <div
                          className={complete ? "h-full bg-ok" : "h-full bg-gold"}
                          style={{ width: `${(r.done / r.total) * 100}%` }}
                        />
                      </div>
                      <span className="mt-1.5 block text-xs text-muted">
                        {r.done} de {r.total} documentos
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        complete ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"
                      }`}
                    >
                      {complete ? "Completo" : "Incompleto"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-3 text-xs text-muted">Exemplo ilustrativo com dados fictícios.</p>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="border-t border-line/70 bg-ink-2/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Três passos. Nada para aprender.</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.title} className="rounded-2xl border border-line bg-ink p-6">
                  <div className="flex items-center justify-between">
                    <s.icon className="h-6 w-6 text-gold" aria-hidden />
                    <span className="font-display text-sm text-muted">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-muted">{s.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 flex items-start gap-2 text-sm text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              Não substitui o seu programa de contabilidade nem recebe ficheiros: só organiza e acompanha a recolha.
            </p>
          </div>
        </section>

        {/* Preços */}
        <section id="precos" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Preço simples, por escritório</h2>
          <p className="mt-3 text-muted">
            Comece com {site.trialDays} dias grátis. Os preços são mensais, em euros, e o IVA aplica-se quando devido.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {Object.values(site.plans).map((p) => (
              <div
                key={p.key}
                className={`rounded-2xl border p-7 ${p.key === "office" ? "border-gold/60 bg-ink-2" : "border-line bg-ink"}`}
              >
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-semibold">{p.priceEur} €</span>
                  <span className="text-muted">/mês</span>
                </p>
                <p className="mt-2 text-sm text-muted">Até {p.clientLimit} clientes</p>
                <ul className="mt-6 space-y-2.5 text-[15px]">
                  {[
                    "Pedidos mensais ilimitados",
                    "Link privado para cada cliente",
                    "Painel de pendentes",
                    "Lembretes por WhatsApp",
                    "Português e espanhol",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-gold" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registar"
                  className={`mt-8 block rounded-xl px-5 py-3 text-center font-semibold transition ${
                    p.key === "office"
                      ? "bg-gold text-ink hover:brightness-110"
                      : "border border-line hover:border-gold/60"
                  }`}
                >
                  Testar {site.trialDays} dias grátis
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-line/70">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Perguntas frequentes</h2>
            <div className="mt-8 divide-y divide-line border-y border-line">
              {faq.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {f.q}
                    <span className="text-gold transition group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-3 leading-7 text-muted">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">
              Outra dúvida? Escreva-nos para <a className="text-gold hover:underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
