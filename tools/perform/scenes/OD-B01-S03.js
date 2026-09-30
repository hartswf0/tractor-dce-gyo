/* The Gate (OD-B01-S03, Odyssey 1): acting. Athena, as Mentes, arrives and waits at the outer gate, unattended; the suitors dice and
   drink and never look toward the gate; Telemachus, grieving at his father's table, hears the spear's butt on the threshold stone,
   sees her, is ashamed of his house, sets down his cup, rises, crosses the hall, stops halfway, goes to her, welcomes her, takes her
   spear (the handoff: two bodies, one grip, ownership that changes and stays changed), turns and leads her in; she follows; both
   cross the threshold. Authored from the take: the blocking's windows (K3 the crossing, K4 the approach) and the line's words.

   The intents carry the director's parameters (tools/perform/intents.js: WELCOME's approach, openness, headLead, handToSpearDelay,
   gazeHold, backBias); a patch changes a kind or a parameter and the compiler re-derives the body. */
'use strict';
module.exports = function author(M, X) {
  const line = M.clips.find(c => c.kind === 'DIALOGUE'), V = X.voiceOf(line), word = w => (V.words.find(x => x.w === w) || {}).t;
  const K = id => M.keys.find(k => k.id === id), K3 = K('K3'), K4 = K('K4');
  const spear = word('spear') || line.at + 5.2, come = word('come') && V.words.filter(x => x.w === 'come').pop().t || line.at + 9.9;
  const T = M.total, A = 'athena-as-mentes', Tm = 'telemachus';
  const house = [-14, 55, -100];   /* the hall's door: where a guest is taken */
  const intents = [], holds = [], stimuli = [];
  const I = o => (intents.push(o), o.id);
  /* ── Athena: she arrives, plants the spear, and waits to be seen ── */
  I({ id: 'iA1', actor: A, kind: 'ARRIVE', t0: 0.25, t1: 2.9, label: 'comes up to the threshold and plants the spear', params: { from: [0, 44], dur: 1.9 }, because: [{ id: 'sA0' }] });
  holds.push({ id: 'hA1', actor: A, t0: 2.9, t1: K4.win[0] - 0.1, reason: 'unattended at the gate: the house does not see her', params: { look: [[house, 2.6], ['the-suitors-3', 1.8], [Tm, 2.2], ['the-suitors-4', 1.6]], grip: 'R', offset: 0.4 }, because: [{ id: 'iA1' }] });
  I({ id: 'iA2', actor: A, kind: 'KNOCK', t0: 15.0, t1: 15.8, label: 'the spear\'s butt on the threshold stone', params: { side: 'R' }, because: [{ id: 'hA1' }] });
  stimuli.push({ id: 'sA0', t0: 0.2, t1: 0.3, kind: 'SCENE', label: 'a stranger at the outer gate (Athena as Mentes)' });
  /* ── the suitors: the game and the wine, never the gate ── */
  const game = { 'the-suitors-2': [12.4, 17.3, 25.2], 'the-suitors-3': [14.2, 22.8, 28.6], 'the-suitors-4': [13.1, 20.4, 27.0] };
  for (const [id, th] of Object.entries(game)) I({ id: 'iG' + id.slice(-1), actor: id, kind: 'GAMBLE', t0: th[0] - 0.6, t1: th[th.length - 1] + 1.5, label: 'the dice', params: { throws: th }, because: [{ id: 'sS0' }] });
  stimuli.push({ id: 'sS0', t0: 11.7, t1: 11.8, kind: 'SCENE', label: 'the suitors at their game (the feast in the court)' });
  I({ id: 'iD1', actor: 'the-suitors-1', kind: 'DRINK', t0: 13.4, t1: 27.5, label: 'drains his cup', params: { at: [13.4, 20.6, 27.0] }, because: [{ id: 'sS0' }] });
  /* the table answers each throw: laughter from the others at that table (a reaction to the dice, with the compiler's latency) */
  const tables = { 'the-suitors-2': ['the-suitors-1', 'the-suitors-3'], 'the-suitors-3': ['the-suitors-2'], 'the-suitors-4': ['the-suitors-5'] };
  for (const [id, th] of Object.entries(game)) th.forEach((t, k) => { for (const o of tables[id]) if ((k + o.length) % 2 === 0 || id === 'the-suitors-4') I({ id: 'iL' + id.slice(-1) + o.slice(-1) + k, actor: o, kind: 'REACT', t0: t + 0.1, t1: t + 2.0, label: 'laughs at the throw', params: { how: 'laugh', lookAt: id, to: 'dice' }, because: [{ id: 'dice:' + id + ':' + k }] }); });
  for (const id of ['the-suitors-1', 'the-suitors-2', 'the-suitors-3', 'the-suitors-4', 'the-suitors-5'])
    holds.push({ id: 'hS' + id.slice(-1), actor: id, t0: 11.8, t1: T, reason: 'absorbed in the game: they never look toward the gate', params: { look: [[tables[id] ? tables[id][0] : 'the-suitors-2', 2.4], [id === 'the-suitors-5' ? 'the-suitors-4' : 'the-suitors-3', 2.0]], weight: true, offset: 0.3 + 0.4 * (+id.slice(-1)) }, because: [{ id: 'sS0' }] });
  /* one of them sees Telemachus rise (not the stranger), and turns back to the game */
  I({ id: 'iS3', actor: 'the-suitors-3', kind: 'REACT', t0: K3.win[0] + 0.3, t1: K3.win[0] + 2.2, label: 'glances at the rising prince, back to the dice', params: { how: 'turn', lookAt: Tm }, because: [{ id: 'iT6' }] });
  /* ── the servants: the wine for whoever raises a cup ── */
  I({ id: 'iP1', actor: 'palace-servants-5', kind: 'POUR', t0: 14.6, t1: 16.8, label: 'wine for the suitor who drained his cup', params: { at: [14.6, 21.8], cupOf: 'the-suitors-1' }, because: [{ id: 'iD1' }] });
  I({ id: 'iP2', actor: 'palace-servants-3', kind: 'POUR', t0: 18.2, t1: 20.4, label: 'wine at the left table', params: { at: [18.2, 26.1], cupOf: 'the-suitors-4' }, because: [{ id: 'iG4' }] });
  for (const id of ['palace-servants-1', 'palace-servants-2', 'palace-servants-4']) holds.push({ id: 'hV' + id.slice(-1), actor: id, t0: 1.0, t1: T, reason: 'waits with the jar for a raised cup', params: { look: [['the-suitors-4', 2.8], ['the-suitors-2', 2.2]], weight: true, offset: +id.slice(-1) * 0.7 }, because: [{ id: 'sS0' }] });
  for (const id of ['palace-servants-3', 'palace-servants-5']) holds.push({ id: 'hV' + id.slice(-1), actor: id, t0: 1.0, t1: T, reason: 'serves the tables', params: { look: [['the-suitors-4', 2.6], ['the-suitors-1', 2.4]], weight: true, offset: +id.slice(-1) * 0.5 }, because: [{ id: 'sS0' }] });
  /* ── Telemachus: grief, the knock, the stranger seen, the shame, the cup set down, the rise, the crossing, the pause, the approach ── */
  holds.push({ id: 'hT1', actor: Tm, t0: 0.4, t1: 15.4, reason: 'grieving at his father\'s table, the suitors\' noise around him', params: { look: [['the-suitors-3', 2.6], [[41, 0, 10], 3.4], ['the-suitors-2', 2.0]], weight: false, offset: 0.8 }, because: [{ id: 'sS0' }] });
  I({ id: 'iT1', actor: Tm, kind: 'REACT', t0: 12.5, t1: 14.0, label: 'winces at the dice', params: { how: 'nod', lookAt: 'the-suitors-2' }, because: [{ id: 'dice:the-suitors-2:0' }] });
  I({ id: 'iT2', actor: Tm, kind: 'NOTICE', t0: 15.35 + 0.3, t1: 17.6, target: A, label: 'the stranger at the gate, unattended', params: { gazeHold: 1.1 }, because: [{ id: 'sKnock' }] });
  I({ id: 'iT3', actor: Tm, kind: 'SHAME', t0: 17.6, t1: 19.3, label: 'no one has gone to her: his house', params: { lookAt: 'the-suitors-2', hold: 0.8 }, because: [{ id: 'iT2' }] });
  I({ id: 'iT4', actor: Tm, kind: 'DECIDE', t0: 19.0, t1: 19.6, label: 'he will go himself', because: [{ id: 'iT3' }] });
  I({ id: 'iT5', actor: Tm, kind: 'SET_DOWN', t0: 19.05, t1: 20.2, label: 'sets down the cup', params: { side: 'R', what: 'his cup (telemachus:R)' }, because: [{ id: 'iT4' }] });
  I({ id: 'iT6', actor: Tm, kind: 'RISE', t0: K3.win[0], t1: K3.win[0] + 0.9, label: 'rises', because: [{ id: 'iT4' }] });
  I({ id: 'iT7', actor: Tm, kind: 'APPROACH', t0: K3.win[0], t1: K3.win[1], key: 'K3', target: A, label: 'crosses the hall to her', because: [{ id: 'iT4' }] });
  holds.push({ id: 'hT2', actor: Tm, t0: K3.win[1] + 0.2, t1: K4.win[0] - 0.05, reason: 'ashamed, halfway: between the suitors and the guest', params: { look: [[A, 2.4], ['the-suitors-3', 1.3], [A, 2.8]], weight: true, offset: 0.3 }, because: [{ id: 'iT7' }] });
  I({ id: 'iT8', actor: Tm, kind: 'APPROACH', t0: K4.win[0], t1: K4.win[1], key: 'K4', target: A, label: 'goes to her', because: [{ id: 'hT2' }] });
  /* Athena sees him come */
  I({ id: 'iA3', actor: A, kind: 'ATTEND', t0: K3.win[0] + 0.35, t1: K4.win[0], target: Tm, label: 'sees him rise and come', params: { track: true }, because: [{ id: 'iT6' }] });
  I({ id: 'iA4', actor: A, kind: 'APPROACH', t0: K4.win[0], t1: K4.win[1], key: 'K4', target: Tm, label: 'meets him at the gate', because: [{ id: 'iT8' }] });
  /* ── the welcome, the handoff, the lead ── */
  I({ id: 'iT9', actor: Tm, kind: 'WELCOME', t0: line.at - 0.4, t1: line.at + line.dur, target: A, utterance: line.gi, label: 'welcome, stranger', params: { spear: 'spear' }, because: [{ id: 'v' + line.gi }, { id: 'iT8' }] });
  I({ id: 'iA5', actor: A, kind: 'LISTEN', t0: line.at, t1: come, target: Tm, label: 'hears him out', params: { nods: [V.stresses[0] && V.stresses[0].t, word('eat')].filter(Boolean) }, because: [{ id: 'v' + line.gi }] });
  const tg = spear + 0.35;
  I({ id: 'iT10', actor: Tm, kind: 'TAKE', t0: tg - 0.9, t1: tg + 1.4, target: A, label: 'takes her spear', params: { prop: 'spear', from: A + ':R', to: Tm + ':R', at: tg, reach: 0.55 }, because: [{ id: 'iT9' }, { id: 'v' + line.gi }] });
  I({ id: 'iA6', actor: A, kind: 'OFFER', t0: tg - 1.1, t1: tg + 1.1, target: Tm, label: 'gives him the spear', params: { with: 'iT10', at: tg, from: A + ':R' }, because: [{ id: 'v' + line.gi }] });
  const leadAt = come + 0.12;
  I({ id: 'iT11', actor: Tm, kind: 'LEAD', t0: leadAt, t1: Math.min(T, leadAt + 2.2), target: house, label: 'turns and leads her in', params: { path: [[-14, 176], [-12, 140]], speed: 1.15, freeArm: 'L', label: 'through the gate, the spear carried' }, because: [{ id: 'iT9' }, { id: 'iT10' }] });
  I({ id: 'iA7', actor: A, kind: 'FOLLOW', t0: leadAt + 0.5, t1: T, target: Tm, label: 'follows him in', params: { leader: 'iT11', path: [[2, 214], [-10, 180], [-12, 160]], speed: 1.2, freeArm: 'L', label: 'after him, across the threshold' }, because: [{ id: 'iT11' }] });
  return {
    type: 'dialogue', title: 'The Gate: the stranger at the threshold',
    actors: { [A]: { role: 'guest (the goddess, disguised)', body: 'minifig' }, [Tm]: { role: 'host (the prince)', body: 'minifig' }, ...Object.fromEntries(Object.keys(M.H).filter(i => /suitor/.test(i)).map(i => [i, { role: 'suitor', body: 'minifig', group: 'suitors' }])), ...Object.fromEntries(Object.keys(M.H).filter(i => /servant/.test(i)).map(i => [i, { role: 'servant', body: 'minifig', group: 'servants' }])) },
    objects: { spear: { kind: 'spear', material: 'wood', holder: A + ':R', affords: ['take spear', 'offer spear', 'threaten'] }, cup: { kind: 'cup', material: 'bronze', holder: Tm + ':R', affords: ['drink', 'set down'] }, gate: { kind: 'door', material: 'door', at: [-14, 60, 200], affords: ['enter', 'leave', 'lead in'] }, dice: { kind: 'dice', material: 'bone', at: [96, 30, -10], affords: ['gamble'] } },
    authored: { intents, holds, stimuli, goals: { [Tm]: 'honour the guest his house has ignored', [A]: 'be received, and so rouse him' }, dice: 'dice' },
    stimuliLater: [{ id: 'sKnock', from: 'iA2', dt: 0.35, kind: 'SOUND', label: 'the spear\'s butt knocks the threshold stone' }],
  };
};
