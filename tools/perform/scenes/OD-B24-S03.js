/* Odysseus Tests Laertes (OD-B24-S03, Odyssey 24): on the farm Odysseus finds his old father alone, digging round a tree in a patched
   shirt; he weeps to see him so broken, then makes up his mind to test him first; he tells a false tale (he is a stranger who once
   hosted Odysseus); a dark cloud of sorrow falls on the old man, who fills both hands with dust and pours it over his grey head,
   groaning; the son can bear no more: "Father, put down the dust: I am the man you are grieving"; the father, out of his arms, asks
   for a sign he cannot argue with.

   Played on the performer's cut (the scene is not in the Regulars' Cut: the narration's three turns, Odysseus's line, Laertes's line).
   Laertes digs round the tree (TOOL_WORK dig, slow: an old man's weight), his back to the road. Odysseus walks in (ARRIVE: "reaches the
   farm"), sees him (NOTICE), stands and looks (a HOLD with its reason), weeps (WEEP, the hand to the face), resolves to test him
   (DECIDE), waves the companions on to the house (GESTURE dismiss) and goes up to him (the take's walk to K2, his APPROACH). The old man
   hears the steps (a SOUND) and turns (the take's turn at K2), the spade still in his hands (a HOLD: leaning on it, wary of a
   stranger). The false tale is told on the narration's stresses (DECLARE: the open hand, the describing hand, the point back down the
   road); at "years earlier" the old man's grief takes him (RETIME: his sitting down in the dust delayed onto that word), the spade let
   fall, both hands in the dust and over his head (DUST, two handfuls, each with a groan) and the weeping after (WEEP). Odysseus watches
   it break him (a HOLD with its reason), then breaks (REACT flinch at the second groan, DECIDE) and goes to him (K4's walk, his APPROACH),
   a hand on his shoulder at "put down the dust" (HOLD_ON); the old man rises into his son's arms (RETIME: his rise held until the
   word), and they hold each other (EMBRACE) through "I am Odysseus... the suitors lie dead in my hall". Then the old man pulls back
   (the take's move to K5, his APPROACH, read as a RECOIL) and asks for the sign (DECLARE on his line's stresses: the held-up hand, the
   point, the open hand); Odysseus hears it (LISTEN) and holds, ready to show the scar (a HOLD with its reason). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', L = 'laertes';
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c2 = clip(2), c3 = clip(3), c5 = clip(5), c7 = clip(7);
  const V1 = X.voiceOf(c1), V3 = X.voiceOf(c3), V5 = X.voiceOf(c5), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tree = [0, 60, 100], house = [220, 60, -200], road = [300, 60, -60];   /* the tree he digs round; the farmhouse the companions go to; the way they came */
  const tPatched = q(w(V1, 'patched', c1.at + 5.6)), tEarlier = q(w(V3, 'earlier', c3.at + 4.2)), tDust = q(w(V5, 'dust', c5.at + 1.1)), tOdysseus = q(w(V5, 'odysseus', c5.at + 3.4));
  /* the collapse lands on "years earlier" (the sitting down in the dust, its seam's window moved onto the word); the rise on "dust" */
  const k3d = q(Math.max(0, tEarlier + 0.25 - K3.win[0])), sat = q(K3.win[1] + k3d), k4d = q(Math.max(0, tDust + 0.5 - K4.win[0]));
  const up = q(K4.win[1] + k4d), dust1 = q(sat + 0.1), P = 1.6, dustEnd = q(dust1 + 2 * P), g1 = q(dust1 + P * 1.8), kO = q(Math.max(0, g1 + 1.0 - K4.win[0]));
  const tGo = q(K2.win[0]), kL2 = 0.5;
  /* ── the farm, the old man at his labour ── */
  stimuli.push({ id: 'sFarm', t0: 0.05, t1: 1.0, kind: 'SCENE', label: 'the farm: the old man alone in the orchard, in a patched shirt, digging round a tree', actor: L, because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  I({ id: 'lDig', actor: L, kind: 'TOOL_WORK', t0: 0.3, t1: q(K2.win[0] + 0.6), target: tree, label: 'digs round the tree, slowly', params: { how: 'dig', period: 1.7, on: tree }, because: [{ id: 'sFarm' }] });
  /* ── the son comes, sees him, weeps, resolves ── */
  I({ id: 'oIn', actor: O, kind: 'ARRIVE', t0: 0.4, t1: 2.6, label: 'reaches the farm', params: { from: [70, -50], dur: 2.2 }, because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  I({ id: 'oSee', actor: O, kind: 'NOTICE', target: L, t0: 2.7, t1: 4.6, label: 'his father: alone, old, bent over a spade', params: { gazeHold: 1.4 }, because: [{ id: 'oIn' }, { id: 'sFarm' }] });
  holds.push({ id: 'hO0', actor: O, t0: 4.7, t1: q(tPatched - 0.1), reason: 'he stands under a pear tree and looks at him: so old, so broken', params: { look: [[L, 3.0]], weight: true }, because: [{ id: 'oSee' }] });
  I({ id: 'oWeep', actor: O, kind: 'WEEP', t0: tPatched, t1: q(tGo - 2.1), label: 'weeps to see him so', params: { side: 'R', rate: 2.4, pitch: -1.85, out: -0.3, head: 0.28, lean: 0.16 }, because: [{ id: 'hO0' }] });
  I({ id: 'oDecide', actor: O, kind: 'DECIDE', t0: q(tGo - 2.0), t1: q(tGo - 1.25), label: 'not to fall on his neck yet: to test him first', because: [{ id: 'oWeep' }, { id: 'v' + c2.gi, rel: 'realises' }] });
  I({ id: 'oSend', actor: O, kind: 'GESTURE', target: house, t0: q(tGo - 1.2), t1: q(tGo - 0.05), label: 'sends the companions on to the house: kill the best pig, make the dinner', params: { shape: 'dismiss', at: q(tGo - 0.8), side: 'L', amp: 0.9, hold: 0.4 }, because: [{ id: 'oDecide' }] });
  I({ id: 'oGo', actor: O, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: L, label: 'goes up to the old man', because: [{ id: 'oSend' }] });
  stimuli.push({ id: 'sSteps', t0: q(K2.win[0] + 0.1), t1: q(K2.win[0] + 0.6), kind: 'SOUND', label: 'steps on the path behind him', actor: O, because: [{ id: 'oGo' }] });
  I({ id: 'lTurn', actor: L, kind: 'RETIME', t0: q(K2.win[0] + kL2), t1: q(K2.win[1] + kL2), label: 'turns from the tree to the stranger, the spade in his hands', params: { key: 'K2', delay: kL2 }, because: [{ id: 'sSteps' }] });
  holds.push({ id: 'hL0', actor: L, t0: q(K2.win[1] + kL2 + 0.1), t1: q(c3.at - 0.1), reason: 'a stranger on his land: he leans on the spade and waits to hear him', params: { look: [[O, 3.0]], weight: true, grip: 'R' }, because: [{ id: 'lTurn' }] });
  holds.push({ id: 'hO1', actor: O, t0: q(K2.win[1] + 0.1), t1: q(K3.win[0] - 0.1), reason: 'the stranger\'s face put on: a man from Alybas, son of Apheidas', params: { look: [[L, 2.6], [tree, 0.8], [L, 2.0]], weight: true }, because: [{ id: 'oGo' }] });
  /* ── the false tale; the cloud of sorrow ── */
  I({ id: 'oTale', actor: O, kind: 'DECLARE', target: L, utterance: c3.gi, t0: q(c3.at - 0.3), t1: q(tEarlier + 0.6), label: 'the false tale: I once had Odysseus as my guest, five years ago', params: { shapes: ['open', 'describe', 'point', 'open'], side: 'R', maxBeats: 1, amp: 0.8, beatsOnlyKey: false }, because: [{ id: 'hO1' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sTale', t0: tEarlier, t1: q(tEarlier + 0.4), kind: 'WORD', label: '"years earlier": his son, a guest in a stranger\'s house, and never come home', actor: O, because: [{ id: 'oTale' }] });
  I({ id: 'lFall', actor: L, kind: 'RETIME', t0: q(K3.win[0] + k3d), t1: sat, label: 'a dark cloud of sorrow: he sinks down in the dust', params: { key: 'K3', delay: k3d }, because: [{ id: 'sTale' }] });
  I({ id: 'oStep', actor: O, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: L, label: 'a step nearer as he begins it', because: [{ id: 'hO1' }] });
  I({ id: 'lDust', actor: L, kind: 'DUST', t0: dust1, t1: dustEnd, label: 'fills both hands with dust and pours it over his grey head, groaning', params: { n: 2, period: P, groan: 'sGroan' }, because: [{ id: 'lFall' }] });
  I({ id: 'lWeep', actor: L, kind: 'WEEP', t0: q(dustEnd + 0.1), t1: q(up - 0.3), label: 'groans, his face in his hands', params: { side: 'R', rate: 2.2, head: 0.3, lean: 0.24, pitch: -1.9, out: -0.25 }, because: [{ id: 'lDust' }] });
  holds.push({ id: 'hO2', actor: O, t0: q(Math.max(tEarlier + 0.7, sat)), t1: q(g1 - 0.1), reason: 'he watches the test break his father', params: { look: [[L, 4.0]], weight: true, still: true }, because: [{ id: 'lFall' }] });
  I({ id: 'oBreak', actor: O, kind: 'REACT', t0: g1, t1: q(g1 + 0.8), label: 'the second groan: his heart is wrung, a pang in the nostrils', params: { how: 'flinch', lookAt: L }, because: [{ id: 'sGroan1' }] });
  I({ id: 'oDecide2', actor: O, kind: 'DECIDE', t0: q(g1 + 0.5), t1: q(g1 + 0.95), label: 'he can bear it no longer', because: [{ id: 'oBreak' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  /* ── "Father, put down the dust" ── */
  I({ id: 'oTo', actor: O, kind: 'RETIME', t0: q(K4.win[0] + kO), t1: q(K4.win[1] + kO), label: 'goes to him', params: { key: 'K4', delay: kO }, because: [{ id: 'oDecide2' }] });
  I({ id: 'oHand', actor: O, kind: 'HOLD_ON', target: L, t0: q(K4.win[1] + kO + 0.05), t1: q(up - 0.2), label: 'a hand on his father\'s shoulder: put down the dust', params: { side: 'L' }, because: [{ id: 'oTo' }] });
  stimuli.push({ id: 'sDust', t0: tDust, t1: q(tDust + 0.3), kind: 'WORD', label: '"Father, put down the dust"', actor: O, because: [{ id: 'oDecide2' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  I({ id: 'lRise', actor: L, kind: 'RETIME', t0: q(K4.win[0] + k4d), t1: up, label: 'rises at the word, into his son\'s arms', params: { key: 'K4', delay: k4d }, because: [{ id: 'sDust' }] });
  I({ id: 'oHold', actor: O, kind: 'EMBRACE', target: L, t0: q(up + 0.05), t1: q(K5.win[0] - 0.2), label: 'flings his arms round him: I am the man you are grieving', because: [{ id: 'lRise' }] });
  stimuli.push({ id: 'sName', t0: tOdysseus, t1: q(tOdysseus + 0.4), kind: 'WORD', label: '"I am Odysseus, home in the twentieth year"', actor: O, because: [{ id: 'oHold' }] });
  I({ id: 'lHear', actor: L, kind: 'REACT', t0: q(tOdysseus + 0.3), t1: q(tOdysseus + 1.1), label: 'the name: the old head lifts', params: { how: 'startle', lookAt: O, latencyScale: 1.4 }, because: [{ id: 'sName' }] });
  /* ── the demand for a sign ── */
  I({ id: 'lBack', actor: L, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: O, label: 'pulls back out of his arms to look at him: grief has made him easy to fool', because: [{ id: 'lHear' }] });
  I({ id: 'oLet', actor: O, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: L, label: 'lets him go, a step back', because: [{ id: 'lBack' }] });
  I({ id: 'lAsk', actor: L, kind: 'DECLARE', target: O, utterance: c7.gi, t0: q(c7.at - 0.2), t1: q(c7.at + c7.dur), label: 'if you are truly my son, give me a sign I cannot argue with', params: { shapes: ['recoil', 'point', 'open'], side: 'R', maxBeats: 1, amp: 0.85 }, because: [{ id: 'lBack' }, { id: 'v' + c7.gi, rel: 'realises' }] });
  I({ id: 'oListen', actor: O, kind: 'LISTEN', target: L, t0: q(K5.win[1] + 0.1), t1: q(c7.at + c7.dur), label: 'hears the old man\'s doubt', params: { nods: [q(c7.at + c7.dur - 0.6)] }, because: [{ id: 'lAsk' }] });
  holds.push({ id: 'hO3', actor: O, t0: q(c7.at + c7.dur + 0.05), t1: T, reason: 'the sign he will give: the boar\'s scar, and the trees his father gave him', params: { look: [[L, 3.0]], weight: true }, because: [{ id: 'lAsk' }] });
  holds.push({ id: 'hL3', actor: L, t0: q(c7.at + c7.dur + 0.05), t1: T, reason: 'he has asked; he waits to be convinced', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'lAsk' }] });
  return {
    type: 'revelation', title: 'Odysseus Tests Laertes: the dust, the name, the sign',
    actors: { [O]: { role: 'the son, home in disguise', body: 'minifig', principal: true, affect: { cunning: 0.6, weight: 0.9 } }, [L]: { role: 'the old father', body: 'minifig', principal: true, affect: { weight: 1.25, suspicion: 0.5 } } },
    objects: { spade: { kind: 'spade', material: 'wood', holder: L + ':R', affords: ['dig'] }, dust: { kind: 'earth', material: 'earth', at: [-5, 10, 50], affords: ['scoop', 'pour'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'know his father\'s heart before he tells him', [L]: 'tend his trees; not be fooled by hope' },
      couplings: [{ from: O, to: L, via: 'flesh', t0: up, t1: K5.win[0] }],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'watch him', base: 1.0, f: { 'after:oDecide': -1.4 } }, { a: 'test him', base: -1.6, f: { 'after:oDecide': 3.0, 'after:sGroan1': -3.2 } }, { a: 'tell him', base: -2.6, f: { 'after:sGroan1': 3.6 } }, { a: 'give the sign', base: -3.0, f: { 'after:lAsk': 3.4 } }],
        [L]: [{ a: 'dig', base: 1.2, f: { 'after:sSteps': -1.6 } }, { a: 'hear the stranger', base: -1.0, f: { 'after:sSteps': 2.4, 'after:sTale': -2.0 } }, { a: 'grieve', base: -2.4, f: { 'after:sTale': 3.8, 'after:sDust': -3.0 } }, { a: 'hold his son', base: -3.0, f: { 'after:sDust': 3.6, 'after:lHear': -2.0 } }, { a: 'demand a sign', base: -3.2, f: { 'after:lHear': 4.2 } }],
      } },
      camera: { follow: true },
    },
  };
};
