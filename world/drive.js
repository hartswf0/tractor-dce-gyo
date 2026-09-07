/* world/drive.js — ride what you built: cars, trucks and boats drive over the ground; speeders and planes fly.

   A vehicle is a prop (see props.js) whose source op was `vehicle`. Boarding wraps
   its group in a controller with a heading, a speed and a chase camera; the prop's
   forward is south, so heading h moves it along (sin h, 0, cos h) and the group's
   rotation.y is h. Driving pushes out of buildings, bricks and other props; a fast
   ram calls back into the page so walls crumble; people in the way are knocked.
   Flying is a small version of the TIE's model: yaw and pitch from the stick, speed
   toward cruise or boost, a landing that eases down to the ground. */
(function () {
'use strict';
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), E1 = new THREE.Euler(), Q1 = new THREE.Quaternion();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* per kind: cruise and boost in m/s, turn rate rad/s, whether it flies, hover height in m, ram damage factor */
const KINDS = {
  car: { cruise: 14, boost: 22, turn: 1.8, fly: false, hover: 0, ram: 1 },
  truck: { cruise: 10, boost: 15, turn: 1.3, fly: false, hover: 0, ram: 1.5 },
  boat: { cruise: 8, boost: 12, turn: 1.2, fly: false, hover: 0, ram: 0.8 },
  speeder: { cruise: 15, boost: 30, turn: 2.0, fly: true, hover: 0.6, ram: 0.8, stall: 0 },
  plane: { cruise: 20, boost: 40, turn: 1.6, fly: true, hover: 0, ram: 1, stall: 8 },
};
const kindOf = it => { const k = it && it.src && String(it.src.kind || 'car').toLowerCase(); return KINDS[k] ? k : 'car'; };

/** Board a prop. prop: the Props item (group, box, yaw). */
function create({ prop, M, groundH, aabbs }) {
  const kind = kindOf(prop), K = KINDS[kind], b = prop.box;
  const r = b ? Math.max(0.5 * M, Math.hypot(b.max.x - b.min.x, b.max.z - b.min.z) * 0.35) : M;
  const V = {
    prop, group: prop.group, kind, K, fly: K.fly, M, groundH, aabbs, r,
    pos: prop.group.position.clone(), heading: prop.yaw * Math.PI / 2, pitch: 0, roll: 0, speed: 0, vel: new THREE.Vector3(), alt: 0,
    input: { x: 0, y: 0, mag: 0, boost: false }, landing: 0, airborne: false, t: 0, bumped: 0, lastRam: -9,
    cam: { look: new THREE.Vector3(), set: false, dist: 0, high: 0 },
  };
  V.pos.y = groundH(V.pos.x, V.pos.z) + K.hover * M;
  return V;
}
function forward(V, out) { return out.set(Math.sin(V.heading) * Math.cos(V.pitch), Math.sin(V.pitch), Math.cos(V.heading) * Math.cos(V.pitch)); }
function place(V) { V.group.position.copy(V.pos); V.group.rotation.set(0, 0, 0, 'YXZ'); V.group.rotation.y = V.heading; if (V.fly) { V.group.rotateX(-V.pitch); V.group.rotateZ(-V.roll); } }

/** One step. ctx: { blast(point, r, vel, kind), knock(centre, r, vel), pushOut(pos, r) → moved? , sfx: { crunch(), thud(k) } } */
function step(V, dt, ctx) {
  V.t += dt; const M = V.M, K = V.K, i = V.input;
  if (V.fly) stepFly(V, dt, ctx); else stepDrive(V, dt, ctx);
  place(V);
  return !V.done;
}
function stepDrive(V, dt, ctx) {
  const M = V.M, K = V.K, i = V.input;
  const max = (i.boost ? K.boost : K.cruise) * M, want = i.y * (i.y >= 0 ? max : max * 0.5), accel = (i.y ? 6 : 4) * M;
  V.speed += clamp(want - V.speed, -accel * dt * 1.5, accel * dt);
  if (Math.abs(V.speed) > 0.3 * M) V.heading -= i.x * K.turn * dt * Math.sign(V.speed) * clamp(Math.abs(V.speed) / (4 * M), 0.35, 1);
  forward(V, V1); V.pos.addScaledVector(V1, V.speed * dt); V.vel.copy(V1).multiplyScalar(V.speed);
  const gh = V.groundH(V.pos.x, V.pos.z); V.pos.y = gh + K.hover * M;
  V2.copy(V.pos);
  if (ctx.pushOut && ctx.pushOut(V.pos, V.r)) {
    const pushed = V2.distanceTo(V.pos);
    if (pushed > 2) {
      const sp = Math.abs(V.speed) / M;
      if (sp > 8 && V.t - V.lastRam > 0.5) { V.lastRam = V.t; V2.copy(V.pos).addScaledVector(V1, V.r + 0.3 * M); V2.y += 0.5 * M; ctx.blast && ctx.blast(V2, 2 * M * K.ram, V.vel.clone().multiplyScalar(0.2), 'ram'); }
      else if (sp > 2) ctx.sfx && ctx.sfx.crunch();
      V.speed *= -0.2; V.bumped = V.t;
    }
  }
  if (ctx.knock && Math.abs(V.speed) > 3 * M) { V2.copy(V.pos); V2.y += 0.6 * M; ctx.knock(V2, V.r + 0.4 * M, V.vel.clone().multiplyScalar(0.6)); }
}
function stepFly(V, dt, ctx) {
  const M = V.M, K = V.K, i = V.input, g = 0.25 + 0.75 * i.mag * i.mag, hover = K.stall === 0;
  const roof = ctx.roofAt ? ctx.roofAt(V.pos.x, V.pos.z, V.pos.y) : -Infinity, gh = Math.max(V.groundH(V.pos.x, V.pos.z), roof), alt = V.pos.y - gh;
  // throttle: planes cruise on their own once up; speeders fly as hard as the thumb pushes and hover when it lifts
  const target = V.landing ? (hover ? 0 : 3 * M) : (i.boost ? K.boost : K.cruise) * M * (hover ? clamp(i.mag, 0, 1) : (V.airborne || i.mag > 0.1 ? 1 : 0));
  V.speed += (target - V.speed) * (1 - Math.exp(-dt * (V.landing ? 1.4 : 2.2)));
  V.heading -= i.x * K.turn * g * dt;
  const wantPitch = V.landing ? 0 : clamp(i.y * 0.55, -0.55, 0.55);
  V.pitch += (wantPitch - V.pitch) * (1 - Math.exp(-dt * 2.6));
  V.roll += (-i.x * 0.5 - V.roll) * (1 - Math.exp(-dt * 3));
  forward(V, V1); V.vel.copy(V1).multiplyScalar(V.speed);
  if (V.landing) V.vel.y = -Math.min(15, 5 + alt / M / 8) * M;                                     // a landing comes down at 5 m/s near the ground, faster from high up, wherever the ground is
  else if (!hover && V.airborne && i.mag < 0.1 && V.speed < K.stall * M) V.vel.y -= (K.stall * M - V.speed) * 0.4;   // a plane that has lost its speed sinks gently
  V.pos.addScaledVector(V.vel, dt);
  const floor = gh + K.hover * M;
  if (V.pos.y <= floor) { V.pos.y = floor; if (V.vel.y < 0) V.vel.y = 0; if (V.pitch < 0) V.pitch *= 0.5;
    if (V.airborne && (V.landing || (V.speed < 4 * M && Math.abs(V.pitch) < 0.3))) { V.airborne = false; V.landing = 0; V.speed = 0; V.pitch = 0; V.roll = 0; V.done = true; ctx.sfx && ctx.sfx.thud(0.4); return; }
    if (!V.airborne && !V.landing && V.speed > 5 * M && i.y > 0.1) V.airborne = true;
  } else if (alt > 0.5 * M) V.airborne = true;
  if (!V.airborne && !V.landing) { V.pitch = 0; if (V.speed > 5 * M && i.y > 0.1) V.airborne = true; }
  if (V.pos.y > gh + 400 * M) V.pos.y = gh + 400 * M;
  // buildings: a box in the way bounces the vehicle and bruises the wall
  if (V.aabbs && V.t - V.lastRam > 0.4 && !V.landing) { for (const box of V.aabbs(V.pos.x, V.pos.z, V.r)) { if (V.pos.x > box.min.x - V.r && V.pos.x < box.max.x + V.r && V.pos.z > box.min.z - V.r && V.pos.z < box.max.z + V.r && V.pos.y > box.min.y - 0.2 * M && V.pos.y < box.max.y - 0.3 * M) {
    V.lastRam = V.t; const sp = V.speed / M; V2.copy(V.pos); ctx.blast && sp > 6 && ctx.blast(V2, 3 * M * K.ram, V.vel.clone().multiplyScalar(0.25), 'ram'); ctx.sfx && ctx.sfx.crunch();
    V.pos.addScaledVector(V1, -V.speed * dt * 3); V.speed *= 0.3; V.vel.multiplyScalar(-0.3); V.bumped = V.t; break; } } }
  if (V.landing) V.landing += dt;
}
function land(V) { if (V.fly && !V.landing) V.landing = 1e-3; }
/** The final resting place: the prop's box follows the group. */
function park(V) { V.speed = 0; V.pitch = 0; V.roll = 0; V.landing = 0; V.airborne = false; place(V); V.prop.x = V.pos.x; V.prop.y = V.pos.y - V.K.hover * V.M; V.prop.z = V.pos.z; V.prop.yaw = V.heading / (Math.PI / 2); V.group.updateMatrixWorld(true); V.prop.box = new THREE.Box3().setFromObject(V.group); }
function camera(V, cam, dt, portrait) {
  const c = V.cam, M = V.M, fast = clamp(Math.abs(V.speed) / (V.K.boost * M), 0, 1);
  const wantD = (V.fly ? (portrait ? 15 : 13) : (portrait ? 10 : 8.5)) * M + fast * 3 * M, wantH = (V.fly ? 4 : 3) * M + fast * M;
  if (!c.set) { c.dist = wantD; c.high = wantH; }
  c.dist += (wantD - c.dist) * (1 - Math.exp(-dt * 2)); c.high += (wantH - c.high) * (1 - Math.exp(-dt * 2));
  V1.set(Math.sin(V.heading), 0, Math.cos(V.heading));
  V2.copy(V.pos).addScaledVector(V1, -c.dist).addScaledVector(UP, c.high);
  const gy = V.groundH(V2.x, V2.z) + 0.7 * M; if (V2.y < gy) V2.y = gy;
  const look = V3.copy(V.pos).addScaledVector(V1, 6 * M); look.y += 0.8 * M;
  if (!c.set) { cam.position.copy(V2); c.look.copy(look); c.set = true; }
  cam.position.lerp(V2, 1 - Math.exp(-dt * 5)); c.look.lerp(look, 1 - Math.exp(-dt * 7));
  cam.up.copy(UP); cam.lookAt(c.look);
  const fov = (portrait ? 58 : 52) + fast * 8; if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
}
window.Drive = { KINDS, kindOf, create, step, land, park, camera, forward };
})();
