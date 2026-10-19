// Fonte única de marca, contactos e dados legais (reutilizada nas páginas de venda, suporte e políticas)
export const site = {
  name: "Bilonai Entrega",
  shortName: "Entrega",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://entrega.bilonai.com",
  owner: "A Bilonai Group",
  supportEmail: "suporte@bilonai.com",
  defaultLocale: "pt-PT" as const,
  plans: {
    starter: { key: "starter", priceEur: 9, clientLimit: 20 },
    office: { key: "office", priceEur: 15, clientLimit: 60 },
  },
  trialDays: 14,
} as const;

export type PlanKey = keyof typeof site.plans;
