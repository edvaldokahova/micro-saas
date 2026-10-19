import "server-only";
import { paddleEnv } from "@/lib/paddle/config";

const baseUrl = paddleEnv === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

// Chamada à API da Paddle com a chave secreta (só no servidor).
export async function paddleApi<T>(
  path: string,
  init: { method: "GET" | "POST" | "PATCH"; body?: unknown },
): Promise<T> {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY em falta");

  const res = await fetch(`${baseUrl}${path}`, {
    method: init.method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: unknown };
  if (!res.ok) {
    // Regista o erro da Paddle (sem dados sensíveis) para diagnóstico nos logs da Vercel
    console.error("[paddle] API", init.method, path.split("/")[1], res.status, JSON.stringify(json.error ?? {}));
    throw new Error(`Paddle API ${res.status}`);
  }
  return json.data as T;
}
