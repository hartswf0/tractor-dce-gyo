#!/usr/bin/env python3
"""odyssey/cascade/tools/beflix_plan.py — plan drawings (from above) of the BEFLIX LEGO builds, read from their LDraw files: every
98138 round tile drawn in its LDConfig colour at its stud, the 4186 baseplates light bluish grey beneath. The film strip is drawn
in two rows of six plates. Writes kit/cascade.beflix-flipbook-plan.png and kit/cascade.beflix-key-plan.png."""
import os
from PIL import Image, ImageDraw

KIT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'kit')
RGB = {15: (0xf4, 0xf4, 0xf4), 19: (0xd7, 0xba, 0x8c), 71: (0x96, 0x96, 0x96), 28: (0x89, 0x7d, 0x62), 72: (0x64, 0x64, 0x64), 0: (0x1b, 0x2a, 0x34)}


def plan(name, turn=False, px=8, ss=3):
    tiles, W, H = [], 0, 0
    for l in open(os.path.join(KIT, name + '.mpd')):
        f = l.split()
        if len(f) == 15 and f[0] == '1' and f[14] == '98138.dat':
            i, k = int(float(f[2]) // 20), int(float(f[4]) // 20)
            tiles.append((int(f[1]), i, k)); W, H = max(W, i + 1), max(H, k + 1)
    if turn:                                                   # the strip wrapped into two rows of six plates, for a page
        half = W // 2; tiles = [(c, i % half, k + (i // half) * (H + 4)) for c, i, k in tiles]; W, H = half, 2 * H + 4
    p = px * ss
    im = Image.new('RGB', (W * p, H * p), (83, 83, 83)); d = ImageDraw.Draw(im)
    for c, i, k in tiles:
        x, y, r = i * p + p / 2, k * p + p / 2, p * 0.46
        d.ellipse([x - r, y - r, x + r, y + r], fill=RGB.get(c, (200, 0, 200)))
    im = im.resize((W * px, H * px), Image.LANCZOS)
    out = os.path.join(KIT, name + '-plan.png'); im.save(out, optimize=True)
    print(out, im.size, len(tiles), 'tiles')


plan('cascade.beflix-flipbook', turn=True, px=5)
plan('cascade.beflix-key', px=7)
