import type { Metadata } from "next";
import { getSession } from "@/lib/office";
import { accountTexts } from "@/lib/account-texts";
import { AccountSettings } from "@/components/account-settings";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Conta" };

export default async function Conta({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { supabase, user, office, locale, role } = await getSession();
  const { email } = await searchParams;
  const t = accountTexts(locale).account;
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.find((f) => f.status === "verified") ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl">{t.title}</h1>
      <p className="mt-2 text-muted">{t.lead}</p>
      {email === "ok" && (
        <p className="mt-5 rounded-xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok" role="status">
          {t.emailChanged}
        </p>
      )}
      <AccountSettings
        t={t}
        email={user.email ?? ""}
        hasPassword={user.user_metadata?.has_password === true}
        mfaFactor={totp?.id ?? null}
        canDelete={role === "owner"}
        officeName={office.name}
      />
      <form action={signOut} className="mt-8">
        <button className="btn btn-secondary w-full sm:w-auto">{t.signOut}</button>
      </form>
    </div>
  );
}
