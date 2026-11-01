import type { Metadata } from "next";
import Link from "next/link";
import { Identity, LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de utilização",
  description: `Condições de utilização e de assinatura do ${site.name}, serviço para empresas.`,
  alternates: { canonical: "/termos" },
};

// Termos entre empresas (B2B). Incluem, no ponto 9, o acordo de tratamento de dados (art. 28.º do RGPD).
export default function Termos() {
  const { starter, office } = site.plans;
  return (
    <LegalPage
      title="Termos de utilização"
      intro={`Contrato entre a ${site.seller} e a empresa ou profissional que usa o ${site.name}. Ao criar uma conta ou subscrever um plano, a sua empresa aceita estes termos.`}
    >
      <section>
        <h2>1. Quem somos e o que é o serviço</h2>
        <p>
          O {site.name} é uma aplicação online da {site.seller} («nós») que permite a escritórios de contabilidade e
          profissionais semelhantes («o Cliente») pedir documentos aos seus próprios clientes, receber ficheiros por link
          ou por e-mail, arrumá-los por cliente e documento, acompanhar prazos e enviar lembretes.
        </p>
        <Identity />
      </section>

      <section>
        <h2>2. Serviço exclusivamente para empresas</h2>
        <ul>
          <li>
            O serviço destina-se a uso profissional. Quem cria a conta declara agir em nome de uma empresa ou no exercício
            da sua atividade profissional, e ter poderes para aceitar estes termos por essa entidade.
          </li>
          <li>
            Não se aplicam as regras de proteção do consumidor, na medida em que a lei o permita para contratos entre
            profissionais. Mantemos, por vontade própria, a garantia de reembolso de 14 dias descrita em{" "}
            <Link href="/reembolsos">Cancelamento e reembolsos</Link>.
          </li>
          <li>O Cliente é responsável por todas as pessoas a quem dá acesso (colaboradores e administradores) e pelo que fazem na conta.</li>
        </ul>
      </section>

      <section>
        <h2>3. Conta e segurança</h2>
        <ul>
          <li>O acesso faz-se por link ou código enviado para o e-mail e, se o Cliente quiser, por palavra-passe e verificação em dois passos.</li>
          <li>O Cliente deve proteger o acesso aos seus e-mails e dispositivos e avisar-nos de imediato de qualquer uso não autorizado.</li>
          <li>Recomendamos ativar a verificação em dois passos, sobretudo em contas com vários colaboradores.</li>
          <li>A informação da conta deve ser verdadeira e mantida atualizada.</li>
        </ul>
      </section>

      <section>
        <h2>4. Teste, planos, preços e pagamento</h2>
        <ul>
          <li>Novas contas têm {site.trialDays} dias de teste, sem cartão. No fim do teste, o acesso fica limitado até subscrever um plano.</li>
          <li>
            {starter.name}: {starter.priceEur} €/mês ou {starter.yearEur} €/ano, até {starter.clientLimit} clientes. {office.name}: {office.priceEur} €/mês ou{" "}
            {office.yearEur} €/ano, até {office.clientLimit} clientes. No Brasil, os preços equivalentes em reais aparecem no checkout.
          </li>
          <li>Os impostos aplicáveis (como o IVA) são calculados no checkout, consoante o país do Cliente.</li>
          <li>A assinatura renova-se automaticamente no fim de cada período até ser cancelada.</li>
          <li>
            <strong>A Paddle.com Market Limited é o Merchant of Record de todas as encomendas.</strong> A Paddle trata do
            pagamento, da fatura, dos impostos e dos reembolsos, segundo os seus próprios termos de comprador. O contrato de
            utilização do serviço é celebrado entre o Cliente e a {site.seller}. Não recebemos nem guardamos dados de cartão.
          </li>
          <li>Podemos alterar os preços com pelo menos 30 dias de aviso; a alteração aplica-se à renovação seguinte.</li>
          <li>Se um pagamento falhar, podemos limitar o acesso até à regularização, depois de avisar o Cliente.</li>
        </ul>
      </section>

      <section>
        <h2>5. Cancelamento e reembolsos</h2>
        <p>
          O Cliente pode cancelar a qualquer momento; mantém o acesso até ao fim do período já pago. As regras completas estão
          em <Link href="/reembolsos">Cancelamento e reembolsos</Link>.
        </p>
      </section>

      <section>
        <h2>6. Uso aceitável</h2>
        <ul>
          <li>Usar o serviço apenas para a recolha legítima de documentos junto dos seus próprios clientes.</li>
          <li>Não enviar spam, mensagens abusivas, enganosas ou publicitárias, nem contactar pessoas sem fundamento legal.</li>
          <li>Não usar os lembretes para pedir pagamentos, palavras-passe ou dados bancários, nem para se fazer passar por outra entidade.</li>
          <li>Não carregar conteúdo ilegal, malicioso (vírus, ficheiros executáveis) ou que viole direitos de terceiros.</li>
          <li>Não tentar aceder a dados de outros clientes, testar a segurança sem autorização, contornar limites do plano ou sobrecarregar o serviço.</li>
          <li>Não revender, sublicenciar ou disponibilizar o serviço a terceiros como se fosse seu.</li>
        </ul>
      </section>

      <section>
        <h2>7. Lembretes, ficheiros e automatismos</h2>
        <ul>
          <li>
            <strong>Lembretes automáticos por e-mail (opcionais):</strong> saem em nome do Cliente, segundo as regras que
            escolhe, só para quem tem documentos em falta. O Cliente é responsável pela exatidão dos endereços, pelo texto que
            personaliza e pelo fundamento legal para contactar cada destinatário. Podemos limitar envios diários e suspender
            envios em caso de queixas ou risco para a entrega de e-mails. A entrega depende também dos serviços de e-mail dos
            destinatários.
          </li>
          <li>
            <strong>Medição dos lembretes:</strong> para mostrar o Desempenho ao Cliente, registamos se o e-mail foi entregue,
            se foi aberto (estimativa por imagem invisível) e se a página do pedido foi visitada. Não usamos estes dados para
            outros fins.
          </li>
          <li>
            <strong>Lembretes por WhatsApp e manuais:</strong> o serviço prepara a mensagem, mas é o Cliente que a envia a
            partir das suas contas. Não somos afiliados à Meta nem ao WhatsApp.
          </li>
          <li>
            <strong>Ficheiros:</strong> ficam guardados de forma privada durante 90 dias e são apagados automaticamente. O
            serviço <strong>não é um arquivo</strong>: o Cliente deve descarregar e conservar os documentos nos seus sistemas,
            conforme as suas obrigações legais e fiscais.
          </li>
          <li>
            <strong>Arrumação automática por IA:</strong> cada ficheiro pode ser analisado por um modelo de IA (Google
            Gemini, em plano pago, sem uso dos dados para treino) para o colocar no documento certo. A análise pode falhar; o
            Cliente deve confirmar os ficheiros antes de os usar e não deve basear decisões apenas nessa arrumação.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Propriedade e licença</h2>
        <ul>
          <li>Os dados e ficheiros que o Cliente introduz são do Cliente. Concede-nos apenas a licença necessária para prestar o serviço.</li>
          <li>
            O {site.name}, o software, a marca, o design e os textos são nossos ou dos nossos licenciadores. Damos ao Cliente
            um direito de uso não exclusivo e intransmissível, enquanto a assinatura estiver ativa.
          </li>
          <li>Sugestões que o Cliente nos envie podem ser usadas para melhorar o serviço, sem obrigação de compensação.</li>
        </ul>
      </section>

      <section id="tratamento-de-dados">
        <h2>9. Acordo de tratamento de dados (art. 28.º do RGPD)</h2>
        <p>
          Quanto aos dados pessoais dos clientes do Cliente (nomes, contactos, documentos e ficheiros), o Cliente é o{" "}
          <strong>responsável pelo tratamento</strong> e nós somos <strong>subcontratante</strong>. Este ponto é o acordo
          de tratamento de dados entre as partes e aplica-se também à LGPD (Brasil) e à lei angolana de proteção de dados,
          com as necessárias adaptações.
        </p>
        <ul>
          <li><strong>Objeto e duração:</strong> recolha, arrumação, guarda temporária e envio de lembretes, enquanto durar a conta.</li>
          <li><strong>Instruções:</strong> só tratamos os dados segundo as instruções do Cliente, dadas pelo uso do serviço e por estes termos.</li>
          <li><strong>Confidencialidade:</strong> quem tem acesso aos dados está obrigado a sigilo.</li>
          <li>
            <strong>Segurança:</strong> ligação cifrada, dados cifrados em repouso, servidores na União Europeia (Irlanda),
            separação por escritório na própria base de dados, acesso por função (cada colaborador vê só os seus clientes),
            verificação em dois passos opcional e apagamento automático dos ficheiros ao fim de 90 dias.
          </li>
          <li>
            <strong>Subcontratantes ulteriores:</strong> o Cliente autoriza os que estão listados na{" "}
            <Link href="/privacidade">Política de privacidade</Link>. Avisamos com antecedência de mudanças relevantes; o
            Cliente pode opor-se por motivo fundamentado e, se não houver alternativa, cancelar.
          </li>
          <li><strong>Transferências:</strong> quando um fornecedor trate dados fora do EEE, usamos as garantias previstas no RGPD (como as cláusulas contratuais-tipo).</li>
          <li><strong>Direitos dos titulares:</strong> ajudamos o Cliente a responder a pedidos de acesso, retificação ou apagamento, sobretudo através das funções do próprio serviço.</li>
          <li><strong>Violações de dados:</strong> avisamos o Cliente sem demora injustificada depois de tomarmos conhecimento, com a informação disponível.</li>
          <li><strong>Fim do contrato:</strong> os dados são apagados (ver ponto 11), salvo obrigação legal de conservação.</li>
          <li><strong>Auditoria:</strong> disponibilizamos a informação necessária para demonstrar o cumprimento deste ponto, mediante pedido razoável.</li>
          <li>
            <strong>Obrigações do Cliente:</strong> ter fundamento legal para tratar e enviar os dados, informar os seus
            clientes, pedir apenas os documentos necessários e não carregar categorias especiais de dados sem necessidade.
          </li>
        </ul>
      </section>

      <section>
        <h2>10. Disponibilidade e suporte</h2>
        <p>
          Esforçamo-nos por manter o serviço disponível e seguro, mas pode haver interrupções para manutenção ou por falhas
          de terceiros (alojamento, e-mail, internet). O serviço é fornecido «tal como está», sem garantia de
          disponibilidade ininterrupta ou de ausência de erros. O suporte é prestado por e-mail em dias úteis.
        </p>
      </section>

      <section>
        <h2>11. Suspensão, encerramento e dados no fim</h2>
        <ul>
          <li>O dono da conta pode apagá-la a qualquer momento, em Conta. O apagamento é imediato e definitivo.</li>
          <li>
            Podemos suspender ou encerrar contas que violem estes termos, ponham em risco o serviço ou outros clientes, ou
            fiquem por pagar, avisando antes sempre que possível.
          </li>
          <li>
            Depois do cancelamento ou do fim do teste, apagamos os dados da conta e dos clientes do escritório até 30 dias
            depois. O Cliente deve descarregar antes o que precisar de conservar.
          </li>
        </ul>
      </section>

      <section>
        <h2>12. Responsabilidade</h2>
        <ul>
          <li>
            Na medida permitida por lei, não respondemos por lucros cessantes, perda de clientes, de oportunidades ou de dados
            que o Cliente devesse ter conservado, coimas ou multas aplicadas ao Cliente, nem por danos indiretos.
          </li>
          <li>
            A nossa responsabilidade total, por todas as causas, fica limitada ao valor pago pelo Cliente nos 12 meses
            anteriores ao facto que originou a reclamação.
          </li>
          <li>Não respondemos por atrasos ou falhas causados por motivos fora do nosso controlo razoável (força maior).</li>
          <li>Nada nestes termos exclui responsabilidade por dolo ou outra que a lei não permita excluir.</li>
        </ul>
      </section>

      <section>
        <h2>13. Indemnização</h2>
        <p>
          O Cliente compromete-se a defender-nos e a indemnizar-nos por reclamações de terceiros (incluindo os seus clientes
          e autoridades) resultantes do conteúdo que carrega, das mensagens que envia ou do uso do serviço contrário a estes
          termos ou à lei.
        </p>
      </section>

      <section>
        <h2>14. Alterações</h2>
        <p>
          Podemos atualizar estes termos. Alterações relevantes são avisadas com pelo menos 15 dias de antecedência por
          e-mail ou na plataforma. Se o Cliente não concordar, pode cancelar antes da data de efeito; continuar a usar o
          serviço depois dela significa aceitação.
        </p>
      </section>

      <section>
        <h2>15. Lei aplicável e litígios</h2>
        <p>
          Estes termos regem-se pela lei da República de Angola. Para qualquer litígio, as partes procuram primeiro uma
          solução amigável por escrito durante 30 dias; não sendo possível, é competente o tribunal da comarca do Huambo,
          sem prejuízo de normas imperativas em contrário.
        </p>
      </section>

      <section>
        <h2>16. Disposições finais</h2>
        <ul>
          <li>Estes termos, a Política de privacidade e a Política de reembolsos formam o acordo completo entre as partes.</li>
          <li>Se alguma cláusula for inválida, as restantes mantêm-se.</li>
          <li>Não exercer um direito não significa renunciar a ele.</li>
          <li>Em caso de diferença entre traduções, prevalece a versão em português de Portugal.</li>
          <li>
            Contacto: <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
