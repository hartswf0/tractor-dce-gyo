/* Level 3 · The Cave of the Cyclops — HOLD · THRUST · TUCK. Three hand verbs on the objects of Book IX.
   FIRE  pinch the olive stake and hold its point in the fire (the forage's fire-and-dry-logs card) until it glows.
   EYE   the giant (a minifig at three times scale, the halfworld's Polyphemus face on its head) sleeps on his side, drunk on the
         wine; aim the glowing point at the eye and push the hand toward the screen: the thrust (Hand Butter's hand grows in
         the image). A miss makes him stir; three and he wakes.
   RAMS  blind at the door, he sweeps the floor with his hand; pinch each man and tuck him under a ram before the hand finds
         him (the lane it will sweep darkens first). Every man hidden, the flock walks out. */
OG.level({
  id: '03-cyclops', icon: 'thrust',
  async setup(ctx) {
    const E = ctx.E, d = ctx.data, s = ctx.s; E.rid = 0; const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const rows = [];
    // the cave floor's stones, the great door-stone at the back right, the cheese racks on the left
    for (let x = -340; x <= 340; x += 120) for (let z = -340; z <= 340; z += 170) if (Math.abs(x) > 200 || Math.abs(z) > 250) rows.push(E.row('3032', [72, 71, 0][(x + z + 1000) % 3], x, 0, z, (x / 120 + z) & 1));
    for (let k = 0; k < 5; k++) rows.push(E.row('3001', 72, 300, k * 24, -250, 1), E.row('3001', 71, 300, k * 24, -170, 1));
    for (let k = 0; k < 3; k++) rows.push(E.row('3008', 19, -300, 24 + k * 40, -40, 1), E.row('3010', 19, -300, k * 40, -110, 1), E.row('3010', 19, -300, k * 40, 30, 1));
    await E.stage(rows);
    E.setView({ bg: 0x0a0c10, floor: null, fog: [0x0a0c10, 700, 1700] }); E.hemi.intensity = .16;
    E.add(E.plane(900, 900, 0x3b352d, { y: -0.6 }));
    // cave walls: a ring of dark bricks
    const walls = new THREE.Group(); for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2, r = 470; if (Math.cos(t) > .82 && Math.sin(t) < 0) continue; if (Math.sin(t) > .55) continue; for (let k = 0; k < 5; k++) walls.add(E.brick('3001', k % 2 ? 72 : 0, Math.cos(t) * r, k * 24, Math.sin(t) * r, 0)); } E.add(walls);
    // the fire (the forage card environment.fire-and-dry-logs) and its light
    const fire = await E.card('environment.fire-and-dry-logs'); await E.ensureParts(fire.map(p => p.part)); const fg = E.bricks(fire), fb = new THREE.Box3().setFromObject(fg), fc = fb.getCenter(V(0, 0, 0));
    fg.position.set(-60 - fc.x, 0, 20 - fc.z); E.add(fg); s.fire = V(-60, 20, 20);
    E.glow.position.set(-60, 80, 20); E.glow.intensity = 2.4; E.glow.distance = 800;
    await E.ensureParts(['4589', '95341']);
    // the stake: a 1 x 8 of olive wood with a cone for its point
    s.stake = new THREE.Group(); const shaft = E.brick('3008', 6, 0, 0, 0, 0); shaft.position.set(-80, -12, 0); s.stake.add(shaft);
    s.tipMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, emissive: 0x000000, roughness: .5 }); const tip = new THREE.Mesh(catalog.get('4589').geometry, s.tipMat); tip.rotation.z = -Math.PI / 2; tip.position.set(0, 0, 0); s.stake.add(tip);
    s.stake.position.set(140, 12, 150); s.stake.rotation.y = -0.5; E.add(s.stake); s.glow = 0;
    // the giant, asleep on his side, facing us
    s.giant = await E.actor({ name: 'Polyphemus', face: 'polyphemus', def: { legs: 28, hips: 28, torso: 6, arms: 6, hands: 14, head: 14, hat: ['3901', 0] }, at: [170, 38, -150], scale: 3.0, emotion: 'weariness' });
    s.giant.rig.figure.rotation.z = Math.PI / 2; s.giant.heading = 0;
    // the men (Odysseus with the halfworld face) and the rams
    const heads = [null, '3626bp35', '3626bp01', '3626bp35'];
    s.men = [];
    for (let i = 0; i < 4; i++) { const a = await E.actor({ name: i ? 'Companion' : 'Odysseus', face: i ? null : 'odysseus', printed: heads[i], def: { legs: [70, 28, 19, 72][i], hips: [70, 28, 19, 72][i], torso: [19, 4, 2, 6][i], arms: [19, 4, 2, 6][i], hands: 14, head: 14, hat: i === 2 ? ['3901', 6] : i ? null : ['3901', 70] }, at: [-150 + i * 60, 0, 130 + (i % 2) * 40], heading: Math.PI + .3 }); a.home = a.rig.pos.clone(); a.state = 'free'; s.men.push(a); }
    s.rams = []; for (let i = 0; i < 4; i++) { const g = new THREE.Group(), m = E.brick('95341', 15, 0, 0, 0, 1); m.scale.setScalar(1.35); g.add(m); g.position.set(220 + (i % 2) * 70, 0, -20 + i * 55); E.add(g); s.rams.push({ g, man: null }); }
    // the giant's hand for the sweep: a palm and four fingers of skin bricks
    s.hand = new THREE.Group(); s.hand.add(E.brick('3001', 14, 0, 0, 0, 0), E.brick('3001', 14, 0, 0, 40, 0)); for (let f = 0; f < 4; f++) s.hand.add(E.brick('3010', 14, 70, 4, -30 + f * 20, 0)); s.hand.add(E.brick('3004', 14, -10, 4, 80, 1)); s.hand.scale.setScalar(1.6); s.hand.visible = false; E.add(s.hand);
    s.lane = E.plane(760, 90, 0x7a0f08, { y: 0.8, opacity: 0 }); E.add(s.lane);
    s.misses = 0; s.thrusts = 0; s.caught = 0; s.carry = null;
    ctx.A.loop('fire', { gain: .5 }); ctx.setStage('fire');
  },
  intro(ctx) { ctx.say('intro'); },
  begin(ctx) { ctx.cue('fire', 'pinch', 'HOLD IN THE FIRE'); ctx.In.pressPose = 'pinch'; },
  eye(ctx) { const g = ctx.s.giant, h = g.rig.slots.head, p = new THREE.Vector3(); h.getWorldPosition(p); return p.add(new THREE.Vector3(0, 0, 42)); },
  tipWorld(ctx) { const p = new THREE.Vector3(); ctx.s.stake.children[1].getWorldPosition(p); return p; },
  update(dt, ctx, phase) {
    const E = ctx.E, In = ctx.In, H = ctx.H, s = ctx.s, A = ctx.A, V = (x, y, z) => new THREE.Vector3(x, y, z);
    E.glow.intensity = 2.2 + Math.sin(E.time * 13) * .3 + Math.sin(E.time * 7.3) * .2;
    s.tipMat.emissive.setRGB(s.glow * 1.0, s.glow * .45, s.glow * .08); s.tipMat.color.setRGB(.42 + s.glow * .5, .29 + s.glow * .2, .17);
    if (phase !== 'play') return;
    const c = In.primary(), now = performance.now();
    if (ctx.stage === 'fire') {
      const sp = E.toScreen(this.tipWorld(ctx)); const near = Math.hypot((c.x - sp.x) * 1.6, c.y - sp.y) < .08;
      if (!s.carry && ((c.src !== 'key' && c.down && !s.wasDown && near) || s.keyGrab)) { s.carry = 'stake'; s.keyGrab = false; A.sfx('stud', { gain: .6 }); }
      if (s.carry === 'stake' && c.src !== 'key' && !c.down) s.carry = null;
      if (s.carry === 'stake') { const at = E.floorAt(c.x, c.y, 14); if (at) { s.stake.position.set(at.x, 14, at.z); s.stake.rotation.y = Math.atan2(-(at.z - 400), at.x - (-400)) * 0 - 0.4; } }
      const tip = this.tipWorld(ctx), inFire = Math.hypot(tip.x - s.fire.x, tip.z - s.fire.z) < 55;
      if (inFire && s.carry) { if (!s.inFire) A.sfx('hiss', { gain: .7 }); s.glow = Math.min(1, s.glow + dt / ctx.data.glowSeconds); } else s.glow = Math.max(0, s.glow - dt * .05);
      s.inFire = inFire && !!s.carry;
      const fs = E.toScreen(s.fire); H.ring(fs.x, fs.y, 30, s.inFire ? '#ffb347' : 'rgba(255,179,71,.7)', { width: 3, label: 'THE FIRE', progress: s.glow });
      if (!s.carry) H.ring(sp.x, sp.y, near ? 16 : 12, '#ffe28a', { width: 2, label: 'THE STAKE' });
      H.meters([{ id: 'glow', label: 'The point', value: s.glow, color: '#ff8a2a', text: s.glow >= 1 ? 'glowing' : Math.round(s.glow * 100) + '%' }]);
      if (s.glow >= 1) { ctx.setStage('eye'); s.carry = 'stake'; H.flash('The point glows', 'good'); A.sfx('hiss'); ctx.cue('eye', 'thrust', 'THRUST'); ctx.say('nobody', s.men[0]).then(() => { if (ctx.stage === 'eye') ctx.say('drink', s.giant); });
        const e = this.eye(ctx); E.setCamera([e.x + 90, e.y + 110, e.z + 330], [e.x, e.y - 10, e.z], { fov: 40, dur: 1.6 }); s.since = now; s.cool = 0; A.loop('snore', { gain: .4 }); }
      s.wasDown = c.down;
    } else if (ctx.stage === 'eye') {
      const e = this.eye(ctx), es = E.toScreen(e); s.cool = Math.max(0, s.cool - dt);
      const at = E.floorAt(c.x, c.y, e.y); if (at) { s.stake.position.set(at.x + 10, e.y, at.z + 60); s.stake.rotation.set(0, Math.PI / 2 + .25, 0); }
      const aim = Math.hypot((c.x - es.x) * 1.6, c.y - es.y); const onEye = aim < .06;
      H.ring(es.x, es.y, 24, onEye ? '#7fe07a' : '#ff6b5a', { width: 3, label: 'THE EYE' });
      H.meters([{ id: 'stir', label: 'He stirs', value: s.misses / ctx.data.misses, color: '#d2452f', text: s.misses + ' / ' + ctx.data.misses, warn: s.misses === ctx.data.misses - 1 }]);
      const thrust = s.keyThrust || (s.cool <= 0 && In.R.thrust(c.id, { since: s.since }));
      if (thrust) { s.keyThrust = false; s.thrusts++; s.since = performance.now(); s.cool = .9;
        if (onEye) { ctx.setStage('blinded'); A.hush(); A.stopLoops(); A.loop('fire', { gain: .4 }); A.sfx('hiss'); A.sfx('roar'); E.shake(1.4); H.flash('NOBODY!', 'good'); s.giant.emotion = 'anguish'; ctx.say('blind').then(() => ctx.stage === 'blinded' && ctx.say('roar')); s.hitAt = ctx.t; }
        else { s.misses++; A.sfx('thud'); E.shake(.4); H.flash('He stirs…', 'bad'); if (s.misses >= ctx.data.misses) { A.sfx('roar'); ctx.lose('The giant woke before the stake found his eye. Six more men for his supper.', { title: 'Polyphemus wakes', accuracy: 0 }); } }
      }
    } else if (ctx.stage === 'blinded') {
      if (ctx.phaseT > 3.2) { // he stands at the door, blind; the flock gathers there
        const g = s.giant; g.rig.figure.rotation.z = 0; g.rig.pos.set(330, 0, -80); g.heading = -Math.PI / 2; g.rig.heading = -Math.PI / 2; g.arms = [-1.2, -1.2];
        s.stake.visible = false; ctx.setStage('rams'); s.nextSweep = 2.5; s.sweep = null; ctx.cue('rams', 'pinch', 'TUCK UNDER THE RAMS');
        E.setCamera([20, 600, 380], [40, 0, 0], { fov: 44, dur: 1.4 }); ctx.say('outside').then(() => ctx.stage === 'rams' && ctx.say('rams')); }
    } else if (ctx.stage === 'rams') {
      // carrying men
      const pickable = s.men.filter(m => m.state === 'free');
      if (!s.carry && ((c.src !== 'key' && c.down && !s.wasDown) || s.keyGrab)) { s.keyGrab = false; let best = null, bd = .08; for (const m of pickable) { const q = E.toScreen(m.rig.pos.clone().add(new THREE.Vector3(0, 40, 0))); const dd = Math.hypot((c.x - q.x) * 1.6, c.y - q.y); if (dd < bd) { bd = dd; best = m; } } if (best) { s.carry = best; best.state = 'carried'; A.sfx('stud', { gain: .5 }); } }
      if (s.carry && s.carry !== 'stake') { const m = s.carry, at = E.floorAt(c.x, c.y, 0); if (at) { m.rig.pos.set(E.clamp(at.x, -380, 380), 24, E.clamp(at.z, -380, 380)); }
        const ram = s.rams.filter(r => !r.man).sort((a, b) => a.g.position.distanceTo(m.rig.pos) - b.g.position.distanceTo(m.rig.pos))[0];
        if (ram) { const q = E.toScreen(ram.g.position.clone().add(new THREE.Vector3(0, 30, 0))); if (ram.g.position.distanceTo(new THREE.Vector3(m.rig.pos.x, 0, m.rig.pos.z)) < 70) H.ring(q.x, q.y, 20, '#7fe07a', { width: 3, label: 'UNDER THE RAM' }); }
        const release = c.src === 'key' ? s.keyDrop : !c.down; if (release) { s.keyDrop = false; this.dropMan(ctx, m, ram); } }
      s.wasDown = c.down;
      // the sweep: a lane darkens, then the hand crosses it
      s.nextSweep -= dt;
      if (!s.sweep && s.nextSweep <= 0) { const free = s.men.filter(m => m.state === 'free' || m.state === 'carried'); const target = free.length ? free[Math.floor((ctx.t * 7) % free.length)] : null; const z = target ? E.clamp(target.rig.pos.z, -300, 300) : 0; s.sweep = { z, t: 0 }; s.lane.position.set(-80, .8, z); A.sfx('rumble-rise', { gain: .5 }); }
      if (s.sweep) { const w = s.sweep; w.t += dt; const warn = 1.8, cross = 1.5;
        s.lane.material.opacity = w.t < warn ? .15 + .35 * (w.t / warn) : .45 * Math.max(0, 1 - (w.t - warn) / cross);
        if (w.t > warn) { const u = (w.t - warn) / cross, x = -420 + u * 580; s.hand.visible = true; s.hand.position.set(x, 12, w.z - 40); if (!w.swooshed) { w.swooshed = true; A.sfx('whoosh'); }
          for (const m of s.men) if ((m.state === 'free') && Math.abs(m.rig.pos.z - w.z) < 55 && Math.abs(m.rig.pos.x - x) < 70) { m.state = 'caught'; s.caught++; A.sfx('yell'); H.flash('He has one!', 'bad'); m.visible = false; } }
        if (w.t > warn + cross) { s.sweep = null; s.hand.visible = false; s.nextSweep = ctx.data.sweepPeriod * (s.men.some(m => m.state === 'free') ? 1 : 3); } }
      const hidden = s.men.filter(m => m.state === 'hidden').length, lost = s.caught;
      H.meters([{ id: 'hidden', label: 'Under the rams', value: hidden / 4, color: '#e8e0c8', text: hidden + ' / 4' }, { id: 'lost', label: 'Taken', value: lost / (ctx.data.caughtMax + 1), color: '#d2452f', text: lost + '', warn: lost === ctx.data.caughtMax }]);
      for (const m of s.men) if (m.state === 'free') { const q = E.toScreen(m.rig.pos.clone().add(new THREE.Vector3(0, 40, 0))); H.ring(q.x, q.y, 12, '#ffe28a', { width: 2 }); }
      if (lost > ctx.data.caughtMax) ctx.lose('The blind hand found too many of the men.', { title: 'The flock goes out without you' });
      else if (!s.men.some(m => m.state === 'free' || m.state === 'carried')) { ctx.setStage('out'); A.sfx('studs-final'); H.flash('Out beneath the rams', 'good'); s.outT = 0; }
    } else if (ctx.stage === 'out') {
      s.outT += dt; for (const r of s.rams) { r.g.position.x += dt * 90; if (r.man) r.man.rig.pos.set(r.g.position.x, 4, r.g.position.z); }
      if (s.outT > 3) { const hidden = s.men.filter(m => m.state === 'hidden').length; ctx.win({ accuracy: .5 * (1 / Math.max(1, s.thrusts)) + .5 * hidden / 4, accLabel: 'men saved · clean thrust', title: 'Nobody escaped', text: hidden + ' men out beneath the rams. "Cyclops, if anyone asks who blinded you…"' }); }
    }
  },
  dropMan(ctx, m, ram) {
    const s = ctx.s, E = ctx.E; s.carry = null;
    if (ram && ram.g.position.distanceTo(new THREE.Vector3(m.rig.pos.x, 0, m.rig.pos.z)) < 70) { ram.man = m; m.state = 'hidden'; m.rig.pos.set(ram.g.position.x, 4, ram.g.position.z); m.rig.figure.rotation.z = Math.PI / 2; ctx.A.sfx('creak', { gain: .6 }); ctx.H.flash('Hidden', 'good'); }
    else { m.state = 'free'; m.rig.pos.y = 0; }
  },
  onKey(ctx, code) {
    const s = ctx.s, E = ctx.E, In = ctx.In, go = p => { const q = E.toScreen(p); In.key.x = q.x; In.key.y = q.y; };
    if (ctx.stage === 'fire') { if (code === 'Tab') go(s.carry ? s.fire : this.tipWorld(ctx)); if (code === 'Space') { if (s.carry) s.carry = null; else s.keyGrab = true; } }
    if (ctx.stage === 'eye') { if (code === 'Tab') go(this.eye(ctx)); if (code === 'Space') s.keyThrust = true; }
    if (ctx.stage === 'rams') { if (code === 'Tab') { if (s.carry) { const r = s.rams.find(r => !r.man); if (r) go(r.g.position.clone().add(new THREE.Vector3(0, 10, 0))); } else { const m = s.men.find(m => m.state === 'free'); if (m) go(m.rig.pos.clone().add(new THREE.Vector3(0, 40, 0))); } }
      if (code === 'Space') { if (s.carry) s.keyDrop = true; else s.keyGrab = true; } }
  },
  debug(ctx) { const s = ctx.s, E = ctx.E, V = (x, y, z) => new THREE.Vector3(x, y, z); return { stage: ctx.stage, glow: s.glow, misses: s.misses, caught: s.caught, carry: s.carry ? (s.carry === 'stake' ? 'stake' : s.carry.name) : null,
    stake: E.toScreen(this.tipWorld(ctx)), fire: E.toScreen(s.fire), eye: E.toScreen(this.eye(ctx)), sweep: s.sweep ? { z: s.sweep.z, t: s.sweep.t } : null,
    men: s.men.map(m => ({ state: m.state, ...E.toScreen(m.rig.pos.clone().add(V(0, 40, 0))) })), rams: s.rams.map(r => ({ taken: !!r.man, ...E.toScreen(r.g.position.clone().add(V(0, 10, 0))) })) }; },
});
