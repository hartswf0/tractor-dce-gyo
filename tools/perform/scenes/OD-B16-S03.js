/* Father and Son (OD-B16-S03, Odyssey 16): Athena restores Odysseus outside the swineherd's hut; he comes back in changed; Telemachus
   takes him for a god and recoils; "I am no god: I am your father"; "you are not my father"; then they hold each other and weep like
   birds robbed of their young.

   Outside, alone, the goddess's touch: the beggar's stoop leaves him as the strength comes back (POSTURE slump, left over three
   seconds), his face to her (ATTEND up, where she stands unseen), a breath taken as a king (a HOLD with its reason). He comes back in
   (the take's walk at K2); Telemachus sees him (NOTICE: the double take on a stranger in his father's shape), and at "recoils" throws
   himself back (RECOIL) and holds, eyes averted (SHAME: the look dropped from a god), offering him sacrifice with open hands (GESTURE
   plead). Odysseus comes closer (K3) and tells him on his line's stresses (DECLARE: the open hands, the hand on his own chest at
   "father"); the son hears it and backs away (K4) and refuses him (DECLARE: the dismissal, the pointed finger, the chop at "mocking my
   grief"). The father answers with open hands (GESTURE open: it is Athena's doing) and the son believes him: they come together (K5) and
   hold each other (EMBRACE), weeping, rocking, to the end. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus-restored', Tm = 'telemachus', goddess = [40, 300, -220];
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c2 = clip(2), c3 = clip(3), c5 = clip(5), c7 = clip(7), c8 = clip(8);
  const V1 = X.voiceOf(c1), V3 = X.voiceOf(c3), V5 = X.voiceOf(c5), V7 = X.voiceOf(c7), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tStrength = q(w(V1, 'strength', 3.55)), tRecoil = q(w(V3, 'recoils', 18.5)), tFather = q(w(V5, 'father', 26.8)), tMock = q(w(V7, 'mocking', 32.9));
  /* ── outside the hut: the goddess's touch ── */
  stimuli.push({ id: 'sTouch', t0: 0.1, t1: 1.2, kind: 'SCENE', label: 'outside the hut, Athena touches him with her golden wand', because: [] });
  I({ id: 'oStoop', actor: O, kind: 'POSTURE', t0: 0.2, t1: tStrength, label: 'the beggar\'s stoop, leaving him as the strength comes back', params: { to: 'slump', enter: 0.3, leave: 3.0 }, because: [{ id: 'sTouch' }, { id: 'v' + c1.gi, rel: 'realises' }] });
  I({ id: 'oLook', actor: O, kind: 'ATTEND', target: goddess, t0: 1.0, t1: tStrength + 3.0, label: 'his face to the goddess he cannot see', because: [{ id: 'sTouch' }] });
  holds.push({ id: 'hO0', actor: O, t0: tStrength + 3.1, t1: K2.win[0] - 0.1, reason: 'a king again in his own body: he breathes it', params: { look: [[goddess, 1.2], [[170, 60, 20], 1.8]], weight: true }, because: [{ id: 'oStoop' }] });
  /* ── he comes in; the son sees a god ── */
  I({ id: 'oIn', actor: O, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: Tm, label: 'back into the hut, changed', because: [{ id: 'hO0' }, { id: 'v' + c2.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sChanged', t0: K2.win[1] - 0.2, t1: K2.win[1] + 0.2, kind: 'SIGHT', label: 'the beggar comes back a king: young, dark-haired, clothed', actor: O, because: [{ id: 'oIn' }] });
  I({ id: 'tSee', actor: Tm, kind: 'NOTICE', target: O, t0: K2.win[1] + 0.1, t1: K2.win[1] + 2.4, label: 'a stranger in his father\'s place', params: { gazeHold: 1.6 }, because: [{ id: 'sChanged' }] });
  holds.push({ id: 'hTm0', actor: Tm, t0: K2.win[1] + 2.5, t1: tRecoil - 0.1, reason: 'staring: the beggar is gone, and this is no man', params: { look: [[O, 4.0]], still: true }, because: [{ id: 'tSee' }] });
  holds.push({ id: 'hO1', actor: O, t0: K2.win[1] + 0.2, t1: K3.win[0] - 0.1, reason: 'he lets his son look at him', params: { look: [[Tm, 3.0]], weight: true }, because: [{ id: 'oIn' }] });
  I({ id: 'tRecoil', actor: Tm, kind: 'RECOIL', t0: tRecoil, t1: tRecoil + 1.4, label: 'back from him: a god', params: { from: O }, because: [{ id: 'hTm0' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  I({ id: 'tAvert', actor: Tm, kind: 'SHAME', t0: tRecoil + 1.5, t1: K3.win[0] - 0.1, label: 'the eyes averted from a god', params: { lookAt: O, hold: 2.5 }, because: [{ id: 'tRecoil' }] });
  I({ id: 'tOffer', actor: Tm, kind: 'GESTURE', target: O, t0: q(w(V3, 'god', 22.35) - 1.0), t1: K3.win[0] - 0.1, label: 'be gracious: we will give you sacrifice', params: { shape: 'plead', at: q(w(V3, 'god', 22.35) - 0.6), side: 'R', amp: 0.8, hold: 0.8 }, because: [{ id: 'tRecoil' }] });
  /* ── "I am your father" ── */
  I({ id: 'oCloser', actor: O, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: Tm, label: 'toward his son', because: [{ id: 'tOffer' }] });
  I({ id: 'tStay', actor: Tm, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: O, label: 'does not run', because: [{ id: 'oCloser' }] });
  I({ id: 'oDecl', actor: O, kind: 'DECLARE', target: Tm, utterance: c5.gi, t0: c5.at - 0.3, t1: c5.at + c5.dur, label: 'I am no god: I am your father', params: { shapes: ['open', 'dismiss', 'chest', 'open'], side: 'R' }, because: [{ id: 'v' + c5.gi, rel: 'realises' }, { id: 'oCloser' }] });
  I({ id: 'tHears', actor: Tm, kind: 'LISTEN', target: O, t0: c5.at, t1: c5.at + c5.dur, label: 'hears "your father"', params: { nods: [] }, because: [{ id: 'oDecl' }] });
  stimuli.push({ id: 'sFather', t0: tFather, t1: tFather + 0.3, kind: 'WORD', label: '"your father"', actor: O, because: [{ id: 'oDecl' }] });
  /* ── "you are not my father" ── */
  I({ id: 'tBack', actor: Tm, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: O, label: 'backs away from it', because: [{ id: 'sFather' }] });
  I({ id: 'oStays', actor: O, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: Tm, label: 'lets him go back', because: [{ id: 'tBack' }] });
  I({ id: 'tRefuse', actor: Tm, kind: 'DECLARE', target: O, utterance: c7.gi, t0: c7.at - 0.2, t1: c7.at + c7.dur, label: 'you are not my father: a god is mocking my grief', params: { shapes: ['dismiss', 'point', 'chop', 'fist'], side: 'R' }, because: [{ id: 'v' + c7.gi, rel: 'realises' }, { id: 'tBack' }] });
  stimuli.push({ id: 'sGrief', t0: tMock, t1: tMock + 0.3, kind: 'WORD', label: '"mocking my grief"', actor: Tm, because: [{ id: 'tRefuse' }] });
  I({ id: 'oAnswer', actor: O, kind: 'GESTURE', target: Tm, t0: q(tMock - 0.7), t1: K5.win[0] - 0.05, label: 'it is Athena\'s doing: no other Odysseus will come', params: { shape: 'open', at: q(tMock - 0.4), side: 'L', amp: 0.8, hold: 0.3 }, because: [{ id: 'tRefuse' }] });
  /* ── the embrace ── */
  I({ id: 'tTo', actor: Tm, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: O, label: 'to his father', because: [{ id: 'oAnswer' }] });
  I({ id: 'oTo', actor: O, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: Tm, label: 'to his son', because: [{ id: 'tTo' }] });
  I({ id: 'hold', actor: Tm, kind: 'EMBRACE', target: O, t0: K5.win[1] + 0.1, t1: T - 0.3, label: 'they hold each other', because: [{ id: 'tTo' }, { id: 'v' + c8.gi, rel: 'realises' }] });
  holds.push({ id: 'hWeepT', actor: Tm, t0: K5.win[1] + 1.0, t1: T, reason: 'weeping, loud as birds robbed of their young', params: { look: [[O, 5.0]], weight: true }, because: [{ id: 'hold' }] });
  holds.push({ id: 'hWeepO', actor: O, t0: K5.win[1] + 1.0, t1: T, reason: 'weeping over his son, rocking him', params: { look: [[Tm, 5.0]], weight: true, offset: 0.7 }, because: [{ id: 'hold' }] });
  return {
    type: 'revelation', title: 'Father and Son: no god, your father',
    actors: { [O]: { role: 'the father, restored', body: 'minifig', principal: true }, [Tm]: { role: 'the son', body: 'minifig', principal: true, affect: { fear: 0.7, suspicion: 0.6 } } },
    objects: { door: { kind: 'door', material: 'door', at: [60, 40, -150], exit: true, affords: ['enter'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'be known by his son', [Tm]: 'honour a god; not be mocked' },
      couplings: [{ from: Tm, to: O, via: 'flesh', t0: K5.win[1], t1: T }],
      causal: { tau: 0.7, actions: {
        [Tm]: [{ a: 'stare', base: 0.6, f: { 'after:sChanged': 1.2, 'after:tRecoil': -1 } }, { a: 'kneel to a god', base: -2.2, f: { 'after:sChanged': 2.4, 'after:sFather': -1.2 } }, { a: 'flee', base: -2.5, f: { 'after:sChanged': 1.4, ['near:' + O + ':1']: 0.8 } },
          { a: 'refuse him', base: -3.0, f: { 'after:sFather': 3.2, 'after:oAnswer': -4 } }, { a: 'hold his father', base: -3.5, f: { 'after:oAnswer': 4.0, ['near:' + O + ':1']: 1.5 } }],
        [O]: [{ a: 'wait', base: 1.0, f: { 'after:tRecoil': -1.5 } }, { a: 'tell him', base: -2.0, f: { 'after:tRecoil': 2.8, 'after:sFather': -3 } }, { a: 'answer his doubt', base: -2.8, f: { 'after:tRefuse': 3.6 } }, { a: 'hold his son', base: -3.0, f: { 'after:oAnswer': 3.0 } }],
      } },
      camera: { follow: true },
    },
  };
};
