// Ícones próprios do Bilonai, desenhados numa grelha de 20 px.
// Traço fino (1.3), cantos e pontas retos, e os motivos da identidade: a folha de registo,
// o duplo traço dos totais e as caixas quadradas das marcas de documento.
type P = { className?: string };
const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  "aria-hidden": true,
};

// Cada ícone da navegação tem duas formas: contorno (normal) e preenchido (aba ativa),
// como nas aplicações nativas. Os traços interiores da forma preenchida usam a cor do fundo.
type N = P & { active?: boolean };
const hole = "var(--color-ink)";

// Painel: quatro mostradores quadrados, um já completo (o estado de tudo, num relance)
export function IconLedger({ className = "h-5 w-5", active = false }: N) {
  const f = active ? "currentColor" : "none";
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="2.5" width="6.3" height="6.3" fill={f} />
      <rect x="11.2" y="2.5" width="6.3" height="6.3" fill="currentColor" />
      <path d="M12.9 5.8l1.3 1.3 2-2.2" stroke={hole} strokeWidth="1.2" />
      <rect x="2.5" y="11.2" width="6.3" height="6.3" fill={f} />
      <rect x="11.2" y="11.2" width="6.3" height="6.3" fill={f} />
    </svg>
  );
}

// Clientes: uma pessoa de frente, só em formas retas (cabeça e ombros quadrados, como o resto do sistema)
export function IconClients({ className = "h-5 w-5", active = false }: N) {
  const f = active ? "currentColor" : "none";
  return (
    <svg {...base} className={className}>
      <rect x="7.2" y="2.5" width="5.6" height="5.6" fill={f} />
      <path d={active ? "M3.5 17.5v-5.8h13v5.8z" : "M3.5 17.5v-5.8h13v5.8"} fill={f} />
    </svg>
  );
}

// Definições: três réguas com cursores quadrados em posições diferentes
export function IconSettings({ className = "h-5 w-5", active = false }: N) {
  const f = active ? "currentColor" : "none";
  return (
    <svg {...base} strokeWidth={active ? 1.6 : 1.3} className={className}>
      <path d="M2.5 5h4.2M9.3 5h8.2M2.5 10h9.2M14.3 10h3.2M2.5 15h2.2M7.3 15h10.2" />
      <rect x="6.7" y="3.7" width="2.6" height="2.6" fill={f} />
      <rect x="11.7" y="8.7" width="2.6" height="2.6" fill={f} />
      <rect x="4.7" y="13.7" width="2.6" height="2.6" fill={f} />
    </svg>
  );
}

// Assinatura: um cartão com o duplo traço dos totais e o chip quadrado
export function IconBilling({ className = "h-5 w-5", active = false }: N) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="4.5" width="15" height="11" fill={active ? "currentColor" : "none"} />
      <path d="M2.5 7.8h15M2.5 9.4h15" stroke={active ? hole : "currentColor"} />
      <rect x="5" y="11.8" width="3" height="1.4" fill={active ? hole : "currentColor"} stroke="none" />
    </svg>
  );
}

// Visto: traço reto com junção em esquadria (substitui o "check" genérico)
export function IconTick({ className = "h-4 w-4" }: P) {
  return (
    <svg {...base} strokeWidth={1.6} className={className}>
      <path d="M4 10.4l3.6 3.6L16.2 5.4" />
    </svg>
  );
}

// Selo: caixa de duplo contorno com o visto, para garantias e compromissos
export function IconSeal({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="2.5" width="15" height="15" />
      <rect x="4.8" y="4.8" width="10.4" height="10.4" strokeWidth="0.9" />
      <path d="M7.3 10.2l1.9 1.9 3.6-4" strokeWidth="1.5" />
    </svg>
  );
}
