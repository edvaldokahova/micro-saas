import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// A Vercel serve a página em www.bilonai.com (bilonai.com redireciona para lá)
const MAIN = "www.bilonai.com";
const APP = "app.bilonai.com";
const CLIENT = "docs.bilonai.com";
// Endereço antigo das páginas dos clientes: os links já enviados continuam a funcionar (redirecionam)
const OLD_CLIENT = "entrega.bilonai.com";
// Domínios nossos; qualquer outro que chegue aqui é o domínio próprio de um escritório (plano Escritório)
const OURS = (h: string) => h === "bilonai.com" || h.endsWith(".bilonai.com") || h.endsWith(".vercel.app") || h === "localhost" || h === "127.0.0.1";
// Painel administrativo da plataforma (só para os e-mails em ADMIN_EMAILS)
const ADMIN = "admin.bilonai.com";
// Entrada e autenticação (no domínio do painel)
const AUTH_PATHS = ["/entrar", "/registar", "/auth", "/pagamento"];
// Páginas públicas que vivem só em www.bilonai.com
const MARKETING_PATHS = ["/precos", "/termos", "/privacidade", "/reembolsos", "/suporte"];

// Origem do visitante (anúncios, links com UTM): guardada 30 dias num cookie de todo o bilonai.com,
// para o registo a juntar à conta e a UTMify saber de onde veio cada venda. O último clique com UTM vale.
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "sck"];
function withUtm(request: NextRequest, res: NextResponse): NextResponse {
  const q = request.nextUrl.searchParams;
  const utm: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = q.get(k);
    if (v) utm[k] = v.slice(0, 200);
  }
  if (!Object.keys(utm).length) return res;
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  res.cookies.set("bl_utm", JSON.stringify(utm), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: true,
    ...(host.endsWith("bilonai.com") ? { domain: ".bilonai.com" } : {}),
  });
  return res;
}

const under = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));
// /app/clientes -> /clientes ; /app -> /
const short = (path: string) => path.replace(/^\/app(?=\/|$)/, "") || "/";

// 1. Põe cada página no domínio certo: página pública em www.bilonai.com, painel em app.bilonai.com
//    (com endereços curtos: app.bilonai.com/clientes, sem o /app) e páginas dos clientes em docs.bilonai.com (ou no domínio do escritório).
// 2. Renova a sessão e protege o painel.
export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const path = request.nextUrl.pathname;
  const isAuth = under(path, AUTH_PATHS);
  const isPanel = under(path, ["/app"]);
  const isClient = path.startsWith("/p/");
  const isMain = host === MAIN || host === "bilonai.com";
  const go = (domain: string, pathname = path) => NextResponse.redirect(`https://${domain}${pathname}${request.nextUrl.search}`, 308);

  // admin.bilonai.com serve as páginas /admin/... com endereços curtos; noutros domínios, /admin não existe
  const isAdminPath = under(path, ["/admin"]);
  if (host === ADMIN && isAdminPath) return go(ADMIN, path.replace(/^\/admin(?=\/|$)/, "") || "/");
  if (host !== ADMIN && isAdminPath) return go(MAIN, "/");
  if (host === OLD_CLIENT) return isClient ? go(CLIENT) : go(isAuth || isPanel ? APP : MAIN, short(path));
  // Domínio do escritório: só mostra páginas de pedidos; o resto dá a página neutra «não encontrado» (sem a nossa marca)
  if (!OURS(host)) {
    if (isClient) return NextResponse.next();
    return NextResponse.rewrite(new URL("/p/-", request.url));
  }
  if (host === CLIENT && !isClient) return go(isAuth || isPanel ? APP : MAIN, short(path));
  if ((isMain || host === APP) && isClient) return go(CLIENT);
  if (isMain && (isAuth || isPanel)) return go(APP, short(path));

  // No domínio do painel, as rotas internas /app/... ficam escondidas atrás de endereços curtos
  let internal = path;
  if (host === ADMIN) {
    internal = path === "/" ? "/admin" : `/admin${path}`;
  } else if (host === APP) {
    if (isPanel) return go(APP, short(path));
    if (under(path, MARKETING_PATHS)) return go(MAIN);
    if (!isAuth) internal = path === "/" ? "/app" : `/app${path}`;
  }

  const needsSession = internal.startsWith("/app") || internal.startsWith("/admin") || path === "/entrar" || path === "/registar";
  if (!needsSession) return withUtm(request, NextResponse.next());

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

  // O painel administrativo nunca entra no Google (além do «noindex» das próprias páginas)
  if (host === ADMIN) response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return withUtm(request, response);
}

export const config = {
  // Todas as páginas (para os domínios), exceto ficheiros estáticos e a API (webhooks da Paddle).
  matcher: ["/((?!_next/|api/|favicon.png|android-chrome|email/|story/|sw.js|offline.html|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)$).*)"],
};
