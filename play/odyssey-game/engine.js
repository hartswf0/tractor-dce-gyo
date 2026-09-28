/* play/odyssey-game/engine.js — the bridge from the game to Hand Butter.

   Hand Butter's workspace is a classic script, so its state is in the page's global scope: S (parts, selection, the move
   transaction S.tx), catalog (part geometry), scene, camera, renderer, PH (cannon bodies and stud bonds), and the functions
   create/restore/bounds/project/pick/begin/propose/finish/findMagnet/auditContacts/choose. ButterScenes.load stages a scene
   (parts + cast), ButterPerformer.makeActor builds a minifig rig, ButterRepository.load fetches an LDraw part into the catalog,
   ButterSpatialRuntime.plate is the construction frame and its frame() chain runs once per rendered frame, before the render.
   This file uses those, and adds only what a game needs: a camera that frames the action, a sky and a sea, prop meshes made of
   the catalog's own brick geometry, minifig actors with halfworld faces, and a carry (pinch → move → release) built on
   Butter's transaction so a released brick seats and bonds by Butter's exact stud test. */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const E = OG.E = { V3, clamp, lerp, smooth, actors: [], tickers: new Set(), time: 0, timeScale: 1 };

/* ── boot: wait for the workshop, the cast and the performer ── */
E.ready = () => new Promise(resolve => { const poll = () => { try { if (window.WagWorkshop && WagWorkshop.ready() && window.ButterCast && ButterCast.cast.length && window.ButterPerformer && ButterPerformer.state.rig && window.ButterScenes && !ButterScenes.busy) return resolve(); } catch (e) { } setTimeout(poll, 120); }; poll(); });
E.setup = function () {
  // the performer (the workshop's own citizen) steps off stage; the game casts its own figures
  const st = ButterPerformer.state; st.on = false; if (st.rig) st.rig.figure.visible = false;
  try { renderer.setPixelRatio(1); } catch (e) { }
  try { sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } } catch (e) { }
  if (window.OG_MOBILE || matchMedia('(pointer: coarse)').matches) { try { renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.shadowMap.enabled = false; sun.castShadow = false; } catch (e) { } E.lite = true; E.mobile = true; }
  if (new URLSearchParams(location.search).has('lite')) { try { renderer.shadowMap.enabled = false; sun.castShadow = false; } catch (e) { } E.lite = true; }
  E.root = new THREE.Group(); E.root.name = 'odyssey-game'; scene.add(E.root);
  E.hemi = new THREE.HemisphereLight(0xfff4dd, 0x223344, 0.35); scene.add(E.hemi);
  E.glow = new THREE.PointLight(0xff8a2a, 0, 600, 1.6); scene.add(E.glow);
  const prior = ButterSpatialRuntime.frame;
  ButterSpatialRuntime.frame = function (now) { prior(now); try { E.frame(now); } catch (e) { console.error('[odyssey frame]', e); } };
};

/* ── the view: sky, sea, the room hidden, a camera the level owns ── */
E.view = { bg: 0x9fc6e0, room: false, floor: null, grid: false, fog: null };
E.cam = { pos: V3(0, 420, 620), look: V3(0, 40, 0), fov: 38, from: null, t: 1, dur: 0, shake: 0 };
E.setView = function (v) { Object.assign(E.view, v); scene.fog = v.fog ? new THREE.Fog(v.fog[0], v.fog[1], v.fog[2]) : null; };
E.setCamera = function (pos, look, { fov, dur = 0 } = {}) {
  const c = E.cam; c.from = { pos: camera.position.clone(), look: c.look.clone(), fov: camera.fov };
  c.pos = V3(...pos); c.look = V3(...look); if (fov) c.fov = fov; c.dur = dur; c.t = dur ? 0 : 1;
};
E.shake = s => { E.cam.shake = Math.max(E.cam.shake, s); };
let last = 0;
E.frame = function (now) {
  const dtReal = last ? Math.min(0.25, (now - last) / 1000) : 0.016; last = now; E.fps = E.fps ? E.fps * .9 + .1 / Math.max(1e-3, (now - (E._pn || now - 16)) / 1000) : 30; E._pn = now;
  const dt = dtReal * E.timeScale; E.time += dt;
  // the room of the workshop goes; the level's sky and ground stay
  scene.background = new THREE.Color(E.view.bg);
  ROOM.group.visible = !!E.view.room; if (ROOM.video) ROOM.video.visible = false;
  floor.visible = E.view.floor != null; if (E.view.floor != null) { floor.material.color.setHex(E.view.floor); floor.material.opacity = 1; }
  grid.visible = !!E.view.grid;
  if (!E.view.guides) for (const o of ButterSpatialRuntime.plate.children) if (o.isLine || o.isLineSegments || o === hoverBox) o.visible = false;
  // the camera
  const c = E.cam; if (c.t < 1) c.t = Math.min(1, c.t + dtReal / Math.max(0.01, c.dur));
  const u = smooth(c.t), f = c.from || { pos: c.pos, look: c.look, fov: c.fov };
  camera.position.lerpVectors(f.pos, c.pos, u); const look = f.look.clone().lerp(c.look, u);
  if (c.shake > 0.01) { camera.position.x += (Math.random() - .5) * c.shake * 14; camera.position.y += (Math.random() - .5) * c.shake * 10; c.shake *= Math.exp(-dtReal * 5); } else c.shake = 0;
  camera.up.set(0, 1, 0); camera.lookAt(look); const fov = lerp(f.fov, c.fov, u); if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.updateMatrixWorld(true);
  for (const a of E.actors) E.poseActor(a, dt, now);
  for (const fn of E.tickers) fn(dt, now);
  if (OG.G) OG.G.frame(dt, dtReal, now);
};

/* ── projection: plate/world points to stage fractions and back ── */
E.stageRect = () => $('#stage').getBoundingClientRect();
E.toScreen = function (p) { const v = (p.isVector3 ? p : V3(...p)).clone().project(camera), r = E.stageRect(); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, px: (v.x + 1) * r.width / 2, py: (1 - v.y) * r.height / 2, behind: v.z > 1 }; };
/** the point on the horizontal plane y=h under a stage fraction (x,y) */
E.floorAt = function (sx, sy, h = 0) { const ray = new THREE.Raycaster(); ray.setFromCamera({ x: sx * 2 - 1, y: 1 - sy * 2 }, camera); const pl = new THREE.Plane(V3(0, 1, 0), -h), out = V3(); return ray.ray.intersectPlane(pl, out) ? out : null; };
E.rayAt = function (sx, sy) { const ray = new THREE.Raycaster(); ray.setFromCamera({ x: sx * 2 - 1, y: 1 - sy * 2 }, camera); return ray; };

/* ── props: meshes made of the catalog's brick geometry (not workshop parts: no picking, no physics) ── */
const mats = new Map();
E.mat = function (color, o = {}) { const k = color + JSON.stringify(o); if (!mats.has(k)) { const m = material(color); Object.assign(m, o); if (o.opacity != null) m.transparent = true; mats.set(k, m); } return mats.get(k); };
E.ensureParts = async ids => { for (const id of new Set(ids)) if (!catalog.has(id)) await ButterRepository.load(id); };
/** one brick: part id, LDraw colour, position (LDU, y up = Butter's frame), quarter turns r */
E.brick = function (part, color, x = 0, y = 0, z = 0, r = 0, o = {}) {
  const d = catalog.get(part); if (!d) throw Error('part not in the catalog: ' + part);
  const m = new THREE.Mesh(d.geometry, d.repository && o.vertex ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .35 }) : E.mat(color, o.mat));
  m.position.set(x, y, z); m.rotation.y = r * Math.PI / 2; m.castShadow = o.shadow !== false; m.receiveShadow = true; return m;
};
/** a group of bricks from rows [{part,color,x,y,z,r}] (the Butter scene rows of the forage cards) */
E.bricks = function (rows, o = {}) { const g = new THREE.Group(); for (const p of rows) { const m = E.brick(p.part, p.color, p.x, p.y, p.z, p.r || 0, o); if (p.q) m.quaternion.set(...p.q); g.add(m); } return g; };
E.add = (o, parent) => { (parent || E.root).add(o); return o; };
/** a forage card (odyssey/butter/<id>.json): its rows, optionally moved/turned/filtered */
E.card = async function (id) { const r = await fetch('../odyssey/butter/' + id + '.json'); if (!r.ok) throw Error('card missing: ' + id); return (await r.json()).parts; };
E.place = function (rows, { dx = 0, dy = 0, dz = 0, turn = 0, prefix = 'c', only } = {}) {
  const c = Math.round(Math.cos(turn * Math.PI / 2)), s = Math.round(Math.sin(turn * Math.PI / 2));
  return rows.filter(p => !only || only.includes(p.part)).map((p, i) => ({ ...p, id: prefix + i, x: c * p.x + s * p.z + dx, z: -s * p.x + c * p.z + dz, y: p.y + dy, r: ((p.r || 0) + turn) % 4, ...(p.q ? { q: undefined } : {}) }));
};
/** big flat things drawn plainly: the sea, a sand bar, a sky dome */
E.plane = function (w, d, color, { y = 0, x = 0, z = 0, opacity, emissive } = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: .8, transparent: opacity != null, opacity: opacity ?? 1, emissive: emissive || 0 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; return m; };
/** the sea as a studded blue baseplate stretched to the horizon; its texture scrolls for sailing levels */
E.sea = function ({ color = '#1f5f8f', size = 5000, y = -1, studs = true } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 128, 128);
  if (studs) { g.fillStyle = 'rgba(255,255,255,.10)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(16 + i * 32, 16 + j * 32, 9, 0, 7); g.fill(); } g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(18 + i * 32, 18 + j * 32, 9, 0, 3.4); g.fill(); } }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(size / 80, size / 80); tex.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: tex, roughness: .55, metalness: .05 })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; m.userData.tex = tex; return m;
};
/** a whole scene card as scenery: every row of odyssey/butter/<id>.json drawn with Hand Butter's part geometry (catalog, or
    fetched through ButterRepository), one InstancedMesh per (part, colour) so a 1200-piece set is a few dozen draws; parts the
    repository cannot give are left out and counted. Not workshop parts: no picking, no physics — the set of a cinematic. */
E.ensurePartsSoft = async function (ids, { budget = 1e9 } = {}) { const miss = [], t0 = performance.now(); const want = [...new Set(ids)].filter(id => !catalog.has(id));
  const queue = want.slice(); const worker = async () => { while (queue.length) { const id = queue.shift(); if (performance.now() - t0 > budget) { miss.push(id); continue; } try { await ButterRepository.load(id); } catch (e) { miss.push(id); } } };
  await Promise.all([worker(), worker(), worker(), worker()]); return miss; };
E.cardGroup = async function (id, { budget, only } = {}) {
  let rows = await E.card(id); if (only) rows = rows.filter(only);
  const miss = new Set(await E.ensurePartsSoft(rows.map(p => p.part), { budget }));
  const groups = new Map(), g = new THREE.Group(); g.name = 'card:' + id; let n = 0;
  for (const p of rows) { if (miss.has(p.part) || !catalog.has(p.part)) continue; const k = p.part + '|' + p.color; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); n++; }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = V3(1, 1, 1);
  for (const [k, list] of groups) { const d = catalog.get(list[0].part), mesh = new THREE.InstancedMesh(d.geometry, E.mat(list[0].color), list.length);
    list.forEach((p, i) => { if (p.q) q.set(...p.q); else q.setFromAxisAngle(V3(0, 1, 0), (p.r || 0) * Math.PI / 2); m4.compose(V3(p.x, p.y, p.z), q, one); mesh.setMatrixAt(i, m4); });
    mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = !E.lite; mesh.receiveShadow = true; mesh.userData.part = list[0].part; g.add(mesh); }
  g.userData = { rows, drawn: n, missing: [...miss], heads: rows.filter(p => /^3626/.test(p.part)) };
  return g;
};
/** a small burst of 1x1 plates from a point: the answer to a touch */
E.burst = function (at, { n = 14, colors = [14, 25, 4, 15, 1] } = {}) {
  const parts = []; for (let i = 0; i < n; i++) { const m = E.brick(catalog.has('3024') ? '3024' : '3005', colors[i % colors.length], at.x, at.y + 10, at.z, 0, { shadow: false }); const a = Math.random() * 6.28, sp = 60 + Math.random() * 90; m.userData.v = V3(Math.cos(a) * sp, 140 + Math.random() * 120, Math.sin(a) * sp); E.add(m); parts.push(m); }
  let life = 0; const tick = dt => { life += dt; for (const m of parts) { m.userData.v.y -= 420 * dt; m.position.addScaledVector(m.userData.v, dt); m.rotation.x += dt * 5; m.rotation.z += dt * 3; } if (life > 1.6) { parts.forEach(m => m.parent && m.parent.remove(m)); E.tickers.delete(tick); } }; E.tickers.add(tick);
};
/** the workshop emptied: no parts, no bonds (a cinematic or a card between levels) */
E.clearParts = function () { if (S.tx) finish(false); if (S.parts.length) { restore([]); S.history.length = 0; } PH.pinned = new Set(); };
E.clearProps = function () { for (const o of [...E.root.children]) { E.root.remove(o); } E.tickers.clear(); E.glow.intensity = 0; E.hemi.intensity = 0.35; };

/* ── the stage set as Hand Butter parts: ButterScenes.load; every part pinned (static) until a hand frees it ── */
E.stage = async function (rows, { free = [] } = {}) {
  await E.ensureParts(rows.map(p => p.part));
  if (S.tx) finish(false);
  await ButterScenes.load({ version: 1, parts: rows.map(p => ({ id: p.id, part: p.part, color: p.color, x: p.x, y: p.y, z: p.z, r: p.r || 0 })), actors: [], plateAngle: 0 }, { history: false });
  PH.pinned = new Set(rows.map(p => p.id).filter(id => !free.includes(id))); markPhysics(); S.history.length = 0; choose(null, false);
  return S.parts.length;
};
E.rid = 0; E.row = (part, color, x, y, z, r = 0) => ({ id: 's' + (E.rid++), part, color, x, y, z, r });
E.part = id => S.parts.find(p => p.id === id);
E.partCenter = id => { const p = E.part(id); return p ? bounds(p).getCenter(V3()) : null; };
E.movePart = function (id, x, y, z, r) { const p = E.part(id); if (!p) return; p.x = x; p.y = y; p.z = z; if (r != null) { p.r = r; delete p.q; } sync(p); const b = PH.bodies.get(id); if (b) { poseToBody(p, b); b.velocity.setZero(); b.angularVelocity.setZero(); } };
E.pin = (id, on = true) => { if (!PH.pinned) PH.pinned = new Set(); if (on) PH.pinned.add(id); else PH.pinned.delete(id); markPhysics(); };
E.bonded = (a, b) => PH.links.has([a, b].sort().join('|'));
E.bondsOf = id => [...PH.links.keys()].filter(k => k.split('|').includes(id)).map(k => k.split('|').find(x => x !== id));

/* ── the carry: a pinch picks a workshop part, the hand moves it over the floor, opening releases it.
   The move is Butter's transaction: begin → propose (its stud magnet captures within 30 LDU) → finish(true), which audits
   the seated stud contacts with Beaver's exact handshake and bonds them. Source 'game': no throw, no hand-safety takeover. ── */
const carry = E.carry = { id: null, grab: null, lift: 10, hover: 0, clicks: 0, misses: 0 };
E.grab = function (id, sx, sy) {
  if (S.tx || !E.part(id)) return false; choose(id, false); if (!begin('game')) return false;
  S.tx.noThrow = true; S.tx.plane = 'xyz'; const b = bounds(E.part(id)); carry.id = id; carry.baseY = b.min.y;
  carry.grab = E.floorAt(sx, sy, b.max.y) || b.getCenter(V3()); carry.offset = b.getCenter(V3()).sub(carry.grab); carry.offset.y = 0;
  feedback('grab'); return true;
};
/** move the carried part so it follows the stage point, hovering `lift` above whatever lies under it (so the magnet can seat it) */
E.carryTo = function (sx, sy) { if (!S.tx || carry.id == null) return null; const at = E.floorAt(sx, sy, carry.baseY + 12) || carry.grab; return E.carryAt(at.x + carry.offset.x, at.z + carry.offset.z); };
/** carry the held part so its centre stands over (x, z) */
E.carryAt = function (x, z) {
  if (!S.tx || carry.id == null) return null; const p = E.part(carry.id); const at = { x: x - carry.offset.x, z: z - carry.offset.z }; const bb = bounds(p), size = bb.getSize(V3());
  const cx = clamp(at.x + carry.offset.x, -390 + size.x / 2, 390 - size.x / 2), cz = clamp(at.z + carry.offset.z, -390 + size.z / 2, 390 - size.z / 2);
  // what is under the footprint: the highest top among other parts
  let support = 0; const foot = new THREE.Box3(V3(cx - size.x / 2 + 1, -1, cz - size.z / 2 + 1), V3(cx + size.x / 2 - 1, 800, cz + size.z / 2 - 1));
  for (const q of S.parts) { if (S.selected.has(q.id)) continue; const b = bounds(q); if (b.intersectsBox(foot)) support = Math.max(support, b.max.y); }
  const origin = S.tx.origin, base = S.tx.base[0], dx = cx - (origin.x), dz = cz - (origin.z), dy = support + carry.lift - origin.y;
  propose(V3(dx, dy, dz)); carry.support = support; return S.tx && S.tx.magnet ? 'snap' : 'held';
};
E.drop = function () {
  if (!S.tx || carry.id == null) return null; const id = carry.id; carry.id = null;
  const snapped = !!S.tx.magnet; if (!snapped) { // lower it onto what is under it
    const p = E.part(id), b = bounds(p), dy = (carry.support || 0) - b.min.y; propose(S.tx.rawDelta.clone().add(V3(0, dy, 0))); }
  finish(true); const bonds = E.bondsOf(id); if (bonds.length) { carry.clicks++; E.pin(id, true); } else carry.misses++;   // a seated part stands with the set (static), as a scene's parts do
  choose(null, false); return { id, snapped, bonds };
};
E.cancelCarry = () => { if (S.tx) finish(false); carry.id = null; choose(null, false); };

/* ── actors: minifig rigs built by Hand Butter's performer path, faces from the halfworld where the twelve have one ── */
const HW_FACES = ['odysseus', 'athena', 'penelope', 'telemachus', 'nestor', 'eumaeus', 'circe', 'nausicaa', 'helen', 'eurycleia', 'alcinous', 'polyphemus'];
E.actor = async function (o) {
  const def = { name: o.name || 'Figure', legs: 1, hips: 1, torso: 4, arms: 4, hands: 14, head: 14, hat: ['3901', 0], weapon: null, cape: null, collar: null, ...o.def };
  if (o.printed) def.parts = [['legR', '3816', def.legs], ['legL', '3817', def.legs], ['hips', '3815', def.hips], ['torso', '973', def.torso], ['armR', '3818', def.arms], ['armL', '3819', def.arms], ['handR', '3820', def.hands], ['handL', '3820', def.hands], ['head', o.printed, def.head], ...(def.hat ? [['hat', def.hat[0], def.hat[1]]] : []), ...(def.weapon ? [['weaponR', def.weapon[1], def.weapon[2]]] : []), ...(def.cape ? [['cape', def.cape[0], def.cape[1]]] : [])];
  const rig = await ButterPerformer.makeActor(def);
  rig.figure.scale.setScalar(o.scale || 1.0); rig.pos.set(o.at ? o.at[0] : 0, o.at && o.at.length > 2 ? o.at[1] : 0, o.at ? o.at[o.at.length - 1] : 0); rig.heading = o.heading || 0; rig.figure.rotation.y = rig.heading;
  const a = { name: o.name, rig, who: o.face, face: null, emotion: o.emotion || null, mouth: 0, gait: 0, phase: Math.random() * 6, target: null, speed: o.speed || 70, blinkAt: 2 + Math.random() * 3, arms: null, extra: o.extra, lastPaint: 0, visible: true };
  if (o.face && HW_FACES.includes(o.face) && window.Face && window.HalfFace) { try { a.face = Face.attach(rig, 'halfworld:' + o.face, THREE); } catch (e) { console.warn('[face]', e); } }
  E.actors.push(a); return a;
};
E.removeActors = function () { for (const a of E.actors) { a.rig.figure.parent && a.rig.figure.parent.remove(a.rig.figure); if (a.face) try { Face.detach(a.face); } catch (e) { } } E.actors.length = 0; };
E.walkTo = (a, x, z, speed) => { a.target = V3(x, a.rig.pos.y, z); if (speed) a.speed = speed; };
E.poseActor = function (a, dt, now) {
  const rig = a.rig; rig.figure.visible = a.visible;
  let gait = 0;
  if (a.target) { const d = V3(a.target.x - rig.pos.x, 0, a.target.z - rig.pos.z), L = d.length(); if (L < 2) a.target = null; else { rig.heading = Math.atan2(d.x, d.z); rig.pos.addScaledVector(d.normalize(), Math.min(L, a.speed * dt)); gait = 1; } }
  if (a.fly != null) { rig.pos.y = a.fly; }
  a.gait += ((a.forceGait ?? gait) - a.gait) * (1 - Math.exp(-dt * 8)); a.phase += dt * 8 * a.gait;
  let d = a.heading != null ? a.heading - rig.figure.rotation.y : rig.heading - rig.figure.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); rig.figure.rotation.y += d * (1 - Math.exp(-dt * 10));
  Minifig.pose(rig, { phase: a.phase, gait: a.gait, t: now / 1000, sit: !!a.sit });
  if (a.arms) { rig.armRP.rotation.x = a.arms[0]; rig.armLP.rotation.x = a.arms[1]; }
  if (a.face && now - a.lastPaint > 90) {
    a.lastPaint = now; const v = {}; const E0 = a.emotion && HalfFace.EMOTIONS[a.emotion];
    if (E0) for (const [k, ch] of Face.HW_MAP) if (E0[k]) v[ch] = E0[k];
    const t = now / 1000; if (t > a.blinkAt) { v.blink = 1; if (t > a.blinkAt + .14) a.blinkAt = t + 2.5 + Math.random() * 3; }
    const m = a.speaking ? (OG.A ? OG.A.level() : 0) : 0; a.mouth += (m - a.mouth) * .6; if (a.mouth > .04) { v['mouth.jaw'] = Math.round(Math.min(1, a.mouth * 1.4) * 10) / 10; v['mouth.wide'] = .2; }
    Face.paint(a.face, v);
  }
};
})();
