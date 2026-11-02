"use client";

// Domínio próprio nas Definições. No plano Inicial a função fica visível e utilizável à vista,
// mas «Ativar» abre o convite para o plano Escritório (sem desfocar nem esconder nada).
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BusyLabel } from "@/components/spinner";
import { CopyButton } from "@/components/app-buttons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Dialog } from "@/components/dialog";
import { IconSpark } from "@/components/icons";
import { deleteDomain, saveDomain, verifyDomain, type DomainResult } from "@/app/app/definicoes/domain-actions";
import type { DomainTexts } from "@/lib/domain-texts";

type Props = {
  t: DomainTexts;
  domain: string | null;
  status: string | null;
  canUse: boolean;
  cname: { host: string; target: string } | null;
  closeLabel: string;
};

export function DomainCard({ t, domain, status, canUse, cname, closeLabel }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(domain ?? "");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [txt, setTxt] = useState<{ name: string; value: string } | null>(null);
  const [busy, setBusy] = useState<"save" | "verify" | "remove" | null>(null);
  const [asking, setAsking] = useState(false);
  const [, start] = useTransition();
  const active = status === "active";

  function done(r: DomainResult, verifying: boolean) {
    if (!r.ok) {
      if (r.error === "plan") return openUpsell();
      setError(t.errors[r.error]);
      return;
    }
    setTxt(r.txt);
    if (verifying && !r.active) setNote(t.stillPending);
    router.refresh();
  }

  function openUpsell() {
    (document.getElementById("convite-escritorio") as HTMLDialogElement | null)?.showModal();
  }

  function activate() {
    setError(null);
    setNote(null);
    if (!canUse) return openUpsell();
    if (!value.trim()) return setError(t.errors.invalid);
    setBusy("save");
    start(async () => {
      const r = await saveDomain(value).catch(() => ({ ok: false as const, error: "generic" as const }));
      setBusy(null);
      done(r, false);
    });
  }

  function verify() {
    setError(null);
    setNote(null);
    setBusy("verify");
    start(async () => {
      const r = await verifyDomain().catch(() => ({ ok: false as const, error: "generic" as const }));
      setBusy(null);
      done(r, true);
    });
  }

  function remove() {
    setAsking(false);
    setBusy("remove");
    start(async () => {
      const ok = await deleteDomain().catch(() => false);
      setBusy(null);
      if (!ok) return setError(t.errors.generic);
      setValue("");
      setTxt(null);
      router.refresh();
    });
  }

  const rows = cname ? [[t.type, "CNAME"], [t.name, cname.host], [t.value, cname.target]] : [];

  return (
    <section id="dominio" className="card mt-8 scroll-mt-24 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="font-display text-lg">{t.title}</h2>
        <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-[11.5px] font-medium text-muted">{t.badge}</span>
        {domain && (
          <span className={`ml-auto flex items-center gap-1.5 text-[12.5px] font-medium ${active ? "text-ok" : "text-warn"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-ok" : "bg-warn"}`} aria-hidden />
            {active ? t.active : t.pending}
          </span>
        )}
      </div>
      <p className="mt-1.5 max-w-[60ch] text-sm leading-6 text-muted">{t.lead}</p>

      {!domain ? (
        <div className="mt-5">
          <label className="block">
            <span className="label">{t.label}</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), activate())}
                placeholder={t.placeholder}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={200}
                className={`field flex-1 ${error ? "!border-bad" : ""}`}
              />
              <button type="button" onClick={activate} disabled={busy === "save"} aria-busy={busy === "save"} className="btn btn-primary sm:w-auto">
                <BusyLabel busy={busy === "save"}>{t.activate}</BusyLabel>
              </button>
            </div>
          </label>
          {error ? <p className="mt-1.5 text-[13px] text-bad">{error}</p> : <p className="mt-1.5 text-xs text-muted">{t.hint}</p>}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <p className="font-mono text-[15px]">{domain}</p>
          {active ? (
            <p className="text-sm text-ok">{t.activeText.replace("{domain}", domain)}</p>
          ) : (
            <>
              <p className="text-sm leading-6">{t.step}</p>
              {/* O registo a copiar, campo a campo */}
              <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 px-3.5 py-2.5">
                    <dt className="w-14 shrink-0 text-[12.5px] text-muted">{k}</dt>
                    <dd className="min-w-0 flex-1 truncate font-mono text-[13.5px]">{v}</dd>
                    {k !== t.type && <CopyButton value={v} label={t.copy} done={t.copied} compact />}
                  </div>
                ))}
              </dl>
              {txt && (
                <>
                  <p className="text-sm leading-6">{t.txtStep}</p>
                  <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                    {[[t.type, "TXT"], [t.name, txt.name], [t.value, txt.value]].map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3 px-3.5 py-2.5">
                        <dt className="w-14 shrink-0 text-[12.5px] text-muted">{k}</dt>
                        <dd className="min-w-0 flex-1 truncate font-mono text-[13.5px]">{v}</dd>
                        {k !== t.type && <CopyButton value={v} label={t.copy} done={t.copied} compact />}
                      </div>
                    ))}
                  </dl>
                </>
              )}
              <p className="text-xs leading-5 text-muted">{t.wait}</p>
            </>
          )}
          {note && <p className="text-[13px] text-warn">{note}</p>}
          {error && <p className="text-[13px] text-bad">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {!active && (
              <button type="button" onClick={verify} disabled={busy === "verify"} aria-busy={busy === "verify"} className="btn btn-primary btn-sm">
                <BusyLabel busy={busy === "verify"}>{t.verify}</BusyLabel>
              </button>
            )}
            <button type="button" onClick={() => setAsking(true)} disabled={busy === "remove"} aria-busy={busy === "remove"} className="btn btn-secondary btn-sm">
              <BusyLabel busy={busy === "remove"}>{t.remove}</BusyLabel>
            </button>
          </div>
          <ConfirmDialog open={asking} text={t.removeConfirm} confirmLabel={t.remove} onClose={() => setAsking(false)} onConfirm={remove} />
        </div>
      )}

      {/* Convite para o plano Escritório */}
      <Dialog id="convite-escritorio" title={t.upsell.title} closeLabel={closeLabel}>
        <p className="text-[15px] leading-6 text-muted">{t.upsell.text}</p>
        <ul className="mt-5 space-y-3">
          {t.upsell.points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[15px] leading-6">
              <IconSpark className="mt-[5px] h-[14px] w-[14px] shrink-0 text-ivory" />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          <form method="dialog">
            <button className="btn btn-secondary w-full">{t.upsell.later}</button>
          </form>
          <Link href="/assinatura" className="btn btn-primary w-full">
            {t.upsell.cta}
          </Link>
        </div>
      </Dialog>
    </section>
  );
}
