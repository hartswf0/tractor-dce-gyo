/* Laertes Is Restored (OD-B24-S05, Odyssey 24): the old Sicel woman bathes Laertes and anoints him and puts a good cloak on him;
   Athena comes and fills out his limbs, makes him taller and stronger, and his son marvels to see him like an immortal; Dolius and
   his sons come in from the fields, see Odysseus and stand amazed; Dolius goes to him with both arms out, takes his hand and kisses it
   on the wrist ("welcome home"); they sit down in order to eat, while Rumour goes through the town telling of the suitors' death.

   All four turns are the narrator's, so the bodies carry the scene. At the table Odysseus carves the meat (TOOL_WORK carve) and
   Telemachus mixes the wine (POUR); far off in the orchard Dolius and two of his sons dig (TOOL_WORK dig, each on his own period). The
   old man comes out of the house from his bath (ARRIVE), still bent (the blocking's stoop), and smooths the clean cloak on his chest
   (GESTURE). Athena's light falls on him (a SIGHT: the key's light); he lifts his face into it (ATTEND) and straightens (RETIME: his
   rise out of the stoop, the take's move to K2, held until the light), opening his hands to look at them (GESTURE open). Odysseus sees
   it (NOTICE: the double take), puts down the knife and goes to him (RETIME of his move to K2), marvelling (GESTURE open: "surely some
   god has made you taller"); Telemachus sees it from the table (NOTICE, a HOLD). The old woman's call (a SOUND) brings the labourers in
   (the take's walks to K3, their APPROACH); Dolius sees his master (NOTICE), comes with both arms out (the blocking) and takes the hand
   Odysseus holds out to him (GESTURE open; GRIP on the hand) and bows over it to kiss the wrist (REACT lean); the sons stand amazed (a
   HOLD each) and bow (REACT nod). All sit down to eat (the take's walks and sits to K4), each to the meat in his own time (EAT, DRINK;
   Telemachus serves first: POUR); as the narrator tells of the rumour in the town, Odysseus looks away down the road the kinsmen will
   come by (a HOLD with that reason). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), T = M.total, q = t => Math.round(t * 12) / 12;
  const L = 'laertes-restored', O = 'odysseus', Tm = 'telemachus', D = 'dolius', S1 = 'dolius-s-sons-1', S2 = 'dolius-s-sons-2';
  const clip = gi => M.clips.find(c => c.gi === gi), c1 = clip(1), c2 = clip(2), c3 = clip(3), c4 = clip(4);
  const V2 = X.voiceOf(c2), V3 = X.voiceOf(c3), V4 = X.voiceOf(c4), w = (V, x, d) => { const f = V.words.find(y => y.w === x); return f ? f.t : d; };
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const table = [-20, 40, -140], meat = [60, 40, -140], wine = [0, 40, -150], athena = [150, 200, -60], road = [-320, 60, -60];
  const trees = { [D]: [-190, 60, 100], [S1]: [-285, 60, 100], [S2]: [-250, 60, 100] };
  const tTaller = q(w(V2, 'taller', c2.at + 3.4)), tRecognize = q(w(V3, 'recognize', c3.at + 5.0)), tFeast = q(w(V3, 'feast', c3.at + 8.0)), tRumors = q(w(V4, 'rumors', c4.at + 4.2));
  /* the old man straightens when the light has come (his K2 move held for it); Odysseus goes to him when he has seen it */
  const tLight = q(c2.at + 0.2), lD = q(Math.max(0, tLight + 0.6 - K2.win[0])), lUp = q(K2.win[1] + lD), oD = q(Math.max(0, tTaller + 0.6 - K2.win[0])), oThere = q(K2.win[1] + oD);
  /* ── the meal prepared; the bath; the labourers in the field ── */
  stimuli.push({ id: 'sMeal', t0: 0.05, t1: 0.8, kind: 'SCENE', label: 'the dinner made ready at the table before the farmhouse', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sBath', t0: 0.05, t1: 0.8, kind: 'SCENE', label: 'the old Sicel woman has bathed him and anointed him with oil, and put a good cloak on him', actor: L, because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sFields', t0: 0.05, t1: 0.8, kind: 'SCENE', label: 'Dolius and his sons at work in the orchard', actor: D, because: [] });
  I({ id: 'oCarve', actor: O, kind: 'TOOL_WORK', t0: 0.3, t1: q(tTaller + 0.3), target: meat, label: 'carves the meat for the dinner', params: { how: 'carve', period: 0.9, on: meat }, because: [{ id: 'sMeal' }] });
  I({ id: 'tPour', actor: Tm, kind: 'POUR', t0: 0.6, t1: 6.5, target: wine, label: 'mixes the wine in the bowl', params: { at: [0.8, 3.6], cupOf: wine }, because: [{ id: 'sMeal' }] });
  I({ id: 'lOut', actor: L, kind: 'ARRIVE', t0: 0.4, t1: 2.8, label: 'out of the house from his bath', params: { from: [12, -48], dur: 2.4 }, because: [{ id: 'sBath' }] });
  I({ id: 'lCloak', actor: L, kind: 'GESTURE', t0: 3.0, t1: 4.6, label: 'smooths the clean cloak on his chest', params: { shape: 'chest', at: 3.4, side: 'R', amp: 0.7, hold: 0.6 }, because: [{ id: 'lOut' }] });
  holds.push({ id: 'hL0', actor: L, t0: 4.7, t1: q(tLight - 0.1), reason: 'an old man in a clean cloak, still bent with his years: he looks at the table, at his son', params: { look: [[O, 2.0], [table, 1.4], [O, 2.0]], weight: true }, because: [{ id: 'lCloak' }] });
  holds.push({ id: 'hTm0', actor: Tm, t0: 6.6, t1: q(tTaller - 0.1), reason: 'the wine mixed: he waits on his father and grandfather', params: { look: [[O, 2.2], [L, 2.0]], weight: true }, because: [{ id: 'tPour' }] });
  for (const [id, P, off] of [[D, 1.5, 0.3], [S1, 1.3, 0.8], [S2, 1.4, 0.5]]) I({ id: 'dig' + id.slice(-1), actor: id, kind: 'TOOL_WORK', t0: off, t1: q(K3.win[0] - 0.3), target: trees[id], label: 'digs in the orchard', params: { how: 'dig', period: P, on: trees[id] }, because: [{ id: 'sFields' }] });
  /* ── Athena ── */
  stimuli.push({ id: 'sLight', t0: tLight, t1: q(tLight + 1.0), kind: 'SIGHT', label: 'Athena stands by him: a light on him, his limbs filled out', actor: L, because: [{ id: 'v' + c2.gi, rel: 'realises' }] });
  I({ id: 'lUp', actor: L, kind: 'ATTEND', target: athena, t0: q(tLight + 0.2), t1: q(lUp + 0.3), label: 'his face lifted into the light', because: [{ id: 'sLight' }] });
  I({ id: 'lTall', actor: L, kind: 'RETIME', t0: q(K2.win[0] + lD), t1: lUp, label: 'straightens: taller and stronger than before', params: { key: 'K2', delay: lD }, because: [{ id: 'sLight' }] });
  I({ id: 'lHands', actor: L, kind: 'GESTURE', t0: q(lUp + 0.2), t1: q(lUp + 2.0), label: 'opens his hands and looks at them: the strength in them', params: { shape: 'open', at: q(lUp + 0.6), side: 'R', amp: 1.0, hold: 0.9 }, because: [{ id: 'lTall' }] });
  stimuli.push({ id: 'sTaller', t0: tTaller, t1: q(tTaller + 0.4), kind: 'SIGHT', label: 'the old man stands like an immortal', actor: L, because: [{ id: 'lTall' }] });
  I({ id: 'oSee', actor: O, kind: 'NOTICE', target: L, t0: q(tTaller + 0.35), t1: q(tTaller + 2.0), label: 'his father, taller, like a god', params: { gazeHold: 1.2 }, because: [{ id: 'sTaller' }] });
  I({ id: 'oTo', actor: O, kind: 'RETIME', t0: q(K2.win[0] + oD), t1: oThere, label: 'puts down the knife and goes to him', params: { key: 'K2', delay: oD }, because: [{ id: 'oSee' }] });
  I({ id: 'oMarvel', actor: O, kind: 'GESTURE', target: L, t0: q(oThere + 0.1), t1: q(oThere + 1.8), label: 'father, surely some god has made you taller and better to look on', params: { shape: 'open', at: q(oThere + 0.5), side: 'L', amp: 0.9, hold: 0.7 }, because: [{ id: 'oTo' }] });
  I({ id: 'tSee', actor: Tm, kind: 'NOTICE', target: L, t0: q(tTaller + 0.5), t1: q(tTaller + 2.2), label: 'his grandfather, changed', params: { gazeHold: 1.0 }, because: [{ id: 'sTaller' }] });
  holds.push({ id: 'hTm1', actor: Tm, t0: q(tTaller + 2.3), t1: q(K4.win[0] - 0.1), reason: 'he watches the three of them: grandfather, father, the old servant', params: { look: [[L, 2.4], [O, 2.0]], weight: true }, because: [{ id: 'tSee' }] });
  holds.push({ id: 'hL1', actor: L, t0: q(lUp + 2.1), t1: q(K3.win[1] + 0.2), reason: 'a king again on his own land: he lets his son look at him', params: { look: [[O, 3.0]], weight: true }, because: [{ id: 'lHands' }] });
  holds.push({ id: 'hO1', actor: O, t0: q(oThere + 1.9), t1: q(K3.win[0] + 0.6), reason: 'he cannot take his eyes from his father', params: { look: [[L, 3.0]], weight: true }, because: [{ id: 'oMarvel' }] });
  /* ── Dolius and his sons come in ── */
  stimuli.push({ id: 'sCall', t0: q(K3.win[0] - 0.8), t1: q(K3.win[0] - 0.3), kind: 'SOUND', label: 'the old woman calls them in from the fields to dinner', because: [{ id: 'v' + c3.gi, rel: 'realises' }] });
  for (const id of [D, S1, S2]) I({ id: 'in' + id.slice(-1), actor: id, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: O, label: id === D ? 'comes in from the fields, both arms out' : 'comes in behind his father', because: [{ id: 'sCall' }] });
  stimuli.push({ id: 'sMaster', t0: q(K3.win[0] + 0.4), t1: q(K3.win[0] + 0.8), kind: 'SIGHT', label: 'Odysseus at the table: the master home', actor: O, because: [{ id: 'sCall' }] });
  I({ id: 'oTurn', actor: O, kind: 'APPROACH', key: 'K3', t0: K3.win[0], t1: K3.win[1], target: D, label: 'turns to the old servant coming in', because: [{ id: 'sCall' }] });
  I({ id: 'dSee', actor: D, kind: 'NOTICE', target: O, t0: q(K3.win[0] + 0.5), t1: q(K3.win[0] + 2.0), label: 'he knows him: the master', params: { gazeHold: 1.0 }, because: [{ id: 'sMaster' }] });
  const tHand = q(Math.max(K3.win[1] + 0.2, tRecognize - 0.4));
  I({ id: 'oHand', actor: O, kind: 'GESTURE', target: D, t0: q(tHand - 0.6), t1: q(tHand + 2.4), label: 'old man, sit down to your dinner: his hand held out', params: { shape: 'open', at: q(tHand - 0.2), side: 'R', amp: 0.9, hold: 2.2 }, because: [{ id: 'dSee' }] });
  I({ id: 'dGrip', actor: D, kind: 'GRIP', target: O, t0: tHand, t1: q(tHand + 2.4), label: 'takes Odysseus\'s hand', params: { point: 'hand', side: 'R', targetSide: 'R', reach: 0.5 }, because: [{ id: 'oHand' }] });
  I({ id: 'dKiss', actor: D, kind: 'REACT', t0: q(tHand + 0.6), t1: q(tHand + 2.0), label: 'bows over it and kisses it on the wrist: welcome home', params: { how: 'lean', lookAt: O }, because: [{ id: 'dGrip' }] });
  holds.push({ id: 'hD1', actor: D, t0: q(tHand + 2.5), t1: q(K4.win[0] - 0.1), reason: 'welcome home, master: he will not let go of the sight of him', params: { look: [[O, 2.4], [L, 1.2], [O, 2.0]], weight: true }, because: [{ id: 'dKiss' }] });
  for (const [id, dt] of [[S1, 0.3], [S2, 0.55]]) {
    holds.push({ id: 'hS' + id.slice(-1), actor: id, t0: q(K3.win[1] + 0.1), t1: q(tHand + 2.4 + dt), reason: 'they stand amazed: the master they have never seen', params: { look: [[O, 2.5], [D, 1.0], [O, 2.0]], weight: true }, because: [{ id: 'in' + id.slice(-1) }] });
    I({ id: 'bow' + id.slice(-1), actor: id, kind: 'REACT', t0: q(tHand + 2.5 + dt), t1: q(tHand + 3.3 + dt), label: 'greets him: a bow of the head', params: { how: 'nod', lookAt: O }, because: [{ id: 'dKiss' }] }); }
  holds.push({ id: 'hO2', actor: O, t0: q(tHand + 2.5), t1: q(K4.win[0] - 0.1), reason: 'the old servant\'s welcome: he looks round at them all', params: { look: [[D, 1.6], [S1, 1.0], [L, 1.4]], weight: true }, because: [{ id: 'dKiss' }] });
  /* ── the feast ── */
  stimuli.push({ id: 'sSit', t0: q(K4.win[0] - 0.4), t1: q(K4.win[0]), kind: 'WORD', label: 'they sit in order on the benches and chairs', actor: O, because: [{ id: 'oHand' }, { id: 'v' + c4.gi, rel: 'realises' }] });
  for (const id of [L, O, D, S1, S2, Tm]) I({ id: 'sit' + id.slice(0, 3) + id.slice(-1), actor: id, kind: 'APPROACH', key: 'K4', t0: K4.win[0], t1: K4.win[1], target: table, label: 'to his place at the table', because: [{ id: 'sSit' }] });
  const e0 = q(K4.win[1] + 0.4);
  I({ id: 'tServe', actor: Tm, kind: 'POUR', t0: e0, t1: q(e0 + 2.0), target: L, label: 'pours for his grandfather first', params: { at: [e0], cupOf: L }, because: [{ id: 'sittels' }] });
  I({ id: 'lDrink', actor: L, kind: 'DRINK', t0: q(e0 + 2.1), t1: q(e0 + 4.0), label: 'drinks', params: { at: [q(e0 + 2.1)] }, because: [{ id: 'tServe' }] });
  for (const [id, a] of [[O, [e0 + 0.8, e0 + 4.6]], [D, [e0 + 0.3, e0 + 3.4]], [S1, [e0 + 1.1, e0 + 4.2]], [S2, [e0 + 0.6, e0 + 3.8]], [Tm, [e0 + 2.6]]])
    I({ id: 'eat' + id.slice(0, 3) + id.slice(-1), actor: id, kind: 'EAT', t0: q(a[0]), t1: q(a[a.length - 1] + 2.1), target: table, label: 'eats', params: { at: a.map(q) }, because: [{ id: 'sit' + id.slice(0, 3) + id.slice(-1) }] });
  stimuli.push({ id: 'sRumour', t0: tRumors, t1: q(tRumors + 0.6), kind: 'WORD', label: 'Rumour goes through the town: the suitors\' death; the kinsmen gather', because: [{ id: 'v' + c4.gi, rel: 'realises' }] });
  holds.push({ id: 'hO3', actor: O, t0: q(Math.max(e0 + 6.8, tRumors + 0.4)), t1: T, reason: 'the kinsmen will come: he looks down the road from the town', params: { look: [[road, 2.0], [L, 1.2]], weight: true }, because: [{ id: 'sRumour' }] });
  holds.push({ id: 'hL3', actor: L, t0: q(e0 + 4.1), t1: T, reason: 'at his own table again, his son beside him', params: { look: [[O, 2.4], [table, 1.0]], weight: true }, because: [{ id: 'lDrink' }] });
  for (const id of [D, S1, S2, Tm]) { const last = intents.find(x => x.id === 'eat' + id.slice(0, 3) + id.slice(-1));
    holds.push({ id: 'hE' + id.slice(0, 3) + id.slice(-1), actor: id, t0: q(last.t1 + 0.1), t1: T, reason: 'at the meal with the master home', params: { look: [[O, 2.0], [table, 1.4]], weight: true }, because: [{ id: last.id }] }); }
  return {
    type: 'revelation', title: 'Laertes Is Restored: the light, the welcome, the table',
    actors: { [L]: { role: 'the old king, restored', body: 'minifig', principal: true, affect: { weight: 1.1 } }, [O]: { role: 'his son, home', body: 'minifig', principal: true },
      [D]: { role: 'the old servant', body: 'minifig', principal: true }, [Tm]: { role: 'the grandson', body: 'minifig' }, [S1]: { role: 'a son of Dolius', body: 'minifig' }, [S2]: { role: 'a son of Dolius', body: 'minifig' } },
    objects: { table: { kind: 'table', material: 'wood', at: [-20, 40, -140], affords: ['eat'] }, light: { kind: 'light', material: 'light', at: athena, affords: ['restore'] } },
    authored: { intents, holds, stimuli, goals: { [L]: 'be a king again before his son', [O]: 'his household together', [D]: 'welcome the master home', [Tm]: 'serve his elders' },
      couplings: [{ from: D, to: O, via: 'flesh', t0: tHand, t1: q(tHand + 2.4) }],
      causal: { tau: 0.7, actions: {
        [L]: [{ a: 'stand bent', base: 1.0, f: { 'after:sLight': -2.4 } }, { a: 'stand tall', base: -2.0, f: { 'after:sLight': 3.4 } }, { a: 'eat at his table', base: -2.6, f: { 'after:sSit': 3.4 } }],
        [O]: [{ a: 'prepare the meal', base: 1.0, f: { 'after:sTaller': -2.0 } }, { a: 'marvel at his father', base: -1.8, f: { 'after:sTaller': 3.0, 'after:sMaster': -1.6 } }, { a: 'welcome Dolius', base: -2.4, f: { 'after:sMaster': 3.4, 'after:sSit': -2.0 } }, { a: 'watch the road', base: -3.0, f: { 'after:sRumour': 3.4 } }],
        [D]: [{ a: 'work the field', base: 1.2, f: { 'after:sCall': -2.6 } }, { a: 'greet the master', base: -2.2, f: { 'after:sMaster': 3.8, 'after:sSit': -2.0 } }, { a: 'eat', base: -2.6, f: { 'after:sSit': 3.4 } }],
      } },
      camera: { follow: true },
    },
  };
};
