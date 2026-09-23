// a laid model is solid: lay a case, then print its solid cells as a map (# blocked) and try a figure walking into a wall
const mocks = require('./mocks.js');
const KEY = process.env.KEY || 'case-grocery';
exports.opts = { name: 'solids', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 640, height: 360 } };
exports.checks = async ({ p, STEP, log, A }) => {
  await p.evaluate(k => { const F = window.__world.film; F.stop(); F.trailer(k); }, KEY);
  for (let i = 0; i < 400; i++) { await STEP(0.25); if (await p.evaluate(() => (window.__world.solids || []).length > 0)) break; }
  const r = await p.evaluate(() => {
    const W = window.__world, F = W.film, d = [...F.donors.values()][0], s = W.solids[0], b = d.box, M = 40, rows = [];
    for (let z = b.min.z; z < b.max.z; z += M) { let row = ''; for (let x = b.min.x; x < b.max.x; x += M / 2) row += s.blocked(x + 5, z + 5) ? '#' : '.'; rows.push(row); }
    const p = { x: d.x, z: b.min.z - 2 * M }, moved = []; for (let k = 0; k < 12; k++) { p.z += 0.5 * M; const q = { x: p.x + 7 * M, z: p.z }; s.push(q, 0.4 * M); moved.push(((q.z - b.min.z) / M).toFixed(2)); }
    return { cells: s.cells, box: [b.min.x, b.min.z, b.max.x, b.max.z].map(v => Math.round(v)), rows, moved };
  });
  log('cells', r.cells, 'box', r.box); console.log(r.rows.join('\n')); log('walk-in z (m from box edge)', r.moved.join(' '));
  A(r.cells > 100, 'solid cells laid');
};
