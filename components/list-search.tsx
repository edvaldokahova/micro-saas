"use client";

// Pesquisa instantânea numa lista já carregada (painel e clientes): esconde as linhas que não batem.
// Não volta a pedir nada ao servidor.
import { useState } from "react";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ListSearch({ listId, placeholder, emptyText }: { listId: string; placeholder: string; emptyText: string }) {
  const [none, setNone] = useState(false);
  function filter(q: string) {
    const n = norm(q.trim());
    let visible = 0;
    document.querySelectorAll<HTMLElement>(`#${listId} > li[data-search]`).forEach((li) => {
      const hit = !n || norm(li.dataset.search ?? "").includes(n);
      li.hidden = !hit;
      if (hit) visible++;
    });
    setNone(visible === 0);
  }
  return (
    <div>
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
          <circle cx="8.5" cy="8.5" r="5" />
          <path d="M12.3 12.3l4.7 4.7" strokeLinecap="square" />
        </svg>
        <input type="search" onChange={(e) => filter(e.target.value)} placeholder={placeholder} className="field py-2 pl-9" />
      </label>
      {none && <p className="mt-6 text-center text-sm text-muted">{emptyText}</p>}
    </div>
  );
}
