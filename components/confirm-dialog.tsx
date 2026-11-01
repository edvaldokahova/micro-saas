"use client";

// Confirmação antes de apagar/remover, no lugar do aviso padrão do navegador.
// Mesmo aspeto das nossas janelas: no telemóvel abre de baixo; no computador, ao centro.
import { useEffect, useId, useRef } from "react";

export function ConfirmDialog({
  open,
  text,
  confirmLabel,
  danger = true,
  onConfirm,
  onClose,
}: {
  open: boolean;
  text: string;
  confirmLabel: React.ReactNode;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const textId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClick = (e: MouseEvent) => e.target === d && onClose();
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("click", onClick);
    d.addEventListener("cancel", onCancel);
    return () => {
      d.removeEventListener("click", onClick);
      d.removeEventListener("cancel", onCancel);
    };
  }, [onClose]);

  // «Cancelar» escreve-se igual em pt-PT, pt-BR e es-ES
  const cancel = "Cancelar";

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-describedby={textId}
      className="m-0 mt-auto w-full max-w-none rounded-t-[22px] border border-line bg-ink-2 p-0 text-ivory shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.35)] backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:animate-rise sm:m-auto sm:max-w-[400px] sm:rounded-[22px] sm:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.45)]"
    >
      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-6">
        <p id={textId} className="text-[15.5px] leading-6">
          {text}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            {cancel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={danger ? "btn border-bad bg-bad text-white hover:opacity-90" : "btn btn-primary"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
