#!/usr/bin/env node
/* tools/foundry/canaries.js — the failed builds as cases a manifest must not regress on.
   A case (tools/foundry/cases/*.json) is {name, brief, program, expect: {class, route}} or a pair {name, better, worse}: the selector under the manifest must rank better above worse.
   node tools/foundry/canaries.js [--manifest file] [--cases dir] [--receipts file]  — receipts add every failed receipt as a case whose class must stay what it was. Exit 1 on any failure. */
'use strict';
const fs = require('fs'), path = require('path'); const L = require('./lib.js');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const man = L.useManifest(opt('manifest', '')); const dir = opt('cases', L.casesDir);
const cases = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => ({ file: f, ...L.readJson(path.join(dir, f)) }));
if (opt('receipts', '')) for (const rec of L.readReceipts(opt('receipts'))) { const cls = L.failureOf(rec); if (cls !== 'none' && rec.program) cases.push({ file: 'receipt ' + rec.id, name: rec.brief, program: rec.program, expect: { class: L.judge(rec.program).cls } }); }
let pass = 0, fail = 0; const say = (ok, m) => { console.log((ok ? 'PASS ' : 'FAIL ') + m); if (ok) pass++; else fail++; };
console.log(`manifest ${man.source} genes ${man.hash} kernel ${man.kernel} · ${cases.length} cases`);
for (const c of cases) {
  if (c.better && c.worse) { const a = L.judge(c.better), b = L.judge(c.worse); say(a.quality > b.quality, `${c.name}: the selector ranks the better build above the worse (${a.quality.toFixed(1)} vs ${b.quality.toFixed(1)})`); continue; }
  const j = L.judge(c.program), e = c.expect || {}; const okClass = !e.class || e.class === j.cls, okRoute = !('route' in e) || e.route === j.route;
  say(okClass && okRoute, `${c.name}: class ${j.cls}${okClass ? '' : ' (expected ' + e.class + ')'} · route ${j.route || 'none'}${okRoute ? '' : ' (expected ' + (e.route || 'none') + ')'} · ${j.residual.committed} stood of ${j.residual.attempted} ops${j.residual.vanished.length ? ' · vanished ' + j.residual.vanished.join(',') : ''}`);
}
console.log(`canaries pass=${pass} fail=${fail}`); process.exit(fail ? 1 : 0);
