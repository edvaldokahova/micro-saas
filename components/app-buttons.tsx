"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { bumpReminder } from "@/app/app/actions";
import { BusyLabel } from "@/components/spinner";

// Abre o WhatsApp (ou o programa de e-mail) com a mensagem pronta e regista o lembrete
export function ReminderButton({
  requestId,
  href,
  label,
  compact = false,
  channel = "whatsapp",
  secondary = false,
}: {
  requestId: string;
  href: string;
  label: string;
  compact?: boolean;
  channel?: "whatsapp" | "email";
  secondary?: boolean;
}) {
  const Icon = channel === "email" ? Mail : MessageCircle;
  const look = compact || secondary ? "btn-secondary" : channel === "email" ? "btn-primary" : "btn-whatsapp";
  return (
    <a
      href={href}
      {...(channel === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => {
        bumpReminder(requestId).catch(() => {});
      }}
      className={`btn ${look} ${compact ? "btn-sm" : ""}`}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className={compact ? "hidden sm:inline" : ""}>{label}</span>
    </a>
  );
}

export function CopyButton({ value, label, done, compact = false }: { value: string; label: string; done: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt(label, value);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button type="button" onClick={copy} className={`btn btn-secondary ${compact ? "btn-sm" : ""}`} aria-label={copied ? done : label} title={label}>
      {copied ? <Check className="h-4 w-4 animate-pop text-ok" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span className={compact ? "hidden sm:inline" : ""}>{copied ? done : label}</span>
    </button>
  );
}

// Botão de submissão com estado "a guardar…" e confirmação opcional
export function SubmitButton({
  children,
  pendingText,
  confirm,
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  confirm?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <BusyLabel busy={pending} text={pendingText}>
        {children}
      </BusyLabel>
    </button>
  );
}
