"use server";

import { getSession } from "@/lib/office";
import { createAdminClient } from "@/lib/supabase/admin";

// Feedback dos utilizadores. A sessão confirma quem envia; a escrita usa o acesso de servidor
// (a tabela não tem acesso direto pelo navegador).

// Resposta ao pedido do 4.º dia: «Agora não» ou fechar. Não volta a aparecer.
export async function answerFeedbackPrompt(answer: "no" | "closed"): Promise<void> {
  const { office, role } = await getSession();
  if (role !== "owner" || office.feedback_prompt_at) return;
  await createAdminClient().from("offices").update({ feedback_prompt_at: new Date().toISOString(), feedback_prompt_answer: answer }).eq("id", office.id);
}

export async function sendFeedback(message: string, source: "prompt" | "help"): Promise<{ ok: boolean }> {
  const { office, user, locale, role } = await getSession();
  const text = String(message ?? "").trim().slice(0, 500);
  if (!text) return { ok: false };
  const admin = createAdminClient();
  const { error } = await admin.from("feedback").insert({
    office_id: office.id,
    user_id: user.id,
    email: user.email ?? null,
    message: text,
    source: source === "prompt" ? "prompt" : "help",
    locale,
  });
  if (error) return { ok: false };
  if (source === "prompt" && role === "owner" && !office.feedback_prompt_at) {
    await admin.from("offices").update({ feedback_prompt_at: new Date().toISOString(), feedback_prompt_answer: "sent" }).eq("id", office.id);
  }
  return { ok: true };
}
