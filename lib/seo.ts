// Dados estruturados (schema.org, JSON-LD) da página inicial: dizem ao Google e às IAs, sem ambiguidade,
// o que é o Bilonai, quem o vende, quanto custa e as perguntas frequentes. Tudo lido de site.ts e do dicionário.
import { getDictionary, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

export function homeJsonLd(locale: Locale) {
  const d = getDictionary(locale);
  const h = d.home;
  const org = `${site.url}/#organizacao`;
  const plans = Object.values(site.plans);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: site.name,
        legalName: site.legal.registeredName,
        url: site.url,
        logo: `${site.url}/android-chrome-512x512.png`,
        email: site.supportEmail,
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: site.supportEmail, availableLanguage: ["pt", "es"] },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#site`,
        url: site.url,
        name: site.name,
        inLanguage: locale,
        publisher: { "@id": org },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${site.url}/#produto`,
        name: site.name,
        url: site.url,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Recolha de documentos para escritórios de contabilidade",
        operatingSystem: "Web, iOS, Android (no navegador)",
        description: h.metaDescription(site.trialDays),
        inLanguage: ["pt-PT", "pt-BR", "es-ES"],
        areaServed: ["PT", "ES", "BR"],
        audience: { "@type": "BusinessAudience", audienceType: "Escritórios de contabilidade e contabilistas certificados" },
        featureList: h.features,
        publisher: { "@id": org },
        offers: plans.flatMap((p) => [
          { "@type": "Offer", name: `${p.name} (mensal)`, price: p.priceEur, priceCurrency: "EUR", url: `${site.url}/precos`, eligibleRegion: ["PT", "ES"], description: d.common.upToClients(p.clientLimit) },
          { "@type": "Offer", name: `${p.name} (mensal)`, price: p.priceBrl, priceCurrency: "BRL", url: `${site.url}/precos`, eligibleRegion: "BR", description: d.common.upToClients(p.clientLimit) },
        ]),
      },
      {
        "@type": "FAQPage",
        "@id": `${site.url}/#perguntas`,
        mainEntity: h.faq(site.trialDays).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
}

// JSON seguro para pôr dentro de <script> (sem «</» que fecharia a etiqueta)
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
