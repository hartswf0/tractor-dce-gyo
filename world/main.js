/* world/main.js — the world: a place on Earth (or a planet laid over it), its city in bricks,
   a minifig on foot, the crowd, the TIE to board. One parse, one loop, two modes. */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const M = 40;                                                  // LDU per metre: minifig scale, 1:40
const Q = new URLSearchParams(location.search);
const HLIDARENDI = { lat: 63.7422, lon: -20.108, name: 'Hlíðarendi, Iceland', baked: true };
const GROUND_SPAN = 2700, DETAIL_SPAN = 900, RELAND_AT = 300, DETONATORS = 6;
const UP = new THREE.Vector3(0, 1, 0), V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), E1 = new THREE.Euler();

const W = {
  engine: null, scene: null, camera: null, renderer: null, loader: null,
  place: null, P: null, G: null, city: null, rig: null, tie: null, ship: null, geoms: null, raw: null, debris: null, crowd: null, bolts: null,
  mode: 'walk', t: 0, last: 0, ready: false, colours: null, character: Q.get('as') || 'vader', world: Q.get('world') || 'earth',
  net: { elevation: null, imagery: null, osm: null }, relanding: false, health: 100, dead: 0, dets: DETONATORS, grenades: [], shake: 0,
  input: { L: { x: 0, y: 0, mag: 0 }, look: { dx: 0, dy: 0 }, run: false, saber: false, fly: { x: 0, y: 0, mag: 0 }, boost: false, fire: false, push: false, torpedo: false },
  stats: { calls: 0 },
};
window.__world = W;
if (!Minifig.DEFS[W.character]) W.character = 'vader';
if (!Worlds.PRESETS[W.world]) W.world = 'earth';

/* ───────────────────────── veil, menu, HUD ───────────────────────── */
function stage(name, state, note) { const li = $(`#stages li[data-s="${name}"]`); if (li) { li.classList.remove('now', 'done'); li.classList.add(state); } if (note !== undefined) $('#vm').textContent = note; }
function stall(msg) { $('#vm').innerHTML = msg + '<br><button onclick="location.reload()">Retry</button>'; }
function toast(text, ms = 1200) { const m = $('#msg'); m.textContent = text; m.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => m.classList.remove('on'), ms); }
function flash() { const f = $('#flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 100); }
function buildMenu() {
  const chars = Object.entries(Minifig.DEFS).map(([k, d]) => `<button data-as="${k}" class="${k === W.character ? 'on' : ''}">${d.name}</button>`).join('');
  const worlds = Object.entries(Worlds.PRESETS).map(([k, p]) => `<button data-world="${k}" class="${k === W.world ? 'on' : ''}">${p.name}</button>`).join('');
  $('#menu').innerHTML = `<div class="row"><span>play as</span>${chars}</div><div class="row"><span>world</span>${worlds}</div>`;
  $('#menu').querySelectorAll('[data-as]').forEach(b => b.onclick = () => setCharacter(b.dataset.as));
  $('#menu').querySelectorAll('[data-world]').forEach(b => b.onclick = () => setWorld(b.dataset.world));
}
function markMenu() { $('#menu').querySelectorAll('[data-as]').forEach(b => b.classList.toggle('on', b.dataset.as === W.character)); $('#menu').querySelectorAll('[data-world]').forEach(b => b.classList.toggle('on', b.dataset.world === W.world)); }

/* ───────────────────────── the place and its window ───────────────────────── */
async function resolvePlace() {
  const at = Q.get('at'); if (at) { const c = Geo.parseCoordinates(at); if (c) return { ...c, name: Q.get('name') || c.name }; }
  const name = Q.get('place'); if (name) { stage('place', 'now', 'looking up ' + name); const g = await Geo.geocode(name); if (g) return g; }
  if (!Q.has('noloc')) { stage('place', 'now', 'asking where you are'); const here = await Geo.locate(8000); if (here) return here; }
  return HLIDARENDI;
}
async function loadWindow(place) {
  const P = Geo.proj(place.lat, place.lon), out = { place, P };
  stage('ground', 'now', 'fetching the ground');
  let field = null;
  if (!place.baked) { const f = await Geo.fetchElevation({ lat: place.lat, lon: place.lon, spanM: GROUND_SPAN }); if (f.ok) field = Ground.centredField(f); W.net.elevation = f.ok; }
  if (!field) { field = Ground.bakedField(); out.baked = true; if (!place.baked) out.place = { ...HLIDARENDI, name: place.name + ' → offline, so ' + HLIDARENDI.name }; }
  out.field = field; stage('ground', 'done');
  const wantImg = !out.baked && Worlds.PRESETS[W.world].imagery;
  const im = wantImg ? (stage('imagery', 'now', 'fetching the aerial imagery'), await Geo.fetchImagery({ lat: place.lat, lon: place.lon, spanM: DETAIL_SPAN * 1.4, P, maxZoom: 16 })) : { ok: false };
  out.imagery = im.ok ? im : null; W.net.imagery = im.ok; stage('imagery', 'done', im.ok ? '' : wantImg ? 'no imagery: moss it is' : '');
  stage('buildings', 'now', 'fetching the buildings');
  const osm = out.baked ? { ok: false } : await Geo.fetchOSM({ lat: place.lat, lon: place.lon, spanM: DETAIL_SPAN, P });
  if (osm.ok) { out.buildings = osm.buildings; out.roads = osm.roads; } else { const v = Bricks.village(); out.buildings = v.buildings; out.roads = v.roads; out.village = true; }
  W.net.osm = osm.ok; stage('buildings', 'done', `${out.buildings.length} buildings, ${out.roads.length} roads`);
  return out;
}
function installWindow(win) {
  const scene = W.scene, preset = Worlds.PRESETS[W.world];
  if (W.G) { scene.remove(W.G.mesh); W.G.mesh.geometry.dispose(); if (W.G.roads) { scene.remove(W.G.roads); W.G.roads.geometry.dispose(); } }
  const G = Ground.make(win.field, M, preset.paint); scene.add(G.mesh);
  if (win.imagery && preset.imagery) Ground.drape(G, win.imagery);
  const roads = Ground.roads(G, win.roads, M); if (roads) scene.add(roads);
  W.G = G; W.P = win.P; W.place = win.place; W.win = win;
  $('#place').textContent = win.place.name + (win.village ? ' · village' : '');
  if (W.city) { W.city.groundM = G.hM; W.city.set(win.buildings); }
  if (W.debris) W.debris.clear();
  if (W.crowd) { W.crowd.setRoads(win.roads); }
}
function spawnPoint(win) {
  let best = null, bd = 250;
  for (const r of win.roads) for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / 5)); for (let k = 0; k <= n; k++) { const p = { x: a.x + (b.x - a.x) * k / n, z: a.z + (b.z - a.z) * k / n }, d = Math.hypot(p.x, p.z); if (d < bd) { bd = d; best = p; } } }
  const p = best ? { x: best.x, z: best.z } : { x: 0, z: 0 };
  for (let k = 0; k < 8; k++) { const b = win.buildings.find(b => Bricks.pointInRing(p.x, p.z, b.ring)); if (!b) break; p.x += 6; p.z += 4; }
  return p;
}

/* ───────────────────────── the one parse ───────────────────────── */
async function loadModels(engine) {
  const [path, pack] = await Promise.all([fetch('./assembly-paths/VADER-TIE.json').then(r => r.json()), fetch('./assembly-paths/WORLD-full.mpd.txt').then(r => r.ok ? r.text() : '')]);
  const ship = path.lines.slice(0, 108), figParts = Minifig.harvestLines();
  const text = ['0 FILE world.ldr', '0 !LDRAW_ORG Unofficial_Model', ...ship, ...figParts, Bricks.lines()].join('\n') + '\n\n' + Bricks.CUSTOM + '\n' + pack;
  engine.loader.separateObjects = true;
  const root = await engine.loadText(text, { name: 'world' }, 'world.mpd');
  const want = 108 + figParts.length + Bricks.HARVEST.length;
  if (root.children.length !== want) throw new Error(`expected ${want} part groups, got ${root.children.length}`);
  return { root, ship: root.children.slice(0, 108), fig: root.children.slice(108, 108 + figParts.length), harvest: root.children.slice(108 + figParts.length) };
}
/** Raw part geometries (part-local, one material) for the figures and the debris. */
function harvestRaw(groups) {
  const out = new Map();
  groups.forEach((grp, i) => { let mesh = null; grp.traverse(o => { if (!mesh && o.isMesh) mesh = o; }); if (!mesh) return; const g = mesh.geometry.clone(); g.clearGroups(); g.computeBoundingBox(); g.computeBoundingSphere(); out.set(Minifig.CROWD_PARTS[i], g); });
  return out;
}
/** The player's figure: meshes from raw geometry in the definition's colours, hung on a fresh skeleton. */
function makePlayer(name) {
  const def = Minifig.DEFS[name], rig = Minifig.skeleton(M), parts = Minifig.partsOf(def);
  const groups = parts.map(([slot, part, col]) => {
    const g = new THREE.Group(), geom = W.raw.get(part); if (!geom) return g;
    const c = W.colours(col), trans = col === 36 || col === 33;
    const mat = new THREE.MeshStandardMaterial({ color: c, roughness: .45, metalness: 0, transparent: trans, opacity: trans ? .75 : 1, emissive: trans ? c : 0x000000, emissiveIntensity: trans ? .8 : 0 });
    g.add(new THREE.Mesh(geom, mat)); return g;
  });
  Minifig.mount(rig, groups, def, W.scene);
  return rig;
}
function setCharacter(name) {
  if (!Minifig.DEFS[name]) return; W.character = name; markMenu();
  if (!W.raw) return;
  const old = W.rig; const rig = makePlayer(name);
  if (old) { rig.pos.copy(old.pos); rig.heading = old.heading; rig.cam = old.cam; rig.figure.rotation.y = old.heading; rig.figure.visible = old.figure.visible; W.scene.remove(old.figure); }
  W.rig = rig; $('#mode').textContent = (W.mode === 'walk' ? 'walk · ' : 'fly · ') + (W.mode === 'walk' ? Minifig.DEFS[name].name : 'TIE'); hintFor();
}
function hintFor() {
  const d = Minifig.DEFS[W.character];
  $('#hint').textContent = W.mode === 'fly' ? 'drag anywhere to carve · second finger boosts · tap right fires · hold right for a torpedo'
    : `left thumb walks · right thumb looks · tap right ${d.saber ? 'swings the saber' : d.weapon ? 'fires' : 'shoves'} · two fingers: Force push`;
}
function setWorld(name) {
  if (!Worlds.PRESETS[name]) return; W.world = name; markMenu();
  if (!W.G) return;
  const p = Worlds.apply(name, { scene: W.scene, G: W.G, city: W.city, lights: Ground.daylight.lights });
  if (p.imagery && W.win && W.win.imagery) Ground.drape(W.G, W.win.imagery); else Ground.recolour(W.G, p.paint);
  document.body.dataset.world = name; toast(p.name, 900);
  if (p.imagery && W.win && !W.win.imagery && !W.win.baked && !W.win.imageryTried) lateImagery(W.win);
}
/** Earth chosen after starting on another planet: fetch the aerial imagery now and drape it if we are still on Earth. */
async function lateImagery(win) {
  win.imageryTried = true; const place = win.place;
  const im = await Geo.fetchImagery({ lat: place.lat, lon: place.lon, spanM: DETAIL_SPAN * 1.4, P: win.P, maxZoom: 16 }).catch(() => ({ ok: false }));
  W.net.imagery = im.ok; if (!im.ok) return; win.imagery = im;
  if (W.win === win && Worlds.PRESETS[W.world].imagery) Ground.drape(W.G, win.imagery);
}

/* ───────────────────────── input ───────────────────────── */
const PT = new Map(); let primary = null, lookId = null;
function bindInput() {
  const stage = $('#stage'), ind = $('#stick'), nub = ind.querySelector('i');
  const showStick = (x, y, dx, dy) => { ind.style.left = x + 'px'; ind.style.top = y + 'px'; nub.style.transform = `translate(${dx}px,${dy}px)`; ind.classList.add('on'); };
  const stickFrom = (dx, dy) => { const R = clamp(Math.min(innerWidth, innerHeight) * .155, 72, 118); let m = Math.hypot(dx, dy) / R; if (m > 1) { dx /= m; dy /= m; m = 1; } if (m < 0.07) return { x: 0, y: 0, mag: 0 }; const sh = m * m; return { x: dx / R / m * sh, y: -dy / R / m * sh, mag: m }; };
  stage.addEventListener('pointerdown', e => {
    if (e.target.tagName !== 'CANVAS' || !W.ready) return; e.preventDefault(); stage.setPointerCapture(e.pointerId);
    const p = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0, multi: false, left: e.clientX < innerWidth * .5 };
    PT.set(p.id, p);
    if (PT.size >= 2) { for (const q of PT.values()) q.multi = true; W.multiAt = performance.now(); }
    if (W.mode === 'fly') { if (!primary) { primary = p; showStick(p.x, p.y, 0, 0); } }
    else if (p.left && !primary) { primary = p; showStick(p.x, p.y, 0, 0); }
    else if (!p.left && lookId == null) { lookId = p.id; p.holdTimer = setTimeout(() => { if (PT.has(p.id) && p.moved < 16) W.input.runTouch = true; }, 260); }
  }, { passive: false });
  stage.addEventListener('pointermove', e => {
    const p = PT.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; p.moved = Math.max(p.moved, Math.hypot(p.x - p.x0, p.y - p.y0));
    if (p === primary) { const s = stickFrom(p.x - p.x0, p.y - p.y0), tgt = W.mode === 'fly' ? W.input.fly : W.input.L; tgt.x = s.x; tgt.y = s.y; tgt.mag = s.mag; const L = Math.hypot(p.x - p.x0, p.y - p.y0), k = L > 58 ? 58 / L : 1; showStick(p.x0, p.y0, (p.x - p.x0) * k, (p.y - p.y0) * k); }
    else if (p.id === lookId && W.mode === 'walk') { W.input.look.dx += dx * 0.0045; W.input.look.dy += dy * 0.0035; }
  });
  const end = e => {
    const p = PT.get(e.pointerId); if (!p) return; PT.delete(e.pointerId);
    const age = performance.now() - p.t0, tap = !p.multi && p.moved < 14 && age < 450, hold = !p.multi && p.moved < 14 && age >= 350;
    W.lastTap = { tap, hold, age: Math.round(age), moved: Math.round(p.moved), multi: p.multi, left: p.left, mode: W.mode };
    if (p === primary) { primary = null; ind.classList.remove('on'); const tgt = W.mode === 'fly' ? W.input.fly : W.input.L; tgt.x = tgt.y = tgt.mag = 0; const next = [...PT.values()].find(q => W.mode === 'fly' || q.left); if (next) { primary = next; next.x0 = next.x; next.y0 = next.y; showStick(next.x, next.y, 0, 0); } }
    if (p.id === lookId) lookId = null;
    if (p.multi && PT.size === 0 && p.moved < 20 && performance.now() - W.multiAt < 450 && W.mode === 'walk') W.input.push = true;   // two-finger tap: the Force
    if (W.mode === 'fly') { if (!p.left && !p.multi && p.moved < 14) { if (hold) W.input.torpedo = true; else if (tap) W.input.fireOnce = true; } }
    else if (tap && !p.left) W.input.saber = true;
    if (W.mode === 'walk' && !p.left) W.input.runTouch = false;
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end); window.addEventListener('pointerup', end);
  window.addEventListener('keydown', e => { if (/INPUT|TEXTAREA/.test(e.target.tagName)) return; W.keys.add(e.code); if (e.code === 'Space') { if (W.mode === 'walk') W.input.saber = true; e.preventDefault(); } if (e.code === 'KeyE') promptAction(); if (e.code === 'KeyF') W.input.push = true; if (e.code === 'KeyG') throwDetonator(); if (e.code === 'KeyT' && W.mode === 'fly') W.input.torpedo = true; });
  window.addEventListener('keyup', e => W.keys.delete(e.code));
  window.addEventListener('blur', () => W.keys.clear());
  $('#prompt').addEventListener('click', promptAction);
  $('#det').addEventListener('click', throwDetonator);
  $('#menuBtn').addEventListener('click', () => $('#menu').classList.toggle('open'));
  $('#go').addEventListener('click', () => { const f = $('#find'); if (!f.classList.contains('open')) { f.classList.add('open'); $('#q').focus(); return; } const q = $('#q').value.trim(); if (q) goAnywhere(q); else f.classList.remove('open'); });
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { const q = $('#q').value.trim(); if (q) goAnywhere(q); } });
  W.keys = new Set();
}
function readKeys() {
  const k = W.keys, x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0), y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
  const tgt = W.mode === 'fly' ? W.input.fly : W.input.L;
  if (!primary && (x || y)) { const h = Math.hypot(x, y); tgt.x = x / h; tgt.y = y / h; tgt.mag = Math.min(1, h); } else if (!primary && !tgt.held) { tgt.x = tgt.y = tgt.mag = 0; }
  const shift = k.has('ShiftLeft') || k.has('ShiftRight');
  W.input.boost = W.mode === 'fly' && (shift || PT.size >= 2 || !!W.input.boostHook);
  W.input.run = W.mode === 'walk' && (shift || !!W.input.runTouch || !!W.input.runHook);
  W.input.fire = W.mode === 'fly' && k.has('Space');
}

/* ───────────────────────── collisions shared by everyone on foot ───────────────────────── */
function pushOut(pos, r) {
  for (const b of W.city.near(pos.x, pos.z, r + 2 * M)) pushRing(pos, r, b.ringL, b.y0, b.yTop);
  if (W.mode === 'walk' && W.ship) { const s = W.ship.position; pushRing(pos, r, [{ x: s.x - 170, z: s.z - 85 }, { x: s.x + 170, z: s.z - 85 }, { x: s.x + 170, z: s.z + 85 }, { x: s.x - 170, z: s.z + 85 }], s.y - 200, s.y + 200); }
}
function pushRing(pos, r, ring, y0, y1) {
  if (pos.y + 20 < y0 || pos.y > y1) return;
  const inside = Bricks.pointInRing(pos.x, pos.z, ring);
  let bd = Infinity, bx = 0, bz = 0;
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1; const t = clamp(((pos.x - a.x) * dx + (pos.z - a.z) * dz) / L2, 0, 1), cx = a.x + dx * t, cz = a.z + dz * t, d = Math.hypot(pos.x - cx, pos.z - cz); if (d < bd) { bd = d; bx = cx; bz = cz; } }
  if (bd === Infinity) return;
  if (inside) { const n = Math.hypot(pos.x - bx, pos.z - bz) || 1, ox = (pos.x - bx) / n, oz = (pos.z - bz) / n, cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length; const sgn = (ox * (bx - cx) + oz * (bz - cz)) >= 0 ? 1 : -1; pos.x = bx + ox * sgn * (r + 1); pos.z = bz + oz * sgn * (r + 1); }
  else if (bd < r) { const n = Math.hypot(pos.x - bx, pos.z - bz) || 1; pos.x = bx + (pos.x - bx) / n * r; pos.z = bz + (pos.z - bz) / n * r; }
}
/** Line of sight between two points on foot: no building ring crosses the segment. */
function los(a, b) {
  const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, half = Math.hypot(b.x - a.x, b.z - a.z) / 2;
  for (const bd of W.city.near(mx, mz, half)) { const r = bd.ringL; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; if (segCross(a.x, a.z, b.x, b.z, p.x, p.z, q.x, q.z)) return false; } }
  return true;
}
function segCross(ax, az, bx, bz, cx, cz, dx, dz) { const d1 = (bx - ax) * (cz - az) - (bz - az) * (cx - ax), d2 = (bx - ax) * (dz - az) - (bz - az) * (dx - ax), d3 = (dx - cx) * (az - cz) - (dz - cz) * (ax - cx), d4 = (dx - cx) * (bz - cz) - (dz - cz) * (bx - cx); return d1 * d2 < 0 && d3 * d4 < 0; }
const WORLD = { groundH: (x, z) => W.G.h(x, z), pushOut };

/* ───────────────────────── destruction ───────────────────────── */
function fall(list) { for (const f of list) W.debris.spawn({ part: f.part, matrix: f.matrix, colour: f.colour, vel: f.vel }); return list.length; }
/** A blast: bricks within r fly, the buildings collapse where they lost support, people in reach are thrown. */
function blast(point, r, vel, people = true) {
  const n = fall(W.city.blast(point, r, vel));
  if (people && W.crowd) W.crowd.hitWithin(point, r * 1.1, vel ? vel.clone().multiplyScalar(0.6) : null, W.debris);
  if (people && W.mode === 'walk' && W.rig.figure.visible) { V1.copy(W.rig.pos); V1.y += 1.2 * M; if (V1.distanceTo(point) < r * 0.9 && r > 3 * M) hurt(40); }
  return n;
}
function forcePush() {
  const f = Minifig.facing(W.rig, V1).clone(), base = W.rig.pos.clone(); base.y += 1 * M;
  let n = 0; for (const d of [2, 4, 6]) n += fall(W.city.blast(V2.copy(base).addScaledVector(f, d * M), 2 * M, f.clone().multiplyScalar(9 * M)));
  for (const npc of W.crowd.npcs) { if (!npc.alive) continue; V3.subVectors(npc.pos, W.rig.pos); const d = V3.length() / M; if (d < 7 && V3.normalize().dot(f) > 0.5) W.crowd.burst(npc, f.clone().multiplyScalar(7 * M), W.debris); }
  W.shake = 0.3; toast(n ? 'the Force' : 'nothing there', 600); return n;
}
function throwDetonator() {
  if (W.mode !== 'walk' || W.dets <= 0 || !W.ready) return;
  W.dets--; const f = Minifig.facing(W.rig, V1).clone();
  const g = W.raw.get('3062b'), m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: W.colours(72), roughness: .4 })); m.scale.setScalar(1.2);
  m.position.copy(W.rig.pos).addScaledVector(f, 0.6 * M); m.position.y += 1.5 * M; W.scene.add(m);
  W.grenades.push({ mesh: m, vel: f.multiplyScalar(9 * M).add(V2.set(0, 5 * M, 0)), fuse: 1.6 });
  paint();
}
function stepGrenades(dt) {
  for (let i = W.grenades.length - 1; i >= 0; i--) {
    const g = W.grenades[i]; g.vel.y -= 9.8 * M * dt; g.mesh.position.addScaledVector(g.vel, dt); g.mesh.rotation.x += 6 * dt;
    const gh = W.G.h(g.mesh.position.x, g.mesh.position.z); if (g.mesh.position.y < gh + 6) { g.mesh.position.y = gh + 6; g.vel.y = Math.abs(g.vel.y) * 0.25; g.vel.x *= 0.7; g.vel.z *= 0.7; }
    if ((g.fuse -= dt) <= 0) { W.scene.remove(g.mesh); W.grenades.splice(i, 1); blast(g.mesh.position, 5 * M, null); W.shake = 0.6; flash(); toast('boom', 500); }
  }
}
function hurt(dmg) {
  if (W.mode !== 'walk' || W.dead) return;
  W.health = Math.max(0, W.health - dmg); flash();
  if (W.health <= 0) { W.dead = 3; for (const f of Minifig.burst(W.rig)) W.debris.spawn({ part: f.part, matrix: f.matrix, colour: W.colours(f.col), vel: new THREE.Vector3((Math.random() - .5) * 3 * M, 3 * M, (Math.random() - .5) * 3 * M) }); W.rig.figure.visible = false; toast('down', 1500); }
}
function respawn() {
  W.dead = 0; W.health = 100; W.dets = DETONATORS;
  const s = W.ship.position, side = V1.set(Math.cos(W.tie.yaw), 0, -Math.sin(W.tie.yaw));
  W.rig.pos.set(s.x + side.x * 6 * M, 0, s.z + side.z * 6 * M); pushOut(W.rig.pos, W.rig.radius); W.rig.pos.y = W.G.h(W.rig.pos.x, W.rig.pos.z); W.rig.figure.visible = true; W.rig.cam.set = false;
}

/* ───────────────────────── modes ───────────────────────── */
function nearShip() { if (!W.ship || !W.rig) return Infinity; return Math.hypot(W.ship.position.x - W.rig.pos.x, W.ship.position.z - W.rig.pos.z) / M; }
function promptAction() { if (!W.ready) return; if (W.mode === 'walk' && nearShip() < 6) board(); else if (W.mode === 'fly' && !W.tie.landing) land(); }
function board() {
  if (W.mode !== 'walk' || W.dead) return;
  W.mode = 'fly'; document.body.classList.add('fly'); $('#mode').textContent = 'fly · TIE'; hintFor();
  W.rig.figure.visible = false; Tie.board(W.tie, W.rig.heading); primary = null; W.input.L.mag = 0; W.dets = DETONATORS; toast('TIE', 900);
}
function land() { if (W.mode === 'fly') { Tie.land(W.tie); toast('landing'); } }
function landed() {
  W.mode = 'walk'; document.body.classList.remove('fly'); $('#mode').textContent = 'walk · ' + Minifig.DEFS[W.character].name; hintFor();
  const s = W.ship.position, side = V1.set(Math.cos(W.tie.yaw), 0, -Math.sin(W.tie.yaw));
  W.rig.pos.set(s.x + side.x * 6 * M, 0, s.z + side.z * 6 * M); pushOut(W.rig.pos, W.rig.radius); W.rig.pos.y = W.G.h(W.rig.pos.x, W.rig.pos.z);
  W.rig.figure.visible = true; W.rig.cam.set = false; W.rig.cam.yaw = W.tie.yaw + Math.PI; W.camera.fov = innerHeight > innerWidth ? 55 : 50; W.camera.updateProjectionMatrix();
  primary = null; W.input.fly.mag = 0; toast('landed', 900);
}

/* ───────────────────────── the loop ───────────────────────── */
function tick() { if (!W.ready) return; const now = performance.now(), dt = Math.min(0.1, Math.max(0, (now - W.last) / 1000)); W.last = now; simulate(dt); }
const MOVE = { x: 0, z: 0, mag: 0 };
function simulate(dt) {
  W.t += dt; readKeys();
  const portrait = innerHeight > innerWidth, I = W.input, d = Minifig.DEFS[W.character];
  if (W.mode === 'walk') {
    if (W.dead) { W.dead -= dt; if (W.dead <= 0) respawn(); I.saber = false; I.push = false; }
    else {
      Minifig.moveFromStick(W.rig, I.L, MOVE);
      const wantsShot = I.saber && !d.saber && d.weapon; I.aim = wantsShot || (I.aimHold && d.weapon);
      Minifig.step(W.rig, dt, { move: MOVE, run: I.run, saber: I.saber, aim: I.aim }, WORLD);
      if (wantsShot) { const p = new THREE.Vector3(), dir = new THREE.Vector3(); Minifig.muzzle(W.rig, p, dir); dir.y = -0.05; W.bolts.fire(p, dir, 'player'); }
      I.saber = false;
      if (W.rig.hit) { const h = W.rig.hit; W.rig.hit = null; const n = blast(h, 1.4 * M, Minifig.facing(W.rig, V2).clone().multiplyScalar(3 * M)); if (n) toast('bricks!', 500); }
      if (I.push) { I.push = false; forcePush(); }
    }
    Minifig.camera(W.rig, W.camera, dt, I.look, WORLD, portrait); I.look.dx = I.look.dy = 0;
    const near = nearShip() < 6 && !W.dead; $('#prompt').classList.toggle('on', near); $('#prompt').textContent = 'Board the TIE';
  } else {
    const F = W.tie; F.input.x = I.fly.x; F.input.y = I.fly.y; F.input.mag = I.fly.mag; F.input.boost = I.boost; F.input.fire = I.fire || !!I.fireOnce; I.fireOnce = false; if (I.torpedo) { F.input.torpedo = true; I.torpedo = false; }
    const still = Tie.step(F, dt, p => blast(p, 1.2 * M, F.vel.clone().multiplyScalar(.15)), (p, v) => { blast(p, 6 * M, v.multiplyScalar(0.1)); W.shake = 0.7; flash(); toast('torpedo', 500); });
    Tie.camera(F, W.camera, dt, portrait);
    if (!still) landed();
    else { const alt = (F.pos.y - W.G.h(F.pos.x, F.pos.z)) / M; $('#prompt').classList.toggle('on', !F.landing && alt < 14); $('#prompt').textContent = 'Land'; }
  }
  if (W.shake > 0) { W.shake -= dt; W.camera.position.x += (Math.random() - .5) * W.shake * 12; W.camera.position.y += (Math.random() - .5) * W.shake * 12; }
  W.bolts.step(dt, {
    hitPlayer: b => { if (W.mode === 'walk') { if (W.dead) return false; V1.copy(W.rig.pos); V1.y += 1.3 * M; if (Characters.segHitsSphere(b.prev, b.mesh.position, V1, 0.8 * M)) { hurt(20); return true; } return false; } if (Characters.segHitsSphere(b.prev, b.mesh.position, W.tie.pos, Tie.PLAYER_R * 0.8)) { W.tie.shields = Math.max(0, W.tie.shields - 5); flash(); return true; } return false; },
    hitNpc: b => W.crowd.hitBy(b, W.debris),
    hitWorld: b => { const p = b.mesh.position; for (const box of W.city.aabbs(p.x, p.z, 60)) if (p.x > box.min.x - 6 && p.x < box.max.x + 6 && p.z > box.min.z - 6 && p.z < box.max.z + 6 && p.y > box.min.y && p.y < box.max.y) { fall(W.city.blast(p, 0.8 * M, b.vel.clone().multiplyScalar(0.05), 3)); return true; } return false; },
  });
  fall(W.city.tick(dt));
  W.debris.step(dt); stepGrenades(dt);
  W.crowd.step(dt, { player: { pos: W.rig.pos, alive: W.mode === 'walk' && !W.dead, running: W.input.run && W.rig.speed > 3 * M, vel: W.rig.vel }, tie: { pos: W.tie.pos, flying: W.mode === 'fly' }, bolts: W.bolts, debris: W.debris, los, pushOut });
  W.city.update(W.camera, W.mode === 'walk' ? W.rig.pos : W.tie.pos);
  if ((W.hudAcc = (W.hudAcc || 0) + dt) > 0.1) { W.hudAcc = 0; paint(); }
  if ((W.landAcc = (W.landAcc || 0) + dt) > 1) { W.landAcc = 0; maybeReland(); }
}
function paint() {
  const st = W.city.stats(), cs = W.crowd.stats();
  if (W.mode === 'walk') { $('#stat').textContent = `${st.buildings} buildings · ${cs.alive} people\n${Math.round(W.rig.speed / M * 3.6)} km/h · ${W.dets} detonators`; $('#shieldFill').style.width = W.health + '%'; $('#shield').classList.toggle('low', W.health < 40); $('#det').classList.toggle('on', W.dets > 0 && !W.dead); }
  else { const F = W.tie, alt = Math.round((F.pos.y - W.G.h(F.pos.x, F.pos.z)) / M); $('#stat').textContent = `${alt} m up · ${Math.round(F.speed / M * 3.6)} km/h${F.input.boost ? ' · boost' : ''}\n${F.t < F.impact.until ? F.impact.text : F.slide > .35 ? 'VADER SLIDE' : ''}`; $('#shieldFill').style.width = F.shields + '%'; $('#shield').classList.toggle('low', F.shields < 40); $('#det').classList.remove('on'); if (F.t < F.impact.until && F.impact.text !== W.lastImpact) { W.lastImpact = F.impact.text; toast(F.impact.text.split(' · ')[0], 700); } }
  if (W.mode === 'fly' && W.tie.shields <= 0 && !W.tie.landing) { W.tie.shields = Tie.SHIELD_MAX; toast('shields gone: setting down'); Tie.land(W.tie); }
}

/* ───────────────────────── play anywhere ───────────────────────── */
async function maybeReland() {
  if (W.relanding || !W.win || W.win.baked || !W.net.elevation) return;
  const p = W.mode === 'walk' ? W.rig.pos : W.tie.pos; if (Math.hypot(p.x, p.z) / M < RELAND_AT) return;
  const g = W.P.toWGS(p.x / M, p.z / M); await reland({ lat: g.lat, lon: g.lon, name: W.place.name.replace(/ · moved$/, '') + ' · moved' }, true);
}
async function reland(place, quiet) {
  if (W.relanding) return; W.relanding = true;
  try {
    if (!quiet) { $('#veil').classList.remove('gone'); $('#vTitle').textContent = 'Going to ' + place.name; for (const li of document.querySelectorAll('#stages li')) li.classList.remove('done', 'now'); stage('place', 'done'); }
    const win = await loadWindow(place), p = W.mode === 'walk' ? W.rig.pos : W.tie.pos, keep = quiet && W.P ? W.P.toWGS(p.x / M, p.z / M) : null;
    installWindow(win); setWorld(W.world);
    let lx = 0, lz = 0;
    if (keep) { const l = win.P.toLocal(keep.lat, keep.lon); lx = l.x * M; lz = l.z * M; } else { const s = spawnPoint(win); lx = s.x * M; lz = s.z * M; }
    if (W.mode === 'walk') {
      W.rig.pos.set(lx, W.G.h(lx, lz), lz); W.rig.cam.set = false;
      if (!quiet) { W.rig.heading = Math.PI; W.rig.cam.yaw = W.rig.heading + Math.PI; parkShip(lx, lz); }
      else { const sp = W.ship.position, sw = W.prevP.toWGS(sp.x / M, sp.z / M), sl = win.P.toLocal(sw.lat, sw.lon); W.ship.position.set(sl.x * M, W.G.h(sl.x * M, sl.z * M) + 122, sl.z * M); }
    } else { W.tie.pos.set(lx, W.tie.pos.y, lz); W.tie.prevPos.copy(W.tie.pos); }
    W.prevP = win.P; W.crowd.populate(W.mode === 'walk' ? W.rig.pos : W.tie.pos);
    if (!quiet) { stage('bricks', 'done'); $('#veil').classList.add('gone'); }
  } catch (e) { console.error(e); if (!quiet) stall('Could not go there: ' + (e.message || e)); }
  finally { W.relanding = false; }
}
function parkShip(x, z) {
  const p = { x: x + 9 * M, z };
  for (let k = 0; k < 6; k++) { const b = W.city.near(p.x, p.z, 4 * M).find(b => Bricks.pointInRing(p.x / M, p.z / M, b.ring)); if (!b) break; p.x += 6 * M; p.z += 3 * M; }
  W.ship.position.set(p.x, W.G.h(p.x, p.z) + 122, p.z); W.ship.quaternion.setFromEuler(E1.set(0, Math.PI / 2, 0, 'YXZ'));
}
async function goAnywhere(q) {
  $('#find').classList.remove('open'); $('#q').blur();
  const g = await Geo.geocode(q); if (!g) { toast('not found'); return; }
  if (W.mode === 'fly') Tie.land(W.tie);
  await reland(g, false);
}

/* ───────────────────────── boot ───────────────────────── */
async function boot() {
  buildMenu(); bindInput(); document.body.dataset.world = W.world;
  const watchdog = setTimeout(() => { if (!W.ready) stall('Still loading after 40 s. The ground and the buildings come from the network; the ship from this site.'); }, 40000);
  try {
    const viewerP = NabugoUI.makeViewer($('#stage'), { background: 0xb8cbd8, base: '.' }), placeP = resolvePlace();
    const engine = await viewerP; W.engine = engine; W.scene = engine.scene; W.camera = engine.camera; W.renderer = engine.renderer; W.loader = engine.loader;
    engine.setDiagnostics({ axes: false, grid: false });
    engine.camera.far = 90000; engine.camera.fov = innerHeight > innerWidth ? 55 : 50; engine.camera.updateProjectionMatrix();
    if ((navigator.maxTouchPoints || 0) > 0) engine.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    const place = await placeP; stage('place', 'done', place.name); $('#vTitle').textContent = place.name; $('#place').textContent = place.name;
    const modelsP = (stage('ship', 'now'), loadModels(engine));
    const win = await loadWindow(place);
    const models = await modelsP; stage('ship', 'done');
    Ground.daylight(W.scene, W.renderer, W.loader, M);
    W.colours = code => { const m = W.loader.getMaterial(String(code)); return m ? m.color : new THREE.Color(0xff00ff); };
    W.geoms = Bricks.harvest(models.harvest); for (const g of models.harvest) models.root.remove(g);
    W.raw = harvestRaw(models.fig); for (const g of models.fig) models.root.remove(g);
    W.ship = engine.modelWrapper; W.ship.traverse(o => { if (o.isMesh && o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.fog = true; });
    engine.controls.enabled = false; engine.controls = null;
    W.city = new Bricks.City({ scene: W.scene, M, geoms: W.geoms, groundM: (x, z) => 0, colours: W.colours, palette: Worlds.PRESETS[W.world].palette });
    W.debris = new Debris.Debris({ scene: W.scene, M, groundH: WORLD.groundH, aabbs: (x, z, r) => W.city.aabbs(x, z, r), onWallHit: (p, v) => fall(W.city.blast(p, 0.5 * M, v, 2)) });
    for (const [name, g] of W.geoms) W.debris.register(name, g.geom, name.startsWith('wall') ? 600 : 200);
    for (const [name, g] of W.raw) W.debris.register(name, g, 120);
    W.bolts = new Characters.Bolts({ scene: W.scene, M, groundH: WORLD.groundH });
    W.crowd = new Characters.Crowd({ scene: W.scene, M, geoms: W.raw, colours: W.colours, groundH: WORLD.groundH });
    installWindow(win); W.prevP = win.P; setWorld(W.world);
    stage('bricks', 'now', 'laying the bricks');
    W.tie = Tie.create({ ship: W.ship, M, groundH: WORLD.groundH, aabbs: (x, z, r) => W.city.aabbs(x, z, r), scene: W.scene, onImpact: (p, sev) => { flash(); W.shake = 0.4; blast(p, 3 * M, W.tie.vel.clone().multiplyScalar(.2), false); } });
    setCharacter(W.character);
    const s = spawnPoint(win); W.rig.pos.set(s.x * M, W.G.h(s.x * M, s.z * M), s.z * M); W.rig.heading = Math.PI; W.rig.figure.rotation.y = Math.PI; W.rig.cam.yaw = W.rig.heading + Math.PI; parkShip(W.rig.pos.x, W.rig.pos.z);
    W.crowd.populate(W.rig.pos);
    for (let k = 0; k < 20; k++) W.city.update(W.camera, W.rig.pos);
    const r = engine.renderer, real = r.render.bind(r);
    r.render = (sc, c) => { tick(); real(sc, c); W.stats.calls = r.info.render.calls; };
    stage('bricks', 'done', ''); W.last = performance.now(); W.ready = true; $('#veil').classList.add('gone'); $('#menu').classList.remove('open'); paint(); hintFor();
  } catch (e) { console.error(e); stall('Could not build the world: ' + (e.message || e)); }
  finally { clearTimeout(watchdog); }
}

/* ───────────────────────── test hooks ───────────────────────── */
Object.assign(W, {
  step: sec => { for (let t = 0; t < sec; t += 1 / 60) simulate(1 / 60); W.last = performance.now(); },
  state: () => ({
    ready: W.ready, mode: W.mode, character: W.character, world: W.world, place: W.place && W.place.name, baked: !!(W.win && W.win.baked), village: !!(W.win && W.win.village), net: { ...W.net }, geo: Geo.NET,
    groundN: W.G && W.G.n, imagery: !!(W.G && W.G.imagery), sky: W.scene && '#' + W.scene.background.getHexString(), buildings: W.win ? W.win.buildings.length : 0, roads: W.win ? W.win.roads.length : 0, city: W.city && W.city.stats(),
    vader: W.rig ? { pos: W.rig.pos.toArray(), heading: W.rig.heading, speed: W.rig.speed, phase: W.rig.phase, gait: W.rig.gait, legR: W.rig.legRP.rotation.x, legL: W.rig.legLP.rotation.x, ground: W.G.h(W.rig.pos.x, W.rig.pos.z), visible: W.rig.figure.visible, swing: !!W.rig.swing, tip: Minifig.saberTip(W.rig, V1).toArray(), fist: Minifig.fist(W.rig, V2).toArray(), parts: Object.keys(W.rig.mounted) } : null,
    tie: W.tie ? { flying: W.tie.flying, pos: W.tie.pos.toArray(), vel: W.tie.vel.toArray(), speed: W.tie.speed, shields: W.tie.shields, impact: W.tie.impact.text, landing: W.tie.landing, ship: W.ship.position.toArray(), alt: (W.tie.pos.y - W.G.h(W.tie.pos.x, W.tie.pos.z)) / M, hits: W.tie.hits, torps: W.tie.torps.filter(t => t.life > 0).length } : null,
    debris: W.debris && W.debris.stats(), crowd: W.crowd && W.crowd.stats(), health: W.health, dead: W.dead, dets: W.dets, grenades: W.grenades.length, bolts: W.bolts ? W.bolts.live().length : 0,
    calls: W.stats.calls, cam: W.camera ? W.camera.position.toArray() : null, camFwd: W.camera ? W.camera.getWorldDirection(V3).toArray() : null, nearShip: nearShip(),
  }),
  stick: (x, y) => { const t = W.mode === 'fly' ? W.input.fly : W.input.L; t.x = x; t.y = y; t.mag = Math.min(1, Math.hypot(x, y)); t.held = t.mag > 0; },
  look: (dx, dy) => { W.input.look.dx += dx; W.input.look.dy += dy; },
  saber: () => { W.input.saber = true; }, run: on => { W.input.runHook = on; }, boost: on => { W.input.boostHook = on; }, fire: () => { W.input.fireOnce = true; }, torpedo: () => { W.input.torpedo = true; }, push: () => { W.input.push = true; }, detonate: throwDetonator,
  board, land, setCharacter, setWorld, teleport: (x, z) => { if (W.mode === 'walk') { W.rig.pos.set(x, W.G.h(x, z), z); W.rig.cam.set = false; } else { W.tie.pos.set(x, W.G.h(x, z) + 30 * M, z); W.tie.prevPos.copy(W.tie.pos); } },
  goAnywhere, blast: (x, y, z, r) => blast(new THREE.Vector3(x, y, z), r), hurt, M,
  debrisPieces: () => W.debris.pieces.map(p => { const c = W.debris.centre(p, V1); return { part: p.kind.name, y: c.y, x: c.x, z: c.z, rest: p.rest, floor: W.G.h(c.x, c.z) }; }),
  building: i => { const b = W.city.buildings[i]; if (!b.bricks) b.bricks = Bricks.buildBricks(b, W.colours, M); return { id: b.id, kind: b.kind, n: b.bricks.n, removed: b.removed.size, live: b.bricks.n - b.removed.size, cx: b.cx, cz: b.cz, y0: b.y0, yTop: b.yTop, courses: b.courses, ruined: b.ruined }; },
});
boot();
})();
