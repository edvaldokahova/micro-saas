import { Mail, MessageCircle, Ellipsis } from "lucide-react";

export type Channel = "whatsapp" | "email" | "other";

export function isChannel(v: unknown): v is Channel {
  return v === "whatsapp" || v === "email" || v === "other";
}

// Ícone do canal por onde o cliente enviou o documento
export function ChannelIcon({ via, className = "h-3.5 w-3.5" }: { via: Channel; className?: string }) {
  if (via === "whatsapp") return <MessageCircle className={`${className} text-[#1f9d55]`} aria-hidden />;
  if (via === "email") return <Mail className={`${className} text-gold`} aria-hidden />;
  return <Ellipsis className={`${className} text-muted`} aria-hidden />;
}
