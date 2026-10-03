/* The Cretan Lie Meets Its Match (OD-B13-S03, Odyssey 13): Odysseus wakes on the shore of Phorcys's harbour and does not know his own
   land. Athena, come as a young shepherd, tells him it is Ithaca; his heart leaps and he lets nothing show, and lies to her: a Cretan,
   a man-slayer fleeing on a Phoenician ship. She smiles, takes her own shape and names herself: cunning trickster, even in your own
   land you will not lay your lies aside; we two are alike. He reproaches her: where was she all the years since Troy? And he
   understands: Poseidon's anger kept her apart, and she hid him to keep him alive.

   The chain: the shore (SCENE) -> the shepherd's word "Ithaca" (GESTURE show, a WORD) -> his NOTICE (the heart leaps) -> his HOLD
   (the face kept still: a reason) -> his lie (GESTURE describe, caused by the hold: armour of fiction) -> her laugh at it (REACT) ->
   she steps in, her own shape (the take's K2, her APPROACH; a SIGHT: the goddess) -> his startle -> her DECLARE (the voice's turn) ->
   his DECIDE to answer -> his step and his reproach (K3, DECLARE) -> her LISTEN -> his understanding (K4, DECLARE, the hand to the
   breast) -> her hand reached to him (GESTURE reach). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win, T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', A = 'athena';
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c4 = clip(4), c6 = clip(6), c7 = clip(7);
  const V1 = X.voiceOf(c1), V4 = X.voiceOf(c4), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const sea = [0, 30, -200], hill = [0, 80, 280];
  stimuli.push({ id: 'sShore', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the shore of Phorcys\'s harbour in a mist: he does not know his own land', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  /* ── "it is called Ithaca" ── */
  const tIth = q(w(V1, 'ithaca', c1.at + c1.dur * 0.5));
  H({ id: 'hO0', actor: O, t0: 0.3, t1: q(tIth + 0.2), reason: 'woken on a strange shore: he hears the shepherd out, looking from him to the land', params: { look: [[A, 2.0], [hill, 1.2], [A, 2.0]], weight: true }, because: [{ id: 'sShore' }] });
  I({ id: 'aShow', actor: A, kind: 'GESTURE', target: hill, t0: q(tIth - 0.6), t1: q(tIth + 1.2), label: 'the young shepherd sweeps a hand over the land: it is called Ithaca', params: { shape: 'show', at: q(tIth - 0.1), side: 'R', amp: 0.9, hold: 0.6 }, because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  H({ id: 'hA0', actor: A, t0: 0.3, t1: q(tIth - 0.65), reason: 'a shepherd boy, with a spear and a cloak: she watches what he will do', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'sShore' }] });
  stimuli.push({ id: 'sIthaca', t0: tIth, t1: q(tIth + 0.4), kind: 'WORD', label: '"Ithaca"', actor: A, because: [{ id: 'aShow' }] });
  I({ id: 'oLeap', actor: O, kind: 'NOTICE', target: A, t0: q(tIth + 0.3), t1: q(tIth + 1.2), label: 'his heart leaps like a fish behind his teeth', params: { gazeHold: 0.6 }, because: [{ id: 'sIthaca', latency: 0.3 }] });
  const tLie = q(Math.min(c4.at - 1.9, Math.max(tIth + 2.6, c1.at + c1.dur - 1.4)));
  H({ id: 'hO1', actor: O, t0: q(tIth + 1.25), t1: q(tLie - 0.05), reason: 'he holds his face still and lets nothing show', params: { look: [[A, 3.0]], weight: true, still: true }, because: [{ id: 'oLeap' }] });
  I({ id: 'oLie', actor: O, kind: 'GESTURE', target: A, t0: tLie, t1: q(tLie + 1.4), label: 'a lie, fresh-minted: a Cretan, a man-slayer fleeing on a Phoenician ship', params: { shape: 'describe', at: q(tLie + 0.4), side: 'R', amp: 0.8, hold: 0.5 }, because: [{ id: 'hO1' }] });
  stimuli.push({ id: 'sLie', t0: q(tLie + 0.4), t1: q(tLie + 0.9), kind: 'WORD', label: 'the Cretan tale', actor: O, because: [{ id: 'oLie' }] });
  H({ id: 'hA1', actor: A, t0: q(tIth + 1.25), t1: q(tLie + 0.75), reason: 'she watches him swallow it and start to lie', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'aShow' }] });
  /* ── the goddess ── */
  I({ id: 'aLaugh', actor: A, kind: 'REACT', t0: q(tLie + 0.8), t1: q(tLie + 1.8), label: 'she smiles at it', params: { how: 'laugh', lookAt: O }, because: [{ id: 'sLie', latency: 0.4 }] });
  I({ id: 'aStep', actor: A, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: O, label: 'steps in to him in her own shape, tall and fair', because: [{ id: 'aLaugh' }] });
  stimuli.push({ id: 'sGoddess', t0: q(W('K2')[0] + 0.3), t1: q(W('K2')[0] + 0.8), kind: 'SIGHT', label: 'the shepherd is a woman, tall and fair and skilled: the goddess', actor: A, because: [{ id: 'aStep' }] });
  I({ id: 'oStart', actor: O, kind: 'REACT', t0: q(W('K2')[0] + 0.5), t1: q(W('K2')[0] + 1.5), label: 'the goddess', params: { how: 'startle', lookAt: A }, because: [{ id: 'sGoddess', latency: 0.2 }] });
  I({ id: 'oTurn', actor: O, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: A, label: 'the hands come up, open', because: [{ id: 'aStep', latency: 0.2 }] });
  I({ id: 'aName', actor: A, kind: 'DECLARE', target: O, utterance: c4.gi, t0: q(Math.max(c4.at - 0.2, W('K2')[1] + 0.05)), t1: q(c4.at + c4.dur), label: 'cunning trickster, even in your own land! I am Athena: we two are alike', params: { shapes: ['point', 'open', 'chest', 'open', 'show'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: 'aStep' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  I({ id: 'oHear', actor: O, kind: 'LISTEN', target: A, t0: q(W('K2')[0] + 1.6), t1: q(c4.at + c4.dur), label: 'hears himself named: trickster, the best of mortals at scheming', params: { nods: [q(w(V4, 'athena', c4.at + 8))] }, because: [{ id: 'oStart' }] });
  /* ── the reproach ── */
  I({ id: 'oDecide', actor: O, kind: 'DECIDE', t0: q(Math.max(c4.at + c4.dur - 0.6, W('K3')[0] - 0.7)), t1: q(W('K3')[0]), label: 'all those years with no goddess on his deck: he will say it', because: [{ id: 'aName' }, { id: 'v' + c6.gi, rel: 'realises' }] });
  I({ id: 'oStep', actor: O, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: A, label: 'a step to her, the hand out', because: [{ id: 'oDecide' }] });
  I({ id: 'oReproach', actor: O, kind: 'DECLARE', target: A, utterance: c6.gi, t0: q(Math.max(c6.at - 0.2, W('K3')[1] + 0.05)), t1: q(c6.at + c6.dur), label: 'hard goddess, where were you since Troy burned? swear this is not one more mockery', params: { shapes: ['open', 'point', 'plead', 'open', 'point'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: 'oStep' }, { id: 'v' + c6.gi, rel: 'realises' }] });
  H({ id: 'hA2', actor: A, t0: q(c4.at + c4.dur + 0.05), t1: q(c7.at + c7.dur), reason: 'she lets him say it: she knows why she stayed away', params: { look: [[O, 3.5], [sea, 0.8], [O, 3.0]], weight: true }, because: [{ id: 'aName' }] });
  /* ── he understands ── */
  I({ id: 'oSee', actor: O, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: A, label: 'the hand to his breast: he sees it now', because: [{ id: 'oReproach' }, { id: 'v' + c7.gi, rel: 'realises' }] });
  I({ id: 'oKnow', actor: O, kind: 'DECLARE', target: A, utterance: c7.gi, t0: q(Math.max(c7.at - 0.2, W('K4')[1] + 0.05)), t1: q(c7.at + c7.dur), label: 'Poseidon\'s wrath made open rescue too costly: you hid me to keep me breathing', params: { shapes: ['chest', 'open', 'chest'], side: 'L', maxBeats: 1, amp: 0.8 }, because: [{ id: 'oSee' }] });
  I({ id: 'aCome', actor: A, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: O, label: 'a half step to him', because: [{ id: 'oSee', latency: 0.3 }] });
  I({ id: 'aReach', actor: A, kind: 'GESTURE', target: O, t0: q(c7.at + c7.dur - 2.2), t1: q(c7.at + c7.dur - 0.4), label: 'her hand to him: that is the shape of it', params: { shape: 'reach', at: q(c7.at + c7.dur - 1.6), side: 'R', amp: 0.8, hold: 0.8 }, because: [{ id: 'oKnow' }] });
  H({ id: 'hO2', actor: O, t0: q(c7.at + c7.dur + 0.05), t1: T, reason: 'home, and the goddess beside him', params: { look: [[A, 2.0], [hill, 1.5], [A, 2.0]], weight: true }, because: [{ id: 'oKnow' }] });
  H({ id: 'hA3', actor: A, t0: q(c7.at + c7.dur + 0.05), t1: T, reason: 'now the plan: the suitors', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'aReach' }] });
  return {
    type: 'revelation', title: 'The Cretan Lie Meets Its Match: Ithaca named, the lie, the goddess, the reproach',
    actors: { [O]: { role: 'the hero home and not knowing it', body: 'minifig', principal: true, affect: { cunning: 0.8, suspicion: 0.6 } }, [A]: { role: 'the goddess, first as a shepherd', body: 'minifig', principal: true, affect: { cunning: 0.8 } } },
    objects: { hill: { kind: 'land', material: 'stone', at: hill, affords: ['show'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'learn where he is without giving himself away', [A]: 'tell him he is home; then the plan' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'show joy', base: -1.0, f: { 'after:sIthaca': 1.0 } }, { a: 'keep the face still and lie', base: -0.5, f: { 'after:sIthaca': 2.5, 'after:sGoddess': -2.5 } }, { a: 'reproach', base: -2.5, f: { 'after:aName': 3.0 } }, { a: 'accept', base: -2.5, f: { 'after:oReproach': 3.0 } }],
        [A]: [{ a: 'stay the shepherd', base: 1.0, f: { 'after:sLie': -2.0 } }, { a: 'reveal herself', base: -1.5, f: { 'after:sLie': 3.0 } }, { a: 'hear him out', base: -1.0, f: { 'after:oDecide': 2.5 } }] } },
      camera: { follow: true },
    },
  };
};
