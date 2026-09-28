/* Level 5 · The Bag of Winds — FIST. Nine days out from Aeolia, Ithaca's watch-fires on the horizon, Odysseus asleep at the
   steering oar, and his men sure the ox-hide bag holds gold. When a hand reaches for the bag (its arm lifts, a red ring fills
   round the bag), close your fist over it. The grip tires: holding drains it, an open hand rests it, so hold only while a
   hand reaches. Keep it shut until the fires are close: the poem's crew opened it; yours did not. */
OG.level({
  id: '05-winds', icon: 'fist',
  async setup(ctx) {
    const E = ctx.E, s = ctx.s, d = ctx.data; E.rid = 0; const rows = [];
    // the ship: a deck of plates, bulwarks of 1 x 6 bricks, the mast of round bricks, the steering oar's post
    for (let x = -120; x <= 120; x += 120) for (let z = -160; z <= 160; z += 80) rows.push(E.row('3032', 70, x, 0, z, 0));
    for (let z = -150; z <= 150; z += 120) rows.push(E.row('3009', 6, -190, 8, z, 1), E.row('3009', 6, 190, 8, z, 1));
    for (let k = 0; k < 7; k++) rows.push(E.row('3941', 70, 0, 8 + k * 24, -110, 0));
    rows.push(E.row('3008', 6, 0, 8, 215, 0), E.row('3003', 70, 60, 8, 180, 0));
    await E.stage(rows);
    E.setView({ bg: 0x3a4d6a, floor: null, fog: [0x3a4d6a, 900, 2600] }); E.hemi.intensity = .28;
    s.sea = E.add(E.sea({ color: '#1d4a6e' }));
    await E.ensureParts(['10169', '64647', '2542', '2435']);
    // the bag: the ox-hide sack, its silver cord
    s.bag = new THREE.Group(); const sack = E.brick('10169', 28, 0, 0, 0, 0); sack.scale.setScalar(2.0); s.bag.add(sack); s.cord = new THREE.Mesh(new THREE.TorusGeometry(16, 2, 8, 24), new THREE.MeshStandardMaterial({ color: 0xd8d8e0, metalness: .9, roughness: .2 })); s.cord.rotation.x = Math.PI / 2; s.cord.position.y = 36; s.bag.add(s.cord); s.bag.position.set(0, 8, 20); E.add(s.bag);
    s.ringMat = null;
    // Ithaca on the horizon: a green hill of bricks with its watch-fires
    s.ithaca = new THREE.Group(); for (let i = 0; i < 9; i++) for (let k = 0; k < 4 - Math.abs(i - 4) / 1.5; k++) s.ithaca.add(E.brick('3001', k > 1 ? 2 : 28, (i - 4) * 80, k * 24, (k % 2) * 20, 0));
    s.fires = []; for (const x of [-120, 0, 140]) { const f = E.brick('64647', 25, x, 100, 0, 0); f.scale.setScalar(2.4); s.ithaca.add(f); s.fires.push(f); }
    s.ithaca.position.set(80, 0, -2200); s.ithaca.scale.setScalar(1.6); E.add(s.ithaca);
    // the crew about the bag, and Odysseus asleep at the oar
    s.crew = []; const spots = [[-120, -40, Math.PI / 2], [120, -30, -Math.PI / 2], [-110, 110, Math.PI * .75], [110, 120, -Math.PI * .75]];
    for (let i = 0; i < 4; i++) { const [x, z, h] = spots[i]; const a = await E.actor({ name: 'Eurylochus', printed: i % 2 ? '3626bp35' : '3626bp01', def: { legs: [70, 28, 72, 19][i], hips: [70, 28, 72, 19][i], torso: [4, 19, 2, 15][i], arms: [4, 19, 2, 15][i], hands: 14, head: 14, hat: i % 2 ? null : ['3901', 6] }, at: [x, 8, z], heading: h }); a.fly = 8; a.arms = [0, 0]; s.crew.push(a); }
    s.odys = await E.actor({ name: 'Odysseus', face: 'odysseus', def: { legs: 70, hips: 70, torso: 19, arms: 19, hands: 14, head: 14, hat: ['3901', 70] }, at: [40, 8, 215], heading: Math.PI, emotion: 'weariness' }); s.odys.fly = 8; s.odys.sit = true;
    const oar = E.brick('2542', 70, 150, 30, 200, 0); oar.scale.setScalar(2.2); oar.rotation.z = Math.PI / 2; E.add(oar);
    // the reaches: spread across the voyage, each by a different man
    const n = d.reaches, T = d.voyage; s.reaches = []; for (let i = 0; i < n; i++) s.reaches.push({ at: 6 + i * (T - 14) / (n - 1) + ((i * 37) % 5 - 2) * .6, who: (i * 3 + 1) % 4, dur: 2.6, state: 'wait' });
    s.grip = d.grip; s.holdT = 0; s.wasteT = 0; s.blocked = 0; s.slip = false;
    ctx.A.loop('sea', { gain: .45 }); ctx.A.loop('wind-low', { gain: .25 }); ctx.setStage('voyage');
  },
  intro(ctx) { ctx.say('intro'); },
  begin(ctx) { ctx.cue(null, 'fist'); ctx.In.pressPose = 'fist'; },
  update(dt, ctx, phase) {
    const E = ctx.E, In = ctx.In, H = ctx.H, s = ctx.s, A = ctx.A, d = ctx.data;
    s.sea.userData.tex.offset.y += dt * .25; s.fires.forEach((f, i) => f.scale.setScalar(2.2 + Math.sin(E.time * 9 + i) * .25));
    if (phase !== 'play' || ctx.stage !== 'voyage') return;
    const c = In.primary(), bs = E.toScreen(s.bag.position.clone().add(new THREE.Vector3(0, 40, 0)));
    const near = Math.hypot((c.x - bs.x) * 1.6, c.y - bs.y) < .14;
    let want = c.src === 'hand' ? (c.pose === 'fist' && near) : c.src === 'mouse' ? (In.mouse.down && near) : In.key.down;
    if (s.slip) { if (s.grip > 1.2) s.slip = false; want = false; }
    const hold = want && s.grip > 0; s.holding = hold;
    if (hold) { s.grip = Math.max(0, s.grip - dt); s.holdT += dt; if (s.grip <= 0) { s.slip = true; A.sfx('creak'); H.flash('Your grip slips — open to rest it', 'bad'); } } else s.grip = Math.min(d.grip, s.grip + dt * .8);
    const u = Math.min(1, ctx.t / d.voyage); s.ithaca.position.z = -2200 + u * 1650; s.ithaca.scale.setScalar(1.6 + u * .6);
    if (!s.slept && u > .4) { s.slept = true; ctx.say('sleep'); }
    // the reaches
    let active = null;
    for (const r of s.reaches) {
      const a = s.crew[r.who];
      if (r.state === 'wait' && ctx.t >= r.at) { r.state = 'reach'; r.t = 0; A.sfx('whisper', { gain: .6 }); a.emotion = null; }
      if (r.state === 'reach') { r.t += dt; active = r; a.arms = [-1.4 * Math.min(1, r.t / r.dur), -.3]; a.heading = Math.atan2(s.bag.position.x - a.rig.pos.x, s.bag.position.z - a.rig.pos.z);
        if (r.t >= r.dur) { if (hold) { r.state = 'blocked'; s.blocked++; A.sfx('thud'); H.flash('Shut!', 'good'); E.shake(.25); a.arms = [0, 0]; } else { r.state = 'opened'; this.burst(ctx); return; } } }
    }
    if (hold && !active) s.wasteT += dt;
    const bagCol = active ? (hold ? '#7fe07a' : '#ff6b5a') : hold ? '#9fd4ff' : 'rgba(255,226,138,.8)';
    H.ring(bs.x, bs.y, 34, bagCol, { width: 4, label: active ? (hold ? 'HELD SHUT' : 'A HAND REACHES!') : 'THE BAG', progress: active ? active.t / active.dur : null });
    if (active) { const q = E.toScreen(s.crew[active.who].rig.pos.clone().add(new THREE.Vector3(0, 60, 0))); H.ring(q.x, q.y, 14, '#ff6b5a', { width: 3 }); H.line(q, bs, 'rgba(255,107,90,.7)', 2, [5, 5]); }
    H.meters([{ id: 'home', label: 'Ithaca', value: u, color: '#ffb347', text: Math.round(u * 100) + '%' }, { id: 'grip', label: 'Your grip', value: s.grip / d.grip, color: s.slip ? '#d2452f' : '#9fd4ff', text: s.slip ? 'rest it' : '', warn: s.grip < 1.2 }]);
    if (u >= 1) { A.sfx('studs-final'); ctx.win({ accuracy: s.blocked / s.reaches.length * (1 - .5 * s.wasteT / Math.max(1, s.holdT)), accLabel: 'grip well spent', title: "Ithaca's fires", text: 'The bag stayed shut. In the poem the crew loosed it here, in sight of home; in yours they did not.' }); }
  },
  burst(ctx) {
    const s = ctx.s, A = ctx.A, E = ctx.E; ctx.setStage('burst'); A.sfx('burst'); A.loop('wind-howl', { gain: .9 }); A.loop('storm', { gain: .6 }); E.shake(2); s.cord.visible = false; E.setView({ bg: 0x1d2530, floor: null, fog: [0x1d2530, 300, 1200] });
    s.crew.forEach(a => a.emotion = 'fear'); s.odys.emotion = 'anguish'; s.odys.sit = false;
    ctx.A.hush(); ctx.say('lose').then(() => ctx.say('curse'));
    ctx.lose('A hand reached and nothing stopped it: the crew loosed the silver cord, and every wind leapt out and drove the ship back to Aeolia.', { title: 'The winds are loose' });
  },
  onKey() { },
  debug(ctx) { const s = ctx.s, E = ctx.E; const active = s.reaches ? s.reaches.find(r => r.state === 'reach') : null; return { stage: ctx.stage, bag: E.toScreen(s.bag.position.clone().add(new THREE.Vector3(0, 40, 0))), reaching: !!active, reachT: active ? active.t : null, holding: !!s.holding, grip: s.grip, blocked: s.blocked, progress: Math.min(1, ctx.t / ctx.data.voyage), next: s.reaches ? (s.reaches.find(r => r.state === 'wait') || {}).at : null, t: ctx.t }; },
});
