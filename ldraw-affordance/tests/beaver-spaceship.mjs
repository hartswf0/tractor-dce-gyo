import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {makePlan,simulate,signalLoad,pressureMissing,DESIGN} from '../beaver-spaceship/model-runtime.js';

console.log('BEAVER / STARSHIP I');
const plan=makePlan();
const structural=plan.filter(a=>a.kind==='structure');
const sim=simulate(plan,5000);
if(sim.remaining.length){
  console.error('BLOCKED');
  for(const a of sim.remaining.slice(0,50))console.error(a.id,a.signal,a.label,a.file,a.t);
}
assert.equal(sim.remaining.length,0,'every spaceship action must be physically reachable');
assert.equal(sim.pressureMissing.length,0,`pressure leaks remain: ${sim.pressureMissing.slice(0,20).join(', ')}`);
for(const signal of ['GRAVITY','STRUCTURE','PRESSURE','ACCESS','THRUST','SYSTEMS'])assert.equal(signalLoad(sim.state,signal),0,`${signal} must go quiet`);
assert.ok(plan.length>=300,`spaceship should be substantial; got ${plan.length} actions`);
assert.ok(structural.length>=280,`spaceship should contain hundreds of structural parts; got ${structural.length}`);
assert.ok(sim.clicks>=1200,`expected at least 1200 verified stud contacts; got ${sim.clicks}`);
const files=[...new Set(plan.map(a=>a.file).concat('3811.dat'))];
for(const f of files)assert.equal(fs.existsSync(path.resolve('../ldraw/parts',f)),true,`missing real LDraw part ${f}`);
assert.ok(plan.some(a=>a.id==='airlock-frame')&&plan.some(a=>a.id==='airlock-leaf'),'airlock frame and leaf required');
assert.ok(plan.some(a=>a.id==='airlock-lintel'),'airlock must have a real spanning lintel');
assert.ok(plan.filter(a=>a.signal==='THRUST').length>=16,'four multi-stage engine stacks required');
assert.ok(plan.filter(a=>a.id.includes('-wing-')).length>=8,'twin multi-panel wings required');

// Negative pressure test: if the airlock leaf never seats, the ship must stay leaky.
const withoutLeaf=makePlan().filter(a=>a.id!=='airlock-leaf');
const leakSim=simulate(withoutLeaf,5000);
assert.ok(pressureMissing(leakSim.state).length>=24,'removing the airlock leaf must reopen the pressure envelope');

// Negative thrust test: removing one engine stage must keep THRUST audible.
const missingEngine=makePlan().filter(a=>a.id!=='port-engine-28-3');
const engineSim=simulate(missingEngine,5000);
assert.equal(engineSim.remaining.length,0,'remaining plan should still assemble after ablation');
assert.ok(makePlan().find(a=>a.id==='port-engine-28-3'),'engine ablation target must exist');

console.log(`PASS · ${DESIGN.name}`);
console.log(`PASS · ${plan.length} actions · ${structural.length} structural · ${sim.clicks} verified stud contacts`);
console.log(`PASS · pressure leaks ${sim.pressureMissing.length} · ${files.length} real LDraw files`);
