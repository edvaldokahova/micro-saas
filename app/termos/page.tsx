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
          profissionais semelhantes pedir documentos aos seus clientes por link, acompanhar o estado de cada documento,
          preparar lembretes por WhatsApp ou e-mail e, se o escritório o ativar, enviar lembretes automáticos por e-mail em
          seu nome. Destina-se a uso profissional.
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
            comprador da Paddle. O contrato de utilização do serviço é celebrado entre si e {site.seller}, a operar sob a marca {site.owner}.
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
          <li>
            Nos lembretes automáticos, não use o texto do e-mail para publicidade, para pedir pagamentos, palavras-passe ou
            dados bancários, nem para se fazer passar por outra entidade.
          </li>
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
        <h2>8. Lembretes</h2>
        <p>
          <strong>Por WhatsApp e lembretes manuais por e-mail:</strong> o serviço prepara a mensagem, mas é o escritório
          que a envia, a partir do seu próprio WhatsApp ou programa de e-mail. Não somos afiliados ao WhatsApp nem à Meta e
          não controlamos a entrega dessas mensagens.
        </p>
        <p>
          <strong>Lembretes automáticos por e-mail (opcional):</strong> quando o escritório os ativa nas Definições, o
          serviço envia, em nome do escritório e segundo as regras que este escolhe, e-mails de lembrete aos clientes que
          ainda têm documentos em falta. O e-mail mostra o nome do escritório como remetente, as respostas seguem para o
          e-mail do escritório e o rodapé identifica a mensagem como automática. O escritório é responsável por ter
          fundamento legal para contactar cada destinatário, pela exatidão dos endereços que introduz e pelo texto que
          personaliza. Pode desligar o envio automático a qualquer momento. Podemos limitar o número de envios diários e
          suspender o envio automático em caso de abuso, queixas ou risco para a entrega de e-mails. Não garantimos a
          entrega de cada mensagem, que depende também dos serviços de e-mail dos destinatários.
        </p>
        <p>
          <strong>Receção de ficheiros:</strong> os clientes do escritório podem enviar ficheiros pela página do pedido ou
          responder por e-mail para o endereço de recolha, e o escritório pode adicionar ficheiros que recebeu noutros
          canais. O serviço guarda-os de forma privada durante 90 dias e apaga-os automaticamente depois disso: não é um
          arquivo. O escritório deve descarregar e conservar os documentos nos seus próprios sistemas, conforme as suas
          obrigações legais. A arrumação automática de cada ficheiro no documento do pedido é feita por análise automática
          e pode falhar; o escritório deve confirmar os ficheiros antes de os usar. O escritório é responsável pelo
          fundamento legal para tratar os documentos dos seus clientes e não deve pedir, através do serviço, dados que não
          sejam necessários.
        </p>
      </section>

      <section>
        <h2>9. Disponibilidade</h2>
        <p>
          Esforçamo-nos por manter o serviço disponível, mas pode haver interrupções para manutenção ou por falhas de
          terceiros. Não garantimos disponibilidade ininterrupta. O serviço acompanha o estado dos documentos e não
          substitui o seu programa de contabilidade nem o arquivo dos documentos originais (os ficheiros recebidos são
          apagados ao fim de 90 dias).
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
