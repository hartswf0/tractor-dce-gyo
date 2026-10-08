#!/usr/bin/env python3
"""tools/metis/evidence.py — small sheets of a take for the Mētis scene record (odyssey/metis/evidence/<scene>/).

    python3 tools/metis/evidence.py films/odyssey/OD-B05-S05-performed-r2.mp4 odyssey/metis/evidence/OD-B05-S05 \
        --contact 3 --window gust:13.4:15.6 --window wave:22.4:25.2 [--cuts film.json] [--fps 12]

--contact s     one drawing every s seconds, the whole take, on one sheet (contact.jpg)
--window n:a:b  every drawing from a to b seconds on twos (close-<n>.jpg): the close-interval sheet of one beat
--cuts f.json   the drawing before and the drawing after every cut of the exporter's shot list (cuts.jpg): the continuity check
Tiles are 320x180, JPEG quality ~75, so each sheet stays small enough to keep in the repository."""
import json, os, subprocess, sys, imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()

def sheet(mp4, frames, out, cols=4):
    sel = '+'.join(f'eq(n\\,{f})' for f in frames)
    rows = (len(frames) + cols - 1) // cols
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', mp4, '-vf', f"select='{sel}',scale=320:180,tile={cols}x{rows}", '-frames:v', '1', '-q:v', '5', out], check=True)
    return out

def main():
    a = sys.argv[1:]; mp4, out = a[0], a[1]; os.makedirs(out, exist_ok=True)
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    fps = float(opt('--fps', 12)); dur = float(subprocess.run([FF, '-i', mp4], capture_output=True, text=True).stderr.split('Duration: ')[1].split(',')[0].split(':')[-1]) + 60 * int(subprocess.run([FF, '-i', mp4], capture_output=True, text=True).stderr.split('Duration: ')[1].split(':')[1])
    made = []
    if opt('--contact'):
        st = float(opt('--contact')); made.append(sheet(mp4, [int(i * st * fps) for i in range(int(dur / st))], os.path.join(out, 'contact.jpg'), 4))
    for i, k in enumerate(a):
        if k == '--window':
            n, t0, t1 = a[i + 1].split(':'); f0, f1 = int(float(t0) * fps), int(float(t1) * fps)
            made.append(sheet(mp4, list(range(f0, f1, 2))[:24], os.path.join(out, f'close-{n}.jpg'), 4))
    if opt('--cuts'):
        shots = json.load(open(opt('--cuts')))['shots']; fr = []
        for s in shots[1:]:
            c = int(round(s['t'] * fps)); fr += [max(0, c - 1), c]
        made.append(sheet(mp4, fr, os.path.join(out, 'cuts.jpg'), 4))
    print('\n'.join(made))

if __name__ == '__main__': main()
