from pathlib import Path
import json,base64,numpy as np
from catalogue import parse,closure,placements
import geometry_compiler as G
R=Path(__file__).parent;sec=parse((R/'donors/10185.mpd').read_text(),'x');key='10185 - ground floor - minifig 2 with baby buggy.ldr'
# Preserve the authored carriage, handle and folding hood, omit only the donor adult.
sec['film-buggy.ldr']=['0 FILE film-buggy.ldr','0 Open performance buggy adapted from Max Martin Richter / Green Grocer 10185']+[l for l in sec[key] if not l.startswith('0 FILE ') and not ('10185 - Minifig 2.ldr' in l) and 'Baby Buggy - Folding Top.ldr' not in l]
assets={}
for name,root,col in [('buggy','film-buggy.ldr',71),('apple','33051.dat',4)]:
 G.cache.clear();f,c=G.geometry(root,sec,col);f=f*np.array([1,-1,-1]);lo=f.min((0,1));hi=f.max((0,1));origin=np.array([(lo[0]+hi[0])/2,lo[1],(lo[2]+hi[2])/2]);f-=origin
 rgb=np.array([[int(G.COL.get(n,'#a6b4b9')[k:k+2],16) for k in [1,3,5]] for n in c],dtype=np.uint8)
 assets[name]=dict(vertices=base64.b64encode(f.astype('<f4').tobytes()).decode(),colors=base64.b64encode(rgb.tobytes()).decode(),bounds=[(lo-origin).tolist(),(hi-origin).tolist()],source=root,triangles=len(f))
(R/'production/performance-assets.json').write_text(json.dumps(assets,separators=(',',':')))
native='\n'.join('\n'.join(l for l in sec[k] if l.strip()!='0 NOFILE') for k in closure(sec,'film-buggy.ldr'))+'\n0 NOFILE\n'
(R/'production/Film-Butter-Buggy.mpd').write_text(native)
print({k:{'triangles':v['triangles'],'bounds':v['bounds']} for k,v in assets.items()})
