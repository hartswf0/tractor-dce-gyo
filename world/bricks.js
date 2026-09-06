/* world/bricks.js — a city rebuilt from LEGO bricks, GPU-instanced.

   Real building footprints become running-bond courses of bricks with window
   bands, a door and a plate roof, one InstancedMesh per part per 100 m tile.
   Tiles near the player are bricks; tiles far away are one merged prism mesh.
   A hard cap on live instances keeps a dense city inside a phone's budget.
   Units: metres in, LDU (M per metre) out. A course is 24 LDU. */
(function () {
'use strict';
const COURSE = 24, TILE_M = 100, CAP = 120000, NEAR_IN = 230, NEAR_OUT = 270, FRAME_LOD = 120;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Wall bricks without studs (every stud in a wall is covered), each with a face plate standing 0.6 LDU
   proud of the body and inset 1.5 LDU from the edges: the body around it is baked darker, so every
   brick shows its mortar line at no draw cost. Plus a window pane and a roof plate with cheap studs. */
function wallBrick(name, desc, a, b) {              // a: half length (x), b: half depth (z); LDraw y runs 0 (top) to 24
  const X = a - 1.5, zf = -(b + 0.6), zb = b + 0.6;
  return [name, desc, [`1 16 0 12 0 ${a} 0 0 0 12 0 0 0 ${b} box.dat`,
    `4 16 ${X} 1.5 ${zf} ${-X} 1.5 ${zf} ${-X} 22.5 ${zf} ${X} 22.5 ${zf}`,
    `4 16 ${-X} 1.5 ${zb} ${X} 1.5 ${zb} ${X} 22.5 ${zb} ${-X} 22.5 ${zb}`]];
}
const CUSTOM = [
  wallBrick('wall-2x8.dat', 'Wall Brick 2 x 8 (no studs)', 80, 20),
  wallBrick('wall-2x4.dat', 'Wall Brick 2 x 4 (no studs)', 40, 20),
  wallBrick('wall-2x2.dat', 'Wall Brick 2 x 2 (no studs)', 20, 20),
  wallBrick('wall-1x2.dat', 'Wall Brick 1 x 2 (no studs)', 20, 10),
  ['pane-1x2x2.dat', 'Window Pane 1 x 2 x 2', ['1 16 0 24 0 20 0 0 0 24 0 0 0 5 box.dat']],
  ['roof-2x4.dat', 'Roof Plate 2 x 4', ['1 16 0 4 0 40 0 0 0 4 0 0 0 20 box.dat',
    ...[-30, -10, 10, 30].flatMap(x => [-10, 10].map(z => `1 16 ${x} 0 ${z} 1 0 0 0 1 0 0 0 1 8\\stud.dat`))]],
].map(([name, desc, lines]) => `0 FILE ${name}\n0 ${desc}\n0 Name: ${name}\n0 !LDRAW_ORG Unofficial_Part\n0 BFC CERTIFY CCW\n${lines.join('\n')}\n`).join('');
const HARVEST = ['wall-2x8.dat', 'wall-2x4.dat', 'wall-2x2.dat', 'wall-1x2.dat', 'pane-1x2x2.dat', 'roof-2x4.dat', 'parts/3068b.dat', 'parts/60592.dat', 'parts/60623.dat', 'parts/3001.dat', 'parts/3020.dat'];
const KEY = f => f.replace(/^parts\//, '').replace(/\.dat$/, '');
const lines = () => HARVEST.map(f => `1 16 0 0 0 1 0 0 0 1 0 0 0 1 ${f}`).join('\n');

/* ───────────────────────── harvest: one geometry per part, origin at the bottom centre, Y up ───────────────────────── */
const FLIP = new THREE.Matrix4().makeRotationX(Math.PI);
function harvest(groups) {
  const geoms = new Map();
  groups.forEach((grp, i) => {
    let mesh = null; grp.traverse(o => { if (!mesh && o.isMesh) mesh = o; });
    if (!mesh) throw new Error('no mesh for ' + HARVEST[i]);
    const g = mesh.geometry.clone(); g.clearGroups(); g.applyMatrix4(FLIP);
    g.computeBoundingBox(); const bb = g.boundingBox;
    g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    g.computeBoundingBox(); const sz = new THREE.Vector3(); g.boundingBox.getSize(sz);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), hx = sz.x / 2 - 0.5, wall = HARVEST[i].startsWith('wall-'), plateZ = sz.z / 2 - 0.3;
    for (let k = 0; k < p.count; k++) {           // the mortar: a wall brick's body is dark, its face plates bright; other parts darken only at the foot
      const v = wall ? (Math.abs(p.getZ(k)) >= plateZ ? 1 : p.getY(k) > sz.y - 0.5 ? 0.9 : 0.7) : (p.getY(k) < 2 ? 0.78 : Math.abs(p.getX(k)) > hx ? 0.92 : 1);
      col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = v;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeBoundingSphere();
    geoms.set(KEY(HARVEST[i]), { geom: g, size: sz, tris: p.count / 3 });
  });
  return geoms;
}

/* ───────────────────────── footprint → bricks ───────────────────────── */
const WALLS = [19, 4, 15, 72, 379, 70, 28, 84], ROOFS = [320, 72, 308, 71], PLINTH = 72, FRAME = 15, DOOR = 70, PANE = 0;
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const TMP = new THREE.Matrix4(), TQ = new THREE.Quaternion(), TP = new THREE.Vector3(), TS = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
function place(out, part, x, y, z, theta, c) { TQ.setFromAxisAngle(UP, theta); TP.set(x, y, z); out.push({ p: part, m: new THREE.Matrix4().compose(TP, TQ, TS), c }); }
function pointInRing(x, z, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}
function buildBricks(b, colours, M) {
  const out = [], ring = b.ringL, n = ring.length, wall = colours(b.wall), plinthC = colours(PLINTH), frameC = colours(b.wall === 15 ? 0 : FRAME), paneC = colours(PANE), doorC = colours(DOOR), roofC = colours(b.roof);
  const cx = ring.reduce((s, p) => s + p.x, 0) / n, cz = ring.reduce((s, p) => s + p.z, 0) / n;
  const edges = [];
  for (let i = 0; i < n; i++) {
    const A = ring[i], B = ring[(i + 1) % n], dx = B.x - A.x, dz = B.z - A.z, L0 = Math.hypot(dx, dz); if (L0 < 20) continue;
    const ux = dx / L0, uz = dz / L0; let nx = -uz, nz = ux;
    if ((cx - (A.x + B.x) / 2) * nx + (cz - (A.z + B.z) / 2) * nz < 0) { nx = -nx; nz = -nz; }   // inward
    edges.push({ A, ux, uz, nx, nz, L: Math.floor(L0 / 20) * 20, theta: Math.atan2(-uz, ux) });
  }
  if (!edges.length) return { list: out, n: 0 };
  const doorK = edges.reduce((k, e, i) => e.L > edges[k].L ? i : k, 0);
  const plinth = Math.ceil(b.drop / COURSE), total = Math.max(2, Math.round(b.h * M / COURSE) + plinth), bigDoor = total - plinth >= 7;
  const put = (e, part, s, len, y, c, rot90, inset = 20) => place(out, part, e.A.x + e.ux * (s + len / 2) + e.nx * inset, y, e.A.z + e.uz * (s + len / 2) + e.nz * inset, e.theta + (rot90 ? Math.PI / 2 : 0), c);
  for (let c = 0; c < total; c++) {
    const y = b.y0 + c * COURSE, col = c < plinth ? plinthC : wall, k = c - plinth - 1, band = k >= 0 && k % 3 < 2, lower = k % 3 === 0;
    edges.forEach((e, ei) => {
      const slots = [], doorHere = ei === doorK && c >= plinth && (bigDoor ? c < plinth + 6 : c < plinth + 2);
      const dS = e.L / 2 - 20;
      if (doorHere) { slots.push([dS, dS + 40]); if (c === plinth) { if (bigDoor) put(e, '60623', dS, 40, y, doorC, false, 14); else { put(e, '60592', dS, 40, y, colours(0), false, 20); put(e, 'pane-1x2x2', dS, 40, y, paneC, false, 26); } } }
      if (band && e.L >= 200) for (let s = 60; s + 40 <= e.L - 40; s += 160) {
        if (doorHere && s < dS + 40 && s + 40 > dS) continue;
        slots.push([s, s + 40]);
        if (lower) { put(e, '60592', s, 40, y, frameC, false, 20); put(e, 'pane-1x2x2', s, 40, y, paneC, false, 26); }
      }
      slots.sort((p, q) => p[0] - q[0]);
      let s = 0; const runs = [];
      for (const [a0, a1] of slots) { if (a0 > s) runs.push([s, a0]); s = Math.max(s, a1); }
      if (s < e.L) runs.push([s, e.L]);
      for (const [g0, g1] of runs) {
        let p = g0;
        if ((c & 1) && g0 === 0 && g1 - g0 >= 40) { put(e, 'wall-2x2', p, 40, y, col); p += 40; }
        while (g1 - p >= 160) { put(e, 'wall-2x8', p, 160, y, col); p += 160; }
        while (g1 - p >= 80) { put(e, 'wall-2x4', p, 80, y, col); p += 80; }
        while (g1 - p >= 40) { put(e, 'wall-2x2', p, 40, y, col); p += 40; }
        if (g1 - p >= 20) { put(e, 'wall-1x2', p, 20, y, col, true); p += 20; }
      }
    });
  }
  // the roof: plates on a grid aligned to the longest edge, kept where the cell centre is inside
  const yTop = b.y0 + total * COURSE, e0 = edges[doorK], ux = e0.ux, uz = e0.uz;
  const loc = ring.map(p => ({ x: (p.x - cx) * ux + (p.z - cz) * uz, z: -(p.x - cx) * uz + (p.z - cz) * ux }));
  let lx0 = Infinity, lx1 = -Infinity, lz0 = Infinity, lz1 = -Infinity; for (const p of loc) { lx0 = Math.min(lx0, p.x); lx1 = Math.max(lx1, p.x); lz0 = Math.min(lz0, p.z); lz1 = Math.max(lz1, p.z); }
  const cells = Math.ceil((lx1 - lx0) / 80) * Math.ceil((lz1 - lz0) / 40);
  b.flatRoof = cells > 160;
  if (!b.flatRoof) for (let gx = lx0 + 40; gx < lx1; gx += 80) for (let gz = lz0 + 20; gz < lz1; gz += 40) {
    if (!pointInRing(gx, gz, loc)) continue;
    place(out, 'roof-2x4', cx + gx * ux - gz * uz, yTop, cz + gx * uz + gz * ux, e0.theta, roofC);
  }
  b.yTop = yTop;
  return { list: out, n: out.length };
}

/* ───────────────────────── the far look: merged prisms ───────────────────────── */
function prisms(buildings, colours) {
  const P = [], N = [], C = [], v = new THREE.Vector3();
  for (const b of buildings) {
    const shape = new THREE.Shape(b.ringL.map(p => new THREE.Vector2(p.x, -p.z)));
    let g = new THREE.ExtrudeGeometry(shape, { depth: b.yTop - b.y0, bevelEnabled: false }); if (g.index) g = g.toNonIndexed();
    g.rotateX(-Math.PI / 2); g.translate(0, b.y0, 0); g.computeVertexNormals();
    const p = g.attributes.position, nn = g.attributes.normal, wc = colours(b.wall), rc = colours(b.roof);
    for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(nn.getX(i), nn.getY(i), nn.getZ(i)); const c = nn.getY(i) > 0.5 ? rc : wc; C.push(c.r, c.g, c.b); }
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return g;
}

/* ───────────────────────── the city: tiles, budget, LOD ───────────────────────── */
class City {
  constructor({ scene, M, geoms, groundM, colours }) {
    this.scene = scene; this.M = M; this.geoms = geoms; this.groundM = groundM; this.colours = colours;
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .6, metalness: 0 });
    this.farMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, metalness: 0 });
    this.root = new THREE.Group(); this.root.name = 'city'; scene.add(this.root);
    this.tiles = new Map(); this.buildings = []; this.live = 0; this.frustum = new THREE.Frustum(); this.pm = new THREE.Matrix4();
    this.knocked = 0;
  }
  set(list) {
    this.clear();
    for (const src of list) {
      const ring = src.ring.filter((p, i, a) => i === 0 || Math.hypot(p.x - a[i - 1].x, p.z - a[i - 1].z) > 0.3); if (ring.length < 3) continue;
      let area = 0; for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z; }
      if (Math.abs(area) < 4) continue;
      const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length;
      let gmin = Infinity, gmax = -Infinity; for (const p of ring) { const g = this.groundM(p.x, p.z); gmin = Math.min(gmin, g); gmax = Math.max(gmax, g); }
      const hsh = hash(src.id), M = this.M, h = clamp(src.h || 5, 2.5, 120);
      const b = { id: src.id, kind: src.kind, ring, ringL: ring.map(p => ({ x: p.x * M, z: p.z * M })), h, cx, cz, r: Math.max(...ring.map(p => Math.hypot(p.x - cx, p.z - cz))),
        y0: gmin * M, drop: (gmax - gmin) * M, wall: WALLS[hsh % WALLS.length], roof: ROOFS[(hsh >>> 8) % ROOFS.length], bricks: null, removed: new Set(), flatRoof: false };
      b.yTop = b.y0 + Math.max(2, Math.round(h * M / COURSE) + Math.ceil(b.drop / COURSE)) * COURSE;
      const xs = b.ringL.map(p => p.x), zs = b.ringL.map(p => p.z);
      b.aabb = { min: new THREE.Vector3(Math.min(...xs), b.y0, Math.min(...zs)), max: new THREE.Vector3(Math.max(...xs), b.yTop, Math.max(...zs)) };
      this.buildings.push(b);
      const key = Math.floor(cx / TILE_M) + ':' + Math.floor(cz / TILE_M);
      let t = this.tiles.get(key);
      if (!t) { t = { key, buildings: [], box: new THREE.Box3(), state: 'far', far: null, near: null, n: -1, group: new THREE.Group(), map: null, roofs: [] }; t.group.name = 'tile ' + key; this.root.add(t.group); this.tiles.set(key, t); }
      t.buildings.push(b); t.box.expandByPoint(b.aabb.min); t.box.expandByPoint(b.aabb.max);
    }
    for (const t of this.tiles.values()) { t.far = new THREE.Mesh(prisms(t.buildings, this.colours), this.farMat); t.far.frustumCulled = false; t.group.add(t.far); t.centre = t.box.getCenter(new THREE.Vector3()); }
    return this.buildings.length;
  }
  clear() { for (const t of this.tiles.values()) this.drop(t); this.root.clear(); this.tiles.clear(); this.buildings.length = 0; this.live = 0; }
  drop(t) { if (t.near) { for (const m of t.near.values()) m.dispose(); t.near = null; } for (const r of t.roofs) r.geometry.dispose(); t.roofs = []; if (t.far) t.far.geometry.dispose(); }
  count(t) { if (t.n >= 0) return t.n; t.n = 0; for (const b of t.buildings) { if (!b.bricks) b.bricks = buildBricks(b, this.colours, this.M); t.n += b.bricks.n; } return t.n; }
  goNear(t) {
    this.count(t); const per = new Map();
    for (const b of t.buildings) b.bricks.list.forEach((br, k) => { if (b.removed.has(k)) return; let a = per.get(br.p); if (!a) { a = []; per.set(br.p, a); } a.push({ br, b, k }); });
    t.near = new Map(); t.map = new Map();
    for (const [part, arr] of per) {
      const G = this.geoms.get(part); if (!G) continue;
      const im = new THREE.InstancedMesh(G.geom, this.mat, arr.length); im.frustumCulled = false; im.name = part;
      const tint = new THREE.Color();
      arr.forEach((e, i) => { im.setMatrixAt(i, e.br.m); const v = 0.86 + 0.16 * (hash(e.b.id * 7919 + e.k) % 1000) / 1000; tint.copy(e.br.c).multiplyScalar(v); im.setColorAt(i, tint); });   // each brick its own shade, as moulded plastic is
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      t.near.set(part, im); t.map.set(part, arr); t.group.add(im);
    }
    for (const b of t.buildings) if (b.flatRoof) {                       // too big for plates: one flat roof
      const shape = new THREE.Shape(b.ringL.map(p => new THREE.Vector2(p.x, -p.z))), g = new THREE.ShapeGeometry(shape); g.rotateX(-Math.PI / 2); g.translate(0, b.yTop + 8, 0);
      const c = this.colours(b.roof), col = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < col.length; i += 3) { col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); const m = new THREE.Mesh(g, this.farMat); m.frustumCulled = false; t.roofs.push(m); t.group.add(m);
    }
    t.far.visible = false; t.state = 'near'; this.live += t.n;
  }
  goFar(t) { if (t.near) { for (const m of t.near.values()) { t.group.remove(m); m.dispose(); } t.near = null; t.map = null; } for (const r of t.roofs) { t.group.remove(r); r.geometry.dispose(); } t.roofs = []; t.far.visible = true; t.state = 'far'; this.live -= t.n; }
  /** Called every frame with the camera; flips at most one tile. */
  update(camera, focus) {
    const M = this.M, p = focus || camera.position;
    this.pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); this.frustum.setFromProjectionMatrix(this.pm);
    const order = [];
    for (const t of this.tiles.values()) { t.dist = t.box.distanceToPoint(p) / M; t.group.visible = this.frustum.intersectsBox(t.box) || t.dist < 60; order.push(t); }
    order.sort((a, b) => a.dist - b.dist);
    let total = 0, flip = null;
    for (const t of order) {
      const wantNear = t.state === 'near' ? t.dist < NEAR_OUT : t.dist < NEAR_IN;
      if (!wantNear) { if (t.state === 'near' && !flip) flip = () => this.goFar(t); continue; }
      const n = this.count(t);
      if (total + n > CAP) { if (t.state === 'near' && !flip) flip = () => this.goFar(t); continue; }
      total += n; if (t.state === 'far' && !flip) flip = () => this.goNear(t);
    }
    if (flip) flip();
  }
  near(x, z, radius) { const out = []; for (const b of this.buildings) if (Math.hypot(b.cx * this.M - x, b.cz * this.M - z) < radius + b.r * this.M) out.push(b); return out; }
  aabbs(x, z, radius) { return this.near(x, z, radius).map(b => b.aabb); }
  /** Knock the brick nearest to a point out of a near tile; returns what fell, or null. */
  knock(pt, r) {
    let best = null, bd = r;
    for (const t of this.tiles.values()) {
      if (t.state !== 'near' || !t.map || t.box.distanceToPoint(pt) > r) continue;
      for (const [part, arr] of t.map) arr.forEach((e, i) => { if (e.b.removed.has(e.k)) return; const el = e.br.m.elements, d = Math.hypot(el[12] - pt.x, el[13] + 12 - pt.y, el[14] - pt.z); if (d < bd) { bd = d; best = { t, part, i, e }; } });
    }
    if (!best) return null;
    best.e.b.removed.add(best.e.k); best.t.near.get(best.part).setMatrixAt(best.i, TMP.makeScale(0, 0, 0)); best.t.near.get(best.part).instanceMatrix.needsUpdate = true;
    this.knocked++;
    return { geom: this.geoms.get(best.part).geom, colour: best.e.br.c, matrix: best.e.br.m.clone(), part: best.part };
  }
  stats() { let near = 0; for (const t of this.tiles.values()) if (t.state === 'near') near++; return { buildings: this.buildings.length, tiles: this.tiles.size, near, live: this.live, knocked: this.knocked }; }
}

/** The offline village: houses along two roads of the farm, so the world is never empty. */
function village() {
  const buildings = [], roads = [];
  const house = (id, x, z, w, d, h, kind) => buildings.push({ id, kind, h, ring: [{ x: x - w / 2, z: z - d / 2 }, { x: x + w / 2, z: z - d / 2 }, { x: x + w / 2, z: z + d / 2 }, { x: x - w / 2, z: z + d / 2 }] });
  roads.push({ id: 'a', w: 6, pts: [{ x: -220, z: 34 }, { x: 220, z: 34 }] }, { id: 'b', w: 5, pts: [{ x: 40, z: -180 }, { x: 40, z: 220 }] });
  let id = 1;
  for (let x = -180; x <= 180; x += 45) { if (Math.abs(x - 40) < 20) continue; house(id++, x, 14, 12, 8, 4 + (id % 3) * 1.5, 'house'); house(id++, x + 10, 56, 10, 9, 5 + (id % 2) * 2, 'house'); }
  house(id++, 62, -60, 12, 20, 12, 'church'); house(id++, 18, -110, 30, 18, 9, 'warehouse'); house(id++, -60, 110, 24, 16, 14, 'apartments');
  return { buildings, roads };
}

window.Bricks = { CUSTOM, HARVEST, lines, harvest, City, village, buildBricks, pointInRing, COURSE, CAP };
})();
