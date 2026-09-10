/* tools/foundry/lib.js — the builder's kernel in node: the DSL compiler and the prompt's genes, loaded the way the page loads them, so a manifest can be judged without a browser. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
if (typeof global.window === 'undefined') global.window = global;
if (typeof global.localStorage === 'undefined') { const mem = {}; global.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } }; }
require(path.join(ROOT, 'world', 'dsl.js')); require(path.join(ROOT, 'world', 'ai.js'));
const Dsl = global.Dsl, Ai = global.Ai;

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
/** A manifest file's genes set as the current genes; returns the manifest report (hashes, source). */
function useManifest(file) { if (!file) { Ai.setGenes(null, 'built-in'); return Ai.manifest(); } const j = readJson(file); Ai.setGenes(j.genes || j, `${path.basename(file)} (${j.name || 'manifest'})`); return { ...Ai.manifest(), name: j.name || path.basename(file) }; }
/** Receipts as the page exports them ({kind: 'world.receipts', receipts: [...]}) or a bare array. */
function readReceipts(file) { const j = readJson(file); return Array.isArray(j) ? j : (j.receipts || []); }
/** The compile, its residual and its class: ok, residual (something attempted did not stand), empty (nothing stood), broken (unknown ops or errors). */
function judge(program) {
  const res = Dsl.compile(program || { ops: [] }), r = res.report, flat = Dsl.flatOps((program && program.ops) || []);
  const residual = { attempted: flat.length, ran: r.ops, committed: r.pieces + r.props, pieces: r.pieces, props: r.props, unknown: r.unknown.length, errors: r.errors.length, floating: r.floating, blocked: r.blocked, vanished: r.vanished.slice(), groups: r.groups.length };
  const cls = (residual.unknown || residual.errors) ? 'broken' : !residual.committed ? 'empty' : (residual.floating || residual.blocked || residual.vanished.length) ? 'residual' : 'ok';
  return { res, report: r, residual, cls, route: Ai.route(r), quality: Ai.quality(program, res), audit: Ai.audit(program, res) };
}
/** A receipt's failure class from what stood and what the person did next: none, empty, broken, residual, discarded (fast), reworked (changed twice or more), unchosen (the review lost to the first design). */
function failureOf(rec) {
  if (rec.error) return /max_output|output room/i.test(rec.error) ? 'ran-out' : 'error';
  const j = rec.program ? judge(rec.program) : null; if (!j || j.cls === 'empty') return 'empty'; if (j.cls === 'broken') return 'broken'; if (j.cls === 'residual') return 'residual';
  const after = rec.after || [], acts = after.map(a => a.act);
  if (acts[0] === 'discarded' && after[0].dt < 30) return 'discarded';
  if (acts.filter(a => a === 'changed').length >= 2) return 'reworked';
  return 'none';
}
const fnv = str => { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
module.exports = { ROOT, Dsl, Ai, readJson, useManifest, readReceipts, judge, failureOf, fnv, casesDir: path.join(__dirname, 'cases') };
