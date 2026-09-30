#!/usr/bin/env node
/* tools/perform/perform.js — the performance engine's command line.

   node tools/perform/perform.js author   OD-B01-S03 [--force]   the scene's direction (tools/perform/scenes/<scene>.js) -> the score's
                                                                 authored layer (odyssey/score/<scene>.json); an existing authored
                                                                 layer is kept unless --force (patches edit it in place)
   node tools/perform/perform.js compile  OD-B01-S03             score -> body score (odyssey/score/<scene>.choreo.json) and the
                                                                 score's events; then the measures (metrics, temperatures)
   node tools/perform/perform.js measure  OD-B01-S03 [--sheet f]  metrics and temperatures of a sheet (default: the compiled one;
                                                                 --before: the acted sheet odyssey/choreo/<scene>.json)
   node tools/perform/perform.js why      OD-B01-S03 telemachus 37.6   "why is X moving here?"
   node tools/perform/perform.js homeostat OD-B01-S03             the uniselectors step the compiler's parameters until the four
                                                                 essential variables are in band (the attempts logged)
   node tools/perform/perform.js couple   OD-B09-S09 [--disturb wake-early]   the four-unit coupled homeostat
   node tools/perform/perform.js patch    OD-B01-S03 "make Telemachus more suspicious"
   node tools/perform/perform.js chain    OD-B01-S03             the five-instruction patch chain with its diffs
   node tools/perform/perform.js hardware OD-B01-S03             the stop-motion pose sheet and the servo timeline
   node tools/perform/perform.js previz   OD-B01-S03 [--sheet f] [--name n]   stick-and-box previz through the shot cameras, heat
                                                                 overlay, with the voice (odyssey/perform/media/<name>.mp4)
   Data: odyssey/score/<scene>.json (odyssey-score/1), odyssey/score/<scene>.choreo.json (odyssey-choreo/1). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), SC = path.join(ROOT, 'odyssey/score');
const args = process.argv.slice(2), cmd = args[0], sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const Compile = require('./compile.js'), Score = require('./score.js');
const marksOf = s => J(path.join(ROOT, 'odyssey/choreo/marks', s + '.json'));
const scoreF = s => path.join(SC, s + '.json'), sheetF = s => path.join(SC, s + '.choreo.json');
const r3 = v => Math.round(v * 1000) / 1000;
function save(f, o, pretty) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, pretty ? JSON.stringify(o, null, 1) : JSON.stringify(o)); }

/* the scene's direction module writes the authored layer */
function author(s, force) {
  const f = scoreF(s), prev = fs.existsSync(f) ? J(f) : null;
  if (prev && prev.authored && !force) return prev;
  const M = marksOf(s), mod = require('./scenes/' + s + '.js');
  const X = { voiceOf: c => Compile.voiceOf(M, c) }, a = mod(M, X);
  const S = { format: Score.format, scene: s, title: a.title, type: a.type, total: M.total, clock: M.mode || 'cut', marks: 'odyssey/choreo/marks/' + s + '.json',
    source: { take: 'odyssey/take/voice/' + s + '.m4a', direction: 'tools/perform/scenes/' + s + '.js' },
    actors: a.actors || {}, objects: a.objects || {}, authored: a.authored, params: Object.assign(Compile.defaults(), a.params || {}), params0: Object.assign(Compile.defaults(), a.params || {}),
    bands: a.bands || null, events: [], measures: null, log: { homeostat: [], patches: [] } };
  save(f, S, true); return S;
}
/* the director's overrides the scene's sheet carries (the rig desk's hand keys), kept in the compiled sheet */
function overridesOf(s) { const f = path.join(ROOT, 'odyssey/choreo', s + '.json'); if (!fs.existsSync(f)) return {}; const C = J(f); return C.overrides || {}; }
function compileScene(s, S, o = {}) {
  const M = marksOf(s); S = S || J(scoreF(s));
  const out = Compile.compile(M, S, { overrides: overridesOf(s), params: o.params });
  return { M, S, ...out };
}
/* measures of a sheet: metrics + temperatures + the essential variables, compacted for the score and the page */
function measureSheet(s, C, S, events, o = {}) {
  const Metrics = require('./metrics.js'), Thermo = require('./thermo.js'), M = marksOf(s);
  const Tr = Metrics.track(M, C), m = Metrics.measure(Tr, { events, cues: o.cues || C.cues, holds: o.holds || [] });
  const th = Thermo.thermo(Tr, { ...S, events }, { events, viol: m.viol }), es = Thermo.essentials(th);
  const ids = Tr.ids, r = a => Array.from(a, v => Math.round(v * 1000) / 1000);
  return { metrics: { summary: m.summary, actors: m.actors, states: m.states, answered: m.answered }, essentials: { H1: es.H1, H2: es.H2, H3: es.H3, H4: es.H4 },
    series: { hz: 12, needles: es.series, Tm: Object.fromEntries(ids.map(id => [id, r(th.T[id])])), Sc: Object.fromEntries(Object.entries(th.Sc).map(([k, v]) => [k, r(v)])), Tc: r(th.Tc), Tmedia: r(th.Tmedia), CT: r(th.CT), V: r(th.V), hot: th.hot, onScreen: Object.fromEntries(ids.map(id => [id, Tr.frames.map(f => f.a[id] ? (f.a[id].on ? 1 : 0) : -1).join('')])) },
    eventHeat: th.eventHeat, cuts: th.cuts, field: th.field, causal: th.causal, objects: Object.fromEntries(Object.keys(S.objects || {}).map(k => [k, r(th.T[k] || [])])) };
}
module.exports = { author, compileScene, marksOf, scoreF, sheetF, save, overridesOf, J, ROOT, measureSheet };
if (require.main !== module) return;

(async () => {
  if (cmd === 'author') { const S = author(sid, args.includes('--force')); console.log('authored', path.relative(ROOT, scoreF(sid)), (S.authored.intents || []).length, 'intents,', (S.authored.holds || []).length, 'holds'); return; }
  if (cmd === 'compile') {
    const S = J(scoreF(sid)), R = compileScene(sid, S);
    S.events = R.events; S.params = R.params; S.compiled = { at: new Date().toISOString().slice(0, 19), notes: R.notes, sheet: 'odyssey/score/' + sid + '.choreo.json' };
    const errs = Score.validate(S); S.compiled.errors = errs;
    save(sheetF(sid), R.sheet); save(scoreF(sid), S, true);
    const n = Object.values(R.sheet.actors).reduce((a, A) => a + Object.values(A.channels).reduce((b, k) => b + k.length, 0), 0);
    console.log('compiled', sid, R.events.length, 'events,', Object.keys(R.sheet.actors).length, 'actors,', n, 'keys,', R.sheet.props.length, 'props');
    for (const x of R.notes) console.log('  note:', x); for (const x of errs.slice(0, 20)) console.log('  check:', x); if (errs.length > 20) console.log('  ...', errs.length, 'checks');
    return; }
  if (cmd === 'measure') { const S = J(scoreF(sid)), before = J(path.join(ROOT, 'odyssey/choreo', sid + '.json')), after = J(sheetF(sid));
    const mb = measureSheet(sid, before, S, [], { cues: before.cues, holds: before.holds }), ma = measureSheet(sid, after, S, S.events);
    save(path.join(SC, 'measures', sid + '.json'), { scene: sid, measured: new Date().toISOString().slice(0, 10), before: { sheet: 'odyssey/choreo/' + sid + '.json', ...mb }, after: { sheet: 'odyssey/score/' + sid + '.choreo.json', ...ma } });
    S.measures = { file: 'odyssey/score/measures/' + sid + '.json', before: { ...mb.metrics.summary, essentials: mb.essentials }, after: { ...ma.metrics.summary, essentials: ma.essentials } };
    for (const e of S.events) { const h = ma.eventHeat[e.id]; if (h) e.heat = { Tm: h.Tm, Tc: h.Tc, dS: h.dS }; }
    save(scoreF(sid), S, true);
    const row = (n, x) => console.log(n.padEnd(7), 'coverage', x.coverage, 'literal', x.literal, 'dead', x.share.DEAD, 'freeze', x.unmotivatedFreeze, 'unmotivated', x.unmotivatedAction, 'latency', JSON.stringify(x.reactionLatency), 'gestures/phrase', x.gestureDensity, 'diversity', x.diversity, 'slide', x.contact.footSlide, 'handoffs', JSON.stringify(x.contact.handoffs.map(h => h.gap)), 'legality', x.legality.clampRequests + '/' + x.legality.selfCollisions + '/' + x.legality.bodyOverlaps + '/' + x.legality.balance);
    row('before', mb.metrics.summary); console.log('        ', JSON.stringify(mb.essentials)); row('after', ma.metrics.summary); console.log('        ', JSON.stringify(ma.essentials)); return; }
  if (cmd === 'homeostat') { const Ho = require('./homeostat.js'), S = J(scoreF(sid)), M = marksOf(sid);
    const res = Ho.run(M, S, { overrides: overridesOf(sid), max: +opt('max', 40), say: r => console.log('attempt', r.n, 'positions', JSON.stringify(r.positions), 'H', JSON.stringify(r.reading), 'out', r.out.join(',') || '-', r.ms + ' ms') });
    S.bands = res.bands; S.log = S.log || {}; S.log.homeostat = res.log; S.params = res.retained.params; S.homeostat = { stable: res.stable, retained: res.retained.n, attempts: res.log.length, at: new Date().toISOString().slice(0, 19) };
    S.events = res.ev.R.events; save(scoreF(sid), S, true); save(sheetF(sid), res.ev.R.sheet);
    console.log(res.stable ? 'stable at attempt ' + res.retained.n : 'not stable in ' + res.log.length + ' attempts; nearest kept (attempt ' + res.retained.n + ')', JSON.stringify(res.retained.params)); return; }
  if (cmd === 'why') { const S = J(scoreF(sid)), E = Score.Events(S.events), who = args[2] && !/^OD-/.test(args[2]) ? args[2] : args[3], t = +args[args.length - 1];
    const w = E.why(who, t); console.log(w.text); for (const c of w.chain) console.log('  '.repeat(c.depth + 1) + c.lane.padEnd(9), c.kind.padEnd(16), (c.actor || '').padEnd(18), c.t0.toFixed(2) + '-' + c.t1.toFixed(2), c.latency != null ? '(+' + c.latency + ' s)' : '', c.label || ''); return; }
  console.log('see the header of tools/perform/perform.js'); process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
