"""Embed (or refresh) the trailer runtime (odyssey-trailer.js, window.OdysseyTrailer) in the built player, beside the take runtime,
without the 3-minute rebuild. tools/export-trailer.js injects the working-tree file anyway, so this only matters for the player
as shipped. python patch_trailer.py [--level 6]"""
from pathlib import Path
import gzip, sys
R = Path(__file__).parent; f = R / 'production/Film-Butter-Odyssey.html.gz'
s = gzip.decompress(f.read_bytes()).decode()
js = (R / 'odyssey-trailer.js').read_text()
if '/*[odyssey-trailer]*/' in s:
    a, b = s.index('/*[odyssey-trailer]*/'), s.index('/*[/odyssey-trailer]*/')
    s = s[:a] + '/*[odyssey-trailer]*/' + js + s[b:]
else:
    b = s.index('/*[/odyssey-take]*/') + len('/*[/odyssey-take]*/')
    s = s[:b] + '\n/*[odyssey-trailer]*/' + js + '/*[/odyssey-trailer]*/' + s[b:]
lvl = int(sys.argv[sys.argv.index('--level') + 1]) if '--level' in sys.argv else 9
f.write_bytes(gzip.compress(s.encode(), lvl)); print('patched', f, round(f.stat().st_size / 1e6, 1), 'MB')
