// Acceptance tests for assembly identity, whole-object operations, program behaviors,
// event links, combat deduplication, persistence, and room snapshots.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve as pathResolve } from 'node:path';

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { const n = this.length() || 1; this.x /= n; this.y /= n; this.z /= n; return this; }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  setLength(n) { return this.normalize().multiplyScalar(n); }
  multiplyScalar(n) { this.x *= n; this.y *= n; this.z *= n; return this; }
  toArray() { return [this.x, this.y, this.z]; }
}
class Box3 {
  constructor(min = new Vector3(Infinity, Infinity, Infinity), max = new Vector3(-Infinity, -Infinity, -Infinity)) { this.min = min; this.max = max; }
  union(b) { this.min.x = Math.min(this.min.x, b.min.x); this.min.y = Math.min(this.min.y, b.min.y); this.min.z = Math.min(this.min.z, b.min.z); this.max.x = Math.max(this.max.x, b.max.x); this.max.y = Math.max(this.max.y, b.max.y); this.max.z = Math.max(this.max.z, b.max.z); return this; }
  getCenter(out = new Vector3()) { return out.set((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, (this.min.z + this.max.z) / 2); }
}
globalThis.THREE = { Vector3, Box3 };

globalThis.window = globalThis;
globalThis.location = { search: '?world=odyssey', pathname: '/odyssey-production/native/word-to-world.html' };
const memory = new Map();
globalThis.localStorage = {
  getItem(k) { return memory.has(k) ? memory.get(k) : null; },
  setItem(k, v) { memory.set(k, String(v)); },
  removeItem(k) { memory.delete(k); }
};
globalThis.document = {
  readyState: 'loading',
  addEventListener() {},
  querySelector() { return null; },
  getElementById() { return null; },
  createElement() { return { click() {}, style: {}, appendChild() {}, querySelector() { return null; } }; }
};
globalThis.CustomEvent = class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };
globalThis.dispatchEvent = () => true;
globalThis.URLSearchParams = URLSearchParams;

globalThis.Dsl = {
  captionOp(op) { return op.name || op.op || 'operation'; }
};
globalThis.Ai = { system() { return 'base system'; } };
globalThis.WorldBehavior = {
  profile(target) { return { id: target.id, label: target.name || 'thing', traits: { inspectable: {} }, state: {}, explicit: false }; },
  verbsFor() { return ['inspect']; },
  describe(target) { return target.name || 'thing'; },
  describeShort() { return 'inspectable'; },
  perform() { return { ok: false, message: 'base' }; },
  applyDamage() { return { ok: false }; }
};

let next = 100;
function boxFor(p) { return new Box3(new Vector3(p.x - 10, p.y, p.z - 10), new Vector3(p.x + 10, p.y + 24, p.z + 10)); }
const edits = [];
const Build = {
  pieces: new Map(), kinds: new Map([['3001', { name: 'brick 2×4' }]]), dirty: false,
  add(p) { if (this.pieces.has(p.id)) return null; p.box = boxFor(p); this.pieces.set(p.id, p); return p; },
  take(id) { const p = this.pieces.get(id); this.pieces.delete(id); return p || null; },
  toRow(p) { return [p.id, p.part, p.col, p.x, p.y, p.z, p.rot, p.op]; },
  addRows(rows) { const out = []; for (const r of rows) { const p = { id: `copy-${++next}`, part: r[1], col: r[2], x: r[3], y: r[4], z: r[5], rot: r[6], op: r[7] }; this.add(p); out.push(p); } return out; },
  nearPoint() { return this.pieces.values(); },
  onEdit(op) { edits.push(op); }
};
const Props = {
  items: new Map(),
  near() { return this.items.values(); },
  moveTo(item, x, y, z, yaw) { item.x = x; item.y = y; item.z = z; item.yaw = yaw; item.box = boxFor(item); return item; },
  async place(mpd, x, y, z, yaw, quiet, src) { const item = { id: `prop-${++next}`, mpd, x, y, z, yaw, src: { ...(src || {}) } }; item.box = boxFor(item); this.items.set(item.id, item); return item; },
  remove(id) { return this.items.delete(id); }
};
globalThis.__world = {
  world: 'odyssey', place: { lat: 38.367, lon: 20.719, name: 'Ithaca candidate' },
  build: Build, props: Props, room: { role: '', send() {} }
};

await import(pathToFileURL(pathResolve('odyssey-production/native/world/assemblies.js')).href + '?test=2');
assert.equal(WorldAssemblies.selfTest(), true);
assert.equal(WorldAssemblies.rideForProgram({ behavior: { rideable: { kind: 'fly' } } }), 'fly');
assert.equal(WorldAssemblies.rideForProgram({ behavior: { rideable: { kind: 'boat' } } }), 'drive');

const piece = (id, x, z, op) => Build.add({ id, part: '3001', col: 71, x, y: 0, z, rot: 0, op });
const switchPiece = piece('switch-piece', 0, 0, 0);
const gateA = piece('gate-a', 40, 0, 1);
const gateB = piece('gate-b', 60, 0, 1);
const targetA = piece('target-a', 0, 70, 2);
const targetB = piece('target-b', 20, 70, 2);

const program = {
  name: 'linked courtyard',
  ops: [
    { op: 'group', name: 'lever', behavior: { activatable: true }, ops: [] },
    { op: 'group', name: 'gate', behavior: { openable: { hinge: 'west', steps: 1 } }, ops: [] },
    { op: 'group', name: 'practice wall', behavior: { breakable: { maxHp: 100, damage: 35 } }, ops: [] }
  ],
  links: [{ from: 'lever', event: 'activated', to: 'gate', action: 'open' }]
};
const registration = WorldAssemblies.registerCommit({ program, pieces: [switchPiece, gateA, gateB, targetA, targetB], props: [], words: 'a linked courtyard' });
assert.equal(registration.records.length, 4, 'root plus three operation assemblies');
assert.equal(registration.members, 5);
assert.equal(registration.links, 1);

const lever = WorldAssemblies.resolve({ kind: 'piece', id: switchPiece.id, item: switchPiece, name: 'lever brick' });
const gate = WorldAssemblies.resolve({ kind: 'piece', id: gateA.id, item: gateA, name: 'gate brick' });
const wall = WorldAssemblies.resolve({ kind: 'piece', id: targetA.id, item: targetA, name: 'wall brick' });
assert.equal(lever.kind, 'assembly');
assert.match(WorldAssemblies.describe(gate), /gate/);
assert.ok(WorldAssemblies.verbsFor(gate).includes('open'));

const beforeGate = [gateA.x, gateA.z, gateB.x, gateB.z];
const switched = WorldAssemblies.perform('activate', lever, {});
assert.equal(switched.ok, true);
assert.equal(WorldAssemblies.profile(gate).state.open, true, 'link should open the gate');
assert.notDeepEqual([gateA.x, gateA.z, gateB.x, gateB.z], beforeGate, 'opening moves the whole gate assembly');
assert.equal(WorldAssemblies.perform('close', gate, {}).ok, true);
assert.deepEqual([gateA.x, gateA.z, gateB.x, gateB.z], beforeGate, 'closing restores exact member transforms');

const hp0 = WorldAssemblies.profile(wall).state.hp;
const hitCount = WorldAssemblies.attackCone({ world: globalThis.__world, origin: new Vector3(10, 0, 0), facing: new Vector3(0, 0, 1), range: 120, vertical: 100, dotMin: 0.3, damage: 35 });
assert.equal(hitCount, 1, 'two struck members of one assembly must count as one semantic hit');
assert.equal(WorldAssemblies.profile(wall).state.hp, hp0 - 35);

const oldGateCenter = WorldAssemblies.box(gate).getCenter(new Vector3());
const moved = WorldAssemblies.manipulate('move', gate, { destination: new Vector3(200, 0, 200) });
assert.equal(moved.ok, true);
const newGateCenter = WorldAssemblies.box(gate).getCenter(new Vector3());
assert.equal(Math.round(newGateCenter.x), 200);
assert.equal(Math.round(newGateCenter.z), 200);
assert.notEqual(Math.round(oldGateCenter.x), Math.round(newGateCenter.x));

const decorated = { name: 'read back', ops: [] };
WorldAssemblies.decorateProgram(decorated, [targetA.id, targetB.id], []);
assert.equal(decorated.behavior.damageable.destroyOnZero, true, 'read/decompile should preserve behavior theory');

const snap = WorldAssemblies.snapshot();
assert.ok(Object.keys(snap.assemblies).length >= 4);
assert.equal(Object.keys(snap.links).length, 1);
WorldAssemblies.clearPlace(true);
assert.equal(WorldAssemblies.integrity().assemblies, 0);
assert.equal(WorldAssemblies.applySnapshot(snap, true), true);
assert.ok(WorldAssemblies.integrity().assemblies >= 4);

const arm = WorldAssemblies.armLink(lever, 'when that activates');
assert.equal(arm.ok, true);
const manualLink = WorldAssemblies.completeLink(wall, 'remove', 'remove that when triggered once');
assert.equal(manualLink.ok, true);
assert.equal(WorldAssemblies.perform('activate', lever, {}).ok, true); // toggles off, no activated event
assert.equal(Build.pieces.has(targetA.id), true);
assert.equal(WorldAssemblies.perform('activate', lever, {}).ok, true); // toggles on, fires
assert.equal(Build.pieces.has(targetA.id), false, 'manual event link should remove the entire target assembly');
assert.equal(Build.pieces.has(targetB.id), false);

const check = WorldAssemblies.reconcile();
assert.equal(check.ok, true);
assert.ok(edits.length > 0, 'whole-assembly transforms should use the real Build edit path');
console.log('behavior-bearing assemblies v2 runtime: ok');
