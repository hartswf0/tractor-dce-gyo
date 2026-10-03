/* Polyphemus Seals the Cave (OD-B09-S06, Odyssey 9): the men have eaten the giant's cheeses and wait at the back of the cave. At dusk
   he comes in with a load of dry wood and throws it down with a crash; they scatter into the corners. He drives the flock in, sets the
   great stone in the door (twenty-two waggons would not shift it), milks his ewes and goats and lights the fire; and by its light he
   sees them: "Strangers, who are you?"

   The chain: dusk (SCENE) -> the wood thrown down (the giant's REACH, a SOUND: the crash) -> the men's startle and their crouch in the
   dark (REACT, a HOLD each with its reason) -> the flock driven in (HERD/WALK on the rams, caused by his entering) -> the stone set in
   the door (MOVE_STONE, the take's K2: the stone shown in the door as the heave ends) -> the thud (SOUND) -> the men's cower (POSTURE)
   -> the milking (CARESS on a ewe, a hand at a time) and the fire (REACH, a SIGHT: the cave lit) -> his eye on the men (TURN, ATTEND)
   -> his question (TALK on the voice's phrases) -> the men's flinch at the great voice; Odysseus stands (a HOLD: he will answer). */
'use strict';
const Ic = require('../intents-creature.js'), Ground = require('../ground.js');
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12, sc = M.scale || 1;
  const O = 'odysseus', E = [1, 2, 3, 4, 5].map(i => 'odysseus-s-expedition-' + i), MEN = [O, ...E], G = 'polyphemus', R = ['ram1', 'ram2', 'ram3'];
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c2 = clip(2), c3 = clip(3), c4 = clip(4);
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); }, gi = o => (intents.push({ actor: G, ...o }), o.id);
  const fl = (x, z) => Ground.at(M, x, z).y, gs = 1.4 * sc, door = [-10, 60, 215], fire = [-66, 30, 28];
  const tK1a = q(W('K1a')[0]), tK2 = q(W('K2')[0]), tK3 = q(W('K3')[0]), tK4 = q(W('K4')[0]);
  /* the giant's places: at the door (K1), a step in behind the flock (K1a), turned to the door (K2), by the pen (K3), turned on the men (K4) */
  const P = { k1: [-10, 150, Math.PI], k1a: [-10, 120, Math.PI], k2: [-10, 150, 0], k3: [70, 30, 2.2], k4: [40, 10, -2.2] };
  const pl = k => Ic.placeAt('polyphemus', gs, 'stand', { center: [P[k][0], P[k][1]], y: fl(P[k][0], P[k][1]), h: P[k][2] });
  const g1 = pl('k1'), g1a = pl('k1a'), g2 = pl('k2'), g3 = pl('k3'), g4 = pl('k4');
  const creatures = { [G]: { kind: 'polyphemus', scale: gs, at: g1.at, floor: g1.floor, present: [[0, T + 1]], procs: [], channels: {} } };
  const rK1 = { ram1: [40, 120, Math.PI], ram2: [-60, 110, Math.PI + 0.3], ram3: [10, 70, Math.PI] }, rK1a = { ram1: [95, -65, 0.4], ram2: [200, 30, 1.2], ram3: [150, -95, 0.8] };
  R.forEach(r => { const [x, z, h] = rK1[r], y = fl(x, z); creatures[r] = { kind: 'ram', scale: 1.5 * sc, colour: r === 'ram3' ? 'black' : 'white', at: [x, y, z, h], floor: y, present: [[0, T + 1]], procs: [], channels: {} }; });
  /* ── dusk: the wood thrown down ── */
  stimuli.push({ id: 'sDusk', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'dusk: the giant in the cave mouth with a load of dry wood', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  const tWood = q(Math.min(c1.at + 1.6, tK1a - 3.2));
  gi({ id: 'gWood', kind: 'REACH', t0: q(tWood - 0.8), t1: q(tWood + 0.6), target: [-40, 20, 120], label: 'throws the wood down inside the door', params: { hand: 'R' }, because: [{ id: 'sDusk' }] });
  stimuli.push({ id: 'sCrash', t0: tWood, t1: q(tWood + 0.4), kind: 'SOUND', label: 'the crash of the wood', actor: G, because: [{ id: 'gWood' }] });
  MEN.forEach((m, k) => I({ id: 'mStart' + k, actor: m, kind: 'REACT', t0: q(tWood + 0.15 + 0.06 * k), t1: q(tWood + 1.2 + 0.06 * k), label: 'the crash: they shrink into the back of the cave', params: { how: 'startle', lookAt: G }, because: [{ id: 'sCrash', latency: 0.15 + 0.06 * k }] }));
  MEN.forEach((m, k) => H({ id: 'hM0' + k, actor: m, t0: 0.3 + 0.08 * k, t1: q(tWood + 0.1), reason: 'hidden at the back among the cheese racks: the giant is home', params: { look: [[G, 2.0], [O, 0.8], [G, 2.0]], weight: true, offset: 0.3 * k }, because: [{ id: 'sDusk' }] }));
  /* ── the flock in ── */
  const tD0 = q(tWood + 1.0), tD1 = q(W('K1a')[1]);
  gi({ id: 'gDrive', kind: 'WALK', t0: tD0, t1: tD1, label: 'drives the ewes in before him', params: { path: [[tD0, g1.at[0], g1.at[2]], [tD1, g1a.at[0], g1a.at[2]]], y: g1a.at[1] }, because: [{ id: 'gWood' }] });
  R.forEach((r, j) => { const [x, z] = rK1[r], [x1, z1] = rK1a[r], t0 = q(tWood + 1.0 + 0.4 * j), t1 = q(W('K1a')[1] + 0.4 * j);
    intents.push({ id: 'rIn' + j, actor: r, kind: 'WALK', t0, t1, label: 'into the cave to the pen', params: { path: [[t0, x, z], [t1, x1, z1]], gait: 'walk' }, because: [{ id: 'gWood', latency: 1.0 + 0.4 * j }] });
    intents.push({ id: 'rGraze' + j, actor: r, kind: 'GRAZE', t0: q(t1 + 0.3), t1: T, label: 'in the pen', because: [{ id: 'rIn' + j }] }); });
  MEN.forEach((m, k) => H({ id: 'hM1' + k, actor: m, t0: q(tWood + 1.3 + 0.06 * k), t1: q(tK3 + 0.45), reason: 'not a breath: the flock goes past them into the pen, the giant behind it', params: { look: [[G, 1.8], ['ram' + (1 + k % 3), 1.0], [G, 1.8]], weight: true, offset: 0.3 * k }, because: [{ id: 'mStart' + k }] }));
  /* ── the stone ── */
  const tHeave = q(tK2 - 1.6);
  gi({ id: 'gTurnDoor', kind: 'TURN', t0: q(W('K1a')[1] + 0.2), t1: q(tHeave - 0.1), target: O, label: 'turns back to the door', params: { h: 0 }, because: [{ id: 'gDrive' }] });
  gi({ id: 'gStone', kind: 'MOVE_STONE', t0: tHeave, t1: q(tK2 + 1.2), target: [door[0] + 110, door[1], door[2] - 40], label: 'lifts the great stone and sets it in the door: twenty-two waggons would not shift it', params: { to: [door[0], door[2]], object: 'door-stone', piece: 'the great stone', lift: 6 }, because: [{ id: 'gTurnDoor' }, { id: 'v' + c2.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sThud', t0: q(tK2 + 0.6), t1: q(tK2 + 1.0), kind: 'SOUND', label: 'the stone in the door: the last of the light gone', actor: G, because: [{ id: 'gStone' }] });
  MEN.forEach((m, k) => I({ id: 'mCower' + k, actor: m, kind: 'POSTURE', t0: q(tK2 + 0.8 + 0.08 * k), t1: q(tK3 + 0.4), label: m === O ? 'crouched, watching' : 'pressed into the rock: shut in', params: { to: m === O ? 'crouch' : 'cower' }, because: [{ id: 'sThud', latency: 0.2 + 0.08 * k }] }));
  /* ── the milking, the fire ── */
  const tP0 = q(W('K2')[1] + 2.4), tP1 = q(tP0 + 3.6);
  gi({ id: 'gToPen', kind: 'WALK', t0: tP0, t1: tP1, label: 'to the pen, to milk', params: { path: [[tP0, g2.at[0], g2.at[2]], [tP1, g3.at[0], g3.at[2]]], y: g3.at[1] }, because: [{ id: 'gStone' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  const tMilk = q(tP1 + 0.3), tFire = q(Math.max(tMilk + 4.5, c3.at + c3.dur - 3.0));
  gi({ id: 'gMilk', kind: 'CARESS', t0: tMilk, t1: q(tFire - 0.6), target: 'ram1', label: 'milks the ewes and the goats, each in turn, and puts the lambs under their mothers', params: { strokes: 3 }, because: [{ id: 'gToPen' }] });
  gi({ id: 'gFire', kind: 'REACH', t0: q(tFire - 0.5), t1: q(tFire + 0.8), target: fire, label: 'lights the fire', params: { hand: 'L' }, because: [{ id: 'gMilk' }] });
  stimuli.push({ id: 'sLit', t0: q(tFire + 0.4), t1: q(tFire + 0.9), kind: 'SIGHT', label: 'the fire flares: the back of the cave is lit, and the men in it', because: [{ id: 'gFire' }] });
  MEN.forEach((m, k) => H({ id: 'hM2' + k, actor: m, t0: q(tK3 + 0.5), t1: q(tFire + 1.2), reason: 'shut in with him: they watch the great hands at the ewes', params: { look: [[G, 2.4], [door, 0.8], [G, 2.2]], weight: true, offset: 0.3 * k }, because: [{ id: 'mCower' + k }] }));
  MEN.forEach((m, k) => I({ id: 'mLit' + k, actor: m, kind: 'REACT', t0: q(tFire + 0.6 + 0.07 * k), t1: q(tFire + 1.6 + 0.07 * k), label: 'the light on them', params: { how: m === O ? 'turn' : 'flinch', lookAt: G }, because: [{ id: 'sLit', latency: 0.2 + 0.07 * k }] }));
  /* ── he sees them ── */
  gi({ id: 'gTurnMen', kind: 'TURN', t0: q(tK4 - 1.0), t1: q(W('K4')[1]), target: O, label: 'turns from the fire to the men', because: [{ id: 'sLit' }] });
  gi({ id: 'gSee', kind: 'ATTEND', t0: q(W('K4')[1] + 0.05), t1: T, target: O, label: 'the one eye on them', because: [{ id: 'gTurnMen' }] });
  gi({ id: 'gAsk', kind: 'TALK', t0: q(c4.at), t1: q(c4.at + c4.dur), utterance: c4.gi, label: 'Strangers, who are you? traders, or pirates?', because: [{ id: 'gTurnMen' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sVoice', t0: q(c4.at + 0.4), t1: q(c4.at + 0.9), kind: 'SOUND', label: 'the great voice', actor: G, because: [{ id: 'gAsk' }] });
  E.forEach((m, k) => I({ id: 'mFlinch' + k, actor: m, kind: 'REACT', t0: q(c4.at + 0.6 + 0.07 * k), t1: q(c4.at + 1.7 + 0.07 * k), label: 'their hearts broken by the voice', params: { how: 'flinch', lookAt: G }, because: [{ id: 'sVoice', latency: 0.2 + 0.07 * k }] }));
  I({ id: 'oStand', actor: O, kind: 'APPROACH', key: 'K4', t0: tK4, t1: q(W('K4')[1]), target: G, label: 'straightens: he will answer', because: [{ id: 'gTurnMen', latency: 0.2 }] });
  E.forEach((m, k) => H({ id: 'hM3' + k, actor: E[k], t0: q(tFire + 1.7 + 0.07 * k), t1: q(c4.at + 0.55), reason: 'seen', params: { look: [[G, 3.0], [O, 1.0]], weight: true, offset: 0.3 * k }, because: [{ id: 'mLit' + (k + 1) }] }));
  E.forEach((m, k) => H({ id: 'hM4' + k, actor: m, t0: q(c4.at + 1.8 + 0.07 * k), t1: T, reason: 'behind their captain, under the one eye', params: { look: [[G, 2.4], [O, 1.4]], weight: true, offset: 0.3 * k }, because: [{ id: 'mFlinch' + k }] }));
  H({ id: 'hO3', actor: O, t0: q(tFire + 1.7), t1: q(tK4 - 0.05), reason: 'seen: he does not hide his face', params: { look: [[G, 3.0]], weight: true }, because: [{ id: 'mLit0' }] });
  H({ id: 'hO4', actor: O, t0: q(W('K4')[1] + 0.05), t1: T, reason: 'he looks up into the eye: he will answer for them all', params: { look: [[G, 4.0]], weight: true }, because: [{ id: 'oStand' }] });
  return {
    type: 'machinery', title: 'Polyphemus Seals the Cave: the wood, the flock, the stone, the fire, the question',
    actors: { [O]: { role: 'the captain', body: 'minifig', principal: true }, ...Object.fromEntries(E.map(m => [m, { role: 'one of his men', body: 'minifig', group: 'crew' }])), [G]: { role: 'the giant (a rig)', body: 'prop', principal: true } },
    objects: { [G]: { kind: 'giant', material: 'flesh', at: [g3.at[0], 120 * sc, g3.at[2]], affords: ['seal', 'milk', 'ask'] }, 'door-stone': { kind: 'door', material: 'stone', at: [door[0] + 110, door[1], door[2] - 40], exit: true, affords: ['seal the cave'] }, fire: { kind: 'fire', material: 'fire', at: fire, affords: ['light'] } },
    authored: { intents, holds, stimuli, creatures, goals: { [O]: 'stay hidden; then answer', [G]: 'home: the flock, the milk, the fire' },
      couplings: [{ from: G, to: 'door-stone', via: 'stone', t0: tHeave, t1: q(tK2 + 1.2) }],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'stay hidden', base: 1.0, f: { 'after:sLit': -2.5 } }, { a: 'run for the door', base: -2.0, f: { 'after:sThud': -3 } }, { a: 'stand and answer', base: -2.0, f: { 'after:sLit': 3.0 } }],
        ...Object.fromEntries(E.map(m => [m, [{ a: 'keep still', base: 1.0, f: { 'threat:polyphemus': 0.6 } }, { a: 'run for the door', base: -1.5, f: { 'after:sCrash': 0.8, 'after:sThud': -3 } }, { a: 'cower', base: -0.5, f: { 'after:sThud': 2.0, 'after:sVoice': 1.0 } }]])) } },
      camera: { follow: true },
    },
  };
};
