/* world/tie.js — TIE-3's flight over a real world.

   The momentum model, the single floating stick, the Vader slide, the swept
   collisions and the chase camera are TIE-3's (tie-3.html lines 47–65), with
   the flat GROUND replaced by the heightfield and the corridor obstacles by
   the city's building boxes. Bolts and rams knock bricks out of buildings. */
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const CRUISE = 500, BOOST = 930, PLAYER_R = 130, CEIL_M = 220, BOLT_SPD = 2200, BOLT_LIFE = 1.4, BOLT_N = 24, SHIELD_MAX = 100;
const UP = new THREE.Vector3(0, 1, 0), Z1 = new THREE.Vector3(0, 0, 1);
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), DESIRE = new THREE.Vector3(), TRAVEL = new THREE.Vector3(), RIGHT = new THREE.Vector3();
const Q1 = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), E1 = new THREE.Euler();
const lerpAngle = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; };

function create({ ship, M, groundH, aabbs, scene, onImpact }) {
  const F = {
    ship, M, groundH, aabbs, scene, onImpact,
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), prevPos: new THREE.Vector3(), quat: new THREE.Quaternion(),
    travelYaw: 0, travelPitch: 0, yaw: 0, pitch: 0, roll: 0, speed: 0, slide: 0, wasBoost: false, t: 0,
    shields: SHIELD_MAX, lastImpact: -9, impact: { text: '', until: 0 }, flying: false, landing: 0,
    input: { x: 0, y: 0, mag: 0, boost: false, fire: false, torpedo: false }, fireAcc: 1, muzzle: 0, torps: [],
    cam: { dist: 560, high: 145, side: 0, look: new THREE.Vector3(), set: false, fov: 61 },
    bolts: [], hits: 0,
  };
  const geo = new THREE.BoxGeometry(5, 5, 60), mat = new THREE.MeshBasicMaterial({ color: 0x2fbf3f, fog: false });
  for (let i = 0; i < BOLT_N; i++) { const m = new THREE.Mesh(geo, mat); m.visible = false; m.frustumCulled = false; scene.add(m); F.bolts.push({ mesh: m, vel: new THREE.Vector3(), prev: new THREE.Vector3(), life: 0 }); }
  const tg = new THREE.CylinderGeometry(6, 6, 50, 8), tm = new THREE.MeshBasicMaterial({ color: 0xff3020, fog: false }); tg.rotateX(Math.PI / 2);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(tg, tm); m.visible = false; m.frustumCulled = false; scene.add(m); F.torps.push({ mesh: m, vel: new THREE.Vector3(), prev: new THREE.Vector3(), life: 0 }); }
  return F;
}
function fromVel(F) { const v = F.vel; if (v.lengthSq() < 1) return; F.travelYaw = Math.atan2(v.x, v.z); F.travelPitch = Math.atan2(v.y, Math.hypot(v.x, v.z)); }

/** Lift off from where the ship stands, heading the way it faces. */
function board(F, heading) {
  F.flying = true; F.landing = 0; F.shields = SHIELD_MAX;
  F.pos.copy(F.ship.position); F.pos.y += 2 * F.M; F.prevPos.copy(F.pos);
  F.travelYaw = heading; F.travelPitch = 0.22; F.yaw = heading; F.pitch = 0; F.roll = 0;
  F.vel.set(Math.sin(heading), 0.25, Math.cos(heading)).normalize().multiplyScalar(120); F.speed = 120;
  F.cam.set = false;
}

function stepFlight(F, dt) {
  const i = F.input, g = .18 + .82 * i.mag * i.mag, M = F.M;
  F.prevPos.copy(F.pos);
  F.travelYaw -= i.x * 2.05 * g * dt;
  F.travelPitch = clamp(F.travelPitch + i.y * 1.55 * g * dt, -1.02, 1.02);
  const alt = F.pos.y - F.groundH(F.pos.x, F.pos.z);
  if (i.mag < .08 && alt < 850) F.travelPitch += (0 - F.travelPitch) * (1 - Math.exp(-dt * .55));
  Q1.setFromEuler(E1.set(-F.travelPitch, F.travelYaw, 0, 'YXZ'));
  DESIRE.set(0, 0, 1).applyQuaternion(Q1).normalize();
  let sp = Math.max(1, F.vel.length()), target = F.landing ? 0 : i.boost ? BOOST : CRUISE;
  sp += (target - sp) * (1 - Math.exp(-dt * (F.landing ? 1.6 : 2.8)));
  V1.copy(F.vel).normalize();
  const ang = Math.acos(clamp(V1.dot(DESIRE), -1, 1)), maxTurn = (.42 + g * .88) * 2.05 * dt;
  if (ang > 1e-5) { Q1.setFromUnitVectors(V1, DESIRE); Q2.identity().slerp(Q1, Math.min(1, maxTurn / ang)); V1.applyQuaternion(Q2).normalize(); }
  F.vel.copy(V1).multiplyScalar(sp); F.speed = sp;
  F.wasBoost = i.boost;
  const slide = (i.boost && i.mag > .82 && Math.abs(i.x) > .55) ? 1 : 0;
  F.slide += (slide - F.slide) * (1 - Math.exp(-dt * 6.5));
  const vyaw = Math.atan2(V1.x, V1.z), vpitch = Math.atan2(V1.y, Math.hypot(V1.x, V1.z)), faceYaw = vyaw - i.x * (.23 + .72 * F.slide), facePitch = clamp(vpitch + i.y * .08, -1.02, 1.02);
  F.yaw = lerpAngle(F.yaw, faceYaw, 1 - Math.exp(-dt * 5.8));
  F.pitch += (facePitch - F.pitch) * (1 - Math.exp(-dt * 5.8));
  F.roll += (i.x * 1.02 - F.roll) * (1 - Math.exp(-dt * 7.5));
  F.quat.setFromEuler(E1.set(-F.pitch, F.yaw, F.roll, 'YXZ'));
  F.pos.addScaledVector(F.vel, dt);
  if (F.pos.y - F.groundH(F.pos.x, F.pos.z) > CEIL_M * M) { F.pos.y = F.groundH(F.pos.x, F.pos.z) + CEIL_M * M; F.vel.y = Math.min(F.vel.y, -40); fromVel(F); }
}

/* ───────────────────────── contacts (tie-3's sweeps) ───────────────────────── */
function impact(F, label, dmg, point, sev) {
  if (F.t - F.lastImpact < .14) return; F.lastImpact = F.t;
  F.shields = Math.max(0, F.shields - dmg); F.impact.text = `${label} · −${Math.round(dmg)} shield`; F.impact.until = F.t + 1.15;
  if (F.onImpact) F.onImpact(point, sev, label);
}
function ground(F) {
  const M = F.M, gh = F.groundH(F.pos.x, F.pos.z), clear = 1.8 * M;
  if (F.pos.y - gh >= clear) return;
  const closing = Math.max(0, -F.vel.y);
  F.pos.y = gh + clear + 1; F.vel.y = Math.abs(F.vel.y) * .18 + 38; F.vel.x *= .82; F.vel.z *= .82;
  const hit = Math.max(closing, F.speed * .18);
  impact(F, hit > 360 ? 'GROUND IMPACT' : 'GROUND SCRAPE', clamp((hit - 65) * .105, 4, 68), V3.copy(F.pos).setY(gh), hit / 300);
  fromVel(F);
}
const SW = { t: 0, n: new THREE.Vector3(), p: new THREE.Vector3() };
function sweepBox(a, b, box, r, out) {              // segment a→b vs an AABB grown by r: slab method
  let t0 = 0, t1 = 1, axis = -1, sign = 0;
  const d = V2.subVectors(b, a);
  for (const k of ['x', 'y', 'z']) {
    const lo = box.min[k] - r, hi = box.max[k] + r;
    if (Math.abs(d[k]) < 1e-6) { if (a[k] < lo || a[k] > hi) return false; continue; }
    let tl = (lo - a[k]) / d[k], th = (hi - a[k]) / d[k], s = -1; if (tl > th) { const tmp = tl; tl = th; th = tmp; s = 1; }
    if (tl > t0) { t0 = tl; axis = k; sign = s; } if (th < t1) t1 = th;
    if (t0 > t1) return false;
  }
  if (axis === -1) { out.t = 0; out.n.set(0, 1, 0); out.p.copy(a); return true; }   // started inside
  out.t = t0; out.n.set(0, 0, 0); out.n[axis] = sign; out.p.copy(a).addScaledVector(d, t0); return true;
}
function worldHit(F) {
  const boxes = F.aabbs(F.pos.x, F.pos.z, 700), r = PLAYER_R * .72; let best = null;
  for (const box of boxes) if (sweepBox(F.prevPos, F.pos, box, r, SW) && (!best || SW.t < best.t)) best = { t: SW.t, n: SW.n.clone(), p: SW.p.clone() };
  if (!best) return;
  const n = best.n, closing = Math.max(0, -F.vel.dot(n));
  F.pos.copy(best.p).addScaledVector(n, PLAYER_R * .74 + 5 - r);
  const vn = F.vel.dot(n); V1.copy(F.vel).addScaledVector(n, -vn);            // tangential
  F.vel.copy(V1).multiplyScalar(.62).addScaledVector(n, closing * .24 + 28);
  if (F.vel.length() < 145) F.vel.setLength(145);
  impact(F, closing > 330 ? 'STRUCTURE HIT' : 'CLIP', clamp((closing - 45) * .13, 5, 62), best.p, closing / 300);
  fromVel(F);
}

/* ───────────────────────── bolts ───────────────────────── */
const MUZZLE = [new THREE.Vector3(-16, -12, 144), new THREE.Vector3(16, -12, 144)];
function fire(F) {
  if (F.fireAcc < 1 / (F.input.boost ? 12 : 8)) return; F.fireAcc = 0;                // strafing: faster while boosting
  const b = F.bolts.find(b => b.life <= 0); if (!b) return;
  V1.copy(MUZZLE[F.muzzle ^= 1]).applyQuaternion(F.quat).add(F.pos); V2.set(0, 0, 1).applyQuaternion(F.quat);
  b.life = BOLT_LIFE; b.mesh.position.copy(V1); b.prev.copy(V1); b.vel.copy(V2).multiplyScalar(BOLT_SPD).add(F.vel); b.mesh.quaternion.copy(Q1.setFromUnitVectors(Z1, V2)); b.mesh.visible = true;
}
/** A torpedo: slow, heavy, and it makes a crater wherever it meets anything. */
function torpedo(F) {
  const t = F.torps.find(t => t.life <= 0); if (!t) return;
  V1.set(0, -24, 120).applyQuaternion(F.quat).add(F.pos); V2.set(0, 0, 1).applyQuaternion(F.quat);
  t.life = 4; t.mesh.position.copy(V1); t.prev.copy(V1); t.vel.copy(V2).multiplyScalar(900).add(F.vel.clone().multiplyScalar(0.5)); t.mesh.quaternion.copy(F.quat); t.mesh.visible = true;
}
function stepTorps(F, dt, onBlast) {
  for (const t of F.torps) {
    if (t.life <= 0) continue;
    t.prev.copy(t.mesh.position); t.mesh.position.addScaledVector(t.vel, dt); t.vel.y -= 120 * dt;
    if ((t.life -= dt) <= 0) { t.mesh.visible = false; continue; }
    const p = t.mesh.position; let hit = null;
    if (p.y < F.groundH(p.x, p.z)) hit = p.clone().setY(F.groundH(p.x, p.z));
    else for (const box of F.aabbs(p.x, p.z, 300)) if (sweepBox(t.prev, p, box, 6, SW)) { hit = SW.p.clone(); break; }
    if (hit) { t.life = 0; t.mesh.visible = false; if (onBlast) onBlast(hit, t.vel.clone()); }
  }
}
function stepBolts(F, dt, onBoltHit) {
  F.fireAcc += dt; if (F.input.fire) fire(F);
  if (F.input.torpedo) { F.input.torpedo = false; torpedo(F); }
  for (const b of F.bolts) {
    if (b.life <= 0) continue;
    b.prev.copy(b.mesh.position); b.mesh.position.addScaledVector(b.vel, dt);
    if ((b.life -= dt) <= 0) { b.mesh.visible = false; continue; }
    const p = b.mesh.position;
    if (p.y < F.groundH(p.x, p.z)) { b.life = 0; b.mesh.visible = false; continue; }
    for (const box of F.aabbs(p.x, p.z, 200)) if (sweepBox(b.prev, p, box, 4, SW)) { b.life = 0; b.mesh.visible = false; F.hits++; if (onBoltHit) onBoltHit(SW.p.clone()); break; }
  }
}

/** One flight frame. Returns true while still flying; false once a landing has finished. */
function step(F, dt, onBoltHit, onTorpedo) {
  F.t += dt;
  stepFlight(F, dt); ground(F); worldHit(F);
  stepBolts(F, dt, onBoltHit); stepTorps(F, dt, onTorpedo);
  F.ship.position.copy(F.pos); F.ship.quaternion.copy(F.quat);
  if (F.landing) {
    F.landing += dt; const gh = F.groundH(F.pos.x, F.pos.z);
    F.travelPitch = Math.max(F.travelPitch - 0.6 * dt, -0.35); F.roll *= 0.9;
    if (F.speed < 40 || F.pos.y - gh < 2 * F.M + 3) {
      F.flying = false; F.ship.position.set(F.pos.x, gh + 120 + 2, F.pos.z);
      F.ship.quaternion.setFromEuler(E1.set(0, F.yaw, 0, 'YXZ')); return false;
    }
  }
  return true;
}
function land(F) { if (!F.landing) F.landing = 1e-3; }

function camera(F, cam, dt, portrait) {
  const c = F.cam, spd = clamp((F.speed - CRUISE) / (BOOST - CRUISE), 0, 1), M = F.M;
  const wantD = (portrait ? 560 : 470) + spd * 115, wantH = (portrait ? 145 : 120) + spd * 22;
  c.dist += (wantD - c.dist) * (1 - Math.exp(-dt * 2.2)); c.high += (wantH - c.high) * (1 - Math.exp(-dt * 2.6));
  c.side += (-F.input.x * (72 + 70 * F.slide) - c.side) * (1 - Math.exp(-dt * 2.8));
  Q1.setFromEuler(E1.set(-F.travelPitch, F.travelYaw, 0, 'YXZ')); TRAVEL.set(0, 0, 1).applyQuaternion(Q1); RIGHT.set(1, 0, 0).applyQuaternion(Q1);
  V1.copy(F.pos).addScaledVector(TRAVEL, -c.dist).addScaledVector(UP, c.high).addScaledVector(RIGHT, c.side);
  const gy = F.groundH(V1.x, V1.z) + 0.8 * M; if (V1.y < gy) V1.y = gy;
  V2.copy(F.pos).addScaledVector(TRAVEL, 480 + spd * 170); V2.y += 18;
  if (!c.set) { cam.position.copy(V1); c.look.copy(V2); c.set = true; }
  cam.position.lerp(V1, 1 - Math.exp(-dt * 5)); c.look.lerp(V2, 1 - Math.exp(-dt * 7.4));
  cam.up.copy(UP); cam.lookAt(c.look);
  const near = clamp(1 - (F.pos.y - F.groundH(F.pos.x, F.pos.z)) / 900, 0, 1), fov = (portrait ? 61 : 56) + spd * 11 + near * 2;
  if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
}

window.Tie = { create, board, step, land, camera, fire, torpedo, CRUISE, BOOST, PLAYER_R, SHIELD_MAX };
})();
