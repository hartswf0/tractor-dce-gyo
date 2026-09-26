#!/usr/bin/env python3
"""tools/forage/product/kits/circes-house.py — CIRCE'S HOUSE (Odyssey X), a Large kit of the Odyssey line.

  python3 tools/forage/product/kits/circes-house.py    -> odyssey/cards/set.circes-house*.mpd, odyssey/kits/circes-house/kit.json

The moment: in the forest clearing stands Circe's house of dressed stone. She has given the men her drugged food and struck them with
her wand, and they are swine in her sty, swine in head, voice and bristles but with their own minds still.
Wolves and lions fawn at her gate. Odysseus comes up the path alone, sword drawn, the moly Hermes gave him in his other hand; the god
stands at the forest's edge behind him.

The base is 48 x 32. At the back the house (20 x 12 studs): a socle of dressed dark tan stone, timber-laced plastered walls above with a
fresco band, a flat roof with a parapet and a smoke-pot, a porch on two red columns. Its front wall and porch lift away as one module
to show the loom hall: Circe at her great web, the hearth, the table. At the left the walled sty, its gate on a hinge brick; in it the
swine: pigs, and the men with their heads swapped for pig heads (one still half changed, a pig's head-cover over his own). Oaks of the
forest round the clearing, their crowns sculpted in plates. The play: swap the heads, swing the gate, lift the front off the hall.
"""
import math, os, sys, copy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *

SLUG = 'circes-house'
AUTH = 'tools/forage/product/kits/circes-house.py'
BASE = 4
X0, Z0, W, D = -480, -320, 48, 32
PINK = 29
FRAME, RING = frame(X0, Z0, W, D, BASE)
def free(i, k): return (i, k) not in RING and -24 <= i < 24 and -16 <= k < 16


# ── the house (plate cells; the front wall and porch are a module of their own) ──
HI, HK = (-21, -2), (-15, -4)          # walls: i -21..-2, k -15..-4 (x -420..-20, z -300..-60); front wall k -4
DOOR = (-12, -11)                       # the doorway's two studs in the front wall
PORCH_I, PORCH_K = (-15, -8), (-3, -1)  # the porch roof, on two red columns
COLS = [(-280, -20), (-160, -20)]       # the columns (2 x 2, centre on a stud corner)
ROOF_H = 22                             # the roof slab's plate layer
CHIMNEY = (-80, -240)


def wall_mat(h):
    if h < 6: return 'socle'
    if h in (6, 15, 21): return 'timber'
    if h in (7, 8): return 'fresco'
    return 'plaster'


def house_cells():
    main, front = {}, {}
    for i in range(HI[0], HI[1] + 1):
        for k in range(HK[0], HK[1] + 1):
            wall = i in HI or k in HK
            tgt = front if k == HK[1] else main
            if wall:
                for h in range(0, ROOF_H + 3):
                    if h < ROOF_H: m = wall_mat(h)
                    else: m = 'parapet'
                    if k == HK[1] and DOOR[0] <= i <= DOOR[1] and h < 15: continue                  # the doorway
                    if k == HK[1] and i in (-18, -17, -6, -5) and 9 <= h < 15: continue            # front windows
                    if i in HI and k in (-10, -9) and 9 <= h < 15: continue                         # side windows
                    tgt[(i, h, k)] = m
            else:
                tgt[(i, ROOF_H, k)] = 'roof'; tgt[(i, ROOF_H + 1, k)] = 'roof'
    for i in range(PORCH_I[0], PORCH_I[1] + 1):
        for k in range(PORCH_K[0], PORCH_K[1] + 1):
            front[(i, ROOF_H, k)] = 'porch'; front[(i, ROOF_H + 1, k)] = 'porch'
    ci, ck = CHIMNEY[0] // S, CHIMNEY[1] // S
    for a in (-1, 0):
        for b in (-1, 0): main[(ci + a, ROOF_H + 1, ck + b)] = 'rpad'
    return main, front


house, front = Form(y0=BASE, keep_studs=('rpad',), unit=P), Form(y0=BASE, unit=P)
house.vox, front.vox = house_cells()


def house_colour(m, i, h, k):
    if m == 'socle':
        a = (i + 2 * ((h // 3) % 2)) // 3
        return DBG if (a * 5 + k + h // 3) % 7 == 0 else TAN if (a + h // 3) % 3 == 0 else DTAN
    if m == 'timber': return RB
    if m == 'fresco': return MBLUE if ((i + k) // 2) % 3 else RED
    if m == 'plaster': return TAN
    if m == 'parapet': return TAN if h < ROOF_H + 2 else DTAN
    if m == 'roof': return DTAN
    if m == 'porch': return RB if h == ROOF_H else DTAN
    if m == 'rpad': return DTAN
    return TAN


# ── the sty (plate cells, three bricks high, capped) ──
STY_I, STY_K = (5, 20), (1, 12)         # walls round x 100..420, z 20..260
GATE_K = (5, 10)                        # the hinge base at k 5..6, the gate leaf across k 7..10 in the wall at i 5
sty = Form(y0=BASE, unit=P)
for i in range(STY_I[0], STY_I[1] + 1):
    for k in range(STY_K[0], STY_K[1] + 1):
        if not (i in STY_I or k in STY_K): continue
        if i == STY_I[0] and GATE_K[0] <= k <= GATE_K[1]: continue
        for h in range(9): sty.vox[(i, h, k)] = 'stone'


def sty_colour(m, i, h, k):
    a = (i + k + 2 * ((h // 3) % 2)) // 2
    return LBG if (a * 3 + h // 3) % 5 == 0 else DTAN if (a + h // 3) % 7 == 0 else DBG


# ── where things stand ──
PIGS = [(200, 100, 0.0), (300, 60, math.pi / 2), (360, 180, math.pi)]                  # pig (x, z, turn): each on a 2 x 4 of mud
SWINE_MEN = [(180, 200, 0), (260, 140, math.pi), (340, 120, -math.pi / 2), (240, 220, math.pi / 2)]   # the men, pig-headed
TROUGH = (300, 230)                     # a 1 x 6 trough along x (centre on a stud corner in x, a stud centre in z)
ODYSSEUS = (-330, 200)                  # come up the path, turned toward the court and the sty (+x)
HERMES = (-430, 260)                    # facing +x, toward Odysseus
BEASTS = [('wolf', -280, 110, math.pi * 0.0), ('lion', -160, 100, math.pi / 2), ('wolf', -210, 190, math.pi / 2),
          ('lion', -250, 30, math.pi)]
CIRCE = (-140, -230)                    # at the loom's end, facing the hall (+z)
LOOM = (-220, -270)                     # the web's centre: a 1 x 6 row along x on the back wall's inner face
HEARTH = (-220, -160)
TABLE = (-340, -160)
TREES = [(-440, 140), (60, 280), (440, 20), (-60, 280)]
OAKS = [(200, -200, 1.0), (400, -100, 0.8), (-440, 20, 0.75), (40, -260, 0.55), (40, 40, 0.65), (420, 280, 0.6)]


def pads():
    """stud squares whose studs are kept: the ground under every foot, beast, trunk and thing that stands"""
    out = set()
    sq = lambda x, z, w=1, d=1: {(math.floor(x / S) + a, math.floor(z / S) + b) for a in range(w) for b in range(d)}
    for x, z, r in PIGS: out |= sq(x - 20, z - 40, 2, 4) if abs(math.sin(r)) < 0.5 else sq(x - 40, z - 20, 4, 2)
    for x, z, r in SWINE_MEN: out |= (sq(x - 10, z) | sq(x + 10, z)) if abs(math.sin(r)) < 0.5 else (sq(x, z - 10) | sq(x, z + 10))
    out |= sq(TROUGH[0] - 60, TROUGH[1], 6, 1)
    out |= sq(ODYSSEUS[0], ODYSSEUS[1] - 10) | sq(ODYSSEUS[0], ODYSSEUS[1] + 10)
    out |= sq(HERMES[0], HERMES[1] - 10) | sq(HERMES[0], HERMES[1] + 10)
    for _, x, z, r in BEASTS: out |= sq(x - 20, z - 20, 2, 2)
    out |= sq(CIRCE[0] - 10, CIRCE[1]) | sq(CIRCE[0] + 10, CIRCE[1])
    out |= sq(LOOM[0] - 70, LOOM[1] - 10, 8, 1)
    out |= sq(HEARTH[0] - 40, HEARTH[1] - 40, 4, 4)
    out |= sq(TABLE[0] - 40, TABLE[1] - 20, 4, 2) | sq(TABLE[0] - 40, TABLE[1] + 40, 4, 1)
    for x, z in COLS: out |= sq(x - 20, z - 20, 2, 2)
    for x, z, *_ in OAKS + TREES: out |= sq(x - 20, z - 20, 2, 2)
    return out


PADS = pads()


def in_house(i, k): return HI[0] < i < HI[1] and HK[0] < k < HK[1]
def in_sty(i, k): return STY_I[0] < i < STY_I[1] and STY_K[0] < k < STY_K[1]


def zone(i, k):
    """what covers the baseplate at (i, k): the hall's floor, the court, the paths, the sty's mud, or grass (the baseplate's own turf)"""
    x, z = (i + 0.5) * S, (k + 0.5) * S
    if in_house(i, k): return 'floor'
    if in_sty(i, k): return 'mud'
    if HI[0] <= i <= HI[1] and -3 <= k <= 4: return 'court'                                   # the paved court before the porch
    if -400 <= x < -300 and 100 <= z < 300: return 'path'                                    # the path up from the shore
    if -20 <= x < 100 and 140 <= z < 220: return 'path'                                      # the path to the sty gate
    if i == STY_I[0] and GATE_K[0] <= k <= GATE_K[1]: return 'path'                          # the gateway
    if (i, k) in PADS: return 'pad'
    n = math.sin(x / 47 + 0.3) * math.sin(z / 39) + 0.5 * math.sin((x + 2 * z) / 71)
    return 'turf' if n > 0.55 else 'grass'                                                    # tiled grass, turf (studs) in patches


ground = Form(y0=BASE, keep_studs=('pad', 'turf'), unit=P)
for i in range(-24, 24):
    for k in range(-16, 16):
        if not free(i, k) or (i, 0, k) in house.vox or (i, 0, k) in front.vox or (i, 0, k) in sty.vox: continue
        z_ = zone(i, k)
        if z_: ground.vox[(i, 0, k)] = 'pad' if (i, k) in PADS else z_
# the gate's hinge base stands on the baseplate at k 5..6 (its own studs): keep that ground clear
for k in (GATE_K[0], GATE_K[0] + 1): ground.vox.pop((STY_I[0], 0, k), None)


def ground_colour(m, i, h, k):
    if m == 'pad':
        z_ = zone(i, k) if (i, k) not in PADS else None
        x, z = (i + 0.5) * S, (k + 0.5) * S
        if in_house(i, k): return TAN
        if in_sty(i, k): return DB
        return GREEN
    if m == 'floor': return TAN if (i // 2 + k // 2) % 4 else DTAN
    if m == 'court': return DTAN if (i // 2 + k // 2) % 3 else TAN
    if m == 'path': return DTAN if (i * 3 + k) % 5 else TAN
    if m == 'mud': return DB if (i // 2 * 3 + k // 2) % 4 else RB
    if m == 'turf': return DGREEN
    return DGREEN if (i // 3 * 5 + k // 3 * 3) % 7 == 0 else GREEN


# ── the oaks: trunks of round bricks, crowns sculpted in plates ──
def oak_forms():
    forms = []
    for x, z, s in OAKS:
        tops = BASE + 8 + 24 * round(5 * s + 1)
        f = Form(y0=tops, unit=P)
        rx, ry = 100 * s, 64 * s
        def crown(p, x=x, z=z, rx=rx, ry=ry):
            d = smin(ell(p, (x, tops + ry, z), (rx, ry, rx * 0.85)), ell(p, (x + 40 * s, tops + ry * 1.3, z - 30 * s), (rx * 0.6, ry * 0.8, rx * 0.6)), 30)
            return d + rough(p, 10, x / 50), 'leaf'
        f.carve(crown, range(math.floor((x - rx - 60) / S), math.ceil((x + rx + 60) / S)), range(0, 14),
                range(math.floor((z - rx - 60) / S), math.ceil((z + rx + 60) / S)))
        for v in [v for v in f.vox if not free(v[0], v[2]) or (HI[0] - 1 <= v[0] <= HI[1] + 1 and HK[0] - 1 <= v[2] <= 0)]: del f.vox[v]
        f.hollow(side=2, up=3, pillar=3)
        for h in range(0, round(ry / P) + 3):                                   # a solid core over the trunk, so the crown holds on it
            r = 1 if h < 2 else 2
            for a in range(-r, r):
                for b in range(-r, r): f.vox[(x // S + a, h, z // S + b)] = 'leaf'
        forms.append((f, x, z, tops))
    return forms


OAKF = oak_forms()


def leaf_colour(m, i, h, k):
    a, b = i // 2, k // 2
    return GREEN if (a * 3 + b + h // 3) % 4 == 0 else DGREEN


def oak_trunks():
    out = []
    for f, x, z, tops in OAKF:
        n = round((tops - BASE - 8) / 24)
        out += [on(RB if j % 3 else DB, x, BASE + 8 + 24 * j, z, '3941') for j in range(n)]
    return out


# ── the things ──
def swine_man(n, x, z, r, half=False):
    """a sailor whose head is a pig's (67887p01); `half`: his own head still on, a pig head-cover over it"""
    rows = figure('ensemble.crew', f'sailor-{n}', x, BASE + 8, z, r, drop=('2542', '3901', '11256'))
    out = []
    for l in rows:
        t = l.split()
        if re.match(r'3626', t[-1]):
            if half:
                out.append(l)
                t[1], t[-1] = str(PINK), '17351p01.dat'; out.append(' '.join(t))
            else:
                t[1], t[-1] = str(PINK), '67887p01.dat'; out.append(' '.join(t))
        else: out.append(l)
    return out


import re


def the_sty():
    out = []
    for x, z, r in PIGS: out.append(on(PINK, x, BASE + 8, z, '87621p01', r))
    for n, (x, z, r) in enumerate(SWINE_MEN): out += swine_man(n + 1, x, z, r, half=(n == 3))
    x, z = TROUGH
    out += [on(RB, x, BASE + 8, z, '3009')]                                               # the trough, a 1 x 6 brick
    out += [put(RB, x + dx, BASE + 8 + 24 + 8, z, '98138p86') for dx in (-50, -30, 10, 30)]   # acorns and cornel-berries thrown in it
    return out


def gate(opened=False):
    """the gate: a hinge brick's base (3831) on the baseplate at the wall's end, its top (3830) swinging on it, a 1 x 4 x 2 lattice fence
    on the top: shut, it closes the gap in the wall; open, it swings out toward the court. The fence is held by the hinge, not by studs
    below it, so it is marked as its own anchor."""
    base = mat_mul(T(STY_I[0] * S + 20, -(BASE + 24), (GATE_K[0] + 2) * S), RY(-math.pi / 2))
    top = mat_mul(base, RY(-math.pi / 2)) if opened else base
    return [row(RB, base, '3831'), row(RB, top, '3830')] + root([row(RB, mat_mul(top, T(40, -48, 10)), '3185')])


def loom():
    """Circe's great web on an upright loom against the back wall: two posts (a 1 x 1 x 5 brick and a 1 x 1 brick each), a 1 x 8
    beam across their tops, the web hanging from the beam in bands of 1 x 6 bricks (white, fresco red and blue, a gold thread), and
    the loom-weights in a row on the floor beneath it"""
    x, z = LOOM
    y = BASE + 8
    out = [on(RB, x - 70, y, z, '2453b'), on(RB, x + 70, y, z, '2453b'), on(RB, x - 70, y + 120, z, '3005'), on(RB, x + 70, y + 120, z, '3005')]
    out.append(on(RB, x, y + 144, z, '3460'))
    bands = [WHITE, RED, WHITE, GOLD, MBLUE]                                   # top to bottom, hung from the beam
    out += [put(bands[j], x, y + 144 - 24 * j, z, '3009') for j in range(len(bands))]
    out += [on(DBG, x + dx, y, z, '4589') for dx in (-50, -30, -10, 10, 30, 50)]
    return out


def hearth():
    x, z = HEARTH
    y = BASE + 8
    out = [on(BLK, x, y, z, '3003')]
    for dx in (-30, 30):
        for dz in (-30, -10, 10, 30): out.append(on(LBG, x + dx, y, z + dz, '3062b'))
    for dx in (-10, 10):
        for dz in (-30, 30): out.append(on(LBG, x + dx, y, z + dz, '3062b'))
    out += [on(TORANGE, x - 10, y + 24, z - 10, '3062b'), on(TORANGE, x + 10, y + 24, z + 10, '3062b'),
            on(ORANGE, x - 10, y + 48, z - 10, '4589'), on(TORANGE, x + 10, y + 48, z + 10, '4589'), on(YELLOW, x + 10, y + 24, z - 10, '4589')]
    return out


def table():
    """a table (a 2 x 4 plate on four round-brick legs) with the drugged food and wine, a bench before it"""
    x, z = TABLE
    y = BASE + 8
    out = [on(RB, x + dx, y + 24 * j, z + dz, '3062b') for dx in (-30, 30) for dz in (-10, 10) for j in range(2)]
    out.append(put(RB, x, y + 48 + 8, z, '3020'))
    out += [on(GOLD, x - 20, y + 56, z, '4740'), on(WHITE, x + 10, y + 56, z - 10, '3062b'), on(DRED, x + 30, y + 56, z + 10, '6141')]
    out += [on(RB, x + dx, y, z + 50, '3062b') for dx in (-30, 30)] + [put(RB, x, y + 24 + 8, z + 50, '3666', RY(0) if False else T(0, 0, 0))]
    return out


def columns():
    out = []
    for x, z in COLS:
        y = BASE + 8                                                           # on the court's kept studs
        out.append(on(DTAN, x, y, z, '4032a')); y += 8
        for j in range(6): out.append(on(RED if j else DRED, x, y, z, '3941')); y += 24
        out += [on(BLK, x, y, z, '4032a'), on(DTAN, x, y + 8, z, '3022')]
    return out


def chimney():
    x, z = CHIMNEY
    y = BASE + (ROOF_H + 2) * P
    return [on(DTAN, x, y, z, '3941'), on(TCLEAR, x, y + 24, z, '3941'), on(TCLEAR, x - 0, y + 48, z, '3942c'),
            on(TCLEAR, x, y + 96, z, '3941')] if False else [on(DTAN, x, y, z, '3941'), on(TCLEAR, x, y + 24, z, '3941'), on(TCLEAR, x, y + 48, z, '3941'), on(TCLEAR, x, y + 72, z, '3942c')]


def the_hall(): return loom() + hearth() + table() + figure('character.circe', 'circe', CIRCE[0], BASE + 8, CIRCE[1], math.pi)


def the_court():
    out = []
    for kind, x, z, r in BEASTS:
        out.append(on(DBG if kind == 'wolf' else MNOUGAT, x, BASE + 8, z, '48812' if kind == 'wolf' else '14734', r))
    x, z = ODYSSEUS
    out += figure('character.odysseus', 'odysseus', x, BASE + 8, z, -math.pi / 2, drop=('4499',))
    hx, hz, hy = x + 10, z + 35, BASE + 8 + 66                                                  # his left hand: the moly
    out += [put(BLK, hx, hy + 30, hz, '30374'), put(WHITE, hx, hy + 30 + 2, hz, '3742')]      # black root and stem, milk-white flower
    x, z = HERMES
    out += figure('character.hermes', 'hermes', x, BASE + 8, z, -math.pi / 2)
    return out


def greenery():
    """ferns and flowers on the turf's studs, stock trees at the clearing's edge"""
    out = []
    for (i, h, k), m in sorted(ground.vox.items()):
        if m == 'turf' and (i * 7 + k * 11) % 13 == 0:
            out.append(on(DGREEN if (i + k) % 2 else GREEN, (i + 0.5) * S, BASE + 8, (k + 0.5) * S, '6255', (i % 4) * math.pi / 2))
        elif m == 'turf' and (i * 5 + k * 3) % 17 == 0:
            out.append(on(WHITE if i % 2 else YELLOW, (i + 0.5) * S, BASE + 8, (k + 0.5) * S, '3742'))
    for x, z in TREES:
        out += [on(RB, x, BASE + 8, z, '3941'), on(DGREEN, x, BASE + 32, z, '3470')]
    return out


def baseplates():
    return [put(GREEN, -160, BASE, 0, '3811'), put(GREEN, 320, BASE, 0, '3857', RY(math.pi / 2))]


def details(opened=False):
    return FRAME + the_sty() + gate(opened) + the_hall() + chimney() + the_court() + oak_trunks() + greenery() + \
        ([] if opened else columns())


FORMS = [('house', house, house_colour), ('front', front, house_colour), ('sty', sty, sty_colour), ('ground', ground, ground_colour)] + \
        [(f'oak{n}', f, leaf_colour) for n, (f, _, _, _) in enumerate(OAKF)]


def rows_of(skip=(), opened=False):
    out = baseplates()
    for name, f, c in FORMS:
        if name not in skip: out += f.parts(c)
    return out + details(opened)


def settle_all():
    left = None
    for _ in range(6):
        before = [dict(f.vox) for _, f, _ in FORMS]
        left = []
        for name, f, c in FORMS:
            protect = (lambda v, f=f: f.vox.get(v) in ('pad', 'rpad')) if name != 'front' else (lambda v: True)
            if name.startswith('oak'):
                oak = next(o for o in OAKF if o[0] is f)
                protect = lambda v, o=oak: v[1] == 0 and abs((v[0] + 0.5) * S - o[1]) < 20 and abs((v[2] + 0.5) * S - o[2]) < 20
            left += f.settle(c, extra=lambda name=name: [r for r in rows_of(skip=(name,))], protect=protect)
        # the open state: the hall without its front module must hold too
        left += house.settle(house_colour, extra=lambda: rows_of(skip=('house', 'front'), opened=True),
                             protect=lambda v: house.vox.get(v) == 'rpad')
        if [dict(f.vox) for _, f, _ in FORMS] == before and not left: break
    return left


def crop_rows(x0, x1, z0, z1, names):
    out = []
    for name, f, c in FORMS:
        if name not in names: continue
        g = copy.copy(f); g.vox = {v: m for v, m in f.vox.items() if x0 <= (v[0] + 0.5) * S < x1 and z0 <= (v[2] + 0.5) * S < z1}
        out += g.parts(c)
    return out


def within(rows, x0, x1, z0, z1):
    return [r for r in rows if r.startswith('1 ') and x0 <= float(r.split()[2]) < x1 and z0 <= float(r.split()[4]) < z1]


if __name__ == '__main__':
    print('settle', len(settle_all()))
    n = write('set.' + SLUG, "Circe's House", rows_of(), AUTH)
    n2 = write(f'set.{SLUG}-open', "Circe's House (the front lifted away, the gate open)", rows_of(skip=('front',), opened=True), AUTH)
    subs = {
        'sty': ((80, 440, 0, 280), ('sty', 'ground'), the_sty(), 'The sty and the swine'),
        'loom-hall': ((-440, 0, -320, -60), ('house', 'ground'), the_hall() + chimney(), "Circe's loom hall"),
        'gate': ((-460, -140, -20, 300), ('ground',), the_court(), 'The wolves and lions at the gate'),
    }
    for sub, ((x0, x1, z0, z1), names, things, title) in subs.items():
        rows = crop_rows(x0, x1, z0, z1, names) + within(things, x0, x1, z0, z1) + (gate() if sub == 'sty' else [])
        if sub == 'gate': rows = [put(GREEN, -300, BASE, 140, '3867')] + [r for r in rows]
        write(f'set.{SLUG}-{sub}', f"Circe's House: {title}", rows, AUTH)
    print('pieces', n, 'open', n2)
    for c in ['set.' + SLUG, f'set.{SLUG}-open'] + [f'set.{SLUG}-{s}' for s in subs]: check(c)
    H = '/home/user/odyssey-halfworld/'
    manifest(SLUG, title="Circe's House", book='X', tier='Large',
             moment='In the stone house in the forest clearing Circe has struck the men with her wand and they are swine in her sty; wolves '
                    'and lions fawn at her gate, and Odysseus comes up the path with the moly Hermes gave him, sword drawn.',
             quote='"When they had drunk she turned them into pigs by a stroke of her wand, and shut them up in her pigsties." '
                   '(Odyssey X, tr. Samuel Butler)',
             object='The swine: sailor minifigures whose heads swap for pig heads (one still half changed, a pig head-cover over his own), '
                    'penned with three pigs behind a gate that swings open on a hinge brick.',
             builds=[{'card': 'set.' + SLUG, 'title': "Circe's House"},
                     {'card': f'set.{SLUG}-open', 'title': "Circe's House (front lifted away, gate open)"}] +
                    [{'card': f'set.{SLUG}-{s}', 'title': t[3]} for s, t in subs.items()],
             images=[{'file': 'hero.jpg', 'caption': 'The clearing: the stone house and its porch, the swine in the sty, the beasts fawning at the gate, Odysseus come up the path, Hermes behind him.',
                      'alt': 'A green diorama: a tan stone house with red columns, a grey-walled pen of pink-headed figures and pigs, oak trees, a red-clad minifigure with a sword.'},
                     {'file': 'open.jpg', 'caption': 'The front and porch lifted away, the sty gate swung open.',
                      'alt': 'The same diorama with the front wall of the house removed, showing a woman minifigure in the hall, and a lattice gate standing open.'},
                     {'file': 'hall.jpg', 'caption': "Circe's loom hall: her web on its upright loom, the hearth, the table of drugged food.",
                      'alt': 'Inside the house: a minifigure with a gold wand and cup before a banded web, a hearth of grey round bricks, a brown table and bench.'},
                     {'file': 'sty-close.jpg', 'caption': 'The swine: the men with pig heads, the pigs, the gate in the wall.',
                      'alt': 'Close view into a stone pen: minifigures with pig heads among pink pigs, a lattice gate in the wall.'},
                     {'file': 'court.jpg', 'caption': 'Wolves and lions fawn round Odysseus; he holds the moly, black root and white flower.',
                      'alt': 'A red-clad minifigure holding a black stem with a white flower, grey wolves and tan lion cubs round him, a figure in a gold helmet behind.'},
                     {'file': 'sty.jpg', 'caption': 'Sub-assembly: the sty and the swine.', 'alt': 'The pen on its own.'},
                     {'file': 'loom-hall.jpg', 'caption': "Sub-assembly: Circe's loom hall.", 'alt': 'The house cut open on its own.'},
                     {'file': 'gate.jpg', 'caption': 'Sub-assembly: the wolves and lions at the gate.', 'alt': 'Odysseus, Hermes and the beasts on a small base.'}],
             features=['A 48 x 32 base of two green baseplates, the line\'s white frame, black-and-gold nameplate and blue tile; grass laid in tiles with turf left in patches for ferns and flowers.',
                       'The house is laid in plate cells: a dressed socle of dark tan and tan ashlar, timber lacing in reddish-brown plates, a fresco band of blue and red, plastered courses, a flat roof inside a parapet with a smoke-pot.',
                       'The front wall and porch are one module that lifts off the baseplate, so the closed and open house are the same parts; both states are checked.',
                       'The porch stands on two red 2 x 2 round-brick columns with black capitals.',
                       'The sty gate is a lattice fence on a 1 x 4 hinge brick; it swings out toward the court.',
                       'The pig heads are minifigure pig heads (67887) on the sailors\' torsos; one man wears a pig head-cover (17351) over his own head, halfway.',
                       'Six oaks with crowns sculpted in plates over solid cores on round-brick trunks, the rest of the forest stock trees.'],
             subs=[{'file': f'set.{SLUG}-{s}.mpd', 'title': t[3], 'pieces': pieces(f'set.{SLUG}-{s}'),
                    'text': {'sty': 'The walled pen with its hinged gate, the trough of acorns, three pigs and four pig-headed men.',
                             'loom-hall': 'The house without its front: Circe at her loom, the hearth, the table and bench, the smoke-pot on the roof.',
                             'gate': 'Odysseus with sword and moly, Hermes, two wolves and a lion on a 16 x 16 base.'}[s]}
                   for s, t in subs.items()],
             sources=[H + 'assets/location/circes-forest-palace.mjs', H + 'assets/creature/crew-to-swine-variants.mjs',
                      H + 'assets/creature/enchanted-wolves-and-lions.mjs', H + 'assets/prop/moly-plant.mjs', H + 'scenes/OD-B10-S04.mjs',
                      H + 'scenes/OD-B10-S05.mjs', H + 'scenes/OD-B10-S06.mjs', H + 'scenes/OD-B10-S07.mjs'],
             status='Built to the bar',
             next=['The red columns are straight 2 x 2 round bricks; they do not taper downward as Minoan columns do.',
                   'The lions are the lion-cub animal part (14734); there is no adult lion in the parts library used.',
                   'The gate hinge and its fence, the figures, the heads and the moly are placed by hand and not checked by the tool; the fence is marked as held by its hinge.',
                   'The smoke is a short column of clear round bricks and a cone; it reads more as glass than as smoke.',
                   'The loom-hall sub-assembly is the house cut from the model without its roof module separated; a real instruction step would build the roof as its own lift-off.'])
