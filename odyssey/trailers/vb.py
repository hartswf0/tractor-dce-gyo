"""Voice clips for the trailer builder: a phrase -> a clip of a verified segment, cut on its word times (lines.json)."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
BANK = {f"{e['scene']}:{e['gi']}": e for e in json.load(open(os.path.join(HERE, 'lines.json')))['lines']}
def norm(t):
    t = t.lower().replace('’', "'").replace('—', ' ').replace('-', ' ')
    t = re.sub(r"[^a-z' ]+", ' ', t); return [w.strip("'") for w in t.split() if w.strip("'")]
def clip(scene, gi, phrase, exact_words=None):
    b = BANK[f'{scene}:{gi}']
    if b['flags']: raise SystemExit(f'{scene}:{gi} is flagged in lines.json: {b["flags"][0]}')
    al = b['words']; ws = [w for _, _, w in al]; p = norm(phrase)
    for i in range(len(ws) - len(p) + 1):
        if ws[i:i + len(p)] == p: break
    else: raise SystemExit(f'phrase not found {scene}:{gi} {p} in {ws}')
    j = i + len(p) - 1; a = al[i][0]; e = al[j][1]
    lo = al[i - 1][1] + 0.02 if i > 0 else 0.0; hi = al[j + 1][0] - 0.02 if j + 1 < len(al) else b['dur']
    cin = round(max(lo, a - 0.12, 0), 2); cout = round(min(hi, e + 0.18, b['dur']), 2)
    return dict(scene=scene, gi=gi, start=b['start'], dur=b['dur'], speaker=b['speaker'], kind=b['kind'],
                text=b['recorded_text'], words=exact_words or phrase, recorded_text_source=b['recorded_text_source'],
                clip={'in': cin, 'out': cout}, len=round(cout - cin, 2),
                verified='pocketsphinx forced alignment of the segment audio; free decode agrees with this text over the alternative')
