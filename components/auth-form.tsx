"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/locales";
import type { LoginExtraTexts } from "@/lib/account-texts";
import { BusyLabel } from "@/components/spinner";

type Mode = "login" | "signup";

export type AuthTexts = {
  officeName: string;
  language: string;
  email: string;
  acceptA: string;
  acceptTerms: string;
  acceptAnd: string;
  acceptPrivacy: string;
  submitSignup: string;
  submitLogin: string;
  sending: string;
  checkTitle: string;
  checkTextA: string;
  checkTextB: string;
  rateLimit: string;
};

export function AuthForm({ mode, t, initialLocale, extra }: { mode: Mode; t: AuthTexts; initialLocale: Locale; extra?: LoginExtraTexts }) {
  const [email, setEmail] = useState("");
  const [officeName, setOfficeName] = useState("");
  // O idioma da conta fica o da página; o país (no questionário de boas-vindas) acerta-o depois
  const locale = initialLocale;
  const [withPassword, setWithPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    // Entrada com palavra-passe (para quem a definiu em Conta); com dois passos ativos, pede o código a seguir
    if (mode === "login" && withPassword) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) {
        setState("error");
        setMessage(error.code === "over_request_rate_limit" ? t.rateLimit : extra?.wrongPassword ?? t.rateLimit);
        return;
      }
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      window.location.assign(aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2" ? "/entrar/codigo" : "/");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: mode === "signup",
        data: mode === "signup" ? { office_name: officeName.trim(), locale } : undefined,
      },
    });
    // Resposta igual quer o e-mail exista ou não (não revela quem tem conta)
    if (error && error.code === "over_email_send_rate_limit") {
      setState("error");
      setMessage(t.rateLimit);
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="card animate-rise p-8 text-center">
        <span className="mx-auto grid animate-pop place-items-center">
          <MailCheck className="h-10 w-10 text-gold" strokeWidth={1.6} aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-xl">{t.checkTitle}</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted">
          {t.checkTextA} <strong className="text-ivory">{email}</strong> {t.checkTextB}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mode === "signup" && (
        <>
          <label className="block">
            <span className="label">{t.officeName}</span>
            <input
              className="field"
              required
              maxLength={120}
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              autoComplete="organization"
            />
          </label>
        </>
      )}
      <label className="block">
        <span className="label">{t.email}</span>
        <input
          className="field"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
        />
      </label>
      {mode === "signup" && (
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            required
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--color-ivory)]"
          />
          <span>
            {t.acceptA}{" "}
            <Link className="text-gold hover:underline" href="/termos" target="_blank">{t.acceptTerms}</Link> {t.acceptAnd}{" "}
            <Link className="text-gold hover:underline" href="/privacidade" target="_blank">{t.acceptPrivacy}</Link>.
          </span>
        </label>
      )}
      {mode === "login" && withPassword && (
        <label className="block">
          <span className="label">{extra?.password}</span>
          <input className="field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
      )}
      {state === "error" && <p className="text-sm text-bad">{message}</p>}
      <button type="submit" disabled={state === "sending"} aria-busy={state === "sending"} className="btn btn-primary w-full py-3.5">
        <BusyLabel busy={state === "sending"} text={t.sending}>
          {mode === "signup" ? t.submitSignup : withPassword ? extra?.submitPassword : t.submitLogin}
        </BusyLabel>
      </button>
      {mode === "login" && extra && (
        <button
          type="button"
          onClick={() => {
            setWithPassword((v) => !v);
            setState("idle");
          }}
          className="mx-auto block text-[14px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory"
        >
          {withPassword ? extra.useLink : extra.usePassword}
        </button>
      )}
    </form>
  );
}
