/* Telemachus Lands in Secret (OD-B15-S05, Odyssey 15): the ship comes in to Ithaca's far shore at dawn, past the suitors' ambush.
   As Telemachus speaks a bird flies by on his right, a hawk, Apollo's messenger, a dove in its talons, plucking it, and the feathers
   fall to the ground between him and the ship. Theoclymenus calls him apart: that bird flew on your right by a god's will; there is
   no house in Ithaca more kingly than yours. Telemachus bids the crew take the ship on round to the town; Piraeus is to keep the
   seer as his guest until he sends for him; and he binds on his sandals and walks inland alone, toward the swineherd's farm.

   The chain: the landing (SCENE) -> the hawk with the dove across the shore on his right (FLY, a SIGHT) -> the two men's eyes on it
   (REACT, HOLDs that follow its path) -> the feathers falling between him and the ship (FLY) -> the seer's reading (DECLARE: the
   narrator voices the turn; the arm to the sky, then to the boy) -> Telemachus's nod -> his order to the crew (DECLARE, K3) -> the
   crew's assent (REACT nod) -> the seer given to Piraeus (K4, GESTURE offer; Piraeus's nod) -> the walk inland alone (K4a). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12;
  const TE = 'telemachus', TH = 'theoclymenus', PI = 'piraeus', C = ['sailor-1', 'sailor-2'];
  const clips = M.clips.filter(c => c.kind !== 'SCENE_HEADER' && c.kind !== 'SPEAKER_CUE');
  const cH = clips[0], cR = clips[1], cO = clips.find(c => c.speaker === TE && c.kind === 'DIALOGUE') || clips[2], cE = clips[clips.length - 1];
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const H0 = [-300, 110, -40], H1 = [150, 108, 0], H2 = [360, 160, 40], FE = [150, 96, 10], FD = [160, 0, -4];
  const tHawk = q(cH.at + 2.4), tPass = q(tHawk + 1.6), tGone = q(tPass + 1.6);
  stimuli.push({ id: 'sShore', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the ship in at Ithaca\'s far shore at dawn', because: [{ id: 'v' + cH.gi, rel: 'realises' }] });
  /* ── the hawk and the dove ── */
  I({ id: 'hawk', actor: TH, kind: 'FLY', t0: tHawk, t1: tGone, label: 'a hawk on the right, a dove in its talons', params: { prop: 'hawkDove', from: H0, legs: [{ dt: tPass - tHawk, to: H1, arc: -6 }, { dt: tGone - tPass, to: H2, arc: 14 }], until: K('K2').t }, because: [{ id: 'sShore' }] });
  stimuli.push({ id: 'sHawk', t0: q(tHawk + 0.4), t1: q(tHawk + 0.9), kind: 'SIGHT', label: 'the hawk over the shore, the dove in its claws', because: [{ id: 'hawk' }] });
  I({ id: 'feath', actor: TE, kind: 'FLY', t0: tPass, t1: q(tPass + 3.2), label: 'the feathers fall between him and the ship', params: { prop: 'feathers', from: FE, legs: [{ dt: 3.0, to: [FD[0], 4, FD[1]], arc: 3, spin: 0.6 }], until: K('K2').t }, because: [{ id: 'hawk' }] });
  H({ id: 'hT0', actor: TE, t0: 0.3, t1: q(tHawk + 0.45), reason: 'ashore at last, the crew round him', params: { look: [[C[0], 1.6], [TH, 1.2], [PI, 1.2]], weight: true }, because: [{ id: 'sShore' }] });
  H({ id: 'hTh0', actor: TH, t0: 0.3, t1: q(tHawk + 0.5), reason: 'the seer on a strange shore, watching the sky as seers do', params: { look: [[TE, 1.4], [H0, 1.6]], weight: true }, because: [{ id: 'sShore' }] });
  H({ id: 'hP0', actor: PI, t0: 0.3, t1: q(tHawk + 0.6), reason: 'with the prince on the beach', params: { look: [[TE, 2.0], [C[1], 1.0]], weight: true }, because: [{ id: 'sShore' }] });
  C.forEach((c, k) => H({ id: 'hC0' + k, actor: c, t0: 0.3 + 0.1 * k, t1: q(tHawk + 0.7 + 0.1 * k), reason: 'the crew, the oars still in their hands', params: { look: [[TE, 1.6], [PI, 1.0]], weight: true, offset: 0.3 * k }, because: [{ id: 'sShore' }] }));
  I({ id: 'tSee', actor: TE, kind: 'REACT', t0: q(tHawk + 0.5), t1: q(tHawk + 1.4), label: 'a bird on his right', params: { how: 'turn', lookAt: H1 }, because: [{ id: 'sHawk', latency: 0.1 }] });
  I({ id: 'thSee', actor: TH, kind: 'REACT', t0: q(tHawk + 0.55), t1: q(tHawk + 1.5), label: 'the seer sees it', params: { how: 'startle', lookAt: H1 }, because: [{ id: 'sHawk', latency: 0.15 }] });
  I({ id: 'pSee', actor: PI, kind: 'REACT', t0: q(tHawk + 0.7), t1: q(tHawk + 1.6), label: 'Piraeus looks up', params: { how: 'turn', lookAt: H1 }, because: [{ id: 'sHawk', latency: 0.3 }] });
  C.forEach((c, k) => I({ id: 'cSee' + k, actor: c, kind: 'REACT', t0: q(tHawk + 0.8 + 0.1 * k), t1: q(tHawk + 1.7 + 0.1 * k), label: 'the crew look up', params: { how: 'turn', lookAt: H1 }, because: [{ id: 'sHawk', latency: 0.4 + 0.1 * k }] }));
  H({ id: 'hT1', actor: TE, t0: q(tHawk + 1.45), t1: q(cR.at - 0.2), reason: 'he follows it, then the feathers down', params: { look: [[H2, 1.4], [FD, 2.6]], weight: true }, because: [{ id: 'tSee' }] });
  H({ id: 'hTh1', actor: TH, t0: q(tHawk + 1.55), t1: q(cR.at - 0.6), reason: 'he reads it as it flies', params: { look: [[H2, 1.6], [TE, 1.6]], weight: true }, because: [{ id: 'thSee' }] });
  /* ── the reading ── */
  I({ id: 'thApart', actor: TH, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: TE, label: 'he calls him apart and takes his hand', because: [{ id: 'hTh1' }] });
  I({ id: 'thRead', actor: TH, kind: 'DECLARE', target: TE, utterance: cR.gi, t0: q(Math.max(cR.at - 0.2, W('K2')[1] + 0.05)), t1: q(cR.at + cR.dur), label: 'that bird flew on your right by a god\'s will: no house in Ithaca is more kingly than yours', params: { shapes: ['point', 'open', 'chest'], side: 'R', maxBeats: 3, amp: 1.0 }, because: [{ id: 'thApart' }, { id: 'v' + cR.gi, rel: 'realises' }] });
  I({ id: 'tListen', actor: TE, kind: 'LISTEN', target: TH, t0: q(cR.at + 0.4), t1: q(cR.at + cR.dur), label: 'he hears the omen read', params: { nods: [q(cR.at + cR.dur * 0.55), q(cR.at + cR.dur - 0.6)] }, because: [{ id: 'thRead' }] });
  H({ id: 'hP1', actor: PI, t0: q(tHawk + 1.65), t1: q(K('K4').t - 0.4), reason: 'he waits on the prince', params: { look: [[TE, 2.0], [TH, 1.2], [C[0], 0.8]], weight: true }, because: [{ id: 'pSee' }] });
  /* ── the order to the crew ── */
  I({ id: 'tTurn', actor: TE, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: C[0], label: 'he turns to the crew', because: [{ id: 'thRead' }] });
  I({ id: 'tOrder', actor: TE, kind: 'DECLARE', target: C[0], utterance: cO.gi, t0: q(Math.max(cO.at - 0.2, W('K3')[1] + 0.05)), t1: q(cO.at + cO.dur), label: 'take her round to the town without me: I go inland to my farms', params: { shapes: ['point', 'open', 'chest', 'point'], side: 'R', maxBeats: 3, amp: 1.0 }, because: [{ id: 'tTurn' }, { id: 'v' + cO.gi, rel: 'realises' }] });
  C.forEach((c, k) => H({ id: 'hC1' + k, actor: c, t0: q(tHawk + 1.8 + 0.1 * k), t1: q(cO.at + cO.dur * 0.6), reason: 'they listen for their orders', params: { look: [[TE, 2.4], [TH, 0.8]], weight: true, offset: 0.4 * k }, because: [{ id: 'cSee' + k }] }));
  C.forEach((c, k) => I({ id: 'cNod' + k, actor: c, kind: 'REACT', t0: q(cO.at + cO.dur * 0.6 + 0.2 * k), t1: q(cO.at + cO.dur * 0.6 + 1.0 + 0.2 * k), label: 'aye: the ship round to the town', params: { how: 'nod', lookAt: TE }, because: [{ id: 'tOrder', latency: 0.5 }] }));
  C.forEach((c, k) => I({ id: 'cBoard' + k, actor: c, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: [140, 40, 150], label: 'back to the ship', because: [{ id: 'cNod' + k }] }));
  H({ id: 'hTh2', actor: TH, t0: q(cR.at + cR.dur + 0.05), t1: q(K('K4').t - 0.3), reason: 'a fugitive: where will he sleep tonight?', params: { look: [[TE, 2.4], [PI, 1.0]], weight: true }, because: [{ id: 'thRead' }] });
  /* ── Piraeus, and the road ── */
  I({ id: 'tGive', actor: TE, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: PI, label: 'to Piraeus', because: [{ id: 'tOrder' }, { id: 'v' + cE.gi, rel: 'realises' }] });
  I({ id: 'tEntrust', actor: TE, kind: 'GESTURE', target: PI, t0: q(W('K4')[1] + 0.1), t1: q(W('K4')[1] + 1.9), label: 'keep this stranger as your guest until I send for him', params: { shape: 'offer', at: q(W('K4')[1] + 0.6), side: 'R', amp: 1.0, hold: 0.6 }, because: [{ id: 'tGive' }] });
  I({ id: 'pNod', actor: PI, kind: 'REACT', t0: q(W('K4')[1] + 1.0), t1: q(W('K4')[1] + 2.0), label: 'gladly', params: { how: 'nod', lookAt: TE }, because: [{ id: 'tEntrust', latency: 0.5 }] });
  I({ id: 'thGo', actor: TH, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: PI, label: 'the seer goes to his host', because: [{ id: 'tGive', latency: 0.3 }] });
  I({ id: 'tWalk', actor: TE, kind: 'APPROACH', key: 'K4a', t0: W('K4a')[0], t1: W('K4a')[1], target: [292, 40, -175], label: 'off along the shore, alone', because: [{ id: 'pNod' }] });
  I({ id: 'tInland', actor: TE, kind: 'APPROACH', key: 'K4b', t0: W('K4b')[0], t1: W('K4b')[1], target: [292, 40, -400], label: 'inland, up the path toward the swineherd\'s farm', because: [{ id: 'tWalk' }] });
  H({ id: 'hP2', actor: PI, t0: q(W('K4')[1] + 2.05), t1: T, reason: 'he watches the prince go', params: { look: [[TE, 3.0], [TH, 1.0]], weight: true }, because: [{ id: 'pNod' }] });
  H({ id: 'hTh3', actor: TH, t0: q(W('K4')[1] + 0.05), t1: T, reason: 'he watches the king\'s son walk away alone', params: { look: [[TE, 3.0], [PI, 1.0]], weight: true }, because: [{ id: 'thGo' }] });
  C.forEach((c, k) => H({ id: 'hC2' + k, actor: c, t0: q(W('K4')[1] + 0.05), t1: T, reason: 'at the ship, ready to row her round', params: { look: [[TE, 2.0], [PI, 1.2]], weight: true, offset: 0.3 * k }, because: [{ id: 'cBoard' + k }] }));
  return {
    type: 'dialogue', title: 'Telemachus Lands in Secret: the hawk and the dove, the omen read, the ship sent on, the road inland',
    actors: { [TE]: { role: 'Telemachus', body: 'minifig', principal: true }, [TH]: { role: 'Theoclymenus the seer', body: 'minifig', principal: true }, [PI]: { role: 'Piraeus', body: 'minifig' },
      ...Object.fromEntries(C.map(c => [c, { role: 'one of the crew', body: 'minifig', group: 'crew' }])) },
    objects: { hawkDove: { kind: 'bird', material: 'feather', affords: ['fly'] }, feathers: { kind: 'feathers', material: 'feather', affords: [] } },
    authored: { intents, holds, stimuli, goals: { [TE]: 'land unseen, and go to the swineherd', [TH]: 'a roof, and the god\'s word read', [PI]: 'serve the prince' },
      causal: { tau: 0.7, actions: {
        [TE]: [{ a: 'see to the landing', base: 1.0, f: { 'after:sHawk': -2.0 } }, { a: 'watch the bird', base: -2.0, f: { 'after:sHawk': 4.0, 'after:thRead': -4.0 } }, { a: 'give his orders', base: -2.0, f: { 'after:thRead': 3.0 } }, { a: 'go inland', base: -3.0, f: { 'after:tEntrust': 5.0 } }],
        [TH]: [{ a: 'keep silent', base: 1.0, f: { 'after:sHawk': -2.5 } }, { a: 'read the omen', base: -1.5, f: { 'after:sHawk': 3.5 } }] } },
      camera: { follow: true },
    },
  };
};
