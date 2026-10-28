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
      <div role="radiogroup" hidden={!showControl} className="inline-flex items-center gap-0.5 rounded-xl border border-line-strong p-0.5 text-sm">
        {(["month", "year"] as const).map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={interval === i}
            onClick={() => setInterval(i)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition ${
              interval === i ? "bg-accent text-on-accent" : "text-muted hover:text-ivory"
            }`}
          >
            {labels[i]}
            {i === "year" && (
              <span className={`text-[12px] font-medium ${interval === i ? "opacity-80" : "text-ok"}`}>
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
