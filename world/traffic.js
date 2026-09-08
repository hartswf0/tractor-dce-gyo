/* world/traffic.js — cars on the roads: parked in the lots and at the kerbs, driving the lanes.

   The cars are the builder's own vehicle recipe (dsl.js vehicleMPD), parsed
   once per model and colour and merged into one geometry each, so a whole
   city of cars is a handful of draw calls. Moving cars follow the road
   polylines in the right-hand lane, turn at junctions, keep their distance,
   and stop for whoever stands in the lane. A ride that rams a car flings it
   whole into the debris. */
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const SCHEMES = [4, 1, 14, 2, 15, 0, 25, 72];                                   // red, blue, yellow, green, white, black, orange, grey
const MODELS = { car: { kind: 'car', len: 6, cap: 36 }, van: { kind: 'truck', len: 8, cap: 12 }, bus: { kind: 'truck', len: 12, cap: 8 } };
const SPEED = { motorway: 22, trunk: 20, primary: 14, secondary: 13, tertiary: 11, residential: 8, unclassified: 8, living_street: 4, service: 5 };
const CAP_PARKED = 160, N_MOVING = 30, FLIP = new THREE.Matrix4().makeRotationX(Math.PI);
/** One geometry with vertex colours from a parsed LDraw group (its own frame, y down → y up). */
function merge(root) {
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), P = [], N = [], C = [], v = new THREE.Vector3();
  root.traverse(o => {
    if (!o.isMesh) return; const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld).premultiply(FLIP), nm = new THREE.Matrix3().getNormalMatrix(m);
    const pos = g.attributes.position, nor = g.attributes.normal, mats = Array.isArray(o.material) ? o.material : [o.material], groups = g.groups && g.groups.length ? g.groups : [{ start: 0, count: pos.count, materialIndex: 0 }];
    for (const gr of groups) { const mat = mats[gr.materialIndex] || mats[0], c = mat && mat.color ? mat.color : new THREE.Color(0.5, 0.5, 0.5); const end = gr.count === Infinity ? pos.count : Math.min(pos.count, gr.start + gr.count);
      for (let i = gr.start; i < end; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(m); P.push(v.x, v.y, v.z); if (nor) { v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z); } else N.push(0, 1, 0); C.push(c.r, c.g, c.b); } }
  });
  if (!P.length) return null;
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  out.computeBoundingBox(); const bb = out.boundingBox; out.translate(0, -bb.min.y, 0); out.computeBoundingBox(); out.computeBoundingSphere(); return out;
}
function create({ scene, M, props, G, debris, roads: roadsOf }) {
  const T = { scene, M, props, G, debris, models: new Map(), cars: [], moving: [], ready: false, night: 0, group: null, lights: null, flung: 0, stops: 0, t: 0 };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .45, metalness: .1 });
  /** Parse and merge every model in every colour: once per page. */
  T.prepare = async () => {
    if (T.ready || !window.Dsl) return; const group = new THREE.Group(); group.name = 'traffic'; T.group = group; scene.add(group);
    for (const [name, mdl] of Object.entries(MODELS)) for (const col of SCHEMES) {
      const key = name + ':' + col; try {
        const res = Dsl.compile({ ops: [{ op: 'vehicle', kind: mdl.kind, len: mdl.len, col, x: 0, z: 0, facing: 's' }] }), prop = res.props && res.props[0]; if (!prop) continue;
        const g = await props.parse(prop.mpd, 'traffic-' + key + '.mpd'), geom = merge(g); if (!geom) continue;
        const im = new THREE.InstancedMesh(geom, mat, mdl.cap); im.count = 0; im.frustumCulled = false; im.name = 'traffic:' + key; group.add(im);
        const half = new THREE.Vector3(); geom.boundingBox.getSize(half).multiplyScalar(0.5);
        T.models.set(key, { key, name, col, im, geom, half, n: 0, free: [] }); if (debris) debris.register('traffic:' + key, geom, 6);
      } catch (e) { console.warn('traffic model', key, e && e.message); }
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_MOVING * 2 * 3), 3));
    T.lights = new THREE.Points(lg, new THREE.PointsMaterial({ map: Lamps.radial(), size: 1.2 * M, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff2c0, opacity: 0.3, fog: false })); T.lights.name = 'carLights'; T.lights.frustumCulled = false; group.add(T.lights);
    T.ready = true; if (T.pending) { const w = T.pending; T.pending = null; T.lay(w.G, w.win); }
  };
  const model = (name, seed) => { const keys = [...T.models.keys()].filter(k => k.startsWith(name + ':')); if (!keys.length) return null; return T.models.get(keys[hash(seed) % keys.length]); };
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), P3 = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
  const write = c => { const m = c.model; Q.setFromAxisAngle(UP, c.yaw); P3.set(c.x, c.y, c.z); M4.compose(P3, Q, ONE); m.im.setMatrixAt(c.slot, M4); m.im.instanceMatrix.needsUpdate = true; };
  const hide = c => { const m = c.model; m.im.setMatrixAt(c.slot, new THREE.Matrix4().makeScale(0, 0, 0)); m.im.instanceMatrix.needsUpdate = true; };
  const spawn = (name, seed, x, z, yaw, extra) => { const m = model(name, seed); if (!m) return null; let slot = m.free.pop(); if (slot == null) { if (m.n >= m.im.count && m.im.count >= MODELS[name].cap) return null; slot = m.n++; m.im.count = Math.max(m.im.count, slot + 1); }
    const c = { model: m, slot, x, z, y: T.G.h(x, z), yaw, r: m.half.z * 0.8, alive: true, ...(extra || {}) }; write(c); T.cars.push(c); return c; };
  const groundAt = (x, z) => Math.max(T.G.h(x, z), Ground.deckAt(T.G, x, z));
  /** Everything for a window: parked cars in the lots and along the residential kerbs, moving cars on the roads. Coordinates in metres. */
  T.lay = (G, win) => {
    T.G = G; if (!T.ready) { T.pending = { G, win }; return; }
    for (const c of T.cars) hide(c); T.cars = []; T.moving = []; for (const m of T.models.values()) { m.n = 0; m.free = []; m.im.count = 0; }
    const roads = (win.roads || []).filter(Ground.wheels), driven = roads;
    const nearRoad = (x, z) => { for (const r of driven) { const half = (r.w || 5) / 2 + 1.2; for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / L2, 0, 1); if (Math.hypot(x - a.x - dx * t, z - a.z - dz * t) < half) return true; } } return false; };
    let parked = 0;
    for (const a of win.areas || []) { if (a.kind !== 'parking' || !a.ring || a.ring.length < 3) continue; const ring = a.ring; let bi = 0, bl = 0; for (let i = 0; i < ring.length; i++) { const q = ring[(i + 1) % ring.length], L = Math.hypot(q.x - ring[i].x, q.z - ring[i].z); if (L > bl) { bl = L; bi = i; } }
      const A = ring[bi], B = ring[(bi + 1) % ring.length], ux = (B.x - A.x) / bl, uz = (B.z - A.z) / bl, vx = -uz, vz = ux; let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity; for (const p of ring) { const u = (p.x - A.x) * ux + (p.z - A.z) * uz, v = (p.x - A.x) * vx + (p.z - A.z) * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      const inside = (x, z) => { let ok = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const p = ring[i], q = ring[j]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) ok = !ok; } return ok; };
      for (let v = v0 + 1.5; v + 5 <= v1 && parked < CAP_PARKED; v += 7) for (let u = u0 + 1.5; u + 2.5 <= u1 - 1.5 && parked < CAP_PARKED; u += 2.5) { if (hash(a.id * 7 + u * 3 + v * 11) % 100 >= 60) continue;
        const cx = A.x + ux * (u + 1.25) + vx * (v + 2.5), cz = A.z + uz * (u + 1.25) + vz * (v + 2.5); const p0 = { x: A.x + ux * u + vx * v, z: A.z + uz * u + vz * v }, p1 = { x: A.x + ux * (u + 2.5) + vx * (v + 5), z: A.z + uz * (u + 2.5) + vz * (v + 5) };
        if (!inside(p0.x, p0.z) || !inside(p1.x, p1.z) || nearRoad(p0.x, p0.z) || nearRoad(p1.x, p1.z)) continue; if (spawn('car', a.id * 13 + u * 5 + v, cx * M, cz * M, Math.atan2(vx, vz) + (hash(u + v) % 2 ? Math.PI : 0), { parked: true })) parked++; } }
    for (const r of roads) { if (r.kind !== 'residential' || r.bridge) continue; let acc = 9, side = 1; const off = (r.w || 6) / 2 - 1.2;
      for (let i = 0; i < r.pts.length - 1 && parked < CAP_PARKED; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz); if (len < 0.1) continue; const ux = dx / len, uz = dz / len, nx = -uz, nz = ux;
        for (let s = acc; s + 3 < len; s += 14) { if (hash(r.id * 31 + Math.round(s)) % 100 < 40) { const x = a.x + ux * s + nx * off * side, z = a.z + uz * s + nz * off * side; if (spawn('car', r.id * 17 + s, x * M, z * M, Math.atan2(ux, uz) + (side > 0 ? 0 : Math.PI), { parked: true })) parked++; } side = -side; } acc = ((acc - len) % 14 + 14) % 14; } }
    // moving cars: on the roads, in the right-hand lane
    const drivable = roads.filter(r => !r.bridge || true); let seed = 5;
    for (let k = 0; k < N_MOVING && drivable.length; k++) { const r = drivable[hash(seed++ * 97) % drivable.length]; if (r.pts.length < 2) continue; const i = hash(seed++ * 13) % (r.pts.length - 1), t = (hash(seed++ * 7) % 100) / 100, dir = hash(seed++ * 3) % 2 ? 1 : -1;
      const name = k % 9 === 8 ? 'bus' : k % 4 === 3 ? 'van' : 'car'; const c = spawn(name, k * 101, 0, 0, 0, { road: r, i, t, dir, speed: 0, want: SPEED[r.kind] || 8, moving: true }); if (!c) continue; T.moving.push(c); T.place(c); }
    return T.stats();
  };
  /** Put a moving car where its road, segment and t say, in its lane, on the ground or the deck. */
  T.place = c => { const r = c.road, a = r.pts[c.i], b = r.pts[c.i + 1], x = lerp(a.x, b.x, c.t), z = lerp(a.z, b.z, c.t), dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1, tx = dx / L * c.dir, tz = dz / L * c.dir, rx = -tz, rz = tx, lane = Math.max(1.2, (r.w || 5) / 4);
    c.x = (x + rx * lane) * M; c.z = (z + rz * lane) * M; c.y = groundAt(c.x, c.z) + 2; c.yaw = Math.atan2(tx, tz); c.tx = tx; c.tz = tz; write(c); };
  const junction = (r, end) => { const p = end > 0 ? r.pts[r.pts.length - 1] : r.pts[0], out = []; for (const q of T.roadsNow || []) { if (q === r || q.pts.length < 2) continue; if (Math.hypot(q.pts[0].x - p.x, q.pts[0].z - p.z) < 6) out.push({ r: q, i: 0, t: 0, dir: 1 }); if (Math.hypot(q.pts[q.pts.length - 1].x - p.x, q.pts[q.pts.length - 1].z - p.z) < 6) out.push({ r: q, i: q.pts.length - 2, t: 1, dir: -1 }); } return out; };
  /** ctx: { blockers: [{ x, z, r }] in LDU (the walker, a ride, the ship), night } */
  T.step = (dt, ctx) => {
    if (!T.ready) return; T.t += dt; const blockers = ctx && ctx.blockers || []; T.night = ctx && ctx.night != null ? ctx.night : T.night;
    for (const c of T.moving) { if (!c.alive) continue; const r = c.road; let want = c.want;
      for (const b of blockers) { const dx = b.x - c.x, dz = b.z - c.z, ahead = dx * c.tx + dz * c.tz, side = Math.abs(-dx * c.tz + dz * c.tx); if (ahead > -b.r && ahead < 12 * M + b.r && side < 2 * M + b.r) { want = 0; if (!c.stopped) { c.stopped = true; T.stops++; } } }
      if (want > 0) c.stopped = false;
      for (const o of T.moving) { if (o === c || !o.alive || o.road !== r || o.dir !== c.dir) continue; const dx = o.x - c.x, dz = o.z - c.z, ahead = dx * c.tx + dz * c.tz; if (ahead > 0 && ahead < 12 * M && Math.abs(-dx * c.tz + dz * c.tx) < 2 * M) want = Math.min(want, o.speed * 0.9); }
      c.speed += (want - c.speed) * (1 - Math.exp(-dt * (want < c.speed ? 4 : 1.2)));
      const a = r.pts[c.i], b = r.pts[c.i + 1], L = Math.hypot(b.x - a.x, b.z - a.z) || 1; c.t += c.dir * c.speed * dt / L;
      while (c.t > 1 || c.t < 0) {
        if (c.t > 1) { if (c.i + 1 < r.pts.length - 1) { c.t -= 1; c.i++; const L2 = Math.hypot(r.pts[c.i + 1].x - r.pts[c.i].x, r.pts[c.i + 1].z - r.pts[c.i].z) || 1; c.t *= L / L2; } else { const opts = junction(r, 1); if (opts.length) { const o = opts[hash(c.slot * 31 + Math.floor(T.t)) % opts.length]; c.road = o.r; c.i = o.i; c.t = o.t; c.dir = o.dir; c.want = SPEED[o.r.kind] || 8; } else { c.dir = -1; c.t = 1; } break; } }
        else { if (c.i > 0) { c.i--; c.t += 1; } else { const opts = junction(r, -1); if (opts.length) { const o = opts[hash(c.slot * 31 + Math.floor(T.t)) % opts.length]; c.road = o.r; c.i = o.i; c.t = o.t; c.dir = o.dir; c.want = SPEED[o.r.kind] || 8; } else { c.dir = 1; c.t = 0; } break; } }
      }
      c.t = clamp(c.t, 0, 1); T.place(c);
    }
    if (T.lights) { const a = T.lights.geometry.attributes.position.array; let k = 0; for (const c of T.moving) { if (!c.alive) continue; const hx = c.x + c.tx * c.model.half.z * 0.95, hz = c.z + c.tz * c.model.half.z * 0.95, sx = -c.tz * 0.7 * M, sz = c.tx * 0.7 * M; a[k++] = hx + sx; a[k++] = c.y + 0.5 * M; a[k++] = hz + sz; a[k++] = hx - sx; a[k++] = c.y + 0.5 * M; a[k++] = hz - sz; } for (; k < a.length; k++) a[k] = 0; T.lights.geometry.attributes.position.needsUpdate = true; T.lights.geometry.setDrawRange(0, T.moving.filter(c => c.alive).length * 2); T.lights.material.opacity = 0.25 + 0.75 * T.night; }
  };
  /** Keep a walker (or a ride) out of the cars: each is a disc as long as its half-length. */
  T.pushOut = (pos, r) => { let moved = false; for (const c of T.cars) { if (!c.alive || Math.abs(pos.y - c.y) > 3 * M) continue; const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz), want = r + c.r; if (d < want && d > 1e-3) { pos.x = c.x + dx / d * want; pos.z = c.z + dz / d * want; moved = true; } } return moved; };
  /** A ride at speed meets a car: the car flies off whole as debris. Returns how many. */
  T.hit = (pos, r, vel) => { let n = 0; for (const c of T.cars) { if (!c.alive || Math.hypot(pos.x - c.x, pos.z - c.z) > r + c.r || Math.abs(pos.y - c.y) > 3 * M) continue; c.alive = false; hide(c); T.flung++; n++;
      if (T.debris) { const m = new THREE.Matrix4().compose(new THREE.Vector3(c.x, c.y, c.z), new THREE.Quaternion().setFromAxisAngle(UP, c.yaw), ONE), v = vel ? vel.clone().multiplyScalar(0.6) : new THREE.Vector3(); v.y += 3 * M; T.debris.spawn({ part: 'traffic:' + c.model.key, matrix: m, colour: new THREE.Color(1, 1, 1), vel: v }); } }
    if (n) T.moving = T.moving.filter(c => c.alive); return n; };
  T.setNight = n => { T.night = n; };
  T.setRoads = roads => { T.roadsNow = (roads || []).filter(Ground.wheels); };
  T.stats = () => ({ ready: T.ready, models: T.models.size, cars: T.cars.filter(c => c.alive).length, parked: T.cars.filter(c => c.alive && c.parked).length, moving: T.moving.filter(c => c.alive).length, flung: T.flung, stops: T.stops, kinds: [...T.models.values()].filter(m => m.n).map(m => m.name).reduce((o, k) => { o[k] = (o[k] || 0) + 1; return o; }, {}) });
  T.list = () => T.moving.filter(c => c.alive).map(c => ({ x: c.x / M, z: c.z / M, yaw: +c.yaw.toFixed(2), speed: +c.speed.toFixed(1), road: c.road.name || c.road.kind, stopped: !!c.stopped }));
  return T;
}
window.Traffic = { create, MODELS, SCHEMES, SPEED, N_MOVING };
})();
