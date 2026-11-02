// Guia «Como reencaminhar os anexos» (Definições → Receber anexos por e-mail)
import type { Locale } from "@/lib/i18n";

export type InboxHelpTexts = {
  open: string;
  title: string;
  tabs: [string, string, string];
  gmail: string[];
  outlook: string[];
  other: string[];
  tip: string;
  copy: string;
  copied: string;
  code: string;
  codeHint: string;
};

const pt: InboxHelpTexts = {
  open: "Como configurar",
  title: "Reencaminhar para o Bilonai os e-mails com anexos",
  tabs: ["Gmail", "Outlook", "Outro"],
  gmail: [
    "No Gmail, no computador: Definições (roda dentada) → Ver todas as definições → Encaminhamento e POP/IMAP → Adicionar um endereço de encaminhamento. Cole o endereço do Bilonai.",
    "O Gmail envia um código de confirmação para esse endereço. O código aparece aqui, nesta secção, em poucos segundos: copie-o e cole-o no Gmail.",
    "Separador Filtros e endereços bloqueados → Criar um novo filtro → marque «Tem anexo» → Criar filtro → «Encaminhar para» o endereço do Bilonai → Criar filtro.",
  ],
  outlook: [
    "No Outlook na web: Definições (roda dentada) → Correio → Regras → Adicionar nova regra.",
    "Condição: «Tem anexo». Ação: «Reencaminhar para» e cole o endereço do Bilonai. Guarde.",
    "No Microsoft 365, se a regra não funcionar, o administrador da empresa pode ter de permitir o reencaminhamento para fora.",
  ],
  other: [
    "No webmail do seu fornecedor, procure «Filtros», «Regras» ou «Reencaminhamento».",
    "Crie uma regra para os e-mails com anexos: reencaminhar uma cópia para o endereço do Bilonai.",
  ],
  tip: "Reencaminhe só os e-mails com anexos (não todo o correio). Só ficam guardados os anexos de clientes registados.",
  copy: "Copiar endereço",
  copied: "Copiado",
  code: "Código de confirmação do Gmail",
  codeHint: "Cole este código no Gmail para confirmar o reencaminhamento.",
};

const br: InboxHelpTexts = {
  ...pt,
  title: "Encaminhar para o Bilonai os e-mails com anexos",
  gmail: [
    "No Gmail, no computador: Configurações (engrenagem) → Ver todas as configurações → Encaminhamento e POP/IMAP → Adicionar um endereço de encaminhamento. Cole o endereço do Bilonai.",
    "O Gmail envia um código de confirmação para esse endereço. O código aparece aqui, nesta seção, em poucos segundos: copie e cole no Gmail.",
    "Aba Filtros e endereços bloqueados → Criar novo filtro → marque «Com anexo» → Criar filtro → «Encaminhar para» o endereço do Bilonai → Criar filtro.",
  ],
  outlook: [
    "No Outlook na web: Configurações (engrenagem) → Email → Regras → Adicionar nova regra.",
    "Condição: «Tem anexo». Ação: «Encaminhar para» e cole o endereço do Bilonai. Salve.",
    "No Microsoft 365, se a regra não funcionar, o administrador da empresa pode precisar liberar o encaminhamento externo.",
  ],
  other: [
    "No webmail do seu provedor, procure «Filtros», «Regras» ou «Encaminhamento».",
    "Crie uma regra para os e-mails com anexos: encaminhar uma cópia para o endereço do Bilonai.",
  ],
  tip: "Encaminhe só os e-mails com anexos (não todos os e-mails). Só ficam guardados os anexos de clientes cadastrados.",
  codeHint: "Cole este código no Gmail para confirmar o encaminhamento.",
};

const es: InboxHelpTexts = {
  open: "Cómo configurarlo",
  title: "Reenviar a Bilonai los correos con adjuntos",
  tabs: ["Gmail", "Outlook", "Otro"],
  gmail: [
    "En Gmail, en el ordenador: Configuración (rueda) → Ver todos los ajustes → Reenvío y correo POP/IMAP → Añadir una dirección de reenvío. Pega la dirección de Bilonai.",
    "Gmail envía un código de confirmación a esa dirección. El código aparece aquí, en esta sección, en pocos segundos: cópialo y pégalo en Gmail.",
    "Pestaña Filtros y direcciones bloqueadas → Crear un filtro → marca «Contiene archivos adjuntos» → Crear filtro → «Reenviar a» la dirección de Bilonai → Crear filtro.",
  ],
  outlook: [
    "En Outlook en la web: Configuración (rueda) → Correo → Reglas → Agregar nueva regla.",
    "Condición: «Tiene datos adjuntos». Acción: «Reenviar a» y pega la dirección de Bilonai. Guarda.",
    "En Microsoft 365, si la regla no funciona, el administrador puede tener que permitir el reenvío externo.",
  ],
  other: [
    "En el webmail de tu proveedor, busca «Filtros», «Reglas» o «Reenvío».",
    "Crea una regla para los correos con adjuntos: reenviar una copia a la dirección de Bilonai.",
  ],
  tip: "Reenvía solo los correos con adjuntos (no todo el correo). Solo se guardan los adjuntos de clientes registrados.",
  copy: "Copiar dirección",
  copied: "Copiada",
  code: "Código de confirmación de Gmail",
  codeHint: "Pega este código en Gmail para confirmar el reenvío.",
};

export function inboxHelpTexts(locale: Locale): InboxHelpTexts {
  return locale === "es-ES" ? es : locale === "pt-BR" ? br : pt;
}
