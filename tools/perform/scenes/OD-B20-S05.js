/* The Hall of Death (OD-B20-S05, Odyssey 20): Athena sets the suitors laughing past control, their wits turned; they laugh with jaws
   not their own, the meat they eat is dabbled with blood, their eyes fill with tears. Theoclymenus the seer sees it: a shroud of
   darkness over their heads, the walls and the beams running with blood, the porch and the court full of ghosts going down into the
   dark, the sun gone out of the sky. They laugh at him, and he walks out of the house. Telemachus watches his father across the
   feast, waiting for the sign.

   100% LEGO: the darkness and the red are light (the keys' look: the hall dimmed, a red key and four red point lights), the blood is
   trans red and dark red bricks (the meat's drops, the streaks down the walls, which creep down while he looks), the ghosts are
   shrouded figures in trans clear in the porch. No effects.

   The voice: Theoclymenus's speech is an added clip of his spoken line (the recording has him read the stage direction).

   The chain: the feast (SCENE) -> Athena's madness (a STIMULUS, unseen) -> the laughter (REACT laugh, again and again, each suitor on his
   own clock) and the blood dropping from the meat (FLY, drop by drop) -> the seer's sight (K2: the light goes; SIGHT) -> his looks round
   the walls, the porch, the men (HOLD) and his recoil (GESTURE) -> the vision told (DECLARE, K3) -> their mockery (REACT laugh) -> he
   goes out (K3a) -> the light back (K4) -> father and son look at one another (ATTEND, HOLD, a nod each). */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), W = id => K(id).win || [K(id).t, K(id).t + 0.6], T = M.total, q = t => Math.round(t * 12) / 12;
  const TH = 'theoclymenus', B = 'odysseus-as-beggar', TE = 'telemachus', S = ['suitors-1', 'suitors-2', 'suitors-3', 'suitors-4', 'suitors-5'];
  const clips = M.clips.filter(c => c.kind !== 'SCENE_HEADER' && c.kind !== 'SPEAKER_CUE');
  const c1 = clips[0], c3 = clips[1], cV = clips.find(c => c.speaker === TH && c.kind === 'DIALOGUE') || clips[2], c6 = clips[clips.length - 1];
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => { if (o.t1 > o.t0 + 0.2) holds.push(o); };
  const rng = X.rng('hall'), tK2 = q(K('K2').t), tK3 = q(K('K3').t), tK3a = q(K('K3a').t), tK4 = q(K('K4').t);
  const WALLS = [[-318, 80, -40], [282, 80, 100], [0, 80, 246], [-200, 80, 246]], PORCH = [10, 40, 240];
  stimuli.push({ id: 'sFeast', t0: 0.05, t1: 0.3, kind: 'SCENE', label: 'the suitors at their meat', because: [{ id: 'v' + c1.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sMad', t0: 0.3, t1: 0.6, kind: 'SCENE', label: 'Athena turns their wits: they laugh with jaws not their own', because: [{ id: 'sFeast' }] });
  /* ── the laughter: each suitor on his own clock, from the start, again over the seer, and at him ── */
  const laughs = (s, k, from, to, why) => { let t = from + 0.25 * k + 0.4 * rng(); let n = 0; while (t + 1.1 < to) { I({ id: `lf${k}_${n}`, actor: s, kind: 'REACT', t0: q(t), t1: q(t + 1.1), label: 'laughing past control', params: { how: 'laugh', lookAt: S[(k + 1 + n) % S.length], amp: 1.3 }, because: [{ id: why, latency: 0.2 }] }); t += 1.25 + 0.9 * rng(); n++; } return n; };
  S.forEach((s, k) => { const n = laughs(s, k, 0.5, tK2 + 6.0, 'sMad'); H({ id: 'hS0' + k, actor: s, t0: 0.3, t1: q(0.5 + 0.25 * k), reason: 'at the meat', params: { look: [[S[(k + 2) % 5], 1.0]], weight: true }, because: [{ id: 'sFeast' }] }); });
  /* the blood from the meat, drop by drop onto the tables */
  const DROPS = [[-214, 66], [-200, -66], [178, 66], [190, -66]];
  DROPS.forEach(([x, z], i) => I({ id: 'drop' + i, actor: S[i], kind: 'FLY', t0: q(2.2 + 1.9 * i), t1: q(2.9 + 1.9 * i), label: 'a drop of blood from the meat to the board', params: { prop: 'drop' + i, from: [x + 4, 62, z + 2], legs: [{ dt: 0.5, to: [x + 6, 56, z + 4] }], until: null }, because: [{ id: 'sMad' }] }));
  H({ id: 'hTE0', actor: TE, t0: 0.3, t1: q(tK2 + 0.3), reason: 'the prince at his father\'s seat: the suitors gone wild', params: { look: [[S[0], 1.6], [B, 1.4], [S[2], 1.2]], weight: true }, because: [{ id: 'sMad' }] });
  H({ id: 'hB0', actor: B, t0: 0.3, t1: q(tK2 + 0.4), reason: 'the beggar by the door watches them laugh', params: { look: [[S[2], 1.8], [TE, 1.2], [S[4], 1.4]], weight: true }, because: [{ id: 'sMad' }] });
  H({ id: 'hTH0', actor: TH, t0: 0.3, t1: q(tK2 - 0.6), reason: 'the seer, a guest at the feast, uneasy at the laughter', params: { look: [[S[4], 1.4], [S[0], 1.6], [S[3], 1.2]], weight: true }, because: [{ id: 'sMad' }] });
  /* ── the vision ── */
  I({ id: 'thRise', actor: TH, kind: 'APPROACH', key: 'K2', t0: W('K2')[0], t1: W('K2')[1], target: S[4], label: 'he stands up among them, seeing', because: [{ id: 'hTH0' }, { id: 'v' + c3.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sDark', t0: tK2, t1: q(tK2 + 0.5), kind: 'SIGHT', label: 'darkness over their heads, the walls red with blood, ghosts in the porch', actor: TH, because: [{ id: 'thRise' }] });
  STREAKS.forEach(([i, x, y, z]) => I({ id: 'run' + i, actor: TH, kind: 'FLY', t0: q(tK2 + 0.2), t1: q(tK3a), label: 'blood running down the wall', params: { prop: 'streak' + i, from: [x, y - 46, z], legs: [{ dt: tK3a - tK2 - 0.4, to: [x, y - 46 - 22, z] }], ride: 0.2, until: tK4 }, because: [{ id: 'sDark' }] }));
  H({ id: 'hTH1', actor: TH, t0: q(W('K2')[1] + 0.05), t1: q(tK3 - 0.3), reason: 'he sees: the walls, the porch full of ghosts, the men in their shrouds of dark', params: { look: [[WALLS[0], 1.4], [PORCH, 2.0], [S[0], 1.2], [WALLS[1], 1.4], [S[3], 1.2], [PORCH, 1.6]], weight: true }, because: [{ id: 'sDark' }] });
  I({ id: 'thRecoil', actor: TH, kind: 'GESTURE', target: PORCH, t0: q(tK2 + 3.6), t1: q(tK2 + 5.2), label: 'the ghosts in the porch', params: { shape: 'recoil', at: q(tK2 + 4.1), side: 'L', amp: 1.0, hold: 0.5 }, because: [{ id: 'sDark' }] });
  /* ── the speech ── */
  I({ id: 'thSay', actor: TH, kind: 'DECLARE', target: S[4], utterance: cV.gi, t0: q(cV.at - 0.2), t1: q(Math.min(cV.at + cV.dur, tK3a - 0.2)), label: 'your heads wrapped in darkness, the walls running with blood, the porch full of ghosts', params: { shapes: ['point', 'open', 'recoil', 'point'], side: 'R', maxBeats: 3, amp: 1.0 }, because: [{ id: 'sDark' }, { id: 'v' + cV.gi, rel: 'realises' }] });
  stimuli.push({ id: 'sLaugh', t0: q(tK3a - 2.4), t1: q(tK3a - 2.0), kind: 'WORD', label: '"Laugh": they laugh at the seer', actor: TH, because: [{ id: 'thSay' }] });
  S.forEach((s, k) => { laughs(s, k + 7, tK3 + 1.0 + 0.3 * k, tK3 + 8.0, 'thSay'); });
  S.forEach((s, k) => I({ id: 'mock' + k, actor: s, kind: 'REACT', t0: q(tK3a - 2.2 + 0.15 * k), t1: q(tK3a - 1.0 + 0.15 * k), label: 'they laugh at him: the stranger has lost his wits', params: { how: 'laugh', lookAt: TH, amp: 1.4 }, because: [{ id: 'sLaugh', latency: 0.2 + 0.15 * k }] }));
  S.forEach((s, k) => H({ id: 'hS1' + k, actor: s, t0: q(tK3 + 8.1 + 0.2 * k), t1: q(tK3a - 2.3 + 0.15 * k), reason: 'grinning at the mad guest', params: { look: [[TH, 2.0], [S[(k + 1) % 5], 0.8]], weight: true, offset: 0.3 * k }, because: [{ id: 'thSay' }] }));
  I({ id: 'thGo', actor: TH, kind: 'APPROACH', key: 'K3a', t0: W('K3a')[0], t1: W('K3a')[1], target: [0, 40, 320], label: 'out of the house while its door still opens', because: [{ id: 'sLaugh' }] });
  /* ── the light back: father and son ── */
  S.forEach((s, k) => H({ id: 'hS2' + k, actor: s, t0: q(tK3a - 0.95 + 0.15 * k), t1: T, reason: 'back to the meat and the wine, still laughing low', params: { look: [[S[(k + 2) % 5], 1.6], [TH, 0.8]], weight: true, offset: 0.4 * k }, because: [{ id: 'mock' + k }] }));
  H({ id: 'hTE1', actor: TE, t0: q(tK2 + 0.35), t1: q(tK4 + 0.3), reason: 'he hears the seer: he does not laugh', params: { look: [[TH, 3.0], [B, 1.0], [TH, 2.0]], weight: true }, because: [{ id: 'sDark' }] });
  H({ id: 'hB1', actor: B, t0: q(tK2 + 0.45), t1: q(tK4 + 0.4), reason: 'the beggar hears the seer say what he himself will do', params: { look: [[TH, 3.0], [TE, 1.2], [TH, 2.0]], weight: true, still: true }, because: [{ id: 'sDark' }] });
  I({ id: 'teLook', actor: TE, kind: 'ATTEND', target: B, t0: q(tK4 + 0.35), t1: q(tK4 + 3.2), label: 'across the feast to his father', params: { track: true }, because: [{ id: 'thGo' }, { id: 'v' + c6.gi, rel: 'realises' }] });
  I({ id: 'bLook', actor: B, kind: 'ATTEND', target: TE, t0: q(tK4 + 0.45), t1: q(tK4 + 3.4), label: 'the father back at his son', params: { track: true }, because: [{ id: 'teLook', latency: 0.1 }] });
  I({ id: 'bNod', actor: B, kind: 'REACT', t0: q(tK4 + 3.5), t1: q(tK4 + 4.4), label: 'not yet', params: { how: 'nod', lookAt: TE }, because: [{ id: 'bLook' }] });
  I({ id: 'teNod', actor: TE, kind: 'REACT', t0: q(tK4 + 4.6), t1: q(tK4 + 5.5), label: 'he waits for the sign', params: { how: 'nod', lookAt: B }, because: [{ id: 'bNod', latency: 1.1 }] });
  H({ id: 'hTE2', actor: TE, t0: q(tK4 + 5.55), t1: T, reason: 'waiting for the moment', params: { look: [[B, 3.0], [S[0], 0.8]], weight: true, still: true }, because: [{ id: 'teNod' }] });
  H({ id: 'hB2', actor: B, t0: q(tK4 + 4.45), t1: T, reason: 'the doomed feast before him', params: { look: [[TE, 1.6], [S[2], 1.4], [S[0], 1.4]], weight: true }, because: [{ id: 'bNod' }] });
  return {
    type: 'revelation', title: 'The Hall of Death: the laughter not their own, the blood on the meat and the walls, the seer\'s vision, the doomed feast',
    actors: { [TH]: { role: 'Theoclymenus the seer', body: 'minifig', principal: true, affect: { fear: 0.6 } }, [TE]: { role: 'Telemachus', body: 'minifig', principal: true },
      [B]: { role: 'the beggar, the king', body: 'minifig', principal: true, affect: { cunning: 0.8 } },
      ...Object.fromEntries(S.map(s => [s, { role: 'a suitor', body: 'minifig', group: 'suitors' }])) },
    objects: { porch: { kind: 'door', material: 'door', at: PORCH, affords: ['exit'] } },
    authored: { intents, holds, stimuli, goals: { [TH]: 'tell them, and get out', [TE]: 'wait for his father\'s sign', [B]: 'wait' },
      causal: { tau: 0.7, actions: {
        [TH]: [{ a: 'sit at the feast', base: 1.0, f: { 'after:sDark': -3.0 } }, { a: 'tell what he sees', base: -1.5, f: { 'after:sDark': 3.5 } }, { a: 'leave', base: -3.0, f: { 'after:sLaugh': 5.0 } }],
        ...Object.fromEntries(S.map(s => [s, [{ a: 'eat', base: 0.5, f: { 'after:sMad': -2.0 } }, { a: 'laugh', base: -1.0, f: { 'after:sMad': 3.0 } }]])) } },
      camera: { follow: true },
    },
  };
};
const STREAKS = [[0, -318, 120, -150], [2, -318, 116, 90], [5, 282, 118, -30], [8, -200, 122, 246]];
