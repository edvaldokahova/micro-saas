import { Logo } from "@/components/logo";
import { t } from "@/lib/i18n";

// Provisório: a página de vendas completa entra no Bloco 2
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-6 px-6">
      <Logo />
      <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {t("pt-PT").tagline}
      </h1>
      <p className="text-muted">{t("es-ES").tagline}</p>
    </main>
  );
}
