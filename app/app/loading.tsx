// Esqueleto mostrado de imediato ao mudar de página na área do escritório (o cabeçalho e o menu ficam no sítio).
// Neutro de propósito: só título e linhas, porque serve a todas as abas (Painel, Clientes, Definições, Assinatura).
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-fade [animation-duration:.2s]">
      <span className="sr-only">…</span>
      <div className="skeleton h-2.5 w-20" />
      <div className="skeleton mt-3 h-10 w-72 max-w-full" />

      <div className="mt-10 border-t border-line">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-6 border-b border-line py-4">
            <div className="flex-1">
              <div className="skeleton h-3.5" style={{ width: `${38 - i * 4}%` }} />
              <div className="skeleton mt-2 h-2.5 w-28" />
            </div>
            <div className="skeleton hidden h-3.5 w-24 sm:block" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
