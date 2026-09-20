// Boundary tests for the two failure cases most likely to corrupt a live build:
// a partially blocked multi-piece move and a "whole build" command issued while a
// named subassembly is bound.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve as pathResolve } from 'node:path';

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { const n = this.length() || 1; this.x /= n; this.y /= n; this.z /= n; return this; }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
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
globalThis.localStorage = { getItem: k => memory.get(k) || null, setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k) };
globalThis.document = { readyState: 'loading', addEventListener() {}, querySelector() { return null; }, getElementById() { return null; } };
globalThis.CustomEvent = class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };
globalThis.dispatchEvent = () => true;
globalThis.Dsl = { captionOp: op => op.name || op.op || 'operation' };
globalThis.Ai = { system: () => 'base' };
globalThis.WorldBehavior = { profile: () => ({ traits: {}, state: {} }), verbsFor: () => ['inspect'], describe: () => 'thing', describeShort: () => 'inspectable', perform: () => ({ ok: false }), applyDamage: () => ({ ok: false }) };

let rejectX = null;
const boxFor = p => new Box3(new Vector3(p.x - 10, p.y, p.z - 10), new Vector3(p.x + 10, p.y + 24, p.z + 10));
const Build = {
  pieces: new Map(), kinds: new Map([['3001', { name: 'brick' }]]), dirty: false,
  add(p) { if (rejectX != null && p.x === rejectX) return null; if (this.pieces.has(p.id)) return null; p.box = boxFor(p); this.pieces.set(p.id, p); return p; },
  take(id) { const p = this.pieces.get(id); this.pieces.delete(id); return p || null; },
  toRow(p) { return [p.id, p.part, p.col, p.x, p.y, p.z, p.rot, p.op]; },
  addRows() { return []; }, nearPoint() { return this.pieces.values(); }, onEdit() {}
};
const Props = { items: new Map(), near() { return this.items.values(); }, moveTo() { return true; }, remove() { return false; } };
globalThis.__world = { world: 'odyssey', place: { lat: 38.367, lon: 20.719 }, build: Build, props: Props, room: { role: '', send() {} } };

await import(pathToFileURL(pathResolve('odyssey-production/native/world/assemblies.js')).href + '?boundaries=1');

const make = (id, x, op) => { const p = { id, part: '3001', col: 71, x, y: 0, z: 0, rot: 0, op }; Build.add(p); return p; };
const leftA = make('left-a', 0, 0);
const leftB = make('left-b', 20, 0);
const right = make('right-a', 80, 1);
WorldAssemblies.registerCommit({
  program: { name: 'two wings', ops: [{ op: 'group', name: 'left wing', ops: [] }, { op: 'group', name: 'right wing', ops: [] }] },
  pieces: [leftA, leftB, right], props: []
});

const left = WorldAssemblies.resolve({ kind: 'piece', id: leftA.id, item: leftA, name: 'left brick' });
assert.equal(left.scope, undefined, 'public target remains an assembly referent rather than exposing record internals');

// A blocked second member must restore every member to the exact original transform.
rejectX = 110; // left assembly center is 10; destination x=100 asks for 90 and 110.
const blocked = WorldAssemblies.manipulate('move', left, { destination: new Vector3(100, 0, 0), text: 'move that there' });
assert.equal(blocked.ok, false);
assert.deepEqual([leftA.x, leftB.x], [0, 20]);
assert.equal(Build.pieces.has(leftA.id), true);
assert.equal(Build.pieces.has(leftB.id), true);
rejectX = null;

// "Whole build" changes the root identity, even though the left subassembly is bound.
const taught = WorldAssemblies.teachFromText(left, 'make the whole build a target with 140 hp');
assert.equal(taught.ok, true);
const root = WorldAssemblies.resolve(left, { whole: true });
assert.equal(WorldAssemblies.profile(root).state.maxHp, 140);
const moved = WorldAssemblies.manipulate('move', left, { destination: new Vector3(200, 0, 200), text: 'move the whole build there' });
assert.equal(moved.ok, true);
assert.equal(Math.round(WorldAssemblies.box(root).getCenter(new Vector3()).x), 200);
assert.equal(Math.round(WorldAssemblies.box(root).getCenter(new Vector3()).z), 200);
assert.notEqual(right.x, 80, 'the other named subassembly moved with the root');

console.log('behavior-bearing assemblies v2 boundaries: ok');
