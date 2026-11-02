"use client";

// Integrações nas Definições: Google Drive (ligar, envio automático, enviar agora, desligar)
// e OneDrive/SharePoint como «Brevemente».
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BusyLabel } from "@/components/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { disconnectDrive, setDriveAuto, syncDriveNow } from "@/app/app/definicoes/drive-actions";
import type { IntegrationTexts } from "@/lib/integration-texts";

export type DriveState = {
  ready: boolean;
  connected: boolean;
  email: string | null;
  expired: boolean;
  auto: boolean;
  folderId: string | null;
  pending: number;
};

export function IntegrationsCard({ t, drive }: { t: IntegrationTexts; drive: DriveState }) {
  const router = useRouter();
  const [auto, setAuto] = useState(drive.auto);
  const [busy, setBusy] = useState<"sync" | "off" | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [, start] = useTransition();
  const x = t.drive;

  function toggle(on: boolean) {
    setAuto(on);
    start(async () => {
      const ok = await setDriveAuto(on).catch(() => false);
      if (!ok) setAuto(!on);
    });
  }

  // Envia em rondas pequenas até não faltar nada (cada ronda é um pedido curto ao servidor)
  function sendNow() {
    setNote(null);
    setBusy("sync");
    start(async () => {
      let sent = 0;
      let failed = 0;
      let retry = true;
      for (let round = 0; round < 40; round++) {
        const r = await syncDriveNow(retry).catch(() => null);
        retry = false;
        if (!r) break;
        sent += r.sent;
        failed += r.failed;
        if (!r.left || (!r.sent && !r.failed)) break;
      }
      setBusy(null);
      if (failed) setNote({ ok: false, text: x.failed.replace("{n}", String(failed)) });
      else setNote({ ok: true, text: sent ? x.sent.replace("{n}", String(sent)) : x.allSynced });
      router.refresh();
    });
  }

  function disconnect() {
    setAsking(false);
    setBusy("off");
    start(async () => {
      await disconnectDrive().catch(() => false);
      setBusy(null);
      router.refresh();
    });
  }

  const connectBtn = (label: string) =>
    drive.ready ? (
      // Navegação normal (sai para o ecrã do Google e volta)
      <a href="/api/google/connect" className="btn btn-primary btn-sm">
        {label}
      </a>
    ) : (
      <span className="text-[13px] text-muted">{x.notReady}</span>
    );

  return (
    <section id="integracoes" className="card mt-8 scroll-mt-24 p-5 sm:p-6">
      <h2 className="font-display text-lg">{t.title}</h2>
      <p className="mt-1.5 max-w-[62ch] text-sm leading-6 text-muted">{t.lead}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* Google Drive */}
        <div className="flex flex-col rounded-2xl border border-line p-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/google-drive.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <p className="text-[15px] font-medium">Google Drive</p>
              <p className={`text-[12.5px] leading-5 text-muted ${drive.connected ? "truncate" : ""}`}>
                {drive.connected && drive.email ? x.connectedAs.replace("{email}", drive.email) : x.desc}
              </p>
            </div>
            {drive.connected && !drive.expired && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-ok" aria-hidden />}
          </div>

          {!drive.connected ? (
            <div className="mt-4">{connectBtn(x.connect)}</div>
          ) : drive.expired ? (
            <div className="mt-4 space-y-3">
              <p className="text-[13px] text-warn">{x.expired}</p>
              {connectBtn(x.reconnect)}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line px-3.5 py-3">
                <span>
                  <span className="block text-[14px] font-medium">{x.auto}</span>
                  <span className="block text-[12px] leading-5 text-muted">{x.autoHint}</span>
                </span>
                <input type="checkbox" checked={auto} onChange={(e) => toggle(e.target.checked)} className="peer sr-only" />
                <span
                  aria-hidden
                  className="relative h-[26px] w-[44px] shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-ivory peer-focus-visible:outline peer-focus-visible:outline-[1.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ivory after:absolute after:left-[3px] after:top-[3px] after:h-5 after:w-5 after:rounded-full after:bg-ink-2 after:shadow-sm after:transition-transform peer-checked:after:translate-x-[18px]"
                />
              </label>
              <p className="text-[12.5px] text-muted">{drive.pending ? x.pending.replace("{n}", String(drive.pending)) : x.allSynced}</p>
              {note && <p className={`text-[13px] ${note.ok ? "text-ok" : "text-bad"}`}>{note.text}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={sendNow} disabled={busy === "sync"} aria-busy={busy === "sync"} className="btn btn-primary btn-sm">
                  <BusyLabel busy={busy === "sync"}>{x.sendNow}</BusyLabel>
                </button>
                {drive.folderId && (
                  <a href={`https://drive.google.com/drive/folders/${drive.folderId}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    {x.open}
                  </a>
                )}
                <button type="button" onClick={() => setAsking(true)} disabled={busy === "off"} aria-busy={busy === "off"} className="btn btn-secondary btn-sm">
                  <BusyLabel busy={busy === "off"}>{x.disconnect}</BusyLabel>
                </button>
              </div>
              <ConfirmDialog open={asking} text={x.disconnectConfirm} confirmLabel={x.disconnect} onClose={() => setAsking(false)} onConfirm={disconnect} />
            </div>
          )}
          <p className="mt-auto pt-4 text-[11.5px] leading-5 text-muted">{x.privacy}</p>
        </div>

        {/* OneDrive e SharePoint: brevemente */}
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-line-strong p-4 sm:self-start">
          {/* Logótipos do OneDrive e do SharePoint, lado a lado */}
          <span className="flex shrink-0 items-center" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/onedrive.png" alt="" width={32} height={32} className="h-8 w-8" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/sharepoint.png" alt="" width={26} height={26} className="-ml-1.5 h-[26px] w-[26px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-muted">{t.soon.name}</p>
            <p className="text-[12.5px] leading-5 text-muted">{t.soon.desc}</p>
            <span className="mt-2.5 inline-block rounded-full border border-line-strong px-2.5 py-0.5 text-[11.5px] font-medium text-muted">{t.soon.badge}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
