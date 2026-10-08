/* The Name Nobody and the Stake (OD-B09-S08, Odyssey 9): four time skips on one set, the four-needle coupled homeostat.

   K1 night: Odysseus over the sleeping giant, his hand on the hilt; he looks to the door stone (no man could move it: kill him and they
   die in the cave) and the hand comes off. K2 dawn: the giant wakes, seizes two men and eats them, and drives the flock out past the
   stone, sealing it behind him. K3 day: the green olive trunk by the pen: Odysseus cuts a fathom, the men smooth it, he sharpens it and
   turns the point in the fire until it is hard. K4 dusk: the stake hidden under the dung, the lots cast: four chosen. K5 evening: the
   giant comes back; Odysseus lifts the bowl of dark wine up to him: "Drink, Cyclops... Nobody is my name"; the giant drinks.

   The timings are the needles' (tools/perform/machinery.js stake, run by homeostat.couple): ODYSSEUS's rage over the sleeper and its
   check at the stone (the hand off the hilt when it falls under 0.1), POLYPHEMUS's appetite (awake over 0.3, a seizure over 0.55, the
   wine a gulp at a time until it is under -0.2), the CREW's terror (a man bolts for the wall over 0.85 for a second; in the day the men
   must be calm enough to work), and the WORK (the stake's progress is its integral: cut, smoothed, sharpened, hardened). Variant
   'wine-weak' (the giant's appetite driven up: he drinks longer); X.frozen holds the uniselectors. */
'use strict';
const Ho = require('../homeostat.js'), Ma = require('../machinery.js'), Ic = require('../intents-creature.js'), Ground = require('../ground.js');
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), T = M.total, q = t => Math.round(t * 12) / 12, sc = M.scale || 1;
  const K1 = K('K1'), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5');
  const sw = k => (k === K1 ? 0 : k.win ? q((k.win[0] + k.win[1]) / 2) : q(k.t)), s2 = sw(K2), s3 = sw(K3), s4 = sw(K4), s5 = sw(K5);
  const variant = X.variant || null, frozen = !!X.frozen;
  const piece = re => (M.pieces || []).find(p => re.test(p.label)), ctr = p => p ? [(p.box[0] + p.box[3]) / 2, (p.box[1] + p.box[4]) / 2, (p.box[2] + p.box[5]) / 2] : null;
  const stonePc = piece(/great stone|door stone|stone$/i), stone = ctr(stonePc) || [0, 60, 140], firePc = piece(/^fire|hearth/i), fire = ctr(firePc) || [-57, 30, -28];
  const clip = M.clips.find(c => c.gi === 6) || M.clips.filter(c => c.kind === 'DIALOGUE').pop(), V = clip ? X.voiceOf(clip) : { words: [], phrases: [], stresses: [] };
  const nobodyW = V.words.find(w => w.w === 'nobody'), drinkW = V.words.find(w => w.w === 'drink');
  const spec = Ma.stake({ total: T, K: { night: [0.6, s2], dawn: [s2, s3], day: [s3, s4], dusk: [s4, s5], eve: [s5, T] }, stoneAt: 3.2, enter: 2.5, reach: 2.0, disturb: variant });
  const run = Ho.couple(spec, { frozen }), c = run.events;
  const O = 'odysseus', H = ['four-chosen-helpers-1', 'four-chosen-helpers-2', 'four-chosen-helpers-3', 'four-chosen-helpers-4'], C1 = 'crewman-1', C2 = 'crewman-2', G = 'polyphemus';
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), S_ = o => (stimuli.push(o), o.id), gi = o => (intents.push({ actor: G, ...o }), o.id);
  const needle = (id, t, unit, label, because) => S_({ id, t0: q(t), t1: q(t) + 0.3, kind: 'NEEDLE', label: unit + ': ' + label, because: because || [], params: { unit } });

  /* ── the scene's steps and the needles' crossings ── */
  S_({ id: 'sNight', t0: 0, t1: 0.5, kind: 'SCENE', label: 'night: the giant asleep among the flock, gorged', because: [] });
  S_({ id: 'sStone', t0: 3.2, t1: 3.6, kind: 'SIGHT', label: 'the door stone: no man could move it', because: [{ id: 'sNight' }] });
  if (c.hilt) needle('sHilt', c.hilt, 'ODYSSEUS', 'over 0.6 over the sleeper: the hand to the hilt', [{ id: 'sNight' }]);
  if (c.checked) needle('sCheck', c.checked, 'ODYSSEUS', 'under 0.1 after the stone: the impulse checked, stored', [{ id: 'sStone' }]);
  S_({ id: 'sDawn', t0: s2, t1: s2 + 0.4, kind: 'SCENE', label: 'dawn', because: [{ id: c.checked ? 'sCheck' : 'sNight' }] });
  if (c.wake) needle('sWake', c.wake, 'POLYPHEMUS', 'over 0.3: he wakes, hungry', [{ id: 'sDawn' }]);
  c.seizures.forEach((z, k) => needle('sHunger' + k, z.t, 'POLYPHEMUS', 'over 0.55: the hand goes out for a man', [{ id: k ? 'sHunger' + (k - 1) : 'sWake' }]));
  c.bolts.forEach((b, k) => needle('sBolt' + k, b, 'CREW', 'over 0.85 for a second: a man bolts for the wall', [{ id: 'sHunger' + Math.max(0, c.seizures.filter(z => z.t <= b).length - 1) }]));
  for (const st of run.steps) S_({ id: 'sStep' + st.unit + Math.round(st.t * 12), t0: q(st.t), t1: q(st.t) + 0.2, kind: 'UNISELECTOR', label: st.unit + ' out of its limits ' + JSON.stringify(st.limits) + ' past its dwell: the uniselector steps to position ' + st.position, because: [] });
  if (c.out) needle('sOut', c.out, 'POLYPHEMUS', 'fed: he drives the flock out', [{ id: 'sHunger' + (c.seizures.length - 1) }]);
  S_({ id: 'sDay', t0: s3, t1: s3 + 0.4, kind: 'SCENE', label: 'day: the cave shut, the giant with his flock; the olive trunk by the pen', because: [{ id: c.out ? 'sOut' : 'sDawn' }] });
  const PH = [['cut', 'the fathom cut from the trunk'], ['smooth', 'smoothed'], ['sharp', 'the point sharpened'], ['hard', 'the point hardened in the fire']];
  PH.forEach(([k, l], j) => { if (c.phases[k]) needle('sW' + k, c.phases[k], 'WORK', 'the stake: ' + l, [{ id: j ? 'sW' + PH[j - 1][0] : 'sDay' }]); });
  S_({ id: 'sDusk', t0: s4, t1: s4 + 0.4, kind: 'SCENE', label: 'dusk: the stake hidden, the lots', because: [{ id: c.phases.hard ? 'sWhard' : 'sDay' }] });
  S_({ id: 'sEve', t0: s5, t1: s5 + 0.4, kind: 'SCENE', label: 'evening: the stone rolled back, the giant in with his flock', because: [{ id: 'sDusk' }] });
  if (clip) S_({ id: 'sSpeech', t0: clip.at, t1: clip.at + clip.dur, kind: 'VOICE', label: '"Drink, Cyclops... Nobody is my name"', because: [{ id: 'v' + clip.gi, rel: 'realises' }] });
  if (nobodyW) S_({ id: 'sNobody', t0: q(nobodyW.t), t1: q(nobodyW.t) + 0.3, kind: 'WORD', label: '"Nobody" (the false name)', because: [{ id: 'sSpeech' }] });
  if (c.offer) needle('sResolve', c.offer, 'ODYSSEUS', 'over 0.5 with the giant seated: he steps up with the bowl', [{ id: 'sEve' }]);
  c.gulps.forEach((g, k) => needle('sGulp' + k, g, 'POLYPHEMUS', 'a gulp: the wine down the appetite', [{ id: k ? 'sGulp' + (k - 1) : 'sResolve' }]));
  if (c.sated) needle('sSated', c.sated, 'POLYPHEMUS', 'under -0.2: the wine has him', [{ id: 'sGulp' + (c.gulps.length - 1) }]);

  /* ── the giant: sprawled asleep (K1), on his feet at dawn (K2), out through the day, back at evening (K5) ── */
  const gs = 1.4 * sc, gK1 = [-20, -130], gK2 = [20, -110], gK5 = [-20, -80], fl = (x, z) => Ground.at(M, x, z).y;
  const pK1 = Ic.placeAt('polyphemus', gs, 'sprawl', { center: gK1, y: fl(...gK1), h: 0.4 }), pK2 = Ic.placeAt('polyphemus', gs, 'stand', { center: gK2, y: fl(...gK2), h: 0.5 }), pK5 = Ic.placeAt('polyphemus', gs, 'stand', { center: gK5, y: fl(...gK5), h: 0 });
  const span = (a, b, v) => [[a, v, 'step'], [b, v, 'step']], rootSpan = (tag, a, b, p) => ({ ['root.x@' + tag]: span(a, b, p[0]), ['root.y@' + tag]: span(a, b, p[1]), ['root.z@' + tag]: span(a, b, p[2]), ['root.h@' + tag]: span(a, b, p[3]) });
  const tWake = c.wake || s2 + 1.5, doorIn = [stone[0] + 20, stone[2] - 60];
  const creatures = { [G]: { kind: 'polyphemus', scale: gs, at: pK1.at, floor: pK1.floor, present: [[0, s3], [s5, T + 1]], procs: [{ type: 'preset', name: 'sprawl', from: 0, to: q(tWake) + 0.6, fade: 0.9 }], channels: {} } };
  gi({ id: 'gSleep', kind: 'SLEEP', t0: 0, t1: q(tWake), label: 'gorged, asleep: the slow breath', because: [{ id: 'sNight' }] });
  gi({ id: 'gWake', kind: 'ROAR', t0: q(tWake), t1: q(tWake) + 2, label: 'wakes and rises', params: { place: pK2.at, rise: 1.2, preset: 'stand' }, because: [{ id: 'sWake' }] });
  /* the two seized: the nearest of the men cowering (crewman-1, then crewman-2: the take hangs crewman-1 in his fist) */
  [C1, C2].forEach((m, k) => { const z = c.seizures[k]; if (!z) return; gi({ id: 'gEat' + k, kind: 'EAT', t0: q(z.t), t1: q(z.t) + 4.4, target: m, label: 'seizes ' + m + ' and eats him', params: { hand: 'R', reach: 0.9, lift: 90 * sc }, because: [{ id: 'sHunger' + k }] });
    I({ id: 'iSeized' + k, actor: m, kind: 'STRUGGLE', t0: q(z.t) + 0.9, t1: q(z.t) + 2.6, label: 'kicks in the fist', because: [{ id: 'gEat' + k }] }); });
  /* the flock out, the stone rolled aside and back */
  const tOut = c.out || s3 - 3.5;
  gi({ id: 'gStone', kind: 'MOVE_STONE', t0: q(tOut), t1: q(tOut) + 2.2, target: stone, label: 'rolls the stone aside, drives the flock out, seals it again', params: { to: [stone[0] + 70 * sc, stone[2]], object: 'door-stone' }, because: [{ id: 'sOut' }] });
  const rams = ['ram1', 'ram2', 'ram3'], rK2 = { ram1: [-10, 15, Math.PI], ram2: [40, 130, Math.PI], ram3: [0, 70, 3] }, rK5 = { ram1: [120, 165, 0], ram2: [-150, 30, 1] };
  rams.forEach((r, j) => { const [x, z, h] = rK2[r], y = fl(x, z); creatures[r] = { kind: 'ram', scale: 1.5 * sc, colour: r === 'ram3' ? 'black' : 'white', at: [x, y, z, h], floor: y, present: rK5[r] ? [[s2, s3], [s5, T + 1]] : [[s2, s3]], procs: [], channels: {} };
    intents.push({ id: 'rOut' + j, actor: r, kind: 'WALK', t0: q(tOut) + 0.6 + 0.4 * j, t1: s3 - 0.2, label: 'out past the stone to pasture', params: { path: [[q(tOut) + 0.6 + 0.4 * j, x, z], [s3 - 0.2, stone[0] + 10 * j, stone[2] + 90]], gait: 'walk' }, because: [{ id: 'gStone' }] });
    if (rK5[r]) { const [x5, z5, h5] = rK5[r], y5 = fl(x5, z5); Object.assign(creatures[r].channels, rootSpan('k5', s5, T + 1, [x5, y5, z5, h5])); intents.push({ id: 'rG' + j, actor: r, kind: 'GRAZE', t0: s5 + 1, t1: T, label: 'back in the fold', because: [{ id: 'sEve' }] }); } });
  gi({ id: 'gIn', kind: 'WALK', t0: s5, t1: s5 + 2.4, label: 'in with the flock, to his seat by the fire', params: { path: [[s5, doorIn[0], doorIn[1]], [s5 + 2.4, pK5.at[0], pK5.at[2]]], y: pK5.at[1] }, because: [{ id: 'sEve' }] });
  /* the walk in ends with his back to the men (he came from the door, past them); at his seat he turns round to the fire and to them,
     so the bowl is held up to his face and not to his back */
  gi({ id: 'gTurn', kind: 'TURN', t0: s5 + 3.0, t1: s5 + 4.4, target: O, label: 'turns round at his seat, to the fire and the men', because: [{ id: 'gIn' }] });
  if (c.offer) { gi({ id: 'gLook', kind: 'ATTEND', t0: q(c.offer) + 0.2, t1: q(c.take || c.offer + 2), target: O, label: 'the small man with a bowl held up', because: [{ id: 'sResolve' }] });
    if (c.take) { gi({ id: 'gTake', kind: 'REACH', t0: q(c.take) - 0.6, t1: q(c.take) + 0.6, target: O, label: 'takes the bowl from his hands', params: { hand: 'R', y: M.H && M.H[O] ? M.H[O] * 1.6 : 90 }, because: [{ id: 'sResolve' }] });
      gi({ id: 'gDrink', kind: 'DRINK', t0: q(c.take) + 0.6, t1: q((c.sated || c.take + 5) + 0.8), label: 'drinks it off', params: { gulps: Math.max(1, c.gulps.length) }, because: [{ id: 'gTake' }] }); } }
  if (clip) gi({ id: 'gHear', kind: 'LISTEN', t0: q(clip.at), t1: q(clip.at + clip.dur), target: O, label: 'hears the name', because: [{ id: 'sSpeech' }] });

  /* ── K1: Odysseus over the sleeper ── */
  holds.push({ id: 'hO1', actor: O, t0: 0.6, t1: (c.checked || 6) + 0.2, reason: 'over the sleeping giant, the hand on the hilt: where the liver is held', params: { look: [[G, 2.4], [stone, 1.2]], grip: 'R' }, because: [{ id: 'sNight' }] });
  I({ id: 'iStone', actor: O, kind: 'ATTEND', t0: 3.2, t1: 5.8, target: stone, label: 'the stone in the door: no man could move it', because: [{ id: 'sStone' }] });
  if (c.checked) I({ id: 'iCheck', actor: O, kind: 'DECIDE', t0: q(c.checked), t1: q(c.checked) + 1.8, label: 'the hand off the hilt: not now', because: [{ id: 'sCheck' }] });
  holds.push({ id: 'hO1b', actor: O, t0: (c.checked || 6) + 1.9, t1: s2 - 0.1, reason: 'the impulse stored: he waits for day', params: { look: [[G, 3], [H[0], 1.2]], weight: true }, because: [{ id: c.checked ? 'iCheck' : 'sStone' }] });
  [...H, C1, C2].forEach((m, k) => holds.push({ id: 'hM' + k, actor: m, t0: 0.6, t1: s2 - 0.1, reason: 'awake in the dark, afraid of the sleeper', params: { look: [[G, 2.4], [O, 1.4]], offset: 0.35 * k }, because: [{ id: 'sNight' }] }));
  /* ── K2: the crew cower; the bolts ── */
  [...H, O].forEach((m, k) => I({ id: 'iCower' + k, actor: m, kind: 'POSTURE', t0: q(tWake) + 0.2 + 0.1 * k, t1: q(tOut), label: 'back against the rock', params: { to: m === O ? 'crouch' : 'cower' }, because: [{ id: 'sWake' }] }));
  c.bolts.forEach((b, k) => { const who = H[k % H.length]; I({ id: 'iBolt' + k, actor: who, kind: 'RECOIL', t0: q(b), t1: q(b) + 1.3, label: 'bolts for the wall', params: { from: G }, because: [{ id: 'sBolt' + k }] }); });
  for (const st of run.steps.filter(s => s.unit === 'CREW' && s.t > s3)) I({ id: 'iRally' + Math.round(st.t * 12), actor: O, kind: 'SIGNAL', t0: q(st.t) + 0.1, t1: q(st.t) + 1.6, label: 'to work: steady', params: { how: 'go', to: H.slice(0, 2), lookAt: H[0], side: 'L' }, because: [{ id: 'sStep' + st.unit + Math.round(st.t * 12) }] });
  /* ── K3: the stake made (the work's phases are the WORK needle's thresholds) ── */
  const pC = c.phases.cut || s3 + 4, pS = c.phases.smooth || s3 + 7, pP = c.phases.sharp || s3 + 9, pH = c.phases.hard || s3 + 11;
  I({ id: 'iChop', actor: O, kind: 'TOOL_WORK', t0: s3 + 0.6, t1: q(pC), label: 'cuts a fathom from the green olive trunk', params: { how: 'chop', on: 'trunk', period: 1.1 }, because: [{ id: 'sDay' }] });
  [H[0], H[1]].forEach((m, k) => I({ id: 'iSmooth' + k, actor: m, kind: 'TOOL_WORK', t0: q(pC) + 0.2 + 0.2 * k, t1: q(pS), label: 'smooths it', params: { how: 'carve', on: 'stake', period: 0.8 }, because: [{ id: 'sWcut' }] }));
  I({ id: 'iSharpen', actor: O, kind: 'TOOL_WORK', t0: q(pS) + 0.1, t1: q(pP), label: 'sharpens the point', params: { how: 'carve', on: 'stake', period: 0.6 }, because: [{ id: 'sWsmooth' }] });
  I({ id: 'iHarden', actor: O, kind: 'HEAT', t0: q(pP) + 0.2, t1: Math.min(s4 - 0.2, q(pH) + 0.6), label: 'turns the point in the fire until it is hard', params: { glowAt: pH, glowId: 'sGlow8' }, because: [{ id: 'sWsharp' }] });
  [H[2], H[3]].forEach((m, k) => holds.push({ id: 'hW' + k, actor: m, t0: s3 + 0.4, t1: s4 - 0.1, reason: 'watching the work and the door', params: { look: [[O, 2.0], [stone, 1.4]], offset: 0.5 * k }, because: [{ id: 'sDay' }] }));
  /* ── K4: hidden under the dung; the lots ── */
  [H[0], H[1]].forEach((m, k) => I({ id: 'iHide' + k, actor: m, kind: 'SET_DOWN', t0: s4 + 0.4 + 0.3 * k, t1: s4 + 2.8, label: 'the stake under the dung', params: { side: 'R', what: 'stake' }, because: [{ id: 'sDusk' }] }));
  const lots = [s4 + 3.6, s4 + 4.6, s4 + 5.6, s4 + 6.6].filter(t => t < s5 - 0.6);
  I({ id: 'iLots', actor: O, kind: 'GAMBLE', t0: s4 + 3.2, t1: s5 - 0.4, label: 'the lots cast in the helmet', params: { throws: lots }, because: [{ id: 'sDusk' }] });
  H.forEach((m, k) => { if (lots[k] == null) return; I({ id: 'iChosen' + k, actor: m, kind: 'REACT', t0: q(lots[k]) + 0.4, t1: q(lots[k]) + 1.6, label: 'chosen', params: { how: k % 2 ? 'nod' : 'lean', lookAt: O }, because: [{ id: 'dice:' + O + ':' + k }] }); });
  /* ── K5: the offer, the name, the drink ── */
  if (c.offer) { I({ id: 'iOffer', actor: O, kind: 'GESTURE', t0: q(c.offer), t1: q(c.take || c.offer + 2) + 0.4, label: 'the bowl lifted over his head to the giant', params: { shape: 'offer', at: q(c.offer) + 0.3, side: 'R', amp: 1.2, hold: Math.max(0.8, (c.take || c.offer + 2) - c.offer - 0.4) }, because: [{ id: 'sResolve' }] });
    I({ id: 'iLift', actor: O, kind: 'STRAIN', t0: q(c.offer) + 0.5, t1: q(c.take || c.offer + 2), label: 'up on his toes to the great hand', because: [{ id: 'iOffer' }] }); }
  if (clip) I({ id: 'iName', actor: O, kind: 'DECLARE', t0: q(clip.at) - 0.3, t1: q(clip.at + clip.dur), target: G, utterance: clip.gi, label: 'contempt, the gift, the false name', params: { shapes: ['offer', 'chest', 'open'] }, because: [{ id: 'v' + clip.gi, rel: 'realises' }, ...(c.offer ? [{ id: 'sResolve', rel: 'realises' }] : [])] });
  H.forEach((m, k) => holds.push({ id: 'hE' + k, actor: m, t0: s5 + 0.4, t1: T, reason: 'the four chosen, still: the stake under the dung between them and him', params: { look: [[G, 2.2], [O, 1.8], [[30, 5, -170], 0.8]], offset: 0.4 * k }, because: [{ id: 'sEve' }] }));
  if (nobodyW) H.slice(0, 2).forEach((m, k) => I({ id: 'iNobody' + k, actor: m, kind: 'ATTEND', t0: q(nobodyW.t) + 0.2 + 0.1 * k, t1: q(nobodyW.t) + 1.6, target: O, label: 'a look to him at "Nobody"', because: [{ id: 'sNobody' }] }));

  /* the giant's appetite as his heat */
  const xP = t => run.x[1][Math.min(run.x[1].length - 1, Math.round(t * run.hz))], sourceSeries = []; for (let i = 0; i < Math.floor(T * 12); i++) sourceSeries.push(Math.round(Math.max(0, xP(i / 12) + 0.4) * 2.0 * 1000) / 1000);
  return {
    type: 'machinery', title: 'The Name Nobody and the Stake' + (variant || frozen ? ' (' + (variant || 'baseline') + (frozen ? ', uniselectors held' : ', regulated') + ')' : ''),
    actors: { [O]: { role: 'the leader', body: 'minifig', principal: true }, ...Object.fromEntries(H.map(m => [m, { role: 'one of the four chosen', body: 'minifig', group: 'crew' }])), [C1]: { role: 'eaten at dawn', body: 'minifig', group: 'crew' }, [C2]: { role: 'eaten at dawn', body: 'minifig', group: 'crew' }, [G]: { role: 'the giant (a rig: his appetite is the POLYPHEMUS needle)', body: 'prop' } },
    objects: { [G]: { kind: 'giant', material: 'flesh', at: [gK2[0], 120 * sc, gK2[1]], sourceSeries, affords: ['seize', 'eat', 'drink'] }, fire: { kind: 'fire', material: 'fire', at: fire, affords: ['harden the point'] },
      trunk: { kind: 'wood', material: 'wood', at: [230, 10, -20], affords: ['cut'] }, stake: { kind: 'stake', material: 'weapon', track: [[0, [230, 10, -20]], [s3 + 3, [100, 30, 0]], [s4 + 2, [30, 5, -170]]], touches: [O, H[0], H[1]], affords: ['cut', 'smooth', 'sharpen', 'harden', 'hide'] },
      'door-stone': { kind: 'door', material: 'stone', at: stone, exit: true, affords: ['seal the cave'] } },
    authored: { intents, holds, stimuli, creatures, goals: { [O]: 'a weapon made unseen, and the giant drunk', [G]: 'eat, and keep them' },
      couplings: [{ from: O, to: 'stake', via: 'weapon', t0: s3, t1: s4 + 2 }, { from: H[0], to: 'stake', via: 'weapon', t0: c.phases.cut || s3 + 4, t1: s4 + 2 }, { from: 'fire', to: 'stake', via: 'fire', t0: c.phases.sharp || s3 + 9, t1: (c.phases.hard || s3 + 11) + 0.6 }],
      coupled: { variant, frozen, units: run.units, hz: run.hz, x: run.x, drives: run.drives, W0: run.W0, W: run.W, steps: run.steps, events: { hilt: c.hilt, checked: c.checked, wake: c.wake, seizures: c.seizures, bolts: c.bolts, out: c.out, phases: c.phases, offer: c.offer, take: c.take, gulps: c.gulps, sated: c.sated }, model: 'tools/perform/machinery.js stake' },
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'kill him now', base: -1.0, f: { 'threat:polyphemus': -0.5, 'after:sStone': -2.5, 'after:sDawn': -3 } }, { a: 'wait', base: 0.6, f: { 'after:sStone': 1.2 } }, { a: 'cower', base: -2.0, f: { 'threat:polyphemus': 1.4, 'after:sDay': -2 } },
          { a: 'make the stake', base: -2.5, f: { 'after:sDay': 3.2, 'after:sDusk': -3 }, uses: ['stake', 'trunk'] }, { a: 'hide it, cast lots', base: -3, f: { 'after:sDusk': 3.5 } }, { a: 'offer the wine', base: -3, f: { 'after:sEve': 2.8, 'near:polyphemus:3': 0.6 } }],
        ...Object.fromEntries(H.map(m => [m, [{ a: 'keep still', base: 0.8, f: { 'threat:polyphemus': 0.6 } }, { a: 'run for the wall', base: -2.2, f: { 'threat:polyphemus': 1.8 } }, { a: 'work the stake', base: -2.4, f: { 'after:sWcut': 2.4, 'after:sDusk': -2 }, uses: ['stake'] }, { a: 'draw the lot', base: -3, f: { 'after:sDusk': 3 } }]])) } } },
  };
};
