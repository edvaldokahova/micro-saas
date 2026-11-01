"use server";

import { cookies, headers } from "next/headers";
import { sendCapi } from "@/lib/meta-capi";

// Evento do navegador repetido pelo servidor (mesmo event_id), só com consentimento dado
export async function serverTrack(event: string, eventId: string, extra?: { email?: string; value?: number; currency?: string; url?: string }): Promise<void> {
  if (!/^[A-Za-z]{3,30}$/.test(event) || !/^[A-Za-z0-9_-]{6,64}$/.test(eventId)) return;
  const jar = await cookies();
  if (jar.get("bl_consent")?.value !== "yes") return;
  const h = await headers();
  await sendCapi({
    event,
    eventId,
    email: extra?.email && /^[^\s@]+@[^\s@]+$/.test(extra.email) ? extra.email : null,
    value: typeof extra?.value === "number" ? extra.value : undefined,
    currency: extra?.currency,
    url: extra?.url,
    ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
    ua: h.get("user-agent"),
    fbp: jar.get("_fbp")?.value ?? null,
    fbc: jar.get("_fbc")?.value ?? null,
  }).catch(() => null);
}
