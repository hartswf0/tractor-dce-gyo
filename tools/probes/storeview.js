// the store at a glance: lay a case whose set is a model with a plan, and take free-camera views at named points of the plan
// (built studs; y in metres): VIEWS='name:x,y,z>x,y,z;...' or the default tour of the supermarket
const mocks = require('./mocks.js');
const KEY = process.env.KEY || 'case-grocery';
const TOUR = process.env.VIEWS || 'alley:66,3.2,20>60,1.6,40;apples:109,2.4,21>113,0.8,28;bakery:88,2.6,26>92,0.8,18;oil:66,2.2,38>70,1.2,48;flour:56,2.2,54>58,1.0,62;frozen:10,2.6,30>4,1.6,44;meat:110,2.4,78>111,0.8,86;icecream:22,3,76>20,0.6,84;checkout:52,3.2,30>40,1,16;produce:96,3.6,12>112,1,40';
exports.opts = { name: 'view', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 960, height: 540 } };
exports.checks = async ({ p, STEP, log, shot, sleep }) => {
  await p.evaluate(k => { const F = window.__world.film; F.stop(); F.trailer(k); }, KEY);
  for (let i = 0; i < 600; i++) { await STEP(0.25); if (await p.evaluate(() => [...window.__world.film.donors.values()].some(d => d.solid && d.group && d.group.userData.tris > 100))) break; }
  await p.evaluate(() => { const W = window.__world; if (W.theatre) W.theatre(true); });
  for (const v of TOUR.split(';')) {
    const [name, spec] = v.split(':'), [a, b] = spec.split('>').map(t => t.split(',').map(Number));
    await p.evaluate(([a, b]) => { const W = window.__world, F = W.film, d = [...F.donors.values()].find(d => d.solid), M = 40, [ax, az] = d.solid.toWorld(a[0], a[2]), [bx, bz] = d.solid.toWorld(b[0], b[2]);
      F.setMode('free'); F.free.pos.set(ax, d.y0 + a[1] * M, az); const dx = bx - ax, dz = bz - az, dy = (b[1] - a[1]) * M; F.free.yaw = Math.atan2(-dx, -dz); F.free.pitch = Math.atan2(dy, Math.hypot(dx, dz)); F.free.fov = 55; }, [a, b]);
    await STEP(0.2); await sleep(600); await shot(name);
  }
  log('signs', await p.evaluate(() => { const d = [...window.__world.film.donors.values()].find(d => d.signs); return d ? d.signs.children.length : 0; }));
};
