import * as BASE from './odyssey-decal.js';
export * from './odyssey-decal.js';

// LEGO print compiler v3.
// Identity comes from the Odyssey source drawing. We only add what paper gave us for free:
// explicit white sclera beneath the original eye linework. No synthetic pupils/brows are added.
const WHITE='#fffdf7';
const HAIR={
  odysseus:'#241c18',nestor:'#b8b3aa',eumaeus:'#2a211b',alcinous:'#aaa69e',poseidon:'#e7e3da',
  tiresias:'#d7d3ca',laertes:'#c7c2b8',menelaus:'#39291f',zeus:'#ece8df',phemius:'#2b211b',polyphemus:'#34271f'
};
const BEARDED=new Set(['odysseus','nestor','eumaeus','alcinous','polyphemus','poseidon','tiresias','laertes','menelaus','zeus','phemius']);

function eyeState(performance){
  const s=BASE.resolvePerformance(performance).state||{};
  return {
    open:Math.max(.52,Math.min(1.2,1+(s.eyeWide||0)*.23-(s.eyeNarrow||0)*.28-(s.blink||0)*.72)),
  };
}

export function renderLegoDecal(character,performance='neutral',w=448,h=250){
  const src=BASE.renderSourceFace(character,performance,720);if(!src)return null;
  const crop=document.createElement('canvas');crop.width=w;crop.height=h;
  const cg=crop.getContext('2d',{willReadFrequently:true});
  // Preserve jaw/beard identity while removing the source drawing's outer hair silhouette.
  const sx=src.width*.225,sy=src.height*.255,sw=src.width*.55,sh=src.height*.54;
  cg.drawImage(src,sx,sy,sw,sh,0,0,w,h);

  const out=document.createElement('canvas');out.width=w;out.height=h;const g=out.getContext('2d');
  const st=eyeState(performance);
  // Sclera is deliberately smaller than the source eye contour. The source drawing supplies
  // eyelids, pupils and brows, keeping CHARACTER × PERFORMANCE intact.
  const cy=h*.305,dx=w*.145,rx=w*.047,ry=h*.058*st.open;
  g.fillStyle=WHITE;
  for(const side of [-1,1]){g.beginPath();g.ellipse(w*.5+side*dx,cy,rx,ry,0,0,Math.PI*2);g.fill();}

  const im=cg.getImageData(0,0,w,h),d=im.data;
  const key=String(character||'').toLowerCase(),bearded=BEARDED.has(key),hair=HAIR[key]||'#211b17';
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4,r=d[i],gg=d[i+1],b=d[i+2],lum=.2126*r+.7152*gg+.0722*b;
    const nx=(x-w/2)/(w*.50),ny=(y-h*.49)/(h*.57);
    if(nx*nx+ny*ny>=1||lum>205){d[i+3]=0;continue;}
    let alpha=Math.max(0,Math.min(255,(216-lum)*2.5));
    // Beard is still a PRINT, never a collar/shell. Slightly tint dense lower-face source
    // marks so long/wild beards read as facial hair while mouth/nose linework stays black.
    if(bearded&&y>h*.52&&lum<125){
      const c=parseInt(hair.slice(1),16);d[i]=(c>>16)&255;d[i+1]=(c>>8)&255;d[i+2]=c&255;alpha=Math.max(alpha,205);
    }else{d[i]=18;d[i+1]=16;d[i+2]=14;}
    d[i+3]=alpha;
  }
  cg.putImageData(im,0,0);g.drawImage(crop,0,0);
  return out;
}

export function makeDecalMesh(THREE,character,performance='neutral'){
  const c=renderLegoDecal(character,performance);if(!c)return null;
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;tex.wrapS=THREE.RepeatWrapping;tex.repeat.x=-1;tex.offset.x=1;
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.045,side:THREE.DoubleSide,depthWrite:false});
  const arc=1.58,geo=new THREE.CylinderGeometry(13.18,13.18,12.1,64,1,true,Math.PI-arc/2,arc);
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(0,-72.75,0);mesh.scale.y=-1;mesh.renderOrder=25;
  mesh.name=`ODYSSEY_DECAL_V3:${character}:${performance}`;
  mesh.userData={character,performance,source:'odyssey-halfworld/odyssey-performances',mount:'3626b-cylinder',sclera:'stable-under-source',facialHair:'printed'};
  return mesh;
}
