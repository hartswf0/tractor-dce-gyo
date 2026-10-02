"""The take: a Film Butter Odyssey scene joined to its recorded performance (the halfworld's voice, its script, its
direction) and to the Regulars' Cut, so the player can play the scene as film and tools/export-odyssey.js can render it.

For one scene id this reads, from the halfworld clone (read-only):
  drive/voice-manifest.json   the scene recording and its segments (gi, start, dur) — the film's clock
  drive/drive-script.json     each segment's kind, voice (speakerId) and source turn
  viewer/spoken-lines.json    the words actually recorded for a turn (captions come from here, not the script's text)
  viewer/performance-turns.json  the true subject (sp) and addressee (ad) of each turn; the narrator performs action lines
  scenes/_direction.mjs       BEATS: the emotion the scene's key beat is played on
  audio/albums.json           the bed: the book's BRONZE COUNCIL track (trackFor(book), as harness/build-film-audio.mjs)
and from this repository:
  odyssey/kits/cut.json       the Regulars' Cut: the segments kept for the scene, on the scene's own cut clock
  odyssey/keyframes/<id>.json the keyframe stills: each key is tied to the turn whose beat it stills
  odyssey/cineosis/score.json the sign score: the scene's direction block and its signs, attached as take.direction and
                              take.signs (odyssey-take.js cuts by them; odyssey/cineosis/WIRING.md)

take(sid, actor_ids) returns the dict the player reads as filmAsset().take. The voice and the bed are copied into
odyssey/take/ so the player (served from the repository root) loads them over http; nothing is inlined but the 50 Hz
envelope (a few kB). """
from pathlib import Path
import json, re, shutil, subprocess
import numpy as np

R = Path(__file__).parent; REPO = R.parent
HALF = Path('/home/user/odyssey-halfworld')
TAKE = REPO / 'odyssey/take'
BED_OPEN, BED_DUCK, RAMP = 0.18, 0.10, 0.150          # the bed law (odyssey-syncwatch.html; build-film-audio.mjs)
FACES = set(json.loads((REPO / 'world/faces/odyssey/index.json').read_text())['faces'])   # the twelve drawn faces
_C = {}
def _j(p):
    if p not in _C: _C[p] = json.loads(Path(p).read_text())
    return _C[p]
def ffmpeg():
    try: return subprocess.check_output(['python3', '-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).decode().strip()
    except Exception: return 'ffmpeg'

def beats():
    """_direction.mjs BEATS: scene id -> [emotion, note]."""
    if 'beats' not in _C:
        src = (HALF / 'scenes/_direction.mjs').read_text()
        body = src[src.index('export const BEATS'):]; body = body[:body.index('};')]
        _C['beats'] = {m[1]: [m[2], m[3]] for m in re.finditer(r'"(OD-B\d\d-S\d\d)":\s*\["([a-z]+)",\s*"([^"]*)"\]', body)}
    return _C['beats']

def bed_for(book):
    """trackFor(book): the album track numbered as the book, else the first album cycled."""
    alb = _j(HALF / 'audio/albums.json')
    for a in alb['albums']:
        t = next((t for t in a['tracks'] if t['num'] == book), None)
        if t: return a, t
    a = alb['albums'][0]; return a, a['tracks'][(book - 1) % len(a['tracks'])]

def envelope(path, hz=50):
    """world/face.js envelopeOf: RMS over 1/hz s windows of the mono voice, normalised to its 95th percentile."""
    raw = subprocess.run([ffmpeg(), '-v', 'error', '-i', str(path), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype='<f4'); n = 16000 // hz
    x = np.pad(x, (0, (-len(x)) % n)).reshape(-1, n); e = np.sqrt((x.astype(np.float64) ** 2).mean(1))
    top = np.sort(e)[int(len(e) * 0.95)] or 1.0
    return [round(float(min(1.0, v / top)), 3) for v in e], len(raw) / 4 / 16000

def resolve(sp, ids):
    """A halfworld speaker id (character.athena, ensemble.the-suitors, character.odysseus-as-beggar) to one of the scene's actor
    ids: exact; an ensemble to its first member; the guise folded both ways (athena <-> athena-as-mentes); else the first name."""
    if not sp or sp.startswith('PERFORMER.'): return None
    key = sp.split('.', 1)[-1].replace('_', '-')
    strip = lambda a: re.sub(r'-\d+$', '', a); base = lambda a: strip(a).split('-as-')[0]
    for test in (lambda a: a == key, lambda a: strip(a) == key, lambda a: base(a) == base(key),
                 lambda a: base(a).split('-')[0] == base(key).split('-')[0] and base(key).split('-')[0] not in ('the', 'a')):
        hit = next((a for a in ids if test(a)), None)
        if hit: return hit
    return None

def face_for(actor):
    """The halfworld face a scene actor wears: its base name (guise and ensemble number stripped), when one of the twelve is drawn."""
    b = re.sub(r'-\d+$', '', actor).split('-as-')[0]
    return b if b in FACES else None

def key_map(sid, turns):
    """Each keyframe key -> the turn it stills: the key's beat against the turn's payload, else by order."""
    f = REPO / 'odyssey/keyframes' / (sid + '.json')
    if not f.exists(): return {}, []
    keys = [k for k in json.loads(f.read_text())['keys'] if not k.get('after')]; norm   # a key placed after another (k.after) is not a turn's key = lambda s: re.sub(r'[^a-z]+', ' ', (s or '').lower()).strip()
    out = {}
    for i, k in enumerate(keys):
        hit = next((t['id'] for t in turns if norm(t.get('payload')) and norm(t['payload']) == norm(k.get('beat'))), None)
        if not hit and turns: hit = turns[min(len(turns) - 1, round(i * (len(turns) - 1) / max(1, len(keys) - 1)))]['id']
        out.setdefault(hit, k['id'])
    return out, [k['id'] for k in json.loads(f.read_text())['keys']]

def take(sid, actor_ids):
    vm = _j(HALF / 'drive/voice-manifest.json').get(sid)
    if not vm: return None
    ds = next(s for s in _j(HALF / 'drive/drive-script.json')['scenes'] if s['id'] == sid)
    spoken = _j(HALF / 'viewer/spoken-lines.json')['lines']
    turns = _j(HALF / 'viewer/performance-turns.json')['byScene'].get(sid, [])
    tmap = {t['id']: t for t in turns}
    kmap, korder = key_map(sid, turns)
    # the voice, copied beside the player; its envelope measured from the file itself
    TAKE.joinpath('voice').mkdir(parents=True, exist_ok=True); TAKE.joinpath('bed').mkdir(parents=True, exist_ok=True)
    src = HALF / vm['file']; dst = TAKE / 'voice' / (sid + '.m4a')
    if not dst.exists() or dst.stat().st_size != src.stat().st_size: shutil.copyfile(src, dst)
    env, real = envelope(dst)
    segs, key = [], (korder[0] if korder else None)
    for s in vm['segments']:
        d = ds['segments'][s['gi']]; tn = tmap.get(d.get('sourceTurnId')) or {}
        line = (spoken.get(d.get('sourceTurnId')) or {}).get('line') or ''
        is_line = bool(line) and d['kind'] == 'DIALOGUE'
        voice = resolve(d['speakerId'], actor_ids)                        # who makes the sound (None: the narrator)
        subj = resolve(tn.get('sp') or d['speakerId'], actor_ids)         # who the segment is about: the narrator performs action lines
        ad = resolve(tn.get('ad'), actor_ids)
        if d.get('sourceTurnId') in kmap: key = kmap[d['sourceTurnId']]
        segs.append(dict(gi=s['gi'], start=s['start'], dur=s['dur'], kind=d['kind'], turn=d.get('sourceTurnId'), key=key,
                         voice=voice, speaker=subj, addressee=ad if ad != subj else None,
                         speakerName=tn.get('spName') if d['kind'] == 'DIALOGUE' else d.get('speakerName'), subjectName=tn.get('spName'),
                         caption=line if is_line else d['text'], isLine=is_line, act=tn.get('act'), delivery=tn.get('delivery')))
    # the key beat: the segment carrying the longest authored line (odyssey-syncwatch.html)
    key_gi, best = -1, 0
    for g in segs:
        if g['kind'] == 'SPEAKER_CUE': continue
        L = len((spoken.get(g['turn']) or {}).get('line') or '') if g['turn'] else 0
        if L > best: key_gi, best = g['gi'], L
    a, t = bed_for(ds['book']); bsrc = HALF / a['dir'] / t['file']; bdst = TAKE / 'bed' / ('bronze-council-%02d.ogg' % t['num'])
    if not bdst.exists(): shutil.copyfile(bsrc, bdst)
    cuts = _j(REPO / 'odyssey/kits/cut.json')['scenes']; cut = next((c for c in cuts if c['id'] == sid), None)
    # where the scene falls in its book's bed: the bed loops from the book's first scene (build-film-audio.mjs), on either clock
    vman = _j(HALF / 'drive/voice-manifest.json'); book_of = {s['id']: s['book'] for s in _j(HALF / 'drive/drive-script.json')['scenes']}
    off_full = sum(vman[i]['total'] for i in sorted(vman) if i < sid and book_of.get(i) == ds['book'])
    off_cut = (cut['at'] - min(c['at'] for c in cuts if c['book'] == ds['book'])) if cut else 0.0
    b = beats().get(sid)
    sc = next((x for x in _j(REPO / 'odyssey/cineosis/score.json')['scenes'] if x['id'] == sid), None)   # the sign score: how the scene is cut
    return dict(scene=sid, book=ds['book'], bookTitle=ds.get('bookTitle'), title=ds.get('title'),
        voice=dict(file='odyssey/take/voice/%s.m4a' % sid, total=vm['total'], seconds=round(real, 3), hz=50, env=env, segments=segs),
        keyGi=key_gi, beat=dict(emotion=b[0], note=b[1]) if b else None,
        cast={i: face_for(i) for i in actor_ids},
        bed=dict(file='odyssey/take/bed/' + bdst.name, album=a['name'], title=t['title'], num=t['num'], offsetFull=round(off_full, 3), offsetCut=round(off_cut, 3), open=BED_OPEN, duck=BED_DUCK, ramp=RAMP),
        cut=dict(status=cut['status'], seconds=cut['seconds'], segments=[dict(gi=g['gi'], start=g['start'], dur=g['dur'], at=round(g['at'] - cut['at'], 3)) for g in cut['segments']],
                 dropped=[dict(gi=g['gi'], why=g['why']) for g in cut.get('dropped_segments', [])], why=cut.get('why', [])) if cut else dict(status='dropped', seconds=0, segments=[], dropped=[], why=[]),
        keys=korder,
        direction=sc.get('direction') if sc else None,
        signs=[sc['primary']['symbol']] + [x['symbol'] for x in sc.get('secondary', [])] if sc and sc.get('primary') else [])

def sound_line(tk):
    """The words for the location card's sound field: what the take plays."""
    if not tk: return ''
    v, b, c = tk['voice'], tk['bed'], tk['cut']
    return (f"Voice: the halfworld recording {v['file']} ({v['total']} s, {len(v['segments'])} segments; captions from the spoken lines). "
            f"Bed: {b['album']} {b['num']:02d} “{b['title']}” at {b['open']}, ducked to {b['duck']} under the voice with {int(b['ramp'] * 1000)} ms raised-cosine edges. "
            f"Regulars' Cut: {c['status']}, {len(c['segments'])} segments, {c['seconds']} s.")

if __name__ == '__main__':
    import sys
    sid = sys.argv[1] if len(sys.argv) > 1 else 'OD-B01-S03'
    ids = [p['id'].replace('odyssey-' + sid.lower() + '-', '') for p in json.loads((R / 'production' / ('odyssey-' + sid.lower() + '.json')).read_text())['production']]
    tk = take(sid, ids); tk['voice']['env'] = '%d samples' % len(tk['voice']['env']); print(json.dumps(tk, indent=1))
