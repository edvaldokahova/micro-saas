import type { Metadata } from "next";
import { X } from "lucide-react";
import { SubmitButton } from "@/components/app-buttons";
import { Flag } from "@/components/flags";
import { Flash } from "@/components/flash";
import { localeMeta, locales } from "@/lib/i18n";
import { getSession } from "@/lib/office";
import { addDocType, removeDocType, updateSettings } from "../actions";

export const metadata: Metadata = { title: "Definições" };

export default async function Definicoes({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { supabase, office, locale, d } = await getSession();
  const t = d.app.settings;
  const { data } = await supabase.from("document_types").select("id, label").order("position");
  const types = (data ?? []) as { id: string; label: string }[];

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">{t.office}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
      <div className="mt-6">
        <Flash d={d} error={sp.erro} success={sp.ok ? d.common.saved : null} />
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
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-sm transition has-[:checked]:border-gold has-[:checked]:bg-gold/10"
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

      <section id="tipos" className="card mt-8 scroll-mt-24 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">{t.docTypes}</h2>
        <p className="mt-1 text-sm text-muted">{t.docTypesHint}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {types.map((x) => (
            <li key={x.id} className="flex items-center gap-1 rounded-full border border-line bg-ink-3 py-1 pl-3.5 pr-1 text-sm">
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
