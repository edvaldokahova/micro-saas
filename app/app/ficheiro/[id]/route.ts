import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid, signedUrl } from "@/lib/documents";

// Abrir ou descarregar um ficheiro recebido. A RLS decide se este utilizador o pode ver;
// depois o servidor gera um link temporário (5 minutos) e encaminha para ele.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.from("documents").select("filename, storage_path, expires_at").eq("id", id).maybeSingle();
  const doc = data as { filename: string; storage_path: string; expires_at: string } | null;
  if (!doc || new Date(doc.expires_at) < new Date()) return new NextResponse("Not found", { status: 404 });
  const download = new URL(request.url).searchParams.has("dl");
  const url = await signedUrl(doc.storage_path, download ? doc.filename : undefined);
  if (!url) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
