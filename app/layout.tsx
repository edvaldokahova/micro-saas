import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — documentos em falta, sob controlo`, template: `%s · ${site.name}` },
  description:
    "Para escritórios de contabilidade: peça os documentos do mês por link, veja quem ainda não entregou e envie lembretes por WhatsApp num clique.",
  icons: { icon: "/favicon.png", apple: "/android-chrome-512x512.png" },
  openGraph: { type: "website", siteName: site.name, locale: "pt_PT", alternateLocale: ["es_ES"] },
};

export const viewport: Viewport = { themeColor: "#0a0b0d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
