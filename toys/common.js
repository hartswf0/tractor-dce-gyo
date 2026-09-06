/* toys/common.js — what the twelve stepping stones share.

   One ship (the 108-part 75421 TIE, loaded once from the full part pack), one
   ground (Hlíðarendi, the real hillside HLIÐARENDI walks on, at 1 m = 16 LDU),
   one loop, one overlay for drawing vectors, and a pointer layer that hands a
   toy raw touches. Everything a toy is *about* lives in the toy's own page.

   A toy calls Toy.boot({ title, notice, setup(T), step(T, dt), draw(T, g), state(T), hooks })
   and gets T: { engine, scene, camera, ship, parts, wings, outpost, pos, quat, groundH, ... }. */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const DEG = Math.PI / 180;
const M = 16;                                     // LDU per metre: the LEGO ship is treated as a real 9 m fighter
const UP = new THREE.Vector3(0, 1, 0), Z1 = new THREE.Vector3(0, 0, 1), X1 = new THREE.Vector3(1, 0, 0);
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), V4 = new THREE.Vector3();
const Q1 = new THREE.Quaternion(), M1 = new THREE.Matrix4(), BOX = new THREE.Box3(), SPH = new THREE.Sphere();

const CSS = `
:root{--ink:#1a1f2a;--dim:#4b5566;--gold:#c8901c;--red:#d8382e;--blue:#1f78a8;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;background:#b8cbd8;color:var(--ink);overflow:hidden;font:15px/1.4 var(--sans);-webkit-user-select:none;user-select:none;overscroll-behavior:none}
#stage{position:fixed;inset:0}#stage canvas{display:block;width:100%;height:100%;touch-action:none}
#ov{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:3}
#top{position:fixed;left:0;right:0;top:0;padding:calc(10px + env(safe-area-inset-top)) 14px 8px;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none;z-index:4;gap:12px}
#top a{pointer-events:auto;color:var(--dim);text-decoration:none;font:11px var(--mono);letter-spacing:.14em;text-transform:uppercase}
#top .t{font:11px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
#top .n{font-size:17px;font-weight:700;letter-spacing:.01em;margin-top:2px}
#read{font:11px/1.5 var(--mono);color:var(--dim);text-align:right;white-space:pre;max-width:60vw}
#notice{position:fixed;left:14px;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));font-size:13px;color:var(--dim);text-align:center;pointer-events:none;z-index:4;letter-spacing:.02em}
#veil{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(184,203,216,.9);z-index:9;text-align:center;padding:24px;transition:opacity .3s}
#veil.gone{opacity:0;pointer-events:none}
#veil .k{font:11px var(--mono);letter-spacing:.24em;text-transform:uppercase;color:var(--dim)}
#veil h1{margin:8px 0 6px;font-size:30px;font-weight:900;letter-spacing:-.01em}
#veil .m{color:var(--dim);font-size:13px;max-width:320px}
#veil button{margin-top:18px;height:48px;padding:0 28px;font:inherit;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#fff;background:var(--red);border:none;border-radius:14px}
#keys{display:none;position:fixed;left:50%;bottom:calc(40px + env(safe-area-inset-bottom));transform:translateX(-50%);font:11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--dim);white-space:nowrap;z-index:4;pointer-events:none}
@media (hover:hover) and (pointer:fine){#keys{display:block}}`;

const T = {
  M, DEG, UP, clamp, lerp, V1, V2, V3, V4, Q1, M1,
  engine: null, scene: null, camera: null, renderer: null,
  ship: null, parts: [], wings: { left: [], right: [] }, outpost: null, PATH: null,
  pos: new THREE.Vector3(), quat: new THREE.Quaternion(), vel: new THREE.Vector3(),
  pointers: new Map(), keys: new Set(), t: 0, ready: false,
  sticks: { L: { x: 0, y: 0, mag: 0, id: null, held: false }, R: { x: 0, y: 0, mag: 0, id: null, held: false } },   // one thumb per half, always tracked
  bolts: [], calls: 0, groundVerts: 0,
};
let spec = null, overlay = null, g2 = null, last = 0, readText = '';

/* ───────────────────────── ground: Hlíðarendi, as HLIÐARENDI reads it ───────────────────────── */
const GROUND = { TG: null, H: null, n: 0, res: 0, cx: 0, cy: 0, mesh: null };
function decodeTerrain() {
  const TR = window.TERRAIN, n = TR.n, bin = atob(TR.b64), a = new Float32Array(n * n), scale = (TR.max - TR.min) / 65535;
  for (let i = 0; i < n * n; i++) a[i] = TR.min + ((bin.charCodeAt(i * 2)) | (bin.charCodeAt(i * 2 + 1) << 8)) * scale;
  GROUND.TG = a; GROUND.n = n; GROUND.res = TR.res; GROUND.cx = TR.cx; GROUND.cy = TR.cy;
}
function rawTerrain(x, z) {                        // metres, bilinear on the raw samples
  const n = GROUND.n, gi = clamp(GROUND.cx + x / GROUND.res, 0, n - 1.001), gj = clamp(GROUND.cy + z / GROUND.res, 0, n - 1.001);
  const i0 = Math.floor(gi), j0 = Math.floor(gj), fx = gi - i0, fz = gj - j0, TG = GROUND.TG;
  const h00 = TG[j0 * n + i0], h10 = TG[j0 * n + i0 + 1], h01 = TG[(j0 + 1) * n + i0], h11 = TG[(j0 + 1) * n + i0 + 1];
  return (h00 * (1 - fx) + h10 * fx) * (1 - fz) + (h01 * (1 - fx) + h11 * fx) * fz;
}
function bakeGround() {                            // a levelled yard at the origin, blended into the hillside
  const n = GROUND.n, res = GROUND.res, PAD = { x: 0, z: 0, hx: 12, hz: 12, blend: 12 };
  const datum = rawTerrain(0, 0), padH = datum;
  GROUND.H = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    const z = (j - GROUND.cy) * res, rz = Math.max(0, Math.abs(z - PAD.z) - PAD.hz);
    for (let i = 0; i < n; i++) {
      const x = (i - GROUND.cx) * res, rx = Math.max(0, Math.abs(x - PAD.x) - PAD.hx);
      const r = Math.hypot(rx, rz), t = clamp(r / PAD.blend, 0, 1), mask = t * t * (3 - 2 * t);
      GROUND.H[j * n + i] = padH * (1 - mask) + GROUND.TG[j * n + i] * mask - datum;
    }
  }
}
function terrainH(x, z) {                          // metres; the same triangle PlaneGeometry draws
  const n = GROUND.n, H = GROUND.H;
  const gi = clamp(GROUND.cx + x / GROUND.res, 0, n - 1.0001), gj = clamp(GROUND.cy + z / GROUND.res, 0, n - 1.0001);
  const i0 = Math.floor(gi), j0 = Math.floor(gj), fx = gi - i0, fz = gj - j0;
  const h00 = H[j0 * n + i0], h10 = H[j0 * n + i0 + 1], h01 = H[(j0 + 1) * n + i0], h11 = H[(j0 + 1) * n + i0 + 1];
  return fx + fz <= 1 ? h00 + fx * (h10 - h00) + fz * (h01 - h00) : h11 + (1 - fx) * (h01 - h11) + (1 - fz) * (h10 - h11);
}
T.groundH = (x, z) => terrainH(x / M, z / M) * M;  // LDU in, LDU out
T.groundExtent = () => (GROUND.n - 1) * GROUND.res * M;
function buildGroundMesh(scene) {
  const NG = GROUND.n, N = NG - 1, SZ = N * GROUND.res, g = new THREE.PlaneGeometry(SZ, SZ, N, N); g.rotateX(-Math.PI / 2);
  g.translate(SZ / 2 - GROUND.cx * GROUND.res, 0, SZ / 2 - GROUND.cy * GROUND.res);
  const pos = g.attributes.position, col = [];
  const jit = (x, z) => { const v = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return v - Math.floor(v); };
  const at = (i, j) => GROUND.H[clamp(j, 0, NG - 1) * NG + clamp(i, 0, NG - 1)];
  for (let i = 0; i < pos.count; i++) {
    const ix = i % NG, iy = (i / NG) | 0, x = pos.getX(i), z = pos.getZ(i), h = at(ix, iy); pos.setY(i, h);
    const d = GROUND.res, sl = Math.hypot(at(ix + 1, iy) - at(ix - 1, iy), at(ix, iy + 1) - at(ix, iy - 1)) / (2 * d);
    const nz = jit(x, z) * .05 - .025;
    let r, gr, b;
    if (h < -46) { r = .46; gr = .44; b = .39; }                                          // Markarfljót outwash plain
    else if (sl > .52) { r = .47; gr = .45; b = .42; }                                    // rock
    else { const t = clamp((h + 46) / 60, 0, 1); r = lerp(.40, .56, t); gr = lerp(.47, .56, t); b = lerp(.30, .40, t); }   // moss → grass
    const shade = 1 - clamp(sl * .55, 0, .28);
    col.push(clamp(r * shade + nz, 0, 1), clamp(gr * shade + nz, 0, 1), clamp(b * shade + nz, 0, 1));
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  mesh.scale.setScalar(M); mesh.name = 'ground'; scene.add(mesh); GROUND.mesh = mesh; T.groundVerts = pos.count;
}
/* HLIÐARENDI's day preset. The reference renders on three r180: colours managed (hex → linear),
   sRGB output, physically based light units. r128 has none of that by default, so the same look is
   built by hand: sRGB output encoding, every authored colour converted to linear once, and the light
   intensities divided by π (r128's legacy Lambert term is π brighter for the same number). */
function daylight(scene) {
  T.renderer.outputEncoding = THREE.sRGBEncoding;
  const lin = c => new THREE.Color(c).convertSRGBToLinear();
  scene.background = new THREE.Color(0xb8cbd8);      // r128 clears with the raw colour, unencoded
  scene.fog = new THREE.Fog(lin(0xc9d4d2), 30 * M, 900 * M);
  scene.traverse(o => { if (o.isAmbientLight || o.isDirectionalLight) o.intensity = 0; });
  const hemi = new THREE.HemisphereLight(lin(0xffffff), lin(0xd8d8d8), 1.35 / Math.PI); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.25 / Math.PI); dir.position.set(2, 3, 2).multiplyScalar(1000); scene.add(dir);
  const seen = new Set();                          // LDraw colours are sRGB hex: linearise each material once
  for (const m of T.engine.loader.materials || []) for (const x of [m, m.userData && m.userData.edgeMaterial]) {
    if (x && x.color && !seen.has(x)) { seen.add(x); x.color.convertSRGBToLinear(); if (x.emissive) x.emissive.convertSRGBToLinear(); }
  }
}

/* ───────────────────────── the ship: one parse, part groups kept ───────────────────────── */
const ID = 'VADER-TIE';
function sphereOf(obj) { BOX.setFromObject(obj).getBoundingSphere(SPH); return SPH; }
function regroup(parts, name) { const w = new THREE.Group(); w.name = name; T.scene.add(w); for (const p of parts) w.attach(p); w.updateMatrixWorld(true); return w; }
async function loadShip() {
  const engine = T.engine;
  const [path, full] = await Promise.all([
    fetch('../assembly-paths/' + ID + '.json').then(r => r.json()),
    fetch('../assembly-paths/' + ID + '-full.mpd.txt').then(r => r.ok ? r.text() : ''),
  ]);
  T.PATH = path;
  engine.loader.separateObjects = true;
  const text = ['0 FILE toy.ldr', '0 !LDRAW_ORG Unofficial_Model', ...path.lines].join('\n') + '\n\n' + full;
  const root = await engine.loadText(text, { name: 'toy' }, 'toy.mpd');
  if (root.children.length !== path.lines.length) throw new Error(`expected ${path.lines.length} part groups, got ${root.children.length}`);
  T.parts = root.children.slice();
  root.updateMatrixWorld(true);
  T.parts.forEach((g, i) => {
    g.name = path.lines[i].split(/\s+/)[14]; g.userData.index = i;
    const s = sphereOf(g); g.userData.r = Math.max(6, s.radius); g.userData.centre = s.center.clone();
    g.traverse(o => { if (o.isMesh && o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) m.fog = true; } });
  });
  // parts 108–148 are the outpost, the trooper and Vader: a landmark on the levelled yard
  T.outpost = regroup(T.parts.slice(108), 'outpost');
  T.outpost.position.set(0, 120, 270);            // its base sat at world y −120 and z −270 in the kit
  T.outpost.updateMatrixWorld(true);
  T.parts.length = 108;
  T.ship = engine.modelWrapper;
  T.wings.right = [...T.parts.slice(18, 22), ...T.parts.slice(26, 67)];   // +x pylon and wing
  T.wings.left = [...T.parts.slice(22, 26), ...T.parts.slice(67, 108)];   // −x pylon and wing
  T.pod = T.parts.slice(0, 18);
}

/* ───────────────────────── input: raw pointers, a stick shaper, a picker ───────────────────────── */
function bindInput() {
  const stage = $('#stage');
  const on = (name, ...a) => { if (spec[name]) spec[name](T, ...a); };
  stage.addEventListener('pointerdown', e => {
    if (e.target.tagName !== 'CANVAS') return; e.preventDefault(); stage.setPointerCapture(e.pointerId);
    const p = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, px: e.clientX, py: e.clientY, t0: performance.now(), t: performance.now(), moved: 0, vx: 0, vy: 0, left: e.clientX < innerWidth * 0.5 };
    T.pointers.set(e.pointerId, p);
    const st = T.sticks[p.left ? 'L' : 'R']; if (st.id == null) { st.id = p.id; st.held = true; st.x = st.y = st.mag = 0; }
    on('onDown', p);
    if (T.pointers.size >= 2) on('onMulti', [...T.pointers.values()]);
  }, { passive: false });
  stage.addEventListener('pointermove', e => {
    const p = T.pointers.get(e.pointerId); if (!p) return;
    const now = performance.now(), dt = Math.max(1, now - p.t) / 1000;
    p.vx = (e.clientX - p.x) / dt; p.vy = (e.clientY - p.y) / dt;
    p.px = p.x; p.py = p.y; p.x = e.clientX; p.y = e.clientY; p.t = now;
    p.moved = Math.max(p.moved, Math.hypot(p.x - p.x0, p.y - p.y0));
    const st = T.sticks[p.left ? 'L' : 'R']; if (st.id === p.id) Object.assign(st, T.stickFrom(p.x - p.x0, p.y - p.y0));
    on('onMove', p);
  });
  const end = e => {
    const p = T.pointers.get(e.pointerId); if (!p) return;
    T.pointers.delete(e.pointerId);
    const st = T.sticks[p.left ? 'L' : 'R']; if (st.id === p.id) { st.id = null; st.held = false; st.x = st.y = st.mag = 0; }
    const age = performance.now() - p.t0;
    on('onUp', p);
    if (p.moved < 14 && age < 320) on('onTap', p);
    else if (p.moved > 24 && age < 700) on('onSwipe', p, (p.x - p.x0) / (age / 1000), (p.y - p.y0) / (age / 1000));
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end); window.addEventListener('pointerup', end);
  window.addEventListener('keydown', e => { if (/INPUT|TEXTAREA/.test(e.target.tagName)) return; if (!T.keys.has(e.code)) on('onKey', e.code, true); T.keys.add(e.code); if (/^(Space|Arrow)/.test(e.code)) e.preventDefault(); });
  window.addEventListener('keyup', e => { T.keys.delete(e.code); on('onKey', e.code, false); });
  window.addEventListener('blur', () => T.keys.clear());
}
const curve = x => Math.sign(x) * Math.pow(Math.abs(x), 1.5);
T.stickFrom = (dx, dy, R = 90) => {               // pixels from an anchor → a curved, dead-zoned stick, y up
  let m = Math.hypot(dx, dy) / R; if (m > 1) { dx /= m; dy /= m; m = 1; }
  if (m < 0.08) return { x: 0, y: 0, mag: 0 };
  const g = curve((m - 0.08) / 0.92) / m;
  return { x: dx / R * g, y: -dy / R * g, mag: Math.min(1, m) };
};
T.stickL = () => T.sticks.L.held ? T.sticks.L : T.keyStick();                 // the left thumb, or the keys
T.boost = () => T.sticks.R.held && T.pointers.get(T.sticks.R.id) && T.pointers.get(T.sticks.R.id).moved < 30 && performance.now() - T.pointers.get(T.sticks.R.id).t0 > 220 || T.keys.has('ShiftLeft') || T.keys.has('ShiftRight');
T.keyStick = () => {                              // WASD / arrows as a stick, for a desktop
  const k = T.keys;
  const x = (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0) - (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0);
  const y = (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0) - (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0);
  return { x, y, mag: Math.min(1, Math.hypot(x, y)) };
};
const RAY = new THREE.Raycaster();
T.pick = (x, y, obj) => {                         // the first hit under a screen point, or null
  RAY.setFromCamera({ x: x / innerWidth * 2 - 1, y: -(y / innerHeight) * 2 + 1 }, T.camera);
  const hits = RAY.intersectObject(obj, true); return hits.length ? hits[0] : null;
};
T.groundPoint = (x, y) => {                       // where a screen point meets the ship's altitude plane
  RAY.setFromCamera({ x: x / innerWidth * 2 - 1, y: -(y / innerHeight) * 2 + 1 }, T.camera);
  const pl = new THREE.Plane(UP, -T.pos.y), out = new THREE.Vector3();
  return RAY.ray.intersectPlane(pl, out) ? out : null;
};

/* ───────────────────────── overlay: vectors drawn over the world ───────────────────────── */
const C = { D: '#c8901c', V: '#1f78a8', N: '#d8382e', W: '#1a1f2a' };
T.colour = C;
function sizeOverlay() { const d = Math.min(devicePixelRatio || 1, 2); overlay.width = innerWidth * d; overlay.height = innerHeight * d; overlay.style.width = innerWidth + 'px'; overlay.style.height = innerHeight + 'px'; g2.setTransform(d, 0, 0, d, 0, 0); }
T.project = w => { V4.copy(w).project(T.camera); return { x: (V4.x * .5 + .5) * innerWidth, y: (-V4.y * .5 + .5) * innerHeight, ok: V4.z > -1 && V4.z < 1 }; };
T.mark = (w, label, colour, r = 7) => { const p = T.project(w); if (!p.ok) return p; g2.strokeStyle = colour; g2.lineWidth = 1.6; g2.beginPath(); g2.arc(p.x, p.y, r, 0, Math.PI * 2); g2.stroke(); if (label) { g2.fillStyle = colour; g2.font = '10px ui-monospace,Menlo,monospace'; g2.fillText(label, p.x + r + 4, p.y + 4); } return p; };
T.line = (a, b, colour, dash, width = 1.5) => { const p = T.project(a), q = T.project(b); if (!p.ok || !q.ok) return; g2.strokeStyle = colour; g2.lineWidth = width; g2.setLineDash(dash || []); g2.beginPath(); g2.moveTo(p.x, p.y); g2.lineTo(q.x, q.y); g2.stroke(); g2.setLineDash([]); };
T.ribbon = (pts, colour, width = 1.5, dash) => { g2.strokeStyle = colour; g2.lineWidth = width; g2.setLineDash(dash || []); g2.beginPath(); let up = true; for (const w of pts) { const p = T.project(w); if (!p.ok) { up = true; continue; } if (up) g2.moveTo(p.x, p.y); else g2.lineTo(p.x, p.y); up = false; } g2.stroke(); g2.setLineDash([]); };
T.text = (x, y, s, colour = C.W) => { g2.fillStyle = colour; g2.font = '11px ui-monospace,Menlo,monospace'; g2.fillText(s, x, y); };
T.circle = (x, y, r, colour, width = 1.5) => { g2.strokeStyle = colour; g2.lineWidth = width; g2.beginPath(); g2.arc(x, y, r, 0, Math.PI * 2); g2.stroke(); };
T.readout = s => { readText = s; };

/* ───────────────────────── bolts ───────────────────────── */
const BOLT_SPD = 2200, BOLT_LIFE = 1.4, BOLT_N = 32;
const MUZZLE = [new THREE.Vector3(-16, -12, 144), new THREE.Vector3(16, -12, 144)];
let muzzle = 0;
function initBolts() {
  const geo = new THREE.BoxGeometry(5, 5, 60), mat = new THREE.MeshBasicMaterial({ color: 0x2fbf3f, fog: false });
  for (let i = 0; i < BOLT_N; i++) { const m = new THREE.Mesh(geo, mat); m.visible = false; m.frustumCulled = false; T.scene.add(m); T.bolts.push({ mesh: m, vel: new THREE.Vector3(), prev: new THREE.Vector3(), dir: new THREE.Vector3(), life: 0 }); }
}
T.fire = (dir, extraVel) => {                     // from the ship's alternating muzzles, along dir, carrying extraVel
  const b = T.bolts.find(b => b.life <= 0); if (!b) return null;
  V1.copy(MUZZLE[muzzle ^= 1]).applyQuaternion(T.quat).add(T.pos);
  b.life = BOLT_LIFE; b.mesh.position.copy(V1); b.prev.copy(V1); b.dir.copy(dir).normalize();
  b.vel.copy(b.dir).multiplyScalar(BOLT_SPD); if (extraVel) b.vel.add(extraVel);
  b.mesh.quaternion.copy(Q1.setFromUnitVectors(Z1, b.dir)); b.mesh.visible = true; return b;
};
function stepBolts(dt) { for (const b of T.bolts) { if (b.life <= 0) continue; b.prev.copy(b.mesh.position); b.mesh.position.addScaledVector(b.vel, dt); if ((b.life -= dt) <= 0) b.mesh.visible = false; } }
T.hitSphere = (c, r) => {                         // the first live bolt whose last step crossed the sphere; it is spent
  for (const b of T.bolts) {
    if (b.life <= 0) continue;
    V3.subVectors(b.mesh.position, b.prev); const L2 = V3.lengthSq();
    const t = L2 ? clamp(V1.subVectors(c, b.prev).dot(V3) / L2, 0, 1) : 0;
    if (V2.copy(b.prev).addScaledVector(V3, t).distanceToSquared(c) <= r * r) { b.life = 0; b.mesh.visible = false; return b; }
  }
  return null;
};

/* ───────────────────────── helpers toys lean on ───────────────────────── */
T.rotateTowards = (a, b, maxAngle) => {           // unit vectors, in place
  const d = clamp(a.dot(b), -1, 1), angle = Math.acos(d);
  if (angle <= maxAngle || angle < 1e-5) { a.copy(b); return a; }
  V4.crossVectors(a, b); if (V4.lengthSq() < 1e-8) V4.copy(Math.abs(a.y) < 0.9 ? UP : X1).cross(a);
  a.applyAxisAngle(V4.normalize(), maxAngle).normalize(); return a;
};
T.angle = (a, b) => Math.acos(clamp(a.dot(b), -1, 1));
T.lookQuat = (out, dir, bank = 0) => {            // nose along dir, upright, then banked about the nose
  M1.lookAt(V1.copy(T.pos).add(dir), T.pos, UP); out.setFromRotationMatrix(M1);
  if (bank) out.multiply(Q1.setFromAxisAngle(Z1, bank)); return out;
};
T.forward = out => out.set(0, 0, 1).applyQuaternion(T.quat);
T.keepAbove = margin => { const h = T.groundH(T.pos.x, T.pos.z) + margin; if (T.pos.y < h) { T.pos.y = h; return true; } return false; };
T.inBounds = () => { const e = T.groundExtent() / 2 - 40 * M; return Math.abs(T.pos.x) < e && Math.abs(T.pos.z) < e; };
const CAM = { pos: new THREE.Vector3(), look: new THREE.Vector3(), set: false };
T.cam = CAM;
T.chase = (dir, dist, high, tau, dt, lookAhead = 320) => {   // a chase camera behind dir, with delayed pursuit
  V2.copy(T.pos).addScaledVector(dir, -dist); V2.y += high;
  V3.copy(T.pos).addScaledVector(dir, lookAhead); V3.y += 30;
  if (!CAM.set) { CAM.pos.copy(V2); CAM.look.copy(V3); CAM.set = true; }
  CAM.pos.lerp(V2, 1 - Math.exp(-dt / tau)); CAM.look.lerp(V3, 1 - Math.exp(-dt / (tau * 0.5)));
  T.camera.position.copy(CAM.pos); T.camera.up.copy(UP); T.camera.lookAt(CAM.look);
};
T.placeCamera = (pos, look) => { CAM.pos.copy(pos); CAM.look.copy(look); CAM.set = true; T.camera.position.copy(pos); T.camera.up.copy(UP); T.camera.lookAt(look); };

/* The game's trajectory control, reduced: the stick bends a desired direction inside a cone, the path
   pursues it at a sprung turn rate, the nose leads the path a little. Toys about camera and world use it. */
T.makePath = (o = {}) => {
  const P = {
    speed: o.speed || 350, boostSpeed: o.boostSpeed || 550, turn: (o.turn || 100) * DEG, boostTurn: (o.boostTurn || 65) * DEG,
    yawCone: (o.yawCone || 55) * DEG, pitchCone: (o.pitchCone || 35) * DEG, lead: o.lead || 1.6, slip: (o.slip || 30) * DEG, spring: o.spring || 0.2,
    velDir: new THREE.Vector3(0, 0, -1), noseDir: new THREE.Vector3(0, 0, -1), desired: new THREE.Vector3(0, 0, -1), v: o.speed || 350, turnRate: 0, bank: 0,
  };
  P.step = (stick, boost, dt) => {
    V1.copy(P.velDir); V2.crossVectors(V1, UP); if (V2.lengthSq() < 1e-6) V2.copy(X1); V2.normalize();
    P.desired.copy(V1).applyAxisAngle(UP, -stick.x * P.yawCone).applyAxisAngle(V2, stick.y * 0.7 * P.pitchCone).normalize();
    const h = T.groundH(T.pos.x, T.pos.z);
    if (T.pos.y < h + 60 * M) P.desired.y += (h + 60 * M - T.pos.y) / (60 * M) * 0.8;
    P.desired.y = clamp(P.desired.y, -0.8, 0.8); P.desired.normalize();
    const want = (boost ? P.boostTurn : P.turn) * stick.mag;
    P.turnRate += (want - P.turnRate) * (1 - Math.exp(-dt / P.spring));
    P.v += ((boost ? P.boostSpeed : P.speed) - P.v) * (1 - Math.exp(-dt / 0.5));
    T.rotateTowards(P.velDir, P.desired, P.turnRate * dt);
    T.rotateTowards(P.noseDir, P.desired, P.turnRate * P.lead * dt + (stick.mag < 0.02 ? 1.2 * dt : 0));
    const s = T.angle(P.noseDir, P.velDir); if (s > P.slip) T.rotateTowards(P.noseDir, P.velDir, s - P.slip);
    T.vel.copy(P.velDir).multiplyScalar(P.v); T.pos.addScaledVector(T.vel, dt);
    T.keepAbove(8 * M);
    P.bank += (-stick.x * 55 * DEG - P.bank) * (1 - Math.exp(-dt / 0.15));
    T.lookQuat(T.quat, P.noseDir, P.bank);
  };
  return P;
};

/* ───────────────────────── boot and loop ───────────────────────── */
function dom(s) {
  document.head.insertAdjacentHTML('beforeend', '<style>' + CSS + '</style>');
  if (!$('#stage')) document.body.insertAdjacentHTML('afterbegin', '<div id="stage"></div>');
  document.body.insertAdjacentHTML('beforeend', `
<canvas id="ov"></canvas>
<div id="top"><div><a href="./">‹ toys</a><div class="t">${s.index || ''}</div><div class="n">${s.title}</div></div><div id="read"></div></div>
<div id="notice">${s.notice}</div>
<div id="keys">${s.keys || 'wasd · shift · space'}</div>
<div id="veil"><div class="k">stepping stone</div><h1>${s.title}</h1><div class="m" id="vm">Loading the ship…</div></div>`);
  overlay = $('#ov'); g2 = overlay.getContext('2d'); sizeOverlay(); window.addEventListener('resize', sizeOverlay);
}
function stall(msg) { $('#vm').innerHTML = msg + '<br><button onclick="location.reload()">Retry</button>'; }
function tick() {
  if (!T.ready) return;
  const now = performance.now(), dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
  simulate(dt);
}
function simulate(dt) {
  T.t += dt;
  spec.step(T, dt);
  stepBolts(dt);
  T.ship.position.copy(T.pos); T.ship.quaternion.copy(T.quat);
  g2.clearRect(0, 0, innerWidth, innerHeight);
  if (spec.draw) spec.draw(T, g2);
  $('#read').textContent = readText;
}
window.Toy = {
  T,
  boot: async s => {
    spec = s; dom(s);
    const t0 = performance.now();
    const ticker = setInterval(() => { if (!T.ready) $('#vm').textContent = `Loading the ship… ${Math.round((performance.now() - t0) / 1000)}s`; }, 500);
    const watchdog = setTimeout(() => { if (!T.ready) stall('Still loading after 25 s.'); }, 25000);
    try {
      const engine = await NabugoUI.makeViewer($('#stage'), { background: 0xb8cbd8, base: '..' });
      T.engine = engine; T.scene = engine.scene; T.camera = engine.camera; T.renderer = engine.renderer;
      engine.setDiagnostics({ axes: false, grid: false });
      engine.camera.far = 40000; engine.camera.fov = innerHeight > innerWidth ? 55 : 50; engine.camera.updateProjectionMatrix();
      decodeTerrain(); bakeGround(); buildGroundMesh(T.scene); daylight(T.scene);
      await loadShip();
      engine.controls.enabled = false; engine.controls = null;
      if ((navigator.maxTouchPoints || 0) > 0) engine.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      initBolts(); bindInput();
      T.pos.set(0, 40 * M, 60 * M); T.quat.identity(); T.lookQuat(T.quat, V1.set(0, 0, -1));
      if (s.setup) s.setup(T);
      T.ship.position.copy(T.pos); T.ship.quaternion.copy(T.quat);
      const r = engine.renderer, real = r.render.bind(r);
      r.render = (sc, c) => { tick(); real(sc, c); T.calls = r.info.render.calls; };
      last = performance.now(); T.ready = true; $('#veil').classList.add('gone');
    } catch (e) { stall('Could not load: ' + (e.message || e)); console.error(e); }
    finally { clearInterval(ticker); clearTimeout(watchdog); }
    window.__toy = Object.assign({
      T, step: sec => { for (let t = 0; t < sec; t += 1 / 60) simulate(1 / 60); last = performance.now(); },
      state: () => Object.assign({
        ready: T.ready, t: T.t, pos: T.pos.toArray(), fwd: T.forward(V1).toArray(), vel: T.vel.toArray(), ground: T.groundH(T.pos.x, T.pos.z), groundVerts: T.groundVerts,
        cam: T.camera.position.toArray(), camFwd: T.camera.getWorldDirection(V2).toArray(), calls: T.calls, bolts: T.bolts.filter(b => b.life > 0).map(b => b.dir.toArray()),
      }, s.state ? s.state(T) : {}),
      tap: (x, y) => { const p = { id: -1, x, y, x0: x, y0: y, t0: 0, t: 0, moved: 0, left: x < innerWidth * .5 }; if (s.onDown) s.onDown(T, p); if (s.onUp) s.onUp(T, p); if (s.onTap) s.onTap(T, p); },
    }, s.hooks ? s.hooks(T) : {});
  },
};
})();
