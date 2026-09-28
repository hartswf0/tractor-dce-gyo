#!/usr/bin/env python3
"""tools/odyssey-game-audio.py: the sound of Nobody's Hands (play/odyssey-game.html).

  python3 tools/odyssey-game-audio.py            # voice clips + lines.json + the effects library

VOICE  every line a level names (play/odyssey-game/levels/*.json, "OD-Bbb-Sss#gi") is resolved in the halfworld: the scene
       recording and the segment's start and length (drive/voice-manifest.json), its kind and speaker (drive/drive-script.json),
       and, for dialogue, the authored line the recording speaks (viewer/spoken-lines.json) — the caption. The segment is cut
       from the recording (odyssey/take/voice/<scene>.m4a, copied from the halfworld when the take has not copied it yet) with
       12 ms edges into play/odyssey-game/voice/<scene>-<gi>.ogg (Vorbis, mono): small, and playable in every browser.
       Written: play/odyssey-game/voice/lines.json  {id: {file, dur, speaker, caption, isLine, kind, scene, gi, start}}
SFX    the trailer's synthesised library (tools/trailer-sound.py FX, numpy oscillators and noise, no samples), rendered to
       play/odyssey-game/sfx/<name>.ogg: hits once, beds as seamless 6 s loops (the tail crossfaded into the head).
The halfworld is read from ODYSSEY_HALFWORLD or ../odyssey-halfworld (read only).
"""
import glob, importlib.util, json, os, re, shutil, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HW = os.environ.get('ODYSSEY_HALFWORLD') or os.path.join(os.path.dirname(ROOT), 'odyssey-halfworld')
GAME = os.path.join(ROOT, 'play/odyssey-game')
spec = importlib.util.spec_from_file_location('trailer_sound', os.path.join(ROOT, 'tools/trailer-sound.py'))
TS = importlib.util.module_from_spec(spec); spec.loader.exec_module(TS)
FF, SR = TS.FF, TS.SR
HITS = ['clang', 'splash', 'splash-small', 'hiss', 'roar', 'thunder', 'thunder-far', 'thud', 'whoosh', 'bowstring', 'rock', 'creak',
        'stud', 'studs-final', 'burst', 'yell', 'drum', 'axe', 'ticks', 'lyre', 'breath', 'rumble-rise', 'screams-far', 'clatter']
BEDS = ['fire', 'sea', 'sea-calm', 'wind', 'wind-howl', 'whirlpool', 'oars', 'snore', 'storm', 'whisper']


def ogg(x, path, mono=True):
    y = np.clip(x.mean(1) if (mono and x.ndim == 2) else x, -1, 1).astype('<f4')
    ch = 1 if y.ndim == 1 else 2
    subprocess.run([FF, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(ch), '-i', '-', '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '3', path],
                   input=y.tobytes(), check=True)


def lines_wanted():
    out = set()
    def walk(v):
        if isinstance(v, str) and re.fullmatch(r'OD-B\d\d-S\d\d#\d+', v): out.add(v)
        elif isinstance(v, dict): [walk(x) for x in v.values()]
        elif isinstance(v, list): [walk(x) for x in v]
    for f in sorted(glob.glob(os.path.join(GAME, 'levels/*.json'))): walk(json.load(open(f)))
    return sorted(out)


def voice():
    vm = json.load(open(os.path.join(HW, 'drive/voice-manifest.json')))
    ds = {s['id']: s for s in json.load(open(os.path.join(HW, 'drive/drive-script.json')))['scenes']}
    spoken = json.load(open(os.path.join(HW, 'viewer/spoken-lines.json')))['lines']
    os.makedirs(os.path.join(GAME, 'voice'), exist_ok=True); os.makedirs(os.path.join(ROOT, 'odyssey/take/voice'), exist_ok=True)
    table = {}
    for ref in lines_wanted():
        sid, gi = ref.split('#'); gi = int(gi)
        seg = next(s for s in vm[sid]['segments'] if s['gi'] == gi); d = ds[sid]['segments'][gi]
        src = os.path.join(ROOT, 'odyssey/take/voice', sid + '.m4a')
        if not os.path.exists(src): shutil.copyfile(os.path.join(HW, vm[sid]['file']), src)   # as odyssey_take.py copies it
        x = TS.decode(src, seg['start'], seg['dur'])
        n = int(0.012 * SR); w = np.ones(len(x)); w[:n] = np.linspace(0, 1, n); w[-n:] = np.linspace(1, 0, n); x = x * w[:, None]
        pk = np.abs(x).max() + 1e-9; x = x / pk * 0.89
        name = '%s-%d.ogg' % (sid, gi); ogg(x, os.path.join(GAME, 'voice', name))
        line = (spoken.get(d.get('sourceTurnId')) or {}).get('line') or ''
        is_line = bool(line) and d['kind'] == 'DIALOGUE'
        table[ref] = dict(file='voice/' + name, dur=round(len(x) / SR, 3), speaker=d['speakerName'], caption=line if is_line else d['text'],
                          isLine=is_line, kind=d['kind'], scene=sid, gi=gi, start=seg['start'])
        print('%-16s %5.1f s  %-16s %s' % (ref, table[ref]['dur'], d['speakerName'], table[ref]['caption'][:70]))
    json.dump(table, open(os.path.join(GAME, 'voice/lines.json'), 'w'), indent=1, ensure_ascii=False)
    return table


def sfx():
    d = os.path.join(GAME, 'sfx'); os.makedirs(d, exist_ok=True); cache = {}
    for k in HITS:
        x = TS.render_fx(k, 3.0, cache) * 3
        a = np.abs(x).max(1); nz = np.nonzero(a > 1e-4)[0]; x = x[: (nz[-1] + int(0.05 * SR)) if len(nz) else len(x)]
        ogg(x, os.path.join(d, k + '.ogg'))
    for k in BEDS:
        sec, xf = 6.0, 0.5
        x = TS.render_fx(k, sec + xf, cache) * 3; n, m = int(sec * SR), int(xf * SR)
        head, tail = x[:m], x[n:n + m]; u = np.linspace(0, 1, m)[:, None]
        y = x[:n].copy(); y[:m] = head * u + tail * (1 - u)   # the tail runs into the head: the loop has no seam
        ogg(y, os.path.join(d, k + '.ogg'))
    print('effects:', len(HITS), 'hits,', len(BEDS), 'loops ->', d)


if __name__ == '__main__':
    if '--sfx-only' not in sys.argv: voice()
    if '--voice-only' not in sys.argv: sfx()
