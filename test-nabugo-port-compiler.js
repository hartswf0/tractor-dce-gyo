#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

global.fetch = async url => {
  const file = path.resolve(__dirname, String(url).replace(/^\.\//, ''));
  return { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) };
};

require('./nabugo.js');

(async () => {
  await global.Nabugo.Catalog.load('./nabugo-parts.json');
  require('./nabugo-evo.js');
  await global.NabugoEvo.Ports.load('./nabugo-ports.json');

  const { Genome, Compiler, Ports, Viability } = global.NabugoEvo;
  const brief = global.Nabugo.Brief.BRIEFS.atlantis;

  // A normal brick must be positioned by its underside tube plane, not by the
  // tube primitive's internal y=4 origin.
  const stack = new Genome('strict stack', []);
  stack.add({ id: 'base', role: 'foundation', part: '3001', attach: null });
  stack.add({ id: 'upper', role: 'vertical_support', part: '3001',
              attach: { target: 'base', port: 'top' } });
  const built = Compiler.compile(stack, { x: 0, z: 0 }, { rng: () => 0.5 });
  assert.equal(built.failures.length, 0);
  assert.equal(built.scene.count, 2);
  assert.equal(built.scene.places[0].pos[1], -24);
  assert.equal(built.scene.places[1].pos[1], -48);
  assert.equal(built.scene.places[1].connection.kind, 'stud-tube');
  assert.ok(built.scene.places[1].connection.engaged >= 1);
  assert.equal(Viability.check(built.scene, brief).gates.legalJoints, true);

  // A smooth tile exposes no invented upward studs. It can receive from below,
  // but it cannot act as a fictional parent surface for the next part.
  assert.equal(Ports.studs('3068b').length, 0);

  // The seaweed's extracted ports are lateral; the compiler must refuse to
  // stand it on a stud as though its bounding box were an underside socket.
  const invalid = new Genome('refuse fake plant joint', []);
  invalid.add({ id: 'base', role: 'foundation', part: '3001', attach: null });
  invalid.add({ id: 'plant', role: 'ornament', part: '49577',
                attach: { target: 'base', port: 'top' } });
  const refused = Compiler.compile(invalid, { x: 0, z: 0 }, { rng: () => 0.5 });
  assert.equal(refused.scene.count, 1);
  assert.match(refused.failures[0].reason, /no compatible parent stud and child underside tube/);

  // Mere contact without a recorded joint is never a legal assembly.
  const counterfeit = built.scene.clone();
  counterfeit.places[1].connection = null;
  assert.equal(Viability.check(counterfeit, brief).gates.legalJoints, false);

  console.log('strict port compiler: 4 checks passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
