import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { authTexts } from "@/lib/auth-texts";
import { SiteHeader } from "@/components/site-chrome";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Criar conta · Crear cuenta", robots: { index: false } };

export default async function Registar() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto max-w-md px-5 py-16">
        <h1 className="animate-rise font-display text-3xl font-semibold tracking-tight">{d.auth.signupTitle(site.trialDays)}</h1>
        <p className="mt-2 animate-rise text-muted [animation-delay:80ms]">{d.auth.signupLead}</p>
        <div className="mt-8 animate-rise [animation-delay:160ms]">
          <AuthForm mode="signup" t={authTexts(d)} initialLocale={locale} />
        </div>
        <p className="mt-6 text-sm text-muted">
          {d.auth.haveAccount} <Link className="text-gold hover:underline" href="/entrar">{d.nav.signIn}</Link>
        </p>
      </main>
    </>
  );
}
