"""Freeze the last 24 hours of Word to World UI/code without duplicating the model library.
Run from the repository root. No existing application files are modified.
"""
import subprocess, json, re, datetime, hashlib, concurrent.futures
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'time-machine'
def git(*args): return subprocess.check_output(['git', *args], cwd=ROOT).decode()
head = git('rev-parse', 'HEAD').strip()
end = datetime.datetime.now(datetime.timezone.utc)
since = (end - datetime.timedelta(hours=24)).isoformat()
commits = git('rev-list', '--reverse', '--topo-order', '--since='+since, head).split()
first = git('rev-list', '--first-parent', '--since='+since, head).split()
baseline = git('rev-parse', first[-1]+'^1').strip()
commits = [baseline] + [s for s in commits if s != baseline]
runs = json.loads((OUT/'runs.json').read_text())
versions, blobs = [], {}
(OUT/'objects').mkdir(exist_ok=True)
(OUT/'snapshots').mkdir(exist_ok=True)
attr = re.compile(r'\b(src|href)=("|\')([^"\']+)\2', re.I)
for sha in commits:
    info = json.loads(git('show','-s','--format={"sha":"%H","date":"%cI","parents":"%P"}',sha))
    info['message'] = git('show','-s','--format=%s',sha).strip()
    info['baseline'] = sha == baseline
    info['mainline'] = sha in first or sha == baseline
    files = {}
    for line in git('ls-tree','-r',sha).splitlines():
        meta, path = line.split('\t',1)
        mode, kind, obj = meta.split()
        if kind == 'blob': files[path] = obj
    original = git('show',sha+':word-to-world.html')
    refs = []
    def replace(m):
        url = m[3]
        if urlsplit(url).scheme or url.startswith('//') or url.startswith('#'): return m[0]
        path = unquote(urlsplit(url).path).removeprefix('./')
        if not path.endswith(('.js','.css')): return m[0]
        if path not in files: raise RuntimeError(f'{sha[:7]} missing {path}')
        obj = files[path]; ext = Path(path).suffix
        blobs[obj] = {'path':path,'sha':obj,'ext':ext}
        refs.append({'path':path,'blob':obj})
        return f'{m[1]}={m[2]}time-machine/objects/{obj}{ext}{m[2]}'
    html = attr.sub(replace, original)
    info['files'] = refs
    info['signature'] = hashlib.sha256((original+json.dumps(refs)).encode()).hexdigest()
    info['changed'] = git('diff-tree','--no-commit-id','--name-only','-r',sha+'^1',sha).splitlines()
    info['changed'] = [p for p in info['changed'] if p=='word-to-world.html' or p.startswith('world/')]
    info['deployment'] = next((r for r in runs if r['sha']==sha),None)
    # Only the URL base and test isolation are added; historical application code is byte-for-byte.
    injected = '<base href="../../"><script src="time-machine/isolate.js" data-version="'+sha+'"></script>'
    html = re.sub(r'<head([^>]*)>',lambda m:m[0]+injected,html,count=1,flags=re.I)
    (OUT/'snapshots'/f'{sha}.html').write_text(html)
    versions.append(info)

def fetch_blob(item):
    sha, obj = item
    data = subprocess.check_output(['git','cat-file','blob',sha],cwd=ROOT)
    actual = hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
    assert actual == sha
    (OUT/'objects'/(sha+obj['ext'])).write_bytes(data)
    return len(data)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    size = sum(pool.map(fetch_blob,blobs.items()))
for v in versions:
    v['sameAs'] = next((x['sha'] for x in versions if x['sha']!=v['sha'] and x['signature']==v['signature']),None)
manifest = {'generated':end.isoformat(),'since':since,'head':head,'branch':'claude/platos-cave-ldraw-wzcr71','versions':versions,'codeBytes':size,'blobCount':len(blobs),
 'fidelity':'HTML and directly linked local scripts/styles are pinned to each commit. The shared LDraw/model library and external CDN/API services remain live. Test storage is isolated by revision and pane. Camera/mic need permission. No rollback is performed.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'versions':len(versions),'uniqueCodeBlobs':len(blobs),'bytes':size,'baseline':baseline}))
