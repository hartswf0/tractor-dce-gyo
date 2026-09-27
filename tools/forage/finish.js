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
function apply(top, key, seed) {
  const st = top.subs[0], stage = st.c, Ws = L.mul(st.M, stage.m);
  const kids = stage.subs.map(k => ({ name: k.c.name, W: L.mul(Ws, k.M), k }));
  const flat = kids.map(k => walk(k.k.c, k.W));
  const cast = top.subs.slice(1).flatMap(s => walk(s.c, s.M).map(e => e.row));
  const input = { profile: profileOf(key), seed: hash(seed || key || 'set'), kids: kids.map((k, j) => ({ name: k.name, rows: flat[j].map(e => e.row) })), cast };
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
module.exports = { apply, PROFILES };
