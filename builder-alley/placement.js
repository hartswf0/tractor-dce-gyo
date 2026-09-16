/* Geometry policy shared by touch controls and hand dragging. Coordinates are LDU; Y is height. */
(function(root){
'use strict';
function resolve(B,p,d,exclude){
 const e=B.ext(p.part,p.rot),f=B.frame;
 const x=Math.round((d.x+e[0]-f.ax)/20)*20+f.ax-e[0];
 const z=Math.round((d.z+e[2]-f.az)/20)*20+f.az-e[2];
 let y=Math.round((d.y+f.datum)/8)*8-f.datum;
 const ground=B.groundH(x,z);y=Math.max(y,Math.ceil((ground+f.datum)/8)*8-f.datum);
 const probe=B.boxOf({...p,x,y,z});let support=null;
 for(const q of B.pieces.values()){
  if(q.id===exclude)continue;const b=q.box;
  const overlap=Math.min(b.max.x,probe.max.x)-Math.max(b.min.x,probe.min.x)>=19&&Math.min(b.max.z,probe.max.z)-Math.max(b.min.z,probe.min.z)>=19;
  if(overlap&&Math.abs(b.max.y-y)<4&&(!support||Math.abs(b.max.y-y)<Math.abs(support.max.y-y)))support=b;
 }
 if(support)y=support.max.y;
 const box=B.boxOf({...p,x,y,z});box.min.addScalar(.5);box.max.addScalar(-.5);
 let blocked=false;
 for(const q of B.around(box))if(q.id!==exclude&&q.box.intersectsBox(box)){blocked=true;break;}
 if(!blocked)for(const b of B.buildings(x,z,80))if(b.intersectsBox(box)){blocked=true;break;}
 return {x,y,z,blocked};
}
root.AlleyPlacement={resolve};
})(typeof window==='undefined'?globalThis:window);
