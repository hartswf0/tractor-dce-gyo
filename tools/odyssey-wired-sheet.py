"""Contact sheets for tools/odyssey-wired.js: each shot a cell (one frame, or the start and end of a moving shot side by side),
labelled with its number, kind, length, time and move. Usage: python3 tools/odyssey-wired-sheet.py sheets.json"""
import json, sys
from PIL import Image, ImageDraw, ImageFont

def font(size, bold=False):
    for f in (['DejaVuSans-Bold.ttf', 'DejaVuSans.ttf'] if bold else ['DejaVuSans.ttf']):
        for d in ('/usr/share/fonts/truetype/dejavu/', ''):
            try: return ImageFont.truetype(d + f, size)
            except OSError: pass
    return ImageFont.load_default()

for sh in json.load(open(sys.argv[1])):
    TH = 300                      # the frame height in the sheet
    cells = []
    for c in sh['cells']:
        ims = [Image.open(f).convert('RGB') for f in c['files']]
        ims = [im.resize((round(im.width * TH / im.height), TH)) for im in ims]
        w = sum(im.width for im in ims) + 4 * (len(ims) - 1)
        cell = Image.new('RGB', (w, TH + 44), (18, 22, 28)); x = 0
        for im in ims: cell.paste(im, (x, 0)); x += im.width + 4
        d = ImageDraw.Draw(cell); d.text((4, TH + 3), c['label'], fill=(240, 220, 150), font=font(15, True)); d.text((4, TH + 23), c['sub'], fill=(190, 200, 210), font=font(12))
        cells.append(cell)
    W = 1500; rows, row, rw = [], [], 0
    for c in cells:
        if row and rw + c.width > W: rows.append(row); row, rw = [], 0
        row.append(c); rw += c.width + 8
    if row: rows.append(row)
    H = 40 + sum(TH + 52 for _ in rows)
    out = Image.new('RGB', (W, H), (10, 12, 16)); d = ImageDraw.Draw(out); d.text((8, 10), sh['title'], fill=(255, 255, 255), font=font(17, True))
    y = 40
    for r in rows:
        x = 8
        for c in r: out.paste(c, (x, y)); x += c.width + 8
        y += TH + 52
    out.save(sh['out'], quality=82)
    print('  ', sh['out'], out.size)
