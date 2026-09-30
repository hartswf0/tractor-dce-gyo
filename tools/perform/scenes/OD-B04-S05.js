/* Proteus (OD-B04-S05, Odyssey 4): Menelaus and three men lie in wait under sealskins; the Old Man of the Sea comes up, counts his seals
   and lies down among them; they spring and seize him; he becomes a lion, a serpent, water, a tree, and they hold on; tired, he is
   himself again and tells them that Odysseus lives, held by Calypso on an island.

   An ambush and a grapple with a shape-changer, where the held body changes and the men's hands stay constant. Under the skins (a HOLD
   each: the stink of the seals, still), the men watch him count (GESTURE point, once per seal) and lie down (POSTURE lie). At "grappled"
   they spring (the take's moves to K4, owned by their intents) and fall on him: Menelaus seizes (SEIZE); each of the three holds on
   (STRAIN: the weight thrown back, short jolts). Each shape is a SIGHT in the score (the take stages the chain of shapes as its own
   piece while Proteus is not drawn) and each is answered by every holder: a flinch (REACT) and the grip held harder (the STRAIN goes on
   through it). Tired, he is himself again (K5): he speaks the prophecy (DECLARE on the line's stresses) and Menelaus hears that
   Odysseus lives (LISTEN; a REACT at "lived", the head lifting). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K4 = K('K4'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const Me = 'menelaus', Pr = 'proteus', men = ['three-men-1', 'three-men-2', 'three-men-3'], all = [Me, ...men], chainAt = [-80, 40, 215];
  const clip = gi => M.clips.find(c => c.gi === gi), c5 = clip(5), c6 = clip(6), c7 = clip(7);
  const V5 = X.voiceOf(c5), V6 = X.voiceOf(c6), V7 = X.voiceOf(c7), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tGrapple = q(w(V5, 'grappled', 5.3)), tLived = q(w(V7, 'lived', 23.8));
  const shapes = [['a lion with a great mane', q(w(V6, 'changed', 11.6))], ['a serpent', q(w(V6, 'beasts', 12.6))], ['running water', q(w(V6, 'water', 13.2))], ['a high leafy tree', q(w(V6, 'tree', 14.6))]];
  /* ── the ambush ── */
  stimuli.push({ id: 'sBeach', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'the seal beach of Pharos at noon: the seals come up out of the sea', because: [{ id: 'v' + c5.gi, rel: 'realises' }] });
  all.forEach((m, k) => holds.push({ id: 'hSkin' + k, actor: m, t0: 0.3, t1: q(K4.win[0] - 0.3 + 0.05 * k), reason: 'under a stinking sealskin, still, watching the old man', params: { look: [[Pr, 2.6]], still: true, offset: 0.2 * k }, because: [{ id: 'sBeach' }] }));
  [1.2, 2.0, 2.8, 3.6].forEach((t, j) => I({ id: 'pCount' + j, actor: Pr, kind: 'GESTURE', target: men[j % 3], t0: q(t - 0.2), t1: q(t + 0.5), label: 'counts his seals: one of them a man', params: { shape: 'point', at: t, side: 'R', amp: 0.5, hold: 0.2 }, because: [{ id: j ? 'pCount' + (j - 1) : 'sBeach' }] }));
  I({ id: 'pLie', actor: Pr, kind: 'POSTURE', t0: 4.3, t1: K4.win[0], label: 'lies down among them to sleep', params: { to: 'lie', enter: 0.8, leave: 0.4 }, because: [{ id: 'pCount3' }] });
  holds.push({ id: 'hPrSleep', actor: Pr, t0: 5.2, t1: K4.win[0] - 0.05, reason: 'asleep among his seals', params: { look: [], still: true }, because: [{ id: 'pLie' }] });
  /* ── the spring and the hold ── */
  stimuli.push({ id: 'sNow', t0: q(K4.win[0] - 0.4), t1: q(K4.win[0] - 0.1), kind: 'SIGHT', label: 'he is asleep: now', because: [{ id: 'pLie' }] });
  all.forEach((m, k) => I({ id: 'spring' + k, actor: m, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: Pr, label: 'springs out from under the skin', because: [{ id: 'sNow' }] }));
  I({ id: 'meSeize', actor: Me, kind: 'STRAIN', t0: K4.win[1], t1: K5.win[0] - 0.1, label: 'arms locked round the old man', because: [{ id: 'spring0' }] });
  men.forEach((m, k) => I({ id: 'hold' + k, actor: m, kind: 'STRAIN', t0: q(K4.win[1] + 0.1 * (k + 1)), t1: K5.win[0] - 0.1, label: 'holds on, whatever he becomes', because: [{ id: 'spring' + (k + 1) }] }));
  shapes.forEach(([label, t], j) => { stimuli.push({ id: 'sShape' + j, t0: t, t1: t + 0.4, kind: 'SIGHT', label: 'he becomes ' + label, actor: Pr, because: [{ id: j ? 'sShape' + (j - 1) : 'meSeize' }, ...(j ? [] : [{ id: 'v' + c6.gi, rel: 'realises' }])] });
    all.forEach((m, k) => { if ((j + k) % 2 === 0) I({ id: 'flinch' + j + '_' + k, actor: m, kind: 'REACT', t0: q(t + 0.2 + 0.06 * k), t1: q(t + 1.0 + 0.06 * k), label: 'the shape in his hands: ' + label, params: { how: 'flinch', lookAt: chainAt }, because: [{ id: 'sShape' + j }] }); }); });
  stimuli.push({ id: 'sTired', t0: q(w(V6, 'yielding', 17.3)), t1: q(w(V6, 'yielding', 17.3) + 0.4), kind: 'SIGHT', label: 'tired of his arts, he yields', because: [{ id: 'sShape3' }] });
  /* ── the prophecy ── */
  all.forEach((m, k) => I({ id: 'loose' + k, actor: m, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: Pr, label: 'the grip eased: he is himself again', because: [{ id: 'sTired' }] }));
  I({ id: 'pSpeak', actor: Pr, kind: 'DECLARE', target: Me, utterance: c7.gi, t0: c7.at - 0.2, t1: c7.at + c7.dur, label: 'Odysseus lives: Calypso holds him on her island', params: { shapes: ['open', 'point', 'describe', 'point'], side: 'L' }, because: [{ id: 'v' + c7.gi, rel: 'realises' }, { id: 'sTired' }] });
  I({ id: 'meHear', actor: Me, kind: 'LISTEN', target: Pr, t0: c7.at, t1: q(tLived - 0.1), label: 'hears the old man', params: { nods: [] }, because: [{ id: 'pSpeak' }] });
  stimuli.push({ id: 'sLives', t0: tLived, t1: tLived + 0.3, kind: 'WORD', label: '"Odysseus lived"', actor: Pr, because: [{ id: 'pSpeak' }] });
  I({ id: 'meLift', actor: Me, kind: 'REACT', t0: tLived + 0.2, t1: tLived + 1.4, label: 'he lives', params: { how: 'turn', lookAt: Pr }, because: [{ id: 'sLives' }] });
  holds.push({ id: 'hMe', actor: Me, t0: tLived + 1.5, t1: T, reason: 'the news of his friend: held on the old man\'s every word', params: { look: [[Pr, 3.0]], weight: true }, because: [{ id: 'meLift' }] });
  men.forEach((m, k) => holds.push({ id: 'hMen' + k, actor: m, t0: K5.win[1] + 0.2, t1: T, reason: 'spent, round the old man, listening', params: { look: [[Pr, 2.2], [Me, 1.0]], weight: true, offset: 0.3 * k }, because: [{ id: 'loose' + (k + 1) }] }));
  return {
    type: 'fight', title: 'Proteus: the ambush, the shapes, the prophecy',
    actors: { [Me]: { role: 'the king of Sparta', body: 'minifig', principal: true }, [Pr]: { role: 'the Old Man of the Sea', body: 'minifig', principal: true, affect: { cunning: 0.9 } }, ...Object.fromEntries(men.map(m => [m, { role: 'one of his men', body: 'minifig', group: 'men' }])) },
    objects: { skins: { kind: 'sealskins', material: 'hide', at: [-120, 12, 10], affords: ['hide'] } },
    authored: { intents, holds, stimuli, goals: { [Me]: 'hold him until he speaks', [Pr]: 'slip away' },
      couplings: all.map(m => ({ from: m, to: Pr, via: 'flesh', t0: K4.win[1], t1: K5.win[0] })),
      causal: { tau: 0.7, actions: {
        [Me]: [{ a: 'lie still', base: 1.0, f: { 'after:sNow': -3 } }, { a: 'seize him', base: -2.0, f: { 'after:sNow': 3.4, 'after:sTired': -3 } }, { a: 'let go', base: -2.5, f: { 'after:sShape0': 1.0, 'after:sShape2': 0.8 } }, { a: 'hear him', base: -2.5, f: { 'after:sTired': 3.4 } }],
        [Pr]: [{ a: 'count the seals', base: 1.0, f: { 'after:pCount3': -2 } }, { a: 'sleep', base: -1.0, f: { 'after:pCount3': 2.4, 'after:sNow': -3 } }, { a: 'change shape', base: -2.5, f: { 'after:sNow': 3.6, 'after:sTired': -4 } }, { a: 'speak the truth', base: -3.0, f: { 'after:sTired': 4.0 } }],
      } },
      camera: { follow: true },
    },
  };
};
