/* world/models/buttes.js — the country beyond the door in The Searchers: three buttes, 88 × 34 studs.
   Each butte stands on a talus of three stepped courses (sand, then nougat, laid solid), then rises as a hollow column
   in bands of reddish brown and dark orange; ribs of one-stud bricks stand against its faces at uneven heights, so the
   walls are fluted and the skyline broken; a caprock of nougat plates, tied in three layers, overhangs the top by a stud.
   The mitten in the west is the one the door frames, with its thumb standing off its east shoulder; a spire stands
   between it and the lower butte in the east. Laid some sixty metres south of the homestead, it is the horizon of every
   exterior and of both door shots. */
'use strict';
const K = require('./kit.js');
const { G, box } = K;
const RED = 70, ORANGE = 484, NOUGAT = 84, SAND = 28;
/** A butte with its column's corner at (x, z) in its group: a talus of three courses stepping in a stud each, a hollow column
    cw × cd and h bricks in bands, ribs on its four faces, a caprock deck one stud wider all round. */
function butte(name, x, z, cw, cd, h, bands, seed, extra = []) {
  const rnd = K.seeded(seed), ops = [];
  ops.push(box(-3, -3, cw + 6, cd + 6, 1, SAND), box(-2, -2, cw + 4, cd + 4, 1, SAND, { y: 1 }), box(-1, -1, cw + 2, cd + 2, 1, NOUGAT, { y: 2 }));
  let y = 3; for (const [n, col] of bands) { const hh = Math.min(n, 3 + h - y); if (hh <= 0) break; ops.push(box(0, 0, cw, cd, hh, col, { y, hollow: true })); y += hh; }
  const top = y;
  // the ribs: one-stud columns against the faces, every two or three studs, from the talus to between half and all the column's height
  const rib = (rx, rz) => { const hh = Math.max(3, Math.round((h * (0.45 + rnd() * 0.55)))); ops.push(box(rx, rz, 1, 1, Math.min(hh, top - 3), rnd() > 0.5 ? RED : ORANGE, { y: 3 })); };
  for (let i = 1; i < cw - 1; i += 2 + Math.floor(rnd() * 2)) { rib(i, -1); rib(i, cd); }
  for (let j = 1; j < cd - 1; j += 2 + Math.floor(rnd() * 2)) { rib(-1, j); rib(cw, j); }
  ops.push(...K.deck(-1, -1, cw + 2, cd + 2, NOUGAT, top));
  ops.push(...extra.map(f => f(top)));
  return G(name, x, z, ops);
}
function program() {
  const ops = [];
  // the mitten: a broad column with a thumb off its east shoulder, standing on the same talus
  ops.push(butte('the mitten', 5, 10, 14, 9, 17, [[4, RED], [5, ORANGE], [2, RED], [6, ORANGE]], 5,
    [() => box(16, 2, 3, 3, 13, ORANGE, { y: 3 }), () => box(16, 2, 3, 3, 2, RED, { y: 16 }), () => box(17, 3, 1, 1, 1, NOUGAT, { y: 18 }), () => box(13, -1, 9, 9, 1, SAND), () => box(14, 0, 7, 7, 1, SAND, { y: 1 }), () => box(15, 1, 5, 5, 1, NOUGAT, { y: 2 })]));
  // the spire: a tall narrow needle on a talus of its own
  ops.push(G('the spire', 40, 2, [box(0, 0, 8, 8, 1, SAND), box(1, 1, 6, 6, 1, NOUGAT, { y: 1 }), box(2, 2, 4, 4, 5, RED, { y: 2 }), box(2, 2, 4, 4, 7, ORANGE, { y: 7 }), box(3, 3, 2, 2, 3, RED, { y: 14 }), box(3, 3, 1, 1, 1, NOUGAT, { y: 17 })]));
  // the east butte: lower and longer
  ops.push(butte('the east butte', 67, 17, 17, 9, 12, [[3, RED], [4, ORANGE], [2, RED], [3, ORANGE]], 9));
  return { name: 'buttes', ops };
}
module.exports = { name: 'buttes', title: 'The Buttes', description: 'Three buttes for The Searchers: a mitten with its thumb, a spire and a lower butte, each on a stepped talus of sand and nougat, rising in bands of reddish brown and dark orange with fluted ribs at uneven heights, capped with nougat plates tied in three layers.', program, scale: 1 };
