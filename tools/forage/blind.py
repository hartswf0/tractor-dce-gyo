#!/usr/bin/env python3
"""tools/forage/blind.py — the detective test for keyframe stills.

A still is legible when a stranger, shown only the picture, can say what is happening in it. This script prepares that test and scores it:

  python3 tools/forage/blind.py deal  OUT [--per 12] [--only OD-B10-S02,...]
      copies every keyframe still to OUT/img/<code>.png under a random code, shuffled across scenes, so neither the file name nor the
      neighbouring frames give the story away; writes OUT/key.json (code -> scene, still, beat, title) and OUT/batch-N.txt (the codes each
      blind reader gets).

  python3 tools/forage/blind.py score OUT
      reads OUT/answers-N.json (what each reader said, one entry per code) and writes OUT/score.json and OUT/score.md: per still, the
      reader's guess beside the beat it was meant to show, and the verdict the reader gave itself against the key (read, partial, missed).

The readers are fresh agents given no context but the images; they answer in the form in PROMPT below.
"""
import json, os, random, shutil, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROMPT = """You are a detective shown still images with no other context. For each image, independently (do not use other images to
interpret it), answer: what you literally see (figures, creatures, objects, setting, light); who is doing what to whom; what story and
which moment you believe it depicts, if any; and how confident you are (0 to 1). Be concrete and honest: if it is unclear, say what is
unclear and why."""


def deal(out, per=12, only=None):
    stills = []
    for spec in sorted(glob.glob(os.path.join(ROOT, 'odyssey/keyframes/OD-*.json'))):
        d = json.load(open(spec))
        if only and d['scene'] not in only: continue
        for k in d['keys']:
            png = os.path.join(ROOT, 'odyssey/keyframes', d['scene'], k['id'] + '.png')
            if os.path.exists(png): stills.append((d['scene'], d.get('title', ''), k['id'], k.get('beat', ''), k.get('text', ''), png))
    random.seed(7); random.shuffle(stills)
    os.makedirs(os.path.join(out, 'img'), exist_ok=True)
    key, codes = {}, []
    for i, (scene, title, kid, beat, text, png) in enumerate(stills):
        code = 'x%03d' % random.randrange(1000) + chr(97 + i % 26) + str(i)
        shutil.copy(png, os.path.join(out, 'img', code + '.png'))
        key[code] = {'scene': scene, 'title': title, 'still': kid, 'beat': beat, 'text': text}
        codes.append(code)
    json.dump(key, open(os.path.join(out, 'key.json'), 'w'), indent=1)
    for b in range(0, len(codes), per):
        open(os.path.join(out, 'batch-%d.txt' % (b // per)), 'w').write('\n'.join(codes[b:b + per]) + '\n')
    print(len(codes), 'stills dealt into', (len(codes) + per - 1) // per, 'batches')


def score(out):
    key = json.load(open(os.path.join(out, 'key.json')))
    ans = {}
    for f in glob.glob(os.path.join(out, 'answers-*.json')): ans.update(json.load(open(f)))
    rows = []
    for code, k in key.items():
        a = ans.get(code, {})
        rows.append({**k, 'code': code, 'guess': a.get('moment', ''), 'sees': a.get('sees', ''), 'confidence': a.get('confidence'), 'verdict': a.get('verdict', 'unanswered'), 'why': a.get('why', '')})
    rows.sort(key=lambda r: (r['scene'], r['still']))
    json.dump(rows, open(os.path.join(out, 'score.json'), 'w'), indent=1)
    n = {v: sum(r['verdict'] == v for r in rows) for v in ('read', 'partial', 'missed', 'unanswered')}
    md = ['# Blind reading of the keyframe stills', '', ' · '.join(f'{v} {c}' for v, c in n.items()), '']
    for r in rows:
        md.append(f"- **{r['scene']} {r['still']}** [{r['verdict']}] meant: {r['beat']}  \n  read as: {r['guess']} ({r['confidence']})  \n  {r['why']}")
    open(os.path.join(out, 'score.md'), 'w').write('\n'.join(md) + '\n')
    print(' · '.join(f'{v} {c}' for v, c in n.items()))


if __name__ == '__main__':
    cmd, out = sys.argv[1], sys.argv[2]
    opt = lambda k, d=None: sys.argv[sys.argv.index('--' + k) + 1] if '--' + k in sys.argv else d
    if cmd == 'deal': deal(out, int(opt('per', 12)), opt('only') and opt('only').split(','))
    else: score(out)
