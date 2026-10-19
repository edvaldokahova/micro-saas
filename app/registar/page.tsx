import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-chrome";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Criar conta",
  robots: { index: false },
};

export default function Registar() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Teste {site.trialDays} dias grátis</h1>
        <p className="mt-2 text-muted">Sem cartão. Receberá um link de acesso por e-mail.</p>
        <div className="mt-8">
          <AuthForm mode="signup" />
        </div>
        <p className="mt-6 text-sm text-muted">
          Já tem conta? <Link className="text-gold hover:underline" href="/entrar">Entrar</Link>
        </p>
      </main>
    </>
  );
}
