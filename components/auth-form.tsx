"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Flag } from "@/components/flags";
import { createClient } from "@/lib/supabase/client";
import { localeMeta, locales, type Locale } from "@/lib/locales";
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

export function AuthForm({ mode, t, initialLocale }: { mode: Mode; t: AuthTexts; initialLocale: Locale }) {
  const [email, setEmail] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [accepted, setAccepted] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
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
          <fieldset>
            <legend className="label">{t.language}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {locales.map((l) => (
                <label
                  key={l}
                  className="choice flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm"
                >
                  <input type="radio" name="locale" value={l} checked={locale === l} onChange={() => setLocale(l)} className="sr-only" />
                  <Flag locale={l} />
                  <span className="leading-tight">{localeMeta[l].name}</span>
                </label>
              ))}
            </div>
          </fieldset>
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
      {state === "error" && <p className="text-sm text-bad">{message}</p>}
      <button type="submit" disabled={state === "sending"} aria-busy={state === "sending"} className="btn btn-primary w-full py-3.5">
        <BusyLabel busy={state === "sending"} text={t.sending}>
          {mode === "signup" ? t.submitSignup : t.submitLogin}
        </BusyLabel>
      </button>
    </form>
  );
}
