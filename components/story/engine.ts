// Motor das "gravações de ecrã" da página inicial.
// Um guião é uma lista de capítulos; cada capítulo tem um estado inicial e passos (tocar num alvo,
// escrever num campo, esperar). O guião é compilado numa linha do tempo em segundos, e tudo o que se
// vê num instante t (ecrã, cursor, câmara) é calculado a partir de t. Por isso o scroll pode andar
// para a frente e para trás e o resultado é sempre o mesmo.
import gsap from "gsap";

export type Step<S> =
  | { tap: string; set?: Partial<S>; zoom?: number }
  | { type: keyof S & string; text: string }
  | { wait: number }
  | { set: Partial<S> };

export type Tap<S> = { target: string; at: number; set: Partial<S>; zoom: number };
type Op<S> = { at: number; apply: (s: S, t: number) => S };
export type Chapter<S> = { start: S; t0: number; t1: number; taps: Tap<S>[]; ops: Op<S>[] };
export type Film<S> = { chapters: Chapter<S>[]; total: number };

export const MOVE = 0.85; // deslocação até ao alvo
const AFTER = 0.55; // pausa depois de cada toque
const CHAR = 0.045; // por letra escrita
const PAD_IN = 0.45;
export const PAD_OUT = 1.1;

export function compile<S>(chs: { start: S; steps: Step<S>[] }[], offset = 0): Film<S> {
  let t = offset;
  const chapters = chs.map((c) => {
    const t0 = t;
    t += PAD_IN;
    const taps: Tap<S>[] = [];
    const ops: Op<S>[] = [];
    for (const st of c.steps) {
      if ("wait" in st) t += st.wait;
      else if ("tap" in st) {
        const at = t + MOVE;
        const set = st.set ?? {};
        taps.push({ target: st.tap, at, set, zoom: st.zoom ?? 1 });
        ops.push({ at, apply: (s) => ({ ...s, ...set }) });
        t = at + AFTER;
      } else if ("set" in st) {
        const set = st.set;
        ops.push({ at: t, apply: (s) => ({ ...s, ...set }) });
      } else {
        const a = t;
        const b = t + st.text.length * CHAR;
        const field = st.type;
        const text = st.text;
        ops.push({ at: a, apply: (s, now) => ({ ...s, [field]: text.slice(0, Math.round(text.length * Math.min(1, (now - a) / (b - a)))) }) });
        t = b + 0.3;
      }
    }
    t += PAD_OUT;
    return { start: c.start, t0, t1: t, taps, ops };
  });
  return { chapters, total: t };
}

export function chapterAt<S>(film: Film<S>, t: number) {
  const i = film.chapters.findIndex((c) => t < c.t1);
  return i === -1 ? film.chapters.length - 1 : i;
}

export function stateAt<S>(c: Chapter<S>, t: number): S {
  return c.ops.reduce((s, op) => (t >= op.at ? op.apply(s, t) : s), c.start);
}

export const ease = gsap.parseEase("power2.inOut");
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export type Pt = { x: number; y: number };

// Posição de um alvo [data-t] em coordenadas lógicas do ecrã (independente de escala e zoom)
export function measure(root: HTMLElement | null, id: string, logicalWidth: number): Pt | null {
  const el = root?.querySelector<HTMLElement>(`[data-t="${id}"]`);
  if (!root || !el) return null;
  const a = root.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  const k = a.width / logicalWidth;
  return { x: (b.left - a.left + b.width / 2) / k, y: (b.top - a.top + b.height / 2) / k };
}

// Onde está o cursor (ou o dedo) e qual a câmara (zoom + foco) no instante t do capítulo.
// cache guarda a posição de cada alvo medida quando ele existia no ecrã.
export function pointerAt<S>(
  c: Chapter<S>,
  ci: number,
  t: number,
  rest: Pt,
  cache: Map<string, Pt>,
  measureNow: (id: string) => Pt | null,
) {
  const posOf = (k: number) => cache.get(`${ci}:${k}`) ?? null;
  const k = c.taps.findIndex((tp) => t < tp.at);
  let p: Pt = rest;
  if (k === -1) p = (c.taps.length ? posOf(c.taps.length - 1) : null) ?? rest;
  else {
    const tp = c.taps[k];
    const to = measureNow(tp.target);
    if (to) cache.set(`${ci}:${k}`, to);
    const from = k === 0 ? rest : posOf(k - 1) ?? to ?? rest;
    const target = to ?? posOf(k) ?? from;
    const e = ease(clamp01((t - (tp.at - MOVE)) / MOVE));
    p = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e };
  }
  const near = c.taps.find((tp) => t >= tp.at - 0.1 && t <= tp.at + 0.6);
  const press = near ? (t <= near.at + 0.12 ? 1 : 0) : 0;
  const ring = near && t >= near.at ? { at: posOf(c.taps.indexOf(near)) ?? p, q: (t - near.at) / 0.6 } : null;
  return { p, press, ring, k };
}

// Câmara ao estilo das gravações de produto: aproxima-se dos toques marcados com zoom
// e volta ao plano geral no fim de cada capítulo.
export function cameraAt<S>(c: Chapter<S>, ci: number, t: number, base: number, cache: Map<string, Pt>, overview: Pt) {
  // No computador o zoom é o pedido; no telemóvel (base já aproximada) soma-se metade do extra
  const zOf = (k: number) => (base <= 1 ? c.taps[k].zoom : base + (c.taps[k].zoom - 1) * 0.5);
  const focusOf = (k: number) => cache.get(`${ci}:${k}`) ?? overview;
  const keys = c.taps.map((tp, k) => ({ a: tp.at - MOVE - 0.15, b: tp.at - 0.05, z: zOf(k), f: focusOf(k) }));
  let cam = { z: base, f: overview };
  let prev = cam;
  for (const key of keys) {
    if (t < key.a) break;
    const target = { z: key.z, f: key.f };
    if (t < key.b) {
      const e = ease(clamp01((t - key.a) / (key.b - key.a)));
      return { z: prev.z + (target.z - prev.z) * e, f: { x: prev.f.x + (target.f.x - prev.f.x) * e, y: prev.f.y + (target.f.y - prev.f.y) * e } };
    }
    prev = target;
    cam = target;
  }
  // Volta ao plano geral no fim do capítulo
  const outA = c.t1 - PAD_OUT * 0.75;
  const outB = c.t1 - 0.1;
  if (t > outA && keys.length) {
    const e = ease(clamp01((t - outA) / (outB - outA)));
    return { z: cam.z + (base - cam.z) * e, f: { x: cam.f.x + (overview.x - cam.f.x) * e, y: cam.f.y + (overview.y - cam.f.y) * e } };
  }
  return cam;
}
