"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markFeedbackRead(): Promise<void> {
  await requireAdmin();
  await createAdminClient().from("feedback").update({ read_at: new Date().toISOString() }).is("read_at", null);
  redirect("/feedback?ok=lidas");
}
