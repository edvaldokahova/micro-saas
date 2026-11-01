import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaddleSignature } from "@/lib/paddle/verify";
import { applyPaddleEvent, type PaddleEvent } from "@/lib/paddle/webhook";
import { utmifyFromPaddle } from "@/lib/utmify";
import { sendCapi } from "@/lib/meta-capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Recebe as notificações da Paddle. Responde 2xx só depois de gravar; um 5xx faz a Paddle tentar de novo.
export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[paddle] PADDLE_WEBHOOK_SECRET em falta");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const raw = await request.text();
  if (!verifyPaddleSignature(raw, request.headers.get("paddle-signature"), secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(raw) as PaddleEvent;
    if (!event?.event_id || !event?.event_type || !event?.data?.id) throw new Error("payload");
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const db = createAdminClient();

  // Idempotência: cada event_id é processado uma só vez
  const { data: existing, error: readError } = await db
    .from("billing_events")
    .select("id, processed_at")
    .eq("provider", "paddle")
    .eq("event_id", event.event_id)
    .maybeSingle();
  if (readError) {
    console.error("[paddle] leitura billing_events", readError.message);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }
  if (existing?.processed_at) return NextResponse.json({ ok: true, duplicate: true });

  if (!existing) {
    const { error: insertError } = await db.from("billing_events").insert({
      provider: "paddle",
      event_id: event.event_id,
      event_type: event.event_type,
      payload: event,
    });
    // 23505 = outro pedido igual entrou ao mesmo tempo; seguimos e o update abaixo é idempotente
    if (insertError && insertError.code !== "23505") {
      console.error("[paddle] gravar evento", insertError.message);
      return NextResponse.json({ error: "db" }, { status: 500 });
    }
  }

  try {
    const officeId = await applyPaddleEvent(db, event);
    await db
      .from("billing_events")
      .update({ processed_at: new Date().toISOString(), office_id: officeId })
      .eq("provider", "paddle")
      .eq("event_id", event.event_id);
    // Venda para a UTMify (se estiver ligada). Nunca faz falhar o webhook: o resultado fica registado.
    const sent = await utmifyFromPaddle(db, event.event_type, event.data, officeId).catch((e) => `erro: ${e instanceof Error ? e.message : "?"}`);
    if (sent) {
      await db.from("billing_events").update({ utmify: sent.slice(0, 300) }).eq("provider", "paddle").eq("event_id", event.event_id);
    }
    // Compra para a API de Conversões da Meta (só se a pessoa aceitou os cookies quando se registou)
    if (event.event_type === "transaction.completed" && officeId) {
      await metaPurchase(db, event.data as unknown as { id: string; details?: { totals?: { total?: string; currency_code?: string } } }, officeId).catch(() => null);
    }
  } catch (e) {
    console.error("[paddle] aplicar evento", event.event_type, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "apply_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function metaPurchase(
  db: ReturnType<typeof createAdminClient>,
  txn: { id: string; details?: { totals?: { total?: string; currency_code?: string } } },
  officeId: string,
) {
  const { data } = await db.from("offices").select("billing_email, country, utm").eq("id", officeId).maybeSingle();
  const o = data as { billing_email: string | null; country: string | null; utm: Record<string, string> | null } | null;
  if (!o || o.utm?.consent !== "yes") return;
  const total = Number(txn.details?.totals?.total ?? 0) / 100;
  await sendCapi({
    event: "Purchase",
    eventId: txn.id,
    email: o.billing_email,
    value: total,
    currency: (txn.details?.totals?.currency_code ?? "EUR").toUpperCase(),
    url: "https://app.bilonai.com/assinatura",
    fbp: o.utm.fbp ?? null,
    fbc: o.utm.fbc ?? null,
    country: o.country && o.country !== "other" ? o.country.toLowerCase() : null,
  });
}
