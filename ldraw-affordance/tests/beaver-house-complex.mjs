import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {makePlan,simulate,signalLoad,DESIGN} from '../beaver-house-complex/model.js';

console.log('BEAVER / COMPLEX HOUSE');
const plan=makePlan();
assert.ok(plan.length>120,`expected >120 independent build actions, got ${plan.length}`);
const structural=plan.filter(a=>a.kind==='structure');
assert.ok(structural.length>100,'most actions must be physical structural placements');
assert.ok(plan.some(a=>a.file==='3035.dat'),'real 4x8 roof/floor plates required');
assert.ok(plan.some(a=>a.file==='60593.dat'),'real window frames required');
assert.ok(plan.some(a=>a.file==='60596.dat'),'real door frame required');
assert.ok(plan.some(a=>a.file==='3008.dat'),'long 1x8 lintel/wall bricks required');

const sim=simulate(plan,1000);
if(sim.remaining.length){
  console.error('BLOCKED ACTIONS');
  for(const a of sim.remaining.slice(0,30))console.error(a.id,a.signal,a.label,a.file,a.t);
}
assert.equal(sim.remaining.length,0,'whole design must be reachable through live supports');
assert.equal(sim.water,0,'water signal must reach zero');
assert.equal(signalLoad(sim.state,'GRAVITY'),0,'gravity/support signal must reach zero');
assert.equal(signalLoad(sim.state,'GUARD'),0,'terrace guard signal must reach zero');
assert.equal(signalLoad(sim.state,'RAIN_ENTRY'),0,'porch rain signal must reach zero');
assert.equal(signalLoad(sim.state,'VENT'),0,'chimney/vent signal must reach zero');
assert.ok(sim.clicks>400,`expected hundreds of independently verified clutch contacts, got ${sim.clicks}`);

const used=[...new Set(plan.map(a=>a.file).concat('3811.dat'))];
for(const file of used){const p=path.resolve('../ldraw/parts',file);assert.equal(fs.existsSync(p),true,`real LDraw part missing: ${file}`)}

const labels=new Set(sim.state.placements.map(a=>a.label));
assert.ok([...labels].some(x=>x.includes('BEARING SPINE')),'bearing spine must actually build');
assert.ok([...labels].some(x=>x.includes('PORCH COLUMN')),'porch columns must actually build');
assert.ok([...labels].some(x=>x.includes('TERRACE PARAPET')),'roof terrace guard must actually build');
assert.ok([...labels].some(x=>x.includes('CHIMNEY')),'chimney must actually build');

console.log(`PASS · ${DESIGN.name}`);
console.log(`PASS · ${plan.length} actions · ${structural.length} structural placements · ${sim.clicks} verified stud contacts`);
console.log(`PASS · water ${sim.water} · all support/guard/entry/vent signals quiet`);
console.log(`PASS · ${used.length} distinct real LDraw part files`);
