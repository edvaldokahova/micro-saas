import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { AdminLogin } from "@/components/admin-login";

export const metadata: Metadata = { title: "Admin · Entrar", robots: { index: false, follow: false } };

export default async function AdminEntrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-16">
      <div className="flex items-center gap-2.5">
        <Logo />
        <span className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">Admin</span>
      </div>
      <h1 className="mt-8 font-display text-3xl">Entrar</h1>
      {erro === "acesso" && <p className="mt-4 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">Esta conta não tem acesso ao painel administrativo.</p>}
      <div className="mt-6">
        <AdminLogin />
      </div>
    </main>
  );
}
