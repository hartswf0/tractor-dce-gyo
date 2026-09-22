/* world/models/cave-of-shadows.js — The Cave's set as a real model: Plato's cave, 64 × 48 studs.
   A dark stone floor inside a ring of grey rock (blocks with sloped shoulders, overlapping, five to eight bricks
   high); the smooth pale wall of shadows at the north end; the captives' bench before it; behind the bench the
   raised parapet with its low front wall and three carried shapes on poles; behind that the fire in its ring of
   stones; a flight of stairs up to a lookout in the east gap, the floor passing out on either side of it to a tan ledge
   under the sun on its column. */
'use strict';
const K = require('./kit.js');
const { G, box, slab, cut, part } = K;
const rnd = K.seeded(3);
function program() {
  const ops = [];
  // the floor: dark stone inside, a tan path from the bench to the stairs, the ledge outside
  const floor = []; for (let x = 0; x < 64; x += 8) for (let z = 0; z < 48; z += 8) floor.push(slab(x, z, 8, 8, (x + z) % 16 ? 72 : 8));
  ops.push(G('floor', 0, 0, floor));
  ops.push(G('path', 0, 0, [slab(28, 16, 4, 20, 19, { plateOffset: 1 }), slab(32, 32, 16, 4, 19, { plateOffset: 1 })]));
  // the rock ring: blocks with sloped shoulders, overlapping along the west, south and east sides, leaving the wall of shadows at the north and a gap at the east for the way out
  const rocks = []; let i = 0;
  const ring = [];
  for (let z = 0; z < 43; z += 5) ring.push([0, z, 5, 5, 4 + Math.floor(rnd() * 4)]);                                                  // west
  for (let x = 0; x < 64; x += 6) ring.push([x, 43, 6, 5, 4 + Math.floor(rnd() * 4)]);                                                // south
  for (let z = 30; z < 43; z += 5) ring.push([58, z, 6, Math.min(5, 43 - z), 4 + Math.floor(rnd() * 3)]);                             // east, south of the gap
  for (let z = 0; z < 20; z += 5) ring.push([58, z, 6, 5, 5 + Math.floor(rnd() * 3)]);                                                // east, north of the gap
  for (const [x, z, w, d, h] of ring) rocks.push(K.rock(x, z, Math.min(w, 64 - x), Math.min(d, 48 - z), h, ++i % 3 ? 72 : 71));
  ops.push(...rocks);
  // the wall of shadows: a smooth pale wall across the north, tiled flat on its face side by a course of plates
  ops.push(G('wall of shadows', 5, 0, [box(0, 0, 53, 2, 8, 71), slab(0, 0, 53, 2, 15, { y: 8 }), box(0, 0, 53, 1, 1, 15, { y: 8, plateOffset: 1 })]));
  // the captives' bench: a low wall of dark tan with a plate seat, ten studs from the wall
  ops.push(G('bench', 14, 12, [box(0, 0, 36, 2, 1, 28), slab(0, 0, 36, 2, 70, { y: 1 })]));
  // the parapet: a raised walkway behind the bench, three bricks up, with a low front wall the shapes show over
  ops.push(G('parapet', 12, 18, [box(0, 0, 40, 4, 3, 72), slab(0, 0, 40, 4, 71, { y: 3 }), box(0, 0, 40, 1, 1, 72, { y: 3, plateOffset: 1 })]));
  const shapes = []; for (const [x, top, col] of [[8, '4589', 4], [19, '4589', 14], [30, '4589', 1]]) { shapes.push(part('3062b', 0, x, 2, 3, { plate: 1 }), part('3062b', 0, x, 2, 4, { plate: 1 }), part('3062b', 0, x, 2, 5, { plate: 1 }), part('3005', col, x, 2, 6, { plate: 1 }), part(top, col, x, 2, 7, { plate: 1 })); }
  ops.push(G('carried shapes', 12, 18, shapes));
  // the fire behind the parapet, in a ring of stones, with a second flame
  ops.push(K.fire(30, 26));
  ops.push(G('embers', 30, 26, [part('85959', 4, 0, 2, 1), part('85959', 25, 3, 1, 1)]));
  // stalagmites on the floor
  for (const [x, z, h] of [[8, 24, 3], [50, 14, 2], [12, 36, 4], [46, 38, 3], [20, 40, 2]]) ops.push(G('stalagmite', x, z, [box(0, 0, 2, 2, h, 71), part('3942', 71, 0, 0, h)]));
  // the way out: stairs up the east side to the gap in the rock, a landing, the ledge outside under the sun
  ops.push(G('stairs', 46, 24, [K.stairs(0, 0, 'e', 6, 4, 72)]));   /* the stairs climb east to a lookout over the gap; the floor passes them on either side */
  ops.push(G('lookout', 52, 24, [box(0, 0, 4, 4, 6, 72), slab(0, 0, 4, 4, 19, { y: 6 })]));
  ops.push(G('ledge', 58, 18, [slab(0, 0, 6, 13, 19, { plateOffset: 1 })]));
  const column = []; for (let i = 0; i < 14; i++) column.push(part('3941', 47, 0, 0, i));
  ops.push(G('sun', 60, 23, [...column, part('3031', 14, -1, -1, 14), slab(-1, -1, 4, 4, 14, { y: 14, plateOffset: 1, plates: 3 }), ...[[-1, -1], [2, -1], [-1, 2], [2, 2]].map(([x, z]) => part('4589', 25, x, z, 15, { plate: 1 })), part('3941', 14, 0, 0, 15, { plate: 1 }), part('3942', 25, 0, 0, 16, { plate: 1 })]));   /* a 4×4 plate carries the sun's head on the column, so every brick of it is tied through the plate */
  return { name: 'cave-of-shadows', ops };
}
module.exports = { name: 'cave-of-shadows', title: 'The Cave of Shadows', description: "Plato's cave for The Cave: a dark stone floor inside a ring of grey rock, the smooth pale wall of shadows at the north, the captives' bench before it, the raised parapet with three carried shapes on poles, the fire in its ring of stones behind, stalagmites, a flight of stairs to a lookout in the east gap, and the way out past it to a tan ledge under the sun on its column.", program, scale: 1 };
