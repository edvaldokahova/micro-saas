// Textos da aba Desempenho (só para quem gere a conta)
import type { Locale } from "@/lib/locales";

export type PerfTexts = {
  nav: string;
  title: string;
  lead: string;
  periods: { m: string; q: string; y: string };
  sent: string;
  sentHint: (auto: number, manual: number) => string;
  openRate: string;
  openHint: (opened: number, sent: number) => string;
  viewed: string;
  viewedHint: (viewed: number, total: number) => string;
  onTime: string;
  onTimeHint: (n: number) => string;
  avgDays: string;
  avgDaysHint: string;
  days: (n: number) => string;
  remindersTitle: string;
  remindersHint: string;
  seriesSent: string;
  seriesOpened: string;
  docsTitle: string;
  docsHint: string;
  docNoun: [string, string];
  channelsTitle: string;
  channels: { page: string; email: string; office: string };
  docsTotal: string;
  lateTitle: string;
  lateHint: string;
  lateNone: string;
  lateRow: (n: number, avg: number) => string;
  tipsTitle: string;
  tips: {
    lowOpen: string;
    noAuto: string;
    late: (name: string) => string;
    good: string;
    empty: string;
  };
  openNote: string;
  weekShort: string;
};

const ptPT: PerfTexts = {
  nav: "Desempenho",
  title: "Desempenho",
  lead: "Como está a correr a recolha: lembretes, entregas e os clientes que precisam de mais atenção.",
  periods: { m: "Este mês", q: "Este trimestre", y: "Este ano" },
  sent: "Lembretes enviados",
  sentHint: (a, m) => `${a} automáticos · ${m} à mão`,
  openRate: "Taxa de abertura",
  openHint: (o, s) => `${o} de ${s} e-mails automáticos abertos`,
  viewed: "Pedidos vistos",
  viewedHint: (v, t) => `${v} de ${t} clientes abriram o link`,
  onTime: "Entregas no prazo",
  onTimeHint: (n) => `em ${n} ${n === 1 ? "pedido com prazo" : "pedidos com prazo"}`,
  avgDays: "Tempo até entregar",
  avgDaysHint: "média, do pedido ao último documento",
  days: (n) => (n === 1 ? "1 dia" : `${n} dias`),
  remindersTitle: "Lembretes automáticos",
  remindersHint: "Enviados e abertos em cada período",
  seriesSent: "Enviados",
  seriesOpened: "Abertos",
  docsTitle: "Documentos recebidos",
  docsHint: "Ficheiros que chegaram em cada período",
  docNoun: ["documento", "documentos"],
  channelsTitle: "Por onde chegam",
  channels: { page: "Link do pedido", email: "Resposta por e-mail", office: "Enviados pelo escritório" },
  docsTotal: "documentos",
  lateTitle: "Clientes que mais se atrasam",
  lateHint: "Pedidos entregues depois do prazo (ou ainda em falta com o prazo passado)",
  lateNone: "Nenhum atraso neste período. Excelente.",
  lateRow: (n, avg) => `${n} ${n === 1 ? "pedido atrasado" : "pedidos atrasados"} · ${avg} ${avg === 1 ? "dia" : "dias"} em média`,
  tipsTitle: "O que pode ajustar",
  tips: {
    lowOpen: "Menos de metade abre os lembretes. Experimente um assunto mais direto em Definições → Lembretes automáticos (ex.: «Faltam 2 documentos de outubro»).",
    noAuto: "Os lembretes automáticos estão desligados. Ligue-os em Definições: saem sozinhos e só para quem tem documentos em falta.",
    late: (name) => `${name} atrasa-se com frequência. Antecipe o primeiro lembrete para esse cliente ou fale com ele diretamente.`,
    good: "A recolha está a correr bem. Mantenha o ritmo e use o mesmo prazo todos os meses: os clientes habituam-se.",
    empty: "Ainda há poucos dados. Ao fim de um ou dois meses de uso, este painel mostra a evolução do escritório.",
  },
  openNote: "As aberturas são uma estimativa: alguns programas de e-mail (como o Apple Mail) abrem as imagens sozinhos e outros bloqueiam-nas.",
  weekShort: "sem",
};

const esES: PerfTexts = {
  nav: "Rendimiento",
  title: "Rendimiento",
  lead: "Cómo va la recogida: recordatorios, entregas y los clientes que necesitan más atención.",
  periods: { m: "Este mes", q: "Este trimestre", y: "Este año" },
  sent: "Recordatorios enviados",
  sentHint: (a, m) => `${a} automáticos · ${m} a mano`,
  openRate: "Tasa de apertura",
  openHint: (o, s) => `${o} de ${s} correos automáticos abiertos`,
  viewed: "Solicitudes vistas",
  viewedHint: (v, t) => `${v} de ${t} clientes abrieron el enlace`,
  onTime: "Entregas a tiempo",
  onTimeHint: (n) => `en ${n} ${n === 1 ? "solicitud con plazo" : "solicitudes con plazo"}`,
  avgDays: "Tiempo hasta entregar",
  avgDaysHint: "media, de la solicitud al último documento",
  days: (n) => (n === 1 ? "1 día" : `${n} días`),
  remindersTitle: "Recordatorios automáticos",
  remindersHint: "Enviados y abiertos en cada periodo",
  seriesSent: "Enviados",
  seriesOpened: "Abiertos",
  docsTitle: "Documentos recibidos",
  docsHint: "Archivos que llegaron en cada periodo",
  docNoun: ["documento", "documentos"],
  channelsTitle: "Por dónde llegan",
  channels: { page: "Enlace de la solicitud", email: "Respuesta por correo", office: "Subidos por la asesoría" },
  docsTotal: "documentos",
  lateTitle: "Clientes que más se retrasan",
  lateHint: "Solicitudes entregadas después del plazo (o aún pendientes con el plazo vencido)",
  lateNone: "Ningún retraso en este periodo. Excelente.",
  lateRow: (n, avg) => `${n} ${n === 1 ? "solicitud con retraso" : "solicitudes con retraso"} · ${avg} ${avg === 1 ? "día" : "días"} de media`,
  tipsTitle: "Qué puedes ajustar",
  tips: {
    lowOpen: "Menos de la mitad abre los recordatorios. Prueba un asunto más directo en Ajustes → Recordatorios automáticos (ej.: «Faltan 2 documentos de octubre»).",
    noAuto: "Los recordatorios automáticos están desactivados. Actívalos en Ajustes: salen solos y solo para quien tiene documentos pendientes.",
    late: (name) => `${name} se retrasa a menudo. Adelanta el primer recordatorio para ese cliente o habla con él directamente.`,
    good: "La recogida va bien. Mantén el ritmo y usa el mismo plazo cada mes: los clientes se acostumbran.",
    empty: "Aún hay pocos datos. Tras uno o dos meses de uso, este panel muestra la evolución de la asesoría.",
  },
  openNote: "Las aperturas son una estimación: algunos programas de correo (como Apple Mail) abren las imágenes solos y otros las bloquean.",
  weekShort: "sem",
};

const ptBR: PerfTexts = {
  ...ptPT,
  lead: "Como está indo a coleta: lembretes, entregas e os clientes que precisam de mais atenção.",
  sentHint: (a, m) => `${a} automáticos · ${m} manuais`,
  openHint: (o, s) => `${o} de ${s} e-mails automáticos abertos`,
  viewed: "Solicitações vistas",
  onTimeHint: (n) => `em ${n} ${n === 1 ? "solicitação com prazo" : "solicitações com prazo"}`,
  avgDaysHint: "média, da solicitação ao último documento",
  docsHint: "Arquivos que chegaram em cada período",
  channels: { page: "Link da solicitação", email: "Resposta por e-mail", office: "Enviados pelo escritório" },
  lateHint: "Solicitações entregues depois do prazo (ou ainda pendentes com o prazo vencido)",
  lateNone: "Nenhum atraso neste período. Excelente.",
  lateRow: (n, avg) => `${n} ${n === 1 ? "solicitação atrasada" : "solicitações atrasadas"} · ${avg} ${avg === 1 ? "dia" : "dias"} em média`,
  tipsTitle: "O que você pode ajustar",
  tips: {
    lowOpen: "Menos da metade abre os lembretes. Teste um assunto mais direto em Configurações → Cobranças automáticas (ex.: «Faltam 2 documentos de outubro»).",
    noAuto: "As cobranças automáticas estão desligadas. Ligue em Configurações: elas saem sozinhas e só para quem tem documentos pendentes.",
    late: (name) => `${name} costuma atrasar. Antecipe o primeiro lembrete para esse cliente ou fale com ele diretamente.`,
    good: "A coleta está indo bem. Mantenha o ritmo e use o mesmo prazo todo mês: os clientes se acostumam.",
    empty: "Ainda há poucos dados. Depois de um ou dois meses de uso, este painel mostra a evolução do escritório.",
  },
  openNote: "As aberturas são uma estimativa: alguns programas de e-mail (como o Apple Mail) abrem as imagens sozinhos e outros as bloqueiam.",
};

const packs: Record<Locale, PerfTexts> = { "pt-PT": ptPT, "es-ES": esES, "pt-BR": ptBR };
export const perfTexts = (l: Locale): PerfTexts => packs[l] ?? ptPT;
