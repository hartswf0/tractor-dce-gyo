// plan views of a laid set: straight down from under the canopy, then four obliques; exact floor heights at a few points
const mocks = require('./mocks.js');
const KEYS = (process.env.KEYS || 'case-ewoks,case-plato').split(',');
const H = { 'case-ewoks': 26, 'case-plato': 46, 'case-grocery': 30 };
exports.opts = { name: 'plan', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 960, height: 720 } };
exports.checks = async ({ p, STEP, log, shot }) => {
  for (const key of KEYS) {
    const n = await p.evaluate(k => { const W = window.__world, F = W.film; F.stop(); F.trailer(k); return F.scene ? F.scene.actors.length : 0; }, key);
    let ready = false; for (let i = 0; i < 800 && !ready; i++) { await STEP(0.25); ready = await p.evaluate(a => { const F = window.__world.film; return F.donors.size >= 1 && [...F.donors.values()].every(d => d.group && d.group.userData.tris > 100) && F.actors.size >= a; }, n); }
    const floor = await p.evaluate(pts => { const W = window.__world, F = W.film, M = 40, sp = F.sceneSpawn, d = [...F.donors.values()][0], rc = new THREE.Raycaster(); return pts.map(([x, z]) => { rc.set(new THREE.Vector3(sp.x + x * M, 200 * M, sp.z + z * M), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(d.group, true); return `(${x},${z}) ${h.length ? (h[0].point.y / M).toFixed(2) : '-'}`; }); }, key === 'case-ewoks' ? [[-40, -28], [-14, -2], [14, -2], [0, 3], [30, 20], [-14, 20]] : [[-30, 0], [-3.5, -5], [0, -5], [0, 6.2], [4, 12], [-14, 16], [-30, -12]]);
    log(key, 'floor', floor.join(' '));
    await p.evaluate(() => { const W = window.__world; if (W.theatre) W.theatre(true); }); await p.evaluate(() => { const W = window.__world; if (W.setSky) W.setSky('day'); if (W.sky) W.sky.mood = null; if (W.renderer) W.renderer.toneMappingExposure = 1; });
    const views = [['plan', [0, H[key], 0.01], [0, 0, 0], 80], ['fromS', [0, 12, 40], [0, 2, 0], 60], ['fromN', [0, 12, -40], [0, 2, 0], 60], ['fromE', [40, 12, 0], [0, 2, 0], 60], ['fromW', [-40, 12, 0], [0, 2, 0], 60]];
    for (const [name, pos, tgt, fov] of views) {
      await p.evaluate(([pos, tgt, fov]) => { const W = window.__world, F = W.film, M = 40, sp = F.sceneSpawn; const k = { pos: new THREE.Vector3(sp.x + pos[0] * M, pos[1] * M, sp.z + pos[2] * M), tgt: new THREE.Vector3(sp.x + tgt[0] * M, tgt[1] * M, sp.z + tgt[2] * M), fov }; F.shots.push({ name: 'scout', keys: [k], sec: 4 }); F.playShot(F.shots.length - 1); }, [pos, tgt, fov]);
      await STEP(0.4); await shot(key + '-' + name);
    }
    await p.evaluate(() => window.__world.film.stop());
  }
};
