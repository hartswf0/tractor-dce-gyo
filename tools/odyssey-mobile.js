#!/usr/bin/env node
/* tools/odyssey-mobile.js — Nobody's Hands for phones, as ONE html file: play/odyssey-mobile.html.

   Build 1 (this file): the desktop game page (play/odyssey-game.html: the Hand Butter engine with the game layer) made
   self-contained for its code: every game script, the halfworld face scripts and the stylesheet are inlined, and the small
   data the game boots on (story.json: the 24 books of the Regulars' Cut; the eight level files; voice/lines.json) is inlined
   behind a fetch shim, so the page starts from its one URL. What stays on the site and streams by URL, from the same
   GitHub Pages origin, when a scene needs it: the scene cards (odyssey/butter/*.json), the LDraw parts they name (ldraw/),
   the keyframe cameras and previs casts, the voice clips (play/odyssey-game/cut/, voice/), the effects (sfx/) and the
   music beds (odyssey/take/bed/). The page says so on its first card.
   Mobile: viewport-fit=cover and safe areas, no page zoom, touch for every verb (one finger = the pointer, two = two hands),
   shadows off and the pixel ratio capped at 1.5 on touch screens, audio unlocked by the first tap, camera hands optional.
   Usage: node tools/odyssey-mobile.js [--src play/odyssey-game.html] [--out play/odyssey-mobile.html] */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), args = process.argv.slice(2);
let src = 'play/odyssey-game.html', out = 'play/odyssey-mobile.html';
for (let i = 0; i < args.length; i++) { if (args[i] === '--src') src = args[++i]; else if (args[i] === '--out') out = args[++i]; }
let html = fs.readFileSync(path.join(root, src), 'utf8');
const playDir = path.join(root, 'play');
const read = rel => fs.readFileSync(path.join(playDir, rel), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
let inlined = 0;
/* the stylesheet and every game script, inlined in place */
html = html.replace(/<link rel="stylesheet" href="(odyssey-game\/[^"]+\.css)">/g, (m, rel) => { inlined++; return `<style data-src="${rel}">\n${read(rel)}\n</style>`; });
html = html.replace(/<script src="((?:\.\.\/world|odyssey-game)\/[^"]+\.js)"><\/script>/g, (m, rel) => { inlined++; return `<script data-src="${rel}">\n${safe(read(rel))}\n</script>`; });
/* the boot data behind a fetch shim: the page asks for these by their relative paths, as the desktop build does */
const files = { 'odyssey-game/story.json': read('odyssey-game/story.json'), 'odyssey-game/voice/lines.json': read('odyssey-game/voice/lines.json') };
for (const f of fs.readdirSync(path.join(playDir, 'odyssey-game/levels'))) if (f.endsWith('.json')) files['odyssey-game/levels/' + f] = read('odyssey-game/levels/' + f);
const shim = `<script>/* odyssey-mobile: inline files served to fetch() by their paths; everything else goes to the network */
(function(){const F=${safe(JSON.stringify(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, JSON.parse(v)]))))};const base=new URL('.',location.href).href;const orig=window.fetch.bind(window);
window.OG_MOBILE=true;window.fetch=function(input,init){try{const u=new URL(typeof input==='string'?input:input.url,location.href).href;if(u.startsWith(base)){const k=u.slice(base.length).split('?')[0];if(F[k])return Promise.resolve(new Response(JSON.stringify(F[k]),{status:200,headers:{'Content-Type':'application/json'}}));}}catch(e){}return orig(input,init);};})();</script>`;
const firstGame = html.indexOf('<!-- NOBODY\'S HANDS: the game layer'); if (firstGame < 0) throw new Error('the page has no game layer: build play/odyssey-game.html first');
html = html.slice(0, firstGame) + shim + '\n' + html.slice(firstGame);
/* the phone's viewport: edge to edge, no zoom (pinch is a game verb) */
html = html.replace(/<meta name="viewport"[^>]*>/i, '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">');
if (!/name="viewport"/.test(html)) html = html.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">');
html = html.replace(/<title>[^<]*<\/title>/, "<title>Nobody's Hands · mobile</title>\n<meta name=\"theme-color\" content=\"#0c1116\"><meta name=\"apple-mobile-web-app-capable\" content=\"yes\"><meta name=\"mobile-web-app-capable\" content=\"yes\">");
fs.writeFileSync(path.join(root, out), html);
console.log(`${out}: one file, ${(html.length / 1e6).toFixed(1)} MB; ${inlined} scripts/styles inlined, ${Object.keys(files).length} data files behind the fetch shim; scene cards, parts and audio stream from the site`);
