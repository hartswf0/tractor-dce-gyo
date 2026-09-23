from pathlib import Path
import sys,json,math,gc
import numpy as np
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).parent
import geometry_compiler as G
from catalogue import parse
G.ROOT=R/'ldraw'
OUT=R/'previews';OUT.mkdir(exist_ok=True)
# Real LDraw triangle photography; no placeholder bricks are substituted.
def render(kit,key,out):
 sec=parse((R/'donors'/(kit+'.mpd')).read_text(),kit+'.ldr');key=key or next(iter(sec));G.cache.clear()
 f,c=G.geometry(key,sec)
 if not len(f):raise ValueError('No rendered geometry')
 lo=f.min((0,1));hi=f.max((0,1));f-=(lo+hi)/2
 basis=np.array([[.7071,0,.7071],[-.3313,-.8835,.3313],[.6247,-.4685,-.6247]])
 q=f@basis.T;xy=q[:,:,:2];bounds=xy.reshape(-1,2);scale=min(670/max(np.ptp(bounds[:,0]),1),470/max(np.ptp(bounds[:,1]),1));xy=(xy-(bounds.min(0)+bounds.max(0))/2)*scale;xy[:,:,0]+=370;xy[:,:,1]=275-xy[:,:,1]
 cross=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);norm=np.linalg.norm(cross,axis=1);light=.52+.48*np.abs(cross@np.array([.25,.6,.75]))/np.maximum(norm,1e-9)
 pixels=np.abs((xy[:,1,0]-xy[:,0,0])*(xy[:,2,1]-xy[:,0,1])-(xy[:,2,0]-xy[:,0,0])*(xy[:,1,1]-xy[:,0,1]))
 im=Image.new('RGB',(740,550),'#eeeae1');d=ImageDraw.Draw(im);d.ellipse((135,460,620,512),fill='#e2ded3')
 codes={cc:tuple(int(G.COL.get(cc,'#A6B4B9')[j:j+2],16) for j in [1,3,5]) for cc in set(c)}
 for i in np.argsort(q[:,:,2].mean(1)):
  if pixels[i]<.13:continue
  rgb=tuple(min(255,int(a*light[i])) for a in codes[c[i]]);d.polygon([tuple(p) for p in xy[i]],fill=rgb)
 im.save(out,quality=88)
 return dict(kit=kit,module=key,triangles=len(f),boundsLDU=[lo.tolist(),hi.tolist()],file=str(out.relative_to(R)),method='Native LDraw triangle projection; subpixel triangles omitted in preview only')
if __name__=='__main__':
 a=json.loads((R/'catalogue.json').read_text());wanted=['10185','6769','21318','10243','21325','6071','6080','6285','31048','7637','21309','10190','10218','10246']
 report=[]
 for kit in wanted:
  try:
   rr=render(kit,None,OUT/(kit+'.jpg'));report.append(rr);print(kit,rr['triangles'],'rendered',flush=True)
  except Exception as e:report.append({'kit':kit,'error':str(e)});print(kit,'FAILED',e,flush=True)
  G.cache.clear();gc.collect()
 (R/'render-report.json').write_text(json.dumps(report,indent=2))
