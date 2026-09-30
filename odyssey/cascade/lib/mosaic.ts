/* lib/mosaic.ts — Knowlton's BEFLIX mosaic (Bell Labs, 1963) as a value that travels on Cascade's wires.

   BEFLIX held a film frame as a grid of cells, 252 across and 184 down, each holding an ink level 0-7, and made a film by
   running operations on it (PAINT, LINE, TEXT, SHIFT, ZOOM, EXPAND, SHRINK, COPY, DISSOLVE) and photographing the result.
   Here the grid is the project type `project.mosaic`: { w, h, ink } with one byte per cell, 0 paper to 7 solid ink. Every
   operator node takes one, makes a new one (a value, never mutated in place: a cooked output may be cached and read again),
   and hands it on. Pure functions only; nothing here holds state. */

export type Mosaic = { w: number; h: number; ink: Uint8Array };
export type Lego = { w: number; h: number; colors: Uint16Array; plates: [number, number]; counts: Record<string, number> };

export function blank(w: number, h: number, level = 0): Mosaic {
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
  return { w: W, h: H, ink: new Uint8Array(W * H).fill(clampLevel(level)) };
}
export function clone(m: Mosaic): Mosaic { return { w: m.w, h: m.h, ink: m.ink.slice() }; }
export function isMosaic(v: unknown): v is Mosaic {
  const m = v as Mosaic;
  return !!m && typeof m === 'object' && typeof m.w === 'number' && typeof m.h === 'number' && m.ink instanceof Uint8Array && m.ink.length === m.w * m.h;
}
/* an operator's input: a mosaic when wired, otherwise a blank BEFLIX frame, so a node cooks alone in Studio */
export function orBlank(v: unknown, w = 252, h = 184): Mosaic { return isMosaic(v) ? v : blank(w, h, 0); }
export function clampLevel(v: number): number { return v < 0 ? 0 : v > 7 ? 7 : Math.round(v); }
export function clamp01(v: number): number { return v < 0 ? 0 : v > 1 ? 1 : v; }

/* how a level lands on a cell that holds one: Knowlton's operations wrote levels, and most of his effects came from a few
   combining rules. set: replace; darken/lighten: keep the darker/lighter; add/sub: sum and clip; invert: 7 - old, where the
   written level is non-zero (so an ink letter written in invert shows as paper on ink and ink on paper). */
export function combine(old: number, v: number, mode: string): number {
  switch (mode) {
    case 'darken': return v > old ? v : old;
    case 'lighten': return v < old ? v : old;
    case 'add': return clampLevel(old + v);
    case 'sub': return clampLevel(old - v);
    case 'invert': return v > 0 ? 7 - old : old;
    case 'xor': return v > 0 ? (old >= 4 ? 0 : 7) : old;
    default: return clampLevel(v);
  }
}

/* a deterministic hash of a cell and a seed, in [0, 1): the dissolve fields and every jitter come from here, never Math.random */
export function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul((x | 0) ^ Math.imul(seed | 0, 0x27d4eb2d), 0x85ebca6b) ^ Math.imul((y | 0) + 0x165667b1, 0xc2b2ae35);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/* the baked plates' run-length code (tools/bake_halfworld.mjs): two base-36 characters per run, code = length * 9 + value,
   value 0-7 an ink level and 8 a cell no Halfworld program painted */
export function decodeRuns(runs: string, n: number): Uint8Array {
  const out = new Uint8Array(n).fill(8);
  let k = 0;
  for (let i = 0; i + 1 < runs.length && k < n; i += 2) {
    const code = parseInt(runs.slice(i, i + 2), 36), v = code % 9, len = (code - v) / 9;
    out.fill(v, k, Math.min(n, k + len)); k += len;
  }
  return out;
}

/* Halfworld's ink law (engine/halfworld-engine.mjs INKLAW): below the floor no dot; an S-curve about 0.58 pushes fills toward
   paper and contour toward ink. Used by the camera's halftone look, exactly as the Halfworld post-pass uses it. */
export function inkGrade(d: number): number {
  const mid = 0.58, k = 2.6;
  return d < mid ? mid * Math.pow(d / mid, k) : 1 - (1 - mid) * Math.pow((1 - d) / (1 - mid), k);
}
/* inkLevel(l) in Halfworld paints grey 255 - l * 255 / 7 */
export function inkGrey(l: number): number { return Math.round(255 - clampLevel(l) * 255 / 7); }

/* ---------------- the mosaic font: 5 x 7, one string of 35 cells per glyph ('#' ink) ---------------- */
export function glyph(ch: string): string {
  const G: Record<string, string> = {
    A: '.###.#...##...#######...##...##...#', B: '####.#...##...#####.#...##...#####.',
    C: '.###.#...##....#....#....#...#.###.', D: '####.#...##...##...##...##...#####.',
    E: '######....#....####.#....#....#####', F: '######....#....####.#....#....#....',
    G: '.###.#...##....#.####...##...#.####', H: '#...##...##...#######...##...##...#',
    I: '.###...#....#....#....#....#...###.', J: '..###...#....#....#....#.#..#..##..',
    K: '#...##..#.#.#..##...#.#..#..#.#...#', L: '#....#....#....#....#....#....#####',
    M: '#...###.###.#.##.#.##...##...##...#', N: '#...##...###..##.#.##..###...##...#',
    O: '.###.#...##...##...##...##...#.###.', P: '####.#...##...#####.#....#....#....',
    Q: '.###.#...##...##...##.#.##..#..##.#', R: '####.#...##...#####.#.#..#..#.#...#',
    S: '.#####....#.....###.....#....#####.', T: '#####..#....#....#....#....#....#..',
    U: '#...##...##...##...##...##...#.###.', V: '#...##...##...##...##...#.#.#...#..',
    W: '#...##...##...##.#.##.#.##.#.#.#.#.', X: '#...##...#.#.#...#...#.#.#...##...#',
    Y: '#...##...#.#.#...#....#....#....#..', Z: '#####....#...#...#...#...#....#####',
    '0': '.###.#...##..###.#.###..##...#.###.', '1': '..#...##....#....#....#....#...###.',
    '2': '.###.#...#....#...#...#...#...#####', '3': '#####...#...#.....#.....##...#.###.',
    '4': '...#...##..#.#.#..#.#####...#....#.', '5': '######....####.....#....##...#.###.',
    '6': '..##..#...#....####.#...##...#.###.', '7': '#####....#...#...#...#....#....#...',
    '8': '.###.#...##...#.###.#...##...#.###.', '9': '.###.#...##...#.####....#...#..##..',
    ".": '..........................##...##..', ",": '.....................##...##....#..',
    "'": '..#....#...#.......................', "-": '................###................',
    ":": '......##...##........##...##.......', ";": '......##...##........##....#...#...',
    "!": '..#....#....#....#....#.........#..', "?": '.###.#...#....#...#...#.........#..',
    " ": '...................................'
  };
  return G[ch] ?? G[ch.toUpperCase()] ?? G[' '];
}
/* write text into a mosaic: top-left at (x, y) in cells, each font cell magnified `size` times, `gap` cells between letters,
   lines broken at word boundaries to `wrap` characters (0: no wrap); only the first `count` characters are drawn */
export function textLayout(text: string, wrap: number): string[] {
  const words = text.toUpperCase().replace(/[‘’]/g, "'").replace(/[–—]/g, '-').split(/\s+/).filter(Boolean);
  if (!(wrap > 0)) return [words.join(' ')];
  const lines: string[] = []; let cur = '';
  for (const w of words) {
    if (!cur) cur = w; else if ((cur + ' ' + w).length <= wrap) cur += ' ' + w; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
export function drawGlyph(m: Mosaic, ch: string, x: number, y: number, size: number, level: number, mode: string): void {
  const g = glyph(ch), s = Math.max(1, Math.round(size));
  for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
    if (g[r * 5 + c] !== '#') continue;
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) {
      const X = Math.round(x) + c * s + dx, Y = Math.round(y) + r * s + dy;
      if (X < 0 || Y < 0 || X >= m.w || Y >= m.h) continue;
      const i = Y * m.w + X; m.ink[i] = combine(m.ink[i], level, mode);
    }
  }
}

/* ---------------- LEGO: the eight ink levels as real LEGO colours (LDraw codes, LDConfig values) ---------------- */
export function legoColor(code: number): { name: string; rgb: [number, number, number] } {
  const C: Record<number, [string, number, number, number]> = {
    15: ['White', 0xf4, 0xf4, 0xf4], 19: ['Tan', 0xd7, 0xba, 0x8c], 71: ['Light Bluish Grey', 0x96, 0x96, 0x96],
    28: ['Dark Tan', 0x89, 0x7d, 0x62], 72: ['Dark Bluish Grey', 0x64, 0x64, 0x64], 0: ['Black', 0x1b, 0x2a, 0x34],
  };
  const c = C[code] ?? C[15];
  return { name: c[0], rgb: [c[1], c[2], c[3]] };
}
/* ink level 0-7 -> LDraw colour: paper to ink, White, Tan, Light Bluish Grey, Dark Tan, Dark Bluish Grey, Black (each colour's
   luminance falls in that order: .96 .74 .59 .49 .39 .15), levels 0-1 paper and 6-7 ink, as Halfworld's floor and grade print them */
export function legoRamp(ramp: string): number[] {
  if (ramp === 'grey') return [15, 15, 71, 71, 72, 72, 0, 0];
  if (ramp === 'two') return [15, 15, 15, 15, 0, 0, 0, 0];
  return [15, 15, 19, 71, 28, 72, 0, 0];
}
