import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { planFromPriceId } from "@/lib/paddle/config";

// Estrutura mínima dos eventos Paddle que tratamos
export type PaddleEvent = {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: {
    id: string;
    status?: string;
    customer_id?: string | null;
    subscription_id?: string | null;
    custom_data?: { office_id?: string } | null;
    items?: { price?: { id?: string } }[];
    current_billing_period?: { ends_at?: string } | null;
  };
};

type OfficeRow = {
  id: string;
  plan_status: string;
  paddle_subscription_id: string | null;
  paddle_event_at: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Estado da Paddle -> estado no nosso sistema (offices.plan_status)
export function mapStatus(status: string | undefined): string | null {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "paused":
    case "canceled":
      return "canceled";
    default:
      return null;
  }
}

async function findOffice(
  db: SupabaseClient,
  officeIdHint: string | undefined,
  subscriptionId: string | null | undefined,
  customerId: string | null | undefined,
): Promise<OfficeRow | null> {
  const cols = "id, plan_status, paddle_subscription_id, paddle_event_at";
  if (subscriptionId) {
    const { data } = await db.from("offices").select(cols).eq("paddle_subscription_id", subscriptionId).maybeSingle();
    if (data) return data as OfficeRow;
  }
  if (officeIdHint && UUID.test(officeIdHint)) {
    const { data } = await db.from("offices").select(cols).eq("id", officeIdHint).maybeSingle();
    if (data) return data as OfficeRow;
  }
  if (customerId) {
    const { data } = await db.from("offices").select(cols).eq("paddle_customer_id", customerId).maybeSingle();
    if (data) return data as OfficeRow;
  }
  return null;
}

// Já existe outra assinatura viva neste escritório? Então não deixamos uma segunda assinatura a sobrepor-se.
function hasOtherLiveSubscription(office: OfficeRow, subscriptionId: string | null | undefined) {
  return (
    !!office.paddle_subscription_id &&
    !!subscriptionId &&
    office.paddle_subscription_id !== subscriptionId &&
    (office.plan_status === "active" || office.plan_status === "past_due")
  );
}

// Aplica o evento. Devolve o id do escritório afetado (ou null se o evento não se aplica a ninguém).
export async function applyPaddleEvent(db: SupabaseClient, event: PaddleEvent): Promise<string | null> {
  const d = event.data;

  if (event.event_type === "transaction.completed") {
    const office = await findOffice(db, d.custom_data?.office_id, d.subscription_id, d.customer_id);
    if (!office) return null;
    if (hasOtherLiveSubscription(office, d.subscription_id)) {
      console.warn("[paddle] transação de uma 2.ª assinatura ignorada", office.id);
      return office.id;
    }
    const patch: Record<string, string> = {};
    if (d.customer_id) patch.paddle_customer_id = d.customer_id;
    if (d.subscription_id) patch.paddle_subscription_id = d.subscription_id;
    if (Object.keys(patch).length) {
      const { error } = await db.from("offices").update(patch).eq("id", office.id);
      if (error) throw error;
    }
    return office.id;
  }

  if (event.event_type.startsWith("subscription.")) {
    const office = await findOffice(db, d.custom_data?.office_id, d.id, d.customer_id);
    if (!office) return null;

    // Evento mais antigo do que o último aplicado: ignorar (a Paddle não garante a ordem)
    if (office.paddle_event_at && new Date(office.paddle_event_at) > new Date(event.occurred_at)) {
      return office.id;
    }
    if (hasOtherLiveSubscription(office, d.id)) {
      console.warn("[paddle] evento de uma 2.ª assinatura ignorado", office.id, event.event_type);
      return office.id;
    }

    const status = mapStatus(d.status);
    const plan = planFromPriceId(d.items?.[0]?.price?.id);
    const patch: Record<string, string | null> = {
      paddle_subscription_id: d.id,
      paddle_event_at: event.occurred_at,
      current_period_end: d.current_billing_period?.ends_at ?? null,
    };
    if (d.customer_id) patch.paddle_customer_id = d.customer_id;
    if (status) patch.plan_status = status;
    if (plan) patch.plan = plan;

    const { error } = await db.from("offices").update(patch).eq("id", office.id);
    if (error) throw error;
    return office.id;
  }

  return null;
}
