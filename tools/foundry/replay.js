#!/usr/bin/env node
/* tools/foundry/replay.js — every receipt's program compiled again under the current kernel: what drifted since it was built, and the failure classes across the set.
   node tools/foundry/replay.js receipts.json [--manifest file] */
'use strict';
const L = require('./lib.js');
const args = process.argv.slice(2), file = args.find(a => !a.startsWith('--')), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (!file) { console.error('usage: node tools/foundry/replay.js receipts.json [--manifest file]'); process.exit(2); }
const man = L.useManifest(opt('manifest', '')); const recs = L.readReceipts(file); const classes = {}, drift = []; let cost = { calls: 0, tokens: 0, ms: 0, pictures: 0 }, after = {};
for (const rec of recs) {
  const f = L.failureOf(rec); classes[f] = (classes[f] || 0) + 1; for (const a of rec.after || []) after[a.act] = (after[a.act] || 0) + 1;
  if (rec.cost) { cost.calls += rec.cost.calls || 0; cost.tokens += rec.cost.tokens || 0; cost.ms += rec.cost.ms || 0; cost.pictures += rec.cost.pictures || 0; }
  if (!rec.program || !rec.report) continue; const j = L.judge(rec.program), was = rec.report;
  const diff = ['pieces', 'props', 'floating', 'blocked'].filter(k => (was[k] || 0) !== (j.report[k] || 0)).map(k => `${k} ${was[k] || 0} → ${j.report[k]}`);
  if ((was.unknown || []).length !== j.report.unknown.length) diff.push(`unknown ${(was.unknown || []).length} → ${j.report.unknown.length}`);
  if (diff.length) drift.push(`${rec.id} "${rec.brief}" (${rec.manifest && rec.manifest.kernel || '?'} → ${man.kernel}): ${diff.join(', ')}`);
}
console.log(`${recs.length} receipts · kernel now ${man.kernel} · genes ${man.hash}`);
console.log('failures: ' + Object.entries(classes).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log('after: ' + (Object.entries(after).map(([k, v]) => `${k} ${v}`).join(' · ') || 'nothing recorded'));
console.log(`cost: ${cost.calls} calls · ${cost.tokens} tokens · ${(cost.ms / 60000).toFixed(1)} min · ${cost.pictures} pictures`);
console.log(drift.length ? `drift under the current kernel:\n  ${drift.join('\n  ')}` : 'no drift: every program compiles as it did');
