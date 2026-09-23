// close-ups of one figure of a case: laid on its mark, seen from four sides, at rest and in a phrase (WHO, KEY, PHRASE)
const mocks = require('./mocks.js');
const KEY = process.env.KEY || 'case-grocery', WHO = process.env.WHO || 'flanders', PH = process.env.PHRASE || 'joy';
exports.opts = { name: 'closeup', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 640, height: 640 } };
exports.checks = async ({ p, STEP, log, shot, sleep }) => {
  await p.evaluate(k => { const F = window.__world.film; F.stop(); F.trailer(k); }, KEY);
  for (let i = 0; i < 600; i++) { await STEP(0.25); if (await p.evaluate(w => { const a = window.__world.film.actors.get(w); return a && a.rig && window.__world.film.scene.ready; }, WHO)) break; }
  const look = async (name, ang, h = 1.6, d = 2.6) => { await p.evaluate(([w, ang, h, d]) => { const W = window.__world, F = W.film, a = F.actors.get(w), P = a.rig.pos, M = 40; F.setMode('free'); const x = P.x + Math.sin(ang) * d * M, z = P.z + Math.cos(ang) * d * M; F.free.pos.set(x, P.y + h * M, z); F.free.yaw = Math.atan2(-(P.x - x), -(P.z - z)); F.free.pitch = Math.atan2(1.3 * M - h * M, d * M); F.free.fov = 40; }, [WHO, ang, h, d]); await STEP(0.1); await sleep(500); await shot(name); };
  const face = await p.evaluate(w => window.__world.film.actors.get(w).rig.heading, WHO);
  for (const [n, a] of [['front', 0], ['side', Math.PI / 2], ['back', Math.PI], ['three', -0.7]]) await look(WHO + '-rest-' + n, face + a);
  await p.evaluate(([w, ph]) => { const F = window.__world.film, a = F.actors.get(w); if (a.perf && window.Perform) Perform.phrase(a.perf, ph, 0, { enter: 0.2 }); }, [WHO, PH]);
  for (let i = 0; i < 6; i++) { await STEP(0.25); }
  await look(WHO + '-' + PH + '-front', face); await look(WHO + '-' + PH + '-side', face + Math.PI / 2);
  log('parts', await p.evaluate(w => { const r = window.__world.film.actors.get(w).rig; const out = []; r.figure.traverse(o => { if (o.name) out.push(o.name); }); return out.slice(0, 40).join(' '); }, WHO));
};
