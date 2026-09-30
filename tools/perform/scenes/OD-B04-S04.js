/* Inside the Horse (OD-B04-S04, Odyssey 4): Menelaus tells it at his table: Helen circling the wooden horse in the dark, calling each
   chief in his wife's voice; the men inside aching to answer; Odysseus holding them, and his hands over Anticlus's mouth until she is
   led away.

   A told scene staged as a memory. Outside: Helen goes round the horse (CIRCLE on the horse's middle, slowly, three times as the
   telling goes on), her hand on its flank (GESTURE reach) and her voice made into the wives' (each call a SOUND stimulus in the score,
   caused by her gesture). Inside (the take's keys from K3, the men crouched in the belly): each call lands on the men (the calls are
   the causes of their starts); they nearly answer (REACT lean, one opens his hands to call out); Odysseus signals them down (SIGNAL
   hush) and, when Anticlus alone would speak, clamps his hand over his mouth (HOLD_ON at the mouth) and holds him while he fights it
   (STRUGGLE) and until the voice has gone. Every man inside is crouched (POSTURE) and still for a reason (a HOLD: the horse must not
   speak). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K3 = K('K3'), T = M.total, q = t => Math.round(t * 12) / 12;
  const O = 'odysseus', He = 'helen-at-the-horse', men = Object.keys(M.H).filter(i => /warrior/.test(i) && M.keys.some(k => k.snap[i] && k.snap[i].vis !== false && k.id === 'K3')), An = men[0], horse = [-59, 60, 150];
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c4 = clip(4), c5 = clip(5), c6 = clip(6);
  const V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), V5 = X.voiceOf(c5), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tIn = K3.win[0], tNearly = q(w(V4, 'nearly', 30.4)), tRestrain = q(w(V5, 'restrained', 34.8)), tSilence = q(w(V5, 'silenced', 36.9)), tAway = q(c6.at + 3.0);
  const calls = [q(w(V3, 'imitated', 23.0)), q(w(V3, 'voices', 24.2)), q(w(V3, 'wives', 26.4))];
  /* ── outside: Helen at the horse ── */
  stimuli.push({ id: 'sNight', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'Troy at night: the wooden horse in the square, Helen come out to it', because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  I({ id: 'hCircle', actor: He, kind: 'CIRCLE', target: horse, t0: 0.8, t1: 27.8, label: 'round the horse in the dark, three times', params: { radius: 2.5, turn: Math.PI * 2 * 1.5, speed: 0.25 }, because: [{ id: 'sNight' }] });
  I({ id: 'hPat', actor: He, kind: 'GESTURE', target: horse, t0: q(w(V3, 'horse', 21.4) - 0.3), t1: q(w(V3, 'horse', 21.4) + 1.3), label: 'her hand along its flank', params: { shape: 'reach', at: w(V3, 'horse', 21.4), side: 'L', amp: 0.8, hold: 0.6 }, because: [{ id: 'hCircle' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  calls.forEach((t, k) => { I({ id: 'hCall' + k, actor: He, kind: 'GESTURE', target: horse, t0: q(t - 0.3), t1: q(t + 0.9), label: 'calls a chief by name in his wife\'s voice', params: { shape: 'plead', at: t, side: 'R', amp: 0.7, hold: 0.4 }, because: [{ id: k ? 'hCall' + (k - 1) : 'hPat' }] });
    stimuli.push({ id: 'sVoice' + k, t0: q(t + 0.05), t1: q(t + 1.0), kind: 'SOUND', label: ['Diomedes, Diomedes: your wife\'s voice', 'Menelaus: Helen\'s own voice as a wife\'s', 'Anticlus: his wife calling him'][k], actor: He, because: [{ id: 'hCall' + k }] }); });
  /* ── inside: the men ── */
  const all = [O, ...men];
  all.forEach((m, k) => I({ id: 'crouch' + k, actor: m, kind: 'POSTURE', t0: tIn, t1: T, label: 'crouched in the timber belly', params: { to: 'crouch', enter: 0.3, stay: true }, because: [{ id: 'sVoice2' }] }));
  men.forEach((m, k) => { I({ id: 'mStart' + k, actor: m, kind: 'REACT', t0: q(tNearly - 0.2 + 0.15 * k), t1: q(tNearly + 1.0 + 0.15 * k), label: 'his wife\'s voice: he nearly answers', params: { how: 'lean', lookAt: [horse[0], horse[1], horse[2] + 80] }, because: [{ id: 'sVoice' + Math.min(2, k) }, { id: 'v' + c4.gi, rel: 'realises' }] }); });
  I({ id: 'anCall', actor: An, kind: 'GESTURE', t0: q(tNearly + 0.9), t1: q(tSilence - 0.2), label: 'Anticlus alone would answer: the hands open, the mouth to call', params: { shape: 'open', at: q(tNearly + 1.3), side: 'R', amp: 1.0, hold: 1.8 }, because: [{ id: 'mStart0' }] });
  holds.push({ id: 'hO0', actor: O, t0: tIn + 0.4, t1: tRestrain - 0.4, reason: 'in command in the dark: he listens to the voice and watches his men', params: { look: [[men[1] || An, 1.2], [An, 1.4], [men[2] || An, 1.0]], still: true }, because: [{ id: 'crouch0' }] });
  I({ id: 'oHush', actor: O, kind: 'SIGNAL', t0: q(tRestrain - 0.3), t1: q(tRestrain + 1.2), label: 'holds them: down, not a sound', params: { how: 'hush', to: men, lookAt: men[1] || An, side: 'L' }, because: [{ id: 'mStart1' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  I({ id: 'oClamp', actor: O, kind: 'HOLD_ON', target: An, t0: tSilence - 0.1, t1: tAway, label: 'his hands over Anticlus\'s mouth', params: { side: 'R', at: 'mouth' }, because: [{ id: 'anCall' }] });
  I({ id: 'anFight', actor: An, kind: 'STRUGGLE', t0: q(tSilence + 0.3), t1: q(tSilence + 2.4), label: 'fights the hand to answer her', because: [{ id: 'oClamp' }] });
  holds.push({ id: 'hAn', actor: An, t0: q(tSilence + 2.5), t1: T, reason: 'held silent until the voice has gone', params: { look: [[O, 2.0], [horse, 1.0]], still: true }, because: [{ id: 'anFight' }] });
  men.slice(1).forEach((m, k) => holds.push({ id: 'hM' + k, actor: m, t0: q(tRestrain + 0.5 + 0.2 * k), t1: T, reason: 'down again at his signal, the voice still outside', params: { look: [[O, 1.6], [An, 1.4]], still: true }, because: [{ id: 'oHush' }] }));
  stimuli.push({ id: 'sGone', t0: tAway - 0.3, t1: tAway, kind: 'SOUND', label: 'the voice goes: Athena leads her away', because: [{ id: 'oClamp' }] });
  holds.push({ id: 'hO1', actor: O, t0: tAway + 0.1, t1: T, reason: 'the hand off his mouth: the horse kept its silence', params: { look: [[An, 1.6], [men[1] || An, 1.2]], still: false, weight: true }, because: [{ id: 'sGone' }] });
  return {
    type: 'revelation', title: 'Inside the Horse: the wives\' voices, the hand over the mouth',
    actors: { [O]: { role: 'in command inside the horse', body: 'minifig', principal: true, affect: { cunning: 0.8 } }, [He]: { role: 'Helen at the horse', body: 'minifig', principal: true }, ...Object.fromEntries(men.map((m, k) => [m, { role: k ? 'a Greek in the horse' : 'Anticlus', body: 'minifig', group: 'greeks', principal: !k }])) },
    objects: { horse: { kind: 'horse', material: 'wood', at: horse, affords: ['hide'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'keep the horse silent', [He]: 'draw an answer', [An]: 'answer his wife' },
      couplings: [{ from: O, to: An, via: 'flesh', t0: tSilence, t1: tAway }],
      causal: { tau: 0.7, actions: {
        [An]: [{ a: 'stay silent', base: 1.2, f: { 'after:sVoice2': -2.4, 'after:oClamp': 2.5 } }, { a: 'answer her', base: -2.5, f: { 'after:sVoice2': 3.4, 'after:oClamp': -2.0 } }, { a: 'fight the hand', base: -3.0, f: { 'after:oClamp': 2.6, 'after:sGone': -3 } }],
        [O]: [{ a: 'listen', base: 1.0, f: { 'after:mStart0': -1.5 } }, { a: 'signal them down', base: -2.0, f: { 'after:mStart0': 2.8, 'after:oHush': -3 } }, { a: 'silence Anticlus', base: -3.0, f: { 'after:anCall': 4.0, 'after:sGone': -4 } }],
        [He]: [{ a: 'circle the horse', base: 1.0, f: {} }, { a: 'call in a wife\'s voice', base: -1.5, f: { 'after:hPat': 2.2 } }],
        ...Object.fromEntries(men.slice(1).map(m => [m, [{ a: 'stay silent', base: 1.0, f: { 'after:sVoice0': -1.8, 'after:oHush': 2.2 } }, { a: 'answer', base: -2.4, f: { 'after:sVoice0': 2.6, 'after:oHush': -2.6 } }]])),
      } },
      camera: { follow: true },
    },
  };
};
