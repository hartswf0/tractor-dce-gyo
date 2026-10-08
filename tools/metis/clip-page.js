/* tools/metis/clip-page.js — the in-page half of tools/metis/clip.js (window.MetisClip): the cast's bodies against each other, the set,
   the props, the hulls and the water at one drawing of a prepared take. Read clip.js for the rules and the tolerances; this file only
   measures. It runs inside the player beside film-readymades/odyssey-take.js and uses the take's own cinematographer api (cineApi():
   poseAt, kfActor, kfSolid, the take T), handed to it by a stand-in for tools/cinematographer/solve.js.

   The set's triangles go into a uniform grid (the same grid and ray walk as tools/cinematographer/solve.js buildGrid/gridRay, copied
   here because solve.js keeps them private), built once per key; a mesh that moves inside a key (a hull on the swell, a stool in
   flight, a ship's rig) is taken out of that grid and put in a small grid of its own at every drawing. */
(function (root) {
'use strict';
const THREE = root.THREE, V3 = THREE.Vector3;
const PARTS = ['headP', 'torsoP', 'hipsP', 'armRP', 'armLP', 'legRP', 'legLP'], CORE = new Set(['headP', 'torsoP', 'hipsP']);
const NAME = { headP: 'head', torsoP: 'torso', hipsP: 'hips', armRP: 'right arm', armLP: 'left arm', legRP: 'right leg', legLP: 'left leg' };

function buildGrid(meshes, H0) {
  const per = meshes.map(m => { const g = m.geometry, pos = g && g.attributes && g.attributes.position; if (!pos) return 0; return ((g.index ? g.index.count : pos.count) / 3) | 0; });
  const n = per.reduce((a, b) => a + b, 0), Tr = new Float32Array(n * 9), Mi = new Int32Array(n), v = new V3(); let k = 0;
  meshes.forEach((m, mi) => { const g = m.geometry, pos = g && g.attributes && g.attributes.position; if (!pos) return; const idx = g.index, mw = m.matrixWorld;
    for (let t = 0; t < per[mi]; t++) { for (let c = 0; c < 3; c++) { const i = idx ? idx.getX(t * 3 + c) : t * 3 + c; v.fromBufferAttribute(pos, i).applyMatrix4(mw); Tr[k * 9 + c * 3] = v.x; Tr[k * 9 + c * 3 + 1] = v.y; Tr[k * 9 + c * 3 + 2] = v.z; } Mi[k] = mi; k++; } });
  if (!n) return { n: 0 };
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < n * 3; i++) for (let a = 0; a < 3; a++) { const x = Tr[i * 3 + a]; if (x < lo[a]) lo[a] = x; if (x > hi[a]) hi[a] = x; }
  lo = lo.map(x => x - 1); hi = hi.map(x => x + 1); const ext = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]), cs = Math.max(0.25 * H0, ext / 128);
  const N = [0, 1, 2].map(a => Math.max(1, Math.min(200, Math.ceil((hi[a] - lo[a]) / cs))));
  const cell = (a, x) => Math.max(0, Math.min(N[a] - 1, Math.floor((x - lo[a]) / cs)));
  const count = new Int32Array(N[0] * N[1] * N[2] + 1), rng = new Int32Array(n * 6);
  for (let t = 0; t < n; t++) { for (let a = 0; a < 3; a++) { const x0 = Math.min(Tr[t * 9 + a], Tr[t * 9 + 3 + a], Tr[t * 9 + 6 + a]), x1 = Math.max(Tr[t * 9 + a], Tr[t * 9 + 3 + a], Tr[t * 9 + 6 + a]); rng[t * 6 + a] = cell(a, x0); rng[t * 6 + 3 + a] = cell(a, x1); }
    for (let x = rng[t * 6]; x <= rng[t * 6 + 3]; x++) for (let y = rng[t * 6 + 1]; y <= rng[t * 6 + 4]; y++) for (let z = rng[t * 6 + 2]; z <= rng[t * 6 + 5]; z++) count[(x * N[1] + y) * N[2] + z + 1]++; }
  for (let i = 1; i < count.length; i++) count[i] += count[i - 1];
  const fill = count.slice(), items = new Int32Array(count[count.length - 1]);
  for (let t = 0; t < n; t++) for (let x = rng[t * 6]; x <= rng[t * 6 + 3]; x++) for (let y = rng[t * 6 + 1]; y <= rng[t * 6 + 4]; y++) for (let z = rng[t * 6 + 2]; z <= rng[t * 6 + 5]; z++) items[fill[(x * N[1] + y) * N[2] + z]++] = t;
  return { Tr, Mi, meshes, lo, cs, N, start: count, items, stamp: new Int32Array(n), q: 0, n };
}
/* the hits of a ray (o, unit d) up to far, nearest first: {distance, mesh, back} (back: the face's winding agrees with the ray) */
function gridRay(G, o, d, far, skip) {
  const out = []; if (!G || !G.n) return out; G.q++; const { Tr, lo, cs, N } = G;
  let t0 = 0, t1 = far; const O = [o.x, o.y, o.z], D = [d.x, d.y, d.z];
  for (let a = 0; a < 3; a++) { const oa = O[a], da = D[a], b0 = lo[a], b1 = lo[a] + N[a] * cs;
    if (Math.abs(da) < 1e-12) { if (oa < b0 || oa > b1) return out; continue; } let ta = (b0 - oa) / da, tb = (b1 - oa) / da; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return out; }
  const P = O.map((x, a) => x + D[a] * (t0 + 1e-6)), c = P.map((x, a) => Math.max(0, Math.min(N[a] - 1, Math.floor((x - lo[a]) / cs))));
  const step = D.map(x => x > 0 ? 1 : x < 0 ? -1 : 0), tMax = D.map((x, a) => x > 0 ? (lo[a] + (c[a] + 1) * cs - O[a]) / x : x < 0 ? (lo[a] + c[a] * cs - O[a]) / x : Infinity), tDel = D.map(x => x ? cs / Math.abs(x) : Infinity);
  for (let guard = 0; guard < 3000; guard++) {
    const ci = (c[0] * N[1] + c[1]) * N[2] + c[2], tExit = Math.min(tMax[0], tMax[1], tMax[2]);
    for (let j = G.start[ci]; j < G.start[ci + 1]; j++) { const t = G.items[j]; if (G.stamp[t] === G.q) continue; G.stamp[t] = G.q;
      const mesh = G.meshes[G.Mi[t]]; if (skip && skip.has(mesh)) continue;
      const b = t * 9, e1x = Tr[b + 3] - Tr[b], e1y = Tr[b + 4] - Tr[b + 1], e1z = Tr[b + 5] - Tr[b + 2], e2x = Tr[b + 6] - Tr[b], e2y = Tr[b + 7] - Tr[b + 1], e2z = Tr[b + 8] - Tr[b + 2];
      const px = D[1] * e2z - D[2] * e2y, py = D[2] * e2x - D[0] * e2z, pz = D[0] * e2y - D[1] * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-9) continue;
      const inv = 1 / det, sx = O[0] - Tr[b], sy = O[1] - Tr[b + 1], sz = O[2] - Tr[b + 2], u = (sx * px + sy * py + sz * pz) * inv; if (u < 0 || u > 1) continue;
      const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, w = (D[0] * qx + D[1] * qy + D[2] * qz) * inv; if (w < 0 || u + w > 1) continue;
      const dist = (e2x * qx + e2y * qy + e2z * qz) * inv; if (dist < 1e-4 || dist > far) continue;
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      out.push({ distance: dist, mesh, back: nx * D[0] + ny * D[1] + nz * D[2] > 0 }); }
    if (out.length) { let m = Infinity; for (const h of out) m = Math.min(m, h.distance); if (m <= tExit) break; }
    if (tExit > t1) break; const a = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : (tMax[1] < tMax[2] ? 1 : 2); c[a] += step[a]; if (c[a] < 0 || c[a] >= N[a]) break; tMax[a] += tDel[a];
  }
  out.sort((a, b) => a.distance - b.distance); return out;
}
/* ── oriented boxes: {c, u: [3 unit axes], e: [3 half sizes]}; the overlap depth by the separating axis test (negative: apart) ── */
function obbOf(node, meshes) {
  node.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(node.matrixWorld).invert(), M = new THREE.Matrix4(), b = new THREE.Box3(), q = new V3();
  for (const m of meshes) { const g = m.geometry; if (!g) continue; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox; M.multiplyMatrices(inv, m.matrixWorld);
    for (let i = 0; i < 8; i++) { q.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(M); b.expandByPoint(q); } }
  if (b.isEmpty()) return null;
  const e = node.matrixWorld.elements, ax = [new V3(e[0], e[1], e[2]), new V3(e[4], e[5], e[6]), new V3(e[8], e[9], e[10])], sc = ax.map(a => a.length());
  const lc = b.getCenter(new V3()), ls = b.getSize(new V3());
  return { c: lc.applyMatrix4(node.matrixWorld), u: ax.map((a, i) => a.multiplyScalar(1 / (sc[i] || 1))), e: [ls.x / 2 * sc[0], ls.y / 2 * sc[1], ls.z / 2 * sc[2]] };
}
function obbDepth(A, B) {
  const T = B.c.clone().sub(A.c), axes = [...A.u, ...B.u]; for (const a of A.u) for (const b of B.u) { const x = a.clone().cross(b); if (x.lengthSq() > 1e-6) axes.push(x.normalize()); }
  let depth = Infinity;
  for (const L of axes) { const ra = A.e[0] * Math.abs(A.u[0].dot(L)) + A.e[1] * Math.abs(A.u[1].dot(L)) + A.e[2] * Math.abs(A.u[2].dot(L)), rb = B.e[0] * Math.abs(B.u[0].dot(L)) + B.e[1] * Math.abs(B.u[1].dot(L)) + B.e[2] * Math.abs(B.u[2].dot(L));
    const o = ra + rb - Math.abs(T.dot(L)); if (o < depth) depth = o; if (depth < 0) return depth; }
  return depth;
}
const corners = B => { const out = []; for (let i = 0; i < 8; i++) { const p = B.c.clone(); for (let k = 0; k < 3; k++) p.add(B.u[k].clone().multiplyScalar(((i >> k) & 1 ? 1 : -1) * B.e[k])); out.push(p); } return out; };
const shown = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };

function make(api, opt) {
  const { scene, camera, T } = api, H0 = Object.values(T.H || {}).sort((a, b) => a - b)[0] || 100;
  const Hof = id => (T.H && T.H[id]) || H0, Cr = root.OdysseyCreatures, C = T.choreo && T.choreo.C, rigs = (T.creatures && T.creatures.rigs) || {};
  const tol = opt.tol;
  /* ── a figure's body parts: each part's own visible meshes (held things, capes and the next part down the chain left out) ── */
  function partsOf(id) {
    const a = api.kfActor(id); if (!a) return null; const r = a.rig; if (r.figure.visible === false || r.absent || !shown(r.figure)) return null;
    const own = new Set(PARTS.map(k => r[k]).filter(Boolean)), out = {};
    for (const k of PARTS) { const P = r[k]; if (!P) continue; const ms = [];
      let groups = 0;
      const walk = (o, top) => { for (const c of o.children) { if (own.has(c) || c.visible === false) continue; const nm = String(c.name || '');
          if (top && /^slot:(weapon|cape|collar|shield)/.test(nm)) continue;
          if (top && (k === 'armRP' || k === 'armLP') && c.type === 'Group' && !nm.startsWith('slot')) { groups++; if (groups > 2) continue; }   /* the arm, the hand; a third group is what the hand holds */
          if (c.userData && (c.userData.held || c.userData.rope)) continue;
          if (c.isMesh && !(c.material && c.material.transparent && c.material.opacity < 0.3)) ms.push(c); walk(c, false); } };
      walk(P, true); if (!ms.length) continue; const B = obbOf(P, ms); if (B) out[k] = B; }
    return out;
  }
  /* a creature's nodes (head, body, legs...), each with the meshes nearest it */
  function creatureParts(id) {
    const rig = rigs[id], g = T.creatures && T.creatures.group.getObjectByName('creature:' + id); if (!rig || !g || !shown(g) || !rig.three || !rig.three.objs) return null;
    const nodes = Object.entries(rig.three.objs).filter(([n, o]) => o && o.visible !== false), set = new Map(nodes.map(([n, o]) => [o, n])), per = new Map();
    g.traverse(m => { if (!m.isMesh || !shown(m)) return; for (let p = m.parent; p; p = p.parent) { if (set.has(p)) { const n = set.get(p); if (!per.has(n)) per.set(n, []); per.get(n).push(m); return; } if (p === g) return; } });
    const out = {}; for (const [n, o] of nodes) { const ms = per.get(n); if (!ms || !ms.length) continue; const B = obbOf(o, ms); if (B && Math.max(...B.e) > 0.02 * H0) out[n] = B; }
    return out;
  }
  /* ── the set at a key: the solid meshes that are neither figure nor creature nor the sea's instanced bricks ── */
  let W = null;
  const sig = m => { const e = m.matrixWorld.elements; return e[12] * 1.31 + e[13] * 2.17 + e[14] * 3.07 + e[0] * 101 + e[2] * 103 + e[8] * 107 + e[5] * 109; };
  function world(key) {
    const figs = new Set(); for (const a of ButterCast.cast) a.rig.figure.traverse(o => figs.add(o));
    if (T.creatures) T.creatures.group.traverse(o => figs.add(o));
    if (!W || W.key !== key.id) {
      const stat = []; scene.traverse(o => { if (api.kfSolid(o) && !figs.has(o) && !o.isInstancedMesh && !o.isSkinnedMesh && !(o.material && o.material.transparent && o.material.opacity < 0.5)) stat.push(o); });
      const sigs = new Map(stat.map(m => [m, sig(m)]));
      W = { key: key.id, stat, sigs, G: buildGrid(stat, H0), moved: new Set(), D: null };
    }
    /* what moved since the grid was built: out of the key's grid, into this drawing's own */
    const moved = new Set(); for (const m of W.stat) { if (!shown(m)) { moved.add(m); continue; } if (Math.abs(sig(m) - W.sigs.get(m)) > 1e-3) moved.add(m); }
    const dyn = [...moved].filter(m => shown(m));
    W.moved = moved; W.D = dyn.length ? buildGrid(dyn, H0) : null; W.figs = figs;
    return W;
  }
  const label = m => { for (let p = m; p; p = p.parent) { const n = String(p.name || ''); if (n.startsWith('prop:')) return n; } const pc = m.userData && m.userData.partId; const pg = pc != null ? (OdysseyFilm.pieces() || []).find(x => x.id === pc || x.partId === pc) : null; return pg ? pg.label : (m.name || (m.parent && m.parent.name) || 'set part'); };
  const AX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(d => new V3(...d));
  const first = (p, d, far) => { const a = gridRay(W.G, p, d, far, W.moved)[0], b = W.D ? gridRay(W.D, p, d, far)[0] : null; return !a ? b : !b ? a : a.distance < b.distance ? a : b; };
  /* a point inside a solid: of the six axis rays, at least five meet the set and more than two thirds of those meet a back face first;
     the depth is the nearest of those faces (the way out) */
  function inside(p) {
    let n = 0, back = 0, dmin = Infinity, mesh = null; const tally = new Map();
    for (const d of AX) { const h = first(p, d, 3 * H0); if (!h) continue; n++; if (h.back) { back++; tally.set(h.mesh, (tally.get(h.mesh) || 0) + 1); if (h.distance < dmin) { dmin = h.distance; } } }
    if (n < 5 || back / n <= 0.67) return null;
    let best = 0; for (const [m, k] of tally) if (k > best) { best = k; mesh = m; }
    return { depth: dmin, mesh };
  }
  /* the surface under a sole: the first face met going down from the knee (a front face) */
  function under(p, up) { const o = p.clone(); o.y += up; const h = first(o, new V3(0, -1, 0), up + 0.6 * H0); return h && !h.back ? { y: o.y - h.distance, mesh: h.mesh } : null; }

  /* ── the camera's view: in frame, and not behind a set part nearer the lens ── */
  function view(p, skip) {
    const q = p.clone().project(camera), cp = camera.position, inFrame = q.z < 1 && q.z > -1 && Math.abs(q.x) <= 0.98 && Math.abs(q.y) <= 0.98;
    let hidden = false; if (inFrame) { const d = p.clone().sub(cp), L = d.length(); d.normalize(); const sk = new Set(W.moved); if (skip) sk.add(skip);
      const a = gridRay(W.G, cp, d, L * 0.97, sk)[0], b = W.D ? gridRay(W.D, cp, d, L * 0.97, skip ? new Set([skip]) : null)[0] : null; hidden = !!(a || b); }
    return { inFrame, hidden, uv: [+((q.x + 1) / 2).toFixed(3), +((1 - q.y) / 2).toFixed(3)] };
  }
  /* the contacts the score allows at t: [a, b] pairs (both ways), by intent kind */
  const CONTACT = new Set(opt.contactKinds);
  function allowed(t) { const S = new Set(); for (const it of opt.intents || []) { if (!CONTACT.has(it.kind) || t < it.t0 - 0.5 || t > it.t1 + 0.75) continue;
      const tg = typeof it.target === 'string' ? [it.target] : []; for (const w of [...tg, ...((it.params && [].concat(it.params.with || [])) || [])]) if (typeof w === 'string') { S.add(it.actor + '|' + w); S.add(w + '|' + it.actor); } }
    /* riders: a man in a fist, under a ram */
    if (C && C.creatures && Cr) for (const id of Object.keys(C.creatures)) { try { const s = Cr.sample(C, id, t); for (const r of s.riders || []) { S.add(r.actor + '|' + id); S.add(id + '|' + r.actor); } } catch (e) {} }
    return S; }
  const busy = (id, t, kinds) => (opt.intents || []).some(it => it.actor === id && kinds.has(it.kind) && t >= it.t0 - 0.5 && t <= it.t1 + 0.75);
  const WET = new Set(opt.wetKinds), last = new Map();

  /* ── one drawing ── */
  function sample(t) {
    const sh = OdysseyTake.apply(t); scene.updateMatrixWorld(true); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const key = T.keyOf ? { id: T.keyOf(t).id } : { id: 'k' }; world(key);
    const shades = T.shades || new Map(), ok = allowed(t), out = [], bodies = {};
    for (const id of api.cast()) { const P = partsOf(id); if (P && Object.keys(P).length) bodies[id] = { P, H: Hof(id), shade: shades.has(id), creature: false }; }
    for (const id of Object.keys(rigs)) { const P = creatureParts(id); if (P && Object.keys(P).length) bodies[id] = { P, H: H0, shade: false, creature: true }; }
    const ids = Object.keys(bodies);
    const rec = (o) => { out.push(o); };
    /* (a) body against body */
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const A = bodies[ids[i]], B = bodies[ids[j]]; if (A.creature && B.creature) continue;
      const Hm = Math.min(A.H, B.H), contact = ok.has(ids[i] + '|' + ids[j]), rough = A.c || null;
      for (const [pa, oa] of Object.entries(A.P)) for (const [pb, ob] of Object.entries(B.P)) {
        let cls, lim;
        if (A.creature || B.creature) { const fa = A.creature ? pa : pb, fb = A.creature ? pb : pa; if (!CORE.has(fb)) continue; cls = 'creature'; lim = tol.creature; }
        else { const ca = CORE.has(pa), cb = CORE.has(pb); if (ca && cb) { cls = pa === 'headP' && pb === 'headP' ? 'head-head' : 'core'; lim = pa === 'headP' && pb === 'headP' ? tol.headHead : tol.core; }
          else if (ca || cb) { cls = 'limb'; lim = tol.limb; } else if (/leg/.test(pa) && /leg/.test(pb)) { cls = 'legs'; lim = tol.legs; } else continue; }
        if (contact) { if (cls === 'limb' || cls === 'legs' || cls === 'creature') continue; lim = cls === 'head-head' ? tol.headHeadContact : tol.coreContact; }
        const d = obbDepth(oa, ob); if (d <= lim * Hm) continue;
        const pt = oa.c.clone().lerp(ob.c, 0.5), v = view(pt);
        rec({ kind: 'body', who: [ids[i], ids[j]], parts: [A.creature ? pa : NAME[pa], B.creature ? pb : NAME[pb]], cls, depth: d / Hm, contact, shade: A.shade || B.shade, v, box: [ids[i], pa] });
      }
    }
    /* (b) the body in the set; (d) a walk through it; (c) the body under the sea's surface */
    for (const id of ids) { const A = bodies[id]; if (A.creature) continue; const H = A.H, P = A.P;
      const feet = (api.kfActor(id).rig.pos || new V3()).clone(), prev = last.get(id); last.set(id, { feet, t });
      const walking = prev && t - prev.t < 0.3 && Math.hypot(feet.x - prev.feet.x, feet.z - prev.feet.z) / Math.max(1e-3, t - prev.t) > 0.25 * H;
      const pts = []; for (const k of ['headP', 'torsoP', 'hipsP']) if (P[k]) pts.push([k, P[k].c.clone()]);
      for (const k of ['legRP', 'legLP']) if (P[k]) { const B = P[k], cs = corners(B).sort((a, b) => a.y - b.y), sole = cs.slice(0, 4).reduce((s, p) => s.add(p), new V3()).multiplyScalar(0.25);
        pts.push([k, B.c.clone(), 'leg']); pts.push([k, sole, 'sole']); }
      for (const [k, p, what] of pts) {
        if (what === 'sole') { const u = under(p, 0.28 * H); if (u && u.y - p.y > tol.sink * H && u.y - p.y < 0.24 * H) { const v = view(p, u.mesh); rec({ kind: 'set', who: [id], parts: [NAME[k] + ' (foot)'], cls: 'sink', against: label(u.mesh), depth: (u.y - p.y) / H, walking, shade: A.shade, v, box: [id, k] }); } continue; }
        const r = inside(p); if (!r) continue; const lim = what === 'leg' ? tol.legSet : tol.set; if (r.depth <= lim * H) continue;
        const v = view(p, r.mesh); rec({ kind: 'set', who: [id], parts: [NAME[k]], cls: walking ? 'walk' : what === 'leg' ? 'leg' : 'body', against: label(r.mesh), depth: r.depth / H, walking, shade: A.shade, v, box: [id, k] });
      }
      if (T.sea && T.sea.surface && P.hipsP && !busy(id, t, WET)) { const c = P.torsoP ? P.torsoP.c : P.hipsP.c, s = T.sea.surface(c.x, c.z, t), d = s - P.hipsP.c.y;
        if (d > tol.water * H) { const v = view(P.hipsP.c); rec({ kind: 'water', who: [id], parts: ['hips'], cls: 'water', against: 'the sea', depth: d / H, shade: A.shade, v, box: [id, 'hipsP'] }); } }
    }
    return { t, shot: sh && sh.id, kind: sh && sh.kind, out, n: ids.length };
  }
  /* the offending part's box on the frame (after OdysseyTake.frame(t) has posed it and placed the camera) */
  function outline(id, part) {
    const b = rigs[id] ? creatureParts(id) : partsOf(id); const B = b && b[part]; if (!B) return null;
    camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    return corners(B).map(p => { const q = p.clone().project(camera); return [(q.x + 1) / 2, (1 - q.y) / 2, q.z]; });
  }
  return { sample, outline, H0 };
}
root.MetisClip = { make, buildGrid, gridRay, obbDepth };
})(typeof window !== 'undefined' ? window : globalThis);
