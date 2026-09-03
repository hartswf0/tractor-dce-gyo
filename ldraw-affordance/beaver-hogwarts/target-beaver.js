const edgeKey=e=>`${e.a}|${e.b}|${e.aPort?.portIndex ?? ''}|${e.bPort?.portIndex ?? ''}`;

export function createTargetBeaver({placements,graph,strictPosition=.005,strictNormal=.999999}){
  const byUid=new Map(placements.map(p=>[p.uid,p])),adj=new Map(placements.map(p=>[p.uid,[]]));
  for(const e of graph.edges||[]){adj.get(e.a)?.push(e);adj.get(e.b)?.push(e)}
  const state={built:new Set(),roots:new Set(),actions:[],clicks:0,rejected:0,last:null};
  const other=(e,uid)=>e.a===uid?e.b:e.a;
  const proofOk=e=>e.protocol==='STUD_CLUTCH'&&e.d<=strictPosition&&e.normalDot<=-strictNormal;
  const verifiedEdges=()=>[...(graph.edges||[])].filter(proofOk);
  const componentOf=(seed,allowed=new Set(placements.map(p=>p.uid)))=>{const seen=new Set([seed]),q=[seed];while(q.length){const u=q.shift();for(const e of adj.get(u)||[]){if(!proofOk(e))continue;const v=other(e,u);if(allowed.has(v)&&!seen.has(v)){seen.add(v);q.push(v)}}}return seen};
  const components=()=>{const left=new Set(placements.map(p=>p.uid)),out=[];while(left.size){const seed=left.values().next().value,c=componentOf(seed,left);for(const u of c)left.delete(u);out.push(c)}return out.sort((a,b)=>b.size-a.size)};
  const builtNeighbors=uid=>(adj.get(uid)||[]).filter(e=>proofOk(e)&&state.built.has(other(e,uid)));
  const candidates=()=>placements.filter(p=>!state.built.has(p.uid)&&builtNeighbors(p.uid).length).map(p=>({p,edges:builtNeighbors(p.uid)})).sort((a,b)=>b.edges.length-a.edges.length-(adj.get(b.p.uid)?.length||0)+(adj.get(a.p.uid)?.length||0)||a.p.uid.localeCompare(b.p.uid));
  const nextRoot=()=>{const unbuilt=placements.filter(p=>!state.built.has(p.uid));if(!unbuilt.length)return null;const comps=[];const left=new Set(unbuilt.map(p=>p.uid));while(left.size){const seed=left.values().next().value,c=componentOf(seed,left);for(const u of c)left.delete(u);comps.push(c)}comps.sort((a,b)=>b.size-a.size);const c=comps[0];return [...c].map(uid=>byUid.get(uid)).sort((a,b)=>(adj.get(b.uid)?.filter(proofOk).length||0)-(adj.get(a.uid)?.filter(proofOk).length||0)||a.uid.localeCompare(b.uid))[0]};
  function audit(){
    const bad=[];for(const e of graph.edges||[])if(state.built.has(e.a)&&state.built.has(e.b)&&!proofOk(e))bad.push(e);return{ok:bad.length===0,bad,built:state.built.size,clicks:state.clicks};
  }
  function hear(){
    if(state.built.size===placements.length)return{state:'QUIET',cue:null,remaining:0};
    const c=candidates();if(c.length){const best=c[0];return{state:'HEAR',cue:{kind:'CLICK',placement:best.p,edges:best.edges},remaining:placements.length-state.built.size}}
    const root=nextRoot();if(root)return{state:'HEAR',cue:{kind:'ROOT',placement:root,edges:[]},remaining:placements.length-state.built.size};
    return{state:'BLOCKED',cue:null,remaining:placements.length-state.built.size};
  }
  function step(){
    const h=hear();if(!h.cue)return{status:h.state==='QUIET'?'complete':'blocked',hear:h,audit:audit()};
    const {kind,placement,edges}=h.cue;if(state.built.has(placement.uid))return{status:'retry',reason:'ALREADY_BUILT'};
    if(kind==='CLICK'){
      const valid=edges.filter(proofOk);if(!valid.length){state.rejected++;return{status:'blocked',reason:'NO_STRICT_VERIFIED_EDGE',hear:h}}
      state.built.add(placement.uid);state.clicks+=valid.length;const action={kind:'CLICK',placement,via:valid.map(edgeKey),contacts:valid.length};state.actions.push(action);state.last=action;
    }else{
      state.built.add(placement.uid);state.roots.add(placement.uid);const action={kind:'ROOT',placement,contacts:0,reason:'NEW_LOOSE_SUBASSEMBLY'};state.actions.push(action);state.last=action;
    }
    const a=audit();if(!a.ok){state.built.delete(placement.uid);state.actions.pop();state.rejected++;return{status:'blocked',reason:'ACCUMULATED_TARGET_EDGE_AUDIT',audit:a}}
    return{status:'acted',action:state.last,hear:hear(),audit:a};
  }
  function run(max=placements.length*2){let moves=0,result=null;while(moves<max){result=step();if(result.status!=='acted')break;moves++}return{moves,result,state,hear:hear(),audit:audit(),components:components().map(c=>c.size)};}
  return{state,hear,step,run,audit,components,verifiedEdges};
}

export const TARGET_BEAVER_VERSION='target-beaver-1';
