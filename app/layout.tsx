import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { getDictionary, localeMeta, locales } from "@/lib/i18n";
import { getLocale, getTheme } from "@/lib/prefs";
import { site } from "@/lib/site";
import { OfflineReady } from "@/components/offline-ready";
import "./globals.css";

// Uma só família: Instrument Sans (variável em peso e largura; os títulos usam a versão mais estreita)
const sans = Instrument_Sans({ subsets: ["latin"], axes: ["wdth"], variable: "--font-instrument", display: "swap" });

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
    { media: "(prefers-color-scheme: dark)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    <html lang={locale} data-theme={theme} className={sans.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        {children}
        <OfflineReady />
      </body>
    </html>
  );
}
