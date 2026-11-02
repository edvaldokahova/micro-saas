"use server";

// Google Drive do escritório: envio automático, envio agora e desligar (só donos e administradores)
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/office";
import { createAdminClient } from "@/lib/supabase/admin";
import { revoke, syncOffice } from "@/lib/gdrive";
import { open } from "@/lib/secret-box";

async function managerOffice() {
  const s = await getSession();
  return s.isManager ? s.office.id : null;
}

export async function setDriveAuto(on: boolean): Promise<boolean> {
  const id = await managerOffice();
  if (!id) return false;
  const { error } = await createAdminClient().from("office_integrations").update({ auto_sync: !!on }).eq("office_id", id).eq("provider", "gdrive");
  return !error;
}

export async function syncDriveNow(retry: boolean): Promise<{ sent: number; left: number; failed: number } | null> {
  const id = await managerOffice();
  if (!id) return null;
  const r = await syncOffice(id, { limit: 8, retry });
  revalidatePath("/app/documentos");
  return r;
}

export async function disconnectDrive(): Promise<boolean> {
  const id = await managerOffice();
  if (!id) return false;
  const admin = createAdminClient();
  const { data } = await admin.from("office_integrations").select("refresh_token_enc").eq("office_id", id).eq("provider", "gdrive").maybeSingle();
  const token = data?.refresh_token_enc ? open(data.refresh_token_enc) : null;
  if (token) await revoke(token);
  const { error } = await admin.from("office_integrations").delete().eq("office_id", id).eq("provider", "gdrive");
  revalidatePath("/app", "layout");
  return !error;
}
