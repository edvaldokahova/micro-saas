// Dicionário mínimo. Cada bloco novo acrescenta só as chaves de que precisa.
export const locales = ["pt-PT", "es-ES"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

const dict = {
  "pt-PT": {
    tagline: "Os documentos em falta dos seus clientes, num só painel.",
    status: { pending: "Em falta", sent: "Enviado pelo cliente", received: "Recebido" },
    complete: "Completo",
    incomplete: "Incompleto",
  },
  "es-ES": {
    tagline: "La documentación pendiente de tus clientes, en un solo panel.",
    status: { pending: "Pendiente", sent: "Enviado por el cliente", received: "Recibido" },
    complete: "Completo",
    incomplete: "Incompleto",
  },
} as const;

export type Dictionary = (typeof dict)[Locale];

export function t(locale: Locale = "pt-PT"): Dictionary {
  return dict[locale] ?? dict["pt-PT"];
}

export function formatPeriod(period: string, locale: Locale): string {
  const d = new Date(`${period}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}
