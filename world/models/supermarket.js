/* world/models/supermarket.js — the Springfield supermarket for The List, as a store a shopper can work through: 124 × 95 studs (62 × 47.5 m).
   The plan is a real store's (the working paper's floor plan): the street and the entrance at the front (north, z low), the
   checkouts along the front, produce down the west wall, seven numbered aisles of double-faced gondolas in the middle,
   dairy along the back wall, frozen along the east wall, the meat counter in the back west corner.

     - the pavement z 0..7; the vestibule stands out from the front wall (x 52..71, z 2..7): two door frames, carts parked either side;
     - the front wall z 8, open into the store at x 57..66 under a bonded lintel; fourteen bricks, a red band, a dark parapet; FOOD over the door;
     - the checkouts (x 75..115, z 13..21): five lanes, counter, belt, register, bagging shelf, a lane light, sweets at the lane's mouth;
     - the service desk and a flower stand west of the entrance (x 32..46, z 11..19);
     - produce (x 1..27): a stepped misted rack down the west wall (greens, carrots, peppers, tomatoes...), the banana stand at the
       front (green bananas west, yellow east), ten fruit tables, the berry case (blackberries, blueberries, raspberries);
     - the action alley across the front of the aisles (z 24..29), the back aisle (z 80..88);
     - eight gondolas (x 28 + 11k, five studs wide, z 32..77): a kick base, a spine, four rows of goods on each face on white shelves,
       an end cap at each end; aisle k runs between gondola k and k+1, six studs wide (a cart and a figure pass), a gantry over its
       front end carries its number in white on blue, readable from the front and from the back;
     - dairy along the back wall (x 28..117, z 89..93) and frozen along the east wall (x 118..122, z 30..87): glass doors in white
       frames, three shelves of goods behind them, a blue band over;
     - the meat counter (x 3..22, z 84..92): a glass case, the butcher's back counter;
     - a floor of tiles: plain white in the aisles, grey bands along the alleys, a tan checker in produce, a grey pavement.

   The five things on the list are in the store where a shopper would look for them: (1) green bananas on the banana stand,
   (2) blackberries in the berry case, (3) extra virgin olive oil in aisle 3, (4) organic flour in aisle 4, (5) southwest style
   hash browns behind the frozen doors. `plan` carries their places, the aisles and the zones in studs for the game (world/shop.js). */
'use strict';
const K = require('./kit.js');
const { G, box, slab, cut, part } = K;
const rnd = K.seeded(37);
const W = 124, D = 95;
const WHITE = 15, GREY = 71, DARK = 72, RED = 4, YELLOW = 14, BLUE = 1, TAN = 19, BROWN = 70, GLASS = 47, DKTAN = 28, DKGREEN = 288;
/** Ops in groups of at most 150 children (the DSL runs at most 200 children of a group). */
const chunks = (name, ops, n = 150) => { const out = []; for (let i = 0; i < ops.length; i += n) out.push(G(name + (ops.length > n ? ' ' + (i / n + 1) : ''), 0, 0, ops.slice(i, i + n))); return out; };
/** A wall run along x or z in pieces of at most 60 studs (a box op takes at most 64). */
function wallRun(x, z, len, alongX, h, col, o = {}) { const ops = []; for (let k = 0; k < len; k += 60) { const n = Math.min(60, len - k); ops.push(alongX ? box(x + k, z, n, 1, h, col, o) : box(x, z + k, 1, n, h, col, o)); } return ops; }
/** A fill at a plate height: x, z, w, d in studs, p0 and n in plates (the slab op, cut in runs of 60 and of 12 plates). */
function fill(x, z, w, d, p0, n, col) { const ops = []; for (let i = 0; i < w; i += 60) for (let j = 0; j < d; j += 60) for (let q = 0; q < n; q += 12) ops.push(slab(x + i, z + j, Math.min(60, w - i), Math.min(60, d - j), col, { plateOffset: p0 + q, plates: Math.min(12, n - q) })); return ops; }
/** A part at a plate height (the kit's part takes bricks and plates). */
const at = (id, col, x, z, p, rot = 0) => part(id, col, x, z, Math.floor(p / 3), { plate: p % 3, rot });

/* ── the floor: every cell nothing stands on at the ground gets a tile ── */
const occ = new Set(), cell = (x, z) => x + ',' + z;
const mark = (x, z, w, d) => { for (let i = x; i < x + w; i++) for (let j = z; j < z + d; j++) occ.add(cell(i, j)); };
const pick = a => a[Math.floor(rnd() * a.length)];

/* ── goods: what stands on a shelf, one stud deep; h in plates, n studs along the shelf ── */
const GOODS = {
  can: { id: '3062b', h: 3, n: 1 }, cube: { id: '3005', h: 3, n: 1 }, box: { id: '3004', h: 3, n: 2 }, pack: { id: '3010', h: 3, n: 4 },
  tall: { id: '3245c', h: 6, n: 2 }, bottle: { id: '95228', h: 6, n: 1 },
};
/** The categories a face is stocked with: the kinds of goods and their colours. */
const CAT = {
  bread: [['box', [19, 28, 84, 15, 70]], ['cube', [19, 28]]],
  cereal: [['tall', [4, 14, 1, 25, 2, 5, 322]], ['box', [4, 14, 1, 25]]],
  coffee: [['can', [0, 70, 308, 4, 320]], ['box', [70, 308, 0]]],
  canned: [['can', [4, 15, 2, 1, 14, 25, 320]]],
  soup: [['can', [4, 15, 4, 15, 320]], ['box', [4, 15]]],
  oil: [['bottle', [46, 19, 47, 28, 46]], ['can', [46, 14]]],
  condiments: [['bottle', [4, 14, 15, 0, 320]], ['can', [4, 14, 2, 28, 25]]],
  baking: [['box', [15, 15, 19, 4, 1, 14]], ['cube', [25, 14, 15, 5]]],
  spices: [['cube', [4, 70, 25, 14, 288, 0, 320]], ['can', [70, 4, 15]]],
  pasta: [['box', [1, 4, 14, 2, 15]], ['tall', [1, 4, 14, 25]]],
  intl: [['can', [4, 2, 14, 15, 0]], ['box', [4, 15, 288, 25]]],
  snacks: [['box', [4, 14, 25, 1, 2, 5, 26]], ['tall', [4, 14, 25, 1]]],
  drinks: [['bottle', [4, 36, 33, 34, 46, 47, 1, 2, 0]], ['tall', [4, 1, 2, 14]], ['can', [4, 1, 2, 14, 0, 15]]],
  household: [['tall', [15, 1, 322, 14, 2, 5]], ['box', [15, 1, 5, 85]]],
  paper: [['pack', [15, 1, 15]], ['tall', [15, 1]]],
  baby: [['box', [15, 5, 322, 14]], ['can', [15, 5, 322]], ['tall', [15, 322, 5]]],
  dairy: [['box', [15, 15, 19, 14, 25]], ['can', [15, 5, 322, 14]], ['cube', [14, 15]]],
  frozen: [['box', [1, 15, 4, 322, 2, 14]], ['cube', [15, 4, 1]], ['pack', [1, 4, 15]]],
};
/** One row of goods along a line, from a (inclusive) to b (exclusive), h plates tall, stocked from a category (or, for a stretch, an
    override: the thing on the list). place(i, n, p, g, col) lays one: i along the line, p its plate over the row's floor. */
function stockRow(a, b, h, cat, place, over, full) {
  for (let i = a; i < b;) {
    const o = over && over.find(v => i >= v.from && i < v.to), stop = o ? o.to : ((over || []).filter(v => v.from > i).map(v => v.from).sort((p, q) => p - q)[0] ?? b);
    let kind, col; if (o) { kind = o.kind; col = pick(o.cols); } else { const c = pick(CAT[cat]); kind = c[0]; col = pick(c[1]); }
    let g = GOODS[kind]; const room = Math.min(b, stop) - i;
    if (g.h > h) g = GOODS.box; if (g.n > room) g = GOODS.cube;   // what fits the shelf's height and the stretch that is left
    if (!o && !full && rnd() < 0.04) { i += 1; continue; }   // a gap where something sold
    for (let p = 0; p + g.h <= h; p += g.h) place(i, g.n, p, g, col);   // a tall shelf of short goods: stacked two high
    i += g.n;
  }
}

/** A gondola along z at (x, z), five studs wide, len long: a kick base, a spine three studs wide, levels of goods on both faces
    under white shelves, a top row. levels: the goods' heights in plates; the top shelf always stands at plate 15, the top row to 18. */
function gondola(name, x, z, len, west, east, levels, over = {}) {
  const ops = [], base = 15 - levels.reduce((s, h) => s + h + 1, 0);
  let p = base; const rows = [...levels.map(h => { const r = [p, h]; p += h + 1; return r; }), [15, 3]];
  rows.forEach(([p0, h], k) => {
    for (const [face, dx, cat] of [['west', 0, west], ['east', 4, east]]) {
      const ov = (over[face] || []).filter(o => o.row == null || o.row === k);
      stockRow(z + 1, z + len - 1, h, cat, (i, n, pp, g, col) => ops.push(at(g.id, col, x + dx, i, p0 + pp, g.n > 1 ? 1 : 0)), ov, k === levels.length - 1);   // the row under the top shelf is kept full: it holds the shelf's edge
    }
  });
  const shell = [...fill(x, z, 5, len, 0, base, DARK)];
  rows.slice(0, -1).forEach(([p0, h]) => { shell.push(...fill(x + 1, z, 3, len, p0, h, GREY), ...fill(x, z, 5, len, p0 + h, 1, WHITE)); });
  for (const [cx, cz] of [[x, z], [x + 4, z], [x, z + len - 1], [x + 4, z + len - 1]]) rows.slice(0, -1).forEach(([p0, h]) => shell.push(...fill(cx, cz, 1, 1, p0, h, GREY)));   // the end posts: the corner cells, grey to the top shelf
  mark(x, z, 5, len);
  return [...chunks(name + ' goods', ops), ...chunks(name, shell)];
}
/** An end cap: a short display against a gondola's end, five wide and two deep, three rows of goods facing out. */
function endCap(name, x, z, facing, cat) {
  const ops = [], front = facing === 'n' ? z : z + 1, back = facing === 'n' ? z + 1 : z;
  [[3, 3], [7, 3], [11, 3]].forEach(([p0, h]) => stockRow(x, x + 5, h, cat, (i, n, pp, g, col) => ops.push(at(g.id, col, i, front, p0 + pp)), null, true));   // an end cap is kept full
  const shell = [...fill(x, z, 5, 2, 0, 3, RED), ...fill(x, back, 5, 1, 3, 3, GREY), ...fill(x, back, 5, 1, 7, 3, GREY), ...fill(x, back, 5, 1, 11, 3, GREY), ...fill(x, z, 5, 2, 6, 1, WHITE), ...fill(x, z, 5, 2, 10, 1, WHITE), ...fill(x, z, 5, 2, 14, 1, RED)];
  mark(x, z, 5, 2);
  return [G(name + ' goods', 0, 0, ops), G(name, 0, 0, shell)];
}
/** A cooler bank five deep: glass doors in white frames along the front, three shelves of goods behind them, a blue band over.
    Along x (facing north: the doors at z) or along z (facing west: the doors at x). over: the thing on the list. */
function cooler(name, x, z, len, alongX, cat, over) {
  const pos = (i, j) => alongX ? [x + i, z + j] : [x + j, z + i], ops = [], doors = [], shell = [];
  for (let i = 0; i + 1 < len; i += 2) { const [px, pz] = pos(i, 0); doors.push(at('60592', WHITE, px, pz, 3, alongX ? 0 : 1), at('60592', WHITE, px, pz, 9, alongX ? 0 : 1)); }
  [[3, 3], [7, 3], [11, 3]].forEach(([p0, h], k) => stockRow(0, len, h, cat, (i, n, pp, g, col) => { const [px, pz] = pos(i, 1); ops.push(at(g.id, col, px, pz, p0 + pp, alongX ? 0 : (g.n > 1 ? 1 : 0))); }, (over || []).filter(o => o.row == null || o.row === k)));
  const R = (j0, nj) => { const [a, b] = pos(0, j0); return alongX ? [a, b, len, nj] : [a, b, nj, len]; };
  const all = R(0, 5), back = R(2, 3), goods = R(1, 1);
  shell.push(...fill(...all, 0, 3, DARK), ...fill(...back, 3, 12, DARK), ...fill(...goods, 6, 1, GLASS), ...fill(...goods, 10, 1, GLASS), ...fill(...goods, 14, 1, DARK));
  shell.push(...fill(...all, 15, 3, BLUE), ...fill(...all, 18, 1, WHITE));
  mark(...all);
  return [...chunks(name + ' goods', ops), ...chunks(name + ' doors', doors), ...chunks(name, shell)];
}

/* ── the numbers over the aisles: a 3 × 5 face in white bricks let into a blue board ── */
const DIGITS = { 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '010', '010'] };
/** A gantry over an aisle's front end: posts on the two gondolas' spines (the east stud of one, the west stud of the next, so two
    neighbouring gantries never share a post), a beam of bonded 2 × 8 and 2 × 2 bricks across, a board seven bricks tall with the
    aisle's number on both faces (the front read from the north, where the model's x runs right to left). */
function gantry(n, a, z) {
  const ops = [];
  for (const x of [a, a + 9]) for (const zz of [z, z + 1]) ops.push(at('3062b', GREY, x, zz, 15), at('3062b', GREY, x, zz, 18));
  ops.push(at('3007', DARK, a, z, 21), at('3003', DARK, a + 8, z, 21), at('3003', DARK, a, z, 24), at('3007', DARK, a + 2, z, 24));
  ops.push(box(a, z, 10, 2, 7, BLUE, { y: 9 }));
  DIGITS[n].forEach((row, r) => [...row].forEach((c, i) => { if (c !== '1') return; const y = 14 - r;
    ops.push(cut(a + 5 - i, z, 1, 1, y, 1), part('3005', WHITE, a + 5 - i, z, y), cut(a + 3 + i, z + 1, 1, 1, y, 1), part('3005', WHITE, a + 3 + i, z + 1, y)); }));
  return G('aisle ' + n + ' sign', 0, 0, ops);
}

/* ── the plan ── */
const GX = k => 28 + (k - 1) * 11;                          // gondola k's west edge (k = 1..8)
const GZ = 32, GLEN = 46;                                   // gondolas z 32..77
const AISLES = [
  { n: 1, name: 'Cereal & Coffee', west: 'cereal', east: 'coffee' },
  { n: 2, name: 'Canned Goods & Soup', west: 'canned', east: 'soup' },
  { n: 3, name: 'Oils, Vinegar & Condiments', west: 'oil', east: 'condiments' },
  { n: 4, name: 'Baking & Spices', west: 'baking', east: 'spices' },
  { n: 5, name: 'Pasta, Rice & International', west: 'pasta', east: 'intl' },
  { n: 6, name: 'Snacks & Drinks', west: 'snacks', east: 'drinks' },
  { n: 7, name: 'Household & Paper', west: 'household', east: 'paper' },
];
// gondola k: its west face is aisle k-1's east side, its east face aisle k's west side
const FACES = k => [k === 1 ? 'bread' : AISLES[k - 2].east, k === 8 ? 'baby' : AISLES[k - 1].west];
const LEVELS = { 3: [3, 6], 4: [3, 6], 7: [3, 6] };        // the bottle gondolas: a tall shelf for bottles and big boxes
const ITEMS = [
  { n: 1, name: 'green bananas', where: 'Produce, the banana stand', shelf: [11, 17], at: [11, 22] },
  { n: 2, name: 'black berries', where: 'Produce, the berry case', shelf: [9, 67], at: [9, 64] },
  { n: 3, name: 'extra virgin olive oil', where: 'Aisle 3, oils, the tall shelf', shelf: [GX(3) + 4, 47], at: [GX(3) + 6, 47] },
  { n: 4, name: 'organic flour', where: 'Aisle 4, baking, the tall shelf', shelf: [GX(4) + 4, 62], at: [GX(4) + 6, 62] },
  { n: 5, name: 'southwest style hash browns', where: 'Frozen, the east wall doors', shelf: [119, 43], at: [115, 43] },
];

function program() {
  occ.clear();
  const ops = [];
  // ── the building: the front wall with its opening, the other three, the red band, the parapet, windows, the name ──
  const front = [...wallRun(0, 8, 57, true, 14, WHITE), ...wallRun(67, 8, 57, true, 14, WHITE)];
  for (const x of [4, 10, 16, 22, 28, 34, 40, 46, 76, 82, 88, 94, 100, 106, 112, 118]) front.push(...K.bigWindow(x, 8, 1));
  ops.push(G('front wall', 0, 0, front));
  // the lintel over the opening: two courses of explicit bricks bonded across it and onto the wall ends, the wall painted on above
  ops.push(G('lintel', 0, 0, [at('3008', WHITE, 56, 8, 18), at('3010', WHITE, 64, 8, 18), at('3010', WHITE, 56, 8, 21), at('3008', WHITE, 60, 8, 21), box(57, 8, 10, 1, 6, WHITE, { y: 8 })]));
  ops.push(G('walls', 0, 0, [...wallRun(0, 94, 124, true, 14, WHITE), ...wallRun(0, 9, 85, false, 14, WHITE), ...wallRun(123, 9, 85, false, 14, WHITE)]));
  mark(0, 8, 57, 1); mark(67, 8, 57, 1); mark(0, 94, 124, 1); mark(0, 9, 1, 85); mark(123, 9, 1, 85);
  const ring = (y, h, col) => [...wallRun(0, 8, 124, true, h, col, { y }), ...wallRun(0, 94, 124, true, h, col, { y }), ...wallRun(0, 9, 85, false, h, col, { y }), ...wallRun(123, 9, 85, false, h, col, { y })];
  ops.push(G('band', 0, 0, ring(14, 2, RED)), G('parapet', 0, 0, ring(16, 1, DARK)));
  const FONT = { F: ['111', '100', '110', '100', '100'], O: ['111', '101', '101', '101', '111'], D: ['110', '101', '101', '101', '110'] }, sign = [];
  [...'FOOD'].forEach((ch, k) => FONT[ch].forEach((row, r) => [...row].forEach((c, i) => { if (c === '1') { const x = 69 - (k * 4 + i), y = 13 - r;   /* read from the street, looking south: the model's x runs right to left there */ sign.push(cut(x, 8, 1, 1, y, 1), part('3005', RED, x, 8, y)); } })));
  ops.push(G('the name', 0, 0, sign));
  // ── the vestibule: out from the front wall, two door frames, windows either side, a plate roof; carts parked along its sides ──
  const vest = [...wallRun(52, 2, 20, true, 8, WHITE), box(52, 3, 1, 5, 8, WHITE), box(71, 3, 1, 5, 8, WHITE)];
  vest.push(cut(57, 2, 4, 1, 0, 6), part('60596', DARK, 57, 2, 0), cut(63, 2, 4, 1, 0, 6), part('60596', DARK, 63, 2, 0), ...K.bigWindow(53, 2, 1), ...K.bigWindow(67, 2, 1), ...K.bigWindow(52, 4, 1, WHITE, true), ...K.bigWindow(71, 4, 1, WHITE, true));
  ops.push(G('vestibule', 0, 0, vest), ...K.deck(52, 2, 20, 6, DARK, 8));
  mark(52, 2, 20, 1); mark(52, 3, 1, 5); mark(71, 3, 1, 5);
  ops.push(G('carts', 0, 0, [K.cart(53, 3, RED), K.cart(53, 5, RED), K.cart(67, 3, RED), K.cart(67, 5, BLUE)])); mark(53, 3, 4, 4); mark(67, 3, 4, 4);
  // ── the checkouts: five lanes along the front, counter and belt north to south, the customer west, the clerk east ──
  for (let i = 0; i < 5; i++) {
    const x = 78 + i * 8;
    ops.push(G('checkout ' + (i + 1), x, 13, [
      box(0, 0, 2, 9, 2, DARK), slab(0, 0, 2, 9, 0, { y: 2 }), ...[1, 3, 5].map(z => part('3068b', 0, 0, z, 2, { plate: 1 })),
      box(2, 6, 2, 3, 2, GREY), part('3039', DARK, 2, 6, 2, { rot: 1 }), part('3024', 36, 2, 8, 2), part('3024', 46, 3, 8, 2),
      box(-3, 0, 3, 2, 1, WHITE), part('3005', BROWN, -3, 0, 1), part('3005', TAN, -2, 1, 1),
      ...[0, 1, 2, 3, 4, 5].map(y => part('3062b', GREY, 3, 1, y)), part('3005', i === 0 ? 46 : 14, 3, 1, 6), part('3024', RED, 3, 1, 7),
      box(-1, 7, 1, 2, 2, RED), ...[0, 1].map(z => part('3024', pick([14, 4, 1, 25, 5]), -1, 7 + z, 2))]));   // sweets at the lane's mouth
    mark(x - 3, 13, 7, 9);
  }
  // ── the service desk and flowers, west of the entrance ──
  ops.push(G('service desk', 32, 11, [box(0, 0, 14, 3, 2, WHITE), slab(0, 0, 14, 3, BLUE, { y: 2 }), part('3004', GREY, 10, 0, 2, { plate: 1 }), part('3024', 46, 10, 0, 3, { plate: 1 })])); mark(32, 11, 14, 3);
  const flowers = [box(0, 0, 8, 3, 1, DKGREEN)]; for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) flowers.push(part('3062b', 2, i, j, 1), part('4073', pick([4, 14, 5, 26, 15, 25, 85]), i, j, 2));
  ops.push(G('flowers', 38, 16, flowers)); mark(38, 16, 8, 3);
  // ── produce: the stepped misted rack down the west wall: three steps of produce, a dark green back panel, a canopy ──
  const SECT = [[['3062b', [2, 10]]], [['3062b', [27, 326]]], [['3062b', [DKGREEN]], ['4073', [DKGREEN, 2]]], [['3062b', [25]], ['4073', [2, 10]]],
    [['3062b', [4, 14, 2, 25]]], [['6141', [4, 320]], ['6141', [4]]], [['3062b', [DKGREEN, 2]]], [['3062b', [85, 26]]],
    [['4073', [15, 19]], ['4073', [19, 84]]], [['3062b', [19, 15, 320]]], [['3062b', [28, 84]]]];   // lettuce, celery, broccoli, carrots, peppers, tomatoes, cucumbers, eggplant, mushrooms, onions, potatoes
  const rack = [], rackShell = [];
  SECT.forEach((spec, s) => { for (let z = 13 + s * 6; z < 19 + s * 6; z++) for (let j = 0; j < 3; j++) { let p = 3 + j * 3; for (const [id, cols] of spec) { rack.push(at(id, pick(cols), 4 - j, z, p)); p += id === '3062b' ? 3 : 1; } } });
  for (let j = 0; j < 3; j++) rackShell.push(...fill(4 - j, 13, 1, 66, 0, 3 + j * 3, j % 2 ? DKTAN : BROWN));
  rackShell.push(...fill(1, 13, 1, 66, 0, 24, DKGREEN), ...fill(1, 13, 4, 66, 24, 1, DKGREEN));   // the back panel and the canopy it carries
  ops.push(...chunks('produce rack goods', rack), ...chunks('produce rack', rackShell)); mark(1, 13, 4, 66);
  // the banana stand at the front of produce: green bananas west, yellow east, a bunch to a cell, lying every way
  const ban = [box(0, 0, 14, 5, 1, BROWN), slab(0, 0, 14, 5, TAN, { y: 1 })];
  for (let i = 0; i < 14; i++) for (let j = 0; j < 5; j++) ban.push(part('33085', i < 7 ? 10 : 14, i, j, 1, { plate: 1, rot: Math.floor(rnd() * 4) }));
  ops.push(G('banana stand', 8, 15, ban)); mark(8, 15, 14, 5);
  // ten fruit tables: crates heaped with round fruit, two layers
  const FRUIT = [[4, 320], [10, 2], [25, 25], [14, 14], [10, 27], [25, 4], [28, 84], [19, 15], [DKGREEN, 2], [85, 320]];   // apples red, apples green, oranges, lemons, limes, peaches, potatoes, onions, avocados, plums
  FRUIT.forEach(([a, b], t) => {
    const x = t % 2 ? 17 : 8, z = 26 + Math.floor(t / 2) * 8, heap = [box(0, 0, 5, 4, 1, BROWN)];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) heap.push(part('6141', rnd() > 0.5 ? a : b, i, j, 1));
    for (let i = 1; i < 4; i++) for (let j = 1; j < 3; j++) heap.push(part('6141', rnd() > 0.5 ? a : b, i, j, 1, { plate: 1 }));
    ops.push(G('fruit table ' + (t + 1), x, z, heap)); mark(x, z, 5, 4);
  });
  // the berry case: a low white refrigerated case, punnets of clear plates heaped with round tiles: blackberries west, blueberries, raspberries
  const berries = [box(0, 0, 14, 4, 1, WHITE)], BERRY = [0, 0, 272, 272, 4, 4, 0];
  for (let i = 0; i < 7; i++) for (const j of [0, 2]) { berries.push(part('3022', GLASS, i * 2, j, 1)); for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) berries.push(part('98138', BERRY[i], i * 2 + a, j + b, 1, { plate: 1 })); }
  ops.push(G('berry case', 8, 66, berries)); mark(8, 66, 14, 4);
  // ── the meat counter in the back west corner: a glass-fronted case, meats behind, the butcher's back counter ──
  const meat = [box(0, 0, 20, 2, 1, WHITE)]; for (let i = 0; i < 10; i++) meat.push(part('3004', GLASS, i * 2, 0, 1), part('3004', pick([4, 320, 5, 4, 26]), i * 2, 1, 1));
  meat.push(slab(0, 0, 20, 2, GLASS, { y: 2 }));
  ops.push(G('meat case', 3, 84, meat), G('butcher counter', 3, 91, [box(0, 0, 20, 2, 2, WHITE), slab(0, 0, 20, 2, DARK, { y: 2 }), part('3024', GREY, 4, 0, 2, { plate: 1 }), part('3024', GREY, 12, 1, 2, { plate: 1 })]));
  mark(3, 84, 20, 2); mark(3, 91, 20, 2);
  // ── the gondolas, their end caps, the aisle signs ──
  const ENDS = ['snacks', 'drinks', 'cereal', 'canned', 'baking', 'pasta', 'household', 'snacks'];
  for (let k = 1; k <= 8; k++) {
    const [west, east] = FACES(k), over = {};
    if (k === 3) over.east = [{ from: 44, to: 51, row: 1, kind: 'bottle', cols: [330] }];            // (3) extra virgin olive oil: olive green bottles, the tall shelf, aisle 3
    if (k === 4) over.east = [{ from: 59, to: 66, row: 1, kind: 'box', cols: [DKTAN] }];             // (4) organic flour: kraft paper bags on the tall shelf, aisle 4 (plain flour in white along from it)
    ops.push(...gondola('gondola ' + k, GX(k), GZ, GLEN, west, east, LEVELS[k] || [3, 3, 3], over));
    ops.push(...endCap('end cap ' + k + ' front', GX(k), GZ - 2, 'n', ENDS[k - 1]), ...endCap('end cap ' + k + ' back', GX(k), GZ + GLEN, 's', ENDS[(k + 3) % 8]));
  }
  for (const a of AISLES) ops.push(gantry(a.n, GX(a.n) + 3, GZ));
  // ── dairy along the back wall, frozen along the east wall ──
  ops.push(...cooler('dairy', 28, 89, 44, true, 'dairy'), ...cooler('dairy east', 74, 89, 44, true, 'dairy'));
  ops.push(...cooler('frozen', 118, 30, 58, false, 'frozen', [{ from: 10, to: 16, row: 1, kind: 'box', cols: [25] }]));   // (5) southwest style hash browns: orange bags behind the sixth door, the middle shelf
  // ── outside: the pavement's lamps, the pylon, a cart corral ──
  ops.push(K.lamp(30, 3), K.lamp(94, 3)); mark(30, 3, 1, 1); mark(94, 3, 1, 1);
  ops.push(G('pylon', 104, 1, [box(0, 0, 2, 2, 10, GREY), box(8, 0, 2, 2, 10, GREY), box(0, 0, 10, 2, 3, RED, { y: 10 }), ...[2, 4, 6].map(x => [cut(x, 0, 1, 1, 11, 1), part('3005', YELLOW, x, 0, 11)]).flat()])); mark(104, 1, 2, 2); mark(112, 1, 2, 2);
  ops.push(G('cart corral', 8, 1, [...K.fence(0, 0, 13, true, GREY), K.cart(1, 2, RED), K.cart(6, 2, RED)])); mark(8, 1, 13, 1); mark(9, 3, 9, 2);
  // ── the floor, last: tiles over every free cell, by zone ──
  ops.push(...floor());
  return { name: 'supermarket', ops };
}

/** Tiles over the free cells of a zone, biggest first: 8 × 16, 4 × 4, 2 × 4, 2 × 2, 1 × 2, 1 × 1. */
const TILES = [['48288', 16, 8, 0], ['48288', 8, 16, 1], ['1751', 4, 4, 0], ['87079', 4, 2, 0], ['87079', 2, 4, 1], ['3068b', 2, 2, 0], ['3069b', 2, 1, 0], ['3069b', 1, 2, 1], ['3070b', 1, 1, 0]];
function tileZone(x0, z0, w, d, col, used) {
  const out = [], free = (x, z, a, b) => { for (let i = x; i < x + a; i++) for (let j = z; j < z + b; j++) if (i >= x0 + w || j >= z0 + d || occ.has(cell(i, j)) || used.has(cell(i, j))) return false; return true; };
  for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) {
    if (!free(x, z, 1, 1)) continue;
    for (const [id, a, b, rot] of TILES) {
      if (a >= 4 && b >= 4 && ((x - x0) % a || (z - z0) % b)) continue;   // the big tiles on their own grid, so the joints run straight
      if (!free(x, z, a, b)) continue; for (let i = x; i < x + a; i++) for (let j = z; j < z + b; j++) used.add(cell(i, j));
      out.push(part(id, typeof col === 'function' ? col(x, z) : col, x, z, 0, { rot })); break;
    }
  }
  return out;
}
function floor() {
  const used = new Set(), out = [];
  out.push(...chunks('floor produce', tileZone(1, 9, 27, 85, (x, z) => ((x >> 2) + (z >> 2)) % 2 ? TAN : DKTAN, used)));   // produce: a tan checker, a market's boards
  out.push(...chunks('floor alleys', [...tileZone(28, 24, 95, 8, GREY, used), ...tileZone(28, 78, 95, 11, GREY, used)]));   // the action alley and the back aisle: grey bands
  out.push(...chunks('floor store', tileZone(28, 9, 95, 85, WHITE, used)));   // the rest of the store: plain white
  out.push(...chunks('pavement', tileZone(0, 0, 124, 8, GREY, used)));
  return out;
}

const plan = {
  size: [W, D], entrance: [62, 1], door: [62, 9],
  aisles: AISLES.map(a => ({ n: a.n, name: a.name, x0: GX(a.n) + 5, x1: GX(a.n + 1), z0: GZ, z1: GZ + GLEN, sign: [GX(a.n) + 8, GZ + 1], west: a.west, east: a.east })),
  zones: [{ name: 'Produce', x0: 1, x1: 27, z0: 9, z1: 80 }, { name: 'Meat & Seafood', x0: 1, x1: 27, z0: 80, z1: 94 }, { name: 'Dairy', x0: 28, x1: 118, z0: 78, z1: 94 }, { name: 'Frozen', x0: 110, x1: 123, z0: 24, z1: 78 },
    { name: 'Checkouts', x0: 72, x1: 123, z0: 9, z1: 24 }, { name: 'Entrance', x0: 52, x1: 72, z0: 0, z1: 14 }, { name: 'Service Desk', x0: 28, x1: 52, z0: 9, z1: 24 }, { name: 'Bread', x0: 22, x1: 28, z0: 30, z1: 78 }, { name: 'Front of Store', x0: 28, x1: 110, z0: 24, z1: 32 }],
  items: ITEMS, lanes: [0, 1, 2, 3, 4].map(i => ({ n: i + 1, belt: [78 + i * 8 + 1, 17], customer: [78 + i * 8 - 2, 18], clerk: [78 + i * 8 + 5, 17] })),
};
module.exports = { name: 'supermarket', title: 'The Supermarket', description: 'The Springfield supermarket for The List, a store to shop in: a vestibule with carts, five checkout lanes, a service desk and flowers; produce down the west wall (a stepped misted rack, a banana stand, ten fruit tables, a berry case); seven numbered aisles of stocked double-faced gondolas with end caps and number gantries; dairy along the back wall and frozen along the east wall behind glass doors; a meat counter; a tiled floor; the name over the door.', program, scale: 1, plan };
