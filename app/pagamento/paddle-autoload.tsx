"use client";

import { useEffect, useState } from "react";
import { loadPaddle } from "@/lib/paddle/client";

// A Paddle envia links do tipo /pagamento?_ptxn=txn_… (ex.: atualizar cartão).
// Ao inicializar, o Paddle.js deteta o _ptxn e abre o checkout sozinho.
export function PaddleAutoload() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadPaddle().catch(() => setFailed(true));
  }, []);
  return failed ? (
    <p className="text-sm text-bad">Não foi possível carregar o pagamento seguro. Atualize a página ou tente mais tarde.</p>
  ) : null;
}
