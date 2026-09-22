#!/usr/bin/env node
/* tools/butter-scenes.js — the repository's scene builds inside WAG / BUTTER 26, as scenes to load and think about as films.

   Reads a supplied WAG-HAND-BUTTER HTML and writes play/hand-butter-scenes.html: the same app with the part library
   pointed at this repository's ldraw/, the LDraw colour table appended so a set keeps its palette (the picker's seven
   swatches stay), the part index extended with every part the scenes use, and a scene preset per set (zones for a set
   wider than the 800 LDU plate: each zone a window of the set centred where the parts are), its description the film's thinking (the app refuses a
   character standing on a part, so the cast stands in the film, not on the plate) (Film.CASES: beats, part, why).
   `?scene=<preset id>` loads one on arrival. The sets are the stripped donors in ldraw/models (no minifigures).
   Usage: node tools/butter-scenes.js <WAG-HAND-BUTTER-26.HTML> [--out play/hand-butter-scenes.html] */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'); const args = process.argv.slice(2); const src = args[0]; let out = 'play/hand-butter-scenes.html';
for (let i = 1; i < args.length; i++) if (args[i] === '--out') out = args[++i];
if (!src) { console.error('usage: node tools/butter-scenes.js <WAG-HAND-BUTTER html> [--out file]'); process.exit(1); }
/* the film side: cases and their programs */
const ctx = { window: { Film: { SCENES: {} } }, console }; ctx.Film = ctx.window.Film; vm.createContext(ctx);
for (const f of ['world/scenes-cases.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const CASES = ctx.window.Film.CASES, SCENES = ctx.window.Film.SCENES;
/* the LDraw colours */
const LDC = {}; for (const l of fs.readFileSync(path.join(root, 'ldraw/LDConfig.ldr'), 'utf8').split(/\r?\n/)) { const m = l.match(/^0 !COLOUR\s+\S+\s+CODE\s+(\d+)\s+VALUE\s+#([0-9A-Fa-f]{6})/); if (m) LDC[+m[1]] = parseInt(m[2], 16); }
/* a set as rows: LDraw (x, y down, z) to the plate (x, y up, -z), the lowest brick at y 0, the footprint centred; the matrix as a quaternion */
function quatOf(m) { const [a, b, c, d, e, f, g, h, i] = m; const M = [a, -b, -c, -d, e, f, -g, f * 0 + h, i];   // F·M·F with F = diag(1,-1,-1): flips the sign of the off-diagonal blocks
  const t = M[0] + M[4] + M[8]; let q;
  if (t > 0) { const s = Math.sqrt(t + 1) * 2; q = [(M[7] - M[5]) / s, (M[2] - M[6]) / s, (M[3] - M[1]) / s, 0.25 * s]; }
  else if (M[0] > M[4] && M[0] > M[8]) { const s = Math.sqrt(1 + M[0] - M[4] - M[8]) * 2; q = [0.25 * s, (M[1] + M[3]) / s, (M[2] + M[6]) / s, (M[7] - M[5]) / s]; }
  else if (M[4] > M[8]) { const s = Math.sqrt(1 + M[4] - M[0] - M[8]) * 2; q = [(M[1] + M[3]) / s, 0.25 * s, (M[5] + M[7]) / s, (M[2] - M[6]) / s]; }
  else { const s = Math.sqrt(1 + M[8] - M[0] - M[4]) * 2; q = [(M[2] + M[6]) / s, (M[5] + M[7]) / s, 0.25 * s, (M[3] - M[1]) / s]; }
  return q.map(v => +v.toFixed(5)); }
function readSet(file) { const rows = []; for (const l of fs.readFileSync(path.join(root, 'ldraw/models', file), 'utf8').split(/\r?\n/)) { const m = l.match(/^1\s+(\d+)\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)\s+((?:-?[\d.eE+-]+\s+){9})(.+?)\s*$/); if (!m) continue; const id = m[6].replace(/^parts\//i, '').replace(/\.dat$/i, '').toLowerCase(); if (/[\/\\]/.test(id)) continue; rows.push({ part: id, color: +m[1], x: +m[2], y: +m[3], z: +m[4], m: m[5].trim().split(/\s+/).map(Number) }); } return rows; }
function toPlate(rows, cx, cz, floor) { return rows.map((r, i) => { const q = quatOf(r.m), ident = q[3] > 0.99999; return { id: 's' + i, part: r.part, color: r.color, x: Math.round(r.x - cx), y: Math.round(floor - r.y), z: Math.round(-(r.z - cz)), r: 0, ...(ident ? {} : { q }) }; }); }
const HALF = 400;
function presetsOf(c) {
  const rows = readSet(c.set + '.mpd'); if (!rows.length) return [];
  const xs = rows.map(r => r.x), zs = rows.map(r => r.z), floor = Math.max(...rows.map(r => r.y)), w = Math.max(...xs) - Math.min(...xs), d = Math.max(...zs) - Math.min(...zs), cx = (Math.max(...xs) + Math.min(...xs)) / 2, cz = (Math.max(...zs) + Math.min(...zs)) / 2;
  const prog = SCENES[c.key], actors = prog ? prog.actors.filter(a => !a.crowd).map(a => ({ kind: 'citizen', x: Math.round(a.x * 16), y: 0, z: Math.round(-a.z * 16), heading: a.heading || 0 })) : [];
  const think = (prog ? prog.story.description + ' Why: ' + prog.story.why + '. Direction: ' + prog.story.direction + '.' : 'Not yet shot.') + ' Beats: ' + c.beats.join(', ') + '. Cast: ' + c.cast.join(', ') + '.' + (prog && prog.part ? ' The part to take: ' + prog.part + '.' : '') + (c.note ? ' ' + c.note : '');
  const one = (id, name, ox, oz, subset, zone) => { const parts = toPlate(subset, ox, oz, floor).filter(p => Math.abs(p.x) <= HALF && Math.abs(p.z) <= HALF && p.y >= -100 && p.y <= 700); const acts = [];   /* the app refuses a character standing on any part, and every set has a floor: the cast is named in the description and stands in the film */ return { id, name, description: think + (zone ? ' Zone: ' + zone + ' of a set ' + Math.round(w / 20) + ' by ' + Math.round(d / 20) + ' studs; the film stands on the whole.' : '') + ' ' + parts.length + ' parts.', parts, actors: acts, source: c.source, film: c.key }; };
  if (w <= 2 * HALF && d <= 2 * HALF) return [one(c.key, c.name, cx, cz, rows, null)];
  const outs = [one(c.key, c.name + ' (centre)', cx, cz, rows, 'the centre')]; const nx = Math.ceil(w / (2 * HALF)), nz = Math.ceil(d / (2 * HALF));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const ox = Math.min(...xs) + HALF + i * 2 * HALF, oz = Math.min(...zs) + HALF + j * 2 * HALF; const sub = rows.filter(r => Math.abs(r.x - ox) <= HALF && Math.abs(r.z - oz) <= HALF); if (sub.length < 8) continue; const zone = (j === 0 ? 'north' : j === nz - 1 ? 'south' : 'middle') + ' ' + (i === 0 ? 'west' : i === nx - 1 ? 'east' : 'centre'); outs.push(one(c.key + '-' + i + j, c.name + ' (' + zone + ')', ox, oz, sub, zone)); }
  return outs;
}
const presets = CASES.flatMap(presetsOf);
/* the page */
let html = fs.readFileSync(src, 'utf8'); const bytes0 = html.length;
const need = (re, what) => { if (!re.test(html)) throw new Error('the page has no ' + what); };
need(/base='https:\/\/hartswf0\.github\.io\/tractor-dce-gyo\/ldraw\/'/, 'library base'); html = html.replace(/base='https:\/\/hartswf0\.github\.io\/tractor-dce-gyo\/ldraw\/'/, "base=new URL('../ldraw/',location.href).href");
const colStart = html.indexOf('COLORS=[{code:19,hex:0xd7ba8c}'); if (colStart < 0) throw new Error('the page has no colour table'); const colEnd = html.indexOf(']', colStart); const have = new Set([...html.slice(colStart, colEnd).matchAll(/code:(\d+)/g)].map(m => +m[1]));
const extra = Object.entries(LDC).filter(([c]) => !have.has(+c)).map(([c, hex]) => `{code:${c},hex:0x${hex.toString(16).padStart(6, '0')}}`).join(',');
html = html.slice(0, colEnd) + ',' + extra + html.slice(colEnd);
html = html.replace(/COLORS\.map\(/, 'COLORS.slice(0,7).map(').replace(/COLORS\.forEach\(/, 'COLORS.slice(0,7).forEach(');   // the picker keeps its seven swatches
const idxStart = html.indexOf('<script data-butter-module="movieator-index">'); if (idxStart < 0) throw new Error('no movieator index'); const idxEnd = html.indexOf('</script>', idxStart); const idxText = html.slice(idxStart, idxEnd); const known = new Set([...idxText.matchAll(/"id":\s*"([^"]+)"/g)].map(m => m[1]));
const used = new Map(); for (const p of presets) for (const r of p.parts) if (!known.has(r.part) && !used.has(r.part)) { let name = r.part; try { name = (fs.readFileSync(path.join(root, 'ldraw/parts', r.part + '.dat'), 'utf8').split(/\r?\n/)[0] || '').replace(/^0\s*/, '').trim() || r.part; } catch (e) { name = r.part + ' (not in the library)'; } used.set(r.part, name); }
const close = idxText.lastIndexOf(']'); if (close < 0) throw new Error('index shape'); const add = [...used].map(([id, name]) => JSON.stringify({ id, name, category: 'Scene' })).join(',');
html = html.slice(0, idxStart) + idxText.slice(0, close) + (used.size ? ',' + add : '') + idxText.slice(close) + html.slice(idxEnd);
const preStart = html.indexOf('window.ButterScenePresets=['); if (preStart < 0) throw new Error('no presets'); const preEnd = html.indexOf('\n];</script>', preStart); if (preEnd < 0) throw new Error('presets end');
html = html.slice(0, preEnd) + ',\n' + presets.map(p => JSON.stringify(p)).join(',\n') + html.slice(preEnd);
need(/\$\('#scenePreset'\)\.onchange=describe;describe\(\);/, 'scene picker'); html = html.replace(/\$\('#scenePreset'\)\.onchange=describe;describe\(\);/, "$('#scenePreset').onchange=describe;describe();{const want=new URLSearchParams(location.search).get('scene');if(want&&ButterScenePresets.some(s=>s.id===want)){$('#scenePreset').value=want;describe();setTimeout(()=>$('#sceneLoad').click(),1200);}}");
html = html.replace(/<title>[^<]*<\/title>/, '<title>The scenes in Hand Butter</title>');
fs.mkdirSync(path.dirname(path.join(root, out)), { recursive: true }); fs.writeFileSync(path.join(root, out), html);
console.log(`${out}: ${presets.length} presets from ${CASES.length} cases (${presets.map(p => p.id + ':' + p.parts.length).join(' ')}), ${used.size} parts added to the index, ${Object.keys(LDC).length - have.size} colours added, ${(html.length / 1e6).toFixed(1)} MB (was ${(bytes0 / 1e6).toFixed(1)})`);
