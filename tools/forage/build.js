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
    put(spec.torso || '973', top, S.torso);
    for (const side of ['R', 'L']) { const ps = poseFor(side, spec[side]); put(side === 'R' ? '3818' : '3819', spec.arms ?? top, ps.arm); put('3820', spec.hands ?? skin, ps.hand); if (spec[side]) put(spec[side][0], spec[side][1], ps.item); }
    put(spec.face || '3626bp01', skin, S.head);
  }
  if (spec.hat) put(spec.hat[0], spec.hat[1], S.head);
  if (spec.beard) put(spec.beard[0], spec.beard[1], S.torso);   // a beard is neckwear: it hangs from the neck, the torso's origin
  if (spec.cape != null) put('4524', spec.cape, S.cape);
  if (spec.back) put(spec.back[0], spec.back[1], L.mul(S.torso, L.T(0, 8, 12)));

  /* clipping: a held item's box against the body's parts (the holding hand and arm aside), a stud's fifth of slack */
  let clip = 0; const body = rows.filter(r => /^(3815|3816|3817|973|3626|2588)/.test(r.part)).map(r => L.worldBox(r)), held = rows.filter(r => spec.R && r.part === spec.R[0] || spec.L && r.part === spec.L[0]);
  for (const h of held) { const a = L.worldBox(h); if (!a || L.info(h.part).box && SHIELD.test(h.part)) continue; for (const b of body) if (b && a[0] < b[3] - 4 && b[0] < a[3] - 4 && a[1] < b[4] - 4 && b[1] < a[4] - 4 && a[2] < b[5] - 4 && b[2] < a[5] - 4) { clip++; break; } }
  return make(name, 'figure', { clip, figure: [spec.torso || '973', spec.face || '3626bp01', spec.hat && spec.hat[0], spec.R && spec.R[0], spec.L && spec.L[0]].filter(Boolean).join(' ') }, rows);
}

/* ── holding: the grip, measured ──
   The hand's grip is a C whose centre is (0, -0.8229, -9.8948) in the hand's frame (the part's own note) and whose axis is the
   hand's y tipped 14.5 degrees toward z: (0, 0.97, 0.25). Every donor figure that holds a sword, a whip, a bow or a spear has
   its item there, the item's y along that axis (tools/forage/build.js grips() measures it). An item is mounted on that axis,
   slid along it only as far as it still passes through the fist. A long pole is held upright: the arm swings up at the
   shoulder and the hand turns on its wrist peg (the hand's z) until the grip axis is vertical, and the pole slides down to
   rest a stud above the ground. A shield takes the grip a donor's figure shows for a shield. */
const GRIP = L.mul(L.T(0, -0.8229, -9.8948), [0, 0, 0, 1, 0, 0, 0, 0.9684, -0.2493, 0, 0.2493, 0.9684]);
const RX = a => { const c = Math.cos(a), s = Math.sin(a); return [0, 0, 0, 1, 0, 0, 0, c, -s, 0, s, c]; };
const RZ = a => { const c = Math.cos(a), s = Math.sin(a); return [0, 0, 0, c, -s, 0, s, c, 0, 0, 0, 1]; };
const axisOf = M => [M[4], M[7], M[10]];   // where a frame's y points
const poseCache = {};
function uprightPose(side, spread = 0) {
  const key = side + spread; if (poseCache[key]) return poseCache[key];
  const arm0 = side === 'R' ? SKELETON.armR : SKELETON.armL, hand0 = side === 'R' ? SKELETON.handR : SKELETON.handL, rel = L.mul(L.inv(arm0), hand0);
  const out = RZ((side === 'R' ? 1 : -1) * spread);   // the arm swung out from the body at the shoulder
  let best = null;
  for (let a = 0; a >= -1.75; a -= 0.035) for (let f = -Math.PI; f < Math.PI; f += 0.035) {
    const arm = L.mul(L.mul(arm0, out), RX(a)), hand = L.mul(L.mul(arm, rel), RZ(f)), g = axisOf(L.mul(hand, GRIP));
    const err = Math.acos(Math.max(-1, Math.min(1, g[1]))) + 0.15 * Math.abs(a);   // grip axis straight down the LDraw y (upright), the arm raised no more than it must be
    if (!best || err < best.err) best = { err, arm, hand };
  }
  return (poseCache[key] = best);
}
/* the body a held thing must not pass through: hips, legs, torso, head at the skeleton */
let BODY = null;
const bodyBoxes = () => BODY || (BODY = [['3815b', SKELETON.hips], ['3816c', SKELETON.legR], ['3817c', SKELETON.legL], ['973', SKELETON.torso], ['3626b', SKELETON.head]].filter(([id]) => has(id)).map(([id, m]) => L.worldBox({ part: id, m }))
  .concat([(() => { const h = L.worldBox({ part: '3626b', m: SKELETON.head }); return [h[0] - 2, h[1] - 6, h[2] - 40, h[3] + 2, h[4], h[5]]; })()]));   // and the air before the face, where a held cup would hide it
const touches = (part, M) => { const a = L.worldBox({ part, m: M }); return !!a && bodyBoxes().some(b => a[0] < b[3] - 4 && b[0] < a[3] - 4 && a[1] < b[4] - 4 && b[1] < a[4] - 4 && a[2] < b[5] - 4 && b[2] < a[5] - 4); };
const SHIELD = /^(3846|3876|2586|92747|91884|75902|59231|2586p\w+|3846p\w+)$/;
/* items held upright, and where on them the fist closes (the item's own frame): a goblet by its stem, a cup by its handle, a bolt or a wand by its end */
const HOLD = { '2343': { at: [0, 30, 0] }, '6269': { at: [0, 30, 0] }, '3899': { at: [0, 12, 17] }, '27256': { at: [0, -6, 0] }, '36752a': { at: [0, 0, 0] }, '19119c01': { at: [0, 4, 0] }, '95049': {}, '95050': {}, '3847': { at: [0, 0, 0] }, '98370': { at: [0, 0, 0] }, '43887': { at: [0, 0, 0] }, '2530': { at: [0, 0, 0] }, '4499': { at: [0, 0, 0] } };   // a sword held raised, blade up
function poseFor(side, item) {
  const arm0 = side === 'R' ? SKELETON.armR : SKELETON.armL, hand0 = side === 'R' ? SKELETON.handR : SKELETON.handL;
  if (!item || !has(item[0])) return { arm: arm0, hand: hand0 };
  const id = item[0], b = L.info(id).box, len = b ? b[4] - b[1] : 0, pole = b && len > 64 && len > 3 * Math.max(b[3] - b[0], b[5] - b[2]);
  if (SHIELD.test(id) || !/^Minifig (Sword|Spear|Lance|Staff|Tool|Torch|Harpoon|Whip|Bow|Oar|Weapon|Crossbow|Pitchfork|Broom|Shovel|Axe|Scythe)|^Antenna|^Bar |^Plant Flower Stem|^Minifig Lightning|^Minifig Goblet|^Minifig Cup/i.test(L.describe(id) || '')) {
    const g = grips()[id] || grips()['2586p30'] || { rel: GRIP }; return { arm: arm0, hand: hand0, item: L.mul(hand0, SHIELD.test(id) ? g.rel : GRIP) };   // a shield on the wrist as a donor wears it; a readymade without a bar where the grip is
  }
  const hold = HOLD[id];
  if (hold && hold.at) {   // an upright item held at a point: swing the arm out until it clears the body
    const turns = [0, Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4];   // a bar turns freely in the fist: try the item round its own axis first
    for (let spread = 0; spread <= 1.31; spread += 0.13) { const P = uprightPose(side, spread); if (P.err - 0.15 * 1.75 > 0.12 && P.err > 0.4) continue;   // only a pose that still holds it upright
      for (const psi of turns) { const M = L.mul(L.mul(L.mul(P.hand, GRIP), L.RYa(psi)), L.T(-hold.at[0], -hold.at[1], -hold.at[2])); if (!touches(id, M)) return { arm: P.arm, hand: P.hand, item: M }; } }
    const P = uprightPose(side, 0.6); return { arm: P.arm, hand: P.hand, item: L.mul(L.mul(P.hand, GRIP), L.T(-hold.at[0], -hold.at[1], -hold.at[2])) }; }
  const P = pole || hold ? uprightPose(side) : { arm: arm0, hand: hand0 };
  let M = L.mul(P.hand, GRIP);
  /* slide along the axis: a pole down to a stud above the ground (the feet are at y 40), never so far the fist leaves it */
  let slide = 0;
  if (pole) { const ax = axisOf(M), wb = L.worldBox({ part: id, m: M }), want = 38 - wb[4]; slide = want / (ax[1] || 1); }
  slide = Math.max(-(b[4] - 6), Math.min(-(b[1] + 6), slide));   // the grip point stays at least 6 LDU inside the item's ends
  M = L.mul(M, L.T(0, slide, 0));
  return { arm: P.arm, hand: P.hand, item: M };
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
