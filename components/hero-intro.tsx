"use client";

// Abertura da página: cada letra do título sobe e endireita-se por trás da máscara da linha (SplitText),
// e o texto e o botão aparecem logo a seguir. Com "reduzir movimento" não anima.
// Sem JavaScript o título fica visível (a regra de CSS volta a mostrá-lo ao fim de 2 s).
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export function HeroIntro({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const title = el.querySelector<HTMLElement>("[data-hero-title]");
      const rest = el.querySelectorAll<HTMLElement>("[data-hero-rest]");
      const cta = el.querySelector<HTMLElement>("[data-hero-cta]");
      const arrow = el.querySelector<SVGElement>("[data-cta-arrow]");
      if (!title) return;
      let split: SplitText | undefined;
      document.fonts.ready.then(() => {
        split = SplitText.create(title, {
          type: "lines,words,chars",
          mask: "lines",
          linesClass: "hero-line",
          autoSplit: true,
          onSplit(self) {
            gsap.set(title, { autoAlpha: 1 });
            const tl = gsap
              .timeline()
              .from(self.chars, { yPercent: 120, rotationX: -80, transformPerspective: 700, transformOrigin: "50% 100%", opacity: 0, duration: 1.25, ease: "expo.out", stagger: 0.022 })
              .from(rest, { autoAlpha: 0, y: 14, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=0.75");
            // O botão: nasce do círculo da seta e abre-se para a esquerda (o texto vai sendo revelado),
            // e a seta dá um único toque para a frente, só para chamar o olhar. Acontece uma vez.
            if (cta) {
              tl.fromTo(cta, { clipPath: "inset(0 0 0 80% round 999px)" }, { clipPath: "inset(0 0 0 0% round 999px)", duration: 1, ease: "expo.out", clearProps: "clipPath" }, "<0.12");
              if (arrow) tl.fromTo(arrow, { x: 0 }, { x: 5, duration: 0.28, ease: "power2.out", yoyo: true, repeat: 1, clearProps: "transform" }, ">-0.15");
            }
            return tl;
          },
        });
      });
      return () => split?.revert();
    });
    return () => mm.revert();
  }, []);

  return <div ref={root}>{children}</div>;
}
