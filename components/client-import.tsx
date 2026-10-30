"use client";

// Importar clientes: copiar as colunas do Excel / Google Sheets (ou abrir um CSV) e colar.
// Cada linha é lida sozinha: a célula com @ é o e-mail, a que tem números é o telefone, a primeira das outras é o nome.
// Mostra o que vai ser importado antes de confirmar.
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { importClients, type ImportRow } from "@/app/app/actions";

export type ImportTexts = {
  hint: string;
  placeholder: string;
  file: string;
  preview: string; // "{n} clientes prontos a importar"
  previewOne: string;
  more: string; // "e mais {n}"
  limit: string; // "O seu plano permite mais {n}"
  cols: { name: string; phone: string; email: string };
  cadence: string;
  cadences: { monthly: string; quarterly: string };
  submit: string;
  importing: string;
  done: string; // "{n} clientes importados"
  skipped: string; // "{n} já existiam ou não tinham nome"
  limited: string; // "{n} ficaram de fora pelo limite do plano"
  error: string;
};

const isEmail = (v: string) => /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/.test(v);
const isPhone = (v: string) => /^[+\d\s().-]{6,24}$/.test(v) && (v.match(/\d/g)?.length ?? 0) >= 6;

export function parseClients(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const sep = lines.some((l) => l.includes("\t")) ? "\t" : lines.some((l) => l.includes(";")) ? ";" : ",";
  const rows = lines.map((l) => {
    const cells = l.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, "$1").trim()).filter(Boolean);
    const email = cells.find(isEmail) ?? "";
    const phone = cells.find((c) => c !== email && isPhone(c)) ?? "";
    const name = cells.find((c) => c !== email && c !== phone) ?? "";
    return { name, phone, email };
  });
  // Primeira linha com títulos (Nome, Telefone, E-mail…): fica de fora
  const first = rows[0];
  if (first && !first.email && !first.phone && /nome|name|nombre|cliente|client/i.test(first.name)) rows.shift();
  return rows.filter((r) => r.name);
}

export function ClientImport({ t, room }: { t: ImportTexts; room: number }) {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [cadence, setCadence] = useState<"monthly" | "quarterly">("monthly");
  const [result, setResult] = useState<string[] | null>(null);
  const [error, setError] = useState(false);
  const [busy, start] = useTransition();
  const rows = useMemo(() => parseClients(text), [text]);

  function submit() {
    setError(false);
    start(async () => {
      const res = await importClients(rows.slice(0, 500), cadence).catch(() => null);
      if (!res || !res.ok) {
        setError(true);
        return;
      }
      const lines = [t.done.replace("{n}", String(res.added))];
      if (res.skipped) lines.push(t.skipped.replace("{n}", String(res.skipped)));
      if (res.limited) lines.push(t.limited.replace("{n}", String(res.limited)));
      setResult(lines);
      setText("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">{t.hint}</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
        rows={6}
        placeholder={t.placeholder}
        className="field font-mono text-[12.5px] leading-5"
        spellCheck={false}
      />
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => file.current?.click()} className="text-[13px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory">
          {t.file}
        </button>
        <input
          ref={file}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f && f.size < 2_000_000) setText(await f.text());
            e.target.value = "";
          }}
        />
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl border border-line">
          <p className="border-b border-line px-3.5 py-2.5 text-[13px] font-medium">
            {rows.length === 1 ? t.previewOne : t.preview.replace("{n}", String(rows.length))}
            {rows.length > room && <span className="font-normal text-warn"> · {t.limit.replace("{n}", String(room))}</span>}
          </p>
          <ul className="divide-y divide-line text-[13px]">
            {rows.slice(0, 5).map((r, i) => (
              <li key={i} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-x-3 px-3.5 py-2">
                <span className="truncate font-medium">{r.name}</span>
                <span className="truncate text-muted">{[r.phone, r.email].filter(Boolean).join(" · ") || "—"}</span>
              </li>
            ))}
          </ul>
          {rows.length > 5 && <p className="border-t border-line px-3.5 py-2 text-[12.5px] text-muted">{t.more.replace("{n}", String(rows.length - 5))}</p>}
        </div>
      )}

      <div>
        <p className="label">{t.cadence}</p>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-ink-3/50 p-1">
          {(["monthly", "quarterly"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setCadence(v)}
              className={`rounded-lg px-3 py-2 text-center text-sm transition ${cadence === v ? "bg-ink-2 font-medium text-ivory shadow-sm" : "text-muted"}`}
            >
              {t.cadences[v]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-bad" role="alert">
          {t.error}
        </p>
      )}
      {result && (
        <div className="space-y-0.5 text-sm" role="status">
          {result.map((l, i) => (
            <p key={i} className={i === 0 ? "text-ok" : "text-muted"}>
              {l}
            </p>
          ))}
        </div>
      )}

      <button type="button" onClick={submit} disabled={!rows.length || busy || room <= 0} className="btn btn-primary w-full" aria-busy={busy}>
        {busy ? (
          <>
            <Spinner /> {t.importing}
          </>
        ) : (
          t.submit
        )}
      </button>
    </div>
  );
}
