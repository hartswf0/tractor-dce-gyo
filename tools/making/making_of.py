#!/usr/bin/env python3
"""tools/making/making_of.py — the behind-the-scenes film films/odyssey/making-of.mp4 (with .vtt captions and .jpg poster),
assembled only from existing material: the films and their kept takes, the keyframe stills, screenshots of the choreography and
performance pages, the cinematographer's dev stills, and title cards drawn as HTML in chromium. Narration: Kokoro-82M (offline
TTS, kokoro_onnx), a synthetic voice, with the films' own sound low under it.

  NODE_PATH=<playwright node_modules> PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
  python3 tools/making/making_of.py --work <scratch dir> --tts <dir with kokoro-q8.onnx, voices.npz, pyk/> [--short]
Pages must be served at http://localhost:8931/ (python3 -m http.server 8931) for the screenshots, which go in <work>/shots."""
import json, os, re, subprocess, sys, wave, html, shutil
import numpy as np, imageio_ffmpeg
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
FF = imageio_ffmpeg.get_ffmpeg_exe()
A = sys.argv; arg = lambda k, d=None: A[A.index('--' + k) + 1] if '--' + k in A else d
WORK = os.path.abspath(arg('work')); TTS = os.path.abspath(arg('tts')); SHORT = '--short' in A
os.makedirs(WORK + '/seg', exist_ok=True); os.makedirs(WORK + '/png', exist_ok=True); os.makedirs(WORK + '/vo', exist_ok=True)
F = R + '/films/odyssey/'; TK = F + 'takes/'
W, H, FPS = 1280, 720, 24
VOICE, SPEED = 'af_heart', 0.95
def ff(*a): subprocess.run(['nice', FF, '-v', 'error', '-y', *a], check=True)

# ---------------------------------------------------------------- the film, segment by segment
CARD, IMG, CLIP, PAIR, MONT = 'card', 'img', 'clip', 'pair', 'mont'
SEGS = [
 dict(k=CARD, card='title', n="This is a LEGO film about making a LEGO film. Homer's Odyssey, built from LEGO bricks, and taught, one scene at a time, to act."),
 dict(k=CARD, card='ch', num='1', t='The problem', c='#c91a09', n="It began with a problem."),
 dict(k=CLIP, f=F + 'OD-B01-S03.mp4', a=8.5, label='The first animatic · 27 September', n="The first scene had almost everything a film needs: a set built from real LEGO parts, recorded voices, faces that move their lips, captions and music. Athena waits at the gate, disguised as a stranger. And the characters do nothing at all. Nobody turns. Nobody moves."),
 dict(k=PAIR, l=(F + 'OD-B01-S03.mp4', 40.5, 'The animatic'), r=(F + 'OD-B01-S03-performed.mp4', 32.5, 'Performed, three days later'), n="Here is the same moment, three days later. Telemachus sees the stranger, rises, crosses the hall, welcomes her, and takes her spear. Every one of those movements now has a reason. This is how it got there."),
 dict(k=CARD, card='ch', num='2', t='How a scene is made', c='#f2cd37', n="Every scene starts as a card."),
 dict(k=CARD, card='forage', n="A card says who is there, where they stand, and what is said. The cast are minifigures assembled from real parts, and the set is foraged from community LEGO models, checked stud by stud, so that every piece could really be built."),
 dict(k=IMG, img=R + '/odyssey/keyframes/OD-B01-S03/sheet.jpg', label='Keyframes · the beats of the story', n="Then a handful of keyframe stills fix the beats of the story: Athena arrives, the suitors feast, Telemachus notices her, and he welcomes her. Each still is checked against the words of the poem."),
 dict(k=IMG, img='SHOT:cho-1.png', label='The dope sheet · acting keyed by hand', n="The first acting was keyed by hand, on a dope sheet, channel by channel, against the voice. The figures moved, but they moved without reasons."),
 dict(k=IMG, img='SHOT:perf-3.png', label='The score · voice, intent, body', n="So the score was rewritten in lanes, read from the top down. First the voice: what is said. Then the intent: what each character wants. Then the body: the head, the arms, the weight, that carry it out. Every movement must point back to a cause."),
 dict(k=IMG, img='SHOT:perf-2.png', label='The performance engine', n="The performance engine compiles those intents into the bodies on the rigs, and measures what it made. Movement with no cause is a defect. A stillness needs a reason."),
 dict(k=CARD, card='ch', num='3', t='The cinematographer', c='#0055bf', n="Then a camera has to find the performance."),
 dict(k=CARD, card='dev', n="The cinematographer chooses its shots from the score. It goes where the action is hottest, cuts when the action moves, and tests every camera against the set. Marks on the bodies show what a camera can see, and every finished film is checked on a contact sheet: one frame from every shot."),
 dict(k=PAIR, l=(TK + 'OD-B05-S04/take1.mp4', 6.5, 'Take 1'), r=(F + 'OD-B05-S04-performed.mp4', 6.5, 'Take 2'), title='The Raft', n="Still, a camera can be wrong. On the raft, Calypso stood pressed against Odysseus, and her lines played behind his head and his bow. In the new take they stand a step apart, and she speaks on her own face."),
 dict(k=PAIR, l=(TK + 'OD-B08-S05/take1.mp4', 9, 'Take 1'), r=(F + 'OD-B08-S05-performed.mp4', 6, 'Take 2'), title='The Horse Song', n="The Horse Song held one wide of a wooden horse for fifty seconds, because the man the song is about had not been drawn yet. The new take moves into the king's hall, where Odysseus weeps, and the king notices."),
 dict(k=PAIR, l=(TK + 'OD-B11-S07/take1.mp4', 29.5, 'Take 1'), r=(F + 'OD-B11-S07-performed.mp4', 29.5, 'Take 2'), title='Achilles among the dead', n="In the land of the dead, Achilles never said the line the scene is famous for. Now he answers, on a close of his own face: he would rather be a hired man, alive, than king over all the dead. And the dead are drawn as pale shades."),
 dict(k=CARD, card='ch', num='4', t='New tricks for the engine', c='#237841', n="Some fixes needed the engine to learn something new."),
 dict(k=CLIP, f=F + 'OD-B17-S05-performed.mp4', a=43.5, label='New · props in flight', n="A thrown thing can fly. Antinous seizes the footstool, and it is seen in the air, on its arc, to the beggar's shoulder."),
 dict(k=CLIP, f=F + 'OD-B09-S06-performed.mp4', a=10.5, label='New · set pieces carried', n="A set piece can be carried. The giant's great stone moves with his arms into the mouth of the cave."),
 dict(k=CLIP, f=F + 'OD-B11-S04-performed.mp4', a=42, label='New · shades', n="And the dead are shades. Three times Odysseus reaches for his mother, and three times his arms pass through her."),
 dict(k=CARD, card='ch', num='5', t='Nothing thrown away', c='#fe8a18', n="None of the old takes are thrown away. Each one is kept beside the take that replaced it, with a note on what changed, and why."),
 dict(k=MONT, films=['OD-B01-S01', 'OD-B02-S02', 'OD-B04-S04', 'OD-B05-S05', 'OD-B09-S09-performed-shot', 'OD-B10-S01', 'OD-B12-S03', 'OD-B12-S04', 'OD-B12-S07', 'OD-B14-S01', 'OD-B19-S04', 'OD-B22-S01', 'OD-B24-S03', 'OD-B23-S04'], each=2.4,
      n="Thirty-three takes of sixteen scenes, and forty-four performed films, from the council of the gods to the bed that cannot be moved. The Odyssey, in LEGO, learning to act."),
 dict(k=CARD, card='end', n="The narration you have been hearing is a synthetic voice."),
]
if SHORT:   # the short cut (about 45 s): the problem, the answer, a re-shoot, the features, the montage
    keep = [0, 2, 3, 13, 16, 18, 20, 21]
    SEGS = [dict(SEGS[i]) for i in keep]
    SEGS[0]['n'] = "A LEGO film about making a LEGO film."
    SEGS[1]['n'] = "In the first scene, the characters did nothing at all."
    SEGS[2]['n'] = "Three days later, the same moment, performed: every movement with a reason."
    SEGS[3]['n'] = "Then the camera was taught to find the performance, and scenes were shot again."
    SEGS[4]['n'] = "The engine learned new things: a stool can fly,"
    SEGS[5]['n'] = "and the dead are shades."
    SEGS[6]['n'] = "Every take is kept. The Odyssey, in LEGO, learning to act."; SEGS[6]['films'] = SEGS[6]['films'][:8]; SEGS[6]['each'] = 1.6
    SEGS[7]['n'] = "The narration is a synthetic voice."

# ---------------------------------------------------------------- cards (HTML -> PNG in chromium)
CSS = """<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@500;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}html,body{margin:0;width:1280px;height:720px;overflow:hidden}
body{font-family:Inter,'DejaVu Sans',sans-serif;color:#141414;background:#f4f4f0}
.plate{position:absolute;inset:0;background-color:var(--bg,#f4f4f0);background-image:radial-gradient(circle at 20px 20px, rgba(255,255,255,.22) 0 9px, rgba(0,0,0,.10) 9.5px 11px, transparent 11.5px);background-size:40px 40px}
.brick{position:relative;border-radius:6px;box-shadow:inset 0 -10px 0 rgba(0,0,0,.18), 0 10px 0 rgba(0,0,0,.12)}
.brick::before{content:'';position:absolute;top:-16px;left:0;right:0;height:16px;background-image:radial-gradient(ellipse 15px 9px at 50% 100%, var(--c) 0 98%, transparent 100%);background-size:56px 16px;background-position:12px 0;background-repeat:repeat-x}
h1,h2{font-family:'Cormorant Garamond','DejaVu Serif',Georgia,serif;font-weight:700;margin:0;letter-spacing:-.01em;line-height:.95}
.k{text-transform:uppercase;letter-spacing:.22em;font-weight:700;font-size:20px}
</style>"""
def card_html(s):
    c = s.get('card')
    if c == 'title':
        return f"""<div class="plate" style="--bg:#0055bf"></div>
<div class="brick" style="--c:#f2cd37;position:absolute;left:110px;top:170px;width:1060px;height:300px;background:#f2cd37;padding:40px 54px">
<div class="k" style="color:#7a5c00">The Odyssey in LEGO &middot; behind the scenes</div>
<h1 style="font-size:96px;margin-top:18px">How the Odyssey<br>learned to act</h1></div>
<div style="position:absolute;left:110px;top:520px;color:#fff;font-size:30px;font-weight:500">A LEGO film about making a LEGO film</div>
<div style="position:absolute;left:110px;top:570px;display:flex;gap:14px">{''.join(f'<div class="brick" style="--c:{x};background:{x};width:74px;height:30px"></div>' for x in ['#c91a09','#f2cd37','#237841','#fe8a18','#f4f4f0'])}</div>"""
    if c == 'ch':
        return f"""<div class="plate" style="--bg:#f4f4f0"></div>
<div class="brick" style="--c:{s['c']};position:absolute;left:110px;top:250px;width:220px;height:220px;background:{s['c']};display:flex;align-items:center;justify-content:center">
<h1 style="font-size:180px;color:{'#141414' if s['c'] in ('#f2cd37','#fe8a18') else '#fff'}">{s['num']}</h1></div>
<div style="position:absolute;left:380px;top:270px;width:800px"><div class="k" style="color:#0033cc">Behind the scenes &middot; part {s['num']}</div>
<h1 style="font-size:92px;margin-top:14px">{html.escape(s['t'])}</h1></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:22px;background:#141414"></div>"""
    if c == 'forage':
        th = R + '/odyssey/thumbs/'
        figs = [('character.athena-as-mentes', 'Athena as Mentes'), ('character.telemachus', 'Telemachus'), ('character.antinous', 'Antinous'), ('character.penelope', 'Penelope'), ('prop.athenas-bronze-spear', 'the bronze spear')]
        tiles = ''.join(f'<div style="background:#fff;border:3px solid #141414;padding:5px;width:140px"><img src="file://{th}{f}.webp" style="width:100%;height:112px;object-fit:contain;display:block"><div style="font-size:15px;font-weight:700;margin-top:4px">{n}</div></div>' for f, n in figs)
        return f"""<div class="plate" style="--bg:#237841"></div>
<div style="position:absolute;left:60px;top:40px;color:#fff"><div class="k">The card &middot; who, where, what is said</div><h1 style="font-size:64px;margin-top:6px">Foraged from real LEGO</h1></div>
<div style="position:absolute;left:60px;top:170px;width:640px;border:4px solid #141414;background:#000"><img src="file://{R}/odyssey/kits/the-opening/gate.jpg" style="width:100%;display:block"><div style="background:#f2cd37;padding:6px 10px;font-weight:700">The set: the gate of Odysseus's house, Ithaca</div></div>
<div style="position:absolute;left:740px;top:170px;width:480px;display:flex;flex-wrap:wrap;gap:12px">{tiles}</div>
<div style="position:absolute;left:60px;bottom:30px;color:#fff;font-size:20px">582 cards &middot; 103,879 pieces &middot; every stud joint checked</div>"""
    if c == 'dev':
        return f"""<div class="plate" style="--bg:#141414"></div>
<div style="position:absolute;left:60px;top:36px;color:#fff"><div class="k" style="color:#f2cd37">The cinematographer&rsquo;s working stills</div><h1 style="font-size:46px;margin-top:6px">Marks on the bodies, a frame from every shot</h1></div>
<div style="position:absolute;left:60px;top:180px;width:1160px;border:4px solid #f2cd37"><img src="file://{WORK}/dev-marks.jpg" style="width:100%;display:block"></div>
<div style="position:absolute;left:60px;top:540px;width:1160px;border:4px solid #fff"><img src="file://{WORK}/dev-sheet.jpg" style="width:100%;display:block"></div>
<div style="position:absolute;left:60px;bottom:14px;color:#bbb;font-size:16px">Argos, from tools/cinematographer/dev.js: the marks a camera tests (head, crown, feet), and the contact sheet of the re-shot cut</div>"""
    if c == 'end':
        return f"""<div class="plate" style="--bg:#c91a09"></div>
<div class="brick" style="--c:#f4f4f0;position:absolute;left:110px;top:150px;width:1060px;height:380px;background:#f4f4f0;padding:40px 54px">
<div class="k" style="color:#0033cc">The Odyssey in LEGO</div><h1 style="font-size:78px;margin-top:14px">How the Odyssey learned to act</h1>
<p style="font-size:24px;margin:26px 0 0;color:#333">Every take side by side: <b>odyssey/making</b></p>
<p style="font-size:20px;margin:14px 0 0;color:#5d5a52">Narration: a synthetic voice (Kokoro-82M, offline). Films: the performance engine and the cinematographer, rendered from LDraw models.</p></div>"""
    if c == 'pairbg':
        lab = lambda x, col: f'<div class="brick" style="--c:{col};background:{col};padding:8px 16px;font-weight:700;font-size:24px;color:{"#141414" if col=="#f2cd37" else "#fff"}">{html.escape(x)}</div>'
        return f"""<div class="plate" style="--bg:#141414"></div>
<div style="position:absolute;left:24px;top:40px;color:#fff"><h1 style="font-size:60px">{html.escape(s.get('title') or '')}</h1></div>
<div style="position:absolute;left:24px;top:150px">{lab(s['l'][2], '#f2cd37')}</div><div style="position:absolute;left:656px;top:150px">{lab(s['r'][2], '#237841')}</div>
<div style="position:absolute;left:0;right:0;bottom:0;height:22px;background:#c91a09"></div>"""
    if c == 'label':
        return f"""<style>html,body{{background:transparent!important}}</style><div class="brick" style="--c:#f2cd37;position:absolute;left:28px;top:30px;background:#f2cd37;padding:10px 18px;font-weight:700;font-size:24px">{html.escape(s['text'])}</div>"""
    if c == 'imgframe':
        return f"""<div class="plate" style="--bg:#d8d6ce"></div><div style="position:absolute;left:40px;top:96px;right:40px;bottom:24px;display:flex;align-items:center;justify-content:center"><img src="file://{s['img']}" style="max-width:100%;max-height:100%;border:4px solid #141414;box-shadow:0 8px 0 rgba(0,0,0,.2)"></div>
<div class="brick" style="--c:#f2cd37;position:absolute;left:40px;top:26px;background:#f2cd37;padding:8px 16px;font-weight:700;font-size:26px">{html.escape(s['label'])}</div>"""
    raise ValueError(c)

def render_cards(jobs):   # jobs: [(name, html, transparent)]
    js = WORK + '/render.js'; spec = WORK + '/cards.json'
    for n, h, t in jobs: open(f'{WORK}/png/{n}.html', 'w').write('<!doctype html><meta charset="utf-8">' + CSS + h)
    json.dump([[f'{WORK}/png/{n}.html', f'{WORK}/png/{n}.png', t] for n, h, t in jobs], open(spec, 'w'))
    open(js, 'w').write("""const { chromium } = require('playwright'); const J = require(process.argv[2]);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
for (const [src, out, t] of J) { await p.goto('file://' + src, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {}); await p.waitForTimeout(300); await p.screenshot({ path: out, omitBackground: !!t }); }
await b.close(); })();""")
    subprocess.run(['nice', 'node', js, spec], check=True)

# ---------------------------------------------------------------- narration
sys.path.insert(0, TTS + '/pyk')
def say(text, out):
    if os.path.exists(out) and open(out + '.txt').read() == text if os.path.exists(out + '.txt') else False: return
    from kokoro_onnx import Kokoro
    global KK
    if 'KK' not in globals(): KK = Kokoro(TTS + '/kokoro-q8.onnx', TTS + '/voices.npz')
    s, sr = KK.create(text, voice=VOICE, speed=SPEED, lang='en-us')
    s = np.clip(s, -1, 1); w = wave.open(out, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((s * 32767).astype('<i2').tobytes()); w.close()
    open(out + '.txt', 'w').write(text)
def wavdur(f): w = wave.open(f); return w.getnframes() / w.getframerate()

# ---------------------------------------------------------------- build
def main():
    tag = 'short' if SHORT else 'full'
    # stills
    sp = '/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad'
    for a, b in ((sp + '/dev-b17/marks.jpg', 'dev-marks.jpg'), (sp + '/dev-b17/r2.jpg', 'dev-sheet.jpg')):
        if os.path.exists(a) and not os.path.exists(WORK + '/' + b): shutil.copy(a, WORK + '/' + b)
    jobs = []
    for i, s in enumerate(SEGS):
        if s['k'] == CARD: jobs.append((f'{tag}{i:02d}', card_html(s), False))
        if s['k'] == PAIR: jobs.append((f'{tag}{i:02d}', card_html(dict(s, card='pairbg')), False))
        if s['k'] == IMG:
            img = s['img'].replace('SHOT:', WORK + '/shots/')
            jobs.append((f'{tag}{i:02d}', card_html(dict(card='imgframe', img=img, label=s['label'])), False))
        if s['k'] == CLIP: jobs.append((f'{tag}{i:02d}L', card_html(dict(card='label', text=s['label'])), True))
        if s['k'] == MONT:
            for j, fm in enumerate(s['films']):
                jo = json.load(open(F + (fm if fm.endswith('shot') else fm + '-performed') + '.json')) if False else None
                jobs.append((f'{tag}{i:02d}M{j:02d}', card_html(dict(card='label', text=TITLES.get(fm) or TITLES.get(fm.split('-performed')[0], fm))), True))
    render_cards(jobs)
    cues = []; t0 = 0.0; parts = []
    for i, s in enumerate(SEGS):
        vo = f'{WORK}/vo/{tag}{i:02d}.wav'; say(s['n'], vo); nd = wavdur(vo)
        lead = 0.5; D = round(max(nd + lead + 0.9, 3.0 if s['k'] == CARD else 4.0), 2)
        if s['k'] == MONT: D = max(D, len(s['films']) * s['each'])
        out = f'{WORK}/seg/{tag}{i:02d}.mp4'; png = f'{WORK}/png/{tag}{i:02d}.png'
        vf_tail = f'fps={FPS},format=yuv420p'
        if s['k'] in (CARD, IMG):
            z = 'zoompan=z=\'min(1+0.0006*on,1.06)\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=1:s=1280x720:fps=24' if s['k'] == IMG else 'scale=1280:720'
            ff('-loop', '1', '-framerate', str(FPS), '-t', str(D), '-i', png, '-i', vo, '-filter_complex',
               f'[0:v]{z},{vf_tail}[v];[1:a]adelay={int(lead*1000)}|{int(lead*1000)},aresample=48000,aformat=channel_layouts=stereo,apad[a]', '-map', '[v]', '-map', '[a]', '-t', str(D), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', out)
        elif s['k'] == CLIP:
            ff('-ss', str(s['a']), '-t', str(D), '-i', s['f'], '-i', f'{WORK}/png/{tag}{i:02d}L.png', '-i', vo, '-filter_complex',
               f'[0:v]scale=1280:720,fps={FPS},tpad=stop_mode=clone:stop_duration=30[b];[b][1:v]overlay=0:0,{vf_tail}[v];'
               f'[0:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.13,apad[sa];[2:a]adelay={int(lead*1000)}|{int(lead*1000)},aresample=48000,aformat=channel_layouts=stereo,apad[na];[sa][na]amix=inputs=2:normalize=0[a]',
               '-map', '[v]', '-map', '[a]', '-t', str(D), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', out)
        elif s['k'] == PAIR:
            (lf, la, _), (rf, ra, _) = s['l'], s['r']
            ff('-loop', '1', '-framerate', str(FPS), '-t', str(D), '-i', png, '-ss', str(la), '-t', str(D), '-i', lf, '-ss', str(ra), '-t', str(D), '-i', rf, '-i', vo, '-filter_complex',
               f'[1:v]scale=616:347,fps={FPS},tpad=stop_mode=clone:stop_duration=30[l];[2:v]scale=616:347,fps={FPS},tpad=stop_mode=clone:stop_duration=30[r];'
               f'[0:v][l]overlay=24:214[x];[x][r]overlay=640:214,{vf_tail}[v];'
               f'[2:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.12,apad[sa];[3:a]adelay={int(lead*1000)}|{int(lead*1000)},aresample=48000,aformat=channel_layouts=stereo,apad[na];[sa][na]amix=inputs=2:normalize=0[a]',
               '-map', '[v]', '-map', '[a]', '-t', str(D), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', out)
        elif s['k'] == MONT:
            each = D / len(s['films']); subs = []
            for j, fm in enumerate(s['films']):
                src = F + (fm if fm.endswith('shot') else fm + '-performed') + '.mp4'
                dur = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', subprocess.run([FF, '-i', src], capture_output=True, text=True).stderr).group(3)) + 60 * int(re.search(r'Duration: (\d+):(\d+)', subprocess.run([FF, '-i', src], capture_output=True, text=True).stderr).group(2))
                so = f'{WORK}/seg/{tag}{i:02d}m{j:02d}.mp4'
                ff('-ss', str(round(dur * MONT_AT.get(fm, 0.45), 2)), '-t', str(each), '-i', src, '-i', f'{WORK}/png/{tag}{i:02d}M{j:02d}.png', '-filter_complex',
                   f'[0:v]scale=1280:720,fps={FPS},tpad=stop_mode=clone:stop_duration=5[b];[b][1:v]overlay=0:0,{vf_tail}[v];[0:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.3,apad[a]',
                   '-map', '[v]', '-map', '[a]', '-t', str(each), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', so)
                subs.append(so)
            open(WORK + '/mont.txt', 'w').write(''.join(f"file '{x}'\n" for x in subs))
            ff('-f', 'concat', '-safe', '0', '-i', WORK + '/mont.txt', '-i', vo, '-filter_complex',
               f'[0:a]apad[sa];[1:a]adelay={int(lead*1000)}|{int(lead*1000)},aresample=48000,aformat=channel_layouts=stereo,apad[na];[sa][na]amix=inputs=2:normalize=0[a]',
               '-map', '0:v', '-map', '[a]', '-t', str(D), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', out)
        # captions: the narration split into sentences, timed by length
        sents = [x for x in re.split(r'(?<=[.!?:])\s+', s['n']) if x]; tot = sum(len(x) for x in sents); t = t0 + lead
        for x in sents:
            d = nd * len(x) / tot; cues.append((t, t + d, x)); t += d
        parts.append(out); t0 += D; print(f'{i:02d} {s["k"]:5s} {D:6.2f}s  (vo {nd:.1f})', flush=True)
    name = 'making-of-short' if SHORT else 'making-of'
    open(WORK + '/all.txt', 'w').write(''.join(f"file '{x}'\n" for x in parts))
    ff('-f', 'concat', '-safe', '0', '-i', WORK + '/all.txt', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', str(FPS),
       '-af', 'aresample=async=1,loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', F + name + '.mp4')
    ts = lambda x: f'{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{x % 60:06.3f}'
    open(F + name + '.vtt', 'w').write('WEBVTT\n\n' + ''.join(f'{k + 1}\n{ts(a)} --> {ts(b)}\n<v Narrator (synthetic voice)>{x}\n\n' for k, (a, b, x) in enumerate(cues)))
    ff('-ss', '0.5', '-i', F + name + '.mp4', '-frames:v', '1', '-q:v', '3', F + name + '.jpg')
    print('total', round(t0, 1), 's ->', F + name + '.mp4')

TITLES = {'OD-B01-S01': 'The Council of the gods', 'OD-B02-S02': 'The Assembly', 'OD-B04-S04': 'Inside the Horse', 'OD-B05-S05': 'The Storm and the Raft',
          'OD-B09-S09-performed-shot': 'The Blinding of Polyphemus', 'OD-B10-S01': 'Aeolus', 'OD-B12-S03': 'The Sirens', 'OD-B12-S04': 'Scylla',
          'OD-B12-S07': 'The Thunderbolt', 'OD-B14-S01': "The Swineherd's Dogs", 'OD-B19-S04': 'The Scar', 'OD-B22-S01': 'The Hall', 'OD-B24-S03': 'Odysseus Tests Laertes', 'OD-B23-S04': 'The Bed'}
MONT_AT = {}
if __name__ == '__main__': main()
