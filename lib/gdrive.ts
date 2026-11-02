import "server-only";
// Google Drive do escritório: o Bilonai copia para lá os documentos já arrumados, numa pasta «Bilonai»:
//   Bilonai / Cliente / 2026-09 / Extratos bancários / ficheiro.pdf
// Permissão pedida: drive.file (só os ficheiros e pastas que o próprio Bilonai cria; não vê o resto do Drive).
// Precisa de GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e INTEGRATIONS_KEY.
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET } from "@/lib/documents";
import { open, seal } from "@/lib/secret-box";

export const SCOPES = "openid email https://www.googleapis.com/auth/drive.file";
const FOLDER = "application/vnd.google-apps.folder";
const API = "https://www.googleapis.com/drive/v3";

export function driveReady(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.INTEGRATIONS_KEY);
}

export function authUrl(redirectUri: string, state: string, loginHint?: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    ...(loginHint ? { login_hint: loginHint } : {}),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

type Tokens = { access_token: string; refresh_token?: string; id_token?: string; scope?: string };

async function tokenCall(body: Record<string, string>): Promise<Tokens | { error: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, ...body }),
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => ({}))) as Tokens & { error?: string };
  return res.ok && json.access_token ? json : { error: json.error ?? String(res.status) };
}

export async function exchangeCode(code: string, redirectUri: string) {
  return tokenCall({ code, grant_type: "authorization_code", redirect_uri: redirectUri });
}

// E-mail da conta Google (do id_token, sem chamada extra)
export function emailFromIdToken(idToken?: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from((idToken ?? "").split(".")[1] ?? "", "base64url").toString("utf8")) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
}

export async function revoke(refreshToken: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: "POST", signal: AbortSignal.timeout(10000) }).catch(() => null);
}

async function drive(token: string, path: string, init?: RequestInit) {
  const res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(30000),
  });
  return res;
}

export async function createFolder(token: string, name: string, parent?: string): Promise<string | null> {
  const res = await drive(token, "/files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER, ...(parent ? { parents: [parent] } : {}) }),
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string };
  return json.id ?? null;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
// Nomes de pastas sem barras (o Drive aceita, mas confunde quem lê o caminho)
const clean = (s: string) => s.replace(/[\/\\]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120) || "—";

async function findOrCreate(token: string, name: string, parent: string, cache: Map<string, string>): Promise<string | null> {
  const key = `${parent}/${name}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const q = `name='${esc(name)}' and '${parent}' in parents and mimeType='${FOLDER}' and trashed=false`;
  const res = await drive(token, `/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1&spaces=drive`);
  const json = (await res.json().catch(() => ({}))) as { files?: { id: string }[] };
  const id = json.files?.[0]?.id ?? (await createFolder(token, name, parent));
  if (id) cache.set(key, id);
  return id;
}

async function rootAlive(token: string, id: string | null): Promise<boolean> {
  if (!id) return false;
  const res = await drive(token, `/files/${id}?fields=id,trashed`);
  if (!res.ok) return false;
  const json = (await res.json().catch(() => ({}))) as { trashed?: boolean };
  return !json.trashed;
}

async function upload(token: string, name: string, mime: string, parent: string, bytes: ArrayBuffer): Promise<string | null> {
  const start = await drive(token, "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": mime || "application/octet-stream" },
    body: JSON.stringify({ name, parents: [parent] }),
  });
  const location = start.headers.get("location");
  if (!start.ok || !location) return null;
  const put = await drive(token, location, { method: "PUT", headers: { "Content-Type": mime || "application/octet-stream" }, body: bytes });
  const json = (await put.json().catch(() => ({}))) as { id?: string };
  return put.ok ? json.id ?? null : null;
}

export async function deleteFile(token: string, id: string) {
  await drive(token, `/files/${id}`, { method: "DELETE" }).catch(() => null);
}

type Integration = { office_id: string; refresh_token_enc: string | null; root_folder_id: string | null; auto_sync: boolean; status: string };

// Token de acesso novo a partir do guardado. Em modo de teste do Google, a ligação caduca ao fim de 7 dias.
async function accessFor(i: Integration): Promise<string | null> {
  const refresh = i.refresh_token_enc ? open(i.refresh_token_enc) : null;
  if (!refresh) return null;
  const t = await tokenCall({ refresh_token: refresh, grant_type: "refresh_token" });
  if ("error" in t) {
    if (t.error === "invalid_grant") await createAdminClient().from("office_integrations").update({ status: "expired" }).eq("office_id", i.office_id).eq("provider", "gdrive");
    return null;
  }
  return t.access_token;
}

export async function saveConnection(officeId: string, userId: string, tokens: Tokens) {
  const email = emailFromIdToken(tokens.id_token);
  const root = await createFolder(tokens.access_token, "Bilonai");
  return createAdminClient()
    .from("office_integrations")
    .upsert({
      office_id: officeId,
      provider: "gdrive",
      account_email: email,
      refresh_token_enc: tokens.refresh_token ? seal(tokens.refresh_token) : null,
      root_folder_id: root,
      auto_sync: true,
      status: "active",
      connected_by: userId,
      connected_at: new Date().toISOString(),
      lock_until: null,
    });
}

type PendingDoc = {
  id: string;
  filename: string;
  mime: string;
  storage_path: string;
  clients: { name: string } | null;
  requests: { period: string; months: number | null } | null;
  request_items: { label: string } | null;
};

// Copia para o Drive os documentos arrumados que ainda lá não estão (no máximo `limit` por vez).
// Devolve quantos copiou e quantos faltam. Só um envio de cada vez por escritório.
export async function syncOffice(officeId: string, opts: { limit?: number; retry?: boolean } = {}): Promise<{ sent: number; left: number; failed: number } | null> {
  if (!driveReady()) return null;
  const admin = createAdminClient();
  const now = new Date();
  const { data: claimed } = await admin
    .from("office_integrations")
    .update({ lock_until: new Date(now.getTime() + 90_000).toISOString() })
    .eq("office_id", officeId)
    .eq("provider", "gdrive")
    .eq("status", "active")
    .or(`lock_until.is.null,lock_until.lt.${now.toISOString()}`)
    .select("office_id, refresh_token_enc, root_folder_id, auto_sync, status")
    .maybeSingle();
  const i = claimed as Integration | null;
  if (!i) return null;
  const release = () => admin.from("office_integrations").update({ lock_until: null, last_sync_at: new Date().toISOString() }).eq("office_id", officeId).eq("provider", "gdrive");
  try {
    const token = await accessFor(i);
    if (!token) return null;
    // A pasta «Bilonai» pode ter sido apagada no Drive: cria outra
    let root = i.root_folder_id;
    if (!(await rootAlive(token, root))) {
      root = await createFolder(token, "Bilonai");
      if (!root) return null;
      await admin.from("office_integrations").update({ root_folder_id: root }).eq("office_id", officeId).eq("provider", "gdrive");
      await admin.from("documents").update({ drive_file_id: null, drive_synced_at: null }).eq("office_id", officeId).not("drive_file_id", "is", null);
    }
    if (opts.retry) await admin.from("documents").update({ drive_error: null }).eq("office_id", officeId).not("drive_error", "is", null);

    const base = () =>
      admin
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("office_id", officeId)
        .eq("state", "filed")
        .is("drive_file_id", null)
        .is("drive_error", null)
        .gt("expires_at", new Date().toISOString());
    const { data } = await admin
      .from("documents")
      .select("id, filename, mime, storage_path, clients(name), requests(period, months), request_items(label)")
      .eq("office_id", officeId)
      .eq("state", "filed")
      .is("drive_file_id", null)
      .is("drive_error", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(opts.limit ?? 12);
    const docs = (data ?? []) as unknown as PendingDoc[];
    const cache = new Map<string, string>();
    let sent = 0;
    let failed = 0;
    for (const d of docs) {
      try {
        const client = await findOrCreate(token, clean(d.clients?.name ?? "Sem cliente"), root!, cache);
        const period = d.requests?.period ? d.requests.period.slice(0, 7) : "Sem período";
        const month = client && (await findOrCreate(token, period, client, cache));
        const item = month && (await findOrCreate(token, clean(d.request_items?.label ?? "Outros"), month, cache));
        if (!item) throw new Error("pasta");
        const file = await admin.storage.from(BUCKET).download(d.storage_path);
        if (file.error || !file.data) throw new Error("ficheiro");
        const id = await upload(token, d.filename, d.mime, item, await file.data.arrayBuffer());
        if (!id) throw new Error("envio");
        await admin.from("documents").update({ drive_file_id: id, drive_synced_at: new Date().toISOString() }).eq("id", d.id);
        sent += 1;
      } catch (e) {
        failed += 1;
        await admin.from("documents").update({ drive_error: e instanceof Error ? e.message.slice(0, 100) : "erro" }).eq("id", d.id);
      }
    }
    const { count } = await base();
    return { sent, left: count ?? 0, failed };
  } finally {
    await release();
  }
}

// Envio automático (depois de chegar ou ser arrumado um ficheiro), se o escritório o tiver ligado
export async function autoSyncDrive(officeId: string) {
  if (!driveReady()) return;
  const { data } = await createAdminClient().from("office_integrations").select("auto_sync, status").eq("office_id", officeId).eq("provider", "gdrive").maybeSingle();
  if (!data || !data.auto_sync || data.status !== "active") return;
  await syncOffice(officeId, { limit: 20 }).catch(() => null);
}

// Ficheiro mudado de documento: sai da pasta antiga e volta a ser copiado para a nova
export async function refileInDrive(officeId: string, docId: string) {
  const admin = createAdminClient();
  const { data: doc } = await admin.from("documents").select("drive_file_id").eq("id", docId).maybeSingle();
  const old = (doc as { drive_file_id: string | null } | null)?.drive_file_id;
  if (old) {
    const { data: i } = await admin.from("office_integrations").select("office_id, refresh_token_enc, root_folder_id, auto_sync, status").eq("office_id", officeId).eq("provider", "gdrive").maybeSingle();
    const token = i && i.status === "active" ? await accessFor(i as Integration) : null;
    if (token) await deleteFile(token, old);
    await admin.from("documents").update({ drive_file_id: null, drive_synced_at: null, drive_error: null }).eq("id", docId);
  }
  await autoSyncDrive(officeId);
}
