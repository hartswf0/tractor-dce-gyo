/* world/sets.js — sets that sell the scene: the place gives way to a dressed square of world.

   A set is instanced geometry laid round a centre: a redwood forest (tapered trunks with root flares,
   crowns high up, fern clumps on the floor, fallen logs across a corridor, some raised on stubs so a
   bike goes under), a snowfield (drifts and pressure ridges), a desert (rocks). Trunks and logs are
   solid: pushOut keeps walkers and rides out of them, aabbs gives the TIE its boxes, inside tells the
   film camera it stands in one, hitTrunk names the trunk a charging bike met. The set also brings the
   floor paint and the fog it wants; the page clears the place's city, roads, lamps, flora and traffic
   while a set is up and relands the place when it comes down. */
(function () {
'use strict';
const CELL = 12;
const hash = (a, b, c) => { let h = 2166136261 ^ (a * 374761393) ^ (b * 668265263) ^ (c * 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const lin = c => new THREE.Color(c).convertSRGBToLinear();
const KINDS = {
  forest: { name: 'a redwood forest', fog: [0x9fb389, 25, 380], sky: 0xb9c9b0, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 3) * 0.06; return [0.14 + j, 0.29 + j * 1.2, 0.11 + j * 0.5]; } },
  snowfield: { name: 'a snowfield', fog: [0xe6edf5, 20, 600], sky: 0xdfe8f2, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 5) * 0.03; return [0.93 + j, 0.95 + j, 0.98]; } },
  desert: { name: 'a desert', fog: [0xe8d9b5, 30, 700], sky: 0xe9d9b6, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 7) * 0.05; return [0.80 + j, 0.68 + j, 0.45]; } },
};
/** Distance from a point to a polyline (metres in, metres out). */
function distToPath(x, z, path) {
  let best = Infinity; if (!path || path.length < 2) return best;
  for (let i = 0; i < path.length - 1; i++) { const a = path[i], b = path[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); }
  return best;
}
function lay(kind, { scene, G, M, centre, r = 180, seed = 1, corridor = null }) {
  const K = KINDS[kind] || KINDS.forest, S = { kind, name: K.name, paint: K.paint, fog: K.fog, sky: K.sky, group: new THREE.Group(), trunks: [], logs: [], drifts: 0, ferns: 0, cells: new Map(), M, centre: { x: centre.x, z: centre.z }, r };
  S.group.name = 'set:' + kind; const cx = centre.x / M, cz = centre.z / M, gh = (x, z) => G.hM(x, z) * M;
  const key = (x, z) => Math.floor(x / (CELL * M)) + ':' + Math.floor(z / (CELL * M));
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: false, roughness: 0.85, metalness: 0 });
  const unitCyl = new THREE.CylinderGeometry(0.62, 1, 1, 10, 1), cone = new THREE.ConeGeometry(1, 1, 8), flare = new THREE.ConeGeometry(1, 1, 8), bush = new THREE.ConeGeometry(1, 1, 6), ball = new THREE.SphereGeometry(1, 10, 7), box = new THREE.BoxGeometry(1, 1, 1);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const inst = (geom, n, name) => { const im = new THREE.InstancedMesh(geom, mat.clone(), Math.max(1, n)); im.count = 0; im.frustumCulled = false; im.name = 'set:' + name; im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, n) * 3).fill(1), 3); S.group.add(im); return im; };
  const put = (im, x, y, z, sx, sy, sz, yaw, tilt, col) => { const i = im.count++; if (i >= im.instanceMatrix.count) { im.count--; return; } q.setFromAxisAngle(up, yaw || 0); if (tilt) { const t = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt); q.multiply(t); } p3.set(x, y, z); s3.set(sx, sy, sz); m4.compose(p3, q, s3); im.setMatrixAt(i, m4); im.setColorAt(i, col); };
  if (kind === 'forest') {
    const rm = r / M, grid = 11, spots = [];
    for (let gx = -rm; gx <= rm; gx += grid) for (let gz = -rm; gz <= rm; gz += grid) {
      const jx = (hash(gx | 0, gz | 0, seed) - 0.5) * 5, jz = (hash(gz | 0, gx | 0, seed + 1) - 0.5) * 5, x = cx + gx + jx, z = cz + gz + jz;
      if (Math.hypot(x - cx, z - cz) > rm) continue; if (corridor && distToPath(x, z, corridor) < 6.5) continue; if (Math.hypot(gx + jx, gz + jz) < 9) continue;   // a clearing at the centre for the actors
      spots.push({ x, z, u: hash(gx | 0, gz | 0, seed + 2), v: hash(gz | 0, gx | 0, seed + 3) });
    }
    const trunks = inst(unitCyl, spots.length, 'trunks'), flares = inst(flare, spots.length, 'roots'), crowns = inst(cone, spots.length * 2, 'crowns'), bark = lin(0x4a3222), bark2 = lin(0x5c4030), leaf = lin(0x1f4a24), leaf2 = lin(0x2d6b2c), fernC = lin(0x2f6b2a), fernC2 = lin(0x3f7f34);
    for (const s of spots) {
      const rad = (1.2 + s.u * 1.4) * M, h = (35 + s.v * 25) * M, y = gh(s.x, s.z), x = s.x * M, z = s.z * M, col = s.u > 0.5 ? bark : bark2;
      put(trunks, x, y + h / 2, z, rad, h, rad, s.u * 6.28, 0, col); put(flares, x, y + 1.2 * M, z, rad * 1.9, 2.6 * M, rad * 1.9, s.v * 6.28, 0, col);
      put(crowns, x, y + h * 0.78, z, (5 + s.u * 4) * M, 9 * M, (5 + s.u * 4) * M, 0, 0, s.v > 0.5 ? leaf : leaf2); put(crowns, x, y + h * 0.92, z, (3 + s.u * 3) * M, 7 * M, (3 + s.u * 3) * M, 0, 0, leaf);
      const t = { x, z, r: rad, h, top: y + h, y }; S.trunks.push(t); const k = key(x, z); let cell = S.cells.get(k); if (!cell) { cell = []; S.cells.set(k, cell); } cell.push(t);
    }
    // ferns in patches on the floor
    const nF = Math.min(3200, Math.round(rm * rm * 0.16)), nC = corridor && corridor.length > 1 ? Math.min(1600, Math.round(corridor.reduce((acc, p, i) => i ? acc + Math.hypot(p[0] - corridor[i - 1][0], p[1] - corridor[i - 1][1]) : 0, 0) * 3)) : 0, ferns = inst(bush, nF + nC, 'ferns');
    const fern = (i, x, z) => { const sz = (0.8 + hash(i, 4, seed) * 0.9) * M; put(ferns, x * M, gh(x, z) + sz * 0.3, z * M, sz * 1.3, sz * 0.7, sz * 1.3, hash(i, 5, seed) * 6.28, 0, hash(i, 6, seed) > 0.5 ? fernC : fernC2); S.ferns++; };
    if (nC) { const path = corridor; for (let i = 0; i < nC; i++) { const t = (i / nC) * (path.length - 1), seg = Math.min(path.length - 2, Math.floor(t)), lt = t - seg, a = path[seg], b = path[seg + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, side = i % 2 ? 1 : -1, off = (3 + hash(i, 7, seed) * 5) * side, px = a[0] + dx * lt - dz / L * off, pz = a[1] + dz * lt + dx / L * off; fern(i + 9000, px, pz); } }   // the verges of the corridor: ferns the bikes brush past
    for (let i = 0; i < nF; i++) { const a = hash(i, 1, seed) * 6.283, d = Math.pow(hash(i, 2, seed), 0.7) * rm, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (hash(i, 3, seed) < 0.3) continue; if (corridor && distToPath(x, z, corridor) < 2.5) continue; fern(i, x, z); }
    // fallen logs across the corridor: some on the ground to go over, two raised on stubs to go under
    const logs = inst(unitCyl, 8, 'logs'), stubs = inst(flare, 16, 'stubs'), path = corridor && corridor.length > 1 ? corridor : [[cx, cz - rm * 0.8], [cx, cz + rm * 0.8]];
    for (let i = 0; i < 6; i++) {
      const t = (i + 1) / 7, seg = Math.min(path.length - 2, Math.floor(t * (path.length - 1))), lt = t * (path.length - 1) - seg, a = path[seg], b = path[seg + 1], px = a[0] + (b[0] - a[0]) * lt, pz = a[1] + (b[1] - a[1]) * lt;
      const dir = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2 + (hash(i, 9, seed) - 0.5) * 0.5, len = (18 + hash(i, 10, seed) * 12) * M, rad = (i % 3 === 1 ? 1.1 : 0.85 + hash(i, 11, seed) * 0.3) * M, raised = i % 3 === 1, y = gh(px, pz) + (raised ? 3.5 * M + rad : rad * 0.8);
      const x = px * M, z = pz * M; put(logs, x, y, z, rad, len, rad, Math.PI / 2 - dir, Math.PI / 2, i % 2 ? bark : bark2);   // the cylinder's axis lies along the log's direction
      if (raised) for (const e of [-1, 1]) put(stubs, x + Math.cos(dir) * len * 0.42 * e, gh(px, pz) + 1.8 * M, z + Math.sin(dir) * len * 0.42 * e, rad * 1.3, 3.6 * M, rad * 1.3, 0, 0, bark);
      S.logs.push({ ax: x - Math.cos(dir) * len / 2, az: z - Math.sin(dir) * len / 2, bx: x + Math.cos(dir) * len / 2, bz: z + Math.sin(dir) * len / 2, r: rad, y, raised });
    }
  } else if (kind === 'snowfield') {
    const rm = r / M, n = Math.round(rm / 4), drifts = inst(ball, n, 'drifts'), ridges = inst(box, 10, 'ridges'), snow = lin(0xf4f7fb), snow2 = lin(0xe6ecf4);
    for (let i = 0; i < n; i++) { const a = hash(i, 1, seed) * 6.283, d = Math.sqrt(hash(i, 2, seed)) * rm, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (corridor && distToPath(x, z, corridor) < 10) continue; if (Math.hypot(x - cx, z - cz) < 18) continue; put(drifts, x * M, gh(x, z) + 0.2 * M, z * M, (8 + hash(i, 3, seed) * 10) * M, (0.9 + hash(i, 4, seed) * 0.8) * M, (5 + hash(i, 5, seed) * 6) * M, hash(i, 6, seed) * 6.28, 0, hash(i, 7, seed) > 0.5 ? snow : snow2); S.drifts++; }
    for (let i = 0; i < 8; i++) { const a = hash(i, 11, seed) * 6.283, d = (0.35 + hash(i, 12, seed) * 0.6) * rm, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (corridor && distToPath(x, z, corridor) < 24) continue; put(ridges, x * M, gh(x, z) + 0.6 * M, z * M, (30 + hash(i, 13, seed) * 30) * M, (1.2 + hash(i, 14, seed) * 1.2) * M, (3 + hash(i, 15, seed) * 3) * M, hash(i, 16, seed) * 6.28, 0, snow2); S.drifts++; }
  } else if (kind === 'desert') {
    const rm = r / M, n = Math.round(rm / 5), rocks = inst(ball, n, 'rocks'), rock = lin(0x8a6a48);
    for (let i = 0; i < n; i++) { const a = hash(i, 1, seed) * 6.283, d = Math.sqrt(hash(i, 2, seed)) * rm, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (corridor && distToPath(x, z, corridor) < 8) continue; const sz = (1 + hash(i, 3, seed) * 3) * M; put(rocks, x * M, gh(x, z) + sz * 0.3, z * M, sz * 1.4, sz * 0.8, sz, hash(i, 4, seed) * 6.28, 0, rock); const t = { x: x * M, z: z * M, r: sz * 1.2, h: sz, top: gh(x, z) + sz, y: gh(x, z) }; S.trunks.push(t); const k = key(t.x, t.z); let cell = S.cells.get(k); if (!cell) { cell = []; S.cells.set(k, cell); } cell.push(t); }
  }
  S.group.traverse(o => { if (o.isInstancedMesh) { o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true; } });
  scene.add(S.group);
  const near = (x, z) => { const k0 = Math.floor(x / (CELL * M)), k1 = Math.floor(z / (CELL * M)), out = []; for (let a = k0 - 1; a <= k0 + 1; a++) for (let b = k1 - 1; b <= k1 + 1; b++) { const c = S.cells.get(a + ':' + b); if (c) out.push(...c); } return out; };
  /** Keep a point (a walker, a ride) out of the trunks and the logs it cannot pass; true when it moved. */
  S.pushOut = (pos, rr) => {
    let moved = false;
    for (let pass = 0; pass < 2; pass++) for (const t of near(pos.x, pos.z)) { if (pos.y > t.top) continue; const dx = pos.x - t.x, dz = pos.z - t.z, d = Math.hypot(dx, dz), want = t.r + rr; if (d < want && d > 1e-6) { pos.x = t.x + dx / d * want; pos.z = t.z + dz / d * want; moved = true; } }
    for (const L of S.logs) { const under = L.raised && pos.y + rr < L.y - L.r, over = !L.raised && pos.y - rr * 0.3 > L.y + L.r; if (under || over) continue; const dx = L.bx - L.ax, dz = L.bz - L.az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((pos.x - L.ax) * dx + (pos.z - L.az) * dz) / L2)), qx = L.ax + dx * t, qz = L.az + dz * t, ex = pos.x - qx, ez = pos.z - qz, d = Math.hypot(ex, ez), want = L.r + rr; if (d < want && d > 1e-6) { pos.x = qx + ex / d * want; pos.z = qz + ez / d * want; moved = true; } }
    return moved;
  };
  S.inside = (p, margin) => { const m = margin != null ? margin : 0.3 * M; for (const t of near(p.x, p.z)) if (p.y <= t.top && Math.hypot(p.x - t.x, p.z - t.z) < t.r + m) return 'trunk'; for (const L of S.logs) { const dx = L.bx - L.ax, dz = L.bz - L.az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((p.x - L.ax) * dx + (p.z - L.az) * dz) / L2)); if (Math.hypot(p.x - L.ax - dx * t, p.z - L.az - dz * t) < L.r + 0.3 * M && Math.abs(p.y - L.y) < L.r + 0.3 * M) return 'log'; } return null; };
  S.hitTrunk = (pos, rr) => { for (const t of near(pos.x, pos.z)) if (pos.y <= t.top && Math.hypot(pos.x - t.x, pos.z - t.z) < t.r + rr) return t; for (const L of S.logs) { const under = L.raised && pos.y + rr < L.y - L.r, over = !L.raised && pos.y - rr * 0.3 > L.y + L.r; if (under || over) continue; const dx = L.bx - L.ax, dz = L.bz - L.az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((pos.x - L.ax) * dx + (pos.z - L.az) * dz) / L2)); if (Math.hypot(pos.x - L.ax - dx * t, pos.z - L.az - dz * t) < L.r + rr) return { log: L, x: L.ax + dx * t, z: L.az + dz * t, r: L.r, top: L.y + L.r, y: L.y }; } return null; };
  S.aabbs = (x, z, rr) => near(x, z).filter(t => Math.hypot(t.x - x, t.z - z) < rr + t.r).map(t => new THREE.Box3(new THREE.Vector3(t.x - t.r, t.y, t.z - t.r), new THREE.Vector3(t.x + t.r, t.top, t.z + t.r)));
  S.nearestTrunk = (x, z, within) => { let best = null, bd = within || Infinity; for (const t of S.trunks) { const d = Math.hypot(t.x - x, t.z - z); if (d < bd) { bd = d; best = t; } } return best; };
  S.stats = () => ({ kind, trunks: S.trunks.length, logs: S.logs.length, raised: S.logs.filter(l => l.raised).length, ferns: S.ferns, drifts: S.drifts, centre: { x: +(S.centre.x / M).toFixed(0), z: +(S.centre.z / M).toFixed(0) }, r: +(r / M).toFixed(0) });
  S.drop = () => { scene.remove(S.group); S.group.traverse(o => { if (o.isInstancedMesh) { o.geometry.dispose(); o.material.dispose(); } }); S.trunks = []; S.logs = []; S.cells.clear(); };
  return S;
}
window.Sets = { lay, KINDS, distToPath };
})();
