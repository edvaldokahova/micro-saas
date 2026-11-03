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
      {/* Quadrado de cima à direita: igual aos outros; só na página ativa fica preenchido com o visto */}
      <rect x="11.25" y="2.75" width="6" height="6" rx="1.8" fill={f} />
      {active && <path d="M12.75 5.9l1.15 1.1 2-2.1" stroke={hole} strokeWidth="1.4" />}
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

// Documentos: uma folha com o canto dobrado e duas linhas de texto
export function IconDocs({ className = "h-5 w-5", active = false }: N) {
  const inner = active ? hole : "currentColor";
  return (
    <svg {...base} className={className}>
      <path d="M5.75 2.75h5.75l4 4v9a1.8 1.8 0 0 1-1.8 1.8H5.75a1.8 1.8 0 0 1-1.8-1.8v-11.2a1.8 1.8 0 0 1 1.8-1.8z" fill={active ? "currentColor" : "none"} />
      <path d="M11.5 2.75v2.5a1.5 1.5 0 0 0 1.5 1.5h2.5" stroke={inner} />
      <path d="M7.25 11h5.5M7.25 14h3.5" stroke={inner} />
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

// Novo pedido: uma folha com um «+» (na barra, no lugar onde o pedido nasce)
export function IconNewRequest({ className = "h-5 w-5", active = false }: N) {
  const inner = active ? hole : "currentColor";
  return (
    <svg {...base} className={className}>
      <path d="M5.75 2.75h5.75l4 4v9a1.8 1.8 0 0 1-1.8 1.8H5.75a1.8 1.8 0 0 1-1.8-1.8v-11.2a1.8 1.8 0 0 1 1.8-1.8z" fill={active ? "currentColor" : "none"} />
      <path d="M11.5 2.75v2.5a1.5 1.5 0 0 0 1.5 1.5h2.5" stroke={inner} />
      <path d="M9.75 9.25v5M7.25 11.75h5" stroke={inner} />
    </svg>
  );
}

// Conta: uma pessoa dentro de um círculo (a cabeça e os ombros cortados pelo próprio círculo)
export function IconAccount({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="7.6" />
      <circle cx="10" cy="8.1" r="2.6" />
      <path d="M5.1 15.8c.9-2.1 2.8-3.4 4.9-3.4s4 1.3 4.9 3.4" />
    </svg>
  );
}

// Aviso do painel: um sino com o badalo; «alert» acende um ponto no canto
export function IconBell({ className = "h-5 w-5", alert = false }: P & { alert?: boolean }) {
  return (
    <svg {...base} className={className}>
      <path d="M5.2 13.6V9.2a4.8 4.8 0 0 1 9.6 0v4.4l1.4 1.9H3.8z" />
      <path d="M8.3 17.3a1.9 1.9 0 0 0 3.4 0" />
      {alert && <circle cx="15.4" cy="4.6" r="2.3" fill="currentColor" stroke={hole} strokeWidth="0.8" />}
    </svg>
  );
}

// Assinatura (no menu da conta) usa IconBilling; ajuda: um balão com um ponto de interrogação
export function IconHelp({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="7.6" />
      <path d="M7.9 7.9a2.2 2.2 0 0 1 4.2.9c0 1.5-2.1 1.8-2.1 3.1" />
      <circle cx="10" cy="14.4" r=".4" fill="currentColor" />
    </svg>
  );
}

// Sair: uma porta com a seta a sair
export function IconSignOut({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M8.5 3.25H5a1.8 1.8 0 0 0-1.8 1.8v9.9A1.8 1.8 0 0 0 5 16.75h3.5" />
      <path d="M12.75 6.5L16.25 10l-3.5 3.5M16 10H8" />
    </svg>
  );
}

// Recolha por e-mail: um envelope com uma seta a entrar
export function IconInbox({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="2.75" y="4.5" width="14.5" height="11" rx="2" />
      <path d="M3.2 6l6.8 4.8L16.8 6" />
    </svg>
  );
}

// Fuso horário: um relógio com um meridiano
export function IconClock({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="7.6" />
      <path d="M10 5.8V10l2.8 1.8" />
    </svg>
  );
}

// Desempenho: três barras a subir com a última realçada
export function IconChart({ className = "h-5 w-5", active = false }: N) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="10.5" width="3.4" height="6.5" rx="1.2" fill={active ? "currentColor" : "none"} />
      <rect x="8.3" y="7" width="3.4" height="10" rx="1.2" fill={active ? "currentColor" : "none"} />
      <rect x="13.6" y="3" width="3.4" height="14" rx="1.2" fill="currentColor" />
    </svg>
  );
}

// Caixote de apagar (o mesmo em documentos e clientes)
export function IconTrash({ className = "h-[15px] w-[15px]" }: P) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2a1.2 1.2 0 0 0 1.2 1.1h3.4a1.2 1.2 0 0 0 1.2-1.1l.6-8.2" />
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

// Símbolo de IA: a nossa estrela de quatro pontas, com as pontas arredondadas, e uma pequena em baixo à esquerda
export function IconAI({ className = "h-3 w-3" }: P) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11.8 2.2Q12.6 7.6 18 8.6Q12.6 9.6 11.8 15Q11 9.6 5.6 8.6Q11 7.6 11.8 2.2Z" />
      <path d="M4.6 12.6Q4.95 15.05 7.4 15.4Q4.95 15.75 4.6 18.2Q4.25 15.75 1.8 15.4Q4.25 15.05 4.6 12.6Z" />
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

// Novo cliente: busto com um «+» ao lado
export function IconAddClient({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="6.6" r="3" />
      <path d="M2.6 16.4c.6-2.9 2.8-4.6 5.4-4.6 1.5 0 2.8.5 3.8 1.5" />
      <path d="M15.2 11.2v5M12.7 13.7h5" />
    </svg>
  );
}

// Folha de Excel: folha com a grelha
export function IconSheet({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="3.4" y="2.8" width="13.2" height="14.4" rx="1.8" />
      <path d="M3.4 7.4h13.2M3.4 11.8h13.2M8.6 7.4v9.8" />
    </svg>
  );
}

// Cadeado (link privado)
export function IconLock({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="8.6" width="12" height="8.6" rx="1.8" />
      <path d="M6.8 8.6V6.4a3.2 3.2 0 0 1 6.4 0v2.2" />
      <path d="M10 12.2v1.6" />
    </svg>
  );
}

// Pessoa de contacto (responsável)
export function IconContact({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="6.8" r="3.2" />
      <path d="M4 16.8c.7-3 3.1-4.8 6-4.8s5.3 1.8 6 4.8" />
    </svg>
  );
}

// Telefone
export function IconPhone({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="5.6" y="2.6" width="8.8" height="14.8" rx="2" />
      <path d="M8.8 14.6h2.4" />
    </svg>
  );
}

// Envelope
export function IconMail({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="2.8" y="4.4" width="14.4" height="11.2" rx="1.8" />
      <path d="M3.4 5.4l6.6 5.2 6.6-5.2" />
    </svg>
  );
}

// Envelope enviado: o envelope com um visto
export function IconMailSent({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M17.2 10V6.2a1.8 1.8 0 0 0-1.8-1.8H4.6a1.8 1.8 0 0 0-1.8 1.8v7.6a1.8 1.8 0 0 0 1.8 1.8h5.4" />
      <path d="M3.4 5.4l6.6 5.2 6.6-5.2" />
      <path d="M12.6 15.2l1.8 1.8 3.4-3.6" />
    </svg>
  );
}

// Copiar: duas folhas sobrepostas
export function IconCopy({ className = "h-5 w-5" }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="6.8" y="6.8" width="10" height="10.4" rx="1.8" />
      <path d="M13.2 3.2H5a1.8 1.8 0 0 0-1.8 1.8v8.2" />
    </svg>
  );
}
