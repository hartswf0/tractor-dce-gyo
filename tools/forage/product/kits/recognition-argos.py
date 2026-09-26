#!/usr/bin/env python3
"""tools/forage/product/kits/recognition-argos.py — THE RECOGNITIONS, 3: ARGOS (Odyssey XVII), a Vignette of the Odyssey line.

  python3 tools/forage/product/kits/recognition-argos.py   -> odyssey/cards/set.recognition-argos.mpd

The last thirty feet of lane outside Odysseus's own gate (halfworld assets/location/palace-dung-heap-and-gate.mjs, scenes/OD-B17-S03.mjs).
The set's argument is spatial: one wall, two fates. To one side of the gateway the king's work survives, dressed ashlar and the stone
seat; to the other the same wall is fouled, its coping gone, weeds at its foot, the dung of mules and cattle heaped against it and the
cart that should have carted it to the fields lying tipped on its side. On the heap lies Argos, twenty years old, full of vermin: he
knows the beggar, drops his ears and wags his tail, and cannot come to him; and the dark of death takes him. The beggar turns his face
aside and wipes away a tear, hiding it from Eumaeus, who walks on toward the gate and sees nothing (Od. XVII 290-327).

Built to the Recognitions' one grammar (tools/forage/product/kits/recognition-helen.py): the back wall six courses high with its one
feature at the centre (here the gateway itself, under a stone lintel), the lane in tiles, the two on the midline, the dog at the front
of the heap, the thing that knows him.
"""
import importlib.util, math, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
from kitlib import mat_mul, T, RY, RX, RZ, row

_spec = importlib.util.spec_from_file_location('recognition_helen', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'recognition-helen.py'))
R = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(R)
FLOOR, WALL_K, WALL_I, COURSES = R.FLOOR, R.WALL_K, R.WALL_I, R.COURSES
GATE = range(-1, 1)                  # the gateway: two studs across, four courses high, through the wall's whole depth
FOUL = lambda i: i >= 1              # the fouled side of the wall (+x); the king's side (-x) keeps its ashlar


def gate_wall():
    """the precinct wall: on the king's side dressed ashlar (bricks with embossed courses, tan and light grey) capped in tiles; on the
    fouled side the same wall in dark tan and dark grey, its coping gone and its top broken in cheese slopes; the gateway at the centre
    under a stone lintel, a threshold of grey stone in it"""
    gaps = {(i, h, k) for i in GATE for h in range(4) for k in WALL_K}
    broken = {(3, 5), (4, 5), (6, 5), (4, 4)}                                                     # the top courses fallen away in two bays
    gaps |= {(i, h, k) for (i, h) in broken for k in WALL_K}

    def col(i, h, k):
        if FOUL(i): return DBG if (i * 3 + h * 5 + k) % 4 == 0 else DTAN
        return LBG if (i * 7 + h * 3) % 5 == 0 else TAN
    part_of = lambda n, i, h, k: '98283' if n == 2 and not FOUL(i) else None
    rows_, top = R.wall(col, gaps=gaps, spans=[(GATE[0] - 1, 4, 4, k, TAN, '3010') for k in WALL_K], cap=TAN,
                        caps_off={i for i in WALL_I if FOUL(i) and i > GATE[-1] + 1}, part_of=part_of, longest=lambda h: 2)
    # the broken top of the fouled bays: a cheese slope on each stud, running off toward the lane
    for i in WALL_I:
        if FOUL(i) and i > GATE[-1] + 1:
            for k in WALL_K:
                rows_.append(on(DTAN if (i + k) % 3 else DBG, (i + .5) * S, top[(i, k)], (k + .5) * S, '54200', math.pi if k == WALL_K[1] else 0))
    rows_ += [put(LBG, (i + .5) * S, 4 + P, (k + .5) * S, '3070b') for i in GATE for k in WALL_K]              # the threshold
    return rows_


def seat():
    """the stone seat on the king's side, against the wall: two courses of light grey, a tan tile on it"""
    return [on(LBG, -80, 12, -90, '3009'), put(TAN, -80, 12 + 24 + P, -90, '6636')]


HEAP_I, HEAP_K = range(2, 7), range(-5, 3)


def heap_form():
    """the dung heap against the fouled wall: a mound of dark brown and reddish-brown with rotten straw in olive, laid in plates and
    finished in tiles; a bed of tan straw where the dog lies"""
    f = Form(y0=4, unit=P)

    def solid(p):
        d = ell(p, (100, 0, -30), (80, 56, 110)) + rough(p, 6, 0.7)
        return (d, 'dung') if d <= 0 else (d, 'air')
    f.carve(solid, HEAP_I, range(0, 7), HEAP_K)
    return f


def heap_colour(m, i, h, k):
    if m == 'straw': return TAN
    n = (i * 5 + k * 3 + h) % 7
    return OLIVE if n == 0 else RB if n in (2, 5) else DB


def dog_bed(f):
    """the straw where Argos lies: the top cells of the heap's front-middle"""
    tops = {}
    for (i, h, k) in f.vox:
        if (i, k) not in tops or h > tops[(i, k)]: tops[(i, k)] = h
    for (i, k) in ((3, -1), (4, -1), (5, -1), (3, 0), (4, 0), (5, 0)):
        if (i, k) in tops: f.vox[(i, tops[(i, k)], k)] = 'straw'
    return tops


def argos(f, tops):
    """Argos on the heap, lying on his side, his legs out toward the lane and his head toward his master"""
    y = max(12 + (tops[(i, k)] + 1) * P for i in (3, 4, 5) for k in (-1, 0) if (i, k) in tops)
    m = mat_mul(T(90, -(y + 9.87), -10), mat_mul(RY(math.pi / 2), mat_mul(RZ(math.pi / 2), RX(0.0))))
    return [row(RB, m, '92586')]


def cart():
    """the dung cart that should have carted the heap to the fields, left unhitched and tipped back: its wheels on the lane, the tail of
    its bed on the ground, the shafts in the air. A plate with wheel pins under a bed with side boards; two wheels; two shafts"""
    parts = [('4600', DB, T(0, -6, 0)), ('3020', RB, mat_mul(T(0, -14, 0), RY(math.pi / 2))),
             ('87079', DB, mat_mul(T(0, -22, 0), RY(math.pi / 2))),
             ('4624', DB, mat_mul(T(-27, 0, 0), RZ(math.pi / 2))), ('4624', DB, mat_mul(T(27, 0, 0), RZ(math.pi / 2)))]
    # knocked over on its side: turned about its length until it lies on the rim of one wheel and the edge of its bed, set down so the
    # lowest of those points is on the lane
    tilt = mat_mul(RY(math.pi - 0.5), RZ(math.pi / 2 - 0.35))
    pts = [(sx * 35, 10 * math.cos(t), 10 * math.sin(t)) for sx in (-1, 1) for t in [n * math.pi / 8 for n in range(16)]] + \
          [(sx * 20, y, z) for sx in (-1, 1) for y in (-22, 10) for z in (-40, 40)]
    low = max(mat_mul(tilt, T(*q))[1] for q in pts)
    base = mat_mul(T(108, -(FLOOR + low), 98), tilt)
    return [row(c, mat_mul(base, m), p) for p, c, m in parts]


def weeds():
    """weeds at the foot of the fouled wall, on plates of the lane's colour"""
    return [on(GREEN, 30, 12, -90, '6255', 0.7), on(GREEN, 130, 12, 70, '32607', 2.0)]


_HEAP = []


def the_heap():
    """the heap, carved once and settled with the rest of the build until every part clicks"""
    if _HEAP: return _HEAP[0]
    import tempfile
    tempfile.tempdir = '/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad'
    f = heap_form()
    tops = dog_bed(f)
    _HEAP.append((f, tops))
    left = f.settle(heap_colour, extra=lambda: [r for r in build()[0] if r not in set(f.parts(heap_colour))],
                    protect=lambda v: f.vox.get(v) == 'straw')
    if left: print('heap: loose after settling', len(left))
    return _HEAP[0]


def build():
    rows_, fcells, floor = R.base(DTAN)
    f, tops = the_heap()
    heap_cells = {(i, k) for (i, h, k) in f.vox if h == 0}
    stand = {(1, -5), (6, 3)} | {(i, -5) for i in range(-7, -1)}                               # the weeds' studs; the seat
    od_x, od_z = 0, 30
    stand |= {(-1, 1), (0, 1)}                                                                 # the beggar
    eu_x, eu_z = -60, 0
    stand |= {(-4, -1), (-3, -1), (-4, 0), (-3, 0)}                                            # Eumaeus
    colour = lambda i, k: (LBG if (i * 7 + k * 3) % 11 == 0 else DTAN if (i // 2 + k // 2 * 3) % 4 else TAN)
    rows_ += R.tiles(floor - heap_cells, colour, studs=stand)
    rows_ += gate_wall() + seat() + weeds()
    hp = f.parts(heap_colour)
    rows_ += hp + argos(f, tops) + cart()
    # the beggar, beside the heap and not on it: his face turned from Eumaeus, a hand up to wipe the tear away
    fb = R.body('character.odysseus-as-beggar', 'odysseus-as-beggar', drop=('10169',))
    R.arm(fb, 'L', -2.4, -0.6, 0.3); R.arm(fb, 'R', -0.5, 0.1); R.head(fb, 0.3, 0.0, -0.2)
    rows_ += R.place(fb, od_x, FLOOR, od_z, -math.pi / 2 - 0.7)
    # Eumaeus, walking on to the gate, seeing nothing
    fe = R.body('character.eumaeus', 'eumaeus')
    R.arm(fe, 'R', 0.35); R.arm(fe, 'L', -0.35)
    rows_ += R.place(fe, eu_x, FLOOR, eu_z, 0.35)
    return rows_, f


MANIFEST = dict(
    title='Argos', book='XVII', tier='Vignette',
    moment='At the gate of his own house the old dog Argos, lying neglected on the dung heap, knows the beggar, drops his ears, wags his '
           'tail and dies; Odysseus turns his face aside and wipes away a tear so Eumaeus will not see.',
    quote='"But as for Argos, the fate of black death seized him straightway when he had seen Odysseus in the twentieth year." '
          '(Odyssey XVII, tr. A. T. Murray)',
    object='Argos himself, lying on a bed of straw on the heap, his head toward the master he cannot rise to meet: the only one in Ithaca '
           'who sees through the disguise.',
    sources=['assets/location/palace-dung-heap-and-gate.mjs', 'assets/creature/argos.mjs', 'scenes/OD-B17-S03.mjs', 'scenes/_artifacts.mjs',
             'scenes/_direction.mjs'],
)


if __name__ == '__main__':
    n = write('set.recognition-argos', 'The Recognitions: Argos', build()[0])
    print('set.recognition-argos', n); check('set.recognition-argos')
    R.publish('recognition-argos', MANIFEST, 'set.recognition-argos',
              [{'file': 'hero.jpg', 'caption': 'One wall, two fates: the ashlar gateway and the stone seat; the fouled wall, the heap, the cart, and Argos.',
                'alt': 'A LEGO vignette: a tan wall with a dark gateway, neat embossed stone on the right and a broken top on the left; a heap of '
                       'brown plates with a brown dog lying on its side on straw; a knocked-over cart; a bearded beggar with a hand to his '
                       'face and a second man walking to the gate.'},
               {'file': 'close.jpg', 'caption': 'Argos on his straw on the heap; the beggar turning his face aside to wipe away the tear.',
                'alt': 'Close view of the dog lying on the heap and the beggar with his hand raised to his eyes.'},
               dict(file='../recognition-helen/lineup.jpg', **R.LINEUP)],
              ['The wall carries the argument: on the king\'s side dressed ashlar in embossed bricks, capped in tiles; on the fouled side the same wall in dark tan and dark grey, its top fallen away in two bays and broken in cheese slopes.',
               'The gateway goes through the wall\'s depth under a stone lintel, a threshold of grey tiles in it; the stone seat stands against the ashlar.',
               'The dung heap is sculpted in plates of dark brown, reddish-brown and olive and finished in tiles, a bed of tan straw where the dog lies.',
               'The dung cart lies knocked on its side at the heap\'s foot, one wheel in the air; weeds grow at the foot of the fouled wall.'],
              ['Argos is the line\'s standing dog laid on his side; he cannot lift his head or wag, so the scene shows the moment of his death.',
               'The cart has no shafts (they would have run off the base); the dog, cart and figures are placed by hand and not checked by the click tool.'])

