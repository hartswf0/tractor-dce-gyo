import * as THREE from 'three';

const C={
  ivory:'#eee8d7', white:'#f4efe4', black:'#211d19', brown:'#5b3923', darkBrown:'#34231b', red:'#7b241e', rust:'#9a4f31',
  blue:'#314a69', deepBlue:'#203b61', sea:'#456b78', teal:'#4f756f', olive:'#6c6a45', sand:'#b39a72', tan:'#937653',
  grey:'#8a867d', paleGrey:'#c8c4ba', gold:'#a77b2f', purple:'#5a465f', green:'#4f6245'
};

export const ACTOR_KIT=Object.freeze({
  odysseus:{head:'standard_print_plus_beard',beard:'full',hair:'21787.dat',hairColor:70,costume:{top:4,bottom:70,base:C.rust,accent:C.darkBrown,trim:C.gold,pattern:'traveler',cape:C.red}},
  penelope:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:15,bottom:15,base:C.ivory,accent:C.sand,trim:C.gold,pattern:'drape',skirt:true}},
  telemachus:{head:'standard_print',beard:false,hair:'21787.dat',hairColor:70,costume:{top:272,bottom:70,base:C.blue,accent:C.sand,trim:C.gold,pattern:'young',cape:C.deepBlue}},
  athena:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:19,costume:{top:15,bottom:272,base:C.white,accent:C.blue,trim:C.gold,pattern:'divine',cape:C.deepBlue}},
  nestor:{head:'standard_print_plus_beard',beard:'groomed',hair:'21787.dat',hairColor:71,costume:{top:19,bottom:70,base:C.tan,accent:C.darkBrown,trim:C.gold,pattern:'elder'}},
  eumaeus:{head:'standard_print_plus_beard',beard:'full',hair:'21787.dat',hairColor:70,costume:{top:19,bottom:70,base:C.brown,accent:C.olive,trim:C.sand,pattern:'worker'}},
  circe:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:4,bottom:70,base:C.purple,accent:C.red,trim:C.gold,pattern:'divine',skirt:true}},
  nausicaa:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:15,bottom:272,base:C.white,accent:C.sea,trim:C.gold,pattern:'drape',skirt:true}},
  helen:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:15,bottom:4,base:C.ivory,accent:C.red,trim:C.gold,pattern:'court',skirt:true}},
  eurycleia:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:71,costume:{top:70,bottom:19,base:C.tan,accent:C.brown,trim:C.ivory,pattern:'elder',skirt:true}},
  alcinous:{head:'standard_print_plus_beard',beard:'groomed',hair:'21787.dat',hairColor:71,costume:{top:272,bottom:15,base:C.blue,accent:C.white,trim:C.gold,pattern:'court',cape:C.deepBlue}},
  polyphemus:{head:'special_rig',beard:'wild',hair:null,hairColor:70,costume:{top:70,bottom:70,base:C.brown,accent:C.darkBrown,trim:C.sand,pattern:'giant'}},
  poseidon:{head:'silhouette_sensitive_beard',beard:'wild',hair:'21787.dat',hairColor:15,costume:{top:272,bottom:19,base:C.deepBlue,accent:C.sea,trim:C.gold,pattern:'divine',cape:C.sea}},
  calypso:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:15,bottom:272,base:C.ivory,accent:C.teal,trim:C.gold,pattern:'drape',skirt:true}},
  tiresias:{head:'silhouette_sensitive_beard',beard:'long',hair:'21787.dat',hairColor:71,costume:{top:71,bottom:72,base:C.grey,accent:C.darkBrown,trim:C.paleGrey,pattern:'elder',cape:C.grey}},
  laertes:{head:'silhouette_sensitive_beard',beard:'long',hair:'21787.dat',hairColor:71,costume:{top:19,bottom:70,base:C.tan,accent:C.olive,trim:C.sand,pattern:'worker'}},
  antinous:{head:'standard_print',beard:false,hair:'21787.dat',hairColor:70,costume:{top:4,bottom:70,base:C.red,accent:C.darkBrown,trim:C.gold,pattern:'court',cape:C.red}},
  menelaus:{head:'standard_print_plus_beard',beard:'groomed',hair:'21787.dat',hairColor:70,costume:{top:4,bottom:70,base:C.rust,accent:C.brown,trim:C.gold,pattern:'court',cape:C.red}},
  arete:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:272,bottom:19,base:C.sea,accent:C.ivory,trim:C.gold,pattern:'court',skirt:true}},
  hermes:{head:'standard_print',beard:false,hair:'21787.dat',hairColor:70,costume:{top:71,bottom:70,base:C.paleGrey,accent:C.blue,trim:C.gold,pattern:'messenger',cape:C.grey}},
  zeus:{head:'silhouette_sensitive_beard',beard:'long',hair:'21787.dat',hairColor:15,costume:{top:15,bottom:272,base:C.white,accent:C.grey,trim:C.gold,pattern:'divine',cape:C.paleGrey}},
  phemius:{head:'standard_print_plus_beard',beard:'short',hair:'21787.dat',hairColor:70,costume:{top:19,bottom:70,base:C.olive,accent:C.brown,trim:C.gold,pattern:'poet'}},
  melanthius:{head:'standard_print',beard:false,hair:'21787.dat',hairColor:70,costume:{top:70,bottom:70,base:C.darkBrown,accent:C.brown,trim:C.sand,pattern:'worker'}}
});

export function actorKit(character){return ACTOR_KIT[String(character||'').toLowerCase()]||ACTOR_KIT.telemachus;}

function textureCanvas(spec,which='torso'){
  const c=document.createElement('canvas');c.width=512;c.height=which==='torso'?360:300;const g=c.getContext('2d');
  g.clearRect(0,0,c.width,c.height);
  // Transparent print only. The LDraw torso/legs remain the actual colored plastic.
  const ink='#2a241e',trim=spec.trim||C.gold,accent=spec.accent||C.brown;
  g.strokeStyle=ink;g.lineWidth=8;g.lineCap='round';g.lineJoin='round';
  if(which==='torso'){
    g.beginPath();g.arc(256,24,72,.12*Math.PI,.88*Math.PI);g.stroke();
    if(spec.pattern==='drape'||spec.pattern==='divine'||spec.pattern==='court'){
      g.fillStyle=accent;g.globalAlpha=.72;g.beginPath();g.moveTo(8,10);g.lineTo(130,0);g.lineTo(330,355);g.lineTo(250,355);g.closePath();g.fill();g.globalAlpha=1;
      g.strokeStyle=trim;g.lineWidth=13;g.beginPath();g.moveTo(44,0);g.lineTo(288,355);g.stroke();
    }else if(spec.pattern==='traveler'||spec.pattern==='worker'||spec.pattern==='elder'){
      g.fillStyle=accent;g.globalAlpha=.72;g.fillRect(12,252,488,58);g.globalAlpha=1;g.strokeStyle=trim;g.lineWidth=9;g.strokeRect(12,247,488,70);
      g.strokeStyle=ink;g.lineWidth=6;for(let x=82;x<470;x+=92){g.beginPath();g.moveTo(x,92);g.lineTo(x-28,230);g.stroke()}
    }else if(spec.pattern==='messenger'||spec.pattern==='young'){
      g.fillStyle=accent;g.globalAlpha=.7;g.beginPath();g.moveTo(8,70);g.lineTo(205,18);g.lineTo(312,355);g.lineTo(200,355);g.closePath();g.fill();g.globalAlpha=1;
      g.strokeStyle=trim;g.lineWidth=10;g.beginPath();g.moveTo(35,82);g.lineTo(205,36);g.stroke();
    }else if(spec.pattern==='poet'){
      g.fillStyle=accent;g.globalAlpha=.68;g.fillRect(18,238,476,62);g.globalAlpha=1;g.strokeStyle=trim;g.lineWidth=9;g.beginPath();g.moveTo(78,78);g.quadraticCurveTo(250,168,428,82);g.stroke();
    }else if(spec.pattern==='giant'){
      g.fillStyle=accent;g.globalAlpha=.36;for(let i=0;i<13;i++){g.beginPath();g.arc((i*91)%512,(i*61)%340,22+(i%3)*10,0,Math.PI*2);g.fill()}g.globalAlpha=1;
    }
  }else{
    g.fillStyle=accent;g.globalAlpha=.7;g.fillRect(10,8,492,48);g.globalAlpha=1;g.strokeStyle=trim;g.lineWidth=9;g.beginPath();g.moveTo(12,58);g.lineTo(500,58);g.stroke();
    g.strokeStyle=ink;if(spec.skirt){g.lineWidth=5;for(let x=70;x<500;x+=95){g.beginPath();g.moveTo(x,72);g.lineTo(x-22,286);g.stroke()}}else{g.lineWidth=6;g.beginPath();g.moveTo(256,72);g.lineTo(256,296);g.stroke()}
  }
  return c;
}

function planeTexture(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;}

export function makeCostumeMeshes(character){
  const kit=actorKit(character),spec=kit.costume,group=new THREE.Group();group.name=`ODYSSEY_COSTUME:${character}`;
  const torsoMat=new THREE.MeshBasicMaterial({map:planeTexture(textureCanvas(spec,'torso')),transparent:true,alphaTest:.02,side:THREE.DoubleSide,depthWrite:false});
  const torso=new THREE.Mesh(new THREE.PlaneGeometry(31.2,20.2),torsoMat);torso.position.set(0,-48.9,-10.05);torso.renderOrder=15;group.add(torso);
  const lowerMat=new THREE.MeshBasicMaterial({map:planeTexture(textureCanvas(spec,'lower')),transparent:true,alphaTest:.02,side:THREE.DoubleSide,depthWrite:false});
  const lower=new THREE.Mesh(new THREE.PlaneGeometry(27.4,16.3),lowerMat);lower.position.set(0,-18.5,-10.06);lower.renderOrder=15;group.add(lower);
  if(spec.cape){const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(spec.cape),side:THREE.DoubleSide,transparent:true,opacity:.9});const sh=new THREE.Shape();sh.moveTo(-15,8);sh.lineTo(15,8);sh.lineTo(18,-29);sh.lineTo(0,-34);sh.lineTo(-18,-29);sh.closePath();const cape=new THREE.Mesh(new THREE.ShapeGeometry(sh),mat);cape.position.set(0,-45,11.8);cape.renderOrder=1;group.add(cape)}
  return group;
}

export function makeBeardMesh(character){
  const kit=actorKit(character),kind=kit.beard;if(!kind)return null;
  // Beard geometry belongs below the mouth. The performance drawing still carries the
  // beard ink; this shell only changes silhouette at chin/neck for beard-heavy actors.
  const cfg={short:{h:3.4,r:13.35,drop:-63.3},groomed:{h:4.3,r:13.45,drop:-62.9},full:{h:5.7,r:13.6,drop:-62.0},long:{h:8.4,r:13.9,drop:-60.5},wild:{h:9.8,r:14.25,drop:-59.6}}[kind]||{h:4.5,r:13.5,drop:-62.5};
  const geo=new THREE.CylinderGeometry(cfg.r+.35,cfg.r,cfg.h,48,1,true,Math.PI-.78,1.56);
  const color=(kit.hairColor===15||kit.hairColor===71)?0xbdb9ae:0x2b211a;
  const mat=new THREE.MeshStandardMaterial({color,roughness:.9,metalness:0,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(0,cfg.drop,0);mesh.name=`ODYSSEY_BEARD:${character}:${kind}`;mesh.renderOrder=10;return mesh;
}

export function assemblyLabel(character){const k=actorKit(character);return `${k.head.replaceAll('_',' ')} · ${k.beard||'no beard'} · ${k.costume.pattern}`.toUpperCase();}
