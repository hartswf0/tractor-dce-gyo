#!/usr/bin/env python3
"""tools/forage/product/clicks.py — does every brick of a set click to the rest? (the satisfying click, checked)

  python3 tools/forage/product/clicks.py odyssey/cards/set.wooden-horse.mpd

Reads the set's top-level parts (bricks, plates, tiles, slopes on the stud grid; minifigures are left out), gives each its footprint of
studs and its height, and joins two parts when one sits directly on the other and their footprints share a stud. Everything reachable
from the parts at the bottom of the build is held; whatever is left is printed: a part held by nothing, in the air or only glued at a side.
"""
import re, sys
from collections import defaultdict

SIZE = {  # part: (studs along x, studs along z, height in LDU)
    '3001': (4, 2, 24), '3002': (3, 2, 24), '3003': (2, 2, 24), '3004': (2, 1, 24), '3005': (1, 1, 24), '3622': (3, 1, 24),
    '3010': (4, 1, 24), '3009': (6, 1, 24), '3008': (8, 1, 24), '54200': (1, 1, 16), '3024': (1, 1, 8), '3023': (2, 1, 8),
    '3022': (2, 2, 8), '3020': (4, 2, 8), '3068b': (2, 2, 8), '87079': (4, 2, 8), '49668': (1, 1, 8), '3941': (2, 2, 24),
    '4032a': (2, 2, 8), '98138': (1, 1, 8), '3069b': (2, 1, 8), '2431': (4, 1, 8), '4162': (8, 1, 8)}


def parts(path):
    text = open(path).read()
    top = re.split(r'(?m)^0 FILE ', text)[1]
    out = []
    for l in top.splitlines():
        t = l.split()
        if not t or t[0] != '1': continue
        pid = t[14].replace('.dat', '')
        if pid not in SIZE: continue
        x, y, z = map(float, t[2:5]); m = list(map(float, t[5:14]))
        a, b, h = SIZE[pid]
        if abs(m[0]) < 0.5: a, b = b, a            # turned a quarter
        if abs(m[4]) < 0.5: continue               # on its side (wheels, eyes, hubs): held by a side stud, not checked here
        xs = {round((x - (a - 1) * 10 + 20 * n) / 20 - 0.5) for n in range(a)}
        zs = {round((z - (b - 1) * 10 + 20 * n) / 20 - 0.5) for n in range(b)}
        out.append((pid, round(y), round(y) + h, {(p, q) for p in xs for q in zs}, l))
    return out


def parts_loose(path):
    P = parts(path)
    by_top, by_bot = defaultdict(list), defaultdict(list)
    for n, (_, top, bot, fp, _) in enumerate(P): by_top[top].append(n); by_bot[bot].append(n)
    low = max(p[2] for p in P)
    held, stack = set(), [n for n, p in enumerate(P) if p[2] == low]
    held.update(stack)
    while stack:
        n = stack.pop(); _, top, bot, fp, _ = P[n]
        for m in by_bot.get(top, []) + by_top.get(bot, []):
            if m not in held and P[m][3] & fp: held.add(m); stack.append(m)
    return [P[n] for n in range(len(P)) if n not in held]


def check(path):
    loose, P = parts_loose(path), parts(path)
    print(f'{path}: {len(P)} parts, {len(loose)} not clicked to the build')
    for p in loose[:40]: print('  ', p[4])
    return loose


if __name__ == '__main__':
    bad = sum(len(check(p)) for p in sys.argv[1:])
    sys.exit(1 if bad else 0)
