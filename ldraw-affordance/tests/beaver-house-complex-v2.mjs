import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {makePlan,simulate,signalLoad,weatherMissing,DESIGN} from '../beaver-house-complex-v2/model-fixed.js';
console.log('BEAVER / COURT HOUSE II');
const plan=makePlan(),structural=plan.filter(a=>a.kind==='structure');
assert.ok(plan.length>=560,`goal is at least twice the prior 283 actions; got ${plan.length}`);
assert.ok(structural.length>=520,`goal is at least twice the prior structural complexity; got ${structural.length}`);
const sim=simulate(plan,5000);
if(sim.remaining.length){console.error('BLOCKED');for(const a of sim.remaining.slice(0,50))console.error(a.id,a.signal,a.label,a.file,a.t)}
assert.equal(sim.remaining.length,0,'every programmed part must be reachable from live supports');
assert.ok(sim.clicks>=1800,`expected >1800 verified clutch contacts; got ${sim.clicks}`);
assert.equal(sim.weatherMissing.length,0,`envelope cracks remain: ${sim.weatherMissing.slice(0,16).join(', ')}`);
for(const signal of ['WATER','GRAVITY','STRUCTURE','ACCESS','RAIN_ENTRY','VENT','GUARD'])assert.equal(signalLoad(sim.state,signal),0,`${signal} must reach quiet`);
const files=[...new Set(plan.map(a=>a.file).concat('3811.dat'))];for(const f of files)assert.equal(fs.existsSync(path.resolve('../ldraw/parts',f)),true,`missing real LDraw part ${f}`);
const leaf=plan.find(a=>a.id==='front-door-leaf'),frame=plan.find(a=>a.id==='front-door-frame'),inner=plan.find(a=>a.id==='front-door-inner-frame');assert.ok(leaf&&frame&&inner,'outer frame, inner reveal frame and leaf required');assert.equal(leaf.t[1],frame.t[1],'door leaf Y origin must align with frame');assert.equal(leaf.t[2]-frame.t[2],5,'door leaf must use calibrated +5 LDU frame offset');assert.equal(inner.t[2]-frame.t[2],20,'two-stud wall must have a one-stud-deep inner door reveal');
for(const id of ['door-lintel-outer','door-lintel-inner','rear-passage-19','rear-passage-20'])assert.ok(sim.state.placedIds.has(id),`${id} must build`);
assert.equal(weatherMissing(sim.state).length,0,'final independent envelope audit must also be dry');
console.log(`PASS · ${DESIGN.name}`);console.log(`PASS · ${plan.length} actions · ${structural.length} structural · ${sim.clicks} verified stud contacts`);console.log(`PASS · weather cracks ${sim.weatherMissing.length} · ${files.length} distinct real LDraw files`);
