// Idiomas suportados, metadados por país e formatação.
// Os textos vivem em lib/dictionaries/*; o pt-PT define o formato que os outros seguem.
import ptPT from "@/lib/dictionaries/pt-PT";
import esES from "@/lib/dictionaries/es-ES";
import ptBR from "@/lib/dictionaries/pt-BR";
import { site, type PlanKey } from "@/lib/site";

import { localeMeta, defaultLocale, type Locale } from "@/lib/locales";
export * from "@/lib/locales";

export type Dictionary = typeof ptPT;
const dictionaries: Record<Locale, Dictionary> = { "pt-PT": ptPT, "es-ES": esES, "pt-BR": ptBR };

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? ptPT;
}

// Deteta o idioma a partir do cabeçalho Accept-Language (primeira visita)
export function localeFromAcceptLanguage(header: string | null): Locale {
  const parts = (header ?? "").toLowerCase().split(",").map((p) => p.split(";")[0].trim());
  const first = parts.find((p) => p.startsWith("pt") || p.startsWith("es"));
  if (!first) return defaultLocale;
  if (first.startsWith("es")) return "es-ES";
  if (first === "pt-br") return "pt-BR";
  return "pt-PT";
}

export function formatPrice(locale: Locale, plan: PlanKey): string {
  const p = site.plans[plan];
  return localeMeta[locale].currency === "BRL" ? `R$ ${p.priceBrl}` : `${p.priceEur} €`;
}

// "2026-09-01" -> "Setembro de 2026"
export function formatPeriod(period: string, locale: Locale): string {
  const d = new Date(`${period.slice(0, 10)}T00:00:00Z`);
  const s = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Datas "AAAA-MM-DD" (sem hora) ou ISO completas
export function formatDate(iso: string, locale: Locale, withYear = true): string {
  const dateOnly = iso.length === 10;
  const d = dateOnly ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" as const } : {}),
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  }).format(d);
}

// Converte o telefone guardado no número que o wa.me espera (só dígitos, com indicativo do país)
export function whatsappNumber(phone: string | null | undefined, locale: Locale): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (digits.length < 6) return null;
  if (trimmed.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  const { dialCode } = localeMeta[locale];
  const localLength = locale === "pt-BR" ? 11 : 9;
  if (digits.startsWith(dialCode) && digits.length > localLength) return digits;
  if (locale === "pt-BR" && digits.startsWith("0")) digits = digits.slice(1);
  return dialCode + digits;
}

// Substitui {chaves} num modelo de texto
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k] : m));
}
