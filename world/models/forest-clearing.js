/* world/models/forest-clearing.js — The Forest Skirmish's set as a real model: a clearing in a wood, 64 × 64 studs.
   A green ground with a tan path and a stream under a plank bridge; fourteen trees on round-brick trunks with stepped
   crowns; a fallen log across the middle (the line neither side crosses); the Ewok side to the west with a tree
   platform on four posts, its fence and ladder, stumps and a campfire; the robot side to the east with a dark bunker,
   its slit windows, door and roof, a sandbag wall and a rail track along the east rim with a small locomotive on it. */
'use strict';
const K = require('./kit.js');
const { G, box, slab, cut, part, door } = K;
const rnd = K.seeded(11);
function program() {
  const ops = [];
  // the ground: a green field, a tan path from west to east, a stream from north to south with a plank bridge
  const ground = []; for (let x = 0; x < 64; x += 8) for (let z = 0; z < 64; z += 8) ground.push(slab(x, z, 8, 8, (x + z) % 16 ? 2 : 288));
  ops.push(G('ground', 0, 0, ground));
  ops.push(G('path', 0, 0, [slab(2, 30, 20, 4, 19, { plateOffset: 1 }), slab(22, 28, 12, 4, 19, { plateOffset: 1 }), slab(34, 30, 26, 4, 19, { plateOffset: 1 })]));
  ops.push(G('stream', 0, 0, [slab(40, 0, 4, 22, 1, { plateOffset: 1 }), slab(42, 22, 4, 12, 1, { plateOffset: 1 }), slab(44, 34, 4, 30, 1, { plateOffset: 1 })]));
  ops.push(G('bridge', 41, 27, [slab(0, 0, 1, 6, 70, { plateOffset: 2 }), slab(1, 0, 1, 6, 70, { plateOffset: 2 }), slab(2, 0, 1, 6, 70, { plateOffset: 2 }), slab(3, 0, 1, 6, 70, { plateOffset: 2 }), slab(4, 0, 1, 6, 70, { plateOffset: 2 }), slab(5, 0, 1, 6, 70, { plateOffset: 2 })]));
  // the fallen log: the crease between the lines
  ops.push(K.log(22, 31, 20, 70));
  // the trees
  const TREES = [[4, 4, 7, 4], [14, 3, 6, 3], [26, 5, 8, 4], [52, 4, 6, 3], [58, 14, 7, 3], [3, 20, 6, 3], [6, 44, 8, 4], [16, 56, 6, 3], [30, 58, 7, 4], [50, 56, 6, 3], [60, 44, 7, 3], [24, 44, 5, 3], [36, 10, 6, 3], [58, 28, 6, 3]];
  TREES.forEach(([x, z, h, r], i) => ops.push(K.tree(x, z, h, { r, leaf: i % 3 ? 2 : 288, leaf2: i % 2 ? 288 : 2, name: 'tree ' + (i + 1) })));
  // the Ewok side: a platform on four posts round a tree, a fence, a ladder, stumps, a campfire
  const posts = []; for (const [px, pz] of [[0, 0], [7, 0], [0, 7], [7, 7], [3, 0], [3, 7], [0, 3], [7, 3]]) for (let i = 0; i < 3; i++) posts.push(part('3062b', 70, px, pz, i));
  ops.push(G('platform posts', 8, 12, posts));
  ops.push(G('platform', 8, 12, [box(0, 0, 8, 8, 1, 70, { y: 3 }), slab(1, 1, 6, 6, 28, { y: 4 }), slab(0, 0, 8, 1, 28, { y: 4 }), slab(0, 7, 8, 1, 28, { y: 4 }), slab(0, 1, 1, 6, 28, { y: 4 }), slab(7, 1, 1, 6, 28, { y: 4 }), part('3185', 70, 0, 0, 4, { plate: 1 }), part('3185', 70, 4, 0, 4, { plate: 1 }), part('3185', 70, 0, 7, 4, { plate: 1 }), part('3185', 70, 4, 7, 4, { plate: 1 }), part('3185', 70, 0, 1, 4, { plate: 1, rot: 1 }), part('3185', 70, 0, 4, 4, { plate: 1, rot: 1 }), part('4175', 70, 8, 2, 0, { rot: 1 })]));
  ops.push(K.tree(18, 13, 7, { r: 3, leaf: 2, leaf2: 288, name: 'platform tree' }));
  for (const [i, [x, z]] of [[10, 24], [4, 34], [14, 40]].entries()) ops.push(G('stump ' + (i + 1), x, z, [box(0, 0, 4, 4, 2, 70), slab(0, 0, 4, 4, 28, { y: 2 })]));
  ops.push(K.fire(6, 28));
  // the robot side: a bunker with slit windows, a door to the west and a plated roof on a centre column; a sandbag wall; the rail track and its locomotive on the east rim
  const bunker = [box(0, 0, 12, 10, 4, 72, { hollow: true }), box(5, 4, 2, 2, 4, 72), cut(3, 0, 2, 1, 2, 1), cut(7, 0, 2, 1, 2, 1), cut(3, 9, 2, 1, 2, 1), cut(7, 9, 2, 1, 2, 1), cut(11, 3, 1, 2, 2, 1), cut(11, 6, 1, 2, 2, 1), door(0, 3, 'w', 0, 0),
    cut(2, 0, 4, 1, 3, 1), part('3010', 72, 2, 0, 3), cut(6, 0, 4, 1, 3, 1), part('3010', 72, 6, 0, 3), cut(2, 9, 4, 1, 3, 1), part('3010', 72, 2, 9, 3), cut(6, 9, 4, 1, 3, 1), part('3010', 72, 6, 9, 3), cut(11, 2, 1, 4, 3, 1), part('3010', 72, 11, 2, 3, { rot: 1 }), cut(11, 5, 1, 4, 3, 1), part('3010', 72, 11, 5, 3, { rot: 1 }),   /* lintels: a 1×4 brick over each slit, seated on both sides */
    slab(0, 0, 12, 10, 8, { y: 4 }), slab(1, 1, 10, 8, 71, { y: 4, plateOffset: 1 }), slab(0, 0, 12, 1, 72, { y: 4, plateOffset: 1, plates: 3 }), slab(0, 9, 12, 1, 72, { y: 4, plateOffset: 1, plates: 3 }), slab(0, 1, 1, 8, 72, { y: 4, plateOffset: 1, plates: 3 }), slab(11, 1, 1, 8, 72, { y: 4, plateOffset: 1, plates: 3 })];   /* the roof: a plate layer on the walls and the column, a second layer one stud in tying it, the parapet course on top of the plates */
  for (let x = 0; x < 12; x += 2) bunker.push(cut(x + 1, 0, 1, 1, 4, 2), cut(x + 1, 9, 1, 1, 4, 2));   /* crenels: every other stud of the parapet course cut */
  ops.push(G('bunker', 44, 36, bunker));
  const bags = []; for (let i = 0; i < 10; i++) bags.push(box(i, i < 5 ? 4 - i : i - 5, 1, 1, 1, 19));
  ops.push(G('sandbags', 44, 22, [box(0, 0, 10, 1, 1, 19), box(0, 1, 1, 6, 1, 19), slab(0, 0, 10, 1, 28, { y: 1 }), slab(0, 1, 1, 6, 28, { y: 1 })]));
  const track = [slab(0, 0, 2, 60, 72, { plateOffset: 1 })]; for (let z = 0; z < 60; z += 4) { if (z >= 24 && z < 36) continue; track.push(part('2431', 72, 0, z, 0, { plate: 2, rot: 1 }), part('2431', 72, 1, z, 0, { plate: 2, rot: 1 })); }
  ops.push(G('track', 61, 2, track));
  ops.push(G('locomotive', 61, 26, [slab(0, 0, 2, 8, 0, { plateOffset: 2 }), box(0, 0, 2, 6, 2, 4, { plateOffset: 0, y: 1 }), part('3941', 0, 0, 0, 3), part('3062b', 0, 0, 0, 4), slab(0, 4, 2, 2, 0, { y: 3 }), part('3068b', 0, 0, 4, 3, { plate: 1 }), part('3024', 46, 0, 6, 1), part('3024', 46, 1, 6, 1)]));
  // rocks and bushes
  for (const [i, [x, z, w, d, h]] of [[20, 20, 6, 4, 2], [34, 40, 4, 4, 1], [30, 14, 5, 3, 2], [50, 48, 4, 3, 1], [12, 50, 6, 4, 2]].entries()) ops.push(K.rock(x, z, w, d, h, i % 2 ? 72 : 71));
  for (const [x, z, w, d] of [[2, 12, 4, 4], [20, 8, 4, 3], [40, 46, 4, 4], [56, 20, 3, 4], [26, 52, 4, 4], [8, 58, 4, 3], [48, 8, 3, 3], [36, 22, 3, 3]]) ops.push(K.bush(x, z, w, d, rnd() < 0.5 ? 2 : 288));
  return { name: 'forest-clearing', ops };
}
module.exports = { name: 'forest-clearing', title: 'The Forest Clearing', description: 'A clearing in a wood for The Forest Skirmish: green ground with a tan path, a stream under a plank bridge, fourteen trees, a fallen log across the middle, the Ewok platform on its posts with a fence and ladder, stumps and a campfire to the west, the robot bunker with slit windows and a plated roof, a sandbag wall, a rail track and a locomotive to the east.', program, scale: 1 };
