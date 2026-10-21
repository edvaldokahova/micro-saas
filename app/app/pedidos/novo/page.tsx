import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/app-buttons";
import { Flash } from "@/components/flash";
import { Select } from "@/components/select";
import { formatPeriod } from "@/lib/i18n";
import { suggestedDue } from "@/lib/deadline";
import { getSession, officeAccess, resolvePeriod, shiftPeriod } from "@/lib/office";
import { createRequest } from "../../actions";

export const metadata: Metadata = { title: "Novo pedido" };

export default async function NovoPedido({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; mes?: string; erro?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, office, d, locale } = await getSession();
  if (!officeAccess(office).canWrite) redirect("/app/assinatura");
  const t = d.app.request;
  const clientId = sp.cliente && /^[0-9a-f-]{36}$/i.test(sp.cliente) ? sp.cliente : null;

  const [{ data: clients }, { data: types }, { data: last }] = await Promise.all([
    supabase.from("clients").select("id, name, cadence").is("archived_at", null).order("name"),
    supabase.from("document_types").select("label").order("position"),
    clientId
      ? supabase.from("requests").select("id").eq("client_id", clientId).order("period", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!clients?.length) redirect("/app/clientes");

  // Documentos sugeridos: a lista do último pedido deste cliente, ou todos os tipos do escritório
  const base: string[] = (types ?? []).map((x: { label: string }) => x.label);
  let checked = new Set(base);
  let options = base;
  const lastId = (last as { id: string } | null)?.id;
  if (lastId) {
    const { data: items } = await supabase.from("request_items").select("label").eq("request_id", lastId).order("position");
    const prev: string[] = (items ?? []).map((x: { label: string }) => x.label);
    if (prev.length) {
      checked = new Set(prev);
      options = [...base, ...prev.filter((l) => !base.includes(l))];
    }
  }

  const period = resolvePeriod(sp.mes).slice(0, 7);
  // Meses à escolha: do ano passado até ao próximo mês (e o do pedido, se estiver fora disso)
  const thisMonth = new Date().toISOString().slice(0, 7);
  const months = Array.from({ length: 15 }, (_, i) => shiftPeriod(`${thisMonth}-01`, 1 - i));
  if (!months.includes(period)) months.push(period);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ivory">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {d.app.nav.dashboard}
      </Link>
      <h1 className="mt-4 font-display text-3xl">{t.newTitle}</h1>
      <div className="mt-6">
        <Flash d={d} error={sp.erro} />
      </div>

      <form action={createRequest} className="card space-y-5 p-5 sm:p-6">
        <div>
          <label htmlFor="f-client" className="label">{t.client}</label>
          <Select
            id="f-client"
            name="client"
            required
            defaultValue={clientId ?? ""}
            placeholder={d.common.choose}
            searchPlaceholder={d.common.searchClient}
            emptyText={d.common.noResults}
            options={clients.map((c: { id: string; name: string; cadence: string }) => ({
              value: c.id,
              label: c.name,
              hint: c.cadence === "quarterly" ? d.common.cadence.quarterly : undefined,
            }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-period" className="label">{t.period}</label>
            <Select
              id="f-period"
              name="period"
              required
              defaultValue={period}
              searchFrom={99}
              options={months.map((m) => ({ value: m, label: formatPeriod(`${m}-01`, locale) }))}
            />
            {clients.some((c: { cadence: string }) => c.cadence === "quarterly") && (
              <span className="mt-1.5 block text-xs text-muted">{t.periodHint}</span>
            )}
          </div>
          <label className="block">
            <span className="label">
              {t.due} <span className="opacity-70">({d.common.optional})</span>
            </span>
            <input name="due" type="date" defaultValue={suggestedDue(period)} className="field" />
          </label>
        </div>

        <fieldset>
          <legend className="label">{t.docs}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((label) => (
              <label
                key={label}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-sm transition has-[:checked]:border-gold/60 has-[:checked]:bg-gold/5"
              >
                <input type="checkbox" name="doc" value={label} defaultChecked={checked.has(label)} className="h-4 w-4 accent-[var(--color-gold)]" />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input name="extra" maxLength={120} placeholder={`+ ${t.extra}`} className="field" />
            <input name="extra" maxLength={120} placeholder={`+ ${t.extra}`} className="field" />
          </div>
        </fieldset>

        <label className="block">
          <span className="label">
            {t.note} <span className="opacity-70">({d.common.optional})</span>
          </span>
          <textarea name="note" rows={3} maxLength={1000} placeholder={t.notePlaceholder} className="field" />
        </label>

        <SubmitButton pendingText={d.common.saving} className="btn btn-primary w-full py-3.5">
          {t.create}
        </SubmitButton>
      </form>
    </div>
  );
}
