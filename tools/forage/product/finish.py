#!/usr/bin/env python3
"""tools/forage/product/finish.py — the finishing pass of the film's sets: the scene sets brought to the surface standard of the kits.

The forage's scene sets (tools/forage/sets.js, laid out by tools/odyssey-forage.js) are built of plates and bricks and stop there: floors,
courts, ground and wall tops are fields of bare studs, walls are one colour. The kits (tools/forage/product/kits/*.py) are finished. This
pass does for every scene set what a kit builder does by hand, as a post-pass, so a rebuild of a scene card keeps it:

  every exposed stud on a flat top (a floor, the ground, a court, a wall top, a step, a table) is covered with a tile, except where
  something stands on it (a figure's feet, furniture, a hull, a plant): a stud is exposed when nothing (the set, the cast) fills the
  space a tile would take over it. The tiles are laid by material, from the colour of the stud and the set's profile:
      paving   mixed 2 x 4, 2 x 2 and 1 x 2 tiles in two or three close colours (the kits' floors)
      painted  the megaron floor painted in squares four studs across, a pinwheel of 1 x 3 tiles round a 2 x 2 accent (Pylos)
      turf / meadow / earth / sand / rock   the landscape library's finished ground (tools/forage/product/landscape.py ground()):
               tiles in patches of close colours, turf and meadow dressed with tufts, leaves and flowers on studs kept for them
      sea      blue, medium blue, clear and light blue tiles in patches (the Sirens kit's sea)
      planks   reddish brown and dark brown tiles along the grain (tables, benches, timber)
      same     tiles of the stud's own colour (furniture tops, bands, anything else); a 1 x 1 round stud takes a round tile
  walls one stud thick of 1 x N bricks in stone colours become embossed masonry (98283, 15533) breaking joint where they were; the plain
  walls of the simple builders (walls(), frontWall() in sets.js) also get a dado course, a string course and patches of a close tone.
  exterior sets that are bare get shrubs from the landscape library on free ground at their edges, clear of the cast.

Called by tools/forage/finish.js (from tools/odyssey-forage.js) with JSON on stdin: {profile, seed, kids: [{name, rows}], cast: [rows]}
(rows {part, col, m} in the scene's frame, LDraw y down) and answers {kids: [{add: [lines], drop: [index]}], stats}.

  python3 tools/forage/product/finish.py --check odyssey/cards/OD-B21-S07.mpd [...]
      flattens each scene card and runs the click checker (clicks.py) on it: the whole card, and the parts this pass added
"""
import functools, json, math, os, random, re, sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ldbox
import landscape as LS
from kitlib import put, on, row, RY

S = 20
STUD_RE = re.compile(r'^(stud|stud2|stud2a|stud6|stud6a|stud10|stud13|stud15|stud17a|stud-logo\d*|stud2-logo\d*|studa|studel|studline)\.dat$')
BLUE, MBLUE, TLBLUE, TCLEAR, DBLUE, TDBLUE = 1, 73, 43, 47, 272, 33
TAN, DTAN, LBG, DBG, WHITE, RB, DBROWN, DRED, GOLD, AZURE, BLORANGE = 19, 28, 71, 72, 15, 70, 308, 320, 297, 322, 191
GREENS = {2, 10, 288, 330, 378, 326, 27, 35}
SEAS = {1, 73, 272, 33, 43, 9, 41, 212, 321}
PAVE = {DTAN: [(DTAN, 6), (TAN, 3), (LBG, 1)], TAN: [(TAN, 6), (DTAN, 2), (LBG, 1)], LBG: [(LBG, 5), (DBG, 1), (TAN, 1)],
        DBG: [(DBG, 5), (LBG, 2)], WHITE: [(WHITE, 6), (LBG, 1), (TAN, 1)], 7: [(LBG, 5), (DBG, 1)], 8: [(DBG, 5), (LBG, 2)]}
TONE = {TAN: DTAN, DTAN: TAN, LBG: DBG, DBG: LBG, WHITE: WHITE}
WALLCOLS = {TAN, DTAN, LBG, DBG, WHITE, 7, 8}
MASON = {'3004': [('98283', 2)], '3010': [('15533', 4)], '3008': [('15533', 4), ('15533', 4)], '3009': [('15533', 4), ('98283', 2)],
         '3622': [('98283', 2), ('3005', 1)]}
SKIP_DESC = re.compile(r'Minifig|Animal|Plant|Flower|Leaves|Tree|Rock|Wheel|Technic|Hinge|Panel|Door|Window|Fence|Bar |Bar$|Slope|Wedge|'
                       r'Cone|Dish|Tile|Boat|Hull|Sail|Mast|Ladder|Cylinder|Container|Train|Bracket|Turntable|Jumper|Modified|Grille|'
                       r'Hose|String|Chain|Vine|Stem|Seaweed|Bone|Horse|Brick Curved|Arch 1 x 3|Macaroni|Corner|Wall', re.I)
VEHICLE = re.compile(r'ship|raft|galley|boat|hull|wreck', re.I)
PLAIN_WALLS = re.compile(r'^(walls|the threshold wall)$')


def _h(*a): return LS._h(*a)


def pick(pal, v):
    tot = sum(w for _, w in pal); acc = 0
    for c, w in pal:
        acc += w / tot
        if v < acc: return c
    return pal[-1][0]


@functools.lru_cache(maxsize=None)
def desc(pid):
    f = ldbox.find(pid + '.dat')
    if not f: return ''
    return open(f, errors='ignore').readline()[2:].strip()


@functools.lru_cache(maxsize=None)
def studs_in(name):
    """the studs of a file in its own frame: (x, y, z, (vx, vy, vz) the stud's axis, colour 16 = inherited)"""
    f = ldbox.find(name)
    if not f: return ()
    out = []
    for l in open(f, errors='ignore'):
        t = l.split()
        if len(t) < 15 or t[0] != '1': continue
        col = int(t[1]) if t[1].isdigit() else 16
        x, y, z = map(float, t[2:5]); m = list(map(float, t[5:14]))
        sub = ' '.join(t[14:]).lower().replace('\\', '/')
        base = os.path.basename(sub)
        if STUD_RE.match(base):
            out.append((x, y, z, (m[1], m[4], m[7]), col)); continue
        if base.startswith('stud3') or base.startswith('stud4') or base.startswith('box') or base.startswith('rect') or \
                base.startswith('edge') or base.startswith('cyl') or base.startswith('disc') or base.startswith('ndis') or \
                base.startswith('ring') or base.startswith('con') or base.startswith('tri') or base.startswith('4-4') or \
                base.startswith('1-4') or base.startswith('2-4') or base.startswith('3-4') or base.startswith('1-8'): continue
        for sx, sy, sz, v, sc in studs_in(sub):
            px = x + m[0] * sx + m[1] * sy + m[2] * sz; py = y + m[3] * sx + m[4] * sy + m[5] * sz; pz = z + m[6] * sx + m[7] * sy + m[8] * sz
            vv = (m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2])
            out.append((px, py, pz, vv, col if sc == 16 else sc))
    return tuple(out)


def aabb(part, m):
    b = LS.BODY.get(part) or ldbox.box(part, False)
    if not b: return None
    lo, hi = b
    xs, ys, zs = [], [], []
    for a in (lo[0], hi[0]):
        for c in (lo[1], hi[1]):
            for e in (lo[2], hi[2]):
                xs.append(m[0] + m[3] * a + m[4] * c + m[5] * e); ys.append(m[1] + m[6] * a + m[7] * c + m[8] * e); zs.append(m[2] + m[9] * a + m[10] * c + m[11] * e)
    return (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))


class Index:
    """the boxes of everything placed, by the 20 LDU squares they cover"""
    def __init__(self): self.g = defaultdict(list)

    def add(self, b):
        for i in range(math.floor(b[0] / S), math.floor(b[1] / S) + 1):
            for k in range(math.floor(b[4] / S), math.floor(b[5] / S) + 1): self.g[(i, k)].append(b)

    def hits(self, q):
        seen = set()
        for i in range(math.floor(q[0] / S), math.floor(q[1] / S) + 1):
            for k in range(math.floor(q[4] / S), math.floor(q[5] / S) + 1):
                for b in self.g.get((i, k), ()):
                    if id(b) in seen: continue
                    seen.add(id(b))
                    if b[0] < q[1] and q[0] < b[1] and b[2] < q[3] and q[2] < b[3] and b[4] < q[5] and q[4] < b[5]: return True
        return False


def parse_line(l):
    t = l.split()
    return {'part': t[14].lower().replace('.dat', ''), 'col': int(t[1]), 'm': [float(v) for v in t[2:14]]}


def shift_lines(lines, dx, dz):
    out = []
    for l in lines:
        if not l.startswith('1 '): continue
        r = parse_line(l); m = r['m']; m[0] += dx; m[2] += dz
        out.append(row(r['col'], m, r['part']))
    return out


# ── the tilers: each takes cells {(i, k)} on one surface (yup) in landscape's square frame and returns LDraw lines ──
def pave(cells, yup, pal, seed):
    out, left = [], set(cells)
    for (k, i) in sorted((k, i) for i, k in cells):
        if (i, k) not in left: continue
        r = _h(i, k, seed, 17)
        opts = ([(4, 2), (2, 4)] if r < .22 else []) + ([(2, 2)] if r < .75 else []) + ([(2, 1), (1, 2)] if (i + k) % 2 else [(1, 2), (2, 1)]) + [(2, 2), (1, 1)]
        for w, d in opts:
            cs = [(i + a, k + b) for a in range(w) for b in range(d)]
            if all(c in left for c in cs):
                left.difference_update(cs)
                out.append(LS.block(pick(pal, _h(i, k, seed, 19)), 'tile', i, k, w, d, yup)); break
    return out


def planks(cells, yup, seed, pal=((RB, 5), (DBROWN, 2))):
    out, left = [], set(cells)
    for (k, i) in sorted((k, i) for i, k in cells):
        if (i, k) not in left: continue
        for w in (4, 3, 2, 1):
            cs = [(i + a, k) for a in range(w)]
            if all(c in left for c in cs):
                left.difference_update(cs)
                out.append(LS.block(pick(list(pal), _h(i, k, seed, 23)), 'tile', i, k, w, 1, yup)); break
    return out


def sea(cells, yup, seed, dark=False, shallow=()):
    def col(i, k):
        if (i, k) in shallow: return TLBLUE if (i * 3 + k) % 4 else TCLEAR
        n = (i // 2 * 7 + k // 2 * 5 + (i // 4) * (k // 4) + seed) % 11
        if dark: return TDBLUE if n in (0, 5) else BLUE if n in (2, 9) else DBLUE
        return TLBLUE if n in (0, 5) else TCLEAR if n == 8 else MBLUE if n in (2, 9) else BLUE
    return LS.lay({c: col(*c) for c in cells}, yup, 'tile', [(2, 2), (2, 1), (1, 2), (1, 1)])


def same(cells, yup, col):
    return LS.lay({c: col for c in cells}, yup, 'tile', [(2, 4), (4, 2), (2, 2), (2, 1), (1, 2), (1, 1)])


ACCENT = [DRED, AZURE, WHITE, DTAN, DRED, BLORANGE, AZURE]


def painted(cells, yup, seed):
    """squares four studs across in tan and dark tan; a square whole is a pinwheel of four 1 x 3 tiles round a 2 x 2 accent"""
    out, done = [], set()
    ii = [i for i, _ in cells]; kk = [k for _, k in cells]
    X0, Z0 = min(ii), min(kk)
    for a in range((max(ii) - X0 + 1) // 4 + 1):
        for b in range((max(kk) - Z0 + 1) // 4 + 1):
            i0, k0 = X0 + 4 * a, Z0 + 4 * b
            sq = {(i, k) for i in range(i0, i0 + 4) for k in range(k0, k0 + 4)}
            if not sq <= cells: continue
            base = TAN if (a + b) % 2 else DTAN
            acc = ACCENT[(a * 3 + b * 5 + seed) % len(ACCENT)]
            y = yup + 8
            out += [put(base, (i0 + 1.5) * S, y, (k0 + 0.5) * S, '63864'), put(base, (i0 + 2.5) * S, y, (k0 + 3.5) * S, '63864'),
                    put(base, (i0 + 0.5) * S, y, (k0 + 2.5) * S, '63864', RY(math.pi / 2)), put(base, (i0 + 3.5) * S, y, (k0 + 1.5) * S, '63864', RY(math.pi / 2)),
                    put(acc, (i0 + 2) * S, y, (k0 + 2) * S, '3068b')]
            done |= sq
    rest = {c: (TAN if ((c[0] - X0) // 4 + (c[1] - Z0) // 4) % 2 else DTAN) for c in cells - done}
    return out + LS.lay(rest, yup, 'tile', [(2, 2), (2, 1), (1, 2), (1, 1)])


# ── the pass ──
def finish(data):
    prof = data.get('profile') or {}
    seed = int(data.get('seed', 0))
    kids = data['kids']; cast = data.get('cast', [])
    idx = Index()
    allrows = []                                          # (kid, n, row, box)
    for ki, kid in enumerate(kids):
        for n, r in enumerate(kid['rows']):
            b = aabb(r['part'], r['m'])
            allrows.append((ki, n, r, b))
            if b: idx.add(b)
    for r in cast:
        b = aabb(r['part'], r['m'])
        if b: idx.add(b)
    stats = defaultdict(int)
    out = [{'add': [], 'drop': []} for _ in kids]

    # the walls: 1 x N stone-coloured bricks in walls one stud thick become masonry; the plain walls get a dado, a string course, patches
    for ki, kid in enumerate(kids):
        if VEHICLE.search(kid['name']): continue
        plain = bool(PLAIN_WALLS.match(kid['name']))
        bricks = [(n, r) for n, r in enumerate(kid['rows']) if r['part'] in MASON and r['col'] in WALLCOLS and abs(r['m'][7] - 1) < 1e-3]
        if len(bricks) < 12: continue
        ys = sorted({round(r['m'][1]) for _, r in bricks})
        low, high = max(ys), min(ys)
        ncourses = round((low - high) / 24) + 1
        for n, r in bricks:
            m = r['m']; course = round((low - m[1]) / 24)
            if ncourses < 3 or not r.get('d'): continue
            L = sum(w for _, w in MASON[r['part']])
            c0 = r['col']; pos = 0
            out[ki]['drop'].append(n)
            for pid, w in MASON[r['part']]:
                off = (pos + w / 2) * S - L * 10                  # along the brick's own x, from its centre
                cx, cz = m[0] + m[3] * off, m[2] + m[9] * off
                col = c0
                if plain:
                    if course == 0: col = TONE.get(c0, c0) if c0 != WHITE else TAN
                    elif course == min(3, ncourses - 2) and ncourses >= 5: col = WHITE if c0 != WHITE else prof.get('string', GOLD)
                    elif LS.patch(round(cx / S) + round(cz / S), course, seed, 3) < .2: col = TONE.get(c0, c0)
                elif c0 in (TAN, DTAN, LBG, DBG) and LS.patch(round(cx / S) + round(cz / S), course, seed, 3) < .12:
                    col = TONE[c0]
                out[ki]['add'].append(row(col, [cx, m[1], cz] + m[3:], pid))
                pos += w
            stats['masonry'] += 1

    # the exposed studs
    floor_votes = defaultdict(int)
    cand = []
    for ki, n, r, b in allrows:
        if b is None or VEHICLE.search(kids[ki]['name']): continue
        m = r['m']
        if abs(m[7] - 1) > 1e-3 or abs(m[4]) > 1e-3 or abs(m[10]) > 1e-3 or abs(m[6]) > 1e-3 or abs(m[8]) > 1e-3: continue
        d = desc(r['part'])
        if not d or d.startswith('~') or SKIP_DESC.search(d) and not d.startswith('Baseplate'): continue
        rnd = 'Round' in d
        if rnd and not re.search(r'1 x 1', d): continue
        if not (d.startswith('Plate') or d.startswith('Brick') or d.startswith('Baseplate') or d.startswith('Arch')): continue
        big = d.startswith('Baseplate') or (d.startswith('Plate') and (b[1] - b[0]) * (b[5] - b[4]) >= 4 * S * S - 1)
        ground = 'base' if d.startswith('Baseplate') else 'big' if big else 'plate' if d.startswith('Plate') else ''
        for sx, sy, sz, v, sc in studs_in(r['part'] + '.dat'):
            if v[1] < 0.9: continue
            x = m[0] + m[3] * sx + m[4] * sy + m[5] * sz; y = m[1] + m[6] * sx + m[7] * sy + m[8] * sz; z = m[2] + m[9] * sx + m[10] * sy + m[11] * sz
            if abs(x / 10 - round(x / 10)) > .05 or abs(z / 10 - round(z / 10)) > .05: continue
            col = r['col'] if sc == 16 else sc
            if big: floor_votes[round(y)] += 1
            cand.append((ki, round(x), round(y), round(z), col, ground, rnd, r['part']))
    floor_y = max(floor_votes, key=floor_votes.get) if floor_votes else -8
    cand = [c[:5] + ((c[5] in ('base', 'big') or (c[5] == 'plate' and c[2] >= floor_y - 16)),) + c[6:] for c in cand]
    free = []
    for c in cand:
        ki, x, y, z = c[:4]
        if idx.hits((x - 9.5, x + 9.5, y - 7.5, y - 0.5, z - 9.5, z + 9.5)): stats['kept'] += 1; continue
        free.append(c)
    stats['exposed'] = len(free)

    # groups: one surface (kid, height, lattice phase)
    groups = defaultdict(dict)
    for ki, x, y, z, col, ground, rnd, pid in free:
        px, pz = x % 20, z % 20
        ox, oz = (0 if px == 10 else 10), (0 if pz == 10 else 10)
        i, k = math.floor((x - ox) / S), math.floor((z - oz) / S)
        groups[(ki, y, ox, oz)][(i, k)] = (col, ground, rnd, pid)

    exterior = prof.get('exterior', False)
    mat = prof.get('mat', {})
    # shrubs on bare exterior ground: free green ground squares at the set's edges, clear of the cast
    shrubs_left = int(prof.get('shrubs', 0))
    castb = [aabb(r['part'], r['m']) for r in cast]
    castb = [b for b in castb if b]
    if shrubs_left:
        allx = [c[1] for c in free]; allz = [c[3] for c in free]
        if allx:
            X0, X1, Z0, Z1 = min(allx), max(allx), min(allz), max(allz)
            rng = random.Random(seed)
            spots = []
            for key, cells in groups.items():
                ki, y, ox, oz = key
                if y != floor_y and not (floor_y - 40 <= y <= floor_y): continue
                green = {c for c, v in cells.items() if v[0] in GREENS and v[1]}
                for (i, k) in green:
                    cx, cz = (i + 2) * S + ox, (k + 2) * S + oz
                    edge = min((cx - X0) / max(1, X1 - X0), (X1 - cx) / max(1, X1 - X0), (cz - Z0) / max(1, Z1 - Z0))
                    if edge > .2: continue
                    spots.append((edge + rng.random() * .15, key, i, k))
            spots.sort()
            used = []
            for _, key, i, k in spots:
                if shrubs_left <= 0: break
                ki, y, ox, oz = key
                cells = groups[key]
                kind = ['laurel', 'myrtle', 'maquis'][int(_h(i, k, seed, 5) * 3)]
                w, d = {'laurel': (4, 4), 'myrtle': (3, 3), 'maquis': (4, 3)}[kind]
                sq = {(i + a, k + b) for a in range(w) for b in range(d)}
                if not all(c in cells and cells[c][0] in GREENS for c in sq): continue
                cx, cz = (i + w / 2) * S + ox, (k + d / 2) * S + oz
                if any(math.hypot(cx - ux, cz - uz) < 160 for ux, uz in used): continue
                if any(b[0] - 70 < cx < b[1] + 70 and b[4] - 70 < cz < b[5] + 70 for b in castb): continue
                p = LS.shrub(i * S, k * S, -y, seed + i * 7 + k, kind)
                lines = shift_lines(p.rows, ox, oz)
                bs = [aabb(q['part'], q['m']) for q in map(parse_line, lines)]
                if any(bb and idx.hits((bb[0] + .5, bb[1] - .5, bb[2] + .5, bb[3] - .5, bb[4] + .5, bb[5] - .5)) for bb in bs): continue
                for bb in bs:
                    if bb: idx.add(bb)
                for c in sq: cells.pop(c, None)
                out[ki]['add'] += lines; used.append((cx, cz)); shrubs_left -= 1; stats['shrubs'] += 1

    laid = Index()                                        # the tiles laid so far: two lattices on one surface must not both lay
    for (ki, y, ox, oz), cells in sorted(groups.items(), key=lambda g: -len(g[1])):
        if not cells: continue
        yup = -y
        bykind = defaultdict(set)
        sea_shallow = set()
        for c, (col, ground, rnd, pid) in cells.items():
            if rnd: bykind[('round', col)].add(c); continue
            if ground:
                if col in SEAS:
                    if col == 9 or col == 41 or col == 43: sea_shallow.add(c)
                    bykind[('sea', DBLUE if col in (DBLUE, 33) else BLUE)].add(c); continue
                if col in GREENS: bykind[('ground', mat.get('green', 't'))].add(c); continue
                if col == 18: bykind[('ground', 's')].add(c); continue
                m = mat.get(str(col))
                if m: bykind[('ground', m[7:]) if m.startswith('ground:') else (m, col)].add(c); continue
                if col in (DTAN, TAN, LBG, DBG, WHITE, 7, 8):
                    bykind[('ground', {DTAN: 'e', TAN: 's', LBG: 'r', DBG: 'r', 7: 'r', 8: 'r'}[col]) if exterior and col != WHITE else ('pave', col)].add(c); continue
                bykind[('same', col)].add(c); continue
            if col in (RB, DBROWN, 6): bykind[('planks', col)].add(c); continue
            if exterior and col in (LBG, DBG, DTAN, 7, 8) and y < floor_y - 20: bykind[('rock', col)].add(c); continue
            bykind[('same', col)].add(c)
        lines = []
        for (kind, col), cs in bykind.items():
            sd = seed + ki * 13
            if kind == 'round': lines += [on(col, *LS._xz(c, yup), '98138') for c in sorted(cs)]
            elif kind == 'sea': lines += sea(cs, yup, sd, dark=(col == DBLUE), shallow=sea_shallow)
            elif kind == 'ground':
                g = LS.ground_at({c: (col, 0) for c in cs}, yup, seed=sd, dress=float(prof.get('dress', .05)), slopes=False)
                lines += g.rows
            elif kind == 'painted': lines += painted(cs, yup, sd)
            elif kind == 'pave': lines += pave(cs, yup, PAVE.get(col, [(col, 1)]), sd)
            elif kind == 'planks': lines += planks(cs, yup, sd)
            elif kind == 'rock':
                mossy = {c for c in cs if LS.patch(c[0], c[1], sd, 2) < .25}
                lines += LS.moss(mossy, yup, sd).rows + pave(cs - mossy, yup, PAVE.get(col, [(col, 1)]), sd)
            else: lines += same(cs, yup, col)
            stats[kind] += len(cs)
        lines = shift_lines(lines, ox, oz)
        # dressing that would fill the space of the set (a tuft under a table) is dropped for a round tile on its stud
        kept = []
        for l in lines:
            r = parse_line(l); b = aabb(r['part'], r['m'])
            if b and laid.hits((b[0] + .5, b[1] - .5, b[2] + .5, b[3] - .5, b[4] + .5, b[5] - .5)): stats['lattice clash dropped'] += 1; continue
            if b and b[3] - b[2] > 8.5 and idx.hits((b[0] + 1, b[1] - 1, b[2] + 1, b[3] - 1, b[4] + 1, b[5] - 1)):
                x, z = r['m'][0], r['m'][2]
                kept.append(on(LS.GREEN, x, yup, z, '98138')); stats['dress dropped'] += 1; continue
            kept.append(l)
            if b: laid.add(b)
        out[ki]['add'] += kept
    stats['added'] = sum(len(o['add']) for o in out)
    return {'kids': out, 'stats': dict(stats), 'floor': floor_y}


# ── checking a card ──
def flatten(path):
    """a scene card's parts in world, each tagged with the FILE it comes from"""
    text = open(path).read()
    blocks = re.split(r'(?m)^0 FILE ', text)
    files, order = {}, []
    for b in blocks[1:]:
        name = b.split('\n', 1)[0].strip().lower(); files[name] = b.splitlines()[1:]; order.append(name)
    out = []

    def walk(name, M, col):
        for l in files.get(name, ()):
            t = l.split()
            if len(t) < 15 or t[0] != '1': continue
            c = int(t[1]); c = col if c == 16 else c
            m = LS.mat_mul(M, [float(v) for v in t[2:14]])
            ref = ' '.join(t[14:]).lower()
            if ref in files: walk(ref, m, c)
            else: out.append((name, row(c, m, t[14])))
    walk(order[0], [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], 16)
    return out


def check(path, tmpdir):
    import clicks
    rows = flatten(path)
    flat = os.path.join(tmpdir, os.path.basename(path).replace('.mpd', '.ldr'))
    open(flat, 'w').write('\n'.join(r for _, r in rows) + '\n')
    mine = {r for f, r in rows if ' - finish' in f}
    P_ = clicks.parts(flat); L = clicks.loose(P_); O = clicks.overlaps(P_)
    ml = [p for p in L if p['line'] in mine]
    mo = [(a, b) for a, b in O if a['line'] in mine or b['line'] in mine]
    return {'card': os.path.basename(path), 'parts': len(rows), 'grid': len(P_), 'loose': len(L), 'overlap': len(O), 'added': len(mine),
            'added_grid': sum(1 for p in P_ if p['line'] in mine), 'added_loose': len(ml), 'added_overlap': len(mo),
            'free_clashes': LS.free_clashes([r for r in mine]) if mine else 0, '_ml': [p['line'] for p in ml[:5]], '_mo': [(a['line'], b['line']) for a, b in mo[:5]]}


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        import tempfile
        td = tempfile.mkdtemp()
        for p in sys.argv[2:]: print(json.dumps(check(p, td)))
    else:
        json.dump(finish(json.load(sys.stdin)), sys.stdout)
