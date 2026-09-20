/* world/assemblies.js — complete behavior-bearing assemblies for Word to World.

   A generated thing is more than the pieces that draw it. It has one identity, member
   pieces and props, a bounded behavior vocabulary, current state, links to other
   assemblies, and a provenance trail back to the BuildProgram operation that made it.

   The runtime deliberately does not evaluate arbitrary JavaScript from programs or
   speech. It accepts a small declarative vocabulary and adapts those operations onto
   Build, Props, Drive, Put That There, OdysseyPlay, room sync, and the existing V1
   behavior layer. Geometry remains the authority for contact and placement. */
(function () {
'use strict';

const VERSION = 2;
const PREFIX = 'wtw.assemblies.v2';
const EVENT_LIMIT = 240;
const LINK_ACTIONS = new Set(['open', 'close', 'activate', 'remove']);
const SEMANTIC_TRAITS = new Set(['openable', 'damageable', 'activatable', 'rideable']);
const BASELINE_TRAITS = { inspectable: {}, moveable: {}, rotatable: {}, copyable: {}, removable: {} };
const TRAIT_ALIASES = {
  door: 'openable', gate: 'openable', hatch: 'openable', lid: 'openable', shutter: 'openable',
  target: 'damageable', breakable: 'damageable', destructible: 'damageable',
  switch: 'activatable', trigger: 'activatable', usable: 'activatable',
  vehicle: 'rideable', mount: 'rideable', movable: 'moveable', rotatable: 'rotatable'
};
const VERB_ALIASES = {
  describe: 'inspect', read: 'inspect', look: 'inspect', shut: 'close', toggle: 'activate',
  use: 'activate', trigger: 'activate', slash: 'hit', strike: 'hit', cut: 'hit',
  attack: 'hit', damage: 'hit', ride: 'mount', board: 'mount'
};
const BEHAVIOR_SPEC = `\n\nBEHAVIOR-BEARING ASSEMBLIES:\nA program and any top-level op or group may carry a declarative "behavior" object. Allowed keys only:\n- "openable": true or {"hinge":"west|east|north|south|center","steps":1}\n- "damageable": true or {"maxHp":100,"damage":35,"destroyOnZero":false}\n- "breakable": true or {"maxHp":100,"damage":35} (compiled as damageable with destroyOnZero)\n- "activatable": true\n- "rideable": true or {"kind":"car|boat|horse|walker|fly"}. A rideable whole program is committed as one vehicle prop.\nA program may also carry "links": [{"from":"source group name or id","event":"activated|opened|closed|depleted","to":"target group name or id","action":"open|close|activate|remove","once":false}].\nName groups that need behavior or links. Do not output JavaScript, handlers, code strings, URLs, selectors, or unknown behavior keys. Geometry and the compiler remain physical authority.`;

const W = () => window.__world || null;
const finite = Number.isFinite;
const nowISO = () => new Date().toISOString();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clone = value => { if (value == null || typeof value !== 'object') return value; try { return JSON.parse(JSON.stringify(value)); } catch (e) { return value; } };
const safeJSON = (value, fallback) => { try { return JSON.parse(value); } catch (e) { return fallback; } };
const slug = value => String(value || 'assembly').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || 'assembly';
const newId = prefix => `${prefix || 'asm'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

let key = '';
let store = null;
let memberIndex = new Map();
let pendingLink = null;
let applyingRemote = false;
let baseBehavior = null;
let installed = false;

function placeKey() {
  const w = W(), p = w && w.place;
  if (p && finite(+p.lat) && finite(+p.lon)) return `${w.world || 'world'}:${(+p.lat).toFixed(3)},${(+p.lon).toFixed(3)}`;
  const q = new URLSearchParams(location.search);
  return `${q.get('world') || (w && w.world) || 'earth'}:${location.pathname}`;
}
function storeKey() { return `${PREFIX}:${placeKey()}`; }
function freshStore() { return { version: VERSION, place: placeKey(), assemblies: {}, links: {}, events: [], updatedAt: nowISO() }; }
function ensureStore() {
  const k = storeKey();
  if (k !== key || !store) {
    key = k;
    try { store = safeJSON(localStorage.getItem(k), null) || freshStore(); } catch (e) { store = freshStore(); }
    if (!store.assemblies || typeof store.assemblies !== 'object') store.assemblies = {};
    if (!store.links || typeof store.links !== 'object') store.links = {};
    if (!Array.isArray(store.events)) store.events = [];
    store.version = VERSION; store.place = placeKey();
    reindex();
  }
  return store;
}
function persist() {
  ensureStore(); store.updatedAt = nowISO();
  try { localStorage.setItem(storeKey(), JSON.stringify(store)); } catch (e) { console.warn('[assemblies] persistence unavailable', e); }
  paintMenu();
}
function event(type, detail, remote) {
  ensureStore();
  const packet = { id: newId('ev'), version: VERSION, type, at: nowISO(), place: placeKey(), ...clone(detail || {}) };
  store.events.push(packet); if (store.events.length > EVENT_LIMIT) store.events.splice(0, store.events.length - EVENT_LIMIT);
  persist();
  try { window.dispatchEvent(new CustomEvent('world:assembly', { detail: packet })); } catch (e) { }
  if (!remote) broadcast({ type: 'event', event: packet });
  return packet;
}
function broadcast(op) {
  if (applyingRemote || !op) return;
  const w = W();
  try { if (w?.room?.role && typeof w.room.send === 'function') w.room.send({ t: 'assembly', op: clone(op) }); } catch (e) { console.warn('[assemblies] room send', e); }
}
function reindex() {
  memberIndex = new Map(); if (!store) return;
  for (const rec of Object.values(store.assemblies || {})) {
    if (!rec || !rec.id || !rec.members) continue;
    for (const kind of ['pieces', 'props']) for (const m of rec.members[kind] || []) {
      if (!m || !m.id) continue; const a = memberIndex.get(m.id) || []; if (!a.includes(rec.id)) a.push(rec.id); memberIndex.set(m.id, a);
    }
  }
}
function normalizeTraitName(name) { return TRAIT_ALIASES[String(name || '').toLowerCase()] || String(name || '').toLowerCase(); }
function mergeTrait(out, name, value) {
  name = normalizeTraitName(name); if (!name) return;
  if (value === false || value == null) { delete out[name]; return; }
  if (value === true) value = {};
  if (typeof value !== 'object' || Array.isArray(value)) value = { value };
  if (name === 'damageable') {
    value = { maxHp: finite(+value.maxHp) ? clamp(+value.maxHp, 1, 100000) : 100, damage: finite(+value.damage) ? clamp(+value.damage, 0, 100000) : 35, destroyOnZero: !!value.destroyOnZero, ...value };
  }
  if (name === 'openable') value = { hinge: /^(west|east|north|south|center)$/.test(String(value.hinge || '')) ? String(value.hinge) : 'west', steps: finite(+value.steps) ? clamp(Math.round(+value.steps), -3, 3) || 1 : 1, ...value };
  out[name] = { ...(out[name] || {}), ...clone(value) };
}
function normalizeBehavior(spec) {
  const out = {};
  if (!spec) return out;
  if (typeof spec === 'string') { for (const x of spec.split(/[\s,|]+/)) if (x) mergeTrait(out, x, true); return out; }
  if (Array.isArray(spec)) { for (const x of spec) Object.assign(out, normalizeBehavior(x)); return out; }
  if (typeof spec !== 'object') return out;
  if (spec.behavior) Object.assign(out, normalizeBehavior(spec.behavior));
  if (spec.behaviors) Object.assign(out, normalizeBehavior(spec.behaviors));
  if (spec.traits) Object.assign(out, normalizeBehavior(spec.traits));
  for (const [raw, value] of Object.entries(spec)) {
    const name = normalizeTraitName(raw);
    if (raw === 'breakable') mergeTrait(out, 'damageable', { ...(typeof value === 'object' ? value : {}), destroyOnZero: value !== false });
    else if (['openable', 'damageable', 'activatable', 'rideable', 'moveable', 'rotatable', 'copyable', 'removable'].includes(name)) mergeTrait(out, name, value);
  }
  return out;
}
function semanticTraits(traits) { const out = {}; for (const [k, v] of Object.entries(traits || {})) if (SEMANTIC_TRAITS.has(k)) out[k] = clone(v); return out; }
function hasSemantic(rec) { return !!Object.keys(semanticTraits(rec && rec.traits)).length; }
function memberRef(kind, item, op) {
  if (!item || !item.id) return null;
  return { kind, id: String(item.id), op: op == null ? (item.op == null ? -1 : +item.op) : +op, x: +item.x || 0, y: +item.y || 0, z: +item.z || 0, rot: kind === 'piece' ? (+item.rot || 0) : (+item.yaw || 0) };
}
function live(ref) {
  const w = W(); if (!ref || !w) return null;
  return ref.kind === 'piece' ? w.build?.pieces?.get?.(ref.id) || null : ref.kind === 'prop' ? w.props?.items?.get?.(ref.id) || null : null;
}
function targetId(target) { return String(target && (target.id || target.item?.id) || ''); }
function targetKind(target) {
  if (!target) return 'unknown'; if (target.kind) return target.kind;
  const id = targetId(target), w = W(); if (w?.build?.pieces?.has?.(id)) return 'piece'; if (w?.props?.items?.has?.(id)) return 'prop'; return 'unknown';
}
function targetFor(ref) {
  const item = live(ref); if (!item) return null; const w = W();
  return { kind: ref.kind, id: ref.id, item, box: item.box, name: ref.kind === 'piece' ? (w?.build?.kinds?.get?.(item.part)?.name || item.part || 'brick') : (item.src?.name || item.src?.kind || item.src?.as || item.src?.kit || item.src?.op || 'model') };
}
function liveMembers(rec, prune) {
  const out = { pieces: [], props: [] }; if (!rec || !rec.members) return out;
  let changed = false;
  for (const kind of ['pieces', 'props']) {
    const kept = [];
    for (const ref of rec.members[kind] || []) { const item = live(ref); if (item) { out[kind].push({ ref, item }); kept.push(ref); } else if (!prune || Date.now() < +(rec.pendingUntil || 0)) kept.push(ref); else changed = true; }
    if (changed) rec.members[kind] = kept;
  }
  if (changed) { rec.updatedAt = nowISO(); persist(); reindex(); }
  return out;
}
function recordBounds(rec) {
  const members = liveMembers(rec, false), boxes = [...members.pieces, ...members.props].map(x => x.item.box).filter(Boolean);
  if (boxes.length && window.THREE) { const b = new THREE.Box3(); for (const q of boxes) b.union(q); rec.bounds = { min: b.min.toArray(), max: b.max.toArray() }; return b; }
  if (rec?.bounds?.min && rec?.bounds?.max && window.THREE) return new THREE.Box3(new THREE.Vector3(...rec.bounds.min), new THREE.Vector3(...rec.bounds.max));
  return null;
}
function labelForOp(op, i) {
  if (!op) return `part ${i + 1}`;
  return String(op.name || op.id || op.label || (window.Dsl?.captionOp ? Dsl.captionOp(op) : op.op || op.type || `part ${i + 1}`)).replace(/\s+/g, ' ').slice(0, 72);
}
function chooseRecord(ids, opts) {
  const all = ids.map(id => store.assemblies[id]).filter(Boolean); if (!all.length) return null;
  if (opts?.whole) return all.find(r => r.scope === 'root') || all[0];
  if (opts?.trait) { const hit = all.find(r => r.traits && r.traits[opts.trait]); if (hit) return hit; }
  const explicit = all.find(r => r.scope !== 'root' && hasSemantic(r)); if (explicit) return explicit;
  const rootSemantic = all.find(r => r.scope === 'root' && hasSemantic(r)); if (rootSemantic) return rootSemantic;
  return all.find(r => r.scope !== 'root') || all[0];
}
function assemblyTarget(rec, original) {
  if (!rec) return null; const box = recordBounds(rec);
  return { kind: 'assembly', id: rec.id, item: rec, name: rec.label || 'assembly', box, memberTarget: original || null, rootId: rec.rootId || rec.id };
}
function resolve(target, opts) {
  ensureStore(); if (!target) return null;
  if (target.kind === 'assembly') { const rec = store.assemblies[target.id] || target.item; return rec ? assemblyTarget(rec, target.memberTarget) : null; }
  const id = targetId(target), ids = memberIndex.get(id) || []; const rec = chooseRecord(ids, opts || {});
  return rec ? assemblyTarget(rec, target) : null;
}
function rootOf(rec) { return rec && store.assemblies[rec.rootId || rec.id] || rec; }
function createImplicit(target, label) {
  ensureStore(); const id = targetId(target), kind = targetKind(target), item = target && (target.item || target); if (!id || !['piece', 'prop'].includes(kind) || !item) return null;
  const existing = resolve(target); if (existing) return existing;
  const aid = newId('asm'), rec = { id: aid, rootId: aid, scope: 'root', label: label || target.name || kind, members: { pieces: [], props: [] }, traits: {}, state: {}, source: { kind: 'manual', createdFrom: id }, createdAt: nowISO(), updatedAt: nowISO() };
  rec.members[kind === 'piece' ? 'pieces' : 'props'].push(memberRef(kind, item)); rec.pendingUntil = Date.now() + 1000;
  store.assemblies[aid] = rec; reindex(); absorbLegacy(rec); recordBounds(rec); saveRecord(rec, 'implicit-created'); return assemblyTarget(rec, target);
}
function absorbLegacy(rec) {
  if (!baseBehavior?.profile || !rec || rec.scope === 'root' && (rec.members.pieces.length + rec.members.props.length > 1)) return;
  for (const ref of [...(rec.members.pieces || []), ...(rec.members.props || [])]) {
    const t = targetFor(ref); if (!t) continue; let p = null; try { p = baseBehavior.profile(t); } catch (e) { }
    if (!p) continue; for (const [name, value] of Object.entries(p.traits || {})) if (SEMANTIC_TRAITS.has(name)) mergeTrait(rec.traits, name, value);
    if (p.explicit && p.state) rec.state = { ...rec.state, ...clone(p.state) };
  }
}
function initializeState(rec) {
  if (rec.traits?.damageable) { const max = finite(+rec.traits.damageable.maxHp) ? +rec.traits.damageable.maxHp : 100; if (!finite(+rec.state.maxHp)) rec.state.maxHp = max; if (!finite(+rec.state.hp)) rec.state.hp = rec.state.maxHp; }
  if (rec.traits?.openable && typeof rec.state.open !== 'boolean') rec.state.open = false;
  if (rec.traits?.activatable && typeof rec.state.active !== 'boolean') rec.state.active = false;
}
function profile(target, opts) {
  ensureStore(); const a = resolve(target, opts), rec = a && store.assemblies[a.id]; if (!rec) return null;
  initializeState(rec); const traits = { ...clone(BASELINE_TRAITS), ...clone(rec.traits || {}) };
  return { id: rec.id, kind: 'assembly', label: rec.label, traits, state: clone(rec.state || {}), explicit: true, members: clone(rec.members), rootId: rec.rootId || rec.id, scope: rec.scope };
}
function traitForVerb(verb) { return ({ open: 'openable', close: 'openable', hit: 'damageable', activate: 'activatable', mount: 'rideable' })[verb] || null; }
function verbsFor(target) {
  const p = profile(target); if (!p) return [];
  const out = ['inspect', 'move', 'copy', 'turn', 'remove'];
  if (p.traits.openable) out.push(p.state.open ? 'close' : 'open');
  if (p.traits.damageable && p.state.hp > 0) out.push('hit');
  if (p.traits.activatable) out.push('activate');
  if (p.traits.rideable) out.push('mount');
  return out;
}
function describe(target) {
  const p = profile(target); if (!p) return 'unknown assembly'; const rec = store.assemblies[p.id], n = (rec.members.pieces?.length || 0) + (rec.members.props?.length || 0), details = [`${n} member${n === 1 ? '' : 's'}`];
  const semantic = Object.keys(semanticTraits(p.traits)); if (semantic.length) details.push(semantic.join(', '));
  if (p.traits.openable) details.push(p.state.open ? 'open' : 'closed');
  if (p.traits.damageable) details.push(`${Math.max(0, Math.round(p.state.hp))}/${Math.round(p.state.maxHp)} hp`);
  if (p.traits.activatable) details.push(p.state.active ? 'active' : 'inactive');
  const outgoing = Object.values(store.links).filter(l => l.source === rec.id && l.enabled !== false).length, incoming = Object.values(store.links).filter(l => l.target === rec.id && l.enabled !== false).length;
  if (outgoing || incoming) details.push(`${outgoing} out / ${incoming} in`);
  return `${p.label} · ${details.join(' · ')}`;
}
function describeShort(target) { const v = verbsFor(target); return v.length ? `assembly · can ${v.join(', ')}` : 'assembly'; }
function saveRecord(rec, why, remote) {
  if (!rec) return; ensureStore(); rec.updatedAt = nowISO(); store.assemblies[rec.id] = rec; reindex(); persist();
  if (!remote) broadcast({ type: 'upsert', record: clone(rec), why: why || 'change' });
}
function tagProps(rec) {
  const w = W(); if (!w?.props) return;
  for (const x of liveMembers(rec, false).props) {
    const item = x.item, src = item.src && typeof item.src === 'object' ? item.src : {};
    item.src = { ...src, assembly: rec.id, assemblyRoot: rec.rootId || rec.id, behavior: clone(rec.traits || {}) };
    if (rec.traits?.rideable) item.src.ride = rec.traits.rideable.kind || item.src.ride || true;
    try { w.props.moveTo(item, item.x, item.y, item.z, item.yaw, false); } catch (e) { }
  }
}
function registerLink(source, eventName, target, action, once, remote) {
  ensureStore(); if (!store.assemblies[source] || !store.assemblies[target] || !LINK_ACTIONS.has(action)) return null;
  eventName = /^(activated|deactivated|opened|closed|depleted)$/.test(eventName) ? eventName : 'activated';
  const same = Object.values(store.links).find(l => l.source === source && l.event === eventName && l.target === target && l.action === action);
  const link = same || { id: newId('link'), source, event: eventName, target, action, once: !!once, enabled: true, fired: 0, createdAt: nowISO() };
  link.once = !!once; link.enabled = true; link.updatedAt = nowISO(); store.links[link.id] = link; persist();
  if (!remote) broadcast({ type: 'link', link: clone(link) });
  event('link-created', { link: clone(link) }, remote); return link;
}
function selectorMap(records) {
  const map = new Map(); for (const rec of records) {
    for (const value of [rec.id, rec.label, rec.source?.id, rec.source?.name, rec.source?.opIndex]) if (value != null) map.set(String(value).trim().toLowerCase(), rec.id);
  } return map;
}
function registerProgramLinks(program, records, remote) {
  const links = Array.isArray(program?.links) ? program.links : Array.isArray(program?.behavior?.links) ? program.behavior.links : [];
  if (!links.length) return 0; const map = selectorMap(records); let n = 0;
  for (const raw of links) { if (!raw || typeof raw !== 'object') continue; const from = map.get(String(raw.from ?? raw.source ?? '').toLowerCase()), to = map.get(String(raw.to ?? raw.target ?? '').toLowerCase()), action = String(raw.action || raw.do || '').toLowerCase(); if (from && to && LINK_ACTIONS.has(action) && registerLink(from, String(raw.event || raw.on || 'activated').toLowerCase(), to, action, raw.once, remote)) n++; }
  return n;
}
function registerCommit(payload) {
  ensureStore(); const program = payload?.program || { name: payload?.name || 'build', ops: [] }, pieces = payload?.pieces || [], propPairs = (payload?.props || []).map(x => x && x.item ? x : { item: x, op: x?.op });
  const allRefs = [...pieces.map(p => memberRef('piece', p, p.op)), ...propPairs.map(x => memberRef('prop', x.item, x.op))].filter(Boolean); if (!allRefs.length) return null;
  const rootId = newId('asm'), root = { id: rootId, rootId, scope: 'root', label: String(program.name || payload.words || 'build').slice(0, 72), members: { pieces: allRefs.filter(x => x.kind === 'piece'), props: allRefs.filter(x => x.kind === 'prop') }, traits: normalizeBehavior(program.behavior || program.behaviors), state: {}, source: { kind: 'program', programName: program.name || '', words: payload.words || '', behaviorVersion: VERSION, committedAt: nowISO(), ride: payload.ride || '' }, createdAt: nowISO(), updatedAt: nowISO(), pendingUntil: Date.now() + 20000 };
  initializeState(root); store.assemblies[root.id] = root; const records = [root]; const byOp = new Map();
  for (const ref of allRefs) { const i = finite(+ref.op) ? +ref.op : -1; if (!byOp.has(i)) byOp.set(i, []); byOp.get(i).push(ref); }
  for (const [i, refs] of byOp) {
    if (i < 0 || !program.ops?.[i]) continue; const op = program.ops[i], id = `${rootId}:op${i}`, rec = { id, rootId, scope: 'op', label: labelForOp(op, i), members: { pieces: refs.filter(x => x.kind === 'piece'), props: refs.filter(x => x.kind === 'prop') }, traits: normalizeBehavior(op.behavior || op.behaviors), state: {}, source: { kind: 'program-op', programName: program.name || '', opIndex: i, op: String(op.op || op.type || ''), id: op.id || null, name: op.name || null, behaviorVersion: VERSION }, createdAt: nowISO(), updatedAt: nowISO(), pendingUntil: Date.now() + 20000 };
    absorbLegacy(rec); initializeState(rec); store.assemblies[id] = rec; records.push(rec);
  }
  if (!records.slice(1).length) absorbLegacy(root); recordBounds(root); for (const rec of records.slice(1)) recordBounds(rec);
  reindex(); for (const rec of records) { if (hasSemantic(rec)) tagProps(rec); }
  const linkCount = registerProgramLinks(program, records, true); persist(); broadcast({ type: 'commit', records: clone(records), links: clone(Object.values(store.links).filter(l => records.some(r => r.id === l.source || r.id === l.target))) });
  event('assembly-committed', { rootId, label: root.label, records: records.length, members: allRefs.length, links: linkCount });
  return { rootId, records: records.map(r => r.id), members: allRefs.length, links: linkCount };
}
function decorateProgram(program, pieceIds, propIds) {
  ensureStore(); const ids = [...(pieceIds || []), ...(propIds || [])], counts = new Map();
  for (const id of ids) for (const aid of memberIndex.get(String(id)) || []) counts.set(aid, (counts.get(aid) || 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => store.assemblies[id]).find(r => r && hasSemantic(r));
  if (best) { program.behavior = clone(best.traits); program.assembly = { source: best.id, label: best.label }; }
  if (best) {
    const related = Object.values(store.links).filter(l => l.source === best.id || l.target === best.id); if (related.length) program.links = related.map(l => ({ from: store.assemblies[l.source]?.label || l.source, event: l.event, to: store.assemblies[l.target]?.label || l.target, action: l.action, once: !!l.once }));
  }
  return program;
}
function rideForProgram(program) {
  const traits = normalizeBehavior(program?.behavior || program?.behaviors), r = traits.rideable; if (!r) return '';
  const kind = String(r.kind || r.value || '').toLowerCase(); return /^(fly|plane|air|ship|dragon)$/.test(kind) ? 'fly' : 'drive';
}
function snapshotTransforms(rec) {
  const out = { pieces: {}, props: {} }, m = liveMembers(rec, false);
  for (const x of m.pieces) out.pieces[x.ref.id] = { x: x.item.x, y: x.item.y, z: x.item.z, rot: x.item.rot | 0 };
  for (const x of m.props) out.props[x.ref.id] = { x: x.item.x, y: x.item.y, z: x.item.z, yaw: +x.item.yaw || 0 };
  return out;
}
function transformSnapshot(snapshot, fn) {
  const out = clone(snapshot || { pieces: {}, props: {} });
  for (const t of Object.values(out.pieces || {})) Object.assign(t, fn({ ...t, kind: 'piece' }));
  for (const t of Object.values(out.props || {})) Object.assign(t, fn({ ...t, kind: 'prop' }));
  return out;
}
function applyTransforms(rec, snapshot) {
  const w = W(); if (!w) return false; const rows = [];
  for (const [id, t] of Object.entries(snapshot?.pieces || {})) {
    const p = w.build?.pieces?.get?.(id); if (!p) continue; w.build.take(id, true); p.x = +t.x; p.y = +t.y; p.z = +t.z; p.rot = +t.rot & 3; p.box = null; const q = w.build.add(p, true); if (q) rows.push(w.build.toRow(q));
  }
  if (rows.length) { w.build.dirty = true; if (w.build.onEdit) w.build.onEdit({ up: rows }); }
  for (const [id, t] of Object.entries(snapshot?.props || {})) { const p = w.props?.items?.get?.(id); if (p) w.props.moveTo(p, +t.x, +t.y, +t.z, +t.yaw, false); }
  recordBounds(rec); return !!(rows.length || Object.keys(snapshot?.props || {}).length);
}
function shiftSnapshot(snapshot, dx, dy, dz) { return transformSnapshot(snapshot, t => ({ x: t.x + dx, y: t.y + dy, z: t.z + dz })); }
function rotatePoint(x, z, px, pz, steps) { steps = ((steps % 4) + 4) % 4; for (let i = 0; i < steps; i++) { const nx = px + (z - pz), nz = pz - (x - px); x = nx; z = nz; } return [x, z]; }
function rotateSnapshot(snapshot, px, pz, steps) {
  return transformSnapshot(snapshot, t => { const p = rotatePoint(t.x, t.z, px, pz, steps); return { x: p[0], z: p[1], ...(t.kind === 'piece' ? { rot: (t.rot + steps) & 3 } : { yaw: (t.yaw + steps) & 3 }) }; });
}
function hingePoint(rec, spec, snapshot) {
  let b = recordBounds(rec); if (!b && rec.bounds && window.THREE) b = new THREE.Box3(new THREE.Vector3(...rec.bounds.min), new THREE.Vector3(...rec.bounds.max)); if (!b) return { x: 0, z: 0 };
  const h = String(spec?.hinge || 'west'), cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
  if (h === 'east') return { x: b.max.x, z: cz }; if (h === 'north') return { x: cx, z: b.min.z }; if (h === 'south') return { x: cx, z: b.max.z }; if (h === 'center') return { x: cx, z: cz }; return { x: b.min.x, z: cz };
}
function setOpen(target, desired, context) {
  const a = resolve(target, { trait: 'openable', whole: /\b(whole|entire|all)\b/i.test(context?.text || '') }), rec = a && store.assemblies[a.id], p = a && profile(a); if (!rec || !p?.traits.openable) return { ok: false, message: `${a?.name || 'That assembly'} is not openable.` };
  if (!!p.state.open === desired) return { ok: true, message: `${rec.label} is already ${desired ? 'open' : 'closed'}.` };
  if (!rec.state.closed) rec.state.closed = snapshotTransforms(rec);
  const spec = p.traits.openable, hinge = hingePoint(rec, spec, rec.state.closed), steps = finite(+spec.steps) ? +spec.steps : 1;
  const next = desired ? rotateSnapshot(rec.state.closed, hinge.x, hinge.z, steps) : clone(rec.state.closed); if (!applyTransforms(rec, next)) return { ok: false, message: `${rec.label} has no live members to move.` };
  rec.state.open = desired; saveRecord(rec, desired ? 'opened' : 'closed'); event(desired ? 'opened' : 'closed', { assembly: rec.id, label: rec.label }); fire(rec.id, desired ? 'opened' : 'closed', new Set());
  return { ok: true, message: `${rec.label} ${desired ? 'opened' : 'closed'}.` };
}
function teachFromText(target, text) {
  text = String(text || '').toLowerCase(); const whole = /\b(whole|entire|all|build)\b/.test(text); let a = resolve(target, { whole }); if (!a) a = createImplicit(target); const rec = a && store.assemblies[a.id]; if (!rec) return { ok: false, message: 'That thing has no stable assembly identity.' };
  if (/\b(forget|clear|remove)\b.*\b(behavior|behaviour|trait|meaning)\b/.test(text)) { rec.traits = {}; rec.state = {}; saveRecord(rec, 'traits-cleared'); return { ok: true, message: `${rec.label} has no taught behavior.` }; }
  let name = null, value = true;
  if (/\b(openable|door|gate|hatch)\b/.test(text)) { name = 'openable'; const h = (text.match(/\b(west|east|north|south|center)\b/) || [])[1]; value = { hinge: h || 'west', steps: /\b(reverse|other way|left)\b/.test(text) ? -1 : 1 }; }
  else if (/\b(breakable|destructible)\b/.test(text)) { name = 'damageable'; value = { maxHp: +(text.match(/(\d+)\s*(?:hp|health)/)?.[1] || 100), damage: 35, destroyOnZero: true }; }
  else if (/\b(target|damageable)\b/.test(text)) { name = 'damageable'; value = { maxHp: +(text.match(/(\d+)\s*(?:hp|health)/)?.[1] || 100), damage: 35, destroyOnZero: false }; }
  else if (/\b(rideable|vehicle|mount)\b/.test(text)) { name = 'rideable'; value = { kind: (text.match(/\b(car|boat|horse|walker|fly)\b/) || [])[1] || 'car' }; }
  else if (/\b(activatable|switch|trigger|usable)\b/.test(text)) name = 'activatable';
  if (!name) return { ok: false, message: 'Name a behavior: openable, target, breakable, activatable, or rideable.' };
  if (name === 'rideable') { const m = liveMembers(rec, false); if (m.props.length !== 1 || m.pieces.length) return { ok: false, message: 'A rideable assembly must be one complete prop. Read and recommit a brick build as drive or fly.' }; }
  mergeTrait(rec.traits, name, value); initializeState(rec); saveRecord(rec, 'trait-taught'); tagProps(rec); event('trait-taught', { assembly: rec.id, label: rec.label, trait: name, value });
  return { ok: true, message: `${rec.label} is now ${name === 'damageable' && value.destroyOnZero ? 'breakable' : name}.` };
}
function removeAssembly(target, context) {
  const a = resolve(target, { whole: /\b(whole|entire|all|build)\b/i.test(context?.text || '') }), rec = a && store.assemblies[a.id]; if (!rec) return { ok: false, message: 'That assembly is gone.' };
  const w = W(), pieceIds = (rec.members.pieces || []).map(x => x.id).filter(id => w?.build?.pieces?.has?.(id)), propIds = (rec.members.props || []).map(x => x.id).filter(id => w?.props?.items?.has?.(id));
  for (const id of pieceIds) w.build.take(id, true); if (pieceIds.length) { w.build.dirty = true; if (w.build.onEdit) w.build.onEdit({ rm: pieceIds }); }
  for (const id of propIds) w.props.remove(id);
  const removed = new Set([...pieceIds, ...propIds]), doomed = [];
  for (const r of Object.values(store.assemblies)) { r.members.pieces = (r.members.pieces || []).filter(x => !removed.has(x.id)); r.members.props = (r.members.props || []).filter(x => !removed.has(x.id)); if (!r.members.pieces.length && !r.members.props.length) doomed.push(r.id); }
  for (const id of doomed) delete store.assemblies[id]; for (const [id, l] of Object.entries(store.links)) if (doomed.includes(l.source) || doomed.includes(l.target)) delete store.links[id]; reindex(); persist(); broadcast({ type: 'remove', assemblyIds: doomed, memberIds: [...removed] }); event('assembly-removed', { assembly: rec.id, label: rec.label, pieces: pieceIds.length, props: propIds.length });
  return { ok: true, message: `${rec.label} removed.`, removed: removed.size };
}
function applyDamage(target, amount, kind, context) {
  const a = resolve(target, { trait: 'damageable' }), rec = a && store.assemblies[a.id], p = a && profile(a); if (!rec || !p?.traits.damageable) return { ok: false, message: `${a?.name || 'That assembly'} is not a target.` };
  const spec = p.traits.damageable, hit = finite(+amount) ? Math.max(0, +amount) : +spec.damage || 35, hp = clamp((finite(+rec.state.hp) ? +rec.state.hp : +rec.state.maxHp) - hit, 0, +rec.state.maxHp);
  rec.state.hp = hp; saveRecord(rec, 'damaged'); event('damaged', { assembly: rec.id, label: rec.label, kind: kind || 'hit', damage: hit, hp, maxHp: rec.state.maxHp });
  if (hp <= 0) { fire(rec.id, 'depleted', new Set()); if (spec.destroyOnZero) { const r = removeAssembly(a, context || {}); return { ...r, hp, maxHp: rec.state.maxHp, destroyed: r.ok, message: r.ok ? `${rec.label} broke apart.` : r.message }; } event('depleted', { assembly: rec.id, label: rec.label }); return { ok: true, message: `${rec.label} is down.`, hp, maxHp: rec.state.maxHp, destroyed: false }; }
  return { ok: true, message: `${rec.label}: ${Math.round(hp)} / ${Math.round(rec.state.maxHp)}.`, hp, maxHp: rec.state.maxHp };
}
function activate(target) {
  const a = resolve(target, { trait: 'activatable' }), rec = a && store.assemblies[a.id], p = a && profile(a); if (!rec || !p?.traits.activatable) return { ok: false, message: `${a?.name || 'That assembly'} is not activatable.` };
  rec.state.active = !rec.state.active; saveRecord(rec, rec.state.active ? 'activated' : 'deactivated'); const type = rec.state.active ? 'activated' : 'deactivated'; event(type, { assembly: rec.id, label: rec.label, active: rec.state.active }); fire(rec.id, type, new Set()); return { ok: true, message: `${rec.label} ${type}.`, active: rec.state.active };
}
function mount(target) {
  const a = resolve(target, { trait: 'rideable' }), rec = a && store.assemblies[a.id], p = a && profile(a); if (!rec || !p?.traits.rideable) return { ok: false, message: `${a?.name || 'That assembly'} is not rideable.` };
  const m = liveMembers(rec, false); if (m.props.length !== 1 || m.pieces.length) return { ok: false, message: 'This assembly is not one boardable prop.' }; tagProps(rec); event('mount-requested', { assembly: rec.id, label: rec.label }); return { ok: true, message: `${rec.label} is in the vehicle system. Walk close and press E to board.` };
}
function moveAssembly(target, destination) {
  const a = resolve(target), rec = a && store.assemblies[a.id], b = rec && recordBounds(rec); if (!rec || !b || !destination) return { ok: false, message: 'Bind an assembly and a ground destination.' };
  const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, dy = +destination.y - b.min.y, next = shiftSnapshot(snapshotTransforms(rec), +destination.x - cx, dy, +destination.z - cz); if (!applyTransforms(rec, next)) return { ok: false, message: `${rec.label} could not move.` };
  if (rec.state.closed) rec.state.closed = shiftSnapshot(rec.state.closed, +destination.x - cx, dy, +destination.z - cz); saveRecord(rec, 'moved'); event('moved', { assembly: rec.id, label: rec.label }); return { ok: true, message: `${rec.label} moved.` };
}
function turnAssembly(target) {
  const a = resolve(target), rec = a && store.assemblies[a.id], b = rec && recordBounds(rec); if (!rec || !b) return { ok: false, message: 'That assembly has no live geometry.' };
  if (rec.state.open) setOpen(a, false, {}); const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, next = rotateSnapshot(snapshotTransforms(rec), cx, cz, 1); if (!applyTransforms(rec, next)) return { ok: false, message: `${rec.label} could not turn.` };
  if (rec.state.closed) rec.state.closed = rotateSnapshot(rec.state.closed, cx, cz, 1); saveRecord(rec, 'turned'); event('turned', { assembly: rec.id, label: rec.label }); return { ok: true, message: `${rec.label} turned.` };
}
async function copyAssembly(target, destination) {
  const a = resolve(target), rec = a && store.assemblies[a.id], b = rec && recordBounds(rec), w = W(); if (!rec || !b || !destination || !w) return { ok: false, message: 'Bind an assembly and a ground destination.' };
  const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, dx = +destination.x - cx, dy = +destination.y - b.min.y, dz = +destination.z - cz, m = liveMembers(rec, false);
  const rows = m.pieces.map(x => [x.item.id, x.item.part, x.item.col, x.item.x + dx, x.item.y + dy, x.item.z + dz, x.item.rot, x.item.op]); const pieces = rows.length ? w.build.addRows(rows, false, true) : [];
  const props = [];
  for (const x of m.props) { const src = { ...(x.item.src || {}) }; delete src.assembly; delete src.assemblyRoot; const it = await w.props.place(x.item.mpd, x.item.x + dx, x.item.y + dy, x.item.z + dz, x.item.yaw, false, src); if (it) props.push({ item: it, op: x.ref.op }); }
  const rootId = newId('asm'), copy = { id: rootId, rootId, scope: 'root', label: `${rec.label} copy`, members: { pieces: pieces.map(p => memberRef('piece', p, p.op)), props: props.map(x => memberRef('prop', x.item, x.op)) }, traits: clone(rec.traits || {}), state: {}, source: { kind: 'copy', copiedFrom: rec.id }, createdAt: nowISO(), updatedAt: nowISO(), pendingUntil: Date.now() + 3000 };
  initializeState(copy); store.assemblies[rootId] = copy; recordBounds(copy); reindex(); saveRecord(copy, 'copied'); tagProps(copy); event('copied', { source: rec.id, assembly: copy.id, label: copy.label }); return { ok: true, message: `${rec.label} copied.`, assembly: copy.id };
}
function manipulate(verb, target, context) {
  verb = String(verb || '').toLowerCase(); if (verb === 'move') return moveAssembly(target, context?.destination); if (verb === 'copy') return copyAssembly(target, context?.destination); if (verb === 'remove') return removeAssembly(target, context || {}); if (verb === 'turn') return turnAssembly(target); return { ok: false, message: `No assembly operation for ${verb}.` };
}
function armLink(target, text) {
  const a = resolve(target), rec = a && store.assemblies[a.id]; if (!rec) return { ok: false, message: 'Bind the source assembly first.' };
  const eventName = /\b(open|opened)\b/i.test(text) ? 'opened' : /\b(close|closed)\b/i.test(text) ? 'closed' : /\b(break|broken|deplet|destroy)\b/i.test(text) ? 'depleted' : 'activated'; pendingLink = { source: rec.id, event: eventName, at: Date.now() };
  return { ok: true, message: `${rec.label} ${eventName} is the trigger. Point at the target and say “open that when triggered,” “activate that when triggered,” or “remove that when triggered.”`, pending: true };
}
function completeLink(target, action, text) {
  if (!pendingLink || Date.now() - pendingLink.at > 120000) { pendingLink = null; return { ok: false, message: 'No trigger is armed. Bind the source and say “when that activates.”' }; }
  const a = resolve(target), rec = a && store.assemblies[a.id]; if (!rec) return { ok: false, message: 'Bind the target assembly.' };
  const link = registerLink(pendingLink.source, pendingLink.event, rec.id, action, /\b(once|one time)\b/i.test(text || ''), false); const source = store.assemblies[pendingLink.source]; pendingLink = null;
  return link ? { ok: true, message: `${source?.label || 'The source'} ${link.event} will ${action} ${rec.label}.`, link: link.id } : { ok: false, message: 'That link could not be made.' };
}
function fire(sourceId, eventName, visited) {
  ensureStore(); visited = visited || new Set(); const token = `${sourceId}:${eventName}`; if (visited.has(token) || visited.size > 12) return 0; visited.add(token); let n = 0;
  for (const link of Object.values(store.links)) {
    if (!link || link.enabled === false || link.source !== sourceId || link.event !== eventName) continue; const key = `${link.id}:${link.action}`; if (visited.has(key)) continue; visited.add(key); const target = assemblyTarget(store.assemblies[link.target]); if (!target) continue;
    const result = link.action === 'open' ? setOpen(target, true, { fromLink: true }) : link.action === 'close' ? setOpen(target, false, { fromLink: true }) : link.action === 'activate' ? activate(target) : removeAssembly(target, { fromLink: true });
    if (result?.ok) { n++; link.fired = (link.fired || 0) + 1; link.lastFiredAt = nowISO(); if (link.once) link.enabled = false; store.links[link.id] = link; }
  }
  if (n) { persist(); broadcast({ type: 'links-fired', source: sourceId, event: eventName, links: clone(store.links) }); }
  return n;
}
function perform(verb, target, context) {
  verb = VERB_ALIASES[String(verb || '').toLowerCase()] || String(verb || '').toLowerCase();
  if (verb === 'arm') return armLink(target, context?.text || '');
  if (/^link-/.test(verb)) return completeLink(target, verb.slice(5), context?.text || '');
  if (!target) return { ok: false, message: 'Bind THAT first.' };
  if (verb === 'teach') return teachFromText(target, context?.text || '');
  const a = resolve(target, { trait: traitForVerb(verb), whole: /\b(whole|entire|all|build)\b/i.test(context?.text || '') }); if (!a) return null;
  if (verb === 'inspect') return { ok: true, message: `${describe(a)} · verbs: ${verbsFor(a).join(', ')}.` };
  if (verb === 'open') return setOpen(a, true, context || {}); if (verb === 'close') return setOpen(a, false, context || {}); if (verb === 'activate') return activate(a); if (verb === 'hit') return applyDamage(a, context?.damage, context?.kind || 'command', context); if (verb === 'mount') return mount(a);
  return { ok: false, message: `No assembly behavior for ${verb}.` };
}
function candidateCenter(item) { if (item?.box?.getCenter) return item.box.getCenter(new THREE.Vector3()); if (finite(+item?.x) && finite(+item?.y) && finite(+item?.z)) return new THREE.Vector3(+item.x, +item.y, +item.z); return null; }
function attackCone(options) {
  const world = options?.world || W(); if (!world) return 0; const origin = options.origin, facing = options.facing; if (!origin || !facing) return 0;
  const range = finite(+options.range) ? +options.range : 110, vertical = finite(+options.vertical) ? +options.vertical : 100, dotMin = finite(+options.dotMin) ? +options.dotMin : .45, maxHits = finite(+options.maxHits) ? +options.maxHits : 6, candidates = [];
  const pieces = world.build?.nearPoint ? world.build.nearPoint(origin.x, origin.z, range) : world.build?.pieces?.values?.(); if (pieces) for (const item of pieces) candidates.push({ kind: 'piece', id: item.id, item, name: world.build?.kinds?.get?.(item.part)?.name || 'brick' });
  const props = world.props?.near ? world.props.near(origin.x, origin.z, range) : world.props?.items?.values?.(); if (props) for (const item of props) if (!item?.src?.rehearsal) candidates.push({ kind: 'prop', id: item.id, item, name: item.src?.name || item.src?.kind || 'model' });
  const hitAssemblies = new Set(); let count = 0;
  for (const hit of candidates) {
    if (count >= maxHits) break; const c = candidateCenter(hit.item); if (!c) continue; const d = c.clone().sub(origin); if (Math.abs(d.y) >= vertical) continue; d.y = 0; const len = d.length(); if (!len || len >= range || d.normalize().dot(facing) <= dotMin) continue;
    const a = resolve(hit, { trait: 'damageable' });
    if (a) { if (hitAssemblies.has(a.id)) continue; const p = profile(a); if (!p?.traits.damageable) continue; hitAssemblies.add(a.id); if (applyDamage(a, options.damage, options.kind || 'attack', options).ok) count++; }
    else if (baseBehavior?.profile && baseBehavior.profile(hit)?.traits?.damageable && baseBehavior.applyDamage(hit, options.damage, options.kind || 'attack')?.ok) count++;
  }
  return count;
}
function integrity() {
  ensureStore(); const missing = [], empty = [], links = [];
  for (const rec of Object.values(store.assemblies)) { const m = liveMembers(rec, false); for (const kind of ['pieces', 'props']) for (const ref of rec.members[kind] || []) if (!live(ref) && Date.now() > +(rec.pendingUntil || 0)) missing.push({ assembly: rec.id, kind, id: ref.id }); if (!m.pieces.length && !m.props.length && Date.now() > +(rec.pendingUntil || 0)) empty.push(rec.id); }
  for (const l of Object.values(store.links)) if (!store.assemblies[l.source] || !store.assemblies[l.target] || !LINK_ACTIONS.has(l.action)) links.push(l.id);
  return { ok: !missing.length && !empty.length && !links.length, assemblies: Object.keys(store.assemblies).length, links: Object.keys(store.links).length, missing, empty, brokenLinks: links };
}
function reconcile() {
  const report = integrity(); if (report.ok) return report; for (const id of report.empty) delete store.assemblies[id]; for (const id of report.brokenLinks) delete store.links[id];
  for (const miss of report.missing) { const rec = store.assemblies[miss.assembly]; if (rec) rec.members[miss.kind] = (rec.members[miss.kind] || []).filter(x => x.id !== miss.id); }
  reindex(); persist(); return integrity();
}
function snapshot() { ensureStore(); return clone({ version: VERSION, place: placeKey(), assemblies: store.assemblies, links: store.links, updatedAt: store.updatedAt }); }
function applySnapshot(data, remote) {
  if (!data || typeof data !== 'object') return false; ensureStore(); applyingRemote = !!remote;
  try {
    for (const rec of Object.values(data.assemblies || {})) { const old = store.assemblies[rec.id]; if (!old || String(rec.updatedAt || '') >= String(old.updatedAt || '')) store.assemblies[rec.id] = clone(rec); }
    for (const l of Object.values(data.links || {})) { const old = store.links[l.id]; if (!old || String(l.updatedAt || '') >= String(old.updatedAt || '')) store.links[l.id] = clone(l); }
    reindex(); persist(); return true;
  } finally { applyingRemote = false; }
}
function applyRemote(op) {
  if (!op || typeof op !== 'object') return false; ensureStore(); applyingRemote = true;
  try {
    if (op.type === 'upsert' && op.record) store.assemblies[op.record.id] = clone(op.record);
    else if (op.type === 'commit') { for (const rec of op.records || []) store.assemblies[rec.id] = clone(rec); for (const l of op.links || []) store.links[l.id] = clone(l); }
    else if (op.type === 'remove') { for (const id of op.assemblyIds || []) delete store.assemblies[id]; for (const id of op.memberIds || []) for (const rec of Object.values(store.assemblies)) { rec.members.pieces = (rec.members.pieces || []).filter(x => x.id !== id); rec.members.props = (rec.members.props || []).filter(x => x.id !== id); } }
    else if (op.type === 'link' && op.link) store.links[op.link.id] = clone(op.link);
    else if (op.type === 'links-fired' && op.links) store.links = { ...store.links, ...clone(op.links) };
    else if (op.type === 'clear') { store = freshStore(); }
    else if (op.type === 'event' && op.event) { store.events.push(clone(op.event)); if (store.events.length > EVENT_LIMIT) store.events.shift(); }
    reindex(); persist(); return true;
  } finally { applyingRemote = false; }
}
function clearPlace(remote) { store = freshStore(); memberIndex = new Map(); pendingLink = null; persist(); if (!remote) broadcast({ type: 'clear' }); return true; }
function exportData() { ensureStore(); return clone({ ...store, exportedAt: nowISO(), integrity: integrity() }); }
function downloadData() { const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `word-to-world-assemblies-${slug(placeKey())}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); }
function paintMenu() {
  const row = document.querySelector?.('.assemblies-row'); if (!row) return; ensureStore(); const stat = row.querySelector('[data-assembly-stat]'); if (stat) stat.textContent = `${Object.keys(store.assemblies).length} assemblies · ${Object.keys(store.links).length} links`;
}
function installMenu() {
  const menu = document.getElementById?.('menu'); if (!menu || menu.querySelector('.assemblies-row')) { paintMenu(); return false; }
  const row = document.createElement('div'); row.className = 'row assemblies-row'; row.innerHTML = '<span>assemblies</span><button type="button" data-assembly-export>export</button><button type="button" data-assembly-check>check</button><button type="button" data-assembly-clear>clear</button><em data-assembly-stat></em>';
  row.querySelector('[data-assembly-export]').onclick = downloadData; row.querySelector('[data-assembly-check]').onclick = () => { const r = reconcile(); alert(r.ok ? `Assembly graph is coherent: ${r.assemblies} assemblies, ${r.links} links.` : JSON.stringify(r, null, 2)); };
  row.querySelector('[data-assembly-clear]').onclick = () => { if (confirm('Clear assembly identities, behaviors, state, and links for this place? The LEGO geometry remains.')) clearPlace(false); };
  menu.appendChild(row); paintMenu(); return true;
}
function installAiSpec() {
  if (window.Ai && !Ai.__assembliesV2) { const old = Ai.system && Ai.system.bind(Ai); if (old) Ai.system = () => old() + BEHAVIOR_SPEC; Ai.__assembliesV2 = true; }
  if (window.Dsl && !Dsl.__assembliesV2 && typeof Dsl.captionOp === 'function') { const old = Dsl.captionOp.bind(Dsl); Dsl.captionOp = op => { const c = old(op), t = Object.keys(normalizeBehavior(op?.behavior || op?.behaviors)); return t.length ? `${c} [${t.join(', ')}]` : c; }; Dsl.__assembliesV2 = true; }
}
function installBehaviorBridge() {
  const B = window.WorldBehavior; if (!B || B.__assembliesV2) return false;
  baseBehavior = { profile: B.profile?.bind(B), verbsFor: B.verbsFor?.bind(B), describe: B.describe?.bind(B), describeShort: B.describeShort?.bind(B), perform: B.perform?.bind(B), teachFromText: B.teachFromText?.bind(B), applyDamage: B.applyDamage?.bind(B), attackCone: B.attackCone?.bind(B), exportData: B.exportData?.bind(B) };
  B.profile = target => { const a = resolve(target); return a ? profile(a) : baseBehavior.profile?.(target); };
  B.traits = target => B.profile(target)?.traits || {};
  B.verbsFor = target => { const a = resolve(target); return a ? verbsFor(a) : baseBehavior.verbsFor?.(target) || []; };
  B.describe = target => { const a = resolve(target); return a ? describe(a) : baseBehavior.describe?.(target) || 'unknown'; };
  B.describeShort = target => { const a = resolve(target); return a ? describeShort(a) : baseBehavior.describeShort?.(target) || 'inspectable'; };
  B.perform = (verb, target, context) => { const r = perform(verb, target, context); return r == null ? baseBehavior.perform?.(verb, target, context) || { ok: false, message: 'No behavior handler.' } : r; };
  B.teachFromText = (target, text) => teachFromText(target, text);
  B.applyDamage = (target, amount, kind) => { const a = resolve(target, { trait: 'damageable' }); return a ? applyDamage(a, amount, kind) : baseBehavior.applyDamage?.(target, amount, kind); };
  B.attackCone = attackCone; B.__assembliesV2 = { base: baseBehavior }; window.Behavior = B; return true;
}
function boot() {
  if (installed) return; installed = true; ensureStore(); installAiSpec(); installBehaviorBridge(); installMenu();
  const timer = setInterval(() => { installAiSpec(); installBehaviorBridge(); installMenu(); }, 700); setTimeout(() => clearInterval(timer), 45000);
  setInterval(() => { if (store) reconcile(); }, 30000);
  console.info('[assemblies] complete assembly runtime v' + VERSION);
}

const API = {
  version: VERSION, resolve, box: target => { const a = resolve(target); return a ? recordBounds(store.assemblies[a.id]) : target?.box || null; }, profile, verbsFor, describe, describeShort,
  registerCommit, decorateProgram, rideForProgram, manipulate, perform, teachFromText, applyDamage, attackCone,
  armLink, completeLink, registerLink, snapshot, applySnapshot, applyRemote, clearPlace, reconcile, integrity, exportData, downloadData,
  isAssembly: target => !!(target && target.kind === 'assembly' && (store?.assemblies?.[target.id] || target.item)),
  pendingLink: () => clone(pendingLink),
  selfTest() { ensureStore(); const b = normalizeBehavior({ openable: true, breakable: { maxHp: 80 }, nonsense: true }); return !!(b.openable && b.damageable?.destroyOnZero && b.damageable.maxHp === 80 && !b.nonsense); }
};
window.WorldAssemblies = API;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
