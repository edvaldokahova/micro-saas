import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Suporte",
  description: `Ajuda com o ${site.name}: contactos, perguntas frequentes, cancelamento e pedidos sobre dados pessoais.`,
  alternates: { canonical: "/suporte" },
};

export default function Suporte() {
  return (
    <LegalPage title="Suporte" intro="Estamos aqui para ajudar. A forma mais rápida é por e-mail.">
      <section>
        <a
          href={`mailto:${site.supportEmail}`}
          className="inline-flex items-center gap-3 rounded-xl border border-line bg-ink-2 px-5 py-4 no-underline hover:border-gold/60 hover:no-underline"
        >
          <Mail className="h-5 w-5 text-gold" aria-hidden />
          <span className="text-ivory">{site.supportEmail}</span>
        </a>
        <p className="mt-4">
          Respondemos por e-mail em dias úteis. Para acelerar, indique o e-mail da sua conta e descreva o que
          aconteceu (se possível, com uma captura de ecrã).
        </p>
      </section>

      <section>
        <h2>Perguntas frequentes</h2>
        <h3 className="mt-4 font-medium text-ivory">Não recebi o e-mail de acesso</h3>
        <p>
          Verifique a pasta de spam e confirme que escreveu o e-mail corretamente. O link é válido durante 1 hora e só
          funciona uma vez; peça um novo em <Link href="/entrar">Entrar</Link>. Se continuar sem chegar, escreva-nos.
        </p>
        <h3 className="mt-4 font-medium text-ivory">O link do meu cliente não abre</h3>
        <p>
          Confirme que o link foi copiado por inteiro. Se o pedido já foi fechado, o cliente vê o estado final mas não
          pode alterar nada. Pode gerar um novo pedido para o mesmo cliente e período a partir do painel.
        </p>
        <h3 className="mt-4 font-medium text-ivory">Atingi o limite de clientes</h3>
        <p>
          O plano Starter inclui até {site.plans.starter.clientLimit} clientes e o plano Escritório até{" "}
          {site.plans.office.clientLimit}. Pode arquivar clientes que já não acompanha ou mudar de plano.
        </p>
        <h3 className="mt-4 font-medium text-ivory">Como cancelo a assinatura?</h3>
        <p>
          Pode cancelar a qualquer momento, sem fidelização. Escreva-nos a partir do e-mail da conta e confirmamos o
          cancelamento; mantém o acesso até ao fim do período já pago. Veja{" "}
          <Link href="/reembolsos">Cancelamento e reembolsos</Link>.
        </p>
        <h3 className="mt-4 font-medium text-ivory">Quero aceder, corrigir ou apagar os meus dados</h3>
        <p>
          Escreva-nos. Tratamos estes pedidos conforme descrito na <Link href="/privacidade">Política de privacidade</Link>.
        </p>
      </section>

      <section>
        <h2>Problemas de pagamento</h2>
        <p>
          Os pagamentos, as faturas e os impostos são tratados pela Paddle, que é o <em>Merchant of Record</em> das
          nossas vendas. Se a cobrança falhar ou tiver dúvidas sobre uma fatura, envie-nos o e-mail da conta e a data da
          cobrança, ou consulte o recibo que a Paddle lhe enviou por e-mail (também em paddle.net).
        </p>
      </section>
    </LegalPage>
  );
}
