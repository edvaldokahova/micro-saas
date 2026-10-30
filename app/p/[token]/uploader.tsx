"use client";

// Passo 1 da página do pedido: escolher ficheiros (ou tirar foto) e enviar daqui mesmo.
// É a forma mais rápida para quem recebeu o link no WhatsApp: toca, escolhe as fotos/PDF e já está.
// Os ficheiros vão para o escritório; a Bilonai arruma cada um no documento certo.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCEPT } from "@/lib/file-types";
import { Spinner } from "@/components/spinner";
import { uploadFiles, type UploadIssue } from "./upload";

export type UploaderTexts = {
  button: string;
  hint: string;
  drop: string;
  uploading: string; // "A enviar {a} de {b}…"
  done: string; // "{n}" é substituído
  doneOne: string;
  issue: Record<UploadIssue["reason"], string>; // "{name}"
};

export function Uploader({ token, t }: { token: string; t: UploaderTexts }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<{ a: number; b: number } | null>(null);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<{ saved: number; issues: UploadIssue[] } | null>(null);

  async function send(files: File[]) {
    if (!files.length || busy) return;
    setMsg(null);
    setBusy({ a: 0, b: files.length });
    const res = await uploadFiles(token, files, null, (a, b) => setBusy({ a, b }));
    setBusy(null);
    setMsg(res);
    if (input.current) input.current.value = "";
    // A IA arruma em segundos: atualiza a lista para mostrar os documentos já recebidos
    if (res.saved) {
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
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-5 py-7 text-center transition-colors ${
          over ? "border-ivory bg-ink-3" : "border-line-strong bg-ink-2 hover:border-ivory"
        } ${busy ? "pointer-events-none" : ""}`}
      >
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          disabled={!!busy}
          onChange={(e) => send(e.target.files ? Array.from(e.target.files) : [])}
        />
        {busy ? (
          <span className="flex items-center gap-2.5 text-[15px] font-medium">
            <Spinner className="h-4 w-4" /> {t.uploading.replace("{a}", String(busy.a)).replace("{b}", String(busy.b))}
          </span>
        ) : (
          <>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ivory text-ink" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13.5V3.5M6 7.3l4-3.8 4 3.8M3.5 12.5v2.2a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-2.2" />
              </svg>
            </span>
            <span className="text-[15.5px] font-medium">{over ? t.drop : t.button}</span>
            <span className="max-w-[34ch] text-[13px] leading-5 text-muted">{t.hint}</span>
          </>
        )}
      </label>

      {msg && (
        <div className="mt-3 animate-rise space-y-1 text-sm" role="status">
          {msg.saved > 0 && <p className="text-ok">{msg.saved === 1 ? t.doneOne : t.done.replace("{n}", String(msg.saved))}</p>}
          {msg.issues.map((i, k) => (
            <p key={k} className="text-bad">
              {t.issue[i.reason].replace("{name}", i.name)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
