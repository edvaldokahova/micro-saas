import Link from "next/link";
import { CookieSettings } from "@/components/meta-pixel";
import { MobileMenu } from "@/components/mobile-menu";
import { HeaderShell } from "@/components/header-shell";
import { Logo } from "@/components/logo";
import { LocaleSwitcher, ThemeToggle } from "@/components/preferences";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";
import { site } from "@/lib/site";

export async function SiteHeader() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const links = [
    { href: `${site.url}/#como-funciona`, label: d.nav.how },
    { href: `${site.url}/precos`, label: d.nav.pricing },
    { href: `${site.url}/suporte`, label: d.nav.support },
  ];

  return (
    <HeaderShell>
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href={`${site.url}/`} aria-label={site.name} className="shrink-0">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hidden px-2.5 text-ivory/75 transition hover:text-ivory lg:block">
              {l.label}
            </Link>
          ))}
          <LocaleSwitcher locale={locale} label={d.common.language} />
          <ThemeToggle labels={{ light: d.common.themeLight, dark: d.common.themeDark }} />
          <Link href={`${site.appUrl}/entrar`} className="btn btn-secondary btn-sm hidden sm:inline-flex">
            {d.nav.signIn}
          </Link>
          <Link href={`${site.appUrl}/registar`} className="btn btn-primary btn-sm hidden sm:inline-flex">
            {d.nav.tryFree}
          </Link>
          <MobileMenu
            label="Menu"
            closeLabel={locale === "es-ES" ? "Cerrar menú" : "Fechar menu"}
            links={links}
            signIn={{ href: `${site.appUrl}/entrar`, label: d.nav.signIn }}
            tryFree={{ href: `${site.appUrl}/registar`, label: d.nav.tryFree }}
          />
        </nav>
      </div>
    </HeaderShell>
  );
}

export async function SiteFooter() {
  const d = getDictionary(await getLocale());
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-sm sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs leading-6 text-muted">{d.nav.footerTagline(site.owner)}</p>
        </div>
        <ul className="space-y-2.5 text-muted">
          <li className="mono-label">{d.nav.product}</li>
          <li><Link className="transition hover:text-ivory" href={`${site.url}/#como-funciona`}>{d.nav.how}</Link></li>
          <li><Link className="transition hover:text-ivory" href={`${site.url}/precos`}>{d.nav.pricing}</Link></li>
          <li><Link className="transition hover:text-ivory" href={`${site.url}/suporte`}>{d.nav.support}</Link></li>
        </ul>
        <ul className="space-y-2.5 text-muted">
          <li className="mono-label">{d.nav.legal}</li>
          <li><Link className="transition hover:text-ivory" href={`${site.url}/termos`}>{d.nav.terms}</Link></li>
          <li><Link className="transition hover:text-ivory" href={`${site.url}/privacidade`}>{d.nav.privacy}</Link></li>
          <li><Link className="transition hover:text-ivory" href={`${site.url}/reembolsos`}>{d.nav.refunds}</Link></li>
          <li><CookieSettings label="Cookies" /></li>
        </ul>
      </div>
      <div className="mx-auto max-w-6xl border-t border-line px-5 py-5 font-mono text-[11px] text-muted">
        © {new Date().getFullYear()} {site.owner}
      </div>
    </footer>
  );
}
