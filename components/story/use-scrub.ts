"use client";

// Fixa uma secção e transforma o scroll num relógio: chama draw(t) com t entre 0 e total (segundos de
// "filme"), com scrub suave. Com "reduzir movimento" não fixa nada e devolve reduced = true.
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useScrub(opts: {
  pin: React.RefObject<HTMLElement | null>;
  total: number;
  draw: (t: number) => void;
  vhPerSecond: number; // quanto scroll (em alturas de ecrã) por segundo de filme
  onRefresh?: () => void;
}) {
  const [reduced, setReduced] = useState(false);
  const st = useRef<ScrollTrigger | null>(null);
  const draw = useRef(opts.draw);
  draw.current = opts.draw;

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" }, (ctx) => {
      const { still } = ctx.conditions as { still: boolean };
      setReduced(still);
      if (still) return;
      ScrollTrigger.config({ ignoreMobileResize: true });
      const proxy = { t: 0 };
      const total = opts.total;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: opts.pin.current,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * opts.vhPerSecond * total)}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onRefresh: () => opts.onRefresh?.(),
        },
      });
      tl.to(proxy, { t: total, duration: total, ease: "none", onUpdate: () => draw.current(proxy.t) });
      st.current = tl.scrollTrigger ?? null;
      draw.current(0);
      return () => {
        st.current = null;
      };
    });
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.total]);

  // Salta para o instante t (por exemplo, ao tocar num capítulo)
  function seek(t: number) {
    const tr = st.current;
    if (!tr) return;
    window.scrollTo({ top: tr.start + (tr.end - tr.start) * (t / opts.total), behavior: "smooth" });
  }

  return { reduced, seek };
}
