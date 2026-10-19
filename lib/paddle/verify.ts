import { createHmac, timingSafeEqual } from "node:crypto";

// Verifica o cabeçalho Paddle-Signature: "ts=<segundos>;h1=<hmac-sha256 hex>"
// O HMAC é calculado sobre "<ts>:<corpo bruto>" com o segredo do destino de notificações.
// Aceita vários h1 (acontece durante a rotação do segredo) e rejeita pedidos com mais de 5 minutos.
export function verifyPaddleSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): boolean {
  if (!header || !secret) return false;

  let ts = "";
  const signatures: string[] = [];
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "ts") ts = v;
    else if (k === "h1" && v) signatures.push(v);
  }

  if (!/^\d{1,12}$/.test(ts) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - Number(ts)) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest();
  return signatures.some((sig) => {
    if (!/^[0-9a-f]{64}$/i.test(sig)) return false;
    return timingSafeEqual(Buffer.from(sig, "hex"), expected);
  });
}
