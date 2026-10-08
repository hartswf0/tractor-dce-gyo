/* The Swineherd's Dogs (OD-B14-S01, Odyssey 14): the beggar comes up to Eumaeus's farm; four dogs rush him barking; he drops his
   staff and sits (the one thing that stops a dog); Eumaeus runs out shouting, scatters them with stones, and brings the stranger in to
   his own seat and a meal of two young pigs.

   Pursuit by quadrupeds on the dog rig (film-readymades/creatures.js 'dog'): the dogs see him (a SIGHT stimulus) and run at him (WALK,
   the run gait, each on its own path from where the take stages it to a ring short of him), barking (BARK) and stopping short when he
   sits. He drops the staff (SET_DOWN) and sits down where he stands (the take's move at K3, brought forward by ADVANCE to the moment the
   dogs come on, so the sit is caused by them). Eumaeus hears the barking (a SOUND), runs out (his move at K3) and throws (THROW, twice:
   each stone a STIMULUS in the air and a landing); each stone's landing scatters the dogs nearest it (WALK run away) and they stand off
   and then lie down (POSE). He leads the stranger in (K4) and gives him his own seat (GESTURE offer) and goes to the pigs (TOOL_WORK). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K3 = K('K3'), K4 = K('K4'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus-as-beggar', Eu = 'eumaeus', D = ['dog0', 'dog1', 'dog2', 'dog3'];
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c3 = clip(3), c4 = clip(4);
  const V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  /* where the take stages the dogs: at home (K1), round the beggar (K2's image), scattered (K3) */
  const home = [[80, 40, 2.8], [40, 80, 3.0], [120, 100, -2.8], [-40, 60, 2.4]], ring = [[50, 190], [-50, 180], [80, 230], [-125, 255]], off = [[150, 230], [-150, 210], [120, 170], [-170, 200]];
  const tSee = 1.3, tRush = 1.7, tStop = 4.2, tSit = q(tStop - 0.6), tRun = K3.win[0], tStone1 = q(w(V3, 'scatters', 9.4) - 0.4), tStone2 = q(w(V3, 'stones', 11.3) - 0.5), tSeat = q(w(V4, 'offers', 17.6)), tPigs = q(w(V4, 'prepares', 19.7));
  const creatures = Object.fromEntries(D.map((d, k) => [d, { kind: 'dog', scale: 0.75, place: { preset: 'stand', center: [home[k][0], home[k][1]], y: 8, h: home[k][2] }, present: [[0, 15.67]], colour: k === 1 ? 'black' : k === 3 ? 'white' : undefined }]));
  /* ── the stranger on the path; the dogs ── */
  stimuli.push({ id: 'sPath', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'a beggar coming up the path to the swineherd\'s farm', because: [] });
  holds.push({ id: 'hO0', actor: O, t0: 0.3, t1: tSee + 0.4, reason: 'coming up to the farm, the staff in his hand', params: { look: [[[40, 60, 110], 1.4], [D[0], 1.0]], weight: true, grip: 'R' }, because: [{ id: 'sPath' }, { id: 'v' + c1.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sStranger', t0: tSee, t1: tSee + 0.3, kind: 'SIGHT', label: 'the dogs see a stranger', because: [{ id: 'sPath' }] });
  D.forEach((d, k) => { const t0 = q(tRush + 0.12 * k), t1 = q(tStop + 0.15 * k);
    I({ id: 'dRush' + k, actor: d, kind: 'WALK', t0, t1, label: 'rushes at him', params: { gait: 'run', path: [[t0, home[k][0], home[k][1]], [t1, ring[k][0], ring[k][1]]] }, because: [{ id: 'sStranger' }] });
    I({ id: 'dBark' + k, actor: d, kind: 'BARK', target: O, t0: t0 + 0.2, t1: tStone1 + 0.4 + 0.3 * k, label: 'barks at him', params: { period: 0.42 + 0.05 * k }, because: [{ id: 'sStranger' }] }); });
  stimuli.push({ id: 'sBark', t0: tRush + 0.3, t1: tStone1 + 1.0, kind: 'SOUND', label: 'the dogs\' barking', because: [{ id: 'dBark0' }] });
  /* ── he drops the staff and sits ── */
  I({ id: 'oDrop', actor: O, kind: 'SET_DOWN', t0: q(tSit - 0.5), t1: tSit, label: 'lets the staff fall', params: { side: 'R', what: 'staff' }, because: [{ id: 'dRush0' }] });
  I({ id: 'oSit', actor: O, kind: 'ADVANCE', t0: tSit, t1: tSit + (K3.win[1] - K3.win[0]), label: 'sits down where he is: a dog will not bite a man sitting', params: { key: 'K3', arrive: q(tSit + 1.6) }, because: [{ id: 'oDrop' }] });
  I({ id: 'oSitDown', actor: O, kind: 'POSTURE', t0: q(tSit + 1.5), t1: K3.win[1], label: 'down on the ground', params: { to: 'sit', enter: 0.6, leave: 0.4 }, because: [{ id: 'oSit' }] });
  holds.push({ id: 'hO1', actor: O, t0: q(tSit + 1.8), t1: K4.win[0] - 0.1, reason: 'sitting still among the dogs: a chosen stillness', params: { look: [[D[0], 1.2], [D[2], 1.0], [Eu, 1.4]], still: true }, because: [{ id: 'oSit' }] });
  /* ── Eumaeus runs out; the stones ── */
  holds.push({ id: 'hEu0', actor: Eu, t0: 0.3, t1: q(tRush + 0.8), reason: 'at his work inside, cutting leather for sandals', params: { look: [[[160, 10, 0], 3.0]], weight: true }, because: [{ id: 'sPath' }] });
  I({ id: 'euHear', actor: Eu, kind: 'REACT', t0: q(tRush + 0.9), t1: q(tRush + 2.0), label: 'the barking', params: { how: 'turn', lookAt: O }, because: [{ id: 'sBark' }] });
  I({ id: 'euRun', actor: Eu, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: O, label: 'runs out, the leather dropped, shouting', because: [{ id: 'euHear' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  const stones = [[tStone1, 's1', [70, 20, 190], [0, 2]], [tStone2, 's2', [-10, 20, 185], [1, 3]]];
  stones.forEach(([t, sid, at, dogs], j) => {
    I({ id: 'euThrow' + j, actor: Eu, kind: 'THROW', target: at, t0: t, t1: t + 1.1, label: 'a stone at the dogs', params: { side: 'R' }, because: [{ id: j ? 'euThrow0' : 'euRun' }] });
    stimuli.push({ id: 'sLand' + j, t0: q(t + 0.9), t1: q(t + 1.1), kind: 'SOUND', label: 'the stone lands among the dogs', because: [{ id: 'euThrow' + j }] });
    for (const k of dogs) { const t0 = q(t + 1.0 + 0.1 * (k % 2)), t1 = q(t0 + 1.2);
      I({ id: 'dFlee' + k, actor: D[k], kind: 'WALK', t0, t1, label: 'scatters from the stone', params: { gait: 'run', path: [[t0, ring[k][0], ring[k][1]], [t1, off[k][0], off[k][1]]] }, because: [{ id: 'sLand' + j }] });
      I({ id: 'dDown' + k, actor: D[k], kind: 'POSE', t0: q(t1 + 0.8), t1: 15.6, label: 'lies down at a distance, ears back', params: { preset: 'lie', fade: 0.8 }, because: [{ id: 'dFlee' + k }] }); } });
  /* ── the welcome ── */
  I({ id: 'euLead', actor: Eu, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: O, label: 'brings the stranger in', because: [{ id: 'sLand1' }] });
  I({ id: 'oIn', actor: O, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: Eu, label: 'follows him in', because: [{ id: 'euLead' }] });
  I({ id: 'euSeat', actor: Eu, kind: 'GESTURE', target: O, t0: q(tSeat - 0.4), t1: q(tSeat + 1.6), label: 'his own seat of brushwood and a goatskin', params: { shape: 'offer', at: tSeat, side: 'R', amp: 0.9, hold: 0.6 }, because: [{ id: 'euLead' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  I({ id: 'oThanks', actor: O, kind: 'REACT', t0: q(tSeat + 0.5), t1: q(tSeat + 1.6), label: 'thanks him', params: { how: 'nod', lookAt: Eu }, because: [{ id: 'euSeat' }] });
  I({ id: 'euPigs', actor: Eu, kind: 'TOOL_WORK', t0: tPigs, t1: T - 0.3, label: 'two young pigs for the meal', params: { how: 'chop', period: 1.2 }, because: [{ id: 'euSeat' }] });
  holds.push({ id: 'hO2', actor: O, t0: q(tSeat + 1.7), t1: T, reason: 'seated in the swineherd\'s place, watching his kindness', params: { look: [[Eu, 2.4], [[150, 20, -5], 1.2]], weight: true }, because: [{ id: 'oThanks' }] });
  return {
    type: 'fight', title: 'The Swineherd\'s Dogs: the rush, the sit, the stones, the welcome',
    actors: { [O]: { role: 'the king as a beggar', body: 'minifig', principal: true, affect: { cunning: 0.7 } }, [Eu]: { role: 'the swineherd', body: 'minifig', principal: true }, ...Object.fromEntries(D.map(d => [d, { role: 'a guard dog', body: 'prop' }])) },
    objects: { staff: { kind: 'staff', material: 'wood', holder: O + ':R', affords: ['drop'] }, ...Object.fromEntries(D.map((d, k) => [d, { kind: 'dog', material: 'flesh', at: [home[k][0], 8, home[k][1]], affords: ['bite'] }])) },
    authored: { intents, holds, stimuli, creatures, goals: { [O]: 'come in unhurt and unknown', [Eu]: 'save the stranger; feed him' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'walk on', base: 1.0, f: { 'after:sStranger': -2.0 } }, { a: 'run', base: -2.5, f: { 'after:sStranger': 1.2 } }, { a: 'sit down', base: -2.0, f: { 'after:sStranger': 2.8, 'intent:SET_DOWN': 1.0 } }, { a: 'follow him in', base: -2.5, f: { 'after:sLand1': 3.2 } }],
        [Eu]: [{ a: 'work', base: 1.2, f: { 'after:sBark': -2.4 } }, { a: 'run out', base: -2.0, f: { 'after:sBark': 3.0 } }, { a: 'stone the dogs', base: -2.8, f: { 'after:sBark': 1.2, ['near:' + O + ':3']: 2.0, 'after:sLand1': -3 } }, { a: 'welcome him', base: -2.8, f: { 'after:sLand1': 3.4 } }],
      } },
      camera: { follow: true },
    },
  };
};
