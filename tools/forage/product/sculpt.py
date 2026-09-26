#!/usr/bin/env python3
"""tools/forage/product/sculpt.py — the sculptor the Wooden Horse was made with, for any form: a cliff, a boulder, a giant's cave.

A form is a set of cells a stud square and a plate high, (i, h, k) -> a material name, cut from smooth solids (sdf.py-style distance
functions: negative inside). The sculptor lays real parts into them: where three plates of one material stand one over another they
become part of a brick, laid across the course below so the courses bond; the rest are plates; every cell with nothing over it is
finished in a tile (unless its material keeps its studs: turf, a floor someone stands on). Then it settles the build: it checks every part
clicks to the rest (tools/forage/product/clicks.py) and repairs what does not, growing a plate down into any step that met the one below
only at an edge, taking away what nothing holds, until everything holds.

    from sculpt import Form
    f = Form(y0=0)                        # plate layer 0 has its underside at yup = y0 (LDU above the base)
    f.carve(solid, I, H, K)               # solid(x, y, z) -> (distance, material)
    rows = f.parts(colour)                # LDraw lines; colour(material, i, h, k) -> LDraw colour
    f.settle(colour, extra=lambda: [...]) # repair until nothing is loose (extra rows: what stands on the form, checked with it)
"""
import math, os, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import clicks

S, P, B = 20, 8, 24
BRICKS = [((2, 4), '3001'), ((2, 3), '3002'), ((2, 2), '3003'), ((1, 8), '3008'), ((1, 6), '3009'), ((1, 4), '3010'), ((1, 3), '3622'),
          ((1, 2), '3004'), ((1, 1), '3005')]
PLATES = [((2, 8), '3034'), ((2, 6), '3795'), ((2, 4), '3020'), ((2, 3), '3021'), ((2, 2), '3022'), ((1, 8), '3460'), ((1, 6), '3666'),
          ((1, 4), '3710'), ((1, 3), '3623'), ((1, 2), '3023'), ((1, 1), '3024')]
TILES = [((2, 4), '87079'), ((2, 2), '3068b'), ((1, 4), '2431'), ((1, 3), '63864'), ((1, 2), '3069b'), ((1, 1), '3070b')]


# ── solids ──
def seg(p, a, b):
    ax, ay, az = a; bx, by, bz = b; px, py, pz = p
    dx, dy, dz = bx - ax, by - ay, bz - az
    L2 = dx * dx + dy * dy + dz * dz
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / L2)) if L2 else 0
    return math.dist(p, (ax + t * dx, ay + t * dy, az + t * dz)), t


def cone(p, a, b, ra, rb):
    d, t = seg(p, a, b)
    return d - (ra + (rb - ra) * t)


def ell(p, c, r):
    q = [(p[i] - c[i]) / r[i] for i in range(3)]
    return (math.sqrt(sum(v * v for v in q)) - 1) * min(r)


def smin(a, b, k=28):
    h = max(0, min(1, 0.5 + 0.5 * (b - a) / k))
    return b + (a - b) * h - k * h * (1 - h)


def rough(p, amp=16, seed=0.0):
    """a weathered surface: a few crossed ripples, so rock is not a smooth egg"""
    x, y, z = p
    return amp * (0.5 * math.sin(x / 37 + seed) * math.sin(z / 29 - seed) + 0.3 * math.sin(y / 23 + x / 51 + seed) + 0.2 * math.sin((x + z) / 17 + y / 31))


class Form:
    def __init__(self, y0=0, keep_studs=(), unit=P):
        """unit: a cell's height, a plate (8, smooth: the horse) or a brick (24, rock: fewer parts, the classic craggy face)"""
        self.vox, self.y0, self.keep, self.unit = {}, y0, set(keep_studs), unit

    def carve(self, solid, I, H, K):
        for h in H:
            for i in I:
                for k in K:
                    d, m = solid(((i + 0.5) * S, self.y0 + (h + 0.5) * self.unit, (k + 0.5) * S))
                    if d <= 0: self.vox[(i, h, k)] = m
        return self

    def hollow(self, side=2, up=6, pillar=4, keep=lambda v, m: False):
        """a model is not solid rock: keep a skin `side` studs thick (and `up` plates under any top), and inside it only a grid of pillars
        every `pillar` studs to carry it, as a builder frames the inside of a mountain"""
        vox = self.vox
        inner = [v for v, m in vox.items() if not keep(v, m)
                 and all((v[0] + di, v[1] + dh, v[2] + dk) in vox for di in range(-side, side + 1) for dk in range(-side, side + 1) for dh in (0, up))
                 and all((v[0], v[1] + dh, v[2]) in vox for dh in range(1, up + 1))]
        for v in inner:
            if not (v[0] % pillar == 0 and v[2] % pillar == 0): del vox[v]
        return len(inner)

    # ── laying the parts ──
    def _line(self, rows, col, x, yup, z, part, rot):
        c, s = round(math.cos(rot), 6), round(math.sin(rot), 6)
        rows.append(f"1 {col} {x:g} {-yup:g} {z:g} {c:g} 0 {s:g} 0 1 0 {-s:g} 0 {c:g} {part}.dat")

    def _pack(self, rows, cells, yup_top, colour_of, along_z, sizes):
        left = set(cells)
        for c in sorted(left, key=lambda c: (c[1], c[0]) if along_z else (c[0], c[1])):
            if c not in left: continue
            i0, k0 = c
            col = colour_of(i0, k0)
            for (w, l), part in sizes:
                cov = [(i0 + a, k0 + b) if along_z else (i0 + b, k0 + a) for a in range(w) for b in range(l)]
                if all(q in left and colour_of(*q) == col for q in cov):
                    for q in cov: left.discard(q)
                    cx = (i0 + (w if along_z else l) / 2) * S
                    cz = (k0 + (l if along_z else w) / 2) * S
                    self._line(rows, col, cx, yup_top, cz, part, math.pi / 2 if along_z and w != l else 0)
                    break

    def parts(self, colour):
        vox, rows = self.vox, []
        col = {v: colour(m, *v) for v, m in vox.items()}
        tile = {v for v, m in vox.items() if (v[0], v[1] + 1, v[2]) not in vox and m not in self.keep}
        Hs = sorted({h for (_, h, _) in vox})
        if not Hs: return rows
        if self.unit == B:                        # brick cells: every course of bricks, crosswise to the one below; studs on top
            for h in Hs:
                cells = {(i, k) for (i, hh, k) in vox if hh == h}
                self._pack(rows, cells, self.y0 + (h + 1) * B, lambda i, k, h=h: col[(i, h, k)], h % 2 == 1, BRICKS)
            return rows
        in_brick = set()
        for c in range(Hs[0] // 3, Hs[-1] // 3 + 1):
            hs = (3 * c, 3 * c + 1, 3 * c + 2)
            full = {(i, k) for (i, h, k) in vox if h == hs[0]
                    and all((i, hh, k) in vox and (i, hh, k) not in tile and col[(i, hh, k)] == col[(i, hs[0], k)] for hh in hs)}
            self._pack(rows, full, self.y0 + (3 * c + 3) * P, lambda i, k, h0=hs[0]: col[(i, h0, k)], c % 2 == 0, BRICKS)
            in_brick |= {(i, hh, k) for (i, k) in full for hh in hs}
        for h in Hs:
            layer = [(i, k) for (i, hh, k) in vox if hh == h]
            plates = {(i, k) for (i, k) in layer if (i, h, k) not in in_brick and (i, h, k) not in tile}
            tiles = {(i, k) for (i, k) in layer if (i, h, k) in tile}
            self._pack(rows, plates, self.y0 + (h + 1) * P, lambda i, k, h=h: col[(i, h, k)], h % 2 == 1, PLATES)
            self._pack(rows, tiles, self.y0 + (h + 1) * P, lambda i, k, h=h: col[(i, h, k)], h % 2 == 1, TILES)
        return rows

    def settle(self, colour, extra=lambda: [], rounds=60, protect=lambda v: False, can_grow=lambda v: True):
        """repair until every part clicks: a step that met the one below only at an edge grows a plate down into it; what nothing near
        holds is taken away (never a cell protect() keeps). Returns the loose parts left (none, when it has settled)."""
        tmp = os.path.join(tempfile.gettempdir(), 'sculpt-settle.ldr')
        loose, dead = [], set()                   # a cell once taken away is never grown back: the repair cannot cycle
        for _ in range(rounds):
            open(tmp, 'w').write('\n'.join(['0 FILE settle.ldr'] + self.parts(colour) + list(extra())) + '\n')
            loose = clicks.parts_loose(tmp)
            n = 0
            for p in loose:
                h = round((-p['bot'] - self.y0) / self.unit)
                for (i, k) in p['fp']:
                    v, below = (i, h, k), (i, h - 1, k)
                    if v not in self.vox or below in self.vox: continue
                    if h > 0 and below not in dead and can_grow(below) and any((i + a, h - 1, k + b) in self.vox
                                                                                for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1))):
                        self.vox[below] = self.vox[v]; n += 1
                    elif not protect(v):
                        del self.vox[v]; dead.add(v); n += 1
            if not n: break
        return loose
