"use client";

// Menu da conta (canto superior direito): e-mail, conta e segurança, assinatura (dono),
// endereço de recolha por e-mail (copiar num toque), ajuda e sair. Fecha ao tocar fora ou com Esc.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconAccount, IconBilling, IconClock, IconHelp, IconInbox, IconSignOut, IconTick } from "@/components/icons";
import { tzLabel } from "@/lib/timezone";
import { signOut } from "@/app/app/actions";
import type { MenuTexts } from "@/lib/account-texts";

export function AccountMenu({ t, email, office, billing, inbox, helpUrl, timezone }: { t: MenuTexts; email: string; office: string; billing: boolean; inbox: string | null; helpUrl: string; timezone: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copy() {
    if (!inbox) return;
    await navigator.clipboard.writeText(inbox).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const row = "flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-[14px] transition hover:bg-ink-3";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.label}
        title={t.label}
        className={`grid h-9 w-9 place-items-center rounded-full bg-ivory text-ink transition hover:opacity-85 ${open ? "ring-2 ring-line-strong ring-offset-2 ring-offset-ink" : ""}`}
      >
        <IconAccount className="h-[22px] w-[22px]" />
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 z-50 mt-2 w-[17rem] animate-rise p-1.5 shadow-[0_16px_40px_-16px_rgba(18,19,22,0.3)] [animation-duration:.2s]">
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate text-[14px] font-medium">{email}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-muted">{office}</p>
          </div>
          <div className="py-1.5">
            <Link role="menuitem" href="/conta" onClick={() => setOpen(false)} className={row}>
              <IconAccount className="h-[18px] w-[18px] text-muted" /> {t.account}
            </Link>
            <Link role="menuitem" href="/conta#fuso" onClick={() => setOpen(false)} className={row}>
              <IconClock className="h-[18px] w-[18px] text-muted" />
              <span className="min-w-0 truncate">
                {t.tz} <span className="text-muted">· {tzLabel(timezone)}</span>
              </span>
            </Link>
            {billing && (
              <Link role="menuitem" href="/assinatura" onClick={() => setOpen(false)} className={row}>
                <IconBilling className="h-[18px] w-[18px] text-muted" /> {t.billing}
              </Link>
            )}
            {inbox && (
              <button role="menuitem" type="button" onClick={copy} className={row}>
                {copied ? <IconTick className="h-[18px] w-[18px] text-ok" /> : <IconInbox className="h-[18px] w-[18px] text-muted" />}
                <span className={copied ? "text-ok" : ""}>{copied ? t.inboxCopied : t.inbox}</span>
              </button>
            )}
            <Link role="menuitem" href={helpUrl} onClick={() => setOpen(false)} className={row}>
              <IconHelp className="h-[18px] w-[18px] text-muted" /> {t.help}
            </Link>
          </div>
          <form action={signOut} className="border-t border-line pt-1.5">
            <button role="menuitem" className={row}>
              <IconSignOut className="h-[18px] w-[18px] text-muted" /> {t.signOut}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
