import { paddleClientToken, paddleEnv } from "@/lib/paddle/config";

// Tipagem mínima do Paddle.js v2 (só o que usamos)
export type PaddleJs = {
  Environment: { set: (env: "sandbox") => void };
  Initialize: (opts: { token: string; checkout?: { settings?: Record<string, unknown> } }) => void;
  Checkout: {
    open: (opts: { transactionId: string; settings?: Record<string, unknown> }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleJs;
  }
}

let loading: Promise<PaddleJs> | null = null;

// Carrega e inicializa o Paddle.js uma única vez. Se houver ?_ptxn= no URL, o Paddle abre o checkout sozinho.
export function loadPaddle(): Promise<PaddleJs> {
  if (typeof window === "undefined") return Promise.reject(new Error("Só no navegador"));
  if (loading) return loading;

  loading = new Promise<PaddleJs>((resolve, reject) => {
    if (!paddleClientToken) {
      reject(new Error("Token da Paddle em falta"));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      const P = window.Paddle;
      if (!P) {
        reject(new Error("Paddle.js indisponível"));
        return;
      }
      if (paddleEnv === "sandbox") P.Environment.set("sandbox");
      P.Initialize({
        token: paddleClientToken,
        checkout: { settings: { displayMode: "overlay", theme: "dark" } },
      });
      resolve(P);
    };
    script.onerror = () => {
      loading = null;
      reject(new Error("Paddle.js não carregou"));
    };
    document.head.appendChild(script);
  });

  return loading;
}
