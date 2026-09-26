#!/usr/bin/env python3
"""tools/forage/product/ldbox.py — the true extent of an LDraw part, read from its geometry (subfiles expanded).

  python3 tools/forage/product/ldbox.py 54200 3005 4600      -> min and max x, y, z of each, with and without its studs

A part's origin is not always where one guesses (a cheese slope's is at its bottom face, a brick's at its top), so anything that stacks
parts asks this rather than assuming. `body` leaves out the studs, which sit above the top face and go into the part above.
"""
import functools, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
LD = os.path.join(ROOT, 'ldraw')
DIRS = ['parts', 'p', 'parts/s', 'p/48', 'p/8']


def find(name):
    name = name.replace('\\', '/').lower()
    for d in DIRS:
        for cand in (os.path.join(LD, d, name), os.path.join(LD, d, os.path.basename(name))):
            if os.path.exists(cand): return cand
    return None


def mul(a, b):
    return [sum(a[r * 3 + q] * b[q * 3 + c] for q in range(3)) for r in range(3) for c in range(3)]


@functools.lru_cache(maxsize=None)
def points(name, studs=True):
    """every vertex of the part, in its own frame"""
    f = find(name)
    if not f: return ()
    out = []
    for l in open(f, errors='ignore'):
        t = l.split()
        if not t: continue
        if t[0] == '1' and len(t) >= 15:
            sub = ' '.join(t[14:]).lower()
            if not studs and os.path.basename(sub.replace('\\', '/')).startswith('stud'): continue
            x, y, z = map(float, t[2:5]); m = list(map(float, t[5:14]))
            for (px, py, pz) in points(sub, studs):
                out.append((x + m[0] * px + m[1] * py + m[2] * pz, y + m[3] * px + m[4] * py + m[5] * pz, z + m[6] * px + m[7] * py + m[8] * pz))
        elif t[0] in ('2', '3', '4'):
            n = int(t[0]); v = list(map(float, t[2:2 + 3 * n]))
            out += [tuple(v[i:i + 3]) for i in range(0, 3 * n, 3)]
    return tuple(out)


@functools.lru_cache(maxsize=None)
def box(name, studs=True):
    P = points(name if name.endswith('.dat') else name + '.dat', studs)
    if not P: return None
    return tuple(min(p[i] for p in P) for i in range(3)), tuple(max(p[i] for p in P) for i in range(3))


if __name__ == '__main__':
    for n in sys.argv[1:]:
        print(n, 'all', box(n), 'body', box(n, False))
