/* tools/forage/ldraw.js — the LDraw side of the Odyssey forage: resolve a part in this repository's library, measure it
   (its box in its own frame, the studs on it), read a donor MPD into its FILE blocks, flatten a sub-build into placed
   parts, and hold a placed build to account: every stud of every piece tested against the undersides above it, every
   piece traced to the ground through stud joints or, failing that, through contact (a clip, a hinge, a hand), and the
   pieces that touch nothing named as floating.

   Rows are placed parts in the LDraw frame (y down): { part, col, m: [x y z a b c d e f g h i] }, the part id bare and
   lower case ('3001', 's/3001s01' never appears: subfiles stay inside their part). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), LIB = path.join(ROOT, 'ldraw');

/* ── matrices: 12 numbers, x y z then the 3×3 row-major ── */
const I12 = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
function mul(A, B) {   // A·B: B's frame placed in A's
  const [ax, ay, az, a, b, c, d, e, f, g, h, i] = A, [bx, by, bz, A2, B2, C2, D2, E2, F2, G2, H2, I2] = B;
  return [ax + a * bx + b * by + c * bz, ay + d * bx + e * by + f * bz, az + g * bx + h * by + i * bz,
    a * A2 + b * D2 + c * G2, a * B2 + b * E2 + c * H2, a * C2 + b * F2 + c * I2,
    d * A2 + e * D2 + f * G2, d * B2 + e * E2 + f * H2, d * C2 + e * F2 + f * I2,
    g * A2 + h * D2 + i * G2, g * B2 + h * E2 + i * H2, g * C2 + h * F2 + i * I2];
}
const apply = (M, x, y, z) => [M[0] + M[3] * x + M[4] * y + M[5] * z, M[1] + M[6] * x + M[7] * y + M[8] * z, M[2] + M[9] * x + M[10] * y + M[11] * z];
const T = (x, y, z) => [x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1];
const RY = q => { const c = [1, 0, -1, 0][q & 3], s = [0, 1, 0, -1][q & 3]; return [0, 0, 0, c, 0, s, 0, 1, 0, -s, 0, c]; };   // a quarter turn about y
function inv(M) {   // rigid inverse (rotation transposed); LDraw part matrices here are rotations, mirrors at most
  const [x, y, z, a, b, c, d, e, f, g, h, i] = M, R = [a, d, g, b, e, h, c, f, i];
  return [-(R[0] * x + R[1] * y + R[2] * z), -(R[3] * x + R[4] * y + R[5] * z), -(R[6] * x + R[7] * y + R[8] * z), ...R];
}
const fmt = v => { const r = Math.round(v * 1000) / 1000; return (Object.is(r, -0) ? 0 : r).toString(); };
const lineOf = r => `1 ${r.col} ${r.m.map(fmt).join(' ')} ${r.part}.dat`;

/* ── the library ── */
const norm = s => s.trim().replace(/\\/g, '/').toLowerCase();
function fileFor(ref) {
  const id = norm(ref).replace(/\.dat$/, '');
  const tries = id.startsWith('s/') ? [['parts', id]] : id.startsWith('48/') || id.startsWith('8/') ? [['p', id]] : [['parts', id], ['p', id], ['parts', 's/' + id]];
  for (const [dir, rel] of tries) { const f = path.join(LIB, dir, rel + '.dat'); if (fs.existsSync(f)) return f; }
  return null;
}
const descCache = new Map();
function describe(id) {
  if (descCache.has(id)) return descCache.get(id);
  const f = fileFor(id); let d = null;
  if (f) { const first = fs.readFileSync(f, 'utf8').split(/\r?\n/, 1)[0] || ''; d = first.replace(/^0\s*/, '').trim(); }
  descCache.set(id, d); return d;
}
const exists = id => !!fileFor(id);
/** A primitive placed as a part (the rope and hose segments of flexible elements): it lives in p/, not parts/. */
const isPrimitive = id => { const f = fileFor(id); return !!f && path.relative(LIB, f).split(path.sep)[0] === 'p'; };
/* studs: the primitives that stand up from a top surface, origin at the surface */
const STUD_RE = /^(stud|stud2|stud2a|stud6|stud6a|stud10|stud13|stud15|stud17a|stud-logo\d*|stud2-logo\d*|studa|studel|studline)\.dat$/;
const infoCache = new Map();
/** A part's measure in its own frame: { ok, missing: [refs], box: [x0,y0,z0,x1,y1,z1] | null, studs: [[x,y,z]] }. */
function info(ref, depth = 0) {
  const id = norm(ref).replace(/\.dat$/, '');
  if (infoCache.has(id)) return infoCache.get(id);
  const out = { ok: true, missing: [], box: null, studs: [] }; infoCache.set(id, out);
  const f = fileFor(id); if (!f) { out.ok = false; out.missing.push(id); return out; }
  const grow = (x, y, z) => { const b = out.box; if (!b) out.box = [x, y, z, x, y, z]; else { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (z < b[2]) b[2] = z; if (x > b[3]) b[3] = x; if (y > b[4]) b[4] = y; if (z > b[5]) b[5] = z; } };
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const t = l.trim().split(/\s+/); const k = t[0];
    if (k === '1' && t.length >= 15) {
      const M = t.slice(2, 14).map(Number), sub = t.slice(14).join(' '), subId = norm(sub);
      if (STUD_RE.test(subId.replace(/^.*\//, ''))) out.studs.push([M[0], M[1], M[2]]);
      if (depth > 12) continue;
      const s = info(sub, depth + 1); if (!s.ok) { out.ok = false; out.missing.push(...s.missing); }
      if (s.box) { const b = s.box; for (const x of [b[0], b[3]]) for (const y of [b[1], b[4]]) for (const z of [b[2], b[5]]) grow(...apply(M, x, y, z)); }
      for (const st of s.studs) out.studs.push(apply(M, ...st));
    } else if (k === '2' || k === '3' || k === '4') {
      const n = +k; for (let i = 0; i < n; i++) grow(+t[2 + i * 3], +t[3 + i * 3], +t[4 + i * 3]);
    }
  }
  out.missing = [...new Set(out.missing)];
  return out;
}

/* ── donors: an MPD read into its FILE blocks ── */
const mpdCache = new Map();
function readMPD(file) {
  if (mpdCache.has(file)) return mpdCache.get(file);
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
  const files = new Map(); let cur = null, order = [];
  const open = name => { cur = { name, key: norm(name), header: [], refs: [] }; files.set(cur.key, cur); order.push(cur.key); };
  for (const l of text.split('\n')) {
    const fm = l.match(/^0\s+FILE\s+(.+?)\s*$/i); if (fm) { open(fm[1]); continue; }
    if (/^0\s+NOFILE/i.test(l)) { cur = null; continue; }
    if (!cur) { if (!order.length) open(path.basename(file)); else continue; }
    const t = l.trim().split(/\s+/);
    if (t[0] === '1' && t.length >= 15) cur.refs.push({ col: +t[1], m: t.slice(2, 14).map(Number), ref: t.slice(14).join(' ') });
    else if (t[0] === '0' && cur.refs.length === 0) cur.header.push(l.trim());
  }
  const head = files.get(order[0]) || { header: [] };
  const meta = { author: ((head.header.find(h => /^0\s+Author:/i.test(h)) || '').replace(/^0\s+Author:\s*/i, '')) || null, license: ((head.header.find(h => /^0\s+!LICENSE/i.test(h)) || '').replace(/^0\s+!LICENSE\s*/i, '')) || null, title: (head.header[0] || '').replace(/^0\s*/, '') };
  const out = { file, files, main: order[0], order, meta }; mpdCache.set(file, out); return out;
}
/** A sub-build flattened to placed parts in its own frame; colour 16 inherits; submodels in the MPD recurse; parts must be in the library. */
function flatten(mpd, name, M = I12, col = 16, depth = 0, acc = { rows: [], missing: new Set(), path: [] }) {
  const f = mpd.files.get(norm(name)); if (!f || depth > 16) return acc;
  for (const r of f.refs) {
    const MM = mul(M, r.m), c = r.col === 16 ? col : r.col === 24 ? col : r.col, key = norm(r.ref);
    if (mpd.files.has(key)) { flatten(mpd, key, MM, c, depth + 1, acc); continue; }
    const id = key.replace(/\.dat$/, '').replace(/^parts\//, '');
    if (!exists(id)) { acc.missing.add(id); continue; }
    acc.rows.push({ part: id, col: c, m: MM });
  }
  return acc;
}

/* ── a placed build measured ── */
function worldBox(r) {
  const i = info(r.part); if (!i.box) return null; const b = i.box, out = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const x of [b[0], b[3]]) for (const y of [b[1], b[4]]) for (const z of [b[2], b[5]]) { const p = apply(r.m, x, y, z); for (let k = 0; k < 3; k++) { if (p[k] < out[k]) out[k] = p[k]; if (p[k] > out[k + 3]) out[k + 3] = p[k]; } }
  return out;
}
function bounds(rows) {
  const out = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const r of rows) { const b = r.box || worldBox(r); if (!b) continue; for (let k = 0; k < 3; k++) { if (b[k] < out[k]) out[k] = b[k]; if (b[k + 3] > out[k + 3]) out[k + 3] = b[k + 3]; } }
  return out[0] === Infinity ? [0, 0, 0, 0, 0, 0] : out;
}
/** Stud joints and support. A joint: a stud's top point on another piece's underside (its box bottom within 1.5 LDU) and inside its
    footprint. Ground: the pieces whose bottom is the build's bottom. Support runs through joints; a piece reached only through
    contact (boxes touching) is held by something other than a stud (a clip, a bar in a hand, a hinge); a piece touching nothing is floating. */
function audit(rows) {
  const flex = rows.filter(r => isPrimitive(r.part)).length;
  const P = rows.map((r, i) => ({ i, r, flex: isPrimitive(r.part), box: worldBox(r), studs: isPrimitive(r.part) ? [] : info(r.part).studs.map(s => apply(r.m, ...s)) })).filter(p => p.box);   // rope and hose segments carry contact (a sail on its rope) but are not counted as pieces
  if (!P.length) return { pieces: 0, joints: 0, anchored: 0, held: 0, floating: [], heldIdx: [], floor: 0, flex };
  const floor = Math.max(...P.map(p => p.box[4]));
  const cell = 40, key = (x, z) => Math.floor(x / cell) + ',' + Math.floor(z / cell), grid = new Map();
  for (const p of P) for (let gx = Math.floor(p.box[0] / cell); gx <= Math.floor(p.box[3] / cell); gx++) for (let gz = Math.floor(p.box[2] / cell); gz <= Math.floor(p.box[5] / cell); gz++) { const k = gx + ',' + gz; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(p); }
  const links = P.map(() => new Set()), touch = P.map(() => new Set()); let joints = 0; const idx = new Map(P.map((p, k) => [p, k]));
  for (const p of P) for (const s of p.studs) {
    for (const q of grid.get(key(s[0], s[2])) || []) { if (q === p) continue; const b = q.box;
      if (Math.abs(b[4] - s[1]) > 1.5 || s[0] < b[0] + 2 || s[0] > b[3] - 2 || s[2] < b[2] + 2 || s[2] > b[5] - 2) continue;
      joints++; links[idx.get(p)].add(idx.get(q)); links[idx.get(q)].add(idx.get(p)); break; }
  }
  const e = 1.5;
  for (const [, list] of grid) for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) { const A = list[a].box, B = list[b].box;
    if (A[0] - e <= B[3] && B[0] - e <= A[3] && A[1] - e <= B[4] && B[1] - e <= A[4] && A[2] - e <= B[5] && B[2] - e <= A[5]) { const i = idx.get(list[a]), j = idx.get(list[b]); touch[i].add(j); touch[j].add(i); } }
  /* the build is the largest body of pieces held together by joints or contact; its ground is its own bottom course */
  const comp = new Array(P.length).fill(-1); let best = -1, bestN = 0; const lowest = Math.max(...P.filter(p => !p.flex).map(p => p.box[4]));
  for (let k = 0, c = 0; k < P.length; k++) { if (comp[k] >= 0) continue; const q = [k]; comp[k] = c; let n = 0, grounded = false; while (q.length) { const x = q.pop(); n++; if (!P[x].flex && P[x].box[4] >= lowest - 8.5) grounded = true; for (const y of [...links[x], ...touch[x]]) if (comp[y] < 0) { comp[y] = c; q.push(y); } } const score = n + (grounded ? 1e6 : 0); if (score > bestN) { bestN = score; best = c; } c++; }   // the build is the largest body that stands on the ground
  const mainFloor = Math.max(...P.filter((p, k) => comp[k] === best && !p.flex).map(p => p.box[4]));
  const ground = P.map((p, k) => comp[k] === best && !p.flex && p.box[4] >= mainFloor - 8.5);   // the bottom course: whatever stands within a plate of the lowest underside
  const byStud = new Set(), q = []; P.forEach((p, k) => { if (ground[k]) { byStud.add(k); q.push(k); } }); while (q.length) { const k = q.pop(); for (const n of links[k]) if (!byStud.has(n)) { byStud.add(n); q.push(n); } }
  const floating = P.filter((p, k) => !p.flex && comp[k] !== best).map(p => p.i), held = P.filter((p, k) => !p.flex && comp[k] === best && !byStud.has(k)).map(p => p.i);
  return { pieces: P.filter(p => !p.flex).length, joints, anchored: [...byStud].filter(k => !P[k].flex).length, held: held.length, floating, heldIdx: held, floor: mainFloor, flex };
}

module.exports = { ROOT, LIB, I12, mul, apply, T, RY, inv, fmt, lineOf, norm, fileFor, exists, isPrimitive, describe, info, readMPD, flatten, worldBox, bounds, audit };
