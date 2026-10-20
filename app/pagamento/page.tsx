import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-chrome";
import { site } from "@/lib/site";
import { PaddleAutoload } from "./paddle-autoload";

export const metadata: Metadata = { title: "Pagamento", robots: { index: false } };

// "Default payment link" configurado na Paddle: abre o checkout de links enviados pela Paddle
export default function Pagamento() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md space-y-4 px-5 py-20 text-center">
        <h1 className="font-display text-2xl">Pagamento seguro</h1>
        <p className="text-muted">
          Se veio de um e-mail da Paddle, o pagamento abre automaticamente nesta página.
        </p>
        <PaddleAutoload />
        <p className="text-sm text-muted">
          Dúvidas? <a className="text-gold hover:underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> ·{" "}
          <Link className="text-gold hover:underline" href="/">Início</Link>
        </p>
      </main>
    </>
  );
}
