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

// Conteúdo de um botão: normal, ou spinner + texto ("A guardar…") enquanto trabalha.
// Sem texto, o spinner fica por cima do rótulo e o botão mantém a largura.
export function BusyLabel({ busy, text, children }: { busy: boolean; text?: string; children: React.ReactNode }) {
  if (!busy) return <>{children}</>;
  if (text && text !== "…")
    return (
      <>
        <Spinner />
        <span>{text}</span>
      </>
    );
  return (
    <span className="inline-grid place-items-center">
      <span className="invisible inline-flex items-center gap-2 [grid-area:1/1]">{children}</span>
      <Spinner className="h-4 w-4 [grid-area:1/1]" />
    </span>
  );
}
