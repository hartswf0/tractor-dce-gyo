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
  monument: { name: 'a monument valley', fog: [0xd9aa88, 60, 760], sky: 0xdcae8c, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 7) * 0.05, w = 0.025 * Math.sin(x * 0.07 + z * 0.05); return [0.64 + j + w, 0.43 + j * 0.8 + w, 0.28 + j * 0.5]; } },   // red earth, a dusty haze, mesas standing round the horizon
  hall: { name: 'a hall', paint: (h, sl, x, z) => [0.47, 0.41, 0.31], fog: [0x1a1410, 60, 220], sky: 0x0d0a08 },
  /* the trailer's grounds: paint, fog and sky only; what stands on them is built by the scene */
  dunes: { name: 'sand dunes', fog: [0x9a8c72, 20, 260], sky: 0xa8a49a, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 7) * 0.05, w = 0.03 * Math.sin(x * 0.36 + z * 0.12); return [0.56 + j + w, 0.44 + j + w, 0.27 + w]; }, rel: true },
  shore: { name: 'a shoreline', fog: [0xcfd6d8, 60, 700], sky: 0xc9d6de, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 7) * 0.04; if (z < -6) { const d = Math.min(1, (-6 - z) / 12); return [0.22 - d * 0.10, 0.30 - d * 0.08, 0.36 - d * 0.05]; } if (z < -3) return [0.62 + j, 0.58 + j, 0.46]; return [0.80 + j, 0.70 + j, 0.48]; }, rel: true },   // the sea lies six metres north of the line, wet sand before it: a camera on the sand looks past the figures to the water   
  sea: { name: 'the open sea', fog: [0x6c7b86, 40, 420], sky: 0x8797a3, paint: (h, sl, x, z) => { const w = 0.04 * Math.sin(x * 0.48 + z * 0.32) + 0.03 * Math.sin(z * 0.88 - x * 0.2); return [0.16 + w, 0.24 + w, 0.32 + w]; }, rel: true },
  ridge: { name: 'a pine ridge over the sea', fog: [0xc4cdd0, 30, 320], sky: 0xd8dfe3, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 5) * 0.06; if (z > 26) { const w = 0.03 * Math.sin(x * 0.5 + z * 0.3); return [0.24 + w, 0.34 + w, 0.42 + w]; } if (z > 15) return [0.70 + j, 0.62 + j, 0.46]; return [0.16 + j, 0.14 + j, 0.09 + j * 0.5]; }, rel: true },   // the slope's floor, then a beach at 15 m, then the sea from 26 m south
  crag: { name: 'a mountain crag', fog: [0xd6dbe0, 30, 300], sky: 0xdfe4e9, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 11) * 0.06; return [0.42 + j, 0.42 + j, 0.40 + j]; } },
  ash: { name: 'a black sand plain', fog: [0x5a5c5e, 8, 120], sky: 0x66686a, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 13) * 0.04; return [0.08 + j, 0.08 + j, 0.09 + j]; } },
  cave: { name: 'a cavern', fog: [0x060402, 10, 90], sky: 0x030201, paint: (h, sl, x, z) => { const j = hash(x | 0, z | 0, 17) * 0.05; return [0.20 + j, 0.17 + j, 0.14 + j]; } },
  chamber: { name: 'a bedchamber', fog: [0x080604, 6, 60], sky: 0x040302, paint: (h, sl, x, z) => [0.30, 0.25, 0.19] },
  stage: { name: 'a bare stage', paint: (h, sl, x, z) => [0.86, 0.84, 0.79], fog: [0xe8e5dd, 120, 400], sky: 0xe4e1d9 },   // the casting stage: pale floor, pale sky, nothing on it
};
/** Distance from a point to a polyline (metres in, metres out). */
function distToPath(x, z, path) {
  let best = Infinity; if (!path || path.length < 2) return best;
  for (let i = 0; i < path.length - 1; i++) { const a = path[i], b = path[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); }
  return best;
}
function lay(kind, opts) {
  const { scene, G, M, centre, r = 180, seed = 1, corridor = null } = opts;
  const K = KINDS[kind] || KINDS.forest, S = { kind, name: K.name, paint: K.rel ? (h, sl, x, z, lo, hi) => K.paint(h, sl, x - centre.x / M, z - centre.z / M, lo, hi) : K.paint,   /* a ground drawn about its own centre (a shoreline, a swell): the ground paints in metres, the centre is kept in LDU */ fog: K.fog, sky: K.sky, group: new THREE.Group(), trunks: [], logs: [], drifts: 0, ferns: 0, cells: new Map(), M, centre: { x: centre.x, z: centre.z }, r };
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
  } else if (kind === 'monument') {
    /* a LEGO monument valley: the desert floor a baseplate (a studded overlay on the painted ground), the horizon mesas in brick courses on
       a talus, and the flat strewn with LEGO: outcrops of stacked studded bricks, sage of stacked round green plates, and grit, thousands of
       loose plates, tiles and round pieces in the earth's colours. Nothing is laid in the keep-out boxes (the homestead, the pool, the buttes). */
    const rm = r / M, keep = (x, z, pad = 0) => (opts.keepOut || []).some(b => x > b[0] - pad && x < b[2] + pad && z > b[1] - pad && z < b[3] + pad);
    const legoMat = (map, extra = {}) => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0, map: map || null, ...extra });
    /** A brick w × d studs, h plates, base at y 0, in LDU: its body and its studs, one geometry. */
    const brickGeom = (w, d, h, studs = true, round = false) => {
      const parts = [], body = round ? new THREE.CylinderGeometry(w * 10, w * 10, h * 8, 16) : new THREE.BoxGeometry(w * 20, h * 8, d * 20); body.translate(0, h * 4, 0); parts.push(body.toNonIndexed());
      if (studs) for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { if (round && (w > 1)) { if (i || j) continue; } const st = new THREE.CylinderGeometry(6, 6, 3.4, 12); st.translate(round ? 0 : (i - (w - 1) / 2) * 20, h * 8 + 1.7, round ? 0 : (j - (d - 1) / 2) * 20); parts.push(st.toNonIndexed()); }
      const n = parts.reduce((t, g) => t + g.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
      for (const g of parts) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
      const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return out;
    };
    const instL = (geom, n, name, map, shadow = true) => { const im = inst(geom, n, name); im.material = legoMat(map); im.castShadow = shadow; im.receiveShadow = true; return im; };
    // the baseplate: a studded overlay a hair over the painted ground, two metres of texture holding four studs a side
    { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.clearRect(0, 0, 256, 256);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = 32 + i * 64, y = 32 + j * 64; g.fillStyle = 'rgba(0,0,0,0.13)'; g.beginPath(); g.arc(x + 4, y + 5, 20, 0, 7); g.fill(); g.fillStyle = 'rgba(255,235,210,0.08)'; g.beginPath(); g.arc(x, y, 19, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 17, Math.PI * 0.95, Math.PI * 1.6); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 19, 0, 7); g.stroke(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; const size = 2 * rm; t.repeat.set(size / 2, size / 2); t.anisotropy = 8;
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(size * M, size * M), (() => { const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }), holes = (opts.keepOut || []).slice(0, 6).map(b => new THREE.Vector4(b[0] * M, b[1] * M, b[2] * M, b[3] * M)); while (holes.length < 6) holes.push(new THREE.Vector4(1e9, 1e9, 1e9, 1e9));
        /* the models lay their own floors (the yard's tiles, the plank floor, the pool): the baseplate is cut away under them */
        m.onBeforeCompile = sh => { sh.uniforms.holes = { value: holes }; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWorldP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorldP = (modelMatrix * vec4(position, 1.0)).xyz;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWorldP;\nuniform vec4 holes[6];').replace('void main() {', 'void main() {\n  for (int i = 0; i < 6; i++) { vec4 hb = holes[i]; if (vWorldP.x > hb.x && vWorldP.x < hb.z && vWorldP.z > hb.y && vWorldP.z < hb.w) discard; }'); };
        return m; })()); plane.rotation.x = -Math.PI / 2; plane.position.set(cx * M, gh(cx, cz) + 0.2, cz * M); plane.name = 'set:baseplate'; plane.renderOrder = 1; S.group.add(plane); }
    // the horizon: mesas and buttes as the painters stand them, from 190 to 560 m: a talus, a sheer body, a narrower upper tier set off its
    // centre, a cap rock; the faces in horizontal sandstone strata (no vertical joints: those read as windows), the haze laying each range back
    const courses = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const g = c.getContext('2d'); let y = 0, k = 0;
      while (y < 512) { const hgt = 6 + Math.floor(hash(k, 91, seed) * 22), v = 0.8 + hash(k, 92, seed) * 0.2, warm = hash(k, 93, seed) * 0.06; g.fillStyle = `rgb(${Math.round(255 * v)},${Math.round(255 * (v - warm))},${Math.round(255 * (v - warm * 1.6))})`; g.fillRect(0, y, 64, hgt); g.fillStyle = 'rgba(40,10,0,0.18)'; g.fillRect(0, y + hgt - 1, 64, 1); y += hgt; k++; }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); return t; })();
    const nM = 30, mesas = instL(box, nM, 'mesas', courses), tiers = instL(box, nM, 'mesa tiers', courses), talus = inst(flare, nM, 'talus'), caps = instL(box, nM * 2, 'caps', courses), reds = [0xc08556, 0xb87a4c, 0xc98f5e, 0xb07448, 0xc4895a].map(lin), cap = lin(0xd6ad80);   /* sandstone the colour of the flat, a shade darker: the horizon stays light, so a figure in the door is a dark shape against it */
    for (let i = 0; i < nM; i++) {
      const a = (i / nM) * 6.283 + (hash(i, 21, seed) - 0.5) * 0.14, d = 190 + hash(i, 22, seed) * 370, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, y = gh(x, z);
      const w = (40 + hash(i, 23, seed) * 150) * M, dd = (20 + hash(i, 24, seed) * 40) * M, h = (12 + hash(i, 25, seed) * 20) * M, yaw = a + Math.PI / 2 + (hash(i, 26, seed) - 0.5) * 0.5, spire = hash(i, 27, seed) > 0.82;
      const sw = spire ? w * 0.12 : w, sd = spire ? dd * 0.35 : dd, hh = spire ? h * 1.8 : h, col = reds[i % 5];
      put(talus, x * M, y + hh * 0.2, z * M, sw * 1.05, hh * 0.4, sd * 1.05, yaw, 0, reds[(i + 2) % 5]);
      put(mesas, x * M, y + hh * 0.36, z * M, sw * 0.72, hh * 0.72, sd * 0.72, yaw, 0, col);
      const off = (hash(i, 28, seed) - 0.5) * sw * 0.3, tw = sw * (0.35 + hash(i, 29, seed) * 0.3), th = hh * (spire ? 0.5 : 0.28 + hash(i, 30, seed) * 0.3), ox = Math.cos(yaw) * off, oz = -Math.sin(yaw) * off;
      put(tiers, x * M + ox, y + hh * 0.72 + th / 2, z * M + oz, tw, th, sd * 0.55, yaw, 0, col);
      put(caps, x * M, y + hh * 0.72 + 0.4 * M, z * M, sw * 0.74, 0.8 * M, sd * 0.74, yaw, 0, cap);
      put(caps, x * M + ox, y + hh * 0.72 + th + 0.4 * M, z * M + oz, tw * 1.03, 0.8 * M, sd * 0.57, yaw, 0, cap);
    }
    // outcrops: clusters of stacked studded bricks, stepped in, in the rock's reds and ochres (no greys: the Western painters' rock is warm in the light and violet in the shade, never grey)
    const b24 = brickGeom(2, 4, 3), b22 = brickGeom(2, 2, 3), s12 = brickGeom(1, 2, 3), rockCols = [0x7c3c1e, 0x8a4a28, 0x6b3a22, 0x9c5a34, 0xa4552a, 0x5e2e18].map(lin);
    const nR = Math.round(rm / 3), ob24 = instL(b24, nR * 6, 'outcrop 2x4'), ob22 = instL(b22, nR * 6, 'outcrop 2x2'), ob12 = instL(s12, nR * 4, 'outcrop 1x2');
    for (let i = 0; i < nR; i++) { const a = hash(i, 1, seed) * 6.283, d = 14 + Math.sqrt(hash(i, 2, seed)) * rm, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (corridor && distToPath(x, z, corridor) < 10) continue; if (keep(x, z, 3)) continue;
      const sc = 1 + hash(i, 3, seed) * 2.2, layers = 1 + Math.floor(hash(i, 4, seed) * 3), yaw = hash(i, 5, seed) * 6.283, col = rockCols[Math.floor(hash(i, 6, seed) * rockCols.length)], y0 = gh(x, z);
      for (let L = 0; L < layers; L++) { const k = 3 - L; for (let n = 0; n < k; n++) { const ox = (hash(i, 10 + L * 5 + n, seed) - 0.5) * (k * 30) * sc, oz = (hash(i, 40 + L * 5 + n, seed) - 0.5) * (k * 30) * sc, im = n % 3 === 0 ? ob24 : n % 3 === 1 ? ob22 : ob12;
        put(im, x * M + ox, y0 + L * 24 * sc, z * M + oz, sc, sc, sc, yaw + n * 1.57, 0, col); } } }
    // sage: stacked round plates, a darker green below and a sage green above
    const rp4 = brickGeom(2, 2, 1, true, true), rp2 = brickGeom(1, 1, 1, true, true), nS = Math.round(rm * 3.2), sageLo = instL(rp4, nS * 2, 'sage'), sageHi = instL(rp2, nS * 2, 'sage top'), sageC = lin(0x5f6f48), sageC2 = lin(0x7d8a62), sageC3 = lin(0x8a9870);
    for (let i = 0; i < nS; i++) { const a = hash(i, 11, seed) * 6.283, d = 10 + Math.sqrt(hash(i, 12, seed)) * rm, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (corridor && distToPath(x, z, corridor) < 9) continue; if (keep(x, z, 1)) continue;
      const sc = 1.2 + hash(i, 13, seed) * 1.6, y0 = gh(x, z), yaw = hash(i, 14, seed) * 6.28; put(sageLo, x * M, y0, z * M, sc * 1.3, sc, sc * 1.3, yaw, 0, sageC); put(sageLo, x * M + 6 * sc, y0 + 8 * sc, z * M - 4 * sc, sc, sc, sc, yaw, 0, sageC2); put(sageHi, x * M - 3 * sc, y0 + 16 * sc, z * M + 2 * sc, sc * 1.4, sc, sc * 1.4, yaw, 0, sageC3); put(sageHi, x * M + 10 * sc, y0 + 8 * sc, z * M + 9 * sc, sc, sc, sc, yaw, 0, sageC); }
    // grit: loose LEGO in the earth's colours, thickest near the house and the riders' line, thinning out to 90 m
    const g11 = brickGeom(1, 1, 1, true, true), p12 = brickGeom(1, 2, 1), t11 = brickGeom(1, 1, 1, false), p22 = brickGeom(2, 2, 1), gritCols = [0xb0784a, 0x9c5a34, 0x8a4a2a, 0xc08a5a, 0x7a3f22, 0xa86a3e].map(lin);   /* the earth's own reds and ochres, close in value to the ground: texture, not litter */
    const nG = 700, gi = [instL(g11, nG, 'grit round', null, false), instL(p12, nG, 'grit 1x2', null, false), instL(t11, nG, 'grit tile', null, false), instL(p22, nG, 'grit 2x2', null, false)];   // grit casts no shadow: it lies flat, and a few thousand shadow casters slow every frame
    for (let i = 0; i < nG * 4; i++) { const a = hash(i, 61, seed) * 6.283, d = 60 + hash(i, 62, seed) * Math.max(10, Math.min(140, rm) - 60), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (keep(x, z, 0.5)) continue; if (corridor && distToPath(x, z, corridor) < 12) continue;   /* grit only past 60 m, where it reads as the ground's texture; near the house and the cameras the earth is kept clean, so figures read against it */
      put(gi[i % 4], x * M, gh(x, z), z * M, 1, 1, 1, hash(i, 63, seed) * 6.283, 0, gritCols[Math.floor(hash(i, 64, seed) * gritCols.length)]); }
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
  S.group.traverse(o => { if (o.isMesh || o.isInstancedMesh) { o.castShadow = true; o.receiveShadow = true; } });
  S.drop = () => { scene.remove(S.group); S.group.traverse(o => { if (o.isInstancedMesh) { o.geometry.dispose(); o.material.dispose(); } }); S.trunks = []; S.logs = []; S.cells.clear(); };
  return S;
}
/* the ground's shape under a set, in metres about the set's centre: a dune field, a hill with a plateau, a slope, a swell, a shore that runs down into the sea */
const hash2 = (x, z) => { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return v - Math.floor(v); };
const RELIEF = {
  dunes: (x, z) => 2.6 * Math.sin(x * 0.085 + 1.2 * Math.sin(z * 0.04)) + 1.6 * Math.sin(z * 0.11 + x * 0.03) + 0.6 * Math.sin(x * 0.3 + z * 0.23) + 2.4,
  hill: (x, z) => { const d = Math.hypot(x, z); return d < 14 ? 16 : d < 22 ? 16 - (d - 14) / 8 * 12 : Math.max(0, 4 - (d - 22) * 0.35); },
  slope: (x, z) => Math.max(0, -z * 0.22) + 0.3 * Math.sin(x * 0.4) * Math.sin(z * 0.3),
  swell: (x, z) => 0.9 * Math.sin(x * 0.24 + z * 0.1) + 0.5 * Math.sin(z * 0.41 - x * 0.07) + 0.25 * Math.sin(x * 0.9 + z * 0.6),
  shore: (x, z) => z < -6 ? -0.8 - Math.min(1.2, (-6 - z) * 0.05) + 0.25 * Math.sin(x * 0.3 + z * 0.5) : Math.min(3, (z + 6) * 0.09) + 0.4 * Math.sin(x * 0.12) * Math.sin(z * 0.2),
  ash: (x, z) => 0.5 * Math.sin(x * 0.15) * Math.sin(z * 0.11) + 0.15 * hash2(Math.round(x / 2), Math.round(z / 2)),
};
window.Sets = { lay, KINDS, RELIEF, distToPath };
})();
