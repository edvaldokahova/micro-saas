# Bilonai Entrega

Micro SaaS da **A Bilonai Group** para escritórios de contabilidade em Portugal e Espanha: pedir os documentos do mês por link, ver quem ainda não entregou e enviar lembretes por WhatsApp.

- Produção: `https://entrega.bilonai.com`
- Stack: Next.js 15 (App Router) · Tailwind CSS 4 · Lucide · Supabase (eu-west-1) · Vercel · Paddle (assinaturas, Merchant of Record) · Resend
- Idiomas: `pt-PT`, `es-ES`, `pt-BR` (textos em `lib/dictionaries/`). Preços: euros (PT, ES) e reais no Brasil (R$ 49 / R$ 79), configurados na Paddle como preço por país (BR, BRL) no mesmo produto.

## Estrutura
- `app/` — páginas (público, `/app` privado, `/p/[token]` página do cliente)
- `lib/supabase/` — clientes `client` (navegador), `server` (sessão), `admin` (só servidor)
- `lib/site.ts` — marca, planos e dados legais (fonte única)
- `lib/i18n.ts` — textos PT/ES

## Base de dados (Supabase `Micro-SaaS`)
Migração `entrega_core_schema`: `offices`, `clients`, `document_types`, `requests`, `request_items`, `billing_events`, vista `requests_overview`.
O cliente final nunca toca nas tabelas: usa só `get_public_request(token)` e `set_public_item_sent(token, item, bool)`.

## Variáveis de ambiente
Ver `.env.example`. A `SUPABASE_SECRET_KEY` e o `PADDLE_WEBHOOK_SECRET` vivem só na Vercel.

## Pagamentos (Paddle)
- Checkout: `/app/assinatura` cria a transação no servidor (`custom_data.office_id`) e abre o overlay do Paddle.js.
- Webhook: `POST /api/webhooks/paddle` — verifica `Paddle-Signature`, grava em `billing_events` (idempotente por `event_id`), ignora eventos fora de ordem (`offices.paddle_event_at`) e nunca deixa uma 2.ª assinatura sobrepor uma ativa.
- Eventos a subscrever na Paddle: `transaction.completed`, `subscription.created`, `subscription.updated`, `subscription.activated`, `subscription.past_due`, `subscription.paused`, `subscription.resumed`, `subscription.canceled`.
- Default payment link na Paddle: `https://entrega.bilonai.com/pagamento`.
- Sandbox por defeito (token e preços públicos em `lib/paddle/config.ts`); produção via variáveis `NEXT_PUBLIC_PADDLE_*`.
