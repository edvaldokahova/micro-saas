// Logótipos reais do WhatsApp e do e-mail (public/channels).
// Não se arrastam, não se selecionam e não abrem o menu de "guardar imagem" (clique direito ou toque longo).
export function ChannelLogo({ channel, className = "h-4 w-4" }: { channel: "whatsapp" | "email"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/channels/${channel}.webp`}
      alt=""
      aria-hidden
      draggable={false}
      width={96}
      height={96}
      className={`pointer-events-none shrink-0 select-none [-webkit-touch-callout:none] [-webkit-user-drag:none] ${className}`}
    />
  );
}
