#!/usr/bin/env node
/* tools/donor-pack.js — a donor model with every part it needs inlined, so the page's loader parses it without a
   single fetch (the way assembly-paths/<kit>-full.mpd.txt packs a kit).

   The loader (examples/js/loaders/LDrawLoader.js, r128) keeps an MPD's `0 FILE` blocks in a cache keyed by the
   block's name in lower case, and looks a reference up by the reference string itself in lower case, after
   rewriting `s/x.dat` to `parts/s/x.dat` and `48/x.dat` to `p/48/x.dat`. So a block is named exactly as the lines
   refer to it: `6021.dat` for a part referenced plainly, `parts/3032.dat` for one referenced with its folder,
   `4-4cyli.dat` for a primitive, `parts/s/6021s01.dat` for a sub-part. The same file referenced two ways is
   inlined under both names. Every type-1 line's reference is lower-cased in the pack. A reference the library does
   not carry is listed at the end as a comment and left out; the loader then drops that piece and keeps the rest.

   Usage: node tools/donor-pack.js "<model file in ldraw/models>" ...   → ldraw/models/<file without .mpd>-full.mpd.txt */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), LIB = path.join(root, 'ldraw');
const index = new Map();   // lower-case relative path under ldraw → real relative path
for (const [dir, prefix] of [['parts', 'parts/'], ['parts/s', 'parts/s/'], ['p', 'p/'], ['p/48', 'p/48/'], ['p/8', 'p/8/']]) {
  const d = path.join(LIB, dir); if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) if (/\.dat$/i.test(f)) index.set((prefix + f).toLowerCase(), prefix + f);
}
/** The loader's own rewrite of a reference, then the library paths it could mean. */
const canon = ref => { let r = ref.trim().replace(/\\/g, '/').toLowerCase(); if (r.startsWith('s/')) r = 'parts/' + r; else if (r.startsWith('48/') || r.startsWith('8/')) r = 'p/' + r; return r; };
const lookup = key => { for (const k of [key, 'parts/' + key, 'p/' + key]) if (index.has(k)) return index.get(k); return null; };
const refLines = text => { const out = []; for (const line of text.split(/\r?\n/)) { const m = line.match(/^(1\s+\S+(?:\s+-?[\d.eE+-]+){12}\s+)(.+?)\s*$/); if (m) out.push(m[2]); } return out; };
const lowerRefs = text => text.split(/\r?\n/).map(line => { const m = line.match(/^(1\s+\S+(?:\s+-?[\d.eE+-]+){12}\s+)(.+?)\s*$/); return m ? m[1] + m[2].replace(/\\/g, '/').toLowerCase() : line; }).join('\n');
/** A reference the model answers itself: its own `0 FILE` names, plain or with the s/ folder the loader adds. */
const ownSub = (subs, key) => subs.has(key) || subs.has(key.replace(/^parts\/s\//, 's/')) || subs.has(key.replace(/^parts\/s\//, '')) || subs.has(key.replace(/^parts\//, ''));
/** The lines of a block with every reference the pack cannot answer taken out: the loader would otherwise try the network for it, fail, and never finish. */
const strip = (text, ok) => { let dropped = 0; const out = text.split(/\r?\n/).filter(line => { const m = line.match(/^1\s+\S+(?:\s+-?[\d.eE+-]+){12}\s+(.+?)\s*$/); if (!m) return true; if (ok(canon(m[1]))) return true; dropped++; return false; }); return { text: out.join('\n'), dropped }; };
function pack(file) {
  const src = path.join(root, 'ldraw', 'models', file), text = lowerRefs(fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n'));
  const subs = new Set(); for (const m of text.matchAll(/^0\s+FILE\s+(.+)$/gim)) subs.add(m[1].trim().toLowerCase());
  const blocks = new Map(), missing = new Set(), queue = refLines(text);
  while (queue.length) { const ref = queue.shift(), key = canon(ref); if (ownSub(subs, key) || blocks.has(key) || missing.has(key)) continue;
    const rel = lookup(key); if (!rel) { missing.add(key); continue; }
    const t = lowerRefs(fs.readFileSync(path.join(LIB, rel), 'utf8').replace(/\r\n/g, '\n')); blocks.set(key, t);
    for (const r of refLines(t)) { const k = canon(r); if (!ownSub(subs, k) && !blocks.has(k) && !missing.has(k)) queue.push(r); } }
  const ok = key => ownSub(subs, key) || blocks.has(key); let dropped = 0;
  /* every block needs a `0 !LDRAW_ORG` type line: the loader leaves a typeless block's geometry null and throws when it finalises it */
  const typed = block => { const lines = block.split('\n'); if (lines.some(l => /^0\s+!LDRAW_ORG\b/i.test(l))) return block; const i = lines[0].startsWith('0 FILE ') ? 1 : 0; lines.splice(i, 0, '0 !LDRAW_ORG Unofficial_Model'); return lines.join('\n'); };
  const withHeaders = t => t.split(/\n(?=0 FILE )/).map(typed).join('\n');
  const main = strip(text, ok); dropped += main.dropped; const out = [withHeaders(main.text.trim())];
  for (const [key, t] of blocks) { const b = strip(t, ok); dropped += b.dropped; out.push(typed(`0 FILE ${key}\n${b.text.trim()}`)); }
  if (missing.size) out.push('0 // not in the library, their lines left out: ' + [...missing].join(' '));
  const dest = path.join(root, 'ldraw', 'models', file.replace(/\.mpd$/i, '') + '-full.mpd.txt'); const joined = out.join('\n\n') + '\n'; fs.writeFileSync(dest, joined);
  return { file, blocks: blocks.size, missing: [...missing], dropped, bytes: joined.length };
}
const files = process.argv.slice(2); if (!files.length) { console.error('usage: node tools/donor-pack.js "<model file>" ...'); process.exit(1); }
for (const f of files) { const r = pack(f); console.log(`${r.file}: ${r.blocks} blocks inlined, ${(r.bytes / 1024).toFixed(0)} KB${r.missing.length ? ', ' + r.missing.length + ' references not in the library, ' + r.dropped + ' lines left out (' + r.missing.slice(0, 4).join(' ') + ')' : ''}`); }
