/* world/minifig.js — any minifig, on pivots: the player's rig and the crowd's template.

   A definition names the parts and colours. The skeleton is a tree of empty
   groups: hip, shoulder and neck pivots with a slot per part carrying the kit
   offset, so the same pose maths drives the player's meshes and the crowd's
   instances. The saber is hung at the fist pointing forward and up; a swing
   is a horizontal slash. Units: LDU, M per metre. Figure frame: LDraw Y down,
   facing −z; soles at y = FEET. */
(function () {
'use strict';
const DEG = Math.PI / 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = u => u * u * (3 - 2 * u);
const WALK = 2.15, RUN = 4.10, TURN = 7, FEET = 72, HEAD_M = 1.7, ORBIT = 8.2 / 4.65;
const UP = new THREE.Vector3(0, 1, 0), V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), Q1 = new THREE.Quaternion(), M1 = new THREE.Matrix4();

/* the kit's own offsets (build-75421.py figure()), in the figure frame */
const HAND_R = [-23.8634, 26.5956, -10.321, 0.985, -0.12019, 0.12019, 0.17, 0.696395, -0.696395, 0, 0.707, 0.707];
const HAND_L = [23.8634, 26.5956, -10.321, 0.985, 0.12019, -0.12019, -0.17, 0.696395, -0.696395, 0, 0.707, 0.707];
const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const SABER_TILT = rx(-130 * DEG);                          // the bar runs +y (down) from its hilt; tilted to leave the fist forward and 40° up
const FIST_L = [23.8634, 32, -16], FIST_R = [-23.8634, 32, -16];
/** Slot table: name → [pivot, x, y, z, 9 matrix entries] in the figure frame. */
const SLOTS = {
  legR: ['legRP', 0, 44, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], legL: ['legLP', 0, 44, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], hips: ['hipsP', 0, 32, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  torso: ['torsoP', 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], cape: ['torsoP', 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], collar: ['torsoP', 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  armR: ['armRP', -15.552, 9, 0, 0.985, -0.17, 0, 0.17, 0.985, 0, 0, 0, 1], armL: ['armLP', 15.552, 9, 0, 0.985, 0.17, 0, -0.17, 0.985, 0, 0, 0, 1],
  handR: ['armRP', ...HAND_R], handL: ['armLP', ...HAND_L],
  head: ['headP', 0, -24, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], hat: ['headP', 0, -24, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  weaponL: ['armLP', ...FIST_L, ...SABER_TILT], weaponR: ['armRP', ...HAND_R],
};
const PIVOTS = { hipsP: [null, 0, 32, 0], torsoP: ['hipsP', 0, -32, 0], legRP: ['hipsP', 0, 12, 0], legLP: ['hipsP', 0, 12, 0], armRP: ['torsoP', -15.552, 9, 0], armLP: ['torsoP', 15.552, 9, 0], headP: ['torsoP', 0, -24, 0] };
const PIVOT_ABS = { hipsP: [0, 32, 0], torsoP: [0, 0, 0], legRP: [0, 44, 0], legLP: [0, 44, 0], armRP: [-15.552, 9, 0], armLP: [15.552, 9, 0], headP: [0, -24, 0] };

/* ───────────────────────── definitions ───────────────────────── */
const DEFS = {
  vader: { name: 'Vader', legs: 0, hips: 0, torso: 0, arms: 0, hands: 0, head: 0, hat: ['30368', 0], weapon: ['saber', '30374', 36], cape: ['522', 0], collar: ['20551c01', 0], saber: true },
  trooper: { name: 'Stormtrooper', legs: 15, hips: 15, torso: 15, arms: 15, hands: 0, head: 0, hat: ['30408', 15], weapon: ['blaster', '58247', 0] },
  pilot: { name: 'Rebel pilot', legs: 71, hips: 71, torso: 25, arms: 25, hands: 14, head: 14, hat: ['30370', 71], weapon: ['blaster', '58247', 0] },
  luke: { name: 'Luke', legs: 19, hips: 19, torso: 19, arms: 19, hands: 14, head: 14, hat: ['3901', 14], weapon: ['saber', '30374', 33], saber: true },
  citizen: { name: 'Citizen', legs: 1, hips: 1, torso: 4, arms: 4, hands: 14, head: 14, hat: ['3901', 0], weapon: null },
};
const CITIZEN_TORSOS = [4, 1, 2, 14, 15, 19, 25, 70], CITIZEN_HAIR = [0, 70, 4, 6, 15];
function citizen(seed) { const d = { ...DEFS.citizen }; d.torso = d.arms = CITIZEN_TORSOS[seed % CITIZEN_TORSOS.length]; d.hat = ['3901', CITIZEN_HAIR[(seed >> 3) % CITIZEN_HAIR.length]]; d.legs = d.hips = [1, 0, 72, 28][(seed >> 6) % 4]; return d; }

/** The parts a definition needs, in order: [slot, partFile, colour]. */
function partsOf(def) {
  const out = [['legR', '3816', def.legs], ['legL', '3817', def.legs], ['hips', '3815', def.hips], ['torso', '973', def.torso], ['armR', '3818', def.arms], ['armL', '3819', def.arms],
    ['handR', '3820', def.hands], ['handL', '3820', def.hands], ['head', '3626b', def.head]];
  if (def.hat) out.push(['hat', def.hat[0], def.hat[1]]);
  if (def.weapon) out.push([def.weapon[0] === 'saber' ? 'weaponL' : 'weaponR', def.weapon[1], def.weapon[2]]);
  if (def.cape) out.push(['cape', def.cape[0], def.cape[1]]);
  if (def.collar) out.push(['collar', def.collar[0], def.collar[1]]);
  return out;
}
const fmt = v => (Math.round(v * 1e4) / 1e4).toString();
/** LDraw lines for the parse, one per part, placed in the figure frame. */
function lines(def) { return partsOf(def).map(([slot, part, col]) => { const s = SLOTS[slot]; return `1 ${col} ${s.slice(1, 13).map(fmt).join(' ')} parts/${part}.dat`; }); }
/** One identity line per part file the crowd may need, for harvesting raw geometry. */
const CROWD_PARTS = ['3816', '3817', '3815', '973', '3818', '3819', '3820', '3626b', '30408', '3901', '30370', '58247', '30374', '3062b', '30368', '522', '20551c01'];
const harvestLines = () => CROWD_PARTS.map(p => `1 16 0 0 0 1 0 0 0 1 0 0 0 1 parts/${p}.dat`);

/* ───────────────────────── the skeleton ───────────────────────── */
function skeleton(M) {
  const figure = new THREE.Group(); figure.name = 'minifig'; const flip = new THREE.Group(); flip.rotation.x = Math.PI; figure.add(flip);
  const P = {};
  for (const [name, [parent, x, y, z]] of Object.entries(PIVOTS)) { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); (parent ? P[parent] : flip).add(g); P[name] = g; }
  P.hipsP.position.set(0, -(FEET - 32), 0);
  const S = {};
  for (const [name, def] of Object.entries(SLOTS)) {
    const g = new THREE.Group(); g.name = 'slot:' + name; const pa = PIVOT_ABS[def[0]];
    g.position.set(def[1] - pa[0], def[2] - pa[1], def[3] - pa[2]);
    M1.set(def[4], def[5], def[6], 0, def[7], def[8], def[9], 0, def[10], def[11], def[12], 0, 0, 0, 0, 1); g.quaternion.setFromRotationMatrix(M1);
    P[def[0]].add(g); S[name] = g;
  }
  return { figure, flip, ...P, slots: S, M, pos: figure.position, heading: 0, speed: 0, phase: 0, gait: 0, t: 0, swing: null, aim: 0, hit: null, vel: new THREE.Vector3(), radius: 0.5 * M,
    cam: { yaw: 0, pitch: 0.18, pos: new THREE.Vector3(), look: new THREE.Vector3(), set: false }, height: FEET + 28, health: 100, def: null, mounted: {} };
}
/** Hang parsed part groups (in partsOf order) on the skeleton's slots; the groups' own kit transforms are dropped. */
function mount(rig, groups, def, scene) {
  rig.def = def; const parts = partsOf(def);
  groups.forEach((g, i) => { const slot = parts[i][0]; g.position.set(0, 0, 0); g.quaternion.identity(); g.scale.setScalar(1); g.name = slot; rig.slots[slot].add(g); rig.mounted[slot] = { group: g, part: parts[i][1], col: parts[i][2] };
    g.traverse(o => { if (o.isMesh && o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.fog = true; }); });
  if (scene) scene.add(rig.figure);
  return rig;
}
function facing(rig, out) { return out.set(Math.sin(rig.heading), 0, Math.cos(rig.heading)); }

/** Joint angles from a state: gait, phase, swing (saber, 0..1 or null), aim (blaster raised 0..1), t. */
function pose(rig, st) {
  const s = Math.sin(st.phase), g = st.gait;
  rig.legRP.rotation.x = g * -35 * DEG * s; rig.legLP.rotation.x = -rig.legRP.rotation.x;
  rig.hipsP.position.y = -(FEET - 32) - g * 1.5 * Math.abs(Math.cos(st.phase));
  rig.torsoP.rotation.z = g * 0.03 * s; rig.torsoP.position.y = -32 - 0.4 * Math.sin(2 * Math.PI * 0.35 * st.t) * (1 - g);
  rig.headP.rotation.y = 0.35 * Math.sin(0.3 * st.t) * (1 - g);
  let armL = g * -25 * DEG * s, armR = g * 25 * DEG * s, twist = g * 0.06 * s;
  if (st.swing != null) {                          // the slash: arm forward, torso sweeps across
    const u = st.swing, raise = u < 0.25 ? smooth(u / 0.25) : u > 0.8 ? 1 - smooth((u - 0.8) / 0.2) : 1;
    armL = armL + (-90 * DEG - armL) * raise;
    twist = 0.8 * (u < 0.15 ? -smooth(u / 0.15) : u < 0.7 ? -1 + 2 * smooth((u - 0.15) / 0.55) : 1 - smooth((u - 0.7) / 0.3));
    if (rig.def && rig.def.weapon && rig.def.weapon[0] === 'saber') twist = -twist;   // the saber hand leads
  }
  if (st.aim) armR = armR + (-80 * DEG - armR) * st.aim;
  rig.armLP.rotation.x = armL; rig.armRP.rotation.x = armR; rig.torsoP.rotation.y = twist;
}

/** ctl: { move: {x, z, mag} world-space, run, saber (trigger), aim }; world: { groundH, pushOut(pos, r) } */
function step(rig, dt, ctl, world) {
  const M = rig.M; rig.t += dt;
  const mv = ctl.move, want = mv.mag > 0.02 ? mv.mag * (ctl.run ? RUN : WALK) * M : 0;
  if (mv.mag > 0.02) { const goal = Math.atan2(mv.x, mv.z); let d = goal - rig.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); rig.heading += clamp(d, -TURN * dt, TURN * dt); }
  rig.speed += (want - rig.speed) * (1 - Math.exp(-dt * 10));
  facing(rig, V1); const before = V2.copy(rig.pos);
  rig.pos.addScaledVector(V1, rig.speed * dt);
  const g0 = world.groundH(before.x, before.z), g1 = world.groundH(rig.pos.x, rig.pos.z), run = Math.hypot(rig.pos.x - before.x, rig.pos.z - before.z);
  if (run > 1e-3 && (g1 - g0) / run > 1.3) { rig.pos.copy(before); rig.speed *= 0.3; }
  if (world.pushOut) world.pushOut(rig.pos, rig.radius);
  rig.pos.y = world.groundH(rig.pos.x, rig.pos.z);
  rig.vel.subVectors(rig.pos, before).divideScalar(Math.max(dt, 1e-3));
  rig.figure.rotation.y = rig.heading;
  const v = rig.speed / M; rig.phase += (4.35 + 1.62 * v) * dt;
  rig.gait = clamp(rig.gait + (v > 0.08 ? 1 : -1) * dt / 0.15, 0, 1);
  if (ctl.saber && !rig.swing && rig.def && rig.def.saber) rig.swing = { t0: rig.t, struck: false };
  let u = null;
  if (rig.swing) {
    u = (rig.t - rig.swing.t0) / 0.42;
    if (u >= 0.42 && !rig.swing.struck) { rig.swing.struck = true; rig.hit = facing(rig, V3).multiplyScalar(1.6 * M).add(rig.pos); rig.hit.y += 1.1 * M; }
    if (u >= 1) { rig.swing = null; u = null; }
  }
  rig.aim += ((ctl.aim ? 1 : 0) - rig.aim) * (1 - Math.exp(-dt * 8));
  pose(rig, { phase: rig.phase, gait: rig.gait, t: rig.t, swing: u, aim: rig.aim });
}

/** HLIÐARENDI's walking rig, scaled to a 3 m minifig. */
function camera(rig, camera, dt, look, world, portrait) {
  const M = rig.M, c = rig.cam;
  c.yaw -= look.dx; c.pitch = clamp(c.pitch + look.dy, -0.38, 0.52);
  const r = (portrait ? 4.65 : 4.15) * ORBIT * M;
  V1.copy(rig.pos); V1.y += HEAD_M * M;
  V2.set(V1.x + Math.sin(c.yaw) * Math.cos(c.pitch) * r, V1.y + Math.sin(c.pitch) * r + 0.28 * M, V1.z + Math.cos(c.yaw) * Math.cos(c.pitch) * r);
  const gy = world.groundH(V2.x, V2.z) + 0.6 * M; if (V2.y < gy) V2.y = gy;
  if (!c.set) { c.pos.copy(V2); c.look.copy(V1); c.set = true; }
  const k = 1 - Math.exp(-dt * 6); c.pos.lerp(V2, k); c.look.lerp(V1, k);
  camera.position.copy(c.pos); camera.up.copy(UP); camera.lookAt(c.look);
}
function moveFromStick(rig, stick, out) {
  const y = rig.cam.yaw, fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y);
  out.x = fx * stick.y + rx * stick.x; out.z = fz * stick.y + rz * stick.x;
  const h = Math.hypot(out.x, out.z); if (h > 1) { out.x /= h; out.z /= h; } out.mag = Math.min(1, h);
  return out;
}
/** Where the blade's tip is, in world space (for the saber test and for hits). */
function saberTip(rig, out) { const s = rig.slots.weaponL; s.updateWorldMatrix(true, false); return out.set(0, 80, 0).applyMatrix4(s.matrixWorld); }
function fist(rig, out) { const s = rig.slots.weaponL; s.updateWorldMatrix(true, false); return out.set(0, 0, 0).applyMatrix4(s.matrixWorld); }
/** The muzzle of a held blaster, world space, and the direction it points. */
function muzzle(rig, outPos, outDir) { const s = rig.slots.weaponR; s.updateWorldMatrix(true, false); outPos.set(0, -20, -30).applyMatrix4(s.matrixWorld); outDir.copy(facing(rig, V3)); return outPos; }
/** Every mounted part with its world matrix and colour: what falls when the figure comes apart. */
function burst(rig) {
  rig.figure.updateMatrixWorld(true);
  return Object.entries(rig.mounted).map(([slot, m]) => ({ part: m.part, col: m.col, matrix: m.group.matrixWorld.clone() }));
}

window.Minifig = { DEFS, citizen, partsOf, lines, harvestLines, CROWD_PARTS, SLOTS, skeleton, mount, pose, step, camera, moveFromStick, facing, saberTip, fist, muzzle, burst, FEET, WALK, RUN };
})();
