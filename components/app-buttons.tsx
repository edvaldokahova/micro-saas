"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, MessageCircle } from "lucide-react";
import { bumpReminder } from "@/app/app/actions";

// Abre o WhatsApp com a mensagem pronta e regista o lembrete
export function ReminderButton({
  requestId,
  href,
  label,
  compact = false,
}: {
  requestId: string;
  href: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        bumpReminder(requestId).catch(() => {});
      }}
      className={`btn btn-whatsapp ${compact ? "btn-sm" : ""}`}
      aria-label={label}
      title={label}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
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
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
