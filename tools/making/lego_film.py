#!/usr/bin/env python3
"""tools/making/lego_film.py — the making-of LEGO film assembled from its four performed scenes.

    python3 tools/making/lego_film.py [--poster-scene OD-B25-S01 --poster-t 50.5]

Reads films/odyssey/OD-B25-S0N-performed.{mp4,vtt,json} (each rendered by tools/export-odyssey.js from the scene's take, as the
Odyssey's scenes are) and writes films/odyssey/making-of.{mp4,vtt,jpg,json}: the four joined with a short dip through black between
them (the sound faded with the picture), and over the last seconds the end caption, which says the voices are synthetic. The caption
is drawn with PIL (this ffmpeg has no drawtext) and laid over the last shot; the cue is also in the captions file."""
import json, os, re, subprocess, sys
from pathlib import Path
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont
REPO = Path(__file__).resolve().parents[2]; F = REPO / 'films/odyssey'; FF = imageio_ffmpeg.get_ffmpeg_exe()
A = sys.argv; arg = lambda k, d=None: A[A.index('--' + k) + 1] if '--' + k in A else d
SCENES = arg('scenes', 'OD-B25-S01,OD-B25-S02,OD-B25-S03,OD-B25-S04').split(',')   # --scenes, --name: a trial of part of it
WORK = Path(arg('work', '/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad/mk2/film')); WORK.mkdir(parents=True, exist_ok=True)
CAPTION = ['The voices in this film are synthetic.', 'Kokoro-82M, run offline: a different voice for each character.',
           'The studio, the figures and every movement: LDraw parts, staged and performed by the Odyssey\'s own engine.']
CRF = arg('crf', '26')   # the joined film under GitHub's 100 MB file limit
END = 6.0   # seconds of end caption over the last shot
def ff(*a): subprocess.run(['nice', FF, '-v', 'error', '-y', *a], check=True)
def dur(p):
    e = subprocess.run([FF, '-i', str(p)], capture_output=True, text=True).stderr
    h, m, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', e).groups(); return int(h) * 3600 + int(m) * 60 + float(s)
def stamp(s): h, m = int(s // 3600), int(s // 60) % 60; return f'{h:02d}:{m:02d}:{s % 60:06.3f}'
def parse_vtt(p):
    out = []
    for b in Path(p).read_text().split('\n\n')[1:]:
        m = re.search(r'([\d:.]+) --> ([\d:.]+)\n(.*)', b, re.S)
        if not m: continue
        t = lambda x: sum(float(v) * k for v, k in zip(x.split(':'), (3600, 60, 1)))
        out.append((t(m[1]), t(m[2]), m[3].strip()))
    return out

def caption_png(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); g = ImageDraw.Draw(im)
    try: f1 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 21)
    except Exception: f1 = f2 = ImageFont.load_default()
    g.rectangle([0, h - 150, w, h], fill=(12, 12, 16, 215))
    for i, (txt, f) in enumerate(zip(CAPTION, (f1, f2, f2))):
        tw = g.textlength(txt, font=f); g.text(((w - tw) / 2, h - 136 + i * 40), txt, font=f, fill=(255, 236, 160, 255) if i == 0 else (235, 235, 235, 255))
    return im

if __name__ == '__main__':
    parts, caps, off, info = [], [], 0.0, []
    for i, s in enumerate(SCENES):
        src = F / f'{s}-performed.mp4'; d = dur(src); seg = WORK / f'{s}.mp4'
        fo = f'fade=t=in:st=0:d=0.5,fade=t=out:st={d - 0.5:.3f}:d=0.5'
        afo = f'afade=t=in:st=0:d=0.4,afade=t=out:st={d - 0.5:.3f}:d=0.5'
        if i == len(SCENES) - 1:   # the end caption: the last shot held END seconds more (the scene's own captions are burned into its frames), the caption over the hold
            png = WORK / 'caption.png'; caption_png(1280, 720).save(png)
            ff('-i', str(src), '-loop', '1', '-i', str(png), '-filter_complex', f'[0:v]tpad=stop_mode=clone:stop_duration={END}[h];[1:v]format=rgba,fade=t=in:st={d:.3f}:d=0.8:alpha=1[c];[h][c]overlay=0:0:shortest=1:enable=\'gte(t,{d:.3f})\',fade=t=in:st=0:d=0.5,fade=t=out:st={d + END - 0.8:.3f}:d=0.8[v]',
               '-map', '[v]', '-map', '0:a', '-af', f'apad=pad_dur={END},afade=t=in:st=0:d=0.4,afade=t=out:st={d + END - 1.5:.3f}:d=1.5', '-t', f'{d + END:.3f}', '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '12', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', str(seg))
            d += END
        else:
            ff('-i', str(src), '-vf', fo, '-af', afo, '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '12', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', str(seg))
        parts.append(seg)
        for a, b, t in parse_vtt(F / f'{s}-performed.vtt'): caps.append((a + off, b + off, t))
        info.append(dict(scene=s, at=round(off, 2), seconds=round(d, 2), shots=len(json.loads((F / f'{s}-performed.json').read_text()).get('shots', []))))
        off += d
    lst = WORK / 'list.txt'; lst.write_text(''.join(f"file '{p}'\n" for p in parts))
    NAME = arg('name', 'making-of'); out = F / f'{NAME}.mp4'
    ff('-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', '-movflags', '+faststart', str(out))
    total = dur(out)
    caps.append((total - END + 0.3, total, '<i>' + ' '.join(CAPTION) + '</i>'))
    (F / f'{NAME}.vtt').write_text('WEBVTT\n\n' + '\n'.join(f'{i + 1}\n{stamp(a)} --> {stamp(min(b, total))}\n{t}\n' for i, (a, b, t) in enumerate(caps)))
    ps, pt = arg('poster-scene', 'OD-B25-S01'), float(arg('poster-t', '50'))
    ff('-ss', f'{pt:.2f}', '-i', str(F / f'{ps}-performed.mp4'), '-frames:v', '1', '-q:v', '3', str(F / f'{NAME}.jpg'))
    (F / f'{NAME}.json').write_text(json.dumps(dict(title='The making of the LEGO Odyssey: a LEGO film', seconds=round(total, 2), size=[1280, 720], fps=12,
        scenes=info, voices='Kokoro-82M (kokoro_onnx, offline): the director bm_george, the agent af_heart, the cinematographer am_michael, Odysseus am_onyx, the examiner bf_emma',
        made_by='tools/making/studio.py, keys.py, lego_script.py, voices.py; tools/perform/scenes/OD-B25-S0N.js; tools/cinematographer/plan.js; tools/export-odyssey.js; tools/making/lego_film.py',
        facts='odyssey/forensics/findings.json (generated at 0c780fb2)'), indent=1))
    print('making-of.mp4', round(total, 1), 's,', len(caps), 'captions')
