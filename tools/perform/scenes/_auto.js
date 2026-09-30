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
  /* the creatures: a giant, a ram, a dog, Scylla staged as set pieces in the take's keyframes (odyssey/keyframes/<scene>.json) become
     creature actors (film-readymades/creatures.js), placed where the take places the piece (its `at`, heading and scale at the first
     key it appears), in the preset its prop name implies (...Sprawl -> sprawl, ...Roar -> roar, else stand); the catalogue's intents
     for them are realised by tools/perform/intents-creature.js */
  const CKIND = [[/^polyphemus/i, 'polyphemus'], [/laestryg|antiphates/i, 'laestrygon'], [/^scylla/i, 'scylla'], [/^ram/i, 'ram'], [/argos|^dog/i, 'dog'], [/cattle|^cow/i, 'cattle']];
  const creatures = {}, cSeen = {}; let KF = null; try { KF = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', '..', '..', 'odyssey/keyframes', M.scene + '.json'), 'utf8')); } catch (e) { KF = null; }
  if (KF) for (const k of KF.keys || []) { const Kt = (M.keys.find(x => x.id === k.id) || {}).t; for (const pp of k.props || []) { const nm = String(pp.name || ''), hit = CKIND.find(([re]) => re.test(nm) || re.test(pp.id || '')); if (!hit || !Array.isArray(pp.at)) continue;
      const cid = pp.id || nm; if (Object.keys(creatures).length >= 6 && !creatures[cid]) continue;
      const pose = /sprawl/i.test(nm) ? 'sprawl' : /roar/i.test(nm) ? 'roar' : /graze/i.test(nm) ? 'graze' : /lie|dead|dying/i.test(nm) ? 'lie' : 'stand', at = [pp.at[0], pp.floor === false ? pp.at[1] : 0, pp.at[2], (pp.rot || [0, 0, 0])[1] || 0];
      if (!creatures[cid]) { creatures[cid] = { kind: hit[1], scale: Math.round((pp.scale || 1) * (M.scale || 1) * 1000) / 1000, at, procs: [] };   /* the take draws a prop at its scale x the location's (world units per LDU) */ cSeen[cid] = []; } cSeen[cid].push({ t: Kt != null ? Kt : 0, pose, at }); } }
  for (const [cid, L] of Object.entries(creatures)) { const seq = cSeen[cid].sort((a, b) => a.t - b.t);
    seq.forEach((x, j) => { if (x.pose === 'stand') return; const nx = seq.slice(j + 1).find(y => y.pose !== x.pose); L.procs.push({ type: 'preset', name: x.pose === 'roar' ? 'roar' : x.pose, from: j ? q(x.t) - 0.4 : 0, to: nx ? q(nx.t) - 0.4 : T, fade: j ? 0.6 : 0 }); }); }
  /* a name to creatures: the id, a part of it ('giant-girl' -> girl), or a kind's name for the unnamed of that kind ('laestrygonians' -> g1..g4) */
  const resolveCs = name => { if (!name) return []; const n = String(name).toLowerCase(), cs = Object.keys(creatures); let hit = cs.filter(c => c === n || c.startsWith(n) || n.startsWith(c)); if (hit.length) return hit.slice(0, 1);
    hit = cs.filter(c => n.split(/[-\s]/).includes(c)); if (hit.length) return hit.slice(0, 1);
    const kd = CKIND.find(([re]) => re.test(n.replace(/s$/, '').replace(/ian$/, ''))); if (kd) { const all = cs.filter(c => creatures[c].kind === kd[1]), anon = all.filter(c => /\d$/.test(c)); return anon.length ? anon : all; } return []; };
  const resolveC = name => resolveCs(name)[0] || null;
  if (Object.keys(creatures).length) notes.push('creatures: ' + Object.entries(creatures).map(([k, c]) => k + ' (' + c.kind + ', scale ' + c.scale + ')').join(', '));
  /* the chain */
  chain.forEach((c, k) => stimuli.push({ id: 'sC' + k, t0: k === 0 ? 0 : q(c.t), t1: q(c.t) + 0.3, kind: 'SCENE', label: String(c.what).slice(0, 110), because: k ? [{ id: 'sC' + (k - 1) }] : [] }));
  const stepAt = t => { let k = -1; chain.forEach((c, j) => { if (c.t <= t + 0.05) k = j; }); return k >= 0 ? [{ id: 'sC' + k }] : []; };
  /* the lines */
  for (const l of lines) { const clip = M.clips.find(c => c.gi === l.gi) || M.clips.find(c => c.kind === 'DIALOGUE' && Math.abs(c.at - l.t) < 1); const sp = resolve(l.speaker)[0]; if (!clip) { notes.push('line ' + l.gi + ': no clip'); continue; }
    if (!sp && resolveC(l.speaker)) { const cr = resolveC(l.speaker); intents.push({ id: 'iL' + l.gi, actor: cr, kind: 'TALK', t0: q(clip.at) - 0.2, t1: q(clip.at + clip.dur), utterance: clip.gi, label: (l.act || '').toLowerCase() + ': ' + String(l.gist || '').slice(0, 60), because: [{ id: 'v' + clip.gi, rel: 'realises' }] }); continue; }
    if (!sp) { notes.push('line ' + l.gi + ' (' + l.speaker + ') has no body in the take: its voice is heard, no one acts it'); continue; }
    const to = resolve(l.to)[0] || [...principals].find(p => p !== sp) || null, kind = SPEECH[l.act] || 'DECLARE', shape = String(l.body || '').startsWith('GESTURE:') ? l.body.split(':')[1] : null;
    intents.push({ id: 'iL' + l.gi, actor: sp, kind, t0: q(clip.at) - 0.4, t1: q(clip.at + clip.dur), target: to, utterance: clip.gi, label: (l.act || '').toLowerCase() + ': ' + String(l.gist || '').slice(0, 60), params: shape ? { shapes: [shape, 'open', shape] } : {}, because: [{ id: 'v' + clip.gi, rel: 'realises' }].concat(stepAt(clip.at + 0.5).map(b => ({ ...b, rel: 'realises' }))) });
    if (to) intents.push({ id: 'iH' + l.gi, actor: to, kind: 'LISTEN', t0: q(clip.at), t1: q(clip.at + clip.dur), target: sp, label: 'hears ' + sp, params: {}, because: [{ id: 'v' + clip.gi, rel: 'realises' }] }); }
  /* the intents */
  (N.intents || []).forEach((it, k) => { let kind = it.kind, params = {}; const [base, sub] = kind.split(':');
    if (base === 'GESTURE') { kind = 'GESTURE'; params = { shape: sub, at: it.t0 + 0.3 }; } else if (base === 'REACT') { kind = 'REACT'; params = { how: sub }; } else if (base === 'ANIMAL' || NONE.has(base)) { notes.push(kind + ' (' + it.actor + ', ' + it.t0 + ' s): no realiser yet'); return; }
    else if (ALIAS[kind]) { params = { ...ALIAS[kind][1] }; kind = ALIAS[kind][0]; }
    const crs = resolveCs(it.actor); for (const cr of crs.slice(0, 6)) { const CK = { THROW: 'THROW', THRUST: 'REACH', LIFT: null, LISTEN: 'ATTEND', ATTEND: 'ATTEND', RECOGNISE: 'RECOGNISE', GESTURE: 'GESTURE', SEIZE: 'SEIZE', GRAPPLE: 'SEIZE', EAT: 'EAT', GROPE: 'GROPE', STRIKE: 'STRIKE', ROAR: 'ROAR', SLEEP: 'SLEEP', WAKE: 'ROAR', REACH: 'REACH', HERD: 'HERD' }[base === 'GESTURE' ? 'GESTURE' : it.kind];
      if (CK === null) { const prev = intents.filter(x => x.actor === cr && x.kind === 'STRIKE').pop(); if (prev) { prev.t1 = Math.max(prev.t1, q(it.t1)); prev.params.lift = Math.max(2, q(it.t1) - prev.t0 - 1); } notes.push(it.kind + ' for ' + cr + ' (' + it.t0 + ' s): the lift of the strike before it (its span extended)'); return; }
      if (!CK) { notes.push(it.kind + ' for the creature ' + cr + ' (' + it.t0 + ' s): no creature realiser yet'); return; }
      const tg = it.target ? (resolve(it.target)[0] || resolveC(it.target) || it.target) : null;
      const j = crs.indexOf(cr), dt = 0.35 * j, stepTxt = (chain[(stepAt(it.t0)[0] || { id: 'sC-1' }).id.slice(2) | 0] || {}).what || '';
      const CK2 = CK === 'SEIZE' && /\beat|devour/i.test(stepTxt) ? 'EAT' : CK;
      intents.push({ id: 'iC' + k + (j ? '_' + j : ''), actor: cr, kind: CK2, t0: q(it.t0 + dt), t1: Math.max(q(it.t0 + dt) + 0.8, q(it.t1 + dt)), target: tg, label: (it.verb || it.note || it.kind).toString().toLowerCase().slice(0, 60), params: { ...params, ...(it.params || {}), ...(CK === 'THROW' ? { short: 0.8, prop: 'rock' + k + (j ? '_' + j : '') } : {}), ...(CK === 'GESTURE' ? { shape: sub } : {}), ...(CK === 'STRIKE' ? { targets: (resolve(it.target).filter(i => /seized/.test(i)).length ? resolve(it.target).filter(i => /seized/.test(i)) : resolve(it.target)).slice(0, 6) } : {}) }, because: stepAt(it.t0) }); }
    if (crs.length) return;
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
  /* the sea's machinery (needs: SEA, SHIP, RAFT, OARS): the level from the chain's words (a storm, a wave, a rock raise it; a landing, a
     calm lower it), the hulls from the take's pieces (a ship, a raft) with the figures the blocking puts aboard as riders (a rider's
     window ends at a SEPARATION from the hull and starts again at a RECOVER), a wave's blow on a hull from an IMPACT, the swimmers
     from SWIM, and the rowers on one clock with per-body offsets (0, +0.04, -0.03, ...) from ROW */
  const machinery = [], mk = new Set((N.machinery || []).map(m => m.kind));
  if (['SEA', 'SHIP', 'RAFT', 'OARS'].some(k => mk.has(k))) { const B = require('../body.js').Blocking(M);
    const HI = /storm|wind|wave|roll|swept|rock|strike|shatter|whirl|roar|charybdis|hurl|thunder|bolt|driv|stir|cloud|trident|swell|spray/i, CALM = /still|calm|drops/i, LO = /land|beach|meadow|moor|asleep/i;
    const level = [[0, chain.length && HI.test(chain[0].what) ? 0.55 : 0.25]], causes = [];
    chain.forEach((c, k) => { const v = CALM.test(c.what) ? 0.3 : HI.test(c.what) ? Math.max(level[level.length - 1][1], 0.5 + Math.min(0.5, 0.15 * (c.what.match(new RegExp(HI.source, 'gi')) || []).length)) : LO.test(c.what) ? 0.15 : null; if (v == null) return; level.push([q(Math.max(0.1, c.t - 0.2)), level[level.length - 1][1]], [q(c.t + 1.8), v]); causes.push({ t: c.t, id: 'sC' + k }); });
    const hullPcs = (M.pieces || []).filter(p => /ship|raft|hull|keel/i.test(p.label) && !/splash/i.test(p.label)).slice(0, 3);
    const rel = N.relations || [], hulls = hullPcs.map((pc, j) => { const [x0, y0, z0, x1, y1, z1] = pc.box, mx = (x1 - x0) * 0.08, mz = (z1 - z0) * 0.08, riders = [];
      for (const id of ids) { let on = null; for (let t = 0; t <= T + 1e-6; t += 0.5) { const b = B.at(id, t), inside = b && b.p && b.p[0] >= x0 - mx && b.p[0] <= x1 + mx && b.p[2] >= z0 - mz && b.p[2] <= z1 + mz && b.p[1] >= y0 - 12;
          if (inside && on == null) on = t; if ((!inside || t + 0.5 > T) && on != null) { riders.push([id, on, inside ? T : t]); on = null; } } }
      const cutAt = rel.filter(r => r.rel === 'SEPARATION'), backAt = rel.filter(r => r.rel === 'RECOVER');
      const out = []; for (const [id, a0, a1] of riders) { let w0 = a0; const sep = cutAt.filter(r => resolve(r.a).includes(id) && r.t > a0 && r.t < a1).map(r => r.t).sort((a, b) => a - b);
        for (const st of sep) { out.push([id, q(w0), q(st)]); const back = backAt.find(r => resolve(r.a).includes(id) && r.t > st); w0 = back ? back.t + 1.5 : 1e9; } if (w0 < a1) out.push([id, q(w0), q(a1)]); }
      const shore = (M.pieces || []).filter(p => /shore|crag|beach|land|cliff/i.test(p.label)).map(p => [(p.box[0] + p.box[3]) / 2, (p.box[2] + p.box[5]) / 2]).sort((u, v) => Math.hypot(u[0] - (x0 + x1) / 2, u[1] - (z0 + z1) / 2) - Math.hypot(v[0] - (x0 + x1) / 2, v[1] - (z0 + z1) / 2))[0];
      const impulses = rel.filter(r => r.rel === 'IMPACT' && /raft|ship|sea|mast|hull/i.test(r.b + ' ' + r.a)).map((r, k) => { const I = { t: r.t, roll: (k % 2 ? -1 : 1) * (/raft/i.test(pc.label) ? 0.9 : 0.35), pitch: 0.12, label: r.a + ' strikes ' + r.b, id: (causes.filter(c => c.t <= r.t + 0.2).pop() || {}).id };
        /* a rock into the sea near a ship: its wave front carries the hull toward the shore, until the next RECOVER or SEPARATION takes it back */
        if (/rock|boulder/i.test(r.a) && /sea/i.test(r.b) && shore && !/raft/i.test(pc.label)) { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, d = Math.hypot(shore[0] - cx, shore[1] - cz) || 1, L = Math.min(0.5 * d, 0.4 * Math.max(x1 - x0, z1 - z0));
          const nxt = rel.filter(q => (q.rel === 'RECOVER' || q.rel === 'SEPARATION') && q.t > r.t).map(q => q.t).sort((u, v) => u - v)[0];
          I.push = [q((shore[0] - cx) / d * L), q((shore[1] - cz) / d * L)]; I.backAt = nxt != null ? nxt : r.t + 5; I.back = 5; I.label = 'the rock\'s wave carries the ship toward the shore'; }
        return I; });
      return { id: j ? 'ship' + (j + 1) : 'ship', piece: pc.label, pivot: [q((x0 + x1) / 2), y0, q((z0 + z1) / 2)], riders: out.filter(r => r[2] - r[1] > 0.5), gain: /raft/i.test(pc.label) ? 2.2 : 1, omega: /raft/i.test(pc.label) ? 1.8 : 1.2, zeta: 0.28, impulses }; });
    const swimmers = []; (N.intents || []).filter(it => it.kind === 'SWIM').forEach(it => resolve(it.actor).slice(0, 6).forEach(a => swimmers.push({ actor: a, t0: q(it.t0), t1: q(it.t1) })));
    const rowers = [];
    (N.intents || []).filter(it => it.kind === 'ROW').forEach((it, k) => { const who = resolve(it.actor).slice(0, 8); if (!who.length) return; const OFF = [0, 0.04, -0.03, 0.02, -0.05, 0.03, -0.01, 0.05];
      machinery.push({ kind: 'ROWING', id: 'clock:row' + (k || ''), clock: { period: 2.6, t0: q(it.t0), t1: q(it.t1) }, offsets: Object.fromEntries(who.map((a, j) => [a, OFF[j % OFF.length]])), amp: 0.9 }); rowers.push(...who); });
    machinery.push({ kind: 'SEA', level, causes, hulls, swimmers, rowers });
    notes.push('the sea: level ' + level.map(([t, v]) => v.toFixed(2) + '@' + t.toFixed(1)).join(' ') + '; hulls ' + hulls.map(h => h.piece + ' (' + h.riders.length + ' rider windows)').join(', ') + (swimmers.length ? '; swimmers ' + swimmers.length : '') + (rowers.length ? '; rowers ' + rowers.length + ' on one clock' : ''));
    /* the rowers' ROW intents are the clock's, not a TOOL_WORK */
    for (let i = intents.length - 1; i >= 0; i--) if (intents[i].kind === 'TOOL_WORK' && intents[i].label === 'rows' && rowers.includes(intents[i].actor)) intents.splice(i, 1); }
  /* a generic causal model (declared, so the entropy is of these options and no others): every figure may stay as it is; its own
     intents are options that rise while they run and once their chain step has come; it may turn to a principal (more so while he
     speaks, less once it already sees him); a figure who is not a principal may leave, more so under a principal's heat; a
     principal answers each step of the chain until the next one comes */
  const causal = { tau: 0.8, generic: true, actions: {} }, P = [...principals];
  ids.forEach(id => { const acts = [{ a: 'stay as he is', base: 1.0, f: {} }], seen = new Set();
    for (const I of intents) { if (I.actor !== id || seen.has(I.kind)) continue; seen.add(I.kind); const st = (I.because || []).find(b => /^sC\d+$/.test(b.id));
      acts.push({ a: String(I.label || I.kind).slice(0, 40), base: -2.2, f: { ['intent:' + I.kind]: 3.2, ...(st ? { ['after:' + st.id]: 0.8 } : {}) } }); if (acts.length > 6) break; }
    for (const p of P.filter(p => p !== id).slice(0, 2)) acts.push({ a: 'turn to ' + p, base: -0.6, f: { ['speaking:' + p]: 1.6, ['sees:' + p]: -0.9 } });
    if (!principals.has(id) && P.length) acts.push({ a: 'leave', base: -2.6, f: { ['threat:' + P[0]]: 0.7, walking: 0.6 } });
    if (principals.has(id)) chain.slice(0, 6).forEach((c, k) => acts.push({ a: 'answer: ' + String(c.what).slice(0, 34), base: -3.0, f: { ['after:sC' + k]: 2.6, ...(k + 1 < chain.length ? { ['after:sC' + (k + 1)]: -2.6 } : {}) } }));
    causal.actions[id] = acts; });
  return { type: /fight|battle/.test(N.type || '') ? 'fight' : /reveal|recogn/.test(N.type || '') ? 'revelation' : /labour|machine|ship|sea/.test(N.type || '') ? 'machinery' : 'dialogue', title: (N.title || M.scene) + ' (a first score from the needs catalogue)',
    actors: { ...Object.fromEntries(ids.map(id => [id, { role: principals.has(id) ? 'principal' : 'present', body: 'minifig', principal: principals.has(id), group: id.replace(/-\d+$/, '') !== id ? id.replace(/-\d+$/, '') : undefined }])), ...Object.fromEntries(Object.entries(creatures).map(([k, c]) => [k, { role: 'a creature (' + c.kind + ')', body: 'prop' }])) },
    objects: Object.fromEntries(Object.entries(creatures).map(([k, c]) => [k, { kind: /polyphemus|laestrygon/.test(c.kind) ? 'giant' : c.kind, material: 'flesh', at: [c.at[0], 100, c.at[2]], affords: [] }])), authored: { intents, holds, stimuli, notes, causal, machinery, creatures, from: 'odyssey/perform/needs.json (' + (N.updated || '') + ')' } };
};
