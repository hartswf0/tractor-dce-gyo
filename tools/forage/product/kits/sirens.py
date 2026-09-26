#!/usr/bin/env python3
"""tools/forage/product/kits/sirens.py — THE SIRENS (Odyssey XII), a Medium kit of the Odyssey line.

  python3 tools/forage/product/kits/sirens.py     -> odyssey/cards/set.sirens*.mpd, odyssey/kits/sirens/kit.json

The moment: the wind has died; the black ship rows past the Sirens' island, the crew's ears stopped with wax, and Odysseus, bound upright
at the mast, strains at the ropes while Eurylochus and Perimedes haul them tighter. On the island the two Sirens sing in their meadow of
flowers, heaped with the bones of men.

The object is the mast: a column of round bricks stepped on the ship's floor, the lashing band wound round it in tan, and at its foot the
place where he is bound: two posts either side of him, each with a clip at the ankle and at the chest, a rope-bar held across him in each
pair of clips. The ship is brick-built (a black hull on a doubled keel of plates, vermilion cheeks at the bow, a timber gunwale) and
stands on its own 32 x 32 base of sea tiles, afloat (kitlib.root: it rests on smooth tiles, as a boat on water), so it displays alone.
The Sirens' rock is a second build on a 16 x 32 base that stands beside it.
"""
import math, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
from sculpt import Form, ell, smin, rough, S, P, B, PLATES, TILES, BRICKS

GR = 4
SEA = GR + P
PACK = Form()


def pack(cells, yup_top, colour_of, sizes, along_z=False):
    rows = []
    PACK._pack(rows, cells, yup_top, colour_of, along_z, sizes)
    return rows


def fig(card, sub, x, yup, z, rot=0, drop=()):
    return figure(card, sub, x, yup, z, rot, drop=drop)


def cells_of(x, z, w, d):
    return {(i, k) for i in range(round(x / S - w / 2), round(x / S + w / 2)) for k in range(round(z / S - d / 2), round(z / S + d / 2))}


# ── the ship, in its own frame: bow toward +x, 28 studs long and 8 broad, its keel's underside at y 0 ──
def half_width(u):
    xc = abs((u + .5) * S)
    return 4 if xc <= 210 else 3 if xc <= 230 else 2 if xc <= 250 else 1


SHAPE = {(u, v) for u in range(-14, 14) for v in range(-4, 4) if -half_width(u) <= v < half_width(u)}
RIM = {(u, v) for (u, v) in SHAPE if any((u + a, v + b) not in SHAPE for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))}
FLOOR = 2 * P                           # the floor: the top of the doubled keel
WALL = FLOOR + B                        # the top of the hull's side
ROWERS = [(x, z) for x in (-200, -140, 140, 200) for z in (-50, 50)]
POSTS = [(-50, 30), (50, 30)]           # the posts either side of the bound man
ODY = (0, 30)                            # Odysseus, his back to the mast
MAST = (0, 0)


def ship():
    """the galley, the mast and the men, in the ship's frame"""
    out = []
    keep = set()                                                                             # floor studs left bare: feet, posts, mast
    for x, z in ROWERS + [ODY, (-100, 30), (100, 30), (-240, 10)]: keep |= cells_of(x, z, 2, 1)
    for x, z in POSTS: keep |= cells_of(x, z, 1, 1) | cells_of(x, z + 20, 1, 1)
    keep |= cells_of(0, 0, 2, 2) | {(1, -2)}
    col_cell = lambda u, v: BLK
    out += pack(SHAPE, P, col_cell, PLATES, False)                                        # the keel, two plates laid crosswise
    out += pack(SHAPE, 2 * P, col_cell, PLATES, True)
    out += pack(RIM, WALL, lambda u, v: DRED if u >= 10 else BLK, BRICKS, False)            # the side: black, vermilion cheeks at the bow
    posts = {(13, -1), (13, 0), (-14, -1), (-14, 0)}
    ends = {(u, v) for (u, v) in RIM if u >= 11 or u <= -12} - posts                          # the ends sweep up a course
    out += pack(ends, WALL + B, lambda u, v: DRED if u >= 10 else BLK, BRICKS, True)
    out += pack(RIM - posts - ends, WALL + P, lambda u, v: RB, TILES, False)               # the gunwale
    out += pack(ends, WALL + B + P, lambda u, v: RB, TILES, True)
    inner = SHAPE - RIM - keep
    out += pack(inner, FLOOR + P, lambda u, v: DTAN if (u // 3) % 2 else TAN, TILES, True)   # the floor, planked; studs left where men stand
    # the stem and the stern post, rising
    for n in range(3): out.append(put(DRED if n == 0 else BLK, 270, WALL + B * (n + 1), 0, '3004', RY(math.pi / 2)))
    out.append(on(BLK, 270, WALL + 3 * B, 0, '11477'))
    for n in range(5): out.append(put(BLK, -270, WALL + B * (n + 1), 0, '3004', RY(math.pi / 2)))
    out.append(on(BLK, -270, WALL + 5 * B, 0, '11477', math.pi))
    # the mast: round bricks, the lashing band wound round it in tan, the yard across its head
    y = FLOOR
    for n, kind in enumerate('bbcbcbbbbbb'):
        if kind == 'b': out.append(on(RB, 0, y, 0, '3941')); y += B
        else: out.append(put(TAN, 0, y + P, 0, '4032a')); y += P
    out.append(put(RB, 0, y + P, 0, '3034', RY(math.pi / 2))); y += P                     # the yard, athwartships, the sail furled
    out.append(put(DB, 0, y + P, 0, '3068b'))
    out += [put(WHITE, 10, y - P, z, '3004', RY(math.pi / 2)) for z in (-60, 60)]              # the sail, furled on the yard
    # the posts, a clip at the ankle and at the chest, the rope-bars across him
    for x, z in POSTS:
        out += [on(RB, x, FLOOR + B * n, z, '3005') for n in range(2)] + [put(DB, x, FLOOR + 2 * B + P, z, '3024')]
        out.append(put(RB, x, FLOOR + 2 * B + 2 * P, z, '4085c', RY(math.pi)))                # the chest clip, facing forward
        out.append(on(RB, x, FLOOR, z + 20, '60475b', -math.pi / 2 if x > 0 else math.pi / 2))   # the ankle clip, facing in
    out.append(row(TAN, mat_mul(T(-54, -(FLOOR + 2 * B + P + 4), 47), RZ(math.pi / 2)), '4095'))   # the rope across his arms
    out.append(row(TAN, mat_mul(T(-40, -(FLOOR + 14), 50), RZ(math.pi / 2)), '30374'))         # the rope across his shins
    out.append(put(YELLOW, 30, FLOOR + P, -30, '98138'))                                   # the lump of beeswax, cut for their ears
    # the men
    out += fig('character.odysseus', 'odysseus', ODY[0], FLOOR, ODY[1], math.pi, drop=('4499', '3847'))
    out += fig('character.eurylochus', 'eurylochus', -100, FLOOR, 30, -math.pi / 2, drop=('2542',))
    out += fig('ensemble.crew', 'sailor-5', 100, FLOOR, 30, math.pi / 2, drop=('2542',))            # Perimedes
    out += fig('ensemble.crew', 'sailor-3', -240, FLOOR, 10, -math.pi / 2, drop=('2542',))          # the helmsman
    for n, (x, z) in enumerate(ROWERS):
        out += fig('ensemble.crew', f'sailor-{n % 4 + 1}', x, FLOOR, z, math.pi / 2, drop=('2542',))
        s = 1 if z > 0 else -1                                                                  # the oar, from his hands out over the side
        a = math.radians(60) * s
        out.append(row(RB, mat_mul(T(x - 16, -(FLOOR + 62), z + 4 * s), RX(a)), '2542'))
    a = math.radians(60)
    out.append(row(RB, mat_mul(T(-250, -(WALL + 40), 60), mat_mul(RY(0.5), RX(a))), '2542'))    # the steering oar
    return out


def place(rows, x, yup, z, rot=0):
    """move rows of the ship's frame to (x, yup, z) on the sea"""
    base = mat_mul(T(x, -yup, z), RY(rot))
    out = []
    for r in rows:
        if not r.startswith('1 '): out.append(r); continue
        t = r.split()
        out.append(row(int(t[1]), mat_mul(base, [float(v) for v in t[2:14]]), t[14]))
    return out


SHIP_AT = (160, 40)


def splash(taken):
    """foam where the oar blades dip, and the wake astern: white round tiles on the baseplate among the sea's tiles"""
    cells = set()
    for x, z in ROWERS:
        s = 1 if z > 0 else -1
        bx, bz = SHIP_AT[0] + x - 16, SHIP_AT[1] + z + s * 125
        i, k = math.floor(bx / S), math.floor(bz / S)
        cells |= {(i, k), (i - 1, k), (i, k + s)}
    for u in range(3):
        for v in (-2 - u, 1 + u):
            cells.add((math.floor((SHIP_AT[0] - 300 - 40 * u) / S), math.floor(SHIP_AT[1] / S) + v))
    return {c for c in cells if c not in taken and -7 <= c[0] <= 22 and -15 <= c[1] <= 14}


def sea_base():
    """the ship's own base: 32 x 32, the sea in tiles, the frame and nameplate; the ship afloat on it"""
    rows, cells = frame(-160, -320, 32, 32, GR)
    out = [put(BLUE, 160, GR, 0, '3811')] + rows
    taken = set(cells)
    foam = splash(taken)
    out += [put(WHITE if (i + k) % 3 else TCLEAR, (i + .5) * S, SEA, (k + .5) * S, '98138') for (i, k) in sorted(foam)]
    taken |= foam
    sea = {(i, k) for i in range(-8, 24) for k in range(-16, 16) if (i, k) not in taken}

    def col(i, k):
        n = (i // 2 * 7 + k // 2 * 5 + (i // 4) * (k // 4)) % 11
        return TLBLUE if n in (0, 5) else TCLEAR if n == 8 else MBLUE if n in (2, 9) else BLUE
    out += pack(sea, SEA, col, [((2, 2), '3068b'), ((1, 2), '3069b'), ((1, 1), '3070b')])
    out += root(place(ship(), SHIP_AT[0], SEA, SHIP_AT[1]))
    return out


# ── the Sirens' rock: a second build on 16 x 32 ──
def rock_solid(p):
    x, y, z = p
    crag = smin(ell(p, (-360, 0, -150), (110, 230, 130)), ell(p, (-270, 0, -200), (80, 170, 90)), 50)       # the crag behind
    shelf = max(smin(ell(p, (-320, 0, 40), (135, 200, 210)), ell(p, (-300, 0, 190), (90, 140, 90)), 60),
                y - 76 - 10 * math.sin(x / 50) * math.sin(z / 70))                                          # the meadow's shelf
    g = smin(crag, shelf, 30) + rough(p, 14, 2.1)
    return g, 'rock'


rock = Form(y0=GR, keep_studs=('meadow',), unit=B, caps=True)
rock.carve(rock_solid, range(-23, -9), range(0, 10), range(-15, 15))
for (i, h, k), m in list(rock.vox.items()):
    if (i, h + 1, k) not in rock.vox and 2 <= h <= 3 and (k + .5) * S > -120: rock.vox[(i, h, k)] = 'meadow'
rock.hollow(side=2, up=2, pillar=4)


def rock_colour(m, i, h, k):
    a, b = (i + 2 * (h % 2)) // 3, (k + 2 * (h % 2)) // 3
    if m == 'meadow': return OLIVE if (a * 3 + b * 5) % 5 == 0 else GREEN
    n = (a * 5 + b * 3 + h) % 6
    return (DBG, DBG, LBG, DTAN, DBG, LBG)[n]


def rock_top(i, k):
    hs = [h for (ii, h, kk) in rock.vox if ii == i and kk == k]
    return (GR + (max(hs) + 1) * B, rock.vox[(i, max(hs), k)]) if hs else (None, None)


SIRENS = [('nymph-1', -340, 30, TAN), ('nymph-2', -280, 90, DTAN)]


def siren(sub, x, yup, z, col, rot):
    """a Siren: a woman's head and hair on a body with bird's wings for arms (the torso with bird-wing arms), feathered legs"""
    rows = figure('ensemble.the-sirens', sub, x, yup, z, rot, drop=('3818', '3819', '3820', '36752a'))
    out = []
    for r in rows:
        t = r.split()
        if t[-1] == '973p0w.dat': t[-1], t[1] = '11938.dat', str(col)
        elif t[-1] in ('3815b.dat', '3816c.dat', '3817c.dat'): t[1] = str(col)
        out.append(' '.join(t))
    return out


def rock_details():
    out = []
    taken = set()
    for sub, x, z, col in SIRENS:
        y, m = rock_top(round(x / S - .5), round(z / S - .5))
        out += siren(sub, x, y, z, col, math.pi)
        taken |= cells_of(x, z, 2, 1)
    # flowers and bones in the meadow
    for (i, h, k), m in sorted(rock.vox.items()):
        if m != 'meadow' or (i, h + 1, k) in rock.vox or (i, k) in taken: continue
        y = GR + (h + 1) * B
        n = (i * 13 + k * 7 + i * k) % 11
        if n in (0, 6): out.append(put((YELLOW, WHITE, RED, MLAV)[(i + k) % 4], (i + .5) * S, y + P, (k + .5) * S, '98138'))
        elif n == 3 and (i + k) % 3 == 0: out.append(on(GREEN if i % 2 else DGREEN, (i + .5) * S, y, (k + .5) * S, '6255'))
        elif n in (8, 9): out.append(row(WHITE if n == 8 else TAN, mat_mul(T((i + .5) * S, -(y + 4 + 4), (k + .5) * S), mat_mul(RY(0.7 * (i - k)), RZ(math.pi / 2))), '93160'))
    return out


def rock_base():
    out = [put(BLUE, -320, GR, 0, '3857', RY(math.pi / 2))]
    ring = [(i, -16) for i in range(-24, -8)] + [(i, 15) for i in range(-24, -8)] + [(-24, k) for k in range(-15, 15)] + [(-9, k) for k in range(-15, 15)]
    out += tile_run(WHITE, -480, -320, 16, GR) + tile_run(WHITE, -480, 300, 16, GR)
    out += tile_run(WHITE, -480, -300, 30, GR, False) + tile_run(WHITE, -180, -300, 30, GR, False)
    feet = {(i, k) for (i, h, k) in rock.vox if h == 0}
    sea = {(i, k) for i in range(-23, -9) for k in range(-15, 15) if (i, k) not in feet}
    col = lambda i, k: TLBLUE if (i // 2 * 3 + k // 2 * 7) % 5 == 0 else MBLUE if (i + k // 2) % 4 == 0 else BLUE
    out += pack(sea, SEA, col, [((2, 2), '3068b'), ((1, 2), '3069b'), ((1, 1), '3070b')])
    return out


if __name__ == '__main__':
    left = rock.settle(rock_colour, extra=lambda: rock_base() + rock_details())
    rk = rock.parts(rock_colour) + rock_base() + rock_details()
    sb = sea_base()
    title = 'The Sirens'
    write('set.sirens', title, rk + sb)
    write('set.sirens-ship', title + ': the ship and the bound man', sb)
    write('set.sirens-rock', title + ": the Sirens' rock", rk)
    write('set.sirens-galley', title + ': the galley alone, off its base', ship())
    for nm in ('set.sirens', 'set.sirens-ship', 'set.sirens-rock', 'set.sirens-galley'):
        print(nm, pieces(nm)); check(nm)
    manifest('sirens', title=title, book='XII', tier='Medium',
             moment="The wind has died; the black ship rows past the Sirens' island, the crew's ears stopped with wax, Odysseus bound upright at the mast and straining at the ropes while the two Sirens sing in their meadow heaped with bones.",
             quote='"Come hither on thy way, renowned Odysseus, great glory of the Achaeans; stay thy ship that thou mayest listen to the voice of us two." (Odyssey XII, tr. A. T. Murray)',
             object='The mast: a column of round bricks with the lashing band wound round it in tan, and at its foot the place where he is bound, two posts with a clip at the ankle and at the chest and a rope-bar across him in each pair.',
             builds=[{'card': 'set.sirens', 'title': "The ship passing the Sirens' rock"},
                     {'card': 'set.sirens-ship', 'title': 'The ship and the bound man, on its own base of sea'},
                     {'card': 'set.sirens-rock', 'title': "The Sirens' rock"},
                     {'card': 'set.sirens-galley', 'title': 'The galley alone, off its base'}],
             images=[{'file': 'hero.jpg', 'caption': "The two builds side by side, 48 x 32 studs: the galley rowing past, the Sirens in their meadow of flowers and bones.",
                      'alt': 'A black brick galley with a timber gunwale and oars dipping into a sea of blue and clear tiles, a man in red bound between two posts at the mast, and beside it a grey rock with a green meadow scattered with white bones and red and yellow flowers, two winged women standing on it.'},
                     {'file': 'mast.jpg', 'caption': 'The object: Odysseus bound at the mast, the rope-bar across his arms held in two clips, Eurylochus and Perimedes beside him, the rowers at their oars.',
                      'alt': 'Close view of a minifigure in red standing against a brown round-brick mast, a tan bar across his hands held by clips on two brown posts, sailors on either side.'}],
             features=['The galley is brick-built: a doubled keel of black plates laid crosswise, a side course of black bricks with vermilion cheeks at the bow, ends that sweep up a course to the stem and the stern post, a timber gunwale in tiles.',
                       'The mast is round bricks stepped on the floor, with tan round plates wound into it as the lashing band and the furled sail hung under the yard.',
                       'Odysseus is bound between two posts: a clip-brick at his ankles, a clip-plate at his chest, and a rope-bar across him in each pair of clips.',
                       'Eight rowers at the oars face aft; Eurylochus and Perimedes stand by the ropes; a lump of beeswax lies on the floor by the mast.',
                       'The ship stands afloat on its own 32 x 32 base of sea tiles with its nameplate; white round tiles mark the splash of the blades and the wake.',
                       "The Sirens' rock is sculpted: a grey crag, a meadow shelf with its studs kept for flowers, bones lying in the grass, and two Sirens with bird-wing arms."],
             subs=[{'file': 'ship.jpg', 'title': 'The ship and the bound man', 'pieces': pieces('set.sirens-ship'), 'text': 'The galley afloat on its own base of sea, framed and named; displays alone.'},
                   {'file': 'rock.jpg', 'title': "The Sirens' rock", 'pieces': pieces('set.sirens-rock'), 'text': 'The crag, the meadow of flowers and bones, the two Sirens, on 16 x 32.'},
                   {'file': 'galley.jpg', 'title': 'The galley alone', 'pieces': pieces('set.sirens-galley'), 'text': 'Lifted off the sea: every part of the hull and the mast checked to click without the sea to hold it.'}],
             sources=['scenes/OD-B12-S03.mjs', 'assets/location/sirens-island.mjs', 'assets/prop/mast-ropes-and-beeswax.mjs'],
             status='Built to the bar',
             next=['The donor galley (kit-galley.json) was not used: its unitary hull has only a few deck studs, so the brick hull was built instead so that the mast step and the posts click.',
                   'The rope-bars, the clips that hold them, the oars and the figures are placed by hand; the click checker does not see parts off the grid or at an angle.',
                   'The wax in the crew\'s ears cannot be shown at minifigure scale; only the lump of beeswax on the floor tells it.',
                   'Two of the near-side oars cross each other from some angles.'])
