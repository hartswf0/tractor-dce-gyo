from pathlib import Path
import re
import numpy as np
ROOT=Path(__file__).parent/"ldraw"
COL={16:'#a6b4b9',24:'#263238'}
for l in (ROOT/'LDConfig.ldr').read_text().splitlines():
 m=re.search(r'CODE\s+(\d+)\s+VALUE\s+(#[0-9A-Fa-f]{6})',l)
 if m:COL[int(m[1])]=m[2]
cache={}
def geometry(key,sec,color=16,chain=()):
 key=key.lower().replace('\\','/')
 if key in chain:raise ValueError('cycle '+key)
 ck=(id(sec),key,color)
 if ck in cache:return cache[ck]
 if key in sec:lines=sec[key]
 else:
  f=next((ROOT/p for p in [key,'parts/'+key,'p/'+key] if (ROOT/p).exists()),None)
  if f is None:raise FileNotFoundError(key)
  lines=f.read_text(errors='replace').splitlines()
 faces=[];colors=[]
 for l in lines:
  t=l.strip().split(None,14)
  if not t or t[0] not in ['1','3','4']:continue
  c=int(t[1]);c=color if c==16 else c
  if t[0]=='1':
   if len(t)!=15:raise ValueError(l)
   v=np.array([float(x) for x in t[2:14]]);a=v[3:].reshape(3,3);pos=v[:3]
   ff,cc=geometry(t[14],sec,c,chain+(key,))
   if len(ff):faces.append(ff@a.T+pos);colors.extend(cc)
  else:
   raw=l.split();v=np.array([float(x) for x in raw[2:]]).reshape(-1,3)
   tri=[v[:3]] if t[0]=='3' else [v[[0,1,2]],v[[0,2,3]]]
   faces.append(np.array(tri));colors.extend([c]*len(tri))
 arr=np.concatenate(faces) if faces else np.zeros((0,3,3));cache[ck]=(arr,colors);return arr,colors
