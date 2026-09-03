#!/usr/bin/env python3
"""Copy the seven arena castles into builds/ (mpd + png + thumb), update builds/manifest.json and
builds/README.md so they show on builds.html next to the other builds. Run after collect.js and render-arena.js."""
import json, os, shutil, re
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
R = json.load(open(os.path.join(HERE, 'results.json')))
man = json.load(open(os.path.join(REPO, 'builds', 'manifest.json')))
man['builds'] = [b for b in man['builds'] if not b['id'].startswith('arena-')]
added = []
for s in R['seeds']:
    if s.get('status') != 'DONE': continue
    sid = s['seed']; name = s['name'].lower()
    src = os.path.join(HERE, 'runs', sid, f'castle-{sid}.mpd'); png = os.path.join(HERE, 'runs', sid, f'castle-{sid}.png')
    bid = f"arena-{sid.lower()}-{name}"
    shutil.copyfile(src, os.path.join(REPO, 'builds', bid + '.mpd'))
    if os.path.exists(png):
        im = Image.open(png).convert('RGB'); im.quantize(192).save(os.path.join(REPO, 'builds', bid + '.png'))
        th = im.copy(); th.thumbnail((320, 320)); th.quantize(128).save(os.path.join(REPO, 'builds', bid + '.thumb.png'))
    text = open(src).read()
    man['builds'].append({'id': bid, 'page': 'slipcase-build/arena/world.js', 'note': f"seed {sid} {s['name']}: its own castle, built by a separate agent through the arena world; {s['wins']}W/{s['losses']}L vs 5935, open share {s['share']}", 'pieces': s['pieces'], 'blocks': s['blocks'], 'bytes': len(text.encode())})
    added.append(bid)
json.dump(man, open(os.path.join(REPO, 'builds', 'manifest.json'), 'w'), indent=1)
readme = os.path.join(REPO, 'builds', 'README.md'); t = open(readme).read()
t = re.sub(r'\n## The arena castles.*', '', t, flags=re.S)
rows = '\n'.join(f"| `{b}` | {next(s['seed'] + ' ' + s['name'] for s in R['seeds'] if b.endswith(s['name'].lower()))} | {next(str(s['pieces']) for s in R['seeds'] if b.endswith(s['name'].lower()))} | {next(str(s['wins']) + '/' + str(s['losses']) for s in R['seeds'] if b.endswith(s['name'].lower()))} | {next(str(s['share']) for s in R['seeds'] if b.endswith(s['name'].lower()))} |" for b in added)
t += f"""
## The arena castles

Seven seed prompts, seven separate agents, seven castles, one world (`slipcase-build/arena/world.js`):
each agent could only place pieces by relation to open ports (or, for S06/S07, only change a plan
parameter or a card), and every castle was judged blind against 5935 Island Hopper on the twelve
axes. The full table, per-axis verdicts and each agent's notes are in
`slipcase-build/arena/RESULTS.md` (and in the slipcase under `_RESOURCES/arena/`).

| build | seed | pieces | W/L | structural open share |
|---|---|---:|---|---:|
{rows}

Kit band for the open share: 0.112–0.431. The baseline `card-castle` (no agent) is 182 pieces, 4/8, 0.227.
"""
open(readme, 'w').write(t)
print('published', added)
