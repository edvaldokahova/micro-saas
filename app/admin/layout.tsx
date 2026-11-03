// O painel administrativo é sempre claro (sem modo escuro): mais leve e igual para o contabilista
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-light">{children}</div>;
}
