import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const memory = new Map();
globalThis.window = globalThis;
globalThis.location = { search: '?world=odyssey', pathname: '/odyssey-production/native/word-to-world.html' };
globalThis.localStorage = {
  getItem(key) { return memory.has(key) ? memory.get(key) : null; },
  setItem(key, value) { memory.set(key, String(value)); },
  removeItem(key) { memory.delete(key); }
};
globalThis.document = {
  readyState: 'loading',
  addEventListener() {},
  getElementById() { return null; }
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
};
globalThis.dispatchEvent = () => true;
globalThis.__world = {
  world: 'odyssey',
  place: { lat: 38.367, lon: 20.719, name: 'Ithaca candidate' }
};

await import(pathToFileURL(resolve('odyssey-production/native/world/behavior.js')).href + '?test=1');

assert.equal(typeof WorldBehavior, 'object');
assert.equal(WorldBehavior.selfTest(), true, 'name-based door inference should work');

const target = {
  kind: 'prop',
  id: 'test-target-1',
  name: 'plain practice block',
  item: { id: 'test-target-1', x: 0, y: 0, z: 0, yaw: 0, src: { kind: 'model' } }
};

assert.deepEqual(WorldBehavior.verbsFor(target), ['inspect']);

const taught = WorldBehavior.teachFromText(target, 'make that a target');
assert.equal(taught.ok, true);
assert.equal(WorldBehavior.profile(target).traits.damageable.maxHp, 100);
assert.equal(WorldBehavior.profile(target).state.hp, 100);

const firstHit = WorldBehavior.perform('hit', target, { damage: 35, kind: 'test' });
assert.equal(firstHit.ok, true);
assert.equal(firstHit.hp, 65);

const secondHit = WorldBehavior.perform('hit', target, { damage: 65, kind: 'test' });
assert.equal(secondHit.ok, true);
assert.equal(secondHit.hp, 0);
assert.match(secondHit.message, /down|broke apart/);

const persisted = WorldBehavior.exportData();
assert.equal(persisted.records['test-target-1'].state.hp, 0);
assert.ok(persisted.events.some(event => event.type === 'trait-taught'));
assert.ok(persisted.events.some(event => event.type === 'damaged'));

WorldBehavior.refresh();
assert.equal(WorldBehavior.profile(target).state.hp, 0, 'state should survive a store reload');

const switchTarget = {
  kind: 'prop',
  id: 'test-switch-1',
  name: 'bronze switch',
  item: { id: 'test-switch-1', src: { kind: 'switch' } }
};
assert.ok(WorldBehavior.verbsFor(switchTarget).includes('activate'));
assert.equal(WorldBehavior.perform('activate', switchTarget).active, true);
assert.equal(WorldBehavior.perform('activate', switchTarget).active, false);

console.log('behavior-bearing assemblies runtime: ok');
