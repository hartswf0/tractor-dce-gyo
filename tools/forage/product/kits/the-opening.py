#!/usr/bin/env python3
"""tools/forage/product/kits/the-opening.py — TELL ME OF THE MAN (Odyssey I), the flagship kit that opens the Odyssey line.

  python3 tools/forage/product/kits/the-opening.py    -> odyssey/cards/set.the-opening*.mpd, odyssey/kits/the-opening/kit.json

The moment, two worlds stacked in one vertical diorama and joined by a goddess coming down:

  ABOVE, on a round platform on a column of rock and cloud: Olympus. The gods in council in their bronze-floored hall on the peak
  (OD-B01-S01): Zeus on his throne on one side, Athena standing to answer him on the other, the assembly of gods on a bench behind, and
  at the centre the empty throne of Poseidon, marked with his trident, because he is away among the Ethiopians.
  BETWEEN: Athena's flight (OD-B01-S02): she binds on her golden sandals and darts down from the peaks; a trail of clear and golden
  round bricks steps down from the cloud bank to the ground, the goddess herself half way down it.
  BELOW, on the base: Ithaca (OD-B01-S03). The forecourt of Odysseus's palace: the suitors on the hides of the oxen they have killed,
  two of them at draughts; heralds at the wine-bowl by the porch; the smoke of the feast from the roof; Telemachus sitting among them,
  who first sees the stranger at the gate; and at the outer gate Athena again, as Mentes the Taphian, with a bronze spear. Round them the
  island: a road up from the harbour, olive terraces, dry-stone field walls, cypress and poplar, goats on a rocky knoll, the sea in the
  near corner with Mentes' black ship.

Seen from the front (+z), +x is on the LEFT of the picture (as in every kit of the line): Olympus stands at +x, the palace at -x.

The play feature: THE COUNCIL TURNS. The platform of Olympus is built on a 4 x 4 turntable (61485c01) on top of the column: turn it
and the whole hall, thrones, gods and all, comes round, from facing the viewer to looking down on Ithaca (set.the-opening-turned). The
Odyssey begins with exactly that turn: with Poseidon away, the gods turn their minds to Odysseus.
"""
import copy, math, os, re, sys, tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
from kitlib import mat_mul, row
from sculpt import cone
import clicks

SCR = '/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad/the-opening'
os.makedirs(SCR, exist_ok=True)
tempfile.tempdir = SCR

SLUG = 'the-opening'
GRASS = 4                                   # the baseplates' top
TREAD = GRASS + P                           # the top of the ground's tiles
TRED_ = 36                                  # trans red (wine)
PLG = 179                                   # flat silver
I_LO, I_HI, K_LO, K_HI = -23, 22, -15, 14   # cells inside the frame's white ring

# ── Olympus: the column, the turntable, the platform ──
CX, CZ = 300, -160                          # the turntable's centre
NH = 17                                     # brick courses of the column; its top at yup 412
TOPC = GRASS + NH * B                       # 412
TT_TOP = TOPC + 16                          # 428: the turntable's top
PLAT_R = 172                                # the platform's radius
FLOOR_O = TT_TOP + 3 * P                    # 452: the hall's floor (studs of the plates, tops of the tiles)

# ── the streak: Athena's flight, 2 x 2 round bricks stepping down one course and one stud at a time ──
N_STEPS = 15
STREAK_BOT = (20, -40)                      # the lowest step, at the stranger's feet by the gate
MOVES = ['x', 'z', 'x', 'x', 'z', 'x', 'z', 'x', 'x', 'z', 'x', 'z', 'x', 'z']   # going DOWN: +z (toward the viewer) or -x (toward the palace)


def streak_steps():
    """[(cx, cz, top yup)] from the top step (0) to the bottom (N-1)"""
    pos = [STREAK_BOT]
    for mv in reversed(MOVES):              # walk up from the bottom
        x, z = pos[-1]
        pos.append((x, z - 20) if mv == 'z' else (x + 20, z))
    pos.reverse()
    return [(x, z, GRASS + (N_STEPS - n) * B) for n, (x, z) in enumerate(pos)]


STEPS = streak_steps()


def step_cells(x, z): return {(i, k) for i in (x // S - 1, x // S) for k in (z // S - 1, z // S)}


# ── the palace ──
MEG_I, MEG_K = (-20, -7), (-15, -10)        # the megaron's walls (cells, inclusive)
DOOR_I = range(-15, -11)
WALL_C = 6                                  # courses of the megaron; its wall top at yup 148
MEG_TOP = GRASS + WALL_C * B
PORCH_K = (-9, -8)
COLS = [(-340, -160), (-180, -160)]         # the porch's two red columns (2 x 2 round)
COURT_I, COURT_K = (-22, -4), (-9, 2)       # the courtyard's paving
GATE_I, GATE_K = -3, range(-6, -2)          # the outer gate in the east wall
FRONT_K = 3

# ── the land ──
def _cove(i, k): return ((i + .5 - 24) / 17) ** 2 + ((k + .5 - 16) / 12.5) ** 2
SEA = lambda i, k: _cove(i, k) < 1
BEACH = lambda i, k: 1 <= _cove(i, k) < 1.3
ROAD_PTS = [(-1, -4), (0, -1), (1, 2), (3, 5), (5, 8), (6, 11), (6, 13)]


def on_road(i, k, w=1.25):
    x, z = i + .5, k + .5
    for (a, b), (c, d) in zip(ROAD_PTS, ROAD_PTS[1:]):
        dx, dz = c - a, d - b
        t = max(0, min(1, ((x - a) * dx + (z - b) * dz) / (dx * dx + dz * dz)))
        if math.hypot(x - a - t * dx, z - b - t * dz) < w: return True
    return False


def hsh(*a):
    v = 0
    for q in a: v = (v * 131 + q * 7919 + 17) % 1000003
    return v


# ────────────────────────────────────────────────────────────────── the sculpted land: column, clouds, terraces, knoll
STREAK_CELLS = set().union(*[step_cells(x, z) for x, z, _ in STEPS])
PALACE_CELLS = {(i, k) for i in range(-23, -2) for k in range(-15, 4)}


def terrace_h(i, k):
    """the olive terraces between the road and the mountain: bricks high"""
    if on_road(i, k, 2.0) or (i, k) in STREAK_CELLS or (i, k) in PALACE_CELLS: return 0
    if SEA(i, k) or BEACH(i, k): return 0
    if 2 <= i <= 16 and -4 <= k <= 5:
        lv = 1 if k >= 2 else 2 if k >= -1 else 3
        return min(lv, 1 if i <= 4 else 2 if i <= 6 else 3)
    return 0


def knoll(p):
    """the rocky knoll in the front right corner (-x), goats on it"""
    x, y, z = p
    d = ell(p, (-390, 0, 262), (110, 52, 78)) + rough(p, 8, 2.1)
    d = smin(d, ell(p, (-260, 0, 290), (70, 32, 48)) + rough(p, 6, 0.4), 30)
    return d


def column(p):
    x, y, z = p
    t = max(0.0, min(1.0, y / 230))
    R = 150 - 88 * (t * t * (3 - 2 * t))
    if y > 340: R -= (y - 340) * 0.25
    r = math.hypot((x - CX) / 1.0, (z - CZ) / 0.88)
    d = r - R + rough(p, 12, 0.7)
    d = smin(d, ell(p, (CX + 110, 40, CZ + 40), (80, 150, 70)) + rough(p, 8, 1.9), 40)     # a buttress on the far side
    for c, r, sd in (((CX - 70, 110, CZ + 70), (60, 34, 46), 0.3), ((CX + 60, 230, CZ + 60), (50, 30, 40), 1.1),
                     ((CX - 40, 300, CZ - 60), (44, 26, 40), 2.2)):                           # crags jutting from the column
        d = smin(d, ell(p, c, r) + rough(p, 6, sd), 26)
    return d


RINGS = {13: ((CX - 20, CZ + 5), 168, 138, 3.1), 7: ((CX + 10, CZ + 15), 138, 118, 5.3), 2: ((CX + 30, CZ - 10), 150, 118, 7.7)}    # course: centre, radii, seed


def in_ring(h, x, z):
    if h not in RINGS: return False
    (cx, cz), rx, rz, sd = RINGS[h]
    return ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 + 0.25 * math.sin(x / 23 + sd) * math.sin(z / 19 - sd) < 1


def hill(p):
    """the wooded shoulder of Neriton behind the gate"""
    return smin(ell(p, (20, 0, -285), (200, 140, 76)) + rough(p, 10, 4.4), ell(p, (-10, 0, -210), (60, 40, 40)), 30)


def peak2(p):
    """Olympus is a massif: a second, lower summit behind the first, white with snow"""
    return cone(p, (410, 0, -240), (400, 330, -250), 120, 16) + rough(p, 10, 2.7)


def world(p):
    x, y, z = p
    i, k = math.floor(x / S), math.floor(z / S)
    if not (I_LO <= i <= I_HI and K_LO <= k <= K_HI) or y > TOPC: return 99, 'air'
    if abs(x - CX) < 40 and abs(z - CZ) < 40: return -1, 'core'                                # the turntable's column
    c = min(column(p), peak2(p))
    if c <= 0: return c, ('snow' if y > (366 if column(p) <= 0 else 236) + 16 * math.sin(x / 31 + z / 23) else 'rock')
    hc = math.floor((y - GRASS) / B)
    if in_ring(hc, x, z) and (i, k) not in PALACE_CELLS and not terrace_h(i, k) and hill(p) > 0 and (i, k) not in STREAK_CELLS: return -1, 'cloud'
    if hill(p) <= 0 and (i, k) not in PALACE_CELLS and (i, k) not in STREAK_CELLS: return -1, 'hill'
    h = terrace_h(i, k)
    if y < GRASS + h * B: return -1, 'terrace'
    kn = knoll(p)
    if kn <= 0 and not SEA(i, k) and not on_road(i, k, 1.6) and (i, k) not in PALACE_CELLS: return kn, 'knoll'
    return 99, 'air'


def colour(m, i, h, k):
    if m in ('rock', 'core'):
        a, b = (i + 2 * (h % 2)) // 3, (k + 2 * (h % 2)) // 3
        if hsh(a, b, h // 2) % 6 == 0: return DTAN
        return LBG if hsh(a, b, h // 3, 4) % 8 == 0 else DBG
    if m in ('hill', 'hstand'):
        a, b = (i + (h % 2)) // 2, (k + (h % 2)) // 2
        return DB if hsh(a, b, h) % 5 == 0 else DTAN if hsh(a, b, h, 1) % 2 else OLIVE
    if m in ('snow', 'seat'):
        return LBG if hsh(i // 2, k // 2, h, 2) % 5 == 0 else WHITE
    if m == 'cloud':
        v = hsh(i // 2, k // 2, h, 7) % 5
        return TCLEAR if v < 2 else WHITE
    if m in ('terrace', 'tstand'):                  # dry-stone retaining walls
        a = (i + 2 * (h % 2)) // 2
        return DTAN if hsh(a, k // 2, h) % 3 == 0 else (LBG if hsh(a, k, h, 3) % 4 == 0 else TAN)
    if m in ('knoll', 'kstand'):
        a, b = (i + (h % 2)) // 3, (k + (h % 2)) // 3
        return DTAN if hsh(a, b, h) % 4 == 0 else DBG if hsh(a, b, h, 1) % 3 else LBG
    return DBG


# where something stands on the land: cells kept studded (olives, goats, trees)
OLIVES = [(140, 60), (240, 60), (180, -20), (360, 40), (280, 20), (-20, -260), (-160, 200), (-100, 260), (60, -240), (-180, 260), (100, -220), (-300, 160)]        # 2 x 2 bases (even centres), on the terraces
GOATS_T = [(190, 50, 0.6), (270, 10, -1.2)]
KNOLL_GOATS = [(-370, 260, 1.2), (-270, 290, -0.5), (-430, 240, 2.4)]
GOATHERD = (-330, 260, math.pi * 0.5)
CYPRESS = [(-20, -200), (100, -260)]
PINES = [(40, -280), (160, -260)]
VINES = [(170, 70), (190, 70), (270, 70), (290, 70), (310, 70)]                                      # on the ground by the road below the gate
POPLARS = [(-440, 120)]


def olive_cells():
    return {(i, k) for (x, z) in OLIVES for i in (x // S - 1, x // S) for k in (z // S - 1, z // S)}


RING_ROWS = {}


def ring_colour(h):
    def rc(m, i, q, k):
        if q != 1: return WHITE                                     # the outer layers white; the middle never white, or it merges
        if m.startswith('r'): return LBG
        return TCLEAR if hsh(i // 2, k // 3, h) % 3 else LBG
    return rc


def settle_ring(h, cells, rock):
    """lay the cloud course h in plates over `cells` (rock: the cells with rock under them) and drop fringe cells until every plate is
    held from the rock; returns (rows, cells kept)"""
    cells = set(cells)
    fd, tmp = tempfile.mkstemp(suffix='.ldr'); os.close(fd)
    anchor = ['0 !FORAGE ROOT\n' + put(DBG, (i + .5) * S, GRASS + h * B, (k + .5) * S, '3005') for (i, k) in rock]
    for _ in range(40):
        f = Form(y0=GRASS + h * B, unit=P, keep_studs=('c0', 'c1', 'c2', 'r0', 'r1', 'r2'))
        for (i, k) in cells:
            for q in range(3): f.vox[(i, q, k)] = ('r' if (i, k) in rock else 'c') + str(q)
        rows = f.parts(ring_colour(h))
        open(tmp, 'w').write('\n'.join(['0 FILE ring.ldr'] + anchor + rows) + '\n')
        L = [p for p in clicks.parts_loose(tmp) if p['pid'] != '3005']
        if not L: break
        for p in L: cells -= p['fp']
    os.remove(tmp)
    return rows, cells


class ColumnForm(Form):
    """the land's form, but the two cloud courses are laid in plates, three to a course, bonded crosswise, so a cloud shelf can stand
    well out from the rock (a course of bricks could not): the bricks of those courses are replaced by RING_ROWS, their caps kept"""
    def parts(self, colour):
        rows = super().parts(colour)
        tops = {GRASS + (h + 1) * B for h in RINGS}
        bricks = {p for _, p in __import__('sculpt').BRICKS}
        out = [r for r in rows if not (r.split()[-1][:-4] in bricks and round(-float(r.split()[3])) in tops)]
        for h in RINGS: out += RING_ROWS.get(h, [])
        return out


form = ColumnForm(y0=GRASS, unit=B, caps=True, keep_studs=('seat', 'tstand', 'kstand', 'hstand', 'puff'))
form.carve(world, range(I_LO, I_HI + 1), range(0, NH), range(K_LO, K_HI + 1))

# the column's core: solid, the top layer studded for the turntable
for i in range(CX // S - 2, CX // S + 2):
    for k in range(CZ // S - 2, CZ // S + 2):
        for h in range(NH): form.vox[(i, h, k)] = 'core'
        form.vox[(i, NH - 1, k)] = 'seat'
# nothing where the streak's steps are; the top step sits on the cloud (its cells kept studded)
for n, (x, z, top) in enumerate(STEPS):
    hb = (top - B - GRASS) // B                                     # the step's own course
    for (i, k) in step_cells(x, z):
        for h in range(hb, NH): form.vox.pop((i, h, k), None)
        if n == 0: form.vox[(i, hb - 1, k)] = 'seat'
# studs where the olives and goats stand: the terrace under each olive made level
for (x, z) in OLIVES:
    cs = [(i, k) for i in (x // S - 1, x // S) for k in (z // S - 1, z // S)]
    tops = [max([h for (ii, h, kk) in form.vox if ii == i and kk == k], default=-1) for (i, k) in cs]
    if max(tops) < 0: continue
    mat = next((form.vox[(i, max(tops), k)] for (i, k) in cs if (i, max(tops), k) in form.vox), 'terrace')
    for (i, k) in cs:
        for h in range(max(tops)): form.vox.setdefault((i, h, k), mat)
        form.vox[(i, max(tops), k)] = 'hstand' if mat == 'hill' else 'tstand'
for (x, z) in VINES:
    i, k = math.floor(x / S), math.floor(z / S)
    hs = [h for (ii, h, kk) in form.vox if ii == i and kk == k]
    if hs and form.vox[(i, max(hs), k)] == 'terrace': form.vox[(i, max(hs), k)] = 'tstand'
for (x, z, _) in GOATS_T + KNOLL_GOATS:
    for (i, k) in {(math.floor(x / S), math.floor(z / S)), (math.floor(x / S), math.floor(z / S) - 1), (math.floor(x / S), math.floor(z / S) + 1)}:
        hs = [h for (ii, h, kk) in form.vox if ii == i and kk == k]
        if hs:
            m = form.vox[(i, max(hs), k)]
            form.vox[(i, max(hs), k)] = 'kstand' if m == 'knoll' else 'tstand' if m == 'terrace' else m
for (x, z) in CYPRESS + PINES:                                      # the cypresses and pines on the hill
    cs = [(i, k) for i in (x // S - 1, x // S) for k in (z // S - 1, z // S)]
    tops = [max([h for (ii, h, kk) in form.vox if ii == i and kk == k], default=-1) for (i, k) in cs]
    if max(tops) < 0: continue
    for (i, k) in cs:
        for h in range(max(tops)): form.vox.setdefault((i, h, k), 'hill')
        form.vox[(i, max(tops), k)] = 'hstand'
for (i, k) in ((math.floor(GOATHERD[0] / S), math.floor((GOATHERD[1] - 10) / S)), (math.floor(GOATHERD[0] / S), math.floor((GOATHERD[1] + 10) / S))):
    hs = [h for (ii, h, kk) in form.vox if ii == i and kk == k]
    if hs: form.vox[(i, max(hs), k)] = 'kstand'
form.hollow(side=3, up=2, pillar=4, keep=lambda v, m: m in ('core', 'seat', 'terrace', 'tstand', 'hstand', 'kstand') or v[1] in RINGS)
for h in RINGS:                                                      # the cloud courses, laid in plates and settled once
    cells = {(i, k) for (i, hh, k) in form.vox if hh == h}
    rock = {(i, k) for (i, k) in cells if (i, h - 1, k) in form.vox}
    RING_ROWS[h], kept = settle_ring(h, cells, rock)
    for (i, k) in cells - kept: del form.vox[(i, h, k)]
PUFFS = []                                                          # round bricks of cloud standing on the shelves' open studs
for h in RINGS:
    top = [(i, k) for (i, hh, k) in list(form.vox) if hh == h and form.vox[(i, h, k)] == 'cloud' and (i, h + 1, k) not in form.vox]
    for (i, k) in sorted(top):
        if (i, k) in STREAK_CELLS or hsh(i, k, h) % 2: continue
        if not all((i + a, h, k + b) in form.vox and form.vox[(i + a, h, k + b)] == 'cloud' and (i + a, h + 1, k + b) not in form.vox
                   for a in (0, 1) for b in (0, 1)): continue
        if any(abs(i - pi) < 2 and abs(k - pk) < 2 and ph == h for (pi, pk, ph) in PUFFS): continue
        for a in (0, 1):
            for b in (0, 1): form.vox[(i + a, h, k + b)] = 'puff'
        PUFFS.append((i, k, h))


def puffs():
    """the puffs of cloud: a 2 x 2 round brick, white or clear, a round plate or a second brick on it"""
    out = []
    for n, (i, k, h) in enumerate(PUFFS):
        x, z, y = (i + 1) * S, (k + 1) * S, GRASS + (h + 1) * B
        out.append(put(WHITE if n % 3 else TCLEAR, x, y + B, z, '3941'))
        out.append(put(TCLEAR if n % 3 else WHITE, x, y + B + (B if n % 2 else P), z, '3941' if n % 2 else '4032a'))
    return out


def top_at(x, z):
    i, k = math.floor(x / S), math.floor(z / S)
    hs = [h for (ii, h, kk) in form.vox if ii == i and kk == k]
    return GRASS + (max(hs) + 1) * B if hs else GRASS


def land_cells():
    return {(i, k) for (i, h, k) in form.vox}


# ────────────────────────────────────────────────────────────────── helpers
def M(*ms):
    out = T(0, 0, 0)
    for m in ms: out = mat_mul(out, m)
    return out


def place(m, lines):
    out = []
    for l in lines:
        if not l.startswith('1 '): out.append(l); continue
        t = l.split()
        out.append(row(int(t[1]), mat_mul(m, [float(v) for v in t[2:14]]), t[14]))
    return out


def sit(card, sub, x, yup, z, rot=0, drop=()):
    """a minifigure sitting on the studs at yup, legs swung forward at the hip; it faces -z at rot 0 (as figure())"""
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    bl = next((b for b in re.split(r'(?m)^0 FILE ', text) if b.startswith(f'{card} - {sub}.ldr')), '')
    body = [l.split() for l in bl.splitlines() if l.startswith('1 ') and l.split()[-1].replace('.dat', '') not in drop]
    hip = next(t for t in body if re.match(r'3815', t[14]))
    hx, hy, hz = float(hip[2]), float(hip[3]), float(hip[4])
    out = []
    base = M(T(x, -(yup + 9), z), RY(rot), T(-hx, -(hy + 12), -hz - 10))       # thighs down on the studs
    for t in body:
        m = [float(v) for v in t[2:14]]
        if re.match(r'381[67]', t[14]): m = mat_mul(m, RX(-math.pi / 2))
        out.append(row(int(t[1]), mat_mul(base, m), t[14]))
    return out


def feet(x, z, rot):
    """the two stud cells a standing figure's feet take"""
    if abs(math.sin(rot)) < .5: pts = [(x - 10, z), (x + 10, z)]
    else: pts = [(x, z - 10), (x, z + 10)]
    return {(math.floor(a / S), math.floor(b / S)) for a, b in pts}


def seat_cells(x, z, rot):
    """the studs a seated figure takes (its hip over the seam between two)"""
    if abs(math.sin(rot)) < .5: return {(math.floor((x - 10) / S), math.floor(z / S)), (math.floor((x + 10) / S), math.floor(z / S))}
    return {(math.floor(x / S), math.floor((z - 10) / S)), (math.floor(x / S), math.floor((z + 10) / S))}


def recolour(rows, fn):
    out = []
    for r in rows:
        t = r.split()
        if r.startswith('1 '):
            c = fn(int(t[1]), float(t[2]), -float(t[3]), float(t[4]), t[14].replace('.dat', ''))
            if c is not None: t[1] = str(c); r = ' '.join(t)
        out.append(r)
    return out


CAPS = {'54200', '3068b', '3069b', '3070b', '87079', '2431', '63864'}


def land_rows():
    """the sculpted land, its caps on the terraces grassed, on the knoll mossed in places"""
    rows = form.parts(colour)
    def fn(c, x, yup, z, part):
        if part not in CAPS: return None
        i, k = math.floor(x / S - (0.5 if part != '54200' and (x / S) % 1 == 0 else 0)), math.floor(z / S - (0.5 if part != '54200' and (z / S) % 1 == 0 else 0))
        top = yup - (P if part != '54200' else 0)
        h = round((top - GRASS) / B) - 1
        m = form.vox.get((i, h, k))
        if m == 'terrace':
            v = hsh(i // 2, k // 2, 11) % 5
            return (OLIVE, GREEN, SANDGREEN, OLIVE, DTAN)[v]
        if m == 'knoll' and hsh(i // 2, k // 2, 5) % 3 == 0: return OLIVE
        if m == 'hill': return (OLIVE, DGREEN, OLIVE, GREEN, DTAN)[hsh(i // 2, k // 2, 12) % 5]
        if m == 'rock' and h <= 4 and hsh(i // 2, k // 2, 6) % 2 == 0: return (OLIVE, DGREEN)[hsh(i, k) % 2]
        return None
    return recolour(rows, fn)


# ────────────────────────────────────────────────────────────────── Olympus: the platform and the council (local frame: centre 0,0)
def disc():
    return {(i, k) for i in range(-9, 9) for k in range(-9, 9) if math.hypot((i + .5) * S, (k + .5) * S) <= PLAT_R}


# the hall: y is yup over the platform's floor studs (FLOOR_O)
COLONNADE = [(-90, -110), (-30, -110), (30, -110), (90, -110), (-130, -50), (130, -50)]
POS_THRONE = (0, -60)                       # 2 x 2 seat; its back one row behind
ZEUS_THRONE = (100, 20)                     # seat 2 x 2 at x 80..120; back at x 120..140
ATHENA = (-90, 20, -math.pi / 2)           # standing, facing +x toward Zeus
HERMES = (-60, 90, math.pi)
BENCH_Z = -90
GODS = [('ensemble.assembly-of-gods', 'god-1', -100), ('ensemble.assembly-of-gods', 'goddess-2', -60),
        ('ensemble.assembly-of-gods', 'god-3', 60), ('ensemble.assembly-of-gods', 'god-4', 100)]
PEAKS = [(-140, -80), (140, -80)]
GODDESSES = [('divine-fx.ares-aphrodite-hephaestus-song-tableau', 'god-3', -140, -30, math.pi * 0.5),
             ('divine-fx.ares-aphrodite-hephaestus-song-tableau', 'god-2', 140, -30, math.pi)]


def hall_stand():
    """cells of the platform's top layer kept studded: everything that stands on it"""
    c = set()
    for x, z in COLONNADE: c.add((math.floor(x / S), math.floor(z / S)))
    c |= {(i, k) for i in (-1, 0) for k in (-5, -4, -3)} | {(1, -5)}                 # Poseidon's throne and the trident's socket
    c |= {(i, k) for i in (4, 5, 6) for k in (0, 1)}                                   # Zeus's throne
    c |= feet(ATHENA[0], ATHENA[1], ATHENA[2])
    c |= {(i, -5) for i in (-6, -5, -4, -3, 2, 3, 4, 5)}                               # the bench
    for (x, z) in PEAKS: c |= {(i, k) for i in (x // S - 1, x // S) for k in (z // S - 1, z // S)}
    c |= {(i, k) for i in (-1, 0) for k in (3, 4)}                                     # the altar
    for _, _, x, z, r in GODDESSES: c |= feet(x, z, r)
    return c | crest_cells()


def crest_cells():
    """the snow on the summit's back rim: cells of the platform's rim behind the hall"""
    out = set()
    for (i, k) in disc():
        x, z = (i + .5) * S, (k + .5) * S
        if math.hypot(x, z) > PLAT_R - 20 and z < -50: out.add((i, k))
    peaks_ = {(i, k) for (x, z) in PEAKS for i in (x // S - 1, x // S) for k in (z // S - 1, z // S)}
    return out - {(math.floor(x / S), math.floor(z / S)) for x, z in COLONNADE} - peaks_


def crest():
    """a crest of snow along the back rim: white bricks, a few grey, each capped with a cheese slope running outward"""
    out = []
    for (i, k) in sorted(crest_cells()):
        if (i, k) not in {(ii, kk) for (ii, h, kk) in PFORM.vox if h == 2}: continue
        x, z = (i + .5) * S, (k + .5) * S
        n = 2 if hsh(i, k, 5) % 3 == 0 else 1
        for c in range(n): out.append(on(WHITE if hsh(i, k, c) % 4 else LBG, x, FLOOR_O + c * B, z, '3005'))
        a = math.atan2(x, z)                                          # run the slope down outward
        d = min(Form.FACE, key=lambda dd: abs(math.atan2(-dd[0], -dd[1]) - a) % (2 * math.pi))
        dx, dz = (1 if x > 0 else -1, 0) if abs(x) > abs(z) else (0, 1 if z > 0 else -1)
        out.append(put(WHITE, x, FLOOR_O + n * B, z, '54200', RY(Form.FACE[(dx, dz)])))
    return out


def platform_form():
    f = Form(y0=TT_TOP, unit=P, keep_studs=('stand',))
    D, ST = disc(), hall_stand()
    for (i, k) in D:
        f.vox[(i, 0, k)] = 'under'
        f.vox[(i, 1, k)] = 'under'
        f.vox[(i, 2, k)] = 'stand' if (i, k) in ST else 'floor'
    return f


def plat_colour(m, i, h, k):
    r = math.hypot((i + .5) * S, (k + .5) * S)
    if m == 'under': return (LBG, WHITE)[h] if r > 120 else (DBG, LBG)[h]
    if r > 150: return WHITE                                         # a white rim
    if abs(i + .5) < 2.5 and abs(k + .5) < 5.5 and k > -3: return WHITE  # a white aisle to the empty throne
    return GOLD if ((i + 8) // 2 + (k + 8) // 2) % 2 == 0 else DORANGE  # the bronze floor, in squares


def column_o(x, z, n=5):
    """a column of the hall: white round bricks, a gold capital"""
    y = FLOOR_O
    out = [on(WHITE, x, y + B * j, z, '3062b') for j in range(n)]
    out.append(put(GOLD, x, y + n * B + P, z, '3024'))
    return out


def colonnade():
    out = []
    for x, z in COLONNADE: out += column_o(x, z)
    top = FLOOR_O + 5 * B + P                                        # 532: the capitals
    # the architrave over the back four: two layers of white plates, joints crossed, a gold frieze on top
    out += [put(WHITE, -40, top + P, -110, '3666'), put(WHITE, 60, top + P, -110, '3710')]
    out += [put(WHITE, -60, top + 2 * P, -110, '3710'), put(WHITE, 40, top + 2 * P, -110, '3666')]
    out += pediment(top + 2 * P, -110)
    # side columns carry a short lintel each, with a gold tile
    for x in (-130, 130):
        out += [put(WHITE, x, top + P, -50, '3024'), put(GOLD, x, top + 2 * P, -50, '3070b')]
    return out


def pediment(y, z):
    """a white pediment over the back colonnade: four courses stepping in, 45-degree slopes at the ends, gold at its heart"""
    out = []
    for r, (half, mid) in enumerate(((5, '3009'), (4, '3010'), (3, '3004'), (2, None))):
        yt = y + (r + 1) * B
        xo = (half - 1) * S - 10                                              # the high stud of the end slopes
        out += [put(WHITE, -xo, yt, z, '3040b', RY(math.pi / 2)), put(WHITE, xo, yt, z, '3040b', RY(-math.pi / 2))]
        if mid: out.append(put(GOLD if r == 2 else WHITE, 0, yt, z, mid))
    out += [put(GOLD, -10, y + 4 * B + P, z, '98138'), put(GOLD, 10, y + 4 * B + P, z, '98138')]
    return out


def throne_poseidon():
    """the empty throne at the centre: a sea-coloured seat marked with the trident, its trident standing by it"""
    x, z = POS_THRONE
    y = FLOOR_O
    out = [on(DTURQ, x, y, z, '3003'), put(WHITE, x, y + B + P, z, '3068bpa3')]                  # the seat, the trident on it
    for c in range(3):
        out.append(on(DTURQ if c < 2 else GOLD, x, y + c * B, z - 30, '3004'))                     # the back, one row behind
    out.append(put(GOLD, x, y + 3 * B + P, z - 30, '3069b'))
    # the trident, upright, its butt in a round brick beside the seat
    out.append(on(GOLD, x + 30, y, z - 30, '3062b'))
    out.append(row(GOLD, T(x + 30, -(y + B + 2), z - 30), '92290'))
    return out


def throne_zeus():
    """Zeus's throne on the left of the hall (+x), facing across to Athena: a white seat, a tall back banded in gold"""
    x, z = ZEUS_THRONE
    y = FLOOR_O
    out = [on(WHITE, x - 10, y, z, '3004', math.pi / 2), on(WHITE, x + 10, y, z, '3004', math.pi / 2)]
    out += [on(GOLD if c == 2 else WHITE, x + 30, y + c * B, z, '3004', math.pi / 2) for c in range(4)]
    out.append(put(GOLD, x + 30, y + 4 * B + P, z, '3069b', RY(math.pi / 2)))
    return out


def benches():
    """the gods' bench behind the thrones: two white runs of 1 x 4, the gods sitting on their studs"""
    return [put(WHITE, -80, FLOOR_O + B, BENCH_Z, '3010'), put(WHITE, 80, FLOOR_O + B, BENCH_Z, '3010')]


def peaks():
    """two snowy horns of the summit at the platform's flanks: a white brick, a grey one, a white cone"""
    out = []
    for (x, z) in PEAKS:
        out += [on(WHITE, x, FLOOR_O, z, '3003'), on(LBG, x, FLOOR_O + B, z, '3003'), on(WHITE, x, FLOOR_O + 2 * B, z, '3942c')]
    return out


def council_fire():
    """the altar before the council: a white block, a gold round plate, its flames"""
    y = FLOOR_O
    return [on(WHITE, 0, y, 80, '3003'), put(GOLD, 0, y + B + P, 80, '4032a'), on(TORANGE, -10, y + B + P, 70, '4589'),
            on(YELLOW, 10, y + B + P, 90, '4589'), on(TORANGE, 10, y + B + P, 70, '3062b'), on(YELLOW, 10, y + 2 * B + P, 70, '4589')]


def council():
    out = colonnade() + throne_poseidon() + throne_zeus() + benches() + peaks() + council_fire() + crest()
    zx, zz = ZEUS_THRONE
    out += sit('character.zeus', 'zeus', zx + 10, FLOOR_O + B, zz, math.pi / 2)
    ax, az, ar = ATHENA
    out += figure('character.athena', 'athena', ax, FLOOR_O, az, ar)
    for card, sub, x in GODS:
        out += sit(card, sub, x, FLOOR_O + B, BENCH_Z, math.pi)
    for card, sub, x, z, r in GODDESSES:
        out += figure(card, sub, x, FLOOR_O, z, r)
    return out


def under_clouds():
    """a ring of cloud hanging under the platform's rim: white and clear bricks pressed up under the plates"""
    out = []
    for (i, k) in sorted({(i, k) for (i, h, k) in PFORM.vox if h == 0}):
        r = math.hypot((i + .5) * S, (k + .5) * S)
        if 135 < r and ((i + k) % 2 == 0 or r > 150):
            col = TCLEAR if hsh(i, k) % 3 == 0 else WHITE
            out.append(put(col, (i + .5) * S, TT_TOP, (k + .5) * S, '3005'))
    return out


PFORM = platform_form()


def platform_local():
    return PFORM.parts(plat_colour) + under_clouds() + council()


def platform(rot=0.0):
    """the turntable on the column and the platform on it, turned `rot` about the turntable's axis"""
    out = [put(DGRAY, CX, TT_TOP, CZ, '61485c01')]
    return out + place(M(T(CX, 0, CZ), RY(rot)), platform_local())


# ────────────────────────────────────────────────────────────────── the streak and the goddess
def streak():
    out = []
    for n, (x, z, top) in enumerate(STEPS):
        col = (TYELLOW, TCLEAR, GOLD, TCLEAR)[n % 4] if n else WHITE
        out.append(put(col, x, top, z, '3941'))
    return out


ATH_STEP = 7


def sparkle():
    """glints on the trail: a round brick of trans yellow or clear on a free stud of every other step"""
    out = []
    for n, (x, z, top) in enumerate(STEPS):
        if n in (0, ATH_STEP, N_STEPS - 1) or n % 2: continue
        px, pz, _ = STEPS[n - 1]
        sx, sz = (x - 10, z + 10) if pz < z else (x - 10, z + 10)
        out.append(on(TYELLOW if n % 4 else TCLEAR, sx, top, sz, '3062b'))
    return out


def athena_flying():
    """Athena on the streak, half way down, facing down it (+z)"""
    x, z, top = STEPS[ATH_STEP]
    nx, nz, _ = STEPS[ATH_STEP + 1]
    # the step's studs not covered by the one above: the row nearest the viewer (the next move is +z or -x)
    px, pz, _ = STEPS[ATH_STEP - 1]
    if pz < z: fx, fz, rot = x, z + 10, math.pi                   # came down in +z: stands on the front row, facing the viewer
    else: fx, fz, rot = x - 10, z, math.pi / 2                     # came down in -x: stands on the -x row, facing -x
    rows = figure('character.athena', 'athena', fx, top, fz, rot)
    return [r.replace(' 15 ', f' {GOLD} ', 1) if re.search(r'381[67]c?\.dat$', r) else r for r in rows]


# ────────────────────────────────────────────────────────────────── the palace
def lay(cells, c, along_x, fixed, yb, cols=(TAN, DTAN), timber=None):
    """one course of a straight wall over runs of cells, joints staggered by course; returns rows"""
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
            if left - L == 1 and L > 2: L -= 1
            first = False
            col = timber if timber is not None else (cols[0] if hsh(q // 3, c, fixed) % 5 < 3 else cols[1])
            part = {1: '3005', 2: '3004', 3: '3622', 4: '3010'}[L]
            mid = (q + L / 2) * S
            yup = yb + (c + 1) * B
            out.append(put(col, mid, yup, (fixed + .5) * S, part) if along_x else put(col, (fixed + .5) * S, yup, mid, part, RY(math.pi / 2)))
            q += L
    return out


def wall(cells, along_x, fixed, courses, yb=GRASS, timber_course=None, top=True, cols=(TAN, DTAN)):
    out = []
    for c in range(courses):
        out += lay(cells, c, along_x, fixed, yb, cols, RB if c == timber_course else None)
    if top:
        yt = yb + courses * B
        runs, run = [], []
        for q in cells:
            if run and q != run[-1] + 1: runs.append(run); run = []
            run.append(q)
        if run: runs.append(run)
        for run in runs:
            out += tile_run(DTAN, run[0] * S, fixed * S, len(run), yt, True) if along_x else tile_run(DTAN, fixed * S, run[0] * S, len(run), yt, False)
    return out


def megaron():
    """the great hall's front: ochre ashlar with a timber course and a frieze of fresco blue and red, the door open on the dark hall,
    the porch between antae with two red columns, black-capped"""
    i0, i1 = MEG_I; k0, k1 = MEG_K
    out = []
    for c in range(WALL_C):
        tim = RB if c == 3 else None
        out += lay(list(range(i0, i1 + 1)), c, True, k0, GRASS, (TAN, DTAN), tim)                           # the back
        out += lay(list(range(k0 + 1, PORCH_K[1] + 1)), c, False, i0, GRASS, (TAN, DTAN), tim)              # the sides and antae
        out += lay(list(range(k0 + 1, PORCH_K[1] + 1)), c, False, i1, GRASS, (TAN, DTAN), tim)
        front = [i for i in range(i0 + 1, i1) if not (i in DOOR_I and c < 5)]
        if c == 4:                                                                                           # the frieze
            for i in front:
                out.append(put((BLUE, WHITE, RED, WHITE)[i % 4], (i + .5) * S, GRASS + (c + 1) * B, (k1 + .5) * S, '3005'))
        else:
            out += lay(front, c, True, k1, GRASS, (TAN, DTAN), tim)
    for c in range(5):                                                                                       # the dark of the hall
        out += lay(list(DOOR_I), c, True, k1 - 1, GRASS, (BLK, BLK))
    for x, z in COLS:                                                                                        # black base and capital, red shaft
        out += [put(BLK, x, GRASS + P, z, '4032a')] + [put(RED, x, GRASS + P + B * (j + 1), z, '3941') for j in range(5)]
        out += [put(BLK, x, GRASS + P + 5 * B + P, z, '4032a'), put(BLK, x, GRASS + 2 * P + 5 * B + P, z, '3022')]
    for i in range(i0 + 1, i1):                                                                              # the porch's white paving
        for k in PORCH_K:
            if any(abs((i + .5) * S - x) < 20 and abs((k + .5) * S - z) < 20 for x, z in COLS): continue
            if k == -8 and i in (-16, -15, -14, -13, -12, -11): continue                           # three suitors stand here
            out.append(put(WHITE if (i + k) % 3 else LBG, (i + .5) * S, GRASS + P, (k + .5) * S, '3070b'))
    return out


ROOF_SMOKE = (-180, -240)
UPPER_I, UPPER_K = (-20, -15), (-15, -12)            # the women's rooms over the back of the hall


def roof_form():
    f = Form(y0=MEG_TOP, unit=P, keep_studs=('stand',))
    i0, i1 = MEG_I; k0, k1 = MEG_K
    sx, sz = ROOF_SMOKE
    for i in range(i0, i1 + 1):
        for k in range(k0, PORCH_K[1] + 1):
            for h in range(2): f.vox[(i, h, k)] = 'roof'
            up = UPPER_I[0] <= i <= UPPER_I[1] and UPPER_K[0] <= k <= UPPER_K[1]
            f.vox[(i, 2, k)] = 'stand' if up or (abs((i + .5) * S - sx) < 20 and abs((k + .5) * S - sz) < 20) else 'rooft'
    return f


ROOF = roof_form()


def roof_colour(m, i, h, k):
    if m == 'roof': return DTAN if h == 0 else RB
    if k >= PORCH_K[0] - 1 or i in (MEG_I[0], MEG_I[1]) or k == MEG_K[0]: return RB                    # the eaves: timber ends
    return DTAN if hsh(i // 2, k // 2) % 4 == 0 else TAN


def upper_storey():
    """the upper rooms over the back of the hall, where the women's quarters are: plastered walls, a window with a shutter-frame,
    a flat roof of timber and earth"""
    (i0, i1), (k0, k1) = UPPER_I, UPPER_K
    yb = MEG_TOP + 3 * P
    out = []
    for c in range(3):
        cols = (WHITE, TAN) if c != 1 else (TAN, WHITE)
        out += lay(list(range(i0, i1 + 1)), c, True, k0, yb, cols)
        out += lay(list(range(k0 + 1, k1 + 1)), c, False, i0, yb, cols)
        out += lay(list(range(k0 + 1, k1 + 1)), c, False, i1, yb, cols)
        front = [i for i in range(i0 + 1, i1) if not (c < 2 and i in (i0 + 2, i0 + 3))]
        out += lay(front, c, True, k1, yb, cols)
    out.append(put(BLK, (i0 + 3) * S, yb + 2 * B, (k1 + .5) * S, '60592'))                      # the window, dark within
    yt = yb + 3 * B
    f = Form(y0=yt, unit=P)
    for i in range(i0, i1 + 1):
        for k in range(k0, k1 + 1):
            f.vox[(i, 0, k)] = 'a'; f.vox[(i, 1, k)] = 'b'
    out += f.parts(lambda m, i, h, k: RB if m == 'a' else (DTAN if (i + k) % 3 else TAN))
    return out


def smoke(x, z, yb):
    """the smoke of the feast: round bricks, grey and clear, wavering up from the roof's hole one stud at a time"""
    out, y = [], yb
    offs = [(0, 0), (20, 0), (20, 20), (0, 20), (-20, 20), (-20, 0)]
    cols = [DBG, LBG, TCLEAR, LBG, WHITE, TCLEAR]
    out.append(put(BLK, x, y + P, z, '3022')); y += P
    for n, (dx, dz) in enumerate(offs):
        out.append(put(cols[n], x + dx, y + B, z + dz, '3941')); y += B
    return out


def court_walls():
    out = []
    ks = list(range(-15, FRONT_K))
    out += wall(ks, False, -23, 4, timber_course=2)                                                   # west wall
    out += east_wall(ks)
    out += wall(list(range(-22, -20)), True, -15, 4, timber_course=2)                                 # the back, beside the megaron
    out += wall(list(range(-6, -3)), True, -15, 4, timber_course=2)
    out += wall(list(range(-23, GATE_I + 1)), True, FRONT_K, 2)                                       # the low front wall
    return out


def east_wall(ks):
    """the east wall of the court over cells ks, the gateway left open in it; its top tiled but for the piers"""
    east = [k for k in ks if k not in GATE_K]
    out = wall(east, False, GATE_I, 4, timber_course=2, top=False)
    piers = (GATE_K[0] - 1, GATE_K[-1] + 1)
    run = []
    for k in east + [None]:
        if run and (k is None or k != run[-1] + 1 or k in piers):
            out += tile_run(DTAN, GATE_I * S, run[0] * S, len(run), GRASS + 4 * B, False); run = []
        if k is not None and k not in piers: run.append(k)
    return out


def gate():
    """the outer gate: piers carried up over the wall, a timber lintel, the leaves standing open inward"""
    out = []
    kl, kr = GATE_K[0] - 1, GATE_K[-1] + 1
    x = (GATE_I + .5) * S
    for k in (kl, kr):
        out.append(on(DTAN, x, GRASS + 4 * B, (k + .5) * S, '3005'))
    out.append(put(RB, x, GRASS + 6 * B, (kl + 3) * S, '3009', RY(math.pi / 2)))                      # the lintel, 1 x 6
    out += [put(RB, x, GRASS + 6 * B + P, (kl + 1) * S, '3069b', RY(math.pi / 2)), put(GOLD, x, GRASS + 6 * B + P, (kl + 2.5) * S, '3070b'),
            put(RB, x, GRASS + 6 * B + P, (kl + 4) * S, '3069b', RY(math.pi / 2)), put(GOLD, x, GRASS + 6 * B + P, (kl + 5.5) * S, '3070b')]
    x = (GATE_I - .5) * S                                                                            # the leaves, swung right back
    for zc in (GATE_K[0] * S - 20, (GATE_K[-1] + 1) * S + 20):                                       # against the inside of the wall
        for c in range(4):
            out.append(put(RB if c % 2 == 0 else DB, x, GRASS + (c + 1) * B, zc, '3004', RY(math.pi / 2)))
        out += [put(GOLD, x, GRASS + 4 * B + P, zc - 10, '3070b'), put(RB, x, GRASS + 4 * B + P, zc + 10, '3070b')]
    return out


def gate_cells():
    return {(GATE_I - 1, k) for k in (GATE_K[0] - 2, GATE_K[0] - 1, GATE_K[-1] + 1, GATE_K[-1] + 2)}


# ── the forecourt ──
BOARD = (-240, -40)                         # 2 x 4 along z: x -260..-220, z -80..0
PLAYERS = [('character.antinous', 'antinous', -310, -40, -math.pi / 2), ('character.amphinomus', 'amphinomus', -170, -40, math.pi / 2)]
LOUNGERS = [('ensemble.suitors', 'suitor-3', -400, -110, math.pi), ('ensemble.suitors', 'suitor-4', -360, -110, math.pi),
            ('ensemble.armed-suitors', 'suitor-5', -300, 30, 0), ('ensemble.armed-suitors', 'suitor-2', -160, 30, 0)]
STANDERS = [('ensemble.suitors', 'suitor-1', -120, 30, math.pi), ('ensemble.palace-servants', 'servant-1', -280, -120, math.pi),
            ('ensemble.suitor-council', 'suitor-2', -260, -150, math.pi), ('ensemble.suitor-council', 'suitor-5', -220, -150, math.pi),
            ('ensemble.suitor-council', 'suitor-4', -300, -150, math.pi)]
TELEMACHUS = (-130, -80, -math.pi / 2)     # seated on a stool, facing the gate (+x)
KRATER = (-420, 20)
HERALDS = [('ensemble.palace-servants', 'servant-2', -370, 20, math.pi / 2), ('ensemble.palace-servants', 'servant-4', -420, -30, math.pi)]
MENTES = (-10, -80, math.pi / 2)            # outside the gate, facing in (-x)
HIDES = [(-380, -100, 6, 2, MNOUGAT), (-320, -40, 2, 4, NOUGAT), (-160, -40, 2, 4, RB), (-280, 40, 4, 2, WHITE), (-180, 40, 4, 2, MNOUGAT)]


def hides():
    """the hides of the slaughtered oxen, laid on the paving: plates (studs for the men who sit on them), a tile patch on each"""
    out, cells = [], set()
    for x, z, w, d, col in HIDES:
        part = {(4, 2): '3020', (2, 4): '3020', (6, 2): '3795'}[(w, d)]
        out.append(put(col, x, TREAD, z, part, RY(math.pi / 2) if d > w else None))
        hc = {(i, k) for i in range(math.floor((x - w * 10) / S), math.floor((x + w * 10) / S)) for k in range(math.floor((z - d * 10) / S), math.floor((z + d * 10) / S))}
        cells |= hc
        seats = set()
        for _, _, sx, sz, sr in PLAYERS + LOUNGERS:                        # where each sits, and where his legs lie before him
            fx, fz = round(-math.sin(sr)), round(-math.cos(sr))
            for (i, k) in seat_cells(sx, sz, sr): seats |= {(i + n * fx, k + n * fz) for n in (0, 1, 2)}
        spot = {WHITE: BLK, MNOUGAT: WHITE, NOUGAT: RB, RB: WHITE}[col]
        for (i, k) in sorted(hc - seats):                                  # the hide's free studs tiled, in its own colour and its spots
            out.append(put(spot if hsh(i, k, 8) % 3 == 0 else col, (i + .5) * S, TREAD + P, (k + .5) * S, '3070b'))
    return out, cells


def draughts():
    """the draughts board between the two players: a raised 2 x 4 board of squares, the pieces standing on it"""
    x, z = BOARD
    out = [put(RB, x, TREAD, z, '3020', RY(math.pi / 2))]
    sq = []
    for a in (0, 1):
        for b in range(4):
            cx, cz = x - 10 + a * 20, z - 30 + b * 20
            col = TAN if (a + b) % 2 else DTAN
            if (a, b) in ((0, 1), (1, 2), (0, 3)):
                out += [put(col, cx, TREAD + P, cz, '3024'), put(BLK if b < 2 else WHITE, cx, TREAD + 2 * P, cz, '98138')]
            elif (a, b) == (1, 0):
                out += [put(col, cx, TREAD + P, cz, '3024'), put(WHITE, cx, TREAD + 2 * P, cz, '98138')]
            else:
                out.append(put(col, cx, TREAD + P, cz, '3070b'))
    return out, {(i, k) for i in (-13, -12) for k in range(-4, 0)}


def krater():
    """the heralds' mixing-bowl: a bronze krater on its foot, dark wine in it; cups by it"""
    x, z = KRATER
    out = [put(GOLD, x, GRASS + P, z, '4032a'), put(DORANGE, x, GRASS + P + B, z, '3941'), put(GOLD, x, GRASS + 2 * P + B, z, '4032a'),
           put(TRED_, x, GRASS + 3 * P + B, z, '14769')]
    return out, {(i, k) for i in (x // S - 1, x // S) for k in (z // S - 1, z // S)}


def mentes(x, z, r, yup=GRASS):
    """Athena in the likeness of Mentes, the card's staff exchanged for a bronze spear held upright, point to the sky"""
    out = []
    for l in figure('character.athena-as-mentes', 'athena-as-mentes', x, yup, z, r):
        t = l.split()
        if t[14].startswith('95049'):
            m = mat_mul([float(v) for v in t[2:14]], RX(math.pi))
            l = row(GOLD, m, '4497')
        out.append(l)
    return out


def stool(x, z):
    """Telemachus's seat: a 1 x 2 brick of timber along z, a fleece (1 x 2 tile) left off so he sits on its studs"""
    return [put(RB, x, GRASS + B, z, '3004', RY(math.pi / 2))], {(math.floor(x / S), math.floor((z - 10) / S)), (math.floor(x / S), math.floor((z + 10) / S))}


def people_below():
    out, cells = [], set()
    for card, sub, x, z, rot in PLAYERS + LOUNGERS:
        out += sit(card, sub, x, TREAD, z, rot)
    for card, sub, x, z, rot in STANDERS + HERALDS:
        out += figure(card, sub, x, GRASS, z, rot); cells |= feet(x, z, rot)
    tx, tz, tr = TELEMACHUS
    s, sc = stool(tx, tz); out += s; cells |= sc
    out += sit('character.telemachus', 'telemachus', tx, GRASS + B, tz, tr)
    mx, mz, mr = MENTES
    out += mentes(mx, mz, mr); cells |= feet(mx, mz, mr)
    return out, cells


# ────────────────────────────────────────────────────────────────── the land's furniture
def olive(x, z, yup, n=0):
    """an olive: a gnarled trunk of round bricks, a crown of silvery leaves in two tiers, olive and sand green and a little dark green"""
    out, y = [], yup
    for q in range(2):
        out.append(put(DB if q % 2 else RB, x, y + B, z, '3941')); y += B
    out.append(put(RB, x, y + P, z, '4032a')); y += P
    L = (DGREEN, SANDGREEN, GREEN, OLIVE)
    out.append(on(L[n % 4], x - 10, y, z - 10, '2417', (n % 4) * math.pi / 2))
    out.append(on(RB, x + 10, y, z + 10, '3062b'))
    out.append(on(L[(n + 1) % 4], x + 10, y + B, z + 10, '2417', ((n + 2) % 4) * math.pi / 2))
    out.append(on(L[(n + 2) % 4], x + 10, y, z - 10, '6255'))
    out += [on(DB, x - 10, y, z + 10, '3062b'), on(RB, x - 10, y + B, z + 10, '3062b'),
            on(L[(n + 3) % 4], x - 10, y + 2 * B, z + 10, '2417', ((n + 1) % 4) * math.pi / 2)]            # the top tier
    return out


def trees():
    out = []
    for n, (x, z) in enumerate(OLIVES): out += olive(x, z, top_at(x - 10, z - 10), n)
    for x, z in CYPRESS: out.append(on(DGREEN, x, top_at(x - 10, z - 10), z, '3778'))
    for x, z in POPLARS: out.append(on(GREEN, x, GRASS, z, '3470'))
    for x, z in PINES: out.append(on(DGREEN, x, top_at(x - 10, z - 10), z, '2435'))
    gx, gz, gr = GOATHERD
    out += figure('ensemble.suitor-uproar', 'herdsman-3', gx, top_at(gx, gz - 10), gz, gr)
    for x, z, r in GOATS_T + KNOLL_GOATS:
        out.append(on(WHITE if hsh(x, z) % 3 else TAN, x, top_at(x, z), z, '95341', r))
    return out


def tree_cells():
    c = set()
    for x, z in CYPRESS + POPLARS: c |= {(i, k) for i in (x // S - 1, x // S) for k in (z // S - 1, z // S)}
    return c


def field_wall():
    """a dry-stone field wall across the field in front of the palace: stones grey and tan, each capped with a tile"""
    out, cells = [], set()
    for n, i in enumerate(range(-16, -6)):
        out.append(on(DBG if hsh(i, 6) % 3 else LBG, (i + .5) * S, GRASS, (6 + .5) * S, '3005'))
        out.append(put(DTAN if n % 3 else LBG, (i + .5) * S, GRASS + B + P, (6 + .5) * S, '3070b'))
        cells.add((i, 6))
    return out, cells


SHIP = (360, 260)
JETTY = (200, 260)


def jetty():
    """a stone mole running out from the beach, the ship's cable made fast to a timber bollard on it"""
    x, z = JETTY
    out = [put(DBG, x, GRASS + B, z, '3001'), put(LBG, x, GRASS + B + P, z, '3020')]
    y = GRASS + B + 2 * P
    out += [put(LBG, x - 10, y, z - 10, '63864'), put(DTAN, x, y, z + 10, '2431'), on(RB, x + 30, GRASS + B + P, z - 10, '3062b')]
    return out, {(i, k) for i in range(x // S - 2, x // S + 2) for k in (z // S - 1, z // S)}


def plants(blocked):
    """tufts and flowers on bare studs of the island's ground: never on the road, the court, the beach or the sea"""
    out, cells = [], set()
    for i in range(I_LO + 1, I_HI):
        for k in range(K_LO + 1, K_HI):
            if (i, k) in blocked or SEA(i, k) or BEACH(i, k) or on_road(i, k, 1.6) or (i, k) in PALACE_CELLS: continue
            if hsh(i, k, 77) % 41: continue
            v = hsh(i, k, 3) % 4
            x, z = (i + .5) * S, (k + .5) * S
            out.append(on((DGREEN, GREEN, OLIVE, DGREEN)[v], x, GRASS, z, '6255'))
            cells.add((i, k))
    return out, cells


def ship():
    """Mentes' black ship at her mooring: a hull of black bricks on a keel plate, red cheeks and a timber rail, stem and stern rising,
    the well planked, a mast with the sail furled on its yard"""
    x0, z0 = SHIP
    out = [put(BLK, x0, GRASS + P, z0, '3035')]                                                    # the keel, 4 x 8
    cells = {(i, k) for i in range(x0 // S - 4, x0 // S + 4) for k in range(z0 // S - 2, z0 // S + 2)}
    for dz in (-30, 30):                                                                           # the sides
        out += [put(BLK, x0, GRASS + P + B, z0 + dz, '3009'), put(RED, x0, GRASS + 2 * P + B, z0 + dz, '3666')]
        out += tile_run(RB, x0 - 60, z0 + dz - 10, 6, GRASS + 2 * P + B)
    for dx in (-70, 70):                                                                           # stern and bow, rising
        out.append(put(BLK, x0 + dx, GRASS + P + B, z0, '3010', RY(math.pi / 2)))
        out.append(put(BLK, x0 + dx, GRASS + P + 2 * B, z0, '3004', RY(math.pi / 2)))
        out.append(put(BLK, x0 + dx, GRASS + P + 3 * B, z0 - 10, '3005'))
        out.append(put(BLK if dx > 0 else RB, x0 + dx, GRASS + P + 3 * B, z0 + 10, '3005'))
        out.append(put(BLK, x0 + dx, GRASS + P + 4 * B, z0 - 10, '3062b') if dx > 0 else put(RB, x0 + dx, GRASS + P + 3 * B + P, z0 - 10, '3070b'))
        out.append(put(RB, x0 + dx, GRASS + P + 3 * B + P, z0 + 10, '3070b'))
    mast = (x0 + 10, z0 - 10)
    for dz in (-10, 10):                                                                           # the well, planked
        cols = [q for q in range(-3, 3) if not (dz == -10 and q == 0)]
        run = []
        for q in cols + [None]:
            if run and (q is None or q != run[-1] + 1):
                out += tile_run(DB if dz < 0 else RB, x0 + run[0] * S, z0 + dz - 10, len(run), GRASS + P); run = []
            if q is not None: run.append(q)
    mx, mz = mast
    out += [put(RB, mx, GRASS + P + B * (j + 1), mz, '3062b') for j in range(7)]
    yt = GRASS + P + 7 * B
    out.append(put(RB, mx, yt + P, z0, '3666', RY(math.pi / 2)))                               # the yard, 1 x 6 along z
    for c in range(3):                                                                          # the sail, hung from the yard
        col = RED if c == 1 else WHITE
        out += [put(col, mx, yt - c * B, z0 - 40, '3004', RY(math.pi / 2)), put(col, mx, yt - c * B, z0 + 30, '3622', RY(math.pi / 2))]
    out += [put(RB, mx, yt + 2 * P, mz, '3070b')]
    for dx in (-40, 20):                                                                           # oars shipped, resting on the rails
        out.append(row(RB, M(T(x0 - 70, -(GRASS + 2 * P + B + P + 4), z0 + (dx // 2)), RZ(-math.pi / 2)), '2542'))
    return out, cells


HOUSES = [((0, 3), (8, 11), 'e'), ((-4, -1), (10, 13), 'e')]


def houses():
    """two houses of the town by the harbour: rubble walls plastered white and ochre, a door on the road, a window, a flat roof of timber
    and packed earth, a jar by the door"""
    out, cells = [], set()
    for n, ((i0, i1), (k0, k1), door) in enumerate(HOUSES):
        cols = ((WHITE, TAN), (TAN, DTAN))[n % 2]
        for c in range(3):
            out += lay(list(range(i0, i1 + 1)), c, True, k0, GRASS, cols)
            out += lay(list(range(k0 + 1, k1 + 1)), c, False, i0, GRASS, cols)
            side = [k for k in range(k0 + 1, k1 + 1) if not (c < 2 and k in (k0 + 1, k0 + 2))]
            out += lay(side, c, False, i1, GRASS, cols)                                           # the door in the +x wall
            front = [i for i in range(i0 + 1, i1) if not (c == 1 and i == i0 + 1)]
            out += lay(front, c, True, k1, GRASS, cols)
        out.append(put(BLK, (i0 + 1.5) * S, GRASS + 2 * B, (k1 + .5) * S, '3005'))                # a small dark window
        f = Form(y0=GRASS + 3 * B, unit=P, keep_studs=('c',))
        for i in range(i0, i1 + 1):
            for k in range(k0, k1 + 1):
                f.vox[(i, 0, k)] = 'a'; f.vox[(i, 1, k)] = 'c' if i in (i0, i1) and k in (k0, k1) else 'b'
        out += f.parts(lambda m, i, h, k: RB if m == 'a' else (DTAN if (i + k) % 3 else TAN))
        out += [put(TAN, (i0 + 1) * S, GRASS + P, (k0 + 1.5) * S, '3069b')] if False else []
        cells |= {(i, k) for i in range(i0, i1 + 1) for k in range(k0, k1 + 1)}
        for (ci, ck) in ((i0, k0), (i1, k0), (i0, k1), (i1, k1)):                             # a parapet at the roof's corners
            out.append(on(cols[0], (ci + .5) * S, GRASS + 3 * B + 2 * P, (ck + .5) * S, '3005'))
            out.append(put(DTAN, (ci + .5) * S, GRASS + 4 * B + 2 * P + P, (ck + .5) * S, '3070b'))
        # a storage jar by the door
        jx, jz = (i1 + 1.5) * S, (k1 + .5) * S
        out += [on(DORANGE, jx, GRASS, jz, '3062b'), on(DORANGE, jx, GRASS + B, jz, '4589') if False else put(RB, jx, GRASS + B + P, jz, '3024')]
        cells.add((i1 + 1, k1))
    return out, cells


def pen():
    """a goat-pen of stacked stones by the lower house, two goats in it"""
    out, cells = [], set()
    i0, i1, k0, k1 = -14, -11, 8, 11
    ring = [(i, k0) for i in range(i0, i1 + 1)] + [(i, k1) for i in range(i0, i1 + 1)] + [(i0, k) for k in range(k0 + 1, k1)] + \
           [(i1, k) for k in range(k0 + 1, k1) if k != k0 + 1]
    for (i, k) in ring:
        out += [on(DBG if hsh(i, k) % 3 else LBG, (i + .5) * S, GRASS, (k + .5) * S, '3005'),
                put(DTAN if hsh(i, k, 1) % 2 else LBG, (i + .5) * S, GRASS + B + P, (k + .5) * S, '3070b')]
        cells.add((i, k))
    out += [on(WHITE, (i0 + 1.5) * S, GRASS, (k0 + 2) * S, '95341', 0.8), on(TAN, (i0 + 2.5) * S, GRASS, (k0 + 2) * S, '95341', 2.6)]
    cells |= {(i0 + 1, k0 + 1), (i0 + 1, k0 + 2), (i0 + 2, k0 + 1), (i0 + 2, k0 + 2)}
    return out, cells


def sea_rocks():
    """rocks in the cove, awash: grey bricks with cheese-slope shoulders, foam at their feet"""
    out, cells = [], set()
    for (x, z, n) in ((430, 150, 2), (250, 290, 1), (450, 290, 1)):
        out.append(on(DBG, x, GRASS, z, '3005'))
        if n > 1: out.append(on(LBG, x, GRASS + B, z, '3005'))
        out.append(put(DBG if n > 1 else LBG, x, GRASS + n * B, z, '54200', RY(math.pi * (n % 2))))
        cells.add((math.floor(x / S), math.floor(z / S)))
    return out, cells


def lantern():
    """the smoke-hole over the hearth, framed by four short red posts under a timber ring"""
    x, z = ROOF_SMOKE
    y = MEG_TOP + 3 * P
    return []


TOWNSFOLK = [('ensemble.crew', 'sailor-5', 150, 240, -math.pi / 2), ('ensemble.people-of-ithaca', 'woman-4', 90, 200, -math.pi / 2),
             ('ensemble.people-of-ithaca', 'woman-3', 100, 130, math.pi)]


def townsfolk():
    """the island going about its day: one of Mentes' sailors on the beach by the mole, a woman at her door, another on the road"""
    out, cells = [], set()
    for card, sub, x, z, r in TOWNSFOLK:
        out += figure(card, sub, x, GRASS, z, r); cells |= feet(x, z, r)
    return out, cells


def vines():
    """a row of vines along the lowest terrace: timber stocks, leaves"""
    out = []
    for n, (x, z) in enumerate(VINES):
        y = top_at(x, z)
        if y <= GRASS: continue
        out += [on(RB, x, y, z, '3062b'), on((GREEN, DGREEN)[n % 2], x, y + B, z, '6255')]
    return out


def well():
    """the town's well-head by the lower house: a ring of stone, a timber sweep-post"""
    x, z = -120, 180
    return [on(LBG, x, GRASS, z, '3941'), put(DBG, x, GRASS + B + P, z, '4032a'), on(RB, x + 10, GRASS + B + P, z + 10, '3062b')], \
        {(i, k) for i in (-7, -6) for k in (8, 9)}


def road_walls(blocked):
    """low dry-stone walls along the road where it climbs from the harbour: single stones, each capped"""
    out, cells = [], set()
    for i in range(-2, 13):
        for k in range(-1, 15):
            if (i, k) in blocked or on_road(i, k, 1.3) or not on_road(i, k, 2.1) or SEA(i, k) or BEACH(i, k): continue
            if (i, k) in PALACE_CELLS or hsh(i, k, 9) % 3 == 0 or any((i, h, k) in form.vox for h in range(3)): continue
            out += [on(DBG if hsh(i, k) % 3 else LBG, (i + .5) * S, GRASS, (k + .5) * S, '3005'),
                    put(LBG if hsh(i, k, 2) % 2 else DTAN, (i + .5) * S, GRASS + B + P, (k + .5) * S, '3070b')]
            cells.add((i, k))
    return out, cells


def spear_rack():
    """the spear-rack against the east wall inside the gate, where Telemachus will stand the stranger's spear: a timber rail on two
    posts, spears standing in it"""
    x, z0 = (GATE_I - .5) * S, 0
    out = [on(RB, x, GRASS, z0 + 10, '3005'), on(RB, x, GRASS, z0 + 50, '3005'), put(RB, x, GRASS + B + P, z0 + 30, '3623', RY(math.pi / 2))]
    out += [put(RB, x, GRASS + B + 2 * P, z0 + 10, '3070b'), put(RB, x, GRASS + B + 2 * P, z0 + 50, '3070b')]
    out += [on(DB, x, GRASS + B + P, z0 + 30, '3062b')]
    for dz in (0, 20, 40, 60): out.append(row(PLG if dz % 40 else GOLD, M(T(x - 14, -(GRASS + 6), z0 + dz), RZ(0.12)), '4497'))
    return out, {(GATE_I - 1, k) for k in (0, 1, 2)}


def beached_boat():
    """a fishing boat drawn up on the sand: a keel plate, low sides, a pair of oars across it"""
    x, z = 60, 280
    out = [put(RB, x, GRASS + P, z, '3795'), put(RB, x, GRASS + P + B, z - 10, '3009'), put(DB, x, GRASS + P + B, z + 10, '3009')]
    out += [put(RB, x - 40, GRASS + P + B + P, z, '3023', RY(math.pi / 2)) if False else put(DB, x, GRASS + P + B + P, z - 10, '3666')]
    return out, {(i, k) for i in range(0, 6) for k in (14,)} | {(i, 13) for i in range(0, 6)}


def altar():
    """the altar of the court before the porch: a stone block, a hearth-plate, the fire of the sacrifice"""
    x, z = -220, -120
    return [on(LBG, x, GRASS, z, '3003'), put(DTAN, x, GRASS + B + P, z, '3022'), on(TORANGE, x - 10, GRASS + B + P, z - 10, '3062b'),
            on(YELLOW, x - 10, GRASS + 2 * B + P, z - 10, '4589'), on(ORANGE, x + 10, GRASS + B + P, z + 10, '4589'),
            put(DB, x + 10, GRASS + B + 2 * P, z - 10, '3024'), put(DB, x - 10, GRASS + B + 2 * P, z + 10, '3024')], \
        {(i, k) for i in (-12, -11) for k in (-7, -6)}


def ground(blocked, region=None):
    """tiles over the baseplates wherever nothing stands: the sea, the beach, the road, the paving of the court and the porch, and the
    island's ground in patches of dry grass, olive and earth"""
    def col(i, k):
        if SEA(i, k):
            near = any(not SEA(i + a, k + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if near: return WHITE if (i + k) % 3 == 0 else MBLUE
            t = ((i // 2) * 7 + (k // 2) * 3) % 9
            return TLBLUE if t == 0 else DBLUE if t in (3, 5, 7) else BLUE
        if BEACH(i, k): return TAN if (i + k) % 5 else BLORANGE
        if COURT_I[0] <= i <= COURT_I[1] and COURT_K[0] <= k <= COURT_K[1]:
            return DTAN if (i // 2 + k // 2) % 3 == 0 else TAN
        if on_road(i, k): return TAN if hsh(i, k) % 7 else (BLORANGE if hsh(i, k) % 2 else LBG)
        a, b = (i + (k // 3) % 2) // 3, k // 2
        v = hsh(a, b, 1) % 11
        return (DTAN, OLIVE, DGREEN, OLIVE, OLIVE, SANDGREEN, DTAN, OLIVE, DGREEN, SANDGREEN, GREEN)[v]
    free = (region or {(i, k) for i in range(I_LO, I_HI + 1) for k in range(K_LO, K_HI + 1)}) - blocked
    out, left = [], set(free)
    for (i, k) in sorted(free, key=lambda c: (c[1], c[0])):
        if (i, k) not in left: continue
        c = col(i, k)
        fine = on_road(i, k) or BEACH(i, k) or (SEA(i, k) and any(not SEA(i + a, k + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (0, 2))))
        court = COURT_I[0] <= i <= COURT_I[1] and COURT_K[0] <= k <= COURT_K[1]
        opts = ((((1, 1), '3070b', False),) if fine and (hsh(i, k, 4) % 3 == 0 or SEA(i, k)) else ()) + \
            ((((2, 1), '3069b', False),) if court and (k % 2 == 0) == (i % 2 == 0) else ()) + \
            ((((1, 2), '3069b', True),) if court else ()) + \
            ((((2, 2), '3068b', False),) if not court else ()) + (((1, 2), '3069b', True), ((2, 1), '3069b', False), ((1, 1), '3070b', False))
        for (w, l), part, rot in opts:
            cov = [(i + a, k + b) for a in range(w) for b in range(l)]
            if all(q in left and col(*q) == c for q in cov):
                for q in cov: left.discard(q)
                out.append(put(c, (i + w / 2) * S, TREAD, (k + l / 2) * S, part, RY(math.pi / 2) if rot else None))
                break
    return out


def bush_spots(blocked):
    out = []
    for i in range(I_LO + 1, I_HI):
        for k in range(K_LO + 1, K_HI):
            if (i, k) in blocked or SEA(i, k) or _cove(i, k) < 1.4 or on_road(i, k, 1.6) or (i, k) in PALACE_CELLS: continue
            if any((i + a, k + b) in PALACE_CELLS or (i + a, k + b) in blocked for a in (-1, 0, 1) for b in (-1, 0, 1)): continue
            if hsh(i, k, 31) % 5: continue
            if any(abs(i - a) < 3 and abs(k - b) < 3 for a, b in out): continue
            out.append((i, k))
    return out


def bushes(blocked):
    """maquis on the open ground: a stem of timber, a spray of leaves, dark green or olive"""
    out, cells = [], set()
    for n, (i, k) in enumerate(bush_spots(blocked)):
        x, z = (i + .5) * S, (k + .5) * S
        out += [on(RB, x, GRASS, z, '3062b'), on((DGREEN, OLIVE, GREEN)[n % 3], x, GRASS + B, z, '2423', n * 1.3 % (2 * math.pi) // (math.pi / 2) * math.pi / 2)]
        cells.add((i, k))
    return out, cells


def relief_h(i, k):
    """the lie of the open ground in plates: gentle swells, flat near the road, the shore, the palace and the frame"""
    if on_road(i, k, 2.2) or SEA(i, k) or _cove(i, k) < 1.55 or (i, k) in PALACE_CELLS: return 0
    if any((i + a, k + b) in PALACE_CELLS for a in (-1, 0, 1) for b in (-1, 0, 1)): return 0
    if i in (I_LO, I_HI) or k in (K_LO, K_HI): return 0
    v = 1.7 + 1.6 * math.sin(i * 0.41 + 0.7) * math.sin(k * 0.53 - 0.3) + 0.8 * math.sin((i - k) * 0.29 + 1.1)
    return int(max(0, min(4, round(v))))


def relief(blocked):
    """a form of plates over the open ground, earth under a skin of dry grass: returns (rows, cells it covers)"""
    f = Form(y0=GRASS, unit=P)
    for i in range(I_LO, I_HI + 1):
        for k in range(K_LO, K_HI + 1):
            if (i, k) in blocked: continue
            hz = relief_h(i, k)
            for h in range(hz): f.vox[(i, h, k)] = 'e'
    def col(m, i, h, k):
        if (i, h + 1, k) in f.vox: return (DTAN, DB, DTAN)[h % 3] if hsh(i // 2, k // 2, h) % 3 else DB
        a, b = (i + (k // 3) % 2) // 3, k // 2
        return (OLIVE, DGREEN, OLIVE, SANDGREEN, DTAN, OLIVE, GREEN, SANDGREEN, DTAN)[hsh(a, b, 21) % 9]
    return f.parts(col), {(i, k) for (i, h, k) in f.vox if h == 0}


def base():
    return [put(TAN, -160, GRASS, 0, '3811'), put(TAN, 320, GRASS, 0, '3857', RY(math.pi / 2))]


FRAME, FRAME_CELLS = frame(-480, -320, 48, 32, GRASS, plate=16)


def wall_cells():
    """every baseplate cell a wall, the megaron or the porch stands on"""
    c = set()
    i0, i1 = MEG_I; k0, k1 = MEG_K
    c |= {(i, k) for i in range(i0, i1 + 1) for k in (k0, k1)} | {(i, k) for i in (i0, i1) for k in range(k0, PORCH_K[1] + 1)}
    c |= {(i, k1 - 1) for i in DOOR_I}
    c |= {(i, k) for i in range(i0 + 1, i1) for k in PORCH_K}
    c |= {(-23, k) for k in range(-15, FRONT_K)} | {(GATE_I, k) for k in range(-15, FRONT_K) if k not in GATE_K}
    c |= {(i, -15) for i in (-22, -21, -6, -5, -4)} | {(i, FRONT_K) for i in range(-23, GATE_I + 1)}
    c |= gate_cells()
    c |= {(i, k) for i in range(i0 + 1, i1) for k in range(k0 + 1, k1 - 1)}          # under the roof
    return c


def details():
    """everything but the sculpted land: returns (rows, cells of the baseplate they stand on)"""
    rows, cells = [], set()
    rows += megaron() + court_walls() + gate()
    cells |= wall_cells()
    sx, sz = ROOF_SMOKE
    rows += smoke(sx, sz, MEG_TOP + 3 * P) + upper_storey()
    for fn in (hides, draughts, krater, field_wall, ship, jetty, houses, altar, pen, sea_rocks, townsfolk, well, spear_rack):
        r, c = fn(); rows += r; cells |= c
    r, c = people_below(); rows += r; cells |= c
    rows += trees(); cells |= tree_cells() | olive_cells()
    rows += streak(); cells |= step_cells(*STEPS[-1][:2])
    rows += athena_flying() + sparkle() + puffs() + vines()
    r, c = road_walls(cells | set(FRAME_CELLS)); rows += r; cells |= c
    r, c = bushes(cells | land_cells() | set(FRAME_CELLS)); rows += r; cells |= c
    r, c = relief(cells | land_cells() | set(FRAME_CELLS)); rows += r; cells |= c
    return rows, cells


def roof_rows():
    return ROOF.parts(roof_colour)


def everything(rot=0.0, with_ground=True):
    rows, cells = details()
    blocked = cells | land_cells() | set(FRAME_CELLS)
    g = ground(blocked) if with_ground else []
    return base() + FRAME + g + rows + roof_rows() + platform(rot)


def paving(cells, col=lambda i, k: DTAN if (i // 2 + k // 2) % 3 == 0 else TAN):
    """tiles on a sub-assembly's base over the given cells"""
    out, left = [], set(cells)
    for (i, k) in sorted(cells, key=lambda c: (c[1], c[0])):
        if (i, k) not in left: continue
        c = col(i, k)
        fine = on_road(i, k) or BEACH(i, k) or (SEA(i, k) and any(not SEA(i + a, k + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (0, 2))))
        court = COURT_I[0] <= i <= COURT_I[1] and COURT_K[0] <= k <= COURT_K[1]
        for (w, l), part, rot in (((2, 2), '3068b', False), ((1, 2), '3069b', True), ((2, 1), '3069b', False), ((1, 1), '3070b', False)):
            cov = [(i + a, k + b) for a in range(w) for b in range(l)]
            if all(q in left and col(*q) == c for q in cov):
                for q in cov: left.discard(q)
                out.append(put(c, (i + w / 2) * S, TREAD, (k + l / 2) * S, part, RY(math.pi / 2) if rot else None))
                break
    return out


def sub_olympus():
    """the platform of Olympus on its turntable, on a short cloud stand: the council, the thrones, the colonnade and pediment"""
    top = GRASS + 3 * B
    out = [put(WHITE, 0, GRASS, 0, '3867')]
    for c in range(3):
        out += [put(WHITE if c != 1 else LBG, 0, GRASS + (c + 1) * B, -20 if c % 2 else 0, '3001', None if c % 2 == 0 else None)] if False else []
    out += [put(WHITE, 0, GRASS + B, -20, '3001'), put(WHITE, 0, GRASS + B, 20, '3001'),
            put(LBG, -20, GRASS + 2 * B, 0, '3001', RY(math.pi / 2)), put(LBG, 20, GRASS + 2 * B, 0, '3001', RY(math.pi / 2)),
            put(WHITE, 0, GRASS + 3 * B, -20, '3001'), put(WHITE, 0, GRASS + 3 * B, 20, '3001')]
    for (x, z) in ((-60, -20), (-60, 20), (60, -20), (60, 20)):                  # cloud round the foot of the stand
        out.append(put(TCLEAR if x < 0 else WHITE, x, GRASS + B, z, '3003'))
    out.append(put(DGRAY, 0, top + 16, 0, '61485c01'))
    dy = TT_TOP - (top + 16)
    out += place(T(0, dy, 0), platform_local())
    return out


def sub_descent():
    """Athena's flight on its own: the trail of clear and golden round bricks, the goddess half way down, on a small base"""
    bx, bz = STEPS[-1][:2]
    m = T(-bx + 60, 0, -bz + 60)
    rows = [put(WHITE, 0, GRASS, 0, '3867')] + place(m, streak() + athena_flying())
    cells = {(i, k) for i in range(-8, 8) for k in range(-8, 8)} - {(i + (-bx + 60) // S, k + (-bz + 60) // S) for (i, k) in step_cells(bx, bz)}
    return rows + paving(cells, lambda i, k: WHITE if (i + k) % 5 else LBG)


def sub_suitors():
    """the forecourt's feast on its own: the ox-hides, the draughts board and its players, the loungers, the krater and the heralds"""
    rows = [put(TAN, -260, GRASS, -40, '3857')]
    r1, c1 = hides(); r2, c2 = draughts(); r3, c3 = krater()
    rows += r1 + r2 + r3
    cells = c1 | c2 | c3
    for card, sub, x, z, rot in PLAYERS + LOUNGERS:
        rows += sit(card, sub, x, TREAD, z, rot)
    for card, sub, x, z, rot in STANDERS + HERALDS:
        rows += figure(card, sub, x, GRASS, z, rot); cells |= feet(x, z, rot)
    region = {(i, k) for i in range(-29, 3) for k in range(-10, 6)}
    return rows + paving(region - cells)


def sub_gate():
    """the outer gate on its own: a length of the court's east wall, the gateway, the leaves open, Telemachus on his stool inside,
    Mentes outside with the bronze spear, the road at his feet"""
    rows = [put(TAN, -60, GRASS, -80, '3867')]
    rows += east_wall(list(range(-11, 3))) + gate()
    tx, tz, tr = TELEMACHUS
    s_, sc = stool(tx, tz); rows += s_ + sit('character.telemachus', 'telemachus', tx, GRASS + B, tz, tr)
    mx, mz, mr = MENTES
    rows += mentes(mx, mz, mr)
    region = {(i, k) for i in range(-11, 5) for k in range(-12, 4)}
    blocked = {(GATE_I, k) for k in range(-11, 3) if k not in GATE_K} | gate_cells() | sc | feet(mx, mz, mr)
    inside = lambda i, k: i < GATE_I
    return rows + paving(region - blocked, lambda i, k: (DTAN if (i // 2 + k // 2) % 3 == 0 else TAN) if inside(i, k) else
                         (TAN if on_road(i, k) else OLIVE if hsh(i // 2, k // 2) % 3 else DTAN))


SUBS = [('olympus', 'Olympus: the council on its turntable', sub_olympus),
        ('descent', "Athena's flight", sub_descent),
        ('suitors', 'The suitors at draughts on the ox-hides', sub_suitors),
        ('gate', 'The stranger at the gate', sub_gate)]


if __name__ == '__main__':
    import time
    t0 = time.time()
    rows_d, cells_d = details()
    blocked = cells_d | set(FRAME_CELLS)
    pl = PFORM.settle(plat_colour, extra=lambda: ['0 !FORAGE ROOT', put(DGRAY, 0, TT_TOP, 0, '61485c01')] + council())
    print('platform settled,', len(pl), 'left')
    fixed = base() + FRAME + rows_d + roof_rows() + platform(0.0)
    protect = lambda v: form.vox.get(v) in ('core', 'seat', 'tstand', 'hstand', 'kstand') or v[1] in RINGS
    for _ in range(4):
        before = dict(form.vox)
        left = form.settle(colour, extra=lambda: fixed + ground(blocked | land_cells()), protect=protect,
                           can_grow=lambda v: v[1] not in RINGS and form.vox.get((v[0], v[1] + 1, v[2])) != 'cloud')
        if form.vox == before and not left: break
    print('land settled,', len(left), 'left', round(time.time() - t0), 's')
    rows_d, cells_d = details()                     # again: the plants avoid the settled land
    blocked = cells_d | set(FRAME_CELLS)
    ALL = base() + FRAME + ground(blocked | land_cells()) + land_rows() + rows_d + roof_rows()
    n = write('set.' + SLUG, 'Tell Me of the Man', ALL + platform(0.0))
    n_t = write('set.' + SLUG + '-turned', 'Tell Me of the Man (the council turned toward Ithaca)', ALL + platform(-math.pi / 2))
    print('set', n, 'turned', n_t)
    res = {}
    for nm in ('set.' + SLUG, 'set.' + SLUG + '-turned'): res[nm] = check(nm)
    for sub, title, fn in SUBS:
        nm = f'set.{SLUG}-{sub}'
        k_ = write(nm, 'Tell Me of the Man: ' + title, fn())
        res[nm] = check(nm)
        print(nm, k_)
    import json
    json.dump({k: v for k, v in res.items()}, open(os.path.join(SCR, 'checks.json'), 'w'))
    HW = 'odyssey-halfworld/'
    SUBIMG = {'olympus': 'olympus.jpg', 'descent': 'descent.jpg', 'suitors': 'suitors-sub.jpg', 'gate': 'gate-sub.jpg'}
    subs_text = {'olympus': 'The platform of Olympus on its turntable, lifted off the column and set on a short cloud stand: the bronze floor, the '
                            'colonnade and pediment, the snow crest, the thrones of Zeus and of absent Poseidon, the gods on their bench.',
                 'descent': 'The trail of clear, trans-yellow and pearl-gold round bricks, each a course lower and a stud on, with Athena in '
                            'her own form half way down it, her legs gold for the golden sandals.',
                 'suitors': 'The forecourt feast on its own paving: the ox-hides, Antinous and Amphinomus at draughts, the loungers with their '
                            'cups, the heralds at the krater, the steward and the men in the porch.',
                 'gate': 'A length of the court wall with the outer gate, its leaves swung back, the lintel; Telemachus on his stool inside, '
                         'Mentes outside with the bronze spear.'}
    manifest(SLUG, title='Tell Me of the Man', book='I', tier='Flagship',
             moment='While Poseidon is away among the Ethiopians the gods sit in council on Olympus, Zeus on one side and Athena answering '
                    'him on the other before the sea-god\'s empty throne; Athena binds on her golden sandals and darts down from the peaks, '
                    'and stands at the outer gate of Odysseus\'s house as Mentes, spear in hand, where the suitors lounge on the hides of the '
                    'oxen they have killed, playing at draughts, and Telemachus, sitting among them, is the first to see her.',
             quote='"Tell me, O Muse, of the man of many devices, who wandered full many ways after he had sacked the sacred citadel of '
                   'Troy." (Odyssey I.1-2, tr. A. T. Murray)',
             object='The council turns. The whole platform of Olympus stands on a 4 x 4 turntable (61485c01) on the top of the column: turn '
                    'it and the hall, thrones, gods and all, comes round from facing the viewer to looking down on Ithaca and the palace '
                    '(set.the-opening-turned). The poem opens on exactly that turn: with Poseidon away, the gods turn their minds to Odysseus. '
                    'Poseidon\'s empty throne, marked with his trident, is at the centre of the turn.',
             builds=[{'card': 'set.' + SLUG, 'title': 'Tell Me of the Man (the whole kit)'},
                     {'card': 'set.' + SLUG + '-turned', 'title': 'The council turned toward Ithaca'}] +
                    [{'card': f'set.{SLUG}-{s_}', 'title': t} for s_, t, _ in SUBS],
             images=[{'file': 'hero.jpg', 'caption': 'Gods above, men below, a goddess coming down between them: Olympus on its column of rock and '
                                                     'cloud, Ithaca on the base, Athena on the golden trail.',
                      'alt': 'A tall LEGO diorama: a round white and gold platform of gods on a grey rock column ringed with white cloud '
                             'shelves, a trail of clear and gold round bricks descending to a palace courtyard crowded with brightly dressed '
                             'minifigures, olive terraces, a cove with a black ship, houses and goats.'},
                     {'file': 'council.jpg', 'caption': 'The council: Zeus enthroned on one side, Athena answering him on the other, the gods on '
                                                        'their bench, and between them the empty sea-green throne marked with the trident.',
                      'alt': 'Close view of minifigure gods in white and gold on a checkered gold floor under a white pediment, an empty '
                             'teal throne with a trident tile at the centre.'},
                     {'file': 'gate.jpg', 'caption': 'The stranger at the gate: Mentes with the bronze spear at the foot of the trail, '
                                                     'Telemachus inside, the suitors beyond.',
                      'alt': 'A white-bearded minifigure with a gold spear standing at a timber-framed gateway in an ochre wall, a trail '
                             'of clear and yellow round bricks ending at his feet, a seated young man in blue inside.'},
                     {'file': 'suitors.jpg', 'caption': 'The suitors on the hides of the oxen they have killed, two of them at draughts, '
                                                        'the heralds at the krater.',
                      'alt': 'View down into a paved courtyard: seated minifigures in red, green, purple and blue raising goblets around a '
                             'small board of round black and white pieces, spotted hides under them.'},
                     {'file': 'landscape.jpg', 'caption': 'Ithaca: the cove and Mentes\' ship, the road up from the harbour, the olive terraces '
                                                          'and the town.',
                      'alt': 'A black ship with a red and white sail in a small blue cove, a stone mole, a road of light tiles climbing '
                             'between low stone walls and olive trees on terraces toward a palace.'},
                     {'file': 'turned.jpg', 'caption': 'The play feature: the council turned on its turntable to look down on Ithaca.',
                      'alt': 'The Olympus platform rotated a quarter turn so the gods and thrones face toward the palace below.'}] +
                    [{'file': SUBIMG[s_], 'caption': f'Sub-assembly: {t}.', 'alt': subs_text[s_]} for s_, t, _ in SUBS],
             features=['Olympus is a sculpted column of rock (tools/forage/product/sculpt.py) with three cloud shelves standing well out from '
                       'it: each shelf is a course laid in three plates bonded crosswise (white, clear-and-grey, white) so it can overhang, '
                       'with puffs of round bricks on it and crags jutting between.',
                       'The platform is a disc of plates on a 4 x 4 turntable: a bronze floor of pearl-gold and dark-orange squares with a '
                       'white rim and a white aisle to the empty throne, a colonnade of white round bricks under a stepped white pediment, '
                       'a crest of snow on the back rim, cloud hanging under its edge.',
                       'Athena\'s flight is a trail of 2 x 2 round bricks, each a course lower and a stud on, clicked one to the next from '
                       'the high cloud shelf to the ground by the gate; the goddess stands half way down it with golden legs for the sandals.',
                       'The palace front is ochre ashlar with a timber course and a fresco frieze, red Minoan columns with black capitals in '
                       'the porch, the dark hall behind the open door, the upper rooms with a window, and the smoke of the feast wavering up '
                       'from the roof in grey and clear round bricks.',
                       'The forecourt is paved in running bond; the suitors sit on spotted ox-hides round a raised draughts board with its '
                       'pieces; the heralds mix wine in a bronze krater; Telemachus sits on a stool facing the gate.',
                       'Ithaca around it: olive terraces with dry-stone faces and three-tier olives, vines, a road of light stones climbing '
                       'from the cove between low walls, swells of grassy ground in plates, two houses with a well and a goat-pen, a rocky '
                       'knoll with goats and their herdsman, cypresses and pines on the shoulder of the hill, a black ship at a stone mole.',
                       'Every card checks clean: every part clicked, no two parts in the same space; the nameplate and white tile ring are the '
                       'line\'s display base.'],
             subs=[{'file': SUBIMG[s_], 'title': t, 'pieces': pieces(f'set.{SLUG}-{s_}'), 'text': subs_text[s_]} for s_, t, _ in SUBS],
             sources=[HW + 'scenes/OD-B01-S01.mjs', HW + 'scenes/OD-B01-S02.mjs', HW + 'scenes/OD-B01-S03.mjs', HW + 'scenes/OD-B01-S04.mjs',
                      HW + 'scenes/OD-B01-S05.mjs', HW + 'scenes/OD-B01-S06.mjs', HW + 'assets/location/olympian-council-hall.mjs',
                      HW + 'assets/location/olympian-decision-space.mjs', HW + 'assets/location/odysseuss-palace-threshold-and-hall.mjs',
                      HW + 'assets/location/palace-outer-yard.mjs', HW + 'assets/location/ithacan-shore.mjs',
                      HW + 'assets/ensemble/assembly-of-gods.mjs', HW + 'assets/character/zeus.mjs', HW + 'assets/character/athena.mjs',
                      HW + 'assets/character/athena-as-mentes.mjs', HW + 'assets/character/telemachus.mjs',
                      HW + 'atlas/spoken-lines/lines-b01-03.json'],
             status='Built to the bar',
             next=['Figures, the trident, the spears, oars and the leaves of the trees are placed by hand and are not checked by the tool; '
                   'the seated pose (thighs on the studs) is computed, not verified in a real build.',
                   'The trail of round bricks is joined one stud-row to the next (a 1 x 2 overlap on 2 x 2 round bricks): honest on the '
                   'grid, but it would want a clear support rod in a real model.',
                   'The turntable carries an 18-stud disc and eight figures on one 4 x 4 bearing; a real build should brace the disc with '
                   'a second layer of long plates (it has two) and test it for sag.',
                   'The court is crowded: at the hero\'s distance the draughts board and the hides read only from above.',
                   'The cloud shelves under the platform merge with the hanging cloud ring into one white mass from some angles.',
                   'Homer puts the suitors in front of the doors and Athena at the outer gate; the kit compresses the court so both fit, '
                   'and the palace is a front and a courtyard, not a full megaron.',
                   'Piece count sits at the low end of the flagship budget; the hill of Neriton and the town could take more.'])
