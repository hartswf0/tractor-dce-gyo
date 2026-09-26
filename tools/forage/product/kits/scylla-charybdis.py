#!/usr/bin/env python3
"""tools/forage/product/kits/scylla-charybdis.py — SCYLLA AND CHARYBDIS (Odyssey XII), a flagship kit of the Odyssey line.

  python3 tools/forage/product/kits/scylla-charybdis.py   -> odyssey/cards/set.scylla-charybdis*.mpd, odyssey/kits/scylla-charybdis/kit.json

The moment: the black ship in the narrow strait. On one hand the sheer cliff, smooth as if polished, with Scylla's den high up in it; her
six necks come down out of the dark and snatch six men off the deck. On the other hand, low, Charybdis sucks the sea down under the great
fig tree. Odysseus, armed against Circe's advice, stands on the foredeck and looks up.

Seen from the front (+z) the cliff stands on the LEFT, which in LDraw is +x; Charybdis is on the right (-x).

The object that performs it: Scylla. Each neck is a stack of 2 x 2 round bricks strung on a Technic axle from a Technic cross block, and
the cross block turns on a friction pin in a comb of 1 x 2 Technic bricks along the den's lip, so each neck swings down out of the den
and up again on its own, and holds where it is left. Each head is a pair of jaws (1 x 4 bricks, tooth plates set inward) on a 4 x 6 plate:
a man stands on the two studs in the throat, so the jaws really hold him. The whirlpool is a disc of round plates, tiles and an inverted
dish on a 4 x 4 turntable (61485c01): turn it and the spiral arms of foam turn.

The cliff is sculpted (tools/forage/product/sculpt.py): brick cells, every top finished (tiles, cheese slopes), hollowed to a skin on
pillars. The crown of the cliff behind the den lifts off (set.scylla-charybdis-open) to show the den and the six pivots from behind.
"""
import math, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
from kitlib import mat_mul, row
import clicks

SLUG = 'scylla-charybdis'
GRASS = 4                 # the baseplates' top
SEA = GRASS + P           # the sea's tiles, on the baseplate
FLOOR_H = 17              # the den's floor is the top of brick course 17
FLOOR = GRASS + (FLOOR_H + 1) * B           # 436
LIP = 200                 # the den's lip (x): the comb of Technic bricks straddles it
PIVOT = FLOOR + B - 10    # a 1 x 2 Technic brick's hole is 10 below its top: 450
NECK_Z = (-210, -130, -50, 30, 110, 190)
TEETH_Z = tuple(z - 40 for z in NECK_Z)
WX, WZ = -260, -80        # Charybdis: the turntable's centre
TX, TZ = -420, -100       # the fig tree's rock (its branch ends over the throat)
SHIP_X = 20               # the ship's centre line (x); she lies along z, her bow toward the viewer
DAZURE, MAZURE = 321, 322
DECK = SEA + 58           # the top of the hull's deck


# ── the cliff ──
def top_of(z, x):
    return 700 - 0.0024 * (z + 70) ** 2 - 0.25 * max(0, x - 330)


def face_of(y, z):
    return 238 - 0.078 * y + 9 * math.sin(z / 41 + 0.4) + 6 * math.sin(y / 53)


def cliff(p):
    x, y, z = p
    r = rough(p, 10, 1.3)
    corner = math.hypot(max(0, z - 200), max(0, 300 - x)) - 100 + 0.5 * r          # the seaward end rounded off, not sawn flat
    d = max(face_of(y, z) - x + r, x - 462, abs(z) - 302, y - top_of(z, x) + 0.6 * r, corner)
    return d, 'rock'


def in_den(i, h, k):
    """the den: a hollow in the face above the floor, dark inside"""
    if h <= FLOOR_H: return False
    x, y, z = (i + 0.5) * S, GRASS + (h + 0.5) * B, (k + 0.5) * S
    return ell((x, y, z), (250, 500, -20), (78, 92, 262)) < 0 and x > LIP


form = Form(y0=GRASS, unit=B, caps=True, keep_studs=('ledge',))
form.carve(cliff, range(9, 23), range(0, 30), range(-15, 15))
for v in [v for v in form.vox if in_den(*v)]: del form.vox[v]
SLOTS = {math.floor(z / S) for z in NECK_Z}
for k in range(-13, 12):                                              # the lip: a clean, level ledge under a clear mouth, a groove
    if k in SLOTS: form.vox.pop((10, FLOOR_H, k), None)               # under each neck's pivot
    else: form.vox[(10, FLOOR_H, k)] = 'ledge'
    form.vox.pop((9, FLOOR_H, k), None)
    for i in (9, 10, 11):
        for h in range(FLOOR_H + 1, FLOOR_H + 5): form.vox.pop((i, h, k), None)


def colour(m, i, h, k):
    if m == 'den': return BLK
    if m == 'ledge': return DBG
    if m == 'moss': return OLIVE
    a, b = (i + 2 * (h % 2)) // 4, (k + 2 * (h % 2)) // 5
    if (h + (b + a) // 2) % 6 == 0: return DTAN                                  # beds of sandier stone
    if (a * 3 + b * 5 + h // 3) % 7 == 0: return LBG
    return DBG


def paint():
    """black where the rock faces the den; olive in a few ledges high on the face"""
    for (i, h, k), m in list(form.vox.items()):
        near = any(in_den(i + a, h + b, k + c) for a in (-1, 0, 1) for b in (-1, 0, 1) for c in (-1, 0, 1))
        if m == 'ledge': continue
        form.vox[(i, h, k)] = 'den' if near and h > FLOOR_H else ('rock' if m == 'den' else m)
    for (i, h, k), m in list(form.vox.items()):
        if m == 'rock' and (i, h + 1, k) not in form.vox and h > 20 and math.sin(i * 1.7 + k * 0.9) * math.sin(k / 3.1) > 0.55:
            form.vox[(i, h, k)] = 'moss'


paint()
form.hollow(side=2, up=2, pillar=4, keep=lambda v, m: v[1] <= FLOOR_H + 1 and v[0] <= 13)


class _Crown:   # the lift-off crown: the cliff behind the den, above its floor
    def __contains__(self, v): return v[1] > FLOOR_H and v[0] >= 14 and -14 <= v[2] <= 12 and v in form.vox
CROWN = _Crown()


# ── the comb along the lip and the six necks ──
def comb(lip=None, floor=None):
    """1 x 2 Technic bricks straddling the lip, one beside each neck (its pin goes through both), 1 x 2 tiles on them"""
    lip, floor, out = lip or LIP, floor or FLOOR, []
    for zt in TEETH_Z:
        out += [put(DBG, lip, floor + B, zt, '3700'), put(DBG, lip, floor + B + P, zt, '3069b')]
    teeth = {math.floor(z / S) for z in TEETH_Z}
    out += [put(DBG, lip + 10, floor + P, (k + .5) * S, '3070b') for k in range(-13, 12) if k not in teeth and k not in SLOTS]
    return out


def M(*ms):
    out = T(0, 0, 0)
    for m in ms: out = mat_mul(out, m)
    return out


NECK_COL, RING_COL, JAW_COL, THROAT = DGREEN, OLIVE, DGREEN, DRED

# pose of each neck: (angle from straight up, swinging out over the lane, in degrees; round bricks; who is in its jaws)
POSES = {-210: (50, 7, 'sailor-1'), -130: (95, 8, 'sailor-2'), -50: (128, 11, None), 30: (75, 9, 'sailor-3'), 110: (131, 12, None),
         190: (30, 6, 'sailor-4')}


def neck_local(n, man=None, ring_every=2, anchor=False):
    """one neck in its own frame: y up the neck (LDraw -y), the pivot pin's axis along z; the cross block's pin hole is at (-20, 10, 0).
    The head is turned at right angles to the neck and looks toward -x: a lower jaw (2 x 6 plate, dark red), a skull (2 x 3 brick), an
    upper jaw (2 x 6 plate), a curved snout, eyes, ears, two fangs jutting from the lower jaw; a man lies across its mouth.
    Returns (rows, the mouth's centre, points along it for the clearance test)"""
    out = [row(DBG, M(T(0, 10, 0), RZ(math.pi / 2)), '6536'),                                    # axle hole along y, pin hole at (-20, 10)
           row(BLK, M(T(0, 20 - 80 + 2, 0), RZ(math.pi / 2)), '3707')]                           # an 8L axle from the block up the stack
    y = 0
    for j in range(n):
        if anchor and j == 0: out.append('0 !FORAGE ROOT')                                    # held by the axle through the block
        out.append(row(NECK_COL, T(0, y - B, 0), '3941')); y -= B
        if j % ring_every == ring_every - 1 and j < n - 1:
            out.append(row(RING_COL, T(0, y - P, 0), '4032a')); y -= P
    top = y
    out.append(row(THROAT, T(-20, y - P, 0), '3795')); y -= P                                    # the lower jaw, the tongue red
    out += [row(WHITE, M(T(-70, y - P, zz), RY(-math.pi / 2)), '49668') for zz in (-10, 10)]     # fangs jutting forward
    out += [row(JAW_COL, T(-10, y - B, -10), '87087'), row(JAW_COL, M(T(-10, y - B, 10), RY(math.pi)), '87087'),   # the skull: eyes
            row(JAW_COL, T(20, y - B, 0), '3003')]                                               # on its side studs, the back of the head
    out += [row(YELLOW, M(T(-10, y - B + 10, -18), RX(math.pi / 2)), '98138'), row(YELLOW, M(T(-10, y - B + 10, 18), RX(-math.pi / 2)), '98138')]
    y -= B
    out.append(row(JAW_COL, T(-20, y - P, 0), '3795')); y -= P                                   # the upper jaw
    out.append(row(JAW_COL, M(T(-60, y, 0), RY(math.pi / 2)), '15068'))                         # the snout, curving down to the nose
    out.append(row(JAW_COL, T(-20, y - P, 0), '3068b'))
    out += [row(JAW_COL, M(T(x, y, zz), RY(-math.pi / 2)), '54200') for x in (10, 30) for zz in (-10, 10)]   # the brow and ears, sloping back
    mouth = (-40, top - P - 10, 0)
    if man:
        out += figure('ensemble.six-seized-sailors', man, 0, 0, 0, m=M(T(mouth[0], mouth[1], -56), RX(-math.pi / 2)), drop=('2542',))
    pts = [(0, yy, 0, 20) for yy in range(10, int(top), -8)] + [(sx, yy, zz, 8) for sx in (-70, -40, -10, 20) for yy in (top - 4, top - 30, top - 50) for zz in (-12, 12)]
    return out, mouth, pts


def neck_world(zn, phi, lip=None, pivot=None):
    """the frame of the neck at zn swung phi degrees out from straight up (toward -x, over the lane)"""
    a = -math.radians(phi)
    return M(T(lip or LIP, -(pivot or PIVOT), zn), RZ(a), T(20, -10, 0))


def place(m, lines):
    out = []
    for l in lines:
        if l.startswith('0'): out.append(l); continue
        t = l.split()
        out.append(row(int(t[1]), mat_mul(m, [float(v) for v in t[2:14]]), t[14]))
    return out


def scylla(upright=False, lip=None, pivot=None):
    lip, pivot, out = lip or LIP, pivot or PIVOT, []
    for zn in NECK_Z:
        phi, n, man = POSES[zn]
        rows, _, _ = neck_local(n, man, anchor=upright)
        out += place(neck_world(zn, 0 if upright else phi, lip, pivot), rows)
        out.append(row(BLK, M(T(lip, -pivot, zn - 20), RY(math.pi / 2)), '6558'))            # the long friction pin, along z
    return out


def world_pt(m, p):
    return (m[0] + m[3] * p[0] + m[4] * p[1] + m[5] * p[2], m[1] + m[6] * p[0] + m[7] * p[1] + m[8] * p[2], m[2] + m[9] * p[0] + m[10] * p[1] + m[11] * p[2])


def neck_report(card):
    """where each head is, and whether any neck passes through a part of the build on the grid (rock, hull, tiles)"""
    from collections import defaultdict
    cells = defaultdict(list)
    for p in clicks.parts(os.path.join(CARDS, card + '.mpd')):
        if p['half']: continue
        for c in p['fp']: cells[c].append(p)
    bad = 0
    for zn in NECK_Z:
        phi, n, man = POSES[zn]
        _, jt, pts = neck_local(n, man)
        m = neck_world(zn, phi)
        hits = []
        for (px, py, pz, r) in pts:
            for (dx, dz) in ((0, 0), (r, 0), (-r, 0), (0, r), (0, -r), (.7 * r, .7 * r), (-.7 * r, .7 * r), (.7 * r, -.7 * r), (-.7 * r, -.7 * r)):
                w = world_pt(m, (px + dx, py, pz + dz))
                for p in cells.get((math.floor(w[0] / S), math.floor(w[2] / S)), []):
                    if p['top'] + 1 < w[1] < p['bot'] - 1: hits.append((p['pid'], [round(v) for v in w]))
        tip = world_pt(m, jt)
        print(f'  neck z {zn}: phi {phi}, {n} bricks, mouth at x {tip[0]:.0f} yup {-tip[1]:.0f}; {len(hits)} points inside parts', hits[:3])
        bad += len(hits)
    return bad


# ── the sea, Charybdis and the fig tree ──
def disc_cells(r=77):
    return {(i, k) for i in range(-4, 4) for k in range(-4, 4) if math.hypot((i + .5) * S, (k + .5) * S) <= r}


def swirl(x, z, turns=1.6):
    """a spiral of foam: which arm a point is on, as a number 0..1 (small is foam)"""
    dx, dz = x - WX, z - WZ
    r, a = math.hypot(dx, dz), math.atan2(dz, dx)
    return ((a * 3 / (2 * math.pi) + r / 120 * turns) % 1.0), r


def spray():
    return [(WX + round(118 * math.cos(a) / 20 - .5) * 20 + 10, WZ + round(118 * math.sin(a) / 20 - .5) * 20 + 10)
            for a in [math.radians(d) for d in range(10, 360, 32)]]


def charybdis():
    """the turntable and the disc on it: an 8 x 8 round plate, rings of 1 x 1 tiles in spiral arms, an inverted dish for the throat"""
    out = [put(DGRAY, WX, GRASS + 16, WZ, '61485c01'), put(DBLUE, WX, GRASS + 16 + P, WZ, '74611')]
    y = GRASS + 16 + P
    for (i, k) in disc_cells():
        x, z = WX + (i + .5) * S, WZ + (k + .5) * S
        if abs(x - WX) < 40 and abs(z - WZ) < 40: continue
        s, r = swirl(x, z, 2.2)
        c = WHITE if s < 0.22 else TCLEAR if s < 0.34 else MAZURE if s < 0.5 else DAZURE if r > 60 else BLUE
        out.append(put(c, x, y + P, z, '98138' if c in (WHITE, TCLEAR) else '3070b'))
    out.append(on(TDBLUE, WX, y, WZ, '3960'))
    for n, (x, z) in enumerate(spray()):                                 # spray thrown up round the rim, standing on the baseplate
        out += [on(TCLEAR, x, GRASS, z, '3062b'), put(WHITE if n % 2 else TCLEAR, x, GRASS + B + P, z, '98138')]
    return out


def fig_tree():
    """the great fig on a low rock behind the whirlpool: a trunk of round bricks leaning out in jogs, a branch reaching over the swirl, full
    leaf"""
    out, face = [], {(0, -1): 0, (1, 0): -math.pi / 2, (-1, 0): math.pi / 2, (0, 1): math.pi}
    for dx in (-20, 20):
        for dz in (-40, 0, 40): out.append(on(DBG if (dx + dz) % 80 else LBG, TX + dx, GRASS, TZ + dz, '3003'))
    for dx in (-20, 20): out.append(on(DBG if dx < 0 else DTAN, TX + dx, GRASS + B, TZ, '3001', math.pi / 2))
    i0, k0 = round(TX / S) - 2, round(TZ / S) - 3
    for i in range(i0, i0 + 4):                                          # the rock's first course, finished at its ends
        out += [put(DBG, (i + .5) * S, GRASS + B, (k0 + .5) * S, '54200', RY(face[(0, -1)])), put(LBG, (i + .5) * S, GRASS + B, (k0 + 5.5) * S, '54200', RY(face[(0, 1)]))]
    top = GRASS + 2 * B
    for i in range(i0, i0 + 4):
        for k in range(k0 + 1, k0 + 5):
            if i in (i0 + 1, i0 + 2) and k in (k0 + 2, k0 + 3): continue    # the trunk stands there
            d = (-1, 0) if i == i0 else (1, 0) if i == i0 + 3 else (0, -1) if k == k0 + 1 else (0, 1)
            out.append(put(DBG if (i + k) % 3 else DTAN, (i + .5) * S, top, (k + .5) * S, '54200', RY(face[d])))
    y, x, z = top, TX, TZ
    for n, (jx, jz) in enumerate(((0, 0), (20, 0), (0, 20))):
        if n:
            out.append(put(RB, x + jx / 2, y + P, z + jz / 2, '3021', RY(math.pi / 2) if jz else None)); y += P
            x, z = x + jx, z + jz
        for _ in range(2): out.append(on(RB, x, y, z, '3941')); y += B
    out.append(put(RB, x + 60, y + P, z, '3034')); y += P                # the branch, out over the swirl
    out.append(put(RB, x + 100, y + P, z, '3020'))
    out += [on(DGREEN, x, y, z, '3470'), on(GREEN, x + 60, y, z, '2417'), on(DGREEN, x + 120, y + P, z, '2417', math.pi),
            on(GREEN, x + 100, y + P, z + 20, '2417', math.pi / 2), on(DGREEN, x + 20, y, z - 20, '2417', -math.pi / 2)]
    return out


def sea(blocked, I=range(-24, 24), K=range(-16, 16), surf=True):
    """tiles over the baseplates wherever nothing else stands: deep water blue, lighter and foaming near the whirlpool and the cliff's foot"""
    free = {(i, k) for i in I for k in K} - blocked
    def col(i, k):
        x, z = (i + .5) * S, (k + .5) * S
        sw, r = swirl(x, z)
        if r < 190:                                                      # the arms of the swirl, drawn out into the strait
            return WHITE if sw < 0.16 else MAZURE if sw < 0.32 else DAZURE if sw < 0.6 or r > 150 else DBLUE
        if surf and any((i + a, 0, k + b) in form.vox for a in (1, 2) for b in (-1, 0, 1)):     # surf at the cliff's foot
            return WHITE if (i * 3 + k) % 4 == 0 else MAZURE
        t = ((i // 2) * 7 + (k // 2) * 3) % 9
        return DAZURE if t == 0 else DBLUE if t in (3, 7) else BLUE
    out, left = [], set(free)
    for (i, k) in sorted(free, key=lambda c: (c[1], c[0])):
        if (i, k) not in left: continue
        c = col(i, k)
        for (w, l), part in (((2, 2), '3068b'), ((1, 2), '3069b'), ((2, 1), '3069b'), ((1, 1), '3070b')):
            cov = [(i + a, k + b) for a in range(w) for b in range(l)]
            if all(q in left and col(*q) == c for q in cov):
                for q in cov: left.discard(q)
                m = RY(math.pi / 2) if (w, l) == (1, 2) else None
                out.append(put(c, (i + w / 2) * S, SEA, (k + l / 2) * S, part, m))
                break
    return out


# ── the ship ──
GALLEY = json.load(open(os.path.join(ROOT, 'odyssey/keyframes/kit-galley.json')))


def ship():
    base = mat_mul(T(SHIP_X, -(DECK - 64.68), 0), RY(math.pi))
    rows = [row(r['col'], mat_mul(base, r['m']), r['part']) for r in GALLEY if r['part'] in ('71958c01', '2542')]
    return root(rows)


FEET = []


def crew():
    """Odysseus armed on the foredeck; two men on the side deck under the striking heads; three at the oars in the well; the helmsman"""
    FEET.clear()
    def man(card, sub, x, yup, z, rot, drop=()):
        if yup == DECK: FEET.extend([(x - 10, z), (x + 10, z)] if abs(math.sin(rot)) < .5 else [(x, z - 10), (x, z + 10)])
        return figure(card, sub, x, yup, z, rot, drop=drop)
    out = man('character.odysseus', 'odysseus', SHIP_X + 10, DECK, 160, -math.pi / 2, drop=('4499',))
    out += man('ensemble.six-seized-sailors', 'sailor-5', SHIP_X - 70, DECK, -40, -math.pi / 2, drop=('2542',))
    out += man('ensemble.six-seized-sailors', 'sailor-6', SHIP_X - 50, DECK, 100, -math.pi / 2, drop=('2542',))
    for n, (dx, z) in enumerate(((-20, -130), (20, -70), (-20, -10))):
        out += man('ensemble.crew-at-the-oars', f'sailor-{n + 1}', SHIP_X + dx, DECK - 24, z, math.pi)
    out += man('ensemble.crew', 'sailor-1', SHIP_X, DECK, -190, math.pi)
    return out


# the deck's studs (measured from the hull 71958c01, turned end for end): planked in reddish brown where no one stands
HULL_STUDS = {(-10, -210), (10, -210), (-10, -190), (10, -190)} | {(x, -170) for x in (-30, -10, 10, 30)} | \
    {(x, z) for z in (-150, -130, -110, -90) for x in (-50, -30, -10, 10, 30, 50)} | {(x, -70) for x in range(-70, 80, 20)} | \
    {(x, z) for z in range(-50, 160, 20) for x in (-70, -50, 50, 70)} | {(x, z) for z in (170, 190, 210) for x in range(-70, 80, 20)}


def deck():
    studs = {(SHIP_X - x, -z) for (x, z) in HULL_STUDS} - set(FEET)
    out = []
    cols = sorted({x for x, _ in studs})
    for x in cols:
        zs = sorted(z for xx, z in studs if xx == x)
        run = []
        for z in zs + [None]:
            if run and (z is None or z != run[-1] + 20):
                out += tile_run(RB if (x // 20) % 3 else DB, x - 10, run[0] - 10, len(run), DECK, along_x=False)
                run = []
            if z is not None: run.append(z)
    return out


def base():
    return [put(BLUE, -160, GRASS, 0, '3811'), put(BLUE, 320, GRASS, 0, '3857', RY(math.pi / 2))]


FRAME, FRAME_CELLS = frame(-480, -320, 48, 32, GRASS)


def blocked_cells():
    b = set(FRAME_CELLS) | {(i, k) for (i, h, k) in form.vox if h == 0}
    b |= {(math.floor(WX / S) + a, math.floor(WZ / S) + c) for a in range(-2, 2) for c in range(-2, 2)}
    b |= {(round(TX / S) + a, round(TZ / S) + c) for a in range(-2, 2) for c in range(-3, 3)}   # the fig's rock
    b |= {(math.floor(x / S), math.floor(z / S)) for x, z in spray()}
    return b


def details():
    return comb() + charybdis() + fig_tree()


def ledge_stand(lip, courses=2):
    """the sub-assembly's stand: a block of rock three studs deep along the whole row of necks, the lip left studded for the comb"""
    f = Form(y0=GRASS, unit=B, caps=True, keep_studs=('ledge',))
    i0 = lip // S
    f.carve(lambda p: (-1, 'rock'), range(i0, i0 + 3), range(courses), range(-14, 13))
    for k in range(-13, 12):
        if k in SLOTS: f.vox.pop((i0, courses - 1, k), None)
        else: f.vox[(i0, courses - 1, k)] = 'ledge'
    return f.parts(colour)


def write_sub(name, title, rows):
    n = write(f'set.{SLUG}-{name}', f'Scylla and Charybdis: {title}', rows)
    check(f'set.{SLUG}-{name}')
    return n


if __name__ == '__main__':
    import json
    for _ in range(8):   # the cliff closed and with its crown lifted away: settle each until both hold
        before = dict(form.vox)
        left = form.settle(colour, extra=details)
        crown = {v: form.vox.pop(v) for v in list(form.vox) if v in CROWN}
        left_open = form.settle(colour, extra=details)
        form.vox.update(crown)
        if form.vox == before and not left and not left_open: break
    rock = form.parts(colour)
    figs = crew()
    sh = ship() + deck() + figs
    world = details() + sea(blocked_cells())
    n = write('set.' + SLUG, 'Scylla and Charybdis', base() + FRAME + rock + world + sh + scylla())
    print('set', n, 'pieces; the cliff', len(rock))
    check('set.' + SLUG)
    neck_report('set.' + SLUG)
    crown = {v: form.vox.pop(v) for v in list(form.vox) if v in CROWN}
    n_open = write('set.' + SLUG + '-open', 'Scylla and Charybdis (the crown of the cliff lifted away)', base() + FRAME + form.parts(colour) + world + sh + scylla())
    print('open', n_open, 'pieces; the crown', n - n_open)
    check('set.' + SLUG + '-open')
    form.vox.update(crown)

    # the sub-assemblies, each a build of its own
    lip_s, floor_s = 60, GRASS + 2 * B
    stand = [put(DBG, 0, GRASS, 0, '3857', RY(math.pi / 2))] + ledge_stand(lip_s)
    n_sc = write_sub('scylla', 'Scylla, her six necks on their pins', stand + comb(lip_s, floor_s) + scylla(True, lip_s, floor_s + B - 10))
    WX, WZ, TX, TZ = 60, 0, -100, -20
    blocked = {(math.floor(WX / S) + a, math.floor(WZ / S) + c) for a in range(-2, 2) for c in range(-2, 2)}
    blocked |= {(round(TX / S) + a, round(TZ / S) + c) for a in range(-2, 2) for c in range(-3, 3)} | {(math.floor(x / S), math.floor(z / S)) for x, z in spray()}
    n_wh = write_sub('whirlpool', 'Charybdis and the fig tree', [put(BLUE, 0, GRASS, 0, '3857')] + charybdis() + fig_tree() + sea(blocked, range(-16, 16), range(-8, 8), False))
    WX, WZ, SHIP_X = 9999, 9999, 0
    figs = crew()
    n_sh = write_sub('ship', 'the black ship', [put(BLUE, 0, GRASS, 0, '3857', RY(math.pi / 2))] + sea(set(), range(-8, 8), range(-16, 16), False) + ship() + deck() + figs)
    print('subs', n_sc, n_wh, n_sh)
    HW = '/home/user/odyssey-halfworld/'
    manifest(SLUG, title='Scylla and Charybdis', book='XII', tier='Flagship',
             moment='The black ship rows the narrow strait: from her den high in the sheer cliff Scylla\'s six necks come down and snatch six men '
                    'off the deck, while across the water, low under the great fig tree, Charybdis sucks the sea down.',
             quote='"While we were taking all this care and looking at Charybdis, Scylla pounced down suddenly upon us and snatched up six of '
                   'my best men." (Odyssey XII, tr. Samuel Butler)',
             object='Scylla: six necks of round bricks, each on its own friction pin in a comb of Technic bricks along the den\'s lip, swing '
                    'down out of the dark to take a man and up again, and hold where they are left; Charybdis is a disc of foam on a real '
                    'turntable that turns.',
             pieces=n,
             builds=[{'card': 'set.' + SLUG, 'title': 'The strait (the whole kit)'},
                     {'card': 'set.' + SLUG + '-open', 'title': 'The crown of the cliff lifted away: the den and the six pivots'},
                     {'card': 'set.' + SLUG + '-scylla', 'title': 'Scylla: the six necks on their pins, standing up'},
                     {'card': 'set.' + SLUG + '-whirlpool', 'title': 'Charybdis on her turntable, and the fig tree'},
                     {'card': 'set.' + SLUG + '-ship', 'title': 'The black ship and her crew'}],
             images=[{'file': 'hero.jpg', 'caption': 'The strait: Scylla on the left, Charybdis on the right, the ship between.',
                      'alt': 'A tall grey brick cliff on the left with a dark den high up; six long green necks with dog-like heads reach down '
                             'toward a black ship full of minifigures; on the right a whirlpool of white and blue tiles and a fig tree.'},
                     {'file': 'strike.jpg', 'caption': 'Two heads come down on the deck; Odysseus stands armed on the foredeck.',
                      'alt': 'Close view of two green heads with open red-lined jaws and white fangs coming down over the crew of the ship.'},
                     {'file': 'den.jpg', 'caption': 'The den: four heads carry men up across their jaws.',
                      'alt': 'Close view of the dark den in the cliff face with green necks coming out of it, men held crosswise in the jaws.'},
                     {'file': 'open.jpg', 'caption': 'The crown lifted away: the comb of Technic bricks and the six pivots.',
                      'alt': 'The cliff seen from behind with its top removed, showing a row of grey Technic bricks and pins holding the necks.'},
                     {'file': 'scylla.jpg', 'caption': 'Sub-assembly: Scylla, her six necks on their pins.',
                      'alt': 'Six green necks of round bricks standing up in a row on a grey rock ledge, each with a head.'},
                     {'file': 'whirlpool.jpg', 'caption': 'Sub-assembly: Charybdis on her turntable, the fig tree over her.',
                      'alt': 'A round disc of white, blue and clear tiles around a blue dish, spray around its rim, a fig tree beside it.'},
                     {'file': 'ship.jpg', 'caption': 'Sub-assembly: the black ship, planked, with her crew.',
                      'alt': 'A black and red boat hull with reddish-brown deck planks, oars out, and minifigures aboard.'}],
             features=['The cliff is sculpted in brick cells from smooth solids: it leans out over the lane and rises 29 courses (some 13 m at '
                       'minifig scale), hollowed to a skin on pillars, every top finished in tiles and cheese slopes, the den a black hollow high on the face.',
                       'Each neck is a stack of 2 x 2 round bricks on a Technic axle from a cross block; the block turns on a long friction pin '
                       'through a 1 x 2 Technic brick on the den\'s lip, so the six necks swing one by one and stay where they are put.',
                       'The heads are brick-built: a dark red lower jaw with two fangs, a skull of bricks with side studs for yellow eyes, an '
                       'upper jaw, a curved snout and cheese-slope ears; a seized man lies across the jaws.',
                       'Charybdis is an 8 x 8 round plate on a 4 x 4 turntable: spiral arms of round tiles and an inverted dish for the throat '
                       'turn with it, while the arms of the swirl run on out into the sea of tiles and spray stands round the rim.',
                       'The fig tree grows from a low rock on the whirlpool\'s edge, a trunk of round bricks jogging outward, its branch ending over the throat.',
                       'The ship is the line\'s black hull afloat on the tiles, her deck planked in reddish brown; three men row in the well, '
                       'the helmsman at the stern, Odysseus armed on the foredeck.',
                       'The crown of the cliff behind the den lifts off to show the comb and the pivots.'],
             subs=[{'file': 'scylla.jpg', 'title': 'Scylla', 'pieces': n_sc,
                    'text': 'The six necks stand up on a ledge of rock in the comb of Technic bricks, each on its friction pin: the whole mechanism of the model.'},
                   {'file': 'whirlpool.jpg', 'title': 'Charybdis and the fig tree', 'pieces': n_wh,
                    'text': 'The turntable and its disc of foam, the spray round it, the fig on its rock with its branch over the throat.'},
                   {'file': 'ship.jpg', 'title': 'The black ship', 'pieces': n_sh,
                    'text': 'The hull, oars and planked deck with the rowers, the helmsman, Odysseus and the two men about to be taken.'}],
             sources=[HW + 'scenes/OD-B12-S04.mjs', HW + 'assets/location/narrow-monster-strait.mjs', HW + 'assets/creature/scylla.mjs',
                      HW + 'assets/environment/charybdis.mjs', HW + 'assets/set_piece/fig-tree-above-charybdis.mjs'],
             status='Built to the bar',
             next=[])

