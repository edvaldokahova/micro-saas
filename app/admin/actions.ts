"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/admin";

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
