#!/usr/bin/env node
/* tools/foundry/compare.js — two manifests, the same kernel, the promotion contract.
   Deterministic gates first: both pass the canaries, their genes differ (one gene at a time is the honest experiment), the kernel is the same.
   Then, with --live and OPENAI_API_KEY, paired trials: each held-out brief asked under both manifests (one design call each, the same brief, no review), judged by the kernel, within a token ceiling.
   The verdict is NOT_YET unless every gate has evidence; a manifest never promotes itself.
   node tools/foundry/compare.js A.json B.json [--briefs briefs.txt] [--live] [--ceiling 200000] [--model gpt-5.6-sol] [--effort medium] */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'); const L = require('./lib.js');
const args = process.argv.slice(2), files = args.filter(a => !a.startsWith('--') && !(args[args.indexOf(a) - 1] || '').startsWith('--')), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; }, flag = k => args.includes('--' + k);
if (files.length < 2) { console.error('usage: node tools/foundry/compare.js A.json B.json [--briefs briefs.txt] [--live] [--ceiling tokens]'); process.exit(2); }
const [A, B] = files; const briefs = fs.readFileSync(opt('briefs', path.join(__dirname, 'briefs.txt')), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const gates = []; const gate = (name, ok, detail) => { gates.push({ name, ok, detail }); console.log(`${ok === null ? 'MISSING' : ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`); };
const canary = file => { try { execFileSync(process.execPath, [path.join(__dirname, 'canaries.js'), '--manifest', file], { stdio: 'pipe' }); return true; } catch (e) { return false; } };
const mA = L.useManifest(A), mB = L.useManifest(B);
gate('same kernel', mA.kernel === mB.kernel, `${mA.kernel} / ${mB.kernel}`);
const gA = L.readJson(A).genes || {}, gB = L.readJson(B).genes || {}, changed = ['rules', 'demos', 'plan', 'router', 'selector'].filter(k => JSON.stringify(gA[k] || null) !== JSON.stringify(gB[k] || null));
gate('one gene changed', changed.length === 1, changed.length ? `changed: ${changed.join(', ')}` : 'the manifests are the same');
gate('canaries under A', canary(A)); gate('canaries under B', canary(B));
let live = null;
if (flag('live')) {
  const key = process.env.OPENAI_API_KEY; if (!key) { gate('paired trials', null, 'no OPENAI_API_KEY'); }
  else {
    const ceiling = +opt('ceiling', 200000); let spent = 0; live = { A: [], B: [] };
    (async () => {
      for (const brief of briefs) for (const [arm, file] of [['A', A], ['B', B]]) {
        if (spent >= ceiling) break; L.useManifest(file); L.Ai.endpoint = 'https://api.openai.com/v1/responses';
        try { const out = await L.Ai.requestSafely(L.Ai.userMessage(brief, {}), { key, stage: 'trial', detail: brief, effort: opt('effort', 'medium') }); const j = L.judge(out.program); const u = out.j.usage || {}; spent += u.total_tokens || 0; live[arm].push({ brief, cls: j.cls, quality: j.quality, residual: j.residual, tokens: u.total_tokens || 0, ms: out.ms }); console.log(`${arm} "${brief}": ${j.cls} · quality ${j.quality.toFixed(1)} · ${j.residual.committed} stood · ${u.total_tokens || 0} tokens`); }
        catch (e) { live[arm].push({ brief, cls: 'error', quality: -1e9, error: e.message }); console.log(`${arm} "${brief}": error ${e.message}`); }
      }
      verdict();
    })(); 
  }
} else { gate('paired trials', null, `not run (pass --live with OPENAI_API_KEY; ${briefs.length} held-out briefs ready)`); verdict(); }
function verdict() {
  if (live) { const pairs = briefs.map(b => [live.A.find(x => x.brief === b), live.B.find(x => x.brief === b)]).filter(([a, b]) => a && b); const wins = pairs.filter(([a, b]) => b.quality > a.quality + 1).length, losses = pairs.filter(([a, b]) => a.quality > b.quality + 1).length; const valid = arm => live[arm].filter(x => x.cls === 'ok' || x.cls === 'residual').length; const tok = arm => live[arm].reduce((n, x) => n + (x.tokens || 0), 0);
    console.log(`vector A: valid ${valid('A')}/${live.A.length} · tokens ${tok('A')}   vector B: valid ${valid('B')}/${live.B.length} · tokens ${tok('B')}`);
    gate('paired trials', pairs.length >= 8 ? wins > losses + 1 : null, `${pairs.length} pairs · B wins ${wins} · loses ${losses}${pairs.length < 8 ? ' · fewer than 8 pairs' : ''}`); }
  gate('repeated seeds', null, 'each brief needs three or more paired runs before an interval means anything');
  gate('blind recognition', null, 'no vision judge has named the builds from their renders');
  gate('human preference', null, 'no pairwise choices recorded');
  gate('situated tests', null, 'no receipts of the builds standing in the world (doors reached, rides driven)');
  const missing = gates.filter(g => g.ok === null).map(g => g.name), failed = gates.filter(g => g.ok === false).map(g => g.name);
  console.log(failed.length ? `verdict: REFUSED · failed: ${failed.join(', ')}` : missing.length ? `verdict: NOT_YET · missing: ${missing.join(', ')}` : 'verdict: PROMOTABLE · a person still records the decision (commit world/manifest.json)');
  process.exit(failed.length ? 1 : 0);
}
