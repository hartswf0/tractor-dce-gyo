/* tools/perform/scenes/_auto.js — a first score for any prepared scene, from the needs catalogue (odyssey/perform/needs.json: its
   intents with actors, times and targets, its spoken lines with their acts, its causal chain) and the take's marks. A scene module
   (tools/perform/scenes/<scene>.js) replaces it when a director writes one; until then this gives every figure a caused performance:
     the chain         each step a STIMULUS caused by the step before; an intent in a step's span is caused by it
     the lines         speech acts (GREET -> WELCOME; COMMAND, DECLARE, TAUNT, REVEAL, CURSE, WARN, INSTRUCT, REPORT, CONDEMN -> DECLARE with
                       the line's gesture); the one addressed LISTENs
     the intents       kinds mapped onto the realisers (aliases below); a group name ('crew', 'scout-1') resolved to the scene's ids;
                       kinds with no realiser yet (TRANSFORM, ANIMAL:*, GROPE, RIDE ...) recorded as notes, not faked
     the walks         the layout's walks owned by an APPROACH toward the nearest principal
     everyone          a HOLD with a reason (present, attending the principals and whoever speaks), so a stillness is a chosen one */
'use strict';
const ALIAS = { ROPE_WORK: ['ROPE', { how: 'haul' }], HAUL: ['ROPE', { how: 'haul' }], STRIKE: ['SWING', { hit: true }], GRAPPLE: ['SEIZE', {}], CARESS: ['HOLD_ON', {}], WAKE: ['RISE', {}],
  CLIMB: ['STRAIN', {}], BRACE: ['STRAIN', {}], LIFT: ['STRAIN', {}], MOVE_STONE: ['STRAIN', {}], STRING_BOW: ['STRAIN', {}], SWIM: ['STRUGGLE', {}], DROWN: ['STRUGGLE', {}], DIE: ['FALL', {}],
  WEAVE: ['TOOL_WORK', { how: 'carve' }], PLUCK: ['TOOL_WORK', { how: 'carve' }], PLAY_INSTRUMENT: ['TOOL_WORK', { how: 'carve' }], CUT: ['TOOL_WORK', { how: 'chop' }], GUARD: ['HOLD', {}], CROWD: ['HOLD', {}],
  PURSUE: ['PURSUIT', {}], TURN_AWAY: ['ATTEND', { front: true }], ROW: ['ROW', {}] };
const NONE = new Set(['TRANSFORM', 'GROPE', 'RIDE', 'LOCOMOTE', 'LEAVE', 'CIRCLE']);
const SPEECH = { GREET: 'WELCOME', WELCOME: 'WELCOME' };
module.exports = function author(M, X, N) {
  const T = M.total, ids = Object.keys(M.H || {}).filter(id => M.keys.some(k => k.snap[id] && k.snap[id].vis)), q = t => Math.round(t * 12) / 12;
  const notes = [], intents = [], holds = [], stimuli = [];
  /* a name in the catalogue to the scene's ids: exact, the numbered member, a prefix, a word; a plural group to all of it */
  function resolve(name) { if (!name) return []; const n = String(name).toLowerCase(); if (ids.includes(n)) return [n];
    const num = n.match(/^(.*?)-(\d+)$/); if (num) { const hit = ids.filter(i => i.includes(num[1].replace(/s$/, '')) && i.endsWith('-' + num[2])); if (hit.length) return hit.slice(0, 1); }
    const stem = n.replace(/s$/, '').replace(/^the-/, ''); let hit = ids.filter(i => i.startsWith(stem) || i.startsWith('the-' + stem)); if (hit.length) return hit;
    hit = ids.filter(i => i.includes(stem)); if (hit.length) return hit;
    if (/crew|rower|men|companion|sailor|helms/.test(n)) { hit = ids.filter(i => /crew|scout|sailor|seized|companion/.test(i)); if (/helms/.test(n)) return hit.slice(-1); return hit; }
    return []; }
  const lines = N.lines || [], chain = N.chain || [];
  const principals = new Set(['odysseus', ...lines.map(l => resolve(l.speaker)[0]).filter(Boolean)].filter(i => ids.includes(i)));
  if (!principals.size && ids.length) principals.add(ids[0]);
  /* the chain */
  chain.forEach((c, k) => stimuli.push({ id: 'sC' + k, t0: k === 0 ? 0 : q(c.t), t1: q(c.t) + 0.3, kind: 'SCENE', label: String(c.what).slice(0, 110), because: k ? [{ id: 'sC' + (k - 1) }] : [] }));
  const stepAt = t => { let k = -1; chain.forEach((c, j) => { if (c.t <= t + 0.05) k = j; }); return k >= 0 ? [{ id: 'sC' + k }] : []; };
  /* the lines */
  for (const l of lines) { const clip = M.clips.find(c => c.gi === l.gi) || M.clips.find(c => c.kind === 'DIALOGUE' && Math.abs(c.at - l.t) < 1); const sp = resolve(l.speaker)[0]; if (!clip) { notes.push('line ' + l.gi + ': no clip'); continue; }
    if (!sp) { notes.push('line ' + l.gi + ' (' + l.speaker + ') has no body in the take: its voice is heard, no one acts it'); continue; }
    const to = resolve(l.to)[0] || [...principals].find(p => p !== sp) || null, kind = SPEECH[l.act] || 'DECLARE', shape = String(l.body || '').startsWith('GESTURE:') ? l.body.split(':')[1] : null;
    intents.push({ id: 'iL' + l.gi, actor: sp, kind, t0: q(clip.at) - 0.4, t1: q(clip.at + clip.dur), target: to, utterance: clip.gi, label: (l.act || '').toLowerCase() + ': ' + String(l.gist || '').slice(0, 60), params: shape ? { shapes: [shape, 'open', shape] } : {}, because: [{ id: 'v' + clip.gi, rel: 'realises' }].concat(stepAt(clip.at + 0.5).map(b => ({ ...b, rel: 'realises' }))) });
    if (to) intents.push({ id: 'iH' + l.gi, actor: to, kind: 'LISTEN', t0: q(clip.at), t1: q(clip.at + clip.dur), target: sp, label: 'hears ' + sp, params: {}, because: [{ id: 'v' + clip.gi, rel: 'realises' }] }); }
  /* the intents */
  (N.intents || []).forEach((it, k) => { let kind = it.kind, params = {}; const [base, sub] = kind.split(':');
    if (base === 'GESTURE') { kind = 'GESTURE'; params = { shape: sub, at: it.t0 + 0.3 }; } else if (base === 'REACT') { kind = 'REACT'; params = { how: sub }; } else if (base === 'ANIMAL' || NONE.has(base)) { notes.push(kind + ' (' + it.actor + ', ' + it.t0 + ' s): no realiser yet'); return; }
    else if (ALIAS[kind]) { params = { ...ALIAS[kind][1] }; kind = ALIAS[kind][0]; }
    const who = resolve(it.actor), tgt = it.target ? resolve(it.target)[0] || null : null; if (!who.length) { notes.push(kind + ': no body for "' + it.actor + '" in the take'); return; }
    who.slice(0, 6).forEach((a, j) => { const t0 = q(it.t0 + 0.12 * j), t1 = Math.max(t0 + 0.8, q(it.t1));
      if (kind === 'HOLD') { holds.push({ id: 'hN' + k + '_' + j, actor: a, t0, t1, reason: it.note || 'held', params: { look: [[tgt || [...principals][0], 2.2]] }, because: stepAt(it.t0) }); return; }
      if (kind === 'ATTEND' && params.front) { intents.push({ id: 'iN' + k + '_' + j, actor: a, kind: 'ATTEND', t0, t1, target: null, label: 'turns away', because: stepAt(it.t0) }); return; }
      const I = { id: 'iN' + k + '_' + j, actor: a, kind, t0, t1, target: tgt && tgt !== a ? tgt : (['SEIZE', 'EMBRACE', 'HOLD_ON', 'TEND', 'RECOGNISE', 'OFFER', 'TAKE', 'SWING', 'THROW', 'SHOOT', 'PURSUIT', 'ATTEND', 'NOTICE', 'LISTEN', 'THREAT'].includes(kind) ? [...principals].find(p => p !== a) || null : null), label: (it.verb || it.note || kind).toString().toLowerCase().slice(0, 60), params: { ...params, ...(it.params || {}) }, because: stepAt(it.t0) };
      if (['SEIZE', 'EMBRACE', 'HOLD_ON', 'TEND', 'RECOGNISE', 'SWING', 'THROW', 'SHOOT', 'PURSUIT', 'ATTEND', 'NOTICE', 'LISTEN', 'OFFER', 'TAKE', 'THREAT', 'DRAG'].includes(kind) && !I.target) { notes.push(kind + ' for ' + a + ': no one to do it to'); return; }
      if (kind === 'TAKE' || kind === 'OFFER') { I.kind = kind === 'TAKE' ? 'REACT' : 'GESTURE'; I.params = kind === 'TAKE' ? { how: 'lean', lookAt: I.target } : { shape: 'offer', at: t0 + 0.3 }; }
      if (kind === 'ROW') { I.kind = 'TOOL_WORK'; I.params = { how: 'dig', period: 2.6 }; I.label = 'rows'; }
      if (kind === 'FALL') I.params = { key: (M.keys.find(K => K.win && K.win[0] <= t1 && K.win[1] >= t0) || {}).id };
      intents.push(I); }); });
  /* the layout's walks: owned by an approach to the nearest principal */
  for (const K of M.keys) { if (!K.win || !K.moves) continue; for (const [id, m] of Object.entries(K.moves)) if (m.walk && ids.includes(id)) intents.push({ id: 'iW' + K.id + id, actor: id, kind: 'APPROACH', t0: K.win[0], t1: K.win[1], key: K.id, target: principals.has(id) ? null : [...principals][0], label: 'to the ' + K.id + ' mark', because: stepAt(K.win[0]).length ? stepAt(K.win[0]) : [] }); }
  /* everyone: a hold with a reason, attending the principals and whoever speaks */
  const speakers = lines.map(l => resolve(l.speaker)[0]).filter(Boolean);
  ids.forEach((id, k) => { const look = [...new Set([...principals, ...speakers])].filter(p => p !== id).slice(0, 3).map((p, j) => [p, 2.4 - 0.4 * j]); if (!look.length && ids.length > 1) look.push([ids[(k + 1) % ids.length], 2]);
    holds.push({ id: 'hAll' + k, actor: id, t0: 0.3, t1: T, reason: principals.has(id) ? 'at the centre of the scene: the others on him' : 'present: the eyes on who leads and who speaks', params: { look, weight: true, offset: 0.3 * k }, because: chain.length ? [{ id: 'sC0' }] : [] }); });
  return { type: /fight|battle/.test(N.type || '') ? 'fight' : /reveal|recogn/.test(N.type || '') ? 'revelation' : /labour|machine|ship|sea/.test(N.type || '') ? 'machinery' : 'dialogue', title: (N.title || M.scene) + ' (a first score from the needs catalogue)',
    actors: Object.fromEntries(ids.map(id => [id, { role: principals.has(id) ? 'principal' : 'present', body: 'minifig', principal: principals.has(id), group: id.replace(/-\d+$/, '') !== id ? id.replace(/-\d+$/, '') : undefined }])),
    objects: {}, authored: { intents, holds, stimuli, notes, from: 'odyssey/perform/needs.json (' + (N.updated || '') + ')' } };
};
