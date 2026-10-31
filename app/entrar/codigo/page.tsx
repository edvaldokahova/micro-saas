import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-chrome";
import { CodeForm } from "@/components/code-form";
import { accountTexts } from "@/lib/account-texts";
import { getLocale } from "@/lib/prefs";

export const metadata: Metadata = { title: "Código", robots: { index: false } };

// Segundo passo da entrada, para quem ativou a verificação em dois passos
export default async function Codigo() {
  const locale = await getLocale();
  const t = accountTexts(locale).code;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="animate-rise font-display text-3xl">{t.title}</h1>
        <p className="mt-2 animate-rise text-muted [animation-delay:80ms]">{t.lead}</p>
        <div className="mt-8 animate-rise [animation-delay:160ms]">
          <CodeForm t={t} />
        </div>
      </main>
    </>
  );
}
