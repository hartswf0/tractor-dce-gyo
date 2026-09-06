/* world/vader.js — Darth Vader on foot: the kit's own minifig parts, re-hung on pivots.

   The thirteen parts (legs, hips, torso, arms, hands, head, helmet, saber,
   cape, collar) come out of the one parse as part groups; pivots are created
   at the hip pin, the shoulders and the neck, and the parts are attach()ed so
   their kit offsets survive. Walking is HLIÐARENDI's gait rate on plain
   rotation.x swings; the camera is its walking rig. Units: LDU, M per metre. */
(function () {
'use strict';
const DEG = Math.PI / 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = u => u * u * (3 - 2 * u);
const WALK = 2.15, RUN = 4.10, TURN = 7, FEET = 72, HEAD_M = 1.7, ORBIT = 8.2 / 4.65;   // HLIÐARENDI's rig, scaled from its 1.66 m hero to a 3 m minifig
const UP = new THREE.Vector3(0, 1, 0), V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3();

/* figure frame: torso origin, LDraw Y down, facing −z; soles at y = FEET */
const LINES = [
  '1 0 0 44 0 1 0 0 0 1 0 0 0 1 parts/3816.dat',                                   // leg R
  '1 0 0 44 0 1 0 0 0 1 0 0 0 1 parts/3817.dat',                                   // leg L
  '1 0 0 32 0 1 0 0 0 1 0 0 0 1 parts/3815.dat',                                   // hips
  '1 0 0 0 0 1 0 0 0 1 0 0 0 1 parts/973.dat',                                     // torso
  '1 0 -15.552 9 0 0.985 -0.17 0 0.17 0.985 0 0 0 1 parts/3818.dat',               // arm R
  '1 0 15.552 9 0 0.985 0.17 0 -0.17 0.985 0 0 0 1 parts/3819.dat',                // arm L
  '1 0 -23.8634 26.5956 -10.321 0.985 -0.12019 0.12019 0.17 0.696395 -0.696395 0 0.707 0.707 parts/3820.dat',   // hand R
  '1 0 23.8634 26.5956 -10.321 0.985 0.12019 -0.12019 -0.17 0.696395 -0.696395 0 0.707 0.707 parts/3820.dat',   // hand L
  '1 0 0 -24 0 1 0 0 0 1 0 0 0 1 parts/3626b.dat',                                 // head
  '1 0 0 -24 0 1 0 0 0 1 0 0 0 1 parts/30368.dat',                                 // helmet
  '1 36 23.8634 26.5956 -10.321 0.985 0.12019 -0.12019 -0.17 0.696395 -0.696395 0 0.707 0.707 parts/30374.dat',  // saber, in the left hand
  '1 0 0 0 0 1 0 0 0 1 0 0 0 1 parts/522.dat',                                     // cape
  '1 0 0 0 0 1 0 0 0 1 0 0 0 1 parts/20551c01.dat',                                // collar
];
const NAMES = ['legR', 'legL', 'hips', 'torso', 'armR', 'armL', 'handR', 'handL', 'head', 'helmet', 'saber', 'cape', 'collar'];

function G(parent, x, y, z, name) { const g = new THREE.Group(); g.position.set(x, y, z); g.name = name; parent.add(g); return g; }

/** groups: the 13 part groups, children of the parsed root (LDraw frame). Returns the rig in world space, soles at y = 0. */
function build(root, groups, scene, M) {
  const P = {}; NAMES.forEach((n, i) => { P[n] = groups[i]; P[n].name = n; });
  const hipsP = G(root, 0, 32, 0, 'hipsP'), torsoP = G(hipsP, 0, -32, 0, 'torsoP');
  const legRP = G(hipsP, 0, 12, 0, 'legRP'), legLP = G(hipsP, 0, 12, 0, 'legLP');
  const armRP = G(torsoP, -15.552, 9, 0, 'armRP'), armLP = G(torsoP, 15.552, 9, 0, 'armLP'), headP = G(torsoP, 0, -24, 0, 'headP');
  root.updateMatrixWorld(true);
  hipsP.attach(P.hips); torsoP.attach(P.torso); torsoP.attach(P.cape); torsoP.attach(P.collar);
  legRP.attach(P.legR); legLP.attach(P.legL); armRP.attach(P.armR); armRP.attach(P.handR); armLP.attach(P.armL); armLP.attach(P.handL); armLP.attach(P.saber);
  headP.attach(P.head); headP.attach(P.helmet);
  const figure = new THREE.Group(); figure.name = 'vader'; const flip = new THREE.Group(); flip.rotation.x = Math.PI; figure.add(flip);
  flip.attach(hipsP); hipsP.position.set(0, -(FEET - 32), 0); hipsP.quaternion.identity(); hipsP.scale.setScalar(1);
  for (const n of NAMES) P[n].traverse(o => { if (o.isMesh && o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.fog = true; });
  scene.add(figure);
  const rig = {
    figure, flip, hipsP, torsoP, legRP, legLP, armRP, armLP, headP, parts: P, M,
    pos: figure.position, heading: 0, speed: 0, phase: 0, gait: 0, t: 0, saber: null, hit: null, vel: new THREE.Vector3(), radius: 0.5 * M,
    cam: { yaw: 0, pitch: 0.18, pos: new THREE.Vector3(), look: new THREE.Vector3(), set: false },
    height: FEET + 28,                              // soles to the top of the helmet, LDU
  };
  return rig;
}

function facing(rig, out) { return out.set(Math.sin(rig.heading), 0, Math.cos(rig.heading)); }

/** ctl: { move: {x, z, mag} world-space, run, saber (trigger) }; world: { groundH, pushOut(pos, r) } */
function step(rig, dt, ctl, world) {
  const M = rig.M; rig.t += dt;
  const mv = ctl.move, want = mv.mag > 0.02 ? mv.mag * (ctl.run ? RUN : WALK) * M : 0;
  if (mv.mag > 0.02) {
    const goal = Math.atan2(mv.x, mv.z); let d = goal - rig.heading; d = Math.atan2(Math.sin(d), Math.cos(d));
    rig.heading += clamp(d, -TURN * dt, TURN * dt);
  }
  rig.speed += (want - rig.speed) * (1 - Math.exp(-dt * 10));
  facing(rig, V1); const before = V2.copy(rig.pos);
  rig.pos.addScaledVector(V1, rig.speed * dt);
  const g0 = world.groundH(before.x, before.z), g1 = world.groundH(rig.pos.x, rig.pos.z), run = Math.hypot(rig.pos.x - before.x, rig.pos.z - before.z);
  if (run > 1e-3 && (g1 - g0) / run > 1.3) { rig.pos.copy(before); rig.speed *= 0.3; }   // too steep to climb
  if (world.pushOut) world.pushOut(rig.pos, rig.radius);
  rig.pos.y = world.groundH(rig.pos.x, rig.pos.z);
  rig.vel.subVectors(rig.pos, before).divideScalar(Math.max(dt, 1e-3));
  rig.figure.rotation.y = rig.heading;
  // the gait
  const v = rig.speed / M; rig.phase += (4.35 + 1.62 * v) * dt;
  rig.gait = clamp(rig.gait + (v > 0.08 ? 1 : -1) * dt / 0.15, 0, 1);
  const s = Math.sin(rig.phase), g = rig.gait;
  rig.legRP.rotation.x = g * -35 * DEG * s; rig.legLP.rotation.x = -rig.legRP.rotation.x;
  rig.armRP.rotation.x = g * 25 * DEG * s;                       // the free arm counter-swings; the saber arm is below
  rig.hipsP.position.y = -(FEET - 32) - g * 1.5 * Math.abs(Math.cos(rig.phase));
  rig.torsoP.rotation.y = g * 0.06 * s; rig.torsoP.rotation.z = g * 0.03 * s;
  rig.torsoP.position.y = -32 - 0.4 * Math.sin(2 * Math.PI * 0.35 * rig.t) * (1 - g);
  rig.headP.rotation.y = 0.35 * Math.sin(0.3 * rig.t) * (1 - g);
  // the saber: raise the arm over a quarter second and bring it down; the strike lands at the top
  if (ctl.saber && !rig.saber) rig.saber = { t0: rig.t, struck: false };
  if (rig.saber) {
    const u = (rig.t - rig.saber.t0) / 0.25, rest = g * -25 * DEG * s;
    if (u < 1) rig.armLP.rotation.x = rest + (-Math.PI / 2 - rest) * smooth(u);
    else if (u < 2) { if (!rig.saber.struck) { rig.saber.struck = true; rig.hit = facing(rig, V3).multiplyScalar(1.6 * M).add(rig.pos); rig.hit.y += 1.2 * M; } rig.armLP.rotation.x = -Math.PI / 2 + (rest + Math.PI / 2) * smooth(u - 1); }
    else { rig.saber = null; rig.armLP.rotation.x = rest; }
  } else rig.armLP.rotation.x = g * -25 * DEG * s;
}

/** HLIÐARENDI's walking rig: orbit the head at 4.65 m, pitch clamped, pursuit with 1−e^(−6dt). */
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
/** Stick (x right, y forward) → world move vector relative to the camera's yaw. */
function moveFromStick(rig, stick, out) {
  const y = rig.cam.yaw, fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y);
  out.x = fx * stick.y + rx * stick.x; out.z = fz * stick.y + rz * stick.x;
  const h = Math.hypot(out.x, out.z); if (h > 1) { out.x /= h; out.z /= h; } out.mag = Math.min(1, h);
  return out;
}

window.Vader = { LINES, NAMES, build, step, camera, moveFromStick, facing, FEET };
})();
