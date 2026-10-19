import "server-only";
import { cookies, headers } from "next/headers";
import { isLocale, localeFromAcceptLanguage, LOCALE_COOKIE, THEME_COOKIE, type Locale } from "@/lib/i18n";

// Idioma das páginas públicas: escolha guardada no cookie; sem escolha, o idioma do navegador
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
}

// Tema escolhido; sem escolha segue o sistema (resolvido no CSS)
export async function getTheme(): Promise<"light" | "dark" | undefined> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" ? v : undefined;
}
