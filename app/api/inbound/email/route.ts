import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { after, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET, MAX_BYTES, MAX_FILES_PER_REQUEST, cleanName, fileKind, storagePath } from "@/lib/documents";
import { classifyDocuments } from "@/lib/classify";
import { addressOf, inboundDomain } from "@/lib/inbound";

// E-mails recebidos no domínio de recolha (aviso do Resend «email.received»).
// O cliente responde ao lembrete (ou envia pelo botão da página) como sempre; o escritório recebe o e-mail
// e nós recebemos uma cópia: guardamos os anexos, identificamos o pedido e a IA arruma cada ficheiro.

export const runtime = "nodejs";
export const maxDuration = 60;

const API = "https://api.resend.com";

// Assinatura do aviso (Svix): HMAC-SHA256 de "id.timestamp.corpo" com o segredo do webhook
function verified(body: string, h: Headers, secret: string): boolean {
  const id = h.get("svix-id");
  const ts = h.get("svix-timestamp");
  const sig = h.get("svix-signature");
  if (!id || !ts || !sig || !/^\d+$/.test(ts)) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64"));
  return sig.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

async function resend<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${process.env.RESEND_INBOUND_KEY}` }, signal: AbortSignal.timeout(15000) });
  return res.ok ? ((await res.json()) as T) : null;
}

type Received = { id: string; from: string; to?: string[]; cc?: string[]; bcc?: string[]; subject?: string };
type Attachment = { id: string; filename?: string | null; size?: number | null; content_type?: string; content_disposition?: string | null; content_id?: string | null; download_url?: string };

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const domain = inboundDomain();
  if (!secret || !domain || !process.env.RESEND_INBOUND_KEY) return NextResponse.json({ ok: false }, { status: 503 });

  const body = await request.text();
  if (!verified(body, request.headers, secret)) return NextResponse.json({ ok: false }, { status: 401 });
  let event: { type?: string; data?: { email_id?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const emailId = event.data?.email_id;
  if (event.type !== "email.received" || typeof emailId !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(emailId)) return NextResponse.json({ ok: true });

  // Os dados vêm sempre da API do Resend (não do corpo do aviso)
  const mail = await resend<Received>(`/emails/receiving/${emailId}`);
  if (!mail) return NextResponse.json({ ok: false }, { status: 502 });
  const sender = addressOf(mail.from);
  // Nunca processar e-mails enviados por nós próprios (evita voltas)
  if (!sender || sender.endsWith("@mail.bilonai.com") || sender.endsWith(`@${domain}`)) return NextResponse.json({ ok: true });

  const locals = [...(mail.to ?? []), ...(mail.cc ?? []), ...(mail.bcc ?? [])]
    .map(addressOf)
    .filter((a): a is string => !!a && a.endsWith(`@${domain}`))
    .map((a) => a.slice(0, -(domain.length + 1)));
  if (!locals.length) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  // 1) Endereço do pedido  2) Endereço do escritório + remetente que é cliente desse escritório
  let officeId: string | null = null;
  let requestId: string | null = null;
  let clientId: string | null = null;
  const { data: req } = await admin.from("requests").select("id, office_id, client_id").in("inbox_code", locals).limit(1).maybeSingle();
  if (req) {
    officeId = req.office_id;
    requestId = req.id;
    clientId = req.client_id;
  } else {
    const { data: office } = await admin.from("offices").select("id").in("inbox_key", locals).limit(1).maybeSingle();
    if (!office) return NextResponse.json({ ok: true });
    officeId = office.id;
    const { data: client } = await admin.from("clients").select("id").eq("office_id", office.id).is("archived_at", null).ilike("email", sender.replace(/[%_\\]/g, "\\$&")).limit(1).maybeSingle();
    // Só clientes registados: e-mails de outras pessoas reencaminhados por regra não são guardados
    if (!client) return NextResponse.json({ ok: true });
    {
      clientId = client.id;
      const { data: open } = await admin
        .from("requests")
        .select("id")
        .eq("client_id", client.id)
        .is("closed_at", null)
        .order("period", { ascending: false })
        .limit(1)
        .maybeSingle();
      requestId = open?.id ?? null;
    }
  }

  if (!officeId) return NextResponse.json({ ok: true });
  const list = await resend<{ data?: Attachment[] }>(`/emails/receiving/${emailId}/attachments`);
  const files = (list?.data ?? []).filter((a) => {
    const kind = a.filename ? fileKind(a.filename) : null;
    if (!kind || !a.download_url || (a.size ?? 0) > MAX_BYTES) return false;
    // Logótipos e imagens da assinatura do e-mail (incorporados no texto) ficam de fora
    const inline = a.content_disposition === "inline" || !!a.content_id;
    return !(inline && kind.mime.startsWith("image/") && (a.size ?? 0) < 60 * 1024);
  });

  // Limite de ficheiros por pedido (o mesmo da página)
  let room = MAX_FILES_PER_REQUEST;
  if (requestId) {
    const { count } = await admin.from("documents").select("id", { count: "exact", head: true }).eq("request_id", requestId).gt("expires_at", new Date().toISOString());
    room -= count ?? 0;
  }

  const saved: string[] = [];
  for (const a of files.slice(0, 20)) {
    if (room <= 0) break;
    try {
      const res = await fetch(a.download_url!, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const data = new Uint8Array(await res.arrayBuffer());
      if (!data.length || data.length > MAX_BYTES) continue;
      const kind = fileKind(a.filename!)!;
      const docId = crypto.randomUUID();
      const path = storagePath(officeId, requestId, docId, kind.ext);
      const up = await admin.storage.from(BUCKET).upload(path, data, { contentType: kind.mime, upsert: false });
      if (up.error) continue;
      const { error } = await admin.from("documents").insert({
        id: docId,
        office_id: officeId,
        client_id: clientId,
        request_id: requestId,
        channel: "email",
        added_by: "email",
        sender: sender.slice(0, 254),
        subject: (mail.subject ?? "").slice(0, 300) || null,
        filename: cleanName(a.filename!),
        mime: kind.mime,
        size_bytes: data.length,
        sha256: createHash("sha256").update(data).digest("hex"),
        storage_path: path,
        state: "review",
      });
      if (error) {
        // Repetido (o Resend volta a avisar, ou o mesmo anexo chegou duas vezes): não fica nada órfão
        await admin.storage.from(BUCKET).remove([path]);
        continue;
      }
      saved.push(docId);
      room -= 1;
    } catch (e) {
      console.error("inbound attachment", e instanceof Error ? e.message : e);
    }
  }

  if (saved.length && requestId) after(() => classifyDocuments(saved));
  return NextResponse.json({ ok: true, saved: saved.length });
}
