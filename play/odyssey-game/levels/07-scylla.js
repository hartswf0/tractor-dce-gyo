/* Level 7 · Scylla and Charybdis — FLAT PALM. Steer the ship down the strait with an open hand held flat: the palm's place
   across the frame is the helm. On the left, the cliff where Scylla's six heads hang; a head rears (its eyes light) and then
   strikes across the left of the channel. On the right, Charybdis, whose pull grows the closer the ship comes; in her
   throat the ship is lost. Hug the cliff as Circe told, but not so close the heads can reach: the men you keep are kleos. */
OG.level({
  id: '07-scylla', icon: 'steer',
  async setup(ctx) {
    const E = ctx.E, s = ctx.s; E.rid = 0; const rows = [];
    for (let x = -60; x <= 60; x += 120) for (let z = -80; z <= 80; z += 80) rows.push(E.row('3032', 70, x, 0, z, 0));
    for (let z = -100; z <= 100; z += 100) rows.push(E.row('3009', 6, -100, 8, z, 1), E.row('3009', 6, 100, 8, z, 1));
    for (let k = 0; k < 6; k++) rows.push(E.row('3941', 70, 0, 8 + k * 24, -40, 0));
    await E.stage(rows);
    E.setView({ bg: 0x6f8190, floor: null, fog: [0x6f8190, 700, 2200] }); E.hemi.intensity = .3;
    s.sea = E.add(E.sea({ color: '#1f4d6a' }));
    await E.ensureParts(['3960', '2542']);
    // the world moves; the ship is still: the cliff, the heads, the whirlpool
    s.world = new THREE.Group(); E.add(s.world);
    const cliff = new THREE.Group(); for (let z = -1400; z <= 600; z += 80) for (let k = 0; k < 9; k++) cliff.add(E.brick('3001', k % 3 ? 72 : 0, -420 - (k % 2) * 20, k * 24, z, 1)); s.world.add(cliff);
    s.heads = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); for (let k = 0; k < 7; k++) g.add(E.brick('3062b', 288, 0, -k * 24, 0, 0)); const head = new THREE.Group(); head.add(E.brick('3001', 288, 0, 0, 0, 1), E.brick('3039', 288, 0, 24, 10, 0)); const eyes = new THREE.Mesh(new THREE.BoxGeometry(30, 6, 4), new THREE.MeshBasicMaterial({ color: 0x331100 })); eyes.position.set(0, 16, 22); head.add(eyes); head.position.set(0, -170, 0); g.add(head);
      g.position.set(-400, 230, -1000 + i * 260); s.world.add(g); s.heads.push({ g, head, eyes, base: g.position.clone(), state: 'hang', t: 0 }); }
    s.pool = new THREE.Group(); const dish = E.brick('3960', 1, 0, 0, 0, 0); dish.scale.set(5, 1.2, 5); dish.rotation.x = Math.PI; dish.position.y = 6; s.pool.add(dish); s.swirls = []; for (let r = 1; r <= 4; r++) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * 45, 3, 6, 40), new THREE.MeshBasicMaterial({ color: 0xcfe8f5, transparent: true, opacity: .55 })); t.rotation.x = Math.PI / 2; t.position.y = 2; s.pool.add(t); s.swirls.push(t); }
    s.pool.position.set(330, 0, -300); s.world.add(s.pool);
    s.crew = []; for (let i = 0; i < 4; i++) { const x = i % 2 ? 70 : -70, z = -60 + Math.floor(i / 2) * 110; const a = await E.actor({ name: 'Oarsman', printed: '3626bp35', def: { legs: [28, 72, 19, 70][i], hips: 0, torso: [4, 2, 15, 19][i], arms: [4, 2, 15, 19][i], hands: 14, head: 14, hat: null }, at: [x, 8, z], heading: Math.PI }); a.fly = 8; a.sit = true; s.crew.push(a); }
    s.odys = await E.actor({ name: 'Odysseus', face: 'odysseus', def: { legs: 70, hips: 70, torso: 19, arms: 19, hands: 14, head: 14, hat: ['3896', 71], weapon: ['spear', '4497', 71] }, at: [0, 8, 100], heading: Math.PI, emotion: 'resolve' }); s.odys.fly = 8;
    s.x = 0; s.v = 0; s.men = 6; s.dist = 0; s.struck = 0;
    ctx.A.loop('whirlpool', { gain: .4 }); ctx.A.loop('sea', { gain: .3 }); ctx.setStage('strait');
  },
  intro(ctx) { ctx.say('intro'); },
  begin(ctx) { ctx.cue(null, 'steer'); ctx.say('row', ctx.s.odys); },
  update(dt, ctx, phase) {
    const E = ctx.E, In = ctx.In, H = ctx.H, s = ctx.s, A = ctx.A, d = ctx.data;
    s.pool.rotation.y -= dt * 1.4; s.swirls.forEach((t, i) => { t.scale.setScalar(1 + ((E.time * .5 + i * .25) % 1) * .2); });
    s.sea.userData.tex.offset.y += dt * .3; s.sea.userData.tex.offset.x = s.x * .5;
    s.world.position.set(-s.x * 230, 0, s.dist);
    if (phase !== 'play') return;
    const c = In.primary(), u = ctx.t / d.course;
    // the helm: an open palm (flat) steers; any other pose holds the helm where it is
    let want = null; if (c.src === 'hand') { if (c.pose === 'open') want = In.R.steer(); } else if (c.src === 'mouse') want = In.R.steer(); else want = null;
    if (c.src === 'key') { const k = In.key.held; s.v += ((k.has('ArrowRight') ? 1 : 0) - (k.has('ArrowLeft') ? 1 : 0)) * dt * 2.4; s.v *= Math.exp(-dt * 1.5); s.x += s.v * dt; }
    else if (want != null) s.x += (want - s.x) * (1 - Math.exp(-dt * 2.2));
    // Charybdis draws her in, harder the nearer she comes
    const pull = s.x > .2 ? Math.pow((s.x - .2) / .8, 1.6) * .9 : 0; s.x += pull * dt; s.x = Math.max(-1, s.x);
    s.dist = u * 1800;
    // the heads: each rears when abreast, then strikes the left of the channel
    for (const h of s.heads) { const z = h.base.z + s.dist; h.g.position.z = h.base.z;
      if (h.state === 'hang' && z > -120) { h.state = 'rear'; h.t = 0; h.eyes.material.color.setHex(0xff3a10); A.sfx('screams-far', { gain: .4 }); if (!s.warned) { s.warned = true; ctx.say('heads'); } }
      if (h.state === 'rear') { h.t += dt; h.g.position.y = h.base.y + Math.sin(h.t * 10) * 6; if (h.t > 1.3) { h.state = 'strike'; h.t = 0; A.sfx('roar', { gain: .6 }); } }
      if (h.state === 'strike') { h.t += dt; const k = Math.sin(Math.min(1, h.t / .7) * Math.PI); h.g.position.x = h.base.x + k * 300; h.g.position.y = h.base.y - k * 60;
        if (!h.hitChecked && h.t > .35) { h.hitChecked = true; if (s.x < -.2) { s.men--; s.struck++; A.sfx('yell'); E.shake(.7); H.flash('A head takes a man', 'bad'); const a = s.crew[s.struck % s.crew.length]; if (a) a.visible = false; } else H.flash('Clear', 'good'); }
        if (h.t > .7) { h.state = 'gone'; h.eyes.material.color.setHex(0x331100); } } }
    const sp = E.toScreen(new THREE.Vector3(0, 30, 0)); H.ring(sp.x, sp.y, 26, s.x > .5 ? '#ff6b5a' : s.x < -.2 ? '#ffb347' : '#7fe07a', { width: 3, label: 'THE SHIP' });
    const pooled = Math.max(0, (s.x - .2) / .75);
    H.meters([{ id: 'strait', label: 'The strait', value: u, color: '#7fe07a', text: Math.round(u * 100) + '%' }, { id: 'men', label: 'Men aboard', value: s.men / 6, color: '#e8c55a', text: s.men + ' / 6' }, { id: 'pool', label: 'Charybdis', value: pooled, color: '#3aa0d8', text: pooled > .6 ? 'STEER LEFT!' : '', warn: pooled > .6 }]);
    if (s.x >= .95) { A.sfx('splash'); A.sfx('burst'); E.shake(2); ctx.lose('Charybdis drank her down, ship and crew and all.', { title: 'The whirlpool' }); }
    else if (s.men <= 0) ctx.lose('Scylla took every man.', { title: 'The six heads' });
    else if (u >= 1) { A.sfx('studs-final'); ctx.win({ accuracy: s.men / 6, accLabel: 'men kept', title: 'Through the strait', text: s.men + ' of 6 kept from the heads. "The worst sight of all my wanderings on the paths of the sea."' }); }
  },
  onKey() { },
  debug(ctx) { const s = ctx.s; return { stage: ctx.stage, x: s.x, men: s.men, progress: ctx.t / ctx.data.course, rearing: s.heads.some(h => h.state === 'rear' || h.state === 'strike') }; },
});
