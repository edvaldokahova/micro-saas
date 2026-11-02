"use client";

import { IconCopy } from "@/components/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { ChannelLogo } from "@/components/channel-logo";
import { bumpReminder } from "@/app/app/actions";
import { BusyLabel } from "@/components/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
      <ChannelLogo channel={channel} className="h-[18px] w-[18px]" />
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
      // Navegadores sem acesso à área de transferência: cópia à moda antiga, sem janelas do navegador
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button type="button" onClick={copy} className={`btn btn-secondary ${compact ? "btn-sm" : ""}`} aria-label={copied ? done : label} title={label}>
      {copied ? <Check className="h-4 w-4 animate-pop text-ok" aria-hidden /> : <IconCopy className="h-4 w-4" />}
      <span className={compact ? "hidden sm:inline" : ""}>{copied ? done : label}</span>
    </button>
  );
}

// Botão de submissão com estado "a guardar…" e confirmação opcional (na nossa janela, não no aviso do navegador)
export function SubmitButton({
  children,
  pendingText,
  confirm,
  className = "btn btn-primary",
  formAction,
}: {
  children: React.ReactNode;
  pendingText?: string;
  confirm?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending: formPending } = useFormStatus();
  const ref = useRef<HTMLButtonElement>(null);
  const [asking, setAsking] = useState(false);
  // Num formulário com vários botões, só o botão carregado mostra que está a trabalhar
  const [mine, setMine] = useState(true);
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onSubmit = (e: SubmitEvent) => setMine(!e.submitter || e.submitter === ref.current);
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);
  const pending = formPending && mine;
  const close = useCallback(() => setAsking(false), []);
  return (
    <>
      <button
        ref={ref}
        type="submit"
        formAction={formAction}
        disabled={formPending}
        aria-busy={pending}
        className={className}
        onClick={(e) => {
          if (!confirm) return;
          e.preventDefault();
          setAsking(true);
        }}
      >
        <BusyLabel busy={pending} text={pendingText}>
          {children}
        </BusyLabel>
      </button>
      {confirm && (
        <ConfirmDialog
          open={asking}
          text={confirm}
          confirmLabel={children}
          onClose={close}
          onConfirm={() => {
            setAsking(false);
            ref.current?.form?.requestSubmit(ref.current);
          }}
        />
      )}
    </>
  );
}
