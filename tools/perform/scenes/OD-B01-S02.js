/* Athena's Two-Part Plan (OD-B01-S02, Odyssey 1): Athena sends Hermes to Ogygia with the gods' decree, takes Ithaca and the son for
   herself, then binds on her golden sandals, takes up her spear and drops from Olympus.

   Two errands assigned in speech, each toward an absent place (a vector): her line to Hermes carried on its stresses (DECLARE: the arm
   out toward the sea at "across the water to Ogygia", the open hand, the point, the fist at "goes home"); Hermes hears it (LISTEN, a
   nod at "decree") and lifts his wand at the end of it (GESTURE invoke: he will go). Her own errand (DECLARE: the hand at her breast at
   "I go to Ithaca myself", the point away toward Ithaca, the open hand for the son, the chop at "assembly"); Hermes watches her, then is
   gone (the take stages him out at K3). She goes to her throne (the take's move to K3, and its sit), bends to her feet and binds on the
   sandals (FASTEN, one foot then the other), closes her hand round the spear standing by the throne at "spear" (ARM: the hand to it, a
   PROP event), and at "drops" rises to go (RISE): the drop from Olympus is the take's cut to Ithaca. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), T = M.total, q = t => Math.round(t * 12) / 12;
  const A = 'athena', H = 'hermes', sea = [-330, 60, -240], ithaca = [-13, 60, 400], spear = [200, 30, -150];
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c5 = clip(5);
  const V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), V5 = X.voiceOf(c5), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tDecree = q(w(V2, 'decree', 13.3)), tHome = q(w(V2, 'home', 17.2)), tFastens = q(w(V5, 'fastens', 40.3)), tSpear = q(w(V5, 'spear', 45.0)), tDrops = q(w(V5, 'drops', 45.7));
  stimuli.push({ id: 'sOlympus', t0: 0.05, t1: 0.4, kind: 'SCENE', label: 'the golden way below the dais of Olympus: Zeus has granted it', because: [] });
  /* ── Hermes to Ogygia ── */
  I({ id: 'aSend', actor: A, kind: 'DECLARE', target: H, utterance: c2.gi, t0: c2.at - 0.2, t1: c2.at + c2.dur, label: 'send Hermes across the water to Ogygia with our fixed decree', params: { shapes: ['point', 'point', 'open', 'show', 'point', 'fist'], side: 'R' }, because: [{ id: 'v' + c2.gi, rel: 'realises' }, { id: 'sOlympus' }] });
  I({ id: 'aSea', actor: A, kind: 'ATTEND', target: sea, t0: q(w(V2, 'water', 5.6) - 0.3), t1: q(w(V2, 'ogygia', 7.0) + 1.0), label: 'her arm and eyes out to the sea', because: [{ id: 'aSend' }] });
  I({ id: 'hHear', actor: H, kind: 'LISTEN', target: A, t0: c2.at + 0.2, t1: q(tHome - 0.2), label: 'the messenger hears his errand', params: { nods: [q(tDecree + 0.3)] }, because: [{ id: 'aSend' }] });
  holds.push({ id: 'hH0', actor: H, t0: c2.at + 0.2, t1: q(tHome - 0.2), reason: 'the messenger waiting on his errand', params: { look: [[A, 2.6], [sea, 0.9]], weight: true }, because: [{ id: 'aSend' }] });
  I({ id: 'hWand', actor: H, kind: 'GESTURE', t0: q(tHome - 0.1), t1: q(tHome + 1.8), label: 'lifts his wand: he will go', params: { shape: 'invoke', at: q(tHome + 0.3), side: 'R', amp: 0.8, hold: 1.0 }, because: [{ id: 'hHear' }] });
  /* ── Ithaca for herself ── */
  I({ id: 'aTurn', actor: A, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: ithaca, label: 'turns from him to her own errand', because: [{ id: 'hWand' }] });
  I({ id: 'aSelf', actor: A, kind: 'DECLARE', target: H, utterance: c3.gi, t0: c3.at - 0.2, t1: c3.at + c3.dur, label: 'and I go to Ithaca myself, to put heart into his son', params: { shapes: ['chest', 'point', 'open', 'chop', 'point', 'open'], side: 'R', lookAt: ithaca }, because: [{ id: 'v' + c3.gi, rel: 'realises' }, { id: 'aTurn' }] });
  holds.push({ id: 'hH1', actor: H, t0: q(tHome + 1.9), t1: K3.win[0] - 0.1, reason: 'the decree in hand, he watches her set her own course', params: { look: [[A, 2.4], [ithaca, 0.8]], weight: true }, because: [{ id: 'hWand' }] });
  /* ── the sandals, the spear, the drop ── */
  I({ id: 'aThrone', actor: A, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: spear, label: 'to her throne', because: [{ id: 'aSelf' }] });
  I({ id: 'aFasten', actor: A, kind: 'FASTEN', t0: q(tFastens - 0.2), t1: q(tSpear - 1.4), label: 'binds on the golden sandals that carry her over land and sea', params: { strokes: 3 }, because: [{ id: 'aThrone' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  I({ id: 'aSpear', actor: A, kind: 'ARM', t0: q(tSpear - 1.2), t1: q(tSpear + 0.4), label: 'her hand closes round the bronze-shod spear', params: { side: 'R', at: spear }, because: [{ id: 'aFasten' }] });
  I({ id: 'aRise', actor: A, kind: 'RISE', t0: q(tDrops - 0.1), t1: q(tDrops + 1.2), label: 'up, and down from the peaks of Olympus', because: [{ id: 'aSpear' }] });
  holds.push({ id: 'hA9', actor: A, t0: q(tDrops + 1.3), t1: T, reason: 'the spear in her hand, Ithaca before her', params: { look: [[ithaca, 3.0]], weight: true, grip: 'R' }, because: [{ id: 'aRise' }] });
  return {
    type: 'dialogue', title: 'Athena\'s Two-Part Plan: Hermes to Ogygia, herself to Ithaca',
    actors: { [A]: { role: 'the grey-eyed goddess', body: 'minifig', principal: true, affect: { cunning: 0.7 } }, [H]: { role: 'the messenger', body: 'minifig', principal: true } },
    objects: { spear: { kind: 'spear', material: 'weapon', at: spear, affords: ['arm'] }, sandals: { kind: 'sandals', material: 'gold', at: [163, 10, -166], affords: ['bind'] } },
    authored: { intents, holds, stimuli, goals: { [A]: 'Odysseus home: Calypso ordered, the son roused', [H]: 'carry the decree' },
      couplings: [{ from: A, to: 'spear', via: 'weapon', t0: tSpear, t1: T }],
      causal: { tau: 0.7, actions: {
        [A]: [{ a: 'send Hermes', base: 1.0, f: { 'after:hWand': -3 } }, { a: 'take Ithaca herself', base: -2.0, f: { 'after:hWand': 3.0, 'after:aThrone': -3 } }, { a: 'arm and go', base: -2.8, f: { 'after:aSelf': 3.4 } }],
        [H]: [{ a: 'listen', base: 1.0, f: { 'after:hWand': -2 } }, { a: 'go at once', base: -2.0, f: { 'after:hHear': 2.4 } }],
      } },
      camera: { follow: true },
    },
  };
};
