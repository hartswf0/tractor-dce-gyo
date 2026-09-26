#!/usr/bin/env python3
"""tools/forage/product/kits/calypso-raft.py — CALYPSO'S ISLE AND THE RAFT (Odyssey V), a Large kit of the Odyssey line.

  python3 tools/forage/product/kits/calypso-raft.py     -> odyssey/cards/set.calypso-raft*.mpd, odyssey/kits/calypso-raft/kit.json

The moment: on Ogygia, after Hermes has brought the gods' decree, Odysseus builds his raft on the shore with the tools Calypso gave him
(the bronze axe, the adze, the augers) while she watches from the mouth of her cave. The object is the raft: it is really built, from log
bricks laid side by side on a keel of plates and lashed with cross-beams, a deck of planks, a wicker rail, a mast of round bricks with a
yard and a square sail, and a steering oar. It slides off its slipway and floats on the tile sea (afloat it is marked kitlib.root: it
rests on smooth tiles, as a boat rests on water). A second card shows it on the slipway, half built.

The island is a 48 x 32 base: a green hill sculpted with sculpt.Form (brick cells, every top the sky sees capped), a vine-hung cave in it
with Calypso's hearth and loom, the smoke of cedar rising through a vent in the roof; four springs running in trans-clear and trans-light
blue tiles through the grove of alder, poplar and cypress; a beach; the sea. The cave's roof lifts away (set.calypso-raft-open).
"""
import math, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
from sculpt import Form, ell, smin, rough, S, P, B, PLATES, TILES

GR = 4                                   # the baseplates' top
FLOOR = GR + P                           # the cave floor, the beach: plates on the baseplate
SEA = GR + P                             # the top of the sea's tiles
PACK = Form()


def pack(cells, yup_top, colour_of, sizes, along_z=False):
    rows = []
    PACK._pack(rows, cells, yup_top, colour_of, along_z, sizes)
    return rows


# ── the ground plan: 48 x 32 studs, i -24..23 across, k -16..15 from back to front ──
FRAME, FRAME_CELLS = frame(-480, -320, 48, 32, GR)


def sea_at(i, k):
    xc, zc = (i + .5) * S, (k + .5) * S
    return xc > 225 + 22 * math.sin(zc / 70) - max(0, zc - 150) * 1.3


INNER = [(i, k) for i in range(-23, 23) for k in range(-15, 15)]
SEA_CELLS = {c for c in INNER if sea_at(*c)}

# the slipway: two runners of log bricks down the beach into the shallows, the raft on them along x
SLIP_Z = 180                              # the raft's centre line on the slipway
SLIP_X = 80                               # ... and its centre along it
RUNNERS = [(SLIP_Z + dz, x) for dz in (-50, 50) for x in range(-40, 260, 80)]


# ── the hill and its cave ──
VAULT = ((-190, 0, -175), (125, 205, 118))
MOUTH = ((-180, 0, -70), (78, 150, 90))
HEARTH = (-240, -160)
VENT = (-12, -8)                          # the stud the cedar smoke rises through
LOOM = (-180, -230)


def in_vault(x, z, y=20, pad=0):
    return min(ell((x, y, z), VAULT[0], tuple(r + pad for r in VAULT[1])), ell((x, y, z), MOUTH[0], tuple(r + pad for r in MOUTH[1]))) < 0


def hill(p):
    x, y, z = p
    g = smin(smin(ell(p, (-200, 0, -230), (260, 290, 150)), ell(p, (-400, 0, -170), (120, 200, 170)), 70), ell(p, (0, 0, -250), (130, 170, 90)), 70)
    g = smin(g, ell(p, (-60, 0, -120), (90, 90, 80)), 50)                                  # a shoulder stepping down to the grove
    g += rough(p, 22, 0.8)
    vault = min(ell(p, *VAULT), ell(p, *MOUTH))
    return max(g, -vault), 'rock'


form = Form(y0=GR, keep_studs=('turf',), unit=B, caps=True)
form.carve(hill, range(-23, 6), range(0, 14), range(-15, 0))
for (i, h, k), m in list(form.vox.items()):
    top = (i, h + 1, k) not in form.vox
    patch = math.sin(i / 2.7 + 0.4) * math.sin(k / 2.1 + 1.1) + 0.5 * math.sin((i - k) / 3.9 + h / 3)
    if top and h >= 3 and patch > 0.45: form.vox[(i, h, k)] = 'turf'          # turf in patches where the plants grow
    if h >= 2 and in_vault((i + .5) * S, (k + .5) * S, 20, 25) and (i, h - 1, k) not in form.vox: form.vox[(i, h, k)] = 'soot'
for h in range(0, 14): form.vox.pop((VENT[0], h, VENT[1]), None)
form.hollow(side=2, up=2, pillar=4)


def colour(m, i, h, k):
    a, b = (i + 2 * (h % 2)) // 3, (k + 2 * (h % 2)) // 3
    if m == 'soot': return DBG
    if m == 'turf': return OLIVE if (a * 3 + b * 5) % 4 == 0 else GREEN
    if h <= 1: return DTAN if (a + b) % 3 else TAN                                            # the stone foot of the hill
    if in_vault((i + .5) * S, (k + .5) * S, 20, 45) and h <= 7: return DTAN if (a * 2 + b + h // 2) % 4 else LBG   # the cave's lip
    n = (a * 5 + b * 3 + h // 3) % 7
    return (GREEN, GREEN, DGREEN, OLIVE, GREEN, DGREEN, DTAN)[n]                                # a green hill, grass over stone


def cave_open(v):   # the roof that lifts away: the rock over the cave from its fourth course up
    x, z = (v[0] + .5) * S, (v[2] + .5) * S
    return v[1] >= 4 and in_vault(x, z, 20, 45) and form.vox.get(v) is not None


def can_grow(v):
    x, z = (v[0] + .5) * S, (v[2] + .5) * S
    return not in_vault(x, z, GR + (v[1] + .5) * B, 10) and (v[0], v[2]) != VENT


def top_at(i, k):
    hs = [h for (ii, h, kk) in form.vox if ii == i and kk == k]
    return (form.y0 + (max(hs) + 1) * B, max(hs)) if hs else (GR, -1)


def foot(i, k): return any((i, h, k) in form.vox for h in range(0, 14))   # under the hill


# ── figures ──
def fig(card, sub, x, yup, z, rot=0, swap=None, drop=()):
    rows = figure(card, sub, x, yup, z, rot, drop=drop)
    for old, (new, col) in (swap or {}).items():
        rows = [(' '.join(r.split()[:1] + [str(col)] + r.split()[2:-1] + [new + '.dat']) if r.endswith(' ' + old + '.dat') else r) for r in rows]
    return rows


# ── the raft ──
def raft(x0, yup, z0, rot=0, stage='full'):
    """the raft, 8 studs broad and 12 long (along its local z, the bow at +z): a keel of 2 x 8 plates, eight rows of log bricks on it,
    cross-beams lashing them, a deck of planks, a wicker rail, the mast of round bricks stepped in a beam, the yard and the square sail
    hanging from it, the steering oar in a clip at the stern. stage 'half': the keel, the logs (two not yet laid), one beam."""
    base = mat_mul(T(x0, -yup, z0), RY(rot))
    out = []

    def p(col, lx, ly, lz, part, m=None):
        out.append(row(col, mat_mul(base, mat_mul(T(lx, -ly, lz), m or T(0, 0, 0))), part))
    half = stage == 'half'
    for r in range(6): p(DB, 0, P, -100 + 40 * r, '3034')                                  # the keel: six 2 x 8 plates across
    for j in range(8):
        if half and j in (5, 6): continue
        x = -70 + 20 * j
        segs = [4, 4, 4] if j % 2 == 0 else [2, 4, 4, 2]
        z = -120
        for n, L in enumerate(segs):
            col = DB if (j * 3 + n) % 5 == 0 else RB
            p(col, x, P + B, z + L * 10, '30137' if L == 4 else '30136', RY(math.pi / 2))
            z += L * 20
    top = P + B                                                                              # the logs' top face
    if half:
        p(DB, 0, top + P, -110, '3460')
        return out
    for z in (-110, 110): p(DB, 0, top + P, z, '3460')                                     # the end beams lashing the logs
    p(DB, 0, top + P, 0, '3034')                                                            # the mast-step beam, two studs deep
    for z in (-90, -70, -50, -30, 30, 50, 70, 90):                                          # the deck: planks across, six studs
        p(TAN if z in (-50, 50) else DTAN, 0, top + P, z, '6636')
    for z in (-60, 60):                                                                     # the wicker rail on the outer logs
        for x in (-70, 70): p(RB, x, top + B, z, '3633', RY(math.pi / 2))
    for x, z, col in ((-50, -10, DORANGE), (-70, 10, DORANGE), (50, 10, TAN), (70, -10, WHITE)):   # her gifts: jars of wine and water
        p(col, x, top + P + B, z, '3062b'); p(col, x, top + P + B + B, z, '4589')
    for x in (-70, -30, 30, 70): p(LBG if x % 60 else DBG, x, top + P + B, 110, '3062b')   # ballast stones on the bow beam
    for n in range(11): p(RB if n % 4 else DB, 0, top + P + B * (n + 1), 0, '3941')      # the mast: eleven round bricks
    mtop = top + P + B * 11
    p(RB, 0, mtop + P, 20, '3034')                                                          # the yard across the mast's head
    p(RB, 0, mtop + P + B, 10, '3004')                                                      # the masthead
    p(DB, 0, mtop + P + B + P, 10, '3069b')
    for n in range(5): p(TAN if n in (1, 3) else WHITE, 0, mtop - B * n, 30, '3009')      # the square sail, hanging from the yard
    for x in (-70, 70): p(DB, x, mtop + 2 * P, 30, '98138')                                 # the yard-arms
    p(DB, 10, top + 2 * P, -110, '61252')                                                   # the clip at the stern ...
    a, cy, cz = 0.6, top + P + 4, -130                                                     # ... and the steering oar through it, trailing
    p(RB, 10, cy + 50 * math.cos(a), cz + 50 * math.sin(a), '2542', RX(-a))
    return out


# ── the cave: hearth and loom ──
def hearth(x, z, yup, smoke_to=None):
    """the hearth: a bed of embers ringed with stones, flames, and a column of cedar smoke up through the vent"""
    out = [on(BLK, x, yup, z, '3003')]
    for dx in (-30, 30):
        for dz in (-30, -10, 10, 30): out.append(on(LBG if (dx + dz) % 40 else DBG, x + dx, yup, z + dz, '3062b'))
    for dx in (-10, 10):
        for dz in (-30, 30): out.append(on(LBG, x + dx, yup, z + dz, '3062b'))
    out += [on(TORANGE, x - 10, yup + 24, z - 10, '3062b'), on(ORANGE, x - 10, yup + 48, z - 10, '4589'),
            on(TORANGE, x + 10, yup + 24, z - 10, '4589'), on(TRED, x - 10, yup + 24, z + 10, '4589')]
    if smoke_to:
        y, n = yup + 24, 0
        while y < smoke_to:
            out.append(on(TCLEAR, x + 10, y, z + 10, '3062b')); y += 24; n += 1
        out += [on(LBG, x + 10, y, z + 10, '3062b'), on(TCLEAR, x + 10, y + 24, z + 10, '4589')]
    return out


def loom(x, z, yup):
    """Calypso's standing loom: two posts of 1 x 1 x 5 bricks, the beam across them, the web hanging from it in three bands, a row of
    clay loom-weights under the web"""
    out = [on(RB, x - 50, yup, z, '2453b'), on(RB, x + 50, yup, z, '2453b')]
    t = yup + 120
    out.append(put(RB, x, t + P, z, '3666'))
    for n, col in enumerate((DRED, SANDBLUE, GOLD)):
        out.append(put(col, x, t - B * n, z, '3010'))
    for dx in (-30, -10, 10, 30): out.append(put(DTAN, x + dx, t - 3 * B, z, '3024'))   # the clay weights under the web
    return out


# ── the tools and the slipway ──
def slipway(yup=GR, cells=None):
    out = []
    for z, x in RUNNERS:
        if cells is not None and (x // S - 1, z // S) in FRAME_CELLS: continue
        out.append(put(RB if (x // 40) % 3 else DB, x, yup + B, z, '30137'))
    return out


def tools(x, z, yup):
    """the gear Calypso gave him, laid out on a board (2 x 6, (x, z) its centre): the folded sail-cloth, the bronze axe and the adze and
    two augers on a smooth plank, a coil of cord"""
    out = [put(RB, x, yup + P, z, '3795')]
    t = yup + P
    out += [put(WHITE, x - 40, t + P, z, '3068b'), put(DTAN, x, t + P, z, '3068b'), put(TAN, x + 40, t + P, z, '4150')]
    flat = lambda part, col, dx, dz, a: row(col, mat_mul(T(x + dx, -(t + P + 4), z + dz), mat_mul(RY(a), RZ(math.pi / 2))), part)
    out += [flat('3835', PEARL, -6, -8, 0), flat('3841', RB, 6, 4, 0.3), flat('55298', PEARL, -8, 12, 1.4), flat('55298', PEARL, 8, -14, 1.6)]
    return out


PEARL = 297


# ── the grove ──
def cypress(x, z, yup, n=5):
    """sweet-smelling cypress: dark and slender, a column of round bricks drawn to a point"""
    out = [on(RB, x, yup, z, '3941')]
    for q in range(n): out.append(on(DGREEN, x, yup + 24 * (q + 1), z, '3941'))
    out += [on(DGREEN, x, yup + 24 * (n + 1), z, '3942c'), on(DGREEN, x - 10, yup + 24 * (n + 1) + 48, z - 10, '4589')]
    return out


def poplar(x, z, yup, n=3):
    """poplar: a tall pale trunk, a crown of leaves in two greens"""
    out = [on(TAN, x - 10, yup + 24 * q, z - 10, '3062b') for q in range(3)] + [put(OLIVE, x, yup + 72 + P, z, '4032a')]
    for q in range(n): out.append(on(OLIVE if q % 2 else GREEN, x, yup + 80 + 24 * q, z, '3941'))
    out.append(on(GREEN, x, yup + 80 + 24 * n, z, '3942c'))
    return out


def alder(x, z, yup):
    """a trunk of round bricks, the leafy crown on it"""
    return [on(RB, x, yup, z, '3941'), on(RB, x, yup + B, z, '3941'), on(GREEN, x, yup + 2 * B, z, '3470')]


def stump(x, z, yup):
    return [on(RB, x, yup, z, '3941'), put(TAN, x, yup + 24 + P, z, '4150')]


# ── everything ──
def cells_of(x, z, w, d):   # the stud squares a w x d thing centred at (x, z) covers
    return {(i, k) for i in range(round(x / S - w / 2), round(x / S + w / 2)) for k in range(round(z / S - d / 2), round(z / S + d / 2))}


def springs(taken):
    """four springs in a row by the hill, their streams turned one this way, one that, down through the grove to the beach or the sea"""
    paths = [[(-19, -1), (-19, 2), (-17, 2), (-17, 6), (-20, 6), (-20, 10), (-17, 10), (-17, 13)],
             [(-15, -1), (-15, 3), (-12, 3), (-12, 8), (-9, 8), (-9, 13)],
             [(-3, -1), (-3, 3), (-6, 3), (-6, 6), (-3, 6), (-3, 10), (0, 10), (0, 13)],
             [(1, -3), (1, 1), (4, 1), (4, 4), (7, 4), (7, 6), (9, 6)]]
    cells = []
    for path in paths:
        for (a, b), (c, d) in zip(path, path[1:]):
            for t in range(max(abs(c - a), abs(d - b)) + 1):
                q = (a + (c > a) * t - (c < a) * t, b + (d > b) * t - (d < b) * t)
                if q not in cells: cells.append(q)
    cells = [c for c in cells if c not in taken and not foot(*c) and c not in FRAME_CELLS]
    return set(cells)


ROOF = [0]                                                      # the roof's height over the vent, fixed once the hill has settled
ODY = dict(swap={'3847': ('3835', PEARL)}, drop=('4499',))       # Odysseus with the bronze axe in his hand (not his bow)


def build(stage='afloat'):
    rows, taken = [], set(FRAME_CELLS)
    rows += [put(GREEN, -160, GR, 0, '3811'), put(BLUE, 320, GR, 0, '3857', RY(math.pi / 2))]
    rows += FRAME
    # the slipway
    slip = {(x // S + dx, z // S) for z, x in RUNNERS for dx in (-2, -1, 0, 1)}
    rows += slipway()
    taken |= slip
    # the sea
    sea = {c for c in SEA_CELLS if c not in taken}

    def sea_col(i, k):
        d = (i + 0.5) * S - (225 + 22 * math.sin((k + .5) * S / 70) - max(0, (k + .5) * S - 150) * 1.3)
        n = (i // 2 * 7 + k // 2 * 3) % 9
        if d < 40: return TLBLUE if n % 3 else TCLEAR
        return TLBLUE if n in (0, 4) else TCLEAR if n == 7 else MBLUE if d < 110 else BLUE
    rows += pack(sea, SEA, sea_col, [((2, 2), '3068b'), ((1, 2), '3069b'), ((1, 1), '3070b')])
    taken |= sea
    # the beach: sand within three studs of the sea, and all round the slipway
    beach = {(i, k) for (i, k) in INNER if (i, k) not in taken and not foot(i, k) and
             (any((i + a, k + b) in SEA_CELLS for a in range(-3, 4) for b in range(-3, 4)) or (-6 <= i <= 12 and 3 <= k <= 14))}
    sandcol = lambda i, k: DTAN if ((i // 3) * 5 + (k // 2) * 3) % 7 == 0 else TAN
    rows += pack(beach, FLOOR, sandcol, PLATES)
    taken |= beach
    foam = {(i, k) for (i, k) in beach if (i + 1, k) in SEA_CELLS and (i * 3 + k) % 2 == 0}
    rows += [put(WHITE, (i + .5) * S, FLOOR + P, (k + .5) * S, '98138') for (i, k) in sorted(foam)]
    # the cave floor, a threshold of dark tan plates out to the mouth
    floor = {(i, k) for i in range(-23, 6) for k in range(-15, 0) if (i, 0, k) not in form.vox and in_vault((i + .5) * S, (k + .5) * S, 20, 0) and (i, k) not in taken}
    rows += pack(floor, FLOOR, lambda i, k: DTAN if (i + k) % 5 else TAN, PLATES)
    taken |= floor
    ground = lambda x, z: FLOOR if cells_of(x, z, 2, 1) <= (beach | floor) else GR
    # the people: Calypso at the mouth of her cave, Hermes going from her by the springs, Odysseus at the raft
    people = [('character.calypso', 'calypso', -160, -50, math.pi, {}), ('character.hermes', 'hermes', -240, 150, math.pi * 0.75, {})]
    people.append(('character.odysseus', 'odysseus', 140, 190, -math.pi / 2, ODY) if stage == 'afloat' else
                  ('character.odysseus', 'odysseus', -80, 190, -math.pi / 2, ODY))
    for card, sub, x, z, rot, kw in people:
        rows += fig(card, sub, x, ground(x, z), z, rot, **kw)
        taken |= cells_of(x, z, 2, 2)
    # the raft
    if stage == 'afloat':
        rows += root(raft(340, SEA, 20))
    else:
        rows += raft(SLIP_X, GR + B, SLIP_Z, math.pi / 2, 'half')
        rows += [put(RB, 0, FLOOR + B, 70, '30137'), put(DB, 80, FLOOR + B, 70, '30137'), put(RB, 40, FLOOR + 2 * B, 70, '30137')]   # the logs still to lay
    # the tools on the sand, up the beach from the ways; chips from the adze, shells and pebbles
    rows += tools(-40, 100, FLOOR)
    tb = cells_of(-40, 100, 6, 2) | cells_of(0, 70, 8, 2) | foam
    for (i, k) in sorted(beach):
        if (i, k) in tb or (i, k) in slip: continue
        h = (i * 37 + k * 11 + i * k * 3) % 17
        near = -4 <= i <= 12 and 4 <= k <= 13
        if near and h in (0, 5, 9): rows.append(put(RB if h else DTAN, (i + .5) * S, FLOOR + P, (k + .5) * S, '3070b'))   # wood chips
        elif h == 3: rows.append(put(WHITE if (i + k) % 2 else LBG, (i + .5) * S, FLOOR + P, (k + .5) * S, '98138'))  # shells, pebbles
    # the grove: four springs, trees, stumps of the trees he felled, violets and parsley
    sp = springs(taken)
    scol = lambda i, k: TLBLUE if ((i + k) // 2) % 3 else TCLEAR
    rows += pack(sp, GR + P, scol, [((1, 4), '2431'), ((1, 3), '63864'), ((1, 2), '3069b'), ((1, 1), '3070b')])
    taken |= sp
    grove = [(cypress, -420, 20), (poplar, -440, 100), (alder, -440, 200), (cypress, -420, 280), (cypress, 80, -20), (alder, 120, -160),
             (poplar, 40, -100), (cypress, -340, -20)]
    for f, x, z in grove:
        c = cells_of(x, z, 2, 2)
        if c & taken or any(foot(*q) for q in c): print('   tree clash', f.__name__, x, z); continue
        rows += f(x, z, GR); taken |= c
    for x, z in ((60, -60), (180, -200), (180, -120)):
        c = cells_of(x, z, 2, 2)
        if not (c & taken) and not any(foot(*q) for q in c): rows += stump(x, z, GR); taken |= c
    # the hearth under the vent and the loom at the back of the cave
    roof_y = ROOF[0] or max(top_at(VENT[0] + a, VENT[1] + b)[0] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    rows += hearth(*HEARTH, FLOOR, smoke_to=roof_y - 8)
    rows += loom(LOOM[0], LOOM[1], FLOOR)
    # flowers in the meadow
    for (i, k) in INNER:
        if (i, k) in taken or foot(i, k): continue
        h = (i * 73 + k * 31 + i * k) % 23
        if h in (0, 17): rows.append(put(22 if (i + k) % 2 else 30, (i + .5) * S, GR + P, (k + .5) * S, '98138'))   # violets
        elif h == 7: rows.append(put(WHITE, (i + .5) * S, GR + P, (k + .5) * S, '98138'))
        elif h == 13 and (i + k) % 3 == 0: rows.append(on(DGREEN, (i + .5) * S, GR, (k + .5) * S, '6255'))       # parsley
    return rows


def greenery():
    """plants on the turf of the hill, vines over the mouth"""
    out = []
    for (i, h, k), m in sorted(form.vox.items()):
        if m == 'turf' and (i, h + 1, k) not in form.vox and (i * 7 + k * 11 + h) % 6 == 0:
            out.append(on(GREEN if (i + k) % 2 else DGREEN, (i + .5) * S, form.y0 + (h + 1) * B, (k + .5) * S, '6255', (i % 4) * math.pi / 2))
    # vines: under the lintel of the mouth, a clip plate at the front of each other stud, the curled vine hanging from it
    for i in range(-23, 6):
        xc = (i + .5) * S
        for k in range(-1, -16, -1):
            hs = sorted(h for (ii, h, kk) in form.vox if ii == i and kk == k)
            if not hs: continue
            if hs[0] > 0 and in_vault(xc, (k + .5) * S, 20, 0) and i % 2 == 0:
                y = form.y0 + hs[0] * B
                out.append(put(DGREEN, xc, y, (k + .5) * S, '61252', RY(math.pi)))
                out.append(row(GREEN, mat_mul(T(xc, -(y - 4), (k + .5) * S + 20), RZ(math.pi)), '1997'))
            break
    return out


def details(): return build('afloat') + greenery()


if __name__ == '__main__':
    for _ in range(8):   # closed and with the roof lifted: settle each until both hold
        before = dict(form.vox)
        left = form.settle(colour, extra=details, can_grow=can_grow)
        lid = {v: form.vox.pop(v) for v in list(form.vox) if cave_open(v)}
        left_open = form.settle(colour, extra=details, can_grow=lambda v: can_grow(v) and not cave_open(v))
        form.vox.update(lid)
        if form.vox == before and not left and not left_open: break
    ROOF[0] = max(top_at(VENT[0] + a, VENT[1] + b)[0] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    rock = form.parts(colour)
    title = "Calypso's Isle and the Raft"
    n = write('set.calypso-raft', title, rock + details())
    n1 = write('set.calypso-raft-building', title + ': the raft half built on the slipway', rock + build('slipway') + greenery())
    lid = {v: form.vox.pop(v) for v in list(form.vox) if cave_open(v)}
    n2 = write('set.calypso-raft-open', title + ' (the roof of the cave lifted away)', form.parts(colour) + details())
    form.vox.update(lid)
    subs = {'raft': raft(0, 0, 0),
            'hearth-loom': [put(DTAN, 0, P, 0, '41539')] + hearth(-40, 20, P) + loom(20, -50, P) + fig('character.calypso', 'calypso', 40, P, 50, math.pi),
            'tools-slipway': [put(RB if (x // 40) % 3 else DB, x, B, z, '30137') for z in (-50, 50) for x in range(-120, 200, 80)] +
                             raft(20, B, 0, math.pi / 2, 'half') + tools(-40, 120, 0) + fig('character.odysseus', 'odysseus', -160, 0, 0, -math.pi / 2, **ODY)}
    for s, rws in subs.items(): write('set.calypso-raft-' + s, title + ': ' + s.replace('-', ' '), rws)
    for nm in ['set.calypso-raft', 'set.calypso-raft-building', 'set.calypso-raft-open'] + ['set.calypso-raft-' + s for s in subs]:
        print(nm, pieces(nm)); check(nm)
    manifest('calypso-raft', title=title, book='V', tier='Large',
             moment="On Ogygia, with the gods' decree just brought by Hermes, Odysseus builds his raft on the shore with the tools Calypso gave him while she watches from the mouth of her cave.",
             quote='"Twenty trees in all did he fell, and trimmed them with the axe; then he cunningly smoothed them all and made them straight to the line." (Odyssey V, tr. A. T. Murray)',
             object='The raft: log bricks laid on a keel of plates and lashed with cross-beams, decked with planks, railed, a mast of round bricks with a yard and a square sail, and a steering oar. It comes off its slipway and floats on the tile sea; the second card shows it half built on the ways.',
             builds=[{'card': 'set.calypso-raft', 'title': 'The island with the raft afloat'},
                     {'card': 'set.calypso-raft-building', 'title': 'The raft half built on the slipway'},
                     {'card': 'set.calypso-raft-open', 'title': 'The roof of the cave lifted away'},
                     {'card': 'set.calypso-raft-raft', 'title': 'The raft'},
                     {'card': 'set.calypso-raft-hearth-loom', 'title': "Calypso's hearth and loom"},
                     {'card': 'set.calypso-raft-tools-slipway', 'title': 'The tools and the slipway'}],
             images=[{'file': 'hero.jpg', 'caption': 'The island, 48 x 32 studs: the green hill and its cave, the grove and the springs, the beach and the ways, the raft afloat.',
                      'alt': 'A green hill of bricks with a cave mouth hung with vines, Calypso at its mouth, Hermes in a grove of cypress and poplar crossed by clear streams, a beach with slipway runners and a board of tools, and a raft with a square sail on a sea of blue and clear tiles.'},
                     {'file': 'afloat.jpg', 'caption': 'Afloat: the raft off its ways, the jars of wine and water on the mast beam, ballast stones at the bow, the steering oar trailing.',
                      'alt': 'Close view of the brown log raft on the tile sea, with a white and tan striped sail, a railing, jars and grey stones, Odysseus on the beach in the foreground.'},
                     {'file': 'open.jpg', 'caption': 'The roof lifted away: the loom at the back of the cave, the hearth, the smoke of cedar rising to the vent.',
                      'alt': 'The cave from above with its roof removed: a standing loom with red, grey-blue and gold bands, a ring of grey stones round orange flames, a column of clear round bricks, Calypso at the mouth.'},
                     {'file': 'building.jpg', 'caption': 'The second card: the raft half built on the slipway, two logs still to lay, Odysseus at work with the axe.',
                      'alt': 'The raft as a flat bed of brown log bricks on two runners, a gap where two logs are missing, logs piled behind, Odysseus beside it.'}],
             features=['The raft is really built: eight rows of log bricks on six 2 x 8 plates, lashed by end beams, a deck of planks, a wicker rail, an eleven-brick mast, a yard with the sail hanging from it, and a steering oar in a clip.',
                       'Afloat it rests on smooth tiles, as a boat on water, and lifts off; on the ways it clicks down onto two runners of log bricks.',
                       'The hill is sculpted: brick courses bonded crosswise, patchy greens over tan stone, every top the sky sees finished in tiles or cheese slopes, turf patches keeping their studs for plants.',
                       'The cave roof lifts away to show the loom (posts, beam, a web in three colours, clay weights) and the hearth, whose cedar smoke rises as a column of clear round bricks through a vent in the roof.',
                       'Four springs run in trans-clear and trans-light-blue tiles, turned one this way, one that, through a grove of cypress, poplar and alder.',
                       'The beach carries chips from the adze, shells and pebbles; foam of white round tiles lines the waterline.'],
             subs=[{'file': 'raft.jpg', 'title': 'The raft', 'pieces': pieces('set.calypso-raft-raft'), 'text': 'The raft alone, complete: stands on its keel plates.'},
                   {'file': 'hearth-loom.jpg', 'title': "Calypso's hearth and loom", 'pieces': pieces('set.calypso-raft-hearth-loom'), 'text': 'The loom and the hearth on an 8 x 8 plate, with Calypso.'},
                   {'file': 'tools-slipway.jpg', 'title': 'The tools and the slipway', 'pieces': pieces('set.calypso-raft-tools-slipway'), 'text': 'The runners, the raft half built on them, the board of tools, Odysseus with the axe.'}],
             sources=['assets/vehicle/odysseuss-raft.mjs', 'assets/location/ogygia-cavern-and-grove.mjs', 'assets/prop/shipbuilding-tool-set.mjs',
                      'scenes/OD-B05-S01.mjs', 'scenes/OD-B05-S04.mjs', 'scenes/OD-B05-S05.mjs'],
             status='Built to the bar',
             next=['The square sail is a flat wall of 1 x 6 bricks; a cloth sail on a yard would read softer.',
                   'The vines over the mouth are curled vines (1997) hung from clip plates; they read as hooks from some angles.',
                   'Figures, the tools laid on the board, the vines and the steering oar are placed by hand and not verified by the click checker.',
                   'The cave interior is only seen well with the roof lifted.'])
