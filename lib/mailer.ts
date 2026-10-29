import "server-only";

// Envio de e-mails pelo Resend (só a partir do servidor; a chave vive nas variáveis da Vercel).
// Os lembretes saem de um endereço nosso, mas com o NOME do escritório e "Responder" para o escritório.
export const FROM_ADDRESS = "lembretes@mail.bilonai.com";

export type Outgoing = {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

// "Contabilidade Silva" <lembretes@mail.bilonai.com> (sem caracteres que estraguem o cabeçalho)
export function fromOffice(name: string): string {
  const clean = name.replace(/["<>\\,;\r\n]/g, " ").replace(/\s+/g, " ").trim() || "Escritório";
  return `"${clean}" <${FROM_ADDRESS}>`;
}

export const emailOk = (e: string | null | undefined): e is string =>
  !!e && /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/.test(e.trim());

type Result = { ok: true; ids: (string | null)[] } | { ok: false; error: string };

// Vários e-mails num só pedido (até 100)
export async function sendBatch(messages: Outgoing[], idempotencyKey: string): Promise<Result> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY em falta" };
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(messages),
  });
  const body = (await res.json().catch(() => null)) as { data?: { id: string }[]; message?: string } | null;
  if (!res.ok || !body?.data) return { ok: false, error: String(body?.message ?? res.status) };
  return { ok: true, ids: messages.map((_, i) => body.data?.[i]?.id ?? null) };
}

// Um só e-mail (ex.: o teste das Definições)
export async function sendOne(message: Outgoing): Promise<Result> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY em falta" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!res.ok || !body?.id) return { ok: false, error: String(body?.message ?? res.status) };
  return { ok: true, ids: [body.id] };
}
