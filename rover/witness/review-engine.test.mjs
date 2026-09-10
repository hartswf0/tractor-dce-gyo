import assert from 'node:assert/strict';
import { watch, repairPlan, commitTake } from './review-engine.mjs';

const assertions = [
  { id:'hospitality', kind:'READS_AS', subject:'telemachus', expected:true, repairScope:'BODY_ARMS', reason:'offering gesture must read as hospitality' },
  { id:'athena-visible', kind:'VISIBLE', subject:'athena_mentes', expected:true, repairScope:'CAMERA' },
];

const bad = watch({
  scene:'OD-B01-S03', frameId:'F01', cameraId:'CAM-A', assertions,
  observations:[
    { assertionId:'hospitality', value:false, evidence:'arm silhouette reads as pointing' },
    { assertionId:'athena-visible', value:true },
  ]
});
assert.equal(bad.passed, false);
const repairs = repairPlan(bad);
assert.equal(repairs.repairs.length, 1);
assert.equal(repairs.repairs[0].scope, 'BODY_ARMS');
assert.ok(repairs.repairs[0].preserve.includes('athena-visible'));
assert.throws(() => commitTake({ watch:bad, takeId:'take-01' }), /cannot COMMIT/);

const good = watch({
  scene:'OD-B01-S03', frameId:'F01', cameraId:'CAM-A', assertions,
  observations:[
    { assertionId:'hospitality', value:true },
    { assertionId:'athena-visible', value:true },
  ]
});
const committed = commitTake({ watch:good, takeId:'take-02' });
assert.equal(committed.status, 'COMMITTED');
console.log('ROVER review-engine: ok');
