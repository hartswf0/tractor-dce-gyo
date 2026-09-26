#!/usr/bin/env python3
"""tools/forage/product/kits/bow-and-hall.py — THE BOW AND THE HALL (Odyssey XXI-XXII), a flagship kit of the Odyssey line.

  python3 tools/forage/product/kits/bow-and-hall.py     -> odyssey/cards/set.bow-and-hall*.mpd, odyssey/kits/bow-and-hall/kit.json

The moment is "the turn" (halfworld scenes/OD-B21-S07, the last scene of Book XXI): the beggar has strung the bow and stands on the
stone sill inside the great doors; the bronze-weighted arrow has gone through all twelve axe-heads planted down the spine of the hall
and out past the last; the suitors at their tables have not yet understood; the great doors are shut.

The hall follows the halfworld plan scenes/_plans/megaron.mjs, turned so its long axis runs across the base (the plan's far wall is
the left end, its near end the right): the great doors and the sill at the left; the postern to the storeroom passage in the front
wall near the doors; the twelve axe-heads in a trench down the spine; the round clay hearth between four red columns that taper
downward, carrying the clerestory lantern and its smoke hole; the throne at the right end facing the doors, griffins painted on the
wall behind it; benches and tables down the long sides; the stair along the back wall to Penelope's door. The look is the Pylos
throne room: a floor painted in squares, walls plastered with a dado, a band of red and blue with running spirals, red columns
with black capitals, a hearth ringed in painted plaster.

The play: the arrow is a Technic axle 32L that really runs through the pin holes of twelve Technic bricks 1 x 1 (the axe-heads'
sockets, set in the trench on one axis); it slides back and forth through all twelve, the bronze cone of its point stopping it at
the far end. The great doors (two Door 1 x 4 x 6 in frames) swing on their hinges. The front wall lifts off the base in one piece.

Coordinates: LDraw units, x across (the doors at -x, the throne at +x), z toward the viewer, heights as yup (kitlib).
"""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *

SLUG = 'bow-and-hall'
AZURE = 321          # Dark Azure: the fresco blue
PDG, PLG = 148, 135  # pearl dark grey (iron), pearl light grey

# ── the plan (cells are stud squares (i, k): x from 20 i to 20 i + 20, z from 20 k to 20 k + 20) ──
X0, X1 = -28, 27     # the hall's floor, inside the walls: i -28..27 (x -560..560)
Z0, Z1 = -12, 11     # k -12..11 (z -240..240)
SPINE = -10          # the axe line runs down the hall at z -10 (the heads are 1 x 1)
HEADS = [-370 + 40 * n for n in range(12)]            # the twelve sockets, a stud apart from each other's shadow: pitch 2 studs
AXLE_C = (HEADS[0] + HEADS[-1]) / 2                   # the arrow's centre (a Technic axle 32L, 639 LDU)
HEARTH = (300, 0)    # the round hearth
COLS = [(140, -160), (140, 160), (460, -160), (460, 160)]
THRONE_X = 520
STAIR_I = range(8, 14)   # six steps along the back wall, rising toward +x; the landing at i 14, 15
DOOR_K = range(-4, 4)    # the great doors: z -80..80 in the left wall
POSTERN_I = (-19, -18)   # the postern to the storeroom passage, in the front wall near the doors
PEN_I = (14, 15)         # Penelope's door in the back wall, at the stair head

def cx(i): return (i + 0.5) * S


# ── walls ──
COURSES = [('B0', 4, 'brick'), ('B1', 28, 'brick'), ('B2', 52, 'brick'), ('B3', 76, 'brick'), ('B4', 100, 'brick'),
           ('B5', 124, 'brick'), ('P', 148, 'plate'), ('B6', 156, 'brick'), ('B7', 180, 'brick'), ('B8', 204, 'brick'),
           ('B9', 228, 'brick'), ('P2', 252, 'plate'), ('C', 260, 'tile'), ('CL', 100, 'tile')]
H = {'brick': 24, 'plate': 8, 'tile': 8}
PART1 = {'brick': {1: '3005', 2: '3004', 3: '3622', 4: '3010', 6: '3009', 8: '3008', 10: '6111', 12: '6112'},
         'plate': {1: '3024', 2: '3023', 3: '3623', 4: '3710', 6: '3666', 8: '3460', 10: '4477', 12: '60479'},
         'tile': {1: '3070b', 2: '3069b', 3: '63864', 4: '2431', 6: '6636', 8: '4162'}}
PART2 = {'plate': {2: '3022', 3: '3021', 4: '3020', 6: '3795', 8: '3034', 10: '3832', 12: '2445'},
         'tile': {2: '3068b', 3: '26603', 4: '87079', 6: '69729'},
         'brick': {2: '3003', 3: '3002', 4: '3001', 6: '2456', 8: '3007'}}
INNER = {'B0': DTAN, 'B1': DTAN, 'B2': TAN, 'B3': DRED, 'B4': AZURE, 'B5': DRED, 'P': RB, 'B6': TAN, 'B7': TAN, 'B8': TAN,
         'B9': TAN, 'P2': TAN, 'C': DTAN}
RAFTERS = (190, 250, 350, 410)

# griffins painted on the wall behind the throne (right wall, courses B4 down to B0 as rows; 8 cells from the far end toward the
# throne): . ground  b body  w wing (blue)  r wing (red)  h head  t tail  l leg
GRIFFIN = ['....ww..',
           '...www.h',
           'tbbbbbhh',
           't.bbbb..',
           '..l..l..']
GCOL = {'.': DRED, 'b': WHITE, 'w': AZURE, 'h': WHITE, 't': WHITE, 'l': WHITE}
PORCH_I = (-39, -31)     # the porch (aithousa) before the great doors, open at its far end between two columns
COURT_I = (-47, -40)     # the court beyond it, walled low, its gate shut
PORCH_COLS = [(-760, -80), (-760, 80)]
LOW = ('B0', 'B1', 'B2', 'B3', 'CL')


def wall_rows():
    """every row of wall: (name, cells in order, along_x, face (normal, plane position) or None, part of the lift-off front wall?,
    a low court wall?)"""
    xs = list(range(PORCH_I[0], X1 + 1)); ks = list(range(-14, 14)); ps = list(range(PORCH_I[0], PORCH_I[1] + 1))
    cs = list(range(COURT_I[0] + 2, COURT_I[1] + 1))
    return [('back_out', [(i, -14) for i in xs], True, None, False, False),
            ('back_in', [(i, -13) for i in xs], True, ((0, 0, 1), -240), False, False),
            ('front_in', [(i, 12) for i in xs], True, ((0, 0, -1), 240), True, False),
            ('front_out', [(i, 13) for i in xs], True, None, True, False),
            ('left_out', [(-30, k) for k in range(-12, 12)], False, None, False, False),
            ('left_in', [(-29, k) for k in range(-12, 12)], False, ((1, 0, 0), -560), False, False),
            ('right_in', [(28, k) for k in ks], False, ((-1, 0, 0), 560), False, False),
            ('right_out', [(29, k) for k in ks], False, None, False, False),
            ('cback_a', [(i, -14) for i in cs], True, None, False, True),
            ('cback_b', [(i, -13) for i in cs], True, None, False, True),
            ('cfront_a', [(i, 12) for i in cs], True, None, False, True),
            ('cfront_b', [(i, 13) for i in cs], True, None, False, True),
            ('gate_out', [(COURT_I[0], k) for k in ks], False, None, False, True),
            ('gate_in', [(COURT_I[0] + 1, k) for k in ks], False, None, False, True)]
PAIRS = [('back_out', 'back_in'), ('front_in', 'front_out'), ('left_out', 'left_in'),
         ('right_in', 'right_out'), ('cback_a', 'cback_b'), ('cfront_a', 'cfront_b'), ('gate_out', 'gate_in')]


def griffin_cell(k, course):
    """the motif letter for a cell of the right wall's inner row, or None outside the two panels"""
    rowi = {'B4': 0, 'B3': 1, 'B2': 2, 'B1': 3, 'B0': 4}.get(course)
    if rowi is None: return None
    if -10 <= k <= -3: return GRIFFIN[rowi][k + 10]               # the griffin on the throne's -z side, facing it
    if 2 <= k <= 9: return GRIFFIN[rowi][9 - k]                   # mirrored on its +z side
    return None


def wall_colour(row, course, cell):
    """the colour of a cell of wall: an int, None (nothing there), ('snot', col) a brick with a stud on its face, ('force', col, id, n)
    one piece of n cells spanning a gap"""
    i, k = cell
    inner = row.endswith('_in')
    idx = i if row.startswith(('back', 'front', 'pfront', 'cback', 'cfront')) else k
    # the great doors: frames stand in the inner row, a clear doorway in the outer; a gap over the frames, the lintel above
    if row.startswith('left') and k in DOOR_K and course in ('B0', 'B1', 'B2', 'B3', 'B4', 'B5'): return None
    if row == 'left_in' and course == 'P' and k in DOOR_K: return None
    if row == 'left_out' and course == 'P' and -5 <= k <= 4: return ('force', RB, 'door-p', 10)
    if row == 'left_in' and course == 'B6' and -6 <= k <= 5: return ('force', TAN, 'door-lintel', 12)
    # the postern to the storeroom passage
    if row.startswith('front') and i in POSTERN_I and course in ('B0', 'B1', 'B2', 'B3'): return None
    if row.startswith('front') and course == 'B4' and POSTERN_I[0] - 1 <= i <= POSTERN_I[1] + 1:
        return ('force', RB, 'postern-' + row, 4)
    # Penelope's door at the stair head
    if row.startswith('back') and i in PEN_I and course in ('B6', 'B7', 'B8'): return None
    if row.startswith('back') and course == 'B9' and PEN_I[0] - 1 <= i <= PEN_I[1] + 1: return ('force', RB, 'pen-' + row, 4)
    # the court gate: two leaves of timber in the inner row, the outer row open; shut
    if row.startswith('gate') and -3 <= k <= 2:
        if course not in ('B0', 'B1', 'B2', 'B3'): return None if row == 'gate_out' else DTAN
        if row == 'gate_out': return None
        return ('force', RB, 'gate-%s-%d' % (course, k < 0), 3)
    # coping: studs left bare where a rafter or the porch beam rests
    if course == 'CL': return DTAN
    if inner:
        visible = (Z0 <= k <= Z1) if not row.startswith(('back', 'front', 'pfront')) else True
        if row == 'right_in' and griffin_cell(k, course) is not None: return ('snot', DRED)
        if course == 'B4' and visible and idx % 2 == 0 and not (row.startswith('back') and (i in STAIR_I or i in PEN_I)):
            return ('snot', AZURE)
        return INNER[course]
    # the outer face (and the court walls): squared stone in beds of tan and dark tan, timber in the plate course
    if course in ('P', 'P2', 'C'): return INNER[course] if course != 'C' else DTAN
    if course == 'B0': return DTAN
    n = int(course[1])
    return DTAN if ((idx + 60) // 5 + n) % 3 == 0 else TAN


def split(n, parity, lengths):
    """cut a run of n cells into piece lengths (from `lengths`), staggered by `parity`, never leaving a remainder no piece can fill"""
    out = []
    ok = lambda r: r == 0 or r >= min(lengths)
    if parity and n > 3 and 2 in lengths and ok(n - 2): out.append(2); n -= 2
    while n:
        cand = [l for l in sorted(lengths, reverse=True) if l <= n and ok(n - l) and not (n - l == 5 and 4 in lengths and 1 in lengths)]
        if not cand: cand = [l for l in sorted(lengths, reverse=True) if l <= n and ok(n - l)]
        if not cand: break
        out.append(cand[0]); n -= cand[0]
    return out


def place_run(col, kind, cells, along_x, yb, part_table, width=1, other=None):
    """one piece covering `cells` (consecutive along the row), width 1 or 2 (the second row `other` beside it)"""
    L = len(cells)
    part = part_table[L]
    xs = [c[0] for c in cells] + ([c[0] for c in other] if other else []); zs = [c[1] for c in cells] + ([c[1] for c in other] if other else [])
    x = (min(xs) + max(xs) + 1) / 2 * S; z = (min(zs) + max(zs) + 1) / 2 * S
    top = yb + H[kind]
    return put(col, x, top, z, part, None if along_x else RY(math.pi / 2))


def allowed(r, course): return (course in LOW) if r[5] else course != 'CL'


def build_walls(keep=lambda row: True, krange=None):
    """all the wall rows (those `keep` passes), course by course; returns rows of parts and the stud faces of the inner rows"""
    out, faces = [], []
    rows = {r[0]: r for r in wall_rows() if keep(r)}
    for ci, (course, yb, kind) in enumerate(COURSES):
        done = set()
        if kind in ('plate', 'tile'):                                          # 2-wide pieces tie the wall's two rows together
            for a, b in PAIRS:
                if a not in rows or b not in rows: continue
                A, B = rows[a], rows[b]
                if not (allowed(A, course) and allowed(B, course)): continue
                ca = [wall_colour(a, course, c) for c in A[1]]; cb = [wall_colour(b, course, c) for c in B[1]]
                idx = [n for n in range(len(A[1])) if (krange is None or krange(A[1][n])) and isinstance(ca[n], int) and ca[n] == cb[n]]
                segs, cur = [], []
                for n in idx:
                    if cur and (n != cur[-1] + 1 or ca[n] != ca[cur[-1]]): segs.append(cur); cur = []
                    cur.append(n)
                if cur: segs.append(cur)
                for sg in segs:
                    lens = sorted(PART2[kind], reverse=True)
                    pos = 0
                    for L in (split(len(sg), ci % 2, lens) if len(sg) > 1 else []):
                        ns = sg[pos:pos + L]; pos += L
                        out.append(place_run(ca[ns[0]], kind, [A[1][n] for n in ns], A[2], yb, PART2[kind], 2, [B[1][n] for n in ns]))
                        done |= {(a, n) for n in ns} | {(b, n) for n in ns}
        for name, cells, along_x, face, _, low in rows.values():
            if not allowed(rows[name], course): continue
            cols = [wall_colour(name, course, c) for c in cells]
            n = 0
            while n < len(cells):
                c = cols[n]
                if (name, n) in done or c is None or (krange and not krange(cells[n])): n += 1; continue
                if isinstance(c, tuple) and c[0] == 'force':
                    m = n
                    while m < len(cells) and cols[m] == c: m += 1
                    out.append(place_run(c[1], kind, cells[n:m], along_x, yb, PART1[kind])); n = m; continue
                if isinstance(c, tuple) and c[0] == 'snot':
                    i, k = cells[n]
                    (nx, ny, nz), plane = face
                    rot = {(0, 1): math.pi, (0, -1): 0, (1, 0): -math.pi / 2, (-1, 0): math.pi / 2}[(nx, nz)]
                    out.append(put(c[1], cx(i), yb + 24, cx(k), '87087', RY(rot)))
                    faces.append((name, course, cells[n], face, yb + 24 - 10))
                    n += 1; continue
                m = n
                while m < len(cells) and cols[m] == c and (name, m) not in done and not (krange and not krange(cells[m])): m += 1
                pos = n
                for L in split(m - n, (ci + (0 if along_x else 1)) % 2, sorted(PART1[kind], reverse=True)[2:] if kind != 'tile' else [8, 6, 4, 3, 2, 1]):
                    out.append(place_run(c, kind, cells[pos:pos + L], along_x, yb, PART1[kind])); pos += L
                n = m
    return out, faces


def face_row(col, face, cell, yc, part, lift=0):
    """a tile or plate on a side stud of the wall face: `part` with its underside on the face at (cell, height yc)"""
    (nx, ny, nz), plane = face
    i, k = cell
    m = {(0, 1): RX(-math.pi / 2), (0, -1): RX(math.pi / 2), (1, 0): RZ(math.pi / 2), (-1, 0): RZ(-math.pi / 2)}[(nx, nz)]
    x = plane if nx else cx(i); z = plane if nz else cx(k)
    x += nx * lift; z += nz * lift
    return row(col, mat_mul(T(x, -yc, z), m), part)


def frescoes(faces):
    """the running spirals of the blue band (white swirls on the side studs) and the two griffins behind the throne (tiles)"""
    out = []
    for name, course, cell, face, yc in faces:
        if name == 'right_in' and griffin_cell(cell[1], course) is not None:
            out.append(face_row(GCOL[griffin_cell(cell[1], course)], face, cell, yc, '3070b', 8))
        else:
            out.append(face_row(WHITE, face, cell, yc, '15470', 0))
    return out


# ── the great doors and the sill ──
def doors():
    """two Door 1 x 4 x 6 frames side by side in the inner row of the left wall, their leaves shut, meeting in the middle"""
    out = []
    for fz, hinge, turn in ((-40, 32, math.pi), (40, -32, 0)):
        fm = mat_mul(T(-570, -(4 + 144), fz), RY(math.pi / 2))
        out.append(row(RB, fm, '60596'))
        out.append(row(RB, mat_mul(mat_mul(fm, T(hinge, 0, 5)), RY(turn)), '60616a'))
    return out


def sill():
    """the stone sill inside the doors, one plate proud of the floor (a plate 4 x 10), tiled; two studs bare where the archer stands"""
    out = [put(LBG, -520, 12, 0, '3030', RY(math.pi / 2))]
    cells = {(i, k) for i in range(-28, -24) for k in range(-5, 5)}
    out += fill(cells - ODY_FEET, lambda i, k: LBG if (i + k) % 3 else PLG if False else LBG, 12)
    return out, cells


# ── the axe line and the arrow ──
def axe_line(with_arrow=True):
    """a trench of stamped earth three studs wide down the spine; the twelve iron heads set in it, their sockets on one axis; the
    arrow (a Technic axle 32L) through all twelve, its bronze point past the last, its fletching (two bushes) behind the first"""
    out, occ = [], set()
    ti0, ti1 = round(HEADS[0] / S) - 3, round(HEADS[-1] / S) + 2          # trench cells along x
    heads = {round((h - 10) / S) for h in HEADS}
    for i in range(ti0, ti1 + 1):
        for k in (-2, -1, 0):
            occ.add((i, k))
    for h in HEADS:
        out.append(put(PDG, h, 28, SPINE, '6541', RY(math.pi / 2)))           # the socket: pin hole along x
        out.append(on(PDG, h, 28, SPINE, '49307', math.pi / 2))                # the upper blade's edge
    # the earth between them: tiles (dark brown) in the middle row, reddish brown either side
    for k, col in ((-2, RB), (0, RB)):
        out += tile_run(col, ti0 * S, k * S, ti1 - ti0 + 1, 4)
    run = []
    for i in range(ti0, ti1 + 2):
        if i <= ti1 and i not in heads: run.append(i); continue
        if run: out += tile_run(DB, run[0] * S, -1 * S, len(run), 4)
        run = []
    if with_arrow:
        out += arrow()
    return out, occ


def arrow():
    out = [put(TAN, AXLE_C, 18, SPINE, '50450')]
    tip = AXLE_C + 319.5
    out.append(row(GOLD, mat_mul(T(tip - 6 + 24, -18, SPINE), RZ(math.pi / 2)), '4589'))           # the bronze point, on the axle's end
    tail = AXLE_C - 319.5
    out.append(row(WHITE, mat_mul(T(tail + 5, -18, SPINE), RY(math.pi / 2)), '32123b'))           # the fletching: two bushes
    out.append(row(RED, mat_mul(T(tail + 15, -18, SPINE), RY(math.pi / 2)), '32123b'))
    return out


# ── the hearth, the columns, the lantern ──
def hearth():
    """the round clay hearth, ten studs across: a disc of plates; its rim a ring of white plaster one brick high, painted on top with
    red and blue; inside, the bed of ash and the fire raked flat, embers glowing and two low flames"""
    hx, hz = HEARTH
    cells = [(i, k) for i in range(-10, 30) for k in range(-10, 10) if (cx(i) - hx) ** 2 + (cx(k) - hz) ** 2 <= 100 ** 2]
    rim = {c for c in cells if (cx(c[0]) - hx) ** 2 + (cx(c[1]) - hz) ** 2 > 72 ** 2}
    bed = [c for c in cells if c not in rim]
    out = []
    for k in sorted({c[1] for c in cells}):                                    # the clay disc: rows along x
        xs = sorted(c[0] for c in cells if c[1] == k)
        pos = xs[0]
        for L in split(len(xs), k % 2, [8, 6, 4, 3, 2, 1]):
            out.append(put(RB, (pos + L / 2) * S, 12, cx(k), PART1['plate'][L])); pos += L
    for i in sorted({c[0] for c in bed}):                                       # the bed: rows along z, ash
        ks = sorted(c[1] for c in bed if c[0] == i)
        pos = ks[0]
        for L in split(len(ks), i % 2, [8, 6, 4, 3, 2, 1]):
            out.append(put(DBG, cx(i), 20, (pos + L / 2) * S, PART1['plate'][L], RY(math.pi / 2))); pos += L
    flames = {(14, -1), (15, 0)}
    for (i, k) in bed:
        r = math.hypot(cx(i) - hx, cx(k) - hz)
        if (i, k) in flames:
            out += [put(TORANGE, cx(i), 44, cx(k), '3062b'), row(TORANGE if i % 2 else TYELLOW, T(cx(i), -44, cx(k)), '37775')]
            continue
        ember = (i * 7 + k * 3) % 4 == 0 and r < 55
        out.append(put(TORANGE if ember else (BLK if (i * 3 + k) % 4 else DBG), cx(i), 28, cx(k), '98138' if ember else '3070b'))
    for (i, k) in rim:                                                           # the rim: white plaster, painted on top
        a = math.atan2(cx(k) - hz, cx(i) - hx)
        n = int((a + math.pi) / (2 * math.pi) * 28)
        out.append(put(WHITE, cx(i), 36, cx(k), '3005'))
        out.append(put((DRED, WHITE, AZURE, WHITE)[n % 4], cx(i), 44, cx(k), '3070b'))
    return out, set(cells)


def column(x, z):
    """a Minoan column: a stone foot (a 2 x 2 round plate), an inverted cone plugged into its hole so the shaft narrows downward, red
    round bricks, a black cushion capital and a square abacus; its top at 248"""
    out = [put(LBG, x, 12, z, '4032a'),                    # the stone foot
           put(RED, x, 56, z, '49309')]                     # the shaft narrowing to its foot: its stud in the foot's hole
    for n in range(6): out.append(put(RED, x, 80 + 24 * n, z, '3941'))
    out += [put(BLK, x, 224, z, '3941'), put(BLK, x, 232, z, '60474'), put(DTAN, x, 240, z, '3031'), put(DTAN, x, 248, z, '3031')]
    return out


def lantern():
    """the clerestory: beams on the four columns, a ring of short posts with the light between them, a narrow roof round the smoke
    hole"""
    out = []
    for z in (-160, 160): out.append(put(RB, 300, 256, z, '4282'))                       # beams along x on the capitals
    for x in (140, 460): out.append(put(RB, x, 264, 0, '4282', RY(math.pi / 2)))         # and across, on them
    for x, z in [(140, -160), (140, 160), (460, -160), (460, 160), (140, 0), (460, 0)]:
        out.append(put(RB, x, 288, z, '3003'))
    for z in (-160, 160):
        out += [put(RB, 300, 264, z, '3022'), put(RB, 300, 288, z, '3003')]
    for z in (-160, 160):                                                                 # the roof ring, 2 studs wide
        out += [put(DTAN, 220, 296, z, '3832'), put(DTAN, 400, 296, z, '3034')]
    for x in (140, 460):
        out.append(put(DTAN, x, 296, 0, '91988', RY(math.pi / 2)))
    ring = [(i, k) for i in range(6, 24) for k in range(-9, 9) if not (8 <= i < 22 and -7 <= k < 7)]
    out += fill(ring, lambda i, k: DTAN, 296)
    # tiles on every stud the beams and capitals leave bare
    cell = lambda x0, x1, z0, z1: {(i, k) for i in range(round(x0 / S), round(x1 / S)) for k in range(round(z0 / S), round(z1 / S))}
    xbeam = cell(140, 460, -180, -140) | cell(140, 460, 140, 180)
    zbeam = cell(120, 160, -160, 160) | cell(440, 480, -160, 160)
    for x, z in COLS:
        out += fill(cell(x - 40, x + 40, z - 40, z + 40) - xbeam, lambda i, k: DTAN, 248)
    posts = set()
    for x, z in [(140, -160), (140, 160), (460, -160), (460, 160), (140, 0), (460, 0), (300, -160), (300, 160)]:
        posts |= cell(x - 20, x + 20, z - 20, z + 20)
    out += fill(xbeam - zbeam - posts, lambda i, k: RB, 256)
    out += fill(zbeam - posts, lambda i, k: RB, 264)
    return out


# ── the throne ──
def throne():
    """the throne at the right end, facing the doors: a dais (a plate 4 x 6), a stone chair with a cushion, arms and a high curved
    back, a footstool before it; the rest of the dais tiled"""
    out = [put(LBG, 520, 12, 0, '3032', RY(math.pi / 2))]                          # the dais: x 480..560, z -60..60
    dais = {(i, k) for i in range(24, 28) for k in range(-3, 3)}
    chair = {(i, k) for i in (25, 26) for k in (-1, 0)}
    arms = {(25, -2), (25, 1)}
    stool = {(24, -1), (24, 0)}
    out += [put(WHITE, 520, 36, 0, '3003'),                                            # the seat
            put(DRED, 510, 44, 0, '3069b', RY(math.pi / 2)),                           # its cushion
            put(WHITE, 530, 60, 0, '3004', RY(math.pi / 2)), put(WHITE, 530, 84, 0, '3004', RY(math.pi / 2)),
            put(WHITE, 530, 116, 10, '6091')]                                          # the back, its top curved
    out += [put(WHITE, 510, 36, -30, '3005'), put(WHITE, 510, 36, 30, '3005'),          # the arms
            put(WHITE, 510, 44, -30, '3070b'), put(WHITE, 510, 44, 30, '3070b')]
    out += [put(RB, 490, 20, 0, '3023', RY(math.pi / 2)), put(DRED, 490, 28, 0, '3069b', RY(math.pi / 2))]   # the footstool
    out += fill(dais - chair - arms - stool, lambda i, k: LBG, 12)
    return out, dais


# ── tables and benches ──
def table(x, z, food=True):
    """a suitors' table 2 x 6 along x centred on (x, z): round legs, a plank top, the feast on it (cups, dishes, bread, meat)"""
    out = []
    for dx in (-50, 50):
        for dz in (-10, 10):
            out += [put(RB, x + dx, 28, z + dz, '3062b'), put(RB, x + dx, 52, z + dz, '3062b')]
    out.append(put(RB, x, 60, z, '3795'))
    if food:
        out += [put(WHITE, x - 20, 68, z, '4150'),                                                    # a dish, a joint of meat on it
                row(RB, mat_mul(T(x - 20, -76, z), RY(0.4)), '33057'),
                put(TAN, x + 10, 68, z - 10, '98138'), put(DTAN, x + 10, 68, z + 10, '98138'),        # loaves
                put(RB, x + 30, 68, z, '3069b', RY(math.pi / 2)), put(RB, x - 50, 68, z - 10, '3070b'), put(RB, x + 50, 68, z + 10, '3070b'),
                put(GOLD, x + 50, 100, z - 10, '2343'), put(PLG, x - 50, 84, z + 10, '3899')]         # a goblet, a cup
    else:
        out += [put(RB, x - 30, 68, z, '2431'), put(RB, x + 30, 68, z, '2431')]
    return out


def bench(x, z, n=6, seats=()):
    """a bench of one brick 1 x n (reddish brown) along x centred on (x, z); tiles where no one sits; `seats` the stud columns kept
    bare (0-based from the left) for seated figures (two each)"""
    out = [put(RB, x, 28, z, PART1['brick'][n])]
    bare = set()
    for s in seats: bare |= {s, s + 1}
    free = [j for j in range(n) if j not in bare]
    run = []
    for j in range(n + 1):
        if j < n and j in free: run.append(j); continue
        if run: out += tile_run(RB, x - n * 10 + run[0] * S, z - 10, len(run), 28)
        run = []
    return out


def seated(card, sub, x, yup, z, rot=0):
    """a minifigure from a card sitting on the studs at yup: legs swung forward at the hip, the hip over (x, z)"""
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    bl = next((b for b in re.split(r'(?m)^0 FILE ', text) if b.startswith(f'{card} - {sub}.ldr')), '')
    body = [l.split() for l in bl.splitlines() if l.startswith('1 ')]
    hip = next(t for t in body if re.match(r'3815', t[14]))
    hx, hy, hz = float(hip[2]), float(hip[3]), float(hip[4])
    rows = []
    for t in body:
        m = [float(v) for v in t[2:14]]
        if re.match(r'381[67]', t[14]):
            m = mat_mul(m, RX(-math.pi / 2))                     # the legs forward
        rows.append((int(t[1]), m, t[14]))
    # the seat: legs' underside (after the swing) on the studs; the hip joint 12 below the hip's top in the card's own frame
    base = mat_mul(T(x, -(yup + 20), z), RY(rot))
    base = mat_mul(base, T(-hx, -(hy + 12), -hz - 10))
    return [row(c, mat_mul(base, m), p) for c, m, p in rows]


# ── the stair ──
def stair():
    """six steps along the back wall (2 studs deep), rising toward the throne end to a landing before Penelope's door"""
    out, occ = [], set()
    for j, i in enumerate(STAIR_I, 1):
        for h in range(j):
            out.append(put(DTAN if (h + j) % 2 else TAN, cx(i), 28 + 24 * h, -220, '3004', RY(math.pi / 2)))
        out.append(put(TAN, cx(i), 4 + 24 * j + 8, -220, '3069b', RY(math.pi / 2)))
        occ |= {(i, -12), (i, -11)}
    for h in range(6): out.append(put(DTAN if h % 2 else TAN, 300, 28 + 24 * h, -220, '3003'))
    out.append(put(TAN, 300, 156, -220, '3022'))
    out.append(put(TAN, 300, 164, -210, '3069b'))                                       # the landing's front row tiled; Penelope on the back
    occ |= {(i, k) for i in PEN_I for k in (-12, -11)}
    return out, occ


# ── the floor ──
def floor(occ, i_range, k_range, yup=4):
    """the painted floor: squares four studs across in tan and dark tan, laid in 2 x 2 tiles, smaller tiles round what stands on it"""
    out, done = [], set(occ)
    def col(i, k):
        a, b = (i - X0) // 4, (k - Z0) // 4
        if a == 12 and b in (2, 3): return DRED                                      # the painted square before the throne
        return TAN if (a + b) % 2 else DTAN
    for i in range(i_range[0], i_range[1] + 1):
        for k in range(k_range[0], k_range[1] + 1):
            if (i, k) in done: continue
            c = col(i, k)
            if (i - X0) % 2 == 0 and (k - Z0) % 2 == 0 and i + 1 <= i_range[1] and k + 1 <= k_range[1] and \
                    all(q not in done and col(*q) == c for q in ((i + 1, k), (i, k + 1), (i + 1, k + 1))):
                out.append(put(c, (i + 1) * S, yup + P, (k + 1) * S, '3068b')); done |= {(i, k), (i + 1, k), (i, k + 1), (i + 1, k + 1)}
            elif i + 1 <= i_range[1] and (i + 1, k) not in done and col(i + 1, k) == c:
                out.append(put(c, (i + 1) * S, yup + P, cx(k), '3069b')); done |= {(i, k), (i + 1, k)}
            elif k + 1 <= k_range[1] and (i, k + 1) not in done and col(i, k + 1) == c:
                out.append(put(c, cx(i), yup + P, (k + 1) * S, '3069b', RY(math.pi / 2))); done |= {(i, k), (i, k + 1)}
            else:
                out.append(put(c, cx(i), yup + P, cx(k), '3070b')); done.add((i, k))
    return out


def feet(x, z, rot):
    """the two stud squares a standing figure's feet take"""
    if abs(math.sin(rot)) > 0.5: return {(math.floor(x / S), math.floor((z - 10) / S)), (math.floor(x / S), math.floor((z + 10) / S))}
    return {(math.floor((x - 10) / S), math.floor(z / S)), (math.floor((x + 10) / S), math.floor(z / S))}


def fill(cells, colf, yup):
    """tiles over the studded cells at yup: 2 x 2 where four cells of one colour meet on the even grid, then 1 x 2, then 1 x 1"""
    out, done = [], set()
    cells = set(cells)
    for (i, k) in sorted(cells):
        if (i, k) in done: continue
        c = colf(i, k)
        quad = ((i + 1, k), (i, k + 1), (i + 1, k + 1))
        if i % 2 == 0 and k % 2 == 0 and all(q in cells and q not in done and colf(*q) == c for q in quad):
            out.append(put(c, (i + 1) * S, yup + P, (k + 1) * S, '3068b')); done |= {(i, k), *quad}
        elif (i + 1, k) in cells and (i + 1, k) not in done and colf(i + 1, k) == c:
            out.append(put(c, (i + 1) * S, yup + P, cx(k), '3069b')); done |= {(i, k), (i + 1, k)}
        elif (i, k + 1) in cells and (i, k + 1) not in done and colf(i, k + 1) == c:
            out.append(put(c, cx(i), yup + P, (k + 1) * S, '3069b', RY(math.pi / 2))); done |= {(i, k), (i, k + 1)}
        else:
            out.append(put(c, cx(i), yup + P, cx(k), '3070b')); done.add((i, k))
    return out


def floor_col(i, k):
    a, b = (i - X0) // 4, (k - Z0) // 4
    if a == 12 and b in (2, 3): return DRED                                          # the painted square before the throne
    return TAN if (a + b) % 2 else DTAN


ACCENT = [DRED, AZURE, WHITE, DTAN, DRED, BLORANGE, AZURE]


def painted_floor(free):
    """the floor painted in squares four studs across: each square whole where nothing stands on it is a pinwheel of four 1 x 3
    tiles round a 2 x 2 tile of another colour (red, blue, white, ochre by turns); where something stands, plain tiles fill round it"""
    out, done = [], set()
    for a in range((X1 - X0 + 1) // 4):
        for b in range((Z1 - Z0 + 1) // 4):
            i0, k0 = X0 + 4 * a, Z0 + 4 * b
            sq = {(i, k) for i in range(i0, i0 + 4) for k in range(k0, k0 + 4)}
            if not sq <= free: continue
            base = TAN if (a + b) % 2 else DTAN
            acc = ACCENT[(a * 3 + b * 5) % len(ACCENT)]
            if acc == base: acc = WHITE
            y = 4 + P
            out += [put(base, (i0 + 1.5) * S, y, (k0 + 0.5) * S, '63864'), put(base, (i0 + 2.5) * S, y, (k0 + 3.5) * S, '63864'),
                    put(base, (i0 + 0.5) * S, y, (k0 + 2.5) * S, '63864', RY(math.pi / 2)),
                    put(base, (i0 + 3.5) * S, y, (k0 + 1.5) * S, '63864', RY(math.pi / 2)),
                    put(acc, (i0 + 2) * S, y, (k0 + 2) * S, '3068b')]
            done |= sq
    return out + fill(free - done, floor_col, 4)


def pave_col(i, k):
    return LBG if (i * 3 + k * 5) % 7 else DTAN


# ── the porch and the court ──
def porch():
    """the porch before the great doors, open at its far end between two columns under a timber beam; the beggar's bed of an
    ox-hide and fleeces where he lay the night before (XX.1-4)"""
    out, occ = [], set()
    for x, z in PORCH_COLS:
        out += column(x, z) + [put(DTAN, x, 256, z, '3022')]
        out += fill({(i, k) for i in range(round(x / S) - 2, round(x / S) + 2) for k in range(round(z / S) - 2, round(z / S) + 2)} -
                    {(i, k) for i in range(round(x / S) - 1, round(x / S) + 1) for k in range(round(z / S) - 1, round(z / S) + 1)},
                    lambda i, k: DTAN, 248)
        occ |= {(round(x / S) + a, round(z / S) + b) for a in (-1, 0) for b in (-1, 0)}
    out += [put(RB, -760, 264, 0, '3832', RY(math.pi / 2)), put(RB, -760, 272, 0, '3832', RY(math.pi / 2)),     # the lintel
            put(DTAN, -760, 280, -40, '69729', RY(math.pi / 2)), put(DTAN, -760, 280, 60, '87079', RY(math.pi / 2))]
    # the bed: an ox-hide (a reddish-brown plate 4 x 6) and fleeces on it (white round tiles, a white tile)
    out += [put(RB, -680, 12, 180, '3032'), put(WHITE, -700, 20, 180, '4150'), put(WHITE, -660, 20, 180, '4150'),
            put(TAN, -630, 20, 160, '3069b', RY(math.pi / 2)), put(TAN, -630, 20, 200, '3069b', RY(math.pi / 2))]
    hide = {(i, k) for i in range(-37, -31) for k in range(7, 11)}
    out += fill(hide - {(i, k) for i in range(-36, -32) for k in (8, 9)} - {(-32, k) for k in range(7, 11)}, lambda i, k: RB, 12)
    occ |= {(i, k) for i in range(-37, -31) for k in range(7, 11)}
    return out, occ


def court():
    """the court beyond the porch: its gate shut (XXI.389-391), the altar of Zeus of the court with a fire bowl on it"""
    out, occ = [], set()
    ax, az = -860, -140
    out += [put(LBG, ax, 28, az, '3001'), put(DTAN, ax, 52, az, '3001'), put(LBG, ax, 60, az, '3020'),
            put(WHITE, ax - 20, 68, az, '4150'), put(LBG, ax + 30, 68, az - 10, '3070b'), put(LBG, ax + 30, 68, az + 10, '3070b'),
            put(DRED, ax + 10, 68, az, '3069b', RY(math.pi / 2)), put(TORANGE, ax - 20, 76, az, '98138') if False else '']
    out = [r for r in out if r]
    occ |= {(i, k) for i in range(-45, -41) for k in (-8, -7)}
    return out, occ


def court_col(i, k): return DTAN if (i * 5 + k * 3) % 7 == 0 else TAN
def porch_col(i, k): return WHITE if (i + k) % 2 == 0 else LBG


# ── the people ──
ODY = (-530, 0, -math.pi / 2)                     # on the sill, facing down the hall
ODY_FEET = feet(ODY[0], ODY[1], ODY[2])
TEL = (-470, 80, -math.pi / 2)
STANDING = [('character.antinous', 'antinous', -150, 110, math.pi / 2),               # the cup in his hand, not yet understood
            ('ensemble.armed-suitors', 'suitor-2', -30, 150, math.pi / 2 + 0.0),
            ('ensemble.armed-suitors', 'suitor-4', 210, 110, math.pi / 2),
            ('ensemble.armed-suitors', 'suitor-5', 30, -110, math.pi / 2),
            ('ensemble.telemachus-eumaeus-and-philoetius', 'herdsman-1', -470, -100, -math.pi / 2),       # Eumaeus by the archer
            ('ensemble.telemachus-eumaeus-and-philoetius', 'herdsman-3', -360, 250, 0)]                  # Philoetius in the postern
BACK_TABLES = [(-320, [('ensemble.armed-suitors', 'suitor-1', 0), ('ensemble.armed-suitors', 'suitor-3', 4)]),
               (-140, [('ensemble.suitors', 'suitor-1', 0), ('ensemble.suitors', 'suitor-2', 4)]),
               (40, [('ensemble.the-suitors', 'suitor-1', 0), ('ensemble.the-suitors', 'suitor-2', 4)])]
FRONT_TABLES = [(-300, [('ensemble.suitors', 'suitor-3', 0)]), (-40, [('ensemble.the-suitors', 'suitor-3', 2)])]


def people():
    out = figure('character.odysseus-revealed', 'odysseus-revealed', ODY[0], 12, ODY[1], ODY[2])
    out += figure('character.telemachus', 'telemachus', TEL[0], 4, TEL[1], TEL[2])
    occ = set(feet(TEL[0], TEL[1], TEL[2]))
    for card, sub, x, z, rot in STANDING:
        out += figure(card, sub, x, 4, z, rot); occ |= feet(x, z, rot)
    out += figure('character.penelope', 'penelope', 300, 156, -230, math.pi)              # at the stair head, in her door
    return out, occ


def feast():
    """the suitors' tables: two against the back wall with benches, one in front; suitors seated at them"""
    out, occ = [], set()
    for x, sitters in BACK_TABLES:
        out += bench(x, -230, 6, [s for _, _, s in sitters]) + table(x, -180)
        occ |= {(i, -12) for i in range(round(x / S) - 3, round(x / S) + 3)}
        occ |= {(round((x + dx) / S - 0.5), round((-180 + dz) / S - 0.5)) for dx in (-50, 50) for dz in (-10, 10)}
        for card, sub, s in sitters:
            out += seated(card, sub, x - 60 + (s + 1) * S, 28, -230, math.pi)
    for x, sitters in FRONT_TABLES:
        out += bench(x, 210, 6, [s for _, _, s in sitters]) + table(x, 180)
        occ |= {(i, 10) for i in range(round(x / S) - 3, round(x / S) + 3)}
        occ |= {(round((x + dx) / S - 0.5), round((180 + dz) / S - 0.5)) for dx in (-50, 50) for dz in (-10, 10)}
        for card, sub, s in sitters:
            out += seated(card, sub, x - 60 + (s + 1) * S, 28, 210, 0)
    return out, occ


# ── the whole ──
def hall(front=True):
    rows = [put(DTAN, -320, 4, 0, '3811'), put(DTAN, 320, 4, 0, '3811'), put(DTAN, -800, 4, 0, '3857', RY(math.pi / 2))]
    fr, fcells = frame(-960, -320, 80, 32)
    walls, faces = build_walls(keep=lambda r: front or not r[4])
    rows += fr + walls + frescoes(faces) + doors()
    occ = set()
    for name, cells, *_ in wall_rows(): occ |= set(cells)
    for part in (sill(), axe_line(), hearth(), throne(), stair(), feast(), people(), porch(), court()):
        rows += part[0]; occ |= part[1]
    for x, z in COLS:
        rows += column(x, z); occ |= {(round(x / S) + a, round(z / S) + b) for a in (-1, 0) for b in (-1, 0)}
    rows += lantern()
    hallf = {(i, k) for i in range(X0, X1 + 1) for k in range(Z0, Z1 + 1)}
    porchf = {(i, k) for i in range(PORCH_I[0], PORCH_I[1] + 1) for k in range(Z0, Z1 + 1)}
    courtf = {(i, k) for i in range(COURT_I[0] + 2, COURT_I[1] + 1) for k in range(Z0, Z1 + 1)}
    rows += painted_floor(hallf - occ) + fill(porchf - occ, porch_col, 4) + fill(courtf - occ, court_col, 4)
    rest = {(i, k) for i in range(-48, 32) for k in range(-16, 16)} - occ - fcells - hallf - porchf - courtf
    rows += fill(rest, pave_col, 4)
    return rows


def sub_axes():
    """the bow and the axe line: the sill, the trench, the twelve heads, the arrow through them; the archer, his son, the swineherd"""
    rows = [put(DTAN, -240, 4, 0, '3857'), put(DTAN, 240, 4, 0, '3867')]
    occ = set()
    for part in (sill(), axe_line()):
        rows += part[0]; occ |= part[1]
    rows += figure('character.odysseus-revealed', 'odysseus-revealed', ODY[0], 12, ODY[1], ODY[2])
    rows += figure('character.telemachus', 'telemachus', TEL[0], 4, TEL[1], TEL[2]); occ |= feet(*TEL)
    e = STANDING[4]
    rows += figure(e[0], e[1], e[2], 4, e[3], e[4]); occ |= feet(e[2], e[3], e[4])
    region = {(i, k) for i in range(-28, 20) for k in range(-8, 8)}
    return rows + painted_floor(region - occ)


def sub_hearth():
    """the hearth with its four columns and the clerestory over it"""
    rows = [put(DTAN, 300, 4, 0, '3811')]
    part = hearth(); rows += part[0]; occ = set(part[1])
    for x, z in COLS:
        rows += column(x, z); occ |= {(round(x / S) + a, round(z / S) + b) for a in (-1, 0) for b in (-1, 0)}
    rows += lantern()
    region = {(i, k) for i in range(-1, 31) for k in range(-16, 16)}
    return rows + painted_floor(region - occ)


def sub_throne():
    """the throne on its dais before the end wall, the griffins painted either side of it"""
    rows = [put(DTAN, 480, 4, 0, '3857', RY(math.pi / 2))]
    walls, faces = build_walls(keep=lambda r: r[0] in ('right_in', 'right_out'))
    rows += walls + frescoes(faces)
    part = throne(); rows += part[0]; occ = set(part[1])
    occ |= {(i, k) for i in (28, 29) for k in range(-14, 14)}
    region = {(i, k) for i in range(16, 28) for k in range(-12, 12)}
    rows += painted_floor(region - occ)
    rows += fill({(i, k) for i in range(16, 32) for k in range(-16, 16)} - region - occ, pave_col, 4)
    return rows


def sub_table():
    """a suitors' table against the back wall: the bench, the feast, two suitors at their wine"""
    rows = [put(DTAN, -320, 4, -160, '3867')]
    walls, faces = build_walls(keep=lambda r: r[0] in ('back_in', 'back_out'), krange=lambda c: -24 <= c[0] <= -9)
    rows += walls + frescoes(faces)
    x, sitters = BACK_TABLES[0]
    rows += bench(x, -230, 6, [s for _, _, s in sitters]) + table(x, -180)
    occ = {(i, -12) for i in range(round(x / S) - 3, round(x / S) + 3)}
    occ |= {(round((x + dx) / S - 0.5), round((-180 + dz) / S - 0.5)) for dx in (-50, 50) for dz in (-10, 10)}
    occ |= {(i, k) for i in range(-24, -8) for k in (-14, -13)}
    for card, sub, s_ in sitters:
        rows += seated(card, sub, x - 60 + (s_ + 1) * S, 28, -230, math.pi)
    region = {(i, k) for i in range(-24, -8) for k in range(-12, 0)}
    rows += painted_floor(region - occ)
    rows += fill({(i, k) for i in range(-24, -8) for k in range(-16, 0)} - region - occ, pave_col, 4)
    return rows


SUBS = [('axes', 'The bow and the axe line', sub_axes), ('hearth', 'The hearth, the columns and the clerestory', sub_hearth),
        ('throne', 'The throne and the griffins', sub_throne), ('table', "A suitors' table", sub_table)]


if __name__ == '__main__':
    n = write('set.bow-and-hall', 'The Bow and the Hall', hall())
    n2 = write('set.bow-and-hall-open', 'The Bow and the Hall (the front wall lifted away)', hall(front=False))
    print('set.bow-and-hall', n, 'pieces; open', n2, '(front wall', n - n2, ')')
    for key, title, fn in SUBS:
        print('set.bow-and-hall-' + key, write('set.bow-and-hall-' + key, 'The Bow and the Hall: ' + title.lower(), fn()), 'pieces')
    for nm in ['set.bow-and-hall', 'set.bow-and-hall-open'] + ['set.bow-and-hall-' + k for k, _, _ in SUBS]:
        check(nm)
