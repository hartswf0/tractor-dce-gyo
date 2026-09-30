#!/usr/bin/env python3
"""odyssey/cascade/tools/beflix_kit.py — a frame of the BEFLIX film as a buildable LEGO mosaic, and twelve frames as a film strip.

The graph's BxLego node maps the mosaic's eight ink levels to LEGO colours (White, Tan, Light Bluish Grey, Dark Tan, Dark Bluish
Grey, Black) at a stud resolution; tools/beflix_film.mjs has it write those grids (kit/beflix-key.json, kit/beflix-flipbook.json).
This builds them in real LDraw parts with the line's own kitlib: 48 x 48 baseplates (4186, light bluish grey), one 1 x 1 round tile
(98138) on every stud, as the LEGO Art mosaics are built. Written to odyssey/cascade/kit/<name>.mpd with a JSON summary (the parts
list) beside it, and checked with clicks.py through kitlib.check: 0 loose and 0 clashes, or it exits 1.

  cascade.beflix-key       the key frame (t 34.4 s: the Sirens promise, the song in the field), 144 x 96 studs on 6 baseplates
  cascade.beflix-flipbook  12 frames of the film, one 48 x 48 baseplate each: a 48 x 34 picture between black film edges of
                           7 studs with sprocket holes, the twelve plates side by side as a strip

  python3 odyssey/cascade/tools/beflix_kit.py [--only key|flipbook] [--no-check]
"""
import argparse, json, os, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools/forage/product'))
import kitlib
from kitlib import put, S, P, LBG

KIT = os.path.join(ROOT, 'odyssey/cascade/kit')
NAMES = {15: 'White', 19: 'Tan', 71: 'Light Bluish Grey', 28: 'Dark Tan', 72: 'Dark Bluish Grey', 0: 'Black'}


def mosaic(grid, plate_col=LBG):
    """grid: rows of LDraw colour codes (row 0 at the back). Baseplates tile the grid from its back-left corner; one tile a stud."""
    h, w = len(grid), len(grid[0])
    pw, ph = -(-w // 48), -(-h // 48)
    rows = []
    for bz in range(ph):
        for bx in range(pw):
            rows.append(put(plate_col, (bx * 48 + 24) * S, 4, (bz * 48 + 24) * S, '4186'))
    for k, line in enumerate(grid):
        for i, col in enumerate(line):
            rows.append(put(col, (i + 0.5) * S, 4 + P, (k + 0.5) * S, '98138'))
    return rows, pw * ph


def summary(name, title, grid, plates, extra):
    c = Counter(col for line in grid for col in line)
    tiles = [{'part': '98138', 'name': '1 x 1 round tile', 'color': col, 'colorName': NAMES.get(col, str(col)), 'n': n} for col, n in c.most_common()]
    return {'name': name, 'title': title, 'studs': [len(grid[0]), len(grid)], 'plates': plates, 'platePart': '4186',
            'plateName': '48 x 48 baseplate, Light Bluish Grey', 'tiles': tiles, 'tileCount': sum(c.values()),
            'pieces': sum(c.values()) + plates, **extra}


def build(name, title, grid, extra, check=True):
    rows, plates = mosaic(grid)
    kitlib.CARDS = KIT
    n = kitlib.write(name, title, rows, author='odyssey/cascade/tools/beflix_kit.py from the Cascade graph beflix.cascade')
    s = summary(name, title, grid, plates, extra)
    assert n == s['pieces'], (n, s['pieces'])
    if check:
        on_grid, loose, clash = kitlib.check(name)
        s.update(onGrid=on_grid, loose=loose, clash=clash)
    json.dump(s, open(os.path.join(KIT, name + '.json'), 'w'), indent=1)
    print(f"{name}: {s['pieces']} pieces ({s['tileCount']} tiles, {plates} baseplates)" + (f", loose {s['loose']}, clash {s['clash']}" if check else ''))
    return s


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--only'); ap.add_argument('--no-check', action='store_true'); a = ap.parse_args()
    out, bad = [], False
    if a.only in (None, 'key'):
        key = json.load(open(os.path.join(KIT, 'beflix-key.json')))
        s = build('cascade.beflix-key', f"BEFLIX in Cascade: the key frame (t {key['t']} s) as a LEGO mosaic", key['rows'],
                  {'frame': key['frame'], 't': key['t'], 'ramp': key['ramp']}, not a.no_check)
        out.append(s)
    if a.only in (None, 'flipbook'):
        fb = json.load(open(os.path.join(KIT, 'beflix-flipbook.json')))['frames']
        strip = [[] for _ in range(48)]
        for f in fb:                                              # one 48 x 48 baseplate a frame, side by side
            for r in range(48):
                if 7 <= r < 41: strip[r] += f['rows'][r - 7]
                else: strip[r] += [LBG if r in (2, 3, 44, 45) and c % 6 in (2, 3) else 0 for c in range(48)]
        s = build('cascade.beflix-flipbook', 'BEFLIX in Cascade: twelve frames of the film as a LEGO film strip', strip,
                  {'frames': [{'frame': f['frame'], 't': f['t']} for f in fb], 'frameStuds': [48, 34], 'edge': 'black, 7 studs, sprocket holes in light bluish grey'},
                  not a.no_check)
        out.append(s)
    for s in out:
        if s.get('loose') or s.get('clash'): bad = True
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
