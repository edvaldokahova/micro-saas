import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cancelamento e reembolsos",
  description: `Como cancelar a assinatura do ${site.name} e como pedir reembolso nos 14 dias seguintes a uma cobrança.`,
  alternates: { canonical: "/reembolsos" },
};

export default function Reembolsos() {
  return (
    <LegalPage
      title="Cancelamento e reembolsos"
      intro="Sem fidelização e com 14 dias para pedir reembolso."
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
            <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>. Pode também gerir ou cancelar a assinatura
            através do link incluído nos recibos que a Paddle lhe envia por e-mail.
          </li>
          <li>Mantém o acesso até ao fim do período já pago. Depois disso não há novas cobranças.</li>
        </ul>
      </section>

      <section>
        <h2>Reembolsos: 14 dias</h2>
        <p>
          Pode pedir o reembolso de qualquer cobrança, na totalidade, nos <strong>14 dias seguintes à data da cobrança</strong>.
          Isto aplica-se ao primeiro pagamento e às renovações. Também reembolsamos sempre que se confirme uma cobrança
          indevida ou duplicada.
        </p>
        <h3 className="mt-4 font-medium text-ivory">Como pedir</h3>
        <ul>
          <li>
            Através da Paddle, que é o <em>Merchant of Record</em> das nossas vendas: use o recibo que recebeu por
            e-mail ou aceda a paddle.net.
          </li>
          <li>
            Ou escreva-nos para <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> com o e-mail da conta, e
            tratamos do pedido com a Paddle.
          </li>
        </ul>
        <p>
          O reembolso é feito pelo mesmo meio de pagamento usado na compra e pode demorar alguns dias úteis a surgir na
          sua conta, conforme o seu banco ou emissor.
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
