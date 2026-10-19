import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/suporte", "/termos", "/privacidade", "/reembolsos", "/registar"];
  return paths.map((p) => ({ url: `${site.url}${p}`, lastModified: new Date("2026-10-19") }));
}
