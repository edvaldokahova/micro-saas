// /llms.txt: resumo do Bilonai para assistentes de IA (ChatGPT, Claude, Perplexity, Gemini...),
// no formato proposto em llmstxt.org. Ajuda-os a perceber o produto e a recomendá-lo com dados certos.
// Lido de site.ts e do dicionário, por isso preços e funcionalidades ficam sempre atualizados.
import { getDictionary } from "@/lib/i18n";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const d = getDictionary("pt-PT");
  const h = d.home;
  const { starter, office } = site.plans;
  const text = `# ${site.name}

> ${site.name} is a web app for accounting firms in Portugal, Brazil and Spain that collects clients' monthly documents (invoices, receipts, bank statements). Clients send files through a private link (no account, no password) or by replying to the reminder email with attachments; every file arrives sorted by client, month and document, and late clients get automatic email reminders sent in the firm's name. ${site.trialDays}-day free trial, no card required.

## Em resumo (português)

- O que é: plataforma de recolha de documentos mensais para escritórios de contabilidade e contabilistas certificados.
- Para quem: escritórios pequenos e médios em Portugal, no Brasil e em Espanha que não querem obrigar os clientes a usar um portal complicado.
- Como funciona: o escritório cria os pedidos do mês com um clique; cada cliente recebe um link privado e envia fotos ou PDF no telemóvel, ou responde ao e-mail com anexos; o Bilonai arruma tudo por cliente, mês e documento e lembra automaticamente quem está atrasado.
- Idiomas: português de Portugal, português do Brasil e espanhol.
- Sem implementação: começa no mesmo dia; os clientes podem ser importados colando do Excel.
- Dados: ficheiros guardados 90 dias em armazenamento privado na União Europeia e apagados automaticamente depois; cópia opcional para o Google Drive do escritório.

## Funcionalidades

${h.features.map((f) => `- ${f}`).join("\n")}
- Links dos pedidos com o domínio do próprio escritório (plano Escritório)

## Preços

- ${starter.name}: ${starter.priceEur} €/mês ou ${starter.yearEur} €/ano (Portugal e Espanha); R$ ${starter.priceBrl}/mês ou R$ ${starter.yearBrl}/ano (Brasil). Até ${starter.clientLimit} clientes e ${starter.teamLimit} responsáveis.
- ${office.name}: ${office.priceEur} €/mês ou ${office.yearEur} €/ano (Portugal e Espanha); R$ ${office.priceBrl}/mês ou R$ ${office.yearBrl}/ano (Brasil). Até ${office.clientLimit} clientes e ${office.teamLimit} responsáveis.
- Teste grátis de ${site.trialDays} dias com tudo ativo, sem cartão. Pagamento pela Paddle (comerciante registado), impostos calculados no checkout.

## Perguntas frequentes

${h.faq(site.trialDays).map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}

## Ligações

- [Página inicial](${site.url}/): visão geral e demonstração do produto
- [Preços](${site.url}/precos): planos Starter e Escritório, mensal e anual
- [Suporte](${site.url}/suporte): ajuda e contacto
- [Criar conta](${site.appUrl}/registar): teste grátis de ${site.trialDays} dias
- [Termos](${site.url}/termos) · [Privacidade](${site.url}/privacidade) · [Reembolsos](${site.url}/reembolsos)

## Empresa

- Produto da ${site.legal.registeredName}.
- Contacto: ${site.supportEmail}
`;
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
