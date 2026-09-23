from pathlib import Path
import json,re,hashlib,collections
import numpy as np
R=Path(__file__).parent
NAMES={'10185':'Green Grocer','10190':'Market Street','10218':'Pet Shop','10224':'Town Hall','10243':'Parisian Restaurant','10246':"Detective’s Office",'21309':'Saturn V','21318':'Tree House','21325':'Medieval Blacksmith','40380':'Easter Sheep','6071':"Forestmen’s Crossing",'6066':'Camouflaged Outpost','6080':"King’s Castle",'6264':'Forbidden Cove','6278':'Enchanted Island','6285':'Black Seas Barracuda','6716':'Covered Wagon','6769':'Fort Legoredo','7410':'Jungle River','7637':'Farm','31048':'Lakeside Lodge'}
MIRROR={'10185','10190','10218','10224','10243','10246','6769','21309'}
LOCAL={'21318','21325','40380','7637','31048'}
paths={p.lower():p for p in json.loads((R/'part-index.json').read_text())}
def parse(text,fallback):
 sec={};current=None
 for l in text.splitlines():
  if l.strip().upper().startswith('0 FILE '):
   name=l.strip()[7:].strip().replace('\\','/').lower()
   if name in sec:raise ValueError('duplicate '+name)
   current=name;sec[name]=[]
  if current is not None:sec[current].append(l)
 if not sec:sec[fallback]=['0 FILE '+fallback]+text.splitlines()
 return sec

def placements(lines):
 step=1;index=0
 for l in lines:
  if l.strip().upper()=='0 STEP' or l.strip().upper().startswith('0 ROTSTEP '):step+=1
  t=l.strip().split(None,14)
  if len(t)==15 and t[0]=='1':
   index+=1;yield dict(ref=t[14].lower().replace('\\','/'),color=int(t[1]),transform=list(map(float,t[2:14])),sourceStep=step,index=index)

def closure(sec,key):
 seen=[]
 def visit(k,stack=()):
  if k in stack:raise ValueError('cycle '+k)
  if k in seen:return
  seen.append(k)
  for p in placements(sec[k]):
   if p['ref'] in sec:visit(p['ref'],stack+(k,))
 visit(key);return seen

def leaves(sec,key,chain=()):
 if key in chain:raise ValueError('cycle')
 if key not in sec or key.endswith('.dat'):return 1
 return sum(leaves(sec,p['ref'],chain+(key,)) for p in placements(sec[key]))

if __name__=='__main__':
 (R/'modules').mkdir(exist_ok=True);kits=[];modules=[];missing=set()
 for file in sorted((R/'donors').glob('*.mpd')):
  kit=file.stem;sec=parse(file.read_text(),kit+'.ldr');root=next(iter(sec));reachable=closure(sec,root);records=[]
  external=sorted({p['ref'] for k in reachable for p in placements(sec[k]) if p['ref'] not in sec})
  unknown=[p for p in external if not any(a in paths for a in [p,'parts/'+p,'p/'+p])]
  for key in reachable:
   if key.endswith('.dat'):continue
   ps=list(placements(sec[key]));count=leaves(sec,key);ident=kit+'-'+hashlib.sha256(key.encode()).hexdigest()[:10]
   children=[dict(p,kind='module' if p['ref'] in sec and not p['ref'].endswith('.dat') else 'part') for p in ps]
   mods=[p for p in children if p['kind']=='module'];desc=next((l[2:] for l in sec[key][1:] if l.startswith('0 ') and not l.startswith(('0 Name:','0 Author:','0 !','0 FILE','0 ROT'))),'')
   geometryWarnings=[]
   for p in ps:
    a=np.array(p['transform'][3:]).reshape(3,3);det=np.linalg.det(a)
    if abs(det)<1e-7:geometryWarnings.append({'placement':p['index'],'kind':'singular_transform'})
    elif not np.allclose(a.T@a,np.eye(3),atol=.002):geometryWarnings.append({'placement':p['index'],'kind':'non_rigid_transform'})
   rec=dict(id=ident,kit=kit,name=key,description=desc,leafInstances=count,directPlacements=len(ps),childModuleInstances=len(mods),sourceSteps=max([p['sourceStep'] for p in ps],default=0),children=children,transformWarnings=geometryWarnings,detachable='unverified',strength='not calculated',file='modules/'+ident+'.mpd')
   # Native rooted extraction: preserve descendants and source transforms without flattening.
   text='\n\n'.join('\n'.join(l for l in sec[k] if l.strip().upper()!='0 NOFILE') for k in closure(sec,key))+'\n0 NOFILE\n'
   (R/rec['file']).write_text(text);records.append(rec);modules.append(rec)
  source=f'https://github.com/anteloc/ldraw-lib/blob/master/models-annotated/{kit}-1.mpd' if kit in MIRROR else f'https://library.ldraw.org/library/omr/{kit}-1.mpd' if kit in LOCAL else 'https://github.com/hartswf0/tractor-dce-gyo/tree/main/ldraw/models'
  kits.append(dict(id=kit,name=NAMES.get(kit,kit),root=root,modules=len(records),leafInstances=leaves(sec,root),file='donors/'+file.name,source=source,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),author=[l[9:] for l in sec[root] if l.startswith('0 Author:')],license=[l[11:] for l in sec[root] if l.startswith('0 !LICENSE ')],externalParts=external,unknownInCachedLibrary=unknown,mirrorAnnotated=kit in MIRROR))
  print(kit,NAMES.get(kit),leaves(sec,root),'leaf placements;',len(records),'modules;',len(unknown),'unknown refs')
 (R/'catalogue.json').write_text(json.dumps(dict(kits=kits,modules=modules),indent=2))
