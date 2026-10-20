"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/office";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { cookies } from "next/headers";

// Todas as ações correm com a sessão do utilizador: a RLS da base de dados limita tudo ao seu escritório.

const text = (v: FormDataEntryValue | null, max: number) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
};
const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);
const month = (v: FormDataEntryValue | null) => (typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : null);
const date = (v: FormDataEntryValue | null) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

// Normaliza telemóveis: mantém o + inicial, números e espaços; tira parênteses, hífenes e pontos
function phone(v: FormDataEntryValue | null): string | null | "invalid" {
  const raw = typeof v === "string" ? v.trim() : "";
  if (!raw) return null;
  const cleaned = (raw.startsWith("+") ? "+" : "") + raw.replace(/[^\d ]/g, "").replace(/\s+/g, " ").trim();
  return /^\+?[0-9 ]{6,20}$/.test(cleaned) ? cleaned : "invalid";
}

function errorCode(message: string | undefined, code: string | undefined): string {
  if (message?.includes("CLIENT_LIMIT_REACHED")) return "limit";
  if (message?.includes("SUBSCRIPTION_INACTIVE")) return "inactive";
  if (message?.includes("NO_ITEMS")) return "items";
  if (message?.includes("TEAM_LIMIT_REACHED")) return "teamLimit";
  if (code === "23505") return "exists";
  if (code === "23514") return "phone";
  return "generic";
}

/* ---------- Clientes ---------- */

export async function addClient(formData: FormData) {
  const { supabase, office } = await getSession();
  const name = text(formData.get("name"), 160);
  const p = phone(formData.get("phone"));
  if (!name) redirect("/app/clientes?erro=name");
  if (p === "invalid") redirect("/app/clientes?erro=phone");
  const { error } = await supabase.from("clients").insert({
    office_id: office.id,
    name,
    phone: p,
    email: text(formData.get("email"), 254),
    notes: text(formData.get("notes"), 2000),
    assignee_id: uuid(formData.get("assignee")),
  });
  if (error) redirect(`/app/clientes?erro=${errorCode(error.message, error.code)}`);
  revalidatePath("/app", "layout");
  redirect("/app/clientes?ok=1");
}

export async function updateClient(formData: FormData) {
  const { supabase } = await getSession();
  const id = uuid(formData.get("id"));
  const name = text(formData.get("name"), 160);
  const p = phone(formData.get("phone"));
  if (!id) redirect("/app/clientes");
  if (!name) redirect(`/app/clientes/${id}?erro=name`);
  if (p === "invalid") redirect(`/app/clientes/${id}?erro=phone`);
  const { error } = await supabase
    .from("clients")
    .update({
      name,
      phone: p,
      email: text(formData.get("email"), 254),
      notes: text(formData.get("notes"), 2000),
      assignee_id: uuid(formData.get("assignee")),
    })
    .eq("id", id);
  if (error) redirect(`/app/clientes/${id}?erro=${errorCode(error.message, error.code)}`);
  revalidatePath("/app", "layout");
  redirect(`/app/clientes/${id}?ok=1`);
}

export async function setClientArchived(formData: FormData) {
  const { supabase, office } = await getSession();
  const id = uuid(formData.get("id"));
  const archive = formData.get("archive") === "1";
  if (!id) redirect("/app/clientes");
  if (!archive) {
    // Reativar volta a contar para o limite do plano
    const { count } = await supabase.from("clients").select("id", { count: "exact", head: true }).is("archived_at", null);
    if ((count ?? 0) >= (office.plan === "office" ? 60 : 20)) redirect(`/app/clientes/${id}?erro=limit`);
  }
  await supabase.from("clients").update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id);
  revalidatePath("/app", "layout");
  redirect(archive ? "/app/clientes" : `/app/clientes/${id}`);
}

/* ---------- Pedidos ---------- */

export async function createRequest(formData: FormData) {
  const { supabase } = await getSession();
  const client = uuid(formData.get("client"));
  const period = month(formData.get("period"));
  if (!client || !period) redirect("/app/pedidos/novo?erro=generic");
  const labels = [
    ...formData.getAll("doc").map((v) => String(v)),
    ...formData.getAll("extra").map((v) => String(v)),
  ]
    .map((l) => l.trim().slice(0, 120))
    .filter(Boolean);
  if (!labels.length) redirect(`/app/pedidos/novo?cliente=${client}&mes=${period}&erro=items`);

  const { data, error } = await supabase.rpc("create_request", {
    p_client: client,
    p_period: `${period}-01`,
    p_due: date(formData.get("due")),
    p_note: text(formData.get("note"), 1000),
    p_labels: labels,
  });
  if (error || !data) {
    redirect(`/app/pedidos/novo?cliente=${client}&mes=${period}&erro=${errorCode(error?.message, error?.code)}`);
  }
  revalidatePath("/app", "layout");
  redirect(`/app/pedidos/${data}`);
}

export async function createMonthRequests(formData: FormData) {
  const { supabase } = await getSession();
  const period = month(formData.get("period"));
  if (!period) redirect("/app");
  const { data, error } = await supabase.rpc("create_month_requests", { p_period: `${period}-01`, p_due: date(formData.get("due")) });
  if (error) redirect(`/app?mes=${period}&erro=${errorCode(error.message, error.code)}`);
  revalidatePath("/app", "layout");
  redirect(`/app?mes=${period}&criados=${Number(data) || 0}`);
}

export async function setItemStatus(formData: FormData) {
  const { supabase } = await getSession();
  const id = uuid(formData.get("item"));
  const request = uuid(formData.get("request"));
  const status = formData.get("status");
  if (!id || !request || (status !== "received" && status !== "pending")) return;
  await supabase.from("request_items").update({ status }).eq("id", id);
  revalidatePath(`/app/pedidos/${request}`);
}

export async function markAllReceived(formData: FormData) {
  const { supabase } = await getSession();
  const request = uuid(formData.get("request"));
  if (!request) return;
  await supabase.from("request_items").update({ status: "received" }).eq("request_id", request).neq("status", "received");
  revalidatePath(`/app/pedidos/${request}`);
}

export async function deleteRequest(formData: FormData) {
  const { supabase } = await getSession();
  const request = uuid(formData.get("request"));
  const back = month(formData.get("period"));
  if (request) await supabase.from("requests").delete().eq("id", request);
  revalidatePath("/app", "layout");
  redirect(back ? `/app?mes=${back}` : "/app");
}

// Chamado pelo botão de WhatsApp (não bloqueia a abertura da conversa)
export async function bumpReminder(requestId: string): Promise<void> {
  const id = uuid(requestId);
  if (!id) return;
  const { supabase } = await getSession();
  await supabase.rpc("bump_reminder", { p_request: id });
}

/* ---------- Definições ---------- */

export async function updateSettings(formData: FormData) {
  const { supabase, office, user } = await getSession();
  const name = text(formData.get("name"), 120);
  const p = phone(formData.get("contact_phone"));
  const email = text(formData.get("contact_email"), 254);
  const locale = formData.get("locale");
  const template = text(formData.get("reminder_template"), 1000);
  const uploadUrl = text(formData.get("upload_url"), 500);
  if (!name) redirect("/app/definicoes?erro=name");
  if (p === "invalid") redirect("/app/definicoes?erro=phone");
  if (email && !email.includes("@")) redirect("/app/definicoes?erro=generic");
  if (uploadUrl && !/^https:\/\/\S+$/.test(uploadUrl)) redirect("/app/definicoes?erro=url");

  const update: Record<string, string | null> = {
    name,
    contact_phone: p,
    contact_email: email,
    reminder_template: template,
    upload_url: uploadUrl,
  };
  if (isLocale(locale)) update.locale = locale;
  const { error } = await supabase.from("offices").update(update).eq("id", office.id);
  if (error) redirect(`/app/definicoes?erro=${errorCode(error.message, error.code)}`);

  if (isLocale(locale) && locale !== office.locale) {
    (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    await supabase.auth.updateUser({ data: { ...user.user_metadata, locale } });
  }
  revalidatePath("/app", "layout");
  redirect("/app/definicoes?ok=1");
}

export async function addDocType(formData: FormData) {
  const { supabase, office } = await getSession();
  const label = text(formData.get("label"), 120);
  if (!label) redirect("/app/definicoes");
  const { data: last } = await supabase.from("document_types").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("document_types").insert({ office_id: office.id, label, position: (last?.position ?? 0) + 1 });
  redirect(error ? `/app/definicoes?erro=${errorCode(error.message, error.code)}#tipos` : "/app/definicoes#tipos");
}

export async function removeDocType(formData: FormData) {
  const { supabase } = await getSession();
  const id = uuid(formData.get("id"));
  if (id) await supabase.from("document_types").delete().eq("id", id);
  redirect("/app/definicoes#tipos");
}

/* ---------- Equipa (responsáveis) ---------- */

export async function addTeamMember(formData: FormData) {
  const { supabase, office } = await getSession();
  const name = text(formData.get("name"), 120);
  const p = phone(formData.get("phone"));
  const email = text(formData.get("email"), 254);
  if (!name) redirect("/app/definicoes?erro=name#equipa");
  if (p === "invalid") redirect("/app/definicoes?erro=phone#equipa");
  if (email && !email.includes("@")) redirect("/app/definicoes?erro=generic#equipa");
  const { error } = await supabase.from("team_members").insert({ office_id: office.id, name, phone: p, email });
  if (error) redirect(`/app/definicoes?erro=${errorCode(error.message, error.code)}#equipa`);
  revalidatePath("/app", "layout");
  redirect("/app/definicoes?ok=1#equipa");
}

export async function removeTeamMember(formData: FormData) {
  const { supabase } = await getSession();
  const id = uuid(formData.get("id"));
  if (id) await supabase.from("team_members").delete().eq("id", id);
  revalidatePath("/app", "layout");
  redirect("/app/definicoes#equipa");
}

export async function signOut() {
  const { supabase } = await getSession();
  await supabase.auth.signOut();
  redirect("/");
}
