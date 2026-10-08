/* Circe's House (OD-B10-S04, Odyssey 10): a transformation.

   K1: the scouts come to the house in the glade; Circe sings at her loom; the wolves and lions she has drugged come up to the men and
   fawn on them like dogs on a master home from a feast (the men start, then stand). K2: all go in but Eurylochus, who stays at the gate
   and watches. Circe seats them, pours, and when they have eaten and drunk strikes each with her wand. K3: the men are pigs in head and
   voice and bristles, their minds unchanged: each goes down on all fours, the pig's face on him for one drawing, then the pig (a part-
   swap sequence on twos: TRANSFORM on the man, CHANGE on the beast). K4: she drives them into the sties and throws them acorns. K5:
   Eurylochus runs back to the ship: "They are gone, Odysseus, all of them!"

   The causal spine: the song draws them (SOUND), the beasts' fawning is the first wrongness (a startle, then the calm the drug gives
   the beasts passes to the men), the drink is taken before the wand (the drug first, the stroke after: the wand's strike on a man who
   has drunk is the cause of his change), each change is a SWAP on the score with the man's identity kept, the pigs' grunts and the
   witness's flight answer it. The scene type is 'transformation' (tools/perform/homeostat.js: motion warm, causes hot, contrast high). */
'use strict';
const Ground = require('../ground.js');
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), T = M.total, q = t => Math.round(t * 12) / 12, sc = M.scale || 1;
  const K1 = K('K1'), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5');
  const sw = k => (k === K1 ? 0 : k.win ? q((k.win[0] + k.win[1]) / 2) : q(k.t)), s2 = sw(K2), s3 = sw(K3), s4 = sw(K4), s5 = sw(K5);
  const vis = (k, id) => !!(k && k.snap[id] && k.snap[id].vis), pos = (k, id) => k.snap[id].p;
  const C = 'circe', E = 'eurylochus', men = ['five-scouts-1', 'five-scouts-2', 'five-scouts-3', 'five-scouts-4', 'five-scouts-5'].filter(m => M.keys.some(k => vis(k, m)));
  const clip = gi => M.clips.find(c => c.gi === gi), cSong = clip(1), cFeast = clip(3), cPigs = clip(4), cPen = clip(5), cRep = clip(7);
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), S_ = o => (stimuli.push(o), o.id), cr = (id, o) => (intents.push({ actor: id, ...o }), o.id);
  const fl = (x, z) => Ground.at(M, x, z).y;

  /* ── the steps ── */
  S_({ id: 'sSong', t0: cSong ? cSong.at : 0.6, t1: cSong ? cSong.at + cSong.dur : 11, kind: 'SOUND', label: 'Circe singing at her loom: a voice through the doors', because: cSong ? [{ id: 'v' + cSong.gi, rel: 'realises' }] : [] });
  S_({ id: 'sBeasts', t0: 1.6, t1: 2.0, kind: 'SIGHT', label: 'wolves and lions come up to them, and do not attack', because: [{ id: 'sSong' }] });
  S_({ id: 'sEnter', t0: q(K2.win ? K2.win[0] : s2 - 1), t1: q(K2.win ? K2.win[0] : s2 - 1) + 0.4, kind: 'SCENE', label: 'all but Eurylochus go in at the shining doors', because: [{ id: 'sSong' }] });
  S_({ id: 'sFeast', t0: cFeast ? cFeast.at : 16.2, t1: cFeast ? cFeast.at + 0.4 : 16.6, kind: 'SCENE', label: 'seated: cheese, barley, honey, wine, and the drug in it', because: [{ id: 'sEnter' }] });
  const guests = men.filter(m => vis(K2, m)), tWand = q(Math.min(cFeast ? cFeast.at + cFeast.dur - 2.4 : 21, K3.t - 2.4 - 0.55 * Math.max(0, guests.length - 1))), sipped = [];   /* each struck before he goes down */
  S_({ id: 'sChange', t0: s3, t1: s3 + 0.4, kind: 'SCENE', label: 'pigs in head and voice and bristles; the minds as before', because: [{ id: 'iWand0' }] });
  S_({ id: 'sPen', t0: q(K4.win ? K4.win[0] : s4 - 2) - 0.2, t1: q(K4.win ? K4.win[0] : s4 - 2) + 0.2, kind: 'SCENE', label: 'into the sties; acorns and cornel fruit', because: [{ id: 'sChange' }] });
  if (cRep) S_({ id: 'sReport', t0: cRep.at, t1: cRep.at + cRep.dur, kind: 'VOICE', label: '"They are gone, Odysseus, all of them!"', because: [{ id: 'v' + cRep.gi, rel: 'realises' }] });

  /* ── Circe ── */
  I({ id: 'iWeave', actor: C, kind: 'WEAVE', t0: 0.6, t1: s2 - 0.6, label: 'at the great loom, the web fine and shining', params: { period: 1.8 }, because: [{ id: 'sSong' }] });
  if (cSong) I({ id: 'iSing', actor: C, kind: 'SING', t0: cSong.at, t1: Math.min(s2 - 0.3, cSong.at + cSong.dur), label: 'sings as she weaves', params: { clock: { period: 2.4, t0: cSong.at } }, because: [{ id: 'sSong' }] });
  I({ id: 'iWelcome', actor: C, kind: 'WELCOME', t0: q(K2.win ? K2.win[0] : s2 - 1) + 0.2, t1: s2 + 2.4, target: men[0], label: 'opens the doors and calls them in', params: {}, because: [{ id: 'sEnter' }] });
  I({ id: 'iPour', actor: C, kind: 'POUR', t0: q((cFeast ? cFeast.at : 16.2) + 0.4), t1: q((cFeast ? cFeast.at : 16.2) + 2.2), label: 'mixes the wine and the drug in it', params: { at: [q((cFeast ? cFeast.at : 16.2) + 1.0)] }, because: [{ id: 'sFeast' }] });
  const tFeast = q(cFeast ? cFeast.at : 16.2);
  I({ id: 'iServe', actor: C, kind: 'GESTURE', t0: q(s2 + 2.6), t1: tFeast, label: 'seats them: cheese, barley, honey on the table', params: { shape: 'offer', at: q(s2 + 2.9), side: 'L', hold: 1.2 }, because: [{ id: 'iWelcome' }] });
  holds.push({ id: 'hC2', actor: C, t0: q(s2 + 4.4), t1: tFeast + 0.3, reason: 'watches them eat: her smile, the drug waiting in the bowl', params: { look: [[guests[0], 1.6], [guests[1] || guests[0], 1.4], ['cup', 1.0]] }, because: [{ id: 'iServe' }] });
  guests.forEach((m, k) => holds.push({ id: 'hG' + k, actor: m, t0: q(s2 + 0.8 + 0.2 * k), t1: q(tFeast + 2.4 + 0.5 * k), reason: 'seated at her table, eating: the fear gone out of him', params: { look: [[C, 2.0], ['loom', 1.1]], offset: 0.4 * k }, because: [{ id: 'iWelcome' }] }));
  guests.forEach((m, k) => { const t = q((cFeast ? cFeast.at : 16.2) + 2.4 + 0.5 * k); I({ id: 'iDrink' + k, actor: m, kind: 'DRINK', t0: t, t1: t + 1.6, label: 'drinks', params: { at: [t + 0.3] }, because: [{ id: 'iPour' }] }); sipped.push([m, t + 0.8]); });
  guests.forEach((m, k) => { const t = q(tWand + 0.55 * k);
    I({ id: 'iWand' + k, actor: C, kind: 'SWING', t0: t, t1: t + 1.2, target: m, label: 'the wand on ' + m + ', who has drunk', params: { hit: true, side: 'R', impactId: 'cWand' + k, amp: 0.7 }, because: [{ id: 'iDrink' + k }] });
    I({ id: 'iStruck' + k, actor: m, kind: 'IMPACT', t0: t + 0.9, t1: t + 2.2, label: 'struck: the drug takes', params: { until: t + 2.2, label: 'the wand' }, because: [{ id: 'cWand' + k }] }); });
  const tDrive = q(K4.win ? K4.win[0] : s4 - 2);
  holds.push({ id: 'hC3', actor: C, t0: q(s3 + 0.4), t1: tDrive, reason: 'looks over the swine she has made', params: { look: [['pig1', 1.6], ['pig3', 1.4], ['pig2', 1.2]] }, because: [{ id: 'sChange' }] });
  men.filter(m => vis(K3, m)).forEach((m, k) => { I({ id: 'iAghast' + k, actor: m, kind: 'REACT', t0: q(s3 + 0.2 + 0.15 * k), t1: q(s3 + 1.6), label: 'the man beside him a pig', params: { how: 'recoil', lookAt: 'pig1' }, because: [{ id: 'sChange' }] });
    holds.push({ id: 'hA' + k, actor: m, t0: q(s3 + 1.7), t1: q(s4 - 1.4), reason: 'stares at the pigs that were his friends; the drug holds him where he stands', params: { look: [['pig1', 1.8], [C, 1.2], ['pig3', 1.5]], offset: 0.4 * k }, because: [{ id: 'iAghast' + k }] }); });
  I({ id: 'iDrive', actor: C, kind: 'HERD', t0: tDrive, t1: s4 + 3.2, label: 'drives them into the sties', params: {}, because: [{ id: 'sPen' }] });
  I({ id: 'iAcorns', actor: C, kind: 'THROW', t0: q(s4 + 3.4), t1: q(s4 + 4.6), target: [-128, 20, 122], label: 'throws them acorns', params: { side: 'R', releaseId: 'sAcorns' }, because: [{ id: 'iDrive' }] });

  /* ── the men: the approach, the beasts, the feast, the change ── */
  men.forEach((m, k) => { if (!vis(K1, m)) return;
    I({ id: 'iStart' + k, actor: m, kind: 'REACT', t0: q(1.8 + 0.18 * k), t1: q(3.2 + 0.18 * k), label: 'a wolf at his hand: he starts', params: { how: 'startle', lookAt: k % 2 ? 'lion1' : 'wolf1' }, because: [{ id: 'sBeasts' }] });
    holds.push({ id: 'hM' + k, actor: m, t0: q(3.4 + 0.2 * k), t1: s2 - 0.3, reason: 'the beasts fawn and the song goes on: afraid, and drawn in', params: { look: [[C, 2.6], [k % 2 ? 'lion1' : 'wolf1', 1.4]], offset: 0.3 * k }, because: [{ id: 'iStart' + k }] }); });
  /* the change: each man the take takes off at a key goes down on all fours over the four drawings before it; the nearest pig the take
     stages there is his (CHANGE: its face on him one drawing before the swap, then the pig) */
  const pigsK3 = { pig1: [-45, -5], pig2: [62, -30], pig3: [105, -40] }, taken = new Set(), creatures = {};
  const swapKey = m => [K3, K4, K5].find((k, j) => k && !vis(k, m) && vis([K2, K3, K4][j], m));
  men.forEach((m, k) => { const Ks = swapKey(m); if (!Ks) return; const prev = M.keys[M.keys.indexOf(Ks) - 1], p = pos(prev, m);
    const pig = Ks === K3 ? Object.entries(pigsK3).filter(([id]) => !taken.has(id)).sort((a, b) => Math.hypot(a[1][0] - p[0], a[1][1] - p[2]) - Math.hypot(b[1][0] - p[0], b[1][1] - p[2]))[0] : null;
    const struck = guests.indexOf(m);
    I({ id: 'iTr' + k, actor: m, kind: 'TRANSFORM', t0: q(Ks.t - 1.2), t1: q(Ks.t + 0.2), label: 'down on all fours: ' + (pig ? pig[0] : 'a pig'), params: { into: 'pig', animal: pig ? pig[0] : null }, because: [{ id: struck >= 0 ? 'iStruck' + struck : 'sChange' }] });
    if (pig) { taken.add(pig[0]); cr(pig[0], { id: 'cCh' + k, kind: 'CHANGE', t0: q(Ks.t - 2 / 12), t1: q(Ks.t), label: m + ' into ' + pig[0] + ': the face first, then the pig', params: { man: m, at: Ks.win ? q((Ks.win[0] + Ks.win[1]) / 2) : Ks.t }, because: [{ id: 'iTr' + k }] }); } });
  /* the pigs: from their change (or the key the take first stages them) to the end; they grunt at the ones still men, then are penned */
  const pigsK4 = { pig1: [-140, 92, -1.69], pig2: [-147, 122, -1.52], pig3: [-140, 152, -1.34] };
  for (const [id, [x, z]] of Object.entries(pigsK3)) { const y = fl(x, z); creatures[id] = { kind: 'pig', scale: 1.15 * sc, colour: 'pink', at: [x, y, z, id === 'pig1' ? 0.4 : id === 'pig2' ? -0.6 : -1.2], floor: y, present: [[s3, s5]], procs: [] };
    const [x4, z4, h4] = pigsK4[id]; cr(id, { id: 'pW' + id, kind: 'WALK', t0: tDrive + 0.4, t1: q(s4 + 2.6), label: 'driven into the sty', params: { path: [[tDrive + 0.4, x, z], [q(s4 + 2.6), x4, z4]], gait: 'trot' }, because: [{ id: 'iDrive' }] });
    cr(id, { id: 'pG' + id, kind: 'GRAZE', t0: q(s4 + 4.8), t1: T, label: 'at the acorns: a man\'s mind in it', because: [{ id: 'sAcorns' }] });
    cr(id, { id: 'pA' + id, kind: 'ATTEND', t0: q(s3 + 1.2), t1: q(s4 - 2), target: C, label: 'the head up to her: grunts, and weeps', because: [{ id: 'sChange' }] }); }
  /* the beasts at the door: they come to the men and fawn, then lie by the house */
  const beasts = { wolf1: ['wolf', 'black', [-60, 112, 0.25]], wolf2: ['wolf', 'grey', [40, 112, -0.25]], lion1: ['lion', 'gold', [-10, 112, 0.25]], lion2: ['lion', 'gold', [90, 112, -0.25]], wolf3: ['wolf', 'black', [140, 112, -0.25]] };
  Object.entries(beasts).forEach(([id, [kind, col, [x, z, h]]], j) => { const y = fl(x, z), m = men[j % men.length], tp = vis(K1, m) ? pos(K1, m) : [x, 0, z + 60];
    creatures[id] = { kind, scale: 1.05 * sc, colour: col, at: [x, y, z, h], floor: y, present: [[0, s2]].concat(id === 'wolf1' || id === 'lion1' ? [[s5, T + 1]] : []), procs: [] };
    const dd = Math.hypot(x - tp[0], z - tp[2]) || 1, kk = Math.min(1, 58 / dd), to = [tp[0] + (x - tp[0]) * kk, tp[2] + (z - tp[2]) * kk];   /* it lies down a body's length from him, not in him */
    cr(id, { id: 'bF' + j, kind: 'FAWN', t0: q(1.2 + 0.3 * j), t1: q(6.5 + 0.4 * j), target: m, label: 'comes to ' + m + ', head low, the tail going', params: { path: [[q(1.2 + 0.3 * j), x, z], [q(4.2 + 0.3 * j), to[0], to[1]]], gait: 'walk' }, because: [{ id: 'sSong' }] });
    cr(id, { id: 'bL' + j, kind: 'POSE', t0: q(7.2 + 0.4 * j), t1: s2, label: 'lies down by them: tame, drugged', params: { preset: kind === 'lion' ? 'lie' : 'sit', fade: 0.8 }, because: [{ id: 'bF' + j }] }); });
  /* Eurylochus: at the gate, watching; the flight; the report */
  holds.push({ id: 'hE', actor: E, t0: s2 + 0.4, t1: s4 + 3, reason: 'at the gate, suspecting a trick: he watches and does not go in', params: { look: [[C, 3], [[0, 30, 0], 1.6]], weight: true }, because: [{ id: 'sEnter' }] });
  I({ id: 'iFlee', actor: E, kind: 'FLEE', t0: q(s5 - 2.2), t1: q(s5), label: 'runs back to the ship', params: { from: C }, because: [{ id: 'sPen' }] });
  if (cRep) I({ id: 'iRep', actor: E, kind: 'DECLARE', t0: q(cRep.at) - 0.3, t1: q(cRep.at + cRep.dur), target: null, utterance: cRep.gi, label: 'the report, breathless, weeping', params: { shapes: ['plead', 'point', 'open', 'plead'] }, because: [{ id: 'v' + cRep.gi, rel: 'realises' }, { id: 'iFlee' }] });
  if (cRep) I({ id: 'iWeepE', actor: E, kind: 'WEEP', t0: q(cRep.at + cRep.dur * 0.55), t1: q(cRep.at + cRep.dur), label: 'the tears come with the words', params: { side: 'L' }, because: [{ id: 'sReport' }] });

  return {
    type: 'transformation', title: 'Circe\'s House',
    actors: { [C]: { role: 'the goddess who changes men', body: 'minifig', principal: true, affect: { heat: 1.1 } }, [E]: { role: 'the witness at the gate', body: 'minifig', principal: true }, ...Object.fromEntries(men.map(m => [m, { role: 'a scout, changed', body: 'minifig', group: 'crew' }])),
      ...Object.fromEntries(Object.keys(creatures).map(id => [id, { role: 'a ' + creatures[id].kind + ' (a rig)', body: 'prop' }])) },
    objects: { loom: { kind: 'loom', material: 'wood', at: [95, 30, -20], affords: ['weave'] }, cup: { kind: 'cup', material: 'bronze', holder: C + ':R', affords: ['pour', 'drink'] }, wand: { kind: 'wand', material: 'wood', holder: C + ':R', affords: ['strike'] },
      sty: { kind: 'pen', material: 'wood', at: [-140, 20, 122], affords: ['pen'] } },
    authored: { intents, holds, stimuli, creatures, goals: { [C]: 'keep them', [E]: 'see and live to tell it' },
      couplings: guests.map((m, k) => ({ from: C, to: m, via: 'weapon', t0: q(tWand + 0.55 * k) + 0.5, t1: s3 })),
      causal: { tau: 0.7, actions: {
        [C]: [{ a: 'sing and weave', base: 1.0, f: { 'after:sEnter': -2.5 } }, { a: 'welcome them', base: -1.5, f: { 'after:sEnter': 2.6, 'after:sFeast': -2 } }, { a: 'pour, give the drug', base: -2.5, f: { 'after:sFeast': 3.2, 'after:iWand0': -3 } },
          { a: 'strike with the wand', base: -3, f: { 'after:iDrink0': 3.4, 'after:sChange': -3 } }, { a: 'drive them to the sties', base: -3, f: { 'after:sPen': 4 } }],
        [E]: [{ a: 'go in', base: -0.5, f: { 'after:sEnter': -1.5 } }, { a: 'watch from the gate', base: 0.4, f: { 'after:sEnter': 1.5 } }, { a: 'run to the ship', base: -3, f: { 'after:sChange': 2.4, 'after:sPen': 1.5 } }, { a: 'tell it', base: -3, f: { 'after:sReport': 4 } }],
        ...Object.fromEntries(men.map(m => [m, [{ a: 'go in', base: -0.5, f: { 'after:sSong': 1.2, 'after:sEnter': 1 } }, { a: 'turn back', base: -1.2, f: { 'after:sBeasts': 0.8, 'after:sEnter': -2 } }, { a: 'eat and drink', base: -2.5, f: { 'after:sFeast': 3.2 } }, { a: 'grunt and weep', base: -3, f: { 'after:sChange': 4 } }]])) } } },
  };
};
