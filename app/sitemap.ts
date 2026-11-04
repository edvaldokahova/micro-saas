import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Só páginas públicas e indexáveis (a página de criar conta é «noindex», por isso não entra)
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-11-04");
  const pages: { path: string; priority: number; freq: "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/precos", priority: 0.9, freq: "monthly" },
    { path: "/suporte", priority: 0.6, freq: "monthly" },
    { path: "/termos", priority: 0.3, freq: "yearly" },
    { path: "/privacidade", priority: 0.3, freq: "yearly" },
    { path: "/reembolsos", priority: 0.3, freq: "yearly" },
  ];
  return pages.map((p) => ({ url: `${site.url}${p.path}`, lastModified: updated, changeFrequency: p.freq, priority: p.priority }));
}
