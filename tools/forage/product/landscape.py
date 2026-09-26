#!/usr/bin/env python3
"""tools/forage/product/landscape.py -- THE LANDSCAPE LIBRARY of the Odyssey line: trees, plants, roads, walls, water and
finished ground, as real LEGO, for every kit and film set.

    import sys, os; sys.path.insert(0, '<repo>/tools/forage/product')      (from kits/<kit>.py: os.path.join(dirname(file), '..'))
    import landscape as L
    p = L.olive(x, z, yup, seed)          # -> Piece(rows, cells, canopy)
    rows += p.rows; taken |= p.cells      # the rows go into your card; keep other parts off p.cells

    python3 tools/forage/product/landscape.py      -> odyssey/cards/set.landscape-sampler.mpd (+ -trees, -ground, -plants),
                                                      set.landscape-ithaca-road.mpd, set.landscape-grove.mpd, the self-test, kit.json

CONVENTIONS. Units are LDU (a stud 20, a plate 8, a brick 24); heights are `yup`, LDU up from the table (a baseplate's top is 4).
(x, z) is always the BACK-LEFT corner of the builder's footprint, a multiple of 20 (a stud corner): the builder puts every part on
the grid itself. A stud square (i, k) spans x 20i..20i+20, z 20k..20k+20. Every builder stands on a studded surface at `yup`
(a baseplate, or squares a ground() kept studded), takes `seed` (so a grove is not one tree repeated) and returns
Piece(rows, cells, canopy): rows are LDraw lines; cells the stud squares it stands on (keep other things off them); canopy the
squares its crown or overhang shades (things may stand there, but trees there will fight for room). turn(piece, x0, z0, q) turns a
Piece q quarter turns about a point, shift(piece, di, dk, dy) moves it by studs, merge(*pieces) joins pieces.

CHECKING. Every grid part is checked by kitlib.check (0 not clicked, 0 in the same space) in the self-test (selftest(): each
builder alone on a baseplate, four seeds). Leaves at an angle, stems, clips and vines are off the grid, so the checker cannot see
them: here each is seated only on a stud that is really there and free (Grow tracks studs), and settle(rows) drops any such part
whose body (an oriented box, ldbox geometry) would fill the space of another part -- call settle() on a finished scene (the
builders already settle themselves). free_clashes(rows) counts what settle would drop (0 for every builder).
A scene built with Plot (or after avoid(rows) of what is already placed) makes each new crown keep out of the way of the parts
already there (AVOID), so neighbouring trees shrink rather than collide.

THE BUILDERS (pieces: the range over seeds 0-3 in the self-test; every one checks 0 not clicked, 0 in the same space, 0 free
clashes). Footprints are in studs, x by z.

 Trees (on a 2 x 2 root plate at (x, z); crowns are tiers of plates carrying 6 x 5 leaves (2417), 4 x 3 leaves (2423) and round
 plates with leaves (32607) turned outward, 2 x 2 leaf rosettes (4727) or round plates between tiers)
  olive(x, z, yup, seed)                    2 x 2, crown ~10 x 10     63-102 pcs  Od. XIII.102, XXIII.190, V.477
      gnarled two-strand bole of round bricks in dark grey and brown, a forked brown plate, two limbs with silvery crowns
      (sand green, olive green, a little dark green)
  cypress(x, z, yup, seed, height=None)     2 x 2, 11-14 bricks tall  13-16 pcs   Od. V.64
      trunk of a round brick, a column of dark green leaf rosettes (4727) on their centre studs, a cone at the tip
  oak(x, z, yup, seed)                      2 x 2, crown ~14 x 14     140-160 pcs Od. XIV.327, XIX.296, XIII.409
  plane(x, z, yup, seed)                    2 x 2, crown ~12 x 12     105-116 pcs Il. II.307 (mottled tan/white/grey trunk)
  poplar(x, z, yup, seed, white=False)      2 x 2, crown ~7 x 7       63-73 pcs   Od. VII.106, X.510, XVII.208 (black; white=True
      for the white poplar: white bark, sand green and white leaves)
  fig(x, z, yup, seed, fruit=True)          2 x 2, crown ~8 x 8       22-33 pcs   Od. VII.116, XI.590, XII.103/432, XXIV.341
  willow(x, z, yup, seed)                   2 x 2, crown ~10 x 10     82-97 pcs   Od. X.510 (leaning; curled vines from clips)
  alder(x, z, yup, seed)                    2 x 2, crown ~8 x 8       58-65 pcs   Od. V.64, V.239
  pine(x, z, yup, seed, kind='fir')         2 x 2, crown ~10 x 10     127-131 pcs Od. V.239 (Greek fir, a dark cone);
      kind='stone': stone pine, bare leaning trunk, umbrella crown          73-84 pcs
  fruit_tree(x, z, yup, seed, kind='pear')  2 x 2, crown ~6 x 6       24-29 pcs   Od. VII.115, XXIV.340 (pear, apple,
      pomegranate, quince: fruit as round tiles)
 Shrubs and low plants
  shrub(x, z, yup, seed, kind='laurel')     laurel 4 x 4, myrtle 3 x 3, maquis 4 x 3   7-12 pcs   Od. IX.183 (laurel)
  reeds(x, z, w=3, d=2, yup, seed)          w x d                     4-7 pcs     Od. XIV.474 (giant reed: bamboo bricks; rushes)
  asphodel(x, z, w=4, d=3, yup, seed)       w x d                     13-17 pcs   Od. XI.539, XXIV.13 (white flower spikes)
  flowers(x, z, w=3, d=3, yup, seed, kind='wild', base=GREEN)  w x d  6-17 pcs    kind poppy | violet | parsley (Od. V.72) |
      wild | grass (tufts); base=None plants straight onto studs the caller kept
  moss(cells, yup, seed)                    the squares given         1 per square  (round and square tiles on stone)
 Walls
  masonry(line, yup, courses, seed, shades, top='tile') -> rows: a wall one stud thick along a row of squares, embossed
      stone bricks (98283, 15533) breaking joint, coped with tiles and round tiles
  drystone(x, z, length, yup, seed, courses=2, axis='x')  length x 1  21-28 pcs  Od. XVIII.359, XXIV.224
  terrace(x, z, length, depth, yup, seed, courses=2, top='t', keep=(), slopes=True)  length x depth  63-89 pcs
      a retaining wall along the front (+z) holding a step of ground; its top surface is at yup + 24 * courses
  ivy_wall(x, z, length, yup, seed, courses=4)             length x 1  47-59 pcs  Od. XVII.266 (vines hang only if courses >= 4)
  stepped(line, heights, yup, seed) -> rows: a broken wall whose height varies stone to stone
  gate(x, z, yup, seed, opening=4, wall=3)  (opening + 4 + 2 wall) x 2  62-65 pcs  Od. VI.262-9, XVII (road runs through along z)
 Roads and floors
  road(x, z, length, yup, seed, width=6, culverts=(), stand=())  length x (width + 2)  127-140 pcs  Od. III.478-497
      raised bed, kerbs one plate proud, earth and gravel surface at yup + 32; culverts: stone arches and a water channel;
      stand: surface squares left studded for figures
  cart_track(x, z, length, yup, seed)       length x 5                72-78 pcs   Od. VI.37-110, XV.190 (two sunken ruts)
  footpath(x, z, length, yup, seed, width=3) length x width           43-48 pcs   Od. XIV.1, XVII.204 (stepping stones)
  paving(x, z, w, d, yup, seed, keep=())    w x d                     ~0.4 pcs per square  Od. XVII.264-8 (ashlar courses)
  stair(x, z, width, steps, yup, seed, cheeks=True)  (width + 2) x steps  73 pcs (4 x 6)  Od. I.330, XXIII.85 (climbs to -z)
  threshold(x, z, width=4, yup, seed, kind='stone')  width x 2        5 pcs       Od. XX.258 (stone), XVII.339 ('ash'), XXI.43 ('oak')
  threshing_floor(x, z, yup, seed, diam=10) diam x diam (a disc)      57-66 pcs   Il. V.499, XX.495
 Water
  fountain(x, z, yup, seed, channel=4)      8 x (6 + channel)         89-93 pcs   Od. XVII.205-211 (rock, altar of the Nymphs,
      bronze spout, falling water, basin, outlet channel)
  spring(x, z, yup, seed, outflow=3)        4 x (5 + outflow)         36-38 pcs   Od. V.70, IX.140, XIII.109
  stream(x, z, length, yup, seed, width=2)  length x (width + 4)      196-219 pcs Od. V.441, VI.85 (water at yup+16, banks yup+24)
  beach(x, z, w, d, yup, seed, water_h=1)   w x d                     326-345 pcs Od. V.151, VI.94, XIII.116 (turf, sand, shingle,
      foam, shallows, deep; water toward +z; water_h 1 on a blue baseplate, 2 on a green one)
  quay(x, z, length, yup, seed, depth=4, courses=2, water=3, water_h=1, keep=())  length x (depth + water)  138-151 pcs
      Od. VI.263-7, XIII.96 (masonry front, ashlar top at yup + 24 * courses, pierced mooring stones)
 Cultivation
  pergola(x, z, w=6, d=4, yup, seed)        posts at the 4 corners of w x d  32-33 pcs  Od. V.69, VII.121 (grapes hang under)
  vine_row(x, z, length, yup, seed)         one square per stake (every 3)   52-55 pcs  Od. XXIV.342, Il. XVIII.561
  field(x, z, w, d, yup, seed, crop='plough')  w x d                  49-61 pcs   Od. XVIII.366-375 (crop plough | grain | young)
  orchard(x, z, cols=3, rows_=2, yup, seed, spacing=8, vines=True)    191-208 pcs Od. XXIV.336-344 (quincunx of pear, apple, fig)
 Terrain
  ground(x0, z0, tmap, hmap=None, yup=4, keep=(), seed=0, dress=0.05, slopes=True) -> Ground(rows, top, studs)
      rows of characters, one per stud: t turf, m meadow, e earth, s sand, g shingle, r rock, p paving, S stone steps,
      c beaten floor, w water, d deep water, f foam, '.' nothing; hmap rows of digits = plates of rise. Land finishes at
      yup + 8 (h + 1) with tiles in patches of colour (so they merge into big tiles), water one plate lower (blue plates
      under clear tiles); keep squares stay studded plates (things stand there, at top[(i, k)]); where land stands two or
      more plates over a neighbour its edge is a cheese slope; turf and meadow are dressed with tufts, leaves and flowers.
      About 0.5 pieces per square on the flat, more on rises.
  ground_at(cells {(i, k): (type, h)}, yup, keep, seed, dress, slopes): the same from a dict.

SCENES, HOW TO COMPOSE (see ithaca_road() and grove()): make a Plot(); P.base(x0, z0) for each baseplate and kitlib.frame for
the display ring; P.add(piece) for everything that stands on the baseplate itself (roads, walls, fountains -- it refuses a
square already taken); build a dict of ground cells {(i, k): (type, h)} for the rest, create the trees and plants at
yup = 4 + 8 * (h + 1) of their squares (call avoid(p.rows) after each so the next keeps clear), ground_at(cells, keep=their
cells), then P.add(piece, over=True) for the plants; finally rows, dropped = settle(P.rows, fixed=figures) and add the figures.
"""
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


BODY = {'1997': ((-8.0, -86.5, -9.2), (8.0, -12.0, 29.2))}   # the curled vine without the bar its clip holds


def obb(r, shrink=1.0):
    """the part's body (without studs) as an oriented box: centre, three axes, half extents"""
    _, p, m, pid = _parse(r)
    b = BODY.get(pid) or ldbox.box(pid, False)
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


def shift(piece, di, dk, dy=0):
    """move a Piece by whole studs (and dy LDU up)"""
    out = []
    for r in piece.rows:
        if not r.startswith('1 '): out.append(r); continue
        col, p, m, pid = _parse(r)
        out.append(row(col, [p[0] + di * S, p[1] - dy, p[2] + dk * S] + m, pid))
    return Piece(out, {(i + di, k + dk) for i, k in piece.cells}, {(i + di, k + dk) for i, k in piece.canopy})


def _done(rows, cells, canopy):
    """a finished piece: its free parts settled so none fills another's space"""
    return Piece(settle(rows)[0], cells, canopy)


def merge(*pieces):
    rows, cells, can = [], set(), set()
    for p in pieces: rows += p.rows; cells |= p.cells; can |= p.canopy
    return Piece(rows, cells, can)


AVOID = defaultdict(list)      # (i, k) -> [(bottom, top)] of grid parts already set down in the scene being built (see Plot)


def footprint(r):
    """a grid part's stud squares and its (bottom, top) in yup, or None for a part off the grid"""
    if not on_grid(r): return None
    _, p, m, pid = _parse(r)
    lo, hi = ldbox.box(pid, False)
    xs = [p[0] + m[0] * a + m[2] * c for a in (lo[0], hi[0]) for c in (lo[2], hi[2])]
    zs = [p[2] + m[6] * a + m[8] * c for a in (lo[0], hi[0]) for c in (lo[2], hi[2])]
    ys = sorted((p[1] + m[4] * lo[1], p[1] + m[4] * hi[1]))
    cs = {(i, k) for i in range(round(min(xs) / S), round(max(xs) / S)) for k in range(round(min(zs) / S), round(max(zs) / S))}
    return cs, -ys[1], -ys[0]


def avoid(rows):
    """remember these rows' grid parts, so crowns grown after them keep out of their way"""
    for r in rows:
        if r.startswith('1 '):
            f = footprint(r)
            if f:
                for c in f[0]: AVOID[c].append((f[1], f[2]))


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
        return all(not (b < top and bottom < t) for a in range(w) for c in range(d)
                   for b, t in self.occ[(i + a, k + c)] + AVOID.get((i + a, k + c), []))

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
                    if pid not in SEAT and pid != 'vine':
                        f = footprint(rs[0])
                        if f and not self.clear(min(c[0] for c in f[0]), min(c[1] for c in f[0]), 1, 1, f[1], f[2]): continue
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
                f = footprint(r)
                if sp.fits(r) and (not f or self.clear(i, k, 1, 1, f[1], f[2])):
                    sp.add(r); out.append(r); self.studs[(i, k, y)] = False
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
        if not g.clear(i0, k0, 2, 2, y, y + 19 + 48): break         # stop short of anything overhead, room left for the tip
        y = g.solid(GREEN if q in light else DGREEN, '4727', i0, k0, 2, 2, y)
    if g.clear(i0, k0, 2, 2, y, y + 48): g.solid(DGREEN, '3942c', i0, k0, 2, 2, y)
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
    y = g.blk(LBG, 'plate', i0, k0, 2, 2, y)
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
    dr = _dressing(dcells, seed)
    rows, dropped = settle(rows + dr)
    for r in dropped:          # a plant that found no room leaves a round tile on its stud, not a bare stud
        t = r.split(); c = cell(float(t[2]), float(t[4]))
        if c in dcells: rows.append(on(pick(random.Random(_h(*c, seed) * 1e6), [(GREEN, 2), (OLIVE, 1), (BGREEN, 1)]), *_xz(c, dcells[c][0]), '98138'))
    if dropped: rows, _ = settle(rows)
    return Ground(rows, top, studs)


def ground_at(cells, yup=4, keep=(), seed=0, dress=0.05, slopes=True):
    """ground() from a dict {(i, k): (type, h)} instead of rows of characters"""
    if not cells: return Ground([], {}, set())
    i0 = min(i for i, _ in cells); i1 = max(i for i, _ in cells); k0 = min(k for _, k in cells); k1 = max(k for _, k in cells)
    tm = [''.join(cells[(i, k)][0] if (i, k) in cells else '.' for i in range(i0, i1 + 1)) for k in range(k0, k1 + 1)]
    hm = [''.join(str(cells[(i, k)][1]) if (i, k) in cells else '0' for i in range(i0, i1 + 1)) for k in range(k0, k1 + 1)]
    return ground(i0 * S, k0 * S, tm, hm, yup, keep=keep, seed=seed, dress=dress, slopes=slopes)


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
            col = [RED, WHITE, YELLOW, MLAV_, WHITE, PURPLE, YELLOW][int(_h(i, k, seed, 37) * 7)]
            if r < .35: out.append(put(col, x, y + 8, z, '24866', RY(a)))
            else: out.append(put(col, x, y + 12, z, '3741ac0' + '1356'[int(_h(i, k, 41) * 4)], RY(a)))
        else:
            q = 2 if _h(i, k, seed, 47) < .1 else int(_h(i, k, seed, 43) * 2)
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
    top = _patch_base(g, i0, k0, w, d, yup, pal[0][0])
    ci = i0 + 1 if w == 3 else min(i0 + w - 2, i0 + (w - 2) // 2 + rng.randint(0, 1))
    ck = k0 + 1 if d == 3 else min(k0 + d - 2, k0 + (d - 2) // 2 + rng.randint(0, 1))     # the rosette bridges the plates' seam
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
            if rng.random() < .25:
                g.want(i, k, top, [('98138', pick(rng, [(GREEN, 2), (BGREEN, 1)]))]); continue
            opts = []
            for _ in range(2):
                tot = sum(p[2] for p in pal); r = rng.uniform(0, tot)
                for pid, col, wt in pal:
                    r -= wt
                    if r <= 0: opts.append((pid, col)); break
            g.want(i, k, top, opts + [('32607', GREEN)])
    return g.finish(fallback=(GREEN if base is None else base, '98138'))


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
    return _done(masonry(line, yup, courses, seed), set(line), set())


def terrace(x, z, length, depth, yup=4, seed=0, courses=2, top='t', keep=(), slopes=True):
    """a terrace: a dry-stone retaining wall along the front (the +z side) holding up a step of ground `courses` bricks high
    behind it, finished as ground type `top` (turf 't', earth 'e', paving 'p' ...). keep: squares of its top left studded for
    trees and vines. The top surface is at yup + 24 * courses. Footprint length x depth."""
    i0, k0 = _ik(x, z)
    line = _line(i0, k0 + depth - 1, length, 'x')
    rows = masonry(line, yup, courses, seed)
    h = courses * 3 - 1
    G = ground(x, z, [top * length] * (depth - 1), [str(h) * length] * (depth - 1), yup, keep=keep, seed=seed, slopes=slopes)
    return _done(rows + G.rows, set(line) | set(G.top), set())


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
                g.want(i + a, k, y + 8, [('vine', pick(rng, [(DGREEN, 2), (GREEN, 1)]))] if courses >= 4 and rng.random() < .45 else
                       [('2423', pick(rng, [(DGREEN, 2), (GREEN, 1)])), ('32607', DGREEN)], rng.choice([math.pi / 2, 0, math.pi]), .5)
        else:
            g.rows.append(block(pick(rng, STONES), 'tile', i, k, L, 1, y))
        q += L
    p = g.finish(fallback=(DGREEN, '98138'))
    return _done(rows + p.rows, set(line), set())


# ── roads and floors ──
def road(x, z, length, yup=4, seed=0, width=6, culverts=(), stand=()):
    """a Mycenaean built road (the graded highways of the Argolid; Od. III.478-497 Telemachus' chariot road from Pylos to
    Sparta): a raised bed of three plates between kerbs of stone (a masonry course, a plate and a coping of tiles, one plate
    proud of the surface), the surface of beaten earth and gravel tiles. At each stud in `culverts` a stream passes under: stone
    arches in both kerbs and a water channel through the bed. stand: squares of the surface left studded (a plate for the
    tile) for figures and carts. Runs `length` studs along x; width = the surface; footprint length x (width + 2). The surface
    is at yup + 32."""
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
    stand = set(stand)
    rows += lay({c: DTAN for c in stand if c in fin}, yup + 24, 'plate')
    for c in stand: fin.pop(c, None)
    for (i, k), col in list(fin.items()):
        if _h(i, k, seed, 3) < .12:
            rows.append(on(LBG if _h(i, k, 4) < .5 else DBG, *_xz((i, k), yup + 24), '98138')); del fin[(i, k)]
    rows += lay(fin, yup + 24, 'tile')
    return _done(rows, inner | set(_line(i0, k0, length, 'x')) | set(_line(i0, k0 + width + 1, length, 'x')), set())


def cart_track(x, z, length, yup=4, seed=0):
    """a cart track (Od. VI.37-110 Nausicaa's mule cart to the washing pools; XV.190 the chariot road): two sunken ruts of
    brown earth with grass and flowers between and along the verges. Runs `length` studs along x; footprint length x 5.
    The ruts are at yup + 8, the grass at yup + 16."""
    tm = ['t' * length, 'e' * length, 'm' * length, 'e' * length, 't' * length]
    hm = ['1' * length, '0' * length, '1' * length, '0' * length, '1' * length]
    G = ground(x, z, tm, hm, yup, seed=seed, dress=.08)
    return _done(G.rows, set(G.top), set())


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
    return _done(rows + G.rows, set(G.top) | stones, set())


def paving(x, z, w, d, yup=4, seed=0, keep=()):
    """a paved court or street of squared stones (Od. XVII.264-8 the court before Odysseus' house; the ashlar of Mycenaean
    courts): 2 x 2 and 1 x 2 tiles in courses breaking joint, each stone its own grey or tan. keep: squares left studded.
    Footprint w x d, flush at yup + 8."""
    G = ground(x, z, ['p' * w] * d, None, yup, keep=keep, seed=seed)
    return _done(G.rows, set(G.top), set())


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
    return _done(rows, cells, set())


def threshold(x, z, width=4, yup=4, seed=0, kind='stone'):
    """a threshold (Od. XVII.339 "the threshold of ash-wood"; XXI.43 "the oaken threshold"; XX.258 "the stone threshold"): a
    two-stud-deep sill, the back row a plate proud of the front, stone (grey), 'ash' (tan) or 'oak' (reddish brown) with the
    doorposts' sockets studded at the ends. Footprint width x 2."""
    i0, k0 = _ik(x, z)
    col, body = {'stone': (LBG, DBG), 'ash': (TAN, DTAN), 'oak': (RB, DBROWN)}[kind]
    rows = [block(body, 'plate', i0, k0, width, 2, yup)]
    rows.append(block(col, 'plate', i0, k0, 1, 1, yup + 8)); rows.append(block(col, 'plate', i0 + width - 1, k0, 1, 1, yup + 8))
    if width > 2: rows += tile_run(col, (i0 + 1) * S, k0 * S, width - 2, yup + 8)
    rows += tile_run(col, i0 * S, (k0 + 1) * S, width, yup + 8)
    return _done(rows, cells_rect(i0, k0, width, 2), set())


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
    G = ground(x, z, [''.join('c' if (i0 + a, k0 + b) in inner else '.' for a in range(diam))
                      for b in range(diam)], None, yup, keep=post, seed=seed)
    rows = list(G.rows)
    for c in sorted(rim):
        rows.append(on(pick(rng, [(LBG, 3), (DBG, 2), (DTAN, 1)]), *_xz(c, yup), '3062b'))
        if rng.random() < .5: rows.append(on(pick(rng, [(LBG, 1), (DBG, 1)]), *_xz(c, yup + 24), '98138'))
    y = yup + 8
    for q in range(3):
        rows.append(on(RB, *_xz((ci, ck), y), '3062b')); y += 24
    rows.append(on(RB, *_xz((ci, ck), y), '4589'))
    return _done(rows, disc, set())


# ── water ──
def fountain(x, z, yup=4, seed=0, channel=4):
    """the town fountain of Ithaca (Od. XVII.205-211: "a fair-flowing fountain, fashioned of stone, whence the townsfolk drew
    water ... round about was a grove of poplars that grow by the waters, and down the cold water flowed from the rock above,
    and on the top was built an altar of the Nymphs, where all passers-by made offerings"). A masonry rock two courses deep and
    three high at the back, mossed and planted on top, with the altar (a 2 x 2 stone, a white slab, an offering) at its crest;
    a lower step in front carrying a bronze spout (the tap) whose water falls in a clear column into a stone basin of clear
    tiles; an outlet in the basin's front kerb and a channel of water between stone kerbs running `channel` studs toward the
    viewer. Plant the poplars round it. Footprint 8 x (6 + channel)."""
    rng = random.Random(seed)
    i0, k0 = _ik(x, z)
    rows = []
    for r, courses in ((0, 3), (1, 3), (2, 2)):
        rows += masonry(_line(i0, k0 + r, 8, 'x'), yup, courses, seed + r, top=None)
    # the rock's top: coping and moss, the altar in the middle
    y3 = yup + 72
    altar = {(i0 + 3, k0), (i0 + 4, k0), (i0 + 3, k0 + 1), (i0 + 4, k0 + 1)}
    rows.append(block(LBG, 'brick', i0 + 3, k0, 2, 2, y3))
    rows.append(block(WHITE, 'plate', i0 + 3, k0, 2, 2, y3 + 24))
    rows.append(on(GOLD, *_xz((i0 + 3, k0 + 1), y3 + 32), '98138'))                   # the offering
    rows.append(block(WHITE, 'tile', i0 + 3, k0, 1, 1, y3 + 32))
    rows.append(block(WHITE, 'tile', i0 + 4, k0, 1, 2, y3 + 32))
    top = [(i, k) for k in (k0, k0 + 1) for i in range(i0, i0 + 8) if (i, k) not in altar]
    mossy = {c for c in top if _h(c[0], c[1], seed, 5) < .45}
    plants = {c for c in mossy if _h(c[0], c[1], seed, 6) < .3}
    rows += moss(mossy - plants, y3, seed).rows
    for c in plants: rows.append(put(pick(rng, [(DGREEN, 1), (GREEN, 1)]), *_xz(c, y3 + 5), '6255', RY(rng.uniform(0, 6))))
    rows += lay({c: pick(rng, STONES) for c in top if c not in mossy}, y3, 'tile', sizes=[(2, 1), (1, 1)])
    # the step in front and the spout
    y2 = yup + 48
    spout = (i0 + 3, k0 + 2)
    rows += lay({(i, k0 + 2): LBG for i in range(i0, i0 + 8) if (i, k0 + 2) != spout}, y2, 'tile', sizes=[(3, 1), (2, 1), (1, 1)])
    rows.append(block(DBG, 'plate', spout[0], spout[1], 1, 1, y2))
    rows.append(put(GOLD, (spout[0] + .5) * S, y2 + 8 + 24, (spout[1] + .5) * S, '4599b'))
    # the basin: a kerb one course high round a pool of clear tiles
    kb = k0 + 3
    kerb = [(i0 + 1, kb), (i0 + 1, kb + 1), (i0 + 1, kb + 2), (i0 + 6, kb), (i0 + 6, kb + 1), (i0 + 6, kb + 2)] + \
           [(i, kb + 2) for i in (i0 + 2, i0 + 3, i0 + 5)]
    pool = {(i, k) for i in range(i0 + 2, i0 + 6) for k in (kb, kb + 1)}
    fall = (spout[0], kb)
    for side in (i0 + 1, i0 + 6):
        rows += masonry([(side, kb), (side, kb + 1), (side, kb + 2)], yup, 1, seed + side)
    rows += masonry([(i0 + 2, kb + 2), (i0 + 3, kb + 2)], yup, 1, seed + 9)
    rows += masonry([(i0 + 5, kb + 2)], yup, 1, seed + 8)
    rows += lay({c: BLUE for c in pool | {(i0 + 4, kb + 2)}}, yup, 'plate')
    rows += [on(TLBLUE if _h(*c, seed) < .7 else TCLEAR, *_xz(c, yup + 8), '3070b') for c in sorted(pool - {fall})]
    rows += [on(TCLEAR, *_xz(fall, yup + 8), '3062b'), on(TCLEAR, *_xz(fall, yup + 32), '3024'), on(TCLEAR, *_xz(fall, yup + 40), '3024')]
    # the outlet and the channel
    ch = [(i0 + 4, kb + 2 + q) for q in range(channel + 1)]
    for c in ch[1:]: rows.append(block(BLUE, 'plate', c[0], c[1], 1, 1, yup))
    for c in ch: rows.append(on(TLBLUE, *_xz(c, yup + 8), '3070b'))
    flank = [(i0 + 3, kb + 3 + q) for q in range(channel)] + [(i0 + 5, kb + 3 + q) for q in range(channel)]
    rows += lay({c: DBG for c in flank}, yup, 'plate', sizes=[(1, 4), (1, 3), (1, 2), (1, 1)])
    for c in flank: rows.append(on(pick(rng, STONES), *_xz(c, yup + 8), '3070b'))
    cells = cells_rect(i0, k0, 8, 3) | set(kerb) | pool | set(ch) | set(flank)
    return _done(rows, cells, set())


def stream(x, z, length, yup=4, seed=0, width=2):
    """a stream bed with stones (Od. V.441 the river mouth where Odysseus came ashore; VI.85 the washing pools; XIII.408 the
    spring Arethusa): clear water winding between banks of shingle and turf, a stone breaking the surface here and there.
    Runs `length` studs along x; footprint length x (width + 4). The water is at yup + 16, the banks at yup + 24."""
    rng = random.Random(seed)
    W = width + 4
    ph, lam = rng.uniform(0, 6), rng.uniform(4, 7)
    tm, hm = [[' '] * length for _ in range(W)], [['2'] * length for _ in range(W)]
    for u in range(length):
        v0 = 2 + round(math.sin(u / lam + ph) * 1.2) - 1 + 1
        v0 = max(1, min(W - width - 1, v0))
        for v in range(W):
            if v0 <= v < v0 + width:
                if rng.random() < .1: tm[v][u], hm[v][u] = 'g', '1'
                else: tm[v][u] = 'w'
            elif v in (v0 - 1, v0 + width) and rng.random() < .6: tm[v][u] = 'g'
            else: tm[v][u] = 't'
    G = ground(x, z, [''.join(r) for r in tm], [''.join(r) for r in hm], yup, seed=seed, slopes=False, dress=.08)
    return _done(G.rows, set(G.top), set())


def beach(x, z, w, d, yup=4, seed=0, water_h=1):
    """a beach (Od. V.151 Odysseus on the shore of Ogygia; VI.94 the pebbles on the Phaeacian shore; XIII.116 Ithaca's harbour
    beach): from the back, turf and sand, a band of shingle, a line of white foam, clear shallows and deeper water, each
    boundary wavering. water_h: plates of rise under the water (1 on a blue baseplate, 2 on a green one); the land is one plate
    above the water. Footprint w x d (the water toward +z)."""
    rng = random.Random(seed)
    ph = [rng.uniform(0, 6) for _ in range(4)]
    tm, hm = [], []
    for v in range(d):
        line, hl = '', ''
        for u in range(w):
            b = [d * f + math.sin(u / l + p) * a for f, l, p, a in ((.12, 3.1, ph[0], 1.2), (.4, 4.3, ph[1], 1.0),
                                                                  (.58, 3.7, ph[2], .8), (.8, 5.1, ph[3], 1.1))]
            t = 't' if v < b[0] else 's' if v < b[1] else 'g' if v < b[2] else 'f' if v < b[2] + 1 else 'w' if v < b[3] else 'd'
            line += t
            hl += str(water_h)
        tm.append(line); hm.append(hl)
    G = ground(x, z, tm, hm, yup, seed=seed, slopes=False)
    return _done(G.rows, set(G.top), set())


def quay(x, z, length, yup=4, seed=0, depth=4, courses=2, water=3, water_h=1, keep=()):
    """a harbour quay (Od. VI.263-7 the Phaeacian harbour, "the ships drawn up along the road"; XIII.96 Phorcys' harbour): a
    front wall of dressed stone `courses` high on the water's edge (+z), the quay behind paved with ashlar, mooring stones
    pierced for the hawsers (Technic bricks with holes) along the edge, and `water` rows of water before it. keep: squares
    of the quay left studded. The quay's surface is at yup + 24 * courses. Footprint length x (depth + water)."""
    rng = random.Random(seed)
    i0, k0 = _ik(x, z)
    h = courses * 3 - 1
    stones = {(i0 + u, k0 + depth - 2) for u in range(2, length - 1, 5)}
    G = ground(x, z, ['p' * length] * (depth - 1), [str(h) * length] * (depth - 1), yup, keep=set(keep) | stones | {(c[0] + 1, c[1]) for c in stones}, seed=seed)
    rows = list(G.rows)
    y = yup + 24 * courses
    for c in sorted(stones): rows.append(put(LBG, (c[0] + 1) * S, y + 24, (c[1] + .5) * S, '3700'))
    rows += masonry(_line(i0, k0 + depth - 1, length, 'x'), yup, courses, seed, shades=[(LBG, 4), (DBG, 2), (TAN, 1)])
    Wt = ground(x, z + depth * S, ['w' * length] * (water - 1) + ['d' * length], [str(water_h) * length] * water, yup, seed=seed)
    rows += Wt.rows
    return _done(rows, set(G.top) | set(_line(i0, k0 + depth - 1, length, 'x')) | set(Wt.top), set())


# ── cultivation ──
def _grapes(rows, i, k, bottom_of_beam, rng):
    rows.append(put(pick(rng, [(DPURPLE, 3), (PURPLE, 1)]), *at(i, k)[:1], bottom_of_beam, at(i, k)[1], '3062b'))


def pergola(x, z, w=6, d=4, yup=4, seed=0):
    """a vine on a pergola (Od. V.69 the vine "in the pride of its prime, rich with clusters" over Calypso's cave; VII.121
    Alcinous' vineyard; XXIV.341 Laertes' vines): four posts of reddish brown round bricks five high, beams along the ends,
    rafters across, 4 x 3 leaves and round plates with leaves on the rafters, curled tendrils hanging from clips, and bunches of
    grapes (dark purple round bricks) hanging under the rafters. A minifigure walks under. Footprint w x d (posts at the corners)."""
    g = Grow(seed); rng = g.rng
    i0, k0 = _ik(x, z)
    posts = [(i0, k0), (i0 + w - 1, k0), (i0, k0 + d - 1), (i0 + w - 1, k0 + d - 1)]
    for n, (i, k) in enumerate(posts):
        y = yup
        for q in range(5): y = g.solid(DBROWN if n == 0 and q < 3 else RB, '3062b', i, k, 1, 1, y, base=yup)
    yb = yup + 120
    for k in (k0, k0 + d - 1):
        for c, i, kk, ww, dd in pack({(i0 + a, k): RB for a in range(w)}): g.blk(c, 'plate', i, kk, ww, dd, yb)
    yr = yb + 8
    rafters = list(range(i0 + 1, i0 + w - 1, 2)) if w > 3 else [i0 + 1]
    for i in rafters:
        for c, ii, kk, ww, dd in pack({(i, k0 + b): RB for b in range(d)}): g.blk(c, 'plate', ii, kk, ww, dd, yr)
        for k in range(k0 + 1, k0 + d - 1):
            if rng.random() < .6: _grapes(g.rows, i, k, yr, rng)
    top = yr + 8
    for i in rafters:
        for k in range(k0, k0 + d):
            side = rng.choice([0, math.pi])
            g.want(i, k, top, [('2423', pick(rng, [(GREEN, 3), (OLIVE, 1), (BGREEN, 1)])), ('32607', GREEN)] if rng.random() < .7 else
                   [('vine', GREEN), ('32607', BGREEN)], side, .6)
    for i in range(i0, i0 + w):
        for k in (k0, k0 + d - 1):
            if i not in rafters and rng.random() < .6:
                g.want(i, k, yb + 8, [('32607', pick(rng, [(GREEN, 2), (BGREEN, 1)])), ('24866', GREEN)], rng.uniform(0, 6))
    p = g.finish()
    return Piece(p.rows, set(posts), cells_rect(i0, k0, w, d))


def vine_row(x, z, length, yup=4, seed=0):
    """a row of staked vines (Od. XXIV.342 "fifty rows of vines", Laertes' vineyard; Iliad XVIII.561 the vineyard on the shield,
    "the poles set up throughout"): stakes of reddish brown round bricks four high every three studs, a rail of plates along
    their tops carrying leaves and tendrils, bunches of grapes hanging under the rail. Runs `length` studs along x; footprint:
    one square per stake."""
    g = Grow(seed); rng = g.rng
    i0, k0 = _ik(x, z)
    stakes = list(range(0, length - 2, 3))
    for u in stakes:
        y = yup
        for q in range(4): y = g.solid(DBROWN if q == 0 else RB, '3062b', i0 + u, k0, 1, 1, y, base=yup)
    yr = yup + 96
    for u in stakes:
        g.blk(RB, 'plate', i0 + u, k0, 3, 1, yr)
        for a in (1, 2):
            if rng.random() < .55: _grapes(g.rows, i0 + u + a, k0, yr, rng)
    for u in range(stakes[-1] + 3):
        g.want(i0 + u, k0, yr + 8, [('2423', pick(rng, [(GREEN, 3), (OLIVE, 1)])), ('32607', GREEN)] if rng.random() < .75 else
               [('vine', GREEN)], rng.choice([math.pi / 2, -math.pi / 2]), .7)
    p = g.finish(fallback=(GREEN, '98138'))
    return Piece(p.rows, {(i0 + u, k0) for u in stakes}, {(i0 + u, k0 + v) for u in range(length) for v in (-1, 0, 1)})


def field(x, z, w, d, yup=4, seed=0, crop='plough'):
    """a cultivated field (Od. XVIII.366-375 the ploughing match; XIII.31 the ploughman longing for supper; Iliad XVIII.541 the
    thrice-ploughed fallow on the shield, "black behind the plough"): ridges and furrows along x, the ridges a plate higher.
    crop 'plough': new-turned earth, reddish brown and dark brown; 'grain': ridges of standing barley (tan stems); 'young':
    green shoots on the ridges. Footprint w x d."""
    rng = random.Random(seed)
    i0, k0 = _ik(x, z)
    rows = []
    for v in range(d):
        k = k0 + v
        cells = {(i0 + u, k): RB for u in range(w)}
        if v % 2 == 0:            # a ridge
            rows += lay({c: DBROWN for c in cells}, yup, 'plate')
            if crop == 'plough':
                rows += lay({c: (RB if patch(c[0], c[1], seed, 4) < .7 else DBROWN) for c in cells}, yup + 8, 'tile')
            else:
                rows += lay({c: RB for c in cells}, yup + 8, 'plate')
                for c in sorted(cells):
                    x_, z_ = at(*c)
                    if crop == 'grain':
                        rows.append(put(pick(rng, [(TAN, 3), (YELLOW, 1), (DTAN, 1)]), x_, yup + 16, z_, '15279', RY(rng.uniform(0, 6))))
                    elif rng.random() < .6:
                        rows.append(put(pick(rng, [(BGREEN, 2), (GREEN, 1)]), x_, yup + 24, z_, '32607', RY(rng.uniform(0, 6))))
                    else:
                        rows.append(on(RB, *_xz(c, yup + 16), '98138'))
        else:                     # a furrow
            rows += lay({c: (DBROWN if patch(c[0], c[1], seed, 5) < .6 else RB) for c in cells}, yup, 'tile')
    rows, _ = settle(rows)
    return _done(rows, cells_rect(i0, k0, w, d), set())


def orchard(x, z, cols=3, rows_=2, yup=4, seed=0, spacing=8, vines=True):
    """Laertes' orchard (Od. XXIV.336-344: "thirteen pear trees, ten apple trees and forty fig trees ... and fifty rows of vines",
    each tree promised to the boy by name): trees in a quincunx (every other row shifted half a space), pear, apple and fig in
    turn, each grown from its own seed, and a row of staked vines along the back. Footprint cols * spacing x rows_ * spacing
    (+ 2 for the vines); `cells` are the trees' and stakes' root squares."""
    i0, k0 = _ik(x, z)
    pieces = []
    if vines: pieces.append(vine_row(x, z, cols * spacing, yup, seed + 99))
    kinds = ['pear', 'apple', 'fig']
    n = 0
    for r in range(rows_):
        off = spacing // 2 if r % 2 else 0
        for c in range(cols - (1 if r % 2 else 0)):
            xx = (i0 + off + c * spacing + spacing // 2 - 1) * S
            zz = (k0 + (2 if vines else 0) + r * spacing + spacing // 2 - 1) * S
            kind = kinds[n % 3]
            pieces.append(fig(xx, zz, yup, seed + n) if kind == 'fig' else fruit_tree(xx, zz, yup, seed + n, kind))
            n += 1
    p = merge(*pieces)
    rows, _ = settle(p.rows)
    return Piece(rows, p.cells, p.canopy)


def spring(x, z, yup=4, seed=0, outflow=3):
    """a spring in the rock (Od. V.70 Calypso's four springs "flowing with bright water"; IX.140 the spring at the harbour's
    head below a cave; XIII.109 the cave of the Naiads with its ever-flowing waters): a small outcrop of stone two courses high,
    mossed on top, its water falling as clear round bricks into a pool of clear tiles in a stone lip, and running off in a
    rivulet `outflow` studs long toward +z. Footprint 4 x (5 + outflow)."""
    rng = random.Random(seed)
    i0, k0 = _ik(x, z)
    rows = []
    for r in (0, 1):
        rows += masonry(_line(i0, k0 + r, 4, 'x'), yup, 2 - (r == 1 and rng.random() < .5) * 0, seed + r, top=None,
                        shades=[(LBG, 3), (DBG, 3), (DTAN, 1)])
    y = yup + 48
    mossy = {(i0 + a, k0 + b) for a in range(4) for b in range(2) if (a, b) != (1, 1)}
    rows += moss(mossy, y, seed).rows
    rows.append(block(DBG, 'plate', i0 + 1, k0 + 1, 1, 1, y))
    rows.append(put(DGREEN, (i0 + 1.5) * S, y + 8 + 5, (k0 + 1.5) * S, '6255', RY(rng.uniform(0, 6))))
    # the pool: a lip of stone round clear water, the fall at its back
    lip = [(i0, k0 + 2), (i0 + 3, k0 + 2), (i0, k0 + 3), (i0 + 3, k0 + 3), (i0, k0 + 4), (i0 + 1, k0 + 4), (i0 + 3, k0 + 4)]
    pool = [(i0 + 1, k0 + 2), (i0 + 2, k0 + 2), (i0 + 1, k0 + 3), (i0 + 2, k0 + 3)]
    rows += lay({c: DBG for c in lip}, yup, 'plate', sizes=[(1, 3), (1, 2), (2, 1), (1, 1)])
    rows += [on(pick(rng, [(LBG, 2), (DBG, 1)]), *_xz(c, yup + 8), '98138' if rng.random() < .5 else '3070b') for c in lip]
    run = [(i0 + 2, k0 + 4 + q) for q in range(outflow + 1)]
    rows += lay({c: BLUE for c in pool + run}, yup, 'plate', sizes=[(2, 2), (1, 2), (2, 1), (1, 1)])
    fall = (i0 + 1, k0 + 2)
    rows += [on(TLBLUE if _h(*c, seed) < .7 else TCLEAR, *_xz(c, yup + 8), '3070b') for c in pool + run if c != fall]
    rows += [on(TCLEAR, *_xz(fall, yup + 8), '3062b'), on(TCLEAR, *_xz(fall, yup + 32), '3062b')]
    cells = cells_rect(i0, k0, 4, 2) | set(lip) | set(pool) | set(run)
    return _done(rows, cells, set())


def gate(x, z, yup=4, seed=0, opening=4, wall=3):
    """a town gate (Od. VI.262-9 the Phaeacian town "with a high wall and a fair harbour on either side"; the gate of Ithaca's
    town at the road's head, XVII): two piers of dressed stone two studs square and five courses high flanking an opening
    `opening` studs wide, a lintel of plates and tiles across them, and a stub of town wall `wall` studs long each side, its
    top broken off in steps. The road runs through along z. Footprint (opening + 4 + 2 * wall) x 2."""
    rng = random.Random(seed)
    i0, k0 = _ik(x, z)
    rows = []
    L = i0 + wall
    piers = [(L, L + 1), (L + 2 + opening, L + 3 + opening)]
    shades = [(TAN, 3), (DTAN, 2), (LBG, 1)]
    for a, b in piers:
        for c in range(5):              # a 2 x 2 pier, its stones turned each course so they bond
            for r in (0, 1):
                if c % 2 == 0: rows.append(block(pick(rng, shades), 'stone', a, k0 + r, 2, 1, yup + 24 * c))
                else: rows.append(block(pick(rng, shades), 'stone', a + r, k0, 1, 2, yup + 24 * c))
    y = yup + 120
    rows.append(block(DTAN, 'plate', L, k0, opening + 4, 2, y))
    rows.append(block(TAN, 'plate', L + 1, k0, opening + 2, 2, y + 8))
    rows += tile_run(TAN, L * S, k0 * S, 1, y + 8) + tile_run(TAN, L * S, (k0 + 1) * S, 1, y + 8)
    rows += tile_run(TAN, (L + opening + 3) * S, k0 * S, 1, y + 8) + tile_run(TAN, (L + opening + 3) * S, (k0 + 1) * S, 1, y + 8)
    rows += tile_run(DTAN, (L + 1) * S, k0 * S, opening + 2, y + 16) + tile_run(DTAN, (L + 1) * S, (k0 + 1) * S, opening + 2, y + 16)
    for side, cols in ((-1, list(range(i0, L))), (1, list(range(L + opening + 4, L + opening + 4 + wall)))):
        hts = {i: max(2, 4 - (n if side == 1 else len(cols) - 1 - n)) for n, i in enumerate(cols)}
        for r in (0, 1):
            rows += stepped([(i, k0 + r) for i in cols], [hts[i] for i in cols], yup, seed + r + side, shades)
    cells = {(i, k0 + r) for i in range(i0, L + opening + 4 + wall) for r in (0, 1) if not (L + 2 <= i < L + 2 + opening)}
    return _done(rows, cells, set())


def stepped(line, heights, yup, seed, shades=STONES):
    """a wall along `line` whose height (in courses) varies stone to stone, as a broken wall: each course laid over the run of
    squares that reach it, to break joint, and each column capped with a tile at its own height"""
    rng = random.Random(seed)
    rows = []
    for c in range(max(heights)):
        run = []
        for sq, h in zip(line + [None], heights + [0]):
            if sq is not None and h > c: run.append(sq); continue
            if run: rows += masonry(run, yup + 24 * c, 1, seed + c * 7 + len(rows), shades, top=None); run = []
    for sq, h in zip(line, heights):
        rows.append(on(pick(rng, shades), *_xz(sq, yup + 24 * h), '3070b' if rng.random() < .6 else '98138'))
    return rows


# ═══ the cards: the sampler and the two scenes ═══
class Plot:
    """a framed baseplate (or several) being filled: pieces are added with a check that no two claim the same stud square"""
    def __init__(self):
        self.rows, self.taken, self.canopy = [], set(), set()
        AVOID.clear()

    def add(self, piece, name='', over=False):
        """over: the piece stands on another piece (moss on a rock, a tree on a terrace), not on the ground"""
        if over: self.rows += piece.rows; avoid(piece.rows); return piece
        clash = self.taken & piece.cells
        if clash: raise ValueError(f'{name} would stand on taken squares {sorted(clash)[:6]}')
        self.rows += piece.rows; self.taken |= piece.cells; self.canopy |= piece.canopy
        avoid(piece.rows)
        return piece

    def base(self, x0, z0, w=32, d=32, col=GREEN, frame_it=True):
        """a baseplate (32 x 32 or 16 x 32) whose back-left corner is (x0, z0), and its display frame"""
        if (w, d) == (32, 32): self.rows.append(put(col, x0 + 320, 4, z0 + 320, '3811'))
        elif (w, d) == (32, 16): self.rows.append(put(col, x0 + 320, 4, z0 + 160, '3857'))
        elif (w, d) == (16, 32): self.rows.append(put(col, x0 + 160, 4, z0 + 320, '3857', RY(math.pi / 2)))
        elif (w, d) == (16, 16): self.rows.append(put(col, x0 + 160, 4, z0 + 160, '3867'))
        if frame_it:
            fr, cells = frame(x0, z0, w, d, 4)
            self.rows += fr; self.taken |= cells

    def turf(self, x0, z0, w, d, seed=0, kind='t', dress=.05):
        """finish every square of the area still bare with turf (tiles), dressed with the odd plant"""
        i0, k0 = _ik(x0, z0)
        tm = [''.join('.' if (i0 + a, k0 + b) in self.taken else kind for a in range(w)) for b in range(d)]
        G = ground(x0, z0, tm, None, 4, seed=seed, dress=dress)
        self.rows += G.rows; self.taken |= set(G.top)


def _L(X, Z, li, lk):
    """LDU of the back-left corner of local stud (li, lk) on the plate whose back-left corner is (X, Z)"""
    return X + li * S, Z + lk * S


def sampler():
    """set.landscape-sampler: every builder on nine framed 32 x 32 baseplates (a 3 x 3 square, 96 x 96 studs)"""
    P_ = Plot()
    plates = {}
    for r, Z in enumerate((-960, -320, 320)):
        for c, X in enumerate((-960, -320, 320)):
            plates['ABCDEFGHI'[r * 3 + c]] = (X, Z)
            P_.base(X, Z)
    A = lambda name, li, lk: _L(*plates[name], li, lk)
    # A: trees I (the olive, the cypress, the oak)
    P_.add(oak(*A('A', 7, 7), 4, 11), 'oak')
    P_.add(olive(*A('A', 22, 6), 4, 12), 'olive')
    P_.add(olive(*A('A', 22, 21), 4, 13), 'olive')
    for n, (li, lk) in enumerate(((4, 21), (8, 25), (12, 22))): P_.add(cypress(*A('A', li, lk), 4, 14 + n), 'cypress')
    # B: trees II (plane, poplars, fig, willow)
    P_.add(plane(*A('B', 7, 7), 4, 21), 'plane')
    P_.add(poplar(*A('B', 21, 4), 4, 22), 'poplar')
    P_.add(poplar(*A('B', 25, 12), 4, 23, white=True), 'white poplar')
    P_.add(fig(*A('B', 21, 22), 4, 24), 'fig')
    P_.add(willow(*A('B', 7, 22), 4, 25), 'willow')
    # C: trees III (fir, stone pine, alder, fruit trees)
    P_.add(pine(*A('C', 7, 7), 4, 31), 'fir')
    P_.add(pine(*A('C', 22, 7), 4, 32, kind='stone'), 'stone pine')
    P_.add(alder(*A('C', 6, 22), 4, 33), 'alder')
    for n, (kind, li, lk) in enumerate((('pear', 16, 19), ('apple', 24, 18), ('pomegranate', 20, 25), ('quince', 26, 25))):
        P_.add(fruit_tree(*A('C', li, lk), 4, 34 + n, kind=kind), kind)
    # D: shrubs and low plants, moss on a rock, reeds
    P_.add(shrub(*A('D', 2, 2), 4, 41, 'laurel'), 'laurel')
    P_.add(shrub(*A('D', 8, 2), 4, 42, 'myrtle'), 'myrtle')
    P_.add(shrub(*A('D', 13, 3), 4, 43, 'myrtle'), 'myrtle')
    P_.add(shrub(*A('D', 18, 2), 4, 44, 'maquis'), 'maquis')
    P_.add(shrub(*A('D', 24, 3), 4, 45, 'maquis'), 'maquis')
    P_.add(asphodel(*A('D', 2, 9), 5, 3, 4, 46), 'asphodel')
    P_.add(asphodel(*A('D', 8, 10), 4, 3, 4, 47), 'asphodel')
    for n, kind in enumerate(('poppy', 'violet', 'parsley', 'wild', 'grass')):
        P_.add(flowers(*A('D', 14 + (n % 3) * 5, 9 + (n // 3) * 5), 4, 4, 4, 48 + n, kind=kind), kind)
    rock_line = [(i, k) for i in range(_ik(*A('D', 2, 16))[0], _ik(*A('D', 2, 16))[0] + 6) for k in range(_ik(*A('D', 2, 16))[1], _ik(*A('D', 2, 16))[1] + 4)]
    rk = []
    for kk in sorted({k for _, k in rock_line}):
        rk += masonry([c for c in rock_line if c[1] == kk], 4, 2, 60 + kk, shades=[(LBG, 3), (DBG, 3)], top=None)
    P_.add(Piece(rk, set(rock_line), set()), 'rock')
    P_.add(moss(set(rock_line), 52, 61), 'moss', over=True)
    P_.add(reeds(*A('D', 12, 20), 4, 3, 4, 62), 'reeds')
    P_.add(reeds(*A('D', 17, 21), 3, 2, 4, 63), 'reeds')
    P_.add(ivy_wall(*A('D', 2, 26), 12, 4, 64), 'ivy wall')
    # E: roads
    P_.add(road(*A('E', 1, 1), 29, 4, 71, width=6, culverts=(13,)), 'road')
    st = turn(stream(0, 0, 8, 4, 72, width=2), 0, 0, 1)      # a stream along z from the culvert toward the front
    ie, ke = _ik(*A('E', 13, 9))
    st = Piece([row(int(r.split()[1]), mat_mul(T(ie * S + 5 * S - 0 * S, 0, ke * S), [float(v) for v in r.split()[2:14]]), r.split()[14]) if r.startswith('1 ') else r for r in st.rows],
               {(c[0] + ie + 5, c[1] + ke) for c in st.cells}, set())
    P_.add(st, 'stream')
    P_.add(cart_track(*A('E', 20, 10), 10, 4, 73), 'cart track')
    P_.add(footpath(*A('E', 20, 16), 10, 4, 74), 'footpath')
    P_.add(paving(*A('E', 1, 11), 10, 8, 4, 75), 'paving')
    P_.add(threshold(*A('E', 4, 19), 4, 4, 76, kind='stone'), 'threshold')
    P_.add(stair(*A('E', 1, 22), 4, 6, 4, 77), 'stair')
    P_.add(terrace(*A('E', 7, 21), 7, 7, 4, 78, courses=2, top='p', slopes=False), 'terrace for the stair')
    P_.add(threshold(*A('E', 22, 22), 4, 4, 79, kind='oak'), 'oak threshold')
    P_.add(threshold(*A('E', 22, 25), 4, 4, 80, kind='ash'), 'ash threshold')
    # F: walls and floors
    P_.add(drystone(*A('F', 1, 1), 14, 4, 81, courses=2), 'field wall')
    P_.add(drystone(*A('F', 1, 2), 8, 4, 82, courses=2, axis='z'), 'field wall')
    P_.add(threshing_floor(*A('F', 4, 5), 4, 83, diam=10), 'threshing floor')
    P_.add(gate(*A('F', 16, 2), 4, 84, opening=4, wall=3), 'gate')
    P_.add(terrace(*A('F', 16, 8), 14, 6, 4, 85, courses=2, top='t', keep={_ik(*A('F', 19, 10)), _ik(*A('F', 20, 10)), _ik(*A('F', 19, 11)), _ik(*A('F', 20, 11))}), 'terrace')
    P_.add(olive(*A('F', 19, 10), 52, 86), 'olive on the terrace', over=True)
    P_.add(drystone(*A('F', 2, 17), 12, 4, 87, courses=1), 'low wall')
    P_.add(ivy_wall(*A('F', 16, 17), 13, 4, 88, courses=3), 'ivy wall')
    P_.add(paving(*A('F', 2, 20), 12, 8, 4, 89), 'court')
    P_.add(stair(*A('F', 16, 21), 4, 5, 4, 90, cheeks=True), 'steps')
    # G: water
    P_.add(fountain(*A('G', 2, 1), 4, 91, channel=4), 'fountain')
    P_.add(spring(*A('G', 13, 1), 4, 92, outflow=3), 'spring')
    P_.add(stream(*A('G', 18, 2), 12, 4, 93, width=2), 'stream')
    P_.add(stream(*A('G', 18, 9), 12, 4, 94, width=3), 'stream')
    P_.add(beach(*A('G', 1, 16), 30, 14, 4, 95, water_h=2), 'beach')
    # H: cultivation
    P_.add(pergola(*A('H', 2, 2), 6, 4, 4, 101), 'pergola')
    P_.add(vine_row(*A('H', 10, 2), 20, 4, 102), 'vine row')
    P_.add(field(*A('H', 2, 8), 12, 7, 4, 103, crop='plough'), 'ploughed field')
    P_.add(field(*A('H', 15, 8), 7, 7, 4, 104, crop='grain'), 'grain')
    P_.add(field(*A('H', 23, 8), 7, 7, 4, 105, crop='young'), 'young crop')
    P_.add(orchard(*A('H', 3, 16), 3, 2, 4, 106, spacing=8, vines=False), 'orchard')
    # I: the terrain helper, and the quay
    X, Z = plates['I']
    tm = ['rrrrrtttttttttttttttttttttttttt'[:30]] * 0
    tmap, hmap = [], []
    for b in range(18):
        line, hl = '', ''
        for a in range(30):
            d_ = math.hypot(a - 8, b - 6)
            h = max(0, int(6 - d_ * .6 + _h(a, b, 3) * .8))
            t = 'r' if h >= 5 else ('t' if h >= 1 else 'm')
            if 18 <= a <= 21: t, h = 'e', min(h, 1)
            if 23 <= a <= 28 and 4 <= b <= 9: t, h = 'w', 2
            if 22 <= a <= 29 and 3 <= b <= 10 and t != 'w': t, h = 's', 2
            line += t; hl += str(h)
        tmap.append(line); hmap.append(hl)
    G = ground(*A('I', 1, 1), tmap, hmap, 4, seed=111, dress=.06)
    P_.add(Piece(G.rows, set(G.top), set()), 'terrain')
    P_.add(quay(*A('I', 1, 20), 30, 4, 112, depth=4, courses=2, water=6, water_h=2), 'quay')
    for name, (X, Z) in plates.items(): P_.turf(X + S, Z + S, 30, 30, seed=ord(name))
    rows, dropped = settle(P_.rows)
    return rows, len(dropped)


def ithaca_road():
    """set.landscape-ithaca-road (Od. XVII.182-253): the road from the shore up to the town of Ithaca, 80 x 32 studs on a blue
    16 x 32 and two green 32 x 32 baseplates. From the left: the sea, foam, shingle and sand, steps up from the beach; the built
    road with its kerbs running right, crossing the fountain's outflow on a culvert; the town fountain behind the road under
    its ring of black poplars, the altar of the Nymphs on its rock; two olive terraces climbing behind; a ploughed field walled
    in front; the stream winding from the culvert to the sea through a meadow; the town gate at the road's head and the paved
    street beyond it. Eumaeus leads the beggar up the road; Melanthius and his goats come down from the gate."""
    P_ = Plot()
    P_.base(-960, -320, 16, 32, col=BLUE, frame_it=False)
    P_.base(-640, -320, frame_it=False); P_.base(0, -320, frame_it=False)
    fr, fcells = frame(-960, -320, 80, 32, 4, plate=16)
    P_.rows += fr; P_.taken |= fcells
    I0, I1, K0, K1 = -47, 30, -15, 14                 # the interior squares
    LAND = 3                                          # the land's rise in plates (its top at 36, level with the road)
    top = 4 + 8 * (LAND + 1)
    # the road, the culvert under it at the fountain's outflow
    fx, fk = -14, -15                                 # the fountain's back-left square
    ch_i = fx + 4
    r0 = -30
    stand = {(-20, 2), (-19, 2), (-17, 3), (-16, 3), (8, 1), (9, 1), (11, 2), (12, 2), (5, 3), (6, 3)}
    P_.add(road(r0 * S, -1 * S, 48, 4, 201, width=6, culverts=(ch_i - r0,), stand=stand), 'road')
    P_.add(fountain(fx * S, fk * S, 4, 202, channel=8), 'fountain')
    # the gate at the head of the road, turned so the road runs through it, and the town street beyond
    gt = turn(gate(0, 0, 4, 203, opening=8, wall=3), 0, 0, 1)
    P_.add(shift(gt, 18, -6), 'gate')
    # the terraces behind the road, olives on them
    t1_keep = cells_rect(-1, -9, 2, 2) | cells_rect(10, -8, 2, 2)
    t2_keep = cells_rect(4, -14, 2, 2)
    P_.add(terrace(-2 * S, -10 * S, 16, 6, 4, 204, courses=2, top='t', keep=t1_keep, slopes=False), 'terrace 1')
    P_.add(terrace(-2 * S, -15 * S, 16, 5, 4, 205, courses=3, top='t', keep=t2_keep, slopes=False), 'terrace 2')
    for n, c in enumerate(((-1, -9), (10, -8))): P_.add(olive(c[0] * S, c[1] * S, 52, 210 + n), 'olive', over=True)
    for n, c in enumerate(((4, -14),)): P_.add(olive(c[0] * S, c[1] * S, 76, 215 + n), 'olive', over=True)
    # the ploughed field, set a plate low in the land, with a dry-stone wall along its back
    fld = {(i, k) for i in range(-2, 16) for k in range(9, 14)}
    wall = {(i, 8) for i in range(-2, 16)}
    # the stream from the culvert to the sea
    stream_cells = set()
    path = [(ch_i, k) for k in range(7, 11)] + [(i, 10) for i in range(ch_i - 1, -34, -1)]
    for n, (i, k) in enumerate(path):
        wig = round(math.sin(n / 3.0) * 1.0) if k == 10 else 0
        for d in (0, 1):
            stream_cells.add((i + (d if k != 10 else 0), k + wig + (d if k == 10 else 0)))
    # the ground everywhere else
    cells = {}
    for i in range(I0, I1 + 1):
        for k in range(K0, K1 + 1):
            c = (i, k)
            if c in P_.taken: continue
            shore = -39 + round(math.sin(k / 3.1) * 1.3 + math.sin(k / 1.7 + 1) * .6)
            if i < shore - 5: cells[c] = ('d', 1)
            elif i < shore: cells[c] = ('w', 1)
            elif i == shore: cells[c] = ('f', 1)
            elif i <= shore + 2: cells[c] = ('g', 1)
            elif i <= shore + 5: cells[c] = ('s', 1 if i <= shore + 4 else 2)
            elif i <= -32: cells[c] = ('t' if i <= -33 else 'm', 2)
            else: cells[c] = ('t', LAND)
            if c in stream_cells:
                if cells[c][0] in 'wdf': pass
                elif cells[c][0] in 'sg': cells[c] = ('w', 1)
                else: cells[c] = ('w', 2) if _h(i, k, 7) > .12 else ('g', 1)
            elif any((i + a, k + b) in stream_cells for a in (-1, 0, 1) for b in (-1, 0, 1)) and cells[c][0] == 't' and i > -32:
                cells[c] = ('g', LAND - 1) if _h(i, k, 8) < .5 else ('t', LAND - 1)
            if -8 <= k <= 14 and -32 <= i <= -20 and cells[c][0] == 't' and c not in stream_cells: cells[c] = ('m', cells[c][1])
            if c in fld: cells[c] = ('e', LAND - 1)
            if c in wall: cells[c] = ('t', LAND)
            if i >= 18 and -1 <= k <= 6: cells[c] = ('p', LAND)             # the street through the gate
            if i >= 18 and -4 <= k <= 9 and cells[c][0] == 't': cells[c] = ('p', LAND)
    # steps from the sand up to the road's end
    for k in range(0, 6):
        cells[(-31, k)] = ('S', 2); cells[(-32, k)] = ('S', 1)
    # what stands on the land (its studs kept): poplars round the fountain, trees and shrubs, the field and its wall
    keep = set()
    plants = []
    for n, (i, k) in enumerate(((-18, -14), (-4, -14), (-18, -8), (-5, -8), (-21, -11))):
        plants.append(poplar(i * S, k * S, 4 + 8 * (cells[(i, k)][1] + 1), 220 + n)); keep |= cells_rect(i, k, 2, 2); avoid(plants[-1].rows)
    for n, (f, i, k, kw) in enumerate(((cypress, -26, -13, {}), (cypress, -24, -9, {}), (fig, -28, -6, {}), (olive, 24, 11, {}),
                                       (shrub, -30, -10, {'kind': 'maquis'}), (shrub, -31, -14, {'kind': 'myrtle'}),
                                       (shrub, -35, -6, {'kind': 'myrtle'}), (shrub, 19, 10, {'kind': 'laurel'}),
                                       (shrub, -2, -4, {'kind': 'myrtle'}), (shrub, 11, -4, {'kind': 'maquis'}))):
        p = f(i * S, k * S, 4 + 8 * (cells[(i, k)][1] + 1), 230 + n, **kw); plants.append(p); keep |= p.cells; avoid(p.rows)
    figs = {(-20, 2), (-19, 2), (-17, 3), (-16, 3)}
    pre = set(P_.taken)
    G = ground_at(cells, 4, keep=keep | fld | wall, seed=240, dress=.05)
    P_.add(Piece(G.rows, set(G.top), set()), 'ground')
    seen = set()
    for p in plants:
        bad = (p.cells & (pre | seen | stream_cells | fld | wall)) or any(cells.get(c, ('t',))[0] not in 'tmgs' for c in p.cells) \
              or len({cells.get(c, ('t', -1))[1] for c in p.cells}) > 1
        if bad: raise ValueError(f'a plant at {sorted(p.cells)[:2]} stands where it cannot')
        seen |= p.cells
        P_.add(Piece(p.rows, set(), p.canopy), 'plant', over=True)
    P_.add(field(-2 * S, 9 * S, 18, 5, 4 + 8 * LAND, 250, crop='plough'), 'field', over=True)
    P_.add(Piece(masonry(sorted(wall), 4 + 8 * (LAND + 1), 1, 251), set(), set()), 'field wall', over=True)
    # the people: Eumaeus leading the beggar up the road, Melanthius with goats coming down from the gate
    people = []
    people += figure('character.eumaeus', 'eumaeus', -16 * S, 36, 3.5 * S, -3 * math.pi / 4)
    people += figure('character.odysseus-as-beggar', 'odysseus-as-beggar', -19 * S, 36, 2.5 * S, -3 * math.pi / 4)
    people += figure('character.melanthius', 'melanthius', 9 * S, 36, 1.5 * S, 3 * math.pi / 4)
    try:
        people += figure('creature.goat-herd', 'herd-4', 12 * S, 36, 2.5 * S, math.pi / 2)
        people += figure('creature.goat-herd', 'herd-5', 6 * S, 36, 3.5 * S, math.pi / 2)
    except Exception as e:
        print('   goats:', e)
    rows, dropped = settle(P_.rows, fixed=people)
    return rows + people, len(dropped)


def grove():
    """set.landscape-grove (Od. V.63-75): Calypso's grove on one framed 32 x 32 baseplate. "Round the cave grew a luxuriant wood,
    alder and poplar and sweet-smelling cypress ... and there about the hollow cave ran trailing a garden vine, in the pride of
    its prime, rich with clusters. And fountains four in a row were flowing with bright water, near one another, turned one this
    way, one that; and round about soft meadows of violets and parsley were blooming." A rising bank of mossy rock at the back,
    four springs at its foot whose brooks wander apart through the meadow, alder, black poplar and cypress round about, the
    vine on its pergola, patches of violets and parsley; Hermes stands at the meadow's edge and marvels, Calypso by a spring."""
    P_ = Plot()
    P_.base(-320, -320)
    I0, I1, K0, K1 = -15, 14, -15, 14
    # the springs at the foot of the bank
    springs = [(-14, -11, 5), (-8, -11, 3), (-2, -11, 4), (4, -11, 2)]
    for n, (i, k, out) in enumerate(springs): P_.add(spring(i * S, k * S, 4, 300 + n, outflow=out), 'spring')
    # the brooks: from each spring's rivulet, turned one this way, one that
    brooks = set()
    turns = [(-1, 0), (1, 0), (-1, 0), (1, 0)]
    for n, (i, k, out) in enumerate(springs):
        ci, ck = i + 2, k + 4 + out + 1
        d = turns[n]
        for step in range(22):
            if not (I0 <= ci <= I1 and K0 <= ck <= K1): break
            brooks.add((ci, ck))
            if step % 5 == 4: ck += 1
            elif step % 5 == 2: ci += d[0]
            else: ck += 1 if step < 6 else 0; ci += d[0] if step >= 6 else 0
    cells = {}
    for i in range(I0, I1 + 1):
        for k in range(K0, K1 + 1):
            c = (i, k)
            if c in P_.taken: continue
            if k <= -12 or (k == -11 and c not in P_.taken):
                h = min(9, 3 + (-11 - k) + (1 if _h(i, k, 3) < .3 else 0))
                cells[c] = ('r' if _h(i, k, 5) < .55 else 't', h)
            else:
                cells[c] = ('w', 2) if c in brooks else ('m', 1)
    # trees and the vine, on the meadow
    keep, plants = set(), []
    pg = cells_rect(8, -9, 5, 4)
    if all(cells.get(c, ('x',))[0] == 'm' for c in pg):
        p = pergola(8 * S, -9 * S, 5, 4, 20, 320); plants.append(p); keep |= p.cells; avoid(p.rows)
    for n, (f, i, k, kw) in enumerate(((cypress, -14, -6, {}), (alder, -14, 1, {}), (cypress, -14, 9, {}), (poplar, 12, -3, {}),
                                       (alder, 11, 4, {}), (cypress, 12, 11, {}), (poplar, -9, -8, {}), (cypress, 7, 12, {}))):
        cs = cells_rect(i, k, 2, 2)
        if any(cells.get(c, ('x',))[0] != 'm' for c in cs) or cs & keep: print('   grove: no room for', f.__name__, i, k); continue
        p = f(i * S, k * S, 20, 310 + n, **kw); plants.append(p); keep |= cs; avoid(p.rows)
    fl = []
    for n, (i, k, kind) in enumerate(((-6, -3, 'violet'), (0, 2, 'parsley'), (-9, 1, 'parsley'), (3, 6, 'violet'), (-3, 8, 'violet'),
                                      (6, 0, 'parsley'), (-12, 1, 'violet'))):
        cs = cells_rect(i, k, 3, 3)
        if any(cells.get(c, ('x',))[0] != 'm' for c in cs) or cs & keep: continue
        p = flowers(i * S, k * S, 3, 3, 20, 330 + n, kind=kind, base=None); fl.append(p); keep |= cs
    stand = cells_rect(-1, 12, 2, 1) | cells_rect(-9, -4, 2, 1)
    keep |= stand
    G = ground_at(cells, 4, keep=keep, seed=340, dress=.07)
    P_.add(Piece(G.rows, set(G.top), set()), 'ground')
    for p in plants + fl: P_.add(Piece(p.rows, set(), p.canopy), 'plant', over=True)
    # moss and ferns on the bank
    people = figure('character.hermes', 'hermes', 0, 20, 12.5 * S, .8 * math.pi) + figure('character.calypso', 'calypso', -8 * S, 20, -3.5 * S, math.pi)
    rows, dropped = settle(P_.rows, fixed=people)
    return rows + people, len(dropped)


# ═══ the registry: each builder as the sampler and the self-test call it ═══
REGISTRY = [   # (name, call(seed) on a 32 x 32 baseplate centred at the origin, the builder's Homeric source in short)
    ('olive', lambda s: olive(-20, -20, 4, s), 'Od. XIII.102, XXIII.190'),
    ('cypress', lambda s: cypress(-20, -20, 4, s), 'Od. V.64'),
    ('oak', lambda s: oak(-20, -20, 4, s), 'Od. XIV.327, XIX.296'),
    ('plane', lambda s: plane(-20, -20, 4, s), 'Il. II.307'),
    ('poplar', lambda s: poplar(-20, -20, 4, s), 'Od. VII.106, X.510, XVII.208'),
    ('poplar white', lambda s: poplar(-20, -20, 4, s, white=True), 'Od. VII.106 (leuke)'),
    ('fig', lambda s: fig(-20, -20, 4, s), 'Od. VII.116, XI.590, XII.103, XXIV.341'),
    ('willow', lambda s: willow(-20, -20, 4, s), 'Od. X.510'),
    ('alder', lambda s: alder(-20, -20, 4, s), 'Od. V.64, V.239'),
    ('fir', lambda s: pine(-20, -20, 4, s), 'Od. V.239'),
    ('stone pine', lambda s: pine(-20, -20, 4, s, kind='stone'), '(Mediterranean shore)'),
    ('fruit tree pear', lambda s: fruit_tree(-20, -20, 4, s), 'Od. VII.115, XXIV.340'),
    ('fruit tree apple', lambda s: fruit_tree(-20, -20, 4, s, kind='apple'), 'Od. VII.115, XXIV.340'),
    ('laurel', lambda s: shrub(-40, -40, 4, s, 'laurel'), 'Od. IX.183'),
    ('myrtle', lambda s: shrub(-20, -20, 4, s, 'myrtle'), '(the maquis of the coasts)'),
    ('maquis', lambda s: shrub(-40, -20, 4, s, 'maquis'), '(the scrub of the hills)'),
    ('reeds', lambda s: reeds(-40, -20, 3, 2, 4, s), 'Od. XIV.474'),
    ('asphodel', lambda s: asphodel(-40, -40, 4, 3, 4, s), 'Od. XI.539, XXIV.13'),
    ('flowers poppy', lambda s: flowers(-40, -40, 4, 4, 4, s, 'poppy'), '(wild flowers)'),
    ('flowers violet', lambda s: flowers(-40, -40, 4, 4, 4, s, 'violet'), 'Od. V.72'),
    ('flowers parsley', lambda s: flowers(-40, -40, 4, 4, 4, s, 'parsley'), 'Od. V.72'),
    ('flowers wild', lambda s: flowers(-40, -40, 4, 4, 4, s, 'wild'), '(wild flowers)'),
    ('flowers grass', lambda s: flowers(-40, -40, 4, 4, 4, s, 'grass'), '(grass tufts)'),
    ('moss', lambda s: merge(Piece(masonry([(i, k) for i in range(-2, 2) for k in (0,)], 4, 1, s, top=None) +
                                   masonry([(i, k) for i in range(-2, 2) for k in (1,)], 4, 1, s + 1, top=None), set(), set()),
                             moss({(i, k) for i in range(-2, 2) for k in (0, 1)}, 28, s)), '(stone)'),
    ('ivy wall', lambda s: ivy_wall(-200, 0, 20, 4, s), 'Od. XVII.266'),
    ('drystone', lambda s: drystone(-200, 0, 20, 4, s), 'Od. XVIII.359, XXIV.224'),
    ('terrace', lambda s: terrace(-200, -100, 20, 6, 4, s, keep={(-8, -4)}), '(the terraced hillsides)'),
    ('road', lambda s: road(-300, -80, 30, 4, s, culverts=(14,)), 'Od. III.478-497'),
    ('cart track', lambda s: cart_track(-300, -40, 30, 4, s), 'Od. VI.37-110, XV.190'),
    ('footpath', lambda s: footpath(-300, -40, 30, 4, s), 'Od. XIV.1, XVII.204'),
    ('paving', lambda s: paving(-200, -200, 20, 20, 4, s), 'Od. XVII.264-8'),
    ('stair', lambda s: stair(-60, -60, 4, 6, 4, s), 'Od. I.330, XXIII.85'),
    ('threshold', lambda s: threshold(-40, 0, 4, 4, s), 'Od. XVII.339, XXI.43, XX.258'),
    ('threshing floor', lambda s: threshing_floor(-100, -100, 4, s), 'Il. V.499, XX.495'),
    ('gate', lambda s: gate(-200, 0, 4, s), 'Od. VI.262-9, XVII'),
    ('fountain', lambda s: fountain(-80, -100, 4, s), 'Od. XVII.205-211'),
    ('spring', lambda s: spring(-40, -80, 4, s), 'Od. V.70, IX.140, XIII.109'),
    ('stream', lambda s: stream(-300, -60, 30, 4, s), 'Od. V.441, VI.85'),
    ('beach', lambda s: beach(-300, -200, 30, 20, 4, s, water_h=2), 'Od. V.151, VI.94, XIII.116'),
    ('quay', lambda s: quay(-300, -100, 30, 4, s, water_h=2), 'Od. VI.263-7, XIII.96'),
    ('pergola', lambda s: pergola(-60, -40, 6, 4, 4, s), 'Od. V.69, VII.121'),
    ('vine row', lambda s: vine_row(-200, 0, 20, 4, s), 'Od. XXIV.342, Il. XVIII.561'),
    ('field', lambda s: field(-200, -100, 20, 10, 4, s), 'Od. XVIII.366-375'),
    ('field grain', lambda s: field(-200, -100, 20, 10, 4, s, crop='grain'), 'Od. XVIII.366-375'),
    ('orchard', lambda s: orchard(-300, -300, 3, 2, 4, s), 'Od. XXIV.336-344'),
    ('ground', lambda s: Piece(ground(-300, -300, ['tttmmmrrrreeessggfwwd'] * 10, ['333222555511111111111'] * 10, 4, seed=s).rows, set(), set()), '(terrain)'),
]


def selftest(seeds=(0, 1, 2), card='set.landscape-selftest'):
    """build every builder alone on a baseplate for each seed, check it with kitlib.check, and return
    {name: (min pieces, max pieces, worst not clicked, worst same space, free parts that would clash)}. The card is removed after."""
    out = {}
    for name, f, src in REGISTRY:
        res = []
        for s in seeds:
            AVOID.clear()
            p = f(s)
            rows = [put(GREEN, 0, 4, 0, '3811')] + p.rows
            n = write(card, 'self test', rows)
            import io, contextlib
            with contextlib.redirect_stdout(io.StringIO()): _, l, o = check(card, show=0)
            res.append((n - 1, l, o, free_clashes(rows)))
        out[name] = (min(r[0] for r in res), max(r[0] for r in res), max(r[1] for r in res), max(r[2] for r in res), max(r[3] for r in res))
    try: os.remove(os.path.join(CARDS, card + '.mpd'))
    except OSError: pass
    return out


SAMPLER_PLATES = {'A': (-960, -960), 'B': (-320, -960), 'C': (320, -960), 'D': (-960, -320), 'E': (-320, -320), 'F': (320, -320),
                  'G': (-960, 320), 'H': (-320, 320), 'I': (320, 320)}


def sampler_part(rows, letters):
    """the sampler's rows that stand on the plates named (every part lies wholly on its own plate), for a close-up card"""
    out = []
    for r in rows:
        if not r.startswith('1 '): out.append(r); continue
        t = r.split(); x, z = float(t[2]), float(t[4])
        if any(X <= x < X + 640 and Z <= z < Z + 640 for X, Z in (SAMPLER_PLATES[c] for c in letters)): out.append(r)
    return [r for n, r in enumerate(out) if r.startswith('1 ') or (n + 1 < len(out) and out[n + 1].startswith('1 '))]


def main():
    rows, dropped = sampler()
    print('sampler: free parts dropped by settle', dropped)
    cards = [('set.landscape-sampler', 'The Landscape Library: the sampler', rows)]
    for name, letters, title in (('trees', 'ABC', 'the trees'), ('ground', 'EFGI', 'roads, walls, water and ground'),
                                 ('plants', 'DH', 'shrubs, flowers and cultivation')):
        cards.append(('set.landscape-' + name, 'The Landscape Library: ' + title, sampler_part(rows, letters)))
    r2, d2 = ithaca_road(); print('ithaca road: dropped', d2)
    cards.append(('set.landscape-ithaca-road', 'The Landscape Library: the road to Ithaca town', r2))
    r3, d3 = grove(); print('grove: dropped', d3)
    cards.append(('set.landscape-grove', "The Landscape Library: Calypso's grove", r3))
    for name, title, rr in cards:
        n = write(name, title, rr, author='tools/forage/product/landscape.py')
        print(name, n, 'pieces'); check(name)
    st = selftest(seeds=(0, 1, 2, 3))
    for k, v in st.items(): print(f'  {k:18s} {v[0]:4d}-{v[1]:<4d} pieces, not clicked {v[2]}, same space {v[3]}, free clashes {v[4]}')
    return st


if __name__ == '__main__':
    main()
