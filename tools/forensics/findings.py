"""tools/forensics/findings.py: the raw numbers of the forensic report (odyssey/forensics/findings.json).

  SCRATCH=<dir> python3 tools/forensics/findings.py   (after tools/forensics/manifest.py; see the Method section of
  odyssey/forensics/index.html for the commands that write <dir>/fx/*)
"""
import json, os, re, subprocess, glob, collections
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import sys
S=os.environ.get('SCRATCH') or sys.argv[1]   # the directory holding render-*.log and fx/ (objects.txt, raw.txt, links.json, camera-check.json, takes-verify.json)
FX=S+'/fx'
def g(*a): return subprocess.run(['git',*a],capture_output=True,text=True).stdout.strip()
B='origin/claude/odyssey-lego-ldraw-game-ahw23j'
F={}
F['generated_at_commit']=g('rev-parse',B)
# custody
br={}
for b in ['origin/main','origin/gh-pages',B]:
    br[b]=dict(tip=g('rev-parse','--short',b),commits=int(g('rev-list','--count',b)),last=g('log','-1','--format=%cI',b),
              first=g('log','--reverse','--format=%h %cI %an',b).splitlines()[0], roots=g('rev-list','--max-parents=0',b).split())
F['branches']=br
F['branch_equals_main']=g('rev-parse',B)==g('rev-parse','origin/main')
F['gh_pages_ahead_of_main']=int(g('rev-list','--count','origin/main..origin/gh-pages'))
F['main_ahead_of_gh_pages']=int(g('rev-list','--count','origin/gh-pages..origin/main'))
F['gh_pages_merges_from_main']=len(g('log','origin/gh-pages','--merges','--grep=origin/main','--format=%h').splitlines())
F['remote_branches']=len([l for l in g('branch','-r').splitlines() if '->' not in l])
F['all_refs_commits']=int(g('rev-list','--count','--all'))
# authorship
log=g('log',B,'--format=%H%x1f%an%x1f%cI%x1f%P%x1f%B%x1e')
recs=[r.strip('\n') for r in log.split('\x1e') if r.strip()]
per_day=collections.OrderedDict(); auth=collections.Counter(); tr=0; wip=0; wipday=collections.Counter(); merges=0; sessions=collections.Counter(); human=0
for r in recs:
    h,an,ci,par,body=r.split('\x1f',4); d=ci[:10]
    per_day.setdefault(d,collections.Counter())
    auth[an]+=1; per_day[d][an]+=1
    if len(par.split())>1: merges+=1
    if 'Co-Authored-By: Claude' in body: tr+=1
    m=re.search(r'Claude-Session: (\S+)',body)
    if m: sessions[m[1]]+=1
    if body.startswith('Work in progress'): wip+=1; wipday[d]+=1
F['authorship']=dict(commits=len(recs),by_author=dict(auth),merges=merges,with_claude_trailers=tr,without_trailers=len(recs)-tr,
    claude_named_without_trailer=auth['Claude']-tr, human_named=auth['Watson Hartsoe']+auth['Loom Mason'],
    sessions=dict(sessions),work_in_progress=wip,wip_by_day=dict(sorted(wipday.items())),
    container_restart_commits=g('log',B,'-i','--grep=container restart','--format=%h').split(),
    builder_still_running_commits=len(g('log',B,'-i','--grep=still running','--format=%h').splitlines()),
    not_yet_reviewed_commits=len(g('log',B,'-i','--grep=not yet reviewed','--format=%h').splitlines()))
F['commits_per_day']={d:dict(c) for d,c in sorted(per_day.items())}
# size
cov=dict(l.split(': ') for l in g('count-objects','-vH').splitlines())
F['git_store']=dict(du_git=subprocess.run(['du','-sh','.git'],capture_output=True,text=True).stdout.split()[0],count_objects=cov)
size={}; blobs=0; tot=0; bundle=[]
for l in open(FX+'/objects.txt'):
    p=l.rstrip('\n').split(' ',4)
    if p[0]=='blob':
        size[p[1]]=int(p[2]); blobs+=1; tot+=int(p[2])
        if len(p)>4 and p[4].endswith('Film-Butter-Odyssey.html.gz'): bundle.append(int(p[2]))
F['objects_all_refs']=dict(blobs=blobs,blob_bytes=tot,bundle_versions=len(bundle),bundle_bytes=sum(bundle),bundle_max=max(bundle))
top=sorted(((int(l.split()[2]),l.split()[1],l.rstrip('\n').split(' ',4)[4] if len(l.split())>4 else '') for l in open(FX+'/objects.txt') if l.startswith('blob')),reverse=True)
F['largest_blobs']=[dict(bytes=s,blob=b[:12],path=p) for s,b,p in top[:15]]
# growth per day (new blobs first seen on branch history)
seen=set(); day=collections.OrderedDict(); cur=None
for l in open(FX+'/raw.txt'):
    if l.startswith('C '): cur=l.split()[2]; day.setdefault(cur,[0,0])
    elif l.startswith(':'):
        f=l.split(None,5); b=f[3]; path=f[5].strip() if len(f)>5 else ''
        if b!='0'*40 and b not in seen:
            seen.add(b); s=size.get(b,0); day[cur][0]+=s
            if path.endswith('Film-Butter-Odyssey.html.gz'): day[cur][1]+=s
c=0; grow=[]
for d in sorted(day):
    c+=day[d][0]; grow.append(dict(day=d,new_bytes=day[d][0],bundle_bytes=day[d][1],cumulative=c))
F['growth']=grow
bv=[]
for line in g('log',B,'--format=%h %cI','--','film-readymades/production/Film-Butter-Odyssey.html.gz').splitlines():
    h,t=line.split(); s=g('cat-file','-s',h+':film-readymades/production/Film-Butter-Odyssey.html.gz')
    bv.append(dict(commit=h,at=t,bytes=int(s) if s else None))
F['bundle_history']=bv
F['bundle_after_split']=[x for x in bv if x['at']>'2026-10-03T04:37']
geo=g('ls-tree','-r','-l','HEAD','film-readymades/production/geo/').splitlines()
F['geo_split']=dict(commit='feb5f60e',files=len(geo),bytes=sum(int(l.split()[3]) for l in geo))
# inventory
lt=g('ls-tree','-r','-l','HEAD').splitlines(); ext=collections.Counter(); exb=collections.Counter(); n=0; tb=0
for l in lt:
    m,t,h,s,p=l.split(None,4)
    if t!='blob': continue
    n+=1; s=int(s) if s!='-' else 0; tb+=s
    e=os.path.splitext(p)[1].lower() or '(none)'; ext[e]+=1; exb[e]+=s
F['tree']=dict(files=n,bytes=tb,by_ext=[dict(ext=e,files=ext[e],bytes=exb[e]) for e,_ in exb.most_common(20)])
top_dirs=collections.Counter()
for l in lt:
    m,t,h,s,p=l.split(None,4)
    if t=='blob': top_dirs[p.split('/')[0] if '/' in p else '(root)']+=int(s) if s!='-' else 0
F['tree_by_top_dir']=[dict(dir=d,bytes=b) for d,b in top_dirs.most_common(15)]
# ldraw
F['ldraw']=dict(parts_dat=len(glob.glob('ldraw/parts/*.dat')),subparts=len(glob.glob('ldraw/parts/s/*')),primitives=len(glob.glob('ldraw/p/*.dat')),
    p8=len(glob.glob('ldraw/p/8/*')),p48=len(glob.glob('ldraw/p/48/*')),licence_files=['ldraw/CAreadme.txt','ldraw/CAlicense.txt','ldraw/CAlicense4.txt'],
    licence='LDraw.org Parts Library: CC BY 2.0 and CC BY 4.0 per the Contributor Agreement (ldraw/CAreadme.txt); model headers say "Redistributable under CCAL version 2.0"',
    film_readymades_ldraw=dict(parts=len(glob.glob('film-readymades/ldraw/parts/**/*.dat',recursive=True)),prims=len(glob.glob('film-readymades/ldraw/p/**/*.dat',recursive=True))))
# cards
types=collections.Counter(); status=collections.Counter(); authors=collections.Counter(); pieces=0
for f in glob.glob('odyssey/cards/*.mpd'):
    s=open(f,errors='replace').read()
    m=re.search(r'"type":"(\w+)"',s); types[m[1] if m else '(no FORAGE line)']+=1
    m=re.search(r'"status":"(\w+)"',s); status[m[1] if m else '(none)']+=1
    m=re.search(r'!FORAGE \{"id":"[^"]*","type":"[^"]*","pieces":(\d+)',s)
    if m: pieces+=int(m[1])
    for a in re.findall(r'^0 Author: (.*)$',s,re.M): authors[a.strip()]+=1
staged=sorted(os.path.basename(f)[:-5] for f in glob.glob('odyssey/keyframes/OD-*.json'))
films=sorted(set(re.sub(r'-(performed|acted|cut).*','',os.path.basename(f)[:-4]) for f in glob.glob('films/odyssey/OD-*.mp4')))
perf=sorted(os.path.basename(f)[:-14] for f in glob.glob('films/odyssey/OD-*-performed.mp4'))
F['cards']=dict(mpd=len(glob.glob('odyssey/cards/*.mpd')),types=dict(types),status=dict(status),pieces_declared=pieces,
    author_lines_top=authors.most_common(12),scene_cards=types['scene'],staged_keyframes=len(staged),staged=staged,
    filmed_scenes=len(films),performed_scenes=len(perf),staged_not_performed=sorted(set(staged)-set(perf)))
# films (from manifest)
M=json.load(open('odyssey/forensics/manifest.json'))
pub=[r for r in M['files'] if r['kind']=='published']; tk=[r for r in M['files'] if r['kind']=='take']
pf=[r for r in pub if r['path'].endswith('-performed.mp4')]
F['films']=dict(published_mp4=len(pub),published_bytes=sum(r['bytes'] for r in pub),published_seconds=round(sum(r['duration_s'] for r in pub),2),
    performed=len(pf),performed_seconds=round(sum(r['duration_s'] for r in pf),2),performed_bytes=sum(r['bytes'] for r in pf),
    takes=len(tk),takes_seconds=round(sum(r['duration_s'] for r in tk),2),takes_bytes=sum(r['bytes'] for r in tk),
    fps=dict(collections.Counter(str(r['fps']) for r in pub)),sizes=dict(collections.Counter(r['size'] for r in pub)),
    duration_json_mismatch=[r['path'] for r in pub if r['json_seconds'] and abs(r['json_seconds']-r['duration_s'])>0.15],
    shots=sum(r['shots'] or 0 for r in pf),shots_legal=sum(r['shots_legal'] or 0 for r in pf),
    films_with_illegal_shots=[(r['path'],r['shots'],r['shots_legal']) for r in pub if r['shots'] and r['shots']!=r['shots_legal']])
F['films']['dir_bytes_on_disk']=int(subprocess.run(['du','-sb','films/odyssey'],capture_output=True,text=True).stdout.split()[0])
# takes verify
F['takes_verify']=json.load(open(FX+'/takes-verify.json'))
# voices
FF=M['ffmpeg']
def dur(p):
    e=subprocess.run([FF,'-hide_banner','-i',p],capture_output=True,text=True).stderr
    m=re.search(r'Duration: (\d+):(\d+):([\d.]+)',e); return int(m[1])*3600+int(m[2])*60+float(m[3]) if m else 0
vv=glob.glob('odyssey/take/voice/*.m4a'); aa=glob.glob('odyssey/take/added/*.m4a'); bb=glob.glob('odyssey/take/bed/*.ogg')
F['voices']=dict(scene_recordings=len(vv),seconds=round(sum(dur(p) for p in vv),1),bytes=sum(os.path.getsize(p) for p in vv),
    added_synthetic=len(aa),added_seconds=round(sum(dur(p) for p in aa),1),added_files=sorted(aa),
    beds=len(bb),bed_seconds=round(sum(dur(p) for p in bb),1),bed_bytes=sum(os.path.getsize(p) for p in bb),
    halfworld_tts='Gemini TTS, model gemini-3.1-flash-tts-preview (/home/user/odyssey-halfworld/harness/build-drive-audio.mjs lines 1-22; repo hartswf0/odyssey-halfworld)',
    added_tts='Kokoro-82M via kokoro-js q8 ONNX, offline (odyssey/kits/cut-restore.json rules[2])',
    making_of_tts='Kokoro-82M via kokoro_onnx, voice af_heart at 0.95 (tools/making/making_of.py lines 4-19, 135-138)',
    music='BRONZE COUNCIL / HOMECOMING / TITANS DESCENT albums, files suffixed "- Treblo" (odyssey-halfworld audio/albums.json, built 2026-07-24); prompts in audio/promptbook.md; generator and licence not stated anywhere found')
# tools
def lc(paths):
    fs=[p for p in g('ls-files',*paths).splitlines() if re.search(r'\.(js|py|cjs|mjs)$',p)]
    return dict(files=len(fs),lines=sum(sum(1 for _ in open(p,errors='replace')) for p in fs))
F['tools']={k:lc([k]) for k in ['tools/perform','tools/cinematographer','film-readymades','tools/forage','tools/making']}
for f in ['tools/odyssey-forage.js','tools/export-odyssey.js','film-readymades/geometry_compiler.py','film-readymades/geo_split.py','film-readymades/build_odyssey.py','film-readymades/odyssey_take.py','tools/perform/keeptake.py','tools/making/making_of.py']:
    F['tools'][f]=dict(lines=sum(1 for _ in open(f)))
# compute
R=[]
for f in sorted(glob.glob(S+'/render-*.log')):
    s=open(f).read(); name=os.path.basename(f)
    d=re.search(r'done: (\S+) ([\d.]+) MB, ([\d.]+) s at (\d+) fps, in ([\d.]+) min',s)
    v=re.findall(r'video (\d+) frames \((\d+) drawn now, (\d+) kept\)',s)
    sol=re.search(r'solved in ([\d.]+) s',s)
    lastf=re.findall(r'frame (\d+) of (\d+)',s)
    secs=re.findall(r'^\s*(\d+)s ',s,re.M)
    err=re.search(r'page.evaluate: (.*)',s)
    r=dict(log=name,out=d[1] if d else None,mb=float(d[2]) if d else None,film_s=float(d[3]) if d else None,fps=int(d[4]) if d else None,
       wall_min=float(d[5]) if d else (int(secs[-1])/60 if secs else 0),frames=int(v[-1][0]) if v else None,drawn=int(v[-1][1]) if v else (int(lastf[-1][0]) if lastf else 0),
       kept=int(v[-1][2]) if v else 0,solver_s=float(sol[1]) if sol else None,completed=bool(d),error=err[1] if err else None,mtime=os.path.getmtime(f))
    pre = (r['solver_s'] or 0)
    r['s_per_frame']=round((r['wall_min']*60-pre)/r['drawn'],2) if r['drawn'] else None
    R.append(r)
done=[r for r in R if r['completed']]
F['compute']=dict(machine=dict(nproc=os.cpu_count(),mem=subprocess.run(['free','-g'],capture_output=True,text=True).stdout.split('\n')[1].split()[1]+' GiB',
      gl='SwiftShader software GL in headless Chromium (tools/export-odyssey.js line 74)',disk=subprocess.run(['df','-h','/home/user'],capture_output=True,text=True).stdout.split('\n')[1]),
    logs=len(R),completed=len(done),incomplete=[r['log'] for r in R if not r['completed']],
    wall_hours_all=round(sum(r['wall_min'] for r in R)/60,2),wall_hours_completed=round(sum(r['wall_min'] for r in done)/60,2),
    frames_drawn=sum(r['drawn'] for r in R),frames_kept_resumed=sum(r['kept'] for r in R),
    solver_hours=round(sum(r['solver_s'] or 0 for r in R)/3600,2),
    median_s_per_frame=sorted(r['s_per_frame'] for r in done if r['s_per_frame'])[len(done)//2],
    max_wall=max(done,key=lambda r:r['wall_min'])['log'],first_log=min(r['mtime'] for r in R),last_log=max(r['mtime'] for r in R),runs=R)
# links
F['links']=json.load(open(FX+'/links.json'))
F['camera_check']=json.load(open(FX+'/camera-check.json'))
F['exclude']=[l for l in open('.git/info/exclude').read().splitlines() if l and not l.startswith('#')]
F['index_html_nul_bytes']=open('index.html','rb').read().count(b'\x00')

# cross-checks
import hashlib
HW = os.environ.get('HALFWORLD', '/home/user/odyssey-halfworld')
same = []; diff = []; nosrc = []
for f in sorted(glob.glob('odyssey/take/voice/*.m4a')):
    h = os.path.join(HW, 'drive/voice', os.path.basename(f))
    if not os.path.exists(h): nosrc.append(f); continue
    (same if hashlib.sha256(open(f,'rb').read()).hexdigest() == hashlib.sha256(open(h,'rb').read()).hexdigest() else diff).append(f)
F['voices'].update(identical_to_halfworld=len(same), differ_from_halfworld=diff, no_halfworld_source=nosrc,
    halfworld_head=subprocess.run(['git','-C',HW,'log','-1','--format=%h %cI'],capture_output=True,text=True).stdout.strip(),
    halfworld_voice_commit=subprocess.run(['git','-C',HW,'log','-1','--format=%h %cI %an','--','drive/voice-manifest.json'],capture_output=True,text=True).stdout.strip())
kb = [f for f in glob.glob('odyssey/keyframes/OD-*.json') if 'Samuel Butler' in open(f).read()]
F['text'] = dict(keyframes_citing_butler=len(kb), keyframes=len(glob.glob('odyssey/keyframes/OD-*.json')),
    not_citing=sorted(set(glob.glob('odyssey/keyframes/OD-*.json')) - set(kb)), citation='"Homer, Odyssey <book>, tr. Samuel Butler (public domain)"')
FJ = json.load(open('odyssey/forage.json')); fc = FJ['cards']; fc = fc if isinstance(fc, list) else list(fc.values())
md = open('odyssey/FORAGE.md').read()
m = re.search(r'\*\*([\d,]+) cards\*\*.*?\*\*([\d,]+) pieces\*\*.*?(\d+) green, (\d+) yellow', md)
F['forage_indexes'] = dict(FORAGE_md=dict(cards=m[1], pieces=m[2], green=int(m[3]), yellow=int(m[4]), last_commit=g('log','-1','--format=%h %cI','--','odyssey/FORAGE.md')),
    forage_json=dict(cards=len(fc), green=sum(1 for c in fc if c.get('status')=='GREEN'), yellow=sum(1 for c in fc if c.get('status')=='YELLOW'),
                     pieces=sum(c.get('pieces',0) for c in fc), last_commit=g('log','-1','--format=%h %cI','--','odyssey/forage.json')),
    cards_dir=dict(files=F['cards']['mpd'], green=F['cards']['status'].get('GREEN'), yellow=F['cards']['status'].get('YELLOW'), no_status=F['cards']['status'].get('(none)')))
F['camera_notes'] = dict(scenes=len(F['camera_check']), still_wrong=sum(1 for c in F['camera_check'] if c['still_wrong']),
    missing_film=[c['after'] for c in F['camera_check'] if not c['file']],
    note_vs_json=[c for c in F['camera_check'] if c['note_legal'] is not None and c['note_legal'] != c['json_legal']],
    known_faults=len(json.load(open('odyssey/perform/camera-wrong.json'))))
hum = g('log', B, '--format=%h %cI %an %s', '--author=Watson', '--author=Loom').splitlines()
F['authorship']['last_human_commit'] = hum[0][:160] if hum else None
F['authorship']['first_commit'] = g('log', B, '--reverse', '--format=%h %cI %an').splitlines()[0]
F['authorship']['last_commit'] = g('log', B, '-1', '--format=%h %cI %an')

json.dump(F,open('odyssey/forensics/findings.json','w'),indent=1)
print(json.dumps({k:F[k] for k in ['authorship','objects_all_refs','geo_split','cards','films','voices','tools']},indent=0)[:6000])
c=F['compute']; print({k:c[k] for k in c if k!='runs'})
