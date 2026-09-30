/* tools/perform/ground.js — the floor under a point of a scene, as the take finds it.

   The take stands its props on the set with a ray straight down (film-readymades/odyssey-runtime.js kfGround). tools/perform/probe.js
   reads the same ray on a grid over the stage plate into odyssey/choreo/ground/<scene>.json: for each cell the surfaces that face up
   with a figure's clearance of air over them, highest first (a cave has a roof, and a floor under it). at(M, x, z, near) gives the
   surface under (x, z) nearest below `near` (a height the caller expects: a creature's floor as the piece boxes put it, or its feet),
   or, for a scene not yet probed, the top of the highest set piece box under the point (the old rule: boxes are coarser than the mesh).

     const G = require('./ground.js'); G.at(M, x, z) -> { y, src: 'ray' | 'boxes' }            */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), cache = {};
const CRE = /splash|swell|spout|field|spray|ship|hull|raft|boat|polyphem|laestryg|antiphat|giant|scylla|ram|dog|argos|cow|cattle|flock|stage plate/i;
function grid(sid) { if (sid in cache) return cache[sid]; const f = path.join(ROOT, 'odyssey/choreo/ground', sid + '.json'); cache[sid] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; return cache[sid]; }
/* the box rule: the highest top of a set piece (not a creature, a hull or the sea) whose box covers (x, z); 0 when none */
function boxes(M, x, z, near) { const tops = (M.pieces || []).filter(pc => !CRE.test(pc.label) && x >= pc.box[0] && x <= pc.box[3] && z >= pc.box[2] && z <= pc.box[5]).map(pc => pc.box[4]);
  const ok = near != null ? tops.filter(y => y <= near + 30 * (M.scale || 1)) : tops; return Math.max(0, ...(ok.length ? ok : [])); }
function at(M, x, z, near) {
  const G = grid(M.scene); if (!G) return { y: boxes(M, x, z, near), src: 'boxes' };
  const i = Math.max(0, Math.min(G.nx - 1, Math.round((x - G.x0) / G.dx))), j = Math.max(0, Math.min(G.nz - 1, Math.round((z - G.z0) / G.dz))), S = G.y[j * G.nx + i];
  const list = Array.isArray(S) ? S : [S], ref = near != null ? near : boxes(M, x, z), tol = 30 * (M.scale || 1);
  const below = list.filter(y => y <= ref + tol); return { y: below.length ? below[0] : list[list.length - 1], src: 'ray' };
}
/* the context creatures.js sample() takes, for a scene whose ground has been probed (else none: the placement stands as written) */
function ctxFor(sid) { const G = grid(sid); if (!G) return {}; const M = { scene: sid, scale: 1, pieces: [] }; return { ground: (x, z, near) => at(M, x, z, near).y }; }
module.exports = { at, grid, boxes, ctxFor };
