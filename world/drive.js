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
  car: { cruise: 14, boost: 22, turn: 1.8, fly: false, hover: 0, ram: 1, accel: 7, grip: 9, wheels: true },
  truck: { cruise: 10, boost: 15, turn: 1.3, fly: false, hover: 0, ram: 1.5, accel: 4, grip: 6, wheels: true },
  boat: { cruise: 8, boost: 12, turn: 1.2, fly: false, hover: 0, ram: 0.8, accel: 3, grip: 4 },
  speeder: { cruise: 15, boost: 30, turn: 2.0, fly: true, hover: 0.6, ram: 0.8, stall: 0 },
  plane: { cruise: 20, boost: 40, turn: 1.6, fly: true, hover: 0, ram: 1, stall: 8 },
  craft: { cruise: 18, boost: 32, turn: 1.8, fly: true, hover: 0.5, ram: 1, stall: 0 },  // any build the player chose to fly: it hovers like a speeder
  bus: { cruise: 11, boost: 16, turn: 1.1, fly: false, hover: 0, ram: 1.8, accel: 3.5, grip: 5, wheels: true },
  rover: { cruise: 13, boost: 20, turn: 1.7, fly: false, hover: 0, ram: 1.2, accel: 6, grip: 8 },
  atat: { cruise: 4, boost: 7, turn: 0.5, fly: false, hover: 0, ram: 2.5, walker: true, legs: 4, stride: 7, amp: 0.3, camD: 30, camH: 22, lookY: 14, gunY: 15.2, gunAhead: 8, gunDown: 0.3 },    // an Imperial walker: slow, tall, guns in the head
  atst: { cruise: 7, boost: 11, turn: 1.1, fly: false, hover: 0, ram: 1.6, walker: true, legs: 2, stride: 4, amp: 0.45, camD: 18, camH: 12, lookY: 8, gunY: 8.3, gunAhead: 4, gunDown: 0.2 },
};
const kindOf = it => { const src = it && it.src; if (!src) return 'car'; if (src.ride) return src.ride === 'fly' ? 'craft' : 'rover'; if (String(src.op) === 'kit') return KINDS[src.kind] ? src.kind : 'rover'; if (String(src.op) === 'walker') return String(src.kind || 'atat').toLowerCase() === 'atst' ? 'atst' : 'atat'; const k = String(src.kind || 'car').toLowerCase(); return KINDS[k] ? k : 'car'; };

/** Board a prop. prop: the Props item (group, box, yaw). */
function create({ prop, M, groundH, aabbs }) {
  const kind = kindOf(prop), K = KINDS[kind], b = prop.box;
  const r = b ? Math.max(0.5 * M, Math.hypot(b.max.x - b.min.x, b.max.z - b.min.z) * 0.35) : M;
  const V = {
    prop, group: prop.group, kind, K, fly: K.fly, M, groundH, aabbs, r,
    pos: prop.group.position.clone(), heading: prop.yaw * Math.PI / 2, pitch: 0, roll: 0, speed: 0, vel: new THREE.Vector3(), alt: 0,
    input: { x: 0, y: 0, mag: 0, boost: false }, landing: 0, airborne: false, t: 0, bumped: 0, lastRam: -9,
    cam: { look: new THREE.Vector3(), set: false, dist: 0, high: 0 },
    hx: b ? Math.max(0.4 * M, Math.min(b.max.x - b.min.x, b.max.z - b.min.z) / 2) : M, hz: b ? Math.max(0.6 * M, Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2) : 1.5 * M,   // half width and half length, for the wheels' four corners
    bob: 0, phase: 0, stomps: 0, legs: null, steer: 0, slip: 0, lean: 0, nose: 0, skids: 0, wheelSpin: 0, wheelSet: null,
  };
  V.pos.y = groundH(V.pos.x, V.pos.z) + K.hover * M;
  return V;
}
function forward(V, out) { return out.set(Math.sin(V.heading) * Math.cos(V.pitch), Math.sin(V.pitch), Math.cos(V.heading) * Math.cos(V.pitch)); }
function place(V) { V.group.position.copy(V.pos); V.group.position.y += V.bob || 0; V.group.rotation.set(0, 0, 0, 'YXZ'); V.group.rotation.y = V.heading; if (V.fly) { V.group.rotateX(-V.pitch); V.group.rotateZ(-V.roll); } else { V.group.rotateX(-V.pitch - (V.nose || 0)); V.group.rotateZ(V.roll + (V.lean || 0)); } }
/** The ground under the four corners: the vehicle's height, pitch and roll, so the wheels (or feet) stay on it. */
function settle(V, k = 1) {
  const s = Math.sin(V.heading), c = Math.cos(V.heading), hx = V.hx, hz = V.hz, g = V.groundH;
  const f = g(V.pos.x + s * hz, V.pos.z + c * hz), b = g(V.pos.x - s * hz, V.pos.z - c * hz), l = g(V.pos.x + c * hx, V.pos.z - s * hx), r = g(V.pos.x - c * hx, V.pos.z + s * hx);
  V.pitch = Math.atan2(f - b, 2 * hz) * k; V.roll = Math.atan2(l - r, 2 * hx) * k;
  return (f + b + l + r) / 4;
}

/** One step. ctx: { blast(point, r, vel, kind), knock(centre, r, vel), pushOut(pos, r) → moved? , sfx: { crunch(), thud(k) } } */
function step(V, dt, ctx) {
  V.t += dt; const M = V.M, K = V.K, i = V.input;
  if (V.fly) stepFly(V, dt, ctx); else stepDrive(V, dt, ctx);
  place(V);
  return !V.done;
}
function stepDrive(V, dt, ctx) {
  const M = V.M, K = V.K, i = V.input;
  const max = (i.boost ? K.boost : K.cruise) * M, want = i.y * (i.y >= 0 ? max : max * 0.5);
  // throttle, brakes, drag: the stick against the motion brakes hard, an idle stick coasts
  const sp0 = V.speed, braking = i.y !== 0 && Math.sign(want) !== Math.sign(V.speed) && Math.abs(V.speed) > 0.05 * M, a = (braking ? 12 : i.y ? (K.accel || 6) : 8) * M;   // an idle stick coasts to a stop in a couple of seconds
  if (braking || !i.y) V.speed += clamp(-V.speed, -a * dt, a * dt); else V.speed += clamp(want - V.speed, -a * dt, a * dt);
  V.nose += ((V.speed - sp0) / dt / (10 * M) * 0.05 - V.nose) * (1 - Math.exp(-dt * 4));                        // the nose lifts under throttle, dips under the brakes
  // steering by the front wheels: a bicycle model, tighter when slow, wider when fast; over the grip the rest is a slide
  const sp = Math.abs(V.speed), dMax = 0.55 * clamp(1 - sp / ((K.boost || 20) * M * 1.3), 0.35, 1), L = Math.max(1.2 * M, 1.4 * V.hz);
  V.steer += (-i.x * dMax - V.steer) * (1 - Math.exp(-dt * 8));
  const yawWant = sp > 0.1 * M ? V.speed / L * Math.tan(V.steer) : 0, aLat = V.speed * V.speed * Math.abs(Math.tan(V.steer)) / L, grip = (K.grip || 8) * M;
  const yawMax = aLat > grip && sp > 1 ? Math.abs(yawWant) * grip / aLat : Math.abs(yawWant);
  const yawRate = clamp(yawWant, -yawMax, yawMax); V.heading += yawRate * dt;
  if (aLat > grip && sp > 3 * M) { V.slip += (yawWant - yawRate) * dt; if (Math.abs(V.slip) > 0.06 && V.t - (V.lastSkid || -9) > 0.4) { V.lastSkid = V.t; V.skids++; if (ctx && ctx.skid) ctx.skid(V); } }
  V.slip -= V.slip * Math.min(1, dt * 3); V.slip = clamp(V.slip, -0.6, 0.6);
  V.lean += (-Math.sign(V.steer) * Math.min(1, aLat / grip) * 0.08 * Math.sign(V.speed) - V.lean) * (1 - Math.exp(-dt * 5));
  const h0 = V.heading; V.heading -= V.slip; forward(V, V1); V.heading = h0;                                   // the velocity lags the body by the slip angle
  V.pos.addScaledVector(V1, V.speed * dt); V.vel.copy(V1).multiplyScalar(V.speed);
  if (K.wheels) wheels(V, dt);
  const gh = settle(V, K.walker ? 0.5 : 1); V.pos.y = gh + K.hover * M;
  if (K.walker) gait(V, dt, ctx);
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
  const target = V.landing ? (hover ? 0 : 3 * M) : (i.boost ? K.boost : K.cruise) * M * (hover ? clamp(i.mag * 1.4, 0, 1) : (V.airborne || i.mag > 0.1 ? 1 : 0));
  V.speed += (target - V.speed) * (1 - Math.exp(-dt * (V.landing ? 1.4 : 2.2)));
  V.heading -= i.x * K.turn * g * dt;
  const wantPitch = V.landing ? 0 : clamp(i.y * (hover ? 0.3 : 0.55), -0.55, 0.55);
  V.pitch += (wantPitch - V.pitch) * (1 - Math.exp(-dt * (hover ? 6 : 2.6)));                                     // a speeder levels off as soon as the thumb lets go
  V.roll += (-i.x * 0.5 - V.roll) * (1 - Math.exp(-dt * 3));
  forward(V, V1); V.vel.copy(V1).multiplyScalar(V.speed);
  if (hover && !V.landing) V.vel.y += 6 * M * i.y;                                                                 // a speeder climbs while the thumb pushes up, sinks while it pulls back, holds its height between
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
/** The wheels spin with the road and the front pair steers: the sub-models on the axle pins (found by their place, the loader drops their names). */
function wheels(V, dt) {
  if (!V.wheelSet) { V.wheelSet = []; const wrap = V.group.children[0] || V.group; for (const o of wrap.children) { if (!o.isGroup || Math.abs(o.position.x) < 20 || Math.abs(o.position.y + 18) > 6) continue; o.userData.front = o.position.z < 0; V.wheelSet.push(o); } }
  V.wheelSpin += V.speed * dt / 18;                                                                               // a 3641 tyre is 18 LDU to the tread
  for (const w of V.wheelSet) w.rotation.set(-V.wheelSpin, w.userData.front ? V.steer : 0, 0, 'YXZ');
}
/** A walker's legs swing with its speed: opposite legs together, the body bobs, a stomp on every footfall. */
function gait(V, dt, ctx) {
  const K = V.K, M = V.M;
  if (!V.legs) {   // a kit names its legs; the DSL's sub-models sit under the prop's wrap without names, so there a leg is the one set off sideways from the spine
    V.legs = []; V.group.traverse(o => { if (o.isGroup && /^leg-/i.test(o.name)) V.legs.push(o); });
    const wrap = V.group.children[0] || V.group;
    if (!V.legs.length) for (const o of wrap.children) { if (!o.isGroup || Math.abs(o.position.x) < 1) continue; const fl = o.position.z < -1, rl = o.position.z > 1, left = o.position.x < 0; o.name = K.legs === 4 ? (fl ? (left ? 'leg-fl.ldr' : 'leg-fr.ldr') : (left ? 'leg-rl.ldr' : 'leg-rr.ldr')) : (left ? 'leg-l.ldr' : 'leg-r.ldr'); V.legs.push(o); }
    V.legs.sort((a, b) => a.name < b.name ? -1 : 1);
  }
  const sp = Math.abs(V.speed) / M, stride = K.stride || 4, before = V.phase; V.phase += (V.speed / M) / stride * 2 * Math.PI * dt;
  const amp = (K.amp || 0.35) * clamp(sp / 1.5, 0, 1), off = K.legs === 4 ? { 'leg-fl.ldr': 0, 'leg-fr.ldr': Math.PI, 'leg-rl.ldr': Math.PI, 'leg-rr.ldr': 0 } : { 'leg-l.ldr': 0, 'leg-r.ldr': Math.PI };
  for (const g of V.legs) g.rotation.x = amp * Math.sin(V.phase + (off[g.name.toLowerCase().replace(/\.ldr$/, '') + '.ldr'] || 0));
  V.bob = Math.abs(Math.sin(V.phase)) * 0.12 * M * clamp(sp / 1.5, 0, 1);
  if (sp > 0.5 && Math.floor(V.phase / Math.PI) !== Math.floor(before / Math.PI)) { V.stomps++; if (ctx && ctx.stomp) ctx.stomp(V); }
}
function land(V) { if (V.fly && !V.landing) V.landing = 1e-3; }
/** The final resting place: the prop's box follows the group. */
function park(V) { V.speed = 0; if (V.fly) { V.pitch = 0; V.roll = 0; } V.landing = 0; V.airborne = false; V.bob = 0; V.nose = 0; V.lean = 0; V.slip = 0; V.steer = 0; if (V.wheelSet) for (const w of V.wheelSet) w.rotation.y = 0; if (V.legs) for (const g of V.legs) g.rotation.x = 0; place(V); V.prop.x = V.pos.x; V.prop.y = V.pos.y - V.K.hover * V.M; V.prop.z = V.pos.z; V.prop.yaw = V.heading / (Math.PI / 2); V.group.updateMatrixWorld(true); V.prop.box = new THREE.Box3().setFromObject(V.group); }
function camera(V, cam, dt, portrait) {
  const c = V.cam, M = V.M, fast = clamp(Math.abs(V.speed) / (V.K.boost * M), 0, 1);
  const wantD = (V.K.camD || (V.fly ? (portrait ? 15 : 13) : (portrait ? 10 : 8.5))) * M + fast * 3 * M, wantH = (V.K.camH || (V.fly ? 4 : 3)) * M + fast * M;
  if (!c.set) { c.dist = wantD; c.high = wantH; }
  c.dist += (wantD - c.dist) * (1 - Math.exp(-dt * 2)); c.high += (wantH - c.high) * (1 - Math.exp(-dt * 2));
  V1.set(Math.sin(V.heading), 0, Math.cos(V.heading));
  V2.copy(V.pos).addScaledVector(V1, -c.dist).addScaledVector(UP, c.high);
  const gy = V.groundH(V2.x, V2.z) + 0.7 * M; if (V2.y < gy) V2.y = gy;
  const look = V3.copy(V.pos).addScaledVector(V1, 6 * M); look.y += (V.K.lookY || 0.8) * M;
  if (!c.set) { cam.position.copy(V2); c.look.copy(look); c.set = true; }
  cam.position.lerp(V2, 1 - Math.exp(-dt * 5)); c.look.lerp(look, 1 - Math.exp(-dt * 7));
  cam.up.copy(UP); cam.lookAt(c.look);
  const fov = (portrait ? 58 : 52) + fast * 8; if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
}
window.Drive = { KINDS, kindOf, create, step, land, park, camera, forward, settle, gait, wheels };
})();
