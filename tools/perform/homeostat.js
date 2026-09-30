/* tools/perform/homeostat.js — the homeostat, after W. Ross Ashby's (Design for a Brain, 1952; 2nd ed. 1960): it never animates.

   Four units watch four essential variables of the compiled scene (tools/perform/thermo.js essentials):
     H1 MOTION           mean motion heat of the figures on stage
     H2 CAUSAL VARIETY   the causal change rate per actor (bits/s)
     H3 CONTRAST         mean thermal contrast (hottest minus ambient)
     H4 VIABILITY        mean viability cost (joint limits, collisions, sliding feet, balance, props jumping hands)
   Each has a preferred band set by the scene's type (dialogue: motion cool, causal warm, contrast warm; fight: motion hot, causal
   very hot, contrast high; revelation: motion near zero, causal very hot, contrast very high; machinery: motion warm, causal warm,
   contrast warm; violations always near zero). When a variable is out of its band, that unit's UNISELECTOR steps: it moves to its
   next position (25 positions, as on Ashby's machine), and each position is a fixed, seeded draw of values for the compiler
   parameters that unit is wired to (its "resistors"). The scene is compiled again with the new parameters and measured again; the
   first configuration that brings all four variables into band is retained. Every attempt is logged: the positions, the values,
   the four readings, which were out. The selection is blind (step functions, not gradients): ultrastability, not optimisation.

   The coupled homeostat (couple()): four units as ODYSSEUS, POLYPHEMUS, CREW, ENVIRONMENT, each a state x_i (a needle, -1..1) with
     tau_i dx_i/dt = -x_i + tanh( sum_j w_ij x_j + u_i(t) )
   w the wiring (each unit's row is its uniselector's position), u_i the score's drives (the wine, the fire, the thrust, the roar).
   When a needle leaves its limits for longer than its dwell, that unit's uniselector steps to a new row of weights and the run
   continues. Disturb one unit and the four find a new stable pattern; the pattern (threshold crossings, levels) is compiled into
   the scene's timings (tools/perform/machinery.js: the Blinding). */
'use strict';
const Compile = require('./compile.js'), Metrics = require('./metrics.js'), Thermo = require('./thermo.js');
const r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 1e4) / 1e4;
const { rng } = Compile;
/* the bands, by the words a director uses; the numbers are this engine's (calibrated on the four proof scenes, stated on the page) */
const WORD = {
  H1: { 'near zero': [0, 0.05], cool: [0.03, 0.12], warm: [0.1, 0.3], hot: [0.3, 0.9], 'very hot': [0.8, 3] },
  H2: { cool: [0, 0.05], warm: [0.04, 0.12], hot: [0.1, 0.25], 'very hot': [0.2, 0.6] },
  H3: { cool: [0, 0.15], warm: [0.15, 0.5], high: [0.45, 1.5], 'very high': [1.2, 5] },
  H4: { zero: [0, 0.02] } };
const TYPES = { dialogue: { H1: 'cool', H2: 'warm', H3: 'warm', H4: 'zero' }, fight: { H1: 'hot', H2: 'very hot', H3: 'high', H4: 'zero' },
  revelation: { H1: 'near zero', H2: 'very hot', H3: 'very high', H4: 'zero' }, machinery: { H1: 'warm', H2: 'warm', H3: 'warm', H4: 'zero' } };
function bandsFor(type) { const w = TYPES[type] || TYPES.dialogue; return Object.fromEntries(Object.entries(w).map(([k, x]) => [k, { word: x, band: WORD[k][x].slice() }])); }
/* each unit's uniselector is wired to these compiler parameters */
const WIRING = { H1: ['amp', 'pause', 'latency', 'focus'], H2: ['horizon', 'affordance', 'attack', 'threat'], H3: ['focus', 'pause', 'amp', 'env', 'camera'], H4: ['separation', 'amp'] };
const POSITIONS = 25;
/* position k of unit u: position 0 is where the scene stands (its current parameters); the rest a seeded draw over each parameter's
   range in 25 levels, as a uniselector's contacts are wired to a random table of resistances */
function position(unit, k, base, seed) { if (k === 0) return Object.fromEntries(WIRING[unit].map(p => [p, base[p]]));
  const R = rng(seed + unit + ':' + k); return Object.fromEntries(WIRING[unit].map(p => { const P = Compile.PARAMS[p], lev = Math.floor(R() * POSITIONS); return [p, r4(P.lo + (P.hi - P.lo) * lev / (POSITIONS - 1))]; })); }

/* compile and measure one configuration */
function evaluate(M, S, params, o = {}) {
  const R = Compile.compile(M, { ...S, params }, { overrides: o.overrides || {} });
  const Tr = Metrics.track(M, R.sheet, { cams: o.cams }), m = Metrics.measure(Tr, { events: R.events });
  const th = Thermo.thermo(Tr, { ...S, params, events: R.events }, { events: R.events, viol: m.viol }), es = Thermo.essentials(th);
  return { R, Tr, m, th, es };
}
const inBand = (v, b) => v >= b[0] && v <= b[1];
function run(M, S, o = {}) {
  const bands = o.bands || S.bands || bandsFor(S.type), base = Object.assign(Compile.defaults(), S.params || {}), seed = o.seed || M.scene;
  const cams = Metrics.camerasOf(M.scene), pos = { H1: 0, H2: 0, H3: 0, H4: 0 }, log = [], max = o.max || 40;
  let best = null;
  for (let n = 0; n < max; n++) {
    const params = { ...base }; for (const u of ['H4', 'H3', 'H2', 'H1']) Object.assign(params, position(u, pos[u], base, seed));   /* H1's wiring wins a shared parameter, then H2, H3 */
    const t0 = Date.now(), ev = evaluate(M, S, params, { overrides: o.overrides, cams }), es = ev.es;
    const out = Object.keys(bands).filter(u => !inBand(es[u], bands[u].band));
    const dist = Object.keys(bands).reduce((a, u) => { const [lo, hi] = bands[u].band, v = es[u]; return a + (v < lo ? (lo - v) / (hi - lo || 1) : v > hi ? (v - hi) / (hi - lo || 1) : 0); }, 0);
    const rec = { n, positions: { ...pos }, params: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, r4(v)])), reading: { H1: es.H1, H2: es.H2, H3: es.H3, H4: es.H4 }, out, distance: r3(dist), ms: Date.now() - t0,
      coverage: ev.m.summary.coverage, freeze: ev.m.summary.unmotivatedFreeze };
    log.push(rec); if (o.say) o.say(rec);
    if (!best || dist < best.rec.distance) best = { rec, ev };
    if (!out.length) return { bands, log, retained: rec, ev, stable: true };
    for (const u of out) pos[u] = (pos[u] + 1) % POSITIONS;   /* each unit whose variable is out steps its own selector */
  }
  return { bands, log, retained: best.rec, ev: best.ev, stable: false };
}

/* ═════ the coupled homeostat: four units, x_i, tau_i dx_i/dt = -x_i + tanh(sum_j w_ij x_j + u_i(t)) ═════ */
function couple(spec, o = {}) {
  const U = spec.units, n = U.length, dt = spec.dt || 1 / 24, T = spec.total, steps = Math.round(T / dt), seed = spec.seed || 'couple';
  let W = spec.W.map(r => r.slice()); const pos = new Array(n).fill(0), log = [], dwell = new Array(n).fill(0);
  const x = U.map(u => u.x0 || 0), X = U.map(() => []), drives = U.map(() => []), stepsAt = [];
  const rowAt = (i, k) => { if (k === 0) return spec.W[i].slice(); const R = rng(seed + ':' + U[i].id + ':' + k); return spec.W[i].map((w, j) => i === j ? w : r3((R() * 2 - 1) * (U[i].range || 1.5))); };
  for (let s = 0; s <= steps; s++) { const t = s * dt;
    const u = U.map(uu => (uu.drive ? uu.drive(t, o.disturb) : 0));
    for (let i = 0; i < n; i++) { let a = u[i]; for (let j = 0; j < n; j++) a += W[i][j] * x[j]; x[i] += dt / U[i].tau * (-x[i] + Math.tanh(a)); }
    if (spec.onStep) spec.onStep(t, x);
    for (let i = 0; i < n; i++) { X[i].push(x[i]); drives[i].push(u[i]);
      /* the essential variable: the needle within its limits (limits may depend on the phase of the scene) */
      const [lo, hi] = U[i].limits(t); if (x[i] < lo || x[i] > hi) dwell[i] += dt; else dwell[i] = 0;
      if (dwell[i] > (U[i].dwell || 0.5) && !o.frozen) { pos[i] = (pos[i] + 1) % POSITIONS; W[i] = rowAt(i, pos[i]); dwell[i] = 0; stepsAt.push({ t: r3(t), unit: U[i].id, position: pos[i], row: W[i].slice(), x: r3(x[i]), limits: [lo, hi] }); } } }
  const hz = Math.round(1 / dt);
  return { units: U.map(u => u.id), hz, x: X.map(a => a.map(r3)), drives: drives.map(a => a.map(r3)), W0: spec.W, W, positions: pos, steps: stepsAt, events: spec.ctx ? JSON.parse(JSON.stringify(spec.ctx)) : null, stable: !stepsAt.length || stepsAt[stepsAt.length - 1].t < T - 3 };
}
module.exports = { run, evaluate, couple, bandsFor, TYPES, WORD, WIRING, POSITIONS, position, inBand };
