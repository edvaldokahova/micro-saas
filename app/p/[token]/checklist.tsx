"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { DocMark } from "@/components/marks";
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
      <div className="flex items-center justify-between border-b border-line pb-2 text-[12px] font-medium text-muted">
        <span>{t.progress.replace("{a}", String(handled)).replace("{b}", String(items.length))}</span>
        <span className="tabular-nums text-ivory">{pct}%</span>
      </div>

      {allDone && (
        <p className="mt-4 flex animate-rise items-center gap-2.5 border-y border-ok/40 py-3 text-sm text-ok">
          <DocMark state="received" className="h-4 w-4" /> {t.allDone}
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-bad" role="alert">
          {error}
        </p>
      )}

      <ul>
        {items.map((i, idx) => {
          const received = i.status === "received";
          const sent = i.status === "sent";
          const open = asking === i.id;
          return (
            <li key={i.id} className="animate-rise border-b border-line" style={{ animationDelay: `${idx * 40}ms` }}>
              <button
                type="button"
                onClick={() => onTap(i)}
                disabled={closed || received || sent || busy === i.id}
                aria-expanded={open}
                className="flex w-full items-center gap-3.5 py-4 text-left disabled:cursor-default"
              >
                <DocMark key={i.status} state={i.status} className="h-[18px] w-[18px]" animate={i.status !== "pending"} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{i.label}</span>
                  {(sent || received) && (
                    <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
                      {i.via && <ChannelIcon via={i.via} className="h-3 w-3" />}
                      {received ? t.received : i.via ? t.sentVia.replace("{canal}", t.via[i.via]) : t.sent}
                    </span>
                  )}
                </span>
                {!received && !sent && (
                  <span
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      closed ? "border-line text-muted" : open ? "border-ivory bg-ivory text-ink" : "border-ivory"
                    }`}
                  >
                    {closed ? t.pending : t.markSent}
                  </span>
                )}
              </button>

              {/* Mini-menu: por onde enviou? */}
              {open && (
                <div className="mb-3 animate-rise border border-line bg-ink-2 px-3.5 py-3 [animation-duration:.2s]">
                  <div className="flex items-center justify-between">
                    <p className="mono-label">{t.howSent}</p>
                    <button type="button" onClick={() => setAsking(null)} className="grid h-7 w-7 place-items-center text-muted hover:text-ivory" aria-label={t.cancel}>
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {channels.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => save(i, true, c)}
                        className="flex flex-col items-center gap-1.5 rounded-lg border border-line-strong px-2 py-3 text-xs font-medium transition hover:border-ivory active:bg-ink-3"
                      >
                        <ChannelIcon via={c} className="h-5 w-5" />
                        {t.via[c]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {sent && !closed && (
                <button type="button" onClick={() => save(i, false, null)} className="-mt-2 mb-3 ml-8 text-xs text-muted underline-offset-4 hover:underline">
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
