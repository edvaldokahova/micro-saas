import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fileKind } from "@/lib/file-types";
export { ACCEPT, fileKind } from "@/lib/file-types";

// Ficheiros recebidos: regras comuns a todos os canais (página do cliente, painel, e-mail).
// O ficheiro vive no armazenamento privado «documents»; na base de dados fica só a ficha.
// Quem chama estas funções já verificou quem é (token do link ou sessão do escritório).

export const BUCKET = "documents";
export const MAX_BYTES = 25 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 80;
export const MAX_FILES_PER_BATCH = 20;

export type InFile = { name: string; size: number; sha256: string };
export type Slot =
  | { status: "ok"; docId: string; path: string; uploadToken: string; mime: string }
  | { status: "type" | "size" | "duplicate" | "limit" };
export type DoneFile = { docId: string; name: string; sha256: string };
export type DocChannel = "page" | "email" | "whatsapp" | "other";

// Nome para mostrar: sem pastas nem caracteres de controlo, até 200 caracteres, mantendo a extensão
export function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "ficheiro";
  // eslint-disable-next-line no-control-regex
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim() || "ficheiro";
  if (clean.length <= 200) return clean;
  const dot = clean.lastIndexOf(".");
  const ext = dot > 0 ? clean.slice(dot) : "";
  return clean.slice(0, 200 - ext.length) + ext;
}

export const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const isSha = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);

// Caminho no armazenamento: gerado sempre aqui, nunca pelo navegador
export function storagePath(officeId: string, requestId: string | null, docId: string, ext: string) {
  return `${officeId}/${requestId ?? "inbox"}/${docId}.${ext}`;
}

// Pedido aberto a partir do link do cliente (só o servidor o lê, com a chave secreta)
export async function requestByToken(token: string) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{12}$|^[A-Za-z0-9_-]{32}$/.test(token)) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("requests").select("id, office_id, client_id, closed_at").eq("token", token).maybeSingle();
  if (!data || data.closed_at) return null;
  return data as { id: string; office_id: string; client_id: string; closed_at: string | null };
}

// O documento pertence a este pedido?
export async function itemInRequest(requestId: string, itemId: string | null) {
  if (itemId === null) return true;
  if (!isUuid(itemId)) return false;
  const { data } = await createAdminClient().from("request_items").select("id").eq("id", itemId).eq("request_id", requestId).maybeSingle();
  return !!data;
}

// Confirma que o ficheiro chegou ao armazenamento e devolve o tamanho real
export async function storedSize(path: string): Promise<number | null> {
  const admin = createAdminClient();
  const slash = path.lastIndexOf("/");
  const { data, error } = await admin.storage.from(BUCKET).list(path.slice(0, slash), { search: path.slice(slash + 1), limit: 2 });
  if (error || !data) return null;
  const f = data.find((o: { name: string }) => o.name === path.slice(slash + 1));
  const size = (f?.metadata as { size?: number } | undefined)?.size;
  return typeof size === "number" ? size : null;
}

// 1.º passo do envio: valida cada ficheiro e devolve uma autorização de envio para um caminho escolhido aqui.
// O ficheiro segue do navegador diretamente para o armazenamento privado (não passa pelo nosso servidor).
export async function prepareSlots(officeId: string, requestId: string, files: InFile[]): Promise<Slot[] | null> {
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILES_PER_BATCH) return null;
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { count } = await admin.from("documents").select("id", { count: "exact", head: true }).eq("request_id", requestId).gt("expires_at", now);
  let room = MAX_FILES_PER_REQUEST - (count ?? 0);

  const shas = files.map((f) => f?.sha256).filter(isSha);
  const seen = new Set<string>();
  if (shas.length) {
    const { data } = await admin.from("documents").select("sha256").eq("request_id", requestId).in("sha256", shas).gt("expires_at", now);
    (data ?? []).forEach((d: { sha256: string }) => seen.add(d.sha256));
  }

  const out: Slot[] = [];
  for (const f of files) {
    const kind = f && typeof f.name === "string" ? fileKind(f.name) : null;
    if (!kind) { out.push({ status: "type" }); continue; }
    if (typeof f.size !== "number" || f.size <= 0 || f.size > MAX_BYTES) { out.push({ status: "size" }); continue; }
    if (!isSha(f.sha256) || seen.has(f.sha256)) { out.push({ status: "duplicate" }); continue; }
    if (room <= 0) { out.push({ status: "limit" }); continue; }
    const docId = crypto.randomUUID();
    const path = storagePath(officeId, requestId, docId, kind.ext);
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) { out.push({ status: "limit" }); continue; }
    seen.add(f.sha256);
    room -= 1;
    out.push({ status: "ok", docId, path, uploadToken: data.token, mime: kind.mime });
  }
  return out;
}

// 2.º passo: confirma no armazenamento o que chegou e cria as fichas. Com documento escolhido, fica logo arrumado
// e o documento do pedido passa a «Recebido». Devolve os ids guardados.
export async function registerUploads(o: {
  officeId: string;
  requestId: string;
  itemId: string | null;
  done: DoneFile[];
  channel: DocChannel;
  addedBy: "client" | "office";
}): Promise<string[]> {
  if (!Array.isArray(o.done) || o.done.length === 0 || o.done.length > MAX_FILES_PER_BATCH) return [];
  const admin = createAdminClient();
  const saved: string[] = [];
  for (const f of o.done) {
    if (!f || !isUuid(f.docId) || !isSha(f.sha256) || typeof f.name !== "string") continue;
    const kind = fileKind(f.name);
    if (!kind) continue;
    const path = storagePath(o.officeId, o.requestId, f.docId, kind.ext);
    const size = await storedSize(path);
    if (!size || size > MAX_BYTES) continue;
    const { error } = await admin.from("documents").insert({
      id: f.docId,
      office_id: o.officeId,
      request_id: o.requestId,
      item_id: o.itemId,
      channel: o.channel,
      added_by: o.addedBy,
      filename: cleanName(f.name),
      mime: kind.mime,
      size_bytes: size,
      sha256: f.sha256,
      storage_path: path,
      state: o.itemId ? "filed" : "review",
      filed_by: o.itemId ? o.addedBy : null,
    });
    if (error) {
      // Duplicado (o mesmo ficheiro enviado duas vezes ao mesmo tempo): não deixa nada órfão no armazenamento
      await admin.storage.from(BUCKET).remove([path]);
      continue;
    }
    saved.push(f.docId);
  }
  if (o.itemId && saved.length) await markReceived(o.itemId, o.channel);
  return saved;
}

// O documento do pedido passa a «Recebido», com o canal por onde chegou (se ainda não estava recebido)
export async function markReceived(itemId: string, channel: DocChannel) {
  await createAdminClient().from("request_items").update({ status: "received", sent_via: channel }).eq("id", itemId).neq("status", "received");
}

// Link temporário (5 minutos) para ver ou descarregar um ficheiro
export async function signedUrl(path: string, download?: string) {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, 300, download ? { download } : undefined);
  return data?.signedUrl ?? null;
}

export async function removeStored(paths: string[]) {
  if (paths.length) await createAdminClient().storage.from(BUCKET).remove(paths);
}
