import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente com chave secreta: ignora RLS. Usar APENAS no servidor (webhook Paddle, tarefas internas).
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY em falta");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
