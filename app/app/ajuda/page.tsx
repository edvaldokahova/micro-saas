import type { Metadata } from "next";
import { getSession } from "@/lib/office";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Ajuda" };

// Ajuda e suporte dentro do painel (com sessão): o mesmo conteúdo da página pública de suporte
export default async function Ajuda() {
  const { d, user, office } = await getSession();
  const s = d.support;
  const subject = encodeURIComponent(`${site.name} · ${office.name}`);
  const body = encodeURIComponent(`\n\n—\n${user.email ?? ""} · ${office.name}`);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl">{s.title}</h1>
      <p className="mt-2 text-muted">{s.intro}</p>

      <a
        href={`mailto:${site.supportEmail}?subject=${subject}&body=${body}`}
        className="card mt-7 flex items-center justify-between gap-4 p-5 transition hover:border-ivory"
      >
        <span>
          <span className="block font-medium">{site.supportEmail}</span>
          <span className="mt-1 block text-sm leading-6 text-muted">{s.reply}</span>
        </span>
        <svg className="h-5 w-5 shrink-0 text-muted" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7.5 4.5L13 10l-5.5 5.5" />
        </svg>
      </a>

      <section className="mt-10">
        <h2 className="text-[17px] font-semibold">{s.faqTitle}</h2>
        <div className="mt-2 divide-y divide-line border-y border-line">
          {s.faq(site.plans.starter.clientLimit, site.plans.office.clientLimit).map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <svg className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-45" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </summary>
              <p className="mt-2 text-[15px] leading-7 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[17px] font-semibold">{s.paymentsTitle}</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted">{s.payments}</p>
      </section>
    </div>
  );
}
