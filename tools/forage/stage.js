/* tools/forage/stage.js — blocking: a scene's cast stood on its set's marks, and the scene's beats read into shots.

   occupancy(set)   the stud cells the set fills above its floor (walls, furniture, rock), so a figure is never stood in a table
   block(set, cast) each cast member to the free spot nearest its mark: a named mark if the card's name is a mark's name
                    (Zeus to the throne of Zeus, Circe to hers), else the marks in turn; a crowd is split into its figures,
                    stood in a loose rank about its mark; a herd, a prop or a vehicle keeps its footprint
   previs(scene, blocking, marks)
                    the beats as a timeline: who each beat is about (the cast named in its words), who moves where (a verb of
                    going sends the subject toward the other one named, or to a mark the beat names), what the camera does
                    (an establishing crane on the first beat, a two-shot or an over-the-shoulder for talk, a low push-in for
                    violence, an orbit for the gods, a pull-back on the last), and how long each beat holds (by its words). */
'use strict';
const L = require('./ldraw.js'), B = require('./build.js');

function occupancy(setComp, floorY = -8) {
  const cells = new Set();
  for (const r of B.rowsOf(setComp)) {
    if (L.isPrimitive(r.part)) continue; const b = L.worldBox(r); if (!b || b[1] > floorY - 2) continue;   // only what rises above the floor
    if (b[4] < floorY - 60) continue;   // hanging high overhead: a figure can pass under
    for (let x = Math.floor(b[0] / 20 + 0.05); x < Math.ceil(b[3] / 20 - 0.05); x++) for (let z = Math.floor(b[2] / 20 + 0.05); z < Math.ceil(b[5] / 20 - 0.05); z++) cells.add(x + ',' + z);
  }
  return cells;
}
/** The free w × d rectangle (in stud cells, with a one-stud margin) nearest (x, z), within the set's size. */
function freeSpot(cells, x, z, w, d, size) {
  const hw = size[0] / 2, hd = size[1] / 2;
  const ok = (cx, cz) => { const x0 = Math.round(cx - w / 2), z0 = Math.round(cz - d / 2); if (x0 < -hw + 1 || z0 < -hd + 1 || x0 + w > hw - 1 || z0 + d > hd - 1) return false;
    for (let i = x0 - 1; i < x0 + w + 1; i++) for (let j = z0 - 1; j < z0 + d + 1; j++) if (cells.has(i + ',' + j)) return false; return true; };
  for (let r = 0; r < 30; r++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue; if (ok(x + dx, z + dz)) return [x + dx, z + dz]; }
  return null;
}
const claim = (cells, x, z, w, d) => { const x0 = Math.round(x - w / 2), z0 = Math.round(z - d / 2); for (let i = x0; i < x0 + w; i++) for (let j = z0; j < z0 + d; j++) cells.add(i + ',' + j); };
const words = s => s.toLowerCase().replace(/[^a-z ]+/g, ' ').split(/\s+/).filter(w => w.length > 3 && !/^(with|from|that|this|their|the|and|into|shade|memory|variant|variants|restored|revealed)$/.test(w));

/** cast: [{ id, name, type, comp }]. Returns { list: [[comp, x, z, q, y]], blocking: [{ who, name, comp, x, z, face, mark }] }. */
function block(set, cast) {
  const cells = occupancy(set.comp, set.floorY), marks = Object.entries(set.marks), used = new Map(), list = [], blocking = [];
  const markFor = (c, i) => { const w = words(c.name); const named = marks.find(([k, m]) => w.includes(k) || w.some(x => (m.note || '').toLowerCase().includes(x) && x.length > 4)); if (named) return named;
    const free = marks.filter(([k]) => !used.has(k) && k !== 'door'); return free.length ? free[i % free.length] : marks[i % marks.length]; };
  cast.forEach((c, i) => {
    const [mk, m] = markFor(c, i); used.set(mk, (used.get(mk) || 0) + 1);
    const figs = c.type === 'ensemble' && c.comp.subs.length > 1 ? c.comp.subs.map(s => s.c) : [c.comp];
    figs.forEach((f, k) => {
      const ft = B.foot(f), w = Math.max(2, ft.w), d = Math.max(2, ft.d);
      const tx = m.x + (figs.length > 1 ? ((k % 4) - 1.5) * 3 : 0), tz = m.z + (figs.length > 1 ? Math.floor(k / 4) * 3 : 0);
      const spot = freeSpot(cells, tx, tz, w, d, set.size) || [tx, tz]; claim(cells, spot[0], spot[1], w, d);
      /* place so the footprint's centre sits on the spot: the component is settled with its footprint about its centre, to a stud */
      list.push([f, spot[0], spot[1], m.face || 0, set.floorY]);
      blocking.push({ who: c.id, name: figs.length > 1 ? c.name + ' ' + (k + 1) : c.name, type: c.type, comp: f, x: spot[0], z: spot[1], face: m.face || 0, mark: mk });
    });
  });
  return { list, blocking };
}

/* ── the beats read into shots ── */
const MOVE = /\b(leap|leaps|jump|jumps|stride|strides|rush|rushes|charge|charges|enter|enters|arrive|arrives|come|comes|go|goes|walk|walks|approach|approaches|return|returns|leave|leaves|run|runs|step|steps|move|moves|rise|rises|spring|springs|lead|leads|bring|brings|carry|carries|flee|flees|cross|crosses|descend|descends|climb|climbs|retreat|retreats|draws near|goes to|sits|kneels|clasps|embraces)\b/;
const TALK = /\b(say|says|said|ask|asks|tell|tells|argue|argues|name|names|recall|recalls|speak|speaks|pray|prays|answer|answers|reply|replies|promise|promises|warn|warns|urge|urges|command|commands|order|orders|announce|announces|question|questions|reveal|reveals|weep|weeps|sing|sings|explain|explains|insist|insists|refuse|refuses|mock|mocks|taunt|taunts|plead|pleads|advise|advises|swear|swears)\b/;
const VIOLENCE = /\b(kill|kills|strike|strikes|shoot|shoots|slay|slays|seize|seizes|throw|throws|hurl|hurls|blind|blinds|drive|drives|slaughter|fight|fights|attack|attacks|stab|stabs|wound|wounds|smash|smashes|beat|beats|eat|eats|devour|devours|storm|wreck|wrecks|string|strings)\b/;
const DIVINE = /\b(god|gods|goddess|appear|appears|vanish|vanishes|disguise|disguised|transform|transforms|thunder|bolt|dream|shade|shades|olymp\w*|divine|immortal|wind|winds)\b/;
function previs(scene, blocking, marks) {
  const people = blocking.filter(b => /character|ensemble|creature/.test(b.type));
  const who = new Map(); for (const b of blocking) if (!who.has(b.who)) who.set(b.who, b);
  const castNames = [...who.values()].map(b => ({ b, w: words(b.name.replace(/ \d+$/, '')) }));
  let t = 0, prevSubj = null; const shots = [], pos = new Map(blocking.map((b, i) => [i, [b.x, b.z]]));
  const firstFig = id => blocking.findIndex(b => b.who === id);
  scene.beats.forEach((beat, i) => {
    const text = beat.toLowerCase(), dur = Math.max(4, Math.min(9, beat.split(/\s+/).length / 2.4)), t0 = t, t1 = t + dur; t = t1;
    const named = castNames.map(c => ({ c, at: Math.min(...c.w.map(w => { const k = text.indexOf(w); return k < 0 ? 1e9 : k; })) })).filter(x => x.at < 1e9).sort((a, b) => a.at - b.at).map(x => x.c.b.who);
    const pron = /^(he|she|they|his|her|their|him|then he|then she)\b/.test(text) && prevSubj;   // a beat that opens on a pronoun keeps the last beat's subject
    const subj = pron ? prevSubj : named[0] || (people[0] && people[0].who) || (blocking[0] && blocking[0].who), obj = named.find(n => n !== subj) || null; prevSubj = subj;
    const si = firstFig(subj), oi = obj ? firstFig(obj) : -1;
    const moves = [];
    if (MOVE.test(text) && si >= 0 && /character|ensemble|creature/.test(blocking[si].type)) {
      const markNamed = Object.entries(marks).find(([k, m]) => text.includes(k) || (m.note && m.note.split(/\W+/).some(w => w.length > 5 && text.includes(w.toLowerCase()))));
      let to = oi >= 0 ? pos.get(oi) : markNamed ? [markNamed[1].x, markNamed[1].z] : [marks.centre ? marks.centre.x : 0, marks.centre ? marks.centre.z : 0];
      const from = pos.get(si), dx = to[0] - from[0], dz = to[1] - from[1], dist = Math.hypot(dx, dz);
      if (dist > 3) { const k = (dist - 3) / dist; to = [Math.round(from[0] + dx * k), Math.round(from[1] + dz * k)]; moves.push({ fig: si, from, to, t0: t0 + 0.4, t1: Math.min(t1 - 0.5, t0 + 0.4 + dist * 0.25) }); pos.set(si, to); }
    }
    const kind = i === 0 ? 'establish' : i === scene.beats.length - 1 ? 'pullback' : VIOLENCE.test(text) ? 'push' : moves.length ? 'track' : DIVINE.test(text) ? 'orbit' : TALK.test(text) ? (oi >= 0 ? (i % 2 ? 'ots' : 'two') : 'medium') : 'medium';
    shots.push({ n: i + 1, t0: +t0.toFixed(2), t1: +t1.toFixed(2), beat, camera: { kind, subject: si, object: oi }, speaker: TALK.test(text) ? si : -1, action: VIOLENCE.test(text) ? si : -1, moves });
  });
  return { duration: +t.toFixed(2), shots };
}
module.exports = { occupancy, freeSpot, block, previs };
