#!/usr/bin/env python3
"""tools/forage/product/kits/penelopes-loom.py — PENELOPE'S LOOM (Odyssey II, XIX, XXIV), a Medium kit of the Odyssey line.

  python3 tools/forage/product/kits/penelopes-loom.py      -> odyssey/cards/set.penelopes-loom*.mpd, odyssey/kits/penelopes-loom/kit.json

The moment: night in the upper chamber. By torchlight Penelope unpicks the web she wove by day, Laertes's shroud, while a maid at the
door at the head of the stair watches her: the maid who will tell the suitors.

The model: the upper room raised on a storey of stone, reached by a stone stair from the court. Plastered walls with a fresco band, a
window full of the night sky, the torch in its stand, a chest of wool and a basket. The object is the warp-weighted loom against the back
wall: two uprights, the cloth-beam across them, and the shroud hanging from the beam on a single stud, so it turns: one face is the
woven linen with its border of red and gold, the other the loose warp she has undone. Under it the warp threads (bars) run down to a row
of clay loom-weights that hang free above the floor. The roof lifts off.
"""
import copy, math, os, re, sys, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *

SCR = '/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad/penelopes-loom'
os.makedirs(SCR, exist_ok=True)
tempfile.tempdir = SCR

SLUG = 'penelopes-loom'
BASE = 4
FLOOR_S = BASE + 4 * B                      # 100: the studs of the storey below, the chamber's floor level
FLOOR = FLOOR_S + P                         # 108: the face of the floor tiles
WALL_C = 8
WALL_TOP = FLOOR_S + WALL_C * B             # 292
CI0, CI1, CK0, CK1 = -7, 14, -7, 6          # the chamber block (walls included); open at the front
DOOR = (2, 3, 4)                            # the doorway in the left wall at the stair head (cells k), four courses
WIN = (11, 12)                              # the window in the back wall (cells i), courses 4..5
WIN2 = (-1, 0)                              # and one in the right wall (cells k)
# the loom
UP_L, UP_R, LK = 0, 10, -5                  # the uprights (cells i) and their row k
PAN = range(2, 9)                           # the shroud's cells i; its pivot is the middle one
PIVOT = 5
UP_N = 7                                    # round bricks in each upright, on a plate on the floor: top at 276
BEAM_Y = FLOOR + UP_N * B                   # 276: underside of the cloth-beam
PAN_TOP = BEAM_Y - P                        # 268: the shroud hangs under the pivot plate
PAN_BOT = PAN_TOP - 3 * B                   # 196


def hsh(*a):
    v = 0
    for q in a: v = (v * 131 + q * 7919 + 17) % 1000003
    return v


# ── the storey below: a stone block, hollow on pillars ──
def block(p):
    x, y, z = p
    i, k = math.floor(x / S), math.floor(z / S)
    return (-1, 'stone') if CI0 <= i <= CI1 and CK0 <= k <= CK1 and y < FLOOR_S else (1, 'air')


def colour(m, i, h, k):
    if h == 2: return RB                                                   # a course of timber laced through the stone
    a = (i + 2 * (h % 2)) // 3
    return DTAN if hsh(a, h, k // 4) % 3 == 0 else TAN


form = Form(y0=BASE, unit=B)
form.carve(block, range(CI0, CI1 + 1), range(0, 4), range(CK0, CK1 + 1))
form.hollow(side=1, up=1, pillar=3)


# ── walls: plaster with a fresco band ──
def fresco(q, c, fixed):
    if c == 5: return (MBLUE, RED, MBLUE, BLORANGE)[q % 4]                # the fresco band: blue and red, an ochre stop
    if c == 0: return DRED                                                 # a painted dado
    return WHITE


def lay(cells, c, along_x, fixed, col=fresco, yup0=FLOOR_S):
    out, runs, run = [], [], []
    for q in cells:
        if run and q != run[-1] + 1: runs.append(run); run = []
        run.append(q)
    if run: runs.append(run)
    band = c == 5
    for run in runs:
        q, first = run[0], True
        while q <= run[-1]:
            left = run[-1] - q + 1
            L = 1 if band else min(left, (2 if (c + fixed) % 2 else 3) if first else 4)
            if left - L == 1 and L > 2: L -= 1
            first = False
            part = {1: '3005', 2: '3004', 3: '3622', 4: '3010'}[L]
            mid, yup = (q + L / 2) * S, yup0 + (c + 1) * B
            cc = col(q, c, fixed)
            out.append(put(cc, mid, yup, (fixed + .5) * S, part) if along_x else put(cc, (fixed + .5) * S, yup, mid, part, RY(math.pi / 2)))
            q += L
    return out


def walls():
    out = []
    for c in range(WALL_C):
        back = [i for i in range(CI0 + (c % 2), CI1 + 1 - (c % 2)) if not (i in WIN and c in (4, 5))]
        out += lay(back, c, True, CK0)
        side = list(range(CK0 + 1 - (c % 2), CK1 + 1))
        out += lay([k for k in side if not (k in WIN2 and c in (4, 5))], c, False, CI1)
        if c == 4:                                                          # the lintel over the door
            out.append(put(TAN, (CI0 + .5) * S, FLOOR_S + 5 * B, (DOOR[0] + 2) * S, '3009', RY(math.pi / 2)))
            out += lay([k for k in side if not DOOR[0] - 1 <= k <= DOOR[0] + 4], c, False, CI0)
        else:
            out += lay([k for k in side if not (k in DOOR and c < 4)], c, False, CI0)
    # the night sky in the window: glass of trans dark blue, one star
    for c in (4, 5):
        out.append(put(TDBLUE, (WIN[0] + 1) * S, FLOOR_S + (c + 1) * B, (CK0 + .5) * S, '3065'))
        out.append(put(TDBLUE, (CI1 + .5) * S, FLOOR_S + (c + 1) * B, (WIN2[0] + 1) * S, '3065', RY(math.pi / 2)))
    # the wall tops: tiles, except where the roof beams bear
    out += tile_run(WHITE, CI0 * S, CK0 * S, CI1 - CI0 + 1, WALL_TOP)
    for fixed in (CI0, CI1):
        ks = [k for k in range(CK0 + 1, CK1 + 1) if k not in ROOF_BEAMS]
        run = []
        for k in ks + [None]:
            if run and (k is None or k != run[-1] + 1):
                out += tile_run(WHITE, fixed * S, run[0] * S, len(run), WALL_TOP, False); run = []
            if k is not None: run.append(k)
    return out


ROOF_BEAMS = (-4, -1, 2, 5)


def roof():
    """the roof that lifts off: beams from wall to wall, a deck of plates along them, tiles over it; the back beam lies on the back wall"""
    out = []
    y1 = WALL_TOP + P
    for kb in ROOF_BEAMS:
        q = CI0
        for L in (8, 8, 6):
            out.append(put(RB, (q + L / 2) * S, y1, (kb + .5) * S, {8: '3460', 6: '3666'}[L])); q += L
    y2 = y1 + P                              # the deck: its joints fall between the beams' joints, so it ties them
    cols = [(CI0, 1)] + [(i, 2) for i in range(CI0 + 1, CI1, 2)] + [(CI1, 1)]
    for i, w in cols:
        x = (i + w / 2) * S
        out += [put(DTAN, x, y2, (CK0 + 4) * S, '3034' if w == 2 else '3460', RY(math.pi / 2)),
                put(DTAN, x, y2, (CK0 + 11) * S, '3795' if w == 2 else '3666', RY(math.pi / 2))]
    y3 = y2 + P
    for i, w in cols:
        x = (i + w / 2) * S
        for k0, n in ((CK0, 4), (CK0 + 4, 4), (CK0 + 8, 4), (CK0 + 12, 2)):
            col = TAN if hsh(i // 2, k0) % 3 else DTAN
            part = {(2, 4): '87079', (2, 2): '3068b', (1, 4): '2431', (1, 2): '3069b'}[(w, n)]
            out.append(put(col, x, y3, (k0 + n / 2) * S, part, RY(math.pi / 2)))
    return out


# ── the floor ──
RESERVED = {(UP_L, LK), (UP_R, LK), (9, -4), (9, -3), (12, -4)} | {(i, k) for i in (10, 11) for k in (3, 4)} | \
           {(i, k) for i in (12, 13) for k in range(-2, 2)}


def floor():
    out = []
    cells = [(i, k) for i in range(CI0 + 1, CI1) for k in range(CK0 + 1, CK1 + 1) if (i, k) not in RESERVED]
    out += [put(DTAN, (i + .5) * S, FLOOR, (k + .5) * S, '3024') for (i, k) in sorted(RESERVED)]      # studs where something stands
    out.append(put(DTAN, (CI0 + .5) * S, FLOOR, (DOOR[1] + .5) * S, '3623', RY(math.pi / 2)))           # the threshold
    left = set(cells)
    for (i, k) in sorted(cells, key=lambda c: (c[1], c[0])):
        if (i, k) not in left: continue
        col = DTAN if hsh(i // 2, k // 2, 7) % 4 == 0 else TAN
        if i % 2 == 0 and k % 2 == 0 and all(c in left for c in ((i + 1, k), (i, k + 1), (i + 1, k + 1))):
            out.append(put(col, (i + 1) * S, FLOOR, (k + 1) * S, '3068b')); left -= {(i, k), (i + 1, k), (i, k + 1), (i + 1, k + 1)}
        elif (i + 1, k) in left:
            out.append(put(col, (i + 1) * S, FLOOR, (k + .5) * S, '3069b')); left -= {(i, k), (i + 1, k)}
        else:
            out.append(put(col, (i + .5) * S, FLOOR, (k + .5) * S, '3070b')); left.discard((i, k))
    return out


# ── the stair from the court, and the court ──
def stair():
    """four steps of stone up to the door, 3 studs wide; courses bonded crosswise; treads finished in tiles"""
    out = []
    for c in range(4):
        i0 = -15 + 2 * c
        yup = BASE + (c + 1) * B
        if c % 2 == 0:
            for k in DOOR:
                q = i0
                while q <= -8:
                    L = min(4, -8 - q + 1)
                    if -8 - q + 1 - L == 1 and L > 2: L -= 1
                    col = DTAN if hsh(q, k, c) % 3 == 0 else TAN
                    out.append(put(col, (q + L / 2) * S, yup, (k + .5) * S, {1: '3005', 2: '3004', 3: '3622', 4: '3010'}[L])); q += L
        else:
            for i in range(i0, -7):
                out.append(put(DTAN if hsh(i, c) % 3 == 0 else TAN, (i + .5) * S, yup, (DOOR[1] + .5) * S, '3622', RY(math.pi / 2)))
    for s_ in range(3):                                                     # the treads
        i0 = -15 + 2 * s_
        for k in DOOR: out.append(put(DTAN, (i0 + 1) * S, BASE + (s_ + 1) * B + P, (k + .5) * S, '3069b'))
    # the landing at the stair head: studs where the maid stands, tiles round her
    out += [put(DTAN, -8.5 * S, FLOOR, (DOOR[0] + 1) * S, '3023b', RY(math.pi / 2)), put(DTAN, -7.5 * S, FLOOR, (DOOR[0] + .5) * S, '3070b'),
            put(DTAN, -7.5 * S, FLOOR, (DOOR[1] + .5) * S, '3070b'), put(DTAN, -8 * S, FLOOR, (DOOR[2] + .5) * S, '3069b')]
    return out


def court():
    """the paving of the court round the stair, and a storage jar"""
    out, taken = [], {(i, k) for i in range(-15, -7) for k in DOOR} | {(i, k) for i in (-13, -12) for k in (-5, -4)}
    for i in range(-15, -7, 2):
        for k in list(range(-7, 2, 2)) + [5]:
            cs = {(i, k), (i + 1, k), (i, k + 1), (i + 1, k + 1)}
            if cs & taken: continue
            out.append(put(TAN if hsh(i, k) % 3 else DTAN, (i + 1) * S, BASE + P, (k + 1) * S, '3068b'))
    out += [put(DTAN, (i + .5) * S, BASE + P, (1 + .5) * S, '3070b') for i in range(-15, -7)]
    x, z = -12 * S, -4 * S
    out += [on(DORANGE, x, BASE, z, '3941'), on(DORANGE, x, BASE + B, z, '3941'), put(DORANGE, x, BASE + 2 * B + P, z, '4032a'),
            on(DORANGE, x - 10, BASE + 2 * B + P, z - 10, '3062b')]
    return out


# ── the loom ──
def loom(flipped=False):
    """the warp-weighted loom: two uprights of round bricks, the cloth-beam laid across them, the shroud hung from the beam on one
    stud so it turns, the warp running down on bars to the clay weights. flipped: the shroud turned to show the undone warp."""
    out, X = [], lambda i: (i + .5) * S
    zl = X(LK)
    for i in (UP_L, UP_R):
        out += [on(RB if n % 3 else DB, X(i), FLOOR + n * B, zl, '3062b') for n in range(UP_N)]
    out += [put(RB, (UP_L + 4) * S, BEAM_Y + P, zl, '3460'), put(RB, (UP_L + 9.5) * S, BEAM_Y + P, zl, '3623'),
            put(DB, (UP_L + 1.5) * S, BEAM_Y + 2 * P, zl, '3623'), put(DB, (UP_L + 7) * S, BEAM_Y + 2 * P, zl, '3460')]
    out += tile_run(RB, UP_L * S, LK * S, UP_R - UP_L + 1, BEAM_Y + 2 * P)
    out.append(put(TAN, X(PIVOT), BEAM_Y, zl, '3024'))                   # the pivot: one 1 x 1 plate, one stud: the shroud turns on it
    out += shroud(flipped)
    return out


def shroud(flipped=False):
    """two rows: the woven face (a linen field, a border of red and gold) and the warp face (loose threads, round bricks); a hem of tan
    over both at the top, rolled on the beam. Turned about the pivot, the rows change places."""
    out, X = [], lambda i: (i + .5) * S
    zw = X(LK + (-1 if flipped else 1))                                      # the woven row: toward the room, or toward the wall
    zt = X(LK)                                                               # the warp row is the pivot row
    zh = (LK + (0 if flipped else 1)) * S                                    # the hem spans both rows
    out += [put(TAN, (PAN[0] + 2) * S, PAN_TOP, zh, '3001'), put(TAN, (PAN[0] + 5.5) * S, PAN_TOP, zh, '3002')]
    M = (lambda i: i) if not flipped else (lambda i: 2 * PIVOT - i)       # turned about the pivot, cell i goes to 2 PIVOT - i
    y1, y0 = PAN_TOP - B, PAN_TOP - 2 * B
    # the woven face: the linen field (one long brick bridges the hem's joint), red edges; below it the border of red and gold
    for (i0, L), col in (((PAN[0], 1), DRED), ((PAN[0] + 1, 4), WHITE), ((PAN[0] + 5, 1), WHITE), ((PAN[-1], 1), DRED)):
        a_, b_ = sorted((M(i0), M(i0 + L - 1)))
        out.append(put(col, (a_ + b_ + 1) / 2 * S, y1, zw, {1: '3005', 4: '3010'}[L]))
    for n, i in enumerate(PAN):
        if i == PAN[-1]: out.append(put(WHITE, X(M(i)), y0, zw, '3062b'))            # the corner she is unpicking: a loose thread
        else: out.append(put((DRED, GOLD)[n % 2], X(M(i)), y0, zw, '3005'))
        for c, yup in ((1, y1), (0, y0)):                                      # the warp face: threads of round bricks
            out.append(put((WHITE, TAN, WHITE, LGRAY)[hsh(i, c) % 4], X(M(i)), yup, zt, '3062b'))
    # the warp: a bar from each thread down to its weight; the weights hang free (held by the bars, not by studs: their own anchor)
    for n, i in enumerate(PAN):
        wx = i if not flipped else 2 * PIVOT - i
        out.append(put(TAN, X(wx), PAN_BOT, zt, '3024'))
        out.append(row(TAN, T(X(wx), -(PAN_BOT - P + 4), zt), '87994'))
        out += root([put(MNOUGAT if n % 2 else DTAN, X(wx), PAN_BOT - P + 4 - 44, zt, '3062b')])
    return out


# ── the people and the things in the room ──
def posed(card, sub, x, yup, z, rot, arms=(0, 0), drop=()):
    """a figure from its card with its arms set anew about the shoulder pins (radians; negative raises an arm toward the face)"""
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    bl = next(b for b in re.split(r'(?m)^0 FILE ', text) if b.startswith(f'{card} - {sub}.ldr'))
    body = [l.split() for l in bl.splitlines() if l.startswith('1 ') and l.split()[-1].replace('.dat', '') not in drop]
    hip = next(t for t in body if t[14].startswith('3815'))
    tx, tz = float(hip[2]), float(hip[4])
    base = mat_mul(mat_mul(T(x, -yup, z), RY(rot)), T(-tx, -(float(hip[3]) + 40), -tz))
    out = [row(int(t[1]), mat_mul(base, [float(v) for v in t[2:14]]), t[14]) for t in body if not re.match(r'38(18|19|20)', t[14])]
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


def penelope(x=(9 + .5) * S, z=-3 * S, yup=FLOOR):
    """at the end of the web, facing it, her hands at the corner she is unpicking"""
    out, _ = posed('character.penelope-at-the-loom', 'penelope-at-the-loom', x, yup, z, math.pi / 2, (-1.2, -0.9), drop=('4332',))
    return out


def melantho(x=-8.5 * S, z=(DOOR[0] + 1) * S, yup=FLOOR):
    """the maid on the landing at the stair head, at the door, looking in"""
    out, _ = posed('character.melantho', 'melantho', x, yup, z, -math.pi / 2, (-0.3, 0), drop=('3899',))
    return out


def torch(x=(12 + .5) * S, z=(-4 + .5) * S, yup=FLOOR):
    """the torch in its stand: three round bricks, the torch in the top one's hollow stud, the flame on its head"""
    top = yup + 3 * B
    return [on(RB, x, yup, z, '3062b'), on(RB, x, yup + B, z, '3062b'), on(DB, x, yup + 2 * B, z, '3062b'),
            row(RB, mat_mul(T(x, -(top + 20), z), RX(math.pi / 2)), '3959'),
            row(TORANGE, T(x, -(top + 48), z), '37775')]                        # the flame, its pin in the torch's head


def basket(x=11 * S, z=4 * S, yup=FLOOR):
    """a basket of carded wool"""
    return [on(TAN, x, yup, z, '3941')] + [on(c, x + dx, yup + B, z + dz, '6141') for c, (dx, dz) in
                                            zip((WHITE, WHITE, LGRAY, MLAV), ((-10, -10), (10, -10), (-10, 10), (10, 10)))]


def chest(x=13 * S, z=0, yup=FLOOR):
    """the chest of wool against the wall: timber, a lid, fleeces heaped on it"""
    return [on(RB, x, yup, z, '3001', math.pi / 2), put(DB, x, yup + B + P, z, '3020', RY(math.pi / 2)),
            on(WHITE, x - 10, yup + B + P, z - 30, '6141'), on(WHITE, x + 10, yup + B + P, z - 30, '6141'),
            on(LGRAY, x - 10, yup + B + P, z - 10, '6141'), put(WHITE, x, yup + B + 2 * P, z + 20, '3068b')]


def base():
    rows, cells = frame(-320, -160, 32, 16, BASE)
    return [put(DBG, 0, BASE, 0, '3857')] + rows


def details(roofed=True, flipped=False):
    return base() + walls() + (roof() if roofed else []) + floor() + stair() + court() + loom(flipped) + penelope() + melantho() + \
        torch() + basket() + chest()


def sub_loom(flipped=False):
    """the loom on a slab of the floor, built on its own"""
    out = [put(DTAN, (UP_L + 4) * S, FLOOR, (LK + 1) * S, '3034'), put(DTAN, (UP_L + 9.5) * S, FLOOR, (LK + 1) * S, '3021')]
    return out + loom(flipped)


def sub_torch():
    """the torch in its stand and the basket of wool, on a slab of floor"""
    return [put(DTAN, 20, 12, 20, '3020')] + torch(x=-10, z=10, yup=12) + basket(x=40, z=20, yup=12)


if __name__ == '__main__':
    for _ in range(4):
        before = dict(form.vox)
        left = form.settle(colour, extra=lambda: details(True))
        if form.vox == before and not left: break
    stone = form.parts(colour)
    n = write('set.penelopes-loom', "Penelope's Loom", stone + details(True))
    n2 = write('set.penelopes-loom-open', "Penelope's Loom (the roof lifted off, the shroud turned)", stone + details(False, True))
    subs = [('loom', 'The loom with its shroud', sub_loom()), ('torch', 'The torch and the wool basket', sub_torch())]
    for sub, title, rows in subs: write(f'set.penelopes-loom-{sub}', f"Penelope's Loom: {title.lower()}", rows)
    print('set.penelopes-loom', n, 'pieces; open', n2, '; roof', n - n2)
    for nm in ['set.penelopes-loom', 'set.penelopes-loom-open'] + [f'set.penelopes-loom-{s_}' for s_, _, _ in subs]: check(nm)
    manifest(SLUG, title="Penelope's Loom", book='II', tier='Medium',
             moment='Night in the upper chamber: by torchlight Penelope unpicks the web she wove by day, while a maid at the door at the head '
                    'of the stair watches her, the maid who will tell the suitors.',
             quote='So we could see her working on her great web all day long, but at night she would unpick the stitches again by torchlight. '
                   '(Odyssey II, tr. Samuel Butler)',
             object='The shroud on a warp-weighted loom: two uprights, the cloth-beam across them, and the shroud hung from the beam on a single '
                    'stud, so it turns: one face the woven linen with its red and gold border, the other the loose warp she has undone. The warp runs '
                    'down on bars to a row of clay loom-weights that hang free above the floor. The roof lifts off.',
             builds=[{'card': 'set.penelopes-loom', 'title': "Penelope's Loom"},
                     {'card': 'set.penelopes-loom-open', 'title': 'The roof lifted off, the shroud turned to its undone face'}] +
                    [{'card': f'set.penelopes-loom-{s_}', 'title': t} for s_, t, _ in subs],
             images=[{'file': 'hero.jpg', 'caption': 'The upper chamber at the head of the stair, the maid on the landing, Penelope at the loom.',
                      'alt': 'A white-plastered LEGO room with a blue, red and ochre fresco band, raised on a stone storey, a stone stair up to its side door.'},
                     {'file': 'open.jpg', 'caption': 'The roof lifted off and the shroud turned: the warp she has undone faces the room.',
                      'alt': 'The chamber from above without its roof, the loom showing rows of pale round bricks for loose threads.'},
                     {'file': 'inside.jpg', 'caption': 'By torchlight: the woven face, its border of red and gold, a corner already undone; the weights hang free.',
                      'alt': 'Close view of a minifigure at a loom of round-brick uprights, a woven panel hanging from the beam and clay weights on bars below.'},
                     {'file': 'inside-2.jpg', 'caption': 'The maid at the door at the stair head, watching.',
                      'alt': 'A minifigure seen from behind in a doorway, looking into the chamber toward the loom.'},
                     {'file': 'loom.jpg', 'caption': 'The loom with its shroud, woven face out.', 'alt': 'The loom on its own, the woven panel facing front.'},
                     {'file': 'loom-back.jpg', 'caption': 'Turn the shroud on its stud and the undone warp faces out.', 'alt': 'The loom from behind, the thread face of the panel.'},
                     {'file': 'torch.jpg', 'caption': 'The torch in its stand and the basket of wool.', 'alt': 'A torch on a stand of round bricks beside a basket of wool.'}],
             features=['The shroud is two rows of bricks hung from a single 1 x 1 plate under the cloth-beam: it turns on that one stud, the woven row (a white field, red edges, a border of dark red and pearl gold) on one side and the warp row (round bricks in white, tan and grey) on the other.',
                       'The warp runs down from the shroud on bars to seven clay loom-weights (round bricks in dark tan and medium nougat) that hang free a plate above the floor.',
                       'The room is raised on a hollow storey of stone sculpted and settled with tools/forage/product/sculpt.py, a course of timber laced through it; a stone stair of four bonded steps climbs from the court to the landing at the door.',
                       'Plastered walls in running bond with a painted dado and a fresco band of blue, red and ochre; two windows glazed in trans dark blue for the night outside.',
                       'The roof is a separate assembly of beams, a deck laid so its joints cross the beams\' joints, and tiles: it lifts off whole.',
                       'Floors and treads are tiles; studs are left only where someone or something stands.'],
             subs=[{'file': f'set.penelopes-loom-{s_}.mpd', 'title': t, 'pieces': pieces(f'set.penelopes-loom-{s_}'), 'text': txt} for (s_, t, _), txt in zip(subs, (
                 'The uprights, the cloth-beam, the turning shroud, the warp and the weights, on a slab of floor.',
                 'The torch in its stand of round bricks, its flame pinned in the head, beside a basket of carded wool.'))],
             sources=['odyssey-halfworld/scenes/OD-B02-S02.mjs', 'odyssey-halfworld/assets/prop/laertess-shroud-and-loom.mjs',
                      'odyssey-halfworld/assets/location/upper-chamber-and-stair.mjs', 'odyssey-halfworld/scenes/_artifacts.mjs'],
             status='Built to the bar',
             next=['The loom-weights are held by their bars, which the checker does not see, so they are marked as their own anchor (kitlib.root); the bars and the flame pin are placed by hand.',
                   'The uprights stand vertical; a real warp-weighted loom leans against the wall.',
                   'The -open card shows two changes at once (roof off, shroud turned); a separate card for each state would be clearer.',
                   'Penelope reaches toward the web but holds no thread; the maid is seen mostly from behind.',
                   'The props.json looms (loomFull, loomHalf) were inspected and not used: their web is a fixed stack of 1 x 6 bricks and does not turn.'])

