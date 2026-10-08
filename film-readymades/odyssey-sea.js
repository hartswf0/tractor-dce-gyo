/* film-readymades/odyssey-sea.js — the sea kit (window.OdysseySea): a living LEGO ocean, the hull that rides it, the night sky over it
   and the storm. A classic script on the page's global THREE (r128); the take (odyssey-take.js) fetches it when a scene's keys name a
   sea (look.sea) and drives it every drawing; tools/sea-test.js drives it with a sea of its own.

   Everything on screen is brick: tiles, plates, round plates, a dish, bars; every field is an InstancedMesh whose matrices move on
   twos (12 drawings a second, whatever the render rate). Nothing is shaded to look like water.

     OCEAN    tiles on columns whose tops are a sum of four travelling swells (crest-sharpened, Gerstner-like), quantized to the
              plate (8 LDU), so the water steps like stacked plates. Rings of tiles: 1x1 over the set, then 2x2, 4x4, 8x8, 16x16, 32x32
              out to the fog's far edge, so the sea reaches the horizon for ~5,000 instances. Colour by height and slope (dark blue
              troughs, blue, medium blue and bright light blue faces), white round plates as foam on crests that are rising past a
              threshold, a white wake and bow foam about a hull under way, and a path of light (moon by night, sun by day) where a
              tile's facet would mirror the light into the lens: clear round tiles laid on it, sparkling drawing by drawing.
              The location's baked sea is taken out: 'the sea' keeps only its land triangles (the island's ground), the stage
              plate, the baked swells and splashes are hidden.
     HULL     the swell sampled at bow, stern, port and starboard: heave, pitch and roll. A ship the take's sheet rigs
              (choreo.js rigs.ship) is given these channels through the player's shipV hook (a third of the sheet's own pitch and
              roll kept, its impulses); any other hull or raft (a set piece or a staged prop) is turned here with the figures that
              stand on it. The baked oars (the hull piece's reddish-brown triangles outboard of its beam) are cut out of the
              piece and drawn as their own meshes, each turned about its gunwale so the blade dips to the water under it,
              sweeping on a stroke clock if asked. Lanterns on posts (warm point lights, flickering on twos); an optional sail of
              tiles stepped by the wind.
     SKY      a dome of colour behind everything (the backdrop: dusk, night and storm palettes over the key's own sky, its
              horizon the fog's colour so the far tiles go into it); stars as clear and trans-yellow round plates at many
              distances that come out with the night (the large first); a moon as a 4x4 dish with its stud; cool blue moon and
              fill light at night, the day's lights dimmed.
     STORM    swell x3, wind and foam up; rain as trans-clear 1x2 tiles smeared along their fall (two tiles a drop, the smear
              brick), white plates splashing where they land; lightning one drawing long, a trans-yellow bolt of plates from the
              cloud to the sea and the sky and a fill flashed with it; dark clouds as masses of dark grey plates drifting.

   The parameters (a key's look.sea, carried from key to key and eased across the seam; any value may be a track [[dt, v], ...]
   in seconds from the key's start): {swell (1 = about two plates), wind 0..1, dir (deg), foam 0..1, night 0..1, stars 0..1
   (default: night), moon {az, el, size} | false, storm 0..1, clouds 0..1, rain 0..1, strikes [t...] (take clock), level (plates
   over the sea piece's top), way (studs/s: a hull under way, its wake), sky [top, horizon] (the day's colours; default the
   look's), fog [near, far], lanterns (true | [[x,y,z]...] | false), oars {sweep (deg), period (s), origin (s), stagger, dip} | false,
   sail {at:[x,z], y0, y1, width (studs), stripe} | null, ride [{piece|prop, bow: '-z'|'+z'|'-x'|'+x', lift (plates)}], bow,
   hide [labels], ease (s, the seam)} */
(function (root) {
'use strict';
const THREE = root.THREE;
const V3 = THREE.Vector3, Q = THREE.Quaternion, E = THREE.Euler, M4 = THREE.Matrix4, C = THREE.Color;
const DEG = Math.PI / 180, cl01 = v => Math.max(0, Math.min(1, v)), sm = x => { x = cl01(x); return x * x * (3 - 2 * x); }, lerp = (a, b, u) => a + (b - a) * u;
function rnd(a, b = 0, c = 0) { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const drawing = (t, fps = 12) => Math.floor(t * fps + 1e-6), onTwos = t => drawing(t) / 12;

/* LDraw colours (LDConfig), sRGB */
const COL = { darkBlue: '#19325A', transDarkBlue: '#0020A0', blue: '#1E5AA8', mediumBlue: '#7396C8', brightLightBlue: '#9DC3F7', transLightBlue: '#AEE9EF',
  white: '#F4F4F4', transClear: '#FCFCFC', transYellow: '#F5CD2F', transOrange: '#F08F1C', transLightBlueStar: '#C8F0F4', darkBluishGrey: '#646464',
  lightBluishGrey: '#969696', black: '#1B2A34', reddishBrown: '#582A12', red: '#C91A09', moon: '#FFF4D6' };
let LIN = true;
const col = c => { const x = new C(COL[c] || c); return LIN ? x.convertSRGBToLinear() : x; };

/* ── brick geometry, in LDU (a stud 20, a plate 8), origin at the bottom centre, y up ── */
function merge(list) {
  let n = 0; const P = [], N = [], K = [];
  for (const [g0, shade] of list) { const g = g0.index ? g0.toNonIndexed() : g0; P.push(g.attributes.position.array); N.push(g.attributes.normal.array); K.push([g.attributes.position.count, shade == null ? 1 : shade]); n += g.attributes.position.count; }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), cc = new Float32Array(n * 3); let o = 0;
  for (let i = 0; i < P.length; i++) { pos.set(P[i], o * 3); nor.set(N[i], o * 3); for (let j = 0; j < K[i][0]; j++) cc.fill(K[i][1], (o + j) * 3, (o + j) * 3 + 3); o += K[i][0]; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.computeBoundingSphere(); return g;
}
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);
const cyl = (r, h, x = 0, y = 0, z = 0, seg = 16) => new THREE.CylinderGeometry(r, r, h, seg).translate(x, y + h / 2, z);
const GEO = {};
function geo(name) {
  if (GEO[name]) return GEO[name];
  let g; const m = name.match(/^tile(\d+)$/);
  if (m) { const w = 20 * +m[1] - 0.4; g = merge([[box(w, 8, w), 1]]); }   /* a square tile n x n, the 0.4 LDU gap its neighbours leave */
  else switch (name) {
    case 'round1x1': g = merge([[cyl(9.8, 8, 0, 0, 0, 14), 0.92], [cyl(6, 1.6, 0, 8, 0, 12), 1], [cyl(6, 2.4, 0, 9.6, 0, 12), 0.82]]); break;      /* 4073: the plate and its stud */
    case 'roundtile1x1': g = merge([[cyl(9.8, 8, 0, 0, 0, 14), 1]]); break;                                                                        /* 98138 */
    case 'tile1x2': g = merge([[box(19.6, 8, 39.6), 1]]); break;                                                                                     /* 3069b */
    case 'plate1x2': g = merge([[box(19.6, 8, 39.6), 1], [cyl(6, 4, 0, 8, -10, 10), 0.85], [cyl(6, 4, 0, 8, 10, 10), 0.85]]); break;                /* 3023 */
    case 'plate4x6': g = merge([[box(79.6, 8, 119.6), 1]]); break;                                                                                   /* the cloud's plates, seen from under */
    case 'plate2x8': g = merge([[box(39.6, 8, 159.6), 1]]); break;
    case 'brick2x4': g = merge([[box(39.6, 24, 79.6), 1]]); break;
    case 'bar': g = merge([[cyl(2, 1, 0, 0, 0, 8), 1]]); break;                                                                                      /* 1 LDU of bar, stretched */
    case 'roundbrick1x1': g = merge([[cyl(9.8, 24, 0, 0, 0, 14), 1], [cyl(6, 4, 0, 24, 0, 12), 0.85]]); break;                                       /* 3062b */
    case 'dish4x4': { const cap = new THREE.SphereGeometry(52, 32, 6, 0, Math.PI * 2, 0, 0.88).translate(0, -52 * Math.cos(0.88), 0);              /* 3960: a shallow dome, 80 LDU across */
      g = merge([[cap, 1], [cyl(40, 2, 0, -2, 0, 32), 0.86], [cyl(6, 4, 0, 52 - 52 * Math.cos(0.88), 0, 14), 0.9]]); break; }
    default: throw Error('odyssey-sea: no geometry ' + name);
  }
  return (GEO[name] = g);
}
const _M = new M4(), _P = new V3(), _S = new V3(), _Q = new Q(), Q0 = new Q();
class Layer {
  constructor(parent, g, m, max) { this.m = new THREE.InstancedMesh(g, m, max); this.m.frustumCulled = false; this.m.receiveShadow = !m.isMeshBasicMaterial; this.m.castShadow = false; this.m.userData.axis = 'sea';   /* the take's solid test (kfSolid) passes over it */
    this.max = max; this.n = 0; for (let i = 0; i < max; i++) this.m.setColorAt(i, new C(1, 1, 1)); this.m.count = 0; parent.add(this.m); }
  begin() { this.n = 0; return this; }
  put(x, y, z, sx, sy, sz, q, c) { if (this.n >= this.max) return -1; _M.compose(_P.set(x, y, z), q || Q0, _S.set(sx, sy, sz)); this.m.setMatrixAt(this.n, _M); if (c) this.m.setColorAt(this.n, c); return this.n++; }
  end() { this.m.count = this.n; this.m.instanceMatrix.needsUpdate = true; if (this.m.instanceColor) this.m.instanceColor.needsUpdate = true; this.m.castShadow = false; }
}
const std = (o = {}) => { const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: o.rough ?? 0.3, metalness: 0, transparent: !!o.opacity, opacity: o.opacity ?? 1, depthWrite: !o.opacity, emissive: o.emissive ? col(o.emissive) : new C(0), emissiveIntensity: o.glow ?? 1 }); if (o.fog === false) m.fog = false; return m; };
const basic = (o = {}) => { const m = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: !!o.opacity, opacity: o.opacity ?? 1, depthWrite: !o.opacity, fog: o.fog ?? false }); if (o.toneMapped === false) m.toneMapped = false; return m; };

/* ── the swell: h(x, z, t) in plates, a sum of travelling waves {dir (deg), len (studs), speed (studs/s), amp (share)}, each crest
   sharpened (2 s^1.6 - 0.8 over s = (1 + sin)/2: narrow crests, long flat troughs, as a trochoid) ── */
const WAVES = [{ dir: 0, len: 46, speed: 5.2, amp: 0.52, ph: 0.3 }, { dir: 31, len: 27, speed: 4.1, amp: 0.26, ph: 2.1 }, { dir: -44, len: 16, speed: 3.2, amp: 0.15, ph: 4.0 }, { dir: 78, len: 9, speed: 2.3, amp: 0.07, ph: 1.2 }];
function waveSet(P, U, minLen) {
  const out = []; for (const w of WAVES) { if (w.len < minLen) continue; const a = (P.dir + w.dir) * DEG, k = 2 * Math.PI / (w.len * U.stud), c = w.speed * (1 + 0.35 * P.wind) * U.stud;
    out.push({ kx: k * Math.sin(a), kz: k * Math.cos(a), w: k * c, A: w.amp * (w.len < 12 ? 1 + 2.2 * P.wind : 1), ph: w.ph }); }
  return out;
}
/* h and its gradient (per world unit) and its rate (per second), all in plates of amplitude 1 */
const HS = { h: 0, gx: 0, gz: 0, dt: 0 };
function swell(ws, x, z, t, amp) {
  let h = 0, gx = 0, gz = 0, dt = 0;
  for (let i = 0; i < ws.length; i++) { const w = ws[i], th = w.kx * x + w.kz * z - w.w * t + w.ph, s = Math.sin(th), c = Math.cos(th), u = (1 + s) / 2, p = Math.pow(u, 0.6);
    h += w.A * (2 * p * u - 0.8); const d = w.A * 1.6 * p * c; gx += d * w.kx; gz += d * w.kz; dt -= d * w.w; }
  HS.h = h * amp; HS.gx = gx * amp; HS.gz = gz * amp; HS.dt = dt * amp; return HS;
}

/* ── the parameters: a key's look.sea, carried forward from key to key, each value a number or a track [[dt, v], ...] ── */
const isTrack = v => Array.isArray(v) && v.length && Array.isArray(v[0]) && v[0].length === 2 && typeof v[0][0] === 'number';
function trackAt(v, dt) { if (!isTrack(v)) return v; if (dt <= v[0][0]) return v[0][1]; for (let i = 1; i < v.length; i++) if (dt <= v[i][0]) { const a = v[i - 1], b = v[i], u = (dt - a[0]) / Math.max(1e-6, b[0] - a[0]); return typeof a[1] === 'number' ? lerp(a[1], b[1], sm(u)) : u < 0.5 ? a[1] : b[1]; } return v[v.length - 1][1]; }
function evalAt(spec, dt) { const o = {}; for (const [k, v] of Object.entries(spec || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) ? evalAt(v, dt) : trackAt(v, dt); return o; }
function mix(a, b, u) { if (u >= 1) return b; const o = Object.assign({}, a, b); for (const k of Object.keys(o)) { const x = a[k], y = b[k]; if (typeof x === 'number' && typeof y === 'number') o[k] = lerp(x, y, u); else if (x && y && typeof x === 'object' && typeof y === 'object' && !Array.isArray(x)) o[k] = mix(x, y, u); else if (y === undefined) o[k] = x; } return o; }
/* keys: [{t, k}] (the take's keys on its clock); spec: the keyframes file. The sea at t: the key's carried sea, eased from the one before
   over its `ease` seconds from the key's start */
function resolve(keys, spec, t) {
  const seaOf = k => Object.assign({}, k.look && k.look.sea, k.sea);
  let carried = Object.assign({}, spec.sea, spec.look && spec.look.sea), prev = null, i0 = -1;
  const per = []; for (const K of keys) { prev = carried; carried = Object.assign({}, carried, seaOf(K.k)); per.push({ K, sea: carried, prev }); }
  for (let i = 0; i < per.length; i++) if (per[i].K.t <= t) i0 = i;
  if (i0 < 0) return Object.keys(per[0] ? per[0].sea : {}).length ? evalAt(per[0].sea, t - (per[0] ? per[0].K.t : 0)) : null;
  const cur = per[i0], dt = t - cur.K.t, ease = (cur.sea.ease ?? 2), now = evalAt(cur.sea, dt);
  if (!Object.keys(cur.sea).length) return null;
  if (i0 === 0 || ease <= 0 || dt >= ease) return now;
  const was = evalAt(per[i0 - 1].sea, t - per[i0 - 1].K.t); return Object.keys(per[i0 - 1].sea).length ? mix(was, now, sm(dt / ease)) : now;
}
function hasSea(keys, spec) { return !!(spec.sea || (spec.look && spec.look.sea) || keys.some(K => (K.k.look && K.k.look.sea) || K.k.sea)); }

const DEF = { swell: 1, wind: 0.3, dir: 20, foam: 0.5, night: 0, storm: 0, level: 0, way: 0, ease: 2 };
const SKY = { day: ['#5f97d3', '#efe2c4'], night: ['#02040b', '#0d1730'], storm: ['#15191f', '#3a414c'], flash: ['#a4b2d6', '#c9d2ea'] };

/* ── the kit ── ctx: {scene, camera, renderer, scale (world units per LDU), pieces() -> [{label, box}], cast() -> [{id, r}],
   prop(name) -> Object3D, choreoShip() -> {Q, off} | null, rig (the sheet's ship rig) | null, look() -> the key's merged look} */
function stage(ctx) {
  const scene = ctx.scene, s = ctx.scale || 1, rr = ctx.renderer; LIN = !rr || rr.outputEncoding === THREE.sRGBEncoding;
  const U = { s, stud: 20 * s, plate: 8 * s, brick: 24 * s };
  const grp = new THREE.Group(); grp.name = 'odyssey-sea'; scene.add(grp);
  const restore = [], pieces = ctx.pieces ? ctx.pieces() : [];
  const pieceOf = l => pieces.find(p => p.label === l && p.box) || pieces.find(p => p.box && p.label.toLowerCase().includes(String(l).toLowerCase()));
  /* the set's pages as meshes (the page mesh whose box is the page's box; '*' a wildcard) */
  const cands = []; scene.traverse(o => { if (o.isMesh && o.userData && o.userData.partId != null) cands.push(o); });
  const meshesOf = pattern => { const re = new RegExp('^' + String(pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i'), out = [];
    for (const p of pieces.filter(p => p.box && re.test(p.label))) { let best = null, bd = 1e9; for (const m of cands) { const b = new THREE.Box3().setFromObject(m), d = Math.abs(b.min.x - p.box[0]) + Math.abs(b.min.y - p.box[1]) + Math.abs(b.min.z - p.box[2]) + Math.abs(b.max.x - p.box[3]) + Math.abs(b.max.y - p.box[4]) + Math.abs(b.max.z - p.box[5]); if (d < bd) { bd = d; best = m; } } if (best && bd < 12) out.push({ label: p.label, box: p.box, mesh: best }); }
    return out; };
  const seaP = pieceOf('the sea') || pieceOf('sea'), seaBox = seaP ? seaP.box : (pieceOf('stage plate') || { box: [-240, 0, -330, 240, 8, 330] }).box;
  const cx = (seaBox[0] + seaBox[3]) / 2, cz = (seaBox[2] + seaBox[5]) / 2, seaTop = seaBox[4];

  /* the triangles of a mesh's geometry by a test on (colour, centroid): a new geometry on the same attributes with only the kept ones
     (the opaque mesh and its glass child), restored at dispose */
  const tri = (g, i, k) => { const ix = g.index ? g.index.getX(i * 3 + k) : i * 3 + k; return ix; };
  function filterMesh(mesh, keep) {
    const swap = m => { const g = m.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3, out = [], P = g.attributes.position, K = g.attributes.color, c = new C(), p = new V3();
      for (let i = 0; i < n; i++) { const a = tri(g, i, 0), b = tri(g, i, 1), d = tri(g, i, 2); p.set((P.getX(a) + P.getX(b) + P.getX(d)) / 3, (P.getY(a) + P.getY(b) + P.getY(d)) / 3, (P.getZ(a) + P.getZ(b) + P.getZ(d)) / 3).applyMatrix4(m.matrixWorld);
        if (K) c.setRGB(K.getX(a), K.getY(a), K.getZ(a)); else c.setRGB(1, 1, 1); if (keep(c, p, a, b, d, m)) out.push(a, b, d); }
      const ng = new THREE.BufferGeometry(); for (const [k, a] of Object.entries(g.attributes)) ng.setAttribute(k, a); ng.setIndex(out); ng.boundingBox = g.boundingBox; ng.boundingSphere = g.boundingSphere;
      if (!g.boundingBox) { g.computeBoundingBox(); ng.boundingBox = g.boundingBox; } const old = m.geometry; m.geometry = ng; restore.push(() => { m.geometry = old; ng.dispose(); }); };
    mesh.updateMatrixWorld(true); swap(mesh); for (const ch of mesh.children) if (ch.isMesh && ch.geometry) swap(ch);
  }
  /* water colours: blues, light blues, whites and the clears (the checkerboard of the baked sea); land: greens, tans, greys, browns */
  const srgb = c => { const x = c.clone(); if (Math.max(x.r, x.g, x.b) < 0.75 && LIN) x.convertLinearToSRGB(); return x; };
  const watery = c0 => { const c = srgb(c0), hsl = {}; c.getHSL(hsl); return (hsl.h > 0.5 && hsl.h < 0.72 && hsl.s > 0.2) || (hsl.l > 0.86); };

  /* ── the ocean's cells ── */
  const P0 = Object.assign({}, DEF);
  const rings = [1, 2, 4, 8, 16, 32], widths = [0, 16, 32, 64, 128, 256];
  const hx0 = Math.ceil(((seaBox[3] - seaBox[0]) / 2 / U.stud + 10) / 2) * 2, hz0 = Math.ceil(((seaBox[5] - seaBox[2]) / 2 / U.stud + 10) / 2) * 2;   /* studs, even: the set and ten studs about it in 1x1 tiles */
  const R = []; { let hx = hx0, hz = hz0; for (let k = 0; k < rings.length; k++) { if (k) { const q = rings[Math.min(k + 1, rings.length - 1)]; hx = Math.ceil((hx + widths[k]) / q) * q; hz = Math.ceil((hz + widths[k]) / q) * q; } else { const q = rings[1]; hx = Math.ceil(hx / q) * q; hz = Math.ceil(hz / q) * q; } R.push([hx, hz]); } }
  const cells = { x: [], z: [], k: [], land: [], i: [], j: [] };
  for (let k = 0; k < rings.length; k++) { const sk = rings[k], [hx, hz] = R[k], inner = k ? R[k - 1] : null;
    for (let i = -hx; i < hx; i += sk) for (let j = -hz; j < hz; j += sk) { const mx = i + sk / 2, mz = j + sk / 2; if (inner && Math.abs(mx) < inner[0] && Math.abs(mz) < inner[1]) continue;
      cells.x.push(cx + mx * U.stud); cells.z.push(cz + mz * U.stud); cells.k.push(k); cells.land.push(0); cells.i.push(Math.round(mx * 2)); cells.j.push(Math.round(mz * 2)); } }
  const N = cells.x.length;
  /* the baked sea taken out: 'the sea' keeps its land; its land's top marks the cells the water leaves alone */
  const hideList = ['stage plate', 'swell*', 'splash*', 'four-wind storm'];
  /* the baked sea is taken out at the first drawing, not at staging: the cinematographer solves its cameras (prepare) on the set as
     built, its floor and its sea where the gate measured them */
  let stripped = false; const hidden = []; const hideNow = () => { for (const m of hidden) m.visible = false; };
  const cellLand = new Map();
  /* done at the first parameters: P.land false takes the island out too, P.hide names more pieces to hide (a sea with nothing else in it) */
  function stripSea(SP) {
  if (seaP) for (const pm of meshesOf(seaP.label)) {
    filterMesh(pm.mesh, c => SP.land !== false && !watery(c)); if (SP.land === false) continue;
    /* each land triangle marks the 1x1 cell under its centroid and, for the large triangles of a baseplate, the cells its corners span */
    const P = pm.mesh.geometry.attributes.position, g = pm.mesh.geometry, mw = pm.mesh.matrixWorld, va = new V3(), vb = new V3(), vc = new V3(), ix = g.index;
    const mark = (x, z) => { const i = Math.round(((x - cx) / U.stud - 0.5)), j = Math.round(((z - cz) / U.stud - 0.5)); cellLand.set(i + ',' + j, 1); };
    for (let q = 0; q < ix.count; q += 3) { va.fromBufferAttribute(P, ix.getX(q)).applyMatrix4(mw); vb.fromBufferAttribute(P, ix.getX(q + 1)).applyMatrix4(mw); vc.fromBufferAttribute(P, ix.getX(q + 2)).applyMatrix4(mw);
      const ny = new V3().subVectors(vb, va).cross(new V3().subVectors(vc, va)).normalize().y; if (Math.abs(ny) < 0.6) continue;
      const x0 = Math.min(va.x, vb.x, vc.x), x1 = Math.max(va.x, vb.x, vc.x), z0 = Math.min(va.z, vb.z, vc.z), z1 = Math.max(va.z, vb.z, vc.z);
      for (let x = Math.floor((x0 - cx) / U.stud) * U.stud + cx + U.stud / 2; x <= x1; x += U.stud) for (let z = Math.floor((z0 - cz) / U.stud) * U.stud + cz + U.stud / 2; z <= z1; z += U.stud) {
        const e0 = (vb.x - va.x) * (z - va.z) - (vb.z - va.z) * (x - va.x), e1 = (vc.x - vb.x) * (z - vb.z) - (vc.z - vb.z) * (x - vb.x), e2 = (va.x - vc.x) * (z - vc.z) - (va.z - vc.z) * (x - vc.x);
        if ((e0 >= 0 && e1 >= 0 && e2 >= 0) || (e0 <= 0 && e1 <= 0 && e2 <= 0)) mark(x, z); } }
    for (let c = 0; c < N; c++) if (cells.k[c] === 0 && cellLand.has(Math.round((cells.x[c] - cx) / U.stud - 0.5) + ',' + Math.round((cells.z[c] - cz) / U.stud - 0.5))) cells.land[c] = 1;
  }
  for (const pat of hideList.concat(SP.hide || [])) for (const pm of meshesOf(pat)) { const m = pm.mesh, v = m.visible; hidden.push(m); restore.push(() => { m.visible = v; }); }
  }

  /* the layers */
  const water = rings.map((sk, k) => new Layer(grp, geo('tile' + sk), std({ rough: 0.22 }), cells.k.filter(x => x === k).length));
  const foamL = new Layer(grp, geo('round1x1'), std({ rough: 0.35 }), 6000);
  const glintL = new Layer(grp, geo('roundtile1x1'), basic({ fog: false }), 2600);
  const foamTile = new Layer(grp, geo('tile1'), std({ rough: 0.3 }), 3000);

  /* ── the hulls ── */
  const rides = [];
  function hullOf(rd) {
    if (rd.prop) { const o = ctx.prop ? ctx.prop(rd.prop) : null; if (!o) return null; return { kind: 'prop', o, rd, base: null, set: null }; }
    const pm = meshesOf(rd.piece)[0]; if (!pm) return null; return { kind: 'piece', ms: [pm.mesh], box: pm.box, rd, base: null, set: null };
  }
  /* rest geometry of a hull: centre, long axis, half length, beam, deck height; recomputed when the hull is re-staged */
  function measure(H, Qrest) {
    const b = H.kind === 'prop' ? new THREE.Box3().setFromObject(H.o) : new THREE.Box3(new V3(H.box[0], H.box[1], H.box[2]), new V3(H.box[3], H.box[4], H.box[5]));
    const alongZ = H.rd.bow ? /z/.test(H.rd.bow) : (b.max.z - b.min.z) >= (b.max.x - b.min.x);
    const ax = alongZ ? new V3(0, 0, 1) : new V3(1, 0, 0), lat = alongZ ? new V3(1, 0, 0) : new V3(0, 0, 1);
    const c = new V3((b.min.x + b.max.x) / 2, b.min.y, (b.min.z + b.max.z) / 2);
    const half = (alongZ ? b.max.z - b.min.z : b.max.x - b.min.x) / 2, wide = (alongZ ? b.max.x - b.min.x : b.max.z - b.min.z) / 2;
    const bowSign = H.rd.bow ? (H.rd.bow[0] === '-' ? -1 : 1) : -1;
    return { b, alongZ, ax, lat, c, half, beam: H.beam || wide * (H.kind === 'prop' ? 0.95 : 0.5), bowSign };
  }
  let shipRig = ctx.rig || null;
  const oars = []; let oarGroup = null;
  /* the baked oars cut out of a hull piece and drawn as their own meshes (one per oar, the piece's own material) */
  function cutOars(H, G) {
    const mesh = H.ms[0]; mesh.updateMatrixWorld(true);
    const brown = c0 => { const c = srgb(c0); return c.r > c.g * 1.6 && c.r > c.b * 2.2 && c.r < 0.55 && c.r > 0.15; };
    const dark = c0 => { const c = srgb(c0); return Math.max(c.r, c.g, c.b) < 0.25; };
    /* the beam: how far the hull's own dark shell reaches to the side, below the deck */
    let beam = 0; const g = mesh.geometry, P = g.attributes.position, K = g.attributes.color, v = new V3(), cc = new C(), ix = g.index;
    for (let q = 0; q < (ix ? ix.count : P.count); q++) { const a = ix ? ix.getX(q) : q; if (!K) break; cc.setRGB(K.getX(a), K.getY(a), K.getZ(a)); if (!dark(cc)) continue; v.fromBufferAttribute(P, a).applyMatrix4(mesh.matrixWorld); if (v.y > G.b.min.y + 0.3 * (G.b.max.y - G.b.min.y)) continue; beam = Math.max(beam, Math.abs(v.clone().sub(G.c).dot(G.lat))); }
    if (beam > 0) { H.beam = beam; G.beam = beam; }
    if (!beam) return;
    const yTop = G.b.min.y + 0.4 * (G.b.max.y - G.b.min.y), cut = [];
    filterMesh(mesh, (c, p, a, b, d, m) => { if (m !== mesh) return true; if (!brown(c) || p.y > yTop) return true; const l = p.clone().sub(G.c).dot(G.lat); if (Math.abs(l) < beam * 0.97) return true; cut.push([a, b, d, l, p.clone().sub(G.c).dot(G.ax)]); return false; });
    if (!cut.length) return;
    /* the cut triangles grouped by side and station along the hull: one oar each */
    const groups = []; for (const t of cut) { const side = Math.sign(t[3]); let gq = groups.find(q => q.side === side && Math.abs(q.at - t[4]) < 1.6 * U.stud); if (!gq) { gq = { side, at: t[4], tris: [] }; groups.push(gq); } gq.tris.push(t); }
    oarGroup = new THREE.Group(); oarGroup.name = 'sea-oars'; scene.add(oarGroup);
    for (const gq of groups) { const pos = [], colr = [], wv = new V3(); let inner = null, tip = null, li = 1e9, lt = -1e9;
      for (const [a, b, d] of gq.tris) for (const q of [a, b, d]) { wv.fromBufferAttribute(P, q).applyMatrix4(mesh.matrixWorld); pos.push(wv.x, wv.y, wv.z); colr.push(K.getX(q), K.getY(q), K.getZ(q)); const l = Math.abs(wv.clone().sub(G.c).dot(G.lat)); if (l < li) { li = l; inner = wv.clone(); } if (l > lt) { lt = l; tip = wv.clone(); } }
      const piv = inner.clone(); piv.y = Math.max(piv.y, tip.y); const og = new THREE.BufferGeometry(); const arr = new Float32Array(pos); for (let i = 0; i < arr.length; i += 3) { arr[i] -= piv.x; arr[i + 1] -= piv.y; arr[i + 2] -= piv.z; }
      og.setAttribute('position', new THREE.BufferAttribute(arr, 3)); og.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colr), 3)); og.computeVertexNormals();
      const om = new THREE.Mesh(og, Array.isArray(mesh.material) ? mesh.material[0] : mesh.material); om.castShadow = true; om.receiveShadow = true; om.userData.axis = 'sea'; oarGroup.add(om);
      oars.push({ m: om, piv, tip: tip.clone(), side: gq.side, at: gq.at, len: lt - li }); }
    restore.push(() => { oarGroup.parent && oarGroup.parent.remove(oarGroup); });
  }
  /* rides: the sheet's ship (through the choreo hook) and the other hulls (props, pieces) turned here */
  function initRides(P) {
    const list = P.ride ? [].concat(P.ride) : null;
    if (list) for (const rd of list) { const H = hullOf(rd); if (H) rides.push(H); }
    else { for (const nm of ['raft', 'ship', 'boat']) { const o = ctx.prop && ctx.prop(nm); if (o) { rides.push(hullOf({ prop: nm })); break; } }
      if (!rides.length) for (const p of pieces) if (p.box && /ship|raft|boat/i.test(p.label) && !/wreck/i.test(p.label)) { const H = hullOf({ piece: p.label }); if (H) { rides.push(H); break; } } }
    /* the sheet's ship rig drives the hull it names: the piece, or a staged prop of that name standing in for a hidden piece (the raft),
       so the sheet's own rider windows (thrown off, back aboard) carry the figures and the kit only gives the channels */
    if (shipRig) { const nm = String(shipRig.piece || '').toLowerCase(); const H = rides.find(h => h.kind === 'piece' && h.rd.piece === shipRig.piece) || rides.find(h => h.kind === 'prop' && nm.includes(h.rd.prop)) || (rides.length ? null : hullOf({ piece: shipRig.piece })); if (H) { H.rig = shipRig; if (!rides.includes(H)) rides.push(H); } }
    for (const H of rides) { H.G = measure(H); if (H.kind === 'piece' && P.oars !== false) cutOars(H, H.G); H.G = Object.assign(measure(H), { beam: H.beam || H.G.beam }); }
  }

  /* ── the sky: a dome of colour behind everything, stars, the moon, clouds ── */
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4600, 32, 18), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.renderOrder = -10; dome.userData.axis = 'sea'; grp.add(dome);
  { const g = dome.geometry; g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3)); }
  const cStar = col('#FFFFFF');
  /* constellations in degrees (x to the right along the sky, y up) and a size per star: the Bear's seven (the Plough, its handle to
     the left), the Pleiades' tight seven, Orion's belt and shoulders */
  const CONST = { bear: [[0, 0, 1.1], [0.6, -5.4, 1], [-7.9, -6.9, 1], [-9.2, -1.5, 0.8], [-15.5, -1.0, 1.1], [-21, 0.2, 1], [-27.5, -3.5, 1]],
    pleiades: [[0, 0, 1.1], [1.0, 0.6, 0.9], [1.8, -0.2, 0.9], [-0.9, 0.9, 0.8], [0.4, 1.6, 0.8], [-0.6, -0.8, 0.7], [1.4, 1.5, 0.7]],
    orion: [[0, 0, 1], [1.4, 0.4, 1], [2.8, 0.8, 1], [-4.5, 8, 1.2], [6, 9.5, 1.1], [-3.5, -9, 1.1], [5.5, -8, 1]] };
  const LINES = { bear: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] }, cLine = col('#8FA7C8');
  const NS = 1100, stars = [], starL = new Layer(grp, geo('round1x1'), basic({ toneMapped: false }), NS + 200);
  for (let i = 0; i < NS; i++) { const az = rnd(i, 1) * Math.PI * 2, se = 0.03 + 0.97 * Math.pow(rnd(i, 2), 1.15), el = Math.asin(se), big = Math.pow(rnd(i, 3), 4);
    const kind = rnd(i, 4), c = kind < 0.84 ? 'transClear' : kind < 0.95 ? 'transYellow' : kind < 0.99 ? 'transLightBlueStar' : 'transOrange';
    stars.push({ d: new V3(Math.sin(az) * Math.cos(el), se, -Math.cos(az) * Math.cos(el)), r: lerp(2500, 4300, rnd(i, 5)), sc: 0.75 + 2.1 * big, c: col(c), thr: cl01(0.04 + 0.92 * rnd(i, 6) * (1 - 0.6 * big)) }); }
  const moonM = new THREE.Mesh(geo('dish4x4'), basic({ toneMapped: false })); moonM.userData.axis = 'sea'; moonM.renderOrder = -5; grp.add(moonM);
  const moonC = col('moon');
  const NC = 52, clouds = [], cloudL = new Layer(grp, geo('plate4x6'), std({ rough: 0.9 }), NC * 14), cloudB = new Layer(grp, geo('brick2x4'), std({ rough: 0.9 }), NC * 6);
  for (let i = 0; i < NC; i++) { const a = rnd(i, 11) * Math.PI * 2, r = lerp(150, 2600, Math.sqrt(rnd(i, 12))), parts = [];
    const n = 6 + Math.floor(rnd(i, 13) * 9); for (let q = 0; q < n; q++) parts.push([(rnd(i, q, 21) - 0.5) * 9, Math.floor(rnd(i, q, 22) * 4) - (q < 3 ? 1 : 0), (rnd(i, q, 23) - 0.5) * 7, rnd(i, q, 24) < 0.35 ? 1 : 0, rnd(i, q, 25) < 0.5 ? 0 : 1, rnd(i, q, 26)]);
    clouds.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y: lerp(330, 560, rnd(i, 14)), thr: rnd(i, 15), parts, sc: lerp(1.2, 2.4, rnd(i, 16)) }); }
  /* rain, splashes, lightning */
  const NR = 700, rainL = new Layer(grp, geo('tile1x2'), std({ opacity: 0.3, rough: 0.05, emissive: '#b8c8e0', glow: 0.3 }), NR * 2), splashL = new Layer(grp, geo('round1x1'), std({ rough: 0.3 }), NR);
  const boltL = new Layer(grp, geo('plate1x2'), basic({ toneMapped: false }), 64);
  const strikes = []; { let x = 1.3; for (let i = 0; i < 160; i++) { x += 2.1 + 2.2 * rnd(i, 31); strikes.push(+x.toFixed(3)); } }

  /* ── lights: moon (cool), night fill, the flash, lanterns; made once, so the page compiles its shaders once ── */
  const moonLight = new THREE.DirectionalLight('#9fb8ff', 0); moonLight.userData.kf = true; moonLight.userData.sea = true; grp.add(moonLight); grp.add(moonLight.target);
  const nightFill = new THREE.HemisphereLight('#4a66b0', '#060a16', 0); nightFill.userData.kf = true; nightFill.userData.sea = true; grp.add(nightFill);
  const flash = new THREE.HemisphereLight('#e8eeff', '#5a6a8c', 0); flash.userData.kf = true; flash.userData.sea = true; grp.add(flash);
  const lanterns = []; const lampL = new Layer(grp, geo('roundbrick1x1'), basic({ toneMapped: false }), 8), capL = new Layer(grp, geo('round1x1'), std({}), 8), postL = new Layer(grp, geo('bar'), std({ rough: 0.6 }), 8);
  const sailL = new Layer(grp, geo('tile1'), std({ rough: 0.5 }), 900);

  let fog = new THREE.Fog(0x000000, 700, 2600), inited = false, last = null;
  const shipXf = { Q: new Q(), off: new V3(), on: false };
  const ofAmp = P => 2.4 * P.swell * (1 + 2 * P.storm);
  let P = Object.assign({}, P0), ws = rings.map(() => []), amp = 2, mean = seaTop;
  function setParams(p) {
    P = Object.assign({}, P0, p || {}); if (P.stars == null) P.stars = Math.pow(cl01((P.night - 0.3) / 0.65), 1.2);   /* none until the sky has darkened */ if (P.clouds == null) P.clouds = P.storm; if (P.rain == null) P.rain = cl01((P.storm - 0.35) / 0.4);
    amp = ofAmp(P); mean = seaTop + (P.level || 0) * U.plate;
    ws = rings.map(sk => waveSet(P, U, sk * 2.6));
    if (!inited) { inited = true; initRides(P); }
  }
  /* the sea's surface under (x, z) in world units, continuous (a hull floats on the mean of what is under it) */
  function surface(x, z, t) { const H = swell(ws[0], x, z, t, amp); return mean + H.h * U.plate; }
  /* heave, pitch and roll of a hull from the swell under bow, stern, port and starboard */
  function hullMotion(G, t, pivot, yaw) {
    const ax = yaw != null ? new V3(Math.sin(yaw), 0, Math.cos(yaw)) : G.ax, lat = yaw != null ? new V3(Math.cos(yaw), 0, -Math.sin(yaw)) : G.lat, L = G.half * 0.8, W = Math.max(G.beam, U.stud) * 0.9;
    const p = pivot || G.c, at = (a, b) => swell(ws[0], p.x + ax.x * a + lat.x * b, p.z + ax.z * a + lat.z * b, t, amp).h;
    const hf = at(L, 0), hb = at(-L, 0), hp = at(0, W), hs = at(0, -W), hc = at(0, 0);
    /* gains over the plain geometry of the swell under the hull: a long hull on a long swell barely tilts, and the eye reads a couple
       of degrees and a plate or two of heave as a ship at sea (the hull's own roll on its keel) */
    const heave = (hf + hb + hp + hs + 2 * hc) / 6 * U.plate * 1.15;
    const pitch = -Math.atan2((hf - hb) * U.plate, 2 * L) * 2.4, roll = Math.atan2((hp - hs) * U.plate, 2 * W) * 2.2 + Math.sin(t * 2 * Math.PI / 5.3) * (1.2 + 3 * P.storm) * DEG * P.swell;
    const lim = (5 + 6 * P.storm) * DEG; return { heave, pitch: Math.max(-lim, Math.min(lim, pitch)), roll: Math.max(-lim * 1.3, Math.min(lim * 1.3, roll)) };
  }
  /* the choreo hook: the sheet's ship channels replaced by the sea's (a third of the sheet's own pitch and roll kept: its impulses) */
  function shipV(Rg, v, t) {
    const tq = onTwos(t), G = (rides.find(h => h.rig) || {}).G; if (!G) return v;
    const m = hullMotion(G, tq, new V3(Rg.pivot[0], Rg.pivot[1], Rg.pivot[2]), Rg.yaw || 0), keep = P.keepSheet ?? 0.33;
    const H = rides.find(h => h.rig), lift = (H.rd.lift ?? P.lift ?? (H.kind === 'prop' ? 1.5 : 0)) * U.plate;
    return Object.assign({}, v, { heave: m.heave + lift, pitch: m.pitch + (v.pitch || 0) * keep, roll: m.roll + (v.roll || 0) * keep + gustRoll(t) });
  }
  /* the other hulls: turned about their waterline centre with the figures that stand on them */
  const _b = new THREE.Box3();
  function ride(t) {
    hideNow(); const tq = onTwos(t);
    if (P.hideCast && ctx.cast) { const res = [].concat(P.hideCast).map(p => new RegExp('^' + String(p).replace(/\*/g, '.*') + '$', 'i')); for (const A of ctx.cast()) if (res.some(r => r.test(A.id))) A.r.figure.visible = false; }
    for (const H of rides) { if (H.rig && H.kind !== 'prop') continue; const objs = H.kind === 'prop' ? [H.o] : H.ms; if (H.kind === 'prop' && !H.o.parent) { const o = ctx.prop(H.rd.prop); if (!o) continue; H.o = o; objs[0] = o; }
      /* re-staged since the last drawing (a key's props): the staged place is the new rest */
      const o0 = objs[0]; if (!H.set || !o0.position.equals(H.set.p) || !o0.quaternion.equals(H.set.q)) { H.base = objs.map(o => ({ o, p: o.position.clone(), q: o.quaternion.clone() })); H.G = Object.assign(measure(H), { beam: H.beam || measure(H).beam }); }
      if (H.kind === 'prop' && H.o.visible === false) continue;
      const G = H.G; let q, off;
      if (H.rig) { const x = ctx.choreoShip && ctx.choreoShip(); if (!x) continue; q = x.Q.clone(); const pv = new V3(...H.rig.pivot), heave = x.off.clone().sub(pv.clone().sub(pv.clone().applyQuaternion(q)));
        off = G.c.clone().sub(G.c.clone().applyQuaternion(q)).add(heave); }   /* turned about its own staged place (a key may stage it away from the rig's pivot), lifted as the rig lifts   /* the sheet's player turned the hidden piece and the riders with our channels: the prop follows */
      else { const m = hullMotion(G, tq, G.c, null); m.roll += gustRoll(t); q = new Q().setFromEuler(new E(G.alongZ ? m.pitch : -m.roll, 0, G.alongZ ? m.roll : m.pitch, 'XYZ'));
        const piv = G.c.clone(); piv.y = mean; off = piv.clone().sub(piv.clone().applyQuaternion(q));
        /* a staged prop (staged on the baked sea's top) lifted a plate and a half, so its deck rides over the stepped crests */
        off.y += m.heave + (H.rd.lift ?? P.lift ?? (H.kind === 'prop' ? 1.5 : 0)) * U.plate; }
      for (const B of H.base) { B.o.position.copy(B.p).applyQuaternion(q).add(off); B.o.quaternion.copy(B.q).premultiply(q); B.o.updateMatrixWorld(true); }
      H.set = { p: o0.position.clone(), q: o0.quaternion.clone() }; H.xf = { Q: q, off };
      if (H.kind === 'prop') propParts(H, t);
      /* riders: the figures standing within the hull's footprint */
      if (ctx.cast && !H.rig) for (const A of ctx.cast()) { const f = A.r.figure; if (f.visible === false || A.r.absent) continue; const d = f.position.clone().sub(G.c), a = d.dot(G.ax), l = d.dot(G.lat);
        if (Math.abs(a) > G.half + 4 || Math.abs(l) > G.beam + 4 || f.position.y < G.b.min.y - 6 || f.position.y > G.b.max.y + 20) continue;
        f.position.applyQuaternion(q).add(off); f.quaternion.premultiply(q); if (A.r.pos) A.r.pos.copy(f.position); f.updateMatrixWorld(true); } }
    holdAt(t);
  }
  /* a gust (P.gust: one time, or [t...], on the take's clock): the hull heels and rights itself, a damped swing */
  function gustRoll(t) { let r = 0; for (const g of [].concat(P.gust == null ? [] : P.gust)) { const d = t - g; if (d >= 0 && d < 5) r += (P.gustHeel ?? 9) * DEG * Math.exp(-d * 0.8) * Math.sin(Math.min(d, 0.35) / 0.35 * Math.PI / 2 + Math.max(0, d - 0.35) * 2 * Math.PI / 1.7); } return r; }
  /* a staged raft's own parts, cut from its one mesh: the sail (its white bricks) swung about the mast by the wind and the gust, and its
     logs, held in their places until the named break (P.break: {at}), then drifting apart on the swell while the mast and the
     steering oar go over and down. Built once per staged prop object (a key that re-stages the prop gets them built again) */
  function propParts(H, t) {
    const o = H.o; let S = H.parts;
    if (!S || S.o !== o) {
      if (S) S.undo();
      let mesh = null; o.traverse(m => { if (!mesh && m.isMesh && m.geometry && m.geometry.groups && m.geometry.groups.length) mesh = m; }); if (!mesh) { H.parts = { o, undo() {} }; return; }
      const g = mesh.geometry, mats = [].concat(mesh.material), P_ = g.attributes.position, ix = g.index, white = mats.map(m => m.color && m.color.r > 0.6 && m.color.g > 0.6 && m.color.b > 0.6), brown = mats.map(m => m.color && m.color.r > m.color.b * 2 && m.color.r < 0.4);
      const keep = [], parts = { sail: [] }, v = new V3(); for (let k = 0; k < 7; k++) parts['log' + k] = [];
      const ofG = (gr, list) => list.push(gr);
      for (const gr of g.groups) { const mi = gr.materialIndex, out = { keep: [], sail: [] }; for (let k = 0; k < 7; k++) out['log' + k] = [];
        for (let q = gr.start; q < gr.start + gr.count; q += 3) { const a = ix ? ix.getX(q) : q, b = ix ? ix.getX(q + 1) : q + 1, c = ix ? ix.getX(q + 2) : q + 2;
          v.set((P_.getX(a) + P_.getX(b) + P_.getX(c)) / 3, (P_.getY(a) + P_.getY(b) + P_.getY(c)) / 3, (P_.getZ(a) + P_.getZ(b) + P_.getZ(c)) / 3);
          let key = 'keep'; if (white[mi]) key = 'sail'; else if (brown[mi] && v.y >= -1 && v.y <= 25 && Math.abs(v.z) < 44 && Math.abs(v.x) < 72) key = 'log' + Math.max(0, Math.min(6, Math.round(v.x / 20) + 3));
          out[key].push(a, b, c); }
        for (const [k, arr] of Object.entries(out)) if (arr.length) (k === 'keep' ? keep : parts[k]).push({ mi, arr }); }
      const geomOf = list => { const ng = new THREE.BufferGeometry(); for (const [k, a] of Object.entries(g.attributes)) ng.setAttribute(k, a); const idx = []; for (const { mi, arr } of list) { ng.addGroup(idx.length, arr.length, mi); idx.push(...arr); } ng.setIndex(idx); ng.boundingBox = g.boundingBox; ng.boundingSphere = g.boundingSphere; return ng; };
      const old = mesh.geometry; mesh.geometry = geomOf(keep); const m0 = { p: mesh.position.clone(), q: mesh.quaternion.clone() };
      const holder = new THREE.Group(); holder.position.copy(mesh.position); holder.quaternion.copy(mesh.quaternion); holder.scale.copy(mesh.scale); mesh.parent.add(holder);
      const mk = list => { const m = new THREE.Mesh(geomOf(list), mesh.material); m.castShadow = true; m.receiveShadow = true; return m; };
      /* the sail hangs from the yard: its pivot at the mast's top (LDraw y is down: the bricks' least y) */
      let yTop = 1e9; for (const { arr } of parts.sail) for (const a of arr) yTop = Math.min(yTop, P_.getY(a));
      const sailPiv = new THREE.Group(); sailPiv.position.set(0, yTop, 0); holder.add(sailPiv); if (parts.sail.length) { const sm_ = mk(parts.sail); sm_.position.set(0, -yTop, 0); sailPiv.add(sm_); }
      const logs = []; for (let k = 0; k < 7; k++) if (parts['log' + k].length) { const lm = mk(parts['log' + k]); holder.add(lm); logs.push({ m: lm, k }); }
      const lines = []; o.traverse(l => { if (l.isLineSegments && l.visible) { lines.push(l); l.visible = false; } });   /* the loader's edge lines would stay where the parts were */
      S = H.parts = { o, mesh, holder, sailPiv, logs, m0, undo() { for (const l of lines) l.visible = true; mesh.geometry = old; mesh.position.copy(m0.p); mesh.quaternion.copy(m0.q); holder.parent && holder.parent.remove(holder); } };
      restore.push(() => S.undo());
    }
    if (!S.holder) return;
    const tq = onTwos(t), wind = cl01(P.wind); let gk = 0; for (const g of [].concat(P.gust == null ? [] : P.gust)) { const d = tq - g; if (d >= 0 && d < 5) gk = Math.max(gk, Math.exp(-d * 0.9) * (d < 0.3 ? d / 0.3 : 1)); }
    /* the sail: swung off the wind and leaning, its shake on twos; the gust throws it hard over */
    S.sailPiv.rotation.set((0.06 + 0.22 * wind) * Math.sin(tq * 1.9) * 0.4 + 0.5 * gk, (0.1 + 0.3 * wind) * Math.sin(tq * 0.7) + 0.7 * gk * Math.sin(tq * 9), 0, 'YXZ');
    const br = P.break && P.break.at != null ? tq - P.break.at : -1;
    S.mesh.position.copy(S.m0.p); S.mesh.quaternion.copy(S.m0.q);
    for (const L of S.logs) { L.m.position.set(0, 0, 0); L.m.rotation.set(0, 0, 0); }
    if (br >= 0) { const a = Math.min(br, 6);
      /* the mast and the steering oar go over and down; the sail goes with the mast; the logs part, turning, riding the swell */
      const fall = new Q().setFromAxisAngle(new V3(0, 0, 1), Math.min(1.35, a * 0.9)); S.mesh.quaternion.copy(S.m0.q).multiply(fall); S.mesh.position.copy(S.m0.p).add(new V3(0, -Math.min(3, a) * 8 * s, 0));
      S.sailPiv.rotation.z = Math.min(1.35, a * 0.9); S.sailPiv.position.y = Math.min(3, a) * -1;
      for (const L of S.logs) { const d = L.k - 3; L.m.position.set(d * 14 * a + (rnd(L.k, 81) - 0.5) * 20 * a, Math.sin(tq * 2.3 + L.k) * 4 + a * 2, (rnd(L.k, 82) - 0.5) * 30 * a); L.m.rotation.set((rnd(L.k, 83) - 0.5) * 0.3 * a, (rnd(L.k, 84) - 0.5) * 0.5 * a, (rnd(L.k, 85) - 0.5) * 0.25 * a); } }
  }
  /* the camera kept out of the water, and lowered in the named windows (P.lowCam: [{t0, t1}, ...]) to just over the swell, still on
     what it framed, so a breaking crest crosses the silhouette */
  function cameraAt(t) {
    if (root.__seaNoCam) return;   /* a dev switch: the take's own camera, untouched */
    const cam = ctx.camera, tq = onTwos(t); cam.updateMatrixWorld(); const p = cam.position, dir = cam.getWorldDirection(new V3());
    const X = hullXf(), focus = X && X.G ? X.G.c.clone().applyQuaternion(X.Q).add(X.off) : null, D = focus ? Math.max(40, p.distanceTo(focus)) : 200, aim = p.clone().addScaledVector(dir, D);
    let w = 0; for (const W_ of [].concat(P.lowCam || [])) { if (!W_ || typeof W_ !== 'object') continue; const a = W_.t0, b = W_.t1; w = Math.max(w, sm((tq - a) / 0.5) * (1 - sm((tq - (b - 0.5)) / 0.5))); }
    /* the floor: the swell under the lens and a little way toward what it frames, so a crest does not stand in the lens */
    let fy = -1e9; for (const k of [0, 0.08, 0.16]) { const q = focus ? p.clone().lerp(focus, k) : p.clone().addScaledVector(dir, k * D); fy = Math.max(fy, surface(q.x, q.z, tq)); }
    const floor = fy + 3.5 * U.plate; let y = p.y; if (w > 0) y = lerp(y, surface(p.x, p.z, tq) + (P.lowCamHeight ?? 5) * U.plate, w); y = Math.max(y, w > 0 ? surface(p.x, p.z, tq) + 1.5 * U.plate : floor);
    if (Math.abs(y - p.y) > 1e-3) { p.y = y; cam.lookAt(aim); cam.updateMatrixWorld(); }
  }
  /* hands held on a hull's support until a named release (P.hold: [{actor, side: 'R'|'L'|'both', t0, t1, at: [x, y, z] in the staged
     prop's own LDU (the raft's mast: [0, -50, 0]), id}]): each arm turned at the shoulder (pitch, and a little out) so the hand goes to
     the point as the hull carries both; the residual (hand to point, world units) is kept for the checks */
  const handLocal = side => { const MF = root.Minifig; if (MF && MF.HAND_R) { const h = side === 'L' ? MF.HAND_L : MF.HAND_R, sl = MF.SLOTS[side === 'L' ? 'armL' : 'armR']; return new V3(h[0] - sl[1], h[1] - sl[2] + 6, h[2] - sl[3] - 4); } return new V3(side === 'L' ? 8.3 : -8.3, 23.6, -14.3); };
  const holdLog = [];
  function holdAt(t) {
    const tq = onTwos(t), H = rides.find(h => h.kind === 'prop' && h.parts && h.parts.mesh); if (!H || !ctx.cast) return;
    for (const hd of [].concat(P.hold || [])) { if (!hd || typeof hd !== 'object' || tq < hd.t0 || tq >= hd.t1) continue; const A = ctx.cast().find(a => a.id === hd.actor); if (!A) continue;
      const r = A.r; r.figure.updateMatrixWorld(true); const sides = hd.side === 'both' || !hd.side ? ['R', 'L'] : [hd.side];
      /* twice: the arms aimed, then the body stepped along the deck toward the hold by what the arms could not reach (at most hd.reach) */
      for (let pass = 0; pass < 2; pass++) { const miss = new V3(); let nm = 0;
      for (const side of sides) { const arm = side === 'L' ? r.armLP : r.armRP; if (!arm || !arm.parent) continue;
        /* the point held: a point of the prop, or 'deck': the deck's top (the logs' upper face) nearest the shoulder, a stud in from its edge */
        let tgt; if (hd.at === 'deck') { const m = H.parts.mesh, sh = m.worldToLocal(arm.getWorldPosition(new V3())); tgt = m.localToWorld(new V3(Math.max(-60, Math.min(60, sh.x)), -2, Math.max(-30, Math.min(30, sh.z)))); } else tgt = H.parts.mesh.localToWorld(new V3(...(hd.at || [0, -50, 0])));
        /* the shoulder's pitch and swing searched (a coarse grid, then a fine one about the best) for the hand nearest the point */
        const hl = handLocal(side), hw = new V3(); let best = [arm.rotation.x, arm.rotation.z], bd = 1e9;
        const tryAt = (x, z) => { arm.rotation.x = x; arm.rotation.z = z; arm.updateMatrixWorld(true); hw.copy(hl); arm.localToWorld(hw); const d = hw.distanceTo(tgt); if (d < bd) { bd = d; best = [x, z]; } };
        for (let x = -3.3; x <= 1.2; x += 0.15) for (let z = -0.9; z <= 0.9; z += 0.3) tryAt(x, z);
        const [bx, bz] = best; for (let x = bx - 0.15; x <= bx + 0.15; x += 0.05) for (let z = bz - 0.3; z <= bz + 0.3; z += 0.1) tryAt(x, z);
        arm.rotation.x = best[0]; arm.rotation.z = best[1]; arm.updateMatrixWorld(true); hw.copy(hl); arm.localToWorld(hw);
        if (pass === 0) { miss.add(tgt.clone().sub(hw).setY(0)); nm++; } else { holdLog.push({ t: +tq.toFixed(3), id: hd.id || hd.actor, side, res: +hw.distanceTo(tgt).toFixed(2) }); if (holdLog.length > 4000) holdLog.shift(); } }
      if (pass === 0 && nm) { miss.divideScalar(nm); const lim = hd.reach ?? 45; if (miss.length() > lim) miss.setLength(lim); r.figure.position.add(miss); if (r.pos) r.pos.copy(r.figure.position); r.figure.updateMatrixWorld(true); } } }
  }
  /* the transform of the first hull (the rig's from the sheet's player, else ours) */
  function hullXf() { const H = rides[0]; if (!H) return null; if (H.rig) { const x = ctx.choreoShip && ctx.choreoShip(); return x ? { Q: x.Q, off: x.off, G: H.G } : { Q: new Q(), off: new V3(), G: H.G }; } return H.xf ? Object.assign({ G: H.G }, H.xf) : null; }

  /* ── one drawing ── */
  const cc = new C(), ramp = ['#0E2142', 'darkBlue', '#1A4A8C', 'blue', 'mediumBlue', 'brightLightBlue'].map(col), cWhite = col('white'), cFoamTile = col('#E4EEF4'), cGlint = col('#FFFFFF'), cGlintSun = col('#FFE2A8');
  function frame(t, look) {
    if (!stripped) { stripped = true; stripSea(P); }
    hideNow();
    const tq = onTwos(t), F = drawing(t), cam = ctx.camera; cam.updateMatrixWorld(); const cp = cam.position, fwd = cam.getWorldDirection(new V3());
    const night = cl01(P.night), storm = cl01(P.storm), wind = cl01(P.wind), foamK = cl01(P.foam);
    /* the light: lightning this drawing? */
    let strike = null; for (const st of [].concat(P.strikes || [])) if (drawing(st) === F) strike = { t: st, i: 1000 + Math.round(st * 12) };
    if (!strike && storm > 0.55) for (let i = 0; i < strikes.length; i++) { if (drawing(strikes[i]) === F) { strike = { t: strikes[i], i }; break; } if (strikes[i] > t + 1) break; }
    const fl = strike ? 1 : 0;
    /* sky colours: the day's (the key's look, or the sea's sky) toward night, toward storm, flashed */
    const day = (P.sky || (look && look.sky) || SKY.day).map(col), nt = SKY.night.map(col), stc = SKY.storm.map(col), fc = SKY.flash.map(col);
    const top = day[0].clone().lerp(nt[0], night).lerp(stc[0], storm * 0.85).lerp(fc[0], fl * 0.7), hor = day[1].clone().lerp(nt[1], night).lerp(stc[1], storm * 0.85).lerp(fc[1], fl * 0.6);
    { const g = dome.geometry, Pp = g.attributes.position, K = g.attributes.color; for (let i = 0; i < Pp.count; i++) { const y = Pp.getY(i) / 4600, u = y < 0 ? 0 : Math.pow(y, 0.55); cc.copy(hor).lerp(top, u); K.setXYZ(i, cc.r, cc.g, cc.b); } K.needsUpdate = true; }
    dome.position.copy(cp);
    const fg = P.fog || (look && look.fog) || [700, 2600]; fog.color.copy(hor); fog.near = fg[0] * (1 - 0.35 * storm); fog.far = Math.max(fg[1], 2200) * (1 - 0.3 * storm); ctx.scene.fog = fog; ctx.scene.background = hor;
    /* the day's lights dimmed by night and storm (each light's base re-read when the take re-lights a key) */
    const dim = (1 - 0.9 * night) * (1 - 0.55 * storm);
    ctx.scene.traverse(o => { if (!o.isLight || o.userData.sea) return; const u = o.userData; if (u.seaSet == null || Math.abs(o.intensity - u.seaSet) > 1e-6) u.seaBase = o.intensity; u.seaSet = u.seaBase * dim; o.intensity = u.seaSet; });
    /* the moon: a dish far off, its light cool; the light whose path the sea throws back (the moon by night, the sun by day) */
    const mo = P.moon === false ? null : Object.assign({ az: 200, el: 18, size: 7 }, P.moon || {}), md = mo ? new V3(Math.sin(mo.az * DEG) * Math.cos(mo.el * DEG), Math.sin(mo.el * DEG), -Math.cos(mo.az * DEG) * Math.cos(mo.el * DEG)) : null;
    const moonVis = mo ? night * (1 - cl01(P.clouds * 1.6)) : 0;
    moonM.visible = moonVis > 0.02; if (mo) { moonM.position.copy(cp).addScaledVector(md, 4000); moonM.quaternion.setFromUnitVectors(new V3(0, 1, 0), md.clone().negate()); const k = mo.size * s; moonM.scale.set(k, k, k); moonM.material.color.copy(moonC).multiplyScalar(0.35 + 0.65 * moonVis); }
    moonLight.intensity = mo ? moonVis * 0.7 : 0; if (md) { moonLight.position.copy(md).multiplyScalar(900).add(new V3(cx, 0, cz)); moonLight.target.position.set(cx, 0, cz); moonLight.target.updateMatrixWorld(); }
    nightFill.intensity = night * (0.32 + 0.2 * storm); flash.intensity = fl * 2.4;
    if (rr) rr.toneMappingExposure *= (1 - 0.18 * night);
    const sunL = look && look.sun ? new V3(...look.sun.dir).normalize() : null;
    const pathDir = moonVis > 0.15 ? md : sunL && night < 0.6 && storm < 0.5 ? sunL : null, pathC = moonVis > 0.15 ? cGlint : cGlintSun, pathK = moonVis > 0.15 ? moonVis : (1 - night) * (1 - storm);
    /* the stars, the large first, behind the clouds */
    starL.begin(); const sv = cl01(P.stars) * (1 - 0.95 * cl01(P.clouds)) * (1 - fl);
    const near = []; for (const K of [].concat(P.constellations || [])) { const pat = CONST[K.name]; if (pat) for (const [dx, dy] of pat) { const az = (K.az + dx * (K.size || 1)) * DEG, el = (K.el + dy * (K.size || 1)) * DEG; near.push(new V3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el))); } }
    if (sv > 0) for (let i = 0; i < NS; i++) { const S_ = stars[i]; if (sv < S_.thr) continue; if (near.length && near.some(n => n.dot(S_.d) > 0.9925)) continue; const k = (0.35 + 0.65 * cl01((sv - S_.thr) / 0.12)) * (rnd(i, F, 7) < 0.05 ? 0.7 : 1), sz = s * S_.sc * (S_.r / 2500) * k;   /* a star comes out growing, never darker than the sky */
      _Q.setFromUnitVectors(new V3(0, 1, 0), S_.d.clone().negate()); starL.put(cp.x + S_.d.x * S_.r, cp.y + S_.d.y * S_.r, cp.z + S_.d.z * S_.r, sz, sz, sz, _Q, S_.c); }
    /* named constellations, fixed brick patterns (2x2-sized clear round plates) at their bearing and height: P.constellations
       [{name: 'bear'|'pleiades'|'orion', az, el, size}], covered as the clouds come */
    for (const K of [].concat(P.constellations || [])) { const pat = CONST[K.name]; if (!pat) continue; const kv = cl01(P.stars) * (1 - cl01((cl01(P.clouds) - 0.15) / 0.3)) * (1 - fl); if (kv <= 0.02) continue;
      for (const [dx, dy, mag] of pat) { const az = (K.az + dx * (K.size || 1)) * DEG, el = (K.el + dy * (K.size || 1)) * DEG, d = new V3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)), r = 3000, sz = s * (K.plate ?? 2.6) * (mag || 1) * (0.4 + 0.6 * kv) * (r / 2500);
        _Q.setFromUnitVectors(new V3(0, 1, 0), d.clone().negate()); starL.put(cp.x + d.x * r, cp.y + d.y * r, cp.z + d.z * r, sz, sz, sz, _Q, cStar); }
      /* the figure's lines: small clear round plates laid between its stars in order (the Plough's bowl and handle), so the pattern reads */
      if (K.lines !== false && LINES[K.name]) for (const [i0, i1] of LINES[K.name]) { const a0 = pat[i0], a1 = pat[i1], n = Math.max(2, Math.round(Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) * (K.size || 1) / 1.1));
        for (let j = 1; j < n; j++) { const u = j / n, az = (K.az + lerp(a0[0], a1[0], u) * (K.size || 1)) * DEG, el = (K.el + lerp(a0[1], a1[1], u) * (K.size || 1)) * DEG, d = new V3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)), r = 3000, sz = s * 0.9 * kv * (r / 2500);
          _Q.setFromUnitVectors(new V3(0, 1, 0), d.clone().negate()); starL.put(cp.x + d.x * r, cp.y + d.y * r, cp.z + d.z * r, sz, sz, sz, _Q, cLine); } } }
    starL.end();
    /* clouds: masses of dark plates drifting with the wind */
    cloudL.begin(); cloudB.begin(); const cv = cl01(P.clouds);
    if (cv > 0) { const wd = (P.dir || 0) * DEG, wx = Math.sin(wd) * (2 + 6 * wind) * U.stud, wz = Math.cos(wd) * (2 + 6 * wind) * U.stud, span = 5600;
      const dark = col('darkBluishGrey').lerp(col('black'), storm * 0.6), light = col('lightBluishGrey'), lit = fl ? col('#cfd8ec') : null;
      for (let i = 0; i < NC; i++) { const Cl = clouds[i]; if (cv < Cl.thr * 0.95 + 0.04) continue; let x = Cl.x + wx * tq, z = Cl.z + wz * tq; x = cx + ((((x - cx) + span / 2) % span) + span) % span - span / 2; z = cz + ((((z - cz) + span / 2) % span) + span) % span - span / 2;
        const sc = Cl.sc * s * cl01((cv - Cl.thr * 0.95) / 0.1);
        for (const [dx, dy, dz, br, rot, sh] of Cl.parts) { cc.copy(storm > 0.3 ? dark : light).lerp(dark, storm).multiplyScalar(0.8 + 0.3 * sh); if (lit) cc.lerp(lit, 0.6); _Q.setFromAxisAngle(new V3(0, 1, 0), rot * Math.PI / 2);
          (br ? cloudB : cloudL).put(x + dx * 40 * sc, Cl.y + dy * 8 * sc * 1.6, z + dz * 40 * sc, sc * 1.6, sc * (br ? 1.2 : 1.6), sc * 1.6, _Q, cc); } } }
    cloudL.end(); cloudB.end();
    /* the hull under way: its transform, footprint and wake */
    const X = hullXf(), G = X && X.G, way = P.way || 0;
    const bowA = G ? G.bowSign : -1;
    /* ── the ocean ── */
    for (const L of water) L.begin(); foamL.begin(); glintL.begin(); foamTile.begin();
    const faceL = (pathDir || sunL || md || new V3(0.5, 0.6, 0.4)).clone().setY(0).normalize();
    const bot = mean - (Math.ceil(amp * 1.25) + 2) * U.plate, Amax = amp * 1.2, crestAt = Amax * (0.95 - 0.15 * foamK - 0.1 * wind - 0.15 * storm), V = new V3(), Nn = new V3(), Rv = new V3();
    const fogFar = fog.far * 1.15;
    for (let c = 0; c < N; c++) {
      if (cells.land[c]) continue; const k = cells.k[c], x = cells.x[c], z = cells.z[c], sk = rings[k], T = sk * U.stud;
      const dx = x - cp.x, dz = z - cp.z, dist = Math.hypot(dx, dz); if (k >= 3 && dist - T > fogFar) continue;
      if (k >= 2 && (dx * fwd.x + dz * fwd.z) < -T * 1.5 && dist > T * 2) continue;   /* far tiles behind the lens */
      const att = k <= 1 ? 1 : k === 2 ? 0.9 : k === 3 ? 0.75 : 0.55, H = swell(ws[k], x, z, tq, amp * att);
      let h = H.h, q = Math.round(h), clear = false, wake = 0;
      if (G && k <= 1) { const ox = X.off, solid = rides[0] && rides[0].kind === 'piece', d = new V3(x - G.c.x - ox.x, 0, z - G.c.z - ox.z), a = d.dot(G.ax), l = d.dot(G.lat), ah = a / (G.half * 0.98), lb = l / (G.beam * 1.02);
        if (ah * ah * ah * ah + lb * lb < 1) clear = solid;
        else if (way > 0 || P.foam > 0.6) { const ab = a * bowA, astern = -ab - G.half * 0.9, kel = Math.abs(l) - G.beam * 0.45 - Math.max(0, astern) * 0.22;
          if (astern > -G.half * 0.05 && kel < U.stud * 0.35 && astern < 26 * U.stud) { const along = Math.floor((astern / U.stud) - way * 1.6 * tq), side = Math.round(l / U.stud), fade = 1 - cl01(astern / (26 * U.stud)); wake = cl01(way / 2.5) * (rnd(side, along, 41) < 0.08 + 0.32 * fade ? 1 : 0.2); }
          if (ab > G.half * 0.62 && Math.abs(l) - G.beam < 0.6 * U.stud && Math.abs(l) > G.beam * 0.8) wake = Math.max(wake, cl01((way + P.swell * (1 + storm)) / 3) * (rnd(cells.i[c], cells.j[c], F >> 1) < 0.2 ? 0.8 : 0.2)); } }
      if (clear) q = Math.min(q, -Math.ceil(amp * 1.2) - 1);
      const y = mean + q * U.plate, L = water[k];
      /* colour by height, slope (the face toward the wind lighter) and a tile-by-tile dither */
      /* the shade: troughs dark blue, crests medium and light blue, a face turned to the light a step lighter and one turned away a step
         darker, so a still frame shows the swell's shape and not only its steps */
      const lit = Math.max(-1.3, Math.min(1.3, -(H.gx * faceL.x + H.gz * faceL.z) * U.plate * 7 / Math.max(0.6, amp / 2.4)));
      const lv = cl01((h / Amax + 0.75) / 1.85) * 5 + lit + (rnd(cells.i[c], cells.j[c], 3) - 0.5) * 0.35, li = Math.max(0, Math.min(5, Math.round(lv)));
      cc.copy(ramp[li]);
      const crest = !clear && h > crestAt && H.dt > -0.1 * amp && rnd(cells.i[c], cells.j[c], F >> 1) < 0.6 * (1 - cl01(dist / 1400)), whitecap = !clear && storm > 0.3 && h > Amax * 0.5 && rnd(cells.i[c], cells.j[c], F >> 2) < foamK * wind * storm * 0.08;
      if (crest || wake > 0.5) cc.lerp(k >= 2 ? cFoamTile : cWhite, k >= 2 ? 0.6 : 0.3);
      /* the path of light: the tile's facet (the swell's slope, steepened) mirroring the light into the lens */
      let glint = false;
      if (pathDir && pathK > 0.05 && !clear && dist < fogFar) { V.set(x - cp.x, y + U.plate - cp.y, z - cp.z).normalize(); Nn.set(-H.gx * U.plate * 5, 1, -H.gz * U.plate * 5).normalize(); Rv.copy(V).addScaledVector(Nn, -2 * V.dot(Nn));
        const dd = Rv.dot(pathDir), thr = 0.985 - 0.02 * Math.min(1, dist / 1500); if (dd > thr && rnd(cells.i[c], cells.j[c], F) < 0.75) { glint = true; cc.lerp(pathC, 0.55 * pathK); } }
      L.put(x, bot, z, s, (y + U.plate - bot) / 8, s, null, cc);
      const topY = y + U.plate;
      if (glint && k <= 3) { const n = k <= 1 ? 1 : k === 2 ? 3 : 5; for (let g = 0; g < n; g++) { const ox = k <= 1 ? 0 : (rnd(c, g, F) - 0.5) * T * 0.8, oz = k <= 1 ? 0 : (rnd(c, g, F + 7) - 0.5) * T * 0.8, sc2 = s * (k <= 1 ? sk * 0.9 : 1.6); cc.copy(pathC).multiplyScalar(0.55 + 0.45 * pathK); glintL.put(x + ox, topY - 6.5 * s, z + oz, sc2, s, sc2, null, cc); } }
      /* foam: round plates on the crest, the wake, whitecaps */
      if ((crest || wake > 0.5 || whitecap) && k <= 1 && (dist > 140 || rnd(cells.i[c], cells.j[c], 5) < 0.12)) { const n = sk === 1 ? 1 : 1 + (rnd(cells.i[c], cells.j[c], F >> 1) < 0.3 ? 1 : 0);
        for (let f = 0; f < n; f++) { const ox = sk === 1 ? 0 : ((f & 1) - 0.5) * U.stud, oz = sk === 1 ? 0 : ((f >> 1) - 0.5) * U.stud; foamL.put(x + ox, topY, z + oz, s, s, s, null, cWhite); } }
      else if (crest && k === 2) foamTile.put(x + (rnd(c, 1) - 0.5) * T * 0.5, topY, z + (rnd(c, 2) - 0.5) * T * 0.5, s * 2, s, s * 2, null, cWhite);
    }
    for (const L of water) L.end(); foamL.end(); glintL.end(); foamTile.end();
    /* ── the oars: each turned about its gunwale so the blade is in the water under it, on a stroke if asked ── */
    if (X && oars.length) { const O = P.oars === false ? null : Object.assign({ sweep: 0, period: 2.4, dip: 0.5 }, P.oars || {});
      for (const oa of oars) { const ph = O && O.sweep ? ((((tq - (O.origin || 0)) / O.period + (O.stagger || 0) * (oa.at / (G.half * 2))) % 1) + 1) % 1 : 0, drive = ph < 0.55;   /* one clock for every oar (the sheet's ROWING clock: period, origin), so the blades go in together */
        const sw = O && O.sweep ? (drive ? lerp(-1, 1, sm(ph / 0.55)) : lerp(1, -1, sm((ph - 0.55) / 0.45))) * O.sweep * DEG : 0;
        const qs = new Q().setFromAxisAngle(new V3(0, 1, 0), sw * oa.side * (G.alongZ ? 1 : -1));
        const pivW = oa.piv.clone().applyQuaternion(X.Q).add(X.off), tipR = oa.tip.clone().sub(oa.piv).applyQuaternion(qs), tipW = tipR.clone().applyQuaternion(X.Q).add(pivW);
        const want = surface(tipW.x, tipW.z, tq) - (O ? (drive || !O.sweep ? O.dip : -1.2) : 0.5) * U.plate, dy = want - tipW.y, lat = Math.max(1, Math.abs(tipR.dot(G.lat)));
        const dip = Math.max(-28 * DEG, Math.min(28 * DEG, Math.asin(Math.max(-1, Math.min(1, dy / lat)))));
        const qd = new Q().setFromAxisAngle(G.ax, dip * oa.side * (G.alongZ ? 1 : -1));
        oa.m.quaternion.copy(X.Q).multiply(qd).multiply(qs); oa.m.position.copy(pivW); oa.m.updateMatrixWorld(true); } }
    /* ── lanterns on posts at bow and stern, warm, flickering on twos ── */
    lampL.begin(); capL.begin(); postL.begin();
    const lanOn = P.lanterns !== false && X && G, lanK = cl01(night * 1.4);
    if (lanOn) { const pts = Array.isArray(P.lanterns) ? P.lanterns.map(p => new V3(p[0], p[1], p[2])) : [0.86, -0.78].map(f => G.c.clone().addScaledVector(G.ax, f * G.half * -bowA).setY(G.deck != null ? G.deck : G.b.min.y + (G.b.max.y - G.b.min.y) * 0.14));
      while (lanterns.length < pts.length) { const pl = new THREE.PointLight('#ffae55', 0, 300, 1.3); pl.userData.kf = true; pl.userData.sea = true; grp.add(pl); lanterns.push(pl); }
      pts.forEach((p0, i) => { const base = p0.clone().applyQuaternion(X.Q).add(X.off), up = new V3(0, 1, 0).applyQuaternion(X.Q), postH = 2.5 * U.brick, lamp = base.clone().addScaledVector(up, postH);
        _Q.copy(X.Q); postL.put(base.x, base.y, base.z, s * 1.2, postH, s * 1.2, _Q, col('reddishBrown')); const fk = 0.82 + 0.18 * rnd(i, F, 51); cc.copy(col('transOrange')).lerp(col('#FFE9B0'), 0.55 * lanK * fk).multiplyScalar(0.55 + 0.6 * lanK * fk);
        lampL.put(lamp.x, lamp.y, lamp.z, s, s, s, _Q, cc); const capP = lamp.clone().addScaledVector(up, U.brick); capL.put(capP.x, capP.y, capP.z, s * 1.05, s, s * 1.05, _Q, col('black'));
        lanterns[i].position.copy(lamp).addScaledVector(up, U.brick * 0.5); lanterns[i].intensity = lanK * 1.7 * fk; }); }
    for (let i = (lanOn ? (Array.isArray(P.lanterns) ? P.lanterns.length : 2) : 0); i < lanterns.length; i++) lanterns[i].intensity = 0;
    lampL.end(); capL.end(); postL.end();
    /* ── a sail of tiles hung from the yard, each row stepped out by the wind (a plate at a time) ── */
    sailL.begin();
    if (P.sail && X && G) { const S_ = P.sail, w = S_.width || 8, rows = Math.round(((S_.y1 || 230) - (S_.y0 || 110)) / U.stud), depth = (S_.depth ?? 3) * (0.35 + 0.65 * wind) * (0.88 + 0.12 * Math.sin(tq * 1.7));
      const st = col(S_.stripe || 'red'), wh = col('white'), m0 = new V3(S_.at[0], 0, S_.at[1]);
      for (let r = 0; r < rows; r++) for (let q = 0; q < w; q++) { const u = (q + 0.5) / w, v = (r + 0.5) / rows, bil = Math.round(depth * Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.15 + 0.85 * v))) * 8 * s;
        const p = m0.clone().addScaledVector(G.lat, (u - 0.5) * w * U.stud).addScaledVector(G.ax, bowA * (bil + 1.5 * U.stud)); p.y = (S_.y1 || 230) - (r + 1) * U.stud;
        const wp = p.applyQuaternion(X.Q).add(X.off); _Q.copy(X.Q).multiply(new Q().setFromAxisAngle(G.lat, Math.PI / 2));
        sailL.put(wp.x, wp.y, wp.z, s, s, s, _Q, (Math.floor(q / 2) % 2 === 0) ? st : wh); } }
    sailL.end();
    /* ── rain: trans-clear 1x2 tiles smeared along their fall, splashing on the sea ── */
    rainL.begin(); splashL.begin(); const rv = cl01(P.rain);
    if (rv > 0) { const n = Math.round(NR * rv), W_ = 900, fall = 70 * U.stud, wd = (P.dir || 0) * DEG, wx = Math.sin(wd) * (6 + 14 * wind) * U.stud, wz = Math.cos(wd) * (6 + 14 * wind) * U.stud;
      const bx = cp.x + fwd.x * W_ * 0.42 - W_ / 2, bz = cp.z + fwd.z * W_ * 0.42 - W_ / 2, topY = Math.max(cp.y + 340, mean + 400), Hh = topY - mean;
      const vel = new V3(wx, -fall, wz), dir = vel.clone().normalize(), qr = new Q().setFromUnitVectors(new V3(0, 0, 1), dir), step = vel.length() / 12;
      for (let i = 0; i < n; i++) { const ph = rnd(i, 61), x0 = rnd(i, 62) * W_, z0 = rnd(i, 63) * W_, cyc = (tq * fall / Hh + ph), k = cyc - Math.floor(cyc), yy = topY - k * Hh;
        const x = bx + ((((x0 + wx * k * Hh / fall) - (bx % W_)) % W_) + W_) % W_, z = bz + ((((z0 + wz * k * Hh / fall) - (bz % W_)) % W_) + W_) % W_;
        const sea = surface(x, z, tq) + U.plate; if (yy < sea || Math.hypot(x - cp.x, yy - cp.y, z - cp.z) < 140) continue;
        /* the smear: the drop drawn as two 1x2 tiles end to end back along its fall (a tile is 40 LDU long) */
        const k2 = Math.min(1, (yy - sea) / (2 * 40 * s));
        rainL.put(x, yy, z, s * 0.25, s * 0.25, s * k2, qr); rainL.put(x - dir.x * 40 * s * k2, yy - dir.y * 40 * s * k2, z - dir.z * 40 * s * k2, s * 0.25, s * 0.25, s * k2, qr);
        if (yy - sea < step * 1.2) splashL.put(x + (rnd(i, F, 64) - 0.5) * U.stud, sea, z + (rnd(i, F, 65) - 0.5) * U.stud, s * 0.8, s * 0.8, s * 0.8, null, cWhite); } }
    rainL.end(); splashL.end();
    /* ── lightning: one drawing, a bolt of trans-yellow plates from the cloud to the sea ahead of the lens ── */
    boltL.begin();
    if (strike) { const i = strike.i, d = lerp(650, 1000, rnd(i, 71)), side = (rnd(i, 72) - 0.5) * 0.7 * d, rt = new V3(-fwd.z, 0, fwd.x).normalize(), f2 = new V3(fwd.x, 0, fwd.z).normalize();
      let p = cp.clone().addScaledVector(f2, d).addScaledVector(rt, side); const top = Math.min(mean + 520, Math.max(mean + 260, cp.y + 160)); p.y = top; const segs = 16, pts = [p.clone()]; for (let k = 1; k <= segs; k++) { p = p.clone(); p.y = lerp(top, mean, k / segs); p.addScaledVector(rt, (rnd(i, k, 73) - 0.5) * 70).addScaledVector(f2, (rnd(i, k, 74) - 0.5) * 50); pts.push(p); }
      const by = col('transYellow').lerp(col('#FFF8D8'), 0.5); for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], dv = b.clone().sub(a), len = dv.length(); _Q.setFromUnitVectors(new V3(0, 0, 1), dv.normalize()); boltL.put((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, s * 2.2, s * 2.2, len / 40, _Q, by); } }
    boltL.end();
    last = { t, F, strike: !!strike, cells: N, drawn: water.reduce((a, L) => a + L.n, 0), foam: foamL.n, glints: glintL.n, stars: starL.n, rain: rainL.n, clouds: cloudL.n + cloudB.n };
    return last;
  }
  function dispose() { ctx.scene.traverse(o => { if (o.isLight && o.userData.seaSet != null) { if (Math.abs(o.intensity - o.userData.seaSet) < 1e-6) o.intensity = o.userData.seaBase; delete o.userData.seaSet; delete o.userData.seaBase; } });
    for (const f of restore.splice(0).reverse()) try { f(); } catch (e) {} grp.parent && grp.parent.remove(grp); grp.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.dispose && m.dispose()); }); }
  return { setParams, shipV, ride, frame, dispose, camera: cameraAt, holds: () => holdLog.slice(), surface: (x, z, t) => surface(x, z, onTwos(t)), stats: () => Object.assign({ rings: R, rides: rides.map(h => ({ kind: h.kind, label: h.rd.piece || h.rd.prop, rig: !!h.rig, beam: h.G && +h.G.beam.toFixed(1), half: h.G && +h.G.half.toFixed(1) })), oars: oars.length, mean, amp, hold: holdLog.length ? { n: holdLog.length, worst: Math.max(...holdLog.map(h => h.res)), last: holdLog.slice(-2) } : null }, last || {}), get params() { return P; } };
}

root.OdysseySea = { stage, resolve, hasSea, swell, waveSet, geo, version: 1 };
})(typeof window !== 'undefined' ? window : globalThis);
