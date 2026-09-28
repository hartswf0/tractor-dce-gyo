/* play/odyssey-game/mobile/butter-lite.js — Hand Butter, the parts of it the game needs, for the one-file mobile build.

   The desktop game runs inside the whole Hand Butter workspace (play/odyssey-game.html, 29 MB with its LDraw library).
   On a phone the game needs only: the renderer and its stage; the workspace's parts (S.parts, create/restore/bounds, the
   move transaction begin → propose → finish with the stud magnet and Beaver's exact stud handshake, bonds); the hand
   model (trackHands, pinchRatio, gestureOf, imagePoint, the MediaPipe worker, verbatim from the engine: injected below by
   tools/odyssey-mobile.js from play/hand-butter-odyssey.html); minifig actors (world/minifig.js); and the part geometry,
   which comes from the baked bank (tools/odyssey-mobile-bake.js) instead of the LDraw library. The names are the
   workspace's own, in the global scope, so the game layer runs unchanged. No physics: a part let go settles on what is
   under it; a seated part is bonded by the same stud test and stands. */
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
/*@BUTTER_EXTRACT@*/
/* ── the stage ── */
const S = { parts: [], selected: new Set(), next: 1, snap: true, plane: 'xyz', history: [], tx: null, ready: false };
const catalog = new Map();
let COLORS = [];
const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(38, 1, 2, 6000); camera.position.set(0, 420, 620);
const renderer = new THREE.WebGLRenderer({ canvas: $('#view'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.outputEncoding = THREE.sRGBEncoding; renderer.shadowMap.enabled = false;
const hemi0 = new THREE.HemisphereLight(0xd8efff, 0x5a6258, .55); scene.add(hemi0);
const sun = new THREE.DirectionalLight(0xfff2d7, 1.2); sun.position.set(-200, 520, 260); scene.add(sun);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: 0x253035, roughness: .94 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.25; floor.visible = false;
const grid = new THREE.GridHelper(800, 40, 0x708076, 0x3b4b4e); grid.visible = false;
const ROOM = { group: new THREE.Group(), video: null };
const hoverBox = new THREE.Box3Helper(new THREE.Box3(), 0xffffff); hoverBox.visible = false;
const PH = { pinned: new Set(), links: new Map(), bodies: new Map() };
const markPhysics = () => { }, poseToBody = () => { };
const bond = (a, b) => PH.links.set([a, b].sort().join('|'), true);
const ButterSpatialRuntime = { plate: new THREE.Group(), frame() { } };
scene.add(ButterSpatialRuntime.plate, ROOM.group); ButterSpatialRuntime.plate.add(floor, grid, hoverBox);
/* ── materials, colours ── */
const matCache = new Map();
function material(color) { const c = COLORS.find(c => c.code === color) || COLORS[0] || { hex: 0x888888 }; return new THREE.MeshStandardMaterial({ color: new THREE.Color(c.hex).convertSRGBToLinear(), roughness: .32, metalness: 0, side: THREE.DoubleSide }); }
/* ── the bank: part geometry baked from the LDraw library, built into three geometries on first use ── */
const BANK = { header: null, buf: null };
function bankGeometry(rec, g, ldraw) {
  const q = BANK.header.q, P = new Int16Array(BANK.buf, g.p, g.nv * 3), I = g.i32 ? new Uint32Array(BANK.buf, g.i, g.ni) : new Uint16Array(BANK.buf, g.i, g.ni);
  const pos = new Float32Array(g.ni * 3), col = g.c != null ? new Float32Array(g.ni * 3) : null, C = g.c != null ? new Uint8Array(BANK.buf, g.c, g.nv) : null, pal = BANK.header.palette, tmp = new THREE.Color();
  for (let k = 0; k < g.ni; k++) { const v = I[k]; let x = P[v * 3] / q, y = P[v * 3 + 1] / q, z = P[v * 3 + 2] / q; if (ldraw) { y = rec.offY - y; z = -z; } pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
    if (col) { tmp.setHex(pal[C[v]]).convertSRGBToLinear(); col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b; } }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals(); geo.computeBoundingSphere(); return geo;
}
const EMPTY = new THREE.BufferGeometry();
function bankPart(id) {
  if (catalog.has(id)) return catalog.get(id); const rec = BANK.index.get(id); if (!rec) return null;
  const entry = { id, name: id, h: Math.max(.1, rec.h), offsetY: rec.offY, bounds: rec.b, geometry: rec.main ? bankGeometry(rec, rec.main, false) : EMPTY, fixGeometry: rec.fix ? bankGeometry(rec, rec.fix, false) : null, rec };
  catalog.set(id, entry); return entry;
}
const FIXMAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .35, side: THREE.DoubleSide });
const ButterRepository = { load: async id => { if (!bankPart(id)) throw Error('Part not in the bank: ' + id); }, ensure: async () => { } };
/* ── the workspace's parts ── */
function partQuaternion(p) { return p.q ? new THREE.Quaternion(...p.q) : new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), (p.r || 0) * Math.PI / 2); }
function sync(p) { p.mesh.position.set(p.x, p.y, p.z); p.mesh.quaternion.copy(partQuaternion(p)); p.mesh.updateMatrixWorld(true); }
function create(row) { const d = bankPart(row.part); if (!d) throw Error('Unknown part ' + row.part); const p = { ...row }; p.mesh = new THREE.Mesh(d.geometry, material(p.color)); if (d.fixGeometry) p.mesh.add(new THREE.Mesh(d.fixGeometry, FIXMAT)); p.mesh.userData.partId = p.id; ButterSpatialRuntime.plate.add(p.mesh); S.parts.push(p); sync(p); return p; }
function restore(data) { S.parts.forEach(p => { ButterSpatialRuntime.plate.remove(p.mesh); p.mesh.material.dispose(); }); S.parts = []; PH.links.clear(); data.forEach(create); S.selected = new Set([...S.selected].filter(id => S.parts.some(p => p.id === id))); }
function rows() { return S.parts.map(p => ({ id: p.id, part: p.part, color: p.color, x: p.x, y: p.y, z: p.z, r: p.r, ...(p.q ? { q: p.q.slice() } : {}) })); }
function checkpoint() { return JSON.stringify(rows()); }
function bounds(p) { const d = catalog.get(p.part), b = d.bounds; return new THREE.Box3(V(b[0], 0, b[2]), V(b[1], d.h, b[3])).applyMatrix4(new THREE.Matrix4().compose(V(p.x, p.y, p.z), partQuaternion(p), V(1, 1, 1))); }
function selected() { return S.parts.filter(p => S.selected.has(p.id)); }
function union(parts = selected()) { const b = new THREE.Box3(); parts.forEach(p => b.union(bounds(p))); return b; }
function anchor() { const a = selected(); if (!a.length) return V(); const b = union(a), c = b.getCenter(V()); c.y = b.min.y; return c; }
function validate() { const moving = selected(), others = S.parts.filter(p => !S.selected.has(p.id)); for (const p of moving) { const b = bounds(p); if (b.min.y < -.1) return 'Below the workbench'; if (b.min.x < -400 || b.max.x > 400 || b.min.z < -400 || b.max.z > 400 || b.max.y > 600) return 'Outside the workbench'; const inner = b.clone().expandByScalar(-.12); for (const o of others) if (inner.intersectsBox(bounds(o).clone().expandByScalar(-.12))) return 'Overlaps'; } return ''; }
function choose(id, add = false) { if (S.tx) return; if (!add) S.selected.clear(); if (id != null) S.selected.add(id); }
function feedback(kind) { try { if (window.OG && OG.A) OG.A.sfx(kind === 'click' ? 'stud' : kind === 'grab' || kind === 'select' ? 'stud' : kind === 'place' || kind === 'impact' ? 'thud' : 'stud', { gain: kind === 'click' ? 1 : .4 }); } catch (e) { } }
function portPoint(p, port) { return V(...Beaver.transformPoint(p, port.p)); }
function auditContacts() { const out = []; for (const p of selected()) for (const cp of PORTS[p.part] || []) for (const other of S.parts) { if (S.selected.has(other.id)) continue; if (Math.abs(p.y - other.y) > Math.max(catalog.get(p.part).h, catalog.get(other.part).h) + 1) continue; for (const pp of PORTS[other.part] || []) { if (pp.gender === cp.gender) continue; const test = Beaver.physicalHandshake(other, pp, p, cp, { joint: 'stud-clutch' }); if (test.ok) out.push({ parent: other.id, child: p.id, point: portPoint(other, pp).toArray() }); } } return out; }
function findMagnet(radius = 19, previous = null) { const candidates = [], seen = new Set(), moving = selected(), base = moving.map(p => ({ p, x: p.x, y: p.y, z: p.z })); for (const p of moving) for (const other of S.parts) { if (S.selected.has(other.id)) continue; const pb = bounds(p), ob = bounds(other); if (!pb.clone().expandByScalar(radius + 8).intersectsBox(ob)) continue; for (const cp of PORTS[p.part] || []) for (const pp of PORTS[other.part] || []) { if (cp.gender === pp.gender) continue; const a = portPoint(other, pp), b = portPoint(p, cp), delta = a.clone().sub(b), key = p.id + ':' + cp.id + '>' + other.id + ':' + pp.id, d = delta.length(); if (d > (previous?.key === key ? radius + 8 : radius)) continue; const sig = delta.toArray().map(v => v.toFixed(2)).join(','); if (seen.has(sig)) continue; seen.add(sig); candidates.push({ delta, key, point: a, score: d - (previous?.key === key ? 5 : 0), p, other, cp, pp }); } }
  candidates.sort((a, b) => a.score - b.score); let answer = null; for (const c of candidates.slice(0, 48)) { base.forEach(({ p, x, y, z }) => { p.x = x + c.delta.x; p.y = y + c.delta.y; p.z = z + c.delta.z; }); if (!validate() && Beaver.physicalHandshake(c.other, c.pp, c.p, c.cp, { joint: 'stud-clutch' }).ok) { answer = c; break; } } base.forEach(({ p, x, y, z }) => { p.x = x; p.y = y; p.z = z; }); return answer; }
function begin(source) { if (S.tx || !selected().length) return false; for (const [k] of PH.links) if (k.split('|').some(id => S.selected.has(id))) PH.links.delete(k); S.tx = { source, noThrow: true, before: checkpoint(), base: rows().filter(p => S.selected.has(p.id)), origin: anchor(), plane: S.plane, rawDelta: V(), depthOffset: 0, magnet: null }; feedback('grab'); return true; }
function propose(delta) { if (!S.tx) return; const t = S.tx; t.rawDelta.copy(delta); t.base.forEach(b => { const p = S.parts.find(p => p.id === b.id); p.x = b.x + delta.x; p.y = b.y + delta.y; p.z = b.z + delta.z; if (b.q) p.q = b.q.slice(); sync(p); }); const prev = t.magnet; t.magnet = S.snap ? findMagnet(30, prev) : null; if (t.magnet) selected().forEach(p => { p.x += t.magnet.delta.x; p.y += t.magnet.delta.y; p.z += t.magnet.delta.z; sync(p); }); }
function finish(commit = true) { if (!S.tx) return; const t = S.tx, fail = commit ? validate() : ''; S.tx = null; if (!commit || fail) { restore(JSON.parse(t.before)); feedback('blocked'); return; } const contacts = auditContacts(); contacts.forEach(c => bond(c.parent, c.child)); feedback(contacts.length ? 'click' : 'place'); }
/* ── the hand model's entry: the tracks go to the game (the same hook the desktop page patches in) ── */
const H = { active: false, tracks: [], memory: null, next: 1 };
function processHands(marks, now) { const tracks = trackHands(marks, now); if (window.OdysseyHands) OdysseyHands.take(tracks, now); }
async function startHands() { if (H.active) return; const v = $('#video'); const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false }); v.srcObject = stream; await v.play(); H.stream = stream; H.tracker = await makeHandWorker(); H.active = true; H.busy = false; H.tracker.worker.onmessage = ({ data: d }) => { if (d.type === 'result') { H.busy = false; const m = d.landmarks || []; m.forEach((x, i) => { const h = d.handedness?.[i]?.[0]; x.identity = h?.score > .8 ? h.categoryName : null; }); processHands(m, performance.now()); } }; }
function stopHands() { H.active = false; if (H.stream) H.stream.getTracks().forEach(t => t.stop()); H.stream = null; try { H.tracker?.close(); } catch (e) { } H.tracker = null; }
function pumpHands(now) { const v = $('#video'); if (!H.active || H.busy || now - (H.lastRequest || 0) < 40 || v.readyState < 2) return; H.busy = true; H.lastRequest = now; createImageBitmap(v).then(bitmap => { if (!H.tracker) { bitmap.close(); H.busy = false; return; } H.tracker.worker.postMessage({ type: 'frame', time: now, frame: bitmap }, [bitmap]); }).catch(() => { H.busy = false; }); }
/* ── actors: the minifig rig of world/minifig.js with parts from the bank, in the LDraw frame the rig mounts ── */
function ldrawGroup(part, color) { bankPart(part); const rec = BANK.index.get(part), g = new THREE.Group(); if (!rec) return g; const key = part + ':ld'; let geo = catalog.get(key); if (!geo) { geo = { main: rec.main ? bankGeometry(rec, rec.main, true) : null, fix: rec.fix ? bankGeometry(rec, rec.fix, true) : null }; catalog.set(key, geo); }
  if (geo.main) g.add(new THREE.Mesh(geo.main, material(color === 16 ? 15 : color))); if (geo.fix) g.add(new THREE.Mesh(geo.fix, FIXMAT)); return g; }
const ButterPerformer = { state: { on: false, rig: null }, async makeActor(def) { const rig = Minifig.skeleton(40, def); const groups = Minifig.partsOf(def).map(([slot, part, color]) => ldrawGroup(part, color)); Minifig.mount(rig, groups, def, ButterSpatialRuntime.plate); rig.pos.set(0, 0, -215); rig.figure.scale.setScalar(1.65); return rig; } };
const ButterScenes = { busy: false, async load(doc) { restore(doc.parts || []); } };
const ButterCast = { cast: [1] };
const WagWorkshop = { ready: () => S.ready, processHands, gesture: t => gestureOf(t), handState: () => ({}), tracker: () => ({ active: H.active }) };
function startSound() { }
/* ── boot: the bank from the page, the loop ── */
async function bootBank() {
  const b64 = document.getElementById('og-bank').textContent.trim(), raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  let buf; if (window.DecompressionStream) buf = await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); else throw Error('This browser cannot unpack the game (DecompressionStream).');
  const len = new DataView(buf).getUint32(0, true), header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, len))), pad = (4 - ((4 + len) % 4)) % 4, data = buf.slice(4 + len + pad);
  BANK.header = header; BANK.buf = data; BANK.index = new Map(header.parts.map(p => [p.id, p])); COLORS = header.ldc.map(([code, hex]) => ({ code, hex }));
  window.OG_BANK = header;
}
function resize() { const r = $('#stage').getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height); if (w < 1 || h < 1 || (resize.w === w && resize.h === h)) return; resize.w = w; resize.h = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
function animate(now) { requestAnimationFrame(animate); if (document.hidden) return; resize(); pumpHands(now); try { ButterSpatialRuntime.frame(now); } catch (e) { console.error(e); } if (window.OdysseyRenderGate && !OdysseyRenderGate(now)) return; renderer.render(scene, camera); }
Object.assign(window, { WagWorkshop, ButterCast, ButterPerformer, ButterScenes, ButterRepository, ButterSpatialRuntime });   // the workspace's modules are window properties there too
window.ButterLite = { ready: bootBank().then(() => { S.ready = true; requestAnimationFrame(animate); }) };
