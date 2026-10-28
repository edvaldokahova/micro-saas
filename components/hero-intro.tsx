"use client";

// O único momento orquestrado ao carregar a página: o título sobe linha a linha por trás de uma
// máscara (SplitText), e o texto e o botão aparecem logo a seguir. Com "reduzir movimento" não anima.
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
      if (!title) return;
      let split: SplitText | undefined;
      document.fonts.ready.then(() => {
        split = SplitText.create(title, {
          type: "lines,words",
          mask: "lines",
          linesClass: "hero-line",
          autoSplit: true,
          onSplit(self) {
            gsap.set(title, { autoAlpha: 1 });
            return gsap
              .timeline()
              .from(self.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.045 })
              .from(rest, { autoAlpha: 0, y: 14, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=0.75");
          },
        });
      });
      return () => split?.revert();
    });
    return () => mm.revert();
  }, []);

  return <div ref={root}>{children}</div>;
}
