import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { CadenceField } from "@/components/cadence-field";
import { SubmitButton } from "@/components/app-buttons";
import { Flash } from "@/components/flash";
import { Select } from "@/components/select";
import { formatPeriod } from "@/lib/i18n";
import { getSession, officeAccess } from "@/lib/office";
import { setClientArchived, updateClient } from "../../actions";

export const metadata: Metadata = { title: "Cliente" };

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  archived_at: string | null;
  assignee_id: string | null;
  cadence: string;
};
type Req = { id: string; period: string; months: number; total_items: number; received_items: number };

export default async function Cliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, office, locale, d, isManager } = await getSession();
  const t = d.app.clients;

  const [{ data: c }, { data: reqs }, { data: teamData }] = await Promise.all([
    supabase.from("clients").select("id, name, phone, email, notes, archived_at, assignee_id, cadence").eq("id", id).maybeSingle(),
    supabase.from("requests_overview").select("id, period, months, total_items, received_items").eq("client_id", id).order("period", { ascending: false }).limit(24),
    supabase.from("team_members").select("id, name").order("name"),
  ]);
  const team = (teamData ?? []) as { id: string; name: string }[];
  if (!c) notFound();
  const client = c as Client;
  const history = (reqs ?? []) as Req[];
  const canWrite = officeAccess(office).canWrite;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ivory">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t.title}
      </Link>
      <div className="mt-4">
        <Flash d={d} error={sp.erro} success={sp.ok ? d.common.saved : null} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{client.name}</h1>
        {canWrite && !client.archived_at && (
          <Link href={`/pedidos/novo?cliente=${client.id}`} className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden /> {t.newRequest}
          </Link>
        )}
      </div>

      <form action={updateClient} className="card mt-6 grid gap-4 p-5 sm:grid-cols-2">
        {/* Colaboradores consultam; editar é do dono e dos administradores */}
        <fieldset disabled={!isManager} className="contents">
        <input type="hidden" name="id" value={client.id} />
        <h2 className="font-display text-lg sm:col-span-2">{t.editTitle}</h2>
        <label className="block sm:col-span-2">
          <span className="label">{t.name}</span>
          <input name="name" required maxLength={160} defaultValue={client.name} className="field" />
        </label>
        <label className="block">
          <span className="label">{t.phone}</span>
          <input name="phone" type="tel" inputMode="tel" maxLength={24} defaultValue={client.phone ?? ""} className="field" />
          <span className="mt-1.5 block text-xs text-muted">{t.phoneHint}</span>
        </label>
        <label className="block">
          <span className="label">{t.email}</span>
          <input name="email" type="email" maxLength={254} defaultValue={client.email ?? ""} className="field" />
        </label>
        <div className="sm:col-span-2">
          <CadenceField
            defaultValue={client.cadence === "quarterly" ? "quarterly" : "monthly"}
            labels={d.common.cadence}
            label={t.cadence}
            hint={t.cadenceHint}
          />
        </div>
        {team.length > 0 && (
          <div className="sm:col-span-2">
            <div>
              <label htmlFor="f-assignee" className="label">{d.app.team.assignee}</label>
              <Select
                id="f-assignee"
                name="assignee"
                defaultValue={client.assignee_id ?? ""}
                options={[{ value: "", label: d.app.team.general }, ...team.map((m) => ({ value: m.id, label: m.name }))]}
              />
            </div>
          </div>
        )}
        <label className="block sm:col-span-2">
          <span className="label">{t.notes}</span>
          <textarea name="notes" rows={3} maxLength={2000} defaultValue={client.notes ?? ""} className="field" />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          {isManager && <SubmitButton pendingText={d.common.saving}>{d.common.save}</SubmitButton>}
        </div>
        </fieldset>
      </form>

      <section className="mt-8">
        <h2 className="font-display text-lg">{t.history}</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t.noHistory}</p>
        ) : (
          <ul className="card mt-3 divide-y divide-line">
            {history.map((r) => {
              const done = r.total_items > 0 && r.received_items === r.total_items;
              return (
                <li key={r.id}>
                  <Link href={`/pedidos/${r.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm hover:bg-ink-3/50">
                    <span className="font-medium">{formatPeriod(r.period, locale, r.months)}</span>
                    <span className={done ? "text-ok" : "text-muted"}>{d.app.dashboard.docsOf(r.received_items, r.total_items)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

{isManager && (
      <form action={setClientArchived} className="mt-10 border-t border-line pt-6">
        <input type="hidden" name="id" value={client.id} />
        <input type="hidden" name="archive" value={client.archived_at ? "0" : "1"} />
        <p className="mb-3 text-xs text-muted">{t.archiveHint}</p>
        <SubmitButton className="btn btn-secondary btn-sm">{client.archived_at ? t.unarchive : t.archive}</SubmitButton>
      </form>
      )}
    </div>
  );
}
