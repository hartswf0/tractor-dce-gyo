import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {PARTS,CHALLENGES} from '../beaver-world/atlas.js';
import {makeState,run,coverage,benchmark} from '../beaver-world/model.js';

console.log('BEAVER WORLD / ANYTHING BENCH');
assert.ok(PARTS.length>=30,'mixed vocabulary must remain broad');
assert.ok(new Set(PARTS.map(p=>p.class)).size>=20,'must span at least twenty world-chunk classes');
for(const p of PARTS){
  const f=path.resolve('../ldraw/parts',p.file);
  assert.equal(fs.existsSync(f),true,`real LDraw file missing: ${p.file}`);
}
for(const key of Object.keys(CHALLENGES)){
  const state=makeState(key,'all',17);run(state);const c=coverage(state);
  assert.equal(state.quiet,true,`${key} must be solvable with full mixed vocabulary`);
  assert.equal(c.done,c.total,`${key} must extinguish every signal`);
  assert.ok(state.used.length>=3,`${key} should require a composition, not one magic object`);
}
const noBridge=makeState('bridge_works','no_bridges',17);run(noBridge);
assert.equal(noBridge.blocked,true,'removing bridge vocabulary must expose a missing capability');
assert.ok(coverage(noBridge).remaining.some(x=>x.label==='SPAN GAP'),'SPAN GAP must remain audible without bridge chunks');
const random=makeState('flood_depot','random18',17);run(random);assert.ok(random.used.length>0,'random vocabulary must still attempt useful work');
const rows=benchmark();
console.log(JSON.stringify({parts:PARTS.length,classes:new Set(PARTS.map(p=>p.class)).size,bench:rows},null,2));
