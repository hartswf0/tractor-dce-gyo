#!/usr/bin/env python3
"""tools/forage/product/kits/bag-of-winds.py — THE BAG OF WINDS (Odyssey X), a Medium kit of the Odyssey line.

  python3 tools/forage/product/kits/bag-of-winds.py     -> odyssey/cards/set.bag-of-winds*.mpd

The moment (Od. X 28-55): the tenth day out from Aeolia, Ithaca so near the men can see the watch-fires on its hill; Odysseus, worn out
from nine days and nights at the sheet, has fallen asleep at the steering oar. The crew, sure the ox-hide bag Aeolus gave him holds gold
and silver, loosen its silver cord, and every wind in it bursts out at once.

The main model is the black ship on a 32 x 32 sea: a blue baseplate under a surface of tiles in patches of blue, the sea already
breaking into white-capped crests where the storm runs out from the ship. The ship (the line's donor galley, odyssey/keyframes/
kit-galley.json) rests on the tiles as its own root. In its hold stands the play feature: the bag on a 4 x 4 turntable, its cord of
flat silver slipped, a trans-clear spiral rising from the open neck and curling gusts on the turntable's corners; spin the turntable
and the winds whirl round the bag. Five of the crew crowd it; one at the bow still points at home; Odysseus sleeps at the stern.

The supporting build is Ithaca on a 16 x 16 base, set behind the bow: a sculpted headland, olive-green on top, a tan beach, and three
watch-fires burning on the summit.
"""
import math, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
from kitlib import mat_mul, T, RY, RX, RZ, row
import json, re

SLUG = 'bag-of-winds'
GALLEY = json.load(open(os.path.join(ROOT, 'odyssey/keyframes/kit-galley.json')))
FSILVER, MNOUGAT_ = 179, 84
SEA = 12                     # the sea's surface: tiles on the baseplate
CX, CZ = 0, 60               # the ship's centre: its length along x, bow to -x (toward Ithaca), stern to +x
G0 = SEA - 6.682             # the galley's origin (its hull's underside lies 6.682 below it), so the hull rests on the tiles
DECK = G0 + 64.682           # the side decks' top (70)
WELL = DECK - 24             # the hold's floor (46)


def ship_xz(lx, lz):
    """the galley's own (x, z) -> the world: its stern (+z) runs to +x"""
    return CX + lz, CZ - lx


# ── figures, posed ──
def body(card, sub, drop=()):
    """a figure's parts as [col, m, part] with its hip at (0, -40, 0) and its feet at 0 (as kitlib.figure places them)"""
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    bl = next((b for b in re.split(r'(?m)^0 FILE ', text) if b.startswith(f'{card} - {sub}.ldr')), '')
    rows_ = [l.split() for l in bl.splitlines() if l.startswith('1 ') and l.split()[-1].replace('.dat', '') not in drop]
    hip = next(t for t in rows_ if re.match(r'3815', t[14]))
    off = T(-float(hip[2]), -(float(hip[3]) + 40), -float(hip[4]))
    return [[int(t[1]), mat_mul(off, [float(v) for v in t[2:14]]), t[14].replace('.dat', '')] for t in rows_]


def about(p, R):
    return mat_mul(mat_mul(T(*p), R), T(-p[0], -p[1], -p[2]))


def rot3(m): return [m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11]]


def as_m(r): return [0, 0, 0] + list(r)


def transpose(m): r = rot3(m); return as_m([r[0], r[3], r[6], r[1], r[4], r[7], r[2], r[5], r[8]])


def core(pid):
    return pid in ('3815b', '3816c', '3817c') or pid.startswith(('973', '3626', '3901', '11256', '13251', '93223', '4524'))


def arm(fig, side, pitch, spread=0.17, twist=0.0):
    """set an arm ('R' 3818 on the figure's right, -x; 'L' 3819) to hang `pitch` radians forward-up from the side (0 down, -pi/2
    straight ahead, -pi overhead), its hand and what the hand holds swung with it"""
    pid = '3818' if side == 'R' else '3819'
    a = next(p for p in fig if p[2] == pid)
    sx = 1 if side == 'L' else -1
    sh = a[1][:3]
    want = mat_mul(RZ(-sx * spread), mat_mul(RX(pitch), RY(twist)))
    delta = about(sh, mat_mul(as_m(rot3(want)), transpose(a[1])))
    other = '3819' if side == 'R' else '3818'
    for p in fig:
        if p is a or (not core(p[2]) and p[2] != other and (p[1][0] - sh[0]) * sx > -8 and math.dist(p[1][:3], sh) < 60):
            p[1] = mat_mul(delta, p[1])
    return fig


def head(fig, fwd=0.0, side=0.0, turn=0.0):
    """tilt the head (and what it wears) about the neck"""
    R = mat_mul(RY(turn), mat_mul(RX(fwd), RZ(side)))
    for p in fig:
        if p[1][1] < -70 and not p[2].startswith(('973', '3818', '3819', '3820', '4524')) and abs(p[1][0]) < 16:
            p[1] = mat_mul(about((0, -72, 0), R), p[1])
    return fig


def sit(fig):
    """the legs swung forward: seated, the underside of hips and thighs 19.25 above the standing feet"""
    for p in fig:
        if p[2] in ('3816c', '3817c'): p[1] = mat_mul(p[1], RX(-math.pi / 2))
    return fig


def place(fig, x, yup, z, rot=0, extra=None):
    base = mat_mul(T(x, -yup, z), extra or RY(rot))
    return [row(c, mat_mul(base, m), part) for c, m, part in fig]


def seated_at(fig, x, seat, z, rot=0):
    """a seated figure whose thighs rest on the surface at yup `seat`"""
    return place(sit(fig), x, seat - 19.25, z, rot)


# ── the sea ──
def noise(i, k):
    return math.sin(i / 3.3 + 0.8) * math.sin(k / 2.7 - 0.4) + 0.5 * math.sin((i - k) / 4.1)


def sea(x0, z0, w, d, keep_out, crest):
    """tile the sea over the base's studs (cells (i, k)), 2 x 2 where a patch allows, in patches of blue; `crest` cells are where
    wave crests stand instead (built by waves())"""
    rows_, done = [], set(keep_out) | set(crest)
    i0, k0 = round(x0 / S), round(z0 / S)

    def col(i, k):
        n = noise(i // 2, k // 2)
        return MBLUE if n > 0.95 else BLUE if n > -0.2 else DBLUE
    for k in range(k0, k0 + d, 2):
        for i in range(i0, i0 + w, 2):
            cs = [(i, k), (i + 1, k), (i, k + 1), (i + 1, k + 1)]
            if all(c not in done for c in cs):
                rows_.append(put(col(i, k), (i + 1) * S, 4 + P, (k + 1) * S, '3068b')); done |= set(cs); continue
            for c in cs:
                if c in done: continue
                if (c[0] + 1, c[1]) in cs and (c[0] + 1, c[1]) not in done:
                    rows_.append(put(col(i, k), (c[0] + 1) * S, 4 + P, (c[1] + .5) * S, '3069b')); done |= {c, (c[0] + 1, c[1])}
                else:
                    rows_.append(put(col(i, k), (c[0] + .5) * S, 4 + P, (c[1] + .5) * S, '3070b')); done.add(c)
    return rows_


def wave(i, k, n, face=0):
    """a crest n studs long along x on the base at stud (i, k): a 1 x n plate of medium blue, curved slopes of white and trans-clear
    breaking toward `face` (0: toward -z, pi: toward +z) and a swirl of foam; returns (rows, cells)"""
    out, cells = [], {(i + a, k) for a in range(n)}
    plate = {1: '3024', 2: '3023', 3: '3623', 4: '3710', 6: '3666'}[n]
    out.append(put(MBLUE, (i + n / 2) * S, 4 + P, (k + .5) * S, plate))
    for a in range(0, n - 1, 2):
        out.append(on(WHITE if (i + a) % 4 else TCLEAR, (i + a + 1) * S, 12, (k + .5) * S, '11477', face + math.pi / 2))
    if n % 2: out.append(put(WHITE, (i + n - .5) * S, 12 + P, (k + .5) * S, '98138'))
    return out, cells


def waves():
    """the sea breaking: crests running out from the ship where the winds strike it"""
    out, cells = [], set()
    for (i, k, n, f) in ((-12, 7, 4, 0), (-8, 10, 3, 0), (-3, 12, 4, 0), (3, 9, 6, 0), (9, 12, 3, 0), (-14, -9, 4, math.pi), (-4, -12, 6, math.pi),
                         (5, -10, 3, math.pi), (10, -13, 4, math.pi), (-10, 14, 2, 0), (6, 14, 4, 0), (13, 6, 1, 0), (-13, -4, 1, 0), (-1, -7, 3, math.pi)):
        r, c = wave(i, k, n, f); out += r; cells |= c
    return out, cells


# ── the ship ──
def galley():
    base = mat_mul(T(CX, -G0, CZ), RY(math.pi / 2))
    # the oars are shipped where the bag's disc turns over the rail (the men were sailing on the west wind, not rowing)
    return root([row(r['col'], mat_mul(base, r['m']), r['part']) for r in GALLEY if not (r['part'] == '2542' and abs(r['m'][2] - 100) < 70)])


def hull_cells():
    return {(i, k) for i in range((CX - 220) // S, (CX + 220) // S) for k in range((CZ - 80) // S, (CZ + 80) // S)}


HATCH = DECK + P            # the plank laid over the hold, on the side decks' inner studs: the bag's turntable stands on it


def bag(x, z, yup, open_=True):
    """the bag of winds on its turntable: the turntable 4 x 4 at (x, z) on the surface yup; the ox-hide bag (a round brick belly, a
    domed shoulder with the neck's hollow stud); out of the neck a trans-clear spiral, and at the corners curling gusts on round
    bricks, white and trans-clear. Spin the turntable and they whirl round the bag"""
    out = [on(DGRAY, x, yup, z, '61485c01'), on(RB, x, yup + 16, z, '11213')]                           # the turntable and its disc
    t = yup + 24
    out += [on(DORANGE, x, t, z, '3943b'), on(FSILVER, x, t + 48, z, '4032a')]                          # the fat hide; the silver cord
    if open_:
        for n, (dx, dz) in enumerate(((50, 10), (-50, -10), (10, -50), (-10, 50))):                    # gusts whirling round it on the disc
            hgt = 1 + n % 2
            out += [on(TCLEAR if (n + j) % 2 else WHITE, x + dx, t + 24 * j, z + dz, '3062b') for j in range(hgt)]
            out.append(put(WHITE if n % 2 else TLBLUE, x + dx, t + 24 * hgt, z + dz, '18394' if n % 2 else '18395', RY(math.atan2(dx, dz))))
        t += 56
        winds = (('18395', WHITE, 0.4), ('35032d', TCLEAR, 0), ('18395', TLBLUE, 2.0), ('18394', WHITE, -2.4))
        for (dx, dz), (part, c, a) in zip(((-10, -10), (10, -10), (10, 10), (-10, 10)), winds):
            out.append(on(RB, x + dx, t, z + dz, '3062b'))                                                 # the gathered neck, gaping
            out.append(put(c, x + dx, t + 24, z + dz, part, RY(math.atan2(dx, dz) + a * 0.25)))             # the winds out of it
    else:
        out.append(on(RB, x, t + 56, z, '30367c'))
    return out


def hatch():
    """the plank over the hold: a 4 x 6 plate across the ship, its outer studs on the side decks"""
    x, z = ship_xz(0, 100)
    return [put(RB, x, HATCH, z, '3032', RY(math.pi / 2))]


def hand(fig, side):
    """where a hand is, in the figure's frame"""
    sh = next(p for p in fig if p[2] == ('3818' if side == 'R' else '3819'))[1]
    return min((p for p in fig if p[2] == '3820'), key=lambda p: math.dist(p[1][:3], sh[:3]))[1]


def crew():
    """five men at the bag and one at the bow; Odysseus asleep at the steering oar"""
    out = []
    C = 'ensemble.odysseuss-crew'
    # on the stern deck, abaft the bag, the man who loosed the cord: the silver cord hangs from his hand
    f = body(C, 'sailor-1', drop=('2542',)); arm(f, 'R', -1.5, 0.1); arm(f, 'L', -1.1)
    h = hand(f, 'R'); f.append([FSILVER, mat_mul(T(*h[:3]), mat_mul(RZ(math.pi / 2), T(0, 0, 0))), '61975'])
    x, z = ship_xz(0, 170); out += place(f, x, DECK, z + 20, math.pi / 2)
    # on the far rail, facing the bag: one flinging up his arms as the winds burst, one still reaching for the gold
    f = body(C, 'sailor-2', drop=('2542',)); arm(f, 'R', -2.9, 0.4); arm(f, 'L', -2.7, 0.4); head(f, -0.25)
    x, z = ship_xz(70, 80); out += place(f, x, DECK, z, math.pi)
    f = body(C, 'sailor-3', drop=('2542',)); arm(f, 'R', -1.3); arm(f, 'L', -1.0)
    x, z = ship_xz(70, 120); out += place(f, x, DECK, z, math.pi)
    # on the near rail, turning away, an arm over his face
    f = body(C, 'sailor-5', drop=('2542',)); arm(f, 'R', -2.4, 0.1); arm(f, 'L', -0.4); head(f, 0.2)
    x, z = ship_xz(70, 160); out += place(f, x, DECK, z, math.pi + 0.7)
    # in the hold forward of the bag, looking up at it
    f = body(C, 'sailor-4', drop=('2542',)); arm(f, 'R', -1.2); arm(f, 'L', -0.3); head(f, -0.3)
    x, z = ship_xz(0, 50); out += place(f, x - 10, WELL, z, -math.pi / 2)
    # at the bow, still looking home: pointing at Ithaca
    f = body('ensemble.crew', 'sailor-3', drop=('2542',)); arm(f, 'L', -1.7); arm(f, 'R', -0.2)
    x, z = ship_xz(0, -130); out += place(f, x, DECK, z, math.pi / 2)
    # Odysseus asleep on the stern deck by the steering oar, sitting slumped, his head fallen forward on his chest
    f = body('character.odysseus', 'odysseus', drop=('3847', '4499')); arm(f, 'R', -0.9, 0.2); arm(f, 'L', -0.2, 0.3); head(f, 0.6, 0.45)
    x, z = ship_xz(-50, 200); out += seated_at(f, x, DECK, z, math.pi * 0.85)
    out += steering_oar()
    return out


def steering_oar():
    """the steering oar over the stern quarter, its loom by the sleeper's hand and its blade in the sea"""
    x, z = ship_xz(-70, 200)
    m = mat_mul(T(x + 30, -(DECK + 34), z + 16), mat_mul(RY(math.pi / 2), RX(-0.55)))
    return [row(RB, m, '2542')]


# ── Ithaca ──
IX0, IZ0 = -640, -320        # the Ithaca base: 16 x 16, beside the sea's back half, ahead of the bow


def ithaca_form():
    """the headland of Ithaca: a sculpted hill of tan and dark tan stone, olive-green turf on its shoulders, a summit of three
    studded cells for the watch-fires and a few for olive trees"""
    form = Form(y0=4, unit=B, caps=True, keep_studs=('summit', 'grove'))
    cx, cz = IX0 + 170, IZ0 + 120

    def solid(p):
        x, y, z = p
        hill = smin(ell(p, (cx + 10, -20, cz - 30), (130, 260, 110)), ell(p, (cx - 100, -20, cz + 10), (80, 150, 90)), 50) + rough(p, 12, 1.3)
        if hill <= 0: return hill, ('turf' if y > 130 or (y > 80 and hill > -18) else 'rock')
        return hill, 'air'
    form.carve(solid, range(IX0 // S + 1, IX0 // S + 12), range(0, 11), range(IZ0 // S + 1, IZ0 // S + 12))
    top = {}
    for (i, h, k) in form.vox:
        if (i, k) not in top or h > top[(i, k)]: top[(i, k)] = h
    fires, grove = [], []
    for c in sorted(top, key=lambda c: (-top[c], c)):
        if all(abs(c[0] - f[0]) + abs(c[1] - f[1]) > 2 for f in fires): fires.append(c)
        if len(fires) == 3: break
    for c in sorted(top, key=lambda c: (c[0] * 7 + c[1] * 5) % 11):
        if 3 <= top[c] <= 7 and form.vox[(c[0], top[c], c[1])] == 'turf' and all(abs(c[0] - f[0]) + abs(c[1] - f[1]) > 3 for f in fires + grove):
            grove.append(c)
        if len(grove) == 3: break
    for (i, k) in fires: form.vox[(i, top[(i, k)], k)] = 'summit'
    for (i, k) in grove: form.vox[(i, top[(i, k)], k)] = 'grove'
    form.hollow(side=2, up=2, pillar=4)
    return form, [(i, top[(i, k)], k) for (i, k) in fires], [(i, top[(i, k)], k) for (i, k) in grove]


def ithaca_colour(m, i, h, k):
    if m in ('turf', 'grove'): return (GREEN, DGREEN, OLIVE, DGREEN)[(i // 2 * 3 + k // 2 + h) % 4]
    if m == 'summit': return DTAN
    a, b = (i + 2 * (h % 2)) // 3, (k + 2 * (h % 2)) // 3
    return DTAN if (a * 5 + b * 3 + h) % 3 == 0 else TAN


def watch_fire(x, yup, z):
    """a watch-fire: a bed of charred wood (a black plate), a column of trans-orange flame, three flames licking over it"""
    return [on(BLK, x, yup, z, '3024'), on(TORANGE, x, yup + 8, z, '3062b'), on(TYELLOW, x, yup + 32, z, '4589'), put(TORANGE, x, yup + 56, z, '64647'),
            put(TYELLOW, x, yup + 56, z, '64647', RY(math.pi / 2))]


def olive_tree(x, yup, z):
    """a small olive: a reddish-brown trunk of two round bricks, a crown of olive and sand-green leaves"""
    a0 = (x // 20 + z // 20) % 3
    return [on(RB, x, yup, z, '3062b')] + [put(c, x, yup + 24 + 8 * n, z, '2423', RY(a0 + n * 2.1)) for n, c in enumerate((DGREEN, OLIVE, GREEN))]


def tiles(cells, colour, yup=4):
    """tile the studs of `cells` (i, k) at the surface yup: 2 x 2 where four of a colour meet, else 1 x 2, else 1 x 1"""
    rows_, left = [], set(cells)
    for (i, k) in sorted(cells, key=lambda c: (c[1], c[0])):
        if (i, k) not in left: continue
        c = colour(i, k)
        q = [(i, k), (i + 1, k), (i, k + 1), (i + 1, k + 1)]
        if all(v in left and colour(*v) == c for v in q):
            rows_.append(put(c, (i + 1) * S, yup + P, (k + 1) * S, '3068b')); left -= set(q)
        elif (i + 1, k) in left and colour(i + 1, k) == c:
            rows_.append(put(c, (i + 1) * S, yup + P, (k + .5) * S, '3069b')); left -= {(i, k), (i + 1, k)}
        elif (i, k + 1) in left and colour(i, k + 1) == c:
            rows_.append(put(c, (i + .5) * S, yup + P, (k + 1) * S, '3069b', RY(math.pi / 2))); left -= {(i, k), (i, k + 1)}
        else:
            rows_.append(put(c, (i + .5) * S, yup + P, (k + .5) * S, '3070b')); left.discard((i, k))
    return rows_


def ithaca_details(fires, grove):
    out = [put(GREEN, IX0 + 160, 4, IZ0 + 160, '3867')]
    for (i, h, k) in fires: out += watch_fire((i + .5) * S, 4 + (h + 1) * B, (k + .5) * S)
    for (i, h, k) in grove: out += olive_tree((i + .5) * S, 4 + (h + 1) * B, (k + .5) * S)
    return out


def ithaca_ground(form):
    """the beach and the sea at the headland's foot, in tiles, inside the base's frame"""
    used = {(i, k) for (i, h, k) in form.vox if h == 0}
    fr, cells = frame(IX0, IZ0, 16, 16, plate=8)
    i0, k0 = IX0 // S, IZ0 // S
    free = {(i, k) for k in range(k0, k0 + 16) for i in range(i0, i0 + 16)} - used - cells

    def col(i, k):
        d = min(i0 + 15 - i, k0 + 15 - k)                                          # studs from the sea edges (east and south)
        if d > 3 or d == 3 and (i * 5 + k) % 3 == 0: return TAN
        return BLUE if noise(i // 2, k // 2) > -0.2 else DBLUE
    return fr + tiles(free, col)


def ithaca(form, fires, grove):
    return form.parts(ithaca_colour) + ithaca_details(fires, grove) + ithaca_ground(form)


# ── the kit ──
def main_model():
    fr, fcells = frame(-320, -320, 32, 32)
    wv, wcells = waves()
    out = [put(BLUE, 0, 4, 0, '3811')] + fr + sea(-320, -320, 32, 32, fcells, wcells) + wv
    x, z = ship_xz(0, 100)
    out += galley() + hatch() + bag(x, z, HATCH) + crew()
    return out


if __name__ == '__main__':
    import tempfile; tempfile.tempdir = '/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad'
    form, fires, grove = ithaca_form()
    left = form.settle(ithaca_colour, extra=lambda: ithaca_details(fires, grove) + ithaca_ground(form),
                       protect=lambda v: form.vox.get(v) in ('summit', 'grove'))
    print('ithaca settled, loose left:', len(left))
    ith = ithaca(form, fires, grove)
    mm = main_model()
    n = write('set.' + SLUG, 'The Bag of Winds', mm + ith)
    x, z = ship_xz(0, 100)
    subs = {'bag': [put(DGRAY, 0, 8, 0, '3958')] + bag(0, 0, 8),
            'ithaca': ith,
            'ship': galley() + hatch() + bag(x, z, HATCH) + crew()}
    for s, r in subs.items(): print(s, write(f'set.{SLUG}-{s}', f'The Bag of Winds: {s}', r))
    print('set.' + SLUG, n)
    for nm in ['set.' + SLUG] + [f'set.{SLUG}-{s}' for s in subs]: check(nm)
    manifest(SLUG, title='The Bag of Winds', book='X', tier='Medium',
             moment='Ten days out from Aeolia, with Ithaca so near the crew can see the watch-fires on its hill, Odysseus has fallen asleep '
                    'at the steering oar, and his men, sure the ox-hide bag holds gold, loosen its silver cord: every wind in it bursts out at once.',
             quote='"So they spoke, and the evil counsel of my comrades prevailed. They loosed the bag, and all the winds leapt forth." '
                   '(Odyssey X, tr. A. T. Murray)',
             object='The bag of winds: a fat ox-hide bag, its silver cord slipped, standing on a 4 x 4 turntable in the ship\'s hold with gusts of '
                    'white and trans-clear bursting from its gaping neck and whirling round it on a 6 x 6 disc; spin the turntable and the winds '
                    'wheel round the bag.',
             builds=[{'card': 'set.bag-of-winds', 'title': 'The Bag of Winds (the ship on its sea, and Ithaca)'},
                     {'card': 'set.bag-of-winds-ship', 'title': 'The ship, the crew and the bag'},
                     {'card': 'set.bag-of-winds-bag', 'title': 'The bag bursting, on its turntable'},
                     {'card': 'set.bag-of-winds-ithaca', 'title': 'Ithaca, with its watch-fires'}],
             images=[{'file': 'hero.jpg', 'caption': 'The black ship on the breaking sea, its bow to Ithaca, where three watch-fires burn on the hill.',
                      'alt': 'A LEGO galley on a tiled blue sea with white wave crests; a crowd of minifigures around a bag erupting in white '
                             'and clear swirls; behind, a green-topped tan headland with three flames on its summit.'},
                     {'file': 'close.jpg', 'caption': 'In the stern Odysseus sleeps slumped by the steering oar while his men open the bag.',
                      'alt': 'Close view of the ship: a seated minifigure with head bowed at the stern, four crewmen around an orange-brown '
                             'bag with a silver band, white and clear flame elements rising from its neck.'},
                     {'file': 'ship.jpg', 'caption': 'The ship alone: the bag on its turntable over the hold, the man at the bow still pointing home.',
                      'alt': 'The galley with its mast and sail, the bag and crew amidships and a crewman at the bow.'},
                     {'file': 'bag.jpg', 'caption': 'The bag bursting: the winds from its neck and four gusts whirling round it on the turntable\'s disc.',
                      'alt': 'An orange-brown cone-shaped bag with a silver ring and four brown round bricks at its neck, white and clear '
                             'flame pieces rising, on a round plate on a turntable.'},
                     {'file': 'ithaca.jpg', 'caption': 'Ithaca: a headland of tan stone, green on its shoulders, olive trees and three watch-fires.',
                      'alt': 'A sculpted brick hill on a 16 x 16 base with a sand beach and sea tiles, three flame elements on top.'}],
             features=['The ship is the line\'s galley, resting as its own root on a sea of tiles laid in patches of blue and dark blue over a 32 x 32 baseplate.',
                       'White and trans-clear curved slopes on medium-blue plates make the crests of a sea already breaking under the loosed winds.',
                       'The bag is a 4 x 4 cone of dark orange for the hide, a pearl-silver 2 x 2 round plate for the cord, and four round bricks for the gaping neck.',
                       'A 4 x 4 turntable and a 6 x 6 round disc over the hold carry the bag and its gusts; the oars beside it are shipped so the disc turns clear.',
                       'Odysseus sits asleep on the stern deck, head fallen forward, by the steering oar; the man who loosed the cord still holds it, coiled.',
                       'Ithaca is a sculpted headland on its own 16 x 16 base, set ahead of the bow: tan and dark tan stone finished in cheese slopes and tiles, three watch-fires and olive trees on studs left for them.',
                       'Both bases are finished in the line\'s white tile frame with a black and gold nameplate.'],
             subs=[{'file': 'ship.jpg', 'title': 'The ship and the bag', 'pieces': pieces('set.bag-of-winds-ship'),
                    'text': 'The galley with the plank over its hold, the bag on its turntable, six of the crew and Odysseus asleep.'},
                   {'file': 'bag.jpg', 'title': 'The bag bursting', 'pieces': pieces('set.bag-of-winds-bag'),
                    'text': 'The play feature on its own: the bag, its slipped silver cord and the winds, on a turntable that spins them round.'},
                   {'file': 'ithaca.jpg', 'title': 'Ithaca', 'pieces': pieces('set.bag-of-winds-ithaca'),
                    'text': 'The home the men could see and never reached: a headland with three watch-fires, a beach and olive trees.'}],
             sources=['assets/prop/bag-of-winds.mjs', 'assets/location/aeolia-floating-island.mjs', 'scenes/OD-B10-S01.mjs', 'scenes/OD-B10-S02.mjs',
                      'scenes/_artifacts.mjs'],
             status='Built to the bar',
             next=['The sail is the donor galley\'s fixed sail; it does not yet show the wind turning and driving the ship back.',
                   'Odysseus\'s sleep is shown by pose only (seated, head bowed); no closed-eye head print is used.',
                   'The gusts on the disc stand on round bricks; a version with clips that swing up as the bag opens is not built.',
                   'Figures and angled parts (the flames, the spiral, the oars) are placed by hand and are not checked by the click tool.'])
