#!/usr/bin/env python3
"""tools/score-searchers.py: an original score for the Searchers case (case-searchers), written in the manner of a 1950s
Western studio score: low strings, horn calls, a finger-picked guitar, a flute over the flat, a trotting woodblock, a fiddle
for the old man, a wordless male choir, a harmonica, and a full orchestral close on the door.

The case is cut shot for shot to the film's ending, so this score follows the ending's music as a map, not as notes: the
same key areas at the same seconds (E major on the porch, a lift through A-flat as the riders are seen, a bright D major as
the girl runs, D minor on Martha, E major dying away under the lift from the saddle, A major for Mose, C-sharp minor and D
major on the homecoming, a low dark A in the room, E major on the man alone, the choir as he turns, a rising A major into the
door), and the same loudness second by second: LOUD below is the ending's level in dB, one value a half second, measured
from a reference copy, and the mix is ridden to it at the end. Every note is written here. It is not Max Steiner's score and
not the song "What Makes a Man to Wander?" / "Ride Away" (both still in copyright), and no audio of them is used.

Usage: python3 tools/score-searchers.py [out.wav]   (then ffmpeg to .ogg; the repository keeps world/music/searchers-score.ogg)
"""
import sys
import numpy as np
from scipy.signal import butter, lfilter, fftconvolve

SR = 44100
DUR = 111.5
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


def flute(note, t0, dur, amp=0.07, pan=0.3):   # a sine with its octave, a breath on the attack, a slow vibrato
    n = int((dur + 0.4) * SR); ph = vib_phase(hz(midi(note)), n, rate=5.0, cents=12, delay=0.2)
    x = np.sin(2 * np.pi * ph) + 0.18 * np.sin(4 * np.pi * ph) + 0.05 * bp(rng.standard_normal(n), 1500, 6000) * np.exp(-np.arange(n) / SR * 6)
    add(x * env(n, 0.05, 0.3), t0, pan, amp)

def chord(t0, t1, notes, amp=0.07, att=0.6, rel=1.0, bright=2400, pan=0.0):
    for i, nt in enumerate(notes): strings(nt, t0, t1 - t0, amp, pan=pan + (i - len(notes) / 2) * 0.08, att=att, rel=rel, bright=bright)

def trem(note, t0, dur, amp=0.05, rate=11.0, pan=0.0):   # bowed tremolo, for the build
    n = int((dur + 0.5) * SR); x = saw(vib_phase(hz(midi(note)), n, cents=5)); t = np.arange(n) / SR
    x = lp(x, 2800) * (0.55 + 0.45 * np.sin(2 * np.pi * rate * t)) * env(n, dur * 0.6, 0.5); add(x, t0, pan, amp)

def arp(t0, t1, ch, step=0.3, amp=0.12):
    k, t = 0, t0
    while t < t1 - 0.05: pluck([ch[0], ch[2], ch[1], ch[3], ch[2], ch[3]][k % 6], t, amp=amp + (0.03 if k % 6 == 0 else 0)); t += step; k += 1

def line(t0, notes, beat, fn, **kw):
    t = t0
    for nt, d in notes:
        if nt: fn(nt, t, d * beat * 0.97, **kw)
        t += d * beat
    return t

# ── 1  the porch, 0 to 6: E major low and still, a horn from far off ──
chord(0.2, 6.2, ['E2', 'B2', 'E3', 'G#3'], 0.08, att=2.0, rel=1.2, bright=1600)
line(2.0, [('B3', 0.8), ('E4', 1.2), ('F#4', 0.5), ('G#4', 1.8)], 1.0, horn, amp=0.08)
# ── 2  the pool, 6 to 13.5: up through A-flat and E-flat, a tremolo building, a timpani roll into the cut ──
chord(6.0, 8.0, ['Ab1', 'Eb2', 'Ab2', 'C3'], 0.075, att=0.8); chord(8.0, 9.5, ['F1', 'C2', 'F2', 'Ab2'], 0.075, att=0.5)
chord(9.5, 11.0, ['Eb2', 'Bb2', 'Eb3', 'G3'], 0.085, att=0.4); chord(11.0, 12.7, ['Ab2', 'Eb3', 'Ab3', 'C4'], 0.09, att=0.4); chord(12.7, 13.6, ['A2', 'E3', 'G3', 'C#4'], 0.09, att=0.3)
for nt in ['Eb4', 'G4', 'Bb4']: trem(nt, 7.0, 6.4, 0.035)
line(8.5, [('Eb4', 0.6), ('Ab4', 1.0), ('Bb4', 0.5), ('C5', 1.6)], 1.0, horn, amp=0.11)
for k in range(15): timpani('A1', 12.3 + k * 0.08, amp=0.04 + k * 0.012, dec=0.5)
# ── 3-4  Lucy runs and the riders come in, 13.5 to 29: D major, the guitar, the flute over the flat, the trot ──
prog = [(13.5, ['D3', 'A3', 'D4', 'F#4']), (16.0, ['G2', 'D3', 'G3', 'B3']), (18.5, ['D3', 'A3', 'D4', 'F#4']), (21.0, ['A2', 'E3', 'A3', 'C#4']), (23.5, ['B2', 'F#3', 'B3', 'D4']), (25.5, ['G2', 'D3', 'G3', 'B3']), (27.5, ['A2', 'E3', 'A3', 'C#4'])]
for i, (t0, ch) in enumerate(prog):
    t1 = prog[i + 1][0] if i + 1 < len(prog) else 29.0; arp(t0, t1, ch, 0.3, 0.11); chord(t0, t1 + 0.2, ch[:3], 0.035, att=0.8, rel=0.8, bright=3000)
line(17.0, [('A5', 0.5), ('F#5', 0.5), ('A5', 1), ('B5', 0.5), ('A5', 0.5), ('F#5', 1), ('E5', 0.5), ('D5', 1.5)], 0.5, flute)
line(22.0, [('F#5', 0.5), ('G5', 0.5), ('A5', 1), ('D6', 1), ('C#6', 0.5), ('B5', 0.5), ('A5', 2)], 0.5, flute)
line(25.5, [('B5', 1), ('A5', 0.5), ('G5', 0.5), ('F#5', 1), ('E5', 1), ('D5', 2)], 0.55, flute)
t = 20.5
while t < 28.8: woodblock(t, True, 0.1); woodblock(t + 0.27, False, 0.08); t += 0.72
# ── 4 (end), 29 to 33.4: D major lower, a horn alone ──
chord(29.0, 33.5, ['D2', 'A2', 'D3', 'F#3'], 0.07, att=0.8, bright=1800)
line(29.5, [('A3', 0.8), ('D4', 1.0), ('F#4', 0.6), ('E4', 0.6), ('D4', 1.4)], 1.0, horn, amp=0.09)
# ── 5  Martha, 33.4 to 40: D minor, F, and a turn to E; a reed-like line on the horn, darker ──
chord(33.4, 35.0, ['D2', 'A2', 'D3', 'F3'], 0.08, att=0.5); chord(35.0, 37.0, ['F2', 'C3', 'F3', 'A3'], 0.075); chord(37.0, 38.5, ['Bb1', 'F2', 'D3', 'F3'], 0.075); chord(38.5, 40.0, ['E2', 'G#2', 'D3', 'B3'], 0.08)
line(34.0, [('A4', 1), ('F4', 0.5), ('E4', 0.5), ('D4', 1.5), ('F4', 0.5), ('G4', 0.5), ('A4', 1), ('G#4', 1.4)], 1.0, horn, amp=0.08, pan=0.2)
# ── 6  down from the horse, 40 to 47: E major, dying away to almost nothing ──
chord(40.0, 45.5, ['E2', 'B2', 'E3', 'G#3'], 0.07, att=0.4, rel=1.6, bright=1500)
for i, nt in enumerate(['E5', 'B4', 'G#4', 'E4', 'B3']): pluck(nt, 40.4 + i * 0.55, amp=0.1, pan=-0.2)
# ── 7  Mose, 47.5 to 55.2: A major, a fiddle over the guitar, a light trot ──
prog = [(47.5, ['A2', 'E3', 'A3', 'C#4']), (49.5, ['D3', 'A3', 'D4', 'F#4']), (51.5, ['E2', 'B2', 'E3', 'G#3']), (53.5, ['A2', 'E3', 'A3', 'C#4'])]
for i, (t0, ch) in enumerate(prog): t1 = prog[i + 1][0] if i + 1 < len(prog) else 55.2; arp(t0, t1, ch, 0.25, 0.1)
fid = lambda nt, t0, d, **kw: strings(nt, t0, d, 0.1, pan=0.25, att=0.03, rel=0.25, bright=4200)
line(48.0, [('E5', 1), ('C#5', 1), ('A4', 1), ('C#5', 1), ('E5', 1), ('F#5', 1), ('E5', 2)], 0.25, fid)
line(50.0, [('F#5', 1), ('D5', 1), ('A4', 1), ('D5', 1), ('F#5', 1), ('A5', 1), ('F#5', 2)], 0.25, fid)
line(52.0, [('G#5', 1), ('E5', 1), ('B4', 1), ('E5', 1), ('G#5', 1), ('B5', 1), ('A5', 4)], 0.25, fid)
t = 48.0
while t < 55.0: woodblock(t, True, 0.06); t += 0.5
# ── 8  home, 55.2 to 69: C-sharp minor into A and E, then the homecoming line in D ──
chord(55.2, 57.5, ['C#2', 'G#2', 'C#3', 'E3'], 0.075, att=0.7); chord(57.5, 60.0, ['A1', 'E2', 'A2', 'C#3', 'E3'], 0.075); chord(60.0, 63.0, ['E2', 'B2', 'E3', 'G#3'], 0.075)
line(55.5, [('G#4', 1.5), ('E4', 0.5), ('C#4', 1), ('E4', 1), ('A4', 1.5), ('G#4', 0.5), ('E4', 2), ('F#4', 1), ('G#4', 1), ('A4', 1), ('B4', 1.4)], 0.62, strings, amp=0.12, pan=0.15, att=0.2, rel=0.6, bright=3400)
chord(63.0, 66.0, ['D2', 'A2', 'D3', 'F#3'], 0.07); chord(66.0, 69.2, ['G1', 'D2', 'G2', 'B2'], 0.07)
line(63.0, [('F#4', 1.5), ('E4', 0.5), ('D4', 1), ('A3', 1), ('B3', 1), ('D4', 1), ('G4', 1.5), ('F#4', 0.5)], 0.75, strings, amp=0.13, pan=0.15, att=0.2, rel=0.6, bright=3400)
# ── 8 (in), 69 to 78.5: low and dark in A, the cellos stepping down ──
chord(69.2, 78.5, ['A1', 'E2', 'A2'], 0.08, att=1.2, rel=1.5, bright=900)
line(69.5, [('C#3', 2), ('B2', 2), ('A2', 2), ('E2', 3)], 1.0, strings, amp=0.09, att=0.5, rel=0.8, bright=1300)
# ── 8 (the couple), 79 to 86: E and A, low; a quiet horn ──
chord(79.0, 82.5, ['E2', 'B2', 'E3'], 0.07, att=0.8, bright=1200); chord(82.5, 86.2, ['A1', 'E2', 'A2', 'C#3'], 0.07, att=0.8, bright=1200)
line(79.5, [('E3', 1), ('A3', 1), ('B3', 1), ('C#4', 1.5), ('B3', 1.5)], 1.0, horn, amp=0.07)
# ── 8 (alone), 86.5 to 93.5: E major lifts, a horn call ──
chord(86.5, 93.8, ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'], 0.08, att=0.6, bright=2600)
line(86.8, [('B3', 0.7), ('E4', 0.8), ('G#4', 1.0), ('B4', 2.2), ('A4', 0.6), ('G#4', 1.6)], 1.0, horn, amp=0.12)
# ── 8 (the turn and the walk), 94 to 102: the choir, C-sharp minor to E ──
for t0, t1, ch in [(94.0, 96.0, ['C#3', 'E3', 'G#3']), (96.0, 98.0, ['A2', 'C#3', 'E3']), (98.0, 100.0, ['E3', 'G#3', 'B3']), (100.0, 102.0, ['B2', 'D#3', 'F#3'])]:
    for nt in ch: choir(nt, t0, t1 - t0, 0.13, pan=-0.1)
    strings(ch[0][:-1] + str(int(ch[0][-1]) - 1), t0, t1 - t0, 0.08, att=0.3, rel=0.7, bright=1500)
line(94.0, [('C#4', 1), ('E4', 1), ('G#4', 2), ('F#4', 1), ('E4', 1), ('C#4', 1), ('B3', 0.5), ('C#4', 0.5), ('E4', 2)], 0.8, choir, amp=0.2, pan=0.1)
# ── 8 (the far flat), 102 to 106: A major quiet, the harmonica ──
chord(102.0, 106.2, ['A2', 'C#3', 'E3'], 0.06, att=0.8, bright=1500)
line(102.4, [('E5', 0.6), ('C#5', 0.6), ('A4', 1.2), ('B4', 0.6), ('C#5', 1.4)], 1.0, harmonica)
# ── the door, 106 to the end: the whole orchestra up into A, the cadence as it shuts, the chord rung out over the card ──
chord(106.0, 108.3, ['A1', 'E2', 'A2', 'C#3', 'E3', 'A3', 'C#4', 'E4'], 0.08, att=1.6, rel=0.4, bright=3200)
for k in range(24): timpani('A1', 106.2 + k * 0.08, amp=0.04 + k * 0.009, dec=0.5)
for nt in ['A1', 'A2', 'E3', 'A3', 'C#4', 'E4', 'A4']: strings(nt, 108.0, 2.4, 0.1, att=0.02, rel=1.6, bright=3600)
horn('E4', 107.4, 0.5, amp=0.12); horn('A4', 108.0, 2.6, amp=0.14); timpani('A1', 108.0, amp=0.35, dec=2.4)

# ── the ride to the ending's own loudness: LOUD is its level in dB a half second at a time, 0 to 108.5 s; after that the chord rings down ──
LOUD = [
    -40, -37, -37, -37, -38, -36, -35, -36, -37, -35, -35, -36, -37, -34, -34, -33, -30, -31, -32, -30, -30, -28, -28, -29,
    -28, -28, -27, -27, -27, -28, -30, -28, -30, -29, -32, -34, -32, -31, -30, -31, -32, -33, -33, -34, -32, -34, -34, -32,
    -33, -34, -34, -32, -33, -33, -32, -33, -32, -37, -34, -33, -35, -37, -34, -34, -36, -35, -31, -35, -34, -33, -32, -33,
    -34, -33, -33, -34, -36, -34, -35, -37, -37, -34, -32, -34, -36, -36, -36, -37, -38, -40, -42, -45, -45, -47, -50, -40,
    -38, -36, -36, -35, -38, -35, -38, -37, -34, -34, -35, -37, -37, -40, -34, -34, -32, -33, -33, -32, -33, -33, -34, -33,
    -32, -32, -33, -33, -33, -34, -35, -34, -34, -34, -36, -38, -34, -34, -33, -35, -35, -35, -39, -33, -34, -32, -31, -31,
    -33, -33, -32, -34, -37, -34, -35, -33, -36, -35, -36, -36, -38, -41, -36, -34, -32, -31, -31, -32, -31, -34, -33, -32,
    -32, -34, -33, -38, -41, -30, -30, -29, -29, -31, -32, -31, -31, -32, -32, -34, -34, -35, -38, -33, -31, -29, -28, -29,
    -29, -29, -29, -28, -28, -29, -29, -30, -30, -30, -31, -32, -33, -34, -34, -34, -35, -35, -36, -35, -31, -27, -26, -25,
    -23]
def level_ride(L, R):
    hop = SR // 2; n = len(L); mono = (L + R) / 2; k = n // hop
    ours = np.array([np.sqrt(np.mean(mono[i * hop:(i + 1) * hop] ** 2)) + 1e-7 for i in range(k)])
    ours = np.convolve(ours, np.ones(3) / 3, mode='same')
    want = np.array([10 ** (LOUD[min(i, len(LOUD) - 1)] / 20) if i < len(LOUD) else 10 ** (LOUD[-1] / 20) * max(0.0, 1 - (i - len(LOUD)) / 6) + 1e-7 for i in range(k)])
    g = np.clip(want / ours, 0, None); g = g / np.median(g[:len(LOUD)]); g = np.clip(g, 0.2, 5.0)
    g = np.convolve(np.pad(g, 2, mode='edge'), np.ones(5) / 5, mode='valid')   # a gentle hand on the fader, no pumping
    gi = np.interp(np.arange(n), (np.arange(k) + 0.5) * hop, g)
    return L * gi, R * gi

# ── the room: a stereo hall two seconds long, a third wet ──
n = int(2.3 * SR); t = np.arange(n) / SR; decay = np.exp(-t / 2.3 * 6.9)
irL = rng.standard_normal(n) * decay; irR = rng.standard_normal(n) * decay; irL = lp(irL, 5000); irR = lp(irR, 5000)
wetL = fftconvolve(L, irL)[:len(L)]; wetR = fftconvolve(R, irR)[:len(R)]
wet = 0.3 / max(np.abs(wetL).max(), np.abs(wetR).max(), 1e-9) * max(np.abs(L).max(), 1e-9)
outL = L + wetL * wet; outR = R + wetR * wet
outL, outR = level_ride(outL, outR)
peak = max(np.abs(outL).max(), np.abs(outR).max()); outL, outR = outL / peak * 0.89, outR / peak * 0.89
fade = int(1.0 * SR); outL[-fade:] *= np.linspace(1, 0, fade); outR[-fade:] *= np.linspace(1, 0, fade)
pcm = (np.stack([outL, outR], 1) * 32767).astype('<i2')
out = sys.argv[1] if len(sys.argv) > 1 else 'searchers-score.wav'
import wave
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', out, round(len(outL) / SR, 2), 's')
