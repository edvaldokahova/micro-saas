"use client";

// Ilustrações animadas próprias (sem bibliotecas de ícones), cada uma ligada ao que a secção conta:
//  DocsArt     · os documentos do cliente a chegar: em falta → enviado → recebido
//  MonthArt    · o mês de recolha: os dias vão ficando tratados até ao prazo
//  LinkArt     · sem conta: o registo dá lugar a um link que o cliente só abre
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

/* ---------- Sem conta: o formulário de registo dá lugar a um link ---------- */

export function LinkArt({ link, labels }: { link: string; labels: { email: string; password: string; signup: string; open: string } }) {
  const ref = useLoop((el) => {
    const q = (k: string) => el.querySelector(`[data-x='${k}']`);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, defaults: { ease: "power3.inOut" } });
    tl.set(q("form"), { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)" })
      .set([q("link"), q("ok")], { autoAlpha: 0 })
      .set(q("strike"), { scaleX: 0 })
      .to({}, { duration: 1 })
      .to(q("strike"), { scaleX: 1, duration: 0.6, transformOrigin: "0% 50%" })
      .to(q("form"), { autoAlpha: 0, y: -16, scale: 0.94, filter: "blur(4px)", duration: 0.6 }, "+=0.3")
      .fromTo(q("link"), { autoAlpha: 0, y: 20, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.6)" }, "-=0.25")
      .fromTo(q("ok"), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(3)" }, "+=0.35")
      .to([q("link"), q("ok")], { autoAlpha: 0, y: -10, duration: 0.5, ease: "power2.in" }, "+=2.2");
    return tl;
  });
  return (
    <div ref={ref} className="relative h-[230px] w-[320px]" aria-hidden>
      {/* O que o cliente não precisa de fazer */}
      <div data-x="form" className="absolute inset-x-0 top-0 rounded-[26px] border border-line bg-ink-2 p-5 shadow-[0_30px_60px_-34px_rgba(18,19,22,0.35)]">
        {[labels.email, labels.password].map((l) => (
          <div key={l} className="mb-3">
            <p className="text-[11.5px] text-muted">{l}</p>
            <span className="mt-1 block h-9 rounded-[10px] border border-line-strong" />
          </div>
        ))}
        <span className="relative mt-1 block rounded-full bg-ink-3 py-2.5 text-center text-[13px] font-medium text-muted">
          {labels.signup}
          <span data-x="strike" className="absolute left-4 right-4 top-1/2 h-[2px] -translate-y-1/2 scale-x-0 rounded-full bg-bad" />
        </span>
      </div>
      {/* O que o cliente faz: abrir o link */}
      <div data-x="link" className="absolute inset-x-0 top-12 rounded-[26px] border border-line bg-ink-2 p-5 opacity-0 shadow-[0_30px_60px_-34px_rgba(18,19,22,0.35)]">
        <span className="flex items-center gap-2 rounded-full bg-ink-3 px-3.5 py-2.5 text-[12.5px]">
          <svg width="11" height="13" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden><rect x="1" y="5" width="8" height="6" rx="1.5" /><path d="M2.8 5V3.6a2.2 2.2 0 0 1 4.4 0V5" /></svg>
          <span className="truncate">{link}</span>
        </span>
        <span className="mt-4 flex items-center justify-between">
          <span className="btn btn-primary btn-sm">{labels.open}</span>
          <span data-x="ok" className="grid h-8 w-8 place-items-center rounded-full bg-ok text-white opacity-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.4l2.6 2.5L11 4.4" /></svg>
          </span>
        </span>
      </div>
    </div>
  );
}
