"""A keyframe report as a contact sheet: each still with its beat, its verdict and what failed.
python film-readymades/keyframe_sheet.py <report.json> <sheet.jpg>"""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
rep = json.load(open(sys.argv[1])); base = os.path.dirname(sys.argv[1])
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17); FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except OSError: F = FB = ImageFont.load_default()
W, H, cols = 640, 360, 2
import textwrap
keys = rep['keys']; rows = (len(keys) + cols - 1) // cols
sheet = Image.new('RGB', (W * cols, (H + 96) * rows), (16, 22, 20)); d = ImageDraw.Draw(sheet)
for i, k in enumerate(keys):
    x, y = (i % cols) * W, (i // cols) * (H + 96)
    im = Image.open(os.path.join(base, os.path.basename(k['file']))).convert('RGB').resize((W, H)); sheet.paste(im, (x, y))
    g = ImageDraw.Draw(sheet)
    for t in (1 / 3, 2 / 3): g.line([(x + W * t, y), (x + W * t, y + H)], fill=(90, 90, 90)); g.line([(x, y + H * t), (x + W, y + H * t)], fill=(90, 90, 90))
    col = (150, 230, 90) if k['pass'] else (240, 90, 80)
    d.text((x + 8, y + H + 4), f"{k['id']}  {'PASS' if k['pass'] else 'FAIL'}", fill=col, font=FB)
    d.text((x + 110, y + H + 6), k['beat'][:58], fill=(230, 230, 220), font=F)
    for j, f in enumerate(k['fails'][:3]): d.text((x + 8, y + H + 30 + j * 20), f[:70], fill=(240, 160, 150), font=F)
    if k['pass'] and k.get('text'):
        for j, line in enumerate(textwrap.wrap(k['text'], 72)[:3]): d.text((x + 8, y + H + 30 + j * 20), line, fill=(214, 196, 150), font=F)
sheet.save(sys.argv[2], quality=86); print(sys.argv[2])
