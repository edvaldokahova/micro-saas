// Textos das «Integrações» (Definições): Google Drive e, brevemente, OneDrive/SharePoint
import type { Locale } from "@/lib/i18n";

export type IntegrationTexts = {
  title: string;
  lead: string;
  drive: {
    desc: string;
    connect: string;
    connectedAs: string; // «{email}»
    auto: string;
    autoHint: string;
    sendNow: string;
    pending: string; // «{n}»
    allSynced: string;
    sent: string; // «{n}»
    failed: string; // «{n}»
    open: string;
    disconnect: string;
    disconnectConfirm: string;
    expired: string;
    reconnect: string;
    privacy: string;
    notReady: string;
  };
  soon: { name: string; desc: string; badge: string };
  toast: { connected: string; cancel: string; scope: string; error: string };
};

const pt: IntegrationTexts = {
  title: "Integrações",
  lead: "Ligue o Bilonai à pasta do escritório. Cada documento arrumado é copiado para lá, por cliente, mês e documento, e fica guardado mesmo depois dos 90 dias no Bilonai.",
  drive: {
    desc: "Copia os documentos para a pasta «Bilonai» do Drive do escritório.",
    connect: "Ligar ao Google Drive",
    connectedAs: "Ligado a {email}",
    auto: "Enviar automaticamente",
    autoHint: "Cada documento arrumado vai para o Drive logo a seguir.",
    sendNow: "Enviar agora",
    pending: "{n} por enviar",
    allSynced: "Está tudo no Drive.",
    sent: "{n} enviados para o Drive.",
    failed: "{n} não foram enviados. Carregue em «Enviar agora» para tentar de novo.",
    open: "Abrir pasta",
    disconnect: "Desligar",
    disconnectConfirm: "Desligar o Google Drive? Os ficheiros que já estão no Drive ficam lá; os novos deixam de ser copiados.",
    expired: "A ligação ao Google Drive expirou. Ligue de novo para continuar a enviar.",
    reconnect: "Ligar de novo",
    privacy: "O Bilonai só vê as pastas e os ficheiros que ele próprio cria no seu Drive.",
    notReady: "A ligação ao Google Drive está a ser ativada. Tente de novo mais tarde.",
  },
  soon: { name: "OneDrive e SharePoint", desc: "Para escritórios que usam o Microsoft 365.", badge: "Brevemente" },
  toast: {
    connected: "Google Drive ligado. A pasta «Bilonai» já está no seu Drive.",
    cancel: "A ligação ao Google Drive foi cancelada.",
    scope: "Para ligar, deixe marcada a permissão do Google Drive no ecrã do Google.",
    error: "Não foi possível ligar ao Google Drive. Tente de novo.",
  },
};

const br: IntegrationTexts = {
  ...pt,
  lead: "Conecte o Bilonai à pasta do escritório. Cada documento organizado é copiado para lá, por cliente, mês e documento, e fica guardado mesmo depois dos 90 dias no Bilonai.",
  drive: {
    ...pt.drive,
    connect: "Conectar ao Google Drive",
    connectedAs: "Conectado a {email}",
    autoHint: "Cada documento organizado vai para o Drive logo em seguida.",
    failed: "{n} não foram enviados. Toque em «Enviar agora» para tentar de novo.",
    disconnect: "Desconectar",
    disconnectConfirm: "Desconectar o Google Drive? Os arquivos que já estão no Drive continuam lá; os novos deixam de ser copiados.",
    expired: "A conexão com o Google Drive expirou. Conecte de novo para continuar enviando.",
    reconnect: "Conectar de novo",
    privacy: "O Bilonai só vê as pastas e os arquivos que ele mesmo cria no seu Drive.",
    notReady: "A conexão com o Google Drive está sendo ativada. Tente de novo mais tarde.",
  },
  soon: { name: "OneDrive e SharePoint", desc: "Para escritórios que usam o Microsoft 365.", badge: "Em breve" },
  toast: {
    connected: "Google Drive conectado. A pasta «Bilonai» já está no seu Drive.",
    cancel: "A conexão com o Google Drive foi cancelada.",
    scope: "Para conectar, deixe marcada a permissão do Google Drive na tela do Google.",
    error: "Não foi possível conectar ao Google Drive. Tente de novo.",
  },
};

const es: IntegrationTexts = {
  title: "Integraciones",
  lead: "Conecta Bilonai con la carpeta del despacho. Cada documento ordenado se copia allí, por cliente, mes y documento, y queda guardado incluso después de los 90 días en Bilonai.",
  drive: {
    desc: "Copia los documentos a la carpeta «Bilonai» del Drive del despacho.",
    connect: "Conectar con Google Drive",
    connectedAs: "Conectado a {email}",
    auto: "Enviar automáticamente",
    autoHint: "Cada documento ordenado va al Drive justo después.",
    sendNow: "Enviar ahora",
    pending: "{n} por enviar",
    allSynced: "Todo está en el Drive.",
    sent: "{n} enviados al Drive.",
    failed: "{n} no se han enviado. Pulsa «Enviar ahora» para intentarlo de nuevo.",
    open: "Abrir carpeta",
    disconnect: "Desconectar",
    disconnectConfirm: "¿Desconectar Google Drive? Los archivos que ya están en el Drive se quedan allí; los nuevos dejan de copiarse.",
    expired: "La conexión con Google Drive ha caducado. Vuelve a conectar para seguir enviando.",
    reconnect: "Volver a conectar",
    privacy: "Bilonai solo ve las carpetas y los archivos que él mismo crea en tu Drive.",
    notReady: "La conexión con Google Drive se está activando. Inténtalo más tarde.",
  },
  soon: { name: "OneDrive y SharePoint", desc: "Para despachos que usan Microsoft 365.", badge: "Próximamente" },
  toast: {
    connected: "Google Drive conectado. La carpeta «Bilonai» ya está en tu Drive.",
    cancel: "Se ha cancelado la conexión con Google Drive.",
    scope: "Para conectar, deja marcado el permiso de Google Drive en la pantalla de Google.",
    error: "No se ha podido conectar con Google Drive. Inténtalo de nuevo.",
  },
};

export function integrationTexts(locale: Locale): IntegrationTexts {
  return locale === "es-ES" ? es : locale === "pt-BR" ? br : pt;
}
