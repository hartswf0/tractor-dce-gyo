/* world/flora.js — trees and towers from the map, instanced.

   A tree is five bricks: two round 1x1 trunks and a crown of 2x2, 2x4, 2x2.
   Trees stand where the map has one, through a wood every nine metres, and
   along residential streets. A tower is a column of 1x1 bricks to its height
   with a red lamp on top. Everything is one InstancedMesh per part; the
   walker is pushed out of trunks, a blast fells trees into debris. */
(function () {
'use strict';
const CAP_TREES = 1500, CAP_TOWERS = 40, CELL = 10;
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const TREE = [['3062b', 0, 'trunk'], ['3062b', 24, 'trunk'], ['3003', 48, 'crown', 0], ['3001', 72, 'crown', Math.PI / 2], ['3003', 96, 'crown', Math.PI / 4]];
function create({ scene, M, geoms, colours }) {
  const F = { scene, M, geoms, colours, group: null, trees: [], towers: [], meshes: new Map(), cells: new Map(), night: 0, removed: 0, lamps: null };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .6, metalness: 0 });
  F.drop = () => { if (F.group) { scene.remove(F.group); for (const im of F.meshes.values()) im.dispose(); } F.group = null; F.meshes.clear(); F.trees = []; F.towers = []; F.cells.clear(); F.lamps = null; };
  const key = (x, z) => Math.floor(x / (CELL * M)) + ':' + Math.floor(z / (CELL * M));
  const inside = (x, z, ring) => { let ok = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const p = ring[i], q = ring[j]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) ok = !ok; } return ok; };
  /** Place everything for a window: points (trees, towers), woods, residential streets. Coordinates in metres. */
  F.lay = (G, win, foot) => {
    F.drop(); const spots = [], towers = [], seen = new Set();
    const add = (x, z, why) => { if (spots.length >= CAP_TREES) return; const k = Math.round(x / 3) + ':' + Math.round(z / 3); if (seen.has(k)) return; seen.add(k); spots.push({ x, z, why }); };
    for (const p of win.points || []) { if (p.kind === 'tree') add(p.x, p.z, 'map'); else if (p.kind === 'tower' && towers.length < CAP_TOWERS) towers.push(p); }
    for (const a of win.areas || []) { if (a.kind !== 'wood' || !a.ring || a.ring.length < 3) continue; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const p of a.ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
      for (let x = x0 + 4; x < x1; x += 9) for (let z = z0 + 4; z < z1; z += 9) { const jx = (hash(a.id * 31 + x * 7 + z) % 100) / 100 * 4 - 2, jz = (hash(a.id * 17 + z * 7 + x) % 100) / 100 * 4 - 2; if (inside(x + jx, z + jz, a.ring)) add(x + jx, z + jz, 'wood'); } }
    const blds = (win.buildings || []).map(b => { const n = b.ring.length; let cx = 0, cz = 0; for (const p of b.ring) { cx += p.x; cz += p.z; } cx /= n; cz /= n; return { cx, cz, r: Math.max(...b.ring.map(p => Math.hypot(p.x - cx, p.z - cz))) + 3 }; });
    const clear = (x, z) => !blds.some(b => Math.hypot(b.cx - x, b.cz - z) < b.r);
    for (const r of win.roads || []) { if (r.kind !== 'residential' || r.bridge || !r.pts || r.pts.length < 2) continue; let acc = 6, side = 1; const off = (r.w || 6) / 2 + 2.4;
      for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz); if (len < 0.1) continue; const ux = dx / len, uz = dz / len, nx = -uz, nz = ux;
        for (let s = acc; s < len; s += 18) { const x = a.x + ux * s + nx * off * side, z = a.z + uz * s + nz * off * side; if (clear(x, z)) add(x, z, 'street'); side = -side; } acc = ((acc - len) % 18 + 18) % 18; } }
    F.trees = spots.map((s, i) => ({ i, x: s.x * M, z: s.z * M, y: G.hM(s.x, s.z) * M, yaw: (hash(i * 977) % 628) / 100, why: s.why, alive: true }));
    F.towers = towers.map((t, i) => ({ i, x: t.x * M, z: t.z * M, y: G.hM(t.x, t.z) * M, h: t.h || 20, name: t.name || null }));
    for (const t of F.trees) { const k = key(t.x, t.z); let a = F.cells.get(k); if (!a) { a = []; F.cells.set(k, a); } a.push(t); }
    if (!F.trees.length && !F.towers.length) return F.stats();
    const group = new THREE.Group(); group.name = 'flora'; F.group = group;
    const per = new Map(); const want = (part, n) => { per.set(part, (per.get(part) || 0) + n); };
    for (const [part] of TREE) want(part, F.trees.length); want('3005', F.towers.reduce((s, t) => s + Math.min(60, Math.round(t.h * M / 24)), 0));
    const next = new Map();
    for (const [part, n] of per) { const g = geoms.get(part); if (!g || !n) continue; const im = new THREE.InstancedMesh(g.geom, mat, n); im.frustumCulled = false; im.name = 'flora:' + part; im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3); F.meshes.set(part, im); group.add(im); next.set(part, 0); }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0), trunkC = colours(308), crownC = [colours(2), colours(288), colours(10)];
    for (const t of F.trees) { t.slots = []; const cc = crownC[hash(t.i * 13) % crownC.length];
      for (const [part, dy, what, rot] of TREE) { const im = F.meshes.get(part); if (!im) continue; const i = next.get(part); next.set(part, i + 1); q.setFromAxisAngle(up, t.yaw + (rot || 0)); pos.set(t.x, t.y + dy, t.z); m.compose(pos, q, one); im.setMatrixAt(i, m); im.setColorAt(i, what === 'trunk' ? trunkC : cc); t.slots.push({ part, i, dy, rot: rot || 0 }); } }
    const towerC = colours(72); const lampP = [];
    for (const t of F.towers) { const im = F.meshes.get('3005'); if (!im) continue; const n = Math.min(60, Math.round(t.h * M / 24)); for (let c = 0; c < n; c++) { const i = next.get('3005'); next.set('3005', i + 1); q.identity(); pos.set(t.x, t.y + c * 24, t.z); m.compose(pos, q, one); im.setMatrixAt(i, m); im.setColorAt(i, towerC); } lampP.push(t.x, t.y + n * 24 + 6, t.z); }
    for (const im of F.meshes.values()) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }
    if (lampP.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(lampP, 3)); const lamps = new THREE.Points(g, new THREE.PointsMaterial({ map: Lamps.radial(), size: 2.6 * M, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xff3a2a, opacity: 0.3, fog: false })); lamps.name = 'towerLamps'; lamps.frustumCulled = false; group.add(lamps); F.lamps = lamps; }
    scene.add(group); F.setNight(F.night); return F.stats();
  };
  F.setNight = n => { F.night = n; if (F.lamps) F.lamps.material.opacity = 0.2 + 0.8 * n; };
  /** Keep a walker out of the trunks. */
  F.pushOut = (pos, r) => { const k0 = Math.floor(pos.x / (CELL * M)), k1 = Math.floor(pos.z / (CELL * M)); for (let a = k0 - 1; a <= k0 + 1; a++) for (let b = k1 - 1; b <= k1 + 1; b++) { const cell = F.cells.get(a + ':' + b); if (!cell) continue; for (const t of cell) { if (!t.alive || pos.y > t.y + 130) continue; const dx = pos.x - t.x, dz = pos.z - t.z, d = Math.hypot(dx, dz), want = r + 0.55 * M; if (d < want && d > 1e-3) { pos.x = t.x + dx / d * want; pos.z = t.z + dz / d * want; } } } };
  /** Trees within r of a point fall: their bricks become debris. */
  F.blast = (pt, r, vel) => { const out = []; for (const t of F.trees) { if (!t.alive || Math.hypot(t.x - pt.x, t.z - pt.z) > r + 0.6 * M || Math.abs(pt.y - (t.y + 60)) > r + 80) continue; t.alive = false; F.removed++;
      for (const sl of t.slots) { const im = F.meshes.get(sl.part); if (!im) continue; const mm = new THREE.Matrix4(); im.getMatrixAt(sl.i, mm); const col = new THREE.Color(); im.getColorAt(sl.i, col); im.setMatrixAt(sl.i, new THREE.Matrix4().makeScale(0, 0, 0)); im.instanceMatrix.needsUpdate = true;
        const away = new THREE.Vector3(t.x - pt.x, 60 + sl.dy * 0.3, t.z - pt.z).normalize().multiplyScalar((2 + Math.random() * 3) * M); if (vel) away.add(vel); out.push({ part: sl.part, matrix: mm, colour: col, vel: away }); } }
    return out; };
  F.stats = () => ({ trees: F.trees.filter(t => t.alive).length, towers: F.towers.length, removed: F.removed, why: F.trees.reduce((o, t) => { o[t.why] = (o[t.why] || 0) + 1; return o; }, {}), lamp: F.lamps ? +F.lamps.material.opacity.toFixed(2) : null });
  return F;
}
window.Flora = { create, TREE, CAP_TREES };
})();
