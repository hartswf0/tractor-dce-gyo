#!/usr/bin/env python3
"""tools/forage/product/woodenhorse.py — THE WOODEN HORSE, a display set in the manner of a LEGO Ideas model.

  python3 tools/forage/product/woodenhorse.py      -> odyssey/cards/set.wooden-horse.mpd and set.wooden-horse-open.mpd

A sculpture, not a stack of boxes. The horse is described as smooth solids blended into one another (barrel, chest, rump, a neck raked
forward, a long head tapering to the muzzle, slender legs with a bend at the hock, a falling tail) and cut into cells a stud square and a
plate high, three times finer upward than a brick, so its contours run like the grain of carved wood. Where a cell has its two neighbours
above it, the three become part of a brick; the rest are plates. Every face that looks up is finished in tiles, so the skin shows no studs;
the only studs left are the deck where the Greeks stand. Nothing is added for its own sake: the mane and tail and hooves are dark timber,
the eyes are two black plates set into the head.

It is a model someone can build and play with. Every part stands on the studs of the parts below it or hangs from those above
(tools/forage/product/clicks.py checks it, and the build props with timber posts any roof brick left over open air). The right flank lifts
off whole to show the hold, with its deck and five Greeks (the -open build). The horse stands on a timber cart that rolls on four wheels
on pinned plates, on a paved display base with a nameplate, and the figures of the story stand in a row along its front.
"""
import math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CARDS = os.path.join(ROOT, 'odyssey/cards')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import clicks

S, P, B = 20, 8, 24                     # a stud, a plate, a brick (LDU)
RB, DB, DT, TAN, BLK, DBG = 70, 308, 28, 19, 0, 72

BASE_UP = 32                            # the display base: a course of bricks and a plate of paving tiles
WHEEL_UP = BASE_UP + 24                 # top of the cart's lowest plates; a tyre (radius 18) on a wheel pin 6 below it runs on the paving
CART_UP = WHEEL_UP + B                  # a course of bricks across them
Y0 = CART_UP + P                        # a deck of plates; the horse's hooves stand on it

BRICKS = [((2, 4), '3001'), ((2, 3), '3002'), ((2, 2), '3003'), ((1, 8), '3008'), ((1, 6), '3009'), ((1, 4), '3010'), ((1, 3), '3622'),
          ((1, 2), '3004'), ((1, 1), '3005')]
PLATES = [((2, 8), '3034'), ((2, 6), '3795'), ((2, 4), '3020'), ((2, 3), '3021'), ((2, 2), '3022'), ((1, 8), '3460'), ((1, 6), '3666'),
          ((1, 4), '3710'), ((1, 3), '3623'), ((1, 2), '3023'), ((1, 1), '3024')]
TILES = [((2, 4), '87079'), ((2, 2), '3068b'), ((1, 4), '2431'), ((1, 3), '63864'), ((1, 2), '3069b'), ((1, 1), '3070b')]


# ── the shape: up is +y from the horse's ground (the cart deck); the horse faces +z ──
def seg(p, a, b):
    ax, ay, az = a; bx, by, bz = b; px, py, pz = p
    dx, dy, dz = bx - ax, by - ay, bz - az
    L2 = dx * dx + dy * dy + dz * dz
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / L2)) if L2 else 0
    return math.dist(p, (ax + t * dx, ay + t * dy, az + t * dz)), t


def cone(p, a, b, ra, rb):                # a capsule whose radius runs from ra to rb
    d, t = seg(p, a, b)
    return d - (ra + (rb - ra) * t)


def ell(p, c, r):
    q = [(p[i] - c[i]) / r[i] for i in range(3)]
    return (math.sqrt(sum(v * v for v in q)) - 1) * min(r)


def smin(a, b, k=28):                     # a smooth union: two solids flow into each other instead of meeting at a crease
    h = max(0, min(1, 0.5 + 0.5 * (b - a) / k))
    return b + (a - b) * h - k * h * (1 - h)


BARREL = ((0, 420, -10), (96, 128, 210))
EYES = [(s * 38, 712, 360) for s in (-1, 1)]
NECK = ((0, 470, 170), (0, 700, 300), 82, 46)


def anatomy(p):
    d = {}
    d['body'] = smin(smin(ell(p, *BARREL), ell(p, (0, 420, 150), (90, 128, 95)), 40), ell(p, (0, 445, -165), (92, 120, 100)), 40)
    d['body'] = smin(d['body'], ell(p, (0, 540, 110), (50, 45, 80)), 30)                        # the withers
    d['neck'] = cone(p, *NECK)
    d['mane'] = cone(p, (0, 560, 80), (0, 786, 256), 29, 23)                                   # a raised crest of dark timber
    d['head'] = smin(smin(cone(p, (0, 730, 318), (0, 596, 440), 44, 30), ell(p, (0, 700, 340), (44, 52, 58)), 24),
                     ell(p, (0, 600, 436), (30, 36, 42)), 20)
    d['ears'] = min(cone(p, (s * 22, 750, 318), (s * 24, 822, 330), 15, 12) for s in (-1, 1))
    legs = []
    for s in (-1, 1):
        legs += [cone(p, (s * 52, 330, 158), (s * 52, 200, 164), 32, 22), cone(p, (s * 52, 200, 164), (s * 52, 40, 170), 20, 19)]
        legs += [cone(p, (s * 52, 400, -150), (s * 52, 230, -200), 46, 24), cone(p, (s * 52, 230, -200), (s * 52, 40, -180), 21, 19)]
    d['legs'] = min(legs)
    d['hooves'] = min(ell(p, (s * 52, 18, z), (26, 20, 28)) for s in (-1, 1) for z in (172, -178))
    d['tail'] = min(cone(p, (0, 505, -248), (0, 450, -292), 24, 24), cone(p, (0, 450, -292), (0, 340, -306), 24, 22),
                    cone(p, (0, 340, -306), (0, 230, -290), 22, 20))
    return d


def solid(p):
    d = anatomy(p)
    f = d['body']
    for k in ('neck', 'legs'): f = smin(f, d[k], 34)
    f = smin(f, d['head'], 26)
    for k in ('ears', 'hooves', 'tail', 'mane'): f = min(f, d[k])
    for k in ('mane', 'tail', 'hooves', 'ears'):                  # the dark timber wins wherever it is
        if d[k] <= 0: return f, k
    return f, min(d, key=d.get)


# ── cells: studs across (i) and along (k), plates up (h) ──
I, K, H = range(-7, 7), range(-20, 27), range(0, 112)
vox = {}                                  # (i, h, k) -> the part of the horse it belongs to
for h in H:
    for i in I:
        for k in K:
            f, part = solid(((i + 0.5) * S, (h + 0.5) * P, (k + 0.5) * S))
            if f <= 0: vox[(i, h, k)] = part

for ex, ey, ez in EYES:                   # the eyes: the outermost cell of the head at each eye
    near = [(i, h, k) for (i, h, k), p in vox.items() if p == 'head' and abs((h + 0.5) * P - ey) < 8 and abs((k + 0.5) * S - ez) < 12
            and (i + 0.5) * ex > 0]
    if near: vox[max(near, key=lambda c: abs(c[0] + 0.5))] = 'eye'

# the hold: inside the barrel, a stud and three plates in from its skin, above a flat deck
DECK_H = 44                               # the deck's studs are at the top of this plate layer (Y0 + 360)
HOLD = set()
inner = {(i, h, k) for (i, h, k) in vox if h > DECK_H and ell(((i + 0.5) * S, (h + 0.5) * P, (k + 0.5) * S), BARREL[0],
                                                                  (BARREL[1][0] - 26, BARREL[1][1] - 26, BARREL[1][2] - 34)) < 0}
for (i, k) in {(i, k) for (i, h, k) in inner}:      # straight walls: each column hollow from the deck up to the roof
    top = max(h for (ii, h, kk) in inner if (ii, kk) == (i, k))
    for h in range(DECK_H + 1, top + 1):
        if (i, h, k) in vox: HOLD.add((i, h, k)); del vox[(i, h, k)]
DECK = {(i, k) for (i, h, k) in HOLD if h == DECK_H + 1 and (i, DECK_H, k) in vox}
# the flank panel that lifts off: the right side of the hull over the hold, 17 plates high and 14 studs long
HATCH = {(i, h, k) for (i, h, k) in vox if i >= 0 and DECK_H + 1 <= h <= DECK_H + 17 and -7 <= k < 7}


def colour(i, h, k, part):
    if part in ('mane', 'tail', 'hooves'): return DB
    if part == 'ears': return RB
    if part == 'eye': return BLK
    if part == 'post': return DB
    return RB


# ── laying the parts ──
rows = []


def line(col, x, yup, z, part, rot=0, m=None, root=False):
    if m is None:
        c, s = round(math.cos(rot), 6), round(math.sin(rot), 6)
        m = (c, 0, s, 0, 1, 0, -s, 0, c)
    if root: rows.append('0 !FORAGE ROOT')
    rows.append(f"1 {col} {x:g} {-yup:g} {z:g} " + ' '.join(f'{v:g}' for v in m) + f" {part}.dat")


def pack(cells, yup_top, colour_of, along_z, sizes):
    """fill one layer: the longest part that fits and is all one colour, laid along z or along x (LDraw's parts run along x)"""
    left = set(cells)
    for c in sorted(left, key=lambda c: (c[1], c[0]) if along_z else (c[0], c[1])):
        if c not in left: continue
        i0, k0 = c
        col = colour_of(i0, k0)
        for (w, l), part in sizes:
            cov = [(i0 + a, k0 + b) if along_z else (i0 + b, k0 + a) for a in range(w) for b in range(l)]
            if all(q in left and colour_of(*q) == col for q in cov):
                for q in cov: left.discard(q)
                cx = (i0 + (w if along_z else l) / 2) * S
                cz = (k0 + (l if along_z else w) / 2) * S
                line(col, cx, yup_top, cz, part, rot=math.pi / 2 if along_z and (w, l) != (1, 1) and w != l else 0)
                break


def build(open_hatch):
    rows.clear()
    cells = {v: p for v, p in vox.items() if not (open_hatch and v in HATCH)}
    # a tile finishes every cell with nothing above it in the whole horse (panel on), except the deck, which keeps its studs
    tile = {v for v in vox if (v[0], v[1] + 1, v[2]) not in vox and not (v[1] == DECK_H and (v[0], v[2]) in DECK)}
    col = {v: colour(*v, p) for v, p in cells.items()}
    in_brick = set()
    for c in range(0, max(H) // 3 + 1):
        hs = (3 * c, 3 * c + 1, 3 * c + 2)
        full = {(i, k) for (i, h, k) in cells if h == hs[0]
                and all((i, hh, k) in cells and (i, hh, k) not in tile and col[(i, hh, k)] == col[(i, hs[0], k)] for hh in hs)}
        pack(full, Y0 + (3 * c + 3) * P, lambda i, k: col[(i, hs[0], k)], c % 2 == 0, BRICKS)
        in_brick |= {(i, hh, k) for (i, k) in full for hh in hs}
    for h in H:
        plates = {(i, k) for (i, hh, k) in cells if hh == h and (i, hh, k) not in in_brick and (i, hh, k) not in tile}
        tiles = {(i, k) for (i, hh, k) in cells if hh == h and (i, hh, k) in tile}
        pack(plates, Y0 + (h + 1) * P, lambda i, k: col[(i, h, k)], h % 2 == 1, PLATES)
        pack(tiles, Y0 + (h + 1) * P, lambda i, k: col[(i, h, k)], h % 2 == 1, TILES)
    return list(rows)


def cart():
    """a timber cart of three layers laid crosswise; wheels on pinned plates at its corners; it rolls"""
    rows.clear()
    I0, I1, K0, K1 = -7, 7, -18, 24
    corners = {(sx, kz) for sx in (-1, 1) for kz in (K0 + 1, K1 - 3)}
    wheel_cells = set()
    for sx, kz in corners:
        i0 = 5 if sx > 0 else -7
        wheel_cells |= {(i0 + a, kz + b) for a in (0, 1) for b in (0, 1)}
        cx, cz = (i0 + 1) * S, (kz + 1) * S
        line(DBG, cx, WHEEL_UP, cz, '4600', root=True)
        wx = cx + sx * 28
        for part, colr in (('4624', 71), ('3641', 0)):
            line(colr, wx, WHEEL_UP - 6, cz, part, m=(0, 0, sx, 0, 1, 0, -sx, 0, 0))
    lower = {(i, k) for i in range(I0, I1) for k in range(K0, K1)} - wheel_cells
    pack(lower, WHEEL_UP, lambda i, k: DB, False, PLATES)
    # the bricks in running bond: 2 x 4 along the cart, every other pair of columns started two studs on
    for i in range(I0, I1, 2):
        k = K0
        if (i // 2) % 2: line(DB, (i + 1) * S, CART_UP, (k + 1) * S, '3003'); k += 2
        while k + 4 <= K1: line(DB, (i + 1) * S, CART_UP, (k + 2) * S, '3001', rot=math.pi / 2); k += 4
        if k < K1: line(DB, (i + 1) * S, CART_UP, (k + 1) * S, '3003')
    # the deck: planks across the cart, their joints staggered row by row
    for k in range(K0, K1):
        i, col = I0, RB if k % 3 else DB
        for n in ((6, 8) if k % 2 else (8, 6)):
            line(col, (i + n / 2) * S, Y0, (k + 0.5) * S, {8: '3460', 6: '3666'}[n]); i += n
    return list(rows)


def base():
    """the display base: a frame of dark grey bricks paved with tan and dark tan tiles, wide on the horse's right for the figures,
    and a nameplate of black tiles along the front edge"""
    rows.clear()
    I0, I1, K0, K1 = -12, 22, -26, 26
    for i in range(I0, I1, 2):
        for k in range(K0, K1, 4):
            line(DBG, (i + 1) * S, BASE_UP - P, (k + 2) * S, '3001', rot=math.pi / 2)
    for i in range(I0, I1, 2):
        for k in range(K0, K1, 2):
            if i == I1 - 6 and -8 <= k < 8: continue
            edge = i in (I0, I1 - 2) or k in (K0, K1 - 2)
            line(DBG if edge else (TAN if (i * 7 + k * 13) % 10 < 3 else DT), (i + 1) * S, BASE_UP, (k + 1) * S, '3068b')
    for k in range(-8, 8, 4):
        line(BLK, (I1 - 5) * S, BASE_UP, (k + 2) * S, '87079', rot=math.pi / 2)
    return list(rows)


# ── the figures ──
def figure_file(card, sub):
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    for bl in re.split(r'(?m)^0 FILE ', text):
        if bl.startswith(f'{card} - {sub}.ldr'): return [l for l in bl.splitlines() if l.startswith('1 ')]
    return []


def minifig(card, sub, x, yup, z, rot, drop=()):
    body = [l for l in figure_file(card, sub) if l.split()[-1].replace('.dat', '') not in drop]
    hip = next((l.split() for l in body if re.search(r' 3815\w*\.dat$', l)), None)
    fx, fy, fz = (-float(hip[2]), -(float(hip[3]) + 40), -float(hip[4])) if hip else (20, 8, -10)   # the feet 40 under the hips
    out, c, s = [], math.cos(rot), math.sin(rot)
    R = (c, 0, s, 0, 1, 0, -s, 0, c)
    for l in body:
        t = l.split()
        px, py, pz = float(t[2]) + fx, float(t[3]) + fy, float(t[4]) + fz
        m = [float(v) for v in t[5:14]]
        mm = [sum(R[r * 3 + q] * m[q * 3 + cc] for q in range(3)) for r in range(3) for cc in range(3)]
        out.append(f"1 {t[1]} {x + c * px + s * pz:g} {-yup + py:g} {z - s * px + c * pz:g} " + ' '.join(f'{v:g}' for v in mm) + ' ' + ' '.join(t[14:]))
    return out


def hold_spots(n):
    """places on the deck for the Greeks: a stud clear of the hull and the posts on every side, near the hatch, spread along it"""
    ok = [(i, k) for (i, k) in DECK if all((i + a, k + b) in DECK and (i + a, DECK_H + 1, k + b) not in vox
                                            for a in (-1, 0, 1) for b in (-1, 0, 1)) and -9 <= k < 9]
    ok.sort(key=lambda c: (-c[0], c[1]))
    spots = []
    for c in ok:
        if all(abs(c[1] - s[1]) >= 3 or abs(c[0] - s[0]) >= 3 for s in spots): spots.append(c)
        if len(spots) == n: break
    return sorted(spots, key=lambda c: c[1])


def write(name, title, open_hatch):
    horse = build(open_hatch)
    body = [f'0 FILE {name}.ldr', f'0 {title}', f'0 Name: {name}.ldr', '0 Author: word to world, tools/forage/product/woodenhorse.py',
            '0 !LDRAW_ORG Unofficial_Model', '']
    body += base() + cart() + horse
    return body


def figures(open_hatch):
    out = []
    hold_up = Y0 + (DECK_H + 1) * P
    greeks = ['warrior-1', 'warrior-3', 'warrior-4', 'warrior-5'] + ([] if open_hatch else ['warrior-2'])
    for sub, (i, k) in zip(greeks, hold_spots(len(greeks))):          # the Greeks on the deck of the hold, facing the hatch
        out += minifig('ensemble.hidden-greek-warriors', sub, (i + 0.5) * S, hold_up, (k + 0.5) * S, -math.pi / 2,
                       drop=('43899', '4497', '3849', '93789'))       # no room for spears under the roof
    if open_hatch:                                                    # the first man down, on the cart, looking back up at the horse
        out += minifig('ensemble.hidden-greek-warriors', 'warrior-2', 120, Y0, 290, math.pi)
    front = [('character.demodocus', 'demodocus'), ('character.athena', 'athena'), ('character.odysseus', 'odysseus'),
             ('character.menelaus', 'menelaus'), ('character.helen-at-the-horse', 'helen-at-the-horse')]
    for n, (card, sub) in enumerate(front):                           # the lineup on the apron, facing out of the display
        out += minifig(card, sub, 12 * S, BASE_UP, (n - (len(front) - 1) / 2) * 4 * S, -math.pi / 2)
    return out


def save(name, title, open_hatch):
    body = write(name, title, open_hatch) + figures(open_hatch)
    open(os.path.join(CARDS, name + '.mpd'), 'w').write('\n'.join(body) + '\n')
    return body


def settle(name, title, open_hatch):
    """build and check; a part that clicks to nothing is propped (a post up from the deck under the roof), lifted off with the panel
    (the lintel over the hatch), thickened (a step of a staircase that met the one below only at an edge grows a plate down into it),
    or, when nothing is near it, taken away. Again, until everything holds"""
    for _ in range(60):
        save(name, title, open_hatch)
        loose = clicks.parts_loose(os.path.join(CARDS, name + '.mpd'))
        n = 0
        for p in loose:
            h = round((-p['bot'] - Y0) / P)                 # the plate layer the loose part's bottom rests on
            for (i, k) in p['fp']:
                if (i, h - 1, k) in HOLD:
                    for hh in range(DECK_H + 1, h):
                        if (i, hh, k) in HOLD: HOLD.discard((i, hh, k)); vox[(i, hh, k)] = 'post'; n += 1
                    DECK.discard((i, k))
                elif open_hatch and (i, h - 1, k) in HATCH:
                    for hh in range(h, h + 3):
                        if (i, hh, k) in vox and (i, hh, k) not in HATCH: HATCH.add((i, hh, k)); n += 1
                elif (i, h, k) in vox and (i, h - 1, k) not in vox and h > 0 and any(
                        (i + a, h - 1, k + b) in vox for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    vox[(i, h - 1, k)] = vox[(i, h, k)]; n += 1        # a step that only touches at an edge: grow a plate into it
                else:
                    for hh in range(h, h + 3):
                        if (i, hh, k) in vox and not (open_hatch and (i, hh, k) in HATCH): del vox[(i, hh, k)]; n += 1
        if not n: return loose


def export_prop():
    """the horse on its cart, without the display base or the figures, as a keyframe prop (tools/forage/keyprops.js reads it): parts in
    LDraw units with the ground (the paving the cart rolls on) at y = 0, and anchors a still can aim at or seat a figure on"""
    out = {}
    for key, o in (('horse', False), ('horseOpen', True)):
        rows_ = cart() + build(o)
        parts = []
        for l in rows_:
            if not l.startswith('1 '): continue
            t = l.split()
            m = [float(v) for v in t[2:14]]
            m[1] += BASE_UP
            parts.append({'part': t[14], 'color': int(t[1]), 'm': [round(v, 4) for v in m]})
        deck = sorted(DECK)
        cx = sum((i + 0.5) * S for i, k in deck) / len(deck); cz = sum((k + 0.5) * S for i, k in deck) / len(deck)
        floor = -(Y0 + (DECK_H + 1) * P - BASE_UP)
        out[key] = {'parts': parts, 'anchors': {
            'floor': [round(cx), floor, round(cz)], 'front': [round(cx), floor, round(cz) + 60], 'back': [round(cx), floor, round(cz) - 60],
            'hatch': [110, floor - 60, 0], 'head': [0, -(Y0 + 720 - BASE_UP), 360], 'deck': [0, -(Y0 - BASE_UP), 0],
            'muzzle': [0, -(Y0 + 600 - BASE_UP), 440], 'tail': [0, -(Y0 + 400 - BASE_UP), -300]}}
    import json
    json.dump(out, open(os.path.join(ROOT, 'odyssey/keyframes/wooden-horse-prop.json'), 'w'))


if __name__ == '__main__':
    for _ in range(8):                    # the two builds share one horse: settle each until neither has a loose part
        a = settle('set.wooden-horse', 'The Wooden Horse', False)
        b = settle('set.wooden-horse-open', 'The Wooden Horse (panel off)', True)
        if not clicks.parts_loose(os.path.join(CARDS, 'set.wooden-horse.mpd')) and not b: break
    for name, title, o in (('set.wooden-horse', 'The Wooden Horse', False), ('set.wooden-horse-open', 'The Wooden Horse (panel off)', True)):
        body = save(name, title, o)
        print(name, sum(l.startswith('1 ') for l in body), 'pieces')
    export_prop()
