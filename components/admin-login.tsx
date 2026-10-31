"use client";

// Entrada no painel administrativo: e-mail → código recebido por e-mail (fica a sessão neste domínio)
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BusyLabel } from "@/components/spinner";
import { requestAdminCode } from "@/app/admin/actions";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    await requestAdminCode(email).catch(() => null);
    setBusy(false);
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await createClient().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
    if (err) {
      setBusy(false);
      setError("Código errado ou expirado.");
      return;
    }
    window.location.assign("/");
  }

  return step === "email" ? (
    <form onSubmit={sendCode} className="space-y-4">
      <label className="block">
        <span className="label">E-mail</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="field" />
      </label>
      <button type="submit" disabled={busy} className="btn btn-primary w-full py-3.5">
        <BusyLabel busy={busy} text="A enviar…">
          Receber código
        </BusyLabel>
      </button>
    </form>
  ) : (
    <form onSubmit={verify} className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        Se <strong className="text-ivory">{email}</strong> tiver acesso, recebe um código por e-mail. Escreva-o aqui.
      </p>
      <label className="block">
        <span className="label">Código</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          className="field text-center font-mono text-xl tracking-[0.35em]"
        />
      </label>
      {error && <p className="text-sm text-bad">{error}</p>}
      <button type="submit" disabled={busy || code.length < 6} className="btn btn-primary w-full py-3.5">
        <BusyLabel busy={busy} text="A verificar…">
          Entrar
        </BusyLabel>
      </button>
      <button type="button" onClick={() => setStep("email")} className="mx-auto block text-[14px] text-muted underline decoration-line-strong underline-offset-4">
        Usar outro e-mail
      </button>
    </form>
  );
}
