import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaddleSignature } from "@/lib/paddle/verify";
import { applyPaddleEvent, type PaddleEvent } from "@/lib/paddle/webhook";

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
  } catch (e) {
    console.error("[paddle] aplicar evento", event.event_type, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "apply_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
