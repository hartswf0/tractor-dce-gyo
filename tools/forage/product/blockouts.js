#!/usr/bin/env node
/* tools/forage/product/blockouts.js — massing models for the flagship kits, before any of them is detailed: the way a production designer
   blocks a set, in grey where it is rock, in its masonry colour where it is built, in blue where it is water, with the story's real props
   (the horse, Polyphemus, Scylla, the rams, a ship) and real minifigures standing in it for scale. Each is sized to hold its action, not to
   fill a shelf: the moment first, then the room round it.

     set.blockout-cyclops-cave   Book IX: the escape under the rams
     set.blockout-slaughter      Book XXII: the bow, the axes, the doors shut, the suitors at their tables
     set.blockout-walls-of-troy  Books IV, VIII: the sloping walls of Troy VI, the tangential gate, the breach, the horse hauled in
     set.blockout-scylla         Book XII: the strait, Scylla's cave high in the cliff, Charybdis under the fig tree, the ship between

   Writes odyssey/cards/<name>.mpd; the audit reports anything touching nothing. */
'use strict';
const fs = require('fs'), path = require('path');
const S = require('../sets.js'), B = require('../build.js'), L = require('../ldraw.js');
const PROPS = JSON.parse(fs.readFileSync(path.join(L.ROOT, 'odyssey/keyframes/props.json'), 'utf8'));
const C = { black: 0, blue: 1, red: 4, white: 15, tan: 19, dtan: 28, tClear: 47, tBlue: 43, tDBlue: 33, rbrown: 70, lbg: 71, dbg: 72, dbrown: 308, dred: 320, gold: 297, green: 2, dgreen: 288, orange: 25, tOrange: 57 };
const rowsOf = list => B.rowsOf(S.REAL('blockout', list));

/* a mass: courses k0..k1 over a footprint of cells, laid as bricks; skip(x, z, k) leaves a cell out (a cave, a door) */
function mass(x0, x1, z0, z1, k0, k1, col, skip = () => false, base = -8) {
  const out = [];
  for (let k = k0; k < k1; k++) out.push(...S.fillCourse(x0, x1, z0, z1, base - 24 * k, typeof col === 'function' ? (x, z) => col(x, z, k) : col, k % 2 === 1, 'brick', (x, z) => skip(x, z, k)));
  return out;
}
const plates = (x0, x1, z0, z1, col, base = -8, kind = 'plate') => S.fillCourse(x0, x1, z0, z1, base, col, false, kind);
/* a prop from the keyframe library, its parts in LDraw units, set down at stud (x, z) with its ground at y (LDU, up negative) turned q quarter turns */
function prop(name, x, z, y = -8, q = 0) {
  const R = L.RY(q);
  return PROPS[name].parts.map(p => { const m = L.mul(L.mul(L.T(x * 20, y, z * 20), R), p.m); return { part: p.part.replace(/\.dat$/, ''), col: p.color, m }; });
}
/* a minifigure from a character card, feet at stud (x, z) on the surface at y, facing a quarter turn q (0 faces -z) */
function figure(card, sub, x, z, y = -8, q = 0) {
  const text = fs.readFileSync(path.join(L.ROOT, 'odyssey/cards', card + '.mpd'), 'utf8');
  const bl = text.split(/^0 FILE /m).find(b => b.startsWith(`${card} - ${sub}.ldr`)); if (!bl) return [];
  const lines = bl.split('\n').filter(l => l.startsWith('1 ')).map(l => l.trim().split(/\s+/));
  const hip = lines.find(t => /^3815/.test(t[14])); const fx = hip ? -+hip[2] : 0, fy = hip ? -(+hip[3] + 40) : 0, fz = hip ? -+hip[4] : 0;
  const R = L.RY(q);
  return lines.map(t => { const m = t.slice(2, 14).map(Number); m[0] += fx; m[1] += fy; m[2] += fz; return { part: t[14].replace(/\.dat$/, ''), col: +t[1], m: L.mul(L.mul(L.T(x * 20, y, z * 20), R), m) }; });
}
function write(name, title, parts) {
  const lines = [`0 FILE ${name}.ldr`, `0 ${title}`, `0 Name: ${name}.ldr`, '0 Author: word to world, tools/forage/product/blockouts.js', '0 !LDRAW_ORG Unofficial_Model', ''];
  for (const r of parts) lines.push(`1 ${r.col} ${r.m.map(v => +(+v).toFixed(3)).join(' ')} ${r.part}.dat`);
  fs.writeFileSync(path.join(L.ROOT, 'odyssey/cards', name + '.mpd'), lines.join('\n') + '\n');
  console.log(name, parts.length, 'pieces,', L.audit(parts).floating.length, 'touching nothing');
}
const W = 'ensemble.hidden-greek-warriors';

/* ── Book IX: the Cyclops' cave ─────────────────────────────────────────────────────────────────────────────────────────────────────────
   The moment: the escape at dawn, each man slung under a ram, Polyphemus at the door feeling the fleeces. So the model is the headland in
   section: the cave a vault 6 m high and 13 m deep cut into a cliff 13 m tall, its east side open (it lifts off) to show the fire, the
   stake, the pens, the giant; the great door-stone, which "twenty-two strong four-wheeled waggons would not be enough to draw", on a
   slide beside the mouth (the play: roll it shut, roll it open); the meadow before it and the beach below with the ship. */
function cyclopsCave() {
  const out = [], rock = (x, z, k) => ((x * 7 + z * 3 + k * 5) % 11 === 0 ? C.lbg : C.dbg);
  out.push(...plates(-32, 32, -24, 24, (x, z) => z > 10 ? C.blue : z > 4 ? C.tan : C.green, -8, 'plate'));
  const cave = (x, z, k) => x >= -18 && x < 16 && z >= -20 && z < -2 && k < 14 - Math.max(0, Math.abs(x + 1) - 12);
  const mouth = (x, z, k) => x >= -8 && x < 4 && z >= -4 && k < 12;
  const cut = (x, z, k) => x >= 16;                                                   /* the east side lifted off */
  out.push(...mass(-32, 32, -24, -2, 0, 30, rock, (x, z, k) => cave(x, z, k) || mouth(x, z, k) || cut(x, z, k) || k >= 30 - Math.floor(Math.abs(x) / 4)));
  out.push(...mass(16, 32, -24, -2, 0, 3, rock));                                      /* the cliff's footing where the side lifts off */
  out.push(...mass(4, 14, -4, 0, 0, 13, C.lbg));                                      /* the door-stone, rolled aside */
  out.push(...plates(-8, 16, 0, 2, C.dbrown, -8, 'tile'));                             /* its slide */
  /* inside: the fire, the stake heating in it, the pens of ewes and lambs, the milk-pails and cheese-racks, the giant */
  out.push(...plates(-4, 0, -14, -10, C.black), { id: '3062b', col: C.tOrange, x: (-40) / 20, z: (-240) / 20, base: -16 }, { id: '4589', col: C.orange, x: (-40) / 20, z: (-240) / 20, base: -40 });
  for (let i = 0; i < 12; i++) out.push({ id: '3005', col: C.rbrown, x: (-60 + i * 20) / 20, z: -10, base: -16 });   /* the olive stake */
  for (const [x, z] of [[-16, -18], [-16, -12], [8, -18]]) out.push(...S.fillCourse(x, x + 6, z, z + 5, -16, C.rbrown, false, 'brick', (u, v) => u > x && u < x + 5 && v > z && v < z + 4));
  out.push(...prop('polyphemus', 2, -8, -8, 2));
  for (const [x, z] of [[-3, -1], [1, 1], [-6, 2]]) out.push(...prop('ram', x, z, -16, 0));
  out.push(...figure('character.odysseus', 'odysseus', -1, 3, -16, 2), ...figure(W, 'warrior-1', 6, 3, -16, 2), ...figure(W, 'warrior-3', -10, 4, -16, 2));
  /* below: the ship drawn up, bow to the beach */
  out.push(...mass(-22, -2, 13, 19, 0, 2, C.black), ...mass(-20, -4, 14, 18, 2, 3, C.rbrown));
  return out;
}

/* ── Book XXII: the hall at the slaughter ─────────────────────────────────────────────────────────────────────────────────────────────────
   The moment: Odysseus strips off his rags and leaps to the threshold with the bow, the arrows poured at his feet; the doors are shut; the
   suitors behind their tables. The hall has to be long enough for its axis to carry the story: threshold, the line of twelve axes the
   arrow went through, the hearth, the high seat. So it is a long megaron, 11 m by 22 m inside (Pylos's hall is 13 by 11; this is the
   hall Homer needs), with the storeroom stair Melanthius ran up for the arms, the side door, a gallery where the women watch, and the
   great doors that swing shut. Athena sits on the roof-beam as a swallow. */
function slaughter() {
  const out = [], H = 16;
  out.push(...plates(-18, 18, -34, 38, (x, z) => z > 32 ? C.tan : ((Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? C.tan : C.dtan), -8, 'tile'));
  const inside = (x, z) => x >= -15 && x < 15 && z >= -30 && z < 30;
  const doors = (x, z, k) => z >= 30 && x >= -4 && x < 4 && k < 7;
  const side = (x, z, k) => x >= 15 && z >= 10 && z < 14 && k < 6;
  const stair = (x, z, k) => x < -15 && z >= -24 && z < -20 && k < 6;
  const open = (x, z, k) => x < -15 && z > -28 && z < 28 && k >= 0 && !stair(x, z, k) ? false : false;
  out.push(...mass(-17, 17, -32, 32, 0, H, (x, z, k) => k === 0 ? C.dtan : C.tan, (x, z, k) => inside(x, z) || doors(x, z, k) || side(x, z, k) || stair(x, z, k) || (x >= 15 && z > -30 && z < 30 && k >= 2)));
  /* the axis: the threshold, the twelve axes, the hearth, the high seat */
  out.push(...plates(-4, 4, 28, 30, C.rbrown, -16, 'tile'));
  for (let i = 0; i < 12; i++) { const z = (26 - i * 2) * 20 + 10; out.push({ id: '3062b', col: C.rbrown, x: (-10) / 20, z: (z) / 20, base: -16 }, { id: '3062b', col: C.rbrown, x: (-10) / 20, z: (z) / 20, base: -40 }, { id: '4589', col: C.lbg, x: (-10) / 20, z: (z) / 20, base: -64 }); }   /* twelve axes, two studs apart */
  const hc = (x, z) => Math.hypot(x + 0.5, z + 7.5);
  out.push(...S.fillCourse(-6, 6, -13, -1, -16, (x, z) => hc(x, z) > 4.6 ? C.white : C.dred, false, 'brick', (x, z) => hc(x, z) > 5.6));
  out.push({ id: '3941', col: C.tOrange, x: (0) / 20, z: (-140) / 20, base: -40 });
  for (const [x, z] of [[-8, -14], [8, -14], [-8, 0], [8, 0]]) for (let k = 0; k < 15; k++) out.push({ id: '6143', col: C.dred, x: (x * 20) / 20, z: (z * 20) / 20, base: -16 - 24 * k });
  out.push(...mass(-3, 3, -30, -26, 0, 5, C.white).map(p => ({ ...p })));        /* the high seat */
  /* the suitors' tables down both sides, and the suitors behind them */
  for (const x0 of [-14, 10]) for (const z0 of [-20, -6, 8]) out.push(...S.fillCourse(x0, x0 + 4, z0, z0 + 8, -16 - 48, C.rbrown, true, 'plate'), ...[[0, 0], [3, 0], [0, 7], [3, 7]].flatMap(([dx, dz]) => [0, 1].map(k => ({ id: '3005', col: C.rbrown, x: x0 + dx + 0.5, z: z0 + dz + 0.5, base: -16 - 24 * k }))));
  for (const [x, z, q] of [[-9, -16, 3], [-9, 12, 3], [8, -2, 1], [8, 12, 1]]) out.push(...figure('character.antinous', 'antinous', x, z, -16, q), );
  /* the storeroom stair up the west wall, the gallery over the east */
  for (let i = 0; i < 8; i++) out.push(...mass(-17 - 0, -15, -20 - i, -19 - i, 0, i + 1, C.white).filter(() => true));
  /* Odysseus on the threshold, Telemachus and the herdsmen at the doors; Athena, a swallow on the roof-beam */
  out.push(...figure('character.odysseus', 'odysseus', 0, 29, -16, 0), ...figure(W, 'warrior-2', -3, 31, -16, 0), ...figure(W, 'warrior-4', 3, 31, -16, 0));
  out.push(...S.fillCourse(-17, 17, -1, 1, -8 - 24 * H, C.rbrown, false, 'brick'), { id: '3070b', col: C.gold, x: (10) / 20, z: (10) / 20, base: -8 - 24 * H - 24 });
  return out;
}

/* ── Books IV and VIII: the walls of Troy ─────────────────────────────────────────────────────────────────────────────────────────────────
   Not a Classical city: Troy VI, as it was dug. A wall of limestone that leans back as it rises (battered), its line stepping out a
   little every ten metres in the offsets that give it its sawtooth look; a great tower; the gate made tangential, the road running along
   the wall between two overlapping ends so no enemy comes at it straight; and the breach the Trojans made, with the horse on its rollers
   being hauled up the ramp through it by the city, ropes taut. */
function wallsOfTroy() {
  const out = [];
  out.push(...plates(-48, 48, -24, 24, (x, z) => z > 4 ? C.tan : C.dtan, -8, 'plate'));
  const H = 22, wallZ = x => -10 + (Math.floor((x + 48) / 16) % 2);          /* the offsets: every 16 studs the line steps out one stud */
  const breach = x => x >= 4 && x < 20;
  for (let k = 0; k < H; k++) {
    const back = Math.floor(k / 6);                                          /* battered: the face leans back a stud every six courses */
    for (let x = -48; x < 48; x += 1) {
      if (breach(x) && k >= Math.max(0, (Math.min(x - 4, 19 - x) < 3 ? 6 - Math.min(x - 4, 19 - x) * 2 : 0))) continue;
      if (x >= -34 && x < -28 && k < 9) continue;                            /* the gate passage */
      const z0 = wallZ(x) + back, z1 = wallZ(x) + 4;
      out.push(...S.fillCourse(x, x + 1, z0, z1, -8 - 24 * k, (u, v) => (k % 6 === 5 ? C.dtan : C.tan), k % 2 === 1, 'brick'));
    }
  }
  out.push(...mass(-44, -34, -16, -2, 0, 30, (x, z, k) => (k === 29 ? C.dtan : C.tan)));    /* the great tower beside the gate */
  out.push(...mass(-34, -22, -2, 2, 0, 12, C.tan, (x, z, k) => x >= -30 && x < -28 && k < 8)); /* the overlapping end: the road turns between */
  /* the ramp up to the breach, the horse on it, the Trojans hauling */
  for (let i = 0; i < 6; i++) out.push(...S.fillCourse(4, 20, 4 + i * 2, 6 + i * 2, -8 - 24 * 0 - 8 * (5 - i), C.lbg, false, 'plate'));
  out.push(...prop('horse', 12, 12, -8, 2));
  for (let i = 0; i < 6; i++) out.push(...figure(W, ['warrior-1', 'warrior-2', 'warrior-3', 'warrior-4', 'warrior-5', 'warrior-1'][i], 8 + (i % 2) * 8, -6 - Math.floor(i / 2) * 3, -8, 0));
  return out;
}

/* ── Book XII: Scylla and Charybdis ──────────────────────────────────────────────────────────────────────────────────────────────────────
   The moment: the ship in the strait, the men watching Charybdis suck down the sea, and from the other side Scylla's six heads coming
   down. It is a vertical set: on the left a cliff 18 m tall, smooth, Scylla's cave high in it facing west; on the right a low rock with
   the great fig tree over Charybdis, a whirlpool that turns (the play); between them the channel and the ship. */
function scylla() {
  const out = [];
  out.push(...plates(-24, 24, -32, 32, (x, z) => (Math.hypot(x - 10, z - 6) < 6 ? ((Math.floor(Math.hypot(x - 10, z - 6)) % 2) ? C.tDBlue : C.white) : C.blue), -8, 'plate'));
  const rock = (x, z, k) => ((x * 5 + z * 3 + k) % 9 === 0 ? C.lbg : C.dbg);
  out.push(...mass(-24, -12, -32, 32, 0, 40, rock, (x, z, k) => (x >= -14 && z >= -4 && z < 4 && k >= 26 && k < 32) || k >= 40 - Math.floor(Math.abs(z) / 6)));
  out.push(...mass(16, 24, -8, 20, 0, 6, rock));
  out.push({ id: '3470', col: C.green, x: (19 * 20) / 20, z: (6 * 20) / 20, base: -8 - 24 * 6 });
  out.push(...prop('scyllaStrike', -12, 0, -8 - 24 * 26, 1));
  out.push(...prop('keel', 0, 0, -16, 0));
  out.push(...figure('character.odysseus', 'odysseus', 0, 4, -40, 0), ...figure(W, 'warrior-2', 1, -3, -40, 0));
  return out;
}

const only = process.argv[2];
for (const [name, title, fn] of [['set.blockout-cyclops-cave', "Blockout: the Cyclops' cave", cyclopsCave], ['set.blockout-slaughter', 'Blockout: the hall at the slaughter', slaughter],
  ['set.blockout-walls-of-troy', 'Blockout: the walls of Troy', wallsOfTroy], ['set.blockout-scylla', 'Blockout: Scylla and Charybdis', scylla]]) {
  if (only && !name.includes(only)) continue;
  const list = fn(), raw = list.filter(p => p.part), real = list.filter(p => p.id);
  write(name, title, [...rowsOfAt(real), ...raw]);
}
/* REAL centres a build on its footprint; a blockout keeps its own coordinates, so the shift is taken back out (as REALat does) */
function rowsOfAt(list) {
  if (!list.length) return [];
  const [comp, dx, dz] = S.REALat('blockout', list);
  return B.rowsOf(comp).map(r => ({ ...r, m: [r.m[0] + dx * 20, r.m[1] - 8, r.m[2] + dz * 20, ...r.m.slice(3)] }));
}
