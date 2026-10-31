"use client";

// Passo 2 da página do pedido: o que falta enviar.
// Cada documento em falta tem «Enviar» (escolher ficheiros/foto para esse documento: fica logo recebido).
// Depois de recebido, «+ Adicionar» junta mais ficheiros ao mesmo documento (ex.: várias faturas de despesas).
import { useEffect, useState } from "react";
import { DocMark } from "@/components/marks";
import { ChannelIcon, type Channel } from "@/components/channel-icon";
import { Spinner } from "@/components/spinner";
import { ACCEPT } from "@/lib/file-types";
import { uploadFiles, type UploadIssue } from "./upload";

type Item = { id: string; label: string; status: "pending" | "sent" | "received"; via: Channel | null; files: number };
export type ChecklistTexts = {
  sent: string;
  received: string;
  pending: string;
  allDone: string;
  error: string;
  progress: string;
  via: Record<Channel, string>;
  sentVia: string; // "Enviado via {canal}"
  uploadItem: string;
  uploadMore: string; // depois de recebido: juntar mais ficheiros ao mesmo documento
  files: string; // "{n} ficheiros"
  fileOne: string;
  issue: Record<UploadIssue["reason"], string>; // "{name}"
};


export function Checklist({ token, initial, closed, t }: { token: string; initial: Item[]; closed: boolean; t: ChecklistTexts }) {
  const [items, setItems] = useState(initial);
  const [progress, setProgress] = useState<{ id: string; a: number; b: number } | null>(null);
  const [issues, setIssues] = useState<{ id: string; list: UploadIssue[] } | null>(null);
  const [error, setError] = useState("");

  // Quando a página é atualizada (por exemplo, depois de a IA arrumar ficheiros), segue o servidor
  useEffect(() => setItems(initial), [initial]);

  const handled = items.filter((i) => i.status !== "pending").length;
  const pct = items.length ? Math.round((handled / items.length) * 100) : 0;
  const allDone = items.length > 0 && handled === items.length;
  const filesText = (n: number) => (n === 1 ? t.fileOne : t.files.replace("{n}", String(n)));

  async function send(item: Item, files: File[]) {
    if (!files.length || progress) return;
    setIssues(null);
    setError("");
    setProgress({ id: item.id, a: 0, b: files.length });
    const res = await uploadFiles(token, files, item.id, (a, b) => setProgress({ id: item.id, a, b }));
    setProgress(null);
    if (res.saved) {
      setItems((list) =>
        list.map((i) => (i.id === item.id ? { ...i, status: "received", via: i.status === "received" ? i.via : "page", files: i.files + res.saved } : i)),
      );
    }
    if (res.issues.length) setIssues({ id: item.id, list: res.issues });
  }

  return (
    <div>
      {/* Barra de progresso (0 a 100%), igual à da demonstração na página inicial */}
      <div className="flex items-center justify-between text-[13px] text-muted">
        <span>{t.progress.replace("{a}", String(handled)).replace("{b}", String(items.length))}</span>
        <span className="tabular-nums text-ivory">{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="h-full rounded-full bg-ivory transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>

      {allDone && (
        <p className="mt-4 flex animate-rise items-center gap-2.5 border-b border-line py-3 text-sm text-ok">
          <DocMark state="received" className="h-4 w-4" /> {t.allDone}
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-bad" role="alert">
          {error}
        </p>
      )}

      <ul>
        {items.map((i, idx) => {
          const received = i.status === "received";
          const sent = i.status === "sent";
          const uploading = progress?.id === i.id;
          return (
            <li key={i.id} className="animate-rise border-b border-line" style={{ animationDelay: `${idx * 40}ms` }}>
              <div className="flex items-center gap-3.5 py-4">
                <DocMark key={i.status} state={i.status} className="h-[18px] w-[18px] shrink-0" animate={i.status !== "pending"} />
                <div className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{i.label}</span>
                  {(sent || received) && (
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] text-muted">
                      {i.via && <ChannelIcon via={i.via} className="h-3 w-3" />}
                      {received ? t.received : i.via ? t.sentVia.replace("{canal}", t.via[i.via]) : t.sent}
                      {i.files > 0 && <span>· {filesText(i.files)}</span>}
                    </span>
                  )}
                </div>
                {!closed &&
                  (uploading ? (
                    <span className="flex shrink-0 items-center gap-2 text-[13px] tabular-nums text-muted">
                      <Spinner className="h-3.5 w-3.5" /> {progress.a}/{progress.b}
                    </span>
                  ) : (
                    <label
                      className={`shrink-0 cursor-pointer rounded-full font-medium transition ${
                        received
                          ? "flex items-center gap-1 border border-line-strong px-3 py-1.5 text-[12.5px] text-muted hover:border-ivory hover:text-ivory"
                          : sent
                            ? "border border-line-strong px-4 py-2 text-[13.5px]"
                            : "bg-ivory px-4 py-2 text-[13.5px] text-ink hover:opacity-90"
                      } ${progress ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <input
                        type="file"
                        multiple
                        accept={ACCEPT}
                        className="sr-only"
                        onChange={(e) => {
                          const files: File[] = e.target.files ? Array.from(e.target.files) : [];
                          e.target.value = "";
                          send(i, files);
                        }}
                      />
                      {received ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                            <path d="M6 2v8M2 6h8" />
                          </svg>
                          {t.uploadMore}
                        </>
                      ) : (
                        t.uploadItem
                      )}
                    </label>
                  ))}
                {closed && !received && <span className="shrink-0 text-[13px] text-muted">{t.pending}</span>}
              </div>

              {issues?.id === i.id && (
                <div className="-mt-2 mb-3 ml-8 space-y-1 text-[13px] text-bad" role="alert">
                  {issues.list.map((x, k) => (
                    <p key={k}>{t.issue[x.reason].replace("{name}", x.name)}</p>
                  ))}
                </div>
              )}

            </li>
          );
        })}
      </ul>
    </div>
  );
}
