#!/usr/bin/env python3
"""tools/perform/keeptake.py — publish a re-shot film without losing the take it replaces.

    python3 tools/perform/keeptake.py OD-B11-S07 [r2] ["what the new take changed"] ["what the new take is"]

A re-shoot never overwrites. The published films/odyssey/<scene>-performed.{mp4,jpg,vtt,json} moves to
films/odyssey/takes/<scene>/take<N>.* (N = its place among the scene's takes, oldest = take1), its entry in
films/odyssey/takes/index.json is marked superseded and given what the next take changed, and only then is the new cut
(<scene>-performed-r2.*) renamed over <scene>-performed.* and listed as the published take. The making-of page
(odyssey/making/index.html) reads index.json, so the new pair shows there with no other edit."""
import json, os, re, shutil, subprocess, sys, datetime
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
F = os.path.join(R, 'films', 'odyssey'); T = os.path.join(F, 'takes'); IDX = os.path.join(T, 'index.json')

def secs(mp4):
    try:
        import imageio_ffmpeg
        e = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-i', mp4], capture_output=True, text=True).stderr
        h, m, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', e).groups(); return round(int(h) * 3600 + int(m) * 60 + float(s), 1)
    except Exception: return None

def shots(jf):
    try: js = json.load(open(jf))
    except Exception: return None
    c = ((js.get('take') or {}).get('cine') or {}).get('shots')
    return {'n': len(c), 'legal': sum(1 for s in c if s.get('legal'))} if c else {'n': len(js.get('shots') or []), 'legal': None}

def main():
    sid = sys.argv[1]; suf = sys.argv[2] if len(sys.argv) > 2 else 'r2'
    changed = sys.argv[3] if len(sys.argv) > 3 else ''; what = sys.argv[4] if len(sys.argv) > 4 else ''
    cur, new = os.path.join(F, sid + '-performed'), os.path.join(F, f'{sid}-performed-{suf}')
    if not os.path.exists(new + '.mp4'): sys.exit(f'no {new}.mp4')
    idx = json.load(open(IDX)) if os.path.exists(IDX) else {'schema': 'odyssey-takes/1', 'scenes': [], 'stages': []}
    sc = next((s for s in idx['scenes'] if s['scene'] == sid), None)
    if sc is None:
        sc = {'scene': sid, 'name': sid, 'why': '', 'takes': []}; idx['scenes'].append(sc); idx['scenes'].sort(key=lambda s: s['scene'])
    today = datetime.date.today().isoformat()
    if os.path.exists(cur + '.mp4'):
        pub = next((t for t in sc['takes'] if t.get('published')), None)
        n = pub['n'] if pub else len(sc['takes']) + 1
        os.makedirs(os.path.join(T, sid), exist_ok=True)
        dst = os.path.join(T, sid, f'take{n}')
        if os.path.exists(dst + '.mp4'): sys.exit(f'{dst}.mp4 exists; refusing to overwrite a kept take')
        for ext in ('mp4', 'jpg', 'vtt', 'json'):
            if os.path.exists(cur + '.' + ext): shutil.move(cur + '.' + ext, dst + '.' + ext)
        rel = lambda p: os.path.relpath(p, T)
        ent = pub or {'n': n, 'date': today, 'summary': '', 'commit_message': ''}
        ent.update({'file': rel(dst + '.mp4'), 'poster': rel(dst + '.jpg'), 'vtt': rel(dst + '.vtt') if os.path.exists(dst + '.vtt') else None,
                    'json': rel(dst + '.json') if os.path.exists(dst + '.json') else None, 'published': False, 'next_changed': changed,
                    'seconds': ent.get('seconds') or secs(dst + '.mp4'), 'shots': ent.get('shots') or shots(dst + '.json')})
        if not pub: sc['takes'].append(ent)
    for ext in ('mp4', 'jpg', 'vtt', 'json'):
        if os.path.exists(new + '.' + ext): shutil.move(new + '.' + ext, cur + '.' + ext)
    rel = lambda p: os.path.relpath(p, T)
    sc['takes'].append({'n': len(sc['takes']) + 1, 'file': rel(cur + '.mp4'), 'poster': rel(cur + '.jpg'), 'vtt': rel(cur + '.vtt') if os.path.exists(cur + '.vtt') else None,
                        'json': rel(cur + '.json'), 'published': True, 'commit': None, 'date': today, 'seconds': secs(cur + '.mp4'), 'shots': shots(cur + '.json'),
                        'summary': what, 'next_changed': None, 'commit_message': ''})
    json.dump(idx, open(IDX, 'w'), indent=1, ensure_ascii=False)
    print(f'{sid}: take{len(sc["takes"]) - 1} kept in films/odyssey/takes/{sid}/, take{len(sc["takes"])} published')

if __name__ == '__main__': main()
