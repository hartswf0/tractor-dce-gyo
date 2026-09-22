/* world/models/grocery-store.js — The Checkout's set as a real model: a corner grocery, 48 × 32 studs.
   A checkered floor, tan walls eight bricks high in running bond with six shop windows and a door on the street
   side, a red sign band and a parapet, no ceiling (a film set is open to the camera); inside, three gondolas of
   goods, a freezer wall with glass doors, the checkout with its belt, register and bagging shelf, carts by the door;
   outside, a pavement, two lamp posts and a flower stand. */
'use strict';
const K = require('./kit.js');
const { G, box, slab, cut, part, door } = K;
const rnd = K.seeded(7);
const GOODS = [4, 14, 1, 2, 25, 15, 5, 322, 27, 191];
function program() {
  const ops = [];
  // the ground: pavement outside, checkered floor inside the walls
  ops.push(G('pavement', 0, 0, [slab(0, 0, 48, 4, 71), slab(0, 4, 3, 28, 71), slab(45, 4, 3, 28, 71), slab(3, 28, 42, 4, 71)]));
  ops.push(G('floor', 0, 0, K.checker(4, 5, 40, 22, 71, 15)));
  // the walls: a hollow box, eight bricks, tan; the street side is north (z 4)
  ops.push(G('walls', 0, 0, [box(3, 4, 42, 24, 8, 19, { hollow: true })]));
  // six shop windows and the door on the street side, two windows on each end wall
  const front = []; for (const x of [5, 10, 15, 29, 34, 39]) front.push(...K.bigWindow(x, 4, 1)); front.push(door(21, 4, 'n', 0, 70));
  ops.push(G('street side', 0, 0, front));
  ops.push(G('end walls', 0, 0, [...K.bigWindow(3, 10, 2, 15, true), ...K.bigWindow(3, 18, 2, 15, true), ...K.bigWindow(44, 10, 2, 15, true), ...K.bigWindow(44, 18, 2, 15, true)]));
  // the sign band and the parapet: a red course all round with yellow bricks let into the street side, a dark course on top
  ops.push(G('sign band', 0, 0, [box(3, 4, 42, 24, 2, 4, { y: 8, hollow: true }), ...[8, 12, 16, 20, 26, 30, 34, 38].flatMap(x => [cut(x, 4, 1, 1, 9, 1), part('3005', 14, x, 4, 9)])]));
  ops.push(G('parapet', 0, 0, [box(3, 4, 42, 24, 1, 72, { y: 10, hollow: true })]));
  ops.push(G('parapet plates', 0, 0, [slab(3, 4, 42, 2, 72, { y: 11 }), slab(3, 26, 42, 2, 72, { y: 11 }), slab(3, 6, 2, 20, 72, { y: 11 }), slab(43, 6, 2, 20, 72, { y: 11 })]));
  // the aisles: three gondolas, an end cap each
  for (const [i, z] of [[0, 11], [1, 16], [2, 21]].map(([i, z]) => [i, z])) { ops.push(K.shelf(8, z, 22, 15, GOODS, rnd, { name: 'gondola ' + (i + 1) })); ops.push(G('end cap ' + (i + 1), 30, z, [box(0, 0, 2, 2, 2, 15), part('3005', GOODS[i * 3 % GOODS.length], 0, 0, 2), part('3005', GOODS[(i * 3 + 1) % GOODS.length], 1, 1, 2)])); }
  // the freezer wall along the back: white, glass doors, a lit top
  const fr = [box(0, 0, 36, 2, 3, 15)]; for (let x = 1; x < 35; x += 3) fr.push(cut(x, 0, 2, 1, 0, 2), part('60592', 47, x, 0, 0)); fr.push(slab(0, 0, 36, 2, 72, { y: 3 }));
  ops.push(G('freezer', 5, 25, fr));
  // the checkout: counter, belt, register, bagging shelf
  ops.push(G('checkout', 34, 7, [box(0, 0, 8, 2, 2, 72), slab(0, 0, 8, 2, 0, { y: 2 }), ...[0, 2, 4, 6].map(x => part('3068b', 0, x, 0, 2, { plate: 1 })),
    box(0, 3, 6, 2, 1, 71), slab(0, 3, 6, 2, 0, { y: 1 }), ...[0, 2, 4].map(x => part('3069b', 0, x, 3, 1, { plate: 1 })), ...[0, 2, 4].map(x => part('3069b', 0, x, 4, 1, { plate: 1 })),
    box(6, 3, 2, 2, 1, 72), part('3039', 72, 6, 3, 1, { rot: 2 }), part('3024', 46, 6, 3, 2), part('3024', 36, 7, 3, 2),
    box(0, 6, 3, 2, 1, 15), part('3005', 70, 0, 6, 1), part('3005', 70, 2, 7, 1), part('3005', 19, 1, 6, 1)]));
  // carts by the door, a queue post
  ops.push(K.cart(12, 6, 4), K.cart(17, 6, 1), K.cart(27, 7, 4, 1));
  ops.push(G('queue post', 32, 12, [part('3062b', 0, 0, 0, 0), part('3062b', 0, 0, 0, 1), part('3024', 4, 0, 0, 2)]));
  // outside: lamp posts and a flower stand
  ops.push(K.lamp(19, 1), K.lamp(28, 1));
  ops.push(G('flower stand', 6, 1, [box(0, 0, 6, 2, 1, 2), ...[0, 1, 2, 3, 4, 5].flatMap(x => [0, 1].map(z => part('4073', [4, 14, 5, 25, 15, 26][(x + z) % 6], x, z, 1)))]));
  return { name: 'grocery-store', ops };
}
module.exports = { name: 'grocery-store', title: 'The Corner Grocery', description: 'A corner grocery for The Checkout: a checkered floor, tan walls in running bond with six shop windows and a door, a red sign band, three gondolas of goods, a freezer wall with glass doors, the checkout with its belt and register, carts by the door, lamps and a flower stand outside.', program, scale: 1 };
