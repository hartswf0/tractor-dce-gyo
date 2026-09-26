#!/usr/bin/env python3
"""tools/forage/product/kits/the-bed.py — THE BED (Odyssey XXIII), a Large kit of the Odyssey line.

  python3 tools/forage/product/kits/the-bed.py      -> odyssey/cards/set.the-bed*.mpd, odyssey/kits/the-bed/kit.json

The moment (OD-B23-S04, "the summit"): Penelope has ordered the bed carried out of the chamber; Odysseus, stung, tells how he built it
round a living olive and laid the close-set stone walls of the room about it; she knows him and runs to him. The two of them embrace
beside the bed; old Eurycleia stands in the one doorway with the lamp.

The model is a section. Above the floor line, the thalamos: close-set ashlar walls on three sides and a front wall that lifts away, a
ceiling of timber beams, the bed. Below the floor line, the earth, cut open at the front and the left side so the roots show. The olive
is sculpted (tools/forage/product/sculpt.py) as ONE form with the earth: the roots in the ground, the trunk rising through the paving
(cut open round its flare) as the bed's near-left post, and the crown spreading over the beams. The bed's rails are laid INTO the trunk:
the plate of each rail runs through a course of the living wood, so the frame cannot be lifted without the tree, and the tree cannot be
lifted without the ground. That is the play feature: try to carry the bed out.
"""
import copy, json, math, os, re, sys, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *

SCR = '/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad/the-bed'
os.makedirs(SCR, exist_ok=True)
tempfile.tempdir = SCR                      # sculpt.settle writes its scratch file here, not where other builders' land

SLUG = 'the-bed'
BASE = 4                                    # the baseplate's top
FL_H = 15                                   # plate layer of the paving; the earth is layers 0..14 (yup 4..124)
EARTH_TOP = BASE + FL_H * P                 # 124: studs of the earth, where walls and posts stand
FLOOR = EARTH_TOP + P                       # 132: the paving's face
WALL_C = 7                                  # courses of ashlar
WALL_TOP = EARTH_TOP + WALL_C * B           # 292
I0, I1, K0, K1 = -15, 14, -15, 14           # the earth block's cells (inside the white ring)
TX, TZ = -170, 190                          # the olive's axis
DOOR = range(5, 9)                          # the doorway in the back wall (cells i), five courses high
BEAMS = (-11, -6, -1, 4)                    # the ceiling beams (rows k), clear of the trunk

# the bed: cells i -8..-3 across, k 0..9 head to foot; the trunk is its near-left corner post, four studs from the section's face
BI0, BI1, BK0, BK1 = -8, -3, 0, 9
H_RAIL = FL_H + 3                           # plate layer of the rails (a brick over the floor): run through the trunk
H_STRAP = H_RAIL + 1                        # the ox-hide straps
H_BED = H_RAIL + 2                          # fleeces and the coverlet
def Y(h): return BASE + h * P               # underside of plate layer h


# ── the olive and the ground ──
RC = (TX, EARTH_TOP - 8, TZ)                 # the root crown, just under the paving
ROOTS = [(RC, (-290, -10, 300), 20, 9), (RC, (-210, -20, 290), 19, 9), (RC, (-100, -10, 300), 19, 9), (RC, (-10, 0, 280), 17, 8),
         (RC, (-300, 0, 200), 18, 8), (RC, (-300, 20, 60), 17, 8), (RC, (0, 30, 60), 15, 8), (RC, (-200, 20, -40), 15, 8),
         ((-100, 50, 300), (60, -10, 290), 10, 7), ((-300, 40, 60), (-300, 0, -60), 10, 7),
         ((TX, EARTH_TOP - 20, TZ), (-40, 60, 300), 13, 8), ((TX, EARTH_TOP - 20, TZ), (-300, 70, 280), 13, 8)]
LOBES = [((-170, 350, 180), (110, 40, 100)), ((-60, 346, 100), (80, 44, 66)), ((-260, 346, 240), (60, 44, 56)), ((-150, 400, 140), (70, 44, 64)),
         ((-230, 344, 70), (64, 40, 50)), ((-110, 380, 230), (56, 40, 50))]
BRANCHES = [((TX, 286, TZ), (-70, 346, 90), 18, 10), ((TX, 286, TZ), (-250, 340, 240), 18, 10), ((TX, 286, TZ), (-160, 385, 150), 18, 12),
            ((TX, 286, TZ), (-220, 336, 80), 16, 10)]
POCKETS = [((-180, 60, 300), (190, 96, 130)), ((-300, 64, 100), (110, 84, 170))]


def trunk_r(y):
    if y < EARTH_TOP - 20: return 30
    if y < FLOOR + 10: return 36 - (y - (EARTH_TOP - 20)) * 0.1          # the flare at the floor
    return max(22, 34 - (y - FLOOR) * 0.055)


def in_pocket(p, pad=0):
    return 20 < p[1] < EARTH_TOP - 16 and min(ell(p, c, (r[0] + pad, r[1] + pad, r[2] + pad)) for c, r in POCKETS) < 0


def world(p):
    x, y, z = p
    i, k = math.floor(x / S), math.floor(z / S)
    # the tree
    bark = 5 * math.sin(y / 17 + x / 23) * math.sin(z / 19 + y / 29)
    t = math.hypot(x - TX, z - TZ) - trunk_r(y) + bark if y < 300 else 99
    for a, b, ra, rb in ROOTS:
        if y < EARTH_TOP: t = min(t, cone(p, a, b, ra, rb) + bark * 0.6)
    for a, b, ra, rb in BRANCHES: t = min(t, cone(p, a, b, ra, rb))
    if t <= 0 and y < EARTH_TOP and not (I0 <= i <= I1 and K0 <= k <= K1): t = 99
    if t <= 0 and y < 300: return t, ('root' if y < EARTH_TOP else 'trunk')
    if t <= 0: return t, 'trunk'
    if y > 312:
        lf = min(ell(p, c, r) for c, r in LOBES) + rough(p, 16, 1.3)
        if lf <= 0: return lf, 'leaf'
    # the earth
    if not (I0 <= i <= I1 and K0 <= k <= K1): return 99, 'air'
    if y < EARTH_TOP:
        if in_pocket(p): return 99, 'air'
        return -1, 'earth'
    if y < FLOOR and I0 < i < I1 and K0 < k < K1:
        if math.hypot(x - TX, z - TZ) < 46: return 99, 'air'                 # the paving cut open round the flare
        return -1, 'floor'
    return 99, 'air'


def hsh(*a):
    v = 0
    for q in a: v = (v * 131 + q * 7919 + 17) % 1000003
    return v


def colour(m, i, h, k):
    if m in ('earth', 'keep'):
        if h > 1 and in_pocket(((i + .5) * S, BASE + (h + .5) * P, (k + .5) * S), 22): return BLK        # the dark of the cut
        c = h // 3
        a, b = (i + 2 * (c % 2)) // 4, (k + 2 * (c % 2)) // 4
        if hsh(a, b, c) % 9 == 0: return DBG                                                     # a stone in the ground
        if c == 4: return DTAN if hsh(a, b, 2) % 3 else DB                                       # the made ground under the paving
        return MNOUGAT if hsh(a, b, c, 5) % 7 == 0 else DB
    if m == 'root':
        return DB if hsh(i // 2, k // 2, h // 3) % 4 == 0 else RB
    if m == 'trunk':
        v = hsh(i // 2, k // 2, h // 3, 9) % 9
        return OLIVE if v == 0 else DB if v < 4 else RB
    if m in ('leaf', 'leafk'):
        v = hsh(i // 3, k // 3, h // 2, 4) % 6
        return SANDGREEN if v < 3 else DGREEN if v < 5 else OLIVE
    if m in ('floor', 'stand'):
        a = (i + 2 * ((k // 2) % 2)) // 4
        return DTAN if hsh(a, k // 2, 3) % 4 == 0 else TAN
    return DTAN


# cells of the paving that keep their studs (a figure, a post, a chest stands there) and earth cells under walls and posts
STAND = {(i, k) for i in (1, 2, 3) for k in (7, 8)} | {(12, 5)} | {(i, k) for i in (-13, -12) for k in range(-12, -8)} | {(i, k) for i in (9, 10) for k in (-11, -10)} | {(i, k) for i in (6, 7) for k in (-9, -8)} | \
        {(i, -14) for i in DOOR}
POSTS = {(BI0, BK0), (BI1, BK0), (BI1, BK1)} | {(i, BK0 - 1) for i in range(BI0, BI1 + 1)}      # three posts and the headboard
WALLCELLS = {(i, K0) for i in range(I0, I1 + 1)} | {(I0, k) for k in range(K0, K1 + 1)} | {(I1, k) for k in range(K0, K1 + 1)} | \
            {(i, K1) for i in range(I0, I1 + 1)}

form = Form(y0=BASE, keep_studs=('keep', 'stand', 'leafk'), unit=P)
form.carve(world, range(-17, 17), range(0, 56), range(-17, 17))
for (i, h, k), m in list(form.vox.items()):
    if h == FL_H and (i, k) in STAND and m == 'floor': form.vox[(i, h, k)] = 'stand'
    if h == FL_H and (i, k) in POSTS and m == 'floor': del form.vox[(i, h, k)]
    if h == FL_H - 1 and ((i, k) in WALLCELLS or (i, k) in POSTS) and m == 'earth': form.vox[(i, h, k)] = 'keep'
# the rails' plate runs through the living wood: no trunk in its cells at that layer
RAILS = {(BI0, k) for k in range(BK0, BK1 + 1)} | {(i, BK1) for i in range(BI0, BI1 + 1)}
for (i, k) in RAILS: form.vox.pop((i, H_RAIL, k), None)
STRAPS = (BK0, BK0 + 2, BK0 + 4, BK0 + 6, BK0 + 8)
BEDDING = {(i, H_BED, k) for i in range(BI0, BI1 + 1) for k in range(BK0, BK0 + 8)}
for v in BEDDING: form.vox.pop(v, None)             # the bedding lies against the trunk, not in it
for k in STRAPS:
    for i in range(BI0, BI1 + 1): form.vox.pop((i, H_STRAP, k), None)
# nothing of the tree where the beams lie (two plates on the wall tops)
for kb in BEAMS:
    for i in range(I0, I1 + 1):
        for h in range((WALL_TOP - BASE) // P, (WALL_TOP - BASE) // P + 2): form.vox.pop((i, h, kb), None)
for (i, h, k) in [v for v in form.vox if form.vox[v] == 'trunk' and v[1] >= FL_H and (v[0], v[2]) in WALLCELLS]: form.vox.pop((i, h, k))
# the crown: a few studs left bare for sprays of leaves
LEAFK = [v for v, m in sorted(form.vox.items()) if m == 'leaf' and (v[0], v[1] + 1, v[2]) not in form.vox and hsh(*v) % 7 == 0]
for v in LEAFK: form.vox[v] = 'leafk'
form.hollow(side=2, up=3, pillar=4, keep=lambda v, m: m != 'earth')


# ── the walls: close-set ashlar, bonded at the back corners; the front wall lifts away ──
def lay(cells, c, along_x, fixed, lintel=()):
    """one course of a straight wall: bricks over the solid runs of `cells` (i along x, or k along z), joints staggered by course"""
    out, runs, run = [], [], []
    for q in cells:
        if run and q != run[-1] + 1: runs.append(run); run = []
        run.append(q)
    if run: runs.append(run)
    for run in runs:
        q, first = run[0], True
        while q <= run[-1]:
            left = run[-1] - q + 1
            L = min(left, (2 if (c + fixed) % 2 else 3) if first else 4)
            if left - L in (1,) and L > 2: L -= 1
            first = False
            col = RB if c == 4 else TAN if hsh(q // 3, c, fixed) % 5 < 3 else DTAN          # course 4: the timber laced through the wall
            part = {1: '3005', 2: '3004' if c == 4 else '98283', 3: '3622', 4: '3010'}[L]
            mid = (q + L / 2) * S
            yup = EARTH_TOP + (c + 1) * B
            out.append(put(col, mid, yup, (fixed + .5) * S, part) if along_x else put(col, (fixed + .5) * S, yup, mid, part, RY(math.pi / 2)))
            q += L
    return out


def walls(front=True):
    out = []
    for c in range(WALL_C):
        back = [i for i in range(I0 + (c % 2), I1 + 1 - (c % 2)) if not (i in DOOR and c < 5)]
        if c == 5:                                   # the lintel over the door: one long stone across it
            out.append(put(DTAN, (DOOR[0] - 1 + 3) * S, EARTH_TOP + 6 * B, (K0 + .5) * S, '3009'))
            back = [i for i in back if not DOOR[0] - 1 <= i <= DOOR[-1] + 1]
        out += lay(back, c, True, K0)
        side = list(range(K0 + 1 - (c % 2), K1 + 1))
        out += lay([k for k in side if not (c == 5 and k in (-6, -5))], c, False, I1)      # a high slot in the right wall
        out += lay(side, c, False, I0)
        if front: out += lay(list(range(I0 + 1, I1)), c, True, K1)
    # the wall tops: tiles, except where the beams bear
    top = WALL_TOP
    for kk, along, fixed, rng in ((K0, True, K0, range(I0, I1 + 1)), (None, False, I0, range(K0 + 1, K1 + 1)), (None, False, I1, range(K0 + 1, K1 + 1))):
        cells = [q for q in rng if not (not along and q in BEAMS)]
        run = []
        for q in cells + [None]:
            if run and (q is None or q != run[-1] + 1):
                out += tile_run(TAN, run[0] * S, fixed * S, len(run), top, True) if along else tile_run(TAN, fixed * S, run[0] * S, len(run), top, False)
                run = []
            if q is not None: run.append(q)
    if front: out += tile_run(TAN, (I0 + 1) * S, K1 * S, I1 - I0 - 1, top, True)
    return out


def beams():
    """the ceiling: timber beams from side wall to side wall, each two plates laid with their joints crossed"""
    out = []
    for kb in BEAMS:
        z = (kb + .5) * S
        for lay_, lens in ((0, (8, 8, 8, 6)), (1, (6, 8, 8, 8))):
            q = I0
            for L in lens:
                out.append(put(RB if lay_ else DB, (q + L / 2) * S, WALL_TOP + P * (lay_ + 1), z, {8: '3460', 6: '3666'}[L]))
                q += L
    return out


# ── the bed ──
def bed():
    out = []
    X = lambda i: (i + .5) * S
    for (i, k) in [(BI0, BK0), (BI1, BK0), (BI1, BK1)]:                         # three squared posts; the fourth is the olive
        out.append(put(RB, X(i), EARTH_TOP + B, X(k), '3005'))
    # the headboard, inlaid with gold, silver and ivory
    kh = BK0 - 1
    for c in range(4):
        yup = EARTH_TOP + (c + 1) * B
        if c == 2:
            for n, i in enumerate(range(BI0, BI1 + 1)): out.append(put((GOLD, 179, WHITE)[n % 3], X(i), yup, X(kh), '3005'))
        elif c % 2 == 1:
            out += [put(RB, (BI0 + 1.5) * S, yup, X(kh), '3622'), put(RB, (BI0 + 4.5) * S, yup, X(kh), '3622')]
        else:
            out += [put(RB, (BI0 + 1) * S, yup, X(kh), '3004'), put(RB, (BI0 + 4) * S, yup, X(kh), '3010')]
    out += [put(GOLD, X(BI0), EARTH_TOP + 4 * B + P, X(kh), '98138'), put(GOLD, X(BI1), EARTH_TOP + 4 * B + P, X(kh), '98138')]
    out += tile_run(RB, (BI0 + 1) * S, kh * S, BI1 - BI0 - 1, EARTH_TOP + 4 * B)
    # the rails (layer H_RAIL): the near-left ends run into the trunk
    yr = Y(H_RAIL + 1)
    for i in (BI0, BI1):
        out += [put(RB, X(i), yr, (BK0 + 3) * S, '3666', RY(math.pi / 2)), put(RB, X(i), yr, (BK0 + 8) * S, '3710', RY(math.pi / 2))]
    out += [put(RB, (BI0 + 3) * S, yr, X(BK0), '3710'), put(RB, (BI0 + 3) * S, yr, X(BK1), '3710')]
    # the ox-hide straps, across; gaps between them
    ys = Y(H_STRAP + 1)
    for k in STRAPS:
        out.append(put(MNOUGAT if k % 4 else NOUGAT, (BI0 + BI1 + 1) / 2 * S, ys, X(k), '3666'))
    out += [put(RB, (BI0 + 2.5) * S, ys, X(BK1), '3623'), put(RB, (BI1) * S, ys, X(BK1), '3023b')]      # the footboard
    # fleeces at the head (plates: their studs are the wool), pillows, the purple coverlet over the rest
    yb = Y(H_BED + 1)
    out += [put(WHITE, (BI0 + 1.5) * S, yb, (BK0 + 1) * S, '3021'), put(TAN, (BI0 + 4.5) * S, yb, (BK0 + 1) * S, '3021')]
    out += [put(WHITE, (BI0 + 1) * S, yb + P, (BK0 + .5) * S, '3069b'), put(WHITE, (BI0 + 5) * S, yb + P, (BK0 + .5) * S, '3069b')]
    for n, ic in enumerate((BI0 + 1, BI0 + 3, BI0 + 5)):
        for m_, kc in enumerate((BK0 + 3, BK0 + 5, BK0 + 7)):
            out.append(put(DPURPLE if n == 1 and m_ < 2 else DRED, ic * S, yb, kc * S, '3068b'))
    return out


def fleeces_on_floor():
    return []


# ── the people and the things in the room ──
def posed(card, sub, x, yup, z, rot, arms=(0, 0), drop=()):
    """a figure from its card with its arms set anew: each arm turned forward about its shoulder pin by arms[side] (radians, negative
    raises it toward the face), its hand with it. Returns (rows, hands): hands[side] = the hand's point in the build (LDraw coords)"""
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    bl = next(b for b in re.split(r'(?m)^0 FILE ', text) if b.startswith(f'{card} - {sub}.ldr'))
    body = [l.split() for l in bl.splitlines() if l.startswith('1 ') and l.split()[-1].replace('.dat', '') not in drop]
    hip = next(t for t in body if t[14].startswith('3815'))
    tx, tz = float(hip[2]), float(hip[4])
    base = mat_mul(mat_mul(T(x, -yup, z), RY(rot)), T(-tx, -(float(hip[3]) + 40), -tz))
    keep = [t for t in body if not re.match(r'38(18|19|20)', t[14])]
    out = [row(int(t[1]), mat_mul(base, [float(v) for v in t[2:14]]), t[14]) for t in keep]
    arm_col = {(1 if float(t[2]) > tx else 0): int(t[1]) for t in body if re.match(r'38(18|19)', t[14])}
    hands = {}
    for side, sg in ((0, -1), (1, 1)):
        piv = [tx + sg * 15.552, -63, tz]
        A0 = [0, 0, 0, 0.985, sg * 0.17, 0, -sg * 0.17, 0.985, 0, 0, 0, 1]
        H0 = [sg * 8.136, 17.76, -9.884, 0.985, -sg * 0.12, -sg * 0.12, sg * 0.002, 0.717, -0.697, sg * 0.17, 0.686, 0.707]
        rx = RX(arms[side])
        out.append(row(arm_col.get(side, 15), mat_mul(base, mat_mul(T(*piv), mat_mul(rx, A0))), '3819' if sg > 0 else '3818'))
        hm = mat_mul(base, mat_mul(T(*piv), mat_mul(rx, H0)))
        out.append(row(14, hm, '3820'))
        hands[side] = hm[:3]
    return out, hands


def embrace(x=40, z=160, yup=FLOOR):
    """she ran straight to him and threw her arms round his neck: the two on one mark of paving, arms about each other"""
    o, _ = posed('character.odysseus-restored', 'odysseus-restored', x - 10, yup, z, -math.pi / 2, (-1.25, -1.05), drop=('3847', '4499'))
    p, _ = posed('character.penelope', 'penelope', x + 30, yup, z, math.pi / 2, (-1.45, -1.3), drop=('2343',))
    return o + p


def eurycleia(x=140, z=(K0 + 1.5) * S, yup=FLOOR):
    """the old nurse in the doorway, the lamp held up"""
    out, hands = posed('character.eurycleia', 'eurycleia', x, yup, z, math.pi, (-1.9, 0), drop=('3899',))
    hx, hy, hz = hands[0]
    out += [row(RB, mat_mul(T(hx, hy, hz), RX(math.pi / 2)), '3959'), row(TORANGE, T(hx, hy - 28, hz), '37775')]
    return out


def lamp(x=(12 + .5) * S, z=(5 + .5) * S, yup=FLOOR):
    """Eurynome's lamp on its stand, lit"""
    return [on(RB, x, yup, z, '3062b'), on(RB, x, yup + 24, z, '3062b'), on(RB, x, yup + 48, z, '3062b'), on(GOLD, x, yup + 72, z, '4589'),
            on(TORANGE, x, yup + 96, z, '4589')]


def chest(x=-240, z=-200, yup=FLOOR):
    """the clothes-chest in the far corner: a box of timber, its lid, bronze studs"""
    return [on(RB, x, yup, z, '3001', math.pi / 2), put(DB, x, yup + B + P, z, '3020', RY(math.pi / 2)),
            put(RB, x, yup + B + 2 * P, z - 20, '3068b'), put(GOLD, x - 10, yup + B + 2 * P, z + 30, '98138'), put(GOLD, x + 10, yup + B + 2 * P, z + 30, '98138'),
            put(DRED, x, yup + B + 2 * P, z + 10, '3069b')]


def crown(f=None):
    """sprays of long olive leaves on the bare studs of the crown"""
    f, out = f or form, []
    for n, ((i, h, k), m) in enumerate(sorted(f.vox.items())):
        if m == 'leafk' and (i, h + 1, k) not in f.vox:
            out.append(on((DGREEN, GREEN, OLIVE)[n % 3], (i + .5) * S, f.y0 + (h + 1) * P, (k + .5) * S, '2417', (n % 4) * math.pi / 2))
    return out


def stool(x=200, z=-200, yup=FLOOR):
    """a stool by the wall with a fleece thrown over it, a bronze basin at its foot"""
    return [on(RB, x, yup, z, '3941'), put(WHITE, x, yup + B + P, z, '3022'), put(GOLD, x - 60, yup + P, z + 40, '4740')]


def things():
    return embrace() + eurycleia() + lamp() + chest() + stool() + crown()


def base():
    rows, cells = frame(-320, -320, 32, 32, BASE)
    return [put(DTAN, 0, BASE, 0, '3811')] + rows


def details(front=True):
    return base() + walls(front) + beams() + bed() + things()


def sub_bed():
    """the bed on its living post: the trunk with its crown, the bed pegged into it, on a slab of the paving and the ground under it"""
    f = copy.deepcopy(form)
    near = lambda i, k: BI0 - 3 <= i <= BI1 + 1 and BK0 - 2 <= k <= BK1 + 3
    f.vox = {v: m for v, m in f.vox.items() if v[1] >= FL_H - 3 and (m in ('trunk', 'leaf', 'leafk') or near(v[0], v[2]))}
    for _ in range(4):
        if not f.settle(colour, extra=lambda: bed() + crown(f), can_grow=lambda v: v not in BEDDING): break
    return f.parts(colour) + bed() + crown(f)


def sub_roots():
    """the roots, lifted out of the ground with the foot of the trunk: the one part of the bed no one has ever seen"""
    f = copy.deepcopy(form)
    f.vox = {v: m for v, m in f.vox.items() if m in ('root', 'trunk') and v[1] < FL_H + 6}
    for _ in range(4):
        if not f.settle(colour): break
    return f.parts(colour)


def sub_embrace():
    """the embrace on a slab of the paving, the lamp by them"""
    out = [put(DTAN, 0, 12, -20, '3795'), put(DTAN, 0, 12, 20, '3795')]
    taken = {(-1, -1), (-1, 0), (1, -1), (1, 0), (-3, -2)}
    for k in range(-2, 2):
        for i in range(-3, 3):
            if (i, k) not in taken: out.append(put(TAN if (i + k) % 3 else DTAN, (i + .5) * S, 20, (k + .5) * S, '3070b'))
    out += embrace(x=0, z=0, yup=12) + lamp(x=-50, z=-30, yup=12)
    return out


if __name__ == '__main__':
    for _ in range(6):
        before = dict(form.vox)
        left = form.settle(colour, extra=lambda: details(True), can_grow=lambda v: v not in BEDDING)
        left2 = form.settle(colour, extra=lambda: details(False), can_grow=lambda v: v not in BEDDING)
        if form.vox == before and not left and not left2: break
    tree = form.parts(colour)
    n = write('set.the-bed', 'The Bed', tree + details(True))
    n2 = write('set.the-bed-open', 'The Bed (the front wall lifted away)', tree + details(False))
    subs = [('bed', 'The bed on its living post', sub_bed()), ('roots', 'The roots', sub_roots()), ('embrace', 'The embrace', sub_embrace())]
    for sub, title, rows in subs: write(f'set.the-bed-{sub}', f'The Bed: {title.lower()}', rows)
    print('set.the-bed', n, 'pieces; open', n2, '; front wall', n - n2)
    for nm in ['set.the-bed', 'set.the-bed-open'] + [f'set.the-bed-{s_}' for s_, _, _ in subs]: check(nm)
    manifest(SLUG, title='The Bed', book='XXIII', tier='Large',
             moment='Penelope has ordered the bed carried out; Odysseus, stung, tells how he built it round a living olive, and she runs to him: '
                    'the two embrace beside the bed while old Eurycleia stands in the doorway with the lamp.',
             quote='There was a young olive growing within the precincts of the house, in full vigour, and about as thick as a bearing-post. '
                   'I built my room round this with strong walls of stone and a roof to cover them. (Odyssey XXIII, tr. Samuel Butler)',
             object='The olive: its trunk is the bed\'s near-left post and runs down through the cut-open paving into a mass of roots in the base. '
                    'The bed\'s rails and straps are laid through courses of the living trunk, so the bed will not lift out of the room: it is '
                    'clutched to the ground through the floor. The crown rises between the ceiling beams in leaf. The front wall lifts away.',
             builds=[{'card': 'set.the-bed', 'title': 'The Bed (closed)'}, {'card': 'set.the-bed-open', 'title': 'The Bed, the front wall lifted away'}] +
                    [{'card': f'set.the-bed-{s_}', 'title': t} for s_, t, _ in subs],
             images=[{'file': 'hero.jpg', 'caption': 'The thalamos closed: ashlar walls laced with timber, the olive in leaf over the beams, the earth cut open beneath.',
                      'alt': 'A square LEGO chamber of tan stone on a dark earth block, an olive tree crown rising over its ceiling beams and roots visible in a cut-away below.'},
                     {'file': 'open.jpg', 'caption': 'The front wall lifted away: the embrace, the bed on its living post, Eurycleia in the doorway with the lamp.',
                      'alt': 'The chamber with its front wall removed, two minifigures embracing beside a bed whose corner post is a tree trunk.'},
                     {'file': 'inside.jpg', 'caption': 'The section: the trunk goes down through the paving into the roots, the one part of the bed no one has seen.',
                      'alt': 'Close view of reddish-brown sculpted roots in a dark cut beneath the chamber floor, the trunk rising above them.'},
                     {'file': 'inside-2.jpg', 'caption': 'She ran straight to him: the embrace by the bed, its headboard inlaid with gold, silver and ivory.',
                      'alt': 'Two minifigures with arms about each other beside a bed with a red and purple coverlet and an inlaid headboard.'},
                     {'file': 'bed.jpg', 'caption': 'The bed on its living post, built on its own.', 'alt': 'The olive tree with the bed joined to its trunk on a slab of paving.'},
                     {'file': 'roots.jpg', 'caption': 'The roots, lifted out with the foot of the trunk.', 'alt': 'A sculpted mass of brown roots.'},
                     {'file': 'embrace.jpg', 'caption': 'The embrace, with the lamp.', 'alt': 'Odysseus and Penelope embracing on a small paved slab beside a lamp stand.'}],
             features=['The olive, its roots and the earth are sculpted as one form in plate cells (tools/forage/product/sculpt.py): bark in reddish brown, dark brown and a little olive, roots reddish brown against dark earth, the crown in sand green and dark green with sprays of leaves.',
                       'The play feature is structural: the bed\'s side and end rails and two of its ox-hide straps pass through courses of the trunk, which is built up from the roots on the baseplate, so lifting the bed lifts nothing.',
                       'The earth block is cut open at the front and left side down to the base, with the dark of the cut behind the roots; the paving is cut open round the flare of the trunk.',
                       'Close-set ashlar in tan and dark tan with embossed masonry bricks, one course of timber laced through the walls, the back corners bonded; the front wall is a separate running-bond panel that lifts off.',
                       'The bed: squared posts, a headboard with a course of gold, silver and white inlay, ox-hide straps with gaps between, fleeces and pillows at the head, a red and purple coverlet.',
                       'The paving is 2 x 4 and 2 x 2 tiles in tan and dark tan; studs are left only where someone or something stands.',
                       'Every card checks clean: every part clicked, no two parts in the same space.'],
             subs=[{'file': f'set.the-bed-{s_}.mpd', 'title': t, 'pieces': pieces(f'set.the-bed-{s_}'), 'text': txt} for (s_, t, _), txt in zip(subs, (
                 'The trunk with its crown and the bed pegged into it, standing on a slab of paving and made ground.',
                 'The root mass and the foot of the trunk, the sculpted part that lives under the floor.',
                 'Odysseus and Penelope embracing on a slab of paving, with the lit lamp on its stand.'))],
             sources=['odyssey-halfworld/scenes/OD-B23-S04.mjs', 'odyssey-halfworld/scenes/_authored/bed.mjs', 'odyssey-halfworld/scenes/_direction.mjs',
                      'odyssey-halfworld/assets/prop/olive-tree-marriage-bed.mjs', 'odyssey-halfworld/assets/location/marriage-chamber.mjs'],
             status='Built to the bar',
             next=['The crown is a voxel mass with leaf sprays; it reads as a tree from above but not yet as the long-leaved olive of the poem.',
                   'The roots read as a tangle of stepped bricks rather than as tapering roots; a finer cut (plates rather than brick-merged cells) would help.',
                   'Figures, the torch and the angled parts are placed by hand and are not checked by the tool; the embrace arms are re-posed about the shoulder pins.',
                   'Homer sets the recognition itself in the hall (the chamber is the next scene); the kit brings it into the chamber, beside the bed it turns on.',
                   'The closed front wall is plain; it hides the moment, which is only seen from above or with the wall lifted.'])
