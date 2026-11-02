// Começa a ligação ao Google Drive (só donos e administradores do escritório)
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/office";
import { authUrl, driveReady } from "@/lib/gdrive";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { isManager, office, user } = await getSession();
  const back = new URL("/definicoes", request.url);
  if (!isManager || !driveReady()) {
    back.searchParams.set("erro", "drive");
    return NextResponse.redirect(back);
  }
  const nonce = randomBytes(18).toString("base64url");
  const redirectUri = new URL("/api/google/callback", request.url).toString();
  const res = NextResponse.redirect(authUrl(redirectUri, nonce, user.email ?? undefined));
  res.cookies.set("bl_gstate", `${nonce}.${office.id}`, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/google", maxAge: 600 });
  return res;
}
