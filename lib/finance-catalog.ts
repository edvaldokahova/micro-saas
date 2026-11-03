// Catálogo das ferramentas pagas da empresa (planos e preços públicos, em dólares por mês).
// O preço de cada linha fica gravado na base de dados quando se ativa, por isso mudar aqui
// não altera meses passados. Para um plano que não esteja na lista, escreve-se o valor à mão.
export type ToolPlan = { name: string; usd: number };
export type Tool = { key: string; name: string; logo: string; what: string; plans: ToolPlan[] };

export const TOOLS: Tool[] = [
  { key: "claude", name: "Claude", logo: "/brand/fin/claude.svg", what: "Desenvolvimento e operação", plans: [{ name: "Pro", usd: 20 }, { name: "Max 5x", usd: 100 }, { name: "Max 20x", usd: 200 }] },
  { key: "vercel", name: "Vercel", logo: "/brand/fin/vercel.svg", what: "Alojamento do site e da app", plans: [{ name: "Pro", usd: 20 }] },
  { key: "supabase", name: "Supabase", logo: "/brand/fin/supabase.png", what: "Base de dados e ficheiros", plans: [{ name: "Pro", usd: 25 }, { name: "Team", usd: 599 }] },
  { key: "resend", name: "Resend", logo: "/brand/fin/resend.svg", what: "E-mails (lembretes e entradas)", plans: [{ name: "Pro", usd: 20 }, { name: "Scale", usd: 90 }] },
];

// Plataformas de anúncios (o gasto é registado por mês: previsto e real)
export const AD_PLATFORMS = [
  { key: "meta", name: "Meta (Facebook e Instagram)", logo: "/brand/meta.png" },
  { key: "google", name: "Google Ads", logo: "/brand/fin/google-ads.png" },
  { key: "x", name: "X", logo: "/brand/fin/x.png" },
] as const;
export type AdPlatform = (typeof AD_PLATFORMS)[number]["key"];

// Ícones para os custos extra (internet, renda, etc.)
export const EXTRA_ICONS: Record<string, string> = {
  africell: "/brand/fin/africell.png",
  building: "/brand/fin/building.png",
};

export const CURRENCIES = ["USD", "EUR", "AOA"] as const;
export type Currency = (typeof CURRENCIES)[number];

// As 4 caixas: chave, nome e para onde vai o dinheiro
export const BOXES = [
  { key: "reinvest", name: "Reinvestimento e custos técnicos", where: "Fica na conta Grey da empresa (dólares)" },
  { key: "local", name: "Liquidez local: contabilidade e AGT", where: "Convertido e enviado para o BFA da empresa (kwanzas)" },
  { key: "tax", name: "Provisão de impostos e lucro retido", where: "Fica guardado na conta Grey da empresa (dólares)" },
  { key: "founder", name: "Recompensa do fundador", where: "Parte para o BAI (kwanzas), o resto para a Grey pessoal" },
] as const;
export type BoxKey = (typeof BOXES)[number]["key"];
