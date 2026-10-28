import type { Metadata } from "next";
import Link from "next/link";
import { PageMotion } from "@/components/page-motion";
import { PricingPlans } from "@/components/pricing";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/prefs";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDictionary(await getLocale());
  return { title: d.nav.pricing, description: d.home.pricingLead(site.trialDays), alternates: { canonical: "/precos" } };
}

// Página de preços própria (a Paddle pede uma página de preços pública, com o que se cobra e as condições)
export default async function Precos() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const h = d.home;
  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip">
        <section>
          <div className="mx-auto max-w-6xl px-5 pb-24 pt-16 sm:pt-24">
            <h1 data-split="chars" className="max-w-[14ch] font-display text-[clamp(2.6rem,7vw,5.4rem)] leading-[0.96] tracking-[-0.04em]">
              {h.pricingTitle}
            </h1>
            <p data-split="lines" className="mt-6 max-w-[56ch] text-[18px] leading-[1.6] text-muted">
              {h.pricingLead(site.trialDays)}
            </p>
            <PricingPlans locale={locale} />
            <p className="mt-8 max-w-[72ch] text-[14px] leading-[1.7] text-muted">
              {d.app.billing.note}{" "}
              <Link className="text-ivory underline decoration-line-strong underline-offset-4 hover:decoration-ivory" href="/reembolsos">
                {d.nav.refunds}
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
            <h2 data-split="chars" className="font-display text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.02]">{h.faqTitle}</h2>
            <div className="divide-y divide-line border-y border-line">
              {h.faq(site.trialDays).map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition duration-300 group-open:rotate-45" aria-hidden>
                      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 1.5v9M1.5 6h9" /></svg>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[60ch] leading-7 text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <PageMotion />
    </>
  );
}
