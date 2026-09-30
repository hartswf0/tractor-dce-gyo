/* The Taunt (OD-B09-S11, Odyssey 9): the taunt from the ship, the thrown peak, the wave, the name, the curse, the second rock.

   Over the first score's sea, ship and rowers (tools/perform/scenes/_auto.js from the needs catalogue) the direction is laid: from the
   stern Odysseus jeers at the blind giant on the shore (who hears it: his head cocked toward the voice); the crew beg him to stop; the
   giant tears off a peak and hurls it; it lands ahead of the bow and the wave drives the ship back toward the shore; Odysseus poles her
   off, the crew row hard; further out he names himself, and the men grab at his arm; the giant remembers the prophecy (Telemus: at the
   hands of Odysseus), lifts his hands to Poseidon and curses him; a second, bigger rock falls astern and its wave carries them out.

   The timings are the needles' (tools/perform/machinery.js taunt, run by homeostat.couple): POLYPHEMUS's rage builds by ear on the
   stresses of the taunt and throws when it passes 0.7 in the take's window; the rock's flight lands it; the landing is a blow to the
   SEA whose peak is the wave's push on the hull; the CREW's fear loses strokes while they row; over 0.65 during the name a man grips
   his arm (a held GRIP); ODYSSEUS's pride rises on his own stresses and falls with the wave. */
'use strict';
const Ho = require('../homeostat.js'), Ma = require('../machinery.js');
module.exports = function author(M, X) {
  const N = require('../../../odyssey/perform/needs.json').scenes['OD-B09-S11'], base = require('./_auto.js')(M, X, N), A = base.authored;
  const K = id => M.keys.find(k => k.id === id), T = M.total, q = t => Math.round(t * 12) / 12, frozen = !!X.frozen;
  const K2 = K('K2'), K5 = K('K5'), O = 'odysseus', crew = Object.keys(M.H).filter(i => /crew/.test(i)), G = 'polyphemus';
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c4 = clip(4), c6 = clip(6), V2 = X.voiceOf(c2), V4 = X.voiceOf(c4), V6 = X.voiceOf(c6);
  const nm = V4.words.find(w => w.w === 'odysseus'), pr = V6.words.find(w => /prophecy/.test(w.w)), pos = V6.words.find(w => w.w === 'poseidon');
  const nameAt = nm ? nm.t : c4.at + 4, prayer = [pos ? pos.t - 1 : c6.at + 14, c6.at + c6.dur];
  const w1 = K2.win ? [K2.win[0], K2.t + 0.5] : [K2.t - 0.6, K2.t + 0.5], w2 = K5.win ? [K5.win[0], K5.t + 0.5] : [K5.t - 0.6, K5.t + 0.5];
  const spec = Ma.taunt({ total: T, stresses: V2.stresses.map(s => s.t), name: nameAt, prophecy: pr ? pr.t : c6.at + 1, prayer, throw1: w1, throw2: w2, row: [20, 28], flight: 1.4 + 0.8 + 2.2 });
  const run = Ho.couple(spec, { frozen }), c = run.events;
  /* the first score's generic giant intents, throws and plead are replaced; its sea is kept, its rowing clocks lose the needle's strokes */
  A.intents = A.intents.filter(I => I.actor !== G && !/GESTURE|HOLD_BACK/.test(I.kind));
  const stim = A.stimuli, I = o => (A.intents.push(o), o.id), S_ = o => (stim.push(o), o.id), gi = o => I({ actor: G, ...o });
  const needle = (id, t, unit, label, because) => S_({ id, t0: q(t), t1: q(t) + 0.3, kind: 'NEEDLE', label: unit + ': ' + label, because: because || [], params: { unit } });
  for (const st of run.steps) S_({ id: 'sStep' + st.unit + Math.round(st.t * 12), t0: q(st.t), t1: q(st.t) + 0.2, kind: 'UNISELECTOR', label: st.unit + ' out of its limits past its dwell: its uniselector steps to position ' + st.position, because: [] });
  V2.stresses.forEach((s, k) => S_({ id: 'sJeer' + k, t0: q(s.t), t1: q(s.t) + 0.3, kind: 'WORD', label: 'a jeer across the water', because: [{ id: 'v' + c2.gi }] }));
  if (nm) S_({ id: 'sName', t0: q(nm.t), t1: q(nm.t) + 0.4, kind: 'WORD', label: '"Odysseus, sacker of cities"', because: [{ id: 'v' + c4.gi }] });
  if (pr) S_({ id: 'sProphecy', t0: q(pr.t), t1: q(pr.t) + 0.4, kind: 'WORD', label: '"the old prophecy comes home"', because: [{ id: 'v' + c6.gi }] });
  if (pos) S_({ id: 'sPoseidon', t0: q(pos.t), t1: q(pos.t) + 0.4, kind: 'WORD', label: '"Hear me, Poseidon"', because: [{ id: 'v' + c6.gi }] });
  const throws = c.throws.slice(0, 2), sh = [-68, 160];
  throws.forEach((t0, k) => { const late = (c.late || []).includes(t0); needle('sRage' + k, t0, 'POLYPHEMUS', (late ? 'late: ' : '') + 'over 0.7: he tears off ' + (k ? 'a bigger rock' : 'a peak'), [{ id: k ? (pos ? 'sPoseidon' : 'v' + c6.gi) : 'sJeer' + (V2.stresses.length - 1) }]);
    const rel = t0 + 2.2, land = rel + 2.2, to = k ? [sh[0] - 20, 0, sh[1] + 160] : [sh[0] + 30, 0, sh[1] - 150];
    gi({ id: 'gThrow' + k, kind: 'THROW', t0: q(t0), t1: q(land), target: 'ship', label: k ? 'the second rock, bigger, two-handed' : 'a peak torn off and hurled at the voice', params: { to, flight: 2.2, prop: 'rock' + (k + 1) }, because: [{ id: 'sRage' + k }] });
    S_({ id: 'sLand' + k, t0: q(land), t1: q(land) + 0.4, kind: 'SOUND', label: k ? 'the rock astern: the wave carries them out' : 'the rock ahead of the bow: the wave drives them back', because: [{ id: 'gThrow' + k }] }); });
  /* the wave on the hull: an impulse and a push (toward the shore after the first, out to sea after the second), taken back by the oars */
  for (const m of [].concat(A.machinery || [])) { if (m.kind === 'SEA') { m.causes = (m.causes || []).concat(throws.map((t, k) => ({ t: t + 4.4, id: 'sLand' + k })));
      for (const h of m.hulls || []) h.impulses = throws.map((t, k) => ({ t: q(t + 4.4), roll: k ? 0.12 : 0.2, pitch: k ? -0.08 : 0.14, id: 'sLand' + k, label: k ? 'the second wave lifts the stern' : 'the wave throws the bow up', push: k ? [0, 70] : [0, -60], backAt: q(t + 4.4 + (k ? 6 : 4)), back: k ? 3 : 5 })); }
    if (m.kind === 'ROWING' && m.clock.t0 < 40) m.busy = Object.fromEntries(Object.keys(m.offsets).map(id => [id, c.lost.map(x => x.slice())])); }
  c.lost.forEach(([a], k) => needle('sLost' + k, a, 'CREW', 'over 0.6 while they row: a stroke lost', [{ id: 'sLand0' }]));
  /* the giant: listening by ear through the taunt, the throws, the name heard, the prophecy remembered, the prayer, the second rock */
  gi({ id: 'gListen', kind: 'ATTEND', t0: 0.8, t1: q(throws[0] || 17), target: O, label: 'the head cocked toward the voice over the water', because: [{ id: 'v' + c2.gi }] });
  gi({ id: 'gTalkName', kind: 'ATTEND', t0: q(c4.at), t1: q(c4.at + c4.dur), target: O, label: 'hears the name', because: [{ id: 'v' + c4.gi }] });
  gi({ id: 'gTalk', kind: 'TALK', t0: q(c6.at) - 0.2, t1: q(c6.at + c6.dur), utterance: c6.gi, label: 'the prophecy, and the curse', because: [{ id: 'v' + c6.gi, rel: 'realises' }] });
  if (pr) gi({ id: 'gRecog', kind: 'RECOGNISE', t0: q(pr.t), t1: q(prayer[0]) - 0.2, label: 'Telemus foretold it: he had waited for a great man, and it was this little one', because: [{ id: 'sProphecy' }] });
  gi({ id: 'gPray', kind: 'INVOKE', t0: q(prayer[0]), t1: q(prayer[1]) - 0.4, label: 'hands up to the starry sky: Poseidon, grant that he never comes home', because: [{ id: pr ? 'gRecog' : 'v' + c6.gi }] });
  /* Odysseus: the taunt (his gestures on its stresses), the pole-off, the name, the crew's hands on him */
  const iTaunt = A.intents.find(x => x.actor === O && x.utterance === c2.gi); if (iTaunt) { iTaunt.params = { ...(iTaunt.params || {}), shapes: ['taunt', 'point', 'taunt', 'fist'], amp: 1.2 }; iTaunt.label = 'the jeer across the water'; }
  const iName = A.intents.find(x => x.actor === O && x.utterance === c4.gi); if (iName) { iName.params = { ...(iName.params || {}), shapes: ['chest', 'point', 'chest'], amp: 1.3 }; iName.label = 'the name: Odysseus, sacker of cities'; }
  if (throws[0] != null) { I({ id: 'iPole', actor: O, kind: 'STRAIN', t0: q(throws[0] + 4.6), t1: q(throws[0] + 8.5), label: 'the long pole against the shore: off', because: [{ id: 'sLand0' }] });
    crew.forEach((m, k) => I({ id: 'iStagger' + k, actor: m, kind: 'REACT', t0: q(throws[0] + 4.5 + 0.08 * k), t1: q(throws[0] + 5.8), label: 'the deck bucks under the wave', params: { how: 'startle', lookAt: 'rock1' }, because: [{ id: 'sLand0' }] })); }
  crew.slice(0, 3).forEach((m, k) => I({ id: 'iPlead' + k, actor: m, kind: 'GESTURE', t0: q(3 + 3 * k), t1: q(3 + 3 * k + 2.4), label: 'why provoke him? he will crush the ship', params: { shape: 'plead', at: q(3.3 + 3 * k), side: 'R', hold: 1.4 }, because: [{ id: 'sJeer' + Math.max(0, V2.stresses.filter(x => x.t <= 3 + 3 * k).length - 1) }] }));
  c.grips.slice(0, 2).forEach((t, k) => { const m = crew[k]; needle('sFear' + k, t, 'CREW', 'over 0.65 as he names himself: ' + m + ' grabs his arm', [{ id: 'v' + c4.gi }]);
    I({ id: 'iGrab' + k, actor: m, kind: 'GRIP', t0: q(t), t1: q(t + 3.2), target: O, label: 'hands on his arm: enough', params: { point: 'arm', side: 'R', targetSide: k ? 'L' : 'R', answer: 'struggle' }, because: [{ id: 'sFear' + k }] }); });
  crew.forEach((m, k) => I({ id: 'iLookUp' + k, actor: m, kind: 'ATTEND', t0: q(prayer[0] + 0.5 + 0.2 * k), t1: q(prayer[0] + 6), target: G, label: 'the giant\'s hands raised: they know what a curse is', because: [{ id: 'gPray' }] }));
  I({ id: 'iHearCurse', actor: O, kind: 'ATTEND', t0: q(prayer[0] + 0.3), t1: q(prayer[1] - 0.5), target: G, label: 'hears himself cursed', because: [{ id: 'gPray' }] });
  const coupled = { frozen, units: run.units, hz: run.hz, x: run.x, drives: run.drives, W0: run.W0, W: run.W, steps: run.steps, events: c, model: 'tools/perform/machinery.js taunt' };
  const causal = { tau: 0.7, actions: {
    [O]: [{ a: 'jeer', base: 0.4, f: { 'speaking:odysseus': 1.5, 'after:sLand0': -1.2 } }, { a: 'pole off', base: -2.5, f: { 'after:sLand0': 3.0, 'after:iPole': -2 } }, { a: 'name himself', base: -2.2, f: { 'after:sName': 2.5 } }, { a: 'hear the curse', base: -3, f: { 'after:gPray': 3.5 } }],
    [G]: [{ a: 'listen', base: 0.6, f: { 'speaking:odysseus': 1.2 } }, { a: 'throw', base: -2.5, f: { 'after:sRage0': 2.8, 'after:sLand0': -3, ...(throws[1] ? { 'after:sRage1': 5.8 } : {}) } }, { a: 'remember', base: -3, f: { 'after:sProphecy': 3.4 } }, { a: 'pray', base: -3, f: { 'after:gPray': 4 } }],
    ...Object.fromEntries(crew.map(m => [m, [{ a: 'row', base: 0.5, f: { 'after:sLand0': 1.4 } }, { a: 'plead with him', base: -1, f: { 'speaking:odysseus': 1.6 } }, { a: 'grab his arm', base: -3, f: { 'after:sName': 2.6 } }, { a: 'look to the giant', base: -1.4, f: { 'threat:polyphemus': 0.8 } }]])) } };
  for (const [id, acts] of Object.entries((A.causal || {}).actions || {})) causal.actions[id] = (causal.actions[id] || []).concat(acts.filter(a => !(causal.actions[id] || []).some(b => b.a === a.a)));
  return { ...base, type: 'fight', title: 'The Taunt' + (frozen ? ' (uniselectors held)' : ''), authored: { ...A, coupled, causal } };
};
