/* world/cinerium.js — the performance register: a shared, adjustable layer between words and LDraw transforms.

   A minifig has no elbows, no spine, no neck tilt. What it has is a set of one-axis joints, and emotion on it is
   carried by exaggerated mechanical poses (the body first), then the face. This module names those joints and
   the face's features as CHANNELS with clamps (the rules of LEGO movement), keeps per actor a performance
   (a base from PHRASES, keyed TRACKS on the reel clock, SPEECH from a line, LIFE during holds), samples it on a
   stepped clock (on twos: twelve holds a second, while the camera runs smooth; a slow shot runs smooth too, the
   stop-motion hack), projects requests a human body would answer with a bend onto what the toy can do (a look
   goes to head yaw, its excess to the torso's twist, its height to the torso's lean; a reach becomes an arm's
   pitch), and writes the result into the rig's pivots after the walk has posed them. The film grammar gains
   BEAT (an interval with a reason and a direction), SET (a channel), PHRASE (a named blend), PERFORM (an action
   with lead and follow), SPEAK (a line that moves the mouth and carries the head), FACE (a replacement head),
   STEP, LIFE and ASSERT (a close-up kept with the word it should read as). Repair is a program edit on the
   smallest responsible channel: INCREASE, REDUCE, EARLIER, LATER, KEEP. Node-safe for the pure parts. */
(function (root) {
'use strict';
const DEG = Math.PI / 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), clamp01 = v => clamp(v, 0, 1), smooth = x => x * x * (3 - 2 * x);
const M = 40;

/* ── the channels: name → [min, max, kind]. Body channels are radians (drop in LDU), face channels 0..1 (asymmetries −1..1). ── */
const CHANNELS = {
  'root.yaw': [-3.2, 3.2, 'body'], 'hips.pitch': [-0.25, 0.25, 'body'], 'torso.lean': [-0.35, 0.35, 'body'], 'torso.roll': [-0.2, 0.2, 'body'], 'torso.twist': [-0.6, 0.6, 'body'], 'head.yaw': [-1.57, 1.57, 'body'],
  'arm.L.pitch': [-3.14, 3.14, 'body'], 'arm.R.pitch': [-3.14, 3.14, 'body'], 'arm.L.out': [0, 0.35, 'body'], 'arm.R.out': [0, 0.35, 'body'], 'hand.L.roll': [-1.57, 1.57, 'body'], 'hand.R.roll': [-1.57, 1.57, 'body'],
  'leg.L.pitch': [-1.57, 1.05, 'body'], 'leg.R.pitch': [-1.57, 1.05, 'body'], 'hips.drop': [-20, 0, 'body'],
  'brow.up': [0, 1, 'face'], 'brow.knit': [0, 1, 'face'], 'brow.asym': [-1, 1, 'face'], 'eye.wide': [0, 1, 'face'], 'eye.narrow': [0, 1, 'face'], 'blink': [0, 1, 'face'], 'gaze.x': [-1, 1, 'face'], 'gaze.y': [-1, 1, 'face'],
  'mouth.jaw': [0, 1, 'face'], 'mouth.wide': [-1, 1, 'face'], 'mouth.press': [0, 1, 'face'], 'smile': [0, 1, 'face'], 'frown': [0, 1, 'face'], 'mouth.asym': [-1, 1, 'face'], 'cheek': [0, 1, 'face'], 'teeth': [0, 1, 'face'], 'tongue': [0, 1, 'face'],
};
const NAMES = Object.keys(CHANNELS);
const clampCh = (ch, v) => { const c = CHANNELS[ch]; return c ? clamp(+v || 0, c[0], c[1]) : +v || 0; };
/* the halfworld direction table's names for what a head does, in the toy's terms: a head cannot pitch or roll, the torso does it */
const ALIAS = { browUp: 'brow.up', browKnit: 'brow.knit', eyeWide: 'eye.wide', eyeNarrow: 'eye.narrow', jaw: 'mouth.jaw', mouthAsym: 'mouth.asym', smile: 'smile', frown: 'frown', cheek: 'cheek', headYaw: 'head.yaw', headPitch: 'torso.lean', headRoll: 'torso.roll', gazeX: 'gaze.x', gazeY: 'gaze.y', blink: 'blink' };
const asChannels = o => { const out = {}; for (const [k, v] of Object.entries(o || {})) { const ch = CHANNELS[k] ? k : ALIAS[k]; if (ch) out[ch] = clampCh(ch, v); } return out; };

/* ── phrases: the Odyssey's twenty directions (face and head) and the body phrases the halfworld scores name ── */
const A = DEG;
const PHRASES = {
  /* the poem's own five, then the rest of what its eighty-two beats ask for (scenes/_direction.mjs) */
  recognition:  asChannels({ browUp: .90, eyeWide: .62, headPitch: -.10, jaw: .14 }),
  contempt:     asChannels({ browKnit: .30, eyeNarrow: .58, mouthAsym: .70, headYaw: .12, headPitch: -.10 }),
  irony:        asChannels({ browUp: .30, eyeNarrow: .34, mouthAsym: .62, headRoll: -.10, smile: .14 }),
  appeal:       asChannels({ browUp: .70, browKnit: .30, eyeWide: .30, headPitch: -.16 }),
  weariness:    asChannels({ browUp: .26, browKnit: .18, eyeNarrow: .46, frown: .22, headPitch: .26 }),
  resolve:      asChannels({ browKnit: .40, eyeNarrow: .22, frown: .12, headPitch: -.04 }),
  command:      asChannels({ browKnit: .48, eyeWide: .16, frown: .10, headPitch: -.06 }),
  tenderness:   asChannels({ browUp: .34, smile: .30, eyeNarrow: .20, headPitch: .16, headRoll: .07 }),
  grief:        asChannels({ browUp: .50, browKnit: .52, frown: .52, headPitch: .34 }),
  anguish:      asChannels({ browUp: .80, browKnit: .60, frown: .60, eyeNarrow: .30, headPitch: .28 }),
  hurt:         asChannels({ browUp: .58, browKnit: .44, frown: .40, headPitch: .18, headRoll: .08 }),
  concern:      asChannels({ browUp: .48, browKnit: .40, frown: .28, headPitch: .12 }),
  fear:         asChannels({ browUp: .85, browKnit: .45, eyeWide: .80, headPitch: .10 }),
  wonder:       asChannels({ browUp: .68, eyeWide: .55, headPitch: -.14 }),
  joy:          asChannels({ smile: .85, browUp: .45, eyeWide: .25, cheek: .50 }),
  guarded:      asChannels({ browKnit: .28, eyeNarrow: .30, frown: .18, headYaw: .22 }),
  skepticism:   asChannels({ browUp: .16, browKnit: .36, eyeNarrow: .40, mouthAsym: .65, headRoll: -.22 }),
  confrontation:asChannels({ browKnit: .70, eyeNarrow: .35, frown: .45 }),
  desperation:  asChannels({ browUp: .95, browKnit: .22, eyeWide: .65, frown: .40 }),
  /* body phrases: what the toy does with its one-axis joints; arm pitch negative is forward and up */
  neutral: {}, stand: {},
  'arms crossed': { 'arm.L.pitch': -70 * A, 'arm.R.pitch': -70 * A, 'hand.L.roll': 0.3, 'hand.R.roll': -0.3, 'torso.lean': -0.04 },
  'open arms': { 'arm.L.pitch': -85 * A, 'arm.R.pitch': -85 * A, 'arm.L.out': 0.35, 'arm.R.out': 0.35, 'brow.up': .4, 'eye.wide': .3 },
  'hands near face': { 'arm.L.pitch': -125 * A, 'arm.R.pitch': -125 * A, 'arm.L.out': 0.12, 'arm.R.out': 0.12, 'hand.L.roll': 0.2, 'hand.R.roll': -0.2, 'eye.wide': .5, 'brow.up': .6, 'mouth.jaw': .25 },
  angry: { 'arm.L.pitch': -35 * A, 'arm.R.pitch': -35 * A, 'hips.pitch': 0.08, 'brow.knit': .75, 'frown': .5, 'eye.narrow': .3 },
  pointing: { 'arm.R.pitch': -90 * A, 'brow.knit': .3 },
  stop: { 'arm.R.pitch': -85 * A, 'hand.R.roll': -0.3, 'brow.knit': .35 },
  sad: { 'torso.lean': 0.16, 'arm.L.pitch': 12 * A, 'arm.R.pitch': 12 * A, 'brow.up': .5, 'brow.knit': .5, 'frown': .5, 'eye.narrow': .3, 'gaze.y': .4 },
  'look down': { 'torso.lean': 0.22, 'gaze.y': .7, 'eye.narrow': .2 },
  '3/4 left': { 'head.yaw': -0.65, 'torso.twist': -0.3 }, '3/4 right': { 'head.yaw': 0.65, 'torso.twist': 0.3 },
  'profile left': { 'head.yaw': -1.3, 'torso.twist': -0.6 }, 'profile right': { 'head.yaw': 1.3, 'torso.twist': 0.6 },
  shrug: { 'arm.L.pitch': -60 * A, 'arm.R.pitch': -60 * A, 'arm.L.out': 0.35, 'arm.R.out': 0.35, 'hand.L.roll': -0.3, 'hand.R.roll': 0.3, 'hips.drop': -3, 'brow.up': .6, 'frown': .25, 'torso.roll': 0.08 },
  wave: { 'arm.R.pitch': -160 * A, 'smile': .5 },
  'hands on hips': { 'arm.L.pitch': 25 * A, 'arm.R.pitch': 25 * A, 'arm.L.out': 0.3, 'arm.R.out': 0.3, 'hand.L.roll': 0.35, 'hand.R.roll': -0.35 },
  swagger: { 'hips.pitch': -0.14, 'arm.L.pitch': 30 * A, 'arm.R.pitch': 30 * A, 'arm.L.out': 0.2, 'arm.R.out': 0.2, 'smile': .3, 'eye.narrow': .25 },
  panic: { 'arm.L.pitch': -140 * A, 'arm.R.pitch': -120 * A, 'leg.R.pitch': -85 * A, 'hips.pitch': -0.1, 'eye.wide': .9, 'brow.up': .8, 'mouth.jaw': .6 },
  deadpan: { 'torso.roll': 0.12, 'head.yaw': -0.35, 'eye.narrow': .45, 'brow.asym': .5, 'mouth.press': .4 },
  listen: { 'head.yaw': 0.3, 'torso.twist': 0.1, 'brow.up': .2, 'eye.narrow': .1 },
  thinking: { 'arm.R.pitch': -145 * A, 'hand.R.roll': -0.4, 'torso.roll': 0.06, 'gaze.y': -.4, 'gaze.x': .4, 'brow.asym': .4, 'mouth.press': .3 },
  sit: { 'leg.L.pitch': -90 * A, 'leg.R.pitch': -90 * A, 'arm.L.pitch': -60 * A, 'arm.R.pitch': -60 * A, 'hips.drop': -12 },
  cheer: { 'arm.L.pitch': -150 * A, 'arm.R.pitch': -150 * A, 'smile': .9, 'eye.wide': .4, 'mouth.jaw': .5, 'brow.up': .6 },
  writing: { 'arm.R.pitch': -95 * A, 'hand.R.roll': -0.3, 'gaze.y': -.2, 'eye.narrow': .2, 'mouth.press': .3 },
  carry: { 'arm.L.pitch': -70 * A, 'arm.R.pitch': -70 * A },
  hold: { 'arm.L.pitch': -55 * A, 'arm.R.pitch': -55 * A, 'hand.L.roll': 0.4, 'hand.R.roll': -0.4 },
  play: { 'arm.L.pitch': -70 * A, 'arm.R.pitch': -80 * A, 'hand.L.roll': 0.35, 'hand.R.roll': -0.35, 'eye.narrow': .55, 'smile': .2, 'torso.roll': -0.06 },
  drive: { 'arm.L.pitch': -60 * A, 'arm.R.pitch': -60 * A, 'leg.L.pitch': -90 * A, 'leg.R.pitch': -90 * A },
};

/* ── the clock: the reel time, quantised on twos (twelve holds a second at 24) unless the shot is slow ── */
const quantize = (t, step, speed) => (step > 1 && !(speed < 1)) ? Math.floor(t * 24 / step + 1e-6) * step / 24 : t;
const STEPS = { ones: 1, twos: 2, threes: 3 };

/* ── the performance of one actor ── */
let seedN = 0;
function attach(a, rig) {
  const P = { name: a && a.name || 'me', a, rig, base: {}, phrases: [], tracks: {}, speech: null, life: 0.08, step: 2, seed: (seedN++ * 0.618) % 1, active: new Set(), beats: [], face: null, last: null, lastQ: null, blinkAt: 2 + (seedN % 5) * 0.7, asserts: [], fired: 0 };
  return P;
}
/** The value a channel's track gives at t: keys move from the previous value to their own over `over` seconds. */
function trackAt(P, ch, t, base) {
  const keys = P.tracks[ch]; if (!keys || !keys.length) return base;
  let prev = base, cur = base;
  for (const k of keys) { if (k.t > t) break; const u = k.over > 0 ? clamp01((t - k.t) / k.over) : 1; const f = k.curve === 'hold' ? (u >= 1 ? 1 : 0) : k.curve === 'linear' ? u : smooth(u); cur = prev + (k.v - prev) * f; if (u >= 1) prev = k.v; else prev = cur; }
  return cur;
}
/** The blended phrases at t: each phrase enters, holds and releases as a trapezoid of weight. */
function phrasesAt(P, t, out) {
  for (const ph of P.phrases) {
    const w = ph.t1 == null ? (t < ph.t0 ? 0 : t < ph.t0 + ph.enter ? smooth((t - ph.t0) / ph.enter) : 1)
      : (t < ph.t0 ? 0 : t < ph.t0 + ph.enter ? smooth((t - ph.t0) / Math.max(1e-3, ph.enter)) : t < ph.t1 ? 1 : t < ph.t1 + ph.release ? 1 - smooth((t - ph.t1) / Math.max(1e-3, ph.release)) : 0);
    if (w <= 0) continue; for (const [ch, v] of Object.entries(ph.vals)) { out[ch] = (out[ch] || 0) + v * w * (ph.k == null ? 1 : ph.k); P.active.add(ch); }
  }
}
/** The whole vector at reel time t, before quantisation: base + phrases + tracks + speech + carriage + life + blinks. */
function sample(P, t, gait) {
  const v = {}; P.active.clear();
  for (const [ch, b] of Object.entries(P.base)) { v[ch] = b; P.active.add(ch); }
  phrasesAt(P, t, v);
  for (const ch of Object.keys(P.tracks)) { if (!P.tracks[ch].length) continue; v[ch] = trackAt(P, ch, t, v[ch] || 0); P.active.add(ch); }
  const sp = P.speech, Face = root.Face;
  if (sp && Face && t >= sp.t0 - 0.05 && t <= sp.t0 + sp.sec + 0.35) {
    const u = t - sp.t0, m = Face.sampleMouth(sp.track, sp.env, sp.hz || 50, u), c = Face.speechCarriage(sp.env, sp.hz || 50, u, P.seed * 10);
    v['mouth.jaw'] = (v['mouth.jaw'] || 0) * 0.3 + m.jaw; v['mouth.wide'] = (v['mouth.wide'] || 0) + m.wide * 0.8; v['mouth.press'] = (v['mouth.press'] || 0) * 0.5 + m.press * 0.6; v['teeth'] = m.teeth; v['tongue'] = m.tongue;
    v['torso.lean'] = (v['torso.lean'] || 0) + c.pitch * 0.8; v['head.yaw'] = (v['head.yaw'] || 0) + c.yaw; v['torso.roll'] = (v['torso.roll'] || 0) + c.roll; v['brow.up'] = (v['brow.up'] || 0) + c.brow * 0.5;
    for (const ch of ['mouth.jaw', 'mouth.wide', 'mouth.press', 'teeth', 'tongue', 'torso.lean', 'head.yaw', 'torso.roll', 'brow.up']) P.active.add(ch);
    P.speaking = m.gate;
  } else P.speaking = 0;
  if (P.life > 0 && !(gait > 0.2)) {
    const s = P.seed * 6.28, L = P.life;
    v['hips.drop'] = (v['hips.drop'] || 0) - L * 6 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.28 * t + s)); v['head.yaw'] = (v['head.yaw'] || 0) + L * 0.35 * Math.sin(0.6 * t + s * 2) * Math.sin(0.23 * t + s); v['torso.roll'] = (v['torso.roll'] || 0) + L * 0.12 * Math.sin(0.41 * t + s * 3);
    P.active.add('hips.drop'); P.active.add('head.yaw'); P.active.add('torso.roll');
  }
  if (P.face) { const period = 3.4 + P.seed * 2.2, ph = ((t + P.seed * 7) % period); v['blink'] = Math.max(v['blink'] || 0, ph < 0.12 ? 1 : ph < 0.2 ? 0.5 : 0); P.active.add('blink'); }
  for (const ch of Object.keys(v)) v[ch] = clampCh(ch, v[ch]);
  return v;
}
/** Write the sampled vector into the rig's pivots (after the walk posed them) and paint the face. Returns the vector. */
function apply(P, t, opts) {
  const rig = P.rig; if (!rig) return null; const speed = opts && opts.speed, gait = rig.gait || 0;
  const q = quantize(t, P.step, speed); let v;
  if (P.last && P.lastQ === q) v = P.last; else { v = sample(P, q, gait); P.last = v; P.lastQ = q; }
  const on = ch => P.active.has(ch);
  if (!rig.seated && !rig.air && !(P.a && P.a.poseNow === 'prone')) {
    if (gait > 0.3 && P.tracks['root.yaw'] && P.tracks['root.yaw'].length) { P.tracks['root.yaw'] = []; P.last = null; v['root.yaw'] = 0; }   /* a walk owns the heading: a look's turn is released the moment the actor steps off, so the walk is not fought or undone at its end */
    rig.figure.rotation.y = rig.heading + (on('root.yaw') ? v['root.yaw'] : 0);   /* root.yaw is a turn from the walk's own heading, never the heading itself: a look that runs past the neck and the torso turns the feet by the excess, and a phrase's three-quarter turn is a turn from wherever the actor stands */
    if (on('hips.pitch')) rig.figure.rotation.x = v['hips.pitch'];
    if (on('torso.lean')) rig.torsoP.rotation.x += v['torso.lean']; if (on('torso.roll')) rig.torsoP.rotation.z -= v['torso.roll']; if (on('torso.twist')) rig.torsoP.rotation.y -= v['torso.twist'];
    if (on('head.yaw')) rig.headP.rotation.y = -v['head.yaw'];   /* the pivots hang under the figure's flip (y down), so a yaw or a roll about their own axes turns the world's other way: negated here so a positive yaw turns the head the way a positive root yaw turns the figure */
    if (on('arm.L.pitch') && !rig.swing) rig.armLP.rotation.x = v['arm.L.pitch']; if (on('arm.R.pitch') && !rig.swing && !rig.aim) rig.armRP.rotation.x = v['arm.R.pitch'];
    rig.armLP.rotation.z = on('arm.L.out') ? v['arm.L.out'] : 0; rig.armRP.rotation.z = on('arm.R.out') ? -v['arm.R.out'] : 0;
    const hL = rig.mounted && rig.mounted.handL, hR = rig.mounted && rig.mounted.handR; if (hL) hL.group.rotation.y = on('hand.L.roll') ? v['hand.L.roll'] : 0; if (hR) hR.group.rotation.y = on('hand.R.roll') ? v['hand.R.roll'] : 0;
    if (on('leg.L.pitch') && gait < 0.2) rig.legLP.rotation.x = v['leg.L.pitch']; if (on('leg.R.pitch') && gait < 0.2) rig.legRP.rotation.x = v['leg.R.pitch'];
    if (on('hips.drop')) rig.hipsP.position.y += v['hips.drop'];
  }
  if (P.face && root.Face) root.Face.paint(P.face, v);
  return v;
}

/* ── projection: what a human body would do with a bend, the toy does with its one axes ── */
/** A look at a world point: the bearing goes to the head (±80°), the excess to the torso's twist, then to the root; the height to the torso's lean. */
function lookAt(P, target, t, opts) {
  const rig = P.rig, o = opts || {}; if (!rig || !target) return null;
  const dx = target.x - rig.pos.x, dz = target.z - rig.pos.z, bearing = Math.atan2(dx, dz); let rel = bearing - rig.heading; while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
  const head = clamp(rel, -80 * DEG, 80 * DEG), twist = clamp(rel - head, -0.6, 0.6), rest = rel - head - twist;
  const dy = (target.y != null ? target.y : rig.pos.y + 1.2 * M) - (rig.pos.y + 1.45 * M), dist = Math.hypot(dx, dz) || 1, lean = clamp(-Math.atan2(dy, dist) * 0.5, -0.3, 0.3);
  const lead = o.lead || {}, T = t || 0; const out = { head, twist, rest, lean, rel };
  key(P, 'gaze.x', clamp(rel / (80 * DEG), -1, 1) * 0.8, T + (lead.eyes || 0), o.over != null ? o.over * 0.5 : 0.12);
  key(P, 'head.yaw', head, T + (lead.head || 0.08), o.over != null ? o.over : 0.25);
  if (Math.abs(twist) > 0.01 || o.torso) key(P, 'torso.twist', twist, T + (lead.torso || 0.16), o.over != null ? o.over * 1.2 : 0.3);
  if (Math.abs(rest) > 0.05) key(P, 'root.yaw', rest, T + (lead.root || 0.25), o.over != null ? o.over * 1.6 : 0.5);   // the excess as a turn from the heading
  if (Math.abs(lean) > 0.03) key(P, 'torso.lean', lean, T + (lead.torso || 0.16), o.over != null ? o.over : 0.3);
  if (!o.keepGaze) key(P, 'gaze.x', 0, T + (lead.head || 0.08) + 0.35, 0.2);
  return out;
}
/** A reach: the arm's pitch from the shoulder toward a point, projected onto the figure's sagittal plane; never an elbow. */
function reach(P, side, target, t, opts) {
  const rig = P.rig; if (!rig || !target) return null; const o = opts || {};
  const dx = target.x - rig.pos.x, dz = target.z - rig.pos.z, fwd = dx * Math.sin(rig.heading) + dz * Math.cos(rig.heading), up = (target.y != null ? target.y : rig.pos.y + M) - (rig.pos.y + 1.2 * M);
  const pitch = clamp(-Math.atan2(fwd, -up) , -3.14, 3.14);   // arm forward and up is negative pitch about the shoulder's x axis
  key(P, `arm.${side}.pitch`, pitch, t || 0, o.over != null ? o.over : 0.3); if (o.point) key(P, `hand.${side}.roll`, side === 'L' ? 0.4 : -0.4, t || 0, 0.2); return pitch;
}
/** One key on a channel: from wherever the channel is at t to v over `over` seconds. */
function key(P, ch, v, t, over, curve) { if (!CHANNELS[ch]) return false; const K = P.tracks[ch] || (P.tracks[ch] = []); K.push({ t: +t || 0, v: clampCh(ch, v), over: over == null ? 0.25 : Math.max(0, +over), curve: curve || 'ease' }); K.sort((a, b) => a.t - b.t); P.last = null; return true; }
function phrase(P, name, t, o) {
  const vals = PHRASES[String(name || '').toLowerCase()]; if (!vals) return false; o = o || {};
  P.phrases.push({ name, vals, t0: +t || 0, enter: o.enter == null ? 0.35 : +o.enter, t1: o.hold != null ? (+t || 0) + (o.enter == null ? 0.35 : +o.enter) + +o.hold : null, release: o.release == null ? 0.5 : +o.release, k: o.k }); P.last = null; return true;
}
/** Say a line: the text as visemes over its seconds, the voice's envelope gating the jaw, the head carried by it. */
function speak(P, o) { const Face = root.Face; if (!Face) return false; P.speech = { t0: +o.t || 0, sec: Math.max(0.3, +o.sec || 1), track: Face.visemeTrack(o.text, Math.max(0.3, +o.sec || 1)), env: o.env || null, hz: o.hz || 50, text: o.text }; P.last = null; if (o.gesture !== false) gestures(P, P.speech); return true; }
/* ── the hands on the voice: a speaker's arms move on the stresses of the line ──────────────────────────────────────────
   The envelope's peaks are the stresses. Each strong one raises the forward hand a little, the wrist turning out, and every
   fourth or so the other hand joins; the head dips a hair on the strongest. Between stresses the hand settles back toward
   where the phrase left it. Small, one-axis, and keyed, so a phrase (open arms, arms crossed) sits under it. */
function gestures(P, sp) {
  const env = sp.env; if (!env || env.length < 10) return 0; const hz = sp.hz || 50, n = env.length;
  const sm = new Float32Array(n); const w = Math.max(1, Math.round(hz * 0.08)); for (let i = 0; i < n; i++) { let a = 0, c = 0; for (let k = -w; k <= w; k++) { const j = i + k; if (j >= 0 && j < n) { a += env[j]; c++; } } sm[i] = a / c; }
  let mx = 0; for (let i = 0; i < n; i++) if (sm[i] > mx) mx = sm[i]; if (mx <= 0) return 0;
  const peaks = []; let last = -1e9; for (let i = 1; i < n - 1; i++) { if (sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && sm[i] > 0.45 * mx && (i - last) / hz >= 0.55) { peaks.push({ t: i / hz, k: sm[i] / mx }); last = i; } }
  const base = P.base || {}; let count = 0;
  peaks.forEach((pk, i) => {
    const t = sp.t0 + pk.t, side = i % 4 === 3 ? 'L' : 'R', rest = base[`arm.${side}.pitch`] || 0, lift = rest - (0.25 + 0.35 * pk.k);
    key(P, `arm.${side}.pitch`, lift, t - 0.10, 0.18, 'ease'); key(P, `arm.${side}.pitch`, rest - 0.10 * pk.k, t + 0.45, 0.35, 'ease');   /* the arm only: a LEGO wrist turned mid-gesture reads as a broken hand */
    if (pk.k > 0.85) { key(P, 'torso.lean', 0.05, t - 0.05, 0.15, 'ease'); key(P, 'torso.lean', 0, t + 0.5, 0.4, 'ease'); }
    count++; });
  key(P, 'arm.R.pitch', base['arm.R.pitch'] || 0, sp.t0 + sp.sec + 0.3, 0.6, 'ease'); key(P, 'arm.L.pitch', base['arm.L.pitch'] || 0, sp.t0 + sp.sec + 0.3, 0.6, 'ease');
  P.gestures = count; return count;
}

/* ── actions: a director's verbs, resolved when they fire, written as keys with lead and follow ── */
function act(P, ev, ctx) {
  const t = ctx.t, sub = ctx.subject, verb = String(ev.verb || '').toUpperCase(), T = n => ev[n] != null ? +ev[n] : undefined;
  const lead = { eyes: T('leadEyes'), head: T('followHead'), torso: T('followTorso'), root: T('followRoot') };
  switch (verb) {
    case 'TURN': { const tg = sub(ev.target); if (!tg) return false; lookAt(P, tg, t, { lead, over: ev.over, torso: true, keepGaze: ev.keepGaze }); return true; }
    case 'LOOK': { const tg = sub(ev.target); if (!tg) return false; lookAt(P, tg, t, { lead, over: ev.over, keepGaze: ev.keepGaze }); return true; }
    case 'GLANCE': { const tg = sub(ev.target); if (!tg) return false; const r = lookAt(P, tg, t, { lead: { eyes: 0, head: 0.05 }, over: 0.15 }); key(P, 'head.yaw', 0, t + (ev.for || 0.8), 0.3); key(P, 'gaze.x', 0, t + (ev.for || 0.8), 0.2); return !!r; }
    case 'LEAN': key(P, 'hips.pitch', ev.v != null ? +ev.v : 0.12, t, ev.over != null ? ev.over : 0.4); return true;
    case 'REACH': case 'POINT': { const tg = sub(ev.target); if (!tg) return false; reach(P, ev.side || 'R', tg, t, { over: ev.over, point: verb === 'POINT' }); if (verb === 'POINT') key(P, 'brow.knit', 0.3, t, 0.2); return true; }
    case 'RAISE': key(P, `arm.${ev.side || 'R'}.pitch`, ev.v != null ? +ev.v : -160 * DEG, t, ev.over != null ? ev.over : 0.25); return true;
    case 'LOWER': key(P, `arm.${ev.side || 'R'}.pitch`, ev.v != null ? +ev.v : 0, t, ev.over != null ? ev.over : 0.3); return true;
    case 'CROSS': phrase(P, 'arms crossed', t, { enter: ev.over != null ? ev.over : 0.3, hold: ev.for, release: 0.4 }); return true;
    case 'UNCROSS': key(P, 'arm.L.pitch', 0, t, 0.3); key(P, 'arm.R.pitch', 0, t, 0.3); key(P, 'hand.L.roll', 0, t, 0.3); key(P, 'hand.R.roll', 0, t, 0.3); return true;
    case 'HOP': key(P, 'hips.drop', -8, t, 0.08, 'linear'); key(P, 'hips.drop', 0, t + 0.12, 0.1); key(P, 'leg.L.pitch', -0.5, t, 0.08); key(P, 'leg.L.pitch', 0, t + 0.2, 0.15); return true;
    case 'RECOIL': key(P, 'hips.pitch', -0.2, t, 0.08, 'linear'); key(P, 'hips.pitch', 0, t + 0.25, 0.35); key(P, 'arm.L.pitch', -120 * DEG, t, 0.08); key(P, 'arm.R.pitch', -120 * DEG, t, 0.08); key(P, 'arm.L.pitch', 0, t + 0.5, 0.4); key(P, 'arm.R.pitch', 0, t + 0.5, 0.4); key(P, 'eye.wide', 1, t, 0.05); key(P, 'eye.wide', 0, t + 0.6, 0.3); return true;
    case 'SETTLE': for (const ch of Object.keys(P.tracks)) key(P, ch, 0, t, ev.over != null ? ev.over : 0.5); return true;
    case 'HOLD': { if (ev.phrase) phrase(P, ev.phrase, t, { enter: 0.25, hold: ev.for, release: 0.4 }); if (ev.life != null) P.life = +ev.life; return true; }
    case 'SHIFT': key(P, 'hips.drop', -3, t, 0.2); key(P, 'torso.roll', ev.v != null ? +ev.v : 0.06, t, 0.25); key(P, 'hips.drop', 0, t + 0.5, 0.3); return true;
    case 'SWAY': key(P, 'torso.roll', 0.08, t, 0.4); key(P, 'torso.roll', -0.08, t + 0.8, 0.5); key(P, 'torso.roll', 0, t + 1.6, 0.4); return true;
    case 'NOD': key(P, 'torso.lean', 0.14, t, 0.12); key(P, 'torso.lean', 0, t + 0.28, 0.2); return true;
    case 'SHAKE': key(P, 'head.yaw', -0.35, t, 0.1); key(P, 'head.yaw', 0.35, t + 0.22, 0.12); key(P, 'head.yaw', 0, t + 0.45, 0.15); return true;
  }
  return false;
}

/* ── the grammar: lines of the film's text and the events they become ── */
const fmt = v => (Math.round(v * 1000) / 1000).toString();
const quoted = s => [...String(s).matchAll(/"([^"]*)"/g)].map(m => m[1]);
const numOf = (t, re) => { const m = t.match(re); return m ? +m[1] : undefined; };
/** A performance directive → an event of the current shot, or null when the line is not one. */
function parseLine(line) {
  const m = String(line).match(/!MENTO\s+(BEAT|SET|PHRASE|PERFORM|SPEAK|FACE|ASSERT|STEP|LIFE|INCREASE|REDUCE|EARLIER|LATER|KEEP)\b/); if (!m) return null;
  const what = m[1].toUpperCase(), rest = line.slice(line.indexOf(m[1]) + m[1].length), q = quoted(rest), t = rest.replace(/"[^"]*"/g, '""');
  const at = numOf(t, /\bAT\s+([\d.]+)/) || 0, ev = { what, who: q[0] || 'me', at };
  switch (what) {
    case 'BEAT': ev.id = q[0] || 'beat'; ev.who = q[1] || 'me'; ev.at = numOf(t, /\bFROM\s+([\d.]+)/) || 0; ev.to = numOf(t, /\bTO\s+([\d.]+)/); { const w = rest.match(/\bWHY\s+"([^"]*)"/); if (w) ev.why = w[1]; } { const d = t.match(/\bDIRECT\s+([\w/-]+)/i); if (d) ev.direct = d[1].toLowerCase(); else { const dq = rest.match(/\bDIRECT\s+"([^"]*)"/); if (dq) ev.direct = dq[1].toLowerCase(); } } break;
    case 'SET': { const c = t.match(/""\s+([\w.]+)\s+(-?[\d.]+)/); if (!c) return null; ev.ch = c[1]; ev.v = +c[2]; ev.over = numOf(t, /\bOVER\s+([\d.]+)/); const cu = t.match(/\bCURVE\s+(\w+)/i); if (cu) ev.curve = cu[1].toLowerCase(); break; }
    case 'PHRASE': { const nm = q[1] || (t.match(/""\s+([\w/-]+)/) || [])[1]; if (!nm) return null; ev.name = nm.toLowerCase(); ev.enter = numOf(t, /\bENTER\s+([\d.]+)/); ev.hold = numOf(t, /\bHOLD\s+([\d.]+)/); ev.release = numOf(t, /\bRELEASE\s+([\d.]+)/); ev.k = numOf(t, /\bK\s+([\d.]+)/); break; }
    case 'PERFORM': { const vb = t.match(/""\s+([A-Z]+)\b/); if (!vb) return null; ev.verb = vb[1]; ev.target = q[1]; const side = t.match(/\b(L|R)\b/); if (side && /REACH|POINT|RAISE|LOWER/.test(ev.verb)) ev.side = side[1]; ev.v = numOf(t, /\bBY\s+(-?[\d.]+)/); if (ev.v === undefined) ev.v = numOf(t, /\bV\s+(-?[\d.]+)/); ev.over = numOf(t, /\bOVER\s+([\d.]+)/); ev.for = numOf(t, /\bFOR\s+([\d.]+)/); ev.leadEyes = numOf(t, /\bLEAD\s+eyes\s+([\d.]+)/i); ev.followHead = numOf(t, /\bFOLLOW\s+head\s+([\d.]+)/i); ev.followTorso = numOf(t, /\bFOLLOW\s+torso\s+([\d.]+)/i); ev.followRoot = numOf(t, /\bFOLLOW\s+root\s+([\d.]+)/i); if (/\bKEEP\s+gaze\b/i.test(t)) ev.keepGaze = true; if (ev.verb === 'HOLD') { ev.phrase = q[1]; ev.life = numOf(t, /\bLIFE\s+([\d.]+)/); } break; }
    case 'SPEAK': { ev.text = q[1] || ''; const f = t.match(/\bFILE\s+([\w./-]+)/); if (f) ev.file = f[1]; ev.from = numOf(t, /\bFROM\s+([\d.]+)/); ev.for = numOf(t, /\bFOR\s+([\d.]+)/); const vc = t.match(/\bVOICE\s+(\w+)/); if (vc) ev.voice = vc[1].toLowerCase(); break; }
    case 'FACE': { const nm = q[1] || (t.match(/""\s+([\w]+)/) || [])[1]; if (!nm) return null; ev.name = nm.toLowerCase(); break; }
    case 'ASSERT': { const r = t.match(/\bREADS_AS\s+([\w/-]+)/i); ev.reads = r ? r[1].toLowerCase() : (q[1] || 'neutral'); { const n = t.match(/\bNOT\s+([\w/-]+)/i); if (n) ev.not = n[1].toLowerCase(); } break; }
    case 'STEP': { const s = t.match(/\b(ONES|TWOS|THREES|\d)\b/i); ev.step = s ? (STEPS[s[1].toLowerCase()] || +s[1] || 2) : 2; break; }
    case 'LIFE': ev.v = numOf(t, /""\s+([\d.]+)/); if (ev.v === undefined) ev.v = 0.08; break;
    case 'INCREASE': case 'REDUCE': { const c = t.match(/""\s+([\w.]+)/); if (!c) return null; ev.ch = c[1]; ev.by = numOf(t, /\bBY\s+(-?[\d.]+)/); if (ev.by === undefined) ev.by = 0.15; if (what === 'REDUCE') ev.by = -ev.by; ev.what = 'NUDGE'; break; }
    case 'EARLIER': case 'LATER': { const c = t.match(/""\s+([\w.]+)/); if (!c) return null; ev.ch = c[1]; ev.by = numOf(t, /\bBY\s+([\d.]+)/); if (ev.by === undefined) ev.by = 0.1; if (what === 'LATER') ev.by = -ev.by; ev.what = 'TIMESHIFT'; ev.at = 0; break; }
    case 'KEEP': { const c = t.match(/""\s+([\w.]+)/); if (!c) return null; ev.ch = c[1]; break; }
  }
  return ev;
}
/** The line for an event (the inverse of parseLine), or null when the event is not a performance one. */
function eventText(ev) {
  const Q = s => `"${String(s == null ? '' : s).replace(/"/g, "'")}"`, o = [];
  switch (ev.what) {
    case 'BEAT': o.push('BEAT', Q(ev.id), Q(ev.who), 'FROM', fmt(ev.at || 0)); if (ev.to != null) o.push('TO', fmt(ev.to)); if (ev.why) o.push('WHY', Q(ev.why)); if (ev.direct) o.push('DIRECT', /[^\w/-]/.test(ev.direct) ? Q(ev.direct) : ev.direct); return o.join(' ');
    case 'SET': o.push('SET', Q(ev.who), ev.ch, fmt(+ev.v || 0), 'AT', fmt(ev.at || 0)); if (ev.over != null) o.push('OVER', fmt(ev.over)); if (ev.curve) o.push('CURVE', ev.curve); return o.join(' ');
    case 'PHRASE': o.push('PHRASE', Q(ev.who), /[^\w/-]/.test(ev.name) ? Q(ev.name) : ev.name, 'AT', fmt(ev.at || 0)); if (ev.enter != null) o.push('ENTER', fmt(ev.enter)); if (ev.hold != null) o.push('HOLD', fmt(ev.hold)); if (ev.release != null) o.push('RELEASE', fmt(ev.release)); if (ev.k != null) o.push('K', fmt(ev.k)); return o.join(' ');
    case 'PERFORM': o.push('PERFORM', Q(ev.who), ev.verb); if (ev.verb === 'HOLD' && ev.phrase) o.push(Q(ev.phrase)); else if (ev.target) o.push(Q(ev.target)); if (ev.side) o.push(ev.side); if (ev.v != null) o.push('BY', fmt(ev.v)); o.push('AT', fmt(ev.at || 0)); if (ev.over != null) o.push('OVER', fmt(ev.over)); if (ev.for != null) o.push('FOR', fmt(ev.for)); if (ev.leadEyes != null) o.push('LEAD eyes', fmt(ev.leadEyes)); if (ev.followHead != null) o.push('FOLLOW head', fmt(ev.followHead)); if (ev.followTorso != null) o.push('FOLLOW torso', fmt(ev.followTorso)); if (ev.followRoot != null) o.push('FOLLOW root', fmt(ev.followRoot)); if (ev.keepGaze) o.push('KEEP gaze'); if (ev.life != null) o.push('LIFE', fmt(ev.life)); return o.join(' ');
    case 'SPEAK': o.push('SPEAK', Q(ev.who), Q(ev.text), 'AT', fmt(ev.at || 0)); if (ev.file) { o.push('FILE', ev.file); if (ev.from != null) o.push('FROM', fmt(ev.from)); if (ev.for != null) o.push('FOR', fmt(ev.for)); } if (ev.voice) o.push('VOICE', ev.voice); return o.join(' ');
    case 'FACE': return ['FACE', Q(ev.who), ev.name, 'AT', fmt(ev.at || 0)].join(' ');
    case 'ASSERT': o.push('ASSERT', Q(ev.who), 'READS_AS', ev.reads, 'AT', fmt(ev.at || 0)); if (ev.not) o.push('NOT', ev.not); return o.join(' ');
    case 'STEP': return ['STEP', Q(ev.who), ev.step === 1 ? 'ONES' : ev.step === 3 ? 'THREES' : 'TWOS', 'AT', fmt(ev.at || 0)].join(' ');
    case 'LIFE': return ['LIFE', Q(ev.who), fmt(ev.v == null ? 0.08 : ev.v), 'AT', fmt(ev.at || 0)].join(' ');
    case 'NUDGE': return [ev.by >= 0 ? 'INCREASE' : 'REDUCE', Q(ev.who), ev.ch, 'BY', fmt(Math.abs(ev.by)), 'AT', fmt(ev.at || 0)].join(' ');
    case 'TIMESHIFT': return [ev.by >= 0 ? 'EARLIER' : 'LATER', Q(ev.who), ev.ch, 'BY', fmt(Math.abs(ev.by))].join(' ');
    case 'KEEP': return ['KEEP', Q(ev.who), ev.ch, 'AT', fmt(ev.at || 0)].join(' ');
  }
  return null;
}
const PERF_EVENTS = new Set(['BEAT', 'SET', 'PHRASE', 'PERFORM', 'SPEAK', 'FACE', 'ASSERT', 'STEP', 'LIFE', 'NUDGE', 'TIMESHIFT', 'KEEP']);

/* ── firing: an event of the playing shot, at the reel time, against the actors ── */
const hooks = { face: null, snapshot: null, line: null, env: null, log: null };
function fire(ev, ctx) {
  if (!PERF_EVENTS.has(ev.what)) return false; const P = ctx.perf(ev.who); const t = ctx.t;
  if (!P && ev.what === 'SPEAK') { const sec = ev.for != null ? +ev.for : (hooks.line ? hooks.line.sec(ev) : 2); if (hooks.line) hooks.line.play({ ...ev, narration: true }, sec); return true; }   // a voice with no body (the narrator) is heard and read, and moves no mouth
  if (!P && ev.what !== 'BEAT') { if (hooks.log) hooks.log(`${ev.what}: no performer "${ev.who}"`); return true; }
  switch (ev.what) {
    case 'BEAT': { const b = { id: ev.id, who: ev.who, t0: t, t1: ev.to != null ? t + (ev.to - ev.at) : null, why: ev.why || '', direct: ev.direct || null }; ctx.beat(b); if (P) { P.beats.push(b); if (b.direct && PHRASES[b.direct]) phrase(P, b.direct, t, { enter: 0.35, hold: b.t1 != null ? Math.max(0.2, b.t1 - t - 0.35) : undefined, release: 0.5 }); } return true; }
    case 'SET': key(P, ev.ch, ev.v, t, ev.over, ev.curve); return true;
    case 'PHRASE': if (!phrase(P, ev.name, t, ev) && hooks.log) hooks.log(`PHRASE: unknown "${ev.name}"`); return true;
    case 'PERFORM': if (!act(P, ev, { t, subject: ctx.subject }) && hooks.log) hooks.log(`PERFORM: ${ev.verb} did nothing for "${ev.who}"`); return true;
    case 'SPEAK': { const sec = ev.for != null ? +ev.for : (hooks.line ? hooks.line.sec(ev) : 0.3 + String(ev.text || '').split(/\s+/).length * 0.36); const env = hooks.env ? hooks.env(ev) : null; speak(P, { t, sec, text: ev.text, env: env && env.env, hz: env && env.hz }); if (hooks.line) hooks.line.play(ev, sec); return true; }
    case 'FACE': if (hooks.face) hooks.face(P, ev.name); return true;
    case 'ASSERT': { const rec = { who: ev.who, reads: ev.reads, not: ev.not || null, t, beat: P.beats.length ? P.beats[P.beats.length - 1].id : null, vec: P.last ? { ...P.last } : null, picture: null }; if (hooks.snapshot) { try { rec.picture = hooks.snapshot(P); } catch (e) { } } P.asserts.push(rec); ctx.assert(rec); return true; }
    case 'STEP': P.step = ev.step || 2; P.last = null; return true;
    case 'LIFE': P.life = ev.v == null ? 0.08 : +ev.v; P.last = null; return true;
    case 'NUDGE': { const cur = P.last ? (P.last[ev.ch] || 0) : (P.base[ev.ch] || 0); key(P, ev.ch, cur + ev.by, t, 0.2); return true; }
    case 'TIMESHIFT': { const K = P.tracks[ev.ch]; if (K) for (const k of K) k.t -= ev.by; P.last = null; return true; }
    case 'KEEP': { const cur = P.last ? (P.last[ev.ch] || 0) : (P.base[ev.ch] || 0); P.tracks[ev.ch] = []; P.base[ev.ch] = cur; P.last = null; return true; }
  }
  return false;
}
/** A summary a page or a test can read. */
function stats(P) { return P ? { name: P.name, step: P.step, life: P.life, active: [...P.active], tracks: Object.fromEntries(Object.entries(P.tracks).map(([k, v]) => [k, v.length])), phrases: P.phrases.map(p => p.name), speech: P.speech ? { text: P.speech.text, sec: P.speech.sec, t0: P.speech.t0, hasEnv: !!P.speech.env } : null, speaking: P.speaking || 0, beats: P.beats.length, asserts: P.asserts.length, vec: P.last ? { ...P.last } : null, faceDraws: P.face ? P.face.draws : 0 } : null; }
function reset(P) { P.base = {}; P.phrases = []; P.tracks = {}; P.speech = null; P.last = null; P.lastQ = null; }

root.Perform = { gestures, CHANNELS, NAMES, PHRASES, ALIAS, STEPS, PERF_EVENTS, hooks, attach, sample, apply, quantize, trackAt, lookAt, reach, key, phrase, speak, act, parseLine, eventText, fire, stats, reset, asChannels, clampCh };
})(typeof window !== 'undefined' ? window : globalThis);
