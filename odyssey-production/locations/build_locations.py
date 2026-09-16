from pathlib import Path
import json,math,shutil
R=Path('outputs/odyssey-pipeline');D=R/'locations';allsc=[]
for key in ['ithaca-cove','ogygia-grove']:
 rows=[]
 def p(id,c,x,y,z,role='terrain'): rows.append(dict(part=id,color=c,pos=[x,y,z],role=role))
 # Separate shore apron and sea tiles. All 4x4 plates unscaled.
 for i in range(-7,8):
  for j in range(-6,7):
   x,z=i*80,j*80;wet=z>160+40*math.cos(i*.5)
   p('3031',3 if wet else 19 if z>0 else 28,x,-8,z,'sea' if wet else 'ground')
 # Headland terracing: clear central corridor deliberately retained.
 for side in [-1,1]:
  for i in range(4,8):
   for j in range(-5,3):
    for k in range(1,max(2,8-i+(-j)//3)):
     p('3001',71,side*i*80,k*24-8,j*40,'cliff')
 # Grove kept behind acting apron. Foliage is native leaf clusters.
 for x,z,h in [(-320,-240,168),(-200,-320,192),(320,-260,168),(440,-160,144),(-440,-80,144)]:
  for y in range(16,h+1,24):p('3941',70,x,y,z,'tree')
  top=list(range(16,h+1,24))[-1]
  for dx,dz in [(-20,0),(20,0),(0,20),(0,-20),(0,0)]:p('2423',2,x+dx,top,z+dz,'canopy')
 if key=='ithaca-cove':
  # Landing / launch groove and prayer stone.
  for z in range(0,241,40):
   for x in [-60,60]:p('3020',28,x,0,z,'launch-edge')
  p('3003',71,-160,16,80,'prayer-stone')
  anchors={'landing':[0,0,160],'prayer':[-120,0,80],'town-exit':[0,0,-320]}
  route=[[0,0,160],[0,0,40],[0,0,-120],[0,0,-320]]
  source='ithacan-shore'
 else:
  # Cavern portal: 160 LDU clear width, 184 clear height, open-backed removable set.
  for x in [-120,120]:
   for z in [-240,-280]:
    for y in range(16,185,24):p('3001',72,x,y,z,'portal')
  for x in [-80,0,80]:p('3001',71,x,208,-240,'lintel')
  # Four springs, log-working area, loom blocking uprights.
  for x,z in [(-240,40),(-160,160),(240,40),(320,160)]:p('3031',3,x,0,z,'spring')
  for x in [180,260]:
   for y in range(16,113,24):p('3005',70,x,y,-200,'loom-proxy')
  for x in [190,230,270]:p('3010',70,x,136,-200,'loom-proxy')
  for x in [-220,-180,-140]:
   for y in [16,40]:p('3941',70,x,y,-40,'timber-proxy')
  anchors={'shore':[0,0,160],'cave-threshold':[0,0,-200],'loom':[220,0,-160],'raft-clearing':[-180,0,-40]}
  route=[[0,0,160],[0,0,40],[0,0,-120],[0,0,-280]]
  source='ogygia-cavern-and-grove'
 data=dict(id=key,source=source,parts=rows,anchors=anchors,route=route,units='LDU, +Y up, rigid scale 1',status='authored stage blockout; not surveyed terrain or imported donor model',views={'wide':[[1000,730,1400],[0,30,-50],43],'actor':[[280,170,550],[0,55,-160],48],'plan':[[0,1550,1],[0,0,0],49]})
 allsc.append(data)
 lines=[f'0 FILE {key}.ldr','0 !LDRAW_ORG Unofficial_Model','0 Authored Odyssey blocking study; units LDU; not a physical stability certificate']
 for a in rows:
  x,y,z=a['pos'];lines.append(f"1 {a['color']} {x} {-y} {-z} 1 0 0 0 1 0 0 0 1 {a['part']}.dat")
 (D/(key+'.mpd')).write_text('\n'.join(lines)+'\n')
(D/'blockouts.json').write_text(json.dumps(allsc,indent=2))
fmap=json.loads((R/'ldraw-map.json').read_text());seen=set()
def cp(rel):
 rel=fmap.get(rel.lower().replace('\\','/'),rel)
 if rel in seen:return
 seen.add(rel);src=Path('work/native/ldraw')/rel;dst=R/'native/ldraw'/rel
 assert src.exists(),rel
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
 for l in src.read_text(errors='replace').splitlines():
  a=l.split(maxsplit=14)
  if len(a)==15 and a[0]=='1':cp(a[14])
for id in {p['part']for s in allsc for p in s['parts']}:cp('parts/'+id+'.dat')
print([(s['id'],len(s['parts']))for s in allsc], 'dependencies',len(seen))
