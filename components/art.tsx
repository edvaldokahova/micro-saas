"use client";

// Ilustrações animadas próprias (sem bibliotecas de ícones), cada uma ligada ao que a secção conta:
//  DocsArt     · os documentos do cliente a chegar: em falta → enviado → recebido
//  MonthArt    · o mês de recolha: os dias vão ficando tratados até ao prazo
//  MessageArt  · a mensagem ao cliente: escreve, envia o link, o cliente responde
// Animam só quando estão no ecrã; com "reduzir movimento" ficam paradas no estado final.
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DocMark } from "@/components/marks";

gsap.registerPlugin(ScrollTrigger);

function useLoop(build: (root: HTMLElement) => gsap.core.Timeline) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = build(el);
      tl.pause();
      ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: (self) => (self.isActive ? tl.play() : tl.pause()) });
    }, el);
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

/* ---------- Documentos a chegar ---------- */

export function DocsArt({ docs, client, labels }: { docs: string[]; client: string; labels: { sent: string; received: string } }) {
  const ref = useLoop((el) => {
    const cards = gsap.utils.toArray<HTMLElement>("[data-card]", el);
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.inOut" } });
    cards.forEach((card, i) => {
      const sent = card.querySelector("[data-m='sent']");
      const rec = card.querySelector("[data-m='received']");
      const pill = card.querySelector("[data-pill]");
      const label = `c${i}`;
      tl.addLabel(label)
        .fromTo(card, { x: 70, y: 18, rotation: 9, autoAlpha: 0, scale: 0.92 }, { x: 0, y: 0, rotation: (i - 1) * -3, autoAlpha: 1, scale: 1, duration: 0.9 }, label)
        .fromTo(sent, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, `${label}+=1.1`)
        .fromTo(rec, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, `${label}+=2`)
        .fromTo(pill, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, `${label}+=2.05`)
        .to(card, { x: -60, y: -26, rotation: -10, autoAlpha: 0, scale: 0.9, duration: 0.8 }, `${label}+=3.4`);
    });
    return tl;
  });
  return (
    <div ref={ref} className="relative h-[300px] w-[300px]" aria-hidden>
      {docs.map((d, i) => (
        <div
          key={d}
          data-card
          className="absolute left-[30px] top-[40px] h-[220px] w-[240px] rounded-[22px] border border-line bg-ink-2 p-5 shadow-[0_30px_60px_-30px_rgba(18,19,22,0.35)]"
          style={{ zIndex: 3 - i }}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative block h-5 w-5">
              <DocMark state="pending" className="absolute inset-0 h-5 w-5" />
              <span data-m="sent" className="absolute inset-0 opacity-0"><DocMark state="sent" className="h-5 w-5" /></span>
              <span data-m="received" className="absolute inset-0 opacity-0"><DocMark state="received" className="h-5 w-5" /></span>
            </span>
            <span className="truncate text-[14px] font-semibold">{d}</span>
          </div>
          <p className="mt-1 pl-[30px] text-[12px] text-muted">{client}</p>
          <div className="mt-5 space-y-2.5">
            {[0.92, 0.78, 0.86, 0.55].map((w, k) => (
              <span key={k} className="block h-[7px] rounded-full bg-ink-3" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
          <span data-pill className="absolute bottom-4 left-5 inline-flex items-center gap-1.5 rounded-full bg-ivory px-3 py-1 text-[11.5px] font-medium text-ink opacity-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5.3l2 2L8.2 3" /></svg>
            {labels.received}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- O mês de recolha ---------- */

export function MonthArt({ month, due }: { month: string; due: number }) {
  const days = 30;
  const ref = useLoop((el) => {
    const cells = gsap.utils.toArray<HTMLElement>("[data-day]", el);
    const fills = cells.map((c) => c.querySelector("[data-fill]"));
    const ring = el.querySelector("[data-ring]");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    tl.set(fills, { scale: 0, autoAlpha: 0 })
      .to(fills, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(2.4)", stagger: { each: 0.06, from: "start" } })
      .fromTo(ring, { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(2)" }, 0.06 * (due - 1))
      .to(ring, { scale: 1.25, autoAlpha: 0, duration: 0.9, ease: "power2.out", repeat: 2 }, ">")
      .to(fills, { autoAlpha: 0, duration: 0.5, stagger: { each: 0.01, from: "end" } }, "+=0.8");
    return tl;
  });
  return (
    <div ref={ref} className="w-[300px] rounded-[26px] border border-line bg-ink-2 p-5 shadow-[0_30px_60px_-34px_rgba(18,19,22,0.35)]" aria-hidden>
      <p className="text-[14px] font-semibold">{month}</p>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }, (_, i) => {
          const day = i - 1; // o mês começa numa terça
          const real = day >= 1 && day <= days;
          return (
            <span key={i} data-day={real ? day : undefined} className={`relative grid aspect-square place-items-center rounded-[9px] text-[11px] tabular-nums ${real ? "bg-ink-3 text-muted" : ""}`}>
              {real && (
                <>
                  <span data-fill className="absolute inset-0 rounded-[9px] bg-ivory opacity-0" />
                  <span className="relative mix-blend-difference text-white">{day}</span>
                  {day === due && <span data-ring className="absolute -inset-[3px] rounded-[11px] border-2 border-gold opacity-0" />}
                </>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- A mensagem ao cliente ---------- */

export function MessageArt({ office, text, link, reply }: { office: string; text: string; link: string; reply: string }) {
  const ref = useLoop((el) => {
    const q = (s: string) => el.querySelector(`[data-x='${s}']`);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1, defaults: { ease: "power3.out" } });
    tl.set([q("msg"), q("reply"), q("ticks")], { autoAlpha: 0 })
      .set(q("blue"), { autoAlpha: 0 })
      .fromTo(q("typing"), { autoAlpha: 0, scale: 0.8, transformOrigin: "0% 100%" }, { autoAlpha: 1, scale: 1, duration: 0.4 })
      .to(q("dots")?.children ?? [], { y: -3, duration: 0.3, stagger: 0.12, repeat: 3, yoyo: true, ease: "sine.inOut" })
      .to(q("typing"), { autoAlpha: 0, scale: 0.9, duration: 0.2 })
      .fromTo(q("msg"), { autoAlpha: 0, y: 14, scale: 0.96, transformOrigin: "0% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55 }, "<")
      .to(q("ticks"), { autoAlpha: 1, duration: 0.3 }, "+=0.3")
      .to(q("blue"), { autoAlpha: 1, duration: 0.3 }, "+=0.8")
      .fromTo(q("reply"), { autoAlpha: 0, y: 14, scale: 0.96, transformOrigin: "100% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55 }, "+=0.5")
      .to([q("msg"), q("reply"), q("ticks"), q("blue")], { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=2.4");
    return tl;
  });
  return (
    <div ref={ref} className="relative h-[250px] w-[340px]" aria-hidden>
      <div data-x="typing" className="absolute left-0 top-6 rounded-[20px] rounded-bl-[6px] bg-ink-3 px-4 py-3 opacity-0">
        <span data-x="dots" className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-2 w-2 rounded-full bg-muted" />
          ))}
        </span>
      </div>
      <div data-x="msg" className="absolute left-0 top-6 w-[270px] rounded-[20px] rounded-bl-[6px] bg-ink-3 px-4 py-3 opacity-0">
        <p className="text-[11.5px] font-semibold text-muted">{office}</p>
        <p className="mt-1 line-clamp-2 text-[13.5px] leading-[1.4]">{text}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink-2 px-2.5 py-1 text-[12px] text-gold">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M5 7l2-2M4.2 5.6L3 6.8a1.8 1.8 0 0 0 2.5 2.5l1.2-1.2M7.8 6.4L9 5.2a1.8 1.8 0 0 0-2.5-2.5L5.3 3.9" /></svg>
          {link}
        </span>
        <span className="absolute -bottom-5 left-1 flex items-center text-[11px] text-muted">
          <span data-x="ticks" className="relative opacity-0">
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5.5l2.6 2.6L9 2.5M7.5 7.8l.3.3L13.2 2.5" /></svg>
            <svg data-x="blue" width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 opacity-0"><path d="M1 5.5l2.6 2.6L9 2.5M7.5 7.8l.3.3L13.2 2.5" /></svg>
          </span>
        </span>
      </div>
      <div data-x="reply" className="absolute bottom-4 right-0 rounded-[20px] rounded-br-[6px] bg-ivory px-4 py-2.5 text-[13.5px] text-ink opacity-0">
        {reply}
      </div>
    </div>
  );
}
