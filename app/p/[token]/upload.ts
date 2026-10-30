// Envio de ficheiros a partir da página do pedido (corre no navegador do cliente).
// 1) o servidor autoriza cada ficheiro; 2) o ficheiro segue diretamente para o armazenamento privado;
// 3) o servidor confirma o que chegou e cria as fichas.
import { createClient } from "@/lib/supabase/client";
import { finishUpload, startUpload, type UploadDone } from "./actions";

export type UploadIssue = { name: string; reason: "type" | "size" | "duplicate" | "limit" | "failed" };
export type UploadResult = { saved: number; issues: UploadIssue[] };

const BATCH = 20;

async function sha256(file: File): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadFiles(token: string, list: File[], itemId: string | null, onProgress?: (done: number, total: number) => void): Promise<UploadResult> {
  const supabase = createClient();
  const issues: UploadIssue[] = [];
  let saved = 0;
  let done = 0;
  onProgress?.(0, list.length);

  for (let i = 0; i < list.length; i += BATCH) {
    const files = list.slice(i, i + BATCH);
    let shas: string[];
    try {
      shas = await Promise.all(files.map(sha256));
    } catch {
      files.forEach((f) => issues.push({ name: f.name, reason: "failed" }));
      done += files.length;
      onProgress?.(done, list.length);
      continue;
    }
    const slots = await startUpload(token, files.map((f, k) => ({ name: f.name, size: f.size, sha256: shas[k] })), itemId).catch(() => null);
    if (!slots) {
      files.forEach((f) => issues.push({ name: f.name, reason: "failed" }));
      done += files.length;
      onProgress?.(done, list.length);
      continue;
    }

    const ok: UploadDone[] = [];
    await Promise.all(
      files.map(async (f, k) => {
        const slot = slots[k];
        if (!slot || slot.status !== "ok") {
          issues.push({ name: f.name, reason: slot ? slot.status : "failed" });
        } else {
          const { error } = await supabase.storage.from("documents").uploadToSignedUrl(slot.path, slot.uploadToken, f, { contentType: slot.mime });
          if (error) issues.push({ name: f.name, reason: "failed" });
          else ok.push({ docId: slot.docId, name: f.name, sha256: shas[k] });
        }
        done += 1;
        onProgress?.(done, list.length);
      }),
    );

    if (ok.length) {
      const res = await finishUpload(token, ok, itemId).catch(() => null);
      saved += res?.saved ?? 0;
      if (!res) ok.forEach((o) => issues.push({ name: o.name, reason: "failed" }));
    }
  }
  return { saved, issues };
}
