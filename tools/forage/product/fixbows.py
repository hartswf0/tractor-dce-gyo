#!/usr/bin/env python3
"""tools/forage/product/fixbows.py — turn every bow the right way round: the arrow toward where the archer looks.

  python3 tools/forage/product/fixbows.py [--dry] [cards...]      (default: every odyssey/cards/*.mpd)

Minifig Bow with Arrow (4499) is modelled with its arrowhead toward its own -z and its grip along its own y. A figure faces its torso's
-z. The forage placed the bow in each figure's hand with the arrow pointing back past the archer's head, in every card that has one.
Here each bow held by a figure (a torso within reach in the same model) is compared with that figure's facing; a bow whose arrow points
behind the archer is turned half round its grip (M * diag(-1, 1, -1)): the arrow forward, the fletching at the cheek. A bow lying
loose (no torso near) is left alone. Idempotent: a right-way bow is never turned.
"""
import glob, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
BOWS = {'4499.dat': -1}          # the local z sign of the arrowhead
REACH = 70                        # LDU from a bow's grip to the torso whose hand holds it


def fix(path, dry=False):
    text = open(path).read()
    lines = text.split('\n')
    blocks, start = [], 0         # (start, end) of each 0 FILE block (or the whole file)
    for n, l in enumerate(lines):
        if l.startswith('0 FILE') and n > start: blocks.append((start, n)); start = n
    blocks.append((start, len(lines)))
    turned = kept = 0
    for a, b in blocks:
        rows = [(n, lines[n].split()) for n in range(a, b) if lines[n].startswith('1 ')]
        torsos = [(n, t) for n, t in rows if len(t) >= 15 and re.match(r'973', t[14].lower())]
        for n, t in rows:
            if len(t) < 15 or t[14].lower() not in BOWS: continue
            x, y, z = map(float, t[2:5]); m = list(map(float, t[5:14]))
            near = min(torsos, key=lambda q: math.dist((x, y, z), tuple(map(float, q[1][2:5]))), default=None)
            if not near or math.dist((x, y, z), tuple(map(float, near[1][2:5]))) > REACH: continue
            tm = list(map(float, near[1][5:14]))
            fwd = (-tm[2], -tm[5], -tm[8])                                   # the torso's -z in the model
            s = BOWS[t[14].lower()]
            arrow = (s * m[2], s * m[5], s * m[8])                           # the bow's arrowhead direction
            if sum(p * q for p, q in zip(fwd, arrow)) >= 0: kept += 1; continue
            m = [-m[0], m[1], -m[2], -m[3], m[4], -m[5], -m[6], m[7], -m[8]]
            lines[n] = ' '.join(t[:5] + [f'{v:.3f}'.rstrip('0').rstrip('.') for v in m] + t[14:])
            turned += 1
    if turned and not dry: open(path, 'w').write('\n'.join(lines))
    return turned, kept


if __name__ == '__main__':
    dry = '--dry' in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith('--')] or sorted(glob.glob(os.path.join(ROOT, 'odyssey/cards/*.mpd')))
    T = K = 0
    for f in files:
        t, k = fix(f, dry)
        if t or k: print(f'{os.path.basename(f)}: {t} turned, {k} already right')
        T += t; K += k
    print(f'{T} bows turned, {K} already right' + (' (dry run)' if dry else ''))
