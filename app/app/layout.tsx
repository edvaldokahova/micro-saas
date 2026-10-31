import type { Metadata } from "next";
import Link from "next/link";
import { Building2, UserRound } from "lucide-react";
import { Suspense } from "react";
import { AppNav, AppTabBar } from "@/components/app-nav";
import { NavProgress } from "@/components/nav-progress";
import { LocaleSwitcher, ThemeToggle } from "@/components/preferences";
import { getSession, officeAccess } from "@/lib/office";
import { Welcome } from "@/components/welcome";
import { accountTexts } from "@/lib/account-texts";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { office, locale, d, role } = await getSession();
  // Colaboradores: Painel, Clientes e Documentos. Administradores: também Definições. Assinatura: só o dono da conta.
  type NavKey = "dashboard" | "clients" | "documents" | "settings" | "billing";
  const show: NavKey[] = ["dashboard", "clients", "documents"];
  if (role !== "member") show.push("settings");
  if (role === "owner") show.push("billing");
  // Primeira entrada do dono: questionário de boas-vindas antes do painel
  if (role === "owner" && !office.onboarded_at) return <Welcome t={accountTexts(locale).welcome} office={office.name} />;
  const access = officeAccess(office);
  const b = d.app.banner;

  const banner =
    access.state === "trial" && role === "owner"
      ? { tone: "border-line bg-ink-2 text-ivory", text: b.trialLeft(access.daysLeft) }
      : access.state === "trial_ended"
        ? { tone: "border-bad/30 bg-bad/10 text-bad", text: b.trialEnded }
        : access.state === "canceled"
          ? { tone: "border-bad/30 bg-bad/10 text-bad", text: b.canceled }
          : access.state === "past_due"
            ? { tone: "border-bad/30 bg-bad/10 text-bad", text: b.pastDue }
            : null;

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      <header className="sticky top-0 z-30 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-stretch justify-between gap-3 px-4 sm:px-5">
          <div className="flex min-w-0 items-stretch gap-8">
            {/* Dentro da conta: o nome do escritório (com ícone de empresa) no lugar do logótipo */}
            <Link href="/" aria-label={d.app.nav.dashboard} title={office.name} className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line-strong text-ivory" aria-hidden>
                <Building2 className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span className="max-w-[44vw] truncate text-[15px] font-semibold tracking-[-0.01em] sm:max-w-[16rem]">{office.name}</span>
            </Link>
            <AppNav labels={d.app.nav} show={show} />
          </div>
          <div className="flex items-center gap-2 self-center">
            <LocaleSwitcher locale={locale} label={d.common.language} />
            <ThemeToggle labels={{ light: d.common.themeLight, dark: d.common.themeDark }} />
            {/* Conta: e-mail, palavra-passe, dois passos e sair */}
            <Link
              href="/conta"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:border-line-strong hover:text-ivory"
              aria-label={accountTexts(locale).account.title}
              title={accountTexts(locale).account.title}
            >
              <UserRound className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {banner && (
        <div className={`border-b ${banner.tone}`}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2 text-[12px] font-medium">
            <span>{banner.text}</span>
            {role === "owner" && (
              <Link href="/assinatura" className="underline decoration-line-strong underline-offset-4 hover:decoration-current">
                {b.choosePlan} →
              </Link>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">{children}</main>
      <AppTabBar labels={d.app.nav} show={show} />
    </div>
  );
}
