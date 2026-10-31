import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Painel administrativo da plataforma (admin.bilonai.com): só para os e-mails em ADMIN_EMAILS
// (variável de ambiente na Vercel, separados por vírgulas). Nada disto fica no código.
export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  if (!isPlatformAdmin(user.email)) redirect("/entrar?erro=acesso");
  return { supabase, user };
}

// Limites dos planos atuais (gratuitos). Ao mudar para Pro, atualizar aqui.
export const limits = {
  dbBytes: 500 * 1024 * 1024, // Supabase Free: 500 MB de base de dados (Pro: 8 GB)
  storageBytes: 1024 * 1024 * 1024, // Supabase Free: 1 GB de ficheiros (Pro: 100 GB)
  emailsDay: 100, // Resend Free: 100 e-mails por dia
  emailsMonth: 3000, // Resend Free: 3000 e-mails por mês
};
