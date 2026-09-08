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
function make(field, M, paint) {
  const { n, res, cx, cy } = field, datum = field.datum;
  const H = new Float32Array(n * n); for (let i = 0; i < n * n; i++) H[i] = field.h[i] - datum;
  const at = (i, j) => H[clamp(j, 0, n - 1) * n + clamp(i, 0, n - 1)];
  function hM(x, z) {                              // metres in, metres out; same diagonal split as PlaneGeometry
    const gi = clamp(cx + x / res, 0, n - 1.0001), gj = clamp(cy + z / res, 0, n - 1.0001);
    const i0 = Math.floor(gi), j0 = Math.floor(gj), fx = gi - i0, fz = gj - j0;
    const h00 = H[j0 * n + i0], h10 = H[j0 * n + i0 + 1], h01 = H[(j0 + 1) * n + i0], h11 = H[(j0 + 1) * n + i0 + 1];
    return fx + fz <= 1 ? h00 + fx * (h10 - h00) + fz * (h01 - h00) : h11 + (1 - fx) * (h01 - h11) + (1 - fz) * (h10 - h11);
  }
  const G = {
    M, n, res, H, field, datum,
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
  return { quad, along, polygon, mesh, tris: () => P.length / 9 };
}
/** Roads for wheels as dark plate strips following the ground, with a dashed centre line and edge lines on the wide ones. Widths in metres. */
function roads(G, list, M) {
  const S = stripper(G, M), c = lin(0x3d4148), cl = lin(0xd8d4c4), edge = lin(0xe8e4d8);
  for (const r of list) {
    const pts = r.pts, w = r.w || 5; if (!pts || pts.length < 2 || FOOT.has(r.kind) || r.kind === 'cycleway') continue;
    S.along(pts, (a, b, s) => { S.quad(a, b, w, c, 0.25); if (w >= 5 && s % 2 === 0) S.quad(a, b, 0.3, cl, 0.27); if (w >= 7) { S.quad(a, b, 0.15, edge, 0.27, w / 2 - 0.35); S.quad(a, b, 0.15, edge, 0.27, -(w / 2 - 0.35)); } });
  }
  const mesh = S.mesh('roads'); G.roads = mesh; return mesh;
}
/** Everything else that makes a street: sidewalks with curbs beside the wider roads, tan footways and paths, cycleways, parking lots with bays, plazas, and zebra crossings where a footway meets a road. */
function streets(G, win, M) {
  const S = stripper(G, M), walk = lin(0x9a9c9e), curb = lin(0x6e7073), foot = lin(0xb9a884), cycle = lin(0x8a5a52), lot = lin(0x55585e), bay = lin(0xe8e4d8), plaza = lin(0xb8b2a4), zebra = lin(0xf2efe6);
  const roads = win.roads || [], areas = win.areas || [], wide = roads.filter(r => (r.w || 5) >= 5 && !FOOT.has(r.kind) && r.kind !== 'cycleway' && r.pts && r.pts.length >= 2);
  for (const r of wide) { const w = r.w || 5; S.along(r.pts, (a, b) => { for (const sg of [1, -1]) { S.quad(a, b, 1.6, walk, 0.32, sg * (w / 2 + 0.8)); S.quad(a, b, 0.16, curb, 0.34, sg * (w / 2 + 0.06)); } }); }
  for (const r of roads) { if (!r.pts || r.pts.length < 2) continue; if (FOOT.has(r.kind)) S.along(r.pts, (a, b) => S.quad(a, b, Math.max(1.2, r.w || 2), foot, 0.3)); else if (r.kind === 'cycleway') S.along(r.pts, (a, b) => S.quad(a, b, r.w || 2, cycle, 0.3)); }
  // zebra crossings: a footway's end within 3 m of a wide road gets stripes across that road
  let crossings = 0;
  const nearest = (p) => { let best = null; for (const r of wide) for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1, t = clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / L2, 0, 1), cx = a.x + dx * t, cz = a.z + dz * t, d = Math.hypot(p.x - cx, p.z - cz); if (d < 3 && (!best || d < best.d)) best = { d, x: cx, z: cz, ux: dx / Math.sqrt(L2), uz: dz / Math.sqrt(L2), w: r.w || 5 }; } return best; };
  for (const r of roads) { if (!FOOT.has(r.kind) || !r.pts || r.pts.length < 2 || crossings >= 200) continue;
    for (const p of [r.pts[0], r.pts[r.pts.length - 1]]) { const n = nearest(p); if (!n) continue; crossings++;
      for (let k = -2; k <= 2; k++) { const ox = n.ux * k * 1.0, oz = n.uz * k * 1.0, nx = -n.uz, nz = n.ux; S.quad({ x: n.x + ox - nx * n.w / 2, z: n.z + oz - nz * n.w / 2 }, { x: n.x + ox + nx * n.w / 2, z: n.z + oz + nz * n.w / 2 }, 0.5, zebra, 0.28); } } }
  // parking lots and plazas: filled, lots with white bay lines along their longest edge
  for (const a of areas) { const ring = a.ring; if (!ring || ring.length < 3) continue;
    if (a.kind === 'plaza') { S.polygon(ring, plaza, 0.22); continue; }
    S.polygon(ring, lot, 0.22);
    let bi = 0, bl = 0; for (let i = 0; i < ring.length; i++) { const q = ring[(i + 1) % ring.length], L = Math.hypot(q.x - ring[i].x, q.z - ring[i].z); if (L > bl) { bl = L; bi = i; } }
    const A = ring[bi], B = ring[(bi + 1) % ring.length], ux = (B.x - A.x) / bl, uz = (B.z - A.z) / bl, vx = -uz, vz = ux;
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity; for (const p of ring) { const u = (p.x - A.x) * ux + (p.z - A.z) * uz, v = (p.x - A.x) * vx + (p.z - A.z) * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const inside = (x, z) => { let ok = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const p = ring[i], q = ring[j]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) ok = !ok; } return ok; };
    let bays = 0;
    for (let v = v0 + 1.5; v + 5 <= v1 && bays < 400; v += 7) for (let u = u0 + 1.5; u <= u1 - 1.5 && bays < 400; u += 2.5) {
      const p0 = { x: A.x + ux * u + vx * v, z: A.z + uz * u + vz * v }, p1 = { x: A.x + ux * u + vx * (v + 5), z: A.z + uz * u + vz * (v + 5) };
      if (inside(p0.x, p0.z) && inside(p1.x, p1.z) && inside((p0.x + p1.x) / 2, (p0.z + p1.z) / 2)) { S.quad(p0, p1, 0.12, bay, 0.24); bays++; } }
  }
  const mesh = S.mesh('streets'); G.streets = mesh; return mesh;
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

window.Ground = { streets, FOOT, make, drape, recolour, crater, roads, daylight, bakedField, centredField, MOSS };
})();
