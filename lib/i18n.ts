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

export function formatMoney(locale: Locale, amount: number): string {
  const currency = localeMeta[locale].currency;
  const decimals = Number.isInteger(amount) ? 0 : 2;
  const n = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
  return currency === "BRL" ? `R$ ${n}` : `${n} €`;
}

// Preço do plano: mensal, ou o total anual
export function formatPrice(locale: Locale, plan: PlanKey, interval: "month" | "year" = "month"): string {
  const p = site.plans[plan];
  const brl = localeMeta[locale].currency === "BRL";
  return formatMoney(locale, interval === "year" ? (brl ? p.yearBrl : p.yearEur) : brl ? p.priceBrl : p.priceEur);
}

// Equivalente mensal do plano anual (ex.: 150 € / 12 = 12,50 €)
export function formatYearlyPerMonth(locale: Locale, plan: PlanKey): string {
  const p = site.plans[plan];
  const total = localeMeta[locale].currency === "BRL" ? p.yearBrl : p.yearEur;
  return formatMoney(locale, Math.round((total / 12) * 100) / 100);
}

// Custo por dia do plano mensal mais barato (para a secção de valor)
export function formatPerDay(locale: Locale): string {
  const p = site.plans.starter;
  const monthly = localeMeta[locale].currency === "BRL" ? p.priceBrl : p.priceEur;
  return formatMoney(locale, Math.round((monthly / 30) * 100) / 100);
}

// Trimestre com a ordinal de cada mercado: "3.º trimestre" (PT), "3º trimestre" (BR), "3.er trimestre" (ES)
function quarterLabel(q: number, year: number, locale: Locale): string {
  if (locale === "es-ES") return `${q}.${q === 1 || q === 3 ? "er" : "º"} trimestre de ${year}`;
  return `${q}${locale === "pt-BR" ? "º" : ".º"} trimestre de ${year}`;
}

// Trimestre «de calendário»: 3 meses a começar em janeiro, abril, julho ou outubro
const isQuarter = (period: string, months: number) => months === 3 && [1, 4, 7, 10].includes(Number(period.slice(5, 7)));

// Nome do mês: "setembro" ou, com ano, "setembro de 2026"
function monthLabel(period: string, locale: Locale, withYear: boolean): string {
  const d = new Date(`${period.slice(0, 7)}-01T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, { month: "long", ...(withYear ? { year: "numeric" as const } : {}), timeZone: "UTC" }).format(d).toLowerCase();
}

// Último mês de um pedido ("2026-08-01" com 2 meses -> "2026-09-01")
export function periodEnd(period: string, months: number): string {
  const [y, m] = period.slice(0, 7).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months - 1, 1)).toISOString().slice(0, 10);
}

// "2026-09-01" -> "Setembro de 2026"; trimestre -> "3.º trimestre de 2026";
// vários meses -> "Agosto a setembro de 2026" (ou "Dezembro de 2025 a fevereiro de 2026")
export function formatPeriod(period: string, locale: Locale, months = 1): string {
  if (isQuarter(period, months)) {
    const [y, m] = period.slice(0, 7).split("-").map(Number);
    return quarterLabel(Math.floor((m - 1) / 3) + 1, y, locale);
  }
  let s: string;
  if (months > 1) {
    const end = periodEnd(period, months);
    const sameYear = period.slice(0, 4) === end.slice(0, 4);
    s = `${monthLabel(period, locale, !sameYear)} a ${monthLabel(end, locale, true)}`;
  } else s = monthLabel(period, locale, true);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Período com a preposição certa, para usar a meio de uma frase:
// "de setembro de 2026" / "do 3.º trimestre de 2026" (PT, BR) · "de septiembre de 2026" / "del 3.er trimestre de 2026" (ES)
// Vários meses: "de agosto a setembro de 2026"
export function periodOf(period: string, locale: Locale, months = 1): string {
  if (isQuarter(period, months)) return `${locale === "es-ES" ? "del" : "do"} ${formatPeriod(period, locale, 3)}`;
  return `de ${formatPeriod(period, locale, months).toLowerCase()}`;
}

// Nome curto do mês para separar os documentos num pedido de vários meses ("agosto", ou "dezembro 2025")
export function monthTag(period: string, locale: Locale, withYear: boolean): string {
  const d = new Date(`${period.slice(0, 7)}-01T00:00:00Z`);
  const name = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(d).toLowerCase();
  return withYear ? `${name} ${period.slice(0, 4)}` : name;
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
