"use client";

// Movimento de texto da página inicial (GSAP + SplitText + ScrollTrigger), num só sítio:
//  [data-split="chars"]  títulos: cada letra sobe e endireita-se quando o título entra no ecrã
//  [data-split="lines"]  parágrafos: linha a linha, por trás de uma máscara
//  [data-scrub]          frase grande: as palavras acendem à medida que se desce
//  [data-parallax=n]     o elemento sobe mais devagar ou mais depressa que o scroll
//  [data-magnetic]       botões que seguem ligeiramente o rato (só com rato)
// Com "reduzir movimento" nada disto corre e o texto fica como está.
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function PageMotion() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    let alive = true;
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits: SplitText[] = [];
      const cleanups: (() => void)[] = [];

      document.fonts.ready.then(() => {
        if (!alive) return;
        document.querySelectorAll<HTMLElement>('[data-split="chars"]').forEach((el) => {
          splits.push(
            SplitText.create(el, {
              type: "lines,words,chars",
              mask: "lines",
              linesClass: "split-line",
              autoSplit: true,
              onSplit: (self) =>
                gsap.from(self.chars, {
                  yPercent: 115,
                  rotationX: -60,
                  transformPerspective: 600,
                  transformOrigin: "50% 100%",
                  opacity: 0,
                  duration: 1.1,
                  ease: "expo.out",
                  stagger: { each: 0.016 },
                  scrollTrigger: { trigger: el, start: "top 86%", toggleActions: "play none none reverse" },
                }),
            }),
          );
        });

        document.querySelectorAll<HTMLElement>('[data-split="lines"]').forEach((el) => {
          splits.push(
            SplitText.create(el, {
              type: "lines",
              mask: "lines",
              linesClass: "split-line",
              autoSplit: true,
              onSplit: (self) =>
                gsap.from(self.lines, {
                  yPercent: 105,
                  opacity: 0,
                  duration: 0.9,
                  ease: "power4.out",
                  stagger: 0.09,
                  scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
                }),
            }),
          );
        });

        document.querySelectorAll<HTMLElement>("[data-scrub]").forEach((el) => {
          splits.push(
            SplitText.create(el, {
              type: "words",
              autoSplit: true,
              onSplit: (self) =>
                gsap.fromTo(
                  self.words,
                  { opacity: 0.14 },
                  { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: true } },
                ),
            }),
          );
        });

        document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const speed = Number(el.dataset.parallax) || 0.2;
          gsap.to(el, {
            yPercent: -100 * speed,
            opacity: 0.15,
            ease: "none",
            scrollTrigger: { trigger: el.closest("section") ?? el, start: "top top", end: "bottom top", scrub: true },
          });
        });

        if (window.matchMedia("(pointer: fine)").matches) {
          document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
            const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
            const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
            const move = (e: PointerEvent) => {
              const r = el.getBoundingClientRect();
              xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
              yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
            };
            const leave = () => {
              xTo(0);
              yTo(0);
            };
            el.addEventListener("pointermove", move);
            el.addEventListener("pointerleave", leave);
            cleanups.push(() => {
              el.removeEventListener("pointermove", move);
              el.removeEventListener("pointerleave", leave);
            });
          });
        }
        ScrollTrigger.refresh();
      });

      return () => {
        cleanups.forEach((f) => f());
        splits.forEach((s) => s.revert());
      };
    });
    return () => {
      alive = false;
      mm.revert();
    };
  }, []);
  return null;
}
