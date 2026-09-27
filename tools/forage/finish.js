/* tools/forage/finish.js — the finishing pass of a scene set, applied by tools/odyssey-forage.js to every scene after its cast is blocked.

   The set (the scene's first sub-build) is handed with its cast to tools/forage/product/finish.py, which covers every exposed stud of
   its floors, ground, courts, wall tops and steps with tiles laid by material, turns plain walls to coursed masonry with a dado and a
   string course, and sets shrubs on bare exterior ground (see that file). What it adds goes into each set sub-build as a sub-build of
   its own named "finish", so the film keeps it part of the piece it finishes (a figure put "on" the court stands on the court's tiles).
   Studs a figure's feet or a piece of furniture stand on are left studded. */
'use strict';
const path = require('path'), { execFileSync } = require('child_process');
const L = require('./ldraw.js');
const PY = path.join(__dirname, 'product', 'finish.py');

/* the set's materials: exterior sets lay turf, earth, sand and rock from the landscape library; interiors pave; the megaron is painted
   in squares (the Pylos floor); mat maps a stud colour to a finish (pave, painted, same, ground:<t e s r m>) */
const EXT = { exterior: true };
const PROFILES = {
  megaron: { mat: { 28: 'painted', 19: 'painted' } },
  phaeacia: { mat: { 15: 'same', 297: 'same' }, string: 297 },
  olympus: { mat: { 15: 'same', 71: 'same' } },
  chamber: { mat: { 28: 'pave', 19: 'pave' } },
  palace: { mat: { 28: 'pave' } },
  circe: { ...EXT, shrubs: 2, mat: { 71: 'pave' } },
  threshold: { ...EXT, shrubs: 3 },
  argos: { ...EXT, shrubs: 2 },
  hut: { ...EXT, shrubs: 2 },
  farm: { ...EXT, shrubs: 3, mat: { 2: 'ground:m' } },
  forest: { ...EXT, shrubs: 4 },
  grove: { ...EXT, shrubs: 2, mat: { 2: 'ground:m' } },
  cave: { ...EXT },
  lotus: { ...EXT, shrubs: 2, mat: { 2: 'ground:m' } }, ogygia: { ...EXT, shrubs: 2 }, thrinacia: { ...EXT, shrubs: 2 }, river: { ...EXT, shrubs: 2 },
  phorcys: { ...EXT, shrubs: 1 }, pharos: { ...EXT }, underworld: { ...EXT },
  sirens: { ...EXT, mat: { 2: 'ground:m' } }, strait: EXT, storm: EXT, wreck: EXT, voyage: EXT, boast: EXT, harbor: EXT,
  trojanShore: { ...EXT }, troyCitadel: { ...EXT, mat: { 28: 'pave', 19: 'pave' } }, troyGreat: { ...EXT, mat: { 28: 'pave' } }, troy: { ...EXT, mat: { 28: 'pave' } },
};
const profileOf = key => { const p = PROFILES[key] || EXT, mat = {}; for (const [k, v] of Object.entries(p.mat || {})) mat[k] = v; return { ...p, mat }; };

/* every part under a component, in the frame M puts it in, with where it lives (the component and its index in local) */
function walk(c, M, out = [], direct = true) {
  const MM = L.mul(M, c.m);
  c.local.forEach((r, i) => out.push({ comp: c, i, direct, row: { part: r.part, col: r.col, m: L.mul(MM, r.m), d: direct ? 1 : 0 } }));
  for (const s of c.subs) walk(s.c, L.mul(MM, s.M), out, false);
  return out;
}
const hash = s => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % 100000;
const rowOf = l => { const t = l.trim().split(/\s+/); return { part: t[14].toLowerCase().replace(/\.dat$/, ''), col: +t[1], m: t.slice(2, 14).map(Number) }; };

/** Finish the set of a scene: top is the scene's group (its first sub the set, the rest the cast); key the set's name in SETS. */
function apply(top, key, seed, avoid = []) {
  const st = top.subs[0], stage = st.c, Ws = L.mul(st.M, stage.m);
  const kids = stage.subs.map(k => ({ name: k.c.name, W: L.mul(Ws, k.M), k }));
  const flat = kids.map(k => walk(k.k.c, k.W));
  const cast = top.subs.slice(1).flatMap(s => walk(s.c, s.M).map(e => e.row));
  const input = { profile: profileOf(key), seed: hash(seed || key || 'set'), kids: kids.map((k, j) => ({ name: k.name, rows: flat[j].map(e => e.row) })), cast, avoid };
  if (process.env.FINISH_DUMP) require('fs').writeFileSync(process.env.FINISH_DUMP, JSON.stringify(input));
  let res;
  try { res = JSON.parse(execFileSync('python3', [PY], { input: JSON.stringify(input), maxBuffer: 1 << 28, encoding: 'utf8' })); }
  catch (e) { console.error('finish: ' + e.message.split('\n')[0]); return null; }
  const subs = stage.subs.map((k, j) => {
    const r = res.kids[j]; if (!r || (!r.add.length && !r.drop.length)) return k;
    const drop = new Set(r.drop.map(n => flat[j][n]).filter(e => e && e.direct).map(e => e.i));
    const MM = L.mul(kids[j].W, k.c.m), fin = { name: 'finish', how: 'finish', source: { kit: 'the finishing pass (tools/forage/product/finish.py)' }, local: r.add.map(rowOf), subs: [], m: L.I12 };
    return { ...k, c: { ...k.c, local: k.c.local.filter((_, i) => !drop.has(i)), subs: [...k.c.subs, { c: fin, M: L.inv(MM) }] } };
  });
  top.subs[0] = { ...st, c: { ...stage, subs } };
  return res.stats;
}
/** Where a scene's keyframe stills (odyssey/keyframes/<id>.json, Film Butter units) stand its figures, in the top's own frame (LDU): the
    film frames a card as film-readymades/build_odyssey.py does (part origins flipped to y up, centred on their footprint, scaled to fit
    330 units), and the finish is left out of that frame, so the unfinished card gives the same numbers. */
function stillsOf(id, card, top) {
  const f = path.join(L.ROOT, 'odyssey', 'keyframes', id + '.json'); if (!require('fs').existsSync(f)) return [];
  let spec; try { spec = JSON.parse(require('fs').readFileSync(f, 'utf8')); } catch (e) { return []; }
  const B = require('./build.js'), rows = B.rowsOf(card);
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const r of rows) { const x = r.m[0], z = -r.m[2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, scale = Math.min(1, 330 / (Math.max(x1 - x0, z1 - z0) / 2));
  const W = L.mul(L.mul(card.m, card.subs[1].M), top.m), Wi = L.inv(W), out = [];
  for (const blk of [spec.blocking || [], ...(spec.keys || []).map(k => k.blocking || [])]) for (const e of blk) {
    if (typeof e.x !== 'number' || typeof e.z !== 'number') continue;
    const X = e.x / scale + cx, Z = -(e.z / scale + cz), p = L.apply(Wi, X, 0, Z); out.push([+p[0].toFixed(1), +p[2].toFixed(1)]);
  }
  return out;
}
/** The card's own plate: the ring of it round the set, finished in the set's materials (the sea to its edge, the court's earth). */
function applyPlate(card, key, seed) {
  const pl = card.subs[0], rest = card.subs.slice(1);
  const rows = walk(pl.c, pl.M), cast = rest.flatMap(s => walk(s.c, s.M).map(e => e.row));
  const input = { profile: { ...profileOf(key), shrubs: 0 }, seed: hash('plate ' + (seed || key)), kids: [{ name: 'plate', rows: rows.map(e => e.row) }], cast };
  let res;
  try { res = JSON.parse(execFileSync('python3', [PY], { input: JSON.stringify(input), maxBuffer: 1 << 28, encoding: 'utf8' })); }
  catch (e) { console.error('finish plate: ' + e.message.split('\n')[0]); return null; }
  const add = res.kids[0].add; if (!add.length) return res.stats;
  const MM = L.mul(pl.M, pl.c.m), fin = { name: 'finish', how: 'finish', source: { kit: 'the finishing pass (tools/forage/product/finish.py)' }, local: add.map(rowOf), subs: [], m: L.I12 };
  card.subs[0] = { ...pl, c: { ...pl.c, subs: [...pl.c.subs, { c: fin, M: L.inv(MM) }] } };
  return res.stats;
}
module.exports = { apply, applyPlate, stillsOf, PROFILES };
