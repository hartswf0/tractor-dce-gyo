/* tools/creatures/ld.js — LDraw geometry for the creature tools: a part (or an MPD's sub-file) flattened to coloured triangles and
   edge lines in its own frame, read from this repository's library (ldraw/), and the colour table (LDConfig.ldr).

     const ld = require('./ld');
     ld.flat('95341', 15)            -> { tri: Float32Array (9 per triangle), tc: [colour per triangle], seg: Float32Array (6 per line), sc: [...] }
     ld.flat(name, col, files)       files: Map of MPD sub-files (lower-case name -> lines) searched before the library
     ld.rgb(colour)                  -> [r, g, b] 0..255 (LDConfig's VALUE), ld.edge(colour) its EDGE
   Colour 16 inherits the colour of the reference; 24 is the edge colour of the reference. Units LDU, y down. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), LIB = path.join(ROOT, 'ldraw');
const norm = s => s.trim().replace(/\\/g, '/').toLowerCase();
const fileCache = new Map();
function libLines(ref) {
  const id = norm(ref).replace(/\.dat$/, '');
  if (fileCache.has(id)) return fileCache.get(id);
  const tries = id.startsWith('s/') ? [['parts', id]] : id.startsWith('48/') || id.startsWith('8/') ? [['p', id]] : [['parts', id], ['p', id], ['parts', 's/' + id]];
  let out = null;
  for (const [d, rel] of tries) { const f = path.join(LIB, d, rel + '.dat'); if (fs.existsSync(f)) { out = fs.readFileSync(f, 'utf8').split(/\r?\n/); break; } }
  fileCache.set(id, out); return out;
}
/* the colour table */
let COL = null;
function table() {
  if (COL) return COL; COL = new Map();
  for (const l of fs.readFileSync(path.join(LIB, 'LDConfig.ldr'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/CODE\s+(\d+)\s+VALUE\s+#([0-9A-Fa-f]{6})\s+EDGE\s+#?([0-9A-Fa-f]{6}|\d+)/); if (!m) continue;
    const h = s => [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
    COL.set(+m[1], { v: h(m[2]), e: /^[0-9A-Fa-f]{6}$/.test(m[3]) && m[3].length === 6 ? h(m[3]) : [40, 40, 40] });
  }
  return COL;
}
const rgb = c => (table().get(c) || { v: [160, 160, 160] }).v;
const edge = c => (table().get(c) || { e: [40, 40, 40] }).e;
function mul(A, B) {   // [x y z a b c d e f g h i]
  const [ax, ay, az, a, b, c, d, e, f, g, h, i] = A, [bx, by, bz, A2, B2, C2, D2, E2, F2, G2, H2, I2] = B;
  return [ax + a * bx + b * by + c * bz, ay + d * bx + e * by + f * bz, az + g * bx + h * by + i * bz,
    a * A2 + b * D2 + c * G2, a * B2 + b * E2 + c * H2, a * C2 + b * F2 + c * I2, d * A2 + e * D2 + f * G2, d * B2 + e * E2 + f * H2, d * C2 + e * F2 + f * I2,
    g * A2 + h * D2 + i * G2, g * B2 + h * E2 + i * H2, g * C2 + h * F2 + i * I2];
}
const I12 = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
const flatCache = new Map();
/* the geometry of a file in its own frame, colours resolved against `col` (16 kept as 16 when col is 16) */
function flat(name, col = 16, files = null) {
  const key = norm(name) + '|' + col + (files ? '|mpd' : '');
  if (!files && flatCache.has(key)) return flatCache.get(key);
  const tri = [], tc = [], seg = [], sc = [];
  (function walk(nm, M, c, depth) {
    const k = norm(nm), lines = (files && files.get(k.replace(/\.dat$/, '')) ) || (files && files.get(k)) || libLines(nm);
    if (!lines) { if (depth === 0) throw new Error('no such part ' + nm); return; }
    const P = (x, y, z) => [M[0] + M[3] * x + M[4] * y + M[5] * z, M[1] + M[6] * x + M[7] * y + M[8] * z, M[2] + M[9] * x + M[10] * y + M[11] * z];
    for (const l of lines) {
      const t = l.trim().split(/\s+/); if (!t[0] || t[0] === '0') continue;
      const lc = +t[1], cc = lc === 16 ? c : lc === 24 ? (c === 16 ? 24 : -c - 1) : lc;   // -c-1: the edge colour of c
      if (t[0] === '1' && t.length >= 15) { if (depth > 20) continue; walk(t.slice(14).join(' '), mul(M, t.slice(2, 14).map(Number)), cc, depth + 1); continue; }
      const v = t.slice(2).map(Number);
      if (t[0] === '3') { tri.push(...P(v[0], v[1], v[2]), ...P(v[3], v[4], v[5]), ...P(v[6], v[7], v[8])); tc.push(cc); }
      else if (t[0] === '4') { const a = P(v[0], v[1], v[2]), b = P(v[3], v[4], v[5]), d = P(v[6], v[7], v[8]), e = P(v[9], v[10], v[11]); tri.push(...a, ...b, ...d, ...a, ...d, ...e); tc.push(cc, cc); }
      else if (t[0] === '2') { seg.push(...P(v[0], v[1], v[2]), ...P(v[3], v[4], v[5])); sc.push(cc); }
    }
  })(name, I12, col, 0);
  const out = { tri: Float32Array.from(tri), tc, seg: Float32Array.from(seg), sc };
  if (!files) flatCache.set(key, out);
  return out;
}
/* an MPD's text read into its sub-files: Map lower-case name (no .dat/.ldr kept both ways) -> lines */
function mpdFiles(text) {
  const files = new Map(); let cur = null;
  for (const l of text.replace(/\r\n?/g, '\n').split('\n')) {
    const m = l.match(/^0\s+FILE\s+(.+?)\s*$/i); if (m) { cur = []; const n = norm(m[1]); files.set(n, cur); files.set(n.replace(/\.(dat|ldr)$/, ''), cur); continue; }
    if (cur) cur.push(l);
  }
  return files;
}
module.exports = { flat, rgb, edge, mul, I12, mpdFiles, libLines, norm, ROOT, LIB };
