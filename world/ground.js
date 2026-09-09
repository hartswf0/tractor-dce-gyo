/* world/ground.js — the real ground, drawn and felt from one array.

   A heightfield in metres becomes one PlaneGeometry at M LDU per metre; h(x,z)
   reads the same triangle the mesh draws (HLIÐARENDI's invariant), so what you
   stand on is what you see. Aerial imagery drapes it when there is a network;
   the moss palette when there is not. Roads are laid as dark tile strips. */
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

/** field: { n, res (m), h Float32Array(n*n) absolute metres, cx, cy (grid coords of the origin), datum } */
/** The ground's shape: flat (a level plane at the datum, the standard ground), gentle (the relief blurred and kept at 35 %), real (the terrain as fetched). */
const MODES = ['flat', 'gentle', 'real'];
function shape(H, n, mode) {
  if (mode === 'flat') { H.fill(0); return H; }
  if (mode !== 'gentle') return H;
  for (let pass = 0; pass < 2; pass++) { const S = new Float32Array(n * n); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let sum = 0, k = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= n || jj >= n) continue; sum += H[jj * n + ii]; k++; } S[j * n + i] = sum / k; } H.set(S); }
  for (let i = 0; i < n * n; i++) H[i] *= 0.35; return H;
}
function make(field, M, paint, mode = 'flat') {
  const { n, res, cx, cy } = field, datum = field.datum;
  const H = new Float32Array(n * n); for (let i = 0; i < n * n; i++) H[i] = field.h[i] - datum; shape(H, n, MODES.includes(mode) ? mode : 'flat');
  const at = (i, j) => H[clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)];
  function hM(x, z) {                              // metres in, metres out; same diagonal split as PlaneGeometry
    const gi = clamp(cx + x / res, 0, n - 1.0001), gj = clamp(cy + z / res, 0, n - 1.0001);
    const i0 = Math.floor(gi), j0 = Math.floor(gj), fx = gi - i0, fz = gj - j0;
    const h00 = H[j0 * n + i0], h10 = H[j0 * n + i0 + 1], h01 = H[(j0 + 1) * n + i0], h11 = H[(j0 + 1) * n + i0 + 1];
    return fx + fz <= 1 ? h00 + fx * (h10 - h00) + fz * (h01 - h00) : h11 + (1 - fx) * (h01 - h11) + (1 - fz) * (h10 - h11);
  }
  const G = {
    M, n, res, H, field, datum, mode: MODES.includes(mode) ? mode : 'flat',
    hM, h: (x, z) => hM(x / M, z / M) * M,        // LDU in, LDU out
    extentM: (n - 1) * res, halfM: (n - 1) * res / 2,
    xMinM: -cx * res, zMinM: -cy * res, xMaxM: (n - 1 - cx) * res, zMaxM: (n - 1 - cy) * res,
    inside: (xm, zm, pad = 0) => xm > -cx * res + pad && xm < (n - 1 - cx) * res - pad && zm > -cy * res + pad && zm < (n - 1 - cy) * res - pad,
    mesh: null, roads: null, imagery: null,
  };
  const N = n - 1, SZ = N * res, g = new THREE.PlaneGeometry(SZ, SZ, N, N); g.rotateX(-Math.PI / 2);
  g.translate(SZ / 2 - cx * res, 0, SZ / 2 - cy * res);
  const pos = g.attributes.position;
  let lo = Infinity, hi = -Infinity; for (let i = 0; i < n * n; i++) { if (H[i] < lo) lo = H[i]; if (H[i] > hi) hi = H[i]; }
  for (let i = 0; i < pos.count; i++) { const ix = i % n, iy = (i / n) | 0; pos.setY(i, at(ix, iy)); }
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3)); g.computeVertexNormals(); g.computeBoundingSphere();
  G.mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  G.mesh.scale.setScalar(M); G.mesh.name = 'ground';
  G.lo = lo; G.hi = hi; G.at = at;
  recolour(G, paint);
  return G;
}
const MOSS = (h, sl, x, z, lo, hi) => { const t = clamp((h - lo) / Math.max(20, hi - lo), 0, 1); if (sl > .52) return [.47, .45, .42]; return [lerp(.40, .56, t), lerp(.47, .56, t), lerp(.30, .40, t)]; };
/** Paint the vertices with a function of (height, slope, x, z, lo, hi) in metres; drops any imagery. */
function recolour(G, paint) {
  paint = paint || MOSS; const g = G.mesh.geometry, pos = g.attributes.position, col = g.attributes.color, n = G.n, res = G.res, at = G.at;
  const jit = (x, z) => { const v = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return v - Math.floor(v); };
  for (let i = 0; i < pos.count; i++) {
    const ix = i % n, iy = (i / n) | 0, x = pos.getX(i), z = pos.getZ(i), h = at(ix, iy);
    const sl = Math.hypot(at(ix + 1, iy) - at(ix - 1, iy), at(ix, iy + 1) - at(ix, iy - 1)) / (2 * res), nz = jit(x, z) * .05 - .025, shade = 1 - clamp(sl * .55, 0, .28);
    const [r, gr, b] = paint(h, sl, x, z, G.lo, G.hi);
    col.setXYZ(i, clamp(r * shade + nz, 0, 1), clamp(gr * shade + nz, 0, 1), clamp(b * shade + nz, 0, 1));
  }
  col.needsUpdate = true;
  const m = G.mesh.material; if (m.map) { m.map.dispose(); m.map = null; } m.vertexColors = true; m.color.set(0xffffff); m.needsUpdate = true; G.imagery = null;
}

/** Drape stitched imagery: per-vertex UVs from the imagery's own projection, so registration is exact. */
function drape(G, imagery) {
  const g = G.mesh.geometry, pos = g.attributes.position, uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) { const t = imagery.uv(pos.getX(i), pos.getZ(i)); uv[i * 2] = t.u; uv[i * 2 + 1] = t.v; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const tex = new THREE.CanvasTexture(imagery.canvas); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const col = g.attributes.color; for (let i = 0; i < col.count; i++) col.setXYZ(i, 1, 1, 1); col.needsUpdate = true;   // white under the imagery, so scorch marks still show
  const m = G.mesh.material; m.map = tex; m.vertexColors = true; m.color.set(0xffffff); m.needsUpdate = true;
  G.imagery = imagery;
}

/** A crater: dent the heightfield within r (LDU) by depth (LDU) with a low rim, scorch the vertices, fix the normals nearby.
    Feet, ships, debris and bolts read the same field, so the ground really is lower afterwards. */
function crater(G, x, z, r, depth) {
  const { n, res, H, M } = G, f = G.field, cx = f.cx, cy = f.cy, g = G.mesh.geometry, pos = g.attributes.position, col = g.attributes.color, nor = g.attributes.normal;
  const xm = x / M, zm = z / M, rm = Math.max(res * 0.8, r / M), dm = depth / M, gi = cx + xm / res, gj = cy + zm / res, span = Math.ceil(rm * 1.3 / res);
  const i0 = clamp(Math.floor(gi) - span, 0, n - 1), i1 = clamp(Math.ceil(gi) + span, 0, n - 1), j0 = clamp(Math.floor(gj) - span, 0, n - 1), j1 = clamp(Math.ceil(gj) + span, 0, n - 1);
  let touched = 0;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const d = Math.hypot((i - gi) * res, (j - gj) * res); if (d > rm * 1.3) continue;
    const k = j * n + i; let dh; if (d < rm) dh = -dm * (1 - d * d / (rm * rm)); else dh = dm * 0.15 * (1 - (d - rm) / (0.3 * rm));
    H[k] += dh; pos.setY(k, H[k]); touched++;
    if (d < rm * 1.1) { const s = (1 - d / (rm * 1.1)) * 0.75; col.setXYZ(k, col.getX(k) * (1 - s) + 0.16 * s, col.getY(k) * (1 - s) + 0.13 * s, col.getZ(k) * (1 - s) + 0.10 * s); }
  }
  const at = G.at;
  for (let j = Math.max(0, j0 - 1); j <= Math.min(n - 1, j1 + 1); j++) for (let i = Math.max(0, i0 - 1); i <= Math.min(n - 1, i1 + 1); i++) {
    const k = j * n + i, dx = (at(i - 1, j) - at(i + 1, j)) / (2 * res), dz = (at(i, j - 1) - at(i, j + 1)) / (2 * res), L = Math.hypot(dx, 1, dz); nor.setXYZ(k, dx / L, 1 / L, dz / L);
  }
  pos.needsUpdate = true; col.needsUpdate = true; nor.needsUpdate = true; G.craters = (G.craters || 0) + 1;
  return touched;
}

/* ───────────────────────── streets ───────────────────────── */
const FOOT = new Set(['footway', 'path', 'steps', 'pedestrian', 'track', 'bridleway', 'corridor']);   // ways for feet: drawn tan by streets(), not as asphalt
const LIFT = { motorway: 0.29, trunk: 0.29, primary: 0.29, motorway_link: 0.28, trunk_link: 0.28, primary_link: 0.28, secondary: 0.27, tertiary: 0.27, secondary_link: 0.26, tertiary_link: 0.26, residential: 0.25, unclassified: 0.25, living_street: 0.25 };   // the bigger road lies on top at a junction
const wheels = r => r.pts && r.pts.length >= 2 && !FOOT.has(r.kind) && r.kind !== 'cycleway' && r.kind !== 'river';
const COVER = { water: [0x3a6fa8, 0.08], park: [0x5f9a48, 0.1], pitch: [0x4f9a40, 0.1], wood: [0x3d6b34, 0.1], cemetery: [0x9ea88c, 0.1], stadium: [0x4f9a40, 0.1] };
const lin = c => new THREE.Color(c).convertSRGBToLinear();
/** A flat-strip mesh builder on the ground: quads follow the drawn triangles (hM), wound to face up. */
function stripper(G, M) {
  const P = [], N = [], C = [];
  const push = (p, col) => { for (const k of [0, 2, 1, 0, 3, 2]) { P.push(...p[k]); N.push(0, 1, 0); C.push(col.r, col.g, col.b); } };
  const quad = (a, b, w, col, lift, side = 0) => {     // a,b: {x,z} metres; a strip of width w between them, shifted sideways by `side` metres (left of travel is positive)
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < 0.05) return;
    const nx = -dz / L, nz = dx / L, ox = nx * side, oz = nz * side, hx = nx * w / 2, hz = nz * w / 2;
    push([[a.x + ox + hx, a.z + oz + hz], [a.x + ox - hx, a.z + oz - hz], [b.x + ox - hx, b.z + oz - hz], [b.x + ox + hx, b.z + oz + hz]].map(([x, z]) => [x * M, (G.hM(x, z) + lift) * M, z * M]), col);
  };
  const flat = (a, b, w, col, ya, yb = ya, side = 0) => {       // a strip at given heights (a deck, its ramps)
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < 0.05) return;
    const nx = -dz / L, nz = dx / L, ox = nx * side, oz = nz * side, hx = nx * w / 2, hz = nz * w / 2;
    push([[a.x + ox + hx, ya, a.z + oz + hz], [a.x + ox - hx, ya, a.z + oz - hz], [b.x + ox - hx, yb, b.z + oz - hz], [b.x + ox + hx, yb, b.z + oz + hz]].map(([x, y, z]) => [x * M, y * M, z * M]), col);
  };
  const wall = (a, b, y0, y1, side, col, y0b = y0, y1b = y1) => {   // a vertical strip beside a segment, both faces (the material is double-sided)
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < 0.05) return;
    const nx = -dz / L * side, nz = dx / L * side, ax = a.x + nx, az = a.z + nz, bx = b.x + nx, bz = b.z + nz;
    push([[ax * M, y0 * M, az * M], [bx * M, y0b * M, bz * M], [bx * M, y1b * M, bz * M], [ax * M, y1 * M, az * M]], col);
  };
  const pier = (m, w, y0, y1, col) => { const h = w / 2; for (const [p, q] of [[[m.x - h, m.z - h], [m.x + h, m.z - h]], [[m.x + h, m.z - h], [m.x + h, m.z + h]], [[m.x + h, m.z + h], [m.x - h, m.z + h]], [[m.x - h, m.z + h], [m.x - h, m.z - h]]]) push([[p[0] * M, y0 * M, p[1] * M], [q[0] * M, y0 * M, q[1] * M], [q[0] * M, y1 * M, q[1] * M], [p[0] * M, y1 * M, p[1] * M]], col); };
  /** Along a polyline, in steps no longer than half a ground cell, so the strip hugs the relief. cb(a2, b2, stepIndex, steps). */
  const along = (pts, cb) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), steps = Math.max(1, Math.ceil(L / Math.min(6, G.res / 2))); for (let s = 0; s < steps; s++) cb({ x: lerp(a.x, b.x, s / steps), z: lerp(a.z, b.z, s / steps) }, { x: lerp(a.x, b.x, (s + 1) / steps), z: lerp(a.z, b.z, (s + 1) / steps) }, s, steps); } };
  const polygon = (ring, col, lift) => {                 // a filled area on the ground
    const tri = THREE.ShapeUtils.triangulateShape(ring.map(p => new THREE.Vector2(p.x, p.z)), []);
    for (const [i, j, k] of tri) { const pts = [ring[i], ring[k], ring[j]].map(p => [p.x * M, (G.hM(p.x, p.z) + lift) * M, p.z * M]); for (const q of pts) { P.push(...q); N.push(0, 1, 0); C.push(col.r, col.g, col.b); } }
  };
  const mesh = name => {
    if (!P.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); m.name = name; return m;
  };
  return { quad, flat, wall, pier, along, polygon, mesh, tris: () => P.length / 9 };
}
/** Roads for wheels as dark plate strips following the ground, with a dashed centre line and edge lines on the wide ones. Widths in metres. */
function roads(G, list, M) {
  const S = stripper(G, M), c = lin(0x3d4148), cl = lin(0xd8d4c4), edge = lin(0xe8e4d8);
  const wallC = lin(0x6e7073), pierC = lin(0x55585e); G.decks = [];
  for (const r of list) {
    const pts = r.pts, w = r.w || 5; if (!wheels(r)) continue;
    const lift = LIFT[r.kind] || 0.23, marks = w >= 5 && r.kind !== 'service';
    if (r.bridge) {                                                              // a bridge: ramps up from both ends to a level deck, side walls, a pier every 15 m
      let top = -Infinity, L = 0; const cum = [0]; for (let i = 0; i < pts.length; i++) { top = Math.max(top, G.hM(pts[i].x, pts[i].z)); if (i) { L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); cum.push(L); } }
      const peak = top + 4.5 * Math.max(1, r.layer || 1), ramp = Math.max(8, Math.min(30, L * 0.3)), half = w / 2;
      const yAt = (i, t) => { const d = cum[i] + t * (cum[i + 1] - cum[i]), x = lerp(pts[i].x, pts[i + 1].x, t), z = lerp(pts[i].z, pts[i + 1].z, t), u = clamp(Math.min(d, L - d) / ramp, 0, 1), k = u * u * (3 - 2 * u); return lerp(G.hM(x, z) + lift, peak, k); };
      const deck = { pts: pts.map((q, i) => ({ x: q.x, z: q.z, y: i === pts.length - 1 ? yAt(i - 1, 1) : yAt(i, 0) })), w, ramp, peak, cum, L, yAt }; G.decks.push(deck); let acc = 7;
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], sl = cum[i + 1] - cum[i], steps = Math.max(1, Math.ceil(sl / 4));
        for (let s = 0; s < steps; s++) { const t0 = s / steps, t1 = (s + 1) / steps, a2 = { x: lerp(a.x, b.x, t0), z: lerp(a.z, b.z, t0) }, b2 = { x: lerp(a.x, b.x, t1), z: lerp(a.z, b.z, t1) }, ya = yAt(i, t0), yb = yAt(i, t1);
          S.flat(a2, b2, w, c, ya, yb); if (marks && s % 2 === 0) S.flat(a2, b2, 0.3, cl, ya + 0.02, yb + 0.02); for (const sg of [1, -1]) S.wall(a2, b2, ya - 0.6, ya + 0.5, sg * half, wallC, yb - 0.6, yb + 0.5);
          acc += sl / steps; if (acc >= 15 && Math.min(ya, yb) > G.hM(a2.x, a2.z) + 1.5) { acc = 0; S.pier(a2, 1.0, G.hM(a2.x, a2.z) - 0.5, Math.min(ya, yb) - 0.55, pierC); } } }
      continue;
    }
    S.along(pts, (a, b, s) => { S.quad(a, b, w, c, lift); if (marks && s % 2 === 0) S.quad(a, b, 0.3, cl, lift + 0.02); if (w >= 9) { S.quad(a, b, 0.15, edge, lift + 0.02, w / 2 - 0.35); S.quad(a, b, 0.15, edge, lift + 0.02, -(w / 2 - 0.35)); if (s % 2 === 1) { S.quad(a, b, 0.15, edge, lift + 0.02, w / 4); S.quad(a, b, 0.15, edge, lift + 0.02, -w / 4); } } });
  }
  const mesh = S.mesh('roads'); G.roads = mesh; return mesh;
}
/** Everything else that makes a street: sidewalks with curbs beside the wider roads, tan footways and paths, cycleways, parking lots with bays, plazas, and zebra crossings where a footway meets a road. */
/** What lies on the ground: strips (a segment, a half width, a sideways shift, a lift) and polygons (a ring, a lift), in metres, bucketed by 25 m cells. */
function layers(G) { const L = { cell: 25, cells: new Map(), n: 0 }; G.layers = L;
  const key = (x, z) => Math.floor(x / L.cell) + ':' + Math.floor(z / L.cell);
  L.strip = (a, b, w, lift, side = 0) => { const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz); if (len < 0.05) return; const nx = -dz / len, nz = dx / len; const it = { ax: a.x + nx * side, az: a.z + nz * side, bx: b.x + nx * side, bz: b.z + nz * side, half: w / 2, lift }; L.n++;
    const x0 = Math.min(it.ax, it.bx) - w, x1 = Math.max(it.ax, it.bx) + w, z0 = Math.min(it.az, it.bz) - w, z1 = Math.max(it.az, it.bz) + w;
    for (let cx = Math.floor(x0 / L.cell); cx <= Math.floor(x1 / L.cell); cx++) for (let cz = Math.floor(z0 / L.cell); cz <= Math.floor(z1 / L.cell); cz++) { const k = cx + ':' + cz; let a2 = L.cells.get(k); if (!a2) { a2 = []; L.cells.set(k, a2); } a2.push(it); } };
  L.polygon = (ring, lift) => { let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); } const it = { ring, lift }; L.n++;
    for (let cx = Math.floor(x0 / L.cell); cx <= Math.floor(x1 / L.cell); cx++) for (let cz = Math.floor(z0 / L.cell); cz <= Math.floor(z1 / L.cell); cz++) { const k = cx + ':' + cz; let a2 = L.cells.get(k); if (!a2) { a2 = []; L.cells.set(k, a2); } a2.push(it); } };
  L.at = (x, z) => { const a2 = L.cells.get(key(x, z)); if (!a2) return 0; let lift = 0;
    for (const it of a2) { if (it.lift <= lift) continue;
      if (it.ring) { let ok = false; const r = it.ring; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const p = r[i], q = r[j]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) ok = !ok; } if (ok) lift = it.lift; }
      else { const dx = it.bx - it.ax, dz = it.bz - it.az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - it.ax) * dx + (z - it.az) * dz) / L2)); if (Math.hypot(x - it.ax - dx * t, z - it.az - dz * t) <= it.half) lift = it.lift; } }
    return lift; };
  return L; }
/** The top of whatever is laid on the ground under a point (LDU in, LDU up from the terrain): a road, a sidewalk, a path, a lot, a lawn; 0 on bare ground. */
function layerAt(G, x, z) { return G.layers ? G.layers.at(x / G.M, z / G.M) * G.M : 0; }
function streets(G, win, M) {
  const S = stripper(G, M), L = layers(G), walk = lin(0x9a9c9e), curb = lin(0x6e7073), foot = lin(0xb9a884), cycle = lin(0x8a5a52), lot = lin(0x55585e), bay = lin(0xe8e4d8), plaza = lin(0xb8b2a4), zebra = lin(0xf2efe6);
  const roads = win.roads || [], areas = win.areas || [], wide = roads.filter(r => (r.w || 5) >= 5 && wheels(r) && !r.bridge), driven = roads.filter(wheels);
  for (const r of driven) { if (!r.pts || r.pts.length < 2 || r.bridge) continue; const lift = LIFT[r.kind] || 0.23; S.along(r.pts, (a, b) => L.strip(a, b, r.w || 5, lift)); }   // the roads themselves, for feet and wheels
  for (const r of wide) { const w = r.w || 5, lift = (LIFT[r.kind] || 0.23); S.along(r.pts, (a, b) => { for (const sg of [1, -1]) { S.quad(a, b, 1.6, walk, lift + 0.07, sg * (w / 2 + 0.8)); S.quad(a, b, 0.16, curb, lift + 0.09, sg * (w / 2 + 0.06)); L.strip(a, b, 1.6, lift + 0.09, sg * (w / 2 + 0.8)); } }); }
  for (const r of roads) { if (!r.pts || r.pts.length < 2) continue; if (FOOT.has(r.kind)) S.along(r.pts, (a, b) => { S.quad(a, b, Math.max(1.2, r.w || 2), foot, 0.3); L.strip(a, b, Math.max(1.2, r.w || 2), 0.3); }); else if (r.kind === 'cycleway') S.along(r.pts, (a, b) => { S.quad(a, b, r.w || 2, cycle, 0.3); L.strip(a, b, r.w || 2, 0.3); }); else if (r.kind === 'river') S.along(r.pts, (a, b) => S.quad(a, b, r.w || 6, lin(COVER.water[0]), 0.08)); }
  // ground cover: water, parks, pitches, woods, cemeteries, the green inside a stadium
  for (const a of areas) { const ring = a.ring, cv = COVER[a.kind]; if (!ring || ring.length < 3 || !cv) continue; S.polygon(ring, lin(cv[0]), cv[1]); if (a.kind !== 'water') L.polygon(ring, cv[1]); if (a.kind === 'pitch') { const n = ring.length; for (let i = 0; i < n; i++) S.quad(ring[i], ring[(i + 1) % n], 0.15, zebra, 0.12); } }
  // zebra crossings: a footway of 8 m or more ending within 3 m of a real road gets stripes across it, one per 15 m of that road
  let crossings = 0; const placed = new Map();
  const nearest = (p) => { let best = null; for (const r of wide) { if (r.kind === 'service') continue; for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1, t = clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / L2, 0, 1), cx = a.x + dx * t, cz = a.z + dz * t, d = Math.hypot(p.x - cx, p.z - cz); if (d < 3 && (!best || d < best.d)) best = { d, x: cx, z: cz, ux: dx / Math.sqrt(L2), uz: dz / Math.sqrt(L2), w: r.w || 5, r, lift: LIFT[r.kind] || 0.23 }; } } return best; };
  for (const r of roads) { if (!FOOT.has(r.kind) || !r.pts || r.pts.length < 2 || crossings >= 200) continue; let len = 0; for (let i = 0; i < r.pts.length - 1; i++) len += Math.hypot(r.pts[i + 1].x - r.pts[i].x, r.pts[i + 1].z - r.pts[i].z); if (len < 8) continue;
    for (const p of [r.pts[0], r.pts[r.pts.length - 1]]) { const n = nearest(p); if (!n) continue; const done = placed.get(n.r) || []; if (done.some(q => Math.hypot(q.x - n.x, q.z - n.z) < 15)) continue; done.push({ x: n.x, z: n.z }); placed.set(n.r, done); crossings++;
      for (let k = -2; k <= 2; k++) { const ox = n.ux * k * 0.6, oz = n.uz * k * 0.6, nx = -n.uz, nz = n.ux; S.quad({ x: n.x + ox - nx * n.w / 2, z: n.z + oz - nz * n.w / 2 }, { x: n.x + ox + nx * n.w / 2, z: n.z + oz + nz * n.w / 2 }, 0.35, zebra, n.lift + 0.03); } } }
  S.crossings = crossings;
  // parking lots and plazas: filled under the roads, lots with white bay lines along their longest edge, kept clear of any road's lane
  const nearRoad = (x, z) => { for (const r of driven) { const half = (r.w || 5) / 2 + 1.5; for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / L2, 0, 1); if (Math.hypot(x - a.x - dx * t, z - a.z - dz * t) < half) return true; } } return false; };
  for (const a of areas) { const ring = a.ring; if (!ring || ring.length < 3) continue;
    if (a.kind === 'plaza') { S.polygon(ring, plaza, 0.2); L.polygon(ring, 0.2); continue; }
    if (a.kind !== 'parking') continue;
    S.polygon(ring, lot, 0.18); L.polygon(ring, 0.18);
    let bi = 0, bl = 0; for (let i = 0; i < ring.length; i++) { const q = ring[(i + 1) % ring.length], L = Math.hypot(q.x - ring[i].x, q.z - ring[i].z); if (L > bl) { bl = L; bi = i; } }
    const A = ring[bi], B = ring[(bi + 1) % ring.length], ux = (B.x - A.x) / bl, uz = (B.z - A.z) / bl, vx = -uz, vz = ux;
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity; for (const p of ring) { const u = (p.x - A.x) * ux + (p.z - A.z) * uz, v = (p.x - A.x) * vx + (p.z - A.z) * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const inside = (x, z) => { let ok = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const p = ring[i], q = ring[j]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) ok = !ok; } return ok; };
    let bays = 0;
    for (let v = v0 + 1.5; v + 5 <= v1 && bays < 400; v += 7) for (let u = u0 + 1.5; u <= u1 - 1.5 && bays < 400; u += 2.5) {
      const p0 = { x: A.x + ux * u + vx * v, z: A.z + uz * u + vz * v }, p1 = { x: A.x + ux * u + vx * (v + 5), z: A.z + uz * u + vz * (v + 5) };
      if (inside(p0.x, p0.z) && inside(p1.x, p1.z) && inside((p0.x + p1.x) / 2, (p0.z + p1.z) / 2) && !nearRoad(p0.x, p0.z) && !nearRoad(p1.x, p1.z)) { S.quad(p0, p1, 0.12, bay, 0.2); bays++; } }
  }
  const mesh = S.mesh('streets'); if (mesh) mesh.userData.crossings = crossings; G.streets = mesh; return mesh;
}
/** A bridge deck under a point, in LDU, or -Infinity: the floor for whoever is on the bridge. */
function deckAt(G, x, z) {
  let best = -Infinity; if (!G.decks) return best; const xm = x / (G.M || 40), zm = z / (G.M || 40);
  for (const d of G.decks) { const half = d.w / 2 + 0.3; for (let i = 0; i < d.pts.length - 1; i++) { const a = d.pts[i], b = d.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1, t = clamp(((xm - a.x) * dx + (zm - a.z) * dz) / L2, 0, 1); if (Math.hypot(xm - a.x - dx * t, zm - a.z - dz * t) < half) best = Math.max(best, d.yAt(i, t) * (G.M || 40)); } }
  return best;
}

/** HLIÐARENDI's day preset, rebuilt for r128 (see toys/common.js for the reasoning). */
function daylight(scene, renderer, loader, M) {
  renderer.outputEncoding = THREE.sRGBEncoding;
  const lin = c => new THREE.Color(c).convertSRGBToLinear();
  scene.background = new THREE.Color(0xb8cbd8);
  scene.fog = new THREE.Fog(lin(0xc9d4d2), 30 * M, 900 * M);
  scene.traverse(o => { if (o.isAmbientLight || o.isDirectionalLight) o.intensity = 0; });
  const hemi = new THREE.HemisphereLight(lin(0xffffff), lin(0xd8d8d8), 1.35 / Math.PI); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.25 / Math.PI); dir.position.set(2, 3, 2).multiplyScalar(1000); scene.add(dir);
  daylight.lights = { hemi, sun: dir };
  const seen = new Set();
  for (const m of loader.materials || []) for (const x of [m, m.userData && m.userData.edgeMaterial]) {
    if (x && x.color && !seen.has(x)) { seen.add(x); x.color.convertSRGBToLinear(); if (x.emissive) x.emissive.convertSRGBToLinear(); }
  }
}

/** The baked farm as a field: Hlíðarendi, for when there is no network or no place. */
function bakedField() {
  const TR = window.TERRAIN, n = TR.n, bin = atob(TR.b64), h = new Float32Array(n * n), scale = (TR.max - TR.min) / 65535;
  for (let i = 0; i < n * n; i++) h[i] = TR.min + ((bin.charCodeAt(i * 2)) | (bin.charCodeAt(i * 2 + 1) << 8)) * scale + 189;
  const cx = TR.cx, cy = TR.cy, i0 = Math.floor(cx), j0 = Math.floor(cy);
  return { n, res: TR.res, h, cx, cy, datum: h[j0 * n + i0], baked: true };
}

/** Convert a fetched square field (origin at the centre) into the shared shape. */
function centredField(f) { return { n: f.n, res: f.res, h: f.h, cx: (f.n - 1) / 2, cy: (f.n - 1) / 2, datum: f.datum }; }

window.Ground = { MODES, streets, FOOT, LIFT, COVER, deckAt, layerAt, wheels, make, drape, recolour, crater, roads, daylight, bakedField, centredField, MOSS };
})();
