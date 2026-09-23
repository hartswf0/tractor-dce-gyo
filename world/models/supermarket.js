/* world/models/supermarket.js — the whole Springfield supermarket for The List, 96 × 72 studs (48 × 36 m).
   The street is north (z 0..5): a pavement, a cart corral, lamp posts, the store's pylon. The store is a white box
   eight bricks high (x 2..93, z 6..69) with a red band and a dark parapet, shop windows along the front and a wide
   entrance of two open door frames in the middle (x 44..51). Inside, on a checkered floor of 4×4 plates:
     - the four checkout lanes at the front east (x 58..89, z 9..17): counter, belt, register, bagging shelf, a lane light;
     - produce at the front west (x 5..40, z 10..22): four tables heaped with fruit and greens, a banana stand;
     - ten aisles of gondolas running north to south (x 8..71, z 26..55), goods both faces, an end cap and a sign post at the north end of each;
     - the bakery along the east wall (x 84..91, z 22..38): bread racks and a counter;
     - the deli along the east wall (x 80..91, z 42..56): a glass case of meats and cheese;
     - the dairy cooler along the south wall (x 4..63, z 65..67): white, glass doors, milk and eggs behind them;
     - the chest freezers (x 66..89, z 60..62): white, trans-blue lids.
   The aisles are two studs apart (a metre, a figure and a cart pass); the main aisle across the front (z 18..25) and the
   back aisle (z 56..63) join them. */
'use strict';
const K = require('./kit.js');
const { G, box, slab, cut, part } = K;
const rnd = K.seeded(21);
const WHITE = 15, GREY = 71, DARK = 72, RED = 4, YELLOW = 14, BLUE = 1, TAN = 19, BROWN = 70, GLASS = 47, ICE = 43;
const GOODS = [4, 14, 1, 2, 25, 15, 5, 322, 27, 191, 26, 70];
/** Ops in groups of at most 150 children (the DSL runs at most 200 children of a group). */
const chunks = (name, ops, n = 150) => { const out = []; for (let i = 0; i < ops.length; i += n) out.push(G(name + (ops.length > n ? ' ' + (i / n + 1) : ''), 0, 0, ops.slice(i, i + n))); return out; };
/** A wall run along x or z in pieces of at most 60 studs (a box op takes at most 64). */
function wallRun(x, z, len, alongX, h, col, o = {}) { const ops = []; for (let k = 0; k < len; k += 60) { const n = Math.min(60, len - k); ops.push(alongX ? box(x + k, z, n, 1, h, col, o) : box(x, z + k, 1, n, h, col, o)); } return ops; }
function program() {
  const ops = [];
  // the ground: the pavement across the street side, a checkered floor of 4×4 plates inside
  ops.push(G('pavement', 0, 0, [slab(0, 0, 64, 6, GREY), slab(64, 0, 32, 6, GREY), slab(0, 70, 64, 2, GREY), slab(64, 70, 32, 2, GREY), slab(0, 6, 2, 64, GREY), slab(94, 6, 2, 64, GREY)]));
  const floor = []; for (let x = 3; x < 93; x += 4) for (let z = 7; z < 69; z += 4) floor.push(slab(x, z, Math.min(4, 93 - x), Math.min(4, 69 - z), ((x - 3) / 4 + (z - 7) / 4) % 2 ? GREY : WHITE));
  ops.push(...chunks('floor', floor));
  // the walls: white, eight bricks; the front (z 6) with its windows and the entrance, the sides and back plain
  ops.push(G('walls', 0, 0, [...wallRun(2, 6, 92, true, 8, WHITE), ...wallRun(2, 69, 92, true, 8, WHITE), ...wallRun(2, 7, 62, false, 8, WHITE), ...wallRun(93, 7, 62, false, 8, WHITE)]));
  const front = []; for (const x of [5, 11, 17, 23, 29, 35, 56, 62, 68, 74, 80, 86]) front.push(...K.bigWindow(x, 6, 1));
  front.push(cut(44, 6, 8, 1, 0, 6), part('60596', DARK, 44, 6, 0), part('60596', DARK, 48, 6, 0));   // the entrance: two open door frames side by side
  ops.push(G('front', 0, 0, front));
  // the red band and the parapet: two courses of red, yellow bricks let into the front, a dark course on top, a plate cap on the band's edge
  ops.push(G('band', 0, 0, [...wallRun(2, 6, 92, true, 2, RED, { y: 8 }), ...wallRun(2, 69, 92, true, 2, RED, { y: 8 }), ...wallRun(2, 7, 62, false, 2, RED, { y: 8 }), ...wallRun(93, 7, 62, false, 2, RED, { y: 8 }),
    ...[38, 40, 42, 53, 55, 57].flatMap(x => [cut(x, 6, 1, 1, 9, 1), part('3005', YELLOW, x, 6, 9)])]));
  ops.push(G('parapet', 0, 0, [...wallRun(2, 6, 92, true, 1, DARK, { y: 10 }), ...wallRun(2, 69, 92, true, 1, DARK, { y: 10 }), ...wallRun(2, 7, 62, false, 1, DARK, { y: 10 }), ...wallRun(93, 7, 62, false, 1, DARK, { y: 10 })]));
  // the checkout lanes: four, counter and belt running north to south, the customer on the west side, the clerk on the east
  for (let i = 0; i < 4; i++) {
    const x = 60 + i * 8;
    ops.push(G('checkout ' + (i + 1), x, 9, [
      box(0, 0, 2, 8, 2, DARK), slab(0, 0, 2, 8, 0, { y: 2 }), ...[0, 2, 4, 6].map(z => part('3068b', 0, 0, z, 2, { plate: 1 })),            // the belt: a black plate, black tiles
      box(2, 5, 2, 3, 2, GREY), part('3039', DARK, 2, 5, 2, { rot: 1 }), part('3024', 36, 2, 7, 2), part('3024', 46, 3, 7, 2),   // the register
      box(-3, 8, 3, 2, 1, WHITE), part('3005', BROWN, -3, 8, 1), part('3005', TAN, -2, 9, 1),                                                   // the bagging shelf
      ...[0, 1, 2, 3, 4, 5].map(y => part('3062b', GREY, 3, 0, y)), part('3005', i === 0 ? 46 : 14, 3, 0, 6), part('3024', RED, 3, 0, 7)]));   // the lane light
  }
  // produce: four tables heaped with fruit and greens, a banana stand
  const FRUIT = [[4, 4], [25, 25], [2, 27], [14, 14], [4, 2], [27, 25]];
  FRUIT.slice(0, 4).forEach(([a, b], t) => {
    const x = 6 + t * 9, heap = [box(0, 0, 6, 4, 1, BROWN), slab(0, 0, 6, 4, 2, { y: 1 })];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { heap.push(part('3062b', rnd() > 0.5 ? a : b, i, j, 1, { plate: 1 })); if ((i + j) % 2 === 0 && i > 0 && i < 5 && j > 0 && j < 3) heap.push(part('4073', rnd() > 0.5 ? a : b, i, j, 2, { plate: 1 })); }
    ops.push(G('produce table ' + (t + 1), x, 12, heap));
  });
  ops.push(G('banana stand', 12, 19, [box(0, 0, 4, 2, 2, BROWN), slab(0, 0, 4, 2, BROWN, { y: 2 }), ...[0, 1, 2, 3].flatMap(i => [0, 1].map(j => part('3062b', YELLOW, i, j, 2, { plate: 1 })))]));
  // the aisles: ten gondolas north to south, goods both faces, an end cap and a sign post at the north end
  for (let a = 0; a < 10; a++) {
    const x = 8 + a * 7;
    ops.push(G('aisle ' + (a + 1), x, 55, [K.shelf(0, 0, 28, WHITE, GOODS, rnd, { name: 'gondola ' + (a + 1) })], { turn: 1 }));   // turned a quarter: the gondola runs from z 55 north to z 28
    ops.push(G('end cap ' + (a + 1), x, 26, [box(0, 0, 2, 2, 2, RED), part('3005', GOODS[a % GOODS.length], 0, 0, 2), part('3005', GOODS[(a + 3) % GOODS.length], 1, 1, 2),
      ...[0, 1, 2, 3, 4].map(y => part('3062b', GREY, 0, -1, y)), part('3710', BLUE, -1, -1, 5, { plate: 0 }), part('3710', BLUE, -1, -1, 5, { plate: 1 }), part('3024', YELLOW, 0, -1, 5, { plate: 2 })]));   // the sign: a blue board with a yellow mark over a grey post
  }
  // the bakery along the east wall: racks of loaves, a counter
  const bread = [box(0, 0, 2, 16, 1, BROWN)]; for (let t = 0; t < 3; t++) { const y = 1 + t * 2; for (let z = 0; z < 16; z += 2) if (rnd() > 0.1) bread.push(part('3004', [TAN, 84, BROWN, 28][Math.floor(rnd() * 4)], 0, z, y, { rot: 1 })); bread.push(slab(0, 0, 2, 16, BROWN, { y: y + 1 })); if (t < 2) bread.push(slab(0, 0, 2, 16, BROWN, { y: y + 1, plateOffset: 1 }), slab(0, 0, 2, 16, BROWN, { y: y + 1, plateOffset: 2 })); }
  ops.push(G('bakery racks', 90, 22, bread));
  ops.push(G('bakery counter', 84, 26, [box(0, 0, 2, 10, 2, WHITE), slab(0, 0, 2, 10, TAN, { y: 2 }), ...[1, 4, 7].map(z => part('3004', 84, 0, z, 2, { plate: 1, rot: 1 }))]));
  // the deli: a long glass case, meats and cheese inside, a white back counter
  const deli = [box(0, 0, 2, 14, 1, WHITE)]; for (let z = 0; z < 14; z += 2) { deli.push(part('3004', [4, 5, 14, 26][(z / 2) % 4], 1, z, 1, { rot: 1 })); deli.push(cut(0, z, 1, 2, 1, 2), part('60592', WHITE, 0, z, 1, { rot: 1 })); }
  deli.push(box(1, 0, 1, 14, 1, WHITE, { y: 2 }));
  ops.push(G('deli case', 82, 42, deli), G('deli counter', 90, 42, [box(0, 0, 2, 14, 3, WHITE), slab(0, 0, 2, 14, DARK, { y: 3 })]));
  // the dairy cooler along the south wall: a white bank, glass doors, milk and eggs showing through
  const dairy = [box(0, 0, 60, 3, 4, WHITE)]; for (let x = 1; x < 59; x += 3) { dairy.push(cut(x, 0, 2, 1, 0, 3), part('60592', WHITE, x, 0, 0), part('60592', WHITE, x, 0, 2)); dairy.push(part('3004', x % 6 === 1 ? WHITE : 19, x, 1, 0), part('3004', WHITE, x, 1, 2)); }
  dairy.push(slab(0, 0, 60, 3, 1, { y: 4 }));
  ops.push(...chunks('dairy cooler', dairy.map(o => ({ ...o, x: (o.x || 0) + 4, z: (o.z || 0) + 64 })), 140));
  // the chest freezers: white, trans-blue lids
  ops.push(G('freezers', 66, 60, [box(0, 0, 24, 3, 1, WHITE), slab(0, 0, 24, 3, ICE, { y: 1 }), box(0, 0, 24, 1, 1, WHITE, { y: 1, plateOffset: 1 })]));
  // carts by the entrance and in the store, the cart corral outside
  ops.push(G('carts', 0, 0, [K.cart(40, 10, RED), K.cart(40, 13, BLUE), K.cart(52, 22, RED, 1), K.cart(30, 58, RED)]));
  ops.push(G('cart corral', 4, 1, [...K.fence(0, 0, 10, true, GREY), K.cart(1, 2, RED), K.cart(5, 2, RED)]));
  // outside: lamp posts and the store's pylon
  ops.push(K.lamp(30, 2), K.lamp(66, 2));
  ops.push(G('pylon', 82, 1, [box(0, 0, 2, 2, 10, GREY), box(6, 0, 2, 2, 10, GREY), box(0, 0, 8, 2, 3, RED, { y: 10 }), ...[1, 3, 5].map(x => [cut(x, 0, 1, 1, 11, 1), part('3005', YELLOW, x, 0, 11)]).flat()]));   // two legs and a red sign across them
  return { name: 'supermarket', ops };
}
module.exports = { name: 'supermarket', title: 'The Supermarket', description: 'The whole Springfield supermarket for The List: white walls with a red band, shop windows and a wide entrance; four checkout lanes with belts, registers and lane lights; produce tables heaped with fruit; ten aisles of gondolas with end caps and signs; a bakery, a deli case, a dairy cooler wall with glass doors, chest freezers; carts inside and in the corral outside, lamp posts and the pylon.', program, scale: 1 };
