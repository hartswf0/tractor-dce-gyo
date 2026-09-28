#!/usr/bin/env python3
"""tools/trailer-assemble.py: an animatic from the sample frames tools/export-trailer.js --mode animatic drew.

  python3 tools/trailer-assemble.py <frames>/jobs.json <sound.wav> <out.mp4> [--fps 24] [--xfade 0.12]

Each shot's samples (its start, middle and end frames) share the shot's duration equally; each is held for its share, and the
next dissolves in over --xfade seconds (inside a shot only: the cuts stay hard, as the edit list has them). The frames are
composited in numpy and piped to ffmpeg at --fps, muxed with the WAV (the full mix) and cut to the trailer's runtime.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return 'ffmpeg'


def main(argv):
    jobs_p, wav, out = argv[:3]
    opt = lambda k, d: float(argv[argv.index('--' + k) + 1]) if '--' + k in argv else d
    fps, xf = opt('fps', 24.0), opt('xfade', 0.12)
    J = json.load(open(jobs_p)); d = os.path.dirname(jobs_p); W, H = J['size']; R = J['runtime']
    by = {}
    for j in J['jobs']: by.setdefault(j['n'], []).append(j)
    segs = []   # (t0, t1, file, shot)
    for n, js in sorted(by.items()):
        js.sort(key=lambda j: j['u']); at, dur = js[0]['at'], js[0]['dur']; k = len(js)
        for i, j in enumerate(js): segs.append((at + dur * i / k, at + dur * (i + 1) / k, os.path.join(d, j['file']), n))
    cache = {}
    def img(f):
        if f not in cache:
            if len(cache) > 8: cache.pop(next(iter(cache)))
            cache[f] = np.asarray(Image.open(f).convert('RGB').resize((W, H)), dtype=np.float32)
        return cache[f]
    FF = ffmpeg(); tmp = out + '.video.mp4'
    p = subprocess.Popen([FF, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
    N = int(round(R * fps)); si = 0
    for i in range(N):
        t = (i + 0.5) / fps
        while si < len(segs) - 1 and t >= segs[si][1]: si += 1
        a = segs[si]; fr = img(a[2])
        # dissolve from the previous sample of the same shot over the first xf seconds of this one
        if si > 0 and segs[si - 1][3] == a[3] and t - a[0] < xf:
            w = (t - a[0]) / xf; fr = img(segs[si - 1][2]) * (1 - w) + fr * w
        p.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', tmp, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
                    '-t', f'{R:.3f}', '-movflags', '+faststart', out], check=True)
    os.unlink(tmp)
    print('animatic', out, f'{R:.2f} s, {len(segs)} samples, {N} frames at {fps:g} fps')


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
