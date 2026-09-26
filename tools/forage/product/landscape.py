#!/usr/bin/env python3
"""(docstring written at the end of the file's development; see LIBRARY below)"""
import math, os, random, sys
from collections import namedtuple, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kitlib import *            # put, on, row, T, RY, RZ, mat_mul, colours, write, check, frame, tile_run
import ldbox

S, P, B = 20, 8, 24
DBROWN = 308                    # dark brown (kitlib's DB)
BGREEN, YGREEN, PURPLE, MLAV_, LAV, CORAL = 10, 326, 22, 324, 325, 353
PINK, DPINK, BYELLOW, LNOUGAT = 13, 5, 226, 78

Piece = namedtuple('Piece', 'rows cells canopy')
Piece.__doc__ = 'rows: LDraw lines; cells: the (i, k) stud squares it stands on at its yup; canopy: the (i, k) squares its crown or overhang shades'

# ── parts by size (long side along x) ──
PLATE = {(1, 1): '3024', (1, 2): '3023', (1, 3): '3623', (1, 4): '3710', (1, 6): '3666', (1, 8): '3460', (1, 10): '4477', (1, 12): '60479',
         (2, 2): '3022', (2, 3): '3021', (2, 4): '3020', (2, 6): '3795', (2, 8): '3034', (2, 10): '3832', (2, 12): '2445',
         (4, 4): '3031', (4, 6): '3032', (4, 8): '3035', (4, 10): '3030', (4, 12): '3029', (6, 6): '3958', (6, 8): '3036', (6, 10): '3033',
         (6, 12): '3028', (8, 8): '41539'}
TILE = {(1, 1): '3070b', (1, 2): '3069b', (1, 3): '63864', (1, 4): '2431', (1, 6): '6636', (1, 8): '4162', (2, 2): '3068b', (2, 3): '26603',
        (2, 4): '87079', (2, 6): '69729', (4, 4): '1751', (6, 6): '10202'}
BRICK = {(1, 1): '3005', (1, 2): '3004', (1, 3): '3622', (1, 4): '3010', (1, 6): '3009', (1, 8): '3008', (2, 2): '3003', (2, 3): '3002',
         (2, 4): '3001', (2, 6): '2456', (2, 8): '3007'}
STONE = {(1, 1): '3005', (1, 2): '98283', (1, 4): '15533', (1, 3): '3622'}          # embossed (masonry) bricks for walls
KINDS = {'plate': (PLATE, 8), 'tile': (TILE, 8), 'brick': (BRICK, 24), 'stone': (STONE, 24)}


def block(col, kind, i, k, w, d, yup):
    """a plate / tile / brick covering the w (x) by d (z) stud squares from square (i, k), standing on the surface at yup"""
    table, h = KINDS[kind]
    key = (min(w, d), max(w, d))
    part = table[key]
    turn = RY(math.pi / 2) if d > w else None
    return put(col, (i + w / 2) * S, yup + h, (k + d / 2) * S, part, turn)


def pack(cells, sizes=None, kind='plate', stagger=False):
    """cells {(i, k): colour}: cover them with the fewest parts of `kind`, each one colour; returns [(col, i, k, w, d)].
    sizes: the (w, d) shapes to try, largest first (default: every shape of the kind, both ways)."""
    table = KINDS[kind][0]
    if sizes is None:
        sizes = sorted({s for a, b in table for s in ((a, b), (b, a))}, key=lambda s: (-s[0] * s[1], -max(s)))
    left = dict(cells)
    out = []
    for (k, i) in sorted((k, i) for i, k in cells):
        if (i, k) not in left: continue
        col = left[(i, k)]
        for w, d in sizes:
            if stagger and (w, d) == (2, 1) and (i + k) % 2: continue
            if all(left.get((i + a, k + b)) == col for a in range(w) for b in range(d)):
                for a in range(w):
                    for b in range(d): del left[(i + a, k + b)]
                out.append((col, i, k, w, d))
                break
    return out


def lay(cells, yup, kind='plate', sizes=None, stagger=False):
    return [block(c, kind, i, k, w, d, yup) for c, i, k, w, d in pack(cells, sizes, kind, stagger)]


def cell(x, z): return (math.floor(x / S), math.floor(z / S))
def cells_rect(i, k, w, d): return {(i + a, k + b) for a in range(w) for b in range(d)}


def at(i, k): return (i + .5) * S, (k + .5) * S          # the centre of stud square (i, k)


def aim(local, target):
    """the RY angle that turns a part's own direction `local` (angle in the x-z plane, atan2(z, x)) to point along `target`"""
    return local - target


# ── honesty for the parts the checker cannot see (leaves at an angle, stems, clips) ──
def _parse(r):
    t = r.split()
    return int(t[1]), [float(v) for v in t[2:5]], [float(v) for v in t[5:14]], t[14].lower().replace('.dat', '')


def on_grid(r):
    """True when kitlib.check (tools/forage/product/clicks.py) sees this part: square to the axes and on the stud grid"""
    _, p, m, pid = _parse(r)
    b = ldbox.box(pid, False)
    if not b: return False
    if abs(abs(m[4]) - 1) > 1e-3 or any(abs(abs(v) - 1) > 1e-3 and abs(v) > 1e-3 for v in m): return False
    lo, hi = b
    xs = [p[0] + m[0] * a + m[2] * c for a in (lo[0], hi[0]) for c in (lo[2], hi[2])]
    zs = [p[2] + m[6] * a + m[8] * c for a in (lo[0], hi[0]) for c in (lo[2], hi[2])]
    vals = (min(xs), max(xs), min(zs), max(zs))
    return all(abs(v / 10 - round(v / 10)) < 0.05 for v in vals) and vals[1] - vals[0] >= 19 and vals[3] - vals[2] >= 19


def obb(r, shrink=1.0):
    """the part's body (without studs) as an oriented box: centre, three axes, half extents"""
    _, p, m, pid = _parse(r)
    b = ldbox.box(pid, False)
    if not b: return None
    lo, hi = b
    c_local = [(lo[i] + hi[i]) / 2 for i in range(3)]
    half = [max(0.1, (hi[i] - lo[i]) / 2 - shrink) for i in range(3)]
    centre = [p[r_] + sum(m[r_ * 3 + q] * c_local[q] for q in range(3)) for r_ in range(3)]
    axes = []
    for q in range(3):
        v = [m[0 + q], m[3 + q], m[6 + q]]
        n = math.sqrt(sum(a * a for a in v)) or 1
        axes.append([a / n for a in v]); half[q] *= n
    return centre, axes, half


def _sep(A, Bx):
    ca, aa, ha = A; cb, ab, hb = Bx
    d = [cb[i] - ca[i] for i in range(3)]
    def dot(u, v): return u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
    def cross(u, v): return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    tests = aa + ab + [cross(u, v) for u in aa for v in ab]
    for L in tests:
        n = math.sqrt(dot(L, L))
        if n < 1e-6: continue
        L = [a / n for a in L]
        ra = sum(ha[i] * abs(dot(aa[i], L)) for i in range(3))
        rb = sum(hb[i] * abs(dot(ab[i], L)) for i in range(3))
        if abs(dot(d, L)) > ra + rb: return True
    return False


def settle(rows, fixed=(), shrink=1.0, verbose=False):
    """keep every part the checker sees; keep a part it cannot see (a leaf at an angle, a stem, a vine) only when its body
    does not fill the space of any part the checker sees, of any free part kept before it, or of `fixed`.
    Returns (kept rows in their order, dropped rows)."""
    sp = Space(shrink)
    for r in list(fixed) + [r for r in rows if r.startswith('1 ') and on_grid(r)]: sp.add(r)
    kept, dropped = [], []
    for r in rows:
        if not r.startswith('1 ') or on_grid(r): kept.append(r); continue
        if sp.fits(r): kept.append(r); sp.add(r)
        else: dropped.append(r)
    if verbose and dropped: print(f'   settle: dropped {len(dropped)} free parts that would fill the space of another')
    return kept, dropped


def free_clashes(rows, shrink=1.0):
    """pairs of parts where at least one is invisible to the checker and their bodies overlap (should be 0)"""
    _, dropped = settle(rows, shrink=shrink)
    return len(dropped)


# ── turning a finished piece a quarter at a time about a corner ──
def turn(piece, x0, z0, q):
    """rotate a Piece q quarter turns (counter-clockwise seen from above) about the point (x0, z0); stays on the grid"""
    if q % 4 == 0: return piece
    a = -q * math.pi / 2
    M = mat_mul(mat_mul(T(x0, 0, z0), RY(a)), T(-x0, 0, -z0))
    out = []
    for r in piece.rows:
        if not r.startswith('1 '): out.append(r); continue
        col, p, m, pid = _parse(r)
        out.append(row(col, mat_mul(M, p + m), pid))
    def tc(c):
        cx, cz = at(*c)
        X = M[0] + M[3] * cx + M[5] * cz; Z = M[2] + M[9] * cx + M[11] * cz
        return cell(X, Z)
    return Piece(out, {tc(c) for c in piece.cells}, {tc(c) for c in piece.canopy})


def merge(*pieces):
    rows, cells, can = [], set(), set()
    for p in pieces: rows += p.rows; cells |= p.cells; can |= p.canopy
    return Piece(rows, cells, can)


class Space:
    """the bodies placed so far, bucketed, so a free part can ask whether its place is empty"""
    def __init__(self, shrink=1.0):
        self.grid, self.shrink = defaultdict(list), shrink

    def _keys(self, bx):
        c, ax, h = bx
        ext = [sum(abs(ax[q][i]) * h[q] for q in range(3)) for i in range(3)]
        return [(a, b, e) for a in range(int((c[0] - ext[0]) // 40), int((c[0] + ext[0]) // 40) + 1)
                for b in range(int((c[1] - ext[1]) // 40), int((c[1] + ext[1]) // 40) + 1)
                for e in range(int((c[2] - ext[2]) // 40), int((c[2] + ext[2]) // 40) + 1)]

    def add(self, r):
        bx = obb(r, self.shrink)
        if bx:
            for kk in self._keys(bx): self.grid[kk].append(bx)

    def fits(self, r):
        bx = obb(r, self.shrink)
        if bx is None: return True
        seen = set()
        for kk in self._keys(bx):
            for o in self.grid[kk]:
                if id(o) in seen: continue
                seen.add(id(o))
                if not _sep(bx, o): return False
        return True


# a free part set on a stud: the height of its origin above the stud's surface, and the direction its blade points (atan2(z, x))
SEAT = {'2417': (8, -math.pi / 2), '2423': (8, -math.pi / 2), '32607': (8, -math.pi / 4), '24866': (8, 0), '33291': (8, 0),
        '6255': (5, math.pi / 2), '3741ac01': (12, math.pi / 2), '3741ac03': (12, math.pi / 2), '3741ac05': (12, math.pi / 2),
        '3741ac06': (12, math.pi / 2), '15279': (0, math.pi / 2), '99249c01': (0, math.pi / 2), '30176': (24, 0),
        '3742': (2, 0), '1747': (0, 0), '37695': (0, math.pi / 2), '19119c02': (10, 0), '24855c01': (20, 0)}


class Grow:
    """a small builder for plants: grid parts (checked by kitlib.check) and free parts (leaves at an angle) seated on their studs.
    Studs are tracked so a leaf only ever sits on a stud that is really there and not taken."""
    def __init__(self, seed=0, space=None):
        self.rng = random.Random(seed)
        self.rows, self.free = [], []
        self.studs = {}                   # (i, k, yup) -> True while free
        self.cells = set()                # stud squares on the ground (at the base yup) it stands on
        self.canopy = set()
        self.space = space

    def solid(self, col, pid, i, k, w, d, bottom, studs=True, rot=0, base=None):
        """a grid part covering squares (i..i+w, k..k+d) standing at `bottom`; returns its top"""
        b = ldbox.box(pid, False)
        h = b[1][1] - b[0][1]
        cx, cz = (i + w / 2) * S, (k + d / 2) * S
        self.rows.append(on(col, cx, bottom, cz, pid, rot))
        top = bottom + round(h)
        for a in range(w):
            for c in range(d):
                self.studs.pop((i + a, k + c, bottom), None)
                if base is not None and bottom == base: self.cells.add((i + a, k + c))
                if studs: self.studs[(i + a, k + c, top)] = True
        return top

    def blk(self, col, kind, i, k, w, d, bottom, base=None):
        table, h = KINDS[kind]
        self.rows.append(block(col, kind, i, k, w, d, bottom))
        for a in range(w):
            for c in range(d):
                self.studs.pop((i + a, k + c, bottom), None)
                if base is not None and bottom == base: self.cells.add((i + a, k + c))
                if kind != 'tile': self.studs[(i + a, k + c, bottom + h)] = True
        return bottom + h

    def want(self, i, k, y, options, toward=None, jitter=0.35):
        """ask for a free part on stud (i, k) at surface y: options [(pid, col), ...] tried in order; toward = the angle
        (atan2 dz, dx) its blade should point, or None for any"""
        self.free.append((i, k, y, options, toward, jitter))

    def studs_at(self, y, rect=None):
        return sorted((i, k) for (i, k, yy), f in self.studs.items() if f and yy == y and
                      (rect is None or (rect[0] <= i < rect[0] + rect[2] and rect[1] <= k < rect[1] + rect[3])))

    def finish(self, fallback=None):
        """seat the wanted free parts where they fit; a stud left bare in the crown gets `fallback` (col, pid) if it fits"""
        sp = self.space or Space()
        for r in self.rows: sp.add(r)
        out = []
        for i, k, y, options, toward, jit in self.free:
            if not self.studs.get((i, k, y)): continue
            base_ang = toward if toward is not None else self.rng.uniform(-math.pi, math.pi)
            placed = False
            for tries in range(3):
                ang = base_ang + self.rng.uniform(-jit, jit) * (1 + tries)
                for pid, col in options:
                    h, local = SEAT[pid]
                    x, z = at(i, k)
                    r = put(col, x, y + h, z, pid, RY(aim(local, ang)))
                    if sp.fits(r):
                        sp.add(r); out.append(r); self.studs[(i, k, y)] = False; placed = True
                        c0 = cell(x + 40 * math.cos(ang), z + 40 * math.sin(ang)); self.canopy.add(c0)
                        break
                if placed: break
            if not placed and fallback:
                col, pid = fallback
                x, z = at(i, k)
                r = on(col, x, y, z, pid)
                if sp.fits(r): sp.add(r); out.append(r); self.studs[(i, k, y)] = False
        self.rows += out
        for r in self.rows:
            if r.startswith('1 '):
                t = r.split(); self.canopy.add(cell(float(t[2]), float(t[4])))
        return Piece(self.rows, self.cells, self.canopy)


def outward(i, k, ci, ck):
    """the angle from the centre (ci, ck) (in stud units, may be fractional) to the centre of square (i, k)"""
    return math.atan2(k + .5 - ck, i + .5 - ci)


def _ik(x, z): return round(x / S), round(z / S)


def _pick(rng, pal):
    """pal: [(colour, weight), ...]"""
    tot = sum(w for _, w in pal); r = rng.uniform(0, tot)
    for c, w in pal:
        r -= w
        if r <= 0: return c
    return pal[-1][0]


def crown(g, ci, ck, y, tiers, leaves, core=(DBROWN, '3062b'), fallback=None, spread=0):
    """tiers of foliage on a core of 1 x 1 round bricks at square (ci, ck), from surface y: each tier a plate (w, d, colour)
    pierced by the core, leaves wanted on its studs pointing away from the core. leaves(t, rng) -> [(pid, col), ...].
    spread: shift each tier's plate off the core by up to this many studs (an irregular crown). Returns the top."""
    rng = g.rng
    n = len(tiers)
    for t, (w, d, col) in enumerate(tiers):
        lo_i = max(ci - w + 1, ci - (w - 1) // 2 - spread); hi_i = min(ci, ci - (w - 1) // 2 + spread + (1 - w % 2))
        lo_k = max(ck - d + 1, ck - (d - 1) // 2 - spread); hi_k = min(ck, ck - (d - 1) // 2 + spread + (1 - d % 2))
        oi, ok = rng.randint(lo_i, max(lo_i, hi_i)), rng.randint(lo_k, max(lo_k, hi_k))
        top = g.blk(col, 'plate', oi, ok, w, d, y)
        last = t == n - 1
        sts = [(i, k) for i in range(oi, oi + w) for k in range(ok, ok + d) if last or (i, k) != (ci, ck)]
        rng.shuffle(sts)
        sts.sort(key=lambda c: -((c[0] + .5 - (ci + .5)) ** 2 + (c[1] + .5 - (ck + .5)) ** 2))   # the outer studs first
        for i, k in sts:
            g.want(i, k, top, leaves(t, rng), outward(i, k, ci + .5, ck + .5) if (i, k) != (ci, ck) else None)
        y = top if last else g.solid(core[0], core[1], ci, ck, 1, 1, top)
    return y


def _round_trunk(g, i, k, y, cols, n, base):
    """a 2 x 2 round-brick trunk from square (i, k) (its back-left), n bricks"""
    for q in range(n): y = g.solid(cols[q % len(cols)] if isinstance(cols, list) else cols, '3941', i, k, 2, 2, y, base=base)
    return y


# ── the trees ──
def cypress(x, z, yup=4, seed=0, tiers=None):
    """sweet-smelling cypress (Od. V.64): a dark narrow spire. Footprint 2 x 2. A trunk of reddish-brown round bricks, then a
    column of dark green round bricks, each course pierced through a 2 x 2 plate whose three free studs carry round plates
    with leaves, turned outward; the plates walk round the column so the spire is full on every side; a cone at the tip."""
    g = Grow(seed); rng = g.rng
    i0, k0 = _ik(x, z)
    n = tiers or rng.randint(8, 10)
    y = g.solid(DBROWN, '4032a', i0, k0, 2, 2, yup, base=yup)
    ci, ck = i0 + rng.randint(0, 1), k0 + rng.randint(0, 1)
    y = g.solid(RB, '3062b', ci, ck, 1, 1, y)
    y = g.solid(RB, '3062b', ci, ck, 1, 1, y)
    corners = [(0, 0), (-1, 0), (-1, -1), (0, -1)]
    start = rng.randint(0, 3)
    for t in range(n):
        di, dk = corners[(start + t) % 4]
        narrow = t >= n - 2
        if narrow:
            w, d = (2, 1) if t % 2 else (1, 2)
            oi, ok = (ci + di, ck) if w == 2 else (ci, ck + dk)
        else:
            w, d, oi, ok = 2, 2, ci + di, ck + dk
        top = g.blk(DGREEN, 'plate', oi, ok, w, d, y)
        for i in range(oi, oi + w):
            for k in range(ok, ok + d):
                if (i, k) != (ci, ck):
                    col = DGREEN if rng.random() < .7 else (GREEN if rng.random() < .6 else OLIVE)
                    g.want(i, k, top, [('32607', col)], outward(i, k, ci + .5, ck + .5), .5)
        y = g.solid(DGREEN, '3062b', ci, ck, 1, 1, top)
    g.solid(DGREEN, '4589', ci, ck, 1, 1, y)
    return g.finish(fallback=(DGREEN, '98138'))


def olive(x, z, yup=4, seed=0):
    """the olive (Od. XIII.102, XXIII.190): a gnarled, twisting grey-brown trunk of round bricks that wanders stud to stud,
    forking into two or three limbs; a broad, low, silvery crown of sand green, olive and dark green leaves. Footprint 2 x 2."""
    g = Grow(seed); rng = g.rng
    i0, k0 = _ik(x, z)
    bark = [DBG, DBROWN, DBG, LBG] if rng.random() < .5 else [DBROWN, DBG, DBG, DBROWN]
    y = g.solid(DBROWN, '4032a', i0, k0, 2, 2, yup, base=yup)
    # the gnarled bole: two strands on a diagonal, a twist plate, the other diagonal, another twist
    diag = [(0, 0), (1, 1)] if rng.random() < .5 else [(1, 0), (0, 1)]
    other = [(1 - a, b) for a, b in diag]
    for strands, h in ((diag, 1), (other, 1)):
        for q, (a, b) in enumerate(strands): g.solid(bark[q], '3062b', i0 + a, k0 + b, 1, 1, y)
        y += 24
        y = g.solid(bark[2], '4032a', i0, k0, 2, 2, y)
    # the fork: a 2 x 4 plate across the bole, limbs rising from its ends
    along_x = rng.random() < .5
    if along_x: fi, fk, fw, fd = i0 - 1, k0, 4, 2
    else: fi, fk, fw, fd = i0, k0 - 1, 2, 4
    y = g.blk(DBROWN, 'plate', fi, fk, fw, fd, y)
    ends = [(fi, fk + rng.randint(0, 1)), (fi + 3, fk + rng.randint(0, 1))] if along_x else \
           [(fi + rng.randint(0, 1), fk), (fi + rng.randint(0, 1), fk + 3)]
    mid = (i0 + rng.randint(0, 1), k0 + rng.randint(0, 1))
    cx, cz = i0 + 1, k0 + 1
    silver = lambda t, r: [(p, _pick(r, [(SANDGREEN, 5), (OLIVE, 3), (DGREEN, 1)])) for p in (['2417', '2423'] if r.random() < .5 else ['2423', '2417'])] + [('32607', SANDGREEN)]
    for q, (li, lk) in enumerate(ends + [mid]):
        h = 1 + (q == 2) + rng.randint(0, 1)
        yy = y
        for s in range(h): yy = g.solid(bark[(q + s) % 4], '3062b', li, lk, 1, 1, yy)
        # a pad of foliage leaning out from the limb
        w, d = rng.choice([(2, 2), (3, 2), (2, 3), (4, 2), (2, 4)])
        oi = li - (0 if li >= cx else w - 1) if q < 2 else li - w // 2
        ok = lk - (0 if lk >= cz else d - 1) if q < 2 else lk - d // 2
        top = g.blk(_pick(rng, [(OLIVE, 2), (SANDGREEN, 2)]), 'plate', oi, ok, w, d, yy)
        pcx, pcz = oi + w / 2, ok + d / 2
        sts = [(i, k) for i in range(oi, oi + w) for k in range(ok, ok + d)]
        rng.shuffle(sts)
        # a small top knot on the pad, the leaves round it
        ki, kk = rng.choice(sts)
        kt = g.solid(SANDGREEN if rng.random() < .6 else OLIVE, '3062b' if q == 2 else '4032a' if False else '3062b', ki, kk, 1, 1, top) if rng.random() < .7 else None
        for i, k in sts:
            g.want(i, k, top, silver(0, rng), math.atan2(k + .5 - cz, i + .5 - cx) if (i, k) != (ki, kk) else None)
        if kt: g.want(ki, kk, kt, [('2417', _pick(rng, [(SANDGREEN, 2), (OLIVE, 1)])), ('2423', SANDGREEN)], None, 3.2)
    return g.finish(fallback=(SANDGREEN, '98138'))
