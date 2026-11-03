import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { perfTexts } from "@/lib/performance-texts";
import { inboxAddress } from "@/lib/inbound";
import { Suspense } from "react";
import { AppNav, AppTabBar } from "@/components/app-nav";
import { NavProgress } from "@/components/nav-progress";
import { KeepScroll } from "@/components/keep-scroll";
import { LocaleSwitcher, ThemeToggle } from "@/components/preferences";
import { getSession, officeAccess } from "@/lib/office";
import { Welcome } from "@/components/welcome";
import { accountTexts } from "@/lib/account-texts";
import { FeedbackPrompt } from "@/components/feedback";
import { feedbackTexts } from "@/lib/feedback-texts";
import { site } from "@/lib/site";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { office, locale, d, role, user } = await getSession();
  // Colaboradores: Painel, Clientes e Documentos. Administradores: também Definições. Assinatura: só o dono da conta.
  // A assinatura passou para o menu da conta; na barra fica «Novo pedido», a ação mais usada
  type NavKey = "dashboard" | "clients" | "newRequest" | "documents" | "settings" | "performance";
  const show: NavKey[] = ["dashboard", "clients", "newRequest", "documents"];
  if (role !== "member") show.push("settings", "performance");
  const navLabels = { ...d.app.nav, newRequest: d.app.request.newTitle, performance: perfTexts(locale).nav };
  // Primeira entrada do dono: questionário de boas-vindas antes do painel
  if (role === "owner" && !office.onboarded_at) return <Welcome t={accountTexts(locale).welcome} office={office.name} />;
  const access = officeAccess(office);
  const b = d.app.banner;
  // Pedido de opinião: a partir do 4.º dia do teste, só ao dono da conta, uma única vez
  const trialDay = Math.floor((Date.now() - (new Date(office.trial_ends_at).getTime() - site.trialDays * 864e5)) / 864e5) + 1;
  const askFeedback = role === "owner" && access.state === "trial" && !office.feedback_prompt_at && trialDay >= 4;

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
            <Link href="/" aria-label={d.app.nav.dashboard} title={office.name} className="flex min-w-0 items-center gap-1.5">
              <Building2 className="h-5 w-5 shrink-0 text-ivory" strokeWidth={1.6} aria-hidden />
              <span className="max-w-[44vw] truncate text-[15px] font-semibold tracking-[-0.01em] sm:max-w-[16rem]">{office.name}</span>
            </Link>
            <AppNav labels={navLabels} show={show} />
          </div>
          <div className="flex items-center gap-2 self-center">
            <LocaleSwitcher locale={locale} label={d.common.language} />
            <ThemeToggle labels={{ light: d.common.themeLight, dark: d.common.themeDark }} />
            <AccountMenu
              t={accountTexts(locale).menu}
              email={user.email ?? ""}
              office={office.name}
              billing={role === "owner"}
              inbox={role !== "member" ? inboxAddress(office.inbox_key) : null}
              helpUrl="/ajuda"
              timezone={office.timezone}
              performance={role !== "member" ? perfTexts(locale).nav : null}
            />
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

      <Suspense fallback={null}>
        <KeepScroll />
      </Suspense>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">{children}</main>
      <AppTabBar labels={navLabels} show={show} />
      {askFeedback && <FeedbackPrompt t={feedbackTexts(locale)} />}
    </div>
  );
}
