"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBilling, IconClients, IconLedger, IconSettings } from "@/components/icons";

const items = [
  { href: "/", key: "dashboard", icon: IconLedger },
  { href: "/clientes", key: "clients", icon: IconClients },
  { href: "/definicoes", key: "settings", icon: IconSettings },
  { href: "/assinatura", key: "billing", icon: IconBilling },
] as const;

type Labels = Record<(typeof items)[number]["key"], string>;

// Funciona com o endereço curto (app.bilonai.com/clientes) e com a rota interna (/app/clientes)
function isActive(raw: string, href: string) {
  const path = raw.replace(/^\/app(?=\/|$)/, "") || "/";
  if (href === "/") return path === "/" || path.startsWith("/pedidos");
  return path.startsWith(href);
}

// Navegação do painel no topo (ecrãs grandes)
type Key = (typeof items)[number]["key"];

export function AppNav({ labels, show }: { labels: Labels; show: Key[] }) {
  const path = usePathname();
  return (
    <nav className="hidden items-stretch gap-6 md:flex">
        {items.filter((x) => show.includes(x.key)).map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`-mb-px flex items-center gap-2 border-b-2 text-sm transition ${isActive(path, href) ? "border-ivory text-ivory" : "border-transparent text-muted hover:text-ivory"}`}
          >
            <Icon className="h-4 w-4" active={isActive(path, href)} />
            {labels[key]}
          </Link>
        ))}
    </nav>
  );
}

// Barra inferior no telemóvel (fora do cabeçalho: o desfoque do cabeçalho prenderia o "fixed")
export function AppTabBar({ labels, show }: { labels: Labels; show: Key[] }) {
  const path = usePathname();
  return (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${show.length}, minmax(0, 1fr))` }}>
          {items.filter((x) => show.includes(x.key)).map(({ href, key, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${active ? "font-medium text-ivory" : "text-muted"}`}
                >
                  <Icon className="h-[22px] w-[22px]" active={active} />
                  {labels[key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
  );
}
