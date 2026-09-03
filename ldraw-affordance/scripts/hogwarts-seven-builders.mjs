import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as crypto from 'node:crypto';
import {flattenLDraw,summarizeTarget} from '../beaver-hogwarts/target-import.js';
import {createShadowCompiler,buildStudContactGraph} from '../beaver-hogwarts/shadow-connectors.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const affordanceRoot=path.resolve(here,'..');
const repoRoot=path.resolve(affordanceRoot,'..');
const ldrawRoot=path.join(repoRoot,'ldraw');
const targetPath=path.resolve(process.argv[2]||'target/71043.ldr');
const shadowRoot=path.resolve(process.argv[3]||'target/LDCadShadowLibrary');
const outRoot=path.resolve(process.argv[4]||'target/seven-builders');
const sourceMetaPath=process.argv[5]?path.resolve(process.argv[5]):null;

const STRICT_POSITION=.005;
const STRICT_NORMAL=.999999;
const CHECKPOINTS=[1,8,16,32,64,128,256,512,1024,2048,4096,8192];
const norm=s=>String(s||'').replace(/\\/g,'/').replace(/^\.\//,'');
const fmt=n=>Number.isInteger(Number(n))?String(Number(n)):Number(n).toFixed(8).replace(/0+$/,'').replace(/\.$/,'');
const stable=(a,b)=>String(a.uid).localeCompare(String(b.uid));

function diskLoad(root,p){
  const n=norm(p),candidates=[n,n.toLowerCase()];
  for(const c of candidates){
    const f=path.join(root,...c.split('/'));
    try{return fs.readFileSync(f,'utf8')}catch{}
  }
  return null;
}
function realPartExists(partId){
  const id=String(partId).replace(/\.dat$/i,'');
  return diskLoad(ldrawRoot,`parts/${id}.dat`)!=null;
}
function shaMaybe(p){
  if(!p||!fs.existsSync(p))return null;
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}
function edgeKey(e){return `${e.a}|${e.b}|${e.aPort?.portIndex ?? ''}|${e.bPort?.portIndex ?? ''}`}
function proofOk(e){return e.protocol==='STUD_CLUTCH'&&e.d<=STRICT_POSITION&&e.normalDot<=-STRICT_NORMAL}
function other(e,uid){return e.a===uid?e.b:e.a}

function makeAdj(placements,edges){
  const adj=new Map(placements.map(p=>[p.uid,[]]));
  for(const e of edges){adj.get(e.a)?.push(e);adj.get(e.b)?.push(e)}
  return adj;
}
function componentSets(placements,edges,allowed=null){
  const allow=allowed||new Set(placements.map(p=>p.uid));
  const adj=makeAdj(placements,edges);
  const left=new Set([...allow]),out=[];
  while(left.size){
    const seed=left.values().next().value,q=[seed],seen=new Set([seed]);left.delete(seed);
    while(q.length){
      const u=q.shift();
      for(const e of adj.get(u)||[]){
        if(!proofOk(e))continue;
        const v=other(e,u);
        if(left.has(v)){left.delete(v);seen.add(v);q.push(v)}
      }
    }
    out.push(seen);
  }
  return out.sort((a,b)=>b.size-a.size||String([...a][0]).localeCompare(String([...b][0])));
}
function remainingComponentSeed(placements,edges,unbuilt,policy,ctx){
  const comps=componentSets(placements,edges,unbuilt);
  if(!comps.length)return null;
  const c=comps[0];
  const candidates=placements.filter(p=>c.has(p.uid));
  return policy.chooseRoot(candidates,{...ctx,component:c})||candidates.sort(stable)[0];
}
function ldrawText(rows,title){
  const out=[`0 ${title}`,'0 Name: generated-trajectory.ldr','0 !LICENSE Generated experiment artifact; preserve source provenance'];
  for(const p of rows){
    if(!realPartExists(p.partId))continue;
    out.push(`1 ${p.color??16} ${p.t.map(fmt).join(' ')} ${p.r.map(fmt).join(' ')} ${String(p.partId).replace(/\.dat$/i,'')}.dat`);
  }
  return out.join('\n')+'\n';
}
function writeJson(p,x){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n')}
function writeJsonl(p,rows){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,rows.map(x=>JSON.stringify(x)).join('\n')+'\n')}
function snapshot(outDir,actions,byUid,name,meta){
  const rows=actions.filter(a=>a.kind==='CLICK'||a.kind==='ROOT').map(a=>byUid.get(a.uid)).filter(Boolean);
  fs.writeFileSync(path.join(outDir,name),ldrawText(rows,`${meta.strategy} · ${rows.length}/${meta.total} target placements · roots ${meta.roots} · strict clicks ${meta.clicks}`));
}
function frontierRows(placements,adj,built){
  const rows=[];
  for(const p of placements){
    if(built.has(p.uid))continue;
    const builtEdges=(adj.get(p.uid)||[]).filter(e=>proofOk(e)&&built.has(other(e,p.uid)));
    if(!builtEdges.length)continue;
    const unbuiltEdges=(adj.get(p.uid)||[]).filter(e=>proofOk(e)&&!built.has(other(e,p.uid)));
    rows.push({p,builtEdges,unbuiltEdges,degree:(adj.get(p.uid)||[]).filter(proofOk).length});
  }
  return rows;
}
function decompilerRanks(placements,edges){
  const adj=makeAdj(placements,edges);
  const left=new Set(placements.map(p=>p.uid));
  const degree=new Map(placements.map(p=>[p.uid,(adj.get(p.uid)||[]).filter(proofOk).length]));
  const removed=[];
  while(left.size){
    const candidates=placements.filter(p=>left.has(p.uid)).sort((a,b)=>{
      const da=degree.get(a.uid)||0,db=degree.get(b.uid)||0;
      if(da!==db)return da-db;
      const ya=Number(a.t?.[1]||0),yb=Number(b.t?.[1]||0);
      if(ya!==yb)return ya-yb;
      return stable(a,b);
    });
    const p=candidates[0];
    removed.push(p.uid);left.delete(p.uid);
    for(const e of adj.get(p.uid)||[]){
      if(!proofOk(e))continue;
      const v=other(e,p.uid);
      if(left.has(v))degree.set(v,(degree.get(v)||0)-1);
    }
  }
  const forward=[...removed].reverse();
  return new Map(forward.map((uid,i)=>[uid,i]));
}
function makePolicies(placements,edges){
  const partFreq=new Map();for(const p of placements)partFreq.set(p.partId,(partFreq.get(p.partId)||0)+1);
  const ranks=decompilerRanks(placements,edges);
  return [
    {
      name:'field-builder',label:'Field Builder',
      chooseRoot(cands,ctx){return [...cands].sort((a,b)=>ctx.degree(b.uid)-ctx.degree(a.uid)||stable(a,b))[0]},
      select(rows){
        const scored=rows.map(r=>({r,score:r.builtEdges.length*100+r.unbuiltEdges.length*12+r.degree})).sort((a,b)=>b.score-a.score||stable(a.r.p,b.r.p));
        const field=scored.slice(0,Math.min(12,scored.length));
        return {row:field[0].r,meta:{fieldSize:field.length,landscapeSize:rows.length,fieldScore:field[0].score}};
      }
    },
    {
      name:'cook-ding',label:'Cook Ding',
      chooseRoot(cands,ctx){return [...cands].sort((a,b)=>ctx.degree(b.uid)-ctx.degree(a.uid)||stable(a,b))[0]},
      select(rows){
        const scored=rows.map(r=>({r,score:r.builtEdges.length*200+r.unbuiltEdges.length*20+r.degree})).sort((a,b)=>b.score-a.score||stable(a.r.p,b.r.p));
        const gap=scored.length>1?scored[0].score-scored[1].score:Infinity;
        const top=scored[0];
        const knot=rows.length>24||gap<8||top.r.degree>=8;
        return {row:top.r,meta:{regime:knot?'KNOT':'FLOW',candidateCount:rows.length,dominanceGap:Number.isFinite(gap)?gap:null,computeUnits:knot?8:1}};
      }
    },
    {
      name:'decompiler',label:'Decompiler',
      chooseRoot(cands){return [...cands].sort((a,b)=>(ranks.get(a.uid)??1e9)-(ranks.get(b.uid)??1e9)||stable(a,b))[0]},
      select(rows){
        const row=[...rows].sort((a,b)=>(ranks.get(a.p.uid)??1e9)-(ranks.get(b.p.uid)??1e9)||stable(a.p,b.p))[0];
        return {row,meta:{reverseDerivedRank:ranks.get(row.p.uid)}};
      },
      runMeta:{reversePlanning:true}
    },
    {
      name:'beaver-error-surface',label:'Beaver Error Surface',
      chooseRoot(cands,ctx){return [...cands].sort((a,b)=>ctx.degree(b.uid)-ctx.degree(a.uid)||stable(a,b))[0]},
      select(rows){
        const scored=rows.map(r=>({r,score:r.builtEdges.length*1000+r.unbuiltEdges.length*25+r.degree})).sort((a,b)=>b.score-a.score||stable(a.r.p,b.r.p));
        const x=scored[0];
        return {row:x.r,meta:{cue:'MISSING_TARGET_EDGE',residualMagnitude:x.r.unbuiltEdges.length,precision:1,attentionScore:x.score}};
      }
    },
    {
      name:'epistemic-builder',label:'Epistemic Builder',
      chooseRoot(cands,ctx){return [...cands].sort((a,b)=>ctx.degree(b.uid)-ctx.degree(a.uid)||stable(a,b))[0]},
      select(rows){
        const scored=rows.map(r=>({r,ig:new Set(r.unbuiltEdges.map(e=>other(e,r.p.uid))).size+r.degree*.01})).sort((a,b)=>b.ig-a.ig||b.r.builtEdges.length-a.r.builtEdges.length||stable(a.r.p,b.r.p));
        const x=scored[0];
        return {row:x.r,meta:{epistemicAction:rows.length>1?'PROBE_FRONTIER':'NONE',informationGainProxy:x.ig,hypotheses:rows.length}};
      }
    },
    {
      name:'constraint-sorcerer',label:'Constraint Sorcerer',
      chooseRoot(cands,ctx){return [...cands].sort((a,b)=>ctx.degree(b.uid)-ctx.degree(a.uid)||stable(a,b))[0]},
      select(rows){
        const scored=rows.map(r=>({r,score:r.builtEdges.length*500+r.degree*30-r.unbuiltEdges.length})).sort((a,b)=>b.score-a.score||stable(a.r.p,b.r.p));
        const x=scored[0];
        return {row:x.r,meta:{relationConstraints:x.r.builtEdges.length,solverDerivedPose:true,score:x.score}};
      }
    },
    {
      name:'strange-builder',label:'Strange Builder',
      chooseRoot(cands,ctx){return [...cands].sort((a,b)=>(partFreq.get(a.partId)||0)-(partFreq.get(b.partId)||0)||ctx.degree(b.uid)-ctx.degree(a.uid)||stable(a,b))[0]},
      select(rows,ctx){
        const mode=ctx.step%31===0?'LOW_DEGREE':ctx.step%17===0?'REPEATED_VERB':ctx.step%11===0?'RARE_PART':'FUTURE_OPENING';
        let sorted;
        if(mode==='LOW_DEGREE')sorted=[...rows].sort((a,b)=>a.degree-b.degree||stable(a.p,b.p));
        else if(mode==='REPEATED_VERB')sorted=[...rows].sort((a,b)=>(partFreq.get(b.p.partId)||0)-(partFreq.get(a.p.partId)||0)||stable(a.p,b.p));
        else if(mode==='RARE_PART')sorted=[...rows].sort((a,b)=>(partFreq.get(a.p.partId)||0)-(partFreq.get(b.p.partId)||0)||stable(a.p,b.p));
        else sorted=[...rows].sort((a,b)=>b.unbuiltEdges.length-a.unbuiltEdges.length||b.degree-a.degree||stable(a.p,b.p));
        return {row:sorted[0],meta:{architectureMutation:mode,alienVerb:`ZXQ-${String(ctx.step%97).padStart(2,'0')}`}};
      }
    }
  ];
}
function runPolicy(policy,{placements,edges,sourceMeta,targetSummary,outRoot}){
  const outDir=path.join(outRoot,policy.name);fs.mkdirSync(outDir,{recursive:true});
  const byUid=new Map(placements.map(p=>[p.uid,p]));
  const adj=makeAdj(placements,edges);
  const degree=uid=>(adj.get(uid)||[]).filter(proofOk).length;
  const built=new Set(),unbuilt=new Set(placements.map(p=>p.uid));
  const actions=[],events=[];
  let clicks=0,roots=0,maxFrontier=0,sumFrontier=0,frontierSamples=0,probes=0,knotMoves=0,computeUnits=0;
  let nextCheckpointIndex=0;
  while(built.size<placements.length){
    const frontier=frontierRows(placements,adj,built);maxFrontier=Math.max(maxFrontier,frontier.length);sumFrontier+=frontier.length;frontierSamples++;
    let p,row=null,kind,meta={};
    const ctx={built,unbuilt,adj,degree,step:built.size+1,placements,edges};
    if(frontier.length){
      const selected=policy.select(frontier,ctx);row=selected?.row||frontier.sort((a,b)=>stable(a.p,b.p))[0];meta=selected?.meta||{};p=row.p;kind='CLICK';
      const strictContacts=row.builtEdges.filter(proofOk);
      if(!strictContacts.length)throw new Error(`${policy.name}: attempted CLICK without strict edge at ${p.uid}`);
      clicks+=strictContacts.length;
      if(meta.epistemicAction&&meta.epistemicAction!=='NONE'){
        probes++;
        events.push({type:'PROBE',step:built.size+1,uid:p.uid,partId:p.partId,...meta});
      }
      if(meta.regime==='KNOT')knotMoves++;
      computeUnits+=meta.computeUnits||1;
      actions.push({step:built.size+1,kind,uid:p.uid,partId:p.partId,color:p.color,contacts:strictContacts.length,via:strictContacts.map(edgeKey),...meta});
    }else{
      p=remainingComponentSeed(placements,edges,unbuilt,policy,ctx);
      if(!p)throw new Error(`${policy.name}: no root while ${unbuilt.size} placements remain`);
      kind='ROOT';roots++;
      actions.push({step:built.size+1,kind,uid:p.uid,partId:p.partId,color:p.color,contacts:0,reason:'NEW_LOOSE_STRICT_COMPONENT'});
    }
    built.add(p.uid);unbuilt.delete(p.uid);
    while(nextCheckpointIndex<CHECKPOINTS.length&&built.size>=CHECKPOINTS[nextCheckpointIndex]){
      const n=CHECKPOINTS[nextCheckpointIndex++];
      snapshot(outDir,actions,byUid,`castle-${String(n).padStart(4,'0')}.ldr`,{strategy:policy.label,total:placements.length,roots,clicks});
    }
  }
  snapshot(outDir,actions,byUid,'castle-final.ldr',{strategy:policy.label,total:placements.length,roots,clicks});
  const largest=componentSets(placements,edges)[0]||new Set();
  const largestActions=actions.filter(a=>largest.has(a.uid));
  snapshot(outDir,largestActions,byUid,'largest-strict-component.ldr',{strategy:`${policy.label} · largest strict component`,total:largest.size,roots:largestActions.filter(a=>a.kind==='ROOT').length,clicks:largestActions.reduce((s,a)=>s+(a.contacts||0),0)});
  const metrics={
    strategy:policy.name,label:policy.label,targetInstances:placements.length,uniquePartIds:targetSummary.uniqueParts,
    actions:actions.length,roots,strictClickContacts:clicks,strictComponents:componentSets(placements,edges).length,
    largestStrictComponent:largest.size,maxFrontier,meanFrontier:frontierSamples?sumFrontier/frontierSamples:0,
    probes,knotMoves,computeUnits,source:sourceMeta,policyMeta:policy.runMeta||null,
    generatedFiles:fs.readdirSync(outDir).filter(x=>x.endsWith('.ldr')).sort()
  };
  writeJsonl(path.join(outDir,'TRACE.jsonl'),[...actions,...events].sort((a,b)=>(a.step??0)-(b.step??0)||String(a.type||a.kind).localeCompare(String(b.type||b.kind))));
  writeJson(path.join(outDir,'METRICS.json'),metrics);
  return {metrics,actions};
}

if(!fs.existsSync(targetPath))throw new Error(`Target missing: ${targetPath}`);
if(!fs.existsSync(shadowRoot))throw new Error(`Shadow library missing: ${shadowRoot}`);
fs.mkdirSync(outRoot,{recursive:true});
const sourceMeta=sourceMetaPath&&fs.existsSync(sourceMetaPath)?JSON.parse(fs.readFileSync(sourceMetaPath,'utf8')):null;
const targetText=fs.readFileSync(targetPath,'utf8');
const target=flattenLDraw(targetText,{name:path.basename(targetPath)});
const targetSummary=summarizeTarget(target);
console.log(`SEVEN BUILDERS TARGET · ${targetSummary.placements} placements · ${targetSummary.uniqueParts} unique IDs`);
const compiler=createShadowCompiler({loadReal:async p=>diskLoad(ldrawRoot,p),loadShadow:async p=>diskLoad(shadowRoot,p)});
const compiledByPart=new Map();
let i=0;
for(const row of targetSummary.parts){
  i++;
  const compiled=realPartExists(row.partId)?await compiler.compilePart(row.partId):{ports:[],clickable:[],unsupported:[`MISSING_LDRAW:parts/${row.partId}.dat`]};
  compiledByPart.set(row.partId,compiled);
  if(i%50===0||i===targetSummary.uniqueParts)console.log(`COMPILE ${i}/${targetSummary.uniqueParts}`);
}
const graph=buildStudContactGraph(target.placements,compiledByPart,{positionTolerance:STRICT_POSITION,normalTolerance:STRICT_NORMAL});
const strictEdges=(graph.edges||[]).filter(proofOk);
const comps=componentSets(target.placements,strictEdges);
console.log(`STRICT GRAPH · ${strictEdges.length} edges · ${comps.length} components · largest ${comps[0]?.size||0}`);
const policies=makePolicies(target.placements,strictEdges);
const results=[];
for(const policy of policies){
  console.log(`RUN ${policy.name}`);
  const r=runPolicy(policy,{placements:target.placements,edges:strictEdges,sourceMeta,targetSummary,outRoot});
  results.push(r);
  console.log(`DONE ${policy.name} · ${r.metrics.actions} actions · ${r.metrics.roots} roots · ${r.metrics.strictClickContacts} strict contacts`);
}
const signatures=results.map(r=>({strategy:r.metrics.strategy,first128:r.actions.slice(0,128).map(a=>a.uid).join('|')}));
const uniqueSignatures=new Set(signatures.map(x=>x.first128)).size;
const summary={
  schema:'hogwarts-seven-builders-1',generatedAt:new Date().toISOString(),targetPath:path.basename(targetPath),
  targetSourceSha256:shaMaybe(targetPath),sourceMeta,target:{placements:targetSummary.placements,uniquePartIds:targetSummary.uniqueParts},
  strictGraph:{edges:strictEdges.length,components:comps.length,largestComponent:comps[0]?.size||0},
  uniqueFirst128Trajectories:uniqueSignatures,
  builders:results.map(r=>r.metrics)
};
writeJson(path.join(outRoot,'SUMMARY.json'),summary);
const md=[
  '# Hogwarts · Seven Builder Runs','',
  `Target: ${targetSummary.placements} placements / ${targetSummary.uniqueParts} unique part IDs`,
  `Strict stud graph: ${strictEdges.length} edges / ${comps.length} components / largest ${comps[0]?.size||0}`,
  `Distinct first-128 trajectories: ${uniqueSignatures}/${policies.length}`,'',
  '| Builder | Roots | Strict contacts | Max frontier | Probes | Knot moves |',
  '|---|---:|---:|---:|---:|---:|',
  ...results.map(r=>`| ${r.metrics.label} | ${r.metrics.roots} | ${r.metrics.strictClickContacts} | ${r.metrics.maxFrontier} | ${r.metrics.probes} | ${r.metrics.knotMoves} |`),
  '',
  'These outputs are alternate construction trajectories over the same normalized target. A ROOT starts a new loose strict-stud component; only strict STUD_CLUTCH edges count as CLICK contacts. Full target geometry is not equivalent to one physically certified connected castle.'
];
fs.writeFileSync(path.join(outRoot,'REPORT.md'),md.join('\n')+'\n');
console.log(`SEVEN BUILDERS SUMMARY ${JSON.stringify({target:summary.target,strictGraph:summary.strictGraph,uniqueFirst128Trajectories:uniqueSignatures,builders:summary.builders.map(b=>({strategy:b.strategy,roots:b.roots,strictClickContacts:b.strictClickContacts,maxFrontier:b.maxFrontier,probes:b.probes,knotMoves:b.knotMoves}))})}`);
