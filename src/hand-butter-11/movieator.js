/* Movieator recipes retain source prints and colours. Positions are plate-local. */
(function(){
 const identity=[1,0,0,0,1,0,0,0,1];
 async function parse(file,color=16){const loader=new THREE.LDrawLoader();loader.setFileMap({});Object.assign(loader.subobjectCache,ButterLDraw.parts);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Part timed out: '+file)),15000);loader.parse(ButterLDraw.colors+'\n1 '+color+' 0 0 0 1 0 0 0 1 0 0 0 1 parts/'+file,'cast.ldr',g=>{clearTimeout(timer);resolve(g);});});}
 async function make(item){if(!item.production)return ButterPerformer.makeActor({...Minifig.DEFS[item.definition],weapon:null,cape:null,collar:null});const def=item.production,rig=Minifig.skeleton(40,{}),refs=[];rig.def={name:def.name};rig.feet=60;rig.hipsP.position.y=-28;
 const head=def.parts.find(p=>p.role==='HEAD'||p.role==='BABY_HEAD');rig.headP.position.y=(head?.mountY??-84)+60;
 const add=(pivot,file,color,pos=[0,0,0],matrix=identity)=>refs.push({pivot,file,color,pos,matrix});
 for(const p of def.parts){const color=p.color??16;
  if(p.role==='HEAD'||p.role==='BABY_HEAD')add('headP',p.file,p.color??def.skin);
  else if(p.role==='HEADGEAR')add('headP',p.file,color,[0,-84-(head?.mountY??-84),0]);
  else if(p.role==='LOWER'||p.role==='OVERLAY')add('hipsP',p.file,color);
  else if(p.role==='BABY')add('hipsP',p.file,color,[0,-14,0]);
  else if(p.role==='TORSO'){
   add('torsoP',p.file,p.color??15);
   for(const side of ['R','L']){const slot=Minifig.SLOTS['arm'+side],hand=Minifig['HAND_'+side],pivot=side==='R'?'armRP':'armLP';add(pivot,side==='R'?'3818.dat':'3819.dat',p.color??15,[0,0,0],slot.slice(4));add(pivot,'3820.dat',def.skin,[hand[0]-slot[1],hand[1]-slot[2],hand[2]-slot[3]],hand.slice(3));}
  }else if(p.role==='UPPER'){
   const text=ButterLDraw.parts['parts/'+p.file]||ButterLDraw.parts[p.file];if(!text)throw Error('Missing upper: '+p.file);
   for(const line of text.split(/\r?\n/)){const a=line.trim().split(/\s+/);if(a[0]!=='1'||a.length<15)continue;const file=a.slice(14).join(' ').replace(/^parts\//,'');let col=+a[1];if(/3820.dat$/i.test(file)||/381[89].dat$/i.test(file)&&col===14)col=def.skin;else if(col===16)col=p.color??15;const pos=a.slice(2,5).map(Number);let pivot='torsoP';if(/381[89].dat$|3820.dat$/i.test(file)){pivot=pos[0]<0?'armRP':'armLP';pos[0]-=pos[0]<0?-15.552:15.552;pos[1]-=9;}add(pivot,file,col,pos,a.slice(5,14).map(Number));}
  }
 }
 try{for(const ref of refs){const group=await parse(ref.file,ref.color),m=ref.matrix;group.matrixAutoUpdate=false;group.matrix.set(m[0],m[1],m[2],ref.pos[0],m[3],m[4],m[5],ref.pos[1],m[6],m[7],m[8],ref.pos[2],0,0,0,1);rig[ref.pivot].add(group);group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});}rig.figure.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(rig.figure);if(!Number.isFinite(box.min.y)||box.isEmpty())throw Error('Empty character');rig.feet-=box.min.y;rig.hipsP.position.y=32-rig.feet;rig.height=box.max.y-box.min.y;rig.figure.scale.setScalar(1.65);rig.pos.set(0,0,-215);ButterSpatialRuntime.plate.add(rig.figure);return rig;}catch(e){rig.figure.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])m.dispose();});throw e;}
 }
 window.ButterMovieator={make,parse};
})();
