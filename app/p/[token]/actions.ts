"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET, MAX_BYTES, MAX_FILES_PER_BATCH, MAX_FILES_PER_REQUEST, cleanName, fileKind, isSha, isUuid, requestByToken, storagePath, storedSize } from "@/lib/documents";
import { classifyDocuments } from "@/lib/classify";

type Via = "whatsapp" | "email" | "other";

// O cliente assinala (ou anula) um documento como enviado, dizendo por onde o enviou.
// A função na base de dados valida o token, só mexe em documentos desse pedido
// e nunca altera o que o escritório já marcou como recebido.
export async function markSent(token: string, itemId: string, sent: boolean, via: Via | null): Promise<"pending" | "sent" | null> {
  // Links curtos (12 caracteres) e antigos (32)
  if (typeof token !== "string" || (token.length !== 12 && token.length !== 32) || !/^[0-9a-f-]{36}$/i.test(itemId)) return null;
  const channel = via === "whatsapp" || via === "email" || via === "other" ? via : null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_public_item_sent", {
    p_token: token,
    p_item_id: itemId,
    p_sent: !!sent,
    p_via: sent ? channel : null,
  });
  if (error) return null;
  return data === "sent" || data === "pending" ? data : null;
}

/* ---------- Envio de ficheiros pela página do pedido ---------- */

export type UploadIn = { name: string; size: number; sha256: string };
export type UploadSlot =
  | { status: "ok"; docId: string; path: string; uploadToken: string; mime: string }
  | { status: "type" | "size" | "duplicate" | "limit" };
export type UploadDone = { docId: string; name: string; sha256: string };

async function itemOf(requestId: string, itemId: string | null) {
  if (itemId === null) return true;
  if (!isUuid(itemId)) return false;
  const { data } = await createAdminClient().from("request_items").select("id").eq("id", itemId).eq("request_id", requestId).maybeSingle();
  return !!data;
}

// 1.º passo: o servidor valida cada ficheiro e devolve uma autorização de envio para um caminho escolhido por ele.
// O ficheiro segue do telemóvel diretamente para o armazenamento privado (não passa pelo nosso servidor).
export async function startUpload(token: string, files: UploadIn[], itemId: string | null): Promise<UploadSlot[] | null> {
  const req = await requestByToken(token);
  if (!req || !Array.isArray(files) || files.length === 0 || files.length > MAX_FILES_PER_BATCH) return null;
  if (!(await itemOf(req.id, itemId))) return null;
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { count } = await admin.from("documents").select("id", { count: "exact", head: true }).eq("request_id", req.id).gt("expires_at", now);
  let room = MAX_FILES_PER_REQUEST - (count ?? 0);

  const shas = files.map((f) => f?.sha256).filter(isSha);
  const seen = new Set<string>();
  if (shas.length) {
    const { data } = await admin.from("documents").select("sha256").eq("request_id", req.id).in("sha256", shas).gt("expires_at", now);
    (data ?? []).forEach((d) => seen.add(d.sha256 as string));
  }

  const out: UploadSlot[] = [];
  for (const f of files) {
    const kind = f && typeof f.name === "string" ? fileKind(f.name) : null;
    if (!kind) { out.push({ status: "type" }); continue; }
    if (typeof f.size !== "number" || f.size <= 0 || f.size > MAX_BYTES) { out.push({ status: "size" }); continue; }
    if (!isSha(f.sha256) || seen.has(f.sha256)) { out.push({ status: "duplicate" }); continue; }
    if (room <= 0) { out.push({ status: "limit" }); continue; }
    const docId = crypto.randomUUID();
    const path = storagePath(req.office_id, req.id, docId, kind.ext);
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) { out.push({ status: "limit" }); continue; }
    seen.add(f.sha256);
    room -= 1;
    out.push({ status: "ok", docId, path, uploadToken: data.token, mime: kind.mime });
  }
  return out;
}

// 2.º passo: confirma no armazenamento o que chegou e cria as fichas. Se o cliente enviou a partir de um documento
// da lista, esse documento fica logo «Recebido». Sem documento escolhido, a IA arruma depois de responder.
export async function finishUpload(token: string, done: UploadDone[], itemId: string | null): Promise<{ saved: number } | null> {
  const req = await requestByToken(token);
  if (!req || !Array.isArray(done) || done.length === 0 || done.length > MAX_FILES_PER_BATCH) return null;
  if (!(await itemOf(req.id, itemId))) return null;
  const admin = createAdminClient();

  const saved: string[] = [];
  for (const f of done) {
    if (!f || !isUuid(f.docId) || !isSha(f.sha256) || typeof f.name !== "string") continue;
    const kind = fileKind(f.name);
    if (!kind) continue;
    const path = storagePath(req.office_id, req.id, f.docId, kind.ext);
    const size = await storedSize(path);
    if (!size || size > MAX_BYTES) continue;
    const { error } = await admin.from("documents").insert({
      id: f.docId,
      office_id: req.office_id,
      request_id: req.id,
      item_id: itemId,
      channel: "page",
      added_by: "client",
      filename: cleanName(f.name),
      mime: kind.mime,
      size_bytes: size,
      sha256: f.sha256,
      storage_path: path,
      state: itemId ? "filed" : "review",
      filed_by: itemId ? "client" : null,
    });
    if (error) {
      // Duplicado (o mesmo ficheiro enviado duas vezes ao mesmo tempo): não deixa nada órfão no armazenamento
      await admin.storage.from(BUCKET).remove([path]);
      continue;
    }
    saved.push(f.docId);
  }

  if (itemId && saved.length) {
    await admin.from("request_items").update({ status: "received", sent_via: "page" }).eq("id", itemId).eq("request_id", req.id).neq("status", "received");
  }
  if (!itemId && saved.length) after(() => classifyDocuments(saved));
  return { saved: saved.length };
}
