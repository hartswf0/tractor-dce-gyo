/* lib/hall.ts — the hall of OD-B01-S03 as assets/hall.json carries it: the figures' marks per key (eased across each seam window),
   and per drawing how much the scene's scripted layers move each figure. Plan coordinates: x across, -z up the page (the gate at the
   bottom), world units. */
export interface HallFig { id: string; H: number; base: number[]; fill: number[] }
export interface HallKey { t: number; win: [number, number] | null; beat: string; snap: Record<string, { p: [number, number]; h: number; sat: boolean; vis: boolean }> }
export interface HallData { scene: string; total: number; drawings: number; thresh: number; keys: HallKey[]; figs: HallFig[];
  pieces: { label: string; box: number[] }[]; density: { before: number; after: number } }

export function markAt(d: HallData, id: string, t: number): { x: number; y: number; h: number; vis: boolean } {
  const K = d.keys; let i = 0;
  for (let q = 0; q < K.length; q++) if (K[q].t <= t) i = q;
  const w = [i + 1, i].find(q => K[q] && K[q].win && q > 0 && t >= (K[q].win as number[])[0] && t <= (K[q].win as number[])[1]);
  const s = K[i].snap[id];
  if (w === undefined) return { x: s.p[0], y: -s.p[1], h: s.h, vis: s.vis };
  const A = K[w - 1].snap[id], B = K[w].snap[id], win = K[w].win as number[];
  const u = Math.max(0, Math.min(1, (t - win[0]) / (win[1] - win[0]))), e = u * u * (3 - 2 * u);
  return { x: A.p[0] + (B.p[0] - A.p[0]) * e, y: -(A.p[1] + (B.p[1] - A.p[1]) * e), h: A.h + (B.h - A.h) * e, vis: e < 0.5 ? A.vis : B.vis };
}

/** a stable unit value from integers: the choreographer's own kind of seed (a hash, not a generator with state) */
export function hash01(a: number, b: number, c: number): number {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
