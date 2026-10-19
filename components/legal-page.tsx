import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";
import { site } from "@/lib/site";

const updatedLabel = { "pt-PT": "Última atualização", "es-ES": "Última actualización", "pt-BR": "Última atualização" };

// Layout comum das páginas de texto (termos, privacidade, reembolsos, suporte)
export async function LegalPage({
  title,
  intro,
  children,
  translated = false,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  translated?: boolean;
}) {
  const locale = await getLocale();
  const note = getDictionary(locale).nav.legalLanguageNote;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="animate-rise font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 animate-rise text-muted [animation-delay:80ms]">{intro}</p>}
        {!translated && note && (
          <p className="mt-6 rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-muted">{note}</p>
        )}
        <div className="mt-10 space-y-8 text-[15px] leading-7 text-ivory/85 [&_a]:text-gold [&_a:hover]:underline [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ivory [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
          {children}
        </div>
        <p className="mt-14 border-t border-line/60 pt-5 text-xs text-muted">
          {updatedLabel[locale]}: {site.lastUpdated}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

// Identificação do responsável: mostra os dados legais só quando já existirem
export function Identity() {
  const { registeredName, taxId, address } = site.legal;
  return (
    <p>
      {registeredName || site.owner}
      {taxId ? ` · NIF ${taxId}` : ""}
      {address ? ` · ${address}` : ""} · <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
    </p>
  );
}
