import { Check, Lock } from "lucide-react";

export type MessagePreviewTexts = {
  eyebrow: string;
  title: string;
  lead: string;
  points: string[];
  office: string;
  message: string; // mensagem real do modelo, já preenchida com dados fictícios
  link: string; // sem https://
  previewTitle: string;
  previewText: string;
  note: string;
};

// O que o cliente do escritório recebe: a mensagem padrão, o link curto e a pré-visualização.
// Mostra o produto como ele é, em vez de o descrever.
export function MessagePreview({ t, index = "02" }: { t: MessagePreviewTexts; index?: string }) {
  const [before, after] = t.message.split(t.link);
  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-y-6 px-5 py-24 lg:grid-cols-[120px_1fr_1.05fr] lg:gap-x-10">
        <span className="mono-label pt-3 !text-gold">{index}</span>
        <div className="reveal">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.08] sm:text-[46px]">{t.title}</h2>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-ivory/75">{t.lead}</p>
          <ul className="mt-8 border-t border-ivory text-[15px]">
            {t.points.map((p) => (
              <li key={p} className="flex items-start gap-3 border-b border-line py-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-gold" aria-hidden /> {p}
              </li>
            ))}
          </ul>
        </div>

        <figure className="reveal">
          <div className="card sheet-shadow mx-auto max-w-md overflow-hidden">
            {/* Conversa vista pelo cliente */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="grid h-9 w-9 place-items-center border border-ivory font-display text-sm" aria-hidden>
                {t.office
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <span className="text-sm font-medium">{t.office}</span>
            </div>
            <div className="bg-ink-3/40 px-4 py-6">
              <div className="mr-auto max-w-[92%] rounded-[10px] rounded-tl-[2px] border border-line bg-ink-2 p-3 text-[13.5px] leading-[1.55]">
                {/* Pré-visualização do link: nome do escritório e período, nunca o nome do cliente */}
                <div className="mb-2.5 overflow-hidden rounded-[4px] border border-line bg-ink-3/60">
                  <div className="border-l-2 border-gold px-3 py-2.5">
                    <p className="text-[13px] font-semibold leading-snug">{t.previewTitle}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{t.previewText}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                      <Lock className="h-3 w-3" aria-hidden /> entrega.bilonai.com
                    </p>
                  </div>
                </div>
                <p className="whitespace-pre-line">
                  {before}
                  <span className="font-medium text-gold underline decoration-gold/50 underline-offset-2">{t.link}</span>
                  {after}
                </p>
                <p className="mt-1.5 text-right font-mono text-[10.5px] text-muted">
                  09:41
                </p>
              </div>
            </div>
          </div>
          <figcaption className="mono-label mt-4 text-center">{t.note}</figcaption>
        </figure>
      </div>
    </section>
  );
}
