// the flipbook in time: lay a case, play it through from the first shot the way an export does (small steps, every act and walk carried
// from shot to shot), and keep a frame every EVERY seconds of film, named by film time and shot, so positions are the film's own
const mocks = require('./mocks.js');
const KEY = process.env.KEY || 'case-searchers', EVERY = +(process.env.EVERY || 3), DT = 1 / 12;
exports.opts = { name: 'flip', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 960, height: 540 } };
exports.checks = async ({ p, STEP, log, shot }) => {
  const n = await p.evaluate(k => { const F = window.__world.film; F.stop(); F.trailer(k); return F.scene ? F.scene.actors.length : 0; }, KEY);
  for (let i = 0; i < 800; i++) { await STEP(0.25); const ok = await p.evaluate(a => { const F = window.__world.film; return F.donors.size >= 1 && [...F.donors.values()].every(d => d.group && d.group.userData.tris > 100) && F.actors.size >= a; }, n); if (ok) break; }
  await p.evaluate(() => { const W = window.__world; if (W.theatre) W.theatre(true); W.film.playAll(); });
  const total = await p.evaluate(() => window.__world.film.shots.reduce((a, s) => a + s.sec, 0));
  let t = 0, next = 0.5;
  while (t < total) { await STEP(DT); t += DT; if (t >= next) { const st = await p.evaluate(() => { const F = window.__world.film; return { i: F.play.i, on: F.play.on }; }); if (!st.on) break; await shot(KEY + '-' + String(Math.round(t * 10)).padStart(4, '0') + '-s' + st.i); next += EVERY; } }
  log('played', t.toFixed(1), 'of', total);
};
