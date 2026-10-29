"use client";

// Definições > Lembretes automáticos: interruptor, quando enviar e o texto do e-mail,
// com pré-visualização ao vivo do e-mail tal como o cliente o recebe.
import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/app-buttons";
import { ChannelLogo } from "@/components/channel-logo";
import { Select, type SelectOption } from "@/components/select";
import { buildReminderEmail, type EmailTexts } from "@/lib/email-template";
import { sendTestEmail, updateAutoRemind } from "@/app/app/actions";

export type AutoTexts = {
  title: string;
  hint: string;
  toggle: string;
  channels: string;
  email: string;
  whatsapp: string;
  included: string;
  soon: string;
  first: string;
  repeat: string;
  max: string;
  subject: string;
  message: string;
  vars: string;
  preview: string;
  sender: string;
  noReply: string;
  when: string;
  save: string;
  saving: string;
  test: string;
};

export function AutoEmailSettings({
  t,
  email,
  sample,
  office,
  replyTo,
  defaults,
  options,
}: {
  t: AutoTexts;
  email: EmailTexts;
  sample: { client: string; period: string; due: string; link: string };
  office: string;
  replyTo: string | null;
  defaults: { on: boolean; first: number; repeat: number; max: number; subject: string; message: string };
  options: { first: SelectOption[]; repeat: SelectOption[]; max: SelectOption[] };
}) {
  const [on, setOn] = useState(defaults.on);
  const [subject, setSubject] = useState(defaults.subject);
  const [message, setMessage] = useState(defaults.message);

  const preview = useMemo(
    () =>
      buildReminderEmail(email, {
        office,
        client: sample.client,
        period: sample.period,
        dueLabel: sample.due,
        missing: 2,
        total: 5,
        link: sample.link,
        subject,
        message,
      }),
    [email, office, sample, subject, message],
  );

  return (
    <form action={updateAutoRemind} className="card space-y-6 p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg">{t.title}</h2>
        <p className="mt-1 text-sm text-muted">{t.hint}</p>
      </div>

      {/* Interruptor */}
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line px-4 py-3.5">
        <span className="text-[15px] font-medium">{t.toggle}</span>
        <input type="checkbox" name="auto_remind" checked={on} onChange={(e) => setOn(e.target.checked)} className="peer sr-only" />
        <span
          aria-hidden
          className="relative h-[26px] w-[44px] shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-ivory peer-focus-visible:outline peer-focus-visible:outline-[1.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ivory after:absolute after:left-[3px] after:top-[3px] after:h-5 after:w-5 after:rounded-full after:bg-ink-2 after:shadow-sm after:transition-transform peer-checked:after:translate-x-[18px]"
        />
      </label>

      {/* Canais */}
      <div>
        <p className="label">{t.channels}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <span className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-sm">
            <ChannelLogo channel="email" className="h-6 w-6" />
            <span className="flex-1 font-medium">{t.email}</span>
            <span className="text-[12px] font-medium text-ok">{t.included}</span>
          </span>
          <span className="flex items-center gap-3 rounded-xl border border-dashed border-line px-3.5 py-3 text-sm">
            <ChannelLogo channel="whatsapp" className="h-6 w-6" />
            <span className="flex-1 font-medium text-muted">{t.whatsapp}</span>
            <span className="rounded-full bg-ivory px-2.5 py-0.5 text-[11.5px] font-medium text-ink">{t.soon}</span>
          </span>
        </div>
      </div>

      {/* Quando enviar */}
      <fieldset className={`grid gap-4 sm:grid-cols-3 ${on ? "" : "[&_.label]:text-muted"}`}>
        <div>
          <label htmlFor="auto-first" className="label">{t.first}</label>
          <Select id="auto-first" name="auto_days_before" defaultValue={String(defaults.first)} options={options.first} disabled={!on} />
        </div>
        <div>
          <label htmlFor="auto-repeat" className="label">{t.repeat}</label>
          <Select id="auto-repeat" name="auto_repeat_days" defaultValue={String(defaults.repeat)} options={options.repeat} disabled={!on} />
        </div>
        <div>
          <label htmlFor="auto-max" className="label">{t.max}</label>
          <Select id="auto-max" name="auto_max" defaultValue={String(defaults.max)} options={options.max} disabled={!on} />
        </div>
        <p className="-mt-1 text-xs leading-5 text-muted sm:col-span-3">{t.when}</p>
      </fieldset>

      {/* Texto do e-mail + pré-visualização */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <label className="block">
            <span className="label">{t.subject}</span>
            <input name="email_subject" maxLength={160} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={email.subject} className="field" />
          </label>
          <label className="block">
            <span className="label">{t.message}</span>
            <textarea
              name="email_message"
              rows={9}
              maxLength={1500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={email.message}
              className="field text-[14px] leading-6"
            />
          </label>
          <p className="text-xs leading-5 text-muted">{t.vars}</p>
          <p className="text-xs leading-5 text-muted">
            {t.sender} <span className="font-medium text-ivory">{replyTo ?? t.noReply}</span>
          </p>
        </div>
        <div className="min-w-0">
          <p className="label">{t.preview}</p>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <p className="truncate border-b border-[#eeeff1] px-4 py-2.5 text-[13px] text-[#121316]">
              <span className="font-semibold">{office}</span> <span className="text-[#6b6e76]">· {preview.subject}</span>
            </p>
            {/* O mesmo HTML do e-mail (texto já escapado), sem links clicáveis */}
            <div className="pointer-events-none select-none" aria-label={t.preview} dangerouslySetInnerHTML={{ __html: preview.body }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton pendingText={t.saving}>{t.save}</SubmitButton>
        <button formAction={sendTestEmail} className="btn btn-secondary">
          {t.test}
        </button>
      </div>
    </form>
  );
}
