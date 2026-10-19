"use server";

import { createClient } from "@/lib/supabase/server";

type Via = "whatsapp" | "email" | "other";

// O cliente assinala (ou anula) um documento como enviado, dizendo por onde o enviou.
// A função na base de dados valida o token, só mexe em documentos desse pedido
// e nunca altera o que o escritório já marcou como recebido.
export async function markSent(token: string, itemId: string, sent: boolean, via: Via | null): Promise<"pending" | "sent" | null> {
  if (typeof token !== "string" || token.length !== 32 || !/^[0-9a-f-]{36}$/i.test(itemId)) return null;
  const channel = via === "whatsapp" || via === "email" || via === "other" ? via : null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_public_item_sent", {
    p_token: token,
    p_item_id: itemId,
    p_sent: !!sent,
    p_via: sent ? channel : null,
  });
  if (error) return null;
  return data === "sent" || data === "pending" ? data : null;
}
