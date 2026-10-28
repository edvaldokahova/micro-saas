import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MAIN = "bilonai.com";
const APP = "app.bilonai.com";
// Caminhos que pertencem ao painel (app.bilonai.com)
const APP_PATHS = ["/app", "/entrar", "/registar", "/auth", "/pagamento"];

// 1. Põe cada página no domínio certo: a página pública e os links dos clientes em bilonai.com,
//    o painel em app.bilonai.com; o antigo entrega.bilonai.com redireciona tudo (links antigos continuam a funcionar).
// 2. Renova a sessão e protege a área do escritório (/app).
export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const path = request.nextUrl.pathname;
  const isApp = APP_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  const go = (domain: string, pathname = path) => NextResponse.redirect(`https://${domain}${pathname}${request.nextUrl.search}`, 308);

  if (host === "entrega.bilonai.com") return go(isApp ? APP : MAIN);
  if (host === `www.${MAIN}`) return go(MAIN);
  if (host === MAIN && isApp) return go(APP);
  if (host === APP && path === "/") return NextResponse.redirect(new URL("/app", request.url));
  if (!isApp) return NextResponse.next();

  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims valida o token localmente (sem ida ao servidor de autenticação quando as chaves são assimétricas)
  // e renova a sessão quando é preciso. Mais rápido em cada navegação dentro do painel.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? data.claims : null;

  if (!user && request.nextUrl.pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Todas as páginas (para os domínios), exceto ficheiros estáticos e a API (webhooks da Paddle).
  matcher: ["/((?!_next/|api/|favicon.png|android-chrome|email/|story/|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)$).*)"],
};
