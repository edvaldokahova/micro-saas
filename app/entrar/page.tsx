import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-chrome";
import { authTexts } from "@/lib/auth-texts";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const locale = await getLocale();
  const d = getDictionary(locale);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="animate-rise font-display text-3xl">{d.auth.signInTitle}</h1>
        <p className="mt-2 animate-rise text-muted [animation-delay:80ms]">{d.auth.signInLead}</p>
        {erro === "link" && (
          <p className="mt-5 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">{d.auth.linkError}</p>
        )}
        <div className="mt-8 animate-rise [animation-delay:160ms]">
          <AuthForm mode="login" t={authTexts(d)} initialLocale={locale} />
        </div>
        <p className="mt-6 text-sm text-muted">
          {d.auth.noAccount} <Link className="text-gold hover:underline" href="/registar">{d.nav.tryFree}</Link>
        </p>
      </main>
    </>
  );
}
