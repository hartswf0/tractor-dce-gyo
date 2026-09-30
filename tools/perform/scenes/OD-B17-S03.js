/* Argos (OD-B17-S03, Odyssey 17): the dog on the dung heap knows his master after twenty years, and dies.

   Almost nothing moves, and each thing that does is caused. The dog lies neglected by the palace gate, breathing slowly. A step and a
   voice come up the path with the swineherd's: the dog lifts his head to them and keeps it on the beggar as he comes (WATCH, on the
   dog rig: film-readymades/creatures.js 'dog'); at the name the voice gives him he drops his ears and his tail beats, weaker as it goes
   (EARS, WAG), for he cannot rise and come to him. Odysseus sees him (NOTICE) and holds (a HOLD with its reason: he must not be known):
   he comes no nearer than the path allows; at "turns aside" he turns from the dog to Eumaeus and hides the tear (WEEP) and asks about
   the animal (GESTURE open); Eumaeus shows the dog and tells of him (GESTURE show). They go on toward the gate (the take's walk at K4);
   the dog's head follows him to the last, then drops: the breath stops, and he rolls onto his side (DIE on the rig), dead once he has
   seen his master. A HOLD with the reason 'dead' keeps the stillness chosen.

   Causal chain: sStep (his step and voice) -> WATCH -> sKnown (the name: the dog knows him) -> EARS, WAG -> Odysseus's NOTICE ->
   HOLD (he must not be known) -> turns aside (sTurn) -> WEEP -> ask -> Eumaeus's answer -> the walk in -> sGone (out of the dog's
   sight) -> DIE -> dead. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K3 = K('K3'), K4 = K('K4'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus-as-beggar', E = 'eumaeus', D = 'argos';
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c3 = clip(3), c4 = clip(4);
  const V1 = X.voiceOf(c1), V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tSees = q(w(V1, 'sees', 3.9)), tName = q(w(V1, 'argos', 5.6)), tTurn = q(w(V3, 'turns', 11.8)), tTear = q(w(V3, 'hide', 13.3)), tAsk = q(w(V3, 'asking', 16.0));
  const tDies = q(w(V4, 'dies', 23.8)), gone = K4.win[1];
  /* ── the dog on the dung heap ── */
  stimuli.push({ id: 'sGate', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'by the palace gate: an old dog on the dung heap, neglected', because: [] });
  I({ id: 'dBreath', actor: D, kind: 'BREATHE', t0: 0.1, t1: tDies, label: 'the slow breath of an old dog', params: { period: 2.6, depth: 2.2 }, because: [{ id: 'sGate' }] });
  stimuli.push({ id: 'sStep', t0: 1.5, t1: 1.9, kind: 'SOUND', label: 'a step and a voice on the path, with the swineherd\'s', actor: O, because: [{ id: 'sGate' }] });
  I({ id: 'dWatch1', actor: D, kind: 'WATCH', target: O, t0: 1.9, t1: K3.win[0], label: 'the head lifted to the beggar coming up the path', params: { lift: 0.4, hold: true }, because: [{ id: 'sStep' }] });
  stimuli.push({ id: 'sKnown', t0: tName - 0.3, t1: tName, kind: 'SIGHT', label: 'the dog knows him', actor: D, because: [{ id: 'dWatch1' }] });
  I({ id: 'dEars', actor: D, kind: 'EARS', t0: tName, t1: tDies, label: 'drops his ears: he cannot rise and come to him', params: { how: 'drop' }, because: [{ id: 'sKnown' }] });
  I({ id: 'dWag', actor: D, kind: 'WAG', t0: tName + 0.3, t1: q(tAsk + 1.5), label: 'the tail beats, weaker as it goes', params: { period: 0.55, amp: 0.5, fade: 0.25, lift: 0.2 }, because: [{ id: 'sKnown' }] });
  I({ id: 'dWatch2', actor: D, kind: 'WATCH', target: O, t0: K3.win[0], t1: gone + 1.6, label: 'the head kept on him as he goes by', params: { lift: 0.3, hold: true }, because: [{ id: 'sKnown' }] });
  /* ── Odysseus: he sees, he must not be known ── */
  holds.push({ id: 'hO0', actor: O, t0: 0.3, t1: tSees - 0.1, reason: 'coming up to his own gate in rags, the swineherd beside him', params: { look: [[E, 1.6], ['the palace gate', 2.2]], weight: true }, because: [{ id: 'sGate' }] });
  I({ id: 'oSees', actor: O, kind: 'NOTICE', target: D, t0: tSees, t1: tSees + 2.2, label: 'the old dog: his own', params: { gazeHold: 1.4 }, because: [{ id: 'dWatch1' }, { id: 'v1', rel: 'realises' }] });
  holds.push({ id: 'hO1', actor: O, t0: tSees + 2.3, t1: K3.win[0] - 0.1, reason: 'he cannot go to him: a beggar must not know the king\'s dog', params: { look: [[D, 2.4], [E, 0.8], [D, 1.8]], weight: true }, because: [{ id: 'oSees' }] });
  I({ id: 'oWalk3', actor: O, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: D, label: 'on up the path, past him', because: [{ id: 'hO1' }] });
  I({ id: 'oTurn', actor: O, kind: 'REACT', t0: tTurn, t1: tTurn + 1.2, label: 'turns aside from the dog', params: { how: 'turn', lookAt: E }, because: [{ id: 'dWag' }, { id: 'v3', rel: 'realises' }] });
  stimuli.push({ id: 'sTurn', t0: tTurn + 0.3, t1: tTurn + 0.6, kind: 'SIGHT', label: 'his back to the dog: the face hidden', actor: O, because: [{ id: 'oTurn' }] });
  I({ id: 'oTear', actor: O, kind: 'WEEP', t0: tTear - 0.3, t1: tTear + 1.5, label: 'wipes away the tear unseen', params: { hand: 'R' }, because: [{ id: 'sTurn' }] });
  I({ id: 'oAsk', actor: O, kind: 'GESTURE', t0: tAsk - 0.4, t1: tAsk + 1.6, target: E, label: 'asks about the dog: a fine one, left on the dung?', params: { shape: 'open', at: tAsk, side: 'L', amp: 0.7, hold: 0.5 }, because: [{ id: 'oTear' }] });
  /* ── Eumaeus: he walks with him, and answers ── */
  holds.push({ id: 'hE0', actor: E, t0: 0.3, t1: K3.win[0] - 0.1, reason: 'bringing the stranger to the palace', params: { look: [[O, 1.8], ['the palace gate', 1.6]], weight: true, offset: 0.4 }, because: [{ id: 'sGate' }] });
  I({ id: 'eWalk3', actor: E, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: O, label: 'on with him', because: [{ id: 'hE0' }] });
  I({ id: 'eListen', actor: E, kind: 'LISTEN', target: O, t0: tAsk - 0.3, t1: tAsk + 1.8, label: 'hears the question', params: { nods: [tAsk + 1.2] }, because: [{ id: 'oAsk' }] });
  I({ id: 'eShow', actor: E, kind: 'GESTURE', t0: tAsk + 1.8, t1: K4.win[0] - 0.05, target: D, label: 'the dog of a man who died far away: swift once, and now no one cares for him', params: { shape: 'show', at: tAsk + 2.1, side: 'R', amp: 0.8, hold: 0.4 }, because: [{ id: 'eListen' }] });
  holds.push({ id: 'hO2', actor: O, t0: tTear + 1.6, t1: K4.win[0] - 0.1, reason: 'turned from the dog while the swineherd tells of him', params: { look: [[E, 2.2], [D, 0.5], [E, 1.4]], weight: true }, because: [{ id: 'oTear' }] });
  /* ── they go in; the dog dies ── */
  I({ id: 'eLead', actor: E, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: 'the palace gate', label: 'leads him on to the hall', because: [{ id: 'eShow' }] });
  I({ id: 'oIn', actor: O, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: 'the palace gate', label: 'goes in without a look back', because: [{ id: 'eLead' }] });
  stimuli.push({ id: 'sGone', t0: gone + 1.6, t1: gone + 1.9, kind: 'SIGHT', label: 'he is gone in: the dog has seen his master', actor: D, because: [{ id: 'oIn' }] });
  I({ id: 'dDie', actor: D, kind: 'DIE', t0: tDies - 0.5, t1: tDies + 2.2, label: 'dies, having seen Odysseus after twenty years', params: { roll: 1.2, sink: 0.55 }, because: [{ id: 'sGone' }, { id: 'v4', rel: 'realises' }] });
  holds.push({ id: 'hDead', actor: D, t0: tDies + 2.3, t1: T, reason: 'dead: the breath stopped', params: { still: true }, because: [{ id: 'dDie' }] });
  holds.push({ id: 'hO3', actor: O, t0: K4.win[1] + 0.2, t1: T, reason: 'at the door of his own hall: the next thing is the suitors', params: { look: [['the palace gate', 2.6], [E, 1.4]], weight: true }, because: [{ id: 'oIn' }] });
  holds.push({ id: 'hE3', actor: E, t0: K4.win[1] + 0.2, t1: T, reason: 'at the door, to take him in', params: { look: [[O, 2.0], ['the palace gate', 1.6]], weight: true, offset: 0.5 }, because: [{ id: 'eLead' }] });
  return {
    type: 'revelation', title: 'Argos: the dog knows him, and dies',
    actors: { [O]: { role: 'the king in rags', body: 'minifig', principal: true, affect: { weight: 0.8, cunning: 0.6 } }, [E]: { role: 'the swineherd', body: 'minifig' }, [D]: { role: 'the old dog', body: 'prop', principal: true } },
    objects: { [D]: { kind: 'dog', material: 'flesh', at: [135, 8, -100], affords: ['know'] }, dung: { kind: 'dung heap', material: 'earth', at: [135, 8, -100], affords: [] }, gate: { kind: 'door', material: 'door', at: [-60, 40, -260], exit: true, affords: ['enter'] } },
    authored: {
      intents, holds, stimuli,
      creatures: { [D]: { kind: 'dog', scale: 1.3, place: { preset: 'lie', center: [130, -100], y: 8, h: Math.atan2(-170, 230) }, procs: [{ type: 'preset', name: 'lie', from: 0, to: T + 1, fade: 0 }] } },
      goals: { [O]: 'pass unknown', [E]: 'bring the stranger to the hall', [D]: 'his master' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'walk on as a beggar', base: 1.0, f: { 'after:sKnown': -0.6 } }, { a: 'go to the dog', base: -2.5, f: { 'after:sKnown': 2.4, 'near:argos:2': 0.8, 'after:sTurn': -3 } }, { a: 'turn aside', base: -2.2, f: { 'after:sKnown': 1.6, 'intent:REACT': 2.0 } },
          { a: 'hide the tear', base: -2.6, f: { 'after:sTurn': 3.0, 'intent:WEEP': 1.5 } }, { a: 'ask about him', base: -2.8, f: { 'after:sTurn': 2.2, 'intent:GESTURE': 2.0 } }, { a: 'go in', base: -2.0, f: { 'after:v3': 1.8, 'after:sGone': 1.2 } }],
        [E]: [{ a: 'lead on', base: 1.0, f: {} }, { a: 'answer', base: -2.0, f: { 'after:v3': 2.6, 'intent:GESTURE': 1.2 } }, { a: 'watch the stranger', base: -0.6, f: { 'after:sTurn': 1.2 } }],
      } },
      camera: { follow: true },
    },
  };
};
