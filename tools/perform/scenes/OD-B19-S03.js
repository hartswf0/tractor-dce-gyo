/* The Stranger Describes Odysseus (OD-B19-S03, Odyssey 19): night in the megaron by the fire. The beggar on his stool tells Penelope
   a Cretan tale (Aethon, brother of Idomeneus, who once had Odysseus as his guest); she tests him: what did he wear? He counts it off,
   the purple cloak of double wool, the golden brooch with the hound holding the struggling fawn, the tunic like an onion's skin, the
   herald Eurybates. She knows the cloak and the brooch: she folded the one and pinned the other on him herself. She weeps, as the snow
   melts on the high mountains, while he pities her and keeps his eyes as hard as horn. Then she rises: he was pitied in this house,
   now he will be loved and honoured in it; and she swears it, if her husband comes.

   The chain: the tale (DECLARE, the voice's turn) -> her guarded listening (a HOLD with its reason: such tales have been told her
   before) -> the cloak and the brooch named (WORD stimuli on the voice's words) -> her NOTICE (the double take), the hand to the breast
   (GESTURE chest) -> the WEEP, caused by the brooch -> his hard eyes (a HOLD: he pities her and does not let it show), caused by her
   weeping -> her DECIDE (the tokens are true) -> RISE (the take's K4 is her APPROACH) -> her DECLARE (the guest honoured) -> his look
   up at her (REACT turn) -> her oath (DECLARE, the oath's raised hand) -> his LISTEN and the nod. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win, T = M.total, q = t => Math.round(t * 12) / 12;
  const B = 'odysseus-as-beggar', P = 'penelope';
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c2 = clip(2), c3 = clip(3), c5 = clip(5), c6 = clip(6);
  const V2 = X.voiceOf(c2), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const fire = [-79, 40, 186], BX0 = -32, BZ0 = 96;
  stimuli.push({ id: 'sNight', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'night, the fire low, the maids gone: the queen and the beggar alone across the hearth', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  /* ── the Cretan tale ── */
  I({ id: 'bTale', actor: B, kind: 'DECLARE', target: P, utterance: c1.gi, t0: q(c1.at - 0.2), t1: q(c1.at + c1.dur), label: 'Aethon of Crete, brother of Idomeneus: I had your husband as my guest', params: { shapes: ['chest', 'open', 'point', 'open'], side: 'R', maxBeats: 1, amp: 0.7 }, because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  H({ id: 'hP0', actor: P, t0: 0.3, t1: q(W('K2')[0] - 0.1), reason: 'a stranger who says he saw her husband: such tales have been told her before, for a cloak and a meal', params: { look: [[B, 2.6], [fire, 1.0], [B, 2.4]], weight: true }, because: [{ id: 'sNight' }] });
  I({ id: 'pNod', actor: P, kind: 'REACT', t0: q(W('K2')[0] - 1.0), t1: q(W('K2')[0] + 0.1), label: 'then tell me: what was he wearing?', params: { how: 'nod', lookAt: B }, because: [{ id: 'bTale', latency: 0.4 }] });
  /* ── the cloak, the brooch, the herald ── */
  I({ id: 'bLean', actor: B, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: P, label: 'leans in to count it off', because: [{ id: 'pNod', latency: 0.3 }] });
  I({ id: 'pSit', actor: P, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: B, label: 'straightens on her stool', because: [{ id: 'bLean', latency: 0.2 }] });
  const tCloak = q(Math.max(W('K2')[1] + 0.2, w(V2, 'cloak', c2.at + 2.4))), tBrooch = q(Math.max(tCloak + 1.2, w(V2, 'brooch', c2.at + 4.6))), tHerald = q(Math.max(tBrooch + 2.0, w(V2, 'herald', c2.at + 8.2)));
  I({ id: 'bDescribe', actor: B, kind: 'DECLARE', target: P, utterance: c2.gi, t0: q(c2.at - 0.2), t1: q(c2.at + c2.dur), label: 'the purple cloak, the golden brooch: the hound and the fawn; the tunic; the herald Eurybates', params: { shapes: ['describe', 'show', 'mime', 'describe'], side: 'R', maxBeats: 1, amp: 0.8 }, because: [{ id: 'v' + c2.gi, rel: 'realises' }, { id: 'pNod' }] });
  stimuli.push({ id: 'sCloak', t0: tCloak, t1: q(tCloak + 0.4), kind: 'WORD', label: '"a purple cloak of double wool"', actor: B, because: [{ id: 'bDescribe' }] });
  stimuli.push({ id: 'sBrooch', t0: tBrooch, t1: q(tBrooch + 0.4), kind: 'WORD', label: '"a golden brooch: a hound holding a dappled fawn"', actor: B, because: [{ id: 'bDescribe' }] });
  I({ id: 'pNotice', actor: P, kind: 'NOTICE', target: B, t0: q(tCloak + 0.3), t1: q(tCloak + 1.3), label: 'the cloak: she folded it herself', params: { gazeHold: 0.8 }, because: [{ id: 'sCloak', latency: 0.3 }] });
  I({ id: 'pChest', actor: P, kind: 'GESTURE', target: B, t0: q(tBrooch + 0.3), t1: q(tBrooch + 1.8), label: 'the hand to her breast: she pinned that brooch on him', params: { shape: 'chest', at: q(tBrooch + 0.7), side: 'R', amp: 1.0, hold: 1.0 }, because: [{ id: 'sBrooch', latency: 0.3 }] });
  H({ id: 'hP1', actor: P, t0: q(tCloak + 1.35), t1: q(tBrooch + 0.25), reason: 'every word true so far: she does not breathe', params: { look: [[B, 3.0]], weight: true }, because: [{ id: 'pNotice' }] });
  H({ id: 'hP2', actor: P, t0: q(tBrooch + 1.85), t1: q(W('K3')[0] - 0.1), reason: 'the herald too, round-shouldered, dark, curly-haired: it is all true', params: { look: [[B, 2.2], [fire, 0.8], [B, 2.0]], weight: true }, because: [{ id: 'pChest' }] });
  H({ id: 'hB0', actor: B, t0: q(c1.at), t1: q(c1.at + c1.dur), reason: 'the tale told steadily, his eyes on hers to see what it does', params: { look: [[P, 2.4], [fire, 0.7], [P, 2.4]], weight: true }, because: [{ id: 'bTale' }] });
  H({ id: 'hB0b', actor: B, t0: q(W('K2')[1] + 0.05), t1: q(c2.at + c2.dur), reason: 'counting it off as if he saw it before him: the cloak, the brooch, the man', params: { look: [[P, 2.0], [[BX0, 60, BZ0 - 60], 0.8], [P, 2.4]], weight: true }, because: [{ id: 'bDescribe' }] });
  H({ id: 'hP0b', actor: P, t0: q(W('K2')[1] + 0.05), t1: q(tCloak + 0.25), reason: 'she leans to hear what he will say he saw', params: { look: [[B, 3.0]], weight: true }, because: [{ id: 'pSit' }] });
  H({ id: 'hP2b', actor: P, t0: q(W('K4')[0] - 3.2), t1: q(W('K4')[0] - 0.85), reason: 'the tears run on: she looks up at him through them', params: { look: [[B, 1.6], [fire, 0.6], [B, 1.6]], weight: true }, because: [{ id: 'pWeep' }] });
  /* ── the weeping ── */
  const tWeep = q(W('K3')[0]);
  I({ id: 'pBow', actor: P, kind: 'APPROACH', key: 'K3', t0: W('K3')[0], t1: W('K3')[1], target: B, label: 'the head goes down, the hands to her face', because: [{ id: 'sBrooch', latency: 0.5 }] });
  I({ id: 'pWeep', actor: P, kind: 'WEEP', t0: tWeep, t1: q(W('K4')[0] - 0.9), label: 'she weeps, as the snow the west wind piles melts on the high mountains and the rivers run full', params: { side: 'R', rate: 2.4, stay: true, pitch: -1.9, out: -0.3, head: 0.35, lean: 0.2 }, because: [{ id: 'sBrooch' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sSob', t0: q(tWeep + 0.8), t1: q(tWeep + 1.3), kind: 'SOUND', label: 'her weeping', actor: P, because: [{ id: 'pWeep' }] });
  H({ id: 'hB1', actor: B, t0: q(c2.at + c2.dur + 0.1), t1: q(tWeep + 0.9), reason: 'he has said it all: he watches it reach her', params: { look: [[P, 3.0]], weight: true }, because: [{ id: 'bDescribe' }] });
  H({ id: 'hB2', actor: B, t0: q(tWeep + 1.0), t1: q(W('K4')[0] + 0.2), reason: 'he pities his wife weeping for him beside him, and keeps his eyes as hard as horn or iron, unmoving under the lids', params: { look: [[P, 4.0]], weight: true, still: true }, because: [{ id: 'sSob' }] });
  /* ── she rises: the guest honoured ── */
  I({ id: 'pDecide', actor: P, kind: 'DECIDE', t0: q(W('K4')[0] - 0.8), t1: q(W('K4')[0]), label: 'the tokens are true: the man before her has stood beside him', because: [{ id: 'pWeep' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  I({ id: 'pRise', actor: P, kind: 'APPROACH', key: 'K4', t0: W('K4')[0], t1: W('K4')[1], target: B, label: 'rises, a hand on the stool to steady herself', because: [{ id: 'pDecide' }] });
  I({ id: 'bUp', actor: B, kind: 'REACT', t0: q(W('K4')[0] + 0.3), t1: q(W('K4')[0] + 1.3), label: 'looks up at her as she stands', params: { how: 'turn', lookAt: P }, because: [{ id: 'pRise', latency: 0.3 }] });
  I({ id: 'pHonour', actor: P, kind: 'DECLARE', target: B, utterance: c5.gi, t0: q(Math.max(c5.at - 0.2, W('K4')[1] + 0.05)), t1: q(c5.at + c5.dur), label: 'pitied an hour ago; now loved and honoured: those were my gifts', params: { shapes: ['open', 'chest', 'open'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: 'pRise' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  I({ id: 'bHear', actor: B, kind: 'LISTEN', target: P, t0: q(W('K4')[0] + 1.4), t1: q(W('K5')[0] - 0.1), label: 'hears himself taken into his own house as a guest', params: { nods: [q(c5.at + c5.dur - 0.6)] }, because: [{ id: 'bUp' }] });
  /* ── her oath ── */
  I({ id: 'pOathUp', actor: P, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: B, label: 'the hand up for the oath', because: [{ id: 'pHonour' }, { id: 'v' + c6.gi, rel: 'realises' }] });
  I({ id: 'pOath', actor: P, kind: 'DECLARE', target: B, utterance: c6.gi, t0: q(Math.max(c6.at - 0.2, W('K5')[1] + 0.05)), t1: q(c6.at + c6.dur), label: 'if he crosses that threshold, no one alive will call you beggar again', params: { shapes: ['oath', 'point', 'open'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: 'pOathUp' }] });
  I({ id: 'bLook', actor: B, kind: 'APPROACH', key: 'K5', t0: W('K5')[0], t1: W('K5')[1], target: P, label: 'his eyes on her raised hand', because: [{ id: 'pOathUp', latency: 0.2 }] });
  I({ id: 'bHear2', actor: B, kind: 'LISTEN', target: P, t0: q(W('K5')[1] + 0.1), t1: T, label: 'the oath sworn to the man it is sworn about', params: { nods: [q(c6.at + c6.dur - 0.8)] }, because: [{ id: 'pOath' }] });
  H({ id: 'hP3', actor: P, t0: q(c6.at + c6.dur + 0.05), t1: T, reason: 'she has sworn: she waits for his answer', params: { look: [[B, 3.0]], weight: true }, because: [{ id: 'pOath' }] });
  return {
    type: 'dialogue', title: 'The Stranger Describes Odysseus: the cloak and the brooch, the queen weeps, the oath',
    actors: { [B]: { role: 'the beggar, her husband', body: 'minifig', principal: true, affect: { cunning: 0.7, weight: 0.6 } }, [P]: { role: 'the queen', body: 'minifig', principal: true, affect: { suspicion: 0.5, weight: 0.7 } },
      'eurybates-memory-variant': { role: 'the herald remembered (not on stage)', body: 'minifig' } },
    objects: { stool: { kind: 'stool', material: 'wood', at: [38, 0, 14], affords: ['sit', 'steady'] }, fire: { kind: 'fire', material: 'fire', at: fire, affords: ['warm'] } },
    authored: { intents, holds, stimuli, goals: { [B]: 'be believed, and not be known', [P]: 'test the stranger: has he seen my husband?' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [P]: [{ a: 'doubt him', base: 1.0, f: { 'after:sCloak': -1.0, 'after:sBrooch': -2.5 } }, { a: 'weep', base: -2.0, f: { 'after:sBrooch': 3.2, 'after:pDecide': -3.0 } }, { a: 'honour him', base: -2.5, f: { 'after:pDecide': 4.0 } }],
        [B]: [{ a: 'tell the tale', base: 1.0, f: { 'after:sBrooch': -1.5 } }, { a: 'keep his eyes hard', base: -1.0, f: { 'after:sSob': 3.0 } }, { a: 'tell her who he is', base: -3.0, f: { 'after:sSob': 0.8 } }, { a: 'accept', base: -2.0, f: { 'after:pDecide': 3.5 } }],
      } },
      camera: { follow: true },
    },
  };
};
