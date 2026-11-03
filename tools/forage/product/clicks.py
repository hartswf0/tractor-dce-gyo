#!/usr/bin/env python3
"""tools/forage/product/clicks.py — does every brick of a set click to the rest? (the satisfying click, checked)

  python3 tools/forage/product/clicks.py odyssey/cards/set.wooden-horse.mpd [...]

Reads the set's top-level parts and measures each from its own geometry (tools/forage/product/ldbox.py), so a part's origin is never
guessed: its footprint of studs, the height of its top face and of its bottom. Two parts are joined when one's bottom lies on the other's
top face, their footprints share a stud, and the lower one has studs there (a tile or a slope takes nothing on top). Everything reachable
from the parts at the bottom of the build, or from a part marked `0 !FORAGE ROOT` (a wheeled cart that rolls on its tyres), is held;
whatever is left is printed.

Step 0 extensions (docs/sets/shield-builder.md):
- One-piece section mode: when a build has no baseplates (4186, 3811, 3857) at its bottom, its base plates must be cross-bonded through
  studs into a single connected whole so the section lifts out in one piece; any disconnected base island is reported as not clicked.
- Static-set minifigure check: every minifigure (hips 3815* or gown 36036/24068) must stand with its soles on a studded surface at the
  same height (unless marked `0 !FORAGE ROOT`), and keep at least a stud (20 LDU) from the next figure unless marked `0 !FORAGE CONTACT`.
"""
import math, os, re, sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ldbox


def studded(pid):
    """a part takes others on top when something of it (its studs) stands above its top face"""
    a, b = ldbox.box(pid, True), ldbox.box(pid, False)
    return bool(a and b and a[0][1] < b[0][1] - 1)


_studded = {}
BODY = {'4600': ((-20, 0, -20), (20, 8, 20)), '4488': ((-20, 0, -20), (20, 8, 20))}   # plates with wheel pins: the plate, not its pins
BASEPLATES = {'4186', '3811', '3857', '3867', '3027'}


def parts(path):
    text = open(path).read()
    top = re.split(r'(?m)^0 FILE ', text)[1] if '0 FILE ' in text else text
    out, root_next = [], False
    for l in top.splitlines():
        t = l.split()
        if not t: continue
        if t[0] == '0':
            root_next = root_next or '!FORAGE ROOT' in l
            continue
        if t[0] != '1': continue
        pid = t[14].lower().replace('.dat', '')
        x, y, z = map(float, t[2:5]); m = list(map(float, t[5:14]))
        root, root_next = root_next, False
        b = BODY.get(pid) or ldbox.box(pid, False)
        if not b: continue
        if abs(abs(m[4]) - 1) > 1e-3 or any(abs(abs(v) - 1) > 1e-3 and abs(v) > 1e-3 for v in m): continue   # on its side, or at an angle
        lo, hi = b
        cs = [(x + m[0] * px + m[2] * pz, z + m[6] * px + m[8] * pz) for px in (lo[0], hi[0]) for pz in (lo[2], hi[2])]
        x0, x1 = min(c[0] for c in cs), max(c[0] for c in cs); z0, z1 = min(c[1] for c in cs), max(c[1] for c in cs)
        ys = sorted((y + m[4] * lo[1], y + m[4] * hi[1]))
        on_grid = all(abs(v / 10 - round(v / 10)) < 0.05 for v in (x0, x1, z0, z1)) and x1 - x0 >= 19 and z1 - z0 >= 19
        if not on_grid: continue
        fp = {(p, q) for p in range(round(x0 / 20), round(x1 / 20)) for q in range(round(z0 / 20), round(z1 / 20))} if all(
            abs(v / 20 - round(v / 20)) < 0.05 for v in (x0, x1, z0, z1)) else \
            {(p, q) for p in range(round(x0 / 10), round(x1 / 10)) for q in range(round(z0 / 10), round(z1 / 10))}   # half-stud offset
        if pid in ('27925', '79393', '27507') and all(abs(v / 20 - round(v / 20)) < 0.05 for v in (x0, x1, z0, z1)):
            wx_in, wz_in = x + m[0] * lo[0] + m[2] * hi[2], z + m[6] * lo[0] + m[8] * hi[2]
            fp = {(p, q) for (p, q) in fp if max(abs((p + 0.5) * 20 - wx_in), abs((q + 0.5) * 20 - wz_in)) > (x1 - x0) - 20}
        if pid not in _studded: _studded[pid] = studded(pid)
        out.append({'pid': pid, 'top': round(ys[0]), 'bot': round(ys[1]), 'fp': fp, 'half': not all(abs(v / 20 - round(v / 20)) < 0.05 for v in (x0, x1, z0, z1)),
                    'studs': _studded[pid], 'root': root, 'line': l})
    return out


def _walk(P, seeds):
    by_top, by_bot = defaultdict(list), defaultdict(list)
    for n, p in enumerate(P): by_top[p['top']].append(n); by_bot[p['bot']].append(n)
    held = set(seeds)
    stack = list(held)

    def touch(a, b):   # a sits on b
        if a['half'] != b['half']: return False
        return b['studs'] and bool(a['fp'] & b['fp'])
    while stack:
        n = stack.pop(); p = P[n]
        for m in by_bot.get(p['top'], []):          # parts standing on p
            if m not in held and touch(P[m], p): held.add(m); stack.append(m)
        for m in by_top.get(p['bot'], []):          # parts p stands on
            if m not in held and touch(p, P[m]): held.add(m); stack.append(m)
    return held


def loose(P, one_piece=False):
    if not P: return []
    low = max(p['bot'] for p in P)
    roots = {n for n, p in enumerate(P) if p['root']}
    bottoms = [n for n, p in enumerate(P) if p['bot'] == low]
    has_baseplates = any(P[n]['pid'] in BASEPLATES for n in bottoms)
    if one_piece and not has_baseplates and len(bottoms) > 1:
        # Section mode: must lift out in one connected piece from its base
        seen, best = set(), set()
        for b in bottoms:
            if b in seen: continue
            comp = _walk(P, {b})
            seen |= comp
            if len(comp) > len(best): best = comp
        held = best | (_walk(P, roots) if roots else set())
    else:
        held = _walk(P, set(bottoms) | roots)
    return [P[n] for n in range(len(P)) if n not in held]


def parts_loose(path, one_piece=False):
    return loose(parts(path), one_piece=one_piece)


def overlaps(P):
    """pairs of parts on the grid that fill the same space: a stud square they share, their heights crossing (not merely touching)"""
    cells = defaultdict(list)
    for n, p in enumerate(P):
        for c in p['fp']: cells[(p['half'], c)].append(n)
    out = set()
    for ns in cells.values():
        for a in range(len(ns)):
            for b in range(a + 1, len(ns)):
                p, q = P[ns[a]], P[ns[b]]
                if p['top'] < q['bot'] and q['top'] < p['bot']: out.add((min(ns[a], ns[b]), max(ns[a], ns[b])))
    return [(P[a], P[b]) for a, b in sorted(out)]


def figures(path, P=None):
    """check minifigures in `path`: returns (ungrounded_figures, clashing_figure_pairs)"""
    if P is None: P = parts(path)
    text = open(path).read()
    top = re.split(r'(?m)^0 FILE ', text)[1] if '0 FILE ' in text else text
    figs, root_next, contact_next = [], False, False
    for l in top.splitlines():
        t = l.split()
        if not t: continue
        if t[0] == '0':
            if '!FORAGE ROOT' in l: root_next = True
            if '!FORAGE CONTACT' in l: contact_next = True
            continue
        if t[0] != '1': continue
        pid = t[14].lower().replace('.dat', '')
        x, y, z = map(float, t[2:5]); m = list(map(float, t[5:14]))
        if pid.startswith('3815') or pid in ('36036', '24068'):
            upright = abs(abs(m[4]) - 1) <= 0.15
            sole_y = round(y + (40 if pid.startswith('3815') else 32))
            figs.append({'pid': pid, 'x': x, 'y': y, 'z': z, 'sole_y': sole_y, 'upright': upright,
                         'root': root_next, 'contact': contact_next, 'line': l})
            root_next = False; contact_next = False
        elif pid.startswith(('3816', '3817', '973', '3818', '3819', '3820', '3626')):
            pass
        else:
            root_next = False; contact_next = False
    ungrounded, clashes = [], []
    # 1. Grounding check: every upright non-root figure must have a studded part in P with top == sole_y under its feet
    studded_by_top = defaultdict(list)
    for p in P:
        if p['studs'] and not p['half']:
            studded_by_top[p['top']].append(p)
    for f in figs:
        if not f['upright'] or f['root']: continue
        cands = studded_by_top.get(f['sole_y'], [])
        # foot cells near (x, z)
        ok = False
        for dx in (-8, 0, 8):
            for dz in (-8, 0, 8):
                cell = (math.floor((f['x'] + dx) / 20), math.floor((f['z'] + dz) / 20))
                if any(cell in p['fp'] for p in cands):
                    ok = True; break
            if ok: break
        if not ok:
            ungrounded.append({'pid': f['pid'], 'line': f['line'] + f' [ungrounded figure at sole y={f["sole_y"]}]'})
    # 2. Spacing check: no two figures closer than 19.5 LDU in xz at overlapping heights unless marked contact
    for a in range(len(figs)):
        for b in range(a + 1, len(figs)):
            fa, fb = figs[a], figs[b]
            if fa['contact'] or fb['contact']: continue
            if abs(fa['sole_y'] - fb['sole_y']) < 72 and math.hypot(fa['x'] - fb['x'], fa['z'] - fb['z']) < 19.5:
                clashes.append(({'line': fa['line'] + ' [figure spacing]'}, {'line': fb['line'] + ' [figure spacing]'}))
    return ungrounded, clashes


def check(path, one_piece=False):
    P = parts(path); L = loose(P, one_piece=one_piece)
    ug, fc = figures(path, P)
    L = L + ug
    print(f'{path}: {len(P)} parts on the grid, {len(L)} not clicked to the build')
    for p in L[:40]: print('  ', p['line'])
    O = overlaps(P) + fc
    if O: print(f'{path}: {len(O)} pairs of parts in the same space')
    for a, b in O[:20]: print('  ', a['line'], ' <> ', b['line'])
    return L + [a for a, _ in O]


if __name__ == '__main__':
    sec = '--section' in sys.argv
    paths = [a for a in sys.argv[1:] if a != '--section']
    bad = sum(len(check(p, one_piece=sec or ('shield-m' in p))) for p in paths)
    sys.exit(1 if bad else 0)
