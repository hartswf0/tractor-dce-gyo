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
  let pv = null; try { const r = await fetch('../odyssey/previs/' + item.id + '.json'); if (r.ok) pv = await r.json(); } catch (e) { }
  const st = { kf, look, group, pv, dir: C.direction(item) }; C.faces = [];
  if (group && window.Face && window.HalfFace) try { C.faces = await C.dress(item, group, pv); } catch (e) { console.warn('[cinema faces]', e); }
  return st;
};
/* the halfworld faces on the baked cast: the previs (odyssey/previs/<id>.json) says where each figure of the card stands; a
   figure who is one of the twelve (Odysseus, Athena, Penelope, Telemachus, Polyphemus…) gets the halfworld's own drawing of
   that face as a decal on its head, the nearest head of the card to where the previs puts it (each head taken once). */
const TWELVE = ['odysseus', 'athena', 'penelope', 'telemachus', 'nestor', 'eumaeus', 'circe', 'nausicaa', 'helen', 'eurycleia', 'alcinous', 'polyphemus'];
C.dress = async function (item, group, pv) {
  if (pv === undefined) try { const r = await fetch('../odyssey/previs/' + item.id + '.json'); if (r.ok) pv = await r.json(); } catch (e) { }
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
function blocked(pts, cam, target, r = 20, strict = false) {
  const d = target.clone().sub(cam), L = d.length(); d.normalize(); let hits = 0;
  if (strict && SOLID) { /* a close shot: nothing of the set on the line to the subject, nor across a fifth of the lens (a mast, a spear, a column) */
    if (SOLID(cam, d, L - 25)) return true; const right = V3().crossVectors(d, V3(0, 1, 0)).normalize(), up = V3().crossVectors(right, d).normalize(), w = L * .3; let n = 0, hit = 0;
    for (const x of [-1, -.5, 0, .5, 1]) for (const y of [-.8, 0, .8]) { if (!x && !y) continue; n++; const q = target.clone().addScaledVector(right, x * w).addScaledVector(up, y * w).sub(cam), l = q.length(); if (SOLID(cam, q.normalize(), Math.min(l, L) * .8)) hit++; }
    if (hit / n > .2) return true; }
  /* a big part (a sail, a wall) whose centre is far off can still fill the lens: nothing of the set within 30 LDU along the sight line */
  if (SOLID && SOLID(cam, d, Math.min(30, L - 45))) return true;
  for (const p of pts) { const v = p.clone().sub(cam), u = v.dot(d); if (u < -10 || u > L - 45) continue; const off = v.addScaledVector(d, -u).length(); if (u < 70 && off < 16 + u * .45) return true; /* a figure or a column right at the lens fills the frame */ if (off < r) { hits++; if (hits > 1) return true; } }
  return false;
}
/** the nearest clear camera to `pos` looking at `target`: turn about the subject, rise, pull back */
function clear(pts, pos, target, strict = false) {
  if (!pts.length || !blocked(pts, pos, target, 20, strict)) return pos;
  const rel = pos.clone().sub(target), dist = rel.length(), az = Math.atan2(rel.x, rel.z), el = Math.asin(Math.max(-1, Math.min(1, rel.y / dist)));
  for (const [da, de, k] of [[.35, 0, 1], [-.35, 0, 1], [0, .25, 1], [.7, .1, 1], [-.7, .1, 1], [0, .45, 1.1], [1.1, .25, 1], [-1.1, .25, 1], [0, .7, 1.3]]) {
    const a = az + da, e = Math.min(1.35, el + de), d = dist * k, c = target.clone().add(V3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(d));
    if (!blocked(pts, c, target, 20, strict)) return c; }
  if (strict) { const p = clear(pts, pos, target, false); p.loose = true; return p; }   /* no clear line anywhere: the ordinary test, marked */
  return target.clone().add(V3(Math.sin(az) * .5, 1.2, Math.cos(az) * .5).normalize().multiplyScalar(dist * 1.2));
}
/** the shots: [{from: {pos, look, fov}, to: {...}, t0, t1}] over the scene's own clock */
C.planGrammar = function (item, st) {
  const shots = [], segs = item.segs.length ? item.segs : [{ at: 0, dur: item.seconds }], n = segs.length;
  const edges = segs.map((s, i) => [i ? s.at - 0.2 : 0, i < n - 1 ? segs[i + 1].at - 0.2 : item.seconds + 1]);
  if (st.kf && st.kf.keys && st.kf.keys.length) {
    const keys = st.kf.keys.map(k => resolveKey(k, st)).filter(Boolean); if (keys.length && keys.length < st.kf.keys.length) { const auto = C.planGrammar(item, { ...st, kf: null }); let j = 0; return segs.map((sg, i) => { const k0 = st.kf.keys[Math.min(st.kf.keys.length - 1, Math.floor(i * st.kf.keys.length / n))], k = resolveKey(k0, st); if (!k) return auto[i]; const pts = centres(st), pos = clear(pts, k.pos, k.look), back = pos.clone().sub(k.look).multiplyScalar(.05), [t0, t1] = edges[i]; return { t0, t1, from: { pos: pos.clone().add(back), look: k.look, fov: k.fov }, to: { pos: pos.clone().sub(back), look: k.look, fov: k.fov }, kind: 'key', head: k.head || null }; }); }
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
/* ── THE CUT BY THE SIGN SCORE ─────────────────────────────────────────────────────────────────────────────────────────────
   Each scene's direction (OG.DIR: play/odyssey-game/directions.js, generated from odyssey/cineosis/score.json by
   tools/odyssey-directions.js; odyssey/cineosis/WIRING.md) cuts it. C.cut lays the shots on the scene clock, C.planDirected
   frames them:
     cut_rhythm     the shot lengths, drawn from the take's RHYTHM table (odyssey-take.js), seeded by scene id and segment
     hold_min_s     the floor: every draw is at least this long, and a shorter shot (a short segment, a tail) merges into its
                    neighbour, so the cut skips that seam
     sound_forward  the cut leaves the segment seams: one grid on the scene clock, and a cut within 0.9 s of a line's start moves
                    1.2 s after it (the sound leads, the picture follows); the bed is not ducked under the voice
     tempo_conflict the sign governs inside the scene; the book's rhythm governs its transitions: the entry shot and the exit
                    shot are cut at the book's length (EDGE), whatever the scene's floor
     shot_bias      each shot's kind (WIDE, MID, CLOSE, OBJ) drawn from the weights; the opening is the establishing WIDE; a kind
                    weighted 0.2 or more that the draw missed is given to the longest shot
     empty_frame    (or an any-space-whatever, As, among the signs) the scene opens on the set's own wide with no figure in it
     subject        the CLOSE shots are on this figure's head (the previs says which baked figure it is), turned to its face
     insert_object  the OBJ shots are on this thing (matched by name to the previs cast: a prop, a creature); else the subject's hands
     move           every shot's camera move: push, pull, track, orbit, crane, or hold (it replaces the old fixed 1.04 → 0.96 drift),
                    played on twos (12 steps a second, the stop-motion camera)
   and two figures read off the primary sign itself: MARK (Mk) cuts a series of matched frames (one kind, one angle, one move);
   DEMARK (Dm) the same series broken by its last shot, held at least two floors long on the insert object.
   Keyframed scenes keep their gate-checked key cameras for the MID shots (and for CLOSE where the key is on a head). */
const RHYTHM = { fast: [1.6, 2.4, 1.2, 2.0, 3.0, 1.4], mid: [3.2, 4.4, 2.4, 5.0, 3.6, 2.8], slow: [6.0, 8.5, 5.0, 9.5, 7.0] };
const EDGE = { fast: 3.0, mid: 4.4, slow: 7.0 };
const rand = seed => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
C.noDirect = typeof location !== 'undefined' && /[?&]grammar\b/.test(location.search);
C.direction = item => (!C.noDirect && OG.DIR && OG.DIR[item.id]) || null;
/** the cut as times and kinds (no cameras): [{t0, t1, kind, seg, move, series?, edge?, why?}]; pure and seeded */
C.cut = function (item, dir) {
  const d = dir.d, segs = item.segs.length ? item.segs : [{ at: 0, dur: item.seconds }], n = segs.length, T = item.seconds + 1;
  const R = RHYTHM[d.cut_rhythm] || RHYTHM.mid, floor = Math.max(1, d.hold_min_s || 0), fwd = !!d.sound_forward, seams = segs.slice(1).map(s => s.at - .2);
  const blocks = fwd ? [[0, T, 0]] : segs.map((s, i) => [i ? s.at - .2 : 0, i < n - 1 ? segs[i + 1].at - .2 : T, i]);
  let shots = [];
  for (const [a, b, si] of blocks) { const r = rand(hash(item.id + ':' + si)); let x = a;
    while (x < b - .01) { let len = Math.max(floor, R[Math.floor(r() * R.length)]); if (b - (x + len) < floor) len = b - x; shots.push({ t0: x, t1: x + len }); x += len; } }
  if (fwd) { for (const sh of shots.slice(1)) { const m = seams.find(m => Math.abs(sh.t0 - m) < .9); if (m != null) sh.t0 = m + 1.2; } for (let i = 1; i < shots.length; i++) shots[i - 1].t1 = shots[i].t0; }
  for (let i = 0; i < shots.length && shots.length > 1; i++) { const sh = shots[i]; if (sh.t1 - sh.t0 >= floor - 1e-6) continue; if (i === 0) shots[1].t0 = sh.t0; else shots[i - 1].t1 = sh.t1; shots.splice(i, 1); i--; }
  if (d.tempo_conflict && EDGE[d.book_tempo]) { const e = EDGE[d.book_tempo], f = shots[0];
    if (f.t1 - f.t0 > e + .5) { if (f.t1 - f.t0 >= e + floor || !shots[1]) shots.splice(1, 0, { t0: f.t0 + e, t1: f.t1 }); else shots[1].t0 = f.t0 + e; f.t1 = f.t0 + e; } f.edge = 'in';
    const L = shots[shots.length - 1];
    if (shots.length > 1 && L.t1 - L.t0 > e + .5) { const c = L.t1 - e; if (c - L.t0 >= floor) { shots.push({ t0: c, t1: L.t1 }); L.t1 = c; } else { shots[shots.length - 2].t1 = c; L.t0 = c; } } shots[shots.length - 1].edge = 'out'; }
  const B = d.shot_bias || { WIDE: .3, MID: .4, CLOSE: .3 }, W = ['WIDE', 'MID', 'CLOSE', 'OBJ'].map(k => [k, B[k] || 0]), sum = W.reduce((a, [, w]) => a + w, 0) || 1;
  const draw = r => { let u = r() * sum; for (const [k, w] of W) if ((u -= w) < 0) return k; return 'MID'; };
  const segOf = t => { let i = 0; for (let j = 0; j < n; j++) if (segs[j].at - .2 <= t) i = j; return i; };
  shots.forEach((sh, i) => { sh.seg = segOf((sh.t0 + sh.t1) / 2); const r = rand(hash(item.id + ':' + sh.seg + ':' + i)); let k = draw(r); if (i && k === shots[i - 1].kind) k = draw(r); sh.kind = k; sh.move = d.move || 'hold'; });
  shots[0].kind = 'WIDE'; shots[0].why = 'establish';
  const signs = [dir.p, ...(dir.s || [])], len = s => s.t1 - s.t0;
  if ((dir.p === 'Mk' || dir.p === 'Dm') && shots.length > 2) {   /* a series: the same set-up, the same length every time; a demark's break in that set-up, held */
    const sk = (B.MID || 0) >= (B.WIDE || 0) ? 'MID' : 'WIDE', L0 = Math.max(floor, R.reduce((a, b) => a + b, 0) / R.length), tail = shots[shots.length - 1].edge === 'out' ? shots.pop() : null;
    const a = shots[1].t0, b = shots[shots.length - 1].t1, brk = dir.p === 'Dm' ? Math.min(2 * L0, (b - a) / 2) : 0, m = Math.max(1, Math.round((b - a - brk) / L0)), w = (b - a - brk) / m, mv = d.move || 'hold';
    shots.length = 1; for (let j = 0; j < m; j++) shots.push({ t0: a + j * w, t1: a + (j + 1) * w, kind: sk, series: true, why: 'series ' + (j + 1) + '/' + m, move: mv });
    if (brk) shots.push({ t0: b - brk, t1: b, kind: d.insert_object ? 'OBJ' : sk, series: true, brk: true, why: 'break (the series set-up)', move: 'hold' });
    if (tail) shots.push(tail); shots.forEach(sh => { sh.seg = segOf((sh.t0 + sh.t1) / 2); });
  } else {
    const give = k => { if (shots.some(s => s.kind === k)) return; const pool = shots.slice(1).filter(s => s.kind === 'MID' || shots.filter(q => q.kind === s.kind).length > 1).sort((a, b) => len(b) - len(a)); if (pool[0]) { pool[0].kind = k; pool[0].why = 'weighted ' + B[k]; } };
    if (d.insert_object && (B.OBJ || 0) >= .2) give('OBJ');
    if ((B.CLOSE || 0) >= .2) give('CLOSE');
  }
  if (d.empty_frame || signs.includes('As')) { const f = shots[0];
    if (shots.length === 1 || len(f) >= 2 * floor) { const m = f.t0 + len(f) / 2; shots.splice(1, 0, { ...f, t0: m, kind: 'WIDE', why: 'establish' }); f.t1 = m; }
    else if (!shots[1].series) { shots[1].kind = 'WIDE'; shots[1].why = 'establish'; }
    f.kind = 'EMPTY'; f.why = 'no figure'; }
  return shots;
};
/** the subject's baked head (the previs puts the figure; the nearest head of the card is it), with the way it faces */
function subjectHead(st, who) {
  const heads = st.group ? st.group.userData.heads : [], c = who && st.pv && (st.pv.cast || []).find(c => (c.who || '') === 'character.' + who || (c.who || '').startsWith('character.' + who + '-'));
  if (!c || !Array.isArray(c.at) || !heads.length) return null; const x = c.at[0], z = -c.at[2]; let best = null, bd = 70;
  for (const h of heads) { const dd = Math.hypot(h.x - x, h.z - z); if (dd < bd) { bd = dd; best = h; } } if (!best) return null;
  const v = V3(best.x, best.y + 14, best.z), q = best.q ? new THREE.Quaternion(...best.q) : new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), (best.r || 0) * Math.PI / 2);
  v.face = V3(0, 0, 1).applyQuaternion(q).setY(0).normalize(); return v;
}
/** the insert object: the previs cast entry whose name shares the most words with it, and the card's parts where it stands */
const STOP = new Set(['the', 'and', 'his', 'her', 'its', 'with', 'from', 'into', 'through', 'two', 'one', 'drawn', 'gesture', 'hands']);
function objectTarget(st, what) {
  if (!what || !st.pv || !st.pv.cast || !st.group) return null; const words = new Set(String(what).toLowerCase().split(/[^a-z]+/).filter(w => w.length > 2 && !STOP.has(w)).map(w => w.replace(/s$/, '')));
  let best = null, bs = 0; for (const c of st.pv.cast) { if (!Array.isArray(c.at)) continue; const ws = new Set((String(c.who || '') + ' ' + String(c.name || '')).toLowerCase().split(/[^a-z]+/).map(w => w.replace(/s$/, '')).filter(w => words.has(w))); if (ws.size > bs) { bs = ws.size; best = c; } }
  if (!best) return null; const x = best.at[0], z = -best.at[2], rows = st.group.userData.rows.filter(p => p.y > 2 && Math.hypot(p.x - x, p.z - z) < 60);
  if (rows.length < 3) return null; const v = rows.reduce((a, p) => a.add(V3(p.x, p.y, p.z)), V3()).multiplyScalar(1 / rows.length); v.what = best.who; return v;
}
/** the empty frame: a wide on the set where no head (nor the body below it) falls inside any phone's frame (the engine keeps
   the 1.6 frame's width on a tall screen, so a portrait phone sees far more height: E.setCamera), and the most parts of the set
   fall inside both the tallest and the widest */
const FIG = /^(3626|973|970|971|972|3815|3816|3817|3818|3819|3820|3838|4485|3624|3844|3833|3834|2446|30048|6132|6131|x|u9|30409)/;
function emptyCam(pts, heads, c, R, az0, fov, figs = []) {
  const far = pts.filter(p => heads.every(h => Math.hypot(p.x - h.x, p.z - h.z) > 80) && figs.every(h => Math.hypot(p.x - h.x, p.z - h.z) > 40)); if (far.length < 12) return null;
  const tall = Math.min(92, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * 1.6 / .45) * 180 / Math.PI), wide = new THREE.PerspectiveCamera(fov, 2.3, 1, 8000), narrow = new THREE.PerspectiveCamera(tall, .45, 1, 8000), sample = far.filter((p, i) => i % Math.ceil(far.length / 400) === 0);
  const bodies = heads.flatMap(h => [h, h.clone().add(V3(0, -22, 0)), h.clone().add(V3(0, -40, 0))]).concat(figs);
  const targets = [far.reduce((a, p) => a.add(p), V3()).multiplyScalar(1 / far.length)]; const byFar = far.slice().sort((a, b) => Math.min(...heads.map(h => h.distanceTo(b))) - Math.min(...heads.map(h => h.distanceTo(a)))); for (let i = 0; i < 4 && i * 7 < byFar.length; i++) targets.push(byFar[i * 7].clone());
  const inside = (cam, p, m) => { const v = p.clone().project(cam); return v.z < 1 && v.z > -1 && Math.abs(v.x) < m && Math.abs(v.y) < m; };
  const clean = (pos, look) => { for (const cam of [wide, narrow]) { cam.position.copy(pos); cam.lookAt(look); cam.updateMatrixWorld(); if (bodies.some(b => inside(cam, b, 1.08))) return false; } return true; };
  let best = null;
  for (const tg of targets) for (let a = 0; a < 16; a++) for (const el of [.22, .38, .55]) for (const k of [.45, .75, 1.1]) {
    const az = az0 + a * Math.PI / 8, dist = Math.max(140, R * k / Math.tan(fov * Math.PI / 360)), pos = tg.clone().add(V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist));
    if (pos.y < 12 || !clean(pos, tg) || blocked(pts, pos, tg)) continue;
    let sn = 0, sw = 0; for (const p of sample) { if (inside(narrow, p, .92)) sn++; if (inside(wide, p, .92)) sw++; } const sc = Math.min(sn, sw);
    if (!best || sc > best.sc) best = { sc, pos, look: tg }; }
  return best && best.sc >= 8 ? { ...best, clean } : null;
}
/** a shot's camera move from its framing (p looking at look, on target), as from/to */
function moveShot(p, look, target, move, kind, pts, ok) {
  const rel = p.clone().sub(target), dist = rel.length(), rot = (v, a) => V3(v.x * Math.cos(a) + v.z * Math.sin(a), v.y, -v.x * Math.sin(a) + v.z * Math.cos(a));
  let p0 = p.clone(), p1 = p.clone(), l0 = look.clone(), l1 = look.clone();
  if (move === 'push') { p0 = target.clone().add(rel.clone().multiplyScalar(1.03)); p1 = target.clone().add(rel.clone().multiplyScalar(kind === 'CLOSE' ? .88 : .8)); }
  else if (move === 'pull') { p0 = target.clone().add(rel.clone().multiplyScalar(kind === 'CLOSE' ? .94 : .9)); p1 = target.clone().add(rel.clone().multiplyScalar(1.12)); }
  else if (move === 'track') { const side = V3(rel.z, 0, -rel.x).normalize().multiplyScalar(dist * (kind === 'CLOSE' ? .05 : .1)); p0.sub(side); p1.add(side); l0.sub(side); l1.add(side); }
  else if (move === 'orbit') { const a = kind === 'CLOSE' ? .12 : .22; p0 = target.clone().add(rot(rel, -a)); p1 = target.clone().add(rot(rel, a)); }
  else if (move === 'crane') { const up = dist * (kind === 'CLOSE' ? .05 : .1); p0.y -= up; p1.y += up; }
  if (move !== 'hold' && (p0.y < 8 || p1.y < 8 || blocked(pts, p0, target) || blocked(pts, p1, target) || (ok && !(ok(p0, l0) && ok(p1, l1))))) return { p0: p.clone(), p1: p.clone(), l0: look.clone(), l1: look.clone(), move: 'hold' };
  return { p0, p1, l0, l1, move };
}
/** the directed plan: C.cut's shots, each framed on the card (or on the scene's key camera) and moved */
C.planDirected = function (item, st, dir) {
  const d = dir.d, cut = C.cut(item, dir), segs = item.segs.length ? item.segs : [{ at: 0, dur: item.seconds }], n = segs.length;
  const g = st.group, box = new THREE.Box3(V3(-300, 0, -300), V3(300, 120, 300));
  if (g && g.userData.rows.length) { box.makeEmpty(); for (const p of g.userData.rows) box.expandByPoint(V3(p.x, p.y, p.z)); box.max.y += 24; }
  const c = box.getCenter(V3()), size = box.getSize(V3()), R = Math.min(420, Math.max(160, Math.max(size.x, size.z) / 2));
  const heads = (g ? g.userData.heads : []).map(p => V3(p.x, p.y + 14, p.z)), pts = centres(st);
  const cast = heads.length ? heads.reduce((a, p) => a.add(p), V3()).multiplyScalar(1 / heads.length) : V3(c.x, 40, c.z);
  const h = hash(item.id), az0 = ((h % 1000) / 1000 - .5) * .9, fov = 40, pick = i => heads.length ? heads[(h + i * 7) % heads.length] : cast;
  const at = (target, dist, elev, az) => target.clone().add(V3(Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev)).multiplyScalar(dist));
  const keys = st.kf && st.kf.keys && st.kf.keys.length ? st.kf.keys.map(k => resolveKey(k, st)) : null;
  const subj = subjectHead(st, d.subject), obj = objectTarget(st, d.insert_object);
  const empty = cut.some(s => s.kind === 'EMPTY') ? emptyCam(pts, heads, c, R, az0, fov, g ? g.userData.rows.filter(p => FIG.test(p.part)).map(p => V3(p.x, p.y + 8, p.z)) : []) : null;
  /* a series (Mk, Dm): one framing (low, one bearing, one distance) stepped across the set, left, centre, right, and again */
  const series = cut.filter(s => s.series), sAz = az0 + .35, axis = V3(Math.cos(sAz), 0, -Math.sin(sAz)); let sA = cast, sB = cast;
  if (series.length && pts.length) { const pr = pts.map(p => p.clone().sub(c).dot(axis)).sort((a, b) => a - b), q = f => pr[Math.floor(f * (pr.length - 1))], y = Math.max(20, Math.min(60, cast.y));
    sA = V3(c.x, y, c.z).addScaledVector(axis, q(.15)); sB = V3(c.x, y, c.z).addScaledVector(axis, q(.85));
    /* where the previs puts the cast (figures, creatures), the series runs across them, not across the empty ground */
    const cp = ((st.pv && st.pv.cast) || []).filter(x => Array.isArray(x.at)).map(x => V3(x.at[0], y, -x.at[2])), pa = cp.map(v => v.clone().sub(c).dot(axis));
    if (cp.length > 1 && Math.max(...pa) - Math.min(...pa) > 60) { sA = V3(c.x, y, c.z).addScaledVector(axis, Math.min(...pa)); sB = V3(c.x, y, c.z).addScaledVector(axis, Math.max(...pa)); } }
  let wides = 0;
  const shots = cut.map((s, i) => {
    let kind = s.kind; if (kind === 'EMPTY' && !empty) kind = 'WIDE'; if (s.brk && !obj) kind = cut[1].kind;
    const k = keys && keys[Math.min(keys.length - 1, Math.floor(s.seg * keys.length / n))];
    let pos, look, target, f = fov, head = null, key = false, ok = null;
    const az = s.series ? az0 + .35 : az0 + ((i * 0.61) % 1 - .5) * .8;
    if (s.series) { const j = series.filter(x => !x.brk).indexOf(s), N = series.filter(x => !x.brk).length, u = N > 4 ? (j % 3) / 2 : N > 1 ? j / (N - 1) : .5;   /* a long series cycles three matched frames (the triads passing) */ target = s.brk ? (obj ? obj.clone() : sB.clone()) : sA.clone().lerp(sB, u); if (s.brk && obj) target.y = Math.max(20, Math.min(60, cast.y)); pos = clear(pts, at(target, Math.max(220, R * .75), .22, az), target); look = target; }   /* the matched frame, stepped along the set */
    else if (k && (kind === 'MID' || (kind === 'CLOSE' && k.head))) { pos = clear(pts, k.pos, k.look); look = k.look; target = k.head || k.look; f = k.fov; head = k.head || null; key = true; }
    else if (kind === 'EMPTY') { pos = empty.pos; look = empty.look; target = empty.look; ok = empty.clean; }
    else if (kind === 'WIDE' && k && !wides++) { look = k.head ? cast.clone() : k.look; target = look; pos = clear(pts, look.clone().add(k.pos.clone().sub(k.look).multiplyScalar(1.35)), look); }   /* a keyed scene's wide: its key's mark pulled back (the take's wideFor) */
    else if (kind === 'WIDE') { const nth = wides++; target = V3(c.x, Math.min(60, c.y), c.z); pos = clear(pts, at(target, R * .8 / Math.tan(fov * Math.PI / 360), nth ? .42 : .55, nth ? az0 + (nth % 2 ? .55 : -.55) * Math.ceil(nth / 2) / (1 + Math.floor(nth / 4)) : az0), target); look = target; }
    else if (kind === 'MID') { target = cast.clone().add(V3(0, 6, 0)); pos = clear(pts, at(target, Math.max(260, R * .9), .38, az), target); look = target; }
    else if (kind === 'OBJ') { f = 34; if (obj) { target = obj; pos = clear(pts, at(target, 150, .32, az), target, true); } else { target = (subj || pick(i)).clone().add(V3(0, -20, 0)); pos = clear(pts, at(target, 120, .22, subj && subj.face ? Math.atan2(subj.face.x, subj.face.z) + .5 : az), target, true); } look = target;
      if (pos.loose) kind = 'CLOSE'; }   /* no clear view of the thing: the close on the one who holds it */
    if (kind === 'CLOSE' && !key) { const t = subj || pick(i); target = t.clone(); f = 34; const a = t.face ? Math.atan2(t.face.x, t.face.z) + ((i * .37) % 1 - .5) * .9 : az; pos = clear(pts, at(target, 150, .16, a), target, true); look = headroom(pos, V3(t.x, t.y, t.z), f).look; head = target; }
    const m = moveShot(pos, look, target, kind === 'OBJ' && dir.p === 'Sb' ? 'push' : s.move, kind, pts, ok);
    return { t0: s.t0, t1: s.t1, from: { pos: m.p0, look: m.l0, fov: f }, to: { pos: m.p1, look: m.l1, fov: f }, kind, move: m.move, key, head, seg: s.seg, why: s.why || null, edge: s.edge || null, what: kind === 'OBJ' ? (obj ? obj.what : 'the hands of ' + (d.subject || 'the cast')) : kind === 'CLOSE' ? (subj ? d.subject : 'a head') : null };
  });
  /* two shots from the same place on the same thing are one shot: no invisible cut (a series is exempt, its sameness is the sign) */
  for (let i = shots.length - 1; i > 0; i--) { const a = shots[i - 1], b = shots[i];
    if (a.kind === b.kind && !a.edge && !b.edge && !b.brk && !(cut[i] && cut[i].series) && a.from.pos.distanceTo(b.from.pos) < 25 && a.from.look.distanceTo(b.from.look) < 25) { a.t1 = b.t1; a.why = (a.why ? a.why + ', ' : '') + 'held over a cut'; shots.splice(i, 1); } }
  C.cast = cast; return shots;
};
C.plan = function (item, st) { const dir = st.dir !== undefined ? st.dir : C.direction(item); return dir ? C.planDirected(item, st, dir) : C.planGrammar(item, st); };
/** a shot on a person: the head on the upper third of the frame (the look point dropped below it), the head kept for the tests */
function headroom(pos, head, fov) { if (head.face) { const rel = pos.clone().sub(head), k = rel.dot(head.face); if (k < 0) pos = head.clone().add(rel.addScaledVector(head.face, -2 * k)); /* the camera goes round to the face: a baked figure may face the other way from the film's restaged one */ }
  const d = pos.distanceTo(head), look = head.clone().add(V3(0, -d * Math.tan(fov * Math.PI / 360) * .33, 0)); const h = head.clone(); h.face = head.face; return { pos, look, fov, head: h }; }
let SOLID = null;
/** a ray from the lens into the card's own meshes: does a surface of the set lie within `far` of the camera? */
function solids(st) {
  const g = st.group; if (!g) return null; const ray = new THREE.Raycaster(); g.updateMatrixWorld(true);
  return (cam, dir, far) => { if (far <= 0) return false; ray.set(cam, dir); ray.near = 0; ray.far = far; try { return ray.intersectObject(g, true).length > 0; } catch (e) { return false; } };
}
function centres(st) { SOLID = solids(st); return st.group ? st.group.userData.rows.filter(p => p.y > 2 || !/^(3032|3031|3036|3035|3034|3033|3030|3958|3811|3867|4186|3068b|3070b|3069b|2431|6636|4162|3024|3023|3022|3020|3021|3710|3666|3460|3795|3832|2445|41539|91405|92438|3865)$/.test(p.part)).map(p => V3(p.x, p.y + 12, p.z)) : []; }
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
  if (s) { const tq = s.move && s.move !== 'hold' ? Math.floor(t * 12) / 12 : t, u = E.smooth((tq - s.t0) / Math.max(.1, s.t1 - s.t0));   /* a directed move is played on twos: 12 camera steps a second */
    const pos = s.from.pos.clone().lerp(s.to.pos, u), look = s.from.look.clone().lerp(s.to.look || s.from.look, u); E.setCamera(pos.toArray(), look.toArray(), { fov: s.from.fov }); C.shot = si; }
  // the segment: caption, duck
  const segi = item.segs.findIndex(g => t >= g.at && t < g.at + g.dur);
  if (segi !== C.segi) { C.segi = segi; if (segi >= 0) { const g = item.segs[segi]; H.caption(g.speaker, g.caption, g.isLine); A.duck(!(C.st && C.st.dir && C.st.dir.d.sound_forward)); }   /* sound forward: the bed is not ducked under the voice */ else { H.caption(null); A.duck(false); } }
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
