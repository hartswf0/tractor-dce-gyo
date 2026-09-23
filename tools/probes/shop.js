// the list as a game, played by the probe: lay case-grocery with ?shop&go, then stand at each thing (by the plan) and take it,
// five red apples one at a time, take the light olive oil and put it back, bring Ned to the cart, pay; print the notes and the end card
const mocks = require('./mocks.js');
exports.opts = { name: 'shop', page: 'cinerium.html', routes: ctx => mocks.routes(ctx), viewport: { width: 960, height: 540 } };
exports.checks = async ({ p, STEP, log, A, shot, sleep }) => {
  for (let i = 0; i < 600; i++) { await STEP(0.25); if (await p.evaluate(() => window.Shop && window.Shop.on && window.Shop.started)) break; }
  A(await p.evaluate(() => window.Shop.started), 'the game started');
  await STEP(1); await sleep(500); await shot('0-door');
  // stand at a cell of the plan (built studs), facing another
  const stand = (at, face) => p.evaluate(([at, face]) => { const W = window.__world, d = [...W.film.donors.values()].find(d => d.solid), [x, z] = d.solid.toWorld(at[0], at[1]), [fx, fz] = d.solid.toWorld(face[0], face[1]); W.rig.pos.x = x; W.rig.pos.z = z; W.rig.heading = Math.atan2(fx - x, fz - z); W.rig.figure.rotation.y = W.rig.heading; W.rig.cam.set = false; }, [at, face]);
  const plan = await p.evaluate(() => [...window.__world.film.donors.values()].find(d => d.plan).plan);
  const fixture = name => plan.fixtures.find(f => f.name === name);
  const act = async (what, n = 1) => { const out = []; for (let i = 0; i < n; i++) { await STEP(0.6); out.push(await p.evaluate(w => { const S = window.Shop, r = S.reach || {}; return { take: r.take && r.take.name, back: r.back && r.back.name, did: S.act(w) }; }, what)); } return out; };
  for (const it of plan.items) {
    await stand([it.at[0] + 0.5, it.at[1] + 0.5], [it.shelf[0] + 0.5, it.shelf[1] + 0.5]);
    log('item', it.name, JSON.stringify(await act('take', it.count || 1)));
    await STEP(1); await sleep(300); await shot('1-item' + it.n);
  }
  // the wrong oil: take the light olive oil beside the extra virgin, then put it back
  const light = fixture('light olive oil'); await stand([light.x0 - 1.5, (light.z0 + light.z1) / 2], [light.x0 + 0.5, (light.z0 + light.z1) / 2]);
  log('light oil', JSON.stringify(await act('take'))); await STEP(0.5); await shot('2-light');
  log('put back', JSON.stringify(await act('back'))); await STEP(0.5); await shot('3-back');
  // Ned beside the cart: he looks in, and his guesses are put right
  await p.evaluate(() => { const F = window.__world.film, n = F.actors.get('flanders').rig, c = F.actors.get('cart').V; n.pos.x = c.pos.x + 60; n.pos.z = c.pos.z; });
  await STEP(1.5); await sleep(300); await shot('4-ned');
  log('record now', await p.evaluate(() => document.querySelector('#shopRec').innerText.replace(/\n/g, ' | ')));
  const lane = plan.lanes[1]; await stand(lane.customer, lane.belt);
  log('pay', JSON.stringify(await act('belt'))); await STEP(0.5); await sleep(500); await shot('5-end');
  log('list', await p.evaluate(() => document.querySelector('#shopList').innerText.replace(/\n/g, ' | ')));
  log('end', await p.evaluate(() => document.querySelector('#shopEnd').innerText.replace(/\n+/g, ' | ').slice(0, 1400)));
};
