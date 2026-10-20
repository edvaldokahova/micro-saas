"use client";

import { useState } from "react";

// Alternador Mensal / Anual. Os preços dos dois modos já vêm desenhados do servidor;
// aqui só se troca o atributo data-interval, e o CSS mostra um ou outro (classes group-data-[interval=…]).
export function IntervalToggle({
  labels,
  initial = "month",
  children,
  className = "",
  showControl = true,
}: {
  labels: { month: string; year: string; badge: string };
  initial?: "month" | "year";
  children: React.ReactNode;
  className?: string;
  showControl?: boolean;
}) {
  const [interval, setInterval] = useState<"month" | "year">(initial);
  return (
    <div data-interval={interval} className={`group ${className}`}>
      <div role="radiogroup" hidden={!showControl} className="inline-flex items-center gap-1 rounded-full border border-line bg-ink-2 p-1 text-sm">
        {(["month", "year"] as const).map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={interval === i}
            onClick={() => setInterval(i)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition ${
              interval === i ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ivory"
            }`}
          >
            {labels[i]}
            {i === "year" && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${interval === i ? "bg-on-accent/15" : "bg-ok/15 text-ok"}`}>
                {labels.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
