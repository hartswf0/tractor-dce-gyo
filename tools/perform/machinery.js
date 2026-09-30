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

/* ═════ the Stake's coupled homeostat (OD-B09-S08): restraint, appetite, terror and the work, across four time skips ═════
   x_O ODYSSEUS     his rage and resolve: in the night over the sleeper it rises (the sword's hilt); the door stone seen drives it down
                    (no man can move the stone: kill him and they die in the cave); over 0.8 in the night he would strike: out of limits.
                    At the evening the resolve to step up with the bowl: he offers when it passes 0.5 after the giant is seated
   x_P POLYPHEMUS   his appetite and wakefulness: asleep (< -0.5) in the night, rising at dawn; over 0.55 he reaches for a man (a
                    seizure: eating drives it down); at the evening the wine drives it down a gulp at a time: he drinks until it is under -0.2
   x_C CREW         terror: each seizure is a blow; over 0.85 for a second a man bolts for the wall (out of limits: the uniselector steps)
   x_W WORK         the labour's will: the stake's progress is its integral (with the crew's terror against it); the phases are its
                    thresholds (the trunk cut 0.25, smoothed 0.5, sharpened 0.72, hardened 0.9); under 0.2 for 1.5 s while the work is
                    unfinished: out of limits (the work would stall: Odysseus rallies them)
   The timings the scene takes: the hand off the hilt, the waking, the two seizures, the work's phases, the offer, the gulps. */
function stake(o = {}) {
  const T = o.total || 68, K = o.K || { night: [0.6, 11.9], dawn: [11.9, 23.1], day: [23.1, 35.7], dusk: [35.7, 44], eve: [44, 68] }, stoneAt = o.stoneAt || 3.2, dist = o.disturb || null;
  const ctx = { seizures: [], progress: 0, phases: {}, gulps: [], bolts: [], log: [] }, inP = (t, w) => t >= w[0] && t < w[1];
  const units = [
    { id: 'ODYSSEUS', tau: 0.7, x0: 0.1, range: 1.5, dwell: 0.6,
      drive: t => { if (inP(t, K.night)) return t < stoneAt ? 1.3 : -1.1; if (inP(t, K.dawn)) return -0.4 + (ctx.seizures.length ? 0.5 : 0); if (inP(t, K.day)) return 0.6; if (inP(t, K.dusk)) return 0.2;
        return ctx.seated && t >= ctx.seated ? 0.35 + 0.08 * (t - ctx.seated) : -0.2; },
      limits: t => (inP(t, K.night) ? [-1, 0.8] : [-1, 1]) },
    { id: 'POLYPHEMUS', tau: 1.1, x0: -0.8, range: 1.2, dwell: 1e9,
      drive: t => { if (inP(t, K.night)) return -1.2; if (inP(t, K.dawn)) { let u = -0.4 + 2.4 * Math.min(1, (t - K.dawn[0]) / 2.2); for (const s of ctx.seizures) if (t >= s.t + 1.2) u -= 1.4; return u; }
        if (inP(t, K.eve)) { let u = t < (ctx.seated || 1e9) ? 0.6 : 0.9; for (const g of ctx.gulps) if (t >= g) u -= 0.75; if (dist === 'wine-weak') u += 0.9; return u; } return -0.5; },
      limits: () => [-1, 1] },
    { id: 'CREW', tau: 0.5, x0: 0, range: 1.6, dwell: 1.0,
      drive: t => { let u = inP(t, K.night) ? 0.1 : inP(t, K.dawn) ? 0.3 : inP(t, K.eve) ? 0.4 : -0.2; for (const s of ctx.seizures) if (t >= s.t && t < s.t + 3) u += 1.6; return u; },
      limits: t => (inP(t, K.day) ? [-1, 0.3] : [-1, 0.85]) },   /* in the day the men must be calm enough to work */
    { id: 'WORK', tau: 1.0, x0: 0, range: 1.2, dwell: 1.5,
      drive: t => (inP(t, K.day) || (inP(t, K.dusk) && ctx.progress < 1) ? 0.9 : -0.6),
      limits: t => (inP(t, K.day) && ctx.progress < 0.9 ? [0.2, 1] : [-1, 1]) } ];
  /* the wiring: row i = what moves unit i (O, P, C, W) */
  const W = [[0, 0.5, -0.2, 0.3], [0, 0, 0.3, 0], [-0.4, 0.9, 0, 0], [0.5, 0, -0.8, 0]];
  function onStep(t, x) { const [O, P, C, Wk] = x, dt = 1 / 24;
    if (inP(t, K.night)) { if (O > 0.6) ctx.hilt = ctx.hilt || +t.toFixed(3); if (ctx.hilt && !ctx.checked && t > stoneAt && O < 0.1) ctx.checked = +t.toFixed(3); }
    if (!ctx.wake && inP(t, K.dawn) && P > 0.3) ctx.wake = +t.toFixed(3);
    if (inP(t, K.dawn) && P > 0.55 && ctx.seizures.length < 2 && (!ctx.seizures.length || t - ctx.seizures[ctx.seizures.length - 1].t > 2.6) && t < K.dawn[1] - 4) ctx.seizures.push({ t: +t.toFixed(3) });
    if (inP(t, K.dawn) && !ctx.out && ctx.seizures.length >= 2 && t > ctx.seizures[1].t + 3) ctx.out = +t.toFixed(3);
    if (C > 0.85) { ctx.cOut = (ctx.cOut || 0) + dt; if (ctx.cOut > 1 && (!ctx.bolts.length || t - ctx.bolts[ctx.bolts.length - 1] > 3)) { ctx.bolts.push(+t.toFixed(3)); ctx.cOut = 0; } } else ctx.cOut = 0;
    if (inP(t, K.day) || inP(t, K.dusk)) { ctx.progress = Math.min(1, ctx.progress + dt * 0.085 * Math.max(0, 0.35 + Wk) * (1 - 0.5 * Math.max(0, C)));
      for (const [k, v] of [['cut', 0.25], ['smooth', 0.5], ['sharp', 0.72], ['hard', 0.9]]) if (!ctx.phases[k] && ctx.progress >= v) ctx.phases[k] = +t.toFixed(3); }
    if (Math.round(t * 12) !== Math.round((t - dt) * 12)) ctx.log.push([+t.toFixed(3), +ctx.progress.toFixed(3)]);
    if (inP(t, K.eve) && !ctx.seated && t > K.eve[0] + (o.enter || 2.5)) ctx.seated = +t.toFixed(3);
    if (inP(t, K.eve) && ctx.seated && !ctx.offer && O > 0.5) ctx.offer = +t.toFixed(3);
    if (ctx.offer && !ctx.take && t > ctx.offer + (o.reach || 2.0)) ctx.take = +t.toFixed(3);
    if (ctx.take && (!ctx.gulps.length || t - ctx.gulps[ctx.gulps.length - 1] > 1.8) && t > ctx.take + 0.8 && !ctx.sated && ctx.gulps.length < 6) ctx.gulps.push(+t.toFixed(3));
    if (ctx.take && !ctx.sated && ctx.gulps.length && P < -0.2) ctx.sated = +t.toFixed(3); }
  return { units, W, ctx, onStep, total: T, dt: 1 / 24, seed: 'OD-B09-S08:' + (dist || 'base') };
}
MACH.stake = stake;

/* ═════ the Strait's coupled homeostat (OD-B12-S04): the stroke held under two monsters ═════
   x_C CREW         fear: the roar of Charybdis is a blow, his words a calm; over 0.55 while they row, the stroke falters (strokes lost:
                    the ship's way through the strait drops)
   x_O ODYSSEUS     readiness at the bow: low until he arms, high as he searches the rock face (the wrong place); his calm steadies them
   x_S SCYLLA       her hunger as the ship comes under her rock: driven by the ship's way through the strait (the integral of the strokes
                    kept); over 0.7 the six heads strike
   x_E CHARYBDIS    the whirlpool's pull and roar (the sea's level follows it)
   The events: the lost strokes, the strike (not before the take's own K4 window: the ship must be under the rock), the sea's level. */
function strait(o = {}) {
  const T = o.total || 53.5, row = o.row || [0.6, 53.5], words = o.words || [10.9, 25.3], arm = o.arm || 25.7, under = o.under || 34, P = o.period || 2.6, n = o.rowers || 6, win = o.window || [33.3, 36];
  const ctx = { lost: [], way: 0, wayLog: [], strike: null }, inR = t => t >= row[0] && t < row[1];
  const units = [
    { id: 'CREW', tau: 0.5, x0: -0.2, range: 1.6, dwell: 0.8,
      drive: t => (t < 3 ? 1.6 : t >= words[0] && t < words[1] ? -0.5 : 0.32) + (ctx.strike && t >= ctx.strike ? 2 : 0),
      limits: t => (inR(t) && (!ctx.strike || t < ctx.strike) ? [-1, 0.55] : [-1, 1]) },
    { id: 'ODYSSEUS', tau: 0.8, x0: 0.2, range: 1.2, dwell: 1e9, drive: t => (t < arm ? 0.1 : 0.9), limits: () => [-1, 1] },
    { id: 'SCYLLA', tau: 1.0, x0: -0.8, range: 1.0, dwell: 1e9, drive: () => -1.4 + 3.4 / (1 + Math.exp(-(ctx.way - (o.wayUnder || 0.55)) / 0.05)), limits: () => [-1, 1] },
    { id: 'CHARYBDIS', tau: 2.0, x0: 0.3, range: 1.0, dwell: 1e9, drive: t => 0.9 - 0.5 * Math.max(0, Math.min(1, (t - 30) / 15)), limits: () => [-1, 1] } ];
  const W = [[0, -0.6, 0, 0.7], [0.3, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  let cOut = 0;
  function onStep(t, x) { const [C, O, Sy, E] = x, dt = 1 / 24;
    /* the stroke: kept while the fear is within its limit (a stroke is lost after 0.3 s over it); the way made is the strokes kept */
    const falter = inR(t) && (!ctx.strike || t < ctx.strike) && C > 0.55; if (falter) { cOut += dt; if (cOut > 0.3 && (!ctx.lost.length || t - ctx.lost[ctx.lost.length - 1][1] > P * 0.5)) ctx.lost.push([+t.toFixed(3), +(t + P).toFixed(3)]); } else cOut = 0;
    const lostNow = ctx.lost.some(([a, b]) => t >= a && t < b);
    if (inR(t) && !ctx.strike) ctx.way += dt * (lostNow ? 0.2 : 1) / (under - row[0]) * 0.62;
    if (Math.round(t * 12) !== Math.round((t - dt) * 12)) ctx.wayLog.push([+t.toFixed(3), +ctx.way.toFixed(4)]);
    if (!ctx.strike && Sy > 0.7 && t >= win[0]) ctx.strike = +t.toFixed(3);
    if (!ctx.strike && t >= win[1] + 6) ctx.strike = +t.toFixed(3); }   /* past the window by six seconds: she strikes wherever the ship is */
  return { units, W, ctx, onStep, total: T, dt: 1 / 24, seed: 'OD-B12-S04:' + (o.disturb || 'base') };
}
MACH.strait = strait;

/* ═════ the Taunt's coupled homeostat (OD-B09-S11): pride, rage, fear and the sea ═════
   x_O ODYSSEUS     pride: each stress of his taunt a pulse, the crew's pleading against it; the wave takes it down, the name lifts it
   x_P POLYPHEMUS   rage, by ear: each stress he hears a pulse, the name a blow; over 0.7 in the take's window he tears off a peak and
                    throws; the prophecy remembered takes it down (grief); the prayer; over 0.7 again at the end: the second rock
   x_C CREW         fear: the pleading's strength; over 0.6 while they row, a stroke lost; over 0.65 during the name, a man grips his arm
   x_E SEA          the wave: the rock's landing is a blow to it; its peak is the push of the ship back toward the shore
   o: stresses [t] (his taunt's), name t (the word "Odysseus"), prophecy t, prayer [t0, t1], windows {throw1: [a, b], throw2: [a, b]},
   row [t0, t1] */
function taunt(o = {}) {
  const T = o.total || 100.5, st = o.stresses || [], nameAt = o.name || 33, proph = o.prophecy || 48, pray = o.prayer || [62, 90], w1 = o.throw1 || [17, 19], w2 = o.throw2 || [91.8, 93], row = o.row || [20, 28], flight = o.flight || 4.4;
  const ctx = { throws: [], lost: [], grips: [] }, pulse = (t, a, w) => (t >= a && t < a + w ? 1 : 0), land = () => ctx.throws.map(x => x + flight);
  const units = [
    { id: 'ODYSSEUS', tau: 0.6, x0: 0.2, range: 1.4, dwell: 1e9, drive: t => { let u = 0.1; for (const s of st) u += 0.8 * pulse(t, s, 0.6); for (const l of land()) u -= 2.0 * pulse(t, l, 4); u += 1.4 * pulse(t, nameAt - 1.5, 3); return u; }, limits: () => [-1, 1] },
    { id: 'POLYPHEMUS', tau: 0.9, x0: 0.1, range: 1.4, dwell: 0.8,
      drive: t => { let u = 0.15 + 0.05 * st.filter(s => s < t && t < (ctx.throws[0] || 1e9)).length; for (const s of st) u += 0.55 * pulse(t, s + 0.3, 0.8); u += 2.6 * pulse(t, nameAt, 3); for (const x of ctx.throws) u -= 1.8 * pulse(t, x + 1.2, 3.5); if (t >= proph && t < pray[0]) u -= 1.1; if (t >= pray[0] && t < pray[1]) u -= 0.3; if (t >= pray[1]) u += 1.6; return u; },
      limits: t => (t >= proph && t < pray[1] ? [-1, 0.4] : [-1, 1]) },   /* while he remembers and prays, the rage held down (a curse is not a throw) */
    { id: 'CREW', tau: 0.5, x0: 0.1, range: 1.6, dwell: 0.7, drive: t => { let u = 0.25; for (const l of land()) u += 2.2 * pulse(t, l, 3); return u; }, limits: t => (t >= row[0] && t < row[1] ? [-1, 0.6] : [-1, 1]) },
    { id: 'SEA', tau: 1.6, x0: -0.6, range: 1.0, dwell: 1e9, drive: t => { let u = -0.7; for (const l of land()) u += 3.0 * pulse(t, l, 2.5); return u; }, limits: () => [-1, 1] } ];
  const W = [[0, 0.35, -0.5, 0], [0, 0, 0, 0], [0.45, 0.4, 0, 0.6], [0, 0, 0, 0]];
  let cOut = 0;
  function onStep(t, x) { const [O, P, C, E] = x, dt = 1 / 24;
    for (const w of [w1, w2]) if (t >= w[0] && t < w[1] + 2.5 && P > 0.7 && !ctx.throws.some(y => y >= w[0] - 0.1 && y < w[1] + 2.6)) ctx.throws.push(+t.toFixed(3));
    for (const w of [w1, w2]) if (t >= w[1] + 2.5 && t < w[1] + 2.5 + dt && !ctx.throws.some(y => y >= w[0] - 0.1 && y < w[1] + 2.6)) { ctx.throws.push(+t.toFixed(3)); ctx.late = (ctx.late || []).concat([+t.toFixed(3)]); }
    if (t >= row[0] && t < row[1] && C > 0.6) { cOut += dt; if (cOut > 0.3 && (!ctx.lost.length || t - ctx.lost[ctx.lost.length - 1][1] > 1.3)) ctx.lost.push([+t.toFixed(3), +(t + 2.6).toFixed(3)]); } else cOut = 0;
    if (t >= nameAt - 2 && t < nameAt + 8 && C > 0.65 && !ctx.grips.some(g => t - g < 3)) ctx.grips.push(+t.toFixed(3));
    if (!ctx.peak || E > ctx.peak.e) ctx.peak = { t: +t.toFixed(3), e: +E.toFixed(3) }; }
  return { units, W, ctx, onStep, total: T, dt: 1 / 24, seed: 'OD-B09-S11:' + (o.disturb || 'base') };
}
MACH.taunt = taunt;

/* ═════ the Storm's coupled homeostat (OD-B12-S07 the thunderbolt, OD-B05-S05 the raft): a god's anger against a vessel and a man ═════
   x_G GOD          the anger (Zeus for the Sun's cattle, Poseidon at the sight of the raft): o.anger(t) drives it; over 0.75 inside the
                    take's window the god strikes (the bolt on the mast; the trident in the sea)
   x_S SEA          the storm: calm until the strike, then driven up; o.calm (Athena, or the storm passing) drives it down
   x_V VESSEL       the ship's or the raft's integrity: the sea over 0.3 wears it, the strike is a blow; under -0.5 for half a second after
                    the strike it breaks up (at the earliest in o.breakWindow); the hero's work on it (the steering oar, the lashing)
                    is its uniselector's
   x_H HERO         endurance: the water takes it down, the vessel's soundness holds it up; with the vessel under 0 and the sea over
                    0.7 he is thrown; back aboard when it is over 0.3 two seconds later; the crew (o.crew n) drown one by one after the
                    breakup as their share of it runs out
   o: anger(t), strikeWindow, calm (t), breakWindow, thrownWindow, crew (n), seed */
function storm(o = {}) {
  const T = o.total || 60, sw = o.strikeWindow || [20, 30], bw = o.breakWindow || null, tw = o.thrownWindow || null, calm = o.calm || 1e9, n = o.crew || 0;
  const ctx = { drowned: [] }, pulse = (t, a, w) => (t >= a && t < a + w ? 1 : 0);
  const units = [
    { id: 'GOD', tau: 1.2, x0: -0.4, range: 1.0, dwell: 1e9, drive: t => (o.anger ? o.anger(t) : 0.5) - (ctx.strike && t > ctx.strike + 1 ? 1.2 : 0), limits: () => [-1, 1] },
    { id: 'SEA', tau: 1.8, x0: -0.5, range: 1.0, dwell: 1e9, drive: t => (!ctx.strike || t < ctx.strike ? -0.6 : t < calm ? 1.9 : -1.0), limits: () => [-1, 1] },
    { id: 'VESSEL', tau: 0.9, x0: 0.8, range: 1.4, dwell: 0.4, drive: t => 0.8 - (ctx.strike ? 3.0 * pulse(t, ctx.strike, 1.5) : 0) - (ctx.breakup && t >= ctx.breakup ? 3 : 0), limits: t => (ctx.strike && t > ctx.strike && !ctx.breakup ? [-0.5, 1] : [-1, 1]) },
    { id: 'HERO', tau: 0.7, x0: 0.5, range: 1.4, dwell: 0.6, drive: t => 0.6 - (ctx.thrown && (!ctx.regain || t < ctx.regain) ? 1.0 : 0), limits: t => (ctx.strike && t > ctx.strike ? [-0.6, 1] : [-1, 1]) } ];
  const W = [[0, 0, 0, 0], [0.5, 0, 0, 0], [0, -1.6, 0, 0.3], [0, -0.9, 0.6, 0]];
  let vOut = 0;
  function onStep(t, x) { const [Gd, S, V, H] = x, dt = 1 / 24;
    if (!ctx.strike && t >= sw[0] && Gd > 0.75) ctx.strike = +t.toFixed(3); if (!ctx.strike && t >= sw[1]) { ctx.strike = +t.toFixed(3); ctx.lateStrike = true; }
    if (ctx.strike && !ctx.breakup && t > ctx.strike && (!bw || t >= bw[0])) { if (V < -0.5) { vOut += dt; if (vOut > 0.5) ctx.breakup = +t.toFixed(3); } else vOut = 0; if (bw && t >= bw[1] && !ctx.breakup) { ctx.breakup = +t.toFixed(3); ctx.lateBreak = true; } }
    if (!ctx.thrown && ctx.strike && (!tw || t >= tw[0]) && S > 0.7 && V < 0.1) ctx.thrown = +t.toFixed(3);
    if (!ctx.thrown && tw && t >= tw[1]) { ctx.thrown = +t.toFixed(3); ctx.lateThrown = true; }
    if (ctx.thrown && !ctx.regain && t > ctx.thrown + 2 && H > 0.3) ctx.regain = +t.toFixed(3);
    if (ctx.breakup && ctx.drowned.length < n) { const k = ctx.drowned.length, due = ctx.breakup + 1.2 + k * (0.9 + 0.5 * Math.max(0, H)); if (t >= due) ctx.drowned.push(+t.toFixed(3)); } }
  return { units, W, ctx, onStep, total: T, dt: 1 / 24, seed: o.seed || 'storm' };
}
MACH.storm = storm;

/* ═════ the Harbour's coupled homeostat (OD-B10-S02): the town roused, the fleet crushed, one cable cut ═════
   x_O ODYSSEUS     alarm, and the resolve to cut: rises with each boulder that lands; over 0.7 inside the take's window he draws and cuts.
                    Over 0.95 for a second before the cut he is frozen by it (out of limits: his uniselector steps)
   x_T TOWN         the giants roused: the queen's call, the seizure, the shout spreading: giant k joins when it passes its threshold
   x_F FLEET        the trapped crews' panic: each landing a blow
   x_S SEA          the splashes and the swell they raise under his ship
   o: seize t, giants (thresholds), cutWindow, flight (s), throwsEach */
function harbour(o = {}) {
  const T = o.total || 35, seize = o.seize || 18.5, th = o.thresholds || [0.3, 0.45, 0.6, 0.75], cw = o.cutWindow || [26, 30], fl = o.flight || 1.8, each = o.throwsEach || 2;
  const ctx = { joins: [], throws: [], lands: [] }, pulse = (t, a, w) => (t >= a && t < a + w ? 1 : 0);
  const units = [
    { id: 'ODYSSEUS', tau: 0.8, x0: -0.3, range: 1.4, dwell: 1.0, drive: t => { let u = -0.4; for (const l of ctx.lands) if (t >= l) u += 0.3; return u; }, limits: t => (!ctx.cut ? [-1, 0.95] : [-1, 1]) },
    { id: 'TOWN', tau: 1.2, x0: -0.8, range: 1.2, dwell: 1e9, drive: t => (t < seize - 2 ? -0.8 : t < seize ? 0.2 : 0.9 + 0.12 * (t - seize)), limits: () => [-1, 1] },
    { id: 'FLEET', tau: 0.5, x0: -0.2, range: 1.4, dwell: 1e9, drive: t => { let u = -0.2; for (const l of ctx.lands) u += 1.6 * pulse(t, l, 2.0); return u; }, limits: () => [-1, 1] },
    { id: 'SEA', tau: 1.4, x0: -0.6, range: 1.0, dwell: 1e9, drive: t => { let u = -0.6; for (const l of ctx.lands) u += 1.2 * pulse(t, l, 1.5); return u; }, limits: () => [-1, 1] } ];
  const W = [[0, 0.4, 1.8, 0], [0, 0, 0, 0], [0, 0.5, 0, 0.3], [0, 0, 0, 0]];
  let oOut = 0;
  function onStep(t, x) { const [O, Tn] = x, dt = 1 / 24;
    th.forEach((v, k) => { if (!ctx.joins[k] && Tn > v) ctx.joins[k] = +t.toFixed(3); });
    ctx.joins.forEach((j, k) => { if (j == null) return; for (let n = 0; n < each; n++) { const tt = +(j + 1.0 + n * 2.6).toFixed(3); if (t >= tt && !ctx.throws.some(q => q.k === k && q.n === n)) { ctx.throws.push({ k, n, t: tt }); ctx.lands.push(+(tt + 2.2 + fl).toFixed(3)); } } });
    if (!ctx.cut && O > 0.95) { oOut += dt; if (oOut > 1 && !ctx.frozenAt) ctx.frozenAt = +t.toFixed(3); } else oOut = 0;
    if (!ctx.cut && t >= cw[0] && O > 0.7 && O < 0.95) ctx.cut = +t.toFixed(3);   /* resolve, not panic: over 0.95 he is frozen by it */
    if (!ctx.cut && t >= cw[1]) { ctx.cut = +t.toFixed(3); ctx.lateCut = true; } }
  return { units, W, ctx, onStep, total: T, dt: 1 / 24, seed: 'OD-B10-S02:' + (o.disturb || 'base') };
}
MACH.harbour = harbour;

/* ═════ the Rams' coupled homeostat (OD-B09-S10): a blind search that must miss ═════
   x_O ODYSSEUS     his hold under the lead ram: > -0.5 while he hangs there (below it for 1 s his grip slips: a foot drops)
   x_P POLYPHEMUS   the searching hands' suspicion: over 0.55 for 0.5 s with a man under the hand, the fingers go down the flank and
                    find him (DETECTED: the failure); the hands feel lower as it rises (the grope's height is the needle's)
   x_C CREW         the fear of the men under the rams: over 0.6 for 0.5 s a man shifts (a STIR the giant hears: a blow to x_P)
   x_F FLOCK        the pace of the flock at the door: the herd's speed; a suspicious giant holds each back longer (w_FP < 0)
   tau_i dx_i/dt = -x_i + tanh( sum_j W_ij x_j + u_i(t) )
   The drives: each triad's pass under the hands (a pulse to P, and to C for the man under it), the stirs (to P), the lead ram's stop and
   the giant's words to it (tenderness lowers P; "why last" raises it), Odysseus's fatigue under the ram (to O), and the disturbance
   (o.disturb 'grip-slips': the wool gives under his hands at 38 s). The events derived on the run: the passes (from the flock's
   integrated pace), the stirs, the slip, the detection, the ram let go (the words over and the needle calm). */
function rams(o = {}) {
  const T = o.total || 72.4, K1 = o.K1 || [0.6, 10.9], K3 = o.K3 || [23.4, 53.9], door = o.door || 60, back0 = o.back0 || 0, spacing = o.spacing || 60, rows = o.rows || 6, riders = o.riders || [1, 1, 1, 1, 1, 1];
  const v0 = o.v0 || 36, quoteAt = o.quoteAt || [30, 48], lastAt = o.lastAt || null, stopAt = o.stopAt || K3[0] + 4, dist = o.disturb || null;
  const ctx = { passes: [], stirs: [], s: 0, sLog: [], slip: null, detected: null, release: null }, pulse = (t, a, w) => (t >= a && t < a + w ? 1 : 0);
  const inK1 = t => t >= K1[0] && t < K1[1], inK3 = t => t >= K3[0] && t < K3[1], under = t => t >= stopAt - 3 && t < (ctx.release || K3[1]);
  const units = [
    { id: 'ODYSSEUS', tau: 0.8, x0: 0.4, range: 1.5, dwell: 0.6,
      drive: t => { if (!inK3(t)) return 0.6; let u = 0.55 - 0.028 * Math.max(0, t - K3[0]); if (ctx.release && t >= ctx.release) u = 0.9; if (dist === 'grip-slips' && t >= 38 && t < 40.5) u -= 1.6; return u; },
      limits: t => (inK3(t) && under(t) ? [-0.5, 1] : [-1, 1]) },
    { id: 'POLYPHEMUS', tau: 1.3, x0: -0.3, range: 1.4, dwell: 0.3,
      drive: t => { let u = inK1(t) || inK3(t) ? -0.15 : -0.8;
        for (const p of ctx.passes) u += 0.75 * pulse(t, p.t, 0.7); for (const s of ctx.stirs) u += 2.4 * pulse(t, s.t, 1.0); if (ctx.slip && t >= ctx.slip) u += 2.2 * pulse(t, ctx.slip, 1.2);
        if (inK3(t) && t >= stopAt && t < quoteAt[1]) u -= 0.35;   /* the hand on his ram: grief, tenderness */
        if (lastAt && t >= lastAt && t < lastAt + 2.5) u += 0.7;   /* "why last?" */
        return u; },
      limits: t => ((inK1(t) || (inK3(t) && under(t))) ? [-1, 0.55] : [-1, 1]) },
    { id: 'CREW', tau: 0.5, x0: -0.2, range: 1.6, dwell: 0.35,
      drive: t => { if (!inK1(t)) return -0.6; let u = 0.15; for (const p of ctx.passes) if (p.rider) u += 0.9 * pulse(t, p.t - 0.2, 0.9); return u; },
      limits: t => (inK1(t) ? [-1, 0.6] : [-1, 1]) },
    { id: 'FLOCK', tau: 1.2, x0: 0.3, range: 1.2, dwell: 1e9,
      drive: t => (inK1(t) ? 0.5 : inK3(t) ? 0.2 : 0.4), limits: () => [-1, 1] } ];
  /* the wiring: row i = what moves unit i (O, P, C, F) */
  const W = [[0, -0.45, 0, 0], [0, 0, 0.35, 0.25], [0.25, 1.1, 0, 0], [0, -0.9, 0.15, 0]];
  let cOut = 0, oOut = 0, pOut = 0;
  function onStep(t, x) { const [O, P, C, F] = x, dt = 1 / 24;
    /* the flock: the leader's arc length at the flock's pace; each row passes the door when its back (row x spacing) reaches it */
    if (inK1(t)) { ctx.s += dt * v0 * (0.55 + 0.45 * (F + 1)); for (let r = 0; r < rows; r++) if (!ctx.passes.some(p => p.row === r) && ctx.s - back0 - r * spacing >= door) ctx.passes.push({ t: +t.toFixed(3), row: r, rider: !!riders[r] }); }
    if (Math.round(t * 12) !== Math.round((t - dt) * 12)) ctx.sLog.push([+t.toFixed(3), +ctx.s.toFixed(2)]);
    /* the crew: a man shifts after 0.5 s over the limit (the one under the ram at the door, else the last to pass) */
    if (inK1(t) && C > 0.6) { cOut += dt; if (cOut > 0.5 && (!ctx.stirs.length || t - ctx.stirs[ctx.stirs.length - 1].t > 2)) { const p = ctx.passes.filter(q => q.rider && q.t <= t + 0.2).pop(); ctx.stirs.push({ t: +t.toFixed(3), row: p ? p.row : 0 }); cOut = 0; } } else cOut = 0;
    /* Odysseus: a foot drops after 1 s under his limit */
    if (inK3(t) && under(t) && O < -0.5) { oOut += dt; if (oOut > 1.0 && !ctx.slip) ctx.slip = +t.toFixed(3); } else oOut = 0;
    /* the search: 0.5 s over 0.55 with a man under the hand */
    const riderUnder = (inK1(t) && ctx.passes.some(p => p.rider && t >= p.t - 0.3 && t < p.t + 0.9)) || (inK3(t) && under(t) && t >= stopAt);
    if (P > 0.55 && riderUnder) { pOut += dt; if (pOut > 0.5 && !ctx.detected) ctx.detected = +t.toFixed(3); } else pOut = 0;
    /* the lead ram let go: his words over and the needle calm (at the latest a little before the cut outside) */
    if (!ctx.release && !ctx.detected && inK3(t) && t >= quoteAt[1] && P < 0) ctx.release = +t.toFixed(3);
    if (!ctx.release && !ctx.detected && t >= K3[1] - 2.5) ctx.release = +t.toFixed(3); }
  return { units, W, ctx, onStep, total: T, dt: 1 / 24, seed: 'OD-B09-S10:' + (dist || 'base') };
}
MACH.rams = rams;

/* ═════ ROWING: one shared phase clock, per-body offsets (a fraction of the stroke), coordinated labour, not cloned loops ═════
   m {kind:'ROWING', clock: {period, t0, t1}, offsets: {actor: fraction}, amp} */
MACH.ROWING = (X, m) => {
  const P = m.clock.period, t0 = m.clock.t0 || 0, t1 = m.clock.t1 || X.T, clockEv = X.ev({ id: m.id || 'clock:row', lane: 'STIMULUS', t0, t1, kind: 'CLOCK', label: 'the stroke: one clock, period ' + P + ' s', params: { period: P, offsets: m.offsets } });
  for (const [id, off] of Object.entries(m.offsets)) { if (!X.ids.includes(id)) continue; const a = (m.amp || 1);
    const busy = (m.busy || {})[id] || [];
    let n = Math.ceil((t0 - (off * P)) / P) - 1;
    for (let tc = t0 + off * P; tc < t1; tc += P, n++) { if (tc < t0 - 1e-6 || busy.some(([x, y]) => tc + P > x && tc < y)) continue;
      stroke(X, id, tc, P, a, { id: clockEv.id, latency: r3(tc - t0), rel: 'on the clock' }, 'stroke ' + (n + 1) + ' (offset ' + (off >= 0 ? '+' : '') + off + ')', off); }
    X.move(id, 'mech', 'SHIP OARS', clockEv, k => { k(t1, { 'arm.R.pitch': X.sheet.rel(0), 'arm.L.pitch': X.sheet.rel(0), 'torso.lean': X.sheet.rel(0), 'hips.dy': X.sheet.rel(0) }); k(t1 + 0.8, { 'arm.R.pitch': 0, 'arm.L.pitch': 0, 'torso.lean': 0, 'hips.dy': 0 }); }, { silent: true }); }
};
/* one stroke of an oar at tc on a clock of period P (the ROWING machinery's and the ROW intent's): catch (arms forward, body
   forward) -> drive (arms back, body back, legs push) -> finish -> recovery */
function stroke(X, id, tc, P, a, cause, label, off) {
      X.move(id, 'mech', 'STROKE', cause, k => {
        k(tc, { 'arm.R.pitch': { abs: -1.7 * a }, 'arm.L.pitch': { abs: -1.7 * a }, 'torso.lean': 0.22 * a, 'hips.dy': -0.4, 'head.pitch': 0.04 });   /* the catch: arms forward, the body forward */
        k(tc + P * 0.12, { 'arm.R.pitch': { abs: -1.5 * a }, 'arm.L.pitch': { abs: -1.5 * a }, 'torso.lean': 0.12 * a }, 'in');
        k(tc + P * 0.42, { 'arm.R.pitch': { abs: -0.55 * a }, 'arm.L.pitch': { abs: -0.55 * a }, 'torso.lean': -0.16 * a, 'hips.dy': -1.4, 'head.pitch': -0.04 }, 'out');   /* the drive: pulled through */
        k(tc + P * 0.55, { 'arm.R.pitch': { abs: -0.6 * a }, 'arm.L.pitch': { abs: -0.6 * a }, 'torso.lean': -0.14 * a });   /* the finish */
        k(tc + P * 0.99, { 'arm.R.pitch': { abs: -1.65 * a }, 'arm.L.pitch': { abs: -1.65 * a }, 'torso.lean': 0.2 * a, 'hips.dy': -0.4, 'head.pitch': 0.03 });   /* the recovery */
      }, { label, params: { phase: r3(off || 0), force: r3(a) }, rigid: true }); }
MACH.stroke = stroke;
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

/* ═════ SEA: the sea as an actor — a wave field whose level the scene's causes raise and lower, the hulls it drives, the swimmers it
   carries ═════
   m {kind:'SEA', level: [[t, 0..1], ...] (calm 0 .. storm 1; linear between), causes: [{t, id}] (the events that raise or lower it: the
      SEA event's causes), hulls: [{id, piece, pivot, riders: [id | [id, t0, t1]], gain (a raft 2, a ship 1), omega, zeta, impulses:
      [{t, roll, pitch, id?, push?: [dx, dz], backAt?, back?}] (a wave's blow; a push carries the hull, taken back from backAt over back s)}], swimmers: [{actor, t0, t1}], aboard: [ids] (balance against the deck), fx: true}
   the field: h(x, z, t) = L(t) (A1 sin(k1.x - w1 t) + A2 sin(k2.x - w2 t) + A3 sin(k3.x - w3 t)), three long crests from two quarters
   a hull: pitch and roll each a damped oscillator driven by the field's slope under its pivot (x gain) plus the impulses; heave = h at the
     pivot. It writes rigs[id] (the player turns the piece and its riders)
   a swimmer: bobs on h at his place (root.y) and is tipped by the slope (torso.lean / torso.roll within the clamp)
   aboard: a standing rider leans against the deck's roll and pitch (torso.roll, torso.lean): balance, not a clone of the hull's motion
   heat: the sea is an object (material water) whose source is L(t) x the field's speed, coupled to the swimmers and the hulls; SPLASH
     FX where the slope is steepest (a breaking crest) */
MACH.SEA = (X, m) => {
  const T = X.T, U = X.scale || 1, Lv = m.level || [[0, 0.3]], L = t => { let a = Lv[0]; for (const b of Lv) { if (b[0] >= t) { if (b === a || b[0] === a[0]) return b[1]; const u = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } a = b; } return a[1]; };
  const W = [[0.012, 0.004, 1.1, 9], [-0.004, 0.011, 1.6, 5], [0.019, -0.008, 2.3, 2.5]].map(([kx, kz, w, A]) => ({ kx: kx / U, kz: kz / U, w, A: A * U }));
  const h = (x, z, t) => L(t) * W.reduce((s, q, k) => s + q.A * Math.sin(q.kx * x + q.kz * z - q.w * t + k * 1.7), 0);
  const slope = (x, z, t) => { const e = 4 * U; return [(h(x + e, z, t) - h(x - e, z, t)) / (2 * e), (h(x, z + e, t) - h(x, z - e, t)) / (2 * e)]; };
  const speed = (x, z, t) => Math.abs(h(x, z, t + 0.05) - h(x, z, t - 0.05)) / 0.1 / U;
  const seaEv = X.ev({ id: m.id || 'sea', lane: 'SET/VEHICLE', t0: 0, t1: T, kind: 'SEA', label: 'the sea: a wave field of three crests, its level ' + Lv.map(([t, v]) => v.toFixed(2) + '@' + t).join(', '), because: [], params: { level: Lv } });
  /* each change of level is an event caused by the scene's step that makes it (a god's anger, a calm) */
  for (const c of m.causes || []) { const a = L(c.t - 0.3), b = L(c.t + 2.5); if (Math.abs(b - a) < 0.05) continue; X.ev({ lane: 'SET/VEHICLE', t0: r3(c.t), t1: r3(c.t + 2.5), kind: b > a ? 'SEA RISES' : 'SEA FALLS', label: 'the sea ' + (b > a ? 'rises' : 'falls') + ' ' + a.toFixed(2) + ' -> ' + b.toFixed(2), because: [{ id: c.id, latency: 0 }, { id: seaEv.id, latency: r3(c.t) }], params: { from: r3(a), to: r3(b) } }); }
  const out = { level: [], hulls: {}, waves: W.map((q, k) => ({ kx: q.kx, kz: q.kz, w: q.w, A: q.A, ph: r3(k * 1.7) })) }, hz = 12;
  for (let i = 0; i <= T * hz; i++) out.level.push([r3(i / hz), r3(L(i / hz))]);
  /* the hulls */
  for (const Hh of m.hulls || []) { const [px, py, pz] = Hh.pivot, g = Hh.gain || 1, w = Hh.omega || 1.4, z = Hh.zeta || 0.3, dt = 1 / 120; let p = 0, pv = 0, r = 0, rv = 0; const ch = { pitch: [], roll: [], heave: [] };
    const imp = (Hh.impulses || []).map(q => ({ ...q, done: false }));
    const pushes = (Hh.impulses || []).filter(q => q.push);
    for (let t = 0, j = 0; t <= T + 1e-6; t += dt, j++) { const [sx, sz] = slope(px, pz, t);
      let pa = -w * w * p - 2 * z * w * pv + w * w * g * Math.atan(sz) * 0.9, ra = -w * w * r - 2 * z * w * rv + w * w * g * Math.atan(sx) * 0.9;
      for (const q of imp) if (!q.done && t >= q.t) { q.done = true; rv += (q.roll || 0) * w * 1.6; pv += (q.pitch || 0) * w * 1.6; }
      pv += pa * dt; p += pv * dt; rv += ra * dt; r += rv * dt;
      if (j % 10 === 0) { const tq = r3(j / 120); ch.pitch.push([tq, r3(p), 'linear']); ch.roll.push([tq, r3(r), 'linear']); ch.heave.push([tq, r3(h(px, pz, t)), 'linear']);
        /* a push (a wave front carrying the hull): rises over 1.5 s, held, then taken back over its 'back' seconds (oars, a pole) */
        if (pushes.length) { let dx = 0, dz = 0; for (const q of pushes) { const u = t - q.t; if (u <= 0) continue; const up = Math.min(1, u / 1.5), bk = q.back ? Math.max(0, Math.min(1, (t - (q.backAt || q.t + 4)) / q.back)) : 0, f = X.sm ? X.sm(up) * (1 - X.sm(bk)) : up * (1 - bk); dx += q.push[0] * f; dz += q.push[1] * f; }
          (ch.dx = ch.dx || []).push([tq, r3(dx), 'linear']); (ch.dz = ch.dz || []).push([tq, r3(dz), 'linear']); } } }
    const rid = Hh.id || 'ship'; X.rigs[rid] = { type: 'ship', piece: Hh.piece, pivot: Hh.pivot, channels: ch, riders: Hh.riders || [] };
    const hullEv = X.ev({ id: 'hull:' + rid, lane: 'SET/VEHICLE', t0: 0, t1: T, kind: 'HULL', label: (Hh.piece || rid) + ' on the sea (pitch and roll: damped oscillators driven by the slope under it; heave: the crest)', because: [{ id: seaEv.id, latency: 0 }], params: { gain: g, omega: w, zeta: z } });
    for (const q of Hh.impulses || []) X.ev({ lane: 'SET/VEHICLE', t0: q.t, t1: q.t + 0.6, kind: 'IMPACT', label: q.label || 'a wave strikes ' + (Hh.piece || rid), because: [{ id: q.id || seaEv.id, latency: 0 }, { id: hullEv.id, latency: 0 }], params: { roll: q.roll, pitch: q.pitch } });
    out.hulls[rid] = { roll: ch.roll.filter((_, i) => i % 3 === 0).map(x => [x[0], x[1]]), pitch: ch.pitch.filter((_, i) => i % 3 === 0).map(x => [x[0], x[1]]) };
    /* the riders who stand keep their balance against the deck */
    const ride = new Set((Hh.riders || []).map(rd => Array.isArray(rd) ? rd[0] : rd)), rowers = new Set(m.rowers || []);
    for (const id of (m.aboard || [...ride]).filter(id => ride.has(id) && !rowers.has(id) && X.ids.includes(id))) { const win = (Hh.riders.find(rd => (Array.isArray(rd) ? rd[0] : rd) === id)), a0 = Array.isArray(win) ? win[1] : 0, a1 = Array.isArray(win) && win[2] != null ? win[2] : T;
      const at = t => { const i = Math.max(0, Math.min(ch.roll.length - 1, Math.round(t * 12))); return [ch.roll[i][1], ch.pitch[i][1]]; };
      X.move(id, 'mech', 'BALANCE', { id: hullEv.id, latency: 0.15 }, k => { for (let t = a0; t <= a1; t += 1 / 6) { const [ro, pi] = at(Math.max(0, t - 0.15)); k(t, { 'torso.roll': X.cl(-ro * 0.7, -0.16, 0.16), 'torso.lean': X.cl(pi * 0.6, -0.3, 0.38), 'hips.dy': -Math.min(1.2, Math.abs(ro) * 6) }, 'linear'); } k(a1 + 0.3, { 'torso.roll': 0, 'torso.lean': 0, 'hips.dy': 0 }); }, { label: 'keeps his feet against the deck', rigid: true }); } }
  /* the swimmers */
  for (const sw of m.swimmers || []) { if (!X.ids.includes(sw.actor)) continue; const id = sw.actor;
    X.move(id, 'mech', 'CARRIED BY THE SEA', { id: seaEv.id, latency: 0 }, k => { for (let t = sw.t0; t <= sw.t1; t += 1 / 6) { const s = X.at(id, t); if (!s) continue; const [sx, sz] = slope(s.p[0], s.p[2], t), c = Math.cos(s.h), n = Math.sin(s.h);
        k(t, { 'root.y': h(s.p[0], s.p[2], t) * 0.6, 'torso.lean': X.cl(Math.atan(sx * n + sz * c) * 1.2, -0.3, 0.38), 'torso.roll': X.cl(Math.atan(sx * c - sz * n) * 1.2, -0.16, 0.16) }, 'linear'); }
      k(sw.t1 + 0.4, { 'root.y': 0, 'torso.lean': 0, 'torso.roll': 0 }); }, { label: 'rides the swell', rigid: true }); }
  /* breaking crests: where the field's speed peaks at a hull or a swimmer */
  if (m.fx !== false) { const spots = [...(m.hulls || []).map(q => [q.pivot[0], q.pivot[2]]), ...(m.swimmers || []).map(sw => { const s = X.at(sw.actor, (sw.t0 + sw.t1) / 2); return s ? [s.p[0], s.p[2]] : null; }).filter(Boolean)];
    for (const [x, z] of spots) { let last = -9; for (let t = 0.5; t < T; t += 1 / 12) { const v = speed(x, z, t), l = L(t); if (l > 0.45 && v > 18 * l && t - last > 2.5) { last = t; X.ev({ lane: 'FX', t0: r3(t), t1: r3(t + 0.5), kind: 'SPLASH', label: 'a crest breaks', because: [{ id: seaEv.id, latency: r3(t) }], params: { at: [r3(x), 0, r3(z)], size: r3(l) } }); } } } }
  /* the sea's heat: an object of water whose source is the level x the field's speed at the stage's centre */
  const src = []; for (let i = 0; i < Math.floor(T * 12); i++) { const t = i / 12; src.push(r3(L(t) * Math.min(3, speed(0, 0, t) / 12))); }
  X.S.objects = X.S.objects || {}; X.S.objects[m.id || 'sea'] = { kind: 'water', material: 'water', at: [0, 5, 0], sourceSeries: src, room: true, affords: [], machine: 'SEA' };
  X.A.couplings = (X.A.couplings || []).filter(c => c.machine !== 'SEA');
  for (const sw of m.swimmers || []) X.A.couplings.push({ from: m.id || 'sea', to: sw.actor, via: 'water', t0: sw.t0, t1: sw.t1, env: true, machine: 'SEA' });
  for (const Hh of m.hulls || []) { X.S.objects[Hh.id || 'ship'] = X.S.objects[Hh.id || 'ship'] || { kind: 'ship', material: 'ship', at: Hh.pivot, affords: ['ride'], machine: 'SEA' }; X.A.couplings.push({ from: m.id || 'sea', to: Hh.id || 'ship', via: 'water', env: true, machine: 'SEA' }); }
  X.machine = Object.assign(X.machine || {}, { sea: out });
};
module.exports = MACH;
