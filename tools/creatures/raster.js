/* tools/creatures/raster.js — a small software renderer for the creature test films: z-buffered flat-shaded triangles, LDraw's
   edge lines, a ground plane with the shadows the sun casts on it. CPU only, deterministic (the same frame at t twice is the same
   bytes), so it runs headless beside the other agents' browsers and never needs a GPU.

     const R = require('./raster');
     const img = R.render({ W: 640, H: 360, ss: 2, cam: { pos: [x, y, z], at: [x, y, z], fov: 38 }, sun: [dx, dy, dz],
                            meshes: [{ tri, tc, seg, sc }], ground: { y: 0, size: 2000, tile: 80 }, bg: [r, g, b] })
     img: { W, H, rgb: Buffer }      (world frame: LDraw, y down; meshes already placed in it)
     R.ppm(img) -> Buffer (P6), R.sheet([img...], cols) -> img (a contact sheet), R.label(img, text) (a caption strip, 5x7 font) */
'use strict';
const ld = require('./ld');
const colour = c => (c < 0 ? ld.edge(-c - 1) : c === 24 ? [40, 40, 40] : ld.rgb(c));
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function nrm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

function render(o) {
  const ss = o.ss || 2, W = o.W * ss, H = o.H * ss, N = W * H;
  const rgb = new Float32Array(N * 3), z = new Float32Array(N), id = new Uint8Array(N);   // z holds 1/depth (0: far)
  const bg = o.bg || [214, 222, 230], bg2 = o.bg2 || [238, 236, 228];
  for (let y = 0; y < H; y++) { const u = y / H; for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; for (let k = 0; k < 3; k++) rgb[i + k] = bg[k] + (bg2[k] - bg[k]) * u; } }
  const cp = o.cam.pos, f = nrm(sub(o.cam.at, cp)), r = nrm(cross(f, [0, -1, 0])), u = cross(r, f);
  const foc = (H / 2) / Math.tan((o.cam.fov || 38) * Math.PI / 360), near = 1;
  const sun = nrm(o.sun || [-0.45, 1, -0.6]);   // the direction the light travels (down: +y)
  const proj = (x, y, zz) => { const d = [x - cp[0], y - cp[1], zz - cp[2]], cz = dot(d, f); return [W / 2 + dot(d, r) / cz * foc, H / 2 - dot(d, u) / cz * foc, cz]; };
  /* one triangle into the buffers: flat colour c (0..255 floats), tag t in the id buffer; mode 1: shadow (only darkens ground) */
  function tri(a, b, c, col, tag, mode) {
    if (a[2] < near || b[2] < near || c[2] < near) return;
    const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    if (x0 > x1 || y0 > y1) return;
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); if (Math.abs(area) < 1e-9) return;
    const ia = 1 / a[2], ib = 1 / b[2], ic = 1 / c[2];
    for (let y = y0; y <= y1; y++) { const py = y + 0.5;
      for (let x = x0; x <= x1; x++) { const px = x + 0.5;
        let w0 = (b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px), w1 = (c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px), w2 = (a[0] - px) * (b[1] - py) - (a[1] - py) * (b[0] - px);
        if (area < 0) { w0 = -w0; w1 = -w1; w2 = -w2; }
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const s = w0 + w1 + w2, iz = (w0 * ia + w1 * ib + w2 * ic) / s, p = y * W + x;
        if (mode === 1) { if (id[p] === 1 && tag !== 2) { id[p] = 3; } continue; }
        if (iz <= z[p]) continue;
        z[p] = iz; id[p] = tag; rgb[p * 3] = col[0]; rgb[p * 3 + 1] = col[1]; rgb[p * 3 + 2] = col[2];
      } }
  }
  function line(a, b, col) {
    if (a[2] < near || b[2] < near) return;
    const n = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))) + 1; if (n > 4000) return;
    for (let i = 0; i <= n; i++) { const t = i / n, x = Math.floor(a[0] + (b[0] - a[0]) * t), y = Math.floor(a[1] + (b[1] - a[1]) * t); if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const inv = 1 / a[2] + (1 / b[2] - 1 / a[2]) * t, p = y * W + x; if (inv < z[p] * 0.985) continue;   // drawn just over the faces it bounds
      rgb[p * 3] = col[0]; rgb[p * 3 + 1] = col[1]; rgb[p * 3 + 2] = col[2]; }
  }
  /* the ground: tiles in two tones, then the shadows on it */
  if (o.ground) { const G = o.ground, gy = G.y || 0, S = G.size || 2000, T = G.tile || 80, c0 = G.c0 || [196, 186, 160], c1 = G.c1 || [186, 176, 150], cx = G.cx || 0, cz = G.cz || 0;
    const shade = Math.max(0.25, -sun[1]) * 0.35 + 0.72;
    for (let gx = -S; gx < S; gx += T) for (let gz = -S; gz < S; gz += T) { const cc = ((Math.floor(gx / T) + Math.floor(gz / T)) & 1 ? c0 : c1).map(v => v * shade);
      const A = proj(cx + gx, gy, cz + gz), B = proj(cx + gx + T, gy, cz + gz), C = proj(cx + gx + T, gy, cz + gz + T), D = proj(cx + gx, gy, cz + gz + T);
      tri(A, B, C, cc, 1, 0); tri(A, C, D, cc, 1, 0); }
    for (const m of o.meshes) { const t = m.tri; if (m.noShadow) continue;
      for (let i = 0; i < t.length; i += 9) { const P = []; for (let k = 0; k < 3; k++) { const x = t[i + 3 * k], y = t[i + 3 * k + 1], zz = t[i + 3 * k + 2], s = (gy - y) / sun[1]; P.push(proj(x + sun[0] * s, gy, zz + sun[2] * s)); } tri(P[0], P[1], P[2], null, 0, 1); } }
    for (let p = 0; p < N; p++) if (id[p] === 3) { rgb[p * 3] *= 0.62; rgb[p * 3 + 1] *= 0.62; rgb[p * 3 + 2] *= 0.66; id[p] = 1; }
  }
  const view = f;
  for (const m of o.meshes) { const t = m.tri, tag = m.tag || 2;
    for (let i = 0, j = 0; i < t.length; i += 9, j++) {
      const A = [t[i], t[i + 1], t[i + 2]], B = [t[i + 3], t[i + 4], t[i + 5]], C = [t[i + 6], t[i + 7], t[i + 8]];
      let n = nrm(cross(sub(B, A), sub(C, A))); if (dot(n, view) > 0) n = [-n[0], -n[1], -n[2]];
      const base = m.tint ? m.tint : colour(m.tc[j]); const di = Math.max(0, -dot(n, sun)), sh = 0.42 + 0.62 * di + 0.12 * Math.max(0, -n[1]);
      tri(proj(...A), proj(...B), proj(...C), [base[0] * sh, base[1] * sh, base[2] * sh], tag, 0);
    }
    if (m.seg && o.lines !== false) { const s = m.seg; for (let i = 0, j = 0; i < s.length; i += 6, j++) { const c = m.sc[j]; const col = c === 24 || c < 0 ? [30, 30, 32] : colour(c).map(v => v * 0.35); line(proj(s[i], s[i + 1], s[i + 2]), proj(s[i + 3], s[i + 4], s[i + 5]), col); } }
  }
  /* markers: small crosses for contacts and targets, drawn on top */
  for (const mk of o.marks || []) { const p = proj(...mk.p); if (p[2] < near) continue; const R = (mk.r || 5) * ss, col = mk.c || [220, 40, 40];
    for (let d = -R; d <= R; d++) for (const [x, y] of [[p[0] + d, p[1]], [p[0], p[1] + d]]) { const xi = Math.floor(x), yi = Math.floor(y); if (xi < 0 || yi < 0 || xi >= W || yi >= H) continue; const q = (yi * W + xi) * 3; rgb[q] = col[0]; rgb[q + 1] = col[1]; rgb[q + 2] = col[2]; } }
  /* down to size: a box filter over the supersamples */
  const out = Buffer.alloc(o.W * o.H * 3);
  for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) { const s = [0, 0, 0];
    for (let dy = 0; dy < ss; dy++) for (let dx = 0; dx < ss; dx++) { const q = ((y * ss + dy) * W + x * ss + dx) * 3; s[0] += rgb[q]; s[1] += rgb[q + 1]; s[2] += rgb[q + 2]; }
    const q = (y * o.W + x) * 3, k = ss * ss; out[q] = Math.min(255, s[0] / k); out[q + 1] = Math.min(255, s[1] / k); out[q + 2] = Math.min(255, s[2] / k); }
  return { W: o.W, H: o.H, rgb: out, project: (p) => { const q = proj(...p); return [q[0] / ss, q[1] / ss, q[2]]; } };
}
const ppm = img => Buffer.concat([Buffer.from(`P6\n${img.W} ${img.H}\n255\n`), img.rgb]);
/* a 5x7 font for captions (upper case, digits, a few marks) */
const FONT = { A: '0e11111f111111', B: '1e11111e11111e', C: '0e11101010110e', D: '1e11111111111e', E: '1f10101e10101f', F: '1f10101e101010', G: '0e11101713110f', H: '1111111f111111', I: '0e04040404040e', J: '0702020212120c', K: '11121418141211', L: '1010101010101f', M: '111b1515111111', N: '11191513111111', O: '0e11111111110e', P: '1e11111e101010', Q: '0e111111151209', R: '1e11111e141211', S: '0f10100e01011e', T: '1f040404040404', U: '1111111111110e', V: '11111111110a04', W: '11111115151b11', X: '11110a040a1111', Y: '11110a04040404', Z: '1f01020408101f', '0': '0e11131519110e', '1': '040c040404040e', '2': '0e11010204081f', '3': '1f020402010e00', '4': '02060a121f0202', '5': '1f101e0101110e', '6': '06081e1111110e', '7': '1f010204080808', '8': '0e11110e11110e', '9': '0e11110f01020c', '.': '0000000000000c', ':': '000c0c000c0c00', '-': '0000001f000000', ' ': '00000000000000', '/': '01010204081010', '(': '02040808080402', ')': '08040202020408', ',': '00000000000c08', '=': '00001f001f0000' };
function label(img, text, { scale = 2, fg = [30, 30, 30], bgc = [250, 248, 240], h = 22 } = {}) {
  const W = img.W, out = Buffer.alloc(W * (img.H + h) * 3); img.rgb.copy(out, 0);
  for (let p = img.W * img.H * 3; p < out.length; p += 3) { out[p] = bgc[0]; out[p + 1] = bgc[1]; out[p + 2] = bgc[2]; }
  let cx = 6; for (const ch of String(text).toUpperCase()) { const g = FONT[ch] || FONT[' '];
    for (let row = 0; row < 7; row++) { const bits = parseInt(g.slice(row * 2, row * 2 + 2), 16); for (let col = 0; col < 5; col++) if (bits & (16 >> col))
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) { const x = cx + col * scale + dx, y = img.H + 4 + row * scale + dy; if (x < W && y < img.H + h) { const q = (y * W + x) * 3; out[q] = fg[0]; out[q + 1] = fg[1]; out[q + 2] = fg[2]; } } }
    cx += 6 * scale; if (cx > W - 6 * scale) break; }
  return { W, H: img.H + h, rgb: out };
}
function sheet(imgs, cols) {
  const w = imgs[0].W, h = imgs[0].H, rows = Math.ceil(imgs.length / cols), W = w * cols + (cols + 1) * 4, H = h * rows + (rows + 1) * 4, out = Buffer.alloc(W * H * 3, 70);
  imgs.forEach((im, i) => { const ox = 4 + (i % cols) * (w + 4), oy = 4 + Math.floor(i / cols) * (h + 4); for (let y = 0; y < h; y++) im.rgb.copy(out, ((oy + y) * W + ox) * 3, y * w * 3, (y + 1) * w * 3); });
  return { W, H, rgb: out };
}
module.exports = { render, ppm, sheet, label };
