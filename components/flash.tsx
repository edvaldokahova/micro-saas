import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Toast } from "@/components/toast";

export function errorText(d: Dictionary, code: string): string {
  const e = d.app.clients.errors;
  const map: Record<string, string> = {
    limit: e.limit,
    inactive: e.inactive,
    phone: e.phone,
    name: e.name,
    exists: d.app.request.exists,
    items: d.app.request.noItems,
    teamLimit: e.teamLimit,
    url: e.url,
    emailRequired: e.emailRequired,
    emailTaken: e.emailTaken,
    invite: e.invite,
    teste: d.app.settings.auto.testError,
  };
  return map[code] ?? d.common.errorGeneric;
}

// Mensagens de sucesso/erro depois de uma ação (vêm no endereço: ?ok=… ou ?erro=…).
// Por defeito são avisos flutuantes (canto superior direito); «inline» mostra-os no sítio (ex.: dentro de uma janela).
export function Flash({ d, error, success, inline = false }: { d: Dictionary; error?: string; success?: string | null; inline?: boolean }) {
  if (!inline) {
    if (error) return <Toast tone="bad" text={errorText(d, error)} />;
    if (success) return <Toast tone="ok" text={success} />;
    return null;
  }
  if (error) {
    return (
      <p role="alert" className="mb-6 flex animate-rise items-start gap-2.5 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {errorText(d, error)}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="mb-6 flex animate-rise items-start gap-2.5 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-ok">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {success}
      </p>
    );
  }
  return null;
}
