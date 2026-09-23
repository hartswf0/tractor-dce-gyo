// where each colour of a laid donor sits in the world: bounding boxes per vertex colour (metres from the spawn), low parts separately
const mocks = require('./mocks.js');
exports.opts = { name: 'colours', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 640, height: 360 } };
exports.checks = async ({ p, STEP, log }) => {
  const key = process.env.KEY || 'case-plato';
  const n = await p.evaluate(k => { const W = window.__world, F = W.film; F.stop(); F.trailer(k); return F.scene ? F.scene.actors.length : 0; }, key);
  let ready = false; for (let i = 0; i < 800 && !ready; i++) { await STEP(0.25); ready = await p.evaluate(a => { const F = window.__world.film; return F.donors.size >= 1 && [...F.donors.values()].every(d => d.group && d.group.userData.tris > 100) && F.actors.size >= a; }, n); }
  const out = await p.evaluate(() => { const W = window.__world, F = W.film, M = 40, sp = F.sceneSpawn, d = [...F.donors.values()][0]; let mesh = null; d.group.traverse(o => { if (o.isMesh && !mesh) mesh = o; }); mesh.updateMatrixWorld(true);
    const pos = mesh.geometry.attributes.position, col = mesh.geometry.attributes.color, v = new THREE.Vector3(), B = {};
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld); const c = [col.getX(i), col.getY(i), col.getZ(i)].map(x => Math.round(x * 4)).join(''); const x = (v.x - sp.x) / M, y = v.y / M, z = (v.z - sp.z) / M;
      const lo = y < 12; for (const k of [c, c + (lo ? ' low' : ' high')]) { const b = B[k] || (B[k] = { n: 0, x: [1e9, -1e9], y: [1e9, -1e9], z: [1e9, -1e9] }); b.n++; b.x[0] = Math.min(b.x[0], x); b.x[1] = Math.max(b.x[1], x); b.y[0] = Math.min(b.y[0], y); b.y[1] = Math.max(b.y[1], y); b.z[0] = Math.min(b.z[0], z); b.z[1] = Math.max(b.z[1], z); } }
    return Object.entries(B).sort((a, b) => b[1].n - a[1].n).map(([k, b]) => `${k.padEnd(9)} n ${String(b.n).padStart(6)}  x ${b.x.map(v => v.toFixed(1)).join('..')}  y ${b.y.map(v => v.toFixed(1)).join('..')}  z ${b.z.map(v => v.toFixed(1)).join('..')}`); });
  console.log(out.join('\n'));
};
