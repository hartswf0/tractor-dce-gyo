import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {flattenLDraw,summarizeTarget} from '../beaver-hogwarts/target-import.js';
import {createShadowCompiler,buildStudContactGraph} from '../beaver-hogwarts/shadow-connectors.js';
import {createTargetBeaver} from '../beaver-hogwarts/target-beaver.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const affordanceRoot=path.resolve(here,'..');
const repoRoot=path.resolve(affordanceRoot,'..');
const ldrawRoot=path.join(repoRoot,'ldraw');
const targetPath=path.resolve(process.argv[2]||'target/71043.ldr');
const shadowRoot=path.resolve(process.argv[3]||'target/LDCadShadowLibrary');
const outPath=path.resolve(process.argv[4]||'target/hogwarts-report.json');
const sourceMetaPath=process.argv[5]?path.resolve(process.argv[5]):null;

const readMaybe=p=>{try{return fs.readFileSync(p,'utf8')}catch{return null}};
const norm=s=>String(s||'').replace(/\\/g,'/').replace(/^\.\//,'');
function diskLoad(root,p){
  const n=norm(p),candidates=[n,n.toLowerCase()];
  for(const c of candidates){const f=path.join(root,...c.split('/'));try{return fs.readFileSync(f,'utf8')}catch{}}
  return null;
}
function realPartExists(partId){
  const id=String(partId).replace(/\.dat$/i,'');
  return diskLoad(ldrawRoot,`parts/${id}.dat`)!=null;
}
function componentSets(placements,edges){
  const adj=new Map(placements.map(p=>[p.uid,[]]));
  for(const e of edges){adj.get(e.a)?.push(e.b);adj.get(e.b)?.push(e.a)}
  const left=new Set(placements.map(p=>p.uid)),out=[];
  while(left.size){
    const seed=left.values().next().value,q=[seed],seen=new Set([seed]);left.delete(seed);
    while(q.length){const u=q.shift();for(const v of adj.get(u)||[])if(left.has(v)){left.delete(v);seen.add(v);q.push(v)}}
    out.push(seen);
  }
  return out.sort((a,b)=>b.size-a.size);
}
function inducedGraph(ids,graph){
  const set=ids instanceof Set?ids:new Set(ids);
  return{...graph,nodes:(graph.nodes||[]).filter(n=>set.has(n.uid)),edges:(graph.edges||[]).filter(e=>set.has(e.a)&&set.has(e.b))};
}
function countReasons(rows){
  const m=new Map();for(const r of rows)for(const x of r.unsupported||[])m.set(x.split(':')[0],(m.get(x.split(':')[0])||0)+1);
  return Object.fromEntries([...m].sort((a,b)=>b[1]-a[1]));
}

if(!fs.existsSync(targetPath))throw new Error(`Target missing: ${targetPath}`);
if(!fs.existsSync(shadowRoot))throw new Error(`Shadow library missing: ${shadowRoot}`);
const text=fs.readFileSync(targetPath,'utf8');
const target=flattenLDraw(text,{name:path.basename(targetPath)});
const summary=summarizeTarget(target);
const sourceMeta=sourceMetaPath&&fs.existsSync(sourceMetaPath)?JSON.parse(fs.readFileSync(sourceMetaPath,'utf8')):null;
console.log(`HOGWARTS TARGET · ${summary.placements} instances · ${summary.uniqueParts} unique part IDs`);

const compiler=createShadowCompiler({
  loadReal:async p=>diskLoad(ldrawRoot,p),
  loadShadow:async p=>diskLoad(shadowRoot,p)
});
const compiledByPart=new Map(),compiledRows=[];
let i=0;
for(const row of summary.parts){
  i++;
  const real=realPartExists(row.partId),compiled=real?await compiler.compilePart(row.partId):{ports:[],clickable:[],unsupported:[`MISSING_LDRAW:parts/${row.partId}.dat`]};
  compiledByPart.set(row.partId,compiled);
  compiledRows.push({partId:row.partId,instances:row.count,realLDraw:real,ports:compiled.ports?.length||0,clickableStudPorts:compiled.clickable?.filter(p=>p.protocol==='STUD_CLUTCH').length||0,unsupported:compiled.unsupported||[]});
  if(i%50===0||i===summary.uniqueParts)console.log(`SHADOW COMPILE · ${i}/${summary.uniqueParts}`);
}
const typesWithReal=compiledRows.filter(r=>r.realLDraw),typesWithPorts=compiledRows.filter(r=>r.ports>0),typesWithClicks=compiledRows.filter(r=>r.clickableStudPorts>0);
const instancesWithReal=compiledRows.filter(r=>r.realLDraw).reduce((a,r)=>a+r.instances,0);
const instancesWithClickType=compiledRows.filter(r=>r.clickableStudPorts>0).reduce((a,r)=>a+r.instances,0);
console.log(`LDRAW COVERAGE · ${typesWithReal.length}/${summary.uniqueParts} types · ${instancesWithReal}/${summary.placements} instances`);
console.log(`STUD-PROTOCOL COVERAGE · ${typesWithClicks.length}/${summary.uniqueParts} types · ${instancesWithClickType}/${summary.placements} instances`);

console.log('CONTACT GRAPH · matching exact transformed stud/anti-stud seats…');
const graph=buildStudContactGraph(target.placements,compiledByPart,{positionTolerance:.08,normalTolerance:.999});
const strictEdges=graph.edges.filter(e=>e.protocol==='STUD_CLUTCH'&&e.d<=.005&&e.normalDot<=-.999999);
const strictGraph={...graph,edges:strictEdges};
const comps=componentSets(target.placements,strictEdges),largest=comps[0]||new Set();
const largestPlacements=target.placements.filter(p=>largest.has(p.uid)),largestGraph=inducedGraph(largest,strictGraph);
console.log(`STRICT GRAPH · ${strictEdges.length} certified contacts · ${comps.length} components · largest ${largest.size}`);

let largestRun=null;
if(largestPlacements.length){
  const beaver=createTargetBeaver({placements:largestPlacements,graph:largestGraph});
  const run=beaver.run(largestPlacements.length*2+10);
  largestRun={moves:run.moves,built:run.state.built.size,roots:run.state.roots.size,clicks:run.state.clicks,rejected:run.state.rejected,quiet:run.hear.state==='QUIET',auditOk:run.audit.ok};
  console.log(`BEAVER / LARGEST COMPONENT · ${largestRun.built}/${largestPlacements.length} parts · ${largestRun.clicks} CLICK proofs · ${largestRun.roots} root · ${largestRun.quiet?'QUIET':'LOUD'}`);
}

const report={
  schema:'beaver-hogwarts-audit-1',generatedAt:new Date().toISOString(),source:sourceMeta,
  target:{placements:summary.placements,uniquePartIds:summary.uniqueParts,sections:target.sections,calibration:target.calibration},
  ldrawCoverage:{types:typesWithReal.length,totalTypes:summary.uniqueParts,instances:instancesWithReal,totalInstances:summary.placements,missingTypes:compiledRows.filter(r=>!r.realLDraw).map(r=>({partId:r.partId,instances:r.instances}))},
  shadowCoverage:{typesWithAnyPorts:typesWithPorts.length,typesWithClickableStudPorts:typesWithClicks.length,instancesWhoseTypeHasClickableStudPorts:instancesWithClickType,totalPorts:compiledRows.reduce((a,r)=>a+r.ports,0),totalClickableStudPorts:compiledRows.reduce((a,r)=>a+r.clickableStudPorts,0),unsupportedReasonCounts:countReasons(compiledRows)},
  strictStudGraph:{contacts:strictEdges.length,connectedNodes:new Set(strictEdges.flatMap(e=>[e.a,e.b])).size,isolatedNodes:summary.placements-new Set(strictEdges.flatMap(e=>[e.a,e.b])).size,components:comps.length,largestComponent:largest.size,topComponents:comps.slice(0,25).map(c=>c.size)},
  largestComponentBeaver:largestRun,
  caveat:'This certifies only modeled capped stud-clutch contacts inherited from LDCad Shadow metadata. Clips, bars, hinges, Technic insertion, flex, collision, gravity and temporary-support physics remain outside CLICK unless separately modeled.',
  parts:compiledRows
};
fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,JSON.stringify(report,null,2));
console.log(`REPORT ${outPath}`);
console.log(`HOGWARTS SUMMARY JSON ${JSON.stringify({placements:report.target.placements,uniquePartIds:report.target.uniquePartIds,ldrawTypes:`${report.ldrawCoverage.types}/${report.ldrawCoverage.totalTypes}`,shadowClickTypes:`${report.shadowCoverage.typesWithClickableStudPorts}/${report.target.uniquePartIds}`,contacts:report.strictStudGraph.contacts,components:report.strictStudGraph.components,largestComponent:report.strictStudGraph.largestComponent,beaver:report.largestComponentBeaver})}`);
