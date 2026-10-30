"use client";

// Ficheiros recebidos, no painel do escritório: lista (ver, descarregar, arrumar/mover, apagar),
// zona para largar ficheiros que chegaram pelo WhatsApp e «Descarregar tudo» em ZIP.
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChannelIcon, type Channel } from "@/components/channel-icon";
import { Spinner } from "@/components/spinner";
import { ACCEPT } from "@/lib/file-types";
import { uploadFiles, type UploadIssue } from "@/lib/upload-client";
import { makeZip } from "@/lib/zip";
import { deleteDocument, docLinks, fileDocument, finishOfficeUpload, startOfficeUpload } from "@/app/app/documentos/actions";

export type DocView = {
  id: string;
  filename: string;
  size: number;
  channel: Channel;
  date: string; // já formatada
  filedBy: "ai" | "client" | "office" | null;
  itemId: string | null;
};
export type DocTexts = {
  view: string;
  download: string;
  remove: string;
  removeConfirm: string;
  fileTo: string;
  move: string;
  by: { ai: string; client: string; office: string };
  via: Record<Channel, string>;
  error: string;
  zip: string; // "{n}"
  zipping: string;
  drop: string;
  dropHint: string;
  uploading: string; // "{a}" "{b}"
  issue: Record<UploadIssue["reason"], string>; // "{name}"
};

function size(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".0", "")} MB`;
}
const ext = (name: string) => (name.match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? "").toUpperCase().slice(0, 4);

export function DocList({ docs, items, t, review = false }: { docs: DocView[]; items: { id: string; label: string }[]; t: DocTexts; review?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [, start] = useTransition();

  function run(id: string, job: () => Promise<boolean>) {
    setBusy(id);
    setError(false);
    start(async () => {
      const ok = await job().catch(() => false);
      if (!ok) setError(true);
      router.refresh();
      setBusy(null);
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-2 text-[13px] text-bad" role="alert">
          {t.error}
        </p>
      )}
      <ul className="space-y-1.5">
        {docs.map((f) => (
          <li key={f.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-ink-2 px-3 py-2.5 ${busy === f.id ? "opacity-60" : ""}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-3 font-mono text-[9.5px] font-semibold tracking-wide text-muted" aria-hidden>
              {ext(f.filename) || "—"}
            </span>
            <span className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-0">
              <a href={`/ficheiro/${f.id}`} target="_blank" rel="noopener noreferrer" className="block truncate text-[14px] font-medium underline-offset-4 hover:underline" title={f.filename}>
                {f.filename}
              </a>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[10.5px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ChannelIcon via={f.channel} className="h-3 w-3" /> {t.via[f.channel]}
                </span>
                · {f.date} · {size(f.size)}
                {f.filedBy && !review && <> · {t.by[f.filedBy]}</>}
              </span>
            </span>
            <span className="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:shrink-0">
              {items.length > 0 && (
                <select
                  aria-label={review ? t.fileTo : t.move}
                  value=""
                  disabled={busy === f.id}
                  onChange={(e) => {
                    const item = e.target.value;
                    if (item) run(f.id, () => fileDocument(f.id, item));
                  }}
                  className={`h-8 min-w-0 flex-1 rounded-full border px-3 text-[12.5px] sm:max-w-[11rem] sm:flex-none ${review ? "border-ivory bg-ivory font-medium text-ink" : "border-line-strong bg-transparent text-muted"}`}
                >
                  <option value="">{review ? t.fileTo : t.move}</option>
                  {items
                    .filter((it) => it.id !== f.itemId)
                    .map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.label}
                      </option>
                    ))}
                </select>
              )}
              <a href={`/ficheiro/${f.id}?dl=1`} className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-ink-3 hover:text-ivory" aria-label={t.download} title={t.download}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M8 2.5v8M4.8 7.5L8 10.7l3.2-3.2M3 13.5h10" />
                </svg>
              </a>
              <button
                type="button"
                disabled={busy === f.id}
                onClick={() => window.confirm(t.removeConfirm) && run(f.id, () => deleteDocument(f.id))}
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-bad/10 hover:text-bad"
                aria-label={t.remove}
                title={t.remove}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2a1.2 1.2 0 0 0 1.2 1.1h3.4a1.2 1.2 0 0 0 1.2-1.1l.6-8.2" />
                </svg>
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Ficheiros que o escritório recebeu por outro meio: arrastar ou escolher.
export function OfficeDrop({ requestId, t }: { requestId: string; t: DocTexts }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<{ a: number; b: number } | null>(null);
  const [over, setOver] = useState(false);
  const [issues, setIssues] = useState<UploadIssue[]>([]);

  async function send(files: File[]) {
    if (!files.length || busy) return;
    setIssues([]);
    setBusy({ a: 0, b: files.length });
    const res = await uploadFiles(
      files,
      { start: (f) => startOfficeUpload(requestId, f, null), finish: (d) => finishOfficeUpload(requestId, d, null) },
      (a, b) => setBusy({ a, b }),
    );
    setBusy(null);
    setIssues(res.issues);
    if (input.current) input.current.value = "";
    if (res.saved) {
      router.refresh();
      // A arrumação automática corre logo a seguir: volta a atualizar
      setTimeout(() => router.refresh(), 6000);
      setTimeout(() => router.refresh(), 15000);
    }
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          send(Array.from(e.dataTransfer.files));
        }}
        className={`flex cursor-pointer items-center gap-3.5 rounded-xl border border-dashed px-4 py-3.5 transition-colors ${
          over ? "border-ivory bg-ink-3" : "border-line-strong hover:border-ivory"
        } ${busy ? "pointer-events-none" : ""}`}
      >
        <input ref={input} type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => send(e.target.files ? Array.from(e.target.files) : [])} />
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-3 text-ivory" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10.5v-8M4.8 5.5L8 2.3l3.2 3.2M3 10v2.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V10" /></svg>
        </span>
        <span className="min-w-0">
          {busy ? (
            <span className="flex items-center gap-2 text-[14px] font-medium">
              <Spinner className="h-4 w-4" /> {t.uploading.replace("{a}", String(busy.a)).replace("{b}", String(busy.b))}
            </span>
          ) : (
            <>
              <span className="block text-[14px] font-medium">{t.drop}</span>
              <span className="block text-[12.5px] text-muted">{t.dropHint}</span>
            </>
          )}
        </span>
      </label>
      {issues.length > 0 && (
        <div className="mt-2 space-y-1 text-[13px] text-bad" role="alert">
          {issues.map((x, k) => (
            <p key={k}>{t.issue[x.reason].replace("{name}", x.name)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// Descarregar vários ficheiros num só ZIP, já em pastas «Cliente/Documento/ficheiro»
export function ZipButton({ ids, name, t }: { ids: string[]; name: string; t: DocTexts }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!ids.length) return null;

  async function go() {
    setBusy(true);
    setError(false);
    try {
      const links = await docLinks(ids);
      const files: { name: string; data: Uint8Array }[] = [];
      for (const l of links) {
        const res = await fetch(l.url);
        if (res.ok) files.push({ name: l.name, data: new Uint8Array(await res.arrayBuffer()) });
      }
      if (!files.length) throw new Error("empty");
      const url = URL.createObjectURL(makeZip(files));
      const a = document.createElement("a");
      a.href = url;
      // Nome como um ficheiro real: Clínica_Sol_setembro_de_2026.zip
      a.download = `${name.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+-\s+/g, "_").replace(/\s+/g, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      setError(true);
    }
    setBusy(false);
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" onClick={go} disabled={busy} className="btn btn-secondary btn-sm" aria-busy={busy}>
        {busy ? (
          <>
            <Spinner className="h-3.5 w-3.5" /> {t.zipping}
          </>
        ) : (
          t.zip.replace("{n}", String(ids.length))
        )}
      </button>
      {error && <span className="mt-1 text-[12px] text-bad">{t.error}</span>}
    </span>
  );
}
