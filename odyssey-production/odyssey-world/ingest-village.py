from pathlib import Path
import re,json,hashlib
R=Path('outputs/odyssey-pipeline/odyssey-world');txt=(R/'21343-viking-village.mpd').read_text();parts=re.split(r'(?m)^0 FILE ',txt)[1:];files={p.splitlines()[0].lower(): '0 FILE '+p for p in parts};rows=[]
# Canonicalize prefixed subpart references to embedded FILE names.
for k,t in list(files.items()):
 lines=[]
 for l in t.splitlines():
  a=l.split(maxsplit=14)
  if len(a)==15 and a[0]=='1':
   ref=a[14].lower().replace('\\','/');base=ref.rsplit('/',1)[-1]
   if ref not in files and base in files:a[14]=base;l=' '.join(a)
  lines.append(l)
 files[k]='\n'.join(lines)+'\n'

for key,t in files.items():
 refs=[a[14]for l in t.splitlines()if len(a:=l.split(maxsplit=14))==15 and a[0]=='1'];rows.append(dict(name=key,instances=len(refs),submodels=[r for r in refs if r.lower()in files]))
for name in ['pinetree','pinetree2','GreatHallPillar','throne','forgewall','GreatHallDoor1','GreatHallDoor2','GreatHallBackWall','barrels','bridgeplank']:
 key=('21343 - '+name+'.ldr').lower();seen=[]
 def add(k):
  if k in seen:return
  seen.append(k)
  for l in files[k].splitlines():
   a=l.split(maxsplit=14)
   if len(a)==15 and a[0]=='1' and a[14].lower()in files:add(a[14].lower())
 add(key);out='\n'.join(files[k]for k in seen);
 # Give every embedded subfile a slash-free cache key for this loader.
 aliases={k.replace('\\','/'): 'donor21343-'+str(i)+Path(k).suffix for i,k in enumerate(files)}
 ls=[]
 for l in out.splitlines():
  if l.startswith('0 FILE '):l='0 FILE '+aliases[l[7:].lower().replace('\\','/')]
  else:
   a=l.split(maxsplit=14)
   if len(a)==15 and a[0]=='1':
    ref=a[14].lower().replace('\\','/')
    if ref in aliases:a[14]=aliases[ref];l=' '.join(a)
  ls.append(l)
  if l.startswith('0 FILE ') and l.endswith('.ldr'):ls.append('0 !LDRAW_ORG Unofficial_Model')
 out='\n'.join(ls)+'\n';(R/(name+'.mpd')).write_text(out)
 target=Path('work/native/odyssey-donors')/(name+'.mpd');target.parent.mkdir(exist_ok=True);target.write_text(out)
(R/'donor-index.json').write_text(json.dumps({'source':'https://brickshelf.com/gallery/Philo/SetModels/Set21343/21343_-_viking_village.mpd','author':'Philippe Hurbain [Philo]','license':'Source declares CC BY 2.0 and CC BY 4.0; https://creativecommons.org/licenses/by/4.0/','changes':'Extracted named submodels, original geometry and headers retained','sha256':hashlib.sha256((R/'21343-viking-village.mpd').read_bytes()).hexdigest(),'subfiles':rows},indent=2));print(len(files),'subfiles indexed')
