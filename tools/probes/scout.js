// camera scout: lay a case, then cut to every shot and keep its first and last frame, so the cameras can be judged without playing the film through
const mocks = require('./mocks.js');
const KEYS = (process.env.KEYS || 'case-ewoks,case-plato').split(',');
exports.opts = { name: 'scout', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 960, height: 540 } };
exports.checks = async ({ p, STEP, A, log, shot }) => {
  for (const key of KEYS) {
    const t0 = Date.now();
    const n = await p.evaluate(k => { const W = window.__world, F = W.film; F.stop(); const n = F.trailer(k); return { n, shots: F.shots.map(s => ({ name: s.name, sec: s.sec, title: s.title != null && s.style !== 'hud' && s.style !== 'list' })), actors: F.scene ? F.scene.actors.length : 0 }; }, key);
    log(key, 'loaded', n.n, 'shots', n.actors, 'actors');
    let ready = false; for (let i = 0; i < 800 && !ready; i++) { await STEP(0.25); ready = await p.evaluate(a => { const F = window.__world.film; return F.donors.size >= 1 && [...F.donors.values()].every(d => d.group && d.group.userData.tris > 100) && F.actors.size >= a; }, n.actors); }
    log(key, 'laid', ready, ((Date.now() - t0) / 1000).toFixed(0) + 's');
    await p.evaluate(() => { const W = window.__world; if (W.theatre) W.theatre(true); });
    for (let i = 0; i < n.shots.length; i++) {
      const s = n.shots[i]; if (s.title) continue;
      await p.evaluate(i => window.__world.film.playShot(i), i); await STEP(0.5); await shot(key + '-' + String(i).padStart(2, '0') + 'a');
      await STEP(Math.max(0.3, s.sec * 0.55)); await shot(key + '-' + String(i).padStart(2, '0') + 'b');
      const cam = await p.evaluate(() => { const W = window.__world, c = W.camera, M = 40; return [c.position.x / M, c.position.y / M, c.position.z / M].map(v => +v.toFixed(1)).join(',') + ' fov ' + c.fov.toFixed(0); });
      log(key, i, s.name, 'cam', cam);
    }
    await p.evaluate(() => window.__world.film.stop());
  }
};
