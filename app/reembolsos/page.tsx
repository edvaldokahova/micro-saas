import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cancelamento e reembolsos",
  description: `Como cancelar a assinatura do ${site.name} e quando há lugar a reembolso.`,
  alternates: { canonical: "/reembolsos" },
};

export default function Reembolsos() {
  return (
    <LegalPage
      title="Cancelamento e reembolsos"
      intro="Sem fidelização e sem letras pequenas."
    >
      <section>
        <h2>Teste gratuito</h2>
        <p>
          Tem {site.trialDays} dias de teste com todas as funcionalidades, sem indicar cartão ou qualquer meio de
          pagamento. Se não subscrever, nada lhe é cobrado.
        </p>
      </section>

      <section>
        <h2>Cancelar a assinatura</h2>
        <ul>
          <li>Pode cancelar a qualquer momento, sem aviso prévio e sem custos.</li>
          <li>
            Para cancelar, escreva a partir do e-mail da conta para{" "}
            <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.
          </li>
          <li>Mantém o acesso até ao fim do período já pago. Depois disso não há novas cobranças.</li>
        </ul>
      </section>

      <section>
        <h2>Reembolsos</h2>
        <ul>
          <li>
            <strong>Primeiro pagamento:</strong> se o serviço não lhe serve, escreva-nos nos 7 dias seguintes ao primeiro
            pagamento e reembolsamos o valor na totalidade.
          </li>
          <li>
            <strong>Cobrança indevida ou duplicada:</strong> reembolsamos sempre que se confirme o erro.
          </li>
          <li>
            <strong>Renovações seguintes:</strong> o valor de um período já iniciado não é reembolsado, por isso o
            melhor é cancelar antes da data de renovação.
          </li>
        </ul>
        <p>
          O reembolso é feito pelo mesmo meio de pagamento usado na compra, através da MundPay, e pode demorar alguns
          dias úteis a surgir na sua conta, conforme o seu banco ou emissor.
        </p>
      </section>

      <section>
        <h2>Os seus dados após o cancelamento</h2>
        <p>
          Depois de cancelar, mantemos os dados da conta durante um período curto para o caso de querer voltar, e
          apagamo-los conforme a <Link href="/privacidade">Política de privacidade</Link>. Pode pedir a eliminação imediata
          a qualquer momento.
        </p>
      </section>
    </LegalPage>
  );
}
