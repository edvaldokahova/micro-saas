import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="mt-2 text-muted">Enviamos um link de acesso para o seu e-mail. Sem palavra-passe.</p>
        {erro === "link" && (
          <p className="mt-5 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
            Esse link expirou ou já foi usado. Peça um novo abaixo.
          </p>
        )}
        <div className="mt-8">
          <AuthForm mode="login" />
        </div>
        <p className="mt-6 text-sm text-muted">
          Ainda não tem conta? <Link className="text-gold hover:underline" href="/registar">Testar grátis</Link>
        </p>
      </main>
    </>
  );
}
