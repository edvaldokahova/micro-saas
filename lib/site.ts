// Fonte única de marca, contactos, preços e dados legais.
// Páginas de vendas, suporte e políticas leem tudo daqui: muda-se num só sítio.
export const site = {
  name: "Bilonai Entrega",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://entrega.bilonai.com",
  owner: "A Bilonai Group",
  supportEmail: "suporte@bilonai.com",
  trialDays: 5,
  plans: {
    starter: { key: "starter", name: "Starter", priceEur: 9, clientLimit: 20 },
    office: { key: "office", name: "Escritório", priceEur: 15, clientLimit: 60 },
  },
  // Preencher quando "A Bilonai Group" estiver registada. Só aparece nas páginas legais se tiver valor.
  legal: {
    registeredName: "" as string, // ex.: "A Bilonai Group, Lda."
    taxId: "" as string, // NIF / NIPC
    address: "" as string,
  },
  lastUpdated: "19 de outubro de 2026",
};

export type PlanKey = keyof typeof site.plans;
