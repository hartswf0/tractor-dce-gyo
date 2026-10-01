/* tools/cinematographer/solve.js — the plan's shots solved in the player, against the real set, the cast at each drawing and the
   creature rigs (window.OdysseyCine; read by film-readymades/odyssey-take.js when the take has a plan: tools/cinematographer/plan.js).

   For every shot of the plan (odyssey-shots/1) the cast is posed at the shot's start, middle, end and at any contact inside it. The
   subjects' points are read from the rigs (a figure's crown, head, hips, hands and feet; a creature's box and its rig anchors: head,
   eye, grips, lap, via OdysseyCreatures.sample and rig.point) and candidate cameras are laid round them: sixteen bearings, the
   plan's angle (eye level, low for a giant, high), a distance fitted to the size and the lens. Each candidate is aimed (the face on
   the upper third, the subject on the thirds line away from whom it looks at) and must pass, at every sample:
     L1 inside     the lens and its near plane (a small sphere round it) are in no set part, no figure and no creature: a part's
                   box, and for a large part (a cave wall, a floor) rays from the lens that meet the part's back faces or its surface
                   within the near sphere; the ground is below the lens
     L2 occlusion  the subject's head (a creature's head and eye) and at least half its body points are seen: no nearer body, prop
                   or part on the ray; a contact's point (the meeting hands, the eye the stake goes into) is seen
     L3 head       every subject's head and crown are inside the frame with a margin; the primary's face is in the upper half
     L4 frame      what the size needs is in the frame (the whole of every subject for a wide or a contact, the head and chest for
                   a close); nothing nearer than a third of the way covers more than a fifth of the frame
     L5 line       the camera is on the side of its line (plan: the two principals of the beat) that the line's first shot took
     L1c creature  the lens stays out of a creature's bounding sphere by a margin scaled by its rig's scale (the shot's own creature,
                   and a rider's carrier: off its head by a third of its height); a rider is framed with its carrier's silhouette
     exposure      the chosen camera is rendered once, small, at the shot's middle: a frame nearly black or washed out (mean luma
                   under 0.10 or over 0.84, 70% near-black or 45% near-white: a firelit cave is dark and stays legal) or flat (luma deviation under 0.075: one surface
                   against the lens) or more than 80% one colour (twelve hues, four greys), at the shot's first, middle and last
                   drawings, is refused for the next best (up to twelve)
   Among the legal candidates the score prefers: the face turned to the lens, the profile for a handoff, the low angle for a giant,
   a change of at least 30 degrees from the shot before on the same figure, the key's own camera for a wide. A shot with no legal
   candidate keeps its least bad one and the report says which checks it failed.

   The camera then holds its position (or travels with a figure that crosses the set) and pans with the subjects, keyed every half
   second; the direction's move (push, pull) is laid over it. Everything is a pure function of t once solved. */
(function (root) {
'use strict';
const cl01 = v => Math.max(0, Math.min(1, v)), sm = x => { x = cl01(x); return x * x * (3 - 2 * x); }, lerp = (a, b, u) => a + (b - a) * u;
const SIZE_FILL = { WIDE: 2.4, MID: 1.25, CLOSE: 0.62 };   /* the frame's height over what must fill it */

async function solve(plan, api) {
  const { THREE, scene, camera, T } = api, V3 = THREE.Vector3;
  const t0w = performance.now();
  const C = T.choreo && T.choreo.C, CR = window.OdysseyCreatures, creatures = (T.creatures && T.creatures.rigs) || {};
  const H0 = Object.values(T.H || {}).sort((a, b) => a - b)[0] || 60, Hof = id => (T.H && T.H[id]) || H0;
  const aspect = camera.aspect || 16 / 9, saved = { pos: camera.position.clone(), q: camera.quaternion.clone(), fov: camera.fov };
  const isCreature = id => !!creatures[id], isActor = id => !!api.kfActor(id) && !isCreature(id);
  const crGroup = id => T.creatures && T.creatures.group.getObjectByName('creature:' + id);

  /* ── the world at a drawing: meshes (the set, the figures, the creatures) ── */
  let W = null; const TIME = { grid: 0, inside: 0, seen: 0, clutter: 0, pose: 0 };
  function world(key) {
    const figs = new Map(), cr = new Map(); for (const a of api.cast()) { const r = api.rigOf(a); if (!r) continue; r.figure.traverse(o => figs.set(o, a)); }
    for (const id of Object.keys(creatures)) { const g = crGroup(id); if (g) g.traverse(o => cr.set(o, id)); }
    if (!W || W.key !== key.id) {
      const stat = []; scene.traverse(o => { if (api.kfSolid(o) && !figs.has(o) && !cr.has(o)) stat.push(o); });
      const boxes = stat.map(m => { const b = new THREE.Box3().setFromObject(m); const s = b.getSize(new V3()); return { m, b, big: Math.max(s.x, s.y, s.z) > 1.6 * H0 }; }).filter(x => !x.b.isEmpty());
      /* the staged props whole (a stack of pigs, a pen, a heap): a lens inside one's box is inside the prop, gaps and all */
      const propBoxes = []; scene.traverse(o => { if (o.name && o.name.startsWith('prop:') && o.visible !== false && !(o.userData && o.userData.held)) { const b = new THREE.Box3().setFromObject(o); if (!b.isEmpty()) { const sz = b.getSize(new V3()); if (Math.max(sz.x, sz.y, sz.z) < 12 * H0) propBoxes.push({ id: o.name.slice(5), b }); } } });
      const tg = performance.now(); W = { key: key.id, stat, boxes, propBoxes, G: buildGrid(stat) }; TIME.grid += performance.now() - tg;
    }
    const dyn = []; scene.traverse(o => { if (api.kfSolid(o) && (figs.has(o) || cr.has(o))) dyn.push(o); });
    W.figs = figs; W.cr = cr; W.dyn = dyn;
    /* each creature's bounding sphere at this drawing and its rig's scale (the near limit below) */
    W.crS = Object.keys(creatures).map(id => { const g = crGroup(id); if (!g || g.visible === false) return null; const b = new THREE.Box3().setFromObject(g); if (b.isEmpty()) return null; const sz = b.getSize(new V3()); return { id, box: b, c: b.getCenter(new V3()), r: 0.5 * sz.length(), H: Math.max(sz.y, 0.6 * sz.x, 0.6 * sz.z), sc: (C && C.creatures && C.creatures[id] && C.creatures[id].scale) || 1 }; }).filter(Boolean); W.dynBoxes = dyn.map(m => ({ m, b: new THREE.Box3().setFromObject(m) })).filter(x => !x.b.isEmpty()); W.all = W.stat.concat(dyn); return W;
  }
  /* ── a uniform grid over the set's triangles (world space), built once per key's world: rays through the set cost the cells they
     cross, not every triangle of every part (the player has no BVH) ── */
  function buildGrid(meshes) {
    const per = meshes.map(m => { const g = m.geometry, pos = g && g.attributes && g.attributes.position; if (!pos) return 0; return ((g.index ? g.index.count : pos.count) / 3) | 0; });
    const n = per.reduce((a, b) => a + b, 0), Tr = new Float32Array(n * 9), Mi = new Int32Array(n), v = new V3(); let k = 0;
    meshes.forEach((m, mi) => { const g = m.geometry, pos = g && g.attributes && g.attributes.position; if (!pos) return; const idx = g.index, mw = m.matrixWorld;
      for (let t = 0; t < per[mi]; t++) { for (let c = 0; c < 3; c++) { const i = idx ? idx.getX(t * 3 + c) : t * 3 + c; v.fromBufferAttribute(pos, i).applyMatrix4(mw); Tr[k * 9 + c * 3] = v.x; Tr[k * 9 + c * 3 + 1] = v.y; Tr[k * 9 + c * 3 + 2] = v.z; } Mi[k] = mi; k++; } });
    let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < n * 3; i++) for (let a = 0; a < 3; a++) { const x = Tr[i * 3 + a]; if (x < lo[a]) lo[a] = x; if (x > hi[a]) hi[a] = x; }
    lo = lo.map(x => x - 1); hi = hi.map(x => x + 1); const ext = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]), cs = Math.max(0.4 * H0, ext / 96);
    const N = [0, 1, 2].map(a => Math.max(1, Math.min(160, Math.ceil((hi[a] - lo[a]) / cs))));
    const cell = (a, x) => Math.max(0, Math.min(N[a] - 1, Math.floor((x - lo[a]) / cs)));
    const count = new Int32Array(N[0] * N[1] * N[2] + 1), rng = new Int32Array(n * 6);
    for (let t = 0; t < n; t++) { for (let a = 0; a < 3; a++) { const x0 = Math.min(Tr[t * 9 + a], Tr[t * 9 + 3 + a], Tr[t * 9 + 6 + a]), x1 = Math.max(Tr[t * 9 + a], Tr[t * 9 + 3 + a], Tr[t * 9 + 6 + a]); rng[t * 6 + a] = cell(a, x0); rng[t * 6 + 3 + a] = cell(a, x1); }
      for (let x = rng[t * 6]; x <= rng[t * 6 + 3]; x++) for (let y = rng[t * 6 + 1]; y <= rng[t * 6 + 4]; y++) for (let z = rng[t * 6 + 2]; z <= rng[t * 6 + 5]; z++) count[(x * N[1] + y) * N[2] + z + 1]++; }
    for (let i = 1; i < count.length; i++) count[i] += count[i - 1];
    const fill = count.slice(), items = new Int32Array(count[count.length - 1]);
    for (let t = 0; t < n; t++) for (let x = rng[t * 6]; x <= rng[t * 6 + 3]; x++) for (let y = rng[t * 6 + 1]; y <= rng[t * 6 + 4]; y++) for (let z = rng[t * 6 + 2]; z <= rng[t * 6 + 5]; z++) items[fill[(x * N[1] + y) * N[2] + z]++] = t;
    return { Tr, Mi, meshes, lo, cs, N, start: count, items, stamp: new Int32Array(n), q: 0, n };
  }
  /* the hits of a ray (o, unit d) on the grid's triangles up to far, nearest first; first: stop at the first */
  function gridRay(G, o, d, far, first) {
    const out = []; if (!G || !G.n) return out; G.q++; const { Tr, lo, cs, N } = G;
    /* clip the ray to the grid's box */
    let t0 = 0, t1 = far; for (let a = 0; a < 3; a++) { const oa = [o.x, o.y, o.z][a], da = [d.x, d.y, d.z][a], b0 = lo[a], b1 = lo[a] + N[a] * cs;
      if (Math.abs(da) < 1e-12) { if (oa < b0 || oa > b1) return out; continue; } let ta = (b0 - oa) / da, tb = (b1 - oa) / da; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return out; }
    const O = [o.x, o.y, o.z], D = [d.x, d.y, d.z], P = O.map((x, a) => x + D[a] * (t0 + 1e-6)), c = P.map((x, a) => Math.max(0, Math.min(N[a] - 1, Math.floor((x - lo[a]) / cs))));
    const step = D.map(x => x > 0 ? 1 : x < 0 ? -1 : 0), tMax = D.map((x, a) => x > 0 ? (lo[a] + (c[a] + 1) * cs - O[a]) / x : x < 0 ? (lo[a] + c[a] * cs - O[a]) / x : Infinity), tDel = D.map(x => x ? cs / Math.abs(x) : Infinity);
    let tc = t0;
    for (let guard = 0; guard < 2000; guard++) {
      const ci = (c[0] * N[1] + c[1]) * N[2] + c[2], tExit = Math.min(tMax[0], tMax[1], tMax[2]);
      for (let j = G.start[ci]; j < G.start[ci + 1]; j++) { const t = G.items[j]; if (G.stamp[t] === G.q) continue; G.stamp[t] = G.q;
        const b = t * 9, e1x = Tr[b + 3] - Tr[b], e1y = Tr[b + 4] - Tr[b + 1], e1z = Tr[b + 5] - Tr[b + 2], e2x = Tr[b + 6] - Tr[b], e2y = Tr[b + 7] - Tr[b + 1], e2z = Tr[b + 8] - Tr[b + 2];
        const px = D[1] * e2z - D[2] * e2y, py = D[2] * e2x - D[0] * e2z, pz = D[0] * e2y - D[1] * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-9) continue;
        const inv = 1 / det, sx = O[0] - Tr[b], sy = O[1] - Tr[b + 1], sz = O[2] - Tr[b + 2], u = (sx * px + sy * py + sz * pz) * inv; if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, w = (D[0] * qx + D[1] * qy + D[2] * qz) * inv; if (w < 0 || u + w > 1) continue;
        const dist = (e2x * qx + e2y * qy + e2z * qz) * inv; if (dist < 1e-4 || dist > far) continue;
        /* the face's normal (by its winding) against the ray: a back face when they agree */
        const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        out.push({ distance: dist, object: G.meshes[G.Mi[t]], back: nx * D[0] + ny * D[1] + nz * D[2] > 0, point: new V3(O[0] + D[0] * dist, O[1] + D[1] * dist, O[2] + D[2] * dist) }); }
      if (first && out.length) { let m = Infinity; for (const h of out) m = Math.min(m, h.distance); if (m <= tExit) break; }
      if (tExit > t1) break; const a = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : (tMax[1] < tMax[2] ? 1 : 2); c[a] += step[a]; if (c[a] < 0 || c[a] >= N[a]) break; tc = tMax[a]; tMax[a] += tDel[a];
    }
    out.sort((a, b) => a.distance - b.distance); return first ? out.slice(0, 1) : out;
  }
  const owner = o => { for (; o; o = o.parent) { if (W.figs.has(o)) return W.figs.get(o); if (W.cr.has(o)) return W.cr.get(o); } return null; };
  const ray = new THREE.Raycaster();
  function hitsAlong(from, to, firstStatic) { const d = to.clone().sub(from), L = d.length(); d.normalize(); ray.set(from, d); ray.far = L; ray.near = 0;
    const hs = gridRay(W.G, from, d, L, firstStatic).concat(ray.intersectObjects(W.dyn, false)); hs.sort((a, b) => a.distance - b.distance); return hs; }

  /* ── a subject's points at the current drawing ── */
  function points(id, t) {
    if (isCreature(id)) {
      const g = crGroup(id); const box = g ? new THREE.Box3().setFromObject(g) : null; const s = C ? CR.sample(C, id, t) : null, rig = creatures[id];
      const P = n => { const p = s && rig.point(n, s.v); return p ? new V3(p[0], p[1], p[2]) : null; };
      const head = P('head') || (box ? box.getCenter(new V3()) : new V3()), eye = P('eye') || head, crown = P('brow') || head;
      const corners = []; if (box && !box.isEmpty()) for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new V3(x, y, z));
      const upper = [head, eye, crown, P('grip.R'), P('grip.L'), P('lap')].filter(Boolean);
      const Hc = box ? Math.max(box.max.y - box.min.y, 0.6 * (box.max.x - box.min.x), 0.6 * (box.max.z - box.min.z)) : 3 * H0;
      const lying = !!box && (box.max.y - box.min.y) < 0.7 * Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
      return { id, creature: true, lying, head, eye, crown, chin: P('mouth') || head, body: upper, whole: corners.length ? corners : upper, upper, H: Hc, feet: box ? new V3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2) : head, facing: null, box };
    }
    const a = api.kfActor(id); if (!a || a.rig.figure.visible === false || a.rig.absent) return null; const r = a.rig, H = Hof(id);
    const head = api.kfHead(id), crown = head.clone().add(new V3(0, 0.2 * H, 0)), chin = head.clone().add(new V3(0, -0.14 * H, 0));
    const hips = r.hipsP.getWorldPosition(new V3()), torso = r.torsoP.getWorldPosition(new V3()), feet = r.pos.clone();
    const hR = api.kfHand(id, 'R'), hL = api.kfHand(id, 'L');
    const carrier = (W.crS || []).find(k => k.box.clone().expandByScalar(0.1 * H).containsPoint(hips) && hips.y < k.c.y + 0.2 * k.H);   /* a rider under a ram, in a giant's grip */
    return { id, carrier: carrier || null, head, eye: head, crown, chin, hips, torso, feet, hands: [hR, hL].filter(Boolean), body: [head, torso.clone().lerp(head, 0.3), torso, hips], whole: [crown, feet, hR, hL].filter(Boolean), upper: [crown, chin, torso, hR, hL].filter(Boolean), H, heading: r.heading, facing: (() => { /* the way the body faces as posed (the torso's own forward), not the rig's stored heading */
      const f = new V3(0, 0, 1).applyQuaternion(r.torsoP.getWorldQuaternion(new THREE.Quaternion())).setY(0); return f.lengthSq() > 0.04 ? f.normalize() : new V3(Math.sin(r.heading), 0, Math.cos(r.heading)); })() };
  }

  /* ── the camera: aimed at pts with the primary's head at (u, v) where the frame allows ── */
  const proj = p => { const q = p.clone().project(camera); return [(q.x + 1) / 2, (1 - q.y) / 2, q.z]; };
  function place(pos, fov, look) { camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(look); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); }
  function aim(pos, fov, need, head, u, v) {
    const c = new V3(); for (const p of need) c.add(p); c.multiplyScalar(1 / need.length); place(pos, fov, c);
    const fits = () => need.every(p => { const q = proj(p); return q[2] < 1 && q[0] > 0.02 && q[0] < 0.98 && q[1] > 0.02 && q[1] < 0.98; });
    const q0 = camera.quaternion.clone();
    if (head) { for (let i = 0; i < 6; i++) { const q = proj(head); const du = q[0] - u, dv = q[1] - v; if (Math.abs(du) < 0.004 && Math.abs(dv) < 0.004) break;
        camera.rotateX(-dv * THREE.MathUtils.degToRad(fov) * 0.9); camera.rotateY(-du * 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * aspect) * 0.9); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); }
      /* keep the horizon level after the turns */
      const d = camera.getWorldDirection(new V3()); camera.up.set(0, 1, 0); camera.lookAt(pos.clone().add(d)); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      if (!fits()) { camera.quaternion.copy(q0); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); } }
    const d = camera.getWorldDirection(new V3()); return pos.clone().add(d.multiplyScalar(pos.distanceTo(c)));
  }

  /* ── legality ── */
  const near = () => Math.max(1.5, camera.near * 2, 0.04 * H0);
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0, 0.7, 0.7], [0, 0.7, -0.7], [0.7, -0.7, 0], [-0.7, -0.7, 0], [0, -0.7, 0.7], [0, -0.7, -0.7]].map(d => new V3(...d).normalize());
  const AX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(d => new V3(...d));
  function inside(p) {
    const t0 = performance.now(), r = near(), why = [];
    for (const { m, b, big } of W.boxes) { if (big || !b.clone().expandByScalar(r).containsPoint(p)) continue; why.push('in part ' + (m.name || m.parent && m.parent.name || m.id)); break; }
    if (!why.length) { let back = 0, n = 0, touch = null;
      for (const d of AX) { const h = gridRay(W.G, p, d, 6 * H0, true)[0]; if (!h) continue; n++; if (h.distance < r) { touch = h; break; } if (h.back) back++; }
      if (touch) why.push('near plane in ' + (touch.object.name || 'a set part')); else if (n >= 4 && back / n > 0.6) why.push('inside a set part'); }
    if (!why.length) for (const { id, b } of W.propBoxes || []) { if (b.clone().expandByScalar(0.15 * H0).containsPoint(p)) { why.push('inside the staged prop ' + id); break; } }
    if (!why.length) for (const { m, b } of W.dynBoxes) { if (b.clone().expandByScalar(r * 0.5).containsPoint(p)) { why.push('in ' + (owner(m) || 'a body')); break; } }
    /* beneath the floor: nothing under the lens and the lens lower than the floor (a camera outside the set, above it, is fine) */
    if (!why.length) { if (W.floorY == null) { const g = W.G; W.floorY = groundAt(new V3(g.lo[0] + g.N[0] * g.cs / 2, g.lo[1] + g.N[1] * g.cs, g.lo[2] + g.N[2] * g.cs / 2)); }
      if (!gridRay(W.G, p, new V3(0, -1, 0), 1e5, true).length && p.y < W.floorY + 0.3 * H0) why.push('under the set'); }
    TIME.inside += performance.now() - t0; return why;
  }
  /* L1c a creature's near limit: the lens stays outside its bounding sphere by a margin scaled by the rig's scale (a bystander beast:
     the whole sphere; the shot's own creature: off its head by a third of its height and outside the inner part of its sphere, so a
     giant's close still has room); a rider's carrier counts as the shot's own */
  function nearCreature(p, S, size) {
    const own = new Set(S.filter(s => s.creature).map(s => s.id)); for (const s of S) if (s.carrier) own.add(s.carrier.id);
    for (const k of W.crS || []) { const m = 0.25 * H0 * k.sc, d = p.distanceTo(k.c);
      if (!own.has(k.id)) { if (d < k.r + m) return 'near ' + k.id + ' (inside its sphere)'; continue; }
      const P = pointsCache.get(k.id), hd = P && P.head ? p.distanceTo(P.head) : Infinity;
      if (hd < 0.22 * k.H + m) return 'near ' + k.id + ' (too close to the beast\'s head)';
      if (size === 'WIDE' && k.r < 3 * H0 && d < 1.2 * k.r + m) return 'near ' + k.id + ' (a wide inside its sphere: the fleece fills the frame)'; }
    return null; }
  /* the exposure of a frame: the chosen camera rendered once at a drawing, small; the mean luma (sRGB) and the shares of near-black
     and near-white pixels. A frame nearly black (a lens in shadow, a far dusk wide) or washed out (fleece filling the frame) is refused. */
  let lumCv = null;
  function luma() {
    const R = api.renderer; if (!R || typeof document === 'undefined') return null;
    try { const T = api.T || {}; if (T.env) { scene.background = T.env.bg; scene.fog = T.env.fog; R.toneMapping = T.env.tone; R.toneMappingExposure = T.env.exp; }
      /* rendered as the take renders a frame (its own render pass when it has one), then drawn small onto a 2D canvas */
      /* while the take prepares an export its renderer's render is stubbed out: the prototype's own render draws regardless */
      const draw = T.render || R.__draw || R.render.bind(R);
      draw(scene, camera); R.getContext().finish();
      if (!lumCv) { lumCv = document.createElement('canvas'); lumCv.width = 64; lumCv.height = 36; }
      const g = lumCv.getContext('2d', { willReadFrequently: true }); g.drawImage(R.domElement, 0, 0, 64, 36);
      const d = g.getImageData(0, 0, 64, 27).data;   /* the caption's lower quarter left out */
      let sum = 0, sq = 0, dark = 0, white = 0, n = 0; const bins = new Map();
      for (let i = 0; i < d.length; i += 4) { const r = d[i] / 255, g2 = d[i + 1] / 255, b = d[i + 2] / 255, y = 0.2126 * r + 0.7152 * g2 + 0.0722 * b; sum += y; sq += y * y; n++; if (y < 0.1) dark++; if (y > 0.9) white++;
        /* one colour: twelve hues for a saturated pixel, four greys by lightness for the rest (shading keeps a surface in its bin) */
        const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), sat = mx > 0 ? (mx - mn) / mx : 0; let key;
        if (sat < 0.18 || mx < 0.12) key = 'g' + Math.min(3, Math.floor(y * 4)); else { let h = mx === r ? (g2 - b) / (mx - mn) : mx === g2 ? 2 + (b - r) / (mx - mn) : 4 + (r - g2) / (mx - mn); h = ((h * 60) + 360) % 360; key = 'h' + Math.floor(h / 30); }
        bins.set(key, (bins.get(key) || 0) + 1); }
      let top = 0; for (const v of bins.values()) top = Math.max(top, v);
      if (sum === 0) { if (!lumErr) { lumErr = 'nothing drawn (' + (T.render ? 'take render' : 'prototype render') + ', canvas ' + R.domElement.width + 'x' + R.domElement.height + ')'; console.log('[take] cinematographer exposure: ' + lumErr); } return null; }   /* nothing was drawn (a stubbed renderer): unknown, not black */
      const mean = sum / n; return { mean: +mean.toFixed(3), sd: +Math.sqrt(Math.max(0, sq / n - mean * mean)).toFixed(3), dark: +(dark / n).toFixed(2), white: +(white / n).toFixed(2), one: +(top / n).toFixed(2) };
    } catch (e) { if (!lumErr) { lumErr = String(e && e.message || e).slice(0, 200); console.log('[take] cinematographer exposure: ' + lumErr); } return null; } }
  let lumErr = null;
  const LUMA = { lo: 0.1, hi: 0.84, dark: 0.7, white: 0.45, sd: 0.075, one: 0.8 };   /* one: more than 80% of the frame one colour (a pig's flank, an empty sky) */   /* sd: a frame of one flat surface (a pig's flank against the lens) */
  const lumaBad = L => !!L && (L.mean < LUMA.lo || L.mean > LUMA.hi || L.dark > LUMA.dark || L.white > LUMA.white || (L.sd != null && L.sd < LUMA.sd) || (L.one != null && L.one > LUMA.one));
  /* the exposure over the shot: its first, middle and last drawings; the worst one is the shot's */
  function lumaSpan(c, sh, subj, t0, t1) { let worst = null; for (const t of [Math.min(t1 - 0.05, t0 + 0.2), (t0 + t1) / 2, Math.max(t0 + 0.05, t1 - 0.2)]) { const L = lumaAt(c, sh, subj, t); if (!L) continue; if (lumaBad(L)) return L; if (!worst || Math.abs(L.mean - 0.5) > Math.abs(worst.mean - 0.5)) worst = L; } return worst; }
  function lumaAt(c, sh, subj, t) { const key = api.poseAt(t); world(key); pointsCache.clear(); for (const id of subj) { const p = points(id, t); if (p) pointsCache.set(id, p); }
    const St = subj.map(id => pointsCache.get(id)).filter(Boolean); if (!St.length) return null; const Pt = St.find(x => x.id === sh.primary) || St[0];
    aim(c.pos, c.fov, needOf(St, sh, Pt), sh.size === 'WIDE' && !sh.giant ? null : sh.kind === 'INSERT' ? Pt.eye : Pt.head, c.u, c.v); return luma(); }
  /* is p seen from the camera, allowing hits on the subject's own meshes (and on any of `allow` within `slack` of p)? */
  function seen(p, own, allow, slack) { const t0 = performance.now(); try { return seen_(p, own, allow, slack); } finally { TIME.seen += performance.now() - t0; } }
  function seen_(p, own, allow, slack) { const hs = hitsAlong(camera.position, p); for (const h of hs) { const o = owner(h.object); if (o && own && o === own) continue; if (allow && o && allow.includes(o) && h.distance > camera.position.distanceTo(p) - slack) continue; if (h.distance > camera.position.distanceTo(p) - 0.8) continue; return { by: o || (h.object.name || 'a set part'), at: h.distance }; } return null; }
  function clutter(d, allow, far, subjIds) { const t0 = performance.now(); let hit = 0, n = 0; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { ray.setFromCamera(new THREE.Vector2(-0.8 + i * 0.4, -0.6 + j * 0.6), camera); ray.near = 0; ray.far = d * 0.45; n++; if (gridRay(W.G, ray.ray.origin, ray.ray.direction, ray.far, true).length) { hit++; continue; } ray.far = d * 0.8; if (ray.intersectObjects(W.dyn, false).some(h => { const o = owner(h.object); if (allow && allow.includes(o)) return false; if (subjIds && subjIds.includes(o)) return false; /* a beast that is not the shot's own, anywhere before the subject; a man within the near part */ return (o && creatures[o]) ? true : h.distance < d * (far || 0.45); })) hit++; } TIME.clutter += performance.now() - t0; return hit / n; }

  /* the far clutter (graded, for the score): a finer grid of rays out to 0.8 of the way to the primary, counting the set's parts (a rock,
     a wall's edge, a column) that stand between the lens and what it films; a near part counts more than one close to the subjects.
     The hard L4 check above sees only the near half; this keeps a high wide from looking through a scree of foreground rocks. */
  function clutterFar(d, floorY) { const t0 = performance.now(); let w = 0, n = 0; for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) { ray.setFromCamera(new THREE.Vector2(-0.9 + i * 0.3, -0.8 + j * 0.4), camera); n++;
      /* the floor the figures stand on is not clutter: only what stands up out of it (above the primary's feet by a third of a height) */
      const hs = gridRay(W.G, ray.ray.origin, ray.ray.direction, d * 0.8, false).filter(h => h.point.y > floorY + 0.35 * H0); if (hs.length) { const h = hs.reduce((a, b) => (a.distance < b.distance ? a : b)); w += 1 - 0.6 * Math.min(1, (h.distance || 0) / (d * 0.8)); } } TIME.clutter += performance.now() - t0; return w / n; }

  /* one candidate at the current drawing: fail fast (the cheap checks first); hard for the primary, the line's partner and a contact's
     figures, soft (a penalty) for the others of a group */
  function check(cand, S, sh, lineSide) {
    const fail = [], info = { soft: 0 };
    if (lineSide && cand.side && cand.side !== lineSide) return { fail: ['L5 across the line'], info };
    const pos = cand.pos;
    const prim = S.find(s => s.id === sh.primary) || S[0];
    const need = needOf(S, sh, prim);
    const target = aim(pos, cand.fov, need, sh.size === 'WIDE' && !sh.giant ? null : sh.kind === 'INSERT' ? prim.eye : prim.head, cand.u, cand.v);
    info.target = target;
    const hard = new Set([prim.id, ...(sh.kind === 'TWO' && sh.line ? sh.line : [])]);
    const bad = (s, why) => { if (hard.has(s.id)) { fail.push(why); return true; } info.soft++; return false; };
    for (const s of S) {
      const q = proj(s.head), c = proj(s.crown); if (q[2] > 1 || c[2] > 1) { if (bad(s, 'L3 ' + s.id + ' behind the lens')) return { fail, info }; continue; }
      const m = 0.03; if (!(q[0] > m && q[0] < 1 - m && q[1] > m && q[1] < 1 - m && c[1] > 0.005 && c[0] > 0 && c[0] < 1)) if (bad(s, 'L3 head of ' + s.id + ' cut')) return { fail, info };
      /* the caption box (the lower quarter while a line sounds) is no place for a face */
      if (q[1] > 0.7) if (bad(s, 'L3 head of ' + s.id + ' under the caption')) return { fail, info };
    }
    const hq = proj(sh.kind === 'INSERT' ? prim.eye : prim.head); info.headV = +hq[1].toFixed(3);
    /* the face in the upper half; in a wide (the figures small in the set) above the caption */
    if (!(prim.creature && sh.size === 'WIDE') && !(hq[1] <= (sh.size === 'WIDE' ? 0.68 : 0.5))) return { fail: ['L3 face of ' + prim.id + (sh.size === 'WIDE' ? ' under the caption' : ' below the middle')], info };
    for (const p of need) { const q = proj(p); if (!(q[2] < 1 && q[0] > -0.01 && q[0] < 1.01 && q[1] > -0.01 && q[1] < 1.01)) { info.soft += 2; if (sh.size !== 'WIDE') return { fail: ['L4 the ' + (sh.size || '').toLowerCase() + ' needs more than the frame'], info }; break; } }
    const ins = inside(pos); if (ins.length) return { fail: ['L1 ' + ins[0]], info };
    { const nc = nearCreature(pos, S, sh.size); if (nc) return { fail: ['L1 ' + nc], info }; }
    /* a lens nearer a face than most of a body's height is inside the head's print, not a close-up */
    for (const s of S) { if (s.creature) continue; const lim = (sh.size === 'CLOSE' || sh.kind === 'INSERT' ? 1.1 : 0.7) * (s.H || H0);
      /* the figure's own surface on the way to its head counts (a posed body can bring the face well in front of the head's mark) */
      const first = hitsAlong(pos, s.head).find(h => owner(h.object) === s.id), dn = Math.min(pos.distanceTo(s.head), first ? first.distance + 0.15 * (s.H || H0) : Infinity);
      if (dn < lim) { if (bad(s, 'L1 too near the face of ' + s.id)) return { fail, info }; } }
    for (const s of S) {
      /* the face, not only its centre: a creature's eye, head, brow and mouth (three of four seen), a figure's head and the front of its face */
      const facePts = s.creature ? [s.eye, s.head, s.crown, s.chin] : [s.head, s.facing ? s.head.clone().add(s.facing.clone().multiplyScalar(0.08 * s.H)) : s.head];
      let fs = 0, by = null; for (const p of facePts) { const b = seen(p, s.id); if (b) by = b; else fs++; }
      if (fs < (s.creature ? 3 : facePts.length)) { if (bad(s, 'L2 ' + s.id + ' hidden by ' + by.by)) return { fail, info }; continue; }
      let ok = 0; for (const p of s.body) if (!seen(p, s.id)) ok++; if (ok < s.body.length / 2) if (bad(s, 'L2 body of ' + s.id + ' hidden')) return { fail, info };
    }
    if (cand.contact) { const b = seen(cand.contact, null, sh.subjects, 0.35 * H0); if (b) return { fail: ['L2 the contact hidden by ' + b.by], info }; }
    const cl = clutter(pos.distanceTo(prim.head), sh.kind === 'TWO' ? sh.subjects : null, sh.size === 'CLOSE' && !prim.creature ? 0.8 : 0.45, S.map(x => x.id).concat(S.filter(x => x.carrier).map(x => x.carrier.id)));   /* a close: another man's helmet anywhere before the face is foreground */   /* in a two-shot the other principal's shoulder may frame the act */ info.clutter = cl; if (cl > 0.14) return { fail: ['L4 foreground covers ' + Math.round(cl * 100) + '%'], info };
    info.clutterFar = clutterFar(pos.distanceTo(prim.head), prim.feet ? prim.feet.y : prim.head.y - (prim.H || H0));
    info.facing = prim.facing ? prim.facing.dot(pos.clone().sub(prim.head).setY(0).normalize()) : 0.5;
    /* a close or a mid on a man speaking, acting or reacting shows his face, not the back of his head (a wide, a two-shot, an action may) */
    if (!prim.creature && sh.size !== 'WIDE' && ['HOT', 'REACT', 'SPK', 'MID'].includes(sh.kind) && info.facing < -0.25) return { fail: ['L3 the back of ' + prim.id + '\'s head'], info };
    return { fail, info };
  }
  function needOf(S, sh, prim) {
    const out = []; const all = sh.size === 'WIDE' || sh.kind === 'ACTION' || sh.kind === 'TWO';
    for (const s of S) { if (s.creature) out.push(...(sh.size === 'CLOSE' || sh.kind === 'INSERT' ? [s.head, s.eye, s.crown] : sh.size === 'WIDE' && sh.kind === 'GIANT' && !sh.lying ? s.whole : s.upper)); else if (sh.giant && s !== prim && sh.size !== 'WIDE' && prim.creature && s.head.distanceTo(prim.head) > 1.2 * (prim.H || H0)) continue;   /* a man far from the giant's close is not kept in it for size */
      else if (s === prim || all || sh.giant) out.push(...(all || sh.size === 'WIDE' ? s.whole : sh.size === 'CLOSE' ? [s.crown, s.chin] : s.upper)); else out.push(s.crown, s.chin);
      /* a rider (a man under a ram) is framed with the beast's silhouette, never from inside its fleece */
      if (s.carrier && (s === prim || sh.size !== 'WIDE')) { const b = s.carrier.box; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) out.push(new V3(x, y, z)); } }
    /* R10 an offer: the giver's hands (what passes) in frame */
    if (sh.offer) { const g = S.find(s => s.id === sh.offer); if (g && g.hands) out.push(...g.hands); }
    return out.filter(Boolean);
  }

  /* ── candidates for a shot at its middle drawing ── */
  function candidates(sh, S, key, prev) {
    const prim = S.find(s => s.id === sh.primary) || S[0], need = needOf(S, sh, prim), c = new V3(); for (const p of need) c.add(p); c.multiplyScalar(1 / need.length);
    let R = 0; for (const p of need) R = Math.max(R, p.distanceTo(c)); R = Math.max(R, prim.creature ? 0.5 * H0 : 0.3 * (prim.H || H0));
    const fov0 = sh.lens === 'wide' ? (sh.size === 'CLOSE' ? 50 : 58) : sh.size === 'CLOSE' || sh.kind === 'INSERT' ? 32 : sh.size === 'WIDE' ? 46 : 38;
    const half0 = Math.min(THREE.MathUtils.degToRad(fov0) / 2, Math.atan(Math.tan(THREE.MathUtils.degToRad(fov0) / 2) * aspect));
    const base = Math.max(R / Math.sin(half0) * 1.08, (prim.creature ? 0.3 : 0.9) * (prim.H || H0));
    const ground = groundAt(prim.feet || c);
    const out = [], v = sh.kind === 'INSERT' ? 0.42 : sh.size === 'WIDE' ? 0.3 : 0.34;
    const partner = sh.line ? sh.line.find(x => x !== sh.primary) : null;
    const ph = prim.creature ? H0 : (prim.H || H0);
    const angle = prim.creature && prim.lying ? 'high' : sh.angle;   /* a giant found lying is filmed from above, whatever the plan said */
    const elevs = angle === 'low' ? [ground + 0.22 * H0, ground + 0.45 * H0, ground + 0.8 * H0]
      : angle === 'high' ? [ground + 1.3 * H0, ground + 2.0 * H0, ground + 2.8 * H0]
      : [prim.head.y + 0.05 * ph, prim.head.y + 0.3 * ph, prim.head.y - 0.12 * ph, prim.head.y + 1.0 * ph];   /* the last over the heads of a crowd */
    /* distances from farther than the lens wants to much nearer: a nearer camera opens its lens to keep what the size needs (up to
       75 degrees), so a small room (a cave) still has cameras inside it */
    for (const k of [1.25, 1, 0.75, 0.55]) for (let a = 0; a < 16; a++) for (const y of elevs) {
      const az = a / 16 * Math.PI * 2, d = base * k, horiz = Math.sqrt(Math.max(1, d * d - (y - c.y) * (y - c.y)));
      const pos = new V3(c.x + Math.sin(az) * horiz, y, c.z + Math.cos(az) * horiz);
      const half = Math.asin(Math.min(0.97, R * 1.08 / pos.distanceTo(c))), fv = Math.max(fov0, Math.min(75, THREE.MathUtils.radToDeg(2 * half)));
      out.push({ pos, fov: Math.round(fv), az, k, y, u: 0.5, v });
    }
    /* the key's own camera for a wide (the gate approved its composition for the blocking) */
    if (sh.size === 'WIDE' && key) { try { const R0 = api.resolved(api.keyCam(key.k || key)); api.poseAt(sh.t0 / 2 + sh.t1 / 2); const kp = new V3(...R0.pos), far = kp.distanceTo(c) / base; if (far < 3) out.unshift({ pos: kp, fov: Math.max(R0.fov, 40), key: true, far, u: 0.5, v }); } catch (e) { } }   /* a key camera three times farther than the size wants shows the room, not the beat */
    for (const q of out) {
      if (partner && sh.size !== 'WIDE') { const P = pointsCache.get(partner); if (P) { camera.position.copy(q.pos); camera.lookAt(prim.head); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); const pp = proj(P.head), pr = proj(prim.head); q.u = pp[0] > pr[0] ? 0.38 : 0.62; } }
      if (sh.line) q.side = sideOf(q.pos, sh.line);
      if (sh.contact) q.contact = contactPoint(sh, S);
    }
    return out;
  }
  const pointsCache = new Map();
  /* the floor under a point: the first set part a ray from high above meets (figures and creatures aside) */
  function groundAt(p) { const hs = gridRay(W.G, new V3(p.x, p.y + 20 * H0, p.z), new V3(0, -1, 0), 60 * H0, false); let g = null; for (const h of hs) { if (h.point.y <= p.y + 0.3 * H0) { g = h.point.y; break; } } return g != null ? g : (hs.length ? hs[hs.length - 1].point.y : p.y); }
  function sideOf(pos, line) { const A = pointsCache.get(line[0]), B = pointsCache.get(line[1]); if (!A || !B) return 0; const a = A.feet || A.head, b = B.feet || B.head, d = b.clone().sub(a), q = pos.clone().sub(a); return Math.sign(d.x * q.z - d.z * q.x) || 1; }
  function contactPoint(sh, S) {
    const c = sh.contact; if (!c) return null;
    const cr = S.find(s => s.creature); if (cr && /IMPACT|THRUST|STRIKE/.test(c.kind)) return cr.eye;
    if (c.meet) return new V3(...c.meet);
    const hs = S.filter(s => s.hands).map(s => s.hands[0]).filter(Boolean); if (hs.length >= 2) return hs[0].clone().lerp(hs[1], 0.5); return null;
  }

  /* the score of a legal candidate */
  function score(cand, res, sh, prevCam) {
    let s = 0; const I = res.info;
    if (sh.kind !== 'WIDE' && !sh.giant) s += 1.2 * Math.max(-0.5, Math.min(1, I.facing));
    if (sh.profile && sh.line) { const A = pointsCache.get(sh.line[0]), B = pointsCache.get(sh.line[1]); if (A && B) { const ld = B.head.clone().sub(A.head).setY(0).normalize(), cd = I.target.clone().sub(cand.pos).setY(0).normalize(); s += 1.5 * (1 - Math.abs(ld.dot(cd))); } }
    if (sh.kind === 'TWO' && sh.line) for (const id of sh.line) { const P = pointsCache.get(id); if (P && P.facing) s += 0.8 * Math.max(-0.6, Math.min(0.5, P.facing.dot(cand.pos.clone().sub(P.head).setY(0).normalize()) + 0.2)); }
    if (sh.size !== 'WIDE' && !sh.giant) s -= Math.max(0, cand.fov - 45) / 20;   /* a close on a wide lens bends the face */
    if (sh.giant) { const lowness = cl01(1 - (cand.pos.y - (cand.ground || 0)) / (0.8 * H0)); s += 0.8 * lowness; }
    /* R10 an offer: from the man's side (the lens behind or beside the giver, looking up past him to the giant) */
    if (sh.offer) { const G = pointsCache.get(sh.offer), K = pointsCache.get(sh.primary); if (G && K) { const v = cand.pos.clone().sub(G.feet || G.head).setY(0).normalize(), w = (G.feet || G.head).clone().sub(K.feet || K.head).setY(0).normalize(); s += 2 * v.dot(w); } }
    /* a man speaking to (or acting on) another is seen from the other's side: the lens toward the addressee, his face to it */
    if (sh.line && sh.size !== 'WIDE' && !sh.giant) { const P = pointsCache.get(sh.primary), Q = pointsCache.get(sh.line.find(x => x !== sh.primary)); if (P && Q && !P.creature) { const v = cand.pos.clone().sub(P.head).setY(0).normalize(), w = Q.head.clone().sub(P.head).setY(0).normalize(); s += 1.0 * v.dot(w); } }
    if (cand.key) s += 1.5 - 1.6 * Math.max(0, (cand.far || 1) - 1.6);   /* the gate's camera, while it is near the size's distance */
    /* a lens beyond the set's floor looks at a model on a table, not into the place: allowed, but the last choice */
    if (!gridRay(W.G, cand.pos, new V3(0, -1, 0), 1e5, true).length) s -= 1.5;
    /* the lens looking steeply down on a figure reads as a plan, not a shot: only a lying giant is filmed from above */
    const lyingPrim = (pointsCache.get(sh.primary) || {}).lying;
    if (sh.angle !== 'high' && !lyingPrim) { const d = I.target.clone().sub(cand.pos).normalize(), down = Math.asin(Math.max(-1, Math.min(1, -d.y))); s -= 3 * Math.max(0, down - (sh.size === 'WIDE' ? 0.45 : 0.3)); }
    s -= 1.5 * (I.clutter || 0) + 5 * (I.clutterFar || 0) + 0.4 * (I.soft || 0);   /* the far clutter: a clear view of the act over one through rocks */
    if (prevCam) { const a = prevCam.dir, b = I.target.clone().sub(cand.pos).normalize(), ang = Math.acos(Math.max(-1, Math.min(1, a.dot(b)))); if (prevCam.primary === sh.primary && ang < 0.52) s -= 2.2; if (prevCam.pos.distanceTo(cand.pos) < 0.3 * H0) s -= 0.5; }
    s -= 0.15 * Math.abs((cand.k || 1) - 1);
    return s;
  }

  function attempt(sh, lineSide, ts, mid, prevCam) {
    let key;
    const subj = [...new Set([sh.primary, ...(sh.subjects || [])].filter(Boolean))];
    /* the middle drawing: candidates */
    key = api.poseAt(mid); world(key); pointsCache.clear();
    for (const id of new Set([...subj, ...(sh.line || [])])) { const p = points(id, mid); if (p) pointsCache.set(id, p); }
    let S = subj.map(id => pointsCache.get(id)).filter(Boolean);
    if (!S.length) { const any = api.cast()[0]; const p = any && points(any, mid); if (p) { S = [p]; sh.primary = any; } }
    const cands = S.length ? candidates(sh, S, key, prevCam) : [];
    const ground = groundAt(S[0] ? (S.find(s => s.id === sh.primary) || S[0]).feet : new V3()); for (const c of cands) c.ground = ground;
    /* test at the middle, then the survivors at the other samples; moving subjects: a camera that travels with them */
    const P0 = S.find(s => s.id === sh.primary) || S[0];
    let alive = [], worst = [];
    for (const c of cands) { const r = check(c, S, sh, lineSide); c.res = [r]; if (!r.fail.length) alive.push(c); else worst.push(c); }
    let moving = false, follow = null;
    for (const t of ts.slice(1)) {
      key = api.poseAt(t); world(key); pointsCache.clear(); for (const id of new Set([...subj, ...(sh.line || [])])) { const p = points(id, t); if (p) pointsCache.set(id, p); }
      const St = subj.map(id => pointsCache.get(id)).filter(Boolean); if (!St.length) continue;
      const Pt = St.find(s => s.id === sh.primary) || St[0]; if (P0 && Pt.feet && P0.feet && Pt.feet.distanceTo(P0.feet) > 1.2 * (P0.H || H0) && !P0.creature) moving = true;
      if (moving) follow = follow || new Map();
      const next = [];
      for (const c of alive) { const pos = moving ? c.pos.clone().add(Pt.feet.clone().sub(P0.feet)) : c.pos; const r = check({ ...c, pos, contact: sh.contact ? contactPoint(sh, St) : null }, St, sh, lineSide); c.res.push(r); if (!r.fail.length) next.push(c); else worst.push(c); }
      alive = next;
    }
    const kc = cands.find(c => c.key); const keyFate = kc ? (alive.includes(kc) ? 'legal' : (kc.res[kc.res.length - 1].fail[0] || '?')) : null;
    const hist = {}; for (const c of worst) { const f = c.res[c.res.length - 1].fail[0] || '?'; const k = f.replace(/ (of|by) .*/, '').replace(/\d+%/, 'n%'); hist[k] = (hist[k] || 0) + 1; }
    let relaxed = false;
    if (!alive.length && lineSide) {   /* no camera on the line's side: the line is crossed rather than an illegal frame kept */
      relaxed = true; let pool = cands.filter(c => c.side !== lineSide); for (const c of pool) c.rres = [];
      for (const t of ts) { key = api.poseAt(t); world(key); pointsCache.clear(); for (const id of new Set([...subj, ...(sh.line || [])])) { const p = points(id, t); if (p) pointsCache.set(id, p); }
        const St = subj.map(id => pointsCache.get(id)).filter(Boolean); if (!St.length) continue; const Pt = St.find(x => x.id === sh.primary) || St[0];
        pool = pool.filter(c => { const pos = moving && P0.feet && Pt.feet ? c.pos.clone().add(Pt.feet.clone().sub(P0.feet)) : c.pos; const r = check({ ...c, pos, contact: sh.contact ? contactPoint(sh, St) : null }, St, sh, 0); c.rres.push(r); return !r.fail.length; }); }
      for (const c of pool) c.res = c.rres; alive = pool;
    }
    return { subj, S, cands, alive, worst, hist, relaxed, moving, P0, keyFate };
  }
  /* ── solve every shot ── */
  const lines = new Map(), solved = [], report = [], stats = {};
  let prevCam = null, prevHold = null;
  for (const sh of plan.shots) {
    const t0 = sh.t0, t1 = sh.t1, mid = (t0 + t1) / 2;
    const ts = [mid, Math.min(t1 - 0.05, t0 + 0.1), Math.max(t0 + 0.05, t1 - 0.1)]; if (sh.contact && sh.contact.t > t0 && sh.contact.t < t1) ts.push(sh.contact.t + 0.05);
    const lineKey = sh.line ? sh.beat + ':' + sh.line.slice().sort().join('|') : null, lineSide = lineKey ? lines.get(lineKey) || 0 : 0;
    /* the ladder: as planned; then (no legal camera) the primary alone one size wider; then a wide on the primary */
    const WIDER = { CLOSE: 'MID', MID: 'WIDE', WIDE: 'WIDE' };
    let use = sh, A = attempt(sh, lineSide, ts, mid, prevCam), eased = null;
    if (!A.alive.length && ((sh.subjects || []).length > 1 || sh.size !== 'WIDE')) { const v = Object.assign({}, sh, { subjects: [sh.primary], size: WIDER[sh.size] || 'WIDE', contact: null, profile: false }); const B = attempt(v, lineSide, ts, mid, prevCam); if (B.alive.length) { A = B; use = v; eased = 'the ' + sh.size.toLowerCase() + ' had no legal camera: the primary alone, ' + v.size.toLowerCase(); } }
    if (!A.alive.length && use.size !== 'WIDE') { const v = Object.assign({}, sh, { subjects: [sh.primary], size: 'WIDE', contact: null, profile: false, angle: 'eye' }); const B = attempt(v, lineSide, ts, mid, prevCam); if (B.alive.length) { A = B; use = v; eased = 'no legal camera at the planned size: a wide on the primary'; } }
    /* the primary cannot be framed legally from anywhere: the shot goes to the other end of its line (whom it reacts to, acts on) */
    if (!A.alive.length && sh.line) { const other = sh.line.find(x => x !== sh.primary); if (other) { const v = Object.assign({}, sh, { primary: other, subjects: [other, sh.primary], size: 'MID', contact: null, profile: false, kind: sh.kind, giant: creatures[other] ? other : sh.giant, angle: creatures[other] ? (sh.angle === 'high' || sh.lying ? 'high' : 'low') : 'eye' }); const B = attempt(v, lineSide, ts, mid, prevCam); if (B.alive.length) { A = B; use = v; eased = sh.primary + ' cannot be framed legally from anywhere: the shot goes to ' + other + ' (' + sh.primary + ' in frame if seen)'; } } }
    /* last: hold the shot before (its camera, its framing) if it stays legal here: a reaction that cannot be seen is not cut to */
    if (!A.alive.length && prevHold) { const c = Object.assign({}, prevHold.pick, { res: [] }); let ok = true;
      for (const t of ts) { const k = api.poseAt(t); world(k); pointsCache.clear(); for (const id of new Set([...prevHold.subj, ...(prevHold.use.line || [])])) { const p = points(id, t); if (p) pointsCache.set(id, p); }
        const St = prevHold.subj.map(id => pointsCache.get(id)).filter(Boolean); if (!St.length) { ok = false; break; } const r = check(c, St, prevHold.use, 0); c.res.push(r); if (r.fail.length) { ok = false; break; } }
      if (ok) { A = Object.assign({}, A, { subj: prevHold.subj, alive: [c], moving: false, P0: null }); use = prevHold.use; eased = sh.primary + ' cannot be framed legally from anywhere: the shot before is held (no cut)'; } }
    let { subj, S, cands, alive, worst, hist, relaxed, moving, P0, keyFate } = A; let key;
    let pick = null, legal = alive.length > 0;
    let lum = null, lumRefused = 0;
    if (legal) { const ranked = alive.map(c => ({ c, s: score(c, c.res[0], use, prevCam) })).sort((a, b) => b.s - a.s); pick = ranked[0].c;
      /* the exposure: the best five in turn until one is neither black nor washed out (moving cameras are checked where they stand) */
      let lit = false; for (const { c } of ranked.slice(0, 12)) { const L = moving ? null : lumaSpan(c, use, subj, t0, t1); if (!lumaBad(L)) { pick = c; lum = L; lit = true; break; } lumRefused++; if (lumRefused === 1) lum = L; }
      /* every camera tested was black or washed out: the primary alone one size the other way, then the other end of the line */
      if (!lit) { const alt = [Object.assign({}, use, { subjects: [use.primary], size: use.size === 'WIDE' ? 'MID' : 'WIDE', contact: null, profile: false, angle: 'eye' })];
        const other = use.line && use.line.find(x => x !== use.primary); if (other) alt.push(Object.assign({}, use, { primary: other, subjects: [other], size: 'MID', contact: null, profile: false, giant: creatures[other] ? other : null, angle: creatures[other] ? 'low' : 'eye' }));
        for (const v of alt) { const B = attempt(v, 0, ts, mid, prevCam); if (!B.alive.length) continue; const rk = B.alive.map(c => ({ c, s: score(c, c.res[0], v, prevCam) })).sort((a, b) => b.s - a.s);
          for (const { c } of rk.slice(0, 8)) { const L = B.moving ? null : lumaSpan(c, v, B.subj, t0, t1); if (!lumaBad(L)) { pick = c; lum = L; lit = true; break; } }
          if (lit) { use = v; ({ subj, S, cands, alive, worst, hist, relaxed, moving, P0, keyFate } = B); eased = (eased ? eased + '; ' : '') + 'the planned frame was ' + (lum && lum.mean > 0.5 ? 'washed out' : 'black') + ' from every legal camera: ' + v.primary + ', ' + v.size.toLowerCase(); break; } } } }
    else { /* the least bad: fewest failed checks over the samples, never inside geometry if that can be had */
      const sev = f => f.startsWith('L1') ? 100 : f.startsWith('L2') ? 8 : f.startsWith('L3') ? 6 : f.startsWith('L5') ? 4 : 2;
      /* never a camera inside geometry: the least bad are tested for L1 at the middle drawing, in order, until one is clear */
      const ranked = [...new Set(worst)].map(c => ({ c, f: c.res.reduce((n, r) => n + r.fail.reduce((m, x) => m + sev(x), 0), 0) - 0.5 * c.res.length })).sort((a, b) => a.f - b.f);
      key = api.poseAt(mid); world(key); for (const { c } of ranked) { if (c.res.some(r => r.fail.some(x => x.startsWith('L1')))) continue; if (!inside(c.pos).length) { pick = c; break; } }
      if (!pick && ranked.length) pick = ranked[0].c; }
    /* the chosen camera's track: the pan keyed every half second (and the position, for a travelling camera) */
    const keysT = []; const n = Math.max(2, Math.ceil((t1 - t0) / 0.5) + 1);
    if (pick) for (let i = 0; i < n; i++) { const t = t0 + (t1 - t0) * i / (n - 1); key = api.poseAt(Math.min(t, t1 - 0.02)); world(key); pointsCache.clear(); for (const id of subj) { const p = points(id, t); if (p) pointsCache.set(id, p); }
      const St = subj.map(id => pointsCache.get(id)).filter(Boolean); if (!St.length) continue; const Pt = St.find(s => s.id === sh.primary) || St[0];
      const pos = moving && P0.feet ? pick.pos.clone().add(Pt.feet.clone().sub(P0.feet)) : pick.pos.clone();
      const tg = aim(pos, pick.fov, needOf(St, use, Pt), use.size === 'WIDE' && !use.giant ? null : use.kind === 'INSERT' ? Pt.eye : Pt.head, pick.u, pick.v);
      keysT.push([t, pos.toArray(), tg.toArray()]); }
    /* smooth the pan: a figure's small moves should not shake the frame */
    for (let pass = 0; pass < 2; pass++) for (let i = 1; i < keysT.length - 1; i++) keysT[i][2] = keysT[i][2].map((v, q) => (keysT[i - 1][2][q] + 2 * v + keysT[i + 1][2][q]) / 4);
    if (pick && legal && lineKey && !lines.has(lineKey) && pick.side) lines.set(lineKey, pick.side);
    const fails = pick ? [...new Set(pick.res.flatMap(r => r.fail))] : ['no subject'];
    const out = { id: 'c' + sh.i + ':' + sh.kind + ':' + use.size, i: sh.i, kind: sh.kind, size: use.size, t0, dur: t1 - t0, cine: true, fov: pick ? pick.fov : 40, track: keysT, moving, primary: use.primary };
    solved.push(out);
    report.push({ i: sh.i, t0: +t0.toFixed(2), t1: +t1.toFixed(2), kind: sh.kind, size: use.size, planned: sh.size, eased, primary: use.primary, subjects: subj, why: sh.why, line: sh.line, side: pick ? pick.side || 0 : 0, lineHeld: !!lineSide,
      camera: pick ? { pos: pick.pos.toArray().map(v => +v.toFixed(1)), fov: pick.fov, key: !!pick.key, az: pick.az != null ? +pick.az.toFixed(2) : null, travelling: moving } : null,
      legal, relaxed, keyCamera: keyFate, rejected: hist, candidates: cands.length, legalCandidates: alive.length, samples: ts.map(v => +v.toFixed(2)),
      checks: legal ? ['L1 not inside geometry', 'L2 subjects and contact seen', 'L3 heads in frame, face in the upper half', 'L4 framing and foreground', ...(sh.line ? [relaxed ? 'L5 crossed: no legal camera on the line\'s side' : 'L5 ' + (lineSide ? 'on the side the line took' : 'takes the line\'s side')] : [])] : [], failed: legal ? [] : fails,
      facing: pick ? +(pick.res[0].info.facing || 0).toFixed(2) : null, headV: pick ? pick.res[0].info.headV : null, clutterFar: pick && pick.res[0].info.clutterFar != null ? +pick.res[0].info.clutterFar.toFixed(2) : null, luma: lum, lumaRefused: lumRefused });
    stats[sh.kind + (legal ? '' : '!')] = (stats[sh.kind + (legal ? '' : '!')] || 0) + 1;
    prevHold = pick && legal && !moving ? { pick, use, subj } : null;
    if (pick && keysT.length) { const k0 = keysT[Math.floor(keysT.length / 2)]; prevCam = { pos: new V3(...k0[1]), dir: new V3(...k0[2]).sub(new V3(...k0[1])).normalize(), primary: sh.primary }; }
  }
  camera.position.copy(saved.pos); camera.quaternion.copy(saved.q); camera.fov = saved.fov; camera.updateProjectionMatrix();
  const ms = performance.now() - t0w; console.log('[take] cinematographer: ' + solved.length + ' shots solved in ' + (ms / 1000).toFixed(1) + ' s; legal ' + report.filter(r => r.legal).length + '; exposure measured ' + report.filter(r => r.luma).length + ', refused ' + report.reduce((n, r) => n + (r.lumaRefused || 0), 0));

  const move = (plan.direction && plan.direction.move) || 'push';
  const S = {
    plan, solved, report: () => ({ time: Object.fromEntries(Object.entries(TIME).map(([k, v]) => [k, +(v / 1000).toFixed(1)])), scene: plan.scene, media: plan.media, direction: plan.direction, rules: 'tools/cinematographer/plan.js R1-R9; solve.js L1-L5', solvedIn: +(ms / 1000).toFixed(1), shots: report }),
    stats: () => stats,
    shotAt(t) { let s = solved[0]; for (const x of solved) if (x.t0 <= t + 1e-6) s = x; return s; },
    shoot(sh, t) {
      const K = sh.track; if (!K.length) return; let i = 0; while (i < K.length - 2 && K[i + 1][0] <= t) i++;
      const a = K[i], b = K[Math.min(K.length - 1, i + 1)], u = b[0] > a[0] ? sm((t - a[0]) / (b[0] - a[0])) : 0;
      const pos = a[1].map((v, q) => lerp(v, b[1][q], u)), tg = a[2].map((v, q) => lerp(v, b[2][q], u));
      /* the direction's move over the shot: a push closes 5% on the target, a pull opens 5% */
      const w = sm(cl01((t - sh.t0) / Math.max(0.5, sh.dur))), k = move === 'push' ? 0.05 * w : move === 'pull' ? -0.05 * w : 0;
      const p = pos.map((v, q) => v + (tg[q] - v) * k);
      api.shoot({ pos: p, target: tg, fov: sh.fov });
    },
    /* an audit of any cameras (the take's old shots, as tools/perform/probe.js read them, or this plan's): for each {t, pos, dir, fov}
       whether the lens is inside geometry (L1), and for each figure and creature whether its head is in the frame and seen (L2, L3) */
    audit(cams) { const out = []; for (const c of cams) { const key = api.poseAt(c.t); world(key); let pos, dir, fov;
        if (c.pos) { pos = new V3(...c.pos); dir = new V3(...c.dir); fov = c.fov; } else { const s = S.shotAt(c.t); S.shoot(s, c.t); pos = camera.position.clone(); dir = camera.getWorldDirection(new V3()); fov = camera.fov; }
        place(pos, fov, pos.clone().add(dir)); const ins = inside(pos); const who = {};
        for (const id of [...api.cast(), ...Object.keys(creatures)]) { const p = points(id, c.t); if (!p) continue; const q = proj(p.creature ? p.eye : p.head); const inF = q[2] < 1 && q[0] > 0 && q[0] < 1 && q[1] > 0 && q[1] < 1; who[id] = { inFrame: inF, seen: inF ? !seen(p.creature ? p.eye : p.head, id) : false, v: +q[1].toFixed(2) }; }
        out.push({ t: c.t, inside: ins[0] || null, who, luma: luma(), exposure: null }); out[out.length - 1].exposure = lumaBad(out[out.length - 1].luma) ? 'refused' : 'ok'; }
      return out; },
    /* after OdysseyTake.frame(t): where the shot's subjects are on the frame (for marking a still) */
    debug(t) { if (Array.isArray(t)) return S.audit(t); const s = S.shotAt(t), r = report.find(x => x.i === s.i); const key = api.poseAt(t); world(key); S.shoot(s, t); camera.updateMatrixWorld(); camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const marks = []; for (const id of r.subjects) { const p = points(id, t); if (!p) continue; for (const n of ['head', 'eye', 'crown', 'feet']) if (p[n]) { const q = proj(p[n]); marks.push({ id, n, u: q[0], v: q[1], z: q[2] }); } if (p.box) { const b = p.box; for (const x of [b.min, b.max]) { const q = proj(x); marks.push({ id, n: 'box', u: q[0], v: q[1], z: q[2] }); } } }
      /* what the lens meets along its axis (the first parts, with their owners): a frame filled by something is named */
      const ax = camera.getWorldDirection(new V3()), axis = hitsAlong(camera.position, camera.position.clone().add(ax.multiplyScalar(20 * H0))).slice(0, 4).map(h => ({ by: owner(h.object) || null, name: h.object.name || (h.object.parent && h.object.parent.name) || null, at: +h.distance.toFixed(1), H: +(h.distance / H0).toFixed(2) }));
      const sizes = r.subjects.map(id => { const p = points(id, t); return p ? { id, H: +(p.H || 0).toFixed(1), H0: +H0.toFixed(1), d: +camera.position.distanceTo(p.head).toFixed(1), carrier: p.carrier ? p.carrier.id : null, facesLens: p.facing ? +p.facing.dot(camera.position.clone().sub(p.head).setY(0).normalize()).toFixed(2) : null, headingFaces: p.heading != null ? +new V3(Math.sin(p.heading), 0, Math.cos(p.heading)).dot(camera.position.clone().sub(p.head).setY(0).normalize()).toFixed(2) : null } : null; });
      const cp = camera.position, world_ = { inside: inside(cp.clone()), props: (W.propBoxes || []).map(x => ({ id: x.id, dist: +x.b.distanceToPoint(cp).toFixed(1) })).sort((a, b) => a.dist - b.dist).slice(0, 5), creatures: (W.crS || []).map(k => ({ id: k.id, d: +k.c.distanceTo(cp).toFixed(1), r: +k.r.toFixed(1) })).sort((a, b) => a.d - b.d).slice(0, 4), luma: luma() };
      return { report: r, marks, axis, sizes, world: world_ }; },
  };
  return S;
}
root.OdysseyCine = { solve, version: 1 };
})(typeof window !== 'undefined' ? window : globalThis);
