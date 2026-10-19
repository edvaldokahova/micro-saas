"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

const input =
  "w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-gold";

export function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [locale, setLocale] = useState<"pt-PT" | "es-ES">("pt-PT");
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
      setMessage("Pediu demasiados e-mails seguidos. Aguarde alguns minutos e tente de novo.");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-line bg-ink-2 p-7 text-center">
        <MailCheck className="mx-auto h-9 w-9 text-gold" aria-hidden />
        <h2 className="mt-4 font-display text-xl font-semibold">Verifique o seu e-mail</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted">
          Se o endereço <strong className="text-ivory">{email}</strong> estiver correto, enviámos-lhe um link de acesso.
          É válido durante 1 hora. Veja também o spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <>
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">Nome do escritório</span>
            <input
              className={input}
              required
              maxLength={120}
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              autoComplete="organization"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">Idioma</span>
            <select className={input} value={locale} onChange={(e) => setLocale(e.target.value as "pt-PT" | "es-ES")}>
              <option value="pt-PT">Português (Portugal)</option>
              <option value="es-ES">Español (España)</option>
            </select>
          </label>
        </>
      )}
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">E-mail</span>
        <input
          className={input}
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
            className="mt-1 h-4 w-4 accent-[#d9b24a]"
          />
          <span>
            Li e aceito os <Link className="text-gold hover:underline" href="/termos" target="_blank">Termos</Link> e a{" "}
            <Link className="text-gold hover:underline" href="/privacidade" target="_blank">Política de privacidade</Link>.
          </span>
        </label>
      )}
      {state === "error" && <p className="text-sm text-bad">{message}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-xl bg-gold px-5 py-3.5 font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {state === "sending" ? "A enviar…" : mode === "signup" ? "Criar conta e receber link" : "Receber link de acesso"}
      </button>
    </form>
  );
}
