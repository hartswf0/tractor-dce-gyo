/* tools/perform/thermo.js — three temperatures, kept separate, and the two measures built on them.

   MOTION HEAT T_m (an activity variable with the form of a temperature; not kelvin, not energy): per actor, the power of its motion,
   P = sum over joints of (lever x angular velocity)^2 + (root speed)^2 + (turn rate x 0.2)^2, lever-weighted in figure heights a second,
   so P is in (heights/s)^2; the actor's T_m integrates P and dissipates it (tau by material). Heat moves between bodies along what
   couples them, by the material of the coupling (a table, stated below and on the page): a grip on a spear, a rope, a ship under its
   riders, a crowd of one group standing close, water under oars, a fire that never cools, stone that does not take heat. The field
   is the nodes' temperatures splatted on the floor (a grid over the set), for the previz's overlay. This is a transparent model of
   how activity spreads through a scene's couplings; it is not a physical simulation of heat.

   CAUSAL HEAT: for each actor a declared set of reachable actions over a 1-3 s horizon (the scene module states them: the actions,
   and a utility for each as a sum of named features of the present state), p = softmax(u / tau), the actor's causal entropy
   S_c = -sum p log2 p (bits). An event's causal heat is the change it causes in the other actors' S_c (0.2 s before -> 0.6 s after):
   negative when it closes their options (a door blocked), positive when it opens them (a table knocked over opens a route). An
   object's causal potential is the probability mass of the actions that use it (the sword on the table glows while nothing moves).

   MEDIA TEMPERATURE (McLuhan's hot and cool media: how much sensory definition the shot gives, how little the audience must complete;
   NOT thermodynamics): per drawing, from the film's cut: whether the hottest thing (motion + causal) is on screen, how large (shot
   scale), and whether cause and effect are both shown or a cut elides one (the audience completes it: cooler).

   THERMAL CONTRAST C_T per drawing: hottest minus ambient (the median) over the figures on stage: drama is contrast, not mean motion.
   A cut is a discontinuity in what is shown hot: recorded per cut. VIABILITY V per drawing: joint requests past the limits, parts
   inside parts, feet sliding, balance lost, a prop jumping between hands (tools/perform/metrics.js), weighted; viable if V < 0.05. */
'use strict';
const Body = require('./body.js'), Metrics = require('./metrics.js'), Choreo = require('../../film-readymades/choreo.js');
const F = 12, r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 1e4) / 1e4;
/* materials: tau (s: how long heat stays), k (conductance to what it touches), source (heat it makes on its own), gain (an excitable
   material passes on more than it takes) */
const MATERIAL = {
  flesh: { tau: 0.6, k: 0.0, source: 0 },
  stone: { tau: 0.05, k: 0.0, source: 0, note: 'inert: takes no heat, gives none' },
  rope: { tau: 0.15, k: 6.0, source: 0, note: 'conducts tension fast' },
  ship: { tau: 2.5, k: 2.5, source: 0, note: 'one rigid body: its riders heat it and it heats them' },
  water: { tau: 0.35, k: 1.2, source: 0, note: 'spreads and damps' },
  fire: { tau: 1e9, k: 0.8, source: 0.6, note: 'a permanent source' },
  crowd: { tau: 0.8, k: 0.7, source: 0, gain: 1.4, note: 'excitable: passes on more than it takes' },
  door: { tau: 0.2, k: 0.0, source: 0, note: 'a binary constraint: conducts when open' },
  wood: { tau: 0.3, k: 3.0, source: 0 }, bronze: { tau: 0.3, k: 3.0, source: 0 }, bone: { tau: 0.1, k: 0.5, source: 0 },
  weapon: { tau: 0.25, k: 8.0, source: 0, note: 'a strong causal conductor: what it touches takes the heat of the hand' },
};
const LEVER = { torsoP: 0.5, headP: 0.12, armRP: 0.3, armLP: 0.3, legRP: 0.3, legLP: 0.3 };

/* the instantaneous motion power of one actor between two drawings */
function power(a, b, H) {
  const dt = 1 / F; let P = 0;
  for (const [k, L] of Object.entries(LEVER)) for (let q = 0; q < 3; q++) { const w = (a.j[k][q] - b.j[k][q]) / dt * L; P += w * w; }
  const v = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]) / H / dt, tr = Body.wrap(a.rot[1] - b.rot[1]) / dt * 0.2, rr = ((a.rot[0] - b.rot[0]) + (a.rot[2] - b.rot[2])) / dt * 0.8, hy = (a.hipsDy - b.hipsDy) * a.scale / H / dt;
  return P + v * v + tr * tr + rr * rr + hy * hy;
}

/* ═════ the causal model: features of the present state, utilities declared per scene ═════ */
function causalModel(Tr, S, me, ev) {
  const decl = (S.authored && S.authored.causal) || null; if (!decl) return null;
  /* the action-selection horizon (s, the compiler's parameter): a longer horizon brings farther things within reach and flattens
     the choice (tau scales with it) */
  const hz = ((S.params && S.params.horizon) || 2) / 2, { frames, ids, H, n } = Tr, tau = (decl.tau || 1) * hz, E = ev || [];
  const props = t => Choreo.propsAt(Tr.C || { props: [] }, t);
  const intentsAt = (id, t) => E.filter(e => e.lane === 'INTENT' && e.actor === id && t >= e.t0 && t <= e.t1).map(e => e.kind);
  const stimAt = (id, t) => E.find(e => e.id === id && e.t0 <= t);
  const face = (i, x) => { if (Array.isArray(x)) return x.length === 2 ? [x[0], 40, x[1]] : x; const a = frames[i].a[x]; if (a) return a.s.pts.face; const o = (S.objects || {})[x]; if (o && o.at) return o.at.length === 2 ? [o.at[0], 40, o.at[1]] : o.at; if (o && o.holder) { const [w, sd] = o.holder.split(':'); const own = props(i / F).own[o.holder]; const [w2, sd2] = (own || o.holder).split(':'); const b = frames[i].a[w2]; return b ? b.s.pts['hand' + (sd2 || sd || 'R')] : null; } return null; };
  const FEAT = {
    /* dist(x): distance to x in figure heights */
    dist: (i, id, x) => { const a = frames[i].a[id], p = face(i, x); return a && p ? Math.hypot(a.s.p[0] - p[0], a.s.p[2] - p[2]) / H(id) : 99; },
    /* near(x, r): 1 inside r heights, falling to 0 at 2r */
    near: (i, id, x, r = 1.5) => { const d = FEAT.dist(i, id, x); return Math.max(0, Math.min(1, 2 - d / (r * hz))); },
    /* sees(x): 1 when x is on the gaze line, 0 behind */
    sees: (i, id, x) => { const a = frames[i].a[id], p = face(i, x); if (!a || !p) return 0; const g = a.s.pts.gaze, d = [p[0] - a.s.pts.face[0], p[1] - a.s.pts.face[1], p[2] - a.s.pts.face[2]], dn = Math.hypot(...d) || 1; return Math.max(0, (g[0] * d[0] + g[1] * d[1] + g[2] * d[2]) / dn); },
    seated: (i, id, x) => { const a = frames[i].a[x || id]; return a && a.s.sat ? 1 : 0; },
    walking: (i, id, x) => { const a = frames[i].a[x || id]; return a && (a.s.walk > 0.2 || (i > 0 && frames[i - 1].a[x || id] && Math.hypot(a.s.p[0] - frames[i - 1].a[x || id].s.p[0], a.s.p[2] - frames[i - 1].a[x || id].s.p[2]) > 0.02 * H(x || id))) ? 1 : 0; },
    /* holds(prop): 1 if the actor holds it now (the props' state at t) */
    holds: (i, id, prop) => { const o = (S.objects || {})[prop]; if (!o || !o.holder) return 0; const own = props(i / F).own[o.holder] || o.holder; return own.split(':')[0] === id ? 1 : 0; },
    /* intent(kind): 1 while the actor's intent of that kind is active */
    intent: (i, id, kind) => intentsAt(id, i / F).includes(kind) ? 1 : 0,
    /* after(stimulus id): 1 once it has happened (a phase of the scene) */
    after: (i, id, sid) => stimAt(sid, i / F) ? 1 : 0,
    /* threat(x): the heat of x's motion, discounted by distance over the threat distance */
    threat: (i, id, x) => { const d = FEAT.dist(i, id, x), T = me.T[x] ? me.T[x][i] : 0; return T / (1 + d / ((S.params && S.params.threat) || 1.5)); },
    /* speaking(x) */
    speaking: (i, id, x) => (Tr.M.clips || []).some(c => c.kind === 'DIALOGUE' && c.voice === (x || id) && i / F >= c.at && i / F <= c.at + c.dur) ? 1 : 0,
    /* open(door): the door's state from SET events (default open) */
    open: (i, id, door) => { const last = E.filter(e => e.lane === 'SET/VEHICLE' && e.label && e.params && e.params.door === door && e.t0 <= i / F).pop(); return last ? (last.params.open ? 1 : 0) : 1; },
    one: () => 1,
  };
  const out = { actions: decl.actions, tau, S: {}, P: {}, potential: {} };
  for (const [id, acts] of Object.entries(decl.actions)) { if (!ids.includes(id)) continue; const Sx = new Float32Array(n), Px = [];
    for (let i = 0; i < n; i++) { if (!frames[i].a[id]) { Sx[i] = NaN; Px.push(null); continue; }
      const u = acts.map(a => (a.base || 0) + Object.entries(a.f || {}).reduce((s, [k, w]) => { const [fn, ...arg] = k.split(':'); const f = FEAT[fn]; return s + (f ? w * f(i, id, ...arg.map(x => isNaN(+x) ? x : +x)) : 0); }, 0));
      const mx = Math.max(...u), ex = u.map(x => Math.exp((x - mx) / tau)), z = ex.reduce((a, b) => a + b, 0), p = ex.map(x => x / z);
      Sx[i] = -p.reduce((s, x) => s + (x > 0 ? x * Math.log2(x) : 0), 0); Px.push(p); }
    out.S[id] = Sx; out.P[id] = Px; }
  /* objects' causal potential: the mass of the actions that use them */
  for (const [oid, o] of Object.entries(S.objects || {})) { const pot = new Float32Array(n);
    for (const [id, acts] of Object.entries(decl.actions)) { if (!out.P[id]) continue; acts.forEach((a, k) => { if ((a.uses || []).includes(oid)) for (let i = 0; i < n; i++) if (out.P[id][i]) pot[i] += out.P[id][i][k]; }); }
    out.potential[oid] = pot; }
  return out;
}

/* ═════ the whole measure ═════ */
function thermo(Tr, S, o = {}) {
  const { frames, ids, H, n, M } = Tr, E = o.events || S.events || [], θ = Object.assign({ camera: 1, affordance: 0.7, env: 1 }, S.params || {});
  /* 1. motion power and T_m per actor, then conduction through couplings */
  const P = {}, T = {};
  for (const id of ids) { const p = new Float32Array(n); for (let i = 1; i < n; i++) { const a = frames[i].a[id], b = frames[i - 1].a[id]; if (a && b) p[i] = power(a.s, b.s, H(id)); } P[id] = p; }
  const objs = S.objects || {}, nodes = [...ids, ...Object.keys(objs)], idx = new Map(nodes.map((x, i) => [x, i])), mat = x => objs[x] ? (MATERIAL[objs[x].material] || MATERIAL.wood) : MATERIAL.flesh;
  const group = id => ((S.actors || {})[id] || {}).group;
  /* edges at drawing i: [a, b, k] */
  function edges(i) { const out = [], t = i / F, own = Choreo.propsAt(Tr.C || { props: [] }, t).own;
    for (const [oid, ob] of Object.entries(objs)) { if (ob.holder) { const h = own[ob.holder] || ob.holder, who = h.split(':')[0]; if (ids.includes(who)) out.push([who, oid, mat(oid).k || 3]); }
      for (const w of ob.touches || []) if (ids.includes(w) || objs[w]) out.push([w, oid, mat(oid).k || 1]); }
    for (const c of (S.authored && S.authored.couplings) || []) if ((c.t0 == null || t >= c.t0) && (c.t1 == null || t <= c.t1)) out.push([c.from, c.to, (c.k != null ? c.k : (MATERIAL[c.via] || MATERIAL.wood).k) * (c.env ? θ.env : 1)]);
    for (const e of E) if (e.lane === 'CONTACT' && t >= e.t0 && t <= e.t1 && e.actors) for (let a = 0; a < e.actors.length; a++) for (let b = a + 1; b < e.actors.length; b++) out.push([e.actors[a], e.actors[b], e.params && e.params.k || 4]);
    /* a crowd: one group, standing close, excites itself */
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) { const A = ids[a], B = ids[b]; if (!group(A) || group(A) !== group(B)) continue; const x = frames[i].a[A], y = frames[i].a[B]; if (!x || !y) continue; if (Math.hypot(x.s.p[0] - y.s.p[0], x.s.p[2] - y.s.p[2]) < 3 * H(A)) out.push([A, B, MATERIAL.crowd.k]); }
    for (const R of Object.values((Tr.C && Tr.C.rigs) || {})) if (R.riders && objs.ship) for (const r of R.riders) out.push([r, 'ship', MATERIAL.ship.k]);
    return out; }
  const Tn = nodes.map(() => new Float32Array(n)), cur = new Float64Array(nodes.length), sub = 4, dt = 1 / F / sub;
  for (let i = 0; i < n; i++) { const E_ = edges(i);
    for (let s = 0; s < sub; s++) { const d = new Float64Array(nodes.length);
      nodes.forEach((x, k) => { const m = mat(x); const src = ids.includes(x) ? P[x][i] : (m.source || 0) * (objs[x] && objs[x].sourceGain != null ? objs[x].sourceGain : 1) * θ.env; d[k] += src - cur[k] / (m.tau || 0.6); });
      for (const [a, b, k] of E_) { const ia = idx.get(a), ib = idx.get(b); if (ia == null || ib == null) continue; const f = k * (cur[ia] - cur[ib]); const ga = mat(a).gain || 1, gb = mat(b).gain || 1; d[ib] += f * (f > 0 ? gb : 1); d[ia] -= f * (f < 0 ? ga : 1); }
      nodes.forEach((x, k) => { cur[k] = Math.max(0, cur[k] + d[k] * dt); if (mat(x).tau < 0.1 && !ids.includes(x)) cur[k] = 0; }); }
    nodes.forEach((x, k) => { Tn[k][i] = cur[k]; }); }
  nodes.forEach((x, k) => { T[x] = Tn[k]; });
  /* 2. causal entropy, and the causal heat of events */
  const me = { T }, CM = causalModel(Tr, S, me, E);
  const Sc = CM ? CM.S : {};
  const Tc = new Float32Array(n);   /* causal change rate: sum over actors of |dS/dt| (bits/s), smoothed over 0.25 s */
  if (CM) { const k = Math.max(1, Object.keys(Sc).length); for (const [id, Sx] of Object.entries(Sc)) for (let i = 1; i < n; i++) if (isFinite(Sx[i]) && isFinite(Sx[i - 1])) Tc[i] += Math.abs(Sx[i] - Sx[i - 1]) * F / k; for (let i = 1; i < n; i++) Tc[i] = Tc[i - 1] * 0.67 + Tc[i] * 0.33; }
  const eventHeat = {};
  /* an event's causal heat: the change in the entropy of those who can perceive it (on their gaze line, or within three heights, or a
     sound, or the scene itself), 0.2 s before to 0.6 s after its onset, each weighted by how well they perceive it; the idle life of a
     hold (its looks, its weight shifts, the breath) is not credited */
  const IDLE = new Set(['LOOK', 'TRACK', 'WEIGHT SHIFT', 'GRIP', 'BREATH', 'NOD', 'LOOK FRONT', 'FACE THE WAY']);
  const byId = new Map(E.map(e => [e.id, e])), fromHold = e => (e.because || []).some(b => { const c = byId.get(b.id); return c && c.kind === 'HOLD'; });
  for (const e of E) { if (!['INTENT', 'ACTION', 'STIMULUS', 'CONTACT', 'PROP'].includes(e.lane) || (e.derived && e.lane !== 'PROP') || (e.lane === 'ACTION' && (IDLE.has(e.kind) || fromHold(e))) || e.kind === 'HOLD' || e.kind === 'BLOCKING') continue; const i0 = Math.round(e.t0 * F);
    const tm = e.actor && T[e.actor] ? mean(T[e.actor], i0, Math.round(e.t1 * F)) : 0;
    let dS = 0, dSabs = 0; const who = [];
    if (CM) for (const [id, Sx] of Object.entries(Sc)) { if (id === e.actor) continue; const me2 = frames[Math.min(n - 1, i0)].a[id], src = e.actor && frames[Math.min(n - 1, i0)].a[e.actor];
      let w = 1; if (me2 && src && !/SOUND/.test(e.kind)) { const g = me2.s.pts.gaze, d = [src.s.pts.face[0] - me2.s.pts.face[0], src.s.pts.face[1] - me2.s.pts.face[1], src.s.pts.face[2] - me2.s.pts.face[2]], dn = Math.hypot(...d) || 1, c = (g[0] * d[0] + g[1] * d[1] + g[2] * d[2]) / dn, near = Math.hypot(d[0], d[2]) / H(id);
        w = Math.max(near < 3 ? 1 - near / 3 : 0, Math.max(0, (c - 0.5) / 0.5)); }
      if (w <= 0) continue; const a = Sx[Math.max(0, i0 - 2)], b = Sx[Math.min(n - 1, i0 + 7)]; if (isFinite(a) && isFinite(b)) { dS += w * (b - a); dSabs += w * Math.abs(b - a); if (w * Math.abs(b - a) > 0.05) who.push(id); } }
    eventHeat[e.id] = { Tm: r3(tm), Tc: r3(dSabs), dS: r3(dS), on: who.slice(0, 6) }; }
  /* 3. media temperature from the cut */
  const Tmedia = new Float32Array(n), hot = new Array(n).fill(null), cuts = [];
  const causal = E.filter(e => (e.because || []).some(b => { const c = E.find(x => x.id === b.id); return c && c.actor && e.actor && c.actor !== e.actor; }));
  for (let i = 0; i < n; i++) { const fr = frames[i]; let best = null, bv = -1;
    for (const id of ids) { const a = fr.a[id]; if (!a) continue; const v = T[id][i] + (CM && Sc[id] && i > 0 && isFinite(Sc[id][i]) && isFinite(Sc[id][i - 1]) ? Math.abs(Sc[id][i] - Sc[id][i - 1]) * F * 0.5 : 0); if (v > bv) { bv = v; best = id; } }
    hot[i] = best; const a = best ? fr.a[best] : null, size = a && a.on ? Math.min(1, (a.size || 0) / 0.8 / θ.camera) : 0, shown = a ? (a.on == null ? 1 : a.on ? 1 : 0) : 0;
    /* a cause and its effect: both inside this shot, or split by a cut (the audience completes the link) */
    const shotId = fr.cam && fr.cam.shot, t = i / F; let elided = 0, links = 0;
    for (const e of causal) { if (t < e.t0 || t > e.t0 + 1.0) continue; for (const b of e.because) { const c = E.find(x => x.id === b.id); if (!c || !c.actor || c.actor === e.actor) continue; links++; const ic = Math.max(0, Math.min(n - 1, Math.round(c.t0 * F))); const sc = frames[ic].cam && frames[ic].cam.shot; if (sc !== shotId) elided++; } }
    const spec = links ? 1 - elided / links : 1;
    Tmedia[i] = 0.45 * size + 0.35 * shown + 0.2 * spec;
    if (i > 0 && frames[i - 1].cam && fr.cam && frames[i - 1].cam.shot !== fr.cam.shot) cuts.push({ t: r3(t), from: frames[i - 1].cam.shot, to: fr.cam.shot, hotBefore: hot[i - 1], hotAfter: best }); }
  /* 4. contrast and viability */
  const CT = new Float32Array(n), Tmean = new Float32Array(n), V = new Float32Array(n), viol = o.viol || null;
  for (let i = 0; i < n; i++) { const xs = ids.filter(id => frames[i].a[id]).map(id => T[id][i]).sort((a, b) => a - b); if (!xs.length) continue; const med = xs[xs.length >> 1]; CT[i] = xs[xs.length - 1] - med; Tmean[i] = xs.reduce((a, b) => a + b, 0) / xs.length; if (viol) V[i] = viol[i] / Math.max(1, xs.length); }
  for (const c of cuts) { const i = Math.round(c.t * F); c.dT = r3((CT[i] || 0) - (CT[Math.max(0, i - 1)] || 0)); c.transfer = c.hotBefore !== c.hotAfter; }
  /* 5. the field: nodes splatted on a floor grid over the set, one grid a second */
  const box = (M.pieces || []).filter(p => /floor|plate|sea|stage/.test(p.label)).map(p => p.box)[0] || [-300, 0, -300, 300, 10, 300], G = 24, field = [];
  for (let i = 0; i < n; i += F) { const g = new Float32Array(G * G);
    for (const id of ids) { const a = frames[i].a[id]; if (!a) continue; addBlob(g, G, box, a.s.p[0], a.s.p[2], T[id][i], 0.6 * H(id)); }
    for (const [oid, ob] of Object.entries(objs)) { const p = ob.at; if (!p) continue; const k = idx.get(oid); addBlob(g, G, box, p[0], p.length === 2 ? p[1] : p[2], Tn[k][i] + (CM && CM.potential[oid] ? CM.potential[oid][i] * θ.affordance : 0), 40); }
    field.push(Array.from(g, v => Math.round(Math.min(255, v * 40)))); }
  return { P, T, Sc, Tc, Tmedia, CT, Tmean, V, eventHeat, cuts, hot, field: { box: [box[0], box[2], box[3], box[5]], G, every: 1, frames: field }, causal: CM ? { tau: CM.tau, actions: CM.actions, potential: Object.fromEntries(Object.entries(CM.potential).map(([k, v]) => [k, Array.from(v, r3)])) } : null,
    materials: MATERIAL, nodes };
}
function addBlob(g, G, box, x, z, v, sig) { if (!(v > 0)) return; const [x0, , z0, x1, , z1] = box, sx = (x1 - x0) / G, sz = (z1 - z0) / G;
  for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) { const cx = x0 + (c + 0.5) * sx, cz = z0 + (r + 0.5) * sz, d2 = ((cx - x) ** 2 + (cz - z) ** 2) / (2 * sig * sig); if (d2 < 9) g[r * G + c] += v * Math.exp(-d2); } }
function mean(a, i0, i1) { let s = 0, k = 0; for (let i = Math.max(0, i0); i <= Math.min(a.length - 1, i1); i++) { s += a[i]; k++; } return k ? s / k : 0; }

/* the four essential variables of the homeostat, from a measure: H1 MOTION (mean T_m over the figures on stage), H2 CAUSAL VARIETY
   (the causal change rate per actor, bits/s), H3 CONTRAST (mean C_T), H4 VIABILITY (mean V); each also as a smoothed series (the
   needles, 12 a second) */
function essentials(th) {
  const n = th.Tmean.length, sm = (a, k) => { const o = new Float32Array(n); let v = 0; for (let i = 0; i < n; i++) { v = v * (1 - k) + (a[i] || 0) * k; o[i] = v; } return o; };
  const avg = a => { let s = 0; for (let i = 0; i < n; i++) s += a[i] || 0; return s / Math.max(1, n); };
  return { H1: r4(avg(th.Tmean)), H2: r4(avg(th.Tc)), H3: r4(avg(th.CT)), H4: r4(avg(th.V)),
    series: { H1: Array.from(sm(th.Tmean, 0.08), r3), H2: Array.from(sm(th.Tc, 0.08), r3), H3: Array.from(sm(th.CT, 0.08), r3), H4: Array.from(sm(th.V, 0.2), r4) } };
}
module.exports = { thermo, essentials, causalModel, power, MATERIAL };
