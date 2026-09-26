#!/usr/bin/env python3
"""tools/forage/product/kits/recognition-helen.py — THE RECOGNITIONS, 1: HELEN KNOWS HIM (Odyssey IV), a Vignette of the Odyssey line.

  python3 tools/forage/product/kits/recognition-helen.py   -> odyssey/cards/set.recognition-helen.mpd, set.recognitions-lineup.mpd

The poem's central event is recognition, and it happens four times (halfworld scenes/_direction.mjs). The Recognitions are a series of
Vignettes on matching 16 x 16 bases, each finished in the line's frame and built to one grammar, so that they stand in a row:
  - a back wall two studs deep across the base's width, six courses high and capped in tiles, with its one feature at the centre
  - a floor of tiles in front of it, bare studs only where a figure or a thing stands
  - the one who knows and the one who is known on the midline, the thing that gives him away at the front
This file holds that grammar (the other Recognitions import it) and builds the first: Helen, in Sparta, telling how she alone knew
Odysseus when he came into Troy as a beggar, and bathed him. She sits in her high chair at the silver work-basket that runs on wheels,
its rim finished in gold, the golden distaff in her hand and violet wool in the basket (Od. IV 120-135); the beggar she tells of
stands before her by the golden pitcher and the silver basin, in the corner of Menelaus's hall, under a red column and a fresco band.

The fourth Recognition, The Bed, is another builder's kit.
"""
import importlib.util, json, math, os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
from kitlib import mat_mul, T, RY, RX, RZ, row

HERE = os.path.dirname(os.path.abspath(__file__))
PSILVER, PGOLD = 179, 297
X0, Z0 = -160, -160          # every Recognition: a 16 x 16 baseplate centred on the origin
FLOOR = 12                   # the floor's top: tiles (and plates where something stands) on the baseplate
WALL_K = (-7, -6)            # the back wall's two rows of studs, inside the frame
WALL_I = range(-7, 7)        # ... and its 14 studs across
COURSES = 6                  # six courses of brick on the baseplate: its top at 4 + 144 = 148, the cap tiles at 156
WALL_TOP = 4 + COURSES * 24


# ── figures, posed (the same helpers as the line's other kits) ──
def body(card, sub, drop=(), swap=None):
    """a figure's parts [col, m, part] with its hip at (0, -40, 0) and feet at 0; `swap` {part: (new part, colour)} changes what it holds"""
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    bl = next((b for b in re.split(r'(?m)^0 FILE ', text) if b.startswith(f'{card} - {sub}.ldr')), '')
    rows_ = [l.split() for l in bl.splitlines() if l.startswith('1 ') and l.split()[-1].replace('.dat', '') not in drop]
    hip = next(t for t in rows_ if re.match(r'3815', t[14]))
    off = T(-float(hip[2]), -(float(hip[3]) + 40), -float(hip[4]))
    out = []
    for t in rows_:
        pid, col = t[14].replace('.dat', ''), int(t[1])
        if swap and pid in swap: pid, col = swap[pid]
        out.append([col, mat_mul(off, [float(v) for v in t[2:14]]), pid])
    return out


def about(p, R): return mat_mul(mat_mul(T(*p), R), T(-p[0], -p[1], -p[2]))
def rot3(m): return [m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11]]
def as_m(r): return [0, 0, 0] + list(r)
def transpose(m): r = rot3(m); return as_m([r[0], r[3], r[6], r[1], r[4], r[7], r[2], r[5], r[8]])


def core(pid):
    return pid in ('3815b', '3816c', '3817c') or pid.startswith(('973', '3626', '3901', '11256', '13251', '93223', '4524', '3899'))


def arm(fig, side, pitch, spread=0.17, twist=0.0):
    """set an arm ('R' 3818, on the figure's right, -x; 'L' 3819) to hang `pitch` radians forward-up from the side (0 down, -pi/2 straight
    ahead, -pi overhead), `spread` out from the body; its hand and what the hand holds swing with it"""
    pid, other = ('3818', '3819') if side == 'R' else ('3819', '3818')
    a = next(p for p in fig if p[2] == pid)
    sx = 1 if side == 'L' else -1
    sh = a[1][:3]
    want = mat_mul(RZ(-sx * spread), mat_mul(RX(pitch), RY(twist)))
    delta = about(sh, mat_mul(as_m(rot3(want)), transpose(a[1])))
    for p in fig:
        if p is a or (not core(p[2]) and p[2] != other and (p[1][0] - sh[0]) * sx > -8 and math.dist(p[1][:3], sh) < 60):
            p[1] = mat_mul(delta, p[1])
    return fig


def head(fig, fwd=0.0, side=0.0, turn=0.0):
    """turn (about the neck, + to the figure's left) and tilt the head and what it wears"""
    R = mat_mul(RY(turn), mat_mul(RX(fwd), RZ(side)))
    for p in fig:
        if p[1][1] < -70 and p[2].startswith(('3626', '3901', '11256', '13251', '93223')):
            p[1] = mat_mul(about((0, -72, 0), R), p[1])
    return fig


def sit(fig):
    for p in fig:
        if p[2] in ('3816c', '3817c'): p[1] = mat_mul(p[1], RX(-math.pi / 2))
    return fig


def hand(fig, side):
    sh = next(p for p in fig if p[2] == ('3818' if side == 'R' else '3819'))[1]
    return min((p for p in fig if p[2] == '3820'), key=lambda p: math.dist(p[1][:3], sh[:3]))[1]


def at(m, x, yup, z, rot=0):
    """where a point of a figure (its part's matrix m, in the figure's frame) lands when the figure is placed"""
    return mat_mul(mat_mul(T(x, -yup, z), RY(rot)), m)[:3]


def place(fig, x, yup, z, rot=0):
    base = mat_mul(T(x, -yup, z), RY(rot))
    return [row(c, mat_mul(base, m), part) for c, m, part in fig]


def seated_at(fig, x, seat, z, rot=0):
    """a seated figure whose thighs rest on the surface at yup `seat`"""
    return place(sit(fig), x, seat - 19.25, z, rot)


# ── the grammar of the base ──
def tiles(cells, colour, yup=4, studs=()):
    """tile the studs of `cells` (i, k) on the surface yup: 2 x 2 where four of a colour meet, else 1 x 2, else 1 x 1; the cells in
    `studs` get plates instead (studs for what stands there)"""
    rows_, left = [], set(cells)
    for (i, k) in sorted(cells, key=lambda c: (c[1], c[0])):
        if (i, k) not in left: continue
        c, stud = colour(i, k), (i, k) in studs
        kind = (lambda v: v in studs) if stud else (lambda v: v not in studs)
        q = [(i, k), (i + 1, k), (i, k + 1), (i + 1, k + 1)]
        part2, part12, part1 = ('3022', '3023', '3024') if stud else ('3068b', '3069b', '3070b')
        if all(v in left and colour(*v) == c and kind(v) for v in q):
            rows_.append(put(c, (i + 1) * S, yup + P, (k + 1) * S, part2)); left -= set(q)
        elif (i + 1, k) in left and colour(i + 1, k) == c and kind((i + 1, k)):
            rows_.append(put(c, (i + 1) * S, yup + P, (k + .5) * S, part12)); left -= {(i, k), (i + 1, k)}
        elif (i, k + 1) in left and colour(i, k + 1) == c and kind((i, k + 1)):
            rows_.append(put(c, (i + .5) * S, yup + P, (k + 1) * S, part12, RY(math.pi / 2))); left -= {(i, k), (i, k + 1)}
        else:
            rows_.append(put(c, (i + .5) * S, yup + P, (k + .5) * S, part1)); left.discard((i, k))
    return rows_


BRICK = {1: '3005', 2: '3004', 3: '3622', 4: '3010', 6: '3009', 8: '3008'}


def wall(colour, gaps=(), spans=(), cap=None, caps_off=(), courses=COURSES, i_range=WALL_I, k_rows=WALL_K, part_of=None, longest=lambda h: 4):
    """the back wall: for each course h (0 on the baseplate) and each of its rows k, 1 x n bricks in a running bond (no joint over a joint
    of the course below); colour(i, h, k) colours a brick by its first stud. `gaps` {(i, h, k)} are left open (a doorway, a niche);
    `spans` [(i, n, h, k, col, part)] are laid first (a lintel over a gap). The top is capped in 1 x n tiles of `cap`, except over the
    columns in `caps_off` (coping gone). part_of(n, i, h, k) may swap a brick's part. Returns (rows, top): top[(i, k)] the yup of a
    stud column's top."""
    out, top, taken = [], {}, set()
    for (i, n, h, k, col, part) in spans:
        out.append(put(col, (i + n / 2) * S, 4 + (h + 1) * 24, (k + .5) * S, part))
        taken |= {(i + a, h, k) for a in range(n)}
    for h in range(courses):
        for k in k_rows:
            cells = [i for i in i_range if (i, h, k) not in gaps and (i, h, k) not in taken]
            runs, cur = [], []
            for i in cells:
                if cur and i != cur[-1] + 1: runs.append(cur); cur = []
                cur.append(i)
            if cur: runs.append(cur)
            for r in runs:
                L = longest(h)
                a, first = 0, (max(1, L // 2) if (h + k) % 2 else L)
                while a < len(r):
                    n = min(first if a == 0 else L, len(r) - a)
                    if n == 4 and len(r) - a == 5: n = 3
                    i = r[a]
                    part = part_of(n, i, h, k) if part_of else None
                    out.append(put(colour(i, h, k), (i + n / 2) * S, 4 + (h + 1) * 24, (k + .5) * S, part or BRICK[n]))
                    a += n
    for k in k_rows:
        for i in i_range:
            hs = [h for h in range(courses) if (i, h, k) not in gaps]
            if hs: top[(i, k)] = 4 + (max(hs) + 1) * 24
    if cap is not None:
        for k in k_rows:
            run = [i for i in i_range if i not in caps_off and (i, courses - 1, k) not in gaps]
            segs, cur = [], []
            for i in run:
                if cur and i != cur[-1] + 1: segs.append(cur); cur = []
                cur.append(i)
            if cur: segs.append(cur)
            for sg in segs:
                out += tile_run(cap, sg[0] * S, k * S, len(sg), top[(sg[0], k)])
                for i in sg: top[(i, k)] += P
    return out, top


def base(colour=TAN):
    """the baseplate and the line's frame; returns (rows, the frame's cells, the floor's cells in front of the wall)"""
    fr, cells = frame(X0, Z0, 16, 16)
    floor = {(i, k) for i in range(-8, 8) for k in range(-8, 8)} - cells - {(i, k) for i in WALL_I for k in WALL_K}
    return [put(colour, 0, 4, 0, '3867')] + fr, cells, floor


def shift(rows_, dx=0, dz=0):
    """the same build moved across the table (for the line-up)"""
    out = []
    for r in rows_:
        if r.startswith('1 '):
            t = r.split(); t[2] = f'{float(t[2]) + dx:g}'; t[4] = f'{float(t[4]) + dz:g}'; out.append(' '.join(t))
        else: out.append(r)
    return out


def module(slug):
    spec = importlib.util.spec_from_file_location(slug.replace('-', '_'), os.path.join(HERE, slug + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


# ── Helen ──
def chair(x, z, col=RB):
    """Helen's high chair: a 2 x 3 seat on four legs of 1 x 1 bricks, a back two bricks high on its rear row, gold studs on the back's
    top; a footstool before it. (x, z) the seat's centre (x on a stud line, z on a stud centre); returns (rows, the seat's yup)"""
    out = []
    for dx in (-10, 10):
        for dz in (-20, 20): out.append(on(col, x + dx, FLOOR, z + dz, '3005'))
    out.append(put(col, x, FLOOR + 32, z, '3021', RY(math.pi / 2)))
    for j in range(2): out.append(on(col, x, FLOOR + 32 + 24 * j, z - 20, '3004'))
    out += [put(PGOLD, x, FLOOR + 88, z - 20, '3069b')]
    out += [on(col, x, FLOOR, z + 40, '3023'), put(PGOLD, x, FLOOR + 16, z + 40, '3069b')]
    return out, FLOOR + 32


def work_basket(x, z):
    """the silver work-basket that runs on wheels, its rims finished in gold (Od. IV 131-2), heaped with violet wool: a plate with
    wheel pins and four gold rims, a round silver brick, a gold round plate for the rim, violet wool on it. (x, z) its centre"""
    y = FLOOR + 14                                                        # the plate rides 14 over the floor on its wheels
    out = root([put(PSILVER, x, y, z, '4600')])
    for dx in (-27, 27):
        out.append(row(PGOLD, mat_mul(T(x + dx, -(y - 4), z), RZ(math.pi / 2)), '4624'))
    out += [put(PSILVER, x, y + 24, z, '3941'), put(PGOLD, x, y + 32, z, '4032a')]
    out += [on(DPURPLE, x + dx, y + 32, z + dz, '3062b' if (dx, dz) == (-10, -10) else '3024') for dx, dz in ((-10, -10), (10, -10), (-10, 10), (10, 10))]
    return out


def pitcher_and_basin(x, z):
    """the golden pitcher and the silver basin she washed him from: a 2 x 2 dish upturned, a gold cone and round brick for the ewer"""
    return [on(PSILVER, x, FLOOR, z, '4032a'), put(TLBLUE, x, FLOOR + 16, z, '14769'),
            on(PGOLD, x + 30, FLOOR, z - 10, '3062b'), on(PGOLD, x + 30, FLOOR + 24, z - 10, '4589')]


def column(x, z, height=COURSES * 24):
    """a Minoan column before the wall: black base, a shaft of red round bricks, a black capital and cushion up to the wall's cap"""
    out = [on(BLK, x, 4, z, '4032a')]
    y, n = FLOOR, (height - 8 - 8) // 24
    for j in range(n): out.append(on(RED if j < n - 1 else DRED, x, y + 24 * j, z, '3941'))
    y += 24 * n
    out += [on(BLK, x, y, z, '4032a'), on(BLK, x, y + 8, z, '3022'), put(BLK, x, y + 24, z, '3068b')]
    return out


NICHE = range(-1, 1)           # the wall's feature at the centre: two studs across, four courses high


def helen_wall():
    """a corner of Menelaus's hall: a red dado, courses of tan, a fresco band of blue with red at the third course, a red frieze, dark
    tan coping; at the centre a niche to the bathing-rooms, its curtain of dark red and a tan lintel over it"""
    gaps = {(i, h, WALL_K[1]) for i in NICHE for h in range(4)}

    def col(i, h, k):
        if i in NICHE and h < 4 and k == WALL_K[0]: return DRED if h % 2 else RED              # the curtain in the niche
        if h == 0: return DRED
        if h == 2: return MBLUE if (i + (k == WALL_K[0])) % 2 else RED
        if h == COURSES - 1: return RED
        return TAN if (i + h) % 5 else DTAN
    return wall(col, gaps=gaps, spans=[(NICHE[0] - 1, 4, 4, WALL_K[1], DTAN, '3010')], cap=DTAN, longest=lambda h: 1 if h == 2 else 4)


def rug(cells_x, cells_z):
    """the rug of soft wool Alcippe brought for her chair (Od. IV 124): a border of dark red round a field of gold-ochre, in the floor's tiles"""
    i0, i1, k0, k1 = cells_x[0], cells_x[-1], cells_z[0], cells_z[-1]
    return lambda i, k: (DBLUE if i in (i0, i1) or k in (k0, k1) else DRED) if i0 <= i <= i1 and k0 <= k <= k1 else None


def krater(x, z):
    """by her chair the golden mixing-bowl, the wine she had cast her drug into (Od. IV 220), on a stand of dark wood; two cups"""
    return [on(RB, x, FLOOR, z, '3941'), on(RB, x, FLOOR + 24, z, '4032a'), on(PGOLD, x, FLOOR + 32, z, '3941'),
            put(TRED, x, FLOOR + 56 + P, z, '14769')]


def tripod(x, z):
    """a bronze stand of the treasure along the wall: a round foot, a stem of dark wood, the cauldron on it"""
    return [on(PGOLD, x, FLOOR, z, '4032a'), on(DB, x, FLOOR + 8, z, '3941'), on(PGOLD, x, FLOOR + 32, z, '4032a'),
            on(PGOLD, x, FLOOR + 40, z, '3941'), put(PGOLD, x, FLOOR + 64 + P, z, '14769')]


def helen():
    rows_, fcells, floor = base(TAN)
    stand = set()
    chair_x, chair_z = -60, 10
    cr, seat = chair(chair_x, chair_z)
    stand |= {(i, k) for i in (-4, -3) for k in (-1, 1)} | {(i, 2) for i in (-4, -3)}              # chair legs; footstool
    beg_x, beg_z = 60, 30
    stand |= {(2, 1), (3, 1)}                                                                    # the beggar's feet
    stand |= {(4, 3), (5, 3), (4, 4), (5, 4), (6, 3)}                                             # basin, pitcher
    stand |= {(4, -5), (5, -5), (4, -4), (5, -4)}                                               # the tripod
    stand |= {(-7, -2), (-6, -2), (-7, -1), (-6, -1)}                                           # the krater
    col_cells = {(-6, -5), (-5, -5), (-6, -4), (-5, -4)}                                         # the column stands on the baseplate
    on_rug = rug(range(-6, 0), range(-2, 4))
    colour = lambda i, k: on_rug(i, k) or (WHITE if (i // 2 + k // 2) % 2 else TAN)             # a floor of gypsum and tan, a rug
    rows_ += tiles(floor - col_cells, colour, studs=stand)
    wr, top = helen_wall()
    rows_ += wr + column(-100, -80) + tripod(100, -80) + krater(-120, -20)
    rows_ += cr + work_basket(0, 0) + pitcher_and_basin(100, 80)
    # Helen in her chair, turned toward the man she tells of, the golden distaff upright in her hand
    f = body('character.helen', 'helen', drop=('2343',))
    arm(f, 'R', -0.8, 0.2); arm(f, 'L', -1.1, 0.25); head(f, 0.05, 0, 0.35)
    rot = math.pi - 0.45
    rows_ += seated_at(f, chair_x, seat, chair_z, rot)
    hx, hy, hz = at(hand(f, 'R'), chair_x, seat - 19.25, chair_z, rot)
    rows_.append(row(PGOLD, T(hx, hy + 30, hz), '3957a'))
    rows_.append(row(DPURPLE, T(hx, hy - 36, hz), '4589'))                                           # violet wool on it
    # the beggar she knew in Troy, stooped over his staff, his hand out to her
    f = body('character.odysseus-as-trojan-beggar', 'odysseus-as-trojan-beggar')
    arm(f, 'L', -1.2, 0.1); head(f, 0.2, 0, 0.2)
    rows_ += place(f, beg_x, FLOOR, beg_z, math.pi + 0.5)
    return rows_


def lineup():
    """the three Recognitions side by side, each on its own 16 x 16 base, as they stand on a shelf"""
    out = []
    for n, slug in enumerate(('recognition-helen', 'recognition-scar', 'recognition-argos')):
        rows_ = helen() if slug == 'recognition-helen' else module(slug).build()
        if isinstance(rows_, tuple): rows_ = rows_[0]
        out += shift(rows_, (n - 1) * 360)
    return out


MANIFEST = dict(
    title='Helen Knows Him', book='IV', tier='Vignette',
    moment='In Sparta, at her silver work-basket, Helen tells how she alone knew Odysseus when he came into Troy disguised as a beggar, '
           'and bathed him, and kept his secret.',
    quote='"I alone recognized him in that guise, and questioned him; but he in his craft evaded me." (Odyssey IV, tr. A. T. Murray)',
    object='The silver work-basket that runs on wheels, its rims finished in gold, heaped with violet wool, with the golden distaff in '
           'Helen\'s hand: roll it to her chair.',
    sources=['scenes/OD-B04-S03.mjs', 'assets/location/menelauss-palace.mjs', 'scenes/_direction.mjs'],
)


if __name__ == '__main__':
    n = write('set.recognition-helen', 'The Recognitions: Helen Knows Him', helen())
    print('set.recognition-helen', n); check('set.recognition-helen')
    if all(os.path.exists(os.path.join(HERE, s + '.py')) for s in ('recognition-scar', 'recognition-argos')):
        nl = write('set.recognitions-lineup', 'The Recognitions: Helen, the Scar, Argos', lineup())
        print('set.recognitions-lineup', nl); check('set.recognitions-lineup')
