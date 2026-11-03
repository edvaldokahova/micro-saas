"use client";

// Fundo da abertura: a «central de operações» do Bilonai, num ciclo de 14 s que é um mês de recolha.
//  1. A central (o anel quase fechado do logótipo) abre o mês; uma onda atravessa a grelha.
//  2. Saem lembretes (azul) da central para cada cliente, em órbitas inclinadas como um plano em perspetiva.
//  3. Os documentos voltam, um a um, e cada cliente fica verde com o visto; o contador sobe.
//  4. Os atrasados recebem um segundo lembrete automático e entregam logo a seguir.
//  5. Com 8/8, o anel da central fecha-se, uma onda final passa, e o ciclo recomeça.
// Tudo deriva do mesmo relógio, por isso está sempre sincronizado. As cores vêm do tema (claro/escuro).
// Para no ecrã escondido ou fora de vista; com «reduzir movimento» mostra uma única imagem parada.
import { useEffect, useRef } from "react";

const CYCLE = 14; // segundos por «mês»
const N = 8; // clientes
const TRAVEL = 0.07; // duração de cada viagem (fração do ciclo)
const LATE = [4, 7]; // os dois clientes que precisam de segundo lembrete
const RANK = [3, 0, 5, 1, -1, 2, 4, -1]; // ordem de entrega dos que respondem ao primeiro lembrete

type Colors = { ink: string; ivory: string; line: string; muted: string; accent: string; ok: string };

const remindAt = (i: number) => 0.12 + i * 0.03;
const secondAt = (i: number) => 0.66 + LATE.indexOf(i) * 0.035;
const deliverAt = (i: number) => (RANK[i] >= 0 ? 0.36 + RANK[i] * 0.055 : 0.79 + LATE.indexOf(i) * 0.045);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

function readColors(): Colors {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    ink: v("--color-ink", "#f6f6f6"),
    ivory: v("--color-ivory", "#121316"),
    line: v("--color-line-strong", "#cfd1d6"),
    muted: v("--color-muted", "#6b6f78"),
    accent: v("--color-gold", "#2f5bea"),
    ok: v("--color-ok", "#1e7a52"),
  };
}

// Cor com transparência a partir de #rrggbb
function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a)})`;
}

export function HeroOps() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let C = readColors();
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    const start = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      // Nitidez total no telemóvel (ecrãs de 2× a 3×) e no computador
      dpr = Math.min(window.devicePixelRatio || 1, w < 640 ? 3 : 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(0.92, 0);
    };

    function draw(t: number, secs: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const mobile = w < 640;
      const cx = w / 2;
      const cy = h * (mobile ? 0.86 : 0.8);
      const base = Math.max(w * 0.52, 380);
      const TILT = 0.36;
      const radii = [0.2, 0.4, 0.64, 0.92].map((k) => k * base);

      // Número de documentos já entregues neste instante
      let count = 0;
      for (let i = 0; i < N; i++) if (t >= deliverAt(i) + TRAVEL) count++;
      const reset = clamp((t - 0.95) / 0.05); // no fim do ciclo, tudo volta suavemente ao início

      // ---- Grelha de pontos (chão em perspetiva) com as ondas da central ----
      const gap = mobile ? 24 : 22;
      const waves = [ease(t / 0.22) * base * 1.3, t > 0.9 ? ease((t - 0.9) / 0.1) * base * 1.3 : -999];
      ctx.fillStyle = C.muted;
      for (let y = gap / 2; y < h; y += gap) {
        const fadeTop = clamp((y - h * 0.12) / (h * 0.6));
        if (fadeTop <= 0) continue;
        for (let x = gap / 2; x < w; x += gap) {
          const dx = x - cx;
          const dy = (y - cy) / 0.5;
          const d = Math.hypot(dx, dy);
          let a = 0.2 + 0.09 * Math.sin(d / 38 - secs * 0.9);
          for (const r of waves) if (r > 0) a += 0.55 * Math.exp(-Math.pow((d - r) / 46, 2)) * (1 - r / (base * 1.3));
          a *= fadeTop * clamp(1 - d / (base * 1.25));
          if (a < 0.03) continue;
          ctx.globalAlpha = clamp(a * 0.85, 0, 0.7);
          ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
        }
      }
      ctx.globalAlpha = 1;

      // ---- Órbitas inclinadas ----
      radii.forEach((rx, k) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, rx * TILT, 0, 0, Math.PI * 2);
        ctx.strokeStyle = alpha(C.line, k === 3 ? 0.55 : 0.75);
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      // Varrimento de radar no plano das órbitas, sempre alinhado com o ponteiro do mês
      const hand = -Math.PI / 2 + t * Math.PI * 2;
      if (typeof ctx.createConicGradient === "function") {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, TILT);
        const span = 1.1;
        const g = ctx.createConicGradient(hand - span, 0, 0);
        const k = span / (Math.PI * 2);
        g.addColorStop(0, alpha(C.accent, 0));
        g.addColorStop(k * 0.98, alpha(C.accent, 0.075));
        g.addColorStop(k, alpha(C.accent, 0));
        g.addColorStop(1, alpha(C.accent, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, radii[3], 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // Régua dos 30 dias na 2.ª órbita: cada dia acende quando o ponteiro passa
      {
        const rx = radii[1];
        const days = 30;
        for (let k = 0; k < days; k++) {
          const a = -Math.PI / 2 + (k / days) * Math.PI * 2;
          const lit = k / days <= t;
          const major = k % 5 === 0;
          const r0 = rx * (major ? 0.94 : 0.965);
          const r1 = rx * 1.035;
          ctx.beginPath();
          ctx.moveTo(cx + r0 * Math.cos(a), cy + r0 * TILT * Math.sin(a));
          ctx.lineTo(cx + r1 * Math.cos(a), cy + r1 * TILT * Math.sin(a));
          ctx.strokeStyle = lit ? alpha(C.accent, (major ? 0.75 : 0.5) * (1 - reset) + 0.15) : alpha(C.muted, major ? 0.45 : 0.28);
          ctx.lineWidth = major ? 1.4 : 1;
          ctx.stroke();
        }
      }
      // Ponteiro do «relógio do mês»: um arco azul que dá uma volta por ciclo na 2.ª órbita
      {
        const rx = radii[1];
        const a0 = hand;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, rx * TILT, 0, a0 - 0.55, a0);
        ctx.strokeStyle = alpha(C.accent, 0.85);
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.stroke();
        const hx = cx + rx * Math.cos(a0);
        const hy = cy + rx * TILT * Math.sin(a0);
        ctx.beginPath();
        ctx.arc(hx, hy, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = C.accent;
        ctx.fill();
      }
      // Traços finos que giram devagar na órbita exterior (dá vida sem distrair)
      {
        const rx = radii[3];
        ctx.setLineDash([2, 10]);
        ctx.lineDashOffset = -secs * 6;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 1.04, rx * 1.04 * TILT, 0, Math.PI, Math.PI * 2);
        ctx.strokeStyle = alpha(C.line, 0.9);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ---- Clientes nas órbitas 3 e 4, na metade de trás (por cima da central) ----
      const nodes = Array.from({ length: N }, (_, i) => {
        const ring = i % 2 ? 3 : 2;
        const spread = (Math.PI - 0.7) / (N - 1);
        const a = -Math.PI + 0.35 + i * spread + 0.05 * Math.sin(secs * 0.25 + i * 1.7);
        const rx = radii[ring];
        return { x: cx + rx * Math.cos(a), y: cy + rx * TILT * Math.sin(a), depth: 0.75 + 0.25 * -Math.sin(a) };
      });

      // Curva entre a central e um cliente (sobe ligeiramente, como um arco)
      const along = (i: number, p: number, toHub: boolean) => {
        const n = nodes[i];
        const [ax, ay, bx, by] = toHub ? [n.x, n.y, cx, cy] : [cx, cy, n.x, n.y];
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2 - Math.hypot(bx - ax, by - ay) * 0.22;
        const u = 1 - p;
        return [u * u * ax + 2 * u * p * mx + p * p * bx, u * u * ay + 2 * u * p * my + p * p * by];
      };
      // Rasto de cometa ao longo da curva
      const comet = (i: number, p: number, toHub: boolean, color: string, size: number) => {
        for (let s = 9; s >= 0; s--) {
          const q = p - s * 0.035;
          if (q < 0) continue;
          const [x, y] = along(i, q, toHub);
          ctx.beginPath();
          ctx.arc(x, y, size * (1 - s / 12), 0, Math.PI * 2);
          ctx.fillStyle = alpha(color, (1 - s / 10) * (s === 0 ? 1 : 0.45));
          ctx.fill();
        }
      };

      // Linhas de ligação, muito finas
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const mx = (cx + n.x) / 2;
        const my = (cy + n.y) / 2 - Math.hypot(n.x - cx, n.y - cy) * 0.22;
        ctx.quadraticCurveTo(mx, my, n.x, n.y);
        ctx.strokeStyle = alpha(C.line, 0.35 * n.depth);
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Fluxo contínuo de dados (sincronização) nas ligações: pontos pequenos a caminho da central
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < 3; j++) {
          const q = (secs * 0.11 + i * 0.137 + j / 3) % 1;
          const [x, y] = along(i, q, true);
          ctx.beginPath();
          ctx.arc(x, y, 1.05, 0, Math.PI * 2);
          ctx.fillStyle = alpha(C.muted, 0.42 * Math.sin(q * Math.PI) * nodes[i].depth);
          ctx.fill();
        }
      }

      // Viagens: lembretes (central → cliente) e documentos (cliente → central)
      for (let i = 0; i < N; i++) {
        const p1 = (t - remindAt(i)) / TRAVEL;
        if (p1 > 0 && p1 < 1) comet(i, ease(p1), false, C.accent, 2.3);
        if (LATE.includes(i)) {
          const p2 = (t - secondAt(i)) / TRAVEL;
          if (p2 > 0 && p2 < 1) comet(i, ease(p2), false, C.accent, 2.6);
        }
        const p3 = (t - deliverAt(i)) / TRAVEL;
        if (p3 > 0 && p3 < 1) {
          comet(i, ease(p3), true, C.ivory, 1.6);
          // O documento: uma folha pequena na ponta
          const [x, y] = along(i, ease(p3), true);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-0.12);
          ctx.fillStyle = C.ink;
          ctx.strokeStyle = C.ivory;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(-4, -5, 8, 10, 1.6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = alpha(C.ivory, 0.7);
          ctx.fillRect(-2, -2, 4, 0.9);
          ctx.fillRect(-2, 0.4, 3, 0.9);
          ctx.restore();
        }
      }

      // Clientes
      nodes.forEach((n, i) => {
        const reminded = t >= remindAt(i) + TRAVEL;
        const doneAt = deliverAt(i) + TRAVEL;
        const done = t >= doneAt;
        const r = (mobile ? 5.5 : 6.5) * n.depth;
        const fade = 1 - reset;
        // Pulso ao receber o lembrete (e a repetir enquanto espera)
        if (reminded && !done && fade > 0) {
          const since = (t - remindAt(i) - TRAVEL) * CYCLE;
          const ph = (since % 1.6) / 1.6;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 2 + ph * 12, 0, Math.PI * 2);
          ctx.strokeStyle = alpha(C.accent, (1 - ph) * 0.5 * fade);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        // Disco
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = C.ink;
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = done && fade > 0 ? alpha(C.ok, fade + 0.0001) : reminded && fade > 0 ? alpha(C.accent, 0.9 * fade + 0.1) : alpha(C.muted, 0.6);
        ctx.stroke();
        if (done && fade > 0) {
          const pop = ease((t - doneAt) / 0.03);
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * pop, 0, Math.PI * 2);
          ctx.fillStyle = alpha(C.ok, fade);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(n.x - r * 0.42, n.y + r * 0.02);
          ctx.lineTo(n.x - r * 0.1, n.y + r * 0.34);
          ctx.lineTo(n.x + r * 0.46, n.y - r * 0.32);
          ctx.strokeStyle = alpha(C.ink, fade * pop);
          ctx.lineWidth = 1.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
      });

      // ---- A central ----
      const flash = (() => {
        let f = 0;
        for (let i = 0; i < N; i++) {
          const dt = t - (deliverAt(i) + TRAVEL);
          if (dt >= 0 && dt < 0.05) f = Math.max(f, 1 - dt / 0.05);
        }
        return f;
      })();
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
      glow.addColorStop(0, alpha(C.accent, 0.16 + flash * 0.18));
      glow.addColorStop(1, alpha(C.accent, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 90, 0, Math.PI * 2);
      ctx.fill();
      // Ondas a cada documento recebido
      for (let i = 0; i < N; i++) {
        const dt = (t - (deliverAt(i) + TRAVEL)) / 0.08;
        if (dt > 0 && dt < 1) {
          ctx.beginPath();
          ctx.arc(cx, cy, 26 + dt * 34, 0, Math.PI * 2);
          ctx.strokeStyle = alpha(C.ok, (1 - dt) * 0.55);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.fillStyle = C.ink;
      ctx.fill();
      // Anel do logótipo: quase fechado; fecha-se quando o mês fica completo
      const closeP = count === N ? ease((t - (deliverAt(7) + TRAVEL)) / 0.05) * (1 - reset) : 0;
      const gapA = 0.62 * (1 - closeP);
      ctx.beginPath();
      ctx.arc(cx, cy, 17, -Math.PI / 2 + gapA / 2, -Math.PI / 2 + Math.PI * 2 - gapA / 2);
      ctx.strokeStyle = C.ivory;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.stroke();
      // Progresso do mês (documentos recebidos), por fora do anel
      ctx.beginPath();
      ctx.arc(cx, cy, 25, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * count * (1 - reset)) / N);
      ctx.strokeStyle = count === N ? C.ok : C.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Contador
      ctx.font = `600 ${mobile ? 11 : 12}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = alpha(C.muted, 0.95);
      ctx.fillText(`${reset > 0.5 ? 0 : count}/${N}`, cx + 36, cy + 1);
    }

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      const secs = (now - start) / 1000;
      draw((secs % CYCLE) / CYCLE, secs);
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (!raf && visible && !reduced && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : play());
    document.addEventListener("visibilitychange", onVis);
    // Mudança de tema: voltar a ler as cores
    const mo = new MutationObserver(() => {
      C = readColors();
      if (reduced) draw(0.92, 0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (reduced) draw(0.92, 0);
    else play();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
