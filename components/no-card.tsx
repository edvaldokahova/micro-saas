import { CreditCard } from "lucide-react";

// Ícone de cartão riscado + texto "Sem cartão…", para reforçar que o teste não pede pagamento
export function NoCard({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-muted ${className}`}>
      <span className="relative inline-grid h-5 w-5 shrink-0 place-items-center text-gold" aria-hidden>
        <CreditCard className="h-5 w-5" />
        <span className="absolute left-1/2 top-1/2 h-[2px] w-[26px] -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] rounded-full bg-current ring-2 ring-ink" />
      </span>
      {text}
    </span>
  );
}
