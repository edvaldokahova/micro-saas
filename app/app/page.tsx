import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };

// Provisório: o painel real (clientes, pedidos, pendentes) entra no bloco seguinte
export default async function Painel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: office } = await supabase
    .from("offices")
    .select("name, plan_status, trial_ends_at")
    .maybeSingle();

  async function sair() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/");
  }

  const trialEnd = office?.trial_ends_at ? new Date(office.trial_ends_at) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-5 px-5">
      <Logo />
      <h1 className="font-display text-3xl font-semibold tracking-tight">Conta criada{office ? `, ${office.name}` : ""}.</h1>
      {office?.plan_status === "trialing" && trialEnd && (
        <p className="text-muted">
          O seu teste gratuito termina a {trialEnd.toLocaleDateString("pt-PT")}.
        </p>
      )}
      <p className="text-muted">O painel de clientes e pedidos está a ser construído.</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/assinatura"
          className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
        >
          Assinatura
        </Link>
        <form action={sair}>
          <button className="rounded-xl border border-line px-5 py-2.5 text-sm transition hover:border-gold/60">Sair</button>
        </form>
      </div>
    </main>
  );
}
