"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, PartyPopper, Send } from "lucide-react";
import { markSent } from "./actions";

type Item = { id: string; label: string; status: "pending" | "sent" | "received" };
export type ChecklistTexts = { markSent: string; sent: string; received: string; pending: string; undo: string; allDone: string; error: string; progress: string };

export function Checklist({ token, initial, closed, t }: { token: string; initial: Item[]; closed: boolean; t: ChecklistTexts }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [, start] = useTransition();

  const handled = items.filter((i) => i.status !== "pending").length;
  const pct = items.length ? Math.round((handled / items.length) * 100) : 0;
  const allDone = items.length > 0 && handled === items.length;

  function toggle(item: Item) {
    if (closed || item.status === "received") return;
    const next = item.status === "pending" ? "sent" : "pending";
    setError("");
    setBusy(item.id);
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
    start(async () => {
      const res = await markSent(token, item.id, next === "sent");
      if (res !== next) {
        setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)));
        setError(t.error);
      }
      setBusy(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{t.progress.replace("{a}", String(handled)).replace("{b}", String(items.length))}</span>
        <span className="font-display font-semibold">{pct}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-3">
        <div className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-ok" : "bg-gold"}`} style={{ width: `${pct}%` }} />
      </div>

      {allDone && (
        <p className="mt-5 flex animate-rise items-center gap-2.5 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-ok">
          <PartyPopper className="h-4 w-4" aria-hidden /> {t.allDone}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-bad">{error}</p>}

      <ul className="mt-5 space-y-2.5">
        {items.map((i, idx) => {
          const received = i.status === "received";
          const sent = i.status === "sent";
          return (
            <li key={i.id} className="animate-rise" style={{ animationDelay: `${idx * 50}ms` }}>
              <button
                type="button"
                onClick={() => toggle(i)}
                disabled={closed || received || busy === i.id}
                aria-pressed={sent || received}
                className={`card flex w-full items-center gap-3.5 px-4 py-4 text-left transition ${
                  received ? "border-ok/40" : sent ? "border-gold/50" : "hover:border-gold/40"
                } disabled:cursor-default`}
              >
                {received ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 animate-pop text-ok" aria-hidden />
                ) : sent ? (
                  <Send className="h-6 w-6 shrink-0 animate-pop text-gold" aria-hidden />
                ) : (
                  <Circle className="h-6 w-6 shrink-0 text-muted" aria-hidden />
                )}
                <span className="min-w-0 flex-1 text-[15px] font-medium">{i.label}</span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    received ? "bg-ok/15 text-ok" : sent ? "bg-gold/15 text-gold" : "bg-accent text-on-accent"
                  }`}
                >
                  {received ? t.received : sent ? t.sent : closed ? t.pending : t.markSent}
                </span>
              </button>
              {sent && !closed && (
                <button type="button" onClick={() => toggle(i)} className="ml-14 mt-1 text-xs text-muted underline-offset-4 hover:underline">
                  {t.undo}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
