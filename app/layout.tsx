import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { getDictionary, localeMeta, locales } from "@/lib/i18n";
import { getLocale, getTheme } from "@/lib/prefs";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

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
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    <html lang={locale} data-theme={theme} className={`${inter.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
