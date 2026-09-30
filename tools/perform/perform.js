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
/* a variant (a disturbed run of a scene: --variant wake-early [--frozen]) lives beside the baseline in odyssey/score/variants/ */
const VAR = opt('variant', null), FROZEN = args.includes('--frozen'), vtag = VAR ? '.' + VAR + (FROZEN ? '.frozen' : '.regulated') : '';
const scoreF = (s, v = vtag) => v ? path.join(SC, 'variants', s + v + '.json') : path.join(SC, s + '.json'), sheetF = (s, v = vtag) => v ? path.join(SC, 'variants', s + v + '.choreo.json') : path.join(SC, s + '.choreo.json');
const r3 = v => Math.round(v * 1000) / 1000;
function save(f, o, pretty) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, pretty ? JSON.stringify(o, null, 1) : JSON.stringify(o)); }

/* the scene's direction module writes the authored layer */
function author(s, force) {
  const f = scoreF(s), prev = fs.existsSync(f) ? J(f) : null;
  if (prev && prev.authored && !force) return prev;
  const M = marksOf(s), own = path.join(__dirname, 'scenes', s + '.js');
  const X = { voiceOf: c => Compile.voiceOf(M, c), variant: VAR, frozen: FROZEN };
  /* a scene with no direction module of its own gets a first score from the needs catalogue */
  let a; if (fs.existsSync(own)) a = require(own)(M, X); else { const N = J(path.join(ROOT, 'odyssey/perform/needs.json')); const e = N.scenes[s]; if (!e) throw Error('no direction module and no needs entry for ' + s); a = require('./scenes/_auto.js')(M, X, e); }
  const S = { format: Score.format, scene: s, variant: VAR ? { name: VAR, frozen: FROZEN } : null, title: a.title, type: a.type, total: M.total, clock: M.mode || 'cut', marks: 'odyssey/choreo/marks/' + s + '.json',
    source: { take: 'odyssey/take/voice/' + s + '.m4a', direction: fs.existsSync(path.join(__dirname, 'scenes', s + '.js')) ? 'tools/perform/scenes/' + s + '.js' : 'tools/perform/scenes/_auto.js (odyssey/perform/needs.json)' },
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
const CHAINS = { default: ['make it more dramatic', 'less gesturing while they speak', 'cool this scene down', 'more fighting', 'focus this on the fight'],
  'OD-B01-S03': ['make Telemachus more suspicious', 'less gesturing while they speak', 'make it more dramatic', 'keep the choreography but make Telemachus more afraid', 'cool this scene down'] };
module.exports = { author, compileScene, marksOf, scoreF, sheetF, save, overridesOf, J, ROOT, measureSheet };
if (require.main !== module) return;

(async () => {
  if (cmd === 'author') { const S = author(sid, args.includes('--force')); console.log('authored', path.relative(ROOT, scoreF(sid)), (S.authored.intents || []).length, 'intents,', (S.authored.holds || []).length, 'holds'); return; }
  if (cmd === 'compile') {
    const S = J(scoreF(sid)), R = compileScene(sid, S);
    S.events = R.events; S.params = R.params; S.compiled = { at: new Date().toISOString().slice(0, 19), notes: R.notes, sheet: 'odyssey/score/' + sid + '.choreo.json' };
    const errs = Score.validate(S); S.compiled.errors = errs;
    save(sheetF(sid), R.sheet); save(scoreF(sid), S);
    const n = Object.values(R.sheet.actors).reduce((a, A) => a + Object.values(A.channels).reduce((b, k) => b + k.length, 0), 0);
    console.log('compiled', sid, R.events.length, 'events,', Object.keys(R.sheet.actors).length, 'actors,', n, 'keys,', R.sheet.props.length, 'props');
    for (const x of R.notes) console.log('  note:', x); for (const x of errs.slice(0, 20)) console.log('  check:', x); if (errs.length > 20) console.log('  ...', errs.length, 'checks');
    return; }
  if (cmd === 'measure') { const S = J(scoreF(sid)), before = J(path.join(ROOT, 'odyssey/choreo', sid + '.json')), after = J(sheetF(sid));
    const mb = measureSheet(sid, before, S, [], { cues: before.cues, holds: before.holds }), ma = measureSheet(sid, after, S, S.events);
    save(path.join(SC, 'measures', sid + '.json'), { scene: sid, measured: new Date().toISOString().slice(0, 10), before: { sheet: 'odyssey/choreo/' + sid + '.json', ...mb }, after: { sheet: 'odyssey/score/' + sid + '.choreo.json', ...ma } });
    S.measures = { file: 'odyssey/score/measures/' + sid + '.json', before: { ...mb.metrics.summary, essentials: mb.essentials }, after: { ...ma.metrics.summary, essentials: ma.essentials } };
    for (const e of S.events) { const h = ma.eventHeat[e.id]; if (h) e.heat = { Tm: h.Tm, Tc: h.Tc, dS: h.dS }; }
    save(scoreF(sid), S);
    const row = (n, x) => console.log(n.padEnd(7), 'coverage', x.coverage, 'literal', x.literal, 'dead', x.share.DEAD, 'freeze', x.unmotivatedFreeze, 'unmotivated', x.unmotivatedAction, 'latency', JSON.stringify(x.reactionLatency), 'gestures/phrase', x.gestureDensity, 'diversity', x.diversity, 'slide', x.contact.footSlide, 'handoffs', JSON.stringify(x.contact.handoffs.map(h => h.gap)), 'legality', x.legality.clampRequests + '/' + x.legality.selfCollisions + '/' + x.legality.bodyOverlaps + '/' + x.legality.balance);
    row('before', mb.metrics.summary); console.log('        ', JSON.stringify(mb.essentials)); row('after', ma.metrics.summary); console.log('        ', JSON.stringify(ma.essentials)); return; }
  if (cmd === 'homeostat') { const Ho = require('./homeostat.js'), S = J(scoreF(sid)), M = marksOf(sid);
    const res = Ho.run(M, S, { overrides: overridesOf(sid), max: +opt('max', 40), say: r => console.log('attempt', r.n, 'positions', JSON.stringify(r.positions), 'H', JSON.stringify(r.reading), 'out', r.out.join(',') || '-', r.ms + ' ms') });
    S.bands = res.bands; S.log = S.log || {}; S.log.homeostat = res.log; S.params = res.retained.params; S.homeostat = { stable: res.stable, retained: res.retained.n, attempts: res.log.length, at: new Date().toISOString().slice(0, 19) };
    S.events = res.ev.R.events; save(scoreF(sid), S); save(sheetF(sid), res.ev.R.sheet);
    console.log(res.stable ? 'stable at attempt ' + res.retained.n : 'not stable in ' + res.log.length + ' attempts; nearest kept (attempt ' + res.retained.n + ')', JSON.stringify(res.retained.params)); return; }
  if (cmd === 'patch' || cmd === 'chain') {
    const Pa = require('./patches.js'), Ho = require('./homeostat.js'), M = marksOf(sid);
    const texts = cmd === 'patch' ? [args.slice(1).find(a => !/^OD-/.test(a) && !a.startsWith('--'))] : (opt('steps') ? opt('steps').split('|') : CHAINS[sid] || CHAINS.default);
    let S = cmd === 'chain' ? author(sid, true) : J(scoreF(sid));
    const ov = overridesOf(sid), steps = [];
    let prev = Ho.evaluate(M, S, Object.assign(Compile.defaults(), S.params), { overrides: ov }), prevS = JSON.parse(JSON.stringify(S));
    const snap = (ev, SS) => ({ essentials: { H1: ev.es.H1, H2: ev.es.H2, H3: ev.es.H3, H4: ev.es.H4 }, bands: SS.bands || Ho.bandsFor(SS.type), params: SS.params, metrics: { coverage: ev.m.summary.coverage, literal: ev.m.summary.literal, freeze: ev.m.summary.unmotivatedFreeze, gestureDensity: ev.m.summary.gestureDensity, latency: ev.m.summary.reactionLatency.median, diversity: ev.m.summary.diversity, handoffs: ev.m.summary.contact.handoffs.map(h => h.gap) },
      timeline: ev.R.events.filter(e => ['INTENT', 'ACTION', 'CONTACT', 'PROP'].includes(e.lane) && !e.derived).map(e => [e.lane, e.actor, e.kind, e.t0, e.t1, e.label || '']), needles: ev.es.series });
    steps.push({ text: '(as authored)', ...snap(prev, S) });
    for (const text of texts) {
      const r = Pa.apply(S, M, text, prev.es); if (!r) { console.log('no patch for', JSON.stringify(text)); steps.push({ text, error: 'no patch in the table' }); continue; }
      let ev; if (!r.lock && S.bands) { const res = Ho.run(M, S, { overrides: ov, max: +opt('max', 30), bands: S.bands, say: x => process.stdout.write('.' ) }); ev = res.ev; S.params = res.retained.params; r.homeostat = { stable: res.stable, attempts: res.log.length, retained: res.retained.n, log: res.log.map(x => ({ n: x.n, positions: x.positions, reading: x.reading, out: x.out })) }; process.stdout.write('\n'); }
      else ev = Ho.evaluate(M, S, Object.assign(Compile.defaults(), S.params), { overrides: ov });
      const d = Pa.diff(prev.R.events, ev.R.events), body = Pa.bodyDiff(M, prev.R.sheet, ev.R.sheet);
      const intentsShifted = d.shifted.filter(x => x.lane === 'INTENT').length;
      steps.push({ text, patch: r.row, did: r.did, lock: r.lock, homeostat: r.homeostat || null, diff: { counts: d.counts, added: d.added.slice(0, 40), removed: d.removed.slice(0, 40), shifted: d.shifted.slice(0, 60), changed: d.changed, intentsShifted }, body, ...snap(ev, S) });
      console.log(JSON.stringify(text), '->', r.row + ':', r.did); console.log('   diff', JSON.stringify(d.counts), 'intents shifted', intentsShifted, '| H', JSON.stringify(steps[steps.length - 1].essentials), r.homeostat ? (r.homeostat.stable ? 'stable after ' + r.homeostat.attempts : 'nearest of ' + r.homeostat.attempts) : 'locked');
      prev = ev; prevS = JSON.parse(JSON.stringify(S)); }
    if (cmd === 'chain') { save(path.join(SC, 'chains', sid + '.json'), { scene: sid, made: new Date().toISOString().slice(0, 10), note: 'five instructions applied in order to one score; each step: what the patch did, the homeostat\'s search, the timeline diff against the step before, the body diff (mean absolute channel change per actor), the essential variables and metrics after', steps });
      save(path.join(SC, 'chains', sid + '.last.choreo.json'), prev.R.sheet); author(sid, true); }
    else { S.events = prev.R.events; save(scoreF(sid), S); save(sheetF(sid), prev.R.sheet); }
    return; }
  if (cmd === 'hardware') { const Hw = require('./hardware.js'), S = J(scoreF(sid)), C = J(sheetF(sid)), M = marksOf(sid);
    const mf = path.join(SC, 'measures', sid + '.json'), states = fs.existsSync(mf) ? J(mf).after.metrics.states : {};
    const ps = Hw.posesheet(M, C, S, { states }), sv = Hw.servo(M, C, S), dir = path.join(SC, 'hardware'); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, sid + '.posesheet.csv'), Hw.csv(ps.head, ps.rows, ['stop-motion pose sheet for ' + sid + ' (tools/perform/hardware.js): each drawing on twos (frames at 24), the principals; angles in degrees as set on the toy; x, z in studs, y and hips in plates', 'state: A action, R reaction, H alive hold, h authored hold, D dead; holds_R/L: what the hand holds (ownership at that drawing); why: the score\'s causal chain']));
    fs.writeFileSync(path.join(dir, sid + '.servo.csv'), Hw.csv(sv.head, sv.rows, ['servo timeline for ' + sid + ' (tools/perform/hardware.js): rows where a channel moves (and where it stops); power is an estimate from a stated model (a 0.30 m puppet; see the file header of hardware.js), not a measurement', 'calibration on a rig: encoder velocity -> angular velocity; IMU -> root acceleration; V x I -> electrical power; motor thermistor -> a first-order response to I^2 R, the same form as the motion heat T_m']));
    save(path.join(dir, sid + '.energy.json'), { scene: sid, note: 'estimated electrical energy per channel over the scene (J), from the servo model', energyJ: sv.energyJ });
    console.log('hardware', sid, ps.rows.length, 'pose-sheet rows,', sv.rows.length, 'servo rows'); return; }
  if (cmd === 'desk') { /* the engine's lanes onto the rig desk (odyssey/cascade/assets/rig/<scene>/score.json, project.ScoreLanes) */
    const S = J(scoreF(sid)), mf = path.join(SC, 'measures', sid + '.json'), f = path.join(ROOT, 'odyssey/cascade/assets/rig', sid, 'score.json');
    if (!fs.existsSync(path.dirname(f))) { console.log('no rig desk for', sid); return; }
    const prev = fs.existsSync(f) ? J(f) : { lanes: [] }, Ms = fs.existsSync(mf) ? J(mf).after : null;
    const measures = Ms ? { series: { hz: 12, Tm: null, CT: Ms.series.CT, Tmedia: Ms.series.Tmedia, V: Ms.series.V }, needles: { hz: 12, ...Ms.series.needles } } : null;
    const mine = Score.deskLanes({ ...S, voice: null }, { measures }).lanes.map(l => ({ ...l, by: 'tools/perform (odyssey-score/1 ' + sid + ')' }));
    const lanes = (prev.lanes || []).filter(l => !String(l.by || '').startsWith('tools/perform')).concat(mine);
    fs.writeFileSync(f, JSON.stringify({ format: 'odyssey-score/0', scene: sid, total: S.total, note: (prev.note || '') + ' The meaning lanes (stimulus, intent, action, contact) and the measures (the homeostat\'s needles H1-H4, contrast, media temperature, viability) are the performance engine\'s: odyssey/score/' + sid + '.json (odyssey-score/1).', lanes }));
    console.log('desk', path.relative(ROOT, f), lanes.length, 'lanes:', lanes.map(l => l.id).join(' ')); return; }
  if (cmd === 'why') { const S = J(scoreF(sid)), E = Score.Events(S.events), who = args[2] && !/^OD-/.test(args[2]) ? args[2] : args[3], t = +args[args.length - 1];
    const w = E.why(who, t); console.log(w.text); for (const c of w.chain) console.log('  '.repeat(c.depth + 1) + c.lane.padEnd(9), c.kind.padEnd(16), (c.actor || '').padEnd(18), c.t0.toFixed(2) + '-' + c.t1.toFixed(2), c.latency != null ? '(+' + c.latency + ' s)' : '', c.label || ''); return; }
  console.log('see the header of tools/perform/perform.js'); process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
