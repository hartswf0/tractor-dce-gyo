#!/usr/bin/env python3
"""tools/forage/product/cyclops.py — THE CAVE OF THE CYCLOPS (Odyssey IX), a flagship kit held to the bar of an approved LEGO Ideas model.

  python3 tools/forage/product/cyclops.py     -> odyssey/cards/set.cyclops-cave*.mpd

The bar (odyssey/kits/index.html, "The Ideas bar"): one concept, a main model and a supporting build that each stand on their own (as The
Old Man and the Sea stands its boat and its marlin apart); well under the 5,000-piece limit; one story moment posed at its height; finished
surfaces, never a field of bare studs on rock; a play feature that works; a nameplate on the base.

The main model is the headland on a 48 x 32 base: a lofty cave "shaded with laurels", the yard before it "built of stones bedded deep",
where that evening the rams were left. Inside, the moment: Polyphemus asleep sitting against the back wall, drunk on Maron's wine, the
ivy-wood bowl fallen by his hand, and four men driving the olive stake, its point glowing from the fire, into his eye ("as a man bores a
ship's timber with a drill"). The east flank lifts away to show it. The door-stone "that twenty-two waggons could not draw" stands rolled
aside by the mouth.

The supporting build is the shore on a 48 x 16 base: the black ship on the sea and the boulder the blinded giant hurled after it, caught
striking the water. It stands in front of the headland to make one diorama 48 x 48, or alone on a shelf.

The headland is sculpted (tools/forage/product/sculpt.py): smooth solids roughened by weathering, laid in bricks bonded crosswise, every
top the sky sees finished in a tile or a cheese slope running off its edge, moss in patches with plants growing from it; hollowed to a skin
on pillars; and settled, closed and opened together, until every part clicks (tools/forage/product/clicks.py).
"""
import json, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sculpt import Form, ell, smin, rough, S, P, B
import clicks

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CARDS = os.path.join(ROOT, 'odyssey/cards')
PROPS = json.load(open(os.path.join(ROOT, 'odyssey/keyframes/props.json')))
GALLEY = json.load(open(os.path.join(ROOT, 'odyssey/keyframes/kit-galley.json')))
BLK, BLUE, WHITE, TAN, DTAN, GREEN, RB, LBG, DBG, DB, DGREEN, TORANGE, ORANGE, YELLOW, TCLEAR, DBLUE, TDBLUE = 0, 1, 15, 19, 28, 2, 70, 71, 72, 308, 288, 57, 25, 14, 47, 272, 33
TLBLUE, MBLUE, GOLD, OLIVE, SANDGREEN = 43, 73, 297, 330, 378

FLOOR = 12            # the cave floor: dark tan plates on the baseplate (studded, so what stands in the cave clicks to it)
GRASS = 4             # the baseplates' own studs
EAST = 60             # the east flank that lifts away: rock east of x 60 LDU, behind the mouth
MOUTH = -110          # ... and behind z -110, the front of the vault
SHORE = 160           # the headland's base ends at z 160; the shore's base runs on to z 480


# ── the headland ──
def headland(p):
    rock = smin(smin(ell(p, (0, 0, -250), (430, 390, 240)), ell(p, (-320, 0, -170), (170, 300, 210)), 60), ell(p, (320, 0, -190), (170, 280, 200)), 60)
    rock += rough(p, 18)
    vault = min(ell(p, (-20, 0, -250), (230, 250, 175)), ell(p, (-20, 0, -60), (100, 200, 160)))      # the cave and its mouth
    rock = max(rock, -vault)
    stone = ell(p, (190, 100, 30), (80, 100, 70)) + rough(p, 5, 2.0)                                  # the door-stone, rolled aside
    if stone <= 0: return stone, 'stone'
    if rock <= 0: return rock, 'rock'
    return min(rock, stone), 'air'


def in_vault(x, z, pad=0): return min(ell((x, 20, z), (-20, 0, -250), (230 + pad, 250, 175 + pad)), ell((x, 20, z), (-20, 0, -60), (100 + pad, 200, 160 + pad))) < 0


def colour(m, i, h, k):
    if m == 'rock':
        a, b = (i + 2 * (h % 2)) // 4, (k + 2 * (h % 2)) // 4                                             # patches four studs across, so bricks merge
        if (h + (a + b) // 3) % 7 == 0: return DTAN                                                      # a bed of sandier stone
        return LBG if (a * 5 + b * 3 + h // 2) % 5 == 0 else DBG
    if m == 'moss': return OLIVE if (i // 3 * 5 + k // 3 * 3) % 4 == 0 else GREEN
    if m == 'soot': return BLK
    if m == 'stone': return LBG if (i + k + h // 2) % 5 else DBG
    return DBG


form = Form(y0=GRASS, keep_studs=('moss',), unit=B, caps=True)
form.carve(headland, range(-24, 24), range(0, 17), range(-24, 5))
for (i, h, k), m in list(form.vox.items()):
    patch = math.sin(i / 3.1 + 0.7) * math.sin(k / 2.3) + 0.6 * math.sin((i + k) / 4.7 + h / 2)   # moss in patches on the ledges, bare rock between
    if m == 'rock' and (i, h + 1, k) not in form.vox and h > 6 and patch > 0.35:
        form.vox[(i, h, k)] = 'moss'
    if m == 'rock' and h > 6 and in_vault((i + 0.5) * S, (k + 0.5) * S, 30) and (i, h - 1, k) not in form.vox:
        form.vox[(i, h, k)] = 'soot'                                                                   # the vault blackened over the fire
form.hollow(side=2, up=2, pillar=4)


class _East:   # the flank that lifts away: every cell of rock east of EAST behind the mouth's front (not the rock under the door-stone)
    def __contains__(self, v):
        return (v[0] + 0.5) * S > EAST and (v[2] + 0.5) * S < MOUTH and form.vox.get(v) in ('rock', 'moss', 'soot') and \
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




def stake(eye, n=10, angle=22):
    """the olive stake, n round bricks on an axle with its point glowing, laid from the men's hands up into the eye at `eye` (LDraw
    coordinates, y down): its point is the eye, its butt `angle` degrees below"""
    th = math.radians(angle)
    d = (0, -math.sin(th), -math.cos(th))                    # from the butt to the point: up, and toward the giant (-z)
    L = 24 * n + 48
    base = mat_mul(T(eye[0] - L * d[0], eye[1] - L * d[1], eye[2] - L * d[2]), RX(math.atan2(-math.cos(th), -math.sin(th))))
    out = [row(DB if j in (2, 6) else RB, mat_mul(base, T(0, 24 * j, 0)), '3941') for j in range(n)]
    out.append(row(TORANGE, mat_mul(base, [0, 24 * n + 48, 0, 1, 0, 0, 0, -1, 0, 0, 0, -1]), '3942c'))
    return out, (eye[0] - L * d[0], eye[1] - L * d[1], eye[2] - L * d[2])


def blinding(x, z):
    """the moment: the giant asleep against the wall facing the mouth, the stake in his eye, four men on it; (x, z) the giant"""
    out = prop('polyphemusSprawl', x, FLOOR, z, RY(math.pi))
    eye = (x + 10, -(FLOOR + 148), z + 80)
    st, butt = stake(eye)
    out += st
    bx, bz = round(butt[0] / 10) * 10, butt[2]
    out += figure('character.odysseus', 'odysseus', bx, FLOOR, round(bz / 10) * 10 + 30)                       # at the butt, driving it in
    for n, (dx, dz) in enumerate(((-40, -40), (40, -80), (-40, -120))):
        out += figure(W, f'warrior-{n + 1}', bx + dx, FLOOR, round(bz / 10) * 10 + dz, math.pi / 2 if dx < 0 else -math.pi / 2)
    out += seated('bowl', x - 100, FLOOR, z + 120)                                                             # the ivy-wood bowl, fallen
    return out


def pens(x0, z0, n=2):
    """wattle pens against the east wall, the lambs and kids each kind apart (x0 even, z0 even: fences on the studs)"""
    out = []
    for q in range(n):
        zz = z0 + q * 100
        for dx in (40, 120): out.append(on(RB, x0 + dx, FLOOR, zz - 10, '3633'))
        for dz in (20, 60): out.append(on(RB, x0 + 170, FLOOR, zz + dz, '3633', math.pi / 2))
        for dx in (60, 140): out.append(on(WHITE if q != 1 else TAN, x0 + dx, FLOOR, zz + 40, '95341', math.pi / 2 * (1 if dx < 100 else 3)))
    return out


def ground():
    """the base is baseplates, 48 x 32: turf; inside the cave a floor of dark tan plates wherever there is no rock"""
    out = [put(GREEN, -160, GRASS, -160, '3811'), put(GREEN, 320, GRASS, -160, '3857', RY(math.pi / 2))]
    free = lambda x, z: all((i, 0, k) not in form.vox for i in (x // S - 1, x // S) for k in (z // S - 1, z // S))
    out += [put(DTAN, x, FLOOR, z, '3022') for x in range(-300, 300, 40) for z in range(-460, 100, 40) if free(x, z) and in_vault(x, z)]
    return out


def top_at(x, z):
    i, k = math.floor(x / S), math.floor(z / S)
    hs = [h for (ii, h, kk) in form.vox if ii == i and kk == k]
    return form.y0 + (max(hs) + 1) * B if hs else 0


def greenery():
    """plants from the moss (a few of its bare studs), laurels over the mouth, trees at the corners of the yard"""
    out = []
    for (i, h, k), m in sorted(form.vox.items()):
        if m == 'moss' and (i, h + 1, k) not in form.vox and (i * 7 + k * 13 + h) % 9 == 0:
            out.append(on(GREEN if (i + k) % 2 else DGREEN, (i + 0.5) * S, form.y0 + (h + 1) * B, (k + 0.5) * S, '6255', (i % 4) * math.pi / 2))
    moss = sorted((v for v, m in form.vox.items() if m == 'moss' and (v[0], v[1] + 1, v[2]) not in form.vox and abs((v[0] + .5) * S + 20) < 180
                   and -200 < (v[2] + .5) * S < -60), key=lambda v: -v[1])
    for (i, h, k) in moss[:5:2]: out.append(on(DGREEN, (i + 1) * S, form.y0 + (h + 1) * B, (k + 1) * S, '2417'))   # laurels: on four moss studs
    out += [on(DGREEN, -420, GRASS, 100, '3471'), on(GREEN, 420, GRASS, 110, '3470')]
    return out


def yard_wall():
    """the high yard of stones bedded deep before the mouth, open to the path down to the sea; the rams inside it"""
    out, cx, cz, r, seen = [], -20, 20, 190, set()
    for a in range(0, 360, 5):
        ang = math.radians(a)
        x, z = cx + r * math.cos(ang), cz + r * 0.6 * math.sin(ang)
        if z < -40 or abs(x - cx) < 60 and z > 60: continue
        xi, zi = round(x / S - 0.5) * S + 10, round(z / S - 0.5) * S + 10
        if abs(xi - 190) < 110 and zi < 110: continue                                                          # the door-stone stands there
        if (xi, zi) in seen or any((xi // S, h, zi // S) in form.vox for h in range(3)): continue                 # once, and never into the rock
        seen.add((xi, zi))
        for kk in range(2): out.append(on(DBG if (a // 5 + kk) % 3 else LBG, xi, GRASS + 24 * kk, zi, '3005'))
        out.append(put(LBG if (a // 5) % 4 else DTAN, xi, GRASS + 48 + 8, zi, '3070b'))
    out += [on(WHITE, -60, GRASS, 60, '95341', 0.4), on(WHITE, 40, GRASS, 80, '95341', -0.3), on(TAN, -120, GRASS, 40, '95341', 1.2)]
    return out


def plaque(z=SHORE - 10):
    """the nameplate at the foot of the base: black tiles, a gold stud at each end"""
    return [put(BLK, -60, GRASS + 8, z, '6636'), put(BLK, 60, GRASS + 8, z, '6636'), put(GOLD, -130, GRASS + 8, z, '98138'), put(GOLD, 130, GRASS + 8, z, '98138')]


def main_details():
    return ground() + fire(100, -240) + cheese_rack(-160, -220) + blinding(-60, -360) + greenery() + yard_wall() + plaque()


# ── the shore: the supporting build ──
def shore():
    """48 x 16 of sea and sand: blue baseplates under a surface of tiles, sand along the headland's edge, foam at the waterline, the black
    ship, and the boulder striking the water"""
    Z0 = SHORE
    out = [put(BLUE, -160, GRASS, Z0 + 160, '3857'), put(BLUE, 320, GRASS, Z0 + 160, '3867')]
    X, ZR = -340, Z0 + 220                                                                                       # the boulder's hole in the tiles (on their grid)
    rock_cell = {(X, ZR)}                                                                               # the boulder's stud
    for x in range(-480, 480, 160): out.append(put(TAN, x + 80, GRASS + 8, Z0 + 20, '3034'))                    # the beach, two studs
    for x in range(-460, 480, 40):
        for z in range(Z0 + 60, Z0 + 320, 40):
            if (x, z) in rock_cell: continue
            t = (x * 7 + z * 3) // 40 % 7
            c = TLBLUE if t in (0, 3) else TCLEAR if t == 5 else MBLUE if z < Z0 + 100 else BLUE
            out.append(put(c, x, GRASS + 8, z, '3068b'))
    for x in range(-470, 480, 60): out.append(put(WHITE, x, GRASS + 16, Z0 + 30, '98138'))                    # foam on the sand's last studs
    out += [on(TCLEAR, X - 10, GRASS, ZR - 10, '3062b'), on(TCLEAR, X - 10, GRASS + 24, ZR - 10, '3062b'), on(TCLEAR, X - 10, GRASS + 48, ZR - 10, '3062b')]
    out += [on(WHITE, X + 10, GRASS, ZR + 10, '6141'), on(WHITE, X - 10, GRASS, ZR + 10, '6141'), on(WHITE, X + 10, GRASS, ZR - 10, '6141')]
    out += [on(LBG, X, GRASS + 72, ZR, '53934p01c01'), on(DBG, X, GRASS + 144, ZR, '42284')]
    base = mat_mul(T(260, -(GRASS + 8), Z0 + 200), RY(math.pi / 2))
    out += [l for r in GALLEY for l in ('0 !FORAGE ROOT', row(r['col'], mat_mul(base, r['m']), r['part']))]   # afloat: the hull on the sea's tiles
    out += figure(W, 'warrior-4', 60, GRASS + 8, Z0 + 20, math.pi)
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



def write(name, title, rows):
    head = [f'0 FILE {name}.ldr', f'0 {title}', f'0 Name: {name}.ldr', '0 Author: word to world, tools/forage/product/cyclops.py', '0 !LDRAW_ORG Unofficial_Model', '']
    open(os.path.join(CARDS, name + '.mpd'), 'w').write('\n'.join(head + rows) + '\n')
    return sum(r.startswith('1 ') for r in rows)



if __name__ == '__main__':
    opening = lambda v: in_vault((v[0] + .5) * S, (v[2] + .5) * S) and form.y0 + (v[1] + .5) * B < 250
    for _ in range(8):   # the cave closed and the cave with its east flank lifted away share one headland: settle each until both hold
        before = dict(form.vox)
        left = form.settle(colour, extra=main_details, can_grow=lambda v: not opening(v))   # never grow into the cave
        east = {v: form.vox.pop(v) for v in list(form.vox) if v in EASTS}
        left_open = form.settle(colour, extra=main_details, can_grow=lambda v: not opening(v) and (v[0] + 0.5) * S <= EAST)
        form.vox.update(east)
        if form.vox == before and not left and not left_open: break   # a pass that changed nothing: both builds hold
    rock, sh = form.parts(colour), shore()
    n = write('set.cyclops-cave', 'The Cave of the Cyclops', rock + main_details() + sh)
    nh = write('set.cyclops-cave-headland', 'The Cave of the Cyclops: the headland', rock + main_details())
    east = {v: form.vox.pop(v) for v in list(form.vox) if v in EASTS}
    n2 = write('set.cyclops-cave-open', 'The Cave of the Cyclops (the east flank lifted away)', form.parts(colour) + main_details() + sh)
    form.vox.update(east)
    for sub, rows in (('blinding', blinding(0, 0)), ('fire', fire(0, 0, 0)), ('cheese-rack', cheese_rack(0, 0)),
                      ('shore', sh)):
        write('set.cyclops-cave-' + sub, 'The Cave of the Cyclops: ' + sub.replace('-', ' '), rows)
    print('set.cyclops-cave', n, 'pieces: the headland', nh, '(', nh - n2 + (n - nh), 'in the flank ), the shore', n - nh)
    for nm in ('set.cyclops-cave', 'set.cyclops-cave-open', 'set.cyclops-cave-shore'):
        L = clicks.parts_loose(os.path.join(CARDS, nm + '.mpd')); print(nm, len(L), 'parts on the grid not clicked')
