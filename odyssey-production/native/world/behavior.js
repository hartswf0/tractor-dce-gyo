/* world/behavior.js — behavior-bearing assemblies for Word to World.
   Geometry remains authoritative for contact and placement. This layer adds a small,
   persistent vocabulary of what a placed thing can do and what can be done to it. */
(function () {
'use strict';

const VERSION = 1;
const PREFIX = 'wtw.behavior.v1';
const EVENT_LIMIT = 160;
const TRAIT_ALIASES = {
  door: 'openable', gate: 'openable', hatch: 'openable', lid: 'openable', shutter: 'openable',
  target: 'damageable', breakable: 'damageable', destructible: 'damageable',
  switch: 'activatable', trigger: 'activatable', usable: 'activatable',
  vehicle: 'rideable', mount: 'rideable', movable: 'moveable', rotatable: 'rotatable'
};
const VERB_ALIASES = {
  describe: 'inspect', read: 'inspect', look: 'inspect',
  shut: 'close', toggle: 'activate', use: 'activate', trigger: 'activate',
  slash: 'hit', strike: 'hit', cut: 'hit', attack: 'hit', damage: 'hit',
  ride: 'mount', board: 'mount'
};

const listeners = new Map();
let cacheKey = '';
let cache = null;
let eventCache = null;

const W = () => window.__world || null;
const nowISO = () => new Date().toISOString();
const finite = Number.isFinite;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function safeJSON(value, fallback) {
  try { return JSON.parse(value); } catch (e) { return fallback; }
}
function worldPlaceKey() {
  const w = W(), p = w && w.place;
  if (p && finite(+p.lat) && finite(+p.lon)) {
    return `${w.world || 'world'}:${(+p.lat).toFixed(3)},${(+p.lon).toFixed(3)}`;
  }
  const q = new URLSearchParams(location.search);
  return `${q.get('world') || (w && w.world) || 'earth'}:${location.pathname}`;
}
function recordsKey() { return `${PREFIX}:records:${worldPlaceKey()}`; }
function eventsKey() { return `${PREFIX}:events:${worldPlaceKey()}`; }
function ensureStore() {
  const key = recordsKey();
  if (key !== cacheKey || !cache) {
    cacheKey = key;
    try {
      cache = safeJSON(localStorage.getItem(key), {}) || {};
      eventCache = safeJSON(localStorage.getItem(eventsKey()), []) || [];
    } catch (e) { cache = {}; eventCache = []; }
  }
  return cache;
}
function persist() {
  try {
    localStorage.setItem(recordsKey(), JSON.stringify(cache || {}));
    localStorage.setItem(eventsKey(), JSON.stringify((eventCache || []).slice(-EVENT_LIMIT)));
  } catch (e) { console.warn('[behavior] persistence unavailable', e); }
}
function emit(type, detail) {
  const packet = { version: VERSION, type, at: nowISO(), place: worldPlaceKey(), ...detail };
  ensureStore();
  eventCache.push(packet);
  if (eventCache.length > EVENT_LIMIT) eventCache.splice(0, eventCache.length - EVENT_LIMIT);
  persist();
  const set = listeners.get(type); if (set) for (const fn of set) try { fn(packet); } catch (e) { console.warn('[behavior] listener', e); }
  const all = listeners.get('*'); if (all) for (const fn of all) try { fn(packet); } catch (e) { console.warn('[behavior] listener', e); }
  try { window.dispatchEvent(new CustomEvent('world:behavior', { detail: packet })); } catch (e) { }
  return packet;
}
function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type)?.delete(fn);
}

function unwrap(target) { return target && (target.item || target); }
function kindOf(target) {
  if (!target) return 'unknown';
  if (target.kind) return target.kind;
  const item = unwrap(target), w = W();
  if (item && w?.build?.pieces?.has?.(item.id)) return 'piece';
  if (item && w?.props?.items?.has?.(item.id)) return 'prop';
  return item?.kind || 'unknown';
}
function idOf(target) {
  const item = unwrap(target);
  return String((target && target.id) || (item && item.id) || '');
}
function labelOf(target) {
  const item = unwrap(target), kind = kindOf(target), w = W();
  if (target?.name) return String(target.name);
  if (kind === 'piece' && item) return String(w?.build?.kinds?.get?.(item.part)?.name || item.part || 'brick');
  if (kind === 'prop' && item) {
    const s = item.src || {};
    return String(s.name || s.kind || s.as || s.kit || s.op || item.kit || item.id || 'model');
  }
  return String(item?.name || item?.id || kind || 'thing');
}
function textOf(target) {
  const item = unwrap(target), src = item?.src || {}, op = item?.op || src.op || {};
  // Stable ids are persistence keys, not words. They must never manufacture a behavior.
  const values = [target?.name, target?.kind, item?.name, item?.kind, item?.kit, item?.part,
    src.name, src.kind, src.as, src.kit, src.op,
    typeof op === 'string' ? op : op?.op, op?.kind, op?.name, op?.label];
  return values.filter(Boolean).join(' ').toLowerCase();
}
function clone(value) {
  if (value == null || typeof value !== 'object') return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (e) { return value; }
}
function mergeTrait(out, name, value) {
  name = TRAIT_ALIASES[String(name || '').toLowerCase()] || String(name || '').toLowerCase();
  if (!name) return;
  if (value === false || value == null) { delete out[name]; return; }
  if (value === true) value = {};
  if (typeof value !== 'object') value = { value };
  out[name] = { ...(out[name] || {}), ...clone(value) };
}
function mergeSpec(out, spec) {
  if (!spec) return out;
  if (typeof spec === 'string') {
    for (const name of spec.split(/[\s,|]+/)) if (name) mergeTrait(out, name, true);
    return out;
  }
  if (Array.isArray(spec)) { for (const x of spec) mergeSpec(out, x); return out; }
  if (typeof spec === 'object') {
    if (spec.traits) mergeSpec(out, spec.traits);
    if (spec.behavior) mergeSpec(out, spec.behavior);
    if (spec.behaviors) mergeSpec(out, spec.behaviors);
    for (const [name, value] of Object.entries(spec)) {
      if (/^(traits|behavior|behaviors|state|label|version)$/.test(name)) continue;
      mergeTrait(out, name, value);
    }
  }
  return out;
}
function inferredTraits(target) {
  const out = {}, kind = kindOf(target), item = unwrap(target), text = textOf(target);
  mergeTrait(out, 'inspectable', true);
  if (kind === 'piece' || kind === 'prop') {
    mergeTrait(out, 'moveable', true);
    mergeTrait(out, 'rotatable', true);
    mergeTrait(out, 'copyable', true);
    mergeTrait(out, 'removable', true);
  }
  if (/\b(door|gate|hatch|lid|shutter)\b/.test(text)) mergeTrait(out, 'openable', { angle: Math.PI / 2 });
  if (/\b(target|dummy|practice-target)\b/.test(text) && !item?.src?.rehearsal) mergeTrait(out, 'damageable', { maxHp: 100, damage: 35, destroyOnZero: false });
  if (/\b(switch|button|lever|beacon|altar|torch|trigger)\b/.test(text)) mergeTrait(out, 'activatable', true);
  if (/\b(horse|boat|vehicle|car|bike|walker|ship|mount)\b/.test(text)) mergeTrait(out, 'rideable', true);
  mergeSpec(out, item?.behavior);
  mergeSpec(out, item?.behaviors);
  mergeSpec(out, item?.traits);
  mergeSpec(out, item?.src?.behavior);
  mergeSpec(out, item?.src?.behaviors);
  mergeSpec(out, item?.src?.traits);
  mergeSpec(out, item?.op?.behavior);
  mergeSpec(out, item?.op?.behaviors);
  return out;
}
function explicitRecord(target, create) {
  ensureStore();
  const id = idOf(target); if (!id) return null;
  if (!cache[id] && create) cache[id] = { id, label: labelOf(target), traits: {}, state: {}, createdAt: nowISO(), updatedAt: nowISO() };
  return cache[id] || null;
}
function profile(target) {
  const inferred = inferredTraits(target), rec = explicitRecord(target, false), traits = { ...inferred };
  if (rec?.traits) mergeSpec(traits, rec.traits);
  const state = { ...(rec?.state || {}) };
  if (traits.damageable) {
    const max = finite(+traits.damageable.maxHp) ? +traits.damageable.maxHp : 100;
    state.maxHp = finite(+state.maxHp) ? +state.maxHp : max;
    state.hp = finite(+state.hp) ? +state.hp : state.maxHp;
  }
  if (traits.openable) state.open = !!state.open;
  if (traits.activatable) state.active = !!state.active;
  return { id: idOf(target), kind: kindOf(target), label: rec?.label || labelOf(target), traits, state, explicit: !!rec };
}
function traitNames(target) { return Object.keys(profile(target).traits).filter(x => !/^(inspectable|moveable|rotatable|copyable|removable)$/.test(x)); }
function verbsFor(target) {
  const p = profile(target), t = p.traits, out = ['inspect'];
  if (t.openable) out.push(p.state.open ? 'close' : 'open');
  if (t.damageable && p.state.hp > 0) out.push('hit');
  if (t.activatable) out.push('activate');
  if (t.rideable) out.push('mount');
  return out;
}
function describe(target) {
  const p = profile(target), details = [];
  if (p.traits.openable) details.push(p.state.open ? 'open' : 'closed');
  if (p.traits.damageable) details.push(`${Math.max(0, Math.round(p.state.hp))}/${Math.round(p.state.maxHp)} hp`);
  if (p.traits.activatable) details.push(p.state.active ? 'active' : 'inactive');
  const names = traitNames(target);
  return `${p.label}${names.length ? ' · ' + names.join(', ') : ''}${details.length ? ' · ' + details.join(', ') : ''}`;
}
function describeShort(target) {
  const verbs = verbsFor(target);
  return verbs.length > 1 ? `can ${verbs.slice(1).join(', ')}` : 'inspectable';
}
function saveState(target, patch) {
  const rec = explicitRecord(target, true); if (!rec) return null;
  rec.label = labelOf(target);
  rec.state = { ...(rec.state || {}), ...clone(patch) };
  rec.updatedAt = nowISO(); persist(); return rec;
}
function saveTrait(target, trait, options) {
  const rec = explicitRecord(target, true); if (!rec) return null;
  mergeTrait(rec.traits, trait, options == null ? true : options);
  rec.updatedAt = nowISO(); persist();
  emit('trait-taught', { id: rec.id, label: rec.label, trait: TRAIT_ALIASES[trait] || trait, options: clone(options) });
  return rec;
}
function forget(target, trait) {
  ensureStore(); const id = idOf(target), rec = cache[id]; if (!rec) return false;
  if (trait) { delete rec.traits[TRAIT_ALIASES[trait] || trait]; rec.updatedAt = nowISO(); }
  else delete cache[id];
  persist(); emit('trait-forgotten', { id, trait: trait || '*', label: labelOf(target) }); return true;
}
function teachFromText(target, text) {
  text = String(text || '').toLowerCase();
  if (/\b(forget|clear|remove)\b.*\b(behavior|behaviour|trait|meaning)\b/.test(text)) {
    const ok = forget(target); return { ok, message: ok ? `${labelOf(target)} has no taught behavior.` : `${labelOf(target)} had no taught behavior.` };
  }
  let trait = null, options = true;
  if (/\b(openable|door|gate|hatch)\b/.test(text)) trait = 'openable', options = { angle: Math.PI / 2 };
  else if (/\b(target|damageable|breakable|destructible)\b/.test(text)) trait = 'damageable', options = { maxHp: 100, damage: 35, destroyOnZero: false };
  else if (/\b(rideable|vehicle|mount)\b/.test(text)) trait = 'rideable';
  else if (/\b(activatable|switch|trigger|usable)\b/.test(text)) trait = 'activatable';
  else if (/\b(moveable|movable)\b/.test(text)) trait = 'moveable';
  else if (/\b(rotatable|turnable)\b/.test(text)) trait = 'rotatable';
  if (!trait) return { ok: false, message: 'Name a behavior: openable, target, activatable, rideable, moveable, or rotatable.' };
  saveTrait(target, trait, options);
  if (trait === 'damageable') saveState(target, { hp: 100, maxHp: 100 });
  return { ok: true, message: `${labelOf(target)} is now ${trait}.` };
}

function pulse(target, color) {
  const item = unwrap(target), group = item?.group;
  if (group?.scale) {
    const s = group.scale.clone(); group.scale.multiplyScalar(.92);
    setTimeout(() => { if (group?.scale) group.scale.copy(s); }, 110);
  }
  const mark = document.getElementById('hitmark');
  if (mark) { mark.style.filter = color ? `drop-shadow(0 0 6px ${color})` : ''; mark.classList.remove('hit'); void mark.offsetWidth; mark.classList.add('hit'); }
}
function rotatePiece(target, desiredOpen, spec, state) {
  const w = W(), B = w?.build, p = unwrap(target); if (!B || !p || !B.pieces?.has?.(p.id)) return false;
  const baseRot = finite(+state.baseRot) ? +state.baseRot : (+p.rot || 0);
  const openSteps = finite(+spec.steps) ? Math.round(+spec.steps) : 1;
  B.take(p.id, true); p.rot = desiredOpen ? ((baseRot + openSteps) & 3) : (baseRot & 3); p.box = null;
  const q = B.add(p, false); if (q && B.onEdit) B.onEdit({ up: [B.toRow(q)] });
  return !!q;
}
function rotateProp(target, desiredOpen, spec, state) {
  const w = W(), P = w?.props, p = unwrap(target); if (!P || !p || !P.items?.has?.(p.id)) return false;
  const baseYaw = finite(+state.baseYaw) ? +state.baseYaw : (+p.yaw || 0);
  const angle = finite(+spec.angle) ? +spec.angle : Math.PI / 2;
  P.moveTo(p, p.x, p.y, p.z, desiredOpen ? baseYaw + angle : baseYaw, false);
  return true;
}
function setOpen(target, desiredOpen) {
  const p = profile(target), spec = p.traits.openable; if (!spec) return { ok: false, message: `${p.label} is not openable.` };
  const item = unwrap(target), kind = kindOf(target), baseline = {};
  if (kind === 'piece') baseline.baseRot = finite(+p.state.baseRot) ? +p.state.baseRot : (+item?.rot || 0);
  if (kind === 'prop') baseline.baseYaw = finite(+p.state.baseYaw) ? +p.state.baseYaw : (+item?.yaw || 0);
  let ok = false;
  if (kind === 'piece') ok = rotatePiece(target, desiredOpen, spec, { ...p.state, ...baseline });
  else if (kind === 'prop') ok = rotateProp(target, desiredOpen, spec, { ...p.state, ...baseline });
  if (!ok) return { ok: false, message: `${p.label} has an open behavior but no compatible motion adapter.` };
  saveState(target, { ...baseline, open: desiredOpen }); pulse(target);
  emit(desiredOpen ? 'opened' : 'closed', { id: p.id, label: p.label, kind });
  return { ok: true, message: `${p.label} ${desiredOpen ? 'opened' : 'closed'}.` };
}
function removeTarget(target) {
  const w = W(), kind = kindOf(target), id = idOf(target);
  if (kind === 'piece' && w?.build?.remove) return !!w.build.remove(id);
  if (kind === 'prop' && w?.props?.remove) return !!w.props.remove(id);
  const item = unwrap(target); if (item?.group) { item.group.visible = false; return true; }
  return false;
}
function applyDamage(target, amount, kind) {
  const p = profile(target), spec = p.traits.damageable;
  if (!spec) return { ok: false, message: `${p.label} is not a target.` };
  const hit = finite(+amount) ? Math.max(0, +amount) : (finite(+spec.damage) ? +spec.damage : 35);
  const hp = clamp((finite(+p.state.hp) ? +p.state.hp : +p.state.maxHp) - hit, 0, +p.state.maxHp);
  saveState(target, { hp, maxHp: p.state.maxHp }); pulse(target, '#d8382e');
  emit('damaged', { id: p.id, label: p.label, kind: kind || 'hit', damage: hit, hp, maxHp: p.state.maxHp });
  if (hp <= 0) {
    const destroyed = spec.destroyOnZero === true ? removeTarget(target) : false;
    emit('depleted', { id: p.id, label: p.label, destroyed });
    return { ok: true, message: destroyed ? `${p.label} broke apart.` : `${p.label} is down.`, hp, maxHp: p.state.maxHp, destroyed };
  }
  return { ok: true, message: `${p.label}: ${Math.round(hp)} / ${Math.round(p.state.maxHp)}.`, hp, maxHp: p.state.maxHp };
}
function activate(target) {
  const p = profile(target); if (!p.traits.activatable) return { ok: false, message: `${p.label} is not activatable.` };
  const active = !p.state.active; saveState(target, { active }); pulse(target, active ? '#2fbf3f' : '#c8901c');
  emit(active ? 'activated' : 'deactivated', { id: p.id, label: p.label, active });
  return { ok: true, message: `${p.label} ${active ? 'activated' : 'deactivated'}.`, active };
}
function mount(target) {
  const p = profile(target); if (!p.traits.rideable) return { ok: false, message: `${p.label} is not rideable.` };
  const item = unwrap(target), w = W();
  emit('mount-requested', { id: p.id, label: p.label, kind: kindOf(target) });
  if (w?.rig?.pos && item?.box) {
    const c = item.box.getCenter(new THREE.Vector3()), d = w.rig.pos.clone().sub(c); d.y = 0;
    if (d.length() > 75) {
      d.setLength(60); w.rig.pos.set(c.x + d.x, Math.max(w.G?.h?.(c.x + d.x, c.z + d.z) || c.y, item.box.min.y), c.z + d.z); w.rig.cam.set = false;
    }
  }
  return { ok: true, message: `${p.label} is ready. Press E to mount or board.` };
}
function perform(verb, target, context) {
  verb = VERB_ALIASES[String(verb || '').toLowerCase()] || String(verb || '').toLowerCase();
  if (!target) return { ok: false, message: 'Bind THAT first.' };
  if (verb === 'inspect') return { ok: true, message: `${describe(target)} · verbs: ${verbsFor(target).join(', ')}.` };
  if (verb === 'teach') return teachFromText(target, context?.text || '');
  if (verb === 'open') return setOpen(target, true);
  if (verb === 'close') return setOpen(target, false);
  if (verb === 'activate') return activate(target);
  if (verb === 'hit') return applyDamage(target, context?.damage, context?.kind || 'command');
  if (verb === 'mount') return mount(target);
  return { ok: false, message: `No behavior handler for ${verb}.` };
}

function candidateCenter(item) {
  if (item?.box?.getCenter) return item.box.getCenter(new THREE.Vector3());
  if (finite(+item?.x) && finite(+item?.y) && finite(+item?.z)) return new THREE.Vector3(+item.x, +item.y, +item.z);
  return null;
}
function attackCone(options) {
  const world = options?.world || W(); if (!world) return 0;
  const origin = options.origin, facing = options.facing; if (!origin || !facing) return 0;
  const range = finite(+options.range) ? +options.range : 110;
  const vertical = finite(+options.vertical) ? +options.vertical : 100;
  const dotMin = finite(+options.dotMin) ? +options.dotMin : .45;
  const maxHits = finite(+options.maxHits) ? +options.maxHits : 6;
  const candidates = [];
  const pieces = world.build?.nearPoint ? world.build.nearPoint(origin.x, origin.z, range) : world.build?.pieces?.values?.();
  if (pieces) for (const item of pieces) candidates.push({ kind: 'piece', id: item.id, item, name: world.build?.kinds?.get?.(item.part)?.name || 'brick' });
  const props = world.props?.near ? world.props.near(origin.x, origin.z, range) : world.props?.items?.values?.();
  if (props) for (const item of props) if (!item?.src?.rehearsal) candidates.push({ kind: 'prop', id: item.id, item, name: labelOf({ kind: 'prop', item }) });
  let count = 0;
  for (const hit of candidates) {
    if (count >= maxHits || !profile(hit).traits.damageable) continue;
    const c = candidateCenter(hit.item); if (!c) continue;
    const d = c.clone().sub(origin); if (Math.abs(d.y) >= vertical) continue; d.y = 0;
    const len = d.length(); if (!len || len >= range || d.normalize().dot(facing) <= dotMin) continue;
    const result = applyDamage(hit, options.damage, options.kind || 'attack'); if (result.ok) count++;
  }
  return count;
}

function exportData() {
  ensureStore();
  return { version: VERSION, place: worldPlaceKey(), exportedAt: nowISO(), records: clone(cache), events: clone(eventCache) };
}
function downloadData() {
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `word-to-world-behaviors-${worldPlaceKey().replace(/[^a-z0-9_-]+/gi, '-')}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
function clearPlace() {
  cache = {}; eventCache = []; persist(); emit('place-cleared', { label: worldPlaceKey() }); return true;
}
function installMenu() {
  const menu = document.getElementById('menu'); if (!menu || menu.querySelector('.behavior-row')) return false;
  const row = document.createElement('div'); row.className = 'row behavior-row';
  row.innerHTML = '<span>behavior</span><button type="button" data-behavior-export>export</button><button type="button" data-behavior-clear>clear place</button><em>point + say “make that a target/openable,” then “hit/open that”</em>';
  row.querySelector('[data-behavior-export]').onclick = downloadData;
  row.querySelector('[data-behavior-clear]').onclick = () => { if (confirm('Clear taught behaviors and behavior history for this place?')) clearPlace(); };
  menu.appendChild(row); return true;
}
function bootUI() {
  installMenu();
  const timer = setInterval(installMenu, 800);
  setTimeout(() => clearInterval(timer), 30000);
}

const API = {
  version: VERSION,
  profile, traits: target => profile(target).traits, verbsFor, describe, describeShort,
  perform, teachFromText, teach: saveTrait, forget, applyDamage, attackCone,
  exportData, downloadData, clearPlace, on, emit,
  refresh() { cacheKey = ''; ensureStore(); },
  selfTest() {
    const dummy = { kind: 'prop', id: '__behavior-test__', name: 'test door', item: { id: '__behavior-test__', yaw: 0, src: { kind: 'door' } } };
    const p = profile(dummy); return !!(p.traits.openable && verbsFor(dummy).includes('open'));
  }
};
window.WorldBehavior = API;
if (!window.Behavior) window.Behavior = API;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootUI, { once: true }); else bootUI();
console.info('[behavior] behavior-bearing assemblies v' + VERSION);
})();
