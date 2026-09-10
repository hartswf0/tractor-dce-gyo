#!/usr/bin/env node
/* tools/foundry/demos.js — demonstrations chosen by evidence: receipts whose draft was committed as it came (no change first), with nothing unknown, broken, floating or vanished, of a sensible size, one per subject; written as a candidate manifest.
   node tools/foundry/demos.js receipts.json [--out candidate.json] [--max 7] [--base manifest.json] */
'use strict';
const fs = require('fs'); const L = require('./lib.js');
const args = process.argv.slice(2), file = args.find(a => !a.startsWith('--')), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (!file) { console.error('usage: node tools/foundry/demos.js receipts.json [--out candidate.json] [--max 7] [--base manifest.json]'); process.exit(2); }
const max = +opt('max', 7), base = opt('base', '') ? L.readJson(opt('base')) : { name: 'built-in', genes: {} };
const picked = [], seen = new Set(); let why = [];
for (const rec of L.readReceipts(file).sort((a, b) => a.t - b.t)) {
  const acts = (rec.after || []).map(a => a.act), first = acts.find(a => a !== 'nudged' && a !== 'read' && a !== 'saved');
  if (!rec.program || !rec.brief) { why.push(`${rec.id}: no program`); continue; }
  if (first !== 'committed') { why.push(`${rec.id} "${rec.brief}": ${first ? first + ' first' : 'never committed'}`); continue; }
  const j = L.judge(rec.program); if (j.cls !== 'ok') { why.push(`${rec.id} "${rec.brief}": ${j.cls}`); continue; }
  const n = L.Dsl.flatOps(rec.program.ops).length; if (n < 2 || n > 24) { why.push(`${rec.id} "${rec.brief}": ${n} ops`); continue; }
  const subject = String(rec.program.name || rec.brief).toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ').pop(); if (seen.has(subject)) { why.push(`${rec.id} "${rec.brief}": another ${subject} already chosen`); continue; }
  seen.add(subject); picked.push({ ask: rec.brief, program: { name: rec.program.name || subject, ops: rec.program.ops }, from: rec.id, quality: +j.quality.toFixed(1) });
  if (picked.length >= max) break;
}
const out = { name: `candidate ${new Date().toISOString().slice(0, 10)}`, version: 1, about: `demos chosen from receipts by evidence: committed as they came, nothing lost in the compile, 2 to 24 ops, one per subject (from ${file})`, genes: { ...(base.genes || {}), demos: picked.map(d => ({ ask: d.ask, program: d.program })) } };
console.log(`${picked.length} demos chosen: ${picked.map(d => `"${d.ask}" (quality ${d.quality})`).join(', ') || 'none'}`);
if (why.length) console.log(`passed over:\n  ${why.slice(0, 20).join('\n  ')}${why.length > 20 ? `\n  and ${why.length - 20} more` : ''}`);
if (opt('out', '')) { fs.writeFileSync(opt('out'), JSON.stringify(out, null, 1) + '\n'); console.log(`written: ${opt('out')} (genes ${L.fnv(JSON.stringify(L.Ai.setGenes(out.genes, 'candidate')))})`); }
