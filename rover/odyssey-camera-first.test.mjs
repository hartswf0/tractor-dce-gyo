import assert from 'node:assert/strict';
import {
  OPERATOR_ORDER,
  createRoverSession,
  operate,
  nextOperator,
} from './odyssey-camera-first.js';

assert.deepEqual(OPERATOR_ORDER, [
  'REFERENCE','CAMERA','FRAME','REQUIRE','FORAGE','RESOLVE','ASSEMBLE',
  'STAGE','BIND','PERFORM','WATCH','REPAIR','COMMIT'
]);

const s = createRoverSession({ sceneId: 'OD-B01-S03' });

operate(s, 'REFERENCE', {
  references: [
    { id: 'scene', role: 'COMPOSITION' },
    { id: 'jobs', role: 'FUNCTION' },
  ]
});

operate(s, 'CAMERA', {
  id: 'reference-full-stage',
  framingIntent: 'Athena at threshold; Telemachus crossing from hall'
});

operate(s, 'FRAME', {
  subjects: ['character.athena-as-mentes', 'character.telemachus'],
  visible: ['location.odysseuss-palace-threshold-and-hall'],
  background: ['ensemble.the-suitors'],
});

operate(s, 'REQUIRE', {
  performance: [
    {
      actor: 'character.telemachus',
      target: 'character.athena-as-mentes',
      prop: 'prop.athenas-bronze-spear',
      traverses: ['palace.hall-path'],
      supports: ['palace.spear-rack']
    }
  ]
});

assert.equal(nextOperator(s), 'FORAGE');
assert.ok(s.requirements.some(r => r.id === 'prop.athenas-bronze-spear'));
assert.ok(s.requirements.some(r => r.id === 'palace.hall-path'));
assert.ok(s.requirements.some(r => r.id === 'palace.spear-rack'));

let blocked = false;
try {
  const bad = createRoverSession({ sceneId: 'BAD' });
  operate(bad, 'ASSEMBLE', {});
} catch {
  blocked = true;
}
assert.equal(blocked, true, 'ASSEMBLE must not bypass camera-first prerequisites');

console.log('ROVER camera-first smoke test passed');
