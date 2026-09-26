#!/usr/bin/env python3
"""tools/forage/declip.py — put figures the keyframe gate finds inside the set back on clear ground.

  python3 tools/forage/declip.py OD-B12-S03 [--rounds 3]

Runs the gate on a scene and reads its faults. A figure the set passes through, or one standing on scenery, is re-blocked with `on`:
  on: 'black ship'  when the ship is what it clashes with or stands on (the crew belong on the deck, not in the hull);
  on: '*'           otherwise: the nearest clear place anywhere on the set to where it was blocked.
Figures that are meant to be where they are (in the sea, in a monster's jaws, on a keel) are left alone: they are air, tilted, placed at an
anchor, or the still declares a touch. The gate runs again after each round; what is left is written out for a person to stage by hand.
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NODE_PATH = os.environ.get('NODE_PATH', '')
FLOORS = {'stage plate', 'the sea', 'the shore', 'floor', 'the dark shore'}


def gate(scene):
    r = subprocess.run(['node', 'film-readymades/keyframes.cjs', f'odyssey/keyframes/{scene}.json', '--out', f'odyssey/keyframes/{scene}'],
                       cwd=ROOT, capture_output=True, text=True, env={**os.environ, 'NODE_PATH': NODE_PATH})
    out, key, fails = r.stdout.splitlines(), None, []
    for l in out:
        m = re.match(r'^(K\d+) (PASS|FAIL)', l)
        if m: key = m.group(1); continue
        if l.startswith('    ') and key: fails.append((key, l.strip()))
    return fails, out


def fix(scene, fails):
    p = os.path.join(ROOT, f'odyssey/keyframes/{scene}.json')
    d = json.load(open(p))
    nudged = set()
    keys = {k['id']: k for k in d['keys']}
    n = 0
    for key, f in fails:
        m = re.match(r'the set \(([^)]*)\) passes through (\S+)', f) or re.match(r'(\S+) stands on (.+?) \d+ above the ground', f)
        m2 = re.match(r'([a-z0-9-]+) passes through ([a-z0-9-]+) \(', f) or re.match(r'(\S+) (floats|is sunk|stands on nothing)', f)
        if m and f.startswith('the set'): labels, who = [x.strip() for x in m.group(1).split(',')], m.group(2)
        elif m: who, labels = m.group(1), [m.group(2)]
        elif m2 and not f.startswith('prop:'):   # two figures in one place, or feet off their floor: the second (or only) one moves
            who = m2.group(2) if 'passes through' in f else m2.group(1); labels = None
        else: continue
        k = keys[key]
        if any(t[1] == who and t[0] == 'set' for t in k.get('touch', [])): continue
        own = [b for b in k.get('blocking', []) if b['id'] == who]
        for b in own or [b for b in d.get('blocking', []) if b['id'] == who]:   # the still's own blocking, else the scene's base
            if b['id'] != who or b.get('absent') or b.get('air') or b.get('tilt') or b.get('lie') or isinstance(b.get('at'), str): continue
            if labels is None:   # a figure clash or a bad footing: keep its piece, look for room a stud and a half further on
                if b.get('on'):
                    if (key, who) in nudged: continue
                    nudged.add((key, who)); b['x'] = (b.get('x') or 0) + 30; n += 1
                else: b['on'] = '*'; n += 1
                continue
            want = 'black ship' if any('ship' in L for L in labels) else '*'
            if labels and all(L in FLOORS for L in labels): want = '*'
            if b.get('on') == want: want = '*' if want != '*' else None
            if not want: continue
            b['on'] = want; n += 1
            if b.get('sit') and want == 'black ship':
                b.pop('sit'); b['pose'] = {j: v for j, v in (b.get('pose') or {}).items() if j not in ('legRP', 'legLP')}
    json.dump(d, open(p, 'w'), indent=1)
    return n


if __name__ == '__main__':
    scene = sys.argv[1]
    rounds = int(sys.argv[sys.argv.index('--rounds') + 1]) if '--rounds' in sys.argv else 3
    for i in range(rounds):
        fails, out = gate(scene)
        n = fix(scene, fails)
        print(f'round {i + 1}: {len(fails)} faults, {n} figures re-blocked')
        if not n: break
    fails, out = gate(scene)
    print('\n'.join(l for l in out if re.match(r'^(K\d+ FAIL|    |GATE|ALL)', l)))
