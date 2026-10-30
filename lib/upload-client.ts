// Envio de ficheiros a partir do navegador (página do cliente e painel do escritório).
// 1) o servidor autoriza cada ficheiro; 2) o ficheiro segue diretamente para o armazenamento privado;
// 3) o servidor confirma o que chegou e cria as fichas.
import { createClient } from "@/lib/supabase/client";

export type UploadIssue = { name: string; reason: "type" | "size" | "duplicate" | "limit" | "failed" };
export type UploadResult = { saved: number; issues: UploadIssue[] };

type Slot = { status: "ok"; docId: string; path: string; uploadToken: string; mime: string } | { status: "type" | "size" | "duplicate" | "limit" };
type Done = { docId: string; name: string; sha256: string };
export type UploadApi = {
  start: (files: { name: string; size: number; sha256: string }[]) => Promise<Slot[] | null>;
  finish: (done: Done[]) => Promise<{ saved: number } | null>;
};

const BATCH = 20;

async function sha256(file: File): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadFiles(list: File[], api: UploadApi, onProgress?: (done: number, total: number) => void): Promise<UploadResult> {
  const supabase = createClient();
  const issues: UploadIssue[] = [];
  let saved = 0;
  let done = 0;
  onProgress?.(0, list.length);
  const fail = (files: File[]) => {
    files.forEach((f) => issues.push({ name: f.name, reason: "failed" }));
    done += files.length;
    onProgress?.(done, list.length);
  };

  for (let i = 0; i < list.length; i += BATCH) {
    const files = list.slice(i, i + BATCH);
    let shas: string[];
    try {
      shas = await Promise.all(files.map(sha256));
    } catch {
      fail(files);
      continue;
    }
    const slots = await api.start(files.map((f, k) => ({ name: f.name, size: f.size, sha256: shas[k] }))).catch(() => null);
    if (!slots) {
      fail(files);
      continue;
    }

    const ok: Done[] = [];
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
      const res = await api.finish(ok).catch(() => null);
      saved += res?.saved ?? 0;
      if (!res) ok.forEach((o) => issues.push({ name: o.name, reason: "failed" }));
    }
  }
  return { saved, issues };
}
