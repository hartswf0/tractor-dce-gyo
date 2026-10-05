#!/usr/bin/env python3
"""tools/making/voices.py — the making-of LEGO film's voices and takes, offline.

    python3 tools/making/voices.py --tts <dir with kokoro-q8.onnx, voices.npz, pyk/> [OD-B25-S01 ...]

For each scene of tools/making/lego_script.py:
  - every line is synthesized with Kokoro-82M (kokoro_onnx, run offline), in the voice the script gives its speaker, and
    loudness-matched (the RMS of its voiced 20 ms frames brought to -20 dBFS, the peak kept under -1 dBFS); the clips are cached in
    <tts>/making/<hash>.wav
  - the lines are laid on the scene's clock (each after the pause the script asks for) into odyssey/take/voice/<scene>.m4a
  - the scene's bed, odyssey/take/bed/making-<scene>.ogg, is a synthesized studio room tone (and, in the night scene, the render
    farm's hum, the power going down at the restart and coming back); no music
  - odyssey/take/making/<scene>.json is the take film-readymades/odyssey_take.py reads for these scenes in place of the
    halfworld's recording: the segments (who speaks, to whom, the caption, the keyframe key), the cut (the same clock), the bed
The voices are synthetic; the page and the film's end caption say so."""
import sys, os, json, hashlib, wave, subprocess
import numpy as np
from pathlib import Path
REPO = Path(__file__).resolve().parents[2]; sys.path.insert(0, str(Path(__file__).parent))
import lego_script as S
A = sys.argv; TTS = Path(A[A.index('--tts') + 1]) if '--tts' in A else None
ONLY = [a for a in A[1:] if a.startswith('OD-B2')]
SR = 24000
def ffmpeg():
    import imageio_ffmpeg; return imageio_ffmpeg.get_ffmpeg_exe()
FF = ffmpeg()
KK = None
def synth(text, voice, speed):
    global KK
    cache = TTS / 'making'; cache.mkdir(exist_ok=True)
    h = hashlib.sha1(f'{voice}|{speed}|{text}'.encode()).hexdigest()[:16]; f = cache / (h + '.wav')
    if not f.exists():
        sys.path.insert(0, str(TTS / 'pyk'))
        from kokoro_onnx import Kokoro
        if KK is None: KK = Kokoro(str(TTS / 'kokoro-q8.onnx'), str(TTS / 'voices.npz'))
        s, sr = KK.create(text, voice=voice, speed=speed, lang='en-gb' if voice.startswith('b') else 'en-us')
        assert sr == SR, sr
        w = wave.open(str(f), 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(s, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
    w = wave.open(str(f)); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768; w.close()
    return x
def matched(x, target_db=-20.0):
    """loudness-matched: the voiced frames' RMS to the target, the leading and trailing silence trimmed to 60 ms"""
    n = SR // 50; fr = x[:len(x) // n * n].reshape(-1, n); rms = np.sqrt((fr ** 2).mean(1) + 1e-12)
    on = rms > rms.max() * 0.06; idx = np.where(on)[0]
    a, b = max(0, idx[0] * n - int(0.06 * SR)), min(len(x), (idx[-1] + 1) * n + int(0.06 * SR)); x = x[a:b]
    g = 10 ** (target_db / 20) / np.sqrt((fr[on] ** 2).mean()); x = x * g
    pk = np.abs(x).max(); lim = 10 ** (-1 / 20)
    return x * (lim / pk if pk > lim else 1.0)

def tannoy(x):
    """the loudspeaker: the voice band-limited to 350-3400 Hz, a little drive, a short slap back off the studio wall"""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < 350) | (f > 3400)] = 0; y = np.fft.irfft(X, len(x))
    y = np.tanh(2.2 * y) / np.tanh(2.2); d = int(0.07 * SR); y = y + 0.25 * np.concatenate([np.zeros(d), y[:-d]])
    return y / (np.abs(y).max() + 1e-9) * 0.75

def bed(sid, total, events):
    """the room: brown noise, low; the farm's hum and fans where the script runs it, the power down and up"""
    rng = np.random.default_rng(25); n = int(total * SR) + SR
    w = np.cumsum(rng.standard_normal(n)) ; w -= np.convolve(w, np.ones(2400) / 2400, mode='same'); w /= np.abs(w).max() + 1e-9
    room = w * 0.05
    t = np.arange(n) / SR; out = room.copy()
    hum_on = np.zeros(n)
    for a, b in events.get('hum', []):
        i0, i1 = int(a * SR), int(min(b, total + 1) * SR); ramp = np.clip(np.minimum(np.arange(i1 - i0) / (0.6 * SR), (i1 - i0 - np.arange(i1 - i0)) / (0.3 * SR)), 0, 1); hum_on[i0:i1] = ramp
    fan = rng.standard_normal(n); fan = np.convolve(fan, np.ones(12) / 12, mode='same') * 0.035
    hum = (0.05 * np.sin(2 * np.pi * 100 * t) + 0.025 * np.sin(2 * np.pi * 200 * t + 0.4) + 0.012 * np.sin(2 * np.pi * 300 * t)) + fan
    out += hum * hum_on
    for a in events.get('down', []):   # the power goes: a falling whine and a clunk
        i0 = int(a * SR); d = int(1.2 * SR); tt = np.arange(d) / SR; f = 520 * np.exp(-tt * 2.2) + 40
        out[i0:i0 + d] += 0.12 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.8)
        k = int(0.08 * SR); out[i0:i0 + k] += rng.standard_normal(k) * np.exp(-np.arange(k) / (0.015 * SR)) * 0.5
    for a in events.get('up', []):     # it comes back: a click and a rising whine
        i0 = int(a * SR); d = int(1.4 * SR); tt = np.arange(d) / SR; f = 60 + 460 * (1 - np.exp(-tt * 2.5))
        out[i0:i0 + d] += 0.09 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, tt * 3) * np.exp(-tt * 0.9)
        k = int(0.05 * SR); out[i0:i0 + k] += rng.standard_normal(k) * np.exp(-np.arange(k) / (0.01 * SR)) * 0.4
    for a in events.get('clap', []):   # the clapperboard
        i0 = int(a * SR); k = int(0.06 * SR); out[i0:i0 + k] += rng.standard_normal(k) * np.exp(-np.arange(k) / (0.008 * SR)) * 0.8
    out = np.clip(out, -1, 1)
    p = REPO / 'odyssey/take/bed' / f'making-{sid}.ogg'; wav = p.with_suffix('.wav')
    ww = wave.open(str(wav), 'wb'); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(SR); ww.writeframes((out * 32767).astype('<i2').tobytes()); ww.close()
    subprocess.run([FF, '-v', 'error', '-y', '-i', str(wav), '-c:a', 'libvorbis', '-q:a', '3', '-ac', '2', '-ar', '48000', str(p)], check=True); wav.unlink()
    return 'odyssey/take/bed/' + p.name

def envelope(x, hz=50):
    n = SR // hz; x = np.pad(x, (0, (-len(x)) % n)).reshape(-1, n); e = np.sqrt((x.astype(np.float64) ** 2).mean(1))
    top = np.sort(e)[int(len(e) * 0.95)] or 1.0
    return [round(float(min(1.0, v / top)), 3) for v in e]

def giant(x, k=1.26):
    """a giant's voice: resampled k times longer, so lower by as much (Polyphemus)"""
    n = int(len(x) * k); return np.interp(np.arange(n) / k, np.arange(len(x)), x).astype(np.float32)

def shade(x):
    """the shade's faint echo (70 and 140 ms), as the restored Achilles line has it"""
    y = x.copy()
    for d, g in ((0.07, 0.35), (0.14, 0.2)):
        k = int(d * SR); y = np.concatenate([y, np.zeros(k, np.float32)]); y[k:] += g * np.concatenate([x, np.zeros(len(y) - k - len(x), np.float32)])
    return y / (np.abs(y).max() + 1e-9) * min(1.0, np.abs(x).max() * 1.05)

def scene(sid):
    """the lines on the clock; for an episode (OD-B26) also its events that are not voices: the clapperboard, the dailies (a real take
    on the monitor, cut in by hop_film.py), a beat held for action"""
    sc = S.SCENES[sid]; at = sc['head']; clips = []; segs = []; ev_hop = dict(clap=[], dailies=[], beats=[]); first = True
    for li, line in enumerate(sc['lines']):
        key, who, to, pause, text = line[:5]
        at += pause if not first else 0; first = False
        if who == 'clap': ev_hop['clap'].append(round(at, 3)); at += 0.5; continue
        if who == 'dailies':
            f, cap, *flag = text.split('|'); fn, span = f.split('@'); a0, d = map(float, span.split('+'))
            ev_hop['dailies'].append(dict(key=key, start=round(at, 3), dur=d, file=fn, at=a0, caption=cap, audio='audio' in flag)); at += d + 0.35; continue
        if who == 'beat':
            d, what = text.split('|', 1); ev_hop['beats'].append(dict(key=key, start=round(at, 3), dur=float(d), what=what)); at += float(d) + 0.35; continue
        gi = len(segs); c = S.CAST[who]; x = synth(text, c['voice'], c['speed'])
        if c.get('fx') == 'giant': x = giant(x)
        x = matched(x)
        if c.get('fx') == 'shade': x = shade(x)
        if who == 'pa': x = tannoy(x)
        clips.append((at, x)); d = len(x) / SR
        cr = lambda x: x is not None and S.CAST.get(x, {}).get('creature')   # a creature (a rig, not a cast figure) is nobody's speaker or addressee to the take's cameras
        segs.append(dict(gi=gi, start=round(at, 3), dur=round(d, 3), kind='NARRATION' if who == 'pa' else 'DIALOGUE', turn=f'{sid}-T{gi + 1:02d}', key=key, voice=who, speaker=None if cr(who) else who,
                         addressee=None if cr(to) or cr(who) else to, speakerName=c['name'], subjectName=c['name'], caption=text, isLine=True, act=None, delivery=None))
        at += d + 0.35
    total = round(at - 0.35 + sc['tail'], 3)
    y = np.zeros(int(total * SR) + 1, dtype=np.float32)
    for a, x in clips: i = int(round(a * SR)); y[i:i + len(x)] += x[:len(y) - i]
    wav = REPO / 'odyssey/take/voice' / f'{sid}.join.wav'; m4a = wav.with_name(f'{sid}.m4a')
    w = wave.open(str(wav), 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
    subprocess.run([FF, '-v', 'error', '-y', '-i', str(wav), '-c:a', 'aac', '-b:a', '96k', '-ar', str(SR), '-ac', '1', str(m4a)], check=True); wav.unlink()
    # the bed's events, from the lines that cause them
    by = lambda i: segs[i]['start']
    ev = {}
    if sid == 'OD-B25-S02':   # the restart: the power goes 1.9 s before "the lights", comes back 1.7 s before "nothing is lost"
        k4 = next(s for s in segs if s['key'] == 'K4')['start']; down = by(10) - 1.9; up = by(12) - 1.7
        ev = {'hum': [(k4 - 2.2, down), (up + 0.6, total + 1)], 'down': [down], 'up': [up]}
    if sid == 'OD-B25-S06':   # the loom at night: the farm's hum while the agents run; the cap cuts the agent off (the power goes as its line ends, before the speaker); the next run starts 1.6 s before the sweeper speaks
        down = by(4) - 0.1; up = by(6) - 1.6
        ev = {'hum': [(0.0, down), (up + 0.6, total + 1)], 'down': [down], 'up': [up]}
    if sid == 'OD-B25-S08':   # the restart: the power goes 0.6 s before the speaker says so; it comes back 1.4 s before the new agent's "Hi"
        down = by(6) - 0.6; up = by(7) - 1.4
        ev = {'hum': [(0.0, down), (up + 0.6, total + 1)], 'down': [down], 'up': [up]}
    if sid.startswith('OD-B26'): ev = {'clap': ev_hop['clap']}
    bfile = bed(sid, total, ev)
    hop = sid.startswith('OD-B26')
    take = dict(scene=sid, title=sc['title'], book=26 if hop else 25, bookTitle='Hearts of Plastic' if hop else 'The making of the LEGO Odyssey',
                voice=dict(file=f'odyssey/take/voice/{sid}.m4a', total=total, seconds=total, hz=50, env=envelope(y), segments=segs),
                cast={k: v['face'] for k, v in S.CAST.items()},
                bed=dict(file=bfile, album='studio room tone (synthesized, tools/making/voices.py)', title='the studio', num=0, offsetFull=0.0, offsetCut=0.0, open=1.0, duck=0.85, ramp=0.15),
                cut=dict(status='performer', seconds=total, segments=[dict(gi=s['gi'], start=s['start'], dur=s['dur'], at=s['start']) for s in segs], dropped=[], why=['the making-of film: its own clock']),
                events=ev, hop=ev_hop if hop else None, voices={k: dict(voice=v['voice'], speed=v['speed'], engine='Kokoro-82M (kokoro_onnx 0.6.1, q8 ONNX), offline') for k, v in S.CAST.items()})
    (REPO / 'odyssey/take/making').mkdir(parents=True, exist_ok=True)
    (REPO / 'odyssey/take/making' / f'{sid}.json').write_text(json.dumps(take, indent=1))
    print(sid, f'{total:.1f} s,', len(segs), 'lines,', 'bed', bfile, 'events', {k: [round(v, 2) if not isinstance(v, tuple) else tuple(round(q, 2) for q in v) for v in vs] for k, vs in ev.items()})

if __name__ == '__main__':
    for sid in (ONLY or list(S.SCENES)): scene(sid)
