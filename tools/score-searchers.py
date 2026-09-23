#!/usr/bin/env python3
"""tools/score-searchers.py: an original score for the Searchers case (case-searchers), written in the manner of a 1950s
Western studio score: dark low strings, a horn call, a finger-picked guitar, a trotting woodblock, a warm string and male-voice
theme for the homecoming, a hard stop where the man turns away, a lone harmonica into the desert.

It is not Max Steiner's score and not the song "What Makes a Man to Wander?" (both still in copyright). Every note is written
here, timed to the cut: the card and the door 0-10.5 s, the sighting and the approach 10.5-25.7, home and inside 25.7-42.75,
the stop at 42.75, the leaving and the card to 51.8.

Usage: python3 tools/score-searchers.py [out.wav]   (then ffmpeg to .ogg; the repository keeps world/music/searchers-score.ogg)
"""
import sys
import numpy as np
from scipy.signal import butter, lfilter, fftconvolve

SR = 44100
DUR = 52.6
rng = np.random.default_rng(1956)
L = np.zeros(int(DUR * SR)); R = np.zeros(int(DUR * SR))

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
N = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
def midi(s):
    name, octv = (s[:-1], int(s[-1]))
    name = {'Bb': 'A#', 'Eb': 'D#', 'Ab': 'G#', 'Db': 'C#', 'Gb': 'F#'}.get(name, name)
    return 12 * (octv + 1) + N[name]

def env(n, a, r, sustain=1.0):
    e = np.ones(n) * sustain; ai = max(1, int(a * SR)); ri = max(1, int(r * SR))
    e[:ai] = np.linspace(0, sustain, ai)[:n] if ai <= n else np.linspace(0, sustain, n)
    if ri < n: e[-ri:] *= np.linspace(1, 0, ri)
    return e

def lp(x, f, order=2):
    b, a = butter(order, min(0.99, f / (SR / 2)), 'low'); return lfilter(b, a, x)
def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), min(0.99, hi / (SR / 2))], 'band'); return lfilter(b, a, x)

def saw(ph): return 2 * (ph - np.floor(ph + 0.5))

def add(sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR); j = min(len(L), i + len(sig)); s = sig[:j - i] * gain
    L[i:j] += s * np.cos((pan + 1) * np.pi / 4); R[i:j] += s * np.sin((pan + 1) * np.pi / 4)

def vib_phase(f, n, rate=5.4, cents=9, delay=0.25, seed=0):
    t = np.arange(n) / SR; depth = np.clip((t - delay) / 0.5, 0, 1) * cents
    fm = f * 2 ** (depth * np.sin(2 * np.pi * rate * t + seed) / 1200)
    return np.cumsum(fm) / SR

def strings(note, t0, dur, amp=0.1, pan=0.0, att=0.45, rel=1.0, bright=2600):
    n = int((dur + rel) * SR); f = hz(midi(note)); out = np.zeros(n)
    for k, dc in enumerate([-8, -3, 0, 4, 9]):
        out += saw(vib_phase(f * 2 ** (dc / 1200), n, rate=5.2 + k * 0.23, seed=k * 1.7))
    out = lp(out, bright) * env(n, att, rel) / 5
    add(out, t0, pan, amp)

def horn(note, t0, dur, amp=0.11, pan=-0.2):
    n = int((dur + 0.5) * SR); f = hz(midi(note)); x = saw(vib_phase(f, n, rate=4.8, cents=6, delay=0.35))
    x = lp(x, 1400) + 0.4 * bp(x, 400, 1100); add(x * env(n, 0.09, 0.5), t0, pan, amp)

def choir(note, t0, dur, amp=0.07, pan=0.0):   # male voices on 'oo': saws through the vowel's two formants
    n = int((dur + 0.9) * SR); f = hz(midi(note)); out = np.zeros(n)
    for k, dc in enumerate([-11, -4, 3, 10]):
        out += saw(vib_phase(f * 2 ** (dc / 1200), n, rate=5.0 + k * 0.3, cents=14, delay=0.3, seed=k))
    out = 0.9 * bp(out, 240, 420) + 0.35 * bp(out, 700, 1000) + 0.02 * rng.standard_normal(n)
    add(out * env(n, 0.55, 0.9) / 4, t0, pan, amp)

def pluck(note, t0, amp=0.16, pan=0.25, decay=0.996):   # Karplus-Strong: a nylon string
    f = hz(midi(note)); p = int(SR / f); n = int(2.2 * SR); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = decay * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    add(lp(out, 3200) * np.exp(-np.arange(n) / SR * 1.2), t0, pan, amp)

def harmonica(note, t0, dur, amp=0.1, pan=0.1):
    n = int((dur + 0.3) * SR); ph = vib_phase(hz(midi(note)), n, rate=6.1, cents=16, delay=0.2)
    x = np.where((ph % 1) < 0.34, 1.0, -0.5) + 0.12 * rng.standard_normal(n)
    x = bp(x, 700, 3400) * env(n, 0.06, 0.25); add(x, t0, pan, amp)

def timpani(note, t0, amp=0.35, dec=1.4):
    n = int((dec + 0.4) * SR); t = np.arange(n) / SR; f = hz(midi(note))
    x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.06 * np.exp(-t * 18))) / SR) * np.exp(-t / dec * 3)
    x += 0.25 * lp(rng.standard_normal(n), 400) * np.exp(-t * 20); add(x, t0, 0.0, amp)

def woodblock(t0, hi=True, amp=0.12):
    n = int(0.15 * SR); t = np.arange(n) / SR; f = 900 if hi else 680
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 55) + 0.3 * bp(rng.standard_normal(n), 1500, 4000) * np.exp(-t * 90); add(x, t0, 0.35 if hi else -0.35, amp)

# ── A: the card and the door (0 to 10.5): D minor in the low strings, a horn out of the dark, a timpani roll into the light ──
for nt in ['D2', 'A2', 'D3', 'F3']: strings(nt, 0.2, 5.0, 0.085, att=1.8, rel=1.2)
for nt in ['Bb1', 'F2', 'Bb2', 'D3']: strings(nt, 5.2, 2.8, 0.085, att=0.6, rel=1.0)
for nt in ['A1', 'E2', 'A2', 'C#3', 'E3']: strings(nt, 8.0, 2.5, 0.09, att=0.5, rel=0.9)
for t, nt, d in [(3.0, 'A3', 0.7), (3.7, 'D4', 1.1), (4.8, 'E4', 0.45), (5.25, 'F4', 1.3), (6.55, 'E4', 0.6), (7.15, 'D4', 1.9)]: horn(nt, t, d)
for k in range(14): timpani('A1', 9.35 + k * 0.08, amp=0.05 + k * 0.012, dec=0.5)

# ── B: the sighting, Martha, the approach (10.5 to 25.7): the guitar picks, the horn calls when she knows him, the woodblock trots ──
prog = [(10.5, ['D3', 'A3', 'D4', 'F#4']), (12.8, ['G2', 'D3', 'G3', 'B3']), (15.1, ['D3', 'A3', 'D4', 'F#4']), (17.4, ['A2', 'E3', 'A3', 'C#4']),
        (19.7, ['B2', 'F#3', 'B3', 'D4']), (22.0, ['G2', 'D3', 'G3', 'B3']), (24.0, ['A2', 'E3', 'A3', 'C#4'])]
eighth = 0.36
for i, (t0, ch) in enumerate(prog):
    t1 = prog[i + 1][0] if i + 1 < len(prog) else 25.7; k = 0; t = t0
    while t < t1 - 0.05:
        nt = [ch[0], ch[2], ch[1], ch[3], ch[2], ch[3]][k % 6]; pluck(nt, t, amp=0.13 + (0.03 if k % 6 == 0 else 0)); t += eighth; k += 1
    for nt in ch[:3]: strings(nt, t0, t1 - t0 + 0.2, 0.03 + 0.03 * i / len(prog), att=1.0, rel=0.8)
for t, nt, d in [(16.6, 'D4', 0.5), (17.1, 'A4', 1.5), (18.7, 'G4', 0.4), (19.1, 'F#4', 0.6), (19.75, 'E4', 1.6)]: horn(nt, t, d, amp=0.13, pan=-0.25)
t = 20.5
while t < 25.5: woodblock(t, True); woodblock(t + 0.27, False, 0.09); t += 0.72

# ── C: home and inside (25.7 to 42.75): the theme on strings and male voices, D major ──
b = 0.909
mel = [('F#4', 1.5), ('E4', 0.5), ('D4', 1), ('A3', 1), ('B3', 1), ('D4', 1), ('G4', 1.5), ('F#4', 0.5), ('E4', 1), ('F#4', 0.5), ('G4', 0.5), ('A4', 2),
       ('B4', 1.5), ('A4', 0.5), ('F#4', 1), ('D4', 1), ('E4', 1), ('D4', 1.7)]
t = 25.7
for nt, d in mel:
    strings(nt, t, d * b * 0.98, 0.17, pan=0.15, att=0.18, rel=0.6, bright=3400); strings(nt[:-1] + str(int(nt[-1]) + 1), t, d * b * 0.98, 0.06, pan=0.3, att=0.2, rel=0.6, bright=4200)
    t += d * b
chords = [(25.7, ['D3', 'F#3', 'A3'], ['D2', 'A2']), (29.34, ['D3', 'G3', 'B3'], ['G1', 'D2']), (32.98, ['E3', 'G3', 'B3'], ['E2', 'B2']), (34.8, ['E3', 'A3', 'C#4'], ['A1', 'E2']),
          (36.61, ['D3', 'F#3', 'B3'], ['B1', 'F#2']), (38.43, ['D3', 'G3', 'B3'], ['G1', 'D2']), (40.25, ['C#3', 'E3', 'A3'], ['A1', 'E2']), (41.16, ['D3', 'F#3', 'A3'], ['D2', 'A2'])]
for i, (t0, ch, bass) in enumerate(chords):
    t1 = chords[i + 1][0] if i + 1 < len(chords) else 42.7
    for nt in ch: choir(nt, t0, t1 - t0, 0.16, pan=-0.1)
    for nt in bass: strings(nt, t0, t1 - t0, 0.11, att=0.35, rel=0.7, bright=1800)
timpani('D2', 25.7, amp=0.28, dec=2.0)

# ── D: the stop and the leaving (42.75 to the end): one low blow, then the harmonica alone, the strings holding a low D under the card ──
for nt in ['D1', 'D2', 'A2', 'F3']: strings(nt, 42.75, 0.9, 0.07, att=0.02, rel=1.4, bright=1600)
timpani('D1', 42.75, amp=0.28, dec=2.2)
for t, nt, d in [(44.6, 'A4', 0.6), (45.2, 'D5', 1.6), (46.9, 'C5', 0.5), (47.4, 'A4', 0.6), (48.0, 'G4', 0.5), (48.5, 'F4', 0.6), (49.1, 'E4', 0.6), (49.7, 'D4', 1.9)]: harmonica(nt, t, d)
for nt in ['D2', 'A2']: strings(nt, 45.5, 5.8, 0.05, att=2.5, rel=1.2, bright=1200)

# ── the room: a stereo hall two seconds long, a third wet ──
n = int(2.3 * SR); t = np.arange(n) / SR; decay = np.exp(-t / 2.3 * 6.9)
irL = rng.standard_normal(n) * decay; irR = rng.standard_normal(n) * decay; irL = lp(irL, 5000); irR = lp(irR, 5000)
wetL = fftconvolve(L, irL)[:len(L)]; wetR = fftconvolve(R, irR)[:len(R)]
wet = 0.3 / max(np.abs(wetL).max(), np.abs(wetR).max(), 1e-9) * max(np.abs(L).max(), 1e-9)
outL = L + wetL * wet; outR = R + wetR * wet
peak = max(np.abs(outL).max(), np.abs(outR).max()); outL, outR = outL / peak * 0.89, outR / peak * 0.89
fade = int(1.0 * SR); outL[-fade:] *= np.linspace(1, 0, fade); outR[-fade:] *= np.linspace(1, 0, fade)
pcm = (np.stack([outL, outR], 1) * 32767).astype('<i2')
out = sys.argv[1] if len(sys.argv) > 1 else 'searchers-score.wav'
import wave
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', out, round(len(outL) / SR, 2), 's')
