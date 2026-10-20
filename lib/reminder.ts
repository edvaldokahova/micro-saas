import "server-only";
import { fill, formatPeriod, periodOf, whatsappNumber, type Dictionary, type Locale } from "@/lib/i18n";
import type { Office } from "@/lib/office";
import { site } from "@/lib/site";

export function publicLink(token: string): string {
  return `${site.url}/p/${token}`;
}

// Mensagem de lembrete pronta para o WhatsApp (modelo do escritório ou o padrão do idioma)
export function reminderUrl(
  office: Office,
  locale: Locale,
  d: Dictionary,
  req: { token: string; period: string; months?: number; client_name: string; client_phone: string | null },
  pendingLabels: string[],
): string | null {
  const number = whatsappNumber(req.client_phone, locale);
  if (!number) return null;
  const template = pendingLabels.length
    ? office.reminder_template?.trim() || d.app.whatsappTemplate
    : d.app.whatsappAllSent;
  const text = fill(template, {
    cliente: req.client_name,
    mes: formatPeriod(req.period, locale, req.months).toLowerCase(),
    periodo: periodOf(req.period, locale, req.months),
    lista: pendingLabels.map((l) => `• ${l}`).join("\n"),
    link: publicLink(req.token),
    escritorio: office.name,
  });
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
