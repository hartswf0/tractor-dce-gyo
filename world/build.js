/* world/build.js — building with real bricks, on the stud grid, anywhere in the world.

   A palette of parts from the pack; a reticle ray finds what you are looking at
   (a placed brick, a building, the ground); the ghost snaps to studs and plates
   there — on top to stack, beside to extend — and a tap places it. Placed bricks
   are instanced per part, solid to feet and bolts, breakable like any wall, and
   they fall when what held them up is gone. Every piece has an id, so builds
   merge per brick between players and persist per place in the browser.

   Frames: in memory everything is window-local LDU (x east, z south, y up from
   the window's datum). Rows for saving and sending are anchor-local: x/z from
   the place's anchor (lat/lon rounded to 3 decimals) and y in absolute LDU
   above sea level, so a different GPS fix still loads the build in its spot. */
(function () {
'use strict';
const STUD = 20, PLATE = 8, CAP = 4096, CELL = 80, REACH = 30, MAX_PIECES = 20000;
const PARTS = [
  ['3001', 'brick 2×4'], ['3010', 'brick 1×4'], ['3004', 'brick 1×2'], ['3020', 'plate 2×4'], ['3032', 'plate 4×6'], ['3039', 'slope'],
  ['3068b', 'tile 2×2'], ['87079', 'tile 2×4'], ['3941', 'round 2×2'], ['3062b', 'round 1×1'], ['60592', 'window'], ['60623', 'door'],
  ['3003', 'brick 2×2'], ['3005', 'brick 1×1'], ['3022', 'plate 2×2'], ['3040b', 'slope 1×2'], ['3455', 'arch 1×6'], ['3823', 'windscreen'],
];
/** Parts the master builder may use that are not on the palette strip. */
const HIDDEN = ['3023', '3024', '3665a', '4600', '4624', '3641', '3829c01', '3009', '3008', '2453b', '3185', '4589'];
const COLOURS = [4, 1, 14, 2, 15, 0, 71, 72, 19, 25, 70, 322];
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), UP = new THREE.Vector3(0, 1, 0);
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), Q1 = new THREE.Quaternion(), M1 = new THREE.Matrix4(), B1 = new THREE.Box3(), RAY = new THREE.Raycaster();
const snap = (v, step, off = 0) => Math.round((v - off) / step) * step + off;

class Build {
  /** geoms: Map part → { geom (origin bottom centre, Y up), size }; colours(code) → linear THREE.Color */
  /** geoms: Map part → { geom (origin kept, bottom at 0, Y up), bb: [x0, x1, z0, z1, h] }; ghost: a see-through draft copy. */
  constructor({ scene, M, geoms, colours, groundH, buildings, rings, ghost = false, cap = CAP }) {
    this.scene = scene; this.M = M; this.colours = colours; this.groundH = groundH; this.buildings = buildings; this.rings = rings; this.isGhost = ghost; this.cap = cap;
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .5, metalness: 0, transparent: ghost, opacity: ghost ? 0.55 : 1, depthWrite: !ghost });
    this.kinds = new Map(); this.pieces = new Map(); this.cells = new Map(); this.history = [];
    for (const [part, name] of PARTS) { const g = geoms.get(part); if (g) this.register(part, g.geom, g.bb, name); }
    for (const part of HIDDEN) { const g = geoms.get(part); if (g) this.register(part, g.geom, g.bb, part); }
    this.ghost = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x2fbf3f, transparent: true, opacity: .55, depthWrite: false, roughness: .6 }));
    this.ghost.visible = false; this.ghost.frustumCulled = false; scene.add(this.ghost);
    this.part = '3001'; this.col = 4; this.rot = 0; this.lift = 0; this.pick = false; this.aimed = null; this.target = null;
    this.frame = { ax: 0, az: 0, datum: 0 }; this.key = null; this.onEdit = null; this.saveT = 0; this.dirty = false; this.pid = Build.pid();
    this.next = 0; try { this.next = +(localStorage.getItem('world.build.n') || 0); } catch (e) { }
  }
  static pid() { let p = null; try { p = localStorage.getItem('world.pid'); if (!p) { p = Math.random().toString(36).slice(2, 8); localStorage.setItem('world.pid', p); } } catch (e) { p = p || Math.random().toString(36).slice(2, 8); } return p; }
  /** A part becomes placeable: one InstancedMesh; bb in the part's own frame. */
  register(part, geom, bb, name) {
    if (this.kinds.has(part)) return this.kinds.get(part);
    if (!bb) { geom.computeBoundingBox(); const b = geom.boundingBox; bb = [b.min.x, b.max.x, b.min.z, b.max.z, b.max.y]; }
    const cap = this.cap, im = new THREE.InstancedMesh(geom, this.mat, cap); im.frustumCulled = false; im.name = (this.isGhost ? 'draft:' : 'build:') + part; im.count = 0;   // count grows with the high-water slot: empty slots cost nothing
    for (let i = 0; i < cap; i++) im.setMatrixAt(i, ZERO); im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3); im.instanceMatrix.needsUpdate = true;   // r128 sizes the colour buffer from count, so make it ourselves
    this.scene.add(im); const k = { part, name: name || part, geom, bb, im, free: Array.from({ length: cap }, (_, i) => cap - 1 - i) }; this.kinds.set(part, k);
    if (this.onKind) this.onKind(part, geom); return k;
  }
  /** The part's box for a rotation, relative to its origin: [x0, x1, z0, z1, h] (LDU). */
  ext(part, rot) { const k = this.kinds.get(part); const [x0, x1, z0, z1, h] = k ? k.bb : [-10, 10, -10, 10, 24]; switch (rot & 3) { case 1: return [z0, z1, -x1, -x0, h]; case 2: return [-x1, -x0, -z1, -z0, h]; case 3: return [-z1, -z0, x0, x1, h]; default: return [x0, x1, z0, z1, h]; } }
  boxOf(p) { const e = this.ext(p.part, p.rot); return new THREE.Box3(new THREE.Vector3(p.x + e[0], p.y, p.z + e[2]), new THREE.Vector3(p.x + e[1], p.y + e[4], p.z + e[3])); }

  /* ───── the frame: anchor and datum ───── */
  setFrame({ ax, az, datum }) { this.frame = { ax, az, datum }; }
  toRow(p) { const f = this.frame; return [p.id, p.part, p.col, Math.round(p.x - f.ax), Math.round(p.y + f.datum), Math.round(p.z - f.az), p.rot]; }
  fromRow(r) { const f = this.frame; return { id: r[0], part: r[1], col: r[2], x: r[3] + f.ax, y: r[4] - f.datum, z: r[5] + f.az, rot: r[6] | 0, op: r[7] == null ? -1 : r[7] | 0 }; }

  /* ───── the store ───── */
  cellKey(x, z) { return Math.floor(x / CELL) + ':' + Math.floor(z / CELL); }
  hash(p) { const b = p.box; p.cells = []; for (let x = Math.floor(b.min.x / CELL); x <= Math.floor(b.max.x / CELL); x++) for (let z = Math.floor(b.min.z / CELL); z <= Math.floor(b.max.z / CELL); z++) { const k = x + ':' + z; let a = this.cells.get(k); if (!a) { a = []; this.cells.set(k, a); } a.push(p); p.cells.push(k); } }
  unhash(p) { for (const k of p.cells) { const a = this.cells.get(k); if (a) { const i = a.indexOf(p); if (i >= 0) a.splice(i, 1); if (!a.length) this.cells.delete(k); } } p.cells = []; }
  /** Pieces whose cells touch the box (may repeat). */
  around(box, pad = 0) { const out = new Set(); for (let x = Math.floor((box.min.x - pad) / CELL); x <= Math.floor((box.max.x + pad) / CELL); x++) for (let z = Math.floor((box.min.z - pad) / CELL); z <= Math.floor((box.max.z + pad) / CELL); z++) { const a = this.cells.get(x + ':' + z); if (a) for (const p of a) out.add(p); } return out; }
  nearPoint(x, z, r) { B1.min.set(x - r, -1e9, z - r); B1.max.set(x + r, 1e9, z + r); return this.around(B1); }
  /** Add a piece (already in window frame). Returns it, or null when the slot is full or the id exists. */
  add(p, quiet) {
    if (this.pieces.has(p.id)) return null; const k = this.kinds.get(p.part); if (!k || !k.free.length) return null;
    if (this.pieces.size >= MAX_PIECES) return null;
    p.slot = k.free.pop(); p.box = this.boxOf(p); p.cells = []; if (p.op == null) p.op = -1; if (p.slot + 1 > k.im.count) k.im.count = p.slot + 1;
    Q1.setFromAxisAngle(UP, p.rot * Math.PI / 2); M1.compose(V1.set(p.x, p.y, p.z), Q1, V2.set(1, 1, 1));
    k.im.setMatrixAt(p.slot, M1); k.im.setColorAt(p.slot, this.colours(p.col)); k.im.instanceMatrix.needsUpdate = true; k.im.instanceColor.needsUpdate = true;
    this.pieces.set(p.id, p); this.hash(p); if (!quiet) this.dirty = true; return p;
  }
  /** Remove a piece; returns what fell (part, matrix, colour) for the debris, or null. */
  take(id, quiet) {
    const p = this.pieces.get(id); if (!p) return null; const k = this.kinds.get(p.part);
    k.im.setMatrixAt(p.slot, ZERO); k.im.instanceMatrix.needsUpdate = true; k.free.push(p.slot);
    this.pieces.delete(id); this.unhash(p); if (!quiet) this.dirty = true;
    Q1.setFromAxisAngle(UP, p.rot * Math.PI / 2); return { part: 'b:' + p.part, matrix: new THREE.Matrix4().compose(V1.set(p.x, p.y, p.z), Q1, V2.set(1, 1, 1)), colour: this.colours(p.col), id, rot: p.rot };
  }
  clear() { for (const id of [...this.pieces.keys()]) this.take(id, true); this.history.length = 0; this.dirty = true; }

  /* ───── placing ───── */
  /** The player's act: place the ghost's part where it stands. Returns the piece or null (blocked). */
  place() {
    const t = this.target; if (!t || t.blocked) return null;
    const p = this.add({ id: this.pid + '-' + (++this.next), part: this.part, col: this.col, x: t.x, y: t.y, z: t.z, rot: this.rot });
    if (!p) return null; try { localStorage.setItem('world.build.n', String(this.next)); } catch (e) { }
    this.history.push(p.id); if (this.history.length > 200) this.history.shift(); this.lift = 0;
    if (this.onEdit) this.onEdit({ up: [this.toRow(p)] }); return p;
  }
  /** Bulk placement of rows (anchor frame) with fresh ids of ours. Returns the pieces added. */
  addRows(rows, quiet, local) {
    const out = [];
    for (const r of rows) { const p = local ? { part: r[1], col: r[2], x: r[3], y: r[4], z: r[5], rot: r[6] | 0, op: r[7] == null ? -1 : r[7] | 0 } : this.fromRow(r); p.id = this.pid + '-' + (++this.next); const q = this.add(p, quiet); if (q) out.push(q); }
    try { localStorage.setItem('world.build.n', String(this.next)); } catch (e) { }
    if (!quiet && out.length && this.onEdit) this.onEdit({ up: out.map(p => this.toRow(p)) });
    return out;
  }
  /** Move every piece (drafts): dx, dy, dz in LDU. */
  shift(dx, dy, dz) { const all = [...this.pieces.values()].map(p => ({ id: p.id, part: p.part, col: p.col, x: p.x + dx, y: p.y + dy, z: p.z + dz, rot: p.rot })); for (const p of all) this.take(p.id, true); for (const p of all) this.add(p, true); }
  /** Turn every piece a quarter turn about a pivot (drafts). */
  turn(px, pz) { const all = [...this.pieces.values()].map(p => ({ id: p.id, part: p.part, col: p.col, x: px + (p.z - pz), y: p.y, z: pz - (p.x - px), rot: (p.rot + 1) & 3 })); for (const p of all) this.take(p.id, true); for (const p of all) this.add(p, true); }
  /** Is anything of this build inside another piece, a building or the ground? For drafts. */
  blockedCount(other) { let n = 0; for (const p of this.pieces.values()) { const b = p.box; if (other) for (const q of other.around(b)) if (q.box.intersectsBox(b)) { n++; break; } } return n; }
  /** Undo the last placement of this session (if it still stands). */
  undo() { while (this.history.length) { const id = this.history.pop(); if (this.pieces.has(id)) { this.remove(id); return id; } } return null; }
  /** Pick a piece up (no debris): removes it and whatever it held up falls. Returns the fallen pieces. */
  remove(id) { const f = this.take(id); if (!f) return []; if (this.onEdit) this.onEdit({ rm: [id] }); return this.settle(f); }
  /** Whatever rested on a removed piece and has nothing else under it now falls: returns fallen pieces (part, matrix, colour, vel). */
  settle(f) {
    const out = [], queue = [f]; const M = this.M;
    while (queue.length) {
      const g = queue.shift();
      const pos = new THREE.Vector3().setFromMatrixPosition(g.matrix), e = this.ext(String(g.part).replace(/^b:/, ''), g.rot || 0);
      const top = pos.y + e[4]; B1.min.set(pos.x + e[0], top - 2, pos.z + e[2]); B1.max.set(pos.x + e[1], top + 2, pos.z + e[3]);
      for (const q of this.around(B1)) {
        if (Math.abs(q.box.min.y - top) > 2 || q.box.max.x <= B1.min.x || q.box.min.x >= B1.max.x || q.box.max.z <= B1.min.z || q.box.min.z >= B1.max.z) continue;
        if (this.supported(q)) continue;
        const fell = this.take(q.id); if (!fell) continue; fell.rot = q.rot; fell.vel = new THREE.Vector3((Math.random() - .5) * M, -0.5 * M, (Math.random() - .5) * M);
        if (this.onEdit) this.onEdit({ rm: [q.id] }); out.push(fell); queue.push(fell);
      }
    }
    return out;
  }
  /** Held up by the ground, a roof, or a piece whose top meets its bottom with a stud of overlap. */
  supported(p) {
    const b = p.box, y = b.min.y;
    for (const [cx, cz] of [[b.min.x + 4, b.min.z + 4], [b.max.x - 4, b.min.z + 4], [b.max.x - 4, b.max.z - 4], [b.min.x + 4, b.max.z - 4], [(b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2]]) if (this.groundH(cx, cz) >= y - 6) return true;
    for (const bb of this.buildings((b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2, 40)) if (Math.abs(bb.max.y - y) < 6 && b.max.x > bb.min.x && b.min.x < bb.max.x && b.max.z > bb.min.z && b.min.z < bb.max.z) return true;
    for (const q of this.around(b)) { if (q === p || Math.abs(q.box.max.y - y) > 2) continue; if (Math.min(q.box.max.x, b.max.x) - Math.max(q.box.min.x, b.min.x) >= STUD - 1 && Math.min(q.box.max.z, b.max.z) - Math.max(q.box.min.z, b.min.z) >= STUD - 1) return true; }
    return false;
  }
  /** Everything within r of a point flies (for blasts): returns fallen pieces with velocities, and drops what they held. */
  blast(pt, r, vel) {
    const out = [], M = this.M; B1.min.set(pt.x - r, pt.y - r, pt.z - r); B1.max.set(pt.x + r, pt.y + r, pt.z + r);
    for (const p of this.around(B1)) {
      const c = p.box.getCenter(V1); if (c.distanceTo(pt) > r) continue;
      const f = this.take(p.id); if (!f) continue; f.rot = p.rot;
      const away = c.clone().sub(pt); away.y += 10; if (away.lengthSq() < 1) away.set(Math.random() - .5, 1, Math.random() - .5);
      away.normalize().multiplyScalar((2 + Math.random() * 6) * M); if (vel) away.add(vel); away.y += 1.5 * M; f.vel = away;
      if (this.onEdit) this.onEdit({ rm: [p.id] }); out.push(f);
    }
    for (const f of out.slice()) out.push(...this.settle(f));
    return out;
  }

  /* ───── the reticle: what you are looking at, and where the ghost goes ───── */
  aim(camera, portrait) {
    if (!this.on) { this.ghost.visible = false; this.target = null; this.aimed = null; return; }
    if (this.pin) return this.aimRay(this.pin.origin, this.pin.dir);          // a test's fixed ray
    RAY.setFromCamera({ x: 0, y: portrait ? -0.12 : -0.05 }, camera); this.aimRay(RAY.ray.origin, RAY.ray.direction);
  }
  /** Where the ghost goes for a ray (the reticle's, or a test's). */
  aimRay(origin, dir) {
    const ray = new THREE.Ray(origin, dir), reach = REACH * this.M;
    let best = null;
    const tryBox = (box, kind, piece) => { const hit = ray.intersectBox(box, V3); if (!hit) return; const t = hit.distanceTo(ray.origin); if (t > reach || (best && t >= best.t)) return; best = { t, p: hit.clone(), box, kind, piece, face: faceOf(hit, box) }; };
    B1.min.set(ray.origin.x - reach, -1e9, ray.origin.z - reach); B1.max.set(ray.origin.x + reach, 1e9, ray.origin.z + reach);
    for (const p of this.around(B1)) tryBox(p.box, 'piece', p);
    for (const box of this.buildings(ray.origin.x, ray.origin.z, reach)) tryBox(box, 'building', null);
    // the ground: march, then bisect
    let t0 = 0, t1 = null; for (let t = 0.4 * this.M; t <= reach; t += 0.4 * this.M) { V1.copy(ray.origin).addScaledVector(ray.direction, t); if (V1.y < this.groundH(V1.x, V1.z)) { t1 = t; break; } t0 = t; }
    if (t1 !== null && (!best || t1 < best.t)) { for (let i = 0; i < 6; i++) { const tm = (t0 + t1) / 2; V1.copy(ray.origin).addScaledVector(ray.direction, tm); if (V1.y < this.groundH(V1.x, V1.z)) t1 = tm; else t0 = tm; } V1.copy(ray.origin).addScaledVector(ray.direction, t1); best = { t: t1, p: V1.clone(), kind: 'ground', face: 'top' }; }
    this.aimed = best;
    if (!best) { this.ghost.visible = false; this.target = null; return; }
    const e = this.ext(this.part, this.rot), f = this.frame, hx = (e[1] - e[0]) / 2, hz = (e[3] - e[2]) / 2;   // the part's box; its origin may sit off-centre
    let cx = best.p.x, cz = best.p.z, y;                                                                          // where the box's centre wants to be
    if (best.face === 'top') y = best.kind === 'ground' ? best.p.y : best.box.max.y;
    else if (best.face === 'bottom') y = best.box.min.y - e[4];
    else { y = best.box.min.y; if (best.face === 'x-') cx = best.box.min.x - hx; else if (best.face === 'x+') cx = best.box.max.x + hx; else if (best.face === 'z-') cz = best.box.min.z - hz; else cz = best.box.max.z + hz; }
    const x = snap(cx - hx - f.ax, STUD) + f.ax - e[0], z = snap(cz - hz - f.az, STUD) + f.az - e[2];             // snap the box's corner to the studs, then place the origin
    y = snap(y + f.datum, PLATE) - f.datum + this.lift * PLATE;
    if (best.kind === 'ground' && y < best.p.y - 4) y += PLATE;
    const box = new THREE.Box3(new THREE.Vector3(x + e[0] + 1, y + 1, z + e[2] + 1), new THREE.Vector3(x + e[1] - 1, y + e[4] - 1, z + e[3] - 1));
    let blocked = false;
    for (const q of this.around(box)) if (q.box.intersectsBox(box)) { blocked = true; break; }
    if (!blocked) for (const bb of this.buildings(x, z, 40)) if (box.intersectsBox(bb)) { blocked = true; break; }
    if (!blocked && this.rings) for (const b of this.rings(x, z)) if (y < b.yTop - 4 && Bricks.pointInRing(x, z, b.ringL)) { blocked = true; break; }
    this.target = { x, y, z, blocked, kind: best.kind };
    const g = this.ghost, k = this.kinds.get(this.part);
    if (g.geometry !== k.geom) g.geometry = k.geom;
    g.position.set(x, y, z); g.rotation.set(0, this.rot * Math.PI / 2, 0); g.material.color.set(blocked ? 0xd8382e : 0x2fbf3f); g.visible = !this.pick;
  }
  /** The piece under the reticle (for picking up). */
  aimedPiece() { return this.aimed && this.aimed.kind === 'piece' ? this.aimed.piece : null; }

  /* ───── walking on and into builds ───── */
  /** Highest piece top under (x, z) no higher than yMax; −Infinity when none. */
  floorAt(x, z, yMax) { let f = -Infinity; const a = this.cells.get(this.cellKey(x, z)); if (a) for (const p of a) { const b = p.box; if (x > b.min.x && x < b.max.x && z > b.min.z && z < b.max.z && b.max.y <= yMax && b.max.y > f) f = b.max.y; } return f; }
  /** Push a body (feet at pos.y, radius r, height hgt) out of pieces too tall to step onto. */
  pushOut(pos, r, hgt, step = 30) {
    for (const p of this.nearPoint(pos.x, pos.z, r)) {
      const b = p.box; if (b.max.y <= pos.y + step || b.min.y >= pos.y + hgt) continue;
      const cx = Math.max(b.min.x, Math.min(pos.x, b.max.x)), cz = Math.max(b.min.z, Math.min(pos.z, b.max.z)), dx = pos.x - cx, dz = pos.z - cz, d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d < 1e-3) { const ex = Math.min(pos.x - b.min.x, b.max.x - pos.x), ez = Math.min(pos.z - b.min.z, b.max.z - pos.z); if (ex < ez) pos.x = pos.x - b.min.x < b.max.x - pos.x ? b.min.x - r : b.max.x + r; else pos.z = pos.z - b.min.z < b.max.z - pos.z ? b.min.z - r : b.max.z + r; }
      else { pos.x = cx + dx / d * r; pos.z = cz + dz / d * r; }
    }
  }
  /** Boxes of pieces near a point, for ships, bolts and debris. */
  aabbs(x, z, r) { const out = []; for (const p of this.nearPoint(x, z, r)) out.push(p.box); return out; }

  /* ───── merge, save, load ───── */
  /** Per-id merge: remove, then upsert. Rows are anchor-frame. Returns { added, removed }. */
  applyOps({ up, rm }) {
    let added = 0, removed = 0;
    if (rm) for (const id of rm) if (this.take(id, true)) removed++;
    if (up) for (const r of up) { const p = this.fromRow(r); if (this.pieces.has(p.id)) { const q = this.pieces.get(p.id); if (q.part === p.part && q.col === p.col && q.x === p.x && q.y === p.y && q.z === p.z && q.rot === p.rot) continue; this.take(p.id, true); } if (this.add(p, true)) added++; }
    if (added || removed) this.dirty = true; return { added, removed };
  }
  rows() { return [...this.pieces.values()].map(p => this.toRow(p)); }
  /** Light the pieces a predicate picks (their own colour) and dim the rest; null restores every colour. */
  highlight(pred) {
    let n = 0; const dim = new THREE.Color(0.35, 0.35, 0.38);
    for (const p of this.pieces.values()) { const k = this.kinds.get(p.part); if (!k) continue; const on = !pred || pred(p); if (pred && on) n++; k.im.setColorAt(p.slot, on ? this.colours(p.col) : dim); k.im.instanceColor.needsUpdate = true; }
    this.lit = pred ? n : 0; return n;
  }
  highlighted() { return this.lit || 0; }
  /** Lay rows over time, lowest first: pieces per second, with onTick(piece, i, n) for a sound. Rooms get the rows at once through addRows; this is only what the eye sees. */
  animate(rows, { perSecond = 40, maxSeconds = 15, onTick, quiet, local } = {}) {
    const sorted = rows.slice().sort((a, b) => a[4] - b[4] || (a[7] | 0) - (b[7] | 0) || a[5] - b[5] || a[3] - b[3]);
    const rate = Math.max(perSecond, sorted.length / maxSeconds); this.queue = { rows: sorted, i: 0, acc: 0, rate, onTick, quiet, local, out: [] };
    return this.queue;
  }
  stepQueue(dt) {
    const q = this.queue; if (!q) return; q.acc += dt * q.rate;
    while (q.i < q.rows.length && q.acc >= 1) { const r = q.rows[q.i++]; q.acc -= 1; const p = q.local ? { part: r[1], col: r[2], x: r[3], y: r[4], z: r[5], rot: r[6] | 0, op: r[7] == null ? -1 : r[7] | 0 } : this.fromRow(r); p.id = r[0]; const added = this.add(p, true); if (added) { q.out.push(added); if (q.onTick) q.onTick(added, q.i, q.rows.length); } }
    if (q.i >= q.rows.length) { this.queue = null; if (q.done) q.done(q.out); }
  }
  laying() { return this.queue ? { i: this.queue.i, n: this.queue.rows.length } : null; }
  storageKey() { return this.key ? 'world.build.' + this.key : null; }
  load(key) {
    this.key = key; this.clear(); this.dirty = false;
    try { const s = localStorage.getItem(this.storageKey()); if (s) { const d = JSON.parse(s); if (d && d.pieces) for (const r of d.pieces) this.add(this.fromRow(r), true); } } catch (e) { console.warn('build load', e); }
    return this.pieces.size;
  }
  save() {
    const k = this.storageKey(); if (!k) return false; this.dirty = false;
    try { localStorage.setItem(k, JSON.stringify({ v: 1, t: Date.now(), pieces: this.rows() })); return true; } catch (e) { console.warn('build save', e); return false; }
  }
  forget() { const k = this.storageKey(); this.clear(); this.dirty = false; try { if (k) localStorage.removeItem(k); } catch (e) { } }
  /** Debounced save, from the loop. */
  tick(dt) { this.stepQueue(dt); if (this.dirty) { this.saveT += dt; if (this.saveT > 0.5) { this.saveT = 0; this.save(); } } else this.saveT = 0; }
  stats() { return { pieces: this.pieces.size, kinds: this.kinds.size, on: !!this.on, part: this.part, col: this.col, rot: this.rot, target: this.target && { x: this.target.x, y: this.target.y, z: this.target.z, blocked: this.target.blocked, kind: this.target.kind } }; }
}
function faceOf(p, b) {
  const d = [['x-', p.x - b.min.x], ['x+', b.max.x - p.x], ['bottom', p.y - b.min.y], ['top', b.max.y - p.y], ['z-', p.z - b.min.z], ['z+', b.max.z - p.z]];
  d.sort((a, c) => a[1] - c[1]); return d[0][0];
}
window.Build = { PARTS, HIDDEN, COLOURS, STUD, PLATE, Build };
})();
