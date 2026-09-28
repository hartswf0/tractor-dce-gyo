/* Level 1 · The Opening (tutorial) — POINT. Athena drops from Olympus; the player's fingertip is the road she takes to
   Ithaca's gate, stone by stone of the path (five waymarks), where Telemachus, ashamed of his house, crosses to welcome her.
   Hand: the pose "point" (index out, the rest folded) moves her toward the floor under the fingertip; any other pose stops her.
   Mouse: hold the button. Keys: arrows (she follows the key cursor), Tab jumps the cursor to the next waymark. */
OG.level({
  id: '01-opening', icon: 'point',
  async setup(ctx) {
    const E = ctx.E, d = ctx.data, s = ctx.s; E.rid = 0; const rows = [];
    // Olympus: four courses of 2x4 bricks, grey below and snow on top
    const [ox, oz] = d.olympus.at, hs = [160, 120, 80, 40];
    hs.forEach((h, k) => { for (let x = ox - h + 40; x <= ox + h - 40; x += 80) for (let z = oz - h + 20; z <= oz + h - 20; z += 40) rows.push(E.row('3001', k >= 2 ? 15 : k === 1 ? 71 : 72, x, k * 24, z, 0)); });
    s.peak = hs.length * 24;
    // the road: tan tiles between the waymarks
    const P = d.path; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 44)); for (let j = i ? 0 : 3; j < n; j++) { const u = j / n; rows.push(E.row('3068b', 19, Math.round((ax + (bx - ax) * u) / 10) * 10, 0, Math.round((az + (bz - az) * u) / 10) * 10, 0)); } }
    // Ithaca's gate: two round columns, a lintel, the palace wall
    const [gx, gz] = d.gate;
    for (const side of [-1, 1]) { for (let k = 0; k < 4; k++) rows.push(E.row('3941', 15, gx + side * 70, k * 24, gz, 0)); rows.push(E.row('3010', 19, gx + side * 130, 0, gz, 0), E.row('3010', 19, gx + side * 130, 24, gz, 0), E.row('3010', 19, gx + side * 130, 48, gz, 0)); }
    rows.push(E.row('3008', 19, gx, 96, gz, 0), E.row('3009', 19, gx, 104, gz, 0), E.row('3032', 28, gx, 0, gz + 60, 0), E.row('3032', 28, gx, 0, gz + 120, 1));
    s.count = await E.stage(rows);
    // the island and the sea around it; clouds about the peak
    E.setView({ bg: 0xa9cfe6, floor: null, fog: [0xa9cfe6, 900, 2400] });
    E.add(E.sea({ color: '#2a6a95' })); E.add(E.plane(820, 820, 0x6d9446, { y: -0.6 }));
    await E.ensureParts(['2435', '4497']);
    for (const [x, z] of [[-360, 250], [-300, 330], [330, -300], [360, -220], [-120, 300], [120, -330]]) E.add(E.brick('2435', 2, x, 0, z, 0));
    s.clouds = [];
    for (let i = 0; i < 5; i++) { const g = new THREE.Group(); for (let j = 0; j < 3; j++) g.add(E.brick('3941', 15, j * 26 - 26, (j % 2) * 10, (j % 2) * 16, 0, { shadow: false })); g.position.set(ox - 120 + i * 60, 150 + (i % 2) * 30, oz - 60 + (i % 3) * 50); E.add(g); s.clouds.push(g); }
    // Athena, grey-eyed, in the helm with her spear; Telemachus inside the gate
    s.athena = await E.actor({ name: 'Athena', face: 'athena', def: { legs: 15, hips: 15, torso: 71, arms: 71, hands: 14, head: 14, hat: ['3896', 71], weapon: ['spear', '4497', 25] }, at: [ox, s.peak, oz], heading: 0.6 });
    s.athena.fly = s.peak; s.athena.speed = 130;
    s.tel = await E.actor({ name: 'Telemachus', face: 'telemachus', def: { legs: 70, hips: 70, torso: 4, arms: 4, hands: 14, head: 14, hat: ['3901', 70] }, at: [gx, 0, gz + 70], heading: Math.PI });
    s.next = 1; s.onT = 0; s.moveT = 0; s.path = P.map(([x, z]) => new THREE.Vector3(x, 0, z));
    ctx.setStage('guide');
  },
  intro(ctx) { ctx.say('intro'); },
  begin(ctx) { ctx.cue(null, 'point'); },
  heightAt(ctx, x, z) { const [ox, oz] = ctx.data.olympus.at, r = Math.max(Math.abs(x - ox), Math.abs(z - oz)); return ctx.s.peak * Math.max(0, Math.min(1, 1 - (r - 30) / 190)); },
  update(dt, ctx, phase) {
    const E = ctx.E, In = ctx.In, H = ctx.H, s = ctx.s, a = s.athena, P = s.path;
    s.clouds.forEach((g, i) => g.position.x += Math.sin(E.time * .3 + i) * dt * 6);
    const pos = a.rig.pos, here = new THREE.Vector3(pos.x, 0, pos.z);
    a.fly = Math.max(this.heightAt(ctx, pos.x, pos.z), 0) + (s.landed ? 0 : 4 + Math.sin(E.time * 2) * 2);
    // the waymarks, the next one lit
    P.forEach((p, i) => { if (i === 0) return; const q = E.toScreen(p); const done = i < s.next, nx = i === s.next; H.ring(q.x, q.y, nx ? 22 : 12, done ? '#7fe07a' : nx ? '#ffe28a' : 'rgba(255,255,255,.55)', { width: nx ? 4 : 2, label: nx ? (i === P.length - 1 ? 'ITHACA' : i + ' / ' + (P.length - 1)) : null, dash: done ? null : [5, 5] }); });
    if (phase !== 'play') return;
    if (ctx.stage === 'guide') {
      const c = In.primary(); const active = c.src === 'hand' ? c.pose === 'point' : c.src === 'mouse' ? c.down : (In.key.down || In.keyMoving());
      if (active) { const t = E.floorAt(c.x, c.y, 0); if (t) { t.x = E.clamp(t.x, -380, 380); t.z = E.clamp(t.z, -380, 380); E.walkTo(a, t.x, t.z); const ts = E.toScreen(t), as = E.toScreen(pos); H.line(as, ts, 'rgba(255,226,138,.8)', 2, [6, 6]); H.ring(ts.x, ts.y, 10, '#ffe28a', { width: 2 }); } }
      else a.target = null;
      if (a.target) { s.moveT += dt; if (distToPath(here, P) < 70) s.onT += dt; }
      const nx = P[s.next]; if (nx && here.distanceTo(nx) < 48) { s.next++; ctx.A.sfx('stud', { gain: .9 }); if (s.next === 3) ctx.say('mid'); if (s.next < P.length) H.flash(s.next - 1 + ' / ' + (P.length - 1), 'good'); }
      if (s.next >= P.length) { ctx.setStage('welcome'); a.target = null; s.landed = true; ctx.A.sfx('studs-final'); H.flash('Ithaca', 'good'); H.cue(null);
        const tp = s.tel.rig.pos; E.walkTo(s.tel, (tp.x + pos.x) / 2 + 20, (tp.z + pos.z) / 2 + 10, 60); s.tel.emotion = 'appeal'; a.emotion = 'resolve';
        E.setCamera([pos.x + 120, 190, pos.z + 260], [pos.x, 50, pos.z], { fov: 36, dur: 2.2 });
        ctx.say('arrive'); }
      H.meters([{ id: 'road', label: 'The road', value: (s.next - 1) / (P.length - 1), color: '#e8c55a', text: (s.next - 1) + ' / ' + (P.length - 1) }]);
    } else if (ctx.stage === 'welcome') {
      if (!s.tel.target) { const d = new THREE.Vector3().subVectors(a.rig.pos, s.tel.rig.pos); s.tel.rig.heading = Math.atan2(d.x, d.z); a.rig.heading = Math.atan2(-d.x, -d.z); }
      if (ctx.phaseT > 2.4) { ctx.winSpeaker = s.tel; ctx.win({ accuracy: s.moveT ? s.onT / s.moveT : 1, accLabel: 'on the road', title: 'The stranger at the threshold', text: 'Athena, in the shape of Mentes, stands at Ithaca\'s gate. Telemachus crosses his loud hall to welcome her.' }); }
    }
  },
  onKey(ctx, code) { if (code === 'Tab') { const p = ctx.s.path[ctx.s.next]; if (p) { const q = ctx.E.toScreen(p); ctx.In.key.x = q.x; ctx.In.key.y = q.y; } } },
  debug(ctx) { const s = ctx.s, E = ctx.E; return { athena: E.toScreen(s.athena.rig.pos), next: s.next, waymarks: s.path.map(p => E.toScreen(p)), accuracy: s.moveT ? s.onT / s.moveT : null }; },
});
function distToPath(p, P) { let best = 1e9; for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], ab = b.clone().sub(a), u = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())); best = Math.min(best, p.distanceTo(a.clone().addScaledVector(ab, u))); } return best; }
