// Imagem de partilha (WhatsApp, LinkedIn, Facebook, X, resultados das IAs): 1200×630, nas cores da marca.
// Gerada pelo próprio Next.js (sem ficheiros nem serviços externos).
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name}: recolha de documentos para escritórios de contabilidade`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f7f8", color: "#121316", padding: "72px 80px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* O «O» do logótipo: anel quase fechado */}
          <svg width="44" height="44" viewBox="0 0 44 44">
            <path d="M22 4 A18 18 0 1 1 15 5.4" fill="none" stroke="#121316" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 34, letterSpacing: 10, fontWeight: 400 }}>BILONAI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.0, letterSpacing: -3, maxWidth: 980 }}>Deixe de perseguir documentos em falta.</div>
          <div style={{ marginTop: 30, fontSize: 32, color: "#60636b", maxWidth: 940, lineHeight: 1.35 }}>
            Os clientes enviam por link ou e-mail; tudo chega arrumado por cliente e mês, com lembretes automáticos.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, color: "#60636b" }}>
          <div style={{ display: "flex" }}>Para escritórios de contabilidade · Portugal · Brasil · Espanha</div>
          <div style={{ display: "flex", background: "#121316", color: "#ffffff", borderRadius: 999, padding: "14px 30px", fontWeight: 600 }}>{site.trialDays} dias grátis</div>
        </div>
      </div>
    ),
    size,
  );
}
