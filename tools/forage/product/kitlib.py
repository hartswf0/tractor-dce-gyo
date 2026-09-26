#!/usr/bin/env python3
"""tools/forage/product/kitlib.py — what every kit of the Odyssey line is built with, so each kit's script is only its story.

    import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))    (from tools/forage/product/kits/<kit>.py: '..')
    from kitlib import *

Coordinates are LDraw units (LDU): x across, z toward the viewer (+z is the front of a kit), y DOWN in the file. Every helper here takes
heights as `yup`, LDU UP from the table (the underside of the baseplate is 0; a baseplate's top is 4). A stud is 20, a plate 8, a brick
24. A part of odd width has its centre on an odd multiple of 10, of even width on a multiple of 20, or it will not sit on the studs.

  put(col, x, yup, z, part, m)   a part with its ORIGIN at yup (most parts' origin is their top face: a brick at yup=28 spans 4..28)
  on(col, x, yup, z, part, rot)  a part STANDING on the surface at yup (measures the part, so slopes and odd origins come out right)
  prop(name, x, yup, z, m)       a prop from odyssey/keyframes/props.json (stake, bowl, loomFull, raft, argos, basin, bow...)
  seated(name, x, yup, z)        a prop set down so its lowest part rests exactly on yup
  figure(card, sub, x, yup, z, rot)  a minifigure from a card (character.penelope / penelope; ensemble.hidden-greek-warriors / warrior-1);
                                 it faces -z at rot 0, +z at rot pi, +x at rot -pi/2
  frame(x0, z0, w, d, yup)       the line's display base finish: a ring of white tiles, the nameplate of black tiles and gold studs at
                                 the front, one blue tile; returns (rows, cells it covers)
  write(name, title, rows)       odyssey/cards/<name>.mpd; returns the piece count
  check(name)                    (parts on the grid, parts not clicked, pairs of parts in the same space): both must be 0
  manifest(slug, **data)         odyssey/kits/<slug>/kit.json, from which the kit's page and the line's hub are made

Render a card (the server: (setsid nohup python3 -m http.server 8899 --directory <repo> > /dev/null 2>&1 &)):
  NODE_PATH=<scratchpad>/nm/node_modules node tools/forage/look.js --out <dir> --w 1600 --h 1100 --jpeg --studio dark \\
      --az 200 --el 24 --zoom 1.3 [--at x,y,z] <card id without .mpd>
"""
import json, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import clicks, ldbox
from sculpt import Form, ell, cone, seg, smin, rough, S, P, B

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CARDS = os.path.join(ROOT, 'odyssey/cards')
KITS = os.path.join(ROOT, 'odyssey/kits')
PROPS = json.load(open(os.path.join(ROOT, 'odyssey/keyframes/props.json')))

# LDraw colours
BLK, BLUE, GREEN, RED, BROWN, LGRAY, DGRAY, WHITE, TAN, DTAN, YELLOW, ORANGE = 0, 1, 2, 4, 6, 7, 8, 15, 19, 28, 14, 25
RB, LBG, DBG, MBLUE, DB, DGREEN, DRED, GOLD, OLIVE, SANDGREEN, SANDBLUE, DBLUE = 70, 71, 72, 73, 308, 288, 320, 297, 330, 378, 379, 272
NOUGAT, MNOUGAT, DORANGE, LIME, BLORANGE, MLAV, DPURPLE, DTURQ = 92, 84, 484, 27, 191, 324, 85, 3
TCLEAR, TLBLUE, TDBLUE, TORANGE, TRED, TYELLOW, TGREEN, TPURPLE = 47, 43, 33, 57, 36, 46, 34, 52


def mat_mul(a, b):   # 12-element LDraw matrices [x y z a b c d e f g h i]
    A = [[a[3], a[4], a[5]], [a[6], a[7], a[8]], [a[9], a[10], a[11]]]; Bm = [[b[3], b[4], b[5]], [b[6], b[7], b[8]], [b[9], b[10], b[11]]]
    R = [[sum(A[r][q] * Bm[q][c] for q in range(3)) for c in range(3)] for r in range(3)]
    t = [a[r] + sum(A[r][q] * b[q] for q in range(3)) for r in range(3)]
    return t + [R[0][0], R[0][1], R[0][2], R[1][0], R[1][1], R[1][2], R[2][0], R[2][1], R[2][2]]


def T(x, y, z): return [x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1]
def RY(a): c, s = math.cos(a), math.sin(a); return [0, 0, 0, c, 0, s, 0, 1, 0, -s, 0, c]
def RX(a): c, s = math.cos(a), math.sin(a); return [0, 0, 0, 1, 0, 0, 0, c, -s, 0, s, c]
def RZ(a): c, s = math.cos(a), math.sin(a); return [0, 0, 0, c, -s, 0, s, c, 0, 0, 0, 1]


def row(col, m, part):
    return f"1 {col} " + ' '.join(f'{v:.3f}'.rstrip('0').rstrip('.') for v in m) + f" {part if part.endswith('.dat') else part + '.dat'}"


def put(col, x, yup, z, part, m=None):
    return row(col, mat_mul(T(x, -yup, z), m or T(0, 0, 0)), part)


def on(col, x, yup, z, part, rot=0):
    b = ldbox.box(part, False)
    return put(col, x, yup + b[1][1], z, part, RY(rot))


def prop(name, x, yup, z, m=None):
    base = mat_mul(T(x, -yup, z), m or T(0, 0, 0))
    return [row(p['color'], mat_mul(base, p['m']), p['part']) for p in PROPS[name]['parts']]


def seated(name, x, yup, z, m=None):
    low = max(p['m'][1] + (ldbox.box(p['part'], False) or ((0, 0, 0), (0, 0, 0)))[1][1] for p in PROPS[name]['parts'])
    return prop(name, x, yup + low, z, m)


def figure(card, sub, x, yup, z, rot=0, drop=(), m=None):
    text = open(os.path.join(CARDS, card + '.mpd')).read()
    bl = next((b for b in re.split(r'(?m)^0 FILE ', text) if b.startswith(f'{card} - {sub}.ldr')), '')
    body = [l.split() for l in bl.splitlines() if l.startswith('1 ') and l.split()[-1].replace('.dat', '') not in drop]
    if not body: raise ValueError(f'no figure {sub} in {card}')
    hip = next((t for t in body if re.match(r'3815', t[14])), None)
    fx, fy, fz = (-float(hip[2]), -(float(hip[3]) + 40), -float(hip[4])) if hip else (0, 0, 0)
    base = mat_mul(mat_mul(T(x, -yup, z), m or RY(rot)), T(fx, fy, fz))
    return [row(int(t[1]), mat_mul(base, [float(v) for v in t[2:14]]), t[14]) for t in body]


def root(rows):
    """mark an assembly that rests on tiles or is otherwise held by more than studs (a boat afloat, a cart on its wheels) as its own root"""
    return [l for r in rows for l in (('0 !FORAGE ROOT', r) if r.startswith('1 ') else (r,))]


TILE_RUN = [(6, '6636'), (4, '2431'), (3, '63864'), (2, '3069b'), (1, '3070b')]


def tile_run(col, x0, z0, n, yup, along_x=True):
    """a row of 1 x n tiles from the stud whose corner is (x0, z0), on a studded surface at yup; greedy longest tiles first"""
    out, k = [], 0
    while k < n:
        L, part = next((L, p) for L, p in TILE_RUN if L <= n - k)
        if along_x: out.append(put(col, x0 + (k + L / 2) * S, yup + P, z0 + S / 2, part))
        else: out.append(put(col, x0 + S / 2, yup + P, z0 + (k + L / 2) * S, part, RY(math.pi / 2)))
        k += L
    return out


def frame(x0, z0, w, d, yup=4, plate=12):
    """the line's display finish on a studded base (a baseplate's top is yup 4) whose back-left stud corner is (x0, z0), w studs across
    and d deep: a ring of white tiles round the edge; at the front, centred, the nameplate (black tiles, `plate` studs, a gold round tile
    at each end); a single blue tile at the front right corner. Returns (rows, cells) — cells the (i, k) stud squares it covers."""
    rows, cells = [], set()
    i0, k0 = round(x0 / S), round(z0 / S)
    front = k0 + d - 1
    pl0 = i0 + (w - plate) // 2
    ring = [(i, k0) for i in range(i0, i0 + w)] + [(i, front) for i in range(i0, i0 + w)] + \
           [(i0, k) for k in range(k0 + 1, front)] + [(i0 + w - 1, k) for k in range(k0 + 1, front)]
    special = {(i, front) for i in range(pl0 - 1, pl0 + plate + 1)} | {(i0 + w - 1, front)}
    # the plate
    rows += tile_run(BLK, pl0 * S, front * S, plate, yup)
    rows += [put(GOLD, (pl0 - 0.5) * S, yup + P, (front + 0.5) * S, '98138'), put(GOLD, (pl0 + plate + 0.5) * S, yup + P, (front + 0.5) * S, '98138')]
    rows.append(put(BLUE, (i0 + w - 0.5) * S, yup + P, (front + 0.5) * S, '3070b'))
    # the white ring in runs
    runs = [(i0, k0, w, True), (i0, front, pl0 - 1 - i0, True), (pl0 + plate + 1, front, i0 + w - 1 - (pl0 + plate + 1), True),
            (i0, k0 + 1, d - 2, False), (i0 + w - 1, k0 + 1, d - 2, False)]
    for i, k, n, ax in runs:
        if n > 0: rows += tile_run(WHITE, i * S, k * S, n, yup, ax)
    cells = set(ring) | special
    return rows, cells


def write(name, title, rows, author='tools/forage/product/kitlib.py'):
    head = [f'0 FILE {name}.ldr', f'0 {title}', f'0 Name: {name}.ldr', f'0 Author: word to world, {author}', '0 !LDRAW_ORG Unofficial_Model', '']
    open(os.path.join(CARDS, name + '.mpd'), 'w').write('\n'.join(head + list(rows)) + '\n')
    return sum(r.startswith('1 ') for r in rows)


def check(name, show=10):
    P_ = clicks.parts(os.path.join(CARDS, name + '.mpd'))
    L, O = clicks.loose(P_), clicks.overlaps(P_)
    for p in L[:show]: print('   loose:', p['line'])
    for a, b in O[:show]: print('   clash:', a['line'], ' <> ', b['line'])
    print(f'{name}: {len(P_)} parts on the grid, {len(L)} not clicked, {len(O)} pairs in the same space')
    return len(P_), len(L), len(O)


def pieces(name):
    return sum(1 for l in open(os.path.join(CARDS, name + '.mpd')) if l.startswith('1 '))


def manifest(slug, **data):
    """the kit's record: title, book, tier, moment, quote, object, pieces, builds [{card, title}], images [{file, caption, alt}],
    features [str], subs [{file, title, pieces, text}], sources [halfworld paths], status, next [str]. Pieces and checks are measured."""
    os.makedirs(os.path.join(KITS, slug), exist_ok=True)
    for b in data.get('builds', []):
        b['pieces'] = pieces(b['card'])
        _, l, o = check(b['card'], show=0)
        b['loose'], b['clash'] = l, o
    data['slug'] = slug
    json.dump(data, open(os.path.join(KITS, slug, 'kit.json'), 'w'), indent=1)
    return data
