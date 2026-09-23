"""Compile the acquired Green Grocer into the existing Butter scene format."""
from pathlib import Path
import json,gzip,base64,hashlib,collections,re
import numpy as np
import geometry_compiler as G
from catalogue import parse,placements,closure
R=Path(__file__).parent; OUT=R/'production'; BASE=R.parent/'butter-film-scenes'
sec=parse((R/'donors/10185.mpd').read_text(),'10185.ldr'); root=next(iter(sec));ground='10185 - ground floor.ldr'
scale=.72;center=np.array([0,-4,-10]);flip=np.array([1,-1,-1])
from adapt_produce import adapt
produce_adaptations=adapt(sec,ground,scale,center,flip)
# Keep moving door panels separate from fixed native frames.
door_specs=[]
# Storefront panels are direct native parts; isolate their render batches.
glassCodes={int(m[1]) for l in (R/'ldraw/LDConfig.ldr').read_text().splitlines() if (m:=re.search(r'CODE\s+(\d+).*ALPHA\s+(\d+)',l)) and int(m[2])<255}
rows=[];defs=[];pages=[];colliders={};batches=[]
# Retain source sequence and keep semantic subassemblies independently selectable.
batch=[]
for p in placements(sec[ground]):
 if batch and (p['sourceStep']!=batch[0]['sourceStep'] or len(batch)==6 or p['ref'] in sec or batch[0]['ref'] in sec or p['ref'] in {'60616a.dat','60623.dat'} or batch[0]['ref'] in {'60616a.dat','60623.dat'}):
  batches.append(batch);batch=[]
 batch.append(p)
if batch:batches.append(batch)
expanded=[]
for batch in batches:
 if len(batch)==1 and batch[0]['ref'] in sec and batch[0]['ref'].endswith('door.ldr'):
  parent=batch[0];v=np.array(parent['transform']);A=v[3:].reshape(3,3)
  for child in placements(sec[parent['ref']]):
   q=dict(parent);u=np.array(child['transform']);q.update(ref=child['ref'],color=child['color'],transform=[*(A@u[:3]+v[:3]),*(A@u[3:].reshape(3,3)).reshape(-1)],doorName=parent['ref']);expanded.append([q])
 else:expanded.append(batch)
batches=expanded

def leaf_boxes(key,mat,pos,color):
 out=[]
 if key not in sec or key.endswith('.dat'):
  ff,_=G.geometry(key,sec,color);ff=(ff@mat.T+pos)*flip
  if len(ff):out.append([((ff.min((0,1))-center)*scale).tolist(),((ff.max((0,1))-center)*scale).tolist()])
 else:
  for p in placements(sec[key]):
   v=np.array(p['transform']);a=v[3:].reshape(3,3);c=color if p['color']==16 else p['color']
   out+=leaf_boxes(p['ref'],mat@a,mat@v[:3]+pos,c)
 return out

def leaf_geometry(key,mat,pos,color):
 if key not in sec or key.endswith('.dat'):
  ff,cc=G.geometry(key,sec,color)
  if len(ff):yield (ff@mat.T+pos)*flip,cc
 else:
  for p in placements(sec[key]):
   v=np.array(p['transform']);a=v[3:].reshape(3,3);c=color if p['color']==16 else p['color']
   yield from leaf_geometry(p['ref'],mat@a,mat@v[:3]+pos,c)

def add(ps,label,layer,page=None):
 faces=[];colors=[];boxes=[];collect=[]
 for p in ps:
  v=np.array(p['transform']);a=v[3:].reshape(3,3);c=0 if p['color']==16 else p['color']
  ff,cc=G.geometry(p['ref'],sec,c);start=sum(len(x) for x in faces)
  food={'33125.dat':('bread','Bread · croissant',200),'33085.dat':('banana','Bananas',120),'33172.dat':('carrot','Carrots',80),'33183.dat':('carrot','Carrots',80)}.get(p['ref'])
  if layer=='shop' and food:
   # First source occurrence of each food; carrot includes its adjacent top.
   seen=sum(1 for q in placements(sec[ground]) if q['index']<p['index'] and q['ref']==p['ref'])
   if seen==0:collect.append(dict(id=food[0],name=food[1],cents=food[2],start=start,count=len(ff),sourceIndex=p['index'],ref=p['ref']))
  faces.append((ff@a.T+v[:3])*flip);colors+=cc
  if layer=='shop':boxes+=leaf_boxes(p['ref'],a,v[:3],c)
 f=(np.concatenate(faces)-center)*scale;lo=f.min((0,1));hi=f.max((0,1));origin=np.array([(lo[0]+hi[0])/2,lo[1],(lo[2]+hi[2])/2]);f-=origin
 ident='readymade-'+str(len(rows));rgb=np.array([[int(G.COL.get(c,'#a6b4b9')[i:i+2],16) for i in [1,3,5]] for c in colors],dtype=np.uint8)
 defs.append(dict(id=ident,name=label,h=float(hi[1]-lo[1]),offsetY=0,bounds=[float(lo[0]-origin[0]),float(hi[0]-origin[0]),float(lo[2]-origin[2]),float(hi[2]-origin[2])],vertices=base64.b64encode(f.astype('<f4').tobytes()).decode(),colors=base64.b64encode(rgb).decode(),ref=ps[0]['ref'],sourceLine=None,layer=layer,reviewPage=page,glassTriangles=[i for i,c in enumerate(colors) if c in glassCodes],collectibles=collect))
 if layer=='shop':
  keep_f=[];keep_c=[]
  fixture=bool(re.search('desk|goods|shelf|basket|clock|refrigerator',label))
  for p in ps:
   v=np.array(p['transform']);a=v[3:].reshape(3,3);c=0 if p['color']==16 else p['color']
   for ff,cc in leaf_geometry(p['ref'],a,v[:3],c):
    world=(ff-center)*scale
    # Camera access removes complete native leaf instances, never uncapped slices.
    if fixture or world[:,:,2].min()>=-36 or world[:,:,1].max()<=15:
     keep_f.append(world-origin);keep_c+=cc
  film=np.concatenate(keep_f) if keep_f else np.empty((0,3,3))
  filmrgb=np.array([[int(G.COL.get(c,'#a6b4b9')[i:i+2],16) for i in [1,3,5]] for c in keep_c],dtype=np.uint8)
  defs[-1].update(filmVertices=base64.b64encode(film.astype('<f4').tobytes()).decode(),filmColors=base64.b64encode(filmrgb).decode(),filmGlassTriangles=[i for i,c in enumerate(keep_c) if c in glassCodes])
 rows.append(dict(id=ident,part=ident,color=15,x=float(origin[0]),y=float(origin[1]),z=float(origin[2]),r=0))
 if len(ps)==1 and ps[0]['ref'] in {'60616a.dat','60623.dat'} and layer=='shop':
  v=np.array(ps[0]['transform']);hinge=(v[:3]*flip-center)*scale
  door_specs.append(dict(part=ident,hinge=hinge.tolist(),origin=origin.tolist(),bounds=[lo.tolist(),hi.tolist()],name='Shop entrance'))
 if boxes:colliders[ident]=[[(np.array(lo)-origin).tolist(),(np.array(hi)-origin).tolist()] for lo,hi in boxes]
 return ident
for i,batch in enumerate(batches):
 label=(batch[0]['ref'].replace('10185 - ground floor - ','').replace('.ldr','') if len(batch)==1 and batch[0]['ref'] in sec else 'Shop · source step '+str(batch[0]['sourceStep']))
 ident=add(batch,label,'shop',i)
 bom=collections.Counter((p['ref'],p['color']) for p in batch)
 pages.append(dict(id=ident,label=label,sourceStep=batch[0]['sourceStep'],placements=[p['index'] for p in batch],bom=[dict(ref=r,color=c,quantity=n,subassembly=r in sec) for (r,c),n in bom.items()]))
for p,label in zip(list(placements(sec[root]))[1:4],['Apartment · first floor','Apartment · second floor','Roof terrace']):add([p],label,'upper')
# A native assembly retains the exact donor placement graph, without donor minifigure extras.
main=['0 FILE film-butter-grocer.ldr','0 Film Butter location adaptation: preserved architecture, cast staged in player','0 Author: Film Butter adaptation; source models retain original authors']
for p in list(placements(sec[root]))[:4]:main+=['1 '+str(p['color'])+' '+' '.join(str(v) for v in p['transform'])+' '+p['ref'],'0 STEP']
keys=[]
for p in list(placements(sec[root]))[:4]:
 for k in closure(sec,p['ref']):
  if k not in keys:keys.append(k)
source='\n'.join(main)+'\n'+'\n'.join('\n'.join(l for l in sec[k] if l.strip()!='0 NOFILE') for k in keys)+'\n0 NOFILE\n'
(OUT/'Film-Butter-Grocer.mpd').write_text(source)
# The donor has a checkout near (-60,-24,20); actors are placed in its aisle at native scale.
def actor(kind,x,y,z,heading):
 p=(np.array([x,y,z])*flip-center)*scale
 return dict(kind=kind,x=float(p[0]),y=float(p[1]),z=float(p[2]),heading=heading)
base=gzip.decompress((R/'base-player.html.gz').read_bytes()).decode()
old=json.loads(base.split('window.ButterFilmData=',1)[1].split(';window.ButterAssemblyPlans=',1)[0])[0]
a={k:v for k,v in old.items() if k not in ['geometry','rows','upgradeRows','upgradeActors']}
a.update(id='grocer-location',title='Unidentified Item · Green Grocer',file='Film-Butter-Grocer.mpd',sourceText=source,hash=hashlib.sha256(source.encode()).hexdigest(),rows=rows,upgradeRows=rows,upgradeActors=[actor('citizen',-115,-8,5,-1.57),actor('movieator-marge',20,-8,15,1.57),actor('movieator-maggie',40,-8,-45,1.57)],geometry=base64.b64encode(gzip.compress(json.dumps(defs,separators=(',',':')).encode())).decode(),scale=scale,center=center.tolist(),bounds=[[-230.4,0,-252],[230.4,600,245]],upgradeExtent=[460.8,475.2],cameras=[],upgradeChanges=['Replaced primitive grocery set with preserved Green Grocer architecture.','Upper floors lift away for shop inspection.','Existing Butter cast staged beside the authored checkout.'],notes='The proposed 48-second take is retained for contact review; playback and export are gated.',warnings=['Native glass triangles render transparently; refraction and TEXMAP are not implemented.','Navigation uses conservative leaf envelopes, not physical connections.'],pages=pages,colliders=colliders,doors=door_specs,brief='A detailed grocery and inhabited building. Inspect the checkout, enter the shop, and review the source assembly before staging the short.')
(OUT/'location.json').write_text(json.dumps(a,separators=(',',':')))
report=dict(groundDirectPlacements=sum(len(b) for b in batches),reviewPages=len(pages),maxDirectAdditions=max(len(b) for b in batches),groundLeafEnvelopes=sum(map(len,colliders.values())),renderBatches=len(rows),triangles=sum(len(base64.b64decode(d['colors']))//3 for d in defs),source='donors/10185.mpd',sourceSHA256=hashlib.sha256((R/'donors/10185.mpd').read_bytes()).hexdigest(),structuralValidation='not calculated')
(OUT/'produce-adaptations.json').write_text(json.dumps(produce_adaptations,indent=2))
(OUT/'location-report.json').write_text(json.dumps(report,indent=2));print(report)
