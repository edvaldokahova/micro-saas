"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { itemInRequest, prepareSlots, registerUploads, requestByToken, type DoneFile, type InFile, type Slot } from "@/lib/documents";
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

/* ---------- Envio de ficheiros pela página do pedido (o link é a autorização) ---------- */

export async function startUpload(token: string, files: InFile[], itemId: string | null): Promise<Slot[] | null> {
  const req = await requestByToken(token);
  if (!req || !(await itemInRequest(req.id, itemId))) return null;
  return prepareSlots(req.office_id, req.id, files);
}

// Com documento escolhido, fica logo «Recebido». Sem documento, a IA arruma depois de responder.
export async function finishUpload(token: string, done: DoneFile[], itemId: string | null): Promise<{ saved: number } | null> {
  const req = await requestByToken(token);
  if (!req || !(await itemInRequest(req.id, itemId))) return null;
  const saved = await registerUploads({ officeId: req.office_id, requestId: req.id, itemId, done, channel: "page", addedBy: "client" });
  if (!itemId && saved.length) after(() => classifyDocuments(saved));
  return { saved: saved.length };
}
