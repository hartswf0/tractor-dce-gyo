#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Draw an LDraw MPD as an isometric picture, with no browser and no WebGL.

Every piece is drawn as its catalogue bounding box: three faces, painter-sorted.
It is not a beauty render — no studs, no bevels — but it is deterministic, fast,
and it always produces a picture, which is the point: you can see the massing,
the colours and the layout of a build without a viewer that can crash.

usage: python3 isorender.py <file.mpd> <out.png> [--title "text"] [--size 900x600]
       python3 isorender.py --sheet out.png f1.mpd:Label f2.mpd:Label ...
"""
import sys, os, re, math, json
from PIL import Image, ImageDraw, ImageFont

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
PARTS = {p['id']: p for p in json.load(open(os.path.join(REPO, 'nabugo-parts.json')))['parts']}

# ── LDraw colours from the vendored LDConfig.ldr
def load_colours():
    out = {}
    path = os.path.join(REPO, 'ldraw', 'LDConfig.ldr')
    if os.path.exists(path):
        for line in open(path, encoding='utf-8', errors='ignore'):
            m = re.search(r'!COLOUR\s+\S+\s+CODE\s+(\d+)\s+VALUE\s+#([0-9A-Fa-f]{6})', line)
            if m:
                out[int(m.group(1))] = tuple(int(m.group(2)[i:i+2], 16) for i in (0, 2, 4))
    out.setdefault(16, (180, 180, 180)); out.setdefault(24, (60, 60, 60))
    return out
COL = load_colours()

def resolve(pid):
    pid = pid.lower().replace('.dat', '')
    pid = pid.replace('\\', '/').rsplit('/', 1)[-1]      # parts/3010, s\3010s01 → 3010
    if pid in PARTS: return pid
    for suf in ('a', 'b', 'c', 'd'):
        if pid + suf in PARTS: return pid + suf
    if pid.endswith(('a', 'b', 'c', 'd')) and pid[:-1] in PARTS: return pid[:-1]
    return None

def mmul(a, b):
    return [sum(a[r*3+k] * b[k*3+c] for k in range(3)) for r in range(3) for c in range(3)]
def apply(m, v):
    return [m[0]*v[0]+m[1]*v[1]+m[2]*v[2], m[3]*v[0]+m[4]*v[1]+m[5]*v[2], m[6]*v[0]+m[7]*v[1]+m[8]*v[2]]

def parse(path):
    """MPD → flat placements [(part, colour, pos, mat)], submodels expanded."""
    text = open(path, encoding='utf-8', errors='ignore').read()
    blocks, cur, name = {}, [], None
    order = []
    for line in text.split('\n'):
        s = line.strip()
        if s.lower().startswith('0 file '):
            if name: blocks[name] = cur
            name = s[7:].strip().lower(); cur = []; order.append(name)
        elif s.startswith('1 '):
            cur.append(s)
    if name: blocks[name] = cur
    if not blocks: blocks['root'] = [l.strip() for l in text.split('\n') if l.strip().startswith('1 ')]; order = ['root']
    root = order[0]
    out = []
    def walk(bname, pos, mat, colour, depth=0):
        if depth > 12: return
        for s in blocks.get(bname, []):
            f = s.split()
            if len(f) < 15: continue
            try:
                c = int(f[1]); t = [float(x) for x in f[2:5]]; m = [float(x) for x in f[5:14]]
            except ValueError:
                continue
            ref = ' '.join(f[14:]).strip().lower()
            wpos = [pos[i] + apply(mat, t)[i] for i in range(3)]
            wmat = mmul(mat, m)
            wcol = colour if c == 16 else c
            if ref in blocks: walk(ref, wpos, wmat, wcol, depth + 1)
            else: out.append((ref.replace('.dat', ''), wcol, wpos, wmat))
    walk(root, [0, 0, 0], [1, 0, 0, 0, 1, 0, 0, 0, 1], 7)
    return out

def boxes(places):
    """placement → 8 world corners of its catalogue box."""
    out = []
    for pid, colour, pos, mat in places:
        r = resolve(pid)
        if not r: continue
        x0, y0, z0, x1, y1, z1 = PARTS[r]['b']
        pts = []
        for i in range(8):
            lx = x1 if i & 1 else x0; ly = y1 if i & 2 else y0; lz = z1 if i & 4 else z0
            w = apply(mat, [lx, ly, lz])
            pts.append((w[0] + pos[0], w[1] + pos[1], w[2] + pos[2]))
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]; zs = [p[2] for p in pts]
        out.append(dict(colour=colour, lo=(min(xs), min(ys), min(zs)), hi=(max(xs), max(ys), max(zs))))
    return out

COS30, SIN30 = math.cos(math.radians(30)), math.sin(math.radians(30))
def proj(x, y, z):
    """LDraw (x, y down, z) → screen. Isometric from the front-right-above."""
    return ((x - z) * COS30, (x + z) * SIN30 + y * 1.0)

def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c)

def render(places, w=900, h=620, title=None, bg=(250, 249, 246), ink=(26, 26, 26)):
    bs = boxes(places)
    im = Image.new('RGB', (w, h), bg)
    d = ImageDraw.Draw(im, 'RGBA')
    if not bs:
        d.text((16, 16), 'nothing to draw', fill=ink); return im
    pts = []
    for b in bs:
        for i in range(8):
            x = b['hi'][0] if i & 1 else b['lo'][0]; y = b['hi'][1] if i & 2 else b['lo'][1]; z = b['hi'][2] if i & 4 else b['lo'][2]
            pts.append(proj(x, y, z))
    minx = min(p[0] for p in pts); maxx = max(p[0] for p in pts)
    miny = min(p[1] for p in pts); maxy = max(p[1] for p in pts)
    pad = 26 + (22 if title else 0)
    scale = min((w - 2 * pad) / max(maxx - minx, 1), (h - 2 * pad - (18 if title else 0)) / max(maxy - miny, 1))
    ox = (w - (maxx - minx) * scale) / 2 - minx * scale
    oy = (h - (maxy - miny) * scale) / 2 - miny * scale + (10 if title else 0)
    S = lambda x, y, z: (proj(x, y, z)[0] * scale + ox, proj(x, y, z)[1] * scale + oy)
    # painter: far to near, bottom to top (LDraw y grows downward)
    bs.sort(key=lambda b: (b['lo'][0] + b['lo'][2], -b['hi'][1]))
    for b in bs:
        x0, y0, z0 = b['lo']; x1, y1, z1 = b['hi']
        c = COL.get(b['colour'], (170, 170, 170))
        top = [S(x0, y0, z0), S(x1, y0, z0), S(x1, y0, z1), S(x0, y0, z1)]
        left = [S(x0, y0, z1), S(x1, y0, z1), S(x1, y1, z1), S(x0, y1, z1)]
        right = [S(x1, y0, z0), S(x1, y0, z1), S(x1, y1, z1), S(x1, y1, z0)]
        edge = shade(c, 0.55) + (170,)
        d.polygon(left, fill=shade(c, 0.72), outline=edge)
        d.polygon(right, fill=shade(c, 0.86), outline=edge)
        d.polygon(top, fill=shade(c, 1.06), outline=edge)
    if title:
        try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
        except Exception: font = ImageFont.load_default()
        d.text((14, 10), title, fill=ink, font=font)
    return im

def main():
    a = sys.argv[1:]
    if a and a[0] == '--sheet':
        out = a[1]; items = a[2:]
        cols = 4 if len(items) > 4 else max(1, len(items))
        rows = (len(items) + cols - 1) // cols
        cw, ch = 620, 440
        sheet = Image.new('RGB', (cols * cw, rows * ch), (250, 249, 246))
        for i, spec in enumerate(items):
            path, _, label = spec.partition(':')
            im = render(parse(path), cw, ch, title=label or os.path.basename(path))
            sheet.paste(im, ((i % cols) * cw, (i // cols) * ch))
        sheet.save(out); print('sheet', out, sheet.size)
        return
    src, out = a[0], a[1]
    title = a[a.index('--title') + 1] if '--title' in a else None
    w, h = (900, 620)
    if '--size' in a: w, h = (int(x) for x in a[a.index('--size') + 1].split('x'))
    p = parse(src)
    im = render(p, w, h, title=title)
    im.save(out); print(out, len(p), 'placements', im.size)

if __name__ == '__main__':
    main()
