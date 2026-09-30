/* The Assembly: Antinous and the Web (OD-B02-S02, Odyssey 2): Antinous turns Telemachus's blame back on his mother, tells how she wove
   the shroud by day and unravelled it by torchlight for three years, and demands she be sent back to her father to marry.

   An accuser against a young man with a staff. Antinous's lines are carried on their stresses (DECLARE: the point at Telemachus, the
   dismissal of the blame, the chop at "fault", the fist); the suitors laugh at "queen of cunning" (REACT laugh, each after the one
   beside him); Telemachus takes it with the staff gripped (a HOLD with its reason) and flinches at "your own mother" (REACT). The
   story of the web is told as the take's insert of Penelope at the loom (K2): she weaves by day (WEAVE: the shuttle hand to hand, the
   beater), and by torchlight picks it out thread by thread (TOOL_WORK carve, slow), her head turning to the door (a HOLD: will anyone
   see?). Back in the hall (K5), the maid who betrayed her is there (SHAME, the eyes down); Penelope stands straight (a HOLD) while
   Antinous makes his demand, and Telemachus's grip on the staff tightens at "marry" (REACT). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const An = 'antinous', Tm = 'telemachus', P = 'penelope-at-the-loom', Me = 'melantho', S = Object.keys(M.H).filter(i => /suitor/.test(i));
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c5 = clip(5);
  const V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), V5 = X.voiceOf(c5), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tMother = q(w(V2, 'mother', 10.6)), tCunning = q(w(V2, 'cunning', 12.6)), tWove = q(w(V3, 'wove', 38.1)), tNight = q(w(V3, 'night', 41.3)), tMarry = q(w(V5, 'marry', 55.0)), door = [150, 50, 60];
  /* ── the accusation ── */
  stimuli.push({ id: 'sAssembly', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'the assembly of Ithaca: the young man has spoken; the suitors answer', because: [] });
  I({ id: 'anAccuse', actor: An, kind: 'DECLARE', target: Tm, utterance: c2.gi, t0: c2.at - 0.2, t1: c2.at + c2.dur, label: 'the fault is not ours but your mother\'s', params: { shapes: ['point', 'dismiss', 'chop', 'point', 'open', 'fist'], side: 'R' }, because: [{ id: 'v' + c2.gi, rel: 'realises' }, { id: 'sAssembly' }] });
  holds.push({ id: 'hTm0', actor: Tm, t0: 0.45, t1: tMother - 0.1, reason: 'the staff gripped: he has to hear this out', params: { look: [[An, 3.0], [S[0], 0.8]], weight: true, grip: 'R' }, because: [{ id: 'anAccuse' }] });
  stimuli.push({ id: 'sMother', t0: tMother, t1: tMother + 0.3, kind: 'WORD', label: '"your own mother"', actor: An, because: [{ id: 'anAccuse' }] });
  I({ id: 'tmFlinch', actor: Tm, kind: 'REACT', t0: tMother + 0.25, t1: tMother + 1.3, label: 'his mother named', params: { how: 'flinch', lookAt: An }, because: [{ id: 'sMother' }] });
  holds.push({ id: 'hTm1', actor: Tm, t0: tMother + 1.4, t1: K2.win[0] - 0.1, reason: 'white with anger, the staff in his fist', params: { look: [[An, 2.6], [S[1], 0.8]], weight: true, grip: 'R' }, because: [{ id: 'tmFlinch' }] });
  stimuli.push({ id: 'sCunning', t0: tCunning, t1: tCunning + 0.3, kind: 'WORD', label: '"that queen of cunning"', actor: An, because: [{ id: 'anAccuse' }] });
  S.forEach((s, k) => { I({ id: 'sLaugh' + k, actor: s, kind: 'REACT', t0: q(tCunning + 0.3 + 0.18 * k), t1: q(tCunning + 1.5 + 0.18 * k), label: 'laughs, as the man beside him laughs', params: { how: 'laugh', lookAt: Tm }, because: [{ id: k ? 'sLaugh' + (k - 1) : 'sCunning' }] });
    holds.push({ id: 'hS0' + k, actor: s, t0: 0.3, t1: q(tCunning + 0.2 + 0.18 * k), reason: 'the suitors\' bench: Antinous speaks for them', params: { look: [[An, 2.2], [Tm, 1.4]], weight: true, offset: 0.3 * k }, because: [{ id: 'sAssembly' }] });
    holds.push({ id: 'hS1' + k, actor: s, t0: q(tCunning + 1.6 + 0.18 * k), t1: K2.win[0] - 0.1, reason: 'enjoying it', params: { look: [[Tm, 1.6], [An, 1.8]], weight: true, offset: 0.3 * k }, because: [{ id: 'sLaugh' + k }] }); });
  if (c2.at + c2.dur + 0.6 < K2.win[0]) holds.push({ id: 'hAn0', actor: An, t0: c2.at + c2.dur + 0.1, t1: K2.win[0] - 0.1, reason: 'he has the assembly', params: { look: [[Tm, 1.6], [S[0], 0.8]], weight: true }, because: [{ id: 'anAccuse' }] });
  /* ── the web (the take's insert) ── */
  I({ id: 'anTell', actor: An, kind: 'DECLARE', target: Tm, utterance: c3.gi, t0: c3.at - 0.2, t1: c3.at + c3.dur, label: 'the great loom, the shroud for Laertes', params: { shapes: ['describe', 'describe', 'point', 'mime', 'chop'], side: 'R' }, because: [{ id: 'v' + c3.gi, rel: 'realises' }] });
  I({ id: 'pWeave', actor: P, kind: 'WEAVE', t0: K2.win[1] + 0.1, t1: q(tNight - 0.2), label: 'all day at the web', params: { period: 1.5 }, because: [{ id: 'anTell' }] });
  stimuli.push({ id: 'sNight', t0: tNight, t1: tNight + 0.4, kind: 'SCENE', label: 'night: torches beside her', because: [{ id: 'pWeave' }] });
  I({ id: 'pUnpick', actor: P, kind: 'TOOL_WORK', t0: q(tNight + 0.3), t1: K5.win[0] - 0.1, label: 'unravels it thread by thread', params: { how: 'carve', period: 1.3 }, because: [{ id: 'sNight' }] });
  holds.push({ id: 'hP0', actor: P, t0: q(tWove - 0.2), t1: q(tWove + 1.4), reason: 'a look to the door: will anyone see?', params: { look: [[door, 1.2]], weight: false }, because: [{ id: 'pWeave' }] });
  /* ── the demand ── */
  I({ id: 'meShame', actor: Me, kind: 'SHAME', t0: K5.win[1] + 0.1, t1: T, label: 'the maid who betrayed her: the eyes down', params: { lookAt: P, hold: 4.0 }, because: [{ id: 'anTell' }] });
  holds.push({ id: 'hP1', actor: P, t0: K5.win[1] + 0.2, t1: T, reason: 'the queen stands straight before them', params: { look: [[An, 2.4], [Tm, 1.2], [Me, 0.8]], weight: false }, because: [{ id: 'anTell' }] });
  I({ id: 'anDemand', actor: An, kind: 'DECLARE', target: Tm, utterance: c5.gi, t0: c5.at - 0.2, t1: c5.at + c5.dur, label: 'send her back to her father and let her marry', params: { shapes: ['dismiss', 'point', 'open', 'chop'], side: 'R' }, because: [{ id: 'v' + c5.gi, rel: 'realises' }, { id: 'anTell' }] });
  stimuli.push({ id: 'sMarry', t0: tMarry, t1: tMarry + 0.3, kind: 'WORD', label: '"let her marry"', actor: An, because: [{ id: 'anDemand' }] });
  I({ id: 'tmGrip', actor: Tm, kind: 'REACT', t0: tMarry + 0.2, t1: tMarry + 1.3, label: 'the staff tight in his hand', params: { how: 'lean', lookAt: An }, because: [{ id: 'sMarry' }] });
  holds.push({ id: 'hTm2', actor: Tm, t0: K5.win[1] + 0.2, t1: tMarry, reason: 'he must answer this', params: { look: [[An, 2.6], [P, 1.0]], weight: true, grip: 'R' }, because: [{ id: 'anDemand' }] });
  holds.push({ id: 'hTm3', actor: Tm, t0: tMarry + 1.4, t1: T, reason: 'he will answer: never', params: { look: [[An, 3.0]], weight: true, grip: 'R' }, because: [{ id: 'tmGrip' }] });
  S.forEach((s, k) => holds.push({ id: 'hS2' + k, actor: s, t0: K5.win[1] + 0.2, t1: T, reason: 'waiting for the young man\'s answer', params: { look: [[Tm, 1.8], [P, 1.2], [An, 1.0]], weight: true, offset: 0.3 * k }, because: [{ id: 'anDemand' }] }));
  return {
    type: 'dialogue', title: 'The Assembly: the accusation, the web, the demand',
    actors: { [An]: { role: 'the leading suitor', body: 'minifig', principal: true, affect: { heat: 0.6 } }, [Tm]: { role: 'the young man with the staff', body: 'minifig', principal: true }, [P]: { role: 'the queen at her loom', body: 'minifig', principal: true, affect: { cunning: 0.9 } }, [Me]: { role: 'the maid who told', body: 'minifig' }, ...Object.fromEntries(S.map(s => [s, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { staff: { kind: 'staff', material: 'wood', holder: Tm + ':R', affords: ['grip'] }, loom: { kind: 'loom', material: 'wood', at: [56, 40, 30], affords: ['weave'] } },
    authored: { intents, holds, stimuli, goals: { [An]: 'shame the young man; get the queen married', [Tm]: 'not break before them', [P]: 'hold them off another day' },
      couplings: [{ from: P, to: 'loom', via: 'wood', t0: K2.win[1], t1: K5.win[0] }],
      causal: { tau: 0.7, actions: {
        [Tm]: [{ a: 'hold his ground', base: 1.0, f: { 'after:sMother': -0.4 } }, { a: 'shout back', base: -2.0, f: { 'after:sMother': 1.8, 'after:sCunning': 1.0 } }, { a: 'leave the assembly', base: -2.8, f: { 'after:sCunning': 0.8 } }, { a: 'refuse', base: -2.5, f: { 'after:sMarry': 3.2 } }],
        [An]: [{ a: 'accuse', base: 1.0, f: {} }, { a: 'tell the trick', base: -1.5, f: { 'after:sCunning': 2.0 } }, { a: 'demand', base: -2.5, f: { 'after:anTell': 3.0 } }],
        [P]: [{ a: 'weave', base: 1.0, f: { 'after:sNight': -2.5 } }, { a: 'unravel', base: -2.5, f: { 'after:sNight': 3.6 } }],
      } },
      camera: { follow: true },
    },
  };
};
