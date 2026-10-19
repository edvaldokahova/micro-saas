"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Moon, Sun } from "lucide-react";
import { Flag } from "@/components/flags";
import { localeMeta, locales, THEME_COOKIE, type Locale } from "@/lib/locales";
import { setLocale } from "@/lib/actions/locale";

// Seletor de idioma com bandeiras
export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    start(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${localeMeta[locale].name}`}
        className={`flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-medium transition hover:border-gold/60 ${pending ? "opacity-60" : ""}`}
      >
        <Flag locale={locale} className="h-3.5 w-5" />
        <span className="hidden sm:inline">{localeMeta[locale].short}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="card absolute right-0 z-50 mt-2 w-56 animate-rise p-1.5 [animation-duration:.25s]"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-ink-3"
              >
                <Flag locale={l} />
                <span className="flex-1">{localeMeta[l].name}</span>
                {l === locale && <Check className="h-4 w-4 text-gold" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Alterna claro/escuro; a escolha fica num cookie para o servidor desenhar já no tema certo
export function ThemeToggle({ labels }: { labels: { light: string; dark: string } }) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") setTheme(attr);
    else setTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#faf8f4" : "#0a0b0d");
    setTheme(next);
  }

  const label = theme === "light" ? labels.dark : labels.light;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:border-gold/60 hover:text-ivory"
    >
      {theme === "light" ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
    </button>
  );
}
