#!/usr/bin/env node
/* tools/forage/packs.js — every part the Odyssey cards use, packed with everything it needs, so a viewer loads a part in one
   request and never guesses: the LDraw loader looks each sub-file up in its cache before it tries the network, and it tries
   folder after folder (parts/, p/, models/ ...) when it has to guess, which for a nineteen-part minifigure was 274 requests,
   145 of them 404s. A pack is { "<cache key>": "<file text>" } for the part and every sub-part and primitive under it, the
   keys as the loader forms them (lower case, backslashes as slashes, s/ under parts/, 48/ under p/).

   node tools/forage/packs.js            writes odyssey/packs/<part>.json for every part in odyssey/cards/*.mpd, and
                                          odyssey/packs/index.json: { part: [pack bytes, files] } */
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./ldraw.js');
const ROOT = L.ROOT, OUT = path.join(ROOT, 'odyssey/packs');
const keyOf = ref => { let k = ref.trim().replace(/\\/g, '/').toLowerCase(); if (k.startsWith('s/')) k = 'parts/' + k; else if (k.startsWith('48/')) k = 'p/' + k; return k; };
const textCache = new Map();
function textOf(ref) { const f = L.fileFor(ref.replace(/\\/g, '/')); if (!f) return null; if (!textCache.has(f)) textCache.set(f, fs.readFileSync(f, 'utf8')); return textCache.get(f); }
/** The part and its whole tree, keyed as the loader keys its cache. */
function pack(part) {
  const out = {}, seen = new Set(), stack = [part + '.dat'];
  while (stack.length) {
    const ref = stack.pop(), key = keyOf(ref); if (seen.has(key)) continue; seen.add(key);
    const text = textOf(ref); if (text == null) continue; out[key] = text;
    for (const l of text.split(/\r?\n/)) { const t = l.trim().split(/\s+/); if (t[0] === '1' && t.length >= 15) stack.push(t.slice(14).join(' ')); }
  }
  return out;
}
if (require.main === module) {
  fs.mkdirSync(OUT, { recursive: true });
  const parts = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, 'odyssey/cards'))) for (const l of fs.readFileSync(path.join(ROOT, 'odyssey/cards', f), 'utf8').split('\n')) { const t = l.trim().split(/\s+/); if (t[0] === '1' && t.length >= 15) { const r = t.slice(14).join(' ').toLowerCase(); if (r.endsWith('.dat')) parts.add(r.replace(/\.dat$/, '')); } }
  const index = {}; let bytes = 0;
  for (const p of [...parts].sort()) { if (!L.exists(p)) continue; const pk = pack(p), s = JSON.stringify(pk); fs.writeFileSync(path.join(OUT, p.replace(/\//g, '_') + '.json'), s); index[p] = [s.length, Object.keys(pk).length]; bytes += s.length; }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
  console.log(`${Object.keys(index).length} part packs, ${(bytes / 1e6).toFixed(1)} MB, largest ${Object.entries(index).sort((a, b) => b[1][0] - a[1][0]).slice(0, 3).map(([k, v]) => k + ' ' + (v[0] / 1e3).toFixed(0) + ' kB').join(', ')}`);
}
module.exports = { pack, keyOf };
