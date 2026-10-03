#!/usr/bin/env python3
"""tools/making/takes_from_git.py — build films/odyssey/takes/ from git history: every superseded version of a
<scene>-performed.mp4 (git cat-file of its blob, so the repository does not grow), its poster (a frame at a third), its .vtt and
.json from the same commit, and films/odyssey/takes/index.json with each take's plain-language summary (takes-plain.json) and
the earlier stages (stages.json: animatic, cut, acted, performed, re-shot). Idempotent; never touches a published film.
    python3 tools/making/takes_from_git.py"""
import subprocess, json, re, os, collections, imageio_ffmpeg
R=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')); os.chdir(R)
HERE=os.path.join(R,'tools','making')
FF=imageio_ffmpeg.get_ffmpeg_exe()
g=lambda *a: subprocess.check_output(['git',*a],text=True)
def gb(*a): return subprocess.check_output(['git',*a])
# scene names from the camera page
cam=open('odyssey/perform/camera.html').read()
NAMES={}
for m in re.finditer(r"\{ id: '(OD-B\d\d-S\d\d)', name: (?:'((?:[^'\\]|\\.)*)'|\"([^\"]*)\")",cam):
    NAMES.setdefault(m.group(1),(m.group(2) or m.group(3)).replace("\\'","'"))
out=g('log','--raw','--no-abbrev','--format=C %H %cI','--','films/odyssey/*-performed.mp4')
hist=collections.defaultdict(list);c=None
for l in out.splitlines():
    if l.startswith('C '): c=l.split()[1:]
    elif l.startswith(':'):
        p=l.split(); blob=p[3]; path=p[5]
        if blob!='0'*40: hist[path].append((c[0],c[1],blob))
PLAIN=json.load(open(os.path.join(HERE,'takes-plain.json')))
def dur(f):
    e=subprocess.run([FF,'-i',f],capture_output=True,text=True).stderr
    h,m,s=re.search(r'Duration: (\d+):(\d+):([\d.]+)',e).groups(); return round(int(h)*3600+int(m)*60+float(s),1)
def shotsof(js):
    if not js: return None
    c=((js.get('take') or {}).get('cine') or {}).get('shots')
    if c: return {'n':len(c),'legal':sum(1 for s in c if s.get('legal'))}
    return {'n':len(js.get('shots') or []),'legal':None}
def blobat(commit,path):
    try: return gb('show',f'{commit}:{path}')
    except subprocess.CalledProcessError: return None
idx={'schema':'odyssey-takes/1','about':'Every take of every re-shot Odyssey film, oldest first. The last take of a scene is the published films/odyssey/<scene>-performed.mp4; the earlier ones are kept here (a re-shoot never overwrites). Built from git history by the making-of tools.','policy':'A re-shoot never overwrites: before a new cut (-r2) is renamed over <scene>-performed.*, the current film moves to films/odyssey/takes/<scene>/take<N>.* (mp4, jpg poster, vtt, json) and gets its entry in this file.','camera':'../../odyssey/perform/camera.html','scenes':[]}
for path,v in sorted(hist.items()):
    if len(v)<2: continue
    v=list(reversed(v)); sid=path.split('/')[-1][:10]; base=path[:-4]
    d=f'films/odyssey/takes/{sid}'; os.makedirs(d,exist_ok=True)
    P=PLAIN.get(sid,{}); takes=[]
    for n,(com,date,blob) in enumerate(v,1):
        last=n==len(v)
        msg=g('log','-1','--format=%s',com).strip()
        js=blobat(com,base+'.json'); js=json.loads(js) if js else None
        if last:
            file=f'films/odyssey/{sid}-performed.mp4'; poster=f'films/odyssey/{sid}-performed.jpg'
            vtt=f'films/odyssey/{sid}-performed.vtt' if os.path.exists(f'films/odyssey/{sid}-performed.vtt') else None
            jf=f'films/odyssey/{sid}-performed.json'
        else:
            file=f'{d}/take{n}.mp4'
            if not os.path.exists(file): open(file,'wb').write(gb('cat-file','-p',blob))
            for ext in ('vtt','json'):
                b=blobat(com,base+'.'+ext)
                if b is not None: open(f'{d}/take{n}.{ext}','wb').write(b)
            vtt=f'{d}/take{n}.vtt' if os.path.exists(f'{d}/take{n}.vtt') else None
            jf=f'{d}/take{n}.json' if os.path.exists(f'{d}/take{n}.json') else None
            poster=f'{d}/take{n}.jpg'
        secs=dur(file)
        if not last and not os.path.exists(poster):
            subprocess.run([FF,'-v','error','-y','-ss',str(secs/3),'-i',file,'-frames:v','1','-q:v','3',poster],check=True)
        pl=(P.get('takes') or [{}]*len(v))[n-1] if n-1<len(P.get('takes',[])) else {}
        takes.append({'n':n,'file':os.path.relpath(file,'films/odyssey/takes'),'poster':os.path.relpath(poster,'films/odyssey/takes'),'vtt':vtt and os.path.relpath(vtt,'films/odyssey/takes'),'json':jf and os.path.relpath(jf,'films/odyssey/takes'),
          'published': last,'commit':com[:8],'date':date[:10],'seconds':secs,'shots':shotsof(js),'blob':blob[:12],
          'summary':pl.get('what',''),'next_changed':None if last else pl.get('next',''),'commit_message':msg})
    idx['scenes'].append({'scene':sid,'name':NAMES.get(sid,sid),'why':P.get('why',''),'takes':takes})
idx['scenes'].sort(key=lambda s:s['scene'])
idx['stages']=json.load(open(os.path.join(HERE,'stages.json')))
for ch in idx['stages']:
    for st in ch['steps']:
        f='films/odyssey/'+st['file']
        com=g('log','--diff-filter=A','--format=%h %cs','--',f).strip().splitlines()[-1].split()
        st['commit'],st['date']=com[0],com[1]; st['seconds']=dur(f)
        st['file']='../'+st['file']; st['poster']=st['file'][:-4]+'.jpg'
        js=json.load(open(f[:-4]+'.json')) if os.path.exists(f[:-4]+'.json') else None; st['shots']=shotsof(js)
json.dump(idx,open('films/odyssey/takes/index.json','w'),indent=1,ensure_ascii=False)
print(sum(len(s['takes']) for s in idx['scenes']),'takes in',len(idx['scenes']),'scenes')
