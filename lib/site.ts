// Fonte única de marca, contactos, preços e dados legais.
// Páginas de vendas, suporte e políticas leem tudo daqui: muda-se num só sítio.
export const site = {
  name: "Bilonai",
  // Página pública em bilonai.com, painel em app.bilonai.com, páginas dos clientes em entrega.bilonai.com
  url: "https://www.bilonai.com",
  appUrl: "https://app.bilonai.com",
  clientUrl: "https://entrega.bilonai.com",
  owner: "A Bilonai Group",
  supportEmail: "suporte@bilonai.com",
  trialDays: 5,
  // Euros para Portugal e Espanha; reais para o Brasil (na Paddle: preço por país no mesmo produto)
  plans: {
    // Anual: abaixo de 10 mensalidades (mais de 2 meses grátis), com preço psicológico
    starter: { key: "starter", name: "Starter", priceEur: 9, priceBrl: 49, yearEur: 89, yearBrl: 489, clientLimit: 20, teamLimit: 3 },
    office: { key: "office", name: "Escritório", priceEur: 15, priceBrl: 79, yearEur: 149, yearBrl: 789, clientLimit: 60, teamLimit: 15 },
  },
  // Vendedor: pessoa singular a operar sob a marca "A Bilonai Group".
  // Quando a empresa for registada, trocar aqui (nome, NIF e morada) e as páginas legais atualizam-se sozinhas.
  seller: "Edvaldo Eugénio Cahova Eduardo",
  legal: {
    registeredName: "Edvaldo Eugénio Cahova Eduardo (pessoa singular, sob a marca A Bilonai Group)" as string,
    taxId: "023173713LA056" as string, // NIF (Angola)
    address: "Rua Simeone Mukune, bairro São José Canjaia, Huambo, Angola" as string,
  },
  lastUpdated: "19 de outubro de 2026",
};

export type PlanKey = keyof typeof site.plans;
