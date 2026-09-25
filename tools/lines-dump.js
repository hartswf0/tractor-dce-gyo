#!/usr/bin/env node
/* tools/lines-dump.js — a scene's LINE and SOUND events with their keys and their seconds in the film: node tools/lines-dump.js <scene> → JSON on stdout (tools/lines-neural.py reads it). */
const path = require('path'), root = path.resolve(__dirname, '..');
global.window = {}; global.document = {}; require(path.join(root, 'world/film.js')); require(path.join(root, 'world/sound.js'));
const Film = window.Film, Sound = window.Sound; global.Film = Film;
for (const f of ['world/scenes-modes.js', 'world/scenes-cases.js']) require(path.join(root, f));
const sc = Film.SCENES[process.argv[2]]; let t = 0; const out = [];
for (const s of sc.shots) { for (const e of s.events || []) if (String(e.what).toUpperCase() === 'LINE') out.push({ key: Sound.lineKey(e.who, e.text), who: e.who, text: e.text, at: +(t + e.at).toFixed(2), slot: e.for, shot: s.name || s.title });
  for (const e of s.events || []) if (String(e.what).toUpperCase() === 'SOUND') out.push({ snd: e.who, at: +(t + e.at).toFixed(2), shot: s.name || s.title }); t += s.sec; }
console.log(JSON.stringify({ total: +t.toFixed(2), shots: sc.shots.map(s => [s.name || s.title, s.sec]), events: out }, null, 0));
