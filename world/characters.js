/* world/characters.js — the people in the streets, and the bolts they fire.

   The Crowd is GPU-instanced: one InstancedMesh per minifig slot, a fixed
   instance index per figure, and one hidden template skeleton posed for each
   figure every frame to produce its matrices. Stormtroopers patrol the roads
   and engage you on sight; citizens wander and scatter. Anyone hit hard comes
   apart into parts that fall as debris. Units: LDU, M per metre. */
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), Q1 = new THREE.Quaternion(), Z1 = new THREE.Vector3(0, 0, 1);
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const SLOT_PARTS = { legR: '3816', legL: '3817', hips: '3815', torso: '973', armR: '3818', armL: '3819', handR: '3820', handL: '3820', head: '3626b', 'hat:30408': '30408', 'hat:3901': '3901', 'hat:30370': '30370', 'weaponR:58247': '58247' };

/* ───────────────────────── bolts on foot ───────────────────────── */
class Bolts {
  constructor({ scene, M, groundH, n = 40 }) {
    this.M = M; this.groundH = groundH; this.list = [];
    const geo = new THREE.BoxGeometry(4, 4, 44), red = new THREE.MeshBasicMaterial({ color: 0xff2a1a, fog: false }), green = new THREE.MeshBasicMaterial({ color: 0x2fbf3f, fog: false });
    this.mats = { red, green };
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, red); m.visible = false; m.frustumCulled = false; scene.add(m); this.list.push({ mesh: m, vel: new THREE.Vector3(), prev: new THREE.Vector3(), life: 0, owner: null }); }
  }
  fire(origin, dir, owner, speed = 1400) {
    const b = this.list.find(b => b.life <= 0); if (!b) return null;
    b.owner = owner; b.life = 1.6; b.mesh.material = owner === 'player' ? this.mats.green : this.mats.red;
    b.mesh.position.copy(origin); b.prev.copy(origin); b.vel.copy(dir).normalize().multiplyScalar(speed);
    b.mesh.quaternion.copy(Q1.setFromUnitVectors(Z1, b.vel.clone().normalize())); b.mesh.visible = true; return b;
  }
  /** hooks: { hitPlayer(b), hitNpc(b), hitWorld(b, point) } — each returns true to consume the bolt. */
  step(dt, hooks) {
    for (const b of this.list) {
      if (b.life <= 0) continue;
      b.prev.copy(b.mesh.position); b.mesh.position.addScaledVector(b.vel, dt);
      if ((b.life -= dt) <= 0) { b.mesh.visible = false; continue; }
      const p = b.mesh.position;
      if (p.y < this.groundH(p.x, p.z)) { b.life = 0; b.mesh.visible = false; continue; }
      if ((b.owner !== 'player' && hooks.hitPlayer && hooks.hitPlayer(b)) || (b.owner === 'player' && hooks.hitNpc && hooks.hitNpc(b)) || (hooks.hitWorld && hooks.hitWorld(b))) { b.life = 0; b.mesh.visible = false; }
    }
  }
  live() { return this.list.filter(b => b.life > 0); }
}
function segHitsSphere(a, b, c, r) { V3.subVectors(b, a); const L2 = V3.lengthSq(); const t = L2 ? clamp(V1.subVectors(c, a).dot(V3) / L2, 0, 1) : 0; return V2.copy(a).addScaledVector(V3, t).distanceToSquared(c) <= r * r; }

/* ───────────────────────── the crowd ───────────────────────── */
class Crowd {
  constructor({ scene, M, geoms, colours, groundH, cap = 32 }) {
    this.scene = scene; this.M = M; this.colours = colours; this.groundH = groundH; this.cap = cap;
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .55, metalness: 0 });
    this.tmpl = Minifig.skeleton(M); this.tmpl.figure.visible = false;
    this.meshes = new Map();
    for (const [slot, part] of Object.entries(SLOT_PARTS)) {
      const g = geoms.get(part); if (!g) continue;
      if (!g.attributes.color) { const n = g.attributes.position.count; g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3)); }
      const im = new THREE.InstancedMesh(g, this.mat, cap); im.frustumCulled = false; im.name = 'crowd:' + slot; for (let i = 0; i < cap; i++) im.setMatrixAt(i, ZERO); im.setColorAt(0, new THREE.Color(1, 1, 1)); im.instanceMatrix.needsUpdate = true;
      scene.add(im); this.meshes.set(slot, im);
    }
    this.npcs = []; this.free = Array.from({ length: cap }, (_, i) => cap - 1 - i); this.roads = []; this.rings = () => []; this.t = 0; this.kills = 0;
  }
  setRoads(roads) { this.roads = roads.filter(r => r.pts.length >= 2); }
  slotsOf(def) { const s = ['legR', 'legL', 'hips', 'torso', 'armR', 'armL', 'handR', 'handL', 'head']; if (def.hat) s.push('hat:' + def.hat[0]); if (def.weapon && def.weapon[0] === 'blaster') s.push('weaponR:' + def.weapon[1]); return s; }
  colourOf(def, slot) { const k = slot.split(':')[0]; return { legR: def.legs, legL: def.legs, hips: def.hips, torso: def.torso, armR: def.arms, armL: def.arms, handR: def.hands, handL: def.hands, head: def.head, hat: def.hat && def.hat[1], weaponR: def.weapon && def.weapon[2] }[k]; }
  spawn(kind, x, z, seed) {
    if (!this.free.length) return null;
    const def = kind === 'trooper' ? Minifig.DEFS.trooper : Minifig.citizen(seed), i = this.free.pop();
    const n = { i, kind, def, pos: new THREE.Vector3(x, this.groundH(x, z), z), heading: Math.random() * Math.PI * 2, speed: 0, phase: Math.random() * 6, gait: 0, t: Math.random() * 10, health: kind === 'trooper' ? 40 : 20, alive: true, state: 'patrol', aim: 0, cd: 1 + Math.random(), flee: 0, road: null, seg: 0, dir: 1, pause: 0, slots: this.slotsOf(def) };
    for (const slot of n.slots) { const im = this.meshes.get(slot); if (im) { im.setColorAt(i, this.colours(this.colourOf(def, slot))); im.instanceColor.needsUpdate = true; } }
    this.pickRoad(n); this.npcs.push(n); return n;
  }
  pickRoad(n) { if (!this.roads.length) return; let best = null, bd = Infinity; for (const r of this.roads) for (let k = 0; k < r.pts.length; k++) { const d = Math.hypot(r.pts[k].x * this.M - n.pos.x, r.pts[k].z * this.M - n.pos.z); if (d < bd) { bd = d; best = [r, k]; } } n.road = best[0]; n.seg = best[1]; n.dir = Math.random() < 0.5 ? 1 : -1; }
  /** Fill the streets: squads of troopers and wandering citizens, all at least `far` metres from the player. */
  populate(playerPos, troopers = 12, citizens = 12, far = 60) {
    for (const n of this.npcs.slice()) this.remove(n);
    const spots = []; for (const r of this.roads) for (let k = 0; k < r.pts.length - 1; k++) { const a = r.pts[k], b = r.pts[k + 1], L = Math.hypot(b.x - a.x, b.z - a.z), steps = Math.max(1, Math.ceil(L / 12)); for (let s = 0; s <= steps; s++) spots.push({ x: a.x + (b.x - a.x) * s / steps, z: a.z + (b.z - a.z) * s / steps }); }
    const ok = spots.filter(p => Math.hypot(p.x * this.M - playerPos.x, p.z * this.M - playerPos.z) > far * this.M);
    if (!ok.length) return 0;
    let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let s = 0; s < troopers; s += 3) { const p = ok[Math.floor(rnd() * ok.length)]; for (let k = 0; k < 3 && s + k < troopers; k++) this.spawn('trooper', p.x * this.M + (k - 1) * 1.2 * this.M, p.z * this.M + k * 0.6 * this.M, s + k); }
    for (let c = 0; c < citizens; c++) { const p = ok[Math.floor(rnd() * ok.length)]; this.spawn('citizen', p.x * this.M + (rnd() - .5) * 4 * this.M, p.z * this.M + (rnd() - .5) * 4 * this.M, 100 + c); }
    return this.npcs.length;
  }
  remove(n) { for (const im of this.meshes.values()) im.setMatrixAt(n.i, ZERO), im.instanceMatrix.needsUpdate = true; this.free.push(n.i); const k = this.npcs.indexOf(n); if (k >= 0) this.npcs.splice(k, 1); }
  /** A figure comes apart: every part becomes debris flung with vel. */
  burst(n, vel, debris) {
    if (!n.alive) return; n.alive = false; n.deadAt = this.t; this.kills += n.kind === 'trooper' ? 1 : 0;
    this.poseTemplate(n);
    for (const slot of n.slots) { const s = this.tmpl.slots[slot.split(':')[0] === 'hat' ? 'hat' : slot.split(':')[0] === 'weaponR' ? 'weaponR' : slot]; if (!s) continue; const part = SLOT_PARTS[slot];
      const v = new THREE.Vector3((Math.random() - .5) * 3, 2 + Math.random() * 3, (Math.random() - .5) * 3).multiplyScalar(this.M).add(vel || V1.set(0, 0, 0));
      if (debris) debris.spawn({ part, matrix: s.matrixWorld.clone(), colour: this.colours(this.colourOf(n.def, slot)), vel: v }); }
    for (const im of this.meshes.values()) im.setMatrixAt(n.i, ZERO), im.instanceMatrix.needsUpdate = true;
  }
  poseTemplate(n) {
    const T = this.tmpl; T.figure.position.copy(n.pos); T.figure.rotation.y = n.heading; T.def = n.def;
    Minifig.pose(T, { phase: n.phase, gait: n.gait, t: n.t, swing: null, aim: n.aim }); T.figure.updateMatrixWorld(true);
  }
  /** Everyone within r of a point is thrown (and bursts). Returns how many. */
  hitWithin(pt, r, vel, debris) { let k = 0; for (const n of this.npcs) { if (!n.alive) continue; V1.copy(n.pos); V1.y += 1.2 * this.M; if (V1.distanceTo(pt) < r) { this.burst(n, vel, debris); k++; } } return k; }
  /** ctx: { player: {pos, alive, running}, tie: {pos, flying}, bolts, debris, los(a, b) → true if clear, pushOut, playerRadius } */
  step(dt, ctx) {
    this.t += dt; const M = this.M;
    for (const n of this.npcs.slice()) {
      if (!n.alive) { if (this.t - n.deadAt > 30) { this.remove(n); const spots = this.roads.length ? this.roads[Math.floor(Math.random() * this.roads.length)].pts : null; if (spots) { const p = spots[Math.floor(Math.random() * spots.length)]; if (Math.hypot(p.x * M - ctx.player.pos.x, p.z * M - ctx.player.pos.z) > 50 * M) this.spawn(n.kind, p.x * M, p.z * M, Math.floor(Math.random() * 1000)); } } continue; }
      n.t += dt; n.cd -= dt;
      let want = 0, goalHeading = n.heading, aim = 0;
      const toP = V1.subVectors(ctx.player.pos, n.pos); toP.y = 0; const dP = toP.length() / M;
      const tieNear = ctx.tie.flying && Math.hypot(ctx.tie.pos.x - n.pos.x, ctx.tie.pos.z - n.pos.z) < 30 * M;
      if (n.kind === 'trooper') {
        const sees = ctx.player.alive && dP < 40 && (dP < 12 || ctx.los(n.pos, ctx.player.pos));
        if (sees) { n.state = 'engage'; goalHeading = Math.atan2(toP.x, toP.z); aim = 1; if (dP < 6) { want = -1.2; } else if (dP > 24) want = 1.6; if (n.cd <= 0) { n.cd = 1.5 + Math.random(); this.poseTemplate(n); const mz = V2.set(0, -20, -30).applyMatrix4(this.tmpl.slots.weaponR.matrixWorld); V3.copy(ctx.player.pos); V3.y += 1.3 * M; V3.sub(mz).normalize(); V3.x += (Math.random() - .5) * 0.12; V3.z += (Math.random() - .5) * 0.12; ctx.bolts.fire(mz, V3, 'npc'); } }
        else if (ctx.tie.flying && Math.hypot(ctx.tie.pos.x - n.pos.x, ctx.tie.pos.z - n.pos.z) < 70 * M) { n.state = 'engage'; V2.subVectors(ctx.tie.pos, n.pos); goalHeading = Math.atan2(V2.x, V2.z); aim = 1; if (n.cd <= 0) { n.cd = 2 + Math.random(); this.poseTemplate(n); const mz = V3.set(0, -20, -30).applyMatrix4(this.tmpl.slots.weaponR.matrixWorld); V2.sub(mz).normalize(); ctx.bolts.fire(mz, V2, 'npc'); } }
        else { n.state = 'patrol'; const r = this.patrol(n, dt, 1.6); if (r) { goalHeading = r.heading; want = 1.6; } }
      } else {
        const boltNear = ctx.bolts.live().some(b => Math.hypot(b.mesh.position.x - n.pos.x, b.mesh.position.z - n.pos.z) < 15 * M);
        const rushing = ctx.player.running && dP < 8 && toP.dot(ctx.player.vel) < 0;
        if (tieNear || boltNear || rushing) n.flee = 3;
        if (n.flee > 0) { n.flee -= dt; n.state = 'flee'; const from = tieNear ? V2.set(ctx.tie.pos.x - n.pos.x, 0, ctx.tie.pos.z - n.pos.z) : toP; goalHeading = Math.atan2(-from.x, -from.z); want = 3; }
        else { n.state = 'wander'; if (n.pause > 0) { n.pause -= dt; } else { const r = this.patrol(n, dt, 1.2); if (r) { goalHeading = r.heading; want = 1.2; } if (Math.random() < dt * 0.05) n.pause = 1 + Math.random() * 3; } }
      }
      // move
      let d = goalHeading - n.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); n.heading += clamp(d, -5 * dt, 5 * dt);
      const target = want * M; n.speed += (target - n.speed) * (1 - Math.exp(-dt * 8));
      n.pos.x += Math.sin(n.heading) * n.speed * dt; n.pos.z += Math.cos(n.heading) * n.speed * dt;
      if (ctx.pushOut) ctx.pushOut(n.pos, 0.5 * M);
      n.pos.y = this.groundH(n.pos.x, n.pos.z);
      const v = Math.abs(n.speed) / M; n.phase += (4.35 + 1.62 * v) * dt * (n.speed < 0 ? -1 : 1);
      n.gait = clamp(n.gait + (v > 0.08 ? 1 : -1) * dt / 0.15, 0, 1); n.aim += (aim - n.aim) * (1 - Math.exp(-dt * 8));
      // write the instance matrices
      this.poseTemplate(n);
      for (const slot of n.slots) { const im = this.meshes.get(slot); if (!im) continue; const s = this.tmpl.slots[slot.startsWith('hat') ? 'hat' : slot.startsWith('weaponR') ? 'weaponR' : slot]; im.setMatrixAt(n.i, s.matrixWorld); im.instanceMatrix.needsUpdate = true; }
    }
  }
  /** Walk along the current road; returns the heading to take, or null when there is no road. */
  patrol(n, dt, speed) {
    if (!n.road) { this.pickRoad(n); if (!n.road) return null; }
    const pts = n.road.pts, M = this.M; let tgt = pts[n.seg];
    if (Math.hypot(tgt.x * M - n.pos.x, tgt.z * M - n.pos.z) < 1.5 * M) { n.seg += n.dir; if (n.seg < 0 || n.seg >= pts.length) { n.dir = -n.dir; n.seg += 2 * n.dir; n.seg = clamp(n.seg, 0, pts.length - 1); if (Math.random() < 0.3) { this.pickRoad(n); } } tgt = pts[n.seg]; }
    return { heading: Math.atan2(tgt.x * M - n.pos.x, tgt.z * M - n.pos.z) };
  }
  /** The nearest live figure to a point within r (for bolts, the saber, the TIE). */
  nearest(pt, r) { let best = null, bd = r; for (const n of this.npcs) { if (!n.alive) continue; V1.copy(n.pos); V1.y += 1.2 * this.M; const d = V1.distanceTo(pt); if (d < bd) { bd = d; best = n; } } return best; }
  hitBy(b, debris) { for (const n of this.npcs) { if (!n.alive) continue; V1.copy(n.pos); V1.y += 1.3 * this.M; if (segHitsSphere(b.prev, b.mesh.position, V1, 0.9 * this.M)) { n.health -= 20; if (n.health <= 0) this.burst(n, b.vel.clone().multiplyScalar(0.08), debris); return true; } } return false; }
  stats() { let t = 0, c = 0, a = 0; for (const n of this.npcs) { if (n.kind === 'trooper') t++; else c++; if (n.alive) a++; } return { troopers: t, citizens: c, alive: a, kills: this.kills, states: this.npcs.filter(n => n.alive).map(n => n.state) }; }
}
window.Characters = { Crowd, Bolts, SLOT_PARTS, segHitsSphere };
})();
