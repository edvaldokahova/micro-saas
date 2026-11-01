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
  // Validação própria (sem os avisos do navegador): erro por campo, mostrado por baixo dele
  const [errors, setErrors] = useState<Partial<Record<"office" | "email" | "password" | "accept", string>>>({});
  const v = extra?.validation;

  function validate(): boolean {
    const next: typeof errors = {};
    if (mode === "signup" && !officeName.trim()) next.office = v?.required;
    if (!email.trim()) next.email = v?.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = v?.email;
    if (mode === "login" && withPassword && !password) next.password = v?.required;
    if (mode === "signup" && !accepted) next.accept = v?.accept;
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(`auth-${first}`)?.focus();
    return !first;
  }

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6) return;
    setChecking(true);
    setCodeError(false);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: "email" });
    if (error) {
      setChecking(false);
      setCodeError(true);
      return;
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    window.location.assign(aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2" ? "/entrar/codigo" : "/");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
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
      <div className="card animate-rise p-6 text-center sm:p-8">
        <span className="mx-auto grid animate-pop place-items-center">
          <MailCheck className="h-10 w-10 text-gold" strokeWidth={1.6} aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-xl">{t.checkTitle}</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted">
          {t.checkTextA} <strong className="text-ivory">{email}</strong> {t.checkTextB}
        </p>
        {extra && (
          // O e-mail traz também um código: útil quando o link abre noutro aparelho ou navegador
          <form onSubmit={verifyCode} noValidate className="mt-6 border-t border-line pt-5 text-left">
            <label className="block">
              <span className="label">{extra.codeOr}</span>
              <input
                id="auth-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 8));
                  setCodeError(false);
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={extra.code}
                className={`field text-center font-mono text-xl tracking-[0.4em] ${codeError ? "!border-bad" : ""}`}
              />
              <FieldError text={codeError ? extra.codeWrong : undefined} />
            </label>
            <button type="submit" disabled={checking || code.length < 6} aria-busy={checking} className="btn btn-primary mt-4 w-full">
              <BusyLabel busy={checking}>{extra.codeSubmit}</BusyLabel>
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {mode === "signup" && (
        <>
          <label className="block">
            <span className="label">{t.officeName}</span>
            <input
              id="auth-office"
              className={`field ${errors.office ? "!border-bad" : ""}`}
              maxLength={120}
              value={officeName}
              onChange={(e) => {
                setOfficeName(e.target.value);
                setErrors((x) => ({ ...x, office: undefined }));
              }}
              aria-invalid={!!errors.office}
              autoComplete="organization"
            />
            <FieldError text={errors.office} />
          </label>
        </>
      )}
      <label className="block">
        <span className="label">{t.email}</span>
        <input
          id="auth-email"
          className={`field ${errors.email ? "!border-bad" : ""}`}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((x) => ({ ...x, email: undefined }));
          }}
          aria-invalid={!!errors.email}
          autoComplete="email"
          inputMode="email"
        />
        <FieldError text={errors.email} />
      </label>
      {mode === "signup" && (
        <div>
          {/* Caixa própria (não a do navegador): quadrado arredondado que fica preto com o visto */}
          <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
            <input
              id="auth-accept"
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                setErrors((x) => ({ ...x, accept: undefined }));
              }}
              className="peer sr-only"
            />
            <span
              className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition peer-checked:border-ivory peer-checked:bg-ivory peer-focus-visible:ring-2 peer-focus-visible:ring-ivory/30 ${
                errors.accept ? "border-bad" : "border-line-strong"
              } ${accepted ? "text-ink" : "text-transparent"}`}
              aria-hidden
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.4 6.3l2.4 2.3 4.8-5" />
              </svg>
            </span>
            <span>
              {t.acceptA}{" "}
              <Link className="text-gold hover:underline" href="/termos" target="_blank">{t.acceptTerms}</Link> {t.acceptAnd}{" "}
              <Link className="text-gold hover:underline" href="/privacidade" target="_blank">{t.acceptPrivacy}</Link>.
            </span>
          </label>
          <FieldError text={errors.accept} />
        </div>
      )}
      {mode === "login" && withPassword && (
        <label className="block">
          <span className="label">{extra?.password}</span>
          <input
            id="auth-password"
            className={`field ${errors.password ? "!border-bad" : ""}`}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((x) => ({ ...x, password: undefined }));
            }}
            aria-invalid={!!errors.password}
            autoComplete="current-password"
          />
          <FieldError text={errors.password} />
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
            setWithPassword((w) => !w);
            setState("idle");
            setErrors({});
          }}
          className="mx-auto block text-[14px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory"
        >
          {withPassword ? extra.useLink : extra.usePassword}
        </button>
      )}
    </form>
  );
}

// Aviso por baixo de um campo, no estilo do Bilonai (no lugar do balão do navegador)
function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span role="alert" className="mt-1.5 flex animate-rise items-start gap-1.5 text-[13px] leading-5 text-bad [animation-duration:.2s]">
      <svg className="mt-[3px] shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 4.9v3.6" />
        <circle cx="8" cy="11.1" r=".35" fill="currentColor" />
      </svg>
      {text}
    </span>
  );
}
