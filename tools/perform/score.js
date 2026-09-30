/* tools/perform/score.js — the score: meaning above mechanics (format odyssey-score/1, odyssey/score/<scene>.json).

   A score is what a scene means, laid out on the take's voice clock as lanes, from why down to how:
     meaning   VOICE  STIMULUS  INTENT  ACTION  CONTACT
     body      ROOT  WEIGHT  TORSO  HEAD  GAZE  ARM.L  ARM.R  HAND.L  HAND.R  LEG.L  LEG.R  FACE  PROP
     world     CAMERA  LIGHT  SET/VEHICLE  FX
   Every event lives on one lane: {id, lane, actor?, t0, t1, kind, label, because:[{id, latency, rel?}], intent?, params?, heat?}.
   `because` is the causal graph: this event happens because of those, after `latency` seconds (a stimulus -> a reaction; an intent ->
   the body events that realise it; a swing -> a duck -> a miss -> an overtravel -> an opening seen -> an advance). HOLD(reason) is an
   authored, first-class event on the INTENT lane: a stillness someone chose, with its reason.

   The file (odyssey-score/1):
     {format, scene, title, type (dialogue|fight|revelation|machinery), total, clock, marks, source,
      actors:   {id: {role, body: 'minifig'|'prop', group?, mass?, damping?, affect:{fear, weight, suspicion, cunning, ...}}},
      objects:  {id: {kind, material, at?, holder?, affords:[actions]}},
      authored: {intents:[...], holds:[...], stimuli:[...], contacts:[...], clocks:{...}, couplings:[...], relations:[...], camera?:{...}},
                what the director (or a scene module, or a patch) wrote: the compiler never invents these
      params:   the compiler's parameters (the homeostat's selectors write them), with the authored defaults in params0
      bands:    the homeostat's preferred bands for this scene's essential variables
      events:   every event, authored and derived (the compiler's output: body lanes, contacts, props, camera and world events),
                each with its causes
      measures: the metrics and temperatures (tools/perform/metrics.js, thermo.js), per drawing and per event
      log:      the homeostat's attempts, the patches applied}
   The body score it compiles to is an odyssey-choreo/1 sheet (odyssey/score/<scene>.choreo.json), played by the film's take.
   Works in node and in a page (window.PerformScore). */
(function (root) {
'use strict';
const LANES = ['VOICE', 'STIMULUS', 'INTENT', 'ACTION', 'CONTACT',
  'ROOT', 'WEIGHT', 'TORSO', 'HEAD', 'GAZE', 'ARM.L', 'ARM.R', 'HAND.L', 'HAND.R', 'LEG.L', 'LEG.R', 'FACE', 'PROP',
  'CAMERA', 'LIGHT', 'SET/VEHICLE', 'FX'];
const MEANING = new Set(['VOICE', 'STIMULUS', 'INTENT', 'ACTION', 'CONTACT']), WORLD = new Set(['CAMERA', 'LIGHT', 'SET/VEHICLE', 'FX']);
const band = lane => MEANING.has(lane) ? 'meaning' : WORLD.has(lane) ? 'world' : 'body';
/* the channels of the body sheet each body lane covers (odyssey-choreo/1 channel names) */
const LANE_CH = {
  ROOT: ['root.x', 'root.z', 'root.y', 'root.h'], WEIGHT: ['hips.dy', 'root.pitch', 'root.roll'], TORSO: ['torso.lean', 'torso.twist', 'torso.roll'],
  HEAD: ['head.pitch'], GAZE: ['head.yaw'], 'ARM.L': ['arm.L.pitch', 'arm.L.out'], 'ARM.R': ['arm.R.pitch', 'arm.R.out'], 'HAND.L': ['hand.L.roll'], 'HAND.R': ['hand.R.roll'],
  'LEG.L': ['leg.L.pitch'], 'LEG.R': ['leg.R.pitch'] };
const CH_LANE = {}; for (const [l, cs] of Object.entries(LANE_CH)) for (const c of cs) CH_LANE[c] = l;
const r3 = v => Math.round(v * 1000) / 1000;

/* an event store with ids, lookups and the causal walk */
function Events(list) {
  const E = list || [], byId = new Map(E.map(e => [e.id, e])); let n = E.reduce((m, e) => Math.max(m, +(String(e.id).match(/\d+$/) || [0])[0]), 0);
  /* derived events are numbered from 1000 (a1001, e1002, ...), clear of the ids a director writes (iT9, hA1, v5, sKnock) */
  if (n < 1000) n = 1000;
  function add(e) { if (!e.id) e.id = (e.lane === 'INTENT' ? 'i' : e.lane === 'STIMULUS' ? 's' : e.lane === 'VOICE' ? 'v' : e.lane === 'CONTACT' ? 'c' : e.lane === 'ACTION' ? 'a' : 'e') + (++n);
    e.t0 = r3(e.t0); e.t1 = r3(e.t1 == null ? e.t0 : e.t1); e.because = (e.because || []).filter(b => b && b.id).map(b => ({ ...b, latency: b.latency == null ? null : r3(b.latency) }));
    E.push(e); byId.set(e.id, e); return e; }
  const get = id => byId.get(id);
  /* the events on an actor at t, most meaningful first (an ACTION before its body lanes, an INTENT or HOLD above all) */
  function at(actor, t, lanes) { const rank = l => l === 'ACTION' ? 0 : l === 'CONTACT' ? 1 : l === 'INTENT' ? 2 : LANES.indexOf(l) + 3;
    return E.filter(e => (e.actor === actor || (e.actors || []).includes(actor)) && t >= e.t0 - 1e-6 && t <= e.t1 + 1e-6 && (!lanes || lanes.includes(e.lane) || (e.lanes || []).some(l => lanes.includes(l)))).sort((a, b) => rank(a.lane) - rank(b.lane) || (b.t0 - a.t0)); }
  /* "why is X moving here?": the chain from the body up through the intent to what caused it */
  function why(actor, t, depth = 6) {
    const here = at(actor, t); if (!here.length) return { actor, t, chain: [], text: actor + ' has nothing authored at ' + t.toFixed(2) + ' s' };
    const start = here.find(e => e.lane === 'ACTION' && !(e.kind === 'BREATH')) || here.find(e => e.lane === 'CONTACT') || here.find(e => band(e.lane) === 'body') || here[0];
    const chain = [], seen = new Set(); let cur = [{ e: start, lat: null, from: null }];
    for (let d = 0; d < depth && cur.length; d++) { const nxt = [];
      for (const { e, lat, from } of cur) { if (seen.has(e.id)) continue; seen.add(e.id);
        chain.push({ id: e.id, lane: e.lane, kind: e.kind, label: e.label, actor: e.actor, t0: e.t0, t1: e.t1, latency: lat, effect: from, depth: d });
        for (const b of e.because || []) { const c = get(b.id); if (c && !seen.has(c.id)) nxt.push({ e: c, lat: b.latency, from: e.id }); } }
      cur = nxt; }
    /* the reading: kind (label) / kind (label) / ..., the way a director says it */
    const text = chain.map(c => c.kind + (c.label ? ' (' + c.label + ')' : '')).join(' / ');
    return { actor, t, chain, text, active: here.map(e => e.id) };
  }
  /* what an event caused (the forward walk) */
  function effects(id) { return E.filter(e => (e.because || []).some(b => b.id === id)); }
  return { list: E, add, get, at, why, effects };
}

/* the lanes as the rig desk's project.ScoreLanes reads them (odyssey-score/0: envelope|metric {hz, values, range}, events, spans) */
function deskLanes(S, { measures } = {}) {
  const L = [];
  const ev = S.events || [];
  if (S.voice && S.voice.env) L.push({ id: 'voice', label: 'VOICE', kind: 'envelope', hz: S.voice.hz, values: S.voice.env, range: [0, 1] });
  for (const lane of ['STIMULUS', 'INTENT', 'ACTION', 'CONTACT']) { const xs = ev.filter(e => e.lane === lane); if (!xs.length) continue;
    L.push({ id: lane.toLowerCase(), label: lane, kind: 'spans', spans: xs.map(e => ({ t0: e.t0, t1: Math.max(e.t1, e.t0 + 0.08), label: (e.actor ? short(e.actor) + ': ' : '') + e.kind + (e.label ? ' ' + e.label : '') })) }); }
  const m = measures || S.measures;
  if (m && m.series) for (const [k, lab, range] of [['Tm', 'MOTION HEAT', null], ['Sc', 'CAUSAL ENTROPY', null], ['Tmedia', 'MEDIA TEMP', [0, 1]], ['CT', 'CONTRAST', null], ['V', 'VIABILITY', null]])
    if (m.series[k]) L.push({ id: k, label: lab, kind: 'metric', hz: m.series.hz || 12, values: m.series[k], ...(range ? { range } : {}) });
  if (m && m.needles) for (const [k, v] of Object.entries(m.needles)) L.push({ id: 'needle-' + k, label: 'NEEDLE ' + k, kind: 'metric', hz: m.needles.hz || 12, values: v });
  return { format: 'odyssey-score/0', scene: S.scene, total: S.total, note: 'written by tools/perform (odyssey-score/1 flattened to the desk\'s lanes)', lanes: L.filter(l => l.values || l.spans || l.events) };
}
const short = id => String(id).replace(/-as-mentes/, '').replace(/^the-/, '').replace(/four-stake-bearers-/, 'bearer-').replace(/crew-at-the-oars-/, 'crew-').replace(/palace-servants-/, 'servant-').replace(/-revealed/, '');

/* checks a score's shape: lanes known, ids unique, causes resolve and precede their effects (within a drawing) */
function validate(S) {
  const errs = [], ids = new Set();
  for (const e of S.events || []) { if (!LANES.includes(e.lane)) errs.push(e.id + ': unknown lane ' + e.lane); if (ids.has(e.id)) errs.push('duplicate id ' + e.id); ids.add(e.id);
    if (!(e.t1 >= e.t0)) errs.push(e.id + ': ends before it starts'); }
  const byId = new Map((S.events || []).map(e => [e.id, e]));
  for (const e of S.events || []) for (const b of e.because || []) { const c = byId.get(b.id); if (!c) errs.push(e.id + ': cause ' + b.id + ' missing'); else if (c.t0 > e.t0 + 1 / 12 + 1e-6 && !['anticipates', 'realises', 'prepares'].includes(b.rel)) errs.push(e.id + ' (' + e.kind + ' ' + e.t0 + ') before its cause ' + c.id + ' (' + c.kind + ' ' + c.t0 + ')'); }
  return errs;
}
const API = { LANES, LANE_CH, CH_LANE, band, Events, deskLanes, validate, short, format: 'odyssey-score/1' };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
root.PerformScore = API;
})(typeof window !== 'undefined' ? window : globalThis);
