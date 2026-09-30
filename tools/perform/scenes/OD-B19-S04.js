/* The Scar (OD-B19-S04, Odyssey 19): the old nurse washes the beggar's feet, her hand finds the boar's scar, she knows him; the foot
   drops, the basin rings and spills; she turns to tell Penelope, and he takes her by the throat and makes her swear silence, while
   Penelope, her mind turned away by Athena, sees nothing.

   Penelope bids Eurycleia wash the stranger's feet (DECLARE, the line's stresses; the nurse LISTENs and weeps a little at "Odysseus").
   The beggar knows the danger at once (a WORD stimulus, "wash the feet": the scar) and cannot refuse without suspicion: he turns from
   the fire into the dark (the take's move at K2, owned here by his intent) and holds, watching the nurse and the queen. She fetches the
   basin and kneels to him (K2); she washes the leg (TEND: the hands busy at it, the head bent). Her hand finds the scar (a TOUCH
   stimulus): she goes still, the hands on it (a HOLD with its reason). The foot falls from her hands into the basin; it rings and tips,
   the water runs (a SOUND); both start; he looks at once to Penelope (did she see?); the nurse turns to the queen and reaches toward her
   to tell her. He takes her by the throat with his right hand (GRIP, held and solved every drawing), draws her to him and hushes her
   with the left (SIGNAL hush); she swears silence (the oath gesture). Penelope's held look is elsewhere the whole time (a HOLD with
   Athena as its reason), alive but turned away. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K4 = K('K4'), K5 = K('K5'), T = M.total, q = t => Math.round(t * 12) / 12;
  const Eu = 'eurycleia', O = 'odysseus-as-beggar', P = 'penelope', away = [180, 40, -120];
  const clip = gi => M.clips.find(c => c.gi === gi), c2 = clip(2), c3 = clip(3), c5 = clip(5), c6 = clip(6);
  const V2 = X.voiceOf(c2), V5 = X.voiceOf(c5), V6 = X.voiceOf(c6), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const tWash = q(w(V2, 'wash', 3.1)), tOdy = q(w(V2, 'odysseus', 11.3)), tScar = q(K4.win[0] - 0.1), tDrop = q(w(V5, 'drops', 27.5)), tSpill = q(w(V5, 'spilling', 30.1)), tReach = q(w(V5, 'reaches', 32.8));
  const tGrip = q(w(V6, 'grips', 36.9) - 0.2), tSwear = q(w(V6, 'swear', 42.8));
  /* ── the order ── */
  stimuli.push({ id: 'sHall', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'night in the hall by the fire: the queen, the beggar, the old nurse', because: [] });
  I({ id: 'pBid', actor: P, kind: 'DECLARE', target: Eu, utterance: c2.gi, t0: c2.at - 0.3, t1: c2.at + c2.dur, label: 'rise and wash the feet of your master\'s age-mate', params: { shapes: ['open', 'point', 'open', 'chest', 'open'], side: 'R', lookAt: O }, because: [{ id: 'v' + c2.gi, rel: 'realises' }, { id: 'sHall' }] });
  I({ id: 'euHears', actor: Eu, kind: 'LISTEN', target: P, t0: c2.at + 0.2, t1: c2.at + c2.dur, label: 'the queen\'s order, and her master\'s name', params: { nods: [q(tWash + 0.6), q(w(V2, 'sun', 17.0) + 0.2)] }, because: [{ id: 'pBid' }] });
  I({ id: 'euTear', actor: Eu, kind: 'WEEP', t0: tOdy + 0.2, t1: tOdy + 2.6, label: 'the old woman weeps at his name', params: { side: 'L', rate: 2.2 }, because: [{ id: 'v' + c2.gi + 'p1' }] });
  stimuli.push({ id: 'sWash', t0: tWash, t1: tWash + 0.3, kind: 'WORD', label: '"wash the feet": the scar on his leg', actor: P, because: [{ id: 'pBid' }] });
  I({ id: 'oKnows', actor: O, kind: 'REACT', t0: tWash + 0.35, t1: tWash + 1.4, label: 'the scar: she will know it', params: { how: 'turn', lookAt: Eu, latencyScale: 0.8 }, because: [{ id: 'sWash' }] });
  holds.push({ id: 'hO0', actor: O, t0: tWash + 1.5, t1: K2.win[0] - 0.1, reason: 'he cannot refuse without suspicion: he waits, watching the nurse and the queen', params: { look: [[Eu, 2.0], [P, 1.4], [Eu, 1.6]], weight: true }, because: [{ id: 'oKnows' }] });
  /* ── into the dark; the basin; the washing ── */
  I({ id: 'oDark', actor: O, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: Eu, label: 'turns from the fire into the dark', because: [{ id: 'hO0' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  I({ id: 'euBasin', actor: Eu, kind: 'APPROACH', key: 'K2', t0: K2.win[0], t1: K2.win[1], target: O, label: 'fetches the basin and kneels to him', because: [{ id: 'euHears' }] });
  I({ id: 'euWash', actor: Eu, kind: 'TEND', target: O, t0: K2.win[1] + 0.3, t1: tScar, label: 'washes the leg: warm water, the old hands', because: [{ id: 'euBasin' }] });
  holds.push({ id: 'hO1', actor: O, t0: K2.win[1] + 0.3, t1: tScar, reason: 'his face turned into the dark while she washes', params: { look: [[Eu, 1.8], [P, 1.2], [Eu, 1.5]], weight: false }, because: [{ id: 'oDark' }] });
  /* ── the scar ── */
  stimuli.push({ id: 'sScar', t0: tScar, t1: tScar + 0.3, kind: 'TOUCH', label: 'her hand on the scar the boar\'s tusk left on Parnassus', actor: Eu, because: [{ id: 'euWash' }] });
  holds.push({ id: 'hEu1', actor: Eu, t0: tScar + 0.2, t1: tDrop - 0.1, reason: 'she knows him under her fingers: joy and grief at once', params: { look: [[O, 3.0]], still: true }, because: [{ id: 'sScar' }] });
  holds.push({ id: 'hO2', actor: O, t0: K4.win[1] + 0.05, t1: tDrop - 0.1, reason: 'he feels her hands stop', params: { look: [[Eu, 2.4]], still: true }, because: [{ id: 'sScar' }] });
  I({ id: 'oFoot', actor: O, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: Eu, label: 'the foot falls from her hands into the basin', because: [{ id: 'sScar' }, { id: 'v' + c5.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sBasin', t0: tDrop + 0.1, t1: tSpill + 0.6, kind: 'SOUND', label: 'the basin rings, tips, the water runs across the floor', actor: O, because: [{ id: 'oFoot' }] });
  I({ id: 'euStart', actor: Eu, kind: 'REACT', t0: tDrop + 0.25, t1: tDrop + 1.3, label: 'the basin', params: { how: 'startle', lookAt: O }, because: [{ id: 'sBasin' }] });
  I({ id: 'oCheck', actor: O, kind: 'ATTEND', target: P, t0: tDrop + 0.35, t1: tSpill + 0.8, label: 'to the queen at once: did she see?', because: [{ id: 'sBasin' }] });
  /* ── she turns to tell Penelope; he stops her ── */
  I({ id: 'euTurn', actor: Eu, kind: 'ATTEND', target: P, t0: tSpill + 0.4, t1: tReach, label: 'to the queen, to tell her', because: [{ id: 'euStart' }] });
  I({ id: 'euReach', actor: Eu, kind: 'GESTURE', target: P, t0: tReach - 0.3, t1: tGrip - 0.1, label: 'reaches toward Penelope', params: { shape: 'reach', at: tReach, side: 'R', amp: 0.9, hold: 1.2 }, because: [{ id: 'euTurn' }] });
  I({ id: 'oGrip', actor: O, kind: 'GRIP', target: Eu, t0: tGrip, t1: T - 1.2, label: 'his right hand at her throat, gently but firmly', params: { point: 'neck', side: 'R', reach: 0.55, answer: 'none' }, because: [{ id: 'euReach' }, { id: 'v' + c6.gi, rel: 'realises' }] });
  I({ id: 'euDrawn', actor: Eu, kind: 'STEP', target: O, t0: tGrip + 0.15, t1: tGrip + 0.65, label: 'drawn in to him by the throat', params: { dist: 0.45, dur: 0.5 }, because: [{ id: 'oGrip' }] });
  I({ id: 'euFree', actor: Eu, kind: 'STEP', target: O, t0: T - 1.1, t1: T - 0.5, label: 'let go: back on her knees', params: { dist: -0.45, dur: 0.6 }, because: [{ id: 'euOath' }] });
  I({ id: 'oHush', actor: O, kind: 'SIGNAL', t0: q(w(V6, 'firmly', 40.2) - 0.4), t1: q(w(V6, 'firmly', 40.2) + 1.4), label: 'draws her close: not a word', params: { how: 'hush', to: [Eu], lookAt: Eu, side: 'L' }, because: [{ id: 'oGrip' }] });
  holds.push({ id: 'hEu2', actor: Eu, t0: tGrip + 0.3, t1: tSwear - 0.3, reason: 'held at the throat, looking into his face', params: { look: [[O, 3.0]], still: true }, because: [{ id: 'oGrip' }] });
  I({ id: 'euOath', actor: Eu, kind: 'GESTURE', target: O, t0: tSwear - 0.2, t1: q(tSwear + 1.6), label: 'swears silence', params: { shape: 'oath', at: tSwear + 0.2, side: 'L', amp: 0.8, hold: 0.8 }, because: [{ id: 'oHush' }] });
  holds.push({ id: 'hEnd', actor: O, t0: q(tSwear + 1.7), t1: T, reason: 'her oath given: he lets her go', params: { look: [[Eu, 1.6], [P, 1.0]], weight: true }, because: [{ id: 'euOath' }] });
  /* ── Penelope: turned away ── */
  holds.push({ id: 'hP0', actor: P, t0: c2.at + c2.dur + 0.1, t1: tScar - 0.1, reason: 'the queen watches the stranger she has had washed', params: { look: [[O, 2.4], [Eu, 1.4]], weight: true }, because: [{ id: 'pBid' }] });
  stimuli.push({ id: 'sAthena', t0: tScar + 0.05, t1: T, kind: 'SCENE', label: 'Athena turns the queen\'s mind away: she sees nothing of it', because: [{ id: 'sScar' }] });
  holds.push({ id: 'hP1', actor: P, t0: tScar + 0.1, t1: T, reason: 'her mind turned away by Athena: a held look elsewhere, not dead', params: { look: [[away, 5.0], [[away[0] + 60, away[1], away[2] + 40], 3.0]], weight: true }, because: [{ id: 'sAthena' }] });
  return {
    type: 'revelation', title: 'The Scar: the washing, the foot, the throat',
    actors: { [Eu]: { role: 'the old nurse', body: 'minifig', principal: true, affect: { weight: 0.6 } }, [O]: { role: 'the king as a beggar', body: 'minifig', principal: true, affect: { cunning: 0.8 } }, [P]: { role: 'the queen', body: 'minifig' } },
    objects: { basin: { kind: 'basin', material: 'bronze', at: [-19, 10, 135], affords: ['wash', 'tip'] }, fire: { kind: 'fire', material: 'fire', at: [0, 20, 40], affords: ['light'] } },
    authored: { intents, holds, stimuli, goals: { [O]: 'not be known yet', [Eu]: 'serve the stranger; then, the master', [P]: 'test the stranger' },
      couplings: [{ from: Eu, to: O, via: 'flesh', t0: K2.win[1] + 0.3, t1: tDrop }, { from: O, to: 'basin', via: 'bronze', t0: tDrop, t1: tSpill + 0.6 }, { from: O, to: Eu, via: 'flesh', t0: tGrip, t1: T - 1.2 }],
      causal: { tau: 0.7, actions: {
        [Eu]: [{ a: 'wash the stranger', base: 1.0, f: { 'after:sScar': -3.0 } }, { a: 'cry out his name', base: -2.8, f: { 'after:sScar': 3.2, 'after:oGrip': -4 } }, { a: 'tell the queen', base: -2.6, f: { 'after:sBasin': 3.0, 'after:oGrip': -4 } },
          { a: 'swear silence', base: -3.0, f: { 'after:oGrip': 2.4, 'after:oHush': 2.0 } }],
        [O]: [{ a: 'sit as a beggar', base: 1.0, f: { 'after:sWash': -0.8 } }, { a: 'turn into the dark', base: -2.0, f: { 'after:sWash': 2.4, 'intent:APPROACH': 1.0 } }, { a: 'watch the queen', base: -1.5, f: { 'after:sBasin': 2.6 } },
          { a: 'stop the nurse', base: -3.0, f: { 'after:euReach': 3.4, 'after:sScar': 0.8 } }],
        [P]: [{ a: 'watch the stranger', base: 1.0, f: { 'after:sAthena': -3.0 } }, { a: 'think of other things', base: -2.0, f: { 'after:sAthena': 4.0 } }],
      } },
      camera: { follow: true },
    },
  };
};
