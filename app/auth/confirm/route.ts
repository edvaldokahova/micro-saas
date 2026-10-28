import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Destino dos links dos e-mails de autenticação (confirmação, link mágico, recuperação)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Só aceita caminhos internos (evita redirecionamentos para sites externos)
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      // Sem palavras-passe: a recuperação também entra direto no painel
      const target = type === "recovery" ? "/" : next;
      return NextResponse.redirect(new URL(target, origin));
    }
  }

  return NextResponse.redirect(new URL("/entrar?erro=link", origin));
}
