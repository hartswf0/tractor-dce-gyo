#!/usr/bin/env python3
"""odyssey/cascade/tools/clashes.py — the offline half of stone 4, the illegal Odyssey: the volumes where two parts of a build fill the
same space, measured with the line's own checker (tools/forage/product/clicks.py: parts() and overlaps()), for the earlier Troy and
Ithaca modules, built before the strict check and failing it (tools/forage/product/kitpages.py lists them in EARLIER).

  python3 odyssey/cascade/tools/clashes.py      -> odyssey/cascade/assets/clashes.json

Per card: its title, the plan of what it occupies (stud rows as runs, for context), and every clash as the box two parts share:
[x0, z0, x1, z1, y0, y1] in LDU with y UP from the card's lowest part, and the two part numbers. The Cascade graph draws only these.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools/forage/product'))
import clicks

CARDS = [('set.temple-of-athena', 'Temple of Athena', 'Troy'), ('set.scaean-gate', 'The Scaean Gate', 'Troy'),
         ('set.trojan-house', 'A Trojan house', 'Troy'), ('set.trojan-street', 'A street', 'Troy'),
         ('set.great-hall', 'The great hall', 'Ithaca'), ('set.palace-court', 'The court', 'Ithaca'),
         ('set.storeroom', 'The storeroom', 'Ithaca'), ('set.penelope-chamber', "Penelope's chamber", 'Ithaca')]


def box(p, cells):
    u = 10 if p['half'] else 20
    return (min(c[0] for c in cells) * u, min(c[1] for c in cells) * u, (max(c[0] for c in cells) + 1) * u, (max(c[1] for c in cells) + 1) * u)


def main():
    out = []
    for card, title, city in CARDS:
        P = clicks.parts(os.path.join(ROOT, 'odyssey/cards', card + '.mpd'))
        O = clicks.overlaps(P)
        low = max(p['bot'] for p in P)                                    # LDraw y is down: the lowest part's bottom is the floor
        occ = set()
        for p in P:
            u = 10 if p['half'] else 20
            for c in p['fp']: occ.add((c[0] * u // 20, c[1] * u // 20))
        rows = {}
        for i, k in sorted(occ): rows.setdefault(k, []).append(i)
        runs = []
        for k, xs in sorted(rows.items()):
            a = b = xs[0]
            for x in xs[1:] + [None]:
                if x is not None and x == b + 1: b = x; continue
                runs.append([k, a, b]); a = b = x
        clashes = []
        for a, b in O:
            shared = a['fp'] & b['fp']
            x0, z0, x1, z1 = box(a, shared)
            y_top, y_bot = max(a['top'], b['top']), min(a['bot'], b['bot'])  # LDraw: top < bot
            clashes.append([x0, z0, x1, z1, low - y_bot, low - y_top, a['pid'], b['pid']])
        out.append(dict(card=card, title=title, city=city, parts=len(P), clash=len(O), occupied=runs, clashes=clashes))
        print(f'{card}: {len(P)} parts on the grid, {len(O)} clashes')
    path = os.path.join(ROOT, 'odyssey/cascade/assets/clashes.json')
    json.dump(dict(source='tools/forage/product/clicks.py overlaps(), measured by odyssey/cascade/tools/clashes.py', cards=out), open(path, 'w'), separators=(',', ':'))
    print(path, os.path.getsize(path), 'bytes')


if __name__ == '__main__':
    main()
