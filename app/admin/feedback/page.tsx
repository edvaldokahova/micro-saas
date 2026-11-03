import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubmitButton } from "@/components/app-buttons";
import { Toast } from "@/components/toast";
import { markFeedbackRead } from "./actions";

export const metadata: Metadata = { title: "Opiniões · Admin · Bilonai", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Row = { id: string; message: string; source: string; email: string | null; locale: string | null; created_at: string; read_at: string | null; office: { name: string; plan: string; plan_status: string } | null };
type Prompt = { feedback_prompt_answer: string | null };

const when = (iso: string) => new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" }).format(new Date(iso));
const LANG: Record<string, string> = { "pt-PT": "PT", "pt-BR": "BR", "es-ES": "ES" };

// Opiniões deixadas pelos escritórios (pedido do 4.º dia de teste e formulário da Ajuda)
export default async function Feedback({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const admin = createAdminClient();
  const [{ data }, { data: asked }] = await Promise.all([
    admin.from("feedback").select("id, message, source, email, locale, created_at, read_at, office:offices(name, plan, plan_status)").order("created_at", { ascending: false }).limit(300),
    admin.from("offices").select("feedback_prompt_answer").not("feedback_prompt_at", "is", null),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const answers = (asked ?? []) as Prompt[];
  const unread = rows.filter((r) => !r.read_at).length;
  const sent = answers.filter((a) => a.feedback_prompt_answer === "sent").length;
  const declined = answers.length - sent;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <p className="flex items-center gap-2 text-[15px] font-semibold">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Opiniões dos utilizadores
          </p>
          <Link href="/" className="btn btn-secondary btn-sm">Cockpit</Link>
        </div>
      </header>
      {sp.ok === "lidas" && <Toast tone="ok" text="Marcadas como lidas." />}

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-5">
        <dl className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <dt className="mono-label">Opiniões</dt>
            <dd className="figure mt-2 text-[26px] leading-none tabular-nums">{rows.length}</dd>
          </div>
          <div className="card p-4">
            <dt className="mono-label">Por ler</dt>
            <dd className={`figure mt-2 text-[26px] leading-none tabular-nums ${unread ? "text-gold" : ""}`}>{unread}</dd>
          </div>
          <div className="card p-4">
            <dt className="mono-label">Pedido do 4.º dia</dt>
            <dd className="mt-2 text-[13px] leading-5">
              <span className="font-semibold tabular-nums">{sent}</span> aceitaram · <span className="font-semibold tabular-nums">{declined}</span> recusaram
            </dd>
          </div>
        </dl>

        {unread > 0 && (
          <form action={markFeedbackRead} className="mt-4">
            <SubmitButton className="btn btn-secondary btn-sm">Marcar todas como lidas</SubmitButton>
          </form>
        )}

        {rows.length === 0 ? (
          <p className="card mt-6 p-6 text-[14px] text-muted">Ainda não há opiniões. Aparecem aqui quando um escritório responder ao pedido do 4.º dia de teste ou escrever na página de Ajuda.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.id} className={`card p-4 sm:p-5 ${r.read_at ? "" : "border-gold/40"}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12.5px] text-muted">
                  <span className="min-w-0">
                    {!r.read_at && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold align-middle" aria-label="Por ler" />}
                    <span className="font-medium text-ivory">{r.office?.name ?? "Escritório apagado"}</span>
                    {r.email ? ` · ${r.email}` : ""}
                  </span>
                  <span>
                    {r.source === "prompt" ? "Pedido do 4.º dia" : "Página de Ajuda"} · {LANG[r.locale ?? ""] ?? r.locale} · {when(r.created_at)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-[14.5px] leading-6">{r.message}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
