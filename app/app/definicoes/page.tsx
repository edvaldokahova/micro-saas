import { clientBase, cnameHost, CNAME_TARGET } from "@/lib/domains";
import { domainTexts } from "@/lib/domain-texts";
import { DomainCard } from "@/components/domain-card";
import { HelpTip } from "@/components/help-tip";
import { inboxHelpTexts } from "@/lib/inbox-help-texts";
import { IntegrationsCard, type DriveState } from "@/components/integrations-card";
import { integrationTexts } from "@/lib/integration-texts";
import { driveReady } from "@/lib/gdrive";
import { Toast } from "@/components/toast";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { ChannelLogo } from "@/components/channel-logo";
import { AccessFields } from "@/components/access-fields";
import { Avatar } from "@/components/avatar";
import { AutoEmailSettings } from "@/components/auto-email-settings";
import { CopyButton, SubmitButton } from "@/components/app-buttons";
import { inboxAddress } from "@/lib/inbound";
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
  const ih = inboxHelpTexts(locale);
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
  // Google Drive do escritório (a ligação vive numa tabela só acessível ao servidor)
  const it = integrationTexts(locale);
  const admin = createAdminClient();
  const [{ data: gd }, { count: drivePending }] = await Promise.all([
    admin.from("office_integrations").select("account_email, status, auto_sync, root_folder_id").eq("office_id", office.id).eq("provider", "gdrive").maybeSingle(),
    admin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("office_id", office.id)
      .eq("state", "filed")
      .is("drive_file_id", null)
      .gt("expires_at", new Date().toISOString()),
  ]);
  const drive: DriveState = {
    ready: driveReady(),
    connected: !!gd,
    email: gd?.account_email ?? null,
    expired: gd?.status === "expired",
    auto: gd?.auto_sync ?? true,
    folderId: gd?.root_folder_id ?? null,
    pending: drivePending ?? 0,
  };
  const teamLimit = office.plan === "office" ? site.plans.office.teamLimit : site.plans.starter.teamLimit;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">{t.office}</p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">{t.title}</h1>
      <div className="mt-6">
        {sp.erro?.startsWith("drive") || sp.ok === "drive" ? (
          <Toast
            tone={sp.ok === "drive" ? "ok" : "bad"}
            text={sp.ok === "drive" ? it.toast.connected : sp.erro === "drive-cancel" ? it.toast.cancel : sp.erro === "drive-scope" ? it.toast.scope : it.toast.error}
          />
        ) : (
          <Flash d={d} error={sp.erro} success={sp.convite ? d.app.team.invited(sp.convite) : sp.teste ? t.auto.testSent(sp.teste) : sp.ok ? d.common.saved : null} />
        )}
      </div>

      <form action={updateSettings} className="card space-y-5 p-5 sm:p-6">
        <label className="block">
          <span className="label">{t.officeName}</span>
          <input name="name" required maxLength={120} defaultValue={office.name} className="field" />
        </label>
        <label className="block">
          <span className="label">{t.contactEmail}</span>
          <input name="contact_email" type="email" maxLength={254} defaultValue={office.contact_email ?? ""} className="field" />
          <span className="mt-1.5 block text-xs text-muted">{t.contactHint}</span>
        </label>

        <fieldset>
          <legend className="label">{t.language}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {locales.map((l) => (
              <label
                key={l}
                className="choice flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm"
              >
                <input type="radio" name="locale" value={l} defaultChecked={l === locale} className="sr-only" />
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
          sample={{ ...t.auto.sample, link: `${clientBase(office)}/p/exemplo` }}
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg">{t.inbox.title}</h2>
            <HelpTip
              label={ih.open}
              title={ih.title}
              footer={ih.tip}
              tabs={[
                { name: ih.tabs[0], steps: ih.gmail },
                { name: ih.tabs[1], steps: ih.outlook },
                { name: ih.tabs[2], steps: ih.other },
              ]}
            />
          </div>
          <p className="mt-1 text-sm leading-6 text-muted">{t.inbox.hint}</p>
          <code className="mt-4 block truncate border-y border-line py-2.5 font-mono text-[13px]">{inbox}</code>
          <div className="mt-3">
            <CopyButton value={inbox} label={ih.copy} done={ih.copied} />
          </div>
          {/* Código que o Gmail enviou ao configurar o reencaminhamento (válido por pouco tempo) */}
          {office.inbox_confirm_code && office.inbox_confirm_at && Date.now() - new Date(office.inbox_confirm_at).getTime() < 7 * 86_400_000 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3">
              <div>
                <p className="text-[12.5px] text-muted">{ih.code}</p>
                <p className="font-mono text-[17px] tracking-wider">{office.inbox_confirm_code}</p>
                <p className="mt-0.5 text-[12px] text-muted">{ih.codeHint}</p>
              </div>
              <CopyButton value={office.inbox_confirm_code} label={d.common.copy.split(" ")[0]} done={ih.copied} compact />
            </div>
          )}
          <p className="mt-3 text-xs leading-5 text-muted">{t.inbox.note}</p>
        </section>
      )}

      <IntegrationsCard t={it} drive={drive} />

      <DomainCard
        t={domainTexts(locale)}
        domain={office.custom_domain}
        status={office.custom_domain_status}
        canUse={office.plan === "office" || office.plan === "trial"}
        cname={office.custom_domain ? { host: cnameHost(office.custom_domain), target: CNAME_TARGET } : null}
        closeLabel={d.common.cancel}
      />

      <section id="equipa" className="card mt-8 scroll-mt-24 p-5 sm:p-6">
        <h2 className="font-display text-lg">{tm.title}</h2>
        <p className="mt-1 text-sm text-muted">{tm.hint}</p>
        {team.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line-strong px-4 py-3.5 text-sm text-muted">{tm.none}</p>
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
                          <SubmitButton formAction={resendInvite} className="btn btn-secondary btn-sm">
                            {tm.resend}
                          </SubmitButton>
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
            <div className="grid gap-2 sm:grid-cols-2">
              <input name="name" required maxLength={120} placeholder={tm.name} className="field" />
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
