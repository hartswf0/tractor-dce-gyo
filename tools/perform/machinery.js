/* tools/perform/machinery.js — the scene machinery the compiler runs beside the intents: shared clocks, couplings and constraints,
   and the coupled homeostat's model of the Blinding.

   blinding(o)  the four-unit coupled homeostat of OD-B09-S09 (tools/perform/homeostat.js couple): the units, their time constants,
                wiring and drives, the phase-dependent limits of their essential variables, and derive(): the needles' threshold
                crossings as the scene's timings (the stake glows, Odysseus decides, the thrust, Polyphemus stirs and wakes, the crew
                breaks or holds, the scatter). Stated in full on the page; the numbers are a director's model, not a physiology.
   ROWING / SIRENS_CHAIN  (compile-time machinery, dispatched by the score's authored.machinery) the rowers' one phase clock with
                per-body offsets, and the Sirens' coupling chain: crew force -> oar -> water -> hull -> ship roll -> mast
                constraint -> rope tension -> Odysseus's torso strain, his head on the Sirens. */
'use strict';
const r3 = v => Math.round(v * 1000) / 1000;
const MACH = {};

/* ═════ the Blinding's coupled homeostat ═════
   x_O ODYSSEUS     resolve: < 0 waits, > 0.62 (with the stake glowing) he decides and the thrust follows the carry
   x_P POLYPHEMUS   arousal: -1 deep in wine, > 0.2 stirring (a groan, a hand moves), > 0.5 awake: the roar
   x_C CREW         fear: > 0.55 before the thrust they would break (drop the stake): out of limits; after the roar > 0.7: scatter
   x_E ENVIRONMENT  the fire and the stake's heat; > 0.6 while heating: the stake glows; the steam at the thrust
   tau_i dx_i/dt = -x_i + tanh( sum_j W_ij x_j + u_i(t) ) */
function blinding(o = {}) {
  const K3 = o.K3 || [38.3, 42.7], carry = o.carry || 4.4, heatAt = o.heatAt || 29.8, sleepAt = o.sleepAt || 23.8;
  const ctx = {}, dist = o.disturb || null;
  const units = [
    { id: 'ODYSSEUS', tau: 0.6, x0: -0.5, range: 1.6, dwell: 0.6,
      drive: (t) => (t < sleepAt ? -0.9 : ctx.roar ? -0.4 : ctx.thrust && t >= ctx.thrust ? 0.8 : t >= heatAt ? 0.15 + 0.036 * (t - heatAt) : 0.15),
      limits: (t) => (!ctx.decide ? [-1, 0.93] : [-1, 1]) },
    { id: 'POLYPHEMUS', tau: 3.0, x0: 0.2, range: 1.0, dwell: 1e9,
      drive: (t) => { let u = t < 18 ? 0.3 : t < 26 ? 0.3 - 2.1 * (t - 18) / 8 : -1.8;
        if (ctx.thrust && t >= ctx.thrust) u += 3.4 * (1 - Math.exp(-(t - ctx.thrust) / 2.5));
        if (ctx.failed && t >= ctx.brokeAt) u += 2.6;   /* the stake dropped in the dark: he wakes, and sees */
        if (dist === 'wake-early' && t >= 33 && t <= 37) u += 3.6;   /* a bowl knocked over in the dark: he stirs */
        return u; },
      limits: () => [-1, 1] },
    { id: 'CREW', tau: 0.45, x0: -0.3, range: 1.8, dwell: 0.5,
      drive: () => 0.3,
      limits: (t) => (t >= heatAt && (!ctx.thrust || t < ctx.thrust + 0.8) ? [-1, 0.55] : [-1, 1]) },   /* while they carry out the plan they must not break */
    { id: 'ENVIRONMENT', tau: 4.0, x0: 0.25, range: 0.8, dwell: 1e9,
      drive: (t) => 0.3 + (t >= heatAt && (!ctx.thrust || t < ctx.thrust) ? 1.0 : 0) + (ctx.thrust && t >= ctx.thrust ? 2.4 * Math.exp(-(t - ctx.thrust) / 2.5) : 0),
      limits: () => [-1, 1] } ];
  /* the wiring: row i = what moves unit i (O, P, C, E) */
  const W = [[0, 0.8, -0.3, 0.9], [0, 0, 0.3, 0.2], [-0.5, 3.2, 0, 0.3], [0.2, 0, 0, 0]];
  /* the events the needles make, watched as the run goes (they change the drives: a decision makes a thrust, a thrust makes pain) */
  function onStep(t, x) {
    const [O, P, C, E] = x;
    if (!ctx.glow && t >= heatAt && E > 0.6) ctx.glow = t;
    if (!ctx.stir && t > sleepAt + 2 && P > 0.2) ctx.stir = t;
    if (!ctx.asleep && t > 18 && P < -0.5) ctx.asleep = t;
    if (!ctx.decide && ctx.glow && O > 0.62 && !ctx.brokeAt) { ctx.decide = t; ctx.thrust = t + carry; }
    if (!ctx.brokeAt && t >= heatAt && (!ctx.thrust || t < ctx.thrust) && C > 0.55) { ctx.breakStart = ctx.breakStart || t; if (t - ctx.breakStart > 0.8) ctx.brokeAt = t; } else if (C <= 0.55) ctx.breakStart = null;
    if (ctx.thrust && t > ctx.thrust && !ctx.roar && P > 0.5) ctx.roar = t;
    if (ctx.roar && !ctx.scatter && !ctx.failed && (C > 0.7 || t > ctx.roar + 2.5)) { ctx.scatter = t; ctx.scatterWhy = C > 0.7 ? 'the crew\'s fear (needle over 0.7)' : 'Odysseus\'s command, 2.5 s after the roar'; }
    /* the crew broke before the thrust: the stake is dropped, the thrust never comes */
    if (ctx.brokeAt && !ctx.failed && (!ctx.thrust || ctx.brokeAt < ctx.thrust)) { ctx.failed = true; ctx.thrustPlanned = ctx.thrust || null; ctx.thrust = null; ctx.scatter = ctx.brokeAt; ctx.scatterWhy = 'the crew broke (fear over 0.55 for 0.8 s before the thrust)'; }
    if (ctx.failed && !ctx.roar && P > 0.5) ctx.roar = t;
  }
  return { units, W, ctx, onStep, total: o.total || 89.4, dt: 1 / 24, seed: 'OD-B09-S09:' + (dist || 'base') };
}
MACH.blinding = blinding;

/* ═════ ROWING: one shared phase clock, per-body offsets (a fraction of the stroke), coordinated labour, not cloned loops ═════
   m {kind:'ROWING', clock: {period, t0, t1}, offsets: {actor: fraction}, amp} */
MACH.ROWING = (X, m) => {
  const P = m.clock.period, t0 = m.clock.t0 || 0, t1 = m.clock.t1 || X.T, clockEv = X.ev({ id: m.id || 'clock:row', lane: 'STIMULUS', t0, t1, kind: 'CLOCK', label: 'the stroke: one clock, period ' + P + ' s', params: { period: P, offsets: m.offsets } });
  for (const [id, off] of Object.entries(m.offsets)) { if (!X.ids.includes(id)) continue; const a = (m.amp || 1);
    const busy = (m.busy || {})[id] || [];
    let n = Math.ceil((t0 - (off * P)) / P) - 1;
    for (let tc = t0 + off * P; tc < t1; tc += P, n++) { if (tc < t0 - 1e-6 || busy.some(([x, y]) => tc + P > x && tc < y)) continue;
      /* catch (arms forward, body forward) -> drive (arms back, body back, legs push) -> finish -> recovery */
      X.move(id, 'mech', 'STROKE', { id: clockEv.id, latency: r3(tc - t0), rel: 'on the clock' }, k => {
        k(tc, { 'arm.R.pitch': { abs: -1.7 * a }, 'arm.L.pitch': { abs: -1.7 * a }, 'torso.lean': 0.22 * a, 'hips.dy': -0.4, 'head.pitch': 0.04 });   /* the catch: arms forward, the body forward */
        k(tc + P * 0.12, { 'arm.R.pitch': { abs: -1.5 * a }, 'arm.L.pitch': { abs: -1.5 * a }, 'torso.lean': 0.12 * a }, 'in');
        k(tc + P * 0.42, { 'arm.R.pitch': { abs: -0.55 * a }, 'arm.L.pitch': { abs: -0.55 * a }, 'torso.lean': -0.16 * a, 'hips.dy': -1.4, 'head.pitch': -0.04 }, 'out');   /* the drive: pulled through */
        k(tc + P * 0.55, { 'arm.R.pitch': { abs: -0.6 * a }, 'arm.L.pitch': { abs: -0.6 * a }, 'torso.lean': -0.14 * a });   /* the finish */
        k(tc + P * 0.99, { 'arm.R.pitch': { abs: -1.65 * a }, 'arm.L.pitch': { abs: -1.65 * a }, 'torso.lean': 0.2 * a, 'hips.dy': -0.4, 'head.pitch': 0.03 });   /* the recovery */
      }, { label: 'stroke ' + (n + 1) + ' (offset ' + (off >= 0 ? '+' : '') + off + ')', params: { phase: r3(off), force: r3(a) }, rigid: true }); }
    X.move(id, 'mech', 'SHIP OARS', clockEv, k => { k(t1, { 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0) }); k(t1 + 0.8, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'hips.dy': 0 }); }, { silent: true }); }
};
/* the crew's summed force on the water at t (a drive-phase profile per body, on the shared clock) */
function crewForce(m, t) { const P = m.clock.period; let F = 0; for (const off of Object.values(m.offsets)) { const u = ((t - (m.clock.t0 || 0)) / P - off) % 1, v = u < 0 ? u + 1 : u; if (v >= 0.12 && v <= 0.45) F += Math.sin(Math.PI * (v - 0.12) / 0.33); } return F; }
MACH.crewForce = crewForce;

/* ═════ the Sirens' coupling chain ═════
   m {kind:'SIRENS_CHAIN', rowing (the ROWING spec), ship: {piece, pivot, riders, pitchK, rollK, heaveK, omega, zeta}, mast: {actor, at},
      rope: {k, slack, haulers: [{actor, t0, t1}]}, song: {from: [siren ids], t0, t1, env?}, pull: 0..1}
   crew force F(t) -> oar -> water (FX splashes at the catch) -> hull: a damped oscillator in pitch and roll driven by F and by the
   sea -> the ship rig's channels (its riders go with it) -> the mast constraint (Odysseus's root is the mast's: a rider, no root
   offsets) -> the rope: tension = k x max(0, want - slack) where want is the song's pull toward the Sirens plus the roll's lean away
   from them, less what the haulers take in -> Odysseus's torso strain (lean and twist toward the Sirens, limited by the rope) ->
   his head's target is the Sirens (the yaw solved each drawing from the ship's heading and roll). */
MACH.SIRENS_CHAIN = (X, m) => {
  const T = X.T, dt = 1 / 120, R = m.rowing, S = m.ship, env = X.θ.env, out = { pitch: [], roll: [], heave: [], F: [], tension: [], lean: [] };
  /* the hull: pitch'' = -w^2 pitch - 2 z w pitch' + kF (F - mean F) + sea; roll likewise with the port-starboard difference */
  let p = 0, pv = 0, r = 0, rv = 0, h = 0, hv = 0; const w = S.omega || 1.3, z = S.zeta || 0.25, sea = t => 0.012 * Math.sin(0.61 * t + 1.3) + 0.008 * Math.sin(1.37 * t);
  const port = new Set(m.port || []), Fside = t => { let a = 0, b = 0; const P = R.clock.period; for (const [id, off] of Object.entries(R.offsets)) { const u = (((t - (R.clock.t0 || 0)) / P - off) % 1 + 1) % 1, f = u >= 0.12 && u <= 0.45 ? Math.sin(Math.PI * (u - 0.12) / 0.33) : 0; if (port.has(id)) a += f; else b += f; } return [a, b]; };
  const Fm = Object.keys(R.offsets).length * 0.5;
  for (let t = 0; t <= T + 1e-6; t += dt) { const rowing = t >= (R.clock.t0 || 0) && t <= (R.clock.t1 || T), F = rowing ? crewForce(R, t) : 0, [a, b] = rowing ? Fside(t) : [0, 0];
    const pa = -w * w * p - 2 * z * w * pv + (S.pitchK || 0.02) * env * (F - (rowing ? Fm : 0)) + sea(t) * 0.5, ra = -w * w * r - 2 * z * w * rv + (S.rollK || 0.015) * env * (a - b) + sea(t + 3), ha = -w * w * h - 2 * z * w * hv + (S.heaveK || 1.2) * env * (F - (rowing ? Fm : 0)) + 1.5 * Math.sin(0.8 * t);
    pv += pa * dt; p += pv * dt; rv += ra * dt; r += rv * dt; hv += ha * dt; h += hv * dt;
    if (Math.abs(t * 12 - Math.round(t * 12)) < 1e-6 || Math.abs((t * 12) % 1) < dt * 12 * 0.5) { const tq = r3(Math.round(t * 12) / 12); if (!out.pitch.length || out.pitch[out.pitch.length - 1][0] < tq - 1e-6) { out.pitch.push([tq, r3(p)]); out.roll.push([tq, r3(r)]); out.heave.push([tq, r3(h * X.scale)]); out.F.push([tq, r3(F)]); } } }
  X.rigs.ship = { type: 'ship', piece: S.piece, pivot: S.pivot, channels: { pitch: out.pitch.map(([t, v]) => [t, v, 'linear']), roll: out.roll.map(([t, v]) => [t, v, 'linear']), heave: out.heave.map(([t, v]) => [t, v, 'linear']) }, riders: S.riders };
  const seaEv = X.ev({ id: 'sea', lane: 'SET/VEHICLE', t0: 0, t1: T, kind: 'SEA', label: 'the swell (two slow waves)', because: [] });
  const hull = X.ev({ id: 'hull', lane: 'SET/VEHICLE', t0: 0, t1: T, kind: 'HULL', label: 'the ship answers the sea and, from the first stroke, the oars (pitch, roll, heave: a damped oscillator)', because: [{ id: seaEv.id, latency: 0 }, { id: R.id || 'clock:row', latency: 0, rel: 'realises' }], params: { omega: w, zeta: z } });
  /* splashes at each catch (the oars into the water) */
  for (let t = (R.clock.t0 || 0); t < (R.clock.t1 || T); t += R.clock.period) X.ev({ lane: 'FX', t0: t + 0.1 * R.clock.period, t1: t + 0.35 * R.clock.period, kind: 'SPLASH', label: 'the oars bite the water', because: [{ id: R.id || 'clock:row', latency: r3(t - (R.clock.t0 || 0)) }] });
  /* the rope and Odysseus's strain, drawing by drawing */
  const od = m.mast.actor, song = m.song, sirens = song.from.filter(id => X.ids.includes(id)), rope = m.rope;
  const cons = X.ev({ id: 'mast', lane: 'CONTACT', actor: od, actors: [od], t0: m.mast.t0, t1: T, kind: 'CONSTRAINT', label: 'bound to the mast: his root is the mast\'s (he rides the ship)', because: [{ id: hull.id, latency: 0 }], params: { k: 6 } });
  const songEv = X.ev({ id: 'song', lane: 'STIMULUS', actor: sirens[0], t0: song.t0, t1: song.t1, kind: 'SONG', label: 'the Sirens\' song: the pull toward them', because: [] });
  const strainKeys = [], tension = [];
  const at = t => { const i = Math.min(out.roll.length - 1, Math.max(0, Math.round(t * 12))); return { roll: out.roll[i][1], pitch: out.pitch[i][1] }; };
  for (let t = m.mast.t0; t <= T; t += 1 / 12) { const s = X.at(od, t); if (!s) continue;
    const c = sirens.map(id => X.at(id, t)).filter(Boolean); if (!c.length) continue; const cx = c.reduce((a, q) => a + q.p[0], 0) / c.length, cz = c.reduce((a, q) => a + q.p[2], 0) / c.length;
    const bearing = X.wrap(Math.atan2(cx - s.p[0], cz - s.p[2]) - s.h), sh = at(t);
    const pull = (t >= song.t0 && t <= song.t1 ? (m.pull || 0.8) * Math.min(1, (t - song.t0) / 2) * Math.min(1, (song.t1 - t) / 3 + 0.2) : 0);
    /* the roll leans him toward or away from the Sirens: the component of the roll along the bearing */
    const rollLean = -sh.roll * Math.sin(bearing) * 4;
    const hauled = (rope.haulers || []).reduce((a, h) => a + (t >= h.t0 ? Math.min(1, (t - h.t0) / 2.5) * 0.12 : 0), 0);
    const want = pull + rollLean, slack = Math.max(0.02, rope.slack - hauled), leanOut = Math.min(want, slack) + Math.max(0, want - slack) * 0.15, T_ = rope.k * Math.max(0, want - slack);
    tension.push([r3(t), r3(T_)]);
    /* the torso strains toward them within the rope, the head takes them as its target (yaw solved, the rest to the torso) */
    const tw = X.cl(bearing * 0.35, -0.45, 0.45) * Math.min(1, pull * 1.5 + 0.2), hy = X.cl(bearing - tw, -1.35, 1.35);
    strainKeys.push([t, { 'torso.lean': X.cl(leanOut * 0.5, -0.3, 0.38), 'torso.twist': tw, 'head.yaw': hy, 'head.pitch': -0.08 * pull, 'torso.roll': X.cl(-sh.roll * 2, -0.16, 0.16), 'arm.R.pitch': -0.25 * Math.min(1, T_), 'arm.L.pitch': -0.25 * Math.min(1, T_) }]); }
  /* the mast constraint: from the binding on, his root is the mast's (the layout's later moves of him are cancelled: offsets back to
     the mast; he rides the ship with it) */
  const mast = m.mast.at, lockKeys = []; for (let t = m.mast.t0; t <= T; t += 1 / 12) { const s = X.at(od, t); if (s) lockKeys.push([t, { 'root.x': mast[0] - s.p[0], 'root.z': mast[2] - s.p[2], 'root.y': (mast[1] != null ? mast[1] : s.p[1]) - s.p[1], 'root.h': X.wrap((m.mast.h != null ? m.mast.h : s.h) - s.h), 'leg.R.pitch': -s.j.legRP[0], 'leg.L.pitch': -s.j.legLP[0] }]); }
  X.move(od, 'mech', 'LOCKED TO THE MAST', { id: cons.id }, k => { for (const [t, v] of lockKeys) k(t, v, 'linear'); }, { label: 'the layout would move him; the mast will not', rigid: true });
  const strainEv = X.move(od, 'mech', 'STRAIN AT THE ROPES', [{ id: songEv.id }, { id: cons.id }], k => { for (const [t, v] of strainKeys) k(t, v, 'linear'); }, { label: 'toward the Sirens; the rope holds him', rigid: true });
  const ropeEv = X.ev({ id: 'rope', lane: 'CONTACT', actor: od, actors: [od, ...(rope.haulers || []).map(h => h.actor)], t0: m.mast.t0, t1: T, kind: 'ROPE TENSION', label: 'the rope takes what the song and the roll ask of him', because: [{ id: strainEv ? strainEv.id : songEv.id, latency: 0 }, { id: hull.id, latency: 0 }], params: { k: 6, series: tension.filter((_, i) => i % 3 === 0) } });
  X.machine = Object.assign(X.machine || {}, { sirens: { F: out.F, pitch: out.pitch, roll: out.roll, tension, rope: ropeEv.id } });
};
module.exports = MACH;
