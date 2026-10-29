"use client";

// Janela modal simples (o <dialog> nativo do navegador): Esc fecha, o fundo fica escurecido,
// o foco fica dentro da janela. No telemóvel abre de baixo (folha); no computador, ao centro.
// Vários botões podem abrir a mesma janela: <OpenDialog target="id">.
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({
  id,
  title,
  closeLabel,
  openOnLoad = false,
  children,
}: {
  id: string;
  title: string;
  closeLabel: string;
  openOnLoad?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (openOnLoad && !d.open) d.showModal();
    // Clicar no fundo (fora do cartão) fecha
    const onClick = (e: MouseEvent) => {
      if (e.target === d) d.close();
    };
    d.addEventListener("click", onClick);
    return () => d.removeEventListener("click", onClick);
  }, [openOnLoad]);

  return (
    <dialog
      ref={ref}
      id={id}
      aria-labelledby={`${id}-title`}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[22px] border border-line bg-ink-2 p-0 text-ivory shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.35)] backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:animate-rise sm:m-auto sm:max-w-[460px] sm:rounded-[22px] sm:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.45)]"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink-2 px-5 py-4 sm:px-6">
        <h2 id={`${id}-title`} className="font-display text-lg">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-ink-3 hover:text-ivory"
          aria-label={closeLabel}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-6">{children}</div>
    </dialog>
  );
}

export function OpenDialog({ target, className, children }: { target: string; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => (document.getElementById(target) as HTMLDialogElement | null)?.showModal()}
    >
      {children}
    </button>
  );
}
