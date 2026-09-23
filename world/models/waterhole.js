/* world/models/waterhole.js — the shallow water in the middle distance of The Searchers, 32 × 20 studs.
   A pool of trans-light-blue tiles in an uneven outline, a rim of dark tan and reddish brown mud tiles round it, three
   horses at the water (bay, black, white), a few stones. Everything lies on the ground: tiles and plates at plate 0,
   the horses standing on the ground by their own geometry. Laid a plate down, the water is level with the desert. */
'use strict';
const K = require('./kit.js');
const { G, part } = K;
const rnd = K.seeded(31);
const WATER = 43, MUD = 28, MUD2 = 70, STONE = 72;
function program() {
  const ops = [], water = [], rim = [];
  // the pool: an ellipse 26 × 12 studs, in 2×2 tiles where they fit and 1×1 tiles at the edge; the rim one to two studs round it
  const inPool = (x, z) => ((x - 16) / 13) ** 2 + ((z - 10) / 6.2) ** 2 < 1 + (rnd() - 0.5) * 0.12;
  const cells = new Set(); for (let x = 0; x < 32; x++) for (let z = 0; z < 20; z++) if (inPool(x + 0.5, z + 0.5)) cells.add(x + ',' + z);
  const used = new Set();
  for (let x = 0; x < 32; x += 2) for (let z = 0; z < 20; z += 2) { const four = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]]; if (four.every(([a, b]) => cells.has(a + ',' + b))) { water.push(part('3068b', WATER, x, z, 0)); four.forEach(([a, b]) => used.add(a + ',' + b)); } }
  for (const c of cells) if (!used.has(c)) { const [x, z] = c.split(',').map(Number); water.push(part('3070b', WATER, x, z, 0)); }
  const near = (x, z, d) => { for (let a = -d; a <= d; a++) for (let b = -d; b <= d; b++) if (cells.has((x + a) + ',' + (z + b))) return true; return false; };
  for (let x = 0; x < 32; x++) for (let z = 0; z < 20; z++) { const k = x + ',' + z; if (cells.has(k)) continue; if (near(x, z, 1) || (near(x, z, 2) && rnd() > 0.5)) rim.push(part('3070b', rnd() > 0.35 ? MUD : MUD2, x, z, 0)); }
  // the horses: at the water's edge, heads down to it or up
  ops.push(G('horses', 0, 0, [part('4493c01', 70, 1, 3, 0, { rot: 1 }), part('4493c01', 0, 24, 1, 0, { rot: 3 }), part('4493c01', 15, 12, 17, 0, { rot: 0 })]));
  ops.push(G('stones', 0, 0, [part('3062b', STONE, 30, 17, 0), part('4032', STONE, 29, 2, 0), part('3062b', STONE, 1, 15, 0)]));
  // (the horses and stones go down first: a tile under a hoof is simply not laid)
  ops.push(...[G('water', 0, 0, water.slice(0, 150)), G('water 2', 0, 0, water.slice(150))].filter(g => g.ops.length));
  for (let i = 0; i < rim.length; i += 150) ops.push(G('mud ' + (i / 150 + 1), 0, 0, rim.slice(i, i + 150)));
  return { name: 'waterhole', ops };
}
module.exports = { name: 'waterhole', title: 'The Waterhole', description: 'A shallow pool of trans-light-blue tiles in a rim of mud, three horses at the water (bay, black, white) and a few stones: the middle distance of The Searchers, as the film has it.', program, scale: 1 };
