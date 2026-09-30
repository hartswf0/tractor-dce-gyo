/* Hermes and the Moly (OD-B10-S05, Odyssey 10): Odysseus arms and goes alone toward Circe's house; Hermes, as a young man, steps into
   his path, pulls the herb of power from the earth and gives it to him, and tells him what to do when she strikes with her wand.

   A two-hander that is mostly instruction, with one charged thing handed over. Odysseus slings on his sword (ARM) and goes (a HOLD with
   its reason: alone, despite Eurylochus) down the path (the take's walk at K2, owned here). The young man in the path stops him dead
   (NOTICE, then a still HOLD). Hermes's first line is carried on its stresses (DECLARE: the open hand, the pointing, the pig mimed at
   "penned as pigs"); Odysseus flinches at his friends' fate (REACT). They close (K3). Hermes stoops and pulls the moly (TOOL_WORK dig),
   holds it up at "moly" (GESTURE show: the insert), and gives it at "milk" (OFFER, TAKE: the hands solved to one meeting point, a GRIP
   SYNC contact); Odysseus looks at it in his hand. The instruction rehearses a fight the body should pre-enact without doing it: at
   "draw your sword" Odysseus's hand goes to the hilt (GESTURE fist, small), at "oath" he nods; Hermes mimes the wand's stroke (chop) and
   the rush (point) and the oath (oath). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', H = 'hermes-as-young-man';
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c3 = clip(3), c4 = clip(4), c5 = clip(5);
  const V1 = X.voiceOf(c1), V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), V5 = X.voiceOf(c5), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tArms = q(w(V1, 'arms', 2.1)), tPigs = q(w(V3, 'pigs', 22.3)), tHerb = q(w(V4, 'herb', 31.1)), tMoly = q(w(V4, 'moly', 36.0)), tMilk = q(w(V4, 'milk', 40.6));
  const tStrike = q(w(V5, 'strikes', 49.0)), tSword = q(w(V5, 'sword', 51.9)), tRush = q(w(V5, 'rush', 52.5)), tOath = q(w(V5, 'oath', 59.4)), tNaked = q(w(V5, 'naked', 64.9));
  /* ── he goes alone ── */
  stimuli.push({ id: 'sPath', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the path up from the ship through the oak woods toward Circe\'s house', because: [] });
  I({ id: 'oArm', actor: O, kind: 'ARM', t0: q(tArms - 0.2), t1: q(tArms + 1.6), label: 'slings on his sword', params: { side: 'R' }, because: [{ id: 'v' + c1.gi, rel: 'realises' }, { id: 'sPath' }] });
  holds.push({ id: 'hO0', actor: O, t0: q(tArms + 1.7), t1: K2.win[0] - 0.1, reason: 'alone, despite Eurylochus: he goes for his men', params: { look: [[[-39, 60, -200], 2.4], [[-39, 60, 330], 0.9]], weight: true }, because: [{ id: 'oArm' }] });
  I({ id: 'oGo', actor: O, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: [-39, 40, -200], label: 'up the path', because: [{ id: 'hO0' }] });
  /* ── the young man in the path ── */
  stimuli.push({ id: 'sStranger', t0: K2.win[1] - 0.2, t1: K2.win[1] + 0.1, kind: 'SIGHT', label: 'a young man in the path, the first down on his lip', actor: H, because: [{ id: 'oGo' }] });
  I({ id: 'oStop', actor: O, kind: 'NOTICE', target: H, t0: K2.win[1], t1: K2.win[1] + 1.4, label: 'stopped dead', params: { gazeHold: 1.0 }, because: [{ id: 'sStranger' }] });
  I({ id: 'hWhere', actor: H, kind: 'DECLARE', target: O, utterance: c3.gi, t0: c3.at - 0.2, t1: c3.at + c3.dur, label: 'where now, unlucky man? your friends are penned as pigs', params: { shapes: ['open', 'point', 'describe', 'point', 'mime', 'chop'], side: 'R' }, because: [{ id: 'v' + c3.gi, rel: 'realises' }, { id: 'oGo' }] });
  I({ id: 'oListen', actor: O, kind: 'LISTEN', target: H, t0: K2.win[1] + 1.5, t1: tPigs - 0.1, label: 'hears the stranger out', params: { nods: [] }, because: [{ id: 'hWhere' }] });
  stimuli.push({ id: 'sPigs', t0: tPigs, t1: tPigs + 0.3, kind: 'WORD', label: '"penned as pigs"', actor: H, because: [{ id: 'hWhere' }] });
  I({ id: 'oFlinch', actor: O, kind: 'REACT', t0: tPigs + 0.25, t1: tPigs + 1.3, label: 'his men, pigs', params: { how: 'flinch', lookAt: H }, because: [{ id: 'sPigs' }] });
  holds.push({ id: 'hO1', actor: O, t0: tPigs + 1.4, t1: K3.win[0] - 0.1, reason: 'and he means to go on', params: { look: [[H, 2.2], [[-39, 60, -200], 0.8]], weight: true }, because: [{ id: 'oFlinch' }] });
  /* ── the moly ── */
  I({ id: 'hClose', actor: H, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: O, label: 'a step to him', because: [{ id: 'hO1' }] });
  I({ id: 'oClose', actor: O, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: H, label: 'a step to him', because: [{ id: 'hClose' }] });
  I({ id: 'hDig', actor: H, kind: 'TOOL_WORK', t0: q(tHerb - 1.6), t1: q(tHerb + 0.6), label: 'stoops and pulls the herb from the earth', params: { how: 'dig', period: 0.8 }, because: [{ id: 'hClose' }] });
  I({ id: 'hMoly', actor: H, kind: 'DECLARE', target: O, utterance: c4.gi, t0: c4.at - 0.2, t1: c4.at + c4.dur, label: 'take this herb of power: the gods call it moly', params: { shapes: ['offer', 'show', 'describe', 'show', 'point'], side: 'L' }, because: [{ id: 'v' + c4.gi, rel: 'realises' }, { id: 'hClose' }] });
  I({ id: 'hShow', actor: H, kind: 'GESTURE', target: O, t0: q(tMoly - 0.4), t1: q(tMoly + 2.2), label: 'holds it up: black at the root, the flower white as milk', params: { shape: 'show', at: tMoly, side: 'R', amp: 1.0, hold: 1.6 }, because: [{ id: 'hDig' }] });
  I({ id: 'oLook', actor: O, kind: 'ATTEND', target: H, t0: q(tMoly - 0.2), t1: q(tMilk - 0.6), label: 'on the herb in the god\'s hand', because: [{ id: 'hShow' }] });
  I({ id: 'hGive', actor: H, kind: 'OFFER', target: O, t0: q(tMilk - 0.9), t1: q(tMilk + 1.2), label: 'gives him the moly', params: { with: 'oTake' }, because: [{ id: 'hShow' }] });
  I({ id: 'oTake', actor: O, kind: 'TAKE', target: H, t0: q(tMilk - 0.9), t1: q(tMilk + 1.2), label: 'takes it', params: { at: q(tMilk + 0.2), prop: 'moly', reach: 0.6 }, because: [{ id: 'hGive' }] });
  holds.push({ id: 'hO2', actor: O, t0: q(tMilk + 1.3), t1: c5.at - 0.1, reason: 'the herb in his hand: hard for mortal men to dig', params: { look: [[H, 1.6], [[-30, 30, 60], 1.2], [H, 1.4]], weight: true, grip: 'R' }, because: [{ id: 'oTake' }] });
  /* ── the instruction: a fight pre-enacted ── */
  I({ id: 'hPlan', actor: H, kind: 'DECLARE', target: O, utterance: c5.gi, t0: c5.at - 0.2, t1: c5.at + c5.dur, label: 'when she strikes with her wand, draw and rush her; make her swear the oath', params: { shapes: ['chop', 'fist', 'point', 'dismiss', 'oath', 'chop'], side: 'R' }, because: [{ id: 'v' + c5.gi, rel: 'realises' }, { id: 'oTake' }] });
  I({ id: 'oListen2', actor: O, kind: 'LISTEN', target: H, t0: c5.at, t1: q(tSword - 0.3), label: 'hears the plan', params: { nods: [q(tStrike + 0.6)] }, because: [{ id: 'hPlan' }] });
  I({ id: 'oHilt', actor: O, kind: 'GESTURE', t0: q(tSword - 0.2), t1: q(tRush + 1.2), label: 'the hand goes to the hilt at "draw your sword" (and stays there)', params: { shape: 'fist', at: tSword, side: 'L', amp: 0.45, hold: 1.0 }, because: [{ id: 'hPlan' }] });
  I({ id: 'oListen3', actor: O, kind: 'LISTEN', target: H, t0: q(tRush + 1.3), t1: c5.at + c5.dur, label: 'the oath, the bed, the danger', params: { nods: [q(tOath + 0.3), q(tNaked + 0.8)] }, because: [{ id: 'hPlan' }] });
  holds.push({ id: 'hEnd', actor: O, t0: c5.at + c5.dur + 0.1, t1: T, reason: 'he has it: the herb and the plan', params: { look: [[H, 1.6], [[-39, 60, -200], 1.8]], weight: true }, because: [{ id: 'hPlan' }] });
  holds.push({ id: 'hHEnd', actor: H, t0: c5.at + c5.dur + 0.1, t1: T, reason: 'the god has said it all', params: { look: [[O, 2.4]], weight: true }, because: [{ id: 'hPlan' }] });
  return {
    type: 'dialogue', title: 'Hermes and the Moly: the path, the herb, the plan',
    actors: { [O]: { role: 'the captain, alone', body: 'minifig', principal: true, affect: { weight: 0.5 } }, [H]: { role: 'a god as a young man', body: 'minifig', principal: true } },
    objects: { moly: { kind: 'herb', material: 'plant', holder: H + ':R', affords: ['give', 'carry'] }, sword: { kind: 'sword', material: 'weapon', holder: O + ':R', affords: ['draw'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'free his men', [H]: 'arm him against Circe' },
      couplings: [{ from: H, to: 'moly', via: 'plant', t0: tHerb - 1.6, t1: tMilk + 0.3 }, { from: 'moly', to: O, via: 'plant', t0: tMilk, t1: T }],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'go on to the house', base: 1.0, f: { 'after:sStranger': -1.6 } }, { a: 'hear him', base: -1.0, f: { 'after:sStranger': 2.2 } }, { a: 'turn back', base: -3.0, f: { 'after:sPigs': 0.6 } }, { a: 'take the herb', base: -2.8, f: { 'after:hShow': 3.2, 'after:oTake': -4 } }, { a: 'rehearse the fight', base: -2.6, f: { 'after:oTake': 2.4, 'intent:GESTURE': 1.0 } }],
        [H]: [{ a: 'warn him', base: 0.8, f: { 'after:hPlan': -1 } }, { a: 'give the herb', base: -2.2, f: { 'after:sPigs': 2.4, 'after:oTake': -4 } }, { a: 'teach the plan', base: -2.2, f: { 'after:oTake': 3.2 } }],
      } },
      camera: { follow: true },
    },
  };
};
