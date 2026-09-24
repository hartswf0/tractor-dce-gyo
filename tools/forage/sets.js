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
const C = { black: 0, red: 4, yellow: 14, white: 15, tan: 19, orange: 25, dtan: 28, tDBlue: 33, tYellow: 46, tClear: 47, tOrange: 57, rbrown: 70, lbg: 71, dbg: 72, dblue: 272, dgreen: 288, gold: 297, dbrown: 308, dred: 320, olive: 330, sgreen: 378, green: 2, purple: 22, blue: 1 };
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

/* ── rooms: a floor, walls, a door ── */
const floor = (w, d, a, b = null) => kit('floor', b == null ? [K.slab(0, 0, w, d, a)] : Array.from({ length: Math.ceil(w / 2) * Math.ceil(d / 2) }, (_, k) => { const i = (k % Math.ceil(w / 2)) * 2, j = Math.floor(k / Math.ceil(w / 2)) * 2; return K.slab(i, j, Math.min(2, w - i), Math.min(2, d - j), (i + j) / 2 % 2 ? a : b); }));
/** Walls round three sides (back and the two flanks), h bricks high, the front open for the camera; a door gap in the back wall if asked. */
const walls = (w, d, h, col, o = {}) => kit('walls', [K.box(0, 0, w, 1, h, col), K.box(0, 0, 1, d, h, col), K.box(w - 1, 0, 1, d, h, col), ...(o.door ? [K.cut(Math.floor(w / 2) - 2 + (o.doorX || 0), 0, 4, 1, 0, Math.min(h, 4))] : []), ...(o.band ? [K.slab(0, 0, w, 1, o.band, { y: h }), K.slab(0, 0, 1, d, o.band, { y: h }), K.slab(w - 1, 0, 1, d, o.band, { y: h })] : [])]);
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

const SETS = {
  /* Odysseus's megaron at Ithaca: the hall of the suitors, the bow and the slaughter */
  megaron: () => room('the megaron at ithaca', 36, 30, floor(36, 30, C.dtan, C.tan), [
    [walls(36, 30, 6, C.tan, { door: true, doorX: 10, band: C.dred }), 0, 0, 2, -8],
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
    [FURN.rock(10, 6, 6), -12, -11], [FURN.rock(10, 6, 7), 0, -12], [FURN.rock(10, 6, 5), 12, -11], [FURN.rock(6, 10, 5), -15, 0], [FURN.rock(6, 10, 5), 15, 0], [FURN.rock(6, 6, 4), -14, 10], [FURN.rock(4, 4, 3), 14, 11],
    [FURN.pen(), -7, -3], [FURN.rack2(), 7, -7], [FURN.fire(), 3, 2], [FURN.pithos(), 10, -2], [FURN.pithos(), 12, 3],
    [FURN.rock(6, 4, 3, C.lbg), 0, 12],
  ], { entrance: M(0, 9, 2, 'the mouth of the cave, the great stone'), fire: M(3, 5, 0, 'the fire'), pen: M(-7, 2, 0, 'the flock'), racks: M(7, -4, 0, 'the cheeses'), back: M(0, -6, 0, 'where the Cyclops sleeps'), centre: M(0, 2, 0) }),
  /* Circe's house in the forest */
  circe: () => room("circe's hall", 34, 28, floor(34, 28, C.white, C.sgreen), [
    [walls(34, 28, 5, C.white, { band: C.purple }), 0, 0, 2, -8],
    [FURN.column(6, C.white), -5, -4], [FURN.column(6, C.white), 5, -4], [FURN.throne(C.gold, C.purple), 0, -10], [FURN.loom(C.rbrown, C.purple), -11, -10], [FURN.couch(), 10, -9], [FURN.table(C.rbrown), 0, 2],
    [FURN.chair(), -5, 2, 1], [FURN.chair(), 5, 2, 3], [FURN.brazier(), -13, 8], [FURN.brazier(), 13, 8], [kit('sty', [K.box(0, 0, 14, 6, 1, C.rbrown, { hollow: true })]), 8, 9],
  ], { circe: M(0, -7, 0, 'Circe at her throne'), loom: M(-9, -7, 0), table: M(0, 5, 2), sty: M(11, 8, 0, 'the sty, where the crew become swine', 'x'), door: M(0, 12, 2), centre: M(0, 6, 0) }),
  /* the swineherd's hut and yard */
  hut: () => room("eumaeus's farm", 34, 28, floor(34, 28, C.dtan), [
    [kit('hut', [K.box(0, 0, 12, 10, 3, C.rbrown, { hollow: true }), K.cut(4, 9, 4, 1, 0, 3), K.roof(0, 0, 12, 10, 3, 'gable', C.dtan)]), -8, -7, 2],
    [FURN.sty(), 9, -8], [FURN.sty(), 9, 1], [FURN.fire(), -6, 5], [FURN.bench(), -11, 7], [FURN.tree(4), 13, 10], [FURN.pithos(), -14, -1], [FURN.barrel(), 2, -10],
  ], { door: M(-8, -1, 2, "the hut's door"), fire: M(-6, 8, 0, 'the fire'), sty: M(9, 5, 0, 'the sties'), gate: M(0, 12, 2, 'the yard gate'), centre: M(0, 4, 0) }),
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
  /* the sea sets: a wine-dark sea (trans dark blue over the plate), swells, the black ship at the centre. The crew stand in the
     hull (a mark with axis z strings them down the keel); a mark with y stands its figures on a rock top */
  sirens: () => room("the sirens' sea", 40, 36, floor(40, 36, C.tDBlue), [
    [FURN.galley(), 2, 2], [FURN.rock(20, 8, 3, C.dtan), -9, -12], [kit('bones', [K.box(0, 0, 3, 1, 1, C.white), K.slab(0, 1, 2, 1, C.white)]), -17, -10, 0, -80],
    [FURN.wave(8), 12, -12], [FURN.wave(6), 14, 12], [FURN.wave(6), -14, 12], [FURN.wave(8), -6, 14],
  ], { odysseus: M(2, 3, 0, 'Odysseus bound to the mast'), crew: M(2, 4, 0, 'the crew at the oars, wax in their ears', 'z'), sirens: M(-9, -12, 0, 'the Sirens on their meadow of bones', 'x', -80), centre: M(8, 6, 0) }),
  strait: () => room('between scylla and charybdis', 40, 36, floor(40, 36, C.tDBlue), [
    [FURN.galley(), 0, 3], [FURN.rock(10, 10, 9, C.dbg), -14, -10], [FURN.rock(6, 6, 4, C.dbg), -15, 2], [kit('fig tree', [K.tree(0, 0, 4, { r: 2, leaf: C.olive })]), 16, -4],
    [FURN.wave(6), 12, 10], [FURN.wave(6), -8, 14],
  ], { odysseus: M(0, 4, 0, 'Odysseus armed at the prow'), crew: M(0, 5, 0, 'the sailors rowing hard', 'z'), scylla: M(-14, -10, 0, 'Scylla on her crag', 'x', -8 - 9 * 24), charybdis: M(12, -10, 0, 'Charybdis sucks down the sea'), centre: M(6, 6, 0) }),
  storm: () => room('the storm at sea', 40, 36, floor(40, 36, C.tDBlue), [
    [FURN.raft(), 0, 2], [FURN.wave(10, 3), -10, -12], [FURN.wave(12, 4), 8, -13], [FURN.wave(8, 2), -14, 6], [FURN.wave(8, 2), 14, 4], [FURN.wave(10, 1), 2, 14],
  ], { odysseus: M(0, 3, 0, 'Odysseus clinging to the raft'), raft: M(0, 2, 0, 'the raft'), poseidon: M(-10, -8, 0, 'Poseidon rising from the waves'), leucothea: M(9, 6, 0, 'Ino, the sea-bird'), wind: M(9, -8, 0, 'the four winds'), centre: M(-8, 8, 0) }),
  voyage: () => room('the black ship under sail', 40, 36, floor(40, 36, C.tDBlue), [
    [FURN.galley(), 0, 2], [FURN.rock(10, 6, 2, C.green), -13, -13], [FURN.rock(6, 4, 1, C.dtan), -9, -11],
    [FURN.wave(8), 12, -10], [FURN.wave(6), 14, 12], [FURN.wave(6), -14, 10],
  ], { odysseus: M(0, 3, 0, 'Odysseus at the helm'), crew: M(0, 6, 0, 'the crew at the oars', 'z'), ithaca: M(-13, -9, 0, 'home in sight'), aeolus: M(-13, -13, 0, 'Aeolus on his island', null, -56), centre: M(10, 4, 0), door: M(12, 12, 0) }),
  boast: () => room('the boast from the ship', 40, 36, floor(40, 36, C.tDBlue), [
    [kit('shore', [K.slab(0, 0, 40, 10, C.tan)]), 0, -13], [FURN.rock(10, 6, 5, C.dbg), -12, -14], [FURN.rock(6, 5, 3, C.dbg), 12, -15],
    [FURN.galley(), 6, 6, 1], [kit('the hurled rock', [K.rock(0, 0, 4, 4, 2, C.dbg), K.slab(-1, -1, 6, 6, C.white)]), -6, 4], [FURN.wave(6), -14, 12],
  ], { cyclops: M(-3, -12, 0, 'the Cyclops on the shore, hurling the crag'), odysseus: M(2, 6, 0, 'Odysseus shouting his name from the stern'), crew: M(10, 6, 0, 'the crew begging him to stop', 'x'), centre: M(-12, 10, 0) }),
  wreck: () => room('the last ship', 40, 36, floor(40, 36, C.tDBlue), [
    [FURN.galley(C.white, C.dred), 0, 0, 1], [FURN.wave(10, 3), -10, -12], [FURN.wave(12, 4), 8, -13], [FURN.wave(8, 2), 14, 8], [FURN.wave(8, 2), -14, 10],
  ], { odysseus: M(-4, 8, 0, 'Odysseus on the keel'), crew: M(0, 9, 0, 'the crew thrown into the sea', 'x'), zeus: M(0, -12, 0, 'the thunderbolt'), centre: M(0, 12, 0) }),
};
/* which location card stands on which set */
const LOCATION_SET = {
  'location.megaron-hall': 'megaron', 'location.odysseuss-palace-threshold-and-hall': 'megaron', 'location.feast-hall-at-attentive-silence': 'megaron', 'location.fight-threshold': 'megaron',
  'location.olympian-council-hall': 'olympus', 'location.olympian-decision-space': 'olympus',
  'location.polyphemuss-cave': 'cave', 'location.sirens-island': 'sirens', 'location.narrow-monster-strait': 'strait', 'location.circes-forest-palace': 'circe', 'location.eumaeus-hut-interior': 'hut', 'location.eumaeuss-pig-farm': 'hut',
  'location.alcinouss-palace': 'phaeacia', 'location.phaeacian-feast-hall': 'phaeacia', 'location.phaeacian-royal-chamber': 'phaeacia',
  'location.ogygia-cavern-and-grove': 'grove', 'location.nymph-cave': 'grove',
};
module.exports = { FURN, SETS, LOCATION_SET, room, walls, floor };
