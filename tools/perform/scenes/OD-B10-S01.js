/* Aeolus (OD-B10-S01, Odyssey 10): the king of the winds gives Odysseus the oxhide bag with every rough wind sewn inside and sends him
   home on the West Wind; the crew open the bag in sight of Ithaca and the winds blow them back; Aeolus drives him out as a man the gods
   hate.

   Over the first score's sea and ship (tools/perform/scenes/_auto.js). A gift and its refusal, far apart across the water: Aeolus holds
   out the bag and names what is in it (DECLARE: the offer, the hand showing the bound winds, the point to the west at "West Wind");
   Odysseus on the deck receives it with both hands raised (GESTURE offer answered: the thanks) and nods at "home to Ithaca" (a WORD that
   lands). Between the two lines the voice cuts the nine days and the opened bag: the winds loosed (a SOUND) throw him back to the island,
   and he comes back a suppliant (GESTURE plead). Aeolus's refusal is carried on its stresses (DECLARE: the dismissal, "out", the point
   away, the fist at "hate you"); Odysseus takes each blow (REACT flinch at "cursed", SHAME after), and holds, beaten, at the end. */
'use strict';
module.exports = function author(M, X) {
  const N = require('../../../odyssey/perform/needs.json').scenes['OD-B10-S01'], base = require('./_auto.js')(M, X, N), A = base.authored;
  const T = M.total, q = t => Math.round(t * 12) / 12, Ae = 'aeolus', O = 'odysseus', west = [-400, 80, 200];
  const clip = gi => M.clips.find(c => c.gi === gi), c3 = clip(3), c6 = clip(6);
  const V3 = X.voiceOf(c3), V6 = X.voiceOf(c6), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = A.stimuli.filter(s => /^sC/.test(s.id)), I = o => (intents.push(o), o.id);   /* the chain's steps kept: the sea's changes are caused by them */
  const tBag = q(w(V3, 'bag', 1.6)), tHome = q(w(V3, 'home', 14.4)), tCursed = q(w(V6, 'cursed', 22.8)), tHate = q(w(V6, 'hate', 26.0));
  stimuli.push({ id: 'sIsle', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'the floating island of Aeolus, walled in bronze', because: [] });
  I({ id: 'aeGive', actor: Ae, kind: 'DECLARE', target: O, utterance: c3.gi, t0: c3.at - 0.2, t1: c3.at + c3.dur, label: 'take this bag of oxhide: every rough wind bound inside', params: { shapes: ['offer', 'show', 'describe', 'point', 'open'], side: 'R' }, because: [{ id: 'v' + c3.gi, rel: 'realises' }, { id: 'sIsle' }] });
  I({ id: 'oTake', actor: O, kind: 'GESTURE', target: Ae, t0: q(tBag + 0.2), t1: q(tBag + 2.2), label: 'both hands up for the gift', params: { shape: 'offer', at: q(tBag + 0.6), side: 'R', amp: 0.8, hold: 1.0 }, because: [{ id: 'aeGive' }] });
  I({ id: 'oListen', actor: O, kind: 'LISTEN', target: Ae, t0: q(tBag + 2.3), t1: q(tHome - 0.1), label: 'hears what is sewn in the bag', params: { nods: [q(w(V3, 'wire', 8.9) + 0.2)] }, because: [{ id: 'aeGive' }] });
  stimuli.push({ id: 'sHome', t0: tHome, t1: tHome + 0.3, kind: 'WORD', label: '"home to Ithaca"', actor: Ae, because: [{ id: 'aeGive' }] });
  I({ id: 'oThanks', actor: O, kind: 'REACT', t0: tHome + 0.2, t1: tHome + 1.3, label: 'home', params: { how: 'nod', lookAt: Ae }, because: [{ id: 'sHome' }] });
  stimuli.push({ id: 'sWinds', t0: q(c3.at + c3.dur + 0.1), t1: c6.at, kind: 'SOUND', label: 'the bag opened in sight of Ithaca: the winds loosed drive them back', because: [{ id: 'oThanks' }] });
  I({ id: 'oPlead', actor: O, kind: 'GESTURE', target: Ae, t0: q(c6.at - 0.6), t1: q(c6.at + 1.0), label: 'back as a suppliant: help us again', params: { shape: 'plead', at: q(c6.at - 0.2), side: 'R', amp: 0.9, hold: 0.6 }, because: [{ id: 'sWinds' }] });
  I({ id: 'aeOut', actor: Ae, kind: 'DECLARE', target: O, utterance: c6.gi, t0: c6.at - 0.2, t1: c6.at + c6.dur, label: 'out of my island, worst of living men: the gods hate you', params: { shapes: ['dismiss', 'point', 'chop', 'point', 'fist', 'dismiss'], side: 'R' }, because: [{ id: 'v' + c6.gi, rel: 'realises' }, { id: 'oPlead' }] });
  stimuli.push({ id: 'sCursed', t0: tCursed, t1: tCursed + 0.3, kind: 'WORD', label: '"you come back cursed"', actor: Ae, because: [{ id: 'aeOut' }] });
  I({ id: 'oBlow', actor: O, kind: 'REACT', t0: tCursed + 0.2, t1: tCursed + 1.3, label: 'cursed', params: { how: 'flinch', lookAt: Ae }, because: [{ id: 'sCursed' }] });
  I({ id: 'oShame', actor: O, kind: 'SHAME', t0: q(tHate + 0.2), t1: T, label: 'hated by heaven: the head goes down', params: { lookAt: Ae, hold: 3.0 }, because: [{ id: 'oBlow' }] });
  holds.push({ id: 'hAe', actor: Ae, t0: c3.at + c3.dur + 0.1, t1: c6.at - 0.3, reason: 'the king of the winds watches the ship go west', params: { look: [[O, 2.0], [west, 1.6]], weight: true }, because: [{ id: 'aeGive' }] });
  holds.push({ id: 'hO', actor: O, t0: tHome + 1.4, t1: c6.at - 0.7, reason: 'the bag stowed under the deck: nine days at the sheet, no sleep', params: { look: [[west, 2.4], [Ae, 1.0]], weight: true }, because: [{ id: 'oThanks' }] });
  A.intents = intents; A.holds = holds; A.stimuli = stimuli; A.goals = { [O]: 'go home', [Ae]: 'help the guest; then refuse the cursed' }; A.camera = { follow: true };
  return { ...base, type: 'dialogue', title: 'Aeolus: the bag of winds and the curse', authored: A };
};
