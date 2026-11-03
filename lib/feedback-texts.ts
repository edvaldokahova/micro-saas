// Textos do feedback (pedido no 4.º dia de teste e formulário fixo na Ajuda)
import type { Locale } from "@/lib/locales";

export type FeedbackTexts = {
  askTitle: string;
  askText: string;
  yes: string;
  no: string;
  writeTitle: string;
  placeholder: string;
  send: string;
  sending: string;
  close: string;
  left: string; // «{n}» é trocado pelo número (texto simples: passa do servidor para o navegador)
  thanks: string;
  thanksText: string;
  error: string;
  helpTitle: string;
  helpText: string;
};

const ptPT: FeedbackTexts = {
  askTitle: "Pode ajudar-nos a melhorar?",
  askText: "Já usa a ferramenta há alguns dias. Quer deixar uma opinião rápida sobre o que podemos melhorar?",
  yes: "Sim, deixar opinião",
  no: "Agora não",
  writeTitle: "O que podemos melhorar?",
  placeholder: "Conte-nos o que está a correr bem, o que falta ou o que o atrapalha.",
  send: "Enviar",
  sending: "A enviar…",
  close: "Fechar",
  left: "{n} caracteres disponíveis",
  thanks: "Obrigado pela sua opinião!",
  thanksText: "Lemos todas as mensagens. É assim que decidimos o que melhorar a seguir.",
  error: "Não foi possível enviar. Tente de novo.",
  helpTitle: "Deixar uma opinião",
  helpText: "Diga-nos o que podemos melhorar. Lemos todas as mensagens.",
};

const ptBR: FeedbackTexts = {
  ...ptPT,
  askTitle: "Pode nos ajudar a melhorar?",
  askText: "Você já usa a ferramenta há alguns dias. Quer deixar uma opinião rápida sobre o que podemos melhorar?",
  placeholder: "Conte o que está funcionando bem, o que falta ou o que atrapalha.",
  sending: "Enviando…",
  thanks: "Obrigado pela sua opinião!",
  error: "Não foi possível enviar. Tente novamente.",
};

const esES: FeedbackTexts = {
  askTitle: "¿Nos ayuda a mejorar?",
  askText: "Ya lleva unos días usando la herramienta. ¿Quiere dejarnos una opinión rápida sobre qué podemos mejorar?",
  yes: "Sí, dejar opinión",
  no: "Ahora no",
  writeTitle: "¿Qué podemos mejorar?",
  placeholder: "Cuéntenos qué funciona bien, qué falta o qué le estorba.",
  send: "Enviar",
  sending: "Enviando…",
  close: "Cerrar",
  left: "{n} caracteres disponibles",
  thanks: "¡Gracias por su opinión!",
  thanksText: "Leemos todos los mensajes. Así decidimos qué mejorar a continuación.",
  error: "No se pudo enviar. Inténtelo de nuevo.",
  helpTitle: "Dejar una opinión",
  helpText: "Díganos qué podemos mejorar. Leemos todos los mensajes.",
};

const all: Record<Locale, FeedbackTexts> = { "pt-PT": ptPT, "pt-BR": ptBR, "es-ES": esES };
export const feedbackTexts = (l: Locale) => all[l] ?? ptPT;
