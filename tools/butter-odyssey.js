#!/usr/bin/env node
/* tools/butter-odyssey.js — the Odyssey forage inside WAG / BUTTER 26: every card of the atlas a scene to load.

   Reads a WAG-HAND-BUTTER HTML and odyssey/forage.json and writes play/hand-butter-odyssey.html: the app with its part
   library pointed at this repository's ldraw/, the LDraw colour table appended (the picker keeps its seven swatches), the
   part index extended with every part the cards use, and one scene preset per card. A preset carries its name and
   description and the address of its scene file (odyssey/butter/<id>.json); the file is fetched when the scene is loaded,
   so the page stays the size of Butter 26. `?scene=<card id>` loads one on arrival.
   Usage: node tools/butter-odyssey.js <WAG-HAND-BUTTER-26.HTML> [--out play/hand-butter-odyssey.html] */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), args = process.argv.slice(2), src = args[0];
let out = 'play/hand-butter-odyssey.html'; for (let i = 1; i < args.length; i++) if (args[i] === '--out') out = args[++i];
if (!src) { console.error('usage: node tools/butter-odyssey.js <WAG-HAND-BUTTER html> [--out file]'); process.exit(1); }
const L = require('./forage/ldraw.js');
const index = JSON.parse(fs.readFileSync(path.join(root, 'odyssey/forage.json'), 'utf8'));
const LDC = {}; for (const l of fs.readFileSync(path.join(root, 'ldraw/LDConfig.ldr'), 'utf8').split(/\r?\n/)) { const m = l.match(/^0 !COLOUR\s+\S+\s+CODE\s+(\d+)\s+VALUE\s+#([0-9A-Fa-f]{6})/); if (m) LDC[+m[1]] = parseInt(m[2], 16); }
const TYPE = { scene: 'Scene', location: 'Location', character: 'Character', ensemble: 'Ensemble', creature: 'Creature', vehicle: 'Vehicle', prop: 'Prop', set_piece: 'Set piece', environment: 'Environment', divine_fx: 'Divine effect', sound_source: 'Sound', wearable: 'Wearable' };
const ORDER = Object.keys(TYPE);
const cards = index.cards.slice().sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type) || a.id.localeCompare(b.id));
/* the parts every card's scene uses, each answered by the library all the way down */
const used = new Map(), colours = new Set(), bad = new Set();
for (const c of cards) { const doc = JSON.parse(fs.readFileSync(path.join(root, c.files.butter), 'utf8')); for (const p of doc.parts) { colours.add(p.color); if (used.has(p.part)) continue; if (!L.info(p.part).ok) { bad.add(p.part); continue; } used.set(p.part, (L.describe(p.part) || p.part).replace(/^~/, '')); } }
if (bad.size) console.log('parts with holes in their tree (the scenes still name them; Butter will refuse those scenes):', [...bad].join(' '));
let html = fs.readFileSync(src, 'utf8'); const bytes0 = html.length;
const need = (re, what) => { if (!re.test(html)) throw new Error('the page has no ' + what); };
need(/base='https:\/\/hartswf0\.github\.io\/tractor-dce-gyo\/ldraw\/'/, 'library base'); html = html.replace(/base='https:\/\/hartswf0\.github\.io\/tractor-dce-gyo\/ldraw\/'/, "base=new URL('../ldraw/',location.href).href");
const colStart = html.indexOf('COLORS=[{code:19,hex:0xd7ba8c}'); if (colStart < 0) throw new Error('the page has no colour table'); const colEnd = html.indexOf(']', colStart); const have = new Set([...html.slice(colStart, colEnd).matchAll(/code:(\d+)/g)].map(m => +m[1]));
const missingColours = [...colours].filter(c => !have.has(c) && LDC[c] == null); if (missingColours.length) console.log('colours LDConfig does not define:', missingColours.join(' '));
html = html.slice(0, colEnd) + ',' + Object.entries(LDC).filter(([c]) => !have.has(+c)).map(([c, hex]) => `{code:${c},hex:0x${hex.toString(16).padStart(6, '0')}}`).join(',') + html.slice(colEnd);
html = html.replace(/COLORS\.map\(/, 'COLORS.slice(0,7).map(').replace(/COLORS\.forEach\(/, 'COLORS.slice(0,7).forEach(');
const idxStart = html.indexOf('<script data-butter-module="movieator-index">'); if (idxStart < 0) throw new Error('no movieator index'); const idxEnd = html.indexOf('</script>', idxStart); const idxText = html.slice(idxStart, idxEnd); const known = new Set([...idxText.matchAll(/"id":\s*"([^"]+)"/g)].map(m => m[1]));
const add = [...used].filter(([id]) => !known.has(id)).map(([id, name]) => JSON.stringify({ id, name, category: 'Odyssey' }));
const close = idxText.lastIndexOf(']'); html = html.slice(0, idxStart) + idxText.slice(0, close) + (add.length ? ',' + add.join(',') : '') + idxText.slice(close) + html.slice(idxEnd);
/* the presets: stubs that name their scene file */
const preStart = html.indexOf('window.ButterScenePresets=['); if (preStart < 0) throw new Error('no presets'); const preEnd = html.indexOf('\n];</script>', preStart); if (preEnd < 0) throw new Error('presets end');
const stubs = cards.map(c => ({ id: c.id, name: `${TYPE[c.type]} · ${c.type === 'scene' ? c.id.replace('OD-', '') + ' ' : ''}${c.name}`, description: `${c.name}. ${c.pieces} pieces in ${c.subBuilds} sub-builds, ${c.joints} stud joints, ${c.cm.join(' x ')} cm.${c.sources.length ? ' Foraged from ' + [...new Set(c.sources.map(s => s.file || s.donor))].join(', ') + '.' : ''}${c.butter.cut ? ' ' + c.butter.cut + ' parts beyond the plate are in the MPD only.' : ''}`, src: '../' + c.files.butter, parts: [], actors: [] }));
html = html.slice(0, preEnd) + ',\n' + stubs.map(p => JSON.stringify(p)).join(',\n') + html.slice(preEnd);
/* a stub is fetched before it is loaded: the picker's button and the ?scene arrival both go through ButterFetchScene */
html = html.replace('window.ButterScenePresets=[', 'window.ButterFetchScene=async s=>{if(!s||!s.src)return s;const r=await fetch(s.src);if(!r.ok)throw Error("Scene file missing: "+s.src);const d=await r.json();return {...s,...d,src:undefined};};\nwindow.ButterScenePresets=[');
const btn = "$('#sceneLoad').onclick=()=>{const scene=ButterScenePresets.find(s=>s.id===$('#scenePreset').value);load({version:1,...scene,plateAngle:0}).catch(e=>note(e.message,'SCENE'));};";
if (!html.includes(btn)) throw new Error('the page has no scene button'); html = html.replace(btn, "$('#sceneLoad').onclick=()=>{const scene=ButterScenePresets.find(s=>s.id===$('#scenePreset').value);$('#sceneStatus').textContent='Fetching the scene…';ButterFetchScene(scene).then(s=>load({version:1,...s,plateAngle:0})).catch(e=>note(e.message,'SCENE'));};");
const arrive = "if(preset)load({version:1,...preset}).catch(e=>note(e.message,'SCENE'));";
if (!html.includes(arrive)) throw new Error('the page has no arrival hook'); html = html.replace(arrive, "if(preset){$('#scenePreset').value=preset.id;$('#sceneDescription').textContent=preset.description;ButterFetchScene(preset).then(s=>load({version:1,...s})).catch(e=>note(e.message,'SCENE'));}");
/* a foraged build holds together: its pieces stand pinned (static bodies) until one is picked up, which frees it */
const dyn = 'b.type=held?CANNON.Body.KINEMATIC:CANNON.Body.DYNAMIC;';
if (!html.includes(dyn)) throw new Error('the page has no body typing'); html = html.replace(dyn, 'if(held&&PH.pinned)PH.pinned.delete(p.id);b.type=held?CANNON.Body.KINEMATIC:PH.pinned&&PH.pinned.has(p.id)?CANNON.Body.STATIC:CANNON.Body.DYNAMIC;');
html = html.replace('const d=await r.json();return {...s,...d,src:undefined};', 'const d=await r.json();try{PH.pinned=new Set(d.parts.map(p=>p.id));}catch(e){}return {...s,...d,src:undefined};');
html = html.replace(/<title>[^<]*<\/title>/, '<title>The Odyssey in Hand Butter</title>');
fs.mkdirSync(path.dirname(path.join(root, out)), { recursive: true }); fs.writeFileSync(path.join(root, out), html);
console.log(`${out}: ${stubs.length} card scenes, ${add.length} parts added to the index, ${Object.keys(LDC).length - have.size} colours added, ${(html.length / 1e6).toFixed(1)} MB (was ${(bytes0 / 1e6).toFixed(1)})`);
