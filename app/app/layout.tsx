import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { AppNav, AppTabBar } from "@/components/app-nav";
import { Logo } from "@/components/logo";
import { LocaleSwitcher, ThemeToggle } from "@/components/preferences";
import { getSession, officeAccess } from "@/lib/office";
import { signOut } from "./actions";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { office, locale, d } = await getSession();
  const access = officeAccess(office);
  const b = d.app.banner;

  const banner =
    access.state === "trial"
      ? { tone: "border-gold/30 bg-gold/10 text-gold", text: b.trialLeft(access.daysLeft) }
      : access.state === "trial_ended"
        ? { tone: "border-bad/30 bg-bad/10 text-bad", text: b.trialEnded }
        : access.state === "canceled"
          ? { tone: "border-bad/30 bg-bad/10 text-bad", text: b.canceled }
          : access.state === "past_due"
            ? { tone: "border-bad/30 bg-bad/10 text-bad", text: b.pastDue }
            : null;

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
          <div className="flex items-center gap-6">
            <Link href="/app" aria-label={d.app.nav.dashboard} className="shrink-0">
              <Logo />
            </Link>
            <AppNav labels={d.app.nav} />
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher locale={locale} label={d.common.language} />
            <ThemeToggle labels={{ light: d.common.themeLight, dark: d.common.themeDark }} />
            <form action={signOut}>
              <button
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:border-gold/60 hover:text-ivory"
                aria-label={d.common.signOut}
                title={d.common.signOut}
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </header>

      {banner && (
        <div className={`border-b ${banner.tone}`}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm">
            <span>{banner.text}</span>
            <Link href="/app/assinatura" className="font-semibold underline-offset-4 hover:underline">
              {b.choosePlan} →
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">{children}</main>
      <AppTabBar labels={d.app.nav} />
    </div>
  );
}
