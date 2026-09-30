/* tools/perform/compile.js — the intent compiler: UTTERANCE -> PERFORMANCE INTENT -> BODY SCORE.

   Input: the take's marks (odyssey/choreo/marks/<scene>.json: blocking, clips, the voice envelope, the cut) and a score's authored
   layer (odyssey/score/<scene>.json `authored`: intents with parameters, holds with reasons, stimuli, contacts and props, clocks,
   couplings, combat relations), with the compiler's parameters (`params`, which the homeostat's selectors step).
   Output: an odyssey-choreo/1 sheet (layer 'add': an acting layer over the take's blocking, as tools/choreograph.js wrote) and the
   score's events: every move the compiler writes is an ACTION with the body lanes it moves, each caused by the intent that wanted
   it, which is caused by an utterance, a stimulus, another actor's action or a HOLD's reason. Nothing is written without a cause;
   the compiler never adds business to beat a motion threshold. Patching an intent's kind or parameters and compiling again
   re-derives the body; nothing else is regenerated at random (the only randomness is seeded by scene, actor and intent id).

   The compiler's parameters (the homeostat's ten selectors, 25 positions each, position 12 = the authored default):
     latency    reaction latency (s)             amp        gesture amplitude (x)          separation  actor separation (x)
     threat     threat distance (figure heights)  attack     attack probability             pause       pause duration (s)
     camera     camera distance (x, media)        affordance prop affordance weight         env         environment response (x)
     horizon    action-selection horizon (s)
   Layers written (they sum; choreo.js plays them): @gaze (where the head and torso point), @act (the intents' actions), @grip
   (hand contacts solved by forward kinematics), @loco (root travel and walk cycles the blocking does not give), @weight (weight,
   tension, breath), @react (reactions), @mech (machinery: the rowing clock, the rope, the ship's riders). */
'use strict';
const path = require('path');
const Body = require('./body.js'), Score = require('./score.js');
const Choreo = require('../../film-readymades/choreo.js'), Creatures = require('../../film-readymades/creatures.js');
const F = 12, q = t => Math.round(t * F) / F, r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 1e4) / 1e4;
const cl = (v, a, b) => Math.max(a, Math.min(b, v)), sm = u => { u = cl(u, 0, 1); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u, wrap = Body.wrap;
function hash32(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function rng(seed) { let s = hash32(String(seed)); return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const PARAMS = {
  latency: { label: 'reaction latency', unit: 's', lo: 0.08, hi: 0.9, def: 0.3 },
  amp: { label: 'gesture amplitude', unit: 'x', lo: 0.35, hi: 1.65, def: 1.0 },
  separation: { label: 'actor separation', unit: 'x', lo: 0.6, hi: 1.6, def: 1.0 },
  threat: { label: 'threat distance', unit: 'H', lo: 0.6, hi: 3.0, def: 1.5 },
  attack: { label: 'attack probability', unit: '', lo: 0.1, hi: 0.95, def: 0.5 },
  pause: { label: 'pause duration', unit: 's', lo: 0.2, hi: 2.0, def: 0.7 },
  camera: { label: 'camera distance', unit: 'x', lo: 0.7, hi: 1.5, def: 1.0 },
  affordance: { label: 'prop affordance weight', unit: '', lo: 0, hi: 1.5, def: 0.7 },
  env: { label: 'environment response', unit: 'x', lo: 0, hi: 2, def: 1.0 },
  horizon: { label: 'action-selection horizon', unit: 's', lo: 1, hi: 3, def: 2.0 },
  focus: { label: 'focus on the principals (background amplitude x (1 - focus))', unit: '', lo: 0, hi: 0.8, def: 0.2 },
};
const defaults = () => Object.fromEntries(Object.entries(PARAMS).map(([k, p]) => [k, p.def]));

/* ═════ the voice: phrases and stresses from the recorded envelope (tools/choreograph.js's reading), words placed by their letters ═════ */
function voiceOf(M, c) {
  const env = M.env, hz = M.hz, i0 = Math.floor(c.start * hz), n = Math.ceil(c.dur * hz), E = [];
  for (let i = 0; i < n; i++) E.push(env[i0 + i] || 0);
  const S = E.map((_, i) => { let s = 0, w = 0; for (let d = -3; d <= 3; d++) { const x = E[i + d]; if (x != null) { s += x; w++; } } return s / w; });
  const phrases = [], stresses = []; let quiet = 99, inP = false;
  for (let i = 0; i < n; i++) { const t = c.at + i / hz, v = S[i];
    if (v < 0.09) { quiet++; if (quiet > 0.22 * hz && inP) { inP = false; phrases[phrases.length - 1].t1 = t - quiet / hz; } }
    else { if (!inP && v > 0.14) { inP = true; phrases.push({ t0: t, t1: c.at + c.dur }); } quiet = 0; } }
  for (let i = 2; i < n - 2; i++) { const v = S[i]; if (v < 0.5) continue; if (v >= S[i - 1] && v >= S[i + 1] && v >= S[i - 2] && v >= S[i + 2]) { const t = c.at + i / hz;
    if (!stresses.length || t - stresses[stresses.length - 1].t > 0.42) stresses.push({ t, v }); else if (v > stresses[stresses.length - 1].v) stresses[stresses.length - 1] = { t, v }; } }
  /* the words: placed inside the phrases by their letters (the voice's own pauses stretch them) */
  const text = String(c.caption || ''), words = [], re = /[A-Za-z']+/g; let m; const toks = [];
  while ((m = re.exec(text))) toks.push({ w: m[0].toLowerCase(), i: m.index, punct: /[,.;:!?]/.test(text.slice(m.index + m[0].length, m.index + m[0].length + 2)) });
  const spoken = phrases.length ? phrases : [{ t0: c.at + 0.15, t1: c.at + c.dur - 0.15 }], tot = spoken.reduce((a, p) => a + (p.t1 - p.t0), 0), L = Math.max(1, text.length);
  for (const tk of toks) { let u = tk.i / L * tot; for (const p of spoken) { const d = p.t1 - p.t0; if (u <= d) { words.push({ w: tk.w, t: p.t0 + u, punct: tk.punct }); break; } u -= d; } }
  for (const w of words) { const st = stresses.find(s => Math.abs(s.t - w.t) < 0.3); if (st) w.stress = st.t; }
  return { phrases, stresses, words };
}
/* the turn's act (halfworld performance-turns) as the speech act the body plays */
const SPEECH_ACT = { GREET: 'WELCOME', DECLARE: 'DECLARE', ACCUSE: 'ACCUSE', COMMAND: 'COMMAND', PLEAD: 'PLEAD', PETITION: 'PLEAD', PROMISE: 'PROMISE', THREATEN: 'THREATEN', ASSERT: 'DECLARE', NARRATE: 'NARRATE' };

/* ═════ the sheet: lanes of keys per actor channel@layer, written as moves (tools/choreograph.js's rule: a move takes the lane from
   where it is at the move's start, and truncates what an earlier move left on the lane after that) ═════ */
function Sheet() {
  const actors = {}, moves = []; let open = null;
  const lane = (id, k) => { const A = actors[id] || (actors[id] = { channels: {} }); return A.channels[k] || (A.channels[k] = []); };
  const key = (id, layer, t, vals, ease) => { const k = { id, layer, t: Math.max(0, q(t)), vals, ease }; if (open) open.keys.push(k); else moves.push({ keys: [k], n: moves.length }); };
  const begin = () => { open = { keys: [], n: moves.length }; moves.push(open); }, end = () => { open = null; };
  function write() {
    const Ms = moves.filter(m => m.keys.length).map(m => ({ ...m, t0: Math.min(...m.keys.map(k => k.t)) })).sort((a, b) => a.t0 - b.t0 || a.n - b.n);
    for (const m of Ms) { const start = new Map(), ks = m.keys.map((k, i) => ({ k, i })).sort((a, b) => a.k.t - b.k.t || a.i - b.i).map(x => x.k);
      for (const { id, layer, t, vals, ease } of ks) for (const [ch, v0] of Object.entries(vals)) { if (v0 == null) continue;
        const nm = ch + '@' + layer, L = lane(id, nm), tag = id + '|' + nm;
        if (!start.has(tag)) { const s0 = L.length ? Choreo.sampleKeys(L, m.t0, '') : 0; start.set(tag, s0);
          while (L.length && L[L.length - 1][0] > m.t0 + 1e-6) L.pop(); if (!L.length || L[L.length - 1][0] < m.t0 - 1e-6) { if (!L.length && m.t0 > 0) L.push([0, 0]); L.push([m.t0, r4(s0)]); } }
        let v = typeof v0 === 'object' ? start.get(tag) + v0.rel : v0; if (!isFinite(v)) continue;
        while (L.length && L[L.length - 1][0] > t + 1e-6) L.pop();
        const kk = ease && ease !== 'inOut' ? [t, r4(v), ease] : [t, r4(v)];
        if (L.length && Math.abs(L[L.length - 1][0] - t) < 1e-6) L[L.length - 1] = kk; else { if (!L.length && t > 0) L.push([0, 0]); L.push(kk); } } }
    moves.length = 0; }
  return { actors, key, begin, end, write, rel: d => ({ rel: d || 0 }) };
}

/* a creature's channel to the score's body lanes (its legs and knees to the legs, its elbows to the arms, its eye and jaw to the face) */
const CPROC = { gait: ['root.x', 'root.z', 'leg.R.pitch', 'leg.L.pitch'], heavy: ['root.x', 'root.z', 'leg.R.pitch', 'leg.L.pitch', 'torso.roll'], grope: ['arm.R.pitch', 'arm.L.pitch', 'torso.lean'], reach: ['arm.R.pitch', 'elbow.R', 'torso.lean'], strike: ['neck'], herd: ['root.x', 'root.z', 'leg'], place: ['root.x', 'root.z', 'root.y'] };
function creatureLane(c) { if (Score.CH_LANE[c]) return Score.CH_LANE[c]; const [a, b] = c.split('.');
  if (a === 'root') return 'ROOT'; if (a === 'body' || a === 'hips') return 'WEIGHT'; if (a === 'elbow' || a === 'hand') return b === 'L' ? 'ARM.L' : 'ARM.R'; if (a === 'knee' || a === 'leg') return /L$/.test(b || '') ? 'LEG.L' : 'LEG.R';
  if (a === 'eye' || a === 'jaw' || a === 'ear' || a === 'tail') return 'FACE'; if (a === 'neck' || /^neck\d/.test(a)) return 'HEAD'; if (a === 'rider') return 'PROP'; return null; }
/* ═════ the compile ═════ */
function compile(M, S, opts = {}) {
  const A = S.authored || {}, θ = Object.assign(defaults(), S.params || {}, opts.params || {}), sid = M.scene, T = M.total;
  const B = Body.Blocking(M), bctx = { M, C: null, B }, sheet = Sheet(), E = Score.Events([]), props = [], rigs = {}, creatures = {}, notes = [];
  const ids = B.ids.filter(id => M.keys.some(k => k.snap[id] && k.snap[id].vis));
  const H = id => (M.H && M.H[id]) || 60, aff = id => Object.assign({ fear: 0, weight: 1, suspicion: 0, cunning: 0, heat: 1 }, ((S.actors || {})[id] || {}).affect || {});
  const scale = M.scale || 1, stud = 20 * scale;
  const solvers = [], busyArms = {}, principals = new Set(Object.entries(S.actors || {}).filter(([, a]) => a.principal).map(([k]) => k));
  /* the blocking's own pose (no sheet) at t, forward-kinematic points cached per drawing */
  const bcache = new Map();
  const bpose = (id, t) => { const k = id + '@' + q(t); if (!bcache.has(k)) bcache.set(k, Body.sample(bctx, id, q(t))); return bcache.get(k); };
  const at = (id, t) => B.at(id, t);
  const objects = S.objects || {};
  /* where a thing is at t: an actor's face, an object's mark (or the hand that holds it), a point */
  function where(x, t) {
    if (Array.isArray(x)) return x.length === 2 ? [x[0], 40 * scale, x[1]] : x;
    if (typeof x !== 'string') return null;
    if (ids.includes(x)) { const P = bpose(x, t); return P ? P.pts.face : null; }
    const o = objects[x]; if (!o) return null;
    /* an object re-staged by key (the giant sprawled, then standing, then at the door): track [[t, [x,y,z]], ...], the latest at t */
    if (o.track) { let p = o.track[0][1]; for (const [tt, pp] of o.track) if (tt <= t) p = pp; return p; }
    if (o.at) return o.at.length === 2 ? [o.at[0], o.y != null ? o.y : 40 * scale, o.at[1]] : o.at;
    if (o.holder) { const [who, sd] = o.holder.split(':'); const P = bpose(who, t); return P ? P.pts['hand' + (sd || 'R')] : null; }
    return null;
  }
  const relBearing = (s, p) => wrap(Math.atan2(p[0] - s.p[0], p[2] - s.p[2]) - s.h);
  /* when the blocking has the figure standing on its mark again at or after t (the end of a walk window it is inside) */
  /* the blocking's own value of a channel at t (for absolute targets) */
  const baseOf = (id, ch, t) => { const s = at(id, t); if (!s) return 0; const j = s.j, m = ch.match(/^(arm|leg)\.([RL])\.(pitch|out)$/);
    if (m) { const v = j[m[1] + m[2] + 'P']; return m[3] === 'pitch' ? v[0] : v[2] * (m[2] === 'R' ? -1 : 1); }
    return ch === 'torso.lean' ? j.torsoP[0] : ch === 'torso.twist' ? -j.torsoP[1] : ch === 'torso.roll' ? -j.torsoP[2] : ch === 'head.pitch' ? j.headP[0] : ch === 'head.yaw' ? -j.headP[1] : 0; };
  const settled = (id, t) => { const s = at(id, t); return s && s.moving && s.win ? s.win[1] + 0.05 : t; };

  /* ── events ── */
  const ev = e => E.add(e);
  const because = (...xs) => xs.flat().filter(Boolean).map(x => typeof x === 'string' ? { id: x } : x);
  const lat = (cause, t) => { const c = typeof cause === 'string' ? E.get(cause) : cause; return c ? { id: c.id, latency: r3(t - c.t0) } : null; };
  /* a move: keys on one actor's layer, recorded as an ACTION with the body lanes it moves, caused by `why` */
  function move(id, layer, kind, why, fn, o = {}) {
    /* a value {abs: v} is the joint's absolute angle: the offset over the blocking's own pose at that drawing */
    /* a heavier body (affect.weight > 1) takes longer to start and stop: the move's keys stretched about its first by sqrt(weight);
       an actor's heat (affect.heat) scales how far it moves (absolute targets excepted) */
    /* the amplitude of the expressive layers (acting, reactions, weight): the compiler's amp, the actor's heat, and focus (a figure
       the scene does not name as a principal moves x (1 - focus)); gaze, walks, grips and machinery keep their geometry */
    const expressive = ['act', 'react', 'weight'].includes(layer) && !o.rigid, prin = principals.size === 0 || principals.has(id);
    const W = Math.sqrt(Math.max(0.3, aff(id).weight || 1)), heat = (aff(id).heat == null ? 1 : aff(id).heat) * (expressive ? θ.amp * (prin ? 1 : 1 - θ.focus) : 1); let tFirst = null;
    sheet.begin(); const keys = []; const k = (t, vals, ease) => { if (tFirst == null) tFirst = t; if (W !== 1 && !o.rigid) t = tFirst + (t - tFirst) * W;
      const vv = {}; for (const [c, v] of Object.entries(vals)) vv[c] = v && typeof v === 'object' && v.abs != null ? (v.abs - baseOf(id, c, t)) * (o.exact ? 1 : heat) : (heat !== 1 && typeof v === 'number' && !/^root\.[xyz]$/.test(c) ? v * heat : v);
      keys.push({ t: q(t), vals: vv }); sheet.key(id, layer, t, vv, ease); };
    try { fn(k); } finally { sheet.end(); }
    if (!keys.length) return null;
    const t0 = Math.min(...keys.map(x => x.t)), t1 = Math.max(...keys.map(x => x.t)), chs = new Set(keys.flatMap(x => Object.keys(x.vals)));
    /* a body's preparation may start before its intent's nominal start (the PRE phase: anticipation): recorded as such */
    const cz = because(why).map(b => { const c = E.get(b.id); return c ? { id: c.id, latency: r3(t0 - c.t0), rel: b.rel || (t0 < c.t0 - 1e-6 ? 'anticipates' : undefined) } : b; });
    if (o.silent) return { t0, t1 };
    /* the ACTION carries the body lanes it moves (ROOT, WEIGHT, TORSO, HEAD, GAZE, ARM.L ...): the lanes view and the causal walk read
       them from it */
    const lanes = [...new Set([...chs].map(c => Score.CH_LANE[c]).filter(Boolean))];
    return ev({ lane: o.lane || 'ACTION', actor: id, t0, t1, kind, label: o.label || '', because: cz, layer, lanes, params: o.params });
  }
  const stim = (label, t, actor, o = {}) => ev({ lane: 'STIMULUS', actor, t0: t, t1: o.t1 != null ? o.t1 : t + (o.dur || 0.2), kind: o.kind || 'STIMULUS', label, because: because(o.because), params: o.params });

  /* ── the look: head leads, torso follows two drawings later, the feet a beat after that when the turn is past the neck and
     waist; toward an actor, an object or a point. Returns the GAZE event. ── */
  function look(id, target, t, why, o = {}) {
    let s = at(id, t); if (!s || !s.vis) return null; const L = o.layer || 'gaze';
    /* a look asked for while the blocking walks the figure waits for the walk to end (the walk carries the head where it goes) */
    if (s.moving && s.walk > 0.2 && !o.walking && s.win) { t = s.win[1] + 0.05; s = at(id, t); if (!s) return null; }
    let rel = 0, pitch = 0, tp = null;
    if (target != null) { tp = where(target, t); if (!tp) return null; rel = relBearing(s, tp); const P = bpose(id, t); if (P) { const f = P.pts.face, d = Math.hypot(tp[0] - f[0], tp[2] - f[2]); pitch = cl(-Math.atan2(tp[1] - f[1], Math.max(1, d)), -0.2, 0.2); } }
    const lying = B.lying(s), sat = s.sat, base = -(s.j.headP ? s.j.headP[1] : 0);
    let feet = 0; if (target != null && !sat && !lying && !o.noFeet && Math.abs(rel) > 1.25) feet = rel - Math.sign(rel) * 0.9;
    const rest = rel - feet, twist = target != null ? cl(rest * (o.torso != null ? o.torso : 0.35), -0.45, 0.45) : 0, head = target != null ? cl(rest - twist - base, -1.35, 1.35) : 0;
    const dur = (o.speed || 1) * (0.3 + Math.abs(rel - (o.from || 0)) * 0.1), t0 = t;
    return move(id, L, o.kind || (target == null ? 'LOOK FRONT' : 'LOOK'), why, k => {
      k(t0, { 'head.yaw': sheet.rel(0), 'torso.twist': sheet.rel(0), 'head.pitch': sheet.rel(0) });
      if (o.dip !== false) k(t0 + 1 / F, { 'head.pitch': 0.05 });
      k(t0 + dur, { 'head.yaw': head * (o.overshoot === false ? 1 : 1.05), 'head.pitch': pitch }, 'out');
      if (o.overshoot !== false) k(t0 + dur + 0.25, { 'head.yaw': head });
      k(t0 + 2 / F + dur, { 'torso.twist': twist });
      if (!lying && !sat && !o.noFeet) { k(t0 + 4 / F, { 'root.h': sheet.rel(0) }); k(t0 + 4 / F + dur + 0.2, { 'root.h': feet * 0.95 }); }
    }, { lane: 'ACTION', label: (target == null ? 'front' : typeof target === 'string' ? Score.short(target) : 'a point') + (o.label ? ': ' + o.label : ''), params: { target: typeof target === 'string' ? target : null } });
  }
  /* a look that stays on a moving target: re-aimed every `every` seconds from t0 to t1 */
  function track(id, target, t0, t1, why, o = {}) { const out = []; for (let t = t0; t < t1 - 0.05; t += o.every || 0.5) { const e = look(id, target, t, why, { ...o, overshoot: false, dip: false, speed: 0.7, kind: 'TRACK', walking: true }); if (e) out.push(e); } return out; }

  /* ── the context the intents write through ── */
  const X = { M, S, A, θ, sid, T, B, ids, H, aff, scale, stud, at, bpose, where, relBearing, settled, baseOf, sheet, E, ev, stim, because, lat, move, look, track, props, rigs, notes, rng: s => rng(sid + '|' + s), q, r3, cl, sm, lerp, wrap, F,
    after: fn => solvers.push(fn), busyArms, utter: {}, voiceOf: c => voiceOf(M, c),
    /* an intent's amplitude: the compiler's amp x the intent's own params.amp */
    ampOf: I => ((I && I.params && I.params.amp) || 1),   /* the intent's own amplitude; the compiler's amp is applied to every expressive move */
    /* the exits an afraid actor looks to first: the scene's objects of kind door */
    exits: () => Object.entries(S.objects || {}).filter(([, o]) => o.kind === 'door' || o.exit).map(([k]) => k),
    /* creatures (film-readymades/creatures.js): a giant, a ram, Scylla as an actor of the sheet's `creatures`; a creature's moves are
       procedures (gait, heavy, grope, reach, strike, herd, preset) or keys, each an ACTION event with its causes, like a figure's */
    creatures, creature: (id, kind, o = {}) => { if (!creatures[id]) Object.assign(creatures, Creatures.fragment(id, kind, o)); return creatures[id]; },
    cmove: (id, kind, why, spec, o = {}) => { const Cr = creatures[id]; if (!Cr) { notes.push('no creature ' + id); return null; } let t0 = spec.from, t1 = spec.to; const chs = new Set();
      if (spec.proc) { Cr.procs.push(spec.proc); t0 = spec.proc.from != null ? spec.proc.from : 0; t1 = spec.proc.to != null ? spec.proc.to : T; for (const c of CPROC[spec.proc.type] || []) chs.add(c); if (spec.proc.type === 'preset') for (const c of Object.keys(Creatures.define(Cr.kind).preset(spec.proc.name) || {})) chs.add(c); }
      for (const [ch, K] of Object.entries(spec.keys || {})) { if (!K.length) continue; const L = Cr.channels[ch] || (Cr.channels[ch] = []); for (const k of K) { while (L.length && L[L.length - 1][0] > k[0] + 1e-6) L.pop(); L.push([r4(k[0]), r4(k[1])].concat(k[2] ? [k[2]] : [])); }
        chs.add(ch.split('@')[0]); t0 = Math.min(t0 != null ? t0 : 1e9, K[0][0]); t1 = Math.max(t1 != null ? t1 : -1e9, K[K.length - 1][0]); }
      for (const R of spec.riders || []) { Cr.riders.push(R); chs.add('rider'); }
      const lanes = [...new Set([...chs].map(creatureLane).filter(Boolean))];
      return ev({ lane: 'ACTION', actor: id, t0: r3(t0), t1: r3(t1), kind, label: o.label || '', because: because(why).map(b => { const c = E.get(b.id); return c ? { id: c.id, latency: r3(t0 - c.t0), rel: b.rel || (t0 < c.t0 - 1e-6 ? 'anticipates' : undefined) } : b; }), layer: 'creature', lanes, params: o.params }); } };

  /* 1. VOICE: every clip on the clock; a spoken line is an UTTERANCE {speaker, addressee, phrases, stress, speech_act, affect, goal} */
  const clips = (M.clips || []).filter(c => c.kind !== 'SCENE_HEADER' && c.kind !== 'SPEAKER_CUE');
  const goals = A.goals || {};
  for (const c of clips) {
    const spoken = c.kind === 'DIALOGUE', V = voiceOf(M, c), who = c.voice || c.speaker || null;
    const act = SPEECH_ACT[c.act] || (spoken ? 'SPEAK' : 'NARRATE');
    const u = ev({ id: 'v' + c.gi, lane: 'VOICE', actor: spoken ? who : null, t0: c.at, t1: c.at + c.dur, kind: spoken ? 'UTTERANCE' : 'NARRATION', label: '"' + String(c.caption).slice(0, 90) + (c.caption.length > 90 ? '..."' : '"'),
      params: { speaker: who, addressee: c.addressee, speech_act: act, affect: (M.beat && c.gi === M.keyGi) ? M.beat.emotion : (A.affect && A.affect[who]) || null, goal: goals[c.gi] || goals[who] || null,
        phrases: V.phrases.map(p => [r3(p.t0), r3(p.t1)]), stresses: V.stresses.map(s => r3(s.t)), words: V.words.map(w => [w.w, r3(w.t), w.stress ? 1 : 0]) } });
    X.utter[c.gi] = { ev: u, c, V };
    if (spoken) V.phrases.forEach((p, i) => ev({ id: 'v' + c.gi + 'p' + (i + 1), lane: 'VOICE', actor: who, t0: p.t0, t1: p.t1, kind: 'PHRASE', label: String(i + 1), because: [{ id: u.id, latency: r3(p.t0 - u.t0) }], derived: true }));
  }
  /* the camera lane's requests (a patch's: follow the causal hot spot; elide effects so the audience completes them): recorded as
     CAMERA events for the cut; the take's own shot plan is not rewritten by the engine */
  if (A.camera && A.camera.follow) ev({ lane: 'CAMERA', t0: 0, t1: T, kind: 'FOLLOW', label: 'the camera to the causal hot spot (a request to the cut)', derived: false });
  if (A.camera && A.camera.elide) ev({ lane: 'CAMERA', t0: 0, t1: T, kind: 'ELIDE', label: 'cut before effects: the audience completes them (a request to the cut)', derived: false });
  /* the cut: the camera lane (for the media temperature) */
  for (const s of M.cut || []) ev({ lane: 'CAMERA', t0: s.t0, t1: s.t0 + s.dur, kind: s.kind, label: 'shot', derived: true });
  /* the blocking's key windows: the layout pass moves a figure from mark to mark; an authored intent may own that move */
  const keyEv = {};
  for (const K of M.keys) { const e = ev({ lane: 'STIMULUS', t0: K.win ? K.win[0] : K.t, t1: K.win ? K.win[1] : K.t + 0.1, kind: 'BLOCKING', label: K.id + ': ' + String(K.beat).slice(0, 80), derived: true }); keyEv[K.id] = e; }
  X.keyEv = keyEv;
  /* 2. the authored stimuli and intents (and holds), in time order, each realised by its kind */
  const INT = Object.assign({}, require('./intents.js'), require('./intents-action.js'), require('./intents-more.js'), require('./intents-extra.js'));
  for (const s of A.stimuli || []) ev({ ...s, lane: 'STIMULUS', because: because(s.because).map(b => ({ ...b })) });
  const intents = (A.intents || []).concat((A.holds || []).map(h => ({ ...h, kind: 'HOLD' }))).map(I => ({ ...I })).sort((a, b) => a.t0 - b.t0);
  for (const I of intents) ev({ id: I.id, lane: 'INTENT', actor: I.actor, t0: I.t0, t1: I.t1, kind: I.kind, label: I.label || I.reason || '', because: because(I.because).map(b => ({ ...b })), params: I.params, authored: true, target: I.target });
  /* the scene's creatures, placed (a preset over the take's piece box, or at a point), before their intents */
  const INTC = require('./intents-creature.js');
  /* each creature stands on the ground the take finds under it (tools/perform/ground.js); its `floor` goes in the sheet, so the player's
     own ray under the rig corrects it where the set differs (creatures.js sample, ctx.ground) */
  for (const [cid, d] of Object.entries(A.creatures || {})) { const pl = d.at ? { at: d.at, floor: d.floor != null ? d.floor : null } : d.place ? INTC.placeAt(d.kind, d.scale || 1, d.place.preset, { ...d.place, M }) : { at: [0, 0, 0, 0], floor: null };
    X.creature(cid, d.kind, { scale: d.scale || 1, at: pl.at, floor: pl.floor, colour: d.colour, procs: d.procs ? JSON.parse(JSON.stringify(d.procs)) : [] }); if (d.present) creatures[cid].present = d.present.map(w => w.slice()); }
  for (const I of intents) { const f = creatures[I.actor] ? INTC[I.kind] : INT[I.kind]; if (!f) { notes.push('no realiser for ' + (creatures[I.actor] ? 'creature ' : '') + 'intent ' + I.kind + ' (' + I.id + ')'); continue; } f(X, I, E.get(I.id)); }
  /* 3. machinery (clocks, couplings, constraints) the scene declares */
  if (A.machinery) { const Mach = require('./machinery.js'); for (const m of [].concat(A.machinery)) if (Mach[m.kind]) Mach[m.kind](X, m); else notes.push('no machinery ' + m.kind); }
  /* 4. the walks the blocking gives: the body goes with the take's walk (bob, lean), owned by the intent that wants the move */
  for (let j = 1; j < M.keys.length; j++) { const K = M.keys[j]; if (!K.win || !K.moves) continue;
    for (const [id, m] of Object.entries(K.moves)) { if (!m.walk || !ids.includes(id) || (K.snap[id] && B.lying(K.snap[id]))) continue;
      const owner = intents.find(I => I.actor === id && (I.key === K.id || (I.keys || []).includes(K.id))); INT._walkBlocking(X, id, K, owner ? E.get(owner.id) : keyEv[K.id]); } }
  /* 5. breath: every living figure, the whole time, staggered (it keeps a hold alive; it is never counted as a performance by itself) */
  for (const id of ids) { if ((A.noBreath || []).includes(id)) continue; const R = rng(sid + id + 'breath'), P = 3.2 + R() * 1.2; let t = R() * P, up = true;
    const dead = (A.holds || []).filter(h => h.actor === id && /dead|lifeless/.test(h.reason || '')).concat((X.dead || []).filter(d => d.actor === id).map(d => ({ t0: d.t0, t1: 1e9 }))), isDead = t => dead.some(h => t >= h.t0 && t <= h.t1);   /* X.dead: a DIE or DROWN ends the breath */
    const e = ev({ lane: 'WEIGHT', actor: id, t0: 0, t1: T, kind: 'BREATH', label: 'the idle breath', because: [], derived: true, life: true });
    sheet.begin(); while (t < T + P) { const s = at(id, Math.min(T, t)); if (s && !isDead(t)) { const st = !s.sat && !B.lying(s), k = up ? 1 : 0;
      sheet.key(id, 'weight', t, { 'torso.lean': -0.03 * k, 'head.pitch': -0.025 * k, 'hips.dy': st ? 0.7 * k : 0 }, 'inOut'); } t += up ? P * 0.42 : P * 0.58; up = !up; } sheet.end(); void e; }
  sheet.write();
  /* 6. solvers that need the pose the sheet gives (a hand to a spear): run on the sheet as written, their keys added, written again */
  if (solvers.length) { let C0 = finish(); for (const fn of solvers) { fn(X, C0); sheet.write(); C0 = finish(); } }
  /* 7. legality: what the layers ask for, summed, kept inside the toy's joint limits, and hands kept out of the torso and the head
     (tools/perform/metrics.js's part extents), on an @limit layer: the corrections are visible in the sheet and in the score */
  if (opts.legal !== false) legalize(finish());
  return { sheet: finish(), events: E.list, notes, params: θ, machine: X.machine || null };

  function legalize(C0) {
    const bctx0 = Body.context(M, C0), TB = { x: 19, y1: 32, z: 10 }, HB = { x: 13, y0: -25, z: 13 };
    const inv = Body.toLocal;
    const inside = P => { const Fr = Body.frames(P), toT = inv(Fr.torsoP), toH = inv(Fr.headP), out = [];
      for (const sd of ['R', 'L']) { const h = P.pts['hand' + sd], a = toT(h), b = toH(h);
        if (Math.abs(a[0]) < TB.x - 3 && a[1] > 0 && a[1] < TB.y1 && Math.abs(a[2]) < TB.z) out.push(sd); else if (Math.abs(b[0]) < HB.x && b[1] > HB.y0 && b[1] < 0 && Math.abs(b[2]) < HB.z - 2) out.push(sd); } return out; };
    let nClamp = 0, nCol = 0; const lim = {};
    for (const id of ids) { const L = lim[id] = {};
      for (let i = 0; i <= Math.floor(T * F); i++) { const t = i / F, s0 = at(id, t); if (!s0 || !s0.vis) continue; const v = Choreo.sampleActor(C0, id, t) || {}, fix = {};
        for (const [ch, lm] of Object.entries(Choreo.CLAMP)) { if (ch === 'hips.dy' || v[ch] == null) continue; const b = baseOf(id, ch, t), want = b + v[ch], lo = Math.min(lm[0], b), hi = Math.max(lm[1], b);
          if (want < lo - 1e-3) { fix[ch] = lo - want; nClamp++; } else if (want > hi + 1e-3) { fix[ch] = hi - want; nClamp++; } }
        let P = Body.sample(bctx0, id, t, fix), bad = inside(P), k = 0;
        /* a hand inside: the arm's roll opened, then its pitch raised, each only as far as the joint allows */
        const within = (ch, x) => { const lm = Choreo.CLAMP[ch], b = baseOf(id, ch, t), w = b + (v[ch] || 0) + x, lo = Math.min(lm[0], b), hi = Math.max(lm[1], b); return Math.max(lo, Math.min(hi, w)) - b - (v[ch] || 0); };
        while (bad.length && k < 8) { for (const sd of bad) { const o = 'arm.' + sd + '.out', pp = 'arm.' + sd + '.pitch'; fix[o] = within(o, (fix[o] || 0) + 0.1); if (k >= 3) fix[pp] = within(pp, (fix[pp] || 0) - 0.15); } P = Body.sample(bctx0, id, t, fix); bad = inside(P); k++; }
        if (k) nCol++;
        for (const [ch, x] of Object.entries(fix)) (L[ch] = L[ch] || {})[i] = x; } }
    /* the corrections as keys: nonzero drawings, eased to zero a drawing either side */
    sheet.begin(); for (const [id, L] of Object.entries(lim)) for (const [ch, byI] of Object.entries(L)) { const is = Object.keys(byI).map(Number).sort((a, b) => a - b); if (!is.length) continue;
      const keys = new Map(); for (const i of is) { keys.set(i, byI[i]); if (byI[i - 1] == null) keys.set(i - 1, keys.get(i - 1) || 0); if (byI[i + 1] == null) keys.set(i + 1, keys.get(i + 1) || 0); }
      for (const [i, x] of [...keys.entries()].sort((a, b) => a[0] - b[0])) if (i >= 0) sheet.key(id, 'limit', i / F, { [ch]: r4(x) }, 'linear'); }
    sheet.end(); sheet.write();
    notes.push('legality: ' + nClamp + ' joint requests brought inside the limits, ' + nCol + ' drawings with a hand moved out of a torso or head (@limit layer)');
  }

  function finish() {
    /* the director's hand keys (overrides kept from the scene's sheet, e.g. the rig desk's): inside their span the compiler's own keys
       on that channel are faded out, so the director's lane is the channel there (choreo.js sums layers; this keeps it the director's) */
    const ov = opts.overrides || {}, actors = {};
    for (const id of ids) { const Ac = sheet.actors[id]; if (!Ac) continue; const ch = {};
      for (const [k, L] of Object.entries(Ac.channels).sort()) { const keys = L.filter((x, i) => i === 0 || x[0] > L[i - 1][0] - 1e-9); if (keys.some(x => Math.abs(x[1]) > 1e-4)) ch[k] = keys; }   /* a lane that never leaves zero is not written */
      const O = ov[id] || {};
      for (const [ok, OK] of Object.entries(O)) { if (!OK || !OK.length) continue; const base = ok.split('@')[0], a = OK[0][0], b = OK[OK.length - 1][0];
        for (const [k, L] of Object.entries(ch)) { if (k.split('@')[0] !== base) continue;
          const mask = t => t < a - 0.3 || t > b + 0.3 ? 1 : t < a ? (a - t) / 0.3 : t > b ? (t - b) / 0.3 : 0, out = [];
          for (const x of L) if (x[0] < a - 0.3 || x[0] > b + 0.3) out.push(x);
          for (let t = Math.max(0, a - 0.3); t <= b + 0.3 + 1e-6; t += 1 / F) out.push([r4(t), r4(Choreo.sampleKeys(L, t, k) * mask(t)), 'linear']);
          ch[k] = out.sort((x, y) => x[0] - y[0]); } }
      actors[id] = { channels: ch, H: r3(H(id)) }; }
    const C = { format: 'odyssey-choreo/1', scene: sid, clock: M.mode || 'cut', step: 'twos', layer: 'add', total: T,
      generated: { by: 'tools/perform/compile.js', from: 'odyssey/score/' + sid + '.json', note: 'the performance engine\'s body score: every key caused by an intent in the score; hand keys go in overrides' },
      voice: clips.map(c => ({ gi: c.gi, at: r3(c.at), dur: r3(c.dur), kind: c.kind, voice: c.voice, speaker: c.speaker, addressee: c.addressee, caption: c.caption, key: c.gi === M.keyGi })),
      cut: (M.cut || []).map(x => ({ t0: r3(x.t0), dur: r3(x.dur), kind: x.kind })), keys: M.keys.map(k => ({ id: k.id, t: r3(k.t), win: k.win && k.win.map(r3), beat: k.beat })),
      cues: E.list.filter(e => e.lane === 'ACTION' && !e.derived).map(e => ({ t: r3(e.t0), actor: e.actor, what: e.kind.toLowerCase() + (e.label ? ' ' + e.label : '') })).sort((a, b) => a.t - b.t),
      holds: E.list.filter(e => e.lane === 'INTENT' && e.kind === 'HOLD').map(e => ({ actor: e.actor, t0: e.t0, t1: e.t1, why: e.label })),
      notes, actors, props: props.slice().sort((a, b) => a.t - b.t), rigs, overrides: opts.overrides || {} };
    if (Object.keys(creatures).length) C.creatures = JSON.parse(JSON.stringify(creatures));
    Choreo.compile(C); return C;
  }
}
module.exports = { compile, PARAMS, defaults, voiceOf, Sheet, SPEECH_ACT, rng, hash32 };
