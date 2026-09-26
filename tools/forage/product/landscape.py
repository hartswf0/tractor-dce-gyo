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
        self.occ = defaultdict(list)      # (i, k) -> [(bottom, top)] of the grid parts placed

    def clear(self, i, k, w, d, bottom, top):
        return all(not (b < top and bottom < t) for a in range(w) for c in range(d) for b, t in self.occ[(i + a, k + c)])

    def _occupy(self, i, k, w, d, bottom, top):
        for a in range(w):
            for c in range(d): self.occ[(i + a, k + c)].append((bottom, top))

    def solid(self, col, pid, i, k, w, d, bottom, studs=True, rot=0, base=None):
        """a grid part covering squares (i..i+w, k..k+d) standing at `bottom`; returns its top"""
        b = ldbox.box(pid, False)
        h = b[1][1] - b[0][1]
        cx, cz = (i + w / 2) * S, (k + d / 2) * S
        self.rows.append(on(col, cx, bottom, cz, pid, rot))
        top = bottom + round(h)
        self._occupy(i, k, w, d, bottom, top)
        for a in range(w):
            for c in range(d):
                self.studs.pop((i + a, k + c, bottom), None)
                if base is not None and bottom == base: self.cells.add((i + a, k + c))
                if studs: self.studs[(i + a, k + c, top)] = True
        return top

    def blk(self, col, kind, i, k, w, d, bottom, base=None):
        table, h = KINDS[kind]
        self.rows.append(block(col, kind, i, k, w, d, bottom))
        self._occupy(i, k, w, d, bottom, bottom + h)
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

    def finish(self, fallback=None, dress=None, base=None):
        """seat the wanted free parts where they fit; a stud left bare in the crown gets `fallback` (col, pid) if it fits;
        dress(rng) -> [(pid, col)]: then every stud still bare above the ground is offered those"""
        if dress:
            wanted = {(i, k, y) for i, k, y, *_ in self.free}
            low = min((y for (_, _, y) in self.studs), default=0)
            for (i, k, y), f in sorted(self.studs.items()):
                if f and (i, k, y) not in wanted and y > low: self.free.append((i, k, y, dress(self.rng), None, 3.2))
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
                    x, z = at(i, k)
                    if pid == 'vine':      # a 1 x 1 plate with a clip, the curled vine hanging from it
                        q4 = round(ang / (math.pi / 2)) % 4
                        dx, dz = DIRS[q4]
                        rs = [put(col if col != GREEN else DGREEN, x, y + 8, z, '61252', RY(aim(-math.pi / 2, math.atan2(dz, dx)))),
                              row(col, mat_mul(T(x + 20 * dx, -(y + 4), z + 20 * dz), mat_mul(RY(math.atan2(dx, dz)), RZ(math.pi))), '1997')]
                    elif pid not in SEAT:  # a grid part (a round tile for a fruit, a cone)
                        rs = [on(col, x, y, z, pid)]
                    else:
                        h, local = SEAT[pid]
                        rs = [put(col, x, y + h, z, pid, RY(aim(local, ang)))]
                    if all(sp.fits(r) for r in rs):
                        for r in rs: sp.add(r); out.append(r)
                        self.studs[(i, k, y)] = False; placed = True
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


def pick(rng, pal):
    """pal: [(colour, weight), ...]"""
    tot = sum(w for _, w in pal); r = rng.uniform(0, tot)
    for c, w in pal:
        r -= w
        if r <= 0: return c
    return pal[-1][0]


def _round_trunk(g, i, k, y, cols, n, base):
    """a 2 x 2 round-brick trunk from square (i, k) (its back-left), n bricks"""
    for q in range(n): y = g.solid(cols[q % len(cols)] if isinstance(cols, list) else cols, '3941', i, k, 2, 2, y, base=base)
    return y


DIRS = [(1, 0), (0, 1), (-1, 0), (0, -1)]


def tiers(g, ci, ck, y, plan, pal, core=2, spacer=RB, plate_pal=None, small=None, extra=(), vine=0.0, top_cone=None):
    """a crown built on a core (core x core squares from (ci, ck)) whose top is at y, from a plan read bottom to top:
      (w, d)               a tier: a plate over the core (shifted a little at random), stacked straight on what is below;
      ('gap', pid, col)    a spacer on the core: a 2 x 2 leaf rosette (4727), a round plate (4032a), a 1 x 1 plate (3024) ...
      ('lift', n)          n round bricks of the core.
    Then every tier's studs that nothing covers carry leaves turned away from the centre: a 6 x 5 leaf where there is room
    (three studs clear, or the top tier), else a 4 x 3 leaf, else a round plate with leaves; `vine`: the share that hang a
    curled vine from a clip instead. pal: leaf colours [(col, weight)]; plate_pal: the tier plates'; small: the small leaves'.
    Returns the top."""
    rng = g.rng
    plate_pal = plate_pal or pal
    small = small or pal
    cx, cz = ci + core / 2, ck + core / 2
    placed = []          # [kind, rect, top]
    for e in plan:
        if e[0] == 'lift':
            for q in range(e[1]):
                if not g.clear(ci, ck, core, core, y, y + 24): break
                y = g.solid(spacer, '3941' if core == 2 else '3062b', ci, ck, core, core, y)
                placed.append(['core', (ci, ck, core, core), y])
            continue
        if e[0] == 'gap':
            pid, col = e[1], (e[2] if len(e) > 2 and e[2] is not None else spacer)
            if pid == '4727' and core != 2: pid = '3024'
            b = ldbox.box(pid, False); h = round(b[1][1] - b[0][1])
            if not g.clear(ci, ck, core, core, y, y + h): break
            y = g.solid(col if not isinstance(col, list) else pick(rng, col), pid, ci, ck, core, core, y)
            placed.append(['core', (ci, ck, core, core), y])
            continue
        w, d = e
        prev = next((p for p in reversed(placed) if p[0] == 'tier'), None) if placed and placed[-1][0] == 'tier' else None
        ok_ = False
        for ww, dd in ((w, d), (d, w), (max(core, w - 2), d), (w, max(core, d - 2)), (max(core, w - 2), max(core, d - 2))):
            lo_i, hi_i = ci + core - ww, ci
            lo_k, hi_k = ck + core - dd, ck
            mi, mk = ci - (ww - core) // 2, ck - (dd - core) // 2
            cands = [(min(hi_i, max(lo_i, mi + a)), min(hi_k, max(lo_k, mk + b))) for a, b in
                     [(rng.randint(-1, 1), rng.randint(-1, 1)), (0, 0), (1, 0), (0, 1), (-1, 0), (0, -1)]]
            for oi, ok in cands:
                if prev:   # a tier straight on a tier must sit inside it
                    pi, pk, pw, pd = prev[1]
                    if not (pi <= oi and oi + ww <= pi + pw and pk <= ok and ok + dd <= pk + pd): continue
                if g.clear(oi, ok, ww, dd, y, y + 8): ok_ = True; break
            if ok_: break
        if not ok_: break
        y = g.blk(pick(rng, plate_pal), 'plate', oi, ok, ww, dd, y)
        placed.append(['tier', (oi, ok, ww, dd), y])
    # the leaves, now that everything above each tier is known
    for n, (kind, (oi, ok, ww, dd), top) in enumerate(placed):
        if kind != 'tier': continue
        above = placed[n + 1] if n + 1 < len(placed) else None
        cover = set()
        if above:
            ai, ak, aw, ad = above[1]
            cover = {(ai + a, ak + b) for a in range(aw) for b in range(ad)}
        ring = [(i, k) for i in range(oi, oi + ww) for k in range(ok, ok + dd) if (i, k) not in cover]
        def room(c):   # how many studs clear outward-inward: the distance to the covered squares
            return min([abs(c[0] - q[0]) + abs(c[1] - q[1]) for q in cover] or [9])
        rng.shuffle(ring)
        ring.sort(key=lambda c: -room(c) * 3 - ((c[0] + .5 - cx) ** 2 + (c[1] + .5 - cz) ** 2) ** .5 + rng.uniform(0, 1.5))
        for q, (i, k) in enumerate(ring):
            ang = outward(i, k, cx, cz) if (i + .5, k + .5) != (cx, cz) else None
            opts = []
            if vine and rng.random() < vine and room((i, k)) >= 1 and ((i + .5 - cx) ** 2 + (k + .5 - cz) ** 2) > 2:
                opts.append(('vine', pick(rng, pal)))
            if room((i, k)) >= 3: opts.append(('2417', pick(rng, pal)))
            opts += ([('2423', pick(rng, pal)), ('32607', pick(rng, small))] if q % 3 else [('32607', pick(rng, small)), ('2423', pick(rng, pal))])
            opts += list(extra)
            g.want(i, k, top, opts, ang, .4)
    if top_cone and g.clear(ci, ck, core, core, y, y + 48):
        g.solid(top_cone[0], top_cone[1], ci, ck, core, core, y)
    return y


def _root(g, x, z, yup, col=DBROWN):
    i0, k0 = _ik(x, z)
    return i0, k0, g.solid(col, '4032a', i0, k0, 2, 2, yup, base=yup)


def _bole(g, i, k, y, cols, n, core=2):
    for q in range(n): y = g.solid(cols[q % len(cols)], '3941' if core == 2 else '3062b', i, k, core, core, y)
    return y


def _dress(pal):
    return lambda r: [('32607', pick(r, pal)), ('98138', pick(r, pal))]


# ── the trees: each stands on a 2 x 2 root plate whose back-left stud corner is (x, z), on studs at yup ──
def cypress(x, z, yup=4, seed=0, height=None):
    """the sweet-smelling cypress (Od. V.64, Calypso's grove): a tall, dark, narrow spire. A root plate and a short trunk of
    reddish-brown round brick, then a column of dark green 2 x 2 leaf rosettes (4727) stacked on their centre studs, one or two
    in a lighter green, drawn to a point with a cone. Footprint 2 x 2, about 10 to 12 bricks tall."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup)
    y = g.solid(RB, '3941', i0, k0, 2, 2, y)
    n = height or rng.randint(10, 13)
    light = {rng.randint(2, n - 2) for _ in range(2)}
    for q in range(n):
        y = g.solid(GREEN if q in light else DGREEN, '4727', i0, k0, 2, 2, y)
    g.solid(DGREEN, '3942c', i0, k0, 2, 2, y)
    return g.finish()


def _adapt(g, ti, tk, y, col):
    """a 2 x 2 round plate over a 1 x 1 stem at (ti, tk), where the crown's 2 x 2 core begins; returns (ci, ck, top)"""
    rng = g.rng
    for ci, ck in rng.sample([(ti - 1, tk - 1), (ti, tk - 1), (ti - 1, tk), (ti, tk)], 4):
        if g.clear(ci, ck, 2, 2, y, y + 8): return ci, ck, g.solid(col, '4032a', ci, ck, 2, 2, y)
    return None


def olive(x, z, yup=4, seed=0):
    """the olive (Od. XIII.102 by the cave of the Nymphs; XXIII.190 the olive of the bed; V.477 wild and tame olive): a gnarled,
    twisting grey-brown bole of two strands of round bricks that change places through round plates, forking on a brown plate
    into two limbs; each limb ends in a low, broad crown of silvery leaves (sand green, olive, a little dark green) in tiers,
    the grey-brown branches showing between. Footprint 2 x 2 (crown about 10 x 10)."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup)
    bark = [DBG, DBROWN, DBG, LBG] if rng.random() < .5 else [DBROWN, DBG, DBG, DBROWN]
    diag = [(0, 0), (1, 1)] if rng.random() < .5 else [(1, 0), (0, 1)]
    other = [(1 - a, b) for a, b in diag]
    for strands in (diag, other):
        for q, (a, b) in enumerate(strands): g.solid(bark[q], '3062b', i0 + a, k0 + b, 1, 1, y)
        y = g.solid(bark[2], '4032a', i0, k0, 2, 2, y + 24)
    along_x = rng.random() < .5
    fi, fk, fw, fd = (i0 - 1, k0, 4, 2) if along_x else (i0, k0 - 1, 2, 4)
    y = g.blk(DBROWN, 'plate', fi, fk, fw, fd, y)
    ends = [(fi, fk + rng.randint(0, 1)), (fi + 3, fk + rng.randint(0, 1))] if along_x else \
           [(fi + rng.randint(0, 1), fk), (fi + rng.randint(0, 1), fk + 3)]
    rng.shuffle(ends)
    pal = [(SANDGREEN, 5), (OLIVE, 3), (DGREEN, 1)]
    for n, (li, lk) in enumerate(ends):
        yy, h = y, 1 + n + rng.randint(0, 1)
        if not g.clear(li, lk, 1, 1, y, y + 24 * h + 8): continue
        for q in range(h): yy = g.solid(bark[(n + q) % 4], '3062b', li, lk, 1, 1, yy)
        ad = _adapt(g, li, lk, yy, bark[n])
        if not ad: continue
        ci, ck, yy = ad
        plan = rng.choice([[(4, 6), (4, 4), ('gap', '4032a', bark[1]), (6, 4), (4, 4), ('gap', '4032a', bark[0]), (4, 4), (2, 2)],
                           [(6, 6), (4, 4), ('gap', '4032a', bark[1]), (4, 6), (2, 4), ('gap', '4032a', bark[0]), (2, 2)],
                           [(4, 4), (2, 4), ('gap', '4032a', bark[1]), (6, 6), (4, 4), ('gap', '4032a', bark[0]), (4, 4)]])
        tiers(g, ci, ck, yy, plan, pal, core=2, spacer=bark[n], plate_pal=[(OLIVE, 1), (SANDGREEN, 1)], small=[(SANDGREEN, 2), (OLIVE, 1)])
    return g.finish(fallback=(SANDGREEN, '98138'), dress=_dress([(SANDGREEN, 2), (OLIVE, 1)]))


def oak(x, z, yup=4, seed=0):
    """the oak (Od. XIV.327 and XIX.296 Zeus' oak at Dodona; XIII.409 acorns for the swine; XII.357 leaves of a high oak): broad
    and dark. A thick trunk of 2 x 2 round bricks in dark and reddish brown, then a great crown in three lobes of stepped
    tiers fringed with 4 x 3 leaves and 6 x 5 leaves where there is room, dark leaf rosettes between. Footprint 2 x 2 (crown
    about 14 x 14)."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup)
    y = _bole(g, i0, k0, y, [DBROWN, RB], rng.randint(3, 4))
    pal = [(DGREEN, 5), (GREEN, 2), (OLIVE, 1)]
    plan = [(8, 8), (6, 6), ('gap', '4727', DGREEN), (8, 8), (6, 8), (4, 6), ('gap', '4727', GREEN), (6, 8), (6, 6), (4, 4),
            ('gap', '4727', DGREEN), (4, 6), (2, 4)]
    tiers(g, i0, k0, y, plan, pal, core=2, spacer=DBROWN, plate_pal=[(DGREEN, 3), (GREEN, 1)])
    return g.finish(fallback=(DGREEN, '98138'), dress=_dress(pal))


def plane(x, z, yup=4, seed=0):
    """the plane tree (Iliad II.307, the fair plane at Aulis by the spring): a tall trunk mottled tan, white and grey where the
    bark flakes, and a broad, high crown of light green leaves in stepped tiers. Footprint 2 x 2 (crown about 12 x 12)."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup, DTAN)
    y = _bole(g, i0, k0, y, [TAN] + [rng.choice([LBG, WHITE, DTAN, TAN]) for _ in range(4)], 5)
    pal = [(GREEN, 4), (BGREEN, 2), (DGREEN, 1)]
    plan = [(6, 8), (6, 6), ('gap', '4727', GREEN), (8, 8), (6, 6), (4, 4), ('gap', '4727', BGREEN), (6, 6), (4, 6),
            ('gap', '4727', GREEN), (4, 4), (2, 2)]
    tiers(g, i0, k0, y, plan, pal, core=2, spacer=TAN, plate_pal=[(GREEN, 2), (BGREEN, 1)])
    return g.finish(fallback=(GREEN, '98138'), dress=_dress(pal))


def poplar(x, z, yup=4, seed=0, white=False):
    """the poplar, black (aigeiros: Od. VII.106, X.510 Persephone's grove, XVII.208 ringing Ithaca's fountain) or white (leuke,
    white=True: pale bark, silvery leaves). A slender trunk of 1 x 1 round bricks, a round plate where the crown begins, and a
    tall, narrow crown of small tiers with leaf rosettes between. Footprint 2 x 2 (crown about 7 x 7, 11 bricks tall)."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup, DBG if not white else LBG)
    ti, tk = i0 + rng.randint(0, 1), k0 + rng.randint(0, 1)
    bark = [WHITE, LBG, WHITE] if white else [DBG, DBROWN, DBG]
    y = _bole(g, ti, tk, y, bark, 3, core=1)
    ci, ck, y = _adapt(g, ti, tk, y, bark[1])
    pal = [(SANDGREEN, 4), (OLIVE, 1), (DGREEN, 1)] if white else [(GREEN, 3), (DGREEN, 3), (OLIVE, 1)]
    small = [(WHITE, 1), (SANDGREEN, 2)] if white else pal
    ros = [GREEN, DGREEN] if white else [DGREEN, GREEN]
    plan = [(4, 4), ('gap', '4727', ros[0]), (4, 6), (4, 4), ('gap', '4727', ros[1]), (4, 4), (2, 4), ('gap', '4727', ros[0]),
            (4, 4), ('gap', '4727', ros[1]), (4, 4), (2, 2), ('gap', '4727', ros[0]), (2, 4), ('gap', '4727', ros[1]), (2, 2)]
    tiers(g, ci, ck, y, plan, pal, core=2, spacer=bark[1], small=small,
          plate_pal=[(SANDGREEN, 1), (OLIVE, 1)] if white else [(GREEN, 1), (DGREEN, 1)])
    return g.finish(fallback=(pal[0][0], '98138'), dress=_dress(small))


def fig(x, z, yup=4, seed=0, fruit=True):
    """the fig (Od. VII.116 Alcinous' orchard, XI.590 Tantalus, XII.103 and 432 the wild fig over Charybdis, XXIV.341 Laertes'
    forty): low and spreading, smooth grey stems from one root, big 6 x 5 leaves and the three-leaf plant in green, dark purple
    figs on bare studs. Footprint 2 x 2 (crown about 10 x 10)."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup, DBG)
    y = g.blk(LBG, 'plate', i0 - 1, k0, 4, 2, y) if rng.random() < .5 else g.blk(LBG, 'plate', i0, k0 - 1, 2, 4, y)
    starts = g.studs_at(y); rng.shuffle(starts)
    starts.sort(key=lambda c: -((c[0] - i0 - .5) ** 2 + (c[1] - k0 - .5) ** 2) + rng.uniform(0, 1))
    pal = [(GREEN, 3), (DGREEN, 2), (BGREEN, 1)]
    for n, (li, lk) in enumerate(starts[:3]):
        yy, h = y, 1 + (n == 2)
        if not g.clear(li, lk, 1, 1, y, y + 24 * h + 8): continue
        for q in range(h): yy = g.solid([LBG, DBG][q % 2], '3062b', li, lk, 1, 1, yy)
        ad = _adapt(g, li, lk, yy, LBG)
        if not ad: continue
        tiers(g, ad[0], ad[1], ad[2], rng.choice([[(4, 4), (2, 4), ('gap', '4032a', LBG), (4, 4), (2, 2)],
                                                  [(6, 4), (4, 4), ('gap', '4727', GREEN), (4, 4)]]), pal, core=2, spacer=LBG,
              plate_pal=[(GREEN, 1), (DGREEN, 1)], extra=[('6255', GREEN)])
    return g.finish(fallback=(GREEN, '98138'), dress=lambda r: [('98138', DPURPLE)] if fruit and r.random() < .5 else [('6255', GREEN), ('32607', GREEN)])


def willow(x, z, yup=4, seed=0):
    """the willow by the water (itea: Od. X.510, the willows that shed their fruit in Persephone's grove): a leaning trunk and a
    grey-green crown with curled vines hanging from clips all round. Footprint 2 x 2 (crown about 10 x 10)."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup)
    y = g.solid(RB, '3941', i0, k0, 2, 2, y)
    ti, tk = i0 + rng.randint(0, 1), k0 + rng.randint(0, 1)
    y = g.solid(DBROWN, '3062b', ti, tk, 1, 1, y)
    di, dk = rng.choice(DIRS)
    y = g.blk(DBROWN, 'plate', min(ti, ti + di), min(tk, tk + dk), 1 + abs(di), 1 + abs(dk), y)
    ti, tk = ti + di, tk + dk
    y = g.solid(RB, '3062b', ti, tk, 1, 1, y)
    ci, ck, y = _adapt(g, ti, tk, y, RB)
    pal = [(OLIVE, 3), (SANDGREEN, 2), (GREEN, 1)]
    tiers(g, ci, ck, y, [(6, 6), (4, 6), ('gap', '4032a', RB), (6, 6), (6, 4), (4, 4), ('gap', '4727', GREEN), (4, 4), (2, 2)], pal,
          core=2, spacer=RB, plate_pal=[(OLIVE, 1), (SANDGREEN, 1)], vine=.5)
    return g.finish(fallback=(OLIVE, '98138'), dress=_dress(pal))


def alder(x, z, yup=4, seed=0):
    """the alder (klethre: Od. V.64 and 239, in Calypso's grove, felled for the raft): a straight dark trunk and a rounded dark
    green crown of small leaves in tiers with rosettes between. Footprint 2 x 2 (crown about 8 x 8)."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup)
    ti, tk = i0 + rng.randint(0, 1), k0 + rng.randint(0, 1)
    y = _bole(g, ti, tk, y, [DBROWN, DBG, DBROWN], 3, core=1)
    ci, ck, y = _adapt(g, ti, tk, y, DBROWN)
    pal = [(DGREEN, 4), (GREEN, 2)]
    tiers(g, ci, ck, y, [(4, 4), (2, 4), ('gap', '4727', DGREEN), (6, 6), (4, 4), ('gap', '4727', GREEN), (4, 6), (2, 4),
                         ('gap', '4727', DGREEN), (2, 2)], pal, core=2, spacer=DBROWN, plate_pal=[(DGREEN, 1)])
    return g.finish(fallback=(DGREEN, '98138'), dress=_dress(pal))


def pine(x, z, yup=4, seed=0, kind='fir'):
    """the fir (elate: Od. V.239 "fir that reached to heaven", felled for the raft; the Greek fir of Cephallenia): a dark cone of
    stepped tiers, wide at the foot and narrowing, dark leaf rosettes on the core between, a cone on top. kind='stone': the
    stone pine, a tall bare leaning trunk and a flat umbrella crown. Footprint 2 x 2."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup)
    pal = [(DGREEN, 5), (GREEN, 1)]
    if kind == 'stone':
        ti, tk = i0 + rng.randint(0, 1), k0 + rng.randint(0, 1)
        y = _bole(g, ti, tk, y, [RB, DBROWN], 3, core=1)
        di, dk = rng.choice(DIRS)
        y = g.blk(RB, 'plate', min(ti, ti + di), min(tk, tk + dk), 1 + abs(di), 1 + abs(dk), y)
        ti, tk = ti + di, tk + dk
        y = _bole(g, ti, tk, y, [DBROWN, RB], 3, core=1)
        ci, ck, y = _adapt(g, ti, tk, y, RB)
        tiers(g, ci, ck, y, [(6, 6), (4, 4), ('gap', '4032a', RB), (8, 8), (6, 6), (4, 4)], [(DGREEN, 3), (GREEN, 1), (OLIVE, 1)],
              core=2, spacer=RB, plate_pal=[(DGREEN, 1)])
    else:
        y = g.solid(RB, '3941', i0, k0, 2, 2, y)
        plan = [(8, 8), (6, 6), ('gap', '4727', DGREEN), (8, 6), (6, 4), ('gap', '4727', DGREEN), (6, 6), (4, 4),
                ('gap', '4727', DGREEN), (6, 4), (4, 2), ('gap', '4727', DGREEN), (4, 4), (2, 2), ('gap', '4727', DGREEN), (2, 4),
                ('gap', '4727', DGREEN)]
        tiers(g, i0, k0, y, plan, pal, core=2, spacer=DBROWN, plate_pal=[(DGREEN, 1)], top_cone=(DGREEN, '3942c'))
    return g.finish(fallback=(DGREEN, '98138'), dress=_dress(pal))


def fruit_tree(x, z, yup=4, seed=0, kind='pear'):
    """an orchard tree (Od. VII.115 and XXIV.340: pear, apple, pomegranate; quince): a short trunk and a small round crown with
    fruit on the bare studs (pear yellowish green, apple red, pomegranate dark red, quince yellow). Footprint 2 x 2 (crown 6 x 6)."""
    g = Grow(seed); rng = g.rng
    i0, k0, y = _root(g, x, z, yup)
    ti, tk = i0 + rng.randint(0, 1), k0 + rng.randint(0, 1)
    y = _bole(g, ti, tk, y, [RB, DBROWN], 2, core=1)
    ci, ck, y = _adapt(g, ti, tk, y, RB)
    pal = [(GREEN, 3), (BGREEN, 1), (DGREEN, 1)]
    fruit = {'pear': YGREEN, 'apple': RED, 'pomegranate': DRED, 'quince': YELLOW}[kind]
    tiers(g, ci, ck, y, [(4, 4), (2, 4), ('gap', '4727', GREEN), (4, 4), (2, 2)], pal, core=2, spacer=RB, plate_pal=[(GREEN, 1)])
    return g.finish(fallback=(fruit, '98138'), dress=lambda r: [('98138', fruit)] if r.random() < .6 else [('32607', GREEN), ('98138', fruit)])


# ── the ground ──
def _h(*a):
    """a small deterministic hash in [0, 1)"""
    v = 0x345678
    for x in a: v = ((v ^ (int(x) & 0xffffffff)) * 1000003) & 0xffffffff; v ^= v >> 13
    return (v % 10007) / 10007


def patch(i, k, seed, size=3):
    """a value that is the same over irregular patches about `size` studs across"""
    j = int(_h(k // size, seed, 7) * size)
    return _h((i + j) // size, (k + int(_h(i // size, seed, 3) * size)) // size, seed)


TERRAIN = {   # type: (finish colours [(col, weight)], body colour under the finish)
    't': ([(GREEN, 6), (BGREEN, 1), (OLIVE, 1), (DGREEN, 1)], GREEN),          # turf
    'm': ([(GREEN, 5), (BGREEN, 2), (OLIVE, 1)], GREEN),                          # meadow (turf with flowers)
    'e': ([(DTAN, 5), (RB, 1), (TAN, 1)], DTAN),                                  # earth, a beaten floor
    's': ([(TAN, 6), (DTAN, 1), (LNOUGAT, 0)], TAN),                              # sand
    'g': ([(LBG, 3), (DBG, 2), (TAN, 1)], DBG),                                   # shingle
    'r': ([(LBG, 3), (DBG, 2), (DTAN, 1)], DBG),                                  # rock
    'p': ([(LBG, 3), (TAN, 2), (DTAN, 1)], DBG),                                  # paving (ashlar)
    'w': ([(TLBLUE, 4), (TCLEAR, 1)], BLUE),                                      # water (clear tiles over blue)
    'f': ([(WHITE, 3), (TCLEAR, 1)], BLUE),                                       # foam at the water's edge
    'd': ([(TLBLUE, 3), (TDBLUE, 1)], BLUE),                                      # deeper water
    'S': ([(LBG, 3), (TAN, 1)], LBG),                                             # steps: stone treads, stone risers
    'c': ([(TAN, 3), (DTAN, 2), (LBG, 1)], DTAN),                                 # a threshing floor's beaten stone
}
WET = set('wfd')

Ground = namedtuple('Ground', 'rows top studs')
Ground.__doc__ = 'rows; top[(i, k)] = the yup of the finished surface there; studs = squares left studded (things stand there)'


def ground(x0, z0, tmap, hmap=None, yup=4, keep=(), seed=0, dress=0.05, slopes=True):
    """lay a finished ground on a studded surface (a baseplate: yup 4) from the stud whose back-left corner is (x0, z0).
    tmap: rows of characters, one per stud (row = z, column = x): t turf, m meadow, e earth, s sand, g shingle, r rock,
    p paving (ashlar, staggered), w water, d deep water, f foam, and '.' or ' ' nothing (left for the caller).
    hmap: rows of digits, plates of rise under each stud (default 0).
    Land finishes at yup + 8 * (h + 1) (h plates, then a tile); water one plate lower, at yup + 8 * h (so water needs h >= 1:
    h - 1 blue plates, then clear tiles; on a green baseplate give water h 2 and its banks h 2 or more).
    keep: (i, k) squares that stay studded (a plate instead of the tile) for things to stand on.
    dress: the share of turf/meadow/shingle squares that get a plant, a flower or a pebble (they are then studded).
    slopes: where land stands two or more plates above a neighbour, its edge is a cheese slope instead of the last plate and tile.
    Returns Ground(rows, top, studs)."""
    rng = random.Random(seed)
    i0, k0 = _ik(x0, z0)
    keep = set(keep)
    T_, H_ = {}, {}
    for kk, line in enumerate(tmap):
        for ii, ch in enumerate(line):
            if ch in TERRAIN:
                c = (i0 + ii, k0 + kk)
                T_[c] = ch
                H_[c] = int(hmap[kk][ii]) if hmap and kk < len(hmap) and ii < len(hmap[kk]) and hmap[kk][ii].isdigit() else 0
    top = {c: yup + 8 * (H_[c] + (0 if T_[c] in WET else 1)) for c in T_}
    rows, studs = [], set()
    # the plates under the finish
    slope_at = {}
    if slopes:
        for c, t in T_.items():
            if t in WET or t == 'p' or c in keep or H_[c] < 1: continue
            lows = []
            for d in DIRS:
                n = (c[0] + d[0], c[1] + d[1])
                if n in top and top[c] - top[n] >= 16: lows.append((top[n], d))
            if lows: slope_at[c] = min(lows)[1]
    layers = defaultdict(dict)
    for c, t in T_.items():
        h = H_[c] - (1 if t in WET else 0) - (1 if c in slope_at else 0)
        body = TERRAIN[t][1]
        for l in range(max(0, h)):
            layers[l][c] = body if (l < h - 1 or t in WET) else (TERRAIN[t][1] if t not in 'tm' else GREEN)
    for l in sorted(layers):
        sizes = None if l % 2 == 0 else sorted({s for a, b in PLATE for s in ((b, a), (a, b))}, key=lambda s: (-s[0] * s[1], s[0]))
        rows += lay(layers[l], yup + 8 * l, 'plate', sizes)
    # the finish
    fin_t, fin_p, dcells = {}, {}, {}
    for c, t in T_.items():
        base = yup + 8 * (H_[c] - (1 if t in WET else 0) - (1 if c in slope_at else 0))
        pal = TERRAIN[t][0]
        if c in slope_at:
            d = slope_at[c]
            rows.append(on(pick(random.Random(_h(c[0], c[1], seed) * 1e6), pal) if t not in 'tm' else GREEN, *_xz(c, base), '54200',
                           math.atan2(-d[0], -d[1])))
            continue
        if c in keep and t not in WET:
            fin_p.setdefault(base, {})[c] = TERRAIN[t][1] if t not in 'tm' else GREEN
            studs.add(c); continue
        if t in 'tm' and _h(c[0], c[1], seed, 11) < dress * (3 if t == 'm' else 1):
            fin_p.setdefault(base, {})[c] = GREEN
            dcells[c] = (base + 8, t); continue
        v = patch(c[0], c[1], seed + ord(t), 3 if t != 'p' else 1)
        acc, col = 0, pal[0][0]
        tot = sum(w for _, w in pal)
        for cc, w in pal:
            acc += w / tot
            if v < acc: col = cc; break
        fin_t.setdefault((base, t), {})[c] = col
    for (base, t), cells in fin_t.items():
        if t in 'pS':
            rows += _ashlar(cells, base, seed, [LBG, TAN, LBG, DTAN, LBG, TAN] if t == 'p' else [LBG, LBG, TAN, LBG, DBG, LBG])
        elif t == 'g':
            rows += _shingle(cells, base, seed)
        elif t == 'f':
            rows += [on(col if col != TCLEAR else WHITE, *_xz(c, base), '98138' if _h(c[0], c[1], 5) < .5 else '3070b') for c, col in cells.items()]
        else:
            rows += lay(cells, base, 'tile')
    for base, cells in fin_p.items():
        rows += lay(cells, base, 'plate')
    rows, _ = settle(rows + _dressing(dcells, seed))
    return Ground(rows, top, studs)


def _xz(c, yup):
    x, z = at(*c)
    return x, yup, z


def _ashlar(cells, yup, seed, shades=(LBG, TAN, LBG, DTAN, LBG, TAN)):
    """paving of squared stones: 2 x 2 and 1 x 2 tiles in courses that break joint, a stone at a time in its own shade"""
    out, left = [], set(cells)
    for (k, i) in sorted((k, i) for i, k in cells):
        if (i, k) not in left: continue
        opts = []
        r = _h(i, k, seed, 17)
        if r < .35: opts.append((2, 2))
        opts += [(2, 1)] if (k % 2 == 0) == ((i // 2) % 2 == 0) or r > .8 else [(1, 2), (2, 1)]
        opts.append((1, 1))
        for w, d in opts:
            cs = [(i + a, k + b) for a in range(w) for b in range(d)]
            if all(c in left for c in cs):
                for c in cs: left.discard(c)
                col = shades[int(_h(i, k, seed, 19) * len(shades))]
                out.append(block(col, 'tile', i, k, w, d, yup))
                break
    return out


def _shingle(cells, yup, seed):
    """a shingle beach: round tiles and small square tiles in greys and sand, a stone to a stud"""
    out = []
    for (i, k), col in cells.items():
        r = _h(i, k, seed, 23)
        part = '98138' if r < .55 else ('3070b' if r < .85 else '24246')
        c2 = [LBG, DBG, LBG, TAN, WHITE, DBG][int(_h(i, k, seed, 29) * 6)]
        out.append(on(c2, *_xz((i, k), yup), part, (int(r * 40) % 4) * math.pi / 2))
    return out


def _dressing(dcells, seed):
    """a plant or a flower on each studded square the ground kept for dressing: tufts of grass and leaves on turf; poppies,
    white and yellow flowers and violets in a meadow"""
    out = []
    for (i, k), (y, t) in sorted(dcells.items()):
        r = _h(i, k, seed, 31)
        x, z = at(i, k)
        a = r * 7
        if t == 'm' and r < .7:
            col = [RED, RED, WHITE, YELLOW, MLAV_, WHITE][int(_h(i, k, seed, 37) * 6)]
            if r < .35: out.append(put(col, x, y + 8, z, '24866', RY(a)))
            else: out.append(put(col, x, y + 12, z, '3741ac0' + '1356'[int(_h(i, k, 41) * 4)], RY(a)))
        else:
            q = int(_h(i, k, seed, 43) * 3)
            if q == 0: out.append(put([GREEN, DGREEN, OLIVE][int(r * 3) % 3], x, y + 5, z, '6255', RY(a)))
            elif q == 1: out.append(put([BGREEN, GREEN][int(r * 2) % 2], x, y + 8, z, '32607', RY(a)))
            else: out.append(put([GREEN, OLIVE][int(r * 2) % 2], x, y, z, '15279', RY(a)))
    return out


# ── shrubs and the low plants ──
def shrub(x, z, yup=4, seed=0, kind='laurel'):
    """a shrub on its own plate. kind 'laurel' (daphne: Od. IX.183, the Cyclops' cave "shaded with laurels"): an upright dense
    mound, stacked dark green leaf rosettes ringed with 4 x 3 leaves; 'myrtle' (the maquis of the coasts): low, round, dark
    and bright green with white flowers; 'maquis' (the scrub of the hills, lentisk, heath and broom): low, grey-green and olive
    with yellow broom. Footprint 3 x 3 (laurel 4 x 4, maquis 4 x 3)."""
    g = Grow(seed); rng = g.rng
    i0, k0 = _ik(x, z)
    if kind == 'laurel':
        w, d, pal, stack, flower = 4, 4, [(DGREEN, 4), (GREEN, 1)], rng.randint(2, 3), None
    elif kind == 'myrtle':
        w, d, pal, stack, flower = 3, 3, [(DGREEN, 3), (GREEN, 2)], 1, WHITE
    else:
        w, d, pal, stack, flower = 4, 3, [(OLIVE, 3), (SANDGREEN, 2), (DGREEN, 1)], 1, YELLOW
    if (w, d) == (3, 3):
        top = g.blk(pal[0][0], 'plate', i0, k0, 2, 3, yup, base=yup)
        g.blk(pal[0][0], 'plate', i0 + 2, k0, 1, 3, yup, base=yup)     # held to the first by the rosette across the seam
        ci = i0 + 1
    else:
        top = g.blk(pal[0][0], 'plate', i0, k0, w, d, yup, base=yup)
        ci = min(i0 + w - 2, i0 + (w - 2) // 2 + rng.randint(0, 1))
    ck = min(k0 + d - 2, k0 + (d - 2) // 2 + rng.randint(0, 1))
    yy = top
    for q in range(stack):
        yy = g.solid(pick(rng, pal), '4727', ci, ck, 2, 2, yy)
    if flower and rng.random() < .8:
        g.rows.append(put(flower, (ci + 1) * S, yy + 8, (ck + 1) * S, '24866', RY(rng.uniform(0, 3))))
    ring = [(i, k) for i in range(i0, i0 + w) for k in range(k0, k0 + d) if not (ci <= i < ci + 2 and ck <= k < ck + 2)]
    rng.shuffle(ring)
    cx, cz = ci + 1, ck + 1
    for q, (i, k) in enumerate(ring):
        if kind == 'laurel': opts = [('2423', pick(rng, pal)), ('32607', pick(rng, pal))]
        elif kind == 'myrtle': opts = [('32607', pick(rng, pal)), ('6255', DGREEN)] if q % 3 else [('24866', WHITE), ('32607', GREEN)]
        else: opts = [('6255', pick(rng, pal)), ('32607', pick(rng, pal))] if q % 3 else [('24866', YELLOW), ('32607', OLIVE)]
        g.want(i, k, top, opts, outward(i, k, cx, cz), .5)
    return g.finish(fallback=(pal[0][0], '98138'))


def _patch_base(g, i0, k0, w, d, yup, col):
    """a patch's own plate(s) so it clicks to the ground as one"""
    for c, i, k, ww, dd in pack({(i0 + a, k0 + b): col for a in range(w) for b in range(d)}):
        g.blk(c, 'plate', i, k, ww, dd, yup, base=yup)
    return yup + 8


def reeds(x, z, w=3, d=2, yup=4, seed=0):
    """reeds and rushes at the water's edge (Od. XIV.474 "among the reeds and the marsh"; the giant reed of Greek streams): on a
    plate of mud, stacks of 1 x 1 round bricks with bamboo leaves in olive and tan, and rush stems in round-brick sockets.
    Footprint w x d."""
    g = Grow(seed); rng = g.rng
    i0, k0 = _ik(x, z)
    top = _patch_base(g, i0, k0, w, d, yup, DTAN if rng.random() < .5 else OLIVE)
    for i in range(i0, i0 + w):
        for k in range(k0, k0 + d):
            r = rng.random()
            if r < .45:                                    # a giant reed: 2 or 3 leafy round bricks
                y = top
                for q in range(rng.randint(2, 3)):
                    rr = put(pick(rng, [(OLIVE, 3), (TAN, 1), (GREEN, 1)]), *at(i, k)[:1], y + 24, at(i, k)[1], '30176', RY(rng.uniform(-3, 3)))
                    g.rows.append(rr); y += 24
                g.studs[(i, k, top)] = False
            elif r < .8:                                   # a rush: a stem in a round brick socket
                y = g.solid(pick(rng, [(OLIVE, 2), (DGREEN, 1)]), '3062b', i, k, 1, 1, top)
                g.want(i, k, y, [('15279', pick(rng, [(GREEN, 2), (OLIVE, 2), (TAN, 1)]))])
            else:
                g.want(i, k, top, [('15279', pick(rng, [(GREEN, 2), (OLIVE, 1)])), ('32607', GREEN)])
    p = g.finish()
    rows, _ = settle(p.rows)
    return Piece(rows, p.cells, p.canopy)


def _put_row(col, x, y, z, part, a): return put(col, x, y, z, part, RY(a))


def asphodel(x, z, w=4, d=3, yup=4, seed=0):
    """a patch of the asphodel meadow (Od. XI.539, XXIV.13, where the shades dwell): grey-green leaf rosettes, and tall white
    flower spikes: a green round brick with a white-flowered stem on it. Footprint w x d."""
    g = Grow(seed); rng = g.rng
    i0, k0 = _ik(x, z)
    top = _patch_base(g, i0, k0, w, d, yup, SANDGREEN if rng.random() < .5 else OLIVE)
    cells = [(i, k) for i in range(i0, i0 + w) for k in range(k0, k0 + d)]
    rng.shuffle(cells)
    for q, (i, k) in enumerate(cells):
        if q % 3 == 0:
            y = g.solid(SANDGREEN if q % 2 else OLIVE, '3062b', i, k, 1, 1, top)
            g.want(i, k, y, [('3741ac05', WHITE), ('3741ac06', WHITE)])
        elif q % 3 == 1:
            g.want(i, k, top, [('6255', pick(rng, [(SANDGREEN, 2), (OLIVE, 1)])), ('32607', SANDGREEN)])
        else:
            g.want(i, k, top, [('3741ac05', WHITE), ('32607', SANDGREEN)])
    p = g.finish(fallback=(SANDGREEN, '98138'))
    return p


FLOWERS = {   # the patch kinds: [(pid, col, weight)] for a stud
    'poppy': [('24866', RED, 4), ('3741ac01', RED, 3), ('6255', GREEN, 1), ('32607', GREEN, 1)],
    'violet': [('24866', PURPLE, 3), ('24866', MLAV_, 2), ('32607', BGREEN, 3), ('3741ac03', PURPLE, 1)],   # Calypso's meadow of
    'parsley': [('32607', BGREEN, 4), ('32607', GREEN, 2), ('24866', WHITE, 1)],                           # violets and parsley
    'wild': [('24866', RED, 2), ('24866', YELLOW, 2), ('24866', WHITE, 2), ('24866', MLAV_, 1), ('3741ac01', YELLOW, 1),
             ('32607', GREEN, 2), ('6255', GREEN, 1)],
    'grass': [('15279', GREEN, 3), ('15279', OLIVE, 1), ('6255', GREEN, 2), ('32607', BGREEN, 2), ('32607', GREEN, 1)],
}


def flowers(x, z, w=3, d=3, yup=4, seed=0, kind='wild', base=GREEN):
    """a patch of flowers or grass on a plate: kind 'poppy', 'violet' and 'parsley' (Od. V.72, the soft meadows of violets and
    parsley round Calypso's cave), 'wild', or 'grass' (tufts). base: the plate's colour, or None to plant straight on the studs
    at yup (the caller's studded ground). Footprint w x d."""
    g = Grow(seed); rng = g.rng
    i0, k0 = _ik(x, z)
    if base is not None: top = _patch_base(g, i0, k0, w, d, yup, base)
    else:
        top = yup
        for a in range(w):
            for b in range(d): g.studs[(i0 + a, k0 + b, top)] = True; g.cells.add((i0 + a, k0 + b))
    pal = FLOWERS[kind]
    for i in range(i0, i0 + w):
        for k in range(k0, k0 + d):
            if rng.random() < .25: continue
            opts = []
            for _ in range(2):
                tot = sum(p[2] for p in pal); r = rng.uniform(0, tot)
                for pid, col, wt in pal:
                    r -= wt
                    if r <= 0: opts.append((pid, col)); break
            g.want(i, k, top, opts + [('32607', GREEN)])
    return g.finish(fallback=(GREEN if base is None else base, '98138') if base is not None else None)


def moss(cells, yup, seed=0):
    """moss on stone: on the studded squares given (at yup), round and square tiles in olive, green and dark green,
    in patches. Returns a Piece."""
    rows = []
    for (i, k) in sorted(cells):
        col = [OLIVE, GREEN, DGREEN, OLIVE][int(patch(i, k, seed, 2) * 4)]
        rows.append(on(col, *_xz((i, k), yup), '98138' if _h(i, k, seed) < .6 else '3070b'))
    return Piece(rows, set(cells), set())


# ── walls ──
STONES = [(LBG, 4), (DBG, 2), (DTAN, 1), (TAN, 1)]


def _line(i0, k0, n, axis):
    return [(i0 + q, k0) if axis == 'x' else (i0, k0 + q) for q in range(n)]


def masonry(line, yup, courses, seed, shades=STONES, top='tile'):
    """a wall one stud thick along `line` (squares in a row, along x or z), `courses` courses of stone bricks (1 x 1, the
    embossed 1 x 2 and 1 x 4, 1 x 3) laid to break joint, each stone its own shade; top 'tile': coping of tiles and round tiles,
    'studs': left studded, None: nothing. Returns rows."""
    rng = random.Random(seed)
    axis = 'x' if len(line) < 2 or line[1][1] == line[0][1] else 'z'
    n = len(line)
    rows, prev = [], set()
    for c in range(courses):
        q, joints = 0, set()
        while q < n:
            opts = [L for L in (4, 2, 3, 1) if q + L <= n and (q + L == n or q + L not in prev)]
            L = rng.choice(opts[:3]) if opts else 1
            i, k = line[q]
            w, d = (L, 1) if axis == 'x' else (1, L)
            rows.append(block(pick(rng, shades), 'stone', i, k, w, d, yup + 24 * c))
            q += L; joints.add(q)
        prev = joints
    y = yup + 24 * courses
    if top == 'tile':
        q = 0
        while q < n:
            L = rng.choice([1, 2, 2, 3]) if q + 3 <= n else min(n - q, rng.choice([1, 2]))
            i, k = line[q]
            if L == 1 and rng.random() < .5:
                rows.append(on(pick(rng, shades), *_xz((i, k), y), '98138'))
            else:
                w, d = (L, 1) if axis == 'x' else (1, L)
                rows.append(block(pick(rng, shades), 'tile', i, k, w, d, y))
            q += L
    return rows


def drystone(x, z, length, yup=4, seed=0, courses=2, axis='x'):
    """a dry-stone field wall (Od. XVIII.359 "gathering stones for walls"; XXIV.224 Laertes' men gone to gather stones for the
    vineyard wall): one stud thick, `length` studs along x (or z), courses of rough stone in greys and tans breaking joint,
    capped with flat stones and round cobbles. Footprint length x 1."""
    i0, k0 = _ik(x, z)
    line = _line(i0, k0, length, axis)
    return Piece(masonry(line, yup, courses, seed), set(line), set())


def terrace(x, z, length, depth, yup=4, seed=0, courses=2, top='t', keep=(), slopes=True):
    """a terrace: a dry-stone retaining wall along the front (the +z side) holding up a step of ground `courses` bricks high
    behind it, finished as ground type `top` (turf 't', earth 'e', paving 'p' ...). keep: squares of its top left studded for
    trees and vines. The top surface is at yup + 24 * courses. Footprint length x depth."""
    i0, k0 = _ik(x, z)
    line = _line(i0, k0 + depth - 1, length, 'x')
    rows = masonry(line, yup, courses, seed)
    h = courses * 3 - 1
    G = ground(x, z, [top * length] * (depth - 1), [str(h) * length] * (depth - 1), yup, keep=keep, seed=seed, slopes=slopes)
    return Piece(rows + G.rows, set(line) | set(G.top), set())


def ivy_wall(x, z, length, yup=4, seed=0, courses=4):
    """a stone wall grown with ivy (the court wall; Od. XVII.266 the house "built on to other buildings, with wall and coping"):
    masonry `courses` high, its top studded here and there for ivy: clips with curled vines hanging down the face, round
    plates with leaves and 4 x 3 leaves creeping along the coping. Footprint length x 1 (the vines hang over the front)."""
    i0, k0 = _ik(x, z)
    line = _line(i0, k0, length, 'x')
    rng = random.Random(seed)
    rows = masonry(line, yup, courses, seed, top=None)
    y = yup + 24 * courses
    g = Grow(seed)
    q = 0
    ivy = set(range(rng.randint(0, 2), length, 1)) - {qq for qq in range(length) if rng.random() < .3}
    while q < length:
        L = min(length - q, rng.choice([1, 2, 2, 3]))
        i, k = line[q]
        if q in ivy:
            g.blk(pick(rng, STONES), 'plate', i, k, L, 1, y)
            for a in range(L):
                g.want(i + a, k, y + 8, [('vine', pick(rng, [(DGREEN, 2), (GREEN, 1)]))] if rng.random() < .45 else
                       [('2423', pick(rng, [(DGREEN, 2), (GREEN, 1)])), ('32607', DGREEN)], rng.choice([math.pi / 2, 0, math.pi]), .5)
        else:
            g.rows.append(block(pick(rng, STONES), 'tile', i, k, L, 1, y))
        q += L
    p = g.finish(fallback=(DGREEN, '98138'))
    return Piece(rows + p.rows, set(line), set())


# ── roads and floors ──
def road(x, z, length, yup=4, seed=0, width=6, culverts=()):
    """a Mycenaean built road (the graded highways of the Argolid; Od. III.478-497 Telemachus' chariot road from Pylos to
    Sparta): a raised bed of three plates between kerbs of stone (a masonry course, a plate and a coping of tiles, one plate
    proud of the surface), the surface of beaten earth and gravel tiles. At each stud in `culverts` a stream passes under: stone
    arches in both kerbs and a water channel through the bed. Runs `length` studs along x; width = the surface; footprint
    length x (width + 2). The surface is at yup + 32."""
    rng = random.Random(seed)
    i0, k0 = _ik(x, z)
    rows = []
    arch_cols = set()
    for u in culverts:
        arch_cols |= {u - 1, u, u + 1, u + 2}
    water = {u + a for u in culverts for a in (0, 1)}
    # kerbs
    for kr in (k0, k0 + width + 1):
        q = 0
        segs, cur = [], []
        for u in range(length):
            if u in arch_cols:
                if cur: segs.append(cur); cur = []
            else: cur.append((i0 + u, kr))
        if cur: segs.append(cur)
        for sg in segs: rows += masonry(sg, yup, 1, seed + kr, top=None)
        for u in culverts:
            rows.append(put(LBG, (i0 + u + 1) * S, yup + 24, (kr + .5) * S, '3659'))
        line = _line(i0, kr, length, 'x')
        rows += lay({c: DBG for c in line}, yup + 24, 'plate')
        q = 0
        while q < length:
            L = min(length - q, rng.choice([1, 2, 2, 3, 4]))
            rows.append(block(pick(rng, STONES), 'tile', i0 + q, kr, L, 1, yup + 32))
            q += L
    # the bed
    inner = {(i0 + u, k0 + 1 + v) for u in range(length) for v in range(width)}
    for l in range(3):
        cells = {}
        for (i, k) in inner:
            u = i - i0
            if u in water and l < 2:
                if l == 0: cells[(i, k)] = BLUE
                continue
            if l == 2 and u in arch_cols: continue
            cells[(i, k)] = DBG if l < 2 else DTAN
        rows += lay(cells, yup + 8 * l, 'plate')
    for c in culverts:      # the slab over each culvert, bearing on the bed either side
        if (4, width) in PLATE or (width, 4) in PLATE: rows.append(block(LBG, 'plate', i0 + c - 1, k0 + 1, 4, width, yup + 16))
        else: rows += [block(LBG, 'plate', i0 + c - 1, k0 + 1 + v, 4, 1, yup + 16) for v in range(width)]
    fin = {}
    for (i, k) in inner:
        v = patch(i, k, seed, 3)
        fin[(i, k)] = DTAN if v < .6 else (TAN if v < .85 else RB)
    for (i, k), col in list(fin.items()):
        if _h(i, k, seed, 3) < .12:
            rows.append(on(LBG if _h(i, k, 4) < .5 else DBG, *_xz((i, k), yup + 24), '98138')); del fin[(i, k)]
    rows += lay(fin, yup + 24, 'tile')
    return Piece(rows, inner | set(_line(i0, k0, length, 'x')) | set(_line(i0, k0 + width + 1, length, 'x')), set())


def cart_track(x, z, length, yup=4, seed=0):
    """a cart track (Od. VI.37-110 Nausicaa's mule cart to the washing pools; XV.190 the chariot road): two sunken ruts of
    brown earth with grass and flowers between and along the verges. Runs `length` studs along x; footprint length x 5.
    The ruts are at yup + 8, the grass at yup + 16."""
    tm = ['t' * length, 'e' * length, 'm' * length, 'e' * length, 't' * length]
    hm = ['1' * length, '0' * length, '1' * length, '0' * length, '1' * length]
    G = ground(x, z, tm, hm, yup, seed=seed, dress=.08)
    return Piece(G.rows, set(G.top), set())


def footpath(x, z, length, yup=4, seed=0, width=3):
    """a footpath of stepping stones through grass (Od. XIV.1 "the rough path up through the wooded country"; XVII.204 the way
    to town): flat stones (round 2 x 2 tiles, 1 x 2 and corner tiles in greys and tans) wandering across a strip of turf.
    Runs `length` studs along x; footprint length x width. Flush at yup + 8."""
    rng = random.Random(seed)
    i0, k0 = _ik(x, z)
    stones, rows = set(), []
    v = rng.randint(0, max(0, width - 2))
    u = 0
    while u < length - 1:
        kind = rng.random()
        col = pick(rng, [(LBG, 3), (DBG, 1), (TAN, 1)])
        if kind < .5 and u + 2 <= length:
            cs = {(i0 + u, k0 + v), (i0 + u + 1, k0 + v), (i0 + u, k0 + v + 1), (i0 + u + 1, k0 + v + 1)}
            rows.append(put(col, (i0 + u + 1) * S, yup + 8, (k0 + v + 1) * S, '14769'))
            stones |= cs; u += 3
        else:
            vv = min(width - 1, max(0, v + rng.choice([0, 1])))
            rows.append(block(col, 'tile', i0 + u, k0 + vv, 1, 2 if vv + 1 < width else 1, yup) if rng.random() < .5 else
                        block(col, 'tile', i0 + u, k0 + vv, 1, 1, yup))
            stones |= {(i0 + u, k0 + vv), (i0 + u, k0 + vv + 1)} if rows[-1].split()[-1] == '3069b.dat' else {(i0 + u, k0 + vv)}
            u += 2
        v = min(width - 2, max(0, v + rng.choice([-1, 0, 1])))
    tm = [''.join('.' if (i0 + a, k0 + b) in stones else 't' for a in range(length)) for b in range(width)]
    G = ground(x, z, tm, None, yup, seed=seed, dress=.1)
    return Piece(rows + G.rows, set(G.top) | stones, set())


def paving(x, z, w, d, yup=4, seed=0, keep=()):
    """a paved court or street of squared stones (Od. XVII.264-8 the court before Odysseus' house; the ashlar of Mycenaean
    courts): 2 x 2 and 1 x 2 tiles in courses breaking joint, each stone its own grey or tan. keep: squares left studded.
    Footprint w x d, flush at yup + 8."""
    G = ground(x, z, ['p' * w] * d, None, yup, keep=keep, seed=seed)
    return Piece(G.rows, set(G.top), set())


def stair(x, z, width, steps, yup=4, seed=0, cheeks=True):
    """stone steps up a slope (Od. I.330 and XXIII.85 Penelope comes down the high stair): `steps` treads one stud deep and one
    plate high, climbing toward the back (-z); stone treads and risers; with cheeks, a masonry wall each side stepping with
    them. Footprint (width + 2) x steps (width x steps without cheeks); the top tread is at yup + 8 * steps."""
    rng = random.Random(seed)
    i0, k0 = _ik(x, z)
    ox = i0 + (1 if cheeks else 0)
    tm = ['S' * width] * steps
    hm = [str(steps - 1 - r) * width for r in range(steps)]
    G = ground(ox * S, z, tm, hm, yup, seed=seed, slopes=False)
    rows = list(G.rows)
    cells = set(G.top)
    if cheeks:
        for side in (i0, ox + width):
            for r in range(steps):
                h = yup + 8 * (steps - r)        # the tread height on this row
                n_pl = steps - r
                cs = {(side, k0 + r): LBG}
                for l in range(n_pl): rows += lay(cs, yup + 8 * l, 'plate')
                rows.append(block(pick(rng, STONES), 'tile', side, k0 + r, 1, 1, yup + 8 * n_pl))
                cells.add((side, k0 + r))
    return Piece(rows, cells, set())


def threshold(x, z, width=4, yup=4, kind='stone'):
    """a threshold (Od. XVII.339 "the threshold of ash-wood"; XXI.43 "the oaken threshold"; XX.258 "the stone threshold"): a
    two-stud-deep sill, the back row a plate proud of the front, stone (grey), 'ash' (tan) or 'oak' (reddish brown) with the
    doorposts' sockets studded at the ends. Footprint width x 2."""
    i0, k0 = _ik(x, z)
    col, body = {'stone': (LBG, DBG), 'ash': (TAN, DTAN), 'oak': (RB, DBROWN)}[kind]
    rows = [block(body, 'plate', i0, k0, width, 2, yup)]
    rows.append(block(col, 'plate', i0, k0, 1, 1, yup + 8)); rows.append(block(col, 'plate', i0 + width - 1, k0, 1, 1, yup + 8))
    if width > 2: rows += tile_run(col, (i0 + 1) * S, k0 * S, width - 2, yup + 8)
    rows += tile_run(col, i0 * S, (k0 + 1) * S, width, yup + 8)
    return Piece(rows, cells_rect(i0, k0, width, 2), set())


def threshing_floor(x, z, yup=4, seed=0, diam=10):
    """a threshing floor (Iliad V.499 and XX.495 the sacred threshing floors where the winnowers work; Od. XVIII.371 the
    ploughland of the contest): a round floor of beaten stone ringed by a kerb of upright stones (round bricks in greys), a
    post of reddish brown in the middle where the oxen were tied, sheaves waiting at the rim. Footprint diam x diam."""
    rng = random.Random(seed)
    i0, k0 = _ik(x, z)
    r = diam / 2
    disc = {(i0 + a, k0 + b) for a in range(diam) for b in range(diam) if (a + .5 - r) ** 2 + (b + .5 - r) ** 2 <= r * r}
    rim = {c for c in disc if any((c[0] + d[0], c[1] + d[1]) not in disc for d in DIRS)}
    inner = disc - rim
    ci, ck = i0 + diam // 2 - 1, k0 + diam // 2 - 1
    post = {(ci, ck)}
    G = ground(x, z, [''.join('c' if (i0 + a, k0 + b) in inner and (i0 + a, k0 + b) not in post else '.' for a in range(diam))
                      for b in range(diam)], None, yup, keep=post, seed=seed)
    rows = list(G.rows)
    for c in sorted(rim):
        rows.append(on(pick(rng, [(LBG, 3), (DBG, 2), (DTAN, 1)]), *_xz(c, yup), '3062b'))
        if rng.random() < .5: rows.append(on(pick(rng, [(LBG, 1), (DBG, 1)]), *_xz(c, yup + 24), '98138'))
    y = yup + 8
    for q in range(3):
        rows.append(on(RB, *_xz((ci, ck), y), '3062b')); y += 24
    rows.append(on(RB, *_xz((ci, ck), y), '4589'))
    return Piece(rows, disc, set())
