"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBilling, IconClients, IconLedger, IconSettings } from "@/components/icons";

const items = [
  { href: "/app", key: "dashboard", icon: IconLedger },
  { href: "/app/clientes", key: "clients", icon: IconClients },
  { href: "/app/definicoes", key: "settings", icon: IconSettings },
  { href: "/app/assinatura", key: "billing", icon: IconBilling },
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
    <nav className="hidden items-stretch gap-6 md:flex">
        {items.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`-mb-px flex items-center gap-2 border-b-2 text-sm transition ${isActive(path, href) ? "border-ivory text-ivory" : "border-transparent text-muted hover:text-ivory"}`}
          >
            <Icon className="h-4 w-4" />
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
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ivory/80 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {items.map(({ href, key, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href}>
                <Link href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${active ? "text-ivory" : "text-muted"}`}>
                  <Icon className="h-[22px] w-[22px]" />
                  {labels[key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
  );
}
