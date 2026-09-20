/* world/iron.js — the hands of HAND IRON driving the world of word-to-world: walk, drive, fly, get in and out.

   HAND IRON (play/hand-iron.html) builds with two hands in front of a camera: a grip hand pinches a brick and
   carries it, a tool hand gives commands (two fingers copy, a fist holds, a thumb up lands, a thumb down deletes,
   an open palm moves on its plane). This module keeps that vocabulary and points it at the thing word-to-world
   does that a hand table cannot: moving through a place. The correspondence:

     HAND IRON                              WORD TO IRON
     grip hand pinches a brick, carries it  grip hand closes (fist or pinch) on the stick and carries it: the
                                            hand's travel from where it closed is the thumb on the stick — up
                                            walks, drives or climbs, sideways steers, back reverses or sinks
     open grip places                       open grip lets go: the figure stops, the car coasts
     tool hand two fingers: copy            tool hand two fingers: run on foot, boost in a ride or the TIE
     tool hand open palm: move on its plane tool hand open palm: the view turns with the palm (on foot)
     tool hand pinch                        tool hand pinch: the saber on foot, a shot from a ride; held, a torpedo
     tool hand fist: hold                   tool hand fist: the push on foot
     tool hand thumb up: land               thumb up: get in — the car, the built vehicle or the ship in reach
     tool hand thumb down: delete           thumb down: get out — leave the car, land the TIE or the flyer
     open both hands to start again         open both hands to start again after the stick is lost

   The classifier is HAND IRON's own (extended fingers by two ratios, the thumb by its lean, the pinch by the
   thumb-to-index distance over the palm's span, with hysteresis and a short dwell). The camera is the page's
   own front camera through MediaPipe's hand landmarker with two hands; `Iron.feed(hands, now)` takes landmarks
   from anywhere else (a test, a worker, another page over postMessage), so the tracker and the driver are
   separate. Everything the driver does goes through `W.input` and the hooks main.js already exposes, the same
   channels the thumbs and the keys use: nothing here moves a figure or a car by itself. */
(function () {
'use strict';
const W = window.__world, $ = s => document.querySelector(s);
const GAIN = 5.5, DEAD = 0.015, LOOK = 6.5, LOST = 320;   // stick: full deflection at 0.18 of the frame's width; the view: radians per frame width; a hand gone this long lets go
const DWELL = { up: 350, down: 350, pinch: 80, fist: 220, V: 0, open: 0, point: 0 };
const H = { on: false, stream: null, model: null, video: null, tracks: new Map(), grip: null, stick: null, tool: null, look: null, last: 0, frames: 0, fed: 0, log: [], line: '', cue: '', aspect: 4 / 3 };
const dist = (a, b, aspect) => Math.hypot((a.x - b.x) * (aspect || 1), a.y - b.y);
/** The thumb-to-index distance over the palm's span: under .56 is a pinch, and a pinch stays one until .66. */
function pinchRatio(h, aspect) { return dist(h[4], h[8], aspect) / Math.max(.025, dist(h[5], h[17], aspect), dist(h[0], h[9], aspect)); }
/** HAND IRON's gesture of a hand: up, down, V, fist, pinch, open or point. `closed` is the pinch state with its hysteresis, kept by the track. */
function gestureOf(h, closed, aspect) {
  aspect = aspect || 1; const d = (a, b) => dist(a, b, aspect);
  const extended = [8, 12, 16, 20].map((tip, i) => { const pip = h[[6, 10, 14, 18][i]], base = h[[5, 9, 13, 17][i]], end = h[tip]; return d(end, h[0]) > d(pip, h[0]) * 1.06 && d(end, base) > d(pip, base) * 1.35; });
  const n = extended.filter(Boolean).length, span = Math.max(.025, d(h[5], h[17])), thumbY = h[4].y - h[2].y, thumbX = (h[4].x - h[2].x) * aspect;
  const thumbOut = d(h[4], h[5]) > span * .55 && d(h[4], h[2]) > span * .55;
  if (n <= 1 && thumbOut && Math.abs(thumbY) > Math.abs(thumbX) * .65 && Math.abs(thumbY) > span * .38) return thumbY > 0 ? 'down' : 'up';
  if (extended[0] && extended[1] && (!extended[2] || !extended[3])) return 'V';
  if (n === 0) return 'fist';
  if (closed) return 'pinch';
  if (n >= 3) return 'open';
  return 'point';
}
const palmOf = h => ({ x: 1 - (h[0].x + h[5].x + h[9].x + h[17].x) / 4, y: (h[0].y + h[5].y + h[9].y + h[17].y) / 4 });   // mirrored: the hand on the right of the picture is the right hand
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function note(text) { if (text === H.line) return; H.line = text; const el = $('#ironLine'); if (el) el.textContent = text; }
function log(event, data, now) { H.log.push({ t: Math.round(now || performance.now()), event, ...data }); if (H.log.length > 60) H.log.shift(); }
const stickTarget = () => (W.mode === 'fly' ? W.input.fly : W.input.L);
/** One frame of hands: `hands` is a list of { marks: 21 landmarks in 0..1, identity: 'Left' | 'Right' | null }. */
function feed(hands, now) {
  now = now == null ? performance.now() : now; H.fed++; const seen = new Set();
  for (const hand of hands || []) {
    const m = hand.marks || hand; if (!m || m.length < 21) continue;
    let id = hand.identity || null; if (!id) { let best = null, bd = .2; const p = palmOf(m); for (const t of H.tracks.values()) { if (seen.has(t.id)) continue; const d = Math.hypot(t.palm.x - p.x, t.palm.y - p.y); if (d < bd) { bd = d; best = t; } } id = best ? best.id : 'hand-' + (H.tracks.size + 1); }
    let t = H.tracks.get(id); if (!t) { t = { id, palm: palmOf(m), closed: false, want: false, since: now, gesture: 'open', gestureSince: now, latched: null, seen: now }; H.tracks.set(id, t); }
    seen.add(id); const p = palmOf(m); t.palm = { x: t.palm.x + (p.x - t.palm.x) * .5, y: t.palm.y + (p.y - t.palm.y) * .5 }; t.marks = m; t.seen = now;
    const ratio = pinchRatio(m, H.aspect), want = ratio < (t.closed ? .66 : .56); if (want !== t.want) { t.want = want; t.since = now; }
    if (now - t.since >= (want ? 20 : 80)) t.closed = want; t.ratio = ratio;
    const g = gestureOf(m, t.closed, H.aspect); if (g !== t.gesture) { t.gesture = g; t.gestureSince = now; }
    const label = toolGesture(t); if (label !== t.label) { t.label = label; t.labelSince = now; if (t.latched && label !== t.latched) t.latched = null; }   // a command is latched until the hand shows something else
  }
  for (const t of H.tracks.values()) if (!seen.has(t.id) && now - t.seen > LOST) { if (H.grip === t.id) letGo('the grip hand is gone'); if (H.tool === t.id) H.tool = null; H.tracks.delete(t.id); }
  drive(now); paint();
}
function letGo(why) { if (!H.grip) return; log('letgo', { why }); H.grip = null; H.stick = null; const T = W.input; for (const s of [T.L, T.fly]) { s.x = s.y = s.mag = 0; s.held = false; } }
/** The tool hand's command: HAND IRON's label, except that a hand whose thumb and index touch is a pinch whatever the thumb's lean says (a pinch with the index out reads as a thumb up otherwise). */
const toolGesture = t => (t.closed && (t.gesture === 'up' || t.gesture === 'down' || t.gesture === 'point') ? 'pinch' : t.gesture);
const gripping = t => t.closed || t.gesture === 'fist' || t.gesture === 'pinch';
/** The tracks into the world's input: a grip hand on the stick, a tool hand for the commands. */
function drive(now) {
  const live = [...H.tracks.values()].filter(t => now - t.seen <= LOST);
  if (!W || !W.ready || !W.input) return;
  const held = W.film && W.film.holds && W.film.holds();
  // the grip hand: the first hand to close takes the stick; it keeps it while it stays closed
  let grip = H.grip ? live.find(t => t.id === H.grip) : null;
  if (grip && !gripping(grip)) { letGo('opened'); grip = null; }
  if (!grip && !held) { const c = live.find(t => gripping(t) && now - Math.max(t.labelSince, t.since) >= 60 && !t.latched); if (c) { grip = c; H.grip = c.id; H.stick = { origin: { ...c.palm }, x: 0, y: 0 }; log('grip', { id: c.id, gesture: c.gesture }); } }
  if (grip && H.stick) {
    const dx = grip.palm.x - H.stick.origin.x, dy = -(grip.palm.y - H.stick.origin.y);
    let x = Math.abs(dx) < DEAD ? 0 : clamp(dx * GAIN, -1, 1), y = Math.abs(dy) < DEAD ? 0 : clamp(dy * GAIN, -1, 1);
    H.stick.x = x; H.stick.y = y; const s = stickTarget(); if (!held) { s.x = x; s.y = y; s.mag = Math.min(1, Math.hypot(x, y)); s.held = true; }
  }
  // the tool hand: any other hand; its gesture becomes a command after its dwell, once, until the hand relaxes
  const tool = live.find(t => t.id !== H.grip) || null; H.tool = tool ? tool.id : null;
  W.input.runHook = false; W.input.boostHook = false; let cue = '';
  if (tool && !held) {
    const g = tool.label, age = now - tool.labelSince, ready = age >= (DWELL[g] || 0);
    if (g === 'V' && ready) { if (W.mode === 'walk') { W.input.runHook = true; cue = 'two fingers: run'; } else { W.input.boostHook = true; cue = 'two fingers: boost'; } }
    else if (g === 'open') { const p = tool.palm; if (H.look && W.mode === 'walk') { W.input.look.dx += (p.x - H.look.x) * LOOK; W.input.look.dy += (p.y - H.look.y) * LOOK * .7; } H.look = { x: p.x, y: p.y }; cue = W.mode === 'walk' ? 'open palm: look' : 'open palm'; }
    else if (g === 'up') { cue = W.mode === 'walk' ? 'thumb up: get in' : 'thumb up'; if (ready && tool.latched !== 'up') { tool.latched = 'up'; if (W.mode === 'walk') { if (window.Kernel) { const r = Kernel.attempt('board'); if (!r.ok) note(Kernel.describe(r)); log('command', { name: 'in', did: r.ok ? r.effect : null, why: r.ok ? null : r.reason }); } else { const pr = W.prompt ? W.prompt() : null; if (pr && pr.on) { W.promptAction(); log('command', { name: 'in', did: pr.text }); } else { note('Nothing to get into here: walk up to a car.'); log('command', { name: 'in', did: null }); } } } } }
    else if (g === 'down') { cue = W.mode === 'walk' ? 'thumb down' : 'thumb down: get out'; if (ready && tool.latched !== 'down') { tool.latched = 'down'; if (W.mode !== 'walk') { if (window.Kernel) { const r = Kernel.attempt('leave'); if (!r.ok) note(Kernel.describe(r)); log('command', { name: 'out', mode: W.mode, did: r.ok ? r.effect : null }); } else { W.promptAction(); log('command', { name: 'out', mode: W.mode }); } } } }
    else if (g === 'pinch') { cue = W.mode === 'walk' ? 'pinch: saber' : 'pinch: fire'; if (ready && tool.latched !== 'pinch') { tool.latched = 'pinch'; tool.pinchAt = now; if (W.mode === 'walk') W.input.saber = true; else W.input.fireOnce = true; log('command', { name: 'fire', mode: W.mode }, now); } else if (tool.latched === 'pinch' && W.mode !== 'walk' && now - tool.pinchAt > 600 && !tool.torpedo) { tool.torpedo = true; W.input.torpedo = true; log('command', { name: 'torpedo', held: Math.round(now - tool.pinchAt) }, now); } }
    else if (g === 'fist') { cue = W.mode === 'walk' ? 'fist: push' : 'fist'; if (ready && tool.latched !== 'fist') { tool.latched = 'fist'; if (W.mode === 'walk') { W.input.push = true; log('command', { name: 'push' }); } } }
    else cue = 'point';
    if (g !== 'pinch') tool.torpedo = false; if (g !== 'open') H.look = null;
  } else H.look = null;
  H.cue = cue;
  if (!grip && !tool) note(H.on || H.fed ? 'Show a hand. Close it to take the stick.' : '');
  else if (grip) note((W.mode === 'walk' ? 'On the stick: move the closed hand to walk' : W.mode === 'ride' ? 'On the stick: up drives, sideways steers, back reverses' : 'On the stick: up climbs, sideways turns, back sinks') + (cue ? ' · ' + cue : ' · the other hand commands'));
  else note((W.mode === 'walk' ? 'Close a hand to take the stick' : 'Close a hand to take the wheel') + (cue ? ' · ' + cue : ''));
}
/* ───────────── the picture: both hands over the camera, the stick's origin and travel ───────────── */
const LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
function paint() {
  const c = $('#ironDraw'); if (!c) return; const r = c.getBoundingClientRect(); if (!r.width) return; const dpr = Math.min(2, devicePixelRatio || 1);
  if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height); g.lineCap = 'round'; g.font = '10px monospace';
  for (const t of H.tracks.values()) {
    const m = t.marks; if (!m) continue; const isGrip = t.id === H.grip, col = isGrip ? '#c4f46a' : t.id === H.tool ? '#83cfff' : '#b7c6c9';
    g.strokeStyle = col; g.fillStyle = '#fff'; g.lineWidth = 2; for (const [a, b] of LINKS) { g.beginPath(); g.moveTo((1 - m[a].x) * r.width, m[a].y * r.height); g.lineTo((1 - m[b].x) * r.width, m[b].y * r.height); g.stroke(); }
    for (const p of m) { g.beginPath(); g.arc((1 - p.x) * r.width, p.y * r.height, 2, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = col; g.fillText((isGrip ? 'GRIP ' : t.id === H.tool ? 'TOOL ' : '') + t.gesture.toUpperCase(), clamp(t.palm.x * r.width - 20, 2, r.width - 60), clamp(t.palm.y * r.height + 34, 12, r.height - 4));
  }
  if (H.stick) { const o = H.stick.origin; g.strokeStyle = '#c4f46a'; g.lineWidth = 2; g.beginPath(); g.arc(o.x * r.width, o.y * r.height, 0.18 * r.width, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(o.x * r.width, o.y * r.height); g.lineTo((o.x + H.stick.x * 0.18) * r.width, o.y * r.height - H.stick.y * 0.18 * r.width); g.stroke(); }
}
/* ───────────── the camera ───────────── */
async function loop() {
  if (!H.on) return; const v = H.video;
  if (v.readyState >= 2 && v.currentTime !== H.lastVideo) {
    H.lastVideo = v.currentTime; const now = performance.now(); H.frames++; H.aspect = v.videoWidth / v.videoHeight || 4 / 3;
    try { const res = H.model.detectForVideo(v, now); const hands = (res.landmarks || []).map((m, i) => { const h = res.handedness && res.handedness[i] && res.handedness[i][0]; return { marks: m, identity: h && h.score > .8 ? h.categoryName : null }; }); feed(hands, now); }
    catch (e) { if (now - (H.lastError || 0) > 2000) { H.lastError = now; note('Tracking error: ' + e.message); } }
  }
  requestAnimationFrame(loop);
}
async function start() {
  if (H.on) { stop(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { note('This browser cannot open a camera. Use HTTPS on a current phone or computer.'); return; }
  const b = $('#ironStart'); b.disabled = true; b.textContent = 'Opening'; $('#iron').classList.add('on'); note('Allow the camera. Then show both hands.');
  try {
    H.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    const mod = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm');
    const files = await mod.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
    const options = { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' }, runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: .5, minHandPresenceConfidence: .5, minTrackingConfidence: .5 };
    try { H.model = await mod.HandLandmarker.createFromOptions(files, { ...options, baseOptions: { ...options.baseOptions, delegate: 'GPU' } }); } catch (e) { H.model = await mod.HandLandmarker.createFromOptions(files, { ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' } }); }
    const v = H.video = $('#ironVideo'); v.srcObject = H.stream; await v.play(); H.on = true; document.body.classList.add('iron-on'); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); b.textContent = 'Hands off';
    note('Close a hand to take the stick. The other hand commands: two fingers run, thumb up gets in.'); loop();
  } catch (e) { console.error('[iron] start', e); if (H.stream) H.stream.getTracks().forEach(t => t.stop()); H.stream = null; $('#iron').classList.remove('on'); note(/denied|permission/i.test(String(e)) ? 'Camera permission was denied. Enable it in the browser, then try again.' : 'Could not start hand tracking. The thumbs and the keys still work.'); }
  finally { b.disabled = false; if (!H.on) b.textContent = 'Hands'; }
}
function stop() {
  H.on = false; letGo('stopped'); H.tracks.clear(); H.tool = null; H.look = null; W.input.runHook = false; W.input.boostHook = false;
  if (H.stream) H.stream.getTracks().forEach(t => t.stop()); H.stream = null; if (H.model) { try { H.model.close(); } catch (e) { } } H.model = null;
  document.body.classList.remove('iron-on'); $('#iron').classList.remove('on'); const b = $('#ironStart'); b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); b.textContent = 'Hands'; note('');
}
function state() { return { on: H.on, frames: H.frames, fed: H.fed, grip: H.grip, tool: H.tool, stick: H.stick ? { x: +H.stick.x.toFixed(3), y: +H.stick.y.toFixed(3) } : null, cue: H.cue, line: H.line, tracks: [...H.tracks.values()].map(t => ({ id: t.id, gesture: t.gesture, label: t.label, closed: t.closed, ratio: +(t.ratio || 0).toFixed(2), latched: t.latched })), log: H.log.slice(-12) }; }
window.Iron = { start, stop, feed, state, gestureOf, pinchRatio, palmOf, VOCABULARY: [
  ['grip hand closes (fist or pinch)', 'takes the stick: its travel is the thumb — up walks, drives or climbs, sideways steers, back reverses'],
  ['open grip', 'lets go: the figure stops, the car coasts'],
  ['tool hand two fingers', 'run on foot, boost in a ride or the TIE'],
  ['tool hand open palm', 'the view turns with the palm, on foot'],
  ['tool hand pinch', 'the saber on foot, a shot from a ride; held, a torpedo'],
  ['tool hand fist', 'the push, on foot'],
  ['thumb up', 'get in: the car, the built vehicle or the ship in reach'],
  ['thumb down', 'get out: leave the car, land the TIE or the flyer'],
] };
function ready() { const b = $('#ironStart'); if (b) b.addEventListener('click', start); const L = $('#ironLegend'); if (L) L.innerHTML = window.Iron.VOCABULARY.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join(''); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
window.addEventListener('pagehide', () => { if (H.on) stop(); });
})();
