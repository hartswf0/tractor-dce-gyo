#!/usr/bin/env node
/* tools/perform/pagedata.js — the performance page's data (odyssey/perform/data/<scene>.json): what odyssey/perform/index.html shows
   for a scene, compacted from the score, its measures, its variants and its patch chain.
     node tools/perform/pagedata.js [OD-B01-S03 ...]   (default: the four proof scenes) */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), J = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')), ex = f => fs.existsSync(path.join(ROOT, f));
const Score = require('./score.js'), Thermo = require('./thermo.js'), Compile = require('./compile.js'), Homeostat = require('./homeostat.js');
const r3 = v => Math.round(v * 1000) / 1000, r2 = v => Math.round(v * 100) / 100;
const PAL = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#d35400', '#c0392b', '#7f8c8d', '#16a085', '#8e44ad', '#27ae60', '#e67e22', '#2980b9'];
const SCENES = process.argv.slice(2).filter(a => /^OD-/.test(a)); if (!SCENES.length) SCENES.push('OD-B01-S03', 'OD-B09-S09', 'OD-B12-S03', 'OD-B22-S01');
const down = (a, k) => a ? a.filter((_, i) => i % k === 0).map(r3) : null;
function events(S) { return (S.events || []).filter(e => e.kind !== 'BREATH' && !(e.lane === 'VOICE' && e.kind === 'PHRASE' && false)).map(e => [e.id, e.lane, e.actor || null, r3(e.t0), r3(e.t1), e.kind, (e.label || '').slice(0, 120), (e.because || []).map(b => [b.id, b.latency == null ? null : r2(b.latency), b.rel || null]), e.lanes || null, e.heat ? [e.heat.Tm, e.heat.dS] : null, e.actors || null]); }
function summary(s) { if (!s) return null; return { coverage: s.coverage, literal: s.literal, share: s.share, freeze: s.unmotivatedFreeze, freezeBy: s.unmotivatedFreezeBy, unmotivated: s.unmotivatedAction, latency: s.reactionLatency, gestures: s.gestureDensity, diversity: s.diversity,
  slide: s.contact.footSlide, handoffs: s.contact.handoffs, legality: { requests: s.legality.clampRequests, collisions: s.legality.selfCollisions, overlaps: s.legality.bodyOverlaps, balance: s.legality.balance } }; }
for (const sid of SCENES) {
  const S = J('odyssey/score/' + sid + '.json'), M = J('odyssey/choreo/marks/' + sid + '.json'), Ms = ex('odyssey/score/measures/' + sid + '.json') ? J('odyssey/score/measures/' + sid + '.json') : null;
  const ids = Object.keys(M.H || {}), colors = Object.fromEntries(ids.map((id, k) => [id, PAL[k % PAL.length]]));
  const bands = S.bands || Homeostat.bandsFor(S.type);
  const out = { scene: sid, title: S.title, type: S.type, total: M.total, built: new Date().toISOString().slice(0, 10),
    media: { previz: 'media/previz-' + sid + '.mp4', poster: 'media/previz-' + sid + '.jpg', film: ex('films/odyssey/' + sid + '-performed.mp4') ? '../../films/odyssey/' + sid + '-performed.mp4' : null, acted: ex('films/odyssey/' + sid + '-acted.mp4') ? '../../films/odyssey/' + sid + '-acted.mp4' : null },
    lanes: Score.LANES, actors: Object.fromEntries(ids.map(id => [id, { short: Score.short(id), color: colors[id], role: ((S.actors || {})[id] || {}).role || '', principal: !!((S.actors || {})[id] || {}).principal }])),
    objects: Object.fromEntries(Object.entries(S.objects || {}).map(([k, o]) => [k, { kind: o.kind, material: o.material, affords: o.affords || [] }])),
    events: events(S), params: S.params, params0: S.params0, paramDefs: Compile.PARAMS, bands,
    measures: Ms ? { before: { sheet: Ms.before.sheet, summary: summary(Ms.before.metrics.summary), essentials: Ms.before.essentials, actors: Ms.before.metrics.actors },
      after: { sheet: Ms.after.sheet, summary: summary(Ms.after.metrics.summary), essentials: Ms.after.essentials, actors: Ms.after.metrics.actors, states: Ms.after.metrics.states } } : null,
    needles: Ms ? { hz: 12, H1: Ms.after.series.needles.H1, H2: Ms.after.series.needles.H2, H3: Ms.after.series.needles.H3, H4: Ms.after.series.needles.H4, before: { H1: down(Ms.before.series.needles.H1, 2), H2: down(Ms.before.series.needles.H2, 2), H3: down(Ms.before.series.needles.H3, 2), H4: down(Ms.before.series.needles.H4, 2) } } : null,
    heat: Ms ? { hz: 4, Tm: Object.fromEntries(Object.entries(Ms.after.series.Tm).map(([k, v]) => [k, down(v, 3)])), CT: down(Ms.after.series.CT, 3), Tmedia: down(Ms.after.series.Tmedia, 3), Tc: down(Ms.after.series.Tc, 3), V: down(Ms.after.series.V, 3),
      hot: Ms.after.series.hot.filter((_, i) => i % 3 === 0), cuts: (Ms.after.cuts || []).slice(0, 80), top: Object.entries(Ms.after.eventHeat || {}).sort((a, b) => Math.abs(b[1].dS) - Math.abs(a[1].dS)).slice(0, 12).map(([id, h]) => ({ id, ...h })), objects: Object.fromEntries(Object.entries(Ms.after.objects || {}).map(([k, v]) => [k, down(v, 3)])) } : null,
    causal: S.authored && S.authored.causal ? { tau: S.authored.causal.tau, actions: Object.fromEntries(Object.entries(S.authored.causal.actions).slice(0, 14).map(([k, v]) => [k, v.map(a => ({ a: a.a, base: a.base, f: a.f, uses: a.uses || [] }))])) } : null,
    materials: Object.fromEntries(Object.entries(Thermo.MATERIAL).map(([k, m]) => [k, { tau: m.tau > 1e6 ? 'forever' : m.tau, k: m.k, source: m.source, gain: m.gain || 1, note: m.note || '' }])),
    homeostat: { log: ((S.log || {}).homeostat || []).slice(0, 60), wiring: Homeostat.WIRING, positions: Homeostat.POSITIONS },
    hardware: ex('odyssey/score/hardware/' + sid + '.posesheet.csv') ? { posesheet: '../score/hardware/' + sid + '.posesheet.csv', servo: '../score/hardware/' + sid + '.servo.csv', energy: J('odyssey/score/hardware/' + sid + '.energy.json').energyJ } : null };
  /* the Blinding: the coupled homeostat's three runs */
  if (S.authored && S.authored.coupled) { const runs = [{ name: 'baseline', label: 'undisturbed', S }];
    for (const [v, lab] of [['wake-early.frozen', 'Polyphemus wakes early; uniselectors held'], ['wake-early.regulated', 'Polyphemus wakes early; regulated']]) { const f = 'odyssey/score/variants/' + sid + '.' + v + '.json'; if (ex(f)) runs.push({ name: v, label: lab, S: J(f) }); }
    out.coupled = { units: S.authored.coupled.units, model: 'tools/perform/machinery.js blinding', W0: S.authored.coupled.W0,
      runs: runs.map(r => { const c = r.S.authored.coupled, k = Math.max(1, Math.round(c.hz / 12)); return { name: r.name, label: r.label, hz: 12, x: c.x.map(a => a.filter((_, i) => i % k === 0)), events: c.events, steps: c.steps, W: c.W,
        media: ex('odyssey/perform/media/previz-' + sid + (r.name === 'baseline' ? '' : '-wake-early-' + (r.name.endsWith('frozen') ? 'held' : 'regulated')) + '.mp4') ? 'media/previz-' + sid + (r.name === 'baseline' ? '' : '-wake-early-' + (r.name.endsWith('frozen') ? 'held' : 'regulated')) + '.mp4' : null,
        timeline: (r.S.events || []).filter(e => ['INTENT', 'STIMULUS'].includes(e.lane) && e.kind !== 'HOLD' && e.kind !== 'BLOCKING').map(e => [e.lane, e.actor, e.kind, r3(e.t0), r3(e.t1), (e.label || '').slice(0, 80)]) }; }) }; }
  /* the Gate: the patch chain */
  if (ex('odyssey/score/chains/' + sid + '.json')) { const C = J('odyssey/score/chains/' + sid + '.json');
    out.chain = { note: C.note, steps: C.steps.map(s => ({ text: s.text, patch: s.patch, did: s.did, lock: s.lock, error: s.error, homeostat: s.homeostat ? { stable: s.homeostat.stable, attempts: s.homeostat.attempts, retained: s.homeostat.retained, log: (s.homeostat.log || []).slice(0, 40) } : null,
      diff: s.diff ? { counts: s.diff.counts, intentsShifted: s.diff.intentsShifted, added: (s.diff.added || []).slice(0, 14), removed: (s.diff.removed || []).slice(0, 14), shifted: (s.diff.shifted || []).slice(0, 18), changed: s.diff.changed } : null, body: s.body, essentials: s.essentials, bands: s.bands, params: s.params, metrics: s.metrics,
      timeline: (s.timeline || []).filter(x => x[0] === 'INTENT' || (x[0] === 'ACTION' && ['telemachus', 'athena-as-mentes'].includes(x[1]))).map(x => [x[0], x[1], x[2], r3(x[3]), r3(x[4])]), needles: s.needles ? { H1: down(s.needles.H1, 3), H3: down(s.needles.H3, 3) } : null })) }; }
  fs.mkdirSync(path.join(ROOT, 'odyssey/perform/data'), { recursive: true });
  const f = path.join(ROOT, 'odyssey/perform/data', sid + '.json'); fs.writeFileSync(f, JSON.stringify(out));
  console.log('page data', path.relative(ROOT, f), (fs.statSync(f).size / 1024).toFixed(0), 'KB');
}
