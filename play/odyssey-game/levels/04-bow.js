/* Level 4 · The Bow and the Axes — PULL · AIM · OPEN. The camera is the beggar's eye on the sill, down the spine of the hall.
   STRING  two pinching hands drawn apart string the bow (a pressed pointer dragged away; Space held).
   AIM     hold the pinch (the drawn string) and bring the sight into the rings of the twelve axe-heads, which stand on one line
           down the hall; the bow sways with the breath, so the sight passes through the line and out again.
   LOOSE   open the hand. At the moment of opening, a sight inside the line sends the arrow clean through all twelve; outside
           it, the arrow rings off the axe where it strays. Three arrows in the quiver. */
OG.level({
  id: '04-bow', icon: 'pull',
  async setup(ctx) {
    const E = ctx.E, s = ctx.s; E.rid = 0; const rows = [];
    // the hall floor down the spine and the tables either side (workshop parts); the doors at the far end
    for (let z = -360; z <= 300; z += 80) for (const x of [-180, -60, 60, 180]) rows.push(E.row('3032', (z / 80 + x / 120) & 1 ? 19 : 28, x, 0, z, 1));
    for (const x of [-230, 230]) for (let z = -260; z <= 200; z += 160) rows.push(E.row('3008', 70, x, 24, z, 1), E.row('3003', 70, x, 0, z - 60, 0), E.row('3003', 70, x, 0, z + 60, 0));
    for (let k = 0; k < 6; k++) for (const x of [-120, -40, 40, 120]) rows.push(E.row('3001', k > 3 ? 70 : 19, x, k * 24, -390, 0));
    await E.stage(rows);
    E.setView({ bg: 0x1c140e, floor: null, fog: [0x1c140e, 500, 1400] }); E.hemi.intensity = .3; E.glow.position.set(0, 160, -100); E.glow.intensity = 1.4; E.glow.distance = 900;
    E.add(E.plane(1200, 1200, 0x4a3a28, { y: -0.6 }));
    await E.ensureParts(['3835', '64647']);
    // the twelve: a post, an axe-head and the ring of its haft-hole, on one line
    s.rings = []; const ringGeo = new THREE.TorusGeometry(9, 2.2, 10, 28);
    for (let i = 0; i < 12; i++) { const z = 150 - i * 42, g = new THREE.Group(); g.add(E.brick('3062b', 70, 0, 0, 0, 0), E.brick('3062b', 70, 0, 24, 0, 0)); const head = E.brick('3835', 71, 0, 0, 0, 0); head.scale.setScalar(1.6); head.position.set(-4, 40, 0); head.rotation.set(0, Math.PI / 2, Math.PI / 2); g.add(head);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: 0xc8a040, metalness: .6, roughness: .35, emissive: 0x000000 })); ring.position.set(0, 62, 0); g.add(ring); g.position.set(0, 0, z); E.add(g); s.rings.push({ g, ring, z }); }
    for (const [x, z] of [[-300, -300], [300, -300], [-300, 100], [300, 100]]) { const f = E.brick('64647', 25, x, 70, z, 0); f.scale.setScalar(2); E.add(f); E.add(E.brick('3941', 72, x, 0, z, 0)); E.add(E.brick('3941', 72, x, 24, z, 0)); E.add(E.brick('3941', 72, x, 48, z, 0)); }
    // the suitors at their tables, Telemachus by the door-post
    s.suitors = []; for (let i = 0; i < 4; i++) s.suitors.push(await E.actor({ name: 'Suitor', printed: i % 2 ? '3626bp35' : '3626bp01', def: { legs: [1, 4, 2, 6][i], hips: 0, torso: [4, 1, 14, 2][i], arms: [4, 1, 14, 2][i], hands: 14, head: 14, hat: i % 2 ? null : ['3901', 6] }, at: [i < 2 ? -170 : 170, 0, -200 + (i % 2) * 160], heading: i < 2 ? Math.PI / 2 : -Math.PI / 2 }));
    s.tel = await E.actor({ name: 'Telemachus', face: 'telemachus', def: { legs: 70, hips: 70, torso: 4, arms: 4, hands: 14, head: 14, hat: ['3901', 70], weapon: ['spear', '4497', 71] }, at: [215, 0, 120], heading: -Math.PI / 2 });
    s.arrows = ctx.data.arrows; s.pull = 0; s.shots = 0; s.arrow = null;
    ctx.setStage('string');
  },
  intro(ctx) { ctx.say('intro'); },
  begin(ctx) { ctx.cue('string', 'pull', 'STRING THE BOW'); ctx.In.pressPose = 'pinch'; ctx.s.t0 = performance.now(); },
  center(ctx) { const a = ctx.E.toScreen(new THREE.Vector3(0, 62, ctx.s.rings[0].z)), b = ctx.E.toScreen(new THREE.Vector3(0, 62, ctx.s.rings[11].z)); return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, a, b }; },
  sway(ctx) { const t = ctx.E.time; return { x: Math.sin(t * .9) * .028 + Math.sin(t * 2.3) * .008, y: Math.sin(t * .7 + 1) * .02 + Math.sin(t * 1.9) * .006 }; },
  update(dt, ctx, phase) {
    const E = ctx.E, In = ctx.In, H = ctx.H, s = ctx.s, A = ctx.A;
    if (phase !== 'play') { this.drawBow(ctx, 0, null); return; }
    const c = In.primary();
    if (ctx.stage === 'string') {
      const P = In.R.pull(); let prog = 0;
      if (P.two) { if (P.both) { if (s.d0 == null) s.d0 = P.d; prog = (P.d - s.d0) / .22; } else s.d0 = null; }
      else if (c.src === 'mouse') prog = In.mouse.down ? P.d / .22 : 0;
      else if (c.src === 'key') { s.keyHold = In.key.down ? (s.keyHold || 0) + dt : 0; prog = s.keyHold / 1.6; }
      s.pull = Math.max(s.pull * .9, Math.max(0, Math.min(1, prog)));
      H.meters([{ id: 'string', label: 'The string', value: s.pull, color: '#e8c55a', text: Math.round(s.pull * 100) + '%' }]);
      if (P.two) { H.line(P.a, P.b, '#7fe07a', 3, [6, 6]); }
      this.drawBow(ctx, s.pull, null);
      if (s.pull >= 1) { ctx.setStage('aim'); A.sfx('bowstring'); H.flash('It sings', 'good'); ctx.say('sings').then(() => { A.sfx('thunder'); E.shake(.6); return ctx.say('zeus'); }); ctx.cue('aim', 'aim', 'AIM DOWN THE LINE'); s.drawn = false; }
    } else if (ctx.stage === 'aim') {
      const cen = this.center(ctx), sw = this.sway(ctx), sight = { x: c.x + sw.x, y: c.y + sw.y };
      const drawn = c.src === 'hand' ? c.pose === 'pinch' : c.src === 'mouse' ? In.mouse.down : In.key.down;
      const off = Math.hypot((sight.x - cen.x) * 1.6, sight.y - cen.y), aligned = off < ctx.data.tolerance;
      s.rings.forEach(r => r.ring.material.emissive.setHex(aligned && drawn ? 0x2a8a20 : 0x000000));
      H.ring(cen.x, cen.y, 10, 'rgba(255,226,138,.35)', { width: 1 });
      H.ring(sight.x, sight.y, 7, aligned ? '#7fe07a' : '#ff6b5a', { width: 3 }); H.line({ x: sight.x - .02, y: sight.y }, { x: sight.x + .02, y: sight.y }, aligned ? '#7fe07a' : '#ff6b5a', 2); H.line({ x: sight.x, y: sight.y - .03 }, { x: sight.x, y: sight.y + .03 }, aligned ? '#7fe07a' : '#ff6b5a', 2);
      if (!drawn && !s.drawn) H.text(.5, .8, c.src === 'hand' ? 'PINCH TO DRAW' : c.src === 'key' ? 'HOLD SPACE TO DRAW' : 'PRESS TO DRAW', '#ffe28a', 16);
      if (drawn && !s.drawn) { s.drawn = true; A.sfx('creak', { gain: .5 }); ctx.cue('loose', 'open', 'LOOSE'); }
      this.drawBow(ctx, drawn ? 1 : .4, s.drawn ? sight : null);
      H.meters([{ id: 'arrows', label: 'Arrows', value: s.arrows / ctx.data.arrows, color: '#c8a040', text: s.arrows + ' left' }, { id: 'line', label: 'The line', value: Math.max(0, 1 - off / (ctx.data.tolerance * 3)), color: aligned ? '#7fe07a' : '#ff6b5a', text: aligned ? 'ON THE LINE' : '' }]);
      s.aligned = aligned; s.sight = sight;
      if (s.drawn && !drawn) this.loose(ctx, aligned, off, sight);
    } else if (ctx.stage === 'flight') {
      const f = s.arrow; f.t += dt; const u = Math.min(1, f.t / 1.1), z = 420 - u * (420 - f.stopZ);
      f.mesh.position.set(f.x0 * (1 - u) + f.x1 * u, 62, z); f.mesh.visible = true;
      s.rings.forEach((r, i) => { if (!r.passed && z <= r.z && i < f.through) { r.passed = true; r.ring.material.emissive.setHex(0x55ff44); A.sfx('ticks', { gain: .35, rate: 1 + i * .05 }); } });
      if (u >= 1 && !f.done) { f.done = true;
        if (f.through >= 12) { A.sfx('thud'); E.shake(.5); H.flash('Through all twelve', 'good'); s.suitors.forEach(a => a.emotion = 'fear'); ctx.say('shot'); s.winAt = ctx.t + 2.6; }
        else { A.sfx('clang'); E.shake(.3); H.flash('Clang — the ' + ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'][f.through] + ' axe', 'bad'); s.arrows--; s.backAt = ctx.t + 1.4; } }
      if (s.winAt && ctx.t > s.winAt) { ctx.winSpeaker = null; ctx.win({ accuracy: 1 / s.shots, accLabel: 'first arrow', title: 'The bow sings', text: 'Clean through the twelve and out past the last. The suitors have not yet understood.' }); }
      if (s.backAt && ctx.t > s.backAt) { s.backAt = null; f.mesh.parent && f.mesh.parent.remove(f.mesh); s.arrow = null; s.rings.forEach(r => { r.passed = false; r.ring.material.emissive.setHex(0); });
        if (s.arrows <= 0) ctx.lose('Three arrows, three axes rung. The suitors laugh; the bow goes back to the storeroom.', { title: 'The quiver is empty' }); else { ctx.setStage('aim'); s.drawn = false; ctx.cue('aim', 'aim', 'AIM DOWN THE LINE'); } }
      this.drawBow(ctx, .3, null);
    }
  },
  loose(ctx, aligned, off, sight) {
    const s = ctx.s, E = ctx.E; s.shots++; ctx.A.sfx('bowstring'); ctx.A.sfx('whoosh', { gain: .7 });
    const through = aligned ? 12 : Math.max(0, Math.min(11, Math.floor(12 * ctx.data.tolerance / Math.max(1e-3, off)) - 1));
    const at = E.floorAt(sight.x, sight.y, 62), x1 = at ? E.clamp(at.x * .15, -30, 30) : 0;
    const mesh = new THREE.Group(); const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 70, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a3a })); shaft.rotation.x = Math.PI / 2; mesh.add(shaft); const head = new THREE.Mesh(new THREE.ConeGeometry(3, 9, 8), new THREE.MeshStandardMaterial({ color: 0xb08040, metalness: .6 })); head.rotation.x = -Math.PI / 2; head.position.z = -38; mesh.add(head); mesh.visible = false; E.add(mesh);
    s.arrow = { mesh, t: 0, x0: 0, x1: aligned ? 0 : x1, through, stopZ: through >= 12 ? -375 : s.rings[through].z + 12 };
    ctx.setStage('flight'); ctx.H.cue(null); s.drawn = false;
  },
  /* the bow, drawn in the eye's own space: the grip at the bottom of the frame, the string drawn back to the hand */
  drawBow(ctx, pull, sight) {
    const H = ctx.H, g = H.ctx, W = H.W, Hh = H.Hh, cx = W * .5, cy = Hh * .93, span = Hh * .46; g.save();
    g.lineCap = 'round'; g.strokeStyle = '#5a3a1a'; g.lineWidth = 11; g.beginPath(); g.moveTo(cx - span, cy + 10); g.quadraticCurveTo(cx, cy - span * .42 - pull * 16, cx + span, cy + 10); g.stroke();
    g.strokeStyle = '#c89a5a'; g.lineWidth = 4; g.stroke();
    const back = pull * Hh * .07; g.strokeStyle = 'rgba(240,235,220,.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - span, cy + 10); g.lineTo(cx, cy + 10 + back); g.lineTo(cx + span, cy + 10); g.stroke();
    if (sight) { g.strokeStyle = '#8a6a3a'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy + 10 + back); g.lineTo(sight.x * W, sight.y * Hh + 6); g.stroke(); }
    g.restore();
  },
  onKey(ctx, code) { if (code === 'Tab' && ctx.stage === 'aim') { const c = this.center(ctx), sw = this.sway(ctx); ctx.In.key.x = c.x - sw.x; ctx.In.key.y = c.y - sw.y; } },
  debug(ctx) { const s = ctx.s; const c = this.center(ctx), sw = this.sway(ctx); return { stage: ctx.stage, pull: s.pull, arrows: s.arrows, aligned: !!s.aligned, drawn: !!s.drawn, center: { x: c.x, y: c.y }, sway: sw, aimAt: { x: c.x - sw.x, y: c.y - sw.y }, shots: s.shots }; },
});
