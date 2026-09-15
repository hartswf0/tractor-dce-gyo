/* WAG spatial contracts. No renderer, DOM, physics, or hand-tracker dependency.
 * Input adapters provide image points and named actions; views never move parts.
 * World: X right, Y up, Z toward the seated user. Units: 20 LDU/stud, 8/plate.
 * Registration is visual and monocular, not metric room reconstruction.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ButterSpatial=api;})(globalThis,function(){
 'use strict';
 const FACES=Object.freeze({
  desk:{name:'DESK',plane:'xy',projection:'perspective',eye:[0,.52,.854],yaw:0,hidden:[0,0,-1],axis:'depth',low:'NEAR',high:'AWAY',instruction:'Open palm ↑ away · ↓ toward you'},
  room:{name:'3D ROOM',plane:'xy',projection:'perspective',eye:[0,.4,.9165],yaw:0,hidden:[0,0,-1],axis:'depth',low:'NEAR',high:'AWAY',instruction:'Open palm ↑ away · ↓ toward you'},
  front:{name:'FRONT',plane:'xy',projection:'orthographic',eye:[0,0,1],yaw:0,hidden:[0,0,-1],axis:'depth',low:'NEAR',high:'AWAY',instruction:'Open palm ↑ away · ↓ toward you'},
  right:{name:'RIGHT',plane:'yz',projection:'orthographic',eye:[1,0,0],yaw:Math.PI/2,hidden:[-1,0,0],axis:'width',low:'RIGHT',high:'LEFT',instruction:'Open palm ↑ left · ↓ right'},
  back:{name:'BACK',plane:'xy',projection:'orthographic',eye:[0,0,-1],yaw:Math.PI,hidden:[0,0,-1],axis:'depth',low:'NEAR',high:'AWAY',instruction:'Open palm ↑ away · ↓ toward you'},
  left:{name:'LEFT',plane:'yz',projection:'orthographic',eye:[-1,0,0],yaw:-Math.PI/2,hidden:[1,0,0],axis:'width',low:'LEFT',high:'RIGHT',instruction:'Open palm ↑ right · ↓ left'},
  top:{name:'TOP',plane:'xz',projection:'orthographic',eye:[0,1,0],up:[0,0,-1],yaw:0,hidden:[0,1,0],axis:'height',low:'LOW',high:'HIGH',instruction:'Open palm ↑ lift · ↓ lower'}
 });
 const SIDES=['front','right','back','left'];
 function nextFace(face,step){const i=Math.max(0,SIDES.indexOf(face));return SIDES[(i+step%4+4)%4];}
 function coverPoint(point,video,viewport){const k=Math.max(viewport.width/video.width,viewport.height/video.height);return {x:((1-point.x)*video.width*k-(video.width*k-viewport.width)/2)/viewport.width,y:(point.y*video.height*k-(video.height*k-viewport.height)/2)/viewport.height};}
 function inspectionPoint(point){return {x:.08+.84*((.85-point.x)/.70),y:.08+.84*((point.y-.12)/.76)};}
 function hiddenOffset(baseY,currentY,gain=1){return (baseY-currentY)*650*gain;}
 function hiddenDelta(face,amount){return FACES[face].hidden.map(n=>n*amount);}
 function describePosition({height,depth,gap}){const plates=Math.max(0,height/8),studs=Math.max(0,(400-depth)/20);return `${plates.toFixed(1)} plates high · ${studs.toFixed(1)} studs from near edge${Number.isFinite(gap)?` · ${Math.max(0,gap/8).toFixed(1)} plates to land`:''}`;}
 function chooseTarget(hits,previous,point){
  if(!hits.length)return null;
  // Latch only while the previous target is still under the ray and the pointer
  // remains within its small movement band. Never acquire a stale nearby brick.
  if(previous&&Math.hypot(point.x-previous.x,point.y-previous.y)<8&&hits.some(h=>h.id===previous.id))return previous.id;
  return hits[0].id;
 }
 return Object.freeze({FACES,SIDES,nextFace,coverPoint,inspectionPoint,hiddenOffset,hiddenDelta,describePosition,chooseTarget});
});
