"""The Odyssey, so far: every performed scene of Books 1-24 cut into one continuous film, in book order.

Usage:
    python3 tools/watch/assemble.py [--work DIR] [--only measure|plan|bridges|audio|video|all] [--part N]
    python3 tools/watch/build_watch.py          # then rebuild the watch page, which reads odyssey/watch/so-far.json

Rerun it whenever a film is added or re-shot; it rebuilds everything from films/odyssey/OD-Bxx-Syy-performed.{mp4,vtt}
(books 1-24 only; B25/B26 are making-of films). Per-film measurements are cached in --work (default
/tmp/odyssey-so-far) keyed by the film's size and mtime, so a rerun only re-measures films that changed.

What it does:
  * order: the scene list of tools/watch/build_watch.py (book order); each book opens with a 2.5 s bridge card,
    "Book N" and the BOOKS title in a light caption panel (like the films' own caption panels) over a blurred,
    darkened still of that book's first film. Missing scenes are skipped silently.
  * loudness: every film is measured with loudnorm (pass 1) and normalised to -19 LUFS integrated, -1.5 dBTP
    (pass 2, linear gain wherever the true peak allows it).
  * still tails: when a film ends on a still stretch (frame difference < 0.35 on a 128x72 grey copy, the same
    measure as the energy audit) lasting more than 1.5 s after both its last caption and its last movement, the tail
    is cut 0.8 s after that point, snapped to the quietest frame boundary within -0.1..+0.4 s so no word is clipped;
    the cut is never before the last cue's end.
  * transitions: 4-frame (0.33 s) dissolve and audio crossfade between scenes of one book; a 0.5 s dissolve into and
    out of each book bridge; 50 ms audio fades at every segment edge; the part fades in from and out to black.
  * picture: everything at 12 fps (24 fps films are decimated with fps=12), 1280x720, H.264 two-pass at the bitrate
    that keeps each part under ~86 MB, AAC 128k, +faststart. If one file would not fit at a sensible bitrate the film
    is cut in two parts, Books 1-12 and Books 13-24.
  * outputs: films/odyssey/the-odyssey-so-far[-partN].{mp4,vtt}, films/odyssey/the-odyssey-so-far.jpg (poster),
    odyssey/watch/so-far.json (parts, book and scene chapters with start times, trims, loudness).
"""
from pathlib import Path
import argparse, json, math, re, shutil, subprocess, sys, importlib.util
import numpy as np

REPO = Path(__file__).resolve().parents[2]
FILMS = REPO / 'films/odyssey'
spec = importlib.util.spec_from_file_location('build_watch', REPO / 'tools/watch/build_watch.py')
bw = importlib.util.module_from_spec(spec); spec.loader.exec_module(bw)
BOOKS = bw.BOOKS
FF = __import__('imageio_ffmpeg').get_ffmpeg_exe()

FPS = 12; SR = 48000; SPF = SR // FPS            # audio samples per video frame
W, H = 1280, 720
XF_SCENE = 4                                     # frames: dissolve between scenes of one book (0.33 s)
XF_BRIDGE = 6                                    # frames: dissolve into / out of a bridge (0.5 s)
BRIDGE_FRAMES = 30 + XF_BRIDGE                   # visible 2.5 s plus the overlaps (the first overlap is shared)
EDGE_FADE = 0.05                                 # s, audio fade at every segment edge
STILL = 0.35; STILL_TAIL = 1.5; KEEP_AFTER = 0.8
TARGET_I = -19.0; TARGET_TP = -1.5; TARGET_LRA = 11
PART_MB = 86.0; AUDIO_BPS = 128000; MIN_SINGLE_VBPS = 700000
SPLIT_AT_BOOK = 13
STEM = 'the-odyssey-so-far'
POSTER_FROM = 'OD-B23-S04-performed.jpg'
SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'


def run(args, **kw):
    return subprocess.run([FF, '-hide_banner', '-nostdin'] + args, check=True, **kw)

def films():
    rows = [r for r in bw.scenes() if r['film'] and r['book'] <= 24]
    return [dict(id=r['id'], book=r['book'], scene=r['scene'], title=r['title'],
                 mp4=FILMS / f"{r['id']}-performed.mp4", vtt=FILMS / f"{r['id']}-performed.vtt") for r in rows]

def read_vtt(path):
    cues, lines = [], (path.read_text(encoding='utf-8').split('\n') if path.exists() else [])
    i = 0
    while i < len(lines):
        m = re.match(r'(?:(\d+):)?(\d+):([\d.]+) --> (?:(\d+):)?(\d+):([\d.]+)', lines[i])
        if m:
            g = [float(x) if x else 0.0 for x in m.groups()]
            a = g[0] * 3600 + g[1] * 60 + g[2]; b = g[3] * 3600 + g[4] * 60 + g[5]
            body = []; i += 1
            while i < len(lines) and lines[i].strip():
                body.append(lines[i]); i += 1
            cues.append((a, b, '\n'.join(body)))
        i += 1
    return cues

def ts(t):
    t = max(0.0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t - h * 3600 - m * 60
    return f'{h:02d}:{m:02d}:{s:06.3f}'


# ---------------------------------------------------------------- measure
def measure_one(f):
    """Frames at 12 fps, per-frame motion, the audio envelope, loudnorm pass 1 and the vtt."""
    p = subprocess.run([FF, '-loglevel', 'error', '-i', str(f['mp4']), '-vf', f'fps={FPS},scale=128:72,format=gray',
                        '-f', 'rawvideo', '-'], capture_output=True, check=True)
    fr = np.frombuffer(p.stdout, np.uint8).reshape(-1, 72, 128).astype(np.int16)
    d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2)); d = np.concatenate([[d[0]], d])
    p = subprocess.run([FF, '-loglevel', 'error', '-i', str(f['mp4']), '-vn', '-ac', '1', '-ar', str(SR),
                        '-f', 's16le', '-'], capture_output=True, check=True)
    a = np.frombuffer(p.stdout, np.int16).astype(np.float32) / 32768
    win = SR // 50                                                  # 20 ms rms envelope
    env = np.sqrt((a[:len(a) // win * win].reshape(-1, win) ** 2).mean(axis=1) + 1e-12)
    p = subprocess.run([FF, '-hide_banner', '-nostdin', '-i', str(f['mp4']), '-vn', '-af',
                        f'loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True, check=True)
    ln = json.loads(p.stderr[p.stderr.rindex('{'):p.stderr.rindex('}') + 1])
    src_fps = subprocess.run([FF, '-hide_banner', '-i', str(f['mp4'])], capture_output=True, text=True).stderr
    m = re.search(r'Video:.*?, ([\d.]+) fps', src_fps)
    return dict(frames=int(len(fr)), motion=[round(float(x), 3) for x in d], env20ms=[round(float(x), 5) for x in env],
                audio_s=len(a) / SR, loudnorm=ln, src_fps=float(m.group(1)) if m else None)

def measure(work):
    cache_dir = work / 'measure'; cache_dir.mkdir(parents=True, exist_ok=True)
    out = []
    for f in films():
        st = f['mp4'].stat(); key = f"{st.st_size}-{int(st.st_mtime)}"
        cp = cache_dir / f"{f['id']}.json"
        m = json.loads(cp.read_text()) if cp.exists() else None
        if not m or m.get('key') != key:
            print('measure', f['id'], file=sys.stderr)
            m = measure_one(f); m['key'] = key; cp.write_text(json.dumps(m))
        out.append((f, m))
    return out


# ---------------------------------------------------------------- plan
def plan_tail(f, m):
    n = m['frames']; d = np.array(m['motion']); env = np.array(m['env20ms'])
    cues = read_vtt(f['vtt']); cue_end = max((c[1] for c in cues), default=0.0)
    tail = 0
    for x in d[::-1]:
        if x >= STILL: break
        tail += 1
    still_from = (n - tail) / FPS; dur = n / FPS
    anchor = max(cue_end, still_from)
    info = dict(id=f['id'], seconds=round(dur, 3), last_cue_end=round(cue_end, 3), still_from=round(still_from, 3),
                still_after_caption=round(dur - anchor, 3), frames=n, cut_frames=n, trimmed=0.0)
    if dur - anchor <= STILL_TAIL:
        return info
    target = anchor + KEEP_AFTER
    best = None
    for k in range(math.ceil((target - 0.1) * FPS), math.floor((target + 0.4) * FPS) + 1):
        t = k / FPS
        if t < cue_end + 0.25 or k >= n: continue
        i0, i1 = max(0, int((t - 0.04) * 50)), int((t + 0.04) * 50) + 1
        lvl = float(env[i0:i1].max()) if i1 <= len(env) and i0 < i1 else 0.0
        if best is None or lvl < best[1] - 1e-6: best = (k, lvl)
    if best is None: return info
    k, lvl = best
    speech = float(np.percentile(env, 90)) if len(env) else 1.0
    info.update(cut_frames=k, trimmed=round((n - k) / FPS, 3), cut_at=round(k / FPS, 3),
                level_at_cut_db=round(20 * math.log10(lvl + 1e-9), 1), speech_level_db=round(20 * math.log10(speech + 1e-9), 1))
    return info

def make_plan(measured):
    items = [dict(f=f, m=m, tail=plan_tail(f, m)) for f, m in measured]
    total_s = sum(it['tail']['cut_frames'] for it in items) / FPS
    single_vbps = PART_MB * 1e6 * 8 * 0.985 / total_s - AUDIO_BPS
    if single_vbps >= MIN_SINGLE_VBPS:
        groups = [(None, items)]
    else:
        groups = [(1, [it for it in items if it['f']['book'] < SPLIT_AT_BOOK]),
                  (2, [it for it in items if it['f']['book'] >= SPLIT_AT_BOOK])]
    parts = []
    for num, its in groups:
        segs = []; prev_book = None
        for it in its:
            if it['f']['book'] != prev_book:
                segs.append(dict(kind='bridge', book=it['f']['book'], first=it, frames=BRIDGE_FRAMES))
                prev_book = it['f']['book']
            segs.append(dict(kind='film', it=it, frames=it['tail']['cut_frames']))
        start = 0
        for i, s in enumerate(segs):
            s['start'] = start
            if i + 1 < len(segs):
                nxt = segs[i + 1]
                s['xf_out'] = XF_BRIDGE if 'bridge' in (s['kind'], nxt['kind']) else XF_SCENE
                start += s['frames'] - s['xf_out']
            else:
                s['xf_out'] = 0
        total = segs[-1]['start'] + segs[-1]['frames']
        stem = STEM if num is None else f'{STEM}-part{num}'
        parts.append(dict(num=num, stem=stem, segs=segs, frames=total))
    return parts


# ---------------------------------------------------------------- bridges
def make_bridge(book, first_mp4, dst):
    from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
    tmp = dst.with_suffix('.src.png')
    run(['-loglevel', 'error', '-y', '-ss', '0.25', '-i', str(first_mp4), '-frames:v', '1', '-vf', f'scale={W}:{H}', str(tmp)])
    im = Image.open(tmp).convert('RGB'); tmp.unlink()
    im = im.filter(ImageFilter.GaussianBlur(14))
    im = ImageEnhance.Brightness(im).enhance(0.55); im = ImageEnhance.Color(im).enhance(0.8)
    dr = ImageDraw.Draw(im)
    label = f'BOOK {book}'; title = BOOKS[book]
    fl = ImageFont.truetype(MONO, 21); size = 50
    ft = ImageFont.truetype(SERIF, size)
    while dr.textlength(title, font=ft) > 900 and size > 30:
        size -= 2; ft = ImageFont.truetype(SERIF, size)
    spaced = ' '.join(label)                                  # the caption panels' letter-spaced speaker label
    tw = max(dr.textlength(title, font=ft), dr.textlength(spaced, font=fl))
    pw, ph = int(tw + 120), int(size * 1.25 + 100)
    x0, y0 = (W - pw) // 2, (H - ph) // 2
    dr.rectangle([x0, y0, x0 + pw, y0 + ph], fill=(247, 247, 242), outline=(20, 20, 20), width=3)
    dr.text((W / 2, y0 + 32), spaced, font=fl, fill=(30, 30, 30), anchor='mm')
    dr.line([W / 2 - 30, y0 + 54, W / 2 + 30, y0 + 54], fill=(201, 26, 9), width=2)
    dr.text((W / 2, y0 + 58 + (ph - 58) / 2 - 4), title, font=ft, fill=(20, 20, 20), anchor='mm')
    im.save(dst)

def bridges(parts, work):
    bd = work / 'bridges'; bd.mkdir(parents=True, exist_ok=True)
    for p in parts:
        for s in p['segs']:
            if s['kind'] == 'bridge':
                s['png'] = bd / f"book{s['book']:02d}.png"
                make_bridge(s['book'], s['first']['f']['mp4'], s['png'])


# ---------------------------------------------------------------- graphs
def inputs_and_graph(p, want):
    """want = 'v' or 'a'. Returns ffmpeg input args and the filter graph text ending in [out]."""
    args, chains, labels = [], [], []
    for i, s in enumerate(p['segs']):
        n = s['frames']; ns = n * SPF
        if s['kind'] == 'bridge':
            if want == 'v':
                args += ['-loop', '1', '-framerate', str(FPS), '-t', f'{n / FPS + 1:.3f}', '-i', str(s['png'])]
                c = f'[{i}:v]fps={FPS},trim=end_frame={n},setpts=N/({FPS}*TB),format=yuv420p,setsar=1'
                if i == 0: c += f',fade=t=in:d={XF_BRIDGE / FPS:.4f}'
            else:
                args += ['-f', 'lavfi', '-t', f'{n / FPS + 1:.3f}', '-i', f'anullsrc=r={SR}:cl=stereo']
                c = f'[{i}:a]atrim=end_sample={ns},asetpts=N/SR/TB'
        else:
            it = s['it']; ln = it['m']['loudnorm']
            args += ['-i', str(it['f']['mp4'])]
            if want == 'v':
                c = (f'[{i}:v]fps={FPS},setpts=N/({FPS}*TB),scale={W}:{H}:flags=lanczos,setsar=1,format=yuv420p,'
                     f'tpad=stop_mode=clone:stop=24,trim=end_frame={n},setpts=N/({FPS}*TB)')
            else:
                c = (f'[{i}:a]aresample={SR},asetpts=N/SR/TB,'
                     f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:measured_I={ln['input_i']}:"
                     f"measured_TP={ln['input_tp']}:measured_LRA={ln['input_lra']}:measured_thresh={ln['input_thresh']}:"
                     f"offset={ln['target_offset']}:linear=true,aresample={SR},aformat=sample_fmts=fltp:channel_layouts=stereo,"
                     f'apad,atrim=end_sample={ns},asetpts=N/SR/TB,'
                     f'afade=t=in:d={EDGE_FADE},afade=t=out:st={n / FPS - EDGE_FADE:.4f}:d={EDGE_FADE}')
        if want == 'v':
            c += f',settb=1/{FPS},fps={FPS}'                     # xfade wants a declared constant frame rate
        if want == 'a' and s['kind'] == 'bridge':
            c += f',aformat=sample_fmts=fltp:channel_layouts=stereo'
        chains.append(c + f'[s{i}]'); labels.append(f's{i}')
    cur = labels[0]
    for i in range(1, len(labels)):
        prev = p['segs'][i - 1]; xf = prev['xf_out']; out = f'x{i}'
        if want == 'v':
            chains.append(f'[{cur}][{labels[i]}]xfade=transition=fade:duration={xf / FPS:.6f}:offset={p["segs"][i]["start"] / FPS:.6f}[{out}]')
        else:
            chains.append(f'[{cur}][{labels[i]}]acrossfade=ns={xf * SPF}:c1=tri:c2=tri[{out}]')
        cur = out
    T = p['frames'] / FPS
    if want == 'v':
        chains.append(f'[{cur}]fade=t=out:st={T - 0.6:.4f}:d=0.6,trim=end_frame={p["frames"]}[out]')
    else:
        chains.append(f'[{cur}]afade=t=out:st={T - 0.6:.4f}:d=0.6,atrim=end_sample={p["frames"] * SPF}[out]')
    return args, ';\n'.join(chains)

def encode_audio(p, work):
    args, g = inputs_and_graph(p, 'a')
    gf = work / f"{p['stem']}.a.graph"; gf.write_text(g)
    dst = work / f"{p['stem']}.m4a"
    run(['-loglevel', 'error', '-y'] + args + ['-filter_complex_script', str(gf), '-map', '[out]',
         '-c:a', 'aac', '-b:a', '128k', '-ar', str(SR), str(dst)])
    return dst

def encode_video(p, work, audio):
    args, g = inputs_and_graph(p, 'v')
    gf = work / f"{p['stem']}.v.graph"; gf.write_text(g)
    T = p['frames'] / FPS
    vk = int((PART_MB * 1e6 * 8 * 0.985 / T - AUDIO_BPS) / 1000)
    p['video_kbps'] = vk
    common = ['-filter_complex_script', str(gf), '-map', '[out]', '-c:v', 'libx264', '-preset', 'slower',
              '-tune', 'animation', '-b:v', f'{vk}k', '-maxrate', f'{vk * 3}k', '-bufsize', f'{vk * 6}k',
              '-pix_fmt', 'yuv420p', '-r', str(FPS), '-g', str(FPS * 10), '-passlogfile', str(work / p['stem'])]
    print(f"video {p['stem']}: {T:.1f} s at {vk} kb/s, pass 1", file=sys.stderr)
    run(['-loglevel', 'error', '-y'] + args + common + ['-pass', '1', '-an', '-f', 'null', '/dev/null'])
    print(f"video {p['stem']}: pass 2", file=sys.stderr)
    vid = work / f"{p['stem']}.v.mp4"
    run(['-loglevel', 'error', '-y'] + args + common + ['-pass', '2', '-an', str(vid)])
    dst = FILMS / f"{p['stem']}.mp4"
    run(['-loglevel', 'error', '-y', '-i', str(vid), '-i', str(audio), '-map', '0:v', '-map', '1:a', '-c', 'copy',
         '-movflags', '+faststart', '-shortest', str(dst)])
    vid.unlink()
    for x in work.glob(p['stem'] + '*.log*'): x.unlink()
    return dst


# ---------------------------------------------------------------- captions, chapters
def write_vtt_and_chapters(parts):
    out = dict(title='The Odyssey, so far', fps=FPS, target_lufs=TARGET_I, parts=[])
    for p in parts:
        lines = ['WEBVTT', '']; chapters = []; n = 0
        for s in p['segs']:
            t0 = s['start'] / FPS; t1 = (s['start'] + s['frames']) / FPS
            if s['kind'] == 'bridge':
                n += 1; lines += [str(n), f'{ts(t0)} --> {ts(t1 - XF_BRIDGE / FPS / 2)}', f"Book {s['book']} · {BOOKS[s['book']]}", '']
                chapters.append(dict(kind='book', book=s['book'], title=BOOKS[s['book']], t=round(t0, 3)))
            else:
                it = s['it']; f = it['f']; cut = s['frames'] / FPS
                for a, b, body in read_vtt(f['vtt']):
                    if a >= cut: continue
                    n += 1; lines += [str(n), f'{ts(t0 + a)} --> {ts(t0 + min(b, cut))}', body, '']
                xin = p['segs'][p['segs'].index(s) - 1]['xf_out'] if p['segs'].index(s) else 0
                chapters.append(dict(kind='scene', id=f['id'], book=f['book'], title=f['title'],
                                     t=round(t0 + xin / FPS / 2, 3), seconds=round(cut, 2)))
        (FILMS / f"{p['stem']}.vtt").write_text('\n'.join(lines), encoding='utf-8')
        mp4 = FILMS / f"{p['stem']}.mp4"
        books = sorted({s['book'] for s in p['segs'] if s['kind'] == 'bridge'})
        out['parts'].append(dict(part=p['num'], label=f'Books {books[0]}–{books[-1]}', src=f"../../films/odyssey/{p['stem']}.mp4",
                                 vtt=f"../../films/odyssey/{p['stem']}.vtt", poster=f'../../films/odyssey/{STEM}.jpg',
                                 seconds=round(p['frames'] / FPS, 2), bytes=mp4.stat().st_size if mp4.exists() else None,
                                 chapters=chapters))
    out['seconds'] = round(sum(p['seconds'] for p in out['parts']), 2)
    out['films'] = sum(1 for p in parts for s in p['segs'] if s['kind'] == 'film')
    out['trims'] = [dict(id=s['it']['tail']['id'], cut_at=s['it']['tail']['cut_at'], trimmed=s['it']['tail']['trimmed'],
                         last_cue_end=s['it']['tail']['last_cue_end'])
                    for p in parts for s in p['segs'] if s['kind'] == 'film' and s['it']['tail']['trimmed'] > 0]
    out['loudness_in'] = {s['it']['f']['id']: float(s['it']['m']['loudnorm']['input_i'])
                          for p in parts for s in p['segs'] if s['kind'] == 'film'}
    dst = REPO / 'odyssey/watch/so-far.json'
    dst.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--work', default='/tmp/odyssey-so-far')
    ap.add_argument('--only', default='all', choices=['measure', 'plan', 'bridges', 'audio', 'video', 'all'])
    ap.add_argument('--part', type=int, help='encode only this part (1 or 2)')
    a = ap.parse_args()
    work = Path(a.work); work.mkdir(parents=True, exist_ok=True)
    measured = measure(work)
    parts = make_plan(measured)
    summary = [dict(stem=p['stem'], seconds=round(p['frames'] / FPS, 2),
                    segs=[(s['kind'], s['book'] if s['kind'] == 'bridge' else s['it']['f']['id'], s['start'], s['frames']) for s in p['segs']])
               for p in parts]
    trims = [it for p in parts for s in p['segs'] if s['kind'] == 'film' for it in [s['it']['tail']]]
    (work / 'plan.json').write_text(json.dumps(dict(parts=summary, tails=trims), indent=1))
    print('plan:', ', '.join(f"{s['stem']} {s['seconds']:.1f}s" for s in summary), '| trimmed',
          sum(1 for t in trims if t['trimmed']), 'tails,', round(sum(t['trimmed'] for t in trims), 1), 's', file=sys.stderr)
    if a.only in ('measure', 'plan'): return
    bridges(parts, work)
    if a.only == 'bridges': return
    for p in parts:
        if a.part and p['num'] != a.part: continue
        audio = encode_audio(p, work)
        if a.only == 'audio': continue
        encode_video(p, work, audio); audio.unlink()
    shutil.copyfile(FILMS / POSTER_FROM, FILMS / f'{STEM}.jpg')
    o = write_vtt_and_chapters(parts)
    print('wrote', ', '.join(p['src'] for p in o['parts']), 'and odyssey/watch/so-far.json', file=sys.stderr)


if __name__ == '__main__':
    main()
