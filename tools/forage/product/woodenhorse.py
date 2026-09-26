#!/usr/bin/env python3
"""tools/forage/product/woodenhorse.py — THE WOODEN HORSE, a display set in the manner of a LEGO Ideas model.

  python3 tools/forage/product/woodenhorse.py      -> odyssey/cards/set.wooden-horse.mpd and set.wooden-horse-open.mpd

A master builder's sculpture, not a prop: the horse is described as smooth solids (a barrel of a body, an arched neck, a long head, four
legs, a tail) and filled with real bricks on the stud grid, one brick course at a time, each course laid across the one below (running
bond, which reads as the planks of a wooden horse), coloured as timber (reddish brown with dark-brown boards). Where a course ends under
open air a 1 x 1 cheese slope softens the step. The body is a hollow hull with a deck inside: the Greeks stand in it, and a hatch in the
right flank lifts off whole, the way a display model opens to show its interior (the -open build). The horse stands on a wheeled timber cart, the cart on a display base paved in tan
and dark tan with a black frame, and the minifigures of the story stand in a row along the front of the base.
"""
import math, os, random, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CARDS = os.path.join(ROOT, 'odyssey/cards')
S, B, P = 20, 24, 8              # a stud, a brick course, a plate (LDU)
RB, DB, DT, TAN, BLK, DBG = 70, 308, 28, 19, 0, 72

# ── the shape: up is +y here (LDraw's y is negated when written); the horse faces +z ──
BASE_UP = 32                      # display base: a brick of black frame and a plate of paving
CART_UP = BASE_UP + 16 + 24 + 8   # the cart: wheels 40 high, their hubs at 20 over the base; deck of a brick and a plate
Y0 = CART_UP                      # the first brick course of the horse sits on the deck


def capsule(p, a, b, r):
    ax, ay, az = a; bx, by, bz = b; px, py, pz = p
    dx, dy, dz = bx - ax, by - ay, bz - az
    L2 = dx * dx + dy * dy + dz * dz
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / L2)) if L2 else 0
    cx, cy, cz = ax + t * dx, ay + t * dy, az + t * dz
    return math.dist(p, (cx, cy, cz)) - r


def ellipsoid(p, c, r):
    return (math.sqrt(sum(((p[i] - c[i]) / r[i]) ** 2 for i in range(3))) - 1) * min(r)


BODY = ((0, Y0 + 330, 0), (110, 125, 250))
def parts_at(p):
    """distance to each named solid (negative inside)"""
    x, y, z = p
    d = {}
    d['body'] = ellipsoid(p, *BODY)
    d['chest'] = ellipsoid(p, (0, Y0 + 350, 170), (95, 110, 110))
    d['neck'] = capsule(p, (0, Y0 + 380, 200), (0, Y0 + 590, 300), 72 - 0.12 * max(0, y - Y0 - 380))
    d['head'] = min(capsule(p, (0, Y0 + 620, 300), (0, Y0 + 540, 430), 50), ellipsoid(p, (0, Y0 + 600, 320), (48, 58, 70)))
    d['ears'] = min(capsule(p, (s * 26, Y0 + 650, 300), (s * 30, Y0 + 710, 290), 13) for s in (-1, 1))
    d['legs'] = min(capsule(p, (sx * 58, Y0 + 280, sz), (sx * 58 + sx * 4, Y0 + 20, sz + (12 if sz > 0 else -8)), 34 if y > Y0 + 140 else 30)
                    for sx in (-1, 1) for sz in (170, -160))
    d['hooves'] = min(capsule(p, (sx * 60, Y0 + 12, sz), (sx * 60, Y0 + 12, sz), 36) for sx in (-1, 1) for sz in (182, -168))
    d['tail'] = capsule(p, (0, Y0 + 400, -235), (0, Y0 + 170, -290), 24)
    return d


def solid(p):
    d = parts_at(p)
    return min(d.values()) <= 0, d


# ── voxels: studs across (i) and along (k), courses up (j) ──
vox = {}      # (i, j, k) -> colour kind
I, K = range(-8, 8), range(-17, 25)
J = range(0, 32)
for j in J:
    y = Y0 + j * B + B / 2
    for i in I:
        for k in K:
            x, z = (i + 0.5) * S, (k + 0.5) * S
            inside, d = solid((x, y, z))
            if not inside: continue
            part = min(d, key=d.get)
            vox[(i, j, k)] = part

# hollow hull: inside the body far enough from its skin, above the deck, becomes the Greeks' hold
DECK_J = 10                       # the hold's floor course: a flat floor across the barrel, just above the belly
HOLD = set()
for (i, j, k), part in list(vox.items()):
    x, y, z = (i + 0.5) * S, Y0 + j * B + B / 2, (k + 0.5) * S
    if j > DECK_J and j < 18 and ellipsoid((x, y, z), BODY[0], (BODY[1][0] - 26, BODY[1][1] - 30, BODY[1][2] - 30)) < 0 and abs(k) < 11:
        HOLD.add((i, j, k)); del vox[(i, j, k)]

# the hatch: the right flank (i > 0) over the hold, a panel 8 studs long and 5 courses high, hinged at its foot
HATCH = {(i, j, k) for (i, j, k) in vox if i >= 1 and DECK_J + 1 <= j <= DECK_J + 5 and -7 <= k < 7}


def colour(i, j, k, part):
    if part == 'hooves': return DB
    if part == 'tail': return DB
    rnd = random.Random(hash((i // 2, j, k // 3)) & 0xffffffff)
    if j % 4 == 0: return DB                           # a dark board every fourth course
    return DB if rnd.random() < 0.18 else RB


# ── packing: each course filled with the longest bricks that fit, alternate courses laid across ──
BRICKS = [((2, 4), '3001'), ((2, 3), '3002'), ((2, 2), '3003'), ((1, 8), '3008'), ((1, 6), '3009'), ((1, 4), '3010'), ((1, 3), '3622'), ((1, 2), '3004'), ((1, 1), '3005')]
rows = []     # (colour, x, y, z, rotY, part) in LDraw units (y down)


def line(col, x, yup, z, part, rot=0, m=None):
    if m is None:
        c, s = round(math.cos(rot), 6), round(math.sin(rot), 6)
        m = (c, 0, s, 0, 1, 0, -s, 0, c)
    rows.append(f"1 {col} {x:g} {-yup:g} {z:g} " + ' '.join(f'{v:g}' for v in m) + f" {part}.dat")


def pack(cells, yup_top, colour_of, along_z, strict=lambda q: False):
    """cells: set of (i, k) in one course; bricks' tops at yup_top. The longest brick that fits is laid and takes the colour of its first
    cell, as a builder lays a course; only cells where `strict` holds (a hoof, the tail) keep their own colour"""
    left = set(cells)
    order = sorted(left, key=lambda c: (c[1], c[0]) if along_z else (c[0], c[1]))
    for c in order:
        if c not in left: continue
        i0, k0 = c
        col = colour_of(i0, k0)
        for (w, l), part in BRICKS:
            # w across, l along the course direction
            cov = [(i0 + a, k0 + b) if along_z else (i0 + b, k0 + a) for a in range(w) for b in range(l)]
            if all(q in left and (colour_of(*q) == col or not strict(q)) for q in cov):
                for q in cov: left.discard(q)
                cx = (i0 + (w if along_z else l) / 2) * S
                cz = (k0 + (l if along_z else w) / 2) * S
                # LDraw bricks run their length along x; a course laid along z is turned a quarter
                line(col, cx, yup_top, cz, part, rot=(math.pi / 2 if along_z else 0) if (w, l) != (1, 1) else 0)
                break


def build(open_hatch):
    rows.clear()
    body = {v: p for v, p in vox.items() if not (open_hatch and v in HATCH)}
    for j in J:
        layer = {(i, k): p for (i, jj, k), p in body.items() if jj == j}
        if not layer: continue
        top = Y0 + (j + 1) * B
        pack(set(layer), top, lambda i, k: colour(i, j, k, layer[(i, k)]), along_z=(j % 2 == 0), strict=lambda q: layer[q] in ('hooves', 'tail'))
        # cheese slopes where this course ends under open air, facing out
        for (i, k), p in layer.items():
            if (i, j + 1, k) in body or p in ('hooves',): continue
            for di, dk, rot in ((1, 0, -math.pi / 2), (-1, 0, math.pi / 2), (0, 1, 0), (0, -1, math.pi)):
                if (i + di, j, k + dk) not in body and (i + di, j + 1, k + dk) not in body and (i - di, j + 1, k - dk) not in body:
                    line(RB if p != 'tail' else DB, (i + 0.5) * S, top + 16, (k + 0.5) * S, '54200', rot=rot)
                    break
    # the hold's deck: dark tan plates under the Greeks
    deck = {(i, k) for (i, j, k) in HOLD if j == DECK_J + 1}
    for (i, k) in deck: line(DT, (i + 0.5) * S, Y0 + (DECK_J + 1) * B + P, (k + 0.5) * S, '3024')
    # mane: black tooth plates along the crest of the neck, eyes, a bridle
    for j in J:
        crest = [(i, k) for (i, jj, k) in vox if jj == j and i in (-1, 0) and vox[(i, jj, k)] in ('neck', 'head') and (i, j + 1, k) not in vox]
        for (i, k) in crest:
            if vox.get((i, j, k)) == 'neck': line(DB, (i + 0.5) * S, Y0 + (j + 1) * B + P, (k + 0.5) * S, '49668', rot=math.pi)
    for s in (-1, 1):
        line(BLK, s * 50, Y0 + 610, 345, '98138', m=(0, s, 0, -s, 0, 0, 0, 0, 1))
    return list(rows)


def cart():
    out = []
    rows.clear()
    deck_top = CART_UP
    # three courses laid crosswise so each binds the one below: deck plates across, a course of bricks along, a chassis across it
    for i in range(-8, 8, 4):
        for k in range(-18, 24, 2):
            line(RB if (k // 2) % 2 else DB, (i + 2) * S, deck_top, (k + 1) * S, '3020')
    for i in range(-8, 8, 2):
        for k in range(-18, 24, 4):
            line(DB, (i + 1) * S, deck_top - P, (k + 2) * S, '3001', rot=math.pi / 2)
    for i in range(-6, 6, 4):          # the chassis stands on the base's own bricks, where the paving leaves them bare
        for k in range(-18, 24, 2):
            line(DB, (i + 2) * S, deck_top - P - B, (k + 1) * S, '3001')
    # wheels: 2 x 2 round bricks on their sides, a round plate for a hub, at the four corners
    for sx in (-1, 1):
        for kz in (-15, 20):
            hub_up = BASE_UP + 20
            line(DB, sx * 9 * S, hub_up, kz * S, '3941', m=(0, -sx, 0, sx, 0, 0, 0, 0, 1))
            line(RB, sx * (9 * S + 26), hub_up, kz * S, '4032a', m=(0, -sx, 0, sx, 0, 0, 0, 0, 1))
    return list(rows)


def base():
    """the display base: a frame of dark grey bricks paved with tan and dark tan tiles, wide enough on the horse's right for the figures
    to stand in a row in front of it, and a nameplate of black tiles along the front edge"""
    rows.clear()
    I0, I1, K0, K1 = -12, 22, -26, 26           # studs; the horse and its cart stand over i -7..7
    for i in range(I0, I1, 2):
        for k in range(K0, K1, 4):
            line(DBG, (i + 1) * S, BASE_UP - P, (k + 2) * S, '3001', rot=math.pi / 2)
    rnd = random.Random(7)
    for i in range(I0, I1, 2):
        for k in range(K0, K1, 2):
            edge = i in (I0, I1 - 2) or k in (K0, K1 - 2)
            plate = i == I1 - 6 and -8 <= k < 8
            under_cart = -6 <= i < 6 and -18 <= k < 24
            if plate or under_cart: continue
            line(DBG if edge else (TAN if rnd.random() < 0.3 else DT), (i + 1) * S, BASE_UP, (k + 1) * S, '3068b')
    for k in range(-8, 8, 4):                     # the nameplate: four 2 x 4 black tiles end to end
        line(BLK, (I1 - 5) * S, BASE_UP, (k + 2) * S, '87079', rot=math.pi / 2)
    return list(rows)


def figure_file(card, sub):
    """the minifigure's own parts from a character card, as (name, lines) with its feet brought to the origin"""
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    blocks = re.split(r'(?m)^0 FILE ', text)
    for bl in blocks:
        if bl.startswith(f'{card} - {sub}.ldr'):
            lines = [l for l in bl.splitlines() if l.startswith('1 ')]
            return lines
    return []


def minifig(card, sub, x, yup, z, rot, drop=()):
    body = [l for l in figure_file(card, sub) if l.split()[-1].replace('.dat', '') not in drop]
    hip = next((l.split() for l in body if re.search(r' 3815\w*\.dat$', l)), None)
    fx, fy, fz = (-float(hip[2]), -(float(hip[3]) + 40), -float(hip[4])) if hip else (20, 8, -10)   # the feet 40 under the hips
    out = []
    c, s = math.cos(rot), math.sin(rot)
    for l in body:
        t = l.split()
        px, py, pz = float(t[2]) + fx, float(t[3]) + fy, float(t[4]) + fz     # feet to the origin
        m = [float(v) for v in t[5:14]]
        nx, nz = c * px + s * pz, -s * px + c * pz
        R = (c, 0, s, 0, 1, 0, -s, 0, c)
        mm = [sum(R[r * 3 + q] * m[q * 3 + cc] for q in range(3)) for r in range(3) for cc in range(3)]
        out.append(f"1 {t[1]} {x + nx:g} {-yup + py:g} {z + nz:g} " + ' '.join(f'{v:g}' for v in mm) + ' ' + ' '.join(t[14:]))
    return out


def write(name, title, open_hatch):
    horse = build(open_hatch)
    body = [f'0 FILE {name}.ldr', f'0 {title}', f'0 Name: {name}.ldr', '0 Author: word to world, tools/forage/product/woodenhorse.py', '0 !LDRAW_ORG Unofficial_Model', '']
    body += base() + cart() + horse
    # the Greeks in the hold, and the story's figures along the front of the base
    hold_up = Y0 + (DECK_J + 1) * B + P
    inside = [('warrior-1', 35, -105), ('warrior-3', 35, -45), ('warrior-4', 35, 15), ('warrior-5', 35, 75)]
    if not open_hatch: inside += [('warrior-2', -50, -80)]
    for sub, x, z in inside:            # the Greeks on the deck of the hold, facing the hatch
        body += minifig('ensemble.hidden-greek-warriors', sub, x, hold_up, z, -math.pi / 2, drop=('43899', '4497', '3849', '93789'))   # no room for spears under the roof
    if open_hatch:                      # the first man down, on the cart beside the horse's hooves, looking back up at the hatch
        body += minifig('ensemble.hidden-greek-warriors', 'warrior-2', 140, CART_UP, 200, math.pi)
    front = [('character.demodocus', 'demodocus'), ('character.athena', 'athena'), ('character.odysseus', 'odysseus'),
             ('character.menelaus', 'menelaus'), ('character.helen-at-the-horse', 'helen-at-the-horse')]
    for n, (card, sub) in enumerate(front):     # the lineup on the apron, facing out of the display toward the viewer
        body += minifig(card, sub, 12 * S, BASE_UP, (n - (len(front) - 1) / 2) * 4 * S, -math.pi / 2)
    open(os.path.join(CARDS, name + '.mpd'), 'w').write('\n'.join(body) + '\n')
    print(name, len([l for l in body if l.startswith('1 ')]), 'pieces')


def prop_the_roof(name, title, open_hatch):
    """build, look for bricks that click to nothing (the roof over the hold is laid across open air), and raise a timber post from the
    deck under each: the hold cell under a loose brick is filled again, and again under that, until the whole horse holds"""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import clicks
    for _ in range(40):
        write(name, title, open_hatch)
        loose = clicks.parts_loose(os.path.join(CARDS, name + '.mpd'))
        n = 0
        for pid, top, bot, fp, l in loose:
            j = round((-bot - Y0) / B)                # the course the loose part stands on
            for (i, k) in fp:
                if (i, j - 1, k) in HOLD: HOLD.discard((i, j - 1, k)); vox[(i, j - 1, k)] = 'post'; n += 1
                elif open_hatch and (i, j - 1, k) in HATCH and (i, j, k) in vox and (i, j, k) not in HATCH:
                    HATCH.add((i, j, k)); n += 1          # the lintel over the hatch lifts off with it
                elif (i, j, k) not in vox or (i, j - 1, k) in vox: continue
                elif any((i, j - d, k) in vox for d in (2, 3)): vox[(i, j - 1, k)] = vox[(i, j, k)]; n += 1   # a brick under an ear
                else: del vox[(i, j, k)]; n += 1
        if not n: return loose


if __name__ == '__main__':
    prop_the_roof('set.wooden-horse', 'The Wooden Horse', False)
    prop_the_roof('set.wooden-horse-open', 'The Wooden Horse (hatch open)', True)
    print('posts in the hold:', sorted({(i, k) for (i, j, k), p in vox.items() if p == 'post'}))
    write('set.wooden-horse', 'The Wooden Horse', False)
    write('set.wooden-horse-open', 'The Wooden Horse (hatch open)', True)
