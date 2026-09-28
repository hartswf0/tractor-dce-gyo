/* Level 8 · The Bed — LIFT · POINT · EMBRACE. Penelope's test: "carry the great bed out of the bridal chamber".
   LIFT    pinch the bed and lift. It does not move: in Hand Butter its parts are pinned, a set that stands; here the olive
           is rooted. The bed strains, creaks, holds. Try, and try again.
   POINT   the floor opens: the olive's trunk runs down through the chamber into the earth. Point at the root and hold.
   EMBRACE two open hands brought together (a pointer dragging Penelope to him; Space held): they run to each other. */
OG.level({
  id: '08-bed', icon: 'lift',
  async setup(ctx) {
    const E = ctx.E, s = ctx.s; E.rid = 0; const rows = [];
    for (let x = -240; x <= 240; x += 120) for (let z = -240; z <= 240; z += 80) rows.push(E.row('3032', (x / 120 + z / 80) & 1 ? 19 : 28, x, 0, z, 0));
    const bed = await E.card('prop.olive-tree-marriage-bed'); s.bedRows = E.place(bed, { dz: -150, dy: 8, prefix: 'bed' }); rows.push(...s.bedRows);
    for (let k = 0; k < 6; k++) rows.push(E.row('3001', 19, -300, k * 24, -300 + 0, 1), E.row('3001', 19, 300, k * 24, -300, 1));
    await E.stage(rows);
    s.bedBase = s.bedRows.map(r => ({ id: r.id, x: r.x, y: r.y, z: r.z }));
    const bb = new THREE.Box3(); for (const r of s.bedRows) { const p = E.part(r.id); if (p) bb.union(bounds(p)); } s.bedBox = bb; s.bedC = bb.getCenter(new THREE.Vector3());
    E.setView({ bg: 0x140f0b, floor: null, fog: [0x140f0b, 600, 1600] }); E.hemi.intensity = .25; E.glow.position.set(-160, 120, -120); E.glow.intensity = 1.8; E.glow.distance = 900;
    await E.ensureParts(['64647', '2417', '2423']);
    // the chamber walls, the lamp
    const walls = new THREE.Group(); for (let x = -300; x <= 300; x += 80) for (let k = 0; k < 7; k++) walls.add(E.brick('3001', k % 2 ? 19 : 28, x, k * 24, -330, 0)); for (let z = -300; z <= 200; z += 80) for (let k = 0; k < 7; k++) walls.add(E.brick('3001', k % 2 ? 28 : 19, -340, k * 24, z, 1)); E.add(walls);
    const lamp = E.brick('64647', 25, -160, 60, -120, 0); lamp.scale.setScalar(1.6); E.add(lamp); E.add(E.brick('3941', 72, -160, 0, -120, 0)); E.add(E.brick('3941', 72, -160, 24, -120, 0));
    // the olive: its trunk up through the bed, its crown above; and below the floor, the root (hidden until the floor opens)
    const tx = s.bedC.x, tz = s.bedBox.min.z + 12; s.trunk = new THREE.Group(); for (let k = 0; k < 9; k++) s.trunk.add(E.brick('3941', 6, tx, 8 + k * 24, tz, 0)); for (let i = 0; i < 5; i++) s.trunk.add(E.brick(i % 2 ? '2417' : '2423', 2, tx + (i - 2) * 40, 210 + (i % 2) * 20, tz + (i % 3 - 1) * 30, i)); E.add(s.trunk);
    s.root = new THREE.Group(); for (let k = 1; k <= 7; k++) s.root.add(E.brick('3941', 6, tx, -k * 24, tz, 0)); for (const [dx, dz, r] of [[-50, 0, 0], [50, 10, 0], [0, -50, 1], [10, 50, 1]]) for (let k = 0; k < 3; k++) s.root.add(E.brick('3009', 6, tx + dx * (1 + k * .6), -100 - k * 26, tz + dz * (1 + k * .6), r)); s.root.visible = false; E.add(s.root);
    s.floorMask = E.plane(700, 700, 0x2a1f16, { y: -1.2 }); E.add(s.floorMask); s.rootAt = new THREE.Vector3(tx, -90, tz);
    s.pen = await E.actor({ name: 'Penelope', face: 'penelope', def: { legs: 15, hips: 15, torso: 22, arms: 22, hands: 14, head: 14, hat: null }, at: [-190, 0, 60], heading: Math.PI * .7, emotion: 'guarded' });
    s.odys = await E.actor({ name: 'Odysseus', face: 'odysseus', def: { legs: 70, hips: 70, torso: 19, arms: 19, hands: 14, head: 14, hat: ['3901', 70] }, at: [190, 0, 60], heading: -Math.PI * .7, emotion: 'resolve' });
    s.eury = await E.actor({ name: 'Eurycleia', face: 'eurycleia', def: { legs: 72, hips: 72, torso: 72, arms: 72, hands: 14, head: 14, hat: null }, at: [-250, 0, -60], heading: Math.PI / 2, emotion: 'concern' });
    s.tries = 0; s.strain = 0; ctx.setStage('lift');
  },
  intro(ctx) { ctx.say('intro', ctx.s.pen); },
  begin(ctx) { ctx.cue('lift', 'lift', 'LIFT THE BED'); ctx.In.pressPose = 'pinch'; },
  update(dt, ctx, phase) {
    const E = ctx.E, In = ctx.In, H = ctx.H, s = ctx.s, A = ctx.A, d = ctx.data;
    if (phase !== 'play') return;
    const c = In.primary(), bs = E.toScreen(s.bedC.clone().add(new THREE.Vector3(0, 30, 0)));
    if (ctx.stage === 'lift') {
      const near = Math.hypot((c.x - bs.x) * 1.4, c.y - bs.y) < .16;
      if (!s.gripping && c.down && near && (c.src !== 'key' || true)) { s.gripping = true; s.y0 = c.y; s.held = 0; A.sfx('stud', { gain: .5 }); }
      if (s.gripping && !c.down) { s.gripping = false; s.strain = 0; this.settle(ctx); }
      if (s.gripping) { const lift = c.src === 'key' ? (s.keyLift || 0) : (s.y0 - c.y) / .12; s.strain = Math.max(0, Math.min(1.2, lift));
        const j = Math.min(1, s.strain) * 2.2; for (const b of s.bedBase) E.movePart(b.id, b.x + (Math.random() - .5) * j, b.y + Math.random() * j * .5, b.z + (Math.random() - .5) * j);
        if (s.strain > .3 && Math.random() < dt * 3) A.sfx('creak', { gain: .5 });
        if (s.strain >= 1) { s.held += dt; if (s.held > .6) { s.tries++; s.gripping = false; s.strain = 0; this.settle(ctx); s.keyLift = 0; E.shake(.35); A.sfx('thud'); H.flash(s.tries >= d.tries ? 'It will not move' : 'It will not move. Again?', 'bad');
          if (s.tries >= d.tries) { ctx.setStage('root'); ctx.say('erupt', s.odys); s.odys.emotion = 'confrontation'; s.root.visible = true; s.floorMask.visible = false; this.openFloor(ctx, true); ctx.cue('root', 'point', 'POINT TO THE ROOT'); ctx.In.pressPose = 'point';
            E.setCamera([s.rootAt.x + 260, 120, s.rootAt.z + 330], [s.rootAt.x, -30, s.rootAt.z], { fov: 44, dur: 1.8 }); s.hold = 0; } } } else s.held = 0; }
      H.ring(bs.x, bs.y, 40, s.gripping ? '#7fe07a' : '#ffe28a', { width: 3, label: 'THE BED', progress: s.gripping ? Math.min(1, s.strain) : null });
      H.meters([{ id: 'tries', label: 'Tries', value: s.tries / d.tries, color: '#c98a3a', text: s.tries + ' / ' + d.tries }, { id: 'strain', label: 'Strain', value: Math.min(1, s.strain), color: '#d2452f' }]);
    } else if (ctx.stage === 'root') {
      const rs = E.toScreen(s.rootAt), near = Math.hypot((c.x - rs.x) * 1.6, c.y - rs.y) < .08;
      const ok = c.src === 'hand' ? (c.pose === 'point' && near) : c.src === 'mouse' ? (In.mouse.down && near) : (In.key.down && near);
      s.hold = ok ? s.hold + dt / (c.src === 'hand' ? 1.2 : .5) : Math.max(0, s.hold - dt);
      H.ring(rs.x, rs.y, 30, ok ? '#7fe07a' : '#ffe28a', { width: 3, label: 'THE ROOT', progress: s.hold });
      if (s.hold >= 1) { ctx.setStage('embrace'); A.sfx('studs-final'); H.flash('The olive is rooted', 'good'); ctx.say('proof'); s.pen.emotion = 'recognition'; this.openFloor(ctx, false); E.setCamera(ctx.data.camera.pos, ctx.data.camera.look, { fov: ctx.data.camera.fov, dur: 1.6 }); ctx.cue('embrace', 'embrace', 'EMBRACE'); ctx.In.pressPose = 'pinch'; s.hug = 0; }
    } else if (ctx.stage === 'embrace') {
      const P = In.R.pull(), ps = E.toScreen(s.pen.rig.pos.clone().add(new THREE.Vector3(0, 50, 0))), os = E.toScreen(s.odys.rig.pos.clone().add(new THREE.Vector3(0, 50, 0)));
      H.ring(ps.x, ps.y, 18, '#ffe28a', { width: 2, label: 'PENELOPE' }); H.ring(os.x, os.y, 18, '#ffe28a', { width: 2, label: 'ODYSSEUS' });
      let done = false;
      if (P.two) { const [a, b] = In.cursors(); const open = (a.pose === 'open' || a.src === 'touch') && (b.pose === 'open' || b.src === 'touch'); if (open) { s.maxD = Math.max(s.maxD || 0, P.d); if (s.maxD > .25 && P.d < .1) done = true; H.line(a, b, '#ffb3c8', 3, [4, 6]); } }
      else if (c.src === 'mouse') { if (In.mouse.down && In.mouse.pressAt && Math.hypot((In.mouse.pressAt.x - ps.x) * 1.6, In.mouse.pressAt.y - ps.y) < .08) { H.line(ps, c, '#ffb3c8', 3, [4, 6]); if (Math.hypot((c.x - os.x) * 1.6, c.y - os.y) < .07) done = true; } }
      else if (c.src === 'key') { s.hug = In.key.down ? s.hug + dt : 0; if (s.hug > 1.5) done = true; }
      if (done) { ctx.setStage('together'); const mx = (s.pen.rig.pos.x + s.odys.rig.pos.x) / 2, mz = (s.pen.rig.pos.z + s.odys.rig.pos.z) / 2 + 20; E.walkTo(s.pen, mx - 14, mz, 90); E.walkTo(s.odys, mx + 14, mz, 60); s.pen.emotion = 'joy'; s.odys.emotion = 'tenderness'; A.sfx('breath'); ctx.say('runs').then(() => ctx.stage === 'together' && ctx.say('fear', s.pen)); }
    } else if (ctx.stage === 'together') {
      if (!s.pen.target && !s.odys.target) { s.pen.heading = Math.PI / 2; s.odys.heading = -Math.PI / 2; s.pen.arms = [-1.3, -1.3]; s.odys.arms = [-1.3, -1.3]; }
      if (ctx.phaseT > 6) ctx.win({ accuracy: Math.max(.3, 1 - Math.max(0, s.tries - ctx.data.tries) * .2), accLabel: 'the test kept', title: 'The rooted bed', text: 'He built it round the living olive: no one could move it. The sign is given; she runs to him. Athena holds back the dawn.' });
    }
  },
  settle(ctx) { for (const b of ctx.s.bedBase) ctx.E.movePart(b.id, b.x, b.y, b.z); },
  openFloor(ctx, open) { for (const p of S.parts) if (p.part === '3032' && !/^bed/.test(p.id)) { p.mesh.material.transparent = open; p.mesh.material.opacity = open ? .25 : 1; p.mesh.material.depthWrite = !open; p.mesh.material.needsUpdate = true; } },
  onKey(ctx, code) { const s = ctx.s, E = ctx.E, In = ctx.In, go = p => { const q = E.toScreen(p); In.key.x = q.x; In.key.y = q.y; };
    if (code === 'Tab') { if (ctx.stage === 'lift') go(s.bedC.clone().add(new THREE.Vector3(0, 30, 0))); if (ctx.stage === 'root') go(s.rootAt); }
    if (ctx.stage === 'lift' && code === 'ArrowUp' && s.gripping) s.keyLift = Math.min(1.2, (s.keyLift || 0) + .35); },
  teardown(ctx) { try { this.openFloor(ctx, false); } catch (e) { } },
  debug(ctx) { const s = ctx.s, E = ctx.E, V = (x, y, z) => new THREE.Vector3(x, y, z); return { stage: ctx.stage, tries: s.tries, strain: s.strain, gripping: !!s.gripping, bed: E.toScreen(s.bedC.clone().add(V(0, 30, 0))), root: E.toScreen(s.rootAt), pen: E.toScreen(s.pen.rig.pos.clone().add(V(0, 50, 0))), odys: E.toScreen(s.odys.rig.pos.clone().add(V(0, 50, 0))), hold: s.hold }; },
});
