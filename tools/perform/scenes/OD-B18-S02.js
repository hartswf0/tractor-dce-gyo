/* Odysseus Drops Irus (OD-B18-S02, Odyssey 18): the suitors make a ring in the hall for the two beggars, Antinous's goat's paunch the
   prize. Odysseus girds up his rags and shows his thighs, his chest and his arms; Athena stands by him and fills out his limbs, and the
   suitors stare. Irus trembles and would slip away; Antinous threatens him and the servants push him in. Odysseus weighs it, kill him
   or only drop him, and drops him: one blow under the ear, the bones broken; Irus falls kicking, the blood at his mouth, and the
   suitors throw up their hands and almost die of laughing. Odysseus drags him out by the foot to the gate and props him against the
   wall: sit there and keep off the dogs and the pigs. They laugh; Amphinomus brings him bread and a golden cup.

   The chain: the ring (SCENE) -> his line and the rags girded (DECLARE) -> Athena's work on him (SIGHT, the take's K2 his APPROACH)
   -> the suitors' startle and Irus's flinch -> Antinous's threat (GESTURE) -> Irus pushed in (K3) -> Odysseus's guard (K3) -> his
   DECIDE (drop him, not kill him) -> the step in (K4) -> PUNCH (CONTACT IMPACT) -> Irus's IMPACT and FALL (K4a) -> the suitors'
   laughter (REACT) -> the drag to the gate (K5, both moved by the one decision) and his word to Irus (DECLARE) -> the cheer ->
   Amphinomus's bread and cup (K6, GESTURE offer). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win, T = M.total, q = t => Math.round(t * 12) / 12;
  const B = 'odysseus-as-beggar', IR = 'irus', AM = 'amphinomus', AN = 'antinous', S = ['four-suitors-1', 'four-suitors-2', 'four-suitors-3', 'four-suitors-4'];
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c4 = clip(4), c5 = clip(5), c7 = clip(7), c8 = clip(8);
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const gate = [40, 40, 250];
  stimuli.push({ id: 'sRing', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the suitors make a ring for the two beggars: the goat\'s paunch the prize', because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  /* ── the rags come up ── */
  I({ id: 'bShow', actor: B, kind: 'DECLARE', target: IR, utterance: c2.gi, t0: q(c2.at - 0.2), t1: q(c2.at + c2.dur), label: 'look, then: the rags come up, and you may all see what the sea left me', params: { shapes: ['show', 'chest'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  H({ id: 'hB0', actor: B, t0: 0.3, t1: q(c2.at - 0.25), reason: 'an old beggar in a ring of young men: he weighs the other', params: { look: [[IR, 2.0], [AN, 0.8], [IR, 2.0]], weight: true }, because: [{ id: 'sRing' }] });
  H({ id: 'hI0', actor: IR, t0: 0.3, t1: q(W('K2')[0] + 0.2), reason: 'the king of the beggars, sure of his ground: an old man to beat for a paunch', params: { look: [[B, 2.0], [S[0], 0.8], [B, 1.6]], weight: true }, because: [{ id: 'sRing' }] });
  S.forEach((s, k) => H({ id: 'hS0' + k, actor: s, t0: 0.3 + 0.1 * k, t1: q(W('K2')[0] + 0.3), reason: 'a ring round the two beggars: sport', params: { look: [[B, 1.4], [IR, 1.4], [AN, 0.6]], weight: true, offset: 0.25 * k }, because: [{ id: 'sRing' }] }));
  H({ id: 'hAn0', actor: AN, t0: 0.3, t1: q(W('K3')[0] - 0.1), reason: 'he set the match: he watches it', params: { look: [[IR, 1.6], [B, 1.6]], weight: true }, because: [{ id: 'sRing' }] });
  H({ id: 'hAm0', actor: AM, t0: 0.3, t1: q(W('K6')[0] - 0.1), reason: 'Amphinomus watches the old man, uneasy at the sport', params: { look: [[B, 2.2], [IR, 1.2], [AN, 0.8]], weight: true }, because: [{ id: 'sRing' }] });
  /* ── Athena fills out his limbs ── */
  stimuli.push({ id: 'sAthena', t0: q(W('K2')[0]), t1: q(W('K2')[0] + 0.6), kind: 'SIGHT', label: 'Athena stands by him and fills out his limbs: the thighs, the broad chest, the arms', actor: B, because: [{ id: 'bShow' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  I({ id: 'bTall', actor: B, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: IR, label: 'he stands taller: the shoulders they remember', because: [{ id: 'sAthena' }] });
  S.slice(0, 2).forEach((s, k) => I({ id: 'sStare' + k, actor: s, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: B, label: 'stares: what a thigh the old man shows', because: [{ id: 'sAthena', latency: 0.3 + 0.1 * k }] }));
  I({ id: 'iShrink', actor: IR, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: B, label: 'a step back, his heart failing', because: [{ id: 'sAthena', latency: 0.3 }] });
  I({ id: 'iFlinch', actor: IR, kind: 'REACT', t0: q(W('K2')[1] + 0.05), t1: q(W('K2')[1] + 1.1), label: 'he trembles', params: { how: 'flinch', lookAt: B }, because: [{ id: 'iShrink' }] });
  H({ id: 'hB1', actor: B, t0: q(c2.at + c2.dur + 0.05), t1: q(W('K3')[0] - 0.1), reason: 'he stands and lets them look', params: { look: [[IR, 2.4], [S[0], 0.8], [IR, 2.0]], weight: true }, because: [{ id: 'bTall' }] });
  H({ id: 'hI1', actor: IR, t0: q(W('K2')[1] + 1.15), t1: q(W('K3')[0] - 0.1), reason: 'he would slip away if the ring let him', params: { look: [[B, 1.2], [S[1], 0.8], [AN, 0.8]], weight: true }, because: [{ id: 'iFlinch' }] });
  /* ── Irus pushed in ── */
  I({ id: 'anThreat', actor: AN, kind: 'GESTURE', target: IR, t0: q(W('K3')[0] - 1.5), t1: q(W('K3')[0] + 0.2), label: 'fight, or I ship you to King Echetus', params: { shape: 'point', at: q(W('K3')[0] - 1.0), side: 'R', amp: 1.0, hold: 0.6 }, because: [{ id: 'iFlinch' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  I({ id: 'anPoint', actor: AN, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: IR, label: 'the arm out at him: in you go', because: [{ id: 'anThreat' }] });
  I({ id: 'iPushed', actor: IR, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: B, label: 'pushed into the ring, his limbs all a-tremble', because: [{ id: 'anThreat', latency: 0.3 }] });
  I({ id: 'bGuard', actor: B, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: IR, label: 'the fists up', because: [{ id: 'iPushed', latency: 0.2 }] });
  H({ id: 'hAn1', actor: AN, t0: q(W('K3')[1] + 0.05), t1: q(W('K4a')[0] + 0.2), reason: 'he watches his match', params: { look: [[IR, 1.4], [B, 1.4]], weight: true }, because: [{ id: 'anPoint' }] });
  S.forEach((s, k) => H({ id: 'hS1' + k, actor: s, t0: q(Math.max(W('K2')[1] + 0.3, W('K2')[0] + 0.4) + 0.1 * k), t1: q(W('K4a')[0] + 0.1), reason: 'the ring closes: the two face each other', params: { look: [[IR, 1.2], [B, 1.4]], weight: true, offset: 0.3 * k }, because: [{ id: 'sAthena' }] }));
  /* ── the blow ── */
  const wF = W('K4a'), tHit = q(wF[0] - 0.08), tA = q(tHit - 0.5);
  I({ id: 'bDecide', actor: B, kind: 'DECIDE', t0: q(W('K4')[0] - 0.8), t1: q(W('K4')[0]), label: 'kill him, or only lay him down? lay him down: no one must suspect', because: [{ id: 'bGuard' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  H({ id: 'hB2', actor: B, t0: q(W('K3')[1] + 0.05), t1: q(W('K4')[0] - 0.85), reason: 'the fists up, he watches the frightened man come', params: { look: [[IR, 3.0]], weight: true }, because: [{ id: 'bGuard' }] });
  H({ id: 'hI2', actor: IR, t0: q(W('K3')[1] + 0.05), t1: q(tA - 0.05), reason: 'his fists up, trembling', params: { look: [[B, 3.0]], weight: true }, because: [{ id: 'iPushed' }] });
  I({ id: 'bIn', actor: B, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: IR, label: 'steps in', because: [{ id: 'bDecide' }] });
  I({ id: 'iSwing', actor: IR, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: B, label: 'swings at his shoulder', because: [{ id: 'bIn', latency: 0.15 }] });
  I({ id: 'bPunch', actor: B, kind: 'PUNCH', target: IR, t0: tA, t1: q(tA + 1.2), label: 'one blow on the neck under the ear: the bones broken', params: { hit: true, impactId: 'hitI', side: 'R' }, because: [{ id: 'bIn' }] });
  I({ id: 'iHit', actor: IR, kind: 'IMPACT', t0: q(tHit + 0.05), t1: q(wF[0] + 0.4), label: 'the blood at his mouth', params: { until: q(wF[0] + 0.35) }, because: [{ id: 'hitI', latency: 0.05 }] });
  I({ id: 'iFall', actor: IR, kind: 'FALL', t0: wF[0], t1: wF[1], label: 'down in the dust, kicking the ground', params: { key: 'K4a' }, because: [{ id: 'iHit' }] });
  H({ id: 'hI3', actor: IR, t0: q(wF[1] + 0.1), t1: q(W('K5')[0] - 0.1), reason: 'on his back, gnashing his teeth, kicking the ground', params: { look: [[B, 1.0]], weight: true }, because: [{ id: 'iFall' }] });
  stimuli.push({ id: 'sDown', t0: q(wF[0] + 0.2), t1: q(wF[0] + 0.6), kind: 'SIGHT', label: 'Irus down in one blow', actor: IR, because: [{ id: 'iFall' }] });
  S.forEach((s, k) => I({ id: 'sLaugh' + k, actor: s, kind: 'REACT', t0: q(wF[0] + 0.4 + 0.1 * k), t1: q(wF[0] + 1.6 + 0.1 * k), label: 'throw up their hands and almost die of laughing', params: { how: 'laugh', lookAt: IR }, because: [{ id: 'sDown', latency: 0.3 + 0.1 * k }] }));
  I({ id: 'anLaugh', actor: AN, kind: 'REACT', t0: q(wF[0] + 0.5), t1: q(wF[0] + 1.6), label: 'laughs', params: { how: 'laugh', lookAt: IR }, because: [{ id: 'sDown', latency: 0.4 }] });
  I({ id: 'bBack', actor: B, kind: 'RECOVER', t0: q(tA + 1.25), t1: q(tA + 2.1), label: 'the fist down', because: [{ id: 'bPunch' }] });
  H({ id: 'hB3', actor: B, t0: q(tA + 2.15), t1: q(W('K5')[0] - 0.85), reason: 'he looks down at the man he has dropped', params: { look: [[IR, 2.4], [AN, 0.8]], weight: true }, because: [{ id: 'bBack' }] });
  S.forEach((s, k) => H({ id: 'hS2' + k, actor: s, t0: q(wF[0] + 1.7 + 0.1 * k), t1: q(W('K6')[0] - 0.1), reason: 'still laughing at the king of the beggars in the dust', params: { look: [[IR, 1.2], [B, 1.2], [S[(k + 1) % 4], 0.6]], weight: true, offset: 0.3 * k }, because: [{ id: 'sLaugh' + k }] }));
  H({ id: 'hAn2', actor: AN, t0: q(wF[0] + 1.7), t1: q(W('K6')[0] - 0.1), reason: 'the prize is the old man\'s', params: { look: [[B, 2.0], [IR, 1.0]], weight: true }, because: [{ id: 'anLaugh' }] });
  /* ── to the gate ── */
  I({ id: 'bDrag', actor: B, kind: 'DECIDE', t0: q(W('K5')[0] - 0.8), t1: q(W('K5')[0]), label: 'out to the gate with him, by the foot', because: [{ id: 'hB3' }, { id: 'v' + c7.gi, rel: 'realises' }] });
  I({ id: 'bGo', actor: B, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: gate, label: 'drags him by the foot through the court to the gate', because: [{ id: 'bDrag' }] });
  I({ id: 'iDragged', actor: IR, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: gate, label: 'dragged out and propped against the wall', because: [{ id: 'bGo', latency: 0.1 }] });
  I({ id: 'bWord', actor: B, kind: 'DECLARE', target: IR, utterance: c7.gi, t0: q(Math.max(c7.at - 0.2, W('K5')[1] + 0.05)), t1: q(c7.at + c7.dur), label: 'sit there in the dirt and keep off the dogs and the pigs', params: { shapes: ['point', 'chop', 'point'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: 'bGo' }] });
  H({ id: 'hI4', actor: IR, t0: q(W('K5')[1] + 0.05), t1: T, reason: 'propped against the gate wall, the head hanging', params: { look: [[B, 1.0], [gate, 2.0]], weight: true, still: true }, because: [{ id: 'iDragged' }] });
  /* ── the cheer, the bread and the cup ── */
  stimuli.push({ id: 'sCheer', t0: q(W('K6')[0] - 0.4), t1: q(W('K6')[0]), kind: 'SOUND', label: 'the suitors laugh until the rafters take it up', because: [{ id: 'bWord' }, { id: 'v' + c8.gi, rel: 'realises' }] });
  I({ id: 'bReturn', actor: B, kind: 'APPROACH', key: 'K6', t0: W('K6')[0], t1: W('K6')[1], target: AM, label: 'back into the hall', because: [{ id: 'sCheer' }] });
  I({ id: 'amCome', actor: AM, kind: 'APPROACH', key: 'K6', t0: W('K6')[0], t1: W('K6')[1], target: B, label: 'brings two loaves from the basket and a golden cup', because: [{ id: 'sCheer', latency: 0.3 }] });
  S.forEach((s, k) => I({ id: 'sCheer' + k, actor: s, kind: 'APPROACH', key: 'K6', t0: W('K6')[0], t1: W('K6')[1], target: B, label: 'the hands up, laughing', because: [{ id: 'sCheer', latency: 0.1 * k }] }));
  I({ id: 'anCheer', actor: AN, kind: 'APPROACH', key: 'K6', t0: W('K6')[0], t1: W('K6')[1], target: B, label: 'laughing with them', because: [{ id: 'sCheer', latency: 0.2 }] });
  I({ id: 'amOffer', actor: AM, kind: 'GESTURE', target: B, t0: q(W('K6')[1] + 0.1), t1: q(W('K6')[1] + 2.0), label: 'good fortune to you hereafter, stranger', params: { shape: 'offer', at: q(W('K6')[1] + 0.6), side: 'R', amp: 1.0, hold: 0.8 }, because: [{ id: 'amCome' }] });
  I({ id: 'bTake', actor: B, kind: 'REACT', t0: q(W('K6')[1] + 0.7), t1: q(W('K6')[1] + 1.7), label: 'he takes the cup and looks at the man who wishes him well', params: { how: 'nod', lookAt: AM }, because: [{ id: 'amOffer', latency: 0.5 }] });
  H({ id: 'hB4', actor: B, t0: q(W('K6')[1] + 1.75), t1: T, reason: 'he knows what Amphinomus is wishing on himself', params: { look: [[AM, 2.6], [AN, 0.8], [AM, 2.0]], weight: true }, because: [{ id: 'bTake' }] });
  H({ id: 'hAm1', actor: AM, t0: q(W('K6')[1] + 2.05), t1: T, reason: 'he has pledged the stranger: he does not know whom', params: { look: [[B, 3.0]], weight: true }, because: [{ id: 'amOffer' }] });
  S.forEach((s, k) => H({ id: 'hS3' + k, actor: s, t0: q(W('K6')[1] + 0.1), t1: T, reason: 'laughing, the beggar is their champion now', params: { look: [[B, 1.4], [AM, 1.0], [S[(k + 2) % 4], 0.6]], weight: true, offset: 0.3 * k }, because: [{ id: 'sCheer' + k }] }));
  H({ id: 'hAn3', actor: AN, t0: q(W('K6')[1] + 0.1), t1: T, reason: 'the paunch set before the stranger', params: { look: [[B, 2.0], [AM, 1.0]], weight: true }, because: [{ id: 'anCheer' }] });
  H({ id: 'hB5', actor: B, t0: q(c7.at + c7.dur + 0.05), t1: q(W('K6')[0] - 0.1), reason: 'he leaves him at the gate and turns back to the hall', params: { look: [[IR, 1.0], [AN, 1.2]], weight: true }, because: [{ id: 'bWord' }] });
  return {
    type: 'fight', title: 'Odysseus Drops Irus: the rags girded, Athena\'s strength, one blow, the gate, the cup',
    actors: { [B]: { role: 'the beggar, the king', body: 'minifig', principal: true, affect: { cunning: 0.8, weight: 0.7 } }, [IR]: { role: 'Irus, the beggar of the town', body: 'minifig', principal: true, affect: { fear: 0.8 } },
      [AN]: { role: 'Antinous, who set the match', body: 'minifig' }, [AM]: { role: 'Amphinomus, the kindly suitor', body: 'minifig' },
      ...Object.fromEntries(S.map(s => [s, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { gate: { kind: 'gate', material: 'stone', at: gate, affords: ['prop'] }, cup: { kind: 'cup', material: 'gold', holder: AM + ':R', affords: ['offer'] } },
    authored: { intents, holds, stimuli, goals: { [B]: 'win and stay unknown: drop him, do not kill him', [IR]: 'get out of it', [AN]: 'sport', [AM]: 'courtesy to the stranger' },
      couplings: [{ from: B, to: IR, via: 'flesh', t0: q(tHit - 0.2), t1: q(tHit + 0.4) }],
      causal: { tau: 0.7, actions: {
        [B]: [{ a: 'show himself', base: 0.5, f: { 'after:sAthena': -1 } }, { a: 'kill him', base: -2.0, f: { 'after:iPushed': 0.8 } }, { a: 'drop him', base: -1.5, f: { 'after:iPushed': 2.5, 'after:hitI': -3 } }, { a: 'drag him out', base: -2.5, f: { 'after:sDown': 3.0 } }],
        [IR]: [{ a: 'swagger', base: 1.0, f: { 'after:sAthena': -2.5 } }, { a: 'slip away', base: -1.0, f: { 'after:sAthena': 2.5, 'after:anThreat': -2.0 } }, { a: 'fight', base: -2.0, f: { 'after:anThreat': 3.0 } }],
        ...Object.fromEntries(S.map(s => [s, [{ a: 'watch', base: 1.0, f: {} }, { a: 'laugh', base: -1.5, f: { 'after:sDown': 3.0 } }]])) } },
      camera: { follow: true },
    },
  };
};
