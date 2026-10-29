// Envio automático dos lembretes por e-mail. Corre uma vez por dia (tarefa agendada da Vercel, vercel.json).
// Para cada escritório com "Lembretes automáticos" ligado e assinatura ativa, envia o lembrete aos clientes
// que ainda têm documentos em falta, conforme as regras do escritório (dias antes do prazo, intervalo, máximo).
// Remetente: o nome do escritório; "Responder" vai para o e-mail do escritório (ou do responsável do cliente).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildReminderEmail } from "@/lib/email-template";
import { formatDate, getDictionary, isLocale, periodOf, type Locale } from "@/lib/i18n";
import { officeAccess, type Office } from "@/lib/office";
import { publicLink } from "@/lib/reminder";
import { emailOk, fromOffice, sendBatch } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 86_400_000;

type OfficeRow = Pick<
  Office,
  "id" | "name" | "locale" | "plan" | "plan_status" | "trial_ends_at" | "contact_email" | "owner_id" | "auto_days_before" | "auto_repeat_days" | "auto_max" | "email_subject" | "email_message"
> & { billing_email: string | null };

type RequestRow = {
  id: string;
  office_id: string;
  period: string;
  months: number | null;
  due_date: string | null;
  token: string;
  created_at: string;
  auto_count: number;
  last_auto_at: string | null;
  last_reminder_at: string | null;
  reminder_count: number;
  clients: { name: string; email: string | null; archived_at: string | null; assignee_id: string | null } | null;
  request_items: { status: string }[];
};

export async function GET(request: Request) {
  // Só a tarefa agendada (ou quem tem o segredo) pode correr isto
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "RESEND_API_KEY em falta" }, { status: 500 });

  const admin = createAdminClient();
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);

  // Limite diário (o plano gratuito do Resend aceita 100 por dia; deixamos margem para os e-mails de entrada)
  const cap = Number(process.env.AUTO_EMAIL_DAILY_CAP ?? 80);
  const { count: sentToday } = await admin
    .from("auto_email_log")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", `${today}T00:00:00Z`);
  let budget = Math.max(0, cap - (sentToday ?? 0));
  if (budget === 0) return NextResponse.json({ sent: 0, reason: "daily cap" });

  const { data: officeData } = await admin
    .from("offices")
    .select("id, name, locale, plan, plan_status, trial_ends_at, contact_email, billing_email, owner_id, auto_days_before, auto_repeat_days, auto_max, email_subject, email_message")
    .eq("auto_remind", true);
  const offices = ((officeData ?? []) as OfficeRow[]).filter((o) => officeAccess(o as unknown as Office).canWrite);
  if (!offices.length) return NextResponse.json({ sent: 0 });
  const byId = new Map(offices.map((o) => [o.id, o]));

  const [{ data: reqData }, { data: teamData }] = await Promise.all([
    admin
      .from("requests")
      .select("id, office_id, period, months, due_date, token, created_at, auto_count, last_auto_at, last_reminder_at, reminder_count, clients(name, email, archived_at, assignee_id), request_items(status)")
      .in("office_id", [...byId.keys()])
      .is("closed_at", null),
    admin.from("team_members").select("id, email").in("office_id", [...byId.keys()]),
  ]);
  const memberEmail = new Map(((teamData ?? []) as { id: string; email: string | null }[]).map((m) => [m.id, m.email]));

  // Quem deve receber hoje
  const due = ((reqData ?? []) as unknown as RequestRow[])
    .filter((r) => {
      const o = byId.get(r.office_id)!;
      const c = r.clients;
      if (!c || c.archived_at || !emailOk(c.email)) return false;
      const missing = r.request_items.filter((i) => i.status === "pending").length;
      if (missing === 0 || r.auto_count >= o.auto_max) return false;
      // Lembrete manual nas últimas 24 h: não insistir no mesmo dia
      if (r.last_reminder_at && now - new Date(r.last_reminder_at).getTime() < DAY) return false;
      if (r.auto_count === 0) {
        const start = r.due_date
          ? new Date(`${r.due_date}T00:00:00Z`).getTime() - o.auto_days_before * DAY
          : new Date(r.created_at).getTime() + 3 * DAY;
        // Pedidos com prazo passado há mais de 60 dias ficam de fora (pedidos antigos esquecidos)
        if (r.due_date && now - new Date(`${r.due_date}T00:00:00Z`).getTime() > 60 * DAY) return false;
        return now >= start;
      }
      return !!r.last_auto_at && now - new Date(r.last_auto_at).getTime() >= o.auto_repeat_days * DAY - 2 * 3_600_000;
    })
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));

  const batch = due.slice(0, budget);
  if (!batch.length) return NextResponse.json({ sent: 0 });

  // Para onde vão as respostas: responsável do cliente, e-mail de contacto do escritório, ou o do dono
  const ownerEmail = new Map<string, string | null>();
  async function replyTo(o: OfficeRow, assigneeId: string | null): Promise<string | null> {
    const m = assigneeId ? memberEmail.get(assigneeId) : null;
    if (emailOk(m)) return m.trim();
    if (emailOk(o.contact_email)) return o.contact_email.trim();
    if (emailOk(o.billing_email)) return o.billing_email.trim();
    if (!ownerEmail.has(o.owner_id)) {
      const { data } = await admin.auth.admin.getUserById(o.owner_id);
      ownerEmail.set(o.owner_id, data.user?.email ?? null);
    }
    const e = ownerEmail.get(o.owner_id);
    return emailOk(e) ? e : null;
  }

  const messages = await Promise.all(
    batch.map(async (r) => {
      const o = byId.get(r.office_id)!;
      const locale: Locale = isLocale(o.locale) ? o.locale : "pt-PT";
      const d = getDictionary(locale);
      const items = r.request_items;
      const mail = buildReminderEmail(d.autoEmail, {
        office: o.name,
        client: r.clients!.name,
        period: periodOf(r.period, locale, r.months ?? 1),
        dueLabel: r.due_date ? formatDate(r.due_date, locale, false) : null,
        missing: items.filter((i) => i.status === "pending").length,
        total: items.length,
        link: publicLink(r.token),
        subject: o.email_subject,
        message: o.email_message,
      });
      const reply = await replyTo(o, r.clients!.assignee_id);
      return {
        from: fromOffice(o.name),
        to: [r.clients!.email!.trim()],
        ...(reply ? { reply_to: reply } : {}),
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        headers: { "X-Entity-Ref-ID": `${r.id}-${r.auto_count + 1}` },
      };
    }),
  );

  // Um só pedido ao Resend para todo o lote (até 100 e-mails)
  const result = await sendBatch(messages, `auto-${today}-${batch[0].id}-${batch.length}`);
  if (!result.ok) {
    await admin.from("auto_email_log").insert(batch.map((r) => ({ office_id: r.office_id, request_id: r.id, ok: false, error: result.error.slice(0, 300) })));
    return NextResponse.json({ sent: 0, error: result.error }, { status: 502 });
  }

  const stamp = new Date().toISOString();
  await Promise.all([
    admin.from("auto_email_log").insert(batch.map((r, i) => ({ office_id: r.office_id, request_id: r.id, provider_id: result.ids[i] }))),
    ...batch.map((r) =>
      admin
        .from("requests")
        .update({ auto_count: r.auto_count + 1, last_auto_at: stamp, reminder_count: r.reminder_count + 1, last_reminder_at: stamp })
        .eq("id", r.id),
    ),
  ]);
  budget -= batch.length;
  return NextResponse.json({ sent: batch.length, remaining: budget });
}
