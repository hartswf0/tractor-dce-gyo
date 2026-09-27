#!/usr/bin/env python3
"""tools/trailer-review.py: the material for a critic's pass over a rendered trailer (or animatic).

  python3 tools/trailer-review.py films/trailers/teaser-r1.mp4 teaser [--doc path.json] [--out dir]

Writes into --out (default <mp4 without .mp4>.review/):
  shots.jpg   a contact sheet: one frame from the middle of every shot (and the first and last frame of a moving shot), labelled
              with the shot number, its time and what the edit list says it is
  hits.jpg    the frame just before and just after every declared hit (does the cut land on it?) and at every voice line's middle
  refs.jpg    the 23 studio-trailer reference frames, small, for the side-by-side
  review.json loudness of the whole (ebur128: integrated LUFS, LRA, true peak), the short-term loudness over each voice line and
              over the second before it (does the line stand clear of the music?), and the loudness at each hit against the half
              second before it (does the hit hit?)
"""
import json, os, re, subprocess, sys, glob
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return 'ffmpeg'


FF = ffmpeg()


def grab(mp4, t, w=480):
    raw = subprocess.run([FF, '-v', 'error', '-ss', f'{max(0, t):.3f}', '-i', mp4, '-frames:v', '1', '-vf', f'scale={w}:-2', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
    from io import BytesIO
    return Image.open(BytesIO(raw)).convert('RGB') if raw else Image.new('RGB', (w, w * 9 // 16), '#400')


def sheet(tiles, cols, path, w=480):
    h = tiles[0][0].height if tiles else 270
    font = ImageFont.load_default()
    S = Image.new('RGB', (cols * w, ((len(tiles) + cols - 1) // cols) * (h + 30)), '#1b1b1b'); d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(tiles):
        x, y = (i % cols) * w, (i // cols) * (h + 30)
        S.paste(im.resize((w, h)), (x, y + 30)); d.text((x + 4, y + 2), lab[:78], fill='#f0f0f0', font=font); d.text((x + 4, y + 15), lab[78:156], fill='#bbbbbb', font=font)
    S.save(path, quality=88)


def ebur(mp4, start=None, dur=None):
    cmd = [FF, '-hide_banner', '-nostats', '-v', 'verbose']
    if start is not None: cmd += ['-ss', f'{max(0, start):.3f}', '-t', f'{dur:.3f}']
    cmd += ['-i', mp4, '-vn', '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-']
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    summ = err[err.rfind('Summary:'):]
    g = lambda k: float(re.search(k + r':\s+(-?[\d.]+|-inf|nan)', summ)[1].replace('-inf', '-120').replace('nan', '-120'))
    st = [(float(m[1]), float(m[2]), float(m[3])) for m in re.finditer(r't:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+)\s+S:\s*(-?[\d.]+)', err.replace('-inf', '-120'))]
    return {'I': g('I'), 'LRA': g('LRA'), 'TP': g('Peak'), 'frames': st}


def main(argv):
    mp4, tid = argv[0], argv[1]
    opt = lambda k, d=None: argv[argv.index('--' + k) + 1] if '--' + k in argv else d
    doc = json.load(open(opt('doc') or os.path.join(ROOT, 'odyssey/trailers', tid + '.json')))
    out = opt('out', mp4[:-4] + '.review'); os.makedirs(out, exist_ok=True)
    tiles = []
    for s in doc['shots']:
        what = s.get('scene', '') + ' ' + (s.get('key') or '') if s['kind'] == 'SCENE' else s.get('kit') or (s.get('card') or {}).get('text') or s['kind']
        mv = ((s.get('camera') or {}).get('move') or {}).get('type', '')
        ts = [s['at'] + s['dur'] * 0.5] if s['kind'] in ('CARD', 'BLACK') or mv in ('', 'hold') else [s['at'] + 0.05, s['at'] + s['dur'] * 0.5, s['at'] + s['dur'] - 0.08]
        for t in ts: tiles.append((grab(mp4, t), f"{s['n']} {t:5.2f}s {s['kind']} {what} {mv}  |  {s.get('action', '')}"))
    sheet(tiles, 3, os.path.join(out, 'shots.jpg'))
    ht = []
    for h in doc.get('hits', []):
        ht += [(grab(mp4, h['trailer'] - 0.08), f"hit {h['trailer']:.2f} - 0.08: {h['what']}"), (grab(mp4, h['trailer'] + 0.04), f"hit {h['trailer']:.2f} + 0.04")]
    for s in doc['shots']:
        v = s.get('voice')
        if v: ht.append((grab(mp4, s['at'] + v['at'] + (v['clip']['out'] - v['clip']['in']) / 2), f"voice {s['n']}: {v['speaker']}: {v['words']}"))
    if ht: sheet(ht, 3, os.path.join(out, 'hits.jpg'))
    refs = sorted(glob.glob(os.path.join(ROOT, 'films/ref/odyssey-trailer/*.jpg')), key=lambda f: float(os.path.basename(f)[1:-4]))
    sheet([(Image.open(f).convert('RGB').resize((320, 180)), os.path.basename(f)) for f in refs], 6, os.path.join(out, 'refs.jpg'), 320)
    L = ebur(mp4); fr = L.pop('frames')
    def st_at(t): return min(fr, key=lambda x: abs(x[0] - t)) if fr else (t, -120, -120)
    lines = []
    for s in doc['shots']:
        v = s.get('voice')
        if not v: continue
        a = s['at'] + v['at']; d = v['clip']['out'] - v['clip']['in']
        mom = [m for (t, m, _) in fr if a + 0.4 <= t <= a + d]
        pre = [m for (t, m, _) in fr if a - 1.0 <= t <= a - 0.05]
        lines.append({'shot': s['n'], 'words': v['words'], 'at': round(a, 2), 'line_M_median': sorted(mom)[len(mom) // 2] if mom else None,
                      'before_M_median': sorted(pre)[len(pre) // 2] if pre else None})
    hits = []
    for h in doc.get('hits', []):
        after = max([m for (t, m, _) in fr if h['trailer'] + 0.05 <= t <= h['trailer'] + 0.6] or [-120])
        before = sorted([m for (t, m, _) in fr if h['trailer'] - 0.8 <= t <= h['trailer'] - 0.1] or [-120])
        hits.append({'t': h['trailer'], 'what': h['what'], 'M_after_max': after, 'M_before_median': before[len(before) // 2]})
    curve = [(round(t, 1), m, s) for (t, m, s) in fr if abs(t * 2 - round(t * 2)) < 0.051]
    rep = {'mp4': mp4, 'loudness': L, 'voice': lines, 'hits': hits, 'curve_M_S_every_0.5s': curve}
    json.dump(rep, open(os.path.join(out, 'review.json'), 'w'), indent=1)
    print(json.dumps({'loudness': L, 'voice': lines, 'hits': hits}, indent=1))
    print('wrote', out)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
