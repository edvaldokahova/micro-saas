// Ícones próprios do Bilonai, numa grelha de 20 px.
// Traço 1.6 com pontas e junções arredondadas (o mesmo carácter da Instrument Sans) e cantos de 1.8 px.
// Os ícones da navegação têm duas formas: contorno (normal) e preenchido (aba ativa).
// Os detalhes por dentro da forma preenchida usam a cor do fundo (var(--color-ink)).
type P = { className?: string };
type N = P & { active?: boolean };
const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};
const hole = "var(--color-ink)";

// Painel: quatro mostradores, um já completo
export function IconLedger({ className = "h-5 w-5", active = false }: N) {
  const f = active ? "currentColor" : "none";
  return (
    <svg {...base} className={className}>
      <rect x="2.75" y="2.75" width="6" height="6" rx="1.8" fill={f} />
      <rect x="11.25" y="2.75" width="6" height="6" rx="1.8" fill="currentColor" />
      <path d="M12.75 5.9l1.15 1.1 2-2.1" stroke={hole} strokeWidth="1.4" />
      <rect x="2.75" y="11.25" width="6" height="6" rx="1.8" fill={f} />
      <rect x="11.25" y="11.25" width="6" height="6" rx="1.8" fill={f} />
    </svg>
  );
}

// Clientes: uma pessoa de frente
export function IconClients({ className = "h-5 w-5", active = false }: N) {
  const f = active ? "currentColor" : "none";
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="6.4" r="3.4" fill={f} />
      <path d="M3.6 17.25c.5-3.2 3.1-5.25 6.4-5.25s5.9 2.05 6.4 5.25z" fill={f} />
    </svg>
  );
}

// Definições: três réguas com cursores redondos
export function IconSettings({ className = "h-5 w-5", active = false }: N) {
  const f = active ? "currentColor" : hole;
  return (
    <svg {...base} className={className}>
      <path d="M3 5h14M3 10h14M3 15h14" />
      <circle cx="7.5" cy="5" r="1.9" fill={f} />
      <circle cx="13" cy="10" r="1.9" fill={f} />
      <circle cx="6" cy="15" r="1.9" fill={f} />
    </svg>
  );
}

// Assinatura: um cartão com a banda e o chip
export function IconBilling({ className = "h-5 w-5", active = false }: N) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2.5" fill={active ? "currentColor" : "none"} />
      <path d="M2.5 8.25h15" stroke={active ? hole : "currentColor"} />
      <path d="M5.5 12.25h3" stroke={active ? hole : "currentColor"} />
    </svg>
  );
}

// Visto
export function IconTick({ className = "h-4 w-4" }: P) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <path d="M4.5 10.5l3.4 3.3 7.6-7.6" />
    </svg>
  );
}

// Estrela de quatro pontas (a "estrela de IA"), preenchida, para os benefícios dos planos
export function IconSpark({ className = "h-4 w-4" }: P) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 1.5c.5 4.4 2.9 7.3 8.5 8.5-5.6 1.2-8 4.1-8.5 8.5-.5-4.4-2.9-7.3-8.5-8.5 5.6-1.2 8-4.1 8.5-8.5z" />
    </svg>
  );
}

// Selo: escudo arredondado com o visto, para garantias
export function IconSeal({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M10 2.6l6 2.3v4.6c0 3.9-2.6 6.7-6 7.9-3.4-1.2-6-4-6-7.9V4.9z" />
      <path d="M7.4 10.1l1.8 1.8 3.5-3.6" />
    </svg>
  );
}
