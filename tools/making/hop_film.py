#!/usr/bin/env python3
"""tools/making/hop_film.py — a Hearts of Plastic episode assembled from its performed render.

    python3 tools/making/hop_film.py OD-B26-S01 [--poster-t 70]

Reads films/odyssey/<sid>-performed.{mp4,vtt,json} (tools/export-odyssey.js, from the episode's take) and writes
films/odyssey/hearts-of-plastic-e<N>.{mp4,vtt,jpg,json}:
  - a title card (the episode, the set it is shot on, the experiment's hypothesis), drawn with PIL (this ffmpeg has no drawtext)
  - the dailies: wherever the script has the crew watch a real take (hop_script.py 'dailies'), that take's frames are cut in full
    frame over the episode's picture with a slate in the corner saying which take it is (the episode's room tone goes on under it)
  - the end caption over the held last shot: the voices are synthetic (Kokoro-82M, offline), and each gag's record
  - the captions (the scene's, with speakers; the dailies' slates; the end caption)"""
import json, re, subprocess, sys
from pathlib import Path
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont
REPO = Path(__file__).resolve().parents[2]; F = REPO / 'films/odyssey'; FF = imageio_ffmpeg.get_ffmpeg_exe()
sys.path.insert(0, str(Path(__file__).parent)); import lego_script as S
A = sys.argv; arg = lambda k, d=None: A[A.index('--' + k) + 1] if '--' + k in A else d
SID = next(a for a in A[1:] if a.startswith('OD-B26-'))
WORK = Path('/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad/hopfilm') / SID; WORK.mkdir(parents=True, exist_ok=True)
TITLE_S, END = 4.0, 7.0
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
def ff(*a): subprocess.run(['nice', FF, '-v', 'error', '-y', *a], check=True)
def dur(p):
    e = subprocess.run([FF, '-i', str(p)], capture_output=True, text=True).stderr
    h, m, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', e).groups(); return int(h) * 3600 + int(m) * 60 + float(s)
def stamp(s): return f'{int(s // 3600):02d}:{int(s // 60) % 60:02d}:{s % 60:06.3f}'
def parse_vtt(p):
    out = []
    for b in Path(p).read_text().split('\n\n')[1:]:
        m = re.search(r'([\d:.]+) --> ([\d:.]+)\n(.*)', b, re.S)
        if m: t = lambda x: sum(float(v) * k for v, k in zip(x.split(':'), (3600, 60, 1))); out.append((t(m[1]), t(m[2]), m[3].strip()))
    return out
def font(f, n): return ImageFont.truetype(f, n)
def centred(g, y, txt, f, fill, w=1280):
    g.text(((w - g.textlength(txt, font=f)) / 2, y), txt, font=f, fill=fill)

def title_png(sc, path):
    im = Image.new('RGB', (1280, 720), (14, 14, 18)); g = ImageDraw.Draw(im)
    for x in range(0, 1280, 40):   # a row of studs along the top and the foot, yellow on black
        for y in (34, 686): g.ellipse([x + 8, y - 12, x + 32, y + 12], fill=(242, 205, 55)); g.ellipse([x + 12, y - 8, x + 28, y + 8], outline=(200, 160, 30), width=2)
    centred(g, 150, 'HEARTS OF PLASTIC', font(SERIF, 76), (242, 205, 55))
    centred(g, 250, 'behind the scenes of the LEGO Odyssey', font(FONT, 26), (220, 220, 220))
    centred(g, 330, f"Episode {sc['episode']}  ·  {sc['title']}", font(BOLD, 44), (255, 255, 255))
    src = sc['location']; centred(g, 400, f"shot on the set of {src}", font(FONT, 24), (190, 190, 190))
    centred(g, 480, 'The experiment', font(BOLD, 24), (242, 205, 55))
    centred(g, 516, 'Hypothesis: ' + sc['hypothesis'], font(FONT, 26), (235, 235, 235))
    centred(g, 590, 'Every incident in this film is on the record.', font(FONT, 20), (170, 170, 170))
    im.save(path)

def slate_png(text, path):
    im = Image.new('RGBA', (1280, 720), (0, 0, 0, 0)); g = ImageDraw.Draw(im); f = font(BOLD, 20)
    w = g.textlength(text, font=f); g.rectangle([24, 22, 24 + w + 28, 62], fill=(10, 10, 12, 220)); g.rectangle([24, 22, 32, 62], fill=(220, 40, 40, 255))
    g.text((44, 30), text, font=f, fill=(255, 236, 160, 255))
    g.rectangle([0, 0, 1279, 719], outline=(10, 10, 12, 255), width=10)   # the monitor's bezel
    im.save(path)

def end_png(sc, path):
    lines = ['The voices are synthetic: Kokoro-82M, run offline, one voice for each character (the crew\'s as in the making-of).',
             'Every incident is from the record: the takes archive (films/odyssey/takes/index.json), the camera notes, the commits.',
             'The dailies are the real takes. The sets, figures and every movement: LDraw parts, staged and performed by the film\'s own engine.']
    im = Image.new('RGBA', (1280, 720), (0, 0, 0, 0)); g = ImageDraw.Draw(im)
    g.rectangle([0, 720 - 176, 1280, 720], fill=(12, 12, 16, 222))
    centred(g, 720 - 162, 'Hearts of Plastic  ·  Episode ' + str(sc['episode']) + ': ' + sc['title'], font(BOLD, 24), (255, 236, 160, 255))
    for i, t in enumerate(lines): centred(g, 720 - 118 + i * 34, t, font(FONT, 17), (235, 235, 235, 255))
    im.save(path)

if __name__ == '__main__':
    sc = S.SCENES[SID]; N = sc['episode']; tk = json.loads((REPO / 'odyssey/take/making' / (SID + '.json')).read_text()); hop = tk['hop']
    src = F / f'{SID}-performed.mp4'; d = dur(src)
    title_png(sc, WORK / 'title.png'); end_png(sc, WORK / 'end.png')
    # the title: the card, the room tone of the episode's first seconds under it
    ff('-loop', '1', '-t', f'{TITLE_S}', '-i', str(WORK / 'title.png'), '-f', 'lavfi', '-t', f'{TITLE_S}', '-i', 'anullsrc=r=48000:cl=stereo',
       '-vf', f'fade=t=in:st=0:d=0.6,fade=t=out:st={TITLE_S - 0.6}:d=0.6,format=yuv420p', '-r', '12', '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(WORK / 'title.mp4'))
    # the body: the dailies cut in over the picture, each with its slate; the end caption over the last shot held
    inputs = ['-i', str(src), '-loop', '1', '-i', str(WORK / 'end.png')]; fc = [f'[0:v]tpad=stop_mode=clone:stop_duration={END}[v0]']; cur = 'v0'
    for j, dl in enumerate(hop['dailies']):
        slate_png(dl['caption'], WORK / f'slate{j}.png')
        inputs += ['-ss', f"{dl['at']:.3f}", '-t', f"{dl['dur']:.3f}", '-i', str(REPO / dl['file']), '-loop', '1', '-t', f"{dl['dur']:.3f}", '-i', str(WORK / f'slate{j}.png')]
        k = 2 + 2 * j
        fc.append(f"[{k}:v]scale=1280:720,fps=12,setpts=PTS-STARTPTS+{dl['start']:.3f}/TB[dv{j}];[{k + 1}:v]format=rgba,setpts=PTS-STARTPTS+{dl['start']:.3f}/TB[ds{j}];[dv{j}][ds{j}]overlay=0:0:eof_action=pass[dd{j}]")
        fc.append(f"[{cur}][dd{j}]overlay=0:0:eof_action=pass:enable='between(t,{dl['start']:.3f},{dl['start'] + dl['dur'] - 0.01:.3f})'[w{j}]"); cur = f'w{j}'
    fc.append(f"[1:v]format=rgba,fade=t=in:st={d:.3f}:d=0.8:alpha=1[ec];[{cur}][ec]overlay=0:0:shortest=1:enable='gte(t,{d:.3f})',fade=t=in:st=0:d=0.4,fade=t=out:st={d + END - 0.8:.3f}:d=0.8,format=yuv420p[v]")
    # a dailies' own sound where the script asks for it (the take's voice is the point), laid in at its window
    aud = [(j, dl) for j, dl in enumerate(hop['dailies']) if dl.get('audio')]; amix = '[0:a]apad=pad_dur=%s' % END
    for n, (j, dl) in enumerate(aud):
        inputs += ['-ss', f"{dl['at']:.3f}", '-t', f"{dl['dur']:.3f}", '-i', str(REPO / dl['file'])]
        k = 2 + 2 * len(hop['dailies']) + n; ms = int(dl['start'] * 1000)
        fc.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.15,afade=t=out:st={dl['dur'] - 0.2:.3f}:d=0.2,adelay={ms}|{ms}[da{n}]")
    if aud: fc.append(amix + '[a0];[a0]' + ''.join(f'[da{n}]' for n in range(len(aud))) + f'amix=inputs={1 + len(aud)}:normalize=0,afade=t=out:st={d + END - 1.5:.3f}:d=1.5[a]')
    else: fc.append(amix + f',afade=t=out:st={d + END - 1.5:.3f}:d=1.5[a]')
    ff(*inputs, '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '[a]', '-t', f'{d + END:.3f}',
       '-c:v', 'libx264', '-crf', arg('crf', '24'), '-preset', 'medium', '-r', '12', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', str(WORK / 'body.mp4'))
    (WORK / 'list.txt').write_text(f"file '{WORK / 'title.mp4'}'\nfile '{WORK / 'body.mp4'}'\n")
    out = F / f'hearts-of-plastic-e{N}.mp4'
    ff('-f', 'concat', '-safe', '0', '-i', str(WORK / 'list.txt'), '-c', 'copy', '-movflags', '+faststart', str(out))
    total = dur(out)
    caps = [(0.2, TITLE_S - 0.2, f"<i>Hearts of Plastic. Episode {N}: {sc['title']}. Hypothesis: {sc['hypothesis']}</i>")]
    caps += [(a + TITLE_S, b + TITLE_S, t) for a, b, t in parse_vtt(F / f'{SID}-performed.vtt')]
    caps += [(dl['start'] + TITLE_S, dl['start'] + dl['dur'] + TITLE_S, '<i>' + dl['caption'] + '</i>') for dl in hop['dailies']]
    caps.append((total - END + 0.3, total, '<i>The voices are synthetic: Kokoro-82M, offline, one for each character. Every incident is from the record; the dailies are the real takes.</i>'))
    caps.sort()
    (F / f'hearts-of-plastic-e{N}.vtt').write_text('WEBVTT\n\n' + '\n'.join(f'{i + 1}\n{stamp(a)} --> {stamp(min(b, total))}\n{t}\n' for i, (a, b, t) in enumerate(caps)))
    pt = float(arg('poster-t', str(d / 2)))
    ff('-ss', f'{pt:.2f}', '-i', str(src), '-frames:v', '1', '-q:v', '3', str(F / f'hearts-of-plastic-e{N}.jpg'))
    perf = json.loads((F / f'{SID}-performed.json').read_text())
    shots = perf.get('shots', []); legal = sum(1 for s in shots if s.get('legal', True))
    voices = {k: dict(voice=v['voice'], speed=v['speed'], fx=v.get('fx')) for k, v in S.CAST.items() if any(l[1] == k for l in sc['lines'])}
    (F / f'hearts-of-plastic-e{N}.json').write_text(json.dumps(dict(title=f"Hearts of Plastic, episode {N}: {sc['title']}", episode=N, scene=SID, set=sc['location'], seconds=round(total, 2), size=[1280, 720], fps=12,
        hypothesis=sc['hypothesis'], shots=len(shots), legal=legal, dailies=hop['dailies'], evidence=[dict(gag=g, record=r) for g, r in sc['evidence']],
        voices=voices, voice_engine='Kokoro-82M (kokoro_onnx, q8 ONNX), offline', experiment=f'odyssey/experiments/{SID}.json',
        made_by='tools/making/hop.py, hop_script.py, hop_keys.py, voices.py, hop_shots.py; tools/perform/scenes/' + SID + '.js; tools/cinematographer/plan.js; tools/export-odyssey.js; tools/making/hop_film.py'), indent=1))
    print(out.name, round(total, 1), 's,', len(caps), 'captions')
