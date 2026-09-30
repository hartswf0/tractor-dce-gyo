/* lib/camera.ts — the BEFLIX camera's three looks, drawn straight into an RGBA buffer (one putImageData per frame).

   Why a buffer and not canvas paths: Skia (the CLI host's Canvas 2D) fills one path of many arcs in time that grows faster than
   the arcs (5,000 dots took 3 s; a frame has 46,368 cells), and a fill per dot is slow too. A dot here is a stamp: every cell of
   a mosaic sits at the same sub-pixel phase, so the dot of each ink level is computed once per frame (16 samples a pixel) and
   laid on every cell holding that level, ink combining as ink does (the union of coverages). Deterministic, and fast. */
import { inkGrade, inkGrey, legoColor, type Lego, type Mosaic } from './mosaic';

/* the 1963 grain: each cell a square of its level's grey (Halfworld's inkLevel), its right and lower edge a little darker so
   the grid of the mosaic shows, as the cells of Knowlton's films do */
export function photographCells(m: Mosaic, c: number, grid: number, darken: number): Uint8ClampedArray {
  const W = m.w * c, H = m.h * c, d = new Uint8ClampedArray(W * H * 4);
  for (let cy = 0; cy < m.h; cy++) for (let cx = 0; cx < m.w; cx++) {
    const l = m.ink[cy * m.w + cx], v = inkGrey(Math.min(7, l + (l > 0 ? darken : 0)));
    for (let y = 0; y < c; y++) {
      let i = ((cy * c + y) * W + cx * c) * 4;
      for (let x = 0; x < c; x++, i += 4) {
        const u = c > 2 && (x === c - 1 || y === c - 1) ? v * (1 - grid) : v;
        d[i] = u; d[i + 1] = u; d[i + 2] = l === 0 ? u - 5 : u; d[i + 3] = 255;
      }
    }
  }
  return d;
}

/* a disc's coverage on the pixel grid around a centre at (c/2, c/2) of a cell of c pixels, 4 x 4 samples a pixel: [size, data] */
function stamp(c: number, r: number): { R: number; cov: Float32Array } {
  const R = Math.ceil(r + 1), n = 2 * R + c, cov = new Float32Array(n * n), cx = R + c / 2, r2 = r * r;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let k = 0;
    for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) { const dx = x + (sx + 0.5) / 4 - cx, dy = y + (sy + 0.5) / 4 - cx; if (dx * dx + dy * dy <= r2) k++; }
    cov[y * n + x] = k / 16;
  }
  return { R, cov };
}

/* Halfworld's post-pass (engine/halfworld-engine.mjs dotifyField), one dot per cell: paper #fdfdfa, the lattice printed faintly
   (alpha .10), then for each cell of darkness d = level / 7 over the floor 0.20, the ink law's S-curve, and a black (#0a0a0a)
   disc of radius d^0.9 x cell x 0.62 x gain */
export function photographHalftone(m: Mosaic, c: number, gain: number): Uint8ClampedArray {
  const W = m.w * c, H = m.h * c, D = new Float32Array(W * H);
  const lay = (s: { R: number; cov: Float32Array }, cx: number, cy: number, alpha: number) => {
    const n = 2 * s.R + c, x0 = cx * c - s.R, y0 = cy * c - s.R;
    for (let y = 0; y < n; y++) {
      const Y = y0 + y; if (Y < 0 || Y >= H) continue;
      for (let x = 0; x < n; x++) {
        const X = x0 + x; if (X < 0 || X >= W) continue;
        const a = s.cov[y * n + x] * alpha; if (a <= 0) continue;
        const i = Y * W + X; D[i] = 1 - (1 - D[i]) * (1 - a);
      }
    }
  };
  const lattice = stamp(c, Math.max(0.65, c * 0.11));
  for (let cy = 0; cy < m.h; cy++) for (let cx = 0; cx < m.w; cx++) lay(lattice, cx, cy, 0.10);
  for (let l = 1; l <= 7; l++) {
    const d0 = l / 7; if (d0 < 0.2) continue;
    const r = Math.pow(inkGrade(d0), 0.9) * c * 0.62 * gain; if (r < 0.25) continue;
    const s = stamp(c, r);
    for (let cy = 0; cy < m.h; cy++) for (let cx = 0; cx < m.w; cx++) if (m.ink[cy * m.w + cx] === l) lay(s, cx, cy, 1);
  }
  const out = new Uint8ClampedArray(W * H * 4);
  for (let i = 0, j = 0; i < D.length; i++, j += 4) {
    const a = D[i];
    out[j] = 253 - 243 * a; out[j + 1] = 253 - 243 * a; out[j + 2] = 250 - 240 * a; out[j + 3] = 255;
  }
  return out;
}

/* the LEGO mosaic photographed from above: the tile grid fitted in the frame on a dark ground, the baseplate between the round
   tiles (its seams every 48 studs), each tile its LDraw colour with a lit rim on its upper left and a shaded one lower right */
export function photographLego(L: Lego, W: number, H: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(W * H * 4), p = Math.min(W / L.w, H / L.h), ox = (W - p * L.w) / 2, oy = (H - p * L.h) / 2;
  const plate = legoColor(71).rgb.map(v => v * 0.55), ground = [22, 24, 26], seam = Math.max(1, p * 0.1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const j = (y * W + x) * 4, u = (x + 0.5 - ox) / p, v = (y + 0.5 - oy) / p, inside = u >= 0 && v >= 0 && u < L.w && v < L.h;
    let col = inside ? plate : ground;
    if (inside) { const su = (u % 48) * p, sv = (v % 48) * p; if ((u >= 48 && su < seam) || (v >= 48 && sv < seam)) col = plate.map(t => t * 0.45); }
    out[j] = col[0]; out[j + 1] = col[1]; out[j + 2] = col[2]; out[j + 3] = 255;
  }
  const r = p * 0.46, S = 2;
  for (let ty = 0; ty < L.h; ty++) for (let tx = 0; tx < L.w; tx++) {
    const [R, G, B] = legoColor(L.colors[ty * L.w + tx]).rgb, cx = ox + (tx + 0.5) * p, cy = oy + (ty + 0.5) * p;
    const x0 = Math.max(0, Math.floor(cx - r - 1)), x1 = Math.min(W - 1, Math.ceil(cx + r + 1));
    const y0 = Math.max(0, Math.floor(cy - r - 1)), y1 = Math.min(H - 1, Math.ceil(cy + r + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      let k = 0, lit = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const dx = x + (sx + 0.5) / S - cx, dy = y + (sy + 0.5) / S - cy, q = Math.hypot(dx, dy);
        if (q > r) continue;
        k++;
        /* the rim: a band near the edge, lit where it faces the upper left, shaded where it faces the lower right */
        if (q > r * 0.72) lit += -(dx + dy) / (q * 1.4142 || 1);
      }
      if (!k) continue;
      const a = k / (S * S), f = 1 + 0.32 * (lit / k), j = (y * W + x) * 4;
      out[j] = out[j] * (1 - a) + Math.min(255, R * f + (f > 1 ? (f - 1) * 90 : 0)) * a;
      out[j + 1] = out[j + 1] * (1 - a) + Math.min(255, G * f + (f > 1 ? (f - 1) * 90 : 0)) * a;
      out[j + 2] = out[j + 2] * (1 - a) + Math.min(255, B * f + (f > 1 ? (f - 1) * 90 : 0)) * a;
    }
  }
  return out;
}
