import type { Metadata } from "next";
import { Identity, LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: `Como o ${site.name} trata dados pessoais: o que recolhemos, porquê, onde ficam e quais são os seus direitos.`,
  alternates: { canonical: "/privacidade" },
};

export default function Privacidade() {
  return (
    <LegalPage
      title="Política de privacidade"
      intro="Explicamos, de forma direta, que dados tratamos, porquê e quais são os seus direitos."
    >
      <section>
        <h2>1. Quem somos</h2>
        <p>O {site.name} é um produto da {site.owner}.</p>
        <Identity />
      </section>

      <section>
        <h2>2. Os dois papéis que temos</h2>
        <ul>
          <li>
            <strong>Dados da sua conta</strong> (o seu e-mail, o nome do escritório, o idioma e os dados de assinatura):
            somos o <em>responsável pelo tratamento</em>.
          </li>
          <li>
            <strong>Dados dos clientes do escritório</strong> que o escritório introduz na plataforma (nome, telefone,
            e-mail, notas): o escritório é o responsável pelo tratamento e nós somos <em>subcontratante</em>. Tratamos
            esses dados apenas para prestar o serviço e segundo as instruções do escritório. O escritório deve ter
            fundamento legal para contactar os seus clientes.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Que dados tratamos</h2>
        <ul>
          <li>Conta: e-mail, nome do escritório, idioma, estado e datas da assinatura.</li>
          <li>Clientes do escritório: nome, telefone, e-mail e notas que o escritório decidir registar.</li>
          <li>Pedidos: período, lista de documentos pedidos, estado de cada um (em falta, enviado, recebido) e histórico de lembretes.</li>
          <li>Dados técnicos de segurança e funcionamento: registos de acesso e erros.</li>
          <li>Faturação: identificador da assinatura e estado do pagamento. <strong>Não recebemos nem guardamos dados de cartão</strong>; os pagamentos são tratados pela Paddle.</li>
        </ul>
        <p>
          <strong>Nesta fase, a plataforma não recebe nem armazena ficheiros ou documentos contabilísticos.</strong> Guarda
          apenas o estado de cada documento.
        </p>
      </section>

      <section>
        <h2>4. Para que usamos e com que fundamento</h2>
        <ul>
          <li>Prestar o serviço contratado e gerir a sua conta (execução do contrato).</li>
          <li>Enviar e-mails de acesso e de segurança, como o link de entrada (execução do contrato).</li>
          <li>
            Enviar, em nome do escritório e só se este os ativar, lembretes automáticos por e-mail aos clientes com
            documentos em falta (como subcontratante, segundo as instruções do escritório). Estes e-mails não incluem
            publicidade e não pedem palavras-passe, dados bancários nem pagamentos.
          </li>
          <li>Processar pagamentos e cumprir obrigações fiscais e contabilísticas (obrigação legal e execução do contrato).</li>
          <li>Garantir a segurança e prevenir abusos (interesse legítimo).</li>
          <li>Responder aos seus pedidos de suporte (execução do contrato e interesse legítimo).</li>
        </ul>
        <p>Não vendemos dados pessoais nem os usamos para publicidade.</p>
      </section>

      <section>
        <h2>5. Links dos clientes</h2>
        <p>
          Cada pedido tem um link privado e aleatório. Quem tiver o link vê o nome do escritório, o nome do cliente, o
          período e a lista de documentos. O escritório deve partilhá-lo apenas com o cliente correspondente. Estas
          páginas não são indexadas por motores de busca.
        </p>
      </section>

      <section>
        <h2>6. Onde ficam os dados e quem os trata</h2>
        <p>Recorremos aos seguintes subcontratantes, com contratos de tratamento de dados:</p>
        <ul>
          <li><strong>Supabase</strong>: base de dados e autenticação, numa região da União Europeia (Irlanda).</li>
          <li><strong>Vercel</strong>: alojamento da aplicação. Quando aplicável, as transferências para fora do Espaço Económico Europeu apoiam-se em cláusulas contratuais-tipo.</li>
          <li><strong>Resend</strong>: envio de e-mails de acesso e dos lembretes automáticos dos escritórios, com servidores na União Europeia.</li>
          <li>
            <strong>Paddle</strong> (Paddle.com Market Limited): <em>Merchant of Record</em>. Trata do pagamento, da
            faturação, dos impostos e dos reembolsos das assinaturas, e atua como responsável autónomo pelos dados de
            pagamento que lhe fornece no checkout, segundo a sua própria política de privacidade.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Durante quanto tempo guardamos</h2>
        <ul>
          <li>Enquanto a conta estiver ativa.</li>
          <li>Após o cancelamento ou fim do teste, apagamos os dados da conta e dos clientes do escritório até 30 dias depois, salvo pedido de eliminação mais cedo.</li>
          <li>O registo dos lembretes automáticos (data e pedido a que respeitam, sem o conteúdo do e-mail) segue a mesma regra dos dados do escritório.</li>
          <li>Os registos de faturação são conservados pelo prazo exigido por lei.</li>
        </ul>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          Usamos apenas cookies estritamente necessários, para manter a sua sessão iniciada. Não usamos cookies de
          publicidade nem de análise.
        </p>
      </section>

      <section>
        <h2>9. Os seus direitos</h2>
        <p>
          Pode pedir o acesso, a retificação, a eliminação, a limitação, a portabilidade e opor-se ao tratamento dos
          seus dados. Escreva para <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>. Se for cliente de um
          escritório e quiser exercer direitos sobre os seus dados, deve contactar primeiro o escritório, que é o
          responsável; ajudamo-lo a responder. Tem ainda o direito de apresentar reclamação à autoridade de controlo:
          a CNPD, em Portugal, a AEPD, em Espanha, ou a ANPD, no Brasil (Lei Geral de Proteção de Dados, LGPD).
        </p>
      </section>

      <section>
        <h2>10. Segurança</h2>
        <p>
          Os dados de cada escritório ficam isolados dos restantes por regras de acesso ao nível da base de dados, as
          comunicações são cifradas e o acesso à administração é restrito. Nenhum sistema é infalível; se ocorrer uma
          violação de dados que o afete, notificamo-lo nos termos da lei.
        </p>
      </section>

      <section>
        <h2>11. Alterações</h2>
        <p>
          Se esta política mudar de forma relevante, avisamos por e-mail ou na plataforma antes de a mudança produzir
          efeitos.
        </p>
      </section>
    </LegalPage>
  );
}
