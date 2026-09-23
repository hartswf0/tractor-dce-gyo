// a one-metre height map of the cave construct round its axis
const mocks = require('./mocks.js');
exports.opts = { name: 'finemap', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 640, height: 360 } };
exports.checks = async ({ p, STEP, log }) => {
  const key = process.env.KEY || 'case-plato'; const R = JSON.parse(process.env.RANGE || '[-24,8,-24,16]');
  const n = await p.evaluate(k => { const W = window.__world, F = W.film; F.stop(); F.trailer(k); return F.scene ? F.scene.actors.length : 0; }, key);
  let ready = false; for (let i = 0; i < 800 && !ready; i++) { await STEP(0.25); ready = await p.evaluate(a => { const F = window.__world.film; return F.donors.size >= 1 && [...F.donors.values()].every(d => d.group && d.group.userData.tris > 100) && F.actors.size >= a; }, n); }
  const rows = await p.evaluate(R => { const W = window.__world, F = W.film, M = 40, sp = F.sceneSpawn, d = [...F.donors.values()][0], rc = new THREE.Raycaster(); const g = h => h == null ? '.' : h < 0.5 ? '_' : h < 2 ? ',' : h < 4 ? '2' : h < 6 ? '4' : h < 8 ? '6' : h < 10 ? '8' : h < 14 ? 'a' : h < 20 ? 'b' : h < 30 ? 'c' : 'd';
    const out = []; let head = '     '; for (let x = R[0]; x <= R[1]; x++) head += x % 5 === 0 ? String(Math.abs(x) % 10) : ' '; out.push(head);
    for (let z = R[2]; z <= R[3]; z++) { let row = String(z).padStart(4) + ' '; for (let x = R[0]; x <= R[1]; x++) { rc.set(new THREE.Vector3(sp.x + x * M, 300 * M, sp.z + z * M), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(d.group, true); row += g(h.length ? h[0].point.y / M : null); } out.push(row); } return out; }, R);
  console.log(rows.join('\n'));
};
