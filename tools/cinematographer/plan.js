#!/usr/bin/env node
/* tools/cinematographer/plan.js — the shots of a take chosen from its performance, not from the blocking alone.

     node tools/cinematographer/plan.js OD-B09-S09 [--sheet odyssey/score/OD-B09-S09.choreo.json] [--out tools/cinematographer/plans]

   Reads the performance engine's score (odyssey/score/<scene>.json: stimulus, intent, action and contact events with their causes),
   its measures on the sheet the take plays (odyssey/score/measures/<scene>.json `after`: motion heat T_m per actor at 12 a second,
   the causal heat of each event, the heat of objects), the compiled sheet (its creatures and their procedures), and the scene's
   cineosis direction (odyssey/cineosis/score.json). Writes plans/<scene>.json (odyssey-shots/1): when each shot starts, on whom and on
   what, how large, from which side of which line, at what angle, and why. The cameras themselves are found in the player against
   the real set (solve.js), where the set, the cast at each drawing and the creature rigs are.

   THE RULES (numbered as the shot report cites them)
     R1 heat      each figure's heat per drawing = its motion heat (T_m over the scene's 95th percentile) + the causal heat of its
                  own events (an event's Tc over the scene's largest, on the figure while the event runs, rising 0.25 s before it)
                  + the weight of what it is doing (an intent's kind: a thrust or a roar is hotter than a nod) + its voice while a
                  phrase of its line sounds + a contact it is part of. A creature's heat is its intents' and its object heat.
                  The hot spot of a drawing is the hottest figure; it moves only when another has been hotter for 0.5 s.
     R2 contact   a contact event (the handoff's GRIP SYNC, an IMPACT, a SEIZE) is framed with every figure it names (and a
                  creature it is done to), aimed at the contact point; a handoff is a profile two-shot (the camera square to
                  the line between giver and taker, so the hands and the spear are not behind a head).
     R3 transfer  cuts are placed where heat moves: at the wind-up of the act that causes a contact (its cause intent), on the
                  impact (0.15 s before its first drawing: the cut on the action), at the first reaction to it (within its
                  latency, 1.5 s), at a creature's act, at each reaction to another's act, and where the hot spot changes.
     R4 cold      where the hottest figure is cold for a stretch, the shot is a wide held up to twice the rhythm's longest.
     R5 media     hot media (fast rhythm or close-and-insert bias over 0.5, and no ELIDE request): cause and effect are both
                  shown, in shots of their own. Cool media (a mid or slow rhythm with less close bias, or the CAMERA lane's
                  ELIDE): a cut across a cause and its effect on another figure elides the cause and shows the effect; a
                  handoff between principals is never elided (it is the scene's act).
     R6 direction the cineosis block: hold_min_s is every shot's floor, cut_rhythm its longest (fast 3.5 s, mid 6, slow 10),
                  shot_bias draws the size of a shot on a hot figure (a close where the contrast is high), insert_object is one
                  insert at the object's hottest moment (for the Blinding, the giant's eye as the stake comes in), empty_frame
                  lets a wide hold on the set, sound_forward keeps cuts off the lines' first second, move is the camera's move.
     R7 line      every shot names the two principals of its beat (the hot figure and whom it acts on, answers or speaks to):
                  the 180-degree line; the player keeps every camera of a line on the side its first shot took, so the
                  eyelines of reaction shots match (a reaction is cut on the same side as the shot of its cause).
     R8 giant     a shot on a creature is low (the lens below the men's chests, looking up) and wide (50-65 degrees), and
                  keeps the hottest men in frame for size.
     R9 length    no shot is shorter than the floor; two shots in a row on the same figure change size by at least one step
                  (no jump cut). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const F = 12;

/* ── what the planner weighs ── */
const KIND_W = {   /* the heat of doing a thing, over and above its motion (R1) */
  THRUST: 1.3, TWIST: 1.0, IMPACT: 1.5, STRAIN: 0.6, CARRY: 0.45, HEAT: 0.55, SIGNAL: 0.7, APPROACH: 0.4, RECOIL: 0.9, HIDE: 0.35, CLING: 0.45,
  ATTEND: 0.3, NOTICE: 0.8, SHAME: 0.6, DECIDE: 0.6, RISE: 0.5, SET_DOWN: 0.35, WELCOME: 0.75, GUARDED_WELCOME: 0.75, TAKE: 1.1, OFFER: 1.0,
  LEAD: 0.55, FOLLOW: 0.35, KNOCK: 0.8, ARRIVE: 0.55, GAMBLE: 0.12, DRINK: 0.15, POUR: 0.2, LISTEN: 0.25, REACT: 0.55, GESTURE: 0.5,
  SEIZE: 1.4, THROW: 1.3, STRIKE: 1.4, FALL: 1.0, LEAP: 1.0, SHOOT: 1.2, SWING: 1.2, FLEE: 0.8, STRUGGLE: 1.0, EMBRACE: 0.8, WEEP: 0.6,
  RETIME: 0, ADVANCE: 0, HOLD: 0,
  /* creatures (intents-creature.js) */
  TALK: 0.55, SLEEP: 0.12, BLINDED: 1.6, STIR: 0.8, ROAR: 1.5, WALK: 0.9, POSE: 0.2, GROPE: 0.9, REACH: 1.0, EAT: 1.2, HERD: 0.6,
  WATCH: 0.6, WAG: 0.75, EARS: 0.55, BREATHE: 0.08, DIE: 1.3, CRAWL: 1.2, GRAZE: 0.15,   /* a beast's small acts (Argos): each one meant */
};
const CREATURE_ACT = new Set(['BLINDED', 'ROAR', 'STIR', 'WALK', 'GROPE', 'REACH', 'SEIZE', 'EAT', 'THROW', 'STRIKE', 'HERD', 'WATCH', 'WAG', 'EARS', 'DIE', 'CRAWL']);
const REACTION = new Set(['REACT', 'NOTICE', 'RECOIL', 'ATTEND', 'SHAME', 'FLEE', 'DUCK', 'EVADE', 'STIR', 'BLINDED', 'ROAR']);
const HANDOFF = /GRIP|HANDOFF|GIVE/;
const LONGEST = { fast: 3.5, mid: 6, slow: 10 };
const SIZES = ['WIDE', 'MID', 'CLOSE'];

function hash32(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
const r2 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 1000) / 1000;
const bump = (t, a, b, rise = 0.25, fall = 0.5) => t < a - rise || t > b + fall ? 0 : t < a ? (t - (a - rise)) / rise : t <= b ? 1 : 1 - (t - b) / fall;

function load(sid, sheetPath) {
  const J = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const S = J(`odyssey/score/${sid}.json`), C = J(sheetPath || `odyssey/score/${sid}.choreo.json`);
  let M = null; try { M = J(`odyssey/score/measures/${sid}.json`).after; } catch (e) { }
  const cin = J('odyssey/cineosis/score.json').scenes.find(s => s.id === sid) || {};
  return { S, C, M, cin, sheetPath: sheetPath || `odyssey/score/${sid}.choreo.json` };
}

/* ═════ R1: the heat of every figure per drawing ═════ */
function heat(L) {
  const { S, C, M } = L;
  const total = S.total, n = Math.ceil(total * F) + 1, ev = S.events, byId = new Map(ev.map(e => [e.id, e]));
  const creatures = Object.keys(C.creatures || {});
  const figures = Object.keys(S.actors).filter(a => S.actors[a].body === 'minifig').concat(creatures.filter(c => !(S.actors[c] && S.actors[c].body === 'minifig')));
  const H = {}; for (const a of figures) H[a] = new Float32Array(n);
  const parts = {}; for (const a of figures) parts[a] = { motion: 0, causal: 0, act: 0, voice: 0, contact: 0 };
  /* motion heat */
  const Tm = (M && M.series && M.series.Tm) || {}; const all = []; for (const a in Tm) for (const x of Tm[a]) all.push(x); all.sort((a, b) => a - b);
  const p95 = all.length ? Math.max(1e-3, all[Math.floor(all.length * 0.95)]) : 1;
  for (const a of figures) { const s = Tm[a]; if (!s) continue; for (let i = 0; i < n; i++) { const v = Math.min(1.5, (s[Math.min(i, s.length - 1)] || 0) / p95) * 0.6; H[a][i] += v; parts[a].motion += v; } }
  /* a creature's object heat (its own motion as the engine measured it) */
  const OH = (M && M.objects) || {}; let omax = 1e-3; for (const c of creatures) if (OH[c]) omax = Math.max(omax, ...OH[c]);
  const eh = (M && M.eventHeat) || {}; let tcMax = 1e-3; for (const k in eh) tcMax = Math.max(tcMax, eh[k].Tc || 0);
  for (const e of ev) {
    if (!['INTENT', 'CONTACT', 'STIMULUS'].includes(e.lane)) continue;
    const who = e.lane === 'CONTACT' ? (e.actors || [e.actor]) : e.actor ? [e.actor] : []; if (!who.length) continue;
    const long = e.t1 - e.t0 > 4, w = e.lane === 'CONTACT' ? 1.6 : e.lane === 'STIMULUS' ? (e.kind === 'SOUND' ? 0.35 : 0.2) : (KIND_W[e.kind] ?? 0.3);
    const tc = eh[e.id] ? (eh[e.id].Tc || 0) / tcMax : 0;
    const i0 = Math.max(0, Math.floor((e.t0 - 0.3) * F)), i1 = Math.min(n - 1, Math.ceil((e.t1 + 0.6) * F));
    for (const a of who) { if (!H[a]) continue;
      for (let i = i0; i <= i1; i++) { const t = i / F; let b = bump(t, e.t0, e.t1); if (long && t > e.t0 + 3) b *= 0.45;   /* a long intent is hot as it starts, warm after */
        const v = b * (w + 0.6 * tc); H[a][i] += v; parts[a][e.lane === 'CONTACT' ? 'contact' : e.lane === 'STIMULUS' ? 'causal' : 'act'] += v; } }
  }
  /* the voice: a phrase of the figure's own line */
  for (const e of ev) { if (e.lane !== 'VOICE' || e.kind !== 'PHRASE') continue; const u = byId.get((e.because[0] || {}).id); const a = e.actor || (u && u.actor);
    const sp = a || (S.authored.intents || []).find(I => I.kind === 'TALK' && I.t0 <= e.t0 && I.t1 >= e.t1)?.actor; if (!sp || !H[sp]) continue;
    for (let i = Math.floor(e.t0 * F); i <= Math.min(n - 1, Math.ceil(e.t1 * F)); i++) { H[sp][i] += 0.35; parts[sp].voice += 0.35; } }
  for (const c of creatures) if (OH[c]) for (let i = 0; i < n; i++) { const v = 0.3 * (OH[c][Math.min(i, OH[c].length - 1)] || 0) / omax; H[c][i] += v; parts[c].motion += v; }
  /* principals a little hotter; crowds a little cooler (the engine's focus); the direction's subject (R6) hotter again */
  const subj = (L.cin.direction || {}).subject;
  for (const a of figures) { const A = S.actors[a] || {}, k = (A.principal ? 1.15 : A.group ? 0.85 : 1) * (a === subj ? 1.2 : 1); if (k !== 1) for (let i = 0; i < n; i++) H[a][i] *= k; }
  return { H, n, figures, creatures, parts, p95 };
}

/* the hot spot per drawing, with hysteresis: the hot figure changes only when another has been hotter for 0.5 s */
function hotSpot({ H, n, figures }) {
  const hot = new Array(n), level = new Float32Array(n), contrast = new Float32Array(n); let cur = null, rival = null, since = 0;
  for (let i = 0; i < n; i++) {
    let best = null, bv = -1; const vals = []; for (const a of figures) { const v = H[a][i]; vals.push(v); if (v > bv) { bv = v; best = a; } }
    vals.sort((a, b) => a - b); const med = vals[Math.floor(vals.length / 2)];
    if (cur == null) cur = best;
    if (best !== cur && bv > H[cur][i] * 1.15 + 0.05) { if (rival !== best) { rival = best; since = i; } if (i - since >= 6) { cur = best; rival = null; } } else rival = null;
    hot[i] = cur; level[i] = H[cur][i]; contrast[i] = H[cur][i] - med;
  }
  return { hot, level, contrast };
}

/* ═════ anchors: the acts the cut must turn on (R2, R3, R5) ═════ */
function anchors({ S, C }, fig) {
  const ev = S.events, byId = new Map(ev.map(e => [e.id, e])), out = [];
  const actorOf = e => e && (e.actor || (e.actors || [])[0]);
  /* who speaks at t (a word of a line whose voice has no figure: the figure whose TALK or speech intent is running) */
  const SPEECH = new Set(['TALK', 'WELCOME', 'GUARDED_WELCOME']);
  const speakerAt = t => { const I = ev.find(x => x.lane === 'INTENT' && SPEECH.has(x.kind) && x.t0 <= t + 0.05 && x.t1 >= t); if (I) return I.actor; const V = ev.find(x => x.lane === 'VOICE' && x.kind === 'UTTERANCE' && x.actor && x.t0 <= t && x.t1 >= t); return V ? V.actor : null; };
  /* the attacker's wind-up: the earliest of its own intents in the chain that led to the act, within 5 s of it */
  const windup = (e, c) => { if (!c) return null; let w = c; const seen = new Set(); let q = [c]; while (q.length) { const x = q.shift(); for (const b of x.because || []) { const y = byId.get(b.id); if (!y || seen.has(y.id)) continue; seen.add(y.id); if (y.lane === 'INTENT' && y.actor === c.actor && y.kind !== 'HOLD' && y.kind !== 'RETIME' && y.t0 >= e.t0 - 5 && y.t0 < w.t0) w = y; if (y.t0 >= e.t0 - 6) q.push(y); } } return w; };
  /* the intent that caused an event, walking its causes back to an intent of another figure or of the same (its wind-up) */
  const causeIntent = e => { const seen = new Set(); let q = [e]; while (q.length) { const x = q.shift(); for (const b of x.because || []) { const c = byId.get(b.id); if (!c || seen.has(c.id)) continue; seen.add(c.id); if (c.lane === 'INTENT' && c.kind !== 'HOLD' && c.kind !== 'RETIME') return c; q.push(c); } } return null; };
  for (const e of ev) {
    if (e.lane === 'CONTACT') {
      const cause0 = causeIntent(e), cause = windup(e, cause0) || cause0, who = e.actors || [e.actor];
      /* what it causes: intents that name it (or name its cause) as their cause, starting within 1.5 s */
      const effects = ev.filter(x => x.lane === 'INTENT' && x.t0 >= e.t0 - 0.2 && x.t0 <= e.t0 + 1.5 && (x.because || []).some(b => b.id === e.id || (cause0 && b.id === cause0.id)) && !who.includes(x.actor));
      const target = effects.find(x => fig.creatures.includes(x.actor)) || effects[0] || null;
      const handoff = HANDOFF.test(e.kind);
      out.push({ type: 'contact', id: e.id, kind: e.kind, t: e.t0, t1: e.t1, actors: who, handoff, meet: e.params && e.params.meet || null, label: e.label,
        cause: cause ? { id: cause.id, actor: cause.actor, kind: cause.kind, t: cause.t0 } : null,
        effect: target ? { id: target.id, actor: target.actor, kind: target.kind, t: target.t0 } : null });
    }
  }
  for (const e of ev) {
    if (e.lane !== 'INTENT' || !e.actor) continue;
    if (fig.creatures.includes(e.actor) && CREATURE_ACT.has(e.kind)) out.push({ type: 'creature', id: e.id, kind: e.kind, t: e.t0, t1: e.t1, actors: [e.actor], label: e.label, cause: (() => { const c = causeIntent(e); return c && c.actor !== e.actor ? { id: c.id, actor: c.actor, kind: c.kind, t: c.t0 } : null; })() });
    else if (REACTION.has(e.kind)) {
      /* a reaction to another's act or to a stimulus someone made: the cause's figure is the other end of the line */
      let src = null; for (const b of e.because || []) { const c = byId.get(b.id); if (!c) continue; const a = actorOf(c) || (c.because || []).map(x => actorOf(byId.get(x.id))).find(Boolean) || speakerAt(c.t0); if (a && a !== e.actor) { src = { id: c.id, actor: a, t: c.t0, latency: b.latency }; break; } }
      if (src) out.push({ type: 'reaction', id: e.id, kind: e.kind, t: e.t0, t1: e.t1, actors: [e.actor], label: e.label, cause: src });
    }
  }
  out.sort((a, b) => a.t - b.t);
  /* reactions of several figures to one cause within 0.3 s are one reaction of the group */
  const merged = []; for (const a of out) { const grp = f => (S.actors[f] || {}).group || null, m = a.type === 'reaction' && grp(a.actors[0]) && merged.find(x => x.type === 'reaction' && x.cause.id === a.cause.id && Math.abs(x.t - a.t) < 0.3 && grp(x.actors[0]) === grp(a.actors[0])); if (m) { m.actors.push(...a.actors); m.t1 = Math.max(m.t1, a.t1); } else merged.push(Object.assign({}, a, { actors: a.actors.slice() })); }
  for (const m of merged) if (m.type === 'reaction' && m.actors.length > 1) m.actors.sort((x, y) => (S.actors[y] && S.actors[y].principal ? 1 : 0) - (S.actors[x] && S.actors[x].principal ? 1 : 0));
  return merged;
}

/* ═════ the plan ═════ */
function plan(sid, opts = {}) {
  const L = load(sid, opts.sheet), { S, C, cin } = L, total = S.total;
  const D = cin.direction || {}, rhythm = D.cut_rhythm || 'mid', floor = Math.max(1.2, D.hold_min_s || 1.5), longest = Math.max(floor + 0.5, LONGEST[rhythm] || 6);
  const bias = D.shot_bias || { WIDE: 0.3, MID: 0.4, CLOSE: 0.3 };
  const cam = (S.authored && S.authored.camera) || {};
  const elideReq = !!cam.elide || S.events.some(e => e.lane === 'CAMERA' && e.kind === 'ELIDE');
  const followReq = !!cam.follow || S.events.some(e => e.lane === 'CAMERA' && e.kind === 'FOLLOW');
  const hotMedia = !elideReq && (rhythm === 'fast' || (bias.CLOSE || 0) + (bias.OBJ || 0) > 0.5);
  const media = hotMedia ? 'hot' : 'cool';
  const fig = heat(L), hs = hotSpot(fig), A = anchors(L, fig);
  const at = t => Math.max(0, Math.min(fig.n - 1, Math.round(t * F)));
  const principals = Object.keys(S.actors).filter(a => S.actors[a].principal);

  /* R3: the cuts, by priority: 3 an act the cut must turn on, 2 a reaction or a transfer of heat, 1 a line's start */
  const cand = [];
  for (const a of A) {
    if (a.type === 'contact') {
      const elide = media === 'cool' && !a.handoff && a.effect;
      if (a.cause && a.cause.actor && a.t - a.cause.t > floor * 0.8) cand.push({ t: Math.max(a.cause.t - 0.2, a.t - longest), p: 3, why: `wind-up of ${a.cause.kind} (${a.cause.id}) before ${a.kind}`, anchor: a, role: 'windup' });
      if (!elide) cand.push({ t: a.handoff ? a.t - Math.max(1.2, floor * 0.6) : a.t - 0.15, p: 3, why: a.handoff ? `the ${a.kind} (${a.id}): both hands and what passes` : `cut on the action: ${a.kind} (${a.id})`, anchor: a, role: 'contact' });
      if (a.effect) cand.push({ t: elide ? a.effect.t : Math.max(a.effect.t, (a.handoff ? a.t + 0.5 : a.t - 0.15 + floor)), p: 3, why: (elide ? 'cool cut: the cause elided, ' : '') + `the effect ${a.effect.kind} on ${a.effect.actor} (${a.effect.id})`, anchor: a, role: 'effect', elided: elide });
    } else if (a.type === 'creature') cand.push({ t: a.t, p: 2.6, why: `the creature acts: ${a.kind} (${a.id})`, anchor: a, role: 'creature' });
    else if (a.type === 'reaction') { const lat = a.t - a.cause.t; if (lat >= -0.1 && lat <= 1.5) {
      /* how much the reaction matters: the reactors' heat while it runs, more for a principal, less for one of a crowd */
      let h = 0; for (const who of a.actors) { const f = fig.H[who]; if (!f) continue; let m = 0; for (let i = at(a.t); i <= at(a.t + 1); i++) m = Math.max(m, f[i]); const A_ = S.actors[who] || {}; h = Math.max(h, m * (A_.principal ? 1.4 : A_.group ? 0.6 : 1)); }
      cand.push({ t: a.t, p: 1.2 + Math.min(1.5, h) + (a.actors.some(w => (S.actors[w] || {}).principal) ? 0.5 : 0), why: `reaction ${a.kind} of ${a.actors.join(', ')} to ${a.cause.actor} (${a.cause.id}) in ${r2(lat)} s`, anchor: a, role: 'reaction' }); } }
  }
  const groupOf = f => (S.actors[f] || {}).group || f;
  for (let i = 1; i < fig.n; i++) if (hs.hot[i] !== hs.hot[i - 1] && groupOf(hs.hot[i]) !== groupOf(hs.hot[i - 1]) && hs.level[i] >= 0.45) cand.push({ t: i / F - 0.25, p: 1.8, why: `heat moves: ${hs.hot[i - 1]} -> ${hs.hot[i]}`, role: 'transfer', from: hs.hot[i - 1], to: hs.hot[i] });
  for (const e of S.events) if (e.lane === 'VOICE' && ['UTTERANCE', 'NARRATION'].includes(e.kind)) cand.push({ t: D.sound_forward ? e.t0 + 1.2 : e.t0, p: 1, why: `a line begins (${e.id})`, role: 'line' });
  cand.sort((a, b) => b.p - a.p || a.t - b.t);
  /* place by priority: a cut is kept when it is a floor clear of every cut kept before it */
  const cuts = [{ t: 0, p: 9, why: 'the scene opens', role: 'open' }];
  for (const c of cand) { if (c.t < floor || c.t > total - floor) continue; if (cuts.some(k => Math.abs(k.t - c.t) < floor - 1e-6)) continue; cuts.push(c); }
  cuts.sort((a, b) => a.t - b.t);
  /* R4/R6: split what is longer than the rhythm allows (a cold stretch may hold twice as long), at the largest change of heat */
  for (let guard = 0; guard < 200; guard++) {
    let changed = false;
    for (let k = 0; k < cuts.length; k++) {
      const a = cuts[k].t, b = k + 1 < cuts.length ? cuts[k + 1].t : total; let lv = 0; for (let i = at(a); i < at(b); i++) lv += hs.level[i]; lv /= Math.max(1, at(b) - at(a));
      const cold = lv < 0.45, lim = cold ? longest * 2 : longest; if (b - a <= lim) continue;
      /* the best split: near an even share of the stretch, where the hot figure's heat changes most, a floor clear of both ends */
      const m = Math.ceil((b - a) / lim), share = (b - a) / m, lo = Math.max(a + floor, a + share * 0.7), hi = Math.min(b - floor, a + share * 1.3);
      let best = null, bv = -1; for (let i = at(lo); i <= at(hi); i++) { const d = Math.abs(hs.level[i] - hs.level[Math.max(0, i - 6)]) + (hs.hot[i] !== hs.hot[Math.max(0, i - 6)] ? 0.5 : 0) - 0.02 * Math.abs(i / F - (a + share)); if (d > bv) { bv = d; best = i / F; } }
      if (best == null) best = (a + b) / 2;
      cuts.splice(k + 1, 0, { t: best, p: 0.5, why: `${cold ? 'a cold stretch' : 'the rhythm'} (${rhythm}, longest ${lim} s): cut where the heat changes most`, role: 'rhythm' }); changed = true; break;
    }
    if (!changed) break;
  }

  /* ── what each shot is on ── */
  const shots = [];
  const insertName = D.insert_object || null; let insertDone = false;
  const creatureIds = fig.creatures;
  const hotIn = (a, b, excl = []) => { const acc = {}; for (let i = at(a); i < at(b); i++) for (const f of fig.figures) if (!excl.includes(f)) acc[f] = (acc[f] || 0) + fig.H[f][i]; return Object.entries(acc).sort((x, y) => y[1] - x[1]).map(([f, v]) => ({ f, v: v / Math.max(1, at(b) - at(a)) })); };
  const partnerOf = (who, a, b) => {
    /* whom the figure acts on, answers or speaks to in [a, b]: a contact partner, the target of its intent, the cause of its reaction */
    for (const x of A) { if (x.t > b || (x.t1 || x.t) < a) continue; if (x.type === 'contact' && x.actors.includes(who)) return x.actors.find(y => y !== who) || (x.effect && x.effect.actor) || null;
      if (x.type === 'reaction' && x.actors[0] === who) return x.cause.actor; if (x.type === 'creature' && x.actors[0] === who && x.cause) return x.cause.actor; }
    const I = (S.authored.intents || []).find(I => I.actor === who && I.t0 <= b && I.t1 >= a && typeof I.target === 'string' && (S.actors[I.target] || creatureIds.includes(I.target)));
    if (I) return I.target;
    const others = hotIn(a, b, [who]); return others.length ? others[0].f : null;
  };
  let seriesPrev = null;
  for (let k = 0; k < cuts.length; k++) {
    const c = cuts[k], t0 = c.t, t1 = k + 1 < cuts.length ? cuts[k + 1].t : total, mid = (t0 + t1) / 2;
    let lv = 0, ct = 0; for (let i = at(t0); i < at(t1); i++) { lv += hs.level[i]; ct += hs.contrast[i]; } const nn = Math.max(1, at(t1) - at(t0)); lv /= nn; ct /= nn;
    const ranked = hotIn(t0, t1), hot = ranked[0] ? ranked[0].f : null;
    const sh = { i: k, t0: r3(t0), t1: r3(t1), kind: 'MID', size: 'MID', subjects: [], primary: null, aim: 'head', line: null, angle: 'eye', lens: 'normal', why: { cut: c.why, rule: null, heat: r2(lv), contrast: r2(ct), hot } };
    const A2 = c.anchor, inside = A.filter(x => x.type === 'contact' && x.t >= t0 && x.t < t1);
    const crInside = A.filter(x => x.type === 'creature' && x.t < t1 && (x.t1 || x.t) > t0);
    if (k === 0) { Object.assign(sh, { kind: 'WIDE', size: 'WIDE', subjects: ranked.slice(0, 3).map(x => x.f), primary: hot }); sh.why.rule = 'R6 the opening wide (establishes the set and the line)'; }
    else if (inside.length && !(c.role === 'effect' && c.elided)) {
      const x = inside[0]; const subj = x.actors.slice(); if (x.effect && creatureIds.includes(x.effect.actor)) subj.push(x.effect.actor);
      Object.assign(sh, { kind: x.handoff ? 'TWO' : 'ACTION', size: x.handoff ? 'MID' : 'WIDE', subjects: subj, primary: x.actors[0], aim: 'contact', contact: { id: x.id, kind: x.kind, t: x.t, meet: x.meet }, line: [x.actors[0], x.handoff ? x.actors[1] : (x.effect ? x.effect.actor : x.actors[1])] });
      if (x.handoff) { sh.profile = true; sh.why.rule = `R2 the handoff ${x.id} (${x.kind}) framed in profile: both figures, both hands and what passes`; }
      else { sh.why.rule = `R2 the contact ${x.id} (${x.kind}: ${x.label}) with every figure it names` + (x.effect && creatureIds.includes(x.effect.actor) ? ' and the creature it is done to' : ''); }
      if (x.effect && creatureIds.includes(x.effect.actor)) { sh.giant = x.effect.actor; sh.primary = x.effect.actor; sh.angle = 'low'; sh.lens = 'wide'; sh.why.rule += '; R8 low and wide on the giant (his eye is what the frame must hold; the men are there for size)'; }
    }
    else if (c.role === 'windup' && A2) {
      const who = A2.cause.actor, grp = (S.actors[who] || {}).group; const crew = A2.actors.filter(y => y !== who);
      Object.assign(sh, { kind: 'MID', size: 'MID', subjects: [who, ...crew.slice(0, 3)], primary: who, line: [who, A2.effect ? A2.effect.actor : crew[0]], aim: 'group' });
      sh.why.rule = `R3 the wind-up: ${A2.cause.kind} of ${who} (${A2.cause.id}), the cause of ${A2.kind} ${A2.id}`;
      if (A2.effect && creatureIds.includes(A2.effect.actor)) { sh.subjects.push(A2.effect.actor); sh.giant = A2.effect.actor; sh.angle = 'low'; sh.lens = 'wide'; sh.size = 'WIDE'; sh.why.rule += '; R8 the giant in frame, low and wide'; }
    }
    else if (c.role === 'effect' && A2) {
      const who = A2.effect.actor;
      if (creatureIds.includes(who)) { Object.assign(sh, { kind: 'GIANT', size: 'MID', subjects: [who, ...A2.actors.slice(0, 2)], primary: who, giant: who, angle: 'low', lens: 'wide', aim: 'head', line: [A2.actors[0], who] }); sh.why.rule = `R3 the effect of ${A2.kind}: ${A2.effect.kind} of ${who}` + (c.elided ? ' (R5 cool: the cause elided)' : '') + '; R8 low and wide with the men for size'; }
      else { Object.assign(sh, { kind: 'REACT', size: 'CLOSE', subjects: [who], primary: who, line: [A2.actors[0], who] }); sh.why.rule = `R3 the effect of ${A2.kind} on ${who}` + (c.elided ? ' (R5 cool: the cause elided)' : ''); }
    }
    else if (c.role === 'reaction' && A2) {
      const who = A2.actors[0], src = A2.cause.actor;
      Object.assign(sh, { kind: 'REACT', size: A2.actors.length > 1 ? 'MID' : 'CLOSE', subjects: A2.actors.slice(), primary: who, line: [src, who] }); sh.why.rule = `R3/R7 reaction of ${A2.actors.join(', ')} to ${src} within ${r2(A2.t - A2.cause.t)} s, cut on the same side as its cause (the eyelines match)`;
      if (creatureIds.includes(who)) { sh.kind = 'GIANT'; sh.size = 'MID'; sh.giant = who; sh.angle = 'low'; sh.lens = 'wide'; sh.subjects.push(...ranked.filter(x => !creatureIds.includes(x.f)).slice(0, 2).map(x => x.f)); sh.why.rule += '; R8'; }
    }
    else if (crInside.length && (hot && creatureIds.includes(hot) || c.role === 'creature')) {
      const x = c.role === 'creature' ? A2 : crInside[0], who = x.actors[0];
      const men = ranked.filter(y => !creatureIds.includes(y.f)).slice(0, 2).map(y => y.f);
      Object.assign(sh, { kind: 'GIANT', size: x.kind === 'WALK' || x.kind === 'ROAR' ? 'WIDE' : 'MID', subjects: [who, ...men], primary: who, giant: who, angle: 'low', lens: 'wide', aim: 'head', line: men[0] ? [men[0], who] : null });
      sh.why.rule = `R8 the creature acts (${x.kind} ${x.id}): low and wide with ${men.join(', ') || 'the set'} in frame for size`;
    }
    else if (lv < 0.45 && ct < 0.3) { Object.assign(sh, { kind: 'WIDE', size: 'WIDE', subjects: ranked.slice(0, 3).map(x => x.f), primary: hot }); sh.why.rule = 'R4 cold: hold wide' + (D.empty_frame ? ' (R6 empty_frame: the set may carry it)' : ''); }
    else if (hot) {
      /* R6: a size drawn from the direction's bias, pushed closer by the contrast of the hot spot */
      const r = (hash32(sid + ':' + k) % 1000) / 1000, w = { WIDE: bias.WIDE || 0, MID: bias.MID || 0, CLOSE: (bias.CLOSE || 0) * (ct > 0.5 ? 1.6 : 1) }, sum = w.WIDE + w.MID + w.CLOSE || 1; let u = r * sum, size = 'MID'; for (const s of SIZES) { if ((u -= w[s]) < 0) { size = s; break; } }
      const partner = partnerOf(hot, t0, t1);
      Object.assign(sh, { kind: size === 'WIDE' ? 'WIDE' : 'HOT', size, subjects: size === 'WIDE' ? ranked.slice(0, 3).map(x => x.f) : [hot], primary: hot, line: partner ? [partner, hot] : null });
      if (creatureIds.includes(hot)) { Object.assign(sh, { kind: 'GIANT', giant: hot, angle: 'low', lens: 'wide' }); sh.subjects = [hot, ...ranked.filter(y => !creatureIds.includes(y.f)).slice(0, 2).map(y => y.f)]; }
      sh.why.rule = `R1 the hot spot ${hot} (heat ${r2(lv)}, contrast ${r2(ct)}): ${size} by the direction's bias` + (creatureIds.includes(hot) ? '; R8' : '');
    }
    /* R6: the insert, once, at the insert object's hottest moment */
    if (!insertDone && insertName && k > 0) {
      const eye = /stake|eye|point/i.test(insertName) && creatureIds.length && A.find(x => x.type === 'contact' && x.effect && creatureIds.includes(x.effect.actor));
      if (eye && c.role === 'windup') { /* the insert is the last of the carry: the point coming to the giant's eye */ }
      if (eye && t1 <= eye.t + 0.05 && t1 > eye.t - 0.2 && c.role !== 'contact') { Object.assign(sh, { kind: 'INSERT', size: 'CLOSE', subjects: [eye.effect.actor], primary: eye.effect.actor, aim: 'eye', giant: eye.effect.actor, angle: 'eye', lens: 'normal', insert: `${insertName}: the giant's eye as the point comes in` }); sh.why.rule = `R6 insert_object "${insertName}": the giant's eye as the stake comes in (${eye.id} at ${r2(eye.t)} s)`; insertDone = true; }
    }
    shots.push(sh);
  }
  /* the insert for a scene whose object is not the Blinding's eye: at the object's hottest moment, taking the shot there */
  if (insertName && !insertDone) {
    const obj = Object.keys(S.objects || {}).find(o => insertName.toLowerCase().includes(o));
    if (obj && L.M && L.M.objects && L.M.objects[obj]) { const s = L.M.objects[obj]; let bi = 0; for (let i = 0; i < s.length; i++) if (s[i] > s[bi]) bi = i; const t = bi / F, sh = shots.find(x => t >= x.t0 && t < x.t1);
      if (sh && sh.kind !== 'ACTION' && sh.kind !== 'TWO') { const hold = S.objects[obj].holder ? S.objects[obj].holder.split(':')[0] : null; Object.assign(sh, { kind: 'INSERT', size: 'CLOSE', subjects: hold ? [hold] : sh.subjects, aim: hold ? 'hands' : 'head', object: obj, insert: insertName }); sh.why.rule = `R6 insert_object "${insertName}" at its hottest (${r2(t)} s)`; } }
  }
  /* R9: the same figure twice in a row changes size */
  for (let k = 1; k < shots.length; k++) { const a = shots[k - 1], b = shots[k]; if (a.primary && a.primary === b.primary && a.size === b.size && !['ACTION', 'TWO', 'WIDE', 'INSERT'].includes(a.kind) && !['ACTION', 'TWO', 'WIDE', 'INSERT'].includes(b.kind)) { const j = SIZES.indexOf(b.size); b.size = SIZES[j === 2 ? 1 : j + 1]; if (b.kind === 'WIDE' && b.size !== 'WIDE') b.kind = 'HOT'; b.why.rule += `; R9 not the same size as the shot before (${a.size})`; } }
  /* R8: a giant lying down (a sprawl or a sleep in the sheet's procedures) is shot from above his body, not from the floor */
  const lying = (id, t) => ((C.creatures || {})[id] || { procs: [] }).procs.some(p => p.type === 'preset' && /sprawl|sleep|lie|dead/.test(p.name) && t >= p.from && t <= p.to);
  for (const sh of shots) if (sh.giant && lying(sh.giant, (sh.t0 + sh.t1) / 2)) { sh.angle = 'high'; sh.lying = true; sh.why.rule += '; the giant lies on the floor: the lens above him, the men beside him for size'; }
  /* R7: the beat of each shot (a blocking key) and its line */
  const keys = (C.keys || []).map(k => ({ id: k.id, t: k.t }));
  for (const sh of shots) { const kk = keys.filter(k => k.t <= sh.t0 + 0.01).pop(); sh.beat = kk ? kk.id : null; if (sh.line && (!sh.line[0] || !sh.line[1] || sh.line[0] === sh.line[1])) sh.line = null; }
  const P = {
    format: 'odyssey-shots/1', scene: sid, title: S.title, clock: S.clock || 'cut', total, generated: { by: 'tools/cinematographer/plan.js', at: new Date().toISOString().slice(0, 10) },
    sheet: { from: (C.generated || {}).from || null, path: L.sheetPath, total: C.total }, direction: D, media, requests: { elide: elideReq, follow: followReq }, floor, longest,
    principals, creatures: creatureIds, heatScale: r3(fig.p95),
    anchors: A.filter(a => a.type !== 'reaction' || a.t - a.cause.t <= 1.5).map(a => ({ type: a.type, id: a.id, kind: a.kind, t: r3(a.t), actors: a.actors, cause: a.cause || null, effect: a.effect || null })),
    shots,
  };
  return P;
}

if (require.main === module) {
  const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
  const sids = args.filter(a => /^OD-B\d\d-S\d\d$/.test(a)); if (!sids.length) { console.log('node tools/cinematographer/plan.js OD-Bxx-Syy [--sheet f] [--out dir]'); process.exit(1); }
  const out = path.resolve(ROOT, opt('out', 'tools/cinematographer/plans')); fs.mkdirSync(out, { recursive: true });
  for (const sid of sids) { const P = plan(sid, { sheet: opt('sheet', null) }); fs.writeFileSync(path.join(out, sid + '.json'), JSON.stringify(P, null, 1));
    console.log(sid, P.media, 'media;', P.shots.length, 'shots; floor', P.floor, 's');
    for (const s of P.shots) console.log(String(s.i).padStart(3), s.t0.toFixed(2).padStart(6), (s.t1 - s.t0).toFixed(2).padStart(5), s.kind.padEnd(6), s.size.padEnd(5), (s.primary || '').padEnd(22), (s.line || []).join('|').padEnd(40), '|', s.why.rule); }
}
module.exports = { plan, heat, hotSpot, anchors, KIND_W };
