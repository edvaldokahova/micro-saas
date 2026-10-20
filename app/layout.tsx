import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { getDictionary, localeMeta, locales } from "@/lib/i18n";
import { getLocale, getTheme } from "@/lib/prefs";
import { site } from "@/lib/site";
import "./globals.css";

// Identidade "livro-razão": serifa editorial nos títulos e números, Plex no texto, Plex Mono nas etiquetas
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex", display: "swap" });
const display = Newsreader({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-news", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const d = getDictionary(locale);
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.name} — ${d.home.metaTitle}`, template: `%s · ${site.name}` },
    description: d.home.metaDescription(site.trialDays),
    icons: { icon: "/favicon.png", apple: "/android-chrome-512x512.png" },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: localeMeta[locale].og,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].og),
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#f3f0e8" },
    { media: "(prefers-color-scheme: light)", color: "#f3f0e8" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    <html lang={locale} data-theme={theme} className={`${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
