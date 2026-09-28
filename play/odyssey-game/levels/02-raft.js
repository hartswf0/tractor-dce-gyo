/* Level 2 · Calypso's Isle — PINCH & PLACE. The raft is built the way Hand Butter builds anything: a timber is pinched from
   the pile, carried over the keel, and let go; Butter's stud magnet seats it and its exact stud test bonds it (the CLICK).
   Four logs (1 x 6 bricks) across the keel (a 4 x 6 plate), then the mast step (a 2 x 2 brick) across the middle two logs,
   each place shown as a green ghost of the part. Then the launch: an open palm swept toward the sea pushes her off.
   The carry is Butter's own transaction (begin → propose → finish): a part let go off its place stays where it falls, and
   the player picks it up again; a part let go over its ghost is drawn onto it (the shadow's pull) before the magnet seats it. */
OG.level({
  id: '02-raft', icon: 'pinch',
  async setup(ctx) {
    const E = ctx.E, d = ctx.data, s = ctx.s; E.rid = 0;
    const kx = d.keel.x, kz = d.keel.z, rows = [];
    rows.push({ id: 'keel', part: '3032', color: 70, x: kx, y: 0, z: kz, r: 0 });
    s.slots = [-30, -10, 10, 30].map((dz, i) => ({ id: 'log' + i, part: '3009', x: kx, y: 8, z: kz + dz, r: 0 }));
    s.slots.push({ id: 'step', part: '3003', x: kx, y: 32, z: kz, r: 0 });
    // the pile on the sand: logs side by side, the mast step beside them
    s.slots.forEach((sl, i) => rows.push(i < 4 ? { id: sl.id, part: '3009', color: [6, 70, 6, 70][i], x: -250, y: 0, z: -90 + i * 50, r: 0 } : { id: 'step', part: '3003', color: 6, x: -160, y: 0, z: 150, r: 0 }));
    // the slipway: tan tiles running down to the water
    for (let x = 140; x <= 240; x += 40) rows.push(E.row('3068b', 19, x, 0, kz - 20, 0), E.row('3068b', 19, x, 0, kz + 20, 0));
    // Calypso's cave mouth: grey arches of bricks behind her
    for (let k = 0; k < 4; k++) rows.push(E.row('3001', 72, -120 - 60, k * 24, -300, 0), E.row('3001', 72, -120 + 60, k * 24, -300, 0));
    rows.push(E.row('3008', 72, -120, 96, -300, 0), E.row('3008', 71, -120, 120, -300, 0));
    await E.stage(rows);
    // sand, sea, trees, the tool set of the forage (prop.shipbuilding-tool-set)
    E.setView({ bg: 0xa8d3ea, floor: null, fog: [0xa8d3ea, 1000, 2600] });
    E.add(E.sea({ color: '#2b77a8' })); E.add(E.plane(560, 820, 0xdcc794, { x: -120, y: -0.6 }));
    await E.ensureParts(['2435', '4524', '3835', '2542']);
    for (const [x, z] of [[-340, -330], [-280, -360], [-360, 280], [-60, 340], [-350, 60]]) E.add(E.brick('2435', 2, x, 0, z, 0));
    const tools = await E.card('prop.shipbuilding-tool-set'); await E.ensureParts(tools.map(p => p.part)); const tg = E.bricks(tools); tg.position.set(-60, 0, 150); E.add(tg);
    // the ghosts: where each part goes
    s.ghosts = s.slots.map(sl => { const m = E.brick(sl.part, 10, sl.x, sl.y, sl.z, sl.r, { shadow: false, mat: { transparent: true, opacity: .28, depthWrite: false } }); m.visible = false; E.add(m); return m; });
    s.calypso = await E.actor({ name: 'Calypso', printed: '3626bp40', def: { legs: 15, hips: 15, torso: 15, arms: 15, hands: 14, head: 14, hat: null }, at: [-120, 0, -250], heading: 0.3 });
    s.odys = await E.actor({ name: 'Odysseus', face: 'odysseus', def: { legs: 70, hips: 70, torso: 19, arms: 19, hands: 14, head: 14, hat: ['3901', 70] }, at: [150, 0, -120], heading: -0.6, emotion: 'resolve' });
    s.odys.arms = [-0.3, 0];
    s.filled = new Set(); s.next = 0; s.launch = 0; ctx.setStage('build');
  },
  intro(ctx) { ctx.say('intro', ctx.s.calypso); },
  begin(ctx) { ctx.cue(null, 'pinch'); ctx.In.pressPose = 'pinch';
    // the launch sweep is read as the landmarks arrive, not once a frame: a slow phone still sees the whole gesture
    ctx.s.unsub = ctx.In.on((type, hands, t) => { if (type !== 'hands' || ctx.stage !== 'launch') return; for (const h of hands) { const w = ctx.In.history(h.id).filter(q => t - q.t < 1800 && q.pose === 'open'); if (w.length > 2 && w[w.length - 1].px - Math.min(...w.map(q => q.px)) > 0.12) ctx.s.handPush = true; } }); },
  freeSlot(ctx, id) { const s = ctx.s, part = ctx.E.part(id); return s.slots.find(sl => !s.filled.has(sl.id) && sl.part === part.part && (sl.id === id || sl.part === '3009')); },
  update(dt, ctx, phase) {
    const E = ctx.E, In = ctx.In, H = ctx.H, s = ctx.s;
    // which places are filled: a part of the right kind standing on the place, seated (bonded) on what is under it
    s.filled.clear(); const used = new Set();
    for (const sl of s.slots) { const p = S.parts.find(q => !used.has(q.id) && q.part === sl.part && Math.abs(q.x - sl.x) < 4 && Math.abs(q.z - sl.z) < 4 && Math.abs(q.y - sl.y) < 3 && q.id !== E.carry.id); if (p && E.bondsOf(p.id).length) { s.filled.add(sl.id); used.add(p.id); } }
    const logsDone = s.slots.slice(0, 4).every(sl => s.filled.has(sl.id)), all = s.filled.size === s.slots.length;
    s.slots.forEach((sl, i) => { const g = s.ghosts[i], avail = i < 4 || logsDone; g.visible = avail && !s.filled.has(sl.id) && ctx.stage === 'build'; g.material.opacity = .22 + .12 * Math.sin(E.time * 4); });
    if (phase !== 'play') return;
    const c = In.primary();
    if (ctx.stage === 'build') {
      // the carry
      if (E.carry.id) {
        const held = E.part(E.carry.id), at = E.floorAt(c.x, c.y, 20);
        let x = at ? at.x : held.x, z = at ? at.z : held.z; const sl = s.slots.find(q => !s.filled.has(q.id) && q.part === held.part && (q.part !== '3003' || logsDone) && Math.hypot(q.x - x, q.z - z) < 50);
        if (sl) { x = sl.x; z = sl.z; const q = E.toScreen(new THREE.Vector3(sl.x, sl.y + 12, sl.z)); H.ring(q.x, q.y, 18, '#7fe07a', { width: 3 }); }
        E.carryAt(x, z);
        const release = c.src === 'hand' ? !c.down : c.src === 'mouse' ? !In.mouse.down : c.src === 'touch' ? false : false;
        if (release) this.drop(ctx);
      } else { const pr = In.takePress(); if (pr && pr.src !== 'key') this.tryGrab(ctx, pr); }
      s.wasDown = c.down;
      // labels: the next place, the pile
      for (const p of S.parts) if (/^log|^step/.test(p.id) && !s.filled.has(p.id) && p.id !== E.carry.id) { const q = E.toScreen(E.partCenter(p.id)); const near = Math.hypot((c.x - q.x) * 1.6, c.y - q.y) < .07; if (near || p.id === this.nextPiece(ctx)) H.ring(q.x, q.y, near ? 16 : 11, near ? '#ffe28a' : 'rgba(255,226,138,.7)', { width: 2, label: near ? (p.part === '3003' ? 'MAST STEP' : 'TIMBER') : null }); }
      H.meters([{ id: 'raft', label: 'The raft', value: s.filled.size / s.slots.length, color: '#c98a3a', text: s.filled.size + ' / ' + s.slots.length + ' seated' }]);
      if (all && !E.carry.id) { ctx.setStage('launch'); ctx.A.sfx('studs-final'); H.flash('The raft holds', 'good'); ctx.say('built'); ctx.cue(null, 'open', 'LAUNCH'); H.cue('open', 'LAUNCH', In.source === 'hand' ? 'Sweep your open palm toward the sea (right) to push her off.' : In.source === 'key' ? 'Press Right (or Space) to push her off.' : 'Drag from the raft toward the sea.'); s.launchFrom = null;
        for (const sl of s.slots) { const p = S.parts.find(q => q.part === sl.part && Math.abs(q.x - sl.x) < 4 && Math.abs(q.z - sl.z) < 4 && Math.abs(q.y - sl.y) < 3); if (p) sl.pid = p.id; } }
    } else if (ctx.stage === 'launch') {
      const ids = ['keel', ...s.slots.map(sl => sl.pid).filter(Boolean)];
      if (!s.launching) {
        let push = false; const h = In.history(c.id), now = performance.now();
        if (c.src === 'hand') { const w = h.filter(q => now - q.t < 1800 && q.pose === 'open'); if (w.length > 2 && w[w.length - 1].px - Math.min(...w.map(q => q.px)) > 0.12) push = true; }
        else if (c.src === 'mouse') { if (In.mouse.down && In.mouse.pressAt && c.x - In.mouse.pressAt.x > .12) push = true; }
        if (s.keyPush || s.handPush) push = true;
        const q = E.toScreen(new THREE.Vector3(ctx.data.keel.x + 150, 20, ctx.data.keel.z)); H.ring(q.x, q.y, 20, '#9fd4ff', { width: 3, label: 'THE SEA ⟶' });
        if (push) { s.launching = true; ids.forEach(id => E.pin(id, true)); ctx.A.sfx('whoosh'); ctx.A.sfx('splash', { gain: .7 }); s.base = ids.map(id => { const p = E.part(id); return { id, x: p.x, y: p.y, z: p.z }; }); s.lt = 0; H.cue(null); }
      } else {
        s.lt += dt; const u = E.smooth(s.lt / 3.2);
        for (const b of s.base) E.movePart(b.id, b.x + 300 * u, b.y + Math.sin(E.time * 2 + b.x) * 1.5 * u, b.z);
        if (!s.sail && s.lt > 1.6) { s.sail = E.add(E.brick('3032', 15, 0, 0, 0, 0)); s.sail.rotation.x = Math.PI / 2; s.sailPole = E.add(E.brick('3062b', 70, 0, 0, 0, 0)); s.sailPole.scale.set(1, 6, 1); ctx.A.loop('wind', { gain: .35 }); }
        if (s.sail) { const k = E.part('keel'); s.sailPole.position.set(k.x, 56, k.z); s.sail.position.set(k.x, 130, k.z + 5); s.sail.scale.setScalar(E.smooth((s.lt - 1.6) / 1.2)); }
        if (s.lt > 4.2) ctx.win({ accuracy: E.carry.clicks / Math.max(1, E.carry.clicks + E.carry.misses), accLabel: 'first-time clicks', title: 'She floats', text: 'Five parts, every one seated on its studs. Calypso sends a warm wind behind the raft.' });
      }
    }
  },
  nextPiece(ctx) { const s = ctx.s, logsDone = s.slots.slice(0, 4).every(sl => s.filled.has(sl.id)); const p = S.parts.find(p => /^log/.test(p.id) && !s.filled.has(p.id) && !(Math.abs(p.x - ctx.data.keel.x) < 70 && Math.abs(p.z - ctx.data.keel.z) < 50 && p.y > 4)); if (p) return p.id; return logsDone || !S.parts.some(q => /^log/.test(q.id) && !s.filled.has(q.id)) ? (s.filled.has('step') ? null : 'step') : S.parts.find(q => /^log/.test(q.id) && !s.filled.has(q.id))?.id; },
  tryGrab(ctx, c) {
    const E = ctx.E, s = ctx.s; let best = null, bd = 0.075;
    for (const p of S.parts) { if (!/^log|^step/.test(p.id)) continue; if (s.slots.some(sl => s.filled.has(sl.id) && sl.part === p.part && Math.abs(p.x - sl.x) < 4 && Math.abs(p.z - sl.z) < 4 && Math.abs(p.y - sl.y) < 3)) continue;
      const q = E.toScreen(E.partCenter(p.id)), d = Math.hypot((c.x - q.x) * 1.6, c.y - q.y); if (d < bd) { bd = d; best = p.id; } }
    if (best && E.grab(best, c.x, c.y)) { ctx.A.sfx('stud', { gain: .6 }); ctx.s.grabbed = best; }
  },
  drop(ctx) { const fail = S.tx ? validate() : null, mag = S.tx && S.tx.magnet ? S.tx.magnet.key : null; const r = ctx.E.drop(); if (!r) return; ctx.s.lastDrop = { ...r, fail, mag, links: [...PH.links.keys()] }; if (r.bonds.length) ctx.H.flash('CLICK', 'good'); else ctx.A.sfx('thud', { gain: .5 }); },
  onKey(ctx, code) {
    const E = ctx.E, s = ctx.s, In = ctx.In;
    if (code === 'Tab') { let p = null; if (E.carry.id) { const held = E.part(E.carry.id), logsDone = s.slots.slice(0, 4).every(sl => s.filled.has(sl.id)); const sl = s.slots.find(q => !s.filled.has(q.id) && q.part === held.part && (q.part !== '3003' || logsDone)); if (sl) p = new THREE.Vector3(sl.x, sl.y + 10, sl.z); } else { const id = this.nextPiece(ctx); if (id) p = E.partCenter(id); }
      if (p) { const q = E.toScreen(p); In.key.x = q.x; In.key.y = q.y; } }
    if (code === 'Space' && ctx.stage === 'build') { if (E.carry.id) this.drop(ctx); else this.tryGrab(ctx, { x: In.key.x, y: In.key.y }); }
    if ((code === 'ArrowRight' || code === 'Space') && ctx.stage === 'launch') s.keyPush = true;
  },
  teardown(ctx) { if (ctx.E.carry.id) ctx.E.cancelCarry(); if (ctx.s.unsub) ctx.s.unsub(); },
  debug(ctx) { const E = ctx.E, s = ctx.s; return { stage: ctx.stage, launching: !!s.launching, filled: [...s.filled], carrying: E.carry.id, next: this.nextPiece(ctx),
    pieces: S.parts.filter(p => /^log|^step/.test(p.id)).map(p => ({ id: p.id, ...E.toScreen(E.partCenter(p.id)) })), slots: s.slots.map(sl => ({ id: sl.id, part: sl.part, ...E.toScreen(new THREE.Vector3(sl.x, sl.y + 12, sl.z)) })), keel: E.toScreen(new THREE.Vector3(ctx.data.keel.x, 10, ctx.data.keel.z)), clicks: E.carry.clicks, misses: E.carry.misses, lastDrop: s.lastDrop || null }; },
});
