#!/usr/bin/env node
/* tools/odyssey-mobile-bake.js — the geometry bank of the one-file mobile build (tools/odyssey-mobile.js).

   Every LDraw part the phone game can show — the parts of the 102 scene cards of the Regulars' Cut, the level sets and
   props, the minifig parts of the cast — resolved here from this repository's ldraw/ library into triangles once, so the
   phone never fetches the library:
     LITE      circular primitives come from p/8/ (8 segments) when the library has them; stud logos and the underside
               tubes and hollows (stud3, stud4…, the parts' inner sides nobody sees from above) are dropped; lines are not drawn.
     COLOUR    triangles of the part's main colour (16) are one group, coloured per placement; printed and fixed-colour
               triangles a second group with a palette index per vertex.
     FRAME     Hand Butter's catalog frame (x, maxY − y, −z: y up, the part's bottom at 0), with the part's maxY kept so the
               minifig rig can rebuild the LDraw frame it mounts in.
     PACKING   positions quantised to 1/16 LDU (int16), vertices shared within a group, uint16/uint32 indices.
   Writes a gzip of one binary buffer: [u32 header length][header JSON][data], the header naming each part's byte ranges,
   and carrying the scene cards' rows and the small JSON the game fetches (story, levels, keyframes, previs).
   Usage: node tools/odyssey-mobile-bake.js [--out play/odyssey-game/mobile-bank.bin.gz] */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..'), LIB = path.join(ROOT, 'ldraw'), GAME = path.join(ROOT, 'play/odyssey-game');
const args = process.argv.slice(2); let out = path.join(GAME, 'mobile-bank.bin.gz'); for (let i = 0; i < args.length; i++) if (args[i] === '--out') out = path.resolve(args[++i]);

/* ── colours ── */
const LDC = {}; for (const l of fs.readFileSync(path.join(LIB, 'LDConfig.ldr'), 'utf8').split(/\r?\n/)) { const m = l.match(/^0 !COLOUR\s+\S+\s+CODE\s+(\d+)\s+VALUE\s+#([0-9A-Fa-f]{6})/); if (m) LDC[+m[1]] = parseInt(m[2], 16); }
const palette = [], palIdx = new Map(); const pal = hex => { if (!palIdx.has(hex)) { palIdx.set(hex, palette.length); palette.push(hex); } return palIdx.get(hex); };
const colourHex = c => { if (typeof c === 'string' && c.startsWith('0x2')) return parseInt(c.slice(3), 16); return LDC[c] ?? 0x888888; };

/* ── the library, LITE ── */
const SKIP = /^(logo\d*|stud-logo\d*|stud3[a-z]*|stud4[a-z0-9]*|\d+-\d+stud4[a-z0-9]*|stud6[a-z]*|stud10|stud12|stud16|stud17[a-z]*|stud18a|stud22a|stud21a|filstud3|mstud3|mstud4|4-4ring\d+)\.dat$/;
const norm = s => s.trim().replace(/\\/g, '/').toLowerCase();
function fileFor(ref) {
  let id = norm(ref); if (!id.endsWith('.dat') && !id.endsWith('.ldr')) id += '.dat';
  const base = path.basename(id); if (SKIP.test(base)) return 'SKIP';
  const tries = id.startsWith('s/') ? [['parts', id]] : id.startsWith('48/') ? [['p', '8/' + id.slice(3)], ['p', id]] : id.startsWith('8/') ? [['p', id]] : [['p', '8/' + id], ['parts', id], ['p', id], ['parts', 's/' + id]];
  for (const [dir, rel] of tries) { const f = path.join(LIB, dir, rel); if (fs.existsSync(f)) return f; }
  return null;
}
const cache = new Map(); let missing = new Set();
/** a file's triangles in its own frame: [{v: [9 numbers], c: code}] with code 16 = inherit */
function tris(file) {
  if (cache.has(file)) return cache.get(file); const outT = []; cache.set(file, outT);
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const a = line.trim().split(/\s+/); if (!a[0]) continue; const t = a[0];
    if (t === '3' || t === '4') { const c = a[1], n = a.slice(2).map(Number); if (n.some(x => !Number.isFinite(x))) continue; const col = /^\d+$/.test(c) ? +c : c;
      if (col === 24) continue; outT.push({ v: n.slice(0, 9), c: col }); if (t === '4') outT.push({ v: [...n.slice(0, 3), ...n.slice(6, 12)], c: col }); }
    else if (t === '1' && a.length >= 15) { const c = a[1], col = /^\d+$/.test(c) ? +c : c, m = a.slice(2, 14).map(Number), ref = a.slice(14).join(' '); const f = fileFor(ref); if (f === 'SKIP') continue; if (!f) { missing.add(ref); continue; }
      const [x, y, z, A, B, C, D, E, F, G, H, I] = m, sub = tris(f);
      for (const s of sub) { const v = s.v, w = new Array(9); for (let k = 0; k < 9; k += 3) { const px = v[k], py = v[k + 1], pz = v[k + 2]; w[k] = x + A * px + B * py + C * pz; w[k + 1] = y + D * px + E * py + F * pz; w[k + 2] = z + G * px + H * py + I * pz; }
        outT.push({ v: w, c: s.c === 16 ? col : s.c }); } }
  }
  return outT;
}
/* ── what the phone needs ── */
const story = JSON.parse(fs.readFileSync(path.join(GAME, 'story.json'), 'utf8'));
const sceneIds = new Set(); for (const b of story.books) for (const it of b.items) { if (it.type === 'scene') sceneIds.add(it.id); if (it.type === 'level') it.covers.forEach(c => sceneIds.add(c.id)); }
const propCards = ['prop.shipbuilding-tool-set', 'environment.fire-and-dry-logs', 'prop.olive-tree-marriage-bed'];
const cards = {}; for (const id of [...sceneIds, ...propCards]) cards[id] = JSON.parse(fs.readFileSync(path.join(ROOT, 'odyssey/butter', id + '.json'), 'utf8')).parts;
const want = new Set();
for (const rows of Object.values(cards)) for (const p of rows) want.add(p.part);
const levelSrc = fs.readdirSync(path.join(GAME, 'levels')).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(GAME, 'levels', f), 'utf8')).join('\n') + fs.readFileSync(path.join(GAME, 'engine.js'), 'utf8');
for (const m of levelSrc.matchAll(/'(\d{4,5}[a-z0-9]*)'/g)) want.add(m[1]);
for (const p of ['3001', '3002', '3003', '3004', '3005', '3008', '3009', '3010', '3020', '3021', '3022', '3023', '3024', '3032', '3039', '3062b', '3068b', '3941', '87621', '3816', '3817', '3815', '973', '3818', '3819', '3820', '3626b', '3626bp01', '3626bp35', '3626bp40', '3901', '3896', '4497', '4499']) want.add(p);
/* ── bake ── */
const Q = 16, parts = [], chunks = []; let off = 0;
const push = arr => { const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - (off % 4)) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); off += pad; } const at = off; chunks.push(buf); off += buf.length; return at; };
let bad = 0, triCount = 0;
for (const id of [...want].sort()) {
  const f = fileFor(id); if (!f || f === 'SKIP') { bad++; continue; }
  const T = tris(f); if (!T.length) { bad++; continue; }
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const t of T) for (let k = 0; k < 9; k += 3) { const x = t.v[k], y = t.v[k + 1], z = t.v[k + 2]; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; if (z < minZ) minZ = z; if (z > maxZ) maxZ = z; }
  if (Math.max(Math.abs(minX), Math.abs(maxX), Math.abs(maxY - minY), Math.abs(minZ), Math.abs(maxZ)) * Q > 32000) { bad++; continue; }
  const groups = { main: { map: new Map(), pos: [], col: [], idx: [] }, fix: { map: new Map(), pos: [], col: [], idx: [] } };
  for (const t of T) { const main = t.c === 16, g = main ? groups.main : groups.fix, ci = main ? 0 : pal(colourHex(t.c));
    for (let k = 0; k < 9; k += 3) { const qx = Math.round(t.v[k] * Q), qy = Math.round((maxY - t.v[k + 1]) * Q), qz = Math.round(-t.v[k + 2] * Q), key = qx + ',' + qy + ',' + qz + ',' + ci; let i = g.map.get(key); if (i == null) { i = g.pos.length / 3; g.map.set(key, i); g.pos.push(qx, qy, qz); g.col.push(ci); } g.idx.push(i); } }
  const rec = { id, h: +(maxY - minY).toFixed(3), offY: +maxY.toFixed(3), b: [minX, maxX, -maxZ, -minZ].map(v => +v.toFixed(3)) };
  for (const k of ['main', 'fix']) { const g = groups[k]; if (!g.idx.length) continue; const nv = g.pos.length / 3, I = nv > 65535 ? Uint32Array : Uint16Array;
    rec[k] = { nv, ni: g.idx.length, i32: I === Uint32Array, p: push(Int16Array.from(g.pos)), i: push(I.from(g.idx)), ...(k === 'fix' ? { c: push(Uint8Array.from(g.col)) } : {}) }; triCount += g.idx.length / 3; }
  parts.push(rec);
}
/* ── the header: parts, palette, cards (rows compact), and the JSON the game fetches ── */
const pIndex = new Map(parts.map((p, i) => [p.id, i]));
const compact = {}; for (const [id, rows] of Object.entries(cards)) compact[id] = rows.filter(p => pIndex.has(p.part)).map(p => [p.part, p.color, p.x, p.y, p.z, p.q ? p.q.map(v => +v.toFixed(5)) : (p.r || 0)]);
const files = {};
const addJSON = (key, file) => { if (fs.existsSync(file)) files[key] = JSON.parse(fs.readFileSync(file, 'utf8')); };
addJSON('odyssey-game/story.json', path.join(GAME, 'story.json')); addJSON('odyssey-game/voice/lines.json', path.join(GAME, 'voice/lines.json'));
for (const f of fs.readdirSync(path.join(GAME, 'levels'))) if (f.endsWith('.json')) addJSON('odyssey-game/levels/' + f, path.join(GAME, 'levels', f));
for (const id of sceneIds) { addJSON('../odyssey/keyframes/' + id + '.json', path.join(ROOT, 'odyssey/keyframes', id + '.json')); addJSON('../odyssey/previs/' + id + '.json', path.join(ROOT, 'odyssey/previs', id + '.json')); }
const header = Buffer.from(JSON.stringify({ version: 1, q: Q, palette, parts, cards: compact, files }), 'utf8');
const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32LE(header.length); const pad = (4 - ((4 + header.length) % 4)) % 4;
const bin = Buffer.concat([lenBuf, header, Buffer.alloc(pad), ...chunks]);
const gz = zlib.gzipSync(bin, { level: 9 });
fs.writeFileSync(out, gz);
console.log(`${path.relative(ROOT, out)}: ${parts.length} parts (${bad} unavailable), ${Math.round(triCount / 1000)}k triangles, ${Object.keys(cards).length} cards, ${Object.keys(files).length} files; raw ${(bin.length / 1e6).toFixed(1)} MB, gzip ${(gz.length / 1e6).toFixed(1)} MB${missing.size ? '; subfiles missing from the library: ' + [...missing].slice(0, 8).join(' ') : ''}`);
