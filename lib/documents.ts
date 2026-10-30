import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
export { ACCEPT, fileKind } from "@/lib/file-types";

// Ficheiros recebidos: regras comuns a todos os canais (página do cliente, painel, e-mail).
// O ficheiro vive no armazenamento privado «documents»; na base de dados fica só a ficha.

export const BUCKET = "documents";
export const MAX_BYTES = 25 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 80;
export const MAX_FILES_PER_BATCH = 20;

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
  const { data } = await admin
    .from("requests")
    .select("id, office_id, client_id, closed_at")
    .eq("token", token)
    .maybeSingle();
  if (!data || data.closed_at) return null;
  return data as { id: string; office_id: string; client_id: string; closed_at: string | null };
}

// Confirma que o ficheiro chegou ao armazenamento e devolve o tamanho real
export async function storedSize(path: string): Promise<number | null> {
  const admin = createAdminClient();
  const slash = path.lastIndexOf("/");
  const { data, error } = await admin.storage.from(BUCKET).list(path.slice(0, slash), { search: path.slice(slash + 1), limit: 2 });
  if (error || !data) return null;
  const f = data.find((o) => o.name === path.slice(slash + 1));
  const size = (f?.metadata as { size?: number } | undefined)?.size;
  return typeof size === "number" ? size : null;
}

// Link temporário (5 minutos) para ver ou descarregar um ficheiro
export async function signedUrl(path: string, download?: string) {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, 300, download ? { download } : undefined);
  return data?.signedUrl ?? null;
}
