// Source-level contracts for the live page integration. Runtime mechanics are covered
// by test-assembly-runtime-v2.mjs; this file ensures the actual page does not drop the
// theory while crossing builder, pointing, room, and cache boundaries.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const html = read('odyssey-production/native/word-to-world.html');
const main = read('odyssey-production/native/world/main.js');
const ptt = read('odyssey-production/native/world/put-that-there.js');
const assemblies = read('odyssey-production/native/world/assemblies.js');

const iBehavior = html.indexOf('./world/behavior.js?v=1');
const iAssemblies = html.indexOf('./world/assemblies.js?v=2');
const iPtt = html.indexOf('./world/put-that-there.js?v=6');
assert.ok(iBehavior >= 0 && iAssemblies > iBehavior && iPtt > iAssemblies, 'base behavior, assembly bridge, and Point + Speak must load in dependency order');
assert.match(html, /main\.js\?v=playable-12/, 'main integration cache version must advance');

assert.match(main, /WorldAssemblies\.registerCommit/, 'committing generated matter must create assembly identity');
assert.match(main, /WorldAssemblies\.decorateProgram/, 'reading matter must restore behavior metadata');
assert.match(main, /program:\s*\{\s*\.\.\.program/, 'the active read program must retain behavior and links');
assert.match(main, /WorldAssemblies\.reconcile\(\)/, 'replacement commits must remove stale assembly records');
assert.match(main, /assemblies:\s*window\.WorldAssemblies\s*\?\s*WorldAssemblies\.snapshot\(\)/, 'room snapshots must include assembly theory');
assert.match(main, /case 'assembly'/, 'room operations must accept assembly updates');
assert.match(main, /WorldAssemblies\.clearPlace\(true\)/, 'remote place reset must clear assembly identity');

assert.match(ptt, /WorldAssemblies\.resolve\(raw\)/, 'a pointed member must bind its assembly');
assert.match(ptt, /resolve\(\{kind:'assembly',id\}\)/, 'model referents may name stable assembly ids');
assert.match(ptt, /WorldAssemblies\.manipulate/, 'move, copy, turn, and remove must route to whole-assembly operations');
assert.match(ptt, /link-open/, 'the local language must expose event links');
assert.match(ptt, /WorldAssemblies\.resolve\(raw\) \|\| raw/, 'hover pronouns must preserve whole-object identity');

assert.match(assemblies, /BEHAVIOR-BEARING ASSEMBLIES/, 'the model must receive the bounded behavior grammar');
assert.match(assemblies, /registerCommit/, 'runtime must accept committed program provenance');
assert.match(assemblies, /hitAssemblies = new Set\(\)/, 'one attack must not damage a multi-piece assembly once per brick');
assert.match(assemblies, /context\?\.visited \|\| new Set\(\)/, 'nested event transitions must share cycle protection');
assert.match(assemblies, /activate\(target, \{ fromLink: true, visited \}\)/, 'event links must propagate cycle state');
assert.match(assemblies, /legacy\.hidden = true/, 'the complete assembly panel must replace the V1 sidecar panel');
assert.doesNotMatch(assemblies, /eval\s*\(|new Function\s*\(/, 'program behaviors must remain declarative');

console.log('behavior-bearing assemblies v2 page integration: ok');
