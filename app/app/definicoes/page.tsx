import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { ChannelLogo } from "@/components/channel-logo";
import { AccessFields } from "@/components/access-fields";
import { Avatar } from "@/components/avatar";
import { AutoEmailSettings } from "@/components/auto-email-settings";
import { CopyButton, SubmitButton } from "@/components/app-buttons";
import { inboxAddress } from "@/lib/inbound";
import { Flag } from "@/components/flags";
import { Flash } from "@/components/flash";
import { localeMeta, locales } from "@/lib/i18n";
import { getSession } from "@/lib/office";
import { addDocType, addTeamMember, removeDocType, removeTeamMember, resendInvite, updateSettings, updateTeamAccess } from "../actions";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Definições" };

export default async function Definicoes({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string; convite?: string; teste?: string }> }) {
  const sp = await searchParams;
  const { supabase, office, locale, d, isManager, user } = await getSession();
  if (!isManager) redirect("/");
  const t = d.app.settings;
  const inbox = inboxAddress(office.inbox_key);
  const [{ data }, { data: teamData }] = await Promise.all([
    supabase.from("document_types").select("id, label").order("position"),
    supabase.from("team_members").select("id, name, phone, email, access, see_all, user_id, joined_at").order("created_at"),
  ]);
  const types = (data ?? []) as { id: string; label: string }[];
  type Member = {
    id: string; name: string; phone: string | null; email: string | null;
    access: "none" | "member" | "admin"; see_all: boolean; user_id: string | null; joined_at: string | null;
  };
  const team = (teamData ?? []) as Member[];
  const tm = d.app.team;
  const teamLimit = office.plan === "office" ? site.plans.office.teamLimit : site.plans.starter.teamLimit;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">{t.office}</p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">{t.title}</h1>
      <div className="mt-6">
        <Flash d={d} error={sp.erro} success={sp.convite ? d.app.team.invited(sp.convite) : sp.teste ? t.auto.testSent(sp.teste) : sp.ok ? d.common.saved : null} />
      </div>

      <form action={updateSettings} className="card space-y-5 p-5 sm:p-6">
        <label className="block">
          <span className="label">{t.officeName}</span>
          <input name="name" required maxLength={120} defaultValue={office.name} className="field" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">{t.contactPhone}</span>
            <input name="contact_phone" type="tel" inputMode="tel" maxLength={24} defaultValue={office.contact_phone ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="label">{t.contactEmail}</span>
            <input name="contact_email" type="email" maxLength={254} defaultValue={office.contact_email ?? ""} className="field" />
          </label>
          <p className="-mt-2 text-xs text-muted sm:col-span-2">{t.contactHint}</p>
        </div>

        <fieldset>
          <legend className="label">{t.language}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {locales.map((l) => (
              <label
                key={l}
                className="choice flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm"
              >
                <input type="radio" name="locale" value={l} defaultChecked={l === locale} className="sr-only" />
                <Flag locale={l} />
                {localeMeta[l].name}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="label">{t.template}</span>
          <textarea
            name="reminder_template"
            rows={6}
            maxLength={1000}
            defaultValue={office.reminder_template ?? ""}
            placeholder={d.app.whatsappTemplate}
            className="field font-mono text-[13px] leading-6"
          />
          <span className="mt-1.5 block text-xs text-muted">{t.templateHint}</span>
        </label>

        <SubmitButton pendingText={d.common.saving}>{d.common.save}</SubmitButton>
      </form>

      <section id="automatico" className="mt-8 scroll-mt-24">
        <AutoEmailSettings
          t={{
            title: t.auto.title,
            hint: t.auto.hint,
            toggle: t.auto.toggle,
            channels: t.auto.channels,
            email: t.auto.email,
            whatsapp: t.auto.whatsapp,
            included: t.auto.included,
            soon: t.auto.soon,
            first: t.auto.first,
            repeat: t.auto.repeat,
            max: t.auto.max,
            subject: t.auto.subject,
            message: t.auto.message,
            vars: t.auto.vars,
            preview: t.auto.preview,
            sender: t.auto.sender(office.name),
            noReply: t.auto.noReply,
            when: t.auto.when,
            save: d.common.save,
            saving: d.common.saving,
            test: t.auto.test,
          }}
          email={d.autoEmail}
          sample={{ ...t.auto.sample, link: `${site.clientUrl}/p/exemplo` }}
          office={office.name}
          replyTo={office.contact_email || user.email || null}
          defaults={{
            on: office.auto_remind,
            first: office.auto_days_before,
            repeat: office.auto_repeat_days,
            max: office.auto_max,
            subject: office.email_subject ?? "",
            message: office.email_message ?? "",
          }}
          options={{
            first: [0, 1, 2, 3, 5, 7].map((n) => ({ value: String(n), label: t.auto.firstOpt(n) })),
            repeat: [2, 3, 4, 5, 7].map((n) => ({ value: String(n), label: t.auto.repeatOpt(n) })),
            max: [1, 2, 3].map((n) => ({ value: String(n), label: t.auto.maxOpt(n) })),
          }}
        />
      </section>

      {/* Recolha por e-mail: endereço do escritório para uma regra de reencaminhamento (opcional) */}
      {inbox && (
        <section id="recolha" className="card mt-8 scroll-mt-24 p-5 sm:p-6">
          <h2 className="font-display text-lg">{t.inbox.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{t.inbox.hint}</p>
          <code className="mt-4 block truncate border-y border-line py-2.5 font-mono text-[13px]">{inbox}</code>
          <div className="mt-3">
            <CopyButton value={inbox} label={d.common.copy} done={d.common.copied} />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">{t.inbox.note}</p>
        </section>
      )}

      <section id="equipa" className="card mt-8 scroll-mt-24 p-5 sm:p-6">
        <h2 className="font-display text-lg">{tm.title}</h2>
        <p className="mt-1 text-sm text-muted">{tm.hint}</p>
        {team.length === 0 ? (
          <p className="mt-4 border border-dashed border-line px-4 py-3 text-sm text-muted">{tm.none}</p>
        ) : (
          <ul className="mt-5 border-t border-line">
            {team.map((m) => {
              const status = m.access === "none" ? tm.status.contact : m.joined_at ? tm.status.active : tm.status.invited;
              return (
                <li key={m.id} className="border-b border-line py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.name}</p>
                      <p className="flex flex-wrap gap-x-3 font-mono text-[11px] text-muted">
                        {m.phone && (
                          <span className="inline-flex items-center gap-1">
                            <ChannelLogo channel="whatsapp" className="h-3 w-3" /> {m.phone}
                          </span>
                        )}
                        {m.email && (
                          <span className="inline-flex items-center gap-1">
                            <ChannelLogo channel="email" className="h-3 w-3" /> {m.email}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-right">
                      <span className="block text-sm">{tm.access[m.access]}</span>
                      <span className={`block text-[12px] font-medium ${m.access === "none" ? "text-muted" : m.joined_at ? "text-ok" : "text-gold"}`}>
                        {status}
                      </span>
                    </span>
                  </div>

                  {/* Acesso: alterar, reenviar convite, remover */}
                  <details className="group/m mt-2 pl-12">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-muted hover:text-ivory [&::-webkit-details-marker]:hidden">
                      {tm.accessLabel} <span className="transition group-open/m:rotate-180">▾</span>
                    </summary>
                    <form action={updateTeamAccess} className="mt-3 space-y-3">
                      <input type="hidden" name="id" value={m.id} />
                      <AccessFields idPrefix={`m-${m.id}`} defaultAccess={m.access} defaultSeeAll={m.see_all} t={tm} />
                      <div className="flex flex-wrap items-center gap-2">
                        <SubmitButton className="btn btn-primary btn-sm" pendingText={d.common.saving}>
                          {d.common.save}
                        </SubmitButton>
                        {m.access !== "none" && !m.joined_at && (
                          <button formAction={resendInvite} className="btn btn-secondary btn-sm">
                            {tm.resend}
                          </button>
                        )}
                      </div>
                    </form>
                    <form action={removeTeamMember} className="mt-3">
                      <input type="hidden" name="id" value={m.id} />
                      <SubmitButton className="btn btn-sm min-h-0 px-0 text-bad hover:underline" confirm={tm.removeConfirm} pendingText="…">
                        {d.common.remove}
                      </SubmitButton>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
        {team.length < teamLimit ? (
          <form action={addTeamMember} className="mt-6 space-y-4 border-t border-line pt-5">
            <p className="font-medium">{tm.add}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <input name="name" required maxLength={120} placeholder={tm.name} className="field" />
              <input name="phone" type="tel" inputMode="tel" maxLength={24} placeholder={tm.phone} className="field" />
              <input name="email" type="email" maxLength={254} placeholder={tm.email} className="field" />
            </div>
            <AccessFields idPrefix="novo" t={tm} />
            <p className="text-xs text-muted">{tm.inviteHint}</p>
            <SubmitButton className="btn btn-primary">{tm.add}</SubmitButton>
          </form>
        ) : null}
        <p className="mt-3 text-xs text-muted">{tm.limit(teamLimit)}</p>
      </section>

      <section id="tipos" className="card mt-8 scroll-mt-24 p-5 sm:p-6">
        <h2 className="font-display text-lg">{t.docTypes}</h2>
        <p className="mt-1 text-sm text-muted">{t.docTypesHint}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {types.map((x) => (
            <li key={x.id} className="flex items-center gap-1 rounded-lg border border-line bg-ink-3 py-1 pl-3.5 pr-1 text-sm">
              {x.label}
              <form action={removeDocType}>
                <input type="hidden" name="id" value={x.id} />
                <button className="grid h-6 w-6 place-items-center rounded-full text-muted transition hover:bg-bad/15 hover:text-bad" aria-label={`${d.common.remove}: ${x.label}`}>
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addDocType} className="mt-4 flex gap-2">
          <input name="label" required maxLength={120} placeholder={t.addType} className="field" />
          <SubmitButton className="btn btn-secondary">{d.app.request.add}</SubmitButton>
        </form>
      </section>
    </div>
  );
}
