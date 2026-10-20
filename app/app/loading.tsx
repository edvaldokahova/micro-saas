// Esqueleto mostrado de imediato ao mudar de página no painel (o cabeçalho e o menu ficam no sítio).
// Blocos com brilho a deslizar, no estilo dos painéis SaaS, em vez de um círculo a girar.
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-fade [animation-duration:.2s]">
      <span className="sr-only">…</span>
      <div className="skeleton h-3 w-24 rounded-full" />
      <div className="skeleton mt-3 h-9 w-64 max-w-full rounded-lg" />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton mt-3 h-7 w-10 rounded-md" />
          </div>
        ))}
      </div>

      <div className="card mt-6 divide-y divide-line overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-4 rounded-md" style={{ width: `${38 - i * 4}%` }} />
              <div className="skeleton h-4 w-16 rounded-full" />
            </div>
            <div className="skeleton mt-3 h-1.5 w-full rounded-full" />
            <div className="skeleton mt-2 h-3 w-32 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
