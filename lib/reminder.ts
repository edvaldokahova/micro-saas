import "server-only";
import { fill, formatPeriod, periodOf, whatsappNumber, type Dictionary, type Locale } from "@/lib/i18n";
import type { Office } from "@/lib/office";
import { site } from "@/lib/site";

export function publicLink(token: string): string {
  return `${site.url}/p/${token}`;
}

type ReminderReq = { token: string; period: string; months?: number; client_name: string; client_phone: string | null; client_email?: string | null };

// Texto do lembrete (modelo do escritório ou o padrão do idioma), igual no WhatsApp e no e-mail
function reminderText(office: Office, locale: Locale, d: Dictionary, req: ReminderReq, pendingLabels: string[]): string {
  const template = pendingLabels.length
    ? office.reminder_template?.trim() || d.app.whatsappTemplate
    : d.app.whatsappAllSent;
  return fill(template, {
    cliente: req.client_name,
    mes: formatPeriod(req.period, locale, req.months).toLowerCase(),
    periodo: periodOf(req.period, locale, req.months),
    lista: pendingLabels.map((l) => `• ${l}`).join("\n"),
    link: publicLink(req.token),
    escritorio: office.name,
  });
}

// Mensagem de lembrete pronta para o WhatsApp
export function reminderUrl(office: Office, locale: Locale, d: Dictionary, req: ReminderReq, pendingLabels: string[]): string | null {
  const number = whatsappNumber(req.client_phone, locale);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(reminderText(office, locale, d, req, pendingLabels))}`;
}

// O mesmo lembrete por e-mail: abre o programa de e-mail de quem clica, com assunto e texto já escritos.
// Sai do endereço do próprio escritório, com a assinatura de sempre; o Bilonai não envia nada.
export function reminderMailto(office: Office, locale: Locale, d: Dictionary, req: ReminderReq, pendingLabels: string[]): string | null {
  const email = req.client_email?.trim();
  if (!email || !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)) return null;
  const subject = fill(d.app.emailSubject, { periodo: periodOf(req.period, locale, req.months), escritorio: office.name });
  const body = reminderText(office, locale, d, req, pendingLabels);
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
