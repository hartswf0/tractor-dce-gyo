#!/usr/bin/env python3
"""tools/trailer-sound.py: the sound of an Odyssey trailer, mixed from its edit list (odyssey/trailers/<id>.json) to a WAV of
exactly the trailer's length, mastered to a loudness target and measured.

  python3 tools/trailer-sound.py teaser [--out films/trailers/teaser.wav] [--lufs -14] [--tp -1.0] [--fx-dir films/trailers/fx]
  python3 tools/trailer-sound.py --fx-only                       # write every effect of the library to --fx-dir, to audition

What is laid, and how:
  music   each cue of doc.music: the halfworld track (audio/<album>/<file>) from `in` to `out`, placed at `at`, `gain` dB, with
          its fade_in / fade_out (raised-cosine); a cue marked xfade simply overlaps the one before it (the validator allows
          that only there), so the two fades make the crossfade. Declared silences are silence.
  voice   each shot's voice: the scene recording drive/voice/<scene>.m4a from segment start + clip.in to + clip.out, laid at
          shot.at + voice.at with 12 ms edges; every clip is brought to the same loudness (--voice-lufs, -16 LUFS before the
          master), so a quiet narrator and a shouted line sit alike.
  duck    the music under every voice clip follows the take's bed law: open, ducked by the ratio 0.10/0.18 (-5.1 dB) with
          150 ms raised-cosine edges (odyssey_take.py BED_OPEN/BED_DUCK/RAMP), deeper (shot.duck_db) where a shot asks.
  sfx     every name in shot.sfx is matched by keywords to a synthesised effect (numpy; no samples exist in the repositories:
          world/sound.js makes its effects from oscillators and noise too). A bed (fire, wind, sea, crickets, room tone...) is
          one long rendering gated on for every shot that names it, so it runs on across a cut; a hit (drum, thunder crack, roar,
          splash, clang...) lands on the cut, or at shot.sfx_at[name] seconds into the shot; shot.sfx_gain[name] trims it in dB.
          Names that are the score itself ("score hit", "choir swell (the score)", "single low drum (the score's)") add nothing.
  master  the sum is measured (ffmpeg ebur128), brought to --lufs integrated, then limited so the true peak stays under --tp.
Writes <out>.wav and <out>.sound.json (placements, the effects matched to each name, loudness before and after).
"""
import json, os, re, subprocess, sys, math
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HW = os.environ.get('ODYSSEY_HALFWORLD') or os.path.join(os.path.dirname(ROOT), 'odyssey-halfworld')
SR = 48000
DUCK = 20 * math.log10(0.10 / 0.18)   # -5.1 dB, the bed law
RAMP = 0.150


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return 'ffmpeg'


FF = ffmpeg()


def decode(path, start=0.0, dur=None):
    cmd = [FF, '-v', 'error', '-ss', f'{start:.4f}']
    if dur is not None: cmd += ['-t', f'{dur:.4f}']
    cmd += ['-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(np.float64)


def write_wav(path, x):
    y = np.clip(x, -1, 1)
    pcm = (y * 32767).round().astype('<i2')
    n = len(pcm)
    with open(path, 'wb') as f:
        f.write(b'RIFF' + (36 + n * 4).to_bytes(4, 'little') + b'WAVEfmt ' + (16).to_bytes(4, 'little') + (1).to_bytes(2, 'little') +
                (2).to_bytes(2, 'little') + SR.to_bytes(4, 'little') + (SR * 4).to_bytes(4, 'little') + (4).to_bytes(2, 'little') +
                (16).to_bytes(2, 'little') + b'data' + (n * 4).to_bytes(4, 'little'))
        f.write(pcm.tobytes())


def loudness(x=None, path=None):
    """integrated LUFS, true peak dBTP, LRA, via ffmpeg ebur128"""
    tmp = None
    if path is None:
        tmp = os.path.join('/tmp', f'trsnd-{os.getpid()}.wav'); write_wav(tmp, x); path = tmp
    err = subprocess.run([FF, '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    if tmp: os.unlink(tmp)
    summ = err[err.rfind('Summary:'):]
    g = lambda k: float(re.search(k + r':\s+(-?[\d.]+|-inf)', summ)[1].replace('-inf', '-120'))
    return {'I': g('I'), 'LRA': g('LRA'), 'TP': g('Peak')}


# ───────────────────────────── the effects library (synthesised) ─────────────────────────────
def rng(seed):
    return np.random.default_rng(abs(hash(seed)) % (2 ** 32) if not isinstance(seed, int) else seed)


def shaped(n, lo, hi, seed=1, tilt=0.0):
    """noise band-limited lo..hi Hz (FFT), with a spectral tilt (dB/octave, negative = darker)"""
    r = np.random.default_rng(seed)
    X = np.fft.rfft(r.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    m = ((f >= lo) & (f <= hi)).astype(float)
    edge = lambda a, b: np.clip((f - a) / max(1, b - a), 0, 1)
    m = np.minimum(edge(lo * 0.7, lo), 1 - edge(hi, hi * 1.4)) if lo > 0 else 1 - edge(hi, hi * 1.4)
    if tilt: m = m * np.power(np.maximum(f, 20) / 1000.0, tilt / 6.02)
    y = np.fft.irfft(X * m, n)
    return y / (np.abs(y).max() + 1e-9)


def env_ad(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) * curve / max(d, 1e-3)))
    return e


def smoothnoise(n, rate, seed=1):
    """a slow random curve 0..1 changing about `rate` times a second"""
    r = np.random.default_rng(seed)
    k = max(2, int(n / SR * rate) + 3)
    pts = r.random(k)
    x = np.linspace(0, k - 3, n)
    i = np.floor(x).astype(int); u = x - i; u = u * u * (3 - 2 * u)
    return pts[i] * (1 - u) + pts[i + 1] * u


def st(mono, width=0.0, seed=3):
    """mono to stereo, a little decorrelated"""
    if width <= 0: return np.stack([mono, mono], 1)
    d = int(SR * 0.011 * width)
    other = np.concatenate([np.zeros(d), mono[:-d]]) if d else mono
    return np.stack([mono, other * (1 - 0.15 * width) + mono * 0.15 * width], 1)


def tone(n, f0, f1=None, kind='sine', seed=0):
    f1 = f0 if f1 is None else f1
    t = np.arange(n) / SR
    f = f0 * np.power(f1 / f0, t / max(t[-1], 1e-6)) if n > 1 else np.array([f0])
    ph = 2 * np.pi * np.cumsum(f) / SR
    if kind == 'saw': return 2 * ((ph / (2 * np.pi)) % 1) - 1
    if kind == 'square': return np.sign(np.sin(ph))
    return np.sin(ph)


def click(n=None, f=3500, dur=0.012, seed=1):
    m = int(dur * SR)
    return shaped(m, f * 0.5, f * 2.2, seed) * env_ad(m, 0.0005, dur, 6)


def place(out, at, x, g=1.0):
    a = int(round(at * SR))
    if a >= len(out): return
    b = min(len(out), a + len(x))
    if a < 0: x = x[-a:]; a = 0; b = min(len(out), len(x))
    out[a:b] += x[:b - a] * g


def lp1(x, fc):
    """one-pole low-pass, vectorised by FFT (for levels, not phase)"""
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 2), n)


# beds: (seconds) -> stereo array
def bed_fire(sec, seed=11, soft=1.0):
    n = int(sec * SR)
    base = shaped(n, 30, 260, seed, -3) * 0.35 * (0.7 + 0.3 * smoothnoise(n, 1.5, seed))
    hiss = shaped(n, 1500, 7000, seed + 1) * 0.04
    cr = np.zeros(n); r = np.random.default_rng(seed + 2)
    t = 0.0
    while t < sec:
        t += r.exponential(0.11 / soft)
        a = int(t * SR)
        if a >= n: break
        c = click(f=r.uniform(900, 4200), dur=r.uniform(0.004, 0.02), seed=int(r.integers(1e6))) * r.uniform(0.15, 0.9)
        cr[a:a + len(c)] += c[:max(0, n - a)]
    return st(base + hiss + cr * 0.5 * soft, 0.6)


def bed_wind(sec, seed=21, howl=0.0, low=False):
    n = int(sec * SR)
    lfo = smoothnoise(n, 0.35, seed)
    w = shaped(n, 120 if low else 200, 900 if low else 2400, seed, -2) * (0.35 + 0.65 * lfo)
    if howl:
        f = 380 + 260 * smoothnoise(n, 0.25, seed + 5)
        w += np.sin(2 * np.pi * np.cumsum(f) / SR) * howl * 0.25 * lfo ** 2 * shaped(n, 1, 8, seed + 6).clip(0, 1)
        w += shaped(n, 500, 1400, seed + 7) * howl * 0.3 * lfo ** 3
    return st(w, 1.0)


def bed_sea(sec, seed=31, big=1.0, calm=False):
    n = int(sec * SR)
    swell = smoothnoise(n, 0.18 if calm else 0.28, seed) ** 2
    wash = shaped(n, 60, 1800 if calm else 4000, seed, -3) * (0.15 + 0.85 * swell)
    body = shaped(n, 25, 180, seed + 1) * 0.5 * swell * big
    return st(wash * (0.5 if calm else 1.0) + body, 1.0)


def bed_crickets(sec, seed=41):
    n = int(sec * SR); out = np.zeros(n); r = np.random.default_rng(seed)
    for v in range(4):
        f = r.uniform(4200, 5200); period = r.uniform(0.45, 0.8); t = r.uniform(0, period)
        while t < sec:
            for k in range(3):
                m = int(0.022 * SR); a = int((t + k * 0.035) * SR)
                if a + m < n: out[a:a + m] += np.sin(2 * np.pi * f * np.arange(m) / SR) * np.hanning(m) * 0.25
            t += period * r.uniform(0.9, 1.1)
    return st(out, 0.8)


def bed_room(sec, seed=51):
    n = int(sec * SR)
    return st(shaped(n, 40, 900, seed, -4) * 0.12, 0.7)


def bed_breath(sec, seed=61, snore=False, period=4.2):
    n = int(sec * SR); t = np.arange(n) / SR
    cyc = (t % period) / period
    inhale = np.clip(np.sin(np.pi * np.clip(cyc / 0.42, 0, 1)), 0, 1) ** 1.5
    exhale = np.clip(np.sin(np.pi * np.clip((cyc - 0.48) / 0.45, 0, 1)), 0, 1) ** 1.5
    air = shaped(n, 150, 1400, seed, -3)
    x = air * (inhale * 0.55 + exhale * 0.8)
    if snore:
        buzz = tone(n, 38, kind='saw') * shaped(n, 20, 400, seed + 1).clip(0) * 2
        x += lp1(buzz, 500) * inhale * 0.9
    return st(x, 0.3)


def bed_storm(sec, seed=71):
    n = int(sec * SR)
    rain = shaped(n, 2000, 12000, seed) * 0.25
    return bed_wind(sec, seed + 1, howl=0.6) * 0.8 + bed_sea(sec, seed + 2) * 0.7 + st(rain, 1.0)


def bed_whisper(sec, seed=81):
    n = int(sec * SR); out = np.zeros(n); r = np.random.default_rng(seed)
    for v in range(6):
        f = r.uniform(900, 2600)
        out += shaped(n, f * 0.8, f * 1.25, seed + v) * smoothnoise(n, 3.5, seed + 10 + v) ** 3
    return st(out * 0.35, 1.0)


def bed_oars(sec, seed=91):
    n = int(sec * SR); out = np.zeros((n, 2)); t = 0.3
    while t < sec:
        place(out, t, hit_splash(0.5, seed=int(t * 100)) * 0.35)
        place(out, t + 0.55, hit_creak(0.35, seed=int(t * 77)) * 0.25)
        t += 1.45
    return out + bed_sea(sec, seed, calm=True) * 0.5


def bed_whirlpool(sec, seed=95, far=False):
    n = int(sec * SR)
    swirl = shaped(n, 60, 1400, seed, -2) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.6 * np.arange(n) / SR + smoothnoise(n, 0.5, seed) * 6))
    rum = shaped(n, 20, 120, seed + 1) * 0.9
    x = swirl * 0.6 + rum
    return st(lp1(x, 400) if far else x, 1.0) * (0.6 if far else 1.0)


def bed_thread(sec, seed=97):
    n = int(sec * SR); t = np.arange(n) / SR
    g = np.clip(np.sin(2 * np.pi * t / 2.2), 0, 1) ** 2
    return st(shaped(n, 2000, 8000, seed) * g * 0.18, 0.4)


# hits: -> stereo array
def hit_drum(sec=2.6, seed=101, deep=1.0):
    n = int(sec * SR); t = np.arange(n) / SR
    f = 44 * deep + 50 * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    skin = shaped(n, 60, 900, seed) * np.exp(-t * 22) * 0.6
    return st(np.tanh((body + skin) * 1.4), 0.2)


def hit_thunder(sec=5.0, seed=111, crack=1.0, far=False):
    n = int(sec * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed)
    rum = shaped(n, 18, 160, seed, -3)
    bumps = np.zeros(n)
    for k in range(7):
        c = r.uniform(0.05, sec * 0.6); w = r.uniform(0.15, 0.7)
        bumps += np.exp(-((t - c) / w) ** 2) * r.uniform(0.4, 1)
    env = np.clip(bumps, 0, 1.3) * np.exp(-t * 0.5) + np.exp(-t * 1.2) * 0.4
    x = rum * env
    if crack > 0 and not far:
        m = int(0.35 * SR)
        x[:m] += shaped(m, 400, 9000, seed + 1) * env_ad(m, 0.002, 0.3, 5) * crack * 0.9
    if far: x = lp1(x, 220) * 0.8
    return st(x, 1.0)


def hit_roar(sec=2.8, seed=121):
    n = int(sec * SR); t = np.arange(n) / SR
    f0 = 92 + 20 * np.sin(np.pi * t / sec) - 30 * t / sec
    x = sum(np.sin(2 * np.pi * np.cumsum(f0 * h) / SR) / h for h in range(1, 14))
    x *= 1 + 0.5 * shaped(n, 18, 45, seed)
    x += shaped(n, 200, 2500, seed + 1) * 0.5
    x = lp1(x, 1600)
    e = np.clip(t / 0.18, 0, 1) * np.clip((sec - t) / 1.0, 0, 1)
    return st(np.tanh(x * 0.7) * e, 0.6)


def hit_hiss(sec=1.8, seed=131):
    n = int(sec * SR)
    return st(shaped(n, 2500, 11000, seed) * env_ad(n, 0.03, sec, 3) * 0.8 + bed_fire(sec, seed, 2.0)[:, 0] * 0.3, 0.5)


def hit_splash(sec=1.4, seed=141, big=1.0):
    n = int(sec * SR); t = np.arange(n) / SR
    x = shaped(n, 100, 7000, seed, -2) * env_ad(n, 0.01, sec, 4) * big
    x += shaped(n, 30, 200, seed + 1) * np.exp(-t * 6) * big * 0.8
    return st(x, 0.7)


def hit_thud(sec=1.2, seed=151, crunch=0.3):
    n = int(sec * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(60 + 60 * np.exp(-t * 25)) / SR) * np.exp(-t * 5)
    x = body + shaped(n, 80, 3000, seed) * np.exp(-t * 14) * crunch
    return st(np.tanh(x * 1.5), 0.3)


def hit_rock(sec=2.2, seed=161):
    n = int(sec * SR); out = hit_thud(sec, seed, 0.6); r = np.random.default_rng(seed)
    for k in range(10):
        place(out, r.uniform(0.05, sec * 0.7), st(click(f=r.uniform(600, 2400), dur=r.uniform(0.02, 0.06), seed=k + seed)) * r.uniform(0.2, 0.6))
    out[:, 0] += shaped(n, 30, 400, seed + 9) * env_ad(n, 0.05, sec, 3) * 0.5
    out[:, 1] += shaped(n, 30, 400, seed + 9) * env_ad(n, 0.05, sec, 3) * 0.5
    return out


def hit_clang(sec=3.0, seed=171):
    n = int(sec * SR); t = np.arange(n) / SR
    parts = [(220, 1.0, 1.2), (583, 0.6, 1.8), (1034, 0.45, 2.6), (1616, 0.3, 3.5), (2311, 0.2, 5)]
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in parts)
    x[:200] += shaped(200, 1000, 8000, seed) * 0.8
    return st(x * 0.5, 0.4)


def hit_ticks(sec=1.2, seed=181, n_ticks=12, f=2600):
    out = np.zeros((int(sec * SR), 2))
    for k in range(n_ticks):
        place(out, k * (sec - 0.1) / n_ticks, st(click(f=f * (1 + 0.04 * (k % 3)), dur=0.01, seed=seed + k)) * 0.8)
    return out


def hit_clatter(sec=1.0, seed=191):
    out = np.zeros((int(sec * SR), 2)); r = np.random.default_rng(seed); t = 0.0; g = 1.0
    while t < sec - 0.05:
        place(out, t, st(click(f=r.uniform(1500, 4000), dur=0.015, seed=int(r.integers(1e6)))) * g)
        t += r.uniform(0.04, 0.14) * (1 + (1 - g)); g *= 0.8
    return out


def hit_whoosh(sec=0.7, seed=201):
    n = int(sec * SR); t = np.arange(n) / SR
    x = shaped(n, 300, 6000, seed) * np.sin(np.pi * t / sec) ** 2
    return st(x * 0.8, 1.0)


def hit_pluck(sec=1.6, seed=211, f=196.0, bright=0.6):
    n = int(sec * SR); p = int(SR / f); r = np.random.default_rng(seed)
    buf = r.uniform(-1, 1, p); y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % p]
        buf[i % p] = (1 - bright * 0.5) * buf[i % p] + bright * 0.5 * 0.996 * buf[(i + 1) % p] if True else 0
    return st(y * 0.7, 0.3)


def hit_creak(sec=0.8, seed=221):
    n = int(sec * SR); t = np.arange(n) / SR
    f = 26 + 18 * np.sin(np.pi * t / sec)
    pulses = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.97).astype(float)
    x = np.convolve(pulses, shaped(400, 400, 2400, seed) * np.hanning(400), 'same')
    return st(x * 0.6 * np.sin(np.pi * t / sec), 0.2)


def hit_scratch(sec=0.6, seed=231):
    n = int(sec * SR); t = np.arange(n) / SR
    f = 900 * (1 - 0.8 * t / sec) + 300 * np.sin(2 * np.pi * 7 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + shaped(n, 800, 6000, seed) * 0.4
    return st(x * env_ad(n, 0.005, sec, 2.5), 0.2)


def hit_rip(sec=0.9, seed=241):
    n = int(sec * SR); r = np.random.default_rng(seed)
    x = shaped(n, 700, 7000, seed) * (r.random(n) < 0.3) * env_ad(n, 0.02, sec, 3)
    return st(x * 1.2, 0.6)


def hit_burst(sec=2.0, seed=251):
    n = int(sec * SR); t = np.arange(n) / SR
    x = shaped(n, 25, 900, seed, -2) * env_ad(n, 0.02, sec, 3) * 1.4
    return np.tanh(st(x, 1.0) + bed_wind(sec, seed + 1, howl=0.8) * np.exp(-t * 0.8)[:, None])


def hit_voices(sec=1.6, seed=261, n_v=5, far=False, pitch=1.0, shh=False):
    n = int(sec * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed); out = np.zeros(n)
    if shh:
        return st(shaped(n, 2500, 9000, seed) * np.sin(np.pi * t / sec) ** 0.7 * 0.6, 0.8)
    for v in range(n_v):
        f0 = r.uniform(170, 330) * pitch * (1 + 0.25 * np.sin(np.pi * t / sec)) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))
        src = tone(n, 1, kind='sine') * 0  # placeholder
        saw = 2 * ((np.cumsum(f0) / SR) % 1) - 1
        spec = np.fft.rfft(saw); f = np.fft.rfftfreq(n, 1 / SR)
        form = sum(np.exp(-((f - F) / B) ** 2) for F, B in [(700, 120), (1150, 160), (2600, 300)])
        y = np.fft.irfft(spec * form, n) * r.uniform(0.5, 1)
        y *= np.clip(np.sin(np.pi * np.clip((t - r.uniform(0, 0.2)) / (sec * r.uniform(0.6, 0.95)), 0, 1)), 0, 1)
        out += y
    out /= (np.abs(out).max() + 1e-9)
    if far: out = lp1(out, 900) * 0.5
    return st(out * 0.6, 1.0)


def hit_oink(sec=0.45, seed=271):
    n = int(sec * SR); t = np.arange(n) / SR
    f0 = 260 - 80 * t / sec
    saw = 2 * ((np.cumsum(f0) / SR) % 1) - 1
    y = np.tanh(lp1(saw, 1400) * 2) * np.sin(np.pi * t / sec) ** 0.6
    return st(y * 0.6)


def hit_whine(sec=1.4, seed=281):
    n = int(sec * SR); t = np.arange(n) / SR
    f = 950 - 250 * t / sec + 20 * np.sin(2 * np.pi * 5 * t)
    return st(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / sec) ** 2 * 0.3)


def hit_axe(sec=2.4, seed=291):
    out = np.zeros((int(sec * SR), 2))
    for k, a in enumerate([0.1, 0.9, 1.7]):
        m = int(0.18 * SR); x = shaped(m, 400, 1800, seed + k) * env_ad(m, 0.001, 0.15, 5)
        place(out, a, st(x))
    return out


def hit_studs(sec=1.5, seed=301, rate=12, final=False):
    out = np.zeros((int(sec * SR), 2)); r = np.random.default_rng(seed)
    k = 0
    while k / rate < sec - 0.05:
        place(out, k / rate, st(click(f=r.uniform(3000, 4500), dur=0.008, seed=seed + k)) * r.uniform(0.4, 0.8)); k += 1
    if final: place(out, sec - 0.12, st(click(f=2600, dur=0.03, seed=seed + 999)) * 1.2)
    return out


def hit_breath(sec=1.2, seed=311):
    n = int(sec * SR); t = np.arange(n) / SR
    return st(shaped(n, 200, 2500, seed, -2) * np.sin(np.pi * t / sec) ** 2 * 0.5)


def hit_rumble_rise(sec=4.0, seed=321):
    n = int(sec * SR); t = np.arange(n) / SR
    return st(shaped(n, 20, 200, seed, -3) * (t / sec) ** 2 * 1.2, 1.0)


def hit_basin(sec=2.0, seed=331):
    out = np.zeros((int(sec * SR), 2)); r = np.random.default_rng(seed)
    for k in range(9):
        place(out, r.uniform(0, sec - 0.3), hit_splash(0.25, seed + k, 0.4) * 0.5)
    return out


# the library: name -> (kind, maker, level dB)
FX = {
    'fire': ('bed', lambda s: bed_fire(s), -24), 'fire-soft': ('bed', lambda s: bed_fire(s, 12, 0.4), -30),
    'wind': ('bed', lambda s: bed_wind(s), -24), 'wind-low': ('bed', lambda s: bed_wind(s, 22, low=True), -26),
    'wind-howl': ('bed', lambda s: bed_wind(s, 23, howl=1.0), -20), 'sea': ('bed', lambda s: bed_sea(s), -24),
    'sea-calm': ('bed', lambda s: bed_sea(s, 32, calm=True), -28), 'storm': ('bed', lambda s: bed_storm(s), -18),
    'crickets': ('bed', lambda s: bed_crickets(s), -30), 'room': ('bed', lambda s: bed_room(s), -38),
    'breathing': ('bed', lambda s: bed_breath(s), -24), 'snore': ('bed', lambda s: bed_breath(s, 62, snore=True), -22),
    'whisper': ('bed', lambda s: bed_whisper(s), -28), 'oars': ('bed', lambda s: bed_oars(s), -24),
    'whirlpool': ('bed', lambda s: bed_whirlpool(s), -20), 'whirlpool-far': ('bed', lambda s: bed_whirlpool(s, far=True), -28),
    'thread': ('bed', lambda s: bed_thread(s), -30), 'footsteps': ('bed', lambda s: sum_steps(s), -20),
    'drum': ('hit', lambda s: hit_drum(), -8), 'thunder': ('hit', lambda s: hit_thunder(), -12),
    'thunder-far': ('hit', lambda s: hit_thunder(6.0, 112, far=True), -18), 'thunder-small': ('hit', lambda s: hit_thunder(3.0, 113, 0.3, far=True), -24),
    'roar': ('hit', lambda s: hit_roar(), -10), 'hiss': ('hit', lambda s: hit_hiss(), -18), 'splash': ('hit', lambda s: hit_splash(1.6, 141, 1.2), -12),
    'splash-small': ('hit', lambda s: hit_splash(0.8, 142, 0.6), -22), 'thud': ('hit', lambda s: hit_thud(), -10), 'rock': ('hit', lambda s: hit_rock(), -12),
    'clang': ('hit', lambda s: hit_clang(), -16), 'ticks': ('hit', lambda s: hit_ticks(), -18), 'clatter': ('hit', lambda s: hit_clatter(), -18),
    'whoosh': ('hit', lambda s: hit_whoosh(), -16), 'bowstring': ('hit', lambda s: hit_pluck(2.2, 211, 147.0, 0.9), -14),
    'lyre': ('hit', lambda s: hit_pluck(2.5, 212, 294.0, 0.7), -16), 'creak': ('hit', lambda s: hit_creak(), -20),
    'scratch': ('hit', lambda s: hit_scratch(), -10), 'rip': ('hit', lambda s: hit_rip(), -14), 'burst': ('hit', lambda s: hit_burst(), -10),
    'yell': ('hit', lambda s: hit_voices(1.6, 261), -18), 'screams-far': ('hit', lambda s: hit_voices(2.0, 262, far=True, pitch=1.3), -24),
    'calling-far': ('hit', lambda s: hit_voices(2.5, 263, 3, far=True), -26), 'shh': ('hit', lambda s: hit_voices(1.0, 264, shh=True), -24),
    'oink': ('hit', lambda s: hit_oink(), -18), 'whine': ('hit', lambda s: hit_whine(), -28), 'axe': ('hit', lambda s: hit_axe(), -16),
    'stud': ('hit', lambda s: hit_studs(0.3, 301), -24), 'studs': ('hit', lambda s: hit_studs(min(3.0, s), 302), -18),
    'studs-final': ('hit', lambda s: hit_studs(min(3.0, s), 303, final=True), -16), 'breath': ('hit', lambda s: hit_breath(), -22),
    'rumble-rise': ('hit', lambda s: hit_rumble_rise(min(5.0, s)), -14), 'basin': ('hit', lambda s: hit_basin(), -24),
    'squelch': ('hit', lambda s: hit_clatter(0.25, 192), -16),
}


def sum_steps(sec):
    out = np.zeros((int(sec * SR), 2)); t = 0.2
    while t < sec:
        place(out, t, hit_thud(0.9, int(t * 10), 0.15) * 0.8); t += 0.95
    return out


# name -> library keys (first matching rule wins; several keys allowed)
RULES = [
    (r'\bscore\b|the score|choir|no music|no wind', []),
    (r"single low drum \(the score's\)", []),
    (r'drum', ['drum']), (r'thunder from a clear sky|thunder crack|thunderbolt', ['thunder']),
    (r'small and polite', ['thunder-small']), (r'thunder', ['thunder-far']),
    (r'roar', ['roar']), (r'whirlpool.*far|far below', ['whirlpool-far']), (r'whirlpool', ['whirlpool']),
    (r'hiss|sizzle', ['hiss']), (r'splash, small', ['splash-small']), (r'splash|wave hit|^wave$', ['splash']),
    (r'squelch', ['squelch']), (r'whoomph|burst', ['burst']),
    (r'record scratch', ['scratch']), (r'sail rips|tearing|splinter|cable parts', ['rip', 'rock']),
    (r'boulder|rock|crash|hulls crushed|heads strike|tree fall', ['rock']), (r'thud|tail thump', ['thud']),
    (r'bronze|clang', ['clang']), (r'twelve ticks|ticks', ['ticks']), (r'clatter|cup falls|clack|bowl', ['clatter']),
    (r'arrows spill', ['clatter']), (r'whoosh|arrow', ['whoosh']),
    (r'swallow|bowstring|string sings|string pulled|bowstring creaks', ['bowstring']), (r'lyre', ['lyre']),
    (r'creak|knot', ['creak']), (r'final click', ['studs-final']), (r'snapping on', ['studs']), (r'stud clicks', ['stud']),
    (r'shhh', ['shh']), (r'scream.*far|screams, far', ['screams-far']), (r'scream|yell', ['yell']), (r'calling', ['calling-far']),
    (r'oink', ['oink']), (r'whine', ['whine']), (r'axe', ['axe']), (r'a breath', ['breath']), (r'rising rumble', ['rumble-rise']),
    (r'basin', ['basin']), (r'giant footsteps', ['footsteps']),
    (r'snore', ['snore']), (r'breathing', ['breathing']), (r'crickets', ['crickets']), (r'room tone', ['room']),
    (r'whisper', ['whisper']), (r'oars', ['oars']), (r'thread|shuttle', ['thread']), (r'storm', ['storm']),
    (r'lamp|torch|distant fire', ['fire-soft']), (r'fire|ember|crackle', ['fire']),
    (r'howl|high wind|wind straining|in the gate', ['wind-howl']), (r'wind, low|wind dying', ['wind-low']), (r'wind', ['wind']),
    (r'sea, calm|water on logs|hull through', ['sea-calm']), (r'surf|sea|waves?|water', ['sea']),
]


def match(name):
    s = name.lower()
    for pat, keys in RULES:
        if re.search(pat, s): return keys
    return None


def render_fx(key, sec, cache):
    ck = (key, round(sec, 2)) if FX[key][0] == 'bed' or key.startswith('studs') or key in ('rumble-rise',) else (key, 0)
    if ck not in cache:
        x = FX[key][1](sec)
        pk = np.abs(x).max() + 1e-9
        cache[ck] = x / pk * 10 ** (FX[key][2] / 20)
    return cache[ck]


def rc_ramp(t, a, e, r):
    """1 inside [a, e], raised-cosine ramps of r outside"""
    w = np.zeros_like(t)
    w[(t >= a) & (t <= e)] = 1
    m = (t > a - r) & (t < a); w[m] = 0.5 - 0.5 * np.cos(np.pi * (t[m] - (a - r)) / r)
    m = (t > e) & (t < e + r); w[m] = 0.5 + 0.5 * np.cos(np.pi * (t[m] - e) / r)
    return w


def mix(doc, voice_lufs=-16.0, target=-14.0, tp=-1.0, verbose=True):
    R = doc['runtime']; n = int(round(R * SR)); t = np.arange(n) / SR
    music = np.zeros((n, 2)); voice = np.zeros((n, 2)); fx = np.zeros((n, 2)); log = {'music': [], 'voice': [], 'sfx': []}
    # music
    for m in doc['music']:
        path = os.path.join(HW, m['file']); d = m['out'] - m['in']
        x = decode(path, m['in'], d)
        k = len(x); tt = np.arange(k) / SR
        g = np.ones(k)
        fi, fo = m.get('fade_in', 0) or 0, m.get('fade_out', 0) or 0
        if fi > 0: g *= np.where(tt < fi, 0.5 - 0.5 * np.cos(np.pi * np.clip(tt / fi, 0, 1)), 1)
        if fo > 0: g *= np.where(tt > d - fo, 0.5 - 0.5 * np.cos(np.pi * np.clip((d - tt) / fo, 0, 1)), 1)
        place(music, m['at'], x * g[:, None], 10 ** ((m.get('gain', 0) or 0) / 20))
        log['music'].append({'track': m['track'], 'at': m['at'], 'in': m['in'], 'out': m['out'], 'gain': m.get('gain', 0)})
    # voice
    man = json.load(open(os.path.join(HW, 'drive', 'voice-manifest.json')))
    spans = []
    for s in doc['shots']:
        v = s.get('voice')
        if not v: continue
        seg = next(g for g in man[v['scene']]['segments'] if g['gi'] == v['gi'])
        a, b = seg['start'] + v['clip']['in'], seg['start'] + v['clip']['out']
        x = decode(os.path.join(HW, man[v['scene']]['file']), a, b - a)
        e = int(0.012 * SR); w = np.ones(len(x)); w[:e] = np.linspace(0, 1, e); w[-e:] = np.linspace(1, 0, e)
        L = loudness(x)['I']
        gdb = voice_lufs - L + (v.get('gain', 0) or 0)
        at = s['at'] + v['at']
        place(voice, at, x * w[:, None], 10 ** (gdb / 20))
        spans.append((at, at + (b - a), s.get('duck_db')))
        log['voice'].append({'shot': s['n'], 'speaker': v['speaker'], 'words': v['words'], 'at': round(at, 3), 'dur': round(b - a, 3), 'clip_lufs': L, 'gain_db': round(gdb, 1)})
    # the duck
    gd = np.zeros(n)
    for a, e, deep in spans:
        w = rc_ramp(t, a, e, RAMP)
        gd = np.minimum(gd, w * (deep if deep is not None else DUCK))
    music *= (10 ** (gd / 20))[:, None]
    # sfx
    cache = {}; beds = {}
    for s in doc['shots']:
        for name in s.get('sfx', []):
            keys = match(name)
            if keys is None:
                log['sfx'].append({'shot': s['n'], 'name': name, 'fx': None}); continue
            trim = (s.get('sfx_gain') or {}).get(name, 0)
            off = (s.get('sfx_at') or {}).get(name)
            for k in keys:
                if FX[k][0] == 'bed' and off is None:
                    beds.setdefault(k, []).append((s['at'], s['at'] + s['dur'], trim))
                else:
                    x = render_fx(k, s['dur'], cache)
                    place(fx, s['at'] + (off or 0.0), x, 10 ** (trim / 20))
            log['sfx'].append({'shot': s['n'], 'name': name, 'fx': keys, 'at': round(s['at'] + (off or 0), 3), 'trim': trim})
    for k, spans_k in beds.items():
        long = render_fx(k, R + 0.5, cache)[:n]
        gate = np.zeros(n)
        for a, e, trim in spans_k:
            gate = np.maximum(gate, rc_ramp(t, a + 0.06, e - 0.06, 0.06) * 10 ** (trim / 20))
        fx += long * gate[:, None]
    mixd = music + voice + fx
    pre = loudness(mixd)
    # master: to the target, then a limiter so the true peak stays below tp
    g = 10 ** ((target - pre['I']) / 20)
    y = mixd * g
    tmp_in = f'/tmp/trsnd-in-{os.getpid()}.wav'; tmp_out = f'/tmp/trsnd-out-{os.getpid()}.wav'
    for it in range(3):
        write_float_wav(tmp_in, y)
        lim = 10 ** ((tp - 0.6) / 20)
        subprocess.run([FF, '-v', 'error', '-y', '-i', tmp_in, '-af', f'aresample=192000,alimiter=limit={lim:.4f}:attack=2:release=60:level=false:asc=true,aresample={SR}',
                        '-c:a', 'pcm_f32le', tmp_out], check=True)
        z = decode(tmp_out)[:n]
        if len(z) < n: z = np.vstack([z, np.zeros((n - len(z), 2))])
        post = loudness(z)
        if abs(post['I'] - target) <= 0.3 and post['TP'] <= tp: break
        y = y * 10 ** ((target - post['I']) / 20)
    os.unlink(tmp_in); os.unlink(tmp_out)
    log['loudness'] = {'premaster': pre, 'final': post, 'target': target, 'tp_max': tp}
    # stems' loudness, for the review
    log['stems'] = {k: loudness(v * g)['I'] if np.abs(v).max() > 0 else None for k, v in (('music', music), ('voice', voice), ('sfx', fx))}
    return z, log


def write_float_wav(path, x):
    x = x.astype('<f4'); n = len(x)
    with open(path, 'wb') as f:
        f.write(b'RIFF' + (36 + n * 8).to_bytes(4, 'little') + b'WAVEfmt ' + (16).to_bytes(4, 'little') + (3).to_bytes(2, 'little') +
                (2).to_bytes(2, 'little') + SR.to_bytes(4, 'little') + (SR * 8).to_bytes(4, 'little') + (8).to_bytes(2, 'little') +
                (32).to_bytes(2, 'little') + b'data' + (n * 8).to_bytes(4, 'little'))
        f.write(x.tobytes())


def main(argv):
    opt = lambda k, d=None: argv[argv.index('--' + k) + 1] if '--' + k in argv else d
    fxdir = opt('fx-dir', os.path.join(ROOT, 'films/trailers/fx'))
    if '--fx-only' in argv:
        os.makedirs(fxdir, exist_ok=True); cache = {}
        for k in FX:
            write_wav(os.path.join(fxdir, k + '.wav'), render_fx(k, 6.0, cache) * 3)
        print('wrote', len(FX), 'effects to', fxdir); return 0
    tid = next(a for a in argv if not a.startswith('--') and argv[argv.index(a) - 1] not in ('--out', '--lufs', '--tp', '--fx-dir', '--voice-lufs', '--doc'))
    doc = json.load(open(opt('doc') or os.path.join(ROOT, 'odyssey/trailers', tid + '.json')))
    out = opt('out', os.path.join(ROOT, 'films/trailers', tid + '.wav'))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    z, log = mix(doc, float(opt('voice-lufs', -16)), float(opt('lufs', -14)), float(opt('tp', -1.0)))
    write_wav(out, z)
    unmatched = [e['name'] for e in log['sfx'] if e['fx'] is None]
    json.dump(log, open(out[:-4] + '.sound.json', 'w'), indent=1)
    L = log['loudness']
    print(f"{tid}: {len(z) / SR:.3f} s; premaster {L['premaster']['I']:.1f} LUFS; final {L['final']['I']:.1f} LUFS integrated, "
          f"true peak {L['final']['TP']:.1f} dBTP, LRA {L['final']['LRA']:.1f} LU; stems {json.dumps(log['stems'])}"
          + (f"; unmatched sfx: {unmatched}" if unmatched else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
