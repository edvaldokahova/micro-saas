import type { Metadata } from "next";
import Link from "next/link";
import { Identity, LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de utilização",
  description: `Condições de utilização e de assinatura do ${site.name}.`,
  alternates: { canonical: "/termos" },
};

export default function Termos() {
  const { starter, office } = site.plans;
  return (
    <LegalPage
      title="Termos de utilização"
      intro={`Condições que se aplicam ao uso do ${site.name}. Ao criar uma conta, aceita estes termos.`}
    >
      <section>
        <h2>1. O serviço</h2>
        <p>
          O {site.name} é uma aplicação online, da {site.owner}, que permite a escritórios de contabilidade e
          profissionais semelhantes pedir documentos aos seus clientes por link, acompanhar o estado de cada documento e
          preparar lembretes por WhatsApp. Destina-se a uso profissional.
        </p>
        <Identity />
      </section>

      <section>
        <h2>2. Conta</h2>
        <ul>
          <li>Entra com o seu e-mail, através de um link de acesso enviado para a sua caixa de correio.</li>
          <li>É responsável por manter o acesso ao seu e-mail seguro e por toda a atividade na sua conta.</li>
          <li>Deve fornecer informação verdadeira e manter o e-mail atualizado.</li>
        </ul>
      </section>

      <section>
        <h2>3. Teste gratuito</h2>
        <p>
          Novas contas têm {site.trialDays} dias de teste, com todas as funcionalidades e sem necessidade de cartão. No fim
          do teste, o acesso é suspenso até subscrever um plano; os seus dados são conservados nos termos da{" "}
          <Link href="/privacidade">Política de privacidade</Link>.
        </p>
      </section>

      <section>
        <h2>4. Planos, preços e pagamento</h2>
        <ul>
          <li>{starter.name}: {starter.priceEur} €/mês, até {starter.clientLimit} clientes.</li>
          <li>{office.name}: {office.priceEur} €/mês, até {office.clientLimit} clientes.</li>
          <li>Os preços são mensais e os impostos aplicáveis (como o IVA) são calculados no checkout, consoante o seu país.</li>
          <li>A assinatura renova-se automaticamente todos os meses até ser cancelada.</li>
          <li>
            <strong>Paddle.com Market Limited é o Merchant of Record de todas as nossas encomendas.</strong> A Paddle
            trata do pagamento, da faturação, dos impostos e dos reembolsos. Ao comprar, aceita também os termos do
            comprador da Paddle. O contrato de utilização do serviço é celebrado entre si e a {site.owner}.
          </li>
          <li>Não recebemos nem guardamos os seus dados de cartão.</li>
          <li>Podemos alterar os preços com pelo menos 30 dias de aviso; a alteração aplica-se à renovação seguinte.</li>
        </ul>
      </section>

      <section>
        <h2>5. Cancelamento e reembolsos</h2>
        <p>
          Pode cancelar a qualquer momento. As regras estão em <Link href="/reembolsos">Cancelamento e reembolsos</Link>.
        </p>
      </section>

      <section>
        <h2>6. Uso aceitável</h2>
        <ul>
          <li>Use o serviço apenas para a recolha legítima de documentos junto dos seus clientes.</li>
          <li>Não envie spam, mensagens abusivas ou enganosas, nem contacte pessoas sem fundamento legal para o fazer.</li>
          <li>Não tente aceder a dados de outros escritórios, contornar limites do plano ou comprometer a segurança do serviço.</li>
          <li>Não introduza dados que não tenha o direito de tratar.</li>
        </ul>
      </section>

      <section>
        <h2>7. Os seus dados e os dos seus clientes</h2>
        <p>
          Os dados que introduz continuam a ser seus. Relativamente aos dados pessoais dos seus clientes, o escritório é o
          responsável pelo tratamento e a {site.owner} atua como subcontratante, conforme a{" "}
          <Link href="/privacidade">Política de privacidade</Link>. É responsável por ter fundamento legal para contactar
          os seus clientes e pelo conteúdo das mensagens que envia.
        </p>
      </section>

      <section>
        <h2>8. WhatsApp</h2>
        <p>
          Os lembretes são preparados pelo serviço mas enviados por si, a partir do seu próprio WhatsApp. Não somos
          afiliados ao WhatsApp nem à Meta e não controlamos a entrega das mensagens.
        </p>
      </section>

      <section>
        <h2>9. Disponibilidade</h2>
        <p>
          Esforçamo-nos por manter o serviço disponível, mas pode haver interrupções para manutenção ou por falhas de
          terceiros. Não garantimos disponibilidade ininterrupta. O serviço acompanha o estado dos documentos e não
          substitui o seu programa de contabilidade nem o arquivo dos documentos originais.
        </p>
      </section>

      <section>
        <h2>10. Responsabilidade</h2>
        <p>
          Na medida permitida por lei, não respondemos por lucros cessantes, perda de clientes ou danos indiretos, e a
          nossa responsabilidade total perante si fica limitada ao valor que pagou nos 12 meses anteriores ao facto que
          deu origem à reclamação. Nada nestes termos exclui responsabilidade que a lei não permita excluir.
        </p>
      </section>

      <section>
        <h2>11. Suspensão e encerramento</h2>
        <p>
          Podemos suspender ou encerrar contas que violem estes termos ou ponham em risco a segurança do serviço,
          avisando-o sempre que possível. Pode encerrar a sua conta quando quiser.
        </p>
      </section>

      <section>
        <h2>12. Alterações aos termos</h2>
        <p>
          Podemos atualizar estes termos. Quando a alteração for relevante, avisamos com antecedência razoável por e-mail
          ou na plataforma. Continuar a usar o serviço depois dessa data significa que aceita os novos termos.
        </p>
      </section>

      <section>
        <h2>13. Contacto</h2>
        <p>
          Dúvidas sobre estes termos: <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
