import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { authTexts } from "@/lib/auth-texts";
import { LocaleSwitcher } from "@/components/preferences";
import { accountTexts } from "@/lib/account-texts";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Criar conta · Crear cuenta", robots: { index: false } };

export default async function Registar() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  return (
    <>
      <main className="relative mx-auto max-w-md px-5 pb-16 pt-8 sm:pt-14">
        {/* Sem cabeçalho: só o idioma, por cima do formulário */}
        <div className="mb-10 flex">
          <LocaleSwitcher align="left" locale={locale} label={d.common.language} />
        </div>
        <h1 className="animate-rise font-display text-3xl">{d.auth.signupTitle(site.trialDays)}</h1>
        <p className="mt-3 animate-rise text-[15px] text-muted [animation-delay:80ms]">{d.auth.signupLead}</p>
        <div className="mt-8 animate-rise [animation-delay:160ms]">
          <AuthForm mode="signup" t={authTexts(d)} initialLocale={locale} extra={accountTexts(locale).login} />
        </div>
        <p className="mt-6 text-sm text-muted">
          {d.auth.haveAccount} <Link className="text-gold hover:underline" href="/entrar">{d.nav.signIn}</Link>
        </p>
      </main>
    </>
  );
}
