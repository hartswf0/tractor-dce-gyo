#!/usr/bin/env python3
"""tools/forage/product/kits/recognition-scar.py — THE RECOGNITIONS, 2: THE SCAR (Odyssey XIX), a Vignette of the Odyssey line.

  python3 tools/forage/product/kits/recognition-scar.py   -> odyssey/cards/set.recognition-scar.mpd

Night in the hall (halfworld scenes/OD-B19-S04.mjs). The beggar sits on a stool by the hearth, turned away from the light; old Eurycleia,
washing his feet, has run her hand down his leg and found the scar the boar's tusk left on Parnassus. She lets the foot fall: it strikes
the bronze basin, the basin rings and goes over, the water runs out across the floor, and he has her by the throat before she can cry
out. Penelope sits by the fire with her back to them all: Athena has turned her mind away (Od. XIX 467-479), and her owl watches from
the wall.

Built to the Recognitions' one grammar (tools/forage/product/kits/recognition-helen.py): the back wall six courses high with its one
feature at the centre (here the hall's shut doors of reddish-brown timber), a floor of tiles, the two on the midline, the thing that
gives him away (the basin, tipped, and its spilled water) at the front.
"""
import importlib.util, math, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
from kitlib import mat_mul, T, RY, RX, RZ, row

_spec = importlib.util.spec_from_file_location('recognition_helen', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'recognition-helen.py'))
R = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(R)
FLOOR, WALL_K, COURSES, PGOLD, PSILVER = R.FLOOR, R.WALL_K, R.COURSES, R.PGOLD, R.PSILVER
DOORS = range(-1, 1)
OWL_I = -5


def hall_wall():
    """the megaron's wall at night: dark tan and tan stone, a course of reddish-brown timber laced through it (log bricks), the shut
    doors of the inner rooms at the centre under a timber lintel; the coping of dark tan, one stud left for Athena's owl"""
    gaps = {(i, h, WALL_K[1]) for i in DOORS for h in range(4)}

    def col(i, h, k):
        if i in DOORS and h < 4 and k == WALL_K[0]: return DB                                     # the doors, shut
        if h == 3: return RB                                                                    # the timber lacing
        return TAN if (i * 3 + h * 5 + k) % 5 == 0 else DTAN
    part_of = lambda n, i, h, k: '30136' if h == 3 and n == 2 else None
    rows_, top = R.wall(col, gaps=gaps, spans=[(DOORS[0] - 1, 4, 4, WALL_K[1], RB, '3010')], cap=DTAN, caps_off={OWL_I},
                        part_of=part_of, longest=lambda h: 2 if h == 3 else 4)
    # the owl on the front stud of the one uncapped column; a round tile on the stud behind it
    rows_ += [put(LBG, (OWL_I + .5) * S, R.WALL_TOP, (WALL_K[1] + .5) * S, '92084', RY(math.pi)),
              put(DTAN, (OWL_I + .5) * S, R.WALL_TOP + P, (WALL_K[0] + .5) * S, '98138')]
    return rows_


def hearth(x, z):
    """the hearth, 4 x 4 on the floor: a ring of dark grey stones (1 x 1 round bricks) round a bed of black, the fire on it"""
    out = [on(BLK, x, 4, z, '3031')]
    ring = [(-30, -30), (-10, -30), (10, -30), (30, -30), (-30, 30), (-10, 30), (10, 30), (30, 30), (-30, -10), (-30, 10), (30, -10), (30, 10)]
    out += [on(DBG if (dx + dz) % 40 else LBG, x + dx, 12, z + dz, '3062b') for dx, dz in ring]
    out += [on(TORANGE, x - 10, 12, z - 10, '3062b'), on(ORANGE, x + 10, 12, z + 10, '3062b'), on(TORANGE, x + 10, 12, z - 10, '4589'),
            on(YELLOW, x - 10, 12, z + 10, '4589'), on(TYELLOW, x - 10, 36, z - 10, '4589'), on(TORANGE, x + 10, 36, z + 10, '4589')]
    return out


def stool(x, z):
    """the beggar's stool: a round brick of reddish-brown wood and a round plate seat; returns rows and the seat's yup"""
    return [on(RB, x, FLOOR, z, '3941'), on(RB, x, FLOOR + 24, z, '4032a')], FLOOR + 32


def pchair(x, z, col=DTAN):
    """Penelope's chair, inlaid with ivory and silver (Od. XIX 55-58), set with its back to the room: a 2 x 3 seat on four legs, its
    back on the front row so she sits facing the wall; silver studs on the back's top; returns rows and the seat's yup"""
    out = [on(col, x + dx, FLOOR, z + dz, '3005') for dx in (-10, 10) for dz in (-20, 20)]
    out.append(put(col, x, FLOOR + 32, z, '3021', RY(math.pi / 2)))
    out += [on(col, x, FLOOR + 32 + 24 * j, z + 20, '3004') for j in range(2)]
    out += [put(PSILVER, x, FLOOR + 88, z + 20, '3069b')]
    return out, FLOOR + 32


def basin_tipped(x, z):
    """the bronze basin knocked over by the falling foot: the dish on its side, its rim resting on the floor, turned toward the front"""
    m = mat_mul(T(x, -(FLOOR + 19), z), mat_mul(RX(-1.15), RZ(0.2)))
    return [row(PGOLD, m, '4740')]


def build():
    rows_, fcells, floor = R.base(DTAN)
    stand = set()
    hx, hz = 100, -40
    hearth_cells = {(i, k) for i in range(3, 7) for k in range(-4, 0)}
    stool_x, stool_z = 40, 20
    stand |= {(1, 0), (2, 0), (1, 1), (2, 1)}                                                    # the stool
    eur_x, eur_z = 0, 30
    stand |= {(-1, 1), (0, 1)}                                                                   # Eurycleia, kneeling
    pen_x, pen_z = -100, -30
    stand |= {(i, k) for i in (-6, -5) for k in (-3, -1)}                                        # Penelope's chair legs
    # the floor: flagstones of dark tan and tan; the spilled water running out from the basin to the front, in trans-light-blue
    water = {(-2, 3), (-1, 3), (0, 3), (1, 3), (-2, 4), (-1, 4), (0, 4), (1, 4), (2, 4), (-3, 5), (-2, 5), (-1, 5), (0, 5), (1, 5), (-3, 4), (2, 5)}
    colour = lambda i, k: TLBLUE if (i, k) in water else (TCLEAR if (i, k) in {(-4, 5), (3, 5), (2, 3)} else
                                                            (DTAN if (i // 2 * 3 + k // 2) % 4 else TAN))
    rows_ += R.tiles(floor - hearth_cells, colour, studs=stand)
    rows_ += hall_wall() + hearth(hx, hz)
    sr, seat = stool(stool_x, stool_z)
    rows_ += sr + basin_tipped(10, 62)
    pr, pseat = pchair(pen_x, pen_z)
    rows_ += pr
    # the beggar on his stool, turned from the fire: his right hand at the nurse's throat, his left drawing her to him
    f = R.body('character.odysseus-as-beggar', 'odysseus-as-beggar', drop=('3957a', '10169'))
    R.arm(f, 'R', -1.35, -0.35, 0.2); R.arm(f, 'L', -0.7, 0.2); R.head(f, 0.25, 0, -0.35)
    rows_ += R.seated_at(f, stool_x, seat, stool_z, math.pi * 0.72)
    # Eurycleia on the floor at his feet, her hands up where his foot fell from them, her face up to his
    f = R.body('character.eurycleia', 'eurycleia', drop=('3899',))
    R.arm(f, 'R', -1.3, 0.3); R.arm(f, 'L', -0.4, 0.3); R.head(f, -0.35, 0, 0.4)
    rows_ += R.seated_at(f, eur_x - 10, FLOOR, eur_z, -math.pi * 0.7)
    # Penelope by the fire, her back to the room: Athena has turned her mind away
    f = R.body('character.penelope', 'penelope', drop=('2343',))
    R.arm(f, 'R', -0.6); R.arm(f, 'L', -0.4); R.head(f, 0.2, 0.1)
    rows_ += R.seated_at(f, pen_x, pseat, pen_z, 0)
    return rows_


MANIFEST = dict(
    title='The Scar', book='XIX', tier='Vignette',
    moment='Washing the beggar\'s feet by the hearth, old Eurycleia finds the boar-tusk scar on his leg and lets the foot fall; the bronze '
           'basin rings and spills, he takes her by the throat to silence her, and Penelope, her mind turned away by Athena, sees nothing.',
    quote='"This scar the old woman, when she had taken the limb in the flat of her hands, knew by the touch, and she let fall the foot." '
          '(Odyssey XIX, tr. A. T. Murray)',
    object='The bronze basin, knocked on its side by the falling foot, with its water running out across the floor toward the front of the base.',
    sources=['scenes/OD-B19-S04.mjs', 'assets/prop/foot-washing-basin.mjs', 'scenes/_direction.mjs', 'scenes/_plans/megaron.mjs'],
)


if __name__ == '__main__':
    n = write('set.recognition-scar', 'The Recognitions: The Scar', build())
    print('set.recognition-scar', n); check('set.recognition-scar')
    R.publish('recognition-scar', MANIFEST, 'set.recognition-scar',
              [{'file': 'hero.jpg', 'caption': 'The nurse at the beggar\'s feet, the basin gone over, his hand at her throat; Penelope turned away.',
                'alt': 'A LEGO vignette: a bearded beggar seated on a brown stool reaching to an old woman seated on the floor before him, a '
                       'gold dish on its edge and a spill of clear blue tiles; a hearth of grey stones with flames; a woman seated with her '
                       'back to them; an owl on the wall.'},
               {'file': 'close.jpg', 'caption': 'The moment: the foot let fall, the bronze basin on its edge, his hand at her throat.',
                'alt': 'Close view of the seated beggar with one hand at the old woman\'s face and the tipped gold dish in front of her.'},
               dict(file='../recognition-helen/lineup.jpg', **R.LINEUP)],
              ['The basin is a pearl-gold dish knocked onto its edge; the spilled water is a run of trans-light-blue and trans-clear tiles in the floor.',
               'The hall\'s wall is dark tan stone laced with a course of reddish-brown log bricks, the shut doors of the inner rooms at its centre.',
               'The hearth is a ring of grey round bricks on a black plate with flames of trans-orange and yellow.',
               'Penelope sits in her chair with its back to the room, facing the wall, and Athena\'s owl watches from the one uncapped stud of the coping.'],
              ['The scar itself is not shown: no printed leg exists for the beggar; the moment is carried by the basin and the grip.',
               'Eurycleia sits on the floor (a minifigure cannot kneel); the grip at her throat is a posed arm, not a connection.',
               'The tipped basin and the figures are placed by hand and are not checked by the click tool.'])

