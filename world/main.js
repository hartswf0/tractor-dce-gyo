/* world/main.js — the world: a place on Earth, its ground and its city in bricks,
   Vader on foot, the TIE to board. One parse, one loop, two modes. */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const M = 40;                                                  // LDU per metre: minifig scale, 1:40
const Q = new URLSearchParams(location.search);
const HLIDARENDI = { lat: 63.7422, lon: -20.108, name: 'Hlíðarendi, Iceland', baked: true };
const GROUND_SPAN = 2700, DETAIL_SPAN = 900, RELAND_AT = 300;
const UP = new THREE.Vector3(0, 1, 0), V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), E1 = new THREE.Euler();

const W = {                                                    // the world's state
  engine: null, scene: null, camera: null, renderer: null, loader: null,
  place: null, P: null, G: null, city: null, rig: null, tie: null, ship: null, geoms: null,
  mode: 'walk', t: 0, last: 0, ready: false, loose: [], pieces: null, colours: null,
  net: { elevation: null, imagery: null, osm: null }, relanding: false, ready2: false,
  input: { L: { x: 0, y: 0, mag: 0 }, look: { dx: 0, dy: 0 }, run: false, saber: false, fly: { x: 0, y: 0, mag: 0 }, boost: false, fire: false },
  stats: { calls: 0 },
};
window.__world = W;

/* ───────────────────────── veil and HUD ───────────────────────── */
function stage(name, state, note) {
  const li = $(`#stages li[data-s="${name}"]`); if (li) { li.classList.remove('now', 'done'); li.classList.add(state); }
  if (note !== undefined) $('#vm').textContent = note;
}
function stall(msg) { $('#vm').innerHTML = msg + '<br><button onclick="location.reload()">Retry</button>'; }
function toast(text, ms = 1200) { const m = $('#msg'); m.textContent = text; m.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => m.classList.remove('on'), ms); }
function flash() { const f = $('#flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 100); }

/* ───────────────────────── the place ───────────────────────── */
async function resolvePlace() {
  const at = Q.get('at'); if (at) { const c = Geo.parseCoordinates(at); if (c) return { ...c, name: Q.get('name') || c.name }; }
  const name = Q.get('place'); if (name) { stage('place', 'now', 'looking up ' + name); const g = await Geo.geocode(name); if (g) return g; }
  if (!Q.has('noloc')) { stage('place', 'now', 'asking where you are'); const here = await Geo.locate(8000); if (here) return here; }
  return HLIDARENDI;
}

/* ───────────────────────── loading a window of the world ───────────────────────── */
async function loadWindow(place) {
  const P = Geo.proj(place.lat, place.lon), out = { place, P };
  stage('ground', 'now', 'fetching the ground');
  let field = null;
  if (!place.baked) { const f = await Geo.fetchElevation({ lat: place.lat, lon: place.lon, spanM: GROUND_SPAN }); if (f.ok) field = Ground.centredField(f); W.net.elevation = f.ok; }
  if (!field) { field = Ground.bakedField(); out.baked = true; if (!place.baked) out.place = { ...HLIDARENDI, name: place.name + ' → offline, so ' + HLIDARENDI.name }; }
  out.field = field; stage('ground', 'done');
  const im = out.baked ? { ok: false } : (stage('imagery', 'now', 'fetching the aerial imagery'), await Geo.fetchImagery({ lat: place.lat, lon: place.lon, spanM: DETAIL_SPAN * 1.4, P, maxZoom: 16 }));
  out.imagery = im.ok ? im : null; W.net.imagery = im.ok; stage('imagery', im.ok ? 'done' : 'done', im.ok ? '' : 'no imagery: moss it is');
  stage('buildings', 'now', 'fetching the buildings');
  const osm = out.baked ? { ok: false } : await Geo.fetchOSM({ lat: place.lat, lon: place.lon, spanM: DETAIL_SPAN, P });
  if (osm.ok) { out.buildings = osm.buildings; out.roads = osm.roads; } else { const v = Bricks.village(); out.buildings = v.buildings; out.roads = v.roads; out.village = true; }
  W.net.osm = osm.ok; stage('buildings', 'done', `${out.buildings.length} buildings, ${out.roads.length} roads`);
  return out;
}
function installWindow(win) {
  const scene = W.scene;
  if (W.G) { scene.remove(W.G.mesh); W.G.mesh.geometry.dispose(); if (W.G.roads) { scene.remove(W.G.roads); W.G.roads.geometry.dispose(); } }
  const G = Ground.make(win.field, M); scene.add(G.mesh);
  if (win.imagery) Ground.drape(G, win.imagery);
  const roads = Ground.roads(G, win.roads, M); if (roads) scene.add(roads);
  W.G = G; W.P = win.P; W.place = win.place; W.win = win;
  $('#place').textContent = win.place.name + (win.village ? ' · village' : '');
  if (W.city) { W.city.groundM = G.hM; W.city.set(win.buildings); }
}
/** Somewhere to stand: on a road near the origin if there is one, never inside a building. */
function spawnPoint(win) {
  let best = null, bd = 250;
  for (const r of win.roads) for (let i = 0; i < r.pts.length - 1; i++) {   // sample each road every 5 m
    const a = r.pts[i], b = r.pts[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / 5));
    for (let k = 0; k <= n; k++) { const p = { x: a.x + (b.x - a.x) * k / n, z: a.z + (b.z - a.z) * k / n }, d = Math.hypot(p.x, p.z); if (d < bd) { bd = d; best = p; } }
  }
  const p = best ? { x: best.x, z: best.z } : { x: 0, z: 0 };
  for (let k = 0; k < 8; k++) { const b = win.buildings.find(b => Bricks.pointInRing(p.x, p.z, b.ring)); if (!b) break; p.x += 6; p.z += 4; }
  return p;
}

/* ───────────────────────── the one parse ───────────────────────── */
async function loadModels(engine) {
  const [path, pack] = await Promise.all([fetch('./assembly-paths/VADER-TIE.json').then(r => r.json()), fetch('./assembly-paths/WORLD-full.mpd.txt').then(r => r.ok ? r.text() : '')]);
  const ship = path.lines.slice(0, 108);
  const text = ['0 FILE world.ldr', '0 !LDRAW_ORG Unofficial_Model', ...ship, ...Vader.LINES, Bricks.lines()].join('\n') + '\n\n' + Bricks.CUSTOM + '\n' + pack;
  engine.loader.separateObjects = true;
  const root = await engine.loadText(text, { name: 'world' }, 'world.mpd');
  const want = 108 + Vader.LINES.length + Bricks.HARVEST.length;
  if (root.children.length !== want) throw new Error(`expected ${want} part groups, got ${root.children.length}`);
  return { root, ship: root.children.slice(0, 108), vader: root.children.slice(108, 108 + Vader.LINES.length), harvest: root.children.slice(108 + Vader.LINES.length) };
}

/* ───────────────────────── input ───────────────────────── */
const PT = new Map();
let primary = null, lookId = null, lastMulti = 0;
function bindInput() {
  const stage = $('#stage'), ind = $('#stick'), nub = ind.querySelector('i');
  const showStick = (x, y, dx, dy) => { ind.style.left = x + 'px'; ind.style.top = y + 'px'; nub.style.transform = `translate(${dx}px,${dy}px)`; ind.classList.add('on'); };
  const stickFrom = (dx, dy) => { const R = clamp(Math.min(innerWidth, innerHeight) * .155, 72, 118); let m = Math.hypot(dx, dy) / R; if (m > 1) { dx /= m; dy /= m; m = 1; } if (m < 0.07) return { x: 0, y: 0, mag: 0 }; const sh = m * m; return { x: dx / R / m * sh, y: -dy / R / m * sh, mag: m }; };
  stage.addEventListener('pointerdown', e => {
    if (e.target.tagName !== 'CANVAS' || !W.ready) return; e.preventDefault(); stage.setPointerCapture(e.pointerId);
    const p = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0, multi: false, left: e.clientX < innerWidth * .5 };
    PT.set(p.id, p);
    if (PT.size >= 2) { for (const q of PT.values()) q.multi = true; lastMulti = performance.now(); }
    if (W.mode === 'fly') { if (!primary) { primary = p; showStick(p.x, p.y, 0, 0); } }
    else { if (p.left && !primary) { primary = p; showStick(p.x, p.y, 0, 0); } else if (!p.left && lookId == null) { lookId = p.id; p.holdTimer = setTimeout(() => { if (PT.has(p.id) && p.moved < 16) W.input.runTouch = true; }, 260); } }
  }, { passive: false });
  stage.addEventListener('pointermove', e => {
    const p = PT.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; p.moved = Math.max(p.moved, Math.hypot(p.x - p.x0, p.y - p.y0));
    if (p === primary) { const s = stickFrom(p.x - p.x0, p.y - p.y0); const tgt = W.mode === 'fly' ? W.input.fly : W.input.L; tgt.x = s.x; tgt.y = s.y; tgt.mag = s.mag; const R = 58; const L = Math.hypot(p.x - p.x0, p.y - p.y0), k = L > R ? R / L : 1; showStick(p.x0, p.y0, (p.x - p.x0) * k, (p.y - p.y0) * k); }
    else if (p.id === lookId && W.mode === 'walk') { W.input.look.dx += dx * 0.0045; W.input.look.dy += dy * 0.0035; }
  });
  const end = e => {
    const p = PT.get(e.pointerId); if (!p) return; PT.delete(e.pointerId);
    const age = performance.now() - p.t0, tap = !p.multi && p.moved < 14 && age < 450;
    W.lastTap = { tap, age: Math.round(age), moved: Math.round(p.moved), multi: p.multi, left: p.left, mode: W.mode, primary: p === primary };
    if (p === primary) { primary = null; ind.classList.remove('on'); const tgt = W.mode === 'fly' ? W.input.fly : W.input.L; tgt.x = tgt.y = tgt.mag = 0; const next = [...PT.values()].find(q => W.mode === 'fly' || q.left); if (next) { primary = next; next.x0 = next.x; next.y0 = next.y; showStick(next.x, next.y, 0, 0); } }
    if (p.id === lookId) lookId = null;
    if (W.mode === 'fly') { if (tap && !p.left) W.input.fireOnce = true; }
    else if (tap && !p.left) W.input.saber = true;
    if (W.mode === 'walk' && !p.left) W.input.runTouch = false;
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end); window.addEventListener('pointerup', end);
  window.addEventListener('keydown', e => { if (/INPUT|TEXTAREA/.test(e.target.tagName)) return; W.keys.add(e.code); if (e.code === 'Space') { if (W.mode === 'walk') W.input.saber = true; e.preventDefault(); } if (e.code === 'KeyE') promptAction(); });
  window.addEventListener('keyup', e => W.keys.delete(e.code));
  window.addEventListener('blur', () => W.keys.clear());
  $('#prompt').addEventListener('click', promptAction);
  $('#go').addEventListener('click', () => { const f = $('#find'); if (!f.classList.contains('open')) { f.classList.add('open'); $('#q').focus(); return; } const q = $('#q').value.trim(); if (q) goAnywhere(q); else f.classList.remove('open'); });
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { const q = $('#q').value.trim(); if (q) goAnywhere(q); } });
  W.keys = new Set();
}
function readKeys() {
  const k = W.keys, x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0), y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
  const tgt = W.mode === 'fly' ? W.input.fly : W.input.L;
  if (!primary && (x || y)) { const m = Math.min(1, Math.hypot(x, y)); tgt.x = x / Math.max(1, Math.hypot(x, y)); tgt.y = y / Math.max(1, Math.hypot(x, y)); tgt.mag = m; } else if (!primary && !tgt.held) { tgt.x = tgt.y = tgt.mag = 0; }
  const shift = k.has('ShiftLeft') || k.has('ShiftRight');
  W.input.boost = W.mode === 'fly' && (shift || PT.size >= 2 || !!W.input.boostHook);
  W.input.run = W.mode === 'walk' && (shift || !!W.input.runTouch || !!W.input.runHook);
  W.input.fire = W.mode === 'fly' && k.has('Space');
}

/* ───────────────────────── modes ───────────────────────── */
const COLLIDE = { ringsL: [] };
function pushOut(pos, r) {                                     // circle vs the near buildings' rings and the parked TIE
  for (const b of W.city.near(pos.x, pos.z, r + 2 * M)) pushRing(pos, r, b.ringL, b.y0, b.yTop);
  if (W.mode === 'walk' && W.ship) { const s = W.ship.position; pushRing(pos, r, [{ x: s.x - 170, z: s.z - 85 }, { x: s.x + 170, z: s.z - 85 }, { x: s.x + 170, z: s.z + 85 }, { x: s.x - 170, z: s.z + 85 }], s.y - 200, s.y + 200); }
}
function pushRing(pos, r, ring, y0, y1) {
  if (pos.y + 20 < y0 || pos.y > y1) return;
  const inside = Bricks.pointInRing(pos.x, pos.z, ring);
  let bd = Infinity, bx = 0, bz = 0, bn = null;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1;
    const t = clamp(((pos.x - a.x) * dx + (pos.z - a.z) * dz) / L2, 0, 1), cx = a.x + dx * t, cz = a.z + dz * t, d = Math.hypot(pos.x - cx, pos.z - cz);
    if (d < bd) { bd = d; bx = cx; bz = cz; bn = { x: -dz, z: dx }; }
  }
  if (bd === Infinity) return;
  if (inside) { const n = Math.hypot(pos.x - bx, pos.z - bz) || 1; const ox = (pos.x - bx) / n, oz = (pos.z - bz) / n; const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length;
    const sgn = (ox * (bx - cx) + oz * (bz - cz)) >= 0 ? 1 : -1; pos.x = bx + ox * sgn * (r + 1); pos.z = bz + oz * sgn * (r + 1); }
  else if (bd < r) { const n = Math.hypot(pos.x - bx, pos.z - bz) || 1; pos.x = bx + (pos.x - bx) / n * r; pos.z = bz + (pos.z - bz) / n * r; }
}
const WORLD = { groundH: (x, z) => W.G.h(x, z), pushOut };

function nearShip() { if (!W.ship || !W.rig) return Infinity; return Math.hypot(W.ship.position.x - W.rig.pos.x, W.ship.position.z - W.rig.pos.z) / M; }
function promptAction() { if (!W.ready) return; if (W.mode === 'walk' && nearShip() < 6) board(); else if (W.mode === 'fly' && !W.tie.landing) land(); }
function board() {
  if (W.mode !== 'walk') return;
  W.mode = 'fly'; document.body.classList.add('fly'); $('#mode').textContent = 'fly · TIE'; $('#hint').textContent = 'drag anywhere to carve · second finger boosts · tap right fires';
  W.rig.figure.visible = false; Tie.board(W.tie, W.rig.heading); primary = null; W.input.L.mag = 0; toast('TIE', 900);
}
function land() { if (W.mode === 'fly') { Tie.land(W.tie); toast('landing'); } }
function landed() {
  W.mode = 'walk'; document.body.classList.remove('fly'); $('#mode').textContent = 'walk · Vader'; $('#hint').textContent = 'left thumb walks · right thumb looks · tap right swings the saber';
  const s = W.ship.position, side = V1.set(Math.cos(W.tie.yaw), 0, -Math.sin(W.tie.yaw));
  W.rig.pos.set(s.x + side.x * 6 * M, 0, s.z + side.z * 6 * M); pushOut(W.rig.pos, W.rig.radius); W.rig.pos.y = W.G.h(W.rig.pos.x, W.rig.pos.z);
  W.rig.figure.visible = true; W.rig.cam.set = false; W.rig.cam.yaw = W.tie.yaw + Math.PI; W.camera.fov = innerHeight > innerWidth ? 55 : 50; W.camera.updateProjectionMatrix();
  primary = null; W.input.fly.mag = 0; toast('landed', 900);
}

/* ───────────────────────── loose bricks ───────────────────────── */
const LOOSE_MAX = 160, GRAV = 9.8 * M;
function knock(point, r, vel) {
  const k = W.city.knock(point, r); if (!k) return null;
  const m = new THREE.Mesh(k.geom, new THREE.MeshStandardMaterial({ color: k.colour, vertexColors: true, roughness: .6 }));
  k.matrix.decompose(m.position, m.quaternion, m.scale); W.scene.add(m);
  const out = V1.subVectors(m.position, point).normalize();
  const piece = { obj: m, vel: out.multiplyScalar(60 + Math.random() * 120).add(vel || V2.set(0, 0, 0)).setY(90 + Math.random() * 120), ang: new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(6), life: 9, rest: false, r: 12 };
  W.loose.push(piece); while (W.loose.length > LOOSE_MAX) { const p = W.loose.shift(); W.scene.remove(p.obj); p.obj.material.dispose(); }
  return piece;
}
function stepLoose(dt) {
  for (let i = W.loose.length - 1; i >= 0; i--) {
    const p = W.loose[i], o = p.obj;
    if ((p.life -= dt) <= 0) { W.scene.remove(o); o.material.dispose(); W.loose.splice(i, 1); continue; }
    if (p.rest) continue;
    p.vel.y -= GRAV * dt; o.position.addScaledVector(p.vel, dt);
    const w = p.ang.length(); if (w > 1e-4) { V3.copy(p.ang).divideScalar(w); o.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(V3, w * dt)); }
    const floor = W.G.h(o.position.x, o.position.z) + p.r * .5;
    if (o.position.y < floor) { o.position.y = floor; p.vel.y *= -.3; p.vel.x *= .6; p.vel.z *= .6; p.ang.multiplyScalar(.5); if (p.vel.length() < 30) { p.rest = true; p.vel.set(0, 0, 0); } }
  }
}

/* ───────────────────────── the loop ───────────────────────── */
function tick() { if (!W.ready) return; const now = performance.now(), dt = Math.min(0.1, Math.max(0, (now - W.last) / 1000)); W.last = now; simulate(dt); }
const MOVE = { x: 0, z: 0, mag: 0 };
function simulate(dt) {
  W.t += dt; readKeys();
  const portrait = innerHeight > innerWidth, I = W.input;
  if (W.mode === 'walk') {
    Vader.moveFromStick(W.rig, I.L, MOVE);
    Vader.step(W.rig, dt, { move: MOVE, run: I.run, saber: I.saber }, WORLD); I.saber = false;
    if (W.rig.hit) { const h = W.rig.hit; W.rig.hit = null; let n = 0; for (let k = 0; k < 3; k++) if (knock(h, 1.6 * M, Vader.facing(W.rig, V2).multiplyScalar(80))) n++; if (n) toast('bricks!', 500); }
    Vader.camera(W.rig, W.camera, dt, I.look, WORLD, portrait); I.look.dx = I.look.dy = 0;
    const near = nearShip() < 6; $('#prompt').classList.toggle('on', near); $('#prompt').textContent = 'Board the TIE';
  } else {
    const F = W.tie; F.input.x = I.fly.x; F.input.y = I.fly.y; F.input.mag = I.fly.mag; F.input.boost = I.boost; F.input.fire = I.fire || !!I.fireOnce; I.fireOnce = false;
    const still = Tie.step(F, dt, p => knock(p, 2.4 * M, F.vel.clone().multiplyScalar(.15)));
    Tie.camera(F, W.camera, dt, portrait);
    if (!still) landed();
    else { const alt = (F.pos.y - W.G.h(F.pos.x, F.pos.z)) / M; $('#prompt').classList.toggle('on', !F.landing && alt < 14); $('#prompt').textContent = 'Land'; }
  }
  stepLoose(dt);
  W.city.update(W.camera, W.mode === 'walk' ? W.rig.pos : W.tie.pos);
  if ((W.hudAcc = (W.hudAcc || 0) + dt) > 0.1) { W.hudAcc = 0; paint(); }
  if ((W.landAcc = (W.landAcc || 0) + dt) > 1) { W.landAcc = 0; maybeReland(); }
}
function paint() {
  const st = W.city.stats(), p = W.mode === 'walk' ? W.rig.pos : W.tie.pos;
  if (W.mode === 'walk') $('#stat').textContent = `${st.buildings} buildings · ${st.near} tiles in bricks\n${Math.round(W.rig.speed / M * 3.6)} km/h`;
  else { const F = W.tie, alt = Math.round((F.pos.y - W.G.h(F.pos.x, F.pos.z)) / M); $('#stat').textContent = `${alt} m up · ${Math.round(F.speed / M * 3.6)} km/h${F.input.boost ? ' · boost' : ''}\n${F.t < F.impact.until ? F.impact.text : F.slide > .35 ? 'VADER SLIDE' : ''}`; $('#shieldFill').style.width = F.shields + '%'; $('#shield').classList.toggle('low', F.shields < 40); if (F.t < F.impact.until && F.impact.text !== W.lastImpact) { W.lastImpact = F.impact.text; toast(F.impact.text.split(' · ')[0], 700); } }
  if (W.mode === 'fly' && W.tie.shields <= 0 && !W.tie.landing) { W.tie.shields = Tie.SHIELD_MAX; toast('shields gone: setting down'); Tie.land(W.tie); }
}

/* ───────────────────────── play anywhere: streaming and search ───────────────────────── */
async function maybeReland() {
  if (W.relanding || !W.win || W.win.baked || !W.net.elevation) return;
  const p = W.mode === 'walk' ? W.rig.pos : W.tie.pos, dm = Math.hypot(p.x, p.z) / M;
  if (dm < RELAND_AT) return;
  const g = W.P.toWGS(p.x / M, p.z / M);
  await reland({ lat: g.lat, lon: g.lon, name: W.place.name.replace(/ · moved$/, '') + ' · moved' }, true);
}
async function reland(place, quiet) {
  if (W.relanding) return; W.relanding = true;
  try {
    if (!quiet) { $('#veil').classList.remove('gone'); $('#vTitle').textContent = 'Going to ' + place.name; for (const li of document.querySelectorAll('#stages li')) li.classList.remove('done', 'now'); stage('place', 'done'); }
    const win = await loadWindow(place);
    const p = W.mode === 'walk' ? W.rig.pos : W.tie.pos;
    const keep = quiet && W.P ? W.P.toWGS(p.x / M, p.z / M) : null;
    installWindow(win);
    let lx = 0, lz = 0;
    if (keep) { const l = win.P.toLocal(keep.lat, keep.lon); lx = l.x * M; lz = l.z * M; }
    else { const s = spawnPoint(win); lx = s.x * M; lz = s.z * M; }
    if (W.mode === 'walk') {
      W.rig.pos.set(lx, W.G.h(lx, lz), lz); W.rig.cam.set = false;
      if (!quiet) { W.rig.heading = Math.PI; W.rig.cam.yaw = W.rig.heading + Math.PI; parkShip(lx, lz); }
      else { const sp = W.ship.position, sw = W.prevP.toWGS(sp.x / M, sp.z / M), sl = win.P.toLocal(sw.lat, sw.lon); W.ship.position.set(sl.x * M, W.G.h(sl.x * M, sl.z * M) + 122, sl.z * M); }   // the parked ship keeps its place on Earth
    } else { W.tie.pos.set(lx, W.tie.pos.y, lz); W.tie.prevPos.copy(W.tie.pos); }
    W.prevP = win.P;
    if (!quiet) { stage('bricks', 'done'); $('#veil').classList.add('gone'); }
  } catch (e) { console.error(e); if (!quiet) stall('Could not go there: ' + (e.message || e)); }
  finally { W.relanding = false; }
}
function parkShip(x, z) {                                    // the TIE waits 9 m down the road from where you stand
  let px = x + 9 * M, pz = z; const p = { x: px, z: pz };
  for (let k = 0; k < 6; k++) { const b = W.city.near(p.x, p.z, 4 * M).find(b => Bricks.pointInRing(p.x / M, p.z / M, b.ring)); if (!b) break; p.x += 6 * M; p.z += 3 * M; }
  W.ship.position.set(p.x, W.G.h(p.x, p.z) + 122, p.z); W.ship.quaternion.setFromEuler(E1.set(0, Math.PI / 2, 0, 'YXZ'));
}
async function goAnywhere(q) {
  $('#find').classList.remove('open'); $('#q').blur();
  const g = await Geo.geocode(q); if (!g) { toast('not found'); return; }
  if (W.mode === 'fly') { Tie.land(W.tie); }
  await reland(g, false);
}

/* ───────────────────────── boot ───────────────────────── */
async function boot() {
  bindInput();
  const t0 = performance.now(), watchdog = setTimeout(() => { if (!W.ready) stall('Still loading after 40 s. The ground and the buildings come from the network; the ship from this site.'); }, 40000);
  try {
    const viewerP = NabugoUI.makeViewer($('#stage'), { background: 0xb8cbd8, base: '.' });
    const placeP = resolvePlace();
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
    // harvest the bricks, hang Vader on his pivots; the root keeps exactly the ship
    W.geoms = Bricks.harvest(models.harvest); for (const g of models.harvest) models.root.remove(g);
    W.rig = Vader.build(models.root, models.vader, W.scene, M);
    W.ship = engine.modelWrapper; W.ship.traverse(o => { if (o.isMesh && o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.fog = true; });
    engine.controls.enabled = false; engine.controls = null;
    W.city = new Bricks.City({ scene: W.scene, M, geoms: W.geoms, groundM: (x, z) => 0, colours: W.colours });
    installWindow(win); W.prevP = win.P;
    stage('bricks', 'now', 'laying the bricks');
    W.tie = Tie.create({ ship: W.ship, M, groundH: WORLD.groundH, aabbs: (x, z, r) => W.city.aabbs(x, z, r), scene: W.scene, onImpact: (p, sev) => { flash(); for (let k = 0; k < Math.min(6, 1 + Math.round(sev * 3)); k++) knock(p, 3 * M, W.tie.vel.clone().multiplyScalar(.2)); } });
    const s = spawnPoint(win); W.rig.pos.set(s.x * M, W.G.h(s.x * M, s.z * M), s.z * M); W.rig.heading = Math.PI; W.rig.cam.yaw = W.rig.heading + Math.PI; parkShip(W.rig.pos.x, W.rig.pos.z);
    for (let k = 0; k < 20; k++) W.city.update(W.camera, W.rig.pos);
    const r = engine.renderer, real = r.render.bind(r);
    r.render = (sc, c) => { tick(); real(sc, c); W.stats.calls = r.info.render.calls; };
    stage('bricks', 'done', ''); W.last = performance.now(); W.ready = true; $('#veil').classList.add('gone');
  } catch (e) { console.error(e); stall('Could not build the world: ' + (e.message || e)); }
  finally { clearTimeout(watchdog); }
}

/* ───────────────────────── test hooks ───────────────────────── */
Object.assign(W, {
  step: sec => { for (let t = 0; t < sec; t += 1 / 60) simulate(1 / 60); W.last = performance.now(); },
  state: () => ({
    ready: W.ready, mode: W.mode, place: W.place && W.place.name, baked: !!(W.win && W.win.baked), village: !!(W.win && W.win.village), net: { ...W.net }, geo: Geo.NET,
    groundN: W.G && W.G.n, imagery: !!(W.G && W.G.imagery), buildings: W.win ? W.win.buildings.length : 0, roads: W.win ? W.win.roads.length : 0, city: W.city && W.city.stats(),
    vader: W.rig ? { pos: W.rig.pos.toArray(), heading: W.rig.heading, speed: W.rig.speed, phase: W.rig.phase, gait: W.rig.gait, legR: W.rig.legRP.rotation.x, legL: W.rig.legLP.rotation.x, ground: W.G.h(W.rig.pos.x, W.rig.pos.z), visible: W.rig.figure.visible } : null,
    tie: W.tie ? { flying: W.tie.flying, pos: W.tie.pos.toArray(), vel: W.tie.vel.toArray(), speed: W.tie.speed, shields: W.tie.shields, impact: W.tie.impact.text, landing: W.tie.landing, ship: W.ship.position.toArray(), alt: (W.tie.pos.y - W.G.h(W.tie.pos.x, W.tie.pos.z)) / M, hits: W.tie.hits } : null,
    loose: W.loose.length, calls: W.stats.calls, cam: W.camera ? W.camera.position.toArray() : null, camFwd: W.camera ? W.camera.getWorldDirection(V1).toArray() : null, nearShip: nearShip(),
  }),
  stick: (x, y) => { const t = W.mode === 'fly' ? W.input.fly : W.input.L; t.x = x; t.y = y; t.mag = Math.min(1, Math.hypot(x, y)); t.held = t.mag > 0; },
  look: (dx, dy) => { W.input.look.dx += dx; W.input.look.dy += dy; },
  saber: () => { W.input.saber = true; }, run: on => { W.input.runHook = on; }, boost: on => { W.input.boostHook = on; }, fire: () => { W.input.fireOnce = true; },
  board, land, teleport: (x, z) => { if (W.mode === 'walk') { W.rig.pos.set(x, W.G.h(x, z), z); W.rig.cam.set = false; } else { W.tie.pos.set(x, W.G.h(x, z) + 30 * M, z); W.tie.prevPos.copy(W.tie.pos); } },
  goAnywhere, knock: (x, y, z, r) => knock(new THREE.Vector3(x, y, z), r), M,
});
boot();
})();
