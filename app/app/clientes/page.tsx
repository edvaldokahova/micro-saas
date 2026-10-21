import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Phone, Plus } from "lucide-react";
import { CadenceField } from "@/components/cadence-field";
import { SubmitButton } from "@/components/app-buttons";
import { Flash } from "@/components/flash";
import { Select } from "@/components/select";
import { ListSearch } from "@/components/list-search";
import { clientLimit, getSession, officeAccess } from "@/lib/office";
import { addClient } from "../actions";

export const metadata: Metadata = { title: "Clientes" };

type Client = { id: string; name: string; phone: string | null; email: string | null; archived_at: string | null; assignee_id: string | null; cadence: string };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { supabase, office, d, isManager } = await getSession();
  const t = d.app.clients;
  const [{ data }, { data: teamData }] = await Promise.all([
    supabase.from("clients").select("id, name, phone, email, archived_at, assignee_id, cadence").order("name"),
    supabase.from("team_members").select("id, name").order("name"),
  ]);
  const team = (teamData ?? []) as { id: string; name: string }[];
  const teamName = new Map(team.map((m) => [m.id, m.name]));
  const all = (data ?? []) as Client[];
  const active = all.filter((c) => !c.archived_at);
  const archived = all.filter((c) => c.archived_at);
  const limit = clientLimit(office);
  const canAdd = isManager && officeAccess(office).canWrite && active.length < limit;

  return (
    <div>
      <Flash d={d} error={sp.erro} success={sp.ok ? d.common.saved : null} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.title}</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{t.title}</h1>
          {isManager && <p className="mt-2 text-sm text-muted">{t.count(active.length, limit)}</p>}
        </div>
      </div>

      <div className={`mt-8 grid gap-6 ${isManager ? "lg:grid-cols-[1fr_380px]" : ""}`}>
        {/* Lista */}
        <div className="order-2 lg:order-1">
          {active.length === 0 ? (
            <p className="card p-8 text-center text-muted">{t.empty}</p>
          ) : (
            <>
            {active.length >= 8 && (
              <div className="mb-3">
                <ListSearch listId="lista-clientes" placeholder={d.common.searchClient} emptyText={d.common.noResults} />
              </div>
            )}
            <ul id="lista-clientes" className="card divide-y divide-line overflow-hidden">
              {active.map((c, i) => (
                <li key={c.id} data-search={`${c.name} ${c.phone ?? ""} ${c.email ?? ""}`} className="animate-rise" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-line-strong font-display text-[15px]">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <Link href={`/app/clientes/${c.id}`} className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="flex items-center gap-1.5 truncate text-xs text-muted">
                        {c.phone && <Phone className="h-3 w-3" aria-hidden />}
                        {c.phone ?? c.email ?? "—"}
                        {c.cadence === "quarterly" && (
                          <span className="ml-1 rounded-[3px] border border-line px-2 py-px text-[10.5px]">{d.common.cadence.quarterly}</span>
                        )}
                        {c.assignee_id && teamName.get(c.assignee_id) && (
                          <span className="ml-1 rounded-[3px] bg-ink-3 px-2 py-px text-[10.5px] text-ivory/80">{teamName.get(c.assignee_id)}</span>
                        )}
                      </span>
                    </Link>
                    {officeAccess(office).canWrite && (
                      <Link href={`/app/pedidos/novo?cliente=${c.id}`} className="btn btn-secondary btn-sm" title={t.newRequest}>
                        <Plus className="h-4 w-4" aria-hidden />
                        <span className="hidden sm:inline">{t.newRequest}</span>
                      </Link>
                    )}
                    <Link href={`/app/clientes/${c.id}`} className="text-muted hover:text-ivory" aria-label={t.editTitle}>
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            </>
          )}

          {archived.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-muted hover:text-ivory">
                {t.archived} ({archived.length})
              </summary>
              <p className="mt-2 text-xs text-muted">{t.archiveHint}</p>
              <ul className="card mt-3 divide-y divide-line">
                {archived.map((c) => (
                  <li key={c.id}>
                    <Link href={`/app/clientes/${c.id}`} className="block px-5 py-3 text-sm text-muted hover:text-ivory">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* Adicionar (só dono e administradores) */}
        {isManager && (
        <div className="order-1 lg:order-2">
          <form action={addClient} className="card space-y-4 p-5 lg:sticky lg:top-24">
            <h2 className="font-display text-lg">{t.add}</h2>
            <label className="block">
              <span className="label">{t.name}</span>
              <input name="name" required maxLength={160} className="field" disabled={!canAdd} autoComplete="off" />
            </label>
            <label className="block">
              <span className="label">{t.phone}</span>
              <input name="phone" type="tel" inputMode="tel" maxLength={24} className="field" disabled={!canAdd} autoComplete="off" />
              <span className="mt-1.5 block text-xs text-muted">{t.phoneHint}</span>
            </label>
            <label className="block">
              <span className="label">
                {t.email} <span className="opacity-70">({d.common.optional})</span>
              </span>
              <input name="email" type="email" maxLength={254} className="field" disabled={!canAdd} autoComplete="off" />
            </label>
            {/* Em Espanha o ciclo normal é trimestral (modelo 303); em Portugal e no Brasil, mensal */}
            <CadenceField
              defaultValue={office.locale === "es-ES" ? "quarterly" : "monthly"}
              labels={d.common.cadence}
              label={t.cadence}
              hint={t.cadenceHint}
              disabled={!canAdd}
            />
            {team.length > 0 && (
            <div>
              <label htmlFor="f-assignee" className="label">{d.app.team.assignee}</label>
              <Select
                id="f-assignee"
                name="assignee"
                defaultValue={""} disabled={!canAdd}
                options={[{ value: "", label: d.app.team.general }, ...team.map((m) => ({ value: m.id, label: m.name }))]}
              />
            </div>
            )}
            {canAdd ? (
              <SubmitButton pendingText={d.common.saving} className="btn btn-primary w-full">
                {t.add}
              </SubmitButton>
            ) : (
              <p className="text-sm text-warn">{officeAccess(office).canWrite ? t.errors.limit : t.errors.inactive}</p>
            )}
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
