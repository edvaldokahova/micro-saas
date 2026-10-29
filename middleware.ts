import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// A Vercel serve a página em www.bilonai.com (bilonai.com redireciona para lá)
const MAIN = "www.bilonai.com";
const APP = "app.bilonai.com";
const CLIENT = "entrega.bilonai.com";
// Entrada e autenticação (no domínio do painel)
const AUTH_PATHS = ["/entrar", "/registar", "/auth", "/pagamento"];
// Páginas públicas que vivem só em www.bilonai.com
const MARKETING_PATHS = ["/precos", "/termos", "/privacidade", "/reembolsos", "/suporte"];

const under = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));
// /app/clientes -> /clientes ; /app -> /
const short = (path: string) => path.replace(/^\/app(?=\/|$)/, "") || "/";

// 1. Põe cada página no domínio certo: página pública em www.bilonai.com, painel em app.bilonai.com
//    (com endereços curtos: app.bilonai.com/clientes, sem o /app) e páginas dos clientes em entrega.bilonai.com.
// 2. Renova a sessão e protege o painel.
export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const path = request.nextUrl.pathname;
  const isAuth = under(path, AUTH_PATHS);
  const isPanel = under(path, ["/app"]);
  const isClient = path.startsWith("/p/");
  const isMain = host === MAIN || host === "bilonai.com";
  const go = (domain: string, pathname = path) => NextResponse.redirect(`https://${domain}${pathname}${request.nextUrl.search}`, 308);

  if (host === CLIENT && !isClient) return go(isAuth || isPanel ? APP : MAIN, short(path));
  if ((isMain || host === APP) && isClient) return go(CLIENT);
  if (isMain && (isAuth || isPanel)) return go(APP, short(path));

  // No domínio do painel, as rotas internas /app/... ficam escondidas atrás de endereços curtos
  let internal = path;
  if (host === APP) {
    if (isPanel) return go(APP, short(path));
    if (under(path, MARKETING_PATHS)) return go(MAIN);
    if (!isAuth) internal = path === "/" ? "/app" : `/app${path}`;
  }

  const needsSession = internal.startsWith("/app") || path === "/entrar" || path === "/registar";
  if (!needsSession) return NextResponse.next();

  const target = new URL(`${internal}${request.nextUrl.search}`, request.url);
  const pass = () => (internal !== path ? NextResponse.rewrite(target, { request }) : NextResponse.next({ request }));
  let response = pass();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = pass();
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims valida o token localmente e renova a sessão quando é preciso
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? data.claims : null;

  if (!user && internal.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Todas as páginas (para os domínios), exceto ficheiros estáticos e a API (webhooks da Paddle).
  matcher: ["/((?!_next/|api/|favicon.png|android-chrome|email/|story/|sw.js|offline.html|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)$).*)"],
};
