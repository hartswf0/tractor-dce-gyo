#!/usr/bin/env python3
"""tools/forage/reframe.py — find a better camera for a still the gate fails on framing.

  python3 tools/forage/reframe.py OD-B22-S01 K2 [--n 140]

The photographer's walk round the subject: keyframes.cjs --search tries n cameras about the still's focus (its camera target), at distances
from 0.6 to 1.5 times the present one, heights from the subject's knee to well above its head, lenses from 32 to 56 degrees. A camera passes
when the gate would pass it, every other figure in the frame included (whole or wholly out, none peeking, none headless); passing cameras are
ranked by the subject's size, its face to the lens, the thirds, and an eye near the subject's own. The best is written into the still, the
gate runs again, and the six best are left beside the still (K2-c1.png ...) to look at.
"""
import json, math, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
scene, key = sys.argv[1], sys.argv[2]
n = int(sys.argv[sys.argv.index('--n') + 1]) if '--n' in sys.argv else 140
p = os.path.join(ROOT, f'odyssey/keyframes/{scene}.json')
d = json.load(open(p))
k = next(x for x in d['keys'] if x['id'] == key)
cam = k['camera']
tgt = cam.get('target')
pos = cam.get('pos')
if not (isinstance(tgt, list) and isinstance(pos, list)):
    print('camera is not a plain wide shot; left as it is'); sys.exit(0)
dist = math.dist(pos, tgt)
az0 = math.atan2(pos[0] - tgt[0], pos[2] - tgt[2])
k['search'] = {'around': tgt, 'target': tgt, 'r': [dist * 0.6, dist * 1.5], 'h': [max(15, tgt[1] - 30), tgt[1] + dist * 0.6],
               'az': [az0 - 1.6, az0 + 1.6], 'fov': [32, 56], 'n': n, 'size': 0.3, 'place': 'C'}
json.dump(d, open(p, 'w'), indent=1)
out = os.path.join(ROOT, f'odyssey/keyframes/{scene}')
env = {**os.environ}
r = subprocess.run(['node', 'film-readymades/keyframes.cjs', p, '--out', out, '--search', key, '--apply'], cwd=ROOT, capture_output=True, text=True, env=env)
print('\n'.join(l for l in r.stdout.splitlines() if l.strip()))
d = json.load(open(p)); next(x for x in d['keys'] if x['id'] == key).pop('search', None); json.dump(d, open(p, 'w'), indent=1)
