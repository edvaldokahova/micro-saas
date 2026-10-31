"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BusyLabel } from "@/components/spinner";
import type { CodeTexts } from "@/lib/account-texts";

export function CodeForm({ t }: { t: CodeTexts }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
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
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="label">{t.code}</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          pattern="\d{6}"
          className="field text-center font-mono text-xl tracking-[0.4em]"
        />
      </label>
      {error && (
        <p className="text-sm text-bad" role="alert">
          {t.wrong}
        </p>
      )}
      <button type="submit" disabled={busy || code.length !== 6} aria-busy={busy} className="btn btn-primary w-full py-3.5">
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
