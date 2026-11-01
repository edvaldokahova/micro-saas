"use client";

// Fuso horário do escritório (em Conta). Usa o menu de seleção próprio, com pesquisa.
import { useMemo, useState } from "react";
import { Select } from "@/components/select";
import { Toast } from "@/components/toast";
import { setTimezone } from "@/app/app/conta/actions";
import { TIMEZONES, tzLabel } from "@/lib/timezone";
import type { AccountTexts } from "@/lib/account-texts";

export function TimezoneCard({ t, value, canEdit, search }: { t: AccountTexts; value: string; canEdit: boolean; search: string }) {
  const [note, setNote] = useState<{ ok: boolean; key: number } | null>(null);
  const options = useMemo(() => {
    const list: string[] = TIMEZONES.includes(value as (typeof TIMEZONES)[number]) ? [...TIMEZONES] : [value, ...TIMEZONES];
    return list.map((z) => ({ value: z, label: tzLabel(z) }));
  }, [value]);

  return (
    <section id="fuso" className="card mt-6 scroll-mt-24 p-5 sm:p-6">
      <h2 className="text-[17px] font-semibold">{t.tzTitle}</h2>
      <p className="mt-1.5 max-w-[56ch] text-sm leading-6 text-muted">{t.tzHint}</p>
      <div className="mt-4 max-w-sm">
        <Select
          options={options}
          defaultValue={value}
          disabled={!canEdit}
          searchPlaceholder={search}
          onPick={async (tz) => {
            const ok = await setTimezone(tz).catch(() => false);
            setNote({ ok, key: Date.now() });
          }}
        />
      </div>
      {!canEdit && <p className="mt-2 text-[13px] text-muted">{t.tzOnlyManagers}</p>}
      {note && <Toast key={note.key} tone={note.ok ? "ok" : "bad"} text={note.ok ? t.tzSaved : t.error} />}
    </section>
  );
}
