"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BusyLabel } from "@/components/spinner";
import { OtpInput } from "@/components/otp-input";
import type { CodeTexts } from "@/lib/account-texts";

export function CodeForm({ t }: { t: CodeTexts }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(token: string) {
    if (token.length < 6 || busy) return;
    setBusy(true);
    setError(false);
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = data?.totp?.find((f) => f.status === "verified");
    if (!factor) {
      // Sem sessão ou sem dois passos: volta à entrada normal
      window.location.assign("/");
      return;
    }
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: token });
    if (err) {
      setBusy(false);
      setError(true);
      setCode("");
      return;
    }
    window.location.assign("/");
  }

  async function leave() {
    await createClient().auth.signOut();
    window.location.assign("/entrar");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(code.replace(/\s/g, ""));
      }}
      noValidate
      className="space-y-5"
    >
      <div>
        <p className="label">{t.code}</p>
        <OtpInput value={code} onChange={(v) => { setCode(v); setError(false); }} onComplete={submit} invalid={error} disabled={busy} autoFocus label={t.code} />
      </div>
      {error && (
        <p className="text-sm text-bad" role="alert">
          {t.wrong}
        </p>
      )}
      <button type="submit" disabled={busy || code.replace(/\s/g, "").length !== 6} aria-busy={busy} className="btn btn-primary w-full py-3.5">
        <BusyLabel busy={busy} text={t.submit}>
          {t.submit}
        </BusyLabel>
      </button>
      <p className="text-center text-[13px] text-muted">{t.lost}</p>
      <button type="button" onClick={leave} className="mx-auto block text-[14px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory">
        {t.signOut}
      </button>
    </form>
  );
}
