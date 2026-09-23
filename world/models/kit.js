/* world/models/kit.js — the vocabulary the film-set models are written in: short functions that return ops for
   world/dsl.js (studs on x east and z south, y in bricks, a brick three plates), so a model reads as what it is:
   a floor, walls with windows, a shelf with goods on it, a tree, a rock, a fire. Everything here becomes real parts
   laid by the DSL's tiler; tools/model.js then counts the stud joints and cuts the steps. */
'use strict';
const G = (name, x, z, ops, o = {}) => ({ op: 'group', name, x, z, y: o.y || 0, turn: o.turn || 0, ops });
const box = (x, z, w, d, h, col, o = {}) => ({ op: 'box', x, z, w, d, h, col, ...o });
const slab = (x, z, w, d, col, o = {}) => ({ op: 'slab', x, z, w, d, col, plates: 1, ...o });   // y in bricks, plateOffset in plates
const cut = (x, z, w, d, y, h) => ({ op: 'cut', x, z, w, d, y, h });   // y and h in bricks
const part = (id, col, x, z, y, o = {}) => ({ op: 'part', part: id, col, x, z, y, ...o });   // y in bricks, plate: extra plates, rot 0..3
const window = (x, z, facing, y, col) => ({ op: 'window', x, z, facing, y, col });
const door = (x, z, facing, y, col) => ({ op: 'door', x, z, facing, y: y || 0, col });
const roof = (x, z, w, d, y, style, col) => ({ op: 'roof', x, z, w, d, y, style, col });
const stairs = (x, z, facing, steps, w, col, y) => ({ op: 'stairs', x, z, facing, steps, w, col, y: y || 0 });
const arch = (x, z, facing, y, h, col) => ({ op: 'arch', x, z, facing, y, h, col });
const seeded = seed => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

/** A window 1×4×3 (60594) set into a wall along x at (x, z) with its sill y bricks up: the wall is cut first. */
function bigWindow(x, z, y, col = 15, alongZ = false) { return alongZ ? [cut(x, z, 1, 4, y, 3), part('60594', col, x, z, y, { rot: 1 })] : [cut(x, z, 4, 1, y, 3), part('60594', col, x, z, y)]; }
/** A checkered floor of 2×2 plates. */
function checker(x, z, w, d, a = 71, b = 15) { const out = []; for (let i = 0; i < w; i += 2) for (let j = 0; j < d; j += 2) out.push(slab(x + i, z + j, Math.min(2, w - i), Math.min(2, d - j), ((i + j) / 2) % 2 ? a : b)); return out; }
/** A gondola shelf along x: a base course, goods on it, a plate shelf, goods again, a plate top; goods are 1×1 bricks in the colours given, both faces. */
function shelf(x, z, len, col, goods, rnd, o = {}) {
  const ops = [box(0, 0, len, 2, 1, col)]; const tiers = o.tiers || 2;
  for (let t = 0; t < tiers; t++) { const y = 1 + t * 2;
    for (let i = 0; i < len; i++) for (const zz of [0, 1]) { if (rnd() < (o.gap || 0.12)) continue; ops.push(part('3005', goods[Math.floor(rnd() * goods.length)], i, zz, y)); }
    ops.push(slab(0, 0, len, 2, col, { y: y + 1 }));   // the plate over the goods: the next tier's shelf
    if (t < tiers - 1) ops.push(slab(0, 0, len, 2, col, { y: y + 1, plateOffset: 1 }), slab(0, 0, len, 2, col, { y: y + 1, plateOffset: 2 }));   // two more plates: a brick's worth, so the tiers stay on the brick grid
  }
  return G(o.name || 'shelf', x, z, ops);
}
/** A tree: a round-brick trunk h bricks tall, a crown of stepped courses, each course a plate layer under a brick layer, so every
    brick of the crown is tied through the plates to the course over the trunk. */
function tree(x, z, h, o = {}) {
  const trunk = o.trunk == null ? 70 : o.trunk, leaf = o.leaf == null ? 2 : o.leaf, leaf2 = o.leaf2 == null ? leaf : o.leaf2, ops = [];
  for (let i = 0; i < h; i++) ops.push(part('3941', trunk, 0, 0, i));
  const r = o.r || 3;   // crown half-width in studs
  const course = (half, y, off, colA, colB) => { const w = 2 * half; ops.push(slab(1 - half, 1 - half, w, w, colA, { y, plateOffset: off }), slab(1 - half, 1 - half, w, w, colB, { y, plateOffset: off + 1, plates: 3 })); };
  course(r, h, 0, leaf2, leaf);                       // a plate layer on the trunk, then the widest brick course
  course(r - 1, h + 1, 1, leaf, leaf2);                // a plate layer tying the course below, then the next course, one stud in
  if (r > 2) course(r - 2, h + 2, 2, leaf2, leaf);
  const top = r > 2 ? h + 4 : h + 3;
  ops.push(slab(0, 0, 2, 2, leaf2, { y: top }), part('3942', leaf2, 0, 0, top, { plate: 1 }));   // a plate and a cone finial
  return G(o.name || 'tree', x, z, ops);
}
/** A bush: a low mound of green with slopes round the edge (the DSL's hip roof does the slopes). */
function bush(x, z, w, d, col = 2) { return G('bush', x, z, [box(0, 0, w, d, 1, col), roof(0, 0, w, d, 1, 'hip', col)]); }
/** A rock: a grey block with sloped shoulders. */
function rock(x, z, w, d, h, col = 72) { return G('rock', x, z, [box(0, 0, w, d, h, col), roof(0, 0, w, d, h, 'hip', col)]); }
/** A fallen log along x: a two-wide course with a gabled top so it reads as round. */
function log(x, z, len, col = 70) { return G('log', x, z, [box(0, 0, len, 2, 1, col), roof(0, 0, len, 2, 1, 'gable', col)]); }
/** A campfire: a ring of stones, kindling and a flame. */
function fire(x, z) { return G('fire', x, z, [box(0, 0, 4, 4, 1, 72, { hollow: true }), part('3062b', 70, 1, 1, 0), part('3062b', 70, 2, 2, 0), part('3062b', 4, 1, 2, 0), part('3062b', 25, 2, 1, 0), part('3062b', 25, 1, 1, 1), part('3062b', 14, 2, 2, 1), part('85959', 25, 1, 1, 2), part('85959', 14, 2, 2, 2)]); }
/** A lamp post: a round column with a lit head. */
function lamp(x, z, h = 6, col = 0) { const ops = []; for (let i = 0; i < h; i++) ops.push(part('3062b', col, 0, 0, i)); ops.push(part('3005', 46, 0, 0, h), part('3024', col, 0, 0, h + 1)); return G('lamp', x, z, ops); }
/** A shopping cart: four wheels, a plate, a basket, a handle. */
function cart(x, z, col = 4, turn = 0) { return G('cart', x, z, [part('4073', 0, 0, 0, 0), part('4073', 0, 3, 0, 0), part('4073', 0, 0, 1, 0), part('4073', 0, 3, 1, 0), slab(0, 0, 4, 2, 71, { plateOffset: 1 }), slab(0, 0, 4, 2, col, { plateOffset: 2, plates: 3 }), part('3062b', 0, 3, 0, 1, { plate: 2 }), part('3062b', 0, 3, 1, 1, { plate: 2 })], { turn }); }
/** A deck: three plate layers laid as explicit plates in a bond no tiler undoes — 4×2 plates, the second layer offset
    two studs and one, the third turned 2×4 and offset one and two — so every seam of one layer is bridged by the next and
    a ceiling or a porch roof over open air hangs together from whatever holds its edges. y in bricks. */
function deck(x, z, w, d, col, y = 0, o = {}) {
  const SIZE = { '1x1': '3024', '1x2': '3023', '1x3': '3623', '1x4': '3710', '2x2': '3022', '2x3': '3021', '2x4': '3020' }, out = [];
  const layers = o.layers || [[4, 2, 0, 0], [4, 2, 2, 1], [2, 4, 1, 2]];
  layers.forEach(([bw, bd, ox, oz], L) => { const ops = []; out.push(G('deck layer ' + (L + 1), 0, 0, ops));   // a group per layer: the DSL runs at most 200 children of a group
    for (let gx = -ox; gx < w; gx += bw) for (let gz = -oz; gz < d; gz += bd) {
      const x0 = Math.max(0, gx), z0 = Math.max(0, gz), x1 = Math.min(w, gx + bw), z1 = Math.min(d, gz + bd), a = x1 - x0, b = z1 - z0; if (a <= 0 || b <= 0) continue;
      const lo = Math.min(a, b), hi = Math.max(a, b), id = SIZE[lo + 'x' + hi]; if (!id) continue;
      ops.push(part(id, col, x + x0, z + z0, y, { plate: L, rot: a >= b ? 0 : 1 }));
    }
  });
  return out;
}
/** A rail fence of len studs from (x, z), along x or along z: 1×1 round posts every three studs, two bricks high, and
    1×4 plate rails in two runs, the second a plate up over the gaps and seated on the ends of the first. */
function fence(x, z, len, alongX, col = 308) {
  const ops = [], at = k => alongX ? [x + k, z] : [x, z + k], rot = alongX ? 0 : 1, last = Math.floor((len - 1) / 3) * 3;
  for (let k = 0; k <= last; k += 3) { const [px, pz] = at(k); ops.push(part('3062b', col, px, pz, 0), part('3062b', col, px, pz, 1)); }
  for (let k = 0; k + 3 <= last; k += 6) { const [px, pz] = at(k); ops.push(part('3710', col, px, pz, 2, { rot })); }
  for (let k = 3; k + 3 <= last; k += 6) { const [px, pz] = at(k); ops.push(part('3710', col, px, pz, 2, { rot, plate: 1 })); }
  if (last > 0 && last % 6 === 0) { const [px, pz] = at(last); ops.push(part('3024', col, px, pz, 2)); }   // a last post only the second run reaches: a cap under its end
  return ops;
}
/** A rocking chair on a floor plate, facing south: two rockers, each a pair of inverted curved slopes back to back, a 2×4 plate
    across them, a minifig seat on the plate. Four studs deep along z, two wide. y in bricks; plate: the floor's plates under it. */
function rocker(x, z, col = 308, y = 0, plate = 1) {
  const ops = []; for (const dx of [0, 1]) ops.push(part('24201', col, x + dx, z, y, { plate, rot: 0 }), part('24201', col, x + dx, z + 2, y, { plate, rot: 2 }));
  ops.push(part('3020', col, x, z, y + 1, { plate, rot: 1 }), part('4079', col, x, z + 1, y + 1, { plate: plate + 1 }));
  return G('rocking chair', 0, 0, ops);
}
/** A warehouse pallet rack along x, len studs long and two deep: orange uprights (1×1 round columns) at the ends and every
    six studs; a beam deck at every `step` bricks (the kit's deck: three bonded plate layers, a brick's worth, over the uprights,
    which go on through it); cardboard cases (2×2 bricks) on the floor and on every deck, one or two high, with gaps. */
function rack(x, z, len, rnd, o = {}) {
  const ORANGE = o.col == null ? 25 : o.col, step = o.step || 3, levels = o.levels || 3, CASES = o.cases || [19, 28, 84, 19, 28, 15, 1, 4, 19], ops = [];
  const ups = []; for (let i = 0; i < len; i += 6) ups.push(i); if (ups[ups.length - 1] !== len - 1) ups.push(len - 1);
  const top = levels * step, Z = !!o.alongZ, at = (i, j) => Z ? [j, i] : [i, j];   // alongZ: the rack laid north to south (its own axes swapped, not a group turn: a turn misplaces multi-stud plates)
  for (const i of ups) for (const j of [0, 1]) for (let y = 0; y <= top; y++) if (y % step !== 0 || y === 0) { const [px, pz] = at(i, j); ops.push(part('3062b', ORANGE, px, pz, y)); }   // the uprights, through every level but the decks' own bricks
  for (let lv = 1; lv <= levels; lv++) ops.push(...(Z ? deck(0, 0, 2, len, ORANGE, lv * step) : deck(0, 0, len, 2, ORANGE, lv * step)));
  for (let lv = 0; lv <= levels; lv++) {
    const y0 = lv ? lv * step + 1 : 0, room = lv < levels ? step - (lv ? 1 : 0) : 2;
    for (let i = 0; i + 1 < len; i += 2) { if (ups.some(u => u === i || u === i + 1)) continue; if (rnd() < 0.2) continue; const col = CASES[Math.floor(rnd() * CASES.length)], hh = Math.min(room, rnd() > 0.45 ? 2 : 1);
      const [px, pz] = at(i, 0); for (let k = 0; k < hh; k++) ops.push(part('3003', col, px, pz, y0 + k)); }
  }
  return G(o.name || 'rack', x, z, ops, o.turn ? { turn: o.turn } : {});
}
module.exports = { G, deck, fence, rocker, rack, box, slab, cut, part, window, door, roof, stairs, arch, seeded, bigWindow, checker, shelf, tree, bush, rock, log, fire, lamp, cart };
