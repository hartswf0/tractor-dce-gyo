#!/usr/bin/env python3
"""tools/forage/product/clicks.py — does every brick of a set click to the rest? (the satisfying click, checked)

  python3 tools/forage/product/clicks.py odyssey/cards/set.wooden-horse.mpd [...]

Reads the set's top-level parts and measures each from its own geometry (tools/forage/product/ldbox.py), so a part's origin is never
guessed: its footprint of studs, the height of its top face and of its bottom. Two parts are joined when one's bottom lies on the other's
top face, their footprints share a stud, and the lower one has studs there (a tile or a slope takes nothing on top). Everything reachable
from the parts at the bottom of the build, or from a part marked `0 !FORAGE ROOT` (a wheeled cart that rolls on its tyres), is held;
whatever is left is printed. Parts off the stud grid or turned on their sides (minifigures, wheels, a tyre) are not checked here.
"""
import os, re, sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ldbox


def studded(pid):
    """a part takes others on top when something of it (its studs) stands above its top face"""
    a, b = ldbox.box(pid, True), ldbox.box(pid, False)
    return bool(a and b and a[0][1] < b[0][1] - 1)


_studded = {}
BODY = {'4600': ((-20, 0, -20), (20, 8, 20)), '4488': ((-20, 0, -20), (20, 8, 20))}   # plates with wheel pins: the plate, not its pins


def parts(path):
    text = open(path).read()
    top = re.split(r'(?m)^0 FILE ', text)[1] if '0 FILE ' in text else text
    out, root_next = [], False
    for l in top.splitlines():
        t = l.split()
        if not t: continue
        if t[0] == '0':
            root_next = root_next or '!FORAGE ROOT' in l
            continue
        if t[0] != '1': continue
        pid = t[14].lower().replace('.dat', '')
        x, y, z = map(float, t[2:5]); m = list(map(float, t[5:14]))
        root, root_next = root_next, False
        b = BODY.get(pid) or ldbox.box(pid, False)
        if not b: continue
        if abs(abs(m[4]) - 1) > 1e-3 or any(abs(abs(v) - 1) > 1e-3 and abs(v) > 1e-3 for v in m): continue   # on its side, or at an angle
        lo, hi = b
        cs = [(x + m[0] * px + m[2] * pz, z + m[6] * px + m[8] * pz) for px in (lo[0], hi[0]) for pz in (lo[2], hi[2])]
        x0, x1 = min(c[0] for c in cs), max(c[0] for c in cs); z0, z1 = min(c[1] for c in cs), max(c[1] for c in cs)
        ys = sorted((y + m[4] * lo[1], y + m[4] * hi[1]))
        on_grid = all(abs(v / 10 - round(v / 10)) < 0.05 for v in (x0, x1, z0, z1)) and x1 - x0 >= 19 and z1 - z0 >= 19
        if not on_grid: continue
        fp = {(p, q) for p in range(round(x0 / 20), round(x1 / 20)) for q in range(round(z0 / 20), round(z1 / 20))} if all(
            abs(v / 20 - round(v / 20)) < 0.05 for v in (x0, x1, z0, z1)) else \
            {(p, q) for p in range(round(x0 / 10), round(x1 / 10)) for q in range(round(z0 / 10), round(z1 / 10))}   # half-stud offset
        if pid not in _studded: _studded[pid] = studded(pid)
        out.append({'pid': pid, 'top': round(ys[0]), 'bot': round(ys[1]), 'fp': fp, 'half': not all(abs(v / 20 - round(v / 20)) < 0.05 for v in (x0, x1, z0, z1)),
                    'studs': _studded[pid], 'root': root, 'line': l})
    return out


def loose(P):
    by_top, by_bot = defaultdict(list), defaultdict(list)
    for n, p in enumerate(P): by_top[p['top']].append(n); by_bot[p['bot']].append(n)
    low = max(p['bot'] for p in P)
    held = {n for n, p in enumerate(P) if p['bot'] == low or p['root']}
    stack = list(held)

    def touch(a, b):   # a sits on b
        if a['half'] != b['half']: return False
        return b['studs'] and bool(a['fp'] & b['fp'])
    while stack:
        n = stack.pop(); p = P[n]
        for m in by_bot.get(p['top'], []):          # parts standing on p
            if m not in held and touch(P[m], p): held.add(m); stack.append(m)
        for m in by_top.get(p['bot'], []):          # parts p stands on
            if m not in held and touch(p, P[m]): held.add(m); stack.append(m)
    return [P[n] for n in range(len(P)) if n not in held]


def parts_loose(path):
    return loose(parts(path))


def check(path):
    P = parts(path); L = loose(P)
    print(f'{path}: {len(P)} parts on the grid, {len(L)} not clicked to the build')
    for p in L[:40]: print('  ', p['line'])
    return L


if __name__ == '__main__':
    bad = sum(len(check(p)) for p in sys.argv[1:])
    sys.exit(1 if bad else 0)
