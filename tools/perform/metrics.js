/* tools/perform/metrics.js — what a performance does on screen, drawing by drawing: not "does it move" but "does its state change,
   and for a reason".

   The track: every figure at every drawing (12 a second, the sheet's twos), posed by tools/perform/body.js exactly as the take poses
   it (blocking + the sheet's layers, forward kinematics on the film's pivot tree), and whether it is on screen through the film's own
   shot camera at that drawing (odyssey/score/cameras/<scene>.json, or the rig desk's odyssey/cascade/assets/rig/<scene>/cameras.json).

   Per actor per drawing, one state:
     ACTION      the body materially changes: any of the seven body points (face, crown, chest, hands, feet) moves more than A = 1%
                 of the figure's height since the drawing before, or the root travels
     REACTION    a readable change (the gaze turning toward it, or an action begun while it is in view) within 1.2 s of a stimulus from
                 someone or something else: a phrase spoken, another's action begun, a prop given or set down, a sound in the score
     ALIVE_HOLD  largely still, but alive: inside an authored HOLD(reason); or its attention is on something active (a speaker, an
                 action); or its last motivated state change (an action begun or ended, a reaction, the gaze moving to a new target, a
                 phrase of its own) was within GRACE = 2 s
     DEAD        none of these: the same body, gaze, weight and relation to the action, and no one chose the stillness
   Breath alone keeps nothing alive past GRACE: that is the failure the metric exists to find (a figure left on the stage).
   Reports: PERFORMANCE COVERAGE (share of on-screen drawings in ACTION | REACTION | ALIVE_HOLD), LITERAL MOVEMENT (ACTION |
   REACTION), UNMOTIVATED FREEZE (the longest DEAD run), UNMOTIVATED ACTION (action spans with no cause: no score event, no cue of the
   old engine, no stimulus it answers, no blocking move, no line of its own), REACTION LATENCY, GESTURE DENSITY (arm gestures per
   spoken phrase), CHANNEL DIVERSITY (entropy of change across root, weight, torso, head, arms, hands, legs), CONTACT INTEGRITY (feet
   sliding, hands apart at a handoff, a constraint left), POSE LEGALITY (the sheet asking past CLAMP, a hand inside the torso or head,
   two figures inside each other: part extents from the LDraw files, tools/forage/product/ldbox.py). */
'use strict';
const fs = require('fs'), path = require('path');
const Body = require('./body.js'), Choreo = require('../../film-readymades/choreo.js');
const ROOT = path.resolve(__dirname, '..', '..');
const F = 12, A_THRESH = 0.010, MICRO = 0.003, GRACE = 2.0, REACT_WIN = 1.2, r3 = v => Math.round(v * 1000) / 1000;
const GROUPS = { ROOT: ['root'], WEIGHT: ['hips', 'rootrot'], TORSO: ['torsoP'], HEAD: ['headP'], ARMS: ['armRP', 'armLP'], HANDS: ['hand'], LEGS: ['legRP', 'legLP'] };
/* the minifig's part extents (LDraw units, ldbox.py): torso 973, head 3626b, hand 3820 */
const TORSO_BOX = { x: 19, y0: 0, y1: 32, z: 10 }, HEAD_BOX = { x: 13, y0: -25, y1: 0, z: 13 }, HAND_R = 6;

/* ═════ cameras ═════ */
function camerasOf(sid) {
  const mine = path.join(ROOT, 'odyssey/score/cameras', sid + '.json'), desk = path.join(ROOT, 'odyssey/cascade/assets/rig', sid, 'cameras.json');
  if (fs.existsSync(mine)) { const C = JSON.parse(fs.readFileSync(mine, 'utf8')), out = []; let k = 0;
    for (let i = 0; i < C.drawings; i++) { while (k + 1 < C.runs.length && C.runs[k + 1].i <= i) k++; out.push({ ...C.runs[k], aspect: C.aspect }); } return out; }
  if (fs.existsSync(desk)) return JSON.parse(fs.readFileSync(desk, 'utf8')).cams;
  return null;
}
function projector(cam) {
  if (!cam || !cam.pos) return null; const d = cam.dir, u0 = cam.up, n = Math.hypot(...d);
  const f = d.map(x => x / n), r = [f[1] * u0[2] - f[2] * u0[1], f[2] * u0[0] - f[0] * u0[2], f[0] * u0[1] - f[1] * u0[0]], rn = Math.hypot(...r) || 1, R = r.map(x => x / rn);
  const U = [R[1] * f[2] - R[2] * f[1], R[2] * f[0] - R[0] * f[2], R[0] * f[1] - R[1] * f[0]], th = Math.tan((cam.fov || 45) * Math.PI / 360), asp = cam.aspect || 16 / 9;
  return p => { const v = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]], z = v[0] * f[0] + v[1] * f[1] + v[2] * f[2]; if (z <= 1e-3) return null;
    return [(v[0] * R[0] + v[1] * R[1] + v[2] * R[2]) / (z * th * asp), (v[0] * U[0] + v[1] * U[1] + v[2] * U[2]) / (z * th), z]; };
}
const shotKind = cam => { const s = String(cam && cam.shot || ''); return /CLOSE/.test(s) ? 'CLOSE' : /MID/.test(s) ? 'MID' : /WIDE|HEADER/.test(s) ? 'WIDE' : cam && cam.kind === 'OBJ' ? 'CLOSE' : 'MID'; };

/* ═════ the track: every figure at every drawing ═════ */
function track(M, C, o = {}) {
  const ctx = Body.context(M, C), n = Math.floor(M.total * F + 1e-6), cams = o.cams === undefined ? camerasOf(M.scene) : o.cams;
  const ids = ctx.ids, frames = [];
  for (let i = 0; i < n; i++) { const t = i / F, cam = cams ? cams[Math.min(i, cams.length - 1)] : null, P = projector(cam), fr = { i, t, cam: cam ? { shot: cam.shot, kind: shotKind(cam) } : null, a: {} };
    for (const id of ids) { const s = Body.sample(ctx, id, t); if (!s || !s.vis) continue;
      let on = null, size = 0; if (P) { const h = P(s.pts.head), hp = P(s.pts.hips); on = !!((h && Math.abs(h[0]) <= 1 && Math.abs(h[1]) <= 1) || (hp && Math.abs(hp[0]) <= 1 && Math.abs(hp[1]) <= 1));
        const c = P(s.pts.crown), f = P(s.pts.footR); if (c && f) size = Math.abs(c[1] - f[1]) / 2; }
      fr.a[id] = { s, on, size }; }
    frames.push(fr); }
  return { M, C, ctx, ids, frames, n, cams: !!cams, H: id => (M.H && M.H[id]) || 60 };
}

/* the joint-space change of one actor between two poses: per group, lever-weighted (figure heights) */
const LEVER = { torsoP: 0.5, headP: 0.12, armRP: 0.3, armLP: 0.3, legRP: 0.3, legLP: 0.3 };
function jointDelta(a, b, H) {
  const g = { ROOT: Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]) / H + Math.abs(Body.wrap(a.rot[1] - b.rot[1])) * 0.2, WEIGHT: Math.abs(a.hipsDy - b.hipsDy) * a.scale / H + (Math.abs(a.rot[0] - b.rot[0]) + Math.abs(a.rot[2] - b.rot[2])) * 0.8, TORSO: 0, HEAD: 0, ARMS: 0, HANDS: (Math.abs(a.hand.R - b.hand.R) + Math.abs(a.hand.L - b.hand.L)) * 0.05, LEGS: 0 };
  for (const [k, L] of Object.entries(LEVER)) { const d = a.j[k].reduce((s, x, q) => s + Math.abs(x - b.j[k][q]), 0) * L; if (k === 'torsoP') g.TORSO += d; else if (k === 'headP') g.HEAD += d; else if (k[0] === 'a') g.ARMS += d; else g.LEGS += d; }
  return g;
}
const ang = (u, v) => Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])));
const dirTo = (a, b) => { const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], n = Math.hypot(...d) || 1; return d.map(x => x / n); };

/* ═════ the measure ═════ */
function measure(Tr, o = {}) {
  const { M, frames, ids, n, H } = Tr, E = o.events || [], cues = o.cues || [], holdsIn = o.holds || [];
  const byActor = {}; for (const id of ids) byActor[id] = [];
  for (const fr of frames) for (const id of ids) byActor[id].push(fr.a[id] || null);
  /* per drawing signals */
  const sig = {};
  for (const id of ids) { const L = byActor[id], h = H(id), S = sig[id] = { d: new Float32Array(n), gz: new Float32Array(n), grp: [], att: new Array(n).fill(null), vis: new Uint8Array(n), on: new Uint8Array(n) };
    for (let i = 0; i < n; i++) { const x = L[i]; if (!x) continue; S.vis[i] = 1; S.on[i] = x.on == null ? 1 : x.on ? 1 : 0; const y = L[i - 1];
      if (y) { let d = 0; for (const k of Body.DENSITY) { const p = x.s.pts[k], q = y.s.pts[k]; d = Math.max(d, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])); } S.d[i] = d / h; S.gz[i] = ang(x.s.pts.gaze, y.s.pts.gaze); S.grp[i] = jointDelta(x.s, y.s, h); }
      /* attention: the actor whose face lies nearest the gaze line, within 22 degrees */
      let best = null, ba = 0.38; for (const o2 of ids) { if (o2 === id) continue; const z = frames[i].a[o2]; if (!z) continue; const a = ang(x.s.pts.gaze, dirTo(x.s.pts.face, z.s.pts.face)); if (a < ba) { ba = a; best = o2; } } S.att[i] = best; } }
  /* action spans (runs of material change, gaps of one drawing bridged) */
  const act = {}; for (const id of ids) { const S = sig[id], a = new Uint8Array(n); for (let i = 1; i < n; i++) if (S.vis[i] && S.d[i] >= A_THRESH) a[i] = 1;
    for (let i = 1; i < n - 1; i++) if (!a[i] && a[i - 1] && a[i + 1]) a[i] = 1; act[id] = a; }
  const spans = {}; for (const id of ids) { const a = act[id], out = []; let s0 = -1; for (let i = 0; i <= n; i++) { if (i < n && a[i]) { if (s0 < 0) s0 = i; } else if (s0 >= 0) { out.push([s0, i - 1]); s0 = -1; } } spans[id] = out; }
  /* stimuli: phrases spoken, others' actions begun, props, the score's stimuli */
  const stim = [];
  for (const c of M.clips || []) if (c.kind === 'DIALOGUE' && c.voice) { const { voiceOf } = require('./compile.js'); for (const p of voiceOf(M, c).phrases) stim.push({ t: p.t0, src: c.voice, kind: 'phrase', to: c.addressee }); }
  for (const id of ids) for (const [a, b] of spans[id]) { const x = byActor[id][a]; let peak = 0; for (let i = a; i <= b; i++) peak = Math.max(peak, sig[id].d[i]); if (x) stim.push({ t: a / F, src: id, kind: 'action', peak }); }
  for (const p of (Tr.C && Tr.C.props) || []) { const who = (p.from || p.what || '').split(':')[0]; stim.push({ t: p.t, src: who, kind: 'prop:' + p.op }); }
  for (const e of E) if (e.lane === 'STIMULUS' && e.kind !== 'BLOCKING' && e.kind !== 'SCENE') stim.push({ t: e.t0, src: e.actor || null, kind: 'score:' + (e.kind || '').toLowerCase() });
  stim.sort((a, b) => a.t - b.t);
  /* reactions: the first readable change toward a stimulus within the window */
  const react = {}, lats = []; const answered = []; for (const id of ids) react[id] = new Uint8Array(n);
  for (const st of stim) { const i0 = Math.round(st.t * F), srcPos = st.src && frames[Math.min(n - 1, i0)] && frames[Math.min(n - 1, i0)].a[st.src];
    for (const id of ids) { if (id === st.src) continue; const me = byActor[id][Math.min(n - 1, i0)]; if (!me) continue;
      const near = srcPos ? Math.hypot(srcPos.s.p[0] - me.s.p[0], srcPos.s.p[2] - me.s.p[2]) / H(id) : 0; if (srcPos && near > 12 && st.to !== id) continue;
      /* another's action is a stimulus when it is big (the root travels, or a body point moves 3% of a height in a drawing) and in
         view or close; a reaction to it must turn toward it */
      const big = st.kind !== 'action' || (st.peak || 0) >= 3 * A_THRESH;
      const salient = big && (st.kind !== 'action' || (srcPos && ang(me.s.pts.gaze, dirTo(me.s.pts.face, srcPos.s.pts.face)) < 1.1) || near < 2.5);
      if (!salient) continue;
      let hit = -1; const a0 = srcPos ? ang(me.s.pts.gaze, dirTo(me.s.pts.face, srcPos.s.pts.face)) : null;
      for (let i = i0 + 1; i <= Math.min(n - 1, i0 + Math.round(REACT_WIN * F)); i++) { const x = byActor[id][i]; if (!x) break;
        const toward = srcPos && a0 != null && (a0 - ang(x.s.pts.gaze, dirTo(x.s.pts.face, (frames[i].a[st.src] || srcPos).s.pts.face)) > 0.15);
        const onset = st.kind !== 'action' && act[id][i] && !act[id][i - 1] && (!srcPos || ang(x.s.pts.gaze, dirTo(x.s.pts.face, srcPos.s.pts.face)) < 1.1);
        if (toward || onset || (st.src && sig[id].att[i] === st.src && sig[id].att[i - 1] !== st.src)) { hit = i; break; } }
      const important = st.kind === 'phrase' ? (st.to === id || near < 6) : st.kind.startsWith('prop') || st.kind.startsWith('score') ? near < 5 : false;
      if (hit >= 0) { const L = (hit - i0) / F; for (let i = hit; i < Math.min(n, hit + F); i++) { if (i > hit && !act[id][i] && sig[id].gz[i] < 0.02) break; react[id][i] = 1; } if (important) lats.push(L); if (important) answered.push({ t: st.t, id, kind: st.kind, lat: r3(L) }); }
      else if (important) answered.push({ t: st.t, id, kind: st.kind, lat: null }); } }
  /* motivated state changes and the authored holds */
  const holdsOf = id => holdsIn.filter(h => h.actor === id).concat(E.filter(e => e.lane === 'INTENT' && e.kind === 'HOLD' && e.actor === id).map(e => ({ t0: e.t0, t1: e.t1, why: e.label })));
  const speaking = id => (M.clips || []).filter(c => c.kind === 'DIALOGUE' && c.voice === id).map(c => [c.at, c.at + c.dur]);
  const out = { threshold: A_THRESH, grace: GRACE, window: REACT_WIN, actors: {}, stimuli: stim.length };
  const stateOf = {}; let T = { on: 0, A: 0, R: 0, H: 0, h: 0, D: 0 };
  for (const id of ids) { const S = sig[id], a = act[id], r = react[id], hs = holdsOf(id), sp = speaking(id), st = new Array(n).fill('-');
    let lastMSC = -1e9; const inHold = t => hs.some(h => t >= h.t0 - 1e-6 && t <= h.t1 + 1e-6), speak = t => sp.some(([x, y]) => t >= x && t <= y);
    for (let i = 0; i < n; i++) { if (!S.vis[i]) continue; const t = i / F;
      const msc = (a[i] !== a[i - 1]) || (r[i] && !r[i - 1]) || (S.att[i] !== S.att[i - 1] && S.att[i] != null) || S.gz[i] > 0.06 || (speak(t) !== speak(t - 1 / F));
      if (msc) lastMSC = t;
      const attActive = S.att[i] && (act[S.att[i]][i] || speak.call(null, t) || speaking(S.att[i]).some(([x, y]) => t >= x && t <= y));
      st[i] = r[i] ? 'R' : a[i] ? 'A' : inHold(t) ? 'h' : (t - lastMSC <= GRACE || attActive || speak(t)) ? 'H' : 'D'; }
    stateOf[id] = st;
    /* screen time (on-screen drawings; everything if no camera) */
    const on = i => S.vis[i] && S.on[i]; let c = { on: 0, A: 0, R: 0, H: 0, h: 0, D: 0 };
    for (let i = 0; i < n; i++) if (on(i)) { c.on++; c[st[i]]++; }
    let run = 0, worst = 0, worstAt = null, rs = 0; for (let i = 0; i < n; i++) { if (S.vis[i] && st[i] === 'D') { if (!run) rs = i; run++; if (run > worst) { worst = run; worstAt = rs / F; } } else run = 0; }
    /* unmotivated action spans */
    const walkWin = M.keys.filter(k => k.win && k.moves && k.moves[id]).map(k => k.win);
    const mine = E.filter(e => (e.actor === id || (e.actors || []).includes(id)) && !e.life && e.kind !== 'BREATH' && ['ACTION', 'CONTACT', 'ROOT', 'WEIGHT', 'TORSO', 'HEAD', 'GAZE', 'ARM.L', 'ARM.R', 'HAND.L', 'HAND.R', 'LEG.L', 'LEG.R', 'PROP'].includes(e.lane));
    const myCues = cues.filter(q => String(q.actor).split(', ').includes(id));
    let unmot = 0, spanN = 0; const unmotSpans = [];
    for (const [s0, s1] of spans[id]) { const t0 = s0 / F; spanN++;
      const why = r[s0] || mine.some(e => e.t0 <= t0 + 0.25 && e.t1 >= t0 - 0.25) || myCues.some(q => Math.abs(q.t - t0) < 0.6) || walkWin.some(([x, y]) => t0 >= x - 0.3 && t0 <= y + 0.3) || speak(t0) || speak(t0 - 0.3);
      if (!why) { unmot++; unmotSpans.push([r3(t0), r3(s1 / F)]); } }
    /* channel diversity */
    const G = { ROOT: 0, WEIGHT: 0, TORSO: 0, HEAD: 0, ARMS: 0, HANDS: 0, LEGS: 0 }; for (let i = 1; i < n; i++) if (S.grp[i] && S.on[i]) for (const k in G) G[k] += S.grp[i][k];
    const tot = Object.values(G).reduce((x, y) => x + y, 0); let ent = 0; if (tot > 0) for (const v of Object.values(G)) if (v > 0) { const p = v / tot; ent -= p * Math.log(p); }
    out.actors[id] = { onScreen: c.on, share: c.on ? { ACTION: r3(c.A / c.on), REACTION: r3(c.R / c.on), ALIVE_HOLD: r3((c.H + c.h) / c.on), HOLD_AUTHORED: r3(c.h / c.on), DEAD: r3(c.D / c.on) } : null,
      coverage: c.on ? r3((c.A + c.R + c.H + c.h) / c.on) : null, literal: c.on ? r3((c.A + c.R) / c.on) : null, longestDead: r3(worst / F), deadAt: worstAt != null ? r3(worstAt) : null,
      actionSpans: spanN, unmotivatedSpans: unmot, unmotivatedAt: unmotSpans.slice(0, 8), diversity: r3(ent / Math.log(7)), groups: Object.fromEntries(Object.entries(G).map(([k, v]) => [k, r3(v)])) };
    for (const k in T) T[k] += k === 'on' ? c.on : c[k]; }
  /* gesture density: arm gestures (a swing of 0.35 rad or more from where the arm was) begun inside the speaker's phrases */
  const { voiceOf } = require('./compile.js'); let gN = 0, pN = 0; const perLine = [];
  for (const c of (M.clips || []).filter(c => c.kind === 'DIALOGUE' && c.voice && ids.includes(c.voice))) { const id = c.voice, V = voiceOf(M, c); let g = 0;
    for (const ph of V.phrases) { const i0 = Math.round(ph.t0 * F), i1 = Math.round(ph.t1 * F); let ref = null, armed = false;
      for (let i = Math.max(1, i0 - 3); i <= Math.min(n - 1, i1); i++) { const x = byActor[id][i]; if (!x) continue; const v = [x.s.j.armRP[0], x.s.j.armLP[0]];
        if (!ref || !act[id][i]) { ref = v; armed = false; continue; } if (!armed && (Math.abs(v[0] - ref[0]) > 0.35 || Math.abs(v[1] - ref[1]) > 0.35)) { g++; armed = true; } } }
    gN += g; pN += V.phrases.length; perLine.push({ gi: c.gi, speaker: id, phrases: V.phrases.length, gestures: g }); }
  /* contact integrity */
  const contact = { footSlide: 0, footSlideMax: 0, handoffs: [], constraint: [] }, viol = new Float32Array(n);
  for (const id of ids) { const L = byActor[id]; for (let i = 1; i < n; i++) { const x = L[i], y = L[i - 1]; if (!x || !y || x.s.sat || x.s.lying || x.s.walk > 0.05 || y.s.walk > 0.05) continue;
    const legs = Math.abs(x.s.j.legRP[0] - y.s.j.legRP[0]) + Math.abs(x.s.j.legLP[0] - y.s.j.legLP[0]), d = Math.hypot(x.s.p[0] - y.s.p[0], x.s.p[2] - y.s.p[2]) / H(id);
    if (d > 0.004 && legs < 0.02 && !(Tr.C && Tr.C.rigs && Object.values(Tr.C.rigs).some(R => (R.riders || []).includes(id)))) { contact.footSlide++; contact.footSlideMax = Math.max(contact.footSlideMax, d * F); viol[i] += Math.min(1, d * 50); } } }
  for (const p of (Tr.C && Tr.C.props) || []) if (p.op === 'give') { const i = Math.min(n - 1, Math.round(p.t * F)), [ga, gs] = p.from.split(':'), [ra, rs] = p.to.split(':'), g = frames[i].a[ga], r = frames[i].a[ra];
    if (g && r) { const hg = g.s.pts['hand' + (gs || 'R')], hr = r.s.pts['hand' + (rs || 'R')], gap = Math.hypot(hg[0] - hr[0], hg[1] - hr[1], hg[2] - hr[2]); viol[i] += Math.min(3, Math.max(0, gap / H(ra) - 0.05) * 10) + ((gs || 'R') !== (rs || 'R') ? 1 : 0); contact.handoffs.push({ t: p.t, from: p.from, to: p.to, gap: r3(gap), gapH: r3(gap / H(ra)), mirrored: (gs || 'R') !== (rs || 'R') }); } }
  for (const c of o.constraints || []) { let worst = 0; for (let i = 0; i < n; i++) { const x = frames[i].a[c.actor]; if (!x || i / F < c.t0 || i / F > c.t1) continue; const d = Math.hypot(x.s.pts.hips[0] - c.at[0], x.s.pts.hips[2] - c.at[2]); worst = Math.max(worst, d); if (d > (c.tol || 6)) viol[i] += 1; } contact.constraint.push({ actor: c.actor, what: c.what, worst: r3(worst), ok: worst <= (c.tol || 6) }); }
  /* pose legality */
  const legal = { clampRequests: 0, selfCollisions: 0, bodyOverlaps: 0, examples: [] };
  const C = Tr.C;
  for (let i = 0; i < n; i++) { const t = i / F;
    for (const id of ids) { const x = frames[i].a[id]; if (!x) continue;
      if (C && (C.layer || 'abs') === 'add') { const v = Choreo.sampleActor(C, id, t) || {}, s0 = Tr.ctx.B.at(id, t);
        for (const [ch, lim] of Object.entries(Choreo.CLAMP)) { if (v[ch] == null || ch === 'hips.dy') continue; const base = ch.startsWith('arm') ? s0.j['arm' + ch[4] + 'P'][ch.endsWith('out') ? 2 : 0] * (ch.endsWith('out') && ch[4] === 'R' ? -1 : 1) : ch.startsWith('leg') ? s0.j['leg' + ch[4] + 'P'][0] : ch === 'torso.lean' ? s0.j.torsoP[0] : ch === 'head.pitch' ? s0.j.headP[0] : ch === 'head.yaw' ? -s0.j.headP[1] : ch === 'torso.twist' ? -s0.j.torsoP[1] : ch === 'torso.roll' ? -s0.j.torsoP[2] : 0;
          const want = base + v[ch]; if (want < Math.min(lim[0], base) - 0.05 || want > Math.max(lim[1], base) + 0.05) { legal.clampRequests++; viol[i] += 0.25; if (legal.examples.length < 6) legal.examples.push({ t: r3(t), id, ch, asked: r3(want), limit: lim }); } } }
      /* a hand inside the torso or the head (in the torso's and head's own frames) */
      const Fr = Body.frames(x.s), inv = m => { const R = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]], tt = [m[3], m[7], m[11]], s2 = R[0] * R[0] + R[3] * R[3] + R[6] * R[6]; return p => { const d = [p[0] - tt[0], p[1] - tt[1], p[2] - tt[2]]; return [(R[0] * d[0] + R[3] * d[1] + R[6] * d[2]) / s2, (R[1] * d[0] + R[4] * d[1] + R[7] * d[2]) / s2, (R[2] * d[0] + R[5] * d[1] + R[8] * d[2]) / s2]; }; };
      const toT = inv(Fr.torsoP), toH = inv(Fr.headP);
      for (const sd of ['R', 'L']) { const h = x.s.pts['hand' + sd], a = toT(h), b = toH(h);
        if (Math.abs(a[0]) < TORSO_BOX.x - HAND_R * 0.5 && a[1] > TORSO_BOX.y0 && a[1] < TORSO_BOX.y1 && Math.abs(a[2]) < TORSO_BOX.z + HAND_R * 0.5 - 3) { legal.selfCollisions++; viol[i] += 1; if (legal.examples.length < 10) legal.examples.push({ t: r3(t), id, hand: sd, inside: 'torso' }); }
        else if (Math.abs(b[0]) < HEAD_BOX.x && b[1] > HEAD_BOX.y0 && b[1] < HEAD_BOX.y1 && Math.abs(b[2]) < HEAD_BOX.z - 2) { legal.selfCollisions++; viol[i] += 1; if (legal.examples.length < 10) legal.examples.push({ t: r3(t), id, hand: sd, inside: 'head' }); } } }
    /* two figures inside each other: the hips-to-neck segments closer than two torso half-depths */
    const list = ids.filter(id => frames[i].a[id]); for (let p = 0; p < list.length; p++) for (let q = p + 1; q < list.length; q++) { const a = frames[i].a[list[p]].s, b = frames[i].a[list[q]].s;
      const d = segDist(a.pts.hips, a.pts.neck, b.pts.hips, b.pts.neck), lim = 2 * 10 * Math.min(a.scale, b.scale); if (d < lim) { legal.bodyOverlaps++; viol[i] += 1; if (legal.examples.length < 12) legal.examples.push({ t: r3(t), pair: [list[p], list[q]], d: r3(d) }); } } }
  /* the summary, over everyone's screen time */
  const on = T.on || 1, L = lats.slice().sort((x, y) => x - y);
  out.summary = { drawings: n, screenDrawings: T.on, coverage: r3((T.A + T.R + T.H + T.h) / on), literal: r3((T.A + T.R) / on), share: { ACTION: r3(T.A / on), REACTION: r3(T.R / on), ALIVE_HOLD: r3((T.H + T.h) / on), HOLD_AUTHORED: r3(T.h / on), DEAD: r3(T.D / on) },
    unmotivatedFreeze: Math.max(0, ...Object.values(out.actors).map(a => a.longestDead)), unmotivatedFreezeBy: Object.entries(out.actors).sort((a, b) => b[1].longestDead - a[1].longestDead)[0]?.[0] || null,
    unmotivatedAction: r3(Object.values(out.actors).reduce((a, b) => a + b.unmotivatedSpans, 0) / Math.max(1, Object.values(out.actors).reduce((a, b) => a + b.actionSpans, 0))),
    reactionLatency: { median: L.length ? r3(L[L.length >> 1]) : null, p90: L.length ? r3(L[Math.floor(L.length * 0.9)]) : null, answered: answered.filter(x => x.lat != null).length, unanswered: answered.filter(x => x.lat == null).length },
    gestureDensity: pN ? r3(gN / pN) : null, gestures: gN, phrases: pN, perLine, diversity: r3(Object.values(out.actors).reduce((a, b) => a + b.diversity, 0) / Math.max(1, ids.length)),
    contact, legality: legal };
  /* balance: the centre of mass (hips half, chest a third, head the rest) over the feet, for a standing figure not walking */
  let balance = 0; for (let i = 0; i < n; i++) for (const id of ids) { const x = frames[i].a[id]; if (!x || x.s.sat || x.s.lying || x.s.walk > 0.05 || (Tr.C && Tr.C.rigs && Object.values(Tr.C.rigs).some(R => (R.riders || []).includes(id)))) continue;
    const P = x.s.pts, cm = [0, 2].map(k => P.hips[k] * 0.5 + P.chest[k] * 0.3 + P.head[k] * 0.2), a = [P.footR[0], P.footR[2]], b = [P.footL[0], P.footL[2]], ab = [b[0] - a[0], b[1] - a[1]], L2 = ab[0] ** 2 + ab[1] ** 2 || 1, u = Math.max(0, Math.min(1, ((cm[0] - a[0]) * ab[0] + (cm[1] - a[1]) * ab[1]) / L2)), d = Math.hypot(cm[0] - a[0] - ab[0] * u, cm[1] - a[1] - ab[1] * u);
    if (d > 13 * x.s.scale) { balance++; viol[i] += Math.min(1, (d - 13 * x.s.scale) / (8 * x.s.scale)); } }
  out.summary.legality.balance = balance;
  out.viol = Array.from(viol, v => r3(v));
  out.states = Object.fromEntries(Object.entries(stateOf).map(([k, v]) => [k, v.join('')]));
  out.answered = answered.slice(0, 400);
  return out;
}
function segDist(p1, q1, p2, q2) { const d1 = [q1[0] - p1[0], q1[1] - p1[1], q1[2] - p1[2]], d2 = [q2[0] - p2[0], q2[1] - p2[1], q2[2] - p2[2]], r = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r), c = dot(d1, r), b = dot(d1, d2), den = a * e - b * b;
  let s = den > 1e-9 ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0, t = (b * s + f) / (e || 1); if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / (a || 1))); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / (a || 1))); }
  const x = [p1[0] + d1[0] * s - p2[0] - d2[0] * t, p1[1] + d1[1] * s - p2[1] - d2[1] * t, p1[2] + d1[2] * s - p2[2] - d2[2] * t]; return Math.hypot(...x); }
module.exports = { track, measure, camerasOf, projector, shotKind, jointDelta, A_THRESH, GRACE, REACT_WIN, F };
