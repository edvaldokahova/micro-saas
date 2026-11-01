// Fonte única de marca, contactos, preços e dados legais.
// Páginas de vendas, suporte e políticas leem tudo daqui: muda-se num só sítio.
export const site = {
  name: "Bilonai",
  // Página pública em bilonai.com, painel em app.bilonai.com, páginas dos clientes em entrega.bilonai.com
  url: "https://www.bilonai.com",
  appUrl: "https://app.bilonai.com",
  clientUrl: "https://entrega.bilonai.com",
  owner: "Horizontal Expansão, (SU), Lda",
  supportEmail: "suporte@bilonai.com",
  trialDays: 7,
  // Euros para Portugal e Espanha; reais para o Brasil (na Paddle: preço por país no mesmo produto)
  plans: {
    // Anual: abaixo de 10 mensalidades (mais de 2 meses grátis), com preço psicológico
    starter: { key: "starter", name: "Starter", priceEur: 15, priceBrl: 79, yearEur: 150, yearBrl: 790, clientLimit: 20, teamLimit: 3 },
    office: { key: "office", name: "Escritório", priceEur: 29, priceBrl: 149, yearEur: 290, yearBrl: 1490, clientLimit: 60, teamLimit: 15 },
  },
  // Vendedor e titular do serviço: a sociedade. O NIF entra em taxId assim que for atribuído
  // (enquanto estiver vazio, as páginas legais não o mostram).
  seller: "Horizontal Expansão - Comércio e Prestação de Serviços, (SU), Lda",
  legal: {
    registeredName: "Horizontal Expansão - Comércio e Prestação de Serviços, (SU), Lda" as string,
    taxId: "" as string, // NIF (Angola) — por atribuir
    address: "Rua Simeone Mukune, n.º 513, Bairro São José Canjaia, Comuna da Calima, Município e Província do Huambo, Angola" as string,
  },
  lastUpdated: "1 de novembro de 2026",
};

export type PlanKey = keyof typeof site.plans;
