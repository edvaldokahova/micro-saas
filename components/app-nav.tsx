"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, Settings, Users } from "lucide-react";

const items = [
  { href: "/app", key: "dashboard", icon: LayoutDashboard },
  { href: "/app/clientes", key: "clients", icon: Users },
  { href: "/app/definicoes", key: "settings", icon: Settings },
  { href: "/app/assinatura", key: "billing", icon: CreditCard },
] as const;

type Labels = Record<(typeof items)[number]["key"], string>;

function isActive(path: string, href: string) {
  if (href === "/app") return path === "/app" || path.startsWith("/app/pedidos");
  return path.startsWith(href);
}

// Navegação do painel no topo (ecrãs grandes)
export function AppNav({ labels }: { labels: Labels }) {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
        {items.map(({ href, key }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm transition ${isActive(path, href) ? "bg-ink-3 text-ivory" : "text-muted hover:text-ivory"}`}
          >
            {labels[key]}
          </Link>
        ))}
    </nav>
  );
}

// Barra inferior no telemóvel (fora do cabeçalho: o desfoque do cabeçalho prenderia o "fixed")
export function AppTabBar({ labels }: { labels: Labels }) {
  const path = usePathname();
  return (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {items.map(({ href, key, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href}>
                <Link href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${active ? "text-gold" : "text-muted"}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                  {labels[key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
  );
}
