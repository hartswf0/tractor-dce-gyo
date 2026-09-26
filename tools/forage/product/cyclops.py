#!/usr/bin/env python3
"""tools/forage/product/cyclops.py — THE CAVE OF THE CYCLOPS (Odyssey IX), a flagship kit in the manner of a LEGO Ideas model.

  python3 tools/forage/product/cyclops.py     -> odyssey/cards/set.cyclops-cave.mpd, set.cyclops-cave-open.mpd, and its sub-assemblies

Homer furnishes it: "a lofty cave shaded with laurels, close to the sea... a high yard built round it with stones bedded deep, and tall
pines and oaks"; inside, "racks loaded with cheeses, pens crowded with lambs and kids, each kind penned apart, the firstlings, the
middlings, the youngest"; "pails and bowls brimming with whey"; "the Cyclops's great club of green olive wood, as large as the mast of a
twenty-oared merchant vessel"; the ivy-wood bowl of Maron's wine; the door-stone "that twenty-two waggons could not draw"; the ship on the
beach, and the rock he hurls after it.

The kit tells the night and the morning at once, as an Ideas diorama does. Inside, the giant sprawls drunk by the fire with the bowl still
by his hand, and Odysseus and his men heat the olive stake in the embers; the east flank of the headland lifts away (the -open build) to
show it. Outside, the door-stone is rolled aside from the mouth, the rams go out to pasture, and on the beach below the black ship waits,
with the boulder the giant threw striking the sea beside it.

The headland is sculpted like the Wooden Horse (tools/forage/product/sculpt.py): smooth solids roughened by weathering, cut into cells a
stud square and a plate high, laid in bricks bonded course over course, tiles on every face that looks up (turf and floors keep their
studs), and settled until every part clicks.
"""
import json, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sculpt import Form, ell, cone, smin, rough, S, P, B
import clicks

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CARDS = os.path.join(ROOT, 'odyssey/cards')
PROPS = json.load(open(os.path.join(ROOT, 'odyssey/keyframes/props.json')))
GALLEY = json.load(open(os.path.join(ROOT, 'odyssey/keyframes/kit-galley.json')))
BLK, BLUE, WHITE, TAN, DTAN, GREEN, RB, LBG, DBG, DB, DGREEN, TORANGE, ORANGE, YELLOW, TCLEAR, DBLUE, TDBLUE = 0, 1, 15, 19, 28, 2, 70, 71, 72, 308, 288, 57, 25, 14, 47, 272, 33

FLOOR = 12            # the cave floor: dark tan plates on the baseplate (studded, so what stands in the cave clicks to it)
MEADOW = 4            # the turf and the beach: the baseplates' own studs
BEACH = 4
EAST = 180            # the east flank that lifts away: rock east of x 180 LDU, behind the mouth


# ── the headland ──
def headland(p):
    x, y, z = p
    rock = smin(smin(ell(p, (0, 0, -300), (700, 540, 300)), ell(p, (-430, 0, -170), (290, 420, 270)), 70), ell(p, (440, 0, -190), (270, 380, 250)), 70)
    rock += rough(p, 22)
    vault = min(ell(p, (40, 0, -270), (300, 330, 240)), ell(p, (20, 0, -40), (125, 260, 220)))      # the cave and its mouth
    rock = max(rock, -vault)
    stone = ell(p, (250, 150, -20), (140, 150, 105)) + rough(p, 6, 2.0)                             # the door-stone, rolled aside
    if stone <= 0: return stone, 'stone'
    if rock <= 0: return rock, 'rock'
    return min(rock, stone), 'air'


def ground():
    """the ground is baseplates: turf before the cave, a dark tan floor inside it, sand on the beach, the sea"""
    out = []
    for x, z, c in ((-16, -8, GREEN), (16, -8, GREEN), (-16, 24, TAN), (16, 24, TAN)):
        out.append(put(c, x * S, 4, z * S, '3811'))
    free = lambda x, z: all((i, 0, k) not in form.vox for i in (x // S - 1, x // S) for k in (z // S - 1, z // S))
    out += [put(DTAN, x, FLOOR, z, '3022') for x in range(-300, 400, 40) for z in range(-460, -20, 40)
            if free(x, z) and ell((x, 20, z), (40, 20, -270), (340, 330, 290)) < 0]   # wherever the cave has no rock
    return out


def colour(m, i, h, k):
    if m == 'rock':
        y = h * B
        if y > 300 and (i * 7 + k * 3 + h) % 13 == 0: return LBG
        return DBG if (i * 3 + k * 5 + h // 3) % 7 else LBG
    if m == 'moss': return GREEN
    if m == 'soot': return BLK
    if m == 'stone': return LBG if (i + k + h // 2) % 5 else DBG
    if m == 'floor': return DTAN
    if m == 'turf': return GREEN
    if m == 'sand': return TAN
    return DBG


form = Form(y0=4, keep_studs=('moss',), unit=B)
form.carve(headland, range(-32, 32), range(0, 23), range(-24, 8))
# moss on the tops the sky sees; soot on the vault over the fire
for (i, h, k), m in list(form.vox.items()):
    patch = math.sin(i / 3.1 + 0.7) * math.sin(k / 2.3) + 0.6 * math.sin((i + k) / 4.7 + h / 2)   # moss in patches on the ledges, bare rock between
    if m == 'rock' and (i, h + 1, k) not in form.vox and h > 8 and k > -22 and patch > 0.35:
        form.vox[(i, h, k)] = 'moss'
    if m == 'rock' and h > 10 and abs((i + 0.5) * S) < 200 and -440 < (k + 0.5) * S < -120 and (i, h - 1, k) not in form.vox:
        form.vox[(i, h, k)] = 'soot'
form.hollow(side=2, up=2, pillar=4)
class _East:   # the flank that lifts away: every cell of rock east of EAST behind the mouth's front, including what the settling grows there
    def __contains__(self, v):   # (not the rock under the door-stone: the stone stands on it)
        return (v[0] + 0.5) * S > EAST and (v[2] + 0.5) * S < -60 and form.vox.get(v) in ('rock', 'moss', 'soot') and \
            not any(form.vox.get((v[0], h, v[2])) == 'stone' for h in range(v[1] + 1, v[1] + 12))
EASTS = _East()


# ── the things in it ──
def mat_mul(a, b):   # 12-element LDraw matrices [x y z a b c d e f g h i]
    A = [[a[3], a[4], a[5]], [a[6], a[7], a[8]], [a[9], a[10], a[11]]]; Bm = [[b[3], b[4], b[5]], [b[6], b[7], b[8]], [b[9], b[10], b[11]]]
    R = [[sum(A[r][q] * Bm[q][c] for q in range(3)) for c in range(3)] for r in range(3)]
    t = [a[r] + sum(A[r][q] * b[q] for q in range(3)) for r in range(3)]
    return t + [R[0][0], R[0][1], R[0][2], R[1][0], R[1][1], R[1][2], R[2][0], R[2][1], R[2][2]]


def T(x, y, z): return [x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1]
def RY(a): c, s = math.cos(a), math.sin(a); return [0, 0, 0, c, 0, s, 0, 1, 0, -s, 0, c]
def RX(a): c, s = math.cos(a), math.sin(a); return [0, 0, 0, 1, 0, 0, 0, c, -s, 0, s, c]
def RZ(a): c, s = math.cos(a), math.sin(a); return [0, 0, 0, c, -s, 0, s, c, 0, 0, 0, 1]


def row(col, m, part): return f"1 {col} " + ' '.join(f'{v:.3f}'.rstrip('0').rstrip('.') for v in m) + f" {part if part.endswith('.dat') else part + '.dat'}"


def put(col, x, yup, z, part, m=None):
    """a part with its top face (LDraw origin) at yup; m a further turn"""
    return row(col, mat_mul(T(x, -yup, z), m or T(0, 0, 0)), part)


def on(col, x, yup, z, part, rot=0):
    """a brick-like part standing on the surface at yup (its top face one part-height up)"""
    import ldbox
    b = ldbox.box(part, False)
    return put(col, x, yup + b[1][1], z, part, RY(rot))


def prop(name, x, yup, z, m=None):
    base = mat_mul(T(x, -yup, z), m or T(0, 0, 0))
    return [row(p['color'], mat_mul(base, p['m']), p['part']) for p in PROPS[name]['parts']]


def seated(name, x, yup, z):
    """a prop set down so its lowest part's underside is exactly on yup (a prop's origin is not always its foot)"""
    import ldbox
    low = max(p['m'][1] + (ldbox.box(p['part'], False) or ((0, 0, 0), (0, 0, 0)))[1][1] for p in PROPS[name]['parts'])
    return prop(name, x, yup + low, z)


def figure(card, sub, x, yup, z, rot=0, drop=(), m=None):
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    bl = next((b for b in re.split(r'(?m)^0 FILE ', text) if b.startswith(f'{card} - {sub}.ldr')), '')
    body = [l.split() for l in bl.splitlines() if l.startswith('1 ') and l.split()[-1].replace('.dat', '') not in drop]
    hip = next((t for t in body if re.match(r'3815', t[14])), None)
    fx, fy, fz = (-float(hip[2]), -(float(hip[3]) + 40), -float(hip[4])) if hip else (0, 0, 0)
    base = mat_mul(mat_mul(T(x, -yup, z), m or RY(rot)), T(fx, fy, fz))
    return [row(int(t[1]), mat_mul(base, [float(v) for v in t[2:14]]), t[14]) for t in body]


W = 'ensemble.hidden-greek-warriors'


def fire(x, z, yup=FLOOR):
    """the hearth: a bed of embers (a black 2 x 2) ringed with stones, flames on it; (x, z) the corner the bed is centred on"""
    out = [on(BLK, x, yup, z, '3003')]
    for dx in (-30, 30):
        for dz in (-30, -10, 10, 30): out.append(on(LBG, x + dx, yup, z + dz, '3062b'))
    for dx in (-10, 10):
        for dz in (-30, 30): out.append(on(LBG, x + dx, yup, z + dz, '3062b'))
    out += [on(TORANGE, x - 10, yup + 24, z - 10, '3062b'), on(TORANGE, x + 10, yup + 24, z + 10, '3062b'),
            on(ORANGE, x - 10, yup + 48, z - 10, '4589'), on(TORANGE, x + 10, yup + 48, z + 10, '4589'), on(YELLOW, x + 10, yup + 24, z - 10, '4589')]
    return out


def stake(x, z, yup=FLOOR):
    """the olive stake laid with its sharpened, glowing end in the fire"""
    return prop('stake', x, yup + 12, z, RZ(-math.pi / 2))


def pens(x0, z0):
    """three wattle pens against the wall, the lambs and kids each kind apart (x0 even, z0 even: fences on the studs)"""
    out = []
    for n in range(3):
        zz = z0 + n * 100
        for dx in (40, 120): out.append(on(RB, x0 + dx, FLOOR, zz - 10, '3633'))
        for dz in (20, 60): out.append(on(RB, x0 + 170, FLOOR, zz + dz, '3633', math.pi / 2))
        for dx in (60, 140): out.append(on(WHITE if n != 1 else TAN, x0 + dx, FLOOR, zz + 40, '95341', math.pi / 2 * (1 if dx < 100 else 3)))
    return out


def cheese_rack(x, z):
    """racks loaded with cheeses: four posts of stacked bricks, two shelves of 2 x 6 plates, a round cheese and small ones on each,
    pails of whey on the floor before it ((x, z) the shelf's centre, on a stud corner)"""
    out = []
    for y0 in (FLOOR, FLOOR + 56):
        for dx in (-50, 50):
            for dz in (-10, 10):
                out += [on(RB, x + dx, y0, z + dz, '3005'), on(RB, x + dx, y0 + 24, z + dz, '3005')]
        out.append(put(RB, x, y0 + 56, z, '3795'))
        out += [put(YELLOW, x, y0 + 64, z, '14769'), on(WHITE, x - 30, y0 + 56, z - 10, '6141'), on(TAN, x + 30, y0 + 56, z + 10, '6141')]
    out += [on(WHITE, x + dx, FLOOR, z + 50, '3062b') for dx in (-30, 10)] + [on(WHITE, x + dx, FLOOR + 24, z + 50, '6141') for dx in (-30, 10)]
    return out


def club(x, z):
    """the great club of green olive wood, as long as a ship's mast, laid along the wall"""
    return [on(DB, x + dx, FLOOR, z, '3008', math.pi / 2 if False else 0) for dx in (-80, 80)] + [on(DB, x + 220, FLOOR, z, '3009')]


def fleece(x, z):
    return [put(WHITE, x + dx, FLOOR + 8, z + dz, '3020') for dx in (-40, 40) for dz in (-20, 20)]


def yard_wall():
    """the high yard of stones bedded deep round the cave mouth, open toward the sea"""
    out, cx, cz, r = [], 20, -60, 290
    for a in range(0, 360, 6):
        ang = math.radians(a)
        x, z = cx + r * math.cos(ang), cz + r * math.sin(ang)
        if z < -40 or abs(x - cx) < 70 and z > 100: continue
        xi, zi = round(x / S - 0.5) * S + 10, round(z / S - 0.5) * S + 10
        for kk in range(3): out.append(on(DBG if (a // 6 + kk) % 3 else LBG, xi, MEADOW + 24 * kk, zi, '3005'))
    return list(dict.fromkeys(out))


def trees():
    return [on(DGREEN, -360, MEADOW, 40, '3471'), on(DGREEN, 380, MEADOW, 0, '3471'), on(GREEN, -240, MEADOW, 140, '3470'), on(GREEN, 300, MEADOW, 160, '3470')]


def top_at(x, z):
    i, k = math.floor(x / S), math.floor(z / S)
    hs = [h for (ii, h, kk) in form.vox if ii == i and kk == k]
    return form.y0 + (max(hs) + 1) * B if hs else 0


def laurels():
    return [put(DGREEN, x, top_at(x, z) + 3, z, '2417') for x, z in ((-40, -110), (60, -120), (150, -100))]


def ship():
    """the black ship drawn up on the beach: it rests on its keel, an assembly of its own (it rolls down to the sea), so it is its own root"""
    base = T(-380, -BEACH, 250)
    out = [row(r['col'], mat_mul(mat_mul(base, RY(math.pi)), r['m']), r['part']) for r in GALLEY]
    return [l for r in out for l in ('0 !FORAGE ROOT', r)]   # a donor ship, its own joints real: the whole assembly rests on the sand


def thrown_rock():
    """the boulder he hurled, striking the sea: a column of spray on a clear stand, the rock on top"""
    x, z = 390, 450
    out = [on(TCLEAR, x, 12, z, '3062b'), on(TCLEAR, x, 36, z, '3062b'), on(TCLEAR, x, 60, z, '3062b')]
    out += [on(WHITE, x + dx, 12, z + dz, '6141') for dx, dz in ((-20, 0), (20, 0), (0, -20), (0, 20), (-20, -20), (20, 20))]
    out += [on(LBG, x + 10, 84, z + 10, '53934p01c01'), on(DBG, x + 10, 156, z + 10, '42284')]   # the rock, on the spray's stud
    return out


def sea():
    """the sea on the baseplate below the beach: blue plates, a line of breakers"""
    out = []
    for x in range(-640, 640, 160):
        for z in range(300, 780, 40): out.append(put(BLUE, x + 80, 12, z + 20, '3034'))
    for x in range(-600, 640, 120): out.append(on(DBLUE if (x // 120) % 2 else WHITE, x + 10, 12, 320, '93273'))   # one stud wide, four long toward the sea
    return out


def figures_inside():
    out = figure(W, 'warrior-1', -150, FLOOR, -190, -math.pi / 2) + figure(W, 'warrior-3', -230, FLOOR, -270, -math.pi / 2)   # facing the fire
    out += figure('character.odysseus', 'odysseus', -300, FLOOR, -190, -math.pi / 2)
    out += prop('polyphemusSprawl', 170, FLOOR, -330, RY(-math.pi / 2)) + seated('bowl', 120, FLOOR, -240)
    return out


def figures_outside():
    return figure(W, 'warrior-4', -330, BEACH + 60, 330, math.pi) + [on(WHITE, 60, MEADOW, 60, '95341', 0.4), on(WHITE, -40, MEADOW, 80, '95341', -0.3)]


def details():
    return (ground() + fire(20, -220) + stake(-380, -230) + pens(-260, -420) + cheese_rack(80, -440) + club(-120, -470) + fleece(240, -400) + yard_wall()
            + trees() + laurels() + ship() + thrown_rock() + sea() + figures_inside() + figures_outside())


def write(name, title, rows):
    head = [f'0 FILE {name}.ldr', f'0 {title}', f'0 Name: {name}.ldr', '0 Author: word to world, tools/forage/product/cyclops.py', '0 !LDRAW_ORG Unofficial_Model', '']
    open(os.path.join(CARDS, name + '.mpd'), 'w').write('\n'.join(head + rows) + '\n')
    return sum(r.startswith('1 ') for r in rows)


if __name__ == '__main__':
    opening = lambda v: min(ell(((v[0] + .5) * S, form.y0 + (v[1] + .5) * B, (v[2] + .5) * S), (40, 0, -270), (300, 330, 240)),
                            ell(((v[0] + .5) * S, form.y0 + (v[1] + .5) * B, (v[2] + .5) * S), (20, 0, -40), (125, 260, 220))) < 0
    for _ in range(8):   # the cave closed and the cave with its east flank lifted away share one headland: settle each until both hold
        before = dict(form.vox)
        left = form.settle(colour, extra=details, can_grow=lambda v: not opening(v))   # never grow into the cave
        east = {v: form.vox.pop(v) for v in list(form.vox) if v in EASTS}
        left_open = form.settle(colour, extra=details, can_grow=lambda v: not opening(v) and (v[0] + 0.5) * S <= EAST)
        form.vox.update(east)
        if form.vox == before and not left and not left_open: break   # a pass that changed nothing: both builds hold
    rock = form.parts(colour)
    n = write('set.cyclops-cave', 'The Cave of the Cyclops', rock + details())
    east = {v: form.vox.pop(v) for v in list(form.vox) if v in EASTS}
    n2 = write('set.cyclops-cave-open', 'The Cave of the Cyclops (the east flank lifted away)', form.parts(colour) + details())
    form.vox.update(east)
    # the sub-assemblies, each on its own for the instructions and the close-ups
    for sub, rows in (('polyphemus', prop('polyphemusSprawl', 0, 0, 0) + prop('bowl', -50, 0, 80)), ('fire-and-stake', fire(0, 0, 0) + stake(-150, 60, 0)),
                      ('pens', pens(-100, -140)), ('cheese-rack', cheese_rack(0, 0)), ('ship', ship()), ('thrown-rock', thrown_rock())):
        write('set.cyclops-cave-' + sub, 'The Cave of the Cyclops: ' + sub.replace('-', ' '), rows)
    print('set.cyclops-cave', n, 'pieces;', n2, 'with the flank lifted away;', len(left), 'loose after settling')
    for nm in ('set.cyclops-cave', 'set.cyclops-cave-open'):
        L = clicks.parts_loose(os.path.join(CARDS, nm + '.mpd')); print(nm, len(L), 'parts on the grid not clicked')
