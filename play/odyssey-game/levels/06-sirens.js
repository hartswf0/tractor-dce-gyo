/* Level 6 · The Sirens — CIRCLE · PUMP. The wax is in the crew's ears; Odysseus has asked to hear.
   BIND  circle a finger: every turn winds a coil of rope round him and the mast (three turns bind him).
   ROW   pump a hand up and down: every stroke drives the ship on and pulls her head off the flowered shore; the song draws
         her toward the rocks, strongest abeam of the isle. Rocks, and she is lost; past the isle, and the song fades. */
OG.level({
  id: '06-sirens', icon: 'circle',
  async setup(ctx) {
    const E = ctx.E, s = ctx.s; E.rid = 0; const rows = [];
    for (let x = -80; x <= 80; x += 80) for (let z = -120; z <= 120; z += 120) rows.push(E.row('3032', 70, x, 0, z, 1));
    for (let z = -150; z <= 150; z += 100) rows.push(E.row('3009', 6, -130, 8, z, 1), E.row('3009', 6, 130, 8, z, 1));
    for (let k = 0; k < 8; k++) rows.push(E.row('3941', 70, 0, 8 + k * 24, -20, 0));
    await E.stage(rows);
    E.setView({ bg: 0xbfd8e6, floor: null, fog: [0xbfd8e6, 900, 2600] });
    s.sea = E.add(E.sea({ color: '#2a6d99' }));
    await E.ensureParts(['2542', '2417', '2423', '3957a']);
    // the isle of the Sirens: a flowered meadow on rocks, off the left bow; it passes as she rows
    s.isle = new THREE.Group(); for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) s.isle.add(E.brick('3001', j === 2 ? 2 : 72, -40 - j * 70, 0, -280 + i * 80, 1), E.brick('3001', j === 2 ? 10 : 71, -40 - j * 70, 24, -280 + i * 80, 1));
    for (let i = 0; i < 7; i++) { const r = E.brick('3003', 72, 30, 0, -260 + i * 90, 0); r.scale.set(1.4, 1 + (i % 3) * .5, 1.4); s.isle.add(r); }
    for (let i = 0; i < 6; i++) s.isle.add(E.brick(i % 2 ? '2417' : '2423', i % 3 ? 4 : 14, -120 - (i % 2) * 60, 48, -250 + i * 95, 0));
    s.isle.position.set(-420, 0, -900); E.add(s.isle);
    s.sirens = []; for (let i = 0; i < 3; i++) { const a = await E.actor({ name: 'Siren', printed: '3626bp40', def: { legs: 26, hips: 26, torso: 15, arms: 15, hands: 14, head: 14, hat: null }, at: [0, 48, 0], heading: Math.PI / 2 }); a.fly = 48; a.arms = [-2.4, -2.4]; s.sirens.push(a); }
    // Odysseus against the mast; the crew at the oars, wax in their ears
    s.odys = await E.actor({ name: 'Odysseus', face: 'odysseus', def: { legs: 70, hips: 70, torso: 19, arms: 19, hands: 14, head: 14, hat: ['3901', 70] }, at: [0, 8, 5], heading: 0, emotion: 'resolve' }); s.odys.fly = 8;
    s.crew = []; for (let i = 0; i < 4; i++) { const x = i % 2 ? 95 : -95, z = -90 + Math.floor(i / 2) * 150; const a = await E.actor({ name: 'Oarsman', printed: '3626bp35', def: { legs: [28, 72, 19, 70][i], hips: 0, torso: [4, 2, 15, 19][i], arms: [4, 2, 15, 19][i], hands: 14, head: 14, hat: null }, at: [x, 8, z], heading: 0 }); a.fly = 8; a.sit = true; const oar = new THREE.Group(), om = E.brick('2542', 70, 0, 0, 0, 0); om.scale.setScalar(2.2); om.rotation.z = Math.PI / 2 * (i % 2 ? -1 : 1); oar.add(om); oar.position.set(x + (i % 2 ? 40 : -40), 34, z); E.add(oar); a.oar = oar; s.crew.push(a); }
    s.coils = []; s.turns = 0; s.x = 0; s.v = 0; s.prog = 0; s.strokes = 0;
    ctx.A.loop('sea-calm', { gain: .4 }); ctx.setStage('bind');
  },
  intro(ctx) { ctx.say('intro'); },
  begin(ctx) { ctx.cue('bind', 'circle', 'BIND HIM TO THE MAST'); ctx.s.since = performance.now(); ctx.In.pressPose = 'point'; },
  update(dt, ctx, phase) {
    const E = ctx.E, In = ctx.In, H = ctx.H, s = ctx.s, A = ctx.A, d = ctx.data;
    s.sea.userData.tex.offset.y += dt * (.05 + s.v * .02);
    const isleZ = -900 + (s.prog / d.course) * 1700; s.isle.position.set(-420 + s.x * 160, 0, isleZ);
    s.sirens.forEach((a, i) => { a.rig.pos.set(s.isle.position.x - 100 - (i % 2) * 50, 48, isleZ - 120 + i * 120); a.heading = Math.PI / 2; });
    s.crew.forEach((a, i) => { if (a.oar) a.oar.rotation.y = Math.sin(s.stroke || 0) * .35 * (i % 2 ? 1 : -1); });
    if (phase !== 'play') return;
    const c = In.primary();
    if (ctx.stage === 'bind') {
      /* the turns are counted round the mast as the path arrives and kept (the history holds only 2.6 s: three circles
         inside it were too fast for a finger, and for a phone's frame rate); a pointer counts only while pressed */
      const mc = E.toScreen(new THREE.Vector3(0, 70, -10));
      if (s.turnId !== c.id) { s.turnId = c.id; s.prevA = null; }
      for (const q of In.history(c.id)) { if (q.t <= (s.lastT || s.since)) continue; s.lastT = q.t;
        if ((c.src === 'mouse' && !q.down) || Math.hypot((q.x - mc.x) * 1.6, q.y - mc.y) < .02) { s.prevA = null; continue; }
        const a = Math.atan2(q.y - mc.y, (q.x - mc.x) * 1.6); if (s.prevA != null) { const dA = Math.atan2(Math.sin(a - s.prevA), Math.cos(a - s.prevA)); if (Math.abs(dA) < 1.5) s.acc = (s.acc || 0) + dA; } s.prevA = a; }
      const turns = Math.abs(s.acc || 0) / (2 * Math.PI) + (s.keyTurns || 0);
      if (turns > s.turns) { const before = Math.floor(s.turns * 2); s.turns = Math.min(d.turns, turns); for (let k = before; k < Math.floor(s.turns * 2); k++) { const coil = new THREE.Mesh(new THREE.TorusGeometry(26, 2.6, 8, 26), new THREE.MeshStandardMaterial({ color: 0xc9b27a, roughness: .8 })); coil.rotation.x = Math.PI / 2; coil.position.set(0, 40 + k * 12, -12); E.add(coil); s.coils.push(coil); A.sfx('creak', { gain: .5 }); } }
      H.meters([{ id: 'rope', label: 'The rope', value: s.turns / d.turns, color: '#c9b27a', text: s.turns.toFixed(1) + ' / ' + d.turns + ' turns' }]);
      const ms = E.toScreen(new THREE.Vector3(0, 70, -10)); H.ring(ms.x, ms.y, 60, 'rgba(201,178,122,.8)', { width: 3, dash: [8, 6], label: 'CIRCLE HERE' });
      if (s.turns >= d.turns) { ctx.setStage('row'); A.sfx('studs-final'); H.flash('Bound fast', 'good'); ctx.say('bind'); ctx.cue('row', 'pump', 'ROW'); s.rowSince = performance.now(); s.lastStrokes = 0; A.loop('oars', { gain: .0 }); A.drone(0); s.odys.emotion = 'resolve'; }
    } else if (ctx.stage === 'row') {
      /* strokes are counted as the path arrives (R.strokes' reversals of at least 0.06, kept across frames): read over the 2.6 s
         history alone, a steady rowing rate never beat its own first count and the oars stopped counting */
      let newStrokes = 0;   // each stroke is worth 0.18 of the channel: a steady pump at a human pace (one stroke each way a second) outrows the song
      if (c.src === 'key') { const n = s.keyStrokes || 0; newStrokes = Math.max(0, n - s.lastStrokes); s.lastStrokes = Math.max(s.lastStrokes, n); }
      else { if (s.rowId !== c.id) { s.rowId = c.id; s.rdir = 0; s.rext = null; }
        for (const q of In.history(c.id)) { if (q.t <= (s.rowT || s.rowSince)) continue; s.rowT = q.t; if (c.src === 'mouse' && !q.down) continue; const v = q.py;
          if (s.rext == null) { s.rext = v; continue; }
          if (s.rdir >= 0 && v < s.rext - .06) { if (s.rdir > 0) newStrokes++; s.rdir = -1; s.rext = v; } else if (s.rdir <= 0 && v > s.rext + .06) { if (s.rdir < 0) newStrokes++; s.rdir = 1; s.rext = v; }
          else if ((s.rdir > 0 && v > s.rext) || (s.rdir < 0 && v < s.rext) || s.rdir === 0) s.rext = v; } }
      if (newStrokes) { s.strokes += newStrokes; s.v = Math.min(3, s.v + .9 * newStrokes); s.x = Math.min(.2, s.x + .18 * newStrokes); s.stroke = (s.stroke || 0) + Math.PI * newStrokes; A.sfx('splash-small', { gain: .5 }); }
      s.v = Math.max(0, s.v - dt * .55); s.prog += dt * (1.2 + s.v * 2.1);
      const abeam = Math.exp(-Math.pow((s.prog / d.course - .5) / .22, 2)), song = .08 + .5 * abeam; s.x -= dt * song * .45;
      A.drone(.05 + abeam * .22); A.loopGain('oars', Math.min(.5, s.v * .2));
      if (!s.sang && s.prog > d.course * .3) { s.sang = true; ctx.say('song'); s.odys.emotion = 'desperation'; }
      if (!s.struggled && s.prog > d.course * .5) { s.struggled = true; ctx.say('struggle'); }
      s.odys.arms = s.prog > d.course * .3 && s.prog < d.course * .8 ? [-.6 + Math.sin(E.time * 8) * .5, -.6 + Math.cos(E.time * 7) * .5] : [0, 0];
      const rocks = Math.max(0, Math.min(1, -s.x));
      H.meters([{ id: 'course', label: 'Past the isle', value: s.prog / d.course, color: '#7fe07a', text: Math.round(s.prog / d.course * 100) + '%' }, { id: 'rocks', label: 'The rocks', value: rocks, color: '#d2452f', text: rocks > .6 ? 'ROW!' : '', warn: rocks > .6 }]);
      if (s.x <= -1) { A.sfx('rock'); A.sfx('splash'); E.shake(1.6); A.stopDrone(); ctx.lose('The song drew her in: the ship broke on the rocks below the meadow of bones.', { title: 'The Sirens sing on' }); }
      else if (s.prog >= d.course) { A.stopDrone(); A.sfx('studs-final'); ctx.win({ accuracy: Math.max(0, Math.min(1, 1 + s.minX)), accLabel: 'clear of the rocks', title: 'The song fades', text: 'Bound to the mast he heard it all; the crew heard nothing, and rowed.' }); }
      s.minX = Math.min(s.minX ?? 0, s.x);
    }
  },
  onKey(ctx, code) { const s = ctx.s; if (ctx.stage === 'bind' && (code === 'KeyC' || code === 'Space')) s.keyTurns = (s.keyTurns || 0) + .25;
    if (ctx.stage === 'row' && (code === 'ArrowUp' || code === 'ArrowDown')) { if (code !== s.lastKey) s.keyStrokes = (s.keyStrokes || 0) + 1; s.lastKey = code; } },
  debug(ctx) { const s = ctx.s; return { stage: ctx.stage, turns: s.turns, x: s.x, prog: s.prog / ctx.data.course, strokes: s.strokes, mast: ctx.E.toScreen(new THREE.Vector3(0, 70, -10)) }; },
});
