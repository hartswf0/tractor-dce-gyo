import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {flattenLDraw} from '../beaver-hogwarts/target-import.js';
import {createShadowCompiler,buildStudContactGraph} from '../beaver-hogwarts/shadow-connectors.js';

/*
  CHATGPT SEVEN — proposal validator

  NO GENERATIVE AUTHORITY.
  The LLM is the builder. This program is a world/physics instrument only.
  It must never choose a next placement, rank a frontier, imitate one of the
  seven prompts, or advance a trajectory without an explicit LLM proposal.
*/

const AGENTS=new Set([
  'field-builder','cook-ding','decompiler','beaver-error-surface',
  'epistemic-builder','constraint-sorcerer','strange-builder'
]);
const STRICT_POSITION=.005;
const STRICT_NORMAL=.999999;
const norm=s=>String(s||'').replace(/\\/g,'/').replace(/^\.\//,'');
const here=path.dirname(fileURLToPath(import.meta.url));
const affordanceRoot=path.resolve(here,'..');
const repoRoot=path.resolve(affordanceRoot,'..');
const ldrawRoot=path.join(repoRoot,'ldraw');

function die(message,code=2){console.error(message);process.exit(code)}
function readJson(p){return JSON.parse(fs.readFileSync(path.resolve(p),'utf8'))}
function writeJson(p,x){const q=path.resolve(p);fs.mkdirSync(path.dirname(q),{recursive:true});fs.writeFileSync(q,JSON.stringify(x,null,2)+'\n')}
function diskLoad(root,p){
  const n=norm(p);
  for(const c of [n,n.toLowerCase()]){
    try{return fs.readFileSync(path.join(root,...c.split('/')),'utf8')}catch{}
  }
  return null;
}
function proofOk(e){return e.protocol==='STUD_CLUTCH'&&e.d<=STRICT_POSITION&&e.normalDot<=-STRICT_NORMAL}
function other(e,uid){return e.a===uid?e.b:e.a}
function proposalError(proposal,message,extra={}){
  return {schema:'chatgpt-seven-validator-result-1',agent:proposal?.agent||null,cycle:proposal?.cycle??null,decision:'REJECTED',message,...extra};
}
function assertProposal(p){
  if(!p||p.schema!=='chatgpt-seven-proposal-1')return 'proposal schema must be chatgpt-seven-proposal-1';
  if(!AGENTS.has(p.agent))return `unknown agent ${p.agent}`;
  if(!Number.isInteger(p.cycle)||p.cycle<1)return 'cycle must be a positive integer';
  if(p.authoredBy!=='LLM')return 'authoredBy must be LLM';
  if(!p.intent)return 'intent is required';
  return null;
}
async function strictWorld(targetPath,shadowRoot){
  const text=fs.readFileSync(path.resolve(targetPath),'utf8');
  const target=flattenLDraw(text,{name:path.basename(targetPath)});
  const ids=[...new Set(target.placements.map(p=>p.partId))];
  const compiler=createShadowCompiler({loadReal:async p=>diskLoad(ldrawRoot,p),loadShadow:async p=>diskLoad(path.resolve(shadowRoot),p)});
  const compiledByPart=new Map();
  for(const id of ids){
    const real=diskLoad(ldrawRoot,`parts/${String(id).replace(/\.dat$/i,'')}.dat`);
    compiledByPart.set(id,real?await compiler.compilePart(id):{ports:[],clickable:[],unsupported:[`MISSING_LDRAW:${id}`]});
  }
  const graph=buildStudContactGraph(target.placements,compiledByPart,{positionTolerance:STRICT_POSITION,normalTolerance:STRICT_NORMAL});
  return {target,graph};
}

async function validate(argv){
  const [targetPath,shadowRoot,statePath,proposalPath,resultPath]=argv;
  if(!targetPath||!shadowRoot||!statePath||!proposalPath||!resultPath)die('usage: validate <target.ldr> <shadowRoot> <state.json> <proposal.json> <result.json>');
  const state=readJson(statePath),proposal=readJson(proposalPath);
  const shapeError=assertProposal(proposal);
  if(shapeError){writeJson(resultPath,proposalError(proposal,shapeError));return}
  if(state.agent!==proposal.agent){writeJson(resultPath,proposalError(proposal,'proposal agent does not match state agent'));return}
  if((state.nextCycle??1)!==proposal.cycle){writeJson(resultPath,proposalError(proposal,`expected cycle ${state.nextCycle??1}`));return}

  // Non-placement actions request an external instrument/tool. They do not mutate
  // castle state here. The scheduler must execute them and return evidence to the
  // same LLM agent as a residual packet.
  if(proposal.intent!=='PLACE_TARGET_INSTANCE'){
    writeJson(resultPath,{
      schema:'chatgpt-seven-validator-result-1',agent:proposal.agent,cycle:proposal.cycle,
      decision:'VALIDATED_FOR_TOOL_EXECUTION',castleTransition:false,intent:proposal.intent,
      residual:{target_delta:null,connector_delta:null,collision_delta:null,inventory_delta:null,support_delta:null,insertion_delta:null,dependency_delta:null,source_conflict_delta:state.shared?.targetNormalizationStatus==='PASS'?0:1},
      rule:'Validator does not choose or execute the next agent action. Return tool evidence to this same LLM context.'
    });
    return;
  }

  if(state.shared?.targetNormalizationStatus!=='PASS'){
    writeJson(resultPath,proposalError(proposal,'physical placement forbidden until targetNormalizationStatus=PASS',{
      residual:{source_conflict_delta:1,target_delta:null,connector_delta:null,collision_delta:null,inventory_delta:null,support_delta:null,insertion_delta:null,dependency_delta:null}
    }));
    return;
  }

  const uid=proposal.action?.uid;
  if(!uid){writeJson(resultPath,proposalError(proposal,'PLACE_TARGET_INSTANCE requires action.uid'));return}
  const {target,graph}=await strictWorld(targetPath,shadowRoot);
  const placement=target.placements.find(p=>p.uid===uid);
  if(!placement){writeJson(resultPath,proposalError(proposal,`target uid not found: ${uid}`));return}
  const committed=new Set(state.world?.committedUids||[]);
  if(committed.has(uid)){writeJson(resultPath,proposalError(proposal,`target uid already committed: ${uid}`));return}
  const edges=(graph.edges||[]).filter(e=>proofOk(e)&&(e.a===uid||e.b===uid)&&committed.has(other(e,uid)));
  const firstRoot=committed.size===0&&proposal.action?.claim==='ROOT';
  if(!firstRoot&&!edges.length){
    writeJson(resultPath,proposalError(proposal,'no strict STUD_CLUTCH contact to committed state; validator will not invent a supporting neighbor',{
      residual:{target_delta:0,connector_delta:1,collision_delta:null,inventory_delta:0,support_delta:null,insertion_delta:null,dependency_delta:null,source_conflict_delta:0}
    }));
    return;
  }
  writeJson(resultPath,{
    schema:'chatgpt-seven-validator-result-1',agent:proposal.agent,cycle:proposal.cycle,decision:'PHYSICALLY_ACCEPTABLE_WITH_MODELED_SCOPE',castleTransition:true,
    proposedUid:uid,strictStudContacts:edges.length,root:firstRoot,
    residual:{target_delta:-1,connector_delta:0,collision_delta:null,inventory_delta:0,support_delta:null,insertion_delta:null,dependency_delta:null,source_conflict_delta:0},
    caveat:'Only strict modeled STUD_CLUTCH is certified here. Collision, gravity/support, clips/bars/hinges, Technic insertion and access remain unclaimed unless separately validated.',
    rule:'This is validation of an LLM-authored proposal, not a generated next move.'
  });
}

const [command,...argv]=process.argv.slice(2);
if(command==='validate')await validate(argv);
else if(command==='about')console.log(JSON.stringify({schema:'chatgpt-seven-validator-1',generativeAuthority:false,agents:[...AGENTS]},null,2));
else die('Commands: about | validate. ChatGPT must author every proposal.');
