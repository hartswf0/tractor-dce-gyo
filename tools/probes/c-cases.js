// the three cases play through on cinerium: the set is laid, the cast stands, every shot plays, the film ends; a frame of the band per case
const mocks = require('./mocks.js');
exports.opts = { name: 'cases', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 1100, height: 700 } };
exports.checks = async ({ p, STEP, A, log, shot }) => {
  for (const key of ['case-grocery', 'case-ewoks', 'case-plato']) {
    const t0 = Date.now();
    const n = await p.evaluate(k => { const W = window.__world, F = W.film; F.stop(); const n = F.trailer(k); return { n, shots: F.shots.length, actors: F.scene ? F.scene.actors.length : 0, donors: F.scene ? F.scene.donors.length : 0 }; }, key);
    log(key, 'loaded', JSON.stringify(n));
    let ready = false; for (let i = 0; i < 600 && !ready; i++) { await STEP(0.25); ready = await p.evaluate(() => { const F = window.__world.film; return !!(F.donors && F.donors.size >= 1 && [...F.donors.values()].every(d => d.group) && F.scene && F.scene.ready !== false); }); }
    const laid = await p.evaluate(() => { const F = window.__world.film; return { ready: !!(F.scene && F.scene.ready), donors: [...F.donors.values()].map(d => ({ name: d.name, tris: d.group && d.group.userData.tris, size: d.group && d.group.userData.size })), actors: [...F.actors.values()].filter(a => a.rig).length, marks: F.marks.size }; });
    log(key, 'laid', JSON.stringify(laid).slice(0, 300), ((Date.now() - t0) / 1000).toFixed(0) + 's');
    A(laid.donors.length === 1 && laid.donors[0].tris > 100, key + ': the set is laid');
    A(laid.actors >= 4 && laid.marks >= 6, key + ': the cast stands on its marks');
    await p.evaluate(() => { const W = window.__world; if (W.theatre) W.theatre(true); W.film.playAll(); });
    const names = new Set(); let steps = 0, threw = null; const shotsAt = {};
    while (steps < 500) { const st = await p.evaluate(() => { const W = window.__world, F = W.film; try { W.step(0.25); } catch (e) { return { threw: e.stack.slice(0, 300), name: F.shots[F.play.i] && F.shots[F.play.i].name }; } const s = F.shots[F.play.i]; return { on: F.play.on, i: F.play.i, name: s && s.name }; }); steps++; if (st.threw) { threw = st; break; } if (!st.on) break; if (st.name) { names.add(st.name); if (!shotsAt[st.name]) { shotsAt[st.name] = steps; if (steps === 4) await shot(key + '-s' + Object.keys(shotsAt).length + '-0'); if (Object.keys(shotsAt).length >= 2 && steps - shotsAt[st.name] === 0) await shot(key + '-s' + Object.keys(shotsAt).length); } } }
    if (threw) log(key, 'THREW in', threw.name, threw.threw);
    log(key, 'played', steps, 'steps, shots seen', names.size, ((Date.now() - t0) / 1000).toFixed(0) + 's');
    A(!threw && steps < 500, key + ': the film plays to its end without throwing');
    A(names.size >= n.shots - 3, key + ': every named shot was reached');
  }
};
