#!/usr/bin/env node
/* tools/odyssey-game.js — NOBODY'S HANDS: the Odyssey played by hand, with Hand Butter as its engine.

   Reads play/hand-butter-odyssey.html (WAG / HAND BUTTER 26 with the Odyssey forage, itself made by tools/butter-odyssey.js)
   and writes play/odyssey-game.html: the same engine (three.js, cannon, the embedded LDraw library, the MediaPipe hand worker,
   the track/pinch/gesture model, stud snapping and bonds, the Movieator minifig rigs), with the game layer injected:
     play/odyssey-game/game.css and play/odyssey-game/*.js (engine bridge, input, synthetic hands, audio, HUD, map, runner),
     play/odyssey-game/levels/*.js (the eight levels; their data in levels/*.json, fetched at run time),
     ../world/halfworld-face.js and ../world/face.js (the halfworld faces as decals on the minifig heads).
   Patches, each asserted so a changed engine fails loudly:
     1. processHands hands its smoothed tracks to the game first: `OdysseyHands.take(tracks, now)` returns true to consume them
        (the camera worker and a test's synthetic landmarks both enter through processHands);
     2. the scene store key is the game's own, so a Hand Butter session on the same origin is not restored into a level;
     3. the title.
   Nothing is inlined: the page is the engine plus <script src> tags; voice clips, beds and effects load by URL.
   Usage: node tools/odyssey-game.js [--src play/hand-butter-odyssey.html] [--out play/odyssey-game.html] */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), args = process.argv.slice(2);
let src = 'play/hand-butter-odyssey.html', out = 'play/odyssey-game.html';
for (let i = 0; i < args.length; i++) { if (args[i] === '--src') src = args[++i]; else if (args[i] === '--out') out = args[++i]; }
let html = fs.readFileSync(path.join(root, src), 'utf8'); const bytes0 = html.length;
const swap = (from, to, what) => { if (!html.includes(from)) throw new Error('the engine has no ' + what + ' (' + from.slice(0, 60) + '…)'); html = html.replace(from, to); };

/* 1. the hands go to the game first */
swap("const tracks=trackHands(marks,now),r=$('#stage').getBoundingClientRect();",
  "const tracks=trackHands(marks,now),r=$('#stage').getBoundingClientRect();if(window.OdysseyHands&&OdysseyHands.take(tracks,now))return;",
  'processHands track step');
/* 2. the game keeps its own scene and workshop stores */
swap("const key='wag-butter16-scenes-v1';", "const key='odyssey-game-scenes-v1';", 'scene store key');
swap("const STORE='wag-hand-butter-16';", "const STORE='odyssey-game-workshop-v1';", 'workshop store key');
/* 3. the title; and a level is staged by the game, never restored from a previous visit */
html = html.replace(/<title>[^<]*<\/title>/, "<title>Nobody's Hands · the Odyssey played by hand</title>\n<script>try{localStorage.removeItem('odyssey-game-scenes-v1');localStorage.removeItem('odyssey-game-workshop-v1');}catch(e){}</script>");

/* the game layer, loaded after the engine */
const LAYER = ['engine', 'synth-hand', 'input', 'audio', 'hud', 'map', 'game'];
const levels = fs.readdirSync(path.join(root, 'play/odyssey-game/levels')).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
const tags = ['<link rel="stylesheet" href="odyssey-game/game.css">',
  '<script src="../world/halfworld-face.js"></script>', '<script src="../world/face.js"></script>',
  ...LAYER.map(n => `<script src="odyssey-game/${n}.js"></script>`),
  ...levels.map(f => `<script src="odyssey-game/levels/${f}"></script>`),
  '<script>OdysseyGame.boot();</script>'].join('\n');
const end = html.lastIndexOf('</body>'); if (end < 0) throw new Error('the page has no </body>');
html = html.slice(0, end) + '\n<!-- NOBODY\'S HANDS: the game layer (tools/odyssey-game.js) -->\n' + tags + '\n' + html.slice(end);

fs.writeFileSync(path.join(root, out), html);
console.log(`${out}: Hand Butter + ${LAYER.length} game scripts + ${levels.length} levels, ${(html.length / 1e6).toFixed(1)} MB (engine ${(bytes0 / 1e6).toFixed(1)} MB)`);
