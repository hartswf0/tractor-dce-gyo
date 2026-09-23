"""Author supported native produce displays; never modify the acquired donor file."""
import numpy as np
import geometry_compiler as G
from catalogue import placements

def adapt(sec,ground,scale,center,flip):
 lines=sec[ground]; ps=list(placements(lines)); changes=[]; replacement={}; F=np.diag(flip)
 groups=[('banana',['33085.dat'],np.eye(3),82,0),('bread',['33125.dat'],np.eye(3),84,36),('carrot',['33172.dat','33183.dat'],np.eye(3),72,64.8)]
 for label,refs,rotation,x,z in groups:
  selected=[next(p for p in (list(reversed(ps)) if label=='carrot' else ps) if p['ref']==ref) for ref in refs]
  first=np.array(selected[0]['transform'][:3]); pieces=[]; vertices=[]
  for p in selected:
   v=np.array(p['transform']); a=np.eye(3) if label!='carrot' else v[3:].reshape(3,3); pos=v[:3]-first
   f,_=G.geometry(p['ref'],sec,p['color']); world=(f@a.T+pos)@F.T@rotation.T*scale;vertices.append(world);pieces.append((p,a,pos))
  allv=np.concatenate(vertices);lo=allv.min((0,1));hi=allv.max((0,1));offset=np.array([x-(lo[0]+hi[0])/2,51.84-lo[1]+.04,z-(lo[2]+hi[2])/2])
  for p,a,pos in pieces:
   world_origin=rotation@F@pos*scale+offset; source_origin=F@(world_origin/scale+center); source_matrix=F@rotation@F@a
   new=[*source_origin,*source_matrix.reshape(-1)];replacement[p['index']]='1 '+str(p['color'])+' '+' '.join(f'{n:.8f}' for n in new)+' '+p['ref'];changes.append(dict(kind=label,index=p['index'],ref=p['ref'],original=p['transform'],adapted=new))
 # Tile bottom seats on the crate rim at source y=-60; its top is world y=51.84.
 caps=['0 STEP','0 Authored playable produce surfaces: native Tile 2 x 2, no structural certification']
 for z in [0,-40,-80]:caps.append(f'1 19 120 -68 {z} 1 0 0 0 1 0 0 0 1 3068b.dat')
 removed=[p for p in ps if p['ref'] in {'33085.dat','33125.dat','33172.dat','33183.dat'} and p['index'] not in replacement]
 remove_indices={p['index'] for p in removed}
 count=0;out=[]
 for line in lines:
  if line.startswith('1 '):
   count+=1
   if count in remove_indices:continue
  out.append(replacement.get(count,line) if line.startswith('1 ') else line)
 # The parser omits NOFILE section boundaries; retain a safe insertion point anyway.
 out=[l for l in out if l.strip()!='0 NOFILE']+caps
 sec[ground]=out
 return dict(placements=changes,removedDecorativeDuplicates=removed,addedSurfaces=caps,reason='Accessible, isolated native produce on tile caps; donor retained unchanged',structuralValidation='not calculated')
