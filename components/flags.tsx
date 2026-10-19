import type { Locale } from "@/lib/locales";

// Bandeiras desenhadas em SVG (não emoji), simplificadas para tamanhos pequenos
function Portugal() {
  return (
    <>
      <rect width="24" height="16" fill="#DA291C" />
      <rect width="9.6" height="16" fill="#046A38" />
      <circle cx="9.6" cy="8" r="3.3" fill="none" stroke="#FFE000" strokeWidth="1.1" />
      <path d="M8.3 6.4h2.6v2.4a1.3 1.3 0 0 1-2.6 0z" fill="#fff" stroke="#DA291C" strokeWidth="0.7" />
    </>
  );
}

function Spain() {
  return (
    <>
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
      <rect x="5.2" y="6" width="2.6" height="4" rx="0.6" fill="#AA151B" opacity="0.85" />
    </>
  );
}

function Brazil() {
  return (
    <>
      <rect width="24" height="16" fill="#009C3B" />
      <path d="M12 1.8 21.6 8 12 14.2 2.4 8z" fill="#FFDF00" />
      <circle cx="12" cy="8" r="3.7" fill="#002776" />
      <path d="M8.5 7.1c2.4-.5 4.9-.2 7 .9" fill="none" stroke="#fff" strokeWidth="0.75" />
    </>
  );
}

export function Flag({ locale, className = "h-4 w-6" }: { locale: Locale; className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={`${className} shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10`} aria-hidden="true">
      {locale === "pt-PT" ? <Portugal /> : locale === "es-ES" ? <Spain /> : <Brazil />}
    </svg>
  );
}
