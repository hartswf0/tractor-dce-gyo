/* The Ox Hoof (OD-B20-S04, Odyssey 20): at dinner in the hall, the beggar seated by the threshold, Ctesippus of Same, a man without
   decency, calls out: the stranger has had his share like the rest of us; here is a guest-gift from me. He takes an ox's foot from
   the meat basket at his hand and throws it; the beggar turns his head a little aside, smiles grimly, and the hoof hits the wall.
   Telemachus rounds on Ctesippus: be glad you missed; had you struck my guest my spear would be in your belly. The hall falls quiet.

   The voice: the recording of this scene is a stale take (the drive script's fragments, not the turns' lines), so the two speeches
   are added clips of their spoken lines (odyssey/kits/cut-restore.json), the narrator's 'Odysseus dodges.' kept between them; the
   last narration, a leaked line, is dropped (odyssey_take.leaked/unleak).

   The chain: the hall at dinner (SCENE) -> Ctesippus's mockery (DECLARE, the left hand: the right holds the hoof) -> "guest-gift"
   (a WORD) -> the throw (THROW: the hoof carried in the hand through the wind-up, flown past the beggar's head to the threshold wall
   and down it to the floor, smear bricks on two drawings; a PROP FLIGHT) -> the beggar's DUCK (caused by the release: he sees it
   come) -> the hoof on the wall (SOUND) -> the suitors' laughter (REACT) -> the beggar straightens and looks at Ctesippus (K2a) ->
   Telemachus's anger (DECIDE) -> his walk forward (K3) and threat (DECLARE) -> the suitors and Ctesippus turn to him and are quiet. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12;
  const B = 'odysseus-as-beggar', C = 'ctesippus', TE = 'telemachus', S = ['suitor-2', 'suitor-3', 'suitor-4'];
  const clips = M.clips.filter(c => c.kind !== 'SCENE_HEADER' && c.kind !== 'SPEAKER_CUE');
  const cM = clips.find(c => c.speaker === C) || clips[0], cN = clips.find(c => c.kind === 'AUDITORY_ACTION') || clips[1], cT = clips.find(c => c.speaker === TE && c.at > cN.at) || clips[2];
  const G = require('../ground.js'), HIT = [240, 100, 247], DOWN = [236, 238];
  const VM = X.voiceOf(cM), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  stimuli.push({ id: 'sHall', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the hall at dinner: the beggar fed by the threshold like the rest', because: [{ id: 'v' + cM.gi, rel: 'realises' }] });
  /* ── the mockery ── */
  I({ id: 'cMock', actor: C, kind: 'DECLARE', target: B, utterance: cM.gi, t0: q(cM.at - 0.2), t1: q(cM.at + cM.dur), label: 'the stranger has had his share: here is a guest-gift from me', params: { shapes: ['open', 'dismiss', 'point'], side: 'L', maxBeats: 2, amp: 1.0 }, because: [{ id: 'v' + cM.gi, rel: 'realises' }] });
  const tGift = q(w(VM, 'guest', cM.at + cM.dur * 0.45));
  stimuli.push({ id: 'sGift', t0: tGift, t1: q(tGift + 0.4), kind: 'WORD', label: '"a guest-gift from me": the hoof in his hand', actor: C, because: [{ id: 'cMock' }] });
  /* ── the throw ── */
  const FL = 0.55, tRel = q(cM.at + cM.dur + 0.25), tT = q(tRel - 0.62), tHit = q(tRel + FL), gy = G.at(M, DOWN[0], DOWN[1]).y;
  H({ id: 'hB0', actor: B, t0: 0.3, t1: q(tRel + 0.05), reason: 'a beggar at the door of a feast: he hears himself mocked and does not answer', params: { look: [[C, 2.6], [TE, 0.8], [C, 3.0]], weight: true }, because: [{ id: 'sHall' }] });
  H({ id: 'hT0', actor: TE, t0: 0.3, t1: q(tHit + 0.3), reason: 'by his father\'s seat: he watches Ctesippus', params: { look: [[C, 2.4], [B, 1.0], [C, 2.4]], weight: true }, because: [{ id: 'sHall' }] });
  S.forEach((s, k) => H({ id: 'hS0' + k, actor: s, t0: 0.3 + 0.1 * k, t1: q(tHit + 0.2 + 0.1 * k), reason: 'they grin: Ctesippus is going to have his joke', params: { look: [[C, 1.6], [B, 1.4], [C, 1.2]], weight: true, offset: 0.3 * k }, because: [{ id: 'sHall' }] }));
  I({ id: 'cThrow', actor: C, kind: 'THROW', target: B, t0: tT, t1: q(tT + 1.6), label: 'throws the ox hoof at the beggar\'s head', because: [{ id: 'sGift' }],
    params: { side: 'R', releaseId: 'sHoof', prop: 'oxHoof', freeze: true, to: HIT, off: [0, 0, 0], flight: FL, arc: 10, spin: 1.3, fall: [{ dt: 0.4, to: [DOWN[0], gy + 3, DOWN[1]], arc: 3, spin: 0.4 }], until: K('K2a').t, smear: { prop: 'oxHoofSmear', frames: [2, 3], span: 2 } } });
  /* the beggar sees it leave the hand and turns his head aside and down: it passes where his head was */
  I({ id: 'bDuck', actor: B, kind: 'DUCK', t0: q(tRel + 0.08), t1: q(tRel + 1.25), label: 'turns his head a little aside: it goes by', params: { amp: 1.5 }, because: [{ id: 'sHoof', latency: 0.08 }] });
  stimuli.push({ id: 'sWall', t0: tHit, t1: q(tHit + 0.3), kind: 'SOUND', label: 'the hoof against the wall, not him', because: [{ id: 'sHoof', latency: FL }] });
  /* ── the laughter ── */
  S.forEach((s, k) => I({ id: 'sLaugh' + k, actor: s, kind: 'REACT', t0: q(tHit + 0.3 + 0.1 * k), t1: q(tHit + 1.5 + 0.1 * k), label: 'they laugh at the beggar ducking', params: { how: 'laugh', lookAt: B }, because: [{ id: 'sWall', latency: 0.3 + 0.1 * k }] }));
  H({ id: 'hC0', actor: C, t0: q(tT + 1.65), t1: q(cT.at - 0.3), reason: 'he missed: he grins and watches the beggar', params: { look: [[B, 2.0], [S[0], 0.8], [B, 2.0]], weight: true }, because: [{ id: 'cThrow' }] });
  I({ id: 'bUp', actor: B, kind: 'APPROACH', key: 'K2a', t0: W('K2a')[0], t1: W('K2a')[1], target: C, label: 'straightens, and smiles grimly at him', because: [{ id: 'sWall' }] });
  H({ id: 'hB1', actor: B, t0: q(Math.max(tRel + 1.3, W('K2a')[1] + 0.05)), t1: q(cT.at + 1.0), reason: 'he smiles grimly, as a man smiles who will have his day', params: { look: [[C, 2.4], [TE, 0.8], [C, 2.0]], weight: true, still: true }, because: [{ id: 'bUp' }] });
  /* ── the prince ── */
  I({ id: 'tAnger', actor: TE, kind: 'DECIDE', t0: q(tHit + 0.35), t1: q(tHit + 1.0), label: 'a guest under his roof, struck at: he will not have it', because: [{ id: 'sWall' }, { id: 'v' + cT.gi, rel: 'realises' }] });
  I({ id: 'tCome', actor: TE, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: C, label: 'comes forward down the hall at Ctesippus', because: [{ id: 'tAnger' }] });
  I({ id: 'tThreat', actor: TE, kind: 'DECLARE', target: C, utterance: cT.gi, t0: q(Math.max(cT.at - 0.2, W('K3')[1] + 0.05)), t1: q(cT.at + cT.dur), label: 'be glad you missed: my father\'s spear would be in your belly', params: { shapes: ['point', 'chop', 'fist', 'point'], side: 'R', maxBeats: 3, amp: 1.0 }, because: [{ id: 'tCome' }] });
  H({ id: 'hT1', actor: TE, t0: q(tHit + 1.05), t1: q(W('K3')[0] - 0.05), reason: 'the anger rising', params: { look: [[C, 3.0]], weight: true }, because: [{ id: 'tAnger' }] });
  const tQuiet = q(cT.at + 0.6);
  stimuli.push({ id: 'sPrince', t0: q(cT.at), t1: tQuiet, kind: 'WORD', label: '"Ctesippus": the prince on his feet', actor: TE, because: [{ id: 'tCome' }, { id: 'v' + cT.gi, rel: 'realises' }] });
  I({ id: 'cTurn', actor: C, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: TE, label: 'turns to the prince', because: [{ id: 'tCome', latency: 0.3 }] });
  H({ id: 'hC1', actor: C, t0: q(Math.max(cT.at - 0.25, W('K3')[1] + 0.05)), t1: T, reason: 'the prince\'s threat: he says nothing', params: { look: [[TE, 3.2], [B, 0.8], [TE, 3.0]], weight: true }, because: [{ id: 'sPrince' }] });
  S.forEach((s, k) => I({ id: 'sTurn' + k, actor: s, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: TE, label: 'the laughter stops: they turn to the prince', because: [{ id: 'tCome', latency: 0.2 + 0.15 * k }] }));
  S.forEach((s, k) => H({ id: 'hS1' + k, actor: s, t0: q(Math.max(tHit + 1.6 + 0.1 * k, W('K3')[1] + 0.05)), t1: T, reason: 'the hall falls quiet under the prince\'s word', params: { look: [[TE, 2.0], [C, 1.0], [TE, 2.0]], weight: true, offset: 0.3 * k }, because: [{ id: 'sPrince' }] }));
  H({ id: 'hB2', actor: B, t0: q(cT.at + 1.05), t1: T, reason: 'he watches his son: the boy is a man', params: { look: [[TE, 2.6], [C, 1.0], [TE, 2.4]], weight: true }, because: [{ id: 'sPrince' }] });
  return {
    type: 'fight', title: 'The Ox Hoof: the mockery, the hoof in the air, the head turned aside, the wall, the prince\'s threat',
    actors: { [B]: { role: 'the beggar, the king', body: 'minifig', principal: true, affect: { cunning: 0.8, weight: 0.8 } }, [C]: { role: 'Ctesippus of Same', body: 'minifig', principal: true, affect: { heat: 0.7 } },
      [TE]: { role: 'Telemachus', body: 'minifig', principal: true, affect: { heat: 0.8 } },
      ...Object.fromEntries(S.map(s => [s, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { oxHoof: { kind: 'hoof', material: 'bone', holder: C + ':R', affords: ['throw'] }, wall: { kind: 'wall', material: 'stone', at: HIT, affords: ['hit'] } },
    authored: { intents, holds, stimuli, goals: { [B]: 'stay the beggar: let it go by', [C]: 'his joke on the stranger', [TE]: 'a guest is safe in his father\'s house' },
      couplings: [{ from: C, to: B, via: 'bone', t0: q(tRel - 0.1), t1: q(tHit + 0.2) }],
      causal: { tau: 0.7, actions: {
        [B]: [{ a: 'sit and eat', base: 1.0, f: { 'after:sGift': -1.5 } }, { a: 'duck', base: -2.0, f: { 'after:sHoof': 4.0, 'after:sWall': -4.0 } }, { a: 'smile grimly', base: -2.0, f: { 'after:sWall': 3.5 } }],
        [C]: [{ a: 'mock', base: 1.0, f: { 'after:sHoof': -2.0 } }, { a: 'throw', base: -2.0, f: { 'after:sGift': 3.0, 'after:sHoof': -3.0 } }, { a: 'keep quiet', base: -2.0, f: { 'after:sPrince': 3.5 } }],
        [TE]: [{ a: 'watch', base: 1.0, f: {} }, { a: 'rise and threaten', base: -2.0, f: { 'after:sWall': 3.5 } }],
        ...Object.fromEntries(S.map(s => [s, [{ a: 'watch', base: 1.0, f: {} }, { a: 'laugh', base: -1.5, f: { 'after:sWall': 3.0, 'after:sPrince': -4.0 } }]])) } },
      camera: { follow: true },
    },
  };
};
