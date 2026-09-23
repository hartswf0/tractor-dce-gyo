/* tools/forage/build.js — the ways a card's pieces are got, each returning a component: { name, how, source, rows } with its
   rows in its own frame, standing on y 0 (LDraw y down: its lowest underside at 0), centred on x and z, and its stud lattice
   in phase with a plate laid by the DSL (anti-studs at odd multiples of ten LDU).

   donor(key, sub, o)   a sub-build foraged from a real LDraw model: a FILE block of an MPD, flattened, minifigures stripped
   fig(spec)            a minifigure assembled from real parts on the standard skeleton, accessories held in the hand grip
                        foraged from the donors (the hand-to-item transform measured where a donor's figure holds one)
   part(id, col, o)     a readymade: one part, or a few, as it comes
   kit(program, name)   a procedural build: world/dsl.js ops (world/models/kit.js vocabulary) tiled into real bricks
   group(name, comps)   components set side by side on one footing (a herd, a crew, a shelf of props)

   card(spec) lays its components on a plate, writes the MPD with one FILE per sub-build, and audits the whole. */
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./ldraw.js');
const ROOT = L.ROOT;
require(path.join(ROOT, 'world/dsl.js')); const Dsl = global.Dsl || (global.window && global.window.Dsl);
const Model = require(path.join(ROOT, 'tools/model.js'));
const K = require(path.join(ROOT, 'world/models/kit.js'));

/* ── donors ── */
let DONOR_DIRS = [path.join(ROOT, 'ldraw/models')];
const setDonorDirs = dirs => { DONOR_DIRS = [path.join(ROOT, 'ldraw/models'), ...dirs.filter(d => d && fs.existsSync(d))]; };
const donorFileCache = new Map();
function donorFile(key) {
  if (donorFileCache.has(key)) return donorFileCache.get(key);
  let hit = null;
  for (const dir of DONOR_DIRS) { const names = fs.readdirSync(dir).filter(f => /\.mpd$/i.test(f)); const f = names.find(n => n.toLowerCase() === (key + '.mpd').toLowerCase()) || names.find(n => n.toLowerCase().startsWith(key.toLowerCase() + ' ') || n.toLowerCase().startsWith(key.toLowerCase() + '-') || n.toLowerCase().startsWith(key.toLowerCase() + '_')); if (f) { hit = path.join(dir, f); break; } }
  donorFileCache.set(key, hit); return hit;
}
const FIGURE_PART = /^(~?Minifig (Torso|Hips|Leg|Legs|Arm|Hand|Head|Hair|Helmet|Hat|Headdress|Cap|Beard|Plume|Ghost|Skeleton)|Minifig Hips and Legs|~?Animal Horse)/i;
const FIGURE_FILE = /minifig|pirate|soldier|guard|captain|johnny|horse|cavalry|knight|figure|fig\d/i;
/* A component: { name, how, source, local: rows in its own frame, subs: [{ c, M }], m }. Its rows, flattened, are m·(local ∪ M·rows(c)). */
function make(name, how, source, local, subs = [], extra = {}) { return settle({ name, how, source, local, subs, m: L.I12, ...extra }); }
function rowsOf(c, M = L.I12) { const MM = L.mul(M, c.m); return [...c.local.map(r => ({ ...r, m: L.mul(MM, r.m) })), ...c.subs.flatMap(s => rowsOf(s.c, L.mul(MM, s.M)))]; }
/** Normalise: lowest underside at y 0, centred, the bottom course's anti-studs on odd tens (the DSL plate lattice). */
function settle(c) {
  const rows = rowsOf({ ...c, m: L.I12 }); if (!rows.length) return c;
  const solid = rows.filter(r => !L.isPrimitive(r.part)), b = L.bounds(solid.length ? solid : rows);
  const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2, fy = c.floorY != null ? c.floorY : b[4];   // a donor rests on its main body, not on an anchor hanging from a rope
  const bottom = (solid.length ? solid : rows).map(r => ({ r, box: L.worldBox(r) })).filter(o => o.box && o.box[4] >= fy - 8.5);
  const phase = v => ((Math.round(v / 10) * 10) % 20 + 20) % 20;
  const vote = a => { const n = {}; for (const v of a) n[v] = (n[v] || 0) + 1; return +(Object.entries(n).sort((x, y) => y[1] - x[1])[0] || [0])[0]; };
  const px = vote(bottom.map(o => phase(o.box[0]))), pz = vote(bottom.map(o => phase(o.box[2])));
  const dx = Math.round(-cx / 20) * 20 - px, dz = Math.round(-cz / 20) * 20 - pz;   // whole studs, then the lattice brought to phase 0 at the footprint's edge
  return { ...c, m: L.T(dx, -fy, dz) };
}
function donor(key, sub, o = {}) {
  const file = donorFile(key); if (!file) return make(o.name || key, 'donor', { donor: key, sub, found: false }, [], [], { missing: [key + '.mpd'] });
  const mpd = L.readMPD(file), name = sub || mpd.main;
  if (!mpd.files.has(L.norm(name))) return make(o.name || key, 'donor', { donor: key, sub: name, found: false }, [], [], { missing: [key + ':' + name] });
  const acc = { rows: [], missing: new Set() };
  (function walk(fname, M, col, depth) {
    const f = mpd.files.get(L.norm(fname)); if (!f || depth > 16) return;
    for (const r of f.refs) {
      const MM = L.mul(M, r.m), c = r.col === 16 || r.col === 24 ? col : r.col, k = L.norm(r.ref);
      const inline = mpd.files.has(k) && /\.dat$/.test(k) && k.replace(/^(s\/)?[^/]* - /, '').replace(/\.dat$/, '');   // a part the donor defines inline ('6285 - 2551.dat'): the library's own part if it has one
      if (inline && !k.startsWith('s/') && L.exists(inline) && !L.isPrimitive(inline)) { acc.rows.push({ part: inline, col: c, m: MM }); continue; }
      if (mpd.files.has(k)) { if (o.keepFigures || !FIGURE_FILE.test(k) || depth === 0 && L.norm(name) === k) walk(k, MM, c, depth + 1); continue; }
      const id = k.replace(/\.dat$/, '').replace(/^parts\//, '');
      if (!L.exists(id)) { acc.missing.add(id); continue; }
      if (!o.keepFigures && FIGURE_PART.test(L.describe(id) || '')) continue;
      if (o.noFlex && L.isPrimitive(id)) continue;
      acc.rows.push({ part: id, col: c, m: MM });
    }
  })(name, L.I12, o.col || 7, 0);
  let rows = acc.rows;
  if (o.crop) { const [x0, z0, x1, z1] = o.crop; const b = L.bounds(rows), cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2; rows = rows.filter(r => { const x = r.m[0] - cx, z = r.m[2] - cz; return x >= x0 * 20 && x <= x1 * 20 && z >= z0 * 20 && z <= z1 * 20; }); }
  if (o.turn) rows = rows.map(r => ({ ...r, m: L.mul(L.RY(o.turn), r.m) }));
  return make(o.name || name.replace(/\.(ldr|mpd|dat)$/i, ''), 'donor', { donor: key, file: path.basename(file), sub: name, author: mpd.meta.author, license: mpd.meta.license, title: mpd.meta.title }, rows, [], { missing: [...acc.missing], floorY: rows.length ? L.audit(rows).floor : null });
}

/* ── minifigures: the skeleton of a standard figure (the donors' own numbers), accessories in the foraged grip ── */
const SKELETON = {
  hips: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], legR: [0, 12, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], legL: [0, 12, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], torso: [0, -32, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  armL: [15.552, -23, 0, 0.985, 0.17, 0, -0.17, 0.985, 0, 0, 0, 1], armR: [-15.552, -23, 0, 0.985, -0.17, 0, 0.17, 0.985, 0, 0, 0, 1],
  handR: [-23.688, -5.24, -9.884, 0.985, -0.12, 0.12, 0.17, 0.697, -0.697, 0, 0.707, 0.707], handL: [23.688, -5.24, -9.884, 0.985, -0.12, -0.12, 0.002, 0.717, -0.697, 0.17, 0.686, 0.707],
  head: [0, -56, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], cape: [0, -34, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
};
let GRIPS = null;
/** The hand-to-item transform, measured in the donors: wherever a figure's hand (3820) holds an item, inv(hand)·item. */
function grips() {
  if (GRIPS) return GRIPS; GRIPS = {};
  for (const dir of DONOR_DIRS) for (const f of fs.readdirSync(dir).filter(n => /\.mpd$/i.test(n) && !/-full/.test(n))) {
    let mpd; try { mpd = L.readMPD(path.join(dir, f)); } catch (e) { continue; }
    for (const [, blk] of mpd.files) {
      const hands = blk.refs.filter(r => /^3820\.dat$/i.test(r.ref.trim()));
      if (!hands.length) continue;
      for (const r of blk.refs) { const id = L.norm(r.ref).replace(/\.dat$/, ''); if (GRIPS[id] || !/^Minifig (Sword|Spear|Tool|Lance|Torch|Goblet|Cup|Weapon|Shield|Bow|Oar|Staff|Harpoon|Axe|Whip|Flag|Crossbow|Pitchfork|Shovel|Broom)|^Flag|^Minifig Cup|^Animal/i.test(L.describe(id) || '')) continue;
        const near = hands.map(h => ({ h, d: Math.hypot(h.m[0] - r.m[0], h.m[1] - r.m[1], h.m[2] - r.m[2]) })).sort((a, b) => a.d - b.d)[0];
        if (near && near.d < 14) GRIPS[id] = { rel: L.mul(L.inv(near.h.m), r.m), from: f }; }
    }
  }
  return GRIPS;
}
const GENERIC_GRIP = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];   // an item whose origin is its grip, axis along the hand's
function gripFor(id) { const g = grips(); if (g[id]) return g[id].rel; const like = ['3847', '4497', '3849', '2530', '3959']; for (const k of like) if (g[k]) return g[k].rel; return GENERIC_GRIP; }
const has = id => L.exists(id);
const pick = (...ids) => ids.find(has) || ids[ids.length - 1];
/** spec: { torso, top (torso and arm colour), hands, hips, legs, head, face, hat: [id, col], beard: [id, col], cape: col, R: [id, col], L: [id, col], ghost: col, troll: col, back: [id,col] } */
function fig(spec, name = 'figure') {
  const rows = [], put = (id, col, M) => { if (id && has(id)) rows.push({ part: id, col, m: M }); };
  const S = SKELETON, top = spec.top ?? 15, legs = spec.legs ?? top, skin = spec.skin ?? 14;
  if (spec.troll != null) { put('60671', spec.troll, L.I12); const tb = L.info('60671').box; if (spec.R) put(spec.R[0], spec.R[1], L.T(tb[0] - 14, tb[4] - L.info(spec.R[0]).box[4], 0)); return make(name, 'figure', { figure: 'Troll body 60671' }, rows); }
  if (spec.ghost != null) { put('2588', spec.ghost, L.T(0, -32, 0)); put(spec.face || '3626bp01', spec.ghostHead ?? 15, S.head); }
  else {
    put(pick('3815b', '3815'), spec.hips ?? legs, S.hips); put(pick('3816c', '3816b', '3816'), legs, S.legR); put(pick('3817c', '3817b', '3817'), legs, S.legL);
    put(spec.torso || '973', top, S.torso); put('3819', spec.arms ?? top, S.armL); put('3818', spec.arms ?? top, S.armR);
    put('3820', spec.hands ?? skin, S.handR); put('3820', spec.hands ?? skin, S.handL);
    put(spec.face || '3626bp01', skin, S.head);
  }
  if (spec.hat) put(spec.hat[0], spec.hat[1], S.head);
  if (spec.beard) put(spec.beard[0], spec.beard[1], S.torso);   // a beard is neckwear: it hangs from the neck, the torso's origin
  if (spec.cape != null) put('4524', spec.cape, S.cape);
  if (spec.back) put(spec.back[0], spec.back[1], L.mul(S.torso, L.T(0, 8, 12)));
  /* a pole (a staff, a spear, an oar: long along its own y, its origin at the grip) stands upright in the fist; anything else takes the foraged grip */
  const hold = (item, hand) => { const b = L.info(item[0]).box, pole = b && (b[4] - b[1]) > 3 * Math.max(b[3] - b[0], b[5] - b[2]);
    put(item[0], item[1], pole ? L.T(hand[0], Math.min(hand[1], 40 - b[4]), hand[2]) : L.mul(hand, gripFor(item[0]))); };   // a pole's foot rests at the figure's feet (y 40), never below
  if (spec.R) hold(spec.R, S.handR);
  if (spec.L) hold(spec.L, S.handL);
  return make(name, 'figure', { figure: [spec.torso || '973', spec.face || '3626bp01', spec.hat && spec.hat[0], spec.R && spec.R[0], spec.L && spec.L[0]].filter(Boolean).join(' ') }, rows);
}

/* ── readymades ── */
function part(id, col, o = {}) {
  const rows = []; if (!has(id)) return make(o.name || id, 'part', { part: id }, [], [], { missing: [id] });
  const n = o.n || 1, step = o.step || 60;
  for (let i = 0; i < n; i++) rows.push({ part: id, col, m: L.mul(L.T((i - (n - 1) / 2) * step, 0, 0), o.turn ? L.RY(o.turn) : L.I12) });
  return make(o.name || (L.describe(id) || id).replace(/^Minifig |^Animal /, '').toLowerCase(), 'part', { part: id, desc: L.describe(id) }, rows);
}
/* a few parts stacked or set out by hand, in the LDraw frame of the component */
function parts(name, list, source = {}) {
  const rows = list.filter(p => has(p[0])).map(([id, col, x = 0, y = 0, z = 0, q = 0]) => ({ part: id, col, m: L.mul(L.T(x, y, z), L.RY(q)) }));
  return make(name, 'parts', { parts: [...new Set(list.map(p => p[0]))].join(' '), ...source }, rows, [], { missing: list.filter(p => !has(p[0])).map(p => p[0]) });
}

/* ── procedural kits through the DSL tiler (the same path the film sets take) ── */
function kit(name, ops) {
  const b = Model.build({ name, title: name, description: name, program: { name, ops } });
  const rows = b.P.map(p => { const bx = Dsl.box(p.part, p.rot), h = Model.DIMS[p.part] ? Model.DIMS[p.part][4] : 24; const q = (4 - (p.rot & 3)) & 3;
    return { part: p.part, col: p.col, m: L.mul(L.T(p.x * 20 - bx[0], -(p.y * 8 + h), -(p.z * 20 - bx[2])), L.RY(q)) }; });
  return make(name, 'kit', { kit: name, dslJoints: b.sheet.joints }, rows);
}

/* ── layout ── */
const move = (c, x, y, z, q = 0) => ({ ...c, m: L.mul(L.mul(L.T(x, y, z), L.RY(q)), c.m) });
const foot = c => { const rows = rowsOf(c).filter(r => !L.isPrimitive(r.part)); const b = L.bounds(rows); return { w: Math.max(1, Math.ceil((b[3] - b[0]) / 20 - 0.05)), d: Math.max(1, Math.ceil((b[5] - b[2]) / 20 - 0.05)), h: b[4] - b[1], b }; };
const snap = v => Math.round(v / 20) * 20;
/** Components in rows, left to right, wrapping at maxW studs; returns each with its offset (whole studs) and the footprint. */
function pack(comps, o = {}) {
  const gap = o.gap ?? 1, maxW = o.maxW || Math.max(8, Math.ceil(Math.sqrt(comps.reduce((s, c) => { const f = foot(c); return s + (f.w + gap) * (f.d + gap); }, 0)) * 1.25));
  let x = 0, z = 0, rowD = 0, W = 0; const placed = [];
  for (const c of comps) { const f = foot(c); if (x > 0 && x + f.w > maxW) { x = 0; z += rowD + gap; rowD = 0; }
    placed.push({ c, x0: x, z0: z, f }); x += f.w + gap; rowD = Math.max(rowD, f.d); W = Math.max(W, x - gap); }
  const D = z + rowD;
  for (const p of placed) { p.dx = snap((p.x0 + p.f.w / 2 - W / 2) * 20 - (p.f.b[0] + p.f.b[3]) / 2); p.dz = snap((p.z0 + p.f.d / 2 - D / 2) * 20 - (p.f.b[2] + p.f.b[5]) / 2); }
  return { placed, W, D };
}
/** Components set side by side on one footing: each a sub-build of the group. */
function group(name, comps, o = {}) {
  const { placed } = pack(comps.filter(c => rowsOf(c).length), o);
  return make(name, 'group', { group: comps.length }, [], placed.map(p => ({ c: p.c, M: L.T(p.dx, 0, p.dz) })));
}
/** Components at given stud offsets (x, z, turn) on one footing. */
function at(name, list, extra = {}) { return make(name, 'group', { group: list.length }, [], list.filter(([c]) => rowsOf(c).length).map(([c, x, z, q = 0, y = 0]) => ({ c, M: L.mul(L.T(x * 20, y, z * 20), L.RY(q)) })), extra); }   // x, z in studs; q quarter turns; y in LDU (negative is up)

module.exports = { setDonorDirs, donorFile, donor, fig, part, parts, kit, group, at, pack, move, foot, settle, make, rowsOf, grips, gripFor, has, pick, K, Dsl, Model, SKELETON };
