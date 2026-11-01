import "server-only";
import { createHash } from "node:crypto";
import { getPixel } from "@/lib/platform";

// API de Conversões da Meta: os mesmos eventos do Pixel, enviados também pelo servidor.
// Recupera conversões que os bloqueadores escondem; a Meta junta os dois pelo event_id (sem contar a dobrar).
// Só envia com o token na Vercel (META_CAPI_TOKEN), com o Pixel ligado no admin e com o evento ativo.
// Quem chama garante o consentimento (cookie bl_consent=yes, ou guardado no registo).
const GRAPH = "https://graph.facebook.com/v21.0";

const sha = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export type CapiInput = {
  event: string;
  eventId: string;
  email?: string | null;
  value?: number;
  currency?: string;
  url?: string;
  ip?: string | null;
  ua?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  country?: string | null;
};

export async function sendCapi(input: CapiInput): Promise<string | null> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return null;
  const pixel = await getPixel();
  if (!pixel.id || !pixel.events.includes(input.event)) return null;
  const user_data: Record<string, unknown> = {};
  if (input.email) user_data.em = [sha(input.email)];
  if (input.country) user_data.country = [sha(input.country)];
  if (input.ip) user_data.client_ip_address = input.ip;
  if (input.ua) user_data.client_user_agent = input.ua;
  if (input.fbp) user_data.fbp = input.fbp;
  if (input.fbc) user_data.fbc = input.fbc;
  const body = {
    data: [
      {
        event_name: input.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.url ?? "https://www.bilonai.com/",
        user_data,
        ...(input.value != null ? { custom_data: { value: input.value, currency: input.currency ?? "EUR" } } : {}),
      },
    ],
  };
  try {
    const res = await fetch(`${GRAPH}/${pixel.id}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return "ok";
    return `erro ${res.status}`;
  } catch {
    return "erro rede";
  }
}
