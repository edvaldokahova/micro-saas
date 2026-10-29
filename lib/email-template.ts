// E-mail automático de lembrete, enviado em nome do escritório.
// Branco e limpo, sem a marca Bilonai: só o nome do escritório, a mensagem, o estado do pedido e um botão.
// O botão é a única forma de ver QUAIS documentos faltam: a mensagem diz quantos, a página mostra quais
// (e é lá que o cliente assinala o que já enviou). Assim o clique acontece com naturalidade.
// Código puro (sem servidor): usado no envio diário e na pré-visualização das Definições.

// {chave} -> valor (as chaves desconhecidas ficam como estão)
const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k] : m));

export type EmailTexts = {
  subject: string; // modelo por omissão do assunto
  message: string; // modelo por omissão da mensagem
  missingOne: string; // "1 documento"
  missingMany: string; // "{n} documentos"
  status: string; // "Faltam {a} de {b} documentos"
  due: string; // "Prazo: {data}"
  button: string; // "Ver o que falta"
  buttonHint: string; // "Abre no telemóvel, sem conta nem palavra-passe."
  footer: string; // identificador discreto, com {escritorio}
};

export type EmailData = {
  office: string;
  client: string;
  period: string; // "de setembro de 2026"
  dueLabel: string | null; // "10 de outubro" (já formatado)
  missing: number;
  total: number;
  link: string;
  subject?: string | null; // personalizado pelo escritório
  message?: string | null; // personalizado pelo escritório
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildReminderEmail(t: EmailTexts, x: EmailData): { subject: string; html: string; text: string; body: string } {
  const values = {
    cliente: x.client,
    periodo: x.period,
    escritorio: x.office,
    em_falta: x.missing === 1 ? t.missingOne : fill(t.missingMany, { n: String(x.missing) }),
    prazo: x.dueLabel ?? "",
  };
  const subject = fill(x.subject?.trim() || t.subject, values).replace(/\s+/g, " ").trim().slice(0, 160);
  const message = fill(x.message?.trim() || t.message, values).trim();
  const status = fill(t.status, { a: String(x.missing), b: String(x.total) });
  const due = x.dueLabel ? fill(t.due, { data: x.dueLabel }) : "";
  const footer = fill(t.footer, { escritorio: x.office });
  const pct = x.total ? Math.round(((x.total - x.missing) / x.total) * 100) : 0;
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  const paragraphs = message
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1d1e22">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

  // Conteúdo do e-mail (também usado na pré-visualização das Definições)
  const body = `<div style="display:none;max-height:0;overflow:hidden">${esc(status)}${due ? ` · ${esc(due)}` : ""}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:32px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:${font}">
<tr><td style="padding:0 0 28px;font-size:15px;font-weight:600;color:#121316">${esc(x.office)}</td></tr>
<tr><td>${paragraphs}</td></tr>
<tr><td style="padding:8px 0 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6e7ea;border-radius:14px">
  <tr><td style="padding:18px 20px">
    <p style="margin:0;font-size:15px;font-weight:600;color:#121316">${esc(status)}</p>
    ${due ? `<p style="margin:4px 0 0;font-size:13px;color:#6b6e76">${esc(due)}</p>` : ""}
    <div style="margin-top:12px;height:6px;border-radius:6px;background:#eeeff1;overflow:hidden"><div style="height:6px;width:${pct}%;border-radius:6px;background:#121316"></div></div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px"><tr><td style="border-radius:999px;background:#121316">
      <a href="${esc(x.link)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${esc(t.button)} &rarr;</a>
    </td></tr></table>
    <p style="margin:10px 0 0;font-size:12.5px;color:#6b6e76">${esc(t.buttonHint)}</p>
  </td></tr></table>
</td></tr>
<tr><td style="padding:36px 0 0;font-size:11.5px;line-height:1.6;color:#9a9da5">${esc(footer)}</td></tr>
</table></td></tr></table>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff">
${body}</body></html>`;

  const text = `${message}\n\n${status}${due ? ` · ${due}` : ""}\n${t.button}: ${x.link}\n${t.buttonHint}\n\n—\n${footer}`;
  return { subject, html, text, body };
}
