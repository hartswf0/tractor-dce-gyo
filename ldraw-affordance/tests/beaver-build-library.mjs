import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSolver} from '../beaver/solver.js';
import {BUILDS} from '../beaver/builds-runtime.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(path.join(here,'..',name),'utf8'));
const library=read('library/core.json');
const rules=read('library/compatibility.json');
const overrides=read('library/seam-overrides.json');

function latchStudMilestones(solver){
  for(const s of solver.hear().states){
    if(s.solved&&s.feature.prerequisite.type==='stud'&&s.feature.completion.kind==='port')solver.state.completed.add(s.feature.id);
  }
}
function runBuild(solver,max=400){
  let moves=0,result=null,guard=0;
  latchStudMilestones(solver);
  while(moves<max&&guard++<max*8){
    result=solver.step();
    if(result.status==='retry')continue;
    latchStudMilestones(solver);
    if(result.status!=='acted')break;
    moves++;
  }
  const h=solver.hear();
  return{moves,result,quiet:!h.strongest,remaining:h.unresolved.map(x=>x.feature.id)};
}

const results=[];
for(const build of BUILDS){
  for(const [mode,expect] of Object.entries(build.expect||{full:'quiet'})){
    const solver=createSolver({library,rules,overrides,field:build,vocabMode:mode});
    const out=runBuild(solver,build.maxMoves||400),audit=solver.audit();
    const actual=out.quiet?'quiet':'blocked';
    results.push({build:build.id,tier:build.tier||'probe',mode,expect,actual,moves:out.moves,parts:solver.state.assembly.length,clicks:solver.state.stats.clicks,remaining:out.remaining});
    if(!audit.ok)throw new Error(`${build.id}/${mode}: accumulated joint audit failed`);
    if(actual!==expect)throw new Error(`${build.id}/${mode}: expected ${expect}, got ${actual}; remaining=${out.remaining.join(',')}`);
  }
}

const full=results.filter(r=>r.mode==='full');
const floors={
  'serious-courtyard-house':{moves:80,clicks:500,parts:100},
  'serious-frame-tower':{moves:50,clicks:400,parts:60},
  'serious-stepped-dam':{moves:50,clicks:350,parts:60}
};
for(const [id,min] of Object.entries(floors)){
  const r=full.find(x=>x.build===id);if(!r)throw new Error(`${id}: serious build missing`);
  for(const k of ['moves','clicks','parts'])if(r[k]<min[k])throw new Error(`${id}: serious regression ${k} ${r[k]} < ${min[k]}`);
}

console.log('BEAVER / BASE BUILD LIBRARY');
console.log(`PASS · ${BUILDS.length} builds · ${results.length} build×vocabulary trials`);
for(const r of full)console.log(`${r.actual==='quiet'?'QUIET':'BLOCKED'} · ${r.build} · ${r.moves} moves · ${r.clicks} clicks · ${r.parts} total parts${r.remaining.length?` · hears ${r.remaining.join(',')}`:''}`);
const serious=full.filter(r=>r.tier==='serious');
if(serious.length)console.log(`SERIOUS TIER · ${serious.map(r=>`${r.build}:${r.moves} moves/${r.clicks} clicks/${r.parts} parts`).join(' · ')}`);
