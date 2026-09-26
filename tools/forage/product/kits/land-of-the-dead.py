#!/usr/bin/env python3
"""tools/forage/product/kits/land-of-the-dead.py — THE LAND OF THE DEAD (Odyssey XI), a Large kit of the Odyssey line.

  python3 tools/forage/product/kits/land-of-the-dead.py    -> odyssey/cards/set.land-of-the-dead*.mpd, odyssey/kits/land-of-the-dead/kit.json

The moment: on the sunless Cimmerian shore Odysseus has cut the throats of the ram and the black ewe over the trench he dug a cubit
each way; the shades crowd up out of Erebus to drink; he sits (here stands) with his sword drawn and holds them off until Tiresias
comes, leaning on his golden staff. His mother's shade stands among them.

The base is 48 x 32 (a 32 x 32 and a 16 x 32 baseplate): the dark ocean-stream along the back, the black ship hauled up on the
strand, a crag of dark rock at the right with Persephone's black poplars and willows on it, the black-sand shore, and in front the
trench: a pit of dark blood ringed by heaped spoil. The shades are ghost shrouds on clear columns, so they seem to rise out of the
ground; four stand on turntables set in the sand and swivel toward the blood. At the left front Elpenor's mound, his oar planted on it.

The shore is laid as a height field of plates (tools/forage/product/sculpt.py, plate cells), tiled on top, studs kept only where a
foot, a turntable or a tree stands; the crag is sculpted in bricks with every top capped. Both are settled together until every part
clicks.
"""
import math, os, sys, copy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
import json

SLUG = 'land-of-the-dead'
BASE = 4                       # the baseplates' top
X0, Z0, W, D = -480, -320, 48, 32
GALLEY = json.load(open(os.path.join(ROOT, 'odyssey/keyframes/kit-galley.json')))
GLOW = 294                     # glow-in-the-dark trans (the shades' faces and Tiresias)

# ── the display base finish (the frame's cells are kept clear) ──
FRAME, RING = frame(X0, Z0, W, D, BASE)
def free(i, k): return (i, k) not in RING and -24 <= i < 24 and -16 <= k < 16

# ── where things stand (studs kept): (i, k) stud squares ──
PIT = (-5, 5, 3, 7)            # the trench: i -5..4, k 3..6 (x -100..100, z 60..140)
TURN = [(-200, 20), (200, 100), (-80, -20), (120, -20)]        # the four 4 x 4 turntables (centre on a stud corner)
TIRESIAS = (30, -10)          # his column's stud (odd multiples of 10)
ANTICLEIA = (190, 10)
ELPENOR = (230, 170)
MOUND = (330, 170)             # Elpenor's mound (centre, a stud corner)
LOOSE_SHADES = [(-290, 10, 1), (-330, 110, 2), (290, 10, 3), (-150, -70, 4), (-170, 250, 5), (-330, 230, 6), (-250, 270, 7)]   # shades further off, on plain columns
ODYSSEUS = (150, 140)          # at the trench's end, facing along it (-x), sword out over the blood
CREW = [(-250, 180), (-250, 120)]   # Perimedes and Eurylochus, who held the victims (facing +x)
WELLS = [(-50, 30), (70, 30), (-130, 70)]   # openings in the spoil round the trench (centre stud, 3 x 3 holes)
BOWLS = [(100, 200), (60, 220), (140, 220)]
RAMS = [(-190, 100, math.pi / 2), (-190, 180, math.pi / 2)]      # black ewe and ram at the trench's end, facing it (+x)
TREES = [(-420, -260, 'poplar'), (-340, -200, 'willow'), (-260, -260, 'poplar'), (-180, -180, 'willow'), (-440, -120, 'willow'),
         (-360, -60, 'poplar')]


def pads():
    """stud squares whose studs are kept on the ground: every foot, turntable, column and socket"""
    out = set()
    sq = lambda x, z, w=1, d=1: {(math.floor(x / S) + a, math.floor(z / S) + b) for a in range(w) for b in range(d)}
    for x, z in TURN: out |= sq(x - 40, z - 40, 4, 4)
    for x, z in (TIRESIAS, ANTICLEIA, ELPENOR) + tuple((x, z) for x, z, _ in LOOSE_SHADES): out |= sq(x, z)
    out |= sq(TIRESIAS[0] + 40, TIRESIAS[1])                                # the staff's socket
    for x, z in (ODYSSEUS,) + tuple(CREW) : out |= sq(x, z - 10) | sq(x, z + 10)      # turned to face along x: feet one behind the other
    for x, z in BOWLS: out |= sq(x - 20, z - 20, 2, 2)
    for x, z, _ in RAMS: out |= sq(x - 20, z - 20, 2, 2)
    out |= {(i, 6) for i in range(-8, -5)}                                   # the blood running from the ram into the trench
    return out


PADS = pads()


def in_well(i, k):
    return any(abs(i - math.floor(x / S)) <= 1 and abs(k - math.floor(z / S)) <= 1 for x, z in WELLS)


def in_pit(i, k): return PIT[0] <= i < PIT[1] and PIT[2] <= k < PIT[3]


def pit_dist(i, k):
    dx = max(PIT[0] - i, 0, i - (PIT[1] - 1)); dz = max(PIT[2] - k, 0, k - (PIT[3] - 1))
    return max(dx, dz)


# ── the crag (bricks, capped) ──
def crag(p):
    x, y, z = p
    r = smin(ell(p, (-330, 0, -230), (190, 250, 120)), ell(p, (-420, 0, -90), (90, 150, 110)), 50)
    r = smin(r, ell(p, (-200, 0, -250), (110, 150, 70)), 40)
    r += rough(p, 16, 1.3)
    return r, 'rock'


rock = Form(y0=BASE, keep_studs=('root',), unit=B, caps=True)
rock.carve(crag, range(-24, -4), range(0, 12), range(-16, 0))
for v in [v for v in rock.vox if not free(v[0], v[2])]: del rock.vox[v]
rock.hollow(side=2, up=2, pillar=4)


def rock_top(i, k):
    hs = [h for (ii, h, kk) in rock.vox if ii == i and kk == k]
    return max(hs) if hs else None


def root_pads():
    """a tree on the crag stands on a 2 x 2 of studs kept at one height; a tree off the crag stands on the sand's pads"""
    for x, z, kind in TREES:
        i, k = x // S - 1, z // S - 1
        cells = [(i + a, k + b) for a in (0, 1) for b in (0, 1)]
        tops = [rock_top(*c) for c in cells]
        if all(t is not None for t in tops):
            t = max(tops)
            for (a, b) in cells:
                for h in range(t + 1):
                    if (a, h, b) not in rock.vox: rock.vox[(a, h, b)] = 'rock'
                rock.vox[(a, t, b)] = 'root'
                for h in range(t + 1, 20): rock.vox.pop((a, h, b), None)


root_pads()


def rock_colour(m, i, h, k):
    if m == 'root': return BLK
    a, b = (i + 2 * (h % 2)) // 4, (k + 2 * (h % 2)) // 4
    if (h + (a + b) // 3) % 6 == 0: return BLK
    return LBG if (a * 5 + b * 3 + h // 2) % 7 == 0 else DBG


# ── the shore (plates, tiled) ──
def height(i, k):
    """plates of ground at the stud square (i, k): the top layer's index (0: a tile on the baseplate)"""
    x, z = (i + 0.5) * S, (k + 0.5) * S
    if k < -5: return 0                                                          # the ocean-stream and the strand the ship lies on
    if in_pit(i, k): return 1
    d = pit_dist(i, k)
    if d == 1: return 3 if k >= PIT[3] else 4                                   # the spoil heaped round the pit, lower at the front
    if d == 2: return 2 if k >= PIT[3] else 3
    r = math.hypot(x - MOUND[0], z - MOUND[1]) / S
    if r < 4.6: return 1 + max(0, round(6.5 * (1 - (r / 4.6) ** 1.6)))
    n = math.sin(x / 53 + 1) * math.sin(z / 41) + 0.5 * math.sin((x - z) / 67) + 0.4 * math.sin(x / 29 - z / 37)
    if (i, k) in PADS or any((i + a, k + b) in PADS for a in (-1, 0, 1) for b in (-1, 0, 1)): return 1
    return 3 if n > 1.15 else 2 if n > 0.55 else 1                             # low dunes of black sand


def material(i, h, k, H):
    if k < -10: return 'sea'
    if k < -5: return 'strand'
    if in_pit(i, k): return 'blood' if h == H else 'bloodbed'
    if h == H and (i, k) in PADS: return 'pad'
    if pit_dist(i, k) <= 2 and h >= 2: return 'spoil'
    if math.hypot((i + 0.5) * S - MOUND[0], (k + 0.5) * S - MOUND[1]) / S < 4.6 and h >= 2: return 'mound'
    if h == H and (i, k) in PADS: return 'pad'
    return 'sand'


ground = Form(y0=BASE, keep_studs=('pad',), unit=P)
for i in range(-24, 24):
    for k in range(-16, 16):
        if not free(i, k) or (i, 0, k) in rock.vox or in_well(i, k): continue
        H = height(i, k)
        for h in range(H + 1): ground.vox[(i, h, k)] = material(i, h, k, H)
MT = max(h for (i, h, k) in ground.vox if (i, k) == (MOUND[0] // S, MOUND[1] // S))
ground.vox[(MOUND[0] // S, MT, MOUND[1] // S)] = 'pad'      # the socket the oar is planted in


def ground_colour(m, i, h, k):
    a, b = i // 3, k // 3
    if m == 'sea':
        t = (i * 7 + k * 3) % 9
        return TDBLUE if t in (0, 4) else BLK if t in (2, 7) else DBLUE
    if m == 'strand': return DBG if (a * 3 + b) % 5 == 0 else BLK
    if m == 'blood': return TRED if (i + k) % 3 else DRED
    if m == 'bloodbed': return DRED
    if m == 'spoil': return DRED if (a * 3 + b + h // 2) % 7 == 0 else DBG if (i + k + h) % 4 == 0 else BLK
    if m == 'mound': return LBG if (i // 2 * 3 + k // 2 + h // 2) % 7 == 0 else DBG
    if m == 'pad': return BLK
    return DBG if (a * 5 + b * 7) % 13 == 0 else BLK


def top(x, z):
    i, k = math.floor(x / S), math.floor(z / S)
    hs = [h for (ii, h, kk) in ground.vox if ii == i and kk == k]
    return BASE + (max(hs) + 1) * P if hs else BASE


# ── the dead ──
def shade(x, yup, z, face, col=TCLEAR, lift=4, head='3626bp0f', plates=1):
    """a shade rising out of the ground: a clear column of `lift` 1 x 1 round bricks on the stud at (x, z), a round plate, the head on
    its stud and the ghost shroud dropped over the column (its hem floats above the sand); `face` the angle it looks along"""
    out = [on(TCLEAR, x, yup + 24 * j, z, '3062b') for j in range(lift)]
    y = yup + 24 * lift
    for _ in range(plates):
        out.append(on(TCLEAR, x, y, z, '3024')); y += 8
    out.append(put(GLOW if head == '3626bp0f' else 15, x, y + 24, z, head, RY(face)))
    out.append(put(col, x, y, z, '2588', RY(face)))
    return out


def face_to(x, z, tx=0, tz=60):
    """the turn that makes a figure (facing -z at 0) look toward (tx, tz)"""
    return math.atan2(-(tx - x), -(tz - z))


def turned_shade(x, z, cols, lifts):
    """a 4 x 4 turntable set in the sand with two shades on its studs: turn it and the shades circle, swinging toward the blood"""
    y = top(x, z)
    out = [on(BLK, x, y, z, '3403c01')]
    for (dx, dz), col, lift in zip(((-30, -10), (30, 10)), cols, lifts):
        sx, sz = x + dx, z + dz
        out += shade(sx, y + 24, sz, face_to(sx, sz), col, lift)
    return out


def tiresias():
    x, z = TIRESIAS
    y = top(x, z)
    out = shade(x, y, z, face_to(x, z, *ODYSSEUS), GLOW, 5)
    sx = x + 40
    out += [on(GOLD, sx, y, z, '4073'), on(GOLD, sx, y + 8, z, '3957a')]          # the golden staff, planted
    return out


def elpenor_mound():
    """the heaped mound, a ring of stones at its foot, the oar planted on its crown in a round brick's open stud"""
    x, z = MOUND
    i, k = x // S, z // S
    y = BASE + (MT + 1) * P
    cx, cz = (i + 0.5) * S, (k + 0.5) * S
    out = [on(DBG, cx, y, cz, '3062b')]
    out.append(put(RB, cx, y + 28, cz, '2542', RX(math.pi)))     # blade up, the grip in the stud
    return out


def the_rite():
    out = []
    for n, (x, z) in enumerate(TURN): out += turned_shade(x, z, ((TCLEAR, TLBLUE), (TLBLUE, TCLEAR))[n % 2], ((4, 5), (5, 3))[n % 2])
    for x, z, n in LOOSE_SHADES: out += shade(x, top(x, z), z, face_to(x, z), (TLBLUE, TCLEAR, TCLEAR, TLBLUE, TCLEAR, TLBLUE, GLOW)[n - 1], 3 + n % 2)
    for n, (x, z) in enumerate(WELLS):                                      # rising out of the earth through the openings
        out += shade(x, BASE, z, face_to(x, z, *ODYSSEUS), (GLOW, TCLEAR, TLBLUE)[n], 3, plates=2)
    out += tiresias()
    out += shade(ANTICLEIA[0], top(*ANTICLEIA), ANTICLEIA[1], face_to(*ANTICLEIA, *ODYSSEUS), TLBLUE, 4)
    out += shade(ELPENOR[0], top(*ELPENOR), ELPENOR[1], face_to(*ELPENOR, *ODYSSEUS), TCLEAR, 3)
    x, z = ODYSSEUS
    out += figure('character.odysseus', 'odysseus', x, top(x, z - 10), z, math.pi / 2, drop=('4499',))
    for n, (x, z) in enumerate(CREW):
        out += figure('ensemble.crew', f'sailor-{n + 1}', x, top(x, z - 10), z, -math.pi / 2)
    for x, z, r in RAMS:
        out.append(on(BLK, x, top(x - 10, z - 10), z, '95341', r))
    out += [on(TRED, (i + 0.5) * S, top((i + 0.5) * S, 130), 130, '6141') for i in range(-8, -5)]
    out += [on(c, x, top(x, z), z, '4740') for (x, z), c in zip(BOWLS, (GOLD, DTAN, DTAN))]                              # the libations: milk and honey, wine, water   # the blood running in
    out += elpenor_mound()
    return out


def trees():
    out = []
    for x, z, kind in TREES:
        i, k = x // S - 1, z // S - 1
        t = rock_top(i, k)
        y = BASE + (t + 1) * B if t is not None else top(x, z)
        trunk = [on(BLK if kind == 'poplar' else DB, x, y + 24 * j, z, '3941') for j in range(3 if kind == 'poplar' else 2)]
        y += 24 * len(trunk)
        crown = on(DGREEN, x, y, z, '3471' if kind == 'poplar' else '3470')
        out += trunk + [crown]
    return out


def ship():
    """the black ship hauled up on the strand: the hull on the tiles, mast stepped, yard across; oars and sail stowed away"""
    base = mat_mul(T(230, -(BASE + 8 + 58 - 64.68), -210), RY(math.pi / 2))
    rows = [row(r['col'], mat_mul(base, r['m']), r['part']) for r in GALLEY if r['part'] == '71958c01']
    deck = BASE + 8 + 58
    rows.append(put(RB, 400, deck + 20, -170, '2537', RZ(math.pi / 2)))     # the mast lowered, lying along the deck
    return root(rows)


def baseplates():
    return [put(BLK, -160, BASE, 0, '3811'), put(BLK, 320, BASE, 0, '3857', RY(math.pi / 2))]


def details(): return FRAME + the_rite() + trees() + ship()


def settle_all():
    for _ in range(6):
        before = (dict(rock.vox), dict(ground.vox))
        l1 = rock.settle(rock_colour, extra=lambda: baseplates() + ground.parts(ground_colour) + details(),
                         protect=lambda v: rock.vox.get(v) == 'root')
        l2 = ground.settle(ground_colour, extra=lambda: baseplates() + rock.parts(rock_colour) + details(),
                           protect=lambda v: ground.vox.get(v) in ('pad', 'blood'))
        if (dict(rock.vox), dict(ground.vox)) == before and not l1 and not l2: break
    return l1, l2


def crop(form, colour, x0, x1, z0, z1):
    f = copy.copy(form); f.vox = {v: m for v, m in form.vox.items() if x0 <= (v[0] + 0.5) * S < x1 and z0 <= (v[2] + 0.5) * S < z1}
    return f.parts(colour)


def within(rows, x0, x1, z0, z1):
    out = []
    for r in rows:
        t = r.split()
        if t[0] == '1' and x0 <= float(t[2]) < x1 and z0 <= float(t[4]) < z1: out.append(r)
    return out


if __name__ == '__main__':
    print('settle', settle_all())
    whole = baseplates() + rock.parts(rock_colour) + ground.parts(ground_colour) + details()
    n = write('set.' + SLUG, 'The Land of the Dead', whole, 'tools/forage/product/kits/land-of-the-dead.py')
    rite = the_rite()
    subs = {
        'trench': (-240, 240, -80, 240, 'The trench and the shades'),
        'tiresias': (-40, 80, -80, 20, 'Tiresias'),
        'mound': (220, 440, 140, 300, 'Elpenor\'s mound and oar'),
    }
    for sub, (x0, x1, z0, z1, title) in subs.items():
        rows = crop(ground, ground_colour, x0, x1, z0, z1) + within(rite, x0, x1, z0, z1)
        write(f'set.{SLUG}-{sub}', f'The Land of the Dead: {title}', rows, 'tools/forage/product/kits/land-of-the-dead.py')
    print('pieces', n)
    for c in ['set.' + SLUG] + [f'set.{SLUG}-{s}' for s in subs]: check(c)
    H = '/home/user/odyssey-halfworld/'
    manifest(SLUG, title='The Land of the Dead', book='XI', tier='Large',
             moment='On the sunless Cimmerian shore the throats of the ram and the black ewe are cut over the trench; the shades crowd up '
                    'to drink, and Odysseus holds them off with his sword until Tiresias comes, leaning on his golden staff, his mother\'s '
                    'shade among them.',
             quote='"I cut the throats of the two sheep and let the blood run into the trench, whereon the ghosts came trooping up from '
                   'Erebus." (Odyssey XI, tr. Samuel Butler)',
             object='The shades: ghost shrouds on clear columns that rise out of the sand round the trench, eight of them in pairs on four '
                    'turntables that swivel them toward the blood, three more coming up through openings in the heaped spoil.',
             builds=[{'card': 'set.' + SLUG, 'title': 'The Land of the Dead'}] +
                    [{'card': f'set.{SLUG}-{s}', 'title': t[4]} for s, t in subs.items()],
             images=[{'file': 'hero.jpg', 'caption': 'The trench of blood, the shades crowding in, Odysseus with his sword drawn at its end.',
                      'alt': 'A dark diorama: a red pool ringed by heaped earth, translucent ghosts around it, a minifigure with a sword, a black ship behind and a crag with trees.'},
                     {'file': 'trench-close.jpg', 'caption': 'Close on the trench: Tiresias and his golden staff on the far rim, the ram and the black ewe at its end.',
                      'alt': 'Close view of translucent ghost figures on clear columns around a trench of red tiles, a gold staff among them.'},
                     {'file': 'side.jpg', 'caption': 'From the sea side: the black ship hauled up with its mast lowered, Elpenor\'s mound and oar in front.',
                      'alt': 'The kit from the left: a black and red hull on the strand, a grey stepped mound with an oar planted upright.'},
                     {'file': 'trench.jpg', 'caption': 'Sub-assembly: the trench and the shades.', 'alt': 'The trench build on its own.'},
                     {'file': 'tiresias.jpg', 'caption': 'Sub-assembly: Tiresias and his golden staff.', 'alt': 'A glowing ghost beside a gold staff.'},
                     {'file': 'mound.jpg', 'caption': 'Sub-assembly: Elpenor\'s mound, his oar planted on it, his shade beside.', 'alt': 'A grey mound with an oar standing in it.'}],
             features=['A 48 x 32 base of two baseplates, finished with the line\'s white frame, black-and-gold nameplate and blue tile.',
                       'The black-sand shore is a height field of plates tiled over: low dunes, a strand the ship lies on, spoil heaped two studs wide round the pit; studs are kept only where a foot, a turntable or a column stands.',
                       'The trench is a pool of trans-red and dark red tiles one plate below the spoil round it; drops of trans-red run in from the victims.',
                       'Fifteen shades: ghost shrouds over clear 1 x 1 round columns of three to five bricks, so each floats above the sand; eight ride four 4 x 4 turntables, three rise through 3 x 3 openings in the spoil.',
                       'The crag is sculpted in dark grey bricks, every top capped with tiles and cheese slopes, black poplars and willows on it.',
                       'Elpenor\'s oar stands with its grip in the open stud of a round brick on the crown of his mound.'],
             subs=[{'file': f'set.{SLUG}-{s}.mpd', 'title': t[4], 'pieces': pieces(f'set.{SLUG}-{s}'),
                    'text': {'trench': 'The pit of blood in its ring of spoil, the turntables and the shades on them, Odysseus, the crew and the victims.',
                             'tiresias': 'The seer\'s shade on its column, glowing, with the golden staff planted beside him.',
                             'mound': 'The heaped mound, the oar planted on its crown, the shade of Elpenor asking for burial.'}[s]}
                   for s, t in subs.items()],
             sources=[H + 'assets/location/cimmerian-shore-and-underworld-pit.mjs', H + 'assets/set_piece/blood-pit-boundary.mjs',
                      H + 'assets/prop/golden-staff-of-tiresias.mjs', H + 'scenes/OD-B11-S01.mjs', H + 'scenes/OD-B11-S03.mjs', H + 'scenes/_artifacts.mjs'],
             status='Built to the bar',
             next=['The shades float on clear columns; a real lift (a rack or a sliding post) would let them rise out of the openings in play.',
                   'The ocean-stream along the back is mostly hidden behind the ship; a deeper band of sea would read better.',
                   'The trees are stock pine and round tree parts; brick-built poplars and drooping willows would be more particular.',
                   'Figures and angled parts (the shrouds, heads, the oar, the staff, the lowered mast) are placed by hand and not checked by the tool.'])
