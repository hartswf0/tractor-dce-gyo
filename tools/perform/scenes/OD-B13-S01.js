/* The Convoy (OD-B13-S01, Odyssey 13): the tale is done and the hall sits silent; Alcinous calls for more gifts and the feast, for the
   guest sails at sundown; at sunset Odysseus boards the Phaeacian ship and lies down on a bed in the stern; the ship runs through the
   night; the crew carry the sleeping man and his treasure ashore on Ithaca without waking him.

   The silence after the tale is a held stillness with reasons (the listeners spellbound, the teller spent). The king's command is
   carried on its stresses (DECLARE); two of the crew bring the chests (CARRY, together, the weight shared), the queen agrees (a nod).
   He boards (the take's move to K3) and lies down (POSTURE lie, held) and sleeps (a HOLD with its reason: a sleep like death, breath
   only), while the crew row (the first score's ROWING machinery, one clock, and its SEA with the ship's hull). On the shore (K5) the two bearers bring him and the treasure up the beach (CARRY: bent to
   the weight, stepping together) and set him down asleep; he does not wake (the HOLD goes on), and they go (a HOLD, then their look back
   to the ship). */
'use strict';
module.exports = function author(M, X) {
  const Nd = require('../../../odyssey/perform/needs.json').scenes['OD-B13-S01'], base = require('./_auto.js')(M, X, Nd), BA = base.authored;   /* the first score's sea and ship (machinery) are kept */
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', Al = 'alcinous', Ar = 'arete', c1_ = 'phaeacian-convoy-crew-1', c2_ = 'phaeacian-convoy-crew-2', c4_ = 'phaeacian-convoy-crew-4';
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c3 = clip(3), c4 = clip(4), c6 = clip(6);
  const V1 = X.voiceOf(c1), V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), V6 = X.voiceOf(c6), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tSilence = q(w(V1, 'silence', 5.4)), tChest = q(w(V3, 'chest', 11.2)), tLies = q(w(V4, 'lies', 31.3)), tCarry = q(w(V6, 'carries', 37.8));
  /* ── the silence after the tale ── */
  stimuli.push({ id: 'sTale', t0: 0.1, t1: tSilence, kind: 'SOUND', label: 'the tale ends', actor: O, because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  holds.push({ id: 'hO0', actor: O, t0: 0.3, t1: K2.win[0] - 0.1, reason: 'the tale told to its end: spent', params: { look: [[Al, 2.0], [Ar, 1.4]], weight: true }, because: [{ id: 'sTale' }] });
  [Al, Ar].forEach((a, k) => holds.push({ id: 'hSpell' + k, actor: a, t0: 0.3, t1: c3.at - 0.2 + k * 0.1, reason: 'spellbound in the shadowy hall: no one speaks', params: { look: [[O, 3.5]], still: true, offset: 0.4 * k }, because: [{ id: 'sTale' }] }));
  /* ── the gifts ── */
  I({ id: 'alGifts', actor: Al, kind: 'DECLARE', target: O, utterance: c3.gi, t0: c3.at - 0.2, t1: c3.at + c3.dur, label: 'one more chest, a tripod and a cauldron from every lord; our guest sails at sundown', params: { shapes: ['point', 'open', 'show', 'open', 'point', 'open'], side: 'R', lookAt: c2_ }, because: [{ id: 'v' + c3.gi, rel: 'realises' }, { id: 'hSpell0' }] });
  I({ id: 'arNod', actor: Ar, kind: 'LISTEN', target: Al, t0: c3.at + 0.3, t1: c3.at + c3.dur, label: 'agrees', params: { nods: [q(tChest + 0.4), q(w(V3, 'glad', 24.4) + 0.2)] }, because: [{ id: 'alGifts' }] });
  I({ id: 'oStand', actor: O, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: Al, label: 'rises to go', because: [{ id: 'hO0' }] });
  holds.push({ id: 'hO1', actor: O, t0: K2.win[1] + 0.2, t1: K3.win[0] - 0.1, reason: 'a guest honoured beyond anything: he waits for the sun to go down', params: { look: [[Al, 1.8], [[0, 60, -250], 1.4], [Ar, 1.0]], weight: true }, because: [{ id: 'alGifts' }] });
  [c2_, c4_].forEach((c, k) => I({ id: 'chest' + k, actor: c, kind: 'CARRY', t0: q(tChest + 0.3), t1: K3.win[0] - 0.3, label: 'the chest, heavy with bronze and gold', params: { with: [[c2_, c4_][1 - k]] }, because: [{ id: 'alGifts' }] }));
  /* ── the ship; the sleep ── */
  I({ id: 'oBoard', actor: O, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: [-28, 69, -260], label: 'aboard at sunset, to the stern', because: [{ id: 'hO1' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  I({ id: 'oLie', actor: O, kind: 'POSTURE', t0: q(tLies - 0.3), t1: T, label: 'lies down on the rugs and linen in the stern', params: { to: 'lie', enter: 1.2, stay: true }, because: [{ id: 'oBoard' }] });
  holds.push({ id: 'hSleep', actor: O, t0: q(tLies + 1.0), t1: T, reason: 'a sleep like death, sweet and unbroken: breath only', params: { look: [], still: true }, because: [{ id: 'oLie' }] });
  /* the rowing is the first score's ROWING machinery (one clock for the three oarsmen), kept */
  /* ── ashore ── */
  stimuli.push({ id: 'sIthaca', t0: K5.win[0] - 0.3, t1: K5.win[0], kind: 'SCENE', label: 'the harbour of Phorcys on Ithaca, at the morning star', because: [{ id: 'oLie' }] });
  [c1_, c2_].forEach((c, k) => { I({ id: 'bear' + k, actor: c, kind: 'CARRY', t0: K5.win[0], t1: K5.win[1] + 0.8, label: 'carries the sleeper up the beach, stepping with the other', params: { with: [[c1_, c2_][1 - k]] }, because: [{ id: 'sIthaca' }, { id: 'v' + c6.gi, rel: 'realises' }] });
    I({ id: 'setDown' + k, actor: c, kind: 'SET_DOWN', t0: K5.win[1] + 0.9, t1: K5.win[1] + 1.6, label: k ? 'the treasure under the olive, off the path' : 'sets him down on the sand, still asleep', params: { side: 'R', what: k ? 'treasure' : 'rug' }, because: [{ id: 'bear' + k }] });
    holds.push({ id: 'hGo' + k, actor: c, t0: K5.win[1] + 1.7, t1: T, reason: 'he has not woken: they go back to the ship', params: { look: [[O, 1.4], [[0, 60, -250], 2.0]], weight: true, offset: 0.4 * k }, because: [{ id: 'setDown' + k }] }); });
  return {
    type: 'dialogue', title: 'The Convoy: the silence, the gifts, the sleeper ashore',
    actors: { [O]: { role: 'the guest', body: 'minifig', principal: true }, [Al]: { role: 'the king', body: 'minifig', principal: true }, [Ar]: { role: 'the queen', body: 'minifig' }, [c1_]: { role: 'a Phaeacian oarsman', body: 'minifig', group: 'crew' }, [c2_]: { role: 'a Phaeacian oarsman', body: 'minifig', group: 'crew' }, [c4_]: { role: 'a Phaeacian', body: 'minifig', group: 'crew' } },
    objects: { chest: { kind: 'chest', material: 'wood', at: [-45, 20, -300], affords: ['carry'] }, ship: { kind: 'ship', material: 'wood', at: [-30, 60, -130], affords: ['board'] } },
    authored: { intents, holds, stimuli, machinery: BA.machinery, creatures: BA.creatures, goals: { [O]: 'go home', [Al]: 'send the guest home honoured', [c1_]: 'land him without waking him' },
      couplings: [{ from: c2_, to: c4_, via: 'wood', t0: tChest, t1: K3.win[0] }, { from: c1_, to: c2_, via: 'flesh', t0: K5.win[0], t1: K5.win[1] + 0.8 }],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'sit, spent', base: 1.0, f: { 'after:alGifts': -1.0 } }, { a: 'go aboard', base: -2.0, f: { 'after:alGifts': 2.4 } }, { a: 'sleep', base: -3.0, f: { 'after:oBoard': 4.0 } }],
        [Al]: [{ a: 'sit in silence', base: 1.0, f: { 'after:sTale': 0.6 } }, { a: 'call for gifts', base: -1.5, f: { 'after:sTale': 2.2, 'after:alGifts': -3 } }],
        [c1_]: [{ a: 'row', base: -0.5, f: { 'after:oLie': 2.0, 'after:sIthaca': -3 } }, { a: 'carry him ashore', base: -2.5, f: { 'after:sIthaca': 3.4 } }, { a: 'wake him', base: -4.0, f: {} }],
      } },
      camera: { follow: true },
    },
  };
};
