/* The Horse Song (OD-B08-S05, Odyssey 8): in Alcinous's hall the blind bard Demodocus sings the wooden horse, the sack of Troy and
   Odysseus at the house of Deiphobus; the guest who asked for the song hears his own story, draws his purple cloak over his head and
   weeps; the king alone, sitting beside him, notices; he rises, stops the lyre and asks the stranger his name, his land and why he
   weeps at the fate of the Argives; the stranger uncovers his face and stands to answer.

   The song is a SING on its own clock (the sway from the hips, the arms opening on the long notes), Demodocus's head up and blind
   (his looks go to the hall, never to a face). Odysseus listens (a LISTEN, then a HOLD with its reason as the song comes to his own
   deeds), the hand to the breast for the cloak (GESTURE) and the WEEP (the head down, the hand to the face, the shoulders shaking),
   held through the song's end and the king's first words. Alcinous watches his guest, not the bard (a HOLD with that reason), sees
   the shaking (NOTICE, the double take, at the weeping's first burst), weighs it (a HOLD), rises from the throne (RISE, the take's
   walk to K4 his APPROACH), stops the lyre with the flat hand (SIGNAL hush to Demodocus on "stop") and asks (DECLARE on the line's
   stresses). Demodocus stills at the word (REACT, the lyre lowered by the take's K4 pose) and listens toward the voice. Odysseus
   lifts his head at "stranger, hide it no longer" (REACT turn), listens to the questions (LISTEN), and gathers himself to answer
   (DECIDE, RISE and the take's move to K5 as his APPROACH). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', D = 'demodocus', A = 'alcinous';
  const clip = gi => M.clips.find(c => c.gi === gi), c3 = clip(3), c4 = clip(4), c6 = clip(6), c7 = clip(7);
  const V3 = X.voiceOf(c3), V6 = X.voiceOf(c6), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const hall = [0, 70, 160], hearth = [0, 30, -60];   /* the hall's mouth and the hearth: where a blind man's face turns */
  const tDeiph = q(w(V3, 'deiphobus', c3.at + 7.6)), tCloak = q(Math.max(tDeiph - 0.4, K3.win[0] - 0.9)), tWeep = q(Math.max(K3.win[0], tCloak + 0.9));
  const tStop = q(w(V6, 'stop', c6.at + 0.35)), tStranger = q(w(V6, 'stranger', c6.at + 9.6)), tName = q(w(V6, 'name', c6.at + 13.5));
  const tUncover = q(tStranger + 0.3), tRise = q(K4.win[0] - 0.35);
  /* ── the song ── */
  stimuli.push({ id: 'sSong', t0: 0.05, t1: tStop, kind: 'SOUND', label: 'the lyre and the song: the horse, the sack of Troy, Odysseus at the house of Deiphobus', actor: D, because: [{ id: 'v' + c3.gi, rel: 'realises' }] });
  I({ id: 'dSing', actor: D, kind: 'SING', t0: 0.2, t1: tStop, label: 'sings the wooden horse, the lyre in his hands', params: { clock: { period: 2.6, t0: 0.2 } }, because: [{ id: 'sSong' }] });
  holds.push({ id: 'hD0', actor: D, t0: 0.3, t1: tStop, reason: 'blind: the song looks at no one, the face up to the hall', params: { look: [[hall, 3.2], [hearth, 2.2], [hall, 2.6]], weight: true }, because: [{ id: 'sSong' }] });
  /* ── the guest hears his own story ── */
  I({ id: 'oListen', actor: O, kind: 'LISTEN', target: D, t0: 0.3, t1: tDeiph - 0.2, label: 'listens to the song he asked for', params: { nods: [q(c3.at + 2.4)] }, because: [{ id: 'sSong' }] });
  stimuli.push({ id: 'sDeiph', t0: tDeiph, t1: tDeiph + 0.4, kind: 'WORD', label: '"the house of Deiphobus": the song comes to his own deeds', actor: D, because: [{ id: 'dSing' }] });
  I({ id: 'oCloak', actor: O, kind: 'GESTURE', t0: tCloak, t1: tCloak + 1.1, label: 'draws the great purple cloak up over his head', params: { shape: 'chest', at: tCloak + 0.4, side: 'L', amp: 1.0, hold: 1.4 }, because: [{ id: 'sDeiph' }] });
  I({ id: 'oWeep', actor: O, kind: 'WEEP', t0: tWeep, t1: tUncover, label: 'weeps under the cloak, as a woman weeps over her husband fallen before his city', params: { side: 'R', rate: 2.6, stay: true, pitch: -1.85, out: -0.3, head: 0.3, lean: 0.22 }, because: [{ id: 'oCloak' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sSob', t0: q(tWeep + 0.9), t1: q(tWeep + 1.4), kind: 'SOUND', label: 'a groan under the cloak: the shoulders shaking', actor: O, because: [{ id: 'oWeep' }] });
  /* ── the king beside him ── */
  holds.push({ id: 'hA0', actor: A, t0: 0.3, t1: q(tWeep + 1.0), reason: 'the host: his eyes on his guest more than on the bard', params: { look: [[O, 2.4], [D, 1.6], [O, 2.0]], weight: true }, because: [{ id: 'sSong' }] });
  I({ id: 'aNotice', actor: A, kind: 'NOTICE', target: O, t0: q(tWeep + 1.1), t1: q(tWeep + 3.0), label: 'he alone sees it: the guest is weeping', params: { gazeHold: 1.6 }, because: [{ id: 'sSob' }] });
  holds.push({ id: 'hA1', actor: A, t0: q(tWeep + 3.1), t1: tRise - 0.4, reason: 'a guest weeping at a song in his hall: let it go on, or stop it?', params: { look: [[O, 2.6], [D, 0.9], [O, 2.2]], weight: true }, because: [{ id: 'aNotice' }] });
  I({ id: 'aRise', actor: A, kind: 'RISE', t0: tRise, t1: tRise + 0.9, label: 'rises from the throne', because: [{ id: 'hA1' }] });
  I({ id: 'aGo', actor: A, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: O, label: 'comes down from the high seat toward the guest', because: [{ id: 'aRise' }] });
  I({ id: 'aHush', actor: A, kind: 'SIGNAL', t0: q(tStop - 0.15), t1: q(tStop + 1.4), label: 'the flat hand to the bard: stop the lyre', params: { how: 'hush', to: [D], lookAt: D, side: 'R' }, because: [{ id: 'aRise' }, { id: 'v' + c6.gi, rel: 'realises' }] });
  I({ id: 'aAsk', actor: A, kind: 'DECLARE', target: O, utterance: c6.gi, t0: q(tStop + 1.5), t1: c6.at + c6.dur, label: 'stranger, hide it no longer: your name, your land, why you weep for Troy', params: { shapes: ['open', 'open', 'point', 'open', 'chest', 'open', 'show', 'open'], side: 'R', maxBeats: 1, amp: 0.9 }, because: [{ id: 'aHush' }] });
  /* ── the lyre stopped ── */
  stimuli.push({ id: 'sStop', t0: tStop, t1: tStop + 0.3, kind: 'WORD', label: '"stop the lyre, Demodocus"', actor: A, because: [{ id: 'aHush' }] });
  I({ id: 'dStill', actor: D, kind: 'REACT', t0: q(tStop + 0.2), t1: q(tStop + 1.2), label: 'the song breaks off; the blind face turns to the king\'s voice', params: { how: 'turn', lookAt: A }, because: [{ id: 'sStop' }] });
  holds.push({ id: 'hD1', actor: D, t0: q(tStop + 1.3), t1: T, reason: 'the lyre stilled in his lap: he listens toward the voices he cannot see', params: { look: [[A, 3.0], [O, 2.0]], weight: true }, because: [{ id: 'dStill' }] });
  /* ── the stranger uncovers ── */
  stimuli.push({ id: 'sStranger', t0: tStranger, t1: tStranger + 0.3, kind: 'WORD', label: '"now, stranger, hide it no longer"', actor: A, because: [{ id: 'aAsk' }] });
  I({ id: 'oUncover', actor: O, kind: 'REACT', t0: tUncover, t1: q(tUncover + 1.0), label: 'the cloak down from his face: he looks up at the king', params: { how: 'turn', lookAt: A }, because: [{ id: 'sStranger' }] });
  I({ id: 'oHear', actor: O, kind: 'LISTEN', target: A, t0: q(tUncover + 1.1), t1: q(K5.win[0] - 0.7), label: 'hears the questions: his name, his land, his grief', params: { nods: [q(tName + 0.3)] }, because: [{ id: 'oUncover' }] });
  I({ id: 'oDecide', actor: O, kind: 'DECIDE', t0: q(K5.win[0] - 0.6), t1: K5.win[0], label: 'the name he has kept from them all: he resolves to tell it', because: [{ id: 'oHear' }, { id: 'v' + c7.gi, rel: 'realises' }] });
  I({ id: 'oRise', actor: O, kind: 'RISE', t0: K5.win[0], t1: K5.win[0] + 0.9, label: 'stands to answer his host', because: [{ id: 'oDecide' }] });
  I({ id: 'oStand', actor: O, kind: 'APPROACH', key: 'K5', t0: K5.win[0], t1: K5.win[1], target: A, label: 'faces the king', because: [{ id: 'oRise' }] });
  holds.push({ id: 'hO2', actor: O, t0: K5.win[1] + 0.1, t1: T, reason: '"I am Odysseus, son of Laertes": the tale about to begin', params: { look: [[A, 3.0]], weight: true }, because: [{ id: 'oStand' }] });
  holds.push({ id: 'hA2', actor: A, t0: c6.at + c6.dur, t1: T, reason: 'he has asked; he waits for the name', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'aAsk' }] });
  return {
    type: 'dialogue', title: 'The Horse Song: the bard, the cloak, the king\'s question',
    actors: { [O]: { role: 'the guest who weeps', body: 'minifig', principal: true, affect: { weight: 0.8, cunning: 0.4 } }, [A]: { role: 'the king, his host', body: 'minifig', principal: true }, [D]: { role: 'the blind bard', body: 'minifig' } },
    objects: { lyre: { kind: 'lyre', material: 'wood', holder: D + ':R', affords: ['play'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'hear the song; keep his name', [A]: 'a guest honoured, and known', [D]: 'sing what the Muse gives' },
      couplings: [],
      causal: { tau: 0.7, actions: {
        [O]: [{ a: 'listen', base: 1.0, f: { 'after:sDeiph': -1.6 } }, { a: 'hide his face and weep', base: -2.0, f: { 'after:sDeiph': 3.0, 'after:sStranger': -3.0 } }, { a: 'uncover and answer', base: -2.5, f: { 'after:sStranger': 3.6 } }],
        [A]: [{ a: 'enjoy the song', base: 1.0, f: { 'after:sSob': -1.4 } }, { a: 'watch the guest', base: -1.0, f: { 'after:sSob': 2.4 } }, { a: 'stop the lyre and ask', base: -2.6, f: { 'after:aNotice': 2.2, 'after:aRise': 2.0 } }],
        [D]: [{ a: 'sing', base: 1.2, f: { 'after:sStop': -3.5 } }, { a: 'listen', base: -1.5, f: { 'after:sStop': 3.4 } }],
      } },
      camera: { follow: true },
    },
  };
};
