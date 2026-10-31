// Textos das boas-vindas (questionário), da página Conta e da entrada com palavra-passe / dois passos.
// Só texto simples: pode seguir para componentes do navegador.
import type { Locale } from "@/lib/locales";

export type WelcomeTexts = {
  step: string; // "{a} de {b}"
  back: string;
  q: { title: string; hint: string; options: { value: string; label: string; hint?: string }[] }[];
  doneTitle: string; // "{office}"
  doneLead: string;
  safe: string[];
  enter: string;
  error: string;
};

export type AccountTexts = {
  title: string;
  lead: string;
  emailTitle: string;
  emailCurrent: string;
  emailNew: string;
  emailChange: string;
  emailSent: string; // "{email}"
  emailChanged: string;
  signinTitle: string;
  signinHint: string;
  passwordNew: string;
  passwordRepeat: string;
  passwordSet: string;
  passwordChange: string;
  passwordSaved: string;
  passwordShort: string;
  passwordMismatch: string;
  mfaTitle: string;
  mfaHint: string;
  mfaOn: string;
  mfaOff: string;
  mfaEnable: string;
  mfaDisable: string;
  mfaDisableConfirm: string;
  mfaScan: string;
  mfaSecret: string;
  mfaCode: string;
  mfaConfirm: string;
  mfaWrong: string;
  cancel: string;
  saving: string;
  error: string;
  signOut: string;
  deleteTitle: string;
  deleteText: string;
  deleteType: string; // "{office}"
  deleteButton: string;
  deleteError: string;
  safeTitle: string;
  safe: string[];
};

export type LoginExtraTexts = {
  usePassword: string;
  useLink: string;
  password: string;
  submitPassword: string;
  wrongPassword: string;
};

export type CodeTexts = {
  title: string;
  lead: string;
  code: string;
  submit: string;
  wrong: string;
  lost: string;
  signOut: string;
};

export type GuideTexts = {
  title: string;
  lead: string;
  progress: string; // "{a} de {b}"
  hide: string;
  sampleName: string;
  steps: { title: string; text: string; action: string }[];
  orOwn: string;
  doneTitle: string;
  doneText: string;
};

type Pack = { welcome: WelcomeTexts; account: AccountTexts; login: LoginExtraTexts; code: CodeTexts; guide: GuideTexts };

const ptPT: Pack = {
  guide: {
    title: "Primeiros passos",
    lead: "Quatro passos curtos, com um cliente de exemplo. No fim, já sabe usar o Bilonai.",
    progress: "{a} de {b}",
    hide: "Ocultar guia",
    sampleName: "Cliente de exemplo",
    steps: [
      { title: "Crie um cliente de exemplo", text: "Com o seu e-mail e o pedido do mês já feito, para ver tudo a funcionar sem incomodar ninguém.", action: "Criar exemplo" },
      { title: "Seja o seu cliente por um minuto", text: "Abra a página que o cliente recebe e envie uma foto ou um PDF qualquer.", action: "Abrir a página do cliente" },
      { title: "Veja o ficheiro chegar arrumado", text: "Em Documentos, o ficheiro aparece no cliente e no documento certos.", action: "Ver Documentos" },
      { title: "Adicione os seus clientes", text: "Um a um, ou colados do Excel de uma só vez. Pode apagar o cliente de exemplo quando quiser.", action: "Adicionar clientes" },
    ],
    orOwn: "Prefere começar já com os seus clientes?",
    doneTitle: "Já sabe o essencial.",
    doneText: "É assim todos os meses: os clientes enviam pelo link (ou respondem ao lembrete com anexos) e o Bilonai arruma. Pode apagar o cliente de exemplo em Clientes.",
  },
  welcome: {
    step: "{a} de {b}",
    back: "Voltar",
    q: [
      {
        title: "Onde fica o seu escritório?",
        hint: "Preparamos o idioma, a moeda e os documentos habituais do seu país.",
        options: [
          { value: "PT", label: "Portugal" },
          { value: "BR", label: "Brasil" },
          { value: "ES", label: "Espanha" },
          { value: "other", label: "Outro país" },
        ],
      },
      {
        title: "Qual é a sua área?",
        hint: "Ajuda-nos a melhorar o Bilonai para quem o usa.",
        options: [
          { value: "accounting", label: "Contabilidade" },
          { value: "other", label: "Outra área", hint: "advocacia, consultoria, seguros…" },
        ],
      },
      {
        title: "Quantos clientes acompanha?",
        hint: "Para lhe sugerirmos o plano certo, sem surpresas.",
        options: [
          { value: "lt20", label: "Até 20" },
          { value: "20to60", label: "Entre 20 e 60" },
          { value: "gt60", label: "Mais de 60" },
        ],
      },
    ],
    doneTitle: "Tudo pronto, {office}.",
    doneLead: "A sua conta está preparada. Antes de entrar, o essencial sobre os seus dados:",
    safe: [
      "Ligação cifrada e dados guardados na União Europeia (Irlanda).",
      "Cada pessoa da equipa só vê os clientes que lhe são atribuídos.",
      "Os ficheiros dos clientes são apagados sozinhos ao fim de 90 dias.",
      "Pode ativar a verificação em dois passos quando quiser, em Conta.",
    ],
    enter: "Entrar no Bilonai",
    error: "Não foi possível guardar. Tente de novo.",
  },
  account: {
    title: "Conta",
    lead: "O seu e-mail, a forma de entrar e a segurança da conta.",
    emailTitle: "E-mail",
    emailCurrent: "E-mail atual",
    emailNew: "Novo e-mail",
    emailChange: "Alterar e-mail",
    emailSent: "Enviámos um link de confirmação para {email}. A alteração só acontece depois de o abrir (por segurança, pode chegar também um aviso ao e-mail atual).",
    emailChanged: "E-mail alterado.",
    signinTitle: "Forma de entrar",
    signinHint: "Pode entrar sempre com o link enviado por e-mail. Se preferir, defina também uma palavra-passe.",
    passwordNew: "Nova palavra-passe",
    passwordRepeat: "Repita a palavra-passe",
    passwordSet: "Definir palavra-passe",
    passwordChange: "Alterar palavra-passe",
    passwordSaved: "Palavra-passe guardada. Já pode entrar com ela.",
    passwordShort: "Use pelo menos 8 caracteres.",
    passwordMismatch: "As palavras-passe não coincidem.",
    mfaTitle: "Verificação em dois passos",
    mfaHint: "Além do e-mail ou da palavra-passe, pede um código de 6 dígitos da app de autenticação do telemóvel (Google Authenticator, Microsoft Authenticator…).",
    mfaOn: "Ativa",
    mfaOff: "Desativada",
    mfaEnable: "Ativar",
    mfaDisable: "Desativar",
    mfaDisableConfirm: "Desativar a verificação em dois passos?",
    mfaScan: "Leia este código com a app de autenticação e escreva o código de 6 dígitos que aparece.",
    mfaSecret: "Não consegue ler? Use esta chave:",
    mfaCode: "Código de 6 dígitos",
    mfaConfirm: "Confirmar e ativar",
    mfaWrong: "Código errado ou expirado. Tente o código seguinte.",
    cancel: "Cancelar",
    saving: "A guardar…",
    error: "Não foi possível guardar. Tente de novo.",
    signOut: "Sair da conta",
    deleteTitle: "Apagar conta",
    deleteText: "Apaga o escritório e tudo o que contém: clientes, pedidos, ficheiros e acessos da equipa. A assinatura é cancelada. Não é possível desfazer.",
    deleteType: "Para confirmar, escreva o nome do escritório: {office}",
    deleteButton: "Apagar conta para sempre",
    deleteError: "Não foi possível apagar a conta. Escreva-nos para suporte@bilonai.com.",
    safeTitle: "Os seus dados",
    safe: [
      "Ligação cifrada e dados guardados na União Europeia (Irlanda).",
      "Cada pessoa da equipa só vê os clientes que lhe são atribuídos.",
      "Os ficheiros dos clientes são apagados sozinhos ao fim de 90 dias.",
    ],
  },
  login: {
    usePassword: "Entrar com palavra-passe",
    useLink: "Entrar com link por e-mail",
    password: "Palavra-passe",
    submitPassword: "Entrar",
    wrongPassword: "E-mail ou palavra-passe errados. Se ainda não definiu uma, entre com o link por e-mail.",
  },
  code: {
    title: "Verificação em dois passos",
    lead: "Escreva o código de 6 dígitos da sua app de autenticação.",
    code: "Código",
    submit: "Confirmar",
    wrong: "Código errado ou expirado. Tente o código seguinte.",
    lost: "Perdeu o acesso à app? Escreva-nos para suporte@bilonai.com.",
    signOut: "Sair",
  },
};

const esES: Pack = {
  guide: {
    title: "Primeros pasos",
    lead: "Cuatro pasos cortos, con un cliente de ejemplo. Al terminar, ya sabrás usar Bilonai.",
    progress: "{a} de {b}",
    hide: "Ocultar guía",
    sampleName: "Cliente de ejemplo",
    steps: [
      { title: "Crea un cliente de ejemplo", text: "Con tu correo y la solicitud del mes ya hecha, para verlo todo funcionando sin molestar a nadie.", action: "Crear ejemplo" },
      { title: "Sé tu cliente por un minuto", text: "Abre la página que recibe el cliente y envía una foto o un PDF cualquiera.", action: "Abrir la página del cliente" },
      { title: "Mira el archivo llegar ordenado", text: "En Documentos, el archivo aparece en el cliente y el documento correctos.", action: "Ver Documentos" },
      { title: "Añade tus clientes", text: "Uno a uno, o pegados desde Excel de una vez. Puedes borrar el cliente de ejemplo cuando quieras.", action: "Añadir clientes" },
    ],
    orOwn: "¿Prefieres empezar ya con tus clientes?",
    doneTitle: "Ya sabes lo esencial.",
    doneText: "Así cada mes: los clientes envían por el enlace (o responden al recordatorio con adjuntos) y Bilonai lo ordena. Puedes borrar el cliente de ejemplo en Clientes.",
  },
  welcome: {
    step: "{a} de {b}",
    back: "Volver",
    q: [
      {
        title: "¿Dónde está tu despacho?",
        hint: "Preparamos el idioma, la moneda y los documentos habituales de tu país.",
        options: [
          { value: "ES", label: "España" },
          { value: "PT", label: "Portugal" },
          { value: "BR", label: "Brasil" },
          { value: "other", label: "Otro país" },
        ],
      },
      {
        title: "¿Cuál es tu área?",
        hint: "Nos ayuda a mejorar Bilonai para quien lo usa.",
        options: [
          { value: "accounting", label: "Contabilidad y asesoría fiscal" },
          { value: "other", label: "Otra área", hint: "abogacía, consultoría, seguros…" },
        ],
      },
      {
        title: "¿Cuántos clientes llevas?",
        hint: "Para sugerirte el plan adecuado, sin sorpresas.",
        options: [
          { value: "lt20", label: "Hasta 20" },
          { value: "20to60", label: "Entre 20 y 60" },
          { value: "gt60", label: "Más de 60" },
        ],
      },
    ],
    doneTitle: "Todo listo, {office}.",
    doneLead: "Tu cuenta está preparada. Antes de entrar, lo esencial sobre tus datos:",
    safe: [
      "Conexión cifrada y datos guardados en la Unión Europea (Irlanda).",
      "Cada persona del equipo solo ve los clientes que tiene asignados.",
      "Los archivos de los clientes se borran solos a los 90 días.",
      "Puedes activar la verificación en dos pasos cuando quieras, en Cuenta.",
    ],
    enter: "Entrar en Bilonai",
    error: "No se pudo guardar. Inténtalo de nuevo.",
  },
  account: {
    title: "Cuenta",
    lead: "Tu correo, la forma de entrar y la seguridad de la cuenta.",
    emailTitle: "Correo",
    emailCurrent: "Correo actual",
    emailNew: "Nuevo correo",
    emailChange: "Cambiar correo",
    emailSent: "Hemos enviado un enlace de confirmación a {email}. El cambio solo se aplica al abrirlo (por seguridad, puede llegar también un aviso al correo actual).",
    emailChanged: "Correo cambiado.",
    signinTitle: "Forma de entrar",
    signinHint: "Siempre puedes entrar con el enlace que enviamos por correo. Si lo prefieres, define también una contraseña.",
    passwordNew: "Nueva contraseña",
    passwordRepeat: "Repite la contraseña",
    passwordSet: "Definir contraseña",
    passwordChange: "Cambiar contraseña",
    passwordSaved: "Contraseña guardada. Ya puedes entrar con ella.",
    passwordShort: "Usa al menos 8 caracteres.",
    passwordMismatch: "Las contraseñas no coinciden.",
    mfaTitle: "Verificación en dos pasos",
    mfaHint: "Además del correo o la contraseña, pide un código de 6 dígitos de la app de autenticación del móvil (Google Authenticator, Microsoft Authenticator…).",
    mfaOn: "Activa",
    mfaOff: "Desactivada",
    mfaEnable: "Activar",
    mfaDisable: "Desactivar",
    mfaDisableConfirm: "¿Desactivar la verificación en dos pasos?",
    mfaScan: "Escanea este código con la app de autenticación y escribe el código de 6 dígitos que aparece.",
    mfaSecret: "¿No puedes escanearlo? Usa esta clave:",
    mfaCode: "Código de 6 dígitos",
    mfaConfirm: "Confirmar y activar",
    mfaWrong: "Código incorrecto o caducado. Prueba con el siguiente.",
    cancel: "Cancelar",
    saving: "Guardando…",
    error: "No se pudo guardar. Inténtalo de nuevo.",
    signOut: "Cerrar sesión",
    deleteTitle: "Eliminar cuenta",
    deleteText: "Elimina el despacho y todo lo que contiene: clientes, solicitudes, archivos y accesos del equipo. La suscripción se cancela. No se puede deshacer.",
    deleteType: "Para confirmar, escribe el nombre del despacho: {office}",
    deleteButton: "Eliminar cuenta para siempre",
    deleteError: "No se pudo eliminar la cuenta. Escríbenos a suporte@bilonai.com.",
    safeTitle: "Tus datos",
    safe: [
      "Conexión cifrada y datos guardados en la Unión Europea (Irlanda).",
      "Cada persona del equipo solo ve los clientes que tiene asignados.",
      "Los archivos de los clientes se borran solos a los 90 días.",
    ],
  },
  login: {
    usePassword: "Entrar con contraseña",
    useLink: "Entrar con enlace por correo",
    password: "Contraseña",
    submitPassword: "Entrar",
    wrongPassword: "Correo o contraseña incorrectos. Si aún no has definido una, entra con el enlace por correo.",
  },
  code: {
    title: "Verificación en dos pasos",
    lead: "Escribe el código de 6 dígitos de tu app de autenticación.",
    code: "Código",
    submit: "Confirmar",
    wrong: "Código incorrecto o caducado. Prueba con el siguiente.",
    lost: "¿Perdiste el acceso a la app? Escríbenos a suporte@bilonai.com.",
    signOut: "Salir",
  },
};

const ptBR: Pack = {
  guide: {
    title: "Primeiros passos",
    lead: "Quatro passos curtos, com um cliente de exemplo. No fim, você já sabe usar o Bilonai.",
    progress: "{a} de {b}",
    hide: "Ocultar guia",
    sampleName: "Cliente de exemplo",
    steps: [
      { title: "Crie um cliente de exemplo", text: "Com o seu e-mail e o pedido do mês já feito, para ver tudo funcionando sem incomodar ninguém.", action: "Criar exemplo" },
      { title: "Seja o seu cliente por um minuto", text: "Abra a página que o cliente recebe e envie uma foto ou um PDF qualquer.", action: "Abrir a página do cliente" },
      { title: "Veja o arquivo chegar organizado", text: "Em Documentos, o arquivo aparece no cliente e no documento certos.", action: "Ver Documentos" },
      { title: "Adicione os seus clientes", text: "Um a um, ou colados do Excel de uma vez. Você pode excluir o cliente de exemplo quando quiser.", action: "Adicionar clientes" },
    ],
    orOwn: "Prefere começar já com os seus clientes?",
    doneTitle: "Você já sabe o essencial.",
    doneText: "É assim todo mês: os clientes enviam pelo link (ou respondem ao lembrete com anexos) e o Bilonai organiza. Você pode excluir o cliente de exemplo em Clientes.",
  },
  welcome: {
    step: "{a} de {b}",
    back: "Voltar",
    q: [
      {
        title: "Onde fica o seu escritório?",
        hint: "Preparamos o idioma, a moeda e os documentos habituais do seu país.",
        options: [
          { value: "BR", label: "Brasil" },
          { value: "PT", label: "Portugal" },
          { value: "ES", label: "Espanha" },
          { value: "other", label: "Outro país" },
        ],
      },
      {
        title: "Qual é a sua área?",
        hint: "Isso nos ajuda a melhorar o Bilonai para quem usa.",
        options: [
          { value: "accounting", label: "Contabilidade" },
          { value: "other", label: "Outra área", hint: "advocacia, consultoria, seguros…" },
        ],
      },
      {
        title: "Quantos clientes você atende?",
        hint: "Para sugerirmos o plano certo, sem surpresas.",
        options: [
          { value: "lt20", label: "Até 20" },
          { value: "20to60", label: "Entre 20 e 60" },
          { value: "gt60", label: "Mais de 60" },
        ],
      },
    ],
    doneTitle: "Tudo pronto, {office}.",
    doneLead: "Sua conta está preparada. Antes de entrar, o essencial sobre os seus dados:",
    safe: [
      "Conexão criptografada e dados guardados na União Europeia (Irlanda).",
      "Cada pessoa da equipe só vê os clientes atribuídos a ela.",
      "Os arquivos dos clientes são apagados automaticamente após 90 dias.",
      "Você pode ativar a verificação em duas etapas quando quiser, em Conta.",
    ],
    enter: "Entrar no Bilonai",
    error: "Não foi possível salvar. Tente de novo.",
  },
  account: {
    title: "Conta",
    lead: "Seu e-mail, a forma de entrar e a segurança da conta.",
    emailTitle: "E-mail",
    emailCurrent: "E-mail atual",
    emailNew: "Novo e-mail",
    emailChange: "Alterar e-mail",
    emailSent: "Enviamos um link de confirmação para {email}. A alteração só acontece depois de abri-lo (por segurança, pode chegar também um aviso no e-mail atual).",
    emailChanged: "E-mail alterado.",
    signinTitle: "Forma de entrar",
    signinHint: "Você sempre pode entrar com o link enviado por e-mail. Se preferir, defina também uma senha.",
    passwordNew: "Nova senha",
    passwordRepeat: "Repita a senha",
    passwordSet: "Definir senha",
    passwordChange: "Alterar senha",
    passwordSaved: "Senha salva. Já pode entrar com ela.",
    passwordShort: "Use pelo menos 8 caracteres.",
    passwordMismatch: "As senhas não coincidem.",
    mfaTitle: "Verificação em duas etapas",
    mfaHint: "Além do e-mail ou da senha, pede um código de 6 dígitos do app autenticador do celular (Google Authenticator, Microsoft Authenticator…).",
    mfaOn: "Ativa",
    mfaOff: "Desativada",
    mfaEnable: "Ativar",
    mfaDisable: "Desativar",
    mfaDisableConfirm: "Desativar a verificação em duas etapas?",
    mfaScan: "Leia este código com o app autenticador e digite o código de 6 dígitos que aparecer.",
    mfaSecret: "Não consegue ler? Use esta chave:",
    mfaCode: "Código de 6 dígitos",
    mfaConfirm: "Confirmar e ativar",
    mfaWrong: "Código errado ou expirado. Tente o próximo código.",
    cancel: "Cancelar",
    saving: "Salvando…",
    error: "Não foi possível salvar. Tente de novo.",
    signOut: "Sair da conta",
    deleteTitle: "Excluir conta",
    deleteText: "Exclui o escritório e tudo o que ele contém: clientes, pedidos, arquivos e acessos da equipe. A assinatura é cancelada. Não é possível desfazer.",
    deleteType: "Para confirmar, digite o nome do escritório: {office}",
    deleteButton: "Excluir conta para sempre",
    deleteError: "Não foi possível excluir a conta. Escreva para suporte@bilonai.com.",
    safeTitle: "Seus dados",
    safe: [
      "Conexão criptografada e dados guardados na União Europeia (Irlanda).",
      "Cada pessoa da equipe só vê os clientes atribuídos a ela.",
      "Os arquivos dos clientes são apagados automaticamente após 90 dias.",
    ],
  },
  login: {
    usePassword: "Entrar com senha",
    useLink: "Entrar com link por e-mail",
    password: "Senha",
    submitPassword: "Entrar",
    wrongPassword: "E-mail ou senha incorretos. Se ainda não definiu uma, entre com o link por e-mail.",
  },
  code: {
    title: "Verificação em duas etapas",
    lead: "Digite o código de 6 dígitos do seu app autenticador.",
    code: "Código",
    submit: "Confirmar",
    wrong: "Código errado ou expirado. Tente o próximo código.",
    lost: "Perdeu o acesso ao app? Escreva para suporte@bilonai.com.",
    signOut: "Sair",
  },
};

const packs: Record<Locale, Pack> = { "pt-PT": ptPT, "es-ES": esES, "pt-BR": ptBR };
export const accountTexts = (locale: Locale): Pack => packs[locale] ?? ptPT;
