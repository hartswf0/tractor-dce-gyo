/* world/models/homestead.js — The Searchers' set as a real model: a frontier homestead, 48 × 48 studs.
   A log cabin (reddish brown walls in running bond, the 1×4 and 1×2 courses laid in log bricks) with an open door
   frame in the middle of the south wall and a small window either side of it; a plank floor, a stone hearth and
   chimney on the west wall, a table with benches, a bed and a dresser inside; a plate ceiling tied in three layers
   over the walls and the porch posts, so the room is dark and the door is the only bright thing in it; a gabled roof
   on the ceiling; a plank porch across the front under the flat end of the ceiling, four posts; in the yard a
   hitching rail with a horse, a corral with two more, a water trough, a fence line, a woodpile, a water barrel; two rocking chairs on the porch.
   The door is at studs x 22..25 on the wall line z 19; the room inside is x 13..34 × z 5..18 (seven metres deep, so a
   camera by the back wall sees the door as a bright frame in the dark); the porch z 20..24, its posts at z 23. */
'use strict';
const K = require('./kit.js');
const { G, box, slab, cut, part } = K;
const rnd = K.seeded(11);
const LOG = 70, DARK = 308, STONE = 72, PLANK = 308, EARTH = 84, TRACK = 28;   // the yard is the red earth's own nougat; the path worn to dark tan
function program() {
  const ops = [];
  // the yard: packed earth round the house, a lighter path from the porch steps south
  const yard = []; for (let x = 0; x < 48; x += 8) for (let z = 0; z < 48; z += 8) yard.push(slab(x, z, 8, 8, EARTH));
  yard.push(cut(12, 4, 24, 21, 0, 1), cut(21, 25, 6, 23, 0, 1));   // the house, the porch and the path are cut out of the earth: every floor a figure walks is one plate, and the case lays the set a plate down so that plate is the ground
  ops.push(G('yard', 0, 0, yard));
  ops.push(G('path', 0, 0, [slab(21, 25, 6, 23, TRACK)]));
  // the floor inside and the porch boards
  ops.push(G('floor', 0, 0, [slab(13, 5, 22, 14, PLANK)]));
  ops.push(G('porch', 0, 0, [slab(12, 20, 24, 5, PLANK)]));
  // the walls: a hollow box of logs seven bricks high; the door frame in the south wall, a window either side, one in each end wall
  ops.push(G('walls', 0, 0, [box(12, 4, 24, 16, 7, LOG, { hollow: true })]));
  ops.push(G('door', 0, 0, [cut(22, 19, 4, 1, 0, 6), part('60596', DARK, 22, 19, 0)]));
  ops.push(G('windows', 0, 0, [cut(16, 19, 2, 1, 2, 2), part('60592', 15, 16, 19, 2), cut(30, 19, 2, 1, 2, 2), part('60592', 15, 30, 19, 2)]));
  // the hearth and chimney on the west wall: a stone stack outside the wall to the wall top, a firebox opening into the room, the stack through the roof
  ops.push(G('hearth', 8, 8, [box(0, 0, 4, 6, 7, STONE), box(5, 1, 2, 4, 2, STONE), cut(6, 2, 1, 2, 0, 1), part('3024', 0, 6, 2, 0), part('85959', 25, 6, 2, 0, { plate: 1 }), part('85959', 14, 6, 3, 0)]));
  // inside: a table with two benches, a bed, a dresser, a lamp on the table
  ops.push(G('table', 15, 11, [part('3062b', DARK, 0, 0, 0), part('3062b', DARK, 5, 0, 0), part('3062b', DARK, 0, 3, 0), part('3062b', DARK, 5, 3, 0), part('3032', LOG, 0, 0, 1), part('3062b', 14, 3, 1, 1, { plate: 1 })]));
  ops.push(G('benches', 15, 10, [box(0, 0, 6, 1, 1, DARK), box(0, 5, 6, 1, 1, DARK)]));
  ops.push(G('bed', 29, 5, [box(0, 0, 5, 3, 1, DARK), slab(0, 0, 5, 3, 15, { y: 1 }), slab(0, 0, 2, 3, 1, { y: 1, plateOffset: 1 }), box(4, 0, 1, 3, 2, DARK, { y: 1 })]));
  ops.push(G('dresser', 13, 5, [box(0, 0, 3, 2, 3, DARK), part('3024', 14, 1, 0, 3)]));
  // the porch posts: round bricks from the ground to the ceiling line
  const posts = []; for (const x of [12, 18, 28, 34]) { posts.push(cut(x, 23, 2, 2, 0, 1)); for (let y = 0; y < 6; y++) posts.push(part('3941', 15, x, 23, y)); }   // white posts, as the Jorgensens' porch has them
  posts.push(box(12, 23, 24, 2, 1, 15, { y: 6 }));   // the header beam over the posts, under the front of the ceiling
  ops.push(G('porch posts', 0, 0, posts));
  // the ceiling: three plate layers over the walls, the room and the porch, so the room is shut from the sky and the porch is roofed
  // (the kit's deck: explicit plates in three bonded layers, so no seam runs through all three)
  const ceil = K.deck(12, 4, 24, 21, DARK, 7);
  ops.push(G('ceiling', 0, 0, ceil));
  // the gabled roof over the cabin, the ridge east to west
  ops.push(G('roof', 0, 0, [K.roof(12, 4, 24, 17, 8, 'gable', 320)]));
  // the chimney stack above the ceiling line, clear of the roof's west eave
  ops.push(G('chimney', 8, 9, [box(0, 0, 3, 4, 7, STONE, { y: 7 })]));
  // two rocking chairs on the porch, either side of the door, facing the yard
  ops.push(G('porch chairs', 0, 0, [K.rocker(14, 20, LOG), K.rocker(31, 20, LOG)]));
  // the corral east of the yard: a rail fence on three sides, two horses in it
  ops.push(G('corral', 0, 0, [...K.fence(41, 30, 16, false), ...K.fence(47, 30, 16, false), ...K.fence(42, 30, 5, true), ...K.fence(42, 45, 5, true)]));
  ops.push(G('horses', 0, 0, [part('4493c01', 0, 42, 33, 0, { plate: 1 }), part('4493c01', 15, 45, 36, 0, { plate: 1, rot: 2 })]));
  // the yard: a hitching rail with the horse, a trough, a woodpile against the east wall, a fence line along the west
  ops.push(G('hitching rail', 32, 30, [part('3062b', DARK, 0, 0, 0), part('3062b', DARK, 0, 0, 1), part('3062b', DARK, 7, 0, 0), part('3062b', DARK, 7, 0, 1), part('3460', DARK, 0, 0, 2)]));
  ops.push(G('horse', 31, 31, [part('4493c01', 70, 0, 0, 0, { plate: 1, rot: 1 })]));
  ops.push(G('trough', 38, 26, [box(0, 0, 6, 2, 1, DARK), slab(0, 0, 6, 2, 1, { y: 1 })]));
  const wood = []; [3, 2, 3, 3, 2, 1].forEach((h, i) => { for (let y = 0; y < h; y++) wood.push(part('3062b', rnd() > 0.5 ? LOG : DARK, 37, 8 + i, y)); });
  ops.push(G('woodpile', 0, 0, wood));
  const fence = []; for (let z = 1; z <= 46; z += 3) { fence.push(part('3062b', DARK, 2, z, 0), part('3062b', DARK, 2, z, 1)); }
  for (let z = 1; z <= 43; z += 6) fence.push(part('3710', DARK, 2, z, 2, { rot: 1 }));                     // the rails: 1×4 plates from post to post,
  for (let z = 4; z < 43; z += 6) fence.push(part('3710', DARK, 2, z, 2, { rot: 1, plate: 1 }));           // and a second run a plate up over the gaps, seated on the ends of the first
  ops.push(G('fence', 0, 0, fence));
  ops.push(G('water barrel', 6, 28, [part('3941', DARK, 0, 0, 0), part('3941', DARK, 0, 0, 1), part('4032', 70, 0, 0, 2)]));
  return { name: 'homestead', ops };
}
module.exports = { name: 'homestead', title: 'The Homestead', description: 'A frontier homestead for The Searchers: a log cabin with an open door frame between two windows, a plank floor, a stone hearth and chimney, a table, benches, a bed and a dresser inside, a plate ceiling so the room is dark, a gabled red roof, a plank porch on four posts with two rocking chairs, and in the yard a corral with two horses, a hitching rail with a horse, a trough, a woodpile, a fence line and a water barrel.', program, scale: 1,
  groundTiles: { cols: [84, 28] },   /* the yard and the path as smooth packed earth: tiles where nothing stands */
  bricks: ['3001', '3003', '3010', '3004', '3005'], swap: { from: { '3010': '30137', '3004': '30136' }, col: [70] } };
