import type { Metadata } from "next";
import Link from "next/link";
import { getSession, dashboardMonth } from "@/lib/office";
import { formatPeriod } from "@/lib/i18n";
import { DocList, ZipButton } from "@/components/doc-files";
import { DOC_COLUMNS, docTexts, docView, type DocRow } from "@/lib/doc-view";

export const metadata: Metadata = { title: "Documentos" };

type Row = DocRow & { clients: { name: string } | null; requests: { period: string; months: number } | null };

// Todos os ficheiros recebidos, num só sítio: primeiro os que estão por confirmar,
// depois o mês escolhido, por cliente e por documento do pedido.
export default async function Documentos({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  const { supabase, locale, d } = await getSession();
  const x = d.app.docs;
  const dt = docTexts(d);

  const { data } = await supabase
    .from("documents")
    .select(`${DOC_COLUMNS}, clients(name), requests(period, months)`)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);
  const rows = (data ?? []) as unknown as Row[];

  // Documentos de cada pedido (para arrumar e para os títulos)
  const requestIds = [...new Set(rows.map((r) => r.request_id).filter((v): v is string => !!v))];
  const { data: it } = requestIds.length
    ? await supabase.from("request_items").select("id, label, request_id").in("request_id", requestIds).order("position").order("created_at")
    : { data: [] };
  const itemsOf = new Map<string, { id: string; label: string }[]>();
  for (const i of (it ?? []) as { id: string; label: string; request_id: string }[]) {
    itemsOf.set(i.request_id, [...(itemsOf.get(i.request_id) ?? []), { id: i.id, label: i.label }]);
  }

  const monthOf = (r: Row) => (r.requests ? dashboardMonth(r.requests.period, r.requests.months) : r.created_at.slice(0, 7));
  const review = rows.filter((r) => r.state === "review");
  const filed = rows.filter((r) => r.state === "filed");
  const months = [...new Set(filed.map(monthOf))].sort().reverse();
  const mes = sp.mes && months.includes(sp.mes) ? sp.mes : months[0];
  const ofMonth = filed.filter((r) => monthOf(r) === mes);

  // Agrupar por pedido (cliente + período)
  const groups = (list: Row[]) => {
    const m = new Map<string, Row[]>();
    for (const r of list) m.set(r.request_id ?? "none", [...(m.get(r.request_id ?? "none") ?? []), r]);
    return [...m.entries()]
      .map(([requestId, docs]) => ({ requestId, docs, client: docs[0].clients?.name ?? "—", req: docs[0].requests }))
      .sort((a, b) => a.client.localeCompare(b.client, locale));
  };
  const periodOf = (req: Row["requests"]) => (req ? formatPeriod(req.period, locale, req.months) : "");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-[2.2rem] leading-none">{x.title}</h1>
      <p className="mt-2 max-w-[60ch] text-sm text-muted">{x.hint}</p>

      {rows.length === 0 && <p className="card mt-8 p-6 text-sm leading-6 text-muted">{x.empty}</p>}

      {/* Por confirmar */}
      {review.length > 0 && (
        <section className="mt-8 rounded-2xl border border-line-strong p-4 sm:p-5">
          <h2 className="text-[15px] font-semibold">
            {x.review} <span className="font-normal text-muted">· {x.files(review.length)}</span>
          </h2>
          <p className="mt-1 text-[13px] text-muted">{x.reviewHint}</p>
          <div className="mt-4 space-y-5">
            {groups(review).map((g) => (
              <div key={g.requestId}>
                <p className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-[14px]">
                  <span className="font-medium">
                    {g.client} <span className="text-muted">· {periodOf(g.req)}</span>
                  </span>
                  {g.requestId !== "none" && (
                    <Link href={`/pedidos/${g.requestId}`} className="text-[12.5px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ivory">
                      {x.openRequest}
                    </Link>
                  )}
                </p>
                <DocList docs={g.docs.map((r) => docView(r, locale))} items={itemsOf.get(g.requestId) ?? []} t={dt} review />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Meses com ficheiros */}
      {months.length > 0 && (
        <>
          <nav className="mt-10 flex flex-wrap gap-2" aria-label={x.title}>
            {months.map((m) => (
              <Link
                key={m}
                href={`/documentos?mes=${m}`}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] capitalize transition ${m === mes ? "border-ivory bg-ivory text-ink" : "border-line-strong text-muted hover:text-ivory"}`}
              >
                {formatPeriod(`${m}-01`, locale)}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-sm text-muted">{x.files(ofMonth.length)}</p>
            {ofMonth.length <= 300 && <ZipButton ids={ofMonth.map((r) => r.id)} name={`${x.title} ${mes}`} t={dt} />}
          </div>

          <div className="mt-6 space-y-8">
            {groups(ofMonth).map((g) => {
              const items = itemsOf.get(g.requestId) ?? [];
              const byItem = items
                .map((i) => ({ ...i, docs: g.docs.filter((r) => r.item_id === i.id) }))
                .filter((i) => i.docs.length > 0);
              return (
                <section key={g.requestId}>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="font-display text-[1.35rem] leading-tight">
                        {g.requestId !== "none" ? (
                          <Link href={`/pedidos/${g.requestId}`} className="underline-offset-4 hover:underline">
                            {g.client}
                          </Link>
                        ) : (
                          g.client
                        )}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {periodOf(g.req)} · {x.files(g.docs.length)}
                      </p>
                    </div>
                    <ZipButton ids={g.docs.map((r) => r.id)} name={`${g.client} - ${periodOf(g.req)}`} t={dt} />
                  </div>
                  <div className="mt-3 space-y-4">
                    {byItem.map((i) => (
                      <div key={i.id}>
                        <p className="mb-1.5 text-[13.5px] font-medium">{i.label}</p>
                        <DocList docs={i.docs.map((r) => docView(r, locale))} items={items} t={dt} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
