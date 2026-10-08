"""The hall's causal map (odyssey/metis, proof 03): the Bow and the Hall kit (tools/forage/product/kits/bow-and-hall.py) as the set of
OD-B21-S07 (the bow) and OD-B22-S01 (Antinous falls), in place of the forage's roofless megaron. staging.py registers it.

The kit is taken apart into the pieces a take can hide, move or light, each one sub-build of the stage:

  ground        the hall's baseplates and a plate under the porch (the court beyond is left out: the doors give onto the porch)
  hall floor    the painted floor (no bare studs where the kit's own figures stood: the cast is the scene's, not the kit's)
  the sill      the stone sill inside the great doors
  axes          the twelve axes raised on handles so their sockets stand at the height of a bow drawn on the sill: twelve Technic
                bricks 1 x 1 on one axis (z = SPINE), their holes 74 LDU over the base, a stud apart from each other's shadow
  the arrow     a Technic axle 12 with a bronze cone for its point and two bushes for its fletching, built at rest (its middle through
                the last axe); the take slides it down the line on the loose (film-readymades/odyssey-light.js, `slide`)
  door wall / back wall / front wall / throne wall    the walls to the timber course (yup 148), with the frescoes and the postern
  upper walls   every course above it, and the coping: lifted away with the roof for a plan view
  the roof      a timber ceiling of plates on the coping, open over the hearth where the clerestory rises (lifted a brick, so the
                light between its posts is above the roof line)
  the clerestory, column .. column 4, the hearth, hearth fire, hearth fire 2 (two builds of the flames, swapped on twos)
  torches, torch flames, torch flames 2   cressets on brackets: on the four columns (facing the spine) and either side of the doors
  door frames, door leaf, door leaf 2      the great doors; each leaf its own piece, swung on its hinge by the take
  weapon pegs   two timber rails on the back wall near the doors, with pegs (Bar 3L) out from the wall
  the arms      spears across the pegs, shields and swords hung on them: hidden, the pegs are bare (XIX.1-46: Telemachus and
                Odysseus carried the arms to the storeroom)
  tables        the suitors' tables and benches (the kit's), and Antinous's table across the line beyond the last axe
  the throne, the stair, the porch

Coordinates are the kit's: LDraw units, x down the hall (the doors at -560, the throne at +520), z across, heights as yup. MARKS
names the places the keyframes block on (tools/metis/hall_marks.py turns them into the location's frame).
"""
from pathlib import Path
import copy, importlib.util, json, math, re, sys

R = Path(__file__).parent; REPO = R.parent; CARDS = REPO / 'odyssey/cards'
_KIT = None


def kit():
    """the kit's builder as a module (its file name has hyphens)"""
    global _KIT
    if _KIT is None:
        p = REPO / 'tools/forage/product/kits/bow-and-hall.py'
        sys.path.insert(0, str(p.parent.parent))
        spec = importlib.util.spec_from_file_location('bow_and_hall', p)
        _KIT = importlib.util.module_from_spec(spec); spec.loader.exec_module(_KIT)
    return _KIT


SOCKET_TOP = 84          # the axes' sockets: a Technic brick 1 x 1 from yup 60 to 84, its hole's axis at 74
ARROW_Y = 74
ARROW_REST = 70 - 0      # the arrow's middle at rest: through the last axe (x 70)
ANT_TABLE = (110, 70)    # Antinous's table: across the line beyond the last axe, toward the front tables
UPPER = 148              # the timber course: the walls above it are the upper walls

# the places the keyframes block on (kit x, z) and the points the look lights (kit x, yup, z)
MARKS = {
    'sill': (-530, 0), 'sill-left': (-500, 60), 'sill-right': (-500, -60), 'door': (-575, 0),
    'axe-first': (-370, -10), 'axe-last': (70, -10), 'arrow-rest': (ARROW_REST, -10),
    'antinous': (80, 70), 'antinous-table': ANT_TABLE,      # before his table: he falls back across it (K3)
    'front-table-1': (-300, 140), 'front-table-2': (-40, 140), 'front-table-3': (260, 140),
    'back-table-1': (-320, -140), 'back-table-2': (-140, -140),
    'pegs': (-470, -215), 'postern': (-370, 220), 'hearth': (300, 0), 'throne': (520, 0),
}
LIGHTS = {   # kit (x, yup, z) of each practical
    'hearth': (300, 70, 0),
    'torch-c1': (140, 170, -112), 'torch-c2': (140, 170, 112), 'torch-c3': (460, 170, -112), 'torch-c4': (460, 170, 112),
    'torch-d1': (-528, 170, -112), 'torch-d2': (-528, 170, 112),
    'smoke-hole': (300, 330, 0), 'doorway': (-640, 120, 0),
}
HINGES = {'door leaf': (-565, -72), 'door leaf 2': (-565, 72)}


def _y(line):
    return -float(line.split()[3])


def _shift(line, dy):
    t = line.split(); t[3] = f'{float(t[3]) - dy:g}'; return ' '.join(t)


def axes_high():
    """the twelve axes on handles: two round bricks and a round plate of timber, the socket (a Technic brick 1 x 1, pin hole along x),
    the curved top for the blade; the trench of stamped earth round their feet as the kit lays it"""
    K = kit(); out = []
    for h in K.HEADS:
        out += [K.put(K.RB, h, 28, K.SPINE, '3062b'), K.put(K.RB, h, 52, K.SPINE, '3062b'), K.put(K.RB, h, 60, K.SPINE, '6141'),
                K.put(K.PDG, h, SOCKET_TOP, K.SPINE, '6541', K.RY(math.pi / 2)), K.on(K.PDG, h, SOCKET_TOP, K.SPINE, '49307', math.pi / 2)]
    trench, occ = K.axe_line(with_arrow=False)
    out += [l for l in trench if l.split()[-1] not in ('6541.dat', '49307.dat')]
    return out, occ


def arrow():
    """the arrow at rest: a Technic axle 12 (239 LDU) through the last axe, the bronze point past it, the fletching behind"""
    K = kit(); c = ARROW_REST
    out = [K.put(K.TAN, c, ARROW_Y, K.SPINE, '3708')]
    out.append(K.row(K.GOLD, K.mat_mul(K.T(c + 119.5 + 18, -ARROW_Y, K.SPINE), K.RZ(math.pi / 2)), '4589'))
    out.append(K.row(K.WHITE, K.mat_mul(K.T(c - 119.5 + 5, -ARROW_Y, K.SPINE), K.RY(math.pi / 2)), '32123b'))
    out.append(K.row(K.RED, K.mat_mul(K.T(c - 119.5 + 15, -ARROW_Y, K.SPINE), K.RY(math.pi / 2)), '32123b'))
    return out


def cresset(x, z, nx, nz, yb=150):
    """a torch on a bracket: a 1 x 2 plate out from the face (x, z) along (nx, nz), a timber handle (a round brick), a black round
    plate; the flames are separate (flames())"""
    K = kit(); rot = 0 if nx else math.pi / 2
    px, pz = x + nx * 30, z + nz * 30
    return [K.put(K.RB, x + nx * 20, yb, z + nz * 20, '3023', K.RY(rot)), K.put(K.RB, px, yb + 24, pz, '3062b'),
            K.put(K.BLK, px, yb + 27, pz, '6141')], (px, yb + 27, pz)


def flames(at, variant):
    """the flames of a torch or the hearth as bricks: trans-orange plumes (64647) and a trans-yellow candle flame (37775); the second
    build turns and swaps them, so two builds swapped on twos flicker"""
    K = kit(); x, y, z = at; out = []
    a = (0.0, math.pi * 0.6) if variant == 0 else (math.pi * 0.9, math.pi * 1.6)
    out.append(K.row(K.TORANGE, K.mat_mul(K.T(x, -y, z), K.RY(a[0])), '64647'))
    out.append(K.row(K.TYELLOW, K.mat_mul(K.T(x, -(y + (3 if variant else 0)), z), K.RY(a[1])), '37775'))
    if variant: out.append(K.row(K.TORANGE, K.mat_mul(K.T(x, -(y + 2), z), K.RY(a[1] + 1.2)), '37775'))
    return out


def hearth_fire(variant):
    """the fire on the hearth's bed: brands of reddish brown (round bricks laid flat) and flames over them, two builds"""
    K = kit(); hx, hz = K.HEARTH; out = []
    spots = [(-20, -10), (10, -20), (20, 10), (-10, 20), (0, 0), (30, -30), (-30, 25)]
    for n, (dx, dz) in enumerate(spots):
        if (n + variant) % 3 == 2: continue
        x, z = hx + dx + (5 if variant else 0), hz + dz - (5 if variant else 0)
        out.append(K.row(K.TORANGE if (n + variant) % 2 else K.TYELLOW, K.mat_mul(K.T(x, -28, z), K.RY(n * 1.3 + variant * 0.8)), '64647'))
        if n % 2 == variant: out.append(K.row(K.TYELLOW, K.mat_mul(K.T(x + 6, -28, z - 4), K.RY(n)), '37775'))
    out.append(K.row(K.TORANGE, K.mat_mul(K.T(hx, -36, hz), K.RY(variant * 2.1)), '64647'))
    return out


def brands():
    K = kit(); hx, hz = K.HEARTH
    return [K.row(K.RB, K.mat_mul(K.T(hx + dx, -38, hz + dz), K.mat_mul(K.RY(a), K.RZ(math.pi / 2))), '3062b')
            for dx, dz, a in ((-10, 0, 0.3), (10, 5, 1.9), (0, -12, 3.4))]


def pegs_and_arms():
    """two timber rails on the back wall's face (z -240, facing +z) between the doors and the first back table, Bar 3L pegs out from
    them; the arms: four spears across the low pegs, three round shields and two swords on the high ones"""
    K = kit(); rail, arms = [], []
    face = -240
    for yb in (116, 196):
        rail.append(K.put(K.RB, -460, yb, face + 10, '4477'))                         # the rail: a plate 1 x 10 on the wall
        for n in range(4):
            x = -540 + 50 + n * 40
            rail.append(K.row(K.DBG, K.mat_mul(K.T(x, -(yb - 4), face + 10), K.RX(math.pi / 2)), '87994'))   # the peg, 60 LDU out
    for n, z in enumerate((face + 34, face + 46, face + 58)):                        # spears across the low pegs
        arms.append(K.row(K.PLG, K.mat_mul(K.T(-460, -(116 - 4 + 8 + n * 2), z), K.RZ(math.pi / 2)), '4497'))
    for n in range(3):                                                                  # shields hung flat on the high pegs
        arms.append(K.row((K.RED, K.WHITE, K.DBLUE)[n], K.T(-515 + n * 50, -(196 - 8), face + 24), '3876'))
    for n in range(2):                                                                  # swords hung point down from the low rail
        arms.append(K.row(K.PLG, K.T(-520 + n * 120, -(116 - 30), face + 16), '3847'))
    return rail, arms


def antinous_table():
    """Antinous's table, across the line beyond the last axe: a plank 2 x 6 along z on four round legs, a gold cup and a dish on it"""
    K = kit(); x, z = ANT_TABLE; out = []
    for dx in (-10, 10):
        for dz in (-50, 50):
            out += [K.put(K.RB, x + dx, 28, z + dz, '3062b'), K.put(K.RB, x + dx, 52, z + dz, '3062b')]
    out.append(K.put(K.RB, x, 60, z, '3795', K.RY(math.pi / 2)))
    out += [K.put(K.WHITE, x, 68, z - 20, '4150'), K.row(K.RB, K.mat_mul(K.T(x, -76, z - 20), K.RY(0.4)), '33057'),
            K.put(K.TAN, x - 10, 68, z + 30, '98138'), K.put(K.PLG, x + 10, 84, z + 40, '3899')]
    return out


def roof():
    """the timber ceiling: plates on the coping (top at 268) over the hall and its walls, open where the clerestory rises; beams under"""
    K = kit()
    cells = {(i, k) for i in range(-30, 30) for k in range(-14, 14)} - {(i, k) for i in range(6, 24) for k in range(-9, 9)}
    out = []
    done = set()
    for (i, k) in sorted(cells):                                                         # plates 2 x 4 along z where they fit, else 2 x 2, 1 x 2, 1 x 1
        if (i, k) in done: continue
        for w, d, part in ((2, 4, '3020'), (2, 2, '3022'), (1, 2, '3023'), (1, 1, '3024')):
            blk = {(i + a, k + b) for a in range(w) for b in range(d)}
            if blk <= cells and not (blk & done):
                rot = K.RY(math.pi / 2) if (w, d) in ((2, 4), (1, 2)) else None
                out.append(K.put(K.RB if (i // 2 + k // 4) % 3 else K.DB, (i + w / 2) * K.S, 276, (k + d / 2) * K.S, part, rot)); done |= blk; break
    for x in (-480, -320, -160, 0, 520):                                                 # beams across the hall, under the ceiling
        for z0 in (-160, 80):
            out.append(K.put(K.DB, x, 268, z0 + 40, '3832', K.RY(math.pi / 2)))
    return out


def lantern_raised():
    """the kit's clerestory lifted a brick where it rises above the roof: the posts doubled, so the light between them is above it"""
    K = kit(); out = []
    for l in K.lantern():
        y = _y(l)
        out.append(_shift(l, 24) if y >= 288 else l)
    for x, z in [(140, -160), (140, 160), (460, -160), (460, 160), (140, 0), (460, 0), (300, -160), (300, 160)]:
        out.append(K.put(K.RB, x, 312, z, '3003'))
    return out


def groups():
    """the stage's pieces: [(label, rows)]"""
    K = kit()
    occ = set()
    for name, cells, *_ in K.wall_rows(): occ |= set(cells)
    sill, c = K.sill(); occ |= c
    axes, c = axes_high(); occ |= c
    hearth, c = K.hearth(); occ |= c
    hearth = [l for l in hearth if l.split()[-1] != '37775.dat']                        # its two candle flames go to the fire builds
    throne, c = K.throne(); occ |= c
    stair, c = K.stair(); occ |= c
    tables = []
    for x, sitters in K.BACK_TABLES:
        tables += K.bench(x, -230, 6, []) + K.table(x, -180)
        occ |= {(i, -12) for i in range(round(x / K.S) - 3, round(x / K.S) + 3)} | {(round((x + dx) / K.S - 0.5), round((-180 + dz) / K.S - 0.5)) for dx in (-50, 50) for dz in (-10, 10)}
    for x, sitters in K.FRONT_TABLES:
        tables += K.bench(x, 210, 6, []) + K.table(x, 180)
        occ |= {(i, 10) for i in range(round(x / K.S) - 3, round(x / K.S) + 3)} | {(round((x + dx) / K.S - 0.5), round((180 + dz) / K.S - 0.5)) for dx in (-50, 50) for dz in (-10, 10)}
    ax, az = ANT_TABLE
    occ |= {(round((ax + dx) / K.S - 0.5), round((az + dz) / K.S - 0.5)) for dx in (-10, 10) for dz in (-50, 50)}
    cols = []
    for x, z in K.COLS: cols.append(K.column(x, z)); occ |= {(round(x / K.S) + a, round(z / K.S) + b) for a in (-1, 0) for b in (-1, 0)}
    porch, c = K.porch(); occ |= c
    hallf = {(i, k) for i in range(K.X0, K.X1 + 1) for k in range(K.Z0, K.Z1 + 1)}
    porchf = {(i, k) for i in range(K.PORCH_I[0], K.PORCH_I[1] + 1) for k in range(K.Z0, K.Z1 + 1)}
    floor = K.painted_floor(hallf - occ)
    porch += K.fill(porchf - occ, K.porch_col, 4)
    ground = [K.put(K.DTAN, -320, 4, 0, '3811'), K.put(K.DTAN, 320, 4, 0, '3811'),
              K.put(K.DTAN, -720, 4, -160, '41539'), K.put(K.DTAN, -720, 4, 0, '41539'), K.put(K.DTAN, -720, 4, 160, '41539')]
    # the walls: each side its own piece below the timber course, every course above it one piece (the upper walls)
    sides = {'door wall': ('left_out', 'left_in'), 'back wall': ('back_out', 'back_in'), 'front wall': ('front_in', 'front_out'),
             'throne wall': ('right_in', 'right_out')}
    walls, upper = {}, []
    for label, names in sides.items():
        rows, faces = K.build_walls(keep=lambda r, names=names: r[0] in names)
        rows += K.frescoes(faces)
        walls[label] = [l for l in rows if _y(l) <= UPPER]
        upper += [l for l in rows if _y(l) > UPPER]
    doors = K.doors()
    frames = [l for l in doors if l.split()[-1] == '60596.dat']
    leaves = [l for l in doors if l.split()[-1] == '60616a.dat']
    torches, tfl = [], [[], []]
    for x, z in K.COLS:
        nz = 1 if z < 0 else -1
        t, at = cresset(x, z + nz * 22, 0, nz); torches += t
        for v in (0, 1): tfl[v] += flames(at, v)
    for z, nz in ((-140, 1), (140, -1)):                                                  # either side of the doors, on the door wall
        t, at = cresset(-560, z, 1, 0); torches += t
        for v in (0, 1): tfl[v] += flames(at, v)
    rail, arms = pegs_and_arms()
    out = [('hall floor', floor), ('the sill', sill), ('axes', axes), ('the arrow', arrow())]
    out += list(walls.items()) + [('upper walls', upper), ('the roof', roof()), ('the clerestory', lantern_raised())]
    out += [('column' + ('' if n == 0 else ' %d' % (n + 1)), c) for n, c in enumerate(cols)]
    out += [('the hearth', hearth + brands()), ('hearth fire', hearth_fire(0)), ('hearth fire 2', hearth_fire(1)),
            ('torches', torches), ('torch flames', tfl[0]), ('torch flames 2', tfl[1]),
            ('door frames', frames), ('door leaf', leaves[:1]), ('door leaf 2', leaves[1:]),
            ('weapon pegs', rail), ('the arms', arms), ('tables', tables), ("antinous's table", antinous_table()),
            ('the throne', throne), ('the stair', stair), ('the porch', porch)]
    return ground, out


HEAD = '0 Author: word to world, film-readymades/staging_hall.py (from tools/forage/product/kits/bow-and-hall.py)\n0 !LDRAW_ORG Unofficial_Model\n0 !LICENSE Redistributable under CCAL version 2.0 : see CAreadme.txt\n'


def _block(name, title, rows):
    return f'0 FILE {name}\n0 {title}\n0 Name: {name}\n' + HEAD + '\n' + '\n'.join(rows) + '\n'


def _file(text, name):
    for b in re.split(r'(?m)^(?=0 FILE )', text):
        if b.startswith('0 FILE ' + name + '\n'): return b.rstrip('\n') + '\n'
    raise KeyError(name)


def _is_fig(block):
    refs = [l.split()[-1] for l in block.splitlines() if l.startswith('1 ')]
    return any(r.startswith('3626') for r in refs) and any(r.startswith('973') for r in refs)


# where each figure of the cast stands when the card is built (the keyframes block them after)
CAST_AT = {'odysseus': 'sill', 'odysseus-revealed': 'sill', 'telemachus': 'sill-left', 'antinous': 'antinous',
           'suitor-1': 'front-table-1', 'suitor-2': 'back-table-2', 'suitor-3': 'back-table-1', 'suitor-4': 'front-table-2',
           'suitor-5': 'front-table-3', 'suitor-6': 'back-table-2'}


def overlay(sid, title):
    def f(text, pv):
        ground, subs = groups()
        slug = lambda n: n.replace(' ', '-').replace("'", '')
        top = f'{sid} - {title}.ldr'
        cast_rows, cast_files, cast = [], [], []
        for c in pv['cast']:
            fn = c.get('file')
            if not fn: continue
            try: blk = _file(text, fn)
            except KeyError: continue
            if not _is_fig(blk): continue                                                 # the forage's set pieces (the axis-shot arrow, the cup) go
            key = fn.replace(f'{sid} - ', '').replace('.ldr', '')
            x, z = MARKS[CAST_AT.get(key, 'front-table-2')]
            cast_rows.append(f'1 16 {x} -12 {z} 0 0 -1 0 1 0 1 0 0 {fn}'); cast_files.append(blk); cast.append(c)
        out = [f'0 FILE {sid}.ldr\n0 {pv["title"].upper()}\n0 Name: {sid}.ldr\n' + HEAD + '\n'
               f'1 16 0 0 0 1 0 0 0 1 0 0 0 1 {sid} - plate.ldr\n0 STEP\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 {top}\n0 STEP\n']
        out.append(_block(f'{sid} - plate.ldr', 'plate', ground))
        out.append(_block(top, title.replace('-', ' '), [f'1 16 0 0 0 1 0 0 0 1 0 0 0 1 {sid} - the-hall.ldr'] + cast_rows))
        out.append(_block(f'{sid} - the-hall.ldr', 'the hall', [f'1 16 0 0 0 1 0 0 0 1 0 0 0 1 {sid} - {slug(n)}.ldr' for n, _ in subs]))
        for n, rs in subs: out.append(_block(f'{sid} - {slug(n)}.ldr', n, rs))
        out += cast_files
        pv = copy.deepcopy(pv); pv['cast'] = cast
        for s in pv['shots']: s['camera']['subject'] = min(s['camera']['subject'], len(cast) - 1)
        pv['set'] = 'the Bow and the Hall kit (film-readymades/staging_hall.py)'
        return '\n'.join(o.rstrip('\n') + '\n' for o in out), pv
    return f


b21_s07 = overlay('OD-B21-S07', 'the-bow-sings')
b22_s01 = overlay('OD-B22-S01', 'antinous-falls')

if __name__ == '__main__':   # python3 film-readymades/staging_hall.py   -> the pieces and their part counts
    g, subs = groups()
    print('ground', len(g)); n = len(g)
    for lab, rs in subs: print(f'{lab:16s}', len(rs)); n += len(rs)
    print('total', n)
