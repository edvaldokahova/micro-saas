"use server";

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@/lib/locales";
import { createClient } from "@/lib/supabase/server";

// Guarda o idioma escolhido. Com sessão iniciada, passa também a ser o idioma do escritório
// (painel, página do cliente, lembretes) e dos e-mails de acesso.
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("offices").update({ locale }).eq("owner_id", user.id);
  await supabase.auth.updateUser({ data: { locale } });
}
