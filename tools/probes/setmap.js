// a height map of a laid set from above (metres from the scene spawn, x east, z south), the donor box, and where the actors stand
const mocks = require('./mocks.js');
const KEYS = (process.env.KEYS || 'case-ewoks,case-plato').split(',');
exports.opts = { name: 'setmap', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 640, height: 360 } };
exports.checks = async ({ p, STEP, log }) => {
  for (const key of KEYS) {
    const n = await p.evaluate(k => { const W = window.__world, F = W.film; F.stop(); F.trailer(k); return F.scene ? F.scene.actors.length : 0; }, key);
    let ready = false; for (let i = 0; i < 800 && !ready; i++) { await STEP(0.25); ready = await p.evaluate(a => { const F = window.__world.film; return F.donors.size >= 1 && [...F.donors.values()].every(d => d.group && d.group.userData.tris > 100) && F.actors.size >= a; }, n); }
    const out = await p.evaluate(() => {
      const W = window.__world, F = W.film, M = 40, sp = F.sceneSpawn || { x: 0, z: 0 }, d = [...F.donors.values()][0], THREE = window.THREE;
      const b = d.box, box = { x: [(b.min.x - sp.x) / M, (b.max.x - sp.x) / M], y: [b.min.y / M, b.max.y / M], z: [(b.min.z - sp.z) / M, (b.max.z - sp.z) / M], y0: d.y0 / M, ground: W.groundH ? W.groundH(sp.x, sp.z) / M : null };
      const rc = new THREE.Raycaster(); const rows = []; const X0 = Math.floor(box.x[0] / 2) * 2 - 2, X1 = Math.ceil(box.x[1] / 2) * 2 + 2, Z0 = Math.floor(box.z[0] / 2) * 2 - 2, Z1 = Math.ceil(box.z[1] / 2) * 2 + 2;
      const step = (X1 - X0) > 100 ? 4 : 2; const glyph = h => h == null ? '.' : h < 0.3 ? '_' : h < 1 ? ',' : h < 2 ? '1' : h < 3 ? '2' : h < 4 ? '3' : h < 6 ? '4' : h < 8 ? '5' : h < 12 ? '6' : h < 20 ? '7' : h < 30 ? '8' : '9';
      for (let z = Z0; z <= Z1; z += step) { let row = String(z).padStart(4) + ' '; for (let x = X0; x <= X1; x += step) { rc.set(new THREE.Vector3(sp.x + x * M, 300 * M, sp.z + z * M), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(d.group, true); row += glyph(h.length ? h[0].point.y / M : null); } rows.push(row); }
      let head = '     '; for (let x = X0; x <= X1; x += step) head += (x % 10 === 0) ? String(Math.abs(x / 10) % 10) : ' '; rows.unshift(head);
      const actors = [...F.actors.values()].map(a => { const P = (a.rig && a.rig.pos) || (a.npcs && a.npcs[0] && a.npcs[0].pos) || (a.group && a.group.position) || { x: a.x, y: 0, z: a.z }; return { name: a.name, x: P.x - sp.x, y: P.y, z: P.z - sp.z }; }).map(a => `${a.name} (${(a.x / M).toFixed(1)}, ${(a.y / M).toFixed(2)}, ${(a.z / M).toFixed(1)})`);
      return { box, step, rows, actors, sp: [sp.x / M, sp.z / M] };
    });
    log(key, 'box', JSON.stringify(out.box), 'spawn', out.sp.join(','), 'step', out.step);
    log(key, 'actors', out.actors.join(' | '));
    console.log(out.rows.join('\n'));
    await p.evaluate(() => window.__world.film.stop());
  }
};
