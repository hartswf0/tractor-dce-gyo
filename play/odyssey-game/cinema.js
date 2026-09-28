/* play/odyssey-game/cinema.js — a kept scene of the Regulars' Cut played as a voiced cinematic in Hand Butter.

   STAGE   the scene's Butter card (odyssey/butter/<id>.json: the foraged set, its baked cast with their printed heads),
           drawn with Hand Butter's own part geometry (E.cardGroup: catalog parts, others fetched through ButterRepository),
           on a studded sea under the scene's sky (the keyframe look where the scene has one).
   SOUND   the scene's kept segments as one clip (cut/<id>.ogg, the cut clock: 0.45 s breaths), captions per segment (the
           speaker in capitals and the authored line for dialogue, narration in grey italic), the book's bed ducked under
           every segment by the take's law (0.18 → 0.10, 150 ms).
   CAMERA  where the scene has gate-checked keyframes (odyssey/keyframes/<id>.json), their key cameras in order across the
           segments; elsewhere an automatic coverage from the card itself — a wide on the set, then mid and close shots
           on the cast (the baked minifig heads, part 3626*), cutting on the segment seams, each shot drifting slowly.
   TOUCH   where the story offers one (story.json), a small hand action on the moment's object: it lights for the length of
           its segment, answers the hand (or mouse, or Space), and never holds the scene.
   A scene can always be watched through, or skipped (S). */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const C = OG.C = { item: null, t: 0, playing: false };
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const hash = s => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
const DARK = /Cave|Cyclops|Blinding|Rams|Night|Dead|Blood|Shade|Tiresias|Anticleia|Achilles|Pit|Seals|Killings|Nobody|Dream|Lamp/;
function lookFor(item, kf) {
  const L = kf && kf.look;
  if (L && L.sky) return { bg: new THREE.Color(L.sky[0]).getHex(), fog: L.fog ? [new THREE.Color(L.sky[0]).getHex(), L.fog[0] + 300, L.fog[1] + 900] : null, sea: '#23506f', dim: L.dim || 0 };
  if (DARK.test(item.title)) return { bg: 0x0d1118, fog: [0x0d1118, 700, 2000], sea: '#101c27', dim: .3 };
  return { bg: 0x9cc4dd, fog: [0x9cc4dd, 1100, 3200], sea: '#23628e', dim: 0 };
}
C.load = async function (item) {
  const E = OG.E; let kf = null;
  if (item.keyframes) { try { kf = await (await fetch('../odyssey/keyframes/' + item.id + '.json')).json(); } catch (e) { kf = null; } }
  const look = lookFor(item, kf);
  E.clearProps(); E.removeActors(); E.clearParts(); E.setView({ bg: look.bg, floor: null, fog: look.fog });
  E.hemi.intensity = look.dim ? .22 : .38;
  if (look.dim) { E.glow.intensity = 1.6; E.glow.position.set(-60, 90, -30); E.glow.distance = 700; }
  E.add(E.sea({ color: look.sea }));
  let group = null;
  if (!OG.ST || !OG.ST.noStage) { group = await E.cardGroup(item.id, { budget: 20000 }); E.add(group); }
  const st = { kf, look, group }; C.faces = [];
  if (group && window.Face && window.HalfFace) try { C.faces = await C.dress(item, group); } catch (e) { console.warn('[cinema faces]', e); }
  return st;
};
/* the halfworld faces on the baked cast: the previs (odyssey/previs/<id>.json) says where each figure of the card stands; a
   figure who is one of the twelve (Odysseus, Athena, Penelope, Telemachus, Polyphemus…) gets the halfworld's own drawing of
   that face as a decal on its head, the nearest head of the card to where the previs puts it (each head taken once). */
const TWELVE = ['odysseus', 'athena', 'penelope', 'telemachus', 'nestor', 'eumaeus', 'circe', 'nausicaa', 'helen', 'eurycleia', 'alcinous', 'polyphemus'];
C.dress = async function (item, group) {
  let pv = null; try { const r = await fetch('../odyssey/previs/' + item.id + '.json'); if (r.ok) pv = await r.json(); } catch (e) { }
  if (!pv || !pv.cast) return [];
  const heads = group.userData.heads.map(p => ({ p, used: false })), out = [], want = [];
  for (const c of pv.cast) { const m = /^character\.([a-z]+)/.exec(c.who || ''); if (!m || !TWELVE.includes(m[1]) || !Array.isArray(c.at)) continue; want.push({ who: m[1], x: c.at[0], z: -c.at[2] }); }
  const pairs = []; for (const w of want) heads.forEach((h, i) => pairs.push({ w, i, d: Math.hypot(h.p.x - w.x, h.p.z - w.z) })); pairs.sort((a, b) => a.d - b.d);
  const done = new Set(); try { await OG.E.ensureParts(['3626b']); } catch (e) { }
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const { w, i, d } of pairs) { if (d > 50 || done.has(w) || heads[i].used) continue; done.add(w); heads[i].used = true; const h = heads[i].p;
    /* the printed head of the card makes way for a plain one, so the halfworld's face is the only face */
    if (catalog.has('3626b')) { for (const m of group.children) if (m.isInstancedMesh && m.userData.rows) { const k = m.userData.rows.indexOf(h); if (k >= 0) { m.setMatrixAt(k, zero); m.instanceMatrix.needsUpdate = true; } }
      const plain = OG.E.brick('3626b', 14, h.x, h.y, h.z, h.r || 0); if (h.q) plain.quaternion.set(...h.q); group.add(plain); }
    const slot = new THREE.Object3D(); slot.position.set(h.x, h.y + 21, h.z); if (h.q) slot.quaternion.set(...h.q); else slot.rotation.y = (h.r || 0) * Math.PI / 2; const flip = new THREE.Object3D(); flip.scale.set(1, -1, -1); slot.add(flip); group.add(slot);
    const face = Face.attach({ slots: { head: flip }, def: { hat: null } }, 'halfworld:' + w.who, THREE); if (face) out.push({ who: w.who, face, blinkAt: 1 + Math.random() * 3, last: 0 }); }
  return out;
};
C.paintFaces = function (now) {
  const item = C.item, seg = item && item.segs[C.segi]; const speaker = seg && seg.isLine ? String(seg.speaker || '').toLowerCase() : '';
  for (const f of C.faces || []) { if (now - f.last < 100) continue; f.last = now; const v = {}, t = now / 1000; if (t > f.blinkAt) { v.blink = 1; if (t > f.blinkAt + .14) f.blinkAt = t + 2.5 + Math.random() * 3; }
    if (speaker && speaker.includes(f.who)) { const m = OG.A.level(); if (m > .04) { v['mouth.jaw'] = Math.round(Math.min(1, m * 1.4) * 10) / 10; v['mouth.wide'] = .2; } }
    try { Face.paint(f.face, v); } catch (e) { } }
};
/** occlusion by the set, from the card's own rows: a part's centre within `r` of the sight line (short of the subject) blocks it */
function blocked(pts, cam, target, r = 20) {
  const d = target.clone().sub(cam), L = d.length(); d.normalize(); let hits = 0;
  for (const p of pts) { const v = p.clone().sub(cam), u = v.dot(d); if (u < -10 || u > L - 45) continue; const off = v.addScaledVector(d, -u).length(); if (u < 70 && off < 16 + u * .45) return true; /* a figure or a column right at the lens fills the frame */ if (off < r) { hits++; if (hits > 1) return true; } }
  return false;
}
/** the nearest clear camera to `pos` looking at `target`: turn about the subject, rise, pull back */
function clear(pts, pos, target) {
  if (!pts.length || !blocked(pts, pos, target)) return pos;
  const rel = pos.clone().sub(target), dist = rel.length(), az = Math.atan2(rel.x, rel.z), el = Math.asin(Math.max(-1, Math.min(1, rel.y / dist)));
  for (const [da, de, k] of [[.35, 0, 1], [-.35, 0, 1], [0, .25, 1], [.7, .1, 1], [-.7, .1, 1], [0, .45, 1.1], [1.1, .25, 1], [-1.1, .25, 1], [0, .7, 1.3]]) {
    const a = az + da, e = Math.min(1.35, el + de), d = dist * k, c = target.clone().add(V3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(d));
    if (!blocked(pts, c, target)) return c; }
  return target.clone().add(V3(Math.sin(az) * .5, 1.2, Math.cos(az) * .5).normalize().multiplyScalar(dist * 1.2));
}
/** the shots: [{from: {pos, look, fov}, to: {...}, t0, t1}] over the scene's own clock */
C.plan = function (item, st) {
  const shots = [], segs = item.segs.length ? item.segs : [{ at: 0, dur: item.seconds }], n = segs.length;
  const edges = segs.map((s, i) => [i ? s.at - 0.2 : 0, i < n - 1 ? segs[i + 1].at - 0.2 : item.seconds + 1]);
  if (st.kf && st.kf.keys && st.kf.keys.length) {
    const keys = st.kf.keys.map(k => resolveKey(k, st)).filter(Boolean); if (keys.length && keys.length < st.kf.keys.length) { const auto = C.plan(item, { ...st, kf: null }); let j = 0; return segs.map((sg, i) => { const k0 = st.kf.keys[Math.min(st.kf.keys.length - 1, Math.floor(i * st.kf.keys.length / n))], k = resolveKey(k0, st); if (!k) return auto[i]; const pts = centres(st), pos = clear(pts, k.pos, k.look), back = pos.clone().sub(k.look).multiplyScalar(.05), [t0, t1] = edges[i]; return { t0, t1, from: { pos: pos.clone().add(back), look: k.look, fov: k.fov }, to: { pos: pos.clone().sub(back), look: k.look, fov: k.fov }, kind: 'key', head: k.head || null }; }); }
    if (keys.length === st.kf.keys.length) { const pts = centres(st); segs.forEach((s, i) => { const k = keys[Math.min(keys.length - 1, Math.floor(i * keys.length / n))], [t0, t1] = edges[i];
      const pos = clear(pts, k.pos, k.look), back = pos.clone().sub(k.look).multiplyScalar(0.05); shots.push({ t0, t1, from: { pos: pos.clone().add(back), look: k.look, fov: k.fov }, to: { pos: pos.clone().sub(back), look: k.look, fov: k.fov }, kind: 'key', head: k.head || null }); }); return shots; }
  }
  const g = st.group, box = new THREE.Box3(V3(-300, 0, -300), V3(300, 120, 300));
  if (g && g.userData.rows.length) { box.makeEmpty(); for (const p of g.userData.rows) box.expandByPoint(V3(p.x, p.y, p.z)); box.max.y += 24; }
  const c = box.getCenter(V3()), size = box.getSize(V3()), R = Math.min(420, Math.max(160, Math.max(size.x, size.z) / 2));
  const heads = (g ? g.userData.heads : []).map(p => V3(p.x, p.y + 14, p.z)), pts = centres(st);
  const cast = heads.length ? heads.reduce((a, p) => a.add(p), V3()).multiplyScalar(1 / heads.length) : V3(c.x, 40, c.z);
  const h = hash(item.id), az0 = ((h % 1000) / 1000 - .5) * .9, fov = 40, pick = i => heads.length ? heads[(h + i * 7) % heads.length] : cast;
  const at = (target, dist, elev, az) => target.clone().add(V3(Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev)).multiplyScalar(dist));
  const GRAMMAR = ['WIDE', 'MID', 'CLOSE', 'MID', 'WIDE', 'CLOSE', 'MID', 'CLOSE'];
  segs.forEach((s, i) => {
    const kind = i === 0 ? 'WIDE' : GRAMMAR[(i + (h % 3)) % GRAMMAR.length], [t0, t1] = edges[i];
    let target, dist, elev, az = az0 + ((i * 0.61) % 1 - .5) * .8;
    if (kind === 'WIDE') { target = V3(c.x, Math.min(60, c.y), c.z); dist = R * 1.0 / Math.tan(fov * Math.PI / 360); elev = .6; az = az0; }
    else if (kind === 'MID') { target = cast.clone().add(V3(0, 6, 0)); dist = Math.max(260, R * .9); elev = .38; }
    else { target = pick(i).clone(); dist = 150; elev = .16; }
    const pc = clear(pts, at(target, dist, elev, az), target), rel = pc.clone().sub(target), p0 = target.clone().add(rel.clone().multiplyScalar(1.04)), p1 = target.clone().add(rel.clone().multiplyScalar(.96)), f = kind === 'CLOSE' ? 34 : fov;
    const look = kind === 'CLOSE' ? headroom(pc, target, f).look : target;
    shots.push({ t0, t1, from: { pos: p0, look, fov: f }, to: { pos: p1, look, fov: f }, kind, head: kind === 'CLOSE' && heads.length ? target.clone() : null });
  });
  C.cast = cast; return shots;
};
/** a shot on a person: the head on the upper third of the frame (the look point dropped below it), the head kept for the tests */
function headroom(pos, head, fov) { if (head.face) { const rel = pos.clone().sub(head), k = rel.dot(head.face); if (k < 0) pos = head.clone().add(rel.addScaledVector(head.face, -2 * k)); /* the camera goes round to the face: a baked figure may face the other way from the film's restaged one */ }
  const d = pos.distanceTo(head), look = head.clone().add(V3(0, -d * Math.tan(fov * Math.PI / 360) * .33, 0)); const h = head.clone(); h.face = head.face; return { pos, look, fov, head: h }; }
function centres(st) { return st.group ? st.group.userData.rows.filter(p => p.y > 2 || !/^(3032|3031|3036|3035|3034|3033|3030|3958|3811|3867|4186|3068b|3070b|3069b|2431|6636|4162|3024|3023|3022|3020|3021|3710|3666|3460|3795|3832|2445|41539|91405|92438|3865)$/.test(p.part)).map(p => V3(p.x, p.y + 12, p.z)) : []; }
function resolveKey(k, st) {
  const c = k.camera; if (!c) return null;
  const heads = st.group ? st.group.userData.heads : [];
  const atHead = (x, z) => { let best = null, bd = 70; for (const h of heads) { const d = Math.hypot(h.x - x, h.z - z); if (d < bd) { bd = d; best = h; } } if (!best) return null; const v = V3(best.x, best.y + 14, best.z), q = best.q ? new THREE.Quaternion(...best.q) : new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), (best.r || 0) * Math.PI / 2); v.face = V3(0, 0, 1).applyQuaternion(q).setY(0).normalize(); return v; };
  const find = ref => { if (!ref) return null; const name = String(ref).replace(/^@/, '').split('.')[0]; const pr = (k.props || []).find(p => p.id === name || p.name === name); if (pr && Array.isArray(pr.at)) return atHead(pr.at[0], pr.at[2]) || V3(pr.at[0], (pr.at[1] || 0) + 40, pr.at[2]); const b = (k.blocking || []).find(b => b.id === name) || (st.kf.keys || []).flatMap(x => x.blocking || []).find(b => b.id === name); if (b) { const h = atHead(b.x, b.z); if (h) { h.head = true; return h; } return V3(b.x, 62, b.z); } return null; };

  const ok = v => v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
  if (c.type === 'wide' && Array.isArray(c.pos)) { const named = !Array.isArray(c.target); const look = named ? find(c.target || c.subject) : V3(...c.target); if (!ok(look)) return null; const pos = V3(...c.pos); if (!ok(pos)) return null; return named ? headroom(pos, look, c.fov || 40) : { pos, look, fov: c.fov || 40 }; }
  if (c.type === 'orbit') { const a = find(c.around); if (!a) return null; return { pos: a.clone().add(V3(Math.sin(c.az) * c.r, c.h, Math.cos(c.az) * c.r)), look: a, fov: c.fov || 45 }; }
  if (c.type === 'hero') { const a = find(c.a); if (!a) return null; return headroom(a.clone().add(V3(Math.sin(c.yaw || 0) * c.dist, 10, Math.cos(c.yaw || 0) * c.dist)), a, c.fov || 35); }
  return null;
}
/** play one scene item; resolves {skipped, touched} */
C.play = async function (item, book) {
  const E = OG.E, H = OG.H, A = OG.A; C.item = item; C.t = 0; C.skip = false; C.touched = false; C.done = null;
  H.loading(true, item.title);
  const st = await C.load(item); C.st = st; C.shots = C.plan(item, st); C.shot = -1; C.segi = -1; C.touch = item.touch ? { ...item.touch, state: 'wait' } : null;
  H.loading(false); C.playing = true; H.cue(null);
  H.scene(book, item);
  const fast = E.timeScale > 1.5; A.scene(fast ? null : item.file);
  return new Promise(resolve => { C.done = resolve; });
};
/** the tests' eye: how much of the rendered frame is one flat colour (0..1); an empty sky or a wall in the lens reads near 1 */
C.uniformity = function () { const src = renderer.domElement, c = C._cv || (C._cv = document.createElement('canvas')); c.width = 96; c.height = 60; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0, 96, 60); const d = g.getImageData(0, 0, 96, 60).data, bins = new Map(); for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4); bins.set(k, (bins.get(k) || 0) + 1); } return Math.max(...bins.values()) / (d.length / 4); };
C.seek = function (t) { C.t = t; };
C.end = function (skipped) {
  if (!C.playing) return; C.playing = false; OG.A.sceneStop(); OG.H.caption(null); OG.H.cue(null); OG.H.meters([]); const r = { skipped: !!skipped, touched: C.touched, id: C.item.id };
  const d = C.done; C.done = null; if (d) d(r);
};
C.frame = function (dt) {
  if (!C.playing) return; const E = OG.E, H = OG.H, A = OG.A, item = C.item;
  const clk = A.sceneClock(); C.t = clk != null ? Math.max(C.t, clk) : C.t + dt; const t = C.t;
  if (C.skip) return C.end(true);
  // the shot
  let si = C.shots.findIndex(s => t >= s.t0 && t < s.t1); if (si < 0) si = C.shots.length - 1;
  const s = C.shots[si]; if (s && !(Number.isFinite(s.from.pos.x + s.from.pos.y + s.from.pos.z + s.from.look.x + s.from.look.y + s.from.look.z))) { C.shots[si] = C.shots.find(x => x.kind === 'WIDE') || C.plan(item, { ...C.st, kf: null })[0]; }
  if (s) { const u = E.smooth((t - s.t0) / Math.max(.1, s.t1 - s.t0)); const pos = s.from.pos.clone().lerp(s.to.pos, u); E.setCamera(pos.toArray(), s.from.look.toArray(), { fov: s.from.fov }); C.shot = si; }
  // the segment: caption, duck
  const segi = item.segs.findIndex(g => t >= g.at && t < g.at + g.dur);
  if (segi !== C.segi) { C.segi = segi; if (segi >= 0) { const g = item.segs[segi]; H.caption(g.speaker, g.caption, g.isLine); A.duck(true); } else { H.caption(null); A.duck(false); } }
  // the touch
  const T = C.touch; if (T) C.touchFrame(T, dt);
  C.paintFaces(performance.now());
  H.progress(t / item.seconds);
  if (t >= item.seconds) C.end(false);
};
/* ── touches ── */
C.touchTarget = function () { const p = C.cast || V3(0, 40, 0); return OG.E.toScreen(p); };
C.touchFrame = function (T, dt) {
  const H = OG.H, In = OG.In, item = C.item, seg = item.segs[T.seg] || item.segs[0], start = seg ? seg.at : 1, end = Math.max(start + 8, seg ? seg.at + seg.dur : 9);
  if (T.state === 'wait' && C.t >= start) { T.state = 'on'; T.t = 0; T.since = performance.now(); T.hold = 0; In.pressPose = T.verb === 'fist' ? 'fist' : T.verb === 'point' ? 'point' : 'pinch'; H.cue(ICON[T.verb] || 'pinch', 'THE HAND · ' + T.thing.toUpperCase(), T.text + (In.source === 'hand' ? '' : In.source === 'key' ? ' (or press Space)' : ' (or click it)')); OG.A.sfx('stud', { gain: .5 }); }
  if (T.state !== 'on') return;
  T.t += dt; const tg = C.touchTarget(), c = In.primary(), near = c && Math.hypot((c.x - tg.x) * 1.6, c.y - tg.y) < 0.12;
  H.ring(tg.x, tg.y, 26 + Math.sin(performance.now() / 200) * 3, '#ffe28a', { width: 3, label: T.thing.toUpperCase(), progress: T.hold > 0 ? Math.min(1, T.hold) : null });
  let ok = false; const hand = c && c.src === 'hand', since = T.since;
  switch (T.verb) {
    case 'pinch': ok = near && c.down; break;
    case 'fist': ok = hand ? (near && c.pose === 'fist') : (near && c.down); break;
    case 'point': if ((hand && c.pose === 'point' && near) || (!hand && near && c.down)) T.hold += dt / (hand ? 1.0 : .5); else T.hold = Math.max(0, T.hold - dt); ok = T.hold >= 1; break;
    case 'open': if (hand ? c.pose === 'open' : (near && c.down)) T.hold += dt / (hand ? 1.0 : .4); else T.hold = Math.max(0, T.hold - dt); ok = T.hold >= 1; break;
    case 'thrust': ok = hand ? In.R.thrust(c.id, { since }) : (c.down && near) || In.R.thrust(c.id, { since }); break;
    case 'circle': ok = Math.abs(In.R.turns(c.id, { since, needDown: !hand })) >= 1; break;
    case 'pump': ok = In.R.strokes(c.id, { since, needDown: !hand }) >= 3; break;
    case 'weave': ok = In.R.strokes(c.id, { since, key: 'px', amp: .06, needDown: !hand }) >= 3; break;
    case 'pour': if (near && c.down) T.pourY = T.pourY ?? c.y; if (c.down && T.pourY != null) ok = c.y - T.pourY > .06 || (!hand && near); if (!c.down) T.pourY = null; break;
  }
  if (In.key.down && In.source === 'key') ok = true;
  if (ok) { T.state = 'done'; C.touched = true; OG.A.sfx(SFX[T.verb] || 'stud'); H.flash('✓ ' + T.thing, 'good'); H.cue(null); OG.ST && OG.ST.touchDone(item.id); OG.E.burst && OG.E.burst(C.cast || V3(0, 40, 0)); }
  else if (C.t > end) { T.state = 'missed'; H.cue(null); }
};
const ICON = { pinch: 'pinch', fist: 'fist', point: 'point', open: 'open', thrust: 'thrust', circle: 'circle', pump: 'pump', weave: 'steer', pour: 'pinch' };
const SFX = { pinch: 'stud', fist: 'thud', point: 'studs-final', open: 'breath', thrust: 'rock', circle: 'creak', pump: 'splash-small', weave: 'ticks', pour: 'splash-small' };
})();
