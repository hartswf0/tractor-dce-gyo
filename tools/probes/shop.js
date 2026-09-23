// the list as a game: lay case-grocery with ?shop, look at the store from above and down its aisles, then play: walk to each thing
// on the list, take it (Shop.act), take one thing off the list, check out; print the notes and the end card
const mocks = require('./mocks.js');
exports.opts = { name: 'shop', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 960, height: 540 } };
exports.checks = async ({ p, STEP, log, A, shot, sleep }) => {
  for (let i = 0; i < 600; i++) { await STEP(0.25); if (await p.evaluate(() => window.Shop && window.Shop.on)) break; }
  A(await p.evaluate(() => window.Shop.on), 'the game started');
  const toW = (x, z) => p.evaluate(([x, z]) => { const d = [...window.__world.film.donors.values()].find(d => d.solid); return d.solid.toWorld(x, z); }, [x, z]);
  await STEP(1); await sleep(600); await shot('0-door');
  // free-camera looks: from above, down aisle 3, produce, frozen
  const look = async (name, from, to, fov = 55) => { const a = await toW(from[0], from[2]), b = await toW(to[0], to[2]);
    await p.evaluate(([a, b, fy, ty, fov]) => { const W = window.__world, F = W.film, M = 40; F.setMode('free'); F.free.pos.set(a[0], fy * M, a[1]); const dx = b[0] - a[0], dy = (ty - fy) * M, dz = b[1] - a[1]; F.free.yaw = Math.atan2(-dx, -dz); F.free.pitch = Math.atan2(dy, Math.hypot(dx, dz)); F.free.fov = fov; }, [a, b, from[1], to[1], fov]);
    await STEP(0.2); await sleep(700); await shot(name); };
  await look('1-above', [62, 60, -30], [62, 0, 50], 50);
  await look('2-above-back', [10, 40, 100], [70, 0, 40], 55);
  await look('3-aisle3', [57.5, 2.2, 26], [57.5, 1.4, 70], 60);
  await look('4-produce', [24, 3, 12], [6, 0.5, 40], 60);
  await look('5-frozen', [112, 2.4, 30], [118, 1.5, 60], 60);
  await look('6-checkouts', [70, 4, 30], [95, 0.5, 14], 60);
  await p.evaluate(() => window.__world.film.setMode('view'));
  // play: stand at each thing on the list and take it
  const items = await p.evaluate(() => [...window.__world.film.donors.values()].find(d => d.plan).plan.items);
  for (const it of items) {
    const w = await toW(it.at[0] + 0.5, it.at[1] + 0.5);
    await p.evaluate(([x, z, sx, sz]) => { const W = window.__world, [ax, az] = [...W.film.donors.values()].find(d => d.solid).solid.toWorld(sx, sz); W.rig.pos.x = x; W.rig.pos.z = z; W.rig.heading = Math.atan2(ax - x, az - z); W.rig.figure.rotation.y = W.rig.heading; W.rig.cam.set = false; }, [w[0], w[1], it.shelf[0] + 0.5, it.shelf[1] + 0.5]);
    await STEP(1.5); const r = await p.evaluate(() => { const S = window.Shop; return { reach: S.reach && S.reach.label, zone: S.reach && S.reach.zone.name, took: S.act() }; });
    log('item', it.n, it.name, JSON.stringify(r)); await STEP(2); await sleep(300); await shot('7-item' + it.n);
  }
  // one thing off the list: a shelf in aisle 6 (snacks)
  const w6 = await toW(94, 50); await p.evaluate(([x, z]) => { const W = window.__world; W.rig.pos.x = x; W.rig.pos.z = z; W.rig.heading = -Math.PI / 2; }, w6);
  await STEP(1); log('off-list', JSON.stringify(await p.evaluate(() => { const S = window.Shop; return { reach: S.reach && S.reach.label, took: S.act() }; })));
  // Ned: where is he, how far behind
  log('ned', JSON.stringify(await p.evaluate(() => { const W = window.__world, n = W.film.actors.get('flanders').rig.pos; return { d: Math.hypot(n.x - W.rig.pos.x, n.z - W.rig.pos.z) / 40, crumbs: window.Shop.crumbs.length }; })));
  // the belt
  const lane = await p.evaluate(() => [...window.__world.film.donors.values()].find(d => d.plan).plan.lanes[1]);
  const wl = await toW(lane.customer[0], lane.customer[1]); await p.evaluate(([x, z]) => { const W = window.__world; W.rig.pos.x = x; W.rig.pos.z = z; }, wl);
  await STEP(1); log('belt', JSON.stringify(await p.evaluate(() => { const S = window.Shop; return { reach: S.reach && S.reach.label, took: S.act() }; })));
  await STEP(0.5); await sleep(500); await shot('8-end');
  log('list', await p.evaluate(() => document.querySelector('#shopList').innerText.replace(/\n/g, ' | ')));
  log('record', await p.evaluate(() => document.querySelector('#shopRec').innerText.replace(/\n/g, ' | ')));
  log('end', await p.evaluate(() => document.querySelector('#shopEnd').innerText.replace(/\n+/g, ' | ').slice(0, 900)));
};
