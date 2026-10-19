import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { LocaleSwitcher, ThemeToggle } from "@/components/preferences";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";
import { site } from "@/lib/site";

export async function SiteHeader() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const links = [
    { href: "/#como-funciona", label: d.nav.how },
    { href: "/#precos", label: d.nav.pricing },
    { href: "/suporte", label: d.nav.support },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" aria-label={site.name} className="shrink-0">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hidden px-2 text-muted transition hover:text-ivory lg:block">
              {l.label}
            </Link>
          ))}
          <LocaleSwitcher locale={locale} label={d.common.language} />
          <ThemeToggle labels={{ light: d.common.themeLight, dark: d.common.themeDark }} />
          <Link href="/entrar" className="hidden px-2 text-muted transition hover:text-ivory sm:block">
            {d.nav.signIn}
          </Link>
          <Link href="/registar" className="btn btn-primary btn-sm hidden sm:inline-flex">
            {d.nav.tryFree}
          </Link>
          {/* Menu do telemóvel, sem JavaScript */}
          <details className="group relative sm:hidden">
            <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-lg border border-line text-muted [&::-webkit-details-marker]:hidden">
              <Menu className="h-4 w-4" aria-hidden />
              <span className="sr-only">Menu</span>
            </summary>
            <div className="card absolute right-0 z-50 mt-2 w-56 animate-rise p-2 [animation-duration:.25s]">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-ink-3">
                  {l.label}
                </Link>
              ))}
              <Link href="/entrar" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-ink-3">
                {d.nav.signIn}
              </Link>
              <Link href="/registar" className="btn btn-primary btn-sm mt-1 w-full">
                {d.nav.tryFree}
              </Link>
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const d = getDictionary(await getLocale());
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-sm sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs leading-6 text-muted">{d.nav.footerTagline(site.owner)}</p>
        </div>
        <ul className="space-y-2.5 text-muted">
          <li className="font-medium text-ivory">{d.nav.product}</li>
          <li><Link className="transition hover:text-ivory" href="/#como-funciona">{d.nav.how}</Link></li>
          <li><Link className="transition hover:text-ivory" href="/#precos">{d.nav.pricing}</Link></li>
          <li><Link className="transition hover:text-ivory" href="/suporte">{d.nav.support}</Link></li>
        </ul>
        <ul className="space-y-2.5 text-muted">
          <li className="font-medium text-ivory">{d.nav.legal}</li>
          <li><Link className="transition hover:text-ivory" href="/termos">{d.nav.terms}</Link></li>
          <li><Link className="transition hover:text-ivory" href="/privacidade">{d.nav.privacy}</Link></li>
          <li><Link className="transition hover:text-ivory" href="/reembolsos">{d.nav.refunds}</Link></li>
        </ul>
      </div>
      <div className="border-t border-line/60 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {site.owner} ·{" "}
        <a className="transition hover:text-ivory" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
      </div>
    </footer>
  );
}
