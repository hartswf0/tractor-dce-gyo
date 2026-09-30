#!/usr/bin/env python3
"""odyssey/cascade/tools/gesture_kit.py — the offline step of stone 1: a gesture's cells, as the Cascade graph quantized them, built in
real LDraw parts with the line's own kitlib, and checked.

  cd odyssey/cascade && npx --no-install cascade run kit.cascade --frames 240      (the graph writes .cascade-cache/gesture-cells.<hash>.json)
  python3 odyssey/cascade/tools/gesture_kit.py [--cells <json>] [--name cascade.gesture-welcome] [--figure character.telemachus:telemachus]

The kit: a 32 x 32 baseplate with the line's frame (the white ring and the nameplate); for each column of the stud grid the hand passed
over, a stack of 1 x 1 parts from the baseplate up to the highest cell the hand reached there: every cell the hand passed through is a
1 x 1 plate in the colour of when it arrived (dark blue first, dark red last), and the levels between are the support, light bluish grey
1 x 1 bricks where three plates would stand and plates for the rest. The actor stands where his gesture ends, at the gate, facing the viewer. Written to
odyssey/cascade/kit/<name>.mpd (not among the cards: this is a demonstration, not a kit of the line) with a JSON summary beside it, and
checked with clicks.py through kitlib.check: 0 loose and 0 clashes, or it exits 1.
"""
import argparse, glob, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools/forage/product'))
import kitlib
from kitlib import put, figure, frame, LBG, S, P

KIT = os.path.join(ROOT, 'odyssey/cascade/kit')


def newest_cells():
    found = sorted(glob.glob(os.path.join(ROOT, 'odyssey/cascade/.cascade-cache/gesture-cells.*.json')), key=os.path.getmtime)
    if not found: sys.exit('no gesture-cells.*.json in odyssey/cascade/.cascade-cache: run the graph first (see the docstring)')
    return found[-1]


def build(data, fig=None):
    cells = data['cells']                                     # [i, j, level, u, LDraw colour], the kit centred on the origin
    by_col = {}
    # the graph works in the film's frame (three.js: y up, +z toward the gate); the film turns an LDraw model half round x to show it
    # (world/kits.js: flip.rotation.x = PI), so back in LDraw the film's z is -z: the gesture keeps its handedness
    for i, j, lv, u, col in cells: by_col.setdefault((i, -j), {})[lv] = col
    rows = [put(72, 0, 4, 0, '3811')]         # the 32 x 32 baseplate, dark bluish grey
    fr, fcells = frame(-300, -300, 30, 30, 4)                # the line's finish, one stud in from the baseplate's edge
    rows += fr
    clash = set(by_col) & set(fcells)                          # both in stud indices: the stud whose corner is (i * 20, j * 20)
    if clash: sys.exit(f'the gesture runs into the frame at {sorted(clash)[:5]}: lower the kit scale')
    pieces_support = pieces_cells = 0
    for (i, j), levels in sorted(by_col.items()):
        x, z = (i + 0.5) * S, (j + 0.5) * S
        top, lv = max(levels), 0
        while lv <= top:
            if lv in levels:                                    # a cell the hand passed through: a plate in its time's colour
                rows.append(put(levels[lv], x, 4 + (lv + 1) * P, z, '3024')); lv += 1; pieces_cells += 1; continue
            run = 0
            while lv + run <= top and lv + run not in levels: run += 1
            while run >= 3: rows.append(put(LBG, x, 4 + (lv + 3) * P, z, '3005')); lv += 3; run -= 3; pieces_support += 1
            while run > 0: rows.append(put(LBG, x, 4 + (lv + 1) * P, z, '3024')); lv += 1; run -= 1; pieces_support += 1
    if fig:
        card, sub = fig.split(':')
        rows += figure(card, sub, 90, 4, -190, 3.14159265)       # at the end of the gesture (the gate), facing the viewer
    return rows, pieces_cells, pieces_support


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cells'); ap.add_argument('--name', default='cascade.gesture-welcome')
    ap.add_argument('--title', default='A kit of a motion: Telemachus welcomes the stranger (OD-B01-S03), his right hand from the feast to the gate')
    ap.add_argument('--figure', default='character.telemachus:telemachus')
    a = ap.parse_args()
    src = a.cells or newest_cells()
    data = json.load(open(src))
    rows, pc, ps = build(data, a.figure or None)
    os.makedirs(KIT, exist_ok=True)
    kitlib.CARDS = KIT                                         # write and check here, with the line's own write() and check()
    n = kitlib.write(a.name, a.title, rows, author='odyssey/cascade/tools/gesture_kit.py from the Cascade graph kit.cascade')
    on_grid, loose, clash = kitlib.check(a.name)
    summary = dict(name=a.name, title=a.title, source=os.path.relpath(src, ROOT), pieces=n, cells=pc, support=ps, columns=len({(c[0], c[1]) for c in data['cells']}),
                   levels=data['levels'], scale=data['scale'], on_grid=on_grid, loose=loose, clash=clash)
    json.dump(summary, open(os.path.join(KIT, a.name + '.json'), 'w'), indent=1)
    print(json.dumps(summary))
    sys.exit(1 if loose or clash else 0)


if __name__ == '__main__':
    main()
