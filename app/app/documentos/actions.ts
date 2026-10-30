"use server";

import { after } from "next/server";
import { getSession } from "@/lib/office";
import { classifyDocuments } from "@/lib/classify";
import { isUuid, itemInRequest, prepareSlots, registerUploads, removeStored, signedUrl, type DoneFile, type InFile, type Slot } from "@/lib/documents";

// Ações do escritório sobre os ficheiros recebidos. Tudo passa primeiro pela sessão e pela RLS:
// só se mexe em pedidos e ficheiros que este utilizador pode ver.

async function ownRequest(requestId: string) {
  if (!isUuid(requestId)) return null;
  const { supabase, office } = await getSession();
  const { data } = await supabase.from("requests").select("id, office_id").eq("id", requestId).maybeSingle();
  const r = data as { id: string; office_id: string } | null;
  return r && r.office_id === office.id ? r : null;
}

/* ---------- Ficheiros que o escritório recebeu noutro lado (ex.: WhatsApp) ---------- */

export async function startOfficeUpload(requestId: string, files: InFile[], itemId: string | null): Promise<Slot[] | null> {
  const r = await ownRequest(requestId);
  if (!r || !(await itemInRequest(r.id, itemId))) return null;
  return prepareSlots(r.office_id, r.id, files);
}

export async function finishOfficeUpload(requestId: string, done: DoneFile[], itemId: string | null): Promise<{ saved: number } | null> {
  const r = await ownRequest(requestId);
  if (!r || !(await itemInRequest(r.id, itemId))) return null;
  const saved = await registerUploads({ officeId: r.office_id, requestId: r.id, itemId, done, channel: "whatsapp", addedBy: "office" });
  if (!itemId && saved.length) after(() => classifyDocuments(saved));
  return { saved: saved.length };
}

/* ---------- Arrumar, mover e apagar ---------- */

type DocRow = { id: string; request_id: string | null; item_id: string | null; channel: string; filed_by: string | null; storage_path: string };

async function docOf(docId: string) {
  if (!isUuid(docId)) return null;
  const { supabase } = await getSession();
  const { data } = await supabase.from("documents").select("id, request_id, item_id, channel, filed_by, storage_path").eq("id", docId).maybeSingle();
  return data as DocRow | null;
}

// Se o documento do pedido só estava «Recebido» por causa deste ficheiro (arrumado automaticamente) e já não tem
// nenhum, volta a «Em falta». O que o escritório marcou à mão não se toca.
async function releaseItem(itemId: string | null, doc: DocRow) {
  if (!itemId || (doc.filed_by !== "ai" && doc.filed_by !== "client")) return;
  const { supabase } = await getSession();
  const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("item_id", itemId);
  if (count === 0) await supabase.from("request_items").update({ status: "pending", sent_via: null, client_marked_at: null }).eq("id", itemId).eq("status", "received");
}

// Arruma (ou muda) um ficheiro num documento do mesmo pedido; esse documento passa a «Recebido»
export async function fileDocument(docId: string, itemId: string): Promise<boolean> {
  const doc = await docOf(docId);
  if (!doc || !doc.request_id || !isUuid(itemId) || doc.item_id === itemId) return !!doc && doc.item_id === itemId;
  const { supabase } = await getSession();
  const { data: item } = await supabase.from("request_items").select("id").eq("id", itemId).eq("request_id", doc.request_id).maybeSingle();
  if (!item) return false;
  const { error } = await supabase.from("documents").update({ item_id: itemId, state: "filed", filed_by: "office" }).eq("id", doc.id);
  if (error) return false;
  const via = doc.channel === "page" || doc.channel === "email" || doc.channel === "whatsapp" ? doc.channel : "other";
  await supabase.from("request_items").update({ status: "received", sent_via: via }).eq("id", itemId).neq("status", "received");
  await releaseItem(doc.item_id, doc);
  return true;
}

export async function deleteDocument(docId: string): Promise<boolean> {
  const doc = await docOf(docId);
  if (!doc) return false;
  const { supabase } = await getSession();
  const { data } = await supabase.from("documents").delete().eq("id", doc.id).select("id");
  if (!data?.length) return false;
  await removeStored([doc.storage_path]);
  await releaseItem(doc.item_id, doc);
  return true;
}

// Links temporários para descarregar vários ficheiros de uma vez (o ZIP é montado no navegador)
export async function docLinks(ids: string[]): Promise<{ name: string; url: string }[]> {
  if (!Array.isArray(ids) || !ids.length || ids.length > 300 || !ids.every(isUuid)) return [];
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("documents")
    .select("id, filename, storage_path, clients(name), request_items(label)")
    .in("id", ids)
    .gt("expires_at", new Date().toISOString());
  const rows = (data ?? []) as unknown as { filename: string; storage_path: string; clients: { name: string } | null; request_items: { label: string } | null }[];
  const out: { name: string; url: string }[] = [];
  for (const d of rows) {
    const url = await signedUrl(d.storage_path);
    if (!url) continue;
    const folder = [d.clients?.name, d.request_items?.label].filter(Boolean).map((s) => s!.replace(/[\\/:*?"<>|]+/g, "-").trim()).join("/");
    out.push({ name: folder ? `${folder}/${d.filename}` : d.filename, url });
  }
  return out;
}
