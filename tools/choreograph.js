#!/usr/bin/env node
/* tools/choreograph.js — the choreographer: an animator's rough pass for a scene of the Odyssey film, written as a motion-control
   programme (odyssey/choreo/<scene>.json, format odyssey-choreo/1, played by film-readymades/choreo.js inside take mode).

   The take (film-readymades/odyssey-take.js) stages the keyframe blocking and eases between the marks; on its own it holds every
   figure still between keys, with only a face moving. This writes the acting layer over that blocking (layer 'add': every channel
   an offset from the pose the take gives the figure at that frame), for every figure, for the whole scene, as keyed channels on
   the voice clock, in named layers that sum:
     @breath  the idle breath of every figure the whole time (the torso, the shoulders, the head; the hips' bob when standing)
     @shift   weight shifts and settles in the holds (a hip roll and its counter in the torso), so a hold still moves
     @look    who looks at whom: the speaker at the one addressed, listeners turning to the speaker a beat late (head first, the
              torso after, the feet last when the turn is big); glances away at the ends of phrases and back
     @beat    the speaker's gestures on the phrase starts and stressed syllables of the recorded voice (its 50 Hz envelope), the
              vocabulary chosen by the scene's _direction.mjs emotion and the turn's act (welcome, command, anger, grief, plea...);
              anticipation, the strike, a hold that drifts, overlap (head leads, torso follows, the arm trails, the hand last)
     @react   listeners' nods on the speaker's stresses, a lean in on the key beat, a small answering gesture
     @work    business for everyone not otherwise acting (feasting, dice, pouring, carrying, scanning, talking to a neighbour)
     @act     the action verbs of the scene (rowing, straining at the mast, drawing the bow, the fall, singing, binding, taking the
              spear) from film-readymades/motion.js clips or keys written here
     @walk    the walk's bob and lean over the take's own walk cycle when the blocking moves a figure between two marks
   plus props (a spear given) and rigs (a ship's pitch, roll and heave with its riders).
   A director's `overrides` in an existing sheet are kept verbatim across regeneration.

   node tools/choreograph.js probe  OD-B01-S03   the page's reading of the take (marks, snapshots, clips, envelope, cut) and the
                                                 acting density of the take without and with the sheet -> odyssey/choreo/marks/<id>.json,
                                                 odyssey/choreo/density/<id>.json (opens the player headless: ~15 min on swiftshader)
   node tools/choreograph.js gen    OD-B01-S03   marks -> odyssey/choreo/<id>.json (seconds; no browser)
   node tools/choreograph.js density OD-B01-S03  the density probe alone (before and after)
   Needs the repository served on :8899 and playwright on NODE_PATH for probe/density. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'odyssey/choreo');
const Choreo = require(path.join(ROOT, 'film-readymades/choreo.js'));
const args = process.argv.slice(2), cmd = args[0], sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const MODE = opt('mode', 'cut');

/* ── small tools ── */
const F = 12, q = t => Math.round(t * F) / F, r3 = v => Math.round(v * 1000) / 1000;
const cl = (v, a, b) => Math.max(a, Math.min(b, v)), sm = u => { u = cl(u, 0, 1); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
function hash32(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function rng(seed) { let s = hash32(String(seed)); return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (R, a) => a[Math.floor(R() * a.length) % a.length];

/* ═══════════════ the sheet being written: lanes of keys, one per channel@layer ═══════════════ */
function Sheet() {
  /* the keys are gathered as moves (one gesture, one look, one nod: a call of a move below) and written at the end in the order the
     moves start, so a move that starts later truncates what an earlier move left on the same lane after it (a gesture interrupted
     is how a chain of gestures reads), whatever order the choreographer thought of them in. A value may be {rel: d}: the lane's own
     value where the move starts, plus d (a move that starts from wherever the channel is). */
  const actors = {}, moves = [], stack = [];
  const lane = (id, ch, layer) => { const A = actors[id] || (actors[id] = { channels: {} }), k = ch + '@' + layer; return A.channels[k] || (A.channels[k] = []); };
  function key(id, layer, t, vals, ease) { t = Math.max(0, q(t)); const k = { id, layer, t, vals, ease };
    if (stack.length) stack[stack.length - 1].keys.push(k); else moves.push({ keys: [k], n: moves.length }); }
  const begin = () => { const m = { keys: [], n: moves.length }; moves.push(m); stack.push(m); }, end = () => stack.pop();
  const rel = d => ({ rel: d || 0 }), at = () => rel(0);
  function valueAt(L, t) { return L.length ? Choreo.sampleKeys(L, t, '') : 0; }
  function write() {
    const M = moves.filter(m => m.keys.length).map(m => ({ ...m, t0: Math.min(...m.keys.map(k => k.t)) })).sort((a, b) => a.t0 - b.t0 || a.n - b.n);
    for (const m of M) { const start = new Map(), ks = m.keys.map((k, i) => ({ k, i })).sort((a, b) => a.k.t - b.k.t || a.i - b.i).map(x => x.k);
      for (const { id, layer, t, vals, ease } of ks) for (const [ch, v0] of Object.entries(vals)) {
        if (v0 == null) continue; const L = lane(id, ch, layer);
        const nm = id + ch + layer;
        if (!start.has(nm)) { const s0 = valueAt(L, m.t0); start.set(nm, s0);   /* the move takes the lane from where it is at the move's start */
          while (L.length && L[L.length - 1][0] > m.t0 + 1e-6) L.pop(); if (!L.length || L[L.length - 1][0] < m.t0 - 1e-6) { if (!L.length && m.t0 > 0) L.push([0, 0]); L.push([m.t0, r3(s0)]); } }
        let v = v0; if (typeof v0 === 'object') v = start.get(nm) + v0.rel;
        if (!isFinite(v)) continue;
        while (L.length && L[L.length - 1][0] > t + 1e-6) L.pop();
        const kk = ease && ease !== 'inOut' ? [t, r3(v), ease] : [t, r3(v)];
        if (L.length && Math.abs(L[L.length - 1][0] - t) < 1e-6) L[L.length - 1] = kk; else { if (!L.length && t > 0) L.push([0, 0]); L.push(kk); } } }
    moves.length = 0; }
  return { actors, key, at, rel, begin, end, write, lane };
}

/* ═══════════════ the take as the page reads it (marks): the blocking at any t ═══════════════ */
function Blocking(M) {
  const K = M.keys, JN = ['armRP', 'armLP', 'headP', 'torsoP', 'legRP', 'legLP'];
  const keyIndexAt = t => { let i = 0; for (let j = 0; j < K.length; j++) if (K[j].t <= t) i = j; return i; };
  const win = (j, t) => { const k = K[j]; return k && k.win && t >= k.win[0] && t <= k.win[1] ? k : null; };
  const angLerp = (a, b, u) => a + wrap(b - a) * u;
  /* castAt, as the take computes it (odyssey-take.js), for one figure: where it is, which way it faces, whether it walks */
  function at(id, t) {
    const i = keyIndexAt(t), w = win(i + 1, t) || win(i, t);
    if (!w) { const s = K[i].snap[id]; return s ? { ...s, walk: 0, moving: false, key: K[i].id } : null; }
    const j = K.indexOf(w), A = K[j - 1].snap[id], B = w.snap[id], m = w.moves && w.moves[id]; if (!B) return null;
    const u = cl((t - w.win[0]) / (w.win[1] - w.win[0]), 0, 1);
    if (!m) { const s = u < 0.5 ? (A || B) : B; return { ...s, walk: 0, moving: false, key: w.id }; }
    const a = A || B, H = M.H[id] || 60, r0 = a.sat ? 0.22 : 0, s0 = B.sat ? 0.22 : 0, span = Math.max(0.05, 1 - r0 - s0);
    const out = { vis: u < 0.5 ? a.vis : B.vis, sat: !!(a.sat && B.sat && !m.walk), rot: [lerp(a.rot[0], B.rot[0], u), lerp(a.rot[1], B.rot[1], u)], j: B.j, walk: 0, moving: true, key: w.id, u, win: w.win };
    if (u < r0) { out.p = a.p; out.h = a.h; out.sat = true; }
    else if (u > 1 - s0) { out.p = B.p; out.h = B.h; out.sat = true; }
    else { const v = (u - r0) / span, e = m.walk ? v * v * (3 - 2 * v) * 0.25 + v * 0.75 : sm(v);
      out.p = [lerp(a.p[0], B.p[0], e), lerp(a.p[1], B.p[1], e), lerp(a.p[2], B.p[2], e)];
      if (m.walk) { const turn = sm(cl(v * 6, 0, 1)), back = sm(cl((v - 0.82) / 0.18, 0, 1)); out.h = angLerp(angLerp(a.h, m.dir, turn), B.sat ? m.dir : B.h, B.sat ? 0 : back);
        out.walk = sm(cl(v * 8, 0, 1)) * sm(cl((1 - v) * 8, 0, 1)); out.ph = e * m.d / (0.42 * H) * Math.PI; }
      else out.h = angLerp(a.h, B.h, sm(v)); }
    return out;
  }
  const ids = [...new Set(K.flatMap(k => Object.keys(k.snap)))];
  const visible = (id, t) => { const s = at(id, t); return !!(s && s.vis); };
  const lying = s => Math.abs(s.rot[0]) > 0.7 || Math.abs(s.rot[1]) > 0.7;
  /* the head's yaw the blocking gives (the performance's base): head.yaw = -headP.y */
  const headYaw = s => -(s.j.headP ? s.j.headP[1] : 0);
  return { at, ids, visible, lying, headYaw, keyIndexAt, JN };
}
/* the bearing from a figure to a point, relative to where the figure faces (head.yaw's sense: + turns as the heading turns) */
function relBearing(s, p) { return wrap(Math.atan2(p[0] - s.p[0], p[2] - s.p[2]) - s.h); }
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

/* ═══════════════ the voice: phrases and stresses from the envelope; words placed by their letters ═══════════════ */
function voiceOf(M, c) {
  const env = M.env, hz = M.hz, i0 = Math.floor(c.start * hz), n = Math.ceil(c.dur * hz), E = [];
  for (let i = 0; i < n; i++) E.push(env[i0 + i] || 0);
  const S = E.map((_, i) => { let s = 0, w = 0; for (let d = -3; d <= 3; d++) { const x = E[i + d]; if (x != null) { s += x; w++; } } return s / w; });   /* ~140 ms smoothing */
  const phrases = [], stresses = []; let quiet = 99, inP = false;
  for (let i = 0; i < n; i++) { const t = c.at + i / hz, v = S[i];
    if (v < 0.09) { quiet++; if (quiet > 0.22 * hz && inP) { inP = false; phrases[phrases.length - 1].t1 = t - quiet / hz; } }
    else { if (!inP && v > 0.14) { inP = true; phrases.push({ t0: t, t1: c.at + c.dur }); } quiet = 0; } }
  for (let i = 2; i < n - 2; i++) { const v = S[i]; if (v < 0.5) continue; if (v >= S[i - 1] && v >= S[i + 1] && v >= S[i - 2] && v >= S[i + 2]) { const t = c.at + i / hz;
    if (!stresses.length || t - stresses[stresses.length - 1].t > 0.42) stresses.push({ t, v }); else if (v > stresses[stresses.length - 1].v) stresses[stresses.length - 1] = { t, v }; } }
  /* the words, placed on the clip by their share of its letters (the voice's own phrases stretch them) */
  const text = String(c.caption || ''), words = [], re = /[A-Za-z']+/g; let m; const L = Math.max(1, text.length);
  while ((m = re.exec(text))) words.push({ w: m[0].toLowerCase(), t: c.at + 0.15 + (c.dur - 0.3) * (m.index / L), cap: /^[A-Z]/.test(m[0]) && m.index > 0 });
  return { phrases, stresses, words };
}

/* ═══════════════ the vocabulary ═══════════════ */
/* a gesture is the peak of each channel (deltas over the blocked pose); side 'R'/'L' is which arm leads, 'both' both. amp scales. */
const GEST = {
  open:    { arm: { pitch: -0.95, out: 0.32 }, hand: 0.5, lean: 0.05, hp: -0.05 },               /* the open hand: welcome, offer, explain */
  offer:   { both: true, arm: { pitch: -1.05, out: 0.22 }, hand: 0.55, lean: 0.08, hp: -0.04 },  /* both hands forward, palms up */
  chest:   { arm: { pitch: -1.35, out: -0.12 }, hand: -0.4, lean: -0.02, hp: 0.06 },             /* the hand to the heart: I, my, we */
  point:   { arm: { pitch: -1.55, out: 0.05 }, hand: 0, lean: 0.1, hp: -0.07, ease: 'back' },     /* command, accuse, direct */
  chop:    { arm: { pitch: -1.2, out: 0.08 }, hand: -0.2, lean: 0.08, hp: 0.05, ease: 'back', down: 0.55 }, /* a beat that lands */
  fist:    { arm: { pitch: -0.8, out: 0.12 }, hand: 0, lean: 0.14, hp: 0.08, ease: 'back' },      /* anger held in */
  dismiss: { arm: { pitch: -0.65, out: 0.5 }, hand: 0.7, lean: -0.06, hp: -0.1, turn: 0.3, ease: 'back' }, /* contempt: the flick away */
  plead:   { both: true, arm: { pitch: -1.15, out: 0.08 }, hand: 0.7, lean: 0.12, hp: -0.12 },    /* appeal: both hands up and out */
  grief:   { both: true, arm: { pitch: 0.18, out: -0.08 }, hand: 0, lean: 0.2, hp: 0.2 },         /* the body folds */
  recoil:  { both: true, arm: { pitch: -1.4, out: 0.1 }, hand: 0.3, lean: -0.16, hp: -0.1, ease: 'out' }, /* fear, wonder */
  beckon:  { arm: { pitch: -1.5, out: 0.1 }, hand: 0.6, lean: 0.03, hp: 0, cycle: 0.45 },         /* come: the forearm drawn in, twice */
};
const VOCAB = {
  tenderness: ['open', 'offer', 'chest', 'open'], joy: ['open', 'offer', 'open'], welcome: ['open', 'offer', 'beckon', 'chest'],
  command: ['point', 'chop', 'chop', 'fist'], resolve: ['chop', 'point', 'fist'], confrontation: ['point', 'fist', 'chop'],
  contempt: ['dismiss', 'point', 'chop', 'dismiss'], anger: ['fist', 'point', 'chop'], irony: ['dismiss', 'open', 'open'], skepticism: ['dismiss', 'open'],
  guarded: ['chest', 'open'], appeal: ['plead', 'open', 'chest'], desperation: ['plead', 'plead', 'chest'], pleading: ['plead', 'open', 'chest'],
  grief: ['grief', 'chest', 'grief'], anguish: ['grief', 'chest', 'plead'], hurt: ['chest', 'grief'], weariness: ['grief', 'open'], concern: ['open', 'chest'],
  fear: ['recoil', 'plead'], wonder: ['recoil', 'open'], recognition: ['recoil', 'offer', 'open'], neutral: ['open', 'chop', 'point', 'open'],
};
/* the turn's act (performance-turns.json) as the emotion it plays when the scene's beat is not on it */
const ACT_EMO = { GREET: 'welcome', DECLARE: 'command', COMMAND: 'command', THREATEN: 'anger', ACCUSE: 'contempt', PLEAD: 'pleading', PETITION: 'appeal', LAMENT: 'grief', MOURN: 'grief', REVEAL: 'recognition', INSTRUCT: 'command', WARN: 'concern', QUESTION: 'concern', PRAISE: 'joy', MOCK: 'contempt', REFUSE: 'confrontation', PROMISE: 'resolve', CONSOLE: 'tenderness', BOAST: 'contempt' };
/* words that are gestures of their own: said, done */
const WORDGEST = [[/^(give|hand|take)$/, 'reach'], [/^(come|follow|enter|welcome)$/, 'beckon'], [/^(go|there|look|see|away|out)$/, 'point'], [/^(i|me|my|mine|myself)$/, 'chest'], [/^(you|your|stranger|dogs?)$/, 'point'], [/^(eat|drink|feast)$/, 'offer'], [/^(no|never|not)$/, 'chop']];

/* ═══════════════ the choreographer ═══════════════ */
function generate(M, prev) {
  const sid = M.scene;
  const S = Sheet(), B = Blocking(M), T = M.total, ids = B.ids.filter(id => M.keys.some(k => k.snap[id] && k.snap[id].vis));
  const H = id => M.H[id] || 60, scale = M.scale || 1, notes = [], cues = [], props = [], rigs = {};
  const clips = M.clips.filter(c => c.kind !== 'SCENE_HEADER' && c.kind !== 'SPEAKER_CUE');
  const sceneEmo = (M.beat && M.beat.emotion) || 'neutral';
  const busy = {}; ids.forEach(id => busy[id] = []);
  const struck = {}, shooters = new Set(), holds = [];
  const walkingAt = (id, t) => { const s = B.at(id, t); return !!(s && s.moving && s.walk > 0.1); };
  const isDead = (id, t) => holds.some(h => h.actor === id && t >= h.t0 - 1);   /* who has been hit (and when), who shot, the deliberate stillnesses (the dead) */   /* spans where an actor's arms are taken by an action or a line */
  const occupy = (id, a, b, what) => { busy[id].push([a, b, what]); };
  const isBusy = (id, a, b) => busy[id].some(([x, y]) => a < y && b > x);
  const cue = (t, id, what) => cues.push({ t: r3(q(t)), actor: id, what });
  const seated = (id, t) => { const s = B.at(id, t); return s && s.sat; };
  const lyingAt = (id, t) => { const s = B.at(id, t); return s && B.lying(s); };
  /* the actors each figure is near at t (for glances and talk), nearest first */
  const near = (id, t, R) => { const s = B.at(id, t); if (!s) return []; return ids.filter(o => o !== id && B.visible(o, t)).map(o => [o, dist2(s.p, B.at(o, t).p)]).filter(([, d]) => d < R * H(id)).sort((a, b) => a[1] - b[1]).map(([o]) => o); };
  const heldR = id => (M.held[id] || {}).R > 0, heldL = id => (M.held[id] || {}).L > 0;
  const name = id => id.replace(/-\d+$/, '');
  const verbsOf = txt => String(txt || '').toLowerCase();
  /* every move below is one move of the sheet (see Sheet) */
  const W = f => (...a) => { S.begin(); try { return f(...a); } finally { S.end(); } };
  look = W(look); glance = W(glance); nod = W(nod); gesture = W(gesture); beat = W(beat); reach = W(reach); loopClip = W(loopClip); singLoop = W(singLoop);
  waiting = W(waiting); doubleTake = W(doubleTake); strain = W(strain); waxing = W(waxing); pullRope = W(pullRope); search = W(search); drink = W(drink); laugh = W(laugh); hit = W(hit); leap = W(leap); walk = W(walk); dice = W(dice); shoot = W(shoot); collapse = W(collapse);

  /* ── 2. the lines: who speaks when, to whom; the speaker's beats and the listeners' answers ── */
  const talk = clips.filter(c => c.kind === 'DIALOGUE' && c.voice);
  const narr = clips.filter(c => !(c.kind === 'DIALOGUE' && c.voice));
  for (const c of talk) {
    const id = c.voice; if (!ids.includes(id)) continue;
    const V = voiceOf(M, c), R = rng(sid + c.gi + id), isKey = c.gi === M.keyGi;
    const emo = isKey ? sceneEmo : (ACT_EMO[c.act] || sceneEmo), voc = VOCAB[emo] || VOCAB.neutral;
    /* to whom: the one addressed; a line to no one in particular goes to the crowd (the largest group of like figures in the
       room), and the speaker's eyes go round them, one face a phrase */
    let crowd = null; if (!(c.addressee && ids.includes(c.addressee))) { const g = {}; for (const o of ids) if (o !== id && B.visible(o, c.at) && !isDead(o, c.at)) (g[name(o)] = g[name(o)] || []).push(o);
      const big = Object.values(g).filter(x => x.length >= 2).sort((a, b) => b.length - a.length)[0]; if (big) { const s0 = B.at(id, c.at); crowd = big.sort((a, b) => relBearing(s0, B.at(a, c.at).p) - relBearing(s0, B.at(b, c.at).p)); } }
    const ad = c.addressee && ids.includes(c.addressee) ? c.addressee : crowd ? crowd[Math.floor(crowd.length / 2)] : near(id, c.at, 12)[0];
    occupy(id, c.at - 0.4, c.at + c.dur + 0.5, 'line');
    cue(c.at, id, 'line (' + emo + ')' + (ad ? ' to ' + ad : ''));
    /* the look: at the one addressed through the line; away on a phrase's end (the thought), back on the next start */
    look(id, ad, c.at - 0.35, 'look', { lead: true });
    V.phrases.forEach((p, i) => { if (i > 0 && ad && p.t0 - V.phrases[i - 1].t1 > 0.3) { const aw = (R() < 0.5 ? -1 : 1) * (0.25 + 0.2 * R());
      glance(id, V.phrases[i - 1].t1 + 0.05, aw, Math.min(0.9, p.t0 - V.phrases[i - 1].t1)); look(id, crowd ? crowd[(i * 2 + 1) % crowd.length] : ad, p.t0 - 0.12, 'look', {}); }
      else if (i > 0 && crowd) look(id, crowd[(i * 2 + 1) % crowd.length], p.t0 - 0.2, 'look', {}); });
    /* the gestures: a big one on each phrase's first stress, small beats on the rest; the words that are gestures of their own */
    let side = heldR(id) && !heldL(id) ? 'L' : 'R', gi = 0; const used = [];
    const wordAt = new Map(); for (const w of V.words) for (const [re, g] of WORDGEST) if (re.test(w.w)) { const st = V.stresses.find(s => Math.abs(s.t - w.t) < 0.45); wordAt.set(q(st ? st.t : w.t), { g, w: w.w }); break; }
    for (const p of V.phrases) {
      const st = V.stresses.filter(s => s.t >= p.t0 - 0.05 && s.t <= p.t1 + 0.05); if (!st.length) st.push({ t: p.t0 + 0.2, v: 0.6 });
      st.forEach((s, k) => { if (used.some(u => Math.abs(u - s.t) < 0.5)) return; if (busy[id].some(([a, b, w]) => w === 'reach' && s.t > a && s.t < b)) { nod(id, s.t, 0.05); return; } used.push(s.t);
        const w = [...wordAt.entries()].find(([t]) => Math.abs(t - s.t) < 0.3);
        if (w && w[1].g === 'reach') { reach(id, ad, s.t, 1.4); cue(s.t, id, '"' + w[1].w + '": reach'); return; }
        if (w && GEST[w[1].g] && !(w[1].g === 'point' && emo === 'tenderness')) { gesture(id, w[1].g, s.t, side, 0.9, 0.5 + 0.3 * R(), ad); cue(s.t, id, '"' + w[1].w + '": ' + w[1].g); return; }
        if (k === 0) { const g = voc[gi++ % voc.length]; gesture(id, g, s.t, side, isKey ? 1.1 : 0.9, Math.min(1.4, (p.t1 - s.t) * 0.5 + 0.3), ad); side = !heldL(id) && !heldR(id) && R() < 0.4 ? (side === 'R' ? 'L' : 'R') : side; }
        else beat(id, s.t, side, 0.5 + 0.5 * s.v); });
      nod(id, p.t0 - 0.05, 0.05); }
    /* the one addressed: turns to the speaker, nods on the stresses, leans in on the key beat; everyone near glances over */
    for (const o of ids) { if (o === id || !B.visible(o, c.at)) continue; const d = dist2(B.at(o, c.at).p, B.at(id, c.at).p) / H(o), Ro = rng(sid + c.gi + o);
      if (o === ad) { look(o, id, c.at + 0.25, 'look', {}); occupy(o, c.at, c.at + c.dur, 'listen');
        V.stresses.forEach((s, k) => { if (Ro() < 0.4) nod(o, s.t + 0.25, 0.1 + 0.05 * Ro(), Ro() < 0.3); });
        if (isKey) S.key(o, 'react', c.at + 0.6, { 'torso.lean': 0.09 }, 'inOut'), S.key(o, 'react', c.at + c.dur + 0.4, { 'torso.lean': 0 }, 'inOut');
        V.phrases.slice(0, -1).forEach(p => { if (Ro() < 0.5) gesture(o, 'open', p.t1 + 0.1, heldR(o) ? 'L' : 'R', 0.45, 0.4, id); });
      } else if (d < 9) { const t0 = c.at + 0.4 + d * 0.06 + Ro() * 0.8; look(o, id, t0, 'look', {}); if (Ro() < 0.6) look(o, null, t0 + 1.8 + Ro() * 2.5, 'look', {}); } }
  }

  /* ── 3. the action lines: the narrator describes what the subject does; the subject does it ── */
  for (const c of narr) { const id = c.speaker; if (!id || !ids.includes(id)) continue;
    const txt = verbsOf(c.caption) + ' ' + verbsOf((M.keys.find(k => k.id === c.key) || {}).beat);
    act(id, c, txt); }
  /* the ensemble's verbs: figures whose names or the scene's text say what they do all through (rowers row, sirens sing) */
  const all = clips.map(c => verbsOf(c.caption)).join(' ') + ' ' + M.keys.map(k => verbsOf(k.beat)).join(' ');
  for (const id of ids) { const n = name(id);
    if (/oars|rower|crew/.test(n) && /row|oar|ship|sail/.test(all)) loopClip(id, 'row', 0, T, { amp: 1, phase: rng(sid + id)() * 1.1, why: 'rows' });
    else if (/siren/.test(n)) singLoop(id, 0, T); }

  /* ── 4. walks: the take walks a figure between two marks; the body goes with it (bob, lean, the head looking where it goes) ── */
  for (let j = 1; j < M.keys.length; j++) { const K = M.keys[j]; if (!K.win || !K.moves) continue;
    for (const [id, m] of Object.entries(K.moves)) { if (!m.walk || !ids.includes(id) || (K.snap[id] && B.lying(K.snap[id]))) continue; walk(id, K); } }

  /* ── 5. business: everyone, wherever they are not otherwise acting, has something to do ── */
  for (const id of ids) business(id);

  /* ── 6. weight shifts through every hold (a hold that still breathes) ── */
  for (const id of ids) shifts(id);

  /* ── 7. breath (written last, when the dead are known): the whole scene, every figure; the phases staggered so a crowd does not breathe as one ── */
  for (const id of ids) { const R = rng(sid + id + 'breath'), P = 3.0 + R() * 1.3; let t = R() * P, up = true;
    while (t < T + P) { const s = B.at(id, Math.min(T, t)); if (s && !isDead(id, t)) { const st = !s.sat && !B.lying(s), k = up ? 1 : 0;
        S.key(id, 'breath', t, { 'torso.lean': -0.035 * k, 'arm.R.out': 0.05 * k, 'arm.L.out': 0.05 * k, 'head.pitch': -0.03 * k, 'hips.dy': st ? 0.9 * k : 0 }, 'inOut'); }
      t += up ? P * 0.42 : P * 0.58; up = !up; } }


  /* ═════ the moves ═════ */
  /* a look at another actor (or back to the blocked front, who=null): the head leads, the torso follows two drawings later, the
     feet a beat after that when the turn is past what the neck and waist can take; a small dip of the head as it starts
     (the anticipation of a turn) */
  function look(id, who, t, layer, o) {
    const s = B.at(id, t); if (!s || !s.vis) return; let rel = 0;
    if (who) { const w = B.at(who, t); if (!w) return; rel = relBearing(s, w.p); }
    const base = B.headYaw(s), lying = B.lying(s), sat = s.sat, walking = s.moving && s.walk > 0.2;
    if (walking) return;
    let turnFeet = 0; if (who && !sat && !lying && Math.abs(rel) > 1.25) turnFeet = rel - Math.sign(rel) * 0.9;
    const rest = rel - turnFeet, twist = who ? cl(rest * 0.35, -0.42, 0.42) : 0, head = who ? cl(rest - twist - base, -1.3, 1.3) : 0;
    const t0 = t, dur = 0.35 + Math.abs(rel) * 0.12;
    S.key(id, layer, t0, { 'head.yaw': S.at(id, 'head.yaw', layer, t0), 'torso.twist': S.at(id, 'torso.twist', layer, t0) }, 'inOut');
    S.key(id, layer, t0 + 1 / F, { 'head.pitch': 0.06 }, 'out');
    S.key(id, layer, t0 + dur, { 'head.yaw': head * 1.06, 'head.pitch': 0 }, 'out');
    S.key(id, layer, t0 + dur + 0.25, { 'head.yaw': head }, 'inOut');
    S.key(id, layer, t0 + 2 / F + dur, { 'torso.twist': twist }, 'inOut');
    if (!lying && !sat) { S.key(id, layer, t0 + 4 / F, { 'root.h': S.at(id, 'root.h', layer, t0 + 4 / F) }, 'inOut'); S.key(id, layer, t0 + 4 / F + dur + 0.2, { 'root.h': turnFeet * 0.95 }, 'inOut'); }
  }
  function glance(id, t, aw, hold) { const s = B.at(id, t); if (!s || !s.vis || (s.moving && s.walk > 0.2)) return; S.key(id, 'look', t, { 'head.yaw': S.rel(0) }, 'inOut'); S.key(id, 'look', t + 0.25, { 'head.yaw': S.rel(aw), 'head.pitch': 0.05 }, 'out'); S.key(id, 'look', t + 0.25 + Math.max(0.2, hold - 0.3), { 'head.yaw': S.rel(aw * 0.8), 'head.pitch': 0.03 }, 'linear'); }
  function nod(id, t, a, dbl) { const s = B.at(id, t); if (!s || !s.vis) return;
    S.key(id, 'react', t - 1 / F, { 'head.pitch': -0.03 }, 'out'); S.key(id, 'react', t + 2 / F, { 'head.pitch': a }, 'out'); S.key(id, 'react', t + 5 / F, { 'head.pitch': dbl ? 0.01 : 0 }, 'inOut');
    if (dbl) { S.key(id, 'react', t + 7 / F, { 'head.pitch': a * 0.7 }, 'out'); S.key(id, 'react', t + 10 / F, { 'head.pitch': 0 }, 'inOut'); } }
  /* a gesture: anticipation (the arm dips the other way, the weight goes back), the strike (eased out, or overshooting), a hold
     that keeps drifting, the release; the head leads it by a drawing, the torso follows, the hand trails the arm */
  function gesture(id, g, t, side, amp, hold, toward) {
    const G = GEST[g]; if (!G) return; const s = B.at(id, t); if (!s || !s.vis || B.lying(s)) return;
    if (s.moving && s.walk > 0.2) return;
    let a = amp; const sides = G.both ? ['R', 'L'] : [side];
    /* a partner in front and close: the arms keep out of him (reach less forward, open more to the side) */
    let cap = -3; if (toward) { const w = B.at(toward, t); if (w) { const d = dist2(s.p, w.p) / H(id), rb = Math.abs(relBearing(s, w.p)); if (d < 0.8 && rb < 0.9) cap = -0.55; else if (d < 1.2 && rb < 0.9) cap = -0.9; } }
    const L = 'beat', ch = x => 'arm.' + x;
    const t0 = t - 3 / F, tp = t + (G.ease === 'back' ? 2 : 3) / F;
    S.key(id, L, t0 - 1 / F, Object.fromEntries(sides.flatMap(x => [[ch(x) + '.pitch', S.at(id, ch(x) + '.pitch', L, t0)], [ch(x) + '.out', S.at(id, ch(x) + '.out', L, t0)]]).concat([['torso.lean', S.at(id, 'torso.lean', L, t0)], ['head.pitch', S.at(id, 'head.pitch', L, t0)]])), 'inOut');
    /* anticipation */
    S.key(id, L, t0 + 1 / F, Object.fromEntries(sides.map(x => [ch(x) + '.pitch', 0.18 * a]).concat([['torso.lean', -0.04 * a], ['head.pitch', -0.03]])), 'out');
    /* head leads */
    S.key(id, L, t - 1 / F, { 'head.pitch': G.hp * a }, 'out');
    if (G.turn) S.key(id, 'look', t, { 'head.yaw': S.rel(G.turn) }, 'out');
    /* the strike */
    for (const x of sides) { const pv = Math.max(cap, G.arm.pitch * a), ov = G.arm.out * a * (cap > -1 ? 1.4 : 1);
      S.key(id, L, tp, { [ch(x) + '.pitch']: pv, [ch(x) + '.out']: ov }, G.ease || 'out');
      S.key(id, L, tp + 2 / F, { ['hand.' + x + '.roll']: G.hand * (x === 'L' ? -1 : 1) * a }, 'out');
      if (G.down) { S.key(id, L, tp + 2 / F, { [ch(x) + '.pitch']: pv + G.down * a }, 'in'); S.key(id, L, tp + 5 / F, { [ch(x) + '.pitch']: pv + G.down * a * 0.8 }, 'out'); }
      if (G.cycle) { S.key(id, L, tp + 3 / F, { [ch(x) + '.pitch']: pv + G.cycle }, 'inOut'); S.key(id, L, tp + 6 / F, { [ch(x) + '.pitch']: pv }, 'inOut'); S.key(id, L, tp + 9 / F, { [ch(x) + '.pitch']: pv + G.cycle }, 'inOut'); } }
    /* the torso follows */
    S.key(id, L, t + 2 / F, { 'torso.lean': G.lean * a, 'torso.twist': (side === 'R' ? 0.08 : -0.08) * a * (G.both ? 0 : 1) }, 'inOut');
    /* the hold, still moving: the arm settles a fifth of the way back, the torso eases */
    const th = tp + Math.max(0.35, hold);
    for (const x of sides) S.key(id, L, th, { [ch(x) + '.pitch']: Math.max(cap, G.arm.pitch * a) * 0.8 + (G.down ? G.down * a * 0.6 : 0), [ch(x) + '.out']: G.arm.out * a * 0.75 }, 'linear');
    S.key(id, L, th, { 'torso.lean': G.lean * a * 0.7, 'head.pitch': G.hp * a * 0.5 }, 'linear');
    /* the release: the arm drops through, a small overshoot, the hand last */
    const tr = th + 0.45;
    S.key(id, L, tr, Object.fromEntries(sides.flatMap(x => [[ch(x) + '.pitch', 0.06], [ch(x) + '.out', 0]]).concat([['torso.lean', 0], ['torso.twist', 0], ['head.pitch', 0]])), 'inOut');
    S.key(id, L, tr + 3 / F, Object.fromEntries(sides.map(x => [ch(x) + '.pitch', 0])), 'inOut');
    for (const x of sides) S.key(id, L, tr + 3 / F, { ['hand.' + x + '.roll']: 0 }, 'inOut');
  }
  /* a small beat: the hand bounces on a stress, the head with it */
  function beat(id, t, side, a) { const s = B.at(id, t); if (!s || !s.vis || B.lying(s) || (s.moving && s.walk > 0.2)) return; const L = 'beat', c = 'arm.' + side + '.pitch';
    S.key(id, L, t - 2 / F, { [c]: S.rel(-0.12 * a) }, 'out'); S.key(id, L, t + 1 / F, { [c]: S.rel(0.22 * a), 'head.pitch': 0.05 * a }, 'in'); S.key(id, L, t + 4 / F, { [c]: S.rel(0), 'head.pitch': 0 }, 'out'); }
  /* a reach toward someone (give me your spear): the arm out to the partner at the shoulder's height, held, back */
  function reach(id, to, t, hold) { const s = B.at(id, t); if (!s || !s.vis) return; const side = heldL(id) ? 'R' : 'L';
    look(id, to, t - 0.3, 'look', {});
    S.key(id, 'beat', t - 3 / F, { ['arm.' + side + '.pitch']: 0.15, 'torso.lean': -0.03 }, 'out');
    S.key(id, 'beat', t + 4 / F, { ['arm.' + side + '.pitch']: -1.35, ['arm.' + side + '.out']: -0.08, 'torso.lean': 0.12 }, 'back');
    S.key(id, 'beat', t + hold, { ['arm.' + side + '.pitch']: -1.25, 'torso.lean': 0.08 }, 'linear');
    S.key(id, 'beat', t + hold + 0.5, { ['arm.' + side + '.pitch']: -0.5, ['arm.' + side + '.out']: 0, 'torso.lean': 0 }, 'inOut');
    if (to && heldR(to)) { /* the partner offers it: the spear arm comes forward to meet the hand */
      S.key(to, 'beat', t - 1 / F, { 'arm.R.pitch': S.at(to, 'arm.R.pitch', 'beat', t) }, 'inOut'); S.key(to, 'beat', t + 5 / F, { 'arm.R.pitch': -0.55, 'torso.lean': 0.06 }, 'out');
      S.key(to, 'beat', t + hold + 0.4, { 'arm.R.pitch': 0.1, 'torso.lean': 0 }, 'inOut'); S.key(to, 'beat', t + hold + 0.7, { 'arm.R.pitch': 0 }, 'inOut');
      props.push({ t: r3(q(t + hold * 0.6)), op: 'give', from: to + ':R', to: id + ':' + side }); cue(t + hold * 0.6, id, 'takes the spear from ' + to); occupy(to, t - 0.5, t + hold + 1, 'give'); }
    occupy(id, t - 0.5, t + hold + 0.8, 'reach'); }
  /* a motion.js clip laid on the @act layer as offsets from the blocked pose at its start; a loop repeats to `until` */
  function loopClip(id, nameC, t0, until, o = {}) { const C = CLIPS && CLIPS[nameC]; if (!C || !C.keys) return false; const s = B.at(id, t0); if (!s) return false;
    const base = s.j, amp = o.amp == null ? 1 : o.amp, len = C.len / 12, U = { stud: 20 * scale, plate: 8 * scale };
    const val = (k, pose, root) => { const v = {};
      for (const [jn, x] of Object.entries(pose || {})) { const a = Array.isArray(x) ? x : jn === 'headP' ? [0, x, 0] : [x, 0, 0], b0 = base[jn] || [0, 0, 0];
        if (jn === 'armRP') { v['arm.R.pitch'] = (a[0] - b0[0]) * amp; if (a[2]) v['arm.R.out'] = -a[2] * amp; }
        else if (jn === 'armLP') { v['arm.L.pitch'] = (a[0] - b0[0]) * amp; if (a[2]) v['arm.L.out'] = a[2] * amp; }
        else if (jn === 'torsoP') v['torso.lean'] = (a[0] - b0[0]) * amp;
        else if (jn === 'headP') v['head.yaw'] = -(a[1] - b0[1]) * amp;
        else if (jn === 'legRP' && !s.sat) v['leg.R.pitch'] = (a[0] - b0[0]) * amp; else if (jn === 'legLP' && !s.sat) v['leg.L.pitch'] = (a[0] - b0[0]) * amp; }
      if (root) { if (root.pitch != null) v['root.pitch'] = root.pitch * amp; if (root.roll != null) v['root.roll'] = root.roll * amp; if (root.yaw != null) v['root.h'] = root.yaw * amp;
        if (root.fwd != null || root.side != null) { const f = (root.fwd || 0) * U.stud * amp, sd = (root.side || 0) * U.stud * amp; v['root.x'] = Math.sin(s.h) * f + Math.cos(s.h) * sd; v['root.z'] = Math.cos(s.h) * f - Math.sin(s.h) * sd; }
        if (root.dy != null) v['root.y'] = root.dy * U.plate * amp; if (root.kneel != null) v['root.y'] = (v['root.y'] || 0) - root.kneel * 14 * scale * amp; }
      return v; };
    const ez = e => e === 'hold' ? 'step' : e === 'snap' ? 'step' : e === 'smear' ? 'in' : (e || 'inOut');
    let t = t0 + (o.phase || 0) % len; const first = C.keys[0];
    S.key(id, 'act', Math.max(0, t0 - 0.3), Object.fromEntries(Object.keys(val(0, first.pose, first.root)).map(k => [k, 0])), 'inOut');
    let n = 0; const prevVals = {}, wrote = new Set();
    do { for (const k of C.keys) { const tk = t + k.f / 12; if (tk > until + 0.01) break; const v = val(k, Object.assign(prevVals.pose || {}, k.pose), Object.assign(prevVals.root || {}, k.root));
        prevVals.pose = Object.assign({}, prevVals.pose, k.pose); prevVals.root = Object.assign({}, prevVals.root, k.root); Object.keys(v).forEach(x => wrote.add(x)); S.key(id, 'act', tk, v, ez(k.ease)); }
      t += len; n++; } while (C.loop && t < until && n < 400);
    if (o.release !== false) { const zero = {}; for (const x of wrote) zero[x] = 0; S.key(id, 'act', Math.min(T, until + 0.5), zero, 'inOut'); }
    occupy(id, t0, until, nameC); cue(t0, id, o.why || nameC); return true; }
  /* the sirens sing: a slow sway from the hips, the arms opening and closing on the long notes, the heads tilting toward the ship */
  function singLoop(id, t0, t1) { const R = rng(sid + id + 'sing'), P = 2.2 + R() * 0.8; let t = t0 + R() * P, k = 0;
    while (t < t1) { const u = k % 2 ? 1 : -1; S.key(id, 'act', t, { 'torso.roll': 0.11 * u, 'root.roll': 0.04 * u, 'head.pitch': -0.08 + 0.04 * u, 'arm.R.pitch': -1.1 - 0.35 * (k % 4 === 1), 'arm.L.pitch': -1.1 - 0.35 * (k % 4 === 3), 'arm.R.out': 0.25 + 0.15 * u, 'arm.L.out': 0.25 - 0.15 * u, 'head.yaw': 0.18 * u }, 'inOut'); t += P / 2; k++; }
    occupy(id, t0, t1, 'sing'); cue(t0 + 0.1, id, 'sings'); }
  /* an action line's verbs, done by its subject */
  function act(id, c, txt) {
    const t0 = c.at + 0.4, t1 = c.at + c.dur, R = rng(sid + c.gi + id + 'act'), s = B.at(id, t0); if (!s) return;
    const others = ids.filter(o => o !== id && B.visible(o, t0));
    const did = w => cue(t0, id, w);
    if (/row|oar/.test(txt) && /crew|oars/.test(name(id))) return;   /* the rowers already row */
    if (/(struggl|strain|strug|signal|free|bound|mast)/.test(txt) && /odysseus/.test(id)) { strain(id, t0, t1); did('strains at the mast'); return; }
    if (/(wax|ears|seal)/.test(txt)) { waxing(id, t0, t1, others); did('softens the wax, seals their ears'); return; }
    if (/(bind|tighten|rope|lash)/.test(txt)) { for (const o of [id, ...others.filter(o => /crew|oars/.test(o))].slice(0, 3)) pullRope(o, t0 + R() * 0.4, Math.min(t1, t0 + 6)); did('bind, pull the ropes tight'); return; }
    if (/(strip|rags|leap|threshold)/.test(txt) && /odysseus/.test(id)) { leap(id, t0); did('strips off the rags, leaps to the threshold'); if (/pour|arrows/.test(txt)) loopClip(id, 'pour-libation', t0 + 2.2, t0 + 5.5, { amp: 0.8, why: 'pours out the arrows' }); return; }
    if (/(shoot|shoots|arrow|bow|string)/.test(txt) && !/antinous/.test(id)) { shoot(id, c, t0, txt); return; }
    if (/(falls|fall|dies|throat|slump|topple)/.test(txt)) { const w = fallWindow(id, c.at);
      if (struck[id]) { if (w) collapse(id, w); did('falls: the knees go, across the table'); } else { hit(id, t0); did('is hit: the jolt, the fall'); }
      const tf = w ? w[0] + 0.3 : t0;
      for (const o of others) { if (shooters.has(o)) continue; const Ro = rng(sid + o + 'reel'); look(o, id, tf + 0.2 + Ro() * 0.4, 'look', {}); if (Ro() < 0.7 && !seated(o, tf) && !walkingAt(o, tf + 0.5)) loopClip(o, 'reel-back-in-fear', tf + 0.3 + Ro() * 0.5, tf + 1.9, { amp: 0.7, why: 'reels back' }); }
      for (const o of shooters) if (o !== id && others.includes(o)) { look(o, id, tf + 0.1, 'look', {}); S.key(o, 'act', tf + 0.2, { 'torso.lean': 0.06, 'head.pitch': 0.06 }, 'inOut'); S.key(o, 'act', tf + 2.2, { 'torso.lean': 0.02, 'head.pitch': 0.02 }, 'linear'); S.key(o, 'act', tf + 3, { 'torso.lean': 0, 'head.pitch': 0 }, 'inOut'); cue(tf + 0.1, o, 'watches him go down, unmoved'); }
      return; }
    if (/(search|weapons|look for)/.test(txt)) { for (const o of [id, ...others.filter(o => name(o) === name(id))]) search(o, t0, t1); did('search for their weapons'); return; }
    if (/(erupt|panic|scatter|flee)/.test(txt)) { for (const o of others) if (!seated(o, t0)) loopClip(o, 'reel-back-in-fear', t0 + rng(o)() * 0.6, t0 + 2, { amp: 0.8, why: 'reel back' }); return; }
    if (/(pour|libation|wine|cups? are filled)/.test(txt)) { for (const o of others.filter(o => /servant|maid|herald/.test(o)).slice(0, 3)) loopClip(o, 'pour-libation', t0 + rng(o)() * 1.5, t0 + 4, { amp: 0.9, why: 'pours' }); }
    if (/(dice|gamble)/.test(txt)) { for (const o of [id, ...others.filter(o => name(o) === name(id))]) dice(o, t0, t1); did('the dice, the cups'); return; }
    if (/(weave|loom)/.test(txt)) { loopClip(id, 'weave', t0, t1, { why: 'weaves' }); return; }
    if (/(embrace|hug|clasp)/.test(txt)) { gesture(id, 'offer', t0, 'R', 1, t1 - t0 - 1); did('embraces'); return; }
    if (/(weep|tears|grieve|mourn)/.test(txt)) { loopClip(id, 'weep', t0, t1, { why: 'weeps' }); return; }
    /* a walk the blocking starts about this line: what he does before he goes (sees, rises) is played before the walk */
    const wk = M.keys.find(k => k.win && k.moves && k.moves[id] && k.moves[id].walk && k.win[0] < c.at + 1.5 && k.win[1] > c.at - 3);
    if (/(notices|sees|catches sight)/.test(txt)) { const who = c.addressee && ids.includes(c.addressee) ? c.addressee : null, tn = wk ? Math.max(0.5, wk.win[0] - 1.6) : t0 + 0.3;
      doubleTake(id, who, tn); cue(tn, id, 'sees ' + (who || 'it') + ': a double take');
      if (wk && seated(id, wk.win[0] - 0.1)) { S.key(id, 'act', wk.win[0] - 0.35, { 'torso.lean': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }, 'inOut'); S.key(id, 'act', wk.win[0] + 0.05, { 'torso.lean': 0.24, 'arm.R.pitch': 0.3, 'arm.L.pitch': 0.3 }, 'out');
        S.key(id, 'act', wk.win[0] + 0.45, { 'torso.lean': 0.06, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }, 'inOut'); cue(wk.win[0] - 0.3, id, 'rises: the weight forward, the hands push off'); }
      if (/(ashamed|shame)/.test(txt)) { const ts = wk ? wk.win[0] + 0.5 : t0 + 2.0; S.key(id, 'act', ts, { 'head.pitch': 0.16, 'torso.lean': 0.08 }, 'inOut'); S.key(id, 'act', t1, { 'head.pitch': 0.1, 'torso.lean': 0.04 }, 'linear'); S.key(id, 'act', t1 + 0.8, { 'head.pitch': 0, 'torso.lean': 0 }, 'inOut'); cue(ts, id, 'the shame: the head down'); }
      return; }
    if (/(waits|stands|leaning|upright)/.test(txt)) { waiting(id, t0, t1); did('waits: weight on the spear, a look to the house, the road'); return; }
    if (/(greet|welcome)/.test(txt)) { gesture(id, 'open', t0, 'L', 1, 1.2); return; }
    /* nothing named: the subject tells it with the body anyway */
    gesture(id, pick(R, VOCAB[sceneEmo] || VOCAB.neutral), t0 + 0.4, heldR(id) ? 'L' : 'R', 0.8, 0.9); }
  /* waiting: shifting on the feet, the spear planted, looks to the doors and back to the road */
  function waiting(id, t0, t1) { const R = rng(sid + id + 'wait'); let t = t0, k = 0;
    while (t < t1 - 0.8) { const aw = [0.9, -0.5, 0.35, -1.0][k % 4] + (R() - 0.5) * 0.3; glance(id, t, aw, 1.3 + R());
      if (k % 2 === 0) { S.key(id, 'act', t + 0.2, { 'arm.R.pitch': -0.22, 'torso.lean': 0.05, 'root.roll': 0.035 }, 'inOut'); S.key(id, 'act', t + 1.3, { 'arm.R.pitch': -0.15, 'torso.lean': 0.03, 'root.roll': 0.03 }, 'linear'); }
      else { S.key(id, 'act', t + 0.2, { 'arm.R.pitch': 0, 'torso.lean': -0.02, 'root.roll': -0.03 }, 'inOut'); S.key(id, 'act', t + 1.3, { 'arm.R.pitch': -0.05, 'torso.lean': 0, 'root.roll': -0.025 }, 'linear'); }
      t += 1.9 + R() * 0.9; k++; }
    S.key(id, 'act', t1 + 0.4, { 'arm.R.pitch': 0, 'torso.lean': 0, 'root.roll': 0 }, 'inOut'); occupy(id, t0, t1, 'wait'); }
  function doubleTake(id, who, t) { const s = B.at(id, t); if (!s) return; const rel = who ? relBearing(s, B.at(who, t).p) : 0.8;
    S.key(id, 'look', t, { 'head.yaw': S.at(id, 'head.yaw', 'look', t) }, 'inOut'); S.key(id, 'look', t + 0.3, { 'head.yaw': cl(rel * 0.4, -0.7, 0.7) }, 'out'); S.key(id, 'look', t + 0.6, { 'head.yaw': cl(rel * 0.3, -0.6, 0.6) }, 'inOut');
    S.key(id, 'look', t + 0.75, { 'head.yaw': 0 }, 'in'); S.key(id, 'look', t + 1.0, { 'head.yaw': cl(rel, -1.2, 1.2) * 1.08, 'head.pitch': -0.08 }, 'back'); S.key(id, 'look', t + 1.3, { 'head.yaw': cl(rel, -1.2, 1.2), 'head.pitch': -0.04 }, 'inOut');
    S.key(id, 'act', t + 0.8, { 'torso.lean': -0.08 }, 'out'); S.key(id, 'act', t + 1.2, { 'torso.lean': 0.02 }, 'inOut'); }
  /* bound to the mast: he throws his weight against the ropes, left, right, the head back, the arms wrenching */
  function strain(id, t0, t1) { const R = rng(sid + id + 'strain'); let t = t0, k = 0;
    while (t < t1) { const u = k % 2 ? 1 : -1, big = R() < 0.4;
      S.key(id, 'act', t, { 'torso.twist': 0.42 * u, 'torso.lean': 0.16 + (big ? 0.12 : 0), 'torso.roll': 0.12 * u, 'head.yaw': 0.55 * u, 'head.pitch': big ? -0.18 : -0.05, 'arm.R.pitch': -0.35 - 0.3 * (u > 0), 'arm.L.pitch': -0.35 - 0.3 * (u < 0), 'arm.R.out': 0.25, 'arm.L.out': 0.25, 'hips.dy': -1.5 }, big ? 'back' : 'out');
      S.key(id, 'act', t + 0.35, { 'torso.lean': 0.08, 'head.pitch': 0.05, 'hips.dy': 0 }, 'inOut');
      t += 0.55 + R() * 0.4; k++; }
    S.key(id, 'act', t1 + 0.6, { 'torso.twist': 0, 'torso.lean': 0, 'torso.roll': 0, 'head.yaw': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'arm.R.out': 0, 'arm.L.out': 0 }, 'inOut'); occupy(id, t0, t1, 'strain'); }
  function waxing(id, t0, t1, others) { let t = t0; const crew = others.filter(o => /crew|oars/.test(o));
    S.key(id, 'act', t, { 'arm.R.pitch': -1.2, 'arm.L.pitch': -1.2, 'torso.lean': 0.12, 'head.pitch': 0.12 }, 'inOut');
    for (let k = 0; k < 4; k++) { S.key(id, 'act', t + 0.3 + k * 0.4, { 'arm.R.pitch': -1.35 + 0.15 * (k % 2), 'arm.L.pitch': -1.2 - 0.15 * (k % 2) }, 'inOut'); }
    t += 2.0; for (const o of crew.slice(0, 4)) { if (t > t1 - 0.8) break; look(id, o, t - 0.3, 'look', {}); S.key(id, 'act', t, { 'arm.R.pitch': -2.2, 'arm.L.pitch': -0.6, 'torso.lean': 0.1 }, 'back'); S.key(id, 'act', t + 0.8, { 'arm.R.pitch': -1.6, 'arm.L.pitch': -0.5 }, 'inOut');
      S.key(o, 'react', t + 0.2, { 'head.pitch': 0.1, 'torso.roll': 0.06 }, 'out'); S.key(o, 'react', t + 0.9, { 'head.pitch': 0, 'torso.roll': 0 }, 'inOut'); t += 1.4; }
    S.key(id, 'act', t1 + 0.5, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'head.pitch': 0 }, 'inOut'); occupy(id, t0, t1, 'wax'); }
  function pullRope(id, t0, t1) { let t = t0, k = 0; S.key(id, 'act', t0 - 0.2, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0 }, 'inOut');
    while (t < t1) { S.key(id, 'act', t, { 'arm.R.pitch': -1.6, 'arm.L.pitch': -1.45, 'torso.lean': 0.18 }, 'inOut'); S.key(id, 'act', t + 0.45, { 'arm.R.pitch': -0.7, 'arm.L.pitch': -0.8, 'torso.lean': -0.14, 'hips.dy': -1.2 }, 'out'); S.key(id, 'act', t + 0.7, { 'hips.dy': 0 }, 'inOut'); t += 1.0; k++; }
    S.key(id, 'act', t1 + 0.4, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'hips.dy': 0 }, 'inOut'); occupy(id, t0, t1, 'rope'); cue(t0, id, 'hauls on the rope'); }
  function search(id, t0, t1) { const R = rng(sid + id + 'search'); let t = t0 + R() * 0.6; if (seated(id, t0)) return;
    while (t < t1 - 0.5) { const u = R() < 0.5 ? -1 : 1; S.key(id, 'act', t, { 'torso.lean': 0.22, 'torso.twist': 0.35 * u, 'arm.R.pitch': -0.9, 'arm.L.pitch': -0.5, 'root.h': 0.6 * u }, 'inOut'); S.key(id, 'act', t + 0.6, { 'torso.lean': 0.12, 'head.yaw': -0.5 * u }, 'out'); t += 1.1 + R() * 0.6; }
    S.key(id, 'act', t1 + 0.4, { 'torso.lean': 0, 'torso.twist': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'root.h': 0, 'head.yaw': 0 }, 'inOut'); occupy(id, t0, t1, 'search'); }
  function dice(id, t0, t1) { const R = rng(sid + id + 'dice'); let t = t0 + R() * 1.2, k = 0;
    while (t < t1 - 0.6) { const w = (k + Math.floor(R() * 3)) % 3;
      if (w === 0) { S.key(id, 'work', t, { 'arm.R.pitch': -0.7, 'torso.lean': 0.06 }, 'inOut'); S.key(id, 'work', t + 0.35, { 'arm.R.pitch': -1.5, 'torso.lean': 0.2, 'head.pitch': 0.12 }, 'back'); S.key(id, 'work', t + 0.9, { 'arm.R.pitch': -1.1, 'torso.lean': 0.08, 'head.pitch': 0.08 }, 'inOut'); }
      else if (w === 1) drink(id, t);
      else laugh(id, t);
      t += 1.8 + R() * 1.2; k++; }
    S.key(id, 'work', t1 + 0.3, { 'arm.R.pitch': 0, 'torso.lean': 0, 'head.pitch': 0 }, 'inOut'); occupy(id, t0, t1, 'dice'); }
  function drink(id, t) { S.key(id, 'work', t, { 'arm.R.pitch': S.at(id, 'arm.R.pitch', 'work', t), 'head.pitch': S.at(id, 'head.pitch', 'work', t) }, 'inOut'); S.key(id, 'work', t + 0.5, { 'arm.R.pitch': -2.1, 'head.pitch': -0.12 }, 'inOut'); S.key(id, 'work', t + 1.0, { 'arm.R.pitch': -2.3, 'head.pitch': -0.2 }, 'linear'); S.key(id, 'work', t + 1.5, { 'arm.R.pitch': -0.3, 'head.pitch': 0.02 }, 'inOut'); }
  function laugh(id, t) { S.key(id, 'work', t, { 'torso.lean': S.at(id, 'torso.lean', 'work', t) }, 'inOut'); S.key(id, 'work', t + 0.25, { 'torso.lean': -0.16, 'head.pitch': -0.15 }, 'out');
    for (let k = 0; k < 3; k++) { S.key(id, 'work', t + 0.4 + k * 0.25, { 'torso.lean': -0.06 }, 'inOut'); S.key(id, 'work', t + 0.52 + k * 0.25, { 'torso.lean': -0.14 }, 'inOut'); }
    S.key(id, 'work', t + 1.4, { 'torso.lean': 0.1, 'head.pitch': 0.06 }, 'inOut'); S.key(id, 'work', t + 1.9, { 'torso.lean': 0, 'head.pitch': 0 }, 'inOut'); }
  /* the key window in which the blocking lays a figure down (standing at one key, lying at the next): the fall itself */
  function fallWindow(id, t) { for (let j = 1; j < M.keys.length; j++) { const K = M.keys[j]; if (!K.win || !K.moves || !K.moves[id]) continue; const a = M.keys[j - 1].snap[id], b = K.snap[id];
      if (a && b && !B.lying(a) && B.lying(b) && K.win[1] > t - 4 && K.win[0] < t + 4) return K.win; } return null; }
  /* the shot: the bow drawn (motion.js draw-bow: the nock, the draw, the hold at full draw trembling, the loose, the follow
     through), and the one shot at takes it a drawing after the loose; everyone else starts at the sound */
  function shoot(id, c, t0, txt) {
    shooters.add(id); const tgt = c.addressee && ids.includes(c.addressee) && c.addressee !== id ? c.addressee : null;
    if (tgt) look(id, tgt, t0 - 0.4, 'look', {});
    if (!loopClip(id, 'draw-bow', t0, t0 + 2.6, { release: true, why: 'draws the bow, holds, looses' })) { gesture(id, 'point', t0, 'L', 1, 1); return; }
    const tr = t0 + 21 / 12;
    for (let k = 0; k < 8; k++) S.key(id, 'beat', t0 + 1.0 + k / F, { 'arm.R.pitch': (k % 2 ? 0.035 : -0.035), 'head.pitch': (k % 2 ? 0.015 : -0.01) }, 'linear');   /* the full draw trembles */
    S.key(id, 'beat', tr, { 'arm.R.pitch': 0, 'head.pitch': 0 }, 'inOut');
    S.key(id, 'act', tr + 1 / F, { 'torso.lean': -0.06, 'hips.dy': -0.8 }, 'out'); S.key(id, 'act', tr + 0.5, { 'torso.lean': 0, 'hips.dy': 0 }, 'inOut');   /* the recoil of the loose */
    occupy(id, t0 - 0.4, t0 + 3, 'bow');
    if (!tgt) return;
    if (/cup|drink|wine/.test(txt)) { S.key(tgt, 'work', tr - 1.6, { 'torso.lean': 0, 'head.pitch': 0 }, 'inOut'); S.key(tgt, 'work', tr - 1.0, { 'torso.lean': -0.1, 'head.pitch': -0.14 }, 'inOut'); S.key(tgt, 'work', tr, { 'torso.lean': -0.12, 'head.pitch': -0.18 }, 'linear'); cue(tr - 1.6, tgt, 'lifts the cup to drink'); }
    struck[tgt] = tr + 1 / F; const w = fallWindow(tgt, tr), until = w ? w[0] : tr + 3.5;
    const L = 'act'; S.begin();
    S.key(tgt, L, tr, { 'torso.lean': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'arm.L.out': 0, 'root.pitch': 0, 'hips.dy': 0 }, 'inOut');
    S.key(tgt, L, tr + 2 / F, { 'torso.lean': -0.26, 'head.pitch': -0.2, 'arm.R.pitch': 1.0, 'arm.L.pitch': -2.35, 'arm.L.out': -0.15, 'root.pitch': -0.1, 'hips.dy': 1.2 }, 'out');   /* the jolt: the cup arm drops, the hand flies to the throat */
    S.key(tgt, L, tr + 0.45, { 'torso.lean': -0.18, 'head.pitch': -0.14, 'arm.R.pitch': 0.8, 'root.pitch': -0.06, 'hips.dy': -1.5 }, 'inOut');
    let t = tr + 0.45, k = 0; while (t < until - 0.4) { const u = k % 2 ? 1 : -1; t += 0.32 + 0.12 * (k % 3);   /* he staggers on the spot, the other hand groping */
      S.key(tgt, L, t, { 'root.roll': 0.06 * u, 'torso.roll': -0.08 * u, 'arm.R.pitch': 0.5 - 0.5 * (k % 2), 'arm.R.out': 0.25 * (k % 2), 'head.pitch': -0.1 + 0.08 * (k % 2), 'hips.dy': -1.5 - 1.0 * (k % 2) }, 'inOut'); k++; }
    S.key(tgt, L, until + 0.4, { 'torso.lean': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'arm.L.out': 0, 'arm.R.out': 0, 'root.pitch': 0, 'root.roll': 0, 'torso.roll': 0, 'hips.dy': 0 }, 'inOut'); S.end();
    occupy(tgt, tr - 1.6, until + 0.4, 'struck'); cue(tr, id, 'looses'); cue(tr + 1 / F, tgt, 'the arrow: the jolt, the hand to the throat, the stagger');
    for (const o of ids) { if (o === id || o === tgt || !B.visible(o, tr)) continue; const Ro = rng(sid + o + 'startle'), ts = tr + 0.15 + Ro() * 0.35;
      look(o, tgt, ts, 'look', {}); S.key(o, 'react', ts, { 'torso.lean': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }, 'inOut'); S.key(o, 'react', ts + 2 / F, { 'torso.lean': -0.1, 'arm.R.pitch': -0.5, 'arm.L.pitch': -0.4, 'hips.dy': 1.0 }, 'out');
      S.key(o, 'react', ts + 1.2, { 'torso.lean': -0.05, 'arm.R.pitch': -0.3, 'arm.L.pitch': -0.25, 'hips.dy': 0 }, 'linear'); S.key(o, 'react', ts + 2.0, { 'torso.lean': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }, 'inOut'); occupy(o, ts, ts + 2, 'startle'); }
  }
  /* the fall the blocking lays down (standing to lying across its window): the knees go first, the arms fly, the body follows;
     then he is still: a deliberate stillness, not a frozen actor */
  function collapse(id, w) { const [w0, w1] = w;
    S.key(id, 'act', w0 - 0.1, { 'hips.dy': 0, 'torso.lean': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }, 'inOut');
    S.key(id, 'act', w0 + 0.35, { 'hips.dy': -3.5, 'torso.lean': 0.2, 'head.pitch': -0.15, 'arm.R.pitch': -0.6, 'arm.L.pitch': -0.3 }, 'in');
    S.key(id, 'act', lerp(w0, w1, 0.6), { 'hips.dy': -2, 'torso.lean': 0.3, 'head.pitch': 0.18, 'arm.R.pitch': 0.4, 'arm.L.pitch': 0.5 }, 'out');
    S.key(id, 'act', w1 + 0.1, { 'hips.dy': 0, 'torso.lean': 0.06, 'head.pitch': 0.1, 'arm.R.pitch': 0.15, 'arm.L.pitch': 0.1 }, 'back');
    S.key(id, 'act', w1 + 0.9, { 'torso.lean': 0, 'head.pitch': 0.05, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }, 'inOut');
    holds.push({ actor: id, t0: r3(w1 + 1), t1: r3(T), why: 'dead' }); occupy(id, w0 - 0.2, T + 1, 'dead'); cue(w0, id, 'the fall: the knees go, the arms fly, he lies across the table'); }
  /* hit: the jolt back (the arms fly up, the head snaps), a beat, the knees go; the fall itself is the blocking's (its next key) */
  function hit(id, t) { S.key(id, 'act', t - 0.1, { 'torso.lean': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }, 'inOut');
    S.key(id, 'act', t + 1 / F, { 'torso.lean': -0.25, 'head.pitch': -0.2, 'arm.R.pitch': -2.2, 'arm.L.pitch': -1.8, 'root.pitch': -0.12 }, 'out');
    S.key(id, 'act', t + 0.5, { 'torso.lean': -0.2, 'head.pitch': -0.15, 'arm.R.pitch': -2.0, 'arm.L.pitch': -2.1, 'root.pitch': -0.1 }, 'linear');
    S.key(id, 'act', t + 0.8, { 'torso.lean': 0.3, 'head.pitch': 0.2, 'arm.R.pitch': -0.6, 'arm.L.pitch': -0.9, 'root.pitch': 0.25, 'root.y': -3 * scale }, 'in');
    S.key(id, 'act', t + 1.0, { 'root.pitch': 0.2, 'root.y': -2 * scale }, 'out');
    S.key(id, 'act', t + 2.2, { 'torso.lean': 0, 'head.pitch': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'root.pitch': 0, 'root.y': 0 }, 'inOut'); occupy(id, t - 0.2, t + 2.2, 'hit'); }
  function leap(id, t) { S.key(id, 'act', t - 0.1, { 'root.y': 0, 'hips.dy': 0, 'torso.lean': 0, 'arm.R.pitch': 0, 'arm.L.pitch': 0 }, 'inOut');
    S.key(id, 'act', t + 0.35, { 'hips.dy': -3, 'torso.lean': 0.25, 'arm.R.pitch': 0.5, 'arm.L.pitch': 0.5 }, 'out');   /* the crouch */
    S.key(id, 'act', t + 0.6, { 'hips.dy': 1, 'root.y': 18 * scale, 'torso.lean': -0.1, 'arm.R.pitch': -2.4, 'arm.L.pitch': -2.2 }, 'out');   /* up */
    S.key(id, 'act', t + 0.85, { 'root.y': 0, 'hips.dy': -2.5, 'torso.lean': 0.18, 'arm.R.pitch': -1.2, 'arm.L.pitch': -0.9 }, 'in');   /* lands */
    S.key(id, 'act', t + 1.3, { 'hips.dy': 0, 'torso.lean': 0, 'arm.R.pitch': -0.6, 'arm.L.pitch': -0.8 }, 'out'); S.key(id, 'act', t + 2.0, { 'arm.R.pitch': 0, 'arm.L.pitch': 0 }, 'inOut'); occupy(id, t - 0.2, t + 2, 'leap'); }
  /* the walk: the hips drop on each contact and rise on the pass, the body leans into the step, the head bobs a drawing late */
  function walk(id, K) { const [w0, w1] = K.win; let prev = null; const pts = [];
    for (let t = w0; t <= w1 + 1e-6; t += 1 / 24) { const s = B.at(id, t); if (!s || s.ph == null) continue; if (prev != null) { const a = Math.floor(prev / (Math.PI / 2)), b = Math.floor(s.ph / (Math.PI / 2)); if (b !== a) pts.push([t, b, s.walk]); } prev = s.ph; }
    S.key(id, 'walk', w0, { 'hips.dy': 0, 'torso.lean': 0, 'head.pitch': 0 }, 'inOut');
    for (const [t, b, amt] of pts) { const contact = b % 2 === 1; S.key(id, 'walk', t, { 'hips.dy': (contact ? -1.6 : 1.0) * amt, 'torso.lean': 0.07 * amt, 'torso.roll': (contact ? (b % 4 === 1 ? 0.05 : -0.05) : 0) * amt }, contact ? 'in' : 'out');
      S.key(id, 'walk', t + 1 / F, { 'head.pitch': (contact ? 0.04 : -0.02) * amt }, 'inOut'); }
    S.key(id, 'walk', w1 + 0.15, { 'hips.dy': -1.2, 'torso.lean': -0.03 }, 'out');   /* the stop: a settle, the weight caught */
    S.key(id, 'walk', w1 + 0.5, { 'hips.dy': 0, 'torso.lean': 0, 'torso.roll': 0, 'head.pitch': 0 }, 'inOut');
    occupy(id, w0, w1 + 0.3, 'walk'); cue(w0, id, 'walks to the next mark'); }
  /* business: what a figure does when the scene is not about him: by his role and whether he sits */
  function business(id) { const R = rng(sid + id + 'work'), n = name(id); let t = R() * 1.2;
    while (t < T) { const s = B.at(id, t); const len = 2.2 + R() * 1.6;
      if (!s || !s.vis || B.lying(s) || (s.moving && s.walk > 0.1) || isBusy(id, t, t + len)) { t += 0.5; continue; }
      const sat = s.sat, nb = near(id, t, 6)[0], k = Math.floor(R() * 4);
      if (/suitor/.test(n) && sat) { if (k === 0) drink(id, t); else if (k === 1) laugh(id, t); else if (nb) { look(id, nb, t, 'look', {}); gesture(id, pick(R, ['open', 'chop', 'dismiss']), t + 0.5, 'R', 0.7, 0.6, nb); look(id, null, t + len - 0.3, 'look', {}); } else drink(id, t); }
      else if (/servant|maid|herald|handmaid/.test(n)) { const u = k % 2 ? 1 : -1; S.begin();   /* work: the jar lifted, poured, set down; a turn to the next table */
        S.key(id, 'work', t, { 'arm.R.pitch': S.at(id, 'arm.R.pitch', 'work', t), 'torso.lean': S.at(id, 'torso.lean', 'work', t), 'root.h': S.at(id, 'root.h', 'work', t) }, 'inOut');
        S.key(id, 'work', t + 0.5, { 'arm.R.pitch': -0.9, 'arm.L.pitch': -0.7, 'torso.lean': 0.16 }, 'inOut'); S.key(id, 'work', t + 1.1, { 'arm.R.pitch': -1.3, 'arm.L.pitch': -0.9, 'torso.lean': 0.06, 'hand.R.roll': 0.5 * u }, 'inOut');
        S.key(id, 'work', t + 1.7, { 'arm.R.pitch': -0.4, 'arm.L.pitch': -0.3, 'torso.lean': 0.02, 'hand.R.roll': 0, 'root.h': 0.35 * u }, 'inOut'); S.key(id, 'work', t + len, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'root.h': 0.25 * u }, 'inOut'); S.end(); }
      else if (/crew|oars/.test(n)) { /* rowing covers them; else they talk to the next man */ if (nb) { look(id, nb, t, 'look', {}); beat(id, t + 0.5, 'L', 0.8); look(id, null, t + len - 0.3, 'look', {}); } }
      else { /* the principals between their lines, and anyone else: a look round, a word to the nearest, the weight moved */
        if (nb && k < 2) { look(id, nb, t, 'look', {}); if (!sat) gesture(id, 'open', t + 0.6, heldR(id) ? 'L' : 'R', 0.55, 0.5, nb); look(id, null, t + len - 0.4, 'look', {}); }
        else glance(id, t, (R() - 0.5) * 1.4, len * 0.6); }
      t += len + 0.2 + R() * 0.8; } }
  /* weight shifts: in every stretch the feet are still, the weight goes from one hip to the other and settles (a hold that breathes) */
  function shifts(id) { const R = rng(sid + id + 'shift'); let t = 0.5 + R() * 2, u = R() < 0.5 ? 1 : -1;
    while (t < T) { const s = B.at(id, t); if (!s || !s.vis || B.lying(s) || (s.moving && s.walk > 0.1)) { t += 0.5; continue; }
      if (s.sat) { S.key(id, 'shift', t, { 'torso.roll': 0.06 * u, 'torso.twist': 0.08 * u }, 'inOut'); S.key(id, 'shift', t + 1.4, { 'torso.roll': 0.045 * u, 'torso.twist': 0.06 * u }, 'linear'); }
      else { S.key(id, 'shift', t, { 'root.roll': 0.032 * u, 'torso.roll': -0.05 * u, 'hips.dy': -0.7, 'head.pitch': 0 }, 'inOut'); S.key(id, 'shift', t + 0.45, { 'hips.dy': 0.2, 'root.roll': 0.036 * u }, 'back'); S.key(id, 'shift', t + 2.2, { 'root.roll': 0.024 * u, 'torso.roll': -0.03 * u, 'hips.dy': 0 }, 'linear'); }
      u = -u; t += 2.4 + R() * 2.4; } }

  /* ── rigs: a ship at sea when the scene is aboard (rowers, a mast): pitch, roll and heave on long periods, the riders with it ── */
  const ship = (M.pieces || []).find(p => /ship|hull|galley|boat|deck/.test(p.label));
  if (ship && ids.some(id => /crew|oars/.test(id))) { const b = ship.box, piv = [(b[0] + b[3]) / 2, b[1], (b[2] + b[5]) / 2], ch = { pitch: [], roll: [], heave: [] }, R = rng(sid + 'sea');
    for (let t = 0; t <= T + 2; t += 1.2 + R() * 0.5) { const w = Math.sin(t * 0.9) * 0.6 + Math.sin(t * 0.37 + 1) * 0.4; ch.pitch.push([r3(q(t)), r3(0.035 * w)]); ch.roll.push([r3(q(t)), r3(0.028 * Math.sin(t * 0.61 + 2))]); ch.heave.push([r3(q(t)), r3(3.5 * scale * Math.sin(t * 0.8 + 0.5))]); }
    rigs.ship = { type: 'ship', piece: ship.label, pivot: piv.map(r3), channels: ch, riders: ids.filter(id => { const s = B.at(id, 0); return s && s.p[0] >= b[0] && s.p[0] <= b[3] && s.p[2] >= b[2] && s.p[2] <= b[5] && !/siren/.test(id); }) };
    notes.push('the ship ' + ship.label + ' pitches, rolls and heaves; its riders go with it'); }

  /* the sheet */
  S.write();
  const actors = {}; for (const id of ids) { const A = S.actors[id]; if (!A) continue; const ch = {};
    for (const [k, L] of Object.entries(A.channels).sort()) { const keys = L.filter((x, i) => i === 0 || x[0] > L[i - 1][0] - 1e-9); if (keys.length > 1 || (keys[0] && keys[0][1] !== 0)) ch[k] = keys; }
    actors[id] = { channels: ch, H: r3(H(id)) }; }
  return { format: 'odyssey-choreo/1', scene: M.scene, clock: M.mode || MODE, step: 'twos', layer: 'add', total: M.total,
    generated: { by: 'tools/choreograph.js', emotion: sceneEmo, from: 'odyssey/choreo/marks/' + M.scene + '.json', note: 'the rough pass; hand keys go in overrides[actor][channel@layer] and survive regeneration' },
    voice: clips.map(c => ({ gi: c.gi, at: r3(c.at), dur: r3(c.dur), kind: c.kind, voice: c.voice, speaker: c.speaker, addressee: c.addressee, caption: c.caption, key: c.gi === M.keyGi })),
    cut: (M.cut || []).map(x => ({ t0: r3(x.t0), dur: r3(x.dur), kind: x.kind })), keys: M.keys.map(k => ({ id: k.id, t: r3(k.t), win: k.win && k.win.map(r3), beat: k.beat })),
    cues: cues.sort((a, b) => a.t - b.t), holds, notes, actors, props: props.sort((a, b) => a.t - b.t), rigs, overrides: (prev && prev.overrides) || {} };
}
let CLIPS = null;
function loadClips() { try { if (!globalThis.THREE) globalThis.THREE = require('three'); require(path.join(ROOT, 'film-readymades/motion.js')); CLIPS = globalThis.OdysseyMotion.CLIPS; } catch (e) { console.warn('motion.js clips unavailable (' + e.message.split('\n')[0] + '); writing keys of its own'); CLIPS = {}; } }

/* ═══════════════ the acting density: from poses probed in the page ═══════════════ */
/* per drawn frame (12 a second) and per figure in frame (outside the sheet's deliberate stillnesses, `holds`: the dead): did any of seven points on the body (the face, the crown, the chest, both
   hands, both feet) move more than THRESH of the figure's height since the drawing before? The longest frozen stretch is the longest
   run of drawings in frame without such a move. */
const THRESH = 0.005;
function density(P, holds) {
  const per = {}, prev = {}, held = (id, t) => (holds || []).some(h => h.actor === id && t >= h.t0 && t <= h.t1);
  for (const p of P) { for (const [id, a] of Object.entries(p.actors)) { if (held(id, p.t)) { delete prev[id]; continue; } const e = per[id] || (per[id] = { on: 0, moving: 0, run: 0, frozen: 0, frozenAt: null, runStart: null });
      const b = prev[id]; prev[id] = a; if (!a.on || !b) { e.run = 0; continue; }
      e.on++; const d = Math.max(...a.p.map((x, i) => Math.hypot(x[0] - b.p[i][0], x[1] - b.p[i][1], x[2] - b.p[i][2]))) / a.H;
      if (d > THRESH) { e.moving++; e.run = 0; } else { if (!e.run) e.runStart = p.t; e.run++; if (e.run > e.frozen) { e.frozen = e.run; e.frozenAt = e.runStart; } } }
    for (const id in prev) if (!p.actors[id]) delete prev[id]; }
  const out = {}; for (const [id, e] of Object.entries(per)) if (e.on) out[id] = { frames: e.on, moving: r3(e.moving / e.on), longestFrozen: r3(e.frozen / 12), frozenAt: e.frozenAt != null ? r3(e.frozenAt) : null };
  const L = Object.values(out); return { threshold: THRESH, actors: out, mean: L.length ? r3(L.reduce((a, b) => a + b.moving, 0) / L.length) : 0, worstFrozen: L.length ? Math.max(...L.map(x => x.longestFrozen)) : 0, over80: L.filter(x => x.moving > 0.8).length, count: L.length };
}

/* ═══════════════ the page ═══════════════ */
async function openTake(id) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } }); page.setDefaultTimeout(1800000);
  page.on('pageerror', e => console.log('page error', e.message)); page.on('console', m => { if (/^\[take\]/.test(m.text()) || m.type() === 'error' && !/Failed to load resource/.test(m.text())) console.log(m.text().slice(0, 200)); });
  await page.goto('http://localhost:' + (process.env.PORT || 8899) + '/film-readymades/production/Film-Butter-Odyssey.html', { timeout: 1800000 });
  await page.waitForFunction(() => window.ButterLocation && window.ButterFilms?.current && !ButterFilms.busy && ButterCast.cast.length, null, { timeout: 1800000 });
  const loc = 'odyssey-' + id.toLowerCase();
  if ((await page.evaluate(() => ButterFilms.current.sourceId)) !== loc) {
    await page.evaluate(l => { const t = ButterFilms.records.find(r => r.id === l).title, o = [...document.querySelectorAll('#versionSelect option')].find(o => o.textContent.trim() === t); return ButterFilms.switchTo(o.value); }, loc);
    await page.waitForFunction(l => ButterFilms.current?.sourceId === l && !ButterFilms.busy && ButterCast.cast.length, loc, { timeout: 600000 }); }
  console.log('location', loc, 'loaded; preparing the take (the shot plan is scored here: minutes)');
  await page.evaluate(m => OdysseyTake.prepare({ mode: m, choreo: false }), MODE);
  return { browser, page };
}
async function poses(page, total) { const P = []; for (let t = 0; t < total - 1e-6; t += 1 / 12) P.push(await page.evaluate(t => OdysseyTake.pose(t), t)); return P; }
async function probe(id, { marks = true } = {}) {
  const { browser, page } = await openTake(id);
  let M; if (marks) { M = await page.evaluate(() => OdysseyTake.marks()); fs.mkdirSync(path.join(OUT, 'marks'), { recursive: true }); fs.writeFileSync(path.join(OUT, 'marks', id + '.json'), JSON.stringify(M)); console.log('marks written'); }
  else M = JSON.parse(fs.readFileSync(path.join(OUT, 'marks', id + '.json'), 'utf8'));
  const before = density(await poses(page, M.total)); console.log('before', JSON.stringify({ mean: before.mean, worstFrozen: before.worstFrozen, over80: before.over80 + '/' + before.count }));
  const f = path.join(OUT, id + '.json'); let C = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  if (!C) { loadClips(); C = generate(M, null); fs.writeFileSync(f, JSON.stringify(C)); }
  await page.evaluate(C => OdysseyTake.useChoreo(C), C);
  const after = density(await poses(page, M.total), C.holds); console.log('after', JSON.stringify({ mean: after.mean, worstFrozen: after.worstFrozen, over80: after.over80 + '/' + after.count }));
  await browser.close();
  fs.mkdirSync(path.join(OUT, 'density'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'density', id + '.json'), JSON.stringify({ scene: id, mode: MODE, measured: new Date().toISOString().slice(0, 10), rule: 'per drawing (12 a second), per figure in frame: moving if any of seven body points moved more than ' + THRESH * 100 + '% of its height since the drawing before', before, after }, null, 1));
  return { before, after };
}

if (require.main !== module) { module.exports = { generate, density, loadClips, Blocking, voiceOf, THRESH }; return; }
(async () => {
  if (!sid || !['probe', 'gen', 'density'].includes(cmd)) { console.log('node tools/choreograph.js probe|gen|density OD-Bxx-Syy [--mode cut]'); process.exit(1); }
  if (cmd === 'gen') { loadClips(); const M = JSON.parse(fs.readFileSync(path.join(OUT, 'marks', sid + '.json'), 'utf8')), f = path.join(OUT, sid + '.json');
    const prev = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null, C = generate(M, prev); fs.writeFileSync(f, JSON.stringify(C));
    const n = Object.values(C.actors).reduce((a, A) => a + Object.values(A.channels).reduce((b, k) => b + k.length, 0), 0);
    console.log('wrote', path.relative(ROOT, f), Object.keys(C.actors).length, 'actors,', n, 'keys,', C.cues.length, 'cues,', C.props.length, 'props', Object.keys(C.rigs).length ? ', rigs ' + Object.keys(C.rigs).join(',') : '');
    for (const c of C.cues) console.log('  ', c.t.toFixed(2).padStart(6), c.actor.padEnd(22), c.what); return; }
  if (cmd === 'probe') { await probe(sid, { marks: true }); return; }
  if (cmd === 'density') { await probe(sid, { marks: false }); return; }
})().catch(e => { console.error(e); process.exit(1); });
