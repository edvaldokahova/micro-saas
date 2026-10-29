import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { LegalPage } from "@/components/legal-page";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDictionary(await getLocale());
  return { title: d.support.title, description: d.support.intro, alternates: { canonical: "/suporte" } };
}

export default async function Suporte() {
  const d = getDictionary(await getLocale());
  const s = d.support;
  return (
    <LegalPage title={s.title} intro={s.intro} translated>
      <section>
        <a
          href={`mailto:${site.supportEmail}`}
          className="card inline-flex items-center gap-3 px-5 py-4 no-underline transition hover:border-ivory hover:no-underline"
        >
          <Mail className="h-5 w-5 text-gold" aria-hidden />
          <span className="text-ivory">{site.supportEmail}</span>
        </a>
        <p className="mt-4">{s.reply}</p>
      </section>

      <section>
        <h2>{s.faqTitle}</h2>
        {s.faq(site.plans.starter.clientLimit, site.plans.office.clientLimit).map((f) => (
          <div key={f.q} className="mt-5">
            <h3 className="font-medium text-ivory">{f.q}</h3>
            <p className="mt-1">{f.a}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>{s.paymentsTitle}</h2>
        <p>{s.payments}</p>
      </section>
    </LegalPage>
  );
}
