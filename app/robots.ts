import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Motores de busca e assistentes de IA podem ler o site público; as áreas privadas ficam de fora.
// Os robôs das IAs são nomeados um a um (alguns só leem o que lhes é explicitamente permitido).
const PRIVATE = ["/app", "/p/", "/auth/", "/entrar", "/registar", "/pagamento", "/api/"];
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "meta-externalagent",
  "MistralAI-User",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: ["/", "/llms.txt"], disallow: PRIVATE },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
