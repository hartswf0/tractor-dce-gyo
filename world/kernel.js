/* world/kernel.js — the guarded transition beneath the modes: one place that decides whether a command may happen.

   The world's discrete commands (get in, get out, swing, shoot, shove, push, fire, torpedo, detonate, build, place,
   switch) used to be guarded where each was performed: a mode check here, a weapon check there, a distance test in a
   third file, so a refusal had no name. This module is the theory those checks were an instance of, made explicit:

     <actor> [attempts] <command>
     <mode> + <capability> + <affordance> + <gate>  [enables or blocks]  <effect>
     <effect> [mutates] <world state> and [emits] <event>
     <event> [advances] <objectives>; a completed or skipped event is a <stable boundary>, and only there the <ledger> commits

   Capabilities belong to the actor (the character on foot, the vehicle's kind in a ride, the TIE in the air); affordances
   belong to the target (a prop is boardable because it was built as a vehicle, a traffic car is takeable, the ship is
   flyable, ground is buildable); gates are named predicates on the world (ready, alive, not held by a film, not building).
   `Kernel.enabled(command)` answers with the first reason that blocks, in the order mode, capability, target, gate, so the
   hands and the keys can say why nothing happened. `Kernel.attempt(command)` performs the effect through main.js's own
   operations (`W.ops`): the kernel moves nothing itself.

   Events (`Kernel.Events`) are free play's objects with a lifecycle: available, active, completed, skipped, and a
   completion contract separate from the performance that reaches it. Skipping applies the event's canonical
   postconditions (the wall is gone, the route is open) and records the skip without the mastery. A film scene playing is
   bridged as an event of the same lifecycle, so the film and free play share one protocol.

   The ledger (`Kernel.Ledger`) is the persistent progression, kept apart from the runtime: metres driven, times boarded,
   events completed or skipped, mastery and other grants. It is written only at stable boundaries (an event completes or
   is skipped, a grant arrives); driving accumulates in the runtime and reaches the store at the next commit. A grant is
   keyed by its id, so the same grant twice is one record. Reloading restores the ledger and nothing of the runtime. */
(function () {
'use strict';
const W = window.__world, M = 40, $ = s => document.querySelector(s);
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
/* ───────────── capabilities: what the actor can do in its present form ───────────── */
function capabilities() {
  const c = new Set(['move', 'look']);
  if (W.mode === 'walk') { for (const k of ['walk', 'push', 'build', 'board', 'detonate', 'switch']) c.add(k); const d = (window.Minifig && Minifig.DEFS[W.character]) || {}; c.add(d.saber ? 'swing' : d.weapon ? 'shoot' : 'shove'); }
  else if (W.mode === 'ride' && W.veh) { const k = W.veh.K || {}; for (const x of ['drive', 'leave', 'fire', 'torpedo', 'boost']) c.add(x); if (k.fly) { c.add('fly'); c.add('land'); } if (k.walker) c.add('stomp'); }
  else if (W.mode === 'fly') for (const x of ['fly', 'boost', 'fire', 'torpedo', 'land', 'leave']) c.add(x);
  return c;
}
/* ───────────── affordances: what a target accepts ───────────── */
function affordancesOf(t) {
  const a = new Set(); if (!t) return a;
  if (t.kind === 'prop') { const it = t.item, op = it.src ? String(it.src.op) : ''; if (it.ready && (op === 'vehicle' || op === 'walker' || op === 'kit' || (it.src && it.src.ride))) { a.add('boardable'); const K = window.Drive ? Drive.KINDS[Drive.kindOf(it)] : null; a.add(K && K.fly ? 'flyable' : K && K.walker ? 'walkable' : 'drivable'); } if (!(it.src && it.src.landmark)) { a.add('breakable'); a.add('movable'); } }
  else if (t.kind === 'car') { a.add('takeable'); a.add('drivable'); a.add('breakable'); }
  else if (t.kind === 'ship') { a.add('boardable'); a.add('flyable'); }
  else if (t.kind === 'building') { a.add('breakable'); if (t.item && t.item.door) a.add('enterable'); }
  else if (t.kind === 'brick') { a.add('breakable'); a.add('pickable'); }
  else if (t.kind === 'ground') { a.add('buildable'); a.add('walkable'); }
  return a;
}
/** The target a command reaches for: the nearest thing that could take it, with its kind. */
function acquire(command) {
  const ops = W.ops; if (!ops) return null;
  if (command === 'board') { const v = ops.nearVehicle(), ds = ops.nearShip(); if (W.ship && ds < 6 && (!v || ds * M < v.box.distanceToPoint(W.rig.pos))) return { kind: 'ship', item: W.ship, dist: ds }; if (v) return { kind: 'prop', item: v, dist: v.box.distanceToPoint(W.rig.pos) / M }; const c = ops.nearCar(); if (c) return { kind: 'car', item: c, dist: Math.hypot(c.x - W.rig.pos.x, c.z - W.rig.pos.z) / M }; return null; }
  if (command === 'place') return W.build && W.build.target ? { kind: 'ground', item: W.build.target } : null;
  return undefined;   // the command takes no target
}
/* ───────────── gates: named predicates on the world ───────────── */
const GATES = {
  ready: [() => !!W.ready, 'the place is still loading'],
  alive: [() => !W.dead, 'you are down'],
  notHeld: [() => !(W.film && W.film.holds && W.film.holds()), 'a film camera holds the world'],
  notBuilding: [() => !(W.build && W.build.on), 'not while building'],
  building: [() => !!(W.build && W.build.on), 'open Build first'],
  hasDetonator: [() => W.dets > 0, 'no detonators left'],
  notTaking: [() => !W.taking, 'already getting in'],
  notLanding: [() => !(W.mode === 'fly' ? W.tie && W.tie.landing : W.veh && W.veh.landing), 'already landing'],
  notTyping: [() => !W.typing, 'the words have the keys'],
};
/* ───────────── rules: the guard for each command ───────────── */
const RULES = {
  board: { modes: ['walk'], caps: ['board'], target: ['boardable', 'takeable'], gates: ['ready', 'alive', 'notHeld', 'notTaking'] },
  leave: { modes: ['ride', 'fly'], caps: ['leave'], gates: ['ready', 'notHeld', 'notLanding'] },
  saber: { modes: ['walk'], caps: ['swing', 'shoot', 'shove'], gates: ['ready', 'alive', 'notHeld', 'notBuilding'] },
  push: { modes: ['walk'], caps: ['push'], gates: ['ready', 'alive', 'notHeld', 'notBuilding'] },
  fire: { modes: ['ride', 'fly'], caps: ['fire'], gates: ['ready', 'notHeld'] },
  torpedo: { modes: ['ride', 'fly'], caps: ['torpedo'], gates: ['ready', 'notHeld'] },
  detonate: { modes: ['walk'], caps: ['detonate'], gates: ['ready', 'alive', 'notHeld', 'hasDetonator'] },
  build: { modes: ['walk'], caps: ['build'], gates: ['ready', 'alive', 'notHeld'] },
  place: { modes: ['walk'], caps: ['build'], target: ['buildable'], gates: ['ready', 'alive', 'building'] },
  switch: { modes: ['walk'], caps: ['switch'], gates: ['ready', 'notHeld', 'notBuilding'] },
};
/** Whether a command may happen now: ok, or the first reason that blocks it, in the order mode, capability, target, gate. */
function enabled(command, target) {
  const rule = RULES[command]; if (!rule) return { ok: false, command, reason: 'unknown', detail: 'no such command' };
  if (!rule.modes.includes(W.mode)) return { ok: false, command, reason: 'mode', detail: W.mode };
  const caps = capabilities(), cap = rule.caps.find(c => caps.has(c)); if (!cap) return { ok: false, command, reason: 'capability', detail: rule.caps.join(' or ') };
  if (target === undefined) target = acquire(command);
  let via = null;
  if (rule.target) { const aff = affordancesOf(target); via = rule.target.find(a => aff.has(a)) || null; if (!via) return { ok: false, command, reason: 'target', detail: rule.target.join(' or '), target: target ? target.kind : null }; }
  for (const g of rule.gates) if (!GATES[g][0]()) return { ok: false, command, reason: 'gate', detail: g, text: GATES[g][1] };
  return { ok: true, command, cap, target: target ? { kind: target.kind, dist: target.dist } : null, via, item: target ? target.item : null };
}
/** A refusal in words. */
function describe(r) {
  if (!r || r.ok) return '';
  const what = { board: 'get in', leave: 'get out', saber: 'swing', push: 'push', fire: 'fire', torpedo: 'torpedo', detonate: 'throw', build: 'build', place: 'place', switch: 'change character' }[r.command] || r.command;
  if (r.reason === 'mode') return `${what}: not ${r.detail === 'ride' ? 'in a ride' : r.detail === 'fly' ? 'in the air' : 'on foot'}`;
  if (r.reason === 'capability') return `${what}: nothing here can ${r.detail}`;
  if (r.reason === 'target') return `${what}: nothing in reach that is ${r.detail.replace(' or ', ' or ')}`;
  if (r.reason === 'gate') return `${what}: ${r.text}`;
  return `${what}: ${r.detail}`;
}
/* ───────────── effects: the world's own operations, named ───────────── */
const EFFECTS = {
  board: r => { const ops = W.ops; if (r.target.kind === 'ship') { ops.board(); return 'board-ship'; } if (r.target.kind === 'prop') { ops.boardVehicle(r.item); return 'board-' + (r.via === 'boardable' && window.Drive ? Drive.kindOf(r.item) : 'prop'); } ops.takeCar(r.item); return 'take-car'; },
  leave: () => { const ops = W.ops; if (W.mode === 'fly') { ops.land(); return 'land-tie'; } const V = W.veh; if (V.fly && V.airborne) { Drive.land(V); return 'land'; } ops.leaveVehicle(); return 'leave'; },
  saber: r => { W.input.saber = true; return r.cap; },
  push: () => { W.input.push = true; return 'push'; },
  fire: () => { W.input.fireOnce = true; return 'fire'; },
  torpedo: () => { W.input.torpedo = true; return 'torpedo'; },
  detonate: () => { W.ops.throwDetonator(); return 'detonate'; },
  build: () => { W.ops.toggleBuild(); return W.build.on ? 'build-on' : 'build-off'; },
  place: () => { W.ops.buildAct(); return 'place'; },
  switch: () => { W.ops.nextCharacter(); return 'switch:' + W.character; },
};
const K = { log: [], last: null, listeners: new Set() };
function emit(ev) { ev.t = Math.round(now()); K.log.push(ev); if (K.log.length > 200) K.log.shift(); for (const f of K.listeners) { try { f(ev); } catch (e) { console.warn('[kernel] listener', e); } } return ev; }
/** Try a command: the guard, then the effect, then the event. Returns the guard's answer with the effect's name when it happened. */
function attempt(command, target) {
  const r = enabled(command, target); K.last = r;
  if (!r.ok) { emit({ kind: 'refused', command, reason: r.reason, detail: r.detail }); return r; }
  r.effect = EFFECTS[command](r); emit({ kind: 'did', command, effect: r.effect, cap: r.cap, target: r.target ? r.target.kind : null, via: r.via, mode: W.mode }); return r;
}
/* ───────────── the frame: flags from any device pass the guard; the runtime counts; events advance ───────────── */
const R = { driven: 0, walked: 0, flown: 0, boarded: 0, fired: 0, swings: 0, broken: 0 };   // since the last commit
const P = { pos: null, mode: null, knocked: 0 };
function step(dt) {
  const I = W.input; if (!I) return;
  for (const [flag, cmd] of [['saber', 'saber'], ['push', 'push'], ['fireOnce', 'fire'], ['torpedo', 'torpedo']]) if (I[flag]) { const r = enabled(cmd); if (!r.ok) { I[flag] = false; K.last = r; emit({ kind: 'refused', command: cmd, reason: r.reason, detail: r.detail, from: 'flag' }); } else { I[flag] = false; r.effect = EFFECTS[cmd](r); emit({ kind: 'did', command: cmd, effect: r.effect, cap: r.cap, mode: W.mode, from: 'flag' }); if (cmd === 'saber') R.swings++; else if (cmd === 'fire' || cmd === 'torpedo') R.fired++; } }
  if (I.fire && !enabled('fire').ok) I.fire = false;
  const pos = W.mode === 'ride' && W.veh ? W.veh.pos : W.mode === 'fly' && W.tie ? W.tie.pos : W.rig ? W.rig.pos : null;
  if (pos && P.pos && P.mode === W.mode) { const d = Math.hypot(pos.x - P.pos.x, pos.z - P.pos.z) / M; if (d < 5) { if (W.mode === 'ride') R.driven += d; else if (W.mode === 'fly') R.flown += d; else if (!W.rig.seated) R.walked += d; } }
  P.pos = pos ? { x: pos.x, z: pos.z } : null; P.mode = W.mode;
  if (W.city) { const k = W.city.knocked || 0; if (k > P.knocked) R.broken += k - P.knocked; P.knocked = k; }
  Events.step(dt);
}
K.listeners.add(ev => { if (ev.kind === 'did' && ev.command === 'board') R.boarded++; });
/* ───────────── the ledger: persistent progression, committed at boundaries ───────────── */
const Ledger = (() => {
  let pid = null; try { pid = localStorage.getItem('world.pid'); if (!pid) { pid = Math.random().toString(36).slice(2, 8); localStorage.setItem('world.pid', pid); } } catch (e) { pid = pid || 'local'; }
  const KEY = 'world.ledger.' + pid, fresh = () => ({ events: {}, owned: {}, totals: { driven: 0, walked: 0, flown: 0, boarded: 0, fired: 0, swings: 0, broken: 0 }, commits: 0, at: null, log: [] });
  let S = fresh(); try { const raw = localStorage.getItem(KEY); if (raw) S = { ...fresh(), ...JSON.parse(raw) }; } catch (e) { }
  const total = k => (S.totals[k] || 0) + (R[k] || 0);
  function commit(reason) {
    for (const k of Object.keys(R)) { S.totals[k] = +((S.totals[k] || 0) + R[k]).toFixed(1); R[k] = 0; }
    S.commits++; S.at = Date.now(); S.log.push({ at: S.at, reason }); if (S.log.length > 50) S.log.shift();
    let stored = false; try { localStorage.setItem(KEY, JSON.stringify(S)); stored = true; } catch (e) { }
    emit({ kind: 'commit', reason, stored, commits: S.commits }); return { reason, stored, commits: S.commits };
  }
  /** A grant keyed by its id: the same grant twice is one record, and each confirms ownership. */
  function grant(id, meta, defer) { if (S.owned[id]) { emit({ kind: 'grant', id, duplicate: true }); return { ok: true, duplicate: true, id }; } S.owned[id] = { at: Date.now(), ...(meta || {}) }; emit({ kind: 'grant', id, duplicate: false }); if (!defer) commit('grant:' + id); return { ok: true, duplicate: false, id }; }   // `defer` leaves the commit to the boundary that granted it
  const owns = id => !!S.owned[id];
  function record(key, entry) { S.events[key] = { ...(S.events[key] || {}), ...entry, at: Date.now() }; }
  return { pid, key: KEY, commit, grant, owns, record, total, runtime: R, state: () => ({ pid, key: KEY, commits: S.commits, at: S.at, totals: { ...S.totals }, runtime: { ...R }, events: JSON.parse(JSON.stringify(S.events)), owned: Object.keys(S.owned), log: S.log.slice(-5) }), raw: () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } }, reset: () => { S = fresh(); for (const k of Object.keys(R)) R[k] = 0; try { localStorage.removeItem(KEY); } catch (e) { } } };
})();
/* ───────────── events: free play's objects, with a lifecycle and a completion contract ───────────── */
const DEFS = {
  'first-ride': { name: 'Out on the road', text: 'get into something that drives and take it fifty metres', pre: () => W.mode === 'walk', skippable: false, mastery: 'driver',
    objectives: [{ id: 'in', text: 'get in', done: p => p.boarded >= 1 }, { id: 'far', text: 'drive 50 m', done: p => p.driven >= 50 }] },
  'the-wall': { name: 'The wall across the road', text: 'a wall of bricks stands ahead: break through it, or skip it and the route opens', pre: () => W.mode === 'walk' && !!W.build, skippable: true, mastery: 'breaker',
    setup: ev => { const B = W.build, f = Minifig.facing(W.rig, new THREE.Vector3()); const cx = Math.round((W.rig.pos.x + f.x * 5 * M) / 20) * 20, cz = Math.round((W.rig.pos.z + f.z * 5 * M) / 20) * 20, y = Math.ceil(W.G.h(cx, cz) / 8) * 8, across = Math.abs(f.x) > Math.abs(f.z);
      const rows = []; for (let h = 0; h < 3; h++) for (let i = -2; i <= 2; i++) rows.push([null, '3001', h % 2 ? 4 : 1, across ? cx : cx + i * 80, y + h * 24, across ? cz + i * 80 : cz, across ? 1 : 0]);
      ev.data.ids = B.addRows(rows, false, true).map(p => p.id); ev.data.laid = ev.data.ids.length; },
    objectives: [{ id: 'through', text: 'fewer than four bricks left standing', done: (p, ev) => ev.data.ids.filter(id => W.build.pieces.has(id)).length < 4 }],
    post: ev => { for (const id of ev.data.ids) if (W.build.pieces.has(id)) W.build.remove(id); ev.data.opened = true; } },
};
const Events = (() => {
  const E = new Map();   // key → { key, def, state, at, base, data }
  const get = key => E.get(key) || null;
  const progress = ev => { const p = {}; for (const k of Object.keys(R)) p[k] = +(Ledger.total(k) - ev.base[k]).toFixed(1); return p; };
  function start(key, def) {
    def = def || DEFS[key]; if (!def) return { ok: false, reason: 'unknown' };
    const old = E.get(key); if (old && old.state === 'active') return { ok: false, reason: 'active' };
    if (def.pre && !def.pre()) return { ok: false, reason: 'precondition' };
    const ev = { key, def, state: 'active', at: Date.now(), base: {}, data: {} }; for (const k of Object.keys(R)) ev.base[k] = Ledger.total(k);
    if (def.setup) def.setup(ev); E.set(key, ev); emit({ kind: 'event', key, state: 'active' }); paint(); return { ok: true, key };
  }
  function finish(ev, state) {
    ev.state = state; ev.done = Date.now();
    Ledger.record(ev.key, { state, name: ev.def.name, seconds: +((ev.done - ev.at) / 1000).toFixed(1), progress: progress(ev), skipped: state === 'skipped' });
    if (state === 'completed' && ev.def.mastery) Ledger.grant('mastery:' + ev.def.mastery, { event: ev.key }, true);   // the mastery and the completion are one transaction
    Ledger.commit('event:' + ev.key + ':' + state);
    emit({ kind: 'event', key: ev.key, state }); paint();
  }
  function skip(key) {
    const ev = get(key); if (!ev || ev.state !== 'active') return { ok: false, reason: 'not active' };
    if (!ev.def.skippable) return { ok: false, reason: 'not skippable' };
    if (ev.def.post) ev.def.post(ev);   // the canonical postconditions, whatever the performance would have done
    finish(ev, 'skipped'); return { ok: true, key };
  }
  function step() {
    const F = W.film;   // a playing scene is an event of the same lifecycle
    if (F && F.play && F.play.on && F.scene) { const key = 'film:' + (F.name || F.scene.name || 'scene'); const cur = E.get(key); if (!cur || cur.state !== 'active') start(key, { name: F.name || F.scene.name || 'scene', text: 'a scene plays', skippable: false, objectives: [{ id: 'played', text: 'the scene plays through', done: () => !(F.play && F.play.on) }] }); }
    for (const ev of E.values()) { if (ev.state !== 'active') continue; const p = progress(ev); if (ev.def.objectives.every(o => o.done(p, ev))) finish(ev, 'completed'); }
  }
  function paint() { let q = $('#quest'); if (!q) { q = document.createElement('div'); q.id = 'quest'; q.style.cssText = 'position:fixed;left:14px;top:calc(96px + env(safe-area-inset-top));z-index:6;max-width:min(300px,60vw);padding:8px 10px;border-radius:9px;background:rgba(20,24,32,.82);color:#fff;font:11px/1.35 var(--mono,monospace);pointer-events:none;white-space:pre-line'; document.body.appendChild(q); }
    const act = [...E.values()].filter(e => e.state === 'active' && !e.key.startsWith('film:')); if (!act.length) { q.hidden = true; return; } q.hidden = false;
    q.textContent = act.map(ev => { const p = progress(ev); return ev.def.name + '\n' + ev.def.objectives.map(o => (o.done(p, ev) ? 'done  ' : '      ') + o.text).join('\n') + (ev.def.skippable ? '\n      (skip with Kernel.Events.skip)' : ''); }).join('\n\n'); }
  const state = () => [...E.values()].map(ev => ({ key: ev.key, name: ev.def.name, state: ev.state, progress: progress(ev), objectives: ev.def.objectives.map(o => ({ id: o.id, done: o.done(progress(ev), ev) })), data: { ...ev.data, ids: ev.data.ids ? ev.data.ids.length : undefined, standing: ev.data.ids ? ev.data.ids.filter(id => W.build && W.build.pieces.has(id)).length : undefined } }));
  return { DEFS, start, skip, step, get, state, available: () => Object.keys(DEFS).filter(k => !(E.get(k) && E.get(k).state === 'active') && (!DEFS[k].pre || DEFS[k].pre())) };
})();
window.Kernel = { RULES, GATES: Object.fromEntries(Object.entries(GATES).map(([k, v]) => [k, v[1]])), capabilities: () => [...capabilities()], affordancesOf: t => [...affordancesOf(t)], acquire, enabled, describe, attempt, step, on: f => { K.listeners.add(f); return () => K.listeners.delete(f); }, log: () => K.log.slice(), last: () => K.last, Events, Ledger,
  state: () => ({ mode: W.mode, capabilities: [...capabilities()], last: K.last, events: Events.state(), ledger: Ledger.state(), log: K.log.slice(-10) }) };
})();
