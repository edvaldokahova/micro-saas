import { Ellipsis } from "lucide-react";
import { ChannelLogo } from "@/components/channel-logo";

export type Channel = "whatsapp" | "email" | "page" | "other";

export function isChannel(v: unknown): v is Channel {
  return v === "whatsapp" || v === "email" || v === "page" || v === "other";
}

// Ícone do canal por onde o cliente enviou o documento (logótipos reais para WhatsApp e e-mail)
export function ChannelIcon({ via, className = "h-3.5 w-3.5" }: { via: Channel; className?: string }) {
  if (via === "whatsapp" || via === "email") return <ChannelLogo channel={via} className={className} />;
  // Enviado diretamente pela página do pedido
  if (via === "page") return <ChannelLogo channel="web" className={className} />;
  return <Ellipsis className={`${className} text-muted`} aria-hidden />;
}
