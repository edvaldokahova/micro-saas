"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, PartyPopper, Send, X } from "lucide-react";
import { ChannelIcon, type Channel } from "@/components/channel-icon";
import { markSent } from "./actions";

type Item = { id: string; label: string; status: "pending" | "sent" | "received"; via: Channel | null };
export type ChecklistTexts = {
  markSent: string;
  sent: string;
  received: string;
  pending: string;
  undo: string;
  allDone: string;
  error: string;
  progress: string;
  howSent: string;
  cancel: string;
  via: Record<Channel, string>;
  sentVia: string; // "Enviado via {canal}"
};

const channels: Channel[] = ["whatsapp", "email", "other"];

export function Checklist({ token, initial, closed, t }: { token: string; initial: Item[]; closed: boolean; t: ChecklistTexts }) {
  const [items, setItems] = useState(initial);
  const [asking, setAsking] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [, start] = useTransition();

  const handled = items.filter((i) => i.status !== "pending").length;
  const pct = items.length ? Math.round((handled / items.length) * 100) : 0;
  const allDone = items.length > 0 && handled === items.length;

  function save(item: Item, sent: boolean, via: Channel | null) {
    setAsking(null);
    setError("");
    setBusy(item.id);
    const next = sent ? "sent" : "pending";
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: next, via: sent ? via : null } : i)));
    start(async () => {
      const res = await markSent(token, item.id, sent, via);
      if (res !== next) {
        setItems((list) => list.map((i) => (i.id === item.id ? item : i)));
        setError(t.error);
      }
      setBusy(null);
    });
  }

  function onTap(item: Item) {
    if (closed || item.status !== "pending") return;
    setAsking((cur) => (cur === item.id ? null : item.id));
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
          const open = asking === i.id;
          return (
            <li key={i.id} className="animate-rise" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className={`card overflow-hidden transition ${received ? "border-ok/40" : sent ? "border-gold/50" : open ? "border-gold/60" : ""}`}>
                <button
                  type="button"
                  onClick={() => onTap(i)}
                  disabled={closed || received || sent || busy === i.id}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3.5 px-4 py-4 text-left disabled:cursor-default"
                >
                  {received ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 animate-pop text-ok" aria-hidden />
                  ) : sent ? (
                    <Send className="h-6 w-6 shrink-0 animate-pop text-gold" aria-hidden />
                  ) : (
                    <Circle className="h-6 w-6 shrink-0 text-muted" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium">{i.label}</span>
                    {(sent || received) && i.via && (
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                        <ChannelIcon via={i.via} /> {t.sentVia.replace("{canal}", t.via[i.via])}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      received ? "bg-ok/15 text-ok" : sent ? "bg-gold/15 text-gold" : "bg-accent text-on-accent"
                    }`}
                  >
                    {received ? t.received : sent ? t.sent : closed ? t.pending : t.markSent}
                  </span>
                </button>

                {/* Mini-menu: por onde enviou? */}
                {open && (
                  <div className="animate-rise border-t border-line bg-ink-3/40 px-4 py-3 [animation-duration:.25s]">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t.howSent}</p>
                      <button type="button" onClick={() => setAsking(null)} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:text-ivory" aria-label={t.cancel}>
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      {channels.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => save(i, true, c)}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-ink-2 px-2 py-3 text-xs font-medium transition hover:border-gold/60 active:scale-[0.97]"
                        >
                          <ChannelIcon via={c} className="h-5 w-5" />
                          {t.via[c]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {sent && !closed && (
                <button type="button" onClick={() => save(i, false, null)} className="ml-14 mt-1 text-xs text-muted underline-offset-4 hover:underline">
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
