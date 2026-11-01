// Spinner de carregamento (o mesmo em todos os botões): 12 traços que acendem em roda
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span className={`spinner ${className}`} aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </span>
  );
}

// Conteúdo de um botão enquanto trabalha: o rótulo não muda (só ganha reticências) e aparece o spinner;
// o botão fica desativado por quem o usa. Botões só com ícone: o spinner fica por cima, sem mudar a largura.
// (`text` mantém-se por compatibilidade, mas já não substitui o rótulo.)
export function BusyLabel({ busy, children }: { busy: boolean; text?: string; children: React.ReactNode }) {
  if (!busy) return <>{children}</>;
  if (typeof children === "string")
    return (
      <>
        <Spinner />
        <span>{children.endsWith("…") ? children : `${children}…`}</span>
      </>
    );
  return (
    <span className="inline-grid place-items-center">
      <span className="invisible inline-flex items-center gap-2 [grid-area:1/1]">{children}</span>
      <Spinner className="h-4 w-4 [grid-area:1/1]" />
    </span>
  );
}
