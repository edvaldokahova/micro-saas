import Link from "next/link";
import { Logo } from "@/components/logo";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label={site.name}>
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/#precos" className="hidden text-muted transition hover:text-ivory sm:block">
            Preços
          </Link>
          <Link href="/suporte" className="hidden text-muted transition hover:text-ivory sm:block">
            Suporte
          </Link>
          <Link href="/entrar" className="text-muted transition hover:text-ivory">
            Entrar
          </Link>
          <Link
            href="/registar"
            className="rounded-lg bg-gold px-4 py-2 font-semibold text-ink transition hover:brightness-110"
          >
            Testar grátis
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-muted">
            Um produto da {site.owner}. Documentos em falta, sob controlo.
          </p>
        </div>
        <ul className="space-y-2 text-muted">
          <li className="font-medium text-ivory">Produto</li>
          <li><Link className="hover:text-ivory" href="/#como-funciona">Como funciona</Link></li>
          <li><Link className="hover:text-ivory" href="/#precos">Preços</Link></li>
          <li><Link className="hover:text-ivory" href="/suporte">Suporte</Link></li>
        </ul>
        <ul className="space-y-2 text-muted">
          <li className="font-medium text-ivory">Legal</li>
          <li><Link className="hover:text-ivory" href="/termos">Termos de utilização</Link></li>
          <li><Link className="hover:text-ivory" href="/privacidade">Política de privacidade</Link></li>
          <li><Link className="hover:text-ivory" href="/reembolsos">Cancelamento e reembolsos</Link></li>
        </ul>
      </div>
      <div className="border-t border-line/70 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {site.owner} · <a className="hover:text-ivory" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
      </div>
    </footer>
  );
}
