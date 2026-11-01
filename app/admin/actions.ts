"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { getSetting, setSetting, PIXEL_EVENTS, type Plans } from "@/lib/platform";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin, requireAdmin } from "@/lib/admin";
import { postOrder, testOrder } from "@/lib/utmify";

// Pede o código de entrada. Só envia para e-mails de administrador; a resposta é sempre a mesma.
export async function requestAdminCode(email: string): Promise<void> {
  const e = email.trim().toLowerCase();
  if (!isPlatformAdmin(e)) return;
  // Cria o utilizador de administração na primeira vez (sem escritório: a base de dados reconhece-o)
  await createAdminClient()
    .auth.admin.createUser({ email: e, email_confirm: true, app_metadata: { platform_admin: true } })
    .catch(() => null);
  const supabase = await createClient();
  await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: false } });
}

export async function adminSignOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}

// Botão «Enviar venda de teste»: confirma que a credencial da UTMify funciona (a UTMify valida e não grava)
export async function sendUtmifyTest(): Promise<void> {
  await requireAdmin();
  const r = await postOrder(testOrder());
  redirect(`/?utmify=${encodeURIComponent(r)}#utmify`);
}

// Nome com que o cockpit o cumprimenta (guardado no próprio utilizador)
export async function setAdminName(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  if (name) await supabase.auth.updateUser({ data: { display_name: name } });
  redirect("/?ok=nome");
}

// Plano de cada ferramenta (Vercel, Supabase, Resend): muda os limites e os custos do cockpit
export async function setPlan(formData: FormData): Promise<void> {
  await requireAdmin();
  const tool = String(formData.get("tool"));
  const tier = String(formData.get("tier"));
  const plans = await getSetting<Plans>("plans", { vercel: "hobby", supabase: "free", resend: "free" });
  if (tool === "vercel" && (tier === "hobby" || tier === "pro")) plans.vercel = tier;
  if (tool === "supabase" && (tier === "free" || tier === "pro")) plans.supabase = tier;
  if (tool === "resend" && (tier === "free" || tier === "pro")) plans.resend = tier;
  await setSetting("plans", plans);
  redirect(`/?ok=plano-${tool}`);
}

// Pixel da Meta: ID (só números) e eventos ligados
export async function saveMetaPixel(formData: FormData): Promise<void> {
  await requireAdmin();
  const raw = String(formData.get("pixel") ?? "").replace(/\D/g, "");
  const id = raw.length >= 6 && raw.length <= 20 ? raw : null;
  const events = formData.getAll("events").map(String).filter((e) => (PIXEL_EVENTS as readonly string[]).includes(e));
  await setSetting("meta_pixel", { id, events });
  revalidateTag("meta-pixel");
  redirect(id || !raw ? "/?ok=pixel" : "/?erro=pixel");
}
