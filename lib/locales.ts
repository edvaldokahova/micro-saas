// Idiomas e metadados por país. Sem textos: pode ser importado em componentes do navegador sem peso extra.
export const locales = ["pt-PT", "es-ES", "pt-BR"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt-PT";
export const LOCALE_COOKIE = "be_locale";
export const THEME_COOKIE = "be_theme";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

type Meta = {
  name: string;
  short: string;
  country: "PT" | "ES" | "BR";
  currency: "EUR" | "BRL";
  og: string;
  paddle: "pt" | "es";
  dialCode: string;
};

export const localeMeta: Record<Locale, Meta> = {
  "pt-PT": { name: "Português (PT)", short: "PT", country: "PT", currency: "EUR", og: "pt_PT", paddle: "pt", dialCode: "351" },
  "es-ES": { name: "Español (ES)", short: "ES", country: "ES", currency: "EUR", og: "es_ES", paddle: "es", dialCode: "34" },
  "pt-BR": { name: "Português (BR)", short: "BR", country: "BR", currency: "BRL", og: "pt_BR", paddle: "pt", dialCode: "55" },
};
