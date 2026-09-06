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
  const m = G.mesh.material; m.map = tex; m.vertexColors = false; m.color.set(0xffffff); m.needsUpdate = true;
  G.imagery = imagery;
}

/** Roads as dark tile strips following the ground, one merged mesh. Widths in metres. */
function roads(G, list, M) {
  const P = [], N = [], C = [], c = new THREE.Color(0x3f4247).convertSRGBToLinear(), lift = 0.12;
  const quad = (a, b, w) => {                      // a,b: {x,z} metres; a strip of width w between them
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < 0.05) return;
    const nx = -dz / L * w / 2, nz = dx / L * w / 2;
    const p = [[a.x + nx, a.z + nz], [a.x - nx, a.z - nz], [b.x - nx, b.z - nz], [b.x + nx, b.z + nz]].map(([x, z]) => [x * M, (G.hM(x, z) + lift) * M, z * M]);
    for (const k of [0, 1, 2, 0, 2, 3]) { P.push(...p[k]); N.push(0, 1, 0); C.push(c.r, c.g, c.b); }
  };
  for (const r of list) {
    const pts = r.pts; if (!pts || pts.length < 2) continue;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), steps = Math.max(1, Math.ceil(L / 8));
      for (let s = 0; s < steps; s++) quad({ x: lerp(a.x, b.x, s / steps), z: lerp(a.z, b.z, s / steps) }, { x: lerp(a.x, b.x, (s + 1) / steps), z: lerp(a.z, b.z, (s + 1) / steps) }, r.w || 5);
    }
  }
  if (!P.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  mesh.name = 'roads'; G.roads = mesh; return mesh;
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

window.Ground = { make, drape, recolour, roads, daylight, bakedField, centredField, MOSS };
})();
