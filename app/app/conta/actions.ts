"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/office";
import { createAdminClient } from "@/lib/supabase/admin";
import { paddleApi } from "@/lib/paddle/server";
import { BUCKET } from "@/lib/documents";
import { site } from "@/lib/site";
import { accountTexts } from "@/lib/account-texts";

// Questionário de boas-vindas (só o dono). A base de dados valida os valores e muda o idioma pelo país.
export async function finishWelcome(country: string, profession: string, clients: string): Promise<boolean> {
  const { supabase, role } = await getSession();
  if (role !== "owner") return false;
  const { error } = await supabase.rpc("finish_welcome", { p_country: country, p_profession: profession, p_clients: clients });
  if (error) return false;
  // Os e-mails de acesso (link, alteração de e-mail) seguem o idioma guardado no utilizador
  const locale = ({ PT: "pt-PT", BR: "pt-BR", ES: "es-ES" } as Record<string, string>)[country];
  if (locale) await supabase.auth.updateUser({ data: { locale } }).catch(() => null);
  revalidatePath("/app", "layout");
  return true;
}

// Guarda que a conta já tem palavra-passe (o Supabase não o diz), só para mostrar «Alterar» em vez de «Definir»
export async function markPassword(): Promise<void> {
  const { supabase } = await getSession();
  await supabase.auth.updateUser({ data: { has_password: true } });
}

// Apagar a conta (só o dono): cancela a assinatura, apaga os ficheiros, os acessos da equipa e,
// por fim, o utilizador — a base de dados apaga o escritório e tudo o que lhe pertence (em cascata).
export async function deleteAccount(confirmName: string): Promise<boolean> {
  const { supabase, user, office, role } = await getSession();
  if (role !== "owner") return false;
  if (confirmName.trim().toLowerCase() !== office.name.trim().toLowerCase()) return false;
  const admin = createAdminClient();

  // 1. Assinatura: se não for possível cancelar, não apaga nada (para não continuar a cobrar)
  if (office.paddle_subscription_id && ["active", "past_due", "trialing", "paused"].includes(office.plan_status)) {
    try {
      await paddleApi(`/subscriptions/${office.paddle_subscription_id}/cancel`, { method: "POST", body: { effective_from: "immediately" } });
    } catch {
      return false;
    }
  }

  // 2. Ficheiros guardados
  const { data: docs } = await admin.from("documents").select("storage_path").eq("office_id", office.id);
  const paths = (docs ?? []).map((d: { storage_path: string }) => d.storage_path);
  for (let i = 0; i < paths.length; i += 100) await admin.storage.from(BUCKET).remove(paths.slice(i, i + 100));

  // 3. Logins da equipa (nunca donos de outros escritórios)
  const { data: team } = await admin.from("team_members").select("user_id").eq("office_id", office.id).not("user_id", "is", null);
  for (const m of (team ?? []) as { user_id: string }[]) {
    if (m.user_id === user.id) continue;
    const { data: owns } = await admin.from("offices").select("id").eq("owner_id", m.user_id).maybeSingle();
    if (!owns) await admin.auth.admin.deleteUser(m.user_id);
  }

  // 4. O dono (em cascata: escritório, clientes, pedidos, registos)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return false;
  await supabase.auth.signOut().catch(() => null);
  redirect(`${site.url}/?conta=apagada`);
}

/* ---------- Primeiros passos (guia com cliente de exemplo) ---------- */

// Cria o cliente de exemplo (com o e-mail de quem está a aprender) e o pedido do mês anterior
export async function createSample(): Promise<void> {
  const { supabase, user, office, locale, isManager } = await getSession();
  if (!isManager) redirect("/");
  const admin = createAdminClient();
  const { data: existing } = await admin.from("clients").select("id").eq("office_id", office.id).eq("is_sample", true).maybeSingle();
  let clientId = (existing as { id: string } | null)?.id ?? null;
  if (!clientId) {
    const { data: created } = await admin
      .from("clients")
      .insert({ office_id: office.id, name: accountTexts(locale).guide.sampleName, email: user.email ?? null, cadence: "monthly", is_sample: true })
      .select("id")
      .single();
    clientId = (created as { id: string } | null)?.id ?? null;
  }
  if (!clientId) redirect("/?erro=generic");
  const { data: hasReq } = await admin.from("requests").select("id").eq("client_id", clientId).limit(1);
  if (!hasReq?.length) {
    const { data: types } = await supabase.from("document_types").select("label").order("position");
    const labels = ((types ?? []) as { label: string }[]).map((x) => x.label).slice(0, 4);
    const now = new Date();
    const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
    const due = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    await supabase.rpc("create_request", { p_client: clientId, p_period: period, p_due: due, p_note: null, p_labels: labels.length ? labels : ["Documentos"] });
  }
  revalidatePath("/app", "layout");
  redirect("/#primeiros-passos");
}

export async function hideGuide(): Promise<void> {
  const { office, isManager } = await getSession();
  if (!isManager) redirect("/");
  await createAdminClient().from("offices").update({ guide_done_at: new Date().toISOString() }).eq("id", office.id);
  revalidatePath("/app", "layout");
  redirect("/");
}
