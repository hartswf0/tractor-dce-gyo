/* world/scenes-cast.js — the Odyssey cast on a bare stage: the halfworld's twelve faces, five of them, painted on LEGO heads.
   The first thing to make is the cast, before any scene: each one stands alone under a close-up and runs the directions
   the poem asks of them, so the decal can be judged where a face is read: at 2 m, 24 frames a second, one channel at a time. */
(function () {
  if (!window.Film || !Film.SCENES) return;
  const M = 40;
  const CAST = [
    { name: 'penelope', x: -6, runs: ['recognition', 'guarded', 'skepticism', 'weariness', 'tenderness', 'joy'] },
    { name: 'odysseus', x: -3, runs: ['irony', 'command', 'resolve', 'contempt', 'anguish', 'recognition'] },
    { name: 'eurycleia', x: 0, runs: ['concern', 'recognition', 'fear', 'appeal', 'tenderness', 'grief'] },
    { name: 'telemachus', x: 3, runs: ['tenderness', 'resolve', 'hurt', 'wonder', 'confrontation', 'desperation'] },
    { name: 'athena', x: 6, runs: ['appeal', 'irony', 'command', 'wonder', 'contempt', 'joy'] },
  ];
  const HOLD = 2.0, CAP = 40;
  /** The body that goes with a direction: the register's phrases, one per emotion, so the arms carry it as well as the face. */
  const BODY = { recognition: 'hands near face', contempt: 'arms crossed', irony: 'shrug', appeal: 'open arms', weariness: 'look down', resolve: 'hands on hips', command: 'pointing', tenderness: 'open arms', grief: 'hands near face', anguish: 'hands near face', hurt: 'arms crossed', concern: 'listen', fear: 'panic', wonder: 'open arms', joy: 'cheer', guarded: 'arms crossed', skepticism: 'shrug', confrontation: 'pointing', desperation: 'open arms' };
  /** Each one's own recorded line: the longest SPEAK with a voice file among the compiled Odyssey scenes (world/scenes-odyssey.js), cut to CAP seconds with its words in proportion. */
  const lineOf = who => { let best = null; for (const [k, sc] of Object.entries(Film.SCENES)) { if (!/^odyssey-od-/.test(k)) continue; for (const sh of sc.shots) for (const e of sh.events || []) if (e.what === 'SPEAK' && e.who === who && e.file && (!best || e.for > best.for)) best = e; }
    if (!best) return { text: 'I know you.', sec: 0.9 }; const sec = Math.min(CAP, best.for), words = best.text.split(/\s+/), n = Math.max(3, Math.round(words.length * sec / best.for));
    return { text: sec < best.for ? words.slice(0, n).join(' ') : best.text, sec: +sec.toFixed(2), file: best.file, from: best.from, for: +sec.toFixed(2), scene: best.file.replace(/^odyssey\/|\.m4a$/g, '') }; };
  const shots = [{ title: 'THE ODYSSEY\nTHE CAST', style: 'card', sec: 3, name: 'the card', shift: 'cast', score: 'file:odyssey/music/loom-assembly-night-sail.ogg', fade: 3 },
    { name: 'the line-up', on: 'eurycleia', frame: 'wide', from: 's', lens: 40, sec: 6, shift: 'cast', events: [{ what: 'CAPTION', text: 'Penelope, Odysseus, Eurycleia, Telemachus, Athena: the halfworld\'s faces on LEGO heads', at: 0.4, sec: 5 }] }];
  for (const c of CAST) {
    const events = [{ what: 'BEAT', id: c.name + ' reads', who: c.name, at: 0, to: c.runs.length * HOLD + 1, why: 'a face is cast when its directions read at 2 m', direct: c.runs[0] }];
    c.runs.forEach((r, i) => { const at = +(0.4 + i * HOLD).toFixed(2); events.push({ what: 'PHRASE', who: c.name, name: r, at, enter: 0.25, hold: HOLD - 0.5, release: 0.25 }); if (BODY[r]) events.push({ what: 'PHRASE', who: c.name, name: BODY[r], at: +(at + 0.05).toFixed(2), enter: 0.35, hold: HOLD - 0.7, release: 0.35 }); events.push({ what: 'CAPTION', text: `${c.name}: ${r}`, at, sec: HOLD - 0.1 }); events.push({ what: 'ASSERT', who: c.name, reads: r, at: +(at + 0.8).toFixed(2) }); });
    const L = lineOf(c.name), at = +(0.4 + c.runs.length * HOLD).toFixed(2);
    events.push({ what: 'SPEAK', who: c.name, text: L.text, at, sec: L.sec, file: L.file, from: L.from, for: L.for }); events.push({ what: 'ASSERT', who: c.name, reads: 'speaking', at: +(at + Math.min(2.5, L.sec * 0.4)).toFixed(2) });
    events.push({ what: 'PHRASE', who: c.name, name: 'open arms', at: +(at - 0.2).toFixed(2), enter: 0.5, hold: L.sec + 0.5, release: 0.6 });   // the line is spoken with the hands free: the gestures ride on top
    shots.push({ name: c.name, on: c.name, frame: 'waist', from: 's', lens: 50, sec: +(c.runs.length * HOLD + L.sec + 1.2).toFixed(1), shift: c.name, events });
  }
  shots.push({ name: 'the line-up again', on: 'eurycleia', frame: 'medium', from: 'se', lens: 40, sec: 4, shift: 'cast', events: CAST.map(c => ({ what: 'PHRASE', who: c.name, name: c.runs[0], at: 0.3, enter: 0.3, hold: 3 })) });
  Film.SCENES['odyssey-cast'] = {
    name: 'The Odyssey: the cast', time: 'day', weather: 'clear', ground: 'flat', me: 'off', set: { kind: 'stage', r: 60, seed: 1 },
    story: { title: 'The cast', description: 'Five of the twelve faces the halfworld drew for the Odyssey, printed on LEGO heads and run through the directions the poem asks of each: a casting sheet before any scene.', location: 'a bare stage', entities: CAST.map(c => c.name), goals: ['every direction reads at 2 m'], obstacles: ['a head is a cylinder', 'a print does not move'], shifts: [{ id: 'cast', text: 'the line-up' }, ...CAST.map(c => ({ id: c.name, text: c.name + ' reads' }))], pipeline: ['HALFWORLD FACES', 'DECAL', 'HEAD', 'CAST', 'DIRECTIONS', 'SHEET'] },
    actors: CAST.map(c => ({ name: c.name, figure: c.name, x: c.x, z: -4, heading: 180 })),
    builds: [], shots,
  };
})();
