// Volta do Google: guarda a ligação ao Drive do escritório e cria a pasta «Bilonai»
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/office";
import { exchangeCode, saveConnection } from "@/lib/gdrive";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const done = (key: "ok" | "erro", value: string) => {
    const back = new URL("/definicoes", request.url);
    back.searchParams.set(key, value);
    back.hash = "integracoes";
    const res = NextResponse.redirect(back);
    res.cookies.set("bl_gstate", "", { path: "/api/google", maxAge: 0 });
    return res;
  };
  const [nonce, officeId] = (request.cookies.get("bl_gstate")?.value ?? "").split(".");
  const code = url.searchParams.get("code");
  // Cancelado no ecrã do Google, ou pedido que não começou aqui
  if (!code || !nonce || url.searchParams.get("state") !== nonce) return done("erro", "drive-cancel");
  const { isManager, office, user } = await getSession();
  if (!isManager || office.id !== officeId) return done("erro", "drive");
  const redirectUri = new URL("/api/google/callback", request.url).toString();
  const tokens = await exchangeCode(code, redirectUri).catch(() => ({ error: "rede" }));
  if ("error" in tokens) return done("erro", "drive");
  // Sem a permissão do Drive (a pessoa desmarcou a caixa no ecrã do Google)
  if (!tokens.scope?.includes("drive.file") || !tokens.refresh_token) return done("erro", "drive-scope");
  const { error } = await saveConnection(office.id, user.id, tokens);
  if (error) return done("erro", "drive");
  return done("ok", "drive");
}
