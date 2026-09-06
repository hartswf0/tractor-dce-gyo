/* world/debris.js — loose LEGO pieces with real contacts, GPU-instanced.

   One InstancedMesh per part type with a free-list of slots. A piece is an
   oriented box: it lands on its lowest corner, bounces and scrubs, lands on
   roofs and on other resting pieces so piles build, bounces off walls, and
   when it slows it squares up to the nearest right angle and rests. Fast
   pieces hitting a wall chew more bricks out of it. Units: LDU, M per metre. */
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const CAP = 600, REST_LIFE = 60, CELL = 40;                                  // a 1 m hash cell
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), Q1 = new THREE.Quaternion(), M1 = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];
const CORNERS = [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]];

class Debris {
  constructor({ scene, M, groundH, aabbs, onWallHit }) {
    this.scene = scene; this.M = M; this.groundH = groundH; this.aabbs = aabbs; this.onWallHit = onWallHit;
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .6, metalness: 0 });
    this.kinds = new Map(); this.pieces = []; this.rest = new Map(); this.grav = 9.8 * M; this.spawned = 0;
  }
  /** Register a part: geom in its own local frame; the box is its bounding box. */
  register(name, geom, cap = CAP) {
    if (this.kinds.has(name)) return this.kinds.get(name);
    geom.computeBoundingBox(); const bb = geom.boundingBox, half = new THREE.Vector3(), centre = new THREE.Vector3(); bb.getSize(half).multiplyScalar(0.5); bb.getCenter(centre);
    if (!geom.attributes.color) { const n = geom.attributes.position.count, c = new Float32Array(n * 3).fill(1); geom.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
    const im = new THREE.InstancedMesh(geom, this.mat, cap); im.frustumCulled = false; im.name = 'debris:' + name; im.count = cap;
    for (let i = 0; i < cap; i++) im.setMatrixAt(i, ZERO); im.setColorAt(0, new THREE.Color(1, 1, 1)); im.instanceMatrix.needsUpdate = true;
    this.scene.add(im);
    const k = { name, im, half, centre, free: Array.from({ length: cap }, (_, i) => cap - 1 - i), r: half.length() }; this.kinds.set(name, k); return k;
  }
  /** matrix: world transform of the part's local frame; vel/ang in LDU/s and rad/s. */
  spawn({ part, matrix, colour, vel, ang }) {
    const k = this.kinds.get(part); if (!k) return null;
    if (!k.free.length) { const old = this.pieces.find(p => p.kind === k); if (old) this.kill(old); else return null; }
    const slot = k.free.pop();
    const p = { kind: k, slot, pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scl: new THREE.Vector3(), vel: vel ? vel.clone() : new THREE.Vector3(), ang: ang ? ang.clone() : new THREE.Vector3((Math.random() - .5) * 6, (Math.random() - .5) * 6, (Math.random() - .5) * 6), rest: false, settling: 0, age: 0, restAge: 0, aabb: null, cells: [] };
    matrix.decompose(p.pos, p.quat, p.scl);
    k.im.setColorAt(slot, colour || new THREE.Color(1, 1, 1)); k.im.instanceColor.needsUpdate = true;
    this.pieces.push(p); this.spawned++; this.write(p); return p;
  }
  kill(p) { const k = p.kind; k.im.setMatrixAt(p.slot, ZERO); k.im.instanceMatrix.needsUpdate = true; k.free.push(p.slot); this.unhash(p); const i = this.pieces.indexOf(p); if (i >= 0) this.pieces.splice(i, 1); }
  clear() { for (const p of this.pieces.slice()) this.kill(p); }
  write(p) { const k = p.kind; M1.compose(p.pos, p.quat, p.scl); k.im.setMatrixAt(p.slot, M1); k.im.instanceMatrix.needsUpdate = true; }
  centre(p, out) { return out.copy(p.kind.centre).multiply(p.scl).applyQuaternion(p.quat).add(p.pos); }
  /** World AABB of a piece from its eight corners. */
  box(p) {
    const k = p.kind, c = this.centre(p, V1), h = k.half, b = new THREE.Box3();
    for (const [sx, sy, sz] of CORNERS) { V2.set(sx * h.x * p.scl.x, sy * h.y * p.scl.y, sz * h.z * p.scl.z).applyQuaternion(p.quat).add(c); b.expandByPoint(V2); }
    return b;
  }
  key(x, z) { return Math.floor(x / CELL) + ':' + Math.floor(z / CELL); }
  hash(p) { const b = p.aabb; p.cells = []; for (let x = Math.floor(b.min.x / CELL); x <= Math.floor(b.max.x / CELL); x++) for (let z = Math.floor(b.min.z / CELL); z <= Math.floor(b.max.z / CELL); z++) { const key = x + ':' + z; let a = this.rest.get(key); if (!a) { a = []; this.rest.set(key, a); } a.push(p); p.cells.push(key); } }
  unhash(p) { for (const key of p.cells) { const a = this.rest.get(key); if (a) { const i = a.indexOf(p); if (i >= 0) a.splice(i, 1); if (!a.length) this.rest.delete(key); } } p.cells = []; }
  /** The floor under a point: the ground, a roof the point is over, or a resting piece below it. */
  floorAt(x, z, y, self) {
    let f = this.groundH(x, z);
    for (const b of this.aabbs(x, z, 60)) if (x > b.min.x && x < b.max.x && z > b.min.z && z < b.max.z && b.max.y <= y + 6 && b.max.y > f) f = b.max.y;
    const a = this.rest.get(this.key(x, z)); if (a) for (const q of a) { if (q === self) continue; const bb = q.aabb; if (x > bb.min.x && x < bb.max.x && z > bb.min.z && z < bb.max.z && bb.max.y <= y + 6 && bb.max.y > f) f = bb.max.y; }
    return f;
  }
  step(dt) {
    const M = this.M, moving = new Map();
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i]; p.age += dt;
      if (p.rest) { p.restAge += dt; if (p.restAge > REST_LIFE) { p.scl.multiplyScalar(Math.max(0, 1 - dt * 2)); this.write(p); if (p.scl.x < 0.05) this.kill(p); } continue; }
      if (p.settling) { p.settling += dt; const u = clamp(p.settling / 0.3, 0, 1); p.quat.slerp(p.target, u); if (u >= 1) { p.quat.copy(p.target); this.land(p); } this.write(p); continue; }
      p.vel.y -= this.grav * dt; p.pos.addScaledVector(p.vel, dt);
      const w = p.ang.length(); if (w > 1e-4) { Q1.setFromAxisAngle(V3.copy(p.ang).divideScalar(w), w * dt); p.quat.premultiply(Q1); }
      // the lowest corner meets the floor
      const c = this.centre(p, V1), h = p.kind.half; let low = Infinity, lx = 0, lz = 0;
      for (const [sx, sy, sz] of CORNERS) { V2.set(sx * h.x * p.scl.x, sy * h.y * p.scl.y, sz * h.z * p.scl.z).applyQuaternion(p.quat).add(c); if (V2.y < low) { low = V2.y; lx = V2.x; lz = V2.z; } }
      const floor = this.floorAt(lx, lz, low, p);
      if (low < floor) {
        p.pos.y += floor - low;
        if (p.vel.y < 0) p.vel.y = -p.vel.y * 0.3; p.vel.x *= 0.6; p.vel.z *= 0.6; p.ang.multiplyScalar(0.5);
        p.ang.x += (c.z - lz) * 0.02; p.ang.z -= (c.x - lx) * 0.02;                   // it topples toward the corner it landed on
        if (p.vel.length() < 0.4 * M && p.ang.length() < 1) { p.settling = 1e-3; p.target = this.squared(p.quat); p.vel.set(0, 0, 0); p.ang.set(0, 0, 0); }
      }
      // walls: push out of a building's box and bounce; fast pieces knock bricks out
      const r = p.kind.r * 0.7;
      for (const b of this.aabbs(c.x, c.z, 80)) {
        if (c.x < b.min.x - r || c.x > b.max.x + r || c.z < b.min.z - r || c.z > b.max.z + r || c.y < b.min.y || c.y > b.max.y - 4) continue;
        const dx = Math.min(c.x - b.min.x + r, b.max.x + r - c.x), dz = Math.min(c.z - b.min.z + r, b.max.z + r - c.z);
        const speed = p.vel.length();
        if (dx < dz) { const s = c.x - (b.min.x + b.max.x) / 2 < 0 ? -1 : 1; p.pos.x += s * dx; if (p.vel.x * s < 0) p.vel.x = -p.vel.x * 0.3; }
        else { const s = c.z - (b.min.z + b.max.z) / 2 < 0 ? -1 : 1; p.pos.z += s * dz; if (p.vel.z * s < 0) p.vel.z = -p.vel.z * 0.3; }
        if (speed > 6 * M && this.onWallHit) this.onWallHit(c.clone(), p.vel.clone().multiplyScalar(0.5));
        p.vel.multiplyScalar(0.8);
      }
      // moving pieces push each other apart a little
      const key = this.key(c.x, c.z); let a = moving.get(key); if (!a) { a = []; moving.set(key, a); }
      for (const q of a) { const qc = this.centre(q, V2), d = V3.subVectors(c, qc), L = d.length(), want = (p.kind.r + q.kind.r) * 0.6; if (L > 1e-3 && L < want) { d.divideScalar(L); const push = (want - L) * 0.5; p.pos.addScaledVector(d, push); q.pos.addScaledVector(d, -push); p.vel.addScaledVector(d, 30); q.vel.addScaledVector(d, -30); } }
      a.push(p);
      if (p.age > 20 && p.vel.length() < 2 * M) { p.settling = 1e-3; p.target = this.squared(p.quat); p.vel.set(0, 0, 0); p.ang.set(0, 0, 0); }   // never falls forever
      this.write(p);
    }
  }
  /** The nearest right-angled orientation to a quaternion. */
  squared(q) {
    M1.makeRotationFromQuaternion(q); const e = M1.elements;
    const cols = [new THREE.Vector3(e[0], e[1], e[2]), new THREE.Vector3(e[4], e[5], e[6])];
    const snap = v => { let best = AXES[0], bd = -2; for (const a of AXES) { const d = v.dot(a); if (d > bd) { bd = d; best = a; } } return best.clone(); };
    const x = snap(cols[0]); let y = snap(cols[1]); if (Math.abs(x.dot(y)) > 0.5) { y = snap(new THREE.Vector3().crossVectors(new THREE.Vector3(0, 0, 1), x)); if (Math.abs(x.dot(y)) > 0.5) y = snap(new THREE.Vector3().crossVectors(x, new THREE.Vector3(1, 0, 0))); }
    const z = new THREE.Vector3().crossVectors(x, y);
    M1.makeBasis(x, y, z); return new THREE.Quaternion().setFromRotationMatrix(M1);
  }
  land(p) { p.settling = 0; p.rest = true; p.aabb = this.box(p); const c = this.centre(p, V1), floor = this.floorAt(c.x, c.z, p.aabb.min.y, p); p.pos.y += floor - p.aabb.min.y; p.aabb = this.box(p); this.hash(p); this.write(p); }
  stats() { let rest = 0; for (const p of this.pieces) if (p.rest) rest++; return { pieces: this.pieces.length, rest, spawned: this.spawned, kinds: this.kinds.size }; }
}
window.Debris = { Debris, CAP };
})();
