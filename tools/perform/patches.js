/* tools/perform/patches.js — words to the director's patches: a deterministic table from an instruction to a rewrite of the score
   (its intents, its actors' affect and weight, the homeostat's bands, the compiler's parameters), never to "move more".
   A patch returns what it changed; perform.js then lets the homeostat find parameters for the new bands (unless the patch locks the
   choreography), compiles, measures, and diffs the timeline against the one before. Extend the table with a new row: a pattern, and a
   function (S, m) that edits the score S (m: the pattern's match, with m.actor the actor the words name, if any).

     "make it more dramatic"                 contrast target up, causal-change target up, mean motion unchanged (hotter peaks: the key
                                             gestures bigger; colder valleys: holds that dwell longer on one thing)
     "less gesturing while they speak"       gestures per phrase down (at most one beat a phrase, the arm less open), holds up
     "focus this on the fight"               combat events up (attack probability), non-combat actors cooler, the camera to the causal hot spot
     "<X> should feel much heavier"          X's weight up: slower accelerations (moves stretched), bigger environment response to X's contacts
     "keep the choreography but make <X> more afraid"   events and timings locked; X's affect: distance up, earlier gaze to the exits,
                                             reactions delayed, weight held back
     "make <X> more suspicious"              WELCOME -> GUARDED_WELCOME (and any open act to its guarded form)
     "more fighting"                         contact rate up, threat interactions up, causal constriction up, recovery intervals down
     "make <X> cunning rather than aggressive"   direct attack heat down, future-option gain up, opponent-option collapse up, motion down
     "cool this scene down"                  motion amplitude down, sensory specification down (cuts elide), audience closure up */
'use strict';
const Homeostat = require('./homeostat.js');
const r4 = v => Math.round(v * 1e4) / 1e4;
/* a band set relative to where the scene stands now (cur: the essential variables before the patch): "more" means more than now */
let CUR = null;
const scaleBand = (S, u, lo, hi) => { S.bands = S.bands || Homeostat.bandsFor(S.type); const b = S.bands[u], c = CUR && CUR[u] != null ? CUR[u] : (b.band[0] + b.band[1]) / 2;
  b.band = [r4(c * lo), r4(c * hi)]; b.word = 'x' + lo + '-' + hi + ' of ' + r4(c); };
const forIntents = (S, pred, fn) => { let k = 0; for (const I of (S.authored.intents || []).concat(S.authored.holds || [])) if (pred(I)) { fn(I); k++; } return k; };
const affect = (S, id, o) => { S.actors = S.actors || {}; const A = S.actors[id] = S.actors[id] || { role: '?', body: 'minifig' }; A.affect = Object.assign({ fear: 0, weight: 1, suspicion: 0, cunning: 0, heat: 1 }, A.affect || {}); for (const [k, v] of Object.entries(o)) A.affect[k] = r4(typeof v === 'function' ? v(A.affect[k]) : v); return A.affect; };
const OPEN_TO_GUARDED = { WELCOME: 'GUARDED_WELCOME', OFFER: 'GUARDED_OFFER', GREET: 'GUARDED_WELCOME' };
const SPEECH = new Set(['WELCOME', 'GUARDED_WELCOME', 'DECLARE', 'ACCUSE', 'COMMAND', 'PLEAD', 'PROMISE', 'THREATEN']);
const COMBAT = new Set(['THREAT', 'ATTACK', 'SHOOT', 'EVADE', 'BLOCK', 'IMPACT', 'RECOVER', 'RETARGET', 'PURSUIT', 'SEPARATION', 'THRUST', 'TWIST', 'DUCK', 'RECOIL', 'FALL', 'LEAP', 'SEARCH', 'SCATTER']);

const TABLE = [
  { re: /more dramatic/i, name: 'more dramatic', lock: false, fn: (S) => { scaleBand(S, 'H3', 1.25, 2.2); scaleBand(S, 'H2', 1.1, 2.0); scaleBand(S, 'H1', 0.85, 1.15);
      const hot = forIntents(S, I => SPEECH.has(I.kind) || ['NOTICE', 'TAKE', 'RISE', 'ATTACK', 'SHOOT', 'THRUST', 'LEAP'].includes(I.kind), I => { I.params = Object.assign({}, I.params, { amp: r4(((I.params || {}).amp || 1) * 1.3), openness: r4(Math.min(1, ((I.params || {}).openness || 0.85) * 1.15)), gazeHold: r4(((I.params || {}).gazeHold || 1) * 1.4) }); });
      const cold = forIntents(S, I => (I.kind === 'HOLD' || I.reason) && I.params && I.params.look, I => { I.params.look = I.params.look.map(([tg, d]) => [tg, r4(d * 1.5)]); });
      /* the heat moved: the principals hotter, the room cooler (the mean held by the homeostat) */
      let pr = 0; for (const [id, A] of Object.entries(S.actors || {})) { if (A.principal) { affect(S, id, { heat: v => v * 1.6 }); pr++; } else affect(S, id, { heat: v => v * 0.6 }); }
      return 'contrast target x1.25-2.2 of now, causal-change target x1.1-2.0 of now, mean motion held (x0.85-1.15 of now); ' + pr + ' principals hotter (x1.6), the room cooler (x0.6); ' + hot + ' key intents hotter (amplitude x1.3, gaze held x1.4), ' + cold + ' holds colder (each look dwells x1.5)'; } },
  { re: /less gestur/i, name: 'less gesturing while they speak', fn: (S) => { const k = forIntents(S, I => SPEECH.has(I.kind), I => { I.params = Object.assign({}, I.params, { maxBeats: 1, openness: r4(((I.params || {}).openness || 0.85) * 0.75), gazeHold: r4(((I.params || {}).gazeHold || 1) * 1.6), beatsOnlyKey: true }); });
      return k + ' speech acts: at most one gesture a phrase (the key stress), the arm opens less, the gaze holds x1.6'; } },
  { re: /focus (this )?on the fight/i, name: 'focus on the fight', fn: (S) => { S.params = S.params || {}; S.params.attack = r4(Math.min(0.95, (S.params.attack || 0.5) + 0.25)); S.params.camera = r4(Math.max(0.7, (S.params.camera || 1) * 0.85));
      const fighters = new Set(); forIntents(S, I => COMBAT.has(I.kind), I => fighters.add(I.actor)); let k = 0;
      for (const id of Object.keys(S.actors || {})) if (!fighters.has(id)) { affect(S, id, { heat: v => v * 0.6 }); k++; }
      S.authored.camera = Object.assign({}, S.authored.camera, { follow: 'causal hot spot' });
      return 'attack probability ' + S.params.attack + ', ' + k + ' non-combat actors cooler (their amplitude x0.6), the camera lane follows the causal hot spot, camera closer (x0.85)'; } },
  { re: /(\w+) should feel (much )?heavier/i, name: 'heavier', fn: (S, m) => { const id = m.actor; if (!id) return 'no actor named'; const a = affect(S, id, { weight: v => v * (m[2] ? 2.2 : 1.5) });
      for (const c of S.authored.couplings || []) if (c.from === id || c.to === id) c.k = r4((c.k || 1) * 1.4);
      return id + ': weight x' + (m[2] ? 2.2 : 1.5) + ' (now ' + a.weight + '): its moves take longer to start and stop, the environment answers its contacts harder (couplings x1.4)'; } },
  { re: /keep the choreography but make (\w+) (more )?afraid/i, name: 'afraid, choreography locked', lock: true, fn: (S, m) => { const id = m.actor; if (!id) return 'no actor named'; const a = affect(S, id, { fear: v => Math.min(1, v + 0.6) });
      return 'events and timings locked; ' + id + ' afraid (fear ' + a.fear + '): further from others, the gaze goes to the exits first, reactions later, the weight held back'; } },
  { re: /make (\w+) (more )?suspicious/i, name: 'more suspicious', fn: (S, m) => { const id = m.actor; if (!id) return 'no actor named'; let k = 0;
      forIntents(S, I => I.actor === id && OPEN_TO_GUARDED[I.kind], I => { I.from = I.kind; I.kind = OPEN_TO_GUARDED[I.kind]; k++; }); affect(S, id, { suspicion: v => Math.min(1, v + 0.6) });
      return k + ' of ' + id + '\'s open acts made guarded (WELCOME -> GUARDED_WELCOME: closed, further, slower to the spear, the gaze held long, a look at her spear first)'; } },
  { re: /more fighting/i, name: 'more fighting', fn: (S) => { S.params = S.params || {}; S.params.attack = r4(Math.min(0.95, (S.params.attack || 0.5) + 0.2)); S.params.threat = r4(Math.min(3, (S.params.threat || 1.5) * 1.3));
      const k = forIntents(S, I => COMBAT.has(I.kind), I => { I.params = Object.assign({}, I.params, { recovery: r4(((I.params || {}).recovery || 1) * 0.6), contacts: r4(((I.params || {}).contacts || 1) * 1.5) }); });
      scaleBand(S, 'H2', 1.15, 2.2); return 'attack probability ' + S.params.attack + ', threat distance ' + S.params.threat + ' (threats felt further off), ' + k + ' combat intents: contacts x1.5, recovery x0.6; causal band up (constriction)'; } },
  { re: /make (\w+) cunning/i, name: 'cunning rather than aggressive', fn: (S, m) => { const id = m.actor; if (!id) return 'no actor named'; affect(S, id, { cunning: v => Math.min(1, v + 0.7), heat: v => v * 0.7 });
      const k = forIntents(S, I => I.actor === id && COMBAT.has(I.kind), I => { I.params = Object.assign({}, I.params, { amp: r4(((I.params || {}).amp || 1) * 0.6), wait: r4(((I.params || {}).wait || 0) + 0.4) }); });
      const C = S.authored.causal; let g = 0; if (C && C.actions[id]) for (const a of C.actions[id]) if (/wait|hide|watch|deceive|lure|feint|hold/.test(a.a)) { a.base = r4((a.base || 0) + 0.8); g++; }
      return id + ' cunning: ' + k + ' attacks smaller and later (amplitude x0.6, a 0.4 s wait), ' + g + ' patient actions valued higher (future options), motion x0.7'; } },
  { re: /cool (this|the) scene down/i, name: 'cool down', fn: (S) => { scaleBand(S, 'H1', 0.4, 0.85); scaleBand(S, 'H3', 0.35, 0.9); S.params = S.params || {}; S.params.camera = r4(Math.min(1.5, (S.params.camera || 1) * 1.25)); S.params.amp = r4(Math.max(0.35, (S.params.amp || 1) * 0.8));
      S.authored.camera = Object.assign({}, S.authored.camera, { elide: true });
      return 'motion target x0.4-0.85 of now, contrast target x0.35-0.9 of now, amplitude x0.8, camera further (x1.25: less definition), the camera lane elides effects (the audience completes them)'; } },
];
/* the actor the words name: an id containing the word (odysseus -> odysseus-revealed; polyphemus as a unit of the scene) */
function actorNamed(S, M, word) { if (!word) return null; const w = word.toLowerCase(), ids = Object.keys(M.H || {}).concat(Object.keys(S.actors || {}));
  return ids.find(id => id === w) || ids.find(id => id.startsWith(w)) || ids.find(id => id.includes(w)) || null; }
function apply(S, M, text, cur) {
  CUR = cur || null;
  for (const row of TABLE) { const m = text.match(row.re); if (!m) continue; m.actor = actorNamed(S, M, m[1]); const did = row.fn(S, m);
    S.log = S.log || {}; (S.log.patches = S.log.patches || []).push({ text, patch: row.name, did, lock: !!row.lock, at: new Date().toISOString().slice(0, 19) });
    return { row: row.name, did, lock: !!row.lock }; }
  return null;
}
/* a timeline diff: events matched by actor, lane and kind to the nearest in time */
function diff(a, b, o = {}) {
  const keep = e => ['INTENT', 'ACTION', 'CONTACT', 'PROP', 'STIMULUS'].includes(e.lane) && !e.derived && e.kind !== 'BLOCKING';
  const A = a.filter(keep), B = b.filter(keep), used = new Set(), out = { added: [], removed: [], shifted: [], changed: [] };
  for (const e of A) { let best = null, bd = 1e9; for (const f of B) { if (used.has(f) || f.actor !== e.actor || f.lane !== e.lane || (f.kind !== e.kind && !(e.lane === 'INTENT' && f.id === e.id))) continue; const d = Math.abs(f.t0 - e.t0); if (d < bd && d < 1.5) { bd = d; best = f; } }
    if (!best) { out.removed.push(brief(e)); continue; } used.add(best);
    if (best.kind !== e.kind) out.changed.push({ ...brief(e), to: best.kind });
    if (Math.abs(best.t0 - e.t0) > 0.08 || Math.abs(best.t1 - e.t1) > 0.15) out.shifted.push({ ...brief(e), dt0: r4(best.t0 - e.t0), dt1: r4(best.t1 - e.t1) }); }
  for (const f of B) if (!used.has(f)) out.added.push(brief(f));
  out.counts = { added: out.added.length, removed: out.removed.length, shifted: out.shifted.length, changed: out.changed.length };
  return out;
}
const brief = e => ({ id: e.id, lane: e.lane, actor: e.actor, kind: e.kind, t0: e.t0, t1: e.t1, label: e.label });
/* how much each actor's body changed between two sheets: mean absolute channel difference over the scene (radians, or units) */
function bodyDiff(M, C1, C2) { const Ch = require('../../film-readymades/choreo.js'), out = {};
  for (const id of new Set([...Object.keys(C1.actors || {}), ...Object.keys(C2.actors || {})])) { let s = 0, k = 0;
    for (let t = 0; t < M.total; t += 1 / 6) { const a = Ch.sampleActor(C1, id, t) || {}, b = Ch.sampleActor(C2, id, t) || {}; for (const c of new Set([...Object.keys(a), ...Object.keys(b)])) { if (/root\.[xyz]|hips/.test(c)) continue; s += Math.abs((a[c] || 0) - (b[c] || 0)); k++; } }
    out[id] = r4(k ? s / k : 0); } return out; }
module.exports = { TABLE, apply, diff, bodyDiff, actorNamed };
