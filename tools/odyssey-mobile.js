#!/usr/bin/env node
/* tools/odyssey-mobile.js — Nobody's Hands for phones, as ONE html file: play/odyssey-mobile.html.

   LEAN (the default): no LDraw library, no 29 MB workspace. The file carries
     three.js r128 (from the Hand Butter page), butter-lite (play/odyssey-game/mobile/butter-lite.js: the workspace's names,
       with Butter's own hand model — trackHands, pinchRatio, gestureOf, imagePoint, the MediaPipe worker — and Beaver's stud
       handshake and the stud ports, cut verbatim from play/hand-butter-odyssey.html by this tool), world/minifig.js and the
       halfworld faces, the game layer and the eight levels, the stylesheet;
     the geometry bank (tools/odyssey-mobile-bake.js: every part of the 102 scene cards, the level sets and the cast, LITE,
       gzip) with the cards' rows, the story, the levels, the key cameras and previs casts;
     the voice: every kept segment of the cut (cut/<scene>.ogg) and every level line, re-encoded to Opus mono at a low rate,
       and the synthesised effects — each served to the game as a blob URL.
   Streamed from the site (the same GitHub Pages origin), and said so on the chart: the book's music beds
   (odyssey/take/bed/*.ogg) and, only if the player turns hands on, MediaPipe from its CDN.
   ENGINE (--engine): build 1, the desktop page with its game scripts inlined (29.7 MB; streams sets, parts and audio).
   Usage: node tools/odyssey-mobile.js [--engine] [--voice-kbps 16] [--out play/odyssey-mobile.html] */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), zlib = require('zlib'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..'), args = process.argv.slice(2), has = k => args.includes('--' + k), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = opt('out', 'play/odyssey-mobile.html'), playDir = path.join(root, 'play'), GAME = path.join(playDir, 'odyssey-game');
const read = rel => fs.readFileSync(path.join(playDir, rel), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
const LAYER = ['engine', 'synth-hand', 'input', 'audio', 'hud', 'map', 'cinema', 'story', 'game'];
const levels = fs.readdirSync(path.join(GAME, 'levels')).filter(f => /^\d\d-.*\.js$/.test(f)).sort();

if (has('engine')) { buildEngine(); process.exit(0); }

/* ── the pieces of Hand Butter the phone needs, cut from the engine page ── */
const engine = fs.readFileSync(path.join(playDir, 'hand-butter-odyssey.html'), 'utf8');
const three = (() => { const i = engine.indexOf('<script>'), e = engine.indexOf('</script>', i); const body = engine.slice(i + 8, e); if (!/Three\.js Authors/.test(body.slice(0, 400))) throw Error('three.js block not found'); return body; })();
function block(startMarker, endMarker) { const i = engine.indexOf(startMarker); if (i < 0) throw Error('engine has no ' + startMarker); const e = engine.indexOf(endMarker, i); if (e < 0) throw Error('no end for ' + startMarker); return engine.slice(i, e + endMarker.length); }
function fn(name) { const i = engine.indexOf('\nfunction ' + name + '('); if (i < 0) throw Error('engine has no function ' + name); let k = engine.indexOf('{', i), depth = 0, q = null;
  for (; k < engine.length; k++) { const ch = engine[k]; if (q) { if (ch === '\\') { k++; continue; } if (ch === q) q = null; continue; } if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; } if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) break; } }
  return engine.slice(i + 1, k + 1); }
const beaver = block('const Beaver=(()=>{', 'return {physicalHandshake,transformPoint};})();');
const ports = (() => { const i = engine.indexOf('const PORTS={'), e = engine.indexOf('\n', i); return engine.slice(i, e); })();
const hands = ['handPoint', 'palm', 'distance', 'metric', 'pinchRatio', 'trackHands', 'gestureOf', 'imagePoint', 'makeHandWorker'].map(fn).join('\n');
const lite = read('odyssey-game/mobile/butter-lite.js').replace('/*@BUTTER_EXTRACT@*/', `/* ── cut verbatim from play/hand-butter-odyssey.html by tools/odyssey-mobile.js ── */\n${beaver}\n${ports}\n${hands}\n`);

/* ── the bank ── */
const bankFile = path.join(os.tmpdir(), 'odyssey-mobile-bank.bin.gz');
execFileSync(process.execPath, ['--max-old-space-size=4096', path.join(__dirname, 'odyssey-mobile-bake.js'), '--out', bankFile], { stdio: 'inherit' });
const bank = fs.readFileSync(bankFile);

/* ── the voice and the effects, low-rate Opus, cached between builds ── */
const FF = (() => { try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } })();
const kbps = +opt('voice-kbps', 16), cache = path.join(os.tmpdir(), 'odyssey-mobile-audio-' + kbps); fs.mkdirSync(cache, { recursive: true });
const audio = {};
function opus(rel, rate) { const src = path.join(GAME, rel), dst = path.join(cache, rel.replace(/[\/]/g, '_')); if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) execFileSync(FF, ['-v', 'error', '-y', '-i', src, '-ac', '1', '-c:a', 'libopus', '-b:a', rate + 'k', '-application', 'voip', '-f', 'ogg', dst]); return fs.readFileSync(dst); }
for (const f of fs.readdirSync(path.join(GAME, 'cut'))) audio['odyssey-game/cut/' + f] = opus('cut/' + f, kbps);
for (const f of fs.readdirSync(path.join(GAME, 'voice'))) if (f.endsWith('.ogg')) audio['odyssey-game/voice/' + f] = opus('voice/' + f, kbps);
for (const f of fs.readdirSync(path.join(GAME, 'sfx'))) audio['odyssey-game/sfx/' + f] = opus('sfx/' + f, 24);
const audioBytes = Object.values(audio).reduce((a, b) => a + b.length, 0);

/* ── the page ── */
const css = read('odyssey-game/game.css');
const shim = `/* the one file's files: the bank's JSON and cards, and the inline audio, served to fetch() and to <audio> by their paths */
(function(){const base=new URL('.',location.href);const abs=p=>new URL(p,base).href;const orig=window.fetch.bind(window);const blobs=new Map();
function blob(p){const k=abs(p);if(blobs.has(k))return blobs.get(k);const el=document.querySelector('script[data-audio="'+k.slice(base.href.length)+'"]')||[...document.querySelectorAll('script[data-audio]')].find(s=>abs(s.dataset.audio)===k);if(!el)return null;const raw=atob(el.textContent.trim()),b=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)b[i]=raw.charCodeAt(i);const u=URL.createObjectURL(new Blob([b],{type:'audio/ogg'}));blobs.set(k,u);el.textContent='';return u;}
window.OG_MOBILE=true;window.OG_URL=p=>blob(p)||p;
window.fetch=async function(input,init){let u;try{u=new URL(typeof input==='string'?input:input.url,location.href).href;}catch(e){return orig(input,init);}
 const au=blob(u);if(au)return orig(au);await ButterLite.ready;const H=window.OG_BANK;if(!H)return orig(input,init);
 for(const [k,v] of Object.entries(H.files))if(abs(k)===u)return new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}});
 const m=/\\/odyssey\\/butter\\/([^\\/?]+)\\.json/.exec(u);if(m&&H.cards[m[1]])return new Response(JSON.stringify({parts:H.cards[m[1]].map((r,i)=>({id:'c'+i,part:r[0],color:r[1],x:r[2],y:r[3],z:r[4],...(Array.isArray(r[5])?{q:r[5],r:0}:{r:r[5]})}))}),{headers:{'Content-Type':'application/json'}});
 return orig(input,init);};})();`;
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>Nobody's Hands · mobile</title><meta name="theme-color" content="#0c1116"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="description" content="The Odyssey, played by hand: the whole poem on the Regulars' Cut as voiced LEGO cinema, with trials of the hand at its turns. One file.">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#0c1116;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}#app{position:fixed;inset:0}#stage{position:fixed;inset:0}#view{width:100%;height:100%;display:block;touch-action:none}#video{position:fixed;width:1px;height:1px;opacity:0;pointer-events:none}
#og-boot{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#f3ecd8;font:600 14px ui-monospace,Menlo,monospace;background:#0c1116;z-index:50;text-align:center;padding:20px}#og-boot b{font:700 26px Georgia,serif;color:#e8c55a;letter-spacing:.08em}</style>
<style>${css}</style></head>
<body><main id="app"><section id="stage"><canvas id="view"></canvas></section></main><video id="video" muted playsinline></video>
<div id="og-boot"><b>NOBODY'S HANDS</b><span>the Odyssey, played by hand</span><span id="og-boot-msg">unpacking the ships…</span></div>
<script type="application/octet-stream" id="og-bank">${bank.toString('base64')}</script>
${Object.entries(audio).map(([k, b]) => `<script type="application/octet-stream" data-audio="${k}">${b.toString('base64')}</script>`).join('\n')}
<script>${safe(three)}</script>
<script>${safe(shim)}</script>
<script>${safe(lite)}</script>
${['../world/minifig.js', '../world/halfworld-face.js', '../world/face.js'].map(f => `<script data-src="${f}">${safe(read(f))}</script>`).join('\n')}
${LAYER.map(n => `<script data-src="odyssey-game/${n}.js">${safe(read('odyssey-game/' + n + '.js'))}</script>`).join('\n')}
${levels.map(f => `<script data-src="odyssey-game/levels/${f}">${safe(read('odyssey-game/levels/' + f))}</script>`).join('\n')}
<script>ButterLite.ready.then(()=>{document.getElementById('og-boot').remove();OdysseyGame.boot();}).catch(e=>{document.getElementById('og-boot-msg').textContent='Could not start: '+e.message;console.error(e);});</script>
</body></html>`;
fs.writeFileSync(path.join(root, out), page);
console.log(`${out}: ONE file, ${(page.length / 1e6).toFixed(1)} MB — geometry bank ${(bank.length / 1e6).toFixed(1)} MB gz, inline audio ${(audioBytes / 1e6).toFixed(1)} MB (${Object.keys(audio).length} clips, Opus ${kbps} kbps voice), code ${((three.length + lite.length) / 1e6).toFixed(1)} MB+; streamed: music beds (odyssey/take/bed/), MediaPipe (only with hands on)`);

function buildEngine() {
  let html = read('odyssey-game.html'); let inlined = 0;
  html = html.replace(/<link rel="stylesheet" href="(odyssey-game\/[^"]+\.css)">/g, (m, rel) => { inlined++; return `<style data-src="${rel}">\n${read(rel)}\n</style>`; });
  html = html.replace(/<script src="((?:\.\.\/world|odyssey-game)\/[^"]+\.js)"><\/script>/g, (m, rel) => { inlined++; return `<script data-src="${rel}">\n${safe(read(rel))}\n</script>`; });
  const files = { 'odyssey-game/story.json': read('odyssey-game/story.json'), 'odyssey-game/voice/lines.json': read('odyssey-game/voice/lines.json') };
  for (const f of fs.readdirSync(path.join(GAME, 'levels'))) if (f.endsWith('.json')) files['odyssey-game/levels/' + f] = read('odyssey-game/levels/' + f);
  const sh = `<script>(function(){const F=${safe(JSON.stringify(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, JSON.parse(v)]))))};const base=new URL('.',location.href).href;const orig=window.fetch.bind(window);
window.OG_MOBILE=true;window.fetch=function(input,init){try{const u=new URL(typeof input==='string'?input:input.url,location.href).href;if(u.startsWith(base)){const k=u.slice(base.length).split('?')[0];if(F[k])return Promise.resolve(new Response(JSON.stringify(F[k]),{status:200,headers:{'Content-Type':'application/json'}}));}}catch(e){}return orig(input,init);};})();</script>`;
  const first = html.indexOf('<!-- NOBODY\'S HANDS: the game layer'); if (first < 0) throw Error('build play/odyssey-game.html first');
  html = html.slice(0, first) + sh + '\n' + html.slice(first);
  html = html.replace(/<meta name="viewport"[^>]*>/i, '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">');
  html = html.replace(/<title>[^<]*<\/title>/, "<title>Nobody's Hands · mobile (engine build)</title>");
  const o = opt('out', 'play/odyssey-mobile-engine.html'); fs.writeFileSync(path.join(root, o), html);
  console.log(`${o}: engine build, ${(html.length / 1e6).toFixed(1)} MB; ${inlined} scripts inlined; sets, parts and audio stream from the site`);
}
