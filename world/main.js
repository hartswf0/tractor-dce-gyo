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
const UP = new THREE.Vector3(0, 1, 0), V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), E1 = new THREE.Euler(), Q1 = new THREE.Quaternion();

const W = {
  engine: null, scene: null, camera: null, renderer: null, loader: null,
  place: null, P: null, G: null, city: null, rig: null, tie: null, ship: null, geoms: null, raw: null, debris: null, crowd: null, bolts: null,
  mode: 'walk', t: 0, last: 0, ready: false, colours: null, character: Q.get('as') || 'vader', world: Q.get('world') || 'earth',
  net: { elevation: null, imagery: null, osm: null }, relanding: false, health: 100, dead: 0, dets: DETONATORS, grenades: [], shake: 0,
  input: { L: { x: 0, y: 0, mag: 0 }, look: { dx: 0, dy: 0 }, run: false, saber: false, fly: { x: 0, y: 0, mag: 0 }, boost: false, fire: false, push: false, torpedo: false },
  stats: { calls: 0 },
  build: null, draft: null, props: null, geomsO: null, master: { busy: false, result: null, anchor: null, rot: 0, ghosts: [], conv: null, status: '' }, room: null, name: null, smoke: null, tally: { bricks: 0, levelled: 0 }, dentAt: 0, remotes: new Map(), editQ: { up: [], rm: [] }, editAcc: 0, netAcc: 0, crowdAcc: 0, dmgAcc: 0, dmgSaved: 0, dmgKey: null,
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
  $('#menu').innerHTML = `<div class="row"><span>play as</span>${chars}</div><div class="row"><span>world</span>${worlds}</div>
    <div class="row net"><span>together</span><input id="nameIn" placeholder="your name" maxlength="14"><button id="hostBtn">Host a room</button><input id="codeIn" placeholder="CODE" maxlength="4" autocapitalize="characters"><button id="joinBtn">Join</button><button id="linkBtn" hidden>Copy link</button><button id="leaveBtn" hidden>Leave</button><button id="muteBtn" title="sound">🔊</button></div><div class="row"><em id="roomStat"></em></div>`;
  $('#menu').querySelectorAll('[data-as]').forEach(b => b.onclick = () => setCharacter(b.dataset.as));
  $('#menu').querySelectorAll('[data-world]').forEach(b => b.onclick = () => setWorld(b.dataset.world));
  $('#nameIn').value = W.name || ''; $('#nameIn').onchange = () => setName($('#nameIn').value);
  $('#hostBtn').onclick = () => hostRoom(); $('#joinBtn').onclick = () => joinRoom($('#codeIn').value); $('#leaveBtn').onclick = () => leaveRoom();
  $('#linkBtn').onclick = () => { const link = W.room.link(); (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => toast('link copied', 900), () => { prompt('Share this link', link); }); };
  $('#codeIn').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom($('#codeIn').value); });
  const mb = $('#muteBtn'); mb.textContent = Fx.Sfx.muted ? '🔇' : '🔊'; mb.onclick = () => { Fx.Sfx.setMute(!Fx.Sfx.muted); mb.textContent = Fx.Sfx.muted ? '🔇' : '🔊'; Fx.Sfx.unlock(); };
}
function setName(n) { W.name = (n || '').trim().slice(0, 14) || W.name; try { localStorage.setItem('world.name', W.name); } catch (e) { } }
function roomStat() {
  const N = W.room, st = N ? N.stats() : null, chip = $('#room');
  if (!st || !st.role) { chip.textContent = ''; chip.classList.remove('on'); $('#roomStat').textContent = st && st.error ? 'could not connect: ' + st.error : ''; $('#hostBtn').hidden = false; $('#joinBtn').hidden = false; $('#codeIn').hidden = false; $('#linkBtn').hidden = true; $('#leaveBtn').hidden = true; return; }
  const n = Math.max(st.role === 'guest' ? 2 : 1, st.players.filter(id => id !== 'host').length + 1); chip.textContent = `${st.code} · ${n} player${n > 1 ? 's' : ''}`; chip.classList.add('on');
  $('#roomStat').textContent = `${st.role === 'host' ? 'hosting' : 'in'} room ${st.code} · share the code or the link`; $('#hostBtn').hidden = true; $('#joinBtn').hidden = true; $('#codeIn').hidden = true; $('#linkBtn').hidden = false; $('#leaveBtn').hidden = false;
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
  if (W.build) { const key = placeKey(win.place), a = anchorOf(win.place), al = win.P.toLocal(a.lat, a.lon), frame = { ax: al.x * M, az: al.z * M, datum: G.datum * M }; W.build.setFrame(frame); const n = W.build.load(key); if (n) toast(`${n} bricks of yours here`, 1200); if (W.draft) { W.draft.setFrame(frame); mbDiscard(true); } if (W.props) { W.props.setFrame(frame); W.props.load(key); } }
  W.dmgKey = 'world.damage.' + placeKey(win.place); loadDamage();
}
/** A place's anchor: its coordinates to a thousandth of a degree (about 100 m), so a jittery GPS fix still finds the same builds. */
function anchorOf(place) { return place.baked ? { lat: HLIDARENDI.lat, lon: HLIDARENDI.lon } : { lat: Math.round(place.lat * 1000) / 1000, lon: Math.round(place.lon * 1000) / 1000 }; }
function placeKey(place) { if (place.baked) return 'hlidarendi'; const a = anchorOf(place); return a.lat.toFixed(3) + '_' + a.lon.toFixed(3); }
function loadDamage() {
  W.dmgSaved = W.city.knocked; let sets = null; try { sets = JSON.parse(localStorage.getItem(W.dmgKey) || 'null'); } catch (e) { }
  if (!sets) return 0; let n = 0; for (const b of W.city.buildings) if (sets[b.id]) n += W.city.applyRemoved(b, sets[b.id]);
  W.dmgSaved = W.city.knocked; return n;
}
function saveDamage() {
  if (!W.dmgKey || W.city.knocked === W.dmgSaved) return; W.dmgSaved = W.city.knocked;
  try { const s = JSON.stringify(W.city.removedSets()); if (s.length > 300000) { if (!W.dmgWarned) { W.dmgWarned = true; toast('too much damage to remember', 1500); } return; } localStorage.setItem(W.dmgKey, s); } catch (e) { }
}
function resetPlace() { W.build.forget(); if (W.props) W.props.forget(); mbDiscard(true); try { localStorage.removeItem(W.dmgKey); } catch (e) { } W.city.set(W.win.buildings); W.debris.clear(); W.dmgSaved = W.city.knocked; if (W.room && W.room.role) W.room.send({ t: 'reset' }); toast('this place is new again', 1200); }
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
    : W.build && W.build.on ? (W.build.pick ? 'aim at a brick of yours and tap to pick it up' : 'aim with the reticle · tap to place · walk up to stack')
    : `left thumb walks · right thumb looks · tap right ${d.saber ? 'swings the saber' : d.weapon ? 'fires' : 'shoves'} · two fingers: Force push`;
}
function setWorld(name) {
  if (!Worlds.PRESETS[name]) return; W.world = name; markMenu();
  if (!W.G) return;
  const sets = W.city ? W.city.removedSets() : null;
  const p = Worlds.apply(name, { scene: W.scene, G: W.G, city: W.city, lights: Ground.daylight.lights });
  if (sets) for (const b of W.city.buildings) if (sets[b.id]) W.city.applyRemoved(b, sets[b.id]);   // a new palette keeps the old damage
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
    else if (W.build && W.build.on) { if (tap) buildAct(); }
    else if (tap && !p.left) W.input.saber = true;
    if (W.mode === 'walk' && !p.left) W.input.runTouch = false;
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end); window.addEventListener('pointerup', end);
  window.addEventListener('keydown', e => { if (/INPUT|TEXTAREA/.test(e.target.tagName)) return; W.keys.add(e.code);
    if (W.build && W.build.on && W.mode === 'walk') { if (e.code === 'Space') { buildAct(); e.preventDefault(); return; } if (e.code === 'KeyR') { rotateBuild(); return; } if (e.code === 'BracketLeft') { W.build.lift--; return; } if (e.code === 'BracketRight') { W.build.lift++; return; } if (e.code === 'Backspace') { W.build.undo(); paintPalette(); return; } if (e.code === 'KeyX') { setPick(!W.build.pick); return; } }
    if (e.code === 'KeyB') { toggleBuild(); return; }
    if (e.code === 'Space') { if (W.mode === 'walk') W.input.saber = true; e.preventDefault(); } if (e.code === 'KeyE') promptAction(); if (e.code === 'KeyF') W.input.push = true; if (e.code === 'KeyG') throwDetonator(); if (e.code === 'KeyT' && W.mode === 'fly') W.input.torpedo = true; });
  window.addEventListener('keyup', e => W.keys.delete(e.code));
  window.addEventListener('blur', () => W.keys.clear());
  $('#prompt').addEventListener('click', promptAction);
  $('#det').addEventListener('click', throwDetonator);
  $('#build').addEventListener('click', toggleBuild);
  bindPalette();
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
  if (W.build) W.build.pushOut(pos, r, 100);
  if (W.props) W.props.pushOut(pos, r, 100);
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
/** What feet stand on: the ground, or a placed brick no higher than a step above them. */
const WALK = { groundH: (x, z) => { const g = W.G.h(x, z); if (!W.build || !W.rig) return g; const f = Math.max(W.build.floorAt(x, z, W.rig.pos.y + 30), W.props ? W.props.floorAt(x, z, W.rig.pos.y + 30) : -Infinity); return f > g ? f : g; }, pushOut };
/** Boxes that stop ships, bolts and debris: buildings and builds. */
function allBoxes(x, z, r) { let a = W.city.aabbs(x, z, r); if (W.build) a = a.concat(W.build.aabbs(x, z, r)); if (W.props) a = a.concat(W.props.aabbs(x, z, r)); return a; }

/* ───────────────────────── destruction ───────────────────────── */
function fall(list) { for (const f of list) W.debris.spawn({ part: f.part, matrix: f.matrix, colour: f.colour, vel: f.vel }); return list.length; }
/** A blast: bricks within r fly, the buildings collapse where they lost support, people in reach are thrown. */
/** Every blast in the game goes through here: bricks fly, the hole keeps crumbling, smoke rises, it sounds and shakes,
    people and the player are thrown, and the room hears about it. kind: 'saber' | 'bolt' | 'torp' | 'ram' | 'det' | 'push' | 'debris'. */
function blast(point, r, vel, people = true, fromNet = false, kind = 'bolt') {
  const n = fall(W.city.blast(point, r, vel)) + (W.build ? fall(W.build.blast(point, r, vel)) : 0) + (W.props ? W.props.blast(point, r, vel) : 0);
  if (!fromNet && W.room && W.room.role) W.room.send({ t: 'blast', p: point.toArray().map(Math.round), r, v: vel ? vel.toArray().map(Math.round) : null, k: kind });
  const shocks = { bolt: 2, torp: 4, ram: 3, det: 3, saber: 1, push: 0, debris: 0 }[kind] || 0;
  if (shocks && n) W.city.aftershock(point, r, shocks, 0.3, vel);
  for (const b of W.city.lastTouched || []) if (b.bricks && b.removed.size > 0.3 * b.bricks.n && !(b.smokeUntil > W.t)) { b.smokeUntil = W.t + 8; W.smoke.column(new THREE.Vector3(b.cx * M, b.yTop, b.cz * M), 8); }
  const size = clamp(r / (8 * M), 0.1, 1);
  if (n || kind === 'torp' || kind === 'det') { W.smoke.puff(point, Math.min(40, 6 + n), r); Fx.Sfx.boom(size); Fx.haptic(Math.round(20 + size * 60)); W.shake = Math.max(W.shake, size * 0.6); }
  if (n) { W.tally.bricks += n; Fx.Hits.mark(); Fx.Hits.float('+' + n, n >= 30); }
  if (people && W.mode === 'walk' && W.rig.figure.visible && !W.dead && r >= 3 * M) { V1.copy(W.rig.pos); V1.y += 1.2 * M; const d = V1.distanceTo(point); if (d < 2 * r) { const away = V1.clone().sub(point); away.y = 0; if (away.lengthSq() < 1) away.set(1, 0, 0); away.normalize().multiplyScalar((4 + 6 * (1 - d / (2 * r))) * M); away.y = 5 * M; if (!W.rig.air) Minifig.throwRig(W.rig, away); hurt(Math.round(d < r ? 40 : 25 * (1 - (d - r) / r))); } }
  if (people && W.crowd) W.crowd.hitWithin(point, r * 1.6, vel ? vel.clone().multiplyScalar(0.6) : null, W.debris);
  return n;
}
/** A crater in the ground (LDU): the field itself changes, so everything stands lower afterwards. Shared with the room. */
function crater(point, r, depth, fromNet = false) {
  if (!W.G) return; const gh = W.G.h(point.x, point.z); Ground.crater(W.G, point.x, point.z, r, depth); W.lastCrater = { x: point.x, z: point.z, r, depth, before: gh, after: W.G.h(point.x, point.z) };
  if (!fromNet && W.room && W.room.role) W.room.send({ t: 'crater', p: [Math.round(point.x), Math.round(gh), Math.round(point.z)], r, d: depth });
  return gh;
}
function forcePush() {
  const f = Minifig.facing(W.rig, V1).clone(), base = W.rig.pos.clone(); base.y += 1 * M;
  let n = 0; for (const d of [2, 4, 6]) n += blast(V2.copy(base).addScaledVector(f, d * M), 2 * M, f.clone().multiplyScalar(9 * M), false, false, 'push');
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
    if ((g.fuse -= dt) <= 0) { W.scene.remove(g.mesh); W.grenades.splice(i, 1); crater(g.mesh.position, 3 * M, 1 * M); blast(g.mesh.position, 5 * M, null, true, false, 'det'); W.shake = 0.6; flash(); toast('boom', 500); }
  }
}
function hurt(dmg) {
  if (W.mode !== 'walk' || W.dead) return;
  if (dmg <= 0) return; W.health = Math.max(0, W.health - dmg); flash(); Fx.Sfx.hurt(); Fx.haptic(30);
  if (W.health <= 0) { W.dead = 3; for (const f of Minifig.burst(W.rig)) W.debris.spawn({ part: f.part, matrix: f.matrix, colour: W.colours(f.col), vel: new THREE.Vector3((Math.random() - .5) * 3 * M, 3 * M, (Math.random() - .5) * 3 * M) }); W.rig.figure.visible = false; toast('down', 1500); }
}
function respawn() {
  W.dead = 0; W.health = 100; W.dets = DETONATORS; Fx.Sfx.respawn(); W.rig.air = false;
  const s = W.ship.position, side = V1.set(Math.cos(W.tie.yaw), 0, -Math.sin(W.tie.yaw));
  W.rig.pos.set(s.x + side.x * 6 * M, 0, s.z + side.z * 6 * M); pushOut(W.rig.pos, W.rig.radius); W.rig.pos.y = W.G.h(W.rig.pos.x, W.rig.pos.z); W.rig.figure.visible = true; W.rig.cam.set = false;
}

/** What flying debris can hit: the TIE (shields dent, rubble scatters) and the player's body. */
function debrisCtx() {
  const spheres = [];
  if (W.mode === 'fly') spheres.push({ pos: W.tie.pos, r: Tie.PLAYER_R * 0.8, vel: W.tie.vel, onHit: (p, rel) => { if (rel > 4 * M && W.t - W.dentAt > 0.12) { W.dentAt = W.t; W.tie.shields = Math.max(0, W.tie.shields - 2); Fx.Sfx.clatter(1); Fx.haptic(10); } } });
  else if (!W.dead) spheres.push({ pos: V3.copy(W.rig.pos).setY(W.rig.pos.y + 1.2 * M), r: 1.1 * M, vel: W.rig.vel, onHit: (p, rel) => { if (rel > 6 * M && W.t - W.dentAt > 0.3) { W.dentAt = W.t; hurt(5); } } });
  return { spheres, onLand: (p, v) => Fx.Sfx.clatter(clamp(v / (6 * M), 0.2, 1)) };
}
/** A TIE bolt lands: on a wall it blasts, on the ground it scorches a small crater. */
function boltHit(p, kind, vel) {
  if (kind === 'ground') { crater(p, 1.5 * M, 0.4 * M); W.smoke.puff(p, 8, 1.5 * M); Fx.Sfx.thud(0.35); Fx.haptic(10); W.tally.craters = (W.tally.craters || 0) + 1; return; }
  blast(p, 3 * M, vel ? vel.clone().multiplyScalar(0.15) : null, true, false, 'bolt'); W.shake = Math.max(W.shake, 0.15);
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
  W.mode = 'walk'; document.body.classList.remove('fly'); $('#mode').textContent = 'walk · ' + Minifig.DEFS[W.character].name; hintFor(); Fx.Sfx.thud(0.4); Fx.haptic(15);
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
      Minifig.step(W.rig, dt, { move: MOVE, run: I.run, saber: I.saber && !(W.build && W.build.on), aim: I.aim }, WALK);
      if (wantsShot) { const p = new THREE.Vector3(), dir = new THREE.Vector3(); Minifig.muzzle(W.rig, p, dir); dir.y = -0.05; W.bolts.fire(p, dir, 'player'); }
      I.saber = false;
      if (W.rig.hit) { const h = W.rig.hit; W.rig.hit = null; const n = blast(h, 1.4 * M, Minifig.facing(W.rig, V2).clone().multiplyScalar(3 * M), true, false, 'saber'); Fx.Sfx.strike(); Fx.haptic(25); if (n) toast('bricks!', 500); }
      if (I.push) { I.push = false; forcePush(); }
    }
    Minifig.camera(W.rig, W.camera, dt, I.look, WALK, portrait, W.build && W.build.on); I.look.dx = I.look.dy = 0;
    if (W.build) W.build.aim(W.camera, portrait);
    const near = nearShip() < 6 && !W.dead; $('#prompt').classList.toggle('on', near); $('#prompt').textContent = 'Board the TIE';
  } else {
    const F = W.tie; F.input.x = I.fly.x; F.input.y = I.fly.y; F.input.mag = I.fly.mag; F.input.boost = I.boost; F.input.fire = I.fire || !!I.fireOnce; I.fireOnce = false; if (I.torpedo) { F.input.torpedo = true; I.torpedo = false; }
    if (F.input.torpedo) Fx.Sfx.torpedo();
    const still = Tie.step(F, dt, boltHit, (p, v) => { crater(p, 6 * M, 2 * M); blast(p, 8 * M, v.multiplyScalar(0.1), true, false, 'torp'); W.shake = 0.9; flash(); toast('torpedo', 500); });
    Fx.Sfx.engine(true, clamp(F.speed / Tie.BOOST, 0, 1), !!F.input.boost);
    Tie.camera(F, W.camera, dt, portrait);
    if (!still) landed();
    else { const alt = (F.pos.y - W.G.h(F.pos.x, F.pos.z)) / M; $('#prompt').classList.toggle('on', !F.landing && alt < 14); $('#prompt').textContent = 'Land'; }
  }
  if (W.mode !== 'fly') Fx.Sfx.engine(false);
  { const wantHum = W.mode === 'walk' && !W.dead && d.saber && !(W.build && W.build.on); Fx.Sfx.saber(wantHum); if (W.mode === 'walk' && W.rig.swing && !W.swingWas) Fx.Sfx.swing(); W.swingWas = W.mode === 'walk' && !!W.rig.swing; if (W.rig.landed) { const v = W.rig.landed; W.rig.landed = 0; Fx.Sfx.thud(clamp(v / (10 * M), 0.2, 1)); Fx.haptic(15); if (v > 9 * M) hurt(Math.round((v / M - 9) * 3)); } }
  if (W.shake > 0) { W.shake -= dt; W.camera.position.x += (Math.random() - .5) * W.shake * 12; W.camera.position.y += (Math.random() - .5) * W.shake * 12; }
  W.bolts.step(dt, {
    hitPlayer: b => { if (W.mode === 'walk') { if (W.dead) return false; V1.copy(W.rig.pos); V1.y += 1.3 * M; if (Characters.segHitsSphere(b.prev, b.mesh.position, V1, 0.8 * M)) { hurt(20); return true; } return false; } if (Characters.segHitsSphere(b.prev, b.mesh.position, W.tie.pos, Tie.PLAYER_R * 0.8)) { W.tie.shields = Math.max(0, W.tie.shields - 5); flash(); return true; } return false; },
    hitNpc: b => W.crowd.hitBy(b, W.debris),
    hitWorld: b => { const p = b.mesh.position; for (const box of W.city.aabbs(p.x, p.z, 60)) if (p.x > box.min.x - 6 && p.x < box.max.x + 6 && p.z > box.min.z - 6 && p.z < box.max.z + 6 && p.y > box.min.y && p.y < box.max.y) { if (b.owner === 'player') blast(p, 1.6 * M, b.vel.clone().multiplyScalar(0.05), true, false, 'bolt'); else if (b.owner === 'npc') fall(W.city.blast(p, 0.6 * M, null, 2)); return true; } return false; },
  });
  fall(W.city.tick(dt));
  W.debris.step(dt, debrisCtx()); stepGrenades(dt); W.smoke.step(dt);
  { let checked = 0; for (const p of W.debris.pieces) { if (p.rest || p.settling || checked > 80) continue; if (p.vel.lengthSq() < 25 * M * M) continue; checked++; const c = W.debris.centre(p, V1); if (W.crowd.hitWithin(c, 0.9 * M, p.vel.clone().multiplyScalar(0.5), W.debris)) Fx.Sfx.clatter(1); } }
  if (W.room.role) { W.room.tick(dt); netTick(dt); stepRemotes(dt); }
  W.build.tick(dt); if (W.props) W.props.tick(dt); if ((W.dmgAcc += dt) > 2) { W.dmgAcc = 0; saveDamage(); }
  W.crowd.step(dt, { player: { pos: W.rig.pos, alive: W.mode === 'walk' && !W.dead, running: W.input.run && W.rig.speed > 3 * M, vel: W.rig.vel }, tie: { pos: W.tie.pos, flying: W.mode === 'fly' }, bolts: W.bolts, debris: W.debris, los, pushOut });
  W.city.update(W.camera, W.mode === 'walk' ? W.rig.pos : W.tie.pos);
  if ((W.hudAcc = (W.hudAcc || 0) + dt) > 0.1) { W.hudAcc = 0; paint(); }
  if ((W.landAcc = (W.landAcc || 0) + dt) > 1) { W.landAcc = 0; maybeReland(); }
}
function paint() {
  const st = W.city.stats(), cs = W.crowd.stats();
  { const t = $('#tally'), txt = W.tally.bricks ? `${W.tally.bricks.toLocaleString()} bricks · ${st.levelled} levelled` : ''; if (t.textContent !== txt) { t.textContent = txt; t.classList.remove('pulse'); void t.offsetWidth; t.classList.add('pulse'); } }
  if (W.mode === 'walk') { $('#stat').textContent = `${st.buildings} buildings · ${cs.alive} people${W.build.pieces.size ? ' · ' + W.build.pieces.size + ' built' : ''}\n${Math.round(W.rig.speed / M * 3.6)} km/h · ${W.dets} detonators`; $('#shieldFill').style.width = W.health + '%'; $('#shield').classList.toggle('low', W.health < 40); $('#det').classList.toggle('on', W.dets > 0 && !W.dead); }
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
    W.prevP = win.P; if (!W.crowd.remote) W.crowd.populate(W.mode === 'walk' ? W.rig.pos : W.tie.pos);
    if (!quiet) { stage('bricks', 'done'); $('#veil').classList.add('gone'); }
    if (W.room.role === 'host' && !quiet) W.room.send({ t: 'place', place: wirePlace(), world: W.world });
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
  try { W.name = Q.get('name') || localStorage.getItem('world.name') || ''; } catch (e) { W.name = Q.get('name') || ''; }
  if (!W.name) W.name = 'pilot-' + Build.Build.pid().slice(0, 4);
  W.room = Net.create({ transport: Q.get('net') === 'bc' ? 'bc' : undefined, onMessage: netHandle, onJoin: id => { roomStat(); if (id !== 'host') toast('someone joined', 900); }, onLeave: id => { dropRemote(id); roomStat(); if (id === 'host') leaveRoom(false); else toast('a player left', 900); }, onStatus: roomStat });
  try { Fx.Sfx.muted = Q.get('mute') === '1' || (Q.get('mute') !== '0' && localStorage.getItem('world.mute') === '1'); } catch (e) { }
  const unlock = () => { Fx.Sfx.unlock(); }; window.addEventListener('pointerdown', unlock, { passive: true }); window.addEventListener('keydown', unlock);
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
    W.geomsO = Bricks.harvestOrigin(models.harvest);
    W.build = new Build.Build({ scene: W.scene, M, geoms: W.geomsO, colours: W.colours, groundH: WORLD.groundH, buildings: (x, z, r) => W.city.aabbs(x, z, r), rings: (x, z) => W.city.near(x, z, 10) });
    W.build.onEdit = ops => queueEdit(ops);
    W.draft = new Build.Build({ scene: W.scene, M, geoms: W.geomsO, colours: W.colours, groundH: WORLD.groundH, buildings: (x, z, r) => W.city.aabbs(x, z, r), rings: (x, z) => W.city.near(x, z, 10), ghost: true, cap: 2048 });
    W.debris = new Debris.Debris({ scene: W.scene, M, groundH: WORLD.groundH, aabbs: allBoxes, onWallHit: (p, v) => fall(W.city.blast(p, 0.5 * M, v, 2)) });
    for (const [name, g] of W.geoms) W.debris.register(name, g.geom, name.startsWith('wall') ? 600 : 200);
    for (const [name, g] of W.raw) W.debris.register(name, g, 120);
    for (const [part, k] of W.build.kinds) W.debris.register('b:' + part, k.geom, 200); W.build.onKind = (part, geom) => W.debris.register('b:' + part, geom, 200);
    W.props = new Props.Props({ scene: W.scene, loader: W.loader, M, debris: W.debris }); W.props.onEdit = ops => queueEdit(ops, 'prop');
    W.bolts = new Characters.Bolts({ scene: W.scene, M, groundH: WORLD.groundH });
    W.crowd = new Characters.Crowd({ scene: W.scene, M, geoms: W.raw, colours: W.colours, groundH: WORLD.groundH });
    installWindow(win); W.prevP = win.P; setWorld(W.world);
    stage('bricks', 'now', 'laying the bricks');
    W.smoke = new Fx.Smoke(W.scene, M);
    W.tie = Tie.create({ ship: W.ship, M, groundH: WORLD.groundH, aabbs: allBoxes, scene: W.scene, targets: () => { const out = []; for (const n of W.crowd.npcs) if (n.alive) out.push({ x: n.pos.x, y: n.pos.y + 1.2 * M, z: n.pos.z }); for (const r of W.remotes.values()) out.push({ x: r.pos.x, y: r.pos.y + M, z: r.pos.z }); return out; },
      onImpact: (p, sev, label, closing) => { flash(); W.shake = Math.max(W.shake, 0.3 + sev * 0.4);
        if (/GROUND/.test(label)) { if (sev > 0.5) { crater(p, 2 * M, 0.5 * M); W.smoke.puff(p, 10, 2 * M); } Fx.Sfx.thud(clamp(sev, 0.3, 1)); Fx.haptic(30); }
        else { blast(p, (3 + clamp(closing / 300, 0, 3)) * M, W.tie.vel.clone().multiplyScalar(.25), false, false, 'ram'); Fx.Sfx.crunch(); Fx.haptic([40, 30, 60]); } } });
    setCharacter(W.character);
    const s = spawnPoint(win); W.rig.pos.set(s.x * M, W.G.h(s.x * M, s.z * M), s.z * M); W.rig.heading = Math.PI; W.rig.figure.rotation.y = Math.PI; W.rig.cam.yaw = W.rig.heading + Math.PI; parkShip(W.rig.pos.x, W.rig.pos.z);
    W.crowd.populate(W.rig.pos);
    for (let k = 0; k < 20; k++) W.city.update(W.camera, W.rig.pos);
    const r = engine.renderer, real = r.render.bind(r);
    r.render = (sc, c) => { tick(); real(sc, c); W.stats.calls = r.info.render.calls; };
    W.tie.onFire = (o, d, v) => { Fx.Sfx.laser(); if (W.room && W.room.role) W.room.send({ t: 'bolt', o: o.toArray().map(Math.round), d: d.toArray().map(x => +x.toFixed(3)), s: Math.round(v.length()) }, { fast: true }); };
    W.bolts.onFire = (o, d, owner, speed) => { if (owner === 'player') Fx.Sfx.blaster(); if (W.room && W.room.role && (owner === 'player' || (owner === 'npc' && W.room.role === 'host'))) W.room.send({ t: 'bolt', o: o.toArray().map(Math.round), d: d.toArray().map(x => +x.toFixed(3)), s: speed, npc: owner === 'npc' }, { fast: true }); };
    { const orig = W.crowd.burst.bind(W.crowd); W.crowd.burst = (n, vel, debris) => { const was = n.alive; orig(n, vel, debris); if (was && W.room && W.room.role === 'guest' && n.ri != null) W.room.send({ t: 'npcHit', i: n.ri }); }; }
    paintPalette();
    stage('bricks', 'done', ''); W.last = performance.now(); W.ready = true; $('#veil').classList.add('gone'); $('#menu').classList.remove('open'); paint(); hintFor();
    if (Q.get('room')) joinRoom(Q.get('room'), true);
    bindMaster(); checkInbox();
  } catch (e) { console.error(e); stall('Could not build the world: ' + (e.message || e)); }
  finally { clearTimeout(watchdog); }
}

/* ───────────────────────── building ───────────────────────── */
function toggleBuild(on) {
  const B = W.build; if (!B || W.mode !== 'walk') return; B.on = on === undefined ? !B.on : !!on; if (!B.on) { B.pick = false; B.lift = 0; }
  document.body.classList.toggle('build', B.on); $('#build').classList.toggle('on', B.on); paintPalette(); hintFor();
  W.rig.figure.traverse(o => { if (!o.isMesh) return; const m = o.material; if (m.userData.op == null) { m.userData.op = m.opacity; m.userData.tr = m.transparent; } m.transparent = B.on ? true : m.userData.tr; m.opacity = B.on ? Math.min(0.35, m.userData.op) : m.userData.op; m.needsUpdate = true; });   // see through yourself while building
}
function setPick(on) { W.build.pick = !!on; paintPalette(); }
function rotateBuild() { W.build.rot = (W.build.rot + 1) % 4; }
/** The build tap: place the ghost, or pick up what the reticle is on. */
function buildAct() {
  const B = W.build; if (!B.on || W.mode !== 'walk' || W.dead) return;
  if (B.pick) { const p = B.aimedPiece(); if (p) { fall(B.remove(p.id)); toast('picked up', 500); } else toast('nothing to pick up', 600); return; }
  const p = B.place(); if (p) { paintPalette(); } else toast(B.target ? 'blocked' : 'too far', 600);
}
function bindPalette() {
  const P = $('#palette');
  P.innerHTML = `<div class="parts">${Build.PARTS.map(([part, name]) => `<button data-part="${part}">${name}</button>`).join('')}</div>
    <div class="tools"><span class="cols">${Build.COLOURS.map(c => `<button data-col="${c}" title="${c}"></button>`).join('')}</span>
    <button data-tool="rot" title="rotate (R)">⟳</button><button data-tool="up" title="lift (])">▲</button><button data-tool="down" title="lower ([)">▼</button><button data-tool="undo" title="undo (⌫)">⌫</button><button data-tool="pick" title="pick up (X)">✋</button><button data-tool="reset" title="reset this place">reset</button><button id="mbBtn" title="the master builder">🧠 build for me</button><button data-tool="place" class="place">PLACE</button></div>`;
  P.querySelectorAll('[data-part]').forEach(b => b.onclick = () => { W.build.part = b.dataset.part; W.build.pick = false; paintPalette(); });
  P.querySelectorAll('[data-col]').forEach(b => b.onclick = () => { W.build.col = +b.dataset.col; paintPalette(); });
  P.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { const B = W.build; switch (b.dataset.tool) { case 'rot': rotateBuild(); break; case 'up': B.lift = Math.min(B.lift + 1, 60); break; case 'down': B.lift = Math.max(B.lift - 1, -60); break; case 'undo': B.undo(); break; case 'pick': setPick(!B.pick); break; case 'reset': if (confirm('Forget every brick built and every wall broken here?')) resetPlace(); break; case 'place': buildAct(); break; } paintPalette(); });
}
function paintPalette() {
  const B = W.build, P = $('#palette'); if (!B) return;
  P.querySelectorAll('[data-part]').forEach(b => b.classList.toggle('on', b.dataset.part === B.part && !B.pick));
  P.querySelectorAll('[data-col]').forEach(b => { if (!b.style.background) { const c = W.colours(+b.dataset.col).clone().convertLinearToSRGB(); b.style.background = c.getStyle(); } b.classList.toggle('on', +b.dataset.col === B.col); });
  const pick = P.querySelector('[data-tool="pick"]'); if (pick) pick.classList.toggle('on', B.pick);
  const undo = P.querySelector('[data-tool="undo"]'); if (undo) undo.disabled = !B.history.length;
}

/* ───────────────────────── the master builder ───────────────────────── */
function bindMaster() {
  const P = $('#mb'); if (!P) return;
  $('#mbBtn').onclick = () => { P.classList.toggle('open'); if (P.classList.contains('open')) { $('#mbKey').value = Ai.key(); $('#mbModel').value = Ai.model(); $('#mbSettings').open = !Ai.key(); setTimeout(() => $('#mbPrompt').focus(), 50); } };
  $('#mbClose').onclick = () => P.classList.remove('open');
  $('#mbKey').onchange = () => Ai.setKey($('#mbKey').value); $('#mbModel').onchange = () => Ai.setModel($('#mbModel').value);
  $('#mbDraft').onclick = () => mbDraft($('#mbPrompt').value);
  $('#mbPrompt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); mbDraft($('#mbPrompt').value); } });
  $('#mbCommit').onclick = () => mbCommit(); $('#mbDiscard').onclick = () => mbDiscard();
  P.querySelectorAll('[data-nudge]').forEach(b => b.onclick = () => { const [dx, dz, dy, rot] = b.dataset.nudge.split(',').map(Number); mbNudge(dx, dz, dy, rot); });
  P.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => { $('#mbPrompt').value = b.dataset.ask; mbDraft(b.dataset.ask); });
  mbStatus('');
}
function mbStatus(text, cls) { W.master.status = text; const e = $('#mbStat'); if (e) { e.textContent = text; e.className = cls || ''; } const has = !!(W.master.result && (W.draft.pieces.size || W.master.ghosts.length)); document.body.classList.toggle('drafting', has); }
/** Where a draft goes: the reticle's target if there is one, else three metres ahead of the player, on the stud grid. */
function mbAnchor() {
  const f = W.build.frame; let x, z;
  if (W.build.on && W.build.target) { x = W.build.target.x; z = W.build.target.z; } else { const d = Minifig.facing(W.rig, V1); x = W.rig.pos.x + d.x * 3 * M; z = W.rig.pos.z + d.z * 3 * M; }
  x = Math.round((x - f.ax) / 20) * 20 + f.ax; z = Math.round((z - f.az) / 20) * 20 + f.az;
  const gh = W.G.h(x, z), y = Math.round((gh + f.datum) / 8) * 8 - f.datum;
  return { x, y, z };
}
function mbContext() {
  const a = mbAnchor(), p = W.place, gl = W.G.h(a.x + 200, a.z) - W.G.h(a.x - 200, a.z), gs = W.G.h(a.x, a.z + 200) - W.G.h(a.x, a.z - 200);
  const slope = Math.abs(gl) < 40 && Math.abs(gs) < 40 ? 'flat' : `rises ${Math.round(Math.max(Math.abs(gl), Math.abs(gs)) / M)} m across 10 m`;
  const near = W.city.near(a.x, a.z, 30 * M).length, mine = W.build.nearPoint(a.x, a.z, 30 * M).size, props = W.props.near(a.x, a.z, 30 * M).length;
  return { place: p && p.name, world: W.world, ground: slope, standing: `${near} buildings, ${mine} of your bricks, ${props} props within 30 m` };
}
/** Ask the model, compile, and show the draft. */
async function mbDraft(prompt) {
  prompt = (prompt || '').trim(); if (!prompt || W.master.busy || W.mode !== 'walk') { if (W.mode !== 'walk') toast('land first', 900); return; }
  if (!Ai.key()) { $('#mbSettings').open = true; mbStatus('paste an OpenAI key first', 'warn'); $('#mbKey').focus(); return; }
  W.master.busy = true; mbStatus('asking ' + Ai.model() + '…', 'busy'); $('#mbDraft').disabled = true;
  try {
    let r = await Ai.ask(prompt, { context: mbContext() }); let res = Dsl.compile(r.program);
    if (res.report.unknown.length || res.report.errors.length || res.report.floating > 5) { mbStatus('fixing the program…', 'busy'); try { const r2 = await Ai.repair(r, res.report); const res2 = Dsl.compile(r2.program); if (res2.report.pieces + res2.report.props >= (res.report.pieces + res.report.props) * 0.5) { r = r2; res = res2; } } catch (e) { console.warn('repair', e); } }
    W.master.conv = r; mbShow(res, r.usage);
  } catch (e) { mbStatus(e.message || String(e), 'warn'); }
  finally { W.master.busy = false; $('#mbDraft').disabled = false; }
}
/** Show a compiled result as a see-through draft at the anchor. usage: the model's token counts, if any. */
function mbShow(res, usage) {
  mbDiscard(true); const a = mbAnchor(); W.master.result = res; W.master.anchor = a; W.master.rot = 0; W.master.usage = usage || null;
  mbLay();
  const rep = res.report, fixes = rep.floating + rep.blocked + rep.unknown.length + rep.errors.length;
  const tok = usage ? ` · ${usage.total_tokens} tokens` : '';
  mbStatus(`${res.name}: ${rep.pieces} bricks${rep.props ? ` · ${rep.props} props` : ''}${fixes ? ` · ${fixes} fixes` : ''}${tok}`, 'ok');
  Fx.Sfx.respawn(); Fx.haptic(15);
}
/** Lay the draft's pieces and ghost boxes for the current anchor and turn. */
function mbLay() {
  const res = W.master.result, a = W.master.anchor; if (!res) return;
  W.draft.clear(); for (const g of W.master.ghosts) W.scene.remove(g); W.master.ghosts = [];
  const rows = Dsl.toRows(res, { ax: a.x, ay: a.y, az: a.z }); W.draft.addRows(rows, true, true);
  for (let k = 0; k < W.master.rot; k++) W.draft.turn(a.x, a.z);
  for (const pr of res.props) { const pl = mbPropPlace(pr); const g = new THREE.Mesh(new THREE.BoxGeometry(pl.w, pl.h, pl.d), new THREE.MeshStandardMaterial({ color: pr.kind === 'vehicle' ? 0x2f7fbf : 0xbf8f2f, transparent: true, opacity: .4, depthWrite: false })); g.position.set(pl.x, pl.y + pl.h / 2, pl.z); g.rotation.y = pl.yaw * Math.PI / 2; g.name = 'draft-prop'; W.scene.add(g); W.master.ghosts.push(g); }
}
/** A prop's world placement for the current anchor and turn. */
function mbPropPlace(pr) {
  const a = W.master.anchor, pl = Dsl.propPlace(pr, { ax: a.x, ay: a.y, az: a.z }); let dx = pl.x - a.x, dz = pl.z - a.z;
  for (let k = 0; k < W.master.rot; k++) { const nx = dz, nz = -dx; dx = nx; dz = nz; }
  return { ...pl, x: a.x + dx, z: a.z + dz, yaw: (pl.yaw + W.master.rot) & 3, w: (W.master.rot & 1) ? pl.d : pl.w, d: (W.master.rot & 1) ? pl.w : pl.d };
}
function mbNudge(dx, dz, dy, rot) { if (!W.master.result) return; const a = W.master.anchor; a.x += dx * 20; a.z += dz * 20; a.y += dy * 8; if (rot) W.master.rot = (W.master.rot + rot) & 3; mbLay(); }
/** The draft becomes real: bricks into the shared build, props parsed and placed. */
async function mbCommit() {
  const res = W.master.result; if (!res) return;
  const rows = W.draft.rows(); const added = W.build.addRows(rows);
  const props = res.props.map(pr => mbPropPlace(pr)); let placed = 0;
  for (let i = 0; i < props.length; i++) { const pl = props[i]; const it = await W.props.place(res.props[i].mpd, pl.x, pl.y, pl.z, pl.yaw); if (it) placed++; }
  mbDiscard(true); mbStatus(`built: ${added.length} bricks${placed ? ` · ${placed} props` : ''}`, 'ok'); toast('built', 900); Fx.Sfx.thud(0.5); Fx.haptic(30);
  W.tally.built = (W.tally.built || 0) + added.length; return { bricks: added.length, props: placed };
}
function mbDiscard(quiet) { if (W.draft) W.draft.clear(); for (const g of W.master.ghosts) W.scene.remove(g); W.master.ghosts = []; W.master.result = null; W.master.anchor = null; W.master.rot = 0; if (!quiet) mbStatus('discarded'); else mbStatus(W.master.status); }
/** A program handed over from the studio page (localStorage 'world.inbox'). */
function checkInbox() {
  let box = null; try { box = JSON.parse(localStorage.getItem('world.inbox') || 'null'); localStorage.removeItem('world.inbox'); } catch (e) { }
  if (!box) return; if (!box.program && box.mpd) box.program = { name: box.name || 'model', ops: [{ op: 'mpd', text: box.mpd, name: box.name || 'model', x: 0, z: 0, facing: 's' }] };
  if (!box.program) return;
  const res = Dsl.compile(box.program); if (!res.report.pieces && !res.report.props) return;
  if (W.mode !== 'walk') return; $('#mb').classList.add('open'); mbShow(res, null); toast('from the studio: commit or discard', 1500);
}

/* ───────────────────────── playing together ───────────────────────── */
function wirePlace() { const p = W.place; return { lat: p.lat, lon: p.lon, name: p.name, baked: !!p.baked }; }
function samePlace(a) { if (!a || !W.place) return false; if (!!a.baked !== !!W.place.baked) return false; if (a.baked) return true; const l = W.P.toLocal(a.lat, a.lon); return Math.hypot(l.x, l.z) < 200; }
async function hostRoom(code) { if (W.room.role) return; try { await W.room.host(code); toast('room ' + W.room.code, 1200); } catch (e) { toast('could not host: ' + (e.type || e.message), 1500); } roomStat(); }
async function joinRoom(code, orHost) {
  code = String(code || '').trim().toUpperCase(); if (W.room.role || code.length !== 4) { if (code.length !== 4) toast('a room code has 4 letters', 900); return; }
  try { await (orHost ? W.room.joinOrHost(code) : W.room.join(code)); } catch (e) { toast('could not join: ' + (e.type || e.message), 1500); roomStat(); return; }
  if (W.room.role === 'guest') { W.room.send({ t: 'hi', name: W.name, ch: W.character }); toast('joined ' + code, 1000); } else toast('room ' + code + ' is yours', 1200);
  roomStat();
}
function leaveRoom(tell = true) {
  for (const id of [...W.remotes.keys()]) dropRemote(id);
  if (W.room.role) W.room.leave(tell);
  if (W.crowd.remote) { W.crowd.remote = false; for (const n of W.crowd.npcs.slice()) W.crowd.remove(n); W.crowd.mirror = null; W.crowd.populate(W.mode === 'walk' ? W.rig.pos : W.tie.pos); }
  roomStat(); toast('on your own again', 900);
}
function queueEdit(ops, kind) { const q = kind === 'prop' ? (W.propQ = W.propQ || { up: [], rm: [] }) : W.editQ; if (ops.up) q.up.push(...ops.up); if (ops.rm) q.rm.push(...ops.rm); }
function flushEdits() { for (const [q, k] of [[W.editQ, null], [W.propQ, 'prop']]) { if (!q || (!q.up.length && !q.rm.length)) continue; if (W.room.role) W.room.send({ t: 'edit', up: q.up, rm: q.rm, k }); q.up = []; q.rm = []; } }
function myState() {
  const r = W.rig, s = W.ship.position;
  const m = { t: 'p', m: W.mode, ch: W.character, hp: W.health, dead: !!W.dead, name: W.name, ship: [Math.round(s.x), Math.round(s.y), Math.round(s.z), +W.ship.quaternion.y.toFixed(3), +W.ship.quaternion.w.toFixed(3)] };
  if (W.mode === 'walk') { m.x = Math.round(r.pos.x); m.y = Math.round(r.pos.y); m.z = Math.round(r.pos.z); m.h = +r.heading.toFixed(3); m.an = [+r.phase.toFixed(2), +r.gait.toFixed(2), r.swing ? +((r.t - r.swing.t0) / 0.42).toFixed(2) : -1, +r.aim.toFixed(2)]; }
  else { const F = W.tie; m.x = Math.round(F.pos.x); m.y = Math.round(F.pos.y); m.z = Math.round(F.pos.z); m.q = F.quat.toArray().map(v => +v.toFixed(4)); m.v = F.vel.toArray().map(Math.round); }
  return m;
}
function netTick(dt) {
  if ((W.netAcc += dt) >= 1 / 12) { W.netAcc = 0; W.room.send(myState(), { fast: true }); }
  if ((W.editAcc += dt) >= 0.25) { W.editAcc = 0; flushEdits(); }
  if (W.room.role === 'host' && (W.crowdAcc += dt) >= 0.2) { W.crowdAcc = 0; W.room.send({ t: 'crowd', n: W.crowd.serialize() }, { fast: true }); }
}
function snapFor(id) { W.room.send({ t: 'snap', build: W.build.rows(), props: W.props.rows(), damage: W.city.removedSets(), crowd: W.crowd.serialize(), world: W.world }, { to: id }); }
async function followHost(place, world) {
  if (world && world !== W.world) setWorld(world);
  if (!samePlace(place)) { toast('going to the host', 1200); await reland(place, false); }
  W.room.send({ t: 'ready' });
}
function netHandle(m, from) {
  if (!W.ready) return; const R = W.room;
  switch (m.t) {
    case 'hi': if (R.role === 'host') { R.seen(from, { name: m.name, ch: m.ch }); R.send({ t: 'hello', place: wirePlace(), world: W.world, name: W.name, ch: W.character }, { to: from }); } break;
    case 'hello': if (R.role === 'guest') { R.seen('host', { name: m.name, ch: m.ch }); W.crowd.remote = true; for (const n of W.crowd.npcs.slice()) W.crowd.remove(n); W.crowd.mirror = new Map(); followHost(m.place, m.world); } break;
    case 'place': if (R.role === 'guest') followHost(m.place, m.world); break;
    case 'ready': if (R.role === 'host') snapFor(from); break;
    case 'snap': { if (R.role !== 'guest') break; const mine = W.build.rows(); W.build.applyOps({ up: m.build || [] }); if (m.props) { const mineP = W.props.rows(); W.props.applyOps({ up: m.props }); if (mineP.length) R.send({ t: 'edit', up: mineP, rm: [], k: 'prop' }); } for (const b of W.city.buildings) if (m.damage && m.damage[b.id]) W.city.applyRemoved(b, m.damage[b.id]); if (m.crowd) W.crowd.applyRemote(m.crowd); if (mine.length && mine.length <= 2000) R.send({ t: 'edit', up: mine, rm: [] }); toast(`${(m.build || []).length} bricks in this room`, 1200); break; }
    case 'p': applyRemote(from, m); break;
    case 'bolt': { const o = new THREE.Vector3().fromArray(m.o), d = new THREE.Vector3().fromArray(m.d); W.bolts.fire(o, d, m.npc && R.role === 'guest' ? 'npc' : 'remote', m.s || 1400); break; }
    case 'blast': blast(new THREE.Vector3().fromArray(m.p), m.r, m.v ? new THREE.Vector3().fromArray(m.v) : null, true, true, m.k || 'bolt'); break;
    case 'crater': crater(new THREE.Vector3().fromArray(m.p), m.r, m.d, true); break;
    case 'edit': { const r = m.k === 'prop' ? W.props.applyOps({ up: m.up, rm: m.rm }) : W.build.applyOps({ up: m.up, rm: m.rm }); if (r.added) toast(`${R.players.get(from) ? R.players.get(from).name : 'someone'} built`, 500); break; }
    case 'crowd': if (R.role === 'guest') W.crowd.applyRemote(m.n); break;
    case 'npcHit': if (R.role === 'host') { const n = W.crowd.npcs.find(n => n.i === m.i && n.alive); if (n) W.crowd.burst(n, null, W.debris); } break;
    case 'reset': W.build.clear(); W.props.clear(); W.city.set(W.win.buildings); W.debris.clear(); toast('the place was reset', 1000); break;
    case 'bye': dropRemote(from); break;
  }
}
/** A figure or a ship for someone else, kept where their last state says. */
function remoteFor(id, m) {
  let r = W.remotes.get(id);
  if (!r) { r = { id, fig: null, ship: null, ch: null, pos: new THREE.Vector3(m.x, m.y, m.z), heading: m.h || 0, quat: new THREE.Quaternion(), tgt: null, seen: W.t, label: makeLabel(m.name || id.slice(0, 6)) }; W.scene.add(r.label); W.remotes.set(id, r); }
  if (r.ch !== m.ch || !r.fig) { if (r.fig) W.scene.remove(r.fig.figure); r.fig = makePlayer(m.ch || 'vader'); r.ch = m.ch; r.fig.figure.visible = true; }
  if (!r.ship) { r.ship = W.ship.clone(true); r.ship.visible = true; W.scene.add(r.ship); }
  return r;
}
function makeLabel(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(26,31,42,.75)'; g.fillRect(0, 8, 256, 48); g.fillStyle = '#fff'; g.fillText(text.slice(0, 14), 128, 44);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false, fog: false })); sp.scale.set(160, 40, 1); sp.renderOrder = 5; return sp;
}
function applyRemote(id, m) { const r = remoteFor(id, m); r.tgt = m; r.seen = W.t; r.name = m.name; }
function stepRemotes(dt) {
  const k = 1 - Math.exp(-dt * 10);
  for (const r of W.remotes.values()) {
    const m = r.tgt; if (!m) continue;
    r.pos.lerp(V1.set(m.x, m.y, m.z), k);
    if (m.ship) { r.ship.position.set(m.ship[0], m.ship[1], m.ship[2]); if (m.m === 'walk') r.ship.quaternion.set(0, m.ship[3], 0, m.ship[4]).normalize(); }
    if (m.m === 'walk') {
      let d = m.h - r.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); r.heading += d * k;
      const f = r.fig; f.figure.visible = !m.dead; f.pos.copy(r.pos); f.figure.rotation.y = r.heading; f.t += dt;
      const an = m.an || [0, 0, -1, 0]; Minifig.pose(f, { phase: an[0], gait: an[1], t: f.t, swing: an[2] >= 0 && an[2] <= 1 ? an[2] : null, aim: an[3] });
      r.label.position.set(r.pos.x, r.pos.y + 150, r.pos.z); r.label.visible = !m.dead;
    } else {
      r.fig.figure.visible = false; r.quat.slerp(Q1.fromArray(m.q || [0, 0, 0, 1]), k); r.ship.position.copy(r.pos); r.ship.quaternion.copy(r.quat);
      r.label.position.set(r.pos.x, r.pos.y + 220, r.pos.z); r.label.visible = true;
    }
  }
}
function dropRemote(id) { const r = W.remotes.get(id); if (!r) return; if (r.fig) W.scene.remove(r.fig.figure); if (r.ship) W.scene.remove(r.ship); W.scene.remove(r.label); W.remotes.delete(id); }

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
  buildStat: () => W.build.stats(), setBuild: toggleBuild, choose: (part, col, rot) => { if (part) W.build.part = part; if (col != null) W.build.col = col; if (rot != null) W.build.rot = rot; paintPalette(); }, placeBrick: buildAct, undo: () => W.build.undo(), setPick, lift: n => { W.build.lift = n; },
  aimAt: (x, y, z) => { if (x == null) { W.build.pin = null; return null; } const o = new THREE.Vector3(x, y + 4 * M, z + 3 * M), d = new THREE.Vector3(x, y, z).sub(o).normalize(); W.build.on = true; W.build.pin = { origin: o, dir: d }; W.build.aimRay(o, d); return W.build.stats().target; }, takeBrick: id => fall(W.build.remove(id)),
  pieces: () => W.build.rows(), pieceAt: id => { const p = W.build.pieces.get(id); return p ? { id, part: p.part, col: p.col, x: p.x, y: p.y, z: p.z, rot: p.rot } : null; }, saveNow: () => { W.build.save(); saveDamage(); }, resetPlace, damage: () => W.city.removedSets(), placeKey: () => placeKey(W.place),
  fx: () => ({ sfx: Fx.Sfx.stats(), haptics: Fx.haptic.count(), smoke: W.smoke.stats(), hits: Fx.Hits.n, tally: { ...W.tally }, craters: W.G.craters || 0, lastCrater: W.lastCrater || null, air: !!W.rig.air, vy: W.rig.vy || 0, assisted: W.tie.assisted, groundHits: W.tie.groundHits }), crater: (x, z, r, d) => crater(new THREE.Vector3(x, 0, z), r, d), groundAt: (x, z) => W.G.h(x, z), groundColour: (x, z) => { const G = W.G, f = G.field, i = Math.round(f.cx + x / M / G.res), j = Math.round(f.cy + z / M / G.res), c = G.mesh.geometry.attributes.color, k = j * G.n + i; return [c.getX(k), c.getY(k), c.getZ(k)]; },
  mb: () => ({ busy: W.master.busy, status: W.master.status, rot: W.master.rot, anchor: W.master.anchor, draft: W.draft.pieces.size, ghosts: W.master.ghosts.length, report: W.master.result && W.master.result.report, usage: W.master.usage || null }), mbAsk: mbDraft, mbLoad: program => { const res = Dsl.compile(program); mbShow(res, null); return res.report; }, mbCommit, mbDiscard, mbNudge, propStat: () => W.props.stats(), propRows: () => W.props.rows(), propBoxes: () => [...W.props.items.values()].map(it => ({ id: it.id, ready: it.ready, parts: it.meshes.length, box: it.box ? [it.box.min.toArray(), it.box.max.toArray()] : null })), aiStat: () => Ai.stats(),
  netStat: () => W.room.stats(), host: hostRoom, join: joinRoom, leave: leaveRoom, remoteList: () => [...W.remotes.values()].map(r => ({ id: r.id, ch: r.ch, mode: r.tgt && r.tgt.m, pos: r.pos.toArray(), visible: r.fig && r.fig.figure.visible, shipVisible: !!r.ship && r.ship.visible })), flushEdits, setName,
  debrisPieces: () => W.debris.pieces.map(p => { const c = W.debris.centre(p, V1); return { part: p.kind.name, y: c.y, x: c.x, z: c.z, rest: p.rest, floor: W.G.h(c.x, c.z) }; }),
  building: i => { const b = W.city.buildings[i]; if (!b.bricks) b.bricks = Bricks.buildBricks(b, W.colours, M); return { id: b.id, kind: b.kind, n: b.bricks.n, removed: b.removed.size, live: b.bricks.n - b.removed.size, cx: b.cx, cz: b.cz, y0: b.y0, yTop: b.yTop, courses: b.courses, ruined: b.ruined }; },
});
boot();
})();
