/* The Sirens (OD-B12-S03, Odyssey 12): machinery. The wind dies; the crew takes to the oars on one clock (a shared phase, each man a
   little early or late: coordinated labour, not a loop copied five times); Odysseus softens the wax and seals each man's ears; the men
   bind him to the mast (from then on his root is the mast's, whatever the layout does); they row past the flowered shore; the Sirens
   sing on a clock of their own and lean out to him; the song pulls him toward them against the rope, the ship's roll adds to it or
   takes it away, the rope takes what exceeds its slack; he struggles and signals with his head; Perimedes and Eurylochus (crew 1 and
   2) come and haul the rope in until the song fades, and the strain goes out of him.

   The coupling chain (tools/perform/machinery.js SIRENS_CHAIN): crew force -> oar -> water -> hull (a damped oscillator in pitch, roll,
   heave: the ship rig's channels, its riders carried) -> mast constraint -> rope tension -> Odysseus's torso strain; his head's target
   is the Sirens. */
'use strict';
module.exports = function author(M, X) {
  const K = id => M.keys.find(k => k.id === id), K2 = K('K2'), K3 = K('K3'), K4 = K('K4'), K5 = K('K5'), T = M.total;
  const O = 'odysseus', crew = [1, 2, 3, 4, 5].map(k => 'crew-at-the-oars-' + k), sirens = [1, 2, 3, 4, 5].map(k => 'the-sirens-' + k);
  const clip = gi => M.clips.find(c => c.gi === gi), promise = clip(4), struggle = clip(5), tighten = clip(6), bindC = clip(3), waxC = clip(2);
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id);
  const mastAt = K3.snap[O].p, mastT = K3.win[1] + 0.2;
  /* the stimuli: the wind dies, the song, the sight of him straining */
  stimuli.push({ id: 'sIsle', t0: 0.05, t1: 0.2, kind: 'SCENE', label: 'the ship under sail off the Sirens\' island; they are singing', because: [] });
  stimuli.push({ id: 'sCalm', t0: 3.2, t1: 3.5, kind: 'SCENE', label: 'the wind dies: the sail hangs', because: [{ id: 'v1', rel: 'realises' }] });
  stimuli.push({ id: 'sShore', t0: 21.0, t1: 21.3, kind: 'SIGHT', label: 'the flowered shore, the bones on it', because: [{ id: 'v3', rel: 'realises' }] });
  /* ── the rowing: one clock; each man joins when his hands are free ── */
  const busy = { 'crew-at-the-oars-1': [[0, 3.5], [K3.win[0] - 0.4, 23.5], [K5.win[0] - 0.4, T]], 'crew-at-the-oars-2': [[K3.win[0] - 0.4, 23.5], [K5.win[0] - 0.4, T]],
    'crew-at-the-oars-3': [[K2.win[0] - 0.4, 15.0]], 'crew-at-the-oars-4': [[10.6, 12.6]], 'crew-at-the-oars-5': [[0, T]] };
  const machinery = [{ kind: 'ROWING', id: 'clock:row', clock: { period: 2.6, t0: 3.5, t1: T - 0.5 }, offsets: { 'crew-at-the-oars-1': 0.0, 'crew-at-the-oars-2': 0.04, 'crew-at-the-oars-3': -0.03, 'crew-at-the-oars-4': 0.02, 'crew-at-the-oars-5': -0.05 }, amp: 1, busy },
    { kind: 'SIRENS_CHAIN', rowing: { id: 'clock:row', clock: { period: 2.6, t0: 3.5, t1: T - 0.5 }, offsets: { 'crew-at-the-oars-1': 0.0, 'crew-at-the-oars-2': 0.04, 'crew-at-the-oars-3': -0.03, 'crew-at-the-oars-4': 0.02 } },
      port: ['crew-at-the-oars-1', 'crew-at-the-oars-3'], ship: { piece: 'black ship', pivot: [-17.2, 8.3, 110], riders: [O, ...crew], pitchK: 0.018, rollK: 0.03, heaveK: 1.0, omega: 1.25, zeta: 0.22 },
      mast: { actor: O, at: mastAt, h: K3.snap[O].h, t0: mastT }, rope: { k: 6, slack: 0.22, haulers: [{ actor: crew[0], t0: K5.win[1] }, { actor: crew[1], t0: K5.win[1] + 0.3 }] },
      song: { from: sirens, t0: promise.at - 2.5, t1: tighten.at + tighten.dur - 2 }, pull: 0.85 }];
  /* ── the helmsman ── */
  I({ id: 'iSteer', actor: crew[4], kind: 'STEER', t0: 0.5, t1: T, label: 'at the steering oar', because: [{ id: 'sIsle' }] });
  holds.push({ id: 'hSteer', actor: crew[4], t0: 0.5, t1: T, reason: 'the helmsman keeps the ship off the shore', params: { look: [['the-sirens-4', 2.8], [O, 1.6], [[-14, 40, -300], 3.0]], weight: false }, because: [{ id: 'sIsle' }] });
  /* ── the wax ── */
  I({ id: 'iWaxGo', actor: O, kind: 'APPROACH', t0: K2.win[0], t1: K2.win[1], key: 'K2', target: crew[2], label: 'to the men with the wax', because: [{ id: 'sCalm' }] });
  I({ id: 'iCome3', actor: crew[2], kind: 'APPROACH', t0: K2.win[0], t1: K2.win[1], key: 'K2', target: O, label: 'comes to him', because: [{ id: 'iWaxGo' }] });
  const e0 = K2.win[1] + 1.4;
  I({ id: 'iSeal', actor: O, kind: 'SEAL', t0: K2.win[1] + 0.2, t1: waxC.at + waxC.dur, label: 'softens the wax and seals their ears', params: { ears: [[crew[2], e0], [crew[3], e0 + 2.0], [crew[1], e0 + 4.0]] }, because: [{ id: 'iWaxGo' }] });
  /* ── the binding ── */
  I({ id: 'iMast', actor: O, kind: 'APPROACH', t0: K3.win[0], t1: K3.win[1], key: 'K3', target: [mastAt[0], 90, mastAt[2]], label: 'to the mast', because: [{ id: 'iSeal' }] });
  for (const [k, c] of [[0, crew[0]], [1, crew[1]]]) { I({ id: 'iB' + k, actor: c, kind: 'APPROACH', t0: K3.win[0], t1: K3.win[1], key: 'K3', target: O, label: 'to bind him', because: [{ id: 'iMast' }] });
    I({ id: 'iBind' + k, actor: c, kind: 'ROPE', t0: K3.win[1] + 0.3 + 0.2 * k, t1: 22.5, label: 'binds him upright to the mast', params: { how: 'bind', at: O }, because: [{ id: 'iB' + k }] }); }
  holds.push({ id: 'hBound', actor: O, t0: mastT + 0.3, t1: promise.at - 2.6, reason: 'bound upright to the mast, waiting for the song he asked to hear', params: { look: [['the-sirens-3', 2.6], [crew[0], 1.4], ['the-sirens-4', 2.2]], weight: false }, because: [{ id: 'iBind0' }] });
  /* ── the song and the promise ── */
  sirens.forEach((sr, k) => { I({ id: 'iSing' + k, actor: sr, kind: 'SING', t0: 1.0, t1: T, label: 'the song', params: { clock: { period: 2.4, t0: 1.0 }, offset: [0, 0.05, -0.04, 0.08, -0.07][k], to: O }, because: [{ id: 'sIsle' }] });
    I({ id: 'iBeck' + k, actor: sr, kind: 'BECKON', t0: promise.at + 0.2 * k, t1: struggle.at + struggle.dur, target: O, label: 'the promise: all that is known', because: [{ id: 'v4', rel: 'realises' }] }); });
  /* ── he strains, signals; they see him and come to tighten ── */
  I({ id: 'iPlead', actor: O, kind: 'PLEAD_BOUND', t0: struggle.at + 0.3, t1: struggle.at + struggle.dur, label: 'signals to be freed', params: { to: [crew[0], crew[1], crew[3]] }, because: [{ id: 'song' }] });
  for (const [k, c] of [[0, crew[0]], [1, crew[1]]]) { I({ id: 'iSee' + k, actor: c, kind: 'ATTEND', t0: struggle.at + 1.0 + 0.4 * k, t1: K5.win[0], target: O, label: 'sees him straining (they hear nothing)', because: [{ id: 'iPlead' }] });
    I({ id: 'iT' + k, actor: c, kind: 'APPROACH', t0: K5.win[0], t1: K5.win[1], key: 'K5', target: O, label: 'Perimedes, Eurylochus: to the ropes', because: [{ id: 'iSee' + k }] });
    I({ id: 'iHaul' + k, actor: c, kind: 'ROPE', t0: K5.win[1] + 0.2 + 0.3 * k, t1: tighten.at + tighten.dur - 1.0, label: 'tighten the ropes until the song fades', params: { how: 'haul', at: O }, because: [{ id: 'iT' + k }] }); }
  holds.push({ id: 'hSag', actor: O, t0: tighten.at + tighten.dur - 2.4, t1: T, reason: 'the song fades: the strain goes out of him', params: { look: [['the-sirens-2', 2.0], [crew[0], 1.5]], weight: false }, because: [{ id: 'song' }] });
  /* the rowers look up at the singing they cannot hear, now and then (a reason to look: the others' eyes on the shore) */
  for (const [k, c] of [[2, crew[2]], [3, crew[3]]]) holds.push({ id: 'hRow' + k, actor: c, t0: 15.2, t1: T, reason: 'rowing, ears sealed: the eyes on the stroke and on the man at the mast', params: { look: [[O, 2.2], ['the-sirens-' + (k + 1), 1.6], [crew[4], 2.4]], weight: false, offset: 0.4 * k }, because: [{ id: 'clock:row' }] });
  return {
    type: 'machinery', title: 'The Sirens: the ship, the rope, the song',
    actors: { [O]: { role: 'bound to the mast', body: 'minifig', principal: true }, ...Object.fromEntries(crew.map(c => [c, { role: 'at the oars', body: 'minifig', group: 'crew' }])), ...Object.fromEntries(sirens.map(s => [s, { role: 'a Siren', body: 'minifig', group: 'sirens' }])) },
    objects: { ship: { kind: 'ship', material: 'ship', at: [-17, 60, 110], affords: ['row', 'steer'] }, sea: { kind: 'water', material: 'water', at: [-17, 5, 110], affords: [] }, rope: { kind: 'rope', material: 'rope', at: [mastAt[0], 70, mastAt[2]], touches: [O], affords: ['bind', 'haul'] }, mast: { kind: 'mast', material: 'wood', at: [mastAt[0], 90, mastAt[2]], affords: [] } },
    authored: { intents, holds, stimuli, machinery, goals: { [O]: 'hear the song and live', [crew[0]]: 'keep him bound whatever he signals' },
      couplings: [...crew.slice(0, 4).map(c => ({ from: c, to: 'sea', via: 'water', t0: 3.5, env: true })), { from: 'sea', to: 'ship', via: 'water', env: true }, { from: 'rope', to: O, via: 'rope', t0: mastT }, ...crew.slice(0, 2).map(c => ({ from: c, to: 'rope', via: 'rope', t0: K5.win[1] }))],
      causal: { tau: 0.8, actions: {
        [O]: [{ a: 'listen', base: 0.8, f: { 'after:song': 0.5 } }, { a: 'strain toward them', base: -1.5, f: { 'after:song': 2.2, 'sees:the-sirens-3': 0.6 } }, { a: 'signal to be freed', base: -2.0, f: { 'after:song': 1.8, 'sees:crew-at-the-oars-1': 1.0 } }, { a: 'break free', base: -3.5, f: { 'after:song': 1.4 }, uses: ['rope'] }, { a: 'endure', base: 0.2, f: { 'after:mast': 0.6 } }],
        ...Object.fromEntries(crew.slice(0, 4).map(c => [c, [{ a: 'row', base: 1.2, f: {} }, { a: 'look up at him', base: -1.0, f: { ['sees:' + O]: 1.5 } }, { a: 'tighten the rope', base: -2.2, f: { ['sees:' + O]: 1.2, ['near:' + O + ':1.5']: 1.5 }, uses: ['rope'] }, { a: 'free him', base: -3.0, f: { ['near:' + O + ':1']: 0.8 }, uses: ['rope'] }]])),
        ...Object.fromEntries(sirens.map(s => [s, [{ a: 'sing', base: 1.5, f: {} }, { a: 'call to him', base: -0.8, f: { 'after:song': 1.2 } }, { a: 'fall silent', base: -1.5, f: {} }]])) } } },
  };
};
