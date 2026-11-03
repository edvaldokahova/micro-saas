"use client";

// Abre a janela de impressão do navegador (onde se escolhe «Guardar como PDF»)
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm">
      {label}
    </button>
  );
}
