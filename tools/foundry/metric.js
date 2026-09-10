#!/usr/bin/env node
/* tools/foundry/metric.js — one program judged under the kernel: stdin {program, manifest?} → stdout {report, residual, class, route, quality, audit}. The DSPy track's metric calls this per candidate. */
'use strict';
const L = require('./lib.js');
let raw = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', c => raw += c); process.stdin.on('end', () => {
  let input; try { input = JSON.parse(raw || '{}'); } catch (e) { console.log(JSON.stringify({ error: 'bad JSON: ' + e.message })); process.exit(2); }
  if (input.manifest) L.useManifest(input.manifest);
  const program = input.program || (typeof input.text === 'string' ? (() => { try { return JSON.parse(input.text); } catch (e) { const m = input.text.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch (x) { return null; } } })() : null);
  if (!program || !Array.isArray(program.ops)) { console.log(JSON.stringify({ error: 'no program', class: 'broken', quality: -1e9 })); return; }
  const j = L.judge(program); const { res, ...rest } = j; console.log(JSON.stringify({ ...rest, class: j.cls, report: { ...j.report, dropped: undefined }, plan: input.plan ? L.Dsl.checkPlan(input.plan, res) : undefined }));
});
