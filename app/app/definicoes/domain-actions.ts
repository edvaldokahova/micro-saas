"use server";

// Domínio próprio do escritório (plano Escritório; também no período de teste)
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/office";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDomain, checkDomain, domainsReady, normalizeDomain, removeDomain } from "@/lib/domains";

type Err = "invalid" | "ours" | "taken" | "setup" | "plan" | "generic";
export type DomainResult = { ok: true; active: boolean; txt: { name: string; value: string } | null } | { ok: false; error: Err };

async function manager() {
  const s = await getSession();
  return s.isManager ? s : null;
}

export async function saveDomain(raw: string): Promise<DomainResult> {
  const s = await manager();
  if (!s) return { ok: false, error: "generic" };
  if (s.office.plan !== "office" && s.office.plan !== "trial") return { ok: false, error: "plan" };
  // Um endereço do próprio Bilonai não serve: tem de ser um domínio que o escritório controla
  if (/(^|\.)(bilonai\.com|vercel\.app)\/?$/i.test(raw.trim().replace(/^https?:\/\//, ""))) return { ok: false, error: "ours" };
  const domain = normalizeDomain(raw);
  if (!domain) return { ok: false, error: "invalid" };
  if (!domainsReady()) return { ok: false, error: "setup" };
  const admin = createAdminClient();
  const { data: other } = await admin.from("offices").select("id").ilike("custom_domain", domain).neq("id", s.office.id).maybeSingle();
  if (other) return { ok: false, error: "taken" };
  // Trocar de domínio: o anterior sai do projeto
  if (s.office.custom_domain && s.office.custom_domain !== domain) await removeDomain(s.office.custom_domain).catch(() => null);
  const added = await addDomain(domain).catch(() => ({ ok: false, taken: false }));
  if (!added.ok) return { ok: false, error: added.taken ? "taken" : "generic" };
  const check = await checkDomain(domain).catch(() => ({ active: false, txt: null }));
  const { error } = await admin
    .from("offices")
    .update({ custom_domain: domain, custom_domain_status: check.active ? "active" : "pending", custom_domain_checked_at: new Date().toISOString() })
    .eq("id", s.office.id);
  if (error) return { ok: false, error: "generic" };
  revalidatePath("/app", "layout");
  return { ok: true, ...check };
}

export async function verifyDomain(): Promise<DomainResult> {
  const s = await manager();
  if (!s || !s.office.custom_domain) return { ok: false, error: "generic" };
  if (!domainsReady()) return { ok: false, error: "setup" };
  const check = await checkDomain(s.office.custom_domain).catch(() => ({ active: false, txt: null }));
  await createAdminClient()
    .from("offices")
    .update({ custom_domain_status: check.active ? "active" : "pending", custom_domain_checked_at: new Date().toISOString() })
    .eq("id", s.office.id);
  revalidatePath("/app", "layout");
  return { ok: true, ...check };
}

export async function deleteDomain(): Promise<boolean> {
  const s = await manager();
  if (!s) return false;
  if (s.office.custom_domain && domainsReady()) await removeDomain(s.office.custom_domain).catch(() => null);
  const { error } = await createAdminClient()
    .from("offices")
    .update({ custom_domain: null, custom_domain_status: null, custom_domain_checked_at: null })
    .eq("id", s.office.id);
  revalidatePath("/app", "layout");
  return !error;
}
