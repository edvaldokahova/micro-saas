import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// Definições da plataforma (só o painel administrativo as muda): planos das ferramentas e Pixel da Meta.
export type Plans = { vercel: "hobby" | "pro"; supabase: "free" | "pro"; resend: "free" | "pro" };
export type Pixel = { id: string | null; events: string[] };

export const PIXEL_EVENTS = ["PageView", "ViewContent", "Lead", "CompleteRegistration", "StartTrial", "Purchase"] as const;
export type PixelEvent = (typeof PIXEL_EVENTS)[number];

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await createAdminClient().from("platform_settings").select("value").eq("key", key).maybeSingle();
  return ((data as { value: T } | null)?.value ?? fallback) as T;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await createAdminClient().from("platform_settings").upsert({ key, value, updated_at: new Date().toISOString() });
}

// O Pixel é lido em todas as páginas públicas: fica em cache e é renovado quando o admin o muda
export const getPixel = unstable_cache(
  async (): Promise<Pixel> => {
    const p = await getSetting<Pixel>("meta_pixel", { id: null, events: [] }).catch(() => ({ id: null, events: [] }) as Pixel);
    const id = p.id && /^\d{6,20}$/.test(p.id) ? p.id : null;
    return { id, events: (p.events ?? []).filter((e) => (PIXEL_EVENTS as readonly string[]).includes(e)) };
  },
  ["meta-pixel"],
  { tags: ["meta-pixel"], revalidate: 600 },
);

// Custos mensais (USD) e limites de cada plano, para o cockpit
export const PLAN_INFO = {
  vercel: { name: "Vercel", free: "Hobby", pro: "Pro", cost: 20 },
  supabase: { name: "Supabase", free: "Free", pro: "Pro", cost: 25 },
  resend: { name: "Resend", free: "Free", pro: "Pro", cost: 20 },
} as const;

export function limitsFor(plans: Plans) {
  const supa = plans.supabase === "pro";
  const resend = plans.resend === "pro";
  return {
    dbBytes: (supa ? 8 * 1024 : 500) * 1024 * 1024,
    storageBytes: (supa ? 100 : 1) * 1024 * 1024 * 1024,
    emailsDay: resend ? null : 100,
    emailsMonth: resend ? 50000 : 3000,
  };
}
