/* play/odyssey-game/input.js — hands, mouse, touch and keys, read as one set of cursors, and the verbs recognised on them.

   HANDS. Hand Butter's processHands(marks, now) receives the tracker's 21 landmarks per hand (from its MediaPipe worker, or
   from a test's synthetic hands) and runs trackHands: persistent track ids, the smoothed index tip (t.point) and palm (t.palm)
   mapped onto the stage, the pinch with hysteresis (t.closed). tools/odyssey-game.js makes processHands hand those tracks to
   OdysseyHands.take(tracks, now) first; the game consumes them, reading each pose with Butter's own classifier (gestureOf:
   open / point / pinch / fist / V / up / down) and its hand size (span: the palm's image size, which grows as a hand comes
   toward the camera). Every take() appends a timestamped sample to the hand's history, so the recognisers run at the
   tracker's rate whatever the render rate.
   MOUSE/TOUCH. The pointer is a cursor too; pressing it is the level's "press pose" (pinch by default; fist for the bag; point
   to guide Athena). KEYS. Arrows move a key cursor; Space presses; Tab jumps the key cursor to the level's next target.
   RECOGNISERS (on any cursor's history): thrust (hand size grows 30% within half a second, or a fast upward flick of a
   pressed pointer), circle (turns of the cursor path about its own centre), pump (vertical strokes), pull (two pinched hands
   drawn apart; a pressed pointer dragged away from where it pressed), steer (palm or pointer x). */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const now = () => performance.now();
const In = OG.In = { hands: [], lastHand: 0, mouse: { x: .5, y: .5, down: false, seen: 0, pressAt: null, downAt: 0 }, key: { x: .5, y: .5, down: false, seen: 0, held: new Set() },
  source: 'mouse', pressPose: 'pinch', handDown: new Map(), presses: [], hist: new Map(), listeners: new Set(), enabled: true, frames: 0 };
const HIST_MS = 2600;
function push(id, s) { let h = In.hist.get(id); if (!h) In.hist.set(id, h = []); h.push(s); while (h.length && s.t - h[0].t > HIST_MS) h.shift(); }
function span(m) { return (Math.hypot(m[5].x - m[17].x, m[5].y - m[17].y) + Math.hypot(m[0].x - m[9].x, m[0].y - m[9].y)) / 2; }

/* the hook: Hand Butter's tracks arrive here (see tools/odyssey-game.js) */
window.OdysseyHands = {
  take(tracks, t) {
    if (!In.enabled) return false; In.frames++;
    In.hands = [...tracks].sort((a, b) => a.id - b.id).map(k => { let pose = 'open'; try { pose = gestureOf(k); } catch (e) { } return { id: 'h' + k.id, x: k.point.x, y: k.point.y, px: k.palm.x, py: k.palm.y, pose, closed: !!k.closed, span: span(k.marks), marks: k.visualMarks || k.marks, t }; });
    In.lastHand = t; if (tracks.length) In.source = 'hand';
    for (const h of In.hands) push(h.id, { t, x: h.x, y: h.y, px: h.px, py: h.py, pose: h.pose, span: h.span, down: h.pose === 'pinch' || h.closed });
    for (const h of In.hands) { const down = h.pose === 'pinch' || h.pose === 'fist', was = In.handDown.get(h.id) || false; if (down !== was) { In.handDown.set(h.id, down); if (down) In.presses.push({ id: h.id, src: 'hand', x: h.x, y: h.y, t }); emit(down ? 'press' : 'release', h.id); } }
    for (const fn of In.listeners) try { fn('hands', In.hands, t); } catch (e) { console.error(e); }
    return true;   // the game owns the hands; Butter's own grip does not also act on them
  },
};
In.handsFresh = () => now() - In.lastHand < 1200 && In.hands.length > 0;   // a lost hand keeps its place a moment, as Butter's grip does

/* the pointer */
In.attach = function (layer) {
  In.layer = layer;
  const pos = e => { const r = layer.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
  /* touch: the first finger is the pointer; a second finger makes two cursors (the two-hand verbs: pull, embrace) */
  In.touches = new Map();
  const touchMove = e => { const t = In.touches.get(e.pointerId); if (!t) return false; const p = pos(e); Object.assign(t, p); push('t' + e.pointerId, { t: now(), x: p.x, y: p.y, px: p.x, py: p.y, pose: In.pressPose, span: 0, down: true }); return true; };
  layer.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; const p = pos(e); In.touches.set(e.pointerId, { id: e.pointerId, ...p, x0: p.x, y0: p.y }); if (In.touches.size >= 2) In.source = 'touch2'; }, true);
  const tEnd = e => { if (In.touches.delete(e.pointerId) && In.touches.size < 2 && In.source === 'touch2') In.source = 'mouse'; };
  layer.addEventListener('pointerup', tEnd, true); layer.addEventListener('pointercancel', tEnd, true);
  layer.addEventListener('pointermove', e => { if (e.pointerType === 'touch' && In.touches.size >= 2) touchMove(e); }, true);
  layer.addEventListener('pointermove', e => { const p = pos(e); Object.assign(In.mouse, p, { seen: now() }); if (now() - In.lastHand > 400) In.source = 'mouse'; push('m', { t: now(), x: p.x, y: p.y, px: p.x, py: p.y, pose: In.mouse.down ? In.pressPose : 'open', span: 0, down: In.mouse.down }); });
  layer.addEventListener('pointerdown', e => { if (e.target.closest('button,a,input,select')) return; const p = pos(e); Object.assign(In.mouse, p, { down: true, seen: now(), pressAt: { ...p, t: now() }, downAt: now() }); In.source = 'mouse'; In.presses.push({ id: 'm', src: 'mouse', x: p.x, y: p.y, t: now() }); try { layer.setPointerCapture(e.pointerId); } catch (_) { } push('m', { t: now(), x: p.x, y: p.y, px: p.x, py: p.y, pose: In.pressPose, span: 0, down: true }); emit('press', 'm'); });
  const up = e => { if (!In.mouse.down) return; In.mouse.down = false; In.mouse.seen = now(); push('m', { t: now(), x: In.mouse.x, y: In.mouse.y, px: In.mouse.x, py: In.mouse.y, pose: 'open', span: 0, down: false }); emit('release', 'm'); };
  layer.addEventListener('pointerup', up); layer.addEventListener('pointercancel', up);
  // keys: window capture, ahead of Hand Butter's own document handlers (Space would otherwise release its held brick)
  window.addEventListener('keydown', e => { if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return; if (!OG.G || !OG.G.active) return;
    e.stopImmediatePropagation(); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    const k = In.key; if (e.repeat && e.code === 'Space') return; k.held.add(e.code); k.seen = now(); In.source = 'key';
    if (e.code === 'Space' && !k.down) { k.down = true; push('k', { t: now(), x: k.x, y: k.y, px: k.x, py: k.y, pose: In.pressPose, span: 0, down: true }); emit('press', 'k'); }
    emit('key', e.code); }, true);
  window.addEventListener('keyup', e => { if (!OG.G || !OG.G.active) return; e.stopImmediatePropagation(); const k = In.key; k.held.delete(e.code);
    if (e.code === 'Space' && k.down) { k.down = false; push('k', { t: now(), x: k.x, y: k.y, px: k.x, py: k.y, pose: 'open', span: 0, down: false }); emit('release', 'k'); } }, true);
};
function emit(type, arg) { for (const fn of In.listeners) try { fn(type, arg); } catch (e) { console.error(e); } }
In.on = fn => { In.listeners.add(fn); return () => In.listeners.delete(fn); };
/* the key cursor moves with the arrows, every frame */
In.frame = function (dt) {
  const k = In.key, sp = 0.55 * dt; let mx = 0, my = 0;
  if (k.held.has('ArrowLeft')) mx -= sp; if (k.held.has('ArrowRight')) mx += sp; if (k.held.has('ArrowUp')) my -= sp; if (k.held.has('ArrowDown')) my += sp;
  if (mx || my) { k.x = Math.max(.02, Math.min(.98, k.x + mx)); k.y = Math.max(.02, Math.min(.98, k.y + my)); k.seen = now(); In.source = 'key'; push('k', { t: now(), x: k.x, y: k.y, px: k.x, py: k.y, pose: k.down ? In.pressPose : 'open', span: 0, down: k.down }); }
};
In.keyMoving = () => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(c => In.key.held.has(c));

/** The cursors now: every fresh hand, then the pointer or the key cursor (whichever was used last). */
In.cursors = function () {
  const out = [];
  if (In.handsFresh()) for (const h of In.hands) out.push({ id: h.id, src: 'hand', x: h.x, y: h.y, px: h.px, py: h.py, pose: h.pose, down: h.pose === 'pinch' || (h.closed && h.pose !== 'open'), span: h.span, marks: h.marks });
  if (!out.length && In.touches && In.touches.size >= 2) for (const t of [...In.touches.values()].slice(0, 2)) out.push({ id: 't' + t.id, src: 'touch', x: t.x, y: t.y, px: t.x, py: t.y, pose: In.pressPose, down: true, span: 0 });
  if (!out.length) { if (In.source === 'key') out.push({ id: 'k', src: 'key', x: In.key.x, y: In.key.y, px: In.key.x, py: In.key.y, pose: In.key.down ? In.pressPose : 'open', down: In.key.down });
    else out.push({ id: 'm', src: 'mouse', x: In.mouse.x, y: In.mouse.y, px: In.mouse.x, py: In.mouse.y, pose: In.mouse.down ? In.pressPose : 'open', down: In.mouse.down }); }
  return out;
};
In.primary = () => In.cursors()[0];
In.history = id => In.hist.get(id) || [];
/** the latest press (a pinch closing, a pointer going down) since the last call, with where it happened: an edge a slow frame cannot miss */
In.takePress = function () { const p = In.presses.pop(); In.presses.length = 0; return p && now() - p.t < 3000 ? p : null; };
In.reset = function () { In.presses.length = 0; if (In.touches) In.touches.clear(); In.hist.clear(); In.hands = []; In.lastHand = 0; In.mouse.down = false; In.key.down = false; In.key.held.clear(); };

/* ── recognisers ── */
const R = In.R = {};
/** thrust: the hand's image size grows by `ratio` within `win` ms (it came toward the camera); a pressed pointer flicked upward */
R.thrust = function (id, { ratio = 1.3, win = 500, since = 0 } = {}) {
  const h = In.history(id).filter(s => s.t >= since); if (h.length < 2) return false; const e = h[h.length - 1];
  const w = h.filter(s => e.t - s.t <= win);
  if (e.span > 0) { const min = Math.min(...w.map(s => s.span)); return e.span / Math.max(1e-6, min) >= ratio; }
  const pressed = w.filter(s => s.down); if (pressed.length < 2) return false; const maxY = Math.max(...pressed.map(s => s.y)); return e.down && maxY - e.y >= 0.12;
};
/** circle: signed turns of the path about its running centre over the last `win` ms (positive = clockwise on screen) */
R.turns = function (id, { win = 2400, since = 0, needDown = false } = {}) {
  const h = In.history(id).filter(s => s.t >= since && (!needDown || s.down)); if (h.length < 6) return 0; const e = h[h.length - 1]; const w = h.filter(s => e.t - s.t <= win);
  const cx = w.reduce((a, s) => a + s.x, 0) / w.length, cy = w.reduce((a, s) => a + s.y, 0) / w.length;
  const rad = w.reduce((a, s) => a + Math.hypot(s.x - cx, s.y - cy), 0) / w.length; if (rad < 0.025) return 0;
  let turn = 0; for (let i = 1; i < w.length; i++) { const a0 = Math.atan2(w[i - 1].y - cy, w[i - 1].x - cx), a1 = Math.atan2(w[i].y - cy, w[i].x - cx); let d = a1 - a0; d = Math.atan2(Math.sin(d), Math.cos(d)); turn += d; }
  return turn / (2 * Math.PI);
};
/** pump: the number of vertical strokes (direction reversals of at least `amp`) since `since` */
R.strokes = function (id, { amp = 0.07, since = 0, key = 'py', needDown = false } = {}) {
  const h = In.history(id).filter(s => s.t >= since && (!needDown || s.down)); if (h.length < 3) return 0;
  let n = 0, dir = 0, ext = h[0][key];
  for (const s of h) { const v = s[key]; if (dir >= 0 && v < ext - amp) { if (dir > 0) n++; dir = -1; ext = v; } else if (dir <= 0 && v > ext + amp) { if (dir < 0) n++; dir = 1; ext = v; } else if ((dir > 0 && v > ext) || (dir < 0 && v < ext)) ext = v; else if (dir === 0) ext = v; }
  return n;
};
/** pull: two pinched hands — their separation; a pressed pointer — its distance from the press point */
R.pull = function () {
  const cs = In.cursors();
  if (cs.length >= 2 && (cs[0].src === 'hand' || cs[0].src === 'touch')) { const [a, b] = cs; return { two: true, both: a.down && b.down, d: Math.hypot(a.x - b.x, a.y - b.y), a, b }; }
  const c = cs[0]; if (c.src === 'mouse' && In.mouse.down && In.mouse.pressAt) return { two: false, both: true, d: Math.hypot(c.x - In.mouse.pressAt.x, c.y - In.mouse.pressAt.y), a: c };
  if (c.src === 'key') return { two: false, both: In.key.down, d: null, a: c, keyHold: In.key.down ? now() - (In.key.downSince || (In.key.downSince = now())) : (In.key.downSince = 0) };
  return { two: false, both: false, d: 0, a: c };
};
/** steer: -1..1 from the palm (hands) or pointer x, or the arrows */
R.steer = function () {
  const k = In.key; if (In.source === 'key') return (k.held.has('ArrowLeft') ? -1 : 0) + (k.held.has('ArrowRight') ? 1 : 0);
  const c = In.primary(); return Math.max(-1, Math.min(1, ((c.src === 'hand' ? c.px : c.x) - 0.5) * 2.6));
};
})();
