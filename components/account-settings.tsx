"use client";

// Conta de cada pessoa: e-mail, palavra-passe (opcional: o link por e-mail funciona sempre),
// verificação em dois passos (TOTP do próprio Supabase) e, só para o dono, apagar a conta.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BusyLabel } from "@/components/spinner";
import { deleteAccount, markPassword } from "@/app/app/conta/actions";
import type { AccountTexts } from "@/lib/account-texts";

type Note = { ok: boolean; text: string } | null;

function Msg({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <p className={`text-sm ${note.ok ? "text-ok" : "text-bad"}`} role={note.ok ? "status" : "alert"}>
      {note.text}
    </p>
  );
}

function Card({ title, hint, side, children }: { title: string; hint?: string; side?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card mt-6 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        {side}
      </div>
      {hint && <p className="mt-1.5 max-w-[56ch] text-sm leading-6 text-muted">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function AccountSettings({
  t,
  email,
  hasPassword,
  mfaFactor,
  canDelete,
  officeName,
}: {
  t: AccountTexts;
  email: string;
  hasPassword: boolean;
  mfaFactor: string | null;
  canDelete: boolean;
  officeName: string;
}) {
  const router = useRouter();

  /* E-mail */
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNote, setEmailNote] = useState<Note>(null);
  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    const next = newEmail.trim().toLowerCase();
    if (!next || next === email.toLowerCase()) return;
    setEmailBusy(true);
    setEmailNote(null);
    const { error } = await createClient().auth.updateUser({ email: next }, { emailRedirectTo: `${window.location.origin}/conta?email=ok` });
    setEmailBusy(false);
    setEmailNote(error ? { ok: false, text: t.error } : { ok: true, text: t.emailSent.replace("{email}", next) });
    if (!error) setNewEmail("");
  }

  /* Palavra-passe */
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNote, setPwNote] = useState<Note>(null);
  const [pwSet, setPwSet] = useState(hasPassword);
  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setPwNote({ ok: false, text: t.passwordShort });
    if (pw !== pw2) return setPwNote({ ok: false, text: t.passwordMismatch });
    setPwBusy(true);
    setPwNote(null);
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (!error) await markPassword().catch(() => null);
    setPwBusy(false);
    if (error) return setPwNote({ ok: false, text: t.error });
    setPw("");
    setPw2("");
    setPwSet(true);
    setPwNote({ ok: true, text: t.passwordSaved });
  }

  /* Dois passos */
  const [factor, setFactor] = useState<string | null>(mfaFactor);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaNote, setMfaNote] = useState<Note>(null);
  async function startMfa() {
    setMfaBusy(true);
    setMfaNote(null);
    const supabase = createClient();
    // Fatores começados e não confirmados ficam pendurados: limpa-os antes
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Bilonai ${Date.now()}` });
    setMfaBusy(false);
    if (error || !data) return setMfaNote({ ok: false, text: t.error });
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }
  async function confirmMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    setMfaBusy(true);
    setMfaNote(null);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() });
    setMfaBusy(false);
    if (error) return setMfaNote({ ok: false, text: t.mfaWrong });
    setFactor(enroll.id);
    setEnroll(null);
    setCode("");
    router.refresh();
  }
  async function cancelMfa() {
    if (enroll) await createClient().auth.mfa.unenroll({ factorId: enroll.id });
    setEnroll(null);
    setCode("");
    setMfaNote(null);
  }
  async function disableMfa() {
    if (!factor || !window.confirm(t.mfaDisableConfirm)) return;
    setMfaBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor });
    // Volta a uma sessão normal (sem o nível de dois passos)
    if (!error) await supabase.auth.refreshSession();
    setMfaBusy(false);
    if (error) return setMfaNote({ ok: false, text: t.error });
    setFactor(null);
    router.refresh();
  }

  /* Apagar conta */
  const [confirmName, setConfirmName] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState(false);
  const nameOk = confirmName.trim().toLowerCase() === officeName.trim().toLowerCase();
  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (!nameOk) return;
    setDelBusy(true);
    setDelError(false);
    const ok = await deleteAccount(confirmName).catch((err) => {
      // O redirecionamento final também chega como "erro": deixa-o seguir
      if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw err;
      return false;
    });
    if (ok === false) {
      setDelBusy(false);
      setDelError(true);
    }
  }

  const status = (on: boolean) => (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${on ? "bg-ok/10 text-ok" : "bg-ink-3 text-muted"}`}>{on ? t.mfaOn : t.mfaOff}</span>
  );

  return (
    <>
      <Card title={t.emailTitle}>
        <p className="text-sm">
          <span className="text-muted">{t.emailCurrent}: </span>
          <strong className="font-medium">{email}</strong>
        </p>
        <form onSubmit={changeEmail} className="flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t.emailNew}</span>
            <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={t.emailNew} autoComplete="email" inputMode="email" className="field" />
          </label>
          <button type="submit" disabled={emailBusy} aria-busy={emailBusy} className="btn btn-secondary">
            <BusyLabel busy={emailBusy} text={t.saving}>
              {t.emailChange}
            </BusyLabel>
          </button>
        </form>
        <Msg note={emailNote} />
      </Card>

      <Card title={t.signinTitle} hint={t.signinHint}>
        <form onSubmit={savePassword} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">{t.passwordNew}</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={8} required className="field" />
          </label>
          <label className="block">
            <span className="label">{t.passwordRepeat}</span>
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" minLength={8} required className="field" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pwBusy} aria-busy={pwBusy} className="btn btn-secondary w-full sm:w-auto">
              <BusyLabel busy={pwBusy} text={t.saving}>
                {pwSet ? t.passwordChange : t.passwordSet}
              </BusyLabel>
            </button>
          </div>
        </form>
        <Msg note={pwNote} />
      </Card>

      <Card title={t.mfaTitle} hint={t.mfaHint} side={status(!!factor)}>
        {!factor && !enroll && (
          <button type="button" onClick={startMfa} disabled={mfaBusy} aria-busy={mfaBusy} className="btn btn-primary w-full sm:w-auto">
            <BusyLabel busy={mfaBusy} text={t.saving}>
              {t.mfaEnable}
            </BusyLabel>
          </button>
        )}
        {enroll && (
          <form onSubmit={confirmMfa} className="space-y-4">
            <p className="text-sm leading-6">{t.mfaScan}</p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* O Supabase devolve o QR já desenhado (imagem SVG) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enroll.qr} alt="QR" width={168} height={168} className="rounded-xl border border-line bg-white p-2" />
              <div className="min-w-0 text-[13px] text-muted">
                {t.mfaSecret}
                <code className="mt-1 block select-all break-all rounded-lg bg-ink-3 px-2.5 py-1.5 font-mono text-[12.5px] text-ivory">{enroll.secret}</code>
              </div>
            </div>
            <label className="block max-w-[14rem]">
              <span className="label">{t.mfaCode}</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                required
                className="field text-center font-mono text-lg tracking-[0.3em]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={mfaBusy || code.length !== 6} aria-busy={mfaBusy} className="btn btn-primary">
                <BusyLabel busy={mfaBusy} text={t.saving}>
                  {t.mfaConfirm}
                </BusyLabel>
              </button>
              <button type="button" onClick={cancelMfa} className="btn btn-secondary">
                {t.cancel}
              </button>
            </div>
          </form>
        )}
        {factor && (
          <button type="button" onClick={disableMfa} disabled={mfaBusy} className="btn btn-secondary w-full sm:w-auto">
            {t.mfaDisable}
          </button>
        )}
        <Msg note={mfaNote} />
      </Card>

      {canDelete && (
        <section className="mt-6 rounded-[14px] border border-bad/30 p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold text-bad">{t.deleteTitle}</h2>
          <p className="mt-1.5 max-w-[56ch] text-sm leading-6 text-muted">{t.deleteText}</p>
          <form onSubmit={remove} className="mt-5 space-y-3">
            <label className="block">
              <span className="label">{t.deleteType.replace("{office}", officeName)}</span>
              <input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoComplete="off" className="field" />
            </label>
            {delError && (
              <p className="text-sm text-bad" role="alert">
                {t.deleteError}
              </p>
            )}
            <button type="submit" disabled={!nameOk || delBusy} aria-busy={delBusy} className="btn w-full border-bad bg-bad text-white hover:opacity-90 sm:w-auto">
              <BusyLabel busy={delBusy} text={t.saving}>
                {t.deleteButton}
              </BusyLabel>
            </button>
          </form>
        </section>
      )}

      <section className="mt-6 px-1">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{t.safeTitle}</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {t.safe.map((s) => (
            <li key={s} className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-ok" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10 2.5l6 2.3v4.6c0 3.7-2.5 6.6-6 8.1-3.5-1.5-6-4.4-6-8.1V4.8z" />
              </svg>
              {s}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
