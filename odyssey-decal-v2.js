import * as BASE from './odyssey-decal.js';
export * from './odyssey-decal.js';

const EYES={
 odysseus:{gap:1.00,y:.34,rx:.055,ry:.070},athena:{gap:1.12,y:.34,rx:.058,ry:.074},penelope:{gap:1.05,y:.35,rx:.056,ry:.070},telemachus:{gap:1.00,y:.35,rx:.054,ry:.068},
 nestor:{gap:.98,y:.35,rx:.052,ry:.064},eumaeus:{gap:1.00,y:.35,rx:.054,ry:.068},circe:{gap:1.05,y:.35,rx:.056,ry:.070},nausicaa:{gap:1.07,y:.35,rx:.057,ry:.071},
 helen:{gap:1.04,y:.35,rx:.056,ry:.070},eurycleia:{gap:1.01,y:.35,rx:.055,ry:.068},alcinous:{gap:1.00,y:.35,rx:.054,ry:.067},polyphemus:{gap:.92,y:.34,rx:.061,ry:.076},
 poseidon:{gap:.98,y:.34,rx:.057,ry:.071},calypso:{gap:1.07,y:.35,rx:.057,ry:.071},tiresias:{gap:1.02,y:.35,rx:.053,ry:.064},laertes:{gap:.99,y:.35,rx:.053,ry:.065},
 antinous:{gap:.97,y:.35,rx:.055,ry:.068},menelaus:{gap:1.00,y:.35,rx:.054,ry:.067},arete:{gap:1.03,y:.35,rx:.056,ry:.069},hermes:{gap:1.08,y:.35,rx:.057,ry:.071},
 zeus:{gap:1.00,y:.34,rx:.057,ry:.070},phemius:{gap:1.03,y:.35,rx:.055,ry:.068},melanthius:{gap:.95,y:.35,rx:.054,ry:.067}
};

function eyeState(performance){const s=BASE.resolvePerformance(performance).state||{};const open=Math.max(.42,Math.min(1.32,1+(s.eyeWide||0)*.35-(s.eyeNarrow||0)*.48-(s.blink||0)*.9));return {open,gazeX:s.gazeX||0,gazeY:s.gazeY||0};}

export function renderLegoDecal(character,performance='neutral',w=448,h=250){
 const src=BASE.renderSourceFace(character,performance,720);if(!src)return null;
 const ink=document.createElement('canvas');ink.width=w;ink.height=h;const ig=ink.getContext('2d',{willReadFrequently:true});
 // Wider/taller than v1: the jaw and beard are identity, not disposable crop noise.
 const sx=src.width*.205,sy=src.height*.245,sw=src.width*.59,sh=src.height*.60;
 ig.drawImage(src,sx,sy,sw,sh,0,0,w,h);
 const im=ig.getImageData(0,0,w,h),d=im.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,r=d[i],gg=d[i+1],b=d[i+2],lum=.2126*r+.7152*gg+.0722*b;
   const nx=(x-w/2)/(w*.50),ny=(y-h*.50)/(h*.57);const inside=nx*nx+ny*ny<1;
   if(!inside||lum>198){d[i+3]=0;continue}
   const a=Math.max(0,Math.min(255,(218-lum)*2.55));d[i]=17;d[i+1]=15;d[i+2]=13;d[i+3]=a;
 }
 ig.putImageData(im,0,0);

 const out=document.createElement('canvas');out.width=w;out.height=h;const g=out.getContext('2d');g.clearRect(0,0,w,h);
 // LEGO print grammar adds a white sclera under the Odyssey ink. The source drawing's
 // paper-white eyes were previously made transparent and became skin-colored on brick.
 const e=EYES[String(character).toLowerCase()]||{gap:1,y:.35,rx:.055,ry:.069},st=eyeState(performance);
 const dx=w*.145*e.gap,cy=h*e.y,rx=w*e.rx,ry=h*e.ry*st.open;
 g.fillStyle='#fffdf8';g.strokeStyle='#181512';g.lineWidth=Math.max(3,w*.007);
 for(const side of [-1,1]){const cx=w*.5+side*dx;g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.fill();g.stroke();}
 g.drawImage(ink,0,0);
 return out;
}

export function makeDecalMesh(THREE,character,performance='neutral'){
 const c=renderLegoDecal(character,performance);if(!c)return null;
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;tex.wrapS=THREE.RepeatWrapping;tex.repeat.x=-1;tex.offset.x=1;
 const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.06,side:THREE.DoubleSide,depthWrite:false});
 const arc=1.62,geo=new THREE.CylinderGeometry(13.18,13.18,12.4,64,1,true,Math.PI-arc/2,arc);
 const mesh=new THREE.Mesh(geo,mat);mesh.position.set(0,-72.6,0);mesh.scale.y=-1;mesh.renderOrder=25;mesh.name=`ODYSSEY_DECAL_V2:${character}:${performance}`;
 mesh.userData={character,performance,source:'odyssey-halfworld/odyssey-performances',mount:'3626b-cylinder',sclera:true,facialHair:true};return mesh;
}
