#!/usr/bin/env python3
"""tools/sound-grocery.py: the sound of The List (case-grocery) as one track on the film's own timeline, so it plays like a sitcom's
mix and not a demo: the underscore (the scene's music, ducked under every line), a supermarket bed (the air handling, the fluorescent
buzz, a far crowd, freezer compressors in the frozen aisle, trolley wheels, other lanes' tills at the checkout), a ceiling-speaker
announcement in a gap in the talk, and short comic stings on the jokes, ending on a button when the baby scans. Every sting is
written here; nothing is taken from the show's own music.

The engine still plays the spoken lines (world/lines, voiced by tools/lines-neural.py) and the scene's own foley on top of this track;
the times come from the scene itself (tools/lines-dump.js), so a re-timed scene only needs this run again.

Needs numpy, scipy, soundfile; ffmpeg ($FFMPEG or imageio-ffmpeg) for decoding the music and writing opus; for the announcement,
kokoro-onnx and its model in $KOKORO_DIR (skipped without them).
Usage: python3 tools/sound-grocery.py [music.ogg] -> world/music/grocery-mix.ogg
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from scipy.signal import butter, lfilter, fftconvolve

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(1989)

def ffmpeg():
    if os.environ.get('FFMPEG'): return os.environ['FFMPEG']
    import imageio_ffmpeg; return imageio_ffmpeg.get_ffmpeg_exe()
FF = ffmpeg()

def decode(path):
    raw = subprocess.check_output([FF, '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'])
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()

def bp(x, lo, hi, o=2): b, a = butter(o, [lo / (SR / 2), min(0.99, hi / (SR / 2))], 'band'); return lfilter(b, a, x)
def lp(x, f, o=2): b, a = butter(o, min(0.99, f / (SR / 2)), 'low'); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'high'); return lfilter(b, a, x)
def env(n, a, r): e = np.ones(n); ai = max(1, int(a * SR)); ri = max(1, int(r * SR)); e[:ai] = np.linspace(0, 1, ai)[:n]; e[-ri:] *= np.linspace(1, 0, min(ri, n)); return e
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

dump = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'tools/lines-dump.js'), 'case-grocery']))
T = dump['total'] + 0.5; N = int(T * SR)
starts = []; t = 0
for name, sec in dump['shots']: starts.append((name, t, sec)); t += sec
shot_at = {name: t0 for name, t0, sec in starts}
idx = json.load(open(os.path.join(ROOT, 'world/lines/index.json')))
lines = sorted([(e['at'], e['at'] + idx.get(e['key'], {}).get('sec', 1.0), e['who'], e['text']) for e in dump['events'] if 'key' in e])
def line_end(text): return next(b for a, b, w, tx in lines if tx == text)
def line_start(text): return next(a for a, b, w, tx in lines if tx == text)

L = np.zeros(N); R = np.zeros(N)
def add(sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[:j - i] * gain; L[i:j] += s * np.cos((pan + 1) * np.pi / 4); R[i:j] += s * np.sin((pan + 1) * np.pi / 4)

# ── the underscore: the scene's music, full on the title, then under the talk, ducked a further 8 dB while anyone speaks ──
music = decode(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'world/music/m1-trouttown-working-day.ogg'))[:N]
g = np.full(N, 0.42); tt = np.arange(N) / SR
g[tt < shot_at['The store']] = 1.0; ramp = (tt >= shot_at['The store']) & (tt < shot_at['The store'] + 1.2); g[ramp] = np.linspace(1.0, 0.42, ramp.sum())
for a, b, w, tx in lines:
    if a < shot_at['The store']: continue
    m = (tt > a - 0.12) & (tt < b + 0.2); g[m] = np.minimum(g[m], 0.17)
g = np.convolve(g, np.ones(int(0.12 * SR)) / int(0.12 * SR), mode='same')   # the fader moved by hand, not switched
card = shot_at['the card']; g[tt >= card] = np.maximum(g[tt >= card], np.clip(0.42 + (tt[tt >= card] - card) * 0.6, 0, 1.0))
L[:len(music)] += music[:, 0] * g[:len(music)]; R[:len(music)] += music[:, 1] * g[:len(music)]

# ── the store: from the first shot inside to the card ──
s0, s1 = shot_at['The store'], card
n = int((s1 - s0) * SR); fade = env(n, 0.8, 1.2)
air = lp(rng.standard_normal(n), 380) * 0.06 + lp(rng.standard_normal(n), 900) * 0.012   # the air handling
t_ = np.arange(n) / SR; buzz = sum(np.sin(2 * np.pi * f * t_ + rng.uniform(0, 6)) * a for f, a in [(120, 1), (240, 0.5), (360, 0.3), (480, 0.15)])
buzz = bp(buzz, 100, 900) * 0.0045 * (1 + 0.15 * np.sin(2 * np.pi * 0.37 * t_))   # the fluorescent tubes
crowd = np.zeros(n)                                                                  # a far crowd: murmured syllables, no words
for k in range(9):
    v = bp(rng.standard_normal(n), 250 + k * 40, 1800 + k * 90); am = 0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(3.5, 5.5) * t_ + rng.uniform(0, 6)); slow = 0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.05, 0.2) * t_ + rng.uniform(0, 6))
    crowd += v * am * slow
crowd = lp(crowd, 1500) * 0.004
bed = (air + buzz + crowd) * fade; add(bed, s0, -0.15, 1.0); add(np.roll(bed, 4800), s0, 0.15, 0.9)
# the frozen aisle: compressors and the glass doors' hum
f0, f1 = shot_at['Caught'], shot_at['The belt']; n2 = int((f1 - f0) * SR); t2 = np.arange(n2) / SR
comp = (np.sin(2 * np.pi * 58 * t2) * 0.6 + np.sin(2 * np.pi * 116 * t2) * 0.3) * 0.012 + lp(rng.standard_normal(n2), 220) * 0.03
add(comp * env(n2, 0.4, 0.5), f0, 0.3)
# trolley wheels: a rattle with a squeak on it, now and then, around the store
def trolley():
    d = rng.uniform(0.6, 1.4); m = int(d * SR); tt3 = np.arange(m) / SR
    rattle = bp(rng.standard_normal(m), 1800, 5000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * rng.uniform(9, 14) * tt3))) * 0.03
    f = rng.uniform(1900, 2600) * (1 + 0.06 * np.sin(2 * np.pi * 7 * tt3)); sq = np.sin(2 * np.pi * np.cumsum(f) / SR) * (rng.random() > 0.4) * 0.012 * np.exp(-((tt3 - d / 2) ** 2) / 0.02)
    return (rattle + sq) * env(m, 0.1, 0.2)
tq = s0 + 1.5
while tq < s1 - 2:
    add(trolley(), tq, rng.uniform(-0.8, 0.8), rng.uniform(0.5, 1.0)); tq += rng.uniform(3.5, 7.5)
# other lanes' tills at the checkout
def beep(f=2350, d=0.11): m = int(d * SR); return np.sin(2 * np.pi * f * np.arange(m) / SR) * env(m, 0.004, 0.02)
tb = shot_at['The belt'] + 0.6
while tb < s1 - 0.5:
    add(beep(rng.choice([2350, 2600, 1980])), tb, rng.choice([-0.7, 0.75]), 0.02); tb += rng.uniform(1.3, 3.2)

# ── the ceiling speaker, in the gap before Flanders finds Homer ──
def announce(text, t0, gain=0.5):
    try:
        from kokoro_onnx import Kokoro
        kd = os.environ.get('KOKORO_DIR', '.'); tts = Kokoro(os.path.join(kd, 'kokoro.onnx'), os.path.join(kd, 'voices.bin'))
        s, sr = tts.create(text, voice='am_eric', speed=1.0, lang='en-us')
    except Exception as e:
        print('announcement skipped:', e); return
    with tempfile.TemporaryDirectory() as td:
        a = os.path.join(td, 'a.f32'); open(a, 'wb').write(np.asarray(s, dtype=np.float32).tobytes())
        raw = subprocess.check_output([FF, '-loglevel', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', a, '-af', f'aresample={SR},highpass=f=420,lowpass=f=3400,acompressor=threshold=-24dB:ratio=6,volume=2.0', '-f', 'f32le', '-'])
    v = np.frombuffer(raw, dtype=np.float32).astype(float); v = np.tanh(v * 1.8) / 1.8                    # a cheap speaker, driven
    ir = rng.standard_normal(int(1.4 * SR)) * np.exp(-np.arange(int(1.4 * SR)) / SR * 4.5); ir = lp(ir, 3000)
    wet = fftconvolve(v, ir)[:len(v) + int(1.0 * SR)]; wet = wet / (np.abs(wet).max() + 1e-9) * np.abs(v).max()
    chime = sum(np.sin(2 * np.pi * hz(m) * np.arange(int(0.5 * SR)) / SR) * np.exp(-np.arange(int(0.5 * SR)) / SR * 5) for m in [76, 72])
    add(chime * 0.25, t0 - 0.6, 0.0, gain); add(np.concatenate([v, np.zeros(len(wet) - len(v))]) * 0.55 + wet * 0.6, t0, 0.0, gain)
announce('Attention shoppers. Clean-up on aisle four.', shot_at['The store'] + 0.35, 0.35)

# ── the stings: short, original, on the jokes ──
def xylo(m, d=0.35, a=0.2):
    k = int(d * SR); t4 = np.arange(k) / SR; f = hz(m); return (np.sin(2 * np.pi * f * t4) + 0.3 * np.sin(2 * np.pi * f * 4.02 * t4) * np.exp(-t4 * 30)) * np.exp(-t4 * 9) * a
def brass(m, d, a=0.14, mute=False):
    k = int((d + 0.1) * SR); t4 = np.arange(k) / SR; f = hz(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * t4)); ph = np.cumsum(f) / SR
    x = 2 * (ph - np.floor(ph + 0.5)); cut = 900 + 2600 * np.exp(-t4 * (9 if mute else 4)); y = np.zeros(k); st = 0
    for i0 in range(0, k, 1024): i1 = min(k, i0 + 1024); y[i0:i1] = lp(x[i0:i1], float(cut[i0]))   # the bell opens and closes
    y = bp(y, 300, 2600) if mute else y
    return y * env(k, 0.02, 0.08) * a
def bassoon(m0, m1, d, a=0.16):
    k = int(d * SR); t4 = np.arange(k) / SR; f = hz(m0) * (hz(m1) / hz(m0)) ** (t4 / d); ph = np.cumsum(f) / SR
    x = np.sign(np.sin(2 * np.pi * ph)) * 0.6 + np.sin(2 * np.pi * ph * 2) * 0.3; return lp(x, 1200) * env(k, 0.03, 0.12) * a
def slide(f0, f1, d, a=0.1):
    k = int(d * SR); t4 = np.arange(k) / SR; f = f0 * (f1 / f0) ** (t4 / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(k, 0.02, 0.1) * a
def rim(a=0.3):
    k = int(0.18 * SR); t4 = np.arange(k) / SR; return (bp(rng.standard_normal(k), 1500, 7000) * np.exp(-t4 * 40) + np.sin(2 * np.pi * 420 * t4) * np.exp(-t4 * 60)) * a
def cymbal(a=0.08):
    k = int(1.2 * SR); t4 = np.arange(k) / SR; return hp(rng.standard_normal(k), 5000) * np.exp(-t4 * 3) * a

e = line_end('Six things. How hard can it be?') + 0.1                       # it will be hard: two muted notes down
add(brass(70, 0.22, mute=True), e, 0.1); add(brass(69, 0.5, mute=True), e + 0.26, 0.1)
e = line_end('One, two, three, four, five.') + 0.05                          # counted right: a run up on the xylophone
for i, m in enumerate([72, 76, 79, 84]): add(xylo(m), e + i * 0.07, 0.2)
e = line_end("So I'll change the list.") + 0.05                              # the wrong idea: a bassoon sinks
add(bassoon(55, 48, 0.55), e, -0.1)
e = line_start('Flanders?!') - 0.05                                          # caught: the startle
add(slide(700, 1900, 0.25, 0.08), e, 0.0); add(cymbal(0.05), e + 0.2, 0.3)
e = line_end('Check-diddly-eck.') + 0.05                                     # all present: a bright ding
add(xylo(88, 0.6, 0.12), e, 0.3); add(xylo(91, 0.6, 0.1), e + 0.05, 0.3)
e = line_end('Baby.') + 0.05                                                 # the baby on the belt: a slide whistle down
add(slide(1600, 500, 0.45, 0.09), e, -0.2)
e = line_end('It scanned.') + 0.12                                           # the button: a short band hit and the rimshot
for m in [60, 64, 67, 70, 74]: add(brass(m, 0.16, 0.07), e, (m - 67) / 20)
for m in [62, 65, 69, 72, 77]: add(brass(m, 0.5, 0.08), e + 0.22, (m - 67) / 20)
add(rim(0.25), e + 0.22, 0.2); add(cymbal(0.07), e + 0.22, 0.25)

# ── the paper inserts: a pencil writing (short scratches, a word a stroke), a line struck through, the list unfolded ──
def scratch(d, a=0.05):
    k = int(d * SR); t4 = np.arange(k) / SR; out = np.zeros(k); u = 0.0
    while u < d - 0.05:
        s0 = int(u * SR); m = int(rng.uniform(0.05, 0.13) * SR); m = min(m, k - s0)
        out[s0:s0 + m] += bp(rng.standard_normal(m), 2500, 7500) * env(m, 0.01, 0.02) * rng.uniform(0.6, 1.0); u += rng.uniform(0.07, 0.16)
    return out * a
def strike(d, a=0.07): k = int(d * SR); return bp(rng.standard_normal(k), 1800, 6500) * env(k, 0.02, 0.05) * a
def rustle(d=0.5, a=0.06): k = int(d * SR); return bp(rng.standard_normal(k), 600, 4000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * np.arange(k) / SR))) * env(k, 0.03, 0.2) * a
PAPER = {'The record begins': [('w', 0.2, 1.1)], 'Apples in the record': [('w', 0.2, 1.2)], 'Oil struck': [('s', 0.3, 0.6)], 'The record corrected': [('s', 0.3, 0.6), ('w', 1.2, 1.0)], 'Maggie on the list': [('w', 0.2, 0.8)], 'The list read': [('r', 0.0, 0.5)]}
for name, strokes in PAPER.items():
    if name not in shot_at: continue
    for kind, at, d in strokes:
        sig = scratch(d) if kind == 'w' else strike(d) if kind == 's' else rustle(d)
        add(sig, shot_at[name] + at, 0.05, 1.0)

# ── the finish: a small room on the store sounds, then out ──
out = np.stack([L, R], 1); peak = np.abs(out).max(); out = out / peak * 0.89
k = int(0.6 * SR); out[-k:] *= np.linspace(1, 0, k)[:, None]
dst = os.path.join(ROOT, 'world/music/grocery-mix.ogg')
with tempfile.TemporaryDirectory() as td:
    w = os.path.join(td, 'm.f32'); open(w, 'wb').write(out.astype(np.float32).tobytes())
    subprocess.run([FF, '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', w, '-c:a', 'libopus', '-b:a', '128k', dst], check=True)
print('wrote', dst, round(T, 2), 's,', len(lines), 'lines ducked')
