// Textos do «Domínio próprio» (Definições) e do convite para o plano Escritório
import type { Locale } from "@/lib/i18n";

export type DomainTexts = {
  title: string;
  badge: string;
  lead: string;
  label: string;
  placeholder: string;
  hint: string;
  activate: string;
  pending: string;
  active: string;
  step: string;
  type: string;
  name: string;
  value: string;
  txtStep: string;
  wait: string;
  verify: string;
  stillPending: string;
  activeText: string; // «{domain}»
  remove: string;
  removeConfirm: string;
  copy: string;
  copied: string;
  errors: { invalid: string; taken: string; setup: string; plan: string; generic: string };
  upsell: { title: string; text: string; points: string[]; cta: string; later: string };
};

const pt: DomainTexts = {
  title: "Domínio próprio",
  badge: "Plano Escritório",
  lead: "Os links que os clientes recebem passam a ter o endereço do escritório, por exemplo docs.oseuescritorio.pt, em vez de docs.bilonai.com.",
  label: "Endereço",
  placeholder: "docs.oseuescritorio.pt",
  hint: "Use um subdomínio do site do escritório (a parte antes do nome, como docs.).",
  activate: "Ativar",
  pending: "À espera do DNS",
  active: "Ativo",
  step: "No sítio onde gere o domínio (PTisp, Amen, GoDaddy…), crie este registo:",
  type: "Tipo",
  name: "Nome",
  value: "Valor",
  txtStep: "Crie também este registo, para confirmar que o domínio é seu:",
  wait: "Depois de o criar, pode demorar de alguns minutos a algumas horas. O cadeado de segurança (https) é criado automaticamente.",
  verify: "Verificar agora",
  stillPending: "O domínio ainda não aponta para o Bilonai. Confirme o registo e tente de novo daqui a uns minutos.",
  activeText: "Os links dos pedidos novos já saem com https://{domain}.",
  remove: "Remover domínio",
  removeConfirm: "Remover o domínio? Os links novos voltam a sair com docs.bilonai.com e os links já enviados com o seu domínio deixam de abrir.",
  copy: "Copiar",
  copied: "Copiado",
  errors: {
    invalid: "Escreva um subdomínio válido, por exemplo docs.oseuescritorio.pt.",
    taken: "Este domínio já está a ser usado noutra conta.",
    setup: "Esta função está a ser ligada. Tente de novo mais tarde.",
    plan: "O domínio próprio é do plano Escritório.",
    generic: "Não foi possível concluir. Tente de novo.",
  },
  upsell: {
    title: "O domínio próprio é do plano Escritório",
    text: "Cada link que envia passa a levar o nome do seu escritório. Os clientes reconhecem logo quem lhes pede os documentos.",
    points: ["Links com o endereço do escritório, sem a nossa marca", "Até 60 clientes e vários responsáveis", "Cadeado de segurança incluído, sem custos extra"],
    cta: "Mudar para o Escritório",
    later: "Agora não",
  },
};

const br: DomainTexts = {
  ...pt,
  lead: "Os links que os clientes recebem passam a ter o endereço do escritório, por exemplo docs.seuescritorio.com.br, em vez de docs.bilonai.com.",
  placeholder: "docs.seuescritorio.com.br",
  hint: "Use um subdomínio do site do escritório (a parte antes do nome, como docs.).",
  pending: "Aguardando o DNS",
  step: "Onde você gerencia o domínio (Registro.br, Hostinger, GoDaddy…), crie este registro:",
  txtStep: "Crie também este registro, para confirmar que o domínio é seu:",
  wait: "Depois de criar, pode levar de alguns minutos a algumas horas. O cadeado de segurança (https) é criado automaticamente.",
  stillPending: "O domínio ainda não aponta para o Bilonai. Confira o registro e tente de novo em alguns minutos.",
  activeText: "Os links das novas solicitações já saem com https://{domain}.",
  removeConfirm: "Remover o domínio? Os links novos voltam a sair com docs.bilonai.com e os links já enviados com o seu domínio deixam de abrir.",
  errors: { ...pt.errors, invalid: "Digite um subdomínio válido, por exemplo docs.seuescritorio.com.br.", setup: "Esta função está sendo ativada. Tente de novo mais tarde." },
  upsell: {
    title: "O domínio próprio é do plano Escritório",
    text: "Cada link que você envia passa a levar o nome do seu escritório. Os clientes reconhecem na hora quem está pedindo os documentos.",
    points: ["Links com o endereço do escritório, sem a nossa marca", "Até 60 clientes e vários responsáveis", "Cadeado de segurança incluído, sem custo extra"],
    cta: "Mudar para o Escritório",
    later: "Agora não",
  },
};

const es: DomainTexts = {
  title: "Dominio propio",
  badge: "Plan Despacho",
  lead: "Los enlaces que reciben tus clientes llevan la dirección del despacho, por ejemplo docs.tudespacho.es, en lugar de docs.bilonai.com.",
  label: "Dirección",
  placeholder: "docs.tudespacho.es",
  hint: "Usa un subdominio de la web del despacho (la parte antes del nombre, como docs.).",
  activate: "Activar",
  pending: "Esperando el DNS",
  active: "Activo",
  step: "Donde gestionas el dominio (Arsys, IONOS, GoDaddy…), crea este registro:",
  type: "Tipo",
  name: "Nombre",
  value: "Valor",
  txtStep: "Crea también este registro, para confirmar que el dominio es tuyo:",
  wait: "Después de crearlo, puede tardar de unos minutos a unas horas. El candado de seguridad (https) se crea automáticamente.",
  verify: "Comprobar ahora",
  stillPending: "El dominio todavía no apunta a Bilonai. Revisa el registro y vuelve a intentarlo en unos minutos.",
  activeText: "Los enlaces de las nuevas solicitudes ya salen con https://{domain}.",
  remove: "Quitar dominio",
  removeConfirm: "¿Quitar el dominio? Los enlaces nuevos vuelven a salir con docs.bilonai.com y los ya enviados con tu dominio dejan de abrirse.",
  copy: "Copiar",
  copied: "Copiado",
  errors: {
    invalid: "Escribe un subdominio válido, por ejemplo docs.tudespacho.es.",
    taken: "Este dominio ya se usa en otra cuenta.",
    setup: "Esta función se está activando. Vuelve a intentarlo más tarde.",
    plan: "El dominio propio es del plan Despacho.",
    generic: "No se ha podido completar. Inténtalo de nuevo.",
  },
  upsell: {
    title: "El dominio propio es del plan Despacho",
    text: "Cada enlace que envías lleva el nombre de tu despacho. Tus clientes reconocen al momento quién les pide los documentos.",
    points: ["Enlaces con la dirección del despacho, sin nuestra marca", "Hasta 60 clientes y varios responsables", "Candado de seguridad incluido, sin coste extra"],
    cta: "Cambiar al plan Despacho",
    later: "Ahora no",
  },
};

export function domainTexts(locale: Locale): DomainTexts {
  return locale === "es-ES" ? es : locale === "pt-BR" ? br : pt;
}
