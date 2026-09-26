/* tools/forage/sets.js — furniture and the hero sets of the Odyssey, with marks to stand the cast on.

   FURN is a library of set dressing, each piece a component: foraged where a real set has the thing (the Haunted House's
   fireplace, the Scorpion Pyramid's stairway and arch, the Tower Bridge urn, the Barracuda's chest and lamp, Skull
   Island's barrel), stud-built by the DSL where it has to be made (a klismos chair, a throne, a couch, a feast table, a
   fluted column, a loom, a bath, a pithos, a statue on its plinth).

   SETS lays furniture into rooms: a floor, walls, doors, and every piece at a stud position. Each set names its marks
   (the threshold, the hearth, the throne, the loom) in studs from its centre, with the way a figure standing there faces,
   so a scene can block its cast onto the set and a camera can find them. */
'use strict';
const B = require('./build.js'), K = B.K;
const { kit, part, parts, donor, fig, at, rowsOf, foot } = B;
const C = { black: 0, red: 4, yellow: 14, white: 15, tan: 19, orange: 25, dtan: 28, tDBlue: 33, tYellow: 46, tClear: 47, tOrange: 57, rbrown: 70, lbg: 71, dbg: 72, dblue: 272, dgreen: 288, gold: 297, dbrown: 308, dred: 320, olive: 330, sgreen: 378, green: 2, purple: 22, blue: 1, silver: 179 };
const col1 = (id, col, x, z, h, y = 0) => Array.from({ length: h }, (_, i) => K.part(id, col, x, z, y + i));

/* ── furniture ── */
const FURN = {
  /* foraged */
  hearth: () => donor('10228', '10228 CHEMINEE.ldr', { name: 'hearth' }),
  urn: () => donor('10214', '10214 - Sub-Assy B23 - Urn Decoration.ldr', { name: 'urn' }),
  barrel: () => donor('6279', '6279 - Burrel.ldr', { name: 'storage barrel' }),
  chest: () => donor('6285', '6285 - chest.ldr', { name: 'treasure chest', noFlex: true }),
  brazier: () => donor('6285', '6285 - lamp.ldr', { name: 'brazier' }),
  bench: () => donor('6285', '6285 - bench.ldr', { name: 'bench' }),
  desk: () => donor('10228', '10228 WRITE TABLE.ldr', { name: 'writing table' }),
  stair: () => donor('7327', '7327 - Stairway.ldr', { name: 'stair' }),
  arch: () => donor('7327', '7327 - Column with Arch.ldr', { name: 'arch' }),
  wallPanel: () => donor('7327', '7327 - Tomb Wall.ldr', { name: 'painted wall' }),
  bier: () => donor('7327', '7327 - Sarcophagus.ldr', { name: 'bier' }),
  stele: () => donor('7327', '7327 - Obelisk.ldr', { name: 'stele' }),
  gate: () => donor('10228', '10228 SUB SET GATE.ldr', { name: 'gate' }),
  /* stud-built */
  chair: (col = C.rbrown) => kit('klismos chair', [...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, z]) => K.part('3062b', col, x, z, 0)), K.part('3022', col, 0, 0, 1), K.part('3004', col, 0, 1, 1, { plate: 1 }), K.part('3069b', col, 0, 1, 2, { plate: 1 })]),
  throne: (col = C.gold, cloth = C.dred) => kit('throne', [K.box(0, 0, 3, 3, 1, C.white), K.slab(0, 0, 3, 3, cloth, { y: 1 }), K.box(0, 2, 3, 1, 2, col, { y: 1, plateOffset: 1 }), K.part('3062b', col, 0, 0, 1, { plate: 1 }), K.part('3062b', col, 2, 0, 1, { plate: 1 }), K.slab(0, 2, 3, 1, col, { y: 3, plateOffset: 1 })]),
  couch: (col = C.rbrown, cloth = C.white) => kit('couch', [...[[0, 0], [5, 0], [0, 1], [5, 1]].map(([x, z]) => K.part('3062b', col, x, z, 0)), K.slab(0, 0, 6, 2, col, { y: 1 }), K.slab(0, 0, 6, 2, cloth, { y: 1, plateOffset: 1 }), K.part('3004', col, 0, 0, 1, { plate: 2, rot: 1 })]),
  table: (col = C.rbrown, food = true) => kit('feast table', [...[[0, 0], [7, 0], [0, 1], [7, 1]].map(([x, z]) => K.part('3062b', col, x, z, 0)), K.slab(0, 0, 8, 2, col, { y: 1 }), ...(food ? [[1, 0, C.orange], [3, 1, C.red], [4, 0, C.yellow], [6, 1, C.white], [2, 1, C.dbrown]].map(([x, z, c]) => K.part('3062b', c, x, z, 1, { plate: 1 })) : [])]),
  column: (h = 6, col = C.white) => kit('column', [K.part('3022', col, 0, 0, 0), ...Array.from({ length: h }, (_, i) => K.part('3941', col, 0, 0, i, { plate: 1 })), K.slab(0, 0, 2, 2, col, { y: h, plateOffset: 1 }), K.slab(-1, -1, 4, 4, col, { y: h, plateOffset: 2 })]),
  loom: (col = C.rbrown, cloth = C.white) => kit('loom', [...col1('3062b', col, 0, 0, 5), ...col1('3062b', col, 5, 0, 5), K.slab(0, 0, 6, 1, col, { y: 5 }), K.box(1, 0, 4, 1, 3, cloth, { y: 1 }), K.part('3062b', col, 1, 0, 0), K.part('3062b', col, 4, 0, 0)]),
  bath: () => kit('bath', [K.box(0, 0, 6, 4, 1, C.white, { hollow: true }), K.slab(1, 1, 4, 2, C.tDBlue)]),
  pithos: (col = C.dtan) => kit('pithos', [K.part('3941', col, 0, 0, 0), K.part('3941', col, 0, 0, 1), K.part('4589', col, 0, 0, 2), K.part('4589', col, 1, 1, 2)]),
  altar: () => kit('altar', [K.box(0, 0, 3, 2, 1, C.white), K.slab(0, 0, 3, 2, C.gold, { y: 1 }), K.part('3062b', C.orange, 1, 0, 1, { plate: 1 }), K.part('3062b', C.yellow, 1, 1, 1, { plate: 1 })]),
  bed: (col = C.rbrown) => kit('bed', [K.box(0, 0, 4, 7, 1, col), K.slab(0, 0, 4, 7, C.white, { y: 1 }), K.box(0, 0, 4, 1, 1, col, { y: 1, plateOffset: 1 })]),
  shelf: (col = C.rbrown) => kit('storeroom shelf', [K.shelf ? null : null, K.box(0, 0, 6, 2, 1, col), K.slab(0, 0, 6, 2, col, { y: 1 }), ...[0, 2, 4].map(x => K.part('3941', C.dtan, x, 0, 1, { plate: 1 })), K.box(0, 0, 6, 1, 3, col)].filter(Boolean)),
  rack: () => kit('arms rack', [K.box(0, 0, 6, 1, 1, C.rbrown), ...[0, 2, 4].map(x => K.part('3062b', C.lbg, x, 0, 1))]),
  statue: (name = 'statue', col = C.gold) => at(name, [[kit('plinth', [K.box(0, 0, 2, 2, 2, C.white)]), 0, 0], [fig({ top: col, legs: col, hips: col, arms: col, hands: col, skin: col, hat: ['98366', col] }, 'figure in bronze'), 0, 0, 0, -48]]),
  fountain: () => kit('fountain', [K.box(0, 0, 6, 6, 1, C.white, { hollow: true }), K.slab(1, 1, 4, 4, C.tDBlue), ...col1('3941', C.white, 2, 2, 2), K.part('3062b', C.tClear, 2, 2, 2), K.part('3062b', C.tClear, 3, 3, 2)]),
  tree: (h = 4, leaf = C.olive) => kit('tree', [K.tree(0, 0, h, { r: 2, leaf })]),
  rock: (w = 4, d = 4, h = 2, col = C.dbg) => kit('rock', [K.rock(0, 0, w, d, h, col)]),
  fire: () => kit('fire', [K.fire(0, 0)]),
  sty: () => kit('sty', [K.box(0, 0, 8, 6, 1, C.rbrown, { hollow: true })]),
  pen: () => kit('pen', [K.box(0, 0, 8, 8, 1, C.dtan, { hollow: true })]),
  rack2: () => kit('cheese racks', [K.box(0, 0, 6, 1, 2, C.rbrown), ...[0, 2, 4].map(x => K.part('3062b', C.yellow, x, 0, 2))]),
  /* the black ship: a Homeric galley, keel along z, bow at +z; the hull open so the crew stand in it to the waist; a square sail
     across the ship on a yard, a red band down it; four oars a side through the red gunwale, a steering oar at the stern */
  galley: (sail = C.white, band = C.red) => kit('black ship', [
    K.box(0, 3, 8, 18, 2, C.black, { hollow: true }), K.box(2, 0, 4, 3, 2, C.black), K.box(2, 21, 4, 3, 2, C.black),
    K.box(3, 0, 2, 1, 3, C.black, { y: 2 }), K.box(3, 23, 2, 1, 3, C.black, { y: 2 }), K.slab(2, 23, 4, 1, C.red, { y: 2 }),
    K.slab(0, 3, 1, 18, C.red, { y: 2 }), K.slab(7, 3, 1, 18, C.red, { y: 2 }),
    ...[6, 9, 15, 18].flatMap(z => [K.slab(-3, z, 4, 1, C.dtan, { y: 2, plateOffset: 1 }), K.slab(7, z, 4, 1, C.dtan, { y: 2, plateOffset: 1 })]),
    K.slab(5, -2, 1, 4, C.dtan, { y: 2, plateOffset: 1 }),
    /* the sail stands on the gunwale (the tiler keeps only what is held from below), the yard over the sail and the mast's cap */
    ...col1('3941', C.rbrown, 3, 11, 8, 0), K.part('3022', C.rbrown, 3, 11, 8), K.slab(-2, 11, 12, 3, C.rbrown, { y: 8, plateOffset: 1 }),
    K.box(-1, 13, 10, 1, 2, sail, { y: 2, plateOffset: 1 }), K.box(-1, 13, 10, 1, 1, band, { y: 4, plateOffset: 1 }), K.box(-1, 13, 10, 1, 3, sail, { y: 5, plateOffset: 1 })]),
  /* a raft of logs with a stub mast, as Odysseus builds it on Ogygia */
  raft: () => kit('raft', [...[0, 2, 4, 6, 8].map(x => K.box(x, 0, 2, 10, 1, C.rbrown)), ...col1('3941', C.rbrown, 4, 4, 5, 1), K.box(1, 5, 8, 1, 3, C.white, { y: 3 })]),
  /* a swell of sea: a blue ridge, white along its crest */
  wave: (w = 8, h = 1) => kit('wave', [K.box(0, 0, w, 2, h, C.tDBlue), K.slab(1, 0, w - 2, 1, C.white, { y: h })]),
  whirlpool: () => kit('charybdis', [K.box(0, 0, 10, 10, 1, C.tDBlue, { hollow: true }), K.box(2, 2, 6, 6, 1, C.white, { hollow: true }), K.slab(4, 4, 2, 2, C.black)]),
};


/* ── real kits: set design in the parts LEGO makes for it ──
   Terrain as the pirate and castle sets lay it (a blue baseplate for the sea, the printed beach baseplate, the rock panels
   6082, 6083 and 23996, the two-part boulder), plants as they come (the columnar tree for a cypress, the oval tree in olive
   for an olive, flower stems, the 6 x 5 leaves), the galley on the 22 x 8 unitary hull with a boat mast and a formed sail.
   REAL lays whole parts: each { id, col, x, z (studs), base (its underside, LDU, y down; the plate top is -8), q, m } */
const L = require('./ldraw.js');
const I12 = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
function REAL(name, list) {
  return B.make(name, 'parts', { parts: [...new Set(list.map(p => p.id))].join(' ') }, list.map(p => {
    const box = L.info(p.id + '.dat').box, rot = p.m || L.RY(p.q || 0);
    const y = p.y != null ? p.y : (p.base != null ? p.base : -8) - box[4];   // the part's underside on its base
    return { part: p.id, col: p.col, m: L.mul(L.T((p.x || 0) * 20, y, (p.z || 0) * 20), rot) };
  }));
}
const R = (id, col, x, z, base, q) => ({ id, col, x, z, base, q });
const DECK = -66;   // the galley's deck, its underside on the plate: the hull 58 deep and decked flush with its rim
const KIT = {
  /* the black ship: 22 x 8 hull (black over its red keel: Homer's red-cheeked ships), a boat mast and its topmast, a formed white
     sail turned across the beam on a yard of two 1 x 10 plates. The bow is the hull's +z end. */
  /* furled: the wind has died and the sail is bundled under the yard (the crew row); otherwise the square sail is set */
  galley: (o = {}) => REAL('black ship', [R('71958c01', C.black, 0, 0),
    { id: '2537', col: C.rbrown, x: 0, z: 1, y: -8 - 58 + 24 - 342 }, { id: '4289', col: C.rbrown, x: 0, z: 1, y: -8 - 58 + 24 - 342 - 8 },
    { id: '3666', col: C.rbrown, x: -3, z: 1.5, y: -338 }, { id: '3666', col: C.rbrown, x: 3, z: 1.5, y: -338 },
    /* the oars: four a side (the minifigure oar), their looms across the gunwale, blades dipped in the sea at 55 degrees */
    ...[-7, -4, 4, 7].flatMap(z => [1, -1].map(sd => { const a = 55 * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a) * sd;
      return { id: '2542', col: C.rbrown, x: sd * (80 - 45 * Math.sin(a)) / 20, z, y: -8 - 58 + 24 - 22 - 45 * c, m: [0, 0, 0, c, sn, 0, -sn, c, 0, 0, 0, 1] }; })),
    ...(o.furled ? [-5, -4, -3, -2, 2, 3, 4, 5].map(x => ({ id: '3062b', col: o.sail || C.white, x, z: 1.5, y: -330 }))   /* the bundle, pressed up under the yard's tubes */
      : [{ id: 'u767c02', col: o.sail || C.white, x: 0, z: 2, y: -298 }])]),   /* the square sail, the pirate sets' 12 x 10 cloth, its head on the yard */
  /* a crag of rock panels: the corner panel, the rectangular panel beside it, the triangular panel stacked on, a boulder */
  crag: (col = C.dbg, tall = true) => REAL('crag', [R('23996', col, -3, 0), R('6082', col, 4, 1), ...(tall ? [R('6083', col, 4, 1, -8 - 144)] : []), R('2417', C.green, -1, 2, -8 - 144), R('2417', C.dgreen, 6, 0, -8 - 144)]),
  rocks: (col = C.dbg) => REAL('rocks', [R('53934p01c01', col, 0, 0), R('42291', col, 4, 2), R('42284', col, 4, 2, -8 - 32)]),
  boulder: (col = C.dbg) => REAL('boulder', [R('53934p01c01', col, 0, 0)]),
  cypress: () => REAL('cypress', [R('3778', C.dgreen, 0, 0)]),
  olive: () => REAL('olive tree', [R('3470', C.green, 0, 0)]),
  pine: () => REAL('pine', [R('3471', C.green, 0, 0)]),
  palm: () => REAL('palm', [R('2518c01', C.green, 0, 0)]),
  flowers: (n = 3) => REAL('flowers', Array.from({ length: n }, (_, i) => R(i % 2 ? '3741ac04' : '3741ac01', i % 2 ? C.red : C.yellow, (i % 3) * 3 - 3, Math.floor(i / 3) * 3))),
  bush: () => REAL('bush', [R('2417', C.green, 0, 0), R('2417', C.dgreen, 2, 1, -12)]),
  bones: () => REAL('bones', [R('6260', C.white, 0, 0), R('6266', C.white, 2, 1), R('6266', C.white, -2, 1), R('92691', C.white, 1, -2), R('92691', C.white, -1, 2, -8, 1)]),
  /* Charybdis: a bowl of sea (the 4 x 4 dish turned to a hollow, trans dark blue) with its black floor ("we could see the bottom of the
     whirlpool all black with sand and mud"), rings of foam round it in white and clear round plates, turning inward */
  whirlpool: () => { const RXp = [0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 0, -1], ring = (r, n, ph, col, col2) => Array.from({ length: n }, (_, i) => { const a = ph + i * 2 * Math.PI / n, rr = r + (i % 3) * 0.25;
      return { id: '6141', col: i % 2 ? col2 : col, x: rr * Math.cos(a), z: rr * Math.sin(a), y: -8 - 8 + 4 }; });
    return REAL('the whirlpool', [{ id: '3960', col: C.tDBlue, x: 0, z: 0, y: -8 + 4, m: RXp }, { id: '4150', col: C.black, x: 0, z: 0, y: -8 + 2 },
      ...ring(2.6, 10, 0, C.white, C.tClear), ...ring(3.6, 14, 0.4, C.tClear, C.white), ...ring(4.6, 18, 0.9, C.white, C.tClear), ...ring(5.6, 20, 1.3, C.tClear, C.white)]); },
  /* a swell of sea: double curved slopes side by side across its crest (blue and dark blue), white round plates of foam along the top */
  swell: (n = 5, seed = 0) => REAL('swell', Array.from({ length: n }, (_, i) => [{ id: '93273', col: (i + seed) % 3 === 1 ? C.dblue : C.blue, x: i - (n - 1) / 2, z: ((i * 7 + seed) % 3 - 1) * 0.5 },
    ...((i + seed) % 2 ? [{ id: '6141', col: C.white, x: i - (n - 1) / 2, z: ((i * 7 + seed) % 3 - 1) * 0.5, y: -8 - 25 - 33 - 8 + 3 }] : [])]).flat()),
  /* the raft of logs, as Odysseus lashes it: log bricks side by side, a stub mast */
  raft: () => REAL('raft', [...[-3, -2, -1, 0, 1, 2, 3].map(x => R('30137', C.rbrown, x, 0, -8, 1)), ...[-3, -2, -1, 0, 1, 2, 3].map(x => R('30137', C.rbrown, x, 4, -8, 1)), { id: '3957a', col: C.rbrown, x: 0, z: 2, y: -8 - 24 - 8 }]),
  greatStone: () => REAL('the great stone', [R('53934p01c01', C.lbg, -2, 0), R('53934p01c01', C.lbg, 2, 0), R('42291', C.lbg, 0, 0, -8 - 72), R('42284', C.lbg, 0, 0, -8 - 72 - 32)]),
  caveWall: (col = C.dbg) => REAL('cave wall', [...[-10, 0, 10].map(x => R('6082', col, x, 0)), ...[-10, 0, 10].map(x => R(x ? '6082' : '6083', col, x, 0, -8 - 144))]),
  caveFlank: (col = C.dbg) => REAL('cave flank', [R('6082', col, -5, 0), R('6082', col, 5, 0), R('6083', col, 0, 0, -8 - 144)]),
  splash: () => REAL('splash', [R('4589', C.tClear, 0, 0), R('4589', C.tClear, 1, 1), R('4589', C.white, -1, 1), R('3062b', C.tClear, 0, 1)]),
};
/* the floors: the sea is a blue 32 x 32 baseplate; a 16 x 32 beach baseplate or a second sea plate behind it (authored as placed:
   the floor is not turned with the room, so the back is +z) */
const seaFloor = (back = 'sea') => REAL('the sea', [R('3811', C.blue, 0, -8, -8), back === 'beach' ? R('3857p01', C.green, 0, 16, -8, 2) : R('3857', C.blue, 0, 16, -8)]);

/* ── rooms: a floor, walls, a door ── */
const floor = (w, d, a, b = null) => kit('floor', b == null ? [K.slab(0, 0, w, d, a)] : Array.from({ length: Math.ceil(w / 2) * Math.ceil(d / 2) }, (_, k) => { const i = (k % Math.ceil(w / 2)) * 2, j = Math.floor(k / Math.ceil(w / 2)) * 2; return K.slab(i, j, Math.min(2, w - i), Math.min(2, d - j), (i + j) / 2 % 2 ? a : b); }));
/** Walls round three sides (back and the two flanks), h bricks high, the front open for the camera; a door gap in the back wall if asked. */
const walls = (w, d, h, col, o = {}) => kit('walls', [K.box(0, 0, w, 1, h, col), K.box(0, 0, 1, d, h, col), K.box(w - 1, 0, 1, d, h, col), ...(o.door ? [K.cut(Math.floor(w / 2) - 2 + (o.doorX || 0), 0, 4, 1, 0, Math.min(h, 4))] : []), ...(o.band ? [K.slab(0, 0, w, 1, o.band, { y: h }), K.slab(0, 0, 1, d, o.band, { y: h }), K.slab(w - 1, 0, 1, d, o.band, { y: h })] : [])]);
/** The fourth wall, the one the camera usually stands in: w long, h bricks high, a great door dw wide in the middle under a lintel
    (Homer XXII: "Ulysses... sprang on to the broad pavement" of the threshold, framed in the door of the hall). Its own piece, so a
    still whose camera stands outside the hall can hide it. */
const frontWall = (w, h, col, o = {}) => kit('the threshold wall', [K.box(0, 0, w, 1, h, col), K.cut(Math.floor((w - (o.dw || 6)) / 2), 0, o.dw || 6, 1, 0, h - 1),
  ...(o.band ? [K.slab(0, 0, w, 1, o.band, { y: h })] : []), ...(o.lintel ? [K.slab(Math.floor((w - (o.dw || 6)) / 2) - 1, 0, (o.dw || 6) + 2, 1, o.lintel, { y: h - 1 })] : [])]);
/* a set: its components at stud offsets from its centre, standing on its floor (a plate: y -8), and its marks */
function room(name, w, d, floorComp, items, marks, extra = {}) {
  const list = [[floorComp, 0, 0]];
  /* authored with the back of the room at negative z; the camera looks from LDraw −z, so the room is turned about: a half turn, x and z negated, each piece turned with it */
  for (const it of items) { const [c, x, z, q = 0, y = -8] = it; list.push([c, -x, -z, (q + 2) & 3, y]); }
  const comp = at(name, list);
  const out = {}; for (const [k, m] of Object.entries(marks)) out[k] = { ...m, x: -m.x, z: -m.z };
  return { comp, marks: out, size: [w, d], floorY: -8, ...extra };
}
const M = (x, z, face = 0, note = '', axis, y) => ({ x, z, face, note, ...(axis ? { axis } : {}), ...(y != null ? { y } : {}) });   // face: quarter turns; 0 faces the camera (south)

/* stone coursing in running bond: a wall along x (or z) over stud centres a..b, n courses from base, 1 x 2 embossed bricks and 1 x 1
   bricks at the ends of the odd courses; holes [[from, to, course0, course1]] are left open (a window) */
function coursing(col, a, b, at, n, { alongZ = false, base = -8, holes = [], id2 = '98283', band = null } = {}) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const y = base - 24 * k, c = k === 0 ? C.dtan : band && k === n - 1 ? band : col, studs = [];
    for (let v = a; v <= b + 1e-6; v += 1) if (!holes.some(([f, t, c0, c1]) => v >= f - 1e-6 && v <= t + 1e-6 && k >= c0 && k <= c1)) studs.push(v);
    for (let i = 0; i < studs.length;) {
      const v = studs[i], pair = i + 1 < studs.length && Math.abs(studs[i + 1] - v - 1) < 1e-6 && ((Math.round(v - a) + k) % 2 === 0);
      const u = pair ? v + 0.5 : v, id = pair ? id2 : '3005';
      out.push(alongZ ? { id, col: c, x: at, z: u, base: y, q: 1 } : { id, col: c, x: u, z: at, base: y });
      i += pair ? 2 : 1;
    }
  }
  return out;
}
function circeHall() {
  const W = C.tan, top = -8 - 24 * 9, list = [];
  /* the hall's stone floor (plates, the floor 8 up) and the carpet under the feast */
  for (const x of [-8, 0, 8]) for (const z of [-10, -6, -2]) list.push(R('3035', C.lbg, x, z));
  list.push({ id: '3027', col: C.dred, x: 0, z: -5.5, base: -16 });
  /* the benches either side of the feast ("she set them upon benches and seats"): a 1 x 8 brick under a 1 x 8 tile */
  for (const z of [-3.5, -7.5]) list.push({ id: '3008', col: C.rbrown, x: 0, z, base: -24 }, { id: '4162', col: C.dtan, x: 0, z, base: -48 });
  /* the back wall with two arched windows, the side walls, nine courses; a frieze course of white over all, gold tiles on it */
  list.push(...coursing(W, -11.5, 11.5, -12.5, 9, { holes: [[-7.5, -6.5, 4, 6], [6.5, 7.5, 4, 6]] }));
  for (const x of [-7, 7]) list.push({ id: '30044', col: C.white, x, z: -12.5, base: -8 - 24 * 4 }, { id: '3023', col: C.white, x, z: -12.5, base: -8 - 24 * 4 - 64 });
  for (const sd of [-1, 1]) list.push(...coursing(W, -12.5, -0.5, sd * 12.5, 9, { alongZ: true }));
  /* the colonnade: the great arch over the way in, a lesser arch either side, on white round columns */
  for (const x of [-11.5, -6.5, -5.5, 5.5, 6.5, 11.5]) list.push({ id: '43888', col: C.white, x, z: 0.5, base: -8 });
  for (const x of [-11.5, -6.5, 6.5, 11.5]) list.push({ id: '3005', col: C.white, x, z: 0.5, base: -8 - 144 });
  list.push({ id: '6108', col: C.white, x: 0, z: 0.5, base: -8 - 144 }, { id: '3307', col: C.white, x: -9, z: 0.5, base: -8 - 168 }, { id: '3307', col: C.white, x: 9, z: 0.5, base: -8 - 168 });
  list.push({ id: '3004', col: C.white, x: -6, z: 0.5, base: -8 - 144 }, { id: '3004', col: C.white, x: -6, z: 0.5, base: -8 - 168 }, { id: '3004', col: C.white, x: 6, z: 0.5, base: -8 - 144 }, { id: '3004', col: C.white, x: 6, z: 0.5, base: -8 - 168 });
  /* the frieze: a course of white bricks round the top of the walls and over the arches, gold tiles along it */
  for (let x = -12; x <= 12; x += 2) list.push({ id: '3004', col: C.white, x, z: -12.5, base: top }, { id: '3004', col: C.white, x, z: 0.5, base: top }, { id: '3069b', col: C.gold, x, z: 0.5, base: top - 24 });
  for (let z = -12; z <= 0; z += 2) for (const sd of [-1, 1]) list.push({ id: '3004', col: C.white, x: sd * 12.5, z, base: top, q: 1 });
  /* the loom: two posts, a beam, and the web in bands of colour ("so fine, so soft, and of such dazzling colours") */
  list.push({ id: '2453b', col: C.rbrown, x: -2.5, z: -11.5, base: -16 }, { id: '2453b', col: C.rbrown, x: 2.5, z: -11.5, base: -16 }, { id: '3009', col: C.rbrown, x: 0, z: -11.5, base: -136 },
    { id: '3010', col: C.rbrown, x: 0, z: -11.5, base: -16 });
  const web = [22, C.gold, C.dred, 322, 22, 191, C.dred, C.gold, 322, 22, C.gold, C.dred];
  web.forEach((c, i) => list.push({ id: '3710', col: c, x: 0, z: -11.5, base: -40 - 8 * i }));
  /* the court: flagstones from the gate to the colonnade, the lion-carved gateposts, the lions looking out */
  for (let z = 2.5; z <= 11.5; z += 2) for (const x of [-2, 0, 2]) list.push({ id: '3068b', col: (x / 2 + (z - 0.5) / 2) % 2 ? C.tan : C.dtan, x, z, base: -8 });
  for (const x of [-4.5, 4.5]) list.push({ id: '30274', col: C.lbg, x, z: 12, base: -8, q: 2 }, { id: '3068b', col: C.lbg, x, z: 11.5, base: -80 });
  /* the sty: log bricks two high round a pen of mud (seven studs square inside), its gate a four-stud gap toward the court, a trough */
  for (const k of [0, 1]) { const y = -8 - 24 * k;
    for (const x of [10.5, 14.5]) list.push({ id: '30137', col: C.rbrown, x, z: 3.5, base: y }, { id: '30137', col: C.rbrown, x, z: 11.5, base: y });
    list.push({ id: '30137', col: C.rbrown, x: 16.5, z: 5.5, base: y, q: 1 }, { id: '30137', col: C.rbrown, x: 16.5, z: 9.5, base: y, q: 1 },
      { id: '30136', col: C.rbrown, x: 8.5, z: 4.5, base: y, q: 1 }, { id: '30136', col: C.rbrown, x: 8.5, z: 10.5, base: y, q: 1 }); }
  list.push({ id: '3032', col: C.dbrown, x: 12.5, z: 5.5, base: -8, q: 1 }, { id: '3032', col: C.dbrown, x: 12.5, z: 9.5, base: -8, q: 1 }, { id: '3009', col: C.dbrown, x: 15.5, z: 7.5, base: -16, q: 1 });
  /* the forest round the house */
  list.push(R('3778', C.dgreen, -15, -12), R('3778', C.dgreen, 15, -12), R('3778', C.dgreen, -15.5, -5), R('3471', C.green, 15, -3), R('3470', C.green, -14, 4), R('2435', C.dgreen, -15, 10),
    R('3471', C.green, 8, 13), R('3470', C.green, -9, 12.5), R('2417', C.green, -12, 1), R('2417', C.dgreen, 14, 2), R('2417', C.green, -6, 13), R('2417', C.dgreen, 16, 13),
    R('3741ac01', C.yellow, -11, 9), R('3741ac04', C.red, -12, 6.5), R('3741ac01', C.yellow, 6, 13), R('53934p01c01', C.dbg, 15, 12.5), R('42291', C.dbg, -16, 12.5));
  return REAL("circe's house", list);
}
/* Scylla's rock: rock panels in four tiers, each set back from the channel, her cavern a dark gap in the second tier (black bricks
   behind it, bones on its lip), triangular peaks on top. The channel is +x; the cliff runs along z. */
function scyllaCliff() {
  const g = C.dbg, list = [], T = k => -8 - 144 * k;
  for (const z of [-19, -9, 1, 11]) list.push({ id: '6082', col: g, x: -13, z, base: T(0), q: 1 });
  for (const z of [-19, 1, 11]) list.push({ id: '6082', col: g, x: -14, z, base: T(1), q: 1 });
  for (let k = 0; k < 6; k++) list.push({ id: '3009', col: C.black, x: -15.5, z: -9, base: T(1) - 24 * k, q: 1 });   // the dark of the cavern
  list.push({ id: '6082', col: g, x: -14, z: -9, base: T(1) - 120, q: 1 }, { id: '3009', col: C.dbg, x: -12.5, z: -9, base: T(1) - 8, q: 1 });   // its lintel and lip
  list.push({ id: '6260', col: C.white, x: -12, z: -7, base: T(1) - 8 - 24 }, { id: '6266', col: C.white, x: -12, z: -11, base: T(1) - 8 - 24 });
  for (const z of [-15, -5, 5]) list.push({ id: '6082', col: g, x: -15, z, base: T(2), q: 1 });
  list.push({ id: '6083', col: g, x: -15.5, z: -13, base: T(3), q: 1 }, { id: '6083', col: g, x: -15.5, z: -3, base: T(3), q: 1 }, { id: '6083', col: g, x: -15, z: 7, base: T(2) - 24, q: 1 });
  list.push({ id: '2417', col: C.dgreen, x: -12, z: 12, base: T(1) }, { id: '2417', col: C.green, x: -13, z: -2, base: T(2) }, { id: '32607', col: C.green, x: -11.5, z: 4, base: T(1) });
  return REAL("scylla's rock", list);
}
/* the palace gate at Ithaca (Homer XVII): the outer wall of cut stone with its gateway under a lintel, the stable doors beside it, and
   before them "the heaps of mule and cow dung" where Argos lies; a road of flagstones up to the gate, olive trees along it */
function argosGate() {
  const W = C.tan, list = [];
  list.push(...coursing(W, -15.5, 15.5, -11.5, 7, { holes: [[-3.5, 3.5, 0, 5], [-12.5, -9.5, 0, 3]] }));
  for (const x of [-4.5, 4.5]) list.push({ id: '43888', col: C.white, x, z: -10.5, base: -8 });
  list.push({ id: '6108', col: C.white, x: 0, z: -10.5, base: -8 - 144 + 24 }, { id: '3004', col: C.white, x: -4, z: -10.5, base: -8 - 144 }, { id: '3004', col: C.white, x: 4, z: -10.5, base: -8 - 144 });
  /* the stable doors: brown planks in the low opening */
  for (let k = 0; k < 4; k++) list.push({ id: '3010', col: C.rbrown, x: -11, z: -11.5, base: -8 - 24 * k });
  for (const x of [-11]) list.push({ id: '3009', col: C.dbrown, x: x, z: -11.5, base: -8 - 96 });
  /* the dung heap: rocks and slopes in dark brown and reddish brown, straw (tan) through it */
  list.push({ id: '42291', col: C.dbrown, x: -9, z: -6, base: -8 }, { id: '42284', col: C.dbrown, x: -9, z: -6, base: -8 - 40 }, { id: '42291', col: C.rbrown, x: -12.5, z: -5, base: -8 }, { id: '42284', col: C.dbrown, x: -12.5, z: -5, base: -8 - 40 }, { id: '3040b', col: C.dbrown, x: -6.5, z: -6, base: -8, q: 1 }, { id: '3040b', col: C.rbrown, x: -11, z: -8.5, base: -8, q: 2 },
    { id: '3941', col: C.dbrown, x: -6, z: -4, base: -8 }, { id: '6141', col: C.tan, x: -7, z: -8, base: -8 - 24 }, { id: '6141', col: C.tan, x: -10.5, z: -3, base: -8 - 24 }, { id: '3024', col: C.tan, x: -8, z: -3, base: -8 });
  /* the road of flagstones to the gate */
  for (let z = -8.5; z <= 12.5; z += 2) for (const x of [-1, 1]) list.push({ id: '3068b', col: (x + z + 0.5) % 4 ? C.lbg : C.tan, x, z, base: -8 });
  /* olives and a cypress along the way, a bench and a pithos by the wall */
  list.push(R('3470', C.green, 9, -6), R('3470', C.green, 13, 6), R('3778', C.dgreen, -14, 8), R('2417', C.green, 11, 12), R('2417', C.dgreen, -9, 12), R('3741ac01', C.yellow, 7, 2), R('3741ac04', C.red, -5, 9));
  list.push({ id: '3941', col: C.dtan, x: 7, z: -9, base: -8 }, { id: '3941', col: C.dtan, x: 7, z: -9, base: -32 }, { id: '4589', col: C.dtan, x: 7, z: -9, base: -56 });
  return REAL('the palace gate', list);
}
/* a shore: the sea at the back (a 16 x 32 blue baseplate), the printed beach across the middle, meadow in front (a 16 x 32 green
   baseplate); authored z: sea -24..-8, beach -8..8, meadow 8..24. The floor is not turned with the items, so its z is negated here. */
const shoreFloor = (meadow = C.green) => REAL('the shore', [R('3857', C.blue, 0, 16, -8), R('3857p01', C.green, 0, 0, -8, 2), R('3857', meadow, 0, -16, -8)]);
/* the Lotus-eaters' land (Homer IX): the ships drawn up on the beach, a meadow of lotus in flower under palms, a spring */
function lotusLand() {
  const list = [];
  for (const [x, z] of [[-12, 12], [-7, 16], [-2, 11], [4, 17], [9, 12], [13, 18], [-13, 20], [0, 21], [7, 22], [-9, 22]]) list.push({ id: '19119c01', col: C.green, x, z, base: -8 });
  list.push(R('2518c01', C.green, -14, 13), R('2518c01', C.green, 14, 11), R('2518c01', C.green, 6, 9), R('2417', C.green, -4, 15), R('2417', C.dgreen, 11, 20), R('2423', C.green, -15, 22), R('6255', C.green, 3, 13));
  list.push({ id: '3941', col: C.white, x: -6, z: 19, base: -8 }, { id: '4589', col: C.tDBlue, x: -6, z: 19, base: -32 });   // the spring
  for (const [x, z, h] of [[16, -4, 1], [-15, -3, 0]]) list.push({ id: '53934p01c01', col: C.dtan, x, z, base: -8 });
  return REAL("the lotus-eaters' land", list);
}
/* Calypso's isle (Homer V): "a large cave... a vine loaded with grapes trained over it... four running rills of water... meadows
   thickly overgrown with violets and parsley", and the wood of alder, poplar and cypress she gave him to fell */
function ogygia() {
  const g = C.dtan, list = [];
  /* the cavern: a corner of rock panels with a rectangular panel either side, the dark within, a vine over its mouth */
  list.push({ id: '23996', col: g, x: -12, z: 12, base: -8, q: 3 }, { id: '6082', col: g, x: -7, z: 18, base: -8 }, { id: '6082', col: g, x: -15, z: 6, base: -8, q: 1 }, { id: '6083', col: g, x: -8, z: 18, base: -8 - 144 });
  for (let k = 0; k < 5; k++) list.push({ id: '3009', col: C.black, x: -11, z: 16.5, base: -8 - 24 * k });
  for (const [x, z, y] of [[-12, 13, 150], [-9, 14, 140], [-6, 15, 150], [-14, 11, 120]]) list.push({ id: '2417', col: C.green, x, z, base: -8 - y });
  for (const [x, z] of [[-10, 14], [-7, 15]]) list.push({ id: '32607', col: C.purple, x, z, base: -8 - 130 });
  /* the fire at the cave mouth, the loom inside the light */
  list.push({ id: '3941', col: C.dbg, x: -8, z: 10, base: -8 }, { id: '3062b', col: C.tOrange, x: -8, z: 10, base: -32 }, { id: '4589', col: C.orange, x: -8.5, z: 10, base: -56 });
  /* the rills: trans blue tiles running to the beach */
  for (const [x, z] of [[-3, 18], [-2, 16], [-1, 14], [0, 12], [1, 10], [2, 8], [3, 6]]) list.push({ id: '3068b', col: C.tDBlue, x, z, base: -8 });
  /* the wood: cypress, poplar (the columnar tree), alder (the oval tree), felled trunks of log bricks, stumps */
  list.push(R('3778', C.dgreen, 10, 20), R('3778', C.dgreen, 14, 16), R('3471', C.green, 6, 22), R('3470', C.green, 15, 22), R('3470', C.dgreen, 12, 10), R('3471', C.green, -2, 22));
  for (const [x, z] of [[8, 14], [11, 15]]) list.push({ id: '3941', col: C.rbrown, x, z, base: -8 }, { id: '6141', col: C.tan, x, z, base: -32 });
  for (const [x, z] of [[5, 12], [5, 13.5]]) list.push({ id: '30137', col: C.rbrown, x, z, base: -8 }, { id: '30137', col: C.rbrown, x: x + 4, z, base: -8 });
  /* violets and parsley in the meadow */
  for (const [x, z] of [[0, 18], [3, 20], [-4, 21], [7, 17], [1, 23]]) list.push({ id: '3741ac04', col: C.purple, x, z, base: -8 });
  list.push(R('2423', C.green, 3, 16), R('6255', C.green, -1, 20));
  return REAL("calypso's isle", list);
}
/* Thrinacia (Homer XII): the ship hauled up "into a cave", Hyperion's cattle, "broad-faced and horned", grazing the meadow; an oak
   whose leaves they strewed for barley; the altar where they roasted them */
function thrinacia() {
  const list = [];
  list.push({ id: '23996', col: C.dbg, x: 13, z: -2, base: -8, q: 2 }, { id: '6082', col: C.dbg, x: 15, z: 5, base: -8, q: 3 }, { id: '53934p01c01', col: C.dbg, x: -15, z: -2, base: -8 });
  list.push(R('3470', C.dgreen, -11, 12), R('3470', C.green, -14, 16), R('3471', C.green, 14, 21), R('2417', C.green, 9, 20), R('2417', C.dgreen, -3, 23));
  /* the altar: a block of white bricks, a fire on it; spits across two forked posts beside it */
  list.push({ id: '3004', col: C.white, x: 0, z: 13, base: -8 }, { id: '3004', col: C.white, x: 0, z: 14, base: -8 }, { id: '3004', col: C.white, x: 0, z: 13.5, base: -32, q: 1 });
  list.push({ id: '3062b', col: C.tOrange, x: 0, z: 13.5, base: -56 }, { id: '4589', col: C.orange, x: -0.5, z: 13.5, base: -56 }, { id: '4589', col: C.yellow, x: 0.5, z: 13.5, base: -56 });
  list.push({ id: '3941', col: C.dbg, x: 5, z: 12, base: -8 }, { id: '3062b', col: C.tOrange, x: 5, z: 12, base: -32 }, { id: '4589', col: C.orange, x: 5, z: 12, base: -32 - 24 });
  for (const x of [3.5, 6.5]) list.push({ id: '3957a', col: C.rbrown, x, z: 12, base: -8 });
  list.push({ id: '30374', col: C.lbg, x: 5, z: 12, base: -86, m: [0, 0, 0, 0, -1, 0, 1, 0, 0, 0, 0, 1] });
  list.push({ id: '3741ac01', col: C.yellow, x: 8, z: 16 }, { id: '3741ac01', col: C.yellow, x: -6, z: 19 });
  return REAL('thrinacia', list);
}
/* the river mouth on Scheria (Homer VI): "the river... the washing-cisterns that were always full", the clothes spread on the beach
   to dry, the olive thicket where Odysseus slept under the leaves; the sea at the back, the beach, the meadow and river in front */
function riverMouth() {
  const list = [];
  /* the river: trans dark blue plates winding across the meadow to the beach, two pools edged with grey stones */
  for (const [x, z] of [[-14, 22], [-12, 20], [-10, 18], [-8, 16], [-6, 14], [-4, 12], [-2, 10], [0, 8], [1, 6], [2, 4]]) list.push({ id: '3031', col: C.tDBlue, x, z, base: -8 });
  for (const [x, z, w] of [[-9, 20, 3], [-3, 16, 2]]) { list.push({ id: '3958', col: C.tDBlue, x, z, base: -8 });
    for (let a = 0; a < 10; a++) list.push({ id: a % 2 ? '3062b' : '6141', col: a % 3 ? C.lbg : C.dbg, x: x + 3.6 * Math.cos(a * 0.63), z: z + 3.6 * Math.sin(a * 0.63), base: -8 }); }
  /* the washing: white and coloured tiles spread on the pebbles to dry, a wagon's worth */
  for (const [x, z, c] of [[5, 2, C.white], [7, 3, C.white], [6, 5, C.yellow], [9, 1, C.white], [8, -1, C.red], [11, 3, C.white], [4, -1, C.lbg]]) list.push({ id: '3068b', col: c, x, z, base: -8 });
  /* the olive thicket where he slept: two olives grown into one, leaves heaped under them */
  list.push(R('3470', C.olive, 11, 16), R('3470', C.green, 13, 18), R('2417', C.olive, 10, 14), R('2417', C.green, 12, 13), R('2423', C.olive, 14, 15), { id: '2417', col: C.olive, x: 12, z: 16, base: -8 - 16 });
  list.push(R('3470', C.green, -14, 10), R('3778', C.dgreen, -15, 16), R('2417', C.dgreen, -12, 12), R('3741ac01', C.yellow, 0, 18), R('3741ac04', C.red, 4, 21), R('6255', C.green, -6, 22));
  list.push({ id: '53934p01c01', col: C.dtan, x: -13, z: -2, base: -8 }, { id: '42291', col: C.dtan, x: 14, z: -3, base: -8 });
  return REAL('the river mouth', list);
}
/* the edge of Ocean (Homer XI): "the level shore... the groves of Proserpine, tall poplars and willows"; the trench a cubit each way,
   the blood in it, the dark rocks; the black ship drawn up; mist */
function underworld() {
  const list = [];
  list.push({ id: '3031', col: C.black, x: 0, z: 12, base: -8 + 6 }, { id: '3958', col: C.dbg, x: 0, z: 12, base: -8 - 0 + 2 });
  for (const [x, z] of [[-1, 11], [1, 11], [0, 13], [-1, 13], [1, 13], [0, 11]]) list.push({ id: '6141', col: 36, x, z, base: -8 - 8 + 4 });
  for (let a = 0; a < 14; a++) list.push({ id: a % 2 ? '3062b' : '4589', col: a % 3 ? C.dbg : C.dtan, x: 3.6 * Math.cos(a * 0.45), z: 12 + 3.6 * Math.sin(a * 0.45), base: -8 });
  /* the grove: black poplars and willows in dark green and olive, rocks */
  for (const [x, z, id, c] of [[-13, 18, '3471', C.dgreen], [-9, 22, '3778', C.dgreen], [12, 20, '3471', C.dgreen], [15, 14, '3470', C.olive], [-15, 10, '3470', C.olive], [8, 23, '3778', C.dgreen]]) list.push(R(id, c, x, z));
  list.push({ id: '6082', col: C.dbg, x: -12, z: 4, base: -8, q: 1 }, { id: '6083', col: C.dbg, x: -12, z: 4, base: -8 - 144, q: 1 }, { id: '23996', col: C.dbg, x: 13, z: 5, base: -8, q: 2 }, { id: '53934p01c01', col: C.dbg, x: 6, z: 16 }, { id: '53934p01c01', col: C.dbg, x: -6, z: 18 });
  list.push({ id: '6260', col: C.white, x: 4, z: 9 }, { id: '6266', col: C.white, x: -4, z: 15 });
  return REAL("the edge of ocean", list);
}
const shoreFloorDark = () => REAL('the dark shore', [R('3857', C.dblue, 0, 16, -8), R('3857', C.dbg, 0, 0, -8), R('3857', C.dbg, 0, -16, -8)]);
/* the marriage chamber (Homer XXIII): the room of close-set stone built round the olive, its trunk the bedpost, the bed inlaid with
   gold, silver and ivory, the crimson ox-hide thongs; a doorway to the hall, a lamp, Penelope's chair */
function chamber() {
  const W = C.tan, list = [];
  for (const x of [-6, 2]) for (const z of [-8, 0, 8]) list.push(R('3958', C.dtan, x * 1.5, z));
  list.push(...coursing(W, -12.5, 12.5, -12.5, 8, { band: C.dred }));
  for (const sd of [-1, 1]) list.push(...coursing(W, -12.5, -0.5, sd * 12.5, 8, { alongZ: true, holes: sd > 0 ? [[-7.5, -5.5, 0, 4]] : [] }));
  /* the olive: its trunk rising through the bed's head, boughs cut, leaves above the wall */
  for (let k = 0; k < 9; k++) list.push({ id: '3941', col: C.rbrown, x: 0, z: -11, base: -8 - 24 * k });
  list.push({ id: '2417', col: C.olive, x: 0, z: -11, base: -8 - 216 }, { id: '2417', col: C.green, x: -2, z: -10, base: -8 - 200 }, { id: '2423', col: C.olive, x: 2, z: -11, base: -8 - 208 });
  /* the bed: frame of reddish brown on posts, gold and silver tiles inlaid on the rails, crimson covers, white pillows */
  for (const [x, z] of [[-3, -10], [3, -10], [-3, -2], [3, -2]]) list.push({ id: '3062b', col: C.rbrown, x, z, base: -8 });
  list.push({ id: '3032', col: C.rbrown, x: 0, z: -8, base: -32 }, { id: '3032', col: C.rbrown, x: 0, z: -4, base: -32 }, { id: '3032', col: C.dred, x: 0, z: -6, base: -40 }, { id: '3068b', col: C.white, x: -1, z: -9.5, base: -48 }, { id: '3068b', col: C.white, x: 1, z: -9.5, base: -48 });
  for (const [x, z, c] of [[-3, -6, C.gold], [3, -6, C.silver], [0, -1.5, C.gold]]) list.push({ id: '3069b', col: c, x, z, base: -40, q: x ? 1 : 0 });
  /* a lamp stand, a chair, a chest, a rug */
  list.push({ id: '2453b', col: C.gold, x: 8, z: -10, base: -8 }, { id: '4740', col: C.gold, x: 8, z: -10, base: -128 }, { id: '3062b', col: C.tOrange, x: 8, z: -10, base: -136 });
  list.push({ id: '3031', col: C.dred, x: 0, z: 3, base: -8 });
  return REAL('the marriage chamber', list);
}
/* the forest path on Aeaea (Homer X): "as I was going through the sacred valley... Mercury with his golden wand met me"; a path of tan
   tiles winding between oaks, cypress and pines, ferns and rocks, Circe's smoke rising beyond; moly is a prop */
function forestPath() {
  const list = [];
  for (const [x, z] of [[-2, 14], [-1, 12], [0, 10], [0, 8], [1, 6], [2, 4], [2, 2], [1, 0], [0, -2], [-1, -4], [-1, -6], [0, -8], [1, -10], [2, -12]]) list.push({ id: '3068b', col: (x + z) % 4 ? C.tan : C.dtan, x, z, base: -8 }, { id: '3068b', col: C.tan, x: x + 2, z, base: -8 });
  for (const [x, z, id, c] of [[-10, -12, '3470', C.dgreen], [-13, -4, '3778', C.dgreen], [-9, 3, '3471', C.green], [-14, 10, '3470', C.green], [-8, 12, '3778', C.dgreen], [9, -13, '3471', C.dgreen], [13, -6, '3470', C.dgreen], [8, -2, '3778', C.dgreen], [14, 4, '3471', C.green], [10, 12, '3470', C.green], [-5, -14, '3471', C.green], [6, -15, '3778', C.dgreen]]) list.push(R(id, c, x, z));
  for (const [x, z, c] of [[-5, 7, C.green], [6, 9, C.dgreen], [-6, -8, C.dgreen], [5, -6, C.green], [-12, 0, C.green], [12, 0, C.dgreen]]) list.push(R('2417', c, x, z));
  for (const [x, z] of [[-4, 1], [5, 3], [-3, -11]]) list.push(R('6255', C.green, x, z));
  list.push({ id: '53934p01c01', col: C.dbg, x: -6, z: 13 }, { id: '42291', col: C.dbg, x: 6, z: -10 }, R('3741ac01', C.yellow, 4, 12), R('3741ac04', C.red, -3, 9));
  return REAL('the forest path', list);
}
/* Laertes's farm (Homer XXIV): "a farm which he had reclaimed with infinite labour... the house with a kitchen and a sort of lean-to";
   the orchard in terraced rows of fruit trees (apples red on them), vines on a trellis, a dry-stone wall, the farmhouse with its bench */
function laertesFarm() {
  const list = [];
  /* the farmhouse: stone walls of embossed bricks, a door, a roof of slopes, a lean-to of logs */
  list.push(...coursing(C.tan, -14.5, -6.5, -13.5, 5, { holes: [[-11.5, -9.5, 0, 3]] }));
  for (const sd of [-14.5, -6.5]) list.push(...coursing(C.tan, -13.5, -8.5, sd, 5, { alongZ: true }));
  list.push(...coursing(C.tan, -14.5, -6.5, -8.5, 5, { holes: [[-11.5, -10.5, 0, 3]] }));
  for (let x = -14; x <= -7; x += 2) list.push({ id: '3040b', col: C.dred, x, z: -12.5, base: -8 - 120, q: 2 }, { id: '3040b', col: C.dred, x, z: -9.5, base: -8 - 120 });
  for (let k = 0; k < 3; k++) list.push({ id: '30137', col: C.rbrown, x: -4.5, z: -11, base: -8 - 24 * k, q: 1 });
  list.push({ id: '3008', col: C.rbrown, x: -10.5, z: -6.5, base: -24 }, { id: '4162', col: C.dtan, x: -10.5, z: -6.5, base: -48 });
  /* the feast table before the house */
  for (const [x, z] of [[-3, -8], [4, -8], [-3, -6], [4, -6]]) list.push({ id: '3062b', col: C.rbrown, x, z, base: -8 });
  list.push({ id: '3032', col: C.rbrown, x: -1, z: -7, base: -32 }, { id: '3032', col: C.rbrown, x: 3, z: -7, base: -32 });
  for (const [x, c] of [[-2, C.orange], [0, C.red], [2, C.yellow], [4, C.white]]) list.push({ id: '4740', col: c, x, z: -7, base: -40 });
  /* the orchard: three terraced rows of fruit trees, apples red among the leaves, a dry-stone wall below each row */
  for (const [row, z] of [[0, 5], [1, 10], [2, 14]]) {
    if (row < 2) for (let x = -14; x <= 14; x += 2) list.push({ id: (x + row) % 4 ? '3005' : '3004', col: (x + z) % 3 ? C.lbg : C.dbg, x: x + 0.5, z: z + 2.5, base: -8 });
    for (const x of [-12, -6, 0, 6, 12]) { const tx = x + (row % 2) * 3; if (tx > 14) continue; list.push(R('3470', row === 1 ? C.green : C.dgreen, tx, z));
      for (const [dx, dy, dz] of [[1, 70, 1], [-1, 90, 0], [0, 110, -1], [1, 50, -1]]) list.push({ id: '33051', col: C.red, x: tx + dx * 1.6, z: z + dz * 1.6, base: -8 - dy }); }
  }
  /* the vines on a trellis by the house, and the spade left by a tree */
  for (const x of [8, 12]) list.push({ id: '2453b', col: C.rbrown, x, z: -12, base: -8 }, R('2417', C.green, x, -12, -8 - 120));
  list.push({ id: '3008', col: C.rbrown, x: 10, z: -12, base: -8 - 120 });
  return REAL("laertes's farm", list);
}
/* Troy by night (Homer IV, VIII): the wall of great stones, its towers and the Scaean gate, the city's roofs within; the horse is a prop */
function troy() {
  const list = [];
  list.push(...coursing(C.tan, -15.5, 15.5, -13.5, 10, { holes: [[-2.5, 2.5, 0, 6]] }));
  for (let x = -15; x <= 15; x += 2) list.push({ id: '3004', col: C.dtan, x, z: -13.5, base: -8 - 240 });
  for (let x = -15; x <= 15; x += 4) list.push({ id: '3004', col: C.dtan, x, z: -13.5, base: -8 - 264 });
  list.push({ id: '6108', col: C.dtan, x: 0, z: -12.5, base: -8 - 144 }, { id: '3004', col: C.dtan, x: -2, z: -12.5, base: -8 - 168 - 24 }, { id: '3004', col: C.dtan, x: 2, z: -12.5, base: -8 - 168 - 24 });
  for (const tx of [-5.5, 5.5]) for (let k = 0; k < 13; k++) list.push({ id: '3941', col: k % 4 === 3 ? C.dtan : C.tan, x: tx, z: -12, base: -8 - 24 * k }, { id: '3941', col: C.tan, x: tx, z: -10, base: -8 - 24 * k });
  for (const tx of [-5.5, 5.5]) list.push({ id: '3942c', col: C.dred, x: tx, z: -11, base: -8 - 312 });
  /* houses of the city within the walls: tan cubes with red slope roofs, lit windows */
  for (const [x, z, h] of [[-12, -3, 3], [-8, 4, 2], [10, -4, 3], [13, 5, 2], [-13, 10, 2], [8, 11, 3]]) {
    for (let k = 0; k < h; k++) for (const dz of [-1, 1]) list.push({ id: '3001', col: C.tan, x, z: z + dz, base: -8 - 24 * k });
    for (const dz of [-1, 1]) list.push({ id: '3039', col: C.dred, x: x - 1, z: z + dz, base: -8 - 24 * h, q: 3 }, { id: '3039', col: C.dred, x: x + 1, z: z + dz, base: -8 - 24 * h, q: 1 });
    list.push({ id: '3070b', col: C.tYellow, x: x + 2, z, base: -8 - 16, q: 1 }); }
  /* the square: flagstones, a well, torches */
  for (let x = -5; x <= 5; x += 2) for (let z = -9; z <= 9; z += 2) list.push({ id: '3068b', col: (x + z + 2) % 4 ? C.lbg : C.dtan, x, z, base: -8 });
  list.push({ id: '3941', col: C.lbg, x: -7, z: -8, base: -8 }, { id: '4150', col: C.tDBlue, x: -7, z: -8, base: -32 });
  for (const [x, z] of [[-6, 6], [6, 6], [6, -8]]) list.push({ id: '3957a', col: C.rbrown, x, z, base: -8 }, { id: '3062b', col: C.tOrange, x, z, base: -104 }, { id: '4589', col: C.orange, x, z, base: -128 });
  return REAL('troy by night', list);
}
/* Troy at the scale of its horse (Homer IV, VIII): the Wooden Horse stands nine minifigures tall, so the city it was dragged into is
   built to match: a wall of dressed stone two studs thick and twenty-four courses high with its battlements, the Scaean gate under a
   stone arch between two square towers, houses of the city along both sides with red roofs and lit windows, and the square before the
   gate paved and lit by torches, room for the horse on its cart and the crowd round it. Authored with the gate at the back (-z). */
function troyGreat() {
  const list = [], W = 37.5, ZW = -30.5, H = 24;
  const towers = [[-12.5, -6.5], [6.5, 12.5]];
  const skip = towers.map(([a, b]) => [a, b, 0, 99]);
  /* the wall, two skins in running bond, the gate left open ten studs wide under its arch; battlements on the outer skin */
  for (const z of [ZW, ZW + 1]) list.push(...coursing(C.tan, -W, W, z, H, { holes: [...skip, [-4.5, 4.5, 0, 8], [-5.5, 5.5, 9, 11]], band: C.dtan }));
  list.push({ id: '6108', col: C.dtan, x: 0, z: ZW, base: -8 - 24 * 9 }, { id: '6108', col: C.dtan, x: 0, z: ZW + 1, base: -8 - 24 * 9 });
  for (let x = -W; x <= W; x += 2) if (!towers.some(([a, b]) => x >= a - 0.5 && x <= b + 0.5)) list.push({ id: '3005', col: C.tan, x, z: ZW, base: -8 - 24 * H });
  /* the towers: hollow squares of stone six studs across, thirty courses, crenellated */
  for (const [a, b] of towers) {
    const z0 = ZW - 3, z1 = ZW + 3.0;
    list.push(...coursing(C.tan, a, b, z0, 30, { band: C.dtan }), ...coursing(C.tan, a, b, z1, 30, { band: C.dtan }));
    list.push(...coursing(C.tan, z0 + 1, z1 - 1, a, 30, { alongZ: true, band: C.dtan }), ...coursing(C.tan, z0 + 1, z1 - 1, b, 30, { alongZ: true, band: C.dtan }));
    for (let x = a; x <= b; x += 2) for (const z of [z0, z1]) list.push({ id: '3005', col: C.tan, x, z, base: -8 - 24 * 30 });
    for (let z = z0 + 2; z <= z1 - 2; z += 2) for (const x of [a, b]) list.push({ id: '3005', col: C.tan, x, z, base: -8 - 24 * 30 });
    for (let k = 0; k < 3; k++) list.push({ id: '3070b', col: C.tYellow, x: (a + b) / 2, z: z1 + 0.5, base: -8 - 24 * (14 + 5 * k) - 8 });
  }
  /* houses: hollow boxes of stone with a lit window, roofed in dark red slopes */
  for (const [x0, z0, h] of [[-35, -24, 7], [-35, -14, 6], [-35, -4, 8], [-35, 8, 6], [29, -24, 6], [29, -14, 8], [29, -4, 6], [29, 8, 7]]) {
    const x1 = x0 + 6, z1 = z0 + 7;
    const win = x0 < 0 ? x1 : x0;
    list.push(...coursing(C.tan, x0 + 0.5, x1 - 0.5, z0 + 0.5, h), ...coursing(C.tan, x0 + 0.5, x1 - 0.5, z1 - 0.5, h));
    list.push(...coursing(C.tan, z0 + 1.5, z1 - 1.5, x0 + 0.5, h, { alongZ: true }).filter(p => x0 < 0 || !(Math.abs(p.z - (z0 + 3.5)) < 1.1 && p.base <= -8 - 48 && p.base >= -8 - 72)));
    list.push(...coursing(C.tan, z0 + 1.5, z1 - 1.5, x1 - 0.5, h, { alongZ: true }).filter(p => x0 > 0 || !(Math.abs(p.z - (z0 + 3.5)) < 1.1 && p.base <= -8 - 48 && p.base >= -8 - 72)));
    for (const k of [2, 3]) list.push({ id: '3005', col: C.tYellow, x: win - (x0 < 0 ? 0.5 : -0.5), z: z0 + 3.5, base: -8 - 24 * k });
    for (let z = z0 + 1; z < z1; z += 2) list.push({ id: '3039', col: C.dred, x: x0 + 1, z: z + 0.5, base: -8 - 24 * h, q: 1 }, { id: '3039', col: C.dred, x: x1 - 1, z: z + 0.5, base: -8 - 24 * h, q: 3 },
      { id: '3040b', col: C.dred, x: x0 + 2.5, z: z + 0.5, base: -8 - 24 * (h + 1), q: 1 }, { id: '3040b', col: C.dred, x: x1 - 2.5, z: z + 0.5, base: -8 - 24 * (h + 1), q: 3 });
  }
  /* the square: flagstones under the horse and the crowd, torches on posts round it */
  for (let x = -21; x <= 21; x += 2) for (let z = -25; z <= 27; z += 2) list.push({ id: '3068b', col: (x * 3 + z * 7 + 400) % 5 ? C.lbg : C.dtan, x, z, base: -8 });
  for (const [x, z] of [[-18, -20], [18, -20], [-18, 2], [18, 2], [-18, 22], [18, 22]]) list.push({ id: '3957a', col: C.rbrown, x, z, base: -16 },
    { id: '3957a', col: C.rbrown, x, z, base: -16 - 96 }, { id: '3062b', col: C.tOrange, x, z, base: -16 - 192 }, { id: '4589', col: C.orange, x, z, base: -16 - 216 });
  return REAL('the great troy', list);
}
/* the island of Pharos (Homer IV): a beach under a sea cave, the seals hauled out on the sand; the cave of rock panels */
function sealBeach() {
  const list = [];
  list.push({ id: '23996', col: C.dbg, x: -10, z: 10, base: -8, q: 3 }, { id: '6082', col: C.dbg, x: -4, z: 14, base: -8 }, { id: '6083', col: C.dbg, x: -4, z: 14, base: -8 - 144 }, { id: '6082', col: C.dbg, x: -14, z: 4, base: -8, q: 1 });
  for (let k = 0; k < 5; k++) list.push({ id: '3009', col: C.black, x: -8, z: 12.5, base: -8 - 24 * k });
  list.push(R('3070b', C.dtan, 12, 16));   /* a sand tile where a shrub stood: it keeps the build's footprint, so the rock stays where the stills expect it */
  return REAL('the seal beach', list);
}
/* the harbour of Phorcys on Ithaca (Homer XIII): "at the head of this harbour there is a large olive tree, and at no distance a fine
   overarching cavern sacred to the nymphs... there are mixing-bowls within it and wine-jars of stone"; the beach the Phaeacian ship
   ran half her length up on (the olive itself is a keyframe prop, tools/forage/keyprops.js olive, set where each still needs it); the cave of rock panels over a black mouth, two stone bowls inside */
function phorcys() {
  const list = [];
  /* the cave of the nymphs: rock panels round a black mouth, the stone mixing bowls and jars inside */
  list.push({ id: '23996', col: C.dbg, x: 10, z: 18, base: -8, q: 0 }, { id: '6082', col: C.dbg, x: 4, z: 20, base: -8 }, { id: '6083', col: C.dbg, x: 4, z: 20, base: -8 - 144 }, { id: '6082', col: C.dbg, x: 14, z: 12, base: -8, q: 1 });
  for (let k = 0; k < 5; k++) list.push({ id: '3009', col: C.black, x: 8, z: 19.5, base: -8 - 24 * k });
  list.push({ id: '4740', col: C.lbg, x: 7, z: 17 }, { id: '3941', col: C.lbg, x: 10, z: 17 }, { id: '4589', col: C.lbg, x: 10, z: 17, base: -8 - 24 });
  /* grass tufts on the land above the beach */
  for (const [x, z] of [[-12, 14], [3, 12], [14, 16]]) list.push(R('6255', C.green, x, z));
  return REAL('the harbour of phorcys', list);
}
/* Eumaeus's farm (Homer XIV): "a strong yard, with a wall of stone round it, and a hedge of wild pear; twelve sties"; the hut of logs
   under a thatch of slopes, the fire, his bench of brushwood and goatskin; the dogs "fierce as wild beasts" */
function swineherd() {
  const list = [];
  for (let k = 0; k < 4; k++) { const y = -8 - 24 * k;
    for (const x of [-14.5, -10.5]) list.push({ id: '30137', col: C.rbrown, x, z: -13, base: y }, { id: '30137', col: C.rbrown, x, z: -3, base: y });
    for (const z of [-11, -5]) list.push({ id: '30137', col: C.rbrown, x: -16, z, base: y, q: 1 }, { id: '30137', col: C.rbrown, x: -9, z, base: y, q: 1 });
    if (k > 2) list.push({ id: '30136', col: C.rbrown, x: -9, z: -8, base: y, q: 1 }); }
  for (let x = -16; x <= -9; x += 1) for (const [z, q] of [[-12.5, 2], [-11.5, 2], [-10.5, 2], [-5.5, 0], [-4.5, 0], [-3.5, 0]]) if (x % 1 === 0) list.push({ id: '3040b', col: C.dtan, x, z: z + (q ? 0 : 0), base: -8 - 72 - (Math.abs(z + 8) < 3 ? 48 : 24), q });
  for (let x = -16; x <= -9; x++) list.push({ id: '3004', col: C.dtan, x, z: -8, base: -8 - 144, q: 1 });
  /* the yard wall of dry stone, two courses, the gate a gap at the front */
  for (const z of [-15.5, 15.5]) list.push(...coursing(C.lbg, -15.5, 15.5, z, 2, { holes: z > 0 ? [[-2.5, 2.5, 0, 2]] : [] }));
  for (const x of [-15.5, 15.5]) list.push(...coursing(C.lbg, -14.5, 14.5, x, 2, { alongZ: true }));
  /* the sties: log pens along the east side, mud floors */
  for (const z of [-11, -4, 3]) { for (const dz of [-3, 3]) list.push({ id: '30137', col: C.rbrown, x: 9, z: z + dz, base: -8 }, { id: '30137', col: C.rbrown, x: 13, z: z + dz, base: -8 });
    list.push({ id: '30137', col: C.rbrown, x: 15, z, base: -8, q: 1 }, { id: '3031', col: C.dbrown, x: 11, z, base: -8 }); }
  /* the fire, the bench, pithoi, the wild pear hedge */
  list.push({ id: '3941', col: C.dbg, x: -6, z: 4, base: -8 }, { id: '3062b', col: C.tOrange, x: -6, z: 4, base: -32 }, { id: '4589', col: C.orange, x: -6, z: 4, base: -56 });
  list.push({ id: '3008', col: C.rbrown, x: -11, z: 1, base: -8, q: 1 }, { id: '3666', col: C.white, x: -11, z: 1, base: -32, q: 1 });
  list.push({ id: '3941', col: C.dtan, x: -14, z: 8 }, { id: '4589', col: C.dtan, x: -14, z: 8, base: -32 }, { id: '3941', col: C.dtan, x: -13, z: 11 });
  list.push(R('3470', C.green, 5, 13.5), R('3470', C.olive, -8, 13.5), R('2417', C.dgreen, 11, 13.5), R('2417', C.green, -13, 14), R('3471', C.dgreen, 14, -14.5));
  return REAL("eumaeus's farm", list);
}
const SETS = {
  /* Odysseus's megaron at Ithaca: the hall of the suitors, the bow and the slaughter */
  megaron: () => room('the megaron at ithaca', 36, 30, floor(36, 30, C.dtan, C.tan), [
    [walls(36, 30, 6, C.tan, { door: true, doorX: 10, band: C.dred }), 0, 0, 2, -8],
    [frontWall(36, 6, C.tan, { dw: 6, band: C.dred, lintel: C.dred }), 0, 14.5, 0, -8],
    [FURN.hearth(), 0, -2], [FURN.column(7), -6, -6], [FURN.column(7), 6, -6], [FURN.column(7), -6, 4], [FURN.column(7), 6, 4],
    [FURN.throne(), 0, -12], [FURN.table(), -11, -4], [FURN.table(), -11, 4], [FURN.table(), 11, -4], [FURN.table(), 11, 4],
    [FURN.chair(), -15, -4], [FURN.chair(), -15, 4], [FURN.chair(), 15, -4, 2], [FURN.chair(), 15, 4, 2],
    [FURN.loom(), -13, -12], [FURN.stair(), 13, -10], [FURN.urn(), -16, 11], [FURN.urn(), 16, 11], [FURN.brazier(), -4, 10], [FURN.brazier(), 4, 10],
  ], { threshold: M(0, 13, 2, 'the threshold, where the beggar sits and the bow is strung'), hearth: M(0, 2, 0, 'the hearth'), throne: M(0, -9, 0, 'the high seat'), tableL: M(-8, 0, 1, 'the suitors at their tables'), tableR: M(8, 0, 3), loom: M(-10, -10, 0, 'the loom'), stair: M(10, -6, 0, 'the stair to the upper chamber'), door: M(10, -12, 0, 'the storeroom door'), centre: M(0, 6, 0) }),
  /* the council of the gods on Olympus */
  olympus: () => room('olympus', 32, 28, floor(32, 28, C.white, 71), [
    [FURN.column(9), -12, -10], [FURN.column(9), 12, -10], [FURN.column(9), -12, 6], [FURN.column(9), 12, 6], [FURN.column(9), 0, -12],
    [FURN.throne(C.gold, C.dblue), -7, -8], [FURN.throne(C.gold, C.dred), 0, -8], [FURN.throne(C.gold, C.dgreen), 7, -8], [FURN.throne(C.lbg, C.dblue), -11, -1, 1], [FURN.throne(C.lbg, C.purple), 11, -1, 3],
    [FURN.altar(), 0, 3], [FURN.fountain(), 0, 10], [FURN.urn(), -13, 11], [FURN.urn(), 13, 11],
  ], { zeus: M(0, -5, 0, 'the throne of Zeus'), athena: M(-4, 0, 0, 'Athena before the council'), left: M(-7, -5, 0), right: M(7, -5, 0), altar: M(0, 6, 0), centre: M(0, 0, 0), door: M(0, 13, 2) }),
  /* the Cyclops's cave */
  cave: () => room("polyphemus's cave", 36, 30, floor(36, 30, C.dbg), [
    /* the cave's walls in rock panels, two tiers at the back, the corners turned in, the flanks of panels on their sides */
    [KIT.caveWall(), 0, -12], [REAL('corner', [R('23996', C.dbg, 0, 0)]), -15, -10, 1], [REAL('corner', [R('23996', C.dbg, 0, 0)]), 15, -10, 2],
    [KIT.caveFlank(), -16, 2, 1], [KIT.caveFlank(), 16, 2, 3], [KIT.rocks(), -14, 11], [KIT.boulder(), 14, 11],
    [FURN.pen(), -7, -3], [FURN.rack2(), 7, -7], [FURN.fire(), 3, 2], [FURN.pithos(), 10, -2], [FURN.pithos(), 12, 3],
    [KIT.greatStone(), 0, 12],
  ], { entrance: M(0, 9, 2, 'the mouth of the cave, the great stone'), fire: M(3, 5, 0, 'the fire'), pen: M(-7, 2, 0, 'the flock'), racks: M(7, -4, 0, 'the cheeses'), back: M(0, -6, 0, 'where the Cyclops sleeps'), centre: M(0, 2, 0) }),
  /* Circe's house in the forest (Homer X: "built of cut stones, on a site that could be seen from far, in the middle of the forest";
     wolves and lions about it; the goddess singing at her loom; the sties). In real parts: an open-fronted hall of embossed-stone
     bricks under a frieze, a colonnade of round columns carrying arches (the camera looks in through it), a stone floor and a
     purple carpet, the throne between two braziers, a loom with a web of many colours, the feast table; outside a court of
     flagstones between two lion-carved gateposts, the forest round it, and a sty of log bricks. */
  circe: () => room("circe's hall", 34, 28, floor(34, 28, C.green), [
    [circeHall(), 0, 0],
    [FURN.throne(C.gold, 22), 7.5, -11.5, 0, -16], [FURN.brazier(), -4.5, -10.5, 0, -16], [FURN.brazier(), 4.5, -10.5, 0, -16],
    [FURN.table(C.rbrown), 0, -5.5, 0, -24],
    [FURN.couch(C.rbrown, 22), -8.5, -11, 0, -16], [FURN.pithos(), 10.5, -6, 0, -16], [FURN.pithos(), 10.5, -3, 0, -16], [FURN.urn(), -10.5, -3, 0, -16],
  ], { circe: M(7, -9, 0, 'Circe at her throne'), loom: M(0, -9.5, 0, 'Circe at her loom'), table: M(0, -4, 2, 'the benches and seats'), door: M(0, 1, 2, 'the colonnade'),
       gate: M(0, 11, 2, 'the lion gate'), sty: M(12.5, 7.5, 0, 'the sty, where the crew become swine', 'x'), court: M(-6, 7, 2, 'the court, the tamed beasts'), centre: M(0, 4, 0) }),
  /* the swineherd's hut and yard */
  hut: () => room("eumaeus's farm", 34, 34, floor(34, 34, C.dtan), [[swineherd(), 0, 0]],
    { door: M(-12, -1, 2, "the hut's door"), fire: M(-6, 6, 0, 'the fire'), sty: M(11, -4, 0, 'the sties'), gate: M(0, 14, 2, 'the yard gate'), centre: M(0, 4, 0) }),
  troy: () => room('troy by night', 34, 30, floor(34, 30, C.dtan), [[troy(), 0, 0]], { horse: M(0, 0, 0, 'the horse in the square'), helen: M(4, 4, 2, 'Helen'), gate: M(0, -12, 0, 'the gate'), centre: M(0, 4, 0) }),
  troyGreat: () => room('troy, the square inside the scaean gate', 76, 64, floor(76, 64, C.dtan), [[troyGreat(), 0, 0]], { horse: M(0, 2, 0, 'the horse in the square'), helen: M(-10, 8, 1, 'Helen'), gate: M(0, -28, 0, 'the gate'), centre: M(0, 6, 0) }),
  phorcys: () => room('the harbour of phorcys on ithaca', 32, 48, shoreFloor(), [[phorcys(), 0, 0], [KIT.galley(), 2, -9], [KIT.rocks(C.dtan), 13, 10], [KIT.swell(5, 0), -10, -20], [KIT.swell(5, 2), 11, -21]],
    { olive: M(-6, -6, 0, 'the olive at the head of the harbour'), cave: M(9, -14, 0, 'the cave of the nymphs'), ship: M(2, 10, 0, 'the ship run up on the sand'), centre: M(0, 0, 0) }),
  pharos: () => room('the seal beach on pharos', 32, 48, shoreFloor(C.dtan), [[sealBeach(), 0, 0], [KIT.swell(5, 1), -8, -16], [KIT.swell(6, 3), 8, -19]],
    { menelaus: M(2, 6, 2, 'Menelaus under a sealskin'), proteus: M(-2, 9, 0, 'Proteus among the seals'), eidothea: M(6, -3, 0, 'Eidothea from the sea'), centre: M(0, 6, 0) }),
  /* Alcinous's hall among the Phaeacians */
  phaeacia: () => room('the hall of alcinous', 38, 30, floor(38, 30, C.white, C.gold), [
    [walls(38, 30, 6, C.white, { band: C.gold }), 0, 0, 2, -8],
    [FURN.throne(C.gold, C.dblue), -3, -12], [FURN.throne(C.gold, C.dred), 3, -12], [FURN.statue('gold dog'), -8, -11], [FURN.statue('silver dog', C.lbg), 8, -11],
    [FURN.column(7), -10, -4], [FURN.column(7), 10, -4], [FURN.column(7), -10, 5], [FURN.column(7), 10, 5], [FURN.hearth(), 0, -4],
    [FURN.table(), -14, 0, 1], [FURN.table(), 14, 0, 1], [FURN.chair(C.gold), -3, 6], [FURN.urn(), -16, 11], [FURN.urn(), 16, 11],
  ], { king: M(-3, -9, 0, 'Alcinous'), queen: M(3, -9, 0, 'Arete'), bard: M(-3, 9, 0, "the bard's chair"), guest: M(3, 3, 0, 'the guest at the hearth'), centre: M(0, 6, 0), door: M(0, 13, 2) }),
  /* Calypso's cave on Ogygia */
  grove: () => room("calypso's grove", 34, 28, floor(34, 28, C.green), [
    [FURN.rock(12, 6, 6, C.dtan), -9, -11], [FURN.rock(8, 6, 5, C.dtan), 5, -11], [FURN.tree(5, C.green), 13, -8], [FURN.tree(4, C.dgreen), -14, 3], [FURN.tree(5, C.green), 12, 6], [FURN.tree(3, C.green), -11, 11],
    [FURN.loom(C.rbrown, C.gold), -2, -6], [FURN.fire(), 5, -3], [FURN.bed(), -9, -2], [FURN.fountain(), 5, 7], [kit('shore', [K.slab(0, 0, 34, 3, C.tDBlue)]), 0, 13],
  ], { calypso: M(-2, -3, 0, 'Calypso at her loom'), fire: M(5, 0, 0), spring: M(5, 11, 0), shore: M(-6, 11, 2, 'Odysseus weeping on the shore'), centre: M(0, 3, 0) }),
  /* Argos on the dung heap before the palace gate */
  argos: () => room('the palace gate at ithaca', 32, 28, floor(32, 28, C.dtan), [[argosGate(), 0, 0]],
    { argos: M(-8, -5, 0, 'Argos on the dung heap'), gate: M(0, -8, 2, 'the gateway'), road: M(0, 4, 2, 'the road to the gate'), odysseus: M(2, 2, 2, 'the beggar'), eumaeus: M(-2, 3, 2, 'the swineherd'), centre: M(0, 4, 0) }),
  lotus: () => room("the lotus-eaters' shore", 32, 48, shoreFloor(), [[lotusLand(), 0, 0], [KIT.galley({ furled: true }), 2, -4, 1], [KIT.swell(5, 1), -9, -16], [KIT.swell(6, 2), 8, -18]],
    { odysseus: M(0, 5, 2, 'Odysseus on the beach'), ships: M(2, -4, 0, 'the ships drawn up'), eaters: M(-4, 15, 0, 'the Lotus-eaters in their meadow', 'x'), scouts: M(4, 13, 0, 'the scouts among them', 'x'), centre: M(0, 8, 0) }),
  ogygia: () => room("calypso's isle", 32, 48, shoreFloor(), [[ogygia(), 0, 0], [KIT.raft(), 4, 0], [KIT.swell(5, 0), -8, -16], [KIT.swell(6, 3), 9, -19]],
    { calypso: M(-8, 8, 0, 'Calypso at her cave'), odysseus: M(4, 4, 0, 'Odysseus at the raft'), raft: M(4, 0, 0, 'the raft on the beach'), wood: M(10, 16, 0, 'the wood'), centre: M(0, 10, 0) }),
  thrinacia: () => room('thrinacia, the island of the sun', 32, 48, shoreFloor(), [[thrinacia(), 0, 0], [KIT.galley({ furled: true }), 3, -5, 1], [KIT.swell(5, 2), -10, -17], [KIT.swell(5, 4), 9, -16]],
    { eurylochus: M(-2, 10, 2, 'Eurylochus at the altar'), crew: M(3, 10, 0, 'the crew at the fire', 'x'), odysseus: M(-12, 20, 0, 'Odysseus asleep inland'), cattle: M(6, 18, 0, 'the cattle of the Sun', 'x'), centre: M(0, 12, 0) }),
  river: () => room('the river mouth on scheria', 32, 48, shoreFloor(), [[riverMouth(), 0, 0], [KIT.swell(5, 1), -8, -17], [KIT.swell(5, 3), 9, -19]],
    { nausicaa: M(4, 6, 0, 'Nausicaa by the washing'), maids: M(0, 3, 0, 'the maids at play', 'x'), odysseus: M(12, 14, 2, 'Odysseus in the thicket'), centre: M(0, 8, 0) }),
  underworld: () => room('the edge of ocean', 32, 48, shoreFloorDark(), [[underworld(), 0, 0], [KIT.galley({ furled: true }), 0, -8, 1]],
    { odysseus: M(0, 9, 2, 'Odysseus at the trench, sword drawn'), crew: M(-4, 5, 0, 'the crew with the sheep', 'x'), shades: M(0, 18, 0, 'the dead gathering', 'x'), pit: M(0, 12, 0, 'the trench'), centre: M(0, 12, 0) }),
  chamber: () => room('the marriage chamber', 28, 26, floor(28, 26, C.dtan), [[chamber(), 0, 0]],
    { penelope: M(-4, 4, 0, 'Penelope by the door'), odysseus: M(4, 4, 0, 'Odysseus'), eurycleia: M(8, 8, 0, 'Eurycleia'), bed: M(0, -6, 0, 'the olive bed'), centre: M(0, 4, 0) }),
  /* the harbour of the Laestrygonians (Homer X): "a fine harbour, with high rocks all round it, and a narrow mouth at the entrance"; the
     fleet inside, Odysseus's ship moored outside at the mouth to a rock; cliffs of rock panels in tiers on both sides */
  harbor: () => room('the laestrygonian harbour', 32, 48, seaFloor(), [
    [REAL('the cliffs', [...[-20, -12, -4, 4].flatMap(z => [R('6082', C.dbg, -13, z, -8, 1), R('6082', C.dbg, 13, z, -8, 3), R('6083', C.dbg, -14, z, -8 - 144, 1), R('6083', C.dbg, 14, z, -8 - 144, 3)]),
      R('23996', C.dbg, -9, 9, -8, 0), R('23996', C.dbg, 9, 9, -8, 1), R('2417', C.dgreen, -14, -8, -8 - 144 - 150), R('2417', C.green, 14, 0, -8 - 144 - 150), R('3471', C.dgreen, 14.5, -18, -8 - 144 - 150), R('3778', C.dgreen, -14.5, 2, -8 - 144 - 150)]), 0, 0],
    [KIT.galley({ furled: true }), -4.5, -10], [KIT.galley({ furled: true }), 4.5, -12], [KIT.galley({ furled: true }), 0, 16], [KIT.boulder(), -5, 11], [KIT.swell(4, 0), 0, 5],
  ], { odysseus: M(0, 16, 0, "Odysseus's ship outside the mouth", null, DECK), fleet: M(0, -10, 0, 'the fleet in the harbour', 'x', DECK), giantsL: M(-13, -8, 0, 'giants on the west cliff', 'z', 'top'), giantsR: M(13, -8, 0, 'giants on the east cliff', 'z', 'top'), antiphates: M(-13, 4, 0, 'Antiphates', null, 'top'), centre: M(0, 0, 0) }),
  forest: () => room('the sacred valley on aeaea', 32, 32, floor(32, 32, C.green), [[forestPath(), 0, 0]],
    { odysseus: M(1, 8, 2, 'Odysseus on the path'), hermes: M(1, -4, 0, 'Hermes as a young man'), centre: M(0, 2, 0) }),
  farm: () => room("laertes's farm", 32, 32, floor(32, 32, C.green), [[laertesFarm(), 0, 0]],
    { laertes: M(3, 9, 0, 'Laertes in the orchard'), odysseus: M(0, 0, 0, 'Odysseus'), house: M(-10, -6, 0, 'the farmhouse'), table: M(1, -4, 0, 'the feast'), centre: M(0, 2, 0) }),
  /* the sea sets, in real kits: the blue baseplate sea, the galley bow-on to the camera (its crew two abreast on the deck, the mast
     amidships), the places it passes built of rock panels, baseplates and plants. Marks with a y stand on the deck or a crag. */
  sirens: () => room("the sirens' sea", 32, 48, seaFloor('beach'), [
    [KIT.galley({ furled: true }), 0, 8], [KIT.crag(C.dtan, false), -9, -18], [KIT.rocks(C.dtan), 10, -19], [KIT.cypress(), -13, -21], [KIT.olive(), 13, -12],
    [KIT.flowers(6), -3, -14], [KIT.flowers(3), 6, -20], [KIT.bones(), 2, -11], [KIT.bones(), -7, -12], [KIT.splash(), 11, 10],
    [KIT.swell(5, 0), -11, 4], [KIT.swell(4, 1), 10, 0], [KIT.swell(6, 2), -9, 17], [KIT.swell(5, 3), 11, 19], [KIT.swell(4, 4), -4, -4],
  ], { odysseus: M(0, 7, 0, 'Odysseus bound to the mast', null, DECK), crew: M(0, 4, 0, 'the crew at the oars, wax in their ears', 'zz', DECK), sirens: M(1, -16, 0, 'the Sirens in their meadow of bones', 'x'), centre: M(-10, 6, 0) }),
  /* the strait (Homer XII): "the one rock reaches heaven... in the middle of it is a large cavern"; "the other rock is lower... a large fig
     tree in full leaf grows upon it, and under it lies the sucking whirlpool of Charybdis". Scylla's cliff in four tiers of rock panels
     with her cave in the second; the low rock opposite with its fig tree and the whirlpool at its foot; the black ship between, rowing. */
  strait: () => room('between scylla and charybdis', 32, 48, seaFloor(), [
    [KIT.galley({ furled: true }), -1, 0], [scyllaCliff(), -14, -4], [KIT.whirlpool(), 9, -2], [KIT.rocks(), 14, -6], [KIT.boulder(), 14.5, 1], [KIT.crag(C.dbg, false), 13, -18],
    [REAL('the fig tree', [R('3470', C.dgreen, 0, 0, -8 - 72)]), 14, -6], [KIT.bush(), 12, -12], [KIT.splash(), 6, 3], [KIT.splash(), 11, 5],
    [KIT.swell(5, 0), 6, 16], [KIT.swell(6, 1), -5, 19], [KIT.swell(4, 2), 7, -16], [KIT.swell(5, 3), 3, -21],
  ], { odysseus: M(-1, 9, 0, 'Odysseus armed at the prow', null, DECK), crew: M(-1, -3, 0, 'the sailors rowing hard', 'zz', DECK), scylla: M(-11, -9, 0, "Scylla's cave", null, -8 - 144 - 80), charybdis: M(9, -2, 0, 'Charybdis sucks down the sea'), centre: M(6, 14, 0) }),
  storm: () => room('the storm at sea', 32, 48, seaFloor(), [
    [KIT.raft(), 0, 4], [KIT.splash(), -6, -2], [KIT.splash(), 7, 1], [KIT.splash(), -3, 10], [KIT.splash(), 9, -12], [KIT.rocks(), -12, -18], [KIT.boulder(), 12, -20],
    [KIT.swell(7, 0), -10, 6], [KIT.swell(6, 1), 9, 8], [KIT.swell(6, 2), -8, -8], [KIT.swell(5, 3), 6, -6], [KIT.swell(7, 4), -3, 18], [KIT.swell(6, 5), 8, 19], [KIT.swell(5, 6), -11, -16],
  ], { odysseus: M(0, 3, 0, 'Odysseus clinging to the raft', null, -8 - 24), raft: M(0, 4, 0, 'the raft'), poseidon: M(-9, -12, 0, 'Poseidon rising from the waves'), leucothea: M(9, 8, 0, 'Ino, the sea-bird'), wind: M(8, -12, 0, 'the four winds'), centre: M(-8, 12, 0) }),
  wreck: () => room('the last ship', 32, 48, seaFloor(), [
    [KIT.galley(), 0, 2, 1, 30], [KIT.splash(), -6, -4], [KIT.splash(), 6, 6], [KIT.splash(), 2, -10], [KIT.rocks(), -12, -18], [KIT.olive(), 12, -20],
    [KIT.swell(6, 0), -10, 12], [KIT.swell(5, 1), 9, 14], [KIT.swell(5, 2), -9, -10], [KIT.swell(6, 3), 8, -12], [KIT.swell(7, 4), 0, 19],
  ], { odysseus: M(-6, 10, 0, 'Odysseus on the keel'), crew: M(4, 12, 0, 'the crew thrown into the sea', 'x'), zeus: M(0, -16, 0, 'the thunderbolt'), centre: M(0, 16, 0) }),
  voyage: () => room('the black ship under sail', 32, 48, seaFloor(), [
    [KIT.galley(), 0, 6], [REAL('island', [R('3867p01', C.green, 0, 0)]), -8, -16], [KIT.cypress(), -10, -18], [KIT.olive(), -5, -14], [KIT.rocks(C.dtan), -12, -12], [KIT.splash(), 11, 10],
    [KIT.swell(5, 0), -10, 6], [KIT.swell(5, 1), 10, -2], [KIT.swell(6, 2), -9, 18], [KIT.swell(4, 3), 10, 16], [KIT.swell(5, 4), 4, -10],
  ], { odysseus: M(0, -4, 0, 'Odysseus at the helm', null, DECK), crew: M(0, 5, 0, 'the crew at the oars', 'zz', DECK), ithaca: M(-4, -18, 0, 'home in sight'), aeolus: M(-9, -19, 0, 'Aeolus on his island'), centre: M(10, 4, 0), door: M(12, 14, 0) }),
  boast: () => room('the boast from the ship', 32, 48, seaFloor('beach'), [
    [KIT.crag(C.dbg), -9, -19], [KIT.crag(C.dbg, false), 9, -20], [KIT.cypress(), 13, -13], [KIT.bush(), -13, -12],
    [KIT.galley(), 4, 12], [KIT.boulder(), -7, 1], [KIT.splash(), -6, 3],
    [KIT.swell(5, 0), -10, 4], [KIT.swell(6, 1), -9, 16], [KIT.swell(4, 2), 12, 2], [KIT.swell(5, 3), 12, 16], [KIT.swell(6, 4), -2, 21],
  ], { cyclops: M(-1, -15, 0, 'the Cyclops on the shore, hurling the crag'), odysseus: M(4, 3, 0, 'Odysseus shouting his name from the stern', null, DECK), crew: M(4, 12, 0, 'the crew begging him to stop', 'zz', DECK), centre: M(-11, 10, 0) }),
};
/* which location card stands on which set */
const LOCATION_SET = {
  'location.megaron-hall': 'megaron', 'location.odysseuss-palace-threshold-and-hall': 'megaron', 'location.feast-hall-at-attentive-silence': 'megaron', 'location.fight-threshold': 'megaron',
  'location.olympian-council-hall': 'olympus', 'location.olympian-decision-space': 'olympus',
  'location.polyphemuss-cave': 'cave', 'location.sirens-island': 'sirens', 'location.narrow-monster-strait': 'strait', 'location.circes-forest-palace': 'circe', 'location.eumaeus-hut-interior': 'hut', 'location.eumaeuss-pig-farm': 'hut',
  'location.alcinouss-palace': 'phaeacia', 'location.phaeacian-feast-hall': 'phaeacia', 'location.phaeacian-royal-chamber': 'phaeacia',
  'location.ogygia-cavern-and-grove': 'grove', 'location.nymph-cave': 'grove',
};
module.exports = { FURN, SETS, LOCATION_SET, KIT, REAL, room, walls, floor };
