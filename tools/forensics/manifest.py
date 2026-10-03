"""tools/forensics/manifest.py: every published Odyssey film and kept take with sha256, bytes, duration (imageio-ffmpeg),
git blob, and the commit that introduced it. Writes odyssey/forensics/manifest.json and .csv. Read-only on the films.

  python3 tools/forensics/manifest.py
"""
import hashlib, json, os, re, subprocess, csv, glob
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
FF = subprocess.check_output(['python3','-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).decode().strip()
def git(*a): return subprocess.check_output(['git',*a]).decode().strip()
def dur(p):
    e = subprocess.run([FF,'-hide_banner','-i',p],capture_output=True,text=True).stderr
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)',e); v = re.search(r'Video: (\w+).*?, (\d+)x(\d+)',e); a = re.search(r'Audio: (\w+)',e)
    fps = re.search(r'([\d.]+) fps',e)
    return (round(int(m[1])*3600+int(m[2])*60+float(m[3]),2) if m else None, v[1] if v else None, f'{v[2]}x{v[3]}' if v else None, a[1] if a else None, float(fps[1]) if fps else None)
files = sorted(glob.glob('films/odyssey/*.mp4')) + sorted(glob.glob('films/odyssey/takes/*/*.mp4'))
rows = []
for p in files:
    b = open(p,'rb').read()
    sha = hashlib.sha256(b).hexdigest()
    blob_wt = git('hash-object',p)
    try: blob_head = git('rev-parse','HEAD:'+p)
    except Exception: blob_head = None
    adds = git('log','origin/main','--diff-filter=A','--format=%h %cI %an','--',p).splitlines()
    mods = git('log','origin/main','-1','--format=%h %cI','--',p).split()
    nver = len(git('log','origin/main','--format=%h','--',p).splitlines())
    d, vc, size, ac, fps = dur(p)
    jp = p[:-4]+'.json'; J = None
    try: J = json.load(open(jp))
    except Exception: pass
    shots = legal = None
    if J and J.get('take') and J['take'].get('cine'):
        sh = J['take']['cine'].get('shots') or []; shots = len(sh); legal = sum(1 for s in sh if s.get('legal'))
    first = adds[-1].split() if adds else [None,None,None]
    rows.append(dict(path=p, kind='take' if '/takes/' in p else 'published', bytes=len(b), sha256=sha, git_blob=blob_wt,
        blob_matches_HEAD=(blob_wt==blob_head), duration_s=d, json_seconds=(J or {}).get('seconds'), fps=fps, size=size,
        vcodec=vc, acodec=ac, shots=shots, shots_legal=legal, introduced_commit=first[0], introduced_at=first[1],
        introduced_by=' '.join(first[2:]) if first[2:] else None, last_commit=mods[0] if mods else None, last_at=mods[1] if len(mods)>1 else None, versions_in_history=nver))
    print(p, d, len(b), rows[-1]['blob_matches_HEAD'], first[0])
json.dump(dict(schema='forensics-manifest/1', generated_from=git('rev-parse','HEAD'), ffmpeg=FF, count=len(rows),
    total_bytes=sum(r['bytes'] for r in rows), total_seconds=round(sum(r['duration_s'] or 0 for r in rows),2), files=rows),
    open('odyssey/forensics/manifest.json','w'), indent=1)
with open('odyssey/forensics/manifest.csv','w',newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
